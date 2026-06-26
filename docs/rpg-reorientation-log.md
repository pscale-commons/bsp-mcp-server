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
- **NOMAD teeth + perception framing — 2026-06-22 (merged #22).** A band below clear must BITE (option
  closed / threat opened / standing spent / NPC reaction) — `rules:nomad:4` + `function:thornwood:2`.
  Lifted Agency 3→5, Persistence 4→5 (failures cost irreversibly + persist). `function:thornwood:1`
  render step: another character's interior is the POV's INTERPRETATION, not fact (David's 2026-06-16 ruling).
- **Faithful rig (`--client agent`) — BUILT + validated 2026-06-22. HNITL ≡ HITL achieved.** [David, point 1]
  The character-LLM makes its OWN bsp-mcp tool calls — `pscale_play` to enter + scoop the shell manifest,
  `bsp` to read place/passport + journal `witnessed`, `pscale_pool_engage` to perceive the live window +
  submit + resolve — no composed aperture, no scripted calls; the rig only EXECUTES the LLM's calls against
  the local beach (system = the real server `INSTRUCTIONS`; tools = the real Zod schemas via zod-to-json-schema).
  The sole difference from HITL is the intent-source (purpose vs human keystrokes). VALIDATED (turns=1, real
  Claude): each entered via `pscale_play`; cyrus PERCEIVED the LIVE WINDOW (saw anya pending, recognised
  himself as the figure she addressed), submitted, then did co-presence-close ITSELF — saw 2-in-window, read
  `passport:anya` for CF, wrote ONE skeleton via `contribution`+`resolves_window`, cleared, journaled. Fog
  5/5, observer 4/5. This IS the dataflow David's two-machine play uses. Supporting builds: `pscale_play`
  now manifest-driven scoop (#86, default set + extras the shell names → the drive reaches entry); shell
  orienting notes (#23 — walk-the-manifest + NPC-self-driving). Disciplines still TODO for full fidelity:
  render-then-decide is natural in the loop; the ≥30s one-intent tempo gate is `--gap` (set to span for
  fidelity runs); MCP-boundary is in-process handlers (≈parity; real-wire is the last 5%).
  NEW FINDING (the faithful rig caught what scripting hides) — **"public-inscription threshold"**: a SOLO
  actor (fenn, alone, window unresolved) is live in the LIQUID (perceivable by live-window readers) but NOT
  in the POOL until a joiner resolves it (or the span elapses) — so pool-only readers + the observer don't
  see him. Partly a turns=1 artifact (fenn acted last, no follow-up join); partly a real design Q [David's
  call]: is ENTERING / being-present a public act (pool updates on arrival), or liquid-only until a beat
  resolves? Connects to async-presence / absent-PC.
- **Window dead-lock CAUGHT + FIXED 2026-06-22 — the faithful rig's first real catch.** A longer agent run
  (turns=4) revealed: after round 1's first co-presence resolution, NO further window resolved all run —
  ONE frozen window-open stamp, ONE pool skeleton, every later resolution rejected "already resolved". The
  play LOOKED fine (observer 4.5/5) because perception reads the LIVE WINDOW (liquid): the characters saw
  each other + built rich PRIVATE narratives, masking the frozen PUBLIC pool + dead NOMAD mechanics beneath.
  ROOT CAUSE: the window-open stamp resets only when the liquid EMPTIES; the resolver can clear only its OWN
  slot (`submit=''` is caller-scoped — no tool to clear co-present slots); actors OVERWRITE their slots with
  new intentions instead of clearing → liquid never empties → stamp frozen → single-resolution (keyed on the
  stamp) permanently rejects. The SCRIPTED rig HID it (it force-cleared all slots — a deviation real LLMs
  cannot do); the high-fidelity agent rig EXPOSED it. Exactly the dataflow bug David predicted would only
  surface in live play — caught first on the rig, no human. FIX (clear-on-resolve): `pool.ts` wipes the whole
  liquid buffer when a `resolves_window` claim is accepted → the next submission opens a fresh window;
  `function:thornwood:2` drops the manual per-actor clear (now automatic). VALIDATED (re-run turns=4): **5
  distinct window stamps (cycles), 5 pool skeletons (one per window), 5 resolutions / 0 stand-downs, 0 tool
  errors, resolver rotates (cyrus→anya)**; observer Consistency 5/5, Persistence 5/5, Agency 5/5 — the TEETH
  now fire EVERY round (observer praised "consequence-layering": Bram silence → public refusal → involuntary
  stop), not just round 1. RESIDUAL (observer, perception 4/5): name-knowledge attribution — anya used
  "cyrus" without a logged public name-transmission; fix = log name-learning in the pool at the moment it
  occurs (the `knows:<h>` earned-names boundary). [David's call.]
- **First two-machine HITL run + sequencing redesign — 2026-06-23.** Cyrus + Anya on two claude.ai
  connectors (live thornwood, thorn142), David driving both. **Co-presence-close PASSED** — 4/4 windows
  gathered, the characters genuinely met and held dialogue; name-transmission logged correctly in the
  PUBLIC record (beat 5: "gives her name — Anya"); NOMAD teeth fired with per-actor divergence ("Anya's
  cast found the room's attention; Cyrus's declaration found its silence"); one narrow authored-figure
  scar (a background "broad man" promoted into beat 2 then dropped — self-limiting, not self-amplifying).
  But real play (human tempo — what the rig CANNOT simulate) exposed FOUR faults: (1) **over-rolling** —
  dice every window incl. basic dialogue, because the envelope hands dice unconditionally so rules:nomad's
  SIMPLE=no-dice never bites; (2) **cross-authoring** — one player's machine resolves BOTH characters
  (deterministic dice stop roll-fudging, not NARRATIVE fudging); (3) **async tedium** [David — the big one]
  — no push → submit-then-nudge-"what happened?"; out-of-sync windows; the player never knows whose turn it
  is; (4) **name-boundary break** — Anya's narration used "Cyrus" though he never gave his name; knows:<h>
  goes stale one beat after a name is given. UNIFYING PATTERN: public writes (the explicit act) happen;
  private bookkeeping (witnessed journaling, knows-append) is LLM-discretion and DOESN'T — witnessed:anya
  was never written all run. REDESIGN [David requested write-up] at
  [proposals/2026-06-23-resolution-sequencing-redesign.md](../proposals/2026-06-23-resolution-sequencing-redesign.md):
  two reframes — (a) separate EXCHANGE (talk/look/move → post DIRECTLY via `contribution=`, immediate, no
  dice) from RESOLUTION (contested acts only → gather+roll+teeth); (b) fold PERCEIVE into ACT + report
  turn-state (every engage returns what-changed-since-you-acted + waiting-on-X). Recommended: Model A
  (transcript-first) default, B's gather for opening/contested; output stays shared-skeleton (reject
  primary+echo); dice only on contested; name only-what-earned, derived from narrative (drop knows as a
  maintained ledger). KEY: maps entirely onto EXISTING tool paths (`contribution=` direct append;
  `submit=`+`resolves_window=` gather) → **CORE IS BLOCK-ONLY, no deploy**; rollback = `pack-reset` from
  the current cartridge commit. Two optional code hardenings (soften envelope dice framing; explicit
  turn-state line) only if the directive can't carry it. Forks pending David's confirm (proposal end).
- **Fluid async sequence — SHIPPED + VALIDATED + LIVE 2026-06-23.** The redesign above converged into
  [proposals/2026-06-23-fluid-async-sequence.md](../proposals/2026-06-23-fluid-async-sequence.md) (refines +
  SUPERSEDES the resolution-sequencing-redesign draft — same four faults, sharper frame: rolling-as-exception,
  gathering-as-exception, terse name-free record, steer-at-scale). David's forks ANSWERED by it: self-commit yes
  (a simple act commits its own terse PUBLIC fact, auto-success); dice-as-exception (only a CHECK rolls);
  exchange/resolution split = **SIMPLE** (perceive→render→commit direct, NO window, NO dice) vs **CHECK** (the
  rare uncertain-with-cost act — CONTEST against another = gather both + one resolver; TRIAL vs the world = solo,
  self-resolved on fixed seeded dice); name earned-only, entering the public record only when spoken in-fiction.
  BUILT block-only on the cartridge: `function:thornwood` rewritten (1 soft = the 5-step play loop with
  CONTEST/TRIAL as the exception; 2 = the resolving aperture worn ONLY for a check; 3 = hard upkeep) +
  `frame-spec:thornwood:9` → v0.4-simple-check-split (span 30s = solo-patience ONLY). DEPLOYED live thornwood
  (pack-reset; verified this session by reading `function:thornwood` straight off the beach). VALIDATED: the
  faithful rig (`--client agent`, 12 shared beats, no dice in talk, fog held, observer ~4/5) **+ David's
  two-machine HITL run ("works quite well")**. Character-shell port LIVE in the cartridge (`shell:`/`purpose:`
  for cyrus/anya/fenn, scooped on entry by `pscale_play`). **CF→≈8** anchored prose-native in the three passports
  (competent-not-master; reaches live on the next pack-reset). **CONVERGENCE:** fluid-async-sequence IS the merge
  of the two overlapping 2026-06-23 specs — the paused `claude/rpg-sequencing-v2` session's
  resolution-sequencing-redesign forks are answered HERE; do NOT run a parallel A/B (one live beach).
- **GRIT extraction — name + lift the RPG engine out of Thornwood. ARCHITECTURE CONFIRMED 2026-06-23 +
  BUILT 2026-06-24.** [David] design-first call after the D&D test: **two-tier (GRIT + NOMAD), with
  GRIT as a bsp-mcp SENTINEL** (not a library seed), and **recycle "GRIT" (Group Resolution In Time),
  fully replacing its dead daemon meaning.** Three reusable things above the engine, not two: **GRIT**
  = the daemonless play-loop (perceive/act/commit, simple-vs-check, contest-gather / solo-trial,
  pool-public / witnessed-private, fog-by-earned-names, the resolving aperture, hard upkeep) —
  world-AND-rules agnostic, canonical; **NOMAD** = the resolution rules (capability + situation + dice
  − difficulty → bands) — the swappable slot (D&D = `rules:dnd`); **World** = `spatial:<world>` +
  `rules:<world>` + cast. The D&D test SETTLED it: a D&D group keeps GRIT, swaps NOMAD→rules:dnd,
  authors their world — the play-loop is the most reused/most invariant thing, so it is a genuine
  reusable layer, not world content. The lone seam (D&D initiative vs co-presence) still splits: the
  gather→resolve→one-skeleton→clear machinery is GRIT; the ordering/scoring within a contest is the
  rules block. SHIPPED (reversible, no deploy): `src/grit.json` (faithful genericization of the
  *validated* `function:thornwood` — night-wood→wild places; CF/SF/bands/d10 → "the world's resolution
  rules, ref system rules:nomad"; spine-clean _,1,2,3; window/gather/resolves machinery kept) + wired
  into `src/sentinels.ts` (typecheck clean; walks as `pscale://grit`). SPEC: `proposals/2026-06-23-grit-extraction.md`.
  **BUILT 2026-06-24 [David: "go for it"]:** wiring **B** (architect's call) — `resolveDirective` gains a
  `pscale:`-prefix SENTINEL-FALLBACK so a room pool whose underscore is `pscale:grit` runs the canonical
  loop with NO per-world copy (`function:thornwood` KEPT as rollback target / override example; gatekeeper
  pattern — beach override first, sentinel canonical second). Cartridge `pool:beaten-drum-main` underscore →
  `pscale:grit`. Docs-rewrite DONE: evolution:4 (daemon→in-loop + pscale://grit), manifest (1.34 grit index +
  v2.0), block-conventions (2.5 mount-note + Designer-face line; 4.2.6 + 4.5.5 daemon-GRIT corrected),
  beach-crab-ladder:76, protocol-pscale-beach-v2 §6.3 + roadmap, protocol-xstream-frame §4.4, pscale-beach
  library grit.json + rpg.json rewritten thin. **nomad-bsp DEPRECATED** (README + CLAUDE.md banners; salvage
  `character-template`→char-creation; GitHub archive-flag offered, not set). VALIDATED: no-LLM end-to-end
  `scripts/check-grit-wiring.ts` 6/6 PASS (inlined directive IS the GRIT sentinel, world content bundled,
  rules referenced as swappable) + agent-rig confirmation on the wiring. **SAFE-EXEC:** all reversible repo
  edits — NO live writes, NO deploy. CORSAIR snapshot `/Volumes/CORSAIR/pscale/thornwood-snapshots/
  2026-06-24-pre-grit-extraction/` (22 blocks incl. beats; pinned pscale-beach f78a5c8 / bsp-mcp 3695e3c).
  ONLY remaining live step (GATED on David's go): Railway deploy (resolver) → verify play → flip live
  `pool:beaten-drum-main` underscore to `pscale:grit` → verify; rollback = flip back to `function:thornwood`
  (still present), one write. **DO NOT `pack-reset` live until bsp-mcp is deployed** — the cartridge now
  expects the resolver fallback. DIRECTION [David 2026-06-24]: transition upgrades toward the CADO **Designer
  face** via bsp-mcp — quality through players, not the substrate architect.
  **POST-ASSESSMENT + RE-GENERICIZED 2026-06-24** (David flagged concurrent other-session RPG changes,
  concluded, in the GRIT/NOMAD area; he playtested on the **thousand-valleys** live world). Assessed: (1)
  `function:thornwood` gained the **"three reveals"** (commit `9f97e85`, on main #27) — co-present cast handed
  at PERCEIVE (you see who's here before they act), directed-act = HALF-COMMIT (commit your half, their
  response is theirs; directed-at-you is yours to answer), DERIVED MEMORY (pool = the shared record you read
  your own past from; `witnessed` = a private overlay of reads, NOT a transcript; names come from the public
  record not a maintained list; NPC audible words are public). All world-agnostic loop mechanics → **grit.json
  RE-GENERICIZED from 9f97e85** (branch 1 verbatim-from-source via /tmp rebuild + night-wood→wild places;
  reveals folded into `_`; branches 2/3 unchanged, already genericized). (2) `rules:nomad` mechanics
  UNCHANGED — the live thousand-valleys divergence is ONLY the world-seeder's `rules:thornwood`→
  `rules:thousand-valleys` substitution (not a NOMAD change). (3) thousand-valleys is a SEPARATE live world
  whose `function:thousand-valleys` branches 1/2/3 are identical (world-normalized) to thornwood@9f97e85 —
  confirms 9f97e85 IS the concluded loop. bsp-mcp: no content divergence (origin/main = merges of my own
  branch). **nomad-bsp GitHub-archived** (isArchived:true). Wiring re-validated `scripts/check-grit-wiring.ts`
  6/6 + agent-rig re-confirmation on the three-reveals loop (observer **4.5/5 — UP from the pre-reveals 4/5**;
  perception-limits + persistence both 5/5 — the reveals visibly working; lone note = passive NPC Bram, a
  content/NPC-richness item already on the roadmap, not a regression). High-level GRIT docs (evolution/manifest/
  block-conventions/library) sit at an altitude the reveals don't change → stand. Net: only grit.json needed
  the refresh; cutover plan unchanged.

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
- **Three reveals — VALIDATED + SHIPPED + LIVE 2026-06-24; validation cycle NEXT.** The completion side of the
  GRIT-session POST-ASSESSMENT entry above. The three reveals from the first thousand-valleys two-machine play
  (Orvel + Tessavar, 9 beats) — co-presence / directed-act half-commit / derived memory, + NPC-public stopgap +
  interiority one-liner — designed
  ([proposals/2026-06-24-three-reveals-copresence-target-derived-memory.md](../proposals/2026-06-24-three-reveals-copresence-target-derived-memory.md)),
  validated NHITL (haiku **4.5/5** — the robustness floor — then sonnet "disciplined, high-quality"; the GRIT
  session's own rig run agreed, 4.5/5 up from 4/5), SHIPPED. **Reveal 1 (co-presence) is CODE, not directive** —
  `play.ts` surfaces the co-present cast (handles whose passport:3 = your location) in the pscale_play envelope;
  bsp-mcp **PR #90 → Railway-DEPLOYED → verified live** ("WHO IS HERE" present in the deployed envelope, via a
  fresh raw-MCP call — the harness session goes stale through the instance swap and self-reconnects). Reveals 2-4
  are directive (pscale-beach #27 `function:thornwood`; the GRIT session re-genericized `grit.json` from that
  commit, so `pscale:grit` carries them too). LIVE: thousand-valleys directive updated (2-4) + co-presence
  deployed; verified. INTEGRATED STATE: bsp-mcp main = co-presence (`play.ts` #90) + GRIT's `resolveDirective`
  `pscale:`-fallback (`pool.ts` #91), both deployed → the deployed server supports co-presence AND
  pool→pscale:grit. Reveals live on BOTH paths (cartridge pool→pscale:grit; live thousand-valleys
  pool→function:thousand-valleys — both carry the reveals, play identically). RESIDUAL: motive-attribution in
  private journals (the one-liner addresses it; observer-flagged on sonnet). **NEXT [handover written for a fresh
  session]: the VALIDATION CYCLE — (1) RIG NHITL online (haiku then sonnet, `--client agent`); (2) two-machine
  USER play-test on thousand-valleys (handles orvel/tessavar/sable, unlocked, co-located at the Drover's Common)
  — confirm infra solid + RPG playable. OPEN: align thousand-valleys + live thornwood to `pscale:grit` (the GRIT
  cutover; its Railway-deploy gate is now satisfied) — only after confirming `pscale:grit` pulls the world's
  rules. Live locks: thousand-valleys=`valleys142`, thornwood=`thorn142`.**
- **RE-TEST co-presence-close — DONE 2026-06-23 (PASSED).** First two-machine HITL run: 4/4 windows
  gathered, the characters met and held dialogue. Co-presence-close confirmed under real play. The run
  surfaced the NEXT work (see the sequencing-redesign Decisions entry + proposal).
- **Resolution sequencing — RESOLVED + SHIPPED 2026-06-23** (see Decisions: "Fluid async sequence"). The
  redesign's four forks were answered by the fluid-async-sequence spec, built block-only, deployed live, and
  validated on the rig + David's two-machine run. The `resolution-sequencing-redesign.md` draft is SUPERSEDED.
- **CADO corrected + backcast roadmap [David, 2026-06-23 — ACTIVE].** CADO is **advisory framing**, already
  operational — it is all just create/edit blocks, scoped per face so people + agents self-organise around what
  they build; rights-enforcement is the deferred **v0.2** (`docs/protocol-agent-shell.md` §3.3–3.4). NOT directives
  to build. [David corrected an over-scoped review — `cado-complete-product-minimum.md`, now SUPERSEDED; its one
  surviving idea is the four-stances completeness: define / build / inhabit / export exhaust the relations to a
  world, no fifth face.] Operative plan = **backcast from the three objectives** (bsp-mcp human play / llm-play /
  xstream) at
  [proposals/2026-06-23-roadmap-backcast-three-objectives.md](../proposals/2026-06-23-roadmap-backcast-three-objectives.md).
  CONVERGENCE (the present edge): all three backcasts bottom out on **world-generation** (author-LLM) + **NOMAD
  damage/death + character-creation** — block-only, no L1. v0.2 rights + multi-world/gazetteer are PROTOTYPED in
  **pscale-biome** (the identity membrane / biome-DNS gazetteer / `located` multi-world, where `urb` is a named
  placeholder), so the adoption/scale rungs are de-risked. NEXT: world-gen — hands-on (David + claude.ai → A)
  ∥ probe (me, autonomous author-LLM → B).
- **World-gen probe — VIABLE 2026-06-23 (rung 0 proven, no human).** `scripts/probe-author-world.ts`
  (emit-spec → batch-load — the fast pattern from `scripts/probe-write-speed.ts`): an author-LLM generated a
  coherent, shape-valid, populated, playable town (rivermeet — 7 places / 23 positions, 5 NPC passports, all
  spine-legal, floors present) in ONE generation + a 21ms batch-load; the traveller-perceive read coherent;
  coherence judge 5/5/5/4 ("nearly production-ready"). SPEED: bsp-mcp's handler adds ~0ms; the real cost is
  remote RTT (242ms) × sequential — so author-as-DATA-SPEC + batch-load (~0.4s) beats N sequential bsp() tool
  calls (~7.3s network + 1-3s LLM thinking each). TWO FINDINGS: (a) the author got pscale addressing RIGHT
  (`21`/`31` = walk 2,1 / 3,1 → the stall, the inn common room — generalised from one `:2` example); (b) the
  generic coherence judge LACKED pscale-awareness and FALSE-FLAGGED those correct addresses as errors → the
  Observer + Designer LLMs (rung 1) MUST be substrate-grounded (handed whetstone), or a self-correcting
  designer-LLM would "fix" correct work. Probe scripts uncommitted (harness, not substrate).
- **PLAYABLE end-to-end — CONFIRMED 2026-06-23.** `scripts/probe-playable-world.ts`: a fresh author-generated
  town swapped onto the thornwood engine; 3 real character-LLMs ENTERED via `pscale_play` and co-present acted
  on one shared beat (the Greymarch caravan question) — judge GROUNDED 3 / COHERENT 4, "reads as a playable
  world". FINDING ("the Bram leak"): reusing thornwood's CHARACTERS in a new town bled their OLD memory in (they
  named Bram, absent from the new town) — a character is world-BOUND via witnessed/knows/shell, so world-gen MUST
  include fresh character-creation; transplanting contaminates. This PROMOTES character-creation from "nice" to a
  hard rung-0 requirement. (Also seen: a non-fatal wire-read fallback on `bsp pool:...` — the known no-pscale
  read gate; LLM recovered.) BEACH FACTS for going live: apex `beach.happyseaurchin.com` accepts content writes
  NOW (verified write→read→delete); a fresh `<world>.beach.happyseaurchin.com` resolves by DNS but has NO TLS
  cert (SSL_ERROR_SYSCALL) → a one-time Vercel domain-add per world, or a wildcard `*.beach...` to future-proof
  all worlds (not doable via the available Vercel MCP tools — a dashboard step).
- **Beach provisioning + engine-on-GitHub — verified 2026-06-23 (context for the 28.20 GRIT session).**
  PROVISIONING (sharpens the entry above): NOT a wildcard cert — thornwood / idiothuman / apex each carry a
  SPECIFIC cert (`CN=thornwood.beach…`); a fresh `<world>.beach.happyseaurchin.com` DNS-resolves + the handler
  Host-routes + the cartridge can SEED it via `pack-seed --via <apex>` (apex cert + Host header), but CLIENTS
  (claude.ai / bsp-mcp / browsers) can't HTTPS-connect until that subdomain has its OWN cert. The `vercel` CLI
  IS authed as happyseaurchin on project happyseaurchin-home (`prj_IAQn…` / `team_iTER…`) → one subdomain is a
  single `vercel domains add` (auto-cert, reversible); a TRUE wildcard `*.beach…` needs a DNS-01 TXT at DreamHost
  (David's DNS access). ENGINE ON GITHUB (David's ask): YES, three forms — (1) **nomad-bsp**
  (github.com/happyseaurchin/nomad-bsp) = the PRIOR engine extraction: NOMAD as seedable blocks (nomad-rules +
  soft/medium/hard-agent + character-template + dice-config) + a synthesis DAEMON (`daemon/synthesis-daemon.js`
  + launchd plist; the `grit-resolver-crab` branch IS GRIT); (2) pscale-beach `packs/thornwood` (origin/main) =
  the CURRENT cartridge (fluid directive); (3) bsp-mcp `src/tools/pool.ts` + `bsp.ts` (origin/main) = the CURRENT
  in-loop resolution. CRITICAL for 28.20: nomad-bsp is a ~June-5 snapshot built around a CENTRAL synthesis
  daemon; the engine has since moved to IN-LOOP resolution (each player's LLM + the atomic single-resolution
  claim, NO central daemon) — so GRIT-as-daemon (nomad-bsp) ≠ the live engine shape; reconcile, don't assume
  nomad-bsp is current. CF work committed on `origin/claude/thornwood-passport-cf` (branch, pending merge);
  this session's probe scripts + proposals are uncommitted local (harness/docs, not the engine).
- **Reliability upgrade** (only if directive-adherence proves weak live): a per-turn perceive that
  COMPOSES the C aperture (a shared resolver used by `pscale_play` + a perceive path), matching the
  rig — the reorientation's "delivered envelope" move. Don't build pre-emptively.
- **Place-enrichment** + **NOMAD failure-texture** + **shell-phasing** — see Parked / Decisions.
