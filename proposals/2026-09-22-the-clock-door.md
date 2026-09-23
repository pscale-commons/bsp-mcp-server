# The clock door — rung 2 of the second track: the composed calls for a table played on time (2026-09-22)

**Status**: BUILT, on David's word after the corrective pass ("Ok, go for your recommendation.
And then you do a short test if needed and then I test"). Rides this PR. Record of the two
passes: `2026-09-21-clock-trial-first-pass.md`, `2026-09-22-clock-trial-corrective-pass.md`;
the track: `2026-09-14-rpg-on-the-clock-second-track.md`. Weft, Claude Code, keyed.

## 1. What is built

The move `tiers.ts` made for the pool on 2026-09-19, made for the clock: the reads a seat
walked by hand in the trial — ten to twenty calls an act — composed router-side once, so
every door runs the same call and a stateless mind acts in one or two.

- **`src/tools/clock.ts`** — the composer. A *clock table* is a table beach that keeps
  `spine:temporal` (the clock), `function:temporal` (the law) and a keeper's hold
  (`keeper:scene`, its placing at 3). Three tiers and a door:
  - **medium — THE FOLD** at an address: the law's branch 2 with its ring, every mirror's
    line standing there, **the night so far as the fold just before now at each rung**
    (yesterday whole, this gathering's beats in brief, the last beat whole), the actors as
    their passports stand (where and *when*), the place's faces, each actor's luck already
    rolled from the address and the handle, the rules; and THE CLAIM: which address the law
    finds ripe — every Beat line, and every voice standing *unplayed beneath* a coarse
    address (the first pass's blindness, now a line in the claim).
  - **hard — THE LEAN** after a fold: the fold whole with its NEXT, the held side, and
    **each figure's own last line**, so the day cannot end twice.
  - **soft — THE TELLING** of a folded address for one character, from where they stand;
    THE JOURNAL gives the keep and **the passport line to copy** (moved to the fold's NEXT
    and its WAY), so a standpoint is never retyped.
  - **the door** — `pscale_play` at a clock table composes the character's turn: the
    standpoint, the night so far, what stands at their beat, and THE ACTS OWED in order
    (tell what is folded and untold; or, pulled back, tell the beat folded beneath a coarse
    standpoint; then say).
- **`src/tools/stream.ts`** — `pscale_stream_engage` gains `tier=` (read-only, refused
  plainly off a clock table); a plain engage now shows **the fold standing at the address**
  and marks the ladder FOLDED where the fold keeps a rung (the trial's "(unvoiced)" trap);
  and at a clock table **the night is born locked at the first collective keep**, under the
  folder's key — the determiner is the lock, no role, no code beyond one `new_lock`.
- **`src/tools/clock-law.json`** — the law, version 5: the corrective pass's clauses (a
  live beat cannot be left; a coarser fold begins from the last finer one in a sentence and
  never re-tells it; the story so far is the fold just before now at each rung; the lean
  reads a figure's own last line and lets the world withdraw in one line; which rung a rest
  lands at; a fold may carry two checks) and the door (each branch says which tier composes
  it, and how to act without one). Written whole to `function:temporal` at founding.
- **`scripts/clock-table.ts`** — founds a clock table for a scenario in one act: the clock,
  the law, the keeper's hold with the placing, and the genesis delta that puts the Beat
  beside the Location in a passport's third line. The key comes from the environment.
- **`scripts/smoke-clock.ts`** (`npm run smoke:clock`, 9 offline) — time order, the fold
  just before now at each rung, the fold's closing lines, the standpoint line.
- The flow producer (`src/flow-play.ts`, #414) publishes a clock call exactly as a pool's:
  every composition declares its parts.

## 2. The short test

One whole round in-process on the branch, the LLM on the rig key, at a throwaway table
founded by the script (`/w/rpg9-clock3`, Brackenfoot, the trial's characters at 151):

| act | call | window | LLM | result |
|---|---|---|---|---|
| Hobb and Wenna say at 151 | say | — | — | landed in their mirrors |
| the fold at 151 | `tier='medium'` | 19.2k chars (CALL 7.8k · INPUT 10.2k · CLAIM 1.2k) | 4,529 in · 505 out, **one call** | kept at temporal:151; **the night born locked** — a rival keep under another key refused by the store |
| the lean | `tier='hard'` | 34.0k (INPUT 29.1k: the held register, the rules, the place held) | 8,476 in · 32 out | one VOICE line, the watch, landed at 152 |
| Hobb's telling | `tier='soft'` | 9.0k | one call | kept at tree:temporal:Hobb:151; the passport line from THE JOURNAL written by `bsp` at 3 |
| Hobb's door | `pscale_play` | 11.4k | — | "SAY at 152", the watch's line ahead shown; `tier='soft'` at 151 again declines: the thread already tells it |

Calls per act: the fold 2 (compose, keep) against the trial's 12–20; the lean 1 + one per
voice against 7–10; a character's turn 4–5 (the door, the telling, its keep, the passport,
the say) against 5–12. The fold and the telling read as the trial's did.

## 3. How a person plays it

A clock table is **founded as one**, never switched on at a pool room — its clock, its law
and its placing stand where its rooms would; a character stands at a beat, not in a room.
So it is not at `?world=brackenfoot-open&pool=130`; it is its own table.

- **An LLM app** (the connector at claude.ai or Claude desktop): `pscale_play(world='<the
  table's URL>', handle='<yours>', secret)` — a fresh handle is walked through genesis, whose
  passport line carries the Beat; a standing one is handed the acts owed. The player says;
  the fold is `tier='medium'` and `keep='collective'` under the keeper's key — at a private
  table that is whoever folds first; the telling `tier='soft'` and `keep='personal'`.
- **The mirror** already renders a clock table as a stream room — the ladder, the night's
  fold at the address, every hand's line, a box to say —
  `mirror.onen.ai/?world=<table>&block=spine:temporal&at=<beat>`. What it does not yet do,
  and the next PR in xstream-bsp gives it: make it happen as `tier='medium'` kept under
  the loaded key; the telling beneath the fold as `tier='soft'`; the standpoint read from
  the passport's Beat line and moved by NEXT.

## 4. What this does not add

No primitive, no block family, no daemon, no stored now. The stream primitive stores
nothing still; a tier is a read. The pool's tiers are untouched. Two parties meeting and a
doorman folding on the clock are named, not built.
