/**
 * Smoke test for the vapour torus core (src/torus.ts) — pure, in-process, no
 * network. Exercises beat/view/depart, staleness pruning (the afterglow), reach
 * preservation on a bare ping, load/cap, location-keying, and the pairwise reach
 * frame. The clock is injected, so staleness is deterministic and time-free.
 */
import { Torus, pairFrame } from '../src/torus.js';

let pass = 0;
let fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

// Injected clock — `t` advances by hand (seconds). stale window = 30.
let t = 0;
const torus = new Torus(24, 30, () => t);

console.log('=== beat + view: two agents co-present at one place ===');
t = 0;
torus.beat('room:tavern', 'anya', 'watching the door');
const v1 = torus.beat('room:tavern', 'cyrus', 'crossing to the fire');
assert(v1.present.length === 1, 'cyrus sees one other present');
assert(v1.present[0].handle === 'anya', 'the other is anya');
assert(v1.present[0].reach === 'watching the door', "anya's reach is live");
assert(v1.you?.handle === 'cyrus' && v1.you?.reach === 'crossing to the fire', 'you = cyrus with his reach');
assert(v1.here === 2 && v1.load === 2, 'here=2, load=2');

console.log('\n=== bare ping preserves the standing reach ===');
t = 5;
const v2 = torus.beat('room:tavern', 'anya'); // no reach passed
assert(v2.you?.reach === 'watching the door', 'anya bare-ping kept her standing reach');

console.log('\n=== afterglow: a beat older than STALE_S is pruned ===');
t = 40; // anya last beat at 5 (age 35 > 30), cyrus at 0 (age 40 > 30)
const v3 = torus.beat('room:tavern', 'fenn', 'comes in off the road');
assert(v3.present.length === 0, 'anya + cyrus pruned (stale); fenn alone');
assert(v3.here === 1 && v3.load === 1, 'only fenn live');

console.log('\n=== depart drops presence immediately ===');
t = 41;
torus.depart('room:tavern', 'fenn');
const v4 = torus.view('room:tavern');
assert(v4.here === 0 && v4.present.length === 0, 'frame empty after depart');
assert(v4.load === 0, 'load 0 — empty frame swept');

console.log('\n=== pairwise: an order-independent reach frame, formed when both reach ===');
assert(pairFrame('bob', 'alice') === pairFrame('alice', 'bob'), 'pair frame is order-independent');
assert(pairFrame('alice', 'bob') === 'reach:alice:bob', 'pair frame is reach:<sorted>');
t = 100;
const pf = pairFrame('alice', 'bob');
const reaching = torus.beat(pf, 'alice', 'I have the map'); // alice reaches
assert(reaching.present.length === 0, 'alice alone — not yet formed');
const both = torus.beat(pf, 'bob', 'I know the road'); // bob reaches back
const them = both.present.find((p) => p.handle === 'alice');
assert(!!them?.reach && !!both.you?.reach, 'contact formed — both present and both reaching');

console.log('\n=== location-keying: different frames do not see each other ===');
t = 200;
torus.beat('room:tavern', 'anya', 'back again');
const other = torus.beat('room:cellar', 'mara', 'down in the dark');
assert(other.present.length === 0, 'mara in the cellar sees no one from the tavern');
assert(other.load === 2, 'load counts both frames (anya + mara); stale pair pruned');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
