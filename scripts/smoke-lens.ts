/** Smoke — the lens (function:lens): follows read off lists, the moments at a
 *  beat, the principals under an address, and one LIVE composition of the shot
 *  at the open Brackenfoot table (read-only, writes nothing). */
import { followsIn, momentsIn, principalsUnder, lensLaw, composeLensMedium, lensVoice } from '../src/tools/lens.js';
import { handleStreamEngage } from '../src/tools/stream.js';
import { Block } from '../src/bsp.js';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) pass++; else { fail++; console.error('  FAIL', m); } };

// follows — branch 4, rank as depth
const lists = { _: 'lists', '4': { _: 'follows', '1': { _: 'happyseaurchin', '1': { _: 'Mark Beall', '1': { _: 'limner' } } } } } as unknown as Block;
ok(followsIn(lists).join(',') === 'happyseaurchin,Mark Beall,limner', 'three follows in rank order');
ok(followsIn({ _: 'x' } as unknown as Block).length === 0, 'no branch 4, no follows');

// the law speaks
ok(lensLaw({ _: 'l', '2': 'FOLLOWING — …', '6': 'THE RECIPE MOUNTED — …' } as unknown as Block).following, 'FOLLOWING read at 2');
ok(lensLaw({ _: 'l', '6': { _: 'THE RECIPE MOUNTED — …' } } as unknown as Block).recipe, 'the recipe read through an object');
ok(!lensLaw({ _: 'l', '2': 'the second branch' } as unknown as Block).following, 'another family is not a lens');

// moments at a beat — the span [start, end)
const pool = { _: 'room', '1': { _: 'early', '1': 'A', '3': '2026-09-29T13:30:00Z' }, '2': { _: 'in the beat\nWAY 130', '1': 'B', '3': '2026-09-29T13:51:00Z', '5': 'B,C' }, '3': { _: 'late', '1': 'C', '3': '2026-09-29T14:10:00Z' } } as unknown as Block;
const ms = momentsIn(pool, '130', new Date('2026-09-29T13:38:00Z'), new Date('2026-09-29T13:56:00Z'));
ok(ms.length === 1 && ms[0].who === 'B' && ms[0].text === 'in the beat' && ms[0].woven.join() === 'B,C', `one moment in the beat, its WAY line dropped (${ms.length})`);

// the principals under an address — a pointer followed, parts when three or fewer
const people = { _: { _: { _: 'law' } }, '1': { _: 'village', '3': { _: 'house', '1': { _: 'room', '1': { _: { _: 'The factor — small', '1': { _: 'state' } }, '1': 'His head — big', '4': 'legs' }, '2': { _: 'The reeve — tall', '1': 'His head — long' } }, '2': { _: 'bed-chamber', '1': { _: 'The sergeant — vast' } } } }, '2': { _: 'road', '1': { _: 'slip', '1': { _: 'crossing', '3': 'Some days a stooped man — people:brackenfoot:131.2' } } } } as unknown as Block;
const under = principalsUnder(people, '130');
ok(under.includes('The factor — small His head — big') && !under.includes('legs') && under.includes('The sergeant — vast'), 'a building: every room beneath, parts without the legs');
ok(!under.includes('state'), 'a state behind the zero never rides in the unchanging lines');
ok(principalsUnder(people, '211').includes('Some days a stooped man — The reeve — tall His head — long'), 'a pointer is followed to the person');
ok(lensVoice({ _: { _: 'deep' } }) === 'deep', 'a voice through the zero');

// LIVE — the open table's lens: the snapshot by follows, and the shot
const TABLE = 'https://beach.happyseaurchin.com/w/brackenfoot-open';
const read = await handleStreamEngage({ field: 'lens', handle: 'weft', beach: TABLE, at: '2026-09-29T13:51+00:00' });
const text = read.content[0].text;
ok(text.includes('weft (you):') && text.includes('pool:130:4'), 'weft reads its own lens line at the moment');
ok(!/lenses? stand here that you do not follow/.test(text), 'nothing unfollowed stands yet');
const shot = await handleStreamEngage({ field: 'lens', handle: 'weft', beach: TABLE, at: '2026-09-29T13:51+00:00', tier: 'medium' });
const st = shot.content[0].text;
for (const mark of ['# THE CALL — the shot at lens:2026335162', '[THE RECIPE — ways:stills 6]', 'THE DIRECTION', 'pool:130:4', 'The factor', 'Ugarth', '[THE LOOK]', '# THE CLAIM', "keep='personal'"]) ok(st.includes(mark), `the shot carries ${mark}`);
ok(/face: https?:\/\//.test(st), "Ugarth's face rides as a link");
console.log(`\n${pass} pass, ${fail} fail · the shot is ${st.length} chars`);
if (process.argv.includes('--show')) console.log('\n' + st);
if (fail) process.exit(1);
