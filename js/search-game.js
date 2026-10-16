(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SearchGame = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const normalize = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

  function rankings(pokemon, scores) {
    const byId = new Map(scores.map(p => [p.id, p.score]));
    if (scores.some(p => !Number.isFinite(p.score) || p.score < 0) || byId.size !== scores.length) throw Error('Datos de búsqueda inválidos.');
    return Array.from({ length: 18 }, (_, i) => pokemon
      .filter(p => p[4].includes(i + 1) && byId.has(p[0]))
      .sort((a, b) => byId.get(b[0]) - byId.get(a[0]) || a[0] - b[0])
      .slice(0, 10).map(p => ({ id: p[0], name: p[1], english: p[2] })));
  }
  function create(type = 0) {
    return { type, found: [], attempts: [], lives: 3, revealed: false };
  }
  function guess(state, board, input) {
    if (state.revealed || state.found.length === 10 || state.lives === 0) return { kind: 'closed', state };
    const key = normalize(input);
    if (!key) return { kind: 'empty', state };
    if (state.attempts.includes(key)) return { kind: 'repeat', state };
    const rank = board.findIndex(p => normalize(p.name) === key || normalize(p.english) === key ||
      (p.id === 29 && ['nidoranf', 'nidoranhembra'].includes(key)) ||
      (p.id === 32 && ['nidoranm', 'nidoranmacho'].includes(key)));
    if (rank >= 0 && state.found.includes(rank)) return { kind: 'repeat', state };
    const next = { ...state, found: [...state.found], attempts: [...state.attempts, key] };
    if (rank < 0) {
      next.lives--;
      return { kind: 'miss', state: next };
    }
    next.found.push(rank);
    return { kind: next.found.length === 10 ? 'perfect' : 'correct', state: next, rank };
  }
  return { normalize, rankings, create, guess };
});
