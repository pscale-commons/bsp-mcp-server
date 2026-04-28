/**
 * crypto.ts — hash primitives for write-lock verification.
 *
 * Salt formats are LEGACY-COMPATIBLE with pscale-mcp-server. Same Supabase,
 * same blocks, same passphrases — locks set under one MCP must verify under
 * the other.
 *
 *   sed:     sha256(passphrase + collective + position)
 *   grain:   sha256(passphrase + "grain:" + pair_id + ":" + side)
 *   block:   sha256(passphrase + "block:" + agent_id + ":" + name + ":" + position)
 *
 * Salt namespaces are distinct so the same passphrase never collides across
 * substrates.
 */

import { createHash } from 'node:crypto';

function sha256Hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function hashSedPassphrase(passphrase: string, collective: string, position: string): string {
  return sha256Hex(passphrase + collective + position);
}

export function hashGrainPassphrase(passphrase: string, pairId: string, side: string): string {
  return sha256Hex(passphrase + 'grain:' + pairId + ':' + side);
}

export function hashBlockPassphrase(
  passphrase: string,
  agentId: string,
  name: string,
  position: string,
): string {
  return sha256Hex(passphrase + 'block:' + agentId + ':' + name + ':' + position);
}

/**
 * Determine which hash function applies given an owner_id.
 * Returns the hashed value for the given (passphrase, position).
 */
export function hashByOwnerId(
  ownerId: string,
  name: string,
  position: string,
  passphrase: string,
): string {
  if (ownerId.startsWith('sed:')) {
    const collective = ownerId.slice(4);
    return hashSedPassphrase(passphrase, collective, position);
  }
  if (ownerId.startsWith('grain:')) {
    const pairId = ownerId.slice(6);
    return hashGrainPassphrase(passphrase, pairId, position);
  }
  return hashBlockPassphrase(passphrase, ownerId, name, position);
}

/**
 * Pair-id from two agent_ids: sha256 of sorted-and-joined, truncated to 16 hex.
 * Lex-smaller agent_id gets side 1; lex-larger gets side 2.
 */
export function pairId(a: string, b: string): string {
  if (a === b) throw new Error('Cannot form a grain with yourself.');
  const [lo, hi] = [a, b].sort();
  return sha256Hex(`${lo}|${hi}`).slice(0, 16);
}

export function determineSide(myId: string, otherId: string): '1' | '2' {
  if (myId === otherId) throw new Error('Cannot determine side: agent_ids identical.');
  return myId < otherId ? '1' : '2';
}
