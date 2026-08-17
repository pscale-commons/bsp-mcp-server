# The personal tree — where a kept synthesis stands (2026-08-15)

**Status: adopted in principle by David (happyseaurchin) in session, 2026-08-15 — "yes to
archive option to history… If this matches your 2,3,4 — do them." This file is the dated
record the law-writes discipline requires; the code change rides the same PR.**

## The settlement

The spine molecule's synthesis level completes as a two-by-two that was one cell short:

|                | reading                      | synthesis                         |
|----------------|------------------------------|-----------------------------------|
| **mine**       | `V:<handle>` (the mirror)    | `tree:V:<handle>` ← this proposal |
| **ours**       | the snapshot (computed, no block) | bare `V` (homesteaded, keeper-locked) |

A **personal keep** of a fold now lands at its own address in `tree:<field>:<handle>` —
the holder's own tree of syntheses, latest-standing, revisable exactly as a mirror is,
superseded by the holder's next fold of the same point. On a temporal spine this is
self-dating: the fold of August lives at August. The name is David's call ("I don't
think solid:V:<handle> is right but tree:V:<handle>"), and it rhymes with the family's
own vocabulary: the bare `V` is the collective tree; `tree:V:<handle>` is yours.

`history:<handle>` returns to being the shell's diary. A fold that matters as a
*moment* may still leave a pointer line there — by the holder's own hand, citing the
address — but the standing synthesis lives at the address, where the next reader looks.

## Losslessness is a choice, never a default

Mirrors and both tree levels hold only the latest. That is the design, not a gap: the
family's memory organs are the pool (social, appending, never revisable) and the
**archive convention** — `archive:<block>:<date>`, copy-before-replace — for keeps that
are deliberate. No automatic `history:V` accumulation is introduced; the pool era taught
what unchosen accumulation costs. David, adopting: *"Archive fits my original design
philosophy."* Two forward notes recorded with it:

- The daily beach snapshots (CORSAIR volume) already hold the full sequence of every
  block's states, so archives need not bloat the KV — the relationship between
  snapshot-history and in-substrate archives can be settled when a real need arrives.
- When the RPG shifts from pool to stream, this archive-on-choice pattern is the
  expected bridge for what the spool used to remember.

## What changes where

1. **`src/tools/stream.ts`** (this PR): `keep='personal'` writes
   `tree:<field>:<handle>` at the attended address (block born on first keep with a
   TREE root voicing; holder's secret governs, same as the mirror), replacing the
   `history:<handle>` append that #247 first landed. Envelope text and parameter
   descriptions updated to match.
2. **`function:beach-venture:4`** (David's key; candidate text staged at
   `function:beach-venture:weft:4` per tree:5.1): the fold clause's personal sentence
   becomes — *"Kept personally a fold stands at its own address in tree:beach-venture:
   \<handle\> — the holder's own tree, latest-standing, superseded by their next fold of
   the same point; a fold that matters as a moment may also leave a pointer in
   history:\<handle\>, by the holder's own hand."* The collective sentence stands as is.
3. **`ways:deck` 2.5** (weft's key): the coupling law, stated once as the general rule —
   a deck names the spine it feeds in its own operator; a spine never names a deck.
   No operator-of-operators layer is introduced.

## Two possibilities recorded, not built

- **Stacked operators.** David suspects operators-on-operators will evolve — "a higher
  level of operator", possibly *the LLM instance itself as that operator*, possibly
  already implicit in the genus-one shell (the concern loops working ON the organs that
  themselves work on content). Noted as a live possibility; the present law stands:
  couplings are declared by the pointing molecule's own operator, and `ways:` blocks
  already sit one level above `function:` blocks as the general law operators
  instantiate — the mild, existing form of the stack.
- **The general lives as law, not place.** There is never a "spine in general" to
  visit — only specific families — but the general is real at the convention level:
  `ways:deck` is the general deck, `function:backcast` the general clock-spine.
  Renderers follow the same split: few and generic, reading every behaviour from
  operator dials and view blocks; instances many and specific, all substrate.
