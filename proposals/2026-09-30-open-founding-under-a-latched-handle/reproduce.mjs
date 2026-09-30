// reproduce.mjs — the two cases of open founding under a latched handle, and the passport case
// found beside them, run against the beach's REAL handler in-process, on a scratch folder.
// Nothing live is touched: the store is a directory of JSON files, the origin is beach.test, and
// no network call is made.
//
//   BEACH_DIR=/path/to/pscale-beach node reproduce.mjs
//
// BEACH_DIR is a checkout of github.com/pscale-commons/pscale-beach at main (or an operator's
// clone of it), with its node_modules installed. Every name below is invented.
//
// Each line is one call, the beach's answer, and what it shows. The script exits 0 when every
// line answers as the proposal says it does today, and 1 when any line answers differently —
// which is what a handler that has closed the gap will do, and the lines it changes are the fix.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
process.env.KV_REST_API_URL = 'https://local.invalid';
process.env.KV_REST_API_TOKEN = 'local';
process.env.BEACH_ORIGIN = 'beach.test';
const BEACH_DIR = process.env.BEACH_DIR;
if (!BEACH_DIR) { console.error('set BEACH_DIR to a checkout of pscale-commons/pscale-beach'); process.exit(2); }
const { FileRedis } = await import(path.join(BEACH_DIR, 'scripts/file-redis.mjs'));
const { default: handler, __setRedis } = await import(path.join(BEACH_DIR, 'api/pscale-beach.js'));
__setRedis(new FileRedis(fs.mkdtempSync(path.join(os.tmpdir(), 'open-founding-'))));

async function call(method, block, body = {}) {
  const req = { method, query: block ? { block } : {}, body, headers: { host: 'beach.test' }, url: '/.well-known/pscale-beach' };
  let status = 200, payload = null;
  const res = { setHeader() {}, status(c) { status = c; return this; }, json(o) { payload = o; return this; }, end() { return this; } };
  await handler(req, res);
  return { status, body: payload || {} };
}
const post = (block, body) => call('POST', block, body);
const read = async (block) => (await call('GET', block)).body;
// The one way to ask "is this block latched?" today: a relinquish with no key. It writes nothing
// either way, and answers 403 where a root latch stands and 200 where none does.
const latched = async (block) => (await post(block, { new_lock: null })).status === 403;

let differs = 0;
function line(what, r, want) {
  const got = typeof r === 'boolean' ? r : r.status === want.status && (want.code === undefined || r.body.code === want.code) && (want.born === undefined || Boolean(r.body.born) === want.born);
  const said = typeof r === 'boolean' ? '' : `  → ${r.status}${r.body.code ? ' ' + r.body.code : ''}${r.body.born ? ' born' : ''}`;
  console.log(`  ${got ? 'as described' : 'DIFFERS     '}  ${what}${said}`);
  if (!got) differs++;
}

const ALICE = 'alice-key-one', WRONG = 'not-her-key';   // the stranger carries no key at all

console.log('\nBefore either case: alice holds her name');
line('alice founds passport:alice latched under her key', await post('passport:alice', { content: { _: 'alice — here' }, new_lock: ALICE }), { status: 200, born: true });

console.log('\nCASE 1 — a stranger founds <family>:<Name> open, before the person has written in that family');
line('a stranger founds garden:alice with no latch, holding words alice never wrote', await post('garden:alice', { content: { _: 'MIRROR — alice’s readings on the garden.', 1: 'I think we should pave it over.' } }), { status: 200, born: true });
line('the stranger cannot latch it: the rule of 28 September holds', await post('garden:alice', { new_lock: 'stranger-key' }), { status: 403, code: 'handle_bound' });
const index = (await call('GET', null)).body;
line('the index lists garden:alice beside her passport', index.blocks.includes('garden:alice') && index.blocks.includes('passport:alice'), {});
line('and the index says names, sizes and dates only, nothing of which blocks are latched', Object.keys(index).every((k) => ['_', 'origin', 'blocks', 'bytes', 'touched', 'born', 'now'].includes(k)), {});
line('alice’s page founds her mirror latched — the beach says it already stands', await post('garden:alice', { content: { _: 'MIRROR — alice’s readings.' }, new_lock: ALICE }), { status: 400, code: 'confirm_required' });
line('the page carries on and writes her first line, her key sent as the secret', await post('garden:alice', { spindle: '2', content: 'Keep the pond.', secret: ALICE }), { status: 200, born: false });
line('the block is still unlatched', !(await latched('garden:alice')), {});
const both = await read('garden:alice');
line('the stranger’s line and alice’s line stand together under her name', both['1'] === 'I think we should pave it over.' && both['2'] === 'Keep the pond.', {});
line('the stranger rewrites alice’s own line, keyless', await post('garden:alice', { spindle: '2', content: 'Fill in the pond.' }), { status: 200 });
line('what a page would have had to send: her key as secret and as new lock', await post('garden:alice', { secret: ALICE, new_lock: ALICE }), { status: 200 });
line('now the stranger is refused', await post('garden:alice', { spindle: '3', content: 'more' }), { status: 403, code: 'lock_required' });
const after = await read('garden:alice');
line('but both of the stranger’s lines remain, now inside a block latched as alice’s', after['1'] === 'I think we should pave it over.' && after['2'] === 'Fill in the pond.', {});

console.log('\nCASE 2 — a write that carries a secret, to a block that does not exist, bears it unlatched');
line('alice founds notes:alice latched', await post('notes:alice', { content: { _: 'alice’s notes' }, new_lock: ALICE }), { status: 200, born: true });
line('a stranger’s write is refused by her latch', await post('notes:alice', { spindle: '1', content: 'not alice' }), { status: 403, code: 'lock_required' });
line('the block is removed (her own wipe here; an owner’s tidy or a restore gap does the same)', await call('DELETE', 'notes:alice', { confirm: true, secret: ALICE }), { status: 200 });
line('her page writes her next line as it always has, key sent — the beach bears the block again', await post('notes:alice', { spindle: '1', content: 'her next line', secret: ALICE }), { status: 200, born: true });
line('and it came back with no latch', !(await latched('notes:alice')), {});
line('a stranger writes in it, keyless', await post('notes:alice', { spindle: '2', content: 'not alice' }), { status: 200 });
line('the same through an append: history:alice is born of a keyed append', await post('history:alice', { append: true, content: 'first entry', secret: ALICE }), { status: 200, born: true });
line('and stands unlatched', !(await latched('history:alice')), {});
line('the secret is not looked at when nothing stands: a wrong key founds diary:alice', await post('diary:alice', { spindle: '1', content: 'x', secret: WRONG }), { status: 200, born: true });

console.log('\nBESIDE THE TWO — the passport itself: a first write at a position leaves its root open, and the name can be taken');
const NADIA = 'nadia-key-one';
line('nadia’s passport is born of her Location line, her new key riding that write', await post('passport:nadia', { spindle: '3', content: 'Location: near Leeds', new_lock: NADIA }), { status: 200, born: true });
line('the key latched position 3 only: the root of her passport carries no latch', !(await latched('passport:nadia')), {});
line('so her name binds nothing: a stranger founds and latches now:nadia', await post('now:nadia', { content: { _: 'MIRROR — nadia’s readings.' }, new_lock: 'stranger-key' }), { status: 200, born: true });
line('and a stranger latches the passport’s root', await post('passport:nadia', { new_lock: 'stranger-key' }), { status: 200 });
line('the name is taken: nadia’s own key is refused at every position but 3', await post('passport:nadia', { spindle: '1', content: 'what I offer', secret: NADIA }), { status: 403, code: 'lock_required' });

console.log(differs ? `\n${differs} line(s) differ from the proposal’s account` : '\nevery line answers as described');
process.exit(differs ? 1 : 0);
