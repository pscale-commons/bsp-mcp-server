# RPG re-orientation — working log

A **visible** running record of decisions, what's done/parked/open, and shared vocabulary —
so neither of us re-derives or repeats. David's layer-3 calls marked **[David]**.
Claude keeps this current each working turn. (Claude's private memory is separate and
invisible to David; THIS file is the shared source of truth.)

## Goal
Make the RPG play correctly on **bare claude.ai via bsp-mcp**. xstream is a later, kinder
skin — NOT required and NOT being touched now. The work: re-orient the pscale blocks +
minimal code so the right context reaches each LLM (soft / medium / hard) through the right
**frame**.

## Shared vocabulary (stop re-confusing terms)
- **frame** — the bundle of bsp-addresses that, read together, becomes one caller's context
  window. `frame-spec:<world>` IS this. CADO×SMH selects which addresses. NOT a thing to
  build — it is *resolved* (read) per caller.
- **aperture** — the resolved frame for one (face, tier, handle): the actual text handed to
  that LLM.
- **surface / current** — the *unfolded* content of a context window (David's term). Not
  code; just what a frame yields.
- **face (CADO)** — Character / Author / Designer / Observer. Which role's aperture.
- **tier (SMH)** — Soft / Medium / Hard. How wide the aperture.
- **band** — NOMAD outcome tier. CF + SF + dice − difficulty lands in a band:
  overwhelming / clear / marginal / stalemate / minor-fail / significant-fail / catastrophic
  (`rules:nomad` position 4). "Band" = outcome tier, nothing more.
- **position** (was "seat" — jargon, dropped) — the character's location (`passport:3` today)
  as the origin of perception. "Seat the self" = perceive *from* there, not as a room catalogue.
- **typing** — hold three kinds apart: YOU / authored standing figures (NPCs in `spatial`) /
  live co-present characters (other handles).
- **viewer** — xstream's V-L-S UI. NOT a bsp-mcp thing. In bsp-mcp a face is just a
  frame-resolution returning text.

## CADO map — four faces = four apertures over the same substrate
- **C Character** — own aperture: position + place + own `witnessed`/`knows` + typed co-present.
  IN = perceive. OUT = narrative → `witnessed:<handle>` (the solid history over time) **and**
  optional durable place-notes → `spatial`. [rig view: threads]
- **A Author** — shape the stage AND **create handles (NPCs + PCs) initially**: write
  `spatial` + new `passport`/`shell`/`knows` for new characters. [no rig view yet]
- **D Designer** — the rules/conventions: `rules:nomad`, `rules:thornwood`, `function:<world>`,
  `frame-spec`. [rig view: dataflow]
- **O Observer** — correlation across narratives: read `witnessed:<each>`, present overlap +
  divergence. [rig view: observer]
- Same operation for all four: resolve a face's frame and render. **C is per-turn-live; A/D/O
  are over the accumulated run** (= what the filmstrip already does).

## Decisions
- [David] World = sub-beach. Official RPG = `thornwood.beach.happyseaurchin.com`. Apex = commons.
- [David] Address notation: one decimal at floor (`1.12`) OR comma-walk (`1,1,2`). NEVER
  multi-dot (`1.1.2`).
- [David] "Surface" is not built; the **frame** is the operational core — resolve, don't construct.
- [David, 2026-06-16] No `shell:<char>` block "by design — change only if David wants it";
  character = `passport` + `witnessed` + `knows` + the directive-as-role-shell.
  **DECIDED 2026-06-18 [David]: keep `passport:3` for now** (shell-phasing = a separate
  later step; the recommendation to phase still stands, revisit when convenient).
- Frame C-aperture amended (position-origin + typed co-presence), decomposed into subnests;
  **validated on the rig** (self-drift + NPC-merge fixed, fog 5/5, observer 4/5).
  Committed: pscale-beach `claude/frame-c-aperture`, bsp-mcp `claude/frame-resolve-rig`.
- `function:thornwood:1` (soft directive) PERCEIVE step now carries position-origin + typing —
  the **bare-claude per-turn production surface** (cartridge only; live beach NOT yet applied).
- **Directive-mode rig run VALIDATES the bare-claude path** (2026-06-18): rig `--aperture directive`
  = raw blocks + the directive does the seating/typing (no code composer). Seating + typing + fog
  all HELD (observer 4/5). So the directive-prose path works; the human test should reproduce it.
- [David, 2026-06-18] **Cartridge versioning = git.** A new VERSION of a world = a commit/PR to
  `packs/<world>/` — the commit IS the experiment record; rollback via git or `pack-reset` from a
  commit; fork via `git branch`. A NEW cartridge FOLDER = a divergent world OR running two versions
  live at once (A/B). The live beach is a fresh INSTANCE of a seeded cartridge version; pack-reset
  from a chosen commit = rollback. (Canonical home: each `packs/<world>/MANIFEST.md`.)
- **"Engagement is an act" build — DONE 2026-06-19** (the human test-run's core bug fix). Test bug:
  a character who *perceived but never submitted* wasn't in the liquid, so an actor read "only me,"
  solo-resolved, and the resolver invented the absent character's response ("she took the drink").
  Systemic fix, NO targeting rule: (a) `function:thornwood:1` step 4 — **every turn is an act**
  (looking/waiting/watching included), so the submission IS presence and the liquid is reliable
  co-presence → no false-solo; (b) `:2` **agency clause** — the resolver weaves ONLY what each
  character submitted, never authors a response they didn't act; (c) reframed underscore (liquid =
  reliable presence; solo only when truly alone); (d) `pool.ts` **embodiment gate** — A/D/O engage
  leaves no liquid trace on an RPG pool (only characters are embodied/present). Rig no-regression
  PASSED (passive "watching" now resolves with a perception calc; seating/CF/fog hold, observer 4/5).
  The watcher→false-solo→agency-steal bug can't reproduce in the rig (it forces every seat to act
  each round) → validated by David's next human test.
- **FAILED IN REAL PLAY 2026-06-22 — ZERO correspondence (next session's bug).** Live thornwood data:
  routing FINE (both on thornwood), propagation FINE (anya's committed beat saw cyrus by appearance,
  fog held), frame FINE. The ONE bug is **INSTANT-SOLO**: each player resolves their window instantly,
  so windows never stay open to gather — cyrus resolved 3 solo beats (10:47–10:49) before anya ever
  acted; they NEVER shared a window = no interaction. "Engagement is an act" fixed PRESENCE, not
  TIMING. ROOT CAUSE: the window DURATION is not ENFORCED — the directive's "resolve only a closed
  window" is convention; the LLM instant-resolves and the beach's atomic claim checks single-resolution
  NOT duration, so it accepts the early resolve. FIX (invariant-as-code, like single-resolution): the
  beach REJECTS `resolves_window` when `now < openTs + duration` → forces the window to stay open its
  full duration so the second player can join. Cost: latency (act → wait the duration → resolve) = the
  inherent async constraint (no realtime). Duration source = frame-spec:thornwood:9 (90s).
- **SHIPPED 2026-06-22 — "co-presence-close" (refines the pure-dwell proposal above).** Re-test forensics
  added a THIRD face to the same fault: perceive reads ONLY the resolved pool, never the LIVE WINDOW —
  so Anya's question to Cyrus (which even reached pool slot 4) was invisible to him while pending, and
  one-sided once frozen (solo-resolved, no gather to pull Cyrus in). **[David] rejected pure-dwell+re-touch
  as tedious** ("players have to keep checking"; a submission mid-window getting no resolution "tests the
  patience of any player") and chose: **a window resolves the moment a SECOND character joins it**
  (co-presence completes the gather, the completing submission INCLUDED); a lone intention resolves after
  the span; a submission with no open window starts a NEW one (not in the closed one). KEY INSIGHT: counting
  present intentions is convention-ROBUST where the prior time-arithmetic + solo-instant escape hatch was
  not — so this ships **block-only, no deploy**: `function:thornwood` (dropped solo-instant; perceive now
  reads the live window + renders co-present live actors; act applies ≥2-closes), `frame-spec:9.2` (span
  90→30s, reframed as solo-patience-ONLY). Reseed `packs/thornwood` to apply. **Hardening-if-shaky** (the
  prior entry's invariant-as-code, re-shaped to this rule): envelope (`pool.ts`) STATES the verdict
  ("another character is here NOW — the window is complete, resolve") so the SURFACE owns it, not
  convention — needs a Railway deploy; deferred until the block-only re-test shows whether the directive holds.
  Parked: 3rd-player shut-out (a settle-grace before ≥2 closes) — irrelevant at two players.
  **Mechanics validated 8/8, no LLM, no live secrets** (`scripts/check-co-presence-close.ts` — drives
  the real `pscale_pool_engage` against a freshly-seeded LOCAL beach): perceive surfaces the live
  window (the exact "Anya asked, Cyrus saw nothing" fix), a 2nd submission makes a 2-intention window
  with per-actor dice for both, resolving it commits ONE shared skeleton, single-resolution stands a
  second resolver down, and the other character then perceives the shared beat. RESIDUAL = directive
  ADHERENCE only (does a bare LLM follow the prose): the rig's `--client bare` was updated off the old
  pure-dwell rule to defer to the directive (co-presence-close); a keyed run (ANTHROPIC_API_KEY) or
  the live two-machine test is what settles it. The substrate gives the LLM everything the fix needs.
- **Character-shell convention — designed + BUILT + validated 2026-06-22.** [David] design-first, off an
  agreed spec ([proposals/2026-06-22-character-shell-convention.md](../proposals/2026-06-22-character-shell-convention.md)).
  KEY INSIGHT [David]: a character shell IS the hermitcrab shell already in use, at three densities —
  **happyseaurchin** (thin / human-driven) → **weft** (dense / LLM-app harness) → **mobius** (full /
  API-key + heartbeat, autonomous). PC vs active-NPC = where on that spectrum the shell sits, NOT a
  type. Decisions: specialise `shell:<handle>` (not a new name); inhabitation = density (not a field);
  private (locked `_`, drive gray-able). Persona/voice/stance → the Character face (`shell` 1.1, like
  weft's); **drive → `purpose:<handle>`** (the agency lever); autonomy → `wake:<handle>`+heartbeat. The
  manifest also gathers the RPG-mechanical blocks — `stats:<handle>` (NOMAD CF now, condition/HP later)
  + rule refs — so the shell is the **complete context-assembly hub**. Whole-system framing [David]: RPG
  is the maximal-stress test of the entire stack (pscale → bsp+beach → pool/grain/sed → RPG context
  delivery); a real-world user IS a thin character shell in the commons-world, so "works for RPG → works
  for real users" is an identity, not an analogy.
  BUILT: 6 cartridge blocks (`shell:`/`purpose:` for cyrus/anya/fenn, locked per-character); rig reads
  shell-persona (→ system) + purpose-drive (→ user) in perceive/act/bareDecide.
  VALIDATED (keyed autonomous rig, bare/concurrent/directive, 3 turns, no human): **the hedging is GONE**
  — the three pursued DIVERGENT drives and converged on the shared mystery through action (Cyrus voices
  the missing-caravan question; Anya names the bone-charms; Fenn reveals he cut & burned charms). Fog
  5/5, consistency/persistence 4/5. **Agency still 3/5 — but the CAUSE MOVED**: no longer "nobody acts"
  (drive fixed that) but "partials don't RAMIFY" — a partial yields atmosphere (Bram notices) with no
  downstream teeth (no NPC reaction, no door closing, no state change). That is the PARKED NOMAD problem
  (sub-success friction / failures=consequences / damage-death state / the "action" block), which the
  shell manifest already names as `stats:<handle>`. So the next systemic lever is NOMAD consequences:
  an outcome must close an option, open a threat, or change state. The shell build also PROVED the
  HITL-reducing loop — iterate a systemic element (shells) → re-run autonomous → read the observer →
  name the next lever — with no human in the chair.

## Parked (deferred, NOT lost)
- **Place-enrichment** [David's flag, raised twice]: durable beat-notes fold into `spatial`
  ("what is known here" → prose). Part of C's OUT — do it with the C write-back.
- **Async-presence / absent-PC** (auto-response vs late-join).
- **Player-roll widget**, **damage/death state** (NOMAD hard consequences).
- **NOMAD luck-vs-CF — FIXED 2026-06-18** [David's spec]: CF now scored 1-20 (10 talent + 10 skill;
  8 = competent), block-only edit to `rules:nomad` position 1. Rig directive-run confirmed: CF reads
  7–14 (was 2–5), luck no longer dominates, observer dropped the finding. NOMAD is now the working
  "basic hook-up" David asked for.
- **NOMAD sub-success friction** (new rig finding, 2026-06-18): stalemate / minor-failure bands
  render as success-adjacent (no felt cost). Fix candidate: a sub-success band must encode one
  concrete durable complication (a closed door, an NPC reaction needing repair). Echoes the older
  "failures = consequences" thread. Parked — David postponing NOMAD.
- **NOMAD real design = "action" pscale block** [David, 2026-06-18]: make the if/then logic
  (CF>SF, CF+SF>LUCK, …) a WALKABLE PATH the LLM traverses (table-as-geometry), not flat prose.
  Today `rules:nomad` is a block the medium READS + applies; the ONLY frozen code is the dice
  (honest entropy, `pool.ts deterministicLuck`). No crappy code/categories to unwind. The
  action-block is the bigger redesign — postponed.

## Open / next
- **RE-TEST co-presence-close (2026-06-22, IN PROGRESS)**: reseed `packs/thornwood` to the live beach,
  restart play on both machines, and check the one thing that's failed twice — do two characters
  actually MEET (a question asked → resolved as ONE shared beat, not two solo skeletons)? Success =
  the second submission closes the gather and the exchange lands in the pool with both in it. If the
  directive holds, the meeting works with no code; if the LLM is still flaky about reading the live
  window or counting present intentions, ship the envelope-verdict hardening (Decisions, last entry).
- **Reliability upgrade** (only if directive-adherence proves weak live): a per-turn perceive that
  COMPOSES the C aperture (a shared resolver used by `pscale_play` + a perceive path), matching the
  rig — the reorientation's "delivered envelope" move. Don't build pre-emptively.
- **Round out A/D/O** as bsp-mcp frame-resolutions (text apertures), NOT an xstream viewer.
  A also CREATES handles (NPCs + PCs) initially.
- **Place-enrichment** + **NOMAD failure-texture** + **shell-phasing** — see Parked / Decisions.
