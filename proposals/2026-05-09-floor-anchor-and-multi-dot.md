# Floor-anchor padding and strict multi-dot rejection

**Date**: 2026-05-09
**Companion to**: [`2026-05-09-parser-dot-handling.md`](./2026-05-09-parser-dot-handling.md)
**Status**: implemented in `bsp2-star.py` (canonical Python) + bsp-mcp + happyseaurchin. All three aligned.

## TL;DR

Three parser bugs were found in this session. (1) and (2) are listed in the companion proposal — `replace('.', '')` strips only first occurrence in JS; `readAt`/`writeAt` `split('.')` creates ghost multi-character keys. **This proposal documents (3): the floor-anchor bug.**

The decimal point in a pscale address is documented as "anchored to the floor" (sunstone:1.5), but the parser pads on **total** digit count, not **left-of-decimal** count. Result: an address written at one floor silently misroutes when the block has grown an underscore layer. Matching example, confirmed empirically:

```
blockF3_growth (floor 3, leaf migrated under one more _):
  bsp(spindle="34.5") → "F3 floor text"        ✗ wrong node, walk broke early
  bsp(spindle="034.5") → "leaf at 34.5..."     ✓ correct (manually pre-padded)
  bsp(spindle="0345")  → "leaf at 34.5..."     ✓ correct (dot-free equivalent)
```

The fix: `parseSpindle` now pads **left-of-decimal** to floor width. The same address `"34.5"` works at floor 2, 3, 4 because the parser auto-anchors to the current floor.

Strict reject is added at the same boundary: multi-dot addresses (`"1.2.3"`) and addresses with left-of-decimal exceeding the floor (`"123.4"` at floor 2) throw `InvalidAddressError`. Previously these silently misrouted via the `replace('.','')` bug or the total-length pad.

## Changes implemented in this branch

### `bsp-mcp/src/bsp.ts`

- **New**: `InvalidAddressError` class.
- **New**: `formatAddress(digits, floor)` — canonical single-dot emit, floor-anchored, leading-zero-stripped (parser re-pads).
- **Refactored**: `parseAddress` now returns `{leftDigits, rightDigits, hadDot}` (was a flat `string[]`). Rejects multi-dot and non-digit characters. Floats carry implicit dot.
- **Refactored**: `parseSpindle` (moved from bsp-fn.ts) — floor-aware pad-left, strict reject when `hadDot && leftDigits.length > floor`. Floor 0 is lenient (new blocks have no chain to anchor against). Returns `{digits, hasStar}`.
- **Refactored**: `bsp()` legacy dispatcher uses `parseSpindle`. `collectDisc` (inside) emits canonical addresses via `formatAddress`.
- **Refactored**: `readAt`, `writeAt` use `parseSpindle` (closes the `split('.')` ghost-keys bug from companion proposal).

### `bsp-mcp/src/bsp-fn.ts`

- Imports `parseSpindle`, `formatAddress`, `InvalidAddressError` from bsp.ts (canonical home).
- `parseSpindle` is a thin wrapper for back-compat at the bsp-fn import path.
- `collectDisc` (inside) emits via `formatAddress`.

### `bsp-mcp/src/tools/bsp.ts`

- Catches `InvalidAddressError` on read AND write, returns user-facing error (`"Read rejected: ..."`, `"Write rejected: ..."`).

### `happyseaurchin/api/pscale-beach.js`

- Mirror parser primitives added: `floorDepth`, `parseAddress`, `parseSpindle`, `formatAddress`, `InvalidAddressError`. Same algorithm as bsp-mcp.
- `writeAt`, `readAt` floor-aware via `parseSpindle`.
- `lockKeyForWrite` derives lock key from POST-parse digit sequence (so locks follow the floor-aware walk, not the user-written first character).
- `handleStandardWrite` and the GET handler catch `InvalidAddressError` and return HTTP 400 `invalid_address`.

## Algorithm (canonical, both ends)

```
parseSpindle(s, floor) → {digits, hasStar}:
  1. Strip trailing '*' → hasStar
  2. If empty → return ([], hasStar)
  3. Split on dot:
     - >1 dots → throw InvalidAddressError (sunstone:1.5)
     - 1 dot  → (left, right)
     - 0 dots → (left, "")
  4. Validate every char ∈ [0-9]
  5. If floor ≥ 1 AND hadDot AND left.length > floor → throw
  6. If floor > 1 AND left.length < floor → pad LEFT with '0' to floor width
  7. digits = left + right
  8. Strip trailing zeros (floor-width padding canonicalisation)
  9. Return (digits, hasStar)

formatAddress(digits, floor) → string:
  1. Strip trailing zeros
  2. If digits.length ≤ floor: strip leading zeros, join → "X" (no dot)
  3. Else: split at index `floor` into (left, right), strip leading zeros from
     left, join as "L.R" (single dot, anchored to floor)
```

## Examples (verified by `npm run smoke:parser`)

| Input         | Floor | Output digits             | Notes                            |
|---------------|-------|---------------------------|----------------------------------|
| `"34.5"`      | 1     | **throws** InvalidAddress | left=2 > floor 1                 |
| `"34.5"`      | 2     | `[3,4,5]`                 | left == floor, no pad            |
| `"34.5"`      | 3     | `[0,3,4,5]`               | pad left from 2 to 3             |
| `"34.5"`      | 4     | `[0,0,3,4,5]`             | pad left from 2 to 4             |
| `"034.5"`     | 3     | `[0,3,4,5]`               | already padded                   |
| `"0345"`      | 3     | `[0,3,4,5]`               | dot-free equivalent              |
| `"1"`         | 3     | `[0,0,1]`                 | total-length pad (no-dot)        |
| `"100"`       | 3     | `[1]`                     | trailing-zero strip (floor pad)  |
| `"1.2.3"`     | any   | **throws** InvalidAddress | multi-dot                        |
| `"5*"`        | 1     | digits=`[5]`, hasStar=true |                                  |

`formatAddress(digits, floor)` produces the canonical inverse:

| Digits               | Floor | Output    |
|----------------------|-------|-----------|
| `[3,4,5]`            | 2     | `"34.5"`  |
| `[0,3,4,5]`          | 3     | `"34.5"`  |
| `[0,0,3,4,5]`        | 4     | `"34.5"`  |
| `[1]`                | 1     | `"1"`     |
| `[0,0,1]`            | 3     | `"1"`     |
| `[1,2,3]`            | 1     | `"1.23"`  |

Round-trip: `parseSpindle(formatAddress(d, fl), fl).digits` ≡ canonical form of `d`.

## bsp2-star.py — the canonical reference, updated in lockstep

bsp2-star.py is the canonical Python reference. The user authorised editing the work-copy at `~/Projects/hermitcrab-mobius-work/tidy-up/bsp2-star.py`; the CORSAIR mirror at `/Volumes/CORSAIR/pscale/starstone/bsp2-star.py` will be synced from the work-copy by the user (the previous CORSAIR version is being preserved as legacy under a renamed file).

Changes applied to bsp2-star.py:

- New `InvalidAddressError(ValueError)`.
- `parse_address(s)` returns `(left_digits, right_digits, had_dot)` — was `list[str]` from a dot-stripped string. Validates digit chars, rejects multi-dot.
- New `parse_spindle(spindle, floor)` returns `(digits, has_star)`. Floor-aware pad-left, strict reject when `had_dot && len(left) > floor`. Floor 0 lenient. Strips trailing zeros.
- New `format_address(digits, floor)` — canonical single-dot emit.
- `bsp()` dispatcher uses `parse_spindle`. Inner `collect` (disc) accumulates a digit list and emits via `format_address`.

Verify Python with `python3 tidy-up/test-bsp-parser.py` (83 tests including all the floor-growth cases). All three implementations now share the same algorithm; the discipline is "Python is canonical, TS+JS port from it" — restored.

## Test coverage

- **Python**: `python3 tidy-up/test-bsp-parser.py` (in hermitcrab-mobius-work) — 83/83 tests covering `parse_address`, `parse_spindle`, `format_address`, round-trip, floor-growth across 1/2/3/4, multi-dot reject, end-to-end via `bsp()`, disc emit canonical form.
- **TypeScript**: `npm run smoke:parser` — 102/102 tests (same coverage as Python plus a few extra cases).
- **TypeScript regression**: `npm run smoke:unit` — 22/22 existing tests still pass (sunstone/whetstone walk, write round-trip, etc.).
- **TypeScript sentinel**: `npm run smoke:sentinel` — sentinel registry unaffected.
- **TypeScript mock-beach**: `npm run smoke:wellknown` — 33/33.
- **JavaScript live federated**: `npm run smoke:federated-parser` — runs against live deployed beach. Tests multi-dot reject (400), floor-anchor write/read on a floor-2 block, wire-direct GET. Run AFTER deploying happyseaurchin.

## Risk assessment

**Low** for floor-1 blocks (the common case). The new algorithm matches the old for floor 1, since `floor > 1` padding doesn't fire. All existing sentinels (sunstone, whetstone, manifest, gatekeeper, etc.) are floor 1.

**Behaviour change** for floor ≥ 2 blocks with dotted addresses. Users explicitly verified there are no live blocks with grown floors, so no migration is needed. Going forward, addresses are floor-anchored as documented in sunstone:1.5.

**API change**: `parseAddress` signature changed (returns struct, was flat array). The `parseAddress` export is used internally by `parseSpindle` and externally by the probe script `scripts/probe-dot-anchor.ts` (which I updated). External callers of bsp-mcp don't import `parseAddress` directly; they go through `bsp()` or `bspRead`/`bspWrite`.

**Strict rejection**: addresses that previously walked silently to a wrong (existing) node now throw cleanly. This is desired behaviour — the silent-fail trap (whetstone:1.3) is closed.

## Status

All three implementations updated in lockstep, Python first as canonical:

1. **Python** (`bsp2-star.py` work-copy) — algorithm landed; 83/83 tests pass via `tidy-up/test-bsp-parser.py`. CORSAIR mirror to be synced by user; pre-2026-05-09 CORSAIR version preserved as legacy under a renamed file.
2. **TypeScript** (`bsp-mcp-server/src/bsp.ts` and `src/bsp-fn.ts`) — faithful port; 102/102 tests pass via `npm run smoke:parser`. Existing 22+33 regression tests also clean.
3. **JavaScript** (`happyseaurchin/api/pscale-beach.js`) — faithful port; syntax verified; live federated round-trip via `npm run smoke:federated-parser` runs after deploy.

CLAUDE.md updated to reflect "Python is canonical, TS+JS port from it" — the original discipline is preserved. The principle (addresses are numbers, not paths; emit and parse symmetric; strict at both boundaries) is now explicit.
