/** Smoke — a thread in the registry encoding (proposals/2026-10-29-threads-the-registry.md).
 *
 *  A thread is a number in spine:thread; each hand's knots stand in its own mirror
 *  thread:<handle> at the number and beneath it, the digit the choice. This proves
 *  the router's part, offline against a small in-memory beach that walks addresses
 *  as the real one does (a dot-free spindle walks its digits from the root):
 *    - a read at an address gives every mirror's lines there AND beneath it, in
 *      address order, a mirror born at a lower floor raised in memory first;
 *    - a say off the clock raises the writer's own mirror to the spine's floor with
 *      one whole-block rewrite (never a zero-position write), so 11.3 lands at
 *      11.3 and the knots it held keep their numbers;
 *    - a say's options land at the digits beneath its line;
 *    - an option another hand has answered keeps its words;
 *    - a line of one's own replaced is named in the ack;
 *    - a seat that took a thread up at the door is told only the knots OTHER hands
 *      tied since, its own coming back in its own say's answer;
 *    - off the clock the address is said as written (11.2, never 112), and the
 *      registry's line rides with the stamp the beach gave it as it landed
 *      (proposals/2026-10-29-threads-phase-2.md);
 *    - a law whose root line closes 'is ways:<name>.' has that way handed over once
 *      in a session, at either door, the text the battery ran; a family whose law
 *      only mentions a way, or whose field a way is merely named for, is untouched
 *      (proposals/2026-11-02-the-read-hands-over-the-way.md). */
import { readFileSync } from 'node:fs';
import { writeAt, readAt, floorDepth } from '../src/bsp.js';

const ORIGIN = 'https://smoke-thread.test';
process.env.DEFAULT_BEACH = ORIGIN;

// The registry has nested once: threads 1-9 beneath the old root, 11 and 12 at floor 2.
const store: Record<string, any> = {
  'spine:thread': {
    _: { _: 'THE REGISTRY — one line per thread, in the order threads are opened.', '5': 'thread five · opened by ada' },
    '1': { _: 'Summary of 1–9', '1': { _: 'redraw the quipu · opened by ada', '1': 'ada', '3': '2026-10-29T13:53:55Z' }, '2': 'a second thread · opened by ben' },
  },
  'function:thread': { _: 'THE THREAD — the law of this smoke. How a mind carries one, step by step, is ways:thread.' },
  'ways:thread': { _: 'THE WAY — of this smoke.', '1': 'FIND IT.', '2': 'TIE IT.', '9': 'PROVENANCE — never taught.' },
  // a family with a way of its name and a law that mentions it in passing: no way is handed over
  'spine:tide': { _: 'the tide', '1': 'the morning' },
  'function:tide': { _: 'THE TIDE — taught beside ways:tide, which is not this law closing on it. Its law stands here.' },
  'ways:tide': { _: 'THE WAY OF THE TIDE — never handed over.', '1': 'WAIT.' },
  'pool:door': { _: 'a room to come in by' },
  'passport:cy': { _: 'cy, who takes the work up at the door' },
  // ada's mirror was born when the registry stood at floor 1, and holds thread 5's knots there.
  'thread:ada': { _: 'MIRROR — ada', '5': { _: 'ada asked about five', '2': 'ada took her own option 2' } },
};
const locks: Record<string, string> = { 'thread:ada': 'ada-key' };
const touched: Record<string, string> = {};
const posts: Array<Record<string, any>> = [];

globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = new URL(String(input));
  if (url.host !== 'smoke-thread.test') throw new Error(`smoke refuses ${url.host}`);
  const block = url.searchParams.get('block');
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  if ((init.method || 'GET').toUpperCase() === 'GET') {
    if (!block) return json(200, { _: 'fake beach', origin: ORIGIN, blocks: Object.keys(store), touched });
    return block in store ? json(200, store[block]) : json(404, { error: 'not found' });
  }
  const body = JSON.parse(init.body);
  const name = block ?? body.block;
  posts.push({ block: name, ...body });
  if (body.append) return json(200, { ok: true, slot: '13', floor: 2 });
  const born = !(name in store);
  if (!born && locks[name] !== undefined && body.secret !== locks[name]) {
    return json(403, { error: `"${name}" inherits the lock at its root, secret required` });
  }
  if (body.spindle) writeAt(store[name], body.spindle, body.content);
  else store[name] = body.content;
  if (born && body.new_lock) locks[name] = body.new_lock;
  touched[name] = new Date().toISOString();
  return json(200, { ok: true, ...(born ? { born: true } : {}) });
}) as any;

const { handleStreamEngage, resetStanding, wayText } = await import('../src/tools/stream.js');
const { handlePlay } = await import('../src/tools/play.js');
const { handleBsp } = await import('../src/tools/bsp.js');
const { seatThread, orientationRider, toldKey, resetSeats } = await import('../src/orientation.js');
const { crossSection, renderPlace } = await import('../src/cross.js');

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };
const engage = async (p: Record<string, unknown>) =>
  (await handleStreamEngage({ field: 'thread', beach: ORIGIN, ...p } as any)).content.map((c: any) => c.text).join('\n');
const pause = () => new Promise((r) => setTimeout(r, 15));

// ── a read at a number gives the lines beneath it, a lower mirror raised in memory ──
let r = await engage({ handle: 'cy', at: '5' });
ok(r.includes('- 5 · ada: ada asked about five'), 'thread 5 reads from a mirror born at floor 1');
ok(r.includes('- 5.2 · ada: ada took her own option 2'), 'and the knot beneath it, at 5.2');

// ── a say off the clock raises the writer's mirror, then lands, with its options ──
r = await engage({ handle: 'ada', at: '11', say: 'drew the band live from the beach', options: ['accept the drawing', 'ask for changes'], secret: 'ada-key' });
const raise = posts.find((p) => p.block === 'thread:ada' && !p.spindle);
ok(raise !== undefined, 'the raise is one whole-block rewrite of the mirror, never a write at a zero position');
ok(floorDepth(store['thread:ada']) === 2, 'ada\'s mirror now stands at the registry\'s floor');
ok(readAt(store['thread:ada'], '05')?._ === 'ada asked about five', 'its old knot keeps its number: 5 is 05 at floor 2');
ok(readAt(store['thread:ada'], '11')?._ === 'drew the band live from the beach', 'the knot lands at 11');
ok(readAt(store['thread:ada'], '111') === 'accept the drawing' && readAt(store['thread:ada'], '112') === 'ask for changes', 'its options land at 11.1 and 11.2');
ok(r.includes('2 options beneath it, at 11.1, 11.2'), 'the ack names where the options stand');

// ── another hand takes option 2; its mirror is born at the registry's floor ──
await engage({ handle: 'ben', at: '11.2', say: 'asked for changes: the forks overlap at phone width', options: ['fix and resubmit'], secret: 'ben-key' });
ok(floorDepth(store['thread:ben']) === 2 && readAt(store['thread:ben'], '112')?._?.startsWith('asked for changes'), 'ben\'s knot stands at 11.2 in ben\'s own mirror');

r = await engage({ handle: 'cy', at: '11' });
const order = ['- 11 · ada:', '- 11.1 · ada: accept the drawing', '- 11.2 · ada: ask for changes', '- 11.2 · ben: asked for changes', '- 11.21 · ben: fix and resubmit'].map((s) => r.indexOf(s));
ok(order.every((i) => i >= 0), 'the whole thread in one read: the offer, its options, the option taken, and the next offer');
ok(order.every((i, n) => n === 0 || i > order[n - 1]), 'in address order, a parent before its children');
ok(r.includes('11 in the registry') || r.includes('redraw the quipu'), 'the registry\'s line rides above it');
ok(r.includes('redraw the quipu · opened by ada · 2026-10-29T13:53:55Z'), 'with the stamp the beach gave it, the one time a thread keeps');
ok(!r.includes('- 11.3 ·'), 'and its stamp at field 3 is never a knot at option 3');

// ── an option another hand has answered keeps its words ──
r = await engage({ handle: 'ada', at: '11', say: 'drew the band live from the beach', options: ['accept the drawing', 'something else'], secret: 'ada-key' });
ok(r.includes('has been answered by ben'), 'rewording a taken option is refused, naming who took it');
ok(readAt(store['thread:ada'], '112') === 'ask for changes', 'and the option stands as it was');

// ── a line of one's own replaced is named ──
r = await engage({ handle: 'ada', at: '11', say: 'drew the band live, in the look\'s palette', secret: 'ada-key' });
ok(r.includes('it replaced your own line there'), 'a say over one\'s own line names what it replaced');
ok(readAt(store['thread:ada'], '111') === 'accept the drawing', 'and keeps the options beneath it');

// ── the seat a door took a thread up with is told only what is tied since ──
resetSeats();
const cs = await crossSection(ORIGIN, 'thread', '11');
ok(cs !== null && renderPlace('thread', '11', cs!).includes('11.21 · ben: fix and resubmit'), 'the door\'s place renders every knot beneath it');
seatThread('s1', ORIGIN, 'cy', 'thread', '11', cs!.lines.map((l) => toldKey(l.who, l.addr, l.text)));
ok((await orientationRider('s1')) === '', 'a quiet thread tells nothing');
await pause();
await engage({ handle: 'ada', at: '11.211', say: 'fixed the overlap and resubmitted', secret: 'ada-key' });
await pause();
const told = await orientationRider('s1', Date.now() + 10_000);
ok(told.includes('11.211 · ada: fixed the overlap and resubmitted'), 'the next ack carries the knot tied since');
ok(!told.includes('11.2 · ben'), 'and nothing it had already told');
ok(renderPlace('thread', '11', cs!).includes('11 in the registry: redraw the quipu · opened by ada · 2026-10-29T13:53:55Z'), 'the door\'s place carries the registry line\'s stamp');

// ── a seat is told other hands' knots, never its own ──
const cs2 = await crossSection(ORIGIN, 'thread', '11');
seatThread('s2', ORIGIN, 'ada', 'thread', '11', cs2!.lines.map((l) => toldKey(l.who, l.addr, l.text)));
await pause();
r = await engage({ handle: 'ada', at: '11.2111', say: 'checked it at phone width · waits on ben', secret: 'ada-key' });
await engage({ handle: 'ben', at: '11.22', say: 'asked for one more change: the legend wraps · waits on ada', secret: 'ben-key' });
await pause();
const toldAda = await orientationRider('s2', Date.now() + 20_000);
ok(toldAda.includes('11.22 · ben: asked for one more change'), 'ada\'s seat hears ben\'s knot');
ok(!toldAda.includes('11.2111 · ada'), 'and not her own, which her say already answered');

// ── off the clock the address is said as written ──
ok(r.startsWith('stream:thread @ https://smoke-thread.test — at 11.2111'), 'a say at 11.2111 heads its reply at 11.2111, never 112111');
r = await engage({ handle: 'cy', at: '11.2' });
ok(r.startsWith('stream:thread @ https://smoke-thread.test — at 11.2') && r.includes('# Readings at 11.2 '), 'a read at 11.2 says 11.2 in its header and its readings');

// ── the way the law names is handed over once in a session, at either door ──
const way = '# The way — ways:thread, how a mind carries';
const standsAs = '# The way — ways:thread, standing as it was given to you earlier in this session';
const engageIn = async (session: string, p: Record<string, unknown>) =>
  (await handleStreamEngage({ field: 'thread', beach: ORIGIN, ...p } as any, { sessionId: session })).content.map((c: any) => c.text).join('\n');
resetStanding();
r = await engageIn('w1', { handle: 'cy', at: '11' });
ok(r.includes(way) && r.includes('1 FIND IT.') && r.includes('2 TIE IT.'), 'a session\'s first read carries the way');
ok(!r.includes('PROVENANCE'), 'its root and steps, without its provenance');
ok(r.indexOf('# The law') < r.indexOf(way) && r.indexOf(way) < r.indexOf('# Readings at'), 'beneath the law\'s section, above the readings');
r = await engageIn('w1', { handle: 'cy', at: '11.2' });
ok(r.includes(standsAs) && !r.includes('1 FIND IT.'), 'its second read says it stands, and does not print it again');
r = await engageIn('w2', { handle: 'ada', at: '11.3', say: 'a step no option names · waits on ben', secret: 'ada-key' });
ok(r.includes(way) && r.includes('1 FIND IT.'), 'a session that says before it reads meets it in the say\'s answer');
r = await engageIn('w3', { field: 'tide', handle: 'cy', at: '1' });
ok(!r.includes('# The way') && !r.includes('never handed over'), 'a family whose law only mentions a way, with a way of its name, is handed nothing');
store['ways:thread']['2'] = 'TIE IT, CLOSING.';
r = await engageIn('w1', { handle: 'cy', at: '11' });
ok(r.includes(way) && r.includes('2 TIE IT, CLOSING.'), 'a changed way is given again');
const taught = JSON.parse(readFileSync(new URL('../thread-test-materials/teachings/ways-thread.json', import.meta.url), 'utf8'));
const ran = readFileSync(new URL('../thread-test-materials/teachings/way_w2.txt', import.meta.url), 'utf8').trim();
ok(wayText(taught) === ran, 'what is printed for ways:thread is the text the battery ran at 40 of 40');
const third = JSON.parse(readFileSync(new URL('../thread-test-materials/teachings/ways-thread-w3.json', import.meta.url), 'utf8'));
ok(wayText(third) === readFileSync(new URL('../thread-test-materials/teachings/way_w3.txt', import.meta.url), 'utf8').trim(), 'the third draft prints as the battery runs it');
const beach = readFileSync(new URL('../thread-test-materials/testbeach.py', import.meta.url), 'utf8');
r = await engageIn('w6', { handle: 'cy', at: '11' });
const said = r.split('\n');
ok(['# The way — ways:thread, how a mind carries this family\'s work; given once in a session', '# The law — function:thread, this family’s operator:'].every((h) => said.some((l) => l.startsWith(h)) && beach.includes(h)), 'the test beach prints the first read\'s headers as the router does');
r = await engageIn('w6', { handle: 'cy', at: '11' });
const stood = r.split('\n').filter((l) => /^# The (law|way) — .*standing as it was given/.test(l));
ok(stood.length === 2 && stood.every((l) => beach.includes(l)), 'and the second read\'s');
const door = async (session: string, p: Record<string, unknown>) =>
  (await handlePlay({ world: ORIGIN, handle: 'cy', room: 'door', ...p } as any, { sessionId: session })).content.map((c: any) => c.text).join('\n');
let d = await door('w4', { thread: '11' });
const section = d.slice(d.indexOf('THE THREAD — thread:11'));
ok(section.includes(way) && section.includes('1 FIND IT.') && section.indexOf('11.21 · ben') < section.indexOf(way), 'the door prints it in THE THREAD\'s section, beneath the knots');
r = await engageIn('w4', { handle: 'cy', at: '11' });
ok(r.includes(standsAs) && !r.includes('1 FIND IT.'), 'a session that took the thread up at the door is not handed it again at its first read');
d = await door('w5', {});
ok(!d.includes('# The way'), 'a door with no thread prints no way');

// ── the opening hands it over, before the first knot ──
const append = async (session: string, p: Record<string, unknown>) =>
  (await handleBsp({ agent_id: ORIGIN, append: true, content: 'a new thread · opened by cy', ...p } as any, { sessionId: session })).content.map((c: any) => c.text).join('\n');
r = await append('w7', { block: 'spine:thread' });
ok(r.includes(way) && r.includes('1 FIND IT.') && r.includes('→ slot 13'), 'the answer to opening a thread gives its number and hands the way over');
r = await engageIn('w7', { handle: 'cy', at: '13', say: 'tied the first knot · waits on ben', secret: 'cy-key' });
ok(r.includes(standsAs) && !r.includes('1 FIND IT.'), 'so the first knot\'s answer does not give it again');
ok(r.includes('# The law — function:thread, this family'), 'and still gives the law, which the opening did not');
r = await append('w8', { block: 'spine:tide' });
ok(!r.includes('# The way') && !r.includes('never handed over'), 'opening in a family whose law only mentions a way hands nothing over');
r = await append('w9', { block: 'spine:thread', spindle: '5' });
ok(!r.includes('# The way'), 'an append beneath a line of the spine opens nothing');
r = await append('w9', { block: 'ways:thread' });
ok(!r.includes('# The way'), 'nor does an append to any other block');
r = await append('w4', { block: 'spine:thread' });
ok(r.includes('→ slot 13') && !r.includes('1 FIND IT.'), 'a session already given it is not given it again at an opening');

console.log(`\nthread: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
