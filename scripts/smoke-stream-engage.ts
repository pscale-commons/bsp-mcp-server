/** Smoke — pscale_stream_engage. Pure helpers asserted offline; one LIVE read
 *  against the beach-venture family (read-only, writes nothing). */
import { voiceOf, emitFor, ladderOf, isBareRef, namedRungAddress, voicedValue, handleStreamEngage, laneOf, turnValue, turnsOf, mirrorAtBeat, agoWords, standingBrief, resetStanding } from '../src/tools/stream.js';
import { Block } from '../src/bsp.js';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; } else { fail++; console.error('  FAIL', m); } };

// voiceOf — a leaf speaks as itself, an object through its underscore, silence is null
ok(voiceOf('hello') === 'hello', 'leaf string');
ok(voiceOf({ _: 'under' }) === 'under', 'object underscore');
ok(voiceOf({ '1': 'x' }) === null, 'object without underscore is silent');
ok(voiceOf('') === null, 'empty string is silent');
ok(voiceOf(undefined) === null, 'absent is silent');

// emitFor — right-pad to the TARGET block's floor (floor-alignment, not walk depth)
const floor1: Block = { _: 'a' } as Block;
const floor3: Block = { _: { _: { _: 'deep' } } } as Block;
ok(emitFor(['2', '4'], floor1) === '24', 'floor 1 keeps digits');
ok(emitFor(['2', '4'], floor3) === '240', 'floor 3 right-pads');

// isBareRef — one token is a ref, prose is not
ok(isBareRef('function:audit'), 'bare ref');
ok(isBareRef('pscale:grit/5'), 'bare ref with branch');
ok(!isBareRef('read this as a progression'), 'prose is not a ref');

// ladderOf — every ancestor, coarsest first, pscale = floor - depth
const spine: Block = { _: { _: { _: 'root' } }, '2': { _: 'two', '3': 'twothree' } } as any;
const l = ladderOf(spine, ['2', '3']);
ok(l.length === 2, 'two rungs walked');
ok(l[0].pscale === 2 && l[1].pscale === 1, `pscale descends (${l[0].pscale},${l[1].pscale})`);
ok(l[0].text === 'two' && l[1].text === 'twothree', 'ancestor voicings collected');

// named rungs — a word, never digits
const D = new Date(Date.UTC(2026, 7, 10, 9, 0, 0));
ok(namedRungAddress('today', D)?.length === 10, 'today is full-width');
ok(namedRungAddress('today', D)?.endsWith('00'), 'today zeroes the finer rungs');
ok(namedRungAddress('this week', D) === namedRungAddress('week', D), '"this week" == "week"');
ok(namedRungAddress('year', D)?.startsWith('2026'), 'year keeps the Gregorian digits');
ok(namedRungAddress('2026322300', D) === null, 'a digit address falls through');

/* ── voicedValue — saying again replaces the words and keeps the structure.
 * The case that matters: a node carrying a stamp and a reader's own marker
 * beneath it must survive being voiced again, or no family can keep anything
 * under an address (news channel 1 keeps its declared-at at 1.91 and the
 * reader's last-read at 1.92). The no-substructure cases must stay
 * byte-identical, or every family that has none would move underneath us. */
const vv: [string, unknown, unknown][] = [
  ['absent node takes a bare string', undefined, 'hello'],
  ['string node takes a bare string', 'old words', 'hello'],
  ['object node keeps its children', { _: 'old', '9': { '1': 'ts', '2': 'mark' } },
    { _: 'hello', '9': { '1': 'ts', '2': 'mark' } }],
  ['object with no underscore gains one', { '9': { '1': 'ts' } },
    { _: 'hello', '9': { '1': 'ts' } }],
  ['an array is replaced, never merged into', ['a', 'b'], 'hello'],
];
for (const [name, existing, want] of vv)
  ok(JSON.stringify(voicedValue(existing, 'hello')) === JSON.stringify(want), `voicedValue: ${name}`);

/* ── THE LANE — 'now.8' is the beat with the lane's own digit beneath it. Only a
 * named rung that reaches the floor takes a lane; a digit address with a
 * fraction keeps its own meaning, and a coarser word has no lanes. */
ok(JSON.stringify(laneOf('now.8')) === JSON.stringify({ rung: 'now', lane: '8' }), 'now.8 is lane 8 at the beat');
ok(laneOf(' beat.3 ')?.lane === '3', 'beat.3 is lane 3');
ok(laneOf('now') === null, 'now alone has no lane');
ok(laneOf('today.3') === null, 'a coarser rung takes no lane');
ok(laneOf('2026411559.8') === null, 'a digit address keeps its own meaning');
ok(laneOf('now.0') === null && laneOf('now.12') === null, 'a lane is one digit, 1-9');

/* ── A TURN keeps its arrival and moves its revision (function:torus-mirror 1.2). */
const t1 = turnValue(undefined, 'first', '2026-10-05T12:00:00.000Z');
ok(t1._ === 'first' && t1['6'] === '2026-10-05T12:00:00.000Z' && t1['3'] === '2026-10-05T12:00:00.000Z', 'a new turn: line, arrival, revision');
const t2 = turnValue(t1, 'second', '2026-10-05T12:05:00.000Z');
ok(t2._ === 'second' && t2['6'] === '2026-10-05T12:00:00.000Z' && t2['3'] === '2026-10-05T12:05:00.000Z', 'said again: the line and 3 move, 6 stays');

/* ── turnsOf — stamped, speaking digit children only. */
const beat = { _: 'latest', '3': { _: 'lane three', '3': '2026-10-05T12:10:00.000Z', '6': '2026-10-05T12:10:00.000Z' },
  '8': { _: 'lane eight', '3': '2026-10-05T12:12:00.000Z' }, '1': 'a scalar field', '2': { _: 'unstamped substructure' } };
const ts = turnsOf(beat).map((t) => t.lane).sort().join(',');
ok(ts === '3,8', `turns are stamped objects only (${ts})`);
ok(turnsOf('a leaf').length === 0 && turnsOf(undefined).length === 0, 'a leaf and an absent node keep no turns');

/* ── mirrorAtBeat — lanes at the beat; across the edge on the moving now. */
const NOW = Date.parse('2026-10-05T12:27:00.000Z');
const CELL = 1066_667;
const iso = (minAgo: number) => new Date(NOW - minAgo * 60_000).toISOString();
const here = mirrorAtBeat(beat, undefined, Date.parse('2026-10-05T12:13:00.000Z'), CELL, NaN);
ok(here.lanes.map((l) => l.lane).join(',') === '8,3', 'lanes at the beat, latest first');
// lane 8 spoke 2 minutes ago in the beat before; lane 3 spoke 25 minutes ago there; lane 5 has spoken in this beat
const prev = { _: 'old', '8': { _: 'eight, before the edge', '3': iso(2) }, '3': { _: 'three, long before', '3': iso(25) },
  '5': { _: 'five, before the edge', '3': iso(3) } };
const cur = { _: 'five now', '5': { _: 'five, this beat', '3': iso(0.2) } };
const edge = mirrorAtBeat(cur, prev, NOW, CELL, NaN);
ok(edge.lanes.map((l) => `${l.lane}:${l.text}`).join(' | ') === '5:five, this beat | 8:eight, before the edge',
  `a live lane is carried across the edge, a stale one is not, and a lane is never doubled (${edge.lanes.map((l) => l.lane).join(',')})`);
// a hand that only voices the beat: carried by its mirror's last write, within one beat's width
const lone = mirrorAtBeat(undefined, 'a plain line said before the edge', NOW, CELL, NOW - 4 * 60_000);
ok(lone.voicing === 'a plain line said before the edge' && lone.voicingMs === NOW - 4 * 60_000, 'a plain voicing is carried by the touched instant');
const stale = mirrorAtBeat(undefined, 'a plain line from long ago', NOW, CELL, NOW - 40 * 60_000);
ok(stale.voicing === null && stale.lanes.length === 0, 'a line older than a beat is not carried');
const fixed = mirrorAtBeat(undefined, 'the beat before', NOW, 0, NOW - 60_000);
ok(fixed.voicing === null, 'off the moving now nothing is carried');

ok(agoWords(5_000) === 'just now' && agoWords(45_000) === '45s ago' && agoWords(4 * 60_000) === '4m ago', 'agoWords');

/* ── THE STANDING PARTS ARE GIVEN ONCE to a session, and again when the law
 * changes or two hours pass; with no session the envelope is always whole. */
resetStanding();
ok(standingBrief(null, 'law', NOW) === false, 'no session: never brief');
ok(standingBrief('s|o|f', 'law', NOW) === false, 'first engage: whole');
ok(standingBrief('s|o|f', 'law', NOW + 60_000) === true, 'again within the session: brief');
ok(standingBrief('s|o|f', 'law, amended', NOW + 120_000) === false, 'the law changed: whole again');
ok(standingBrief('s|o|f', 'law, amended', NOW + 3 * 60 * 60_000) === false, 'two hours on: whole again');
ok(standingBrief('other|o|f', 'law, amended', NOW + 3 * 60 * 60_000 + 1) === false, 'another session is its own');

console.log(`offline: ${pass} passed, ${fail} failed`);

// ── LIVE, read-only ──
const res = await handleStreamEngage({ field: 'beach-venture', handle: 'weft', at: 'today' });
const text = (res.content[0] as any).text as string;
console.log('\n──── LIVE beach-venture @ now ────\n');
console.log(text);
const live = [
  ['ladder present', text.includes('# The ladder')],
  ['snapshot present', text.includes('# Readings at')],
  ['fold section present', text.includes('# The fold')],
  ['ancestor voicing carried', text.includes('the internet reconstituted as beach')],
  // the attended rung is named by its own address, whatever today holds —
  // a pin on a specific day's words went stale five days after it was written
  ['attended address carried', text.includes(namedRungAddress('today', new Date())!)],
] as const;
for (const [m, c] of live) ok(c as boolean, m);
console.log(`\ntotal: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

