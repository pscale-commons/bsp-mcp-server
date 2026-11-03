# proposal-test: a battery for the molecule people make most

**Date**: 2026-11-02 · **Status**: BUILT and merged (#572); §5's two lines written the same day (`proposals/2026-11-02-the-way-of-a-test.md`) · **Lane**: mistake-proofing.1 · **Companions**: `function:proposal`, `ways:proposal`, `thread-test-materials/`, `compound-test-materials/`, `proposals/2026-10-29-chemistry-battery.md`, `spine:mistake-proofing` 1.118.

## 1. The ask

David, 2 November, naming the need:

> "a general set of test-batteries for everything; to check that a proposal is well-formed, for example; or a schematic. So that when Matthew creates a proposal and serves it through github, it is actually well formed and I/you don't have to nudge"

and that there may be several, "one for each thing, and combined because each thing is combined": the decision points, the pool's welcome with a link at least and its nested earlier responses, the threads, the looks. Asked the same on 29 October (lane weft-bee.2), the answer was one checker with each form listing its own cases; that step was not taken, and thread-test was built for threads alone. Then, the same day: "go ahead with battery for proposal-test".

## 2. Where it stands among the batteries

| Level | Battery | Decides |
|---|---|---|
| Physics | `bsp-test`, `well-formed` | the walker; the block being written |
| Chemistry | `compound-test` | blocks in company: resolves, direction, law |
| Biology | `thread-test` | a piece of work across minds and people |
| A made thing | `proposal-test` | a whole proposal family |

It adds a level of its own only in the sense that it combines the others: it runs `thread_form.py` over each registry thread and `compound-form.py` over the family, and its `family` battery holds well-formed's shape gate. None of those looks at a decision, a room, a page or a look. Nothing in them or in the smokes did.

## 3. What was built

As `thread-test` is: a sentinel with one read-only checker, a clean fixture, planted faults and a CI pass, with no router change.

- **`src/proposal-test.json`**, served as `bsp(agent_id="pscale", block="proposal-test")`: five smaller batteries at 1 to 5 (family, decisions, room, threads, page and look), what only a reader decides at 6, the planted faults at 7, what it found at 8, how it runs at 9.
- **`proposal-test-materials/proposal_form.py`**, by public GET or a fixture, writing nothing. One battery alone with `--only`, one family, or `--all`.
- **`fixtures/harbour-bell`**, a family that passes every case. **`mutation.py`** plants 91 faults one at a time, each caught at its level, those met on the beach verbatim as found.
- **`run-proposal-tests.py`**, `npm run smoke:proposal-test`, in the CI gate. It also holds the block and the code together: every test named in the block, every test proved by a planted fault, the stated count the true count.

Two decisions the build made:

- **It reads as the pages read.** What matters is what a reader loses, so the checker ports the pages' own readers rather than judging the words against the form's prose. The port was run against the JavaScript over all 28 families (149 decisions, 254 answers), with no differences, and a live pass reports `reader moved` if those lines change.
- **What counts as a fault was calibrated on the real list.** A FAULT is what breaks the form or loses a reader something. A statement in place of a question still takes an answer, as every first exemplar's did, so it is a WARN. A wrong first word in someone's answer is a WARN too: it is theirs to re-say, and a keeper's light shouldn't stay red for what the keeper may not touch.

## 4. What the first sweep found

28 proposals, 18 well formed, 10 not; 17 faults, 157 warnings, 24 notes. Nine of the newest ten pass.

- **Six decisions with lost buttons**: leros-on-the-commons 1.11118, weft-bee 1.11118, loom 1.118 and 1.111128, shell-indexes 1.118, game-arcade 1.11111178. The page's regex takes capitals and apostrophes only, so a digit or a gloss in brackets breaks the list. Answers using the lost words read as notes, so those decisions can't stand: Matthew's CLERO, weft's ROUTED and NEW PAGE.
- **Six STATEs no page drew**: y-ray (two), code-as-blocks, weft-bee, pscale-native, and mistake-proofing 1.111119, mended the same day.
- **Three welcomes with no link**: pool:character-sheets (read by two proposals) and pool:keel (read by code-as-blocks).
- **Lesser**: seven unpaid spans of earlier responses, six welcomes ending on the standard page though a crafted one stands, seven older crafted pages with no share still.

None of it had been reported, because all of it fails in silence. These families belong to other lanes and other hands and were left as they stand: mending them is their keepers' act, or David's call.

The first case came from this lane's own page: mistake-proofing's link was cut off at 390 while its maker's headless check passed, because a body that hides overflow can't scroll sideways (case 5.8, walk at 6.2).

## 5. Owed once this is live

A pointer written before the sentinel is served would be dead, so these wait for the merge and the redeploy:

1. **The law's line.** `function:proposal` 7, step (5) gains the run: open the page and read it as a stranger would, run `proposal-test` over the family, then mend the spine, never the page. The standing text goes to `archive:function:proposal:2026-11-02` first, and its 9 records the amendment and David's words.
2. **The way.** `ways:proposal`'s check at 1.1111 names the battery too, since the crafted page's maker reads there.

## 6. Not built

- **Schematics.** `function:schematic` has its own family, parts and asks. A `schematic-test` would reuse `room` and `page`'s pin; the form's own cases aren't written.
- **The fresh reader's runner.** Branch 6.3 states the act. thread-test's minds spend model calls and run on David's word; nothing here spends.
- **Whether the spine and law are latched.** A public GET can't tell, so the form's "under the keeper's lock" goes unchecked.
- **The page's reader.** Whether a word on a decision card should be allowed a digit or a gloss is a change to `proposal.html` and `loom.html`, in the site repo, and the battery would then follow it. This PR leaves the reader as it stands and reports against it.
- **Tests for molecules in general.** David's further question, a way of making a test for any molecule someone creates, or a section in each way, was answered both, and is built at `proposals/2026-11-02-the-way-of-a-test.md`.
