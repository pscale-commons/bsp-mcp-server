/**
 * Smoke test for the pool-engage primitive's pure helpers.
 *
 * The handler (handlePoolEngage) reaches the federated beach over HTTP and is
 * exercised by RPG validation in a follow-on session. This smoke covers the
 * deterministic logic — digit-path enumeration, slot reading, next-free-slot,
 * envelope assembly, synthesis_hint fallback chain — without network.
 */
import {
  digitPathSlots,
  readSlot,
  findNextSlot,
  collectContributions,
  extractSynthesisHint,
  DEFAULT_SYNTHESIS_HINT,
} from '../src/tools/pool.js';
import type { Block } from '../src/bsp.js';

let pass = 0;
let fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

console.log('=== digitPathSlots — first 12 slots ===');
const first12 = [...(function* () {
  let i = 0;
  for (const s of digitPathSlots()) {
    yield s;
    if (++i >= 12) break;
  }
})()];
console.log('  ', first12.join(', '));
assert(first12[0] === '1', 'starts at 1');
assert(first12[8] === '9', 'reaches 9 at index 8');
assert(first12[9] === '11', 'jumps to 11 (skips 10)');
assert(first12[10] === '12', 'continues 12');
assert(!first12.some(s => s.includes('0')), 'no zeros in any slot');

console.log('\n=== readSlot — walks digit-path slot paths ===');
const sample: Block = {
  _: 'pool',
  '1': { _: 'first', '1': 'alice', '3': '2026-05-26T10:00:00Z' },
  '2': { _: 'second', '1': 'bob' },
};
assert(readSlot(sample, '1') !== null, 'slot "1" walks to slot-1 object');
assert((readSlot(sample, '1') as any)._ === 'first', 'slot "1" underscore = first');
assert(readSlot(sample, '11') === 'alice', 'slot "11" walks block.1.1 (alice — tag-field collision)');
assert(readSlot(sample, '13') === '2026-05-26T10:00:00Z', 'slot "13" walks block.1.3 (timestamp)');
assert(readSlot(sample, '3') === null, 'slot "3" missing');
assert(readSlot(null, '1') === null, 'null block → null');

console.log('\n=== findNextSlot — empty block returns "1" ===');
assert(findNextSlot({} as Block) === '1', 'empty → slot 1');
assert(findNextSlot(null as any) === '1', 'null → slot 1');

console.log('\n=== findNextSlot — finds next after largest claim ===');
const oneClaim: Block = { '1': { _: 'a', '1': 'alice' } };
assert(findNextSlot(oneClaim) === '2', 'after slot 1 → slot 2');

const threeClaims: Block = {
  '1': { _: 'a', '1': 'alice' },
  '2': { _: 'b', '1': 'bob' },
  '3': { _: 'c', '1': 'carol' },
};
assert(findNextSlot(threeClaims) === '4', 'after 1,2,3 → slot 4');

console.log('\n=== findNextSlot — depth-2 collision discipline ===');
// Slot 1 has 1: agent_id at depth-2 — that string at block.1.1 must NOT count
// as a claim for slot "11" (tag-field collision per block-conventions:9.3).
const collisionCase: Block = {
  '1': { _: 'a', '1': 'alice', '3': '2026-05-26T10:00:00Z' },
};
assert(findNextSlot(collisionCase) === '2', 'depth-2 strings ignored — next after slot 1 is slot 2, not 12');

console.log('\n=== collectContributions — slice + shape ===');
const pool: Block = {
  _: 'Test pool',
  '1': { _: 'first voice', '1': 'alice', '3': '2026-05-26T10:00:00Z', '4': 'character' },
  '2': { _: 'second voice', '1': 'bob', '3': '2026-05-26T10:05:00Z' },
  '3': { _: 'third voice', '1': 'carol', '3': '2026-05-26T10:10:00Z' },
};
const all = collectContributions(pool, 0);
assert(all.contributions.length === 3, 'since 0 returns all 3');
assert(all.contributions[0].position === 1, 'first position = 1');
assert(all.contributions[0].text === 'first voice', 'first text');
assert(all.contributions[0].agent_id === 'alice', 'first contributor');
assert(all.contributions[0].face === 'character', 'first face tag');
assert(all.contributions[1].face === null, 'second has no face');
assert(all.more_available === false, 'no pagination needed');

const since1 = collectContributions(pool, 1);
assert(since1.contributions.length === 2, 'since 1 returns 2,3 (count 2)');
assert(since1.contributions[0].position === 2, 'since 1 starts at 2');

const since3 = collectContributions(pool, 3);
assert(since3.contributions.length === 0, 'since 3 returns nothing');

console.log('\n=== collectContributions — skips empty-underscore tombstones at depth 1 ===');
const withTombstone: Block = {
  '1': { _: '' },
  '2': { _: 'real', '1': 'alice' },
};
const noTomb = collectContributions(withTombstone, 0);
assert(noTomb.contributions.length === 1, 'tombstone at slot 1 skipped');
assert(noTomb.contributions[0].position === 2, 'only real contribution at slot 2 returned');

console.log('\n=== extractSynthesisHint — underscore source (9.1 retired: it is an entry slot) ===');
// The hint is the pool's underscore — never a digit position. 9.1 would be claimed
// and overwritten by the ninth contribution once the pool supernests.
const purposed: Block = { _: 'A pool for visitors to introduce themselves.' };
const p = extractSynthesisHint(purposed);
assert(p.source === 'purpose', 'underscore present → source = purpose');
assert(p.hint === 'A pool for visitors to introduce themselves.', 'hint = the underscore');

// A 9.1 is now IGNORED — it is a contribution slot, not metadata.
const with91: Block = { _: 'the purpose', '9': { '1': 'this used to be the hint' } };
const w = extractSynthesisHint(with91);
assert(w.source === 'purpose' && w.hint === 'the purpose', '9.1 ignored; underscore wins');

// No underscore → the crafted default.
const empty: Block = {};
const d = extractSynthesisHint(empty);
assert(d.source === 'default', 'no underscore → default');
assert(d.hint === DEFAULT_SYNTHESIS_HINT, 'hint = default constant');

// Blank underscore → default.
const emptyU: Block = { _: '   ' };
const eu = extractSynthesisHint(emptyU);
assert(eu.source === 'default', 'blank underscore → default');

console.log('\n=== summary ===');
console.log(`  pass: ${pass}`);
console.log(`  fail: ${fail}`);
if (fail > 0) process.exit(1);
