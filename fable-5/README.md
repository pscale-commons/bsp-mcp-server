# fable-5 — provisional working set

Created 2026-06-10 by the first Fable 5 instance on this project, at David's request: a deliberately **limited** set of notes to work from at the Fable 5 level of competence, distinct from the accumulated Opus-era documentation.

## Rule of this directory

- These are **working notes and provenance-marked copies**, not new canon. Every file states its canonical source if it has one. When a copy and its source diverge, the source wins; update or delete the copy.
- The set stays small. A file earns its place by being load-bearing for current work; anything else gets a pointer, not a copy.
- **Trajectory**: this directory is scaffolding. The destination is docs as pscale blocks on the beach — substrate-resident, walkable, addressable — not markdown in a git repo. As blocks take over, files here get retired with a pointer to the block that replaced them.

## Contents

| File | What it is |
|---|---|
| `observations-2026-06-10.md` | First Fable 5 appraisal: verified operationality, comparative analysis, risks, reflection. |
| `design-notes.md` | Living design notes for the Fable 5 era — the fetch-bridge insight, enforcement trajectory, RPG next moves, open questions. |
| `rpg-room-pool-model.md` | Provenance copy of `proposals/2026-06-05-in-loop-resolution.md` — the canonical room-pool RPG model. |

## Canonical sources (read these, not summaries of them)

- `src/sunstone.json` — the geometry, taught by the block itself. Read first, walk via `bsp(agent_id="pscale", block="sunstone")`.
- `src/whetstone.json` — operational mechanics (signature, shape derivation, modifiers, storage, translation, federation, floor alignment).
- `CLAUDE.md` — the design log for the next instance. The address-notation rule at the top is non-negotiable.
- `proposals/` — dated decision record. Most recent decisions supersede older docs; check banners.
- The live beach — `https://beach.happyseaurchin.com/.well-known/pscale-beach` — read the `lighthouse` block on arrival.
