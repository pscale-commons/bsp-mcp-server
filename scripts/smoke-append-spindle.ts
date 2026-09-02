/**
 * Smoke-test the tool-layer plumbing for APPEND AT A SPINDLE (ways:grain
 * branch 5): with `append: true` and a spindle, the write body reaching the
 * beach carries BOTH — the beach walks to the node and allocates beneath it —
 * and the tool renders the ack's full landed address ("2.3", single-decimal).
 * Root append (no spindle) stays byte-identical on the wire: no spindle key.
 *
 * GRAY RIDES THE APPEND (#293, 2026-08-20). Two things changed under this
 * script and it was not updated with them, so it failed 8/14 until 2026-08-23:
 * gray now COMPOSES with append (the old blanket refusal is gone — it was the
 * dead end that cost history:Phenomemental an entry), and a `grain:` append is
 * GRAY BY DEFAULT, so it reads the grain block and encrypts before the wire
 * call. The spindle-plumbing batteries below therefore say `gray: false`
 * explicitly — they pin the wire shape and the ack rendering, and want their
 * content assertable byte-for-byte — while the last battery pins the gray
 * default itself, which is the coverage whose absence let the drift sit.
 *
 * Offline: a local mock beach records every POST body and answers canned
 * acks, so this proves the request shape and the ack rendering without a
 * real beach. The beach-side mechanics (allocation, node supernest, lock
 * resolution) are proven by pscale-beach's own smoke:append-spindle; the gray
 * append end-to-end (ten entries, the tenth supernesting, all ten still
 * decrypting) by smoke:gray-append-live against the real beach. Anything
 * needing a party's PUBLISHED keys belongs there, not here — a key lookup
 * leaves the mock for the default beach, and an offline script must not.
 *
 * Run: npx tsx scripts/smoke-append-spindle.ts
 */

import { createServer } from 'node:http';
import { handleBsp } from '../src/tools/bsp.js';
import { appendToBeach } from '../src/db.js';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`); }
}
function getText(r: any): string {
  return r?.content?.[0]?.text ?? '';
}

// ── Mock beach — records POST bodies, serves named blocks, answers canned acks ──

const posted: any[] = [];
/** Named blocks this surface holds. A GET for anything else is a 404 (absence
 *  is data — `loadBlock` returns null, and nothing mistakes the surface index
 *  for a block). */
const served = new Map<string, any>();
let ackFor = (body: any): { status: number; json: any } => ({ status: 200, json: { ok: true } });

const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const url = new URL(req.url ?? '/', 'http://mock');
  if (!url.pathname.startsWith('/.well-known/pscale-beach')) {
    res.writeHead(404).end(JSON.stringify({ error: 'not a beach endpoint' }));
    return;
  }
  if (req.method === 'GET') {
    const name = url.searchParams.get('block');
    // Federation probe + surface index — the URL is the surface.
    if (!name) {
      res.writeHead(200).end(JSON.stringify({ _: 'mock beach', origin: 'mock', blocks: [...served.keys()] }));
      return;
    }
    if (!served.has(name)) {
      res.writeHead(404).end(JSON.stringify({ error: 'no such block' }));
      return;
    }
    res.writeHead(200).end(JSON.stringify(served.get(name)));
    return;
  }
  if (req.method === 'POST') {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    let body: any = {};
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { /* keep {} */ }
    posted.push(body);
    const { status, json } = ackFor(body);
    res.writeHead(status).end(JSON.stringify(json));
    return;
  }
  res.writeHead(405).end(JSON.stringify({ error: 'method' }));
});

await new Promise<void>((resolve) => server.listen(0, resolve));
const port = (server.address() as any).port;
const BEACH = `http://localhost:${port}`;

/** The body of a POST made since `mark` — undefined if the call never reached
 *  the wire. Reading `posted.at(-1)` blind lets a refused call assert green
 *  against the PREVIOUS case's body; that is how a silent pass hides a
 *  short-circuit, so every wire assertion below goes through here. */
function postedSince(mark: number): any {
  return posted.length > mark ? posted.at(-1) : undefined;
}

// ── The battery ──

console.log('=== node-scoped append: the body carries BOTH append and spindle ===');
ackFor = () => ({ status: 200, json: { ok: true, slot: '1', address: '2.1', node: '2', supernested: false } });
let mark = posted.length;
let r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, spindle: '2', content: 'first message', secret: 'key-two', gray: false });
let b = postedSince(mark);
assert(b?.append === true && b?.spindle === '2', 'wire body carries append:true AND spindle:"2"', JSON.stringify(b));
assert(
  b?.content?._ === 'first message' && typeof b?.content?.['3'] === 'string' && b?.secret === 'key-two',
  'plain entry rides stamped ({_, 3: iso}) with secret in the same body',
  JSON.stringify(b?.content),
);
assert(b?.resolve_window === undefined && b?.resolve_seen === undefined, 'no resolver fields on a plain side append');
assert(getText(r).includes('2.1') && getText(r).includes('beneath node 2'), 'ack renders the full landed address', getText(r));

console.log('\n=== node supernest: the ack says the SIDE wrapped, ladder within ===');
ackFor = () => ({ status: 200, json: { ok: true, slot: '11', address: '2.11', node: '2', supernested: true } });
r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, spindle: '2', content: 'tenth message', secret: 'key-two', gray: false });
assert(getText(r).includes('2.11'), 'tenth renders address 2.11', getText(r));
assert(getText(r).includes('node supernested'), 'node-scoped supernest named as such (never a block-floor claim)', getText(r));

console.log('\n=== root append byte-unchanged on the wire ===');
ackFor = () => ({ status: 200, json: { ok: true, slot: '3', supernested: false, floor: 1 } });
mark = posted.length;
r = await handleBsp({ agent_id: BEACH, block: 'marks', append: true, content: { _: 'a mark', '1': 'someone' } });
b = postedSince(mark);
assert(b?.append === true && !('spindle' in b), 'root append body has NO spindle key', JSON.stringify(b));
assert(getText(r).includes('slot 3') && !getText(r).includes('beneath'), 'root ack rendering unchanged', getText(r));
mark = posted.length;
r = await handleBsp({ agent_id: BEACH, block: 'marks', append: true, spindle: '', content: { _: 'a mark' } });
b = postedSince(mark);
assert(b !== undefined && !('spindle' in b), 'empty-string spindle forwards nothing — still a root append', JSON.stringify(b));

console.log('\n=== db layer: appendToBeach forwards spindle positionally ===');
mark = posted.length;
await appendToBeach(BEACH, 'grain:cafe', 'direct entry' as any, 'key-two', undefined, undefined, '2');
b = postedSince(mark);
assert(b?.append === true && b?.spindle === '2', 'appendToBeach(…, spindle) lands spindle in the body', JSON.stringify(b));
mark = posted.length;
await appendToBeach(BEACH, 'marks', { _: 'entry' } as any);
b = postedSince(mark);
assert(b !== undefined && !('spindle' in b) && b?.secret === undefined, 'omitted spindle and secret stay off the wire', JSON.stringify(b));

console.log('\n=== beach refusals surface as rejections, not silence ===');
ackFor = () => ({ status: 409, json: { error: '"2.1" of "grain:cafe" holds a scalar, not a node', code: 'append_at_leaf' } });
r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, spindle: '2.1', content: 'x', secret: 'key-two', gray: false });
assert(getText(r).startsWith('Append rejected:') && getText(r).includes('scalar'), 'a string-leaf refusal reaches the caller with the beach\'s words', getText(r));
ackFor = () => ({ status: 403, json: { error: 'secret does not match', code: 'lock_required' } });
r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, spindle: '2', content: 'x', secret: 'wrong', gray: false });
assert(getText(r).startsWith('Append rejected:') && getText(r).includes('secret does not match'), 'a cross-side key refusal reaches the caller', getText(r));

// ── Gray rides the append (#293) ─────────────────────────────────────────────
// The dead end closed: a gray accumulator whose ladder filled had no legal
// tenth entry, because append — the only act that supernests atomically — used
// to refuse gray outright. It encrypts here and the beach allocates an opaque
// node knowing nothing about it. And the quieter half: a grain append was
// landing in the CLEAR on the documented grain-conversation path, so it is now
// gray by default and must name its side.
console.log('\n=== gray rides the append; a grain append is gray by DEFAULT ===');
ackFor = () => ({ status: 200, json: { ok: true, slot: '4', supernested: false, floor: 1 } });
mark = posted.length;
r = await handleBsp({ agent_id: BEACH, block: 'history:someone', append: true, content: 'a private line', gray: true, enc_secret: 'author-key' });
b = postedSince(mark);
const envelope = b?.content;
assert(getText(r).includes('slot 4'), 'a gray accumulator append reaches the wire — the dead end is closed', getText(r));
assert(typeof envelope === 'object' && envelope?.['1'] !== undefined && envelope?.['2'] !== undefined && envelope?.['9']?._ === 'gray',
  'what travels is a finished envelope, allocated like any other entry', JSON.stringify(envelope));
assert(JSON.stringify(b).includes('a private line') === false, 'the plaintext never reaches the beach');

mark = posted.length;
r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, spindle: '2', content: 'x' });
assert(getText(r).includes('gray encryption requires an encryption key'), 'an unkeyed grain append is REFUSED, never quietly written in the clear', getText(r));
assert(postedSince(mark) === undefined, 'and it is refused before any wire call');

r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, spindle: '2', content: 'x', enc_secret: 'e' });
assert(getText(r).includes('needs `secret` to prove your side lock'), 'privacy alone is not authority — the side lock is still proved', getText(r));

r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, content: 'x', secret: 'key-two' });
assert(getText(r).includes('must name your side'), 'an unsided grain append cannot be encrypted to a party', getText(r));

mark = posted.length;
r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, spindle: '2', content: 'x', secret: 'key-two', enc_secret: 'e' });
assert(getText(r).startsWith('Append rejected:') && getText(r).includes('grain not established'),
  'a grain with no parties at 9 refuses the encryption, and says which precondition failed', getText(r));
assert(postedSince(mark) === undefined, 'and nothing was written while the precondition was unmet');

console.log('\n=== a group accumulator is still refused, not encrypted to the wrong key ===');
served.set('group-log', { _: 'a group block', '9': { _: 'group-keyring' } });
mark = posted.length;
r = await handleBsp({ agent_id: BEACH, block: 'group-log', append: true, content: 'x', gray: true, enc_secret: 'e' });
assert(getText(r).includes('a group append is not supported yet'), 'a keyring at 9 refuses rather than self-encrypting', getText(r));
assert(postedSince(mark) === undefined, 'and refuses before any wire call');

server.close();
console.log('\n=== summary ===');
console.log(`  pass: ${pass}`);
console.log(`  fail: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
