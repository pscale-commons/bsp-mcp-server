# The list of tables is a list of places — the beach says where rooms are, and the doors stop calling them tables (2026-09-30)

**Status**: a proposal. Nothing is built, no pull request stands in any other repository, and
nothing on any beach was written: not at Community Recovery's place, not at the apex, and nothing
of Matthew's. §7 lists the decisions, each one act with a recommendation.
**Prompted by**: a finding made in passing at certification.1 (`2026-09-30-confirmed-or-removed`,
§2 and §11; #462, open as this is written): the beach's list of "tables played" named Community
Recovery's place first, and that place is not a game.
**Builds on**: [tables are listed where they are played](../2026-09-20-tables-are-listed-where-they-are-played.md)
(the doors taking up the list, which pscale-beach #69 had made two days before), [rooms declare at birth](../2026-09-21-rooms-declare-at-birth.md) (what
makes a room a table room), [the clock door](../2026-09-22-the-clock-door.md) (a table that has no
rooms) and [Community Recovery on the beach](../2026-09-30-community-recovery-on-the-beach/README.md)
(#458).
**Lane**: opened from certification.1 (watch:weft 481). This sitting held no key. It read, measured
and wrote this folder, and left no line at weft's pile.

## 1. The answer in short

1. **The fault is real, and it runs both ways.** Read today, the list has thirteen rows. Seven are
   tables with a room that declares the play loop. Five are not games at all: Community Recovery's
   place, and the four places of yesterday's market trial. One is a table played on the clock,
   listed only because a stray room stands in it. The five other tables on the clock are missing,
   because a table on the clock has no room (§2, §4).
2. **The list is a true fact under a wrong name.** What the beach derives is the `/w/` places where
   a room has been written, newest first. On 18 September, when the list was made, every such
   place was a table. What makes a table has been ruled twice since, the declaration on the 21st
   and the clock on the 22nd, both in the router and the mirror, and the list followed neither.
3. **Recommended: leave the list as it is derived and change what it is called.** The beach's own
   answer, the router's three lines, the mirror's one note, the package's README and one clause of
   the `worlds` register say *places with a room written*, and say that a place is a table only
   where the place says so. No door tells an agent to "enter" a row. The rows, the cost and the
   wire stay exactly as they are (§6).
4. **Filtering in the handler was built and measured, and is not recommended.** Listing only a
   place where a room declares the play loop takes the thirteen rows to seven for one read more
   per GET. It also drops the table on the clock, makes the beach a third party to the game's
   test for a table, which the router writes and the mirror reads, and rests on a block that is
   born unlatched: one keyless line lists any open place as a table again (§5.1).
5. **Readers filtering is the dearest answer for whoever pays for the beach.** Every read a reader
   makes to classify a row is a GET to the beach: thirteen more per listing today, from three
   codebases that would each carry the rule (§5.2).
6. **What five of the six readers do with a row, they do to a place** (§3): orient an agent at a
   beach, match a mistyped name, warn an Author off a name that stands, find where a character
   plays, find where a handle stands. They were written for tables and go wrong only in their
   words. The sixth, a scenario's page, draws tables and already chooses them itself.
7. **The words do not close the door.** The play door hands the game's gate and its creation
   passage to a fresh handle at any place that holds blocks, a place like Community Recovery's
   included. That was found here, shown offline, and is a lane of its own (§7, decision 4).

## 2. The fault as it stands

`GET https://beach.happyseaurchin.com/.well-known/pscale-beach?tables`, read at 14:05Z and again at
14:25Z on 30 September, the same both times. It opens:

> Tables played at beach.happyseaurchin.com — every /w/\<name> world with a room written, newest
> first: its name, the room (pool:\<address>) its latest voice landed in, and when (touched). …

and lists thirteen rows:

| | name | room its latest voice landed in | what stands there |
|---|---|---|---|
| 1 | `brackenfoot-open` | `pool:300` | a table: eight of its nine rooms declare the play loop |
| 2 | **`community-recovery`** | `pool:community-recovery` | a community's own place: four rooms, none declared, no game |
| 3–6 | `torus-market-4`, `-3`, `-2`, `torus-market` | `pool:sedge`, `pool:sedge`, `pool:birch`, `pool:reed` | the market trial of 29 September: eight parlours in each, one to a hand, none declared, no game |
| 7 | `coldcote-open` | `pool:gate` | a table; its latest voice was at its lobby |
| 8 | `rpg9-clock4` | `pool:211` | a table on the clock, with one room in it that mounts no play loop |
| 9 | `rpg9-pool` | `pool:211` | a table |
| 10 | `brackenfoot-david-julie` | `pool:211` | a table |
| 11–13 | `hollow-king-open`, `threshold-open`, `thornmere-open` | `pool:111` | tables |

Community Recovery's place was first from the moment its rooms were seeded (12:19Z) until a table
was played at 13:53Z, and it returns to the top each time a visitor leaves a line in one of its
rooms. Its row still carries 12:19Z: notebooks written at the place since do not move it, because
only a `pool:` write counts.

**The rule that makes the list** (`api/pscale-beach.js`, the same function in the deploy and the
package): every `/w/` namespace under the beach that keeps a touched map; of those, the ones whose
map names a `pool:` block; newest `pool:` write first. One KEYS and one HGETALL per namespace. No
block is read. A row is a name, a room and a moment, and nothing in it says what the place is.

**What the doors then say**, from the same rows. These are this repository's doors at origin/main,
run over the beach's real handler on a scratch folder, with a place shaped like Community
Recovery's under an invented name (`router-doors.mts`, Appendix A; long lines are wrapped here):

```
  2 tables played here, newest first — each is its own surface: read one with
  agent_id="https://beach.test/w/<name>", or enter it with pscale_play(world="<name>", handle=…):
    • riverside-recovery · last voice in pool:riverside-recovery · …
    • brackentest-kin · last voice in pool:211 · …
```

```
TABLES PLAYED at https://beach.test, newest first — a table is never in the worlds register, and
one of these may be the name you meant:
  riverside-recovery — last voice in pool:riverside-recovery (…)
  brackentest-kin — last voice in pool:211 (…)
Enter one with pscale_play(world="<name>", handle="robin").
```

The mirror's voice is handed the same rows with the note *"the tables played at this beach, newest
first"*. An agent asked what tables stand would name the place, and the router tells it how to
enter.

## 3. Who reads the list

Verified at each repository's origin/main on 30 September (commits in Appendix B).

| reader | where | what it does with the rows | what that act is |
|---|---|---|---|
| the router's index | `src/db.ts` 393–420, `src/tools/bsp.ts` 591–610 | every `bsp(agent_id=<a beach's URL>)` with no block asks for the list beside the index and prints every row under "tables played here … or enter it with pscale_play" | orienting an agent: what stands at this beach |
| the play door, a world that does not resolve | `src/tools/play.ts` 346–365 | prints the first twelve rows as names the caller may have meant, then "Enter one with pscale_play" | matching a mistyped name against the names that stand |
| the play door, the Author's passage at an empty name | `src/tools/play.ts` 285–301 | prints the first twelve rows under "TABLES ALREADY PLAYED" | warning an Author off a name that already stands |
| the mirror's voice | xstream-bsp `src/kernel/claude-tools.ts` 985–1001, fetched by `src/lib/bsp-client.ts` 256 | whenever the voice lists a beach, the whole list rides the tool result with the note above | finding where a character plays, by their passport |
| /models | happyseaurchin `models.html` 175–196 | reads the index of each of the first sixteen rows, looking for `passport:<handle>` | finding where a handle stands |
| a scenario's page | happyseaurchin `rpg.html` 381, 402–404 | keeps the rows whose name begins `<scenario>-` and draws each as a table | drawing the tables of one scenario, which it chooses by name |

Community Recovery's place is not drawn on any scenario's page. The other five are handed its row.
Each of the five was written with tables in mind, and what each does is done to any place that
stands: none of them misreads a row for its being a place. They go wrong in what they say of it.

Nobody else reads the list. Every local repository was swept for the query and the readers' names;
`src/kernel/pscale-wire.ts` in xstream-bsp holds an uncalled copy of the router's reader.
beach.idiothuman.com is deployed from before the list existed (its main is of 25 August) and
answers the query with its plain index. No code reads the answer's opening line: each reader takes
the `tables` array. A person or an agent fetching the address reads the line first.

## 4. What a table is, and where that is decided

Two rulings, both made after the list, and neither of them in the beach.

- **A room declares** (21 September). *"One mirror; a room may switch on a few named behaviours, a
  beach never can."* A room is a table room when its sibling block `convention:<room>` names the
  play loop: its line opens `grit` (world-genome 6.3). The router writes that line when it founds
  a room (`src/tools/pool.ts` 628–657) and the mirror reads it (`isTableRoom`, xstream-bsp
  `src/kernel/convention.ts` 284). A room with no declaration is a parlour, on any beach.
- **A table on the clock has no room** (22 September). *"A clock table is founded as one, never
  switched on at a pool room … a character stands at a beat, not in a room."* The router tells
  one by three names standing at the surface: `spine:temporal`, `function:temporal` and a
  keeper's hold (`src/tools/clock.ts` 65–68).

Counted on 30 September, from the morning's image for names and declarations and from each
place's public index read at 14:25Z:

- 73 `/w/` places are known at the apex: the 72 in the morning's image, and Community Recovery's,
  made after it. 70 hold a block, 67 keep a touched map, and 13 have a room stamped in it. Those
  thirteen are the list.
- 85 declarations stand in 52 of the places, and every one of them says `grit`. At the apex
  itself five rooms are declared: four `parlour`, one `studio`. So a declared room is not always
  a game's.
- Six tables on the clock stand. The list names one of them.

The list's own rule, a room written, was the whole of what a table was on the day it was made.
Three days later the first table on the clock stood and could not be listed. Eleven days later the
market trial was listed and is no table. The rule is now neither necessary (the clock) nor
sufficient (a community's place).

## 5. The three answers, weighed

Measured by running the real handler over a copy of exactly what it reads at the apex: each
place's touched map as its public index served it, and the 85 declarations, matched name for name
against the live indexes. The handler as deployed, run on that copy, returned the live answer row
for row, so what each change would list today is known, and not estimated.

| | rows today | asked of the store for one GET | what changes |
|---|---|---|---|
| as it stands | 13 | 68 commands (1 KEYS, 67 HGETALL), 2 round trips | |
| **the words** (recommended) | the same 13 | the same | one line of the answer and its comments; the README; three lines in the router; one note in the mirror; one clause on the beach |
| only a place where a room declares the play loop | 7 | 69 commands (one MGET of 17 keys more), 3 round trips | the derivation in the handler, and its smoke, four of whose eleven checks fail as written; no reader |
| the same test by name only, the declaration unread | 7, today | 68, 2 | one line in the handler |
| readers filter | 13 | 68, then one more GET for each row from each reader that classifies | nothing in the handler; the rule in three codebases |

The list already costs one read for every `/w/` place ever written since August, dormant ones
included: 67 reads for 13 rows. The handler's own comment names the way out when places reach the
thousands, and nothing here changes that.

### 5.1 Filtering in the handler

A place is listed only when a room of it declares the play loop. The names of the declarations are
already in the touched map, and what each one says is one MGET. Today that lists the seven tables
and drops Community Recovery's place and the market trial. The cost is nothing to weigh: one
command in sixty-nine. These are the reasons against it:

- **The beach would hold the game's test for a table.** Today the router writes that line and
  the mirror reads it, and the ruling that put it there says a beach never decides. The handler
  would be a third place that has to agree on "the line opens `grit`", and it would owe a second
  rule the day a table on the clock is to be listed. The list's rule was the whole truth the day it
  was written and missed a table three days later. A filter would be written against today's rule
  in the same way.
- **It drops a table.** `rpg9-clock4` leaves the list, and no table on the clock can join it
  (check 3).
- **It rests on a block that is born open.** A declaration is unlatched beside an unlatched room,
  on purpose (world-genome 6.3, and §3 and §8 of the proposal that made it). Where no declaration
  stands beside a room, any hand can write one, and the place is on the list as a table again.
  Where one stands unlatched as it was born, the same hand can rewrite it, and a table is off the
  list (check 5). That openness is the declaration's own and older than this; a filter would lean
  the list on it too.
- **It narrows five readers that work on any place** (§3). A handle standing at a place that is
  not a table is no longer found, and the mistyped name of such a place is no longer matched.
- **It changes what an existing query answers.** The package's rule for its wire is that
  endpoints may be added and existing ones are not changed. The shape would stand, and what the
  answer holds would narrow for every reader at once.

The same test by name only, a `convention:` name in the map and the block never read, costs
nothing and lists the same seven today. It lists a notice board as a table the day its one room
declares a parlour with its dials set (check 4), and four such rooms stand at the apex.

### 5.2 Readers filtering

The handler stays as it is and each reader drops the rows that are not tables. To know, a reader
must read something at each place: a declaration, or the place's index. Every such read is a GET
to the beach, so the beach's owner pays thirteen more for each listing, from the router on every
index read, from the mirror, and from the pages. The rule would live in three codebases and be
kept in step by hand. The one reader that draws tables already chooses them without a read: the
scenario's page keeps the rows named for its scenario.

### 5.3 The words

The derivation is left alone and every door says what the rows are: the `/w/` places where a room
has been written. It costs nothing per GET, it puts no test in the handler, and it changes no wire
shape. It is also what the readers already do with the rows (§3). And the apex is not only the
game's: an agent arriving there is oriented by what stands, and a community's place is part of
what stands.

What it costs, plainly:

- **The rows stay.** Community Recovery's place is still on the list, under words that claim
  nothing about it. An agent that wants to call a place a table has to read the place first, and
  the mirror's note says which block to read.
- **It is small changes in five repositories and one clause on the beach**: the package, its
  operator clone, the router, the mirror and the site. Filtering in the handler is one change in
  the package and its clone.
- **It does not list the tables on the clock.** Neither does anything else here. The clock lane
  chose not to be listed while it was sealed, and what lists a table with no room is its question.

## 6. The recommendation in full

Every change is words. Nothing is filtered, no key is renamed, and the query stays `?tables`.

**1. The beach's answer** (`api/pscale-beach.js` in pscale-commons/pscale-beach, then the operator
clone). The line every fetch of the address opens with:

> before: Tables played at ${origin} — every /w/\<name> world with a room written, newest first:
> its name, the room (pool:\<address>) its latest voice landed in, and when (touched). Derived
> from each table's own touched map as this was served; nothing is kept for it. A table is its own
> surface at ${origin}/w/\<name>/.well-known/pscale-beach, and its index says who stands there.
>
> after: Places at ${origin} with a room written — every /w/\<name> place where a pool: block has
> been written, newest room write first: its name, the room (pool:\<name>) its latest voice landed
> in, and when (touched). Derived from each place's own touched map as this was served; nothing is
> kept for it. It says where rooms are and nothing of what runs in them: a game's table, a
> community's own place and a trial all have rooms, and which one a place is, the place says
> itself — its lighthouse, and each room's declaration (convention:\<room>). Each is its own
> surface at ${origin}/w/\<name>/.well-known/pscale-beach, and its index says who stands there.
> The key is still 'tables', from when every place with a room was one.

With it go the comment above the function and the line in the file's header, which say "the tables
played here" and come to say "the places with a room written"; the README's paragraph, where "a
world joins the list by being played" becomes "when a room of it is written" and one sentence is
added, that the list says where rooms are and not what runs in them; and the heading of
`scripts/smoke-tables.mjs`. The smoke's eleven checks pass unchanged.

**2. The router** (this repository). Three lines an agent is handed, their comments, and the two
smokes that hold the old words:

> `src/tools/bsp.ts` 603, before: N tables played here, newest first — each is its own surface:
> read one with agent_id="…/w/\<name>", or enter it with pscale_play(world="\<name>", handle=…):
>
> after: N places with a room written here, newest first — a game's table or any other place, and
> the beach does not say which. Each is its own surface and says what it is: read one first with
> agent_id="…/w/\<name>" (its lighthouse, where it has one). Only a table is entered with
> pscale_play(world="\<name>", handle=…):

> `src/tools/play.ts` 295, before: TABLES ALREADY PLAYED at this beach (the beach's own listing,
> newest first — a table is not in the register, and one of these may be the name you meant;
> enter with pscale_play(world="\<name>", handle="…")):
>
> after: PLACES THAT ALREADY STAND at this beach with a room written (the beach's own listing,
> newest first — a table is not in the register, and one of these may be the name you meant; a
> table is entered with pscale_play(world="\<name>", handle="…"), and a place that is not a game
> says what it is at its own lighthouse):

> `src/tools/play.ts` 357 and 362, before: TABLES PLAYED at …, newest first — a table is never in
> the worlds register, and one of these may be the name you meant: … Enter one with
> pscale_play(world="\<name>", handle="…").
>
> after: PLACES WITH A ROOM WRITTEN at …, newest first — a table is never in the worlds register,
> and one of these may be the name you meant: … If the one you meant is a table, enter it with
> pscale_play(world="\<name>", handle="…"). A place that is not a game is not entered: read its
> lighthouse.

**3. The mirror** (xstream-bsp `src/kernel/claude-tools.ts` 994–999). The rows ride the voice's
tool result as `places`, with this note in place of `tables_note`:

> the /w/ places at this beach that have a room written, newest first — a game table or any other
> place, and the list does not say which. Each is its own surface at \<beach>/w/\<name>: read one
> with agent_id="\<beach>/w/\<name>" and let it say what it is. Call a place a table only where a
> room of it declares the play loop (its block convention:\<room address>, the line opening
> "grit") or where it keeps a clock of its own (spine:temporal beside function:temporal); a table
> is never in the worlds register

**4. The `worlds` register at the apex.** It is the one block on the beach that states the list as
law (the morning's image was searched; every other mention is a log or a worktable). One clause of
its opening line, written by a keyed session under weft's key, the standing block copied to
`archive:worlds:<date>` first:

> before: WHERE TABLES ARE LISTED: not here, and they do not need to be — the beach lists every
> table played at it, at ?tables on this same endpoint (every /w/ world that has had a room
> written, newest room write first, derived from the touched maps, so a table joins the list by
> being played and sinks down it by being left), and an agent reads that same list in the surface
> index bsp() returns for a beach. This register is the CURATED map — canon worlds and the
> operator's open tables; the tables listing is the LIVE one.
>
> after: WHERE TABLES ARE LISTED: not here, and they do not need to be — the beach lists every /w/
> place that has had a room written, at ?tables on this same endpoint (newest room write first,
> derived from the touched maps, so a table joins the list by being played and sinks down it by
> being left), and an agent reads that same list in the surface index bsp() returns for a beach.
> That listing says where rooms are and nothing of what runs in them: a table is on it once it is
> played, beside places that are no game at all, and what a place is, the place says itself — its
> lighthouse, and each room's declaration. This register is the CURATED map — canon worlds and
> the operator's open tables; the listing is the LIVE one.

**5. The site.** One comment in `models.html` ("at the tables played there"). No behaviour
changes: /models finds where a handle stands, and a scenario's page keeps choosing by name.

**What this looks like when it is done**, from the same run as §2 with the first two changes
applied on scratch copies:

```
  2 places with a room written here, newest first — a game's table or any other place, and the
  beach does not say which. Each is its own surface and says what it is: read one first with
  agent_id="https://beach.test/w/<name>" (its lighthouse, where it has one). Only a table is
  entered with pscale_play(world="<name>", handle=…):
    • riverside-recovery · last voice in pool:riverside-recovery · …
    • brackentest-kin · last voice in pool:211 · …
```

**The order, after David's word.** Any order leaves every door true at each step.

| step | what | where | how it is checked |
|---|---|---|---|
| 1 | the answer's line, its comments, the README, the smoke's heading | pscale-commons/pscale-beach | `offline-checks.mjs` 2; `npm run smoke:tables`, eleven of eleven unchanged |
| 2 | the same, mirrored | pscale-beach-happyseaurchin, which deploys the apex. The idiothuman deploy does not serve the list and has nothing to take | the live answer read after the deploy: the same rows under the new line |
| 3 | the three lines, their comments, two smokes | this repository | `smoke:wellknown` and `smoke:author-door`, which pass with the lines changed (run on a scratch export: 54 of 54, 20 of 20) |
| 4 | the note | xstream-bsp | its typecheck, and the voice listing the apex once |
| 5 | the clause | the apex `worlds`, weft's key, archive first | the read-back |
| 6 | the comment | happyseaurchin | |

## 7. Decisions

Each is one act. The recommendation is the sentence as written.

1. **Say what the list is.** Leave the list as it is derived, and change the words at the beach's
   answer, the router's three lines, the mirror's note, the package's README and the clause in
   `worlds`, as §6 gives them. *Recommended.*
2. **Or make the list hold only tables.** List a place only where a room of it declares the play
   loop, in the handler; the change is written and runs on both handlers (Appendix A). *Not
   recommended*: it puts the game's test in the beach, drops the table on the clock, and one
   keyless line at an open place undoes it. It is the answer if the list must never name a place
   that is not a table, at the price of those three.
3. **Keep `?tables` as the query's name and `tables` as its key.** *Recommended.* Only code reads
   them, four readers hold them by name, and the answer's own line says where the name came from.
   Renaming both to `places` is a change to the wire, made in every reader at once.
4. **Give the play door a lane of its own.** A fresh handle at a place that holds blocks and no
   game is handed the game's gate and its creation passage, whose writes would found a lobby and
   a character at that place (`src/tools/play.ts` 415–443: where a place keeps no `char-creation`
   the door takes the bundled one). The door itself writes nothing. Shown offline on the real
   handler (`router-doors.mts` 3). It is reachable by the place's name with or without this list,
   so no answer here closes it. *Recommended*: a proposal of its own, and soon.
5. **Leave the tables on the clock unlisted for now.** Five stand off the list and one is on it by
   accident. What lists a table with no room is the clock lane's to say. *Recommended.*

Not a decision here: the four places of the market trial stay on the list under any answer but
the second. Whether they are set aside is the tidying lane's.

## Appendix A. The offline checks

Two scripts in this folder. Both run the beach's real handler in-process on a scratch folder, make
no network call, and use invented names. Point `BEACH_DIR` at a checkout of
`pscale-commons/pscale-beach` at main, or of an operator's clone:

```bash
BEACH_DIR=/path/to/pscale-beach node proposals/2026-09-30-the-list-of-tables-is-a-list-of-places/offline-checks.mjs
```

```bash
BEACH_DIR=/path/to/pscale-beach npx tsx proposals/2026-09-30-the-list-of-tables-is-a-list-of-places/router-doors.mts
```

`offline-checks.mjs` runs the handler four ways over one store: as `BEACH_DIR` holds it, with the
words of §6, with the filter of §5.1, and with the same test by name only. The three changed
handlers are copies in the scratch folder, each made by one exact replacement, so the script is
also the record of each change. `BEACH_DIR` is never written to. 29 checks, all passing on 30
September 2026 against both the handler deployed at beach.happyseaurchin.com (the operator clone
at origin/main, a9fc45a) and the public package at origin/main (a8bffeb).

| | what is shown |
|---|---|
| 1 | the fault, as deployed: a community's place is listed first under "Tables played"; a row carries nothing that tells a table from a place; a member's notebook does not move the row; a table on the clock is missing; one KEYS and one HGETALL per place |
| 2 | the words: the same rows in the same order, the store asked exactly the same, the answer opening "Places at … with a room written", the envelope's shape and the plain index unchanged |
| 3 | the filter: the table listed; the community's place, a trial and a notice board not; no table on the clock listed; one MGET and a third round trip more; a voice at the lobby still raises its table |
| 4 | the filter by name only: no read more than today, and the notice board listed as a table |
| 5 | a stranger with no key writes one line beside the community's open room, and the filter lists the place as a table; the same hand rewrites the unlatched line beside a table's room, and the filter drops the table; the words' list is what it was |

`router-doors.mts` prints what this repository's doors say from those rows (§2), and what the play
door hands a fresh handle at a place that is not a game (decision 4). It asserts nothing: it is
there to be read as an agent reads it.

Also run, and not kept here:

- **The apex, as it stands.** A scratch copy of what the handler reads there was built from each
  place's public index and the declarations in the morning's image. The handler as deployed
  returned the live answer row for row, and the three changes were run on the same copy for the
  table in §5. The copy names every place ever made at the apex, so it stays out of the
  repository.
- **The package's own smoke**, `scripts/smoke-tables.mjs`: eleven of eleven on the handler as it
  stands and with the words; seven of eleven with either filter, because its worlds declare
  nothing.
- **The router's smokes** with the three lines of §6 changed, on a scratch export of origin/main:
  `smoke:wellknown` 54 of 54 and `smoke:author-door` 20 of 20, each with its expected words moved.

Not run: anything at a live beach beyond reading the list, the `worlds` register and the public
index of each place; the mirror's note, which is one string and was not built.

## Appendix B. Sources

- The handler: `pscale-beach-happyseaurchin/api/pscale-beach.js` at origin/main (a9fc45a), the
  list at 465–502 and its answer at 1747–1761; `pscale-commons/pscale-beach` at origin/main
  (a8bffeb), the same function at 473–510 and its answer at 1901–1915, the README's paragraph on
  worlds, `scripts/smoke-tables.mjs`, and its CLAUDE.md on what is frozen in the wire.
  beach.idiothuman.com is deployed from `pscale-beach-idiot` main (38153e2, 25 August), which has
  no such function.
- The router, this repository at origin/main (fbf7d3e): `src/pscale-wire.ts` 204–245; `src/db.ts`
  377–429; `src/tools/bsp.ts` 576–610; `src/tools/play.ts` 244–301, 334–365 and 391–443;
  `src/tools/pool.ts` 616–657; `src/tools/clock.ts` 65–77; `src/world-genome.json` 1.54 and 6.3.
- The mirror, xstream-bsp at origin/main (565a915): `src/kernel/claude-tools.ts` 985–1001;
  `src/lib/bsp-client.ts` 231–275; `src/kernel/convention.ts` 181–184 and 272–286;
  `src/components/mirror/Mirror.tsx` 2095–2102.
- The site, happyseaurchin at origin/main (045e6b4): `rpg.html` 328–334, 381 and 402–404;
  `models.html` 108–112 and 175–196.
- On the beach, read 30 September: the list at 14:05Z and 14:25Z; the public index of each of the
  73 places; the `worlds` register. The morning's image (09:10Z) was read on this machine for
  names, for the declarations, and to find which blocks mention the list; no key was printed.
- The proposals this builds on, above; and `2026-09-21-track-b-prepared.md` §1, point 6, where the
  clock lane notes that the list names a place only once a `pool:` is written, so a table on the
  clock "is listed nowhere by construction".
