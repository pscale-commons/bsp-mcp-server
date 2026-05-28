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
 * Synthesis_hint sourcing (new convention layered on top of block-conventions:4.2):
 *   1. pool:<name>/9.1 if present  — explicit author intent
 *   2. pool:<name>/_   as fallback — the pool's purpose statement
 *   3. DEFAULT_SYNTHESIS_HINT      — last resort
 */

import { z } from 'zod';
import { Block, writeAt } from '../bsp.js';
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
    const v = readSlot(block, slot);
    if (v === null) continue;
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
 * Extract synthesis_hint per the three-step fallback chain. Position 9.1 is
 * the canonical authoring slot — sibling to frame:9 (canon) and sed::9
 * (governance). Position 9 as pool metadata is the convention this primitive
 * crystallises (see block-conventions:4.2.6).
 */
export function extractSynthesisHint(block: Block): { hint: string; source: 'authored' | 'purpose' | 'default' } {
  const nine = (block as any)['9'];
  if (typeof nine === 'object' && nine !== null) {
    const one = (nine as any)['1'];
    if (typeof one === 'string' && one.trim() !== '') {
      return { hint: one, source: 'authored' };
    }
    if (typeof one === 'object' && one !== null && typeof (one as any)._ === 'string' && (one as any)._.trim() !== '') {
      return { hint: (one as any)._, source: 'authored' };
    }
  }
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
};

export type PoolEngageParams = {
  agent_id: string;
  pool_url: string;
  pool_name: string;
  contribution?: string;
  face?: 'character' | 'author' | 'designer' | 'observer';
  since_position?: number;
  secret?: string;
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
  if (!row) {
    return {
      content: [{
        type: 'text',
        text: `No pool at (agent_id="${pool_url}", block="${blockName}"). Create one first via bsp() — write the pool's underscore (purpose) and optionally pool:${pool_name}/9.1 (synthesis_hint).`,
      }],
    };
  }

  // ── Optional: post contribution ──
  let postedPosition: number | null = null;
  if (contribution !== undefined && contribution.trim() !== '') {
    const slot = findNextSlot(row.block);
    const contributionObj: Record<string, any> = {
      _: contribution,
      '1': agent_id,
      '2': '',
      '3': new Date().toISOString(),
    };
    if (face) contributionObj['4'] = face;

    const updatedBlock: Block = JSON.parse(JSON.stringify(row.block));
    try {
      writeAt(updatedBlock, slot, contributionObj);
    } catch (e: any) {
      return {
        content: [{ type: 'text', text: `Pool write failed at slot ${slot}: ${e?.message ?? String(e)}` }],
      };
    }

    try {
      await saveBlock(pool_url, blockName, updatedBlock, {
        spindle: slot,
        pscale_attention: -1,
        secret,
      });
    } catch (e: any) {
      return {
        content: [{ type: 'text', text: `Pool write rejected by beach: ${e?.message ?? String(e)}` }],
      };
    }

    postedPosition = parseInt(slot, 10);
    // Re-load to get the canonical post-write state for the envelope.
    row = await loadBlock(pool_url, blockName);
    if (!row) {
      // Vanishingly unlikely — block existed a moment ago. Surface explicitly.
      return {
        content: [{ type: 'text', text: `Posted at slot ${slot} but reload failed.` }],
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
