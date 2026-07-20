// POST /api/bonus/generate  {staffToken, kind:'agua'|'score'|'score2'}
// Solo staff: genera un código de un solo uso (6 chars) que expira en 24h.
// agua=+30 · score=+100 · score2=+100 y desbloquea skin "Dragón Dorado ONEX".
'use strict';
const L = require('../_lib');

module.exports = async (req, res) => {
  if (!L.guard(req, res, 'POST')) return;
  try {
    const b = req.body || {};
    const staff = L.verify(b.staffToken, 8 * 3600 * 1000);
    if (!staff || staff.role !== 'staff') return L.bad(res, 401, 'staff_no_autorizado');

    const kind = L.BONUS_KINDS[b.kind];
    if (!kind) return L.bad(res, 400, 'tipo_invalido');

    if (!(await L.rateLimit(`onex:rl:gen:${staff.sid || 'staff'}`, 30, 3600))) {
      return L.bad(res, 429, 'demasiados_codigos');
    }

    const code = L.genCode(6);
    const record = {
      kind: b.kind, pts: kind.pts, dragon: !!kind.dragon, label: kind.label,
      generatedBy: staff.sid || 'staff', generatedAt: Date.now(),
    };
    await L.pipeline([
      ['SET', `onex:bonus:${code}`, JSON.stringify(record), 'EX', '86400'], // 24 horas, un solo uso
      ['LPUSH', 'onex:bonuslog', JSON.stringify({ code, ...record, status: 'issued' })],
      ['LTRIM', 'onex:bonuslog', '0', '499'],
    ]);
    return L.ok(res, { code, pts: kind.pts, dragon: !!kind.dragon, label: kind.label, expiresInH: 24 });
  } catch (e) {
    return L.bad(res, 500, 'error_interno');
  }
};
