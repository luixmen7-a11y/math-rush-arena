// POST /api/session/start
// Registra/identifica al jugador y emite un token de sesión firmado.
// El cliente jamás decide puntos: solo obtiene un token para reportar eventos.
'use strict';
const L = require('../_lib');

module.exports = async (req, res) => {
  if (!L.guard(req, res, 'POST')) return;
  try {
    const b = req.body || {};
    let playerId = typeof b.playerId === 'string' && /^p_[\w-]{8,20}$/.test(b.playerId) ? b.playerId : null;

    // Rate limit por IP: máx 20 sesiones por hora
    if (!(await L.rateLimit(`onex:rl:sess:${L.ip(req)}`, 20, 3600))) {
      return L.bad(res, 429, 'demasiadas_sesiones');
    }

    if (playerId) {
      const exists = await L.redis('EXISTS', `onex:player:${playerId}`);
      if (!exists) playerId = null;
    }

    if (!playerId) {
      // Registro mínimo: nombre + teléfono (guardamos solo los últimos 4 para verificación verbal)
      const name = String(b.name || '').trim().slice(0, 40);
      const phone = String(b.phone || '').replace(/\D/g, '');
      if (name.length < 2 || phone.length < 8) return L.bad(res, 400, 'faltan_datos');
      playerId = L.genId();
      await L.redis('SET', `onex:player:${playerId}`, JSON.stringify({
        name, tel4: phone.slice(-4), created: Date.now(),
      }));
    }

    // Sesión de juego: 40 minutos máximo
    const gameId = L.genCode(10);
    const session = { p: playerId, start: Date.now(), lastCorrect: 0, corrects: 0, combos: 0, win: false };
    await L.redis('SET', `onex:sess:${gameId}`, JSON.stringify(session), 'EX', '2400');

    const token = L.sign({ p: playerId, g: gameId, iat: Date.now() });
    const player = JSON.parse(await L.redis('GET', `onex:player:${playerId}`));
    return L.ok(res, { playerId, token, name: player.name });
  } catch (e) {
    return L.bad(res, 500, 'error_interno');
  }
};
