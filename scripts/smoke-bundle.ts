/** smoke:bundle — THE BUNDLE IS A SHAPE, AND THE CLOCK CUTS IT (2026-10-11).
 *
 *  Offline. A node of references read through bsp() compiles into one window,
 *  the index first; `now` walks a clock block at the current beat and `head`
 *  an accumulator at its newest entry; a reader's last stamp cuts a clock walk
 *  at the rung where the two addresses diverge — the period elapsed, read as a
 *  pscale — and the touched map decides which other members ride; a seated
 *  session's acks carry only what moved, and a clock block touched within the
 *  same beat delivers the beat and its lanes. The real handlers run against a
 *  small fake beach. Run: npm run smoke:bundle */

const ORIGIN = 'https://smoke-bundle.test';
process.env.DEFAULT_BEACH = ORIGIN;
process.env.ORIENTATION_INDEX_TTL_MS = '0';

import { floorDepth, parseSpindle, type Block } from '../src/bsp.js';
import { momentToAddress, addressToSpan, voiceAddress } from '../src/temporal.js';
import { SENTINELS } from '../src/sentinels.js';
import {
  parseBundleRef, looksLikeBundle, isEntryNode, divergencePscale, cutClockWalk, headAddress,
  compileBundle, renderBundle, renderMemberBody, memberLabel, handleOfBlock, rungName, clockRange,
  type BlockLoader, type Member, type ClockLine,
} from '../src/bundle.js';
import type { PathWalkEntry } from '../src/bsp-fn.js';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string, got?: string) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}${got ? `\n      got: ${got.slice(0, 400)}` : ''}`); } };

// ── fixtures ────────────────────────────────────────────────────────────────
const beachWrite = (block: any, address: string, value: any) => {
  const { digits } = parseSpindle(address, floorDepth(block));
  let node = block;
  for (let i = 0; i < digits.length - 1; i++) {
    const k = digits[i] === '0' ? '_' : digits[i];
    if (typeof node[k] === 'string') node[k] = { _: node[k] };
    else if (!node[k] || typeof node[k] !== 'object') node[k] = {};
    node = node[k];
  }
  const last = digits[digits.length - 1] === '0' ? '_' : digits[digits.length - 1];
  if (typeof value === 'string' && node[last] && typeof node[last] === 'object') node[last]._ = value;
  else node[last] = value;
};
const clockBlock = (): Block => { let n: any = 'now:weft — the clock'; for (let i = 0; i < 10; i++) n = { _: n }; return n; };

const NOW = new Date('2026-10-11T09:29:34Z');          // 2026412446 — Sunday 11 October 2026, morning (beat 6)
const STAMP = momentToAddress(NOW);
ok(STAMP === '2026412446', `the fixture instant is ${STAMP}`);

const nowWeft = clockBlock();
ok(floorDepth(nowWeft) === 10, 'a synthetic clock block stands at floor 10');
beachWrite(nowWeft, '2026000000', '2026 — the year the substrate grew its doors');
beachWrite(nowWeft, '2026410000', 'October — outreach first, development in the back seat');
beachWrite(nowWeft, '2026412400', 'Sunday 11 October — swept at first light');
beachWrite(nowWeft, '2026412446', 'the beat line — lane 6 orienting');
const STAMP3 = momentToAddress(NOW, 3);
beachWrite(nowWeft, STAMP3, { _: 'the line at the instant', '3': NOW.toISOString() });

const ruleTwo = 'TWO INVERSIONS: a pscale block inverts coding — the nesting IS the data, so structure does the work a program would; and the beach inverts operationality — it is the trace of persons acting, so the measure of any work is what a person met, never a count.';
const store: Record<string, any> = {
  'orientation:weft': { _: 'the nine rules — the whole boot as a disc', '1': 'ONE: continuity lives in blocks', '2': ruleTwo },
  'purpose:weft': { _: 'weft\'s forward intention', '1': 'tend the working surfaces' },
  'history:weft': {
    _: { _: 'weft\'s history — the record' },
    '1': { _: 'summary of 11–19', '1': { _: 'entry 11', '3': '2026-10-01T00:00:00Z' }, '9': { _: 'entry 19', '3': '2026-10-05T00:00:00Z' } },
    '2': { '1': { _: 'entry 21', '3': '2026-10-09T00:00:00Z' }, '2': { _: 'entry 22 — the newest', '3': '2026-10-10T12:08:00Z' } },
  },
  'now:weft': nowWeft,
  'shell:weft': {
    _: 'weft\'s shell',
    '3': { _: 'the manifest', '1': 'orientation:weft:0:0', '2': 'history:weft:head', '3': 'purpose:weft:0:0', '5': 'now:weft:now', '7': 'The organs, every one a :weft block', '8': 'torus-mirror:weft:now' },
    '7': { _: 'a list that is not a bundle', '1': 'Monday', '2': 'Tuesday' },
    '8': { _: 'an entry', '1': 'weft', '2': 'spine:views', '3': '2026-07-30T16:52:52.473Z', '4': 'designer' },
    '9': { _: 'metadata', '1': 'v1' },
  },
  'purpose:egg-one': { _: 'egg-one\'s purpose', '1': 'reach' },
  'conditions:egg-one': { _: 'egg-one\'s conditions' },
  'reflexive:egg-one': { _: 'the mechanism', '9': { _: 'the current', '1': 'sunstone', '2': 'purpose', '3': 'conditions' } },
};
const teaching = new Map<string, Block>();
for (const s of SENTINELS) teaching.set(s.name, s.json as Block);
const memLoad: BlockLoader = async (name) => (teaching.get(name) ?? store[name] ?? null) as Block | null;

console.log('\nA. the reference, with its two words');
const r1 = parseBundleRef('orientation:weft:0:0');
ok(!!r1 && r1.name === 'orientation:weft' && r1.address === null && r1.attention === 0 && r1.word === null, 'name:0:att is the root at an attention');
const r2 = parseBundleRef('now:weft:now');
ok(!!r2 && r2.name === 'now:weft' && r2.word === 'now' && r2.attention === null, "name:now is the clock's current beat");
const r3 = parseBundleRef('history:weft:head:0');
ok(!!r3 && r3.name === 'history:weft' && r3.word === 'head' && r3.attention === 0, "name:head:att is the newest entry at an attention");
ok(parseBundleRef('now:weft:now:-1')?.attention === -1, 'a negative attention after a word');
ok(parseBundleRef('The organs, every one a :weft block') === null, 'prose is not a reference');
ok(parseBundleRef('2026-10-10T09:47:17Z') === null, 'a stamp is not a reference');
ok(parseBundleRef('sunstone')?.name === 'sunstone', 'a bare name is a reference');
ok(parseBundleRef('')  === null && parseBundleRef(42) === null, 'empty and non-string are not');

console.log('\nB. what looks like a bundle');
ok(looksLikeBundle(store['shell:weft']['3']), 'a manifest: four refs and one prose line');
ok(looksLikeBundle(store['reflexive:egg-one']['9']), 'a genus current: bare names');
ok(looksLikeBundle(store['shell:weft']['7']), 'a list of bare words LOOKS like one (resolution settles it)');
ok(!looksLikeBundle(store['shell:weft']['8']) && isEntryNode(store['shell:weft']['8']), 'an accumulator entry never is, whatever its fields');
ok(!looksLikeBundle(store['orientation:weft']), 'a block of prose rules is not');
ok(!looksLikeBundle('a string') && !looksLikeBundle(null), 'a leaf is not');
ok(handleOfBlock('shell:weft') === 'weft' && handleOfBlock('reflexive:egg-one') === 'egg-one' && handleOfBlock('sed:commons') === null && handleOfBlock('sunstone') === null, 'the hand is read off the block name');

console.log('\nC. the clock cut — the period elapsed as a pscale');
ok(divergencePscale('2026412371', '2026412446') === 2, 'Saturday evening to Sunday morning: from the day down');
ok(divergencePscale('2026412446', '2026412446') === null, 'the same beat: nothing on the clock changed');
ok(divergencePscale('2026411446', '2026412446') === 3, 'a week ago: from the week down');
ok(divergencePscale('2025412446', '2026412446') === 6, 'a year ago: from the year down');
ok(divergencePscale('0000000000', '2026412446') === 9, 'never here reads as the whole');
const walk: PathWalkEntry[] = Array.from({ length: 10 }, (_, i) => ({ address: STAMP.slice(0, i + 1).padEnd(10, '0'), depth: i + 1, pscale: 9 - i, content: `rung p${9 - i}` }));
const c1 = cutClockWalk(walk, '2026412371', STAMP);
ok(!c1.same && c1.from === 2 && c1.entries.map((e) => e.pscale).join(',') === '2,1,0', 'the cut keeps today, the gathering and the beat');
const c2 = cutClockWalk(walk, '2026412446', STAMP);
ok(c2.same && c2.entries.length === 0, 'the same beat keeps nothing');
const c3 = cutClockWalk(walk, '2026412446', STAMP, true);
ok(!c3.same && c3.within && c3.from === 0 && c3.entries.length === 1 && c3.entries[0].pscale === 0, 'the same beat, touched: the beat itself and nothing above');
ok(!cutClockWalk(walk, '2026412371', STAMP, true).within, 'touched across a beat change is the ordinary cut');
ok(cutClockWalk(walk, '2026411446', STAMP).entries.length === 4, 'a week ago keeps four rungs');
ok(rungName(2) === 'day' && rungName(0) === 'beat' && rungName(6) === 'year' && rungName(-3) === 'second', 'rungs by name');

console.log('\nC2. the second — fine stamps and the range');
ok(/^\d{10}\.[1-9]{3}$/.test(STAMP3) && STAMP3.startsWith(STAMP), `a fine stamp is the beat and three decimals (${STAMP3})`);
ok(momentToAddress(new Date(NOW.getTime() + 2000), 3) > STAMP3, 'two seconds on, a later stamp');
const fs = addressToSpan(STAMP3);
ok(fs.pscale === -3 && fs.start.getTime() <= NOW.getTime() && NOW.getTime() < fs.end.getTime() && fs.end.getTime() - fs.start.getTime() < 2000, 'a fine address names the second containing the instant');
ok(voiceAddress(STAMP3).includes(', second '), `a fine address voices its second (${voiceAddress(STAMP3)})`);
ok(divergencePscale('2026412446.251', '2026412446.253') === -3 && divergencePscale('2026412446.251', '2026412446.261') === -2 && divergencePscale('2026412446', '2026412446.253') === -1, 'divergence runs beneath the beat: the second, the breath, the minute');
ok(divergencePscale('2026412446.253', '2026412446.253') === null, 'the same second: nothing on the clock changed');
const clock2 = clockBlock();
const turn = (s: string) => ({ _: s, '3': '2026-10-11T09:00:00Z' });
beachWrite(clock2, '2026412400', 'the day');
beachWrite(clock2, '2026412446', 'the beat');
beachWrite(clock2, '2026412446.253', turn('said at 253'));
beachWrite(clock2, '2026412446.261', turn('said at 261'));
beachWrite(clock2, '2026412446.9', 'minute nine');
beachWrite(clock2, '2026412447.112', turn('said at 447.112'));
beachWrite(clock2, '2026412447.1121', turn('a second voice in the same second'));
const texts = (ls: ClockLine[]) => ls.map((l) => l.text).join(' | ');
ok(clockRange(clock2, '2026412446.253', '2026412446.253').length === 0, 'the same second: nothing');
ok(texts(clockRange(clock2, '2026412446.251', '2026412446.299')) === 'said at 253 | said at 261', 'within a beat: what landed after since, in order', texts(clockRange(clock2, '2026412446.251', '2026412446.299')));
ok(texts(clockRange(clock2, '2026412446.255', '2026412447.113')) === 'said at 261 | minute nine | said at 447.112 | a second voice in the same second', 'across the edge: the tail of the old beat, then the new beat down to now', texts(clockRange(clock2, '2026412446.255', '2026412447.113')));
ok(texts(clockRange(clock2, '2026412371', '2026412446.253')) === 'the day | the beat | said at 253', 'across a day: the rungs that changed, voiced, then the lines', texts(clockRange(clock2, '2026412371', '2026412446.253')));
ok(clockRange(clock2, '0000000000', '2026412446.253').length === 3, 'never here: the whole clock down to now');
ok(clockRange(clock2, '2026412447.113', '2026412447.112').length === 0, 'the clock does not run backwards');
ok(clockRange(clock2, '2026412446.253', '2026412446.253').length === 0 && clockRange(clock2, '2026412446.2531', '2026412447.1121').length === 4, 'a stamp four digits deep still ranges');

console.log('\nD. the head of an accumulator');
ok(headAddress(store['history:weft']) === '22', 'the greatest digit at every level down to the first entry');
ok(headAddress({ _: 'flat', '1': 'a', '2': 'b' }) === '2', 'an unfolded block: its greatest digit');
ok(headAddress({ _: 'empty' }) === null, 'no entries, no head');

console.log('\nE. the manifest compiled, whole and cut');
const whole = await compileBundle(store['shell:weft']['3'], { load: memLoad, handle: 'weft', now: NOW });
ok(!!whole && whole.length === 6, 'six slots, in order');
const by = (ms: Member[] | null, slot: string) => ms!.find((m) => m.slot === slot)!;
const o = by(whole, '1');
ok(o.result?.shape === 'disc' && renderMemberBody(o).includes(ruleTwo), 'the orientation disc delivers its rules WHOLE, never truncated');
const h = by(whole, '2');
ok(h.address === '22' && h.result?.shape === 'path-walk' && renderMemberBody(h).includes('entry 22 — the newest'), 'history:head walks to the newest entry');
const n = by(whole, '5');
const nb = renderMemberBody(n);
ok(n.address === STAMP3 && n.result?.shape === 'path-walk' && nb.includes('2026412400') && nb.includes('swept at first light') && nb.includes('the year the substrate grew its doors'), 'now:now walks the clock at the stamp, every rung above the beat');
ok(by(whole, '7').ref === null && renderMemberBody(by(whole, '7')) === 'The organs, every one a :weft block', 'prose rides through as written');
ok(by(whole, '8').absent && renderMemberBody(by(whole, '8')).includes('absent at this surface: torus-mirror:weft'), 'an absent block is named, never dropped');
const cut = await compileBundle(store['shell:weft']['3'], { load: memLoad, handle: 'weft', now: NOW, since: '2026412371' });
const nc = by(cut, '5');
const ncb = renderMemberBody(nc);
ok(!!nc.cut && nc.cut.from === 2 && ncb.includes('from the day down') && ncb.includes('swept at first light') && ncb.includes('the beat line — lane 6 orienting') && ncb.includes('the line at the instant') && !ncb.includes('the year the substrate grew'), 'with a last stamp from Saturday evening: the day and the beat, voiced, then the line — the rungs above not', ncb);
const same = await compileBundle(store['shell:weft']['3'], { load: memLoad, handle: 'weft', now: NOW, since: STAMP3 });
ok(by(same, '5').cut?.same === true && renderMemberBody(by(same, '5')).includes('same second'), 'with the same second, the clock member says so and delivers nothing');
const within = await compileBundle(store['shell:weft']['3'], { load: memLoad, handle: 'weft', now: NOW, since: STAMP });
const wb = renderMemberBody(by(within, '5'));
ok(by(within, '5').cut?.within === true && wb.includes('within this beat') && wb.includes('the line at the instant') && !wb.includes('the beat line — lane 6 orienting') && !wb.includes('swept at first light'), 'with the beat as the last stamp: what landed within it, and nothing above', wb);
const nbw = renderMemberBody(by(whole, '5'));
ok(nbw.includes('said this beat:') && nbw.includes(`[${STAMP3}] the line at the instant`), 'cold, the clock member carries the ladder and what was said this beat', nbw);
ok((await compileBundle(store['shell:weft']['7'], { load: memLoad, handle: 'weft', now: NOW })) === null, 'a list of words resolves nothing and is not a bundle');
const egg = await compileBundle(store['reflexive:egg-one']['9'], { load: memLoad, handle: 'egg-one', now: NOW });
ok(!!egg && by(egg, '1').name === 'sunstone' && by(egg, '2').name === 'purpose:egg-one' && by(egg, '3').name === 'conditions:egg-one', "a genus current's bare names resolve as the instance's own organs, sentinels first");

console.log('\nF. the window');
const win = renderBundle(whole!, { label: '"shell:weft" 3', now: NOW });
const firstLines = win.split('\n').slice(0, 2).join('\n');
ok(/^\[bundle @ "shell:weft" 3 — 5 references compiled at 2026412446/.test(win), 'the header names the node, the count and the stamp');
ok(firstLines.includes('index: 1 orientation:weft:0:0 · 2 history:weft:head · 3 purpose:weft:0:0 · 5 now:weft:now · 7 (prose) · 8 torus-mirror:weft:now'), 'the index comes first, the bare addresses as dialed');
ok(win.indexOf('── 1 · orientation:weft:0:0 ──') >= 0 && win.indexOf('── 1 · orientation:weft:0:0 ──') < win.indexOf('── 2 · history:weft:head → history:weft 22 ──'), 'members unfold in slot order', win.slice(0, 600));
ok(memberLabel(o) === 'orientation:weft:0:0', 'a reference that names its block and address is labelled as dialed', memberLabel(o));
ok(memberLabel(h) === 'history:weft:head → history:weft 22', 'head is labelled with the block and address bsp() takes', memberLabel(h));
ok(memberLabel(n) === `now:weft:now → now:weft ${STAMP3.slice(0, 10)}`, 'now is labelled with its block and the beat', memberLabel(n));
ok(memberLabel(by(egg, '2')).startsWith('purpose → purpose:egg-one'), "a bare name is labelled with the hand's block it resolved to", memberLabel(by(egg, '2')));
const capped = renderBundle(whole!, { label: 'x', now: NOW, cap: 900 });
ok(capped.includes('the window is full at 900 characters') && capped.includes('not unfolded:'), 'past the cap the remaining members are named, never dropped');

console.log('\nG. the seat and the rider, offline');
const { declareSeat, orientationRider, resetSeats, seatOf, seatTold } = await import('../src/orientation.js');
let touched: Record<string, string> = {};
const io = { load: () => memLoad, touched: async () => touched };
resetSeats();
const t0 = NOW.getTime() - 60_000;                         // a minute before NOW, same beat
declareSeat('S', ORIGIN, 'weft', 'shell:weft', '3', store['shell:weft']['3'], t0);
ok((await orientationRider('S', t0 + 10_000, io)) === '', 'ten seconds on, same beat, nothing touched: nothing rides');
const t1 = NOW.getTime() + 20 * 60_000;                   // twenty minutes on: the next beat
const nextBeat = momentToAddress(new Date(t1));
ok(nextBeat !== STAMP, `the clock turned (${nextBeat})`);
const g1 = await orientationRider('S', t1, io);
ok(g1.includes('[orientation — weft: what moved since') && g1.includes('now:weft:now') && g1.includes(`from the ${rungName(divergencePscale(momentToAddress(new Date(t0 + 10_000)), nextBeat)!)} down`) && g1.includes('the line at the instant') && !g1.includes('(no content)'), 'the beat turned: the clock member rides with what landed since, and no empty rung', g1);
ok(g1.includes('(unchanged: orientation:weft:0:0 · history:weft:head · purpose:weft:0:0 · torus-mirror:weft:now)'), 'the quiet members are named once', g1);
ok((await orientationRider('S', t1 + 5_000, io)) === '', 'five seconds later nothing rides again');
touched = { 'history:weft': new Date(t1 + 6_000).toISOString() };
const g2 = await orientationRider('S', t1 + 10_000, io);
ok(g2.includes('history:weft:head') && g2.includes('entry 22 — the newest') && !g2.includes('now:weft:now ──'), 'a touched accumulator rides at its head; the untouched clock does not');
ok((await orientationRider('S', t1 + 20_000, io)) === '', 'and once told, it is quiet');
store['shell:weft']['3']['6'] = 'purpose:weft:1:0';
touched = { 'shell:weft': new Date(t1 + 25_000).toISOString(), 'purpose:weft': new Date(t1 + 25_000).toISOString() };
const g3 = await orientationRider('S', t1 + 30_000, io);
ok(g3.includes('purpose:weft:1:0') && seatOf('S')!.node === store['shell:weft']['3'], 'a re-dialed bundle is re-read from its block, and its new member rides');
const cellW = momentToAddress(new Date(t1 + 35_000), 3);
beachWrite(nowWeft, cellW, { _: 'said within the beat, at its instant', '3': new Date(t1 + 35_000).toISOString() });
touched = { 'now:weft': new Date(t1 + 35_000).toISOString() };
const g4 = await orientationRider('S', t1 + 40_000, io);
ok(g4.includes('── 5 · now:weft:now → now:weft ') &&g4.includes('within this beat') && g4.includes(`[${cellW}] said within the beat, at its instant`) && !g4.includes('the year the substrate grew'), 'a line said within the beat rides at its own second, nothing above it', g4);
ok((await orientationRider('S', t1 + 45_000, io)) === '', 'and once told, the beat is quiet again');
ok((await orientationRider('nobody', t1, io)) === '', 'a session with no seat gets nothing');
seatTold('S', t1 + 60_000);
ok(seatOf('S')!.lastMs === t1 + 60_000, 'seatTold advances the stamp');

console.log('\nH. the real handlers against a fake beach');
delete store['shell:weft']['3']['6'];                       // G re-dialed the fixture; restore it
const index = () => ({ _: 'fake beach', origin: ORIGIN, blocks: Object.keys(store), touched });
globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = new URL(String(input));
  if (url.host !== 'smoke-bundle.test') throw new Error(`smoke refuses ${url.host}`);
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  if ((init.method || 'GET').toUpperCase() !== 'GET') return json(405, { error: 'reads only' });
  if (url.searchParams.has('tables')) return json(200, []);
  const block = url.searchParams.get('block');
  if (!block) return json(200, index());
  return block in store ? json(200, store[block]) : json(404, { error: 'not found' });
}) as any;
const { handleBsp } = await import('../src/tools/bsp.js');
const text = (res: any) => res.content.map((c: any) => c.text).join('\n');
resetSeats();
touched = {};
const read = (spindle: string, sessionId?: string) => handleBsp({ agent_id: ORIGIN, block: 'shell:weft', spindle } as any, { sessionId });
// The handlers read at the REAL clock: the fixture's day line must stand at the
// real clock's day, or the suite holds only on the day it was written.
beachWrite(nowWeft, momentToAddress(new Date()).slice(0, 8) + '00', 'today, as the real clock stands — swept at first light');
const w = text(await read('3'));
ok(w.startsWith('[path-walk @ "3"]') && w.includes('[bundle @ "' + ORIGIN + '/shell:weft" 3 — 5 references'), 'a walk to the manifest compiles it beneath the walk', w);
ok(w.includes('── 1 · orientation:weft:0:0 ──') && w.includes(ruleTwo) && w.includes('── 5 · now:weft:now → now:weft ') && w.includes('swept at first light'), 'every member unfolds, the disc whole and the clock at the stamp');
ok(!text(await read('9')).includes('[bundle @'), 'a node that is not a bundle reads exactly as before');
ok(!text(await read('7')).includes('[bundle @'), 'a list of words reads as a list');
const egg1 = text(await handleBsp({ agent_id: ORIGIN, block: 'reflexive:egg-one', spindle: '9' } as any, {}));
ok(egg1.includes('── 2 · purpose → purpose:egg-one') &&egg1.includes("egg-one's purpose") && egg1.includes('── 1 · sunstone ──'), "a genus current compiles through the same door, its organs resolved by the hand");
declareSeat('T', ORIGIN, 'weft', 'shell:weft', '3', store['shell:weft']['3'], Date.now() - 36 * 3600_000);
const own = text(await read('3', 'T'));
ok(own.includes('[bundle @') && Date.now() - seatOf('T')!.lastMs < 5_000, "a seat reading its own bundle is told: the stamp advances to now");
ok(!text(await handleBsp({ agent_id: ORIGIN, block: 'orientation:weft', spindle: '1' } as any, { sessionId: 'T' })).includes('[orientation —'), 'and its next ordinary read carries nothing');
touched = { 'history:weft': new Date(Date.now() + 1000).toISOString() };
const later = text(await handleBsp({ agent_id: ORIGIN, block: 'orientation:weft', spindle: '2' } as any, { sessionId: 'T' }));
ok(later.includes('[orientation — weft: what moved since') && later.includes('history:weft:head') && later.includes('entry 22 — the newest'), 'when the record moves, the next ack carries its head beneath the reflection');
ok(!text(await handleBsp({ agent_id: ORIGIN, block: 'orientation:weft', spindle: '1' } as any, { sessionId: 'U' })).includes('[orientation —'), 'an unseated session is untouched');

console.log(`\nbundle: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
