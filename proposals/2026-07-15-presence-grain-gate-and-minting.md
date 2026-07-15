# Presence-grain, the gate, and per-party region minting

**Date**: 2026-07-15
**Status**: ACCEPTED (David, 2026-07-15) — build lands with this proposal
**Companions**: `proposals/2026-07-01-pscale-of-location.md` (the vertical axis this cashes in),
`proposals/2026-07-12-grit-tree-consolidation.md` (the engine this renders through),
`project:nomad-rpg` findings 1.2 (conscription does not fire unprompted) and future 2.6 (scenario-region minting), 2.7 (crab table-service)

## 1. The fault, observed live

Two fresh-context probes (2026-07-14, first-contact and Thornwood play) and David's own
play-tests converge on one fault with four faces:

- **Mute pre-built PCs** — anya/cyrus/fenn render as live co-present cast at the Beaten
  Drum and never answer (each carries exactly one witnessed beat, byte-identical
  timestamps: seeded, never played). The room *looks* inhabited and is not — worse than
  empty.
- **The onen.ai nightmare, recurring** — player-characters whose players are absent get
  engaged by present players, and nothing honest can happen.
- **The spawn pile-up** — a growing world that spawns every newcomer at the same pub
  eventually spawns hundreds of strangers into one room.
- **NPC cost anxiety** — if every figure needs an agent, the world is unaffordable.

All four are one conflation: **the world reads character-location as player-presence.**
`passport:3` says where the character is. It says nothing about whether anyone is behind
the character now. Those are different axes; the substrate already holds both (location
in the passport — slow, fictional; liveness in liquid staging, pool commits, presence
heartbeats — fast, real); they were never joined at render.
[play.ts](../src/tools/play.ts) `coPresentCast` handed over every passport at your
address, liveness unchecked.

## 2. The principle: presence has resolution

Pscale-of-location already says a spatial address IS a pscale address — table −1,
room 0, town +1 — and that moving up is zoom-out AND fast-forward in one act. This
proposal extends it one step:

> **A character is present at a grain.** Driven = present at the leaf, beat-pace.
> Undriven = present one level up, day-pace: real, visible, "about the quarter these
> days", interactable at day-grain — but not engageable beat-by-beat, because at
> beat-grain they are genuinely not there.

**Attention is the clock.** A room's narrative clock-rate is whatever the attention
present can sustain. A densely-attended leaf runs beat-by-beat; an unattended one
coarsens to the day's account. This is the same economics as the observer tax and the
million-table argument: locality means no global bottleneck, and attention is the
scarce input that sets local resolution.

**Derived at read, never stored.** No daemon writes "AFK". Liveness is computed at
render from signals the envelope already carries: a staged liquid slot, a fresh
presence heartbeat, a recent pool commit. Same house law as the two-verb pool — status
is computed at read. (Open question, deliberately deferred: whether coarse-grain
accounts are ever *written* — e.g. a crab folding a day's account into the place. Hold
the line at derived-at-read until lived play demands otherwise.)

### What falls out, unforced

- **AFK safety is derived, not bolted on.** Stakes live at beat-grain: a check gathers
  opposed *intentions* in the liquid, and a coarse-present character can stage none.
  You cannot contest someone who is not at the table. Away = automatically stake-free.
  Safe-room camping and wilderness-isolation stop being required mechanics ("she takes
  a room upstairs" survives as a graceful convention — a leaving-beat that
  self-coarsens — but the ungraceful vanish is covered).
- **Cross-grain beats do not hang.** A beat directed at an about-character lands as a
  day-grain fact — "you seek her out during the evening and put your question" — and is
  answered when she next descends (her player returns). Wall-clock waiting becomes
  fictional time-dilation instead of three people ignoring you at a table.
- **The lent-turn debt scopes correctly.** A beat at an about-character is not a debt
  (it awaits descent); the debt is only a beat left hanging among the here-now. This
  matches finding 1.2 — conscription never fired from passive prose anyway; the tax
  lives in the prompt of a seat that carries it.

## 3. The NPC cost ladder (confirming the standing design)

| tier | encoding | driver | cost |
|---|---|---|---|
| Standing figure | prose in `spatial:<world>` | whoever addresses it, in their own turn | zero |
| Cast handle (PC ≡ active NPC) | passport + shell + witnessed + knows + purpose | a seat, when needed | one LLM turn per beat |
| Agent | genus-one shell | its own wakes | never per-NPC |

There is no substrate distinction between a PC and an active NPC — only what drives the
seat and when. The one-turn seat exists (`scripts/npc-turn.ts`, any model incl. haiku;
continuity from the blocks, not the process). Maren's demotion (finding 1.2) is the
law generalised: **a passport is a promise that someone answers for it — promise
nothing you cannot staff.** Hooks live as standing figures; cast handles exist only
where a driver does.

## 4. The gate (lobby-first entry)

Party formation happens **as users, not characters**, in a gate pool at the world
(`pool:gate`, created lazily by the first arrival's engage — `purpose=` carries the
canonical gate text; keyless throughout). The keyless envelope hands back the liquid
concatenation — who is at the gate *right now* — which is the lobby's entire job.
Then **activation** is the one-way door run properly: genesis per player (their
passphrase, theirs to choose, never echoed), passports written to the start leaf,
`pscale_play` re-entered — the room follows the position.

`pscale_play` with a fresh handle now returns GATE + GENESIS (lobby first, the
interview second, re-entry named third) instead of a creation wall with no room named.
This closes the probe finding that a new handle was handed no `pool_name` at all while
being forbidden to invent one.

## 5. Spawning: mint regions, not characters-into-the-pub

Spawn is **per-party**. Each party activated at the gate gets a **sibling address** — a
fresh region branch of `spatial:<world>` at region-grain, with a start leaf, standing
figures carrying hooks personalised from the lobby talk, and the room pool opened at
the start leaf (worktable future 2.6, now with a runnable shape:
`scripts/mint-region.ts` wrapping the author seat). A thousand parties = a thousand
sibling regions = three digits of address. The tree's breadth is the sharding.

Parties meet by **ascending**: roads and market-towns at +1 are where coarse-grain
cross-party contact lives (rumours, sightings — day/week-grain facts), and two live
parties descend into a shared leaf deliberately. First-walker placement and
followers-copy-the-leader already handle the mechanics. Payway hooks in at the door
when wanted (future 2.3): the ticket funds the party's own region commission — who
pays at scale stays answered.

## 6. Room resolution: derived from position, never enumerated (the debris filter)

Twice a harness pool broke world entry (`pool:parity-run2`, 2026-07-07 and -08); the
standing rule said third time it becomes code. This is the third time. Room resolution
in play.ts now derives strictly:

1. `pool:<locAddr>` exists → that is the room.
2. else, world keeps exactly one named room and no digit rooms → that named room
   (single-room worlds unchanged: thornwood → `beaten-drum-main`).
3. else, the place exists in the spatial tree → **open `pool:<locAddr>`** (mount copied
   from an existing room's underscore, else `pscale:grit`). Ambiguity derives; it never
   errors, and stray pools can no longer take entry down.
4. a position naming no place in the spatial tree stays an error — moving to nowhere is
   never a room.

The "several rooms: pass room=" choice survives only for handles with no position
(users at a multi-room world's surface).

## 7. Render contract (the cast in two grains)

The play banner hands the cast split — HERE NOW (live at beat-grain: staged liquid,
fresh presence, or a commit within the live window) and ABOUT (present at the day's
grain) — and the GRIT directive carries the corresponding render rules: about-render
("about the quarter these days", never staged as awaiting), cross-grain beat landing,
contest-requires-here-now, debt-scopes-to-here-now. v1 liveness window: 60 minutes,
uniform; a per-room span datum can refine it when lived play asks.

## 8. What this deliberately does not do

- No stored AFK state, no logout ceremony, no session registry — liveness is read, not
  written.
- No per-NPC agents; no genus-one in the room.
- No change to GRIT's verbs, the window/resolution machinery, or the dice law.
- No forced disposition of anya/cyrus/fenn — under the new render they stop lying
  (they show as about, not at the table); whether they are then archived or kept as
  coarse colour is the operator's taste, not a bug. Thornwood is the rig; resets stay
  legitimate there and only there.

## 9. Build inventory (landed with this proposal)

1. `src/tools/play.ts` — liveness signals (liquid + pool + presence, floor-aware),
   `splitCast` (pure, smoke-tested), two-grain banner, derived room resolution
   (the debris filter), gate-first genesis response.
2. `src/grit.json` — the four directive edits (two-grain cast, about-render,
   contest-needs-here-now, debt-scopes-to-here-now).
3. `scripts/mint-region.ts` — the per-party region commission on the author seat
   (compile-verified; runs only with the operator — one seat run costs real δ).
4. `src/tools/pool.ts` — keyless engage returns the liquid concatenation by default
   (the visitor's answer is who is here now); keyed callers keep the opt-in fetch.
   (Shipped in the same arc: `pool:visiting`'s stale `_` lock relinquished on the live
   beach — the keyless hello works again.)
5. `scripts/smoke-play-split.ts` — unit smoke for the pure split.
