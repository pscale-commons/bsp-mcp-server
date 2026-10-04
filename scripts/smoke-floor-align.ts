/**
 * smoke-floor-align.ts — floor-alignment module + bsp-floor tool acceptance.
 *
 * Verifies the law: cross-block correspondence is by PSCALE (floor-anchored),
 * not walk depth. A floor-1 block and a floor-2 block must meet at the floor
 * plane (pscale 0), with the deeper block's top branches sitting ABOVE (coarser).
 */

import { indexByPscale, floorAlign, floorPlane, floorProduct } from '../src/floor-align.js';
import { floorDepth } from '../src/bsp.js';
import { bspRead } from '../src/bsp-fn.js';
import { formatFloorAlign } from '../src/tools/bsp-floor.js';
import sunstone from '../src/sunstone.json' with { type: 'json' };

let pass = 0;
let fail = 0;
function ok(cond: boolean, msg: string) {
  if (cond) { pass++; } else { fail++; console.error(`  ✗ ${msg}`); }
}

// ── Fixtures: a floor-1 block and a floor-2 block ──
// A (floor 1): root + two top branches at pscale 0; one child at pscale -1.
const A = {
  _: 'A floor identity',
  1: 'A one',
  2: { _: 'A two', 1: 'A two-one' },
};
// B (floor 2): root chain reaches a string in two steps; one top branch above.
const B = {
  _: { _: 'B floor identity', 1: 'B above-rung child' },
  1: 'B top (coarser)',
};

ok(floorDepth(A) === 1, `A floor is 1 (got ${floorDepth(A)})`);
ok(floorDepth(B) === 2, `B floor is 2 (got ${floorDepth(B)})`);

// ── indexByPscale ──
const ia = indexByPscale(A);
const ib = indexByPscale(B);

const aFloor = ia.filter((n) => n.pscale === 0);
ok(aFloor.some((n) => n.text === 'A floor identity' && n.address === '0'), 'A floor identity at pscale 0, address "0"');
ok(aFloor.some((n) => n.text === 'A one'), 'A branch 1 sits at pscale 0 (floor-1 block)');
ok(ia.some((n) => n.pscale === -1 && n.text === 'A two-one' && n.address === '2.1'), 'A 2,1 at pscale -1, address "2.1"');

ok(ib.some((n) => n.pscale === 0 && n.text === 'B floor identity'), 'B floor identity at pscale 0');
ok(ib.some((n) => n.pscale === 1 && n.text === 'B top (coarser)'), 'B top branch sits ABOVE the floor at pscale +1 (floor-2 block)');

// ── floorAlign: the floors coincide ──
const aligned = floorAlign(A, B);
const lvl0 = aligned.find((l) => l.pscale === 0)!;
ok(!!lvl0, 'an aligned level exists at pscale 0 (the floor plane)');
ok(lvl0.perBlock[0].some((n) => n.text === 'A floor identity') &&
   lvl0.perBlock[1].some((n) => n.text === 'B floor identity'),
   'both floor identities meet at pscale 0 — alignment is at the decimal, not the leftmost digit');

const lvlPlus = aligned.find((l) => l.pscale === 1)!;
ok(lvlPlus.perBlock[0].length === 0 && lvlPlus.perBlock[1].length === 1,
   'pscale +1: A is empty (zero-padded), B carries its coarser top — deeper block reaches higher');

const lvlMinus = aligned.find((l) => l.pscale === -1)!;
ok(lvlMinus.perBlock[0].length === 1 && lvlMinus.perBlock[1].length === 0,
   'pscale -1: A carries fine detail, B empty');

// coarse -> fine ordering
const order = aligned.map((l) => l.pscale);
ok(JSON.stringify(order) === JSON.stringify([...order].sort((x, y) => y - x)), 'levels ordered coarse -> fine');

// ── floorPlane: the root-definition index (n-ary) ──
const C = { _: 'C floor identity', 1: 'C one' };
const plane0 = floorPlane([A, B, C], 0);
ok(plane0.length === 3, 'floorPlane spans all three blocks');
ok(plane0[0].some((n) => n.text === 'A floor identity') &&
   plane0[1].some((n) => n.text === 'B floor identity') &&
   plane0[2].some((n) => n.text === 'C floor identity'),
   'pscale-0 plane across 3 blocks = an index of their root definitions');

// ── floorProduct: scalar contraction ──
const lexicalSim = (x: string, y: string) => {
  const xs = new Set(x.toLowerCase().split(/\s+/));
  const ys = y.toLowerCase().split(/\s+/);
  return ys.filter((w) => xs.has(w)).length;
};
const selfProduct = floorProduct(A, A, lexicalSim);
const crossProduct = floorProduct(A, B, lexicalSim);
ok(selfProduct > crossProduct, `A resonates with itself more than with B (self=${selfProduct} > cross=${crossProduct})`);

// ── digit 0 is a position (2026-10-04, watch:weft 525-527) ──
// bsp-floor read nothing beneath a zero digit: on the floor-10 clock that is
// every date from 2000 to 2999 (the century digit of 2026 is 0), on every
// accumulator everything under its root chain — and B's own above-rung child
// (0,1), which sat in this file's fixture unread. A block's side of the frame
// is now its own disc at that pscale, so the frame cannot drift from bsp().
const chain = (n: number, s: string): any => (n === 1 ? s : { _: chain(n - 1, s) });

ok(ib.some((n) => n.pscale === 0 && n.address === '01' && n.text === 'B above-rung child'),
   "B's above-rung child (0,1) aligns at pscale 0, address 01");

// The clock (floor 10): the 2000s are millennium 2's zero-position, and the
// seasons stand beneath the years as beach-venture's mirrors hold them.
const seasons = {
  _: chain(10, 'a mirror on the clock'),
  2: { _: { _: 'the 2000s', 2: { _: 'the 2020s',
    5: { _: '2025', 2: '2025 season 2', 3: '2025 season 3', 4: '2025 season 4' },
    6: { _: '2026', 1: '2026 season 1', 2: '2026 season 2', 3: { 1: 'July' }, 4: { 1: 'October' } },
  } } },
};
const spine = { _: chain(10, 'a spine on the clock'), 2: { _: { _: 'the 2000s', 2: { _: 'the 2020s', 6: { _: '2026', 4: { 1: 'October' } } } } } };

const s5 = floorPlane([seasons], 5)[0].map((n) => n.address);
ok(JSON.stringify(s5) === JSON.stringify(['2025200000', '2025300000', '2025400000', '2026100000', '2026200000', '2026300000', '2026400000']),
   `every season beneath the century zero aligns, full width (got ${s5.join(' ') || 'none'})`);
const lvl5 = floorAlign(spine, seasons).find((l) => l.pscale === 5);
ok(!!lvl5 && lvl5.perBlock.every((side) => side.length > 0), 'a spine and its mirror both stand at pscale 5 — neither zero-padded');

// An accumulator after two supernests (floor 3): 001-009 under the root
// chain's second rung, the container 010 voicing them, 1xx at the root.
const pile = {
  _: { _: { _: 'a pile', 1: 'entry 001', 2: 'entry 002' }, 1: { _: 'summary of 001-009', 1: 'entry 011' } },
  1: { 5: { 1: 'entry 151' } },
};
const p0 = floorPlane([pile], 0)[0].map((n) => n.address);
ok(['001', '002', '011', '151'].every((a) => p0.includes(a)), `a pile's wrapped entries align beside its newest (got ${p0.join(' ')})`);
ok(floorPlane([pile], 1)[0].some((n) => n.address === '010' && n.text === 'summary of 001-009'), "a wrapped container's summary aligns at 010");

// Ground never carved (sunstone:1.72): a room whose middle rung was never
// decided walks its zero as an underscore step.
const ground = { _: chain(3, 'the ground'), 3: { _: { _: 'county 3, its district never carved', 2: 'a room at 3,0,2' }, 4: 'district 34' } };
ok(floorPlane([ground], 0)[0].some((n) => n.address === '302' && n.text === 'a room at 3,0,2'), 'a room under an uncarved rung aligns at its own address');

// The clock extends both ways and stays one geometry: supernested toward the
// ten-millennia (floor 11) every date gains a leading zero; below the second
// base ten resumes, so zero is a value again (sundial 1.0).
const up = { _: seasons };
const up5 = floorPlane([up], 5)[0].map((n) => n.address);
ok(up5.length === 7 && up5[0] === '02025200000', `supernested to floor 11, the seasons align behind a leading zero (got ${up5.join(' ') || 'none'})`);
const down = JSON.parse(JSON.stringify(seasons));
down[2]._[2][6][4][1] = { _: 'October', 1: { 4: { 6: { 7: { _: 'beat 7', 1: { 1: { 1: { _: { _: 'tenth 0 of the second', 5: 'a hundredth under tenth 0' } } } } } } } } };
ok(floorPlane([down], -5)[0].some((n) => n.address === '2026411467.11105' && n.text === 'a hundredth under tenth 0'),
   'refined below the second, a cell under a zero value aligns at its own address');

// The frame IS the disc: at every pscale each block's side is exactly what
// bsp(B, P) returns, on every fixture here and on sunstone, whose branches
// each carry a hidden directory.
const fixtures: Record<string, any> = { A, B, C, seasons, spine, pile, ground, up, down, sunstone };
for (const [name, blk] of Object.entries(fixtures)) {
  const F = floorDepth(blk);
  const idx = indexByPscale(blk);
  const drift: number[] = [];
  for (let p = F - 1; p >= F - 20; p--) {
    const disc = ((bspRead(blk, null, p).entries ?? []) as any[]).map((e) => `${e.address} ${e.content}`);
    const side = idx.filter((n) => n.pscale === p).map((n) => `${n.address} ${n.text}`);
    if (JSON.stringify(disc) !== JSON.stringify(side)) drift.push(p);
  }
  ok(drift.length === 0, `${name}: the frame equals bsp()'s disc at every pscale${drift.length ? ` (drifts at ${drift.join(' ')})` : ''}`);
}

// Every label copies back as a spindle: bsp() reads it to the same text, and to
// the same address wherever the walk ends on a digit 1-9 (a trailing zero is
// its parent's own underscore, so it reads as the parent, whose text it is).
for (const name of ['seasons', 'pile', 'ground', 'up', 'down', 'sunstone']) {
  const blk = fixtures[name];
  const wrong = indexByPscale(blk).filter((n) => {
    const walk = (bspRead(blk, n.address, null).entries ?? []) as any[];
    const end = walk[walk.length - 1];
    return end?.content !== n.text || (!n.walk.endsWith('0') && end?.address !== n.address);
  });
  ok(wrong.length === 0, `${name}: every label reads back to its own position${wrong.length ? ` (not: ${wrong.map((n) => n.address).join(' ')})` : ''}`);
}

// The tool prints each side as the disc prints it: full-width labels, and on
// the clock each one's relation to now.
const printed = formatFloorAlign(floorAlign(spine, seasons).filter((l) => l.pscale === 5), ['spine', 'mirror'], [10, 10], 5);
ok(/\[2025200000\] \([^)]*behind\)/.test(printed), 'a past season prints full width with its relation to now');
ok(!/\[20252\]|\(none — zero-padded\)/.test(printed), 'no short label, and no side zero-padded beneath the century zero');

console.log(`\nsmoke-floor-align: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
