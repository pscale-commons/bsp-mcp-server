# Threads: the registry — a number for each thread, and the digit is the choice

**Date**: 29 October 2026
**Lane**: threads.2, weft (Claude Code, Opus 5.5, on the Mac), opened by the bee (weft-bee.2) on David's 'Open them'
**Status**: decided by David in chat, 29 October 2026. This file is the record the law moves by. `function:thread` is re-cut on the beach from §5 below, with the text it replaces kept whole at `archive:function:thread:2026-10-29`. The router's part (§6) waits on this PR's merge.

## The ask, and the decision

David held threads as the beach's fundamental for the passage of work: across LLM calls, genus-one continuity, inter-agent work and hand-offs between people. On 28 October he wrote: *"As for threads, that is a what I consider to be a fundamental. Ensure the new session is scoped fully."*

Two encodings stood in the room for where a hand ties its knot once the keeper is gone:

- **the ladder** (pool:threads 3): every step one digit deeper down 1, its words naming the option it took and whose line it follows;
- **the registry** (pool:threads 4, David's): each thread a number from one open list, and the digit is the choice.

keel set the test that would settle it (pool:threads 4). threads.2 ran it on 29 October and set the result at `spine:threads` 1.16 (§2). The question went to David at `spine:threads` 1.18. His answer, in chat:

> *"If a thread identified as 123 has three choices (after an initial choice of 123.1), ie 123.11, 123.12, 123.13, when it is chosen it is filled with the resulting action AT that same location; eg 123.12 is chosen, and the text within it is appended with the 'result' of having chosen it, and the next llm is given the spindle eg 123.12 with its completion state OR it is given it with the subsequent choice if there is one, eg 123.121, 123.122, etc. We don't need additional words or addresses; the content is in the choice chosen."*

> *"I am going with registery."*

He also named a worry about keel's efficiency race (pool:threads 5), which found that a thread handed on by the place of its latest line reads in one call. That race and this test measured the two ends of one law, not rival answers (keel, pool:threads 7). The encoding decides the record; the hand-off decides the cost. Both are built here.

## 1. What a thread is

- **The registry** is `spine:thread`, an open accumulator. Each thread is one appended line, in the order threads are opened: 1 to 9, then 11 to 19 and on (every tenth slot is a summary). The line says what the thread carries and who opened it. Opening a thread is one append; the beach hands back the number. The registry line is the thread's loose end, never a record of the work.
- **A knot** is a hand's own line in its own mirror, `thread:<handle>`, at an address within the thread. The mirror is born locked to that hand, so no one else can write or erase it.
- **An offer** is a knot with its options beneath it: option 1 at A.1, option 2 at A.2. The options are said in the same call as the knot.
- **A choice** is the chooser's line at the address of the option it took: what came of choosing it. Its own options sit beneath it, or none when that branch is complete. This is David's "filled with the resulting action AT that same location". When the chooser is another hand, the option's words stand in the offerer's mirror and the result in the chooser's. Read across mirrors at that address, the two stand together.
- **What was not chosen** is every option with no line beneath it but its offerer's. It stays readable, and can be taken up later.
- **A fray** is several hands at one option. **A fork** is different digits taken beneath one knot.
- **A step no option names** takes the next digit no hand holds there.

## 2. The test it rests on (spine:threads 1.16)

The test ran offline against the beach's own handler (pscale-beach-happyseaurchin `origin/main`, `scripts/local-beach.mjs`). Five threads were tied both ways in one registry, numbered 11 to 15 after nine others and a summary:

- 11: two instances of one hand;
- 12: an API-key wake, read from a compiled window with no tools;
- 13: two people's taps, one followed and one not, a cost kept in a grain;
- 14: the plug's stages;
- 15: a proposal's decision, with a CHANGE answered.

Thirty-six fresh Claude Haiku readers each got only a thread's number, run with `claude -p`, tools fenced to bsp reads.

| | score /32 | not chosen /8 | reads (median) |
|---|---|---|---|
| registry, with the new read | 31 | 7.5 | 4 |
| ladder, with the new read | 29 | 5.5 | 4 |
| registry, today's reads | 26 | 5.5 | 13 |
| ladder, today's reads | 26.5 | 5 | 11 |
| wake window, registry | 8/8 | 2/2 | none (≈5,000 tokens) |
| wake window, ladder | 7.5/8 | 1.5/2 | none |

All four ladder readers of the plug thread said an option that was taken had not been. On the ladder the knot sits at 14.11 whichever option it took, and every step offers its own "1 accept, 2 ask for changes". On the registry it stands at 14.12, and no reader slipped there. Without the new read, one registry reader stopped two knots short and named the wrong live end, and another missed an answered CHANGE after 28 reads. The apparatus, every brief, meter and reply, and the grading are kept in the threads.2 notes beside this lane.

## 3. How it is read, and handed on

- **Read in one call.** `pscale_stream_engage(field='thread', at=<the number or the place>)` gives every hand's lines at that address and beneath it, in address order, with the registry's line above. A mind takes a thread up from the **place** of its live end. The whole thread, read at its number, is for a fold, the page or a first look (keel's first point, pool:threads 7). The law says so in one sentence: readers not told that walked the mirrors one by one.
- **The place** is written `thread:<address>`, for example `thread:14.12`. Work is handed on by putting the place in the next hand's room: for a session that is the line the door already folds; for an agent, it is the ring.
- **The door.** `pscale_play(…, thread='14.12')` adds THE THREAD to the window: the registry's line and every knot at the place and beneath it, about 400 characters. It also seats the session on that place, so every later ack carries the knots tied there since, each told once.
- **The waker.** When the line that rings an agent names `thread:<address>`, the doorman's window is the door's, with the place passed through. A genus pulse gets the door's THREAD section beside the ring's voice. That is the live end, not the whole thread (keel's fourth point), because the kernel cannot fetch once awake.
- **A person** taps an option on a page. The page writes the person's line at that option's address through the beach's voice.

## 4. What it holds against

- **An option keeps its digit once offered** (keel's third point). The router refuses to reword an option another hand has answered, and names who took it. Options are only ever set, never dropped.
- **Two instances of one hand** at one address would replace each other in one mirror. A say that replaces one's own line names the line it replaced. The law says the second instance reads first and takes the next free digit.
- **The floor.** The registry nests at its tenth line: the tenth thread is numbered 11. A mirror born before that holds its knots at floor 1, and the real beach walks a dot-free 113 positionally, so a write would land at 1.13: silently wrong. The router now raises the writer's mirror to the spine's floor before the write. This is one rewrite of the whole mirror, and a supernest keeps every number (keel's caution: never a write at a zero position). Reads raise lower mirrors in memory the same way. The same rule covers the personal tree and the collective fold a keep writes into.
- **The registry's own stamps.** The beach stamps each appended line at its field 3. The read's ladder now stops at an appended entry's fields, so a registry line's stamp never reads as a knot at option 3.
- **Privacy.** What must stay between two goes in a grain, and the knot names the grain's address.
- **Protection.** A knot proves its hand by its latch. The registry is open; its lines are pointers, and nothing in a thread depends on them being unaltered.

## 5. The law, re-cut: function:thread

The standing text (the keeper form of 20 October, re-cut that afternoon) is kept whole at `archive:function:thread:2026-10-29`. The new positions:

- `_` THE THREAD: the form every thread keeps. A thread is a number from one open list, `spine:thread`. Its knots are lines in each hand's own mirror, `thread:<handle>`, at the number and beneath it, where the digit is the choice: option k of the knot at A stands at A followed by k. No keeper, nothing copied. Read whole at its number, or from the place of its live end, in one call.
- 1 THE REGISTRY: open, one line per thread in landing order, opened by one append.
- 2 A KNOT: an offer with its options beneath, said in one call. A choice is the chooser's line at the option's address, with its own options or none. A step no option names takes the next free digit.
- 3 WHAT IT HOLDS: the address is the record. Strands not taken, frays and forks are read off it. An option keeps its digit. A second instance takes the next free digit. A grain holds what is private.
- 4 THE READ: one call, at the number or the place. Never mirror by mirror.
- 5 HANDING ON: the place `thread:<address>`, put in the next hand's room. The door, the waker and a person's tap.
- 6 A THREAD'S OWN LAW AND THE THREADS BEFORE: a known shape may say what each depth or digit means. The ten keeper-tied threads standing on 29 October each read as a trunk whose every knot took option 1.
- 7 WHAT TO HOLD: the latch, no trace for a read, a fold anyone's, the floor kept by the router. Signing and grain-traced legitimacy come later.
- 8 THE QUIPU: what the page draws.
- 9 PROVENANCE.

The exact text stands on the beach; this list is its outline.

## 6. What changes in code

| file | change |
|---|---|
| `src/cross.ts` (new, ~120 lines) | A family read at an address and beneath it, mirrors raised to the spine's floor (`raised`, `nodeAt`, `linesAt`, `crossSection`, `renderPlace`, `THREAD_FIELD`). |
| `src/tools/stream.ts` | Off the clock, a reading is every mirror's lines at the address and beneath it, in address order, capped at 160 lines. A say raises the writer's mirror first. `options` lands lines at the digits beneath a say. A taken option keeps its words. A replaced line of one's own is named. Keeps raise the tree and the fold. The ladder stops at an appended entry's fields. Clock families are untouched. |
| `src/tools/play.ts` | `thread` at the door: THE THREAD in the window, and the seat follows the place. |
| `src/orientation.ts` | `seatThread`; the rider tells the knots tied at the seat's place since, each once. |
| `genus-one/waker.py` | `thread_place` reads `thread:<address>` off the ring. The doorman's window asks the door for it; a genus pulse's ring carries the door's THREAD section. |
| `scripts/smoke-thread.ts` (new, in the CI gate) | 20 checks against an in-memory beach. |
| `genus-one/test_thread_wake.py` (new) | 12 checks, no network. |

No new tool: the twelve entry points stay twelve. Two tools gain an optional parameter, `pscale_play` (`thread`) and `pscale_stream_engage` (`options`). The tool wording changes, so claude.ai re-asks once for its approval.

Checked: the CI suite and the stream, lens, span, looks, bundle, shapes, clock and tiers suites all pass. The real-handler run is described in §2 and below: a registry nesting at its tenth line, a floor-1 mirror raised with its old knot at 05, the whole thread in one read, a taken option refused, the latch holding, the door's section, and a knot tied in one session riding another seated session's next ack once.

## 7. Who pays at scale

Each step is paid by the mind that takes it, on its own call. A cross-section reads every `thread:*` mirror on the beach once per read. That is fine at hundreds of hands, which is what the stream already does for every family. At thousands, two cheap steps remain, noted here and not built:

- skip any mirror the beach index says was last touched before the thread's registry line was stamped;
- have the beach serve the cross-section in one request.

Neither puts the cost on one hand or one server.

## 8. Not in this PR

- the page (happyseaurchin-home: `/threads` redrawn as the quipu, and `threads.js` reading registry threads named in a law's 5);
- the proposal's mechanics re-voiced at `spine:threads` (David, pool:threads 2);
- the registry's founding and its first live thread.

These are beach writes and a site PR, made beside this one.
