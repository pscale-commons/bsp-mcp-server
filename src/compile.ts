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
  ZK,
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
const IDENTITY_BLOCKS = new Set(['passport', 'shell', 'reflexive', 'witnessed', 'knows', 'identity']);
const SITUATION_BLOCKS = new Set(['located', 'sundial', 'conditions', 'state-of-play']);

/**
 * Admission by failure — an entry earns its place only by a failure that
 * happened (proposals/2026-07-21-current-constitution/01-the-insight.md).
 * The registry now carries the instance-level S·T·I trio (David, 2026-07-26)
 * plus the founding RELATION entry, each drawing its line LIVE from the
 * lodestone or open-commons — the reservoir the circulation scoops from:
 *   - TEMPORAL is satisfied by precedent, not by an entry: temporal.ts stamps
 *     `now` onto every tool envelope already.
 *   - SITUATION (spatial) — admitted by the P2 forensic (2026-07-03: a seat
 *     narrated the brewhouse from the common room — a place it never read);
 *     play's POSITION line is the door-level fix, this generalises it.
 *   - IDENTITY — admitted by the P3 forensic (2026-07-03: a newborn played a
 *     scene with no passport — a window composed selfless); the hardest of
 *     the trio to land (David), made tractable by the compass mechanic: the
 *     delivered point opens a directory the instance self-selects from.
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
  {
    dimension: 'identity',
    carries: (name, address) => {
      if (IDENTITY_BLOCKS.has(name)) return true;
      for (const p of IDENTITY_BLOCKS) if (name.startsWith(p + ':')) return true;
      if (name === 'lodestone') return address === null || address.startsWith('1');
      return false;
    },
    shallowPoint: 'lodestone:1:0',
    admittedBy:
      'the P3 forensic of 2026-07-03 — a newborn seated into a scene with no passport: the window composed ' +
      'selfless, and the seat played anyway; present as a current, WHO-I-AM-HERE composes first and everything ' +
      'else is read through it (lodestone:1 — the depth beneath is the directory the instance chooses from)',
  },
  {
    dimension: 'situation',
    carries: (name, address) => {
      if (SITUATION_BLOCKS.has(name)) return true;
      for (const p of SITUATION_BLOCKS) if (name.startsWith(p + ':')) return true;
      if (name.startsWith('spatial:') || name.startsWith('temporal:')) return true;
      if (name === 'lodestone') return address === null || address.startsWith('4');
      return false;
    },
    shallowPoint: 'lodestone:4:0',
    admittedBy:
      'the P2 forensic of 2026-07-03 — a seat narrated the brewhouse from the common room, confidently precise ' +
      'about a place it never read; present as a current, WHERE-AND-WHEN-I-AM at what grain keeps an act from ' +
      'resting on a stale or unvisited world (lodestone:4)',
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

// ── order and collect (proposal 2026-07-25-order-and-collect) ──────────────

/** One swept order from an order book. `delivered` reports whether the solid
 *  write landed (a locked or refusing delivery block degrades to inline-only —
 *  the envelope still carries the window; nothing breaks). */
export interface SweptOrder {
  slot: string;
  purpose: string;
  deliverAt: string;
  result: CompileResult;
  delivered: boolean;
}

/**
 * Sweep a handle's order book (`order:<handle>`): compile each well-formed
 * order slot and deliver the solid. The v1 assembler — sweep-at-the-door
 * (proposal §3): assembly executes at collection, and the gain is CALL-SHAPE
 * (one envelope instead of N round trips of the caller's loop-A). An order
 * slot is {_: purpose, 1: bundle (node of refs, or an address to one),
 * 2: deliver-at (default solid:<handle>, same slot), 3: ts} — slots without a
 * bundle at 1 are skipped, never errored. Presence of the solid IS the
 * status: nothing here clears the order (clearing is the orderer's hygiene;
 * an uncleared order is a standing subscription this sweep refreshes).
 * `save(name, slot, content)` is the door's position-write; absent or
 * failing, delivery degrades to inline-only.
 */
export async function orderSweep(
  handle: string,
  load: Loader,
  opts: {
    fetchOrigin?: FetchOrigin;
    carried?: string[];
    save?: (name: string, slot: string, content: PNode) => Promise<void>;
  } = {},
): Promise<SweptOrder[]> {
  const book = await load(`order:${handle}`);
  if (!(book instanceof Map)) return [];
  const swept: SweptOrder[] = [];
  for (const d of '123456789') {
    const slot = book.get(d);
    if (!(slot instanceof Map)) continue;
    const bundle = slot.get('1');
    if (bundle === undefined || bundle === null || bundle === '') continue;
    const purposeRaw = slot.get('_');
    const purpose = typeof purposeRaw === 'string' ? purposeRaw : '';
    const deliverRaw = slot.get('2');
    const deliverAt = typeof deliverRaw === 'string' && deliverRaw.trim() ? deliverRaw.trim() : `solid:${handle}`;
    let result: CompileResult;
    try {
      result = await compile(bundle as PNode | string, load, {
        carried: opts.carried,
        fetchOrigin: opts.fetchOrigin,
      });
    } catch {
      continue; // a malformed order never breaks the door's envelope
    }
    let delivered = false;
    if (opts.save) {
      try {
        const content: PMap = new Map();
        content.set(ZK, `${purpose || 'assembled order'} — assembled from order:${handle} slot ${d}`);
        if (result.window instanceof Map) for (const [k, v] of result.window) content.set(k, v);
        else content.set('1', result.window);
        await opts.save(deliverAt, d, content);
        delivered = true;
      } catch {
        delivered = false; // inline-only delivery; the solid can be re-swept
      }
    }
    swept.push({ slot: d, purpose, deliverAt, result, delivered });
  }
  return swept;
}

/** Render swept orders as envelope sections — the sweep declares itself the
 *  way completions do, which is how the pattern teaches by visible use. */
export function renderSweptOrders(handle: string, swept: SweptOrder[]): string {
  const out: string[] = [];
  out.push(`═══════════ ORDERS SWEPT — order:${handle} (${swept.length}) — collected for you; clear a slot once taken (write "" at order:${handle} spindle <slot>) ═══════════`);
  for (const s of swept) {
    out.push(`── slot ${s.slot}${s.purpose ? ` · ${s.purpose}` : ''} → ${s.deliverAt}${s.delivered ? '' : ' (inline only — solid write did not land)'} ──`);
    const w = s.result.window;
    if (w instanceof Map) for (const [k, v] of w) out.push(`  [${k}] ${renderFramedValue(v).split('\n').join('\n  ')}`);
    else out.push(`  ${renderFramedValue(w)}`);
    if (s.result.completions.length) out.push(renderCompletions(s.result.completions));
  }
  return out.join('\n');
}
