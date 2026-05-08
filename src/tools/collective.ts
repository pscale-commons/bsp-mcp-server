/**
 * tools/collective.ts — sed: substrate primitives, federated-only.
 *
 * pscale_create_collective and pscale_register both operate against a beach
 * URL (the federated host that runs the sed: substrate). The beach implements
 * atomic position allocation, hashes the passphrase under the canonical sed:
 * salt format, and writes the registrant declaration server-side.
 *
 * agent_id parameter (URL of the beach hosting the sed: collective) defaults
 * to DEFAULT_BEACH when omitted. Pass an explicit URL to register at a
 * different host.
 */

import { z } from 'zod';
import { postActionToBeach, isFederatedOwner, DEFAULT_BEACH } from '../db.js';

// ── Schemas ──

export const createCollectiveParamsSchema = {
  collective: z.string().describe("Name of the collective (e.g. 'commons', 'thornkeep-cast'). Becomes the block name 'sed:<collective>' at the beach."),
  conventions: z.string().describe("The rules of play — becomes the root underscore. Routing, evaluation, registration rules, etc."),
  creator_passphrase: z.string().describe("Admin passphrase for the collective root. Hashed and stored at the beach. Sensitive — never repeat in conversation."),
  agent_id: z.string().optional().describe(`URL of the beach to host the sed: collective. Defaults to ${DEFAULT_BEACH}. The beach must implement the sed: substrate handler (atomic position allocation + per-position locks). Pass any http(s):// URL to host the collective elsewhere.`),
};

export const registerParamsSchema = {
  collective: z.string().describe("Name of the collective to join. Becomes the block name 'sed:<collective>' at the beach."),
  declaration: z.string().describe("Who you are and what you offer/need — becomes the underscore at your position"),
  shell_ref: z.string().optional().describe("URL or block reference to your sovereign shell (optional). Stored at the hidden directory of your position."),
  passphrase: z.string().describe("Write-lock passphrase for your position. Hashed at the beach. Never stored raw. Sensitive — never repeat in conversation."),
  agent_id: z.string().optional().describe(`URL of the beach hosting the sed: collective. Defaults to ${DEFAULT_BEACH}. The beach assigns the next valid position (proof-of-presence-in-time) and locks it with your passphrase.`),
};

// ── Handlers ──

export async function handleCreateCollective(params: {
  collective: string;
  conventions: string;
  creator_passphrase: string;
  agent_id?: string;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { collective, conventions, creator_passphrase } = params;
  const beach = params.agent_id ?? DEFAULT_BEACH;

  if (!isFederatedOwner(beach)) {
    return {
      content: [{ type: 'text', text: `agent_id must be an http(s):// URL (got "${beach}"). Pass a federated beach URL or omit to use the default (${DEFAULT_BEACH}).` }],
    };
  }

  const blockName = `sed:${collective}`;
  const body: Record<string, any> = {
    action: 'create_collective',
    conventions,
    creator_passphrase,
  };

  let result: any;
  try {
    result = await postActionToBeach(beach, blockName, body);
  } catch (e: any) {
    return { content: [{ type: 'text', text: `Federated create_collective failed: ${e?.message ?? e}` }] };
  }
  if (!result?.ok) {
    return { content: [{ type: 'text', text: `Federated create_collective rejected: ${result?.error ?? 'unknown reason'}` }] };
  }

  return {
    content: [{
      type: 'text',
      text: `Collective "${collective}" created at ${beach}. Walk with bsp(agent_id="${beach}", block="${blockName}"). Conventions are at the root underscore. Agents register with pscale_register.`,
    }],
  };
}

export async function handleRegister(params: {
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
      text: `Registered at ${result.address} on ${beach}.

Site-hosted sed: collective. Position assigned by ${beach}'s handler in landing order. Your position is write-locked with your passphrase. Subsequent writes via bsp(agent_id="${beach}", block="${blockName}", spindle="${result.position}", ..., secret=...) require the same passphrase.

[hint] Substrate-wide conventions at bsp(agent_id="pscale", block="block-conventions").`,
    }],
  };
}
