/**
 * tools/verify.ts — pscale_verify_rider primitive, v2.
 *
 * Deterministic arithmetic check on a SAND rider, per the sand-v2 block at the
 * beach (David's rulings at its branch 1; audit at stash:keel:27). Four
 * dimensions, each checked independently (sand-v2:5.1):
 *
 *   CHAIN       — ed25519-signed hops over (probe_id + prev_sig), verified
 *                 against each agent's published key at passport 9.1. A forged
 *                 or broken hop is FAIL; a hop by a keyless agent is UNBACKED
 *                 (sand-v2:6).
 *   PROVENANCE  — the sender's out-ledger (passport 6.3) holds a GAVE with this
 *                 probe_id covering the claimed amount (sand-v2:3.3). A missing
 *                 ledger or GAVE is UNBACKED; a GAVE at a lesser amount is a
 *                 contradiction — FAIL.
 *   BALANCE     — the sender's computed balance (minted + received − given,
 *                 sand-v2:3.4) covers the claim at verification time. Short or
 *                 unreadable is UNBACKED — under open offers an honest giver
 *                 may hold more standing invites than balance; a late keep that
 *                 finds it spent is a lapse, not a fraud.
 *   SQ          — the claim against the local recompute FROM OTHERS: the
 *                 out-ledger names the recipients, their receipts carry the
 *                 evaluations (sand-v2:7). Divergence beyond 0.01 is WARN.
 *
 * Verdicts (sand-v2:5.2): pass — every claim made was checked and holds.
 * warn — chain, provenance and balance hold; SQ diverges. UNBACKED — a claim
 * the record cannot support NOW. fail — the record CONTRADICTS the claim.
 * skip — no rider, or a rider claiming nothing. pass is never issued for a
 * dimension that was not checked: the v1 rule that a skipped dimension rounds
 * up to pass (stash:keel:27 probe 2 — a non-existent sender claiming 999,999
 * credits verified as pass) is withdrawn.
 *
 * ONE TRUTH (sand-v2:5.3): this core and the pscale_networking driver read the
 * same canonical digit-keyed shapes and return identical verdicts on identical
 * inputs. The tool accepts a rider in EITHER form — the word-keyed shape or
 * the stored digit-keyed shape — because the v1 tool's word-keys-only input
 * silently skipped every dimension of a stored rider passed as-is (the
 * two-verifiers divergence, stash:keel:27.3).
 *
 * Pure arithmetic over injectable reads. Non-enforcing — agents decide what to
 * do with the verdict; a recipient may keep an unbacked probe at credit 0.
 */

import { z } from 'zod';
import { Block } from '../bsp.js';
import { getPassportFromAddress, getPublicKeys } from '../db.js';
import {
  RiderInput,
  translateStoredRider,
  findGave,
  computeBalance,
  recomputeSQFromOthers,
  verifyChainSigned,
  ChainHop,
  PassportLoader,
  KeyLoader,
} from '../sand.js';

export const verifyRiderParamsSchema = {
  rider: z.string().optional().describe('The rider as a JSON string — EITHER the word-keyed shape ({probe_id, credits:{n,by}, sq, chain:[{agent,sig}...], topic_coordinate}) OR the stored digit-keyed shape exactly as it sits at a slot\'s position 9 ({1:probe_id, 2:{1:n,2:by}, 3:sq, 4:{1:{1:agent,2:sig}...}, 5:topic}). If absent / unparseable, verdict is "skip".'),
  probe_id: z.string().optional().describe('Probe identifier. Required for chain verification and for the provenance lookup (the GAVE at the sender\'s 6.3 is keyed by it). Falls back to the rider\'s own field.'),
  chain: z.string().optional().describe('Chain hops as a JSON string — a word-keyed array [{agent, sig}, ...] or the stored digit-keyed chain node. Falls back to the rider\'s own field. Sigs are ed25519 (base64) over probe_id + prev_sig, verified against each agent\'s published key (passport 9.1).'),
  sender_agent_id: z.string().describe('Whose out-ledger and balance to check — the giver the rider claims credit by. Sed: and grain: addresses also valid. Passports are read at the default beach.'),
  topic_coordinate: z.string().optional().describe('Pscale coordinate of the topic for SQ recompute (e.g. "0.341"). Falls back to the rider\'s own field. Skipped if absent.'),
};

// ── Injectable reads — the battery runs in-memory, the live path reads beaches ──

export interface VerifyDeps {
  loadPassport: PassportLoader;
  loadKey: KeyLoader;
  /** Σ credits= over the sender's verified ticket-grains (sand-v2:2.2). Grain
   *  discovery is a convention still settling (mint-as-gave would ride
   *  `received` instead — sand-v2:2.1 note pending); the live default is 0,
   *  which UNDER-counts a minted balance and never over-counts. */
  loadMinted?: (handle: string) => Promise<number>;
}

export function liveDeps(): VerifyDeps {
  return {
    loadPassport: (h) => getPassportFromAddress(h),
    loadKey: async (h) => (await getPublicKeys(h))?.ed25519 ?? null,
  };
}

// ── The core ──

export interface VerifyResult {
  chain: any;
  provenance: any;
  balance: any;
  sq: any;
  /** v1 field kept for readers of the old envelope: mirrors `balance`. */
  credits: any;
  verdict: 'pass' | 'warn' | 'unbacked' | 'fail' | 'skip';
  reason?: string;
}

/** Normalise a rider given in either form to the word-keyed working shape. */
export function normaliseRider(r: any): RiderInput | null {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  if ('credits' in r || 'sq' in r || 'probe_id' in r || 'chain' in r || 'topic_coordinate' in r) {
    return r as RiderInput;
  }
  return translateStoredRider(r);
}

/**
 * The deterministic verify, on already-parsed inputs. Shared by the
 * pscale_verify_rider tool (which parses JSON-string params first) and the
 * pscale_networking primitive (which extracts the rider from a slot's position
 * 9 via sand.riderFromSlot). The composite verdict: fail beats unbacked beats
 * warn beats pass; skip only when nothing was claimed.
 */
export async function verifyRiderCore(
  input: {
    rider?: any;
    probe_id?: string;
    chain?: ChainHop[];
    sender_agent_id: string;
    topic_coordinate?: string;
  },
  deps: VerifyDeps = liveDeps(),
): Promise<VerifyResult> {
  const none = { checked: false };
  const rider = normaliseRider(input.rider);
  if (!rider) {
    return { chain: none, provenance: none, balance: none, sq: none, credits: none, verdict: 'skip', reason: 'no rider' };
  }

  const probeId = input.probe_id ?? rider.probe_id;
  const chain = input.chain ?? rider.chain;
  const topic = input.topic_coordinate ?? rider.topic_coordinate;
  const sender = input.sender_agent_id;

  const claimedCredit = typeof rider.credits?.n === 'number' && rider.credits.n > 0 ? rider.credits.n : null;
  const claimedSq = typeof rider.sq === 'number' ? rider.sq : null;
  const hasChain = Array.isArray(chain) && chain.length > 0;

  if (claimedCredit === null && claimedSq === null && !hasChain) {
    return { chain: none, provenance: none, balance: none, sq: none, credits: none, verdict: 'skip', reason: 'rider claims nothing' };
  }

  // CHAIN — signed hops (sand-v2:6).
  const chainResult: any = hasChain
    ? await verifyChainSigned(probeId, chain, deps.loadKey)
    : none;

  // PROVENANCE + BALANCE — only when credit is claimed (sand-v2:3.3, 3.4).
  let provenance: any = none;
  let balance: any = none;
  if (claimedCredit !== null) {
    const passport = await deps.loadPassport(sender);
    if (!passport) {
      provenance = { checked: true, unbacked: true, reason: `no passport for ${sender} — nothing backs the claim` };
    } else if (!probeId) {
      provenance = { checked: true, unbacked: true, reason: 'credit claimed with no probe_id — no GAVE can match' };
    } else {
      const gave = findGave(passport as Block, probeId);
      if (!gave) {
        provenance = { checked: true, unbacked: true, reason: `no GAVE at ${sender}'s out-ledger (6.3) for probe ${probeId}` };
      } else if (gave.n < claimedCredit) {
        provenance = { checked: true, valid: false, claimed: claimedCredit, offered: gave.n, reason: `the record contradicts the claim: GAVE offers ${gave.n}, rider claims ${claimedCredit}` };
      } else {
        provenance = { checked: true, valid: true, claimed: claimedCredit, offered: gave.n, to: gave.to };
      }
      const minted = deps.loadMinted ? await deps.loadMinted(sender) : 0;
      const b = await computeBalance(sender, passport as Block, deps.loadPassport, { minted });
      if (b.balance >= claimedCredit) {
        balance = { checked: true, valid: true, claimed: claimedCredit, ...b };
      } else {
        // Exhausted-now is a lapse, not a fraud: under open offers an honest
        // giver may hold more standing invites than balance (sand-v2:3.2).
        balance = { checked: true, unbacked: true, claimed: claimedCredit, ...b, reason: `balance ${b.balance} does not cover ${claimedCredit} at this moment` };
      }
    }
  }

  // SQ — the claim against the recompute from others (sand-v2:7).
  let sq: any = none;
  if (claimedSq !== null && topic) {
    const passport = await deps.loadPassport(sender);
    if (!passport) {
      sq = { checked: false, reason: `passport not found for ${sender}` };
    } else {
      const { computed, offered, count } = await recomputeSQFromOthers(sender, passport as Block, topic, deps.loadPassport);
      const tolerance = 0.01;
      const matches = Math.abs(claimedSq - computed) < tolerance;
      sq = {
        checked: true,
        matches,
        claimed: claimedSq,
        computed,
        offered,
        recipients_consulted: count,
        ...(matches ? {} : { reason: count === 0 && offered === 0 ? 'no gives at topic — nothing supports the claim' : `SQ divergence: claimed ${claimedSq}, computed ${computed}` }),
      };
    }
  }

  // Composite (sand-v2:5.2): fail > unbacked > warn > pass.
  let verdict: VerifyResult['verdict'];
  if ((chainResult.checked && chainResult.valid === false) || (provenance.checked && provenance.valid === false)) {
    verdict = 'fail';
  } else if (chainResult.unbacked || provenance.unbacked || balance.unbacked) {
    verdict = 'unbacked';
  } else if (sq.checked && !sq.matches) {
    verdict = 'warn';
  } else {
    verdict = 'pass';
  }

  return { chain: chainResult, provenance, balance, sq, credits: balance, verdict };
}

// ── The tool handler ──

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
      if (Array.isArray(parsed)) {
        chainArr = parsed;
      } else if (parsed && typeof parsed === 'object') {
        // The stored digit-keyed chain node, exactly as it sits in a rider.
        chainArr = translateStoredRider({ '4': parsed })?.chain;
      }
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
