/**
 * tools/bsp.ts — the unified bsp() MCP tool handler.
 *
 * One function. Read when content is null. Write when content is provided.
 * Substrate dispatch is implicit via the agent_id form:
 *   - URL ("https://...")        → that federated beach
 *   - "pscale"                   → in-memory sentinel registry
 *   - bare name ("weft")         → DEFAULT_BEACH with block "<role>:<handle>"
 *   - "sed:<collective>"         → DEFAULT_BEACH with block "sed:<collective>"
 *   - "grain:<pair_id>"          → DEFAULT_BEACH with block "grain:<pair_id>"
 *
 * The translation happens inside db.ts:translateAddress; this handler operates
 * on the user's original agent_id/block pair and forwards to the storage layer
 * which does the dispatch.
 *
 * Locks: bsp-mcp does not compute lock hashes. The federated beach computes
 * and stores hashes server-side; bsp-mcp forwards `secret` and `new_lock` in
 * the POST body. Sentinel reads are open and have no lock state.
 *
 * Face/tier modifiers are accepted as parameters for forward compatibility but
 * treated as advisory in v0.1 (logged, not enforced).
 */

import { z } from 'zod';
import { Block, writeAt, InvalidAddressError } from '../bsp.js';
import {
  bspRead,
  bspWrite,
  formatRead,
  formatWrite,
  BspWriteResult,
} from '../bsp-fn.js';
import {
  loadBlock,
  loadBspShape,
  saveBlock,
  BlockRow,
  isFederatedOwner,
  isSentinelOwner,
  canonicaliseOrigin,
  probeFederation,
  translateAddress,
  getPublicKeys,
  DEFAULT_BEACH,
} from '../db.js';
import {
  selfEncrypt,
  selfDecrypt,
  grainEncrypt,
  grainDecrypt,
  decryptGrayNodes,
  grayMode,
  GrayEnvelope,
} from '../keys.js';

// ── Gray-encryption helpers ──

/**
 * Serialise a write payload into a string for gray self-encryption.
 * Strings pass through verbatim. Objects/arrays/primitives are JSON-encoded
 * so they survive the round-trip through the gray envelope's ciphertext.
 */
function stringifyForGray(content: any): string {
  if (typeof content === 'string') return content;
  return JSON.stringify(content);
}

/** First significant side digit (1-9) of a spindle; null if none. */
function leadingSideDigit(spindle: string): string | null {
  for (const ch of spindle) {
    if (ch >= '1' && ch <= '9') return ch;
    if (ch === '0' || ch === '.') continue;
    break;
  }
  return null;
}

/**
 * Encrypt a leaf for a grain side using the bilateral shared key. Resolves the
 * caller's and partner's handles from the grain block's position 9 + the side
 * digit of the spindle, fetches the partner's published x25519, and encrypts.
 * Throws a user-facing message on any precondition failure.
 */
async function encryptGrainLeaf(
  grainBlock: any,
  spindle: string,
  plaintext: string,
  secret: string,
): Promise<GrayEnvelope> {
  const side = leadingSideDigit(spindle);
  if (side !== '1' && side !== '2') {
    throw new Error('grain gray write must address your side (spindle starting with 1 or 2).');
  }
  const partnerSide = side === '1' ? '2' : '1';
  const sideMap = grainBlock?.['9'];
  const myHandle = sideMap?.[side];
  const partnerHandle = sideMap?.[partnerSide];
  if (!myHandle || !partnerHandle) {
    throw new Error('grain not established (no parties at position 9). Reach first via pscale_grain_reach, then curate with bsp().');
  }
  const partnerKeys = await getPublicKeys(partnerHandle);
  if (!partnerKeys) {
    throw new Error(`partner "${partnerHandle}" has not published keys — cannot curate privately. They run pscale_key_publish, or write with gray:false. (Your side secret must be the same secret you published keys with.)`);
  }
  return grainEncrypt(plaintext, secret, myHandle, partnerHandle, partnerKeys.x25519);
}

/**
 * Build a per-leaf decryptor for a secret-bearing read. Self envelopes decrypt
 * with the reader's own derived key. Grain envelopes trial-decrypt from both
 * party perspectives — the reader's secret opens exactly one — using each
 * party's published x25519 fetched from their passport.
 */
async function buildGrayDecryptor(
  block: any,
  isGrain: boolean,
  agentId: string,
  secret: string,
): Promise<(env: GrayEnvelope) => Promise<string | null>> {
  let h1: string | undefined;
  let h2: string | undefined;
  let k1: string | null = null;
  let k2: string | null = null;
  if (isGrain && block?.['9'] && typeof block['9'] === 'object') {
    h1 = block['9']['1'];
    h2 = block['9']['2'];
    const [p1, p2] = await Promise.all([
      h1 ? getPublicKeys(h1) : Promise.resolve(null),
      h2 ? getPublicKeys(h2) : Promise.resolve(null),
    ]);
    k1 = p1?.x25519 ?? null;
    k2 = p2?.x25519 ?? null;
  }
  return async (env: GrayEnvelope): Promise<string | null> => {
    const mode = grayMode(env);
    if (mode === 'self') return selfDecrypt(env, secret, agentId);
    if (mode === 'grain') {
      // Reader is whichever party their secret belongs to; try both. My handle
      // pairs with the OTHER party's published key.
      if (h1 && k2) { const pt = await grainDecrypt(env, secret, h1, k2); if (pt !== null) return pt; }
      if (h2 && k1) { const pt = await grainDecrypt(env, secret, h2, k1); if (pt !== null) return pt; }
      return null;
    }
    return null;
  };
}

// ── Schemas ──

export const bspParamsSchema = {
  agent_id: z
    .string()
    .describe(`Addressed namespace — substrate dispatched by form. Three real targets after dispatch: (1) URL ("https://beach.happyseaurchin.com") → that federated beach at <origin>/.well-known/pscale-beach; (2) "pscale" → the in-memory sentinel registry (bundled teaching blocks: manifest, whetstone, sunstone, agent-id, evolution, progression, block-conventions, gatekeeper, protocol-paywall — read-only); (3) anything else → translated to the default beach (${DEFAULT_BEACH}) with the agent_id encoded into the block name. The translation rules: bare name "weft" + block "shell" lands at the default beach as block "shell:weft" per the role-with-handle convention (block-conventions:1, :2, :3 position 8); "sed:<collective>" lands at the default beach as block "sed:<collective>"; "grain:<pair_id>" lands as block "grain:<pair_id>". Translation is internal — callers just pass the agent_id form they have. **Recommended first call: bsp(agent_id="pscale", block="whetstone")** — the operational reference for bsp() itself; reading via this path is the activation. Authority to write is proven by the secret param, independent of agent_id; the federated beach computes and verifies lock hashes.`),
  block: z
    .string()
    .describe('Block name within the agent_id\'s namespace. For URL agent_id this is whatever the host has named the block — common names per substrate-wide convention include "marks", "lighthouse" (operator-curated navigation when present, per block-conventions:4.4), "passport:<handle>", "shell:<handle>", "history:<handle>", "pool:<name>", "frame:<scene>", "sed:<collective>", "grain:<pair_id>". The host serves whichever named blocks it hosts. For sed:/grain: agent_id any block argument is dropped during translation (the prefix-typed agent_id IS the block on the beach). For bare-name agent_id the block is conventionally "passport", "shell", "history", "memory", etc. — translated to "<block>:<handle>" at the default beach.'),
  spindle: z
    .string()
    .nullable()
    .optional()
    .describe('Address path (S). Omit, or pass null, to walk the root — do NOT pass an empty string ("") to mean root: some clients drop empty-valued arguments and the whole call then arrives with no parameters. Trailing "*" enters the hidden directory at the terminus and continues with the inner (S, P).'),
  pscale_attention: z
    .number()
    .int()
    .nullable()
    .optional()
    .describe('Depth selector (P). Together with spindle, derives selection shape — point (P==P_end), ring (P==P_end-1), subtree (P<P_end-1), disc (spindle omitted/null), whole-block (both omitted/null).'),
  content: z
    .any()
    .optional()
    .describe('Payload for writes. Shape MUST match the shape derived from (spindle, pscale_attention). Omit for reads.'),
  secret: z
    .string()
    .optional()
    .describe('Proof of current authority. Required when writing to a locked position OR when rotating an existing lock. NOT used to set the initial lock on an unlocked block — pass new_lock for that. Forwarded to the federated beach which computes the hash and verifies.'),
  new_lock: z
    .string()
    .optional()
    .describe('Target lock value. Sets or rotates the write-lock at the addressed position. Four cases: (1) block does not exist + new_lock → create locked, no secret needed; (2) block unlocked + new_lock → lock with new_lock, no secret needed; (3) block locked + secret + new_lock → rotate from current to new_lock (secret proves current authority); (4) without new_lock, lock state is unchanged. Forwarded to the federated beach.'),
  gray: z
    .boolean()
    .optional()
    .describe("Privacy by encryption (client-side at bsp-mcp; a spine-legal ciphertext envelope lands at the beach). On ordinary blocks: opt-in self-encryption (default false) — secret is the key, only the author decrypts. On grain blocks: private by DEFAULT (shared key from both parties' published keypairs; either party reads, outsiders cannot) — pass gray:false to write public. Requires a non-empty spindle (encrypt at a leaf). Degray = read with secret, then write the plaintext back with gray:false. Grain mode needs both parties to have run pscale_key_publish."),
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

/**
 * Walk content and parse JSON-stringified objects/arrays back to native
 * structures. LLMs occasionally serialise nested content as a string when
 * the schema accepts `any`; the beach's shape gate then rejects the result.
 * Normalising here lets bsp-mcp absorb the mistake — the beach stays strict
 * as the safety net for direct HTTP clients. Strings that don't parse as a
 * JSON object/array stay strings (legitimate text leaves are untouched).
 */
function normaliseContent(value: any): any {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed !== null && typeof parsed === 'object') {
          return normaliseContent(parsed);
        }
      } catch {
        // Not valid JSON — keep as string.
      }
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(normaliseContent);
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = normaliseContent(v);
    }
    return result;
  }
  return value;
}

// ── Not-found response helper ──

/**
 * Render the not-found message for a read miss. For federated hosts, probes
 * the host to distinguish "host is federated but does not host this block"
 * from "no beach at this host at all". For non-federated targets (sentinels,
 * default-beach translations that didn't resolve), returns a plain message.
 */
async function notFoundResponse(
  target: ReturnType<typeof translateAddress>,
  agent_id: string,
  blockName: string,
): Promise<{ content: { type: 'text'; text: string }[] }> {
  if (isFederatedOwner(target.agent_id)) {
    const origin = canonicaliseOrigin(target.agent_id);
    const status = await probeFederation(target.agent_id);
    if (status === 'federated') {
      const translationNote = target.translated
        ? ` (resolved from agent_id="${target.original.agent_id}" + block="${target.original.block}")`
        : '';
      return {
        content: [{
          type: 'text',
          text: `Block "${target.block}" not found at federated host ${origin}${translationNote}. The host is federated and serves /.well-known/pscale-beach, but does not host this block. If you intended a per-agent block, the canonical name is "<role>:<handle>" — e.g. shell:happyseaurchin, passport:happyseaurchin (per block-conventions branches 1, 2, 3 position 8).`,
        }],
      };
    }
    return {
      content: [{
        type: 'text',
        text: `No beach at ${origin}/.well-known/pscale-beach (also tried the beach.<host> subdomain — neither is federated). Alternatives: try the default beach (${DEFAULT_BEACH}) by passing a bare-name or sed:/grain: agent_id, or consult a known federated-beach list.`,
      }],
    };
  }
  return { content: [{ type: 'text', text: `Block "${agent_id}/${blockName}" not found.` }] };
}

// ── The handler ──

/**
 * Four-rule semantics for content + new_lock interaction (enforced at the beach):
 *   (R1) Block doesn't exist + new_lock     → create locked at new_lock, no secret needed.
 *   (R2) Block unlocked       + new_lock     → set lock to new_lock, no secret needed.
 *   (R3) Block locked         + secret       → secret proves current authority for content writes.
 *   (R4) Block locked         + secret + new_lock → rotate current→new_lock (with optional content).
 *
 * `secret` is ALWAYS proof of current authority. Never the initial lock value.
 * `new_lock` is ALWAYS the target lock value. Never used as proof.
 *
 * bsp-mcp forwards both to the beach without local hash computation. The
 * sentinel registry has no lock semantics (read-only).
 */
export async function handleBsp(params: BspToolParams): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { agent_id, block: blockName, spindle, pscale_attention, content: rawContent, secret, new_lock, face, tier } = params;

  // Normalise stringified content before any walk — LLMs sometimes serialise
  // nested structure as a JSON string by mistake; the beach's shape gate would
  // then reject the write. bsp-mcp absorbs the mistake; beach stays strict.
  const content = rawContent !== undefined ? normaliseContent(rawContent) : undefined;

  if (face || tier) {
    console.error(`[bsp] face=${face} tier=${tier} advisory (v0.1 — enforcement deferred)`);
  }

  // Resolve the actual storage target. For sentinel and URL forms this is a
  // pass-through; for bare/sed:/grain: it translates to the default beach
  // with the agent_id encoded into the block name.
  const target = translateAddress(agent_id, blockName);

  // Sentinels reject writes — they are read-only.
  const isSentinel = isSentinelOwner(target.agent_id);
  if (isSentinel && (content !== undefined || new_lock !== undefined)) {
    return {
      content: [{
        type: 'text',
        text: `"${target.agent_id}" is a read-only sentinel. The bundled teaching blocks are server-fixed.`,
      }],
    };
  }

  // ── READ ── (no content, no lock change)
  if (content === undefined && new_lock === undefined) {
    // Wire-level fast path — federated hosts, no gray decryption needed.
    // The beach computes shape locally and returns only the resolved slice,
    // avoiding whole-block transfer for narrow queries. Skipped for sentinels
    // (in-memory, walked locally) and for secret-bearing reads (may need the
    // raw block to walk gray envelopes through decryptGrayNodes first).
    //
    // GATED to pscale-bearing, non-star reads. The beach returns a canonical
    // {shape} object ONLY when ?pscale= is present; for a no-pscale GET it
    // returns the RAW NODE at the spindle (readAt) — which also STRIPS a
    // trailing '*'. The wire branch below cannot reconstruct path-walk or star
    // semantics from a bare node: a string node reads as not-found, an object
    // node gets double-walked, and a stripped star loses the hidden directory.
    // So path-walk reads (spindle, no pscale) and star reads route to the local
    // whole-block path, where bspRead walks them with the canonical walker.
    // Point / disc / descent (pscale present) keep the wire optimisation.
    // Contract-drift fix 2026-05-30 — see proposals/2026-05-30-wire-read-gate.md.
    const hasStar = typeof spindle === 'string' && spindle.includes('*');
    const wireEligible = pscale_attention != null && !hasStar;
    if (wireEligible && !isSentinel && !secret && isFederatedOwner(target.agent_id)) {
      try {
        const wireResult = await loadBspShape(
          target.agent_id,
          target.block,
          spindle ?? null,
          pscale_attention ?? null,
        );
        if (wireResult && typeof wireResult === 'object' && 'shape' in wireResult) {
          // Canonical shape-tagged response from a v2 beach — return directly.
          return { content: [{ type: 'text', text: formatRead(wireResult as any) }] };
        }
        if (wireResult && typeof wireResult === 'object') {
          // Legacy beach (no ?pscale= handling) returned the raw block —
          // walk it locally rather than make a second HTTP call.
          try {
            const result = bspRead(wireResult as Block, spindle ?? '', pscale_attention ?? null);
            return { content: [{ type: 'text', text: formatRead(result) }] };
          } catch (e: any) {
            if (e instanceof InvalidAddressError) {
              return { content: [{ type: 'text', text: `Read rejected: ${e.message}` }] };
            }
            throw e;
          }
        }
        // wireResult === null → 404 from the federated host.
        return notFoundResponse(target, agent_id, blockName);
      } catch (e: any) {
        // Wire-level network/parse error — fall through to local loadBlock path.
        console.error(`[bsp] wire-level read failed, falling back to loadBlock: ${e?.message ?? e}`);
      }
    }

    // Local path — sentinels, gray-decryption reads, or wire-level fallback.
    const row = await loadBlock(agent_id, blockName);
    if (!row) {
      return notFoundResponse(target, agent_id, blockName);
    }
    // When secret is provided on a read, walk the block and rehydrate any gray
    // envelopes (self or grain) to plaintext before bspRead computes the shape.
    const blockForRead = secret
      ? await decryptGrayNodes(
          row.block,
          await buildGrayDecryptor(row.block, target.block.startsWith('grain:'), agent_id, secret),
        )
      : row.block;
    try {
      const result = bspRead(blockForRead, spindle ?? '', pscale_attention ?? null);
      return { content: [{ type: 'text', text: formatRead(result) }] };
    } catch (e: any) {
      if (e instanceof InvalidAddressError) {
        return { content: [{ type: 'text', text: `Read rejected: ${e.message}` }] };
      }
      throw e;
    }
  }

  // ── WRITE and/or LOCK ──
  //
  // The federated beach is the lock authority. bsp-mcp does not verify or
  // compute hashes — it forwards `secret` and `new_lock` and the beach
  // accepts or rejects. For sentinel writes, we already rejected above.

  // Load existing state to merge writes against (and to seed an empty block
  // when locking-only on a new target).
  const row: BlockRow | null = await loadBlock(agent_id, blockName);

  // Determine starting block — existing or empty seed.
  const block: Block = row?.block ?? {};

  // Grain blocks curate privately by default; ordinary blocks are public unless
  // gray:true is passed. gray:false forces a public write either way.
  const isGrain = target.block.startsWith('grain:');
  const wantGray = isGrain ? params.gray !== false : params.gray === true;

  // Apply content write if provided.
  let writeResult: BspWriteResult | null = null;
  if (content !== undefined) {
    if (wantGray) {
      if (!secret) {
        return {
          content: [{ type: 'text', text: 'Write rejected: gray encryption requires secret (the key). Pass gray:false to write public.' }],
        };
      }
      if (!spindle || spindle === '') {
        return {
          content: [{ type: 'text', text: 'Write rejected: gray encryption requires a non-empty spindle (encrypt at a leaf, not the whole block).' }],
        };
      }
      try {
        const envelope = isGrain
          ? await encryptGrainLeaf(block, spindle, stringifyForGray(content), secret)
          : await selfEncrypt(stringifyForGray(content), secret, agent_id);
        writeAt(block, spindle, envelope);
        writeResult = {
          shape: 'point',
          written: true,
          block,
          spindle: String(spindle),
          pscale_attention: pscale_attention ?? null,
        };
      } catch (e: any) {
        if (e instanceof InvalidAddressError) {
          return { content: [{ type: 'text', text: `Write rejected: ${e.message}` }] };
        }
        return { content: [{ type: 'text', text: `Write rejected: ${e?.message ?? String(e)}` }] };
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
  // saveBlock translates the agent_id internally and forwards to the beach
  // with secret/new_lock in the POST body.
  const blockToSave = writeResult?.block ?? block;
  try {
    await saveBlock(
      agent_id,
      blockName,
      blockToSave,
      {
        spindle: spindle ?? '',
        pscale_attention: pscale_attention ?? null,
        // Leak fix: a self-gray write to an ordinary block uses `secret` ONLY
        // as the encryption key — it must not reach the beach. Grain writes
        // still forward it (it locks the side); lock changes still forward it.
        secret: wantGray && !isGrain && new_lock === undefined ? undefined : secret,
        new_lock: params.new_lock,
        gray: params.gray,
      },
    );
  } catch (e: any) {
    return { content: [{ type: 'text', text: `Write rejected: ${e?.message ?? String(e)}` }] };
  }

  // Lock-only operation acknowledgement.
  let lockNote = '';
  if (new_lock !== undefined) {
    lockNote = '\nLock change forwarded to beach.';
  }

  // Format response.
  if (writeResult) {
    return { content: [{ type: 'text', text: formatWrite(writeResult) + lockNote }] };
  }
  return { content: [{ type: 'text', text: `[lock @ "${target.agent_id}/${target.block}"]${lockNote}` }] };
}
