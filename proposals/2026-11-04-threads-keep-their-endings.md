# Threads keep their endings — waits on, complete, and a date for later

**Date**: 4 November 2026
**Lane**: weft-bee.2, weft (Claude Code, Opus 5.5, on the Mac)
**Status**: BUILT on 4 November, at David's GO the same day. The battery ran first, and the fallback way passed its gate. `function:thread` and `ways:thread` were re-cut at 12:13Z, each archived first, and the page (happyseaurchin-home #608) and the battery (#586) were merged at 12:32Z. See "What was built", at the end. It turns back part of `proposals/2026-11-03-threads-without-the-keyword.md` (#576), the day after it landed, at David's question about it.

## The ask

David, 4 November:

> "A thread used to say 'waits on' or 'complete'. I may have got rid of a useful function. I didn't want coded words, to ensure the threads works across all usecases. … where LLM repeat the experience I have which is guessing that things are left pending for a user … I don't want to be badgered by people … So, what's the middle ground...? I guess I can do a 'reject' knot in threads directed to me I am not interested in; or 'delay' knot so I deal with it at a future date; and equally the person who handed over the thread can re-knot what they've created to remove it from 'waits on'."

Then, having seen the moves played:

> "If we keep it all within threads with the 'waits on' and 'completed' and perhaps add the 'reject' etc, does this keep everything on threads? And threads can be 'self-contained' in some way, which is potentially more efficient -- a single thread, long-rung spindle for a sequence whatever that sequence is used?"

Then: "Write it up".

## What the ending carried

Since 3 November a line is an act or an option by where it stands, and a live end waits on whoever's room holds its place (`function:thread` 3 and 5). The ending had carried two facts that this doesn't replace.

1. **Whose move it is.** That is a name, and a position can't hold a name. Inside a thread a name can only live in the words of a line; outside it, only in a line written in that person's room. Without the ending, the state moved out of the thread into the rooms.
   - The site's page reads rooms, so a person's cards are right when the room line is.
   - The router's read and the door (`renderPlace` in `src/cross.ts`) show a flat list of lines. So a Claude reading a thread has to guess whose move it is.
   - Options nobody took then read as things waiting on someone. Thread 3 still carries "David makes the store at console.upstash.com…" at 3.2, which is history.
2. **Act or option, where position can't tell.** A hand's own line beneath its own act reads as an option it offered (#576 names this "a limit of position"). So taking back an ask, finishing your own job, and recording an answer given in chat all read as new options.

Found beside these, in the page's reader (`threads.js`):

- **The tap's answer is silent.** The tap writes the option's words and puts the place in the offerer's room. But the offerer's own option line stands at that address, so `stillWaits` counts the offerer as having tied there, and the offerer's page shows nothing.
- **A hand-over to your own later self is silent.** With no options, the hand's own line at the place counts the same way, so no card shows.
- **Thread 12's newest ask is missing from David's page.** It was tied this morning after his "Merge the four", but the line in his room spells the place `thread:weft 12.1111111` and was written as a plain string with no hand or time. `PLACE` and `roomPlaces` read neither. With an ending, the ask would show whatever the room line said.

## The moves, played

`scripts/thread-moves.mjs` plays ten moves through the site's own `threads.js`, from happyseaurchin-home main at 875a575, as live. alice asks and bob is asked, in two ways:

- **as tied today**: no ending, and the place put in the next hand's room;
- **with the endings**: every room left empty.

| Move | As tied today | With the endings, rooms empty |
|---|---|---|
| ask, with two options | ok | ok |
| bob takes an option (the tap) | misses: alice is never told | ok |
| bob refuses, and tells alice | ok | ok |
| alice takes it back | misses: it reads as a new option and bob's card stays | ok |
| alice finishes her own job | misses: it reads as an option | ok |
| alice records an answer bob gave in chat | misses: it reads as a new option and bob's card stays | ok |
| alice hands work to her own later self | misses: no card | ok |
| alice hands work to bob, no options | ok | ok |
| bob puts it off to a date three days ahead | misses: the card stays now | ok, only because nothing reads the date yet |
| bob put it off to a date now passed | ok | misses: nothing reads the date yet |

With the endings and no line in any room, nine of the ten moves leave what they should. The tenth misses because the reader doesn't read a date yet. The date three days ahead passes for the same reason, and it must still pass once the reader learns dates.

Refusing and taking back need no new word. Each is an ordinary line with an ending:

- "not for me · waits on alice" refuses and hands it back;
- "not for me · complete" refuses and ends it;
- "withdrawn: … · complete", under one's own ask, takes it back.

## Other roads, set aside

- **Position alone, with the reader saying the state.** This was weft's first answer to David's question. Every reader would have to work out the state from position and from the rooms of everyone concerned. The router, the door and the waker show lines, not state. And a name can't be a position.
- **One deeper under your own line**, tied beneath a digit left empty. It settles act or option for a hand's own lines, and the page already reads it right. But it carries no name.
- **The handshake as replies in the room.** It puts the job's sequence outside its thread.
- **Conditions behind the zero, stamped by the door**, as the hand stamps a card's state (`function:ahead` 2). It keeps words out of the line. But it adds a new structure under every knot, any plain write loses it, and a reader of the words never sees it.

## Cards

David asked whether the hand-over could go through cards instead of rooms.

- **A card is its holder's own.** It is one doable thing in its holder's own hand, and only the holder moves or finishes it. The hands page says "nothing is assigned to anybody". Putting a card into someone else's hand breaks that, and is the badgering David doesn't want.
- **The endings already give the hand-over a card.** With them, a thread line that waits on someone shows on their page as a card (the loom). They answer it on the thread. If they mean to come back to it, they write a card of their own.
- **Nothing changes for the hand.** `function:ahead` doesn't change, and every hand stays readable by anyone at `happyseaurchin.com/hands/<handle>`.

## Proposed

### 1. The endings come back, with a date for later

Every act closes with one of:

- ` · waits on <handle>`: the move is theirs, a handle on this beach;
- ` · waits on <handle> from <date>`: theirs from that day, written 2026-11-07; until then a page keeps it off their cards;
- ` · complete`: nothing follows.

An option never closes. That is how the two are told apart, as from 29 October to 3 November. Refusing, taking back, finishing and recording an answer are acts like any other.

The room line stays, as the doorbell. It wakes an agent, since the waker rings from a room line, and it tells a person who reads their room. It never holds the state.

### 2. Battery first

The nine run on the candidate way before any law moves (`function:thread` 7), one fresh smallest-model mind a use, at David's word.

- **The candidate.** S3's six sentences with one more: "End your line with whose move is next: ' · waits on <handle>', adding ' from <date>' if not before that day, or ' · complete' when nothing follows." The wording is what the run tests.
- **The fallback.** The way of #570, standing at `archive:ways:thread:2026-11-03`, which scored 40 of 40 with the ending graded, with the date added.
- **The grade.** It grades the ending again, as in #570's 40 checks, and the date where a use puts something off. The gate is fixed before it runs, as #576's was.
- **The cost.** About 3 cents a run at list.

### 3. The law and the way, archived first

- **`function:thread` 2, 3, 5, 7 and 8** are re-voiced with the ending, the date, and the room as doorbell. Threads tied without endings, from 3 November to this re-cut, are read by where their lines stand (their 7). The law it replaces goes to `archive:function:thread:<date>`.
- **`ways:thread`** becomes the version that passes. Its standing text goes to `archive:ways:thread:<date>`.

### 4. The page

One happyseaurchin-home PR:

- the tap writes ` · waits on <the hand that offered it>` again;
- the reader reads ` from <date>` and keeps such a live end off a person's cards until that day, as a "later" row on the loom;
- cards from rooms stay, for the threads tied without endings.

`scripts/thread-moves.mjs` checks it before merge: ten of ten with the endings.

### 5. The battery's form pass

It reads threads tied from the re-cut by their endings again, as `V2_SINCE` did for the first time.

The router needs no change: the ending rides in the words its read already shows.

## Who builds it

The session that took the endings out (lane thread-loom.1) touched every one of these: the way, the law, `threads.js`, the loom and the battery. At David's GO, weft-bee hands it this proposal.

## What this doesn't settle

- **The date's spelling.** A bare date is proposed. "Later" by a rung, as the hand piles cards (this week, this month), could follow.
- **Scale.** Finding everything that waits on one person means reading every thread. At scale the room line becomes that person's index of places. It points at the state in the threads and never holds it.
- **Agents.** They still need the doorbell, so a hand that hands work to an agent still writes in its room.

## What was done

- **In this repo:** this file, and `scripts/thread-moves.mjs`, run as `node scripts/thread-moves.mjs <happyseaurchin-home>/threads.js`.
- **On the beach:** a knot beneath thread 11's last line, carrying the job on from "the keyword is out of threads", with its place in David's room.

## What was built

At David's GO (4 November, tied at `thread:weft` 11.112111111), weft-bee handed the build to thread-loom.1, which built it the same day. weft-bee then checked it against the beach and the live page.

- **The battery first** (bsp-mcp #586). The grade and the gate were committed before any mind ran. Ten uses each, one fresh claude-haiku-5-5 a use, $0.0687 for both runs.
  - The candidate, S3 with "End your line with whose move is next: …", scored 43 of 47. Every ending in the nine was right, but the use that puts something off wrote its date in words, and the use that takes its own option rewrote that option and lost its words. It missed the gate.
  - The fallback, #570's way with "written 2026-11-07" added, scored 44 of 47: every ending right, nine of nine well formed, the date right, nothing lost. It passed, and is `ways:thread` now.
  - The battery's form pass reads endings again for threads opened from the re-cut (`V4_SINCE`, 2026-11-04T12:13:42Z). Threads opened from 29 October up to it are still read by position.
- **The law and the way**, re-cut at 12:13Z, their standing texts first copied to `archive:function:thread:2026-11-04` and `archive:ways:thread:2026-11-04`.
- **The page** (happyseaurchin-home #608):
  - `threads.js` reads the date. A live end that waits on someone from a day not yet come is not on their cards until that day; `waiting(handle).later` lists it.
  - A place in someone's room makes a card only when the thread's own lines carry no ending, which covers the threads tied on 3 and 4 November.
  - A tap writes the option's words and ` · waits on <the hand that offered it>`, and still rings that hand's room.
  - On the loom, TAKE shows the ending, and a thread put off is a green tile, "thread · later, from <date>", until its day.
  - `mistake-proofing.html` says again what keel's page said (#600), and `spine:mistake-proofing` 1.1, 1.112, 1.13 and 1.5 were put back the same way.
- **On the beach**: the acts still open from the morning were given their endings at about 12:50Z (`thread:weft` 12.1111111, 14.1111, 15.1111 and 4.21). Thread 11, the job that carried this, closed at 11.11211111111 with ` · complete`.
- **The moves, played again** after the merge, on the `threads.js` the live site serves (its sha256 begins 5e30c677): ten of ten with the endings and every room empty. The "as tied today" column keeps its six misses, which is what that way does.

The three points under "What this doesn't settle" still stand. A bare date is what the way teaches; "later" by a rung could follow.
