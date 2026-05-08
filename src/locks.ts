/**
 * locks.ts — pair_id derivation only.
 *
 * Lock-hashing now lives at the federated beach. bsp-mcp does not compute
 * lock hashes — it forwards `secret` and `new_lock` in the POST body and the
 * beach computes/verifies under the canonical salt namespaces:
 *
 *   sed:    sha256(passphrase + collective + position)
 *   grain:  sha256(passphrase + "grain:" + pair_id + ":" + side)
 *   block:  sha256(passphrase + "block:" + agent_id + ":" + name + ":" + position)
 *
 * Kept here: pair_id and side derivation, which are pure functions of agent
 * handles. Used client-side by pscale_grain_reach to compute the grain block
 * name and side index before posting the action to the beach.
 */

import { createHash } from 'node:crypto';

function sha256Hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * pair_id from two agent handles: sha256 of sorted-and-pipe-joined,
 * truncated to 16 hex chars. Lex-smaller handle gets side 1; lex-larger
 * gets side 2.
 */
export function pairId(a: string, b: string): string {
  if (a === b) throw new Error('Cannot form a grain with yourself.');
  const [lo, hi] = [a, b].sort();
  return sha256Hex(`${lo}|${hi}`).slice(0, 16);
}

export function determineSide(myHandle: string, otherHandle: string): '1' | '2' {
  if (myHandle === otherHandle) throw new Error('Cannot determine side: handles identical.');
  return myHandle < otherHandle ? '1' : '2';
}
