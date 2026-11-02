# The way of a test: how anyone makes a battery for a new kind of molecule

**Date**: 2 November 2026 · **Status**: decided by David ("Yes, both") and written the same day · **Lane**: mistake-proofing.1, weft (Claude Code, Opus 5.5, on the Mac) · **Companions**: `ways:testing`, `proposals/2026-11-02-proposal-test.md`, `pscale://proposal-test`, `pscale://thread-test`, `ways:thread` 8, `ways:plug` 5.

## 1. The ask

David, 2 November, once `proposal-test` was under way:

> "then we need to set up a test way for creating tests for molecules that people create; or it should be included within each of the ways already -- a section on testing them. Does this make sense?"

Asked which, and answered that it should be both because they do different jobs: "Yes, both".

## 2. What stands now

- **`ways:testing`**, new, under the shared project lock: nine steps read down its 1, for whoever makes a new kind of molecule. Look for a battery first; take the cases from the law and from what reads the thing; say who decides each; grade each by what is lost and try them on what stands; prove each form case fires; stand it in one block; name it where a maker reads; hand it to a fresh reader; write a program only if the words run out.
- **A section in each way that makes something**, saying what well formed means while the thing is being made:

| Way | Where | Makes | Decided by |
|---|---|---|---|
| `ways:founding` | 5 (new) | a family | reading, and compound-test's form pass |
| `ways:games` | 4 (new) | a game's briefing | a fresh reader; no program can |
| `ways:views` | 6 (new) | a `view:` page | reading, as `view.html` reads it |
| `ways:stills` | 8 (new) | a picture in a book | reading, as `gallery.html` reads it |
| `ways:arcade` | 7.1 (new; 7 keeps its text) | a game in the arcade | `ways:plug` 5 |
| `ways:authoring` | 3.3 (new) | anything authored | names the batteries; play still decides |
| `ways:proposal` | 1.11116 (new) | a crafted page | `proposal-test` |
| `ways:thread` | 8 (already there) | a thread | `thread-test` |
| `ways:plug` | 5 (already there) | a plugged game | its ten checks |

- **`function:proposal` 7**, step (5), now runs the battery before listing, with the standing text at `archive:function:proposal:2026-11-02`. `ways:proposal`'s standing text is at `archive:ways:proposal:2026-11-02`, and `ways:arcade`'s at `archive:ways:arcade:2026-11-02`. These close §5 of `proposals/2026-11-02-proposal-test.md`.

The sections add a digit and replace no text, so `ways:founding`, `ways:games`, `ways:views`, `ways:stills` and `ways:authoring` have no archive copy; removing a section restores the block.

## 3. Two decisions

**The cases stand in a block of their own, `test:<kind>`, not on the law.** David was first told they would stand on the molecule's own law. They can't: 33 of the beach's 144 laws have all nine digits taken, `function:proposal`, `function:thread` and `function:schematic` among them, and a test grows as it meets new faults. So a kind's test is one block under its maker's own key, at the positions `proposal-test` keeps (1 to 5 the smaller batteries, 6 the reader's cases, 7 the planted faults, 8 what it found, 9 how it runs), and the law's making step names it. No block on the beach was named `test:` before this.

**Words first, a program only if the words run out.** Sentinels change through this repository and redeploy the server, which would make David or weft the gate on every new kind. A block of cases any mind can walk has no such gate. A kind's own program, where one earns its place, lives in its maker's own repository, as `proposal_form.py` shows the shape of one.

## 4. Tried before it was set here

Fresh Claude Haiku minds, each given only the draft and a law, each told to write nothing to the beach, as `ways:thread`'s drafts were tried. No API key was spent: they ran as this session's subagents, about 1.2 million tokens for the first three.

| Mind | Law | Cases | Planted | What it reported |
|---|---|---|---|---|
| 1 | `function:schematic` | 41 form, 8 reader | 41, all fired by hand | Two of its own cases did not fire as first worded, and it fixed them: the step works by hand |
| 2 | `function:look` | 28 form, 4 reader | 29, all fired by hand | A fault in `look:weft`, below |
| 3 | `function:thread`, barred from `thread-test` and `ways:thread` | 23 form, 4 reader | 12, all fired by hand | A fault `thread-test` does not look for, below |

Mind 3 is the control, scored by hand against `thread-test`'s own planted faults: its cases catch 7 of the 11 (WAITS twice, OPENED, REGISTERED, CROSSING, SHORT, KNOTTED) and miss DIGITS, ROOTED, CONTIGUOUS and OFFERED. DIGITS is a sentence in the law's last positions, and the others are shapes the law implies rather than states.

All three minds stumbled in the same places, so the draft changed:

- It never said how to read a `pscale://` name. All three guessed the raw path; the root now gives it.
- It never said how to find a kind's reader or keeper, or what a public read can't show. `1.13` now does: an empty position answers 200 with null, a missing block 404, a world is its own surface, a page may answer 200 for a name that doesn't exist, a latch can't be seen.
- "Loses a reader something" was undefined. A FAULT now means a reader gets the wrong thing or nothing, and "when unsure, WARN".
- "The positions every battery keeps" was false, since `thread-test` keeps others. It now says the positions `proposal-test` keeps.
- A reader's case has no break to plant, a break may fire two cases, and a rule newer than an example can't fault it. Each is now said.
- To reach what the law implies: read to its last position, write down what it says must never happen, and treat a rule for where the next thing goes as fixing a shape.

A fourth mind tried the second cut on `function:thread`, cut short to two threads: 15 form cases and 5 reader cases, one break each. It caught 6 of the 11: WAITS twice, OPENED, REGISTERED, SHORT, and CONTIGUOUS, which the shape line was added for. It missed DIGITS, ROOTED, OFFERED, CROSSING and KNOTTED, the last two of which the first mind caught. **So the re-cut did not raise the score: 7 and then 6 of 11, one mind each, which is noise.** The re-cut fixed what the minds said stopped them, and that is all this run shows. What it does show is that a small mind with only this way gets a working first test in one sitting, and a test made this way catches most of what an expert's catches and finds things that one misses. Both thread minds wrote the same case without seeing each other's, OPTION MARKED and SIGNAL, and the first found the fault at `thread:weft` 5.112 with it.

The way says this at its step 6 and its provenance, so a first cut isn't taken for a finished one. Four small changes followed the fourth mind and have not been tried: pointing at 1.13 by its address, the site's file names, `pool:<keeper>`, and a maker who kept the law getting a WARN rather than a FAULT. The fourth mind graded ten of thread 2's options a FAULT because the page doesn't offer them, though the law says they stand to be taken up later. That is why a mind's draft needs review before it stands, and why the last of those changes was made. In all the four minds took about 1.56 million tokens and 77 minutes of running time added together.

## 5. What the minds found

Checked against the live blocks and the pages' code. None of it was acted on, because each belongs to its keeper.

- **`thread:weft` 5.112**, an option on the LERO thread: "David waits for the router to carry a pass…". `threads.js` reads "waits for" anywhere in a line as the mark of an act, so the page draws an untaken option as taken. `thread-test` has no case for this.
- **`look:weft` 1.13**, the light muted ink `#6B848D`, is 3.73 to 1 on its ground, under the 4.5 `look.js` asks for, so `look.js` drops it in light. `look:keel`'s claim of 14 to 1 is 13.98 on its light panel.
- **`spine:beach-schematic` 1.2 and 1.21** cite `spine:arcade 1 to 9`, and `spine:arcade` holds three.
- **`spine:ghost-racer-schematic` 1.5** has a file path in its bracket, where the law asks for blocks at positions.
- **`happyseaurchin.com/proposal/<anything>` and `/schematic/<anything>`** answer 200 whether or not the family stands, so a status check can't show a dead page there.

One false alarm: mind 1 reported `spine:leros-schematic` 1.4 as a 404, because it read `w/community-recovery` as a block name. It is a world with its own surface, and its lighthouse answers. That stumble is why `1.13` now says so.

## 6. Not built

- **`test:schematic`, `test:look`, `test:thread`.** The minds' four drafts are kept in `proposals/2026-11-02-the-way-of-a-test/` as they were written, unreviewed, and none stands on the beach. `test-schematic.json` still writes addresses with several dots and carries the false alarm above; neither of those may go on the beach.
- **A section for every way.** `ways:vault` 4 and `ways:tickets` carry their own proofs, and the rest teach a stance rather than make a thing.
- **`block-conventions`.** `test:<kind>` is not added to the catalogue of names. It is a sentinel and law-class, and on this beach a name becomes a convention when others take it up.
