# formatAddress under-emits above-floor runs — the '1' ≡ '001' collision

*2026-07-20 — filed from the round-2 HITL disaster. Author: weft. Status: PROPOSAL — the walker law says Python first, David's eyes first; the live hazard is already closed surface-side (movableAddress in pool.ts).*

## The defect

`parseSpindle` (canon, correct): a dot-free address SHORTER than the floor left-pads with zeros — at floor 3, `'1'` walks `_._.1`. The village is `'100'` (trailing zeros are padding, stripped in the walk).

`formatAddress` (defective): strips trailing padding then emits short — `['1']` at floor 3 emits `'1'`. So **two different walks share one string**: `format(['1']) = format(['0','0','1']) = '1'`, and `parse('1')` resolves it to the 0-walk. Any surface that emits a formatted above-floor address as something to copy hands the reader the wrong world.

## Measured consequence (round 2, live, two humans)

The ways digest emitted `[1] The Village`. A player's seat copied `'1'` into a move; the party walked into the root underscore's hidden 0-space; finding nothing, a seat authored a "village hall" at `_._1.1`; both passports ended at `'11'` (= `011`); an entire session ran in the mirror-world while the authored village stood unreached one digit away. The register-sweep's root notes (AUTHORING, SCENARIO STATE) sat exactly where the collision lands players — the leak the sweep existed to prevent, delivered by the sweep's own companion digest.

## The fix (kernel-adjacent — hence this proposal, not a patch)

`formatAddress`: for digit runs at-or-above the floor, strip trailing zeros only down TO floor width (the padding within floor width is semantic); keep leading zeros on 0-walks. Emissions become: `['1']→'100'`, `['1','2']→'120'`, `['0','0','1']→'001'`, full-width and dotted forms unchanged. Round-trip becomes injective: distinct walks, distinct strings.

Touches the L1 kernel's contract 5 neighbourhood ("emit is symmetric"). Lockstep required: `bsp2-star.py` first (canonical), then `src/bsp.ts`, then the beach handler; `test-bsp-parser.py` (83), `smoke:parser` (102+), and the BSP-TEST battery (72) re-run everywhere; any battery fixture that pins a short emission updates WITH the law.

## Interim (already live surface-side)

`movableAddress` in pool.ts right-pads every address handed out as copyable (ways digest, place-walk labels) and keeps 0-walk zeros honest. The core stays untouched until this proposal is judged.
