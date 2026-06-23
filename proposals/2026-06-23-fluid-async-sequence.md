# Fluid async sequence — re-organising RPG play on bsp-mcp (no polling)

**Status:** DRAFT for David's review (design-first; converge before build). **Date:** 2026-06-23.
**Origin:** the 2026-06-22 two-machine spot-check — stilted and tedious: dice rolled for *talking*; "say something then nudge for the result"; out-of-sync between the two players; one character resolving both; a name (`cyrus`) leaking into the other's narration.

## Root reframe

Every stilted symptom is one thing: the system forces the human to live at the **beat** scale — act on every micro-beat, fetch every result. The substrate's own geometry (**pscale = scale, and scale includes time**) says they shouldn't have to. So the re-organisation has four moves: make **rolling** the exception, make **gathering** the exception, keep the public record **terse and name-free**, and let the human **steer at their chosen scale** while a shell-agent runs the beats.

## Already built — reuse, don't reinvent [David's check, confirmed]

`pscale_pool_engage` already carries the submit/commit distinction:
- `submit=<text>` → STAGE intention to the liquid buffer (one slot/author, overwriting) — your PRESENCE; returns the social mirror of co-present pending intentions. No append, no synthesis.
- `contribution=<text>` → COMMIT: atomic append to the pool — the act landing.
- `since_position` / `marker_new` → the slice-since-your-marker — the **catch-up**.
- `resolves_window=<stamp>` → the gather-resolution claim (single-resolution, atomic; co-presence-close + clear-on-resolve, this session's work).
- `submit` + `contribution` may combine (stage then commit in one call).

So "submission = intention, commitment = the act" is the primitive **as built**. The work below is mostly directive re-organisation + targeted changes, not new machinery.

## The re-organised sequence

### The key move — two act-classes: SIMPLE (default) vs CONTESTED (exception)

- **SIMPLE — dialogue, observation, independent action (the vast majority): self-resolved.**
  `submit` (intention → liquid = presence; the envelope returns the slice-since-your-marker = the catch-up + the live intentions) → `contribution` (commit = a terse, identifier-only FACT of what you did) + write your own private narrative (`witnessed`). **No window, no dice, no waiting for a resolver.** Fluid.
- **CONTESTED — a clash (two characters' acts oppose, stakes at risk): the gather.**
  The window machinery we already have — co-presence-close + per-actor dice + one resolver + clear-on-resolve — **reserved for this**. The exception, not the default.

Dialogue is SIMPLE: Anya commits *"asks the man by the fire if the south road is open"*; Cyrus, on his next `submit`, finds it in the slice, commits *"answers — the road's been shut a season"*. **Interleaved self-commits + slice-catch-up = fluid back-and-forth — no dice, no resolver-asymmetry, no nudge.** Co-presence is reading the shared stream and weaving your own narrative; the joint window is only for genuine contests.

### Synthesis-on-submit [built — the slice IS the catch-up]

Each `submit` returns the slice-since-your-marker (committed facts) + the live liquid (others' intentions) + the operating directive. You weave your own synthesis per the directive (the original personal-synthesis design). So you're never blind-and-uninformed: you act, and the catch-up is woven in at that moment; *"do it"* is the follow-up `contribution`. No code change — the loop just uses the existing envelope. (The blindness doesn't vanish without polling — you're one beat behind — but it stops mattering: the catch-up arrives the instant you act.)

### Dice as the exception [not every turn]

`rules:nomad:3` already defines SIMPLE = auto-success, no dice. Flip the stance: **rolling is the exception** — only a CONTESTED/staked act consults the per-actor luck (still seeded by the substrate each gather). A simple social act never rolls. A massive unluck roll for *talking* becomes impossible by construction. (Directive + `rules:nomad` edit.)

### pscale-duration — steer at your scale [the keystone; engine already built]

A standing intention at **pscale 1** ("work the room for the caravan story", ~an hour) should auto-cover **pscale −1** beats. The shell-driven agent — the autonomous tool-driving character we built this session — runs the beats from the standing intention + the shell, **surfacing to the human only** at a fork the standing intent doesn't cover, a contested gather, or a direct address it can't safely answer in the player's voice. **A PC becomes a steerable shell-agent: you steer at pscale 1, it plays at pscale −1.** Async stops being "I'm always behind" and becomes "I set intent at my scale, the world runs at its, I steer when it matters." New design pieces: how a standing intention is submitted (a `submit` carrying a pscale/duration), and the **surface-to-human threshold**.

### Identity — terse identifier-only facts; names via introduction

The leak is structural: the handle IS the name (`cyrus`), and the public skeleton uses the handle, so another character reads a name it never earned. Fix:
- **Light (now):** the public pool carries only handles/**appearance-tags**, never a name another hasn't earned; a name enters the public record ONLY through an explicit in-fiction **introduction event** (which also writes the learner's `knows:<h>`); the render resolves handle→name ONLY via `knows`.
- **Deep (later, robust-by-construction):** the public identifier becomes an **opaque handle/address that carries no name**; the name is a private attribute resolved per-perceiver via `knows`. This is David's "track people by bsp address without revealing names" — a real change to how the substrate handles identity, but it makes a name-leak impossible rather than disciplined-against.

## The three triggers, positioned

- **Commit-trigger** (your option c) — the SPINE for the default: your `contribution` IS your resolved beat (self-resolved for simple acts). Fully async, no window.
- **Gather/window** — reserved for CONTESTED acts: the co-presence-close we built. **Timer-close** and **N-threshold-close** are just two ways to close *that* window; co-presence-close (2nd joins) is the current N=2 form.
- Net: commit-trigger for the simple majority; gather for the contested minority.

## What changes where (minimal-code map)

- **`function:thornwood` (directive):** re-organise the loop — default self-commit (simple); gather+dice only for contested; dice-as-exception; terse identifier-only facts; introduction-event for names; standing-intention / pscale-duration handling.
- **`rules:nomad`:** SIMPLE = default (no roll); roll only contested.
- **`pool.ts`:** likely NO change for the default loop (submit/commit/slice all built); the window + clear-on-resolve stay for contests. Possible small add: a pscale/duration field on `submit` for standing intentions — TBD.
- **Identity:** light = directive discipline + introduction event; deep = substrate handle/name separation (bigger, later).
- **pscale-duration:** the shell-agent (built) + a standing-intention submit + the surface-to-human threshold (new logic; prototype on the rig).

## Open forks for David

1. **Self-commit truth.** For a simple act, the character commits their OWN terse public fact (auto-success). OK that a character writes the public fact of their own act? (Lean yes — it's identifier-only fact, not experience; others derive their own narrative. Self-resolution is barred only for the contested case, where the gather + dice + a single resolver handle it.)
2. **Surface-to-human threshold.** What makes the shell-agent pause for the player vs auto-run? (Lean: an unforeseen fork / a contested gather / a direct address it can't safely voice / an explicit redirect.)
3. **Identity:** light now, or commit to the deep opaque-handle separation now?
4. **Standing-intention carriage:** a pscale/duration field on `submit`, or a separate standing-intent block in the shell?

## Build order (rig-first — the faithful rig is now mechanically the HITL path)

1. **Dice-as-exception** (directive + `rules:nomad`) — tiny; kills the unluck-for-talking.
2. **Simple-vs-contested + self-commit default** (directive) — the fluidity spine; reuses submit/commit.
3. **Identity light** (introduction-event + identifier-only facts) — closes the name leak.
4. **pscale-duration steer-at-scale** (the keystone) — extend the agent with standing intentions + the surface threshold.

Validate each on `--client agent` before any live reseed. xstream + polling later makes vapour/liquid live and dialogue effortless — but all of the above makes bsp-mcp itself far less stilted *without* polling, on the same substrate xstream will poll.
