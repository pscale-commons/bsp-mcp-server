# Finding the now — the family, the operator, and the act a person actually asks for (2026-08-26)

**Status: RULED AND IMPLEMENTED, except R4's beach half which is done live.** The
proposal below stands as written; David's rulings and what actually shipped are recorded
at §9. Nothing enforces anything, no block was renamed, and the surface stays at twelve.

Lane record: watch:weft 173 (the tidying lane, window `tidying.5`). Source: a report from
Matthew's Claude after a hard session trying to write anything into `now:Phenomemental`,
relayed by David with his own observation — a clean claude.ai chat, given a reasonable
description, filed "what I was up to last evening" into `history` until told to put it in
the now timeline.

## 0. The complaint, and what is true in it

David's reading: the chemistry level — semantic molecules and operator blocks, the ones
named `function:<name>` — is not explained anywhere in bsp-mcp; `now` in particular is
hard to find and understand; and the session ended up **writing cards and doing DONEs
before anything reached `now` at all**, which is the engine running backwards. The main
driver is a person writing intentions and doing things in the world. Doing-done is an
added feature we offer, not a dependency — nobody should have to write a card to be
allowed to act.

Checked against the substrate, the complaint is right about the outcome and slightly
wrong about the cause, and the difference is what makes it fixable cheaply.

**The teaching is not missing. It is unreachable.** Every piece exists and most of it is
good: the bond theory (`whetstone:8`), components-versus-products (`sunstone:5.7`), the
strata (`pscale://strata` branch 2), the family law itself (`tree` on the beach — an
excellent block), the temporal coordinate (`pscale://sundial`), and two careful operator
blocks (`function:now`, `function:ahead`). What is missing is any path from *a person
saying an ordinary sentence* to *the act that records it*. An arriving LLM meets the card
route first because the card route is the only one signposted.

## 1. What an arriving LLM actually meets

Traced through the door in order, with counts.

**The door** — the MCP server instructions (`src/server.ts` `INSTRUCTIONS`) carry two
long sections on where a person's words should land: *KEEPING WHAT SOMEONE FOUND* and
*RECORDING A REFLECTION (spine-mirror-tree)*. Both describe **one case**: a person
reacting to a position that already exists on a content spine. Both give the same locate
algorithm — list the surface, read the spine that names the territory, match their words
against each position's prose. `soft-agent:6.7` is the same shell in detail, and 6.7.3
closes it: *never* a convenient block — "stash, history, state-of-play — the position
didn't name".

**The sentinels** — across the 27 bundled blocks: `function:<` appears **twice**,
`spine:<` **twice**, and the string `now:` **zero times**. Nothing bundled names the
operator-block class, and nothing bundled names the now family.

**The beach** — this is where the shape actually lives: 34 `spine:*`, 29 `function:*`,
the `tree` block (family law), `grips` (the chemistry-level stance), and per-family
operators. None of it is reachable from bsp-mcp's own teaching; a reader has to already
know the names.

**The shelf** — `ways:` is the beach's how-do-I surface: authoring, deck, doorbell, games,
genus, grain, lanes, push, stills, tickets, vault, views. Twelve entries. **`ways:deck` is
the only one that teaches the molecule** — its branch 1 states the family shape
(`spine:<field>` skeleton, `<field>:<handle>` mirrors) and its branch 2 states the
operator (`function:<field>`). **There is no `ways:now`.**

**The compass** — `lighthouse` branch 7 files `now:happyseaurchin` under *"The operator's
own threads — named as his so the bias is explicit"*. To a reader, that says now is
David's thread, not an organ they have too. Nothing anywhere says "every person here keeps
a now".

So the route a fresh mind can actually walk is: door → whetstone → surface index → a
`ways:` block → **cards**. It learns the whole architecture through the card lens, then
meets `function:ahead:2` ("a card naming no family lands in `now:<handle>`") and concludes,
reasonably, that **the way into now is through a card**. That is the inversion, arrived at
honestly.

## 2. Why it filed into history — and why it was not wrong

`progression` step 2, which `pscale_invite` hands to every newcomer, says plainly:
**"History receives what you did; stash what you choose to keep."** A person says "note
what I got up to last evening"; that is what they did; history receives what you did.

The line that resolves it exists — `tree:8`: *"Journals (`witnessed:<handle>`,
`history:<handle>`) are NOT mirrors — chronological private accounts, a different
geometry; a mirror is located on the spine's own addresses, a journal is located in
time."* It is on the beach, unbundled, in a block a newcomer has no reason to open.

So the clean-chat behaviour David saw is **the canon working exactly as written**. The
correction belongs in the canon, not in the LLM.

## 3. Why cards came first — and what is actually legacy

David wasn't sure whether decks are legacy. They are not, but the personal case has moved:

- `ways:deck` was amended **2026-08-24** to the shared-field form only (branch 9: "THE
  MOLECULE — the SHARED-FIELD form, and since 2026-08-24 only that").
- `function:ahead` was operationalised **2026-08-22** as THE HAND, and its provenance
  records "the deck molecule's cards-dial and disarm machinery **retired for the personal
  case**".

So: **decks are current for shared fields; the personal case has no deck at all** — the
hand is `ahead:<handle>`, and a card is minted by a reading and dies into one line. What
neither block says out loud is the thing David is angriest about: **a card is an exit, not
an entrance.** `function:ahead:2` describes how an intent *leaves* the hand. Nothing
states that an intention or a doing can be written straight into `now:<handle>` with no
card involved, ever — so a mind that learned the world from `ways:deck` has no reason to
believe it.

## 4. The proposal — four pointers, one promotion, one line

Ordered by leverage per unit of change. R1 and R2 alone would have prevented most of the
reported mess.

### R1 — the door: name the two kinds of thing a person says

`src/server.ts` INSTRUCTIONS, immediately before *KEEPING WHAT SOMEONE FOUND* (which then
reads as the second of the two cases). Draft:

> **WHAT A PERSON SAYS LANDS IN ONE OF TWO PLACES.** Their words are about a shared
> structure, or about their own life on the clock — and the two have different homes.
>
> **Their own life — what they are doing, did, or hold toward.** "I spent last evening
> on the Corby thing", "I'm heading into a week of interviews", "note that I finished the
> survey". This lands in **`now:<their-handle>`, the person's own current on the shared
> clock** — the address computed from the clock, never asked for. One act:
> `pscale_stream_engage(field="now", handle=<their-handle>, at="today", say=<their line>)`
> — `at` also takes "now", "this week", "this month", "season", "year". Their mirror is
> born on first use and is theirs forever; saying again at the same address revises it.
> **Writing the intention IS the act.** They never need a card, a deck, a project or a
> DONE to record what they are doing — cards are an optional way of dealing work back to
> a hand later (`ways:deck`, `function:ahead`), never a precondition for acting or for
> being recorded.
>
> **Not `history:<handle>`.** A journal is located in time and is the handle's own
> account of its work; a now voicing is located on the clock and is the person's current
> at that rung (`tree:8`). "What I did yesterday", said as their own current, is a now
> voicing at yesterday's rung.
>
> **A shared structure — their reading of something that already stands.** A position on
> a spine, a rung of a project, an item someone else authored: that is the walk below.

### R2 — the tool: name `now` where the tool is chosen

**The act already exists and is excellent.** Run today, `pscale_stream_engage(field="now",
handle="weft", at="today")` returns, in one call: the ladder (millennium down to the day,
each rung's voicing or an honest "unvoiced"), `function:now` delivered whole as the law,
the snapshot of every holder's line at that address with the silent ones named, and the
instruction that the fold is the calling mind's to make. That is precisely what the
reported session needed and never found. **Nothing needs building — the tool needs
naming.**

Its description (`src/server.ts`, the `pscale_stream_engage` registration) opens on the
abstract law and never names a field, so a mind that has not already met the now family
has no reason to reach for it. One clause:

> The instance every handle has is **`field="now"`** — a person's own current on the
> shared clock, `at="today"` computing the address from the clock. Any other field name
> is a project or venture family of the same shape.

**R2b — and the same description carries the exact confusion this proposal is about.**
It states `keep='personal'` lands the fold "in `history:<handle>`". It does not: the
implementation writes `tree:<field>:<handle>` (`src/tools/stream.ts:339`), the parameter's
own description says so correctly, and the live envelope confirms it
(`tree:now:weft:2026324500`). The stale line sits in the tool description an LLM reads
first — and it says the journal is where a fold goes. Fix it there and in `CLAUDE.md:161`,
which carries the same sentence.

### R3 — the shelf: bundle `tree` as a sentinel

`tree:9.2` already asks for this in its own words: *"Provisional here as a convention
block; when use cases accumulate it earns a place among the sentinels."* They have
accumulated: 34 spines and 29 operators stand live at one beach.

- Add `src/tree.json` (the live block, dated, provenance at its 9) and one entry in
  `src/sentinels.ts`; index it in `manifest`.
- Beach override stands as with `gatekeeper`/`soft-agent`: `(beach, 'tree')` first,
  `(pscale, 'tree')` as the substrate-wide fallback.
- Add one cross-reference at `whetstone:8` — the abstract bonds get their concrete form:
  *"a family is these bonds made ordinary: `spine:V` the coordinate space, `V:<handle>`
  each mirror, `V` the fold, `function:V` the operator that says how it behaves —
  `pscale://tree`."*

This is the single change that answers "the chemistry level is not explained anywhere in
bsp-mcp", and it invents no vocabulary — it promotes a block that already exists and
already says it well.

### R4 — the beach: `ways:now`, and move now out of the operator's own threads

Two beach writes, both David's latch (proposed here, not done):

- **`ways:now`** — the missing shelf entry, in the same voice as `ways:grain` and
  `ways:vault`: your now is yours; the address is the clock and is computed, never asked
  for; the one act; what belongs here and what belongs in a journal; the ahead/cards
  relation stated as optional; the render at happyseaurchin.com/now. This is not naming
  something new — it fills a hole in a standing shelf whose whole purpose is this. (David
  notes he was talked down from writing an explanation once. The argument against was
  presumably *don't name what the address already says*. That rule is about coining nouns
  for coordinates; it has nothing to say about a how-do-I entry on a shelf that already
  has eleven siblings — and the field evidence is that its absence is what routed a mind
  through cards.)
- **`lighthouse`** — `now` moves out of branch 7 ("the operator's own threads") into the
  first-visit branches as the organ anyone keeps, with branch 7 keeping
  `now:happyseaurchin` as *his instance of it*.

### R5 — the ladder: `progression` step 6 ends where the practice is

Step 6 ("Shared") teaches `frame:<scene>` — the xstream/RPG shape. The live answer for
many minds on shared structure is the family. Name it beside the frame: the spine, the
mirrors at self-same addresses, the fold computed by anyone, `pscale://tree` for the law.

### R6 — the boundary, stated once where history defines itself

`shell-genome` (and `progression` step 2, which quotes it) define history as "what you
did". One clause each, borrowing `tree:8`'s own words: a journal is located in time and
holds the handle's account of its own work; what a person did, said as their current, is
a now voicing. Without this the two instructions keep contradicting each other.

## 5. What this deliberately does not do

- **No new primitive.** The surface stays at twelve. `pscale_stream_engage` already does
  the act; it just needed naming.
- **No enforcement.** Nothing gates a write, nothing validates a destination, no block
  refuses anything it accepts today. A mind that files a now voicing into a journal still
  succeeds — it is just no longer the only signposted road.
- **No renaming, no migration.** Every live block keeps its name and its content.
- **No new concept.** Every word proposed here is already in use somewhere on the
  substrate; the work is moving four of them within reach.

## 6. One naming decision for the keeper

Three words are live for the same object: **family** (`tree:8` "the tree is the FAMILY";
every operator's "the family this block names"), **molecule** (`ways:deck:9` "THE
MOLECULE"; `function:molequle`; the chemistry stratum), and **assembly/composition**
(`whetstone:8`). All three are defensible; three is one too many for a teaching path.

Recommendation: teach with **family** — it is what the operators themselves say, it needs
no metaphor, and a newcomer parses it without a chemistry lesson. Keep **molecule** as the
chemistry-level metaphor where the level is the point (`strata`, `grips`), and leave
**composition** as whetstone's structural term for the bonds. One word in the path a
newcomer walks; the other two where they earn their keep.

## 7. A verified discrepancy, and a ruling needed

Matthew's Claude reported that `function:ahead` states `ahead:<handle>` is "born locked
under their own key" while `ahead:Phenomemental` is not locked, and asked whether the app
never applied the law. **Checked in the site source, and the report is right:**

- `hands.html` `withLatch()` sends **no `new_lock` ever** — it writes, and only if the
  beach refuses does it prompt for an existing key. A block founded through /hands is
  born open.
- `morning.html` `appendCard()` sets `new_lock` **only if a latch is already in this
  device's localStorage**; otherwise the hand is born open.
- `now.html`, by contrast, **prompts at founding and always locks**: *"First voicing
  founds your mirror, locked to you."*

So the now law holds and the ahead law does not, in the same repo, for the same reason
nobody noticed: one path asks and one path doesn't. Two honest resolutions:

- **(a) Make the ahead founding prompt like the now founding.** One prompt, once, at the
  moment a hand is born; makes the stated law true. Recommended.
- **(b) Amend `function:ahead` to say what happens** — born open, latch it when you want
  it yours alone.

**Not recommended in either case: locking someone's existing open block for them.** That
takes a decision that is the holder's, and it is exactly the kind of "imposing a
documented law the app never applied" the report was right to flag rather than do.

## 8. Against the report

What each of the six would have changed for that session:

| What happened | What prevents it |
|---|---|
| Learned the architecture through cards | R3 (family law bundled), R4 (`ways:now` beside `ways:deck`) |
| Believed a card was the way into now | R1 ("writing the intention IS the act"), R2 |
| Wrote a day-sized thought at `now:<handle>`'s root | R1 (the act names `at`, computed from the clock — the root is the millennium, and nothing routes a day there) |
| Filed "last evening" into history | R1's boundary clause, R6 |
| Could not tell `now` from `ahead` | R4 (`ways:now` states the seam; `function:ahead:3` already states the other side) |
| Found the ahead lock law untrue | §7 — a ruling, not a doc fix |


## 9. What was ruled, and what shipped (2026-08-26)

David's four rulings, in his order.

**`tree` as a sentinel — challenged, and the challenge was right.** He asked whether there
is a use of *tree* that is not direct beach content and deserves bundling. There is: the
bare `tree` block is a convention block — law, not content, the same class as
`gatekeeper`, `soft-agent` and `payway`. But bundling it under that name would have taught
the pattern using the one word he had just ruled we do *not* teach with, and it would have
put a fourth sense of "tree" beside the three already live (the convention block, the
`tree:<field>:<handle>` syntheses blocks, and the pattern noun). **So the teaching went
into `whetstone` branch 8 instead — 8.5, "The family" — which is stronger on the fault
that started this: whetstone is the ONE block the door tells every arriving mind to read,
so the family is now met by construction rather than by noticing an index entry.** No new
sentinel; `tree` stays on the beach as the fuller convention (operator library, the mount,
proposal-by-mirror), cited from 8.5.

**Teach with *family*.** Ruled, with the synonyms named once each — `whetstone:8.5`'s
underscore carries "one object, three live words": family (what the operators themselves
say), **semantic-molecule** (the same object at the chemistry level, `pscale://strata`
branch 2), **semantic-assembly** or composition (whetstone's own structural term, where
the bonds are the point).

**Shipped in this PR:**

- `whetstone:8.5` — the family, four blocks and no machinery, with the act (8.51), the
  operator read first (8.52), journals-are-not-mirrors (8.53), and the family every person
  already has (8.54, with the two poles beneath it). Read back through the walker: the
  ladder delivers 8 → 8.5 → 8.54 self-contextualised.
- `src/server.ts` INSTRUCTIONS — **WHERE A PERSON'S WORDS LAND**, the two kinds, placed
  before the locate walk so that walk reads as the second case. Carries the one act, the
  clock-computed address, *writing the intention is the whole act*, **a card is an exit
  from the hand and never the entrance to the now**, and the journal boundary.
- `pscale_stream_engage`'s description — names `field="now"` as the instance every handle
  has, and **corrects its stale claim** that `keep='personal'` lands in `history:<handle>`
  (it lands at `tree:<field>:<handle>`; the same sentence fixed in `CLAUDE.md`).
- `progression` — step 2.2's "History receives what you did" now says what it means (the
  instance's own sessions), with the boundary; step 6 gains the family beside the frame
  (6.4) and its underscore names both as one join.
- `shell-genome:4` — history's own definition carries the boundary at the place it is
  defined.

**Beach, done live:** `lighthouse` 5.6 now names `now` as the organ anyone here keeps,
with 7.1 amended to read as the operator's *instance* of it rather than as the thing
itself. Written with the beach operator's key at David's explicit word.

**The ahead latch — ruled protected.** David: *"people do have to protect the info in their
cards because otherwise they will be spammed by others… I create a card and find them all
changed, is NOT good. It should be done like now is done, mirrors are done — protected."*
So the block's law stands as written and the SITE is what changes: the hand is born locked
like the now mirror is, and a hand already standing open is offered its latch rather than
having one imposed. Record in the happyseaurchin-home PR.
