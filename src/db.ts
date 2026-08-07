/**
 * db.ts — storage adapter for bsp-mcp.
 *
 * Two substrates only: federated beaches (over HTTP) and the sentinel registry
 * (in-memory bundled JSON). No central Supabase. agent_id values that are not
 * URLs and not the "pscale" sentinel translate to a default beach with the
 * original agent_id encoded into the block name.
 *
 * Translation table for non-URL, non-sentinel agent_id:
 *   bare name "weft"      + block "shell"     → (DEFAULT_BEACH, "shell:weft")
 *   bare name "weft"      + block "passport"  → (DEFAULT_BEACH, "passport:weft")
 *   "sed:hsu-commons"     + block "<any>"     → (DEFAULT_BEACH, "sed:hsu-commons")
 *   "grain:abc123def4"    + block "<any>"     → (DEFAULT_BEACH, "grain:abc123def4")
 *
 * For bare names, the role-with-handle convention scopes per-agent blocks at
 * the shared beach (see block-conventions branches 1, 2, 3 position 8). For
 * sed:/grain: the prefix-typed name IS the block on the beach (see
 * block-conventions branch 7 and 6 respectively); the original block argument
 * is dropped during translation since the substrate-shape carries enough.
 *
 * Federation per docs/protocol-pscale-beach-v2.md:
 *   GET  https://<origin>/.well-known/pscale-beach[?block=<name>][&spindle=<addr>]
 *   POST https://<origin>/.well-known/pscale-beach[?block=<name>]
 *        body: { spindle, pscale_attention?, content?, secret?, new_lock?, gray? }
 */

import { Block, readAt } from './bsp.js';
import { SENTINEL_BLOCK_MAP } from './sentinels.js';
import { publicKeysFromSpine } from './keys.js';
// The wire — ONE implementation of the beach HTTP contract (canonical here,
// vendored byte-identical into xstream; battery in pscale-wire-contract.ts).
// db.ts keeps ROUTING (origin resolution, translation, BlockRow shaping) and
// hands every HTTP body to the wire.
import * as wire from './pscale-wire.js';

// ── Default beach ──
//
// The federated host that bare-name, sed:, and grain: agent_ids translate to.
// Override via DEFAULT_BEACH env var. https://beach.happyseaurchin.com is the
// reference federated host; any beach URL works as a default.

export const DEFAULT_BEACH = process.env.DEFAULT_BEACH || 'https://beach.happyseaurchin.com';

// ── Block row shape ──
//
// Carries through from the previous Supabase era; federated reads synthesise
// this shape so downstream code doesn't need to know which substrate served
// the block. position_hashes is intentionally empty for federated rows —
// remote beaches manage their own locks and the bsp-mcp's lock-state lives at
// the beach, not here.

export interface BlockRow {
  id: string;
  owner_id: string;
  name: string;
  block: Block;
  position_hashes: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// ── Write options (federated POST passthrough) ──

export interface WriteOptions {
  spindle?: string | null;
  pscale_attention?: number | null;
  secret?: string;
  new_lock?: string | null;
  gray?: boolean;
}

// ── URL-prefix dispatch helpers ──

const URL_PREFIX_RE = /^https?:\/\//i;

/** True if the agent_id is a URL — federated beach storage applies. */
export function isFederatedOwner(ownerId: string): boolean {
  return URL_PREFIX_RE.test(ownerId);
}

// ── Sentinel registry (bundled teaching blocks) ──
//
// agent_id="pscale" is reserved as a read-only sentinel that exposes the
// teaching/reference blocks shipped inside this server. Walking these via
// bsp() is the function reading its own manual.

const SENTINEL_OWNERS = new Set(['pscale']);
const SENTINEL_BLOCKS: Record<string, Block> = SENTINEL_BLOCK_MAP;

export function isSentinelOwner(ownerId: string): boolean {
  return SENTINEL_OWNERS.has(ownerId);
}

/**
 * List the bundled block names for a sentinel owner (agent_id="pscale"). The
 * derived index of the sentinel registry — the in-memory analogue of a beach's
 * no-?block= surface listing. Returns sorted names; empty if the owner has no
 * bundled blocks.
 */
export function listSentinelNames(ownerId: string): string[] {
  const prefix = `${ownerId}/`;
  return Object.keys(SENTINEL_BLOCKS)
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length))
    .sort();
}

function loadSentinelBlock(ownerId: string, name: string): BlockRow | null {
  const block = SENTINEL_BLOCKS[`${ownerId}/${name}`];
  if (!block) return null;
  const now = new Date().toISOString();
  return {
    id: `${ownerId}/${name}`,
    owner_id: ownerId,
    name,
    block,
    position_hashes: {},
    created_at: now,
    updated_at: now,
  };
}

// ── agent_id translation ──
//
// Non-URL, non-sentinel agent_ids translate to (DEFAULT_BEACH, encoded-block).
// The translation preserves the user's intent — bare-name handles, sed:
// collectives, grain: pairs all live as siblings at the shared default beach,
// distinguished by block name.

export interface TranslatedAddress {
  agent_id: string;     // URL of the beach (or "pscale")
  block: string;        // block name on the beach
  translated: boolean;  // true if a translation actually happened
  original: { agent_id: string; block: string };
}

/**
 * Resolve any agent_id form to a (beach_url, block_name) pair the storage
 * layer can act on. URL agent_id passes through. "pscale" passes through.
 * Everything else translates to the default beach with the agent_id encoded
 * into the block name per substrate convention.
 */
export function translateAddress(agentId: string, blockName: string): TranslatedAddress {
  const original = { agent_id: agentId, block: blockName };
  if (isFederatedOwner(agentId)) {
    return { agent_id: agentId, block: blockName, translated: false, original };
  }
  if (isSentinelOwner(agentId)) {
    return { agent_id: agentId, block: blockName, translated: false, original };
  }
  if (agentId.startsWith('sed:')) {
    // Sed: collective lives at the default beach as block "sed:<collective>".
    // The block argument is dropped — sed: blocks are self-naming.
    return { agent_id: DEFAULT_BEACH, block: agentId, translated: true, original };
  }
  if (agentId.startsWith('grain:')) {
    // Grain pair lives at the default beach as block "grain:<pair_id>".
    return { agent_id: DEFAULT_BEACH, block: agentId, translated: true, original };
  }
  // Bare name → role:<handle> convention at the default beach. Idempotent:
  // a caller who already passes the suffixed form (agent_id "fenn", block
  // "witnessed:fenn") means the same block — re-suffixing would mint a phantom
  // "witnessed:fenn:fenn" and the trail written there silently vanishes from
  // every suffix-correct read (caught by the P2 npc-turn forensic, 2026-07-03).
  // The ":" boundary keeps prefix-colliding handles safe ("witnessed:maren"
  // does not end with ":ren").
  const alreadySuffixed = blockName === agentId || blockName.endsWith(`:${agentId}`);
  return {
    agent_id: DEFAULT_BEACH,
    block: alreadySuffixed ? blockName : `${blockName}:${agentId}`,
    translated: true,
    original,
  };
}

// ── URL canonicalisation ──

/**
 * Canonicalise a URL to its origin form per protocol §2.1:
 *   - Lowercase scheme and host
 *   - Strip default ports (:443/:80)
 *   - Drop fragments and query
 *   - Strip trailing slash
 *
 * Path-based world routes (pscale-beach proposal 2026-07-18): a single
 * /w/<world> path segment names an isolated world namespace at the host and
 * is part of the beach origin — preserved, lowercased. Any other path is not
 * an origin component and strips as before; an invalid world label folds to
 * the bare host, mirroring the beach handler's own fold-to-apex.
 */
const WORLD_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
export function canonicaliseOrigin(rawUrl: string): string {
  const url = new URL(rawUrl);
  const scheme = url.protocol.toLowerCase();
  const host = url.hostname.toLowerCase();
  const port = url.port;
  const isDefaultPort =
    (scheme === 'https:' && (port === '' || port === '443')) ||
    (scheme === 'http:' && (port === '' || port === '80'));
  const portPart = isDefaultPort ? '' : `:${port}`;
  const m = url.pathname.match(/^\/w\/([A-Za-z0-9-]{1,64})\/?$/);
  const label = m ? m[1].toLowerCase() : null;
  const worldPart = label && WORLD_LABEL_RE.test(label) ? `/w/${label}` : '';
  return `${scheme}//${host}${portPart}${worldPart}`;
}

function beachEndpoint(origin: string, blockName: string): string {
  return `${origin}/.well-known/pscale-beach?block=${encodeURIComponent(blockName)}`;
}

/**
 * Beach endpoint URL with canonical wire parameters. When spindle or pscale
 * are provided, the beach (if upgraded to the canonical model) returns the
 * shape-resolved bsp() result directly instead of raw JSON for the client
 * to walk. This is the wire-level (B, S, P) loop the substrate was designed
 * for — surgical reads, no whole-block transfers for narrow queries.
 *
 * Legacy beaches that don't honour ?pscale= will fall back to returning
 * raw JSON; the caller can detect this (response has no `shape` field) and
 * walk locally.
 */
function beachEndpointCanonical(
  origin: string,
  blockName: string,
  spindle: string | null,
  pscale: number | null,
): string {
  const params: string[] = [`block=${encodeURIComponent(blockName)}`];
  if (spindle != null && spindle !== '') {
    params.push(`spindle=${encodeURIComponent(spindle)}`);
  }
  if (pscale != null) {
    params.push(`pscale=${encodeURIComponent(String(pscale))}`);
  }
  return `${origin}/.well-known/pscale-beach?${params.join('&')}`;
}

// ── Federated beach adapter (HTTP) ──

const BEACH_TIMEOUT_MS = parseInt(process.env.BEACH_TIMEOUT_MS || '8000', 10);

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BEACH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// ── Origin resolution (bare → beach.<host> fallback) ──
//
// Operators commonly deploy pscale-beach at a `beach.` subdomain rather than
// wiring /.well-known on their primary site. When a caller passes the bare
// domain (e.g. https://idiothuman.com) and that host is not federated, the
// resolver retries against `beach.<host>` once before giving up.
//
// Probe order is documented in docs/protocol-pscale-beach-v2.md §2.7.
// Positive resolutions are cached for the process lifetime; negatives are not
// cached so a later beach deploy at the same host resolves on next call.

const FEDERATION_RESOLUTION_CACHE = new Map<string, string>();

async function probeOriginOk(origin: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${origin}/.well-known/pscale-beach`, {
      headers: { Accept: 'application/json' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

function beachSubdomainOf(canonical: string): string | null {
  const url = new URL(canonical);
  const host = url.hostname;
  if (host.startsWith('beach.')) return null;
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':')) return null;
  const portPart = url.port ? `:${url.port}` : '';
  // A /w/<world> route rides the fallback too — the world lives at whichever
  // host answers, so the path must not be dropped when trying beach.<host>.
  const pathPart = url.pathname !== '/' ? url.pathname : '';
  return `${url.protocol}//beach.${host}${portPart}${pathPart}`;
}

/**
 * Resolve the actual federation origin for a URL agent_id. Probes the bare
 * host first; on failure, retries against `beach.<host>` once (the conventional
 * subdomain shape for pscale-beach deploys). Returns the resolved canonical
 * origin, or null if neither responds.
 */
export async function resolveFederationOrigin(ownerId: string): Promise<string | null> {
  if (!isFederatedOwner(ownerId)) return null;
  const canonical = canonicaliseOrigin(ownerId);
  const cached = FEDERATION_RESOLUTION_CACHE.get(canonical);
  if (cached !== undefined) return cached;

  if (await probeOriginOk(canonical)) {
    FEDERATION_RESOLUTION_CACHE.set(canonical, canonical);
    return canonical;
  }
  const fallback = beachSubdomainOf(canonical);
  if (fallback && await probeOriginOk(fallback)) {
    FEDERATION_RESOLUTION_CACHE.set(canonical, fallback);
    return fallback;
  }
  return null;
}

/**
 * Wire-level canonical read. Sends (spindle, pscale) to the federated beach
 * and returns whatever the beach returns (canonical-shape JSON when the
 * beach supports it, raw block JSON when it doesn't). The caller distinguishes
 * by checking the response — a `shape` field means canonical; otherwise it's
 * legacy JSON and the caller should walk locally.
 *
 * Returns null when the block is not found (404) or the host isn't federated.
 */
export async function loadBspShape(
  ownerId: string,
  blockName: string,
  spindle: string | null,
  pscale: number | null,
): Promise<any | null> {
  const origin = await resolveFederationOrigin(ownerId);
  if (!origin) return null;
  try {
    return await wire.readShape(origin, blockName, spindle, pscale, { timeoutMs: BEACH_TIMEOUT_MS });
  } catch (e: any) {
    throw new Error(`Beach shape read failed (${blockName} at ${origin}): ${e?.message ?? e}`);
  }
}

async function loadBlockFromBeach(ownerId: string, blockName: string): Promise<BlockRow | null> {
  const origin = await resolveFederationOrigin(ownerId);
  if (!origin) return null;
  let block: any;
  try {
    block = await wire.loadBlock(origin, blockName, { timeoutMs: BEACH_TIMEOUT_MS });
  } catch (e: any) {
    throw new Error(`Beach load failed (${blockName} at ${origin}): ${e?.message ?? e}`);
  }
  if (block === null) return null;
  const now = new Date().toISOString();
  return {
    id: `${ownerId}/${blockName}`,
    owner_id: ownerId,
    name: blockName,
    block: (block ?? {}) as Block,
    position_hashes: {},
    created_at: now,
    updated_at: now,
  };
}

/** The derived surface index a beach returns for a no-?block= GET. */
export interface BeachIndex {
  _?: string;
  origin: string;
  blocks: string[];
  /** Optional per-block stored-JSON size in bytes (beaches that serve it) —
   *  the weight read before the block, so a reader picks an aperture before
   *  paying for the read. Absent on beaches that don't provide it. */
  bytes?: Record<string, number>;
}

/**
 * Read a federated beach's derived surface index — the {_, origin, blocks:[…]}
 * a beach returns for a GET with no ?block= parameter. The URL is the surface;
 * this lists the named sibling blocks present at it. Returns null when the host
 * is not federated. This is the tool-side analogue of `curl <origin>/.well-known/
 * pscale-beach` (no ?block=): discovery without leaving bsp().
 */
export async function loadBeachIndex(ownerId: string): Promise<BeachIndex | null> {
  const origin = await resolveFederationOrigin(ownerId);
  if (!origin) return null;
  const parsed: any = await wire.surfaceIndex(origin, { timeoutMs: BEACH_TIMEOUT_MS });
  if (!parsed) return null;
  const bytes =
    parsed?.bytes && typeof parsed.bytes === 'object' && !Array.isArray(parsed.bytes)
      ? Object.fromEntries(
          Object.entries(parsed.bytes as Record<string, unknown>).filter(
            ([, v]) => typeof v === 'number' && Number.isFinite(v),
          ),
        ) as Record<string, number>
      : undefined;
  return {
    _: typeof parsed?._ === 'string' ? parsed._ : undefined,
    origin: typeof parsed?.origin === 'string' ? parsed.origin : origin,
    blocks: Array.isArray(parsed?.blocks) ? parsed.blocks.map(String) : [],
    ...(bytes && Object.keys(bytes).length > 0 ? { bytes } : {}),
  };
}

/**
 * Probe whether a URL hosts a federated beach. Used to disambiguate "block
 * not found at federated host" from "host not federated at all" after a 404
 * on a per-block load. Returns "federated" when the bare /.well-known endpoint
 * responds successfully, "absent" when it 404s or fails.
 */
export async function probeFederation(ownerId: string): Promise<'federated' | 'absent'> {
  const resolved = await resolveFederationOrigin(ownerId);
  return resolved ? 'federated' : 'absent';
}

/**
 * POST an action-shaped body to a federated beach endpoint. Used by
 * substrate-stateful primitives (pscale_settle, pscale_grain_reach) to
 * dispatch atomic state transitions to a site-hosted sed:/grain: substrate.
 * The body shape carries an `action` discriminator; the receiver dispatches
 * on it.
 */
export async function postActionToBeach(
  origin: string,
  blockName: string,
  body: Record<string, any>,
): Promise<any> {
  const resolved = await resolveFederationOrigin(origin);
  if (!resolved) {
    throw new Error(`No beach at ${origin} (also tried beach.<host>). Site is not federated.`);
  }
  const r = await wire.postAction(resolved, blockName, body, { timeoutMs: BEACH_TIMEOUT_MS });
  if (!r.ok) throw new Error(`Beach action rejected: ${r.error}`);
  return r.body;
}

async function saveBlockToBeach(
  ownerId: string,
  blockName: string,
  block: Block,
  opts: WriteOptions = {},
): Promise<BlockRow> {
  const origin = await resolveFederationOrigin(ownerId);
  if (!origin) {
    throw new Error(`No beach at ${ownerId} (also tried beach.<host>). Site is not federated; cannot write.`);
  }
  const userSpindle = opts.spindle;
  const isWholeBlock = !userSpindle || userSpindle === '' || userSpindle === '*';
  const wireOpts = {
    timeoutMs: BEACH_TIMEOUT_MS,
    secret: opts.secret,
    newLock: opts.new_lock,
    gray: opts.gray,
  };
  if (isWholeBlock) {
    // Whole-block replace, read-back confirmed by the wire — the discipline
    // the seat has carried since wake-1 ("a lost write is a lost wake") now
    // holds at this door too; this path previously fired and trusted.
    const r = await wire.saveWhole(origin, blockName, block, wireOpts);
    if (!r.ok) throw new Error(`Beach save rejected: ${r.error}`);
  } else {
    const cleanedSpindle = userSpindle.replace(/\*$/, '');
    const r = await wire.writeAt(origin, blockName, cleanedSpindle, readAt(block, cleanedSpindle), {
      ...wireOpts,
      pscaleAttention: opts.pscale_attention ?? null,
    });
    if (!r.ok) throw new Error(`Beach save rejected: ${r.error}`);
  }
  const now = new Date().toISOString();
  return {
    id: `${ownerId}/${blockName}`,
    owner_id: ownerId,
    name: blockName,
    block,
    position_hashes: {},
    created_at: now,
    updated_at: now,
  };
}

// ── Public adapter primitives ──
//
// loadBlock and saveBlock take an agent_id + block_name pair, translate the
// agent_id, and dispatch. The translation is internal — callers can pass any
// agent_id form and get the right substrate.

export async function loadBlock(ownerId: string, name: string): Promise<BlockRow | null> {
  const t = translateAddress(ownerId, name);
  if (isSentinelOwner(t.agent_id)) {
    return loadSentinelBlock(t.agent_id, t.block);
  }
  return loadBlockFromBeach(t.agent_id, t.block);
}

export async function saveBlock(
  ownerId: string,
  name: string,
  block: Block,
  opts: WriteOptions = {},
): Promise<BlockRow> {
  const t = translateAddress(ownerId, name);
  if (isSentinelOwner(t.agent_id)) {
    throw new Error(`"${t.agent_id}" is a read-only sentinel; the bundled teaching blocks are server-fixed.`);
  }
  return saveBlockToBeach(t.agent_id, t.block, block, opts);
}

/**
 * Append-with-supernest: hand `entry` to the federated beach's append mode. The
 * beach allocates the next free zero-free slot and supernests (wraps {_: old},
 * raising the floor by 1) when the floor fills — atomic, so concurrent appends
 * never race on allocation. THE accumulator write for marks / history / pools.
 * Returns the server-assigned slot. Mirrors saveBlock's translate-then-dispatch.
 *
 * With `spindle`, the append is NODE-SCOPED (ways:grain branch 5): the beach
 * walks to the named node, allocates the next free slot BENEATH it, and
 * supernests THAT NODE when its 1-9 fill — the grain-side conversation (side
 * 2's holder at 2.1, then 2.2, onward) is the named case. The ack then also
 * carries `address` (the landed slot's full address from the block root,
 * single-decimal — "2.3") and `node` (the node's address).
 */
export async function appendToBeach(
  ownerId: string,
  name: string,
  entry: Block,
  secret?: string,
  resolveWindow?: string,
  resolveSeen?: string,
  spindle?: string,
): Promise<{
  slot?: string; supernested?: boolean; floor?: number;
  /** Node-scoped append only: the landed slot's full address from the block root. */
  address?: string;
  /** Node-scoped append only: the address of the node appended beneath. */
  node?: string;
  /** The zero-slot this append made due, when it opened a new span. */
  due?: wire.ZeroSlotDue;
  /** Liquid buffer the beach snapshot-and-cleared with a winning fold claim. */
  cleared?: Block | null;
  alreadyResolved?: boolean; resolvedBy?: string | null; window?: string;
  /** The fold that landed, returned with a stand-down (best-effort). */
  landed?: { slot?: string; entry?: any } | null;
  /** resolve_seen was stale — an intention staged after the folder's read. */
  windowMoved?: boolean; buffer?: Block | null;
}> {
  const t = translateAddress(ownerId, name);
  if (isSentinelOwner(t.agent_id)) {
    throw new Error(`"${t.agent_id}" is a read-only sentinel; cannot append.`);
  }
  const origin = await resolveFederationOrigin(t.agent_id);
  if (!origin) {
    throw new Error(`No beach at ${ownerId} (also tried beach.<host>). Site is not federated; cannot append.`);
  }
  // The wire owns the body (append flag, node-scoped spindle, the resolver
  // fields) and hands the two 409s that are ANSWERS — already_resolved,
  // window_moved — back discriminated; this door reshapes them into its
  // existing return contract.
  const r = await wire.append(origin, t.block, entry, {
    timeoutMs: BEACH_TIMEOUT_MS,
    secret,
    spindle,
    resolveWindow,
    resolveSeen,
  });
  if (r.alreadyResolved) {
    return { alreadyResolved: true, resolvedBy: r.resolvedBy ?? null, window: r.window, landed: r.landed ?? null };
  }
  if (r.windowMoved) {
    return { windowMoved: true, window: r.window, buffer: r.buffer ?? null };
  }
  if (!r.ok) throw new Error(`Beach append rejected: ${r.error}`);
  return { slot: r.slot, supernested: r.supernested, floor: r.floor, address: r.address, node: r.node, due: r.due, cleared: r.cleared ?? null };
}

/**
 * No-op for federated beaches. The lock change rides inside the saveBlock
 * POST body as new_lock + secret; the beach computes and stores the hash.
 * Kept as a function for callsite compatibility — bsp-mcp itself never
 * computes lock hashes anymore.
 */
export async function updatePositionHashes(
  ownerId: string,
  name: string,
  _hashes: Record<string, string>,
): Promise<void> {
  const t = translateAddress(ownerId, name);
  if (isSentinelOwner(t.agent_id)) {
    throw new Error(`"${t.agent_id}" is a read-only sentinel; lock changes rejected.`);
  }
  // Federated: lock change was forwarded inside saveBlock POST body. Nothing
  // for bsp-mcp to do here.
  return;
}

// ── Passport lookup helpers (used by pscale_verify_rider) ──

/**
 * Read an agent's passport block. The handle's passport is at:
 *   - URL agent: (handle, "passport") — handle is the URL itself
 *   - sed:/grain: agent: handle is the namespace; passport at "passport:<handle>" on the default beach
 *   - bare handle: (handle, "passport") — translates to ("passport:<handle>") at default beach
 */
export async function getPassportBlock(agentHandle: string): Promise<Block | null> {
  const row = await loadBlock(agentHandle, 'passport');
  return row ? row.block : null;
}

/**
 * Resolve a sed:, grain:, URL, or bare handle to a passport-shaped block.
 * For sed:<collective>:<position>, returns the registrant's position content
 * (which has the same {_, 1, 2, ...} shape as a passport).
 */
export async function getPassportFromAddress(addr: string): Promise<Block | null> {
  if (addr.startsWith('grain:')) {
    const parts = addr.split(':');
    if (parts.length !== 3) return null;
    const [, pid, side] = parts;
    if (side !== '1' && side !== '2') return null;
    const grainRow = await loadBlock(`grain:${pid}`, 'grain');
    if (!grainRow) return null;
    const sideMap = grainRow.block?.['9'] as Record<string, string> | undefined;
    const underlyingHandle = sideMap?.[side];
    if (!underlyingHandle) return null;
    return getPassportBlock(underlyingHandle);
  }
  if (addr.startsWith('sed:')) {
    const parts = addr.split(':');
    if (parts.length !== 3) return null;
    const [, collective, position] = parts;
    const row = await loadBlock(`sed:${collective}`, collective);
    if (!row) return null;
    // Walk the position digits.
    let node: any = row.block;
    for (const d of position) {
      if (!node || typeof node !== 'object') return null;
      node = node[d];
    }
    if (!node) return null;
    return typeof node === 'string' ? { _: node } : (node as Block);
  }
  return getPassportBlock(addr);
}

/**
 * Get an agent's published public keys from their passport block (address 9).
 */
export async function getPublicKeys(agentHandle: string): Promise<{ x25519: string; ed25519: string } | null> {
  const block = await getPassportBlock(agentHandle);
  if (!block) return null;
  return publicKeysFromSpine(block['9']);
}
