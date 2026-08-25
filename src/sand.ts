/**
 * sand.ts — shared Level-3 (SAND) helpers, v2.
 *
 * SAND (Signed Agent Network Datagram) is the envelope that rides on Level 3
 * content moving through committed channels (grain sides, sed: positions, pool
 * slots). A slot is a PROBE iff it carries a rider at position 9. This module
 * holds the pieces pscale_verify_rider (verify.ts) and pscale_networking
 * (tools/networking.ts) share, so the two stay one truth (sand-v2:5.3).
 *
 * v2 (2026-08-25, per the sand-v2 block at the beach — David's five rulings at
 * its branch 1; audit at stash:keel:27) — the correction that lets SAND run as
 * the gift economy Volume 3 describes:
 *
 *   - THE OUT-LEDGER (passport 6.3, sand-v2:3): the giver records the giving —
 *     a GAVE entry per probe, written by the giver under the giver's own latch
 *     in the same act that authors the probe. A GAVE is an OPEN OFFER until
 *     received; nothing debits at give.
 *   - RECEIPTS (passport 6.2, sand-v2:4): keep IS receive — the recipient's
 *     evaluation entry is the receipt, and the transfer happens at receive.
 *     Receipts are PER-PROBE (dedup key sender+probe_id): the per-GAVE lookup
 *     in sand-v2:3.4 requires it, and a latest-only receipt would let a repeat
 *     giver re-arm (conservation fixture 12 in scripts/smoke-sand.ts). SQ still
 *     reads each sender's LATEST receipt only (sand-v2:7.1, 8.1) — the receipt
 *     record is cumulative, the trust signal is present-state.
 *   - BALANCE, computed on read, never stored (sand-v2:3.4): balance =
 *     minted + received − given, where given sums what the named recipients'
 *     receipts record as received. Passport 6.1 is retired as a stored balance.
 *   - SQ FROM OTHERS (sand-v2:7): the sender's out-ledger names the recipients;
 *     their receipts carry the evaluations. A sender cannot author its own SQ.
 *     Self-receipts (sender = recipient) are excluded from every sum.
 *   - SIGNED HOPS (sand-v2:6): sha256 becomes ed25519 over the same bytes
 *     (probe_id + prev_sig), verified against the key published at passport
 *     9.1. A hop by a keyless agent is UNBACKED, not pass.
 */

import nacl from 'tweetnacl';
import { Block, readAt } from './bsp.js';
import { digitPathSlots, readSlot, isEntryNode } from './tools/pool.js';

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
 * Translate a STORED rider object (spine-legal digit keys per sand-rider:2 —
 * {1:probe_id, 2:credits{1:n,2:by}, 3:sq, 4:chain{1:{1:agent,2:sig},…},
 * 5:topic}) into the word-keyed / array shape the verifier's arithmetic
 * consumes. This is the ONE translation both verifiers use (sand-v2:5.3) —
 * the v1 standalone tool consumed word-keys only, so a stored rider passed
 * as-is silently skipped its dimensions (the two-verifiers divergence
 * witnessed 2026-08-25, stash:keel:27.3).
 */
export function translateStoredRider(r: any): RiderInput | null {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
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

/**
 * The rider at a slot's position 9, translated. Null when the slot carries no
 * rider.
 */
export function riderFromSlot(slot: any): RiderInput | null {
  if (!isRider(slot)) return null;
  return translateStoredRider(slot['9']);
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

// ── Addresses under passport position 6 (the L3 accumulator) ──

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
 * Address of the topic node under the passport's receipts accumulator:
 * position 6 (L3 accumulator) → 2 (receipts/evaluations) → <topic-digits>.
 * Passport is floor 1, so the canonical single-decimal form is "6." + "2" +
 * <topic-digits> (e.g. topic "0.341" → "6.2341"). Its digit children are
 * receipt slots.
 */
export function topicNodeAddress(topicCoordinate: string): string {
  return '6.2' + topicDigits(topicCoordinate);
}

/**
 * Full passport address of one receipt slot under a topic: the topic node
 * address with the slot's digit path appended (the decimal is already placed
 * by topicNodeAddress, so string concat is the deeper walk).
 * topic "0.341", slot "1" → "6.23411"; slot "11" → "6.234111".
 */
export function evalSlotAddress(topicCoordinate: string, senderSlot: string): string {
  return topicNodeAddress(topicCoordinate) + senderSlot;
}

/** The out-ledger node: position 6 → 3 (sand-v2:3.1). An accumulator of GAVEs. */
export const OUT_LEDGER_ADDRESS = '6.3';

/** Full passport address of one GAVE slot: "6.3" + the slot's digit path. */
export function gaveSlotAddress(slot: string): string {
  return OUT_LEDGER_ADDRESS + slot;
}

// ── Receipts (passport 6.2) — keep IS receive (sand-v2:4) ──

/** One receipt — the recipient's evaluation of a probe (sand-rider:7.3 shape,
 *  plus 6=sender). v2 semantics: v_latest is the credit RECEIVED from this
 *  probe; the entry is per-probe (dedup key sender+probe_id). */
export interface Evaluation {
  verdict: string;      // pass | warn | fail
  v_latest: number;     // credit accepted (received) from this probe
  giver_total: number;  // cumulative offered by this sender at this topic — record only
  ts: string;
  probe_id?: string;
  sender: string;
}

/** True when a receipt TRANSFERS — the probe was backed at receive. Receipts
 *  of unbacked and failed probes stand as reputation signal only: they carry
 *  no credit and enter no balance, on either side (sand-v2:5.5; l3-relay:2.3).
 *  Without this, a pair could conjure balance from nothing — an unbacked give
 *  received anyway credits the receiver while only the giver reads negative,
 *  and ruling 1.1 (credits are created only at the mint) breaks. Witnessed by
 *  trial 1's own bootstrap, which exploited exactly this before the fix. */
export function receiptTransfers(e: Evaluation): boolean {
  return e.verdict !== 'unbacked' && e.verdict !== 'fail';
}

/** The stored, spine-legal shape of a receipt. */
export function evaluationContent(e: Evaluation): Block {
  const c: Block = {
    _: `receipt — ${e.verdict} of ${e.sender}${e.probe_id ? ` (${e.probe_id})` : ''}${e.v_latest ? `, received ${e.v_latest}` : ''}`,
    '1': e.verdict,
    '2': e.v_latest,
    '3': e.giver_total,
    '4': e.ts,
    '6': e.sender,
  };
  if (e.probe_id) c['5'] = e.probe_id;
  return c;
}

/** True when a node reads as a receipt: verdict at 1 and sender at 6. */
export function isReceiptNode(v: any): boolean {
  return !!v && typeof v === 'object' && !Array.isArray(v)
    && typeof v['1'] === 'string' && typeof v['6'] === 'string';
}

/**
 * Find the digit-path slot under a topic node holding the receipt for
 * (sender, probe_id), or the next free slot if none. PER-PROBE (v2): a new
 * probe from a known sender takes a NEW slot — repeat gives must each leave
 * their own receipt or the giver's balance re-arms on read (conservation).
 * Re-evaluating the SAME probe updates its slot in place. A v1-era receipt
 * with no probe_id matches only a probe-id-less lookup.
 */
export function findReceiptSlot(
  topicNode: Block | null,
  sender: string,
  probe_id: string | undefined,
): { slot: string; existing: Evaluation | null } {
  let firstFree: string | null = null;
  if (topicNode && typeof topicNode === 'object') {
    for (const slot of digitPathSlots()) {
      const v = walkSlot(topicNode, slot);
      if (v == null) {
        if (firstFree === null) firstFree = slot;
        continue;
      }
      if (isReceiptNode(v) && v['6'] === sender && v['5'] === probe_id) {
        return { slot, existing: readEvaluation(v, sender) };
      }
    }
  }
  return { slot: firstFree ?? '1', existing: null };
}

/** The sender's receipts under a topic node, slot order (allocation order). */
export function receiptsFromSender(topicNode: Block | null, sender: string): Evaluation[] {
  const out: Evaluation[] = [];
  if (!topicNode || typeof topicNode !== 'object') return out;
  for (const slot of digitPathSlots()) {
    const v = walkSlot(topicNode, slot);
    if (v == null) continue;
    if (isReceiptNode(v) && v['6'] === sender) {
      const e = readEvaluation(v, sender);
      if (e) out.push(e);
    }
  }
  return out;
}

/** The sender's LATEST receipt under a topic node (max ts; slot order breaks
 *  ties) — the evaluation-of-record for SQ (sand-v2:7.1, 8.1). */
export function latestReceiptFromSender(topicNode: Block | null, sender: string): Evaluation | null {
  let latest: Evaluation | null = null;
  for (const e of receiptsFromSender(topicNode, sender)) {
    if (!latest || e.ts >= latest.ts) latest = e;
  }
  return latest;
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
 * Every receipt under passport 6.2, across all topics. Recursive walk, depth-
 * capped; a node that tests as a receipt is collected and not descended into
 * (its digit children are fields, not deeper topics).
 */
export function collectReceipts(passport: Block): Evaluation[] {
  const root = readAt(passport, '6.2');
  const out: Evaluation[] = [];
  const walk = (node: any, depth: number) => {
    if (!node || typeof node !== 'object' || depth > 12) return;
    for (let d = 1; d <= 9; d++) {
      const child = node[String(d)];
      if (child == null || typeof child !== 'object' || Array.isArray(child)) continue;
      if (isReceiptNode(child)) {
        const e = readEvaluation(child, child['6']);
        if (e) out.push(e);
      } else {
        walk(child, depth + 1);
      }
    }
  };
  if (root && typeof root === 'object') walk(root, 0);
  return out;
}

// ── The out-ledger (passport 6.3) — GAVE entries (sand-v2:3) ──

/** One GAVE — the giver's own record of the giving, written with the probe.
 *  A MINT-GAVE (sand-v2:2.1.2, David's ruling 2026-08-25) is an ordinary GAVE
 *  whose channel (6) names the backing ticket-grain ("grain:<pair_id>") and
 *  whose audit (7) names the verifier's audit position carrying the
 *  [ticket-verified] envelope ("sed:<verifier>-audit-<yyyy-mm>:<position>",
 *  payway:2.3) — the gave points at its own verification, so no discovery. */
export interface Gave {
  voicing: string;      // _ — what was shared, to whom, why, the giver's words
  probe_id: string;     // 1
  n: number;            // 2 — offered
  to: string;           // 3 — the recipient handle (or grain side / sed: position / pool addressed)
  topic?: string;       // 4 — topic_coordinate
  ts: string;           // 5
  channel?: string;     // 6 — the channel address of the probe slot; "grain:<pid>" marks a mint-gave
  audit?: string;       // 7 — mint-gave only: the [ticket-verified] audit position, "sed:<name>:<position>"
}

/** The stored, spine-legal shape of a GAVE entry. */
export function gaveContent(g: Gave): Block {
  const c: Block = {
    _: g.voicing,
    '1': g.probe_id,
    '2': g.n,
    '3': g.to,
    '5': g.ts,
  };
  if (g.topic) c['4'] = g.topic;
  if (g.channel) c['6'] = g.channel;
  if (g.audit) c['7'] = g.audit;
  return c;
}

/** True when a node reads as a GAVE: probe_id at 1 (string), offered at 2
 *  (number), recipient at 3 (string). */
export function isGaveNode(v: any): boolean {
  return !!v && typeof v === 'object' && !Array.isArray(v)
    && typeof v['1'] === 'string' && typeof v['2'] === 'number' && typeof v['3'] === 'string';
}

function readGave(node: any): Gave | null {
  if (!isGaveNode(node)) return null;
  return {
    voicing: typeof node['_'] === 'string' ? node['_'] : '',
    probe_id: node['1'],
    n: node['2'],
    to: node['3'],
    topic: typeof node['4'] === 'string' ? node['4'] : undefined,
    ts: typeof node['5'] === 'string' ? node['5'] : '',
    channel: typeof node['6'] === 'string' ? node['6'] : undefined,
    audit: typeof node['7'] === 'string' ? node['7'] : undefined,
  };
}

/** Every GAVE under passport 6.3, slot order (allocation = giving order). */
export function collectGaves(passport: Block): Array<Gave & { slot: string }> {
  const node = readAt(passport, OUT_LEDGER_ADDRESS);
  const out: Array<Gave & { slot: string }> = [];
  if (!node || typeof node !== 'object') return out;
  for (const slot of digitPathSlots()) {
    // Prune descent through occupied entries: a GAVE's own fields are never
    // later slots (the counting line nests only through containers).
    if (slotPathBlocked(node, slot)) continue;
    const v = walkSlot(node, slot);
    if (v == null) continue;
    const g = readGave(v);
    if (g) out.push({ ...g, slot });
  }
  return out;
}

/** A multi-digit slot path is blocked when a proper prefix is an occupied
 *  entry — its children are fields, not slots. */
function slotPathBlocked(node: any, slot: string): boolean {
  for (let i = 1; i < slot.length; i++) {
    const prefix = walkSlot(node, slot.slice(0, i));
    if (prefix != null && (isEntryNode(prefix) || isGaveNode(prefix) || isReceiptNode(prefix))) return true;
  }
  return false;
}

/** The GAVE matching a probe_id, or null. First match wins (probe_ids are the
 *  giver's own discipline to keep unique — sand-rider:4.5). */
export function findGave(passport: Block, probe_id: string): (Gave & { slot: string }) | null {
  for (const g of collectGaves(passport)) {
    if (g.probe_id === probe_id) return g;
  }
  return null;
}

/** The next free slot under a (possibly absent) out-ledger node. */
export function nextGaveSlot(passport: Block): string {
  const node = readAt(passport, OUT_LEDGER_ADDRESS);
  if (!node || typeof node !== 'object') return '1';
  for (const slot of digitPathSlots()) {
    if (slotPathBlocked(node, slot)) continue;
    if (walkSlot(node, slot) == null) return slot;
  }
  return '999';
}

// ── Balance — computed on read, never stored (sand-v2:3.4, as ruled at 2.1.2) ──

/** Loads a passport by bare handle (or grain/sed address). Injectable so the
 *  battery runs in-memory; the live default is db.getPassportFromAddress. */
export type PassportLoader = (handle: string) => Promise<Block | null>;

export interface BalanceBreakdown {
  received: number;  // Σ v_latest across the holder's transferring receipts, self excluded (sand-v2:4.1) — the mint rides here (a mint-gave received is an ordinary receipt)
  given: number;     // Σ over the holder's GAVEs of what each named recipient's receipt records (sand-v2:3.4)
  balance: number;   // received − given, full stop (sand-v2:2.1.3a — a separate minted term double-counts under mint-as-gave)
  gaves: number;     // GAVE entries walked
  openOffers: number; // GAVEs with no matching receipt at the recipient — standing offers, never debts
}

/**
 * balance(X) = received(X) − given(X), computed on read (sand-v2:3.4 as ruled
 * at 2.1.2: MINT-AS-GAVE — the mint lands as an ordinary GAVE from the issuer,
 * backed by the ticket-grain rather than by the issuer's balance, and the
 * buyer receives it by keep; minted dissolves into received, so a separate
 * minted term would double-count, per keel's consequence at 2.1.3a).
 * received sums X's own TRANSFERRING receipts (self-receipts excluded —
 * sand-v2:4.5, 7.5; unbacked/failed receipts excluded — 5.5). given reads,
 * for each GAVE, the named recipient's receipt for that probe_id — the
 * recipient's receipt is authoritative for the amount transferred, the
 * giver's GAVE for the offer. A GAVE to self nets zero and is skipped. An
 * issuer's mint-gaves debit its given like any other (a dedicated mint handle
 * carries the circulation as its honest negative; whether ticket-backed gaves
 * should instead leave given alone is the open ruling at sand-v2:2.1.3c).
 */
export async function computeBalance(
  handle: string,
  passport: Block,
  loadPassport: PassportLoader,
): Promise<BalanceBreakdown> {
  let received = 0;
  for (const r of collectReceipts(passport)) {
    if (r.sender === handle) continue; // self-receipt transfers nothing (sand-v2:4.5)
    if (!receiptTransfers(r)) continue; // unbacked/failed at receive — reputation only (sand-v2:5.5)
    received += r.v_latest;
  }

  let given = 0;
  let openOffers = 0;
  const gaves = collectGaves(passport);
  const cache = new Map<string, Block | null>();
  for (const g of gaves) {
    if (g.to === handle) continue; // a gift to self nets zero (sand-v2:4.5)
    let rp = cache.get(g.to);
    if (rp === undefined) {
      rp = await loadPassport(g.to);
      cache.set(g.to, rp);
    }
    if (!rp) { openOffers++; continue; }
    const topicNode = g.topic ? readAt(rp, topicNodeAddress(g.topic)) : null;
    const receipts = receiptsFromSender(
      topicNode && typeof topicNode === 'object' ? (topicNode as Block) : null,
      handle,
    ).filter((r) => r.probe_id === g.probe_id && receiptTransfers(r));
    if (receipts.length === 0) { openOffers++; continue; }
    // The recipient's receipt is authoritative for the amount transferred;
    // partial receipt leaves the remainder as open offer under the same GAVE
    // (sand-v2:4.2) — given subtracts what was received, not what was offered.
    // The transfer filter is SYMMETRIC with received's (receiptTransfers): a
    // non-transferring receipt subtracts from neither side, so conservation
    // survives the filter.
    given += receipts.reduce((s, r) => s + r.v_latest, 0);
  }

  return { received, given, balance: received - given, gaves: gaves.length, openOffers };
}

// ── The mint's grain check (sand-v2:2.1.2 ruling + 5.1.1 consequence) ──

/** The credits=N of a [ticket ...] envelope, or null when the text is not a
 *  credit-bearing ticket envelope (payway:2.2). */
export function parseTicketCredits(envelope: unknown): number | null {
  if (typeof envelope !== 'string' || !envelope.includes('[ticket')) return null;
  const m = envelope.match(/credits=(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Which side of a grain a handle occupies (position 9 = {1: A, 2: B}). */
export function grainSideOfHandle(grain: Block | null, handle: string): '1' | '2' | null {
  const nine = (grain as any)?.['9'] as Record<string, string> | undefined;
  if (!nine) return null;
  if (nine['1'] === handle) return '1';
  if (nine['2'] === handle) return '2';
  return null;
}

/** True when any digit child of a grain side carries a [ticket-revoked]
 *  envelope (payway:2.2 — revocations are terminal-string sub-facts of the
 *  issuer's side; verifiers MUST honour them). */
export function sideRevoked(sideNode: any): boolean {
  if (!sideNode || typeof sideNode !== 'object') return false;
  for (let d = 1; d <= 9; d++) {
    const v = sideNode[String(d)];
    if (typeof v === 'string' && v.includes('[ticket-revoked')) return true;
  }
  return false;
}

/** Loads any named beach block ("grain:<pid>", "sed:<name>") — injectable so
 *  the battery runs in-memory. */
export type BlockLoader = (name: string) => Promise<Block | null>;

export interface GrainMintResult {
  checked: true;
  valid?: boolean;
  unbacked?: boolean;
  grain: string;
  ticket_credits?: number;
  cited?: number;
  reason?: string;
}

/**
 * The grain-backed check for a MINT-GAVE (the adopted consequence at
 * sand-v2:5.1.1): a GAVE whose channel names a [ticket-verified] grain is
 * checked against the GRAIN, not the issuer's balance —
 *   - the issuer's side underscore carries a [ticket ...] envelope with
 *     credits=N (payway:2.2);
 *   - no [ticket-revoked] child on that side (revocation unminted it —
 *     sand-v2:2.3; a post-revocation mint-gave is unbacked, while receipts
 *     already written stand);
 *   - the gave's audit field names the verifier's audit position whose
 *     declaration carries [ticket-verified] naming this grain (payway:2.3 —
 *     verification lives in the verifier's audit collective, never on the
 *     locked grain);
 *   - NET of the issuer's gaves citing this grain: Σ n ≤ N, this gave
 *     included — else one ticket backs unlimited mint-gaves and the fiat
 *     boundary at 1.1 stops binding (keel's consequence at 2.1.3b).
 */
export async function verifyGrainMint(
  giver: string,
  giverPassport: Block,
  gave: Gave & { slot: string },
  loadBlock: BlockLoader,
): Promise<GrainMintResult> {
  const grainName = gave.channel!;
  const out = (r: Partial<GrainMintResult>): GrainMintResult => ({ checked: true, grain: grainName, ...r });

  const grain = await loadBlock(grainName);
  if (!grain) return out({ unbacked: true, reason: `${grainName} not found — nothing backs the mint` });

  const side = grainSideOfHandle(grain, giver);
  if (!side) return out({ unbacked: true, reason: `${giver} is not a party to ${grainName} (position 9)` });

  const sideNode = (grain as any)[side];
  const envelope = sideNode && typeof sideNode === 'object' ? sideNode['_'] : sideNode;
  const credits = parseTicketCredits(envelope);
  if (credits === null) return out({ unbacked: true, reason: `${grainName} side ${side} carries no credit-bearing [ticket ...] envelope` });

  if (sideRevoked(sideNode)) {
    return out({ unbacked: true, ticket_credits: credits, reason: 'ticket revoked — unminted (sand-v2:2.3); receipts already written stand, new mint-gaves do not' });
  }

  // [ticket-verified] at the audit position the gave itself names.
  if (!gave.audit || !/^sed:[^:]+:\d+$/.test(gave.audit)) {
    return out({ unbacked: true, ticket_credits: credits, reason: 'mint-gave names no audit position (field 7, "sed:<verifier>-audit-<yyyy-mm>:<position>") — unverified' });
  }
  const lastColon = gave.audit.lastIndexOf(':');
  const auditBlockName = gave.audit.slice(0, lastColon);
  const auditPos = gave.audit.slice(lastColon + 1);
  const auditBlock = await loadBlock(auditBlockName);
  const decl = auditBlock ? walkDigits(auditBlock, auditPos) : null;
  const declText = typeof decl === 'string' ? decl : (decl && typeof decl === 'object' ? decl['_'] : null);
  if (typeof declText !== 'string' || !declText.includes('[ticket-verified') || !declText.includes(grainName)) {
    return out({ unbacked: true, ticket_credits: credits, reason: `no [ticket-verified] naming ${grainName} at ${gave.audit}` });
  }

  // Net of the issuer's gaves against this grain, in GIVING ORDER up to and
  // including the gave being verified — a later over-issue never poisons an
  // earlier legitimate mint; the gave that crossed the line is the one that
  // reads unbacked.
  let cited = 0;
  for (const g of collectGaves(giverPassport)) {
    if (g.channel !== grainName) continue;
    cited += g.n;
    if (g.slot === gave.slot) break;
  }
  if (cited > credits) {
    return out({ unbacked: true, ticket_credits: credits, cited, reason: `grain credits exhausted: gaves citing ${grainName} total ${cited} against ${credits} minted` });
  }

  return out({ valid: true, ticket_credits: credits, cited });
}

function walkDigits(block: any, digits: string): any {
  let cur: any = block;
  for (const ch of digits) {
    if (typeof cur !== 'object' || cur === null) return null;
    cur = cur[ch];
    if (cur === undefined) return null;
  }
  return cur;
}

// ── SQ — computed locally, sourced from others (sand-v2:7) ──

/**
 * First-order SQ(X, topic) = Σ over recipients of the latest received from X
 * ÷ Σ over X's GAVEs at the topic of the amount offered (sand-v2:7.2). The
 * sender's out-ledger names the recipients; each recipient's OWN passport
 * holds their latest receipt — others hold the evaluations, so the sender
 * cannot author its own score (the v1 inversion, stash:keel:27 probe 4).
 * Self-gives are excluded from every sum. `lastN` defaults to 9 — the current
 * floor's nine of the out-ledger (sand-v2:7.2); pass Infinity to walk all.
 * Returns { computed, offered, count } — count is recipients consulted;
 * count 0 with offered 0 means no gives at this topic.
 */
export async function recomputeSQFromOthers(
  handle: string,
  passport: Block,
  topicCoordinate: string,
  loadPassport: PassportLoader,
  opts?: { lastN?: number },
): Promise<{ computed: number; offered: number; count: number }> {
  const lastN = opts?.lastN ?? 9;
  const topic = topicDigits(topicCoordinate);
  const atTopic = collectGaves(passport)
    .filter((g) => g.topic !== undefined && topicDigits(g.topic) === topic && g.to !== handle);
  const recent = Number.isFinite(lastN) ? atTopic.slice(-lastN) : atTopic;

  const offered = recent.reduce((s, g) => s + g.n, 0);
  const recipients = [...new Set(recent.map((g) => g.to))];

  let receivedLatest = 0;
  let count = 0;
  const cache = new Map<string, Block | null>();
  for (const to of recipients) {
    let rp = cache.get(to);
    if (rp === undefined) {
      rp = await loadPassport(to);
      cache.set(to, rp);
    }
    if (!rp) continue;
    const tnode = readAt(rp, topicNodeAddress(topicCoordinate));
    const latest = latestReceiptFromSender(
      tnode && typeof tnode === 'object' ? (tnode as Block) : null,
      handle,
    );
    if (latest) {
      receivedLatest += latest.v_latest;
      count++;
    }
  }

  return { computed: offered > 0 ? receivedLatest / offered : 0, offered, count };
}

// ── Signed hops (sand-v2:6) — ed25519 over the same bytes ──

export interface ChainHop { agent: string; sig: string }

/** The signed bytes of a hop: probe_id + prev_sig, utf8 — v1's sha256 input,
 *  unchanged (sand-v2:6._: one field's derivation changes). The first hop's
 *  prev_sig is the empty string. */
export function hopMessage(probe_id: string, prevSig: string): Uint8Array {
  return new TextEncoder().encode(probe_id + prevSig);
}

/** Sign one hop with an ed25519 secret key (64-byte nacl form). Base64. */
export function signHop(probe_id: string, prevSig: string, secretKey: Uint8Array): string {
  return Buffer.from(nacl.sign.detached(hopMessage(probe_id, prevSig), secretKey)).toString('base64');
}

/** Loads an agent's published ed25519 public key (base64) from passport 9.1,
 *  or null when none is published. Injectable for the battery. */
export type KeyLoader = (handle: string) => Promise<string | null>;

export interface ChainVerifyResult {
  checked: boolean;
  valid?: boolean;
  unbacked?: boolean;       // a hop's agent has published no key — cannot verify (sand-v2:6.2)
  break_at_hop?: number;
  reason?: string;
}

/**
 * Verify a signed chain: for each hop, the agent's published key verifies the
 * signature over (probe_id + prev_sig). The first cryptographic mismatch is a
 * BREAK at that hop — fail. A hop whose agent has published no key cannot be
 * verified — the chain dimension is UNBACKED, not pass (sand-v2:6.2).
 */
export async function verifyChainSigned(
  probe_id: string | undefined,
  chain: ChainHop[] | undefined,
  loadKey: KeyLoader,
): Promise<ChainVerifyResult> {
  if (!chain || chain.length === 0 || !probe_id) return { checked: false };
  for (let i = 0; i < chain.length; i++) {
    const prevSig = i === 0 ? '' : chain[i - 1].sig;
    const pub = await loadKey(chain[i].agent);
    if (!pub) {
      return {
        checked: true,
        unbacked: true,
        break_at_hop: i,
        reason: `hop ${i} (${chain[i].agent}) has published no key — cannot verify (publish via pscale_key_publish)`,
      };
    }
    let ok = false;
    try {
      ok = nacl.sign.detached.verify(
        hopMessage(probe_id, prevSig),
        new Uint8Array(Buffer.from(chain[i].sig, 'base64')),
        new Uint8Array(Buffer.from(pub, 'base64')),
      );
    } catch {
      ok = false;
    }
    if (!ok) {
      return {
        checked: true,
        valid: false,
        break_at_hop: i,
        reason: `sig does not verify at hop ${i} (${chain[i].agent})`,
      };
    }
  }
  return { checked: true, valid: true };
}
