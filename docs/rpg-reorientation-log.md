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

## Parked (deferred, NOT lost)
- **Place-enrichment** [David's flag, raised twice]: durable beat-notes fold into `spatial`
  ("what is known here" → prose). Part of C's OUT — do it with the C write-back.
- **Async-presence / absent-PC** (auto-response vs late-join).
- **Player-roll widget**, **damage/death state** (NOMAD hard consequences).
- **NOMAD failure-texture** (a guard's miss ≠ a forester's miss) — small polish, draft ready.

## Open / next
- **Validate live**: the directive carries the validated *content*, but the rig tested *composed
  context*, not *directive prose* — so directive-vs-composed is the variable the next bare-claude
  two-machine test checks. Needs the directive applied to the LIVE beach (`thorn142`, David's ok),
  then "play X on thornwood" on two machines.
- **Reliability upgrade** (only if directive-adherence proves weak live): a per-turn perceive that
  COMPOSES the C aperture (a shared resolver used by `pscale_play` + a perceive path), matching the
  rig — the reorientation's "delivered envelope" move. Don't build pre-emptively.
- **Round out A/D/O** as bsp-mcp frame-resolutions (text apertures), NOT an xstream viewer.
  A also CREATES handles (NPCs + PCs) initially.
- **Place-enrichment** + **NOMAD failure-texture** + **shell-phasing** — see Parked / Decisions.
