# Multi-party engagement on bsp-mcp + federated beach — substrate framing

**Date:** 2026-05-18
**Status:** framing doc, pre-convention. Supersedes the conflated work in PR #47.
**Scope:** the substrate side only — what convention (if any) is needed beyond the substrate-as-it-stands to enable multi-party engagement, with fantasy RPG (NOMAD) as the worked stress-test.

## What this document is and isn't

**Is:** a framing for the architecture work. Surveys what the substrate already enables, identifies the minimal addition needed, and points at how NOMAD and xstream-play patterns can validate the design without dictating it.

**Isn't:** the convention spec itself. Isn't the NOMAD game-system spec. Isn't world content. Each of those is a separate downstream artefact, scoped here but authored elsewhere.

## The three-layer separation (recap)

```
Layer 3 — World content        e.g. Thornkeep, Middle-Earth, real-world meetup
                                ↓ authored as blocks at a beach
Layer 2 — Game system          e.g. NOMAD, D&D, FATE, or NONE (real-world mode)
                                ↓ lives in a separate repo (e.g. nomad-bsp)
Layer 1 — Substrate convention this document's scope — bsp-mcp + federated beach
                                ↓ bsp() + 5 primitives + block conventions
Layer 0 — Substrate primitives the bsp-mcp surface (already stable)
```

The substrate enables engagement. Real-world engagement uses it directly — users ARE characters, interactions ARE outcomes, no arbitration needed. Fantasy RPG adds a game-system layer (NOMAD) on top for perception framing, outcome arbitration, consistency tracking — what reality normally provides for free.

**Layer 1 is the only layer this document scopes.**

## What the substrate already enables (no additions)

Walked through with a real-world scenario in mind. The L4 stack today:

| Substrate primitive | Engagement use |
|---|---|
| `marks` block | open stigmergy — drop a thought at a beach, anyone reading sees it |
| `presence` block (branch 4.6) | live "I am here at this address" heartbeat |
| `passport:<handle>` | identity card, what you offer / need |
| `pool:<name>` (branch 4.2) | voice-preserving multi-author accumulator |
| `liquid` block (branch 4.5) | per-author overwriting staging before commit |
| `frame:<scene>` (branch 5) | per-entity V-L-S lanes (the current convention; needs amendment) |
| `sed:<collective>` (branch 7) | registered membership for gated participation |
| `grain:<pair_id>` (branch 6) | bilateral private memory |
| Dimensional intersection §5.7 | face × beach × address × frame — substrate-level filter for V-L-S visibility |
| Star-refs (`*:beach:block`) | cross-block, cross-beach composition |
| Federation | multi-beach by default; no central registry |

**Verdict:** real-world multi-party engagement is L4-capable today. Two users meeting at a beach, exchanging presence, writing to a shared pool, getting synthesis from a GRIT-style daemon — all of this works without further substrate additions.

## What's missing for fantasy RPG specifically — the deltas

Five candidate gaps, four of which resolve above the substrate:

1. **Character continuity separate from user identity** → no new substrate. Discipline: a character is its own agent identity (its own passport/shell/history) controlled by a player. Players register in `sed:<game>-players`; characters in `sed:<game>-characters`. Each player can own multiple characters; each character has its own substrate identity.

2. **Spatial position with semantic meaning** → **the one substrate addition this document recommends.** Pscale already has position-as-spatial geometry; what's missing is the convention for using it. See "spatial coordinate block" below.

3. **Perception framing** (character sees only what's near, knows only what they've experienced) → no new substrate. Face × tier modifiers on `bsp()` already handle "what aperture this read uses". The per-character "what I know" lives in a separate identity-side block (the "witnessed" pattern from `pscale-mcp-server/docs/exploration-witnessed-block.md`) — substrate-trivial (just a block). The discipline of "soft-LLM reads only character's perception scope" is prompt convention, not substrate enforcement.

4. **Outcome arbitration** (dice + stats when real-world doesn't decide) → entirely game-system layer. NOMAD's CF/SF/dice/outcome math lives in the game-system repo.

5. **Consistency tracking** (NPCs remember, places persist) → just blocks. No new substrate.

**Net substrate addition: ONE convention — the spatial coordinate block.**

## The proposed addition — spatial coordinate block

Reference artefact: the user's working file `/Users/davidpinto/Desktop/spatial-thornkeep-star.json`. The shape this document describes is reverse-engineered from that artefact, cross-referenced with xstream-play's `blocks/xstream/spatial-thornkeep.json` and `BLOCK-GUIDE.md`.

### Core shape

A single pscale block. Positions encode a hierarchy of sub-regions. Each region's `_` may be opened as a **hidden directory** holding metadata. Concretely:

```json
{
  "_": "<region description>",
  "1": {
    "_": "<sub-region description>",
    "1": { ... further nesting ... },
    "2": "<feature at sub-position 2 — leaf>",
    ...
  },
  ...
}
```

When a region needs to carry **knowledge gates** (what's known here), **temporal references** (events that happened here), or **rules** (what's permitted here), its `_` opens as a hidden directory:

```json
"_": {
  "_": "<the region's own description>",
  "1": { "_": "What is known about this place.", "1": "...", "2": "...", ... },
  "2": "events-<position-id>",
  "3": "rules-<region-name>"
}
```

The pattern `_._` for description + `_.1` for knowledge + `_.2` for events-ref + `_.3` for rules-ref is the operational convention from the user's reference artefact. Each downstream block (`events-...`, `rules-...`) is a sibling block at the same beach, star-ref'd by name.

### Why this shape works

- **One walker, two readings.** An LLM walking the spatial block sees semantic structure (the underscores tell what each region is) AND spatial structure (the positions tell where it is relative to siblings). Same walk, two senses.
- **Supernesting at every root, not within.** Each spatial level is its own root (within the same block) — but when a region grows beyond 9 sub-positions, the sub-region becomes its own block (e.g. `place:rivendell`), star-ref'd from the parent. Composition handles growth; supernest never breaks because growth happens at a fresh root.
- **Federation native.** Different regions can live at different beaches. A `world:<name>` block at one beach star-refs `place:<region>` blocks at other beaches. The Middle-Earth / GitHub-for-games picture follows directly.
- **Proximity is geometric.** Two characters at sibling positions in the same parent region are "in the same area". Two characters at distant positions are "far". No separate proximity graph required (NOMAD's narrative-graph approach is what you do when your store has no geometry; pscale has geometry).

### What goes ALONGSIDE (not in) the spatial block

- `events-<position-id>` — temporal record of events that happened at a spatial position. Append-only; own root, supernests cleanly.
- `rules-<region>` — designer-authored constraints applicable in a region.
- `witnessed:<character>` (or per-character knowledge sub-block) — per-character record of what events the character experienced or was told about. The I-primitive from `exploration-witnessed-block.md`. Enables structural information-hiding by construction.
- `frame:<scene>` — per-round V-L-S entity lanes (per the existing frame convention, **amended** to drop the failed in-block supernest of history and canon — see "Convention amendments needed" below).

These are existing or near-existing conventions. The spatial coordinate block is the new piece that makes them compose into a navigable space.

### Convention amendments needed

Two small amendments to `block-conventions`:

1. **Branch 5 (frame) amendment** — drop the position-3 history and position-9 canon claims (they assume supernesting at non-root depth, which doesn't work). History moves to `history:<scene>` sibling; canon moves to `canon:<scene>` sibling. Frame keeps only entity lanes. (Same fix from PR #47, but cleanly scoped here.)

2. **New convention** for the spatial coordinate block. Per your direction earlier — NOT as branch 10, but folded into branch 8.9 (by-use-case index) or as an addition to branch 4 (URL surface — what kinds of named blocks live at a beach). I lean 8.9 because it's a use-case (spatial coordination), not a beach-surface kind.

## The LLM-tier discipline (reference, not substrate-enforced)

From xstream-play's design intent. The substrate doesn't enforce; the protocol convention specifies. Three tiers:

| Tier | What it does | Reads | Writes | Frequency |
|---|---|---|---|---|
| **Soft** | character perception — what the character thinks, intends, perceives | character's knowledge block + cached frame + immediate spatial context | vapour (ephemeral); writes proposed liquid | per keypress |
| **Medium** | synthesis of multiple players' liquid into solid narrative | committed liquid + frame + nearby committed + established canon | solid + events + per-character knowledge updates | on commit / round close |
| **Hard** | world consistency — frame update, position state, available actions | spatial + temporal + rules + character positions | frame (cached) | rarely (on entry, location change, after significant events) |

**Frame caching is critical** — hard runs rarely; soft/medium use the cached frame. Most cycles are cheap (Haiku + Sonnet, not triple-Sonnet).

Each tier is itself a pscale block (`soft-agent.json`, `medium-agent.json`, `hard-agent.json` — see xstream-play `blocks/xstream/`). Block-as-prompt: no TypeScript prompt strings; the LLM instructions live in substrate.

**For the substrate convention work, this tier discipline is documentation, not requirement.** A client that doesn't honour soft/medium/hard separation can still play through bsp-mcp — it just loses information-hiding. The substrate provides the SHAPE; the discipline provides the QUALITY.

## What gets built where

| Concern | Lives in | Authored by |
|---|---|---|
| Spatial coordinate block convention | `bsp-mcp-server/src/block-conventions.json` (amendment) | this PR + follow-up |
| Frame convention amendment | same | same |
| `events:<id>`, `rules:<region>`, `witnessed:<char>` conventions | optional small additions or just documented patterns | follow-up if needed; may not require convention |
| NOMAD game system (soft/medium/hard agent blocks, dice simulator, evaluator, daemon code) | **NEW REPO** — `nomad-bsp` or similar | next major work item, separate scope |
| World content (Thornkeep places, characters, events) | blocks at `beach.happyseaurchin.com` (or any beach) | player-authored; sequestered from onen-play or fresh |

**None of this requires xstream.** The RPG is playable through any MCP client (Claude.app, claude-app, mcp-remote, custom SDK) that speaks `bsp()`.

xstream provides reflexive presentation when ready: live vapour streaming, face-aware V-L-S surfaces, presence visualisation, the dimensional intersection rendered as a canvas rather than a sequence of tool calls. Optional quality layer; not infrastructure.

## Validation paths

To verify the substrate convention is sufficient (not blueprint-copying):

1. **Walk NOMAD's 7-step flow** through the proposed convention. For each step (intention → evaluation → skill determination → dice → interpretation → consequences → narrative), confirm the substrate primitives required are present. The substrate primitives NOMAD needs (from the earlier audit): per-character mutable stats, health, generation metadata, evaluation record, consequence record, proximity (geometric in this design), subscription state, action window, character logs, broadcast. Each maps to existing block conventions plus the spatial coordinate block.

2. **Walk xstream-play's medium-LLM coordination model** through the proposed convention. The B-loop convergence (mediums see each other's provisionals, revise to resolve) is two passes of `bsp()` reads against pool/frame; no substrate addition needed. The domino trigger (character B notified when A's action affects them) is a substrate-read by B against the per-character `witnessed` block; no new primitive.

3. **Walk a real-world engagement** (no NOMAD layer) through the proposed convention. Two users meet at the beach, register presence, exchange messages, optionally form a grain. Spatial coordinate block is unused; existing L4 stack covers it. Confirms the addition is *opt-in* for fantasy mode and doesn't burden real-world use.

If all three walks land cleanly, the convention is sufficient. If any step exposes a gap, we have evidence of a real missing primitive — and we add it deliberately, not speculatively.

## Open questions for your sign-off

1. **Close PR #47?** This document supersedes it. The bundle pattern + frame amendment land cleanly here; the fantasy content (Cyrus, Thornwood, lore: / world: / canon: catalogue) drops away as out-of-scope for substrate.

2. **Where does the spatial coordinate block convention live in `block-conventions`?** Your earlier direction: NOT branch 10. Fold into branch 8.9 by-use-case, or extend branch 4 (URL surface) with a new sub-position naming the convention? My lean: 8.9, because it's a use-case discipline.

3. **Is the `_` hidden-directory pattern (`_._` description + `_.1` knowledge + `_.2` events-ref + `_.3` rules-ref) authoritative as the operational convention?** The user's reference artefact uses it at the room level only; higher levels carry just a string `_`. Is the discipline: hidden directory at every level, or only at leaves where knowledge/events/rules attach?

4. **`events-XXX` and `rules-XXX` naming** — the reference artefact uses `events-111` (presumably the events block at position 111 of some master events block? or a separate block named `events-111`?). Clarify the addressing scheme so the convention can reference it.

5. **Spawn the NOMAD-on-bsp repo when?** Worth a fresh GitHub repo with its own CLAUDE.md, its own README, its own scope. Sequester relevant onen-play NOMAD docs (filter by what's substrate-agnostic). Could be a follow-up session.

6. **First worked example for the convention spec** — when we write the convention spec (after this framing lands), do we use the spatial-thornkeep example as the worked content, or a structural example (anonymous "Room A" and "Room B")? The structural example is purer; the thornkeep example is more recognisable.

## References, classified

**Foundation (substrate truth):**
- bsp-mcp sentinels: `sunstone`, `whetstone`, `block-conventions`, `evolution`
- `docs/protocol-xstream-frame.md` §5.7 (dimensional intersection)

**Reference (validation, not blueprint):**
- `xstream-play/docs/BLOCK-GUIDE.md` — S/T/I design intent, folding to hidden directories
- `xstream-play/docs/medium-llm-coordination-spec.md` — soft/medium/hard coordination
- `xstream-play/docs/onen-rpg-xstream-architecture.md` — overall architecture
- `xstream-play/blocks/xstream/` — block instances (spatial-thornkeep.json, soft-agent.json, medium-agent.json, hard-agent.json, character-*.json, rules-thornkeep.json)
- `pscale-mcp-server/docs/beach-game-handbook.md` — the de facto convention spec from proof-of-process
- `pscale-mcp-server/docs/exploration-witnessed-block.md` — the I-primitive design
- `pscale-mcp-server/docs/protocol-grit.md` — daemon contract
- `/Users/davidpinto/Desktop/spatial-thornkeep-star.json` — user's working operational example
- `onen-play/docs/` (NOMAD-Plex0-Implementation, core-gameplay-v9, nomad-stats-system, etc.) — game-system reference for the eventual nomad-bsp repo

**Avoided (carry baggage):**
- xstream-play implementation code (Supabase patterns)
- onen-play Lovable-generated code

**Supersedes:**
- PR #47 (rpg-bundle-pattern) — the layer-conflated previous attempt

## Recommended next step

After this framing is endorsed:

1. **Close PR #47.**
2. **Open the convention amendment PR** — small, focused: frame amendment + spatial coordinate block convention + (optional) events / rules / witnessed pattern documentation. ~150 lines.
3. **Spawn `nomad-bsp` repo** as the game-system layer. Sequester relevant onen-play docs. Author the soft/medium/hard agent blocks, dice simulator, evaluator, daemon code. Separate session(s).
4. **Author Thornkeep world content** at happyseaurchin (or wherever). Player-authored; reusable for NOMAD-on-bsp gameplay.

Each step has its own scope and its own session boundary.
