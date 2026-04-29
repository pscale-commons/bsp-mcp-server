/**
 * db.ts — storage adapter for the bsp-mcp.
 *
 * The membrane between the geometry and the substrate. Above this line: BSP
 * operates on JSON. Below this line: persistence — Supabase (commons) or a
 * remote /.well-known/pscale-beach (federated). Geometry is invariant;
 * storage is variant.
 *
 * Dispatch by owner_id prefix:
 *   sed:{collective} / grain:{pair_id} / bare agent_id  → Supabase commons
 *   https?://{origin}                                    → federated beach
 *
 * Same Supabase project as pscale-mcp-server. Same blocks, same agents,
 * same passphrases, same grains. Interoperability is at the data layer.
 *
 * Federation per docs/protocol-pscale-beach-v2.md:
 *   GET  https://<origin>/.well-known/pscale-beach[?block=<name>]
 *   POST https://<origin>/.well-known/pscale-beach[?block=<name>]
 *        body: { spindle, pscale_attention?, content, secret?, new_lock?, gray? }
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Block } from './bsp.js';
import { bspRead } from './bsp-fn.js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://piqxyfmzzywxzqkzmpmm.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

let client: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
  if (!client) {
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required');
    }
    client = createClient(supabaseUrl, supabaseKey);
  }
  return client;
}

// ── Block row ──

export interface BlockRow {
  id: string;
  owner_id: string;
  name: string;
  block_type: string;
  block: Block;
  position_hashes: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// ── Write options (for federated POST passthrough) ──

/**
 * Optional write parameters that pass through to a federated beach via the
 * /.well-known POST body. For Supabase-backed owners these are ignored —
 * locks are validated locally before saveBlock is called, and lock changes
 * happen via updatePositionHashes. For federated owners, the remote site
 * validates secret and applies new_lock server-side.
 */
export interface WriteOptions {
  spindle?: string | null;
  pscale_attention?: number | null;
  secret?: string;
  new_lock?: string;
  gray?: boolean;
}

// ── URL-prefix dispatch helpers ──

const URL_PREFIX_RE = /^https?:\/\//i;

/** True if the owner_id is a URL — federated beach storage applies. */
export function isFederatedOwner(ownerId: string): boolean {
  return URL_PREFIX_RE.test(ownerId);
}

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

function beachEndpoint(ownerId: string, blockName: string): string {
  const origin = canonicaliseOrigin(ownerId);
  const url = `${origin}/.well-known/pscale-beach`;
  if (blockName !== 'beach') {
    return `${url}?block=${encodeURIComponent(blockName)}`;
  }
  return url;
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

async function loadBlockFromBeach(ownerId: string, blockName: string): Promise<BlockRow | null> {
  const url = beachEndpoint(ownerId, blockName);
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
  // Synthesise a BlockRow shape. position_hashes is intentionally empty —
  // remote beaches manage their own locks; bsp-mcp's local verifyLock will
  // see an empty map and pass through, leaving authority to the remote.
  const now = new Date().toISOString();
  return {
    id: `${ownerId}/${blockName}`,
    owner_id: ownerId,
    name: blockName,
    block_type: 'beach',
    block: (block ?? {}) as Block,
    position_hashes: {},
    created_at: now,
    updated_at: now,
  };
}

async function saveBlockToBeach(
  ownerId: string,
  blockName: string,
  block: Block,
  opts: WriteOptions = {},
): Promise<BlockRow> {
  const url = beachEndpoint(ownerId, blockName);
  // bsp-mcp follows the dumb-beach model: GET → local bspWrite → POST whole
  // modified block. The user's original spindle/pscale_attention has already
  // been applied to `block` before saveBlock was called, so the federated
  // POST always uses spindle="" (whole-block replace). Sending the user's
  // spindle alongside the whole block would corrupt the receiver — they'd
  // try to point-write the whole block at that spindle.
  const body: Record<string, any> = {
    spindle: '',
    pscale_attention: null,
    content: block,
  };
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
    block_type: 'beach',
    block,
    position_hashes: {},
    created_at: now,
    updated_at: now,
  };
}

// ── Adapter primitives — load_block, save_block, locks ──

export async function loadBlock(ownerId: string, name: string): Promise<BlockRow | null> {
  if (isFederatedOwner(ownerId)) {
    return loadBlockFromBeach(ownerId, name);
  }
  const { data, error } = await getClient()
    .from('pscale_blocks')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('name', name)
    .single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw new Error(`DB error: ${error.message}`);
  return data as BlockRow;
}

export async function saveBlock(
  ownerId: string,
  name: string,
  block: Block,
  blockType: string = 'general',
  opts: WriteOptions = {},
): Promise<BlockRow> {
  if (isFederatedOwner(ownerId)) {
    return saveBlockToBeach(ownerId, name, block, opts);
  }
  const { data, error } = await getClient()
    .from('pscale_blocks')
    .upsert(
      {
        owner_id: ownerId,
        name,
        block_type: blockType,
        block,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id,name' },
    )
    .select()
    .single();
  if (error) throw new Error(`DB error: ${error.message}`);
  return data as BlockRow;
}

export async function updatePositionHashes(
  ownerId: string,
  name: string,
  hashes: Record<string, string>,
): Promise<void> {
  if (isFederatedOwner(ownerId)) {
    // Federated beaches manage their own locks. The lock change was
    // forwarded inside the saveBlock POST body (as new_lock + secret).
    return;
  }
  const { error } = await getClient()
    .from('pscale_blocks')
    .update({ position_hashes: hashes, updated_at: new Date().toISOString() })
    .eq('owner_id', ownerId)
    .eq('name', name);
  if (error) throw new Error(`DB error: ${error.message}`);
}

export async function listBlocks(ownerId: string): Promise<BlockRow[]> {
  if (isFederatedOwner(ownerId)) {
    throw new Error('listBlocks is not supported on federated beaches.');
  }
  const { data, error } = await getClient()
    .from('pscale_blocks')
    .select('*')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`DB error: ${error.message}`);
  return (data || []) as BlockRow[];
}

// ── Address resolution for cross-substrate passport lookup ──

export async function getPassportBlock(agentId: string): Promise<Block | null> {
  const row = await loadBlock(agentId, 'passport');
  return row ? row.block : null;
}

/**
 * Resolve a sed:, grain:, or bare agent address to a passport-shaped block.
 * Substrate dispatch via the address prefix.
 */
export async function getPassportFromAddress(addr: string): Promise<Block | null> {
  if (addr.startsWith('grain:')) {
    const parts = addr.split(':');
    if (parts.length !== 3) return null;
    const [, pairId, side] = parts;
    if (side !== '1' && side !== '2') return null;
    const grainRow = await loadBlock(`grain:${pairId}`, 'grain');
    if (!grainRow) return null;
    const sideMap = grainRow.block?.['9'] as Record<string, string> | undefined;
    const underlying = sideMap?.[side];
    if (!underlying) return null;
    return getPassportBlock(underlying);
  }
  if (addr.startsWith('sed:')) {
    const parts = addr.split(':');
    if (parts.length !== 3) return null;
    const [, collective, position] = parts;
    const row = await loadBlock(`sed:${collective}`, collective);
    if (!row) return null;
    const result = bspRead(row.block, position, null);
    // Subtree → return as passport
    if (result.shape === 'subtree' && result.subtree) {
      return typeof result.subtree === 'string'
        ? { _: result.subtree }
        : (result.subtree as Block);
    }
    if (result.shape === 'point' && result.point) {
      return { _: result.point };
    }
    return null;
  }
  return getPassportBlock(addr);
}

/**
 * Get an agent's published public keys from their passport block (address 9).
 */
export async function getPublicKeys(agentId: string): Promise<{ x25519: string; ed25519: string } | null> {
  const block = await getPassportBlock(agentId);
  if (!block) return null;
  const keys = block['9'];
  if (!keys || typeof keys !== 'object' || !keys.x25519 || !keys.ed25519) return null;
  return { x25519: keys.x25519, ed25519: keys.ed25519 };
}
