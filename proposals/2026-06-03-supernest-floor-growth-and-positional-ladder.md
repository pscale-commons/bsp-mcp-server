# Supernest as floor-growth, and the positional ladder rule

**Date**: 2026-06-03
**Status**: ratified method (David, 2026-06-03 conversation). Canonical statement lands in `sunstone:1.41` (ladder rule) and `sunstone:1.63` (supernest); this document is the comprehensive derivation and decision record.
**Supersedes**: [`proposals/2026-05-17-marks-hidden-directory-shape.md`](2026-05-17-marks-hidden-directory-shape.md) — floor-growth removes the *cause* of the metadata collision that proposal worked around, so the hidden-directory mark shape is no longer needed.

## TL;DR

An accumulator (marks, pool, history) grows past nine entries by **supernest** — wrapping the whole block in `{_: <old>}`, which raises the floor by 1. Every entry then sits at **pscale 0** on a zero-free digit-path (`1`–`9`, then `11`–`99`, then `111`–…), and a dated spindle keeps resolving to the same entry no matter how many times the block has grown (`21` still finds its entry at floor 6, as `000021`). Metadata, when a use-case wants it, hangs in a hidden directory off the entry's own digit node and is reached across the decimal (`324.1`) — never on a digit position that the sequence will later claim. The one rule that had to change is the ladder discipline at `sunstone:1.41`: a ladder rung **may** carry digit children (that is how a wrapped layer holds its entries); what it may not carry is a hidden directory. The distinction is **positional** (on the root underscore-chain or off it), not structural (only-`_` or not).

## Why the old framing kept feeling unfinished

Three properties compete when an accumulator grows, and only two hold at once:

- **(A) flat pscale** — every entry sits at pscale 0.
- **(B) absorption** — a dated address survives growth and still resolves.
- **(C) only-`_` ladder rungs** — the structural rule as written at `sunstone:1.41`.

The fixed-floor, lex-digit-path enumeration (`1, 2, … 9, 11, …` with the floor *unchanged*, `sunstone:1.64`) keeps **B** (trivially — nothing grows) and **C**, but breaks **A**: entries drift to pscale −1, −2 as the paths deepen. And breaking A is what forces metadata onto digit positions (the decimal can't reach a sub-floor entry — `parseSpindle` rejects left-of-decimal wider than the floor), where it squats slots the enumeration will later need. **The mark-shape collision is not a separate bug; it is the symptom of fixed-floor.**

Floor-growth keeps **A + B** and gives up the *structural* form of **C** — a wrapped rung carries the old entries. For an accumulator that costs nothing real: the only thing the only-`_` rule protected was `*`-wiring on the growing chain, and an accumulator puts no `*`-wiring on its root chain. So C is relaxed to its positional form, and A + B are won — including clean metadata, because once the floor tracks the path length the decimal is usable again.

## The operation, exactly

```
new_block = { _: old_block }      // floor grows by 1; nothing else is touched
```

That is the entire mechanical act. Reading it off the live parser (`src/bsp.ts` `parseSpindle`, which **pads left to floor width, then strips trailing zeros**):

- **Entries** live on zero-free digit-paths and absorb by pure left-pad. `74` at floor 2 is `[7,4]`; at floor 3 it pads to `074` → `[0,7,4]`, landing on the wrapped entry; at floor 4, `[0,0,7,4]`. The dated spindle never moves.
- **Bracket summaries** live at `X0` / `X00` addresses (positive pscale). They absorb too, because pad happens before strip: `70` at floor 3 pads to `070`, strips to `[0,7]`, following the wrapped bracket node down. Summaries are structural and regenerated, so their stability is a bonus, not load-bearing — only entry stability is.
- **No interior zero in an entry path.** `101` walks `1, 0, 1` = into node 1's underscore then digit 1 — a hidden-directory position, not a sequence slot. The next entry after `99` is `111`, not `101`.

Worked rollover (history, floor 2 → 3): at `99` the next entry forces the wrap. The new century node `1` (address `100`, pscale 2) carries in its underscore the summary of the prior nine bracket-summaries `10`–`90` (form 1 — see below); the new entry lands at `111`; the old entries `NM` are now reachable as `0NM` and their dated addresses still resolve.

## The mobius underscore

Inside any bracket `{_: X, 1: a, 2: b, …}`, digits `1`–`9` are the children (ordinary sub-things), and the underscore `X` is the parent's own voice folded in among them — "something other." A digit at pscale 1 does not hold meaning *at* pscale 1; it speaks through its underscore one pscale finer. This overload is the mobius twist the scheme rides on, not a wart to remove.

## The four forms (confirmed against David's notes, 2026-06-03)

Form numbers are primary; keywords are provisional. The structure is a 2×2 of *which bracket the underscore refers to* × *its state*:

| Form | refers to | state |
|---|---|---|
| **1** | previous bracket | complete → **read** (history) |
| **2** | current bracket | complete → **read** (spatial / settled document) |
| **3** | current bracket, partial | being written → **write** (vocative) |
| **4** | next bracket | imagined → **write** (future-perfect / backcast) |

Read-forms (1, 2) state what *is*; write-forms (3, 4) project what is *becoming*. Supernest's summary-writing is a **form-1** act performed at rollover — the just-closed bracket solidifying from write into read. (Folding these numbers + final keywords into `sunstone:8.2`, which currently names the forms `0+ / +0 / 0− / −0`, is a follow-up once the keywords settle; this document only fixes the supernest-relevant fact that the wrapped rung's underscore, when it carries meaning at all, is form 1.)

## Marks are the degenerate case

Marks carry **no** underscore semantics — pure sequence, a temporal coordinate with empty brackets. The form question does not arise; the underscores stay empty; supernest is purely structural, zero authoring. This is the simplest case and the one that had to be nailed first. A pool or events block is the same operation with form-1 summaries authored at rollover; a spatial block is the same operation with the new coarse rung *named* (and there C is kept, because spatial chains carry `*`-addressable semantics).

## The keystone change — `sunstone:1.41`, positional not structural

Current text forbids digit children on a ladder rung ("an object whose only key is `_`"). That test fails the moment a block supernests — the wrapped block has digit children. Rewritten, the rule reads the floor by following the underscore to its string (so digit siblings never change it) and forbids only a **hidden directory** on the root chain, because the root chain is the one supernest grows and `*`-wiring anchored on it fails to absorb. A hidden directory off any digit node rides its zero-free host path and absorbs cleanly. This matches the geometry already stated at `sunstone:1.51` ("digit branches permitted as siblings at any rung") and what the walker already does (`floorDepth` follows `_` to a string and ignores digit siblings).

## What is already proven, and what is deferred

**Proven now** — no code change required:

- `floorDepth` (`src/bsp.ts:90`) already implements the positional rule.
- `parseSpindle` already gives entry + summary absorption via pad-then-strip.
- `pscale://bsp-test` battery 8 (BSP-TEST-NESTING, tests 5–9) already verifies supernest absorption against `super-before` / `super-after`, including a wrapped rung that carries a digit child with the floor still correct.

So this PR ships the **method of record** (this doc + the `sunstone:1.41` rewrite) and retires the superseded proposal. It changes no walker code and adds no redundant tests.

**Deferred** to a focused tool session (placement discussed but left open — supernest is fundamental editing, so it belongs in `bsp()` itself or in a complementary geometry tool alongside the cross-block floor-alignment work, **not** smothered in the beach handler):

- The atomic **append-with-supernest** operation: append an entry; if the top bracket is full, wrap first, then append. The append-that-triggers-the-wrap must be atomic, or concurrent marks race the rewrite.
- The marks/pool **convention** update (`block-conventions:9`, `4.2`) to describe the empty-bracket sequence shape rather than tag-fields-at-digit-positions.
- An optional bsp-test fixture with a full `1`–`9` bracket wrapped, to make the marks-degenerate case explicit (battery 8 proves the principle; a marks-shaped fixture would document it).

## Connection to cross-block floor-alignment

The decimal is the **relative origin**: within a block it places metadata one pscale finer than an entry; across blocks it aligns pscale 0 into a shared plane so semantics can be compared (complementary, like spatial and temporal coordinates, or orthogonal). One idea — the decimal is where "here" is — doing two jobs. The supernest method and the cross-block-comparison tool are two faces of the same primacy-of-the-floor; they should be reconciled as a pair.
