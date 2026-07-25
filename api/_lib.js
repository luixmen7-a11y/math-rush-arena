// ════════════════════════════════════════════════════════════
// ONEX Points — helpers compartidos (Upstash REST, sin deps)
// La seguridad NO depende de que este código sea secreto:
// todos los secretos viven en variables de entorno.
// ════════════════════════════════════════════════════════════
'use strict';
const crypto = require('crypto');

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const SECRET = process.env.SESSION_SECRET || '';

function configured() { return !!(REDIS_URL && REDIS_TOKEN && SECRET); }

// ── Redis por REST (un comando) ──
async function redis(...cmd) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error('redis: ' + j.error);
  return j.result;
}
// ── Pipeline (varios comandos, un round-trip) ──
async function pipeline(cmds) {
  const r = await fetch(REDIS_URL.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  const j = await r.json();
  if (!Array.isArray(j)) throw new Error('redis pipeline: ' + JSON.stringify(j));
  return j.map(x => x.result);
}

// ── Tokens firmados HMAC-SHA256 (payload.firma, base64url) ──
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return body + '.' + sig;
}
function verify(token, maxAgeMs) {
  try {
    const [body, sig] = String(token || '').split('.');
    if (!body || !sig) return null;
    const good = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
    const a = Buffer.from(sig), b = Buffer.from(good);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (maxAgeMs && (Date.now() - (payload.iat || 0)) > maxAgeMs) return null;
    return payload;
  } catch (e) { return null; }
}

// ── Fecha/semana en horario de Chile (el tope diario resetea a medianoche de Chile) ──
function todayCL() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());
}
function yesterdayCL() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date(Date.now() - 864e5));
}
function weekCL() { // clave de semana ISO-aproximada (lunes) para límites semanales
  const d = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date()) + 'T12:00:00Z');
  const day = (d.getUTCDay() + 6) % 7; // 0 = lunes
  d.setUTCDate(d.getUTCDate() - day);
  return 'w' + d.toISOString().slice(0, 10);
}

// ── Generador de códigos (sin caracteres ambiguos 0/O/1/I) ──
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode(len) {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return s;
}
function genId() { return 'p_' + crypto.randomBytes(9).toString('base64url'); }

// ── Rate limit atómico de VENTANA FIJA ──
// El TTL se fija SOLO al crear la clave: así la ventana no se renueva con
// cada intento. Si se renovara, quien reintenta (incluido el staff que se
// equivoca) quedaría bloqueado indefinidamente en lugar de esperar la ventana.
const LUA_RATE = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return c`;
async function rateLimit(key, max, windowSec) {
  const count = await redis('EVAL', LUA_RATE, '1', key, String(windowSec));
  return count <= max;
}

// ── Request/response helpers ──
function ip(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
}
function bad(res, code, error) { return res.status(code).json({ ok: false, error }); }
function ok(res, data) { return res.status(200).json({ ok: true, ...data }); }
function guard(req, res, method) {
  if (!configured()) { bad(res, 503, 'servicio_no_configurado'); return false; }
  if (req.method !== method) { bad(res, 405, 'metodo_invalido'); return false; }
  return true;
}

// ── Historial del jugador (últimas 100 transacciones) ──
async function pushHistory(playerId, entry) {
  const item = JSON.stringify({ ...entry, ts: Date.now() });
  await pipeline([
    ['LPUSH', `onex:hist:${playerId}`, item],
    ['LTRIM', `onex:hist:${playerId}`, '0', '99'],
  ]);
}

// ── Acreditar puntos SUJETOS al tope diario de 60. Devuelve lo realmente acreditado. ──
const DAILY_CAP = 60;
async function awardCapped(playerId, pts, reason) {
  const dayKey = `onex:daily:${playerId}:${todayCL()}`;
  const current = parseInt(await redis('GET', dayKey) || '0', 10);
  if (current >= DAILY_CAP) return 0;
  const grant = Math.min(pts, DAILY_CAP - current);
  await pipeline([
    ['INCRBY', dayKey, String(grant)],
    ['EXPIRE', dayKey, '172800'],
    ['INCRBY', `onex:bal:${playerId}`, String(grant)],
  ]);
  await pushHistory(playerId, { type: 'earn', reason, pts: grant });
  return grant;
}
// ── Acreditar puntos FUERA del tope (bonus por compra, racha) ──
async function awardUncapped(playerId, pts, reason) {
  await redis('INCRBY', `onex:bal:${playerId}`, String(pts));
  await pushHistory(playerId, { type: 'earn', reason, pts });
  return pts;
}

// ── Racha: registrar actividad de hoy; al llegar a 3 días seguidos +10 (y reinicia) ──
async function touchStreak(playerId) {
  const today = todayCL(), yest = yesterdayCL();
  const key = `onex:streak:${playerId}`;
  const raw = await redis('GET', key);
  let st = raw ? JSON.parse(raw) : { last: null, run: 0 };
  if (st.last === today) return { run: st.run, awarded: 0 };
  st.run = (st.last === yest) ? st.run + 1 : 1;
  st.last = today;
  let awarded = 0;
  if (st.run >= 3) { awarded = 10; st.run = 0; }
  await redis('SET', key, JSON.stringify(st), 'EX', '2592000');
  if (awarded) await awardUncapped(playerId, awarded, 'racha_3_dias');
  return { run: st.run, awarded };
}

// ── Reconciliar canje pendiente vencido: devolver puntos automáticamente ──
async function reconcilePending(playerId) {
  const pKey = `onex:pending:${playerId}`;
  const code = await redis('GET', pKey);
  if (!code) return;
  const raw = await redis('GET', `onex:redeem:${code}`);
  if (!raw) { await redis('DEL', pKey); return; }
  const r = JSON.parse(raw);
  if (r.status === 'pending' && Date.now() > r.exp) {
    r.status = 'refunded';
    await pipeline([
      ['SET', `onex:redeem:${code}`, JSON.stringify(r), 'EX', '604800'],
      ['DEL', pKey],
      ['INCRBY', `onex:bal:${playerId}`, String(r.cost)],
    ]);
    await pushHistory(playerId, { type: 'refund', reason: 'canje_expirado', pts: r.cost, code });
  } else if (r.status !== 'pending') {
    await redis('DEL', pKey);
  }
}

const PRIZES = {
  agua:   { name: 'Agua Cielo 625ml',        cost: 150,  freqKey: 'small', },
  score:  { name: 'Score',                    cost: 350,  freqKey: 'small', },
  dia:    { name: 'Día gratis de gimnasio',   cost: 500,  freqDays: 14 },
  semana: { name: 'Semana gratis de gimnasio', cost: 2000, freqDays: 90 },
};
const BONUS_KINDS = {
  agua:   { pts: 30,  label: 'Compra de Agua' },
  score:  { pts: 100, label: 'Compra de Score' },
  score2: { pts: 100, label: 'Compra de 2 Scores', dragon: true },
};

module.exports = {
  configured, redis, pipeline, sign, verify, todayCL, weekCL, genCode, genId,
  rateLimit, ip, bad, ok, guard, pushHistory, awardCapped, awardUncapped,
  touchStreak, reconcilePending, DAILY_CAP, PRIZES, BONUS_KINDS,
};
