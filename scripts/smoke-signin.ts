/**
 * smoke-signin.ts — THE KEY IN THE CONNECTOR (src/signin.ts;
 * proposals/2026-11-04-the-key-in-the-connector.md).
 *
 * Part 1, in-process: every tool that takes a `secret` gets the signed key when the call
 * carries none; a call's own secret wins; the signed key never becomes a sealing key; a
 * signed session's hand is its handle unless the session already named one.
 *
 * Part 2, over HTTP: the router spawned as Railway runs it, with BSP_SIGNIN_SECRET, and the
 * whole sign-in walked as Claude walks it: the 401 and its pointer, both metadata
 * documents, registration, the page, the redirect, PKCE, the token, a signed session,
 * refresh, and every refusal. Then once more with no secret: sign-in is off, and the open
 * endpoint is untouched either way.
 *
 * Part 3, through the REAL beach handler (pscale-beach's scripts/local-beach.mjs on a
 * scratch folder, as smoke:pass runs it): a signed write with no secret lands under the
 * latch, the same write through the open endpoint is refused, the signed key never seals,
 * and another hand's latch refuses it. Skipped, and said so, where no pscale-beach
 * checkout stands beside this repository (CI).
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

let pass = 0, fail = 0;
function ok(label: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${label}`); } else { fail++; console.log(`  ✗ ${label}${detail ? ` — ${detail.slice(0, 300)}` : ''}`); }
}

// ── Part 1: the wrapper ──

async function wrapper() {
  console.log('=== the wrapper: the signed key where a call carries none ===');
  const tools: Record<string, (...a: any[]) => Promise<unknown>> = {};
  const stub: any = { tool: (...args: any[]) => { tools[args[0]] = args[args.length - 1]; } };
  installSignedIn(stub);
  let seen: any = null;
  stub.tool('takes', 'a tool with a secret', { secret: z.string().optional(), enc_secret: z.string().optional() }, {},
    async (p: any) => { seen = { secret: p.secret, seal: sealingKey(p.enc_secret, p.secret), note: signedSealNote() }; return 'ok'; });
  stub.tool('keyless', 'a tool with no secret', { block: z.string() }, {}, async (p: any) => { seen = { keys: Object.keys(p) }; return 'ok'; });
  stub.tool('bare', 'a tool with no parameters', async () => { seen = { bare: true }; return 'ok'; });
  const signed = (sessionId: string) => ({ sessionId, authInfo: { token: 't', clientId: 'c', scopes: ['bsp'], extra: { signedIn: { handle: 'ada', key: 'ADA-KEY' } } } });

  await tools.takes({}, signed('s1'));
  ok('a call with no secret gets the signed key', seen.secret === 'ADA-KEY', JSON.stringify(seen));
  ok('…and the signed key is never the sealing key', seen.seal === undefined);
  ok('…and a refused seal says why', /signed in/.test(seen.note));
  await tools.takes({ enc_secret: 'SEAL' }, signed('s1'));
  ok("a call's own enc_secret still seals", seen.seal === 'SEAL' && seen.secret === 'ADA-KEY');
  await tools.takes({ secret: 'OTHER' }, signed('s1'));
  ok("a call's own secret wins over the sign-in", seen.secret === 'OTHER');
  ok('…and seals as it always did', seen.seal === 'OTHER' && seen.note === '');
  await tools.takes({ secret: '' }, signed('s1'));
  ok('an empty secret counts as none', seen.secret === 'ADA-KEY');
  await tools.takes({ secret: 'X' }, { sessionId: 's2' });
  ok('an unsigned call is untouched, its secret sealing as before', seen.secret === 'X' && seen.seal === 'X');
  await tools.takes({}, { sessionId: 's2' });
  ok('an unsigned call with no secret stays without one', seen.secret === undefined && seen.seal === undefined);
  await tools.keyless({ block: 'b' }, signed('s3'));
  ok('a tool that takes no secret is given none', seen.keys.length === 1 && seen.keys[0] === 'block', JSON.stringify(seen));
  await tools.bare(signed('s4'));
  ok('a tool with no parameters still runs', seen.bare === true);
  ok("a signed session's hand is its handle", handOf('s1') === 'ada');
  declareHand('s5', 'bob');
  await tools.takes({}, signed('s5'));
  ok('a hand the session already named is kept', handOf('s5') === 'bob');
}

// ── Part 2: the router ──

const ACCEPT = 'application/json, text/event-stream';
const init = (id: number) => JSON.stringify({
  jsonrpc: '2.0', id, method: 'initialize',
  params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'smoke-signin', version: '0.0.0' } },
});
const b64url = (b: Buffer) => b.toString('base64url');
const form = (o: Record<string, string>) => new URLSearchParams(o).toString();

async function start(port: number, secret: string | null): Promise<ChildProcess> {
  const env: NodeJS.ProcessEnv = { ...process.env, PORT: String(port) };
  if (secret) env.BSP_SIGNIN_SECRET = secret; else delete env.BSP_SIGNIN_SECRET;
  const child = spawn('npx', ['tsx', 'src/index.ts'], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server did not start in 20s')), 20000);
    child.stdout!.on('data', (buf: Buffer) => { if (buf.toString().includes('running on')) { clearTimeout(timer); resolve(); } });
    child.on('exit', () => { clearTimeout(timer); reject(new Error('server exited early')); });
  });
  return child;
}

async function router() {
  const PORT = 3000 + Math.floor(Math.random() * 2000);
  const O = `http://127.0.0.1:${PORT}`;
  const RES = `${O}/mcp/v1/as/ada`;
  const CB = 'https://claude.ai/api/mcp/auth_callback';
  const child = await start(PORT, 'smoke-signin-secret-' + 'x'.repeat(40));
  try {
    console.log('\n=== the signed address answers 401, pointing at its metadata ===');
    const r401 = await fetch(RES, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: ACCEPT }, body: init(1) });
    const www = r401.headers.get('www-authenticate') ?? '';
    ok('no token → 401', r401.status === 401);
    ok('…with resource_metadata for this address', www.includes(`resource_metadata="${O}/.well-known/oauth-protected-resource/mcp/v1/as/ada"`), www);
    const pre = await fetch(`${O}/mcp/v1/as/ada`, { method: 'OPTIONS' });
    ok('CORS lets a browser client send Authorization', /authorization/i.test(pre.headers.get('access-control-allow-headers') ?? ''));

    console.log('\n=== the two metadata documents ===');
    const prm = await (await fetch(`${O}/.well-known/oauth-protected-resource/mcp/v1/as/ada`)).json();
    ok('the resource is the address as entered', prm.resource === RES, JSON.stringify(prm));
    ok('the authorization server is this router, first', prm.authorization_servers?.[0] === O);
    ok('the bare resource document names no handle → 404', (await fetch(`${O}/.well-known/oauth-protected-resource`)).status === 404);
    const asm = await (await fetch(`${O}/.well-known/oauth-authorization-server`)).json();
    ok('issuer, endpoints, S256, public clients', asm.issuer === O && asm.token_endpoint === `${O}/oauth/token`
      && asm.registration_endpoint === `${O}/oauth/register` && asm.code_challenge_methods_supported?.includes('S256')
      && asm.token_endpoint_auth_methods_supported?.includes('none'), JSON.stringify(asm));

    console.log('\n=== registration, stored nowhere ===');
    const reg = await fetch(`${O}/oauth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: 'Claude', redirect_uris: [CB, 'http://localhost/callback'] }) });
    const client = await reg.json();
    ok('a client registers → 201 with an id', reg.status === 201 && typeof client.client_id === 'string', JSON.stringify(client));
    const other = await (await fetch(`${O}/oauth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirect_uris: [CB] }) })).json();
    ok('a plain-http redirect elsewhere is refused', (await fetch(`${O}/oauth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirect_uris: ['http://evil.example/cb'] }) })).status === 400);

    console.log('\n=== the page ===');
    const verifier = b64url(randomBytes(32));
    const challenge = b64url(createHash('sha256').update(verifier).digest());
    const ask = (over: Record<string, string> = {}) => ({ response_type: 'code', client_id: client.client_id, redirect_uri: CB,
      code_challenge: challenge, code_challenge_method: 'S256', state: 'st1', scope: 'bsp', resource: RES, ...over });
    const authorize = (over: Record<string, string> = {}) => fetch(`${O}/oauth/authorize?${form(ask(over))}`, { redirect: 'manual' });
    const pg = await authorize();
    const html = await pg.text();
    ok('the page asks for the key of the handle the address fixes', pg.status === 200 && /as ada/.test(html) && /type="password"/.test(html) && /readonly/.test(html));
    ok('…names where it returns to', /Claude \(claude\.ai\)/.test(html));
    ok('…and cannot be framed', pg.headers.get('x-frame-options') === 'DENY' && /frame-ancestors 'none'/.test(pg.headers.get('content-security-policy') ?? ''));
    ok('an unregistered return address is a page, never a redirect', (await authorize({ redirect_uri: 'https://evil.example/cb' })).status === 400);
    ok('a forged client is a page', (await authorize({ client_id: 'forged' })).status === 400);
    const plain = await authorize({ code_challenge_method: 'plain' });
    ok('no S256 → back to the client with invalid_request', plain.status === 302
      && (plain.headers.get('location') ?? '').startsWith(`${CB}?error=invalid_request`) && /state=st1/.test(plain.headers.get('location') ?? ''));
    const foreign = await authorize({ resource: 'https://elsewhere.example/mcp/v1/as/ada' });
    ok('another server\'s resource → invalid_target', /error=invalid_target/.test(foreign.headers.get('location') ?? ''));
    const loop = await authorize({ redirect_uri: 'http://localhost:53123/callback' });
    ok("a loopback return matches on any port (Claude Code)", loop.status === 200 && /A program on this computer/.test(await loop.text()));

    console.log('\n=== the sign-in, PKCE, the token ===');
    const signin = await fetch(`${O}/oauth/authorize`, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form({ ...ask(), handle: 'mallory', key: 'ADA-KEY' }) });
    const back = new URL(signin.headers.get('location') ?? 'http://none/');
    const code = back.searchParams.get('code') ?? '';
    ok('signing in returns to the client with a code and its state', signin.status === 302 && back.origin + back.pathname === CB && !!code && back.searchParams.get('state') === 'st1');
    ok('the code carries nothing readable', !/ADA-KEY|ada/.test(code));
    const token = (body: Record<string, string>) => fetch(`${O}/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form(body) });
    const wrong = await token({ grant_type: 'authorization_code', code, redirect_uri: CB, client_id: client.client_id, code_verifier: b64url(randomBytes(32)) });
    ok('a wrong verifier → invalid_grant', wrong.status === 400 && (await wrong.json()).error === 'invalid_grant');
    const stolen = await token({ grant_type: 'authorization_code', code, redirect_uri: CB, client_id: other.client_id, code_verifier: verifier });
    ok("another client's id → invalid_grant", stolen.status === 400);
    const got = await token({ grant_type: 'authorization_code', code, redirect_uri: CB, client_id: client.client_id, code_verifier: verifier, resource: RES });
    const t = await got.json();
    ok('the right verifier → a bearer token and a refresh token', got.status === 200 && t.token_type === 'Bearer' && !!t.access_token && !!t.refresh_token && t.expires_in === 86400, JSON.stringify(t));
    ok('…neither readable', !JSON.stringify(t).includes('ADA-KEY'));
    ok('an unknown grant → unsupported_grant_type', (await (await token({ grant_type: 'password' })).json()).error === 'unsupported_grant_type');

    console.log('\n=== a signed session ===');
    const mcp = (url: string, body: string, bearer?: string, session?: string) => fetch(url, { method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: ACCEPT, ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), ...(session ? { 'mcp-session-id': session } : {}) }, body });
    const s = await mcp(RES, init(1), t.access_token);
    const sid = s.headers.get('mcp-session-id') ?? '';
    const sj = await s.json();
    ok('the token opens the signed address', s.status === 200 && !!sid);
    ok('…and the session is told it is signed in, so it never asks for the key', /THIS CONNECTION IS SIGNED IN AS ada/.test(sj?.result?.instructions ?? ''));
    await mcp(RES, JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }), t.access_token, sid);
    const call = await mcp(RES, JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'bsp', arguments: { agent_id: 'pscale', block: 'whetstone', spindle: '9' } } }), t.access_token, sid);
    const cj = await call.json();
    ok('a tool call goes through', call.status === 200 && /9/.test(cj?.result?.content?.[0]?.text ?? ''), JSON.stringify(cj).slice(0, 300));
    ok('a later request without the token → 401', (await mcp(RES, init(3), undefined, sid)).status === 401);
    ok("ada's token at bob's address → 401", (await mcp(`${O}/mcp/v1/as/bob`, init(4), t.access_token)).status === 401);
    ok('a refresh token is not a bearer → 401', (await mcp(RES, init(5), t.refresh_token)).status === 401);
    ok('a tampered token → 401', (await mcp(RES, init(6), t.access_token.slice(0, -4) + 'AAAA')).status === 401);

    console.log('\n=== refresh ===');
    const rr = await token({ grant_type: 'refresh_token', refresh_token: t.refresh_token, client_id: client.client_id });
    const t2 = await rr.json();
    ok('a refresh gives a fresh pair', rr.status === 200 && t2.access_token !== t.access_token && t2.refresh_token !== t.refresh_token);
    ok('…and the fresh token opens the address', (await mcp(RES, init(7), t2.access_token)).status === 200);
    ok('an access token is not a refresh token', (await token({ grant_type: 'refresh_token', refresh_token: t.access_token })).status === 400);

    await realBeach(O, RES, t2.access_token, mcp);

    console.log('\n=== the open endpoint, untouched ===');
    ok('/mcp/v1 initializes with no token', (await mcp(`${O}/mcp/v1`, init(8))).status === 200);
  } finally {
    child.kill('SIGTERM');
  }

  console.log('\n=== a router with no secret: sign-in is off ===');
  const P2 = PORT + 1;
  const O2 = `http://127.0.0.1:${P2}`;
  const off = await start(P2, null);
  try {
    ok('no metadata', (await fetch(`${O2}/.well-known/oauth-authorization-server`)).status === 404);
    ok('no signed address', (await fetch(`${O2}/mcp/v1/as/ada`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: ACCEPT }, body: init(1) })).status === 404);
    ok('the open endpoint still answers', (await fetch(`${O2}/mcp/v1`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: ACCEPT }, body: init(1) })).status === 200);
  } finally {
    off.kill('SIGTERM');
  }
}

// ── Part 3: through the real beach handler ──

type Mcp = (url: string, body: string, bearer?: string, session?: string) => Promise<Response>;
const textOf = (j: any) => String(j?.result?.content?.[0]?.text ?? j?.error?.message ?? JSON.stringify(j));

async function realBeach(O: string, RES: string, access: string, mcp: Mcp) {
  const BEACH_DIR = process.env.BEACH_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'pscale-beach');
  const script = join(BEACH_DIR, 'scripts', 'local-beach.mjs');
  if (!existsSync(script)) { console.log(`\n=== the real beach handler: skipped — no pscale-beach checkout at ${BEACH_DIR} (set BEACH_DIR) ===`); return; }
  console.log('\n=== through the real beach handler ===');
  const BP = 6000 + Math.floor(Math.random() * 2000);
  const B = `http://127.0.0.1:${BP}`;
  const W = `${B}/.well-known/pscale-beach`;
  const dir = mkdtempSync(join(os.tmpdir(), 'signin-'));
  const beach = spawn('node', [script, '--dir', dir, '--port', String(BP), '--origin', 'signin.test'], { stdio: ['ignore', 'ignore', 'inherit'] });
  try {
    let up = false;
    for (let i = 0; i < 80 && !up; i++) {
      try { up = (await fetch(W)).status < 500; } catch { await new Promise((r) => setTimeout(r, 250)); }
    }
    if (!up) { ok('the local beach starts', false); return; }
    const found = (block: string, key: string) => fetch(`${W}?block=${encodeURIComponent(block)}`, { method: 'POST',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ spindle: '', content: { _: `${block}, a fixture` }, new_lock: key }) });
    ok("ada's journal founded under her key", (await found('journal:ada', 'ADA-KEY')).status === 200);
    ok("bob's journal founded under his", (await found('journal:bob', 'BOB-KEY')).status === 200);

    const session = async (url: string, bearer?: string) => {
      const sid = (await mcp(url, init(20), bearer)).headers.get('mcp-session-id') ?? '';
      await mcp(url, JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }), bearer, sid);
      let id = 21;
      return async (args: Record<string, unknown>) => (await mcp(url, JSON.stringify({ jsonrpc: '2.0', id: id++, method: 'tools/call',
        params: { name: 'bsp', arguments: { agent_id: B, ...args } } }), bearer, sid)).json();
    };
    const signed = await session(RES, access);
    const w = await signed({ block: 'journal:ada', spindle: '1', content: 'written through the signed connector, no secret in the call' });
    const node = await (await fetch(`${W}?block=${encodeURIComponent('journal:ada')}&spindle=1`)).text();
    ok('a signed write with no secret lands under the latch', /written through the signed connector/.test(node), textOf(w));
    const open = await session(`${O}/mcp/v1`);
    const refused = await open({ block: 'journal:ada', spindle: '2', content: 'the same write, unsigned' });
    ok('the same write through the open endpoint is refused', /secret required/.test(textOf(refused)), textOf(refused));
    const gray = await signed({ block: 'journal:ada', spindle: '3', content: 'sealed?', gray: true });
    ok('the signed key never seals a line', /rejected/i.test(textOf(gray)) && /signed in/.test(textOf(gray)), textOf(gray));
    const foreign = await signed({ block: 'journal:bob', spindle: '1', content: 'not mine' });
    ok("another hand's latch refuses the signed key", /does not match/.test(textOf(foreign)), textOf(foreign));
  } finally {
    beach.kill('SIGTERM');
    rmSync(dir, { recursive: true, force: true });
  }
}

(async () => {
  await wrapper();
  await router();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
