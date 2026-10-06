/** smoke:shapes — the four shapes of 2026-10-06, pure: a read a window cannot
 *  carry is refused with the shape named; the owed span rides an append's
 *  ack; a manifest ref follows a landing; unvoiced containers collapse. */
import { tooLarge, spanLines, nextRef, WINDOW_CHARS } from '../src/tools/bsp';
import { closedContainerLines } from '../src/tools/pool';
import { formatRead, bspRead } from '../src/bsp-fn';
import { situationOf } from '../src/tools/play';
import { writeAt } from '../src/bsp';
import { momentToAddress } from '../src/temporal';

let fails = 0;
const check = (name: string, ok: boolean, got?: unknown) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || got === undefined ? '' : `\n      got: ${JSON.stringify(got)?.slice(0, 300)}`}`); if (!ok) fails++; };

// a read that fits is untouched
check('a read that fits passes', tooLarge({ shape: 'disc', pscale: 0, entries: [{ address: '001' }] }, 'x'.repeat(1000)) === null);
// a disc too large names the latest container and the pscale beneath
const big = tooLarge({ shape: 'disc', pscale: 0, entries: [{ address: '001' }, { address: '372' }, { address: '381' }] }, 'x'.repeat(WINDOW_CHARS + 1));
check('a disc too large is refused with the latest container named', !!big && /spindle='380', pscale_attention=-1/.test(big) && /every entry it ever took/.test(big), big);
const whole = tooLarge({ shape: 'block' }, 'x'.repeat(WINDOW_CHARS + 1));
check('a whole block too large is refused with a spindle or a coarser disc named', !!whole && /Walk a spindle/.test(whole) && /pscale_attention=1/.test(whole), whole);

// the owed span, from a floor-3 accumulator
// a floor-3 accumulator: the root's underscore chain is three deep, 541 is 5 → 4 → 1
const block: any = { _: { _: { _: 'the pile' } }, 5: { _: '', 4: { _: '', 1: { _: 'bobble.1, continued — the road', 3: 'ts' }, 2: 'fix.1 — the mirror pane', 3: 'cards.1 — a clock per card', 9: 'animations.1 builds the first path' } } };
const span = spanLines(block, [{ slot: '550', over: '541-549' }]);
check('the owed span lists the entries by their opening lines, zero slots skipped', /the span of 550/.test(span) && /541 bobble\.1/.test(span) && /549 animations\.1/.test(span) && !/540/.test(span), span);
check('no span when the range is not a span', spanLines(block, [{ slot: '550', over: 'x' }]) === '');

// the bundle follows the record
check('a ref to the same block moves to the landing', nextRef('history:happyseaurchin:296:0', 'history:happyseaurchin', '299') === 'history:happyseaurchin:299:0');
check('a ref beneath an entry keeps its decimal', nextRef('watch:weft:551:-1', 'watch:weft', '551.6') === 'watch:weft:551.6:-1');
check('another block\'s ref is left alone', nextRef('orientation:weft:0:0', 'history:weft', '12') === null);
check('a ref already there is left alone', nextRef('history:weft:12:0', 'history:weft', '12') === null);
check('prose in a slot is left alone', nextRef('The roster: passport shell …', 'history:weft', '12') === null);

// unvoiced containers collapse
const closed = [{ span: '001-009', entries: 9, summary: 'The first nine.' }, { span: '011-019', entries: 9, summary: null }, { span: '021-029', entries: 9, summary: null }, { span: '031-037', entries: 7, summary: null }, { span: '041-049', entries: 9, summary: 'Forty.' }];
const lines = closedContainerLines(closed);
check('a voiced container stands as its summary', lines[0] === '## 001-009 (9)' && lines[1] === 'The first nine.');
check('a run of unvoiced containers is one line', lines.some(l => /^## 011-037 — 3 closed containers unvoiced, 25 entries/.test(l)) && !lines.some(l => /SUMMARY OWED/.test(l)), lines);
check('a single unvoiced container is one line too', closedContainerLines([{ span: '011-019', entries: 9, summary: null }])[0].startsWith('## 011-019 (9) — unvoiced'));

// a walk says when its frames are empty
const walk = formatRead(bspRead(block, '541', null));
check('a walk over unpaid summaries says so once', (walk.match(/summary slot not yet paid/g) ?? []).length === 1, walk);
const flat = formatRead(bspRead({ _: 'root', 1: 'one' } as any, '1', null));
check('a floor-1 walk says nothing of frames', !/summary slot/.test(flat), flat);

// the situation rides the door — a hand's own now mirror walked at the stamp, its last say beneath
{
  const born = (text: string, floor: number) => { let n: any = text; for (let i = 0; i < floor; i++) n = { _: n }; return n; };
  const at = new Date('2026-10-06T16:20:00Z');
  const stamp = momentToAddress(at);
  const nowMirror = born('NOW — weft', 10);
  writeAt(nowMirror, '2026000000', '2026 — the year line');
  writeAt(nowMirror, stamp.slice(0, 8) + '00', 'today — the day line');
  const torus = born('TORUS — weft', 10);
  const said = new Date(at.getTime() - 5 * 60 * 1000).toISOString();
  writeAt(torus, `${momentToAddress(new Date(said))}.2`, { _: 'glass.2 — in the middle of the test', 6: said, 3: said });   // a say lands at the beat of its own instant
  const sit = situationOf('weft', nowMirror, torus, said, at);
  check('the situation walks the now mirror at the stamp: the year and the day ride above the beat', !!sit && /the year line/.test(sit!) && /the day line/.test(sit!) && /summary slot not yet paid/.test(sit!), sit);
  check('the last say rides beneath with its lane and its age', !!sit && /lane 2: glass\.2 — in the middle of the test \(5m ago\)/.test(sit!), sit);
  check('a hand with no now mirror and no say is handed nothing here', situationOf('nobody', null, null, null, at) === null);
  check('a say alone, no now mirror, still rides', /lane 2/.test(situationOf('weft', null, torus, said, at) ?? ''));
}

console.log(fails === 0 ? '\nsmoke:shapes — all pass' : `\nsmoke:shapes — ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
