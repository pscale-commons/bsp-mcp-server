/**
 * grain-address.ts — pure helpers for the one grain law (proposal
 * 2026-07-15-pscale-of-agency): pscale is position relative to the decimal
 * point, the spatial address IS a pscale address, and time rides it.
 *
 * A canonical location address (the form passport:3 carries and a pool is
 * named by) is a plain digit run padded to the world's floor width, with a
 * single decimal for finer-than-floor: at a floor-3 world the quarter is
 * "100", the tavern "110", the room "111", the hearth "111.1". Trailing
 * zeros are floor-width padding (sunstone:1.5) — the quarter WALKS one
 * digit. These helpers speak that form without loading the spatial block:
 * the canonical string alone carries its floor (dot position, else length).
 *
 * Kept beside bsp.ts, deliberately not inside it — the walker is the ported
 * canon (DO NOT MODIFY); these are location conventions layered above it.
 */

/** True iff `addr` is a legal canonical location address: digits with at
 *  most one decimal point, nothing else. (The walker's own strictness —
 *  multi-dot, commas — stays the walker's; this is the cheap gate.) */
export function isLocationAddress(addr: string): boolean {
  return /^\d+(\.\d+)?$/.test(addr);
}

/** The floor width the address was written at: digits left of the decimal,
 *  else the whole length (canonical form pads left-of-decimal to exactly
 *  floor width — "3200" is a floor-4 address, "111.1" a floor-3 one). */
export function floorOf(addr: string): number {
  const i = addr.indexOf('.');
  return i === -1 ? addr.length : i;
}

/** The WALKED digit sequence — padding stripped: "3200" → "32" (the town is
 *  two steps from the root); "111.1" → "1111"; "100" → "1". This is the
 *  sequence prefix-relations are computed on; zeros inside a walk are legal
 *  only as padding at the tail, per the parser's strip-then-iterate. */
export function walkedOf(addr: string): string {
  const run = addr.replace('.', '');
  return run.replace(/0+$/, '') || run.slice(0, 1);
}

/** Canonical address for a walked sequence at a given floor: pad right with
 *  zeros up to floor width, or place the single decimal after floor digits.
 *  canonicalAt("32", 4) = "3200"; canonicalAt("1111", 3) = "111.1". */
export function canonicalAt(walked: string, floor: number): string {
  if (walked.length <= floor) return walked.padEnd(floor, '0');
  return `${walked.slice(0, floor)}.${walked.slice(floor)}`;
}

/** The pscale a location address stands at: floor − walked depth. The room
 *  at "111" (floor 3) is 0; the town "3200" (floor 4) is +2; "111.1" is −1. */
export function pscaleOf(addr: string): number {
  return floorOf(addr) - walkedOf(addr).length;
}

/** a strictly CONTAINS b: a's walked sequence is a proper prefix of b's —
 *  the town contains the kitchen. Same-address is not containment. */
export function contains(a: string, b: string): boolean {
  const wa = walkedOf(a);
  const wb = walkedOf(b);
  return wb.length > wa.length && wb.startsWith(wa);
}

/** Ancestor addresses of `addr`, NEAREST FIRST, in canonical form at the
 *  same floor: ancestorsOf("3241") = ["3240"? no —] "324" walks 3,2,4 →
 *  canonical "3240"; then "3200"; then "3000". Each is the coarser place
 *  (and its coarser cadence) containing this one. */
export function ancestorsOf(addr: string): string[] {
  const floor = floorOf(addr);
  const walked = walkedOf(addr);
  const out: string[] = [];
  for (let k = walked.length - 1; k >= 1; k--) {
    out.push(canonicalAt(walked.slice(0, k), floor));
  }
  return out;
}

/** The standard temporal spine — ONE sentence, rendered wherever the grain
 *  needs stating (grit carries it; a world's rules block overrides). Kept
 *  here so every surface quotes the same calibration. */
export const STANDARD_SPINE =
  'the standard spine anchors pscale 0 at the room and the 5–10-minute beat ' +
  '(−1 the table and the minute, −2 seconds; +1 the building and the hour, ' +
  '+2 the town and the day, +3 the region and the week, and so on up the ' +
  'containment ladder — spatial:earth runs it to +11, the solar system)';
