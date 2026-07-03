# Pscale-of-location — movement carries a grain (design note)

**Status:** design, not built. Flat pscale-0 rooms remain for now. This is the settled
direction for the "move function," to build as the next increment (next session).
**Date:** 2026-07-01
**Related:** move-teach (#98, shipped — flat room-to-room via `passport:3`); pool-from-location
(#96); the parked mutual-`*` move function (prior handover); the location *sign* axis
(virtual=address / real=+pscale / fantasy=−pscale, not yet implemented).

## The two things bundled in "move"

"Move" bundles two separable ideas; only one is the lever.

1. **Admin / mutual-`*` handshake** — the character block points to the place (`passport:3`),
   and the place block points back to its occupants (character-addresses via `*`). Buys the
   place a *perspective* and O(1) co-presence instead of the passport scan
   (`play.ts:coPresentCast`). Real, but it is an index over what is already true — enrichment,
   not a model change. Separable; secondary.
2. **Pscale-of-location** — location has a *grain*, because the spatial address is a pscale
   address. This is the actual lever, and it is mostly already latent in the substrate.

## Current flat state

`passport:3` carries `…spatial:<world>:<addr>`. `play.ts:passportLocation()` extracts it as a
bare integer:

```
const m = p3.match(/spatial:[\w-]+:(\d+)/);   // (\d+) — flat, pscale 0 only
```

Pool derivation, co-presence, and the room all key off that flat integer. "Room" is pscale 0;
nothing finer or coarser is expressible. Movement = rewrite `passport:3` to another flat
integer = jump room→room, pool→pool, all at pscale 0.

## The generalization

Un-flatten the address and location gains a pscale:

- **pscale −1** — within a room, around a table; minute-to-minute (what pscale was originally
  designed for).
- **pscale 0** — the room; a handful of co-present agencies; ~5–10 min.
- **pscale +1** — the town; cross it in a step.
- **pscale +2** — the region / a day; "rest here, done."

Moving up/down pscale is the **same write** as moving sideways — just a coarser or finer
address into `passport:3`. The substrate already carries the rest:

- **co-presence** = same address;
- **containment** = address prefix (`64` table sits inside `6` room);
- **pools** already key on the address at any pscale (`pool:6` room, `pool:64` table, a coarser
  pool for the town).

### The payoff — S↔T coupling

Moving **up** a pscale is zoom-out **and** fast-forward in one act. "Rest the day at the town"
is a single pscale-2 beat; nobody plays room-to-room through it. This collapses D&D's three
separate time subsystems — encounter (10-min turns), travel (day-per-hex), downtime (weeks) —
onto **one** pscale axis. No separate time system is added; location carries its pscale and the
geometry orchestrates the compression. This is the implicit orchestration the STI coordinates
were reaching for.

## Cross-pscale coordination (the hard part, smaller than it looks)

The genuine cost: players operating at different pscale at once. Three regimes:

1. **Lower-pscale wins / fold up** — the finer scene resolves first, then is absorbed into the
   coarse beat.
2. **Mid-level determiner** — a resolver at pscale N folds the pscale-(N−1) intentions and
   pulls the finer players into the coarser resolution.

**1 and 2 are the same mechanism from two ends:** a coarse window cannot close until the finer
beats beneath it fold up, and whoever closes it *is* the determiner. This is exactly today's
window + CONSOLIDATE (GRIT branches 2 and 3), generalized **one pscale step** — a window at
pscale N gathers the resolutions at pscale N−1 across its spatial subtree. Keep **"one now"**
and it stays honest: a pscale-2 "spend the day" beat gates on any live finer beat in its
subtree — waits, absorbs, commits. Reconciliation only bites when two co-present players
*choose* different pscale simultaneously, and the gate is the answer.

3. **Split / block universe** — the only genuinely different regime. Higher-pscale events are
   pre-authored canon; finer players read them as *constraint* and interweave around without
   altering them (Middle-earth with several events already determined). This needs authored
   coarse canon (a `frame:`, +sign / solid, already-determined) and a read-only-constraint
   discipline for fine play. **Deferred** until a world actually needs it. Part of the "XYZ
   settings" (block-universe vs shared bleeding-edge now).

## Implementation shape

- **Addressing (small):** un-flatten `passportLocation()` to keep the decimal / full pscale
  address; let pool derivation, co-presence, and containment use the full address. The
  move-teach directive (grit clause 4b) already writes `passport:3`; it just needs to permit a
  pscale address, not only a flat integer.
- **Resolution (the real work):** generalize the window / resolve / consolidate loop one pscale
  step — a coarse window subsumes the finer subtree; first-committer / stand-down and
  CONSOLIDATE already exist; extend, do not invent.
- **Mutual-`*` (separate):** optional enrichment; do after, if the passport-scan co-presence
  proves too slow or the place needs its own perspective.

## Decision & sequencing (2026-07-01)

- Run the current HITL convergence test **FLAT** (pscale-0 rooms) — it only tests two players
  landing in one pool; orthogonal to this.
- Build **pscale-of-location** as the next increment (next session): addressing first (small,
  verifiable), then the window-across-pscale generalization.
- Keep **one now**; defer block-universe.
- Mutual-`*` handshake after, as enrichment.
