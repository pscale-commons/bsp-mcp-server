/**
 * tools/torus.ts — pscale_torus, the live-axis tool.
 *
 * The FIRST operation that is not on the durable substrate. The five primitives
 * each drive a beach state machine (or the pool envelope); this drives none of
 * them. Each call is a HEARTBEAT: it beats the in-process torus (src/torus.ts)
 * with the caller's current reach and reads back who else is live at the same
 * place. Request/response, no streaming — which is exactly how an LLM is live
 * (it polls by calling; the tool-call loop IS its vapour). The field is keyed by
 * LOCATION (`frame`), in-process, ephemeral; never a block.
 *
 * N-way is the primary case (a room of co-present agents). Pairwise is the
 * special case: pass `with_handle` and the tool derives an order-independent
 * `reach:<sorted pair>` frame (pairFrame) — the LIVE precursor to a durable
 * grain. `grain` stays reserved for the lock-gated block (pscale_grain_reach);
 * the live overlap is a reach. This tool writes nothing durable and never
 * touches grain.
 */

import { z } from 'zod';
import { torus, pairFrame, STALE_S, type TorusView } from '../torus.js';

export const torusParamsSchema = {
  handle: z
    .string()
    .describe('Who you are — your bare-name handle (a character, a user, or an agent). Your presence and reach are stamped under this at the frame.'),
  frame: z
    .string()
    .optional()
    .describe('The PLACE you are live at — a location key (a room / pool / beach address, e.g. "thornwood:pool:beaten-drum-main"). Co-presence is keyed by location: everyone at the same frame shares the field. Provide this OR with_handle.'),
  with_handle: z
    .string()
    .optional()
    .describe('Reach toward ONE specific peer instead of a room. The tool derives an order-independent pair frame ("reach:<sorted handles>") — the LIVE precursor to a durable grain (reserve grain for the locked block via pscale_grain_reach). Provide this OR frame.'),
  reach: z
    .string()
    .optional()
    .describe('Your live offering — the externally-meaningful summary of where you are heading right now (an LLM\'s current intention; a human\'s unsent draft). OMIT for a bare presence ping that PRESERVES your standing reach. Pass "" to clear it.'),
  face: z
    .enum(['character', 'author', 'designer', 'observer'])
    .optional()
    .describe('CADO face tag for your presence. Defaults to character (the live-play face) on the first beat; preserved across bare pings.'),
  depart: z
    .boolean()
    .optional()
    .describe('Leave cleanly — drop your presence at this frame now rather than waiting for it to go stale. No reach needed.'),
};

export type TorusParams = {
  handle: string;
  frame?: string;
  with_handle?: string;
  reach?: string;
  face?: 'character' | 'author' | 'designer' | 'observer';
  depart?: boolean;
};

export async function handleTorus(
  params: TorusParams,
): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { handle, with_handle, reach, face } = params;

  if (!handle) {
    return { content: [{ type: 'text', text: 'handle is required — who you are.' }] };
  }
  if (with_handle && with_handle === handle) {
    return { content: [{ type: 'text', text: 'A reach needs two — with_handle cannot be yourself.' }] };
  }
  const frame = with_handle ? pairFrame(handle, with_handle) : params.frame;
  if (!frame) {
    return {
      content: [{
        type: 'text',
        text: 'Provide frame= (a place you are live at) OR with_handle= (a peer to reach toward).',
      }],
    };
  }

  if (params.depart) {
    torus.depart(frame, handle);
    return {
      content: [{
        type: 'text',
        text: `departed — presence dropped at ${frame}. Stop calling and any standing reach evaporates after the afterglow.`,
      }],
    };
  }

  const view = torus.beat(frame, handle, reach, face);
  return { content: [{ type: 'text', text: render(with_handle, view) }] };
}

/** Render the torus view as readable text (house style — text, not JSON). */
function render(withHandle: string | undefined, view: TorusView): string {
  const lines: string[] = [];
  lines.push(`torus ${view.frame}`);
  const you = view.you;
  const youReach = you?.reach ?? '(presence only — no standing reach)';
  lines.push(`you: ${you?.handle ?? '?'} [${you?.face ?? 'character'}] — reach: ${youReach}`);
  lines.push('');

  if (withHandle) {
    // Pairwise — the live grain-precursor. Formed = both present and both reaching.
    const them = view.present.find((p) => p.handle === withHandle);
    const formed = !!them?.reach && !!you?.reach;
    if (!them) {
      lines.push(
        `${withHandle} has not reached yet — contact forms when they call ` +
        `pscale_torus(handle="${withHandle}", with_handle="${you?.handle ?? 'you'}", reach=...).`,
      );
    } else {
      lines.push(`${withHandle} [${them.face}] (age ${them.age}s): ${them.reach ?? '(present, no reach)'}`);
      lines.push(formed
        ? 'CONTACT FORMED — both present and reaching. The reach is live; it evaporates when either stops calling. To KEEP it, commit a durable grain via pscale_grain_reach.'
        : 'reaching — waiting for both sides to carry a reach.');
    }
    lines.push('');
  } else {
    // N-way room.
    lines.push(`# Present (${view.present.length} other${view.present.length === 1 ? '' : 's'} live here)`);
    if (view.present.length === 0) {
      lines.push('(no one else live at this place right now)');
    } else {
      for (const p of view.present) {
        lines.push(`- ${p.handle} [${p.face}] (age ${p.age}s): ${p.reach ?? '(present, no reach)'}`);
      }
    }
    lines.push('');
  }

  lines.push(`load: ${view.load} live across all frames / cap ${view.cap}${view.saturated ? ' — SATURATED (advisory; never refused)' : ''}`);
  lines.push(`(keep calling within ${STALE_S}s to stay live; stop and your presence evaporates — vapour, never a block)`);
  return lines.join('\n');
}
