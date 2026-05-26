# Spatial coordinate block convention + frame amendment

**Date:** 2026-05-18
**Status:** convention amendment, implements the framing landed in PR #48
**Affects:** `src/block-conventions.json` — new branch 4.7 (spatial coord block); branch 5 (frame) amended to drop broken supernest claims

## Why

Two coupled fixes:

1. **Frame's supernest claims silently fail.** The prior `block-conventions:5` claimed entity slots could supernest at `11..88` and synthesis history at `9.2..9.7` could "supernest beyond when these fill". Neither works — supernest only works at block *root*, not at non-root depth where the walker has no way to distinguish "supernest growth" from "deeper nesting". A frame with eight history entries hits a wall; a scene with nine participants too.

2. **No substrate convention for spatial coordination.** The pscale block's position structure is naturally spatial, but no convention names how to use it for multi-party engagement. The user's working artefact (`spatial-thornkeep-star.json`) demonstrates the pattern; this PR formalises it.

Both resolve via the bundle pattern: per-concern blocks at the same URL surface, composed via star-refs. Each block supernests at its own root because each block IS a root.

## What this PR changes

### Branch 5 (frame) amended

Removed the in-block supernest claims at 9.2..9.7 (synthesis history) and 11..88 (entity slots). Frame is now per-round entity lanes only; scene-level persistence moves to sibling blocks:

- `solid:<scene>` — canonical synthesis for the latest round, overwritten per round
- `history:<scene>` — accumulated prior canonical solids; supernests cleanly at its own root
- `canon:<scene>` — scene-specific skills star-refs, NPCs, rules, secrets

Entity sub-block at frame position N (1..9) keeps `<n>.1` liquid and `<n>.2` solid. Per-entity history is dropped (use `history:<scene>` sibling). Cap is nine entities per frame; larger scenes use multiple frame blocks or sub-scenes.

Branch 5._ underscore version bumped to v2 to reflect the amendment.

### Branch 4.7 added (spatial coordinate block)

A pscale block whose position structure encodes a hierarchical spatial map. Naming: `(agent_id='<URL>', block='spatial:<world-name>')` or unqualified when unambiguous.

Key features per the new branch:

- **4.71** — Position N is a sub-region (recursive nesting; leaf strings allowed for atomic features)
- **4.72** — Hidden directory at any level. `_` opens as `{_._ description, _.1 knowledge, _.2 events-ref, _.3 rules-ref}`. Optional at every level; uniform pattern at every depth
- **4.73** — Sibling bundle: `events:<region-name>`, `rules:<region-name>`, `witnessed:<character-handle>` (the I-primitive from `pscale-mcp-server/docs/exploration-witnessed-block.md`). All named, not position-derived
- **4.74** — Growth and federation. Large regions hive off as their own blocks at the same or different beach, star-ref'd from parent
- **4.75** — Floor depth chosen per-world to place "scene scale" at pscale 0. Address example: `672.34` in a floor-3 world walks Thornkeep → kitchen area → kitchen → hearth → embers
- **4.78** — Character location and proximity. Characters star-ref their position; proximity is geometric (sibling positions = same area). No proximity-graph primitive needed
- **4.79** — Block metadata: shape version, floor depth, world name

## Reference artefact

The user's working file `spatial-thornkeep-star.json` is the reverse-engineering target. It uses the hidden-directory pattern at room-level (`_._` description + `_.1` knowledge + `_.2` events-ref + `_.3` rules-ref). The convention generalises: the pattern applies at every spatial level uniformly, optional where no metadata attaches.

## Naming convention answered

Per session direction: **named, not position-derived.** Names stay stable across spatial restructure, federation-friendly, human-readable. The prior pscale-mcp Thornkeep used mixed naming (`rules-thornkeep` named, `events-111` position-derived) — this convention regularises to named throughout.

## What this PR does NOT do

- Does NOT specify the `events:<region>`, `rules:<region>`, `witnessed:<char>` block shapes in detail — referenced as patterns; details can land in a follow-up PR if/when needed
- Does NOT touch the `frame` convention's substrate primitive surface (no new `bsp()` parameters); pure convention amendment
- Does NOT create any `spatial:` blocks at any beach; that's downstream (NOMAD-on-bsp repo + happyseaurchin world content)
- Does NOT add a "games" or "RPG" major branch to block-conventions — the spatial coord block is a named-block-at-a-beach kind, sibling to pool/frame/liquid/presence/lighthouse, so it lives at 4.7 alongside them

## What downstream work this enables

- **`nomad-bsp` repo** (next step) — game system as separate repo, seeded onto beach
- **Thornkeep world content** at happyseaurchin (or any beach) — authored as spatial coord blocks + events + rules + witnessed
- **Synthesis daemon** (probably on the user's Mac mini per "always-on hard crab" pattern) — reads frame + pool + character locations, writes solid + history

## References

- `proposals/2026-05-18-engagement-framing.md` (PR #48, merged) — the framing this PR implements
- `/Users/davidpinto/Desktop/spatial-thornkeep-star.json` — operational reverse-engineering target
- `xstream-play/blocks/xstream/spatial-thornkeep.json` — earlier instance of same pattern
- `xstream-play/docs/BLOCK-GUIDE.md` — S/T/I three-block original design and folding rationale
- `pscale-mcp-server/docs/exploration-witnessed-block.md` — the I-primitive (witnessed block) referenced by 4.73
- `pscale-mcp-server/docs/protocol-grit.md` — daemon contract (synthesis daemon pattern that reads frame/pool, writes solid/history)
