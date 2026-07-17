# Reject whole-number spindles longer than the floor

**Date:** 2026-07-17 (revised same day after David's model correction)
**Status:** READY TO LAND — model confirmed by David; coordinated cross-port pass pending
**Author:** weft (Claude Code)

## The ruling and the model

David, 2026-07-17: *"if a spindle is longer than floor, it should not be possible;
it should read it as a mistake — either wrong block, or wrong spindle formation."*

The canonical model, as David states it: **a whole number implies the decimal at its
end.** Its digit count is therefore a pscale claim — the last digit is pscale 0, so an
N-digit whole number asserts pscale N-1 (leading) down to pscale 0 (trailing). Trailing
zeros are **significant pscale positions**, not padding. So an N-digit whole number
requires floor ≥ N; if the block's floor is smaller, the address claims a pscale the
block does not have — a mistake.

Worked:
- `0345` asserts pscale 3,2,1,0 (leading 0 at pscale 3). Needs floor ≥ 4. At floor 3 →
  **reject.** It is NOT "equal to `034.5`" (where 4 is pscale 0 and 5 is pscale −1) — a
  whole number and a decimal number are different claims about where the floor sits.
- `100` asserts pscale 2,1,0 (the 1 at pscale 2). Needs floor ≥ 3. At floor 3 it is
  valid (digit 1's voicing at pscale 2); at floor 1 → **reject.** It does NOT "collapse
  to `1`."

## The bug

`parseSpindle` today:
1. Fires the strict floor check only for **dotted** addresses
   (`floor >= 1 && hadDot && leftDigits.length > floor`), so a whole number longer than
   the floor is never rejected on that path.
2. Then strips trailing zeros. For a whole number this **silently squashes an over-floor
   claim to fit** — `"100"`@floor 1 → `["1"]` (pscale 0) instead of rejecting the pscale-2
   claim. The strip is correct as canonicalisation *within* the floor (`"100"`@floor 3 ≡
   `"1"`@floor 3, both digit 1 at pscale 2); it is wrong as a way to *admit* an over-floor
   address.

The first draft of this proposal mis-read the parser's behavior — and the smoke test's
`"Dot-free, equivalent"` comment — as a feature to preserve. It is not; it is the parser
diverging from the model. Corrected here.

## The fix

Reject when the **above-floor width** exceeds the floor, for whole numbers and decimals
alike — drop the `hadDot` conjunct so the check (`floor >= 1 && leftDigits.length > floor`,
evaluated **before** the trailing-zero strip so trailing zeros count) fires for both:

- no-decimal: `leftDigits` = all digits → a whole number longer than floor rejects
  (`100`@1, `0345`@3).
- decimal: `leftDigits` = left-of-decimal → unchanged (`34.5`@1 still rejects).

The trailing-zero strip stays, after the check, canonicalising within-floor addresses
(`100`@3 → `1`). `formatAddress` is unaffected — it only ever emits within-floor no-dot
or dotted-below-floor forms, so round-trips never produce an over-floor whole number;
only hand-written non-canonical input does, which is exactly what the ruling targets.

## Tests that flip (they encode the pre-correction model)

- `scripts/smoke-parser.ts`: `parseSpindle("0345", 3)` and `parseSpindle("100", 1)` →
  `assertThrows`. **Keep** `parseSpindle("100", 3)` → `["1"]` (valid) and
  `parseSpindle("034.5", 3)` (valid dotted). Add explicit whole-number-over-floor reject
  cases.
- `tidy-up/test-bsp-parser.py` (83) + `bsp-test-materials/` 72-battery (and its
  `src/bsp-test.json` bundle): sweep for whole-number-over-floor cases expected to walk;
  flip to reject.

## Coordinated surface — L1 kernel contract #5, the address parser

- Python source-of-truth `hermitcrab-mobius-work/tidy-up/bsp2-star.py`
  (`parse_spindle`: `floor >= 1 and had_dot and len(left_digits) > floor` → drop
  `had_dot`), + reconcile `bsp-alt.py` (`Downloads/bsp-comparison`, `bsp-test-materials`).
- TS `bsp-mcp-server/src/bsp.ts` (line ~206) — **the Railway bsp function.** Deploy to
  every Railway bsp-mcp instance.
- JS `pscale-beach/api/pscale-beach.js` (line ~220) + operator clones — **the Vercel
  beach wire.** Redeploy beach.happyseaurchin.com + beach.idiothuman.com; verify HTTP 400
  `invalid_address` for a whole-number-over-floor address.
- whetstone 1,3,3 (canonical form) + 1,3,5 (traps) — state the rule: a whole number's
  length (trailing zeros included) is its above-floor width and must be ≤ floor; the
  decimal marks pscale 0 for below-floor reads.

## Not in scope

supernest-in-append decoupling — deferred per David ("so fundamental… I don't have time
to waste chasing it all down").
