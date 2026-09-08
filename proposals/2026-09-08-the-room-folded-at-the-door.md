# The room, folded at the door

**Date**: 2026-09-08 · **Lane**: the orientation lane (watch:weft 266/268)
**Ruling**: David, this afternoon — "deliver a pool at the door the way the mirror folds it —
closed containers as their summary lines, the open container whole, the holder's marker
honoured where one exists; that is the fix for the 82%."

## The 82%

Firing the shell door as weft returned 132,836 characters, of which **108,665 (82%) was the
room** — `pool:weft` delivered whole, 89 contributions since position 0, back to 2026-07-27,
doorbell wiring probes from a month ago carried verbatim. `src/tools/play.ts` engaged the room
with a hardcoded `since_position: 0`, so every arrival at every door replayed the whole parlour
from its first slot.

## The fold

An accumulator already stores what a door needs. Entries sit at floor-width zero-free
addresses, older ones absorbed under wrapped underscores and read by left-padding ("7" at
floor 3 reads as "007"). So an entry's **container** is its padded address minus the last
digit, and the containers in order are the eras of the room. Everything before the last is
closed and stands for itself through its voicing — which is exactly what the zero-slot summary
is *for*: "a summary is NAVIGATION, not decoration" (`block-conventions:3.5`). The last
container is still filling, so it rides whole.

`foldContributions()` in `src/tools/pool.ts` does that and nothing else; `play.ts` passes
`fold: true`.

### The rule that had to be read, not assumed

The summary of a span does **not** live at that span's own container. Zero-slots are `+0`
inductive, each over the *previous* completed nine — "10 summarises entries 1-9", and address
`10` is node `1`'s underscore. So container N's voicing summarises the span **before** it.
`pool:weft` is the live proof: container `01`, which holds entries 011-019, carries
*"Summary of 01-09"*. I had it wrong first time and the fixture caught it.

### An owed summary is shown, not hidden

Where a closed container's summary has not been paid, the fold names the span and says the
summary is owed, rather than emitting a blank or quietly dumping the entries. `pool:weft`
stood with containers 2-9 unvoiced when this landed (`orientation:weft` 9.2.6) — a debt the
room should show at every door, since the door is the one place it will actually be seen.

### The marker

Folding applies only when the caller has **no** marker (`since_position === 0`). A holder who
carries one is already reading a delta, and their marker is honoured untouched. Located views
(`at=`) are left alone too: their slice is narrow by construction and their containers are not
the fold's.

## Measured, against the live room

```
unfolded: 105,674 chars
folded:     7,229 chars   (93.2% smaller)
```

Container 1's substantive summary rides through intact; the nine unpaid ones report their
debt in a line each; the open container is whole.

## Verification

- `npm run smoke:room-fold` — 12 assertions, new, added to CI
- Full CI offline suite green; `tsc` clean
- Live fold of `pool:weft` measured above

## What this does not change

The pool primitive's own default is untouched — `pscale_pool_engage` folds only when the door
asks it to, so every existing caller reads exactly as before. No new primitive; the surface
stays twelve.
