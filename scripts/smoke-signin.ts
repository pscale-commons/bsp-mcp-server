/**
 * smoke-signin.ts — THE KEY IN THE CONNECTOR, BY FINGERPRINT (src/signin.ts;
 * proposals/2026-11-04-the-key-in-the-connector.md).
 *
 * Part 1, in-process: every tool that takes a `secret` gets the signed key where a call carries
 * none; a call's own secret wins; "vault" in `secret`, `enc_secret` or `new_lock` is the key; any
 * other `new_lock` on a call the key was put into is refused, running nothing, while a call that
 * brings its own key moves its own lock; the key never seals unless asked; an unsigned call naming
 * "vault" is refused; nothing a signed call returns contains the key; a signed session's hand is
 * its handle.
 *
 * Part 2, over HTTP, with no beach behind the router (as CI runs): the router spawned as Railway
 * runs it, with BSP_SIGNIN_SECRET, and everything that proves itself without one: the 401 and its
 * pointer, both metadata documents, registration, the page, every refusal before a fingerprint
 * is minted, a sign-in that cannot reach the beach mints nothing. Then once with no secret: sign-in
 * is off, and the open endpoint is untouched either way.
 *
 * Part 3, through the REAL beach handler (pscale-beach's scripts/local-beach.mjs on a scratch
 * folder, as smoke:pass runs it): minting with a wrong key and the right one, the ring holding no
 * key in the clear, a signed write with no secret, the vault opened with enc_secret "vault" and the
 * key taken out of what comes back, a second fingerprint, revoking one on the router's page while
 * the other goes on, and refresh refused for the revoked one; then the one address, /me, signed
 * in with the handle typed, a typed name with no passport standing refused ("me" among them) and
 * an /as/ address naming one refused before any key is typed, its
 * token and /as/<handle>'s each refused at the other, a new block founded with new_lock "vault",
 * and that block's lock neither moved nor opened through the fingerprint, though the key in hand
 * still moves it. Skipped, and said so, where no
 * pscale-beach checkout stands beside this repository: CI's gate proves itself from this repo
 * alone.
 *
 * Part 4, a router whose own beach is a members' beach: the key hidden there, the ring founded behind
 * the wall and shown to no stranger, a signed write landing, the same token writing again after the
 * router restarts (the key its token carries proves the pass the wall asks for), and the fingerprints
 * page asking for the key before it lists or revokes.
 *
 * Part 5, a member of another beach: the page names the router's own beach, and a handle that stands
 * only elsewhere is told so; named, an open beach and a members' beach each take the ring, the
 * session's instructions name that beach, and a signed write lands there, never at the router's own.
 *
 * Localhost only; never the live beach. Run: npm run smoke:signin
 *   (BEACH_DIR=<a pscale-beach checkout> for part 3; default ../pscale-beach)
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { installSignedIn, sealingKey, signedSealNote } from '../src/signin.js';
import { declareHand, handOf } from '../src/looks.js';
import { selfEncrypt } from '../src/keys.js';

let pass = 0, fail = 0;
function ok(label: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${label}`); } else { fail++; console.log(`  ✗ ${label}${detail ? ` — ${detail.slice(0, 300)}` : ''}`); }
}

// ── Part 1: the wrapper ──

async function wrapper() {
  console.log('=== the wrapper ===');
  const KEY = 'ada-wrapper-key';
  const tools: Record<string, (...a: any[]) => Promise<any>> = {};
  const stub: any = { tool: (...args: any[]) => { tools[args[0]] = args[args.length - 1]; } };
  installSignedIn(stub);
  let seen: any = null;
  stub.tool('takes', 'a tool with a secret', { secret: z.string().optional(), enc_secret: z.string().optional(), new_lock: z.string().nullable().optional() }, {},
    async (p: any) => { seen = { secret: p.secret, enc: p.enc_secret, lock: p.new_lock, seal: sealingKey(p.enc_secret, p.secret), note: signedSealNote() }; return { content: [{ type: 'text', text: 'ok' }] }; });
  stub.tool('keyless', 'a tool with no secret', { block: z.string() }, {}, async (p: any) => { seen = { keys: Object.keys(p) }; return { content: [{ type: 'text', text: `the vault says ${KEY} opens it` }] }; });
  stub.tool('bare', 'a tool with no parameters', async () => { seen = { bare: true }; return { content: [{ type: 'text', text: 'ok' }] }; });
  const signed = (sessionId: string) => ({ sessionId, authInfo: { token: 't', clientId: 'c', scopes: ['bsp'], extra: { signedIn: { handle: 'ada', key: KEY } } } });

  await tools.takes({}, signed('s1'));
  ok('a call with no secret gets the signed key', seen.secret === KEY, JSON.stringify(seen));
  ok('…which never seals unless asked', seen.seal === undefined);
  ok('…and a refused seal says how to ask', /enc_secret: "vault"/.test(seen.note));
  await tools.takes({ enc_secret: 'vault' }, signed('s1'));
  ok('enc_secret "vault" seals and opens with the key', seen.enc === KEY && seen.seal === KEY);
  await tools.takes({ enc_secret: 'SEAL' }, signed('s1'));
  ok("a call's own enc_secret still seals", seen.seal === 'SEAL' && seen.secret === KEY);
  await tools.takes({ secret: 'OTHER' }, signed('s1'));
  ok("a call's own secret wins over the sign-in, and seals as it always did", seen.secret === 'OTHER' && seen.seal === 'OTHER' && seen.note === '');
  await tools.takes({ secret: '' }, signed('s1'));
  ok('an empty secret counts as none', seen.secret === KEY);
  await tools.takes({ secret: 'vault' }, signed('s1'));
  ok('secret "vault" is the key, and seals nothing unless asked', seen.secret === KEY && seen.seal === undefined);
  await tools.takes({ new_lock: 'vault' }, signed('s1'));
  ok('new_lock "vault" latches under the key', seen.lock === KEY && seen.secret === KEY);
  for (const [lock, act] of [['OTHER', 'moving a lock to another key'], ['', 'opening a lock with an empty one'], [null, 'opening a lock with null']] as const) {
    seen = null;
    const r = await tools.takes({ new_lock: lock }, signed('s1'));
    ok(`${act} with the key put in is refused, and runs nothing`, seen === null && r.isError === true && /sets a lock only to the key itself/.test(r.content[0].text) && !r.content[0].text.includes(KEY), JSON.stringify(r));
  }
  seen = null;
  const viaWord = await tools.takes({ secret: 'vault', new_lock: 'OTHER' }, signed('s1'));
  ok('…and so with secret "vault" naming the key', seen === null && viaWord.isError === true);
  await tools.takes({ secret: 'MINE', new_lock: 'OTHER' }, signed('s1'));
  ok('a call that brings its own key moves its own lock', seen.secret === 'MINE' && seen.lock === 'OTHER');
  await tools.takes({ secret: 'vault', new_lock: 'vault' }, signed('s1'));
  ok('the key set to the key stands', seen.secret === KEY && seen.lock === KEY);
  await tools.takes({ secret: 'X', enc_secret: 'E' }, { sessionId: 's2' });
  ok('an unsigned call is untouched', seen.secret === 'X' && seen.enc === 'E' && seen.seal === 'E');
  for (const field of ['secret', 'enc_secret', 'new_lock']) {
    seen = null;
    const r = await tools.takes({ [field]: 'vault' }, { sessionId: 's2' });
    ok(`an unsigned call naming "vault" in ${field} is refused, and runs nothing`, seen === null && r.isError === true && /only on a connection whose key bsp-mcp hides/.test(r.content[0].text), JSON.stringify(r));
  }
  const shown = await tools.keyless({ block: 'b' }, signed('s3'));
  ok('a tool that takes no secret is given none', seen.keys.length === 1 && seen.keys[0] === 'block', JSON.stringify(seen));
  ok('nothing a signed call returns contains the key', !shown.content[0].text.includes(KEY) && shown.content[0].text.includes("[this connection's key]"), shown.content[0].text);
  const plain = await tools.keyless({ block: 'b' }, { sessionId: 's6' });
  ok('…while an unsigned call returns what the tool said', plain.content[0].text.includes(KEY));
  await tools.bare(signed('s4'));
  ok('a tool with no parameters still runs', seen.bare === true);
  ok("a signed session's hand is its handle", handOf('s1') === 'ada');
  declareHand('s5', 'bob');
  await tools.takes({}, signed('s5'));
  ok('a hand the session already named is kept', handOf('s5') === 'bob');
}

// ── Shared: the router and the client side of the sign-in ──

const ACCEPT = 'application/json, text/event-stream';
const CB = 'https://claude.ai/api/mcp/auth_callback';
const init = (id: number) => JSON.stringify({
  jsonrpc: '2.0', id, method: 'initialize',
  params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'smoke-signin', version: '0.0.0' } },
});
const b64url = (b: Buffer) => b.toString('base64url');
const form = (o: Record<string, string>) => new URLSearchParams(o).toString();

async function start(port: number, env: Record<string, string | undefined>): Promise<ChildProcess> {
  const e: NodeJS.ProcessEnv = { ...process.env, PORT: String(port) };
  for (const [k, v] of Object.entries(env)) { if (v === undefined) delete e[k]; else e[k] = v; }
  const child = spawn('npx', ['tsx', 'src/index.ts'], { env: e, stdio: ['ignore', 'pipe', 'inherit'], detached: true });
  await new Promise<void>((res, rej) => {
    const timer = setTimeout(() => rej(new Error('server did not start in 20s')), 20000);
    child.stdout!.on('data', (buf: Buffer) => { if (buf.toString().includes('running on')) { clearTimeout(timer); res(); } });
    child.on('exit', () => { clearTimeout(timer); rej(new Error('server exited early')); });
  });
  return child;
}

/** Stop a router started above, and its tsx child with it (the whole group), before its port is used again. */
async function stop(child: ChildProcess | null): Promise<void> {
  if (!child || child.exitCode !== null) return;
  const gone = new Promise<void>((res) => child.once('exit', () => res()));
  try { process.kill(-child.pid!, 'SIGTERM'); } catch { child.kill('SIGTERM'); }
  await Promise.race([gone, new Promise((r) => setTimeout(r, 5000))]);
}

/** A client of one signed address: <O>/mcp/v1/as/<handle>, or <O>/mcp/v1/me with at = 'me'. */
function client(O: string, handle: string, at = `as/${handle}`) {
  const RES = `${O}/mcp/v1/${at}`;
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  const register = async () => (await fetch(`${O}/oauth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_name: 'Claude', redirect_uris: [CB, 'http://localhost/callback'] }) })).json();
  const ask = (clientId: string, over: Record<string, string> = {}) => ({ response_type: 'code', client_id: clientId, redirect_uri: CB,
    code_challenge: challenge, code_challenge_method: 'S256', state: 'st1', scope: 'bsp', resource: RES, ...over });
  const authorize = (clientId: string, over: Record<string, string> = {}) => fetch(`${O}/oauth/authorize?${form(ask(clientId, over))}`, { redirect: 'manual' });
  // At /as/<handle> the posted handle is ignored (the address fixes it); at /me it is the one signed in.
  // The beach field is posted only where a case names one; a client that posts none is the router's own beach.
  // `person`, where a case gives one, is the page's own-name field, which the fingerprint's name begins with.
  const signIn = (clientId: string, key: string, name: string, typed = at === 'me' ? handle : 'mallory', beach?: string, person?: string) => fetch(`${O}/oauth/authorize`, { method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form({ ...ask(clientId), handle: typed, key, name, ...(beach !== undefined ? { beach } : {}), ...(person !== undefined ? { person } : {}) }) });
  const token = (body: Record<string, string>) => fetch(`${O}/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form(body) });
  const exchange = (clientId: string, code: string) => token({ grant_type: 'authorization_code', code, redirect_uri: CB, client_id: clientId, code_verifier: verifier, resource: RES });
  const mcp = (url: string, body: string, bearer?: string, session?: string) => fetch(url, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: ACCEPT, ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), ...(session ? { 'mcp-session-id': session } : {}) }, body });
  return { RES, verifier, register, authorize, signIn, token, exchange, mcp };
}

// ── Part 2: the router with no beach behind it ──

async function router() {
  const PORT = 3000 + Math.floor(Math.random() * 2000);
  const O = `http://127.0.0.1:${PORT}`;
  const c = client(O, 'ada');
  const child = await start(PORT, { BSP_SIGNIN_SECRET: 'smoke-signin-secret-' + 'x'.repeat(40), DEFAULT_BEACH: 'http://127.0.0.1:9' });
  try {
    console.log('\n=== the signed address answers 401, pointing at its metadata ===');
    const r401 = await c.mcp(c.RES, init(1));
    const www = r401.headers.get('www-authenticate') ?? '';
    ok('no token → 401', r401.status === 401);
    ok('…with resource_metadata for this address', www.includes(`resource_metadata="${O}/.well-known/oauth-protected-resource/mcp/v1/as/ada"`), www);
    ok('CORS lets a browser client send Authorization', /authorization/i.test((await fetch(c.RES, { method: 'OPTIONS' })).headers.get('access-control-allow-headers') ?? ''));

    console.log('\n=== the two metadata documents ===');
    const prm = await (await fetch(`${O}/.well-known/oauth-protected-resource/mcp/v1/as/ada`)).json();
    ok('the resource is the address as entered, its server this router', prm.resource === c.RES && prm.authorization_servers?.[0] === O, JSON.stringify(prm));
    ok('the bare resource document names no handle → 404', (await fetch(`${O}/.well-known/oauth-protected-resource`)).status === 404);
    const asm = await (await fetch(`${O}/.well-known/oauth-authorization-server`)).json();
    ok('issuer, endpoints, S256, public clients', asm.issuer === O && asm.token_endpoint === `${O}/oauth/token`
      && asm.registration_endpoint === `${O}/oauth/register` && asm.code_challenge_methods_supported?.includes('S256')
      && asm.token_endpoint_auth_methods_supported?.includes('none'), JSON.stringify(asm));

    console.log('\n=== registration and the page ===');
    const cl = await c.register();
    ok('a client registers, stored nowhere', typeof cl.client_id === 'string' && cl.client_name === 'Claude');
    ok('a plain-http redirect elsewhere is refused', (await fetch(`${O}/oauth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirect_uris: ['http://evil.example/cb'] }) })).status === 400);
    const pg = await c.authorize(cl.client_id);
    const html = await pg.text();
    ok('the page asks for the key of the handle the address fixes, and a name for the connection',
      pg.status === 200 && /Hide ada's key from your AI/.test(html) && /type="password"/.test(html) && /readonly/.test(html) && /name="name"/.test(html) && /Claude, \d{4}-\d\d-\d\d/.test(html));
    ok('…says what it is, hiding the key, and never a sign-in to the beach', />Hide the key<\/button>/.test(html) && /not a sign-in to the beach, which has none/.test(html) && !/Sign in/.test(html));
    ok("…and asks which beach the passport stands at, the router's own filled in", /Your beach, where that passport stands<input name="beach" value="127\.0\.0\.1:9" required/.test(html));
    ok('…names where it returns to, and cannot be framed', /Claude \(claude\.ai\)/.test(html) && pg.headers.get('x-frame-options') === 'DENY');
    ok('an unregistered return address is a page, never a redirect', (await c.authorize(cl.client_id, { redirect_uri: 'https://evil.example/cb' })).status === 400);
    ok('a forged client is a page', (await c.authorize('forged')).status === 400);
    const plain = await c.authorize(cl.client_id, { code_challenge_method: 'plain' });
    ok('no S256 → back to the client with invalid_request', plain.status === 302 && (plain.headers.get('location') ?? '').startsWith(`${CB}?error=invalid_request`));
    ok("another server's resource → invalid_target", /error=invalid_target/.test((await c.authorize(cl.client_id, { resource: 'https://elsewhere.example/mcp/v1/as/ada' })).headers.get('location') ?? ''));
    const loop = await c.authorize(cl.client_id, { redirect_uri: 'http://localhost:53123/callback' });
    ok('a loopback return matches on any port (Claude Code)', loop.status === 200 && /A program on this computer/.test(await loop.text()));

    console.log('\n=== the one address, /mcp/v1/me ===');
    const me = client(O, 'ada', 'me');
    const m401 = await me.mcp(me.RES, init(4));
    const mwww = m401.headers.get('www-authenticate') ?? '';
    ok('/me with no token → 401, pointing at its own metadata', m401.status === 401 && mwww.includes(`resource_metadata="${O}/.well-known/oauth-protected-resource/mcp/v1/me"`), mwww);
    const mprm = await (await fetch(`${O}/.well-known/oauth-protected-resource/mcp/v1/me`)).json();
    ok('its metadata names /me, served by this router', mprm.resource === me.RES && mprm.authorization_servers?.[0] === O, JSON.stringify(mprm));
    const mpg = await me.authorize(cl.client_id);
    const mhtml = await mpg.text();
    ok('its page asks for the handle as well as the key', mpg.status === 200 && /<input name="handle" required/.test(mhtml) && !/name="handle"[^>]*readonly/.test(mhtml) && /type="password"/.test(mhtml), mhtml.slice(0, 600));
    ok('…saying the handle is the name the blocks are under, not the address', /Your handle, the name your blocks are under<input name="handle"/.test(mhtml));
    ok('…under "Hide your key from your AI", its button "Hide my key"', /<h1>Hide your key from your AI<\/h1>/.test(mhtml) && />Hide my key<\/button>/.test(mhtml) && !/Sign in/.test(mhtml));
    const notHandle = await me.signIn(cl.client_id, 'ada-the-key', 'my phone', 'not a handle!');
    ok('a typed handle that is not a handle stays on the page', notHandle.status === 400 && /A handle is letters/.test(await notHandle.text()));
    const mlost = await me.signIn(cl.client_id, 'ada-the-key', 'my phone');
    ok('…and a good one with no beach to answer mints nothing', mlost.status === 400 && !mlost.headers.get('location') && /did not answer/.test(await mlost.text()));
    ok('a forged bearer at /me → 401', (await me.mcp(me.RES, init(5), 'forged-token-'.repeat(5))).status === 401);
    ok('/mcp/v1/me/more is no address', (await me.mcp(`${O}/mcp/v1/me/more`, init(6))).status === 404);

    console.log('\n=== with no beach to answer, nothing is minted ===');
    const lost = await c.signIn(cl.client_id, 'ada-the-key', 'my phone');
    ok('a sign-in that cannot reach the beach stays on the page, with no code', lost.status === 400 && !lost.headers.get('location') && /did not answer/.test(await lost.text()));
    ok('a code that was never minted → invalid_grant', (await (await c.exchange(cl.client_id, 'never-minted-code-'.repeat(4))).json()).error === 'invalid_grant');
    ok('an unknown grant → unsupported_grant_type', (await (await c.token({ grant_type: 'password' })).json()).error === 'unsupported_grant_type');
    ok('a forged bearer → 401', (await c.mcp(c.RES, init(2), 'forged-token-'.repeat(5))).status === 401);
    ok('the fingerprints page says the beach did not answer', (await fetch(`${O}/fingerprints/ada`)).status === 503);
    ok('/mcp/v1 initializes with no token', (await c.mcp(`${O}/mcp/v1`, init(3))).status === 200);
  } finally {
    await stop(child);
  }

  console.log('\n=== a router with no secret: sign-in is off ===');
  const P2 = PORT + 1;
  const O2 = `http://127.0.0.1:${P2}`;
  const off = await start(P2, { BSP_SIGNIN_SECRET: undefined });
  try {
    ok('no metadata', (await fetch(`${O2}/.well-known/oauth-authorization-server`)).status === 404);
    ok('no signed address', (await fetch(`${O2}/mcp/v1/as/ada`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: ACCEPT }, body: init(1) })).status === 404);
    ok('no fingerprints page', (await fetch(`${O2}/fingerprints/ada`)).status === 404);
    ok('the open endpoint still answers', (await fetch(`${O2}/mcp/v1`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: ACCEPT }, body: init(1) })).status === 200);
  } finally {
    await stop(off);
  }
}

// ── Part 3: the whole life of a fingerprint, through the real beach handler ──

const textOf = (j: any) => String(j?.result?.content?.[0]?.text ?? j?.error?.message ?? JSON.stringify(j));

async function realBeach() {
  const BEACH_DIR = process.env.BEACH_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'pscale-beach');
  const script = join(BEACH_DIR, 'scripts', 'local-beach.mjs');
  if (!existsSync(script)) { console.log(`\n=== the real beach handler: skipped — no pscale-beach checkout at ${BEACH_DIR} (set BEACH_DIR) ===`); return; }
  console.log('\n=== the whole life of a fingerprint, through the real beach handler ===');
  const BP = 6000 + Math.floor(Math.random() * 2000);
  const B = `http://127.0.0.1:${BP}`;
  /** The beach as the router's page names it. */
  const HERE = `127.0.0.1:${BP}`;
  const W = `${B}/.well-known/pscale-beach`;
  const dir = mkdtempSync(join(os.tmpdir(), 'signin-'));
  const beach = spawn('node', [script, '--dir', dir, '--port', String(BP), '--origin', 'signin.test'], { stdio: ['ignore', 'ignore', 'inherit'] });
  const RP = 5000 + Math.floor(Math.random() * 900);
  const O = `http://127.0.0.1:${RP}`;
  let rtr: ChildProcess | null = null;
  try {
    let up = false;
    for (let i = 0; i < 80 && !up; i++) {
      try { up = (await fetch(W)).status < 500; } catch { await new Promise((r) => setTimeout(r, 250)); }
    }
    if (!up) { ok('the local beach starts', false); return; }
    rtr = await start(RP, { BSP_SIGNIN_SECRET: 'smoke-signin-secret-' + 'y'.repeat(40), DEFAULT_BEACH: B });

    const KEY = 'ada-the-actual-key';
    const found = (block: string, content: unknown, key: string) => fetch(`${W}?block=${encodeURIComponent(block)}`, { method: 'POST',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ spindle: '', content, new_lock: key }) });
    const raw = async (block: string, spindle?: string) => (await fetch(`${W}?block=${encodeURIComponent(block)}${spindle ? `&spindle=${spindle}` : ''}`)).text();
    ok("ada's passport, latched by her key", (await found('passport:ada', { _: 'ADA' }, KEY)).status === 200);
    ok("ada's journal, latched by it too", (await found('journal:ada', { _: "ada's journal" }, KEY)).status === 200);
    const sealed = await selfEncrypt(`journal:ada opens with ${KEY}; the gate key is GATE-KEY-123`, KEY, B);
    ok("ada's vault, one entry sealed under her key", (await found('vault:ada', { _: "ada's vault", 1: sealed }, KEY)).status === 200);
    ok('…and journal:bob under bob\'s', (await found('journal:bob', { _: "bob's journal" }, 'bob-other-key')).status === 200);

    const c = client(O, 'ada');
    const cl = await c.register();
    console.log('  — minting');
    const wrong = await c.signIn(cl.client_id, 'not-adas-key', 'my phone');
    const wrongPage = await wrong.text();
    ok('a wrong key mints nothing: the page says so', wrong.status === 400 && /does not open ada/.test(wrongPage), `${wrong.status} ${(wrongPage.match(/class="problem">([^<]*)/) ?? [])[1] ?? ''}`);
    ok('…and leaves no ring behind', /not found/.test(await raw('fingerprints:ada')));
    const phone = await c.signIn(cl.client_id, KEY, 'my phone');
    const code = new URL(phone.headers.get('location') ?? 'http://none/').searchParams.get('code') ?? '';
    ok('the right key mints a fingerprint and returns a code', phone.status === 302 && !!code);
    const ring1 = await raw('fingerprints:ada');
    ok('fingerprints:ada names it, holding the key only sealed', /my phone/.test(ring1) && !ring1.includes(KEY), ring1.slice(0, 200));
    const t = await (await c.exchange(cl.client_id, code)).json();
    ok('the code gives a token and a refresh token', !!t.access_token && !!t.refresh_token, JSON.stringify(t));

    console.log('  — using');
    const session = async (url: string, bearer?: string) => {
      const r = await c.mcp(url, init(20), bearer);
      const sid = r.headers.get('mcp-session-id') ?? '';
      await c.mcp(url, JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }), bearer, sid);
      let id = 21;
      const call = async (args: Record<string, unknown>) => {
        const res = await c.mcp(url, JSON.stringify({ jsonrpc: '2.0', id: id++, method: 'tools/call', params: { name: 'bsp', arguments: { agent_id: B, ...args } } }), bearer, sid);
        return { status: res.status, body: res.status === 200 ? await res.json() : null };
      };
      return { status: r.status, call };
    };
    const s = await session(c.RES, t.access_token);
    ok('the token opens the signed address', s.status === 200);
    const w = await s.call({ block: 'journal:ada', spindle: '1', content: 'written through a fingerprint, no key in the call' });
    ok('a write with no secret lands under the latch', /written through a fingerprint/.test(await raw('journal:ada', '1')), textOf(w.body));
    const v = textOf((await s.call({ block: 'vault:ada', spindle: '1', enc_secret: 'vault' })).body);
    ok('enc_secret "vault" opens the vault', /GATE-KEY-123/.test(v), v);
    ok('…and the key itself is taken out of what comes back', !v.includes(KEY) && v.includes("[this connection's key]"), v);
    const g = textOf((await s.call({ block: 'journal:ada', spindle: '3', content: 'sealed?', gray: true })).body);
    ok('a seal not asked for is refused, saying how to ask', /rejected/i.test(g) && /enc_secret: "vault"/.test(g), g);
    const foreign = textOf((await s.call({ block: 'journal:bob', spindle: '1', content: 'not mine' })).body);
    ok("another hand's latch refuses the key", /does not match/.test(foreign), foreign);
    const open = await session(`${O}/mcp/v1`);
    ok('the same write through the open endpoint is refused', /secret required/.test(textOf((await open.call({ block: 'journal:ada', spindle: '2', content: 'unsigned' })).body)));

    console.log('  — a second fingerprint, and revoking the first');
    const laptopCode = new URL((await c.signIn(cl.client_id, KEY, 'my laptop')).headers.get('location') ?? 'http://none/').searchParams.get('code') ?? '';
    const t2 = await (await c.exchange(cl.client_id, laptopCode)).json();
    ok('a second fingerprint takes the next digit', /my laptop/.test(await raw('fingerprints:ada', '2')) && !!t2.access_token);
    const list = await (await fetch(`${O}/fingerprints/ada`)).text();
    ok('the fingerprints page lists both', /my phone/.test(list) && /my laptop/.test(list) && /type="password"/.test(list));
    const revokeAt = (key: string) => fetch(`${O}/fingerprints/ada`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form({ revoke: '1', key }) });
    const badRevoke = await revokeAt('not-adas-key');
    ok('revoking needs the key', badRevoke.status === 400 && /does not open ada/.test(await badRevoke.text()));
    const goodRevoke = await revokeAt(KEY);
    ok('with the key, the phone is revoked', goodRevoke.status === 200 && /Revoked: my phone/.test(await goodRevoke.text()));
    ok('…its digit emptied, the laptop\'s standing', !/my phone/.test(await raw('fingerprints:ada')) && /my laptop/.test(await raw('fingerprints:ada')));
    const after = await s.call({ block: 'journal:ada', spindle: '4', content: 'after revoking' });
    ok("the phone's session is signed out at once", after.status === 401);
    ok("the phone's refresh is refused", (await (await c.token({ grant_type: 'refresh_token', refresh_token: t.refresh_token })).json()).error === 'invalid_grant');
    const lap = await session(c.RES, t2.access_token);
    ok('the laptop goes on, with the same key', /written by the laptop/.test(await (async () => { await lap.call({ block: 'journal:ada', spindle: '5', content: 'written by the laptop' }); return raw('journal:ada', '5'); })()));
    const fresh = await c.token({ grant_type: 'refresh_token', refresh_token: t2.refresh_token });
    ok("the laptop's refresh gives a fresh pair", fresh.status === 200 && !!(await fresh.json()).access_token);

    console.log('  — whose sign-in it is (janus, pool:weft 462)');
    const told = async (bearer: string) => {
      const r = await c.mcp(c.RES, init(40), bearer);
      return r.status === 200 ? String((await r.json())?.result?.instructions ?? '') : `HTTP ${r.status}`;
    };
    const lapTold = await told(t2.access_token);
    ok("a session's instructions name the fingerprint it came by: its digit and its name", lapTold.startsWith('THIS CONNECTION WRITES AS ada') && lapTold.includes('fingerprint 2 of fingerprints:ada, which its holder named "my laptop"'), lapTold.slice(0, 300));
    const deskCode = new URL((await c.signIn(cl.client_id, KEY, 'my desk', 'mallory', undefined, ' Ada ')).headers.get('location') ?? 'http://none/').searchParams.get('code') ?? '';
    const t3 = await (await c.exchange(cl.client_id, deskCode)).json();
    ok("the page's own-name field begins the fingerprint's name, in the emptied digit", /"_":"Ada, my desk"/.test(await raw('fingerprints:ada', '1')) && !!t3.access_token);
    ok('…and its session says whose sign-in it is', (await told(t3.access_token)).includes('fingerprint 1 of fingerprints:ada, which its holder named "Ada, my desk"'));
    const pageNow = await (await fetch(`${O}/fingerprints/ada`)).text();
    ok('the fingerprints page offers each name to change, saving before revoking', /name="name2" value="my laptop"/.test(pageNow) && pageNow.indexOf('Save the names') > 0 && pageNow.indexOf('Save the names') < pageNow.indexOf('Revoke the ticked ones'));
    const renameAt = (key: string, fields: Record<string, string>) => fetch(`${O}/fingerprints/ada`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form({ rename: '1', key, ...fields }) });
    const ringBefore = JSON.parse(await raw('fingerprints:ada'));
    const badName = await renameAt('not-adas-key', { name2: 'Ada, the kitchen laptop' });
    ok('renaming needs the key', badName.status === 400 && /does not open ada/.test(await badName.text()));
    const same = await renameAt(KEY, { name2: 'my laptop' });
    ok('…and a name left as it was changes nothing', same.status === 400 && /Change a name first/.test(await same.text()));
    const renamed = await renameAt(KEY, { name2: 'Ada, "the" kitchen laptop' });
    ok('with the key, the laptop is renamed', renamed.status === 200 && /Renamed: Ada, &quot;the&quot; kitchen laptop/.test(await renamed.text()));
    const ringAfter = JSON.parse(await raw('fingerprints:ada'));
    ok('…only its name changed: its sealed key, and every other digit, as they were',
      ringAfter['2']._ === 'Ada, "the" kitchen laptop' && ['1', '2', '3', '4', '5'].every((k) => ringAfter['2'][k] === ringBefore['2'][k])
      && ['_', ...['1', '3', '4', '5', '6', '7', '8', '9']].every((d) => JSON.stringify(ringAfter[d]) === JSON.stringify(ringBefore[d])), JSON.stringify(ringAfter['2']).slice(0, 200));
    ok('…its next session says the new name, quoted cleanly', (await told(t2.access_token)).includes('fingerprint 2 of fingerprints:ada, which its holder named "Ada, the kitchen laptop"'));
    const lap2 = await session(c.RES, t2.access_token);
    await lap2.call({ block: 'journal:ada', spindle: '9', content: 'written after its renaming' });
    ok('…and it still writes with the key', /written after its renaming/.test(await raw('journal:ada', '9')));

    console.log('  — the one address');
    const me = client(O, 'ada', 'me');
    const mcl = await me.register();
    const wrongMe = await me.signIn(mcl.client_id, 'bob-other-key', 'my tablet');
    ok('at /me, a key that does not open the typed handle mints nothing', wrongMe.status === 400 && /does not open ada/.test(await wrongMe.text()));
    for (const typed of ['me', 'bob']) {
      const none = await me.signIn(mcl.client_id, KEY, 'my tablet', typed);
      const nonePage = await none.text();
      ok(`at /me, "${typed}" with no passport standing mints nothing: the page says so`, none.status === 400 && nonePage.includes(`&quot;${typed}&quot; is not a handle on ${HERE}: no passport:${typed} stands there`), `${none.status} ${(nonePage.match(/class="problem">([^<]*)/) ?? [])[1] ?? ''}`);
      ok('…and founds no ring for it', /not found/.test(await raw(`fingerprints:${typed}`)));
    }
    const asMe = client(O, 'me');
    const amcl = await asMe.register();
    const amPage = await asMe.authorize(amcl.client_id);
    const amHtml = await amPage.text();
    ok('/as/me, a handle no passport stands for here, says so before any key is typed, pointing at /me and asking which beach it stands at instead',
      amPage.status === 200 && amHtml.includes(`There is no me on ${HERE}`) && amHtml.includes(`${O}/mcp/v1/me<`) && /<input name="beach" value="" required/.test(amHtml), `${amPage.status} ${amHtml.slice(0, 300)}`);
    const amPost = await asMe.signIn(amcl.client_id, KEY, 'my tablet');
    ok('…and a sign-in posted there for this beach mints nothing', amPost.status === 400 && (await amPost.text()).includes(`&quot;me&quot; is not a handle on ${HERE}`) && /not found/.test(await raw('fingerprints:me')));
    const meCode = new URL((await me.signIn(mcl.client_id, KEY, 'my tablet')).headers.get('location') ?? 'http://none/').searchParams.get('code') ?? '';
    const tm = await (await me.exchange(mcl.client_id, meCode)).json();
    ok('signing in at /me with the handle typed mints a fingerprint for it', !!tm.access_token && /my tablet/.test(await raw('fingerprints:ada')), JSON.stringify(tm));
    const ms = await session(me.RES, tm.access_token);
    ok('the token opens /me', ms.status === 200);
    await ms.call({ block: 'journal:ada', spindle: '6', content: 'written at the one address' });
    ok('…as the handle signed in, writing under its latch', /written at the one address/.test(await raw('journal:ada', '6')));
    ok('a /me token does not open /as/ada', (await c.mcp(c.RES, init(30), tm.access_token)).status === 401);
    ok('an /as/ada token does not open /me', (await me.mcp(me.RES, init(31), t2.access_token)).status === 401);

    console.log('  — "vault" wherever a call would name the key');
    const founded = textOf((await ms.call({ block: 'notes:ada', content: { _: "ada's notes" }, new_lock: 'vault' })).body);
    ok('new_lock "vault" founds a block under the key, and the reply hides it', /ada's notes|notes:ada/.test(await raw('notes:ada')) && !founded.includes(KEY), founded);
    const shut = textOf((await open.call({ block: 'notes:ada', spindle: '1', content: 'unsigned' })).body);
    ok('…latched: the open endpoint cannot write it', /secret required|locked/i.test(shut), shut);
    await ms.call({ block: 'notes:ada', spindle: '1', content: 'the signed hand can' });
    ok('…and the signed hand can', /the signed hand can/.test(await raw('notes:ada', '1')));
    await ms.call({ block: 'journal:ada', spindle: '7', content: 'secret named as vault', secret: 'vault' });
    ok('secret "vault" writes with the key', /secret named as vault/.test(await raw('journal:ada', '7')));
    const lit = textOf((await open.call({ block: 'journal:ada', spindle: '8', content: 'x', secret: 'vault' })).body);
    ok('"vault" through the open endpoint is refused before it reaches the beach', /only on a connection whose key bsp-mcp hides/.test(lit), lit);

    console.log('  — a lock is set only to the key');
    for (const [lock, act] of [['mallory-key', 'move notes:ada to another key'], ['', 'open notes:ada']] as const) {
      const r = textOf((await ms.call({ block: 'notes:ada', new_lock: lock })).body);
      ok(`a signed call cannot ${act}`, /sets a lock only to the key itself/.test(r) && !r.includes(KEY), r);
    }
    await ms.call({ block: 'notes:ada', spindle: '2', content: 'still under ada\'s key' });
    ok('…so the block stays under the key, and the signed hand still writes it', /still under ada's key/.test(await raw('notes:ada', '2')));
    const byHand = textOf((await open.call({ block: 'notes:ada', secret: KEY, new_lock: 'ada-moved-by-hand' })).body);
    ok('the key in hand still moves the lock', !/sets a lock only|rejected|does not match/i.test(byHand), byHand);
    const lost = textOf((await ms.call({ block: 'notes:ada', spindle: '3', content: 'after the move' })).body);
    ok('…and after it the fingerprint no longer opens the block, which is why it never may', /does not match/.test(lost), lost);
  } finally {
    await stop(rtr);
    beach.kill('SIGTERM');
    rmSync(dir, { recursive: true, force: true });
  }
}

// ── Shared by parts 4 and 5: local beaches through the real handler, and a signed MCP session ──

const BEACH_SCRIPT = () => join(process.env.BEACH_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'pscale-beach'), 'scripts', 'local-beach.mjs');
const codeOf = (r: Response) => new URL(r.headers.get('location') ?? 'http://none/').searchParams.get('code') ?? '';
const problemOf = (html: string) => (html.match(/class="problem">([^<]*)/) ?? [])[1] ?? '';

/** A local beach through the real handler, open or a members' beach. A members' beach's wall goes
 *  up once its settings are latched, so what is founded before that is founded as the keeper would. */
async function localBeach(name: string, gated: boolean) {
  const port = 6000 + Math.floor(Math.random() * 2000);
  const B = `http://127.0.0.1:${port}`;
  const W = `${B}/.well-known/pscale-beach`;
  const dir = mkdtempSync(join(os.tmpdir(), `signin-${name}-`));
  const env = gated ? { ...process.env, BEACH_GATE: 'members', BEACH_GATE_SECRET: `smoke-signin-gate-${name}`, BEACH_KEEPERS: 'keeper' } : process.env;
  const proc = spawn('node', [BEACH_SCRIPT(), '--dir', dir, '--port', String(port), '--origin', `${name}.signin.test`], { stdio: ['ignore', 'ignore', 'inherit'], env });
  let up = false;
  for (let i = 0; i < 80 && !up; i++) {
    try { up = (await fetch(W)).status < 500; } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  const found = (block: string, content: unknown, key: string) => fetch(`${W}?block=${encodeURIComponent(block)}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ spindle: '', content, new_lock: key }) });
  /** A member's pass, proved as the beach asks: the passport's latch, no content. */
  const prove = async (handle: string, key: string): Promise<string | undefined> => {
    const j: any = await (await fetch(`${W}?block=passport:${handle}`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ block: `passport:${handle}`, secret: key }) })).json().catch(() => null);
    return typeof j?.pass === 'string' ? j.pass : undefined;
  };
  const raw = async (block: string, spindle?: string, pass?: string) => {
    const r = await fetch(`${W}?block=${encodeURIComponent(block)}${spindle ? `&spindle=${spindle}` : ''}`, { headers: pass ? { Authorization: `Bearer ${pass}` } : {} });
    return { status: r.status, text: await r.text() };
  };
  const close = () => { proc.kill('SIGTERM'); rmSync(dir, { recursive: true, force: true }); };
  return { B, here: `127.0.0.1:${port}`, up, found, prove, raw, close };
}

/** A session at a signed address with its instructions, its bsp() calls aimed at `beach`. */
async function mcpSession(c: ReturnType<typeof client>, url: string, beach: string, bearer?: string) {
  const r = await c.mcp(url, init(40), bearer);
  const sid = r.headers.get('mcp-session-id') ?? '';
  const first: any = r.status === 200 ? await r.json().catch(() => null) : null;
  await c.mcp(url, JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }), bearer, sid);
  let id = 41;
  const call = async (args: Record<string, unknown>) => {
    const res = await c.mcp(url, JSON.stringify({ jsonrpc: '2.0', id: id++, method: 'tools/call', params: { name: 'bsp', arguments: { agent_id: beach, ...args } } }), bearer, sid);
    return { status: res.status, body: res.status === 200 ? await res.json() : null };
  };
  return { status: r.status, instructions: String(first?.result?.instructions ?? ''), call };
}

// ── Part 4: a router whose own beach is a members' beach (the doors' battery, router 6) ──
// The key is hidden there as anywhere: the mint stands at the door with the typed key, and the token
// carries the key sealed, so a later call proves the pass before it reads the ring, even after the
// router has restarted and holds no pass and no opened key (proposals/2026-11-04-the-key-in-the-connector.md §12).

async function gatedBeach() {
  if (!existsSync(BEACH_SCRIPT())) { console.log(`\n=== a members' beach behind the router: skipped — no pscale-beach checkout (set BEACH_DIR) ===`); return; }
  console.log("\n=== a router whose own beach is a members' beach ===");
  const g = await localBeach('gated', true);
  const RP = 5000 + Math.floor(Math.random() * 900);
  const O = `http://127.0.0.1:${RP}`;
  const SECRET = 'smoke-signin-secret-' + 'z'.repeat(40);
  let rtr: ChildProcess | null = null;
  try {
    if (!g.up) { ok("the local members' beach starts", false); return; }
    const KEY = 'ada-behind-the-wall-key';
    ok("ada's passport, latched by her key", (await g.found('passport:ada', { _: 'ADA' }, KEY)).status === 200);
    ok('…and her journal', (await g.found('journal:ada', { _: "ada's journal" }, KEY)).status === 200);
    ok('settings latched: the wall is up', (await g.found('settings', { _: 'the beach settings' }, 'gate-operator-key')).status === 200);
    ok('a raw stranger is refused', (await g.raw('passport:ada')).status === 401);
    rtr = await start(RP, { BSP_SIGNIN_SECRET: SECRET, DEFAULT_BEACH: g.B });
    const me = client(O, 'ada', 'me');
    const cl = await me.register();
    const wrong = await me.signIn(cl.client_id, 'not-adas-key', 'my phone');
    const wrongPage = await wrong.text();
    ok('a wrong key mints nothing, and the page says it does not open the passport there',
      wrong.status === 400 && !wrong.headers.get('location') && wrongPage.includes(`That key does not open ada&#39;s passport at ${g.here}`), `${wrong.status} ${problemOf(wrongPage)}`);
    const signed = await me.signIn(cl.client_id, KEY, 'my phone');
    const code = codeOf(signed);
    ok('the right key mints a fingerprint behind the wall', signed.status === 302 && !!code, `${signed.status} ${problemOf(await signed.text())}`);
    const pass = await g.prove('ada', KEY);
    const ring = await g.raw('fingerprints:ada', undefined, pass);
    ok('…its ring founded there, naming the connection and holding the key only sealed', ring.status === 200 && /my phone/.test(ring.text) && !ring.text.includes(KEY), `${ring.status} ${ring.text.slice(0, 200)}`);
    ok('…and shown to no stranger', (await g.raw('fingerprints:ada')).status === 401);
    const t = await (await me.exchange(cl.client_id, code)).json();
    ok('the code gives a token and a refresh token', !!t.access_token && !!t.refresh_token, JSON.stringify(t));
    const s = await mcpSession(me, me.RES, g.B, t.access_token);
    ok('the token opens /me', s.status === 200);
    const w = await s.call({ block: 'journal:ada', spindle: '1', content: 'written behind the wall, no key in the call' });
    ok('a write with no secret lands behind the wall', /written behind the wall/.test((await g.raw('journal:ada', '1', pass)).text), textOf(w.body));

    console.log('  — the router restarts, holding no pass and no opened key');
    await stop(rtr);
    rtr = await start(RP, { BSP_SIGNIN_SECRET: SECRET, DEFAULT_BEACH: g.B });
    const s2 = await mcpSession(me, me.RES, g.B, t.access_token);
    ok('the same token opens /me again: the key it carries proves the pass, and the ring is read behind the wall', s2.status === 200);
    await s2.call({ block: 'journal:ada', spindle: '2', content: 'written after the restart' });
    ok('…and a write with no secret lands', /written after the restart/.test((await g.raw('journal:ada', '2', pass)).text));
    const fresh = await me.token({ grant_type: 'refresh_token', refresh_token: t.refresh_token });
    ok('a refresh gives a fresh pair', fresh.status === 200 && !!(await fresh.json()).access_token);

    console.log('  — the fingerprints page, behind the wall');
    const fp = await fetch(`${O}/fingerprints/ada`);
    const fpPage = await fp.text();
    ok('it asks for the key before it lists anything', fp.status === 200 && /members(&#39;|') beach/.test(fpPage) && />Show them</.test(fpPage) && !/my phone/.test(fpPage), fpPage.slice(0, 300));
    const postAt = (key: string, extra: Record<string, string>) => fetch(`${O}/fingerprints/ada`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form({ ...extra, key }) });
    const badShow = await postAt('not-adas-key', { show: '1' });
    const badShowPage = await badShow.text();
    ok('a wrong key is told so, and shown nothing', badShow.status === 400 && badShowPage.includes('does not open ada&#39;s passport') && !/my phone/.test(badShowPage), problemOf(badShowPage));
    const goodShow = await postAt(KEY, { show: '1' });
    ok('with the key, it lists the connection', goodShow.status === 200 && /my phone/.test(await goodShow.text()));
    const revoked = await postAt(KEY, { revoke: '1' });
    ok('…and revokes it', revoked.status === 200 && /Revoked: my phone/.test(await revoked.text()));
    ok('…whose session is signed out at once', (await s2.call({ block: 'journal:ada', spindle: '3', content: 'after revoking' })).status === 401);
    ok('…and whose refresh is refused', (await (await me.token({ grant_type: 'refresh_token', refresh_token: t.refresh_token })).json()).error === 'invalid_grant');
  } finally {
    await stop(rtr);
    g.close();
  }
}

// ── Part 5: a member of another beach (David at beach.bringingtheflavour.com, 6 November 2026) ──

async function otherBeach() {
  if (!existsSync(BEACH_SCRIPT())) { console.log('\n=== a member of another beach: skipped — no pscale-beach checkout (set BEACH_DIR) ==='); return; }
  console.log('\n=== a member of another beach ===');
  const d = await localBeach('home', false);
  const o = await localBeach('open', false);
  const g = await localBeach('salt', true);
  const RP = 5000 + Math.floor(Math.random() * 900);
  const O = `http://127.0.0.1:${RP}`;
  let rtr: ChildProcess | null = null;
  try {
    if (!d.up || !o.up || !g.up) { ok('the three local beaches start', false); return; }
    const ADA = 'ada-elsewhere-key', BOB = 'bob-behind-salt-key';
    ok("ada's passport and journal stand only at an open beach of her own",
      (await o.found('passport:ada', { _: 'ADA' }, ADA)).status === 200 && (await o.found('journal:ada', { _: "ada's journal" }, ADA)).status === 200);
    ok("bob's only behind a members' wall",
      (await g.found('passport:bob', { _: 'BOB' }, BOB)).status === 200 && (await g.found('journal:bob', { _: "bob's journal" }, BOB)).status === 200
      && (await g.found('settings', { _: 'the beach settings' }, 'gate-operator-key')).status === 200 && (await g.raw('passport:bob')).status === 401);
    rtr = await start(RP, { BSP_SIGNIN_SECRET: 'smoke-signin-secret-' + 'w'.repeat(40), DEFAULT_BEACH: d.B });

    const me = client(O, 'ada', 'me');
    const cl = await me.register();
    const page0 = await (await me.authorize(cl.client_id)).text();
    ok("the page fills in the router's own beach", page0.includes(`<input name="beach" value="${d.here}" required`));
    const home = await me.signIn(cl.client_id, ADA, 'my phone');
    const homePage = await home.text();
    ok("a handle that stands only elsewhere is told so at the router's own beach, and asked to name its beach",
      home.status === 400 && homePage.includes(`&quot;ada&quot; is not a handle on ${d.here}`) && /name that beach too/.test(homePage), problemOf(homePage));
    const nowhere = await me.signIn(cl.client_id, ADA, 'my phone', 'ada', 'http://127.0.0.1:9');
    ok('a beach that does not answer is said so, and nothing is minted', nowhere.status === 400 && /No beach answers at http:\/\/127\.0\.0\.1:9/.test(await nowhere.text()));
    const plain = await me.signIn(cl.client_id, ADA, 'my phone', 'ada', 'http://beach.example.com');
    ok('a beach named over plain http is refused: a key never travels in the clear', plain.status === 400 && /reached over https/.test(await plain.text()));
    const there = await me.signIn(cl.client_id, ADA, 'my phone', 'ada', o.B);
    const thereCode = codeOf(there);
    ok('named, her beach mints the fingerprint there', there.status === 302 && !!thereCode, problemOf(await there.text()));
    const ringA = await o.raw('fingerprints:ada');
    ok('…its ring at her beach, holding the key only sealed', /my phone/.test(ringA.text) && !ringA.text.includes(ADA), ringA.text.slice(0, 200));
    ok("…and none at the router's own", (await d.raw('fingerprints:ada')).status === 404);
    const ta = await (await me.exchange(cl.client_id, thereCode)).json();
    const sa = await mcpSession(me, me.RES, o.B, ta.access_token);
    ok("the session opens, its instructions naming the beach her blocks stand at", sa.status === 200 && sa.instructions.includes(`ada's passport and blocks stand at ${o.B}`), sa.instructions.slice(-500));
    const wa = await sa.call({ block: 'journal:ada', spindle: '1', content: 'written at her own beach' });
    ok('a write with no secret lands at her beach', /written at her own beach/.test((await o.raw('journal:ada', '1')).text), textOf(wa.body));
    const fpA = await (await fetch(`${O}/fingerprints/ada?beach=${encodeURIComponent(o.B)}`)).text();
    ok('the fingerprints page reads her ring at her beach when named', /my phone/.test(fpA) && fpA.includes(`Fingerprints for ada at ${o.here}`), fpA.slice(0, 300));

    const asBob = client(O, 'bob');
    const bcl = await asBob.register();
    const bobPage = await (await asBob.authorize(bcl.client_id)).text();
    ok("/as/bob, with no passport at the router's own beach, says so and asks for bob's beach", bobPage.includes(`There is no bob on ${d.here}`) && /<input name="beach" value="" required/.test(bobPage));
    const bobThere = await asBob.signIn(bcl.client_id, BOB, "bob's laptop", 'bob', g.B);
    const bobCode = codeOf(bobThere);
    ok("named, the members' beach mints behind its wall", bobThere.status === 302 && !!bobCode, problemOf(await bobThere.text()));
    const bpass = await g.prove('bob', BOB);
    ok("…its ring there, for bob's key alone", (await g.raw('fingerprints:bob')).status === 401 && /bob&#39;s laptop|bob's laptop/.test((await g.raw('fingerprints:bob', undefined, bpass)).text));
    const tb = await (await asBob.exchange(bcl.client_id, bobCode)).json();
    const sb = await mcpSession(asBob, asBob.RES, g.B, tb.access_token);
    ok("bob's session opens, its instructions naming the members' beach", sb.status === 200 && sb.instructions.includes(`bob's passport and blocks stand at ${g.B}`));
    const wb = await sb.call({ block: 'journal:bob', spindle: '1', content: 'written behind the salt wall' });
    ok('…and a write with no secret lands behind its wall', /written behind the salt wall/.test((await g.raw('journal:bob', '1', bpass)).text), textOf(wb.body));
  } finally {
    await stop(rtr);
    d.close(); o.close(); g.close();
  }
}

(async () => {
  await wrapper();
  await router();
  await realBeach();
  await gatedBeach();
  await otherBeach();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
