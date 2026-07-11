/**
 * sand.ts — shared Level-3 (SAND) helpers.
 *
 * SAND (Signed Agent Network Datagram) is the envelope that rides on Level 3
 * content moving through committed channels (grain sides, sed: positions, pool
 * slots). A slot is a PROBE iff it carries a rider at position 9. This module
 * holds the pieces both pscale_verify_rider (verify.ts) and pscale_networking
 * (tools/networking.ts) need, so the two stay consistent:
 *
 *   - isRider / riderFromSlot — the afferent filter (rider = the opt-in to
 *     networking; a slot with no rider is chat, invisible to the loop) and the
 *     translation from the STORED rider (spine-legal digit keys, sand-rider:2)
 *     to the shape pscale_verify_rider's arithmetic expects (word keys / array).
 *   - the passport 6.2 evaluations accumulator — the canonical, spine-legal
 *     shape (sand-rider:7, l3-relay:2). The pre-existing verify.ts read a
 *     `_word` field-keyed bag (`evaluations_received`) which the beach's own
 *     shape gate would reject on write; this is the fix. Evaluations live at
 *     passport 6.2 → <topic-digits> → <sender-slot>, one digit-path slot per
 *     sender, each {_, 1:verdict, 2:v_latest, 3:giver_total, 4:ts, 5:probe_id,
 *     6:sender}. SQ-at-topic = Σ v_latest/giver_total over the topic's slots.
 */

import { Block, readAt } from './bsp.js';
import { digitPathSlots } from './tools/pool.js';

// ── The rider (afferent filter + translation) ──

/**
 * True when a channel slot carries a rider at position 9 — the mark that makes
 * it a SAND probe rather than plain bilateral content (sand-rider:8.5). This is
 * the neuron's afferent filter: chat slots (no rider) never enter the loop.
 */
export function isRider(slot: any): boolean {
  if (!slot || typeof slot !== 'object') return false;
  const r = slot['9'];
  if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
  const u = typeof r._ === 'string' ? r._.toLowerCase() : '';
  // A gray-encryption envelope also lives at position 9 ({_: 'gray', 1: mode},
  // whetstone:3.4) and must NOT be mistaken for a rider — exclude it first.
  if (u.includes('gray')) return false;
  if (u.includes('rider')) return true;
  // Otherwise key on the SAND-distinctive positions — a chain (4) or a
  // topic_coordinate (5). Probe_id (1) alone is too weak: the gray envelope
  // carries a mode string at position 1, so 1 cannot be the discriminator.
  return (typeof r['4'] === 'object' && r['4'] !== null) || typeof r['5'] === 'string';
}

/** A rider translated from stored (digit-key) form into verify-ready shape. */
export interface RiderInput {
  probe_id?: string;
  credits?: { n?: number; by?: string };
  sq?: number;
  chain?: Array<{ agent: string; sig: string }>;
  topic_coordinate?: string;
}

/**
 * Translate the STORED rider at a slot's position 9 (spine-legal digit keys per
 * sand-rider:2 — {1:probe_id, 2:credits{1:n,2:by}, 3:sq, 4:chain{1:{1:agent,
 * 2:sig},…}, 5:topic}) into the word-keyed / array shape pscale_verify_rider's
 * arithmetic consumes. Returns null when the slot carries no rider.
 */
export function riderFromSlot(slot: any): RiderInput | null {
  if (!isRider(slot)) return null;
  const r = slot['9'];
  const out: RiderInput = {};

  if (typeof r['1'] === 'string') out.probe_id = r['1'];
  if (typeof r['3'] === 'number') out.sq = r['3'];
  if (typeof r['5'] === 'string') out.topic_coordinate = r['5'];

  const c = r['2'];
  if (c && typeof c === 'object') {
    const n = typeof c['1'] === 'number' ? c['1'] : Number(c['1']);
    out.credits = { n: Number.isFinite(n) ? n : undefined, by: typeof c['2'] === 'string' ? c['2'] : undefined };
  }

  const ch = r['4'];
  if (ch && typeof ch === 'object') {
    const hops: Array<{ agent: string; sig: string }> = [];
    // Chain hops are lex-ordered digit-path sub-blocks {1:agent, 2:sig}.
    for (const slotKey of digitPathSlots()) {
      const hop = walkSlot(ch, slotKey);
      if (hop == null) continue;
      if (typeof hop === 'object' && typeof hop['1'] === 'string' && typeof hop['2'] === 'string') {
        hops.push({ agent: hop['1'], sig: hop['2'] });
      }
    }
    if (hops.length > 0) out.chain = hops;
  }

  return out;
}

/** Walk a digit-path slot ("1", "23") one digit at a time. Null if any step misses. */
function walkSlot(block: any, slot: string): any {
  let cur: any = block;
  for (const ch of slot) {
    if (typeof cur !== 'object' || cur === null) return null;
    cur = cur[ch];
    if (cur === undefined) return null;
  }
  return cur;
}

// ── The passport 6.2 evaluations accumulator (canonical, spine-legal) ──

/**
 * The canonical walked-digit sequence of a topic coordinate — the dot and any
 * leading zeros stripped, so "0.341", "341" and "3.41" all reduce to "341"
 * (they name the same walked position). Topics conventionally use digits 1-9
 * for clean nesting (sand-rider:5); an interior 0 would walk the underscore and
 * is discouraged.
 */
export function topicDigits(topicCoordinate: string): string {
  const d = String(topicCoordinate).replace(/\./g, '').replace(/^0+/, '');
  return d === '' ? '0' : d;
}

/**
 * Address of the topic node under the passport's evaluations accumulator:
 * position 6 (L3 accumulator) → 2 (evaluations) → <topic-digits>. Passport is
 * floor 1, so the canonical single-decimal form is "6." + "2" + <topic-digits>
 * (e.g. topic "0.341" → "6.2341"). Its digit children are one evaluation per
 * sender.
 */
export function topicNodeAddress(topicCoordinate: string): string {
  return '6.2' + topicDigits(topicCoordinate);
}

/**
 * Full passport address of one sender's evaluation slot under a topic: the
 * topic node address with the sender's digit-path slot appended (the decimal is
 * already placed by topicNodeAddress, so string concat is the deeper walk).
 * topic "0.341", slot "1" → "6.23411"; slot "11" → "6.234111".
 */
export function evalSlotAddress(topicCoordinate: string, senderSlot: string): string {
  return topicNodeAddress(topicCoordinate) + senderSlot;
}

/** One recipient-side evaluation of a probe (sand-rider:7.3, plus 6=sender). */
export interface Evaluation {
  verdict: string;      // pass | warn | fail
  v_latest: number;     // credit accepted from this probe
  giver_total: number;  // cumulative offered by this sender at this topic
  ts: string;
  probe_id?: string;
  sender: string;
}

/** The stored, spine-legal shape of an evaluation. */
export function evaluationContent(e: Evaluation): Block {
  const c: Block = {
    _: `evaluation — ${e.verdict} of ${e.sender}${e.probe_id ? ` (${e.probe_id})` : ''}`,
    '1': e.verdict,
    '2': e.v_latest,
    '3': e.giver_total,
    '4': e.ts,
    '6': e.sender,
  };
  if (e.probe_id) c['5'] = e.probe_id;
  return c;
}

/**
 * Find the digit-path slot under a topic node holding sender's evaluation, or
 * the next free slot if the sender has none yet. Matches by field 6 (sender)
 * so a repeat evaluation UPDATES the sender's slot rather than duplicating —
 * giver_total accumulates in place. Returns { slot, existing }.
 */
export function findSenderSlot(
  topicNode: Block | null,
  sender: string,
): { slot: string; existing: Evaluation | null } {
  let firstFree: string | null = null;
  if (topicNode && typeof topicNode === 'object') {
    for (const slot of digitPathSlots()) {
      const v = walkSlot(topicNode, slot);
      if (v == null) {
        if (firstFree === null) firstFree = slot;
        continue;
      }
      if (typeof v === 'object' && !Array.isArray(v) && v['6'] === sender) {
        return { slot, existing: readEvaluation(v, sender) };
      }
    }
  }
  return { slot: firstFree ?? '1', existing: null };
}

function readEvaluation(node: any, sender: string): Evaluation | null {
  if (!node || typeof node !== 'object') return null;
  return {
    verdict: typeof node['1'] === 'string' ? node['1'] : 'pass',
    v_latest: typeof node['2'] === 'number' ? node['2'] : 0,
    giver_total: typeof node['3'] === 'number' ? node['3'] : 0,
    ts: typeof node['4'] === 'string' ? node['4'] : '',
    probe_id: typeof node['5'] === 'string' ? node['5'] : undefined,
    sender: typeof node['6'] === 'string' ? node['6'] : sender,
  };
}

/**
 * Recompute SQ-at-topic from the passport's evaluations accumulator — the
 * canonical replacement for the field-keyed-bag walk. Walks 6.2.<topic> and
 * sums v_latest/giver_total over its digit-path children (giver_total > 0).
 * Returns { computed, count } — count 0 means no evaluations at this topic.
 */
export function recomputeSQ(passport: Block, topicCoordinate: string): { computed: number; count: number } {
  const topicNode = readAt(passport, topicNodeAddress(topicCoordinate));
  if (!topicNode || typeof topicNode !== 'object') return { computed: 0, count: 0 };
  let computed = 0;
  let count = 0;
  for (const slot of digitPathSlots()) {
    const v = walkSlot(topicNode, slot);
    if (v == null || typeof v !== 'object' || Array.isArray(v)) continue;
    const vLatest = typeof v['2'] === 'number' ? v['2'] : undefined;
    const giverTotal = typeof v['3'] === 'number' ? v['3'] : undefined;
    if (vLatest !== undefined && giverTotal !== undefined && giverTotal > 0) {
      computed += vLatest / giverTotal;
      count++;
    } else if (v['6'] !== undefined) {
      // A recorded evaluation with no credit (a knowledge-give): counts as a
      // received evaluation but contributes 0 to SQ.
      count++;
    }
  }
  return { computed, count };
}
