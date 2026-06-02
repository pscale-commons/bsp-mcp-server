/**
 * tools/keys.ts — pscale_key_publish primitive, federated-only.
 *
 * Argon2id key derivation. Public keys land at passport position 9 of the
 * federated passport block. Private keys are never stored — re-derived each
 * time from secret + handle.
 *
 * First publish: unauthenticated (passport must already exist).
 * Rotation: requires proof of prior key ownership (prior_secret OR signature).
 *
 * Parameters:
 *   handle    — agent's bare-name identity (used as Argon2 derivation salt
 *               AND as the discriminator in the federated block name "passport:<handle>")
 *   secret    — passphrase combined with handle to derive the keypair
 *   agent_id  — URL of the beach hosting the passport (defaults to DEFAULT_BEACH)
 *
 * The passport block lives at (agent_id, "passport:<handle>") on the federated
 * beach via the role-with-handle convention.
 */

import { z } from 'zod';
import { Block, writeAt, readAt } from '../bsp.js';
import { loadBlock, saveBlock, isFederatedOwner, DEFAULT_BEACH } from '../db.js';
import {
  deriveKeypair,
  formatPublicKeys,
  keysMatch,
  signKeyRotation,
  verifyKeyRotation,
  publicKeysToSpine,
  publicKeysFromSpine,
} from '../keys.js';

export const keyPublishParamsSchema = {
  handle: z.string().describe('Your bare-name handle. Used as the Argon2id derivation salt AND as the discriminator in the passport block name ("passport:<handle>") at the beach. Must match an existing passport block.'),
  secret: z.string().describe('Write-authority for the passport block (proves you may write position 9). Also the fallback keypair seed when enc_secret is omitted. Never stored.'),
  enc_secret: z.string().optional().describe('Keypair seed (Argon2id with handle) — the published PUBLIC half derives from this; the private half is never stored, and enc_secret itself is never sent to the beach. Falls back to secret. Use the SAME enc_secret you use for grain/self encryption, or your published key will not match your ciphertext.'),
  prior_secret: z.string().optional().describe('Rotation only: the PRIOR encryption secret (it derived the currently-published keypair). Server derives the prior keypair and signs the rotation message internally.'),
  signature: z.string().optional().describe('Rotation only: precomputed base64 Ed25519 sig over "pscale_key_rotation:{handle}:{new_x25519_b64}:{new_ed25519_b64}", made with the prior secret key.'),
  agent_id: z.string().optional().describe(`URL of the beach hosting the passport. Defaults to ${DEFAULT_BEACH}. The passport block name is "passport:<handle>" per the role-with-handle convention.`),
};

/**
 * Read public keys from the passport block at position 9.
 * Returns null if the passport doesn't exist or has no keys at 9.
 */
async function getPublicKeysFromBeach(beach: string, handle: string): Promise<{ x25519: string; ed25519: string } | null> {
  const blockName = `passport:${handle}`;
  const row = await loadBlock(beach, blockName);
  if (!row) return null;
  return publicKeysFromSpine(row.block?.['9']);
}

export async function handleKeyPublish(params: {
  handle: string;
  secret: string;
  enc_secret?: string;
  prior_secret?: string;
  signature?: string;
  agent_id?: string;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { handle, secret, prior_secret, signature } = params;
  // Keypair seed is enc_secret (never forwarded); secret stays write-authority.
  const encSecret = params.enc_secret ?? secret;
  const beach = params.agent_id ?? DEFAULT_BEACH;

  if (!isFederatedOwner(beach)) {
    return {
      content: [{ type: 'text', text: `agent_id must be an http(s):// URL (got "${beach}"). Pass a federated beach URL or omit to use the default (${DEFAULT_BEACH}).` }],
    };
  }

  const blockName = `passport:${handle}`;
  const newKeys = await deriveKeypair(encSecret, handle);
  const newPubKeys = formatPublicKeys(newKeys);

  const row = await loadBlock(beach, blockName);
  if (!row) {
    return {
      content: [{
        type: 'text',
        text: `No passport at (agent_id="${beach}", block="${blockName}"). Create one first via bsp() with that block name.`,
      }],
    };
  }

  const existingKeys = await getPublicKeysFromBeach(beach, handle);

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
      const priorKeys = await deriveKeypair(prior_secret, handle);
      const priorPubKeys = formatPublicKeys(priorKeys);
      if (priorPubKeys.ed25519 !== existingKeys.ed25519) {
        proofError = 'prior_secret does not derive the currently published Ed25519 key.';
      } else {
        const sig = signKeyRotation(handle, newPubKeys, priorKeys.ed25519.secretKey);
        validProof = verifyKeyRotation(handle, newPubKeys, sig, existingKeys.ed25519);
      }
    } else if (signature) {
      validProof = verifyKeyRotation(handle, newPubKeys, signature, existingKeys.ed25519);
      if (!validProof) proofError = 'Signature did not verify against the currently published Ed25519 key.';
    } else {
      proofError =
        'Key rotation requires prior_secret OR signature (Ed25519 over "pscale_key_rotation:{handle}:{new_x25519_b64}:{new_ed25519_b64}", base64).';
    }

    if (!validProof) {
      return { content: [{ type: 'text', text: `Rotation rejected: ${proofError}` }] };
    }
  }

  const block = row.block as Block;
  // Spine-legal published-keys shape ({_, 1: ed25519, 2: x25519}) so the beach
  // shape gate accepts the write — a bare {x25519, ed25519} object is rejected.
  writeAt(block, '9', publicKeysToSpine(newPubKeys) as any);
  // Surgical write at spindle "9" with the new key object.
  await saveBlock(beach, blockName, block, {
    spindle: '9',
    pscale_attention: null,
    secret,
  });

  return {
    content: [{
      type: 'text',
      text: `${existingKeys ? 'Keys rotated' : 'Keys published'} at passport position 9.

handle:    ${handle}
beach:     ${beach}
block:     ${blockName}
x25519:    ${newPubKeys.x25519}
ed25519:   ${newPubKeys.ed25519}

Secret discarded. Re-derive with the same secret on every use.`,
    }],
  };
}

// Suppress unused-import warning if readAt isn't used directly.
void readAt;
