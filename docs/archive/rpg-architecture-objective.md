# rpg-architecture (objective) — archived 2026-06-05

> **Archived from the beach.** This was the block `rpg-architecture` at
> `beach.happyseaurchin.com` — the *objectively-centred* realisation of multiplayer
> RPG on the bsp-mcp substrate. It is **superseded by `rpg-architecture-subjective`**
> (the canon) and was deleted from the beach on 2026-06-05 to end the duplication of
> three "RPG design" blocks (`rpg`, `rpg-architecture`, `rpg-architecture-subjective`).
> Preserved here verbatim because beach blocks are not in git and this holds original
> design thinking — the submit/commit wager, the phase trajectory, and (branch 7) the
> objective/subjective fork that named the path to the canon.
>
> Carried forward: submit/commit + in-loop resolution → `rpg-architecture-subjective`
> branch 9.4 + `function:thornwood` + `proposals/2026-06-05-in-loop-resolution.md`;
> the subjective fork (branch 7) → realised in `rpg-architecture-subjective`.

**Root:** The architecture and developmental trajectory of multiplayer role-play on the bsp-mcp substrate. Six branches, each one facet: the soft-medium-hard triad (1), the blocks that hold the state (2), the frame that filters perception structurally (3), the submit/commit mechanic that turns async into gameplay (4), the phase trajectory from simple to systemic (5), and the design discipline that keeps it minimal (6). The substrate IS the game state; the geometry does the filtering; the LLM tiers are reads of one structure, not three programs. Read a branch for a facet; walk a spindle for the detail.

## 1 — The triad (soft / medium / hard)

*The triad — soft, medium, hard — is three apertures onto one substrate, one per function, not three programs. Its crux is a split the first design conflated: RESOLUTION is shared (one canonical truth per moment), FILTERING is per-character (each sees only their perception). Separating them is what keeps the system minimal.*

1. Soft is the player's own session. It renders the character's frame-scoped perception (branch 3) and commits the player's intention. It knows only what the character knows; it never resolves, never rolls, never narrates the unseen — it has nothing to hide because it was never handed what it should not see.
2. Medium is the resolver — the crab, or a player at the moment of commit. It combines the liquid intentions since the last resolution into canonical events, applying the rules and the dice. Its work is backstage: the arithmetic lands in the event record, never in a player's view; only the narrated outcome reaches the player.
3. Hard is the steward — run occasionally, never per action. It folds settled events into the world's description and archive so the world remembers, checks that co-present characters share a location (proximity is geometry, branch 3.1), and keeps the accumulators shallow. One crab carries both medium and hard.
4. The split that dissolves the confusion: resolution is shared — one medium per window writes one canonical event-skeleton. Filtering is per-character and STRUCTURAL — the frame (branch 3), not a per-player medium-LLM. The medium-tied-to-the-character of the first design is not an LLM; it is a scoped read of the shared canon.

## 2 — The blocks (the substrate IS the game state)

*The pieces are few, and they are pscale blocks — the substrate is the game state, with no engine outside it. Each block below holds one kind of state; the agent tiers of branch 1 read and write them.*

1. `spatial:<world>` — the geometry. Places nest by containment (region to room to fixture); the floor sets human scale at pscale 0. A character's location is a point in here, and proximity between characters is read off the geometry. Each place's hidden directory carries its knowledge and its references to events and rules.
2. `pool:<room>` — the spine. Submitted intentions accumulate here as liquid, voice-preserved, in landing order. Reading it returns the soft directive at 9.1; resolvers fetch the medium directive at 9.2 and the hard directive at 9.3.
3. `solid:<room>`, with events and history — the canon. Resolved events, each tagged with who could perceive it. The recent window is live in solid; the steward folds settled events into the world description and into history.
4. `passport:<char>` — who the character is, where they stand, and their Character Force (capability). `witnessed:<char>` — what the character has come to know: the names and terms they can recognise. Absence is ignorance; the I-coordinate accumulates here through play.
5. `rules:<system>` — the dice and outcome bands (the game system, e.g. NOMAD), independent of any world. `rules:<place>` — the place's perception physics and social norms: what carries to whom, what is seen from where. The first is the character-and-dice maths; the second is the Situation Force and the visibility law.

## 3 — The frame (perception, filtered structurally)

*The frame is the answer to perception: a bundle of reads scoped to a character's situation that returns ONLY what the character perceives. The geometry filters — not a prompt, not a per-player LLM. Because the soft session receives a frame and not the whole canon, it cannot leak the unseen: it was never handed it.*

1. Location scope — read the events at and near the character's position in spatial. An event stored at its place is returned by a positional read; an event elsewhere is not addressable from here, so it never arrives. Proximity is geometry; distant and cross-room events fall outside the read.
2. Knowledge scope — names and terms are gated by `witnessed:<char>`. The frame names another only when that name is in the reader's witnessed; otherwise it describes by appearance. A character learns a name by introduction or overhearing, and only then does the frame let them use it.
3. Occlusion — within one place, line of sight is finer than position: the settle screens the corner from the door. This residue is carried by a visible-to tag on each event, honoured at read. Position handles the coarse scope; the tag handles the fine.
4. The soft renders the frame's result and nothing else. It has nothing to filter, because the read already excluded the unseen, and nothing to disclose by negation. What the character does not know cannot be narrated, because it was never present. This is the structural cure for the dramatic-irony leak.
5. Where the frame is operational, checked 2026-05-31. bsp-mcp holds frame only as a block convention — no frame tool, no primitive; resist making one (the surface stays bsp() plus the primitives). The federated beach handler has no frame logic — frame blocks are ordinary blocks. The frame runs operationally only in xstream, as the bundle/scoop in run-bundle.ts: soft/medium/hard are three bundle types, and a bundle is (addresses, identity, framing, tools, output) — the same model as branch 1, reached independently. But even there the scoop is composed in client code, not read from the substrate; xstream itself flags reading the bundle definition from blocks as its own unbuilt reflexive move.
6. The convergence and the access question. Define the frame as a substrate block — a scoop-spec naming the reads that assemble a character's perception (drafted as frame-spec:thornwood) — and both the text-client soft AND xstream's runBundle resolve the same spec: one frame, two clients, no client gets exclusive substrate access. Resolution is client-side READS against the named addresses; it is not a bsp-mcp tool and must not become one. The generic frame pattern may later be promoted to a substrate-wide convention (a sentinel, or a block-conventions branch); the per-game scoop-spec stays a beach block, forkable. xstream's true exclusive is not the frame but the real-time liquid peek and presence (branch 4.5) — a transport premium, not a gated capability. Building the frame as a block is therefore also xstream's reflexive-scoop move: one build serves both clients.

## 4 — Submit / commit (the wager that turns async into gameplay)

*Submit and commit are two intentions a player may declare, and the choice between them is the game. Both add liquid; they differ in whether they force resolution and in what the player knows when they do. The asymmetry between blind and informed commitment is the premium that xstream sells.*

1. Submit — add the character's intention to the pool as liquid, and force nothing. The player then waits, and on a later what-has-happened read pulls whatever has resolved since their last look. They may find a resolution, or only a heap of others' intentions not yet resolved — which may prompt a fresh submission, or a commit.
2. Commit — force resolution now. The medium combines all liquid since the last resolution, including the committing player's new intention, into events. In a text client the commit is blind: the player does not see the other liquid their intention is about to merge with.
3. The wager — submit and wait keeps you informed but cedes initiative, for another may commit and resolve your standing liquid in a shape you did not choose. Commit and you seize the resolution to include your intention, but blind to what else merges into it. The tension is not designed; it falls out of the async substrate.
4. Resolution has two triggers — the steward closing a window on elapsed time (lazy, on the next touch), or a player's commit forcing it at once. Either way one medium resolves, the machinery stays backstage, and the player receives the narrated outcome through their frame.
5. xstream changes the wager without changing the substrate. Its continuous polling shows the liquid as it accumulates, so the player feels when to commit and commits informed — the blindness lifts. The text client commits blind; the live canvas commits sighted. That informational edge is the experience worth paying for.

## 5 — Phase trajectory

*The trajectory runs from a simple working game to a systemic one, each phase adding a layer without rebuilding the last. Locating a build on this trajectory prevents both over-building early and bodging late.*

1. Phase 1 — async play-by-post. One resolver (the crab) as medium; players pure soft; perception structural through the frame; dice light. A complete multiplayer game at play-by-post tempo, blind commit only. This is the foundation, and where the Beaten Drum build now sits.
2. Phase 2 — rich and intimate. Deeper resolution for combat and close dialogue (dice colour, reactive beats, joint clashes), and finer pscale windows so fast scenes resolve in shorter beats.
3. Phase 3 — the live canvas. xstream adds the liquid view, presence, and informed commit; real-time dialogue and combat become bearable. The same substrate, faster turnaround, the sighted-commit premium.
4. Phase 4 — federation and emergence. Worlds span beaches; reputations emerge from accumulated witnessed observation (the convergent I-coordinate); the build packages into a seed others fork; access hardens through CADO faces and tiers.

## 6 — Design discipline

*The discipline that keeps this minimal: let the structure do the work the code is tempted to do. Each principle below was bought with a mistake corrected.*

1. Maximise the blocks. Filtering, proximity, scope, and memory are properties of the pscale geometry, not of extra LLMs or prompts. When a tier seems to need intelligence, ask first whether a scoped read can carry it.
2. One resolver per window. Cross-player resolution was an over-complication — it raced, it leaked machinery, and it distracted players with others' events. One medium resolves; the steward covers availability; reciprocity and payment are far-later economics, not core mechanics.
3. The player session is pure soft. It commits and renders; it never resolves on a submit, and on a commit it triggers resolution but still shows only the narrated outcome. The machinery is always backstage.
4. Dice are individual outcomes inside a semantic synthesis. The medium composes the meeting of timed intentions; the dice modulate the individual results within that composition. The synthesis frames, the dice resolve; neither replaces the other.

## 7 — The load-bearing fork (objective vs subjective)

*The load-bearing fork — objectively-centred vs subjectively-centred, and the attractor that collapses one into the other. Branches 1-6 describe the OBJECTIVELY-centred realisation (one shared pool, one medium, one canonical solid, characters filter views) — what is built, and worth COMPLETING for a first invitable game. But the intended system is SUBJECTIVELY-centred: each user carries their own narrative, the medium writes relative to ITS character, there is no central canon. The two are different systems and cannot be evaluated against each other. This branch names the fork so that neither a fresh instance nor the author 'tidies' the distributed one back into the central one — the default gravity, because a single store makes coordination a cheap lookup while distributed makes it a correlation, which is work. Completing the objective version is shipping a simpler system honestly; the danger is mistaking it for the destination.*

1. Share the stage, distribute the play — the line to hold at every level. The STAGE is shared by agreement, not truth: the meeting-pool (where intentions land), the setting (spatial as agreed scaffolding, NOT an event-record), the rules (the agreed system). The PLAY is distributed and contested: what happened and what is perceived live as per-character narratives, N of them, correlated where characters co-perceive and divergent where they do not. The attractor-test, asked at every level: am I writing what-happened in ONE place? If yes, it has slid — split it into N.
2. Truth is negotiated when necessary, not stored. There is no master canon — there is the overlap of narratives (what they agree on) and the spread of their divergence (what stays contested). When two characters must act on a shared fact, their mediums and hard tiers correlate live to a shared-enough account, never against a stored master. This is narrative accuracy (native to LLMs and to people), not world accuracy (modelling real mechanics). The discrepancy is the substance, not an error to resolve away.
3. Frame at the medium, per character. Each character's medium writes that character's narrative from the shared pool of intentions, scoped at WRITE time — so the soft simply reads its own narrative, with no read-time filtering, no leak, and nothing to ignore. Not one central medium writing for all. Between mediums there is the thorny coordination: negotiation over who writes a shared beat first as provisional-canon, or convergence to a shared-enough account. That multi-medium negotiation is deliberately the locus of the hard work, not a thing to design away with a master.
4. Observer is correlation, not objectivity. Character (C) carries their own narrative. Observer (O) reads the correlation across narratives — common ground plus contest — which is 'closer to objective' only as inter-subjective variation from C, never a master truth. When two characters meet, each hard tier melds its spatial/narrative with the other's, sees correlation and difference, and decides to keep its own version or accommodate the other; it carries its own (C) and can switch to what-others-think (O). Correlation between players' C-narratives is itself distinct from an O-reading; all are derived, none absolute.
5. Clean semantic curation — one block, one semantic. The pool-9-as-metadata mixing (liquid at 1-8, meta at 9, contributions jumping to 11+) is bad design, the same subtle creep as the earlier _word-key insertion. Target: `pool:<name>` is PURE liquid (contributions at 1,2,3,..., nothing reserved); the engage-hint and the soft/medium/hard directives live in a separate `function:<game>` (or conventions) block, each a clean spindle that CARRIES the text itself, not an address. The primitive stays passive and may FOLLOW a ref from the pool's _ to bundle the hint into the envelope at delivery — clean storage, operational delivery. The discipline: walk the actual execution, not the intention — contamination enters as small insertions that look fine until walked.
6. Lineage and method. The original distributed framing lives in the early work (onen, the first xstream repo): contested narratives, variability-of-perception as the true condition, the soft-medium-hard triad PER USER. The DB era made it unwieldy; pscale blocks are light enough to operate and test the distributed model directly — that lightness is what finally makes it buildable. Going back to the drawing board means returning to that framing on the lighter substrate, not re-deriving the central shortcut.
