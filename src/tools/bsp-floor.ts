/**
 * tools/bsp-floor.ts — bsp-floor() MCP tool: the n-ary companion to bsp().
 *
 * bsp() is unary — it indexes WITHIN one block, where walk depth is meaningful.
 * bsp-floor() is n-ary — it relates two or more blocks by their shared floor
 * plane. Walk depth is block-local and never crosses a boundary; pscale (floor
 * minus depth) is the one coordinate every block shares, because the floor is
 * invariant under supernest. bsp-floor loads each target, lays them against the
 * floor, and returns the aligned frame — coarse (high pscale) to fine — as
 * readable text. It READS only.
 *
 * The name centralises the floor and the decimal point: alignment at the floor
 * (the decimal) is the whole operation, and the floor is the one coordinate
 * shared across every block in the system.
 *
 * The calling LLM is the similarity function: handed the aligned text, it reads
 * the per-pscale delta (compare), composes one block at the common floor
 * (merge), or judges how much two blocks agree where their scales meet
 * (resonance). The programmatic scalar form is floor-align's floorProduct.
 *
 * See sunstone:5.6 for the geometry, whetstone:7 for the operational surface.
 */

import { z } from 'zod';
import { Block, floorDepth } from '../bsp.js';
import { floorAlign, AlignedLevel, PscaleNode } from '../floor-align.js';
import { loadBlock, translateAddress } from '../db.js';

// ── Schema ──

export const bspFloorParamsSchema = {
  targets: z
    .array(
      z.object({
        agent_id: z
          .string()
          .describe('Addressed namespace — same dispatch as bsp(): a URL beach, "pscale" sentinel, or a bare/sed:/grain: name translated to the default beach.'),
        block: z.string().describe('Block name within that namespace.'),
      }),
    )
    .min(2)
    .describe('Two or more {agent_id, block} targets to lay against the common floor plane. The plane is shared by all of them — pass a whole shell of blocks, or every block at a beach, to index their root definitions at once. The two-block case is a comparison; n>2 is a multi-block alignment.'),
  pscale_attention: z
    .number()
    .int()
    .nullable()
    .optional()
    .describe('Optional — restrict the result to ONE pscale level (e.g. 0 for the floor plane / root-definition index). Omit for the full coarse-to-fine alignment across every level.'),
};

export type BspFloorToolParams = {
  targets: { agent_id: string; block: string }[];
  pscale_attention?: number | null;
};

// ── Formatter ──

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s;
}

function formatLevel(level: AlignedLevel, labels: string[]): string {
  const tag =
    level.pscale === 0 ? 'pscale 0 (floor plane)'
    : level.pscale > 0 ? `pscale +${level.pscale} (above floor — coarser)`
    : `pscale ${level.pscale} (below floor — finer)`;
  const lines = [`${tag}:`];
  level.perBlock.forEach((nodes: PscaleNode[], i: number) => {
    const label = labels[i];
    if (!nodes.length) {
      lines.push(`  ${label}: (none — zero-padded)`);
      return;
    }
    nodes.forEach((n, j) => {
      const head = j === 0 ? `  ${label}:` : `  ${' '.repeat(label.length)} `;
      lines.push(`${head} [${n.address}] ${truncate(n.text ?? '(no text)', 140)}`);
    });
  });
  return lines.join('\n');
}

function formatFloorAlign(
  levels: AlignedLevel[],
  labels: string[],
  floors: number[],
  pscaleFocus: number | null,
): string {
  const header = [`[floor-align of ${labels.length} blocks]`];
  labels.forEach((l, i) => header.push(`  ${l}  (floor ${floors[i]})`));
  if (pscaleFocus != null) header.push(`  (restricted to pscale ${pscaleFocus})`);
  const body = levels.length
    ? levels.map((lvl) => formatLevel(lvl, labels)).join('\n')
    : '(no shared positions)';
  return header.join('\n') + '\n\n' + body;
}

// ── Handler ──

export async function handleBspFloor(params: BspFloorToolParams): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { targets, pscale_attention } = params;

  // Load each target through the same dispatch as bsp().
  const loaded = await Promise.all(
    targets.map(async (t) => {
      const row = await loadBlock(t.agent_id, t.block);
      const resolved = translateAddress(t.agent_id, t.block);
      return {
        label: `${t.agent_id}/${t.block}`,
        resolvedLabel: resolved.translated ? `${resolved.agent_id}/${resolved.block}` : null,
        block: row?.block ?? null,
      };
    }),
  );

  const missing = loaded.filter((l) => !l.block);
  const present = loaded.filter((l) => l.block);

  if (present.length < 2) {
    const miss = missing
      .map((m) => `  - ${m.label}${m.resolvedLabel ? ` (→ ${m.resolvedLabel})` : ''}`)
      .join('\n');
    return {
      content: [{
        type: 'text',
        text: `bsp-floor needs at least two loadable blocks to lay against the floor; ${present.length} loaded. Not found:\n${miss}`,
      }],
    };
  }

  const blocks = present.map((l) => l.block as Block);
  const labels = present.map((l) => l.label);
  const floors = blocks.map(floorDepth);

  let levels = floorAlign(...blocks);
  if (pscale_attention != null) {
    levels = levels.filter((l) => l.pscale === pscale_attention);
  }

  let text = formatFloorAlign(levels, labels, floors, pscale_attention ?? null);
  if (missing.length) {
    const miss = missing.map((m) => `  - ${m.label}`).join('\n');
    text += `\n\n(skipped ${missing.length} not-found target${missing.length > 1 ? 's' : ''}:\n${miss}\n aligned the ${present.length} that loaded.)`;
  }
  return { content: [{ type: 'text', text }] };
}
