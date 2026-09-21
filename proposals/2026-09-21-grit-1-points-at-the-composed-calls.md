# grit 1's opening line points a seat at the composed calls

**Status**: ruled by David, 2026-09-21 — *"yes to 1 — edit grit 1's opening line"* — and made in this PR
**Date**: 2026-09-21
**Lane**: rpg.10-A, the semantic-flow diet (watch:weft 433; the question stood at task:weft 14, and before that at watch:weft 432.5 finding 2)
**Class**: law — `pscale:grit` branch 1 is what every room of a table delivers to an LLM-app seat at its first engage; under the ratchet (`npm run smoke:grit-tree`, the delivered spine < 1,450 words)

## The question, and the ruling

On 2026-09-19 David ruled that every door runs the same composition: *"it shouldn't matter what portal, the gameplay
should be similar from llm-app, mirror or o-page or group … everything beach-side should be about soft-medium-hard llm
framing."* The mirror, the character page and the group page have run the router's tier calls since 2026-09-20. The one
door still on the loop from before the tiers was the LLM app, because the law it is DELIVERED — the room mounts
`pscale:grit/1` — still told it to render from its own envelope and commit its own half, and named `tier=` only at
grit 2 and 3, outside the delivered aperture.

The question put to him: should grit 1's opening line tell that seat to run the composed calls — `tier='soft'` for its
telling, `tier='medium'` to make it happen? **His answer: yes.**

## The line

**Stood** (74 words, as the ratchet counts them):

> THE CHARACTER TURN — you ARE the handle: them, never their narrator. Each turn, in order: PERCEIVE from your position (1.1); RENDER the lived moment (1.2); you may STAGE a preview (1.3); COMMIT your own half as the beat — the commit IS the act (1.4); then CATCH (1.8). Moving is four steps (1.5). Only a genuinely uncertain act with a real cost is a check (1.6 → branch 2). The player's seat: 1.7.

**Stands** (77 words):

> THE CHARACTER TURN — you ARE the handle: them, never their narrator. Each turn, in order: PERCEIVE from your position (1.1); RENDER the lived moment (1.2): engage with tier='soft', tell the moment as it directs, journal where it says; STAGE what the player intends (1.3); at their word MAKE IT HAPPEN (1.4): engage with tier='medium', write the one beat it asks, commit with its claim; then CATCH (1.8). Moving is four steps (1.5). The player's seat: 1.7.

It is his play model in the law's own five verbs: two acts for a player — **say** (STAGE, vapour to liquid) and **make it
happen** (liquid to solid) — and the telling derived for each player by their own LLM.

## Under the ratchet — and a correction

The delivered spine stood at **1,446 of 1,450 words**, so the headroom was **four words** — not the seventy-four weft told
David when asking (that figure was read off the check's own message, which still quotes the count from the July
re-authoring; the law has been amended since). The line therefore had to DISPLACE, and does: three words heavier, the
spine now 1,449. What it displaces is carried elsewhere and loses nothing:

- *"Only a genuinely uncertain act with a real cost is a check (1.6 → branch 2)"* — 1.6 stands whole on the delivered
  spine beneath it and closes *"To resolve, wear branch 2"*; and the composed `tier='medium'` call carries 1.6 and
  branch 2 to the voice that resolves.
- *"you may STAGE a preview"* becomes *"STAGE what the player intends"* — staging is the default act (1.3, and the
  rhythm line every engage carries), never an option.
- *"COMMIT your own half as the beat — the commit IS the act"* — 1.4 says it in its own line; and under the composed
  call the beat weaves the whole window, which "your own half" mis-taught.

Nothing beneath 1 is touched: 1.2, 1.4 and their children keep the mechanics the composed calls stand on.

## What makes the pointer work — two lines in the composed sections, one in the rhythm

Pointing a seat at the composed calls is only honest if those calls tell a seat that is **its own door** how to act on
them. A doorman or a mirror splits the sections and acts in code; an LLM app is the voice and the hand, and nothing told
it what to do with a closing `WAY` line (it would have committed `WAY 110` into the record and never moved) or where a
telling is kept.

- **THE CLAIM** closes with: *"a seat that is its own door: commit the beat with pscale_pool_engage(contribution=…,
  resolves_window and resolves_seen as above, each left out where it reads none). A closing WAY line is WALKED, never
  committed: leave it off the beat — that beat is the leaving — then write passport:3 with its address and re-enter by
  pscale_play (grit 1.5)."*
- **THE JOURNAL** closes with: *"a seat that is its own door: keep the telling by bsp(block=<organ>, append=true,
  content={_: <the telling>, 1: <the handle>, 2: <location>, 3: <now, ISO>, 4: 'character'}, secret=<the character's
  key>) — located, so no door tells this beat again."*
- **THE RHYTHM**, the reminder every engage of a directive room carries, names the composed calls too — at a table's
  room only, since a tier has no meaning anywhere else — so a seat that compresses the law away does not fall back to
  the old loop.

The three-section contract is unchanged: every door's parser reads its own keyed lines (`resolves_window:`, `way:`,
`actor:`, `organ:`, `location:`) and passes over the rest. Pinned in `genus-one/test_doorman.py` for the doorman; the
mirror's `claimOf`/`journalOf` anchor on the same keys at line start.

## What this does not do

- It does not give an LLM-app-only table a keeper. The keeper follows a beat only where an enrolled doorman stands in
  the room; that is said plainly on /rpg (happyseaurchin-home #293) and is the second track's question.
- It does not touch the habitat package's seed copy of grit (`pscale-beach/seeds/library/grit.json`), which is already
  its own older version and is not what any room mounts.

## Tests

`smoke:grit-tree` (22 — the ratchet at 1,449), `smoke:tiers` (71 — the delivered line, the seat-as-door lines with the
keyed lines undisturbed, the rhythm at a room), `smoke:room-fold`, `smoke:pool-engage`, `smoke:play-split`,
`smoke:parser`, `genus-one/test_doorman.py` (109), `tsc --noEmit`.
