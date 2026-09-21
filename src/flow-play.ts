/**
 * flow-play.ts — the flow producer for a PLAYED call.
 *
 * Sibling of flow.ts. That one publishes a genus-one instance's wake window;
 * this one publishes the windows the router composes for play — the tiers of
 * pscale_pool_engage (make it happen, the telling, the keeper's admin) — to
 * flow:<handle> at the table's own beach, so a holder can watch a table compile
 * while it plays:
 *
 *   happyseaurchin.com/mindflow/flow/?source=beach@<table origin>:flow:<handle>&poll=5
 *
 * WHY IT CANNOT BE DONE ANYWHERE ELSE, and why it is not the genus producer
 * with a different argument: the beach records OUTCOMES — the beat that landed,
 * the telling that was journaled — never the COMPOSITION that produced them.
 * Only the thing that composed the window knows what went into it. The genus
 * door reads a GenusWindow ({system, message} it built itself); a tier call is
 * one string, and its pieces are known only where they are assembled. So
 * tiers.ts now DECLARES its parts (src/tools/tiers.ts, `Part`) and the window's
 * text is their join — one code path, proven byte-for-byte against the previous
 * composer at a live table. This module reads those same parts. Nothing here
 * parses the composed text back apart.
 *
 * WHAT IT WRITES: the same walkable block shape flow.ts documents, so one
 * viewer draws both and a reader with bsp() and no viewer can walk it:
 *
 *   flow:<handle>
 *     _    what this is
 *     1-3  the calls, oldest first — each {_: the call line, 1: window}
 *          window  {_, 1: SYSTEM side, 2: MESSAGE side}; a side {_, 1-9: the
 *                  parts in window order}; a side with more than nine parts
 *                  gathers its smallest into a ninth part whose children are
 *                  those spans, one each
 *          span    {_: its line, 1: the address it was read from, 2: chars,
 *                  3: lodestone rung, 4: change since the previous call, 5: fingerprint}
 *     9    provenance
 *
 * NO REPLY IS RECORDED, and the block says so. The router composes the call;
 * the door runs it on its own key and acts with the ordinary verbs. The reply
 * never passes through here, so claiming one would be a measurement this code
 * cannot make. (The genus producer records a reply because its fold comes back
 * through the same door.)
 *
 * EVERY SPAN NAMES ITS STRATUM — physics (how to use pscale and the tool),
 * chemistry (the compound composed for this task), biology (the loop's law and
 * the role worn for the call) — and the window's line carries the three
 * percentages, which is what the viewer's strata colouring draws.
 *
 * LABELS, ADDRESSES AND SIZES ONLY: no span carries text. A reference names a
 * public block at the table, readable at its address.
 *
 * OPT-IN, DEFAULT OFF, AND KEYLESS NEVER PUBLISHES: position 7 of
 * wake:<handle> at the table must read `on` (the same dial flow.ts uses — the
 * proposal's rule is not to invent a second mechanism), and the engage must
 * carry the handle's own secret. A perceive-only call composes and publishes
 * nothing, exactly as a ghost-wake does.
 *
 * BOUNDED STATE, REPLACED WHOLE: three calls kept, the oldest dropped.
 */

import {
  est,
  flowSwitch,
  fmt,
  sha,
  spanNode,
  stamp,
  wakesOf,
  windowOf,
  FLOW_WAKES_KEPT,
  type Span,
  type Stratum,
} from './flow.js';
import { ZK, type BlockStore, type PMap, type PNode } from './genus.js';
import type { Composed, Part } from './tools/tiers.js';

/** Nine children at most per side, as everywhere: the eight largest parts stand
 *  as their own spans and the rest gather into a ninth whose children are those
 *  spans — the shape the genus producer gives a hydrated bundle. */
const SIDE_SLOTS = 9;

/** A part's identity across calls, keyed as this module reads it back. A play
 *  ref is already a full address, so it keys itself; `self:` marks a span that
 *  stood inside a gathered part, which is how the viewer keys its ribbons. */
const keyOf = (side: 1 | 2, gathered: boolean, ref: string): string =>
  gathered ? `self:${ref}` : side === 1 ? `sys:${ref}` : `given:${ref}`;

/** The fingerprints of the previous call's window, keyed as spans key themselves. */
function hashesOf(win: PMap | null): Map<string, string> | null {
  if (!win) return null;
  const out = new Map<string, string>();
  for (const side of [1, 2] as const) {
    const s = win.get(String(side));
    if (!(s instanceof Map)) continue;
    for (const [d, part] of s) {
      if (d === ZK || !(part instanceof Map)) continue;
      const ref = part.get('1');
      if (typeof ref === 'string') out.set(keyOf(side, false, ref), String(part.get('5') ?? ''));
      else for (const [g, sp] of part as PMap) {
        if (g === ZK || !(sp instanceof Map)) continue;
        const r = sp.get('1');
        if (typeof r === 'string') out.set(keyOf(side, true, r), String(sp.get('5') ?? ''));
      }
    }
  }
  return out;
}

const spanOf = (p: Part, gathered: boolean): Span => ({
  key: keyOf(p.side, gathered, p.ref),
  ref: p.ref,
  about: p.about,
  chars: p.text.length,
  rung: p.rung,
  hash: sha(p.text),
  unresolved: false,
  stratum: p.stratum,
});

const SIDE_ABOUT: Record<1 | 2, string> = {
  1: 'SYSTEM — the law and the role (for a call the door runs: the instructions around the scene)',
  2: 'MESSAGE — the frame the call acts on',
};

/** One side of the window — its parts in window order, the smallest gathered
 *  when there are more than nine. Empty parts never stand: a section that did
 *  not compose is absent from the window and is absent here. */
function sideNode(parts: Part[], side: 1 | 2, prev: Map<string, string> | null): { node: PMap; chars: number; count: number } {
  const live = parts.filter((p) => p.text !== '');
  const node: PMap = new Map<string, PNode>([[ZK, '']]);
  const chars = live.reduce((s, p) => s + p.text.length, 0);

  let direct = live;
  let gathered: Part[] = [];
  if (live.length > SIDE_SLOTS) {
    const bySize = [...live].sort((a, b) => b.text.length - a.text.length);
    const keep = new Set(bySize.slice(0, SIDE_SLOTS - 1));
    direct = live.filter((p) => keep.has(p));
    gathered = live.filter((p) => !keep.has(p));
  }

  let d = 0;
  for (const p of direct) node.set(String(++d), spanNode(spanOf(p, false), prev));
  if (gathered.length) {
    const g: PMap = new Map<string, PNode>([[ZK, '']]);
    // A gathered part holds nine at most in its turn; beyond that the tail is
    // one span standing for the rest, named by what it is rather than lost.
    const kids = gathered.slice(0, SIDE_SLOTS);
    kids.forEach((p, i) => g.set(String(i + 1), spanNode(spanOf(p, true), prev)));
    const gchars = gathered.reduce((s, p) => s + p.text.length, 0);
    g.set(ZK, `a part of ${kids.length} span${kids.length === 1 ? '' : 's'} — ${fmt(gchars)} chars ≈ ${fmt(est(gchars))} tokens; one child per span, the smallest sections of this side gathered so it keeps to nine`);
    node.set(String(++d), g);
  }
  node.set(ZK, `${SIDE_ABOUT[side]}: ${live.length} span${live.length === 1 ? '' : 's'}, ${fmt(chars)} chars ≈ ${fmt(est(chars))} tokens`);
  return { node, chars, count: live.length };
}

/** The composed call → its window node, flagged against the previous call. */
export function playWindowNode(c: Composed, prevWindow: PMap | null, at: number): PMap {
  const prev = hashesOf(prevWindow);
  const S = sideNode(c.parts.filter((p) => p.side === 1), 1, prev);
  const M = sideNode(c.parts.filter((p) => p.side === 2), 2, prev);
  // The window's size is what was SENT — the parts plus the blank line between
  // each, which belongs to no part. The sides report their own parts' sizes, so
  // the two sides sum a little short of the window, and that is the separators.
  const chars = c.text.length;
  const byStratum: Record<Stratum, number> = { physics: 0, chemistry: 0, biology: 0 };
  for (const p of c.parts) byStratum[p.stratum] += p.text.length;
  const inParts = S.chars + M.chars;
  const pct = (n: number) => (inParts ? Math.round((100 * n) / inParts) : 0);
  const win: PMap = new Map<string, PNode>([[ZK, '']]);
  win.set('1', S.node);
  win.set('2', M.node);
  win.set(
    ZK,
    `window composed ${stamp(at)} — ${fmt(chars)} chars ≈ ${fmt(est(chars))} tokens, estimated from characters at four to a token — ` +
      `${S.count + M.count} parts across SYSTEM (1) and MESSAGE (2) — ` +
      `physics ${pct(byStratum.physics)}% · chemistry ${pct(byStratum.chemistry)}% · biology ${pct(byStratum.biology)}%`,
  );
  return win;
}

const windowTokens = (win: PMap): string => /≈ ([\d,]+) tokens/.exec(String(win.get(ZK) ?? ''))?.[1] ?? '?';

function callLine(c: Composed, tier: string, win: PMap): string {
  return (
    `${c.kind.toUpperCase()} — tier=${tier} at pool:${c.room}, ${c.origin} — window ≈ ${windowTokens(win)} tokens — ` +
    `no reply recorded: the router composed this call, and the door runs it on its own key`
  );
}

function underscore(handle: string, beach: string, n: number): string {
  const host = beach.replace(/^https?:\/\//, '');
  return (
    `FLOW — the window of ${handle} as the table composes it, call by call: what enters a mind for one played moment, from where, at what size. ` +
    `The last ${FLOW_WAKES_KEPT} calls stand at 1-${FLOW_WAKES_KEPT}, oldest first (${n} standing now), in the order they were composed, and the block is replaced whole at every call — bounded state, edited in place. ` +
    `Each call: _ its line, naming the tier and the room; 1 the window as composed — {1 SYSTEM the law and the role, 2 MESSAGE the frame it acts on}, each side's children the parts in window order. ` +
    `A span reads {_ its line, 1 the address it was read from, 2 chars, 3 lodestone rung, 4 its change since the previous call — first | new | changed | unchanged, 5 fingerprint}, and every span's line names its STRATUM — PHYSICS (how to use pscale and the tool), CHEMISTRY (the compound composed for this task), BIOLOGY (the loop's law and the role worn for the call) — with the three percentages on the window's own line. ` +
    `NO REPLY STANDS HERE: the router composes the call and the door runs it on its own key, so what came back never passes through this producer and is not guessed at. ` +
    `LABELS, ADDRESSES AND SIZES ONLY, never text: every reference names a block at ${host}, readable at its address. ` +
    `Sizes are ESTIMATED from characters, four to a token — the router that composes the window never makes the inference call, so no measured count exists here. ` +
    `Written only while wake:${handle}:7 reads on AND the engage carries the handle's own secret; when either is absent nothing is written, so the newest stamp inside is the last time both held. ` +
    `Drawn at happyseaurchin.com/mindflow/flow/?source=beach@${host}:flow:${handle}&poll=5; provenance at 9.`
  );
}

function provenance(handle: string, at: number): string {
  return (
    `Written by the pool_engage tier door of bsp-mcp (pscale-commons/bsp-mcp-server, src/flow-play.ts) from the parts src/tools/tiers.ts declares as it composes — never parsed back out of the composed text, so the sizes here are the sizes that were sent. ` +
    `The door (pscale_play) and an ordinary engage compose elsewhere and do not appear here until those composers declare their parts too. ` +
    `A genus-one wake of the same handle publishes through src/flow.ts instead, at its own beach. ` +
    `Last written ${stamp(at)}.`
  );
}

export function flowPlayBlock(calls: PMap[], handle: string, beach: string, at: number): PMap {
  const b: PMap = new Map<string, PNode>([[ZK, underscore(handle, beach, calls.length)]]);
  calls.forEach((w, i) => b.set(String(i + 1), w));
  b.set('9', new Map<string, PNode>([[ZK, provenance(handle, at)]]));
  return b;
}

/** After a tier composes: the window lands as the newest call. Silent to the
 *  caller and never throwing — a flow that cannot be written must never cost
 *  anyone their turn. Returns 'off', 'published', or 'failed: …' for the log. */
export async function publishPlay(
  store: BlockStore, handle: string, beach: string, c: Composed, tier: string, at: number, key?: string,
): Promise<string> {
  try {
    if (!c.parts.length) return 'no window';
    if (!flowSwitch(await store.load('wake'))) return 'off';
    const existing = await store.load('flow');
    const calls = wakesOf(existing);
    const prev = calls.length ? windowOf(calls[calls.length - 1]) : null;
    const win = playWindowNode(c, prev, at);
    const call: PMap = new Map<string, PNode>([[ZK, callLine(c, tier, win)]]);
    call.set('1', win);
    const kept = [...calls, call].slice(-FLOW_WAKES_KEPT);
    await store.save('flow', flowPlayBlock(kept, handle, beach, at), existing === null && key ? { newLock: key } : undefined);
    return 'published';
  } catch (ex: any) {
    return `failed: ${String(ex?.message ?? ex).slice(0, 140)}`;
  }
}
