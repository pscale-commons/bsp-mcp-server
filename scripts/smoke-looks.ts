/** smoke:looks — the reflection, pure. Every other session on the beach is
 *  heard, nearest first — this block by address, then a block of the same hand
 *  or field, then elsewhere — and only what has changed since the listener was
 *  last told. Another beach, a table, or the window's end shows nothing. A door
 *  that is given a name keeps it. Sentinels are the caller's business (bsp.ts
 *  skips them). */
import { declareHand, lateralLine, nameAtTheDoor, near, noteLook, resetLooks, sharedPrefix, reflect, LOOKS_WINDOW_MS } from '../src/looks.js';

let fails = 0;
function check(name: string, ok: boolean, got?: string): void {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got: ${got}`}`);
  if (!ok) fails++;
}

const B = 'https://beach.happyseaurchin.com';
const t0 = 1_000_000;

// ── one block: named and unnamed, self excluded, nearest address first ──
resetLooks();
declareHand('A', 'cowrie');
noteLook('A', B, 'pool:sand-trial', '4.2', false, t0);
noteLook('B', B + '/', 'pool:sand-trial', '4.26', false, t0 + 5_000);
noteLook('C', B, 'pool:sand-trial', '7', true, t0 + 8_000);
const forB = lateralLine('B', B, 'pool:sand-trial', '4.26', t0 + 10_000);
check('B hears cowrie and someone, itself excluded', /2 others on this beach/.test(forB) && /cowrie looked at 4\.2 \(10s ago\)/.test(forB) && /someone wrote at 7 \(2s ago\)/.test(forB) && !/4\.26/.test(forB), forB);
check('nearest address first', forB.indexOf('cowrie') < forB.indexOf('someone'), forB);

// ── only what has changed ──
check('nothing new, nothing said', lateralLine('B', B, 'pool:sand-trial', '4.26', t0 + 12_000) === '');
noteLook('C', B, 'pool:sand-trial', '4', false, t0 + 14_000);
const moved = lateralLine('B', B, 'pool:sand-trial', '4.26', t0 + 15_000);
check('a move is said, and only the move', /2 others on this beach/.test(moved) && /new since you last looked/.test(moved) && /someone looked at 4 \(1s ago\)/.test(moved) && !/cowrie/.test(moved), moved);

// ── beach-wide: this block, then a near block, then elsewhere ──
resetLooks();
declareHand('A', 'weft');
declareHand('K', 'keel');
noteLook('A', B, 'watch:weft', '515', true, t0);
noteLook('K', B, 'pool:keel', '26', false, t0 + 1_000);
noteLook('H', B, 'shell:weft', '5.3', false, t0 + 2_000);
const wide = lateralLine('Z', B, 'shell:weft', '5.6', t0 + 3_000);
check('everyone on the beach is heard', /3 others on this beach/.test(wide) && !/new since/.test(wide), wide);
check('this block first, by its address alone', /someone looked at 5\.3 \(1s ago\)/.test(wide) && wide.indexOf('5.3') < wide.indexOf('watch:weft'), wide);
check('a near block is named, before one elsewhere', /weft wrote at watch:weft 515/.test(wide) && /keel looked at pool:keel 26/.test(wide) && wide.indexOf('watch:weft') < wide.indexOf('pool:keel'), wide);
check('near is of the same hand or field, never a shared role', near('shell:weft', 'watch:weft') && near('spine:now', 'now:weft') && near('now', 'spine:now') && !near('pool:weft', 'pool:keel') && !near('market', 'pool:alder'));

// ── another beach is another room; a table is its own beach; the window closes ──
check('another beach is another room', lateralLine('Z2', 'https://beach.idiothuman.com', 'shell:weft', null, t0 + 3_000) === '');
check('a table is its own beach', lateralLine('Z3', B + '/w/torus-market', 'market', null, t0 + 3_000) === '');
check('the window closes', lateralLine('Z4', B, 'shell:weft', null, t0 + LOOKS_WINDOW_MS + 20_000) === '');

// ── still there a window later: told again ──
resetLooks();
noteLook('A', B, 'pool:x', null, false, t0);
check('told once', /1 other on this beach/.test(lateralLine('L', B, 'pool:x', null, t0 + 1_000)));
noteLook('A', B, 'pool:x', null, false, t0 + LOOKS_WINDOW_MS + 5_000);
const again = lateralLine('L', B, 'pool:x', null, t0 + LOOKS_WINDOW_MS + 6_000);
check('still there a window later, told again', /someone looked at the root/.test(again), again);

// ── a crowd: five said, the rest counted, and the next call says them ──
resetLooks();
for (let i = 1; i <= 8; i++) noteLook('S' + i, B, 'pool:crowd', String(i), false, t0 + i);
const crowd1 = lateralLine('Q', B, 'pool:crowd', null, t0 + 100);
check('five said and three counted', /8 others on this beach/.test(crowd1) && /\+3 more\]/.test(crowd1) && (crowd1.match(/looked at/g) || []).length === 5, crowd1);
const crowd2 = lateralLine('Q', B, 'pool:crowd', null, t0 + 200);
check('the next call says the rest', (crowd2.match(/looked at/g) || []).length === 3 && !/more\]/.test(crowd2), crowd2);
check('and then silence', lateralLine('Q', B, 'pool:crowd', null, t0 + 300) === '');

// ── names ──
resetLooks();
noteLook('D', B, 'passport:marram', null, false, t0);
declareHand('D', 'turnstone');
const late = lateralLine('E', B, 'passport:marram', null, t0 + 1_000);
check('a hand named after its look is named in the line', /turnstone looked at the root/.test(late), late);

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

check('sharedPrefix ignores the decimal', sharedPrefix('4.26', '4.2') === 2 && sharedPrefix('4.26', '5') === 0 && sharedPrefix('', '4') === 0);

// ── reflect() appends to the last text and never throws ──
resetLooks();
noteLook('X', B, 'pool:weft', null, false, Date.now());
const res = reflect({ content: [{ type: 'text', text: 'ack' }] }, 'Y', B, 'pool:weft', null, false);
check('reflect appends the line to the ack', res.content[0].text.startsWith('ack\n[here now — 1 other on this beach'), res.content[0].text);
const quiet = reflect({ content: [{ type: 'text', text: 'ack' }] }, 'Y', 'https://beach.idiothuman.com', 'pool:nobody', null, false);
check('reflect leaves a quiet ack alone', quiet.content[0].text === 'ack', quiet.content[0].text);

console.log(fails === 0 ? '\nsmoke:looks — all pass' : `\nsmoke:looks — ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
