// POST /api/staff/auth  {pin, staffName?}
// PIN desde variable de entorno STAFF_PIN (nunca en el código).
// Rate limit duro por IP contra fuerza bruta. Token de staff válido 8 horas.
'use strict';
const crypto = require('crypto');
const L = require('../_lib');

module.exports = async (req, res) => {
  if (!L.guard(req, res, 'POST')) return;
  try {
    const PIN = process.env.STAFF_PIN;
    if (!PIN) return L.bad(res, 503, 'staff_pin_no_configurado');

    // Máx 5 intentos por IP cada 15 minutos
    if (!(await L.rateLimit(`onex:rl:pin:${L.ip(req)}`, 5, 900))) {
      return L.bad(res, 429, 'demasiados_intentos_espera_15min');
    }

    const pin = String((req.body || {}).pin || '');
    const a = Buffer.from(pin), c = Buffer.from(PIN);
    const okPin = a.length === c.length && crypto.timingSafeEqual(a, c);
    if (!okPin) return L.bad(res, 401, 'pin_incorrecto');

    const sid = String((req.body || {}).staffName || 'staff').trim().slice(0, 20) || 'staff';
    const staffToken = L.sign({ role: 'staff', sid, iat: Date.now() });
    return L.ok(res, { staffToken, expiresInH: 8 });
  } catch (e) {
    return L.bad(res, 500, 'error_interno');
  }
};
