# GRIT extraction — naming and lifting the RPG engine out of Thornwood

**Status:** SPEC for David's review. Architecture confirmed (David, 2026-06-23): **two-tier
(GRIT + NOMAD), GRIT as a bsp-mcp sentinel, recycle the name "GRIT" and fully replace its
dead meaning.** GRIT sentinel drafted + wired; one wiring fork open; docs-rewrite + cartridge
surgery + any live reseed/deploy gated on this review. **Date:** 2026-06-23.

## The determination (and the test that settled it)

Three reusable things sit above the engine, not two:

| Layer | What it is | World-agnostic? | Rules-agnostic? | Varies per game? |
|---|---|---|---|---|
| engine (L1) | `bsp()` + the beach handler | — | — | never |
| **GRIT** | the play-loop: perceive/act/commit, simple-vs-check, contest-gather / solo-trial, pool-public / witnessed-private, fog-by-earned-names, the resolving aperture, hard-tier upkeep | **yes** | **yes** | no — canonical |
| **NOMAD** | the resolution rules: capability + situation + dice − difficulty → bands | yes | **it IS the rules** | **yes — the swap** |
| World | `spatial:<world>` + `rules:<world>` (place physics) + characters | no (content) | yes | yes |

**David's D&D test, worked.** A group implementing D&D changes: the **World** (always — their
setting + cast) and the **rules** (`rules:nomad` → `rules:dnd`: d20 + AC + HP + saves). They
**keep GRIT unchanged** — perceive/act/commit, fog, the co-presence window, "a worse-than-clean
outcome must bite" apply to any tabletop system. The play-loop is the most reused, most invariant
thing in the cartridge — reused unchanged across *worlds* and across *rules-systems*. That is a
genuine reusable layer, not world content → **two-tier is justified.** (Even the dead `rpg.json`
seed already treated dice as pluggable — "Nomad-style, D&D-style, or custom" — so the architecture
always implicitly separated loop from dice; it just never named the loop.)

**The one seam — turn-structure.** D&D combat has initiative/rounds; GRIT has co-presence windows.
This still splits: the *gather → resolve → one-skeleton → clear* machinery is GRIT (any system
needs "two clash, one resolver writes the result, atomically"); the *ordering and scoring within*
a contest is the rules block (`rules:dnd` says "roll initiative, act in order"; NOMAD says "both
resolve from seeded dice"). The window is identical underneath.

**Why two-tier and not one-tier (fork the whole cartridge for D&D):** the play-loop encodes
hard-won, subtle invariants — co-presence-close, single-resolution atomicity, fog-by-earned-names,
submit/commit/clear, "must bite." The whole rpg-reorientation-log is the story of debugging these.
A canonical GRIT means a D&D group gets them *for free* and brings only dice + world. That is the
step toward a product to hand people; copy-the-cartridge-and-edit means every author re-derives the
machinery and fixes never propagate.

**Why a sentinel, not a library seed (David's call):** GRIT is the *invariant* tier, so it becomes
canonical and always-available (served from any bsp-mcp instance, no beach needed) — sibling of
`gatekeeper` and `soft-agent`. The *variant* tiers (NOMAD-rules, World) stay forkable in cartridges
/ the library. This is a cleaner expression of the split than the library would be: invariant →
sentinel; variant → forkable. (It overrides the CLAUDE.md note that lists "grit, rpg" as library
content; that note predates the daemon-GRIT being retired and the play-loop being the thing named.)

## What shipped in this spec (reversible, no deploy, no live writes)

- **`src/grit.json`** — the GRIT sentinel. A faithful genericization of the *validated*
  `function:thornwood` (the proven loop), changing only what delaminates it from Thornwood + NOMAD:
  - branch 1 (soft): `braving the night-wood` → `braving the wild places` (the only world-ism — an example).
  - branch 2 (check): `the system's rules (CF + SF + dice − difficulty, and the bands)` →
    `the world's RESOLUTION RULES (the cartridge's rules block; the reference system rules:nomad
    scores capability + situation + dice − difficulty into bands; another world may mount other
    rules)`; `exploding-d10 luck` → `the dice the world's rules define (NOMAD's are exploding-d10)`;
    `each character's own band` → `each character's own outcome under those rules`;
    `A band BELOW CLEAR must BITE` → `An outcome short of clean success must BITE`.
  - branch 3 (hard): unchanged (already generic).
  - `_`: rewritten to the GRIT framing (daemonless, the simple/check essence, the mount note,
    the 1/2/3 aperture map). Spine-clean (`_`,1,2,3 only — no branch-9 metadata, so nothing
    author-facing leaks into the per-turn play envelope the pool inlines).
- **`src/sentinels.ts`** — one import + one `SENTINELS` entry (`grit`). Typecheck clean; loads and
  walks as `bsp(agent_id="pscale", block="grit")` / `pscale://grit`.

## The wiring fork — how a world references GRIT (OPEN, David's pick)

`resolveDirective(poolUrl, ref)` (pool.ts) resolves a room pool's directive-underscore against the
**world's beach**, not the sentinel registry. So:

- **A — keep `function:<world>`, seeded from GRIT (zero code, zero forced deploy).** The pool points
  at `function:<world>` as today; for thornwood that block becomes the genericized loop (≈ GRIT
  verbatim, since thornwood has no real loop-delta). GRIT-the-sentinel is the canonical
  reference + seed source; improvements propagate by deliberate re-seed. The live game is untouched
  until a `pack-reset`. Safe; but every world carries a loop copy.
- **B — point the pool at `pscale:grit` (small resolver change + coordinated deploy).** Add a
  ~5-line fallback in `resolveDirective`: a ref prefixed `pscale:` resolves from the sentinel
  registry. Then a room pool's underscore = `pscale:grit` runs the canonical loop live, with **zero
  per-world copy**; the cartridge drops `function:<world>` entirely and carries only its rules +
  place + cast. A world that *wants* to customize the loop still authors `function:<world>` and
  points there (gatekeeper-style fallback: beach override first, sentinel canonical second). This is
  the product-grade answer ("point your pool at `pscale:grit`, bring rules + world, done"), at the
  cost of a Railway deploy + one live-beach underscore write before live thornwood can use it.

**Recommendation: B** — it is the honest realization of "GRIT as an operational sentinel" and the
zero-duplication product story; A is the fallback if we want no deploy now. Either way, build + rig
-validate before any live reseed (the handover discipline).

## Docs-rewrite scope (task 2 — gated on grit.json being agreed; NOT yet touched)

"GRIT" currently carries **two stale meanings**, both to be replaced by the daemonless play-loop:

1. `src/evolution.json` branch 4 — GRIT = daemon round-resolution (`4.2` "after the window elapses
   the server dispatches resolution-requests … first valid event wins"; `4._`, `4.4`, `4.9`
   resolvers/compressors as daemons; references the **non-existent** `docs/protocol-grit.md` and
   `docs/beach-game-handbook.md`). Rewrite to: GRIT = the daemonless in-loop play model; point at
   `pscale://grit`; drop the dead doc references.
2. `src/manifest.json` — GRIT index entries (verify + repoint to the sentinel).
3. `src/block-conventions.json` — `4.4.5` ("GRIT round resolution"), `6.5` ("GRIT time-window")
   as synthesis recipes; reconcile with the new meaning. **Add** a short RPG/GRIT-mount branch here
   (the author-facing "how a world mounts on GRIT: supply rules + place + cast, point the room pool
   at `pscale:grit`") — the right home for the mount contract (a block, per the ethos; sibling of
   the character-shell note at `2.5`).
4. `docs/beach-crab-ladder.md:76` — "GRIT compressor / resolver duties" → the new model.
5. `seeds/library/grit.json` (pscale-beach) — the VLS-synthesis-kernel placeholder. Repoint to the
   sentinel (the canonical GRIT is now `pscale://grit`); keep only the genuinely generic
   collaboration framing if useful, else retire.
6. `seeds/library/rpg.json` (pscale-beach) — the whole old Onen/Thornkeep model (dead
   `pscale_create_collective`, wrong "Nomad d6 pools"). Rewrite thin: an RPG = GRIT (sentinel) +
   a rules block (NOMAD reference, D&D-able) + a world cartridge; point at the live pieces.

## Build / validate / deploy order

1. ✅ `src/grit.json` + `sentinels.ts` (this spec).
2. ⬜ David confirms grit.json content + the wiring fork (A/B).
3. ⬜ Wiring: (B) the `resolveDirective` `pscale:`-fallback + cartridge drops `function:thornwood`,
   pool → `pscale:grit`; or (A) genericize `function:thornwood` in the cartridge.
4. ⬜ Rig-validate: `npx tsx scripts/rpg-rig.ts --client agent --turns 4 --keep` against a freshly
   seeded LOCAL beach — confirm play is unchanged (the loop is the proven one; this guards the
   genericization + wiring, not new behavior).
5. ⬜ Docs-rewrite (scope above).
6. ⬜ Live: Railway deploy (if B) + `pack-reset` live thornwood — **only on David's explicit go.**

## Open forks for David

1. **Wiring A or B** (above). Lean B.
2. **grit.json wording** — read `src/grit.json`; flag anything mis-genericized (esp. branch 2's
   rules abstraction).
3. **Reference cartridge name** — Thornwood stays the reference World cartridge; NOMAD stays the
   reference rules block. A second rules block (`rules:dnd` skeleton) as a *demonstration* of the
   swap — now, or when someone actually wants D&D? (Lean: later; the spec proves it's possible.)

## Addendum — assessment of concurrent other-session changes (2026-06-24)

David flagged that a concurrent session changed the GRIT/NOMAD area (playtested on the **thousand-valleys**
live world) and had concluded. Assessed before cutover:

- **`function:thornwood` gained the "three reveals"** (`9f97e85`, on main #27), after the `f78a5c8` version
  the first `grit.json` draft was genericized from: (a) **co-present cast** handed at PERCEIVE; (b)
  **directed-act = half-commit** (commit your half, their response is theirs; a beat directed at you is yours
  to answer); (c) **derived memory** (pool = the shared record you read your past from; `witnessed` = a
  private overlay of reads, not a transcript; names from the public record, not a maintained `knows` list;
  NPC audible words are public). All world-agnostic → **`grit.json` re-genericized from `9f97e85`** (branch 1
  taken verbatim-from-source + `night-wood`→`wild places`; reveals folded into `_`; branches 2/3 unchanged).
- **`rules:nomad` mechanics unchanged.** The live thousand-valleys `rules:nomad` differs from the cartridge
  ONLY by the world-seeder's `rules:thornwood`→`rules:thousand-valleys` reference substitution — not a rules
  change. (Observation, not an action item: `rules:nomad` references the world's place block by name, so the
  seeder rewrites it per world. A future tidy could make NOMAD reference `rules:<world>` generically; the
  Designer-face-edits-per-world model makes this non-urgent.)
- **thousand-valleys is a separate live world** running branches 1/2/3 identical (world-normalized) to
  `thornwood@9f97e85` — confirms `9f97e85` is the concluded loop and the correct genericization source.
- **bsp-mcp** has no content divergence (origin/main = merge commits of this branch). **nomad-bsp archived.**

Net: only `grit.json` needed refreshing; the wiring, docs, and cutover plan are unchanged.
