# EMPTYING, and the game family by social dimensionality

**Date**: 2026-07-31 · **Status**: DESIGNED (David's game, sharpened with weft); BUILD GATED on salvage run one playing first · **Companion**: `2026-07-30-salvage-team-game.md`, `game:salvage` live on the beach.

## The family — three social dimensionalities

Each game in the `game:` class is picked by WHY multiple perspectives are worth having:

| Game | Dimensionality | Perspectives… | Medium | Status |
|---|---|---|---|---|
| **salvage** | RESOLVE | …hold dealt fragments; pooling resolves one ranking | commits (settled voices) | live, run one dealt |
| **emptying** | COVER | …notice different aspects; breadth completes a description | **liquid** (revisable slots) | this design |
| **relay** (working name) | SEQUENCE | …own departments; work passes room to room in order | rooms + handoffs | sketched (David's note) |

And above all three, **the meta-game IS the company**: several games run concurrently, worth different points, under one clock — the team's real task is allocating itself (who goes where, when to fold, which room deserves the marginal minute). The games are designed so perspectives matter; the meta-game is where self-organisation becomes the scored skill.

## EMPTYING — the design

**Source** (David, 2026-07-31): the Buddhist emptying meditation — attend to the chair; the mind wanders (throne → kings; children's den; wood; not-a-table; chair-on-the-moon); notice each wandering, return; the object is eventually appreciated whole. Crossed with the guess-the-hundred-responses game-show: the team's combined description scored against a canon.

**Play** (per object, one room, 5–10 minutes):
- The Author seals an ASPECT KEY for an ordinary object (say, a chair): ~15–20 canonical aspects across the DIRECTIONS the mind takes — what it is made of · what it does / is used as · what it is NOT (the near-misses) · where else it could stand (context shifts) · who relates to it (social life) · its time (history, wear, future). Committed as `sha256(key+salt)`, the salvage pattern.
- Each player holds ONE LIQUID SLOT in the object's room — their current contribution to the description. They read the room's forming mirror, notice what nobody has said, and REVISE their slot toward the uncovered. Revision is the game: a slot that repeats another's aspect is a wasted slot.
- At the bell, the room folds: one commit assembling the team's description from the standing slots.
- Reveal + score: coverage — how many key aspects the fold hits (an LLM maps fold-lines to key-lines with a fixed rubric; the sealed key keeps it honest and arguable). Family-Fortunes colour: aspects weighted by how canonical they are, so the obvious earns less than the noticed.

**Why liquid and not commits**: the game is *convergence of attention*, not accumulation of statements. The room's liquid mirror at any moment IS the team's current appreciation of the object — xstream shows it live (polling), which is why this is the game that shows off what xstream natively does. No substrate change: liquid staging, the mirror, and the fold all exist.

**The concurrent form** (the meta-game, 10–15 minutes total): three objects, three rooms, weighted (say chair ×1, key ×2, door ×3 — or weights hidden in plain sight in each room's purpose). One player HOSTS each room (their department: they tend the mirror, prod the gaps, call the fold) — but everyone roams. Team score = weighted coverage across all folds. The debrief reads the record for the meta-decisions: who moved when, which room starved, whether the team folded early to bank points — *this is what a company is*, played in a quarter of an hour.

## RELAY — banked for later (David's rooms-as-departments note)

Sequenced puzzles across hosted rooms: room B's puzzle needs room A's output (a phrase, a number, a decision), C needs B's. People move, leave liquid, carry results forward; the win is the chain completing inside the clock. The sequencing pressure makes the SELF-ORGANISATION explicit (who waits, who scouts ahead, who bottlenecks). Design when emptying has played.

## Machinery

Zero new primitives, all three. Per emptying run: `pool:<object>` rooms (open), liquid native in xstream, sealed keys in the Author's home-dir memory + hash in each room's purpose or a small spine, `game:emptying` operator authored at build time (mounted per tree:9.1). The 10-minute pocket-salvage promised earlier is SUPERSEDED by emptying as the quick game — better, and David's own.

## Order of play

1. **Salvage run one plays** (dealt and waiting — David, JulieJ, Keel).
2. **Emptying built + played** as the quick game (single-object first, then the three-room concurrent form with hosts).
3. **The o-page scoreboard** (spectator window) built against whichever record is richer.
4. **Relay** designed from what the first two runs teach about movement between rooms.
