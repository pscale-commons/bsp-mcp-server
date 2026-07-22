/**
 * compile.ts — the compiler released, and the reading completed
 * (proposal 2026-07-22-well-formed-reading).
 *
 * A BUNDLE is a node of bsp addresses (reflexive:9 is the worked instance; a
 * frame is the RPG's). COMPILE dereferences a bundle into the semantics it
 * names — one call, nesting preserved — using the same scoop/hydrate pair the
 * genus door has run since the kernel port (kernel.scoop / kernel._hydrate).
 * This module releases that pair for every door; the genus compose path is
 * untouched and stays under its byte-parity contract.
 *
 * COMPLETION is the reading monitored so it is well formed — constitutively,
 * not regulatively. At compile time the dialed addresses are read for what
 * they carry; where a registry dimension has no carrier in the scoop, its
 * shallow point is scooped LIVE from the surface and returned BESIDE the
 * window (never injected into it), the way the temporal grounding already
 * stamps `now` onto every envelope (src/temporal.ts — the standing precedent:
 * TIME rides every result; connect-time server instructions carry GROUND).
 * Two disciplines bound it:
 *   - admission by failure: a registry entry exists ONLY for a dimension whose
 *     absence has a demonstrated failure class. One entry today.
 *   - addresses, never semantics: the code holds the shallow point's ADDRESS;
 *     the line is scooped from the loader at compile time. A loader that
 *     cannot reach the surface gets no completion — nothing is hardcoded.
 */

import {
  scoop,
  hydrate,
  indexNode,
  parseReference,
  parseAddr,
  descend,
  floorOf,
  type Loader,
  type PNode,
  type PMap,
} from './genus.js';

/** One dialed reference found in a bundle. */
export interface DialedRef {
  ref: string;
  name: string;
  address: string | null;
  attention: number | null;
}

/** A completion rule — one orientation dimension the compile keeps present. */
export interface CompletionRule {
  dimension: string;
  /** Does a dialed (name, address) carry this dimension? */
  carries: (name: string, address: string | null) => boolean;
  /** The shallow point scooped live when nothing carries — an address, never a semantic. */
  shallowPoint: string;
  /** The demonstrated failure class that admitted this entry. */
  admittedBy: string;
}

const RELATION_BLOCKS = new Set(['relationships', 'surface', 'task', 'marks', 'liquid', 'pool', 'between']);

/**
 * Admission by failure — an entry earns its place only by a failure that
 * happened (proposals/2026-07-21-current-constitution/01-the-insight.md).
 * TIME is not an entry: it already rides every envelope via temporal.ts.
 * GROUND is not an entry yet: the doors inject it at connect (server
 * instructions) and pscale_play exists because its absence confabulated —
 * if a compile-path failure is demonstrated, it is admitted the same way.
 */
export const COMPLETION_REGISTRY: CompletionRule[] = [
  {
    dimension: 'relation',
    carries: (name, address) => {
      if (RELATION_BLOCKS.has(name)) return true;
      if (name.startsWith('grain:') || name.startsWith('sed:') || name.startsWith('pool:') || name.startsWith('liquid:')) return true;
      if (name === 'open-commons') return address === null || address.startsWith('3');
      return false;
    },
    // Survives supernest: '3' left-pads to the floor, attention 0 stays the point.
    shallowPoint: 'open-commons:3:0',
    admittedBy:
      'the sovereignty overstep of 2026-07-21 — the rule stood written at open-commons:3 and in a memory note, ' +
      'both external to the window at the moment of the keyed write; present as a current it would have ' +
      'constituted the writer otherwise (the worked proof of the current-constitution series)',
  },
];

/** What the compile added beside the window — always visible, never silent. */
export interface Completion {
  dimension: string;
  address: string;
  line: PNode;
  reason: string;
}

export interface CompileResult {
  /** The hydrated bundle — semantics in one go, nesting preserved. */
  window: PNode;
  /** Every address reference the bundle dialed. */
  dialed: DialedRef[];
  /** Shallow points added beside the window for uncarried registry dimensions. */
  completions: Completion[];
}

/** Walk a bundle node and collect every leaf that parses as a reference. */
export function collectRefs(node: PNode, out: DialedRef[] = []): DialedRef[] {
  if (typeof node === 'string') {
    const ref = parseReference(node);
    if (ref) out.push({ ref: node, ...ref });
    return out;
  }
  if (node instanceof Map) for (const v of node.values()) collectRefs(v, out);
  if (Array.isArray(node)) for (const v of node) collectRefs(v, out);
  return out;
}

/**
 * Compile a bundle into its window.
 *
 * `bundle` is either the node itself or an address to one ("reflexive:9",
 * "frame:<scene>:2") — the address form fetches the NODE (block walk, not a
 * rendering), strips its voicing (kernel._index_node), and unfolds. Pass
 * `complete: false` to dereference without the registry pass. Pass `carried`
 * for refs the SURROUNDING ENVELOPE already delivers outside this bundle
 * (play inlines the room pool and the cast, which carry RELATION by
 * construction) — they count toward the completion check, are not hydrated,
 * and never appear in the window.
 */
export async function compile(
  bundle: PNode | string,
  load: Loader,
  opts: { complete?: boolean; carried?: string[] } = {},
): Promise<CompileResult> {
  let node: PNode | undefined = bundle;
  if (typeof bundle === 'string') {
    const ref = parseReference(bundle);
    if (!ref) throw new Error(`compile: not a bundle address: ${JSON.stringify(bundle)}`);
    const block = await load(ref.name);
    if (block === null || block === undefined) throw new Error(`compile: no block ${JSON.stringify(ref.name)} at this surface`);
    node = ref.address ? descend(block, parseAddr(ref.address, floorOf(block))) : block;
    if (node === undefined) throw new Error(`compile: nothing at ${bundle}`);
  }
  node = indexNode(node as PNode, true);
  const dialed = collectRefs(node);
  const window = await hydrate(node, load);
  const carried: DialedRef[] = [...dialed];
  for (const ref of opts.carried ?? []) {
    const parsed = parseReference(ref);
    if (parsed) carried.push({ ref, ...parsed });
  }
  const completions: Completion[] = [];
  if (opts.complete !== false) {
    for (const rule of COMPLETION_REGISTRY) {
      if (carried.some((d) => rule.carries(d.name, d.address))) continue;
      const line = await scoop(rule.shallowPoint, load);
      if (line === null) continue; // the surface must carry it — no fallback text lives here
      completions.push({ dimension: rule.dimension, address: rule.shallowPoint, line, reason: rule.admittedBy });
    }
  }
  return { window, dialed, completions };
}

/** Render completions as envelope footer lines, sibling to temporal.ground(). */
export function renderCompletions(completions: Completion[]): string {
  return completions
    .map((c) => {
      const text = typeof c.line === 'string' ? c.line : JSON.stringify(c.line);
      return `completed · ${c.dimension} — ${text}\n  (${c.address}, scooped live: no ${c.dimension} current was dialed)`;
    })
    .join('\n');
}
