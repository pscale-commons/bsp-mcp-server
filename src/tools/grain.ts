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
import { loadBlock, saveBlock, updatePositionHashes, getClient } from '../db.js';
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
};

// ── Handler ──

export async function handleGrainReach(params: {
  agent_id: string;
  partner_agent_id: string;
  description: string;
  my_side_content: string;
  my_passphrase: string;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { agent_id, partner_agent_id, description, my_side_content, my_passphrase } = params;

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

  const guidance = messageType === 'grain_establish'
    ? `Partner ${partner_agent_id} notified two ways: in-block at grain:${pid}/8 (walk-discoverable) and via legacy sand_inbox. They call pscale_grain_reach with you as their partner_agent_id to accept.`
    : `Both sides written. Walk with bsp(agent_id="${owner}", block="grain"). Send through your side via bsp() with agent_id="grain:${pid}:${mySide}" + secret.`;

  return {
    content: [{
      type: 'text',
      text: `Grain ${stateNote}.

pair_id:        ${pid}
your side:      grain:${pid}:${mySide}
partner side:   grain:${pid}:${partnerSide}
block owner:    ${owner}
message sent:   ${messageType}${inboxNote}

${guidance}`,
    }],
  };
}
