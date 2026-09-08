/**
 * smoke-room-fold.ts — THE FOLD: a pool delivered as the mirror folds it.
 * Closed containers stand as their summary lines; the open container rides whole.
 *   npm run smoke:room-fold
 */
import { foldContributions, collectContributions } from '../src/tools/pool.js';
import { appendWithSupernest } from '../src/accumulator.js';
import type { Block } from '../src/bsp.js';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean, d = '') => { if (c) { pass++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}${d ? ' — ' + d : ''}`); } };

// Build a room of 12 entries: floor 1 fills at 9, supernests, 10-12 land at 11,12,13.
let room: Block = { _: 'the room — its purpose' } as Block;
for (let i = 1; i <= 12; i++) {
  const r = appendWithSupernest(room, { _: `entry ${i}`, 1: 'someone', 3: '2026-09-08T00:00:00Z' });
  room = r.block;
}

console.log('\nTHE FOLD — geometry');
{
  const all = collectContributions(room, 0).contributions;
  ok('twelve entries are all present unfolded', all.length === 12);
  const f = foldContributions(room, 0);
  ok('the room folds', f.folded);
  ok('one closed container', f.closed.length === 1, `got ${f.closed.length}`);
  ok('the closed container covers the first nine', f.closed[0].entries === 9 && f.closed[0].span === '01-09', JSON.stringify(f.closed[0]));
  ok('the open container rides whole (three entries)', f.open.length === 3 && f.open[0].text === 'entry 10');
  ok('an unpaid summary is reported as owed, never blank', f.closed[0].summary === null);
}

console.log('\nTHE FOLD — a paid summary stands for its span');
{
  const paid: Block = JSON.parse(JSON.stringify(room));
  // the summary of 01-09 lives at the NEXT container's underscore (node '1'), per 3.5
  (paid as any)['1']._ = 'Summary of 01-09 — the room opened and found its shape.';
  const f = foldContributions(paid, 0);
  ok('the voicing is delivered as the span', f.closed[0].summary?.startsWith('Summary of 01-09'));
  ok('the open container is unchanged', f.open.length === 3);
}

console.log('\nTHE FOLD — what it refuses to do');
{
  let f1: Block = { _: 'a young room' } as Block;
  for (let i = 1; i <= 4; i++) f1 = appendWithSupernest(f1, { _: `e${i}`, 1: 'a' }).block;
  ok('a floor-1 room does not fold — there are no containers', foldContributions(f1, 0).folded === false);
  ok('a floor-1 room still returns its entries', foldContributions(f1, 0).open.length === 4);
  const marked = foldContributions(room, 9);
  ok('a holder past the first nine folds nothing — one container left', marked.folded === false);
  ok('and reads only forward from the marker', marked.open.length === 3);
}

console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
if (fail > 0) process.exit(1);
