# The lattice — S × T × I, one clock per world, and causation across the rungs (2026-09-23)

**Status**: PROPOSAL, David's design brief written up as the systemic law the second track
builds toward; builds nothing. Written at his word ("Yes, do the proposal — call it the
lattice") the day after the clock door shipped (bsp-mcp #417, #419, #421; xstream #351). It
supersedes the *local* answers the clock trial gave — a three-rung bubble, a night per
table, "the day" and "the year" as special cases — with the general ones pscale is built
for. Companions: `2026-09-14-rpg-on-the-clock-second-track.md` §3 (the seed: "the world's
clock is a block universe entered at any address"), the two trial passes (09-21, 09-22),
`pscale://sundial` (the ladder, and 8 — three blocks on one address space), the Identity
ruling of 2026-07-16 (an aspect block on the spatial skeleton), and the 2026 architecture
note that first named the **determinancy cloud** (`docs/archive/onen-rpg-xstream-architecture.md`:
"an event = S × T × I; the determinancy cloud is the sparse set of points where this
product has been computed and stored; players operate in the zeros"). Weft, Claude Code.

**Why "lattice".** In this project a *block* is a JSON block, so "block universe" reads as
the universe of blocks. The thing meant is the product of the space tree and the time
tree, ordered by containment, read through identity — a lattice in the plain sense, with
canon as its fixed points. "Block universe" stays as the philosophical reference in prose.

## 1. The lattice

**One address space, three registers, one ladder.** `spatial:<world>` is authored;
the world's clock is appended; `identity:<world>` is registered (sundial 8). A **cell** is a
pair (s, t) — a place at some rung, a span at some rung — and the two rungs correspond by
pscale on the one ladder (sundial 2.2): a war is a realm and a year; a melee is a room and
a beat; a blow is arm's reach and a breath. An **event** is what stands folded at a cell,
read through I. The lattice is nearly empty — the Sierpinski gasket of the 2026 note — and
play fills it in.

**The world's clock, full rungs.** A world has ONE clock, the sundial's ladder or the
world's own re-declaration of it in `rules:<world>` (sundial 7): for urb, the metal
long-cycle at the year, the fire short-cycle at the day, the day's sevenths at the
gathering, the beat beneath — with the world's own words at every rung and the count of
long-cycles since the Pharohim's ascent as the year's digits, so an address reads as a date
to anyone who knows the world. The chronicle `temporal:urb` already holds the ages coarse
over fine; re-floored to the ladder, its epochs stand at the centuries and millennia and the
finer digits are free for play. **A table's clock is the world's clock**: `spine:temporal`
at a table is the world's ladder anchored at a world address, never a bubble of its own.
The bubble was the trial's convenience.

**The record of a cell lives at the place, addressed by the clock.** Time is appended at
the place's own address — the pool is the scene (sundial 8) — and on the lattice the
appending is by clock address rather than landing order: the night of a place is
`temporal:<place address>`, one fold per cell, each cell **locked by the hand that folded
it** (locks are per position; the trial's determiner-as-lock, now per cell). The world's
chronicle is the night of the world rung. Nights shard by place, so a world of many tables
never keeps one block; a table's play stands in its own copy of a place's night until it is
promoted (§6). **The diagonal read** — at each rung, that rung's place in that rung's span —
is the story so far of any cell, and costs the depth of the world, not its size.

**Canon is the set of locked cells.** A canon figure is a mirror on the world's clock
(`temporal:<figure>` at the world's beach), locked under the world's key: their worldline,
written ahead. A table reads it and cannot write it.

## 2. Causation across the rungs — amplitude, determinacy, pressure

David's brief, made mechanical inside NOMAD: *"one character has a melee over 5–10 minutes
(pscale 0) and has to wait while others play at 1-minute rounds (−1) or blow by blow (−2);
the pscale-0 outcome is rolled and set as a potential — 10 or more fully determined, near 0
marginal — and this influences the finer resolutions; the finer events may flesh out the
coarser one, or flip it if marginal; or the finer resolutions are summed and modify the
coarser calculation. Like waves on the sea with different orders of amplitude, one per
pscale, the overall positive or negative influencing every entity in an area of a period."*

- **Every fold carries its amplitude.** Where a check was made, the fold's last lines are
  `OUTCOME <signed number>` and `NEXT <address>` — in band, parsed like NEXT, no field, no
  schema. The outcome is NOMAD's own: capability + situation + luck − difficulty.
- **Determinacy is |outcome|.** At or past the band's edge (10) a cell is *determined*;
  near zero it is *marginal*; a locked cell — canon — is determinacy without bound. This is
  the determinancy cloud of the 2026 note, given NOMAD's number: the cloud is the set of
  folded cells, each with its amplitude.
- **Downward pressure = the situation force.** The SF of an act at a cell is the sum of the
  standing outcomes at its ancestors on the ladder — the war's, the battle's, the melee's
  — each delivered with its fold's first line, so the mind resolving the act applies the
  sign to the side it bears on (the war going badly is force against one side and for the
  other; that reading is the LLM's, the number is the lattice's). NOMAD is unchanged: SF
  was always "the situation"; the lattice computes it.
- **Upward pressure = the modifier.** When finer cells are played beneath a folded coarse
  one, their outcomes are summed (averaged over the cells played) and applied to the coarse
  cell as a modifier. A marginal coarse cell may be **flipped** and is then re-folded — a
  superseding fold that says what it supersedes. A determined cell is **fleshed out**,
  never flipped. A locked cell is never re-folded.
- **Invulnerability falls out.** A character whose later year stands folded and determined
  cannot be killed in a beat beneath it, because the beat's outcome cannot flip a determined
  cell; it can wound, rob and delay them — the dice set the cost within the range the rung
  above allows. Matrich at Bizapul and Gandalf on the road are the same fact with the lock
  added. No constraint is written; determinacy is read.
- **Where players belong.** "Players operate in the zeros": a cell whose ancestors are
  determined and whose own rung is unfolded is where local play carries furthest upward —
  a marginal battle can be turned by the fight; a determined one cannot.

The thresholds (10; the averaging) are NOMAD's to declare in `rules:nomad`, beside the
bands, and a world may re-declare them in its own rules.

## 3. Concurrency and locality

Containment is a prefix test, so both are one read each:

- **Concurrent** at a span t: every hand whose mirror or thread carries a line within t —
  the stream engage at a coarse address lists them. This is `/now` on the lattice.
- **Local** at a place s: every passport whose Location is within s — the pool's
  co-presence by prefix. This is `/here`.
- **The party** at a cell is both.

**A character's timeline is a region of the lattice**: in T, the shortest address that
contains every line of their mirror (their first and their last — "a character who has
existed only in a specific season" is a character whose span is one digit at pscale 5); in
S, the same over their Locations. It is derived from the mirror, never stored (a stored span
is stale the moment they act), and rendered wherever the passport is read — beside Location
and Beat — the way the sundial renders an age. A hand may enter a cell only where its own
mirror is silent across that span: one worldline.

## 4. Identity — the overlay on both axes

`identity:<world>` mirrors the spatial skeleton position for position (ruled 2026-07-16):
at a place, who holds it how, the groups fanning where they contest it. The same rule on T:
at a span, who holds the period how — the Pharohim's reckoning of the year, the
twilighters' words for the day's parts. A character's `identity:<handle>` is how *they*
hold each place and period — their standing, their people's words, what they notice. The
composer reads identity walked to the cell on both axes and the actors' overlays, so the
telling is in the character's own culture's words and the fog is by identity as well as by
sight: a Solozo at a Gal ford does not see what a Gal sees. Under-used today: the keeper's
tier reads identity walked to the room; nothing reads it on T; characters are born with no
identity block.

## 5. What exists, and what changes

| today (the clock trial and its door) | the lattice |
|---|---|
| a table's clock: three rungs, a bubble | the world's clock, full rungs, a table anchored at a world address |
| one night per table, locked whole | the night per place, cells locked by their folder |
| the story so far: the fold just before now at each rung of one night | the diagonal: up S and T together, across nights |
| the law's zoom names the gathering and the day | the rung whose span you mean, at any rung, in or out |
| a fold ends NEXT | a fold ends OUTCOME and NEXT; SF is summed from the ancestors; the upward re-fold in 2.3 |
| figures as mirrors at the table | canon figures as locked mirrors on the world's clock; the lean reads their fixed points ahead |
| the passport: Location and Beat | Location, Beat, and the span rendered |
| identity walked to the room, for the keeper only | identity on both axes, for every tier; identity:<handle> at genesis |
| — | promotion: a table's coarse fold offered into the place's night, audited |
| — | `/now` and `/here` for a world |

Nothing here adds a primitive, a block family or a daemon: the night per place is the T
register at a place, as the pool already is; mirrors, trees, locks and the ladder exist;
the numbers ride as fold lines; every judgment stays the LLM's.

## 6. Promotion

A table's coarse fold — a day, a year — is offered into the place's night at the world by
append; the steward of that place (the world's key, a guild's, a community's) folds an
audit: the offer against what stands at the address, its ancestors, and the lines already
written *later* at that place — because play happens in any real-world order, the future
may already be written. Accepted, reconciled, or declined; first promoted, fixed. Rare and
coarse, so the shared record grows slowly and stays readable. Designed in the block-universe
paper (David's Downloads, 2026-09-21); not built.

## 7. Build order, and the sealed trials that gate it

1. **The world's clock declared** — `rules:urb` re-declares the ladder with urb's words and
   its anchor; `temporal:urb` re-floored so its ages stand at the coarse rungs. An Author's
   act, David's with weft. Then a table founded on it.
2. **The composer generalised** — any rung; the diagonal across nights per place; OUTCOME
   parsed and SF summed from the ancestors; the upward re-fold in the law's 2.3; the span
   rendered in the door.
3. **Canon worldlines** — `temporal:<figure>` at urb.beach from the corpus, locked; the lean
   and the fold read a figure's fixed points ahead.
4. **Four sealed trials**, blind-judged as the two passes were: the mountain year (one
   character, a year at a region's address, one check at that scale, resumed a year later);
   two rungs at once (a melee at 0 while rounds are played at −1 beneath it — a marginal
   melee flipped by its rounds, a determined one fleshed out); the parked character met (a
   second party in the mountains meets the first, answered by their doorman, and cannot kill
   them); Matrich at Bizapul.
5. **Identity at genesis and on T.**
6. **Promotion and the steward's audit.**
7. **`/now` and `/here` for a world** — who is concurrent, who is local, on the lattice.

## 8. Open, and David's

- The lock at a table of more than one mind: a shared table key, or a doorman named as
  the keeper's hand (task:weft 21).
- The re-fold thresholds and the averaging, in `rules:nomad`.
- Whether the span is also written into the passport as a courtesy line, or only rendered.
- The urb ladder's words and anchor.
