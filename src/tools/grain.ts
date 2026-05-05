/**
 * tools/grain.ts — bilateral commitment substrate primitive.
 *
 * pscale_grain_reach is symmetric: same call from either agent. Server
 * detects state — first call creates the block and writes one side; second
 * call (from the partner) writes the other side and completes the grain.
 *
 * Grain block shape:
 *   { _: description,
 *     "1": { _: A_content }, "2": { _: B_content },
 *     "8": { _reach_pending: {...} }   // present only between establish and accept
 *     "9": { "1": A_agent_id, "2": B_agent_id } }
 *
 * Position 9's hidden directory maps side → underlying agent_id.
 * Position 8 carries a transient reach hint (Stage 6 inbox replacement) so
 * the partner can discover the incoming reach by walking grain blocks they
 * appear at position 9 of, without needing a separate inbox primitive. The
 * hint is cleared when the partner's accept call completes the grain.
 *
 * pair_id = sha256(sort(A_id, B_id) | join('|')).slice(0, 16).
 *
 * Notification: dual-write during the v2 transition. Both an in-block hint
 * (block['8']._reach_pending, beach-native discoverable) and a sand_inbox row
 * (legacy, still consumed by pscale-mcp-server). The inbox write will be
 * removed in a follow-up commit once pscale_network and other readers move
 * to the in-block path. Per proposals/2026-04-30-stage-6-inbox-replacement.md.
 */

import { z } from 'zod';
import { Block } from '../bsp.js';
import { loadBlock, saveBlock, updatePositionHashes, getClient, postActionToBeach, isFederatedOwner } from '../db.js';
import { hashGrainPassphrase, pairId, determineSide } from '../locks.js';

const GRAIN_PREFIX = 'grain:';
const GRAIN_BLOCK_NAME = 'grain';

function grainOwner(pid: string): string {
  return `${GRAIN_PREFIX}${pid}`;
}

// ── Schemas ──

export const grainReachParamsSchema = {
  agent_id: z.string().describe('Your agent identifier (bare, not grain: or sed:)'),
  partner_agent_id: z.string().describe('Their agent_id. Must be different from yours.'),
  description: z.string().describe('Mutual description — becomes the root underscore. Used only on first reach; ignored on accept.'),
  my_side_content: z.string().describe("What you write at your side's underscore. Your synthesis or commitment statement."),
  my_passphrase: z.string().describe('Write-lock passphrase for your side. Hashed and stored. Sensitive — never repeat in conversation.'),
  host: z.string().optional().describe("Federated dispatch: when set to a URL like https://example.com, the grain lives at that site's /.well-known/pscale-beach?block=grain:<pair_id> rather than central commons. Site implements the symmetric two-phase reach/accept. Both sides must use the same host (the grain block has one home). Omit for central commons."),
  verify_only: z.boolean().optional().describe("Dry-run: when true, evaluate what this call WOULD do without writing or notifying. Reports whether the grain would be established, completed, or updated; whether your passphrase matches an existing own-side lock; and what the resulting addresses would be. No state mutation. Default false."),
};

// ── Handler ──

export async function handleGrainReach(params: {
  agent_id: string;
  partner_agent_id: string;
  description: string;
  my_side_content: string;
  my_passphrase: string;
  host?: string;
  verify_only?: boolean;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { agent_id, partner_agent_id, description, my_side_content, my_passphrase, host, verify_only } = params;

  if (!agent_id || !partner_agent_id) {
    return { content: [{ type: 'text', text: 'agent_id and partner_agent_id are required.' }] };
  }
  if (agent_id === partner_agent_id) {
    return { content: [{ type: 'text', text: 'Cannot form a grain with yourself.' }] };
  }

  const pid = pairId(agent_id, partner_agent_id);
  const mySide = determineSide(agent_id, partner_agent_id);
  const partnerSide = mySide === '1' ? '2' : '1';
  const owner = grainOwner(pid);

  // ── Verify-only branch ──
  // Dry-run path: evaluates state without writing. Federated case reads the
  // grain block via GET to determine state; cannot server-verify the
  // passphrase against the remote lock (position_hashes are not exposed in
  // the federation v2 protocol). Commons case has full passphrase verification.
  if (verify_only) {
    if (host) {
      if (!isFederatedOwner(host)) {
        return { content: [{ type: 'text', text: `host must be an http(s):// URL (got "${host}")` }] };
      }
      const blockName = `grain:${pid}`;
      const remoteRow = await loadBlock(host, blockName);
      const pairIdLine = `grain:${pid} on ${host}`;
      if (!remoteRow) {
        return {
          content: [{
            type: 'text',
            text: `[verify_only] Would establish a new grain at the federated host.

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}@${host}
partner side:   grain:${pid}:${partnerSide}@${host}
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
your side:      grain:${pid}:${mySide}@${host} (currently empty — would be written)
partner side:   grain:${pid}:${partnerSide}@${host} (already written)
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
your side:      grain:${pid}:${mySide}@${host} (already written)
partner side:   grain:${pid}:${partnerSide}@${host} (empty)
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
your side:      grain:${pid}:${mySide}@${host} (already written)
partner side:   grain:${pid}:${partnerSide}@${host} (already written)
state:          completed${caveat}

A second call with these args would be rejected as "your side already exists".`,
        }],
      };
    }
    // Commons path — can server-verify passphrase against own-side lock if present.
    const existingRow = await loadBlock(owner, GRAIN_BLOCK_NAME);
    const pairIdLine = `grain:${pid} on commons (Supabase)`;
    if (!existingRow) {
      return {
        content: [{
          type: 'text',
          text: `[verify_only] Would establish a new grain on commons.

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}
partner side:   grain:${pid}:${partnerSide}
state:          new

Calling without verify_only would create the block, write your side, lock with your passphrase, and notify ${partner_agent_id} via the in-block reach hint at grain:${pid}/8. No state has been changed.`,
        }],
      };
    }
    const mineExists = existingRow.block?.[mySide] !== undefined;
    const partnerExists = existingRow.block?.[partnerSide] !== undefined;
    if (!mineExists && partnerExists) {
      return {
        content: [{
          type: 'text',
          text: `[verify_only] Would complete an existing half-formed grain on commons.

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide} (currently empty — would be written)
partner side:   grain:${pid}:${partnerSide} (already written)
state:          half-formed → completed`,
        }],
      };
    }
    if (mineExists) {
      const myStoredHash = existingRow.position_hashes?.[mySide];
      const myComputedHash = hashGrainPassphrase(my_passphrase, pid, mySide);
      const passphraseMatches = myStoredHash === myComputedHash;
      const matchLine = passphraseMatches
        ? 'passphrase MATCHES your existing own-side lock'
        : 'passphrase does NOT match your existing own-side lock';
      return {
        content: [{
          type: 'text',
          text: `[verify_only] Your side already exists; ${matchLine}.

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide} (already written)
partner side:   grain:${pid}:${partnerSide} ${partnerExists ? '(already written)' : '(empty)'}
state:          ${partnerExists ? 'completed' : 'half-formed (your side present)'}

A second call with these args would be rejected as "your side already exists" — to update your side, use bsp() with secret=<my_passphrase>.`,
        }],
      };
    }
    // Defensive fallback — both sides empty but row exists shouldn't happen.
    return {
      content: [{
        type: 'text',
        text: `[verify_only] Block exists but no sides are written. State is anomalous; investigate before writing.`,
      }],
    };
  }

  // Federated dispatch: site-hosted grain: substrate handles the symmetric
  // two-phase reach/accept server-side. Both sides must use the same host.
  if (host) {
    if (!isFederatedOwner(host)) {
      return { content: [{ type: 'text', text: `host must be an http(s):// URL (got "${host}")` }] };
    }
    const blockName = `grain:${pid}`;
    const body: Record<string, any> = {
      action: 'reach',
      side: mySide,
      agent_id,
      partner_agent_id,
      description,
      my_side_content,
      my_passphrase,
    };
    let result: any;
    try {
      result = await postActionToBeach(host, blockName, body);
    } catch (e: any) {
      return { content: [{ type: 'text', text: `Federated grain reach failed: ${e?.message ?? e}` }] };
    }
    if (!result?.ok) {
      return { content: [{ type: 'text', text: `Federated grain reach rejected: ${result?.error ?? 'unknown reason'}` }] };
    }
    const conventionsHint = `\n\n[hint] Local beach conventions at bsp(agent_id="${host}", block="beach", spindle="8"). Substrate-wide conventions at bsp(agent_id="pscale", block="block-conventions").`;
    const pairIdLine = `grain:${pid} on ${host}`;
    if (result.state === 'completed') {
      return {
        content: [{
          type: 'text',
          text: `Grain completed (both sides written and locked at the federated grain).

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}@${host}
partner side:   grain:${pid}:${partnerSide}@${host}
state:          ${result.state}

Both sides hold. Walk the partner's underscore at bsp(agent_id="${host}", block="${blockName}", spindle="${partnerSide}"). Write through your side via bsp() with secret to extend the bilateral.${conventionsHint}`,
        }],
      };
    }
    if (result.state === 'updated') {
      return {
        content: [{
          type: 'text',
          text: `Own-side rewrite at the federated grain.

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}@${host}
partner side:   grain:${pid}:${partnerSide}@${host}
state:          ${result.state}

Your side replaced; partner's side untouched. Walk with bsp(agent_id="${host}", block="${blockName}").${conventionsHint}`,
        }],
      };
    }
    return {
      content: [{
        type: 'text',
        text: `Grain reached (awaiting partner acceptance at the federated grain).

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}@${host}
partner side:   grain:${pid}:${partnerSide}@${host}
state:          ${result.state}

Read the partner's reach hint at bsp(agent_id="${host}", block="${blockName}", spindle="8"). It clears when they accept via pscale_grain_reach with you as their partner_agent_id.${conventionsHint}`,
      }],
    };
  }

  const existing = await loadBlock(owner, GRAIN_BLOCK_NAME);

  let block: Block;
  let hashes: Record<string, string>;
  let messageType: string;
  let stateNote: string;

  if (!existing) {
    // Establish: write reaching side AND in-block reach hint at position 8.
    // Partner discovers the reach by walking grain blocks where their
    // agent_id appears at position 9 and finding _reach_pending at 8.
    const reachHint = {
      from: agent_id,
      pair_id: pid,
      grain_address_yours: `grain:${pid}:${partnerSide}`,
      grain_address_mine: `grain:${pid}:${mySide}`,
      description,
      reached_at: new Date().toISOString(),
    };
    block = {
      _: description,
      [mySide]: { _: my_side_content },
      '8': { _reach_pending: reachHint },
      '9': { [mySide]: agent_id },
    };
    hashes = { [mySide]: hashGrainPassphrase(my_passphrase, pid, mySide) };
    messageType = 'grain_establish';
    stateNote = 'reached (awaiting partner acceptance)';
  } else {
    const existingBlock = existing.block;
    const existingHashes = existing.position_hashes || {};
    const existingAgents = (existingBlock['9'] as any) || {};

    if (existingBlock[mySide] !== undefined) {
      return {
        content: [{
          type: 'text',
          text: `Your side (${mySide}) of grain:${pid} already exists. Use bsp(agent_id="${owner}", block="grain", spindle="${mySide}", content=..., secret=...) to update.`,
        }],
      };
    }

    block = { ...existingBlock };
    block[mySide] = { _: my_side_content };
    block['9'] = { ...existingAgents, [mySide]: agent_id };
    // Accept: clear the position-8 reach hint, the grain is now complete.
    // Safe no-op if the establish call predates Stage 6 and never wrote a hint.
    delete block['8'];
    hashes = {
      ...existingHashes,
      [mySide]: hashGrainPassphrase(my_passphrase, pid, mySide),
    };
    messageType = 'grain_accept';
    stateNote = 'completed (both sides written and locked)';
  }

  await saveBlock(owner, GRAIN_BLOCK_NAME, block, 'sedimentary');
  await updatePositionHashes(owner, GRAIN_BLOCK_NAME, hashes);

  // Dual-write notification path during the v2 transition:
  //   (1) in-block hint at block['8']._reach_pending (already written above) —
  //       beach-native, partner discovers by walking grain blocks they appear
  //       at position 9 of. This is the v2 path; sand_inbox is legacy.
  //   (2) sand_inbox row — for backward compatibility with pscale-mcp-server
  //       readers (e.g. pscale_network's "emerging" listing). Will be dropped
  //       in a follow-up commit once those readers move to the in-block path.
  const client = getClient();
  const { error: inboxError } = await client.from('sand_inbox').insert({
    from_agent: agent_id,
    to_agent: partner_agent_id,
    message: {
      type: messageType,
      pair_id: pid,
      grain_address_yours: `grain:${pid}:${partnerSide}`,
      grain_address_mine: `grain:${pid}:${mySide}`,
      description,
      content: my_side_content,
    },
    created_at: new Date().toISOString(),
  });

  const inboxNote = inboxError
    ? `\n\nNote: inbox notification to ${partner_agent_id} failed — ${inboxError.message}. (In-block hint at grain:${pid}/8 still landed — partner can discover via walk.)`
    : '';

  const pairIdLine = `grain:${pid} on commons (Supabase)`;

  if (messageType === 'grain_establish') {
    return {
      content: [{
        type: 'text',
        text: `Grain reached (awaiting partner acceptance).

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}
partner side:   grain:${pid}:${partnerSide}
block owner:    ${owner}
message sent:   ${messageType}${inboxNote}

Partner ${partner_agent_id} notified two ways: in-block at bsp(agent_id="${owner}", block="grain", spindle="8") (walk-discoverable) and via legacy sand_inbox. They call pscale_grain_reach with you as their partner_agent_id to accept.`,
      }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `Grain completed (both sides written and locked).

pair_id:        ${pairIdLine}
your side:      grain:${pid}:${mySide}
partner side:   grain:${pid}:${partnerSide}
block owner:    ${owner}
message sent:   ${messageType}${inboxNote}

Both sides hold. Walk the partner's underscore at bsp(agent_id="${owner}", block="grain", spindle="${partnerSide}"). Write through your side via bsp() with agent_id="grain:${pid}:${mySide}" + secret.`,
    }],
  };
}
