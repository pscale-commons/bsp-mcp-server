/**
 * smoke-envelope.ts — the bolus envelope: the muscle ahead and the muscle behind.
 *
 * AHEAD: a path-walk or point whose terminus has digit children ends with
 *   `beneath (pscale P): a · b · c` — the next throw already composed, so a
 *   turn fires those addresses together instead of pulling the block whole
 *   to see what is there. Absent at a leaf.
 *
 * BEHIND: readBackSpindle(block, landed, content) names the spindle a write
 *   ack walks back — the landed address extended by the deepest chain of the
 *   payload — so the read-back law (orientation:weft 6.4; the closing rung of
 *   strata's writing spindle) runs in the envelope rather than in the
 *   author's memory. Record: proposals/2026-09-23-the-bolus-envelope.md.
 *
 * Run: npm run smoke:envelope
 */
import { bspRead, formatRead, readBackSpindle } from '../src/bsp-fn.js';
import { formatAddress, parseSpindle } from '../src/bsp.js';

let failures = 0;
function assert(cond: boolean, label: string) {
  if (cond) console.log(`  ✓ ${label}`);
  else { console.error(`  ✗ ${label}`); failures++; }
}
function same(a: unknown, b: unknown): boolean { return JSON.stringify(a) === JSON.stringify(b); }

// Floor 1 — the block-conventions dialect.
const block: any = {
  _: 'root',
  1: { _: 'one', 1: 'one-one', 2: { _: 'one-two', 1: 'one-two-one' } },
  4: { _: 'four', 2: { _: 'four-two', 1: 'a', 2: { _: 'b', 1: 'c' } }, 3: 'four-three' },
  9: 'nine-leaf',
};

console.log('AHEAD — the beneath line');
{
  const r = bspRead(block, '4.2', null);
  assert(r.shape === 'path-walk', 'spindle alone is a path-walk');
  assert(same(r.beneath, ['4.21', '4.22']), 'terminus 4.2 lists its digit children as full-width addresses');
  assert(r.beneath_pscale === -2, 'the children sit one pscale below the terminus');
  const text = formatRead(r);
  assert(text.includes('beneath (pscale -2): 4.21 · 4.22'), 'the walk ends with the beneath line');
}
{
  const r = bspRead(block, '9', null);
  assert(r.beneath === undefined, 'a leaf terminus carries no beneath');
  assert(!formatRead(r).includes('beneath'), 'a leaf walk ends silent');
}
{
  const r = bspRead(block, '4.22', null);
  assert(same(r.beneath, ['4.221']), 'one child only is still named — a stub at that rung, depth owed');
}
{
  const r = bspRead(block, '4.22', 0);
  assert(r.shape === 'point', 'spindle + pscale at the root rung is a point');
  assert(same(r.beneath, ['4.2', '4.3']), 'a point at pscale 0 names the children of the node it lands on, not of the spindle terminus');
  assert(r.beneath_pscale === -1, 'and their pscale');
  assert(formatRead(r).includes('beneath (pscale -1): 4.2 · 4.3'), 'the point ends with the beneath line');
}
{
  const r = bspRead(block, '4.22', -1);
  assert(same(r.beneath, ['4.21', '4.22']), 'a point at pscale -1 names the children of 4.2');
}
{
  const r = bspRead(block, '4.2', -2);
  assert(r.shape === 'path-walk+descent' && r.beneath === undefined, 'walk+descent already shows the ring — no beneath line doubled beneath it');
}

console.log('AHEAD — the disc says where depth is');
{
  const r = bspRead(block, null, 0);
  assert(r.shape === 'disc', 'pscale alone is a disc');
  const es = (r.entries as any[]);
  const at = (a: string) => es.find((e) => e.address === a);
  assert(at('1')?.beneath === 2 && at('4')?.beneath === 2, 'positions with depth carry the count of the ring beneath');
  assert(at('9')?.beneath === undefined, 'a leaf position carries none');
  const text = formatRead(r);
  assert(text.includes('[4]: four · 2 beneath') && !text.includes('[9]: nine-leaf ·'), 'the disc line ends with the count, and a leaf line does not');
  const stamped: any = { _: 'r', 1: { _: 'plain', 3: '2026-09-23T10:08:28Z' }, 2: { _: 'grafted', 1: 'the graft', 3: '2026-09-23T10:09:00Z' } };
  const d = (bspRead(stamped, null, 0).entries as any[]);
  assert(d.find((e) => e.address === '1')?.beneath === undefined && d.find((e) => e.address === '2')?.beneath === 1, 'the stamp never counts; a graft does');
}

console.log('THE PADDING NOTE — a short spindle on a grown block says what it read');
{
  // floor 3: the root's underscore chain is three deep; "13" left-pads to 013 (the old root's 1 → 3),
  // while the container of the 130s is 130.
  const grown: any = { _: { _: { _: 'the old root' }, 1: { _: 'old one', 3: 'old thirteen' } }, 1: { _: 'container 1', 3: { _: 'container 13', 1: 'entry 131' } } };
  const r = bspRead(grown, '13', null);
  assert(typeof r.padding === 'string' && r.padding.includes('read as 013') && r.padding.includes('the container of the 130s is 130'), 'a dot-free spindle shorter than the floor carries the padding note');
  assert(formatRead(r).split('\n')[1].startsWith('  [note] "13" is shorter than the floor (3)'), 'the note is the first line after the head');
  const full = bspRead(grown, '130', null);
  assert(full.padding === undefined, 'a full-width spindle carries no note');
  const flat = bspRead(block, '4', null);
  assert(flat.padding === undefined, 'at floor 1 nothing pads, nothing is noted');
  const pt = bspRead(grown, '13', 0);
  assert(typeof pt.padding === 'string' && formatRead(pt).includes('[note] "13"'), 'a point read carries it too');
}

console.log('BEHIND — the read-back spindle');
assert(readBackSpindle(block, '4.2', 'a voice') === '4.2', 'a string voices the node — the read-back walks to it');
assert(readBackSpindle(block, '4.2', { _: 'x', 1: 'a', 2: { _: 'y', 1: 'z' } }) === '4.221', 'an object extends the landed address by its DEEPEST chain, not its first');
assert(readBackSpindle(block, '', { 1: { 1: { 1: 'a' } } }) === '1.11', 'a whole-block object write walks from the root');
assert(readBackSpindle(block, '', 'root voice') === null, 'a root string has nothing addressable to walk back');
assert(readBackSpindle(block, '0', 'root voice') === '0', 'the surgical underscore write walks back the root underscore');
assert(readBackSpindle(block, '4.2', { _: 'x', 3: 'c', 1: 'a' }) === '4.21', 'ties on depth resolve to the lowest digit');

// A stamped entry: the arrival stamp at field 3 rides the line as its suffix and is not a position beneath.
{
  const stamped: any = { _: 'r', 1: { _: 'a plain append, wrapped on arrival', 3: '2026-09-23T10:08:28Z' }, 2: { _: 'an account with a graft', 1: 'the graft', 3: '2026-09-23T10:09:00Z' } };
  const r1 = bspRead(stamped, '1', null);
  assert(r1.beneath === undefined, 'a stamped entry with nothing grafted carries no beneath');
  const r2 = bspRead(stamped, '2', null);
  assert(same(r2.beneath, ['2.1']), 'a stamped entry lists its graft and not its stamp');
  assert(formatRead(r2).includes('· 2026-09-23T10:09:00Z') && !formatRead(r2).includes('2.3'), 'the stamp rides the line, never the ring');
}

// Floor 2 — a supernested block ({_: old root}): the underscore chain is two deep, labels are full width.
const b2: any = { _: { _: 'the old root', 1: 'old one' }, 1: { _: 'wrap', 2: { _: 'two', 1: 'x' } } };
{
  const r = bspRead(b2, '12', null);
  assert(same(r.beneath, ['12.1']), 'at floor 2 the beneath addresses carry the full width');
  assert(readBackSpindle(b2, '12', { 1: 'q' }) === '12.1', 'and the read-back spindle at floor 2 is full width too');
}

// The wire shape a tool caller could copy verbatim into the next spindle.
{
  const r = bspRead(block, '4', null);
  for (const a of r.beneath ?? []) {
    const back = bspRead(block, a, null);
    assert(back.shape === 'path-walk' && (back.entries as any[]).length === 2, `beneath address "${a}" round-trips as a spindle`);
  }
}

// ONE FORM — a beach computes a wire read itself and labels with formatAddress
// (the short form: leading and trailing zeros stripped), so a floor-3
// accumulator's container 360 arrived as "36", which copied back pads to 036
// (daily:weft, 2026-10-03). formatRead anchors every label to the floor, so a
// wire read and a local read of the same node print the same address, and
// every printed label read back as a spindle lands on the node it labels.
console.log('ONE FORM — wire labels print floor-anchored');
{
  const toWire = (r: any, floor: number) => {
    const short = (a: string) => formatAddress(parseSpindle(a, floor).digits, floor);
    const w = JSON.parse(JSON.stringify(r));
    for (const k of ['entries', 'path_walk', 'descent']) if (Array.isArray(w[k])) for (const e of w[k]) e.address = short(e.address);
    if (typeof w.address === 'string') w.address = short(w.address);
    if (Array.isArray(w.beneath)) w.beneath = w.beneath.map(short);
    delete w.floor;
    return w;
  };
  const labels = (text: string) => [...text.matchAll(/\[(\d+(?:\.\d+)?)\]/g)].map((m) => m[1]);
  const node = (b: any, a: string, floor: number) => {
    const r: any = bspRead(b, a, null);
    return r.entries?.[r.entries.length - 1]?.content;
  };

  // Floor 3 — an accumulator supernested twice, the shape of daily:weft.
  const leaf = (n: number) => ({ _: `entry ${n}` });
  const old: any = { _: { _: 'the first nine', 1: 'entry 001' } };
  for (let i = 1; i <= 9; i++) old[i] = { _: `container 0${i}0`, 1: `entry 0${i}1`, 2: `entry 0${i}2` };
  const b3: any = { _: old, 3: { _: 'container 300' } };
  for (let i = 3; i <= 6; i++) b3[3][i] = { _: `container 3${i}0`, 1: leaf(Number(`3${i}1`)), 9: leaf(Number(`3${i}9`)) };

  const disc = bspRead(b3, null, 1);
  const wire = formatRead(toWire(disc, 3));
  assert(wire === formatRead(disc), 'a wire disc prints exactly what the local disc prints');
  const dl = labels(wire);
  assert(['330', '340', '350', '360'].every((a) => dl.includes(a)) && !dl.includes('36'), 'the disc at pscale 1 lists [330] [340] [350] [360]');
  assert(dl.includes('010') && !dl.includes('1'), 'the old block\'s first container prints 010, never [1]');
  assert(dl.every((a) => node(b3, a, 3) !== undefined && node(b3, a, 3) === `container ${a}`), 'every disc label read back as a spindle lands on the container it labels');

  const pwd = bspRead(b3, '350', 0);
  const pwdWire = formatRead(toWire(pwd, 3));
  assert(pwdWire === formatRead(pwd), 'a wire path-walk+descent prints what the local one prints');
  assert(pwdWire.includes('d1 p2 [300]') && pwdWire.includes('d2 p1 [350]') && pwdWire.includes('d3 p0 [351]'), 'its walk prints [300] [350] and the descent [351]');

  const deep = bspRead(b3, '359', -1);
  assert(formatRead(toWire(deep, 3)) === formatRead(deep), 'below pscale 0 the single-decimal form is unchanged');
  const shortWalk = bspRead(b3, '36', 0);
  assert(formatRead(toWire(shortWalk, 3)) === formatRead(shortWalk), 'a padded short spindle (036) labels its own walk 000 · 030 · 036');

  const pt = bspRead(b3, '36', 1);
  const ptWire = formatRead(toWire(pt, 3));
  assert(ptWire === formatRead(pt), 'a wire point prints the local point, beneath line included');

  // Floor 1 — nothing to pad; labels unchanged.
  for (const r of [bspRead(block, null, 0), bspRead(block, '4.2', -2), bspRead(block, '4', 0)]) {
    assert(formatRead(toWire(r, 1)) === formatRead(r), `floor 1 ${r.shape} labels unchanged`);
  }
  assert(formatRead(bspRead(block, null, 0)).includes('[4]: four'), 'floor 1 still prints [4]');

  // Floor 10 — the clock: its zeros are the year's own (2 → 0 → 2 → 6), so a
  // stripped wire label pads at the tail and keeps its relation to now.
  const chain: any = { _: 'the clock' };
  let u: any = chain; for (let i = 0; i < 8; i++) { u._ = { _: 'chain' }; u = u._; }
  const c10: any = { _: chain, 2: { _: { _: 'the millennium 20', 2: { _: 'the decade 202', 6: { _: 'the year 2026', 4: { _: 'season', 1: { _: 'month', 1: { _: 'week' } } } } } } } };
  for (const p of [6, 5, 4, 3]) {
    const r = bspRead(c10, null, p);
    const w = formatRead(toWire(r, 10));
    assert(w === formatRead(r), `a wire clock disc at pscale ${p} prints what the local one prints`);
  }
  const yr = formatRead(toWire(bspRead(c10, null, 6), 10));
  assert(yr.includes('[2026000000]') && /\[2026000000\] \(/.test(yr), 'the year prints full width with its relation to now');
  const walk = bspRead(c10, '2026411000', null);
  assert(formatRead(toWire(walk, 10)) === formatRead(walk), 'a wire clock walk prints what the local walk prints');
}

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nall green');
