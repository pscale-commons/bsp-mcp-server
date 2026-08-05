/**
 * pscale-wire.ts — ONE implementation of the beach wire contract.
 *
 * CANONICAL HERE (bsp-mcp-server/src/pscale-wire.ts). The copy at
 * xstream-bsp/src/kernel/pscale-wire.ts is VENDORED BYTE-IDENTICAL — edit
 * only here, re-vendor there, and `smoke:wire` in each repo tripwires drift
 * (it runs the contract battery in pscale-wire-contract.ts; xstream's also
 * diffs its copy against this file's raw URL). Bump WIRE_VERSION on any
 * change.
 *
 * WHY ONE FILE. The seat and the router each hand-built these HTTP bodies,
 * and the drift between them cost real things: the grain side went out as a
 * NUMBER from the seat where the beach compares strings — HTTP 400, Level 2
 * closed to every genus instance since the seat was built (fixed 2026-08-03,
 * xstream #210, after egg-one diagnosed it from inside four times). This
 * module owns body construction outright — grainReach computes the pair id
 * and the side itself, typed '1' | '2', so that class of fault has no
 * author-site left. proposals/2026-08-03-one-wire-not-two.md is the record.
 *
 * WHAT THIS IS NOT. Origin resolution (the beach.<host> fallback, caching)
 * is routing and stays in db.ts — every function here takes a RESOLVED
 * origin. Validation of addresses is the walker's and the beach's, never
 * done here: the wire is transport, deliberately dumb. Two exemptions stand
 * by design: genus-one/wire.py is the nest's Python dialect of this same
 * contract, and src/genus.ts's wireStore is the kernel.py byte-parity
 * instrument (ordered Maps) — neither is drift, both answer to the same
 * battery-pinned wire shapes.
 *
 * DISCIPLINES CARRIED (learned, not invented):
 * - whole-block writes send {confirm: true} (the beach gates REPLACE behind
 *   it) and verify by READ-BACK — a lost write is a lost wake (wire.py,
 *   wake-1).
 * - the block name rides the QUERY STRING on every call (?block= is required
 *   on every read or write — the v2 surface law). Never in the body.
 * - retry ONCE on transport failure only (socket death, timeout); an HTTP
 *   status is a beach ANSWER, never retried — a 400 is the contract
 *   refusing, and repeating it is noise. Retried appends can double an
 *   entry when the first landed unacknowledged: accepted, because a LOST
 *   give is worse than a doubled one, and resolver appends are idempotent
 *   server-side (SET-NX; the double lands 409, discriminated below).
 * - results, not throws: every write returns {ok: ...}; consumers shape
 *   their own errors (the MCP door throws rich messages, the seat returns
 *   soft failures). loadBlock returns null ONLY for 404 — absence is data;
 *   any other failure throws, because "unreadable" mistaken for "absent" is
 *   how an organ gets overwritten with a stub.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export const WIRE_VERSION = '0.1.0';

const DEFAULT_TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 1_500;

export interface WireOpts {
  /** Per-call transport timeout; the router passes its env-configured value. */
  timeoutMs?: number;
  /** Retry pause override — tests set 1ms; leave unset in real use. */
  retryDelayMs?: number;
}

export interface WriteOpts extends WireOpts {
  secret?: string;
  newLock?: string | null;
  gray?: boolean;
  pscaleAttention?: number | null;
}

export type WireOk = { ok: true; status: number; body: Json };
export type WireErr = { ok: false; status?: number; error: string };

// ── transport ────────────────────────────────────────────────────────────────

class HttpError extends Error {
  constructor(public httpStatus: number, public bodyText: string) {
    super(`HTTP ${httpStatus}: ${bodyText.slice(0, 200)}`);
  }
}

function base(origin: string): string {
  return `${origin.replace(/\/+$/, '')}/.well-known/pscale-beach`;
}

/** ?block= endpoint — colons stay readable (the beach accepts both; the
 * unescaped form is what every log and doc shows). */
export function endpoint(origin: string, block: string): string {
  return `${base(origin)}?block=${encodeURIComponent(block).replace(/%3A/gi, ':')}`;
}

/** Canonical shape-read endpoint (?spindle= / ?pscale= — the wire-level
 * (B, S, P) read; legacy beaches ignore the params and return raw). */
export function endpointShape(origin: string, block: string, spindle: string | null, pscale: number | null): string {
  let url = endpoint(origin, block);
  if (spindle != null && spindle !== '') url += `&spindle=${encodeURIComponent(spindle)}`;
  if (pscale != null) url += `&pscale=${encodeURIComponent(String(pscale))}`;
  return url;
}

async function rawGet(url: string, timeoutMs: number): Promise<Json> {
  const r = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await r.text();
  if (!r.ok) throw new HttpError(r.status, text);
  try { return JSON.parse(text); } catch { return null; }
}

async function rawPost(url: string, body: Json, timeoutMs: number): Promise<{ status: number; body: Json; text: string }> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await r.text();
  let parsed: Json = null;
  try { parsed = JSON.parse(text); } catch { /* an ack without a body is still an ack */ }
  return { status: r.status, body: parsed, text };
}

/** Retry ONCE on transport failure only. HttpError is a beach answer —
 * rethrown untouched, never repeated. */
async function retryTransient<T>(fn: () => Promise<T>, delayMs: number): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) throw e;
    await new Promise(res => setTimeout(res, delayMs));
    return await fn();
  }
}

function errOf(e: unknown): WireErr {
  if (e instanceof HttpError) {
    let msg = e.bodyText.slice(0, 200);
    try {
      const p = JSON.parse(e.bodyText);
      if (p?.error) msg = String(p.error);
    } catch { /* keep raw text */ }
    return { ok: false, status: e.httpStatus, error: msg || `HTTP ${e.httpStatus}` };
  }
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

// ── reads ────────────────────────────────────────────────────────────────────

/** The block's JSON, or null iff the beach answers 404 (absence is data).
 * Any other failure THROWS — unreadable must never pass for absent.
 * Tolerant unwrap: a {block: X} envelope yields X; a raw block passes as-is. */
export async function loadBlock(origin: string, block: string, opts: WireOpts = {}): Promise<Json | null> {
  try {
    const j = await retryTransient(
      () => rawGet(endpoint(origin, block), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      opts.retryDelayMs ?? RETRY_DELAY_MS,
    );
    return j && typeof j === 'object' && !Array.isArray(j) && 'block' in j ? (j as Json).block : j;
  } catch (e) {
    if (e instanceof HttpError && e.httpStatus === 404) return null;
    throw e;
  }
}

/** Shape-resolved read (?spindle=/?pscale=). null iff 404. Raw JSON back —
 * a canonical beach returns {shape, ...}; a legacy one returns the raw block
 * (no `shape` field) and the caller walks locally. */
export async function readShape(origin: string, block: string, spindle: string | null, pscale: number | null, opts: WireOpts = {}): Promise<Json | null> {
  try {
    return await retryTransient(
      () => rawGet(endpointShape(origin, block, spindle, pscale), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      opts.retryDelayMs ?? RETRY_DELAY_MS,
    );
  } catch (e) {
    if (e instanceof HttpError && e.httpStatus === 404) return null;
    throw e;
  }
}

/** The beach's derived surface index ({_, origin, blocks, bytes?}) — a GET
 * with no ?block=. null when unreachable or not index-shaped. */
export async function surfaceIndex(origin: string, opts: WireOpts = {}): Promise<{ _?: string; origin?: string; blocks: string[]; bytes?: Record<string, number> } | null> {
  try {
    const j = await retryTransient(
      () => rawGet(base(origin), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      opts.retryDelayMs ?? RETRY_DELAY_MS,
    );
    return j && typeof j === 'object' && Array.isArray(j.blocks) ? j : null;
  } catch {
    return null;
  }
}

// ── writes ───────────────────────────────────────────────────────────────────

/** Whole-block write: {confirm: true} always rides (the beach gates REPLACE
 * behind it), and unless opts-disabled the write is verified by read-back —
 * ok:false on mismatch, because a lost write must fail loudly. */
export async function saveWhole(origin: string, block: string, content: Json, opts: WriteOpts & { confirm?: boolean } = {}): Promise<{ ok: true } | WireErr> {
  const body: Json = { content, confirm: true };
  if (opts.secret !== undefined) body.secret = opts.secret;
  if (opts.newLock !== undefined) body.new_lock = opts.newLock;
  if (opts.gray !== undefined) body.gray = opts.gray;
  try {
    const r = await retryTransient(
      () => rawPost(endpoint(origin, block), body, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      opts.retryDelayMs ?? RETRY_DELAY_MS,
    );
    if (r.status >= 400) return errOf(new HttpError(r.status, r.text));
    if (opts.confirm !== false) {
      const back = await loadBlock(origin, block, opts);
      if (!deepEqual(back, content)) {
        return { ok: false, error: `write to ${block} at ${origin} did not read back identical` };
      }
    }
    return { ok: true };
  } catch (e) {
    return errOf(e);
  }
}

/** Surgical write at a spindle — the substrate's locks arbitrate (403 without
 * the right secret). No read-back: a position's shape is the walker's to
 * verify, not the transport's. */
export async function writeAt(origin: string, block: string, spindle: string, content: Json, opts: WriteOpts = {}): Promise<{ ok: true; status: number } | WireErr> {
  const body: Json = { spindle, content };
  if (opts.pscaleAttention !== undefined) body.pscale_attention = opts.pscaleAttention;
  if (opts.secret !== undefined) body.secret = opts.secret;
  if (opts.newLock !== undefined) body.new_lock = opts.newLock;
  if (opts.gray !== undefined) body.gray = opts.gray;
  try {
    const r = await retryTransient(
      () => rawPost(endpoint(origin, block), body, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      opts.retryDelayMs ?? RETRY_DELAY_MS,
    );
    if (r.status >= 400) return errOf(new HttpError(r.status, r.text));
    return { ok: true, status: r.status };
  } catch (e) {
    return errOf(e);
  }
}

/** Accumulator append — the beach allocates the slot atomically and
 * supernests on rollover. With `spindle` the append lands BENEATH that node
 * (ways:grain branch 5). Resolver fields ride when given; the two 409s that
 * are ANSWERS, not errors, come back discriminated:
 *   alreadyResolved — another resolver claimed the window (SET-NX held)
 *   windowMoved     — an intention staged after the folder's read */
export interface AppendResult {
  ok: boolean;
  slot?: string;
  supernested?: boolean;
  floor?: number;
  address?: string;
  node?: string;
  cleared?: Json | null;
  alreadyResolved?: boolean;
  resolvedBy?: string | null;
  window?: string;
  landed?: Json | null;
  windowMoved?: boolean;
  buffer?: Json | null;
  status?: number;
  error?: string;
}

export async function append(
  origin: string,
  block: string,
  entry: Json,
  opts: WireOpts & { secret?: string; spindle?: string; resolveWindow?: string; resolveSeen?: string } = {},
): Promise<AppendResult> {
  const body: Json = { append: true, content: entry };
  if (opts.secret !== undefined) body.secret = opts.secret;
  if (opts.spindle !== undefined && opts.spindle !== '') body.spindle = opts.spindle;
  if (opts.resolveWindow !== undefined) body.resolve_window = opts.resolveWindow;
  if (opts.resolveSeen !== undefined) body.resolve_seen = opts.resolveSeen;
  try {
    const r = await retryTransient(
      () => rawPost(endpoint(origin, block), body, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      opts.retryDelayMs ?? RETRY_DELAY_MS,
    );
    if (r.status === 409 && r.body?.code === 'window_already_resolved') {
      return { ok: false, alreadyResolved: true, resolvedBy: r.body.resolved_by ?? null, window: r.body.window, landed: r.body.landed ?? null, status: 409 };
    }
    if (r.status === 409 && r.body?.code === 'window_moved') {
      return { ok: false, windowMoved: true, window: r.body.window, buffer: r.body.buffer ?? null, status: 409 };
    }
    if (r.status >= 400) {
      const e = errOf(new HttpError(r.status, r.text)) as WireErr;
      return { ok: false, status: e.status, error: e.error };
    }
    const j = r.body ?? {};
    return {
      ok: true,
      slot: j.slot !== undefined && j.slot !== null ? String(j.slot) : undefined,
      supernested: j.supernested,
      floor: j.floor,
      address: j.address,
      node: j.node,
      cleared: j.cleared ?? null,
    };
  } catch (e) {
    const w = errOf(e) as WireErr;
    return { ok: false, status: w.status, error: w.error };
  }
}

// ── the L2 state machines (the beach owns them; this speaks their shapes) ────

/** Raw action POST at ?block= — the escape hatch for action shapes the named
 * helpers below don't cover. Prefer the helpers: they own their bodies. */
export async function postAction(origin: string, block: string, body: Record<string, Json>, opts: WireOpts = {}): Promise<{ ok: true; status: number; body: Json } | WireErr> {
  try {
    const r = await retryTransient(
      () => rawPost(endpoint(origin, block), body, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      opts.retryDelayMs ?? RETRY_DELAY_MS,
    );
    if (r.status >= 400) return errOf(new HttpError(r.status, r.text));
    return { ok: true, status: r.status, body: r.body };
  } catch (e) {
    return errOf(e);
  }
}

/** pair_id — sha256 of the two handles sorted and joined with '|', first 16
 * hex. Case-sensitive, NO normalisation: `ayush` and `Aysuh` derive different
 * grains by design (normalising would rename every grain standing on every
 * beach — the casing guard lives at the doors, not here). */
export async function pairId(a: string, b: string): Promise<string> {
  return (await sha256hex([a, b].sort().join('|'))).slice(0, 16);
}

/** Which side of the grain a handle occupies — a STRING, '1' | '2'. The type
 * is the fix: the beach compares `side !== '1' && side !== '2'` strictly, and
 * the seat once sent a number here, which closed Level 2 for every genus
 * instance until 2026-08-03. */
export function sideOf(handle: string, partner: string): '1' | '2' {
  return [handle, partner].sort()[0] === handle ? '1' : '2';
}

/** One side of a bilateral grain: reach creates it, or completes a half-formed
 * one when the partner reached first (accept IS reach). Owns the whole body —
 * pid and side are computed here, never by the caller.
 *
 * `state` is the handler's word, verbatim: 'created' (first side, half-formed)
 * | 'completed' (the accepting reach — both sides stand) | 'updated' (own-side
 * rewrite). `completed` is derived FROM it. The seat once read a `completed`
 * field the handler never sends — a fold that would have reported a completing
 * accept as "half-formed"; the third drift instance this consolidation found. */
export async function grainReach(
  origin: string,
  args: { handle: string; partner: string; description: string; sideContent: string; passphrase: string },
  opts: WireOpts = {},
): Promise<{ ok: true; pid: string; side: '1' | '2'; state: string; completed: boolean } | (WireErr & { pid: string; side: '1' | '2' })> {
  const pid = await pairId(args.handle, args.partner);
  const side = sideOf(args.handle, args.partner);
  const r = await postAction(origin, `grain:${pid}`, {
    action: 'reach',
    side,
    agent_id: args.handle,
    partner_agent_id: args.partner,
    description: args.description,
    my_side_content: args.sideContent,
    my_passphrase: args.passphrase,
  }, opts);
  if (!r.ok) {
    // Bind the narrowed arm before spreading — spreading the union directly
    // defeats the guard under stricter tsconfigs (caught by the vendored
    // copy's typecheck in xstream; the fix lands here, in the canonical).
    const err: WireErr = r;
    return { ...err, pid, side };
  }
  const state = typeof r.body?.state === 'string' ? r.body.state : 'created';
  return { ok: true, pid, side, state, completed: state === 'completed' };
}

/** Register in a sed: collective — the beach's atomic next-position machine.
 * `collective` is the bare name; the sed: prefix is this function's to add.
 * The handler acks {ok, position, address} — both ride back verbatim. */
export async function sedRegister(
  origin: string,
  args: { collective: string; declaration: string; passphrase: string; shellRef?: string },
  opts: WireOpts = {},
): Promise<{ ok: true; position?: string; address?: string } | WireErr> {
  const body: Record<string, Json> = {
    action: 'register',
    declaration: args.declaration,
    passphrase: args.passphrase,
  };
  if (args.shellRef) body.shell_ref = args.shellRef;
  const r = await postAction(origin, `sed:${args.collective}`, body, opts);
  if (!r.ok) return r;
  const pos = r.body?.position;
  return {
    ok: true,
    position: pos !== undefined && pos !== null ? String(pos) : undefined,
    address: typeof r.body?.address === 'string' ? r.body.address : undefined,
  };
}

// ── shared small parts ───────────────────────────────────────────────────────

/** sha256 hex via SubtleCrypto — browser and Node 18+ alike. */
export async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Order-insensitive structural equality — JSON key order differs across
 * runtimes; content must not. */
export function deepEqual(a: Json, b: Json): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === 'object') {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(k => k in b && deepEqual(a[k], b[k]));
  }
  return false;
}
