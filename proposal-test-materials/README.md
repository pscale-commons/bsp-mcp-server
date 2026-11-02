# proposal-test-materials

The battery for a proposal: whether a family set up under `function:proposal` is well formed. bsp-test covers the walker that reads one block, well-formed the block being written, compound-test the blocks read in company, and thread-test a thread. This battery covers the molecule people make most often, so that whoever makes one learns what is wrong from the battery rather than from David or weft.

The cases live in [`../src/proposal-test.json`](../src/proposal-test.json), the block bsp-mcp serves as `bsp(agent_id="pscale", block="proposal-test")`. This folder holds what that block can't carry: the checker, a clean family, the planted faults and the CI pass.

## Run it

```bash
python3 proposal-test-materials/proposal_form.py live <name>                     # one family, by public GET
python3 proposal-test-materials/proposal_form.py live <name> --only decisions,room   # the smaller batteries you name
python3 proposal-test-materials/proposal_form.py live --all                      # every proposal on the list
python3 proposal-test-materials/run-proposal-tests.py                            # the CI pass: reads nothing from the network
```

The checker reads and never writes, needs nothing but Python, and exits 1 on any FAULT. Copied alone from [its raw address](https://raw.githubusercontent.com/pscale-commons/bsp-mcp-server/main/proposal-test-materials/proposal_form.py), it still runs, and says it could not run the two sibling passes (`compound-form.py`, `thread_form.py`).

## Five batteries, combined

A proposal is combined, so the battery is. Each of the five runs alone, and they run together as the whole pass.

| Battery | What it checks | Tests |
|---|---|---|
| `family` | the spine and law stand, their positions, the list | STANDS SHAPE FLOOR TITLE ROOT STEPS TITLES STATE MODE POSITIONS LISTED NOTATION RESOLVES COMPOUND |
| `decisions` | each decision reads as its maker wrote it, each answer as an answer | OPENS SPELT PLACED QUESTION WHO WORDS HOLD SHORT ANSWERS NAMED |
| `room` | the welcome and its link, the entries, the earlier responses nested beneath it | STANDS SHAPE NAMED WELCOME LINK ENDS ENTRIES SUMMARIES REPLIES |
| `threads` | the law's 5 names what stands; each registry thread through `thread_form.py` | HEADED LINE STANDS STEP FORM TIED |
| `page` | the phase, the crafted page answering, its wiring, the look, the map pin | PHASE PAGE AGREE STALE ANSWERS OFFSITE PREVIEW KEY WIRING CARDS STILL LOOK MAKER MAP WALK |

A FAULT breaks the form or loses a reader something; a WARN weakens it; a NOTE is a reading. A family with no FAULT is well formed. The `room` battery knows nothing proposal-only beyond the page's address, so a schematic's check can reuse it, as it can `page`'s look and pin.

What a program can't decide is at branch 6 of the block: reading it as a stranger, walking a crafted page at two widths, and a fresh reader, which is the only part that spends.

## Why it reads as the pages read

A decision that parses wrongly loses a button in silence. So the checker carries a port of the pages' own readers (`decisionOf`, `stateOf`, `stepsOf`, `lawOf`, `pageOf`, `parseAnswer`, `shelfOf`, `entries` from `proposal.html`, and `parseThread`, `threadsNode` from `threads.js`).

The port was proved against the JavaScript itself on 2 November 2026, by running both over every listed family and comparing: 28 families, 173 steps, 149 decisions, 254 answers, 17 threads, 173 room lines, 0 differences.

A live pass looks for the lines it follows in the site's files and prints `reader moved` if one has changed. If the page's reader is widened (to let a word hold a digit, say), the port and case 2.4 follow it.

## The first sweep

2 November 2026, all 28 proposals on the list: 18 well formed, 10 not, 17 faults, 157 warnings, 24 notes. Nine of the newest ten were well formed. Branch 8 of the block has them by name. The most costly:

- Six decisions offer words the standard page can't read, so buttons are missing and answers read as notes. `5TH PLACE` takes `CLERO` and `ISBD` with it; a gloss in brackets loses every word before it.
- Six STATE lines opened with something other than a level word, so no page drew them. mistake-proofing's was mended the same day; five stand.
- Three welcomes carry no link to their proposal.

## What is here

| Path | What it is |
|---|---|
| `proposal_form.py` | The checker. |
| `fixtures/harbour-bell.json`, `.html` | A family that passes every case: floor 2 room with a paid summary and a reply, a registry thread and a ladder, a maker's look at their yes, a map pin, a crafted page. Nothing stands on the beach by this name. |
| `mutation.py` | The planted faults, one at a time. Those marked "as found" stand verbatim as the first sweep met them. |
| `run-proposal-tests.py` | The CI pass: the clean family, the planted faults, and the block against the code. |

## Adding a case

A lesson from a real family becomes three things, and the CI pass fails until they agree: a line at the battery it belongs to in the block, a test in `proposal_form.py`, and a fault in `mutation.py`, verbatim as found.
