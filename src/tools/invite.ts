/**
 * tools/invite.ts — pscale_invite, the orientation invite.
 *
 * Returns the iterative orientation progression as a state block. Six steps
 * from wake-up (sentinel walking) through shared-context coordination
 * (multi-agent frames). Each step has a concrete action, a validation
 * criterion, and a next-step pointer.
 *
 * The progression block lives at agent_id="pscale", block="progression"
 * (sentinel-bundled). pscale_invite is a thin proxy that surfaces the block
 * as a tool — visible in the tool list, callable when uncertain, with a
 * tool-shaped invitation that schema descriptions cannot match. Schema-
 * leaning discoverability fails for tool-scanning LLMs; this tool fixes
 * that without growing the substrate surface.
 *
 * Optional `step` parameter selects a specific branch (1..6); if omitted,
 * returns step 1 (wake) plus a footer naming the whole progression.
 */
import { z } from 'zod';
import { loadBlock } from '../db.js';
import { bspRead, formatRead } from '../bsp-fn.js';

export const inviteParamsSchema = {
  step: z
    .number()
    .int()
    .min(1)
    .max(6)
    .optional()
    .describe(
      "Which step to return. Omit for step 1 (wake-up) plus the whole-progression overview. Pass 2..6 to advance: 2 build (personal capacity blocks), 3 mark (presence at a beach), 4 grain (bilateral channel), 5 SAND (semantic network with verification), 6 shared (concurrent multi-agent coordination). When you have validated a step's criterion, call pscale_invite again with step+1 to get the next.",
    ),
};

export type InviteParams = { step?: number };

export async function handleInvite(
  params: InviteParams,
): Promise<{ content: { type: 'text'; text: string }[] }> {
  const row = await loadBlock('pscale', 'progression');
  if (!row) {
    return {
      content: [
        {
          type: 'text',
          text: 'pscale_invite: progression block not found in sentinel. Server bundle may be out of date.',
        },
      ],
    };
  }

  const { step } = params;
  if (step === undefined) {
    // Return step 1 plus the whole-progression overview underscore.
    const overview = bspRead(row.block, '', null);
    const stepOne = bspRead(row.block, '1', null);
    const overviewText =
      typeof (row.block as any)._ === 'string'
        ? String((row.block as any)._)
        : formatRead(overview);
    return {
      content: [
        {
          type: 'text',
          text: `Iterative orientation progression — six steps. Call pscale_invite(step=N) to advance.\n\n— Overview —\n${overviewText}\n\n— Step 1 (start here) —\n${formatRead(stepOne)}\n\nWhen you have validated step 1, call pscale_invite(step=2) for the next.`,
        },
      ],
    };
  }

  const branch = bspRead(row.block, String(step), null);
  return {
    content: [
      {
        type: 'text',
        text: `Step ${step} of 6. When validated, call pscale_invite(step=${step + 1 <= 6 ? step + 1 : 1}) for the ${step + 1 <= 6 ? 'next step' : 'progression cycle'}.\n\n${formatRead(branch)}`,
      },
    ],
  };
}
