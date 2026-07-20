// POST /api/redeem/validate  {staffToken, code, action:'check'|'deliver'|'history'}
// Solo staff: consulta un código de canje, lo marca entregado, o ve el historial.
'use strict';
const L = require('../_lib');

module.exports = async (req, res) => {
  if (!L.guard(req, res, 'POST')) return;
  try {
    const b = req.body || {};
    const staff = L.verify(b.staffToken, 8 * 3600 * 1000);
    if (!staff || staff.role !== 'staff') return L.bad(res, 401, 'staff_no_autorizado');

    const action = b.action || 'check';

    if (action === 'history') {
      const [redeems, bonuses] = await L.pipeline([
        ['LRANGE', 'onex:redeemlog', '0', '49'],
        ['LRANGE', 'onex:bonuslog', '0', '49'],
      ]);
      const parse = a => (a || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
      // Estado actual de cada canje (el log guarda el estado al momento de crear)
      const rlist = parse(redeems);
      for (const r of rlist) {
        const raw = await L.redis('GET', `onex:redeem:${r.code}`);
        if (raw) r.status = JSON.parse(raw).status;
        if (r.status === 'pending' && Date.now() > r.exp) r.status = 'expired';
      }
      return L.ok(res, { redeems: rlist, bonuses: parse(bonuses) });
    }

    const code = String(b.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 8) return L.bad(res, 400, 'codigo_invalido');
    const raw = await L.redis('GET', `onex:redeem:${code}`);
    if (!raw) return L.bad(res, 404, 'codigo_no_existe');
    const r = JSON.parse(raw);

    let status = r.status;
    if (status === 'pending' && Date.now() > r.exp) status = 'expired';

    if (action === 'deliver') {
      if (status !== 'pending') return L.bad(res, 409, status === 'used' ? 'ya_entregado' : 'expirado');
      r.status = 'used'; r.deliveredAt = Date.now(); r.deliveredBy = staff.sid || 'staff';
      await L.pipeline([
        ['SET', `onex:redeem:${code}`, JSON.stringify(r), 'EX', '2592000'],
        ['DEL', `onex:pending:${r.playerId}`],
      ]);
      status = 'used';
    }

    return L.ok(res, {
      status,
      prize: r.prizeName, cost: r.cost,
      playerName: r.playerName, tel4: r.tel4,
      created: r.created, exp: r.exp, deliveredAt: r.deliveredAt || null,
    });
  } catch (e) {
    return L.bad(res, 500, 'error_interno');
  }
};
