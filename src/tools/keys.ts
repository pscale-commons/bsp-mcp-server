/**
 * tools/keys.ts — pscale_key_publish primitive.
 *
 * Argon2id key derivation. Public keys land at passport position 9. Private
 * keys are never stored — re-derived each time. First publish unauthenticated;
 * rotation requires proof of prior key ownership (prior_secret OR signature).
 */

import { z } from 'zod';
import { Block, writeAt } from '../bsp.js';
import { loadBlock, saveBlock, getPublicKeys } from '../db.js';
import {
  deriveKeypair,
  formatPublicKeys,
  keysMatch,
  signKeyRotation,
  verifyKeyRotation,
} from '../keys.js';

export const keyPublishParamsSchema = {
  agent_id: z.string().describe('Your agent_id. Must match an existing passport block. Used as derivation salt.'),
  secret: z.string().describe('Passphrase (HITL) or local block hash (NHITL). Combined with agent_id to derive the keypair. Never stored.'),
  prior_secret: z.string().optional().describe('Rotation only: previous passphrase. Server derives prior keypair and signs the rotation message internally.'),
  signature: z.string().optional().describe('Rotation only: precomputed base64 Ed25519 sig over "pscale_key_rotation:{agent_id}:{new_x25519_b64}:{new_ed25519_b64}", made with the prior secret key.'),
};

export async function handleKeyPublish(params: {
  agent_id: string;
  secret: string;
  prior_secret?: string;
  signature?: string;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { agent_id, secret, prior_secret, signature } = params;

  const newKeys = await deriveKeypair(secret, agent_id);
  const newPubKeys = formatPublicKeys(newKeys);

  const row = await loadBlock(agent_id, 'passport');
  if (!row) {
    return {
      content: [{ type: 'text', text: 'No passport block found. Create one first via bsp() with block="passport".' }],
    };
  }

  const existingKeys = await getPublicKeys(agent_id);

  if (existingKeys && keysMatch(existingKeys, newPubKeys)) {
    return {
      content: [{
        type: 'text',
        text: `Keys verified. Your secret derives the same keypair. Ready to send and open grays.\n\nx25519: ${newPubKeys.x25519}\ned25519: ${newPubKeys.ed25519}`,
      }],
    };
  }

  if (existingKeys) {
    let validProof = false;
    let proofError: string | undefined;

    if (prior_secret) {
      const priorKeys = await deriveKeypair(prior_secret, agent_id);
      const priorPubKeys = formatPublicKeys(priorKeys);
      if (priorPubKeys.ed25519 !== existingKeys.ed25519) {
        proofError = 'prior_secret does not derive the currently published Ed25519 key.';
      } else {
        const sig = signKeyRotation(agent_id, newPubKeys, priorKeys.ed25519.secretKey);
        validProof = verifyKeyRotation(agent_id, newPubKeys, sig, existingKeys.ed25519);
      }
    } else if (signature) {
      validProof = verifyKeyRotation(agent_id, newPubKeys, signature, existingKeys.ed25519);
      if (!validProof) proofError = 'Signature did not verify against the currently published Ed25519 key.';
    } else {
      proofError =
        'Key rotation requires prior_secret OR signature (Ed25519 over "pscale_key_rotation:{agent_id}:{new_x25519_b64}:{new_ed25519_b64}", base64).';
    }

    if (!validProof) {
      return { content: [{ type: 'text', text: `Rotation rejected: ${proofError}` }] };
    }
  }

  const block = row.block as Block;
  writeAt(block, '9', newPubKeys as any);
  await saveBlock(agent_id, 'passport', block, row.block_type);

  return {
    content: [{
      type: 'text',
      text: `${existingKeys ? 'Keys rotated' : 'Keys published'} at passport position 9.\n\nagent_id: ${agent_id}\nx25519:   ${newPubKeys.x25519}\ned25519:  ${newPubKeys.ed25519}\n\nSecret discarded. Re-derive with the same secret on every use.`,
    }],
  };
}
