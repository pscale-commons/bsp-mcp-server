/**
 * compile.ts — the compiler released, and the reading completed
 * (proposals 2026-07-22-well-formed-reading + 2026-07-24-frames-on-the-spine).
 *
 * A BUNDLE is a node of bsp addresses (reflexive:9 is the worked instance; a
 * frame is the RPG's). COMPILE dereferences a bundle into the semantics it
 * names — one call, nesting preserved — using the same scoop/hydrate pair the
 * genus door has run since the kernel port (kernel.scoop / kernel._hydrate).
 * This module releases that pair for every door; the genus compose path is
 * untouched and stays under its byte-parity contract.
 *
 * Two reference grammars (frames-on-the-spine gap 1):
 *   - local:  name[:address[:attention]] — resolved at the door's own surface.
 *   - star:   *:<origin>:<name>:<address>[:<attention>] — the origin-qualified
 *     star-ref the substrate already speaks (the passport location, the
 *     placing at notes:<scene>:3). The address anchors as the final digit run,
 *     so the last ':' splits a colon-bearing name (spatial:urb) from it — the
 *     same split the horizon walk uses. A star-ref ALWAYS carries an address;
 *     attention is the ABSOLUTE pscale of the aperture (a point at the
 *     terminus is floor − walk-length; omit it for the spindle walk).
 *     Star-refs resolve only when the caller supplies
 *     `fetchOrigin` (a per-origin loader factory); without it — or on any
 *     error, or a missing block — the leaf rides through UNRESOLVED as its raw
 *     string, visible in the window, never a silent misroute. Frames degrade;
 *     they never break an entry.
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
  indexNode,
  parseReference,
  parseAddr,
  descend,
  floorOf,
  pyDumps,
  type Loader,
  type PNode,
  type PMap,
} from './genus.js';

/** A per-origin Loader factory — how star-refs reach another beach. The door
 *  supplies it (play builds one over loadBlock with a per-origin cache); an
 *  offline caller injects a fake. Reads only — the same public wire the
 *  horizon walk and any browser already use. */
export type FetchOrigin = (origin: string) => Loader;

/** One dialed reference found in a bundle. `origin` is set for star-refs. */
export interface DialedRef {
  ref: string;
  name: string;
  address: string | null;
  attention: number | null;
  origin?: string;
}

/** Parse the origin-qualified star-ref: *:<origin>:<name>:<addr>[:<att>].
 *  The name may carry colons (spatial:urb); the address anchors as the final
 *  digit run (single-decimal), an optional integer attention after it. */
const STAR_RE = /^\*:(https?:\/\/[^\s:]+):(\S+?):([\d.]+)(?::(-?\d+))?$/;
export function parseStarRef(
  leaf: PNode | undefined,
): { origin: string; name: string; address: string; attention: number | null } | null {
  if (typeof leaf !== 'string') return null;
  const m = STAR_RE.exec(leaf);
  if (!m) return null;
  const [, origin, name, address, att] = m;
  return { origin: origin.replace(/\/+$/, ''), name, address, attention: att === undefined ? null : parseInt(att, 10) };
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
  /** Every address reference the bundle dialed (star-refs carry `origin`). */
  dialed: DialedRef[];
  /** Shallow points added beside the window for uncarried registry dimensions. */
  completions: Completion[];
}

/** Walk a bundle node and collect every leaf that parses as a reference. */
export function collectRefs(node: PNode, out: DialedRef[] = []): DialedRef[] {
  if (typeof node === 'string') {
    const star = parseStarRef(node);
    if (star) out.push({ ref: node, name: star.name, address: star.address, attention: star.attention, origin: star.origin });
    else {
      const ref = parseReference(node);
      if (ref) out.push({ ref: node, ...ref });
    }
    return out;
  }
  if (node instanceof Map) for (const v of node.values()) collectRefs(v, out);
  if (Array.isArray(node)) for (const v of node) collectRefs(v, out);
  return out;
}

/** Hydrate a bundle node: local refs via scoop at the door's surface; star-refs
 *  with the same scoop semantics bound to their origin's loader. A star leaf
 *  that cannot resolve (no factory, fetch error, absent block) rides through
 *  as its raw string — visible, never silently dropped. */
async function hydrateFrame(node: PNode, load: Loader, fetchOrigin?: FetchOrigin): Promise<PNode> {
  if (typeof node === 'string') {
    const star = parseStarRef(node);
    if (star) {
      if (!fetchOrigin) return node;
      try {
        const remote = fetchOrigin(star.origin);
        const local = star.attention === null ? `${star.name}:${star.address}` : `${star.name}:${star.address}:${star.attention}`;
        const scooped = await scoop(local, remote);
        return scooped === null ? node : scooped;
      } catch {
        return node; // frames degrade, never break an entry
      }
    }
    return scoop(node, load);
  }
  if (node instanceof Map) {
    const out: PMap = new Map();
    for (const [k, v] of node) out.set(k, await hydrateFrame(v, load, fetchOrigin));
    return out;
  }
  if (Array.isArray(node)) {
    const out: PNode[] = [];
    for (const v of node) out.push(await hydrateFrame(v, load, fetchOrigin));
    return out;
  }
  return node;
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
 * and never appear in the window. Pass `fetchOrigin` to resolve star-refs
 * cross-beach; without it they ride through unresolved, visibly.
 */
export async function compile(
  bundle: PNode | string,
  load: Loader,
  opts: { complete?: boolean; carried?: string[]; fetchOrigin?: FetchOrigin } = {},
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
  const window = await hydrateFrame(node, load, opts.fetchOrigin);
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

/** Render one hydrated frame value as the FRAMED APERTURE (frames-on-the-spine
 *  gap 2): a spindle arrives as its walk — ancestor underscores riding above,
 *  the terminus beneath — never re-dumped as structure; a point is its line; a
 *  directory or whole block (law-class delivery) renders as ordered JSON. */
export function renderFramedValue(v: PNode): string {
  if (typeof v === 'string') return v;
  if (v === null || v === undefined) return '(absent)';
  if (Array.isArray(v)) {
    return v.map((x) => `- ${typeof x === 'string' ? x : pyDumps(x)}`).join('\n');
  }
  return pyDumps(v);
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
