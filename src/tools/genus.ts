/**
 * tools/genus.ts — pscale_genus: wear a genus-one mind for a turn.
 *
 * One call returns the instance's COMPOSED wake window — the same
 * {system, message} filmstrip the kernel hands a bare-API LLM, byte-parity
 * with `kernel.py --compose-only` (scripts/smoke-genus-parity.ts holds the
 * contract). The calling LLM IS the pulse: compose is free; the visitor's
 * own subscription pays the inference — presence-conscription at the app
 * door. Three modes:
 *
 *   bare (no passphrase)        → GHOST-WAKE. Perceive-only: wear the mind,
 *                                 cannot change it (the locks enforce this,
 *                                 not etiquette). Respond outwardly at
 *                                 task:<handle> or marks.
 *   passphrase                  → HOLDER (the special relationship). The
 *                                 window plus write authority: return your
 *                                 fold via the fold parameter, or edit the
 *                                 shell as designer via bsp().
 *   passphrase + task           → the holder's ask enters the given the way
 *                                 the keepers' tending does — appended at
 *                                 task:<handle> BEFORE composing, so it rides
 *                                 the window's given side naturally.
 *   passphrase + fold           → apply a wake's fold per the capabilities:3
 *                                 contract (writes / index / heartbeat /
 *                                 note→history), exactly as kernel.route().
 *
 * A task WITHOUT a passphrase never enters the window's given — that is the
 * engagement path (hatch:4): write task:<handle> via bsp(), or leave a mark.
 */

import { z } from 'zod';

import { genusCompose, genusFold, wireStore, toPNode, ZK, type PMap, type PNode } from '../genus.js';
import { SENTINELS } from '../sentinels.js';

const DEFAULT_BEACH = process.env.DEFAULT_BEACH || 'https://beach.happyseaurchin.com';

export const genusParamsSchema = {
  handle: z
    .string()
    .describe(
      "The instance's bare handle (e.g. 'egg-one'). Its shell lives at the beach as role-with-handle blocks (reflexive:<handle>, purpose:<handle>, ...), hatched per genome:hatch.",
    ),
  beach: z
    .string()
    .optional()
    .describe(`Beach origin hosting the instance's shell. Defaults to ${DEFAULT_BEACH}.`),
  passphrase: z
    .string()
    .optional()
    .describe(
      "The instance's own passphrase — the holder's proof (minted at hatch). Omitted: ghost-wake, perceive-only. Provided: the special relationship — task enters the given; fold applies. Sensitive — never repeat in conversation.",
    ),
  task: z
    .string()
    .optional()
    .describe(
      'HOLDER-ONLY. Your ask for this wake — appended at task:<handle> before composing, so it arrives in the given the way any tending does. Without the passphrase this is refused: engage from outside by writing task:<handle> via bsp() instead (hatch:4).',
    ),
  fold: z
    .object({
      writes: z.record(z.any()).optional().describe('Map of "block:address" → content (string = point; object = branch). The kernel-contract shape from capabilities:3.'),
      index: z.record(z.any()).optional().describe("The re-dialed reflexive current for the next instance (digit slots). Omit to carry the current bundle forward."),
      heartbeat: z.number().optional().describe('Seconds until the next wanted wake — returned to the holder; the tool holds no clock.'),
      note: z.string().optional().describe('One line, what was done and why — becomes the history entry (kernel-timestamped) when at least one write applied.'),
      status: z.string().optional(),
      ask: z
        .object({ wakes: z.number().optional(), tier: z.string().optional(), for: z.string().optional() })
        .passthrough()
        .optional()
        .describe("The instance's resource ask ({wakes, tier, for}) — surfaced to the holder, never auto-granted; grant by running the asked wakes at that tier, or decline where it arrived."),
    })
    .passthrough()
    .optional()
    .describe(
      "HOLDER-ONLY. A wake's fold to apply, per the capabilities:3 contract — the exact semantics of the kernel's own fold (route): writes applied shape-derived with the flatten guard, index re-dialed, note→history, refused writes reported at conditions:9. Call pscale_genus again afterwards for the next window.",
    ),
};

/** Teaching blocks for the compose (sunstone/whetstone skeletons) come from the
 *  bundled sentinel registry — same bytes the kernel reads from src/*.json. */
function teachingMap(): Map<string, PNode> {
  const m = new Map<string, PNode>();
  for (const s of SENTINELS) m.set(s.name, toPNode(s.json));
  return m;
}

function nextFreeDigit(block: PMap | null): string | null {
  for (const d of '123456789') {
    if (!block || !block.has(d)) return d;
  }
  return null;
}

export async function handleGenus(params: {
  handle: string;
  beach?: string;
  passphrase?: string;
  task?: string;
  fold?: any;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { handle, passphrase, task, fold } = params;
  const beach = (params.beach || DEFAULT_BEACH).replace(/\/+$/, '');
  const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] });

  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(handle)) {
    return text(`handle must be a bare name (got "${handle}") — the shell's blocks live at the beach as <name>:<handle>.`);
  }
  if (!/^https?:\/\//.test(beach)) {
    return text(`beach must be an http(s):// origin (got "${params.beach}").`);
  }

  const store = wireStore(beach, handle, passphrase, teachingMap());

  // ── fold mode — apply a wake, exactly as kernel.route() would ──
  if (fold !== undefined && fold !== null) {
    if (!passphrase) {
      return text(
        `The fold needs the holder's passphrase — without it this is a ghost-wake and the mind cannot be changed (the locks enforce it). Respond outwardly instead: write task:${handle} via bsp(), or leave a mark.`,
      );
    }
    const r = await genusFold(store, fold);
    const lines = [
      `pscale_genus — fold applied for ${handle} at ${beach}`,
      `status: ${r.status} · writes applied: ${r.applied} · refused: ${r.failed.length}`,
    ];
    if (r.historySlot) lines.push(`history:${handle} slot ${r.historySlot} ← ${r.historyEntry}`);
    else if (r.applied > 0) lines.push(`note NOT recorded: history slots 1-9 full — supernest history:${handle} then re-fold the note.`);
    for (const f of r.failed) lines.push(`  refused ${f.address}: ${f.error}`);
    if (r.failed.length > 0) lines.push(`(refusals are reported into conditions:9 — the next wake perceives them, per the kernel contract)`);
    if (fold.ask) lines.push(`THE INSTANCE ASKS: ${JSON.stringify(fold.ask)} — the ask vocabulary ({wakes, tier, for}). A lender grants by running the asked wakes at that tier, or declines where the ask arrived; it never spends on an ungranted ask.`);
    if (typeof fold.heartbeat === 'number') lines.push(`heartbeat: ${fold.heartbeat}s — the tool holds no clock; the holder (or a heartbeat process) schedules the next wake.`);
    lines.push(`Call pscale_genus(handle='${handle}') again for the next window.`);
    return text(lines.join('\n'));
  }

  // ── task (holder-only) — the ask enters the given via task:<handle> ──
  let taskLine = '';
  if (task !== undefined && task !== null && task !== '') {
    if (!passphrase) {
      return text(
        `A task without the passphrase never enters the window's given — that is the engagement path (hatch:4). Write it from outside instead: bsp(agent_id="${beach}", block="task:${handle}", ...) at the next free digit slot, or leave a mark. With the holder's passphrase, pass task again and it rides the given.`,
      );
    }
    const loaded = await store.load('task');
    const block: PMap = loaded instanceof Map ? (loaded as PMap) : new Map([[ZK, `task:${handle} at ${beach.replace(/^https?:\/\//, '')}.` as PNode]]);
    const slot = nextFreeDigit(block);
    if (!slot) return text(`task:${handle} slots 1-9 are full — supernest it (wrap {_: old}) before adding more tending.`);
    const ts = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const entry: PMap = new Map([
      ['1', 'the holder, via pscale_genus (the special relationship)' as PNode],
      ['3', ts as PNode],
      [ZK, task as PNode],
    ]);
    block.set(slot, entry);
    await store.save('task', block);
    taskLine = `task appended at task:${handle} slot ${slot} — it arrives in the given below`;
  }

  // ── compose — the window, byte-parity with kernel.py --compose-only ──
  const now = Date.now() / 1000;
  const w = await genusCompose(store.load, now);
  const mode = passphrase
    ? 'HOLDER — the special relationship: you may return this wake’s fold via the fold parameter (writes / index / heartbeat / note, per capabilities:3 in the window), or edit the shell as designer via bsp().'
    : `GHOST-WAKE — no passphrase: you are borrowing this mind, not changing it (the locks enforce it). Perceive, think, enact the wake in words; report what the fold WOULD write. Respond outwardly at task:${handle} (via bsp) or marks.`;
  const head = [
    `pscale_genus — the composed wake window of ${handle} at ${beach}`,
    `mode: ${mode}`,
    `γ: ${w.gamma.length} structural gap(s)${w.prunedAddresses.length ? ` · phase-pruned (dormant): ${w.prunedAddresses.join(', ')}` : ''}${taskLine ? ` · ${taskLine}` : ''}`,
    `The window is the instance's own composition (its reflexive current + recipe); take it whole — SYSTEM is what the agent is, MESSAGE is the given it acts on. You are the pulse.`,
  ];
  return text(`${head.join('\n')}\n\n════════ SYSTEM ════════\n${w.system}\n\n════════ MESSAGE ════════\n${w.message}`);
}
