/**
 * tools/collective.ts — sed: substrate primitive, federated-only.
 *
 * pscale_settle is the one sed: (sedimentary collective) primitive: it takes a
 * server-assigned position in a collective in landing order, write-locked with
 * the registrant's passphrase. The beach hosts the genuine state machine here —
 * atomic next-position allocation + per-position passphrase hashing — which
 * bsp() cannot express (it has no notion of "next free position").
 *
 * There is deliberately NO founding tool. Founding a collective — seeding the
 * root underscore with conventions and an admin lock before anyone registers —
 * is an ordinary bsp() write, not a state machine:
 *
 *   bsp(agent_id="sed:<collective>", content={_: "<conventions>"}, new_lock="<admin>")
 *
 * The beach treats that as a standard write to a sed:-named block and locks the
 * root "_" under the sed: salt. (The former pscale_create_collective claimed to
 * do this but was silently dead — the beach has no create_collective action, so
 * its body fell through to a standard write carrying no content/new_lock and
 * wrote nothing. Dissolved 2026-06-03: founding was never a state machine, so it
 * is a bsp() write, not a primitive. See block-conventions:7.2.) A collective
 * also comes into being implicitly on the first register, with a default
 * underscore and no admin lock; explicit founding matters only when custom
 * conventions or a lock are wanted up front.
 *
 * agent_id (the beach URL) defaults to DEFAULT_BEACH; pass an explicit URL to
 * register at a different host.
 */

import { z } from 'zod';
import { postActionToBeach, isFederatedOwner, DEFAULT_BEACH } from '../db.js';

// ── Schema ──

export const settleParamsSchema = {
  collective: z.string().describe("Name of the collective to join. Becomes the block name 'sed:<collective>' at the beach."),
  declaration: z.string().describe("Who you are and what you offer/need — becomes the underscore at your position"),
  shell_ref: z.string().optional().describe("URL or block reference to your sovereign shell (optional). Stored at the hidden directory of your position."),
  passphrase: z.string().describe("A key you choose to lock your own entry, so only you can edit it later — an edit-latch on a page you own, not a login or account password. Hashed at the beach; never stored raw. Sensitive — never repeat in conversation."),
  agent_id: z.string().optional().describe(`URL of the beach hosting the sed: collective. Defaults to ${DEFAULT_BEACH}. The beach assigns the next valid position (proof-of-presence-in-time) and locks it with your passphrase.`),
};

// ── Handler ──

export async function handleSettle(params: {
  collective: string;
  declaration: string;
  shell_ref?: string;
  passphrase: string;
  agent_id?: string;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { collective, declaration, shell_ref, passphrase } = params;
  const beach = params.agent_id ?? DEFAULT_BEACH;

  if (!isFederatedOwner(beach)) {
    return {
      content: [{ type: 'text', text: `agent_id must be an http(s):// URL (got "${beach}"). Pass a federated beach URL or omit to use the default (${DEFAULT_BEACH}).` }],
    };
  }

  const blockName = `sed:${collective}`;
  const body: Record<string, any> = { action: 'register', declaration, passphrase };
  if (shell_ref) body.shell_ref = shell_ref;

  let result: any;
  try {
    result = await postActionToBeach(beach, blockName, body);
  } catch (e: any) {
    return { content: [{ type: 'text', text: `Federated registration failed: ${e?.message ?? e}` }] };
  }
  if (!result?.ok) {
    return { content: [{ type: 'text', text: `Federated registration rejected: ${result?.error ?? 'unknown reason'}` }] };
  }

  return {
    content: [{
      type: 'text',
      text: `Settled at ${result.address} on ${beach}.

Site-hosted sed: collective. Position assigned by ${beach}'s handler in landing order. Your position is write-locked with your passphrase. Subsequent writes via bsp(agent_id="${beach}", block="${blockName}", spindle="${result.position}", ..., secret=...) require the same passphrase.

To found a collective with custom conventions + an admin lock before anyone registers, no tool is needed — write the root directly: bsp(agent_id="sed:${collective}", content={_: "<conventions>"}, new_lock="<admin-passphrase>") (block-conventions:7.2).

[hint] Substrate-wide conventions at bsp(agent_id="pscale", block="block-conventions").`,
    }],
  };
}
