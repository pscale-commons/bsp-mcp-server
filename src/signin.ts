/**
 * signin.ts — THE KEY IN THE CONNECTOR (proposals/2026-11-04-the-key-in-the-connector.md).
 *
 * A connection at /mcp/v1/as/<handle> is that handle, signed in. The first time a client
 * connects there (Claude on any surface: claude.ai, desktop, mobile, Claude Code, Cowork and
 * its routines) the router answers 401 and points at its own sign-in. The client registers,
 * the person types the handle's key on the router's own page, and the router seals the key
 * into the token it hands back. The client keeps the token and sends it on every call, and
 * every tool that takes a `secret` gets the key when the call carries none. No instruction,
 * prompt or window ever holds it.
 *
 * NOTHING IS STORED. A client's id is its redirect addresses, sealed; a code is the key and
 * the PKCE challenge, sealed for five minutes; a token is the key, sealed for a day; a refresh
 * token is the same for 180 days, issued fresh at every refresh. All are sealed under
 * BSP_SIGNIN_SECRET, so only this deployment opens them. Off unless the deploy carries that
 * secret (32 characters at least); /mcp/v1 is untouched either way.
 *
 * THE SIGNED KEY OPENS LATCHES AND NOTHING ELSE. `sealingKey` keeps it from becoming the key
 * that seals, opens or signs a line, so a run signed in this way writes and never opens the
 * vault (David, pool:weft 386: a scheduled run is kept from the vault and given only the
 * writes it needs).
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { declareHand, handOf } from './looks.js';

const SECRET = process.env.BSP_SIGNIN_SECRET ?? '';
/** Sign-in stands only on a deploy that carries its secret. */
export const SIGNIN_ON = SECRET.length >= 32;
const SEAL_KEY = createHash('sha256').update(`bsp-signin\u0000${SECRET}`).digest();

const CLIENT_MS = 10 * 365 * 24 * 60 * 60 * 1000;
const CODE_MS = 5 * 60 * 1000;
const ACCESS_MS = 24 * 60 * 60 * 1000;
const REFRESH_MS = 180 * 24 * 60 * 60 * 1000;
const SCOPE = 'bsp';
const HANDLE = /^[A-Za-z0-9_-]{1,64}$/;
const SERVER_METADATA = '/.well-known/oauth-authorization-server';
const RESOURCE_METADATA = '/.well-known/oauth-protected-resource';

// ── The seal ──

type Kind = 'client' | 'code' | 'access' | 'refresh';

function seal(kind: Kind, body: Record<string, unknown>, ms: number): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', SEAL_KEY, iv);
  const plain = Buffer.from(JSON.stringify({ ...body, t: kind, exp: Date.now() + ms }), 'utf8');
  const sealed = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), sealed]).toString('base64url');
}

/** What a sealed value holds, or null: another kind, expired, forged, or sealed elsewhere. */
function unseal(kind: Kind, value: unknown): Record<string, any> | null {
  if (!SIGNIN_ON || typeof value !== 'string' || value.length < 40 || value.length > 8192) return null;
  try {
    const raw = Buffer.from(value, 'base64url');
    const d = createDecipheriv('aes-256-gcm', SEAL_KEY, raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    const body = JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8'));
    if (!body || body.t !== kind || typeof body.exp !== 'number' || body.exp < Date.now()) return null;
    return body;
  } catch {
    return null;
  }
}

const digest = (s: string) => createHash('sha256').update(s).digest('base64url');
function sameText(a: string, b: unknown): boolean {
  if (typeof b !== 'string') return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// ── Addresses ──

/** The origin the client reached, as the platform's edge reports it. */
export function originOf(req: IncomingMessage): string {
  const first = (h: string | string[] | undefined) => String((Array.isArray(h) ? h[0] : h) ?? '').split(',')[0].trim();
  let host = first(req.headers['x-forwarded-host']) || first(req.headers.host);
  if (!/^[A-Za-z0-9.-]+(:\d{1,5})?$/.test(host)) host = 'localhost';
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const proto = first(req.headers['x-forwarded-proto']) || (local ? 'http' : 'https');
  return `${proto === 'http' ? 'http' : 'https'}://${host}`;
}

/** The handle a path names under <mcp path>/as/, or null. */
export function asHandle(pathname: string, mcpPath: string): string | null {
  const prefix = `${mcpPath}/as/`;
  if (!pathname.startsWith(prefix)) return null;
  const h = pathname.slice(prefix.length);
  return HANDLE.test(h) ? h : null;
}

function loopback(u: URL): boolean {
  return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '[::1]');
}
/** A redirect a client may register: https anywhere, or a loopback for a client on the person's machine. */
function registrable(uri: unknown): uri is string {
  if (typeof uri !== 'string' || uri.length > 512) return false;
  try {
    const u = new URL(uri);
    return !u.hash && (u.protocol === 'https:' || loopback(u));
  } catch {
    return false;
  }
}
/** RFC 8252: a loopback redirect matches whatever port the native client opened. */
function redirectMatches(registered: unknown, asked: string): boolean {
  if (!Array.isArray(registered)) return false;
  let a: URL;
  try { a = new URL(asked); } catch { return false; }
  return registered.some((r) => {
    if (r === asked) return true;
    try {
      const u = new URL(String(r));
      return loopback(u) && loopback(a) && u.hostname === a.hostname && u.pathname === a.pathname && u.search === a.search;
    } catch {
      return false;
    }
  });
}
function withParams(base: string, params: Record<string, string | undefined>): string {
  const u = new URL(base);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) u.searchParams.set(k, v);
  return u.toString();
}

// ── Replies ──

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): true {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
  return true;
}
function redirect(res: ServerResponse, to: string): true {
  res.writeHead(302, { Location: to, 'Cache-Control': 'no-store' });
  res.end();
  return true;
}
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
function page(res: ServerResponse, status: number, body: string): true {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  });
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sign in to the beach</title><style>
:root{color-scheme:light dark;--ink:#1d2a33;--soft:#5b6b75;--line:#c9d6dc;--sea:#2f6f86;--on-sea:#fff;--bg:#f4f8f9}
@media (prefers-color-scheme:dark){:root{--ink:#e3eef2;--soft:#9fb2bb;--line:#33454e;--sea:#6fb3c9;--on-sea:#10181c;--bg:#10181c}}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,sans-serif}
main{max-width:30rem;margin:0 auto;padding:2.5rem 1rem}h1{font-size:1.4rem;margin:0 0 1rem}
label{display:block;margin:1rem 0;font-weight:600}input{display:block;box-sizing:border-box;width:100%;margin-top:.35rem;padding:.7rem;font:inherit;border:1px solid var(--line);border-radius:.5rem;background:transparent;color:inherit}
input[readonly]{color:var(--soft)}button{margin-top:.5rem;padding:.75rem 1.4rem;font:inherit;font-weight:600;border:0;border-radius:.5rem;background:var(--sea);color:var(--on-sea)}
.small{color:var(--soft);font-size:.9rem}.problem{color:#b3412e;font-weight:600}
</style></head><body><main>${body}</main></body></html>`);
  return true;
}

// ── The authorization request ──

const ASK_KEYS = ['response_type', 'client_id', 'redirect_uri', 'code_challenge', 'code_challenge_method', 'state', 'scope', 'resource'] as const;
type Ask = Partial<Record<(typeof ASK_KEYS)[number], string>>;
const readAsk = (src: Record<string, string>): Ask =>
  Object.fromEntries(ASK_KEYS.filter((k) => typeof src[k] === 'string').map((k) => [k, src[k]])) as Ask;

/** A fault the client cannot be sent back for is a page; one it can is a redirect carrying the
 *  error, as OAuth asks; a sound request names the handle its resource fixes, if it fixes one. */
function checkAsk(ask: Ask, origin: string, mcpPath: string): { problem: string } | { back: string } | { handle: string | null } {
  const client = unseal('client', ask.client_id);
  if (!client) return { problem: 'This sign-in did not come from a client this router registered. Start again from the connector in your client.' };
  if (!ask.redirect_uri || !redirectMatches(client.r, ask.redirect_uri)) return { problem: 'The address this sign-in would return to is not one its client registered.' };
  const fail = (error: string, error_description: string) => ({ back: withParams(ask.redirect_uri!, { error, error_description, state: ask.state }) });
  if (ask.response_type !== 'code') return fail('unsupported_response_type', 'only response_type=code');
  if (!ask.code_challenge || ask.code_challenge_method !== 'S256') return fail('invalid_request', 'S256 PKCE is required');
  if (!ask.resource) return { handle: null };
  const handle = ask.resource.startsWith(`${origin}${mcpPath}/as/`) ? asHandle(ask.resource.slice(origin.length), mcpPath) : null;
  return handle ? { handle } : fail('invalid_target', 'the resource is not an address of this router');
}

function backTo(redirectUri: string): string {
  try {
    const u = new URL(redirectUri);
    if (loopback(u)) return 'A program on this computer (Claude Code, or another client)';
    return /(^|\.)claude\.(ai|com)$/.test(u.hostname) ? `Claude (${u.hostname})` : u.hostname;
  } catch {
    return 'A client';
  }
}

function signinPage(ask: Ask, handle: string | null, problem = ''): string {
  const hidden = ASK_KEYS.filter((k) => ask[k] !== undefined).map((k) => `<input type="hidden" name="${k}" value="${esc(ask[k]!)}">`).join('');
  const as = handle ? `<b>${esc(handle)}</b>` : 'you';
  return `<h1>Sign in to the beach${handle ? ` as ${esc(handle)}` : ''}</h1>
<p>${esc(backTo(ask.redirect_uri ?? ''))} is asking to write on the beach as ${as}. Type the key here, on the router's own page, and never in a chat.</p>
${problem ? `<p class="problem">${esc(problem)}</p>` : ''}
<form method="post" action="/oauth/authorize">${hidden}
<label>Handle<input name="handle" ${handle ? `value="${esc(handle)}" readonly` : 'required'} autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"></label>
<label>Key<input name="key" type="password" required autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false"></label>
<button type="submit">Sign in</button>
</form>
<p class="small">Nothing is stored. The key is sealed into the sign-in this page hands back, which only this router can open. From then on every call through that connector writes with it, and no conversation ever sees it. It writes and does nothing else: sealed lines stay shut.</p>
<p class="small">To undo it, disconnect the connector, or change the key. The key is not checked here: if it is mistyped, writes will be refused, and connecting again puts it right.</p>`;
}

// ── The routes ──

function tokens(h: string, k: string, res: string | null) {
  return {
    access_token: seal('access', { h, k, res }, ACCESS_MS),
    token_type: 'Bearer',
    expires_in: Math.floor(ACCESS_MS / 1000),
    refresh_token: seal('refresh', { h, k, res }, REFRESH_MS),
    scope: SCOPE,
  };
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let n = 0;
  for await (const chunk of req) {
    const b = typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer);
    n += b.length;
    if (n > 32_768) throw new Error('request body too large');
    chunks.push(b);
  }
  return Buffer.concat(chunks).toString('utf8');
}
function fields(raw: string, type: string | undefined): Record<string, string> {
  if (/json/i.test(type ?? '')) {
    try {
      const j = JSON.parse(raw);
      return j && typeof j === 'object' ? (Object.fromEntries(Object.entries(j).filter(([, v]) => typeof v === 'string')) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

/** The sign-in's own addresses: true when this request was one of them, and answered. */
export async function signinRoute(req: IncomingMessage, res: ServerResponse, url: URL, mcpPath: string): Promise<boolean> {
  const p = url.pathname;
  if (p !== SERVER_METADATA && !p.startsWith(RESOURCE_METADATA) && !p.startsWith('/oauth/')) return false;
  if (!SIGNIN_ON) return send(res, 404, { error: 'not_found', error_description: 'this router has no sign-in' });
  const origin = originOf(req);
  try {
    if (p === SERVER_METADATA && req.method === 'GET') {
      return send(res, 200, {
        issuer: origin,
        authorization_endpoint: `${origin}/oauth/authorize`,
        token_endpoint: `${origin}/oauth/token`,
        registration_endpoint: `${origin}/oauth/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none'],
        scopes_supported: [SCOPE],
      }, { 'Cache-Control': 'max-age=3600' });
    }
    if (p.startsWith(RESOURCE_METADATA) && req.method === 'GET') {
      const handle = asHandle(p.slice(RESOURCE_METADATA.length), mcpPath);
      if (!handle) return send(res, 404, { error: 'not_found', error_description: `a signed address is ${mcpPath}/as/<handle>` });
      return send(res, 200, {
        resource: `${origin}${mcpPath}/as/${handle}`,
        authorization_servers: [origin],
        scopes_supported: [SCOPE],
        bearer_methods_supported: ['header'],
        resource_name: `the beach, as ${handle}`,
      }, { 'Cache-Control': 'max-age=3600' });
    }
    if (p === '/oauth/register' && req.method === 'POST') {
      let j: any = null;
      try { j = JSON.parse(await readBody(req)); } catch { /* answered below */ }
      const uris = Array.isArray(j?.redirect_uris) ? j.redirect_uris : null;
      if (!uris || uris.length === 0 || uris.length > 8 || !uris.every(registrable)) {
        return send(res, 400, { error: 'invalid_redirect_uri', error_description: 'redirect_uris: https addresses, or a loopback for a client on the person\'s machine' });
      }
      const client_name = typeof j.client_name === 'string' ? j.client_name.slice(0, 100) : undefined;
      return send(res, 201, {
        client_id: seal('client', { r: uris }, CLIENT_MS),
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_name,
        redirect_uris: uris,
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        scope: SCOPE,
      });
    }
    if (p === '/oauth/authorize' && (req.method === 'GET' || req.method === 'POST')) {
      const posted = req.method === 'POST' ? fields(await readBody(req), req.headers['content-type']) : null;
      const ask = readAsk(posted ?? Object.fromEntries(url.searchParams));
      const checked = checkAsk(ask, origin, mcpPath);
      if ('problem' in checked) return page(res, 400, `<h1>This sign-in cannot go on</h1><p>${esc(checked.problem)}</p>`);
      if ('back' in checked) return redirect(res, checked.back);
      if (!posted) return page(res, 200, signinPage(ask, checked.handle));
      const handle = checked.handle ?? (posted.handle ?? '').trim();
      if (!HANDLE.test(handle)) return page(res, 400, signinPage(ask, checked.handle, 'A handle is letters, digits, - and _ only.'));
      const key = posted.key ?? '';
      if (!key || key.length > 512) return page(res, 400, signinPage(ask, checked.handle, 'Type the key.'));
      const code = seal('code', { h: handle, k: key, c: digest(ask.client_id!), r: ask.redirect_uri, x: ask.code_challenge, res: ask.resource ?? null }, CODE_MS);
      return redirect(res, withParams(ask.redirect_uri!, { code, state: ask.state }));
    }
    if (p === '/oauth/token' && req.method === 'POST') {
      const f = fields(await readBody(req), req.headers['content-type']);
      const deny = (error: string, error_description: string) => send(res, 400, { error, error_description });
      if (f.grant_type === 'authorization_code') {
        const code = unseal('code', f.code);
        if (!code) return deny('invalid_grant', 'the code is unknown or expired');
        if (f.redirect_uri !== code.r) return deny('invalid_grant', 'redirect_uri does not match the authorization request');
        if (f.client_id && digest(f.client_id) !== code.c) return deny('invalid_grant', 'the code was issued to another client');
        if (!f.code_verifier || !sameText(digest(f.code_verifier), code.x)) return deny('invalid_grant', 'PKCE verification failed');
        if (f.resource && code.res && f.resource !== code.res) return deny('invalid_target', 'the resource does not match the authorization request');
        return send(res, 200, tokens(code.h, code.k, code.res));
      }
      if (f.grant_type === 'refresh_token') {
        const r = unseal('refresh', f.refresh_token);
        if (!r) return deny('invalid_grant', 'the refresh token is unknown or expired');
        if (f.resource && r.res && f.resource !== r.res) return deny('invalid_target', 'the resource does not match the sign-in');
        return send(res, 200, tokens(r.h, r.k, r.res));
      }
      return deny('unsupported_grant_type', 'authorization_code or refresh_token');
    }
    return send(res, 405, { error: 'invalid_request', error_description: `${req.method} ${p} is not a sign-in address` });
  } catch (e: any) {
    return send(res, 400, { error: 'invalid_request', error_description: String(e?.message ?? e) });
  }
}

// ── The signed address ──

/** Who a request at <mcp path>/as/<handle> is signed in as, for the transport to hand every
 *  tool call; null for no token, a forged, expired or refresh one, or one for another address. */
export function authFor(req: IncomingMessage, handle: string, resource: string): AuthInfo | null {
  const m = String(req.headers.authorization ?? '').match(/^Bearer\s+(\S+)$/i);
  const a = m ? unseal('access', m[1]) : null;
  if (!a || a.h !== handle || (a.res && a.res !== resource)) return null;
  return { token: m![1], clientId: 'bsp-signin', scopes: [SCOPE], expiresAt: Math.floor(a.exp / 1000), extra: { signedIn: { handle: a.h, key: a.k } } };
}

/** The 401 that starts a client's sign-in, pointing at the address's own metadata. */
export function refuseUnsigned(res: ServerResponse, origin: string, mcpPath: string, handle: string): void {
  send(res, 401, {
    error: 'invalid_token',
    error_description: `${origin}${mcpPath}/as/${handle} is the beach as ${handle}: sign in once through your client's connector, and every call carries the key from then on`,
  }, { 'WWW-Authenticate': `Bearer resource_metadata="${origin}${RESOURCE_METADATA}${mcpPath}/as/${handle}", scope="${SCOPE}"` });
}

/** The line a signed session's instructions carry, so the model never asks for the key. */
export function signedLine(handle: string): string {
  return `THIS CONNECTION IS SIGNED IN AS ${handle}. The person signed in once on this router's own page, and every call that carries no secret writes with ${handle}'s key, which never enters this window: do not ask the person for it, and do not look for it. It opens latches and nothing else. Sealing or opening a gray line, the vault among them, still needs enc_secret in the call.`;
}

// ── The tools ──

const fromSignIn = new AsyncLocalStorage<true>();

/** The key that seals, opens or signs for this call: its enc_secret, else its secret, unless
 *  that secret came from the sign-in, which opens latches and nothing else. */
export function sealingKey(encSecret: string | undefined, secret: string | undefined): string | undefined {
  return encSecret ?? (fromSignIn.getStore() ? undefined : secret);
}

/** Said where a seal is refused, when the refusal is the sign-in's rule and not a missing key. */
export function signedSealNote(): string {
  return fromSignIn.getStore() ? ' This connection is signed in, and its key opens latches only: pass enc_secret to seal or open.' : '';
}

function isZodShape(a: unknown): a is Record<string, unknown> {
  return !!a && typeof a === 'object' && !Array.isArray(a)
    && Object.values(a as object).some((v) => !!v && typeof v === 'object' && 'safeParse' in (v as object));
}

/**
 * Every tool that takes a `secret` gets the signed key when the call carries none, and a signed
 * session's hand is its handle wherever a hand is asked for (the reflection; a members' beach,
 * whose pass is proved with the signed key). Installed innermost, beside the error and clock
 * wrappers in server.ts, so it reaches every tool that exists and every tool added later.
 */
export function installSignedIn(server: McpServer): void {
  const orig = server.tool.bind(server);
  (server as any).tool = (...args: any[]) => {
    const handler = args[args.length - 1];
    if (typeof handler !== 'function') return (orig as any)(...args);
    const shape = args.slice(1, -1).find(isZodShape);
    const takesSecret = !!shape && 'secret' in shape;
    args[args.length - 1] = async (...h: any[]) => {
      const extra = h[h.length - 1];
      const who = extra?.authInfo?.extra?.signedIn as { handle: string; key: string } | undefined;
      if (!who) return handler(...h);
      if (extra?.sessionId && !handOf(extra.sessionId)) declareHand(extra.sessionId, who.handle);
      const params = h.length > 1 ? h[0] : undefined;
      if (!takesSecret || !params || (typeof params.secret === 'string' && params.secret !== '')) return handler(...h);
      return fromSignIn.run(true, () => handler({ ...params, secret: who.key }, ...h.slice(1)));
    };
    return (orig as any)(...args);
  };
}
