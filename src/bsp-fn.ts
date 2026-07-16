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
  parseSpindle as parseSpindleCanonical,
  walk as walkLegacy,
  writeAt,
  InvalidAddressError,
} from './bsp.js';

export { InvalidAddressError } from './bsp.js';

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
}

export interface DiscEntry {
  address: string;
  content: string | null;
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
  note?: string;
  // disc shape:
  target_depth?: number;
  // star shape:
  semantic?: string | null;
  inner?: BspReadResult | null;
  // error shape:
  error_message?: string;
}

export interface BspWriteResult {
  shape: Shape;
  written: boolean;
  block: Block;
  spindle?: string;
  pscale_attention?: number | null;
  warning?: string;
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
    return {
      shape: 'path-walk',
      floor,
      spindle: typeof spindle === 'string' ? spindle : null,
      entries: buildPathWalk(block, digits, floor),
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
    return {
      shape: 'point',
      floor,
      spindle: typeof spindle === 'string' ? spindle : null,
      pscale: pscaleAttention as number,
      depth: target,
      address: fullWidthAddress(prefix, floor),
      content: semantic(node),
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
function fullWidthAddress(digits: string[], floor: number): string {
  if (digits.length <= floor) return digits.join('').padEnd(floor, '0');
  return `${digits.slice(0, floor).join('')}.${digits.slice(floor).join('')}`;
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
        results.push({ address: fullWidthAddress(walked, floor), content: semantic(node) });
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

  const shape = bspWriteInPlace(block, spindle ?? '', pscaleAttention, content);
  const result: BspWriteResult = {
    shape,
    written: true,
    block,
    spindle: String(spindle ?? ''),
    pscale_attention: pscaleAttention,
  };
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

/** Apply a write in place; returns the determined shape (canonical vocabulary). */
function bspWriteInPlace(
  block: Block,
  spindle: string,
  pscaleAttention: number | null | undefined,
  content: any,
): Shape {
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
      return 'block';
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
    return 'disc';
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
    return 'point';
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
  return 'path-walk+descent';
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

export function formatRead(r: BspReadResult): string {
  switch (r.shape) {
    case 'block':
      return `[whole block]\n${JSON.stringify(r.block, null, 2)}`;
    case 'path-walk': {
      const lines = [`[path-walk @ "${r.spindle}"]`];
      for (const e of (r.entries as PathWalkEntry[]) ?? []) {
        const content = e.content ?? '(no content)';
        lines.push(`  d${e.depth} p${e.pscale} [${e.address}]: ${truncate(String(content), 150)}`);
      }
      return lines.join('\n');
    }
    case 'disc': {
      const lines = [`[disc @ pscale ${r.pscale} (depth ${r.target_depth})]`];
      for (const e of (r.entries as DiscEntry[]) ?? []) {
        lines.push(`  [${e.address}]: ${truncate(String(e.content ?? '(no content)'), 150)}`);
      }
      return lines.join('\n');
    }
    case 'point':
      if (r.note) return `[point @ pscale ${r.pscale}] ${r.note}`;
      return `[point @ pscale ${r.pscale} depth ${r.depth} [${r.address}]]\n  ${r.content ?? '(no content)'}`;
    case 'path-walk+descent': {
      const lines = [`[path-walk+descent @ "${r.spindle}" pscale ${r.pscale}]`];
      lines.push('  path-walk:');
      for (const e of r.path_walk ?? []) {
        const c = e.content ?? '(no content)';
        lines.push(`    d${e.depth} p${e.pscale} [${e.address}]: ${truncate(String(c), 150)}`);
      }
      lines.push('  descent:');
      for (const e of r.descent ?? []) {
        lines.push(`    d${e.depth} p${e.pscale} [${e.address}]: ${truncate(String(e.content ?? ''), 150)}`);
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

export function formatWrite(r: BspWriteResult): string {
  const head = `[wrote ${r.shape} @ "${r.spindle}"${r.pscale_attention != null ? ` pscale ${r.pscale_attention}` : ''}]`;
  return r.warning ? `${head}\n[warning] ${r.warning}` : head;
}
