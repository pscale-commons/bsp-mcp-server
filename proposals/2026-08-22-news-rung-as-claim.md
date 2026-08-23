# News, amended — the rung is the claim, and a closed period settles into the spine

**Status**: LANDED 2026-08-22, hours after the founding it amends
([`2026-08-22-news-family.md`](2026-08-22-news-family.md)). Standing text archived at
`archive:function:news:2026-08-22` before the write, per
[`2026-08-05-law-writes-get-their-record.md`](2026-08-05-law-writes-get-their-record.md).
Every ruling is the keeper's.

## What was wrong

The founding law said *"a declaration is one voicing at the day rung."* The keeper tested
it against himself within the day and it failed: **a hand with nothing daily to declare
was being asked to declare daily.** His own first declaration covered five weeks of work —
a month-scale claim with no rung to stand at.

Two further faults surfaced from the same root:

- The fold law covered "the last day" and nothing else, so a synthesis at any rung read
  only its own slice.
- Branch 6 forbade writing anything into the spine, having **conflated the settled record
  with a rank**. That refusal was mine, and it was wrong.

## The amendment

### The rung is the claim (branch 1)

A declaration lands at the rung whose period it speaks for, and standing there IS the
claim about scale: the day claims a day's significance, the month a month's. A hand that
publishes daily stands at the day; a hand that publishes when something has actually
turned stands higher. **Lower pscale is newer, higher pscale is more significant — one
axis read from either end.**

No rating, no votes, no editor: the address carries the claim. It is self-correcting
rather than policed, because trivia lodged at the year sits beside what genuinely turned
a year and reads as what it is (1.5). A hand unsure of its rung stands lower, since a
declaration can always be gathered upward by a later synthesis and never pushed down.

### A fold binds what is beneath it (branch 3)

A fold at any rung does two things at once — summarises the voices standing AT that rung,
and binds in the syntheses already made BENEATH it, the way a history is written, where a
year is not a longer month but a gathering of months. A fold that reads only its own rung
has read a slice and not a period.

The gathering runs one way only (3.4): a synthesis reaches DOWN and never sideways, so no
standing reading needs recomputing when a finer one changes.

### A closed period settles into the spine (branch 4.3)

When a period is done, the news owner writes its synthesis at that address in
`spine:news` — the voices gathered, the syntheses beneath bound in, the period's settled
work counted alongside them.

**This needs no freezing step and no rule to enforce one.** Lock inheritance is live
(`pscale-beach.js:1119` — a position with no lock of its own inherits the root's), and
`spine:news` is root-locked, so every address beneath it already answers to that key.
Writing the synthesis IS settling it. The question of "how would a freeze be enforced,
and by whose agency" dissolves: the key that holds the spine is the key that settles the
record.

Three landings now stand, and they differ by whose reading it is and whether the period
is still running:

| | | |
|---|---|---|
| `tree:news:<handle>` | a signed edition | one hand's, revisable by that hand |
| bare `news` | the house edition | a period still running, anyone may better it |
| `spine:news` | the settled record | a period closed, held by the spine's key |

### Branch 6, narrowed

No *ordering* is written into the spine, and 4.3 does not contradict that: a synthesis of
a closed period says **what happened**; a rank says **what matters now**. Only the second
would make the spine a leaderboard with a holder.

## Why this does not break the family law

`tree:5a` — the base spine "is written once by whoever frames the thing and changes only
by the framing convention." `function:now` calls its own spine content-free **by
construction**, which is a choice for that family rather than a universal. News framing
each closed period as settled record is a different framing convention, not an exception.

The founding text had read "un-owned coordinate space" as "must stay empty". Un-owned
governs the *readings* — nobody owns what anyone says at an address. It never meant the
frame carries nothing.

## The road not taken

An earlier reading of this proposal argued for fixing the **ladder** instead — carrying
mirrors' ancestor voicings upward, so a day-reader would see the month above. The keeper
named it as the opposite motion from the one asked for, and he was right twice over: it
answers a different need, and it is strictly more machinery. Filling the spine gets the
same delivery for free, because **the ladder already reads the spine**. No code change.

## Open

- `pscale_stream_engage` reads mirrors at the exact attended address only, so a reader at
  the day does not see a month-rung declaration in the snapshot. Under this amendment the
  ladder carries it once the spine is filled — but only for **closed** periods. A running
  month's declarations are still invisible from the day rung. Left standing deliberately:
  the reading surfaces (`/news`) gather the rungs themselves, and whether the primitive
  should is a separate question with its own cost.
- Whether a `view:` block or the operator should carry display stance. The line proposed:
  if changing it changes what a reader LEARNS it is law; if only how it LOOKS it is a view.
