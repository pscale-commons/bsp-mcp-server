/**
 * tools/collective.ts — sed: substrate primitives.
 *
 * pscale_create_collective: creates a sed: block with conventions in the root
 *   underscore. Admin passphrase locks the root.
 *
 * pscale_register: server-assigns the next valid position (proof-of-presence-
 *   in-time). Position is write-locked with the agent's passphrase.
 *
 * Salt namespace: passphrase + collective + position (legacy-compatible).
 */

import { z } from 'zod';
import { Block, writeAt } from '../bsp.js';
import { bspRead, formatRead } from '../bsp-fn.js';
import { loadBlock, saveBlock, updatePositionHashes } from '../db.js';
import { hashSedPassphrase } from '../locks.js';

const SED_PREFIX = 'sed:';

function sedOwner(collective: string): string {
  return `${SED_PREFIX}${collective}`;
}

/**
 * Find the next valid unoccupied position. Valid = positive integer using
 * only digits 1-9 (no 0). Floor-2 minimum: positions 1-9 are structural
 * group names, never user slots. Sequence: 11, 12, ..., 19, 21, ..., 99,
 * 111, ..., 999, 1111, ...
 */
export function nextValidPosition(positionHashes: Record<string, string>): number {
  let n = 11;
  while (n < 1_000_000) {
    const s = String(n);
    if (!s.includes('0') && !positionHashes[s]) return n;
    n++;
  }
  throw new Error('No valid position found below 1,000,000.');
}

// ── Schemas ──

export const createCollectiveParamsSchema = {
  collective: z.string().describe("Name of the collective (e.g. 'commons', 'thornkeep-cast')"),
  conventions: z.string().describe("The rules of play — becomes the root underscore. Routing, evaluation, registration rules, etc."),
  creator_passphrase: z.string().describe("Admin passphrase for the collective root. Hashed and stored. Sensitive — never repeat in conversation."),
};

export const registerParamsSchema = {
  collective: z.string().describe("Name of the collective to join"),
  declaration: z.string().describe("Who you are and what you offer/need — becomes the underscore at your position"),
  shell_ref: z.string().optional().describe("URL or block reference to your sovereign shell (optional)"),
  passphrase: z.string().describe("Write-lock passphrase for your position. Hashed. Never stored raw. Sensitive — never repeat in conversation."),
};

// ── Handlers ──

export async function handleCreateCollective(params: {
  collective: string;
  conventions: string;
  creator_passphrase: string;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { collective, conventions, creator_passphrase } = params;
  const owner = sedOwner(collective);
  const existing = await loadBlock(owner, collective);
  if (existing) {
    return {
      content: [{
        type: 'text',
        text: `Collective "${collective}" already exists. Walk it with bsp(agent_id="${owner}", block="${collective}").`,
      }],
    };
  }

  const block: Block = { _: conventions };
  const rootHash = hashSedPassphrase(creator_passphrase, collective, '0');
  const hashes = { '0': rootHash };

  await saveBlock(owner, collective, block, 'sedimentary');
  await updatePositionHashes(owner, collective, hashes);

  return {
    content: [{
      type: 'text',
      text: `Collective "${collective}" created. Walk with bsp(agent_id="${owner}", block="${collective}"). Conventions are at the root underscore. Agents register with pscale_register.`,
    }],
  };
}

export async function handleRegister(params: {
  collective: string;
  declaration: string;
  shell_ref?: string;
  passphrase: string;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { collective, declaration, shell_ref, passphrase } = params;
  const owner = sedOwner(collective);
  const row = await loadBlock(owner, collective);

  if (!row) {
    return {
      content: [{
        type: 'text',
        text: `Collective "${collective}" not found. Create it first with pscale_create_collective.`,
      }],
    };
  }

  const block = row.block;
  const positionHashes = row.position_hashes || {};
  const position = nextValidPosition(positionHashes);
  const posKey = String(position);
  const passHash = hashSedPassphrase(passphrase, collective, posKey);

  // Position content: declaration at underscore. Optional shell_ref in hidden directory.
  const positionContent: any = shell_ref
    ? { _: { _: declaration, '1': shell_ref } }
    : { _: declaration };

  writeAt(block, posKey, positionContent);

  const hashes = { ...positionHashes, [posKey]: passHash };
  await saveBlock(owner, collective, block, 'sedimentary');
  await updatePositionHashes(owner, collective, hashes);

  const result = bspRead(block, posKey, null);
  return {
    content: [{
      type: 'text',
      text: `Registered at sed:${collective}:${position}.

${formatRead(result)}

Your position is write-locked. Future writes to this position via bsp() require your passphrase as 'secret'. Position assigned in landing order — proof-of-presence-in-time.`,
    }],
  };
}
