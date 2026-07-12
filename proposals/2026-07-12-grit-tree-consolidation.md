# GRIT–tree consolidation — one engine, two structures, a naming ruling, and the browser principle

**Date**: 2026-07-12
**Status**: RATIFIED in conversation (David + Claude Code, Fable 5 pass); substrate naming ruling already live at `tree:8` (beach.happyseaurchin.com); code items pending, listed at §8.
**Context**: live pool testing on `pool:beach-venture` (David + orvel, 2026-07-11) surfaced split behaviour between bsp-mcp and xstream; a claude-ai session independently built a venture plan on the *stale* beach `grit` placeholder; two GRIT blocks disagree; terminology (spine/tree/mirror) had begun to slip. This document is the consolidation orbit's record.

> *The beach metaphor is structurally correct, not decorative: pscale blocks pour like sand — fluid in aggregate, solid at every grain. Structured semantics: the LLM reads the pile logarithmically; the human finds it slippery; the same sand. Fluidity lives in the substrate; solidity is delivered as grammar at the interface.* — David, 2026-07-12

---

## 1. The finding that forced consolidation

Three systems are in flight on the same substrate at different maturities — the RPG (months, mature), state-of-play (days, tested once), beach-venture (hours, half-formed) — and the *descriptions* had forked even though the *code* had not:

- **Two GRIT blocks.** `pscale://grit` (sentinel, canonical, RPG play-loop, four apertures) is what runs: `sentinels.ts` registers it; `pool.ts` resolves `pscale:grit` / `function:<world>` directive refs from a pool's underscore; the NHITL rig exercises it via `pscale_play`. The beach-hosted `grit` block (v0.1 placeholder, "Mode A/B" pscale-mcp-era vocabulary) is read by **no code** — but it alone carries the *generic* cycle (vapour→liquid→solid→archive, the integration kernel, collaboration applications). The claude-ai venture plan was built reading the stale one — hence "dice are optionally in GRIT" (beach grit 4.3) when the sentinel had already ruled the opposite: *"The dice and the outcome bands are NOT GRIT's — they belong to the world's RESOLUTION RULES."*
- **The dice leak (verified live).** `pool.ts` emits nomad window-dice whenever liquid is non-empty, on *any* pool — `pool:beach-venture` (no directive mounted) hands every reader exploding-d10 luck and resolver instructions. RPG machinery leaking into a planning pool.
- **The commons-pool deviation (verified in code).** xstream `Column.tsx` commons branch: commit produces a *private* personal solid (React state), writes nothing to the pool, clears only the committer's slot — while the pool's own underscore invites voices to land and bind. Render-at-commit conflated with commit.

## 2. The consolidated engine — five verbs

Every behaviour across all four running systems reduces to five verbs, each already implemented somewhere. Nothing new is invented; the deviations above are the only places the verbs are mis-wired.

| Verb | What | Canonical implementation |
|---|---|---|
| **stage** | overwrite your own liquid slot; withdrawable; visible fresh to co-present others | `pscale_pool_engage submit` / xstream liquid |
| **commit** | the durable, attributed write of your voice — *destination follows the structure* (§4) | `contribution` (pool append) / mirror write via `bsp()` |
| **fold** | ONE integrating write across many, atomically claimed | RPG resolver (`resolves_window`) / `bsp-floor` concat+synthesise |
| **render** | per-viewer projection at read; never lands on shared substrate; may be *committed onward* to your own mirror/journal | perceive (RPG) / pool-engage envelope synthesis / medium snapshot |
| **settle** | archive; supernest | automatic, proven |

**The RPG's double synthesis is the proof of the render/fold split**: the event-skeleton is fold-at-write (one public weave per claimed window, checks only); the player's second-person rendering is projection-at-read (per character, journaled privately to `witnessed:`). The commons-pool bug is exactly the conflation of these.

## 3. Two structures, orthogonal and composable

Per the live `tree` block (branch 9): **pool accumulates many voices at ONE place through time; tree accumulates many voices across a whole ADDRESSED structure.** Loops (GRIT et al) mount on either via the underscore directive.

**Correction (David, 2026-07-12): trees carry pools.** An earlier draft claimed state-of-play "needs no pool" — wrong. The pool at a tree is where members leave positions stigmergically between gatherings and where they gather co-presently to iterate liquid toward an agreed solid. Without it, every participant works in isolation behind their own LLM's summaries. The pool is the tree's *live room*; the mirrors are its *durable annotations*; the fold is its *social picture*.

**The verbatim-voices discipline** (from David's lived pain — claude-ai returns only summaries; xstream shows fresh liquid): the envelope already carries contributions verbatim; the mediating LLM compresses them away. The default synthesis hint must instruct: *quote the voices first (verbatim or near), then synthesise*. Voices visible through BOTH portals is a portal-invariant, not an xstream nicety.

## 4. Commit destinations — the table that resolves (B)

Commit = "make it durable under your name." Where it lands follows the structure engaged:

| Engagement | commit lands | render (if kept) lands | fold lands |
|---|---|---|---|
| RPG room (pool-per-place) | pool beat (append) | `witnessed:<handle>` (journal) | skeleton → same pool (claimed window) |
| tree (state-of-play, venture) | **your mirror `V:<handle>` at the spine address** — and/or a pool trace | your mirror (adopted snapshot) | `V` (bare name) via bsp-floor; window-fold at `pool:V` for co-present sessions |
| room-at-handle | pool commit | — | — |
| bare beach | mark | — | — |

David's flow, affirmed as the tree-native loop: *see peers' liquid fresh → commit → personal snapshot (render) → commit own liquid OR the snapshot to my mirror → the fold folds everyone's mirrors, which may be personal readings or adopted snapshots.* No replication problem exists: renders are per-viewer by construction; the fold is one write; mirrors hold only their owner's content.

Pool-binding rule (resolves the jitter question): **bind pool-per-place where perception isolation is structural** (RPG rooms — moving is the four-step move, which the column already follows; the jump is the fiction); **bind one pool with address-scoped slots where scopes nest** (venture horizons — today ⊂ week ⊂ August; the Gromov-product machinery in recipe-runner exists for exactly this). Trees default to ONE pool per family (`pool:V`).

## 5. Naming ruling — LIVE at tree:8

The **tree is the family, never a block**. A tree named V comprises:

- `spine:V` — the blueprint; un-owned coordinate space; prefixed because it is infrastructure.
- `V:<handle>` — each mirror; role-with-handle; sovereign.
- `V` — **the fold, bare name**: asking for the thing returns the social product, never the owner's blueprint. The name enacts tree:4 (authority in the aggregate).
- `pool:V` — the gathering place.

Worked instance: `spine:beach-venture` / `beach-venture:happyseaurchin` / `beach-venture` / `pool:beach-venture`. Historical exception: state-of-play's spine is `battery` (pre-ruling); its family already followed the pattern. **Journals are not mirrors**: `witnessed:`/`history:` are located in time; mirrors are located on the spine's addresses.

Retired usages: "tree = the social version" (that layer is the **fold**); "spine" for the whole pattern.

## 6. The RPG ↔ tree correlation (evaluated, as delegated)

Same bones, different personal-record geometry — siblings, not the same pattern:

| | RPG | tree |
|---|---|---|
| spine | `spatial:<world>` (places) | `spine:V` / `battery` (banks, horizons) |
| pools | per-place (structural isolation) | one per family (nested visibility) |
| personal layer | **journal** (`witnessed:` — chronological, because fiction is *lived in time*) | **mirror** (`V:<handle>` — structural, because planning/assessment is *located in structure*) |
| fold | per-window skeleton at a place (time-local) | per-address across persons (structure-global) |
| render | perceive → 2nd-person POV | your own reading of the envelope/fold |

The difference is domain-driven, not accidental: a character's experience is temporal; a contributor's assessment is positional. `witnessed` is acknowledged as the working system (an earlier iteration's solution) — it is a *journal* in the consolidated vocabulary and needs no change. **Optional future unification, not a build item**: a character's knowledge overlay (`knows:<handle>`, fog-by-earned-names) is semantically a *mirror on the spatial spine* — "what this place is to me" at self-same addresses. If the RPG ever wants tree folds ("what does the cast collectively believe about the tavern?"), that is the join. The five verbs and CADO hold across both because neither cares whether the personal record is journal or mirror.

## 7. CADO — the friendly router (block-attribution, not word-games)

A face = read-frame (which addresses compile into context) + write-target (which co-located block receives the act) + authority (which locks you hold). Faces LIGHT UP where authority exists — layer-3 users think "am I allowed to be a character here / change the rules here", never block names.

| Face | writes | RPG target | tree target |
|---|---|---|---|
| Character | the stream | room pool beat | `pool:V` liquid/trace + own mirror |
| Author | the substance | `spatial:<world>`, content | node deliverable / mirror substance |
| Designer | the mechanics | `rules:<world>`, directive, recipes | `spine:V`, epoch, fold recipes |
| Observer | nothing shared | reads folds; lent turn (public-only) | reads `V`; computes ad-hoc folds |

Designer acts are **direct block writes, never pool-liquid** — the face-liquid mixing observed 2026-07-11 was a routing failure, not a missing partition.

## 8. The browser principle — xstream's evolution law

David's requirement: a basic standardised xstream operating across any/all conventions, updated like a browser (rarely, for protocol), never per-convention. The cure is an **engagement contract**, frozen small, everything else substrate-read:

- **Frozen (the contract)**: the five verbs; directive resolution (underscore mount → `function:<world>` / `pscale:<name>`); recipe resolution (settings chain); address scoping (Gromov); the wire (L1 kernel).
- **Substrate (conventions, no client update)**: which verbs are live at an engagement; commit destination; fold gate + clear policy; rules blocks; synthesis directives; face availability.

Current violations to migrate (each a hardcode that should be a substrate read): `isDirectiveRoom()` RPG detection; the commons-pool personal-solid branch; nomad dice unconditional in `pool.ts`; clearPolicy honoured only on the marks branch. **Everything xstream writes must remain a `bsp()` write a direct bsp-mcp caller could make** — routing and mediation above, never substrate behaviour.

## 9. Decisions ratified

1. **Engine block home**: the GRIT sentinel is rewritten as engine-first — underscore = the five-verb cycle + window discipline + the two structures; the four RPG apertures become its play-mount branches; the beach v0.1 placeholder is superseded (its generic-collaboration content folds in; the block at the beach gets a pointer or removal at David's discretion). Draft rewrite to be prepared for David's read-over before `src/grit.json` changes — sentinel edits ship to every deployment.
2. **Venture pool authority**: OPEN append path ("operational across bsp-mcp" is the requirement; the pool's own underscore invites strangers; tree:4 makes open safe — authority is in the fold, voices are attributed, folds are recomputed reads). Mechanism: rotate or R5-relinquish the current accumulator lock. Mirrors stay sovereign per owner.
3. **Fold gate**: `single` claimer (the RPG's `resolves_window`, exists, atomic) as default for co-present pool sessions; quorum/consensus later (vocabulary already parsed in recipe-runner). Folds are otherwise READS recomputed on demand (tree:3); future fold recipes: **concat-fold → code stats (correlation heatmap across mirrors per address, outlier surfacing)**; synth-fold → LLM reading.
4. **Floor first**: re-floor `spine:beach-venture` to floor 6 before anything else — it is what lets bsp-floor lay mirrors against the spine at matching pscales. Substrate-level floor attribute at the beach; NOT expressible as a bsp() write (supernest buries, doesn't re-index). Verify the beach's floor derivation/storage before authoring the ladder (year `100000` … now `111111`).

## 10. Code items (Weft sessions; each self-contained)

1. `pool.ts`: gate window-dice emission on the mounted directive/rules (fix the verified leak).
2. `pool.ts` `DEFAULT_SYNTHESIS_HINT`: add the verbatim-voices instruction (quote first, then synthesise) — the portal-invariant.
3. xstream: commit-destination table (§4) replaces the commons-pool personal-solid branch; render moves to read-time / explicit snapshot; snapshot-to-mirror commit path.
4. xstream: clearPolicy honoured on the pool branch; fold gate wiring.
5. xstream: engagement-contract refactor (§8) — `isDirectiveRoom` and commons-model branches become substrate-read configuration.
6. pscale-beach: floor-set mechanism (operator script or attribute write) + re-floor `spine:beach-venture`; then `beach-venture:<handle>` mirrors and the `beach-venture` fold come into existence by use.
7. GRIT sentinel rewrite per §9.1, PR'd for David's ratification.

## 11. What this supersedes

- The beach `grit` v0.1 placeholder as a source of design truth (it seeded the claude-ai plan; its generic content is honoured by absorption into the sentinel).
- The claude-ai venture plan's items 1–2 (GRIT-not-nomad: affirmed; pool-per-node: **rejected** in favour of one address-scoped pool per §4).
- "tree = the social aggregate" terminology (that layer is the fold).
