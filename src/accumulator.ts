/**
 * accumulator.ts — append-with-supernest for accumulators (marks, pools, history).
 *
 * The deferred operation from proposals/2026-06-03-supernest-floor-growth-and-
 * positional-ladder.md. Entries live on a zero-free digit-path (1-9, then 11-99,
 * then 111-999, …); the floor must equal the address length, and when the current
 * floor is full the whole block is wrapped in {_: old} (supernest, sunstone:1.63),
 * raising the floor by 1. Old entries absorb under the wrapped underscore — a "7"
 * written at floor 1 still resolves at floor 2 as "07" (parseSpindle pads-then-
 * strips). The walker (floorDepth / readAt / writeAt) already reads grown blocks;
 * this is the missing write op.
 *
 * Placement: a geometry helper, NOT the beach handler and NOT the guarded walker
 * (src/bsp.ts is a faithful port of bsp2-star.py). Used by the pool primitive;
 * marks/history can adopt the same call.
 *
 * Atomicity: this is a read-modify-write at the bsp-mcp layer — concurrent appends
 * can race the wrap. The atomic form is deferred (see the proposal); for cooperative
 * use the last-write-wins behaviour is acceptable.
 */

import { Block, floorDepth, readAt, writeAt } from './bsp.js';

/**
 * Supernest: wrap the whole block, raising the floor by 1. The entire mechanical
 * act of floor-growth (sunstone:1.63). Nothing else is touched; old entries absorb.
 */
export function supernest(block: Block): Block {
  return { _: block } as Block;
}

/**
 * Every zero-free digit-path address of exactly `len` digits (each digit 1-9), in
 * lexicographic order. len=1 → "1".."9"; len=2 → "11","12",…,"19","21",…,"99"; etc.
 * These are the entry slots at floor `len`. (Zero-bearing addresses like "10"/"100"
 * are bracket-summary positions, never entry slots — sunstone:1.64.)
 */
export function* zeroFreeOfLength(len: number): Generator<string> {
  if (len <= 0) { yield ''; return; }
  for (let d = 1; d <= 9; d++) {
    for (const rest of zeroFreeOfLength(len - 1)) yield String(d) + rest;
  }
}

/**
 * Append `entry` to an accumulator on the positional ladder, supernesting when the
 * current floor is full.
 *
 *  - At floor F, entries occupy F-digit zero-free addresses. Find the first free.
 *  - If all F-digit slots are full, supernest (floor → F+1) and place the entry at
 *    the first (F+1)-digit zero-free address ("1" repeated F+1 times). The old
 *    entries are now reached with a leading zero ("7" → "07") and stay intact.
 *
 * Returns the (possibly wrapped) block, the entry's canonical address, and whether
 * a supernest occurred — so the caller writes whole-block on growth, position-only
 * otherwise.
 */
export function appendWithSupernest(
  block: Block,
  entry: any,
): { block: Block; address: string; grew: boolean } {
  const floor = floorDepth(block);
  for (const addr of zeroFreeOfLength(floor)) {
    if (readAt(block, addr) === undefined) {
      writeAt(block, addr, entry);
      return { block, address: addr, grew: false };
    }
  }
  // Current floor is full — grow it, then the entry is the first slot of the new floor.
  const grown = supernest(block);
  const addr = '1'.repeat(floor + 1);
  writeAt(grown, addr, entry);
  return { block: grown, address: addr, grew: true };
}
