/** Smoke — a mirror said through the stream door is born LOCKED to its holder's key.
 *
 *  The born text has always said "Sovereign to its holder; nobody else writes here",
 *  and the /now page founds a mirror with new_lock, but pscale_stream_engage founded
 *  it open: any hand could overwrite a person's reading (found 2026-09-27 walking
 *  Matthew's recovery-capital journey, lero-nnh-design-proposal 7.3). The personal
 *  tree had the same fault; the collective fold is open by design and stays so.
 *
 *  Offline: fetch answers from a small in-memory beach that honours a latch set at
 *  creation (R1) and inherited by every position, so this is the round trip, not
 *  only the request shape. */
import { writeAt } from '../src/bsp.js';

const ORIGIN = 'https://smoke-stream.test';
process.env.DEFAULT_BEACH = ORIGIN;

const store: Record<string, any> = {
  'spine:probe-field': { _: 'a probe field for this smoke', '1': 'one', '2': 'two' },
};
const locks: Record<string, string> = {};
const posts: Array<{ block: string; [k: string]: any }> = [];

globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = new URL(String(input));
  if (url.host !== 'smoke-stream.test') throw new Error(`smoke refuses ${url.host}`);
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
  if (!born && locks[block!] !== undefined && body.secret !== locks[block!]) {
    return json(403, { error: `position "${body.spindle ?? ''}" of "${block}" inherits the lock at its root, secret required` });
  }
  if (body.spindle) writeAt(store[block!], body.spindle, body.content);
  else store[block!] = body.content;
  if (born && body.new_lock) locks[block!] = body.new_lock;
  return json(200, { ok: true, ...(born ? { born: true } : {}) });
}) as any;

const { handleStreamEngage } = await import('../src/tools/stream.js');

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };
const mint = (block: string) => posts.find(p => p.block === block);
const engage = (p: Record<string, unknown>) => handleStreamEngage({ field: 'probe-field', at: '1', beach: ORIGIN, ...p } as any);
const keyless = async (block: string) => (await fetch(`${ORIGIN}/.well-known/pscale-beach?block=${encodeURIComponent(block)}`,
  { method: 'POST', body: JSON.stringify({ spindle: '1', content: 'someone else' }) })).status;

await engage({ handle: 'sam', say: 'my sister and I talk most days now', secret: 'sam-key' });
ok(mint('probe-field:sam')?.new_lock === 'sam-key', 'a say carrying a key founds the mirror with that key as its latch');
ok(await keyless('probe-field:sam') === 403, 'another hand cannot overwrite the reading');
await engage({ handle: 'sam', say: 'we met for coffee on Sunday', secret: 'sam-key' });
ok(store['probe-field:sam']?.['1'] === 'we met for coffee on Sunday', 'the holder says again, and it lands');

await engage({ handle: 'open', say: 'no key here' });
ok(mint('probe-field:open') !== undefined && mint('probe-field:open')!.new_lock === undefined, 'a keyless say founds an open mirror, as before');
ok(await keyless('probe-field:open') === 200, 'an open mirror stays open until its holder homesteads it');

await engage({ handle: 'sam', keep: 'personal', keep_text: 'mine', secret: 'sam-key' });
ok(mint('tree:probe-field:sam')?.new_lock === 'sam-key', 'a personal keep founds the tree locked to the same key');

await engage({ handle: 'sam', keep: 'collective', keep_text: 'ours', secret: 'sam-key' });
ok(mint('probe-field') !== undefined && mint('probe-field')!.new_lock === undefined, 'the collective fold is still founded open — anyone may supersede');

console.log(`\nstream born locked: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
