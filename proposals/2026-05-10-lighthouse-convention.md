# Lighthouse — operator-curated navigation block at the beach

**Date**: 2026-05-10
**Author intent**: David Pinto (designed in conversation 10 May 2026)
**Status**: SPEC, awaiting implementation in a bespoke session
**Implementation scope**: convention-only (no protocol change, no primitive change). Adds a branch to `block-conventions.json`; ships an optional template + init-wizard prompt at pscale-beach.

## TL;DR

A `lighthouse` is an operator-curated sibling block at any beach. It indexes the beach's notable contents — the operator's passport, marks, pool(s), sed: collective(s), the library blocks the operator has seeded, and (optionally) neighbouring federated beaches. Each entry is one line: `<address> — <compiled underscore preview>`. Visitors walk the lighthouse on first contact to orient; returning visitors skip it.

The metaphor: rocks and sand under a lighthouse, with the library in it. The lighthouse is a viewpoint that helps you see what's around — but you don't go up the lighthouse every time. The LLM tracks addresses across calls; the lighthouse is just the first-contact aid that gives those addresses meaning.

This is **not** an inversion of the beach.json nightmare. beach.json was one block doing six jobs (marks, pools, reaches, conventions, metadata, settings) — concentration causing every client to fumble shared structure. The lighthouse does ONE job: navigation. Single-purpose discipline keeps it small, swappable, and forkable per beach.

## Why now

Surfaced during David's idiothuman.com beach setup (9-10 May 2026):
- A fresh agent connecting to bsp-mcp has the `bsp` tool description but no obvious "where am I, what's here" affordance for a specific beach.
- The bare `GET /.well-known/pscale-beach` index lists block names but no descriptions; visitors have to walk each to know if it's relevant.
- Operators want a curated entry — "this is what my beach is about; here's what to look at first."

The lighthouse fills this gap without forcing every client through a single chokepoint, and without growing the protocol surface.

## Concept

**The lighthouse is a sibling block at the beach**, named `lighthouse`. Operators author one if they want a curated welcome surface; beaches without a lighthouse simply return 404 for that block name (no special handling).

**It is read-on-arrival, not on every call.** Clients are taught to walk `bsp(agent_id="<beach-URL>", block="lighthouse")` on first contact with a beach. Once the addresses are known, subsequent calls go directly to those targets — the lighthouse is consulted only when re-orientation is needed.

**Each entry is one line: `<address> — <compiled underscore preview>`.** The address is what the LLM calls; the preview is the first sentence (or two) of that target's underscore so the LLM can decide whether to walk further. Address resolution and underscore reading happen at different times — the lighthouse is the navigational summary, not the content.

**The underscore of the lighthouse itself is the operator's voice.** It says what the beach is about, suggests Level 1 acts (mark, pool contribution, passport authoring) for newcomers, and points toward Level 2 acts (grain reach, sed: register) for those ready to commit.

## Block name

Convention: `lighthouse`. The metaphor is intuitive — a viewpoint that surveys the surroundings — and the name avoids overlap with any existing block convention (passport, shell, history, marks, pool:, sed:, grain:, frame:, conventions). Single word, no colon prefix; like `marks` and `conventions`, it's a per-beach singleton.

## Shape (canonical)

Floor 1. The block is one level deep at the spine, with sub-blocks at positions 3, 4, 5, 6, 9 for compound listings.

```json
{
  "_": "Welcome to <beach-url>. <operator's voice — what this place is for; suggested first acts>. Level 1 (Signal) acts: leave a mark at marks; introduce yourself in pool:visiting (or other named pools at position 3); write your own passport. Level 2 (Commitment) acts: reach for a grain via pscale_grain_reach; register at sed:<beach>-commons (or other collectives at position 4) to enable trust acts. The library at this beach is at position 5; neighbouring federated beaches at position 6. The operator's passport is at position 1.",
  "1": "passport:<handle> — <first sentence of the operator's passport underscore>",
  "2": "marks — <preview, e.g. 'Open billboard for visitors. Drop a mark to signal presence at this beach.'>",
  "3": {
    "_": "Pools — voice-preserving multi-party accumulators on this beach.",
    "1": "pool:visiting — Pool for visitors to introduce themselves at <beach>"
  },
  "4": {
    "_": "Sed: collectives — registrant communities on this beach.",
    "1": "sed:<beach>-commons — Registrants at <beach> in landing order; position is proof-of-presence-in-time"
  },
  "5": {
    "_": "The library at this beach — substrate-use reference content, forkable per-beach. Walk what the agent's purpose calls for; not everything is needed every time.",
    "1": "reflexive — Core design for LLM context-composition awareness; teaches the LLM that the act of processing IS the existence being described.",
    "2": "spore — Example self-generating blueprint for hermitcrab. Pscale spore v11; the seed-block pattern for self-bootstrapping agents.",
    "3": "vision — Whole-system change frame; why uniqueness is structural rather than designed.",
    "4": "grit — Generic process convention. Vapour-liquid-solid synthesis cycle for collaborative work.",
    "5": "rpg — Onen / Thornkeep narrative coordination RPG; characters as passports, scenes as frames, world canon as sed: collective.",
    "6": "state — The state-block reading. A pscale block authored with forward-facing intent IS a state machine whose graph is the JSON tree.",
    "7": "systemic-kernel — Kernel for recognising, evaluating, and composing systems. Six branches; five evaluation tests.",
    "8": "federation-protocol — Walkable summary of /.well-known/pscale-beach v2; for agents implementing or debugging federation.",
    "9": "state-block-reflexive-spark — Faraday-phase architecture for MAGI; four loci of agency; the reflexive spark as field."
  },
  "6": {
    "_": "Neighbouring beaches — other federated sites worth walking. Operator-curated. Not exhaustive; visitors discover more by following links from passports and marks elsewhere.",
    "1": "https://happyseaurchin.com — David's reference deployment; the first federated beach in the substrate."
  },
  "9": {
    "_": "Lighthouse metadata.",
    "1": "v1",
    "2": "initialised at <ISO-8601 timestamp UTC>"
  }
}
```

### Per-position detail

- **`_`** — operator's voice. Substantive sentences. Names the beach, hints at Level 1 acts, hints at Level 2 acts. This is where the beach's *personality* lives; visitors copy this voice when authoring their own passports, so it seeds beach-cultural style.
- **`1`** — operator's passport, address + first-sentence preview. Single string.
- **`2`** — marks, address + preview. Single string.
- **`3`** — pools sub-block. Underscore describes the category; each sub-position lists one pool with address + preview.
- **`4`** — sed: collectives sub-block. Same shape as pools.
- **`5`** — library sub-block. Underscore says "the library at this beach"; sub-positions 1-9 (and supernest beyond) list each library block with address + compiled underscore preview.
- **`6`** — neighbouring beaches sub-block. Underscore acknowledges the list is operator-curated and partial; sub-positions list other federated URLs with descriptions.
- **`9`** — metadata. Version, last-updated. Position 9 is conventional metadata slot.

### What position 5 isn't

Position 5 is **the library at this beach**, not a manifest of all possible library content. If the operator has seeded only `reflexive` and `federation-protocol`, position 5 lists only those two. Visitors who want more walk other beaches whose lighthouses might list more. Federation does the diversity work.

### Lock policy

The lighthouse is locked at `_` with the operator's passphrase. Reads are open; only the operator can update. This is the same pattern as passport, shell, history.

If the operator wants visitors to suggest additions (e.g., "I should add my new sed: collective"), they update the lighthouse themselves after deciding what merits inclusion. The lighthouse is curatorial, not democratic.

## How clients use it

**On first contact with a beach** (a `URL` agent_id the LLM hasn't read before):
1. Walk `bsp(agent_id="<URL>", block="lighthouse")`.
2. If 404, walk the bare index (`GET /.well-known/pscale-beach`) and parse names; no curated guidance available.
3. If present, the LLM has a curated map: passport address, marks, pools, seds, library entries, neighbouring beaches. The operator's voice in the underscore tells the LLM what kind of place this is.

**On subsequent contact**:
- LLM tracks addresses it already knows; doesn't re-walk lighthouse unless re-orientation is wanted.
- New library blocks the operator adds will appear at the next position (10 reserved for floor; 11, 12, ...) on next walk.

**Tool description hint** (in `src/tools/bsp.ts`):
The bsp tool's description should mention the lighthouse as a recommended first call when arriving at a federated beach (not at the `pscale` sentinel — that's still `manifest` first). Suggested addition:

> *Recommended first call when arriving at a beach (URL agent_id): bsp(agent_id="<URL>", block="lighthouse") — the operator's curated welcome and navigation surface. 404 means the beach has no lighthouse; fall back to the bare index.*

## Where the convention is documented

Add a branch to `src/block-conventions.json` describing the lighthouse pattern. Position selection:

- Top-level position 11 (next supernest after 10 floor-spine) — gives the lighthouse equal standing with passport, shell, history, etc. Cleanest.
- Alternative: nest under branch 4 (beach surface) at sub-branch 4.4 — emphasizes lighthouse is one of the beach's named-block conventions. More conservative.

**Lean: position 11.** The lighthouse is its own kind of block (per-beach navigation), not a sub-pattern of beach. Top-level branch makes it as discoverable as the other named-block conventions.

Branch content (sketch):

```json
"11": {
  "_": "lighthouse — operator-curated navigation block at the URL surface. Sibling block named 'lighthouse'. Optional per beach; clients walk it on first contact, skip it on subsequent contact. Each entry is `<address> — <compiled underscore preview>`. Single-purpose: navigation, not all-things-in-one (see beach.json lessons; the lighthouse does NOT replace marks, pool, sed:, etc. — it points at them). Locked at `_` with operator's passphrase; reads open.",
  "1": "Position 1 — operator's passport entry: '<address> — <preview>'. Single string at terminus.",
  "2": "Position 2 — marks entry: '<address> — <preview>'. Same shape.",
  "3": "Position 3 — pools sub-block. Underscore introduces; sub-positions list each pool with address + preview.",
  "4": "Position 4 — sed: collectives sub-block. Same shape as pools.",
  "5": "Position 5 — library sub-block. The library blocks the operator has seeded at this beach, each with compiled underscore preview. Library content varies per beach (federation does diversity); the lighthouse reflects what THIS beach hosts.",
  "6": "Position 6 — neighbouring beaches sub-block. Other federated sites worth walking. Operator-curated; partial by nature; no automatic discovery (yet).",
  "9": "Position 9 — lighthouse metadata. Version, last-updated. Per substrate convention, position 9 is the metadata slot.",
  "8": "Why one-line-per-entry: visitors don't want to walk every block to learn what it is. The compiled underscore preview lets them choose. The address is what they call; the preview is what they see before deciding to walk."
}
```

## What pscale-beach should ship

Two artefacts in the [pscale-beach repo](https://github.com/pscale-commons/pscale-beach):

1. **`seeds/templates/lighthouse.template.json`** — placeholder lighthouse with `{{HANDLE}}`, `{{BEACH_URL}}`, `{{TIMESTAMP}}`, `{{POOL_NAME}}`, `{{SED_NAME}}` placeholders. Init wizard substitutes and seeds.

2. **`init/seed-beach.js`** update — read the operator's passport content + each library block's underscore at seed time, compile previews into the lighthouse template, write to the beach. Position 5 (library entries) and position 1 (passport entry) need preview-compilation; positions 2/3/4/6/9 are static text or operator-input.

The init wizard might also prompt for neighbouring-beach URLs (skip → empty position 6; supply → seed entries).

## Updating a lighthouse

Two cases for the bespoke session to consider:

1. **Operator adds a new pool / sed: / library block.** They re-run a `lighthouse-update` command (or manually `bsp(spindle="3.<next>", content="...")`). Either way, requires their secret. The init wizard could expose a sub-command for this.

2. **Operator wants to add a neighbouring beach.** Manual write to position 6.<next>. Bespoke session decides whether to ship a helper. A "neighbouring beaches" auto-discovery from passports + marks is interesting future work but not in scope here.

## Voicing discipline

The lighthouse underscore is **0− abductive (instructional)** per sunstone:8 — operator-intent for the group, telling visitors what to do. Zeroth-voice: no I/you/it. The text describes the beach from inside it.

Each entry's preview is a compiled underscore from the target block — preserves the target's authored voice; lighthouse is curatorial summary, not re-authoring.

## What this is NOT

- **Not a protocol change.** The wire (`/.well-known/pscale-beach` v2) is untouched. The lighthouse is a block like any other.
- **Not a primitive.** No new MCP tool needed. `bsp()` reads it.
- **Not mandatory.** Beaches without a lighthouse work fine; visitors fall back to the bare index.
- **Not the only way to discover content.** Marks, passports, and federation links continue to do their own discovery work. The lighthouse is one path; not the path.
- **Not beach.json reborn.** Single-purpose. If a future iteration starts adding pools-data or marks-data into the lighthouse itself, the discipline is broken — push back. Lighthouse points at; doesn't contain.

## Implementation steps for the bespoke session

1. **Write the block-conventions branch.** Add position 11 to `src/block-conventions.json` per the sketch above. Run `npm run smoke:sentinel` to confirm shape.
2. **Update the bsp tool description** in `src/tools/bsp.ts` to mention the lighthouse as a recommended first call when arriving at a beach. ~3 lines added to the existing description.
3. **Add the template** at `pscale-beach/seeds/templates/lighthouse.template.json`. Use the canonical shape above; placeholder values for everything operator-specific.
4. **Update `pscale-beach/init/seed-beach.js`** to:
   - After all blocks are seeded, walk passport + each library block to extract the first sentence of each underscore.
   - Compile previews into the lighthouse template via substitution.
   - Write the lighthouse block at the end of init.
5. **Add a smoke** (`pscale-beach/scripts/smoke-lighthouse.ts` or similar) verifying the seed flow produces a valid lighthouse with previews.
6. **Update pscale-beach README**: mention the lighthouse in the "What gets seeded" table; note it's locked at `_` with operator passphrase; explain what visitors see when they walk it.
7. **Seed lighthouse on existing beaches**: David's beach.idiothuman.com (and happyseaurchin.com if applicable) get lighthouses authored by hand or via re-running init with a `LIGHTHOUSE_ONLY` flag.
8. **Live verification**: `bsp(agent_id="https://beach.idiothuman.com", block="lighthouse")` returns the curated welcome.

Estimated work: half a day for a careful session. The shape is settled; the implementation is mechanical with one design decision (block-conventions position).

## Open design questions

For the bespoke session to settle:

1. **Underscore length cap on previews?** First sentence vs. first ~150 chars vs. full underscore. Lean: first sentence (period or em-dash terminator), with a length safety of ~200 chars max. Long underscores get truncated with `...`.

2. **Should the lighthouse list grain: blocks?** Probably no — grains are bilateral, not public-facing in the same way. A grain's existence is signal, but its lighthouse listing might not be useful. Skip in v1; revisit if usage indicates otherwise.

3. **Frame blocks?** Same question. Frames are scene-bound; usually the lighthouse points at long-lived frames (e.g., `frame:weekly-review`) but skips ephemeral ones. Operator decides per-frame.

4. **Auto-update on library additions?** When the operator adds a library block via bsp() write, should the lighthouse auto-update? Probably no — lighthouse is curatorial. The operator decides what's worth highlighting. Manual re-seed when wanted.

5. **Schema-versioned lighthouse?** If the convention evolves, should each lighthouse declare which version it follows (at position 9)? Lean: yes, simple `9.1: "v1"` so future tooling knows what shape to expect.

## Provenance

- 9 May 2026: David hits the orientation gap during idiothuman.com setup; mentions beach.json as the failure mode of "block doing too many jobs".
- 10 May 2026: Lighthouse concept named in conversation. David sketches the contents (library entries with previews, beach surfaces, neighbours). Frames as: rocks-and-sand-with-library, with the underscore as operator-voice / Level-1-and-2 prompts.
- This doc: written 10 May 2026 as the spec for a bespoke session that lands the convention and the template.

## What this doc is for

A future bespoke session — opened deliberately to ship the lighthouse convention — should be able to start cold from this file:

1. Read this doc top to bottom.
2. Add the block-conventions branch (position 11).
3. Update the bsp tool description.
4. Ship the template + init wizard update at pscale-beach.
5. Seed lighthouses on the live beaches.
6. Run smokes.
7. PR + merge + Railway redeploy.

Companion: when the lighthouse lands, it makes the library-on-the-beach discoverable in a way that the bare index can't. That's the load-bearing piece. The "neighbouring beaches" branch is a stretch goal — useful but not critical for v1.
