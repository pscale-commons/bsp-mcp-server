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
 * Polymorphic by the optional verbs (the spool / frame / destination split —
 * see docs/RPG-POOL-STATE.md §4). The primitive owns transport only; it never
 * synthesises:
 *   (read)        no submit, no contribution → purpose + synthesis_hint + slice
 *   submit=<text> → STAGE to the liquid buffer (liquid:pool:<name>): one slot per
 *                   author, OVERWRITING; returns the social mirror of co-present
 *                   pending intentions. No pool append, no synthesis. Empty =
 *                   withdraw. This is the pending-mirror affordance for bsp-mcp.
 *   contribution= → COMMIT: atomic append of the text (raw OR an LLM-produced
 *                   synthesis; agnostic) to `destination` — 'pool' (default, the
 *                   shared spool) or a block name like 'solid:<name>'. The
 *                   destination is the objective dial. RPG's subjective case
 *                   (write per-subject spines) is the resolver's bsp() job.
 * submit and contribution may combine (stage then commit in one call).
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
import { createHash } from 'node:crypto';
import { Block, writeAt, readAt } from '../bsp.js';
import {
  loadBlock,
  saveBlock,
  appendToBeach,
  isFederatedOwner,
  DEFAULT_BEACH,
} from '../db.js';

// ── Defaults ──

export const DEFAULT_SYNTHESIS_HINT =
  "Synthesise the contributions through your own purpose. Each visitor reads the same stream and produces their own synthesis — there is no central resolver. Preserve distinct voices. Flag tensions and convergences honestly. What you make of it is yours.";

const READ_PAGE_LIMIT = 200;

/**
 * Deterministic exploding-d10 luck (rules:nomad:2), sha256-seeded so a window's
 * roll is fixed before any resolver reads it — honest dice HANDED by the
 * envelope, not chosen by the resolving LLM. A pure function of the seed; no
 * synthesis, no semantic interpretation (the legitimate substrate concern is
 * entropy, like a checksum). Mirrors nomad-bsp's daemon.
 */
export function deterministicLuck(seed: string): { pos: number; neg: number; luck: number } {
  let h = createHash('sha256').update(seed).digest();
  let i = 0;
  const byte = (): number => {
    if (i >= h.length) { h = createHash('sha256').update(h).digest(); i = 0; }
    return h[i++];
  };
  const d10 = (): number => (byte() % 10) + 1;
  const explode = (): number => { let total = 0, roll: number; do { roll = d10(); total += roll; } while (roll === 10); return total; };
  const pos = explode(), neg = explode();
  return { pos, neg, luck: pos - neg };
}

// ── Digit-path slot helpers (inlined; mirror xstream/lib/bsp-client.ts) ──
// "digit-path" per sunstone:1.64 — sibling + subnest in lex order, distinct
// from supernest (block-wide floor growth, sunstone:1.63).

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

/**
 * Find the digit-path slot whose entry was authored by `agentId` (its field 1).
 * Liquid (block-conventions:4.5) is one slot per author, OVERWRITING — an author
 * reuses their existing slot if present, else allocates the next free one. Floor-
 * aware (readAt) so it still finds the slot after the buffer has supernested.
 */
export function findAuthorSlot(block: Block | null, agentId: string): string | null {
  if (typeof block !== 'object' || block === null) return null;
  for (const slot of digitPathSlots()) {
    const v = readAt(block, slot);
    if (v == null) continue;
    if (typeof v === 'object' && !Array.isArray(v) && (v as Record<string, any>)['1'] === agentId) {
      return slot;
    }
  }
  return null;
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
/**
 * Floor-aware read of a block's underscore: walk the root underscore chain down
 * to its terminal string. After a supernest (sunstone:1.63) the block's top `_`
 * is the wrapped old block (an object), and the real floor value — the purpose /
 * directive — sits one level deeper per supernest. A naive `block._` read misses
 * it (the bug where the directive "vanishes" once a pool passes nine); this walks
 * to the floor, mirroring collectContributions' floor-awareness so the purpose
 * survives any amount of floor growth.
 */
export function floorUnderscore(block: Block): string {
  let u: any = (block as any)?._;
  while (u && typeof u === 'object' && !Array.isArray(u)) u = u._;
  return typeof u === 'string' ? u : '';
}

export function extractSynthesisHint(block: Block): { hint: string; source: 'purpose' | 'default' } {
  const purpose = floorUnderscore(block);
  if (typeof purpose === 'string' && purpose.trim() !== '') {
    return { hint: purpose, source: 'purpose' };
  }
  return { hint: DEFAULT_SYNTHESIS_HINT, source: 'default' };
}

// ── Window-open trace (honest dice + honest clock) ──

const WINDOW_STAMP_RE = /\bWindow opened (\S+?)\.?\s*$/;

/**
 * Read the window's open moment from the liquid buffer's underscore (floor-aware,
 * so the stamp survives a supernest). The stamp is written ONCE, when the first
 * non-empty intention lands on an empty buffer — the window's stigmergic trace.
 * Returns null on legacy buffers that predate the stamp.
 */
export function windowOpenTs(liquidBlock: Block | null): string | null {
  if (!liquidBlock || typeof liquidBlock !== 'object') return null;
  const m = floorUnderscore(liquidBlock).match(WINDOW_STAMP_RE);
  return m ? m[1] : null;
}

/**
 * The window's dice seed. Stamped buffers seed from the recorded open moment —
 * immutable for the window's whole life, so a withdraw or revise of the earliest
 * slot can neither reroll the dice nor move the clock. Legacy buffers (no stamp)
 * fall back to the earliest live timestamp — the mutable inference this trace
 * supersedes; they heal on their next window, which gets stamped at opening.
 */
export function windowSeed(
  blockName: string,
  liquidBlock: Block | null,
  liveSlots: PoolContribution[],
): { seed: string; openTs: string | null } {
  const openTs = windowOpenTs(liquidBlock);
  if (openTs) return { seed: `${blockName}:window:${openTs}`, openTs };
  const stamps = liveSlots.map(s => s.ts).filter((t): t is string => !!t).sort();
  return { seed: `${blockName}:window:${stamps[0] ?? liveSlots[0]?.text.slice(0, 24) ?? 'empty'}`, openTs: null };
}

// ── Liquid staging (submit) ──

/**
 * Stage `text` to the author's slot in the pre-commit liquid buffer
 * (liquid:pool:<name>, block-conventions:4.5). One slot per author, OVERWRITING:
 * reuse the author's existing slot if present, else allocate the next free one,
 * and write only that slot surgically so co-present peers' pending slots stay
 * intact. Returns the slot written. Empty `text` writes an empty underscore —
 * the withdraw/clear convention. This is the pending-mirror affordance: liquid
 * lives on the beach, so submit makes "see what others intend before committing"
 * a substrate capability, not an xstream-only one.
 */
async function stageLiquid(
  url: string,
  liquidName: string,
  agentId: string,
  text: string,
  face: string | undefined,
  secret: string | undefined,
): Promise<string> {
  const lrow = await loadBlock(url, liquidName);
  const exists = !!lrow && typeof lrow.block === 'object' && lrow.block !== null;
  const baseDesc = `Liquid pre-commit buffer for ${liquidName} (block-conventions:4.5) — one slot per author, overwriting; the social mirror of pending intentions before commit.`;

  const slotObj: Record<string, any> = { _: text, '1': agentId, '2': '', '3': new Date().toISOString() };
  if (face) slotObj['4'] = face;

  const liveCount = exists
    ? collectContributions(lrow!.block, 0).contributions.filter(c => c.text !== '').length
    : 0;
  const opening = text.trim() !== '' && liveCount === 0;

  if (!exists || opening) {
    // The window OPENS (or the buffer is born): rebuild fresh — prior tombstones
    // swept, the open moment stamped at the underscore as the window's stigmergic
    // trace. The dice seed and the closed-check both read this stamp; a withdraw
    // or revise cannot move it. (Two simultaneous openers can race this whole-block
    // write — last wins, the loser re-stages on their next submit; cooperative-play
    // acceptable, revisit if observed.)
    const stamp = text.trim() !== '' ? ` Window opened ${slotObj['3']}.` : '';
    const fresh: Block = { _: `${baseDesc}${stamp}` } as Block;
    (fresh as Record<string, any>)['1'] = slotObj;
    await saveBlock(url, liquidName, fresh, { spindle: '', secret });
    return '1';
  }

  // Window already live (or a withdraw): surgical — only this author's slot
  // changes; peers' slots and the stamp at the underscore stay fixed for the
  // window's whole life.
  const lblock: Block = JSON.parse(JSON.stringify(lrow!.block));
  const mySlot = findAuthorSlot(lblock, agentId) ?? findNextSlot(lblock);
  writeAt(lblock, mySlot, slotObj);
  await saveBlock(url, liquidName, lblock, { spindle: mySlot, pscale_attention: -1, secret });
  return mySlot;
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
    .describe("Optional. COMMIT text — deposit a contribution (raw OR an LLM-produced synthesis; the primitive is agnostic) at the next-free digit-path slot of the destination (1, 2, …, 9, 11, …; sunstone:1.64) with shape {_: text, 1: agent_id, 2: '', 3: ISO-ts, 4: face}, then read the envelope. Atomic append (beach-side). Omit for read-only engagement, or use `submit` to stage to liquid without committing."),
  submit: z
    .string()
    .optional()
    .describe("Optional. STAGE text to the pre-commit liquid buffer (liquid:pool:<name>, block-conventions:4.5) instead of committing. One slot per author, OVERWRITING — writes/overwrites YOUR slot and returns the social mirror of all co-present pending intentions; it does NOT append to the pool and does NOT synthesise. Empty string withdraws (clears your slot). Lets others see what you intend before you commit. May be combined with `contribution` (stage then commit in one call)."),
  destination: z
    .string()
    .optional()
    .describe("Optional, applies to `contribution`. Where the commit lands: 'pool' (default — the shared spool everyone pulls) or a block name such as 'solid:<name>' for a shared committed artifact. The deposit is a dumb atomic append; the primitive never synthesises. This is the objective dial. Structured per-subject spine writes (the RPG subjective case) are the resolver's bsp() job, NOT this param — point destination only at accumulator-shaped blocks."),
  resolves_window: z
    .string()
    .optional()
    .describe("RESOLVER-ONLY (function:thornwood:2). When committing a window's resolution event-skeleton, pass the window's open-stamp — the 'window opened <ts>' value handed back in this envelope. The beach admits the FIRST resolver of that window and rejects every other with a stand-down (single-resolution enforced atomically at the store, not by convention — two LLMs can both judge a window closed and both try to resolve). Omit for ordinary contributions / chat."),
  with_liquid: z
    .boolean()
    .optional()
    .describe("Optional. Include the liquid mirror (all co-present pending intentions from liquid:pool:<name>) in the envelope. Implied true when `submit` is provided; default false otherwise to skip the extra fetch."),
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
  submit?: string;
  destination?: string;
  with_liquid?: boolean;
  face?: 'character' | 'author' | 'designer' | 'observer';
  since_position?: number;
  secret?: string;
  purpose?: string;
  synthesis_hint?: string;
  resolves_window?: string;
};

// ── Handler ──

export async function handlePoolEngage(
  params: PoolEngageParams,
): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { agent_id, pool_url, pool_name, contribution, submit, destination, face, secret } = params;
  const sincePosition = params.since_position ?? 0;
  const withLiquid = params.with_liquid === true || submit !== undefined;

  if (!isFederatedOwner(pool_url)) {
    return {
      content: [{
        type: 'text',
        text: `pool_url must be an http(s):// URL (got "${pool_url}"). Pool engagement targets federated beaches; pass the beach URL hosting the pool.`,
      }],
    };
  }

  const blockName = `pool:${pool_name}`;
  const liquidName = `liquid:pool:${pool_name}`;

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

  // ── Optional: SUBMIT — stage to the pre-commit liquid buffer ──
  // Liquid (block-conventions:4.5) is one slot per author, OVERWRITING: your
  // current pending intention, visible to co-present peers as the social mirror
  // before anyone commits. submit overwrites YOUR slot and (via withLiquid) the
  // envelope returns the mirror; it never appends to the pool and never
  // synthesises. Empty text withdraws. This brings xstream's pending-mirror
  // reflexivity to a bare bsp-mcp caller, because liquid lives on the beach.
  let submittedSlot: string | null = null;
  if (submit !== undefined) {
    try {
      submittedSlot = await stageLiquid(pool_url, liquidName, agent_id, submit, face, secret);
    } catch (e: any) {
      return { content: [{ type: 'text', text: `Liquid submit rejected by beach: ${e?.message ?? String(e)}` }] };
    }
  }

  // ── Optional: COMMIT — deposit a contribution to a destination ──
  // The dumb deposit: append `contribution` (raw text OR an LLM-produced
  // synthesis — agnostic) to the destination accumulator. `destination` is the
  // objective dial: 'pool' (default — the shared spool everyone pulls) or any
  // block name (e.g. 'solid:<name>' for a shared artifact). The append is atomic
  // beach-side (appendToBeach): the beach allocates the slot and supernests when
  // the floor fills, so concurrent commits never race. Structured per-subject
  // spine writes (RPG) are the resolver's bsp() job, NOT this primitive.
  let postedPosition: number | null = null;
  let postedTo: string | null = null;
  let postedSupernested = false;
  if (contribution !== undefined && contribution.trim() !== '') {
    const entry: Record<string, any> = {
      _: contribution,
      '1': agent_id,
      '2': '',
      '3': new Date().toISOString(),
    };
    if (face) entry['4'] = face;

    const destBlock = destination && destination !== 'pool' ? destination : blockName;

    // A non-pool destination may not exist yet — seed it with a floor (a root
    // underscore) so the append lands on a well-formed block. The pool itself
    // already exists by here (loaded or created above).
    if (destBlock !== blockName) {
      const drow = await loadBlock(pool_url, destBlock);
      if (!drow || typeof drow.block !== 'object' || drow.block === null) {
        try {
          await saveBlock(pool_url, destBlock, { _: `Committed entries from pool:${pool_name} (block-conventions:4.2).` } as Block, { spindle: '', secret });
        } catch (e: any) {
          return { content: [{ type: 'text', text: `Could not create destination ${destBlock}: ${e?.message ?? String(e)}` }] };
        }
      }
    }

    let ack: { slot?: string; supernested?: boolean; floor?: number; alreadyResolved?: boolean; resolvedBy?: string | null };
    try {
      ack = await appendToBeach(pool_url, destBlock, entry as Block, secret, params.resolves_window);
    } catch (e: any) {
      return { content: [{ type: 'text', text: `Pool commit rejected by beach: ${e?.message ?? String(e)}` }] };
    }
    if (ack.alreadyResolved) {
      // The single-resolution claim refused this write — another resolver got the
      // window first. Not an error: stand down, do not write a second outcome.
      return {
        content: [{
          type: 'text',
          text: `window already resolved by ${ack.resolvedBy ?? 'another player'} — stand down: do NOT write a second outcome. Re-read the pool since your marker and perceive the resolution that now exists.`,
        }],
      };
    }
    postedPosition = ack.slot ? parseInt(ack.slot, 10) : null;
    postedTo = destBlock;
    postedSupernested = ack.supernested === true;

    // Reload the pool only when the commit landed in it (so the envelope's slice
    // includes the just-posted). A commit elsewhere leaves the pool unchanged.
    if (destBlock === blockName) {
      const reloaded = await loadBlock(pool_url, blockName);
      if (!reloaded) {
        return { content: [{ type: 'text', text: `Committed at slot ${ack.slot ?? '?'} but pool reload failed.` }] };
      }
      row = reloaded;
    }
  }

  // ── Build envelope ──
  const purpose = floorUnderscore(row.block);
  const { hint: synthesisHint, source: hintSource } = extractSynthesisHint(row.block);
  const { contributions, more_available } = collectContributions(row.block, sincePosition);

  const markerNew = contributions.length > 0
    ? contributions[contributions.length - 1].position
    : sincePosition;

  // Liquid mirror — co-present pending intentions, not yet committed. Fetched
  // when you submitted (you want to see the room) or when with_liquid is set.
  let liquidSlots: PoolContribution[] = [];
  let liquidBlock: Block | null = null;
  if (withLiquid) {
    const lrow = await loadBlock(pool_url, liquidName);
    if (lrow && typeof lrow.block === 'object' && lrow.block !== null) {
      liquidBlock = lrow.block;
      liquidSlots = collectContributions(lrow.block, 0).contributions;
    }
  }

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
  if (submittedSlot !== null) {
    lines.push(submit && submit.trim() !== ''
      ? `submitted: liquid slot ${submittedSlot} (your pending intention — staged, not yet committed)`
      : `withdrawn: liquid slot ${submittedSlot} cleared`);
    lines.push('');
  }
  if (postedPosition !== null) {
    const where = postedTo === blockName ? 'the pool' : postedTo;
    lines.push(`committed: slot ${postedPosition} → ${where}${postedSupernested ? ' (floor grew — supernested)' : ''}`);
    lines.push('');
  }
  lines.push('# Purpose');
  lines.push(purpose || '(no purpose set)');
  lines.push('');
  // De-dupe: for a directive pool the synthesis hint IS the underscore (source
  // 'purpose'), already printed as Purpose — don't echo it. Only when there is
  // no underscore (source 'default') is the hint a distinct fallback worth showing.
  if (hintSource === 'default') {
    lines.push('# Synthesis hint');
    lines.push(synthesisHint);
    lines.push('');
  }
  if (withLiquid) {
    lines.push(`# Liquid — pending, not yet committed (${liquidSlots.length} ${liquidSlots.length === 1 ? 'author' : 'authors'})`);
    if (liquidSlots.length === 0) {
      lines.push('(no pending intentions)');
    } else {
      for (const s of liquidSlots) {
        const who = s.agent_id ?? '(anon)';
        const mine = s.agent_id === agent_id ? ' (you)' : '';
        const when = s.ts ?? '';
        lines.push(`- ${who}${mine} ${when}: ${s.text || '(empty)'}`);
      }
    }
    lines.push('');
  }
  // Window dice — when intentions are staged, hand the resolver's exploding-d10
  // luck, deterministically seeded by the window so it is FIXED before the
  // resolver reads it (honest, not LLM-chosen). The resolver (per the game's
  // medium directive) uses these and never invents its own.
  if (withLiquid && liquidSlots.length > 0) {
    const { seed, openTs } = windowSeed(blockName, liquidBlock, liquidSlots);
    const { pos, neg, luck } = deterministicLuck(seed);
    lines.push('# Window dice (for the resolver — exploding-d10 luck, rules:nomad:2)');
    lines.push(`positive ${pos}, negative ${neg}, luck ${luck > 0 ? '+' : ''}${luck} — fixed for this window; use these, never invent dice.`);
    if (openTs) {
      lines.push(`window opened ${openTs} — the stamp does not move; closed once the room's duration has passed.`);
    }
    lines.push('');
  }
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
