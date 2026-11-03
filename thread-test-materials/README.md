# thread-test-materials

The battery for threads (strata 3, biology). bsp-test covers the walker that reads one block, and compound-test the blocks read in company; this battery covers a piece of work carried across minds and people: whether a thread is well formed, and whether a mind handed a teaching forms one well.

The cases live in [`../src/thread-test.json`](../src/thread-test.json), the block bsp-mcp serves as `bsp(agent_id="pscale", block="thread-test")`. This folder holds what that block can't carry: the form checker, the test beach, the nine uses, the planted faults, the teachings and every run so far.

keel built all of it on 29 October 2026, in the Keel project chat, at David's ask: *"conduct some kind of battery test to ensure that when someone forms a thread it is well formed"* (write-up at `pool:threads` 11). weft set it here that evening, at David's word '2.1' on thread 2, when keel's revisions became the law (`proposals/2026-10-29-threads-phase-2.md`).

## Run it

```bash
python3 thread-test-materials/run-thread-tests.py      # the CI pass: spends nothing
python3 thread-test-materials/thread_form.py live       # the live beach, by public GET
python3 thread-test-materials/thread_form.py state <state.json>
thread-test-materials/run-minds.sh --spend L2           # fresh minds: spends model calls, on David's word only
```

The CI pass (`npm run smoke:thread-test`) ends with `thread-test: all passed`. It does four things:

1. It runs the form pass over keel's eight hand-played threads (`runs/SELFTEST-*`), and each must be well formed under the law as it stands.
2. It plants eleven faults one at a time (`mutation.py`), and every one must be caught while the unplanted thread stays clean.
3. It re-grades the 118 stored runs from their replies (keel's 36 and weft's 82), and the totals must be the ones reported:

| delivery | checks | well formed, first law | well formed, the law now |
|---|---|---|---|
| L, the law of that morning, round 1 | 36/40 | 8 of 9 | 3 of 9 |
| W1, the way's first draft | 31/40 | 9 | 9 |
| Lx2, the law, round 2 | 35/40 | 8 | 5 |
| W2, the way's second draft, now `ways:thread` | 40/40 | 9 | 9 |
| L2, the law as re-cut, whole, run on 2 November | 35/40 | 9 | 9 |
| R, the law as re-cut, met as a live read meets it, the same day | 16/40 | 3 | 3 |
| H, the same, with the read handing over the way, the same day | 31/40 | 8 | 8 |
| H2, the same, with the opening handing it over too and the fence wider, the same day | 37/40 | 9 | 9 |
| W2x2, the way's second draft on `place` alone, one mind through weft's runner, the same day | 4/4 | 1 of 1 | 1 of 1 |
| H3, the way's third draft handed over as a live read does it, the same day, now `ways:thread` | 40/40 | 9 | 9 |
| S, David's form: six sentences in the way's place and no keyword in any seed, graded by `short.py`, run on 2 November | 34/35 | 0 | 0 |
| S2, the same with two sentences mended, 3 November | 30/35 | 0 | 0 |
| S3, S with only the place spelled `thread:<address>`, the same day | 33/35 | 0 | 0 |
| S4, S3 with David's one knot, the same hour | 31/35 | 0 | 0 |

S to S4 are graded by where each line lands and whether anything is lost, not by a keyword, so they have 35 checks and no seed closes on whom it waits on. Both form passes fail every one of their threads on WAITS, as they should.

4. It plays the short form's right and wrong acts by hand through the test beach (`selftest_s.py`, for S, S2, S3 and S4). Each delivery's words must reach the mind at all four handings, the strict spelling must read six written places as it should, every right act must take full marks, and every planted wrong act must be caught.

The runs are copied to a scratch directory first, so a pass writes nothing here.

## The form pass

`thread_form.py` reads the registry (`spine:thread`) and every hand's mirror (`thread:<handle>`), and asks the questions at branch 1 of the block: registered, opened, knotted, rooted, digits, contiguous, offered, waits, crossing, short, resolves, routes and time.

The rule that tells an act from an option is the law's: **every act closes `' · waits on <handle>'` or `' · complete'` before its reads, and an option never does** (function:thread 2).

A thread opened before the law was re-cut (29 October 2026, 17:13Z, the stamp in `V2_SINCE`) is read by the law it was tied under. There an act may also be known by its reads, a time, a word, or its own hand's options beneath it. What the law as it stands would call a fault there is reported as a WARN. `--v1` and `--phase2` fix the law for every thread.

keel's checker also emulated the page, to catch where `/threads` drew taken or the offerer wrongly. The page now reads both by the closing clause, the same rule this pass uses, so the two can't disagree, and the emulation is retired.

## The uses

`battery.py setup <delivery>` makes a run directory for each case: the state the case starts from, a `bb` command for its test beach, and the brief a mind is handed. That brief is the teaching, then the commands, then the situation, then the report it ends with. `battery.py score <delivery>` grades every run that has a reply. It grades twice: by the form pass under both laws, and by what the case expects.

The teachings are in `teachings/`:

| delivery | file | what it is |
|---|---|---|
| L | `law_v1.txt` | `function:thread` as keel ran it, the registry law of 29 October morning |
| L2 | `law_v2.txt` | `function:thread` as re-cut that evening, the law as it stands |
| W1 | `way_w1.txt` | keel's first draft of the way |
| W2 | `way_w2.txt` | the second draft, `ways:thread` until 2 November |
| W3 | `way_w3.txt` | the third draft, now `ways:thread`: step 3 says plainly where an answer to a waiting knot goes. `ways-thread-w3.json` is the block as it stands on the beach |
| R | `root_v2.txt` | what a live read gives: the envelope's law section, `function:thread`'s root line alone, which names `ways:thread`. `function-thread.json` and `ways-thread.json` stand as plain blocks on that run's test beach, for a mind to read or not |
| H | `root_v2.txt` | R, with the way printed once in a session, whole in the first read or say and standing after, as the router's envelope now does. A wake's window carries it |
| H2 | `root_v2.txt` | H, with the answer to opening a thread handing the way over too, before the first knot, as the router's append now does |
| H3 | `root_v2.txt` | H2, handing over the third draft |
| S | `root_v2.txt` | H3's handing over, carrying David's form in the way's place: six sentences, `way_s.txt` (`ways-thread-s.json` on the test beach). The test beach's `function:thread` is cut to its root line (`function-thread-s.json`), and `short.py` strips the closing clause and the reads from every seed |
| S2 | `root_v2.txt` | S, with two sentences mended (`way_s2.txt`, `ways-thread-s2.json`): where the thread stands, and the place spelled `thread:<address>` |
| S3 | `root_v2.txt` | S, with only the place spelled `thread:<address>` (`way_s3.txt`) |
| S4 | `root_v2.txt` | S3, where a hand already holds a line it begins with that line's words in place of going one deeper: David's one knot (`way_s4.txt`). S3 and S4 are graded alike, and a line kept inside the one that replaced it counts as nothing lost |

Each is made from its beach block the way keel made `law_v1.txt`: the heading line, then the root, then 1 to 8. The same transform rebuilds `law_v1.txt` byte for byte from `archive:function:thread:2026-10-29-2`.

`testbeach.py` is the router's thread surface as #559 built it. A read prints the law's section as the router prints it, and a block past 6,000 characters is answered with its disc unless its root is named. It has the one read, a say with options landing at A followed by k, a say replacing only your own line, the guard that refuses to reword an option another hand has answered, rooms, and the registry's append. Like the router's, the guard looks only at the options a say offers beneath it, never at the say's own address, so a hand that says at its own answered option rewords it (`runs/S2-C8`). Every call is metered to the run's `meter.jsonl`.

## The minds

`run-minds.sh --spend [delivery] [cases]` runs each use with a fresh Claude Haiku, then grades them. Each mind gets its brief on stdin and one tool: Bash, fenced to its own run's `bb`. The wake gets no tool at all. It runs with no MCP server and no settings, keeps no session, and inherits nothing of the session that runs it but what the CLI needs to sign in. Runs land in `$THREAD_TEST_RUNS` (default: a new temp directory), never in the repo.

The minds spend model calls, so they run only on David's word: nine short sessions, about half a cent each at list price, capped at 25 cents each. A change to `function:thread` or `ways:thread` is followed by a run of the minds before the change is called done (function:thread 7).

The re-cut law had its run on 2 November (`runs/L2-*`, branch 4.6 of the block). It scored 35 of 40. `self`, `reask` and `wake`, the first law's misses, are cured, and every thread is well formed. `place` (2 of 4) and `twin` (1 of 4) are new misses, each one mistake: answering a line with no option to take, the mind tied at that line's own address, not the next free digit beneath it. With one run a cell, chance isn't ruled out.

The same day it ran again the way a live mind meets a thread (`runs/R-*`, branch 4.7), every case and grade as before, and scored 16 of 40. Only one mind, `step`'s, read `ways:thread`, and it got everything right. The other seven with tools read neither the way nor the law's branches, whose section says "read when the law is needed, never to say a line". The wake can't read at all. `battery.py`'s score row says what each mind read (`read_teaching`).

It ran a third time with the read handing over the way (`runs/H-*`, branch 4.8), and scored 31 of 40. The six minds that held the way before they tied scored 23 of 25, against 10 for the same six on the root line alone. `self` and `reask` measured nothing, because the fence refused a run's own `./bb` and both minds stopped. `open` ties its first knot before any read, so the way reached it too late for that knot.

It ran a fourth time with the opening handing the way over too and the fence wider (`runs/H2-*`, branch 4.81), and scored 37 of 40, every thread well formed. Eight of the nine uses took full marks. All three lost checks are `place`'s (branch 4.811): rook, handed `thread:1.12`, tied at 1.131 under an untaken option. All four of keel's minds tied that use right, at 1.121, and none of weft's four did. Both wrong places pass the form pass, and by the page's rule both leave the thread still waiting on rook, who has done the work.

`place` then got its own two runs, at David's "and proceed with place improvement" (`proposals/2026-11-02-the-way-says-where-an-answer-goes.md`, branches 4.8111 and 4.81111). The way given whole, one mind through this same runner (`runs/W2x2-C6`), tied right, 4 of 4, so the runner isn't what's behind the miss. Then the way's third draft, handed over as a live read does it (`runs/H3-*`), scored 40 of 40, every thread well formed, with `place` 4 of 4: *"dana's act at 1.12 waits on rook, so the answer goes beneath it at the next free digit, 1.121, not at 1.12 itself"*. `open`'s mind opened before any read of the family, so this run exercises the opening's handover too. That met David's gate, so `ways:thread` took the draft, its standing text at `archive:ways:thread:2026-11-02`. One run a cell, so `place`'s pass is one mind's.

`place`'s first check used to ask only that a line stands at 1.121, and in L2, R and H the line there is the mind's own option beneath its wrong knot at 1.12. Asked for an act, those three would read 34, 15 and 30 where 35, 16 and 31 were reported, so the eight deliveries reported before the change keep the grade they were reported under (`PLACE_AS_REPORTED` in `battery.py`), and the check asks for an act only for runs after them.

Then David's own form, with no keyword anywhere, at his "Yes, run it" and "Yes, do both" (`proposals/2026-11-03-threads-without-the-keyword.md`, branches 4.9 and 4.91). Six sentences took the way's place, handed over as H3 hands it, and `short.py` grades where each line lands and whether anything is lost. What counts as right was fixed before any mind ran. S (`runs/S-*`) scored 34 of 35 with nothing lost: `word` tied beneath an older option, and only one of the seven minds that told a room spelled the place `thread:<address>`. S2 (`runs/S2-*`) mended both and scored 30 of 35. All seven now spelled the place, and `word` was cured, but `self` and `reask` each wrote over their own option, and `place` took an untaken option at the same depth as the line it answered.

At "Yes, run both" (branch 4.911), S3 (`runs/S3-*`) kept only the spelling and scored 33 of 35 with nothing lost and six of seven places spelled, which is the gate fixed before it ran. S4 (`runs/S4-*`) added David's one knot and scored 31 with one line lost. Its `self`, `twin` and `reask` each tied at the line they held and kept its words, but `word` tied at its own older option and reworded it. In both, `word` took rook's older option, as in S, and `place` took the untaken option, as in S2, so `place`'s miss is not the dropped sentence's. One run a cell.

The strict spelling check was mended after S3 ran. It read a full stop after a place as a second part of its address, so "Please pick up at thread:3." went uncounted in S2's and S3's `open`, though the page and the waker read it as `thread:3`. Now a full stop may end the sentence and `thread:1.3.1` still names no place. No score moved. S2's count rose from the six first reported to seven, and S3's from five to six, so S3 meets the gate only with the check mended.

## What is here

| Path | What it is |
|---|---|
| `run-thread-tests.py` | The CI pass. |
| `thread_form.py` | The form checker (keel's, reading the law as re-cut). |
| `testbeach.py` | The test beach. |
| `battery.py` | The nine uses: situations, starting states, briefs and grading. |
| `short.py` | S to S4: the seeds without the keyword, and the grade by where a line lands, nothing lost, and the cards a page would read from the rooms. |
| `selftest_s.py` | The short form's hand-played right and wrong acts, for S, S2, S3 or S4. |
| `mutation.py` | The eleven planted faults. |
| `run-minds.sh` | The fresh minds (spends). |
| `teachings/` | What a mind is handed. |
| `runs/` | keel's runs of 29 October: 8 hand-played (`SELFTEST-*`), and L, W1, Lx2 and W2 nine each. weft's of 2 November: L2, R, H, H2 and H3, nine each, and W2x2 on `place` alone; and of 2 and 3 November, S, S2, S3 and S4, nine each; each with `usage.json` as well (its model, turns, cost, and what the fence refused). Each keeps its start, its end state, its meter and the mind's reply, with the scores beside them. The briefs are rebuilt by `setup` from `teachings/`. |
