# Address 0 in a reference is the root, spindle omitted

**Date**: 2026-09-08 · **Lane**: the orientation lane (watch:weft 266, intake 264, addendum 265)
**Law it implements**: `ways:orientation` 1.3 (weft's key, settled 2026-09-08)
**Status**: proposed — code complete, CI green, one open question for David at the end

## The fault, measured

`ways:orientation` 1.3 says, of a reference in a bundle:

> address 0 in a reference means the ROOT with the spindle omitted, never the underscore
> step — the door must read it so, because a literal 0 walks to the label

The door did not read it so. Measured this afternoon by firing the shell door as weft
(`pscale_play(world=beach, handle='weft', room='weft')`, unkeyed, 13:59Z):

| Section | Chars | Share |
|---|---:|---:|
| THE ROOM — `pool:weft` whole, 89 contributions since position 0, back to 2026-07-27 | 108,665 | 82% |
| YOUR OWN CONTEXT — the manifest compile | 8,399 | 6% |
| ORDERS SWEPT | 15,065 | 11% |
| **total** | **132,836** | |

**Six of weft's seven manifest slots returned the block's opening LABEL** — where keel's
window (addendum 265) measured four of seven. `daily:weft:0:0`, `purpose:weft:0:0`,
`task:weft:0:0`, `pool:weft:0:0`, `cook:weft:0:0` and `state-of-play:weft:0:-1` each
delivered one sentence and nothing beneath it. The two that carried real content prove
the rule: `passport:weft` is a bare name (no address, so `scoop` returns the block whole)
and `shell:weft:5:-1` has a non-zero address.

The shell has been waking blind to its own desk, journal, purpose, task list, parlour and
procedures for as long as its manifest has been in reference form, and reporting itself
oriented.

## The seam, read not inferred

`parseReference` (`src/genus.ts`) accepts `0` as an address because `ADDR_RE` is
`/^\d+(\.\d+)?$/`. `scoop` then tests `!ref.address` for the root path — and the string
`'0'` is truthy, so that path is never taken. `spark` walks `parseAddr('0', floor)`, which
left-pads to floor width and walks the underscore chain to the root voicing. The label.

## What changes

1. **`parseReference` normalises address `'0'` to `null`** — in both dialects, in lockstep:
   `src/genus.ts` and `genus-one/spark.py` (Python is the port's source of truth). `scoop`
   then hands `spark` a null spindle and the attention does its work: `pool:visiting:0:0`
   becomes the disc at pscale 0, which is the dashboard the bundle asked for.

2. **The stance completion's shallow point moves from `grips:0:0` to `grips:0:1`**, and
   `shallowLine()` unwraps a single-node disc to its line. See the collision below.

**This is not a walker change.** `parseAddr`, `parseSpindle` and `spark`'s walking are
untouched, and `bsp(spindle='0')` keeps meaning the surgical underscore write
(`orientation:weft` 9.1). The two readings are deliberately different: one is a hand-call,
the other is a reference.

## Why the grammar and not one door

The addendum offered two sites — "play.ts's manifest compile, or scoop". The grammar is
right because `ways:orientation` 1._ says a pulse keeps **the same organ** at `reflexive:9`
that a shell keeps at `shell:<handle>:3`. Fixing only the play door would make `name:0:att`
mean the root at a shell door and the underscore step at a pulse, for one organ — a fork in
the law, which is worse than a fork in code.

The parity constraint that guards this was honoured: `smoke:genus` composes the TS window
and `kernel.py --compose-only` against the same fixture and compares byte-for-byte, with
the Python run **live**. 53/53, `system byte-exact vs LIVE kernel run`. Pulses are unchanged.

## The collision, and the trade it makes

`grips:0:0` was the one place in the codebase relying on the reading this law overturns.
It is the STANCE completion's shallow point (#239), and it wanted **the block's own opening
line**. The other two shallow points (`open-commons:3:0`, `lodestone:1:0`) name a *branch*
and are unaffected.

Probed rather than guessed — `grips` is floor 1:

```
addr=null att=0 -> disc pscale 0 :: nodes:[0,1,2,5,…]      the dashboard
addr=null att=1 -> disc pscale 1 :: nodes:[{address:"", text:"ROOT LINE"}]   the root alone
```

So the root line is `grips:0:1`. **Name the trade honestly**: the old `:0:0` padded to floor
width and therefore found the root at *any* floor; `:0:1` is pinned to grips staying floor 1.
If grips ever supernests, that constant must be re-dialed. A comment at the site says so.

`scoop` returns `{"": "ROOT LINE"}` for that form — a one-key map, not a string — so
`shallowLine()` unwraps it. That keeps the registry's constants expressible as ordinary
addresses, which is the point of holding the address and never the text.

## The footgun this law creates, named rather than hidden

With the address gone and no attention to narrow it, **`name:0` bare is now the whole-block
read** — the most expensive call on the surface. Previously it returned the root voicing
line. No bundle should carry it; a test asserts the behaviour so it is at least visible.

## What this does NOT fix — the room, which is the 82%

`src/tools/play.ts:464` hardcodes `since_position: 0` on the room engage, so every arrival
at every door replays the whole parlour from its first slot. **Not touched here**, because
two positions of the law meet at it and I do not think they agree yet:

- 1.1 — the room pool and the passport ride every door **by construction**
- 1._ — the bundle names the routine's PRODUCTS "in place of the raw boards those products
  digest, because a board read whole is the cost the routine exists to pay once"

If the routine (step 2) digests the room into `solid:<handle>:1`, then the door inlining the
room whole is that cost paid at *every* door instead of once. Step 2 may dissolve it; it may
need its own ruling. **Fixing address 0 makes the window bigger before it makes it smaller** —
six labels become six dashboards — so the ~20k measure at `ways:orientation` 6 is not
reachable by this change alone.

## Sequencing — data follows code

Weft's own manifest is mis-dialed *by the law's own aperture rule* (1.3: accumulators at
their containers, or at the routine's fixed point). `daily:weft:0:0` should be
`daily:weft:0:1`, and so on. That re-dial is a beach write and takes effect immediately,
while this code needs a merge and a deploy — so the order is **merge, deploy, then re-dial**,
and I will re-dial and re-measure weft's arrival as the proof.

Until then `npm run smoke:play-hands` — a **live** probe, not part of CI — is red at
1,265,745 chars, because the new grammar meets the old dials: `daily:weft:0:0` now returns
the whole journal's disc instead of one label. That redness is the work item, not a
regression. Pre-deploy the re-dialed forms are harmless (a small ring); post-deploy they are
correct.

## Verification

- `smoke:genus` 53/53 — **byte-exact vs LIVE kernel run**, both dialects agree
- `smoke:compile` 66/66 — including five new assertions for this law
- Full CI offline suite (23 suites) green; `tsc` clean
- `smoke:play-hands` red by construction until the manifest re-dial (above)

## The open question, which is David's

`<name>:0:0` had two live meanings and this law picks one. The registry's meaning — "the
block's own line, at any floor" — is now expressible only as a floor-pinned form. If that
robustness matters more than the one constant it costs, the alternative is to fix the play
door and the genus door only and leave the grammar alone, accepting that the shell and the
pulse then read the same organ differently. I have built the grammar version because the law
says the organ is one. Say the word and I will cut the other.
