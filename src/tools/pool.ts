/**
 * tools/pool.ts — pscale_pool_engage primitive.
 *
 * Reconstitutes the response-envelope that made pscale-mcp's pool tools
 * operational. Conventions describe pool shape (block-conventions:4.2); this
 * primitive bundles read + slice-since-marker + synthesis_hint into one tool
 * result so the calling LLM has the personal-synthesis instruction in-context
 * the moment it reads the response. The substrate stays passive; the envelope
 * is what carries the personal-synthesis discipline.
 *
 * Polymorphic by `contribution`:
 *   absent  → read-only engage: returns purpose + synthesis_hint + slice
 *   present → post + engage: writes at next-free digit-path slot, then returns
 *             the envelope (catch-up includes the just-posted contribution)
 *
 * Marker is caller-managed. Pass `since_position` in (the int you stored last
 * time, or omit/0 to receive all). Receive `marker_new` back; store it.
 *
 * Synthesis_hint sourcing (2026-06-03 — 9.1 retired as incompatible with supernest):
 *   1. pool:<name>/_          — the underscore (its purpose, or a pointer to an
 *                               external directive block); never a digit position,
 *                               which the accumulator claims for contributions
 *   2. DEFAULT_SYNTHESIS_HINT  — last resort when there is no underscore
 */

import { z } from 'zod';
import { Block, writeAt, readAt } from '../bsp.js';
import { appendWithSupernest } from '../accumulator.js';
import {
  loadBlock,
  saveBlock,
  isFederatedOwner,
  DEFAULT_BEACH,
} from '../db.js';

// ── Defaults ──

export const DEFAULT_SYNTHESIS_HINT =
  "Synthesise the contributions through your own purpose. Each visitor reads the same stream and produces their own synthesis — there is no central resolver. Preserve distinct voices. Flag tensions and convergences honestly. What you make of it is yours.";

const READ_PAGE_LIMIT = 200;

// ── Digit-path slot helpers (inlined; mirror xstream/lib/bsp-client.ts) ──
// "digit-path" per sunstone:1.6.4 — sibling + subnest in lex order, distinct
// from supernest (block-wide floor growth, sunstone:1.6.3).

/**
 * Yields the digit-path enumeration of pool slots — positive integers composed
 * of digits 1-9 only (zeros are skipped: 10, 20, 100, ... are underscore-
 * summary slots reserved for compression). 9 + 81 + 729 = 819 slots, ample
 * for any realistic pool population. Matches block-conventions:9.3.
 */
export function* digitPathSlots(): Generator<string> {
  for (let n = 1; n <= 9; n++) yield String(n);
  for (let n = 11; n <= 99; n++) {
    if (String(n).includes('0')) continue;
    yield String(n);
  }
  for (let n = 111; n <= 999; n++) {
    if (String(n).includes('0')) continue;
    yield String(n);
  }
}

/**
 * Walk a slot path (e.g. "11", "234") through the block, one digit at a time.
 * Returns null if any step is missing or hits a non-object before the path ends.
 */
export function readSlot(block: Block | null, slot: string): any {
  if (typeof block !== 'object' || block === null) return null;
  let cur: any = block;
  for (const ch of slot) {
    if (typeof cur !== 'object' || cur === null) return null;
    cur = cur[ch];
    if (cur === undefined) return null;
  }
  return cur;
}

/**
 * Find the next-free digit-path slot. Same discipline as findNextMarkSpindle in
 * xstream's beach-kernel: at depth 1, any non-null value counts as a claim;
 * at depth 2+, only objects count (strings at depth 2+ are tag-field
 * collisions from a shallower contribution, per block-conventions:9.3).
 */
export function findNextSlot(block: Block | null): string {
  const slots = [...digitPathSlots()];
  let maxIdx = -1;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const v = readSlot(block, slot);
    if (v === null) continue;
    if (slot.length === 1) {
      maxIdx = i;
    } else if (typeof v === 'object') {
      maxIdx = i;
    }
  }
  if (maxIdx === -1) return slots[0];
  if (maxIdx + 1 < slots.length) return slots[maxIdx + 1];
  return slots[slots.length - 1];
}

// ── Envelope assembly ──

export interface PoolContribution {
  position: number;
  text: string;
  agent_id: string | null;
  address: string | null;
  ts: string | null;
  face: string | null;
}

/**
 * Walk the digit-path enumeration, collect contributions whose slot integer is
 * strictly greater than `since_position`. Capped at READ_PAGE_LIMIT — beyond
 * that, more_available is true and the caller pages by passing the last
 * returned position as the next since_position.
 */
export function collectContributions(
  block: Block,
  sincePosition: number,
): { contributions: PoolContribution[]; more_available: boolean } {
  const out: PoolContribution[] = [];
  let more = false;
  for (const slot of digitPathSlots()) {
    // readAt (floor-aware) not readSlot (raw): after a supernest the entries sit
    // one floor down and an entry's dated address absorbs (a "7" resolves via
    // "07" = [0,7]), so this same enumeration still finds every entry across any
    // amount of floor growth.
    const v = readAt(block, slot);
    if (v == null) continue;
    const position = parseInt(slot, 10);
    if (position <= sincePosition) continue;

    // At depth 1 (slot length 1), any non-null is a claim — even legacy strings.
    // At depth 2+, only objects count; strings are tag-field collisions.
    if (slot.length > 1 && (typeof v !== 'object' || Array.isArray(v))) continue;

    if (out.length >= READ_PAGE_LIMIT) {
      more = true;
      break;
    }

    if (typeof v === 'string') {
      // Legacy plain-string contribution (no fields).
      out.push({
        position,
        text: v,
        agent_id: null,
        address: null,
        ts: null,
        face: null,
      });
    } else if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, any>;
      const txt = typeof obj._ === 'string' ? obj._ : '';
      // Skip tombstones (empty underscore at depth 1) — block-conventions:9.4
      // says wipes delete keys, but legacy tombstones may still appear.
      if (slot.length === 1 && txt === '') continue;
      out.push({
        position,
        text: txt,
        agent_id: typeof obj['1'] === 'string' ? obj['1'] : null,
        address: typeof obj['2'] === 'string' ? obj['2'] : null,
        ts: typeof obj['3'] === 'string' ? obj['3'] : null,
        face: typeof obj['4'] === 'string' ? obj['4'] : null,
      });
    }
  }
  return { contributions: out, more_available: more };
}

/**
 * Extract synthesis_hint. Sourced from the pool's UNDERSCORE, never a digit
 * position. A pure-liquid pool reserves no metadata slot — every digit 1-9 becomes
 * a contribution as the pool fills, and past nine the block supernests (accumulator.ts),
 * so a hint at 9.1 would be claimed and overwritten by the ninth entry (block[9] IS
 * contribution 9; block[9][1] is its agent_id). The underscore is the pool's own
 * voice: for a directive pool it points the reader at an external directive (e.g. the
 * RPG soft scoop at function:thornwood/1), for a general pool it states the purpose.
 * The crafted DEFAULT personal-synthesis directive is the fallback when there is no
 * underscore. (Was: a 9.1 → _ → default chain; 9.1 is retired as incompatible with
 * the supernest accumulator — see proposals/2026-06-03-supernest-…, block-conventions:4.2.)
 */
export function extractSynthesisHint(block: Block): { hint: string; source: 'purpose' | 'default' } {
  const purpose = (block as any)._;
  if (typeof purpose === 'string' && purpose.trim() !== '') {
    return { hint: purpose, source: 'purpose' };
  }
  return { hint: DEFAULT_SYNTHESIS_HINT, source: 'default' };
}

// ── Schema ──

export const poolEngageParamsSchema = {
  agent_id: z
    .string()
    .describe('Your agent identifier — used as the contributor attribution if `contribution` is provided. Bare handle, URL, sed:<collective>:<position>, or grain:<pair_id>:<side>.'),
  pool_url: z
    .string()
    .describe(`URL of the federated beach hosting the pool, e.g. "${DEFAULT_BEACH}". Must be an http(s):// URL — pool engagement does not target the sentinel registry.`),
  pool_name: z
    .string()
    .describe('Name of the pool without the "pool:" prefix. The block at the beach is "pool:<pool_name>". E.g. pool_name="visiting" targets block "pool:visiting".'),
  contribution: z
    .string()
    .optional()
    .describe("Optional. Text to post as a contribution before reading. If provided, the primitive writes at the next-free digit-path slot (1, 2, …, 9, 11, …; sunstone:1.6.4) with shape {_: text, 1: agent_id, 2: '', 3: ISO-ts, 4: face}, then reads the envelope. Omit for read-only engagement."),
  face: z
    .enum(['character', 'author', 'designer', 'observer'])
    .optional()
    .describe('CADO face tag for the contribution. Recorded at field 4 of the contribution slot. Advisory in v0.1; informs synthesis-target conventions. Ignored when `contribution` is omitted.'),
  since_position: z
    .number()
    .int()
    .optional()
    .describe('Last position you have seen — return only contributions at slots strictly greater than this. Default 0 (return all). Caller-managed: store the returned `marker_new` and pass it back on the next call.'),
  secret: z
    .string()
    .optional()
    .describe('Lock proof. Required if the pool block is locked (and you are writing) OR if the pool author has gated contribution writes. Forwarded to the beach which verifies. Sensitive — never repeat in conversation.'),
  purpose: z
    .string()
    .optional()
    .describe("Optional, CREATION-only. If the pool does NOT yet exist at this beach, providing `purpose` creates it with the right object shape: {_: '<purpose>'}. The tool constructs the shape internally — caller cannot get it wrong (no way to accidentally author a bare-string pool block). Ignored when the pool already exists (existing purpose is not overwritten). This is the canonical bsp-mcp path to create a pool; do NOT use raw bsp() with content='<purpose>' which produces a malformed string-root block."),
  synthesis_hint: z
    .string()
    .optional()
    .describe("RETIRED (2026-06-03): a synthesis directive can no longer be stored at a digit position — a pure-liquid pool reserves every digit 1-9 for contributions and supernests past nine, so 9.1 would be claimed by the ninth entry. The synthesis_hint is now the pool's underscore (a directive pool points its underscore at an external directive block, e.g. function:<game>/1). Accepted but not stored; pending the submit/commit redesign."),
};

export type PoolEngageParams = {
  agent_id: string;
  pool_url: string;
  pool_name: string;
  contribution?: string;
  face?: 'character' | 'author' | 'designer' | 'observer';
  since_position?: number;
  secret?: string;
  purpose?: string;
  synthesis_hint?: string;
};

// ── Handler ──

export async function handlePoolEngage(
  params: PoolEngageParams,
): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { agent_id, pool_url, pool_name, contribution, face, secret } = params;
  const sincePosition = params.since_position ?? 0;

  if (!isFederatedOwner(pool_url)) {
    return {
      content: [{
        type: 'text',
        text: `pool_url must be an http(s):// URL (got "${pool_url}"). Pool engagement targets federated beaches; pass the beach URL hosting the pool.`,
      }],
    };
  }

  const blockName = `pool:${pool_name}`;

  // ── Load pool ──
  let row = await loadBlock(pool_url, blockName);
  let created = false;
  if (!row) {
    // Pool absent — create it if purpose was provided, otherwise surface the
    // gap so the caller can decide. Creation goes through this primitive
    // (NOT raw bsp() with stringy content) so the right object shape is
    // guaranteed at the tool layer — the caller passes `purpose` as a string
    // and the tool constructs {_: purpose} internally. No way to get the
    // malformed bare-string pool that this primitive originally diagnosed.
    if (params.purpose) {
      const newBlock: Record<string, any> = { _: params.purpose };
      // synthesis_hint is NOT stored at a digit position. A pure-liquid pool keeps
      // every digit 1-9 for contributions (it supernests past nine), so 9.1 would be
      // claimed by the ninth entry. A pool that wants a custom directive states it in
      // its underscore (or points the underscore at an external directive block); the
      // synthesis_hint create-param is retired pending the submit/commit redesign.
      try {
        await saveBlock(pool_url, blockName, newBlock, {
          spindle: '',
          pscale_attention: null,
          secret,
        });
      } catch (e: any) {
        return {
          content: [{ type: 'text', text: `Pool create failed at ${pool_url}:${blockName}: ${e?.message ?? String(e)}` }],
        };
      }
      row = await loadBlock(pool_url, blockName);
      if (!row) {
        return {
          content: [{ type: 'text', text: `Created pool but reload failed at ${pool_url}:${blockName}.` }],
        };
      }
      created = true;
    } else {
      return {
        content: [{
          type: 'text',
          text: `No pool at (agent_id="${pool_url}", block="${blockName}"). Pass purpose= to create one — pscale_pool_engage will author the right shape internally.`,
        }],
      };
    }
  }

  // Defensive: if the existing pool block is a non-object (legacy malformed
  // bare-string from a prior buggy authoring path), surface that diagnostic
  // explicitly with a recovery hint rather than crashing downstream on the
  // typeof assumptions. The bsp-mcp writeAt fix means future creations via
  // this primitive won't produce this shape; legacy blocks need a DELETE.
  if (typeof row.block !== 'object' || row.block === null) {
    return {
      content: [{
        type: 'text',
        text: `Pool at ${pool_url}:${blockName} is malformed (root is ${row.block === null ? 'null' : typeof row.block}, not an object). Recovery: DELETE the block at the beach, then call pscale_pool_engage again with purpose= to recreate cleanly. Direct delete: curl -X DELETE -H 'Content-Type: application/json' -d '{"confirm":true}' "${pool_url}/.well-known/pscale-beach?block=${blockName}"`,
      }],
    };
  }

  // ── Optional: post contribution ──
  let postedPosition: number | null = null;
  if (contribution !== undefined && contribution.trim() !== '') {
    const contributionObj: Record<string, any> = {
      _: contribution,
      '1': agent_id,
      '2': '',
      '3': new Date().toISOString(),
    };
    if (face) contributionObj['4'] = face;

    const updatedBlock: Block = JSON.parse(JSON.stringify(row.block));
    let appended: { block: Block; address: string; grew: boolean };
    try {
      // Append on the positional ladder, growing the floor by supernest when the
      // current floor's 1-9 are full (accumulator.ts). Past nine the block wraps
      // — old entries absorb (a "7" still resolves) and the new one lands at a
      // fresh slot, never nested into an existing contribution.
      appended = appendWithSupernest(updatedBlock, contributionObj);
    } catch (e: any) {
      return {
        content: [{ type: 'text', text: `Pool append failed: ${e?.message ?? String(e)}` }],
      };
    }

    try {
      // On supernest the whole block changed (the floor grew), so write the whole
      // block; otherwise a surgical position write of just the new slot.
      await saveBlock(pool_url, blockName, appended.block, appended.grew
        ? { spindle: '', secret }
        : { spindle: appended.address, pscale_attention: -1, secret });
    } catch (e: any) {
      return {
        content: [{ type: 'text', text: `Pool write rejected by beach: ${e?.message ?? String(e)}` }],
      };
    }

    postedPosition = parseInt(appended.address, 10);
    // Re-load to get the canonical post-write state for the envelope.
    row = await loadBlock(pool_url, blockName);
    if (!row) {
      // Vanishingly unlikely — block existed a moment ago. Surface explicitly.
      return {
        content: [{ type: 'text', text: `Posted at slot ${appended.address} but reload failed.` }],
      };
    }
  }

  // ── Build envelope ──
  const purpose = typeof (row.block as any)._ === 'string' ? (row.block as any)._ : '';
  const { hint: synthesisHint, source: hintSource } = extractSynthesisHint(row.block);
  const { contributions, more_available } = collectContributions(row.block, sincePosition);

  const markerNew = contributions.length > 0
    ? contributions[contributions.length - 1].position
    : sincePosition;

  // ── Render as human-readable text (consistent with bsp() handler style) ──
  // The envelope shape is what matters; this rendering presents it for an LLM
  // to consume in tool-result form.
  const lines: string[] = [];
  lines.push(`pool:${pool_name} @ ${pool_url}`);
  lines.push('');
  if (created) {
    lines.push('created: pool authored with purpose at _');
    lines.push('');
  }
  if (postedPosition !== null) {
    lines.push(`posted: slot ${postedPosition} (your contribution is included below)`);
    lines.push('');
  }
  lines.push('# Purpose');
  lines.push(purpose || '(no purpose set)');
  lines.push('');
  lines.push(`# Synthesis hint (source: ${hintSource})`);
  lines.push(synthesisHint);
  lines.push('');
  lines.push(`# Contributions since position ${sincePosition} (count: ${contributions.length}${more_available ? ', more available' : ''})`);
  if (contributions.length === 0) {
    lines.push('(nothing new)');
  } else {
    for (const c of contributions) {
      const who = c.agent_id ?? '(anon)';
      const when = c.ts ?? '';
      const faceTag = c.face ? ` [${c.face}]` : '';
      lines.push(`## slot ${c.position} — ${who}${faceTag} ${when}`);
      lines.push(c.text || '(empty)');
      lines.push('');
    }
  }
  lines.push(`# Marker`);
  lines.push(`previous: ${sincePosition}`);
  lines.push(`new:      ${markerNew}`);
  lines.push(`(store marker_new and pass it back as since_position on the next call)`);

  return {
    content: [{ type: 'text', text: lines.join('\n') }],
  };
}
