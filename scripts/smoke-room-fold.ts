/**
 * smoke-room-fold.ts — THE FOLD: a pool delivered as the mirror folds it.
 * Closed containers stand as their summary lines; the open container rides whole.
 *   npm run smoke:room-fold
 */
import { foldContributions, foldedAccountText, collectContributions, coveredThrough } from '../src/tools/pool.js';
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
  ok('an unpaid summary is said, never hidden', owed.includes('## 01-09 (9) — unvoiced: its summary is owed'));
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

console.log('\nTHE MARKER — read by one spindle to the head, never from the first entry');
{
  // An account past 200 entries, as weft's was on 9 November 2026: the older
  // tellings located at pool:weft:345, the newest at pool:weft:413. The walk
  // from the first entry stopped at 200 and named 345.
  let acct: Block = { _: 'history:weft' } as Block;
  const at: string[] = [];
  for (let i = 1; i <= 290; i++) {
    const slot = i <= 150 ? 'pool:weft:345' : i >= 282 ? 'pool:weft:413' : null;
    const r = appendWithSupernest(acct, { _: `lane ${i}`, 1: 'weft', ...(slot ? { 2: slot } : {}) });
    acct = r.block;
    at.push(r.address);
  }
  const head = at[at.length - 1];
  const node = (b: Block, a: string) => a.split('').reduce((n: any, d) => n?.[d], b as any);
  const ringOf = (a: string) => at.filter((x) => x.length === a.length && x.slice(0, -1) === a.slice(0, -1));
  ok('the account stands past 200 entries, at floor 3', at.length > 200 && head.length === 3, head);
  ok('the walk from the first entry would have named 345', collectContributions(acct, 0).contributions.length === 200
    && collectContributions(acct, 0).contributions.every((c) => c.address !== 'pool:weft:413'));
  ok('the newest telling names the slot: 413', coveredThrough(acct, 'weft') === 413, String(coveredThrough(acct, 'weft')));
  ok('another room is not this one', coveredThrough(acct, 'keel') === 0);

  const headless: Block = JSON.parse(JSON.stringify(acct));
  delete node(headless, head)['2'];
  ok('a head that names no slot is answered by its ring at pscale 0', coveredThrough(headless, 'weft') === 413);

  const ringless: Block = JSON.parse(JSON.stringify(acct));
  for (const a of ringOf(head)) delete node(ringless, a)['2'];
  const before = at[at.indexOf(ringOf(head)[0]) - 1];
  for (const a of ringOf(before)) node(ringless, a)['2'] = 'pool:weft:400';
  ok('a ring that names none is passed for the ring before it', coveredThrough(ringless, 'weft') === 400, `${head} ${before} ${coveredThrough(ringless, 'weft')}`);

  let small: Block = { _: 'history:probe' } as Block;
  for (let i = 1; i <= 4; i++) small = appendWithSupernest(small, { _: `telling ${i}`, 1: 'probe', 2: `pool:211:${i}` }).block;
  ok('a floor-1 account is its own ring', coveredThrough(small, '211') === 4);
  ok('an account with no slot for the room, or none at all, is 0', coveredThrough({ _: 'empty' } as Block, 'weft') === 0 && coveredThrough(null, 'weft') === 0);
}

console.log('\nTHE DOOR\'S FOLD — one spindle to the head and the ring there, never every container');
{
  // A room past 200 entries at floor 3, its summaries paid: the door's fold, read
  // with no marker, walks the greatest digit at each rung and stops at the head.
  let big: Block = { _: 'pool:probe' } as Block;
  const at: string[] = [];
  for (let i = 1; i <= 290; i++) {
    const r = appendWithSupernest(big, { _: `beat ${i}`, 1: 'someone' });
    big = r.block;
    at.push(r.address);
  }
  const head = at[at.length - 1];
  const old = foldContributions(big, 0);
  ok('the walk from the first entry stops at 200, its open container stale', old.open[old.open.length - 1].position < Number(head), `${old.open[old.open.length - 1].position} vs head ${head}`);
  const f = foldContributions(big, 0, undefined, { spindle: true });
  ok('the door\'s fold is the spindle', f.spindle === true && f.folded === true);
  ok('its open container ends at the head', f.open.length > 0 && f.open[f.open.length - 1].position === Number(head), `${f.open[f.open.length - 1]?.position} vs ${head}`);
  ok('and holds only the head\'s container', f.open.every((c) => String(c.position).padStart(3, '0').slice(0, 2) === head.slice(0, 2)));
  ok('one summary per rung above the floor, coarsest first', f.closed.length === 2 && f.closed[1].span.endsWith('9') && f.closed[0].span.endsWith('90'), JSON.stringify(f.closed.map((c) => c.span)));
  ok('each names the span before it at its rung', f.closed[1].span === `${head.slice(0, 1)}${Number(head[1]) - 1}1-${head.slice(0, 1)}${Number(head[1]) - 1}9`, f.closed[1].span);

  // A floor-2 room of 81: the eight containers' summaries no longer all ride.
  let mid: Block = { _: 'pool:probe' } as Block;
  for (let i = 1; i <= 81; i++) mid = appendWithSupernest(mid, { _: `beat ${i}`, 1: 'someone' }).block;
  const m = foldContributions(mid, 0, undefined, { spindle: true });
  ok('a floor-2 room folds to its last summary and its open container', m.spindle === true && m.closed.length === 1 && m.closed[0].span === '71-79' && m.open.length === 9, JSON.stringify({ closed: m.closed.map((c) => c.span), open: m.open.length }));
  ok('where the old fold listed every closed container', foldContributions(mid, 0).closed.length === 8);
  ok('with a marker, the reader reads forward as before', foldContributions(big, 150, undefined, { spindle: true }).spindle !== true);
}

console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
if (fail > 0) process.exit(1);
