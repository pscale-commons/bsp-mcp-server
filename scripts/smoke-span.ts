/** Smoke — a span names its beats; a day names its day (2026-10-10).
 *
 *  The availability family (function:availability) keeps each person's
 *  calendar on the clock: their own LLM says each block at its span —
 *  '14:00–15:00 tomorrow Europe/London' — and the line lands on every beat the
 *  span touches; a read at a span lays every mirror's blocks across it on the
 *  asker's clock. The door does the arithmetic an LLM botches (sundial 4).
 *
 *  Offline: the readers against fixed instants, then the stream door against a
 *  small in-memory beach that keeps the beach's own write rule — an object at
 *  an address replaces the node, a string voices it and keeps its children.
 *  Run: npm run smoke:span */
import { parseSpindle, floorDepth, writeAt, readAt } from '../src/bsp.js';
import { readHumanSpan, readHumanDay, momentToAddress } from '../src/temporal.js';
import { namedRungAddress, spanRung, acrossOf } from '../src/tools/stream.js';

const ORIGIN = 'https://smoke-span.test';
process.env.DEFAULT_BEACH = ORIGIN;

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };
const span = (words: string, now: Date) => {
  const s = readHumanSpan(words, now);
  return s && 'beats' in s ? s : null;
};

const SAT = new Date('2026-10-10T10:53:00Z');   // Saturday 10 October 2026, 11:53 in London (BST)

console.log('\nA SPAN WITH ITS PLACE → EVERY BEAT IT TOUCHES');
const tue = span('14:00–15:00 2026-10-13 Europe/London', SAT);
ok(!!tue && tue.start.toISOString() === '2026-10-13T13:00:00.000Z' && tue.end.toISOString() === '2026-10-13T14:00:00.000Z', '14:00–15:00 on the 13th in London is 13:00–14:00Z');
ok(!!tue && tue.beats.join(' ') === '2026412658 2026412659 2026412661 2026412662 2026412663', 'an hour touches five beats, across the edge of a gathering');
ok(JSON.stringify(span('14:00-15:00 2026-10-13 Europe/London', SAT)?.beats) === JSON.stringify(tue?.beats), 'a hyphen joins the two times as well as a dash');
ok(JSON.stringify(span('2026-10-13 2pm to 3pm Europe/London', SAT)?.beats) === JSON.stringify(tue?.beats), "'2pm to 3pm', the date first");
ok(JSON.stringify(span('2026-10-13T14:00+01:00/2026-10-13T15:00+01:00', SAT)?.beats) === JSON.stringify(tue?.beats), 'two instants joined by a slash');
ok(JSON.stringify(span('Tuesday 14:00–15:00 Europe/London', SAT)?.beats) === JSON.stringify(tue?.beats), 'a weekday names the coming one');
const nine = span('9am–5pm 2026-10-13 Europe/London', SAT);
ok(!!nine && nine.start.toISOString() === '2026-10-13T08:00:00.000Z' && nine.end.toISOString() === '2026-10-13T16:00:00.000Z', '9am–5pm reads as 09:00–17:00');
const whole = span('00:00–24:00 2026-10-13 Europe/London', SAT);
ok(!!whole && whole.start.toISOString() === '2026-10-12T23:00:00.000Z' && whole.end.toISOString() === '2026-10-13T23:00:00.000Z', "00:00–24:00 is the place's whole day");
ok(!!whole && whole.beats.length === 82 && whole.beats[0] === '2026412596' && whole.beats[81] === '2026412696', "London's day touches 82 beats, from the clock's day before");
const night = span('22:00–02:00 2026-10-13 Europe/London', SAT);
ok(!!night && night.end.toISOString() === '2026-10-14T01:00:00.000Z', 'an end before the start falls on the next day');
const edge = span('00:00–02:40 2026-10-13 UTC', SAT);
ok(!!edge && edge.beats.length === 9 && edge.beats[8] === '2026412619', 'a span ending on a beat edge stops at that edge (one gathering, nine beats)');
ok(spanRung(tue!.beats) === '2026412600', "a span inside a day is attended at its day");
ok(spanRung(whole!.beats) === '2026412000', 'a span across two days is attended at the week band holding both');

console.log('\nA SPAN WITHOUT ITS PLACE, TOO LONG, OR NOT A SPAN');
ok(JSON.stringify(readHumanSpan('14:00–15:00 tomorrow', SAT)) === '{"needsPlace":true}', 'a span asks for its place');
ok(JSON.stringify(readHumanSpan('2026-10-01T00:00Z/2026-10-20T00:00Z', SAT)) === '{"tooLong":true}', 'more than a fortnight is refused');
for (const w of ['16:00 Europe/London', 'today', 'tomorrow Europe/London', '2026412351', 'now.4', 'busy 14:00-15:00 call Europe/London', '2026-10-13', 'Europe/London', ''])
  ok(readHumanSpan(w, SAT) === null, `"${w}" is not a span`);

console.log('\nA DAY AS SAID → THE CLOCK\'S DAY');
ok(readHumanDay('tomorrow', SAT) === '2026412400', "'tomorrow' is Sunday the 11th");
ok(readHumanDay('Tuesday Europe/London', SAT) === '2026412600', "'Tuesday' is the coming Tuesday, the 13th");
ok(readHumanDay('saturday', SAT) === '2026412300', 'a weekday that is today names today');
ok(readHumanDay('next saturday', SAT) === '2026413300', "'next' skips today: the 17th");
ok(readHumanDay('2026-10-13', SAT) === '2026412600', 'a date names its day');
const LATE = new Date('2026-10-10T23:30:00Z');   // already 00:30 on Sunday in London
ok(readHumanDay('tomorrow Europe/London', LATE) === '2026412500', "past midnight in London, London's tomorrow is Monday the 12th");
ok(readHumanDay('tomorrow', LATE) === '2026412400', "while the clock's own tomorrow is still Sunday");
for (const w of ['16:00 tomorrow Europe/London', '14:00–15:00 tomorrow Europe/London', 'next', 'meeting tomorrow', '2026-02-30', 'Europe/London', '2026412351'])
  ok(readHumanDay(w, SAT) === null, `"${w}" is not a day`);
ok(namedRungAddress('tomorrow Europe/London', SAT) === '2026412400', 'the door reads a day as said');
ok(namedRungAddress('4pm tomorrow Europe/London', SAT) === momentToAddress(new Date('2026-10-11T15:00:00Z')), 'and a time still names its beat');

console.log('\nWHAT ONE MIRROR HOLDS ACROSS A SPAN');
{
  const wrap = (text: string, floor: number): any => { let n: any = text; for (let i = 0; i < floor; i++) n = { _: n }; return n; };
  const mb: any = wrap('mirror', 10);
  // Tuesday the 13th: a day line, and 'call' on g5 b8–b9 and g6 b1, 'busy' on g6 b3
  for (const b of ['2026412658', '2026412659', '2026412661']) writeAt(mb, b, 'call');
  writeAt(mb, '2026412663', 'busy');
  readAt(mb, '2026412600')._ = '09:00–17:30 Europe/London — Birmingham';
  const a = acrossOf(mb, tue!.beats);
  ok(a.days.length === 1 && a.days[0].addr === '2026412600' && a.days[0].line === '09:00–17:30 Europe/London — Birmingham', "the day's own line rides beside the beats");
  ok(a.runs.length === 2 && a.runs[0].text === 'call' && a.runs[1].text === 'busy', 'three beats saying one thing are one block; a gap parts two');
  ok(a.runs[0].end - a.runs[0].start === Math.round(3 * 86_400_000 / 81) || Math.abs(a.runs[0].end - a.runs[0].start - 3 * 86_400_000 / 81) < 2, 'the first block is three beats long');
}

// ── the door ──
console.log('\nTHE STREAM DOOR, ACROSS A SPAN');
const wrap = (text: string, floor: number): any => { let n: any = text; for (let i = 0; i < floor; i++) n = { _: n }; return n; };
const store: Record<string, any> = {
  'spine:availability': wrap('the clock', 10),
  'function:availability': { _: 'The law of the availability family — say each block at its span; read at a span.', '2': 'WHO IS SHOWN. Every mirror.' },
  'spine:venture': { _: 'a tree of parts', '1': 'one' },
};
const posts: Array<{ block: string; [k: string]: any }> = [];
/** The beach's write rule (pscale-beach writeAt): walk to the address making
 *  what is missing; an object there replaces the node, a string at a node that
 *  holds children voices it and keeps them. */
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
globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = new URL(String(input));
  if (url.host !== 'smoke-span.test') throw new Error(`smoke refuses ${url.host}`);
  const block = url.searchParams.get('block');
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  if ((init.method || 'GET').toUpperCase() === 'GET') {
    if (!block) return json(200, { _: 'fake beach', origin: ORIGIN, blocks: Object.keys(store) });
    return block in store ? json(200, store[block]) : json(404, { error: 'not found' });
  }
  const body = JSON.parse(init.body);
  posts.push({ block: block!, ...body });
  const born = !(block! in store);
  if (body.spindle) beachWrite(store[block!], body.spindle, JSON.parse(JSON.stringify(body.content)));
  else store[block!] = body.content;
  return json(200, { ok: true, ...(born ? { born: true } : {}) });
}) as any;
const { handleStreamEngage } = await import('../src/tools/stream.js');
const text = (r: any) => r.content.map((c: any) => c.text).join('\n');
const engage = (handle: string, p: Record<string, unknown>) =>
  handleStreamEngage({ field: 'availability', handle, beach: ORIGIN, ...p } as any);

const HOUR = '14:00–15:00 tomorrow Europe/London';
const want = span(HOUR, new Date())!;
const day = `${want.beats[0].slice(0, 8)}00`;
const ack1 = text(await engage('ann', { at: HOUR, say: 'virtual — call about the venture', secret: 'k' }));
const annPosts = posts.filter((p) => p.block === 'availability:ann');
ok(annPosts.length === 2 && !annPosts[0].spindle && annPosts[1].spindle === day, `the mirror is born, then the day is saved once (${annPosts.map((p) => p.spindle || 'born').join(', ')})`);
ok(want.beats.every((b) => { let n: any = store['availability:ann']; for (const d of b) n = n?.[d === '0' ? '_' : d]; return n === 'virtual — call about the venture'; }), `the line stands on all ${want.beats.length} beats`);
ok(ack1.includes(`✓ your line landed at availability:ann on ${want.beats.length} beats, ${want.beats[0]} … ${want.beats[want.beats.length - 1]}`), 'the ack names the beats it landed on');
ok(/ \(\w+ \d+ \w+ \d\d:\d\d–\d\d:\d\d Europe\/London\)/.test(ack1), "and says them back on London's clock");

const ackDay = text(await engage('ann', { at: 'tomorrow Europe/London', say: '09:00–17:30 Europe/London — Birmingham', secret: 'k' }));
ok(ackDay.includes(`at ${day} (tomorrow Europe/London`), 'the day line is said at the day as said');
ok(want.beats.every((b) => { let n: any = store['availability:ann']; for (const d of b) n = n?.[d === '0' ? '_' : d]; return n === 'virtual — call about the venture'; }), 'voicing the day keeps its beats');

await engage('bob', { at: '13:00–14:00 tomorrow Europe/London', say: 'busy', secret: 'j' });
const read = text(await engage('cat', { at: '12:00–18:00 tomorrow Europe/London' }));
ok(read.includes('across 12:00–18:00 tomorrow Europe/London (') && read.includes(`attended at ${day}`), 'a read across a span is attended at its day');
ok(read.includes('# Across the span, on the Europe/London clock — 2 holders'), 'both holders are laid side by side');
ok(/## ann\n  the day, [^:]+: 09:00–17:30 Europe\/London — Birmingham\n  \d\d:\d\d–\d\d:\d\d  virtual — call about the venture/.test(read), "ann's day line, then her block on London's clock");
ok(/## bob\n  the day, [^:]+: \(no line — its hours are not known\)\n  \d\d:\d\d–\d\d:\d\d  busy/.test(read), "bob's day is not known; his block stands");
ok(read.includes('The law of the availability family'), "the family's law rides the envelope");

const before = posts.length;
const cleared = text(await engage('ann', { at: HOUR, say: '', secret: 'k' }));
ok(cleared.includes(`✓ cleared ${want.beats.length} lines of yours across the span at availability:ann`), 'an empty say clears the span');
ok(posts.length === before + 1 && posts[posts.length - 1].spindle === day && typeof posts[posts.length - 1].content === 'object', 'one save of the day, as an object, so the beach replaces it');
ok(want.beats.every((b) => { let n: any = store['availability:ann']; for (const d of b) n = n?.[d === '0' ? '_' : d]; return n === undefined; }), 'the beats are gone from the beach');
const dayNode = (() => { let n: any = store['availability:ann']; for (const d of day.slice(0, 8)) n = n?.[d === '0' ? '_' : d]; return n; })();
ok(dayNode && dayNode._ === '09:00–17:30 Europe/London — Birmingham', "the day's own line stands");
const reread = text(await engage('cat', { at: '12:00–18:00 tomorrow Europe/London' }));
ok(/## ann\n  the day, [^:]+: 09:00–17:30 Europe\/London — Birmingham\n  \(no blocks across the span\)/.test(reread), 'read again, ann keeps her hours and no blocks');
const none = text(await engage('dan', { at: HOUR, say: '' }));
ok(none.includes('nothing of yours stood across the span at availability:dan — nothing to clear') && !('availability:dan' in store), 'clearing where nothing stands writes nothing');

const kept = text(await engage('cat', { at: '12:00–18:00 tomorrow Europe/London', keep: 'personal', keep_text: 'all open 15:00–18:00', secret: 'c' }));
ok(kept.includes(`✓ fold kept at tree:availability:cat:${day}`), "a keep at a span lands at the span's own rung");

const placeless = text(await engage('ann', { at: '14:00–15:00 tomorrow', say: 'no place given', secret: 'k' }));
ok(placeless.includes('is a span without its place') && placeless.includes('Europe/London'), 'a span with no place is refused in words that teach');
const tooLong = text(await engage('ann', { at: '2026-10-01T00:00Z/2026-10-20T00:00Z' }));
ok(tooLong.includes('spans more than 14 days'), 'a span past a fortnight is refused');
const notClock = text(await handleStreamEngage({ field: 'venture', handle: 'ann', beach: ORIGIN, at: HOUR, say: 'x' } as any));
ok(notClock.includes('only a family on the clock keeps') && !('venture:ann' in store), 'a family not on the clock refuses a span');

console.log('\nTHREE SAYS AT ONCE TO ONE MIRROR');
{
  const nodeAt = (block: any, addr: string) => { let n = block; for (const d of addr) n = n?.[d === '0' ? '_' : d]; return n; };
  const three = ['09:00–09:30 tomorrow Europe/London', '11:00–11:30 tomorrow Europe/London', '12:00–12:30 tomorrow Europe/London'];
  await Promise.all(three.map((at, i) => engage('eve', { at, say: `block ${i + 1}`, secret: 'e' })));
  const eve = store['availability:eve'];
  ok(!!eve && three.every((at, i) => span(at, new Date())!.beats.every((b) => nodeAt(eve, b) === `block ${i + 1}`)),
    'an LLM firing a day\'s blocks together keeps every one: the door holds one mirror\'s says in line');
  await Promise.all(three.map((at) => engage('eve', { at, say: '', secret: 'e' })));
  ok(three.every((at) => span(at, new Date())!.beats.every((b) => nodeAt(store['availability:eve'], b) === undefined)), 'and three clears at once clear all three');
}

console.log(`\nspan: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
