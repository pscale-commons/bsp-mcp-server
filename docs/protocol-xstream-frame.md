# Xstream Frame Protocol

**Status**: Draft, 29 April 2026
**Companion to**: `protocol-pscale-beach-v2.md`, `xstream/docs/unified-loop-architecture.md`, `xstream/docs/frame-lamina-aperture.md`
**Authors**: David Pinto with Claude (bsp-mcp-server reference instance)

---

## 0. Reframe in one paragraph

An **xstream frame** is a pscale block whose convention encodes the vapour-liquid-solid (V-L-S) collaboration loop. The frame block holds liquid (submitted-but-uncommitted) and solid (committed) content at conventional positions, indexed by entity. Vapour — live letter-by-letter co-presence and streamed LLM completions — is explicitly **NOT** in the frame block; it lives on a sibling realtime transport because it is pre-commitment by definition. A synthesis daemon (medium-LLM, or a designer-defined rule) reads liquid via `bsp()`, produces solid via `bsp()`, and the frame advances. The four faces (Character, Author, Designer, Observer — CADO) compose orthogonally: face determines whose liquid is visible to whom and who is authorised to commit, via membership in the matching `sed:` collective. No new MCP primitive is required — bsp-mcp already provides everything below the vapour line.

---

## 1. The seven decisions that drive everything else

| # | Decision | What it rules out |
|---|---|---|
| 1 | Vapour is out-of-band; only liquid and solid live in pscale blocks | Trying to stream tokens through `bsp()` calls |
| 2 | Liquid and solid are sibling positions inside an entity's sub-block | A separate "shelf" or "state" field on a content row |
| 3 | The synthesis rule is convention + daemon, not a primitive | A `pscale_synthesise` tool or substrate state machine |
| 4 | Face (CADO) is enforced by `sed:` membership, not by a frame-level flag | A `face` column on the frame block |
| 5 | Coordinate proximity is read by spindle/pscale, not stored | A frames table with parent/child links |
| 6 | One frame block per scene; entities are positions inside it | One row per entity per frame in a relational schema |
| 7 | Synthesis envelopes carry rule provenance in text, not metadata | A separate audit table for synthesis history |

---

## 2. The frame block — canonical shape

A frame is a single pscale block. Its address is by convention `(agent_id="<beach-url>", block="frame:<scene-id>")` when hosted on a beach, or `(agent_id="<owner>", block="frame:<scene-id>")` when held privately by a host (game-master, document-owner, design-cell).

### 2.1 Top-level shape

```json
{
  "_": "<scene purpose / authoring goal / design intent — the underscore at floor>",
  "1": { "_": "<entity A's role-and-position>",
         "1": "<A's liquid — pending, awaiting commitment>",
         "2": "<A's solid — last committed contribution>"
       },
  "2": { "_": "<entity B's role-and-position>", "1": ..., "2": ... },
  "3": { "_": "<entity C's role-and-position>", "1": ..., "2": ... },
  "_synthesis": {
    "_": "<latest synthesis — the canonical rendering of the frame's solid>",
    "1": "<previous synthesis>",
    "2": "<earlier synthesis>",
    "_envelope": "[SYNTHESIS rule=<rule-id> by=<actor> at=<ts>]"
  },
  "_skills": "*:<owner>:skill-pack:<scene-kind>"
}
```

### 2.2 Per-entity sub-block

Every entity that participates in the frame has a numbered position. The convention inside that position is fixed — `1` is liquid, `2` is solid, deeper digits hold history or per-attribute lanes when needed.

```json
{ "_": "<entity self-description: who I am in this frame, what scope I act on>",
  "1": "<liquid — what I have submitted but not yet committed>",
  "2": "<solid — what was last committed on my behalf, post-synthesis>",
  "3": { "_": "history (oldest first)",
         "1": "<solid n-2>", "2": "<solid n-1>", ... },
  "9": { "ed25519": <pubkey>, "x25519": <pubkey> }
}
```

The numbering is the same convention as a passport (`1` = offers/intent, `2` = needs/commitments) — read across both: liquid is the offer, solid is the realised need.

### 2.3 Why both lanes inside the entity sub-block, not at frame top-level

Liquid and solid for entity A belong together, not in two separate sweeps of the frame. A reader inspecting "what is A doing" walks `frame.1` and gets both lanes in one disc. Cross-entity proximity reads (`bsp(spindle="", pscale_attention=-2)`) return all entities' both-lanes in supernest order, which is the right shape for medium-LLM context assembly.

---

## 3. The V-L-S lifecycle — operational

### 3.1 Vapour (out-of-band, NOT in the frame block)

Vapour is letter-by-letter co-presence and streamed LLM completions. It runs over a realtime transport — Supabase realtime, WebSocket, SSE — keyed by frame-id and entity-id. Two contents:

- **Human typing**: keystroke deltas broadcast to coordinate-proximate entities. Receivers render the deltas in the vapour zone of their UI. No write to the substrate.
- **Soft-LLM streaming**: the soft-LLM ingests the vapour buffer + the entity's situated context (loaded from the frame and its skills via `bsp()` reads) and streams refinement deltas back. The user sees the refinement live.

When the user **accepts** the soft-LLM output (or chooses to commit raw vapour), the client performs the first substrate write of the cycle:

```
bsp(agent_id=<user>, block="frame:<scene-id>", spindle="<entity-pos>.1", content=<accepted-text>)
```

This is the vapour → liquid transition. Vapour is gone the moment liquid lands.

The realtime transport is provided by the application (xstream client or its host), NOT by bsp-mcp. The vapour layer is allowed to be lossy, ephemeral, and unaudited. The substrate is not.

### 3.2 Liquid (a write at the entity's `1` position)

Liquid is a normal `bsp()` write. Subscribers — whoever is watching the frame — see the write via realtime substrate notification (Supabase realtime on the `pscale_blocks` table) or via polling. Liquid carries authority: only the entity itself (or an authorised face — see §5) can write to its own liquid lane.

Read by other entities to assemble context:

```
bsp(agent_id=<them>, block="frame:<scene-id>", spindle="", pscale_attention=-2)
```

This returns a disc — every entity's liquid + solid in supernest order. That is the input to medium-LLM.

### 3.3 Synthesis (medium-LLM, daemon-driven)

A synthesis daemon — running on the frame owner's host (game-master, document-host, design-cell) — observes liquid writes and applies the synthesis rule. The rule is loaded from `_skills` (a star-reference to a skill block; see §4). When the rule fires, the daemon:

1. Reads the full frame state (liquid + solid + previous synthesis).
2. Calls medium-LLM with the synthesis skill and the gathered state.
3. Writes the new synthesis to `_synthesis._`, rolling the previous synthesis to `_synthesis.1`, etc.
4. For each entity whose liquid was consumed, writes their committed text to `<entity-pos>.2` (solid) and **clears their liquid** by writing the `1` position to empty string or null.
5. Stamps `_synthesis._envelope` with `[SYNTHESIS rule=<rule-id> by=<actor> at=<ts>]`.

All four steps are `bsp()` calls. The daemon holds no privileged authority — it writes under its own agent identity, which must be registered in the relevant `sed:` collective for the frame's design face (see §5.3).

### 3.4 Solid (the committed lane)

Once written to `<entity-pos>.2`, content is canonical for that entity at that frame-tick. It feeds hard-LLM frame updates (which propagate the commitment outward — to other frames, to world-state blocks, to player notifications) via the same `bsp()` writes. Hard-LLM is also a daemon, also outside bsp-mcp, also using only `bsp()` to read and write.

History is kept by rolling old solid into `<entity-pos>.3.<n>` per the per-entity shape in §2.2 — capped or unbounded by convention.

---

## 4. Synthesis rules — five canonical patterns

The synthesis rule is a skill block — markdown plus parameters — referenced from `_skills`. The daemon fetches it, applies it, and writes the result. Five canonical patterns; designers may compose new ones.

### 4.1 Single-committer

One designated entity (often the GM or document-owner) commits all liquid into a single solid. The committer reads all liquid, writes one synthesis, clears all liquid. Common in tabletop RPGs where the GM narrates the round.

```
{ "_": "Synthesis rule — single committer.",
  "1": "Committer: <agent_id>.",
  "2": "Trigger: committer pushes a 'commit' button (UI signal → daemon).",
  "3": "Action: read liquid disc, call medium-LLM with scene-skill, write synthesis." }
```

### 4.2 Self-commit

Each entity commits their own liquid to their own solid, optionally with a per-entity refinement skill. No cross-entity synthesis — the frame's `_synthesis` aggregates by concatenation rather than rewrite. Common in collaborative documents where authors are independent.

### 4.3 Quorum

Synthesis fires when N-of-M entities have written non-empty liquid. Useful for design cells or council-like bodies where the rule is "we all need to weigh in."

### 4.4 Time-triggered (GRIT)

Synthesis fires when the round window elapses. Identical to GRIT under the pscale-beach v2 protocol — the same daemon family. The envelope `[SYNTHESIS rule=grit window=<s>s resolves=<ts>]` is the same envelope GRIT writes for pool resolution.

### 4.5 Designer-rule

The synthesis is computed by a designer-supplied skill that may take any inputs the frame exposes — including world-state from other blocks via `*` references. The skill itself is a pscale block under the designer's authorship and may be revised through the same V-L-S loop at design face. (This is the recursive property from `xstream/docs/unified-loop-architecture.md` §"The Recursive Property".)

---

## 5. Faces — CADO composition

Face is the orthogonal modifier (whetstone branch 3). Face determines:

- **Whose liquid is visible** to a given reader.
- **Who is authorised** to write to which lane.
- **Which synthesis skill** the daemon applies.

### 5.1 Character face

Membership: `sed:<scene-id>-cast`.

- Read aperture: own entity (always), and other entities' liquid IF the scene's perception rules permit (proximity, line-of-sight, knowledge-overlay — encoded in the scene-skill).
- Write aperture: own entity's liquid lane (`<own-pos>.1`).
- Synthesis target: world-narrative — solid is what "actually happened" in the fiction.

### 5.2 Author face

Membership: `sed:<doc-id>-authors`.

- Read aperture: all authors' liquid + solid; all authors' history.
- Write aperture: own author position's liquid lane.
- Synthesis target: canonical document — solid is the merged text after editor-rule resolution. The rule may be single-committer (designated editor) or quorum (collective approval) or auto-merge (when contributions don't conflict).

### 5.3 Designer face

Membership: `sed:<scope>-designers`.

- Read aperture: all of the above PLUS the skill blocks themselves and the synthesis history.
- Write aperture: own designer position's liquid lane on the design-frame; AND, once a design-frame's solid is committed, the synthesis daemon writes the result back into the affected scene-skill block (recursive update).
- Synthesis target: governance — solid is the new rule, which then governs subsequent character/author frames.

The recursive case: a designer's liquid is "I propose changing rule X." When committed, the change propagates to the rule block. From the next tick onward, all character/author frames that reference that rule block via `*:rule:X` use the new version. No code change. Just a write.

### 5.4 Observer face

Membership: none required (observer is the baseline face).

- Read aperture: all solid; no liquid (observers see committed content only — they do not witness pre-commitment).
- Write aperture: none on the frame; observers may keep private notes in their own block (gray-encrypted, single-author).
- Synthesis target: not applicable — observers do not participate in the loop.

The Observer face's exclusion from liquid is the V-L-S security property. Vapour and liquid are pre-commitment; only entities accountable to the frame (Character, Author, Designer per their `sed:` membership) get to see them.

### 5.5 Tier (SMH) — orthogonal aperture

Tier scopes within whatever face permits.

- **Soft**: only own liquid + own solid + the scene's underscore.
- **Medium**: own + proximity-visible peers' liquid and solid.
- **Hard**: full frame disc — every entity's both lanes.

The synthesis daemon typically runs at Hard for whatever face it represents (it must see everything to synthesise). Player clients run at Medium. Spectators run at Soft on the Observer face.

### 5.6 The viewer — objective consultation layer

Xstream is a reflexive tool. The V-L-S canvas is what you see *while you are imagining*, not what is the case. Vapour is the soft-LLM's impression of your intent rendered back to you; liquid is your intention exposed to coordinate-proximate others before commitment; solid is the moment imagination becomes fact and stops being interesting. Traditional web tools invert this — they render an objective external world plus a small contribution input. Xstream's proportions reverse: the canvas is the imaginative frame; consultation of the objective beach is **secondary** and lives behind a toggleable drawer.

**The viewer is not a new pscale block shape.** It is a UI affordance — a slide-down drawer overlay — composed from `bsp()` reads scoped by:

1. The active face (CADO) — picks the kind of content rendered.
2. The current frame's coordinates — picks proximity (you see things proximate to where you are working).
3. The user's followed addresses — beach URLs, agent passports, sed: collectives, pinned blocks. Listed in the user's shell or passport.
4. The current liquid in the active frame — viewers may be responsive to what you're presently liquid-ing.

The drawer obscures solid below it when open; the user manoeuvres separators to balance how much of the frame remains visible. **Closing the drawer is the imaginative-mind default.** Opening it is a deliberate consultation act, like looking up to check the world, then putting it away to focus on co-creation.

#### Viewer content per face

| Face | Drawer renders |
|---|---|
| Character | Own passport, character sheet, inventory, location, party, world-canon proximate to position |
| Author | Authored spatial blocks, document tree, sibling contributions awaiting merge, version history |
| Designer | Rule blocks, convention blocks, skill blocks, design-frame proposals in flight |
| Observer | The whole beach scoped to what's followed; passports, marks, pools, anyone's solid output |

Observer is the widest aperture because Observer is the *civilised-mind face* — the third-party view of the objective beach. Every traditional web tool ever built renders this view. An Observer-only client would be a perfectly valid xstream UI: a beach browser without imagination. The reflexive V-L-S layer is what makes a client xstream rather than a generic browser.

#### Viewer narrowing across evolutionary levels

The viewer's *necessity* decreases as the relational level rises. At Level 1 the viewer is most of what xstream does (you watch beaches; little else). At Level 5 the viewer is the drawer you toggle off to do imaginative work — V-L-S takes the canvas. This is the evolutionary curve of imagination-vs-civilisation in the tool itself: lower levels are civilised-mind territory; higher levels are imaginative-mind territory. See [src/evolution.json](../src/evolution.json) digit 7 at each level for what the viewer surfaces level by level.

#### What the viewer is NOT

- Not a frame block. No persistent state. No commitment.
- Not in scope for the synthesis daemon. The daemon synthesises liquid into solid; the viewer just renders solid (and, where the active face permits, others' liquid).
- Not a permission boundary. Face authorisation already governs what `bsp()` returns; the viewer cannot show what `bsp()` would refuse to read.

The viewer is the lens xstream offers onto Levels 1–4 from within a Level 5 frame. It is necessary, secondary, and dismissible.

---

## 6. The block-shape derivation in one table

| Read intent | bsp() call | Returns |
|---|---|---|
| Frame purpose only | `bsp(block="frame:X", spindle="", pscale_attention=0)` | the underscore |
| Active synthesis (canonical render) | `bsp(block="frame:X", spindle="_synthesis", pscale_attention=0)` | latest synthesis text |
| One entity's lanes | `bsp(block="frame:X", spindle="<n>", pscale_attention=-1)` | entity's liquid + solid |
| All entities' both lanes | `bsp(block="frame:X", spindle="", pscale_attention=-2)` | full disc — synthesis input |
| Liquid lane only | `bsp(block="frame:X", spindle="<n>.1", pscale_attention=0)` | one entity's pending |
| Synthesis history | `bsp(block="frame:X", spindle="_synthesis", pscale_attention=-1)` | current + previous syntheses |

All reads compose with face/tier modifiers. Writes are always to a single position.

---

## 7. Daemon contract

A frame has, at minimum, two daemons running on the host:

### 7.1 The synthesis daemon (medium-LLM)

```
loop:
  trigger = await synthesis_trigger(frame, rule)   # signal, quorum-met, or timer
  state = bsp(block=frame, spindle="", pscale_attention=-2)
  skill = bsp_resolve_star(state["_skills"])
  result = medium_llm(prompt=skill, context=state)
  for entity_pos, committed_text in result.commitments:
    bsp(block=frame, spindle=f"{entity_pos}.2", content=committed_text)
    bsp(block=frame, spindle=f"{entity_pos}.1", content="")        # clear liquid
  bsp(block=frame, spindle="_synthesis._", content=result.synthesis_text)
  bsp(block=frame, spindle="_synthesis._envelope",
      content=f"[SYNTHESIS rule={rule.id} by={daemon.agent_id} at={now}]")
```

The daemon's `agent_id` MUST be registered in the appropriate `sed:` collective for the frame's design face (so its writes are authorised).

### 7.2 The propagation daemon (hard-LLM)

```
loop:
  on solid_write_event(frame, entity_pos):
    impacts = hard_llm(scene-state, committed_solid)
    for target_block, target_spindle, content in impacts.writes:
      bsp(block=target_block, spindle=target_spindle, content=content)
```

This propagates committed solids outward — to character sheets, world-canon blocks, other frames, player passports. Same substrate operations, different reach.

### 7.3 The vapour transport (out-of-band, not a daemon contract)

Provided by the application. Specifies only:

- Channel keyed by `frame:<scene-id>` and (for character face) `entity:<n>`.
- Receives keystroke deltas and soft-LLM token streams.
- Broadcasts to coordinate-proximate face-authorised subscribers.
- No persistence requirement — vapour is allowed to drop.

Reference implementation: xstream uses Supabase realtime presence + broadcast; xstream-play extends with per-character channels under the cast `sed:` collective.

---

## 8. Concrete worked example — three-player scene

A scene `scene:tavern-001` with players Aiden, Brisa, and the GM Cyrus. The frame block at the GM's beach:

```
agent_id="https://cyrus.gm.example", block="frame:scene:tavern-001"

{ "_": "Scene: the tavern at dusk. Aiden and Brisa just walked in.",
  "1": { "_": "Aiden — fighter, suspicious of the room",
         "1": "I scan the rafters for archers.",
         "2": "Aiden's eyes flick upward; the rafters are empty save for a roosting raven."
       },
  "2": { "_": "Brisa — bard, looking for the proprietor",
         "1": "I head to the bar and ask the keeper about rooms.",
         "2": ""
       },
  "9": { "_": "Cyrus (GM) — narrative authority",
         "1": "",
         "2": "The fire crackles low; three patrons sit in shadow."
       },
  "_synthesis": { "_": "Aiden checks the rafters. Brisa heads to the bar. The fire is low; three figures sit in shadow.",
                  "_envelope": "[SYNTHESIS rule=single-committer by=cyrus at=2026-04-29T18:14:02Z]" },
  "_skills": "*:cyrus:skill-pack:tabletop"
}
```

Aiden has committed (his `1` is empty, his `2` has the narrated outcome). Brisa has liquid waiting. Cyrus has solid — his last narration. The next synthesis tick (single-committer rule, fired when Cyrus pushes commit) reads Brisa's liquid, generates her `2`, writes a new `_synthesis._`, and clears Brisa's `1`.

A second player joining as observer reads only `_synthesis._` and the entity underscores — they see the story, not the pending moves.

A designer revising the tabletop skill writes liquid into a separate frame `frame:design:tabletop-skills`, and on commit the skill block at `cyrus:skill-pack:tabletop` is rewritten. From the next scene tick onward, Cyrus's daemon loads the new skill.

---

## 9. What is and isn't in bsp-mcp

| Layer | In bsp-mcp? | Provided by |
|---|---|---|
| Frame block storage | ✅ | `pscale_blocks` table; `bsp()` reads and writes |
| Liquid lane | ✅ | A position in the frame block |
| Solid lane | ✅ | A position in the frame block |
| Synthesis history | ✅ | A sub-block under `_synthesis` |
| Face authorisation (CADO) | ✅ | `sed:` membership + face modifier on `bsp()` |
| Tier aperture (SMH) | ✅ | tier modifier on `bsp()` |
| Skill blocks | ✅ | Just blocks; resolved via `*` references |
| Synthesis daemon | ❌ | Application-side script (port from xstream) |
| Propagation daemon | ❌ | Application-side script |
| Vapour transport | ❌ | Application-side realtime channel (Supabase realtime / WebSocket) |
| Soft-LLM streaming | ❌ | Application-side LLM client |

The substrate provides commitment. The application provides liveness. The line between them is the V-L-S boundary itself — vapour is alive and uncommitted, liquid is the first commitment, solid is the canonical commitment.

---

## 10. Migration from current xstream

Current xstream (per `xstream/docs/phases.md` through phase 0.10.3.3) uses dedicated Supabase tables — `liquid`, `solid`, `frames` — with constraints like `UNIQUE(frame_id, user_id)` and columns like `consumed_by_solid_id`. The migration to bsp-mcp:

1. **Frame becomes a block.** One row per frame in `frames` → one block named `frame:<scene-id>`.
2. **Liquid and solid rows fold into entity positions.** A liquid row for user U at frame F → write at `frame:F` spindle `<u-pos>.1`. A solid row → write at `<u-pos>.2`. The unique constraint is structural — there is exactly one position `<u-pos>.1` and writing it overwrites.
3. **`consumed_by_solid_id` becomes the synthesis envelope.** When the daemon commits, it writes `_synthesis._envelope` with the rule and timestamp; old liquid is cleared (set to empty), and the entity's `2` is updated. Race-free because each entity has its own positions and writes are sequenced.
4. **Realtime subscription stays the same shape.** Supabase realtime on `pscale_blocks` (filtered by block name) replaces the per-table channels.
5. **The early-deletion-fix problem dissolves.** There's no DELETE-then-INSERT race because liquid clearing is a write to `<u-pos>.1`, and a new submission is a write to the same position. The substrate handles last-writer-wins; the synthesis envelope establishes ordering.

The phase 0.10 lessons are encoded in the protocol shape, not in defensive code.

---

## 11. Open questions

- **Cross-frame proximity**: how does an entity in `frame:A` see solid commitments in `frame:B` for proximity-aware perception? Star-references work (`*:beach:frame:B:_synthesis._`), but a convention for "frames I am proximate to" needs to settle. Probably a position in the entity's passport listing watched frame URLs.
- **Vapour-to-liquid coalescing**: does every accepted vapour become a separate liquid write, or do we coalesce within a window? Application choice; protocol-neutral.
- **Liquid TTL**: should liquid expire if no synthesis fires within N minutes? Convention per scene-skill, likely.
- **Designer governance loops**: how deep does the recursive design go? At some point a constitution-skill governs the design-skills. The protocol allows arbitrary depth via star-references; whether that depth is sane is a design choice.

These are noted, not blocking. The minimum viable frame protocol is sections 2–7. Sections 8–10 are illustration and migration notes.
