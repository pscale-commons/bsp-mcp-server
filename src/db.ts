/**
 * db.ts — storage adapter for the bsp-mcp.
 *
 * The membrane between the geometry and the substrate. Above this line: BSP
 * operates on JSON. Below this line: persistence (Supabase, filesystem,
 * in-memory). Geometry is invariant; storage is variant.
 *
 * Same Supabase project as pscale-mcp-server. Same blocks, same agents,
 * same passphrases, same grains. Interoperability is at the data layer.
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

// ── Adapter primitives — load_block, save_block, locks ──

export async function loadBlock(ownerId: string, name: string): Promise<BlockRow | null> {
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
): Promise<BlockRow> {
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
  const { error } = await getClient()
    .from('pscale_blocks')
    .update({ position_hashes: hashes, updated_at: new Date().toISOString() })
    .eq('owner_id', ownerId)
    .eq('name', name);
  if (error) throw new Error(`DB error: ${error.message}`);
}

export async function listBlocks(ownerId: string): Promise<BlockRow[]> {
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
