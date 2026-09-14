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
import type { Block } from '../bsp.js';
import { loadBlock, DEFAULT_BEACH } from '../db.js';
import { bspRead, formatRead } from '../bsp-fn.js';

/**
 * Render the welcome block as a clean director's note — underscore first, then
 * each move as a bullet, nested doors indented. Deliberately NOT formatRead:
 * the welcoming LLM should read plain prose to metabolise, never walker-debug
 * output ("[path-walk @ ...] d1 p0 [1]: ...") — which is itself a species of the
 * blodge this welcome exists to end.
 */
function renderWelcome(block: Block): string {
  const root = block as Record<string, unknown>;
  const out: string[] = [];
  if (typeof root._ === 'string') out.push(root._ as string);
  out.push('');
  const emit = (node: Record<string, unknown>, indent: string): void => {
    for (let d = 1; d <= 9; d++) {
      const child = node[String(d)];
      if (child === undefined || child === null) continue;
      if (typeof child === 'string') {
        out.push(`${indent}• ${child}`);
      } else if (typeof child === 'object') {
        const obj = child as Record<string, unknown>;
        if (typeof obj._ === 'string') out.push(`${indent}• ${obj._ as string}`);
        emit(obj, indent + '    ');
      }
    }
  };
  emit(root, '');
  return out.join('\n');
}

/**
 * The welcome names a LIVE world, read from the `worlds` register at the default
 * beach at call time — never a literal in tool text (proposal:three-portals 5.1:
 * a world named in a docstring is the pointer nobody re-reads as a block, and it
 * rots the day the world is retired — thornwood did). THE FIRST WORLD WITH A DOOR:
 * the welcome promises one call, look around, act once, and that is true only of a
 * register line whose third field names the room a newcomer lands in (an open
 * table's gate — worlds:_ from 2026-09-14); a canon scenario, whose third field
 * says 'surface', answers a stranger with the Author walk instead. Rows are read
 * in order, the wrapped era first, so the register's own growth law holds; with no
 * doored row the first row stands as before, and when the register is unreachable
 * the welcome points at the register itself.
 */
export function pickWelcomeWorld(w: unknown): string | null {
  if (!w || typeof w !== 'object') return null;
  const rows: string[] = [];
  const walk = (n: Record<string, unknown>) => {
    const u = n['_'];
    if (u && typeof u === 'object') walk(u as Record<string, unknown>);
    for (const k of Object.keys(n).filter((k) => /^[1-9]$/.test(k)).sort()) {
      const e = n[k];
      if (typeof e === 'string' && e.includes('→')) rows.push(e);
      else if (e && typeof e === 'object') walk(e as Record<string, unknown>);
    }
  };
  walk(w as Record<string, unknown>);
  const parsed = rows.map((e) => {
    const f = e.split('→').map((t) => t.trim());
    return { name: f[0] ?? '', room: (f[2] ?? '').toLowerCase() };
  }).filter((r) => r.name);
  const doored = parsed.find((r) => r.room && r.room !== 'surface');
  return (doored ?? parsed[0])?.name ?? null;
}

async function firstWorldName(): Promise<string> {
  try {
    const row = await loadBlock(DEFAULT_BEACH, 'worlds');
    const name = pickWelcomeWorld(row?.block);
    if (name) return name;
  } catch { /* the register is orientation, never a gate — absence points at it */ }
  return '<a name from the worlds block at the beach>';
}

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
  const { step } = params;

  // Cold call — a person is arriving. Return the Character-voiced WELCOME: the
  // MOVES for the opening turn, not the agent build-ladder. The header patch
  // that used to sit here said "wear Character" while the body handed back the
  // Designer engineering ladder — the voice/payload split that produced blodge.
  if (step === undefined) {
    const welcomeRow = await loadBlock('pscale', 'welcome');
    if (welcomeRow) {
      const world = await firstWorldName();
      return {
        content: [
          {
            type: 'text',
            text:
              renderWelcome(welcomeRow.block).replace("world='<world>'", `world='${world}'`) +
              '\n\n———\nMaking substrate capacity for yourself as an AGENT (not welcoming a human)? The six-step build ladder — wake, build, mark, grain, SAND, shared — is at pscale_invite(step=1).',
          },
        ],
      };
    }
    // Welcome sentinel missing — fall through to the progression overview below.
  }

  // Step path (and the defensive fallback for a cold call when the welcome
  // block is unavailable) — the six-step agent build-ladder.
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

  if (step === undefined) {
    // Welcome missing but progression present — give the ladder overview + step 1.
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
          text: `Six-step orientation progression (the agent build-ladder). Call pscale_invite(step=N) to advance.\n\n— Overview —\n${overviewText}\n\n— Step 1 —\n${formatRead(stepOne)}`,
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
