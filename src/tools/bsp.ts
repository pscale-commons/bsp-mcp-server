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
import { Block, writeAt } from '../bsp.js';
import {
  bspRead,
  bspWrite,
  formatRead,
  formatWrite,
  BspReadResult,
  BspWriteResult,
} from '../bsp-fn.js';
import { loadBlock, saveBlock, updatePositionHashes, BlockRow, isFederatedOwner, canonicaliseOrigin } from '../db.js';
import { hashByOwnerId } from '../locks.js';
import { selfEncrypt, decryptBlockNodes } from '../keys.js';

// ── Gray-encryption helpers (Stage 10) ──

/**
 * Serialise a write payload into a string for gray self-encryption.
 *
 * Strings pass through verbatim. Objects, arrays, and primitives are
 * JSON-stringified so they can survive the round-trip through the gray
 * envelope's ciphertext. The decrypt path returns the raw string; callers
 * that produced structured payloads are responsible for re-parsing on read
 * (the substrate doesn't track input shape beyond the envelope wrapper).
 */
function stringifyForGray(content: any): string {
  if (typeof content === 'string') return content;
  return JSON.stringify(content);
}

// ── Schemas ──

export const bspParamsSchema = {
  agent_id: z
    .string()
    .describe('Addressed namespace — substrate dispatched by prefix. Four substrate forms: bare name ("weft") → bsp-mcp commons (pscale_blocks table); "sed:<collective>" ("sed:commons") → sedimentary substrate; "grain:<pair_id>" ("grain:abc123def456") → grain substrate; URL ("https://happyseaurchin.com") → federated beach at <origin>/.well-known/pscale-beach via the WellKnownAdapter (db.ts:isFederatedOwner). The URL form requires the scheme — "happyseaurchin.com" without "https://" is treated as a bare name and routes to the commons. Plus one reserved sentinel: agent_id="pscale" exposes the server\'s bundled teaching blocks (block="manifest" lists what is available; block="sunstone" teaches geometry; block="whetstone" is the operational reference; block="agent-id" is the addressing model; block="evolution" is the five-level ecosystem map) — all read-only, walked through bsp() like any other block. A fresh LLM\'s recommended first call: bsp(agent_id="pscale", block="manifest"). A single caller addresses multiple agent_ids in normal use — e.g. their own passport at "weft" AND their federated beach at "https://example.com". Authority to write is proven by the `secret` param, independent of agent_id.'),
  block: z
    .string()
    .describe('Block name within the agent_id\'s storage. For sed: addresses this is usually the collective name; for grain: it is "grain"; for URL addresses it is conventionally "beach" (a site-hosted sibling block is selected via the standard `block` param, which the WellKnownAdapter forwards as ?block=<name>); for bare agents it is whatever the agent named the block.'),
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
    .describe('Proof of current authority. Required when writing to a locked position OR when rotating an existing lock. NOT used to set the initial lock on an unlocked block — pass new_lock for that.'),
  new_lock: z
    .string()
    .optional()
    .describe('Target lock value. Sets or rotates the write-lock at the addressed position. Four cases: (1) block does not exist + new_lock → create locked, no secret needed; (2) block unlocked + new_lock → lock with new_lock, no secret needed; (3) block locked + secret + new_lock → rotate from current to new_lock (secret proves current authority); (4) without new_lock, lock state is unchanged. Only valid on ordinary blocks — sed: blocks use pscale_register, grain: blocks use pscale_grain_reach.'),
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
  new_lock?: string;
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

/**
 * Four-rule semantics for content + new_lock interaction:
 *   (R1) Block doesn't exist + new_lock     → create locked at new_lock, no secret needed.
 *   (R2) Block unlocked       + new_lock     → set lock to new_lock, no secret needed.
 *   (R3) Block locked         + secret       → secret proves current authority for content writes.
 *   (R4) Block locked         + secret + new_lock → rotate current→new_lock (with optional content).
 *
 * `secret` is ALWAYS proof of current authority. Never the initial lock value.
 * `new_lock` is ALWAYS the target lock value. Never used as proof.
 *
 * sed:/grain: blocks reject new_lock — they have their own lifecycle tools
 * (pscale_register, pscale_grain_reach) which handle position-and-lock atomically.
 */
export async function handleBsp(params: BspToolParams): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { agent_id, block: blockName, spindle, pscale_attention, content, secret, new_lock, face, tier } = params;

  if (face || tier) {
    console.error(`[bsp] face=${face} tier=${tier} advisory (v0.1 — enforcement deferred)`);
  }

  let row: BlockRow | null = await loadBlock(agent_id, blockName);

  // ── READ ── (no content, no lock change)
  if (content === undefined && new_lock === undefined) {
    if (!row) {
      if (isFederatedOwner(agent_id)) {
        const origin = canonicaliseOrigin(agent_id);
        return {
          content: [{
            type: 'text',
            text: `No beach at ${origin}/.well-known/pscale-beach (404). The site is not federated. Alternatives: try the commons by bare name (bsp(agent_id="<bare-name>", ...)) or consult a known federated-beach list.`,
          }],
        };
      }
      return { content: [{ type: 'text', text: `Block "${agent_id}/${blockName}" not found.` }] };
    }
    // Stage 10 — when secret is provided on a read, walk the block through
    // decryptBlockNodes so any _gray envelopes anywhere in the tree are
    // rehydrated to plaintext before bspRead computes the requested shape.
    // Without a secret, the raw envelope passes through unchanged (existing
    // behaviour preserved — peer reads see opaque envelopes).
    const blockForRead = secret
      ? await decryptBlockNodes(row.block, secret, agent_id)
      : row.block;
    const result = bspRead(blockForRead, spindle ?? '', pscale_attention ?? null);
    return { content: [{ type: 'text', text: formatRead(result) }] };
  }

  // ── WRITE and/or LOCK ──

  // new_lock is only valid on ordinary blocks.
  if (new_lock !== undefined && (agent_id.startsWith('sed:') || agent_id.startsWith('grain:'))) {
    return {
      content: [{ type: 'text', text: `Rejected: new_lock is only valid on ordinary blocks. sed: blocks use pscale_register; grain: blocks use pscale_grain_reach.` }],
    };
  }

  // Lock check for content writes (R3, R4).
  if (content !== undefined && row) {
    const position = lockPositionForWrite(spindle);
    const check = verifyLock(row, position, secret);
    if (!check.allowed) {
      return { content: [{ type: 'text', text: `Write rejected: ${check.reason}` }] };
    }
  }

  // Lock-rotation authority (R4): if block has a current lock and new_lock is set,
  // secret must prove current authority.
  if (new_lock !== undefined && row) {
    const lockKey = '_'; // ordinary blocks: whole-block lock at '_'
    const currentHash = row.position_hashes?.[lockKey];
    if (currentHash) {
      // Locked → secret required to rotate.
      if (!secret) {
        return {
          content: [{ type: 'text', text: `Lock rotation rejected: block is currently locked. Pass secret to prove current authority.` }],
        };
      }
      const computedCurrent = hashByOwnerId(agent_id, blockName, lockKey, secret);
      if (computedCurrent !== currentHash) {
        return {
          content: [{ type: 'text', text: `Lock rotation rejected: secret does not match current lock.` }],
        };
      }
    }
    // R1, R2: no current lock → no secret needed for new_lock.
  }

  // Determine starting block — existing or empty seed.
  const block: Block = row?.block ?? {};

  // Apply content write if provided.
  let writeResult: BspWriteResult | null = null;
  if (content !== undefined) {
    // Stage 10 — gray-encryption: encrypt-at-source, write the envelope object
    // directly at the target position, bypassing bspWrite's shape strictness.
    // The envelope is structurally an object {_gray, nonce, ciphertext}; it
    // substitutes for the typed payload at any shape (point/ring/subtree alike).
    // Lock and gray are orthogonal: the lock check above (R3) already authorised
    // the writer if locked; secret here doubles as the encryption key.
    if (params.gray === true) {
      if (!secret) {
        return {
          content: [{ type: 'text', text: 'Write rejected: gray=true requires secret (used as encryption key).' }],
        };
      }
      if (!spindle || spindle === '') {
        return {
          content: [{ type: 'text', text: 'Write rejected: gray=true requires a non-empty spindle (gray-encrypt at a leaf, not the whole block).' }],
        };
      }
      try {
        const envelope = await selfEncrypt(stringifyForGray(content), secret, agent_id);
        // writeAt walks the spindle and stuffs the envelope object at the leaf.
        // It accepts any value type — bypasses the point/ring/subtree shape check
        // that would otherwise reject an object payload at point shape.
        writeAt(block, spindle, envelope);
        writeResult = {
          shape: 'point',
          written: true,
          block,
          spindle: String(spindle),
          pscale_attention: pscale_attention ?? null,
        };
      } catch (e: any) {
        return { content: [{ type: 'text', text: `Write rejected: gray-encryption failed (${e?.message ?? String(e)})` }] };
      }
    } else {
      try {
        writeResult = bspWrite(block, spindle ?? '', pscale_attention ?? null, content);
      } catch (e: any) {
        return { content: [{ type: 'text', text: `Write rejected: ${e.message}` }] };
      }
    }
  }

  // Persist content (or seed empty block if locking-only on a new block).
  // For federated beaches (owner_id is a URL), saveBlock forwards the spindle,
  // pscale_attention, secret, new_lock, and gray to the remote /.well-known
  // endpoint as the POST body — the remote handles auth + lock state.
  const blockToSave = writeResult?.block ?? block;
  try {
    await saveBlock(
      agent_id,
      blockName,
      blockToSave,
      row?.block_type ?? 'general',
      {
        spindle: spindle ?? '',
        pscale_attention: pscale_attention ?? null,
        secret,
        new_lock: params.new_lock,
        gray: params.gray,
      },
    );
  } catch (e: any) {
    return { content: [{ type: 'text', text: `Write rejected: ${e?.message ?? String(e)}` }] };
  }

  // Apply lock change if provided.
  let lockNote = '';
  if (new_lock !== undefined) {
    const lockKey = '_';
    const newHash = hashByOwnerId(agent_id, blockName, lockKey, new_lock);
    const updated = { ...(row?.position_hashes ?? {}), [lockKey]: newHash };
    await updatePositionHashes(agent_id, blockName, updated);
    const wasLocked = !!row?.position_hashes?.['_'];
    lockNote = wasLocked
      ? `\nLock rotated.`
      : (row ? `\nLock applied (block previously unlocked).` : `\nBlock created and locked.`);
  }

  // Format response.
  if (writeResult) {
    return { content: [{ type: 'text', text: formatWrite(writeResult) + lockNote }] };
  }
  // Lock-only operation.
  return { content: [{ type: 'text', text: `[lock @ "${agent_id}/${blockName}"]${lockNote}` }] };
}
