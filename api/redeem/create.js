// POST /api/redeem/create  {playerId, prize}
// Verifica saldo + reglas de frecuencia EN EL SERVIDOR, descuenta de forma
// atómica (Lua) y emite un código de canje de 8 caracteres válido 15 minutos.
// Si expira sin usarse, los puntos se devuelven automáticamente (reconcile).
'use strict';
const L = require('../_lib');

// Descuento atómico: solo descuenta si el saldo alcanza (evita carreras)
const LUA_DEDUCT = `
local bal = tonumber(redis.call('GET', KEYS[1]) or '0')
local cost = tonumber(ARGV[1])
if bal < cost then return -1 end
return redis.call('DECRBY', KEYS[1], cost)`;

module.exports = async (req, res) => {
  if (!L.guard(req, res, 'POST')) return;
  try {
    const b = req.body || {};
    const playerId = String(b.playerId || '');
    const prizeId = String(b.prize || '');
    if (!/^p_[\w-]{8,20}$/.test(playerId)) return L.bad(res, 400, 'playerId_invalido');
    const prize = L.PRIZES[prizeId];
    if (!prize) return L.bad(res, 400, 'premio_invalido');
    const praw = await L.redis('GET', `onex:player:${playerId}`);
    if (!praw) return L.bad(res, 404, 'jugador_no_existe');
    const player = JSON.parse(praw);

    if (!(await L.rateLimit(`onex:rl:rdm:${playerId}`, 6, 300))) return L.bad(res, 429, 'demasiados_intentos');

    await L.reconcilePending(playerId);

    // Solo un canje pendiente a la vez
    if (await L.redis('GET', `onex:pending:${playerId}`)) return L.bad(res, 409, 'canje_pendiente');

    // ── Reglas de frecuencia (servidor) ──
    if (prize.freqDays) {
      // día gratis: 1 cada 14 días · semana gratis: 1 cada 90 días
      const fKey = `onex:freq:${playerId}:${prizeId}`;
      const set = await L.redis('SET', fKey, '1', 'NX', 'EX', String(prize.freqDays * 86400));
      if (set !== 'OK') return L.bad(res, 409, 'frecuencia_excedida');
      // Si el descuento falla más abajo, liberamos la marca
      var freqKeyToRollback = fKey;
    } else {
      // agua/score: máx 2 por semana (contando ambos juntos por tipo)
      const wKey = `onex:freq:${playerId}:${prizeId}:${L.weekCL()}`;
      const n = await L.redis('INCR', wKey);
      await L.redis('EXPIRE', wKey, '691200');
      if (n > 2) { await L.redis('DECR', wKey); return L.bad(res, 409, 'frecuencia_excedida'); }
      var weekKeyToRollback = wKey;
    }

    // ── Descuento atómico ──
    const newBal = await L.redis('EVAL', LUA_DEDUCT, '1', `onex:bal:${playerId}`, String(prize.cost));
    if (newBal === -1) {
      if (freqKeyToRollback) await L.redis('DEL', freqKeyToRollback);
      if (weekKeyToRollback) await L.redis('DECR', weekKeyToRollback);
      return L.bad(res, 402, 'saldo_insuficiente');
    }

    // ── Emitir código (15 min) ──
    const code = L.genCode(8);
    const exp = Date.now() + 15 * 60 * 1000;
    const record = {
      prize: prizeId, prizeName: prize.name, cost: prize.cost,
      playerId, playerName: player.name, tel4: player.tel4,
      status: 'pending', created: Date.now(), exp,
    };
    await L.pipeline([
      ['SET', `onex:redeem:${code}`, JSON.stringify(record), 'EX', '604800'], // registro 7 días
      ['SET', `onex:pending:${playerId}`, code, 'EX', '86400'],
      ['LPUSH', 'onex:redeemlog', JSON.stringify({ code, ...record })],
      ['LTRIM', 'onex:redeemlog', '0', '499'],
    ]);
    await L.pushHistory(playerId, { type: 'redeem', reason: prize.name, pts: -prize.cost, code });

    return L.ok(res, { code, prize: prize.name, cost: prize.cost, exp, balance: newBal });
  } catch (e) {
    return L.bad(res, 500, 'error_interno');
  }
};
