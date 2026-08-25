/**
 * tools/networking.ts — pscale_networking primitive (the social neuron), v2.
 *
 * SAND (Level 3) is specified but was inert: the envelope (sand-rider), the
 * verbs (l3-relay), and the arithmetic (pscale_verify_rider) all existed, but
 * nothing DROVE the loop. This primitive is the driver. The neuron is the
 * CALLING LLM at the edge; this tool is its afferent + efferent surface (no
 * LLM runs inside bsp-mcp).
 *
 * The loop (l3-relay:6.1): walk a committed channel for new probes since a
 * marker → verify each (verifyRiderCore, sand-v2 verdicts) → choose a verb →
 * execute the substrate write → report the fold.
 *
 * THE RIDER IS THE OPT-IN. A slot with no rider at position 9 is plain content
 * (chat, sand-rider:8.5) and is invisible to the loop.
 *
 * v2 (2026-08-25, per the sand-v2 block; David's rulings at its branch 1):
 *
 *   KEEP IS RECEIVE (sand-v2:4) — credit_accept is the amount received,
 *   recorded as a per-probe receipt at the recipient's passport 6.2; the
 *   receipt IS the transfer (balance moves on read, nobody writes the giver's
 *   passport but the giver). On a grain the keep also writes the receipt
 *   where the giver gave — a reply-anchored line on the receiver's own side —
 *   so the giver sees their act complete (give/receive is one act seen from
 *   two ends).
 *
 *   FORWARD SIGNS ITS HOP (sand-v2:6) — the hop's sig is ed25519 over
 *   (probe_id + prev_sig), made with the key the forwarder has published at
 *   passport 9.1 (pscale_key_publish). A forwarder whose seed does not derive
 *   the published key is refused — an unverifiable hop would read unbacked
 *   forever. Endorsing (raising the credit claim) is the forwarder's OWN give
 *   and writes a GAVE at the forwarder's out-ledger (6.3).
 *
 *   HAU — the fifth verb (sand-v2:4.4, 4.6; named by David's ruling, source
 *   honoured: the hau of the gift travels back along the path it took —
 *   Tamati Ranapiri via Mauss; Sahlins; Hyde). When a probe's objective
 *   completes, the beneficiary shares to the hops of its chain: one fresh
 *   probe and one GAVE per hop, credits split equally or by the hops' SQ at
 *   the topic (Fair-Share). Each hop receives by keep. A gift, not a rule —
 *   nothing compels it; a chain that died before completion is never shared
 *   to, and that omission is the free rider's whole cost.
 *
 * AUTONOMY (v1 rule, unchanged): auto executes only keep (a pass-verdict from
 * a sender already trusted at the topic, credit 0) and drop (a fail-verdict).
 * UNBACKED always surfaces and is never auto-kept with credit (sand-v2:5.4).
 * forward, reply and hau always surface — trust is earned before delegated.
 *
 * v2 channel support: grain (side-aware) and pool/marks (flat digit-path).
 * sed: sub-position scanning remains future work.
 */

import { z } from 'zod';
import { Block, readAt, writeAt } from '../bsp.js';
import {
  loadBlock,
  saveBlock,
  appendToBeach,
  isFederatedOwner,
  getPublicKeys,
  getPassportFromAddress,
  DEFAULT_BEACH,
} from '../db.js';
import { verifyRiderCore } from './verify.js';
import {
  isRider,
  riderFromSlot,
  topicNodeAddress,
  evalSlotAddress,
  findReceiptSlot,
  receiptsFromSender,
  latestReceiptFromSender,
  evaluationContent,
  gaveContent,
  gaveSlotAddress,
  nextGaveSlot,
  signHop,
  recomputeSQFromOthers,
} from '../sand.js';
import { digitPathSlots, findNextSlot, isEntryNode } from './pool.js';
import { deriveKeypair, formatPublicKeys } from '../keys.js';
import { pairId } from '../locks.js';

// ── Probe as scanned from a channel ──

interface ScannedProbe {
  slot: string;        // address within the channel ("2.1" grain, "11" pool)
  ordinal: number;     // monotonic cursor value (the sub-slot integer)
  from: string | null; // slot field 1
  content: string;     // slot underscore
  ts: string | null;
  probe_id?: string;
  topic?: string;
  offered: number;     // rider credits.n (what the sender offers), 0 if none
  node: any;           // the raw slot object (for chain extension on forward/hau)
}

/** Resolve which grain side an agent occupies (position 9 = {1: A, 2: B}). */
function grainSideOf(grainBlock: Block | null, agentId: string): '1' | '2' | null {
  const nine = grainBlock?.['9'] as Record<string, string> | undefined;
  if (!nine) return null;
  if (nine['1'] === agentId) return '1';
  if (nine['2'] === agentId) return '2';
  return null;
}

/**
 * Scan a channel for rider-bearing probes newer than `sinceOrdinal`.
 * Grain: inbound probes sit on the PARTNER's side. Pool/marks: probes are the
 * digit-path slots. Descent through an occupied entry is pruned — an entry's
 * position 9 is its RIDER, not a later slot (the pool:keel 69/692/694 leak,
 * stash:keel:27.3).
 */
function scanChannel(
  channelBlock: Block,
  channelName: string,
  agentId: string,
  sinceOrdinal: number,
): { probes: ScannedProbe[]; note?: string } {
  const probes: ScannedProbe[] = [];

  const collectFrom = (sideNode: any, prefix: string) => {
    if (!sideNode || typeof sideNode !== 'object') return;
    for (const sub of digitPathSlots()) {
      if (sub.length > 1 && subPathBlocked(sideNode, sub)) continue;
      const v = walkPath(sideNode, sub);
      if (v == null) continue;
      if (typeof v !== 'object' || Array.isArray(v)) continue;
      if (!isRider(v)) continue;
      const ordinal = parseInt(sub, 10);
      if (ordinal <= sinceOrdinal) continue;
      probes.push(toScannedProbe(v, prefix ? `${prefix}.${sub}` : sub, ordinal));
    }
  };

  if (channelName.startsWith('grain:')) {
    const mySide = grainSideOf(channelBlock, agentId);
    if (mySide === null) {
      return { probes, note: `${agentId} is not a party to ${channelName} (position 9). Cannot resolve inbound side.` };
    }
    const otherSide = mySide === '1' ? '2' : '1';
    collectFrom(channelBlock[otherSide], otherSide);
    return { probes };
  }

  if (channelName.startsWith('sed:')) {
    return { probes, note: 'sed: sub-position scanning is future work — point pscale_networking at a grain or pool for now.' };
  }

  // pool / marks / flat accumulator — probes are the digit-path slots.
  collectFrom(channelBlock, '');
  return { probes };
}

/** A multi-digit sub-path whose proper prefix is an occupied entry is that
 *  entry's field, never a slot. */
function subPathBlocked(node: any, sub: string): boolean {
  for (let i = 1; i < sub.length; i++) {
    if (isEntryNode(walkPath(node, sub.slice(0, i)))) return true;
  }
  return false;
}

function toScannedProbe(node: any, slot: string, ordinal: number): ScannedProbe {
  const ri = riderFromSlot(node);
  const credits = ri?.credits?.n;
  return {
    slot,
    ordinal,
    from: typeof node['1'] === 'string' ? node['1'] : null,
    content: typeof node._ === 'string' ? node._ : '',
    ts: typeof node['3'] === 'string' ? node['3'] : null,
    probe_id: ri?.probe_id,
    topic: ri?.topic_coordinate,
    offered: typeof credits === 'number' ? credits : 0,
    node,
  };
}

/** Walk a digit-path sub-slot ("1", "23") one digit at a time; null if missing. */
function walkPath(block: any, slot: string): any {
  let cur: any = block;
  for (const ch of slot) {
    if (typeof cur !== 'object' || cur === null) return null;
    cur = cur[ch];
    if (cur === undefined) return null;
  }
  return cur;
}

// ── Auto-policy — the candidate verb (substrate-native) ──

/**
 * The candidate verb for a probe under the auto-policy, read from the
 * recipient's own substrate (their passport 6.2 history at the topic) — no
 * LLM, no policy block. A fresh neuron with no history surfaces everything
 * until trust accrues.
 *   fail                          → drop
 *   pass + sender known at topic  → keep   (executed in auto, credit 0)
 *   unbacked / warn / novel       → surface (the LLM must read and decide)
 * forward, reply and hau are never auto candidates — they surface always.
 */
function autoCandidate(
  verdict: string,
  probe: ScannedProbe,
  recipientPassport: Block | null,
): 'keep' | 'drop' | 'surface' {
  if (verdict === 'fail') return 'drop';
  if (verdict !== 'pass') return 'surface';
  if (!probe.topic || !recipientPassport) return 'surface';
  const topicNode = readAt(recipientPassport, topicNodeAddress(probe.topic));
  const known = receiptsFromSender(
    (topicNode && typeof topicNode === 'object') ? (topicNode as Block) : null,
    probe.from ?? '',
  ).length > 0;
  return known ? 'keep' : 'surface';
}

// ── Signing — the forwarder's own key, derived fresh, never stored ──

/**
 * Derive the caller's ed25519 keypair from their seed and check it against the
 * key they have published at passport 9.1. Returns the secret key, or an error
 * string: an unverifiable hop would read unbacked forever, so a signer whose
 * seed does not derive the published key is refused with the fix named.
 */
async function signingKey(
  agentId: string,
  seed: string | undefined,
): Promise<{ secretKey: Uint8Array } | { error: string }> {
  if (!seed) {
    return { error: 'signing needs enc_secret (or secret) — the seed that derives your published key (pscale_key_publish)' };
  }
  const published = await getPublicKeys(agentId);
  if (!published) {
    return { error: `${agentId} has published no keys — run pscale_key_publish first; an unsigned hop would verify unbacked forever` };
  }
  const keys = await deriveKeypair(seed, agentId);
  const pub = formatPublicKeys(keys);
  if (pub.ed25519 !== published.ed25519) {
    return { error: 'the seed given does not derive your published ed25519 key — pass the enc_secret you published with' };
  }
  return { secretKey: keys.ed25519.secretKey };
}

// ── Verb execution ──

interface ExecuteDecision {
  slot: string;
  verb: 'keep' | 'reply' | 'forward' | 'drop' | 'hau';
  credit_accept?: number;
  content?: string;
  to_channel?: string;
  to_beach?: string;
  transform?: string;
  endorse_credit?: number;
  total?: number;
  split?: 'equal' | 'sq';
  reason?: string;
}

interface VerbOutcome {
  slot: string;
  verb: string;
  ok: boolean;
  detail: string;
}

/** Load-copy an agent's passport for writing (creates the root if absent). */
async function passportForWrite(agentId: string): Promise<Block> {
  const prow = await loadBlock(agentId, 'passport');
  return (prow && typeof prow.block === 'object' && prow.block !== null)
    ? JSON.parse(JSON.stringify(prow.block))
    : { _: `passport of ${agentId}` };
}

/**
 * keep = RECEIVE (sand-v2:4). Record a per-probe receipt at the recipient's
 * passport 6.2 — credit_accept (0..offered) is the amount received; the
 * receipt IS the transfer, read into balances on demand. On a grain, also
 * write the receipt where the giver gave: a reply-anchored line on the
 * receiver's own side, so the giver's act completes at the channel they used.
 */
async function doKeep(
  beach: string,
  channelName: string,
  agentId: string,
  probe: ScannedProbe,
  verdict: string,
  creditAccept: number,
  secret: string | undefined,
): Promise<VerbOutcome> {
  if (!probe.topic) {
    return { slot: probe.slot, verb: 'keep', ok: false, detail: 'probe has no topic_coordinate — nothing to accumulate against' };
  }
  if (creditAccept > probe.offered) {
    return { slot: probe.slot, verb: 'keep', ok: false, detail: `credit_accept ${creditAccept} exceeds the ${probe.offered} offered — receive up to the offer (sand-v2:4.1)` };
  }
  const passport = await passportForWrite(agentId);

  const topicNode = readAt(passport, topicNodeAddress(probe.topic));
  const tnode = (topicNode && typeof topicNode === 'object') ? (topicNode as Block) : null;
  const { slot, existing } = findReceiptSlot(tnode, probe.from ?? '', probe.probe_id);
  // giver_total is a cumulative RECORD of what this sender has offered at this
  // topic (sand-v2:8.1 — it leaves the SQ formula). A re-receipt of the same
  // probe keeps its record; a fresh probe adds its offer.
  const giverTotal = existing
    ? existing.giver_total
    : (latestReceiptFromSender(tnode, probe.from ?? '')?.giver_total ?? 0) + probe.offered;
  const evalContent = evaluationContent({
    verdict,
    v_latest: creditAccept,
    giver_total: giverTotal,
    ts: new Date().toISOString(),
    probe_id: probe.probe_id,
    sender: probe.from ?? 'unknown',
  });

  const addr = evalSlotAddress(probe.topic, slot);
  writeAt(passport, addr, evalContent);
  try {
    await saveBlock(agentId, 'passport', passport, { spindle: addr, pscale_attention: -1, secret });
  } catch (e: any) {
    return { slot: probe.slot, verb: 'keep', ok: false, detail: `passport write rejected: ${e?.message ?? e}` };
  }

  // The receipt where the giver gave (sand-v2:4.3) — grain channels only; on a
  // pool the receipt at 6.2 is public and this fold reports it.
  let anchored = '';
  if (channelName.startsWith('grain:')) {
    try {
      const grow = await loadBlock(beach, channelName);
      const mySide = grainSideOf(grow?.block ?? null, agentId);
      if (mySide !== null) {
        const gblock: Block = (grow && typeof grow.block === 'object') ? JSON.parse(JSON.stringify(grow.block)) : { _: '' };
        const sideNode = (gblock[mySide] && typeof gblock[mySide] === 'object') ? gblock[mySide] : null;
        const sub = findNextSlot(sideNode);
        const raddr = `${mySide}.${sub}`;
        writeAt(gblock, raddr, {
          _: `receipt — received ${creditAccept} of probe ${probe.probe_id ?? '(no id)'} (${verdict})`,
          '1': agentId,
          '2': probe.slot,
          '3': new Date().toISOString(),
        });
        await saveBlock(beach, channelName, gblock, { spindle: raddr, pscale_attention: -1, secret });
        anchored = `; receipt anchored at ${channelName}:${raddr}`;
      }
    } catch { /* the passport receipt stands; the anchor is best-effort */ }
  }

  return { slot: probe.slot, verb: 'keep', ok: true, detail: `receipt ${verdict} at passport ${addr} (received ${creditAccept}, cumulative offered ${giverTotal})${anchored}` };
}

/** reply — write a bilateral response on the recipient's OWN grain side. */
async function doReply(
  beach: string,
  channelName: string,
  agentId: string,
  probe: ScannedProbe,
  content: string,
  secret: string | undefined,
): Promise<VerbOutcome> {
  if (!channelName.startsWith('grain:')) {
    return { slot: probe.slot, verb: 'reply', ok: false, detail: 'reply targets a grain side; this channel is not a grain' };
  }
  const grow = await loadBlock(beach, channelName);
  const mySide = grainSideOf(grow?.block ?? null, agentId);
  if (mySide === null) {
    return { slot: probe.slot, verb: 'reply', ok: false, detail: `${agentId} is not a party to ${channelName}` };
  }
  const gblock: Block = (grow && typeof grow.block === 'object') ? JSON.parse(JSON.stringify(grow.block)) : { _: '' };
  const sideNode = (gblock[mySide] && typeof gblock[mySide] === 'object') ? gblock[mySide] : null;
  const sub = findNextSlot(sideNode);
  const addr = `${mySide}.${sub}`;
  const entry: Block = { _: content, '1': agentId, '2': probe.slot, '3': new Date().toISOString() };
  writeAt(gblock, addr, entry);
  try {
    await saveBlock(beach, channelName, gblock, { spindle: addr, pscale_attention: -1, secret });
  } catch (e: any) {
    return { slot: probe.slot, verb: 'reply', ok: false, detail: `reply write rejected: ${e?.message ?? e}` };
  }
  return { slot: probe.slot, verb: 'reply', ok: true, detail: `replied at ${channelName}:${addr} (reply-to ${probe.slot})` };
}

/** Write a GAVE at the giver's own out-ledger (6.3) — the giver's half of the
 *  two-writes-one-act (sand-v2:3.1). */
async function writeGave(
  agentId: string,
  g: { voicing: string; probe_id: string; n: number; to: string; topic?: string; channel?: string },
  secret: string | undefined,
): Promise<string> {
  const passport = await passportForWrite(agentId);
  const slot = nextGaveSlot(passport);
  const addr = gaveSlotAddress(slot);
  writeAt(passport, addr, gaveContent({ ...g, ts: new Date().toISOString() }));
  await saveBlock(agentId, 'passport', passport, { spindle: addr, pscale_attention: -1, secret });
  return addr;
}

/** forward — extend the SIGNED chain and write the probe at a new destination. */
async function doForward(
  beach: string,
  agentId: string,
  probe: ScannedProbe,
  d: ExecuteDecision,
  secret: string | undefined,
  encSecret: string | undefined,
): Promise<VerbOutcome> {
  if (!probe.probe_id) {
    return { slot: probe.slot, verb: 'forward', ok: false, detail: 'probe has no probe_id — cannot extend the chain' };
  }
  if (!d.to_channel) {
    return { slot: probe.slot, verb: 'forward', ok: false, detail: 'forward needs to_channel' };
  }
  const key = await signingKey(agentId, encSecret ?? secret);
  if ('error' in key) {
    return { slot: probe.slot, verb: 'forward', ok: false, detail: key.error };
  }
  const toChannel = d.to_channel;
  const destBeach = d.to_beach ?? beach;
  const storedRider = JSON.parse(JSON.stringify(probe.node['9'] ?? {}));

  // Extend the chain (sand-v2:6): sig = ed25519_sign(probe_id + prev_sig).
  const chain = (storedRider['4'] && typeof storedRider['4'] === 'object') ? storedRider['4'] : { _: 'chain hops' };
  let lastSig = '';
  let lastSlot = '';
  for (const s of digitPathSlots()) {
    const hop = walkPath(chain, s);
    if (hop == null) break;
    if (typeof hop === 'object' && typeof hop['2'] === 'string') { lastSig = hop['2']; lastSlot = s; }
  }
  const nextSig = signHop(probe.probe_id, lastSig, key.secretKey);
  const nextSlot = lastSlot === '' ? '1' : findNextSlot(chain);
  writeAt(chain, nextSlot, { _: `hop ${nextSlot}`, '1': agentId, '2': nextSig });
  storedRider['4'] = chain;

  // Endorsement is the forwarder's OWN give (sand-v2:3): raise the claim AND
  // back it with a GAVE at the forwarder's out-ledger.
  let endorsed = '';
  if (typeof d.endorse_credit === 'number' && d.endorse_credit > 0) {
    const credits = (storedRider['2'] && typeof storedRider['2'] === 'object') ? storedRider['2'] : { _: 'credit claim' };
    credits['1'] = d.endorse_credit;
    credits['2'] = agentId;
    storedRider['2'] = credits;
    try {
      const gaddr = await writeGave(agentId, {
        voicing: `forwarded ${probe.probe_id} to ${toChannel}, endorsing ${d.endorse_credit}`,
        probe_id: probe.probe_id,
        n: d.endorse_credit,
        to: toChannel,
        topic: probe.topic,
        channel: `${destBeach}/${toChannel}`,
      }, secret);
      endorsed = `; endorsement backed by GAVE at ${gaddr}`;
    } catch (e: any) {
      return { slot: probe.slot, verb: 'forward', ok: false, detail: `endorsement GAVE rejected: ${e?.message ?? e} — forward not written` };
    }
  }

  const entry: Block = {
    _: d.transform ?? probe.content,
    '1': agentId,
    '3': new Date().toISOString(),
    '9': storedRider,
  };

  try {
    if (toChannel.startsWith('grain:')) {
      // Grain destination: forwarder writes on their OWN side.
      const grow = await loadBlock(destBeach, toChannel);
      const mySide = grainSideOf(grow?.block ?? null, agentId);
      if (mySide === null) {
        return { slot: probe.slot, verb: 'forward', ok: false, detail: `${agentId} is not a party to destination ${toChannel}` };
      }
      const gblock: Block = (grow && typeof grow.block === 'object') ? JSON.parse(JSON.stringify(grow.block)) : { _: '' };
      const sideNode = (gblock[mySide] && typeof gblock[mySide] === 'object') ? gblock[mySide] : null;
      const addr = `${mySide}.${findNextSlot(sideNode)}`;
      writeAt(gblock, addr, entry);
      await saveBlock(destBeach, toChannel, gblock, { spindle: addr, pscale_attention: -1, secret });
      return { slot: probe.slot, verb: 'forward', ok: true, detail: `forwarded to ${toChannel}:${addr} (signed hop ${nextSlot}: ${agentId})${endorsed}` };
    }
    // Accumulator destination (pool / marks): atomic append.
    const ack = await appendToBeach(destBeach, toChannel, entry, secret);
    return { slot: probe.slot, verb: 'forward', ok: true, detail: `forwarded to ${toChannel} slot ${ack.slot ?? '?'} (signed hop ${nextSlot}: ${agentId})${endorsed}` };
  } catch (e: any) {
    return { slot: probe.slot, verb: 'forward', ok: false, detail: `forward write rejected: ${e?.message ?? e}` };
  }
}

/**
 * hau — share the completion back along the chain (sand-v2:4.4, 4.6). One
 * fresh probe and one GAVE per hop of the completed probe's chain, credits
 * split equally (the book's social neuron) or by the hops' SQ at the topic
 * (Fair-Share). Landing: the grain with that hop when one exists, else the
 * hop's own room (pool:<hop>) — the door is the door. Each hop receives by
 * keep. Deliberate, never auto.
 */
async function doHau(
  beach: string,
  agentId: string,
  probe: ScannedProbe,
  d: ExecuteDecision,
  secret: string | undefined,
  encSecret: string | undefined,
): Promise<VerbOutcome> {
  if (!probe.probe_id) {
    return { slot: probe.slot, verb: 'hau', ok: false, detail: 'probe has no probe_id — no chain to return along' };
  }
  if (typeof d.total !== 'number' || d.total <= 0) {
    return { slot: probe.slot, verb: 'hau', ok: false, detail: 'hau needs total — the credits shared back along the chain' };
  }
  const ri = riderFromSlot(probe.node);
  const hops = (ri?.chain ?? []).map((h) => h.agent).filter((a) => a && a !== agentId);
  if (hops.length === 0) {
    return { slot: probe.slot, verb: 'hau', ok: false, detail: 'the chain names no hops beyond yourself — nobody relayed this' };
  }
  const key = await signingKey(agentId, encSecret ?? secret);
  if ('error' in key) {
    return { slot: probe.slot, verb: 'hau', ok: false, detail: key.error };
  }

  // Shares: equal by default; 'sq' weights by each hop's SQ at the topic,
  // falling back to equal when no signal exists yet.
  let shares: number[];
  if (d.split === 'sq' && probe.topic) {
    const weights: number[] = [];
    for (const hop of hops) {
      const hp = await getPassportFromAddress(hop);
      if (!hp) { weights.push(0); continue; }
      const { computed } = await recomputeSQFromOthers(hop, hp as Block, probe.topic, (h) => getPassportFromAddress(h));
      weights.push(computed);
    }
    const sum = weights.reduce((s, w) => s + w, 0);
    shares = sum > 0 ? weights.map((w) => (d.total! * w) / sum) : hops.map(() => d.total! / hops.length);
  } else {
    shares = hops.map(() => d.total! / hops.length);
  }

  const details: string[] = [];
  let landed = 0;
  for (let i = 0; i < hops.length; i++) {
    const hop = hops[i];
    const share = Math.round(shares[i] * 100) / 100;
    if (share <= 0) { details.push(`${hop}: share 0 — skipped`); continue; }
    const newProbeId = `${agentId}-hau-${probe.probe_id}-h${i + 1}`;
    const voicing = d.content ?? `hau — the completion of ${probe.probe_id} returns along its path; ${share} credits travel with the thanks`;
    const rider = {
      _: 'rider',
      '1': newProbeId,
      '2': { _: 'credit claim', '1': share, '2': agentId },
      '4': { _: 'chain hops', '1': { _: 'hop 1', '1': agentId, '2': signHop(newProbeId, '', key.secretKey) } },
      ...(probe.topic ? { '5': probe.topic } : {}),
    };
    const entry: Block = { _: voicing, '1': agentId, '3': new Date().toISOString(), '9': rider as any };

    // Landing: the grain with that hop if one exists, else the hop's parlour.
    let landedAt = '';
    try {
      const pid = pairId(agentId, hop);
      const grow = await loadBlock(beach, `grain:${pid}`);
      const mySide = grainSideOf(grow?.block ?? null, agentId);
      if (mySide !== null && grow) {
        const gblock: Block = JSON.parse(JSON.stringify(grow.block));
        const sideNode = (gblock[mySide] && typeof gblock[mySide] === 'object') ? gblock[mySide] : null;
        const addr = `${mySide}.${findNextSlot(sideNode)}`;
        writeAt(gblock, addr, entry);
        await saveBlock(beach, `grain:${pid}`, gblock, { spindle: addr, pscale_attention: -1, secret });
        landedAt = `grain:${pid}:${addr}`;
      } else {
        const ack = await appendToBeach(beach, `pool:${hop}`, entry, undefined);
        landedAt = `pool:${hop} slot ${ack.slot ?? '?'}`;
      }
      const gaddr = await writeGave(agentId, {
        voicing: `hau for ${probe.probe_id}: ${share} to ${hop}, hop ${i + 1} of its chain`,
        probe_id: newProbeId,
        n: share,
        to: hop,
        topic: probe.topic,
        channel: landedAt,
      }, secret);
      landed++;
      details.push(`${hop}: ${share} at ${landedAt} (GAVE ${gaddr})`);
    } catch (e: any) {
      details.push(`${hop}: FAILED — ${e?.message ?? e}${landedAt ? ` (probe landed at ${landedAt}, GAVE missing — re-run hau or write the GAVE by hand)` : ''}`);
    }
  }

  return {
    slot: probe.slot,
    verb: 'hau',
    ok: landed > 0,
    detail: `shared ${d.total} along ${hops.length} hop${hops.length === 1 ? '' : 's'} (${d.split === 'sq' ? 'SQ-weighted' : 'equal'}): ${details.join(' · ')}`,
  };
}

// ── Schema ──

export const networkingParamsSchema = {
  agent_id: z
    .string()
    .describe('The recipient neuron — whose passport receives keeps and whose grain side replies land. A bare handle ("egg-one"), a URL, or a grain/sed address. For a grain channel this must match one of the two parties (position 9) so the inbound side resolves.'),
  channel: z
    .string()
    .describe('The committed channel to scan: a grain ("grain:<pair_id>"), a pool ("pool:<name>"), or an accumulator like "marks". Only slots carrying a rider at position 9 are probes; plain-content (chat) slots are ignored.'),
  beach: z
    .string()
    .optional()
    .describe(`Beach URL hosting the channel. Default ${DEFAULT_BEACH}. Must be an http(s):// URL.`),
  since_marker: z
    .number()
    .int()
    .optional()
    .describe('Cursor — process only probes whose slot ordinal is strictly greater than this. Default 0 (all). Caller-managed: store the returned marker_new and pass it back.'),
  permission: z
    .enum(['auto', 'ask'])
    .optional()
    .describe("'ask' (default): perceive only — return each probe with its verdict and the candidate verb for the calling LLM to decide. 'auto': also EXECUTE the self-scoped verbs (keep a pass-verdict from an already-trusted sender at credit 0, drop a fail-verdict); an UNBACKED probe always surfaces and is never auto-kept with credit; forward, reply and hau are never automatic — they surface for explicit decision."),
  execute: z
    .array(z.object({
      slot: z.string().describe('The probe slot address as returned by a perceive scan (e.g. "2.1").'),
      verb: z.enum(['keep', 'reply', 'forward', 'drop', 'hau']),
      credit_accept: z.number().optional().describe('keep: credit to RECEIVE from this probe (0..offered). The receipt at your passport 6.2 IS the transfer — balance moves on read. Default 0 — acknowledge without receiving.'),
      content: z.string().optional().describe('reply: the response text (written to your own grain side). hau: optional voicing carried with each returned share.'),
      to_channel: z.string().optional().describe('forward: destination block name (a pool, "marks", or a grain you are party to).'),
      to_beach: z.string().optional().describe('forward: destination beach URL. Default the scan beach.'),
      transform: z.string().optional().describe('forward: replacement content underscore. Omit to relay the probe verbatim.'),
      endorse_credit: z.number().optional().describe('forward: raise the credit claim to this, endorsing the probe onward. An endorsement is YOUR OWN give — it writes a GAVE at your out-ledger (6.3) backing the raised claim.'),
      total: z.number().optional().describe('hau: the credits shared back along the completed probe\'s chain — the completion-return (sand-v2:4.4). Split across the hops; each hop receives by keep. A gift, not a rule.'),
      split: z.enum(['equal', 'sq']).optional().describe("hau: how the total splits across the hops — 'equal' (default, the book's social neuron) or 'sq' (Fair-Share: weighted by each hop's SQ at the probe's topic; falls back to equal when no signal exists)."),
      reason: z.string().optional().describe('drop: optional reason (not written to the public substrate).'),
    }))
    .optional()
    .describe('Explicit verb decisions to execute (the ask-mode second step). Each references a probe by its slot. Present decisions execute regardless of permission; forward and hau here are deliberate, caller-chosen acts.'),
  secret: z
    .string()
    .optional()
    .describe('Write authority — required for keep (own passport), reply/forward/hau (locked channels, your out-ledger). Forwarded to the beach. Sensitive; never repeat in conversation.'),
  enc_secret: z
    .string()
    .optional()
    .describe('Signing seed for forward/hau — the seed that derives your PUBLISHED ed25519 key (pscale_key_publish). Falls back to secret. Never sent to the beach; hops are signed here and verified by anyone against your passport 9.1.'),
};

export type NetworkingParams = {
  agent_id: string;
  channel: string;
  beach?: string;
  since_marker?: number;
  permission?: 'auto' | 'ask';
  execute?: ExecuteDecision[];
  secret?: string;
  enc_secret?: string;
};

// ── Handler ──

export async function handleNetworking(
  params: NetworkingParams,
): Promise<{ content: { type: 'text'; text: string }[] }> {
  const beach = params.beach ?? DEFAULT_BEACH;
  const { agent_id, channel } = params;
  const sinceMarker = params.since_marker ?? 0;
  const permission = params.permission ?? 'ask';
  const secret = params.secret;
  const encSecret = params.enc_secret;

  if (!isFederatedOwner(beach)) {
    return { content: [{ type: 'text', text: `beach must be an http(s):// URL (got "${beach}").` }] };
  }

  const crow = await loadBlock(beach, channel);
  if (!crow || typeof crow.block !== 'object' || crow.block === null) {
    return { content: [{ type: 'text', text: `No channel at (${beach}, ${channel}).` }] };
  }

  const { probes, note } = scanChannel(crow.block, channel, agent_id, sinceMarker);

  // Verify every probe (sand-v2 arithmetic — chain / provenance / balance / SQ).
  const verified = await Promise.all(probes.map(async (p) => {
    const ri = riderFromSlot(p.node);
    const result = await verifyRiderCore({
      rider: ri ?? undefined,
      probe_id: p.probe_id,
      chain: ri?.chain,
      sender_agent_id: p.from ?? agent_id,
      topic_coordinate: p.topic,
    });
    return { probe: p, verdict: result.verdict, verify: result };
  }));

  const recipientRow = await loadBlock(agent_id, 'passport');
  const recipientPassport = (recipientRow && typeof recipientRow.block === 'object') ? recipientRow.block : null;

  // ── Act: run explicit decisions, plus auto-safe verbs when permission=auto ──
  const outcomes: VerbOutcome[] = [];
  const decided = new Set<string>();

  const byId = new Map(verified.map((v) => [v.probe.slot, v]));

  for (const dec of params.execute ?? []) {
    const v = byId.get(dec.slot);
    if (!v) { outcomes.push({ slot: dec.slot, verb: dec.verb, ok: false, detail: 'no such probe in this scan' }); continue; }
    decided.add(dec.slot);
    outcomes.push(await runVerb(beach, channel, agent_id, v.probe, v.verdict, dec, secret, encSecret));
  }

  const surfaced: typeof verified = [];
  if (permission === 'auto') {
    for (const v of verified) {
      if (decided.has(v.probe.slot)) continue;
      const cand = autoCandidate(v.verdict, v.probe, recipientPassport);
      if (cand === 'drop') {
        outcomes.push({ slot: v.probe.slot, verb: 'drop', ok: true, detail: `auto-dropped (verdict ${v.verdict})` });
      } else if (cand === 'keep') {
        outcomes.push(await doKeep(beach, channel, agent_id, v.probe, v.verdict, 0, secret));
      } else {
        surfaced.push(v);
      }
    }
  } else {
    for (const v of verified) if (!decided.has(v.probe.slot)) surfaced.push(v);
  }

  // ── Fold + envelope ──
  const fold = {
    verified: verified.length,
    kept: outcomes.filter((o) => o.verb === 'keep' && o.ok).length,
    replied: outcomes.filter((o) => o.verb === 'reply' && o.ok).length,
    forwarded: outcomes.filter((o) => o.verb === 'forward' && o.ok).length,
    dropped: outcomes.filter((o) => o.verb === 'drop' && o.ok).length,
    haued: outcomes.filter((o) => o.verb === 'hau' && o.ok).length,
  };
  const maxOrdinal = probes.reduce((m, p) => Math.max(m, p.ordinal), sinceMarker);

  const lines: string[] = [];
  lines.push(`pscale_networking — ${channel} @ ${beach}  (neuron: ${agent_id}, mode: ${permission})`);
  if (note) { lines.push(''); lines.push(`note: ${note}`); }
  lines.push('');
  lines.push(`# Fold`);
  lines.push(`verified ${fold.verified} · kept ${fold.kept} · replied ${fold.replied} · forwarded ${fold.forwarded} · dropped ${fold.dropped} · hau ${fold.haued}`);
  lines.push('');

  if (outcomes.length > 0) {
    lines.push(`# Acted`);
    for (const o of outcomes) lines.push(`- [${o.ok ? 'ok' : 'FAIL'}] ${o.verb} @ ${o.slot}: ${o.detail}`);
    lines.push('');
  }

  if (surfaced.length > 0) {
    lines.push(`# Surfaced — decide a verb (keep / reply / forward / drop / hau), then call again with \`execute\``);
    for (const v of surfaced) {
      const p = v.probe;
      const cand = autoCandidate(v.verdict, p, recipientPassport);
      lines.push(`## ${p.slot} — from ${p.from ?? '(unknown)'} — verdict ${v.verdict}${cand === 'surface' ? '' : ` (auto-candidate: ${cand})`}`);
      lines.push(`  topic ${p.topic ?? '(none)'} · probe ${p.probe_id ?? '(none)'}${p.offered ? ` · offers ${p.offered} credit` : ''}`);
      lines.push(`  ${p.content.length > 400 ? p.content.slice(0, 400) + '…' : p.content}`);
      const vr = v.verify;
      const dims: string[] = [];
      const dim = (r: any, name: string, okWord = 'ok') => {
        if (!r || !r.checked) return;
        if (r.unbacked) dims.push(`${name} UNBACKED${r.reason ? ` (${r.reason})` : ''}`);
        else if (r.valid === false || r.matches === false) dims.push(`${name} ${name === 'sq' ? 'diverges' : 'CONTRADICTED'}`);
        else dims.push(`${name} ${okWord}`);
      };
      dim(vr.chain, 'chain');
      dim(vr.provenance, 'provenance');
      dim(vr.balance, 'balance');
      dim(vr.sq, 'sq');
      if (dims.length) lines.push(`  verify: ${dims.join(' · ')}`);
      lines.push('');
    }
  } else if (probes.length === 0) {
    lines.push('(no new probes — nothing rider-bearing since the marker)');
    lines.push('');
  }

  lines.push(`# Marker`);
  lines.push(`previous: ${sinceMarker}`);
  lines.push(`new:      ${maxOrdinal}`);
  lines.push(`(store marker_new and pass it back as since_marker on the next call)`);

  return { content: [{ type: 'text', text: lines.join('\n') }] };
}

/** Dispatch one verb decision. */
async function runVerb(
  beach: string,
  channel: string,
  agentId: string,
  probe: ScannedProbe,
  verdict: string,
  dec: ExecuteDecision,
  secret: string | undefined,
  encSecret: string | undefined,
): Promise<VerbOutcome> {
  switch (dec.verb) {
    case 'keep':
      return doKeep(beach, channel, agentId, probe, verdict, typeof dec.credit_accept === 'number' ? dec.credit_accept : 0, secret);
    case 'reply':
      return doReply(beach, channel, agentId, probe, dec.content ?? '', secret);
    case 'forward':
      if (!dec.to_channel) return { slot: probe.slot, verb: 'forward', ok: false, detail: 'forward needs to_channel' };
      return doForward(beach, agentId, probe, dec, secret, encSecret);
    case 'hau':
      return doHau(beach, agentId, probe, dec, secret, encSecret);
    case 'drop':
      return { slot: probe.slot, verb: 'drop', ok: true, detail: `dropped${dec.reason ? ` (${dec.reason})` : ''} — no public write` };
    default:
      return { slot: probe.slot, verb: String((dec as any).verb), ok: false, detail: 'unknown verb' };
  }
}
