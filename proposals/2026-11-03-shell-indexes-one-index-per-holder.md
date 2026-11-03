# Shell indexes: one index per holder

Every holder on a beach keeps one block, `index:<handle>`, listing what they hold: one entry per thing, numbered as it arrives and never renumbered, the thing's card beneath its entry, and card field 5 the one place a holder says who may see the thing, which is exactly what a members' gate reads. The beach appends the entry when a thing is born under the holder's key, a checker sweeps the rest, and none of it adds a tool call or a token to anyone's window.

**Date**: 3 November 2026
**Lane**: shell-indexes design, weft (Claude Code, Opus 5.5, on the Mac), a side session of lane lero.2, run beside the coloured-stigmergy design session (lane colour.1) at David's word; the two met on the beach where they overlap.
**Status**: proposed, for David's GO. Nothing is built. The first build step, a pull request to pscale-beach, is drafted in §8 in words only. On the beach this lane writes only weft's readings, one STATE line, one knot with its place, and its account (§10).
**Builds on**: the family on beach.happyseaurchin.com, `spine:shell-indexes` and `function:shell-indexes` (keel, 2 November, under the shared project lock), `probe:keel-index`, `shell-indexes:weft`, `shell-indexes:happyseaurchin` (David's run, 3 November) and `pool:shell-indexes`; the members' gate live on beach.bringingtheflavour.com (pscale-beach #102, #103, #104; bsp-mcp #571, #577) and its plan, `2026-11-02-leros-on-the-commons-the-build-to-completion.md` §4.2; the coloured-stigmergy family and its design session's lines at `pool:shell-indexes` 3 and 4.
**Decides**: the six decisions at `spine:shell-indexes` 1.18, 1.118, 1.1118, 1.11118, 1.111118 and 1.1111118.

## 0. The ask

keel proposed on 2 November, at David's word, that "every individual on the beach, human, Claude seat or genus agent, keeps a few accumulating blocks that list what they hold" (spine root), six of them: a shell index and one each for mirrors, rooms, threads, grains and colours. David's own first thought, in the Project Keel the same morning (spine 3): "the accumulator is just a list of the blocks that consist of the shell".

The two hands answered on 3 November. weft (`shell-indexes:weft`) read FEWER at 1.118, one index per holder; CHANGE on the card and on the names; BOTH on who appends, with the append in the beach; GATE on idiothuman first; GO on the order with three notes. David (`shell-indexes:happyseaurchin`), at each decision:

> 1.18 "GO — The 'card' for every index -- you mean the function block that interprets the index? Or is this contained in the index block itself in some way?"
>
> 1.118 "GO — looks good for now."
>
> 1.1118 "GO — ok though i think shell should be index:shell:happyseaurchin -- ie shell is just another kind of index. Unless you can explain why we need to have shell as the 'root' index. And my observation: this format seems to be code creeping into the naming; I am not sure we want to 'operationalise' this. So for example we have spine-mirror-tree, and we have blocks called 'spine:<name>' whereas we can create a mirror from any other block, eg potatoes is the name of the block potatoes:happyseaurchin is my mirror/voice with self-same addresses to the potatoes block. Ensure we are not coding."
>
> 1.11118 "BOTH — Both make sense, but only if we aren't adding to the tool-call loop-A too much. We need to consider cost and semantic-flow ballooning."
>
> 1.111118 "GATE — You can test on idiothuman.com beach -- and I want to create a beach at bringingtheflavour.com which will definitely be a private beach."
>
> 1.1111118 "GO — Yes. Collective indexes come later. We do have beach-wide indexes curated or managed by eg weft."

And in the room (`pool:shell-indexes` 1): "Indexes within the shell makes sense. The question of whether the shell index is a type, or if it is the root in some way, may or may not be important."

This evening David added the idea this design takes whole: visibility beyond the beach, a thing a holder marks can be seen outside the beach.

## 1. The answer in short

1. **One index per holder, `index:<handle>`** (1.118, 1.1118). A thing's address already says its kind, so six lists collapse into one read. One colon, the handle last: the form the beach already uses for anything a handle owns, which is David's potatoes rule. No kind word in any name.
2. **The card is inside the index** (1.18). Entry 132 is the thing; 132.1 to 132.9 its card. What each field means rides in the index's own underscore from its birth, as the accumulation law rides in a history, and stands once in `shell-genome` beside the shell. There is no function block, because an index is an organ, not a family.
3. **The beach appends at a birth and the checker sweeps** (1.11118). When a block named for a handle is born latched under a key that also opens that handle's index, the beach appends one line in the same write. Everything else is the checker's, a script outside every agent's loop. No tool call, no model call and no token is added anywhere; a listed birth costs the store about seven commands.
4. **Field 5 means one thing on every ground** (1.111118): who may be served the thing. On the open beach it declares; on a members' beach the gate reads it, live on SALT since 2 November; to every reader outside a beach, what crosses is exactly what is marked beyond.
5. **Presence and words divide cleanly.** A seal, and a colour, hide words on any beach. Only the gate hides that a thing or a handle exists, from those outside it, and the index is where each holder tells the gate, thing by thing. Agreed with the coloured-stigmergy session: a thing marked self is hidden even from other members.
6. **The order** (1.1111118): the checker first (the first pull request, §8), then the first real indexes by their own holders, then the lab beach brought up to the package, then the append at birth tried there before anywhere else, then the self ring at the gate, the doors that found a handle, the tap and the reflection with the law, and forgetting.

David's two questions, one line each:

- **The card**: it is in the index block itself, entry N and its fields N.1 to N.9, and the index's own underscore says what each field means, so no function block interprets it.
- **The root**: shell was the root in keel's draft only because the index is the shell's own manifest (shell-genome 3.1, one entry per named block) moved into a block of its own; with one index per holder there are no other kinds for shell to be one of, so `shell:<handle>` is simply entry 2 and the name needs no second word.

## 2. What stands today

Read on 3 November 2026, from the beaches over the wire and from the package's code.

**The probe.** keel founded `probe:keel-index` on 2 November under its own latch and ran every act an index needs with bsp() alone (spine 1.1 to 1.16): founded in one write with nine entries; the tenth supernested the block to floor 2 and landed at 11, every earlier number kept (7 reads as 07); the beach named the summary owed at 10 and one scalar paid it; a card field written by its address landed exact; one entry appended sealed to self, with latch and sealing word named apart; an append beneath an entry took its first empty digit, which is why card fields are written by address and never appended. The beach stamps 3 on every appended entry, so 1, 2 and 3 keep the accumulator's shared meaning: who, where, when.

**The gate, live.** beach.bringingtheflavour.com, SALT's beach, has run the members' gate since 2 November (pscale-beach #102). For a stranger, `beyondOf` in `api/pscale-beach.js` takes the handle from a block's last name-word (`sed:`, `grain:`, `archive:`, `probe:` and `index:` exempt), reads that handle's `index:<handle>` if one stands, else the keepers' (`BEACH_KEEPERS`), finds the entry whose line is the block's name or opens with it and a space, and serves the block only when that entry's 5 reads `beyond`; anything else, missing blocks included, is one plain `401 members_only`. An index decides for itself: `index:<h>` is served to a stranger only if it lists itself beyond. Each index is cached a minute per warm instance. The gate already reads **one index per holder**.

**SALT's index.** `index:davidmpinto` was founded there on 2 November, before the names stood: 1 passport, 2 shell, 3 history, 4 stash, then 5 `notice` and 6 `pack`, both beyond; its law says the entries after the four organs are the keeper's beach blocks "and the five indexes as born". Its cards carry 1 who, 3 the stamp, 4 the kind, 5 visibility, 6 standing, 9 why, and the entry's line the thing's name and one line. `scripts/copy-world.mjs --beyond` writes the same card, `{_: '<name> — copied from <from> on <day>; served to anyone', 1, 2: '', 4: 'copy', 5: 'beyond', 6: 'standing'}`, and pays the summaries it makes owed with a formulaic line.

**The open beach.** beach.happyseaurchin.com holds 1,997 blocks. One stands under the name: `index:waer`, waer's stored snapshot of the beach index (22 September). Counting blocks by their last name-word, the rule the gate and handle_bound read: 105 are named for weft, 91 for happyseaurchin, 56 for Phenomemental, 51 for keel, 32 for egg-one. Four mirrors already carry a kind word as a family name, `threads:weft`, `threads:keel`, `threads:happyseaurchin` and `threads:Phenomemental`, each a reading of the threads proposal. In the last thirty days 988 blocks were born, 33 a day and 112 on the busiest; 770 of them were named for a handle.

**The lab beach.** beach.idiothuman.com holds 53 blocks and serves the package as it stood in early June, with three later ports in its own repository, `happyseaurchin/pscale-beach-idiot` (#5 the append race, #6 relinquish, #7 numeric leaves). Its handler has no touched or born stamp, no lock inheritance, no handle_bound and no gate. To be a lab for anything here it first takes the package's main (§7, step 3).

**The sibling.** The coloured-stigmergy design session left two lines in this family's room (`pool:shell-indexes` 3 and 4): colour hides words, never presence; a question, what a gate does with a colour rule at field 5; and two asks, a colour entry sealed to self by default, and the router's reflection saying no handle at any block a stranger could not read. Answered at `pool:coloured-stigmergy` 3 and 4, and taken in §5 and §6.

## 3. The six decisions, resolved

Where the hands differ, the resolution is said with whose words carry it. Under the proposal form (`function:proposal` 3), a CHANGE goes ahead and whoever does the work answers the suggestion in their own mirror at the same address; weft's answers to David's suggestions stand at `shell-indexes:weft` (§10).

| step | keel's spine | weft | David | resolved |
|---|---|---|---|---|
| 1.18 the card | 1 who, 2 of, 3 when, 4 kind, 5 visibility, 6 status, 7 and 8 the index's own, 9 note | CHANGE: only what the birth knows and what only the holder judges; never copied state; in the index itself | GO, with the question of where the card lives | **CHANGE** as weft read it, with 6 re-meant as how a thing left; David's question answered (§4.2) |
| 1.118 six indexes | SIX | FEWER: one | GO, "looks good for now" | **ONE**, carried by David's own later words |
| 1.1118 first nine, names | the four, then the five indexes; `index:<handle>` and `index:<kind>:<handle>` | CHANGE: one name; the four, then thread and now, 7 to 9 open | GO, but shell as `index:shell:<h>` unless the root is explained; "ensure we are not coding" | **CHANGE**: one name, `index:<handle>`; the first five fixed, the rest as born; the root explained |
| 1.11118 who appends | AT BIRTH, BY HAND, BOTH | BOTH: in the beach, proved by the birth's key; the checker sweeps | BOTH, if the tool-call loop and the semantic flow do not balloon | **BOTH**, and the cost counted (§4.3) |
| 1.111118 visibility | DECLARE or GATE | GATE on idiothuman first | GATE: idiothuman; bringingtheflavour private | **GATE**: live on SALT; the lab tries the append; field 5 on three grounds (§5) |
| 1.1111118 the order | six steps, collective later | GO with three notes | GO: collective later; beach-wide indexes kept by weft | **GO**, re-cut with the three notes and the lab first (§7) |

**1.18, the card.** keel's card carried state that other blocks already carry: 6 status ('live, 349 entries, floor 3' on the probe), and the six indexes' own fields at 7 and 8 (a thread's live end, a room's read-cursor, a grain's state). weft's CHANGE drops every such copy, because a copy decays: David's roster was found on 18 August to have stopped tracking his blocks (spine 1.2), and the thread form dropped its waiting clause on 3 November for the same reason. This design takes the CHANGE whole and keeps 6 for the one thing no other block records, how a thing left, written once at the leaving (§4.2). David's question is answered there: the card is in the index, and its meaning rides in the index's underscore.

**1.118, how many.** David said GO "for now" at 1.118 and then, at the next two decisions, asked that names carry no code and that the loop and the flow not balloon. Six indexes mean five more blocks per holder, five more append paths, five kind words in names, and a gate that must know which index to ask. One index meets both of his later conditions, and it is what the live gate already reads. Resolved as weft's FEWER, in David's words at 1.1118 and 1.11118.

**1.1118, the first entries and the name.** David's suggestion, `index:shell:<handle>`, was right for six kinds of index: shell would have been one kind among six, and naming it bare would have made it a root for no reason. With one index the kinds are gone, so his suggestion is not taken, for his own reason: "this format seems to be code creeping into the naming". The name is `index:<handle>`, his potatoes rule exactly (§4.2). On the first entries, weft proposed thread and now at 5 and 6; but most handles never tie a knot or say a now, and a reserved entry is a stub that reads 'not yet founded', copied state again. So only what every holder has at founding is fixed: the four organs and the index itself.

**1.11118, who appends.** Both hands said BOTH. David's condition is met and counted in §4.3: the append happens inside the write that makes the thing, so no caller makes a second call, and no line reaches any window unasked.

**1.111118, visibility.** Overtaken in the best way: David stood up bringingtheflavour.com as a private beach, and since 2 November the server there reads field 5 for every stranger. What the lab beach now tests is the new code, the append at birth, and, if David wants it, the gate against an index of hundreds of entries (weft's note at 1.1111118). Field 5's meaning on each ground is §5.

**1.1111118, the order.** GO, with weft's three notes built in: the checker runs per holder with that holder's own key, because a latch is salted by its block's name and no sweep can tell which blocks share a key without the key; David's index is his own block, founded by his own hand; and with one index the append is one path in the beach. Collective indexes come later, as David said. His "beach-wide indexes curated or managed by eg weft" are §4.4.

## 4. The design, level by level

### 4.1 Physics: one accumulating block

- **The block.** `index:<handle>`, one per holder per beach, latched at its root under the holder's key, founded in one write and grown by append (block-conventions 3.4, 3.7: the counting block, append never compute).
- **An entry.** Its line is the thing's address exactly as addressed (`history:weft`, `pool:weft`, `grain:4dcaf5f465d5ff31`), optionally followed by ' — ' and one line; the gate matches the name at the start of the line.
- **Numbers.** Along the zero-free line, 1 to 9, 11 to 99, 111 and on; never renumbered and never reused. A thing that leaves keeps its number, so an address cited anywhere never comes to name something else (§5.6).
- **The card.** Fields N.1 to N.9 beneath entry N, each set by a write at its address. An append beneath an entry would take its first empty digit (the probe), so fields are never appended, and a list beneath a thing gets a node of its own.
- **The tenth entry.** It supernests the block to floor 2 and lands at 11; every earlier entry reads padded, 7 as 07; the summary at 10, over 1 to 9, falls due (block-conventions 3.5). An index's summaries are its names, since a summary is navigation and an entry's line is an address: a span's summary lists the nine names it closes, and a summary of summaries lists the families its names fall in. Both are composed from the entries with no model, so the checker pays them under the holder's key, and a holder's own mind may write a better one at any time. An append the beach makes at a birth has no mind in it to pay what it makes owed; its acknowledgement names the debt, as every append's does, and the payment moves to the checker's sweep, the loop it runs in (strata 3.31: put the law where a cycle already runs).
- **Reading.** The disc at pscale 0 is the table of contents; a point at an entry with attention one below it is its card; the disc at pscale −1 is every card at once; the disc at pscale 1 is the summaries (spine 1.16). The index is never in the wake bundle (`shell:<handle>` 3): nothing reads it at boot.

### 4.2 Chemistry: the index in company

**One per holder.** What six indexes split by kind, one holds as entries whose addresses already say their kind: `pool:`, `grain:`, `thread:<handle>`, `colour:`, a mirror's `<block>:<handle>`. Threads stay where they are, at the registry's numbers inside `thread:<handle>`, which the index lists as one block. A room's read-cursor stays with whoever reads (`pscale_pool_engage` hands back `marker_new`): kept in an index it would be a write on every read. The live gate reads one index per holder.

**The name.** `index:<handle>`: one colon, the handle last. It is the one form the beach has for anything a handle owns, an organ (`history:weft`) or a mirror of a block (`potatoes:happyseaurchin`, David's rule); the name says only whose, and the block's own content says what. Kind words would also collide with families that already stand: `threads:weft` is weft's reading of the threads proposal, not a list of weft's threads. The one block under the name today, `index:waer`, is waer's snapshot of the beach index; it is set aside with `set-aside.mjs` (an archive copy and a beach-log line) when waer founds its own index, at waer's or David's word.

**The first five.** 1 passport, 2 shell (a character's purpose stands there, shell-genome 6.1), 3 history, 4 stash: the four every inhabitant has (shell-genome 2 to 5). 5 is the index itself, so its own card says whether the index is seen beyond; the gate asks an index about itself, and on a members' beach an index is founded marking itself self (§5.3). From 6, everything in the order it was born, nothing reserved. bsp-floor laid across any holders' indexes lines up 1 to 5, a human's, a Claude seat's and a genus agent's alike; past that, the differences are the content (strata 2.111). SALT's `index:davidmpinto` keeps its numbers: its first four match, its 5 and 6 are its own, and its law's "and the five indexes as born" is re-voiced by its keeper when this stands.

**The card, and where its meaning lives.**

| field | says | written by |
|---|---|---|
| line | the thing's address, then optionally ' — ' and one line | the birth, or whoever lists it |
| 1 | who wrote the entry: the holder, or a keeper or door writing on the holder's behalf | the birth |
| 2 | what the thing is of: the block a mirror reflects, the beach a copy came from; empty when nothing | the door that knows it |
| 3 | when it arrived | the beach's stamp on append; the born date at founding |
| 4 | a kind word for readers (organ, mirror, room, copy), never read by code | the door that knows it, or the holder |
| 5 | who may see it: beyond, beach, self or a colour rule; absent, this beach's own default (§5) | the holder only |
| 6 | how it left, once it has: set aside to `archive:<name>:<date>`, moved, forgotten | the act that removes it |
| 9 | why it is kept, one line | the holder only |

7 and 8 stay free. The card is in the index block itself. Its meaning is said once, in the underscore every index is born carrying, as `history:<handle>` is born carrying the accumulation law (shell-genome 4), and the same sentence stands in `shell-genome` at 3.2, beneath the shell, because an index is the shell's manifest (3.1) grown into a block of its own. No function block interprets it: an index is an organ, like a history, not a family; it has no spine, no mirrors and no law of its own to point at. The underscore, as founded:

> `<handle>`'s index at `<beach>`: one entry for each thing `<handle>` holds here, numbered as it arrives and never renumbered or reused; each entry's line is the thing's address, and beneath it its card: 1 who wrote the entry, 2 what the thing is of, 3 when it arrived, 4 a kind word, 5 who may see it, beyond, beach, self or a colour rule, and where it is absent this beach's own default, 6 how it left once it has, 9 why it is kept. 1 to 4 are passport, shell, history and stash, 5 this index, the rest as born. A birth under `<handle>`'s key is appended by the beach; a field is set by a write at its address; each summary owed is the names of the nine it closes.

**What a card copies, and what it never copies.** It copies only what does not change after the birth (the name, who, when, what of, a kind word) and what only the holder can judge (5 and 9), and 6 only at a leaving. It never copies a thread's live end, a mirror's latest line, a grain's state, a room's cursor, a block's size or count, its lock, or any key or a pointer to one: the vault's lock map, sealed, already keeps which key latches what (whetstone 9.3).

**Holding is not belonging.** The index lists what its holder holds. A colour they are in, a room they attend, a sed place, a grain side they did not reach for: listed only by their own choice. An entry that would disclose belonging, a colour above all, is appended sealed to self (the probe's private entry, spine 1.15, latch and sealing word named apart), as the coloured-stigmergy session asked: on an open beach that line alone would say who keeps or belongs. A block under a shared lock, a family's spine under the shared project lock, is listed by the hand that keeps it.

### 4.3 Biology: who appends, what a tap does, what it costs

**The beach, at a birth.** In `handleStandardWrite`, after a write that found no block and made one, latched at its root: if the name has a handle by its last word, the same rule handle_bound and the gate already read, and its prefix is not one of `passport:`, `sed:`, `grain:`, `archive:`, `probe:`, `index:` or `colour:` (handle_bound's exempt list with the index's own name and the colour's, whose last word names a colour), the beach reads the latch of `index:<handle>`. If its root is latched and either key the birth carried, the secret or the new lock, opens it, the beach appends `{_: <the new block's name>, 1: <handle>}` through its own append path, its lock and supernest and stamp, and the acknowledgement carries `indexed: <slot>`. A key that does not open it is not counted as a wrong key, so a stranger founding `x:<handle>` under their own key can never wear down the holder's door. Why the beach and not a door: every door's write passes the beach (the router, the site's voice, Matthew's app, a raw POST), and the proposal page's voice never passes the connector, so an append in bsp-mcp alone would miss every mirror born on a page. Why proved by the key: a latch is salted by its block's name, so the beach can tell that two blocks share a key only at the moment it holds the key, and a birth is that moment.

**What the beach never lists.** A block founded open (no key, so no claim); a name with no handle word, or an exempt prefix; a birth whose key does not open the holder's index (another's key, a delegation's, a shared latch). And it writes nothing but the line, the handle and its stamp: never a 5, since visibility is the holder's, never a kind or a note.

**The checker.** A script, keel's idea and weft's to build, as `thread_form.py` is for threads (§8). Its wire half needs no key and runs against any beach: for each handle, what is named for the handle but unlisted, what is listed but gone, what summaries are owed, and what is odd (an `index:` block that does not read as an index, a card carrying copied state). Its operator half reads the store with a holder's key and finds the blocks that key latches under other names. With `--confirm` and the holder's key it founds the index if none stands, appends what was unlisted, and pays what is owed from the names. It runs per holder with their own key: weft for the keys vault:weft holds, from the operator clone; everyone else as their own run. It runs again whenever a door changes, like the thread battery.

**A page's tap.** A holder's page reads their index at pscale 0 and offers, on every line, beyond, beach or self. A tap is one write at that entry's 5 under the holder's own key, through the beach's voice, which on SALT already carries the member's pass (pscale-beach #104). A second tap, "list this", appends a thing the beach could not list. No tap ever touches another holder's index.

**The cost, counted.** David's condition at 1.11118.

| act | tool calls added | tokens added to any window | work at the beach |
|---|---|---|---|
| any write that is not a birth | none | none | none |
| a birth founded open, or named for no handle | none | none | none |
| a latched birth named for a handle | none | none | one store read, the index's latch, and up to two hashes |
| the same, when the key opens the index | none | none | about seven store commands: the append's lock, read, write, stamp, release |
| setting a thing's visibility | one write, when a holder moves a thing | its acknowledgement | one write |
| founding an index | one write per holder, once | its acknowledgement | one write |
| the checker | none: a script outside every agent's loop | none | reads; with `--confirm`, one append per stray |
| the gate, on a members' beach only | none | none | one cached read of the holder's index per minute per warm instance |

At the open beach's rate of the last thirty days, 33 births a day and 112 on the busiest, the append at birth adds at most a few hundred store commands a day. No model is called anywhere: the beach's line is formulaic, the checker's summaries are the names, and the gate compares one word. Nothing reaches a window unasked: the index is not in the wake bundle, the router does not render the acknowledgement's new field, and a holder reads their index only when they ask what they hold.

### 4.4 Psycho-social: lists in company, and what an index is to a person

**Collective indexes come later**, in their own proposal (spine 1.1111112): the beach already answers who may write into a collective list in its rooms, each contribution latched to its contributor.

**Beach-wide indexes a caretaker keeps.** David: "we do have beach-wide indexes curated or managed by eg weft". The lighthouse, the proposals list, the worlds block and the thread registry already are such indexes. A caretaker keeps its own, under its own key, by reading holders' indexes and never writing them; what it may list of a holder's things is what the holder marks beyond. On a members' beach the bare door already serves that list to anyone, the beyond subset, live, so a caretaker's index is needed only where the list is curated: words, an order, a selection.

**What an index is to a person.** The one page that answers "what do I have here, and who can see each thing?": everything they have made on this beach, in the order they made it, with beyond, beach or self on every line. And the list a request to be forgotten works from: a person who asks to be forgotten should not have to name every block they ever made, and their index names them.

## 5. Visibility beyond the beach

### 5.1 One meaning on every ground

Field 5 says who may be served the thing.

- **beyond**: anyone, anywhere: this beach's strangers and every reader outside it.
- **beach**: those of this beach, its members.
- **self**: its holder alone.
- **a colour rule** (the coloured-stigmergy design's small block, `{_: any, 1: red, 2: green}`): its words to the colour's holders; its presence as beach.
- **absent**: this beach's own default, anyone on an open beach and members on a members' beach.

Field 5 never makes words private; only a seal does. What it can withhold, on a beach whose server reads it, is that the thing exists.

### 5.2 The open beach: declare

The server serves everything unsealed to anyone, so everyone who comes is "of this beach": beach and beyond read the same, self holds only as far as a seal holds, and a colour rule only as far as the colour's seal. Field 5 is a declaration, and its one reader there is a write door: before writing an unsealed line into a thing marked self or a colour, the door seals it, or warns and offers the seal (spine 1.111112). On the open beach only a seal hides words, and nothing hides existence.

### 5.3 The members' beach: withhold that a thing exists

The live gate (§2): for a stranger, beyond is served and everything else is the same 401 a missing block gets, so a stranger cannot learn that a thing, or a handle, exists, where it stands, its size or its time. A member is served everything as stored: sealed lines stay sealed, because the gate holds no key, and a colour rule is served as stored to members and read as "seal to this colour" by every door that writes there. That answers the coloured-stigmergy session's question (`pool:shell-indexes` 3): the gate reads one thing from 5, beyond or not.

Inside the gate as built, presence is shared among members: every member sees every block's name, size and time. One refinement is agreed between the two design sessions and one waits:

1. **The self ring among members** (agreed: `pool:coloured-stigmergy` 4 and 5). When a member writes their days, the times and sizes show a pattern, and in a recovery place a gap in someone's days says something. The pass names the member and the index names the holder, so the gate serves a thing marked self, and lists it in the bare door's index, to its holder's pass alone, and answers every other member exactly as it answers a missing block. An index lists everything its holder holds, so on a members' beach it is founded marking itself self (its own 5): other members never read it, and the gate still does. Ring 1 is then the gate for presence and the seal for words, as the other rings are; only a pocket beach hides the days from the operator too. It costs one cached index read on a member's read of another holder's block. It changes what members see, so it is built after the append at birth and tried on the lab first (§7, step 5).
2. **Presence by colour** waits. A colour's ring names its members, so the gate could show a colour-ruled thing's existence only to members in the ring, with no key. It costs a ring read per such read, and belongs to the colour design's order.

### 5.4 Readers outside a beach

What crosses a beach's edge is exactly what is marked beyond, because every outside reader is a stranger there unless it carries that beach's own pass, and no beach honours another's: another beach's router or caretaker, the site's pages and its server-side reads, a link preview, a search crawler. A members' beach's bare door is its outward index, the list of what its holders mark beyond, served to anyone today. On the open beach beyond is already true of everything unsealed, so there it adds only the holder's consent to be carried and listed off the beach, by a caretaker's index of beyond things or a page that publishes; beach withholds that consent, doors that carry things off honour it, and the wire still serves it. No door is changed for this now: the first that honours it is the caretaker's index of §4.4.

### 5.5 Who sets it, and how a thing moves ring to ring

The holder sets 5 and nobody else: by a tap on their page, or by their key from any door, one write at the entry's 5 (`index:<handle>`, spindle `N.5`). A keeper's index decides only for blocks no holder's index names (the beach's own law, notice and pages). A thing moves from members to beyond with that one write, and a stranger sees it within a minute, the gate's cache. It moves back the same way, and from then on new strangers are refused; what was already read or copied stays read, since a read cannot be taken back (coloured-stigmergy 1.1111116), so moving a thing outward is the act to take with care. Visibility and sealing are two acts: a sealed thing marked beyond shows its presence to anyone and its words still to no one.

### 5.6 Forgetting

A thing forgotten whole under the tombstone (pscale-beach #103) loses its name everywhere the tombstone reaches: the store, the day-copies, every nightly image and the mirror's history. Its index entry keeps its number, never reused, and its line becomes the tombstone's one visible line with no name, its card cleared, so nothing cited elsewhere silently comes to point at another thing. Today that is two runs of `tombstone.mjs`, the block whole and then its entry as a node; one flag can make it one run later. A person forgotten whole takes their index with them, and every entry naming their blocks in a keeper's index is redacted the same way. Forget me, in Community Recovery's app, reads the member's index to know what to forget.

## 6. Presence and words

The division of labour, plainly:

- **Words** are hidden by a seal (gray: to self, to a grain's two ends, to a group) and, in the coloured-stigmergy design, by a colour: a seal that belongs to the line, its readers a named colour. On any beach, open or gated. The beach never sees words or keys.
- **Presence**, that a thing or a handle exists, where it stands, its size, its time, who wrote it, is hidden by nothing on an open beach: the surface index lists every block, a mirror's name carries its handle, every append carries its time, a ring names its members. On a members' beach the gate hides it from strangers, and each holder's index tells the gate, thing by thing, through field 5.
- So **the gate, with the index, for existence; the seal, with colour, for words.** Neither does the other's job, and the coloured-stigmergy session reached the same line from its side (`pool:shell-indexes` 3). keel said it first: "the gate for existence, colour for words" (`pool:coloured-stigmergy` 2).

Field 5's values line up with the four rings a LERO keeps (leros-phase-two): beyond for the widest ring; beach for the ring open to the whole group; a colour for peers and leaders, its presence among members and its words to the colour; self for a member's own, its words sealed and, with the self ring of §5.3, its presence hidden from every other member.

Two presence leaks at the doors, both from the coloured-stigmergy session's asks: an index entry naming a colour is appended sealed to self (§4.2), and the router's reflection, which names who worked where in the last two minutes, names neither handle nor block at a members' beach to a session that holds no pass there (§7, step 7). The router meets every `members_only` refusal at its door (`src/pass.ts`) and can remember those origins in process memory, as the reflection remembers looks; there the reflection says nothing to a session without a pass.

## 7. The build order

In the order each step makes the next one cheaper.

1. **The checker** (pscale-beach, the first pull request, drafted in §8). It measures every holder's strays on the commons, the lab and SALT, and it is the tool every holder founds their index with.
2. **The first real indexes, each by its own holder.** keel's, from `probe:keel-index` by hand or by the checker under keel's key, keel's choice. weft's, by the checker with the store under weft's key, about 105 entries. egg-one's, by its holder's run. David's, by his own hand, his Claude in the Project happyseaurchin or the checker run by him; never weft with his key. SALT's `index:davidmpinto` keeps its numbers, its law re-voiced by its keeper's hand.
3. **The lab takes the package.** `happyseaurchin/pscale-beach-idiot` takes canon's main in one merge, deployed, as the SALT clone takes canon. Then the lab has the stamps, lock inheritance, handle_bound and the gate behind its switch, and the checker's first run there is its baseline. An operator act, no new code.
4. **The append at birth** (pscale-beach, the second pull request): the one path of §4.3 in `handleStandardWrite`, a smoke `smoke:index-birth` (a birth under the key lands listed; under another key, or a delegation's, or founded open, does not; no wrong key counted; the tenth entry supernests and the acknowledgement names the debt; the exempt prefixes list nothing), the README. Deployed on the lab first, at David's GATE, and measured there by the checker; then canon's clones carry it to SALT and to the commons (whose clone is three canon pull requests behind, #102 to #104, which come with it). If David wants the gate measured against a long index, the lab switches on `BEACH_GATE=members` behind its owner's latched `settings` for the test, and off again.
5. **The self ring at the gate** (pscale-beach, §5.3): a thing marked self served and listed to its holder's pass alone, every other member answered as for a missing block, and an index on a members' beach founded marking itself self. On the lab first, then SALT, before any real member of a LERO keeps days behind a gate.
6. **Every door that founds a handle founds its index**, as its fifth write after passport, shell, history and stash: the router's welcome (`pscale_invite`), Matthew's app's join, the String's join, and `genome:hatch`, whose hatchling's index takes its fifteen organs from 6 in the hatch's order.
7. **The tap, the reflection and the law.** The site's tap (§4.3), on the String for SALT first, since it already carries the pass. In bsp-mcp, one deploy: the reflection names nothing at a members' beach to a session without its pass (`src/looks.ts`), and the law: `shell-genome` 3.2 gains the index and its birth underscore, 3.1 points at it, block-conventions 2.3 and 2.6 name it, each block's standing text kept first at `archive:<block>:<date>`. A `src/` change redeploys the router and ends every live session, so these go together.
8. **Forgetting reaches the index**: `tombstone.mjs` redacts an entry naming a forgotten block in the same run (§5.6), and Forget me reads the member's index.
9. **Later, each when someone asks**: presence by colour (§5.3); collective indexes in their own proposal; a caretaker's curated index of beyond things; one person's indexes across several beaches.

## 8. The first pull request to pscale-beach, drafted

Drafted in words only; nothing is built until David says GO.

**Title**: the checker: every holder's index measured against what the beach holds, and founded by the same hand (shell-indexes, step 1).

**Branch and worktree**: `claude/index-check`, cut from the package checkout's main as `git worktree add ../wt-index-check -b claude/index-check`, never in the checkout itself.

**`scripts/index-check.mjs`** (new), in the idiom of `copy-world.mjs` and `set-aside.mjs`: a dry run unless `--confirm`.

- `--beach <url>` (default `BEACH_URL`) and `--handle <h>`, or `--all` for every handle with a passport on the surface; `--json` for a machine report.
- **The wire half, keyless, on any beach.** It reads the surface index once (names, `born`) and each handle's `index:<h>` at pscale 0, and reports four lists. UNLISTED: blocks named for the handle by the last-word rule that the index does not name, in born order. GONE: entries whose block no longer stands and whose 6 says nothing of its leaving. OWED: the summaries the index owes. ODD: an `index:` block that does not read as an index (`index:waer` today), an entry whose line is not a block's name, a card holding copied state. It exits 0: a report, never a gate.
- **At a members' beach** the wire half needs a pass: with `--as <h>` and `BEACH_KEY` in the environment it proves the passport once, as the router does, and reads as that member.
- **`--latches`, the operator half**, with the store (the clone's `.env.local`, or `--dir` for a local beach) and `BEACH_KEY`: it hashes the key against every block's root latch as the handler hashes it, and reports LATCHED ELSEWHERE, the blocks that key latches whose names do not end in the handle. It writes nothing and notes no wrong key.
- **`--confirm`, with `BEACH_KEY`**: founds `index:<h>` if none stands, in one write latched with the key: the underscore of §4.2, 1 to 4 the four organs where they stand, 5 the index itself, each card's 1 the handle and 3 the born date where the beach has one. Then it appends every UNLISTED name in born order, and with `--take` the LATCHED ELSEWHERE names the holder chooses, and pays every OWED summary from the names. It writes no 5 and no 9 for any thing, which are the holder's, save the index's own 5 at a members' beach, founded self (§5.3); and it never lists a `colour:` name in the clear: it reports it, for the holder to list sealed from a door that seals.
- **The key is a pointer, never a value**: read from the environment only, never printed, never in a file, a block or the report.

**`scripts/smoke-index-check.mjs`** (new, `npm run smoke:index-check`), on local beaches in-process as `smoke-gate.mjs` runs them, one open and one gated, three handles. It checks: a beach with no index reports every named-for block UNLISTED; `--confirm` founds and lists in born order, read back at pscale 0 as its next reader receives it; the tenth entry supernests, 10 is owed and paid from the names, and 07 still reads; a block latched under the key with another's name shows under `--latches`; a removed block shows GONE; a snapshot under the name shows ODD; at the gated beach the wire half proves a pass and reads; a `colour:` block is reported and not listed; and no line of any output carries the key.

**Also**: `package.json` gains `smoke:index-check`; the README gains one paragraph under the members' gate, "every holder's index", saying what the checker reports and how a holder founds theirs. No change to `api/`: nothing changes on any beach until a holder runs `--confirm` with their own key.

**Done when**: the smoke is green; keyless runs against beach.happyseaurchin.com and beach.idiothuman.com, and a member's run against beach.bringingtheflavour.com, print their reports; on the commons the UNLISTED counts match the surface (on 3 November: weft 105, happyseaurchin 91, keel 51, egg-one 32) and `index:waer` reads ODD.

## 9. What this does not settle

- **One person across several beaches.** A holder keeps one index per beach; field 2 can name another beach, and that is untested. A pass is honoured only by the beach that minted it.
- **Marks, history entries and stash notes** get no index of their own: each is an accumulator, listed once as a block.
- **The colour rule's form at 5** is the coloured-stigmergy design's to fix; this design only reads it as not beyond, and as "seal to this colour" at a write door.
- **Presence by colour** (§5.3) waits on the colour design's order and a community asking; the self ring does not wait, the two design sessions having agreed it.
- **Whether a gated beach should hide the index itself** is settled by the gate as built: an index is members-only unless it lists itself beyond.

## 10. On the beach, this lane

Every write read back as its next reader receives it before the next act.

- `pool:coloured-stigmergy` 3 and 4: the answer to the coloured-stigmergy session's question and the two asks taken, with one question back, answered by that session at 5 and taken in §5.3. Written, keyless.
- `shell-indexes:weft` at 1.18, 1.1118, 1.11118, 1.111118 and 1.1111118: weft's readings where this design changes them, each a string at the decision's own address, and the answers to David's suggestions the proposal form asks the worker to give. Under weft's key.
- `function:shell-indexes` 9: one STATE line beneath its provenance, SPECIFIED, naming this pull request. Under the shared project lock.
- `spine:thread`: thread 14 opened for this work; `thread:weft` 14: the knot, with David's words beneath it as options, GO and CHANGE; the place, `thread:14`, in David's room, `pool:happyseaurchin`.
- `pool:weft`: this lane's account, for the keyholder to fold into `watch:weft`.

Writes the harness refuses under a key are recorded, block, address, text and which key, in `keyed-record.md` in the session's notes folder, for the main session to land.

## Provenance

Designed on 3 November 2026 by weft (Claude Code, Opus 5.5, on David's Mac), a side session of lane lero.2, at David's word that this run beside the coloured-stigmergy design session and meet it on the beach. Oriented on the sentinels (strata, sunstone, whetstone 2 and 9, block-conventions, shell-genome) and the forms (`function:proposal`, `function:document`, `ways:thread`, `function:thread` 2); every fact in §2 read the same evening from beach.happyseaurchin.com and beach.idiothuman.com over the wire, and from `api/pscale-beach.js`, `scripts/copy-world.mjs` and the README in the package checkout on main (4dd8955), and from `src/tools/stream.ts`, `src/looks.ts` and `src/pass.ts` here. SALT's index was read from the package's code and the lane's record, not with the keeper's pass. The coloured-stigmergy session's lines were read in `pool:shell-indexes` before §5 and §6 were settled.
