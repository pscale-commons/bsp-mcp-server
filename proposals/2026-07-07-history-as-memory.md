# History is the agent's memory — lossless at pscale 0, auto-summaries above

**Date**: 2026-07-07 · **Status**: PROPOSED (David's specification, 2026-07-07; this document pins it) · **Scope**: genus-one kernel contract (route/fold + window dial) — three ports move in lockstep

## The discrepancy (verified in code and substrate, 2026-07-07)

David's specification: *history is the memory of the agent — a lossless account of
every output at pscale 0, accumulating auto-summaries at pscale 1 and above; whatever
notes the entity wants to make are notes/stash, not history.* The window feed for
continuity: *the last few outputs in the current pscale-0 bracket, plus the summaries
nesting per pscale* — his worked example: in a floor-3 history, address `143` walks
the first pscale-2 summary (voicing of branch 1), the fourth pscale-1 summary
(voicing of 14), and the current outputs 141/142/143 locate the instance.

What the kernel actually does (`genus-one/kernel.py` route(), lines ~834-841):

1. Writes `"[ts] note"` — a one-line string — at flat slots 1-9 of `history`.
2. When slot 9 fills, `slot=None` and the note is **silently dropped**. Memory stops.
3. Captures nothing lossless — the fold's content survives only in the local
   filmstrip (nest-side); the shell keeps the one-liner.
4. The window dial (`reflexive:9` slot 6) is bare `history` — whole block. Fine at
   eight entries; floods as the block grows; never the spindle-of-summaries shape.

Meanwhile the substrate already declares David's model: `history:<handle>`'s own
underscore promises "*as it fills it supernests and compacts, the coarse summaries
rising to the top so that a single spindle carries the whole arc*", and
block-conventions 3.2 specifies wrap-with-+0-summary. The kernel under-implements
its own shell's contract. This document closes the gap.

## The block shape

Two candidate geometries; **the digit-bracket ladder is recommended** because it
matches David's `143` walk literally and makes the feed a native spark shape:

- **(A) digit-bracket ladder (recommended).** Brackets are digit children at every
  level. A floor-3 history: top digits 1..9 are pscale-2 eras, each `_` a +0
  inductive summary of the era; their digits 1..9 are pscale-1 brackets, each `_`
  a +0 summary; their digits 1..9 are pscale-0 leaves — one leaf per wake, lossless.
  Growth: leaves fill 141→149, then bracket 15 opens; brackets fill 19x, then era 2
  opens; eras fill, the block supernests (floor 3→4) and the whole prior tree
  becomes era 1 of the new floor. The spindle to the newest leaf IS the summary
  chain (spark's spindle mode voices each depth); the ring at the newest leaf IS
  the recent outputs. Every entry stays pscale 0 forever (floor grows around it).
- **(B) root-chain wrap (block-conventions 3.2 as written).** Wrap {_: old} at
  capacity, summary at the wrap's underscore, new entries restart at 1..9. Old
  content addresses as 0-prefixed; summaries read as a disc at each positive
  pscale, not as the newest leaf's spindle. Workable, but the feed needs disc
  reads and the walk does not pass through the summaries.

If (A) is confirmed, block-conventions 3.2 gains a note distinguishing the
history archetype (digit-bracket, summaries at bracket voicings) from the marks
archetype (root-chain wrap) — design follows intent, per sunstone 9.

## The entry (pscale 0 — lossless of OUTPUT)

One leaf per wake. The `note` is not banished — it becomes the leaf's voicing (the
+0 line); the lossless body sits beneath as digits, spine-legal (rendered text,
never JSON-stringified blobs — the beach shape gate forbids those):

    <leaf> = { _: "[ts] <note>",
               1: "wrote <block:addr> ← <content, rendered verbatim>",
               2: "wrote <block:addr> ← <content…>", …,
               8: "γ this wake: <addresses> · heartbeat <s> · index <kept|re-dialed>" }

Lossless means the OUTPUT (the fold: every write with its content, note, heartbeat,
index change, status) — not the input window, which stays in the local film (the
film/trace split survives; see reconciliation below). Deliberate agent notes that
are not wake-records belong in `stash`/notes blocks, as David specifies.

## Auto-summaries

When a bracket's ninth leaf lands, the bracket's `_` must become a +0 inductive
summary of its nine. Who writes it:

- **Bare pulse (kernel holds a key)**: a single cheap compaction call (haiku tier)
  at wrap time — kernel-mechanical, precedented by last-touched stamping; rides the
  wake that filled the bracket; never a standing daemon.
- **App door (pscale_genus fold, no kernel key)**: the fold ack that closes a
  bracket returns "bracket <addr> closed — write its summary at history:<addr> in
  your next fold"; the calling LLM (already paid-for) provides it. The next window
  shows the headless bracket regardless — an honest gap the wearer can see.
- Era summaries (pscale 2+) compose the same way from bracket summaries.

## The window feed (the dial, not kernel composition)

The window stays a bsp read of a bundle. Slot 6 becomes a nested slot:

    6: { _: "history:<newest-leaf-address>",        ← spindle: every summary down the ladder
         1: "history:<newest-bracket>:<ring-attn>" } ← ring: the last few outputs + bracket head

The newest-leaf address moves; the fold maintains it mechanically when it writes
the leaf (kernel-owned dial bookkeeping, same class as last-touched — the LLM may
still re-dial it away deliberately via index). Cost: the window carries the whole
arc in ~a dozen voicings plus the recent leaves — David's "elegant, minimal,
effortless"; no new machinery, only spark shapes that already exist.

## Reconciliation

- **Trace convention (project:genus-one present 1.3)**: superseded in part — the
  thin beachside trace was designed while the shell kept nothing; with lossless
  outputs in-shell, the trace's identity-residue role is filled. The film (full
  window+output frames) stays local/animator. Settle or re-scope 1.3 accordingly.
- **history:<handle> voicing**: update the genome's history block to describe this
  shape (it already promises the compaction; it should stop saying "one entry per
  closed gap, note-only").

## Rollout (three ports, one contract — parity discipline)

1. **genus-one/kernel.py** — route(): leaf-write (lossless body + note voicing),
   bracket/era advance, wrap-at-capacity, summary call (key path), dial upkeep.
   Genome: history voicing + slot-6 nested dial. Parity fixture regenerated.
2. **bsp-mcp src/genus.ts (genusFold + compose parity)** — same changes; the fold
   ack carries the bracket-closed summary request; smoke-genus-parity extended
   with a wrap case.
3. **xstream src/kernel/genus/animator.ts** — same route changes.
4. **pscale-biome src/agent (canonical upstream)** — the same contract in the 0-9
   dialect; the genus-one kernel is a PORT and must not fork: the change lands
   upstream-first or in the same movement.
5. **egg-one migration** — one-time reshape of history:egg-one (8 flat notes + the
   foreign object at 7) into bracket 1 of the new shape, preserving every entry
   verbatim; the foreign object stays (the sensitivity experiment is part of the
   history). Keeper-authorized.

## Non-goals

No retention policy (lossless means lossless; supernest is the compaction).
No new tool surface. No kernel composition parts — the feed is a dial.
