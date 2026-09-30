// offline-checks.mjs — the beach's list of tables (?tables), run against the beach's REAL handler
// in-process, on a scratch folder. Nothing live is touched: the store is a directory of JSON
// files, the origin is beach.test, and no network call is made. Every name below is invented.
//
//   BEACH_DIR=/path/to/pscale-beach node offline-checks.mjs
//
// BEACH_DIR is a checkout of github.com/pscale-commons/pscale-beach at main (or an operator's
// clone of it), with its node_modules installed. The handler is run four ways over ONE store:
//
//   as deployed   the handler exactly as BEACH_DIR holds it
//   words         the recommendation: one string of the answer changed, the derivation untouched
//   declared      the alternative: a world is listed only when a room of it declares the play loop
//   names         the alternative's no-read shadow: a declaration's NAME beside a room, never read
//
// The three changed handlers are copies in the scratch folder, each made by one exact replacement
// that must match once. BEACH_DIR itself is never written to.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BEACH_DIR = process.env.BEACH_DIR;
if (!BEACH_DIR) { console.error('set BEACH_DIR to a checkout of pscale-commons/pscale-beach'); process.exit(2); }
process.env.KV_REST_API_URL = 'https://local.invalid';
process.env.KV_REST_API_TOKEN = 'local';
process.env.BEACH_ORIGIN = 'beach.test';
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'list-of-places-'));
const store = path.join(scratch, 'store');

// ── the three changes, as text ──

const WORDS_FROM = "_: `Tables played at ${origin} — every /w/<name> world with a room written, newest first: its name, the room (pool:<address>) its latest voice landed in, and when (touched). Derived from each table's own touched map as this was served; nothing is kept for it. A table is its own surface at ${origin}/w/<name>/.well-known/pscale-beach, and its index says who stands there.`,";
const WORDS_TO = "_: `Places at ${origin} with a room written — every /w/<name> place where a pool: block has been written, newest room write first: its name, the room (pool:<name>) its latest voice landed in, and when (touched). Derived from each place's own touched map as this was served; nothing is kept for it. It says where rooms are and nothing of what runs in them: a game's table, a community's own place and a trial all have rooms, and which one a place is, the place says itself — its lighthouse, and each room's declaration (convention:<room>). Each is its own surface at ${origin}/w/<name>/.well-known/pscale-beach, and its index says who stands there. The key is still 'tables', from when every place with a room was one.`,";

const DECLARED_FN = `async function listPlayedTables() {
  const prefix = \`\${keyNs(BASE_ORIGIN)}/w/\`;
  const worlds = (await redis.keys(\`\${prefix}*:touched\`))
    .map(k => k.slice(prefix.length, -':touched'.length))
    .filter(w => WORLD_RE.test(w));
  if (worlds.length === 0) return [];
  let maps;
  if (typeof redis.pipeline === 'function') {
    const p = redis.pipeline();
    for (const w of worlds) p.hgetall(touchedKey(\`\${BASE_ORIGIN}/w/\${w}\`));
    maps = await p.exec();
  } else {
    maps = await Promise.all(worlds.map(w => redis.hgetall(touchedKey(\`\${BASE_ORIGIN}/w/\${w}\`))));
  }
  // The names are in the touched map already; what each declaration SAYS is one MGET.
  const rows = [], asked = [];
  worlds.forEach((name, i) => {
    const m = maps[i];
    if (!m || typeof m !== 'object') return;
    let room = null, touched = '';
    const declared = [];
    for (const [block, iso] of Object.entries(m)) {
      if (block.startsWith('pool:')) { if (String(iso) > touched) { room = block; touched = String(iso); } }
      else if (block.startsWith('convention:')) declared.push(blockKey(\`\${BASE_ORIGIN}/w/\${name}\`, block));
    }
    if (room && declared.length) { rows.push({ name, room, touched, from: asked.length, n: declared.length }); asked.push(...declared); }
  });
  if (rows.length === 0) return [];
  const said = await redis.mget(asked);
  // A declaration names its convention in its first word — the mirror's own reading of it.
  const playLoop = (b) => { let v = b; while (v && typeof v === 'object') v = v._; return typeof v === 'string' && v.trim().split(/[\\s—–:,.]+/)[0].toLowerCase() === 'grit'; };
  return rows
    .filter(r => said.slice(r.from, r.from + r.n).some(playLoop))
    .map(({ name, room, touched }) => ({ name, room, touched }))
    .sort((a, b) => b.touched.localeCompare(a.touched));
}
`;
const SHIM_FROM = '  async set(key, val, opts) {';
const SHIM_TO = '  async mget(...args) {\n    const out = [];\n    for (const key of args.flat()) out.push(await this.get(key));\n    return out;\n  }\n\n  async set(key, val, opts) {';

const NAMES_FROM = '    if (room) tables.push({ name, room, touched });';
const NAMES_TO = "    if (room && Object.keys(m).some(b => b.startsWith('convention:'))) tables.push({ name, room, touched });";

function replaceOnce(file, from, to) {
  const s = fs.readFileSync(file, 'utf8');
  const n = s.split(from).length - 1;
  if (n !== 1) { console.error(`the handler at BEACH_DIR is not the one these checks were written against: expected one match in ${path.basename(file)}, found ${n}, for:\n  ${from.slice(0, 110)}…`); process.exit(2); }
  fs.writeFileSync(file, s.replace(from, to));
}
function wholeFn(file) {
  const s = fs.readFileSync(file, 'utf8');
  const a = s.indexOf('async function listPlayedTables()');
  return s.slice(a, s.indexOf('\n}\n', a) + 3);
}
function tree(name, edit) {
  const dst = path.join(scratch, name);
  fs.mkdirSync(dst, { recursive: true });
  for (const d of ['api', 'lib', 'scripts']) fs.cpSync(path.join(BEACH_DIR, d), path.join(dst, d), { recursive: true });
  fs.copyFileSync(path.join(BEACH_DIR, 'package.json'), path.join(dst, 'package.json'));
  fs.symlinkSync(fs.realpathSync(path.join(BEACH_DIR, 'node_modules')), path.join(dst, 'node_modules'));
  edit(path.join(dst, 'api/pscale-beach.js'), dst);
  return dst;
}

// ── a handler, loaded from a tree, over the one store — counting what it asks of the store ──
// Counted as Upstash bills and as the network feels it: every command is one command (a
// pipelined one included, MGET one however many keys), every awaited call or pipeline exec
// one round trip.
async function load(dir) {
  const { FileRedis } = await import(path.join(dir, 'scripts/file-redis.mjs'));
  const { default: handler, __setRedis } = await import(path.join(dir, 'api/pscale-beach.js'));
  const asked = { commands: {}, roundTrips: 0 };
  const bump = (op) => { asked.commands[op] = (asked.commands[op] || 0) + 1; };
  class Counting extends FileRedis {
    async _inner(fn) { this._quiet = true; try { return await fn(); } finally { this._quiet = false; } }
    async keys(p) { bump('KEYS'); asked.roundTrips += 1; return super.keys(p); }
    async hgetall(k) { if (this._quiet) return super.hgetall(k); bump('HGETALL'); asked.roundTrips += 1; return this._inner(() => super.hgetall(k)); }
    async get(k) { if (this._quiet) return super.get(k); bump('GET'); asked.roundTrips += 1; return super.get(k); }
    async mget(...a) { bump('MGET'); asked.roundTrips += 1; return this._inner(() => super.mget(...a)); }
    pipeline() {
      const self = this, cmds = [];
      return {
        strlen(k) { cmds.push(['STRLEN', k]); return this; },
        hgetall(k) { cmds.push(['HGETALL', k]); return this; },
        async exec() {
          asked.roundTrips += 1;
          const out = [];
          for (const [op, k] of cmds) { bump(op); out.push(await self._inner(() => FileRedis.prototype[op.toLowerCase()].call(self, k))); }
          return out;
        },
      };
    }
  }
  __setRedis(new Counting(store));
  async function call(method, { world = null, block, tables = false, body } = {}) {
    const q = {};
    if (world) q.world = world;
    if (block) q.block = block;
    if (tables) q.tables = '';
    const req = { method, query: q, body: body || {}, headers: { host: 'beach.test' }, url: (world ? `/w/${world}` : '') + '/.well-known/pscale-beach' };
    let status = 200, payload = null;
    const res = { setHeader() {}, status(c) { status = c; return this; }, json(o) { payload = o; return this; }, end() { return this; } };
    await handler(req, res);
    return { status, body: payload };
  }
  async function list() {
    asked.commands = {}; asked.roundTrips = 0;
    const r = await call('GET', { tables: true });
    return { ...r, rows: (r.body && r.body.tables) || [], names: ((r.body && r.body.tables) || []).map((t) => t.name), asked: { commands: { ...asked.commands }, roundTrips: asked.roundTrips } };
  }
  return { call, list };
}

const deployed = await load(BEACH_DIR);
const words = await load(tree('words', (f) => replaceOnce(f, WORDS_FROM, WORDS_TO)));
const declared = await load(tree('declared', (f, dst) => { replaceOnce(f, wholeFn(f), DECLARED_FN); replaceOnce(path.join(dst, 'scripts/file-redis.mjs'), SHIM_FROM, SHIM_TO); }));
const names = await load(tree('names', (f) => replaceOnce(f, NAMES_FROM, NAMES_TO)));

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 400) : '')); }
}
const tick = () => new Promise((r) => setTimeout(r, 8));
const total = (a) => Object.values(a.commands).reduce((x, y) => x + y, 0);
// every write goes through the handler as deployed: the real write path, the real stamps
async function write(world, block, content, extra = {}) {
  const r = await deployed.call('POST', { world, block, body: { spindle: '', content, ...extra } });
  if (r.status !== 200) throw new Error(`seed ${world}/${block}: ${r.status} ${JSON.stringify(r.body)}`);
  await tick();
}

const KEEPERS = 'keepers-own-words', SAM = 'river candle seven';
const GRIT = 'grit — this room runs the play loop its pool mounts (pscale:grit): a table room wherever it stands.';

// A game's table, on the pool track: a keeper's hold, a lobby, one room founded by purpose and declared.
await write('brackentest-kin', 'keeper:scene', { _: "The Author's hold for this table.", 3: 'PLACING: the table plays brackentest.' });
await write('brackentest-kin', 'pool:gate', { _: 'The gate at brackentest-kin — the lobby, before any character.' });
await write('brackentest-kin', 'pool:211', { _: 'pscale:grit/1' });
await write('brackentest-kin', 'convention:211', { _: GRIT });
// A game's table on the clock: a clock, its law, a keeper's hold, one line said at a beat — and no room.
await write('brackentest-clock', 'spine:temporal', { _: 'The clock of this table.', 1: 'the first evening' });
await write('brackentest-clock', 'function:temporal', { _: 'The law of a table played on time.' });
await write('brackentest-clock', 'keeper:scene', { _: "The Author's hold for this table.", 3: 'PLACING: the table plays brackentest.' });
await write('brackentest-clock', 'temporal:refa', { _: "refa's line on the clock.", 1: 'I wait at the ford until the light goes.' });
// The same, with one stray room standing in it.
await write('clock-with-a-room', 'spine:temporal', { _: 'The clock of this table.' });
await write('clock-with-a-room', 'function:temporal', { _: 'The law of a table played on time.' });
await write('clock-with-a-room', 'keeper:scene', { _: "The Author's hold for this table." });
await write('clock-with-a-room', 'pool:211', { _: 'The Slip — the cold ford, where the good road gives out.' });
// A trial: rooms named for the hands that keep them, no game.
await write('market-trial', 'pool:alder', { _: "Alder's parlour at the market. Standing need: a roofer." });
await write('market-trial', 'pool:birch', { _: "Birch's parlour at the market — the roofer's." });
// A notice board whose one room has its dials set: a DECLARED room that is not a game.
await write('quiet-board', 'pool:notices', { _: 'Notices for the street. Leave a line.' });
await write('quiet-board', 'convention:notices', { _: 'parlour — a plain board: every line shown as it was left.', 2: 'synthesis = off' });
// A community's own place, made last: its front line, a frame and a law under its keepers' words, two open rooms.
await write('riverside-recovery', 'lighthouse', { _: 'Riverside Recovery — a place made for a recovery community to use. It does not speak for them. It becomes theirs as their members use it.' }, { new_lock: KEEPERS });
await write('riverside-recovery', 'spine:constitution', { _: "SPINE — constitution. The clauses, in the draft's own words.", 1: '1.1 Name. (the words of clause 1.1)' }, { new_lock: KEEPERS });
await write('riverside-recovery', 'function:constitution', { _: "How a clause is answered: Yes, Change or Not sure, then the person's own words." }, { new_lock: KEEPERS });
await write('riverside-recovery', 'pool:constitution', { _: 'The room for talk about the constitution.' });
await write('riverside-recovery', 'pool:riverside-recovery', { _: 'The room for everything else. Anyone may leave a line.' });

console.log('1. The fault, on the handler as deployed');
let now = await deployed.list();
check('the answer opens "Tables played at"', now.status === 200 && /^Tables played at beach\.test/.test(now.body._), now.body && now.body._);
check('the community\'s place is on it, and first', now.names[0] === 'riverside-recovery' && now.rows[0].room === 'pool:riverside-recovery', now.rows);
check('the game\'s table is on it', now.names.includes('brackentest-kin'), now.names);
check('so are the trial and the notice board', now.names.includes('market-trial') && now.names.includes('quiet-board'), now.names);
check('a row is a name, a room and a moment: nothing in it tells a table from any other place', now.rows.every((r) => Object.keys(r).sort().join() === 'name,room,touched'), now.rows);
const seeded = now.rows[0].touched;
await write('riverside-recovery', 'passport:Sam', { _: 'Sam. Two years in, here to give back.' }, { new_lock: SAM });
await write('riverside-recovery', 'constitution:Sam', { _: "Sam's notebook on the constitution.", 1: 'Yes. It reads right to me.' }, { new_lock: SAM });
now = await deployed.list();
check('a member writing in their notebook does not move the place\'s row: it says when a room was written, not when the place was used', now.rows[0].name === 'riverside-recovery' && now.rows[0].touched === seeded, now.rows[0]);
check('the table on the clock is NOT on it: it has no room, so the list misses a table', !now.names.includes('brackentest-clock'), now.names);
check('a clock table is on it only where a stray room stands', now.names.includes('clock-with-a-room'), now.names);
const base = now;
check(`the store is asked for one KEYS and one HGETALL per world, in two round trips (${total(base.asked)} commands for ${base.asked.commands.HGETALL} worlds)`, base.asked.commands.KEYS === 1 && base.asked.commands.HGETALL === 6 && total(base.asked) === 7 && base.asked.roundTrips === 2, base.asked);

console.log('2. The recommendation: the words change, the list does not');
const w = await words.list();
check('the same rows, in the same order, with the same moments', JSON.stringify(w.rows) === JSON.stringify(base.rows), w.rows);
check('the store is asked exactly the same', JSON.stringify(w.asked) === JSON.stringify(base.asked), w.asked);
check('the answer opens "Places at … with a room written" and no longer says played', /^Places at beach\.test with a room written/.test(w.body._) && !/played/i.test(w.body._), w.body._);
check('it says that a row is where a room is, and that the place says what it is', /nothing of what runs in them/.test(w.body._) && /the place says itself/.test(w.body._), w.body._);
check('the envelope keeps its shape: _, origin, tables, now', Object.keys(w.body).sort().join() === '_,now,origin,tables' && w.body.origin === 'beach.test', Object.keys(w.body));
let r = await words.call('GET', { world: 'riverside-recovery', tables: true });
check('a place still has no list beneath it (404)', r.status === 404, r);
r = await words.call('GET', {});
check('the plain index is unchanged', Array.isArray(r.body.blocks) && r.body.tables === undefined, r.body);

console.log('3. The alternative: only a place where a room declares the play loop');
let d = await declared.list();
check('the game\'s table is listed', d.names.includes('brackentest-kin'), d.names);
check('the community\'s place, the trial and the notice board are not', !d.names.includes('riverside-recovery') && !d.names.includes('market-trial') && !d.names.includes('quiet-board'), d.names);
check('no table on the clock is listed: the one with a stray room is dropped, the one without was never there', !d.names.includes('clock-with-a-room') && !d.names.includes('brackentest-clock'), d.names);
check(`it costs one MGET more and a third round trip (${total(d.asked)} commands against ${total(base.asked)})`, d.asked.commands.MGET === 1 && total(d.asked) === total(base.asked) + 1 && d.asked.roundTrips === 3, d.asked);
await write('brackentest-kin', 'pool:gate', { _: 'The gate at brackentest-kin — the lobby, before any character.', 1: { _: 'Anyone here tonight?', 1: 'refa' } }, { confirm: true });
d = await declared.list();
check('a voice at the lobby still raises its table, and the row names the lobby', d.rows[0].name === 'brackentest-kin' && d.rows[0].room === 'pool:gate', d.rows);

console.log('4. The alternative\'s no-read shadow: a declaration\'s name beside a room, never read');
const n = await names.list();
check('it asks the store for nothing more than today', JSON.stringify(n.asked) === JSON.stringify((await deployed.list()).asked), n.asked);
check('it lists the table and drops the community\'s place and the trial', n.names.includes('brackentest-kin') && !n.names.includes('riverside-recovery') && !n.names.includes('market-trial'), n.names);
check('and it lists the notice board as a table, because its room declares a parlour', n.names.includes('quiet-board') && !d.names.includes('quiet-board'), n.names);

console.log('5. A declaration is born as open as its room');
r = await deployed.call('POST', { world: 'riverside-recovery', block: 'convention:constitution', body: { spindle: '', content: { _: 'grit' } } });
check('a stranger with no key writes one line beside the community\'s open room', r.status === 200, r);
d = await declared.list();
check('and the alternative now lists the community\'s place as a table', d.names.includes('riverside-recovery'), d.names);
const after = await words.list();
check('the recommendation\'s list is what it was: the place, under words that claim nothing about it', after.names.includes('riverside-recovery') && /^Places at/.test(after.body._), after.names);

fs.rmSync(scratch, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
