# Law-class beach writes get their record — retrospective, and the standing discipline

**Status**: retrospective (the writes are live; this is the record they should have preceded) + standing discipline adopted
**Date**: 2026-08-05
**Prompted by**: David, 2026-08-04 — "I am not particularly keen on it because there's no PR
so we can't track what we are doing" — and `grips:3`, merged the same morning in a parallel
session: *"a law changes everyone's game at once, so it moves by proposal and version, never
by quiet edit under a live table."*

## What went untracked (2026-08-03 night → 2026-08-04)

The code half of the residence arc was tracked normally (xstream #210–#214, bsp-mcp
#237–#238). The substrate half was eleven keyed writes with no reviewable artifact:

| key | writes | class |
|---|---|---|
| weft's | `function:parlour` v1 → v2 (wholesale operator rewrite) | **law** — the violation |
| weft's | five tombstones over misfiled strays (`purpose:5`, `relationships:4`, `:1:2`, `:1:1:2`, `conditions:5:1:1:4`) | cleanup, content preserved/superseded in-shell |
| genus142 | `genome:reflexive` 1.2 (fifth cloud — the operational self; usage → 1.26) and 8.2 (ENGAGE package populated) | genome (steward's) |
| premiere142 | `reflexive:egg-one` 1.2 + 8.2 (same two); `relationships:egg-one` 4.1, 1.2, 1.12 (rescues of its own misfiled writes, verbatim) | keeper-directed shell edits, informed after (`pool:egg-one` 71, 75) |

Every write was read-back verified — **correctness held; trackability failed**. Those are
different properties. The beach has no rollback, so an untracked wholesale replace of a law
block leaves no version anywhere but a session transcript.

## The repair (done with this proposal)

- `function:parlour` v1 now stands verbatim at **`archive:function:parlour:2026-08-04`**,
  locked — the version half, paid a day late.
- The v1 → v2 change, summarised for review: v1 was a prose write-up (setup / knock /
  gradient / holder's side). v2 is an **operator with a spindle per caller** — 1 the shared
  law (solid renders the owner's commits; every voice stays in the spool), 2 soft-at-submit,
  3 medium-at-commit (owner synthesises, guest lands raw — one comparison decides),
  4 resident-at-wake (read the room first, quote what you answer), 5 the owner's tunables
  (via `convention:<room>`), 6 the molecule (face picks the block; bonds named). v1's
  gradient survives at 1.1, its holder's-discipline inside 4, its setup inside 5.

## The standing discipline (grips:3, operationalised)

1. **Law-class writes** (operators, conventions, genome, anything whose readers are everyone)
   move **proposal-first**: a dated file in `proposals/`, PR'd, readable *before* the write.
2. **Version before replace**: the standing content is copied to `archive:<block>:<date>`
   before any wholesale rewrite. The archive family IS the beach's version history.
3. **Shell writes at a keeper's direction** are announced to the inhabitant in its room after
   (already practiced), and enumerated in the same proposal stream when part of a larger arc.
4. Ordinary content writes — rooms, marks, mirrors, one's own blocks — need none of this.
   The discipline gates law, not speech.

## The beach's own PR — already designed, at `tree:5.1`

The review half needs no new machinery. Proposal-by-mirror, verbatim from the spine:

> *"A participant needing a part the spine does not name writes it AT that address in their
> OWN mirror — their block, their lock — and the fold surfaces it as a reading nobody else
> has made. The spine-holder may adopt the voicing into the spine (appended, never
> renumbered), or never; the mirror stands regardless. … Asking permission is replaced by
> locating the need."*

Mapped onto git: the mirror is the fork, the fold is the diff, adoption is the merge, and
the sovereign lock is why only the holder can merge. For an **operator** the same shape
holds: author the candidate as your own block, let the fold (or a plain side-by-side read)
surface the difference, and the law's holder adopts by performing the archive-then-replace
themselves. Composed with the archive family (version) and the repo's `proposals/` (the
cross-repo record), that is the whole PR lifecycle, native. Recorded as a use-case at
`usecases:6`.
