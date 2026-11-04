# Threads without the keyword

**Date**: 3 November 2026
**Lane**: thread-loom.1, weft (Claude Code, Opus 5.5, on the Mac)
**Status**: four runs of the nine at David's word: "Yes, run it" (2 November), "Yes, do both" and "Yes, run both" (3 November), $0.1168 in all at list. S3, six sentences with the place spelled, passed the gate fixed before it ran. At David's "Yes, take it out" the keyword came out on the beach the same afternoon, each block archived first (see "Done"); the page follows in happyseaurchin-home #603, and the battery after this merges. Partly turned back on 4 November: `proposals/2026-11-04-threads-keep-their-endings.md` (#584) brought the endings back, with a date for later, and was built the same day (#586, happyseaurchin-home #608).

## The ask

David, 2 November, asked whether threads need anything added:

> "I had hoped that the threads were the solution and we didn't have to add things."
>
> "There's no code anywhere. It is all semantics (variable) within geometry."
>
> "I thought it was not about keywords; but that threads can carry any words."

His form of 29 October already says this, and the first line of `function:thread` carries it: *"We don't need additional words or addresses; the content is in the choice chosen."* He also weighed whether a hand ties two knots or one, and leaned to one: *"I think this can be conflated into one knot -- the amendment to the received option at X and the creation of X-1 options."*

He said "Yes, run it" to a test of a six-sentence instruction with no keyword anywhere. Then he said "Yes, do both" to mending the two things that run showed, running the nine again, and writing it up. Then he said "Yes, run both" to two re-cuts of it.

## The keyword, and what reads it

Since phase 2, every act on a thread has closed ` · waits on <handle>` or ` · complete`, then named its reads after ` · read: `. An option never closes (`function:thread` 2). The keyword came from keel's revision 1, at weft's recommendation (`pool:threads` 12) and David's "2.1" (`proposals/2026-10-29-threads-phase-2.md`). It was added so the page could:

- show an offerer's own taking as taken
- name the true offerer
- tell a second session's own option from its act
- read whom a live end waits on

These read it:

- **The site.** `threads.js` reads it in `CLAUSE`, `actBefore` and `waitsOn` (lines 143–157), and in the tree at 194–221, for /threads, /loom and the LERO page. Its tap (line 423) and `loom.html`'s (lines 1297–1304) write ` · waits on <offerer>` after the option's words when a person takes one.
- **The battery.** `thread_form.py` and `battery.py`.

The router (`src/`) and the waker (`genus-one/`) don't read it, and pscale-beach and xstream-bsp have none. It is taught at `function:thread` 2, 3, 5, 7 and 8, and at `ways:thread` 3, 4 and 8.

Other words in a line can also make it read as an act. For threads tied before the law, `threads.js` takes "waits on", "waits for", "complete", a time or "at X's word" anywhere in a line as the mark of an act (`actBefore`, lines 146–149). The mistake-proofing lane found an untaken option drawn as taken that way, at `thread:weft` 5.112 (`proposals/2026-11-02-the-way-of-a-test.md` §5).

## What was tested

**S** (2 November) is six sentences, 86 words, where the way's 4,000 characters would be:

> A line says what was done, in any words; the lines beneath it are options for what's next. Take one: write what came of it at that option's address, in your own block. If your block already has a line there, go one deeper. If what you did isn't an option, take the next free digit. Put the next option or options beneath your line, and put the place in the next person's room. If nothing follows, add no options and hand it to no one.

**S2** (3 November) is S with the two mendings, shown in bold:

> A line says what was done, in any words; the lines beneath it are options for what's next. **The thread stands at its deepest lines.** Take one: write what came of it at that option's address, in your own block. If your block already has a line there, go one deeper. If what you did isn't an option, take the next free digit. Put the next option or options beneath your line, and put the place, **thread:<address>,** in the next person's room. If nothing follows, add no options and hand it to no one.

**S3** (3 November) is S with only the spelling:

> A line says what was done, in any words; the lines beneath it are options for what's next. Take one: write what came of it at that option's address, in your own block. If your block already has a line there, go one deeper. If what you did isn't an option, take the next free digit. Put the next option or options beneath your line, and put the place, thread:<address>, in the next person's room. If nothing follows, add no options and hand it to no one.

**S4** (the same hour) is David's one knot: S3 with *"If your block already has a line there, begin with its words."* in place of "go one deeper".

## How it was tested

- **The uses.** The same nine as before (open, take, self, word, step, place, twin, reask and wake), on the test beach, with one fresh `claude-haiku-5-5` a use under the same 25-cent cap.
- **The handing over** is H3's (#570). The mind's head is the law's root line. Its first read, say or opening prints the instruction where the way would be, and a wake's window carries it. On the test beach, `function:thread` is its root line alone, and `ways:thread` is the instruction.
- **The seeds.** None carries the closing clause or the reads (`short.py` strips them). `step`'s situation says the knot "is with dana, for her to decide", not that it "waits on dana's decision".
- **The grade.** `short.py` was written and fixed before the first mind ran, and is the same for S and S2. It checks where the line lands, the options beneath it, that the next hand's room was told the place in any spelling, and that nothing in any block was lost. No keyword is graded, so there are 35 checks, not 40, and the form pass fails every thread on WAITS, as it should.
- **S3 and S4** were graded alike, by a grade fixed before either ran, with two exceptions. A hand that already holds a line where it ties may land there if the words that stood there are still in its line: `self` at 1.3, `twin` at 1.121, `reask` at 1.11. And a line counts as lost only if its words are gone. The CI pass played both versions' right and wrong acts by hand (`selftest_s.py`) before any mind spent. Under S's grade as reported, the one-knot acts miss, so S's and S2's figures stand.
- **The gate**, also fixed before S3 and S4 ran: a version goes forward if it loses nothing in any run, scores 33 of 35 or better, and has at least six of every seven room lines spelling `thread:<address>`. If both pass, the higher score goes forward; on a tie, David's one knot does.
- **Reported beside the score:**
  - whether the place is spelled `thread:<address>`
  - the cards a page would read from the rooms without a keyword: a place in someone's room stays their card until one of its options is taken, or, where none was offered, until they write at or beneath it

What counts as right, use by use:

| Use | Right |
|---|---|
| open | one thread opened, the line at its number, two or more options beneath, wren's or dana's room told |
| take | the line at 1.1, or one deeper at 1.11; two or more options beneath; dana told |
| self | the line at 1.31, one deeper than its own option, whose words stand; an option beneath; wren told |
| word | the line at 1.11, or one deeper at 1.111; no options; no room told |
| step | the line at 1.14; dana told |
| place | the line at 1.12 beside dana's, or at 1.121 beneath it; an option beneath; dana told |
| twin | the line at 1.1211 or 1.122; an option beneath; dana told |
| reask | the line at 1.111, or at 1.14; two or more options beneath; dana told |
| wake | an answer in the form, at 1.1 or one deeper at 1.11, with an option beneath it for rook |

## The result

| Use | S, six sentences | S2, seven | S3, the place spelled | S4, the one knot |
|---|---|---|---|---|
| open | 5/5 | 5/5 | 5/5 | 5/5 |
| take | 4/4 | 4/4 | 4/4 | 4/4 |
| self | 4/4 | **2/4** | 4/4 | 4/4 |
| word | **3/4** | 4/4 | **3/4** | **2/4** |
| step | 3/3 | 3/3 | 3/3 | 3/3 |
| place | 4/4 | **3/4** | **3/4** | **2/4** |
| twin | 4/4 | 4/4 | 4/4 | 4/4 |
| reask | 4/4 | **2/4** | 4/4 | 4/4 |
| wake | 3/3 | 3/3 | 3/3 | 3/3 |
| **checks** | **34/35** | **30/35** | **33/35** | **31/35** |
| lines lost | none | 2 | none | 1 |
| place spelled `thread:<address>` | 1 of 7 | 7 of 7 | 6 of 7 | 4 of 7 |
| calls, median of uses 1–8 | 8.5 | 11 | 8.5 | 7.5 |
| cost at list | $0.0298 | $0.0319 | $0.0287 | $0.0264 |

S2's spelling was first reported as 6 of 7. The seventh, *"Please pick up at thread:3."*, went uncounted because the check read the full stop as part of the address. The check was mended after S3 ran (below), and no score moved.

Nothing was refused in any run, and no mind fetched the way or the law's branches.

## The gate

- **S3 passes:** nothing lost, 33 of 35, six of seven places spelled. It passes at the edge. 33 is the lowest passing score, and its sixth spelled place is `open`'s *"the moorings page is at thread:3."*, which the check as it ran read as no place. Another of the six, `self`'s, came in a second line correcting `thread:1.3.1`; S2's count includes such corrections too.
- **S4 fails:** one line lost, 31, four places spelled.

So S3 goes forward.

## Done, at David's "Yes, take it out"

- **The live walk, thread 11.** Weft opened it by an append to `spine:thread`. As the registry's tenth thread it wrapped the registry to floor 2, and its summary of threads 1 to 9 was paid at 10. Its first knot took options on a mirror the router raised to floor 2, and the read laid them out. Every older address still resolves.
- **`ways:thread`.** Its root is S3's six sentences, steps 1 to 8 are gone, and its provenance stays at 9. The way it replaces stands at `archive:ways:thread:2026-11-03`. The router now hands over exactly the six sentences the nine ran.
- **`function:thread` 2, 3, 5, 7 and 8 re-voiced.** An act is told from an option by where it stands, and a live end waits on the hand whose room its place was put in. A line that closes with the clause is still an act and still waits on the handle it names. The law it replaces stands at `archive:function:thread:2026-11-03`.
- **The page**, happyseaurchin-home #603. It reads acts and options by where they stand, takes cards from the rooms, and makes a tap write the option's words and put the place in the offerer's room. Read against the live beach, old reader against new, only one address changes: thread 5 at 5.112, an untaken option the old reading took for an act because it says "waits for" (the mistake-proofing lane's §5).
- **The battery** follows this merge, so the form pass reads threads opened from 3 November by where their lines stand.
- **A limit of position.** A hand's own last line beneath its own act, with nothing beneath it, reads as an option it offered. So an answer a hand records beneath its own question, offered with no options, keeps the asker's card open. Asking with options avoids it: the answer goes one deeper beneath the option chosen.

## What the minds did

**S**

- **`word`, the one miss.** Recording dana's "Publish it", the mind chose rook's older option 1.2, "dana decides without a review", over 1.11, where the thread stood after wren's review: *"Dana's 'Publish it' took my earlier option 1.2, which already holds my line, so the outcome goes one digit deeper at 1.21."* By the rooms, dana's card stays open. R made the same miss with the keyword in every seed, so the keyword isn't what prevents it.
- **`place`** tied beside dana's line at 1.12 with its options beneath, which is David's form exactly, and its card cleared.
- **`self`** went one deeper, to 1.31, and left its option's words standing.
- **The place.** Only `step`'s mind spelled it `thread:<address>`. The rest wrote "thread 3", "Thread 1 at 1.12" or "1.31". Two first wrote an address with two dots and posted a correction after it.

**S2**

- **The spelling held.** All seven minds that told a room wrote `thread:<address>`.
- **`word` was cured:** *"1.11 is the reading wren left for 'dana publishes the page', so my publish line answers that option directly in my own block."*
- **`place` took an untaken option.** It took wren's option at 1.13, "rook rebuilds it on the new chart first", which stands at the same depth as dana's line at 1.12. It worded its act to fit ("rebuilt on the new chart"), which its draft doesn't show: *"1.13 is the option dana's thread offered for rook's next step after dana's 1.12 request."* Rook's card stays open.
- **`self`** tied at its own option's address, 1.3, and replaced the option's words: *"The tool reported that my line at 1.3 replaced an earlier line there … so the replacement is what the way asks for."*
- **`reask`** tied at its own option's address, 1.11, which dana had answered. It replaced the option's words so that its new options would sit at 1.111 and 1.112.

**S3**

- **`word`** made S's miss again: *"1.2 is dana deciding without a review, which is what happened, but my block already holds a line at 1.2, so the publish goes one option deeper at 1.21."*
- **`place`** made S2's miss again. It took wren's untaken option at 1.13 and worded its act to fit (*"rebuilt the page on the new chart"*), and S3 has no deepest-lines sentence.
- **`self`, `twin` and `reask`** went one deeper and left the line they held standing.
- **The place.** Six of seven spelled it. `twin` wrote "Thread at 1.1211", and `self` wrote `thread:1.3.1`, then corrected it in a second line.

**S4**

- **The one knot did what it was for.** `self`, `twin` and `reask` each tied at the line they already held, kept its words and added to them: *"rook adds the spring tides before anyone reviews — done: tides:draft 2 is draft 1 with the spring tides added"*.
- **`word`** chose rook's older option 1.2, as S and S3 did, and tied there in place, rewording it: "dana decides without a review" became *"dana decided without a review: in chat she said 'Publish it.' …"*. The option as offered is gone, and that is the line lost.
- **`place`** took 1.13 again and told dana with no place at all.
- **The place.** Four of seven spelled it. `open` wrote "thread 3" and `twin` "thread 1.121", and `place` named none.

## What it shows

1. **David's form carries the nine without a keyword.** S3, six sentences, scored 33 of 35, lost nothing, and spelled six places in seven, which meets the gate fixed before it ran. S, the same without the spelling, scored 34.
2. **The place has to be spelled out.** Told only "the place", one mind in seven wrote `thread:<address>`. Told the spelling, 17 of 21 did across three runs. The page finds cards by that spelling, and so does the waker: it wakes an agent with the thread in its window only when a line names `thread:<address>` (`genus-one/waker.py`, line 1131).
3. **Two misses outlast every version, and neither is the keyword's.**
   - `word` took rook's older option over the one wren's review left, in S, S3 and S4. R made the same miss with the keyword in every seed.
   - `place` took an untaken option beside the line it answered, in S2, S3 and S4. H2 made the same miss with the keyword.

   "The thread stands at its deepest lines" is the only thing that cured `word`, in S2's one run. `place`'s miss is not that sentence's, as this proposal first supposed it might be, because S3 and S4 missed it without the sentence.
4. **The one knot works where a hand holds the right line.** S4's `self`, `twin` and `reask` all tied in place and kept the words. Its lost line came from `word`, which held the wrong line, an older option, and rewrote it in place where S and S3 went one deeper beneath it.

## Found beside the score

- **The router lets an answered option be reworded.** Its guard (`src/tools/stream.ts`, lines 964–976) checks only the options a say offers beneath it. A hand that says at its own option's address after another hand has answered it rewords the option, and the write lands. S2's `reask` did exactly this on the test beach, which has the same guard. This holds under the keyword law too. Not built: it's router code, and a decision of its own.
- **A room line can name several places.** S2's `take` wrote the knot and both its options as places, so the page would show dana three cards for one ask. A page should fold an untaken option's place into its knot's card.
- **Two dots in a room line can't be refused.** A room line is free text, so a place written with two dots stays there, with any correction after it. Across the four runs, six uses' room lines carried one. This proposal first counted three across two runs, and it was four.
- **The spelling check read a full stop as part of an address.** `short.py`'s strict check refused a place followed by any dot, so *"Please pick up at thread:3."* went uncounted in S2's and S3's `open`. The page's card reader and the waker both read it as `thread:3`.
  - **The mend**, made after S3 ran: a full stop may end the sentence, and `thread:1.3.1` still names no place. `selftest_s.py` now plays six written places through the check in CI, and the old check got four of them right.
  - **What moved.** No score moved. S2's count rose from 6 to 7, and S3's from 5 to 6, which is what puts S3 at the gate. As the check stood when S3 ran, S3 missed the gate by that one line.

## Proposed

### 1. The keyword comes out, with S3 as the way

Each piece goes at David's word (done on 3 November, above, but for the battery):

- **One live walk first**, through the real router on a throwaway thread, before the way loses its steps. The test beach's commands stood in for the tools. A live mind opens a thread by an append to `spine:thread`, which the law's root line names but none of the six sentences teaches.
- **`ways:thread`.** Its root becomes S3's six sentences, and its steps 1 to 8 go, with the standing text at `archive:ways:thread:<date>` first. The router hands over a way's root and steps without its provenance (`wayText`), so a session gets exactly the text the nine ran.
- **`function:thread` 2, 3, 5, 7 and 8 re-voiced.** An act is told from an option by where it stands, never by its words, and a live end waits on whoever's room its place was put in. The standing text goes to `archive:function:thread:<date>` first. Threads tied under the keyword are read by the law they were tied under, as 7 already does for threads tied before 29 October.
- **The site**, in a happyseaurchin PR of its own. `threads.js` reads taken, live ends and cards from where lines stand and from the rooms, not from `CLAUSE` (lines 143–157, the tree at 194–221, `waiting` at 526). Its tap (line 423) and `loom.html`'s (lines 1297–1304) write the option's words with no clause.
- **The battery.** The form pass reads threads tied after the change by the new law, as `V2_SINCE` does for the last change, and `short.py`'s grade becomes the uses' grade.

### 2. Apart from the keyword

The router should refuse a say that rewords a hand's own option after another hand has answered it. This is router code, and its merge redeploys the server.

## What this doesn't settle

- **One run a cell, on the smallest model.** Every figure here is one mind's per use, and S3 passed at the gate's edge.
- **The grade is lenient.** It accepts two addresses in `place` and in `reask`, and any spelling of the place. So these scores can't be compared with H3's 40 of 40, which also graded the keyword.
- **The live calls.** The walk on thread 11 was weft's own hand through the real router. Another hand taking an option, a room told and the guard were played only on the test beach, whose guard is the router's.
- **`word` and `place`.** S3 carries both misses, as the keyword's law did in R and H2. S2's sentence cured `word`, but in that run `self` and `reask` wrote over their own options, which neither did in S or S3. One run each can't say whether the sentence did that.

## What was done

On the beach and the site, see "Done". In this repo:

- the four deliveries' teachings (`way_s.txt` to `way_s4.txt`, `ways-thread-s*.json`, `function-thread-s.json`)
- `short.py` and `selftest_s.py`, with the battery's and test beach's hooks, and the spelling check's mend
- the 36 runs, with the CI pass re-grading S at 34, S2 at 30, S3 at 33 and S4 at 31, and playing all four deliveries' acts and six written places by hand
- the README
- `thread-test` 4.9, 4.91 and 4.911, with the branch's summary, the provenance and the sentinel's description

The sentinel is in `src/`, so merging this redeploys the router and ends every live MCP session.
