// The handshake moves on a thread, played through the site's own reader.
// Read-only; no dependencies; node 18+.
//
//   node scripts/thread-moves.mjs <path to happyseaurchin-home's threads.js>
//
// Each move is a few lines in two hands' mirrors (alice asks, bob is asked)
// and, where the way being tested needs one, a line in a room. The page's
// threads.js runs as it runs on the site, its fetch answered from those
// blocks, and window.beachThreads.waiting(handle) says which cards each hand
// sees. Two ways are played: AS TIED TODAY, no ending, the place in the next
// hand's room (function:thread since 3 November 2026), and WITH THE ENDINGS,
// ' · waits on <handle>' or ' · complete' and every room left empty
// (proposals/2026-11-04-threads-keep-their-endings.md). A move's verdict is
// the cards it should leave, and, where a line could be misread, that the
// line reads as an act; 'later' expects no card before its date and one
// after it.
import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) { console.error('usage: node scripts/thread-moves.mjs <threads.js>'); process.exit(2); }
const HOOK = 'window.beachThreads = { read: read,';
const SRC = readFileSync(path, 'utf8');
if (!SRC.includes(HOOK)) { console.error('threads.js no longer exports as this test expects: ' + HOOK); process.exit(2); }
const RUN = SRC.replace(HOOK, 'window.__thread = function (n) { return readRegistry({ name: "thread:" + n, registry: n, carries: "" }); };\n  ' + HOOK);

const T = '2026-11-04T09:00:00Z';
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const room = (...lines) => Object.fromEntries([['_', 'a room'], ...lines.map(([text, by], i) => [String(i + 1), { _: text, 1: by, 2: '', 3: T }])]);
const mirror = (one) => ({ _: 'MIRROR', 1: one });

async function cards(blocks) {
  blocks = { 'spine:thread': { _: 'THE REGISTRY', 1: { _: 'a test job · opened by alice', 3: T } }, 'pool:alice': room(), 'pool:bob': room(), ...blocks };
  globalThis.window = globalThis;
  globalThis.document = { readyState: 'complete', addEventListener() {}, querySelectorAll: () => [],
    createElement: () => { let t = ''; return { set textContent(v) { t = String(v); }, get innerHTML() { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); } }; } };
  globalThis.fetch = async (url, opts) => {
    const name = new URL(url).searchParams.get('block');
    if (opts && opts.method === 'POST') return { ok: true, status: 200, json: async () => ({}) };
    if (!name) return { ok: true, status: 200, json: async () => ({ blocks: Object.keys(blocks) }) };
    if (!(name in blocks)) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(blocks[name])) };
  };
  (0, eval)(RUN);
  const of = async (h) => (await window.beachThreads.waiting(h, true)).map((c) => c.end.addr).sort().join(' ') || '-';
  const acts = [];
  (function rec(x) { if (x.lines.some((l) => l.act)) acts.push(x.addr); x.kids.forEach(rec); })((await window.__thread('1')).tree);
  return { bob: await of('bob'), alice: await of('alice'), acts };
}

// each move: what it should leave (cards for bob, cards for alice), then its blocks in each way
const ASK = 'alice drafted the plan';
const MOVES = [
  ['ask, with two options', { bob: '1', alice: '-' },
    { 'thread:alice': mirror({ _: ASK, 1: 'bob reviews it', 2: 'bob passes' }), 'pool:bob': room(['thread:1 — please review', 'alice']) },
    { 'thread:alice': mirror({ _: ASK + ' · waits on bob', 1: 'bob reviews it', 2: 'bob passes' }) }],
  ['bob takes an option (the tap)', { bob: '-', alice: '1.1' },
    { 'thread:alice': mirror({ _: ASK, 1: 'bob reviews it', 2: 'bob passes' }), 'thread:bob': mirror({ 1: 'bob reviews it' }), 'pool:bob': room(['thread:1 — please review', 'alice']), 'pool:alice': room(['thread:1.1 — bob reviews it', 'bob']) },
    { 'thread:alice': mirror({ _: ASK + ' · waits on bob', 1: 'bob reviews it', 2: 'bob passes' }), 'thread:bob': mirror({ 1: 'bob reviews it · waits on alice' }) }],
  ['bob refuses, and tells alice', { bob: '-', alice: '1.3' },
    { 'thread:alice': mirror({ _: ASK, 1: 'bob reviews it', 2: 'bob passes' }), 'thread:bob': mirror({ 3: 'not for me this month' }), 'pool:bob': room(['thread:1 — please review', 'alice']), 'pool:alice': room(['thread:1.3 — not for me', 'bob']) },
    { 'thread:alice': mirror({ _: ASK + ' · waits on bob', 1: 'bob reviews it', 2: 'bob passes' }), 'thread:bob': mirror({ 3: 'not for me this month · waits on alice' }) }],
  ['alice takes it back', { bob: '-', alice: '-', act: '1.3' },
    { 'thread:alice': mirror({ _: ASK, 1: 'bob reviews it', 2: 'bob passes', 3: 'withdrawn: carol reviewed it instead' }), 'pool:bob': room(['thread:1 — please review', 'alice']) },
    { 'thread:alice': mirror({ _: ASK + ' · waits on bob', 1: 'bob reviews it', 2: 'bob passes', 3: 'withdrawn: carol reviewed it instead · complete' }) }],
  ['alice finishes her own job', { bob: '-', alice: '-', act: '1.1' },
    { 'thread:alice': mirror({ _: ASK, 1: 'done: published at /plan' }) },
    { 'thread:alice': mirror({ _: ASK + ' · waits on alice', 1: 'done: published at /plan · complete' }) }],
  ['alice records an answer bob gave in chat', { bob: '-', alice: '-', act: '1.3' },
    { 'thread:alice': mirror({ _: ASK, 1: 'bob reviews it', 2: 'bob passes', 3: 'bob, in chat: ship it without a review' }), 'pool:bob': room(['thread:1 — please review', 'alice']) },
    { 'thread:alice': mirror({ _: ASK + ' · waits on bob', 1: 'bob reviews it', 2: 'bob passes', 3: 'bob, in chat: ship it without a review · complete' }) }],
  ['alice hands work to her own later self', { bob: '-', alice: '1' },
    { 'thread:alice': mirror({ _: 'the plan is drafted; the review is next, mine to do' }), 'pool:alice': room(['thread:1 — pick this up tomorrow', 'alice']) },
    { 'thread:alice': mirror({ _: 'the plan is drafted; the review is next, mine to do · waits on alice' }) }],
  ['alice hands work to bob, no options', { bob: '1', alice: '-' },
    { 'thread:alice': mirror({ _: 'the plan is drafted; bob, it is yours to review' }), 'pool:bob': room(['thread:1 — yours to review', 'alice']) },
    { 'thread:alice': mirror({ _: 'the plan is drafted; bob, it is yours to review · waits on bob' }) }],
  ['bob puts it off to a date three days ahead', { bob: '-', alice: '-' },
    { 'thread:alice': mirror({ _: ASK, 1: 'bob reviews it', 2: 'bob passes' }), 'thread:bob': mirror({ 3: { _: 'looking at it on ' + day(3), 1: 'bob reviews it then' } }), 'pool:bob': room(['thread:1 — please review', 'alice'], ['thread:1.3 — on ' + day(3), 'bob']) },
    { 'thread:alice': mirror({ _: ASK + ' · waits on bob', 1: 'bob reviews it', 2: 'bob passes' }), 'thread:bob': mirror({ 3: 'looking at it then · waits on bob from ' + day(3) }) }],
  ['bob put it off to a date now passed', { bob: '1.3', alice: '-' },
    { 'thread:alice': mirror({ _: ASK, 1: 'bob reviews it', 2: 'bob passes' }), 'thread:bob': mirror({ 3: { _: 'looking at it on ' + day(-1), 1: 'bob reviews it then' } }), 'pool:bob': room(['thread:1 — please review', 'alice'], ['thread:1.3 — on ' + day(-1), 'bob']) },
    { 'thread:alice': mirror({ _: ASK + ' · waits on bob', 1: 'bob reviews it', 2: 'bob passes' }), 'thread:bob': mirror({ 3: 'looking at it then · waits on bob from ' + day(-1) }) }],
];

let missed = 0;
const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
console.log(pad('move', 46) + pad('as tied today', 40) + 'with the endings');
for (const [name, want, today, endings] of MOVES) {
  const row = [];
  for (const blocks of [today, endings]) {
    const got = await cards(blocks);
    const misread = want.act && !got.acts.includes(want.act);
    const ok = got.bob === want.bob && got.alice === want.alice && !misread;
    if (!ok) missed++;
    row.push(pad((ok ? 'ok' : 'MISSES') + ` (bob ${got.bob}, alice ${got.alice}${misread ? ', ' + want.act + ' an option' : ''})`, 40));
  }
  console.log(pad(name, 46) + row.join(''));
}
console.log(`\n${missed} of ${MOVES.length * 2} plays miss what the move should leave.`);
