/**
 * Smoke-test the tool-layer plumbing for APPEND AT A SPINDLE (ways:grain
 * branch 5): with `append: true` and a spindle, the write body reaching the
 * beach carries BOTH — the beach walks to the node and allocates beneath it —
 * and the tool renders the ack's full landed address ("2.3", single-decimal).
 * Root append (no spindle) stays byte-identical on the wire: no spindle key.
 *
 * Offline: a local mock beach records every POST body and answers canned
 * acks, so this proves the request shape and the ack rendering without a
 * real beach. The beach-side mechanics (allocation, node supernest, lock
 * resolution) are proven by pscale-beach's own smoke:append-spindle.
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

// ── Mock beach — records POST bodies, answers canned acks ──

const posted: any[] = [];
let ackFor = (body: any): { status: number; json: any } => ({ status: 200, json: { ok: true } });

const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (!req.url?.startsWith('/.well-known/pscale-beach')) {
    res.writeHead(404).end(JSON.stringify({ error: 'not a beach endpoint' }));
    return;
  }
  if (req.method === 'GET') {
    // Federation probe + any read — a live, empty surface.
    res.writeHead(200).end(JSON.stringify({ _: 'mock beach', origin: 'mock', blocks: [] }));
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

// ── The battery ──

console.log('=== node-scoped append: the body carries BOTH append and spindle ===');
ackFor = () => ({ status: 200, json: { ok: true, slot: '1', address: '2.1', node: '2', supernested: false } });
let r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, spindle: '2', content: 'first message', secret: 'key-two' });
let b = posted.at(-1);
assert(b?.append === true && b?.spindle === '2', 'wire body carries append:true AND spindle:"2"', JSON.stringify(b));
assert(b?.content === 'first message' && b?.secret === 'key-two', 'content and secret ride the same body');
assert(b?.resolve_window === undefined && b?.resolve_seen === undefined, 'no resolver fields on a plain side append');
assert(getText(r).includes('2.1') && getText(r).includes('beneath node 2'), 'ack renders the full landed address', getText(r));

console.log('\n=== node supernest: the ack says the SIDE wrapped, ladder within ===');
ackFor = () => ({ status: 200, json: { ok: true, slot: '11', address: '2.11', node: '2', supernested: true } });
r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, spindle: '2', content: 'tenth message', secret: 'key-two' });
assert(getText(r).includes('2.11'), 'tenth renders address 2.11', getText(r));
assert(getText(r).includes('node supernested'), 'node-scoped supernest named as such (never a block-floor claim)', getText(r));

console.log('\n=== root append byte-unchanged on the wire ===');
ackFor = () => ({ status: 200, json: { ok: true, slot: '3', supernested: false, floor: 1 } });
r = await handleBsp({ agent_id: BEACH, block: 'marks', append: true, content: { _: 'a mark', '1': 'someone' } });
b = posted.at(-1);
assert(b?.append === true && !('spindle' in b), 'root append body has NO spindle key', JSON.stringify(b));
assert(getText(r).includes('slot 3') && !getText(r).includes('beneath'), 'root ack rendering unchanged', getText(r));
r = await handleBsp({ agent_id: BEACH, block: 'marks', append: true, spindle: '', content: { _: 'a mark' } });
b = posted.at(-1);
assert(!('spindle' in b), 'empty-string spindle forwards nothing — still a root append', JSON.stringify(b));

console.log('\n=== db layer: appendToBeach forwards spindle positionally ===');
await appendToBeach(BEACH, 'grain:cafe', 'direct entry' as any, 'key-two', undefined, undefined, '2');
b = posted.at(-1);
assert(b?.append === true && b?.spindle === '2', 'appendToBeach(…, spindle) lands spindle in the body', JSON.stringify(b));
await appendToBeach(BEACH, 'marks', { _: 'entry' } as any);
b = posted.at(-1);
assert(!('spindle' in b) && b?.secret === undefined, 'omitted spindle and secret stay off the wire', JSON.stringify(b));

console.log('\n=== beach refusals surface as rejections, not silence ===');
ackFor = () => ({ status: 409, json: { error: '"2.1" of "grain:cafe" holds a scalar, not a node', code: 'append_at_leaf' } });
r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, spindle: '2.1', content: 'x', secret: 'key-two' });
assert(getText(r).startsWith('Append rejected:') && getText(r).includes('scalar'), 'a string-leaf refusal reaches the caller with the beach\'s words', getText(r));
ackFor = () => ({ status: 403, json: { error: 'secret does not match', code: 'lock_required' } });
r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, spindle: '2', content: 'x', secret: 'wrong' });
assert(getText(r).startsWith('Append rejected:') && getText(r).includes('secret does not match'), 'a cross-side key refusal reaches the caller', getText(r));

console.log('\n=== gray/group still do not compose with append ===');
r = await handleBsp({ agent_id: BEACH, block: 'grain:cafe', append: true, spindle: '2', content: 'x', gray: true });
assert(getText(r).includes('gray/group encryption is not supported with append'), 'gray refused before any wire call', getText(r));

server.close();
console.log('\n=== summary ===');
console.log(`  pass: ${pass}`);
console.log(`  fail: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
