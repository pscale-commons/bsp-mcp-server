# Pscale-of-agency — one grain law across place, time, and identity

**Date**: 2026-07-15 (evening arc; same-day sibling of `2026-07-15-presence-grain-gate-and-minting.md`)
**Status**: ACCEPTED (David) — calibration locked this conversation; build lands with this proposal
**Companions**: `proposals/2026-07-01-pscale-of-location.md` (the designed lever this cashes in),
`spine:beach-venture` at the apex beach (the live temporal spine), `spatial:earth` at
earth.beach (the canonical population-anchored reference), `sand-rider` (the arithmetic
door, referenced not built here)

## 1. The law, as settled

**Pscale is position relative to the decimal point.** Left of the decimal walks coarser
(positive pscale toward the root); right of the decimal walks finer (negative pscale as
decimal places). This is one law for place and time at once, because the spatial address
IS a pscale address and time rides it (S↔T coupling: moving up is zoom-out AND
fast-forward in one act).

**The standard temporal spine** — the default every world inherits:

| pscale | time (≈) | place | note |
|---|---|---|---|
| −2 | seconds | around the hearth | LLM processing grain; a mouse-world's beat |
| −1 | the minute | the table | blow by blow |
| **0** | **the beat, 5–10 min** | **the room** | **THE ANCHOR** |
| +1 | the hour, a gathering | the building | cross the town in a step |
| +2 | the day | the town / quarter | "rest here, done" — one beat |
| +3 | the week | the region | travel, seasons of work |
| … | month, season, year… | valley, realm… | up the containment ladder |

On the venture spine's floor-6 form: `111111` is the 5-minute beat (pscale 0), `111111.1`
the minute, `111111.11` seconds. `spatial:earth` is the canonical reference at the top end:
floor ~11, "0=room … +11=solar system, population-anchored". The BSP-TEST spatial fixture
already conforms (THORNKEEP +2, TAVERN +1, KITCHEN 0, HEARTH −1).

**Re-anchoring is legitimate and declared, never implicit.** A world whose inhabitants
live faster shifts its anchor (a mouse-world's 0 sits ~2 steps finer than a human's; an
LLM's processing grain is ~−2). The declaration lives in the world's **rules block** —
resolution physics, exactly where dice already live. **A world that says nothing gets the
standard.** (`rules:earth` and thornwood carry the standard by structure; no edits needed.
`spine:beach-venture`'s rungs — today at +1 — diverge from the standard's day at +2;
bringing the venture spine onto the standard is a flagged side project, not this arc.)

## 2. What this dissolves (from the ping-pong conversation)

- **Ping-pong is not a bug to brake; it is play at the wrong grain.** Two NPCs exchanging
  beat-grain calls forever is pathological at pscale 0 and is simply *the town living its
  day* at pscale +2 — where a whole day of cast life is ONE fold (intentions staged as
  liquid at the coarse room; one medium-llm integration commits the day). Cost collapses
  by moving up. The moderator is the grain dial, not a rate limiter.
- **The observer tax becomes affordable** (worktable 2.7): a crab lending at pscale 0 is
  unthinkable per-beat; a crab folding a world's day at +2 is one call per world per day.
- **Attention is the clock, locally**: a present human (or a fine-grain NPC) pulls the
  cast *at that location* down to beat-grain; when attention leaves, the place coarsens
  back. Nothing stores this — grain is address + liveness, both derived at read.
- **Per-item moderation (credits riding beats) remains the end-game** — `sand-rider` is
  format-ready (separate credits/SQ fields; pool beats compose per its branch 3.4); the
  one missing arithmetic is acceptance-transfer. Deliberately NOT built in this arc; the
  standing Sqale design conversation owns it.

## 3. The build (this arc)

### G1 — un-flatten location (bsp-mcp `play.ts`, xstream `perceive.ts`)
- `passport:3` accepts the full single-decimal pscale address (`3241`, `3200`, `111.1`);
  the flat `(\d+)` regex widens; the malformed-address warning now rejects only what the
  parser rejects (multi-dot, commas).
- Place-existence guard walks the spatial block with the canonical floor-aware reader
  (`readAt`), not a naive digit loop — dots and floor-padding just work.
- **The room follows the grain**: the room at an address is `pool:<addr>` at ANY grain —
  `pool:3241` the kitchen's beats, `pool:3200` the town's days. Canonical address form is
  the pool name (trailing zeros are floor-width padding: the quarter at a floor-3 world is
  `pool:100`).
- **Address relations join the cast banner**: handles at your exact address split HERE
  NOW / ABOUT by liveness (shipped this morning); handles standing at an ANCESTOR address
  (coarser grain, containing you) render into ABOUT — "at the day's grain of this place" —
  by construction, no signal needed; when YOU stand coarse, the envelope lists the finer
  life beneath you (you are its determiner; see G3).

### G2 — the standard spine, declared once, defaulted everywhere
- The GRIT engine paragraph carries the standard ladder (one sentence — delivered inline
  in every room envelope, zero extra reads) + the override rule: a world re-declares in
  its rules block only when it differs.
- MOVE (grit 4b) gains the vertical: moving up/down the grain is the same `passport:3`
  write — zoom-out is fast-forward; "rest the day at the town" is one +2 beat.

### G3 — cross-grain composition (the real build; `pool.ts` envelope)
For address-shaped rooms only (named rooms unaffected):
- **Background — the coarser life at this place**: the envelope for `pool:3241` carries
  the nearest ancestors' recent commits and live liquid (`pool:324`, `pool:32`, …,
  nearest-first, bounded) as background. The directive renders background as the world's
  weather — never as beats to answer.
- **One-now — finer windows gate the coarse fold**: the envelope for a coarse room lists
  live liquid in its spatial subtree ("finer windows live beneath"); the directive rule:
  a coarse window cannot close over live finer windows — wait, absorb their resolutions,
  fold; whoever folds the coarse window is the determiner (the 2026-07-01 proposal's
  regimes 1+2, exactly). No beach change — the store's single-resolution claim already
  works at any pool; the gate is envelope-informed judgment.

### G4 — cadence for characters (identity-side rate)
- `cadence:<handle>` (the genus organ, verbatim convention) extends to any handle: for a
  character, position 1 paces the room turn in seconds. xstream's lending gap reads it
  (falls back to the built-in floor); the hardwired constant becomes a datum the Designer
  tends (`ways:genus:3` — tend: "dial, cadence").

### Explicitly deferred
Block-universe regime (pre-authored coarse canon as read-only constraint) — deferred per
the 2026-07-01 proposal until a world needs it. Acceptance-transfer credits — the Sqale
conversation. xstream background rendering — follow-up (MCP-side players get background
first; xstream's perceive loop gains it next pass). Venture-spine re-flooring — side
project.

## 4. Verification bar

Pure helpers (address run / floor / ancestor relations / canonical form) smoke-tested;
play + pool behaviour verified against live worlds read-only (thornwood fine-address
place-guard; thousand-valleys digit rooms); David's play-test is the acceptance test —
stand a character at a town address, live the day in one fold, descend to a room and
meet the beat.
