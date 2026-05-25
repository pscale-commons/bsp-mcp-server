# RPG bundle pattern — design walk

**Date:** 2026-05-18
**Status:** design walk, pre-implementation (RFC)
**Affects:** `src/block-conventions.json` branch 5 (amendment); authoring discipline for the Thornkeep RPG and successor L4 games
**Foundation:** `docs/protocol-xstream-frame.md` §5.7 (dimensional intersection) + the substrate as it stands at PR #45

## Why this exists

Two motivations collide, and they resolve to the same answer.

### 1. The supernest mistake in `frame`

The frame convention (`block-conventions:5`; `docs/protocol-xstream-frame.md` §2.1) claims that synthesis history at `frame:9,2..9,7` can "supernest beyond when these fill" and that entity slots can "supernest at 11..88" beyond eight participants. Neither works.

Supernesting is the substrate's growth pattern **at block root only**. Position 11 at a block's root walks `[1][1]` — the next supernest slot above 9. Position 11 inside a sub-block (e.g. `frame:9,11`) parses as `[9][1][1]` — a sub-sub-block under 9.1, not a sibling of 9.9. The walker has no way to distinguish "supernest growth" from "deeper nesting" at non-root depth; the address syntax is identical.

A frame with eight history entries can hold no ninth without breaking the supernest claim. A frame with eight participants can hold no ninth participant. Both limits silently fail.

### 2. RPG scaling needs bundles, not monoliths

The substrate is designed for federation, star-ref composition, and sed: collectives spread across beaches. A frame that crams scene state, entity lanes, history, canon, and skills into one block uses none of this. Stuffing one block to fill all roles is a Supabase-era quick-fix shape that the federated era is the move beyond.

A **bundle-of-blocks** pattern — one concern per block, composed by star-refs — solves both problems with one move: each block supernests at its own root, and the bundle composes across beaches.

## The bundle pattern in one sentence

> One concern per block; cross-references via star; supernest happens at every block's root because every concern IS a root.

## RPG bundle inventory

A scene is not a block. A scene is a **bundle of blocks**. The minimal scene bundle:

| Block at the host beach | Holds | Why its own block |
|---|---|---|
| `scene:<scene-id>` | current scene state — purpose, time-of-day, weather, who-is-present | metadata; overwritten per round |
| `frame:<scene-id>` | per-entity V-L-S lanes; synthesis input | uses frame convention for entity lanes — *only* entity lanes |
| `solid:<scene-id>` | canonical narration of the latest round | one position; daemon-written |
| `history:<scene-id>` | accumulated prior narrations | own block → supernests cleanly at root |
| `canon:<scene-id>` | skills star-refs, scene-specific NPCs, secrets | designer-authored; long-lived |
| `pool:<scene-id>-talk` (optional) | casual tavern chatter, audience comments — parallel to the frame | when pool semantics fit |

For a region / spatial setting:

| Block | Holds |
|---|---|
| `place:<region>` | geography, persistent NPCs, environmental rules |
| `lore:<topic>` | per-topic lore (e.g. `lore:thornwood`) |

For a character:

| Block | Holds |
|---|---|
| `passport:<char-handle>` | public character sheet |
| `shell:<char-handle>` | private character state across scenes |
| `history:<char-handle>` | character's accumulated arc |

For a game world:

| Block | Holds |
|---|---|
| `world:<world-name>` | top-level world index; star-refs all regions |
| `skill-pack:<scene-kind>` | designer-authored skills for a scene type |
| `sed:<game>-authors` | author collective |
| `sed:<game>-characters` | character collective (one position per character) |
| `sed:<game>-designers` | designer collective |

All live at named beaches via the federated `bsp()` wire. Composition via `*:<beach>:<block>` star-references.

## Per-face routing

The dimensional intersection (`docs/protocol-xstream-frame.md` §5.7) maps each CADO face to its natural write surface. For the RPG, this becomes the bundle-routing table:

| Face | Writes to | In RPG context |
|---|---|---|
| **Character** | `frame:<scene>:<entity-pos>,1` (liquid lane) | the player's action submission for the current round |
| **Author** | `place:<region>`, `lore:<topic>`, `world:<name>` | world-building edits |
| **Designer** | `skill-pack:<kind>`, `canon:<scene>` | scene rules, skill-pack revisions |
| **Observer** | `marks` at any address | passing notes, audience comments, mark-as-witness |

One player wears multiple faces in a session: they author a region (Author), populate it with skills (Designer), play characters there (Character), drop marks as they pass through scenes (Observer). The bundle accommodates all four naturally — each face writes to its own bundle member without colliding.

This is also why pool's role in the RPG is auxiliary, not load-bearing: the per-face surfaces above cover the primary play loop. Pool comes in for things parallel to the loop (community lore submissions, character-creation queues, casual tavern chatter).

## Worked example — the Broken Drum at the edge of Thornwood

Setting: a tavern at the edge of Thornwood forest, hosted at `beach.happyseaurchin.com`. Three players: Aiden (fighter), Brisa (bard), Cyrus (GM).

### The bundle at happyseaurchin

```
https://beach.happyseaurchin.com/
├── world:thornkeep
├── place:thornwood-edge
├── scene:broken-drum
├── frame:broken-drum
├── solid:broken-drum
├── history:broken-drum
├── canon:broken-drum
├── sed:thornkeep-authors
├── sed:thornkeep-characters
├── sed:thornkeep-designers
├── skill-pack:tavern-scene
├── skill-pack:thornwood-lore
├── passport:aiden
├── passport:brisa
└── passport:cyrus
```

### Block contents (illustrative)

**`world:thornkeep`** — top-level index:
```json
{
  "_": "Thornkeep — a small kingdom at the edge of Thornwood forest.",
  "1": "*:beach.happyseaurchin.com:place:thornwood-edge",
  "9": { "_": "World metadata", "1": "v0.1" }
}
```

**`place:thornwood-edge`** — geography:
```json
{
  "_": "The edge of Thornwood — moss-floored, owl-haunted; the Broken Drum sits a hundred paces from the treeline.",
  "1": { "_": "Notable inhabitants",
         "1": "Eldric — taciturn drover; knows the back paths" },
  "2": { "_": "Notable structures",
         "1": "*:beach.happyseaurchin.com:scene:broken-drum" },
  "3": { "_": "Local rules",
         "1": "Magic above level 2 attracts attention from the forest." }
}
```

**`scene:broken-drum`** — current state (overwritten per round):
```json
{
  "_": "The Broken Drum — tavern at the forest's edge, dusk, fire low, three patrons in shadow.",
  "1": "*:beach.happyseaurchin.com:place:thornwood-edge",
  "2": { "_": "Time", "1": "dusk", "2": "round 3" },
  "3": { "_": "Present", "1": "aiden", "2": "brisa", "3": "cyrus", "4": "raven (NPC)" }
}
```

**`frame:broken-drum`** — V-L-S lanes per the (amended) frame convention:
```json
{
  "_": "Scene: Broken Drum at Thornwood's edge.",
  "1": { "_": "Aiden — fighter, watchful",
         "1": "I scan the rafters for archers.",
         "2": "" },
  "2": { "_": "Brisa — bard, looking for the keeper",
         "1": "I head to the bar.",
         "2": "" },
  "3": { "_": "Cyrus (GM)", "1": "", "2": "" }
}
```

No position-9 canon sub-block. No position-3 history sub-block. The frame holds only what changes per round.

**`solid:broken-drum`** — latest canonical narration (overwritten per round):
```json
{
  "_": "Aiden's eyes flick upward; the rafters are empty save for a roosting raven. Brisa heads to the bar.",
  "1": { "_": "Round 3 synthesis envelope",
         "1": "rule: single-committer",
         "2": "by: cyrus",
         "3": "2026-05-18T19:00Z" }
}
```

**`history:broken-drum`** — accumulated prior narrations; supernests cleanly because it's its own root:
```json
{
  "_": "Broken Drum scene history — solids in landing order.",
  "1": { "_": "Round 1 — arrival",
         "1": "Aiden and Brisa enter through the inn's heavy door. The fire crackles low.",
         "9": "[SYNTHESIS rule=single-committer by=cyrus at=2026-05-18T18:30Z]" },
  "2": { "_": "Round 2 — quick scan",
         "1": "Brisa notes three patrons in shadow. Aiden's hand drifts to his sword.",
         "9": "[SYNTHESIS rule=single-committer by=cyrus at=2026-05-18T18:45Z]" }
}
```

After 9 rounds the next supernest slot is `history:broken-drum:11` (walks `[1][1]`), then `12`, ..., `19`, `21`, ... — exactly the supernest pattern, this time *at root* where it actually works.

**`canon:broken-drum`** — scene canon (designer-authored, long-lived):
```json
{
  "_": "Broken Drum scene canon — skills, NPCs, secrets.",
  "1": { "_": "Skill packs",
         "1": "*:beach.happyseaurchin.com:skill-pack:tavern-scene",
         "2": "*:beach.happyseaurchin.com:skill-pack:thornwood-lore" },
  "2": { "_": "Resident NPCs",
         "1": { "_": "The keeper", "1": "Doric — gruff, missing finger" },
         "2": { "_": "Raven in the rafters", "1": "Senses magic; watches Aiden" } },
  "3": { "_": "Secrets (designer-only; gray-encrypted)",
         "1": "<encrypted>" }
}
```

### Round flow

1. Players write liquid to their entity lanes in `frame:broken-drum`:
   - Aiden writes at `frame:broken-drum:1,1` — "I scan the rafters."
   - Brisa writes at `frame:broken-drum:2,1` — "I head to the bar."
2. Synthesis daemon on Cyrus's host (or co-hosted at happyseaurchin) triggered by single-committer rule when Cyrus pushes commit:
   - Reads `frame:broken-drum` whole-block for all entity liquid
   - Reads `canon:broken-drum:1,1` for skill-pack star-ref → resolves to `skill-pack:tavern-scene`
   - Calls medium-LLM with assembled context (entity lanes + skill + prior solid)
   - Writes synthesis text to `solid:broken-drum` underscore
   - Rolls previous `solid:broken-drum` content to next free supernest slot in `history:broken-drum`
   - Updates each entity's `frame:broken-drum:<n>,2` (solid lane) with the committed text
   - Clears each entity's `frame:broken-drum:<n>,1` (liquid lane)
3. Players (and observers) read `solid:broken-drum` to see the narration.

No state is lost. Everything supernests at the right root. The frame block stays small and per-round; persistence lives in sibling blocks.

## Cross-beach composition — the Middle-Earth / GitHub-for-games picture

Federation makes "a world built across many beaches" natural.

```
Alice's beach hosts:
  place:rivendell, place:shire, scene:rivendell-council

Bob's beach hosts:
  place:mordor, scene:mordor-pass, scene:black-gate

Charlie's beach hosts:
  world:my-middle-earth — star-refs Alice's and Bob's regions
```

A player walking `world:my-middle-earth` traverses star-refs. They see Rivendell (Alice), the Shire (Alice), Mordor (Bob), the Black Gate (Bob). Charlie has authored no regions but composes the world from federated content.

**Forks**: Bob copies Alice's `place:rivendell` to his beach, modifies the NPCs, runs his own variant. Both Rivendells coexist; popularity is implicit (which world star-refs which version).

**Discovery**: lighthouse at each beach surfaces what it hosts. A future "neighbour beaches" position (existing lighthouse category 6) lets operators name federated peers.

**Faces and federation**: an Author writing `place:gondor` doesn't need permission from Charlie to add it to her own beach. Charlie chooses (later) whether to star-ref it into his world. No central registry; no committee. The substrate is the discovery layer.

## Frame convention amendment

The current `block-conventions:5` needs amendment to make the bundle pattern explicit and to retire the failed supernest claims. Proposed shape:

- **5._** — frame: a per-round V-L-S lane container, NOT a persistent record. Persistence lives in sibling blocks (`solid:<id>`, `history:<id>`, `canon:<id>`).
- **5,1** — entity liquid lane (per the existing convention)
- **5,2** — entity solid lane (per the existing convention)
- **5,3** — `<entity-pos>,3` per-entity history. UNCHANGED but bounded to 1..9 entries per entity; older entries roll into the scene-level `history:<id>` sibling block.
- **5,9** — REMOVED in current form. The "frame canon" sub-block at 9 doesn't supernest beyond 9.7 history entries and has no clean place for >8 entities. Replaced by sibling `canon:<id>` block.

Net effect: frame becomes a small, ephemeral block holding only the current round's entity lanes. Everything that needs to persist or scale moves to siblings.

This amendment lands as a separate PR alongside (or after) this design walk. The new sibling-block conventions (`scene:`, `history:`, `canon:`, `place:`, `world:`, `skill-pack:`, `lore:`) become a new branch in block-conventions (suggested: branch 10 — "RPG bundle conventions" — or fold into branch 8.9 "by-use-case index").

## Sed: collectives & grain

For Thornkeep:

| Collective | Purpose | Created via |
|---|---|---|
| `sed:thornkeep-authors` | world / lore / place authors | `pscale_create_collective` |
| `sed:thornkeep-characters` | character creators (one position per character) | `pscale_create_collective` |
| `sed:thornkeep-designers` | rule / skill authors | `pscale_create_collective` |

Observer needs no registration (safety-net face).

Grains form bilateral character-to-character channels when private continuity matters (sworn bond, secret pact, shared memory). `grain:<charA-charB>` per the standard `pscale_grain_reach` flow.

## What needs to be authored to play

The substrate provides the wire and the conventions. To play the first Broken Drum round:

1. **`library:rpg-bundle`** — short library block at happyseaurchin documenting this pattern (so future scenes follow it without re-deriving)
2. **`sed:thornkeep-authors`, `sed:thornkeep-characters`, `sed:thornkeep-designers`** — three collectives via `pscale_create_collective`
3. **`world:thornkeep`** — top-level world index
4. **`place:thornwood-edge`** — geography
5. **`scene:broken-drum`, `frame:broken-drum`, `solid:broken-drum`, `history:broken-drum`, `canon:broken-drum`** — scene bundle (initially empty; populated as play begins)
6. **`skill-pack:tavern-scene`, `skill-pack:thornwood-lore`** — designer-authored skill packs
7. **Synthesis daemon** — standalone process (launchd-managed Node or Python, ~200 lines) that watches `frame:broken-drum`, runs medium-LLM, writes `solid:broken-drum`, rolls history. Reuses GRIT v2 daemon shape; speaks HTTP `bsp()` against happyseaurchin only

Items 1–6 are substrate writes. Item 7 is a standalone daemon. **None of this requires xstream — playable through any MCP client today.**

xstream will add reflexive presentation (vapour streaming, face-aware V-L-S surfaces, presence visualisation) on top, when xstream's V-L-S tidy lands. Optional quality layer, not infrastructure.

## What this proposal asks for

1. **Endorsement of the bundle pattern** as the foundation for the Thornkeep RPG and future L4 games.
2. **Endorsement of the frame convention amendment** (drop the failed supernest claims; explicit sibling-block siblings).
3. **Approval to author** the library block, sed: collectives, world/place/scene bundle, skill packs, and synthesis daemon. Each item is small; the full first cut is achievable inside one session of focused work.

## Open questions for review

- **The frame amendment**: same PR as the new conventions, or a separate housekeeping PR first?
- **New convention branch**: do `scene:`, `history:`, `canon:`, `place:`, `world:`, `skill-pack:`, `lore:` get their own branch in block-conventions (e.g. branch 10) or fold under existing branches (e.g. extend the by-use-case index at 8,9)?
- **Scene-host vs world-host**: in the example, Cyrus is GM but the scene lives at happyseaurchin (not Cyrus's beach). Right shape? Or should each GM host their own scenes? Or both valid (public world-hosted vs private GM-hosted)?
- **`history:<scene>` as substrate-canonical**: do we make this a general substrate convention (any block X may have an accompanying `history:X` for supernested archive of past states), or scene-specific? Generalising helps other L4 builds with the same supernest problem.
- **Pool's role**: confirmed auxiliary in this design. Worth surfacing one or two pool placements (e.g. `pool:thornkeep-lore-submissions` for community-authored lore) to keep the convention exercised?
- **Federation discovery for scenes**: should the lighthouse get a new category position for scenes / playable worlds? Operator choice, but a convention helps players find content.
- **Sed: gating for characters**: is `sed:thornkeep-characters` the right shape (one position per character), or per-player with characters under it? The first is simpler; the second supports a player rotating characters in one position.

---

**Provenance:** drawn from the Broken-Drum-at-Thornwood-edge decision in the prior session (2026-05-18), the dimensional-intersection model at `docs/protocol-xstream-frame.md` §5.7, and the supernest discipline at sunstone:1.41 (tree-walk: `1,4,1`).
