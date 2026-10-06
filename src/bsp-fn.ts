/**
 * bsp-fn.ts — the unified bsp() function (2026-05-17 canonical model).
 *
 * Two coordinates: spindle (S, the address) and pscale_attention (P).
 * Read when content omitted; write when content provided. Selection shape
 * derives from the relationship between S and P.
 *
 * Canonical shape vocabulary (six read shapes plus error):
 *   block             — no S, no P: whole tree
 *   path-walk         — S alone: semantic at each walked position
 *   disc              — P alone: every position at depth (floor - P)
 *   point             — S + P within or above S: single position at depth (floor - P)
 *   path-walk+descent — S + P below the spindle terminus: walk + descent down
 *                       to depth (floor - P), digit children only at each layer
 *   star              — S ends with '*': enter hidden directory at terminus,
 *                       recurse on post-* (S, P) inside as sub-block
 *
 * Pscale anchor (canonical 2026-05-17):
 *   pscale = floor - depth   where depth 0 is root (off-pscale, structural).
 *
 * Disc emission rule:
 *   Emit at target depth iff
 *     (a) the walk's final step is digit 1-9, OR
 *     (b) the entire walk is the root underscore chain AND it lands on a
 *         string at target depth (the floor terminus).
 *   Intermediate root-chain underscore-objects are not separate positions.
 *   Hidden directories (off-chain underscore-objects) emit normally as
 *   digit-walked positions when they sit at target depth.
 *
 * Descent rule:
 *   Iterates digit children 1-9 only. The terminus's underscore-object
 *   (hidden directory) is not in the descent — it is entered separately
 *   via the star operator.
 */

import {
  Block,
  collectUnderscore,
  floorDepth,
  parseAddress,
  parseSpindle as parseSpindleCanonical,
  walk as walkLegacy,
  writeAt,
  InvalidAddressError,
} from './bsp.js';

export { InvalidAddressError } from './bsp.js';

import { renderAddressRelation, parseTemporalLabel } from './temporal.js';

// ── Shape vocabulary (canonical) ──

export type Shape =
  | 'block'
  | 'path-walk'
  | 'disc'
  | 'point'
  | 'path-walk+descent'
  | 'star'
  | 'error';

export interface PathWalkEntry {
  address: string;
  depth: number;
  pscale: number | null;
  content: string | null;
  /** Arrival stamp the entry carries at field 3 (the mark shape's ts),
   *  surfaced so the line renders it and the grounding boundary ages it. */
  stamp?: string;
}

export interface DiscEntry {
  address: string;
  content: string | null;
  stamp?: string;
  /** How many positions stand beneath this one (the ring, less the arrival
   *  stamp) — so a disc says where depth is without listing it. A disc is
   *  the one read shape that ended without a next throw, and keel's first
   *  use of the envelope (2026-09-24) found the gap: it composed the next
   *  addresses by hand and landed in the wrong container. */
  beneath?: number;
}

export interface BspReadResult {
  shape: Shape;
  floor?: number;
  // Per-shape payloads:
  block?: Block;
  entries?: PathWalkEntry[] | DiscEntry[];
  path_walk?: PathWalkEntry[];
  descent?: PathWalkEntry[];
  // point shape:
  spindle?: string | null;
  pscale?: number | null;
  depth?: number;
  address?: string;
  content?: string | null;
  stamp?: string;
  note?: string;
  // disc shape:
  target_depth?: number;
  // star shape:
  semantic?: string | null;
  inner?: BspReadResult | null;
  // error shape:
  error_message?: string;
  /** THE MUSCLE AHEAD — the digit positions standing beneath the terminus of a
   *  path-walk, or beneath the node a point lands on, as full-width addresses a
   *  caller fires verbatim, with the pscale that descends into them. The next
   *  throw, composed by the ack rather than foreseen by the reader: across every
   *  transcript on the keeper's machine one bsp read in four pulled the block
   *  whole to see what was there (proposals/2026-09-23-the-bolus-envelope.md).
   *  Absent at a leaf; one child only names a stub at that rung. */
  beneath?: string[];
  beneath_pscale?: number;
  /** Set when a dot-free spindle shorter than the floor was left-padded into
   *  the root's underscore chain: "13" at floor 3 reads as 013, not the
   *  container of the 130s. Canonical and load-bearing (sunstone:1.41), and
   *  the trap two hands fell into on one day, both after the rule was written
   *  down (keel, pool:keel 25, 2026-09-25) — so the ack says what it did. */
  padding?: string;
  /** THE HEAD OF AN ACCUMULATOR — the newest entry beneath the terminus when
   *  its digit children are containers: the greatest digit at every level
   *  down to the first stamped entry. Named beside the ring, because the zero
   *  slots a root's ring offers are the summaries of the spans BEFORE each
   *  container, and a reader who fires them lands on the oldest voices (keel
   *  was sent to August by one, 2026-10-06). Absent when the children are
   *  entries, not containers. */
  head?: string;
}

export interface BspWriteResult {
  shape: Shape;
  written: boolean;
  block: Block;
  spindle?: string;
  pscale_attention?: number | null;
  warning?: string;
  /** Canonical address of the position the write actually landed at, for
   *  spindle-bearing point/subtree writes. The honest-ack anchor: the two
   *  phantom-write classes (2026-07-08 history:keel:15, 2026-08-25
   *  pool:weft:52) were both an ack naming an address the walker did not
   *  resolve to. Absent for block/disc/star writes. */
  landed?: string;
  /** Set ONLY when the landing depth differs from the spindle terminus (an
   *  explicit pscale above the terminus truncates the walk — whetstone:2.4
   *  "places a string at the addressed depth"). The transport must then save
   *  at THIS address, not the user's spindle: deriving the wire payload at
   *  the full spindle reads undefined, JSON.stringify drops the content key,
   *  and the beach no-ops a content-less POST into a hollow 200. */
  wire_spindle?: string;
  /** Honest-ack note for the two slip classes: pscale truncation, and floor
   *  padding walking the root underscore chain (left-of-decimal pads to
   *  floor width; digit 0 = "_"). Informative, never a refusal — the padded
   *  walk is load-bearing for supernest-stable addressing (sunstone:1.41). */
  landing_note?: string;
}

// ── Spindle parsing ──

interface ParsedSpindle {
  digits: string[];
  hasStar: boolean;
}

export function parseSpindle(spindle: string | null | undefined, floor: number): ParsedSpindle {
  return parseSpindleCanonical(spindle, floor);
}

/**
 * Split a spindle on '*' for star composition. Returns (pre, post, hasStar).
 */
export function splitStar(
  spindle: string | null | undefined,
): { pre: string | null; post: string | null; hasStar: boolean } {
  if (spindle == null) return { pre: null, post: null, hasStar: false };
  const s = String(spindle);
  if (!s.includes('*')) return { pre: s, post: null, hasStar: false };
  const parts = s.split('*');
  if (parts.length !== 2) {
    throw new InvalidAddressError(`"${s}": star operator appears more than once`);
  }
  const [pre, post] = parts;
  return {
    pre: pre.length > 0 ? pre : null,
    post: post.length > 0 ? post : null,
    hasStar: true,
  };
}

// ── Pscale arithmetic (canonical) ──

/**
 * Canonical formula: pscale = floor - depth.
 * Depth 0 is root (structural wrapping, off-pscale) — returns null.
 */
export function pscaleAt(depth: number, floor: number): number | null {
  if (depth === 0) return null;
  return floor - depth;
}

/** Inverse: depth at a given pscale. */
export function depthAt(pscale: number, floor: number): number {
  return floor - pscale;
}

// ── Walking and semantics ──

function walk(block: Block, digits: string[]): any {
  let node: any = block;
  for (const d of digits) {
    const key = d === '0' ? '_' : d;
    if (!node || typeof node !== 'object' || !(key in node)) return null;
    node = node[key];
  }
  return node;
}

function semantic(node: any): string | null {
  if (typeof node === 'string') return node;
  // Numeric and boolean leaves are legal wire values (e.g. evaluation scores
  // at passport 6.2) — render their JSON form. Only null/absent stays null.
  if (typeof node === 'number' || typeof node === 'boolean') return JSON.stringify(node);
  if (node && typeof node === 'object') return collectUnderscore(node);
  return null;
}

// ── Read ──

export function bspRead(
  block: Block,
  spindle: string | null | undefined,
  pscaleAttention: number | null | undefined,
): BspReadResult {
  const floor = floorDepth(block);

  // Star handling — walk pre-* to terminus, enter hidden directory at
  // terminus._, recurse on (post-*, pscale) inside.
  const { pre, post, hasStar } = splitStar(spindle);
  if (hasStar) {
    const preDigits = pre ? parseSpindleCanonical(pre, floor).digits : [];
    const terminus = walk(block, preDigits);
    let sem: string | null = null;
    let inner: BspReadResult | null = null;
    if (terminus && typeof terminus === 'object') {
      sem = collectUnderscore(terminus);
      const hidden = terminus._;
      if (hidden && typeof hidden === 'object') {
        inner = bspRead(hidden as Block, post, pscaleAttention ?? null);
      }
    } else if (typeof terminus === 'string') {
      sem = terminus;
    }
    return {
      shape: 'star',
      floor,
      spindle: typeof spindle === 'string' ? spindle : null,
      semantic: sem,
      inner,
    };
  }

  const { digits } = parseSpindleCanonical(spindle ?? null, floor);
  const padding = typeof spindle === 'string' && /^[1-9][0-9]*$/.test(spindle) && spindle.length < floor
    ? `"${spindle}" is shorter than the floor (${floor}) and was read as ${spindle.padStart(floor, '0')}, down the root's underscore chain — the container of the ${spindle}0s is ${spindle.padEnd(floor, '0')}`
    : undefined;

  // Case 1: nothing → whole block.
  if (digits.length === 0 && (pscaleAttention === null || pscaleAttention === undefined)) {
    return { shape: 'block', floor, block };
  }

  // Case 2: pscale alone → disc at depth (floor - pscale).
  if (digits.length === 0) {
    const target = depthAt(pscaleAttention as number, floor);
    return {
      shape: 'disc',
      floor,
      pscale: pscaleAttention as number,
      target_depth: target,
      entries: collectDisc(block, target, floor),
    };
  }

  const pEnd = floor - digits.length; // pscale_at(len(digits), floor) — len>=1 so never root

  // Case 3: spindle alone → path-walk.
  if (pscaleAttention === null || pscaleAttention === undefined) {
    const terminus = walk(block, digits);
    const kids = ringBeneath(terminus);
    const head = kids.length ? headOf(terminus, digits, floor) : null;
    return {
      shape: 'path-walk',
      floor,
      spindle: typeof spindle === 'string' ? spindle : null,
      entries: buildPathWalk(block, digits, floor),
      ...(kids.length ? { beneath: kids.map((k) => fullWidthAddress([...digits, k], floor)), beneath_pscale: pEnd - 1 } : {}),
      ...(head ? { head } : {}),
      ...(padding ? { padding } : {}),
    };
  }

  // Case 4: spindle + pscale within or above spindle → point.
  if ((pscaleAttention as number) >= pEnd) {
    const target = depthAt(pscaleAttention as number, floor);
    if (target < 1 || target > digits.length) {
      return {
        shape: 'point',
        floor,
        spindle: typeof spindle === 'string' ? spindle : null,
        pscale: pscaleAttention as number,
        content: null,
        note: `pscale ${pscaleAttention} is off the spindle (depth ${target})`,
      };
    }
    const prefix = digits.slice(0, target);
    const node = walk(block, prefix);
    const kids = ringBeneath(node);
    const head = kids.length ? headOf(node, prefix, floor) : null;
    return {
      shape: 'point',
      floor,
      spindle: typeof spindle === 'string' ? spindle : null,
      pscale: pscaleAttention as number,
      depth: target,
      address: fullWidthAddress(prefix, floor),
      content: semantic(node),
      stamp: entryStamp(node),
      ...(kids.length ? { beneath: kids.map((k) => fullWidthAddress([...prefix, k], floor)), beneath_pscale: (pscaleAttention as number) - 1 } : {}),
      ...(head ? { head } : {}),
      ...(padding ? { padding } : {}),
    };
  }

  // Case 5: spindle + pscale below terminus → path-walk + descent.
  const target = depthAt(pscaleAttention as number, floor);
  const layers = target - digits.length;
  const terminus = walk(block, digits);
  return {
    shape: 'path-walk+descent',
    floor,
    spindle: typeof spindle === 'string' ? spindle : null,
    pscale: pscaleAttention as number,
    path_walk: buildPathWalk(block, digits, floor),
    descent: collectDescent(terminus, digits, floor, layers),
    ...(padding ? { padding } : {}),
  };
}

// ── Shape helpers ──

/** The floor-relative FULL-WIDTH address of a walked digit sequence, for the
 *  labels bsp() emits. A semantic number is ALWAYS relative to the floor — else
 *  the floor is useless (David, 2026-07-16; sunstone:1.5). Right-pads the walk to
 *  floor width (the trailing zeros ARE the floor-width padding: the unwalked finer
 *  positions) and uses a single decimal only where the walk runs below the floor.
 *
 *  Distinct from formatAddress (bsp.ts), which strips trailing zeros to the
 *  shortest form. That short form does NOT round-trip when the walk carries any
 *  trailing zero: parseSpindle left-pads a short dotless address, so "202" reads
 *  back as 0000000202, a different position. A label an agent may copy verbatim
 *  into its next spindle must therefore be the padded form — "2020000000" walks
 *  the decade, "202" does not. Emit labels are exactly such copyable text. */
export function fullWidthAddress(digits: string[], floor: number): string {
  if (digits.length <= floor) return digits.join('').padEnd(floor, '0');
  return `${digits.slice(0, floor).join('')}.${digits.slice(floor).join('')}`;
}

/** The digit positions a node holds, in address order — the ring beneath it. */
function digitChildren(node: unknown): string[] {
  if (!node || typeof node !== 'object') return [];
  return Object.keys(node as object).filter((k) => /^[1-9]$/.test(k)).sort();
}

/** The ring a reader would descend into: the digit children less the arrival
 *  stamp at field 3, which already rides the line as its suffix and is a
 *  field of the entry, never a position beneath it (block-conventions 4.22). */
function ringBeneath(node: unknown): string[] {
  const kids = digitChildren(node);
  return entryStamp(node) ? kids.filter((k) => k !== '3') : kids;
}

/** THE HEAD — the newest entry beneath a node whose digit children are
 *  containers: the greatest digit at every level, down to the first entry
 *  (a node that carries an arrival stamp, or whose children are fields). Null
 *  when the node's children are entries or fields themselves. */
function headOf(node: unknown, digits: string[], floor: number): string | null {
  if (!node || typeof node !== 'object') return null;
  const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v);
  const n = node as Record<string, unknown>;
  const containers = digitChildren(n).filter((k) => isObj(n[k]) && !entryStamp(n[k]) && digitChildren(n[k]).some((j) => isObj((n[k] as any)[j])));
  if (!containers.length) return null;
  let cur: any = n;
  const path = [...digits];
  for (;;) {
    const ks = digitChildren(cur);
    if (!ks.length) break;
    const k = ks[ks.length - 1];
    const next = cur[k];
    path.push(k);
    if (!isObj(next) || entryStamp(next) || !digitChildren(next).some((j) => isObj(next[j]))) break;
    cur = next;
  }
  return fullWidthAddress(path, floor);
}

/** The longest digit chain through a payload; ties resolve to the lowest digit. */
function deepestChain(node: unknown): string[] {
  if (!node || typeof node !== 'object') return [];
  let best: string[] = [];
  for (const k of digitChildren(node)) {
    const chain = [k, ...deepestChain((node as Record<string, unknown>)[k])];
    if (chain.length > best.length) best = chain;
  }
  return best;
}

/** THE MUSCLE BEHIND — the spindle a write's read-back walks: the landed
 *  address extended by the deepest chain of the payload, full width. The
 *  read-back law (orientation:weft 6.4; the closing rung of strata's writing
 *  spindle) says walk the deepest spindle as its future reader will; this
 *  names that spindle so the envelope can walk it. Null when nothing
 *  addressable landed (a string written at the root). A string at a spindle
 *  voices the node, so the walk ends there. */
export function readBackSpindle(block: Block, landed: string | null | undefined, content: unknown): string | null {
  const floor = floorDepth(block);
  let base: string[] = [];
  if (landed) {
    try { base = parseSpindleCanonical(landed, floor).digits; } catch { return null; }
  }
  const digits = [...base, ...deepestChain(content)];
  if (!digits.length) return null;
  return fullWidthAddress(digits, floor);
}

/** The arrival stamp an entry carries at field 3 — the mark/contribution ts
 *  (block-conventions 4.22). Surfaced because underscore-only rendering hid
 *  the stamp exactly where staleness needed reading: an entry's walked line
 *  showed its text while its own ts sat invisible one digit away
 *  (ahead:happyseaurchin, 2026-09-02). Only a string that looks like an ISO
 *  instant qualifies — a container whose digit 3 holds a child subtree
 *  returns undefined and renders as before. */
const LEADING_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/;

function entryStamp(node: any): string | undefined {
  const v = node && typeof node === 'object' ? (node as any)['3'] : undefined;
  if (typeof v !== 'string') return undefined;
  // The LEADING token only: the live board carries decorated stamps
  // ('…Z (+2 — 6 days ago)'), and surfacing the whole string re-renders a
  // stale age beside the fresh one — the shore already paid for this lesson
  // ('decorated timestamps parse by taking the leading ISO token').
  const m = LEADING_ISO.exec(v);
  return m ? m[0] : undefined;
}

function buildPathWalk(block: Block, digits: string[], floor: number): PathWalkEntry[] {
  const entries: PathWalkEntry[] = [];
  for (let i = 1; i <= digits.length; i++) {
    const prefix = digits.slice(0, i);
    const node = walk(block, prefix);
    entries.push({
      address: fullWidthAddress(prefix, floor),
      depth: i,
      pscale: pscaleAt(i, floor),
      content: semantic(node),
      stamp: entryStamp(node),
    });
  }
  return entries;
}

function collectDisc(block: Block, targetDepth: number, floor: number): DiscEntry[] {
  if (targetDepth < 1) return [];
  const results: DiscEntry[] = [];

  function recurse(node: any, depth: number, walked: string[]) {
    if (depth === targetDepth) {
      const onChainIntermediate =
        walked.length > 0 &&
        walked.every((w) => w === '0') &&
        node !== null &&
        typeof node === 'object';
      if (!onChainIntermediate) {
        const ring = ringBeneath(node).length;
        results.push({
          address: fullWidthAddress(walked, floor),
          content: semantic(node),
          stamp: entryStamp(node),
          ...(ring ? { beneath: ring } : {}),
        });
      }
      return;
    }
    if (!node || typeof node !== 'object') return;
    if ('_' in node) {
      const u = node._;
      if (u && typeof u === 'object') {
        recurse(u, depth + 1, walked.concat(['0']));
      } else if (typeof u === 'string') {
        const onFloorChain = walked.every((w) => w === '0');
        if (onFloorChain && depth + 1 === targetDepth) {
          results.push({ address: fullWidthAddress(walked.concat(['0']), floor), content: u });
        }
      }
    }
    for (const d of '123456789') {
      if (d in node) {
        recurse(node[d], depth + 1, walked.concat([d]));
      }
    }
  }

  recurse(block, 0, []);
  return results;
}

function collectDescent(
  terminus: any,
  walked: string[],
  floor: number,
  layers: number,
): PathWalkEntry[] {
  const results: PathWalkEntry[] = [];
  if (layers <= 0 || !terminus || typeof terminus !== 'object') return results;
  let frontier: Array<[any, string[]]> = [[terminus, walked]];
  for (let _layer = 1; _layer <= layers; _layer++) {
    const nextFrontier: Array<[any, string[]]> = [];
    for (const [node, walkedPath] of frontier) {
      if (!node || typeof node !== 'object') continue;
      for (const d of '123456789') {
        if (d in node) {
          const child = node[d];
          const childDepth = walkedPath.length + 1;
          results.push({
            address: fullWidthAddress(walkedPath.concat([d]), floor),
            depth: childDepth,
            pscale: pscaleAt(childDepth, floor),
            content: semantic(child),
            stamp: entryStamp(child),
          });
          if (child && typeof child === 'object') {
            nextFrontier.push([child, walkedPath.concat([d])]);
          }
        }
      }
    }
    frontier = nextFrontier;
  }
  return results;
}

// ── Write ──

/**
 * Write at (spindle, pscale_attention). Content's shape MUST match the
 * shape derived from (spindle, pscale_attention) per the canonical model:
 *   - block (no S, no P): content is the full object to replace the tree
 *   - path-walk (S alone): content is a string to write at the spindle terminus
 *   - point (S + P at terminus): same as path-walk
 *   - disc (P alone): content is array of {address, content}
 *   - subtree-like (S + P below terminus): content is an object to splice
 * The subnest-on-growth pattern is in walkOrCreate — a string node along
 * the walk migrates to that node's underscore so digit children can attach.
 * This is the implicit subnest of sunstone:1.6.2 (local growth at one digit
 * position), not the block-wide supernest of sunstone:1.6.3 (floor growth).
 */
export function bspWrite(
  block: Block,
  spindle: string | null | undefined,
  pscaleAttention: number | null | undefined,
  content: any,
): BspWriteResult {
  const floor = floorDepth(block);
  const { digits, hasStar } = parseSpindleCanonical(spindle, floor);

  if (hasStar) {
    // Star write: walk to terminus, enter hidden directory, write inside.
    const { terminal } = walkLegacy(block, digits);
    if (!terminal || typeof terminal !== 'object') {
      throw new Error(`Star write: terminus at "${spindle}" is not an object`);
    }
    if (!('_' in terminal) || typeof terminal._ !== 'object') {
      const oldUnderscore = typeof terminal._ === 'string' ? terminal._ : '';
      (terminal as any)._ = { _: oldUnderscore };
    }
    const innerBlock: Block = (terminal as any)._;
    bspWriteInPlace(innerBlock, '', pscaleAttention, content);
    return {
      shape: 'star',
      written: true,
      block,
      spindle: typeof spindle === 'string' ? spindle : '',
      pscale_attention: pscaleAttention ?? null,
    };
  }

  const { shape, landedDigits } = bspWriteInPlace(block, spindle ?? '', pscaleAttention, content);
  const result: BspWriteResult = {
    shape,
    written: true,
    block,
    spindle: String(spindle ?? ''),
    pscale_attention: pscaleAttention,
  };
  // ── The honest ack: name where the write actually landed. ──
  // Two witnessed classes of "phantom write" were both an ack echoing the
  // input string while the walk resolved elsewhere (or nowhere the caller
  // looked): an explicit pscale above the terminus lands at the addressed
  // DEPTH, not the terminus (2026-07-08); and a spindle narrower than the
  // floor left-pads with '0' and walks the root underscore chain
  // (2026-08-25). Neither is refused — both are canonical — but both are
  // now SAID, with the resolved digit walk and, for the padding case, the
  // dot-free address of the branch walk the author likely meant.
  if (landedDigits !== null && digits.length > 0) {
    // FULL-WIDTH form, not formatAddress: the short canonical form does not
    // round-trip (parseSpindle left-pads "2" at floor 2 back to 0,2 — the
    // root chain). A label an agent may copy into its next spindle, and the
    // address the transport saves at, must be the padded form ("20"), the
    // same form every path-walk label already emits.
    result.landed = fullWidthAddress(landedDigits, floor);
    if (landedDigits.length !== digits.length) {
      // Truncation: explicit pscale addressed an ancestor of the terminus.
      result.wire_spindle = result.landed;
      result.landing_note =
        `pscale ${pscaleAttention} addresses depth ${landedDigits.length} of the spindle — ` +
        `the write landed at "${result.landed}", not at the terminus of "${spindle}". ` +
        `To write the terminus, omit pscale_attention or set it to ${floor - digits.length}.`;
    } else if (landedDigits[0] === '0') {
      // Padding: the walk entered the root underscore chain. Only note it
      // when the zeros were ADDED by floor padding — an author who wrote
      // them out ("041") said what they meant.
      let addedByPad = false;
      try {
        const { leftDigits } = parseAddress(String(spindle).replace(/\*$/, ''));
        addedByPad = floor > 1 && leftDigits.length < floor;
      } catch { /* unparsable here means parseSpindle already threw upstream */ }
      const firstNonZero = landedDigits.findIndex((d) => d !== '0');
      if (addedByPad && firstNonZero > 0) {
        const stripped = landedDigits.slice(firstNonZero);
        result.landing_note =
          `"${spindle}" walks ${landedDigits.join(',')} at floor ${floor} — left-of-decimal pads to ` +
          `floor width, so the walk enters the root underscore chain (digit 0 = "_"). ` +
          `If you meant the branch walk ${stripped.join(',')}, that address is ` +
          `"${fullWidthAddress(stripped, floor)}".`;
      }
    }
  }
  // Soft advisory: a string that parses as JSON object/array at a single
  // position is almost certainly an intent mismatch.
  if (
    shape === 'point' &&
    typeof content === 'string' &&
    /^\s*[\{\[]/.test(content)
  ) {
    try {
      JSON.parse(content);
      result.warning =
        `Stored as a string-leaf at "${spindle}". The content parses as JSON — ` +
        `if you meant a subtree, pass the OBJECT (not a JSON-encoded string).`;
    } catch {}
  }
  return result;
}

/** Apply a write in place; returns the determined shape (canonical vocabulary)
 *  plus the digit walk the write actually landed at (null for the multi-target
 *  and whole-block shapes, where no single position is "the" landing). */
function bspWriteInPlace(
  block: Block,
  spindle: string,
  pscaleAttention: number | null | undefined,
  content: any,
): { shape: Shape; landedDigits: string[] | null } {
  const floor = floorDepth(block);
  const { digits } = parseSpindleCanonical(spindle, floor);

  if (digits.length === 0) {
    if (pscaleAttention === null || pscaleAttention === undefined) {
      // Whole-block write.
      if (!content || typeof content !== 'object') {
        throw new Error('Whole-block write requires an object payload');
      }
      // Existing block may be a non-object (string from a malformed prior
      // write, e.g. a pool block authored with content='<purpose>' instead of
      // content={_: '<purpose>'}). Object.keys(str) returns char indices, and
      // delete str[0] throws in strict mode — surfaced as "Cannot delete
      // property '0' of [object String]" for callers trying to heal in place.
      // The whole-block path is replace semantics anyway, so the mutation
      // strategy must adapt to the existing block's actual shape rather than
      // assuming object input. When the existing block is non-object, the
      // caller's reference cannot be mutated to become an object (primitives
      // aren't transformable). Throw a clean error directing callers to load
      // a fresh empty block instead — the same operation succeeds when the
      // initial block reference is {} rather than the corrupt prior value.
      if (typeof block !== 'object' || block === null) {
        throw new Error(
          `Whole-block write requires an object root; existing block is ${typeof block === 'object' ? 'null' : typeof block}. ` +
            `If healing a malformed block, DELETE first then write fresh.`,
        );
      }
      for (const k of Object.keys(block)) delete (block as any)[k];
      Object.assign(block, content);
      return { shape: 'block', landedDigits: null };
    }
    // Disc write.
    if (Array.isArray(content)) {
      for (const entry of content) {
        if (entry && typeof entry === 'object' && 'address' in entry) {
          writeAt(block, entry.address, (entry as any).content);
        }
      }
    } else if (content && typeof content === 'object') {
      for (const [addr, val] of Object.entries(content)) {
        writeAt(block, addr, val);
      }
    } else {
      throw new Error('Disc write requires array of {address, content} or sparse object');
    }
    return { shape: 'disc', landedDigits: null };
  }

  const pEnd = floor - digits.length;
  // When pscale_attention is OMITTED, infer the write shape from the content:
  // an object means "write a subtree here", a string means "write a point here".
  // Removes the footgun where a surgical object-write required the caller to
  // compute the floor-dependent pscale (an object at spindle "1.2" in a floor-1
  // block needs -2, not the naive -1 — a mismatch that surfaces when spindle
  // length and floor don't line up). An EXPLICIT pscale is honored exactly,
  // preserving control and the clear error on a genuine shape mismatch.
  const pAtt = pscaleAttention ?? (
    (content !== null && typeof content === 'object') ? pEnd - 1 : pEnd
  );

  if (pAtt >= pEnd) {
    // Point write (spindle + pscale at or above terminus).
    if (typeof content !== 'string') {
      throw new Error(`Point write requires a string payload (got ${typeof content})`);
    }
    const target = depthAt(pAtt, floor);
    const useDigits = target >= 1 && target <= digits.length ? digits.slice(0, target) : digits;
    const finalDigit = useDigits[useDigits.length - 1];
    const parentDigits = useDigits.slice(0, -1);
    const parent = walkOrCreate(block, parentDigits);
    const key = finalDigit === '0' ? '_' : finalDigit;
    if (key in parent && parent[key] !== null && typeof parent[key] === 'object') {
      parent[key]._ = content;
    } else {
      parent[key] = content;
    }
    return { shape: 'point', landedDigits: useDigits };
  }

  // path-walk+descent write (S + P below terminus) → replace subtree at terminus.
  if (typeof content !== 'object' || content === null) {
    throw new Error('Subtree (path-walk+descent) write requires an object payload');
  }
  const finalDigit = digits[digits.length - 1];
  const parentDigits = digits.slice(0, -1);
  const parent = walkOrCreate(block, parentDigits);
  const key = finalDigit === '0' ? '_' : finalDigit;
  parent[key] = content;
  return { shape: 'path-walk+descent', landedDigits: digits };
}

/**
 * Walk to a node, creating intermediate objects as needed.
 *
 * Sub-nest-on-growth: when a node along the walk is a string, the string
 * migrates to the new sub-block's underscore before descending.
 */
function walkOrCreate(block: Block, digits: string[]): Record<string, any> {
  let node: any = block;
  for (const d of digits) {
    const key = d === '0' ? '_' : d;
    const existing = node[key];
    if (typeof existing === 'string') {
      node[key] = { _: existing };
    } else if (!(key in node) || typeof existing !== 'object' || existing === null) {
      node[key] = {};
    }
    node = node[key];
  }
  return node;
}

// ── Unified entry point ──

export interface BspParams {
  block: Block;
  spindle?: string | null;
  pscale_attention?: number | null;
  content?: any;
}

export function bspFn(params: BspParams): BspReadResult | BspWriteResult {
  const { block, spindle, pscale_attention, content } = params;
  if (content === undefined) {
    return bspRead(block, spindle, pscale_attention);
  }
  return bspWrite(block, spindle, pscale_attention, content);
}

// ── Formatters ──

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s;
}

/** Floor of a read result, for the temporal label gate. Wire results from a
 *  beach may omit `floor`; every entry carrying depth+pscale supplies it
 *  (floor = depth + pscale, the canonical formula inverted), as does a point's
 *  depth and a disc's target_depth. */
function floorOf(r: BspReadResult): number | null {
  if (typeof r.floor === 'number') return r.floor;
  const lists: any[] = [
    ...(Array.isArray(r.path_walk) ? r.path_walk : []),
    ...(Array.isArray(r.entries) ? (r.entries as any[]) : []),
    ...(Array.isArray(r.descent) ? r.descent : []),
  ];
  for (const e of lists) {
    if (typeof e?.depth === 'number' && typeof e?.pscale === 'number') return e.depth + e.pscale;
  }
  if (typeof r.depth === 'number' && typeof r.pscale === 'number') return r.depth + r.pscale;
  if (typeof r.target_depth === 'number' && typeof r.pscale === 'number') return r.target_depth + r.pscale;
  return null;
}

/** A label as the floor-anchored address a reader can copy back as a spindle.
 *  A beach computes a wire read itself and labels with formatAddress — the
 *  short form, leading AND trailing zeros stripped — so at floor 3 the
 *  container 360 arrived as "36" and 010 as "1"; copied back, "36" pads to
 *  036 and opens the July entry instead (daily:weft, two weekly reviews,
 *  2026-10-03). Local reads already emit the full width, so every shape now
 *  prints one form. The entry's depth (floor − pscale) says how many digits
 *  the short form lost; the stripped zeros are taken as leading (the root's
 *  underscore chain, which a supernested accumulator always carries) — except
 *  on the floor-10 clock, whose zeros are interior — unless the walked
 *  spindle says otherwise. A label that is already full width
 *  comes back unchanged; anything unparseable rides through as given. */
function anchoredLabel(address: string, floor: number | null, pscale?: number | null, walked?: string[]): string {
  if (floor == null || pscale == null || !/^\d+(\.\d+)?$/.test(address)) return address;
  const depth = floor - pscale;
  if (depth < 1) return address;
  const [left, right] = address.split('.');
  let digits: string[] | null = null;
  if (right !== undefined) {
    if (left.length <= floor && depth > floor && right.length <= depth - floor) {
      digits = [...left.padStart(floor, '0'), ...right.padEnd(depth - floor, '0')];
    }
  } else if (left.length === floor && depth <= floor && /^0*$/.test(left.slice(depth))) {
    digits = [...left.slice(0, depth)]; // already full width
  } else if (left.length <= Math.min(depth, floor)) {
    const spare = depth - left.length;
    const lead = Math.min(depth, floor) - left.length;
    // The clock is born at floor 10 and never supernests; its zeros are the
    // year's own digits (2026 walks 2 → 0 → 2 → 6), so there they trail.
    const ks = Array.from({ length: lead + 1 }, (_, i) => (floor === 10 ? i : lead - i));
    const cands = ks.map((k) => [...'0'.repeat(k), ...left, ...'0'.repeat(spare - k)]);
    digits = cands.find((c) => !walked?.length || c.every((d, i) => i >= walked.length || d === walked[i])) ?? cands[0];
  }
  return digits ? fullWidthAddress(digits, floor) : address;
}

/** The digits a wire read walked, for anchoring its labels; empty when the
 *  spindle is absent or will not parse at this floor. */
function walkedDigits(r: BspReadResult, floor: number | null): string[] {
  if (floor == null || typeof r.spindle !== 'string' || !r.spindle) return [];
  try { return parseSpindleCanonical(r.spindle, floor).digits; } catch { return []; }
}

/** An emitted address label, tagged with its relation to now when the block
 *  is on the sundial (floor 10 and the digits rung-valid — any other floor-10
 *  address fails the rung ranges and rides through bare). The tag gives
 *  addresses the same partition the grounding boundary gives instants:
 *  behind is record, AHEAD is intention, (now — …) is present at the
 *  address's own grain. Wire labels arrive with trailing zeros stripped;
 *  renderAddressRelation right-pads them itself. */
function addrLabel(address: string, floor: number | null, entryPscale?: number | null, walked?: string[]): string {
  address = anchoredLabel(address, floor, entryPscale, walked);
  if (floor === 10) {
    // A walked interior-zero ancestor's label strips to a coarser address
    // than the rung it stands at (d2 p8 prints the millennium's own label),
    // so the relation anchors to the entry's OWN pscale where one rides —
    // a mismatch renders bare rather than voicing the wrong grain.
    const parsed = parseTemporalLabel(address);
    if (parsed && (entryPscale == null || parsed.pscale === entryPscale)) {
      const rel = renderAddressRelation(address);
      if (rel) return `[${address}] ${rel}`;
    }
  }
  return `[${address}]`;
}

/** An entry's arrival stamp rendered after its content — the grounding
 *  boundary then ages it exactly as it ages any instant in a response. */
function stampSuffix(stamp: string | undefined): string {
  return stamp ? ` · ${stamp}` : '';
}

/** The padding note, first: a walk that landed somewhere the input did not name says so before anything else. */
function paddingLine(r: BspReadResult): string[] {
  return r.padding ? [`  [note] ${r.padding}`] : [];
}

/** The one line the muscle ahead adds: the ring beneath, fire-ready — and the
 *  head of an accumulator beside it, so the newest entry is always named. */
function beneathLine(r: BspReadResult): string {
  const fl = floorOf(r);
  const walked = walkedDigits(r, fl);
  return `  beneath (pscale ${r.beneath_pscale}): ${(r.beneath ?? []).map((a) => anchoredLabel(a, fl, r.beneath_pscale, walked)).join(' · ')}${r.head ? ` · head ${r.head}` : ''}`;
}

/** THE RUNGS OF A WALK, RENDERED. An ancestor rides whole when it is short
 *  (under WHOLE_RUNG characters) and as its headline above that — the 150
 *  characters a fold's first line is written for — and a run of ancestors with
 *  no content collapses to one line naming its span, so a ten-rung clock walk
 *  with two voiced rungs is a few lines, not ten. The terminus is always whole.
 *  Keel's third sitting spent three of its twelve calls re-reading rungs the
 *  walk had cut (2026-10-06); the collapse is the other half of the same cost. */
export const WHOLE_RUNG = 400;
export function walkLines(entries: PathWalkEntry[], fl: ReturnType<typeof floorOf>, walked: ReturnType<typeof walkedDigits>, indent: string): string[] {
  const out: string[] = [];
  let run: PathWalkEntry[] = [];
  const label = (e: PathWalkEntry) => addrLabel(e.address, fl, e.pscale, walked);
  const flush = () => {
    if (!run.length) return;
    if (run.length === 1) {
      const e = run[0];
      out.push(`${indent}d${e.depth} p${e.pscale} ${label(e)}: (no content)`);
    } else {
      const a = run[0], b = run[run.length - 1];
      out.push(`${indent}d${a.depth}–d${b.depth} p${a.pscale}–p${b.pscale} ${label(a)} … ${label(b)}: (no content, ${run.length} rungs)`);
    }
    run = [];
  };
  for (const [i, e] of entries.entries()) {
    const last = i === entries.length - 1;
    const empty = e.content === null || e.content === undefined || String(e.content).trim() === '';
    if (empty && !last) { run.push(e); continue; }
    flush();
    const content = empty ? '(no content)' : String(e.content);
    const text = last || content.length <= WHOLE_RUNG ? content : truncate(content, 150);
    out.push(`${indent}d${e.depth} p${e.pscale} ${label(e)}: ${text}${stampSuffix(e.stamp)}`);
  }
  flush();
  return out;
}

/** A WALK SAYS WHEN ITS FRAMES ARE EMPTY. A spindle reading is the entry
 *  beneath the summaries of the spans above it; a rung above with no content
 *  is a summary slot not yet paid, and the entry then stands unframed — which
 *  is why a reader digs. Said once, so the reader knows what it was given and
 *  what is owed (David, 2026-10-06; block-conventions:3.5). */
const UNFRAMED = '  (a rung above with no content is a summary slot not yet paid: this entry stands without its frame — block-conventions:3.5)';
function unframed(entries: { content?: unknown }[], floor: number): boolean {
  return floor >= 2 && entries.slice(0, -1).some((e) => !String(e.content ?? '').trim());
}

export function formatRead(r: BspReadResult): string {
  switch (r.shape) {
    case 'block':
      return `[whole block]\n${JSON.stringify(r.block, null, 2)}`;
    case 'path-walk': {
      // Ancestors frame; the TERMINUS is what was asked for — render it whole.
      // (NHITL round 4: the fold law's own clauses were cut exactly where "who
      // folds" would be, and pulling one leaf in full took a third call.)
      const lines = [`[path-walk @ "${r.spindle}"]`, ...paddingLine(r)];
      const entries = (r.entries as PathWalkEntry[]) ?? [];
      const fl = floorOf(r);
      const walked = walkedDigits(r, fl);
      lines.push(...walkLines(entries, fl, walked, '  '));
      if (unframed(entries, fl ?? 0)) lines.push(UNFRAMED);
      if (r.beneath?.length) lines.push(beneathLine(r));
      return lines.join('\n');
    }
    case 'disc': {
      const lines = [`[disc @ pscale ${r.pscale} (depth ${r.target_depth})]`];
      const fl = floorOf(r);
      for (const e of (r.entries as DiscEntry[]) ?? []) {
        lines.push(`  ${addrLabel(e.address, fl, r.pscale)}: ${truncate(String(e.content ?? '(no content)'), 150)}${stampSuffix(e.stamp)}${e.beneath ? ` · ${e.beneath} beneath` : ''}`);
      }
      return lines.join('\n');
    }
    case 'point':
      if (r.note) return `[point @ pscale ${r.pscale}] ${r.note}`;
      return `[point @ pscale ${r.pscale} depth ${r.depth} ${addrLabel(String(r.address), floorOf(r), r.pscale, walkedDigits(r, floorOf(r)))}]${paddingLine(r).map((l) => `\n${l}`).join('')}\n  ${r.content ?? '(no content)'}${stampSuffix(r.stamp)}${r.beneath?.length ? `\n${beneathLine(r)}` : ''}`;
    case 'path-walk+descent': {
      const lines = [`[path-walk+descent @ "${r.spindle}" pscale ${r.pscale}]`, ...paddingLine(r)];
      lines.push('  path-walk:');
      // The walk's own terminus renders whole (the descent beneath stays the
      // truncated breadth view — point-read a child for its full text).
      const pw = r.path_walk ?? [];
      const fl = floorOf(r);
      const walked = walkedDigits(r, fl);
      lines.push(...walkLines(pw, fl, walked, '    '));
      if (unframed(pw, fl ?? 0)) lines.push(UNFRAMED);
      lines.push('  descent:');
      for (const e of r.descent ?? []) {
        lines.push(`    d${e.depth} p${e.pscale} ${addrLabel(e.address, fl, e.pscale, walked)}: ${truncate(String(e.content ?? ''), 150)}${stampSuffix(e.stamp)}`);
      }
      return lines.join('\n');
    }
    case 'star': {
      const lines = [`[star @ "${r.spindle}"]`];
      if (r.semantic) lines.push(`  semantic: ${truncate(r.semantic, 200)}`);
      if (r.inner) {
        lines.push(`  inner shape: ${r.inner.shape}`);
        const innerText = formatRead(r.inner);
        for (const line of innerText.split('\n')) lines.push(`    ${line}`);
      } else {
        lines.push('  (no hidden directory)');
      }
      return lines.join('\n');
    }
    case 'error':
      return `[error] ${r.error_message ?? '(no message)'}`;
    default:
      return JSON.stringify(r, null, 2);
  }
}

// A write that MINTED its block says so. An open beach lets any hand bring a
// block into being, so a mistyped name — `now:hapyhedgehog` for
// `now:happyhedgehog` — mints a permanent stray that every family sweep then
// lists; and the hand that minted it is the one best placed to notice. The
// beach says `born` in its ack (proposals/2026-09-21-tidying-and-spam.md); this
// is that fact, handed to the caller at the moment it happens. Nothing is
// refused and nothing is asked: a newcomer is, by definition, a new name.
// A dozen words and no more (David, 2026-09-21): agents mint blocks rightly and
// often, and the noticing is the whole value — the how lives in the proposal.
// Worded 'new' and turned toward the person (David, 2026-09-24): early days, so
// whoever the LLM works for hears what it made (proposals/2026-09-24-early-days-at-the-door.md).
export function formatBorn(blockName: string): string {
  return `\n  ⓘ new: this write created "${blockName}" — tell your person; a slip can be set aside.`;
}

export function formatWrite(r: BspWriteResult): string {
  // The honest ack: when the walk resolved somewhere a naive reading of the
  // input would not predict, the landed address rides in the head and the
  // note says why. An ack naming an address the walker did not resolve is
  // worse than an error (keel, pool:weft:52).
  const landedTag = r.landed !== undefined && r.landed !== r.spindle ? ` → landed at "${r.landed}"` : '';
  const head = `[wrote ${r.shape} @ "${r.spindle}"${r.pscale_attention != null ? ` pscale ${r.pscale_attention}` : ''}${landedTag}]`;
  const lines = [head];
  if (r.landing_note) lines.push(`[note] ${r.landing_note}`);
  if (r.warning) lines.push(`[warning] ${r.warning}`);
  return lines.join('\n');
}
