// GET /api/points/balance?playerId=p_xxx
// Saldo REAL desde el servidor + progreso diario + racha + skin Dragón Dorado.
// También reconcilia canjes vencidos (devuelve los puntos automáticamente).
'use strict';
const L = require('../_lib');

module.exports = async (req, res) => {
  if (!L.guard(req, res, 'GET')) return;
  try {
    const playerId = String(req.query.playerId || '');
    if (!/^p_[\w-]{8,20}$/.test(playerId)) return L.bad(res, 400, 'playerId_invalido');
    const praw = await L.redis('GET', `onex:player:${playerId}`);
    if (!praw) return L.bad(res, 404, 'jugador_no_existe');
    const player = JSON.parse(praw);

    await L.reconcilePending(playerId);

    const [bal, daily, dragon, streakRaw, pending, histRaw] = await L.pipeline([
      ['GET', `onex:bal:${playerId}`],
      ['GET', `onex:daily:${playerId}:${L.todayCL()}`],
      ['GET', `onex:dragon:${playerId}`],
      ['GET', `onex:streak:${playerId}`],
      ['GET', `onex:pending:${playerId}`],
      ['LRANGE', `onex:hist:${playerId}`, '0', '19'],
    ]);
    const streak = streakRaw ? JSON.parse(streakRaw) : { run: 0 };

    let pendingInfo = null;
    if (pending) {
      const rraw = await L.redis('GET', `onex:redeem:${pending}`);
      if (rraw) {
        const r = JSON.parse(rraw);
        if (r.status === 'pending') pendingInfo = { code: pending, prize: r.prizeName, exp: r.exp };
      }
    }

    return L.ok(res, {
      name: player.name,
      balance: parseInt(bal || '0', 10),
      today: parseInt(daily || '0', 10),
      cap: L.DAILY_CAP,
      streakDays: streak.run || 0,
      dragonUnlocked: dragon === '1',
      pendingRedeem: pendingInfo,
      history: (histRaw || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean),
      prizes: Object.entries(L.PRIZES).map(([id, p]) => ({ id, name: p.name, cost: p.cost })),
    });
  } catch (e) {
    return L.bad(res, 500, 'error_interno');
  }
};
