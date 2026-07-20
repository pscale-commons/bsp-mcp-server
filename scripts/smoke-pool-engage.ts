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
  findAuthorSlot,
  collectContributions,
  extractSynthesisHint,
  floorUnderscore,
  windowOpenTs,
  windowSeed,
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

console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
process.exit(fail > 0 ? 1 : 0);

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
process.exit(fail > 0 ? 1 : 0);
