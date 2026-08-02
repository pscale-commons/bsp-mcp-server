# Liquid field 2 — the accumulator family agrees on *where*

**Date**: 2026-08-02
**Status**: LANDED
**Touches**: `bsp-mcp-server`, `pscale-beach` (+ operator clones), `xstream-bsp`, `happyseaurchin-home`

## The settlement

A liquid slot's fields are now:

```
{_: text, 1: who, 2: where, 3: when (last-touched), 4: face, 5: woven, 6: arrival}
```

Fields 1–5 are the **accumulator family's shared five** — identical in `marks` (branch 9.1),
in a pool contribution (`4.22`), and in a liquid slot (`4.51`). Liquid's one extra field, the
immutable FIRST-STAGED arrival stamp it needs *because it overwrites where the others append*,
takes **6** rather than displacing a shared position.

Previously field 2 held the arrival stamp and the address-of-attention rode 6.

## Why this was not a client drift

Field 2 carried the address-of-attention from the beginning. The 2026-07-15 revise fix
(NHITL round 2 §2a — a player who revised their line lost their place in the queue) needed an
immutable arrival stamp and took field 2 for it, moving the address to 6. That change
**half-landed**: `block-conventions` and `pscale_pool_engage` followed it; xstream never did.

The evidence: at the time of settling, **every liquid slot on the beach carried an address at
field 2** and not one carried an ISO stamp there. The convention described a shape no live data
had. `at=` (#222, 2026-07-29) then reasoned "field 2 there is the arrival stamp; the address
rides 6" — accommodating the occupant rather than choosing the position.

## What the fork was costing

Four live faults, all one root cause. None had been reported; three were silent.

1. **No age on any staged voice at `/view`.** The `liquid` lens read field 2 as the arrival
   stamp; `ago()` returns `''` on a non-date, so a 21-day-old stage and a 30-second-old stage
   rendered identically. `view:beach-board` lens 6 is a liquid lens — the flagship page.
2. **MCP-staged liquid invisible to xstream peers.** `readLiquid` filtered
   `(field 2) !== addressFilter`; a slot staged via `pscale_pool_engage` put an ISO stamp there,
   so it never matched and never rendered. An agent and a human in the same room could not see
   each other stage.
3. **The stage-vs-claim race guard was inert.** The beach's `window_moved` check did
   `Date.parse(slot['2'])`; for every slot xstream ever wrote that is `Date.parse("pool:X")` =
   `NaN`, so `moved` could never become true. The guard that exists to stop a staged act being
   silently dropped by a fold it arrived after had never once fired.
4. **The address filter had to branch on block family** — `4.52` read literally: "on field 6 for
   liquid slots, field 2 for pool/marks entries". Two addresses for one semantic; every future
   reader pays.

## Why 2 = where wins

The family already agrees at 1, 3, 4 and 5. Only 2 was broken. Aligning it completes the set,
so a coordinate is read at one position across every accumulator and `4.52`'s filter stops
branching. The genuinely liquid-specific field is the *second* timestamp — pool and marks need
one because they append; liquid needs two because it overwrites — and a family-specific field
belongs at a family-specific position.

The alternative (make xstream conform to arrival-at-2) fixes faults 1–3 with less churn but
leaves fault 4 standing: it would make the disagreement consistent rather than settle it.

## The discriminator is shape, never `Date.parse`

`Date.parse("2026")` is a valid year. `2026` is also a valid temporal spine address. Any
"is this a timestamp or an address" test built on `Date.parse` silently eats temporal
addresses. The test used everywhere here is `/^\d{4}-\d{2}-\d{2}T/` — a stamp carries dashes
and a `T`; a pscale address is a bare digit run. The beach reuses its stricter
`isIso8601DateTime`. Covered by a smoke assertion.

## Migration: none owed

Readers accept every shape while the buffers turn over:

- **arrival** → field 6; else field 2 *when it is ISO-shaped* (the 2026-07-15 slots); else
  field 3 (last-touched).
- **where** → field 2, treating an ISO-shaped value as absent (that slot reads unlocated, not
  as junk).

**Liquid self-migrates**, because a slot is overwritten whole on every restage. No sweep, no
lockstep deploy — each repo is independently correct against old, new and mixed buffers.

## Changes

| repo | change |
|---|---|
| `bsp-mcp-server` | `block-conventions:4.51` + `4.52` (the settlement); `pool.ts` — `arrivalOf()`, writer moves to `2=at / 6=arrival`, revise preserves arrival at 6 (and carries a legacy stamp over from 2), mirror filter reads `address` not `at`, `PoolContribution.at` → `.arrival`, tool description; 9 new smoke assertions (106 pass) |
| `pscale-beach` + `-happyseaurchin` | `window_moved` guard reads 6 then ISO-shaped 2 — the guard becomes live for the first time |
| `xstream-bsp` | writer stops putting the block's own location at 2 and writes arrival at 6, preserved across a revise (`liquidClaimDigit` now returns `{digit, arrival}` — no extra read); `liquidArrivalOf()`; `readLiquid`'s exact-match location filter **dropped** — it landed 2026-05-13, one day before per-address liquid blocks (2026-05-14) made it a tautology, and outliving that it was the only thing pinning field 2 to the location; `liquidSweepUser` + `clearLiquidAtAddress` slot shape |
| `happyseaurchin-home` | `view.html` — `liquidArrival()` in the `liquid` lens |

## Verification

- `npm run smoke:pool-engage` — 106/106, including the three shapes and the temporal-address trap.
- `tsc --noEmit` clean in both TS repos; `npm run build` clean in xstream.
- `liquidArrival` run against the live beach: every staged voice that rendered blank now
  renders its true age — `first-meets` 2d/3d/2d, `JulieJ` 3d/3d, `beach-venture` 21d,
  `happyseaurchin` 9d.
- `/view?spec=beach-board` renders with no console errors.

Not verified live: a slot written in the settled shape end-to-end, since the deployed bsp-mcp
still writes the old one. The field-6 path is covered by unit assertions only until deploy.

## Deploy order

Any order — the tolerant readers make each repo independently correct. Conventional order is
bsp-mcp (Railway) → xstream (Vercel) → happyseaurchin (Vercel) → beach clone (Vercel).
