/** Smoke — a time as a person says it names the beat it falls in.
 *
 *  David, 2026-10-06 (tidying.19): "I want to be able to say to llm-app or
 *  mirror to book a meeting for 4pm and it does it correctly." The clock keeps
 *  no time zone (sundial 8.3), so a time names its place, and the door does the
 *  arithmetic an LLM botches (sundial 4): the place's summer time, then ninths
 *  of a UTC day.
 *
 *  Offline: the reader against fixed instants, then the stream door against a
 *  small in-memory beach holding a clock family. Run: npm run smoke:human-time */
import { writeAt } from '../src/bsp.js';
import { readHumanTime, spanInPlace, momentToAddress } from '../src/temporal.js';

const ORIGIN = 'https://smoke-human-time.test';
process.env.DEFAULT_BEACH = ORIGIN;

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };
const at = (iso: string) => momentToAddress(new Date(iso));
const addr = (words: string, now: Date, device?: string) => {
  const t = readHumanTime(words, now, device);
  return t && 'address' in t ? t.address : t;
};

// ── the reader ──
const MORNING = new Date('2026-10-06T09:57:00Z');   // Tuesday 6 October 2026, 10:57 in London (BST)
console.log('\nA TIME WITH ITS PLACE → THE BEAT');
ok(addr('16:00 Europe/London', MORNING) === '2026411666', '16:00 Europe/London today is afternoon, beat 6 (2026411666)');
ok(addr('4pm Europe/London', MORNING) === '2026411666', '4pm reads as 16:00');
ok(addr('4 PM europe/london', MORNING) === '2026411666', 'the spoken spelling, any case');
ok(addr('at 4pm, Europe/London', MORNING) === '2026411666', '"at" and a comma are let pass');
ok(addr('4:30pm tomorrow Europe/London', MORNING) === at('2026-10-07T15:30:00Z'), 'tomorrow at half past four, London');
ok(addr('tomorrow 16:30 Europe/London', MORNING) === addr('4:30pm tomorrow Europe/London', MORNING), 'the words in any order');
ok(addr('2026-10-07T16:00+01:00', MORNING) === at('2026-10-07T15:00:00Z'), 'one ISO instant with its offset');
ok(addr('2026-10-07T15:00Z', MORNING) === at('2026-10-07T15:00:00Z'), 'an ISO instant in UTC');
ok(addr('16:00 +01:00', MORNING) === at('2026-10-06T15:00:00Z'), 'a bare offset is a place');
ok(addr('16:00 UTC+1', MORNING) === at('2026-10-06T15:00:00Z'), 'UTC+1 is the same place');
ok(addr('16:00 UTC', MORNING) === at('2026-10-06T16:00:00Z'), 'UTC is a place');
ok(addr('noon Europe/London', MORNING) === at('2026-10-06T11:00:00Z'), 'noon');

console.log('\nSUMMER TIME IS THE PLACE\'S, NOT THE READER\'S');
ok(addr('2026-12-07 16:00 Europe/London', MORNING) === at('2026-12-07T16:00:00Z'), 'in December London is on GMT: 16:00 is 16:00Z');
ok(addr('2026-07-07 16:00 Europe/London', MORNING) === at('2026-07-07T15:00:00Z'), 'in July London is on BST: 16:00 is 15:00Z');
ok(addr('9:30 America/New_York', MORNING) === at('2026-10-06T13:30:00Z'), 'New York in October is UTC-4');
ok(addr('2026-10-07 09:00 Asia/Kolkata', MORNING) === at('2026-10-07T03:30:00Z'), 'a half-hour offset');

console.log('\nTODAY IS THE PLACE\'S OWN TODAY');
const LATE = new Date('2026-10-06T23:30:00Z');   // already 00:30 on the 7th in London
ok(addr('today 9am Europe/London', LATE) === at('2026-10-07T08:00:00Z'), 'past midnight in London, "today" is the 7th there');
ok(addr('9am America/Los_Angeles', LATE) === at('2026-10-06T16:00:00Z'), 'while in Los Angeles it is still the 6th');

console.log('\nA TIME WITHOUT ITS PLACE');
ok(JSON.stringify(readHumanTime('4pm', MORNING)) === '{"needsPlace":true}', 'a bare time asks for its place');
ok(JSON.stringify(readHumanTime('16:00 tomorrow', MORNING)) === '{"needsPlace":true}', 'a dated time without a place asks too');
ok(addr('4pm', MORNING, 'Europe/London') === '2026411666', 'a door that knows its device supplies the place');
ok(addr('4pm America/New_York', MORNING, 'Europe/London') === at('2026-10-06T20:00:00Z'), 'a place in the words outranks the device');

console.log('\nNOT A TIME — FALLS THROUGH');
for (const w of ['2026411666', '6.1', '4,2,6', 'today', 'now', 'meeting at 4pm Europe/London', '4', '25:00 UTC', '13pm UTC', '2026-02-30 10:00 UTC', '10:00 Mars/Olympus', ''])
  ok(readHumanTime(w, MORNING) === null, `"${w}" is not a time`);

console.log('\nTHE BEAT ON THE PLACE\'S OWN WALL CLOCK');
ok(spanInPlace('2026411666', 'Europe/London') === '15:49–16:07', 'afternoon beat 6 runs 15:49–16:07 in London');
ok(spanInPlace('2026411666', 'UTC') === '14:49–15:07', 'and 14:49–15:07 in UTC');
ok(spanInPlace('2026411660', 'Europe/London') === '14:20–17:00', 'the afternoon gathering runs 14:20–17:00 in London');

// ── the door ──
console.log('\nTHE STREAM DOOR BOOKS AT THE BEAT');
const wrap = (text: string, floor: number): any => { let n: any = text; for (let i = 0; i < floor; i++) n = { _: n }; return n; };
const store: Record<string, any> = { 'spine:now': wrap('the clock', 10) };
const posts: Array<{ block: string; [k: string]: any }> = [];
globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = new URL(String(input));
  if (url.host !== 'smoke-human-time.test') throw new Error(`smoke refuses ${url.host}`);
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
  if (body.spindle) writeAt(store[block!], body.spindle, body.content);
  else store[block!] = body.content;
  return json(200, { ok: true, ...(born ? { born: true } : {}) });
}) as any;
const { handleStreamEngage } = await import('../src/tools/stream.js');
const text = (r: any) => r.content.map((c: any) => c.text).join('\n');
const engage = (p: Record<string, unknown>) => handleStreamEngage({ field: 'now', handle: 'david', beach: ORIGIN, ...p } as any);

const words = '4pm tomorrow Europe/London';
const want = addr(words, new Date()) as string;
const ack = text(await engage({ at: words, say: 'Meeting with Pete', secret: 'k' }));
const landed = posts.filter(p => p.block === 'now:david').pop();
ok(typeof want === 'string' && want.length === 10, `"${words}" resolves now to ${want}`);
ok(!!landed && landed.spindle === want, `the say lands in now:david at that beat (${landed?.spindle})`);
ok(ack.includes(`at ${want} (${words}, its beat ${spanInPlace(want, 'Europe/London')} there`), 'the ack says the beat back on London\'s clock');
ok(/afternoon \(beat [1-9]\)/.test(ack), 'and voices it as afternoon, beat N');

const refused = text(await engage({ at: '4pm', say: 'no place given', secret: 'k' }));
ok(refused.includes('is a time without its place') && refused.includes('Europe/London'), 'a time with no place is refused in words that teach');
ok(!posts.some(p => p.block === 'now:david' && p.content === 'no place given'), 'and nothing is written');

const today = text(await engage({ at: 'today' }));
ok(today.includes(`at ${momentToAddress(new Date()).slice(0, 8)}00 (today`), "'today' still names today");

console.log(`\nhuman time: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
