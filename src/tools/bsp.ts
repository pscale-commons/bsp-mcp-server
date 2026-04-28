/**
 * tools/bsp.ts — the unified bsp() MCP tool handler.
 *
 * One function. Read when content is null. Write when content is provided.
 * Substrate dispatch is implicit via the agent_id prefix:
 *   sed:{collective} / grain:{pair_id} / bare agent_id.
 *
 * Locks are checked before write. Face/tier modifiers are accepted as
 * parameters for forward compatibility but treated as advisory in v0.1
 * (logged, not enforced — full enforcement requires the face-tier matrix
 * and sed:-collective membership checks; deferred to v0.2).
 */

import { z } from 'zod';
import { Block } from '../bsp.js';
import {
  bspRead,
  bspWrite,
  formatRead,
  formatWrite,
  BspReadResult,
  BspWriteResult,
} from '../bsp-fn.js';
import { loadBlock, saveBlock, BlockRow } from '../db.js';
import { hashByOwnerId } from '../locks.js';

// ── Schemas ──

export const bspParamsSchema = {
  agent_id: z
    .string()
    .describe('Caller identity. Can be a bare agent_id ("weft"), a sed: collective ("sed:commons"), or a grain pair ("grain:abc123def456")'),
  block: z
    .string()
    .describe('Block name within the agent_id\'s storage. For sed: addresses this is usually the collective name; for grain: it is "grain"; for bare agents it is whatever the agent named the block.'),
  spindle: z
    .string()
    .nullable()
    .optional()
    .describe('Address path (S). Empty string or null walks the root. Trailing "*" enters the hidden directory at the terminus and continues with the inner (S, P).'),
  pscale_attention: z
    .number()
    .int()
    .nullable()
    .optional()
    .describe('Depth selector (P). Together with spindle, derives selection shape — point (P==P_end), ring (P==P_end-1), subtree (P<P_end-1), disc (spindle empty), whole-block (both empty).'),
  content: z
    .any()
    .optional()
    .describe('Payload for writes. Shape MUST match the shape derived from (spindle, pscale_attention). Omit for reads.'),
  secret: z
    .string()
    .optional()
    .describe('Write-lock proof. Required when writing to a locked position (sed: registrant, grain: side, locked ordinary block).'),
  gray: z
    .boolean()
    .optional()
    .describe('Explicit opt-in for self-encryption on unlocked ordinary blocks. Default false.'),
  face: z
    .enum(['character', 'author', 'designer', 'observer'])
    .optional()
    .describe('CADO access modifier. Validated against sed: collective membership. Advisory in v0.1; enforced in v0.2.'),
  tier: z
    .enum(['soft', 'medium', 'hard'])
    .optional()
    .describe('SMH aperture modifier. Composes with face per the face-tier matrix. Advisory in v0.1; enforced in v0.2.'),
};

export type BspToolParams = {
  agent_id: string;
  block: string;
  spindle?: string | null;
  pscale_attention?: number | null;
  content?: any;
  secret?: string;
  gray?: boolean;
  face?: 'character' | 'author' | 'designer' | 'observer';
  tier?: 'soft' | 'medium' | 'hard';
};

// ── Lock verification ──

/**
 * Verify the secret matches the position lock for the given block row.
 * Empty position_hashes = no lock, allowed.
 *
 * For ordinary blocks the lock lives at position_hashes['_'] (whole-block).
 * For sed: blocks the lock lives at position_hashes['{position}'].
 * For grain: blocks the lock lives at position_hashes['{side}'].
 */
function verifyLock(
  row: BlockRow,
  position: string,
  secret: string | undefined,
): { allowed: boolean; reason?: string } {
  // Determine which lock key applies.
  let lockKey: string;
  if (row.owner_id.startsWith('sed:')) {
    // sed: per-position locks. The position parameter (the spindle root) is the key.
    lockKey = position === '_' ? '_' : position;
  } else if (row.owner_id.startsWith('grain:')) {
    // grain: per-side locks. The side digit is the key.
    lockKey = position === '_' ? '_' : position;
  } else {
    // Ordinary block: whole-block lock at '_'.
    lockKey = '_';
  }

  const stored = row.position_hashes?.[lockKey];
  if (!stored) return { allowed: true };
  if (!secret) {
    return { allowed: false, reason: `"${row.owner_id}/${row.name}" position "${lockKey}" is locked. Provide secret.` };
  }
  const computed = hashByOwnerId(row.owner_id, row.name, lockKey, secret);
  if (computed !== stored) {
    return { allowed: false, reason: 'Secret does not match position lock.' };
  }
  return { allowed: true };
}

/**
 * Determine which lock position a write would touch, based on the spindle.
 * For empty spindle (whole-block / disc) returns '_'. Otherwise returns the
 * spindle as the position key (matches sed: registration convention).
 */
function lockPositionForWrite(spindle: string | null | undefined): string {
  if (!spindle || spindle === '') return '_';
  return spindle.replace(/\*$/, '');
}

// ── The handler ──

export async function handleBsp(params: BspToolParams): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { agent_id, block: blockName, spindle, pscale_attention, content, secret, face, tier } = params;

  // v0.1: face/tier advisory only (logged, not enforced).
  if (face || tier) {
    console.error(`[bsp] face=${face} tier=${tier} advisory (v0.1 — enforcement deferred)`);
  }

  // Load (or create on write) the block.
  let row: BlockRow | null = await loadBlock(agent_id, blockName);

  if (content === undefined) {
    // ── READ ──
    if (!row) {
      return {
        content: [{ type: 'text', text: `Block "${agent_id}/${blockName}" not found.` }],
      };
    }
    const result = bspRead(row.block, spindle ?? '', pscale_attention ?? null);
    return {
      content: [{ type: 'text', text: formatRead(result) }],
    };
  }

  // ── WRITE ──
  // Lock check before geometry.
  if (row) {
    const position = lockPositionForWrite(spindle);
    const check = verifyLock(row, position, secret);
    if (!check.allowed) {
      return {
        content: [{ type: 'text', text: `Write rejected: ${check.reason}` }],
      };
    }
  }

  // Determine starting block — load existing or seed empty.
  const block: Block = row?.block ?? {};

  // Apply the write.
  let writeResult: BspWriteResult;
  try {
    writeResult = bspWrite(block, spindle ?? '', pscale_attention ?? null, content);
  } catch (e: any) {
    return {
      content: [{ type: 'text', text: `Write rejected: ${e.message}` }],
    };
  }

  // Persist.
  await saveBlock(agent_id, blockName, writeResult.block, row?.block_type ?? 'general');

  return {
    content: [{ type: 'text', text: formatWrite(writeResult) }],
  };
}
