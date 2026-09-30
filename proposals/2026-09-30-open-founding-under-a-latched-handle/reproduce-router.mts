// reproduce-router.mts — the same two cases as reproduce.mjs, met through this router's own
// doors: pscale_stream_engage (say) and bsp(). The router in this tree runs in-process against
// the beach's REAL handler on a scratch folder; fetch is stubbed to that handler and refuses
// every other host, so nothing live can be reached.
//
//   BEACH_DIR=/path/to/pscale-beach npx tsx proposals/2026-09-30-open-founding-under-a-latched-handle/reproduce-router.mts
//
// BEACH_DIR as for reproduce.mjs. Exits 0 when every line answers as the proposal says it does
// today, 1 when any line differs. Every name below is invented.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
process.env.KV_REST_API_URL = 'https://local.invalid';
process.env.KV_REST_API_TOKEN = 'local';
process.env.BEACH_ORIGIN = 'rig.test';
const ORIGIN = 'https://rig.test';
process.env.DEFAULT_BEACH = ORIGIN;
const BEACH_DIR = process.env.BEACH_DIR;
if (!BEACH_DIR) { console.error('set BEACH_DIR to a checkout of pscale-commons/pscale-beach'); process.exit(2); }
const { FileRedis } = await import(path.join(BEACH_DIR, 'scripts/file-redis.mjs'));
const { default: handler, __setRedis } = await import(path.join(BEACH_DIR, 'api/pscale-beach.js'));
__setRedis(new FileRedis(fs.mkdtempSync(path.join(os.tmpdir(), 'open-founding-router-'))));

async function door(method: string, query: Record<string, string>, body: any = {}) {
  let status = 200, payload: any = null;
  const res = { setHeader() {}, status(c: number) { status = c; return this; }, json(o: any) { payload = o; return this; }, end() { return this; } };
  await handler({ method, query, body, headers: { host: 'rig.test' }, url: '/.well-known/pscale-beach' }, res);
  return { status, body: payload || {} };
}
globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = new URL(String(input));
  if (url.host !== 'rig.test') throw new Error(`the rig refuses ${url.host}`);
  const r = await door((init.method || 'GET').toUpperCase(), Object.fromEntries(url.searchParams), init.body ? JSON.parse(init.body) : {});
  return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'content-type': 'application/json' } });
}) as any;
const raw = (block: string, body: any, method = 'POST') => door(method, { block }, body);
const latched = async (block: string) => (await raw(block, { new_lock: null })).status === 403;

const { handleStreamEngage } = await import('../../src/tools/stream.js');
const { handleBsp } = await import('../../src/tools/bsp.js');
const said = (r: any): string => (r?.content ?? []).map((c: any) => c.text).join('\n');
let differs = 0;
function line(what: string, ok: boolean, shown = '') {
  console.log(`  ${ok ? 'as described' : 'DIFFERS     '}  ${what}${shown ? `\n                  ${shown}` : ''}`);
  if (!ok) differs++;
}

const ALICE = 'alice-key-one';
await raw('passport:alice', { content: { _: 'alice — here' }, new_lock: ALICE });
await raw('spine:garden', { content: { _: 'SPINE — the garden.', 1: 'The pond.', 2: 'The beds.' }, new_lock: 'gardener-key' });

console.log('\nCASE 1 through the stream door — anyone says as alice, where alice has not yet said');
let out = said(await handleStreamEngage({ field: 'garden', handle: 'alice', at: '1', say: 'I think we should pave it over.', beach: ORIGIN } as any));
line('a stranger calls say with handle=alice and no key: the reading lands', /your reading landed at garden:alice/.test(out), out.split('\n').find((l) => /landed|Could not|refused/.test(l)) ?? '');
line('garden:alice now stands, unlatched', (await raw('garden:alice', {}, 'GET')).status === 200 && !(await latched('garden:alice')));
out = said(await handleStreamEngage({ field: 'garden', handle: 'alice', at: '2', say: 'Plant beans in the beds.', secret: ALICE, beach: ORIGIN } as any));
line('alice says with her key: it lands in the stranger’s block, and nothing tells her', /your reading landed at garden:alice/.test(out) && !/unlatched|open|not locked/i.test(out), out.split('\n').find((l) => /landed/.test(l)) ?? '');
line('the block is still unlatched after her keyed say', !(await latched('garden:alice')));
out = said(await handleStreamEngage({ field: 'garden', handle: 'bob', at: '1', beach: ORIGIN } as any));
line('any reader who folds the pond is handed the stranger’s words as alice’s reading', /- alice: I think we should pave it over\./.test(out), out.split('\n').find((l) => /^- alice/.test(l)) ?? '');

console.log('\nCASE 2 through bsp() — a keyed write to a block that is gone');
await handleBsp({ agent_id: ORIGIN, block: 'notes:alice', content: { _: 'alice’s notes' }, new_lock: ALICE } as any);
line('alice founds notes:alice latched through bsp()', await latched('notes:alice'));
await raw('notes:alice', { confirm: true, secret: ALICE }, 'DELETE');
out = said(await handleBsp({ agent_id: ORIGIN, block: 'notes:alice', spindle: '1', content: 'her next line', secret: ALICE } as any));
line('her next keyed write bears it again; the ack says it is new, and says nothing of the latch', /this write created "notes:alice"/.test(out) && !/unlatched|no latch|open to/i.test(out), out.split('\n').find((l) => /created/.test(l))?.trim() ?? '');
line('notes:alice stands unlatched', !(await latched('notes:alice')));

console.log('\nWhat the stream door already does right');
await raw('garden:alice', { confirm: true }, 'DELETE');
await handleStreamEngage({ field: 'garden', handle: 'alice', at: '2', say: 'Plant beans in the beds.', secret: ALICE, beach: ORIGIN } as any);
line('a mirror that is gone, said again with the key, is founded latched (bsp-mcp #443)', await latched('garden:alice'));

console.log(differs ? `\n${differs} line(s) differ from the proposal’s account` : '\nevery line answers as described');
process.exit(differs ? 1 : 0);
