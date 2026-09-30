// offline-checks.mjs — what the "confirmed or removed" proposal leans on, run against the beach's
// REAL handler in-process, on a scratch folder. Nothing live is touched: the store is a directory
// of JSON files, the origin is beach.test, and no network call is made.
//
//   BEACH_DIR=/path/to/pscale-beach node offline-checks.mjs
//
// BEACH_DIR is a checkout of github.com/pscale-commons/pscale-beach at main (or an operator's
// clone of it), with its node_modules installed. Every name, key and line below is invented.
// Nothing here builds the proposal: no block named `confirmed` is made anywhere but the scratch
// folder, the reader below is the rule of §5 written out to be tried, and the removal in section 9
// is a handful of store calls, not the script the proposal asks for.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'confirmed-checks-'));
process.env.KV_REST_API_URL = 'https://local.invalid';
process.env.KV_REST_API_TOKEN = 'local';
process.env.BEACH_ORIGIN = 'beach.test';
const BEACH_DIR = process.env.BEACH_DIR;
if (!BEACH_DIR) { console.error('set BEACH_DIR to a checkout of pscale-commons/pscale-beach'); process.exit(2); }
const { FileRedis } = await import(path.join(BEACH_DIR, 'scripts/file-redis.mjs'));
const { default: handler, __setRedis } = await import(path.join(BEACH_DIR, 'api/pscale-beach.js'));
const { surface, makeDoor } = await import(path.join(BEACH_DIR, 'scripts/set-aside.mjs'));
const redis = new FileRedis(dir);
__setRedis(redis);

const APEX = 'beach.test', SUB = 'earth.beach.test';
async function call(method, { host = APEX, world = null, block, spindle, pscale, body, tables } = {}) {
  const q = {};
  if (world) q.world = world;
  if (block) q.block = block;
  if (tables) q.tables = '';
  if (spindle != null) q.spindle = spindle;
  if (pscale != null) q.pscale = String(pscale);
  const base = (world ? `/w/${world}` : '') + '/.well-known/pscale-beach';
  const b = Object.assign({}, body || {});
  if (method !== 'GET' && spindle != null) { b.spindle = spindle; delete q.spindle; }
  const req = { method, query: q, body: b, headers: { host }, url: base };
  let status = 200, payload = null;
  const res = { setHeader() {}, status(c) { status = c; return this; }, json(o) { payload = o; return this; }, end() { return this; } };
  await handler(req, res);
  return { status, body: payload };
}
let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + JSON.stringify(detail).slice(0, 300) : '')); }
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const ns = (world) => `pscale-beach-v2:${APEX}/w/${world}:`;

// the hands: the beach's owner, whoever made the place, the organisation's own people, a stranger,
// and two people who take a name there
const OWNER = 'owner-operator-words', MAKER = 'maker-words-as-made', THEIRS = 'their-own-new-words', STRANGER = 'a-strangers-words';
const SAM = 'river candle seven', JO = 'green kettle north';

// ── THE READER: §5's rule, written out. A page or an assistant holding no key. ──
// Every line of an accumulator in the block's own order, through the wraps it grows.
function entries(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (node._ && typeof node._ === 'object') entries(node._, out);
  for (const k of '123456789') {
    const e = node[k];
    if (e && typeof e === 'object' && typeof e._ === 'string' && typeof e['2'] === 'string' && typeof e['3'] === 'string') out.push(e);
    else if (e && typeof e === 'object') entries(e, out);
  }
  return out;
}
// Two addresses are the same place whatever the scheme, the capitals or a trailing slash.
const norm = (a) => String(a).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
// The newest line for a place is the LAST one in the block's own order, never the latest stamp.
function newest(block, where) {
  const mine = entries(block).filter((e) => norm(e['2']) === norm(where));
  return mine.length ? mine[mine.length - 1] : null;
}
const firstWord = (line) => (line ? line._.split(/[\s.:,—-]/)[0] : null);
// A lighthouse entry is one line, '<address> — <what it is>'. The owner's block is trusted only
// when the beach's own lighthouse names it, wherever in the lighthouse that line happens to sit.
function named(node, name) {
  if (typeof node === 'string') return node.startsWith(name + ' — ');
  if (!node || typeof node !== 'object') return false;
  return Object.values(node).some((v) => named(v, name));
}
// The whole rule. `given` is the address a reader was handed. `naive` trusts that address for the
// beach it names; the rule asks the place itself where it stands.
async function reader(given, { naive = false } = {}) {
  const m = String(given).match(/^https?:\/\/([^/]+)\/w\/([a-z0-9-]+)\/?$/i);
  if (!m) return null;
  const givenHost = m[1].toLowerCase(), world = m[2].toLowerCase();
  const idx = (await call('GET', { host: givenHost, world })).body;
  const where = naive ? `${givenHost}/w/${world}` : idx.origin;          // the beach computes `origin`
  const beach = naive ? givenHost : String(idx.origin).replace(/\/w\/.*$/, '');
  const compass = await call('GET', { host: beach, block: 'lighthouse' });
  if (compass.status !== 200 || !named(compass.body, 'confirmed')) return null;
  const book = await call('GET', { host: beach, block: 'confirmed' });
  if (book.status !== 200) return null;
  const line = newest(book.body, where);
  if (firstWord(line) !== 'Confirmed') return null;
  // the front line the owner confirmed must be the one still standing: born before his line
  const born = (idx.born || {}).lighthouse;
  if (!naive && born && !(Date.parse(born) < Date.parse(line['3']))) return null;
  return line;
}

console.log('1. No perimeter: any hand makes a place under any name and says anything in it');
let r = await call('POST', { world: 'orchard', block: 'lighthouse', body: { content: { _: 'Orchard Recovery\'s own place. Confirmed by the owner of this beach.' }, new_lock: STRANGER } });
check('a stranger founds a place named for an organisation, with any claim in its front line', r.status === 200 && r.body.born === true, r);
r = await call('GET', { world: 'orchard' });
check('the place is its own surface', (r.body.blocks || []).includes('lighthouse') && r.body.origin === `${APEX}/w/orchard`, r.body);

console.log('2. A read shows nothing of a latch; a write can learn that one stands, never whose');
const lockMap = await redis.get(`${ns('orchard')}locks:lighthouse`);
check('the latch is a record in the store', !!(lockMap && lockMap._), lockMap);
const indexText = JSON.stringify(r.body);
check('the index names blocks and their stamps, and no latch', !Object.keys(r.body).some((k) => /^(lock|latch)/i.test(k)) && !indexText.includes(lockMap._), Object.keys(r.body));
r = await call('GET', { world: 'orchard', block: 'lighthouse' });
check('a block read returns the block and nothing about its latch', Object.keys(r.body).every((k) => k === '_' || /^[1-9]$/.test(k)) && !JSON.stringify(r.body).includes(lockMap._), r.body);
r = await call('POST', { world: 'orchard', block: 'lighthouse', body: { new_lock: null } });
check('asking to lift a latch with no key is refused where one stands (403)', r.status === 403, r);
await call('POST', { world: 'orchard', block: 'pool:orchard', body: { content: { _: 'An open room.' } } });
r = await call('POST', { world: 'orchard', block: 'pool:orchard', body: { new_lock: null } });
check('and answers ok where none does, changing nothing: that a latch stands can be learnt, whose cannot', r.status === 200, r);

console.log('3. The honest place is made, and used: use is read from its own index, and nothing is kept for it');
await call('POST', { world: 'riverside', block: 'lighthouse', body: { content: { _: 'A place made for Riverside Recovery to use. It does not speak for Riverside Recovery.' }, new_lock: MAKER } });
await call('POST', { world: 'riverside', block: 'spine:constitution', body: { content: { _: 'The constitution, a clause at each address.', 1: 'Clause one.' }, new_lock: MAKER } });
await call('POST', { world: 'riverside', block: 'pool:riverside', body: { content: { _: 'The room.' } } });
await call('POST', { world: 'riverside', block: 'pool:riverside', body: { append: true, content: { _: 'Hello.', 1: 'a visitor', 2: '' } } });
for (const [name, words] of [['Sam', SAM], ['Jo', JO]]) {
  await call('POST', { world: 'riverside', block: 'passport:' + name, body: { content: { _: name }, new_lock: words } });
  await call('POST', { world: 'riverside', block: 'constitution:' + name, body: { content: { _: name + '\'s own notebook.' }, new_lock: words } });
}
await pause(5);
r = await call('POST', { world: 'riverside', block: 'constitution:Sam', spindle: '1', body: { content: 'Yes. This reads right to me.', secret: SAM } });
check('Sam writes an answer in their own notebook', r.status === 200, r);
r = await call('POST', { world: 'riverside', block: 'constitution:Jo', body: { secret: JO, new_lock: JO } });
check('Jo only proves their words again, writing nothing', r.status === 200, r);
r = await call('GET', { world: 'riverside' });
const idx = r.body, people = (idx.blocks || []).filter((b) => b.startsWith('passport:')).map((b) => b.slice(9));
const wrote = people.filter((p) => (idx.touched || {})['constitution:' + p] > (idx.born || {})['constitution:' + p]);
check('who has a card is the index\'s own list', people.length === 2 && people.includes('Sam') && people.includes('Jo'), idx.blocks);
check('who has written is a notebook touched after it was born: Sam, not Jo', wrote.length === 1 && wrote[0] === 'Sam', { born: idx.born, touched: idx.touched });
const latest = Object.entries(idx.touched || {}).filter(([k]) => /^constitution:/.test(k)).map(([, v]) => v).sort().pop();
check('and how lately is the newest touch among the notebooks', latest === idx.touched['constitution:Sam'], latest);

console.log('4. That the keys have changed hands can be checked at the door, without learning the new words');
r = await call('POST', { world: 'riverside', block: 'lighthouse', body: { secret: MAKER, new_lock: MAKER } });
check('as made, the maker\'s words open the front line', r.status === 200, r);
r = await call('POST', { world: 'riverside', block: 'lighthouse', body: { secret: MAKER, new_lock: THEIRS } });
check('the organisation\'s own people change the words as they take them', r.status === 200, r);
r = await call('POST', { world: 'riverside', block: 'lighthouse', body: { secret: MAKER, new_lock: MAKER } });
check('and the maker\'s words are then refused (403)', r.status === 403, r);
r = await call('POST', { world: 'riverside', block: 'lighthouse', spindle: '0', body: { content: 'Riverside Recovery\'s own place, kept by the people who lead it.', secret: THEIRS } });
check('their own words re-voice the front line', r.status === 200, r);

console.log('5. Two homes for the mark that fail');
r = await call('POST', { block: 'confirmed:orchard', body: { content: { _: 'Confirmed: Orchard Recovery\'s own place.' }, new_lock: STRANGER } });
check('a block of its own per place, at the apex: a stranger founds confirmed:orchard first', r.status === 200, r);
r = await call('POST', { block: 'confirmed:orchard', spindle: '1', body: { content: 'the owner\'s line', secret: OWNER } });
check('and the beach\'s owner is then refused there (403)', r.status === 403, r);
r = await call('POST', { world: 'harbour', block: 'lighthouse', body: { content: { _: 'A place made for Harbour Recovery to use.', 1: 'spine:constitution — the constitution' }, new_lock: MAKER } });
check('a line inside the place\'s own lighthouse: the maker founds it latched', r.status === 200, r);
r = await call('POST', { world: 'harbour', block: 'lighthouse', spindle: '8', body: { secret: MAKER, new_lock: OWNER } });
check('position 8 is handed to the owner\'s key', r.status === 200, r);
r = await call('POST', { world: 'harbour', block: 'lighthouse', spindle: '8', body: { content: 'Confirmed by the owner of this beach, 1 October.', secret: OWNER } });
check('the owner writes the countersigning line there', r.status === 200, r);
r = await call('POST', { world: 'harbour', block: 'lighthouse', spindle: '8', body: { content: 'forged', secret: MAKER } });
check('the place\'s own key cannot write that position (403)', r.status === 403, r);
r = await call('POST', { world: 'harbour', block: 'lighthouse', body: { confirm: true, secret: MAKER, content: { _: 'A place made for Harbour Recovery to use.', 8: 'Confirmed by the owner of this beach, 1 October, and again every day since.' } } });
check('but it can replace the whole block, that position included', r.status === 200, r);
r = await call('GET', { world: 'harbour', block: 'lighthouse', spindle: '8' });
check('and the forged line reads where the owner\'s stood', JSON.stringify(r.body).includes('again every day since'), r.body);

console.log('6. One block at the apex under the owner\'s key, named by his lighthouse: only that key writes it');
r = await call('POST', { block: 'confirmed', body: { content: { _: 'The places on this beach that were made for an organisation, and that its own people have told the owner of this beach are theirs.' }, new_lock: OWNER } });
check('the owner founds confirmed, latched at its root', r.status === 200, r);
r = await call('POST', { block: 'lighthouse', body: { content: { _: 'The compass of this beach.', 7: { _: 'The owner\'s own threads.', 5: 'confirmed — the places on this beach made for an organisation whose own people have told him they are theirs.' } }, new_lock: OWNER } });
check('and his lighthouse names it', r.status === 200, r);
r = await call('POST', { block: 'lighthouse', spindle: '7.5', body: { content: 'confirmed — anything at all', secret: STRANGER } });
check('in a line nobody else can write (403)', r.status === 403, r);
const where = `${APEX}/w/riverside`;
const line = { _: `Confirmed 1 October: the place at ${where} is Riverside Recovery's own. Checked in person with the coordinator and one of the people who lead it.`, 1: 'the-owner', 2: where };
r = await call('POST', { block: 'confirmed', body: { append: true, content: line } });
check('an append with no key is refused (403)', r.status === 403, r);
r = await call('POST', { block: 'confirmed', body: { append: true, content: line, secret: STRANGER } });
check('an append under a stranger\'s key is refused (403)', r.status === 403, r);
r = await call('POST', { block: 'confirmed', body: { append: true, content: line, secret: THEIRS } });
check('an append under the place\'s own key is refused (403)', r.status === 403, r);
check('before the owner\'s line, a reader draws nothing for the honest place', (await reader(`https://${APEX}/w/riverside`)) === null);
await pause(5);
r = await call('POST', { block: 'confirmed', body: { append: true, content: line, secret: OWNER } });
check('the owner\'s append lands, and the beach gives it its slot', r.status === 200 && String(r.body.slot) === '1', r);
r = await call('GET', { block: 'confirmed', spindle: '1' });
check('the line reads back with who, where and when at 1, 2 and 3', r.body && r.body['1'] === 'the-owner' && r.body['2'] === where && /^\d{4}-\d\d-\d\dT/.test(r.body['3'] || ''), r.body);
r = await call('GET', { block: 'confirmed', pscale: 0 });
check('a plain read of the block\'s lines carries the place\'s address, because the sentence says it', JSON.stringify(r.body).includes(where), r.body);
r = await call('POST', { block: 'confirmed', spindle: '1', body: { content: 'rewritten', secret: STRANGER } });
check('nobody else can rewrite a line (403)', r.status === 403, r);
r = await call('POST', { block: 'confirmed', body: { confirm: true, content: { _: 'replaced' }, secret: STRANGER } });
check('or replace the block (403)', r.status === 403, r);
r = await call('DELETE', { block: 'confirmed', body: { block: 'confirmed', confirm: true, secret: STRANGER } });
check('or wipe it (403)', r.status === 403, r);
r = await call('POST', { block: 'confirmed', body: { secret: STRANGER, new_lock: STRANGER } });
check('or take its latch (403)', r.status === 403, r);
let mark = await reader(`https://${APEX}/w/riverside`);
check('now a reader draws the mark for the honest place', !!mark && mark['2'] === where, mark);
check('and nothing for the stranger\'s, whatever its own front line says', (await reader(`https://${APEX}/w/orchard`)) === null);

console.log('7. The newest line for a place is the last in the block\'s own order, and an address is compared, not matched letter for letter');
for (let i = 1; i <= 9; i++) {
  r = await call('POST', { block: 'confirmed', body: { append: true, secret: OWNER, content: { _: `Confirmed ${i + 1} October: the place at ${APEX}/w/other-${i}.`, 1: 'the-owner', 2: `${APEX}/w/other-${i}` } } });
}
check('the tenth line lands, the block having grown a level', r.status === 200, r);
r = await call('POST', { block: 'confirmed', body: { append: true, secret: OWNER, content: { _: `Moved 20 October: the place at ${APEX}/w/other-3 now stands on a beach its own people run.`, 1: 'the-owner', 2: `${APEX}/w/other-3` } } });
check('a later line for a place already listed', r.status === 200, r);
r = await call('POST', { block: 'confirmed', body: { append: true, secret: OWNER, content: { _: `Withdrawn 21 October: the place at ${APEX}/w/other-4.`, 1: 'the-owner', 2: `${APEX}/w/other-4`, 3: '2020-01-01T00:00:00Z' } } });
check('a later line that carries an older date of its writer\'s own', r.status === 200, r);
r = await call('POST', { block: 'confirmed', body: { append: true, secret: OWNER, content: { _: `Withdrawn 22 October: the place at ${APEX}/w/other-5.`, 1: 'the-owner', 2: `HTTPS://Beach.Test/w/other-5/` } } });
check('and a later line whose address was typed with a scheme, capitals and a trailing slash', r.status === 200, r);
const book = (await call('GET', { block: 'confirmed' })).body;
check('all thirteen lines are found through the wrap', entries(book).length === 13, entries(book).length);
check('riverside reads Confirmed', firstWord(newest(book, where)) === 'Confirmed', firstWord(newest(book, where)));
check('the place with a later line reads by its newest: Moved', firstWord(newest(book, `${APEX}/w/other-3`)) === 'Moved');
check('the older date does not make an earlier line the newest: Withdrawn', firstWord(newest(book, `${APEX}/w/other-4`)) === 'Withdrawn');
check('the mistyped address still replaces the line before it: Withdrawn', firstWord(newest(book, `${APEX}/w/other-5`)) === 'Withdrawn');
check('a place with no line reads nothing', newest(book, `${APEX}/w/orchard`) === null);
r = await call('GET', { block: 'confirmed', spindle: '1' });
check('the first line still reads at the address it was given', r.body && r.body['2'] === where, r.body);

console.log('8. A place answers at any host the beach serves, and says itself where it truly stands');
r = await call('GET', { host: SUB, world: 'riverside' });
check('asked through another host, it is the same place and gives the same origin', r.body.origin === where && (r.body.blocks || []).includes('lighthouse'), r.body);
r = await call('GET', { host: SUB, block: 'lighthouse' });
check('that other host is a surface of its own, with no lighthouse', r.status === 404, r);
await call('POST', { host: SUB, block: 'lighthouse', body: { content: { _: 'A compass.', 1: 'confirmed — the places confirmed here.' }, new_lock: STRANGER } });
await call('POST', { host: SUB, block: 'confirmed', body: { content: { _: 'The places confirmed here.' }, new_lock: STRANGER } });
r = await call('POST', { host: SUB, block: 'confirmed', body: { append: true, secret: STRANGER, content: { _: `Confirmed 1 October: the place at ${SUB}/w/orchard is Orchard Recovery's own.`, 1: 'the-owner', 2: `${SUB}/w/orchard` } } });
check('so a stranger founds a lighthouse and a confirmed there, and writes a line like an owner\'s', r.status === 200, r);
mark = await reader(`https://${SUB}/w/orchard`, { naive: true });
check('a reader that trusts the address it was handed draws the mark for the stranger\'s place', !!mark, mark);
check('a reader that asks the place where it stands reads the true beach, and draws nothing', (await reader(`https://${SUB}/w/orchard`)) === null);
mark = await reader(`https://${SUB}/w/riverside`);
check('and still draws the honest place\'s mark, by whichever host it was reached', !!mark && mark['2'] === where, mark);

console.log('9. Removal: the owner\'s line first, then the whole place leaves the store, and nothing else does');
await call('POST', { world: 'riverside', block: 'scratch', body: { content: { _: 'an open block' } } });
r = await call('DELETE', { world: 'riverside', block: 'scratch', body: { block: 'scratch', confirm: true } });
check('an open block wiped through the door', r.status === 200, r);
let kept = await redis.keys(`${ns('riverside')}last:*`);
check('leaves a copy the door keeps for thirty days, so the door is not the whole removal', kept.length === 1, kept);
r = await call('DELETE', { world: 'riverside', block: 'spine:constitution', body: { block: 'spine:constitution', confirm: true, secret: OWNER } });
check('the owner\'s key does not open a latched block at the door (403): his hand is the store', r.status === 403, r);
r = await call('POST', { block: 'confirmed', body: { append: true, secret: OWNER, content: { _: `Removed 3 November: the place at ${where}, at the instruction of its own people. Nothing of it stands on this beach.`, 1: 'the-owner', 2: where } } });
check('first, the owner\'s next line for that place', r.status === 200, r);
check('from that moment a reader draws no mark, while the place still stands', (await reader(`https://${APEX}/w/riverside`)) === null);
r = await call('GET', { tables: true });
check('before: the beach lists the place among its tables', (r.body.tables || []).some((t) => t.name === 'riverside'), r.body.tables);
const all = await redis.keys(`${ns('riverside')}*`);
const kinds = {};
for (const k of all) { const kind = k.slice(ns('riverside').length).split(':')[0]; kinds[kind] = (kinds[kind] || 0) + 1; }
console.log('     what stands under the place\'s name in the store →', kinds);
check('blocks, latches, both stamps and the kept copy all stand under the place\'s own name', kinds.block >= 7 && kinds.locks >= 6 && kinds.touched === 1 && kinds.born === 1 && kinds.last === 1, kinds);
const removed = await redis.del(all);
check('every one of them is removed', removed === all.length && (await redis.keys(`${ns('riverside')}*`)).length === 0, removed);
r = await call('GET', { world: 'riverside' });
check('after: the address answers like any name nobody has used', Array.isArray(r.body.blocks) && r.body.blocks.length === 0 && !r.body.touched && !r.body.born, r.body);
r = await call('GET', { world: 'riverside', block: 'lighthouse' });
check('its front line is gone (404)', r.status === 404, r);
r = await call('GET', { tables: true });
check('and the beach no longer lists it', !(r.body.tables || []).some((t) => t.name === 'riverside'), r.body.tables);
r = await call('GET', { world: 'harbour', block: 'lighthouse' });
check('another place is untouched', r.status === 200, r);
// the record: set-aside's own door, pointed at a place, writes its log INSIDE the place
const placeDoor = makeDoor(handler, surface(`${APEX}/w/harbour`, APEX));
await placeDoor('POST', 'beach-log', { content: { _: 'What has been done here.' } });
await placeDoor('POST', 'beach-log', { append: true, content: { _: 'a line about a removal', 1: 'the-owner' } });
check('a log written through a door pointed at a place lands inside that place', (await redis.get(`${ns('harbour')}block:beach-log`)) != null && (await redis.get(`pscale-beach-v2:${APEX}:block:beach-log`)) == null);
const apexDoor = makeDoor(handler, surface(APEX, APEX));
await apexDoor('POST', 'beach-log', { content: { _: 'What has been done to this beach, and when.' } });
r = await apexDoor('POST', 'beach-log', { append: true, content: { _: '3 November: the place at /w/riverside removed at the instruction of the organisation it was made for.', 1: 'the-owner' } });
check('so the removal\'s line goes through a door at the beach itself, where it outlasts the place', r.status === 200 && (await redis.get(`pscale-beach-v2:${APEX}:block:beach-log`)) != null, r);

console.log('10. After removal the address is free; what keeps a new place there from the mark');
r = await call('POST', { world: 'riverside', block: 'lighthouse', body: { content: { _: 'Riverside Recovery, back again.' }, new_lock: STRANGER } });
check('any hand can make a place at that address again', r.status === 200 && r.body.born === true, r);
check('and the owner\'s Removed line keeps the mark from it', (await reader(`https://${APEX}/w/riverside`)) === null);
// a second guard, for a place re-made under a Confirmed line nobody has yet withdrawn
await call('POST', { world: 'meadow', block: 'lighthouse', body: { content: { _: 'A place made for Meadow Recovery to use.' }, new_lock: MAKER } });
await pause(5);
await call('POST', { block: 'confirmed', body: { append: true, secret: OWNER, content: { _: `Confirmed 5 November: the place at ${APEX}/w/meadow is Meadow Recovery's own.`, 1: 'the-owner', 2: `${APEX}/w/meadow` } } });
check('a confirmed place draws its mark', !!(await reader(`https://${APEX}/w/meadow`)));
await pause(5);
await redis.del(await redis.keys(`${ns('meadow')}*`));
r = await call('POST', { world: 'meadow', block: 'lighthouse', body: { content: { _: 'Meadow Recovery\'s own place.' }, new_lock: STRANGER } });
check('its blocks gone and the line not yet withdrawn, a stranger makes a new place there', r.status === 200 && r.body.born === true, r);
const stale = newest((await call('GET', { block: 'confirmed' })).body, `${APEX}/w/meadow`);
check('the line for that address still reads Confirmed', firstWord(stale) === 'Confirmed', stale);
check('but the new front line was born after the owner\'s line was written, so a reader draws nothing', (await reader(`https://${APEX}/w/meadow`)) === null);

console.log('11. A line the owner leaves where a place stood holds only itself');
await redis.del(await redis.keys(`${ns('harbour')}*`));
r = await call('POST', { world: 'harbour', block: 'lighthouse', body: { content: { _: 'A place stood here and was removed on 3 November at the instruction of the organisation it was made for.' }, new_lock: OWNER } });
check('the owner may leave one line under his own key where a place stood', r.status === 200, r);
r = await call('POST', { world: 'harbour', block: 'lighthouse', body: { confirm: true, content: { _: 'Harbour Recovery, back again.' }, secret: STRANGER } });
check('which a stranger cannot replace (403)', r.status === 403, r);
r = await call('POST', { world: 'harbour', block: 'spine:constitution', body: { content: { _: 'A constitution nobody asked for.' }, new_lock: STRANGER } });
check('though a stranger can still make any other block beside it', r.status === 200, r);

fs.rmSync(dir, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
