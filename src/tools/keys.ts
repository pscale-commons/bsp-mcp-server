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
import { atTheDoor, mintedLine, isDoorRefusal, refusedAtDoor, type Door } from '../pass.js';
import { handOf } from '../looks.js';
import { Block, writeAt, readAt } from '../bsp.js';
import { loadBlock, saveBlock, isFederatedOwner, resolveFederationOrigin, indexNames, DEFAULT_BEACH } from '../db.js';
import { isDerived, markerText, stampNow, forgetNine, forgetSwitched, refusedBlocks, lockPost, writeRaw, sweep, type Swept } from '../latch.js';
import {
  deriveKeypair,
  deriveLatch,
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
  latch: z.enum(['derived', 'word']).optional().describe('THE SWITCH (proposals/2026-11-05-the-derived-latch.md §5). "derived" moves this handle\'s latches at this beach off the word onto the latch derived from it, so no beach is sent the word again: the marker at passport 9.3 first, then the passport, then every block named for the handle, each probed with no key first so an open block is never latched; run again, it also moves the blocks this session was refused at. "word" runs the same steps back. secret is the word that derives the halves at 9 (or, for a holder whose latch was another key, that key, with the word as enc_secret). A switched handle changes its word only with latch "derived" and prior_secret, since every latch moves with it.'),
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

type KeyPublishParams = {
  handle: string;
  secret: string;
  enc_secret?: string;
  prior_secret?: string;
  signature?: string;
  agent_id?: string;
  latch?: 'derived' | 'word';
};

// THE DOOR (src/pass.ts; protocol 2.8): at a members' beach this call stands with the hand it
// acts as and the latch proof it carries, is proved once on a 401 and the pass kept for the
// session, as bsp() is — so a member publishes, reaches and settles there without a second step.
export async function handleKeyPublish(
  params: KeyPublishParams,
  extra?: { sessionId?: string },
): Promise<{ content: { type: 'text'; text: string }[] }> {
  const door: Door = { session: extra?.sessionId, handles: [params.handle, handOf(extra?.sessionId)], secret: params.secret };
  let res: { content: { type: 'text'; text: string }[] };
  try {
    res = await atTheDoor(door, () => handleKeyPublishInner(params));
  } catch (e: any) {
    if (!isDoorRefusal(e)) throw e;
    res = refusedAtDoor(e);
  }
  if (door.minted && res.content.length) res.content[res.content.length - 1].text += mintedLine(door);
  return res;
}

async function handleKeyPublishInner(params: KeyPublishParams): Promise<{ content: { type: 'text'; text: string }[] }> {
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
  const old9: any = (row.block as any)?.['9'];
  const wasDerived = isDerived(old9);
  const changes = !!existingKeys && !keysMatch(existingKeys, newPubKeys);
  // A switched handle's latches are all derived from the word its keys came from: a new word moves them all.
  if (wasDerived && changes && !(params.latch === 'derived' && prior_secret)) {
    return { content: [{ type: 'text', text: `Rotation rejected: ${blockName} says its latch is derived (9.3), so every latch it holds comes from the word these keys came from, and a new word moves them all. Pass latch: "derived" with prior_secret (the old word) and secret (the old word, which proves the passport today), and the switch moves every latch from the old word's latch to the new one's. Nothing was written.` }] };
  }
  if (params.latch === 'word' && !wasDerived) {
    return { content: [{ type: 'text', text: `Nothing to switch back: ${blockName} carries no "latch: derived" at 9.3, so its latches stand on the word already. Nothing was written.` }] };
  }

  if (existingKeys && !changes) {
    const verified = `Keys verified. Your secret derives the same keypair. Ready to send and open grays.\n\nx25519: ${newPubKeys.x25519}\ned25519: ${newPubKeys.ed25519}`;
    if (!params.latch) return { content: [{ type: 'text', text: verified }] };
    return { content: [{ type: 'text', text: `${verified}\n\n${await theSwitch(params, beach, encSecret, old9, wasDerived)}` }] };
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
      // Most often this call is a CHECK — does the secret I seal and read grain
      // lines with derive my published keys? — so say the answer before the
      // rotation recipe, or "rejected" reads as a fault in the tool.
      proofError =
        `this secret does not derive the keys published at ${blockName} 9 — nothing was written, and grain lines sealed or read with it will not open for the other party. ` +
        'To replace the published keys, pass prior_secret (the secret they were published from) OR signature (Ed25519 over "pscale_key_rotation:{handle}:{new_x25519_b64}:{new_ed25519_b64}", base64).';
    }

    if (!validProof) {
      return { content: [{ type: 'text', text: `Rotation rejected: ${proofError}` }] };
    }
  }

  const block = row.block as Block;
  // Spine-legal published-keys shape ({_, 1: ed25519, 2: x25519}) so the beach
  // shape gate accepts the write — a bare {x25519, ed25519} object is rejected.
  // The latch's form at 9.3 rides forward: a republish never drops the marker.
  writeAt(block, '9', { ...publicKeysToSpine(newPubKeys), ...(typeof old9?.['3'] === 'string' ? { '3': old9['3'] } : {}) } as any);
  // Surgical write at spindle "9" with the new key object.
  await saveBlock(beach, blockName, block, {
    spindle: '9',
    pscale_attention: null,
    secret,
  });

  const published = `${existingKeys ? 'Keys rotated' : 'Keys published'} at passport position 9.

handle:    ${handle}
beach:     ${beach}
block:     ${blockName}
x25519:    ${newPubKeys.x25519}
ed25519:   ${newPubKeys.ed25519}

Secret discarded. Re-derive with the same secret on every use.`;
  if (!params.latch) return { content: [{ type: 'text', text: published }] };
  return { content: [{ type: 'text', text: `${published}\n\n${await theSwitch(params, beach, encSecret, old9, wasDerived)}` }] };
}

/**
 * THE SWITCH (proposals/2026-11-05-the-derived-latch.md §5.2), with the word in hand: the marker at
 * 9.3 first, so every door that reads it from then on sends the derived latch; the passport's root;
 * the sweep of every block named for the handle at this beach, and of the blocks this session was
 * refused at, each probed with no key so an open block is never latched; then the marker says swept.
 * "word" runs it back. Every write here is the switch's own, under the form it names (writeRaw,
 * lockPost), and no reply carries a key.
 */
async function theSwitch(params: KeyPublishParams, beach: string, word: string, old9: any, wasDerived: boolean): Promise<string> {
  const { handle, secret, prior_secret } = params;
  const blockName = `passport:${handle}`;
  const origin = await resolveFederationOrigin(beach);
  if (!origin) return `The switch did not run: no beach answered at ${beach}.`;
  const L = await deriveLatch(word, handle);
  const named = (await indexNames(origin)).filter((n) => n !== blockName && n.endsWith(`:${handle}`) && !/^(sed|grain|archive):/.test(n));
  const blocks = [...new Set([...named, ...refusedBlocks(origin, handle)])];
  const tally = (s: Swept) =>
    `${s.moved.length} moved${s.already.length ? `, ${s.already.length} moved already` : ''}; ${s.open.length} open and left so (a room is never latched)` +
    (s.refused.length ? `; ${s.refused.length} under another key and left: ${s.refused.join(', ')}` : '') +
    (s.skipped.length ? `; ${s.skipped.length} not swept: ${s.skipped.join(', ')}` : '');

  if (params.latch === 'word') {
    const back = await sweep(origin, blocks, L, secret);
    const root = await lockPost(origin, blockName, { secret: L, new_lock: secret });
    if (!root.ok) return `The switch back stopped at the passport (${root.error}); the blocks: ${tally(back)}. Run it again.`;
    const nine: any = { _: old9?._ ?? publicKeysToSpine({ x25519: '', ed25519: '' })._, '1': old9?.['1'], '2': old9?.['2'] };
    const w = await writeRaw(origin, blockName, '9', nine, secret);
    forgetSwitched(origin, handle);
    forgetNine(origin, handle);
    return `Switched back: ${blockName} answers to the word again${w.ok ? ' and 9.3 is gone' : `, but 9.3 still stands (${w.error})`}; the blocks named for ${handle}: ${tally(back)}.`;
  }

  // The form the latches stand in now: the first switch finds them on the word (or on an older key);
  // a new word finds them on the old word's latch; a run again finds the passport moved already.
  const from = !wasDerived ? secret : prior_secret ? await deriveLatch(prior_secret, handle) : L;
  const since = (wasDerived && typeof old9?.['3'] === 'string' && /since (\S+)/.exec(old9['3'])?.[1]) || stampNow();
  if (!wasDerived) {
    const m = await writeRaw(origin, blockName, '9.3', markerText(handle, since), from);
    if (!m.ok) return `Nothing was switched: the marker could not be written at ${blockName} 9.3 (${m.error}).`;
  }
  forgetNine(origin, handle);
  if (from !== L) {
    const root = await lockPost(origin, blockName, { secret: from, new_lock: L });
    if (!root.ok) return `The marker stands at ${blockName} 9.3 but the passport did not move (${root.error}): run the switch again with the same word.`;
  }
  // A run again sweeps what still stands on the word; a first switch or a new word, what stands on the old form.
  const swept = await sweep(origin, blocks, wasDerived && !prior_secret ? secret : from, L, wasDerived && !prior_secret);
  const done = await writeRaw(origin, blockName, '9.3', markerText(handle, since, stampNow()), L);
  forgetNine(origin, handle);
  return `Switched: ${handle}'s latches at ${origin} are derived from the word, so no beach is sent the word again (${blockName} 9.3${done.ok ? ', swept' : ` stands, not yet swept: ${done.error}`}). The blocks named for ${handle}: ${tally(swept)}. A block found later that still answers to the word is refused with its name; run this again to move it.`;
}

// Suppress unused-import warning if readAt isn't used directly.
void readAt;
