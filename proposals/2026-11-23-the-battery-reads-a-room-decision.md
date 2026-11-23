# The battery reads a decision in a room around a proposal

**Date**: 23 November 2026 · **Status**: in a bsp-mcp PR, open for David, not merged; nothing on the beach was changed · **Lane**: room-decisions.1, weft (Claude Code, a cloud session from the Claude app), taking up the card anyone-lists.1 queued, 'Teach the proposal battery room decisions' · **Companions**: `function:proposal` 3 (amended 21 November 2026), `spine:determinacy` 4.8, `spine:leros-phase-three` 5.8, `spine:power-with` 4.8, `proposals/2026-11-23-anyone-lists-a-proposal.md` §6, `proposal-test` 2, 2.1 and 7, `proposal.html` (`roomsOf`, `decisionsOf`).

## 1. The gap

`function:proposal` 3 was amended on 21 November 2026 at David's word:

> "A side-room may carry a decision of its own at its 8, and so may a room around the proposal, the root's 2 to 7, for a question asked beside the steps rather than on one of them: the standard view draws it open in that room with its card and counts it with the rest, and the text reads it whole (David's word, 21 November 2026; spine:determinacy 4.8 and spine:leros-phase-three 5.8 the first)."

The standard page follows it. `proposal.html` builds `STEPS = stepsOf(SPINE); ROOMS = roomsOf(SPINE); DECS = decisionsOf(STEPS, ROOMS);`.

The battery didn't. Its `steps_of` and `decisions_of` read only each step's 8 and its side-rooms' 8. So:

- PLACED called a decision at a root room's 8 "a decision where no page reads one", and failed it.
- Such a decision was never checked for WHO, WORDS, HOLD, SPELT, QUESTION or SHORT, nor its answers (ANSWERS), nor the crafted page holding it (CARDS).

It was seen on 23 November, comparing the battery with `listed.js` for the anyone-lists record (§6). `live determinacy` gave `FAULT decisions/PLACED 4.8`, and `live leros-phase-three` gave `PLACED 5.8`. That session queued the card. David asked whether to start it, and weft said yes (`history:weft` 539).

## 2. The port

`proposal_form.py` carries a port of the pages' own readers (its README, "Why it reads as the pages read"). Two more join them:

- **`rooms_of(spine)`**, from `roomsOf`. It reads the root's 2 to 7, each as a side-room is read. A room whose 8 opens `DECIDE` carries a decision at `<k>.8`, read by `decisionOf` like any other, under the room's title.
- **`decisions_of(steps, rooms)`**, from `decisionsOf`. It takes each step's decision and its side-rooms', step by step, then the rooms'.

A family reads its rooms when it is read, so every test that reads decisions reads theirs too: SPELT, QUESTION, WHO, WORDS, HOLD, SHORT, ANSWERS, and the page's CARDS. The head line counts them, as the page does.

PLACED is still a FAULT anywhere else. Its detail now names the third place: "a step's 8, a side-room's 8, or the 8 of a room around the proposal, the root's 2 to 7".

`READERS` follows four more passages of `proposal.html`, so a live pass prints `reader moved` if one changes:

- `for (var k = 2; k <= 7; k++) {` with the line after it, `var r = spine && spine[String(k)]; if (r == null) continue;`. `stepsOf`'s side-rooms open their loop with the same first line, so the pair pins the range to `roomsOf`.
- The room's decision: `decision: /^DECIDE\b/i.test(d8) ? decisionOf(under(String(k), '8'), d8, s.title) : null });`.
- The rooms half of `decisionsOf`: `(rooms || []).forEach(function (r) { if (r.decision) out.push(r.decision); });`.
- The page's own wiring: `STEPS = stepsOf(SPINE); ROOMS = roomsOf(SPINE); DECS = decisionsOf(STEPS, ROOMS);`.

**Proved against the page.** Eleven readers and five constants were lifted by name from `proposal.html` (`voiceOf`, `textOf`, `under`, `split`, `cap`, `decisionOf`, `stateOf`, `pointsOf`, `stepsOf`, `roomsOf`, `decisionsOf`). They ran in a bare node context over every listed family's spine, beside the port:

- 65 families, 419 steps, 153 rooms around a proposal, 375 decisions: 0 differences.
- Three rooms carry a decision: determinacy 4.8, leros-phase-three 5.8, and power-with 4.8, which the card didn't name.

## 3. What the battery says now

Every listed family was checked twice, by the battery before and after, both reading the same cached copy of the beach, so only the code differed. Of 65 families, 3 moved and 62 didn't:

| Family | Before | After |
|---|---|---|
| determinacy | NOT WELL FORMED: `FAULT PLACED 4.8`; 7 decisions | WELL FORMED; 8 decisions |
| leros-phase-three | `PLACED 5.8` among its faults; 5 decisions | no PLACED; 6 decisions. Still NOT WELL FORMED, by its own faults: a STATE at 1.19, and thread:44's knots |
| power-with | `PLACED 4.8`, and HOLD at its five steps; 6 decisions | `HOLD 4.8` beside the five; 7 decisions |

experience-points is still WELL FORMED, with 10 decisions. No followed line has moved: each stands in the live page.

power-with 4.8 is the first room decision the battery has checked. It fails the way its steps do: words of its own (SEEN, NOT SO, ADD or TEST) with no NOT YET, which `function:proposal` 3 says a decision keeps as its hold. keel founded the family "with comment points rather than decision points" at David's word (`spine:power-with` 9), as an inquiry (`function:power-with` 7). Its law's 2 counts seven points, and so does the battery now.

## 4. Tests

- **The clean family.** harbour-bell gains a room around the proposal at its root's 4, THE GULLS, with a decision at 4.8 asked of dana. Its law's 2 names it, dana's mirror answers it (GO), and the crafted page holds it (`data-dec="4.8"`). It is still WELL FORMED with no WARN, now with 5 decisions. The old checker fails it with `FAULT decisions/PLACED 4.8`.
- **Two more planted faults** in `mutation.py`:
  - *Words of its own with no hold in a room around the proposal, as found at power-with 4.8*: HOLD, a FAULT. The old checker misses it and reports PLACED instead.
  - *A question beside the steps at the root's own 8*: PLACED, a FAULT. The root's 8 is no room (`function:proposal` 2 names the root's 2, 3 and 9), and no page reads a decision there.
- **96 planted faults, all caught**; `run-proposal-tests.py` passes. Against the old checker, the room case is missed and the clean family fails.
- **The offline smoke suite** passes as CI runs it, `smoke:proposal-test`, `smoke:sentinel`, `smoke:wellformed` and `smoke:compound` among it. Five suites need a pscale-beach checkout beside the repository and couldn't run here: colour, private-room, derived-latch, signin and pass. None of them reads this battery or its sentinel.

## 5. The sentinel

`src/proposal-test.json` follows the code:

- 2 reads each step's 8, each side-room's 8 and the 8 of each room around the proposal.
- 2.1 says where PLACED holds, and names the root's own 8 among the places no page reads.
- 7 states 96.

These changes are under `src/`, so merging redeploys the router and ends every live MCP session (`railway.json`). Merge it at a quiet moment. Once it is on main, weft's daily check (`wake:weft` 6.31), which fetches the battery from there, reads room decisions too.

## 6. Owed

- **power-with's points.** All seven fail HOLD under `function:proposal` 3, because they are comment points by David's word, not decisions. That is David's to settle. Either an inquiry's comment points keep NOT YET too, and keel adds it to the seven, or the law and the battery let an inquiry's points go without it.
- **`listed.js`** reads a decision only at a step's 8 and its side-rooms' 8 (its own `decisionsOf`), so the page's check never reads a room's decision. arcade-credits.1, which is bringing `listed.js` to the battery's own faults today at David's word (`thread:138.112`), was told at the beat. Nothing here changes `listed.js`.
- **The anyone-lists record** (§6) called determinacy's fault "the battery's own lag". This closes it. That record stays as it stood.
