# Cards — the hand, the flip, and the witness (2026-08-22)

**Status: designed in-session with David (happyseaurchin) 2026-08-22, continuing the
cards-integration lane opened at watch:weft 89 and taken up at 131 (the cards.1 sitting,
which landed a complete design and left no record before its window closed). Every ruling
his: `ahead:<handle>` is the hand; rows are filters; cards are minted by a reading and never
authored into a spine; the DONE shape at §4 ratified this sitting. Nothing is built — the
tempo law this lane inherits is see-first, operationalise-second. Lane record: watch:weft 146.**

## 1. The collapse — one act, four blocks

Every act in this family is the same act: **one line, in the actor's own block, at an address.**

| act | writes | at |
|---|---|---|
| adopt | `ahead:<handle>` | the pile for its rung |
| done | `<family>:<handle>` | the card's address |
| witness | `<family>:<witness>` | the *self-same* address |
| consolidate | `tree:<family>:<handle>` | that address |

Four writes, one shape, four sovereign blocks. No shared write ever occurs, so collision is
impossible by construction, no lock model changes, and no position anywhere is written by two
hands. This is the same discipline the fold already runs on — the mirror is the unit of
sovereignty and the aggregate is computed.

The consequence that makes the whole thing light: **a card is never a block.** It is minted by
a reading and dies on adoption into a line. Everything the deck molecule carried in order to
store cards — the `cards: spine` / `cards: mirror` dial, `disarm`, collective retirement, and
a verification surface — was machinery for a thing that no longer exists.

## 2. The hand is already founded

`ahead:<handle>` is the hand. Not a new block, not a renamed one: read `ahead:happyseaurchin`
beside the `hand:<handle>` that the cards.1 sitting proposed founding and they are the same
object — sovereign, holder-locked, resolution-agnostic, plain sentences, unordered within a
pile, revisable forever, and already carrying real content its holder wrote himself.

`function:ahead:1` gives the piles as rungs (within hours · tomorrow · the week · the month ·
the season · the year · the decade). A hand is a pile; today's hand is pile 1. And
`function:ahead:2` already specifies the exit: *"the only way an intent leaves ahead is
through now — the holder pulls it into attention, does it, and the RECORD lands in
`now:<handle>`."* Written, never built. §4 is that clause operationalised and generalised
past the now.

The one thing the ahead family did not carry is which project a card serves. It does not need
a new field: `ways:deck:3.2` already defines the aim grammar — **family first, stretch after a
comma** (`toward onen-rpg, this week`) — and that grammar transfers unchanged. The scope
therefore rides on the card's face in words, which answers the standing worry about what
pscale a card is tagged at: it is tagged at none, it *names* one.

## 3. Rows are filters; the deal is a read

The `/my-decks` shape stands, with nothing behind it to store:

- **the combined hand** — the block whole
- **a project hand** — the cards whose aim names that family
- **the personal hand** — the cards naming no family
- **dealt rows** — computed per source (a project rung where your mirror is silent, a forward
  cell of your own now, an offer naming you), offered and never stored, redealt on tap

Rows are a filter over one list. `/next` flicks whichever filter it is given; the gestures are
already shipped and point at the wrong store today.

Minting is an LLM's reading, which is why it can be bespoke without being expensive: it
produces candidates and writes nothing. Two people reading adjacent ground will be offered
similar cards and neither is holding a shared object.

## 4. The DONE shape — ruled

**One write per card, not two.**

- **DOING** marks in place and starts the clock. It writes nothing. A claim is not a record,
  and a mirror that logs every start fills with noise that no one reads. The elapsed is
  carried on the DONE line, which is exactly the shape `ways:deck:6` names as what SQ riders
  attach to.
- **DONE** takes an **optional sign-off line**. Bare, the card's own words are flipped to past
  tense and landed — one tap, no typing, and honest, because the words were the holder's. With
  a line typed, that line lands instead, flipped and truer. The sign-off exists because the
  flip needs raw material: without it a mind has to invent what happened, and an invented
  record is worse than a terse one.
- **The record lands at the card's own address**, in the holder's mirror of the family the card
  names, at the current period. Where the card names no family it lands in `now:<handle>` at
  the rung the act truly was.

A correction worth stating, since the first framing of this reached for a fixed pscale: "the
pscale 0 entry" is right for the now and wrong in general. `now:<handle>` is floor 10, so
pscale 0 is the five-to-ten-minute beat — which is precisely where this holder already writes
commentary, and why the instinct was sound. A project mirror at floor 1 has pscale 0 as a top
strand, which is not a work note. The general rule that subsumes the special case is **the
card's own address**, never a fixed pscale.

The mechanism is already built and hardwired to one family: `feedVenture()` in `next.html`
lands a DONE "as its own words, in the holder's venture mirror at the rung of the day it was
done — computed from the clock, never typed." Generalising it to *the family the card names*
is a change to one function.

## 5. Who does the flip — the player law

> **The LLM reads, proposes, converts tense, and consolidates. The human adopts and witnesses.**

The two acts that create obligation stay with the human, and the LLM performs neither. This is
the field-offers-holder-adopts rule extended to settlement, and it is what stops the family
becoming a queue that assigns.

Minting and the flip both require a mind in the room, so both live where one is —
mirror.onen.ai or a chat client with the beach in reach. A mechanical fallback stands for
every step so nothing is blocked by absence: no mind means the flip is a plain past-tense
rewrite of the card's own words and the consolidation is simply not made.

## 6. The record's three layers

The keeper's own realisation this sitting, verified against standing law rather than proposed:

- **The spine is never altered by card activity.** It is authored structure and stays the
  keeper's.
- **The mirror holds the raw.** The intention is amended in place into what happened — the
  same address, the tense doing the semantic work, which is how these mirrors are already
  read (forward cells intention, at-now presence and commentary, behind cells record).
- **The tree holds the consolidation**, past as much as future. `tree:3` is the social
  aggregate at any address; `tree:6` states that the instrument is already in hand and nothing
  is to be built; `function:now:6.2` establishes that on the clock spine the address walk *is*
  the sequence, so yesterday's fold stands at yesterday and no history organ exists.

So the past record needs no new home. One sharpening the wording must carry: the amendment is
each holder's own words in their own mirror. A spine-owner **consolidates into the tree** and
never edits a mirror — otherwise the manager is reinvented at the last step.

## 7. The witness is a card

Settlement is validation by another: one voice says the wall will be built, a second says the
wall was built. Mechanically it needs no new organ — the claim is the DONE in
`<family>:<handle>`, and the witness writes a line in **their own** mirror at the self-same
address naming whose claim it confirms. Nothing shared is written.

The hard part was never the write, it was the ask. Unsolicited work is exactly what gets
ignored, so a witness prompt cannot be a queue or a notification. It does not need to be:

**A witness ask is a card.** It comes off the same deal, is flicked in the same hand, and
resolves with the same one line. Some cards say *do this*; some say *confirm this happened*.
There is no verification inbox because there is no inbox — there is a hand. The mind that
mints a person's cards already reads the addresses they stand at, so claims naming them, or
sitting where they voiced a need, mint as confirm-cards in the same pass at no extra cost.

Two properties keep this from becoming approval workflow:

- **Settlement is never a gate.** The DONE stands whether or not anyone witnesses. A witness
  adds weight, endorsed by pointer — the posture every fold on this beach already takes.
- **The beneficiary is the natural witness**, not a neutral observer: witness what you
  received, not what you gave. The party whose need was met both knows and cares, so the
  incentive problem dissolves, and the asymmetry removes the reciprocal-pair structure a
  reputation ring depends on. Nothing extra is stored for this — whether a witness benefited
  is derivable from whether they voiced a need at that address earlier.

This also dissolves a question that has been open since the deck era: *what happens when two
people work the same card and one finishes?* Under this model there are no collective cards, so
the race does not exist. What surfaces instead is that two hands drew from the same source
address, and the fold shows both — coordination appearing, not a conflict needing rules.

## 8. Population, not permission

The keeper declined to encode the distinction he had himself drawn — that the now is
self-organised and projects are formal — on the grounds that it does a disservice to what is
built: it is all self-organised, temporally, and the aim is to enable self-organisation for
objective-targeting while still catering for traditional control without letting it win. **It
is how the tool is used, not the tool itself.**

The mechanism honours that exactly, because the writes are identical on both sides. What
differs is **population, not permission**. A clock cell has nobody authored at it, so a witness
there is someone who chose to stand beside you. A project rung was authored, so others are
standing there by construction. Ticket-culture is a keeper who authors dense rungs and a
membership that witnesses everything; self-organisation is sparse rungs and self-dealt cards.
Same code, different density — and therefore nothing to encode anywhere.

## 9. Decay is deferred, and why that is safe here

The standing warning is sound in general: settle decay first, or the metadata bakes in whatever
decay was assumed. It does not bite here, for one reason — **nothing is stored as a score.**

A witness is a dated line at an address in someone's own block. Any decay function is a read
over dates, addable later with zero migration. What the line must carry — the date, whose claim
it confirms, which address, and the confirming words — is exactly what *any* decay function
needs, and commits to no rate and no shape. The rule to hold: **do not design decay; design so
that decay is a read.**

## 10. What this retires

Not now, and not before the surfaces move, but named so the courage is on the record:

- the `cards:` dial and both its settings, with the spine-card / mirror-card ambiguity it
  created — the defect is visible today in `doing:happyseaurchin`, which holds marks whose
  words live in another block
- `disarm`, and collective retirement with it
- the `today-beach-deck` family as a store of cards
- `feedVenture`'s hardwiring to one family (the function survives, generalised)

Spines are untouched by all of it. A project's spine stays project structure; cards are dealt
*from* it and never stored *in* it. Hands get no spine, because spine-mirror-tree exists so that
many people may answer one authored structure, and a hand has one holder and nothing to answer.
Applying the family to hands is what produced the confusion in the first place.

## 11. Open, not ruled

- **The promise to a named other.** `stash:keel:14` names it precisely — the family holds
  readings, objectives, completions, valuations and proposals, and none of them is a promise a
  named other may hold you to; *"DONE is the retrospective half of a promise nobody made
  prospectively."* Keel's candidate is grain semantics laid on sundial coordinates, and keel
  flags it as unchecked against ways:grain, ways:tickets and the rider work. A lighter shape is
  available inside what §2 already adopts: the aim grammar naming a **person** rather than a
  family (`toward julie, this week`), which makes the beneficiary the witness by construction.
  Offered as a candidate against keel's, not as a ruling.
- **Slice order** for the build, once the keeper calls for one.
- **Whether the tree consolidation is ever kept**, or stays ephemeral by default per `tree:3`.

## 12. Provenance

Designed with David 2026-08-22, resuming the lane his cards.1 window opened and could not
close. The collapse at §1, the witness-is-a-card move at §7 and the population reading at §8
are weft's; the hand-is-ahead ruling, the refusal of the now/project binary, the sign-off text,
and the tree-as-past-consolidation realisation at §6 are his. `stash:keel:14` is keel's, cited
under its own flag. Lane record at watch:weft 146; the two fish noted mid-lane at 135 (the
enacting point) and 136 (the torus) belong to their own charters and are not this proposal's.
