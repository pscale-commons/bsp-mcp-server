# The room read by its spindle, and since the last visit (2026-10-24)

**Status**: PROPOSED. The beach half is done (below). The router half waits for David's word, because a `src/` merge redeploys the router and ends every live session.

## The ask

David, 24 October, lane y-ray.1, after weft's door had hidden three of his pins in its own parlour: *"The pool should be summarised — it is presented in nested dropdowns in mirror.onen.ai and should be structural in the pool. This needs to be written up. And there should be a meta note about the last time visited so it only scoops that info. So spindle generally, and since last specifically."*

## What stood

- **The door read the room from its first 200 entries.** `pscale_play` folds the room through `foldContributions` (`src/tools/pool.ts` 412). That function gathers through `collectContributions`, whose page stops at `READ_PAGE_LIMIT` (200, `pool.ts` 60). pool:weft holds 243 entries, so the fold reported "count: 200 … more available", called 241–248 "the open container", and left 249–288 unread. David's pins at 286 (the look layer), 287 (three yeses) and 288 (a listing for the /proposal front) were among the unread. A lane met 288 only when David pointed it there, after the slot it asked for had been given to another proposal.
- **The room was not structural.** Of 26 closed containers, two were voiced: 010, and 160, which voiced 161–169 one container early. For most of the record the fold could only say "unvoiced, owed", so the room arrived as a debt notice rather than as its own history.
- **The door already knew "since last", and weft never told it.** The door reads the handle's account (`history:<handle>`, else `witnessed:<handle>`) and takes `coveredThrough` (`pool.ts` 504) as `since_position` (`play.ts` 628, 632). `coveredThrough` is the highest `pool:<room>:<slot>` among the addresses at the account entries' field 2. weft's history entries were appended unlocated, so weft arrived at 0 every time. `coveredThrough` also reads the account through the same 200-entry page, so it never sees the newest marker of a long account. history:weft now holds 168 entries, and the router reads 153 of them, passing over the fifteen written as bare strings. Its 200-entry page therefore fills about fifty entries on.
- **The account was not structural either.** weft's wake reads `history:weft:head`, the record walked to its newest leaf (shell:weft 3.5), so every wake rode the account's spindle. On that spindle 070, 080, 090 and the hundred's line at 100 stood unpaid, and 160 held a session's entry: the scheduled wake's evening settle of 19 October, written into the slot owed the summary of 151–159. orientation:weft 9.25 had recorded this on 19 October and set out how to clear it.
- **General and specific excluded each other.** The fold runs only when the reader has no marker: `wantsFold` needs `sincePosition === 0` (`pool.ts` 2355). A reader with a marker gets the entries after it and nothing above them.

## The rule: the spindle generally, since the last visit specifically

A room is an accumulator and reads as one (block-conventions 3.5). Its summaries are spindle ancestors, which is why the mirror draws it as nested dropdowns. At every door the reader receives two things, together:

1. **Generally, the spindle.** These are the voicings of the hundreds and of every closed container above the newest one. They are read structurally from the containers' zero slots, never through a page of entries. This half is right at any length, and costs a line per container rather than the entries.
2. **Specifically, everything since the last visit.** This is each entry after the reader's marker, whole. The marker is the meta note of the last visit, and it is the reader's own account: its newest entry, located `pool:<room>:<slot>` at field 2 and written when the reader closes. Nothing new is stored and the room holds nothing, so each reader keeps its own place.

**Where the marker stands.** It stands at the newest slot through which the reader has done what the room asks of it. For a telling, that is the beat told (grit 1.243). For a parlour, it is the newest slot before which every ask has its answer. The door hands over only what comes after the marker, so a marker placed past an ask left open would hide that ask from the next visit. A marker therefore never steps over one, and it moves on when the ask is answered.

## On the beach (2026-10-24)

- **pool:weft made structural.** Every closed container is voiced at its zero slot, dense with the span's handles as 3.5 asks. The text that stood at 160, voicing 161–169, was moved verbatim to 170, where +0 inductive puts it, and 160 now voices 151–159. 100 and 200 voice their summary lines. Container 28 (281–289) is the open one, so 290 falls due when 291 lands.
- **history:weft made structural.** 070, 080 and 090 are voiced, and 100 voices the line 010–090. As orientation:weft 9.25 set out, the evening settle was first appended verbatim as an ordinary entry (195), noting where it had stood. 160 then voiced 151–159, and that debt was emptied.
- **weft's account located.** The lane's history:weft entry (196) carries `pool:weft:285` at field 2. The parlour was read through 289; every ask through 285 is answered, and 288 was answered at 289. 286 and 287 are David's and still open, so the door now hands the next arrival 286 onward and not the room from its first slot. The same entry is the account's head, which the next wake reads first (shell:weft 3.5). Run on the live block, the router's own `coveredThrough` returns 285, and its fold finds no container unvoiced.
- **The close carries it.** orientation:weft 7.7 now says to locate every lane's history:weft entry this way, never past an ask left open. orientation:weft 9.22 holds what remains until the router change lands.

## In the router (proposed, not built)

1. **The fold walks the room, not a page of it.** `foldContributions` reads each closed container's voicing at the next container's zero slot, as it does now, and the newest container's entries whole. It walks the containers in order instead of first gathering contributions through `READ_PAGE_LIMIT`. pool:weft then folds to 26 summaries and one open container at any length.
2. **The marker is read from the newest end.** `coveredThrough` takes the highest `pool:<room>:<slot>` across the whole account, either uncapped or by walking the account newest-first and stopping at the first match. A long account must not stop moving its own marker. The same holds for the telling's last entry (`tiers.ts` 1508), which is the 200th entry rather than the newest once an account passes 200.
3. **Both halves at every door.** With a marker, the door delivers the spindle above the entries after the marker: first the summaries of the closed containers over the span already read, then the new entries whole. Without a marker, the fold works as it does now. `wantsFold` no longer requires `sincePosition === 0` at the door. A plain `pscale_pool_engage` with `since_position` keeps its slice unchanged unless `fold` is asked for.
4. **Nothing else.** There is no new block, no new field and no stored state in the router. The marker is the reader's located account entry, which the door already reads, and the summaries are the room's own zero slots.

## Who pays

Each reader pays for its own reads, and the room stores nothing about who read it. A summary is paid in the act of the append that earns it (block-conventions 3.5). The door names an owed summary at every arrival, so the reader who opened a span pays for it.

## Check

- A room of 243 entries folds to its true open container (the newest), carries every closed container's summary, and reports no page cap.
- A reader whose account is located at `pool:<room>:285` receives the closed containers' summaries above entries 286 onward, whole.
- `coveredThrough` returns the newest slot for an account of more than 200 entries whose newest entry is located.
- The RPG's tellings call the same functions on rooms and on character accounts (`tiers.ts` 740, 1505–1509). They read as before or better, since character accounts grow past 200 too.
