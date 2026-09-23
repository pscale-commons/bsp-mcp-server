# The bolus envelope — the read-back law placed where it is due, and the next throw composed by the ack

> **Status.** BUILT 2026-09-23 (weft, Claude Fable 5.1 through Claude Code) at David's go, from the
> meta.1 step-back of 2026-09-22 on what "a pscale block inverts coding" means at each stratum
> (watch:weft 456; harness memory `feedback-follow-not-lead-compose-for-the-next`). Envelope work,
> admitted under the standing gate — *observably what is missing, and conventions have demonstrably
> failed to carry it* — and the demonstration is the record in §1. The surface stays twelve. No new
> law is written: both members placed here have stood as prose since August and run nowhere.

## 1. The record — how Claude Code actually calls bsp()

Every `bsp()` call in every transcript on the keeper's machine, grouped by assistant turn
(`npm run habits`; the script is `scripts/bsp-habits.py`). *Bundled* is the share of bsp-bearing
turns carrying two or more calls; *whole* is a whole-block read of a named block; *desc* is a walk
with its subtree or a point; *rungs* is the mean depth walked; *deep* is an authored write nesting
three or more rungs.

| month | turns | bundled | whole | disc | walk | desc | rungs | authored | deep |
|---|---|---|---|---|---|---|---|---|---|
| 2026-07 | 1,384 | 34% | 44% | 19% | 14% | 14% | 1.5 | 338 | 13% |
| 2026-08 | 2,200 | 35% | 25% | 25% | 32% | 13% | 1.8 | 411 | 8% |
| 2026-09 (to the 22nd) | 1,780 | 33% | 19% | 21% | 33% | 25% | 2.1 | 159 | 17% |

The three weeks around the one-call door (the one-call boot and the orientation rewrite, 2026-09-16):

| week from | turns | bundled | whole | desc | rungs | deep |
|---|---|---|---|---|---|---|
| 7 Sep | 464 | 49% | 26% | 17% | 1.9 | 15% |
| 14 Sep | 601 | 28% | 12% | 33% | 1.9 | 21% |
| 21 Sep | 519 | 21% | 13% | 31% | 2.4 | 6% |

What the record says. Whole-block reads stepped down twice — late July, as weft's room and shells
settled, and the week of the door, where they halved and held — so an envelope change moves the
habit within a week, measurably. Descent reads doubled after the door. The LLM's own bundling did not
improve, and fell after the door (consistent with the one-call boot absorbing the old boot's fan of
parallel organ reads — the column conflates what the LLM bundles with what the door compiles).
Authored depth has no trend: the fan fault dated 2026-08-12 is stable at roughly one write in ten.
And one cause sat in the currents themselves: `passport:weft`'s root — in every boot envelope — said
*"read the whole block before writing one key"*; the identity file said *spindle*.

Caveats: the record begins June 2026; it covers Claude Code lanes only, not the mirror, the doorman's
tier calls or the genus pulse; a deep write landing at a deep spindle is undercounted.

## 2. The two rulings this serves (David, 2026-09-22)

**Follow, not lead.** The biological inversion is about ownership, not accessibility: a code loop on a
drive is also "outside". With an orchestrator the loop is dyadic, A > B; with concurrency of equal
standing each follows the other and who leads is momentary and contextual. The first mind attends to
the next arrival rather than adding instructions, because the later arrival carries the more present
context — *lead accretes, follow attends*. A harness transcript is past-wise by construction; the
re-dial is future-wise. Everything an instance does is for the next instance.

**The bolus.** Peristalsis is swallowing: the bundle of spindles is the bolus, and the muscle ahead and
behind moves it — the bundle changes over time during loop-A thinking, rather than single calls in a
line. The reflex does not foresee (the weights were trained on call-then-check and heading-then-bullet),
so the envelope foresees for it.

## 3. What changes

**The muscle ahead — every read ack ends with what lies beneath.** A path-walk or a point whose
terminus has digit children closes with one line, `beneath (pscale P): 4.21 · 4.22 · 4.23`, the
children as full-width addresses a caller can fire verbatim and the aperture that descends into them.
Absent at a leaf; one child only names a stub at that rung. Walk+descent already shows the ring and
is unchanged. `src/bsp-fn.ts` (`beneath`, `beneath_pscale` on the read result; `formatRead`).

**The muscle behind — every write and append ack ends with the read-back.** After the beach admits a
write, the handler re-reads the block as it now stands and walks the deepest spindle of what landed —
the landed address extended by the payload's deepest chain — rendering it as the next reader receives
it, ancestors framing, the leaf whole. An append walks to its landed slot, so the containers above it
ride into view — an unvoiced container shows as the debt it is, at the one moment it is cheap to pay.
Gray writes are not walked back. Best-effort: a failed re-read never breaks the ack. `src/tools/bsp.ts`
(`readBackAfterWrite`, `readBackAfterAppend`); `readBackSpindle` in `src/bsp-fn.ts`.

**The currents.** `passport:weft` root re-voiced to *walk the whole spindle*; `orientation:weft` 7
carries the practice in its boot line and `7.8` is the spindle beneath it (the muscle ahead at 7.81,
behind at 7.82, the measure at 7.83); the weft identity file's boot line names it; CLAUDE.md's
reading line names it. All written 2026-09-23 under weft's own lock, read back to four rungs.

**The instrument.** `scripts/bsp-habits.py` — `npm run habits`, `--weekly`, `--since`, `--project`.
`smoke:envelope` joins the offline CI gate.

## 4. What this does not do

- It does not make shallow blocks deep. It makes shallowness visible at the moment of writing, where
  depth can be paid; depth itself is the author's act (well-formed, transpose-and-extract).
- It does not reach the doorman's tier calls: those receive a compiled frame and hold no tools. When
  the frame is later composed to end the same way, the same measure applies.
- It adds no order book, runner or primitive. Order-and-collect (grit 7.4) stands; this is the
  peristaltic form of the ordinary call.
- Under the honed-bundle law both members enter by demonstrated failure (§1) and roll back if an error
  follows — each is one line of envelope, scooped from the live block, never hard-coded text.

## 5. Acceptance

One week after deploy, `npm run habits -- --weekly --since 2026-09` against the rows above. Targets:
bundled turns up, whole reads down again, rungs up, deep authored writes above a quarter. If nothing
moves, the lever is not the envelope, and the record will say so rather than the feel of it.
