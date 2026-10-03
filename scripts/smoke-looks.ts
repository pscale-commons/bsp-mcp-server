/** smoke:looks — the reflection, pure: two sessions at one block see each
 *  other's looks by name once the play door has named them, nearest address
 *  first; a different block, a different beach, or the window's end shows
 *  nothing; sentinels are the caller's business (bsp.ts skips them). */
import { declareHand, lateralLine, nameAtTheDoor, noteLook, resetLooks, sharedPrefix, reflect, LOOKS_WINDOW_MS } from '../src/looks.js';

let fails = 0;
function check(name: string, ok: boolean, got?: string): void {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got: ${got}`}`);
  if (!ok) fails++;
}

const B = 'https://beach.happyseaurchin.com';
const t0 = 1_000_000;

resetLooks();
// A walks in as cowrie; B never plays.
declareHand('A', 'cowrie');
noteLook('A', B, 'pool:sand-trial', '4.2', false, t0);
noteLook('B', B + '/', 'pool:sand-trial', '4.26', false, t0 + 5_000);
noteLook('C', B, 'pool:sand-trial', '7', true, t0 + 8_000);

const forB = lateralLine('B', B, 'pool:sand-trial', '4.26', t0 + 10_000);
check('B sees cowrie and someone, self excluded', /2 others/.test(forB) && /cowrie looked at 4\.2 \(10s ago\)/.test(forB) && /someone wrote at 7 \(2s ago\)/.test(forB) && !/4\.26/.test(forB), forB);
check('nearest address first', forB.indexOf('cowrie') < forB.indexOf('someone'), forB);

const forA = lateralLine('A', B, 'pool:sand-trial', '4.2', t0 + 10_000);
check('A sees the anonymous looker by address', /someone looked at 4\.26/.test(forA), forA);

check('another block is another room', lateralLine('B', B, 'pool:cowrie', null, t0 + 10_000) === '');
check('another beach is another room', lateralLine('B', 'https://beach.idiothuman.com', 'pool:sand-trial', null, t0 + 10_000) === '');
check('the window closes', lateralLine('B', B, 'pool:sand-trial', null, t0 + LOOKS_WINDOW_MS + 20_000) === '');

// Naming applies within the window even to looks made before the door.
resetLooks();
noteLook('D', B, 'passport:marram', null, false, t0);
declareHand('D', 'turnstone');
const late = lateralLine('E', B, 'passport:marram', null, t0 + 1_000);
check('a hand named after its look is named in the line', /turnstone looked at the root/.test(late), late);

check('sharedPrefix ignores the decimal', sharedPrefix('4.26', '4.2') === 2 && sharedPrefix('4.26', '5') === 0 && sharedPrefix('', '4') === 0);

// reflect() appends to the last text and never throws.
resetLooks();
noteLook('X', B, 'pool:weft', null, false, Date.now());
const res = reflect({ content: [{ type: 'text', text: 'ack' }] }, 'Y', B, 'pool:weft', null, false);
check('reflect appends the line to the ack', res.content[0].text.startsWith('ack\n[here now — 1 other'), res.content[0].text);
const quiet = reflect({ content: [{ type: 'text', text: 'ack' }] }, 'Y', B, 'pool:nobody', null, false);
check('reflect leaves a quiet ack alone', quiet.content[0].text === 'ack', quiet.content[0].text);

// A door that is given a name keeps it; an anonymous tab and a URL are not names.
resetLooks();
nameAtTheDoor('M', 'happyseaurchin');
nameAtTheDoor('N', 'anon-p4o9h3');
nameAtTheDoor('O', 'https://beach.happyseaurchin.com');
nameAtTheDoor('P', undefined);
noteLook('M', B, 'pool:weft', null, false, t0);
noteLook('N', B, 'pool:weft', null, false, t0);
noteLook('O', B, 'pool:weft', null, false, t0);
const named = lateralLine('Q', B, 'pool:weft', null, t0 + 1_000);
check('a room engage names the session; an anon tab and a URL stay someone', /happyseaurchin looked/.test(named) && (named.match(/someone looked/g) || []).length === 2 && !/anon-/.test(named), named);

console.log(fails === 0 ? '\nsmoke:looks — all pass' : `\nsmoke:looks — ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
