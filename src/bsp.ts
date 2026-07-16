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

// ── (removed) the legacy bsp() + its CLI formatters ──
//
// A second walker lived here: bsp(block, number, point, mode) with its own
// result types and the fmt* CLI formatters ported from bsp2-star.py's CLI.
// It was unreachable — nothing imported it — and it had silently missed the
// 2026-05-17 canonical update, still computing pscale = (floor - 1) - depth,
// the pre-canonical formula, and pushing the root voicing into the chain as
// an entry. Read against live spatial:earth it put Ceidio at +1 and the room
// at -1, one rung low across the board, while the Python and the shipped
// path both said +2 and 0. Dead code cannot be wrong quietly: it read as
// canon and cost a session's trust in a correct walker before the Python
// settled it. Removed 2026-07-16.
//
// The walker is bspRead/bspWrite in bsp-fn.ts (pscale = floor - depth, per
// bsp2-star.py and bsp-alt.py); rendering is formatRead/formatWrite there.
// This file keeps only what they build on: the underscore-chain helpers,
// floorDepth, the address parser, walk, readAt/writeAt, parseStar.
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
 * implements the subnest-on-growth rule (the implicit subnest of
 * sunstone:1.6.2 — local growth at one digit position, distinct from the
 * block-wide supernest at 1.6.3 which grows the floor) — a digit's existing
 * semantic migrates to its underscore the moment it gains children, instead
 * of being silently nuked. Final-key writes still replace whatever's at the
 * leaf (a write at "7" still replaces block[7]; only intermediate nodes
 * migrate).
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
