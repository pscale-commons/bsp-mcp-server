/**
 * tools/grain.ts — bilateral commitment substrate primitive, federated-only.
 *
 * pscale_grain_reach is symmetric: same call from either agent. The federated
 * beach implements the symmetric two-phase reach/accept state machine. First
 * call creates the grain block and writes one side; second call (from the
 * partner) writes the other side and completes the grain.
 *
 * Grain block at the beach:
 *   { _: description,
 *     "1": { _: A_content }, "2": { _: B_content },
 *     "8": { _: "reach pending…", "1": from, "2": pair_id, … }  // spine-legal; present only between establish and accept
 *     "9": { "1": A_handle, "2": B_handle } }
 *
 * pair_id = sha256(sort(A_handle, B_handle) | join('|')).slice(0, 16). Computed
 * client-side here for the call; the beach computes its own copy.
 *
 * Parameter conventions:
 *   handle / partner_handle — bare-name identities (used for pair_id derivation)
 *   agent_id — URL of the beach hosting the grain (defaults to DEFAULT_BEACH)
 *
 * Both sides must use the same agent_id — the grain block has one home.
 */

import { z } from 'zod';
import { isFederatedOwner, loadBlock, loadBeachIndex, resolveFederationOrigin, DEFAULT_BEACH } from '../db.js';
import { pairId, determineSide } from '../locks.js';
// The reach body belongs to the WIRE — grainReach computes pid and side
// itself (side typed '1' | '2', the string the handler compares) and returns
// the handler's `state` verbatim. locks.ts's sync pairId/determineSide stay
// for the verify-only dry-runs; the battery's live vector pins the two
// derivations together (085d6efa34a97d66 — the first sibling grain).
import { grainReach } from '../pscale-wire.js';

// ── Casing guard ──

/**
 * Role-with-handle prefixes (block-conventions branches 1-3 and 4.9). A handle's
 * presence at a beach shows up as these blocks carrying its exact spelling.
 * Deliberately an explicit list rather than a generic `<word>:<rest>` split —
 * `sed:` names collectives and `grain:` names pair_ids, not handles, and both
 * would false-positive against an ordinary name.
 */
const HANDLE_BLOCK_PREFIXES = ['passport:', 'shell:', 'history:', 'pool:', 'stash:', 'state-of-play:'];

/**
 * Spellings of `handle` this beach carries that differ from the one given.
 *
 * pair_id is sha256 of the two handles sorted and joined — case-sensitive, with
 * no normalisation — so `ayush` and `Ayush` derive two DIFFERENT grain blocks,
 * and each party ends up holding a channel the other cannot see. Observed live
 * 2026-07-25 between happyhedgehog and Ayush: one block half-formed and holding
 * the real message, the other complete and holding pleasantries, both parties
 * correctly reporting that the other had gone quiet. Normalising the derivation
 * would silently rename every grain already standing on every beach, so the
 * guard sits at the door instead.
 *
 * Empty result means proceed: either the given spelling is present, or nothing
 * by that name is here at all — a genuinely new handle must stay reachable.
 * Non-empty means the given spelling has no presence and a differently-cased
 * one does, which is the typo case and the only one worth refusing.
 */
export function casingClashes(index: { blocks: string[] } | null, handle: string): string[] {
  if (!index) return [];
  const want = handle.toLowerCase();
  const spellings = new Set<string>();
  for (const name of index.blocks) {
    const prefix = HANDLE_BLOCK_PREFIXES.find(p => name.startsWith(p));
    if (!prefix) continue;
    const spelling = name.slice(prefix.length);
    if (spelling.toLowerCase() === want) spellings.add(spelling);
  }
  if (spellings.has(handle)) return [];
  return [...spellings];
}

// ── Schemas ──

export const grainReachParamsSchema = {
  handle: z.string().describe('Your bare-name handle. Used to compute pair_id and determine which side (1 or 2) you occupy.'),
  partner_handle: z.string().describe('Their bare-name handle. Must be different from yours.'),
  description: z.string().describe('Mutual description — becomes the root underscore. Used only on first reach; ignored on accept.'),
  my_side_content: z.string().describe("What you write at your side's underscore. Your synthesis or commitment statement."),
  my_passphrase: z.string().describe('Write-lock passphrase for your side. Hashed and stored at the beach. Sensitive — never repeat in conversation.'),
  agent_id: z.string().optional().describe(`URL of the beach hosting the grain. Defaults to ${DEFAULT_BEACH}. Both sides must use the same beach (the grain block has one home). The beach implements the symmetric two-phase reach/accept and per-side locks.`),
  verify_only: z.boolean().optional().describe("Dry-run: when true, evaluate what this call WOULD do without writing or notifying. Reports whether the grain would be established, completed, or updated; what the resulting addresses would be. Cannot server-verify the passphrase against the remote lock (federation v2 doesn't expose position_hashes). No state mutation. Default false."),
};

// ── Handler ──

export async function handleGrainReach(params: {
  handle: string;
  partner_handle: string;
  description: string;
  my_side_content: string;
  my_passphrase: string;
  agent_id?: string;
  verify_only?: boolean;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { handle, partner_handle, description, my_side_content, my_passphrase, verify_only } = params;
  const beach = params.agent_id ?? DEFAULT_BEACH;

  if (!handle || !partner_handle) {
    return { content: [{ type: 'text', text: 'handle and partner_handle are required.' }] };
  }
  if (handle === partner_handle) {
    return { content: [{ type: 'text', text: 'Cannot form a grain with yourself.' }] };
  }
  if (!isFederatedOwner(beach)) {
    return {
      content: [{ type: 'text', text: `agent_id must be an http(s):// URL (got "${beach}"). Pass a federated beach URL or omit to use the default (${DEFAULT_BEACH}).` }],
    };
  }

  // Refuse a mis-cased handle BEFORE it derives a second grain block. One index
  // read covers both handles; a failed read never blocks a reach — a network
  // blip must not read as a refusal.
  let index: { blocks: string[] } | null = null;
  try {
    index = await loadBeachIndex(beach);
  } catch {
    index = null;
  }
  for (const [label, given] of [['partner_handle', partner_handle], ['handle', handle]] as const) {
    const [use, ...also] = casingClashes(index, given);
    if (!use) continue;
    const others = also.length ? ` (also present: ${also.map(s => `"${s}"`).join(', ')})` : '';
    return {
      content: [{
        type: 'text',
        text: `Reach refused — ${label}="${given}" has no presence at ${beach}, but "${use}" does${others}.

pair_id is derived from the two handles exactly as spelled, so reaching "${given}" would create a SEPARATE grain block that "${use}" can never complete: both parties would then hold a channel the other cannot see, each correctly reporting that the other had gone quiet. Nothing has been written.

Re-run with ${label}="${use}".

If the spelling is deliberate and "${given}" is genuinely someone else, give them any presence at this beach first — a passport is enough — and the reach goes through. Background at bsp(agent_id="${beach}", block="ways:grain").`,
      }],
    };
  }

  const pid = pairId(handle, partner_handle);
  const mySide = determineSide(handle, partner_handle);
  const partnerSide = mySide === '1' ? '2' : '1';
  const blockName = `grain:${pid}`;

  // ── Verify-only branch ──
  if (verify_only) {
    const remoteRow = await loadBlock(beach, blockName);
    const pairIdLine = `grain:${pid} on ${beach}`;
    if (!remoteRow) {
      return {
        content: [{
          type: 'text',
          text: `[verify_only] Would establish a new grain at the federated host.

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}@${beach}
partner side:   grain:${pid}:${partnerSide}@${beach}
state:          new

Calling without verify_only would create the grain, write your side, lock with your passphrase, and leave a reach hint at block['8']. No state has been changed.`,
        }],
      };
    }
    const mineExists = remoteRow.block?.[mySide] !== undefined;
    const partnerExists = remoteRow.block?.[partnerSide] !== undefined;
    const caveat = '\n\nNote: passphrase NOT server-verified — the federation protocol does not expose position_hashes. Verify against the federated host by attempting the call.';
    if (!mineExists && partnerExists) {
      return {
        content: [{
          type: 'text',
          text: `[verify_only] Would complete an existing half-formed grain at the federated host.

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}@${beach} (currently empty — would be written)
partner side:   grain:${pid}:${partnerSide}@${beach} (already written)
state:          half-formed → completed${caveat}`,
        }],
      };
    }
    if (mineExists && !partnerExists) {
      return {
        content: [{
          type: 'text',
          text: `[verify_only] Your side already exists; partner has not yet reached.

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}@${beach} (already written)
partner side:   grain:${pid}:${partnerSide}@${beach} (empty)
state:          half-formed (your side present)${caveat}

A second call with these args would be rejected as "your side already exists".`,
        }],
      };
    }
    return {
      content: [{
        type: 'text',
        text: `[verify_only] Both sides already written.

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}@${beach} (already written)
partner side:   grain:${pid}:${partnerSide}@${beach} (already written)
state:          completed${caveat}

A second call with these args would be rejected as "your side already exists".`,
      }],
    };
  }

  // ── Real reach/accept ──
  // The wire owns the body outright: grainReach maps the LLM-facing names
  // (handle, partner_handle) to the handler's fields (agent_id,
  // partner_agent_id), computes pid and side itself, and hands back `state`.
  const origin = await resolveFederationOrigin(beach);
  if (!origin) {
    return { content: [{ type: 'text', text: `Federated grain reach failed: No beach at ${beach} (also tried beach.<host>). Site is not federated.` }] };
  }
  const result = await grainReach(origin, {
    handle,
    partner: partner_handle,
    description,
    sideContent: my_side_content,
    passphrase: my_passphrase,
  });
  if (!result.ok) {
    return { content: [{ type: 'text', text: `Federated grain reach rejected: ${result.error ?? 'unknown reason'}` }] };
  }

  const conventionsHint = `\n\n[hint] Substrate-wide conventions at bsp(agent_id="pscale", block="block-conventions").`;
  const pairIdLine = `grain:${pid} on ${beach}`;

  if (result.state === 'completed') {
    return {
      content: [{
        type: 'text',
        text: `Grain completed (both sides written and locked at the federated grain).

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}@${beach}
partner side:   grain:${pid}:${partnerSide}@${beach}
state:          ${result.state}

Both sides hold. Walk the partner's underscore at bsp(agent_id="${beach}", block="${blockName}", spindle="${partnerSide}"). Write through your side via bsp() with secret to extend the bilateral.${conventionsHint}`,
      }],
    };
  }
  if (result.state === 'updated') {
    return {
      content: [{
        type: 'text',
        text: `Own-side rewrite at the federated grain.

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}@${beach}
partner side:   grain:${pid}:${partnerSide}@${beach}
state:          ${result.state}

Your side replaced; partner's side untouched. Walk with bsp(agent_id="${beach}", block="${blockName}").${conventionsHint}`,
      }],
    };
  }
  return {
    content: [{
      type: 'text',
      text: `Grain reached (awaiting partner acceptance at the federated grain).

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}@${beach}
partner side:   grain:${pid}:${partnerSide}@${beach}
state:          ${result.state}

Read the partner's reach hint at bsp(agent_id="${beach}", block="${blockName}", spindle="8"). It clears when they accept via pscale_grain_reach with you as their partner_handle.${conventionsHint}`,
    }],
  };
}
