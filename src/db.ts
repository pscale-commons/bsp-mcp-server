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
import sunstone from './sunstone.json' with { type: 'json' };
import whetstone from './whetstone.json' with { type: 'json' };
import agentId from './agent-id.json' with { type: 'json' };
import evolution from './evolution.json' with { type: 'json' };
import manifest from './manifest.json' with { type: 'json' };
import progression from './progression.json' with { type: 'json' };
import blockConventions from './block-conventions.json' with { type: 'json' };
import gatekeeper from './gatekeeper.json' with { type: 'json' };
import softAgent from './soft-agent.json' with { type: 'json' };
import protocolPaywall from './protocol-paywall.json' with { type: 'json' };
import ecologyRouter from './ecology-router.json' with { type: 'json' };

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
  new_lock?: string;
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
const SENTINEL_BLOCKS: Record<string, Block> = {
  'pscale/sunstone': sunstone as unknown as Block,
  'pscale/whetstone': whetstone as unknown as Block,
  'pscale/agent-id': agentId as unknown as Block,
  'pscale/evolution': evolution as unknown as Block,
  'pscale/manifest': manifest as unknown as Block,
  'pscale/progression': progression as unknown as Block,
  'pscale/block-conventions': blockConventions as unknown as Block,
  'pscale/gatekeeper': gatekeeper as unknown as Block,
  'pscale/soft-agent': softAgent as unknown as Block,
  'pscale/protocol-paywall': protocolPaywall as unknown as Block,
  'pscale/ecology-router': ecologyRouter as unknown as Block,
};

export function isSentinelOwner(ownerId: string): boolean {
  return SENTINEL_OWNERS.has(ownerId);
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
  // Bare name → role:<handle> convention at the default beach.
  return {
    agent_id: DEFAULT_BEACH,
    block: `${blockName}:${agentId}`,
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
 */
export function canonicaliseOrigin(rawUrl: string): string {
  const url = new URL(rawUrl);
  const scheme = url.protocol.toLowerCase();
  const host = url.hostname.toLowerCase();
  const port = url.port;
  const isDefaultPort =
    (scheme === 'https:' && (port === '' || port === '443')) ||
    (scheme === 'http:' && (port === '' || port === '80'));
  const portPart = isDefaultPort ? '' : `:${port}`;
  return `${scheme}//${host}${portPart}`;
}

function beachEndpoint(origin: string, blockName: string): string {
  return `${origin}/.well-known/pscale-beach?block=${encodeURIComponent(blockName)}`;
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
  return `${url.protocol}//beach.${host}${portPart}`;
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

async function loadBlockFromBeach(ownerId: string, blockName: string): Promise<BlockRow | null> {
  const origin = await resolveFederationOrigin(ownerId);
  if (!origin) return null;
  const url = beachEndpoint(origin, blockName);
  let res: Response;
  try {
    res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
  } catch (e: any) {
    throw new Error(`Beach fetch failed (${url}): ${e?.message ?? e}`);
  }
  if (res.status === 404) return null;
  if (!res.ok) {
    let detail = '';
    try { detail = ' — ' + (await res.text()).slice(0, 200); } catch {}
    throw new Error(`Beach load failed (${res.status} ${res.statusText})${detail}`);
  }
  let block: any;
  try {
    block = await res.json();
  } catch (e: any) {
    throw new Error(`Beach response was not JSON: ${e?.message ?? e}`);
  }
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
 * substrate-stateful primitives (pscale_register, pscale_grain_reach) to
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
  const url = beachEndpoint(resolved, blockName);
  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    throw new Error(`Beach action POST failed (${url}): ${e?.message ?? e}`);
  }
  let parsed: any;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }
  if (!res.ok) {
    const reason = parsed?.error ?? `${res.status} ${res.statusText}`;
    throw new Error(`Beach action rejected: ${reason}`);
  }
  return parsed;
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
  const url = beachEndpoint(origin, blockName);
  const userSpindle = opts.spindle;
  const isWholeBlock = !userSpindle || userSpindle === '' || userSpindle === '*';
  const body: Record<string, any> = {};
  if (isWholeBlock) {
    body.spindle = '';
    body.pscale_attention = null;
    body.content = block;
    body.confirm = true;
  } else {
    const cleanedSpindle = userSpindle.replace(/\*$/, '');
    body.spindle = cleanedSpindle;
    body.pscale_attention = opts.pscale_attention ?? null;
    body.content = readAt(block, cleanedSpindle);
  }
  if (opts.secret !== undefined) body.secret = opts.secret;
  if (opts.new_lock !== undefined) body.new_lock = opts.new_lock;
  if (opts.gray !== undefined) body.gray = opts.gray;

  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    throw new Error(`Beach POST failed (${url}): ${e?.message ?? e}`);
  }
  if (!res.ok) {
    let errMsg = `Beach save rejected (${res.status} ${res.statusText})`;
    try {
      const txt = await res.text();
      try {
        const parsed = JSON.parse(txt);
        if (parsed?.error) errMsg = `Beach save rejected: ${parsed.error}`;
      } catch {
        if (txt) errMsg += ` — ${txt.slice(0, 200)}`;
      }
    } catch {}
    throw new Error(errMsg);
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
  const keys = block['9'];
  if (!keys || typeof keys !== 'object' || !keys.x25519 || !keys.ed25519) return null;
  return { x25519: keys.x25519, ed25519: keys.ed25519 };
}
