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
 * bsp.ts and reuses the canonical helpers (collectUnderscore, floorDepth,
 * formatAddress) rather than re-deriving a parser/formatter.
 *
 * BOUNDARY (documented): indexByPscale walks the floor identity and the digit
 * branches (transversal content). It does NOT descend a node's hidden directory
 * (an underscore-OBJECT under a digit) — that is the star door, a separate
 * operator. It also does not currently surface above-floor rung SUMMARIES of a
 * supernested block (the wrapped layers' inductive underscores); the floor
 * identity and all digit-positioned content are indexed. Refining above-floor
 * rung handling rhymes with the supernest-operation work (PR #60) and is left
 * for that coordination. See docs/floor-alignment-and-cross-block-ops.md.
 */

import { Block, collectUnderscore, floorDepth, formatAddress } from './bsp.js';

// ── pscale indexing ──

export interface PscaleNode {
  /** floor-anchored coordinate; 0 = floor, + above (coarser), - below (finer). */
  pscale: number;
  /** canonical single-dot pscale address, e.g. "34.5". */
  address: string;
  /** the walk as comma notation, e.g. "3,4,5" (tree-walk form, never multi-dot). */
  walk: string;
  text: string | null;
}

/** Semantic text of a node — a string leaf, or follow the underscore chain. */
function nodeText(node: any): string | null {
  if (typeof node === 'string') return node;
  return collectUnderscore(node);
}

/**
 * Index every floor-anchored position of a block by pscale.
 *
 * Emits the floor identity (the root underscore-chain string) at pscale 0, then
 * every digit-walked position at pscale = floor - depth. Hidden directories
 * (underscore-objects under a digit branch) are not descended — star is that
 * door. The result is the block laid out against its own floor, ready to be
 * laid against another block's floor at the shared pscale coordinate.
 */
export function indexByPscale(block: Block): PscaleNode[] {
  const out: PscaleNode[] = [];
  if (!block || typeof block !== 'object') return out;
  const F = floorDepth(block);

  // Floor identity — the root underscore chain followed to its string. pscale 0.
  const rootText = collectUnderscore(block);
  if (rootText !== null) {
    out.push({ pscale: 0, address: '0', walk: '0', text: rootText });
  }

  // Transversal content — digit children 1-9, recursively.
  function visit(node: any, digits: string[]): void {
    const depth = digits.length;
    out.push({
      pscale: F - depth,
      address: formatAddress(digits, F),
      walk: digits.join(','),
      text: nodeText(node),
    });
    if (!node || typeof node !== 'object') return;
    for (const d of '123456789') {
      if (d in node) visit(node[d], digits.concat(d));
    }
  }
  for (const d of '123456789') {
    if (d in block) visit(block[d], [d]);
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
