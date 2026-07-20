// POST /api/bonus/claim  {playerId, code}
// Canje de código de bonus: UN SOLO USO garantizado con GETDEL atómico.
// Los bonus por compra NO cuentan para el tope diario (son compras reales).
'use strict';
const L = require('../_lib');

module.exports = async (req, res) => {
  if (!L.guard(req, res, 'POST')) return;
  try {
    const b = req.body || {};
    const playerId = String(b.playerId || '');
    if (!/^p_[\w-]{8,20}$/.test(playerId)) return L.bad(res, 400, 'playerId_invalido');
    if (!(await L.redis('EXISTS', `onex:player:${playerId}`))) return L.bad(res, 404, 'jugador_no_existe');

    // Rate limit: 8 intentos de código por 10 min (frena fuerza bruta de códigos)
    if (!(await L.rateLimit(`onex:rl:claim:${playerId}`, 8, 600))) return L.bad(res, 429, 'demasiados_intentos');
    if (!(await L.rateLimit(`onex:rl:claimip:${L.ip(req)}`, 15, 600))) return L.bad(res, 429, 'demasiados_intentos');

    const code = String(b.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 6) return L.bad(res, 400, 'codigo_invalido');

    // GETDEL: si dos requests llegan a la vez, solo una obtiene el valor
    const raw = await L.redis('GETDEL', `onex:bonus:${code}`);
    if (!raw) return L.bad(res, 404, 'codigo_invalido_o_usado');
    const bonus = JSON.parse(raw);

    await L.awardUncapped(playerId, bonus.pts, 'bonus_' + bonus.kind);
    if (bonus.dragon) await L.redis('SET', `onex:dragon:${playerId}`, '1');

    // Registro de quién lo canjeó
    await L.pipeline([
      ['LPUSH', 'onex:bonuslog', JSON.stringify({ code, ...bonus, status: 'claimed', claimedBy: playerId, claimedAt: Date.now() })],
      ['LTRIM', 'onex:bonuslog', '0', '499'],
    ]);

    const bal = await L.redis('GET', `onex:bal:${playerId}`);
    return L.ok(res, { pts: bonus.pts, dragon: !!bonus.dragon, label: bonus.label, balance: parseInt(bal || '0', 10) });
  } catch (e) {
    return L.bad(res, 500, 'error_interno');
  }
};
