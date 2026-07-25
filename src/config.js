// ════════════════════════════════════════════════════════════════
//  MATH RUSH ARENA — CONFIGURACIÓN CENTRAL
//  Único lugar donde se ajustan economía, intentos, categorías y
//  duración. El servidor (api/) tiene su propia copia autoritativa
//  de la economía ONEX: este archivo NO decide puntos reales.
// ════════════════════════════════════════════════════════════════
'use strict';
window.MRA = window.MRA || {};

// ── Intentos (modo solitario) ──
window.MRA.ATTEMPTS = {
  max: 3,            // máximo permitido (nunca se supera)
  start: 3,          // con cuántos empieza
  regainOnStar: 1,   // cuántos recupera una casilla especial
};

// ── Categorías del desafío ──
// IMPORTANTE: derivadas del banco REAL de preguntas. Cada entrada declara
// `match` (regex sobre el enunciado). Las categorías con pocas preguntas se
// agrupan; no se ofrecen categorías vacías. `minPool` = mínimo para habilitar.
window.MRA.CATEGORIES = [
  { id: 'mixto', name: 'Mixto', desc: 'Todo tipo de preguntas', match: null },
  { id: 'operaciones', name: 'Operaciones', desc: 'Sumar, restar, multiplicar y dividir',
    match: /^(?!.*(√|log|!|[⁰¹²³⁴⁵⁶⁷⁸⁹]|ángulo|triángulo|pentágono|π|%)).*(\+|−|×|÷|\bes\b)/ },
  { id: 'potencias', name: 'Potencias y raíces', desc: 'Exponentes, raíces y logaritmos',
    match: /√|³√|log|[⁰¹²³⁴⁵⁶⁷⁸⁹]|\d!/ },
  { id: 'algebra', name: 'Álgebra y %', desc: 'Ecuaciones, porcentajes y geometría',
    match: /x\s*[−+*/=]|¿x\s*=|%|ángulo|triángulo|pentágono|cuadrado|π/i },
];
window.MRA.MIN_POOL = 6; // si una categoría no alcanza esto, se deshabilita

// ── Dificultades ──
window.MRA.DIFFICULTIES = [
  { id: 'easy',   name: 'Fácil',      desc: 'Operaciones y raíces', bank: 'EQ', timer: 24, mult: 1.0 },
  { id: 'medium', name: 'Intermedio', desc: 'Mezcla equilibrada',   bank: 'MIX', timer: 20, mult: 1.5 },
  { id: 'hard',   name: 'Difícil',    desc: 'Álgebra y potencias',  bank: 'HQ', timer: 16, mult: 2.0 },
];

// ── Duración de partida (casillas objetivo en solitario) ──
window.MRA.DURATIONS = [
  { id: 'quick',  name: 'Rápida',   desc: '~5 min',  goalIdx: 15, minutes: 5 },
  { id: 'normal', name: 'Normal',   desc: '~10 min', goalIdx: 30, minutes: 10 },
  { id: 'full',   name: 'Completa', desc: '~15 min', goalIdx: 46, minutes: 15 },
];

// ── Economía ONEX (referencia para la UI: el servidor es la autoridad) ──
// Estos valores deben coincidir con api/events/report.js y api/_lib.js.
window.MRA.ONEX_ECONOMY = {
  perCorrect: 2,        // puntos por respuesta correcta
  perWin: 10,           // bonificación al completar la partida
  perCombo5: 5,         // bonificación por racha de 5
  dailyCap: 60,         // límite diario por jugador
  streakBonus: 10,      // 3 días consecutivos
  difficultyMult: { easy: 1, medium: 1, hard: 1 }, // el servidor no multiplica aún
  note: 'El servidor recalcula todo: estos valores son solo informativos para la UI.',
};

// ── Puntuación interna de partida (no es ONEX) ──
window.MRA.SCORE = {
  correct: 10,
  correctFast: 15,
  comboBonus: [0, 0, 1, 2, 4, 6, 10],
  bonusSquare: 15,
  mysteryPoints: 10,
};

// ── Duración de animaciones (ms) — respeta prefers-reduced-motion vía CSS ──
window.MRA.ANIM = {
  short: 180,
  base: 260,
  long: 380,
  pawnStep: 180,   // desplazamiento de ficha (puede exceder 400ms por diseño)
};
