# Xstream Tier-2 redesign: SHELL/POOL split, CADO as projected lenses, one loop

- **Date**: 2026-07-19 (hermitcrab.8)
- **Status**: PROPOSED — the buildable distillation of the design conversation; David approved the direction
- **Touches**: xstream-bsp (Column, ViewerDrawer, ConstructionButton face panels, use-shell-life, a new `cado.ts`)
- **Companion**: [2026-07-18-metamorphosis-autonomous-wake.md](2026-07-18-metamorphosis-autonomous-wake.md) — the metamorphosis clock is a SHELL-Designer panel here, funded by that proposal's build

## The model (one loop, four lenses, structure-typed focuses)

- **One loop** underneath everything: **SEE** (focus renders in solid) → **NAVIGATE** (soft-LLM, or chips as fallback, pull the asked content into solid) → **EDIT** (tap a solid item → it copies into the prompt/liquid; revise as your intent) → **COMMIT** (writes it back; lock arbitrates). This is the existing V-L-S canvas; the redesign doesn't add a mechanism, it disentangles the focuses and adds the lens.
- **The face frames the soft-LLM.** Dialing CADO sets three things over whatever's in focus: (1) which bundle of blocks the face's soft-LLM works over, (2) whether editing is offered (lock-gated), (3) how it renders (plain → technical). The player asks in the CADO voice; the face-LLM navigates and prepares edits into liquid. **Chips are the explicit fallback** for pointing instead of asking.
- **Structure types the focus — no LLM classification.** A focus's *name + shape* (+ `block-conventions`) declare what it is, which faces it offers, and each face's default scope. The LLM is spared the typing; it does only meaning.

## Face definitions (David's final)

- **C — Character (casual):** say things and get navigated to the people/things you want; the VLS is a *location* to engage co-present players. The bsp-mcp Character voice — the beach stays invisible.
- **A — Author:** navigate and edit pscale blocks/content around a focus; the face-LLM offers block options to click, walk, and edit.
- **D — Designer:** the system's *behaviour* blocks — conventions, directives, machinery, the clock; how things behave.
- **O — Observer:** track others and choose *output channels* — render out for those not here.

## The two focuses of an agent (the split)

A genus-one agent presents as **two distinct focuses**, never one conflated column:

- **SHELL — the handler's cockpit.** A window into the agent *itself*.
  - **O** *(public)*: watch its processing — history / surface / trace / live-acts, vitals (awake/asleep/lending). No chat box.
  - **C** *(handler)*: direct it — `task:<handle>` (sealed, your private line).
  - **A** *(handler)*: edit its content — `vision` / `purpose` / `surface`. Puppet-cued ("you shape it directly; it reasons only on a wake").
  - **D** *(handler)*: edit its machinery — `reflexive` / `cadence` / the **metamorphosis clock** + `task`. Puppet-cued.
- **POOL — the public room** at its coordinate (a separate focus; see face-scoped rooms). The room stops living *inside* the shell column.

## Face-scoped rooms (projection over one pool — not 4× blocks)

The face is an **access modifier** (`whetstone` branch 3), and pool entries are already face-tagged (field 4). So a face-scoped room is **one pool read through a face — a projection, not a copy.**

- **C / A / D are peer-layers**: dialing a face shows only that face's liquid (who's here, same-face) and solid (their conversation). Authors engage authors, in the same block, because the face is a transversal cut.
- **O is the union / outward view** (sees all, rendered simply).
- The *action* is always submit→commit for all faces; the face changes **what's visible in solid** (C: the conversation · A: the spool-as-blocks · D: the directive · O: the union + output channels).
- Client-side filter today (v0.1, field-4); beach-enforced later (v0.2, the face modifier). Modest change; the CADO design working as intended.

## The universal interaction (any focus)

**The view-drawer picks the focus → the structure declares which faces it offers (others hidden) → CADO picks the lens → the face-LLM populates the panel via `bundleFor(focus, face)` and speaks the meaning → V-L-S is the loop.** Edit-rights are the lock: the UI offers the edit; the beach arbitrates (403 if you lack the key), or a free pre-check (does my column hold this block's secret?).

## O = outward (not "read the index")

The Observer panel shows **output channels**, not the crammed beach index: leave a **mark**, publish to **`/at/<handle>`** (the public noticeboard onto `pool:<handle>`), or the **render / venture** public page. "Render out for those not here."

## The `bundleFor(focus, face)` seam — and the v2 it enables

Every panel gets its contents from **one function, `bundleFor(focus, face)`**, returning the convention-default bundle of block-addresses today. This is the single seam that keeps the v2 open with **no rework**:

> **v2 — a reflexive current for the player.** A pscale block records, per (focus, face), the bundle of addresses the soft-LLM assembled — *exactly* `reflexive:9` (a remembered bundle re-dialed as it goes), pointed at the human. The convention default becomes the **seed**; the soft-LLM **curates**; the block **remembers**; `bundleFor` returns the remembered bundle when present. The player navigates on the same organ a genus-one agent does — user = agent = character, now navigating identically. Deferred; the seam is all that's required now.

## Already landed (this arc)

- Phantom `pool:egg-one:egg-one` swept (David); egg-one notified (weft, `pool:egg-one:32`).
- Viewer room-list validates through the room-parser — [xstream-bsp#136](https://github.com/happyseaurchin/xstream-bsp/pull/136).
- Re-key persistence + fold-salvage — [xstream-bsp#135](https://github.com/happyseaurchin/xstream-bsp/pull/135) (Tier-1).

## Staged implementation

1. **Foundation (pure, testable):** `src/kernel/cado.ts` — `focusType(name, node?)`, `facesFor(type)`, `bundleFor(type, face, handle)` (the seam) + `smoke:cado`. No UI change. *← this proposal ships Stage 1.*
2. **Face-projected pools:** filter pool/liquid render by field-4 face; O = union. (use-shell-life / pool render.)
3. **The split:** separate the SHELL cockpit view (O/C=task/A/D) from the POOL room; remove the room from inside the shell column; `focusType` drives the mode instead of the single `isShell` flag.
4. **CADO panels:** the construction-button face panels populated by `bundleFor` + the face-LLM (chips → solid; tap → prompt/liquid; commit; lock-gated). Retire the empty explainer panels.
5. **Metamorphosis clock:** SHELL-Designer panel — gated on the vault/scheduler build (companion proposal).

## Open questions

1. Face-projection default: are C/A/D fully siloed peer-layers, or does D see D+C (a nesting)? (Proposed: fully siloed; O is the only union.)
2. `bundleFor` for `generic`/unknown blocks: O (read) + A (walk positions) only, or also a "read simply" C?
3. Where the metamorphosis clock reads/writes its config — a `clock:<handle>` block (new) vs extending `cadence:<handle>` (the existing vestige).
