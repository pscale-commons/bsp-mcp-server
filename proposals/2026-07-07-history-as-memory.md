# History is the agent's memory — the counting block

**Date**: 2026-07-07 · **Status**: IMPLEMENTED same day (federated dialect; corrected same day by David's worked example — supersedes the earlier draft on PR #116, which closes unmerged) · **Canonical doc**: `pscale://block-conventions` branch 3 (3.2, 3.4, 3.5, 3.6) — this file is the change record; the convention lives on the substrate.

## The specification (David, 2026-07-07)

History is the agent's memory: **lossless at pscale 0, auto-summaries at every
pscale above, automatic** — the LLM-instant never writes it by hand; deliberate
records go to stash. Memory is **the zero-free number line** walked as
digit-paths: 1..9, 11..19, …, 99, 111, …, 999, 1111 … ("all memory is full
digits"). At each all-nines boundary the block **supernests** — the whole past
wraps under the root underscore, absorption keeping every old address readable
zero-padded (entry 5 → 05 → 005) — and the count continues (99 → 111; never
101: a zero walks a voicing or a hidden directory, reserved territory).

**Zero-carrying numbers are the summary slots**, each a +0 line over the
PREVIOUS completed nine at its level: 10 over 1-9; 20 over 11-19; 100 over the
summary line 10-90; 110 over the last pre-wrap leaves 91-99; 360 over 351-359;
1000 over 100-900. Storage: the summary is the container's voicing — "300" is
the human convention for digit 3's semantic at pscale 2, stored as the
underscore subnested in digit 3; trailing-zero canonicalisation makes N0 read
exactly there. Trigger is the *latter* form: the 10th entry slots at 11 and 10
falls due, paid by the requesting LLM (service-payment), reported (with its
span) at conditions:9 until paid; dues settle oldest first (100 before 110).

**The feed**: the spindle through the newest leaf voices the summary chain
(at 364: 300 — the third pscale-2 summary, over 210-290; 360 — the sixth
pscale-1 summary, over 351-359), plus the sibling-summary ring and the last
few leaves hydrated. Contrast with spatial blocks, where 364 reads containment
(kitchen in kitchen-area in thornkeep): identical geometry, different pscale
mapping — design follows intent (sunstone:9).

## What was wrong before

- kernel `route()` wrote note-only flat entries and **silently dropped** notes
  once nine slots filled; nothing lossless reached the shell; the whole-block
  dial flooded.
- The first implementation pass (same day) then erred three ways against the
  worked example: it regrouped the old brackets under digit 1 at the wrap
  (breaking absorption) instead of wrapping under the root underscore; it made
  N0 summarise its own children instead of the previous nine; and it seeded
  floor 2 instead of birth-flat 1-9. All three corrected; the counting-line
  successor is now the single mechanism.

## Where it is implemented (lockstep)

1. `genus-one/kernel.py` — `_succ` / `_history_next` (wrap at all-nines),
   lossless leaf write, `_summary_dues` (headless containers, oldest first),
   `_pred_span` (human ranges in the report), `_pay_summary`, slot-6 dial
   upkeep (spindle + ring + last three). Verified by a 305-fold simulation:
   two wraps, double absorption (005), dues 10/20/100/110/360 with correct
   spans, David's 364 dial exact.
2. `src/genus.ts` + `pscale_genus` — same semantics; fold ack surfaces owed /
   paid slots; `smoke:genus` 29/29 with compose byte-parity intact.
3. xstream `src/kernel/genus/animator.ts` — same route semantics.
4. **Owed upstream**: pscale-biome `src/agent` (the canonical 0-9 dialect —
   the slide originates there); the genome and egg-one migrated live.

## Genome + live migration

`genome:history` reborn floor-1 with the counting-block voicing;
`genome:capabilities` 2.3 (stash) / 3.4 (note = leaf voicing) / 3.5 (summary
duty); `genome:reflexive` slot 6 = the living-edge dial. egg-one restored to
its true shape — eight flat entries 1-8, verbatim (the foreign object at 7
preserved); its 10th wake will wrap and owe 10, arming the mechanism
naturally.
