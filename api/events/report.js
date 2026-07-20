// POST /api/events/report
// El cliente reporta EVENTOS ("respondí bien", "gané", "combo x5").
// EL SERVIDOR calcula los puntos: correct=2, win=10, combo5=5. Tope diario 60.
// Defensas: token firmado, rate limit, coherencia temporal, límites por sesión.
'use strict';
const L = require('../_lib');

const PTS = { correct: 2, win: 10, combo5: 5 };
const MIN_ANSWER_GAP_MS = 6000;   // los timers del juego son 7–20s: nadie contesta 2 preguntas en <6s
const MIN_WIN_AGE_MS = 90000;     // una partida real jamás termina en <90s
const MAX_CORRECTS_PER_SESSION = 60;

module.exports = async (req, res) => {
  if (!L.guard(req, res, 'POST')) return;
  try {
    const b = req.body || {};
    const type = b.type;
    if (!PTS[type]) return L.bad(res, 400, 'evento_invalido');

    const tk = L.verify(b.token, 40 * 60 * 1000);
    if (!tk || !tk.g || !tk.p) return L.bad(res, 401, 'token_invalido');

    // Rate limit: máx 12 eventos por minuto por jugador
    if (!(await L.rateLimit(`onex:rl:evt:${tk.p}`, 12, 90))) {
      return L.bad(res, 429, 'demasiados_eventos');
    }

    const sKey = `onex:sess:${tk.g}`;
    const raw = await L.redis('GET', sKey);
    if (!raw) return L.bad(res, 401, 'sesion_expirada');
    const s = JSON.parse(raw);
    if (s.p !== tk.p) return L.bad(res, 401, 'token_invalido');

    const now = Date.now();
    // ── Coherencia temporal y de sesión ──
    if (type === 'correct') {
      if (now - s.lastCorrect < MIN_ANSWER_GAP_MS) return L.bad(res, 422, 'ritmo_imposible');
      if (s.corrects >= MAX_CORRECTS_PER_SESSION) return L.bad(res, 422, 'limite_sesion');
      s.corrects++; s.lastCorrect = now;
    } else if (type === 'combo5') {
      // Cada combo x5 exige al menos 5 respuestas correctas nuevas en la sesión
      if (s.corrects < (s.combos + 1) * 5) return L.bad(res, 422, 'combo_incoherente');
      s.combos++;
    } else if (type === 'win') {
      if (s.win) return L.bad(res, 422, 'victoria_duplicada');
      if (now - s.start < MIN_WIN_AGE_MS) return L.bad(res, 422, 'partida_demasiado_corta');
      s.win = true;
    }
    await L.redis('SET', sKey, JSON.stringify(s), 'EX', '2400');

    // ── Acreditar (el servidor decide el monto, sujeto al tope diario) ──
    const granted = await L.awardCapped(tk.p, PTS[type], type);
    const streak = await L.touchStreak(tk.p);

    const [bal, daily] = await L.pipeline([
      ['GET', `onex:bal:${tk.p}`],
      ['GET', `onex:daily:${tk.p}:${L.todayCL()}`],
    ]);
    return L.ok(res, {
      granted,
      capReached: granted < PTS[type],
      balance: parseInt(bal || '0', 10),
      today: parseInt(daily || '0', 10),
      cap: L.DAILY_CAP,
      streakBonus: streak.awarded,
    });
  } catch (e) {
    return L.bad(res, 500, 'error_interno');
  }
};
