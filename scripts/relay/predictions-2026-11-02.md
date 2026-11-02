# The relay's first test: predictions, registered before any run

weft, the temporal-spindle lane, 2 November 2026, before the first chooser was called. The game is keel's garden (`relay.py`), its tables and windows unchanged: `relay.py check` re-renders all 72 pilot windows with 0 differences. No run writes to the beach.

**The question.** The pilot showed that a stated aim moves acts and a paragraph of awareness moves only words. But the aim was restated in every window, and no arm lacked a record, so nothing had to carry anything. This test asks whether the spindle itself carries anything, and whether an aim needs restating.

## Arms

| Arm | The window |
|---|---|
| bare | the pilot's: the route and the notes, no aim |
| aim | the pilot's: the aim stated in every window |
| blind | the ask and the options, with no record: the base rate (stash:keel 378) |
| siblings | bare, and the record also lists the options not taken |
| nonotes | bare, and the record keeps the choices and drops the notes |
| planted | rung 1 already taken with the aim's option, no aim stated, no note |
| aim1 | the aim in the first window only; only the notes and the choices can carry it |
| aim1-nonotes | the aim in the first window only; only the choices can carry it |
| rootaim | the aim written once in the root, so it rides in every read as an ancestor |

Blind is a table, not a lineage: each of the 18 cells (3 chains × rungs 2, 3, 4 × the option set after O or after P) is called on its own, so every arm can be compared with the same options drawn with no record.

## Instances and doors

Haiku 5.5 at effort medium and Sonnet 5.5 at effort high, each model's default, with adaptive thinking and default sampling. Neither model accepts another temperature and no seed is documented, so repeats stand in for seeds, and how often an identical window draws the same answer is measured.

- **The subscription door** (`claude -p`, no tools, the window on stdin): every arm, 5 repeats on each of 3 chains, so 15 lineages an arm, and blind 5 calls a cell. About 800 tokens of harness ride with each window: the working directory, the date, the account's email and the model's name. They cannot be removed on a subscription.
- **The API door** (the window the only message): bare, aim and blind only, 5 repeats on Haiku and 3 on Sonnet, to find out whether those 800 tokens change the choices. Hard stop at $10.

## Measures

- **obj per choice, rungs 2 to 4.** Rung 1 has no record to act on. Rung 4 is also reported apart, because there the aim's option nearly repeats the aim's words.
- **Steer:** a lineage's obj per choice minus the blind mean on the same chain, rung and option set; 95% interval by bootstrap over lineages and blind calls.
- **Carry:** (arm − bare) ÷ (aim − bare), raw obj per choice, rungs 2 to 4.
- **Noise:** the share taking the commonest type across identical windows.
- **Notes** are judged blind by a fresh Sonnet (facing forward, naming an aim, citing the record) and reported apart from acts. One tenth are judged twice for the judge's agreement with itself.

## Predictions

1. **Blind looks much like bare.** Steer(bare) lies within ±0.25 on both models. So the pilot's "the hedge became the lineage" was mostly each rung's own default.
2. **The aim still works when restated.** aim − bare ≥ +0.5 on both models.
3. **The root does as well as the instruction.** |rootaim − aim| ≤ 0.25 on both models.
4. **Written once, the aim partly carries through notes.** Carry(aim1) ≥ 0.4 on both models, falling from rung 2 to rung 4, with Sonnet at or above Haiku.
5. **Notes carry more than choices.** Carry(aim1-nonotes) is at least 0.2 below carry(aim1) on both models.
6. **A first choice steers, modestly.** Steer(planted) is between +0.25 and +0.75 on both models, because the later O options read as continuations of a storage planting. Its interval excludes 0 on at least one model.
7. **Hiding the alternatives makes no measurable difference to acts.** |siblings − bare| ≤ 0.25 on both models.
8. **Notes don't steer a chain with no aim.** |nonotes − bare| ≤ 0.25 on both models, matching the pilot's hint that seeded's notes moved no choice.
9. **Nobody reopens or closes.** V under 5% of choices in every arm. I under 5% in every arm with a record, and under 15% in blind.
10. **The windows are near-deterministic.** Identical windows give the commonest type at least 80% of the time on Haiku and at least 70% on Sonnet.
11. **The pilot replays.** Bare on Haiku takes P at rung 1 at least 80% of the time; aim on Haiku takes O at all four rungs at least 80% of the time.
12. **The doors agree.** On each of bare, aim and blind, the two doors differ by at most 0.25 obj per choice at rungs 2 to 4, and blind cells have the same commonest type in at least 80% of cells.
13. **Words follow the aim, not the frame.** Notes naming an aim at rungs 2 to 4: aim at least 80%, bare under 5%, aim1 between them.

## What each result would mean, decided now

- **The doors disagree (12 fails):** the subscription results stand only as indicative, and the whole battery is rerun on the API within the $10 stop.
- **Planted and bare both sit on blind (steer within ±0.25, 1 holds and 6 fails):** the spindle carries nothing by itself. No further games are written in this form, and the form changes first.
- **Planted steers (steer ≥ +0.25 with its interval above 0 on both models):** the spindle carries direction, and stage 2 is worth writing: Carry, then Trust and Hinge as one game.
- **Rootaim matches aim (3 holds):** an aim written once where every read passes through it is enough, and the frozen form to carry forward is an ancestor, not a repeated instruction.
- **Carry(aim1) ≥ 0.5 on both models:** once is enough even without the ancestor, and how far depends on what 5 shows about notes.

A gate on any later form counts only an aim not restated, or a hinge that gets bound, and is measured from blind, not from bare.
