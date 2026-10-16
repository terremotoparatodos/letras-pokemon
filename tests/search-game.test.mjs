import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const G = require('../js/search-game.js');
const board = Array.from({ length: 10 }, (_, i) => ({ id: 2000 + i, name: `Prueba ${i}`, english: `Test ${i}` }));

test('cooperative guesses reveal a rank without mutating history or tracking scores', () => {
  const start = G.create();
  const result = G.guess(start, board, 'PRUÉBA 0');
  assert.equal(result.kind, 'correct');
  assert.equal(result.rank, 0);
  assert.equal('scores' in result.state, false);
  assert.equal('turn' in result.state, false);
  assert.deepEqual(start.found, []);
  const second = G.guess(result.state, board, 'Test 9');
  assert.deepEqual(second.state.found, [0, 9]);
});
test('misses cost one life; repeats and empty input keep state', () => {
  const miss = G.guess(G.create(), board, 'no existe');
  assert.equal(miss.kind, 'miss');
  assert.equal(miss.state.lives, 4);
  assert.deepEqual(miss.state.attempts, ['noexiste']);
  assert.deepEqual(miss.state.found, []);
  assert.equal(G.guess(miss.state, board, 'no-existe').state, miss.state);
  assert.equal(G.guess(miss.state, board, ' ').state, miss.state);
});
test('aliases cannot reveal the same rank twice', () => {
  const hit = G.guess(G.create(), board, 'Prueba 0');
  assert.equal(G.guess(hit.state, board, 'Test 0').kind, 'repeat');
  assert.equal(G.guess(hit.state, board, 'Test 0').state, hit.state);
});
test('completed and explicitly revealed rounds reject further guesses', () => {
  let s = G.create();
  for (let i = 0; i < 10; i++) s = G.guess(s, board, `Test ${i}`).state;
  assert.equal(s.found.length, 10);
  assert.equal(new Set(s.found).size, 10);
  assert.equal(G.guess(s, board, 'Test 0').kind, 'closed');
  assert.equal(G.guess({ ...G.create(), revealed: true }, board, 'Test 0').kind, 'closed');
});
test('rankings include both types, exclude missing data, and break ties consistently', () => {
  const pokemon = [[2, 'b', 'b', 1, [1, 2]], [1, 'a', 'a', 1, [1]], [3, 'c', 'c', 1, [1]]];
  const ranks = G.rankings(pokemon, [{ id: 2, score: 5 }, { id: 1, score: 5 }]);
  assert.deepEqual(ranks[0].map(p => p.id), [1, 2]);
  assert.deepEqual(ranks[1].map(p => p.id), [2]);
  assert.throws(() => G.rankings(pokemon, [{ id: 1, score: NaN }]));
});
test('snapshot has ten valid unique entries for every type and matching local sprites', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(new URL('../data/game-data.js', import.meta.url), 'utf8'), context);
  const data = JSON.parse(fs.readFileSync(new URL('../data/search-2026.json', import.meta.url), 'utf8'));
  vm.runInNewContext(fs.readFileSync(new URL('../data/search-2026.js', import.meta.url), 'utf8'), context);
  assert.equal(JSON.stringify(context.window.SEARCH_2026), JSON.stringify(data), 'Generated script and JSON must agree');
  assert.equal(data.meta.period, '2026-01/2026-07');
  assert.equal(data.scores.length, 1021);
  const ranks = G.rankings(context.window.LETRAS_DATA.pokemon, data.scores);
  assert.equal(ranks.length, 18);
  for (const rank of ranks) {
    assert.equal(rank.length, 10);
    assert.equal(new Set(rank.map(p => p.id)).size, 10);
    for (const p of rank) assert.equal(fs.existsSync(new URL(`../assets/sprites/${p.id}.png`, import.meta.url)), true, 'Missing ranking sprite (answer hidden)');
  }
});

test('five misses end the round without revealing answers; lives are independent by type', () => {
  let s = G.create();
  for (const word of ['fallo uno', 'fallo dos', 'fallo tres', 'fallo cuatro', 'fallo cinco']) s = G.guess(s, board, word).state;
  assert.equal(s.lives, 0);
  assert.equal(s.revealed, false);
  assert.deepEqual(s.found, []);
  assert.equal(G.guess(s, board, 'Test 0').kind, 'closed');
  assert.equal(G.create(1).lives, 5);
  const before = G.create();
  const hit = G.guess(before, board, 'Test 0');
  assert.equal(hit.state.lives, 5);
  assert.equal(before.lives, 5);
});
