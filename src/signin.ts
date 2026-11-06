/**
 * signin.ts — THE KEY IN THE CONNECTOR, BY FINGERPRINT (proposals/2026-11-04-the-key-in-the-connector.md).
 *
 * A connection at /mcp/v1/me is a handle, signed in with a FINGERPRINT. The first time a client
 * connects there (Claude on any surface: claude.ai, desktop, mobile, Claude Code, Cowork and its
 * routines) the router answers 401 and points at its own sign-in page. There the person types a
 * handle and its key once, and names the connection. /mcp/v1/as/<handle> is the same with the
 * handle fixed in the path: the address for a second identity on one client account, which adds
 * any one address only once (David as himself at /me, weft beside him at /as/weft). The router mints a fingerprint
 * (32 random bytes), seals the key to it, and keeps the sealed copy on the beach at
 * fingerprints:<handle>, one digit per fingerprint. The client is handed a token that carries
 * the fingerprint and never the key.
 *
 * On every call the router opens the fingerprint's copy and has the key for that call: every tool
 * that takes a `secret` gets it where a call carries none, `enc_secret: "vault"` seals and opens
 * with it (the vault among the lines it opens), and nothing the router returns ever contains it.
 * The key stays stable. Fingerprints come and go: revoking one, on the router's own page with
 * the key, empties its digit, and its connector is signed out. What a connection does with the
 * key can therefore be undone by its holder, and the one act that could not is refused: a lock
 * is set only to the key itself (`new_lock: "vault"`), never moved to another key or opened. A
 * fingerprint is minted only for a handle whose passport stands on the beach.
 *
 * THE PAGE SAYS WHAT IT IS (David, 5 November 2026: "There is no sign in process for the beach. It is
 * just a way to make it convenient and safer so that the LLM doesn't see the passphrase"): the person
 * meets "Hide your key from your AI" and presses "Hide my key"; OAuth's words stay inside the protocol.
 *
 * THE BEACH IS THE HOLDER'S (David, 6 November 2026: "I need to have the target beach where I am,
 * where my shell is in the BSP connector"; the shape drawn at proposals/2026-11-05-the-doors-fixes-
 * router.md §6, and its amendment in proposals/2026-11-04-the-key-in-the-connector.md §12): the page
 * asks which beach the handle's passport stands at, the router's own unless the person names
 * another, and the fingerprint is minted THERE: the passport read there, the ring founded there under
 * the key. The token carries that beach, so every later call opens the ring where it stands. At a
 * members' beach the mint stands at the door with the typed key, and the token carries the key too,
 * sealed with the rest of it, so a later call proves the pass the wall asks for before it reads the
 * ring. Nothing a members' beach shows a stranger changes: the ring stays behind its wall.
 *
 * NOTHING SECRET IS STORED IN THE CLEAR. A client's id is its redirect addresses, sealed; a code
 * is the fingerprint and the PKCE challenge, sealed for five minutes; a token is the fingerprint,
 * sealed for a day; a refresh token is the same for 180 days. All are sealed under
 * BSP_SIGNIN_SECRET, so only this deployment opens them. The key stands at fingerprints:<handle>,
 * sealed to each fingerprint, and, for a connection at a members' beach, inside its code and tokens
 * under the same seal: a token and the router's secret together open it, as they open the ring.
 * An opened key is held in memory for a minute and forgotten with the process. Off unless the
 * deploy carries BSP_SIGNIN_SECRET (32 characters at least); /mcp/v1 is untouched either way.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import nacl from 'tweetnacl';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { DEFAULT_BEACH, canonicaliseOrigin, loadBlock, resolveFederationOrigin, saveBlock } from './db.js';
import { declareHand, handOf } from './looks.js';
import { atTheDoor, forgetPass, isDoorRefusal, type Door } from './pass.js';
import { deriveLatch } from './keys.js';

const SECRET = process.env.BSP_SIGNIN_SECRET ?? '';
/** Sign-in stands only on a deploy that carries its secret. */
export const SIGNIN_ON = SECRET.length >= 32;
const SEAL_KEY = createHash('sha256').update(`bsp-signin\u0000${SECRET}`).digest();

const CLIENT_MS = 10 * 365 * 24 * 60 * 60 * 1000;
const CODE_MS = 5 * 60 * 1000;
const ACCESS_MS = 24 * 60 * 60 * 1000;
const REFRESH_MS = 180 * 24 * 60 * 60 * 1000;
const OPENED_MS = 60 * 1000;
const SCOPE = 'bsp';
const HANDLE = /^[A-Za-z0-9_-]{1,64}$/;
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const SERVER_METADATA = '/.well-known/oauth-authorization-server';
const RESOURCE_METADATA = '/.well-known/oauth-protected-resource';
const FINGERPRINTS_PAGE = '/fingerprints/';

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

// ── The fingerprints ──
//
// fingerprints:<handle>, one digit per fingerprint, nine at most:
//   { _: name, 1: the key sealed to the fingerprint, 2: its nonce, 3: the sealer's one-off
//     public key, 4: the fingerprint's public key, 5: when it was minted }
// A fingerprint is 32 random bytes; its box key pair derives from it by sha256, which needs no
// stretching because nothing about it is guessable. Only the router ever holds one in the clear.

const RING = (handle: string) => `fingerprints:${handle}`;
const b64 = (u: Uint8Array) => Buffer.from(u).toString('base64');
const unb64 = (s: string) => new Uint8Array(Buffer.from(s, 'base64'));

function ringLaw(handle: string): string {
  return `fingerprints:${handle} — the fingerprints that act for ${handle} through the bsp connector, one at each digit: its name at the underscore; ${handle}'s key sealed to it at 1, with the nonce at 2 and the sealer's one-off public key at 3; the fingerprint's public key at 4; when it was minted at 5. Only the router that minted a fingerprint can open its digit, and only for a connector signed in with it, so no model and no reader of this block ever sees the key. Minted and revoked on that router's own pages with ${handle}'s key, which latches this block; an empty digit is a fingerprint revoked.`;
}

function fingerprintPair(fingerprint: string) {
  const seed = createHash('sha256').update('bsp-fingerprint\u0000').update(Buffer.from(fingerprint, 'base64url')).digest();
  return nacl.box.keyPair.fromSecretKey(new Uint8Array(seed));
}

function isSealedEntry(n: any): boolean {
  return !!n && typeof n === 'object' && ['1', '2', '3', '4'].every((k) => typeof n[k] === 'string');
}

function sealKeyTo(key: string, name: string, publicKey: Uint8Array) {
  const eph = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const sealed = nacl.box(new TextEncoder().encode(key), nonce, publicKey, eph.secretKey);
  return { _: name, '1': b64(sealed), '2': b64(nonce), '3': b64(eph.publicKey), '4': b64(publicKey), '5': new Date().toISOString() };
}

/** The key a fingerprint's digit holds, opened with the fingerprint, or null. */
function openKey(entry: any, fingerprint: string): string | null {
  if (!isSealedEntry(entry)) return null;
  const pair = fingerprintPair(fingerprint);
  if (entry['4'] !== b64(pair.publicKey)) return null;
  try {
    const plain = nacl.box.open(unb64(entry['1']), unb64(entry['2']), unb64(entry['3']), pair.secretKey);
    return plain ? new TextDecoder().decode(plain) : null;
  } catch {
    return null;
  }
}

/** The ring at `beach`, or null when none stands. Throws when the beach does not answer, which is
 *  never read as a ring gone (a fingerprint is revoked only by its digit emptying); at a members'
 *  beach it is read through the door the caller stands at, which proves the pass with the key. */
async function readRing(handle: string, beach: string): Promise<Record<string, any> | null> {
  if (!(await resolveFederationOrigin(beach))) throw new Error(`no beach answered at ${beach}`);
  const row = await loadBlock(beach, RING(handle));
  return row?.block && typeof row.block === 'object' ? (row.block as Record<string, any>) : null;
}

/** A fingerprint acts for a handle that stands on its beach, and a handle stands by its passport.
 *  Founding the ring is bound to the passport's key, so where no passport stands any key would
 *  found it, and the connection would sign in as a name nobody holds ("me", typed at /me). */
async function passportStands(handle: string, beach: string): Promise<boolean> {
  if (!(await resolveFederationOrigin(beach))) throw new Error(`no beach answered at ${beach}`);
  const row = await loadBlock(beach, `passport:${handle}`);
  return !!row?.block && typeof row.block === 'object';
}

/** A beach as a person reads it on the page: its host, and the /w/<table> path a table carries. */
const shown = (beach: string) => beach.replace(/^https?:\/\//, '').replace(/\/+$/, '');
/** The beach this router keeps its rings at unless the person names another. */
const HERE = shown(DEFAULT_BEACH);
const isHome = (beach: string) => canonicaliseOrigin(beach) === canonicaliseOrigin(DEFAULT_BEACH);
const LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\])$/;

/** The beach a person names on the page or in the fingerprints page's address, as the origin it
 *  answers at: the router's own where they name none. A bare host is read as https (a key never
 *  travels in the clear, so http is taken for a beach on the router's own machine alone), and a
 *  bare domain finds its beach.<host> as every agent_id does. Null where it is no address, or no
 *  beach answers there. */
async function beachNamed(typed: unknown): Promise<string | null> {
  const t = String(typeof typed === 'string' ? typed : '').trim().replace(/\/+$/, '');
  if (t === '' || t.toLowerCase() === HERE.toLowerCase()) return DEFAULT_BEACH;
  let at: string;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`);
    if (u.protocol !== 'https:' && !(u.protocol === 'http:' && LOOPBACK.test(u.hostname))) return null;
    at = canonicaliseOrigin(u.toString());
  } catch {
    return null;
  }
  if (isHome(at)) return DEFAULT_BEACH;
  const origin = await resolveFederationOrigin(at);
  return origin && isHome(origin) ? DEFAULT_BEACH : origin;
}

/** A beach as the fingerprints page's address names it: its host, where it is reached over https. */
const beachParam = (beach: string) => (/^https:\/\//i.test(beach) ? shown(beach) : beach.replace(/\/+$/, ''));
/** The fingerprints page for a handle at its beach. */
const fingerprintsAt = (handle: string, beach: string) =>
  `${FINGERPRINTS_PAGE}${handle}${isHome(beach) ? '' : `?beach=${encodeURIComponent(beachParam(beach))}`}`;

/** The door a connection's own reads and writes at its ring stand at: its handle, its key where
 *  the moment has one, and a session of its own, so a pass a members' beach gives for that key is
 *  kept for this connection alone (src/pass.ts), as a tool call's is kept for its session. */
const ringDoor = (handle: string, fingerprint: string, key?: string): Door =>
  ({ session: `fingerprint:${digest(fingerprint).slice(0, 22)}`, handles: [handle], secret: key });

/** Why no ring or passport came back. A members' beach answers a router outside its door with its
 *  wall, which is not silence; a proof it refused is told by what it said. */
function unanswered(e: unknown, handle: string, beach: string, door?: Door): string {
  if (!isDoorRefusal(e)) return `The beach did not answer at ${shown(beach)}. Try again in a moment.`;
  if (door?.refusedWith === 404) return `"${handle}" is not a handle on ${shown(beach)}: no passport:${handle} stands there.`;
  if (door?.refusedWith === 429) return `Too many wrong keys this hour at ${shown(beach)}. Try again when the hour turns.`;
  if (door?.refusedWith === 403) return `That key does not open ${handle}'s passport at ${shown(beach)}.`;
  return `${shown(beach)} is a members' beach, and it shows ${handle}'s fingerprints only to the holder of ${handle}'s key. Type it here.`;
}

/** What a refused write at the ring says to the person at the page. */
function refusalFor(e: unknown, handle: string): string {
  const m = String((e as any)?.message ?? e);
  if (/wrong keys this hour|cap_wrong_keys/.test(m)) return 'Too many wrong keys this hour. Try again when the hour turns.';
  if (/does not match|whose passport is locked|lock rotation requires|secret required|lock_required|handle_bound/.test(m)) return `That key does not open ${handle}'s blocks.`;
  return `The beach did not take it (${m.slice(0, 160)}). Nothing was changed.`;
}

/** Mint a fingerprint for `handle` under its key at `beach`: the key is proved by the write itself,
 *  since the ring is latched by it (and founding the ring is bound to the passport's key). At a
 *  members' beach every read and write stands at the door with the typed key, and `gated` says so,
 *  for the token to carry the key the next pass is proved with. */
async function mint(handle: string, key: string, name: string, beach: string): Promise<{ fingerprint: string; digit: string; gated: boolean } | { problem: string }> {
  const fingerprint = randomBytes(32).toString('base64url');
  const door = ringDoor(handle, fingerprint, key);
  return atTheDoor(door, async () => {
    let ring: Record<string, any> | null;
    let stands: boolean;
    try { ring = await readRing(handle, beach); stands = await passportStands(handle, beach); } catch (e) { return { problem: unanswered(e, handle, beach, door) }; }
    if (!stands) {
      const elsewhere = isHome(beach) ? ' If your blocks stand on another beach, name that beach too.' : '';
      return { problem: `"${handle}" is not a handle on ${shown(beach)}: no passport:${handle} stands there. Type the handle your blocks are under there.${elsewhere}` };
    }
    const digit = DIGITS.find((d) => !isSealedEntry(ring?.[d]));
    if (!digit) return { problem: `Nine fingerprints already act for ${handle}. Revoke one first, at ${fingerprintsAt(handle, beach)}.` };
    const next = { ...(ring ?? {}), _: typeof ring?._ === 'string' ? ring._ : ringLaw(handle), [digit]: sealKeyTo(key, name, fingerprintPair(fingerprint).publicKey) };
    try {
      await saveBlock(beach, RING(handle), next, ring ? { secret: key, hasContent: true } : { new_lock: key, hasContent: true });
    } catch (e) {
      return { problem: refusalFor(e, handle) };
    }
    return { fingerprint, digit, gated: !!door.minted };
  });
}

/** Revoke fingerprints of `handle` at `beach`, standing at the door with the key typed. */
async function revoke(handle: string, key: string, digits: string[], beach: string, ring: Record<string, any> | null): Promise<{ problem: string } | { revoked: string[] }> {
  const gone = digits.filter((d) => DIGITS.includes(d) && isSealedEntry(ring?.[d]));
  if (!ring || gone.length === 0) return { problem: 'Choose a fingerprint to revoke.' };
  const next = { ...ring };
  for (const d of gone) delete next[d];
  try {
    await saveBlock(beach, RING(handle), next, { secret: key, hasContent: true });
  } catch (e) {
    return { problem: refusalFor(e, handle) };
  }
  for (const [f, o] of opened) if (o.handle === handle && o.beach === beach && gone.includes(o.digit)) opened.delete(f);
  return { revoked: gone.map((d) => String(ring[d]._ ?? `fingerprint ${d}`)) };
}

/** Keys opened in the last minute, by fingerprint: memory only, as the members' passes are. */
const opened = new Map<string, { key: string; handle: string; digit: string; beach: string; until: number }>();
/** Fingerprints a members' beach turned away in the last hour: the key their token carries no
 *  longer proves the pass there (rotated, or the passport gone), and every try would count a wrong
 *  key against the holder's own passport, so none is made until the hour turns. */
const turnedAway = new Map<string, number>();
const HOUR = 60 * 60 * 1000;

/** The key a live fingerprint opens at its beach; null when its digit is gone (revoked), or when a
 *  members' beach turns its key away; 'unreachable' when the beach did not answer, which is no
 *  reason to sign anyone out. `carried` is the key a members' beach connection's token carries,
 *  which proves the pass the ring is read with. */
async function openFingerprint(handle: string, fingerprint: string, digit: string, beach: string, carried?: string): Promise<string | null | 'unreachable'> {
  const memo = opened.get(fingerprint);
  if (memo && memo.until > Date.now() && memo.handle === handle && memo.digit === digit && memo.beach === beach) return memo.key;
  if ((turnedAway.get(fingerprint) ?? 0) > Date.now()) return null;
  let ring: Record<string, any> | null;
  try {
    ring = await atTheDoor(ringDoor(handle, fingerprint, carried), () => readRing(handle, beach));
  } catch (e) {
    if (!isDoorRefusal(e)) return 'unreachable';
    if (turnedAway.size >= 512) turnedAway.delete(turnedAway.keys().next().value!);
    turnedAway.set(fingerprint, Date.now() + HOUR);
    return null;
  }
  const key = openKey(ring?.[digit], fingerprint);
  if (!key) { opened.delete(fingerprint); return null; }
  opened.set(fingerprint, { key, handle, digit, beach, until: Date.now() + OPENED_MS });
  return key;
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

/** What <mcp path>/me stands for: the one address, where the handle is the one typed at sign-in. */
export const ANY = '*';

/** The handle a signed address fixes: its handle for <mcp path>/as/<handle>, ANY for
 *  <mcp path>/me, null for every other path. */
export function asHandle(pathname: string, mcpPath: string): string | null {
  if (pathname === `${mcpPath}/me`) return ANY;
  const prefix = `${mcpPath}/as/`;
  if (!pathname.startsWith(prefix)) return null;
  const h = pathname.slice(prefix.length);
  return HANDLE.test(h) ? h : null;
}

/** The path of a signed address. */
const addressOf = (handle: string, mcpPath: string) => (handle === ANY ? `${mcpPath}/me` : `${mcpPath}/as/${handle}`);

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
function page(res: ServerResponse, status: number, body: string, title = 'Hide your key from your AI'): true {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  });
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>
:root{color-scheme:light dark;--ink:#1d2a33;--soft:#5b6b75;--line:#c9d6dc;--sea:#2f6f86;--on-sea:#fff;--bg:#f4f8f9}
@media (prefers-color-scheme:dark){:root{--ink:#e3eef2;--soft:#9fb2bb;--line:#33454e;--sea:#6fb3c9;--on-sea:#10181c;--bg:#10181c}}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,sans-serif}
main{max-width:30rem;margin:0 auto;padding:2.5rem 1rem}h1{font-size:1.4rem;margin:0 0 1rem}
label{display:block;margin:1rem 0;font-weight:600}input:not([type=checkbox]){display:block;box-sizing:border-box;width:100%;margin-top:.35rem;padding:.7rem;font:inherit;border:1px solid var(--line);border-radius:.5rem;background:transparent;color:inherit}
input[readonly]{color:var(--soft)}button{margin-top:.5rem;padding:.75rem 1.4rem;font:inherit;font-weight:600;border:0;border-radius:.5rem;background:var(--sea);color:var(--on-sea)}
ul{list-style:none;padding:0}li{padding:.6rem 0;border-bottom:1px solid var(--line)}li label{display:flex;gap:.6rem;margin:0;font-weight:400}
.small{color:var(--soft);font-size:.9rem}.problem{color:#b3412e;font-weight:600}
</style></head><body><main>${body}</main></body></html>`);
  return true;
}
const keyField = '<label>Key<input name="key" type="password" required autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false"></label>';

// ── The authorization request ──

const ASK_KEYS = ['response_type', 'client_id', 'redirect_uri', 'code_challenge', 'code_challenge_method', 'state', 'scope', 'resource'] as const;
type Ask = Partial<Record<(typeof ASK_KEYS)[number], string>>;
const readAsk = (src: Record<string, string>): Ask =>
  Object.fromEntries(ASK_KEYS.filter((k) => typeof src[k] === 'string').map((k) => [k, src[k]])) as Ask;

/** A fault the client cannot be sent back for is a page; one it can is a redirect carrying the
 *  error, as OAuth asks; a sound request names its client and the handle its resource fixes. */
function checkAsk(ask: Ask, origin: string, mcpPath: string): { problem: string } | { back: string } | { handle: string | null; client: string } {
  const client = unseal('client', ask.client_id);
  if (!client) return { problem: 'This request did not come from a client bsp-mcp registered. Start again from the connector in your AI.' };
  if (!ask.redirect_uri || !redirectMatches(client.r, ask.redirect_uri)) return { problem: 'The address this would return to is not one its client registered.' };
  const fail = (error: string, error_description: string) => ({ back: withParams(ask.redirect_uri!, { error, error_description, state: ask.state }) });
  if (ask.response_type !== 'code') return fail('unsupported_response_type', 'only response_type=code');
  if (!ask.code_challenge || ask.code_challenge_method !== 'S256') return fail('invalid_request', 'S256 PKCE is required');
  const name = typeof client.n === 'string' && client.n ? client.n : 'a client';
  if (!ask.resource) return { handle: null, client: name };
  const handle = ask.resource.startsWith(`${origin}${mcpPath}/`) ? asHandle(ask.resource.slice(origin.length), mcpPath) : null;
  if (!handle) return fail('invalid_target', 'the resource is not an address of this router');
  return { handle: handle === ANY ? null : handle, client: name };
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

/** An address that fixes a handle no passport stands for at this router's own beach (/as/me, taken
 *  for /me on 5 November): said before any key is typed, with the way to hide one's own key, and the
 *  beach asked for, since the handle may stand on another. */
function noSuchHandle(handle: string, origin: string, mcpPath: string): string {
  return `<h1>There is no ${esc(handle)} on ${esc(HERE)}</h1>
<p>This connector's address ends in /as/${esc(handle)}, and an address like that hides only the key of the handle after /as/. No passport:${esc(handle)} stands on ${esc(HERE)}, the beach bsp-mcp hides keys at unless another is named.</p>
<p>For your own handle, give the connector the address <b>${esc(origin + addressOf(ANY, mcpPath))}</b> and type your handle on its page. If ${esc(handle)} stands on another beach, name that beach here, and its key is hidden there.</p>`;
}

/** The page that hides the key. `beach` is what its beach field holds (the router's own unless the
 *  person named another); `notice` stands in place of its heading where the address has more to say. */
function signinPage(ask: Ask, handle: string | null, client: string, problem = '', beach = HERE, notice = ''): string {
  const hidden = ASK_KEYS.filter((k) => ask[k] !== undefined).map((k) => `<input type="hidden" name="${k}" value="${esc(ask[k]!)}">`).join('');
  const as = handle ? `<b>${esc(handle)}</b>` : 'the handle you give here';
  const named = `${client === 'a client' ? 'Claude' : client}, ${new Date().toISOString().slice(0, 10)}`;
  const head = notice || `<h1>${handle ? `Hide ${esc(handle)}'s key from your AI` : 'Hide your key from your AI'}</h1>
<p>${esc(backTo(ask.redirect_uri ?? ''))} will write on the beach as ${as}. Type the key once, here on bsp-mcp's own page, and never in a chat: bsp-mcp keeps it sealed and adds it to each write, so your AI never sees it.</p>`;
  return `${head}
${problem ? `<p class="problem">${esc(problem)}</p>` : ''}
<form method="post" action="/oauth/authorize">${hidden}
<label>${handle ? 'Handle' : 'Your handle, the name your blocks are under'}<input name="handle" ${handle ? `value="${esc(handle)}" readonly` : 'required'} autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"></label>
<label>Your beach, where that passport stands<input name="beach" value="${esc(beach)}" required inputmode="url" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"></label>
${keyField}
<label>Name this connection<input name="name" value="${esc(named)}" maxlength="80" autocapitalize="sentences"></label>
<button type="submit">${handle ? 'Hide the key' : 'Hide my key'}</button>
</form>
<p class="small">Your beach is ${esc(HERE)} unless your passport stands on another, a members' beach of your own among them: name that one, and the key is hidden there. bsp-mcp makes a fingerprint for this connection and seals the key to it. The sealed copy stands at fingerprints:${esc(handle ?? '<handle>')} on your beach, where only bsp-mcp can open it. Your AI's connection carries only a token sealed for bsp-mcp: the fingerprint, and at a members' beach the key too, since that beach shows the fingerprints only to the key. No model ever sees the key. The connection can write, and open sealed lines when asked, your vault among them. Hiding the key is a service of bsp-mcp, not a sign-in to the beach, which has none.</p>
<p class="small">To take the key away from this connection later, use ${esc(FINGERPRINTS_PAGE)}${esc(handle ?? '<handle>')} on bsp-mcp, adding ?beach= and your beach where it is not ${esc(HERE)}: the key stays the same, and only this connection stops.</p>`;
}

/** The fingerprints of a handle at its beach. `locked`: a members' beach, which shows them only to
 *  the key, so the page asks for it before it lists them. */
function fingerprintsPage(handle: string, beach: string, ring: Record<string, any> | null, note = '', problem = '', locked = false): string {
  const live = DIGITS.filter((d) => isSealedEntry(ring?.[d]));
  const action = esc(fingerprintsAt(handle, beach));
  const where = isHome(beach) ? '' : ` at ${esc(shown(beach))}`;
  const rows = live.map((d) => `<li><label><input type="checkbox" name="revoke" value="${d}"> <span><b>${esc(String(ring![d]._ ?? `fingerprint ${d}`))}</b><br><span class="small">at ${d}, minted ${esc(String(ring![d]['5'] ?? '').slice(0, 16).replace('T', ' '))}</span></span></label></li>`).join('');
  const body = locked
    ? `<p>${esc(shown(beach))} is a members' beach: it shows ${esc(handle)}'s fingerprints only to the holder of ${esc(handle)}'s key.</p><form method="post" action="${action}"><input type="hidden" name="show" value="1">${keyField}<button type="submit">Show them</button></form>`
    : live.length ? `<form method="post" action="${action}"><ul>${rows}</ul>${keyField}<button type="submit">Revoke the ticked ones</button></form>` : '<p>No fingerprints act for this handle.</p>';
  return `<h1>Fingerprints for ${esc(handle)}${where}</h1>
${note ? `<p>${esc(note)}</p>` : ''}${problem ? `<p class="problem">${esc(problem)}</p>` : ''}
${body}
<p class="small">Each line is a connection that writes as ${esc(handle)}${where} with the key hidden by bsp-mcp. Revoking one stops it, and leaves the key and every other connection as they are. It takes ${esc(handle)}'s key, typed here.</p>`;
}

// ── The routes ──

/** A connection's tokens: its handle, fingerprint and digit, the address it was minted at, the beach
 *  its ring stands at, and, for a members' beach, the key that proves the pass there (`k`). */
function tokens(h: string, f: string, d: string, res: string | null, b: string, k?: string) {
  const held = { h, f, d, res, b, ...(k ? { k } : {}) };
  return {
    access_token: seal('access', held, ACCESS_MS),
    token_type: 'Bearer',
    expires_in: Math.floor(ACCESS_MS / 1000),
    refresh_token: seal('refresh', held, REFRESH_MS),
    scope: SCOPE,
  };
}
/** The beach a sealed code or token names: the router's own for one minted before the beach was asked. */
const beachIn = (s: Record<string, any>) => (typeof s.b === 'string' && s.b ? s.b : DEFAULT_BEACH);
const keyIn = (s: Record<string, any>) => (typeof s.k === 'string' && s.k ? s.k : undefined);

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
  if (p !== SERVER_METADATA && !p.startsWith(RESOURCE_METADATA) && !p.startsWith('/oauth/') && !p.startsWith(FINGERPRINTS_PAGE)) return false;
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
      if (!handle) return send(res, 404, { error: 'not_found', error_description: `a signed address is ${mcpPath}/me, or ${mcpPath}/as/<handle>` });
      return send(res, 200, {
        resource: `${origin}${addressOf(handle, mcpPath)}`,
        authorization_servers: [origin],
        scopes_supported: [SCOPE],
        bearer_methods_supported: ['header'],
        resource_name: handle === ANY ? 'the beach, as your own handle' : `the beach, as ${handle}`,
      }, { 'Cache-Control': 'max-age=3600' });
    }
    if (p === '/oauth/register' && req.method === 'POST') {
      let j: any = null;
      try { j = JSON.parse(await readBody(req)); } catch { /* answered below */ }
      const uris = Array.isArray(j?.redirect_uris) ? j.redirect_uris : null;
      if (!uris || uris.length === 0 || uris.length > 8 || !uris.every(registrable)) {
        return send(res, 400, { error: 'invalid_redirect_uri', error_description: 'redirect_uris: https addresses, or a loopback for a client on the person\'s machine' });
      }
      const client_name = typeof j.client_name === 'string' ? j.client_name.slice(0, 60) : undefined;
      return send(res, 201, {
        client_id: seal('client', { r: uris, n: client_name }, CLIENT_MS),
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
      if ('problem' in checked) return page(res, 400, `<h1>This cannot go on</h1><p>${esc(checked.problem)}</p>`);
      if ('back' in checked) return redirect(res, checked.back);
      if (!posted) {
        // An address that fixes a handle no passport stands for at this router's own beach says so
        // before any key is typed, and asks which beach it stands at instead. A beach that does not
        // answer is no reason to turn a sign-in away here: minting says so.
        const nowhere = !!checked.handle && !(await passportStands(checked.handle, DEFAULT_BEACH).catch(() => true));
        return page(res, 200, nowhere
          ? signinPage(ask, checked.handle, checked.client, '', '', noSuchHandle(checked.handle!, origin, mcpPath))
          : signinPage(ask, checked.handle, checked.client));
      }
      const typed = String(posted.beach ?? '').trim();
      const again = (problem: string) => page(res, 400, signinPage(ask, checked.handle, checked.client, problem, typed || HERE));
      const handle = checked.handle ?? (posted.handle ?? '').trim();
      if (!HANDLE.test(handle)) return again('A handle is letters, digits, - and _ only.');
      const key = posted.key ?? '';
      if (!key || key.length > 512) return again('Type the key.');
      const beach = await beachNamed(typed);
      if (!beach) return again(`No beach answers at ${typed}. Type its address as it reads, such as ${HERE}: a beach is reached over https.`);
      const name = (posted.name ?? '').trim().slice(0, 80) || `${checked.client}, ${new Date().toISOString().slice(0, 10)}`;
      const minted = await mint(handle, key, name, beach);
      if ('problem' in minted) return again(minted.problem);
      const code = seal('code', {
        h: handle, f: minted.fingerprint, d: minted.digit, c: digest(ask.client_id!), r: ask.redirect_uri, x: ask.code_challenge, res: ask.resource ?? null,
        b: beach, ...(minted.gated ? { k: key } : {}),
      }, CODE_MS);
      return redirect(res, withParams(ask.redirect_uri!, { code, state: ask.state }));
    }
    if (p === '/oauth/token' && req.method === 'POST') {
      const f = fields(await readBody(req), req.headers['content-type']);
      const deny = (error: string, error_description: string, status = 400) => send(res, status, { error, error_description });
      const still = async (s: Record<string, any>) => {
        const k = await openFingerprint(s.h, s.f, s.d, beachIn(s), keyIn(s));
        if (k === 'unreachable') return deny('temporarily_unavailable', 'the beach did not answer', 503);
        if (!k) return deny('invalid_grant', 'this fingerprint was revoked: connect again and hide the key once more');
        return send(res, 200, tokens(s.h, s.f, s.d, s.res, beachIn(s), keyIn(s)));
      };
      if (f.grant_type === 'authorization_code') {
        const code = unseal('code', f.code);
        if (!code) return deny('invalid_grant', 'the code is unknown or expired');
        if (f.redirect_uri !== code.r) return deny('invalid_grant', 'redirect_uri does not match the authorization request');
        if (f.client_id && digest(f.client_id) !== code.c) return deny('invalid_grant', 'the code was issued to another client');
        if (!f.code_verifier || !sameText(digest(f.code_verifier), code.x)) return deny('invalid_grant', 'PKCE verification failed');
        if (f.resource && code.res && f.resource !== code.res) return deny('invalid_target', 'the resource does not match the authorization request');
        return still(code);
      }
      if (f.grant_type === 'refresh_token') {
        const r = unseal('refresh', f.refresh_token);
        if (!r) return deny('invalid_grant', 'the refresh token is unknown or expired');
        if (f.resource && r.res && f.resource !== r.res) return deny('invalid_target', 'the resource does not match the sign-in');
        return still(r);
      }
      return deny('unsupported_grant_type', 'authorization_code or refresh_token');
    }
    if (p.startsWith(FINGERPRINTS_PAGE) && (req.method === 'GET' || req.method === 'POST')) {
      const handle = p.slice(FINGERPRINTS_PAGE.length);
      if (!HANDLE.test(handle)) return page(res, 404, '<h1>No such handle</h1>');
      const title = `Fingerprints for ${handle}`;
      const typed = url.searchParams.get('beach') ?? '';
      const beach = await beachNamed(typed);
      if (!beach) return page(res, 400, `<h1>No beach answers there</h1><p>No beach answers at ${esc(typed)}. Name the beach the passport stands at as its address reads, such as ${esc(HERE)}: a beach is reached over https.</p>`, title);
      if (req.method === 'POST') {
        const raw = await readBody(req);
        const f = fields(raw, req.headers['content-type']);
        const picked = new URLSearchParams(raw).getAll('revoke');
        const key = f.key ?? '';
        if (!key) {
          const ring = await readRing(handle, beach).catch(() => null);
          return page(res, 400, fingerprintsPage(handle, beach, ring, '', 'Type the key.', !ring && !isHome(beach)), title);
        }
        // The key typed here, at a door of this one request's own: a members' beach shows the ring
        // to it, and no pass outlives the request.
        const door: Door = { session: `fingerprints:${randomBytes(9).toString('base64url')}`, handles: [handle], secret: key };
        return atTheDoor(door, async () => {
          try {
            let ring: Record<string, any> | null;
            try { ring = await readRing(handle, beach); } catch (e) {
              return page(res, isDoorRefusal(e) ? 400 : 503, fingerprintsPage(handle, beach, null, '', unanswered(e, handle, beach, door), isDoorRefusal(e)), title);
            }
            if (f.show) return page(res, 200, fingerprintsPage(handle, beach, ring), title);
            const done = await revoke(handle, key, picked, beach, ring);
            const after = await readRing(handle, beach).catch(() => ring);
            if ('problem' in done) return page(res, 400, fingerprintsPage(handle, beach, after, '', done.problem), title);
            return page(res, 200, fingerprintsPage(handle, beach, after, `Revoked: ${done.revoked.join(', ')}. Those connections no longer write as ${handle}.`), title);
          } finally {
            forgetPass(beach);
          }
        });
      }
      let ring: Record<string, any> | null;
      try { ring = await readRing(handle, beach); } catch (e) {
        if (isDoorRefusal(e)) return page(res, 200, fingerprintsPage(handle, beach, null, '', '', true), title);
        return page(res, 503, `<h1>No fingerprints read</h1><p>${esc(unanswered(e, handle, beach))}</p>`, title);
      }
      return page(res, 200, fingerprintsPage(handle, beach, ring), title);
    }
    return send(res, 405, { error: 'invalid_request', error_description: `${req.method} ${p} is not a sign-in address` });
  } catch (e: any) {
    return send(res, 400, { error: 'invalid_request', error_description: String(e?.message ?? e) });
  }
}

// ── The signed address ──

/** Who a request at a signed address is signed in as, for the transport to hand every tool call:
 *  its handle, the key its fingerprint opens, and the beach its passport stands at. At
 *  <mcp path>/as/<handle> the token must be that handle's; at <mcp path>/me (ANY) it is whichever
 *  handle signed in there. null for no token, a forged, expired or refresh one, one minted for
 *  another address, a fingerprint revoked, or a key its members' beach turns away; 'unreachable'
 *  when the beach did not answer. */
export async function authFor(req: IncomingMessage, handle: string, resource: string): Promise<AuthInfo | null | 'unreachable'> {
  const m = String(req.headers.authorization ?? '').match(/^Bearer\s+(\S+)$/i);
  const a = m ? unseal('access', m[1]) : null;
  if (!a || typeof a.h !== 'string' || !HANDLE.test(a.h) || (handle !== ANY && a.h !== handle)) return null;
  if ((a.res && a.res !== resource) || typeof a.f !== 'string' || typeof a.d !== 'string') return null;
  const beach = beachIn(a);
  const key = await openFingerprint(a.h, a.f, a.d, beach, keyIn(a));
  if (key === 'unreachable' || key === null) return key;
  return { token: m![1], clientId: 'bsp-signin', scopes: [SCOPE], expiresAt: Math.floor(a.exp / 1000), extra: { signedIn: { handle: a.h, key, beach } } };
}

/** The 401 that starts a client's sign-in, pointing at the address's own metadata. */
export function refuseUnsigned(res: ServerResponse, origin: string, mcpPath: string, handle: string): void {
  const at = `${origin}${addressOf(handle, mcpPath)}`;
  send(res, 401, {
    error: 'invalid_token',
    error_description: `${at} is the beach as ${handle === ANY ? 'your own handle' : handle}, its key hidden by bsp-mcp: connect once through your client's connector and hide the key on bsp-mcp's page, and every call carries a fingerprint from then on`,
  }, { 'WWW-Authenticate': `Bearer resource_metadata="${origin}${RESOURCE_METADATA}${addressOf(handle, mcpPath)}", scope="${SCOPE}"` });
}

/** The line a signed session's instructions carry, so the model never asks for the key, and finds
 *  the handle's blocks at the beach they stand at. */
export function signedLine(handle: string, beach: string = DEFAULT_BEACH): string {
  const at = isHome(beach) ? '' : ` ${handle}'s passport and blocks stand at ${beach}, not at the default beach: address them there, with agent_id "${beach}" (a bare handle, sed: or grain: goes to ${DEFAULT_BEACH}, where ${handle} may be nobody), and enter the shell with pscale_play(world="${beach}", handle="${handle}", room="${handle}").`;
  return `THIS CONNECTION WRITES AS ${handle}, its key hidden by bsp-mcp behind a fingerprint.${at} Every call that carries no secret writes with ${handle}'s key, which never enters this window: do not ask the person for it, and do not look for it. Wherever a call would name the key, write "vault" and the router puts the key there: enc_secret: "vault" seals and opens a gray line, ${handle}'s vault among them (agent_id the beach's URL, block "vault:${handle}"); new_lock: "vault" latches a new block under the key, and no other new_lock is taken here: moving a block to another key or opening it takes the key in hand. Nothing the router returns ever contains the key itself.`;
}

// ── The tools ──

const fromSignIn = new AsyncLocalStorage<true>();

/** The key that seals, opens or signs for this call: its enc_secret, else its secret, unless that
 *  secret came from the sign-in, which seals nothing unless asked (enc_secret: "vault"). */
export function sealingKey(encSecret: string | undefined, secret: string | undefined): string | undefined {
  return encSecret ?? (fromSignIn.getStore() ? undefined : secret);
}

/** Said where a seal is refused, when the refusal is the sign-in's rule and not a missing key. */
export function signedSealNote(): string {
  return fromSignIn.getStore() ? ' This connection carries a hidden key: pass enc_secret: "vault" to seal or open with it.' : '';
}

const MARK = "[this connection's key]";
/** The word a signed call writes wherever it would name the key. */
const VAULT = 'vault';
const KEY_FIELDS = ['secret', 'enc_secret', 'new_lock'] as const;
/** Every text a signed call returns, with the key taken out wherever it stands — and the latch
 *  derived from it (proposals/2026-11-05-the-derived-latch.md §6), derived only when the text
 *  holds a 44-character base64 run that could be it, once a session. */
async function withoutKey(res: any, who: { handle: string; key: string }): Promise<any> {
  if (who.key.length < 6 || !res || !Array.isArray(res.content)) return res;
  const keys = [who.key];
  if (res.content.some((c: any) => c && typeof c.text === 'string' && /[A-Za-z0-9+/]{43}=/.test(c.text))) keys.push(await deriveLatch(who.key, who.handle));
  return {
    ...res,
    content: res.content.map((c: any) => {
      if (!c || typeof c.text !== 'string') return c;
      const text = keys.reduce((t, k) => (t.includes(k) ? t.split(k).join(MARK) : t), c.text);
      return text === c.text ? c : { ...c, text };
    }),
  };
}

function isZodShape(a: unknown): a is Record<string, unknown> {
  return !!a && typeof a === 'object' && !Array.isArray(a)
    && Object.values(a as object).some((v) => !!v && typeof v === 'object' && 'safeParse' in (v as object));
}

/**
 * For a signed call: every tool that takes a `secret` gets the key where the call carries none;
 * "vault" in `secret`, `enc_secret` or `new_lock` becomes the key, so a signed hand writes, seals,
 * opens and latches with a key it never sees; nothing returned contains it; and the session's hand
 * is its handle wherever a hand is asked for (the reflection; a members' beach, whose pass is
 * proved with the key). Any other `new_lock` on a call the key was put into is refused, so a
 * fingerprint never moves a block off the key or opens it. An unsigned call that names "vault"
 * is refused, since the word would become the key. Installed innermost, beside the error and
 * clock wrappers in server.ts, so it reaches every tool that exists and every tool added later.
 */
export function installSignedIn(server: McpServer): void {
  const orig = server.tool.bind(server);
  (server as any).tool = (...args: any[]) => {
    const handler = args[args.length - 1];
    if (typeof handler !== 'function') return (orig as any)(...args);
    const shape = args.slice(1, -1).find(isZodShape);
    const takesSecret = !!shape && 'secret' in shape;
    const takesEnc = !!shape && 'enc_secret' in shape;
    const takesLock = !!shape && 'new_lock' in shape;
    args[args.length - 1] = async (...h: any[]) => {
      const extra = h[h.length - 1];
      const who = extra?.authInfo?.extra?.signedIn as { handle: string; key: string } | undefined;
      if (!who) {
        // "vault" is the key only where a fingerprint stands behind it. Anywhere else the word
        // would itself become the key: a latch, a seal or a published key pair anyone could open.
        const named = h.length > 1 && h[0] && typeof h[0] === 'object' ? KEY_FIELDS.find((k) => h[0][k] === VAULT) : undefined;
        if (named) return { isError: true, content: [{ type: 'text', text: `${named}: "vault" stands for the key only on a connection whose key bsp-mcp hides (the address ending /me, the key hidden once through a client's connector). This connection carries no hidden key, so nothing was done: pass the key itself, or connect at the address ending /me.` }] };
        return handler(...h);
      }
      if (extra?.sessionId && !handOf(extra.sessionId)) declareHand(extra.sessionId, who.handle);
      const params = h.length > 1 && h[0] && typeof h[0] === 'object' ? { ...h[0] } : null;
      let injected = false;
      if (params) {
        if (takesSecret && (params.secret === VAULT || !(typeof params.secret === 'string' && params.secret !== ''))) { params.secret = who.key; injected = true; }
        // The one act its holder could not take back: a lock moved to another key, or opened, with
        // a key the hand never saw. The key would no longer open the block, and revoking the
        // fingerprint would not return it. So a signed call sets a lock only to the key itself.
        if (injected && takesLock && params.new_lock !== undefined && params.new_lock !== VAULT) {
          return { isError: true, content: [{ type: 'text', text: `new_lock: a connection writing as ${who.handle} with its key hidden sets a lock only to the key itself, written "vault". Moving a block to another key, or opening it, would take the block out of ${who.handle}'s hands, and revoking this connection would not bring it back, so that takes the key in hand, never a fingerprint. Nothing was done.` }] };
        }
        if (takesEnc && params.enc_secret === VAULT) params.enc_secret = who.key;
        if (takesLock && params.new_lock === VAULT) params.new_lock = who.key;
      }
      const call = params ? [params, ...h.slice(1)] : h;
      const res = injected ? await fromSignIn.run(true, () => handler(...call)) : await handler(...call);
      return withoutKey(res, who);
    };
    return (orig as any)(...args);
  };
}
