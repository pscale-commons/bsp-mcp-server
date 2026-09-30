// offline-checks.mjs — what the Community Recovery proposal leans on, run against the beach's REAL
// handler in-process, on a scratch folder. Nothing live is touched: the store is a directory of
// JSON files, the origin is beach.test, and no network call is made.
//
//   BEACH_DIR=/path/to/pscale-beach node offline-checks.mjs
//
// BEACH_DIR is a checkout of github.com/pscale-commons/pscale-beach at main (or an operator's
// clone of it), with its node_modules installed. The names and comments below are invented.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recovery-checks-'));
process.env.KV_REST_API_URL = 'https://local.invalid';
process.env.KV_REST_API_TOKEN = 'local';
process.env.BEACH_ORIGIN = 'beach.test';
const BEACH_DIR = process.env.BEACH_DIR;
if (!BEACH_DIR) { console.error('set BEACH_DIR to a checkout of pscale-commons/pscale-beach'); process.exit(2); }
const { FileRedis } = await import(path.join(BEACH_DIR, 'scripts/file-redis.mjs'));
const { default: handler, __setRedis } = await import(path.join(BEACH_DIR, 'api/pscale-beach.js'));
__setRedis(new FileRedis(dir));

const WORLD = 'community-recovery';
async function call(method, { world = WORLD, block, spindle, pscale, body } = {}) {
  const q = {};
  if (world) q.world = world;
  if (block) q.block = block;
  if (spindle != null) q.spindle = spindle;
  if (pscale != null) q.pscale = String(pscale);
  const base = (world ? `/w/${world}` : '') + '/.well-known/pscale-beach';
  const b = Object.assign({}, body || {});
  if (method !== 'GET' && spindle != null) { b.spindle = spindle; delete q.spindle; }
  const req = { method, query: q, body: b, headers: { host: 'beach.test' }, url: base };
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

const KEEPER = 'keeper-words-one', SAM = 'river candle seven', JO = 'green kettle north', STRANGER = 'not-the-words';

console.log('1. The constitution as a spine, founded locked at a table of its own');
const spine = {
  _: 'SPINE — constitution. A stand-in frame for these checks: a few parts, sections and clauses with placeholder words.',
  1: { _: 'Why we exist.',
       1: { _: '1. Name, Purpose and Vision.', 1: '1.1 Name. (the words of clause 1.1)', 2: '1.2 Purpose. (the words of clause 1.2)' },
       2: { _: '2. Recovery Framework, Values and Principles.', 1: { _: 'The framework.', 1: '2.1 (the words of clause 2.1)' }, 2: { _: 'The principles.', 1: '2.7 (the words of clause 2.7)' } } },
  2: { _: 'Who belongs, and how we take part.', 1: { _: '3. Membership, Participation and Volunteering.', 1: '3.1 (the words of clause 3.1)', 2: '3.2 (the words of clause 3.2)' } },
};
let r = await call('POST', { block: 'spine:constitution', body: { content: spine, new_lock: KEEPER } });
check('spine founded locked', r.status === 200 && r.body.ok !== false, r);
r = await call('POST', { block: 'spine:constitution', spindle: '1.12', body: { content: 'vandalised' } });
check('a stranger cannot change a clause (403)', r.status === 403, r);
r = await call('GET', { block: 'spine:constitution', spindle: '1.12' });
check('a clause reads at its address', typeof r.body === 'string' ? r.body.startsWith('1.2 Purpose') : JSON.stringify(r.body).includes('1.2 Purpose'), r);

console.log('2. The table is its own surface');
r = await call('GET', {});
const tableIndex = r.body;
check('table index lists the spine', (tableIndex.blocks || []).includes('spine:constitution'), tableIndex);
r = await call('GET', { world: null });
check('apex index does not', !(r.body.blocks || []).includes('spine:constitution'), r.body.blocks);

console.log('3. One name, one set of words: the passport binds every block named for the handle');
r = await call('POST', { block: 'passport:Sam', body: { content: { _: 'Sam. Two years in, here to give back.' }, new_lock: SAM } });
check('Sam founds a passport under their own words', r.status === 200, r);
r = await call('POST', { block: 'constitution:Sam', body: { content: { _: 'MIRROR — not Sam' }, new_lock: STRANGER } });
check('a stranger cannot found Sam\'s mirror (handle_bound)', r.status === 403 && r.body.code === 'handle_bound', r);
r = await call('POST', { block: 'constitution:Sam', body: { content: { _: 'MIRROR — Sam\'s reading of the constitution, clause by clause.' }, new_lock: SAM } });
check('Sam founds the mirror with the same words', r.status === 200, r);
r = await call('POST', { block: 'constitution:Sam', spindle: '1.12', body: { content: 'I\'d add that it is free to take part.', secret: SAM } });
check('Sam comments at clause 1.2 (address 1.12), path made as needed', r.status === 200, r);
r = await call('POST', { block: 'constitution:Sam', spindle: '1.12', body: { content: 'overwritten by a stranger' } });
check('nobody else can write in Sam\'s mirror (403)', r.status === 403, r);
r = await call('POST', { block: 'constitution:Sam', spindle: '1.12', body: { content: 'overwritten with a wrong key', secret: STRANGER } });
check('a wrong key is refused (403)', r.status === 403, r);

console.log('4. A second member, and the fold as a plain read');
await call('POST', { block: 'passport:Jo', body: { content: { _: 'Jo. New here.' }, new_lock: JO } });
await call('POST', { block: 'constitution:Jo', body: { content: { _: 'MIRROR — Jo\'s reading.' }, new_lock: JO } });
r = await call('POST', { block: 'constitution:Jo', spindle: '1.12', body: { content: 'Reads well to me. "New life" is the right phrase.', secret: JO } });
check('Jo comments at the same clause', r.status === 200, r);
r = await call('GET', {});
const names = (r.body.blocks || []);
const mirrors = names.filter(n => n.startsWith('constitution:'));
const voices = [];
for (const m of mirrors) {
  const v = await call('GET', { block: m, spindle: '1.12' });
  const text = typeof v.body === 'string' ? v.body : (v.body && v.body._) || (v.body && v.body.content) || JSON.stringify(v.body);
  voices.push(m.slice('constitution:'.length) + ': ' + text);
}
console.log('     the voices at clause 1.2 →', voices);
check('both voices are read side by side at the clause', voices.length === 2 && voices.some(v => v.includes('free to take part')) && voices.some(v => v.includes('Reads well')), voices);
const roster = names.filter(n => n.startsWith('passport:')).map(n => n.slice(9));
console.log('     who has arrived →', roster, '· born:', r.body.born ? Object.fromEntries(Object.entries(r.body.born).filter(([k]) => k.startsWith('passport:'))) : '(no born map)');
check('the arrival list is the table\'s own index', roster.length === 2 && roster.includes('Sam') && roster.includes('Jo'), names);

console.log('5. An open room beside it, for a visitor with no words at all');
r = await call('POST', { block: 'pool:constitution', body: { content: { _: 'The room for talk about the constitution.' } } });
r = await call('POST', { block: 'pool:constitution', body: { append: true, content: { _: 'What does quorum mean?', 1: 'Pat, a visitor', 2: '1.12', 3: new Date().toISOString() } } });
check('a keyless visitor comment lands in the room, tagged to the clause', r.status === 200, r);

console.log('6. A private line: sealed in the page, stored as an envelope the beach cannot read');
const envelope = { _: 'Encrypted (gray); readable only with the author secret.', 1: 'Y2lwaGVydGV4dA==', 2: 'bm9uY2U=', 9: { _: 'gray', 1: 'self' } };
r = await call('POST', { block: 'constitution:Sam', spindle: '2.11', body: { content: envelope, secret: SAM } });
check('a sealed envelope is accepted at a clause address', r.status === 200, r);

console.log('7. Removing your own words');
r = await call('DELETE', { block: 'constitution:Sam', body: { block: 'constitution:Sam', confirm: true } });
check('nobody else can remove Sam\'s mirror (403)', r.status === 403, r);
r = await call('DELETE', { block: 'constitution:Sam', body: { block: 'constitution:Sam', confirm: true, secret: SAM } });
check('Sam removes their own mirror', r.status === 200, r);
r = await call('GET', { block: 'constitution:Sam' });
check('it is gone (404)', r.status === 404, r);
r = await call('GET', {});
check('and gone from the index', !(r.body.blocks || []).includes('constitution:Sam'), r.body.blocks);

console.log('8. Losing the words: what the beach itself allows');
r = await call('POST', { block: 'passport:Sam', body: { content: { _: 'taken over' }, new_lock: STRANGER, confirm: true } });
check('a new key cannot be set over a standing one without the old (403)', r.status === 403, r);
const files = fs.readdirSync(dir);
check('the latch is kept apart from the words it guards', files.some(f => f.includes('locks') && f.includes('passport') && f.includes('Sam')), files);


console.log('9. Lost words, helped back in: the keeper of the store clears the latch, the person sets new words themselves');
const lockFile = fs.readdirSync(dir).find(f => f.includes('locks') && f.includes('passport') && f.includes('Jo'));
check('Jo\'s latch is one entry in the store, separate from Jo\'s words', !!lockFile, fs.readdirSync(dir));
fs.unlinkSync(path.join(dir, lockFile));                      // the operator's act: clear the latch, touch no content
const JO2 = 'amber window lake';
r = await call('POST', { block: 'passport:Jo', body: { new_lock: JO2 } });
check('Jo sets new words (no content changed)', r.status === 200, r);
r = await call('GET', { block: 'passport:Jo' });
check('Jo\'s line is untouched', JSON.stringify(r.body).includes('New here'), r);
r = await call('POST', { block: 'passport:Jo', spindle: '1', body: { content: 'old words', secret: JO } });
check('the old words no longer open it (403)', r.status === 403, r);
r = await call('POST', { block: 'passport:Jo', spindle: '1', body: { content: 'Still here, new words.', secret: JO2 } });
check('the new words do', r.status === 200, r);
const mirrorLock = fs.readdirSync(dir).find(f => f.includes('locks') && f.includes('constitution') && f.includes('Jo'));
fs.unlinkSync(path.join(dir, mirrorLock));                    // and the same for each block named for Jo
r = await call('POST', { block: 'constitution:Jo', body: { new_lock: STRANGER } });
check('a cleared mirror still cannot be claimed by a stranger (handle_bound)', r.status === 403 && r.body.code === 'handle_bound', r);
r = await call('POST', { block: 'constitution:Jo', body: { new_lock: JO2 } });
check('Jo re-latches the mirror under the new words', r.status === 200, r);
r = await call('GET', { block: 'constitution:Jo', spindle: '1.12' });
check('Jo\'s comment survived the reset', JSON.stringify(r.body).includes('Reads well'), r);

console.log('10. Two kinds of synthesis: a person\'s own, and the one kept for everyone');
r = await call('POST', { block: 'tree:constitution:Jo', body: { content: { _: 'Jo\'s own syntheses, clause by clause.' }, new_lock: STRANGER } });
check('a personal synthesis block is bound to its person (handle_bound)', r.status === 403 && r.body.code === 'handle_bound', r);
r = await call('POST', { block: 'tree:constitution:Jo', body: { content: { _: 'Jo\'s own syntheses, clause by clause.' }, new_lock: JO2 } });
check('Jo keeps their own synthesis', r.status === 200, r);
r = await call('POST', { block: 'constitution', body: { content: { _: 'FOLD — what members are saying, clause by clause; dated minutes.' }, new_lock: KEEPER } });
check('the shared synthesis is founded at the bare name under the keepers\' key', r.status === 200, r);
r = await call('POST', { block: 'constitution', spindle: '1.12', body: { content: '2026-09-30 — two voices: one asks that free participation be stated; one affirms "new life".', secret: KEEPER } });
check('a dated minute is kept at the clause address', r.status === 200, r);
r = await call('POST', { block: 'constitution', spindle: '1.12', body: { content: 'noise' } });
check('noise cannot overwrite the shared synthesis (403)', r.status === 403, r);

fs.rmSync(dir, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
