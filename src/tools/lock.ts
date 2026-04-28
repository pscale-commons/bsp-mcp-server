/**
 * tools/lock.ts — pscale_lock_block primitive.
 *
 * Lock an ordinary block (or rotate the lock). sed:/grain: blocks are locked
 * via their own lifecycle tools (create_collective, register, grain_reach).
 * Whole-block lock at position_hashes['_'] is enough for sovereign shells in V1.
 */

import { z } from 'zod';
import { loadBlock, updatePositionHashes } from '../db.js';
import { hashBlockPassphrase } from '../locks.js';

export const lockBlockParamsSchema = {
  agent_id: z.string().describe('The block\'s owner agent_id (must not be sed: or grain:)'),
  block: z.string().describe('The block name'),
  secret: z.string().describe('New write-lock secret. Hashed and stored. Sensitive.'),
  current_secret: z.string().optional().describe('Required when rotating an existing lock. Verifies you own the current lock.'),
};

export async function handleLockBlock(params: {
  agent_id: string;
  block: string;
  secret: string;
  current_secret?: string;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { agent_id, block, secret, current_secret } = params;

  if (agent_id.startsWith('sed:') || agent_id.startsWith('grain:') ||
      block.startsWith('sed:') || block.startsWith('grain:')) {
    return {
      content: [{
        type: 'text',
        text: `Locking is only for ordinary blocks. sed:/grain: blocks have their own lifecycle.`,
      }],
    };
  }

  const row = await loadBlock(agent_id, block);
  if (!row) {
    return { content: [{ type: 'text', text: `Block "${agent_id}/${block}" not found.` }] };
  }

  const existingHash = row.position_hashes?.['_'];
  if (existingHash) {
    if (!current_secret) {
      return {
        content: [{
          type: 'text',
          text: `Block "${block}" is already locked. Provide current_secret to rotate.`,
        }],
      };
    }
    const computed = hashBlockPassphrase(current_secret, agent_id, block, '_');
    if (computed !== existingHash) {
      return { content: [{ type: 'text', text: 'Lock rotation denied — incorrect current_secret.' }] };
    }
  }

  const hashes = {
    ...(row.position_hashes || {}),
    '_': hashBlockPassphrase(secret, agent_id, block, '_'),
  };
  await updatePositionHashes(agent_id, block, hashes);

  return {
    content: [{
      type: 'text',
      text: `Block "${agent_id}/${block}" ${existingHash ? 'lock rotated' : 'now locked'}. Writes require the secret.`,
    }],
  };
}
