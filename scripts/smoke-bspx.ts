/**
 * smoke-bspx.ts — floor-alignment module + bspx tool acceptance.
 *
 * Verifies the law: cross-block correspondence is by PSCALE (floor-anchored),
 * not walk depth. A floor-1 block and a floor-2 block must meet at the floor
 * plane (pscale 0), with the deeper block's top branches sitting ABOVE (coarser).
 */

import { indexByPscale, floorAlign, floorPlane, floorProduct } from '../src/floor-align.js';
import { floorDepth } from '../src/bsp.js';

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

console.log(`\nsmoke-bspx: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
