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

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nall green');
