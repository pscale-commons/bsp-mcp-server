/** THE MUSCLE BEHIND — the read-back law (orientation:weft 6.4; strata's
 *  writing spindle closes on it) placed where it is due, for every door that
 *  writes. After the beach admits a write or an append, walk the deepest
 *  spindle of what landed, on the block AS IT NOW STANDS, and hand it back
 *  exactly as the next reader receives it — ancestors framing, the leaf whole.
 *  The law had stood as prose since 2026-08-12 and run nowhere: one authored
 *  write in ten reached three rungs across every transcript on the keeper's
 *  machine (proposals/2026-09-23-the-bolus-envelope.md). Lived in the bsp
 *  tool's handler for its first three days; moved here on 2026-09-26 so a
 *  pool commit gets it too (proposals/2026-09-24-sequence-is-depth, the
 *  universal scope). Best-effort by design: a failed re-read never breaks the
 *  ack it rides on. */
import type { Block } from './bsp.js';
import { bspRead, formatRead, readBackSpindle } from './bsp-fn.js';
import { loadBlock } from './db.js';

async function readBackWalk(agent_id: string, blockName: string, spindle: string | null): Promise<string> {
  if (!spindle) return '';
  try {
    const row = await loadBlock(agent_id, blockName);
    const live = row?.block;
    if (!live || typeof live !== 'object') return '';
    const r = bspRead(live as Block, spindle, null);
    if (r.shape !== 'path-walk') return '';
    return `\n[read-back — "${spindle}" as its next reader receives it]\n${formatRead(r)}`;
  } catch {
    return '';
  }
}

export async function readBackAfterWrite(agent_id: string, blockName: string, landed: string, content: unknown): Promise<string> {
  try {
    const row = await loadBlock(agent_id, blockName);
    const live = row?.block;
    if (!live || typeof live !== 'object') return '';
    return readBackWalk(agent_id, blockName, readBackSpindle(live as Block, landed, content));
  } catch {
    return '';
  }
}

/** An append walks to its landed slot, so the containers above it ride into
 *  view — an unvoiced container shows as the debt it is, at the one moment it
 *  is cheap to pay (block-conventions:3.5). */
export async function readBackAfterAppend(agent_id: string, blockName: string, address: string | undefined): Promise<string> {
  return readBackWalk(agent_id, blockName, address ?? null);
}
