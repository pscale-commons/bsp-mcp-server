// router-doors.mts — what this repository's two doors SAY about the beach's list, run over the
// beach's REAL handler in-process on a scratch folder. A demonstration, not a battery: it prints
// the lines an agent is handed, so they can be read as the agent reads them. Nothing live is
// touched: every host but beach.test is refused, and every name below is invented.
//
//   BEACH_DIR=/path/to/pscale-beach npx tsx proposals/2026-09-30-the-list-of-tables-is-a-list-of-places/router-doors.mts
//
// BEACH_DIR is a checkout of github.com/pscale-commons/pscale-beach at main (or an operator's
// clone of it), with its node_modules installed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BEACH_DIR = process.env.BEACH_DIR;
if (!BEACH_DIR) { console.error('set BEACH_DIR to a checkout of pscale-commons/pscale-beach'); process.exit(2); }
const HOST = 'beach.test';
process.env.DEFAULT_BEACH = `https://${HOST}`;           // before the router is imported
process.env.KV_REST_API_URL = 'https://local.invalid';
process.env.KV_REST_API_TOKEN = 'local';
process.env.BEACH_ORIGIN = HOST;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'router-doors-'));
const { FileRedis } = await import(path.join(BEACH_DIR, 'scripts/file-redis.mjs'));
const { default: handler, __setRedis } = await import(path.join(BEACH_DIR, 'api/pscale-beach.js'));
__setRedis(new FileRedis(dir));

// The router reaches a beach through fetch; here fetch IS the handler.
const asked: string[] = [];
globalThis.fetch = (async (input: any, init?: any) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  if (url.host !== HOST) throw new Error(`refused: ${url.host} is not the rig`);
  const method = (init?.method || 'GET').toUpperCase();
  asked.push(`${method} ${url.pathname}${url.search}`);
  const req = {
    method,
    query: Object.fromEntries(url.searchParams),
    body: init?.body ? JSON.parse(init.body) : {},
    headers: { host: HOST },
    url: url.pathname + url.search,
  };
  let status = 200, payload: any = null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const res = {
    setHeader(k: string, v: string) { headers[k] = v; },
    status(c: number) { status = c; return this; },
    json(o: any) { payload = o; return this; },
    end() { return this; },
  };
  await handler(req, res);
  return new Response(status === 204 ? null : JSON.stringify(payload), { status, headers });
}) as typeof fetch;

const write = async (world: string | null, block: string, content: any, extra: Record<string, unknown> = {}) => {
  const r = await fetch(`https://${HOST}${world ? `/w/${world}` : ''}/.well-known/pscale-beach?block=${encodeURIComponent(block)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spindle: '', content, ...extra }),
  });
  if (!r.ok) throw new Error(`seed ${world}/${block}: ${r.status} ${await r.text()}`);
  await new Promise((done) => setTimeout(done, 8));
};

// The apex register, a game's table, and a community's own place made after it.
const PLACE = 'riverside-recovery';
await write(null, 'worlds', { _: 'Worlds at this beach — name → route → room.', 1: 'brackentest → /w/brackentest → surface' });
await write('brackentest-kin', 'keeper:scene', { _: "The Author's hold for this table.", 3: 'PLACING: the table plays brackentest.' });
await write('brackentest-kin', 'pool:211', { _: 'pscale:grit/1' });
await write('brackentest-kin', 'convention:211', { _: 'grit — this room runs the play loop its pool mounts (pscale:grit): a table room wherever it stands.' });
await write(PLACE, 'lighthouse', { _: 'Riverside Recovery — a place made for a recovery community to use. It does not speak for them. It becomes theirs as their members use it.' }, { new_lock: 'keepers-own-words' });
await write(PLACE, 'spine:constitution', { _: "SPINE — constitution. The clauses, in the draft's own words.", 1: '1.1 Name. (the words of clause 1.1)' }, { new_lock: 'keepers-own-words' });
await write(PLACE, 'function:constitution', { _: "How a clause is answered: Yes, Change or Not sure, then the person's own words." }, { new_lock: 'keepers-own-words' });
await write(PLACE, 'pool:constitution', { _: 'The room for talk about the constitution.' });
await write(PLACE, `pool:${PLACE}`, { _: 'The room for everything else. Anyone may leave a line.' });

const { handleBsp } = await import(new URL('../../src/tools/bsp.js', import.meta.url).href);
const { handlePlay } = await import(new URL('../../src/tools/play.js', import.meta.url).href);
const text = (r: any) => r.content[0].text as string;
const clip = (s: string, n: number) => s.split('\n').map((l) => (l.length > n ? l.slice(0, n) + ' …' : l)).join('\n');
const blocksAt = () => fs.readdirSync(dir).filter((f) => f.includes(encodeURIComponent(`/w/${PLACE}:block:`))).sort();

console.log('1. An agent lists the beach — bsp(agent_id="https://beach.test"). What it is told of the list:\n');
const index = text(await handleBsp({ agent_id: `https://${HOST}`, pscale_attention: null } as any));
const from = index.split('\n').findIndex((l) => /played here|with a room written here/.test(l));
console.log(clip(index.split('\n').slice(from).join('\n'), 420));

console.log(`\n2. A name that matches nothing — pscale_play(world="https://nowhere.invalid", handle="robin"):\n`);
console.log(clip(text(await handlePlay({ world: 'https://nowhere.invalid', handle: 'robin' } as any)), 420));

console.log(`\n3. A fresh handle at the place that is not a game — pscale_play(world="${PLACE}", handle="robin"). The first lines of what the door hands back:\n`);
const stood = blocksAt();
asked.length = 0;
const door = text(await handlePlay({ world: PLACE, handle: 'robin' } as any));
console.log(clip(door.split('\n').slice(0, 7).join('\n'), 420));
console.log(`  … ${door.length} characters in all; the creation passage follows.`);
console.log('\n   what the door read at the beach to decide this:');
for (const a of asked) console.log('     ' + a);
console.log('   blocks the door itself wrote at the place: ' + JSON.stringify(blocksAt().filter((f) => !stood.includes(f))));

fs.rmSync(dir, { recursive: true, force: true });
