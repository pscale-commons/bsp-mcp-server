/**
 * tools/verify.ts — pscale_verify_rider primitive.
 *
 * Deterministic arithmetic check on Level 2 ecosquared riders. Three dimensions:
 *   chain integrity (sha256 of probe_id + prev_sig per hop)
 *   credit conservation (rider.credits.n <= passport.6.1 balance)
 *   SQ recompute (Σ v_latest/giver_total over evaluations_received at topic)
 *
 * Pure math. Non-enforcing. Agents decide what to do with the verdict.
 */

import { z } from 'zod';
import { createHash } from 'node:crypto';
import { getPassportFromAddress } from '../db.js';
import { recomputeSQ } from '../sand.js';

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function walkTo(block: Record<string, any>, address: string): any {
  const digits = address.replace(/\./g, '');
  let node: any = block;
  for (const d of digits) {
    if (!node || typeof node !== 'object') return undefined;
    node = node[d];
  }
  return node;
}

function extractScalar(node: any): string | number | undefined {
  if (node === undefined || node === null) return undefined;
  if (typeof node === 'string' || typeof node === 'number') return node;
  if (typeof node === 'object' && node._ !== undefined) return extractScalar(node._);
  return undefined;
}

function parseNumberNode(node: any): number | undefined {
  const v = extractScalar(node);
  if (v === undefined) return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

interface ChainHop {
  agent: string;
  sig: string;
}

export const verifyRiderParamsSchema = {
  rider: z.string().optional().describe('The ecosquared rider JSON object as a string. If absent / unparseable, verdict is "skip".'),
  probe_id: z.string().optional().describe('Probe identifier. Required for chain verification.'),
  chain: z.string().optional().describe('JSON array of chain hops [{agent, sig}, ...]. Required for chain verification.'),
  sender_agent_id: z.string().describe('Whose passport to load for credit and SQ checks. Sed: and grain: addresses also valid.'),
  topic_coordinate: z.string().optional().describe('Pscale coordinate of the topic for SQ recompute (e.g. "0.341"). Skipped if absent.'),
};

function verifyChain(probe_id: string | undefined, chain: ChainHop[] | undefined) {
  if (!chain || chain.length === 0 || !probe_id) return { checked: false };
  for (let i = 0; i < chain.length; i++) {
    const prevSig = i === 0 ? '' : chain[i - 1].sig;
    const expected = sha256Hex(probe_id + prevSig);
    if (chain[i].sig !== expected) {
      return {
        checked: true,
        valid: false,
        break_at_hop: i,
        reason: `sig mismatch at hop ${i} (${chain[i].agent})`,
      };
    }
  }
  return { checked: true, valid: true };
}

async function verifyCredits(rider: any, sender_agent_id: string) {
  const claimed = rider?.credits?.n;
  if (typeof claimed !== 'number') return { checked: false };
  const passport = await getPassportFromAddress(sender_agent_id);
  if (!passport) return { checked: false, reason: `passport not found for ${sender_agent_id}` };
  const balanceNode = walkTo(passport, '6.1');
  const balance = parseNumberNode(balanceNode);
  if (balance === undefined) {
    return { checked: false, reason: 'credits balance not found at passport address 6.1' };
  }
  const valid = claimed <= balance;
  return {
    checked: true,
    valid,
    claimed,
    balance,
    ...(valid ? {} : { reason: `overdraw: ${claimed} > ${balance}` }),
  };
}

async function verifySQ(rider: any, sender_agent_id: string, topic_coordinate: string | undefined) {
  const claimed = rider?.sq;
  if (!topic_coordinate || typeof claimed !== 'number') return { checked: false };
  const passport = await getPassportFromAddress(sender_agent_id);
  if (!passport) return { checked: false, reason: `passport not found for ${sender_agent_id}` };
  // Canonical spine-legal accumulator: passport 6.2 → <topic> → <sender> digit
  // slots (sand.ts), NOT the legacy `evaluations_received` field bag the beach's
  // shape gate would reject on write.
  const { computed, count } = recomputeSQ(passport, topic_coordinate);
  if (count === 0) {
    return {
      checked: true,
      matches: false,
      claimed,
      computed: 0,
      reason: 'no evaluations at topic',
    };
  }
  const tolerance = 0.01;
  const matches = Math.abs(claimed - computed) < tolerance;
  return {
    checked: true,
    matches,
    claimed,
    computed,
    ...(matches ? {} : { reason: `SQ divergence: claimed ${claimed}, computed ${computed}` }),
  };
}

export interface VerifyResult {
  chain: any;
  credits: any;
  sq: any;
  verdict: 'pass' | 'warn' | 'fail' | 'skip';
  reason?: string;
}

/**
 * The deterministic verify, on already-parsed inputs. Shared by the
 * pscale_verify_rider tool (which parses JSON-string params first) and the
 * pscale_networking primitive (which extracts the rider from a slot's position
 * 9 via sand.riderFromSlot). Three independent dimensions; the composite
 * verdict downgrades on the worst (any fail → fail; SQ divergence alone → warn).
 */
export async function verifyRiderCore(input: {
  rider?: any;
  probe_id?: string;
  chain?: ChainHop[];
  sender_agent_id: string;
  topic_coordinate?: string;
}): Promise<VerifyResult> {
  if (!input.rider || typeof input.rider !== 'object') {
    return {
      chain: { checked: false },
      credits: { checked: false },
      sq: { checked: false },
      verdict: 'skip',
      reason: 'no rider',
    };
  }
  const chainResult = verifyChain(input.probe_id, input.chain);
  const creditsResult = await verifyCredits(input.rider, input.sender_agent_id);
  const sqResult = await verifySQ(input.rider, input.sender_agent_id, input.topic_coordinate);

  let verdict: 'pass' | 'warn' | 'fail';
  if ((chainResult as any).checked && !(chainResult as any).valid) verdict = 'fail';
  else if ((creditsResult as any).checked && !(creditsResult as any).valid) verdict = 'fail';
  else if ((sqResult as any).checked && !(sqResult as any).matches) verdict = 'warn';
  else verdict = 'pass';

  return { chain: chainResult, credits: creditsResult, sq: sqResult, verdict };
}

export async function handleVerifyRider(params: {
  rider?: string;
  probe_id?: string;
  chain?: string;
  sender_agent_id: string;
  topic_coordinate?: string;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  let riderObj: any | undefined;
  if (params.rider) {
    try { riderObj = JSON.parse(params.rider); } catch { riderObj = undefined; }
  }
  let chainArr: ChainHop[] | undefined;
  if (params.chain) {
    try {
      const parsed = JSON.parse(params.chain);
      if (Array.isArray(parsed)) chainArr = parsed;
    } catch { chainArr = undefined; }
  }

  const result = await verifyRiderCore({
    rider: riderObj,
    probe_id: params.probe_id,
    chain: chainArr,
    sender_agent_id: params.sender_agent_id,
    topic_coordinate: params.topic_coordinate,
  });

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
}
