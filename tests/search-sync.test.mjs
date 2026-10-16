import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../js/search-sync.js');
const base = () => ({type: 10, lives: 5, revealed: false, found: [], cards: [], text: '', kind: '', typing: ''});
test('spectator snapshots allow only revealed or discovered ranks', () => {
  assert.equal(S.validSnapshot(base()), true);
  const card = { rank: 0, id: 1, name: 'Synthetic' };
  assert.equal(S.validSnapshot({...base(), cards: [card]}), false);
  assert.equal(S.validSnapshot({...base(), found: [0], cards: [card]}), true);
  assert.equal(S.validSnapshot({...base(), found: [1], cards: [card]}), false);
  assert.equal(S.validSnapshot({...base(), revealed: true}), false);
});
test('invalid remote values and room codes are rejected', () => {
  for (const update of [{lives:-1},{lives:6},{type:18},{found:[1,1]},{found:[0],cards:[null]},{typing:'x'.repeat(61)},{kind:'unsafe'}]) {
    assert.equal(S.validSnapshot({...base(), ...update}), false);
  }
  assert.equal(S.validSnapshot(null), false);
  assert.equal(S.validCode('a'.repeat(24)), true);
  assert.equal(S.validCode('../room'), false);
});
