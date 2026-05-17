/**
 * bsp.ts — pure-form BSP for pscale JSON blocks.
 *
 * TypeScript port of bsp2-star.py (CORSAIR reference implementation).
 *
 * No tree wrapper, no tuning field, no metadata. The block IS the tree.
 * Floor derived from the underscore chain. Digit 0 maps to key '_'.
 *
 * Modes:
 *   bsp(block)                          → dir: full tree (depth-1 survey)
 *   bsp(block, number)                  → spindle: root-to-target chain
 *   bsp(block, number, 'ring')          → ring: siblings at terminal
 *   bsp(block, number, 'dir')           → dir: subtree from target down
 *   bsp(block, number, pscale, 'point') → point: single node at pscale
 *   bsp(block, null, depth, 'disc')     → disc: all nodes at a depth
 *   bsp(block, number, '*')             → star: hidden directory at terminal
 */

export type Block = Record<string, any>;

// ── Underscore chain traversal ──

/**
 * Follow the _._ chain to find the semantic text string.
 * - If _ is a string: return it (normal case).
 * - If _ is an object WITH its own _: recurse (hidden directory with text).
 * - If _ is an object WITHOUT _: return null (zero-position interior, headless).
 */
export function collectUnderscore(node: any): string | null {
  if (!node || typeof node !== 'object' || !('_' in node)) return null;
  const val = node._;
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    if ('_' in val) return collectUnderscore(val);
    return null; // zero-position interior
  }
  return null;
}

/**
 * Follow the underscore chain to find the level with digit children.
 * Returns the object containing hidden content, or null.
 * The hidden content is at the deepest underscore object that has digit children.
 */
export function findHiddenLevel(node: any): Record<string, any> | null {
  if (!node || typeof node !== 'object' || !('_' in node)) return null;
  const val = node._;
  if (typeof val !== 'object' || val === null) return null;
  let current: any = val;
  while (current && typeof current === 'object') {
    if (Object.keys(current).some(k => /^[1-9]$/.test(k))) {
      return current; // found the level with hidden content
    }
    if ('_' in current && typeof current._ === 'object') {
      current = current._;
    } else {
      break;
    }
  }
  return null;
}

/** Check if a node has a hidden directory (underscore subnested with digits). */
export function hasHiddenDirectory(node: any): boolean {
  return findHiddenLevel(node) !== null;
}

/**
 * Extract the hidden directory contents from a node's underscore chain.
 * Follows _._. ... to find the level with digit children.
 * Returns dict of {digit: content} or null if no hidden directory.
 */
export function getHiddenDirectory(node: any): Record<string, any> | null {
  const level = findHiddenLevel(node);
  if (level === null) return null;
  const result: Record<string, any> = {};
  for (const k of '123456789') {
    if (k in level) result[k] = level[k];
  }
  return result;
}

// ── Floor ──

/**
 * Follow the underscore chain until a string. Count = floor.
 * If chain hits an object with no _, it's a zero-position interior;
 * floor is the count of _ keys traversed to reach it.
 */
export function floorDepth(block: Block): number {
  let node: any = block;
  let depth = 0;
  while (node && typeof node === 'object' && '_' in node) {
    depth++;
    node = node._;
    if (typeof node === 'string') return depth;
  }
  return depth;
}

// ── Address parsing ──
//
// Pscale addresses are NUMBERS, not paths. The decimal point anchors pscale 0
// to the floor (sunstone:1.5). The substrate enforces this discipline at both
// boundaries: parseSpindle rejects malformed input with a clear error, and
// formatAddress emits the canonical single-dot form. Round-trip:
//   parseSpindle(formatAddress(d, fl), fl) → d (after canonicalisation).

/** Raised when a pscale address violates the canonical form. */
export class InvalidAddressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAddressError';
  }
}

/**
 * Split a pscale address into (leftDigits, rightDigits, hadDot).
 *
 * The decimal point is significant: it anchors pscale 0 to the floor. The
 * caller (parseSpindle) uses (left, right) to apply floor-aware padding.
 *
 * Accepts string or number. Rejects multi-dot, non-digit characters.
 */
export function parseAddress(s: number | string): {
  leftDigits: string[];
  rightDigits: string[];
  hadDot: boolean;
} {
  if (typeof s === 'number') {
    if (Number.isInteger(s)) {
      // Plain integer — no implicit decimal.
      return { leftDigits: [...String(s)], rightDigits: [], hadDot: false };
    }
    // Float — always carries an implicit decimal; strict left-of-decimal
    // check applies.
    const formatted = s.toFixed(10);
    const parts = formatted.split('.');
    const left = parts[0];
    const right = parts.length > 1 ? parts[1].replace(/0+$/, '') : '';
    return { leftDigits: [...left], rightDigits: [...right], hadDot: true };
  }

  const text = String(s);
  const dotCount = (text.match(/\./g) || []).length;
  if (dotCount > 1) {
    throw new InvalidAddressError(
      `"${text}" has multiple decimal points (${dotCount}); pscale addresses carry at most one (sunstone:1.5)`
    );
  }

  let left: string;
  let right: string;
  if (dotCount === 1) {
    [left, right] = text.split('.');
  } else {
    left = text;
    right = '';
  }

  for (const ch of left + right) {
    if (ch < '0' || ch > '9') {
      throw new InvalidAddressError(
        `"${text}" contains non-digit character "${ch}"`
      );
    }
  }

  return { leftDigits: [...left], rightDigits: [...right], hadDot: dotCount === 1 };
}

/**
 * Parse a pscale spindle into walk digits with floor-aware padding.
 *
 * Returns { digits, hasStar }.
 *
 * The decimal point anchors pscale 0 to the floor (sunstone:1.5). When the
 * address has fewer left-of-decimal digits than the floor, the left side is
 * padded with '0' (= '_') so the same address keeps locating the same
 * semantic position after the block has grown an underscore layer above.
 *
 * Trailing '*' is stripped — caller handles star semantics.
 *
 * Throws InvalidAddressError on multi-dot, non-digit chars, or addresses
 * with left-of-decimal exceeding floor (the dot would be above the floor).
 */
export function parseSpindle(
  spindle: string | number | null | undefined,
  floor: number,
): { digits: string[]; hasStar: boolean } {
  if (spindle == null || spindle === '') {
    return { digits: [], hasStar: false };
  }

  let s = String(spindle);
  const hasStar = s.endsWith('*');
  if (hasStar) s = s.slice(0, -1);
  if (s === '') return { digits: [], hasStar };

  const { leftDigits: leftRaw, rightDigits, hadDot } = parseAddress(s);
  let leftDigits = leftRaw;

  // Strict floor-anchor check only fires when floor is established (≥1).
  // Floor 0 means the block has no underscore chain (e.g. a freshly created
  // block with sub-position writes only) — no anchoring applies.
  if (floor >= 1 && hadDot && leftDigits.length > floor) {
    throw new InvalidAddressError(
      `"${s}" has ${leftDigits.length} digits left of decimal; exceeds floor ` +
      `${floor} (the dot anchors pscale 0 at the floor, so left-of-decimal ` +
      `digits cannot exceed floor depth)`
    );
  }

  if (floor > 1 && leftDigits.length < floor) {
    leftDigits = Array(floor - leftDigits.length).fill('0').concat(leftDigits);
  }

  let digits = leftDigits.concat(rightDigits);

  while (digits.length > 1 && digits[digits.length - 1] === '0') {
    digits.pop();
  }

  return { digits, hasStar };
}

/**
 * Format walk digits into a canonical pscale address string.
 *
 * Single-decimal form anchored at the floor when there are digits below the
 * floor; dot-free otherwise. Strips trailing zeros (floor-width padding) and
 * leading zeros from the left-of-decimal portion (parser re-pads from the
 * floor).
 *
 * Round-trip: parseSpindle(formatAddress(d, fl), fl).digits is equivalent
 * to d after canonicalisation, for any d that's reachable via a well-formed
 * pscale address.
 */
export function formatAddress(digits: string[], floor: number): string {
  let d = digits.slice();

  while (d.length > 1 && d[d.length - 1] === '0') {
    d.pop();
  }

  if (d.length === 0) return '';

  if (d.length <= floor) {
    while (d.length > 1 && d[0] === '0') {
      d = d.slice(1);
    }
    return d.join('');
  }

  let left = d.slice(0, floor);
  const right = d.slice(floor);
  while (left.length > 1 && left[0] === '0') {
    left = left.slice(1);
  }
  return left.join('') + '.' + right.join('');
}

// ── Walk ──

interface WalkEntry {
  text: string;
  depth: number;
}

interface WalkResult {
  chain: WalkEntry[];
  terminal: any;
  parent: any;
  lastKey: string | null;
}

/**
 * Walk the tree collecting texts. Digit 0 maps to key '_'.
 * Uses collectUnderscore to follow nested _._ chains transparently.
 */
export function walk(block: Block, digits: string[]): WalkResult {
  const chain: WalkEntry[] = [];
  let node: any = block;
  let parent: any = null;
  let lastKey: string | null = null;
  let depth = 0;

  // Collect root text via collectUnderscore (handles nested chains)
  const rootText = collectUnderscore(node);
  if (rootText !== null) {
    chain.push({ text: rootText, depth });
  }

  for (const d of digits) {
    const key = d === '0' ? '_' : d;
    if (!node || typeof node !== 'object' || !(key in node)) break;
    const target = node[key];
    // Walking '0' into a string '_' means we've hit the floor spine —
    // this text was already collected when we arrived at this node.
    if (d === '0' && typeof target === 'string') break;
    parent = node;
    lastKey = key;
    node = target;
    depth++;
    if (typeof node === 'string') {
      chain.push({ text: node, depth });
      break;
    } else if (node && typeof node === 'object') {
      const text = collectUnderscore(node);
      if (text !== null) {
        chain.push({ text, depth });
      }
    }
  }

  return { chain, terminal: node, parent, lastKey };
}

// ── BSP result types ──

export interface SpindleNode {
  pscale: number;
  text: string;
}

export interface RingSibling {
  digit: string;
  text: string | null;
  branch: boolean;
}

export interface DiscNode {
  path: string;
  text: string | null;
}

export type BspResult =
  | { mode: 'dir'; tree?: Block; subtree?: any }
  | { mode: 'spindle'; nodes: SpindleNode[] }
  | { mode: 'ring'; siblings: RingSibling[] }
  | { mode: 'point'; pscale: number; text: string | null }
  | { mode: 'disc'; depth: number; nodes: DiscNode[] }
  | { mode: 'star'; address: string; semantic: string | null; hidden: Record<string, any> | null };

// ── BSP ──

/**
 * Pure-form BSP. Block is the tree — no wrapper.
 *
 * Address parsing follows bsp2-star.py: parse → floor-aware left-pad → right-strip → walk.
 */
export function bsp(
  block: Block,
  number?: number | string | null,
  point?: string | number | null,
  mode?: string | null,
): BspResult {
  const fl = floorDepth(block);

  // Dir (full) — no args
  if (number == null && point == null && mode == null) {
    return { mode: 'dir', tree: block };
  }

  // Disc — bsp(block, null, depth, 'disc')
  if (mode === 'disc' && point != null) {
    const target = typeof point === 'string' ? parseInt(point, 10) : point;
    const nodes: DiscNode[] = [];
    function collectDisc(node: any, depth: number, walked: string[]) {
      if (depth === target) {
        let text: string | null = null;
        if (typeof node === 'string') {
          text = node;
        } else if (node && typeof node === 'object') {
          let inner = node._ ?? null;
          while (inner && typeof inner === 'object' && '_' in inner) {
            inner = inner._;
          }
          text = typeof inner === 'string' ? inner : null;
        }
        // Emit the walked digit sequence as a canonical pscale address —
        // single-decimal, floor-anchored, round-trippable through parseSpindle.
        const path = walked.length > 0 ? formatAddress(walked, fl) : '';
        nodes.push({ path, text });
        return;
      }
      if (!node || typeof node !== 'object') return;
      if ('_' in node && typeof node._ === 'object') {
        collectDisc(node._, depth + 1, walked.concat(['0']));
      }
      for (const d of '123456789') {
        if (d in node) {
          collectDisc(node[d], depth + 1, walked.concat([d]));
        }
      }
    }
    collectDisc(block, 0, []);
    return { mode: 'disc', depth: target, nodes };
  }

  // Parse spindle: validates, applies floor-aware pad-left, strips trailing.
  const { digits } = parseSpindle(number ?? null, fl);
  const { chain, terminal, parent, lastKey } = walk(block, digits);

  const pscaleAt = (depth: number) => (fl - 1) - depth;

  // Star — hidden directory at terminal
  if (point === '*') {
    const hd = getHiddenDirectory(terminal);
    const semantic = (terminal && typeof terminal === 'object')
      ? collectUnderscore(terminal) : null;
    return {
      mode: 'star',
      address: String(number),
      semantic,
      hidden: hd,
    };
  }

  // Ring — siblings at terminal
  if (point === 'ring') {
    if (parent === null || typeof parent !== 'object') {
      return { mode: 'ring', siblings: [] };
    }
    const siblings: RingSibling[] = [];
    // Include '_' as a navigable sibling (digit 0) if it's an object
    if (lastKey !== '_' && '_' in parent && typeof parent._ === 'object') {
      const text = collectUnderscore(parent);
      siblings.push({ digit: '0', text, branch: true });
    }
    for (const d of '123456789') {
      if (d === lastKey || !(d in parent)) continue;
      const v = parent[d];
      const text = typeof v === 'string' ? v : collectUnderscore(v);
      siblings.push({ digit: d, text, branch: typeof v === 'object' && v !== null });
    }
    return { mode: 'ring', siblings };
  }

  // Dir (subtree)
  if (point === 'dir') {
    return { mode: 'dir', subtree: terminal };
  }

  // Point — content at a specific pscale
  if (mode === 'point' && point != null) {
    const ps = typeof point === 'string' ? parseInt(point, 10) : point;
    for (const entry of chain) {
      if (pscaleAt(entry.depth) === ps) {
        return { mode: 'point', pscale: ps, text: entry.text };
      }
    }
    const last = chain.length > 0 ? chain[chain.length - 1] : null;
    return { mode: 'point', pscale: ps, text: last ? last.text : null };
  }

  // Spindle (default) — annotate with pscale
  const nodes: SpindleNode[] = chain.map(entry => ({
    pscale: pscaleAt(entry.depth),
    text: entry.text,
  }));
  return { mode: 'spindle', nodes };
}

// ── Formatters (ported from bsp2-star.py CLI) ──

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s;
}

/** Format a spindle result as readable text. */
export function fmtSpindle(r: { nodes: SpindleNode[] }): string {
  return r.nodes
    .map(n => `  [${String(n.pscale).padStart(3)}] ${truncate(n.text, 200)}`)
    .join('\n');
}

/** Format a ring result as readable text. */
export function fmtRing(r: { siblings: RingSibling[] }): string {
  if (!r.siblings.length) return '  (no siblings)';
  return r.siblings
    .map(s => `  ${s.digit}: ${truncate(s.text || '(branch)', 120)}${s.branch ? ' +' : ''}`)
    .join('\n');
}

/** Format a disc result as readable text. */
export function fmtDisc(r: { nodes: DiscNode[] }): string {
  if (!r.nodes.length) return '  (no nodes at this depth)';
  return r.nodes
    .map(n => `  [${n.path}] ${truncate(n.text || '(no text)', 150)}`)
    .join('\n');
}

/** Format a dir result as readable text. */
export function fmtDir(r: { tree?: Block; subtree?: any }): string {
  const tree = r.subtree || r.tree || {};
  if (r.subtree) return JSON.stringify(tree, null, 2);
  const lines: string[] = [];
  const root = tree._ ?? '';
  if (typeof root === 'string' && root) {
    lines.push(`  _: ${truncate(root, 200)}`);
  } else if (root && typeof root === 'object') {
    const text = collectUnderscore(tree);
    lines.push(`  _: ${truncate(text || '(floor chain)', 200)}`);
  }
  for (const k of Object.keys(tree).filter(k => k !== '_').sort()) {
    const v = tree[k];
    const text = typeof v === 'string'
      ? v
      : (typeof v === 'object' && v !== null ? (collectUnderscore(v) || '(branch)') : String(v));
    lines.push(`  ${k}: ${truncate(text, 120)}`);
  }
  return lines.join('\n');
}

/** Format a star result as readable text. */
export function fmtStar(r: { address: string; semantic: string | null; hidden: Record<string, any> | null }): string {
  const lines: string[] = [];
  if (r.semantic) lines.push(`  semantic: ${truncate(r.semantic, 150)}`);
  if (r.hidden) {
    for (const k of Object.keys(r.hidden).sort()) {
      const v = r.hidden[k];
      const text = typeof v === 'string'
        ? v
        : (typeof v === 'object' && v !== null ? (collectUnderscore(v) || '(block)') : String(v));
      lines.push(`  ${k}: ${truncate(text, 150)}`);
    }
  } else {
    lines.push('  (no hidden directory)');
  }
  return lines.join('\n');
}

/** Format any BSP result as readable text. */
export function fmtResult(result: BspResult): string {
  switch (result.mode) {
    case 'spindle': return fmtSpindle(result);
    case 'ring': return fmtRing(result);
    case 'disc': return fmtDisc(result);
    case 'dir': return fmtDir(result);
    case 'star': return fmtStar(result);
    case 'point': return `  [pscale ${result.pscale}] ${result.text ?? '(no text)'}`;
  }
}

// ── Write ──

/** Read the raw value at an address — the symmetric counterpart to writeAt.
 *
 * Uses parseSpindle for floor-aware parsing, so an address written at a
 * smaller floor still resolves correctly after the block has grown an
 * underscore layer above.
 *
 * Returns undefined when the address doesn't resolve (any intermediate
 * non-object terminates the walk). Throws InvalidAddressError for
 * malformed input (multi-dot, non-digit chars, left-of-decimal > floor).
 */
export function readAt(block: Block, address: string | null | undefined): any {
  if (address == null || address === '' || address === '_') return block._;
  const fl = floorDepth(block);
  const { digits } = parseSpindle(address, fl);
  if (digits.length === 0) return block._;
  let node: any = block;
  for (const d of digits) {
    if (!node || typeof node !== 'object') return undefined;
    const key = d === '0' ? '_' : d;
    if (!(key in node)) return undefined;
    node = node[key];
  }
  return node;
}

/** Write value at address, creating intermediate nodes as needed.
 *
 * Uses parseSpindle for floor-aware parsing.
 *
 * Growth migration: when an intermediate node is a string, the string is
 * preserved as the underscore of the new sub-block before descending. This
 * implements the supernest-on-growth rule — a digit's existing semantic
 * migrates to its underscore the moment it gains children, instead of being
 * silently nuked. Final-key writes still replace whatever's at the leaf
 * (a write at "7" still replaces block[7]; only intermediate nodes migrate).
 *
 * Throws InvalidAddressError for malformed input.
 */
export function writeAt(block: Block, address: string, value: any): Block {
  if (address === '_' || address === '' || address == null) {
    block._ = value;
    return block;
  }

  const fl = floorDepth(block);
  const { digits } = parseSpindle(address, fl);
  if (digits.length === 0) {
    block._ = value;
    return block;
  }

  let node: any = block;
  for (let i = 0; i < digits.length - 1; i++) {
    const key = digits[i] === '0' ? '_' : digits[i];
    const existing = node[key];
    if (typeof existing === 'string') {
      // Migration: preserve parent semantic at the underscore of the new sub-block
      node[key] = { _: existing };
    } else if (!(key in node) || typeof existing !== 'object' || existing === null) {
      node[key] = {};
    }
    node = node[key];
  }

  const finalDigit = digits[digits.length - 1];
  const finalKey = finalDigit === '0' ? '_' : finalDigit;
  node[finalKey] = value;
  return block;
}

/** Parse 'blockname:address' -> [blockname, address]. */
export function parseStar(ref: any): [string | null, string] {
  if (typeof ref !== 'string') return [null, '_'];
  if (ref.includes(':')) {
    const [name, addr] = ref.split(':', 2);
    return [name, addr || '_'];
  }
  return [ref, '_'];
}
