/**
 * Smoke for accumulator.ts — append-with-supernest on the positional ladder.
 * Proves: 1-9 fill at floor 1; the 10th supernests (floor 2), the original nine
 * stay intact and addressable as 01-09, and the 10th is a fresh 11 — no collision.
 */
import { appendWithSupernest, supernest, zeroFreeOfLength } from '../src/accumulator.js';
import { floorDepth, readAt } from '../src/bsp.js';
import type { Block } from '../src/bsp.js';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}
const entry = (n: number) => ({ _: `contribution ${n}`, '1': `agent-${n}`, '3': `ts-${n}` });

console.log('=== zeroFreeOfLength ===');
assert([...zeroFreeOfLength(1)].join(',') === '1,2,3,4,5,6,7,8,9', 'len 1 → 1..9');
assert([...zeroFreeOfLength(2)].slice(0, 3).join(',') === '11,12,13', 'len 2 starts 11,12,13');
assert(![...zeroFreeOfLength(2)].some(a => a.includes('0')), 'len 2 has no zero digit');
assert([...zeroFreeOfLength(2)].length === 81, 'len 2 → 81 slots');

console.log('\n=== supernest (the wrap) ===');
const wrapped = supernest({ _: 'p', '1': 'a' } as Block);
assert((wrapped as any)._._ === 'p' && (wrapped as any)._['1'] === 'a', 'wrap = {_: old}');
assert(floorDepth(wrapped) === 2, 'floor grows 1 → 2 on wrap');

console.log('\n=== append 1-9 stay at floor 1 ===');
let pool: Block = { _: 'pool purpose' };
for (let n = 1; n <= 9; n++) {
  const r = appendWithSupernest(pool, entry(n));
  pool = r.block;
  if (n === 1) assert(r.address === '1' && !r.grew, '1st → slot 1, no growth');
  if (n === 9) assert(r.address === '9' && !r.grew, '9th → slot 9, no growth');
}
assert(floorDepth(pool) === 1, 'floor still 1 after nine entries');
assert((readAt(pool, '5') as any)._ === 'contribution 5', 'entry 5 readable at "5"');

console.log('\n=== the 10th SUPERNESTS ===');
const r10 = appendWithSupernest(pool, entry(10));
pool = r10.block;
assert(r10.grew === true, '10th triggers supernest (grew)');
assert(r10.address === '11', '10th lands at 11, not inside contribution 1');
assert(floorDepth(pool) === 2, 'floor is now 2');
// The original nine are intact and absorb: "1" still resolves (→ "01" → [0,1]).
assert((readAt(pool, '1') as any)._ === 'contribution 1', 'contribution 1 intact, still readable at "1"');
assert((readAt(pool, '1') as any)['1'] === 'agent-1', 'contribution 1 agent-1 intact (NOT overwritten)');
assert((readAt(pool, '01') as any)._ === 'contribution 1', 'and explicitly at "01" = [0,1]');
assert((readAt(pool, '9') as any)._ === 'contribution 9', 'contribution 9 intact at "9"');
// The 10th is a clean fresh entry at 11.
assert((readAt(pool, '11') as any)._ === 'contribution 10', '10th readable at "11"');
assert((readAt(pool, '11') as any)['1'] === 'agent-10', '10th has its own agent intact');

console.log('\n=== 11th..18th continue at 12..19, then 19th at 21 ===');
const r11 = appendWithSupernest(pool, entry(11)); pool = r11.block;
assert(r11.address === '12' && !r11.grew, '11th → 12, no growth');
for (let n = 12; n <= 18; n++) pool = appendWithSupernest(pool, entry(n)).block; // → 13..19
const r19 = appendWithSupernest(pool, entry(19)); pool = r19.block;
assert(r19.address === '21' && !r19.grew, '19th → 21 (next zero-free after 19)');
assert((readAt(pool, '11') as any)._ === 'contribution 10', 'and the 10th is still intact');

console.log('\n=== summary ===');
console.log(`  pass: ${pass}`);
console.log(`  fail: ${fail}`);
if (fail > 0) process.exit(1);
