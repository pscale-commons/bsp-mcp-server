/**
 * Smoke test for the pool-engage primitive's pure helpers.
 *
 * The handler (handlePoolEngage) reaches the federated beach over HTTP and is
 * exercised by RPG validation in a follow-on session. This smoke covers the
 * deterministic logic — digit-path enumeration, slot reading, next-free-slot,
 * envelope assembly, synthesis_hint fallback chain — without network. One
 * section drives handlePoolEngage itself against an in-memory beach (a fake
 * fetch): liquid's table of nine, and the tenth author it refuses.
 */
import {
  digitPathSlots,
  readSlot,
  findNextSlot,
  findAuthorSlot,
  collectContributions,
  extractSynthesisHint,
  floorUnderscore,
  windowOpenTs,
  windowSeed,
  DEFAULT_SYNTHESIS_HINT,
} from '../src/tools/pool.js';
import { appendWithSupernest } from '../src/accumulator.js';
import { floorDepth } from '../src/bsp.js';
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

console.log('\n=== findAuthorSlot — liquid overwrite-my-slot semantics ===');
// Liquid is one slot per author: an author reuses their own slot (overwrite),
// a new author allocates the next free one. findAuthorSlot resolves the former.
const liquidBuf: Block = {
  _: 'liquid pre-commit buffer',
  '1': { _: 'alice pending', '1': 'alice', '3': '2026-06-04T09:00:00Z' },
  '2': { _: 'bob pending', '1': 'bob', '3': '2026-06-04T09:01:00Z' },
};
assert(findAuthorSlot(liquidBuf, 'alice') === '1', 'alice owns slot 1 (overwrite target)');
assert(findAuthorSlot(liquidBuf, 'bob') === '2', 'bob owns slot 2');
assert(findAuthorSlot(liquidBuf, 'carol') === null, 'carol has no slot → null (allocate next-free)');
assert(findAuthorSlot(null, 'alice') === null, 'null block → null');
assert(findAuthorSlot({} as Block, 'alice') === null, 'empty block → null');
// Compose: a returning author overwrites; a fresh author appends.
assert(
  (findAuthorSlot(liquidBuf, 'alice') ?? findNextSlot(liquidBuf)) === '1',
  'returning author (alice) resolves to her existing slot 1',
);
assert(
  (findAuthorSlot(liquidBuf, 'carol') ?? findNextSlot(liquidBuf)) === '3',
  'fresh author (carol) resolves to next-free slot 3',
);

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

console.log('\n=== collectContributions — reads EVERY entry across supernests (pool:JulieJ, 2026-09-02) ===');
// A pool that has grown its floor must still return everything. The regression:
// the prune tested isEntryNode on a multi-digit slot's floor-PADDED prefix, so
// after one supernest "11" (the tenth entry, at block[1][1]) was read as a field
// of the first entry (block._[1]) and dropped — the read stalled at slot 9 and a
// caught-up marker never advanced. Julie's now/pool sat with a dozen unread
// messages behind an invisible wall. Build the exact shape by appending.
let grown: Block = { _: 'pool:JulieJ at beach.happyseaurchin.com.' } as Block;
for (let i = 1; i <= 21; i++) {
  grown = appendWithSupernest(grown, { _: `entry ${i}`, '1': `author${i}`, '3': '2026-08-20T00:00:00.000Z' }).block;
}
assert(floorDepth(grown) === 2, '21 appends grew the floor to 2');
const grownAll = collectContributions(grown, 0);
assert(grownAll.contributions.length === 21, 'all 21 entries returned across two supernest tiers');
assert(grownAll.contributions.at(-1)?.text === 'entry 21', 'the newest entry is the last one read');
assert(grownAll.contributions.map((c) => c.position).join(',') === '1,2,3,4,5,6,7,8,9,11,12,13,14,15,16,17,18,19,21,22,23', 'positions span both tiers in order');
// A caught-up reader must keep advancing past the first tier — the stall's core.
const grownSince9 = collectContributions(grown, 9);
assert(grownSince9.contributions.length === 12, 'since_position=9 returns the 12 entries a stalled reader was missing');
assert(grownSince9.contributions[0].position === 11, 'and the first of them is position 11, not silence');
// Three floors: 91 entries. Absorbed tiers read via shorter floor-padded addresses.
let deep: Block = { _: 'deep' } as Block;
for (let i = 1; i <= 91; i++) deep = appendWithSupernest(deep, { _: `e${i}`, '1': 'a', '3': '2026-01-01T00:00:00.000Z' }).block;
assert(floorDepth(deep) === 3, '91 appends grew the floor to 3');
assert(collectContributions(deep, 0).contributions.length === 91, 'all 91 entries returned across three tiers');

console.log('\n=== collectContributions — rider leak stays closed under the new prune (pool:keel 69/692/694) ===');
// The prune the supernest fix replaced existed to stop an entry's object FIELD
// (a probe rider at position 9) enumerating as a pseudo-slot. That must remain
// true: a length-2 slot beneath a length-1 (floor-1) entry is a field, not a
// slot, and the geometric length>floor rule prunes it exactly as before.
const withRider: Block = {
  _: 'a pool with a riding probe',
  '1': { _: 'plain voice', '1': 'alice', '3': '2026-08-25T00:00:00Z' },
  '2': { _: 'a probe', '1': 'bob', '3': '2026-08-25T00:00:00Z', '9': { _: 'rider envelope', '1': 'sig', '2': 'more' } },
};
const riderRead = collectContributions(withRider, 0);
assert(riderRead.contributions.length === 2, 'two entries — the rider at 2.9 is not a third');
assert(riderRead.contributions.map((c) => c.position).join(',') === '1,2', 'no phantom slot 29 leaks from the rider');

console.log('\n=== findAuthorSlot — floor-aware: an absorbed author is still found after growth ===');
let liq: Block = { _: 'liquid' } as Block;
for (let i = 1; i <= 12; i++) liq = appendWithSupernest(liq, { _: `staged ${i}`, '1': `auth${i}`, '6': '2026-08-01T00:00:00Z' }).block;
assert(findAuthorSlot(liq, 'auth1') === '1', 'absorbed author1 found at slot 1');
assert(findAuthorSlot(liq, 'auth10') === '11', 'current-tier author10 found at slot 11 (not lost to null)');
assert(findAuthorSlot(liq, 'auth12') === '13', 'author12 found at slot 13');
assert(findAuthorSlot(liq, 'nobody') === null, 'an author with no slot returns null');

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

console.log('\n=== floorUnderscore — purpose survives supernest (the "directive vanishes past nine" bug) ===');
// After a supernest the top `_` is the WRAPPED old block; the purpose descends to
// the floor (_._, then _._._...). A floor-aware read must still find it.
assert(floorUnderscore({ _: 'flat' }) === 'flat', 'no supernest → top underscore string');
const once: Block = { _: { _: 'the purpose', '1': 'c1', '9': 'c9' }, '1': 'c10' };
assert(floorUnderscore(once) === 'the purpose', 'supernest x1 → walks to floor string');
const o = extractSynthesisHint(once);
assert(o.source === 'purpose' && o.hint === 'the purpose', 'supernest x1 → hint still sourced from purpose');
const twice: Block = { _: { _: { _: 'the purpose' } } };
assert(floorUnderscore(twice) === 'the purpose', 'supernest x2 → walks all the way to the floor');
assert(floorUnderscore({}) === '', 'no underscore → empty string (falls to default)');

console.log('\n=== window-open trace — honest dice + honest clock (the stamp does not move) ===');
const stamped: Block = {
  _: 'Liquid pre-commit buffer for liquid:pool:room (block-conventions:4.5) — one slot per author, overwriting; the social mirror of pending intentions before commit. Window opened 2026-06-10T12:00:00.000Z.',
  '1': { _: 'first intention', '1': 'alice', '3': '2026-06-10T12:00:00.000Z' },
  '2': { _: 'second intention', '1': 'bob', '3': '2026-06-10T12:00:30.000Z' },
};
assert(windowOpenTs(stamped) === '2026-06-10T12:00:00.000Z', 'stamp parsed from the underscore');
const liveStamped = collectContributions(stamped, 0).contributions;
const s1 = windowSeed('pool:room', stamped, liveStamped);
assert(s1.seed === 'pool:room:window:2026-06-10T12:00:00.000Z', 'seed derives from the stamp');
assert(s1.openTs === '2026-06-10T12:00:00.000Z', 'openTs handed to the envelope');

// Withdraw the earliest: alice's slot becomes a tombstone with a NEW timestamp;
// the stamp — and therefore the seed — does not move. Dice cannot be shopped.
const afterWithdraw: Block = JSON.parse(JSON.stringify(stamped));
(afterWithdraw as Record<string, any>)['1'] = { _: '', '1': 'alice', '3': '2026-06-10T12:05:00.000Z' };
const liveWithdrawn = collectContributions(afterWithdraw, 0).contributions;
assert(liveWithdrawn.length === 1, 'withdrawn slot drops from the live set');
assert(windowSeed('pool:room', afterWithdraw, liveWithdrawn).seed === s1.seed, 'withdraw-earliest: seed unchanged');

// Revise the earliest: fresh timestamp on the slot; stamped seed still unchanged.
const afterRevise: Block = JSON.parse(JSON.stringify(stamped));
(afterRevise as Record<string, any>)['1'] = { _: 'first intention, sharpened', '1': 'alice', '3': '2026-06-10T12:06:00.000Z' };
assert(
  windowSeed('pool:room', afterRevise, collectContributions(afterRevise, 0).contributions).seed === s1.seed,
  'revise-earliest: seed unchanged',
);

// Legacy buffer (no stamp): falls back to the earliest live timestamp — which IS
// movable. This is the hole the stamp closes; legacy windows heal at next opening.
const legacy: Block = {
  _: 'Liquid pre-commit buffer (block-conventions:4.5).',
  '1': { _: 'a', '1': 'alice', '3': '2026-06-10T12:00:00.000Z' },
  '2': { _: 'b', '1': 'bob', '3': '2026-06-10T12:00:30.000Z' },
};
assert(windowOpenTs(legacy) === null, 'no stamp on a legacy buffer');
const l1 = windowSeed('pool:room', legacy, collectContributions(legacy, 0).contributions);
assert(l1.seed === 'pool:room:window:2026-06-10T12:00:00.000Z' && l1.openTs === null, 'legacy fallback: earliest live ts, no openTs');
const legacyWithdrawn: Block = JSON.parse(JSON.stringify(legacy));
(legacyWithdrawn as Record<string, any>)['1'] = { _: '', '1': 'alice', '3': '2026-06-10T12:05:00.000Z' };
assert(
  windowSeed('pool:room', legacyWithdrawn, collectContributions(legacyWithdrawn, 0).contributions).seed !== l1.seed,
  'legacy fallback moves on withdraw — the hole the stamp closes',
);

// A supernested liquid still yields its stamp (floor-aware read).
const superedLiquid: Block = { _: { _: 'Buffer. Window opened 2026-06-10T12:00:00.000Z.', '1': 'old entry' } } as unknown as Block;
assert(windowOpenTs(superedLiquid) === '2026-06-10T12:00:00.000Z', 'stamp read survives supernest');

console.log('\n=== summary ===');
console.log(`  pass: ${pass}`);
console.log(`  fail: ${fail}`);
if (fail > 0) process.exit(1);

// ── The situated current — pure parts (2026-07-20) ──
import { partitionCast, renderPlaceWalk, splitCast as sc2, LIVE_WINDOW_MS as LW } from '../src/tools/pool.js';

console.log('\n=== partitionCast — address arithmetic, walked-form equality ===');
{
  const cast = [
    { handle: 'a', appearance: 'a fig', addr: '211' },     // same place
    { handle: 'b', appearance: 'b fig', addr: '2110' },    // same place, padding variant
    { handle: 'c', appearance: 'c fig', addr: '200' },     // coarser (the quarter contains the room)
    { handle: 'd', appearance: 'd fig', addr: '211.1' },   // finer (within the room)
    { handle: 'e', appearance: 'e fig', addr: '311' },     // elsewhere
  ];
  const { atMine, coarser, finer } = partitionCast(cast, '211');
  assert(atMine.length === 2 && atMine.some(x => x.handle === 'b'), 'padding variant is the SAME place (walked-form equality)');
  assert(coarser.length === 1 && coarser[0].handle === 'c', 'a containing stance is coarser');
  assert(finer.length === 1 && finer[0].handle === 'd', 'a contained address is finer');
  assert(!atMine.some(x => x.handle === 'e') && !coarser.some(x => x.handle === 'e') && !finer.some(x => x.handle === 'e'), 'elsewhere is nowhere in the partition');
}

console.log('\n=== renderPlaceWalk — ancestors frame the terminus; one level of interior ===');
{
  // Floor 3 — a room-scale world: three-digit addresses ('211') sit at the floor,
  // dot-free; the hearth beneath is '211.1'. The fixture's floor must match its
  // address style exactly as a real spatial block's does.
  const spatial: Block = {
    _: { _: { _: 'The valley.' } },
    2: { _: 'The market quarter, stalls and mud.',
         1: { _: 'The approach track.',
              1: { _: 'The Slip — the cold ford where the good road gives out.',
                   1: { _: 'The leaning rope-post.', 1: { _: 'a knot detail never delivered' } },
                   2: 'The shallow crossing itself, shin-deep.' } } },
  } as any;
  const walk = renderPlaceWalk(spatial, '211');
  assert(walk !== null && /The valley\./.test(walk!), 'root underscore frames the walk');
  assert(/\[200\] The market quarter/.test(walk!), 'ancestor delivered at its PADDED address [200] — a copyable label, never a 0-walk collision');
  assert(/\[210\] The approach track/.test(walk!), 'ancestor delivered padded at [210]');
  assert(/\[211\] The Slip/.test(walk!), 'terminus delivered whole at its address');
  assert(/\[211\.1\] The leaning rope-post/.test(walk!) && /\[211\.2\] The shallow crossing/.test(walk!), 'interior one level, single-decimal addresses');
  assert(!/knot detail/.test(walk!), 'two levels down is walked when entered, not delivered');
  assert(renderPlaceWalk(spatial, '9') === null, 'an address naming no place yields null, never an invented there');
}

console.log('\n=== splitCast wired from pool.ts (one source of truth) ===');
{
  const now = 1_000_000_000_000;
  const { here, about } = sc2([
    { handle: 'x', appearance: 'x', lastSignal: now - LW + 1000 },
    { handle: 'y', appearance: 'y', lastSignal: now - LW - 1000 },
    { handle: 'z', appearance: 'z', lastSignal: null },
  ], now);
  assert(here.length === 1 && here[0].handle === 'x', 'signal inside the window is HERE NOW');
  assert(about.length === 2, 'stale or no signal is ABOUT');
}

// (No exit here — an unconditional process.exit at this point silently killed
// every section below it; found 2026-07-29 when the located-engagement tests
// never printed. The single exit lives at the end of the file.)
console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
if (fail > 0) process.exit(1);

// ── Returning-author trace (2026-07-20) ──
import { hasAuthorTrace } from '../src/tools/pool.js';

console.log('\n=== hasAuthorTrace — the full law arrives once, whoever manages the marker ===');
{
  const pool: Block = { _: 'pscale:grit/1', 1: { _: 'a beat', 1: 'julie', 3: 'ts' } } as any;
  const liquid: Block = { _: 'w', 1: { _: 'staged', 1: 'stager', 2: 'ts0', 3: 'ts' } } as any;
  assert(hasAuthorTrace(pool, null, 'julie'), 'a committed slot is a trace');
  assert(hasAuthorTrace(null, liquid, 'stager'), 'a liquid slot is a trace (staging is presence)');
  assert(!hasAuthorTrace(pool, liquid, 'newcomer'), 'no slot anywhere → genuinely new → full law');
  assert(!hasAuthorTrace(null, null, 'anyone'), 'empty room → new');
  const withdrawn: Block = { _: 'w', 1: { _: '', 1: 'ghost', 2: 'ts0', 3: 'ts' } } as any;
  assert(hasAuthorTrace(null, withdrawn, 'ghost'), 'a withdrawn slot still traces — they were here');
}
console.log(`\n=== summary (returning-author) ===\n  pass: ${pass}\n  fail: ${fail}`);

// ── Movable addresses right-pad to the floor (round-2 lesson, 2026-07-20) ──
import { movableAddress, renderWays } from '../src/tools/pool.js';
console.log('\n=== movableAddress — what a player copies must walk where it says ===');
{
  assert(movableAddress(['1'], 3) === '100', "a ground at floor 3 is '100', never '1' (which walks _._.1)");
  assert(movableAddress(['1','2'], 3) === '120', "a building is '120'");
  assert(movableAddress(['1','2','1'], 3) === '121', 'full-width runs unchanged');
  assert(movableAddress(['1','2','1','2'], 3) === '121.2', 'below-floor detail keeps the decimal');
  assert(movableAddress(['0','0','1'], 3) === '001', 'a 0-walk label keeps its zeros — never masquerades as a ground');
  const spatial: Block = { _: { _: { _: 'land.' } }, 1: { _: 'The Village — grey.', 2: { _: 'The alehouse — low.' } }, 2: { _: 'The Road — long.' } } as any;
  const ways = renderWays(spatial, '121')!;
  assert(/\[100\] The Village/.test(ways) && /\[120\] The alehouse/.test(ways) && /\[200\] The Road/.test(ways), 'the ways hand out padded, walkable addresses');
  assert(!/\[1\] /.test(ways) && !/\[12\] /.test(ways), 'no short forms escape');
}
console.log(`\n=== summary (movable) ===\n  pass: ${pass}\n  fail: ${fail}`);

// ── Located engagement — at= writes/filters the address-of-attention (2026-07-29) ──
import { digitsOfAddress } from '../src/tools/pool.js';
import { readFileSync } from 'node:fs';

console.log('\n=== digitsOfAddress — one decimal, comma-walk, junk rejected ===');
{
  assert(digitsOfAddress('3') === '3', 'bare digit passes');
  assert(digitsOfAddress('3.1') === '31', 'single decimal strips to the digit-walk');
  assert(digitsOfAddress('3,1') === '31', 'comma-walk strips identically');
  assert(digitsOfAddress('2026315100') === '2026315100', 'full-width temporal address passes');
  assert(digitsOfAddress('3.1.2') === null, 'multi-dot rejected (sunstone:1.5)');
  assert(digitsOfAddress('pool:beach-venture') === null, 'a block name is not an address');
  assert(digitsOfAddress('2026-07-29T09:00:00Z') === null, 'a timestamp is not an address');
  assert(digitsOfAddress('') === null, 'empty is unlocated');
}

console.log('\n=== collectContributions — located view (block-conventions:4.52) ===');
{
  const located: Block = {
    _: 'tree pool',
    '1': { _: 'about stage 3', '1': 'alice', '2': '3', '3': 't1' },
    '2': { _: 'about stage 3.1', '1': 'bob', '2': '3.1', '3': 't2' },
    '3': { _: 'unlocated chat', '1': 'carol', '2': '', '3': 't3' },
    '4': { _: 'about stage 4', '1': 'dan', '2': '4', '3': 't4' },
    '5': { _: 'legacy junk in field 2', '1': 'eve', '2': 'pool:x', '3': 't5' },
  } as any;
  const all = collectContributions(located, 0);
  assert(all.contributions.length === 5, 'unfiltered read returns every slot');
  assert(all.contributions[0].arrival === null, 'a pool contribution appends, so it carries no arrival stamp');
  const at3 = collectContributions(located, 0, '3');
  assert(at3.contributions.length === 2, "at '3' returns the stage-3 subtree only (unlocated + junk excluded)");
  assert(at3.contributions.map((c) => c.position).join(',') === '1,2', "notation-cross: stored '3.1' meets filter '3'");
  const at31 = collectContributions(located, 0, '31');
  assert(at31.contributions.length === 1 && at31.contributions[0].agent_id === 'bob', "filter '3.1' (digit-walk '31') narrows to the sub-stage");
  const at9 = collectContributions(located, 0, '9');
  assert(at9.contributions.length === 0, 'an unvoiced address returns silence, not an error');
}

console.log('\n=== liquid slot: where at 2, arrival at 6 (block-conventions:4.51, settled 2026-08-02) ===');
{
  // The family keeps where at 2 — marks, pool contributions and liquid slots
  // alike — so one filter reads a coordinate wherever it sits. Liquid's extra
  // field, the arrival stamp it needs because it overwrites, takes 6.
  const settled: Block = {
    _: 'liquid buffer',
    '1': { _: 'staged at stage 3', '1': 'alice', '2': '3', '3': '2026-08-02T10:00:00Z', '6': '2026-08-02T09:00:00Z' },
    // Staged while the 2026-07-15 shape stood: the arrival stamp sits at 2.
    // It is not an address, so the slot reads as unlocated rather than as junk,
    // and the stamp is still found.
    '2': { _: 'legacy shape', '1': 'bob', '2': '2026-07-20T08:00:00Z', '3': '2026-07-20T08:30:00Z' },
    // Older still — no stamp anywhere but last-touched.
    '3': { _: 'oldest shape', '1': 'carol', '2': 'pool:x', '3': '2026-07-01T12:00:00Z' },
  } as any;
  const got = collectContributions(settled, 0).contributions;
  assert(got[0].address === '3', 'a settled slot reads its address at 2');
  assert(got[0].arrival === '2026-08-02T09:00:00Z', 'a settled slot reads its arrival at 6, not last-touched at 3');
  assert(got[0].arrival !== got[0].ts, 'arrival and last-touched are distinct — a revise moves only 3');
  assert(got[1].address === null, 'a legacy stamp at 2 is not an address — the slot reads unlocated');
  assert(got[1].arrival === '2026-07-20T08:00:00Z', 'a legacy slot still yields its arrival, from 2');
  assert(got[2].address === 'pool:x', 'a pre-stamp slot keeps whatever sat at 2');
  assert(got[2].arrival === '2026-07-01T12:00:00Z', 'with no stamp at 6 or 2, arrival falls back to last-touched');
  // The discriminator is shape, never Date.parse: a temporal spine address
  // parses as a perfectly good year and must not be mistaken for a stamp.
  const temporal: Block = {
    _: 'liquid buffer',
    '1': { _: 'staged at a temporal address', '1': 'dan', '2': '2026', '3': '2026-08-02T10:00:00Z' },
  } as any;
  const t = collectContributions(temporal, 0).contributions[0];
  assert(t.address === '2026', 'a temporal address at 2 survives — Date.parse would have eaten it');
  assert(collectContributions(temporal, 0, '2026').contributions.length === 1, 'and it still filters as a located view');
}

console.log('\n=== dice by declaration — the measured invariant (grit, 2026-07-29) ===');
{
  // The gate: a directive whose DELIVERED text declares "no dice" suppresses
  // the window-dice section; the play loop (pscale:grit/1 — root + branch 1)
  // does not carry the phrase, so minted tables keep their dice. Pin the
  // measurement: if a grit edit moves the phrase into root or branch 1, this
  // fails loudly and the gate must be rethought before it ships.
  const grit = JSON.parse(readFileSync(new URL('../src/grit.json', import.meta.url), 'utf8'));
  const flat = (n: any): string =>
    typeof n === 'string' ? n : n && typeof n === 'object' ? Object.values(n).map(flat).join(' ') : '';
  assert(!/\bno dice\b/i.test(flat(grit['_']) + ' ' + flat(grit['1'])), 'grit root + branch 1 (the play mount) declare no suppression — dice preserved');
  assert(/\bno dice\b/i.test(flat(grit['5'])), 'grit:5 (the generic mount) declares "no dice" — trees fold clean');
}

import { findFreeSlot, landedAtFloor, handlePoolEngage } from '../src/tools/pool.js';
import { readAt, writeAt } from '../src/bsp.js';

// Liquid holds nine (found 2026-09-18, lane rpg.6.group; ruled 2026-09-19). A
// tenth author staged through the router was allocated slot 11, which at floor 1
// is 1.1 — the first author's own field — and the read-back passed.
const LIQ_TS = '2026-09-18T20:00:00.000Z';
const nineAtTable = (): Block => {
  const b: any = { _: `Liquid pre-commit buffer for liquid:pool:211. Window opened ${LIQ_TS}.` };
  ['garth', 'equinox', 'cob', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9'].forEach((n, i) => {
    b[String(i + 1)] = { _: `${n} acts`, '1': n, '2': '', '3': LIQ_TS, '4': 'character', '6': LIQ_TS };
  });
  return b;
};

console.log('\n=== liquid holds nine — the fault, and the places a new author may take ===');
{
  // The fault, kept as the reason: the accumulator's next slot past nine is 11.
  const broken = nineAtTable();
  assert(findNextSlot(broken) === '11', "the accumulator's next slot past nine is 11 — 1.1 at floor 1");
  writeAt(broken, '11', { _: 'a10 acts', '1': 'a10', '2': '', '3': LIQ_TS, '4': 'character', '6': LIQ_TS });
  assert(typeof (broken as any)['1']['1'] === 'object', "written there, the tenth slip replaces entry 1's author");
  assert((readAt(broken, '11') as any)['1'] === 'a10', 'and the old read-back (field 1 only) still passed');
  assert(findAuthorSlot(broken, 'a10') === null && findAuthorSlot(broken, 'garth') === null, 'while both voices vanish from every reader');
  assert(collectContributions(broken, 0).contributions[0].agent_id === null, 'entry 1 reads with no author — the dice and the fold skip it');
  assert(!landedAtFloor(broken, '11', 'a10'), 'landedAtFloor refuses it: 11 is longer than the floor');

  // The cure: the nine places, the first free one; never past the floor.
  assert(findFreeSlot(nineAtTable()) === null, 'a full table has no place for a tenth author');
  assert(findFreeSlot(null) === '1' && findFreeSlot({ _: 'liquid' } as Block) === '1', 'an absent or empty buffer offers place 1');
  const eight = nineAtTable(); delete (eight as any)['9'];
  assert(findFreeSlot(eight) === '9', 'the ninth author takes place 9');
  const gap = nineAtTable(); delete (gap as any)['5'];
  assert(findFreeSlot(gap) === '5', 'a gap is taken first — the first free place, as the page takes it');
  const takenBack = nineAtTable(); (takenBack as any)['4']._ = '';
  assert(findFreeSlot(takenBack) === null, 'a line taken back keeps its place for the window');
  assert(landedAtFloor(nineAtTable(), '5', 'a5'), "an author's slip at a place on the floor reads as landed");
  assert(!landedAtFloor(nineAtTable(), '5', 'a6'), 'another author at that place does not');
  let grown: Block = { _: 'liquid' } as Block;
  for (let i = 1; i <= 12; i++) grown = appendWithSupernest(grown, { _: `staged ${i}`, '1': `auth${i}`, '3': LIQ_TS }).block;
  assert(landedAtFloor(grown, '1', 'auth1') && landedAtFloor(grown, '11', 'auth10'), 'a grown buffer: both tiers read as landed at floor 2');
}

console.log('\n=== liquid holds nine — through the router door, against an in-memory beach ===');
{
  // handlePoolEngage over a fake beach that answers the wire the way a beach
  // does: GET a block (404 when absent), POST a whole block, or POST a surgical
  // write at a spindle, landed floor-aware. What a door is told, and what the
  // beach keeps.
  const ORIGIN = 'https://tenth.test';
  const LIQ = 'liquid:pool:tenth';
  const store: Record<string, any> = { 'pool:tenth': { _: 'Probe room: a table of nine, and a tenth who arrives.' } };
  const answer = (v: unknown, status = 200) =>
    new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.origin !== ORIGIN || !url.pathname.endsWith('/.well-known/pscale-beach')) return answer({ error: 'no beach here' }, 404);
    const name = url.searchParams.get('block');
    if ((init?.method ?? 'GET') === 'GET') {
      if (!name) return answer({ _: 'fixture beach', origin: ORIGIN, blocks: Object.keys(store) });
      return name in store ? answer(store[name]) : answer({ error: 'not found' }, 404);
    }
    const body = JSON.parse(String(init.body));
    if (!name || body.append) return answer({ error: 'this fixture takes whole and surgical writes only' }, 400);
    if (body.spindle) {
      const b = store[name] ?? {};
      writeAt(b, String(body.spindle), body.content);
      store[name] = b;
    } else {
      store[name] = body.content;
    }
    return answer({ ok: true });
  }) as typeof fetch;
  const engage = async (p: Record<string, unknown>) =>
    (await handlePoolEngage({ pool_url: ORIGIN, pool_name: 'tenth', ...p } as any)).content.map((c) => c.text).join('\n');

  try {
    store[LIQ] = nineAtTable();
    const before = JSON.stringify(store[LIQ]);

    const refused = await engage({ agent_id: 'a10', submit: 'a10 acts' });
    assert(/^every place at the table is taken just now — nothing was written\./.test(refused), 'the tenth author is told the table is full');
    assert(!/rejected by beach/.test(refused), 'told plainly — nothing reached the beach, nothing is wrong with it');
    assert(JSON.stringify(store[LIQ]) === before, 'and nothing was written: all nine lines stand as they were');

    const passer = await engage({ agent_id: 'passer', submit: '' });
    assert(JSON.stringify(store[LIQ]) === before, 'a withdraw with no line to take back writes nothing');
    assert(!/every place at the table/.test(passer) && !/withdrawn: liquid slot/.test(passer), 'and claims neither a refusal nor a withdraw');

    const revised = await engage({ agent_id: 'garth', submit: 'garth acts again' });
    assert(/submitted: liquid slot 1\b/.test(revised), 'a seated author still revises at a full table');
    assert(store[LIQ]['1']._ === 'garth acts again' && store[LIQ]['1']['1'] === 'garth' && store[LIQ]['1']['6'] === LIQ_TS, 'the revision lands in place — author kept, arrival kept');

    delete store[LIQ]['5'];
    const seated = await engage({ agent_id: 'a10', submit: 'a10 acts' });
    assert(/submitted: liquid slot 5\b/.test(seated), 'when a place opens, the tenth author takes it');
    assert(collectContributions(store[LIQ], 0).contributions.every((c) => c.agent_id !== null), 'and every line in the buffer keeps its author');
    assert(findAuthorSlot(store[LIQ], 'a10') === '5', 'found where every reader looks');

    await engage({ agent_id: 'garth', clear: true });
    const fresh = await engage({ agent_id: 'a11', submit: 'a11 arrives' });
    assert(/submitted: liquid slot 1\b/.test(fresh), 'once the buffer is cleared, the next author opens a fresh window at place 1');
  } finally {
    globalThis.fetch = realFetch;
  }
}

console.log('\n=== a room declares at birth — founding-by-purpose, through the router door ===');
{
  // proposal 2026-09-21-rooms-declare-at-birth: the mirror gives table behaviour
  // only to a room that declares itself, and every place-room is founded by
  // purpose — so the founding writes convention:<room> = grit beside the pool.
  const { mountsPlayLoop, GRIT_DECLARATION } = await import('../src/tools/pool.js');
  for (const yes of ['pscale:grit', 'pscale:grit/1', '  pscale:grit/1 ']) assert(mountsPlayLoop(yes), `'${yes.trim()}' is the play loop`);
  for (const no of ['', 'function:five', 'function:audit', 'grit:tremors/1', 'pscale:gritty', 'pscale:grit/1 and a welcome', 'Welcome to the gate of Brackenfoot.'])
    assert(!mountsPlayLoop(no), `'${no.slice(0, 28)}' declares nothing — only the trunk's play loop is certainly the game`);
  // Read as the mirror reads it (xstream kernel/convention.ts parseConventionName).
  assert(GRIT_DECLARATION.trim().split(/[\s—–:,.]+/)[0].toLowerCase() === 'grit', "the declaration's first bare word names the convention");

  const ORIGIN = 'https://born.test';
  const store: Record<string, any> = {
    'pool:211': { _: 'pscale:grit/1' },                                   // founded before rooms declared
    'convention:300': { _: 'grit — tuned by its Designer', '4': 'solid_since = off' },
  };
  let refuse = '';                                                         // a block name the beach will not take
  const answer = (v: unknown, status = 200) =>
    new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.origin !== ORIGIN || !url.pathname.endsWith('/.well-known/pscale-beach')) return answer({ error: 'no beach here' }, 404);
    const name = url.searchParams.get('block');
    if ((init?.method ?? 'GET') === 'GET') {
      if (!name) return answer({ _: 'fixture beach', origin: ORIGIN, blocks: Object.keys(store) });
      return name in store ? answer(store[name]) : answer({ error: 'not found' }, 404);
    }
    const body = JSON.parse(String(init.body));
    const target = name ?? body.block;
    if (target === refuse) return answer({ error: 'refused' }, 500);
    if (body.append || body.spindle) return answer({ error: 'this fixture takes whole writes only' }, 400);
    store[target] = body.content;
    return answer({ ok: true });
  }) as typeof fetch;
  const found = async (pool_name: string, purpose: string) =>
    (await handlePoolEngage({ pool_url: ORIGIN, pool_name, agent_id: 'mover', purpose } as any)).content.map((c) => c.text).join('\n');

  try {
    const room = await found('220', 'pscale:grit/1');
    assert(store['pool:220']?._ === 'pscale:grit/1', 'the mover founds the room on the play loop');
    assert(store['convention:220']?._ === GRIT_DECLARATION && Object.keys(store['convention:220']).length === 1, 'and the room is born declared — the underscore alone, no dial set');
    assert(/^declared: convention:220 = grit/m.test(room), 'the ack says so');

    const gate = await found('gate', 'Welcome to the gate of Brackenfoot.\n\nThis is where players meet before the story.');
    assert('pool:gate' in store && !('convention:gate' in store), 'a lobby founded with prose stays a parlour: nothing is declared');
    assert(!/declared/i.test(gate), 'and its ack says nothing of a declaration');

    await found('audit-room', 'function:audit');
    assert('pool:audit-room' in store && !('convention:audit-room' in store), 'a room founded on another operator declares nothing — a bare law is not the game');

    const tuned = JSON.stringify(store['convention:300']);
    const stood = await found('300', 'pscale:grit/1');
    assert(JSON.stringify(store['convention:300']) === tuned, "a declaration that already stands is left exactly as it is — a Designer's dials survive the founding");
    assert(/^declared: convention:300 already stood/m.test(stood), 'and the ack says it stood');

    await found('211', 'pscale:grit/1');
    assert(!('convention:211' in store), 'purpose is creation-only: a room that already stands is never declared by a later engage — inference stays out of the door');

    refuse = 'convention:120';
    const half = await found('120', 'pscale:grit/1');
    assert(store['pool:120']?._ === 'pscale:grit/1', 'a founding never fails on its declaration: the room stands');
    assert(/^NOT declared: .*convention:120/m.test(half) && /bsp\(agent_id="https:\/\/born\.test", block="convention:120"/.test(half), 'and the ack hands over the one line to write by hand');
  } finally {
    globalThis.fetch = realFetch;
  }
}

console.log(`\n=== summary (located engagement) ===\n  pass: ${pass}\n  fail: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
