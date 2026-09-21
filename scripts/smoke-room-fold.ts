/**
 * smoke-room-fold.ts — THE FOLD: a pool delivered as the mirror folds it.
 * Closed containers stand as their summary lines; the open container rides whole.
 *   npm run smoke:room-fold
 */
import { foldContributions, foldedAccountText, collectContributions } from '../src/tools/pool.js';
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

console.log('\nTHE FOLD — a handle\'s account at the play door');
{
  // A character's account: each entry a telling, located at the beat it tells.
  let young: Block = { _: 'history:probe' } as Block;
  for (let i = 1; i <= 5; i++) young = appendWithSupernest(young, { _: `telling ${i}`, 1: 'probe', 2: `pool:211:${i}` }).block;
  ok('an account that has not folded is left to the door as it always was', foldedAccountText(young, 'history:probe') === null);

  let grown: Block = { _: 'history:probe' } as Block;
  for (let i = 1; i <= 12; i++) grown = appendWithSupernest(grown, { _: `telling ${i}`, 1: 'probe', 2: `pool:211:${i}` }).block;
  const owed = foldedAccountText(grown, 'history:probe') ?? '';
  ok('a grown account folds', owed.length > 0);
  ok('the open span rides whole, each telling with the beat it tells', owed.includes('[11 · pool:211:10] telling 10') && owed.includes('[13 · pool:211:12] telling 12'), owed);
  ok('a closed span\'s tellings do not ride', !owed.includes('telling 3'));
  ok('an unpaid summary is said, never hidden', owed.includes('## 01-09 (9) — SUMMARY OWED'));
  ok('the reader is told where the rest is', owed.includes('a spindle read of history:probe'));

  const paid: Block = JSON.parse(JSON.stringify(grown));
  (paid as any)['1']._ = 'Came down to the ford and crossed it whole.';
  const told = foldedAccountText(paid, 'history:probe') ?? '';
  ok('a paid summary stands for its span', told.includes('## 01-09 (9)\nCame down to the ford and crossed it whole.') && !told.includes('SUMMARY OWED'));

  // NOTHING RIDES TWICE: where the room above already carries the newest
  // tellings whole, the account leaves them there and the rest of the open span
  // arrives as a disc — each entry by its opening line, at its own position.
  let long: Block = { _: 'history:probe' } as Block;
  const prose = (i: number) => `telling ${i} opens here.\n\n${'and then it runs on at length, paragraph after paragraph. '.repeat(6)}`;
  for (let i = 1; i <= 15; i++) long = appendWithSupernest(long, { _: prose(i), 1: 'probe', 2: `pool:211:${i}` }).block;
  const once = foldedAccountText(long, 'history:probe', 3) ?? '';
  ok('the tellings the room already carries are not delivered again', !once.includes('telling 14 opens') && !once.includes('telling 15 opens') && !once.includes('telling 13 opens'));
  ok('the open span before them rides by opening line, one line each, at its position', /\[11 · pool:211:10\] telling 10 opens here\. and then it runs on[^\n]*…\n/.test(once + '\n') && once.includes('[13 · pool:211:12]'), once.slice(-600));
  ok('and says so, with where a telling whole is read', once.includes('the last 3 ride whole above') && once.includes('a spindle read of history:probe'));
  const youngOnce = foldedAccountText(young, 'history:probe', 3) ?? '';
  ok('an account too young to fold is delivered the same way, never as its JSON', youngOnce.includes('[1 · pool:211:1] telling 1') && youngOnce.includes('[2 · pool:211:2] telling 2') && !youngOnce.includes('telling 3'));
}

console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
if (fail > 0) process.exit(1);
