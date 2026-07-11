/**
 * tools/networking.ts — pscale_networking primitive (the social neuron).
 *
 * SAND (Level 3) is specified but inert: the envelope (sand-rider), the verbs
 * (l3-relay: keep/reply/forward/drop), and the arithmetic (pscale_verify_rider)
 * all exist, but nothing DRIVES the loop — a receiving LLM verifies a probe,
 * says "got it", and never shares forward. This primitive is the driver. The
 * neuron is the CALLING LLM at the edge; this tool is its afferent + efferent
 * surface (no LLM runs inside bsp-mcp).
 *
 * The loop (l3-relay:6.1): walk a committed channel for new probes since a
 * marker → verify each (pscale_verify_rider arithmetic) → choose a verb →
 * execute the substrate write → report the fold.
 *
 * THE RIDER IS THE OPT-IN. A slot with no rider at position 9 is plain content
 * (chat, sand-rider:8.5) and is invisible to the loop. Only rider-bearing slots
 * are probes. So a grain used degenerately for chat is never swept into SAND.
 *
 * TWO MODES, like pool_engage's read-vs-act:
 *   perceive (no `execute`)   — scan + verify + return the decision surface
 *                               (each probe, its verdict, the candidate verb).
 *                               Pure read; always safe. The ask-mode first step.
 *   act (`execute` passed, OR permission='auto') — run verb decisions and
 *                               return the fold {verified, kept, replied,
 *                               forwarded, dropped}.
 *
 * AUTONOMY (v1): forward and reply are ALWAYS surfaced (ask) — auto never writes
 * into other agents' channels unattended. `permission='auto'` executes only the
 * self-scoped verbs: keep (own passport) on a pass-verdict from a sender already
 * trusted at the topic, drop on a fail-verdict. Everything else surfaces. Trust
 * must be EARNED (read-and-judged) before it is DELEGATED (blind auto-forward —
 * "transitive trust", proposals/2026-07-11-transitive-trust.md, held for v2).
 *
 * v1 channel support: grain (side-aware — inbound probes on the partner's side)
 * and pool/marks (flat digit-path). sed: sub-position scanning is v2.
 */

import { z } from 'zod';
import { createHash } from 'node:crypto';
import { Block, readAt, writeAt } from '../bsp.js';
import {
  loadBlock,
  saveBlock,
  appendToBeach,
  isFederatedOwner,
  DEFAULT_BEACH,
} from '../db.js';
import { verifyRiderCore } from './verify.js';
import {
  isRider,
  riderFromSlot,
  topicNodeAddress,
  evalSlotAddress,
  findSenderSlot,
  evaluationContent,
} from '../sand.js';
import { digitPathSlots, findNextSlot } from './pool.js';

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

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
  node: any;           // the raw slot object (for chain extension on forward)
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
 * Grain: inbound probes sit on the PARTNER's side (the side the recipient is
 * NOT). Pool/marks: probes are the top-level digit-path slots. Returns the
 * probes plus a note when the channel shape isn't yet supported (sed:).
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
    return { probes, note: 'sed: sub-position scanning is v2 — point pscale_networking at a grain or pool for now.' };
  }

  // pool / marks / flat accumulator — probes are the top-level digit slots.
  collectFrom(channelBlock, '');
  return { probes };
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

// ── Auto-policy — the candidate verb (i, substrate-native) ──

/**
 * The candidate verb for a probe under the v1 auto-policy, read from the
 * recipient's own substrate (their passport 6.2 history at the topic) — no LLM,
 * no new policy block (David's choice (i), richer). A fresh neuron with no
 * history surfaces everything until trust accrues.
 *   fail                         → drop
 *   pass + sender known at topic  → keep   (executed in auto)
 *   pass + novel sender / warn    → surface (the LLM must read and decide)
 * forward and reply are never auto candidates — they surface always.
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
  const { existing } = findSenderSlot(
    (topicNode && typeof topicNode === 'object') ? topicNode : null,
    probe.from ?? '',
  );
  return existing ? 'keep' : 'surface';
}

// ── Verb execution ──

interface ExecuteDecision {
  slot: string;
  verb: 'keep' | 'reply' | 'forward' | 'drop';
  credit_accept?: number;
  content?: string;
  to_channel?: string;
  to_beach?: string;
  transform?: string;
  endorse_credit?: number;
  reason?: string;
}

interface VerbOutcome {
  slot: string;
  verb: string;
  ok: boolean;
  detail: string;
}

/** keep — record the verdict as an evaluation at the recipient's passport 6.2. */
async function doKeep(
  beach: string,
  agentId: string,
  probe: ScannedProbe,
  verdict: string,
  creditAccept: number,
  secret: string | undefined,
): Promise<VerbOutcome> {
  if (!probe.topic) {
    return { slot: probe.slot, verb: 'keep', ok: false, detail: 'probe has no topic_coordinate — nothing to accumulate against' };
  }
  const prow = await loadBlock(agentId, 'passport');
  const passport: Block = (prow && typeof prow.block === 'object' && prow.block !== null)
    ? JSON.parse(JSON.stringify(prow.block))
    : { _: `passport of ${agentId}` };

  const topicNode = readAt(passport, topicNodeAddress(probe.topic));
  const { slot, existing } = findSenderSlot(
    (topicNode && typeof topicNode === 'object') ? topicNode : null,
    probe.from ?? '',
  );
  const priorGiven = existing?.giver_total ?? 0;
  const evalContent = evaluationContent({
    verdict,
    v_latest: creditAccept,
    giver_total: priorGiven + probe.offered,
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
  return { slot: probe.slot, verb: 'keep', ok: true, detail: `evaluation ${verdict} at passport ${addr} (accepted ${creditAccept}, cumulative offered ${priorGiven + probe.offered})` };
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

/** forward — extend the chain and write the probe at a new destination. */
async function doForward(
  beach: string,
  agentId: string,
  probe: ScannedProbe,
  d: ExecuteDecision,
  secret: string | undefined,
): Promise<VerbOutcome> {
  if (!probe.probe_id) {
    return { slot: probe.slot, verb: 'forward', ok: false, detail: 'probe has no probe_id — cannot extend the chain' };
  }
  if (!d.to_channel) {
    return { slot: probe.slot, verb: 'forward', ok: false, detail: 'forward needs to_channel' };
  }
  const toChannel = d.to_channel;
  const destBeach = d.to_beach ?? beach;
  const storedRider = JSON.parse(JSON.stringify(probe.node['9'] ?? {}));

  // Extend the sha256 chain (sand-rider:4.2): sig = sha256(probe_id + prev_sig).
  const chain = (storedRider['4'] && typeof storedRider['4'] === 'object') ? storedRider['4'] : { _: 'chain hops' };
  let lastSig = '';
  let lastSlot = '';
  for (const s of digitPathSlots()) {
    const hop = walkPath(chain, s);
    if (hop == null) break;
    if (typeof hop === 'object' && typeof hop['2'] === 'string') { lastSig = hop['2']; lastSlot = s; }
  }
  const nextSig = sha256Hex(probe.probe_id + lastSig);
  const nextSlot = lastSlot === '' ? '1' : findNextSlot(chain);
  writeAt(chain, nextSlot, { _: `hop ${nextSlot}`, '1': agentId, '2': nextSig });
  storedRider['4'] = chain;

  // Optional endorsement: raise the forwarder's credit claim.
  if (typeof d.endorse_credit === 'number') {
    const credits = (storedRider['2'] && typeof storedRider['2'] === 'object') ? storedRider['2'] : { _: 'credit claim' };
    credits['1'] = d.endorse_credit;
    credits['2'] = agentId;
    storedRider['2'] = credits;
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
      return { slot: probe.slot, verb: 'forward', ok: true, detail: `forwarded to ${toChannel}:${addr} (chain → hop ${nextSlot}: ${agentId})` };
    }
    // Accumulator destination (pool / marks): atomic append.
    const ack = await appendToBeach(destBeach, toChannel, entry, secret);
    return { slot: probe.slot, verb: 'forward', ok: true, detail: `forwarded to ${toChannel} slot ${ack.slot ?? '?'} (chain → hop ${nextSlot}: ${agentId})` };
  } catch (e: any) {
    return { slot: probe.slot, verb: 'forward', ok: false, detail: `forward write rejected: ${e?.message ?? e}` };
  }
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
    .describe("'ask' (default): perceive only — return each probe with its verdict and the candidate verb for the calling LLM to decide. 'auto': also EXECUTE the self-scoped verbs (keep a pass-verdict from an already-trusted sender, drop a fail-verdict); forward and reply are never automatic in v1 — they surface for explicit decision."),
  execute: z
    .array(z.object({
      slot: z.string().describe('The probe slot address as returned by a perceive scan (e.g. "2.1").'),
      verb: z.enum(['keep', 'reply', 'forward', 'drop']),
      credit_accept: z.number().optional().describe('keep: credit to accept from this probe (≤ offered). Default 0 — acknowledge without crediting.'),
      content: z.string().optional().describe('reply: the response text (written to your own grain side).'),
      to_channel: z.string().optional().describe('forward: destination block name (a pool, "marks", or a grain you are party to).'),
      to_beach: z.string().optional().describe('forward: destination beach URL. Default the scan beach.'),
      transform: z.string().optional().describe('forward: replacement content underscore. Omit to relay the probe verbatim.'),
      endorse_credit: z.number().optional().describe('forward: raise the credit claim to this, endorsing the probe onward. Omit to pass through without endorsing.'),
      reason: z.string().optional().describe('drop: optional reason (not written to the public substrate).'),
    }))
    .optional()
    .describe('Explicit verb decisions to execute (the ask-mode second step). Each references a probe by its slot. Present decisions execute regardless of permission; forward here is a deliberate, caller-chosen act.'),
  secret: z
    .string()
    .optional()
    .describe('Write authority — required for keep (own passport), reply/forward (locked channels). Forwarded to the beach. Sensitive; never repeat in conversation.'),
};

export type NetworkingParams = {
  agent_id: string;
  channel: string;
  beach?: string;
  since_marker?: number;
  permission?: 'auto' | 'ask';
  execute?: ExecuteDecision[];
  secret?: string;
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

  if (!isFederatedOwner(beach)) {
    return { content: [{ type: 'text', text: `beach must be an http(s):// URL (got "${beach}").` }] };
  }

  const crow = await loadBlock(beach, channel);
  if (!crow || typeof crow.block !== 'object' || crow.block === null) {
    return { content: [{ type: 'text', text: `No channel at (${beach}, ${channel}).` }] };
  }

  const { probes, note } = scanChannel(crow.block, channel, agent_id, sinceMarker);

  // Verify every probe (arithmetic — chain / credit / SQ).
  const verified = await Promise.all(probes.map(async (p) => {
    const ri = riderFromSlot(p.node);
    const result = await verifyRiderCore({
      rider: ri ? { credits: ri.credits, sq: ri.sq } : undefined,
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
    outcomes.push(await runVerb(beach, channel, agent_id, v.probe, v.verdict, dec, secret));
  }

  const surfaced: typeof verified = [];
  if (permission === 'auto') {
    for (const v of verified) {
      if (decided.has(v.probe.slot)) continue;
      const cand = autoCandidate(v.verdict, v.probe, recipientPassport);
      if (cand === 'drop') {
        outcomes.push({ slot: v.probe.slot, verb: 'drop', ok: true, detail: `auto-dropped (verdict ${v.verdict})` });
      } else if (cand === 'keep') {
        outcomes.push(await doKeep(beach, agent_id, v.probe, v.verdict, 0, secret));
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
  };
  const maxOrdinal = probes.reduce((m, p) => Math.max(m, p.ordinal), sinceMarker);

  const lines: string[] = [];
  lines.push(`pscale_networking — ${channel} @ ${beach}  (neuron: ${agent_id}, mode: ${permission})`);
  if (note) { lines.push(''); lines.push(`note: ${note}`); }
  lines.push('');
  lines.push(`# Fold`);
  lines.push(`verified ${fold.verified} · kept ${fold.kept} · replied ${fold.replied} · forwarded ${fold.forwarded} · dropped ${fold.dropped}`);
  lines.push('');

  if (outcomes.length > 0) {
    lines.push(`# Acted`);
    for (const o of outcomes) lines.push(`- [${o.ok ? 'ok' : 'FAIL'}] ${o.verb} @ ${o.slot}: ${o.detail}`);
    lines.push('');
  }

  if (surfaced.length > 0) {
    lines.push(`# Surfaced — decide a verb (keep / reply / forward / drop), then call again with \`execute\``);
    for (const v of surfaced) {
      const p = v.probe;
      const cand = autoCandidate(v.verdict, p, recipientPassport);
      lines.push(`## ${p.slot} — from ${p.from ?? '(unknown)'} — verdict ${v.verdict}${cand === 'surface' ? '' : ` (auto-candidate: ${cand})`}`);
      lines.push(`  topic ${p.topic ?? '(none)'} · probe ${p.probe_id ?? '(none)'}${p.offered ? ` · offers ${p.offered} credit` : ''}`);
      lines.push(`  ${p.content.length > 400 ? p.content.slice(0, 400) + '…' : p.content}`);
      const vr = v.verify;
      const dims: string[] = [];
      if ((vr.chain as any).checked) dims.push(`chain ${(vr.chain as any).valid ? 'ok' : 'BROKEN'}`);
      if ((vr.credits as any).checked) dims.push(`credit ${(vr.credits as any).valid ? 'ok' : 'OVERDRAW'}`);
      if ((vr.sq as any).checked) dims.push(`sq ${(vr.sq as any).matches ? 'ok' : 'diverges'}`);
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
): Promise<VerbOutcome> {
  switch (dec.verb) {
    case 'keep':
      return doKeep(beach, agentId, probe, verdict, typeof dec.credit_accept === 'number' ? dec.credit_accept : 0, secret);
    case 'reply':
      return doReply(beach, channel, agentId, probe, dec.content ?? '', secret);
    case 'forward':
      if (!dec.to_channel) return { slot: probe.slot, verb: 'forward', ok: false, detail: 'forward needs to_channel' };
      return doForward(beach, agentId, probe, dec, secret);
    case 'drop':
      return { slot: probe.slot, verb: 'drop', ok: true, detail: `dropped${dec.reason ? ` (${dec.reason})` : ''} — no public write` };
    default:
      return { slot: probe.slot, verb: String((dec as any).verb), ok: false, detail: 'unknown verb' };
  }
}
