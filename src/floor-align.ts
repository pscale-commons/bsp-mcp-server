/**
 * floor-align.ts — cross-block floor alignment: the n-ary companion to bsp().
 *
 * THE LAW
 * -------
 * bsp() is unary and block-local: a node's WALK DEPTH means something only
 * inside its own block. The coordinate that survives ACROSS blocks is PSCALE
 * (floor minus depth), because the floor — pscale 0, where the root underscore
 * chain reaches its string — is the same coordinate for every block. It is
 * invariant under supernest (sunstone:1.63, whetstone:2.7). Therefore:
 *
 *   Any computation BETWEEN two or more blocks indexes by pscale, never by
 *   walk depth.
 *
 *   pscale(node at depth d, block floor F) = F - d
 *   pscale 0 sits at the floor (the underscore-chain string terminus).
 *   Integer digits walk above the floor (pscale > 0, coarser context).
 *   Fractional digits walk below the floor (pscale < 0, finer detail).
 *
 * Comparing two addresses left-aligned by walk step (3,4,5 against 7,6,5,4) is
 * the bug — it pairs a coarse position in the deeper block with the floor of
 * the shallower. The fix is decimal-point alignment: pad the shorter
 * left-of-decimal with leading zeros to the wider floor —
 *
 *   34.5   (floor 2)  ->  3,4,5      pscale  +1  0 -1
 *   7.654  (floor 1)  ->  0,7,6,5,4  pscale  +1  0 -1 -2 -3   (padded)
 *
 * Leading-zero padding in address space IS supernest in block space: wrapping
 * the shallower block in `{_: <old>}` until the floors match. Because pscale is
 * invariant under that wrapping, no block is actually transformed — indexing
 * both by pscale IS the alignment. The dot-product analogy is exact: the floor
 * is the contraction axis; mismatched floors are mismatched dimensions resolved
 * by zero-padding.
 *
 * This module is the binary/n-ary companion to bsp(): bsp() indexes WITHIN a
 * block, floor-align relates ACROSS blocks. It deliberately does NOT modify
 * bsp.ts and re-derives nothing: floorDepth names the floor, and bsp()'s own
 * disc supplies every position.
 *
 * ONE WALK, NOT TWO: at each pscale a block's contribution to the frame IS its
 * disc — bsp(B, P), exactly as a single read delivers it — so this module holds
 * no traversal of its own and cannot drift from bsp(). Digit 0 is the
 * underscore (bsp.ts: "Digit 0 maps to key '_'"; sunstone:1.4 — walking zero
 * into a digit's underscore enters its hidden directory), so a zero-position is
 * a position like any other: the clock's 2000s under millennium 2, an
 * accumulator's wrapped entries under the root chain, ground never carved
 * (sunstone:1.72). Only the root chain's own rungs — the ladder — are not
 * positions, by the disc's rule. Star stays the door into a hidden directory's
 * OWN frame; in this block's frame it is simply position 0.
 *
 * This replaces a walk of digits 1-9 only that documented the skip as a
 * boundary, leaving the hidden directory to star. It went unseen until the
 * clock: bsp-floor read nothing of the 2000s on any floor-10 block, and on
 * every accumulator nothing beneath its root chain (2026-10-04, watch:weft
 * 525-527). See docs/floor-alignment-and-cross-block-ops.md.
 */

import { Block, floorDepth } from './bsp.js';
import { bspRead, DiscEntry } from './bsp-fn.js';

// ── pscale indexing ──

export interface PscaleNode {
  /** floor-anchored coordinate; 0 = floor, + above (coarser), - below (finer). */
  pscale: number;
  /** the full-width floor-anchored address the disc prints ("2026400000",
   *  "34.5") — copyable back as a spindle. */
  address: string;
  /** the walk as comma notation, e.g. "2,0,2,6,4" (tree-walk form, never multi-dot). */
  walk: string;
  text: string | null;
  /** the arrival stamp and the count of positions beneath, as the disc carries them. */
  stamp?: string;
  beneath?: number;
}

/** The deepest walk a block holds — how many discs it has. */
function deepest(node: any): number {
  if (!node || typeof node !== 'object') return 0;
  return 1 + Math.max(0, ...['_', ...'123456789'].filter((k) => k in node).map((k) => deepest(node[k])));
}

/**
 * Index every floor-anchored position of a block by pscale: the block's discs,
 * every one of them, read by bsp() itself. The result is the block laid out
 * against its own floor, ready to be laid against another block's floor at the
 * shared pscale coordinate.
 */
export function indexByPscale(block: Block): PscaleNode[] {
  const out: PscaleNode[] = [];
  if (!block || typeof block !== 'object') return out;
  const F = floorDepth(block);
  const D = deepest(block);
  for (let depth = 1; depth <= D; depth++) {
    const pscale = F - depth;
    for (const e of (bspRead(block, null, pscale).entries ?? []) as DiscEntry[]) {
      // A full-width address is the walk right-padded to the floor, so its
      // first `depth` digits are the walk itself.
      const walk = e.address.replace('.', '').slice(0, depth).split('').join(',');
      out.push({ pscale, address: e.address, walk, text: e.content, stamp: e.stamp, beneath: e.beneath });
    }
  }
  return out;
}

// ── the n-ary operation ──

export interface AlignedLevel {
  pscale: number;
  /** perBlock[i] = the i-th block's nodes at this pscale (empty = zero-padded). */
  perBlock: PscaleNode[][];
}

/**
 * floorAlign(...blocks) — lay two or more blocks against the floor as a common
 * plane and group their positions by shared pscale, coarse (high pscale) first.
 * A level present in only some blocks carries empty sides for the rest — the
 * structural image of zero-padding the shorter operand(s).
 *
 * pscale is invariant under supernest, so no block is transformed: indexing
 * each by pscale IS the alignment; leading-zero padding is only how addresses
 * render at a fixed floor width.
 */
export function floorAlign(...blocks: Block[]): AlignedLevel[] {
  const indices = blocks.map(indexByPscale);
  const levels = new Set<number>();
  for (const idx of indices) for (const n of idx) levels.add(n.pscale);
  return [...levels]
    .sort((a, b) => b - a) // coarse -> fine
    .map((pscale) => ({
      pscale,
      perBlock: indices.map((idx) => idx.filter((n) => n.pscale === pscale)),
    }));
}

/**
 * floorPlane(blocks, pscale) — every block's nodes at ONE pscale level.
 * `floorPlane(blocks, 0)` gathers each block's floor-anchored content at the
 * shared floor — an index of root definitions across a whole set (a shell's
 * blocks, every block hosted at a beach). The plane is shared by all blocks,
 * not only two.
 */
export function floorPlane(blocks: Block[], pscale: number): PscaleNode[][] {
  return blocks.map((b) => indexByPscale(b).filter((n) => n.pscale === pscale));
}

/**
 * floorProduct(A, B, sim) — the dot product over the shared pscale axis.
 * Contracts two blocks into a single scalar: the summed similarity of their
 * content where their scales coincide. Levels where either side is empty
 * contribute 0 (zero-padding). `sim` is any text-pair scorer (embedding cosine,
 * lexical overlap, LLM judgement — caller's choice).
 *
 *   floorProduct(A, B) = Σ_p  sim( A@p , B@p )
 *
 * Comparison and merge are the other two derivations from the same aligned
 * frame; n-ary resonance is the pairwise floorProduct over the set.
 */
export function floorProduct(
  blockA: Block,
  blockB: Block,
  sim: (a: string, b: string) => number,
): number {
  let total = 0;
  for (const level of floorAlign(blockA, blockB)) {
    const [a, b] = level.perBlock;
    if (!a.length || !b.length) continue; // zero-padded level
    const aText = a.map((n) => n.text ?? '').join(' ');
    const bText = b.map((n) => n.text ?? '').join(' ');
    total += sim(aText, bText);
  }
  return total;
}
