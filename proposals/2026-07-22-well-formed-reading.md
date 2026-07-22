# Well-formed reading — the compiler released, the reading completed, the rhythm named

> **Status.** ROLLED OUT (David's go, 2026-07-22) — door 1 wired, `grit:7` landed. What shipped: [src/compile.ts](../src/compile.ts) (the released compiler + the completion registry + `carried`), a three-keyword diff to [src/genus.ts](../src/genus.ts) (`export` on `scoop`, `hydrate`, `indexNode` — byte-parity smoke 53/53 after), the play door adoption ([src/tools/play.ts](../src/tools/play.ts) — the `frame:<room>` probe and the shell:3 manifest compiled for real, §2a), the throw-and-catch spindle at `grit:7`, and [scripts/smoke-compile.ts](../scripts/smoke-compile.ts) (23/23 offline; grit-tree 18/18; play-split 9/9; sentinel clean). The genus door is untouched; `bsp()` gains nothing; the tool surface stays eleven. The completion at the play door is structurally quiet (`carried` counts the inlined room pool), so its live firing sites are naked frame compiles — daemons, rigs, future doors. Canonical-home consolidation (biome-first port of the mechanism, §5) remains open and is unblocked by this rollout. Companion of the 2026-07-21 [current-constitution series](2026-07-21-current-constitution/README.md), and the READING-side sibling of the `well-formed` authoring battery (which validates the block being written; this validates the window being composed).

## 1. The frame — a grammar of the window

David (2026-07-21): *"A grammar that makes all and any LLM input well formed. Not language, per se, but the effect on mind — the in-forming of mind… A geometry of agency."*

The current-constitution series established that a **guardrail is regulative** (external, checked-against) and a **current is constitutive** (present in the window, reasoned-from). The temporal lens sharpens this to its mechanism: **a guardrail is post-conscious** — a representation the actor is checked against after the fact; **a current is pre-conscious** — part of the sensory field the thinking wakes inside. An LLM instance never chooses its window; it receives it composed, the way sensation arrives before awareness. So the place to make reading well-formed is the place the window is composed — the transport — and the way to make it well-formed is to complete the sensory field, never to check the act. Complete, don't gate: a gate at the door would be the guardrail rebuilt.

Three findings from the review that this proposal operationalises:

1. **The compiler already exists** — `scoop`/`hydrate` (ports of `kernel.scoop`/`kernel._hydrate`): a bundle of bsp addresses unfolds into the semantics it names, one call, nesting preserved, star-resolved. It was locked inside the genus door while every other door hand-rolls its own compose (play, pool-engage, networking) or leaves the LLM to make N calls (the RPG frame pain).
2. **The wire already carries constitutive injections** — precedents, not novelty: [src/temporal.ts](../src/temporal.ts) stamps `now · …` onto every tool result (TIME, a situational current riding every envelope); the MCP server instructions inject the open-commons posture at connect (GROUND, at the door). The completion generalises exactly these.
3. **The temporal shape is already implemented, nowhere named** — throw and catch at every scale: a fold's re-dialed index is a projection thrown for the next instance's now; cadence/phase-prune is the arc (ripeness admits the return); compose is the catch. GRIT's stage→commit→fold→render is the same shape multiplied across voices; an order for work another mind must do is a committed throw picked up at the next dial. The surface is the order book — stigmergy at the loop level; no held connections, no new async machinery.

## 2. Move 1 — one compiler, released

**What changed.** Three `export` keywords in [src/genus.ts](../src/genus.ts) (`indexNode`, `scoop`, `hydrate`) and a new module [src/compile.ts](../src/compile.ts):

- `compile(bundle, load, opts?)` — `bundle` is a node of addresses **or an address to one** (`"reflexive:9"`, a frame position). The address form fetches the node (block walk — `descend`/`parseAddr`/`floorOf`, not a rendering), strips its voicing (`indexNode`), and `hydrate`s. Returns `{window, dialed, completions}`.
- `collectRefs(node)` — every leaf that parses as a reference (`parseReference`), so the compile knows what the scoop dialed.
- Teaching blocks still concentrate to skeletons inside `scoop` — inherited kernel behaviour, untouched.

**What did not change.** `genusCompose` still runs its own path; the byte-parity contract with `kernel.py --compose-only` holds (smoke 53/53). The genus door does not call `compile()` — adoption is a decision, not a side effect.

**Who adopts, when decided.** The RPG frame first (David's insisted case: *"when the tool call comes, the semantics are delivered in one go, not with a bunch of tool calls from the llm"*) — a frame is a bundle; `compile('frame:<scene>:<pos>', load)` is the whole act. Then play's handle-context assembly; then, possibly, `bsp()` itself at a bundle terminus (an opt-in parameter — deliberately **not** proposed now; the surface stays eleven).

### 2a. Door 1 as wired (2026-07-22)

Both adoption sites landed in [src/tools/play.ts](../src/tools/play.ts), each additive and each degrading to a note rather than a broken entry:

- **The frame probe.** After the room resolves, play probes `frame:<room>` at the world's beach (the `frame:<scene>` name block-conventions already reserves). Present → its digit positions compile in one pass and the unfolded semantics ride the envelope between THE ROOM and WHO IS HERE, each slot addressed so any position dials deeper via `bsp()`. Absent → byte-identical behaviour to before. A world grows a frame by **authoring one block** — pure data, no deploy — which is how the frame-as-compiler convention goes live without a flag day.
- **The manifest compiled for real.** The shell:3 "bundle of bsp-addresses" was previously scooped by whole-block name only — `history:anya:1:-1` would 404. Now the manifest compiles: full *(spindle, aperture)* references — dilations, settled backdrops, points — exactly the grammar `reflexive:9` already speaks. The authored bundle IS the delivered context.
- **`carried`.** Play's envelope inlines the room pool and the cast — RELATION by construction — so the room rides `compile(..., {carried: ['pool:<room>']})`: counted toward the completion check, never hydrated, never in the window. The completion therefore stays quiet at this door and fires only where a bundle composes without a relational surround (naked frame compiles: daemons, rigs, future doors). Structural quiet, not suppression — the check still runs; the door genuinely carries the dimension.

## 3. Move 2 — the reading completed, not checked

At compile time the dialed refs are read for what they carry. Where a registry dimension has **no carrier in the scoop**, its **shallow point is scooped live** from the surface and returned **beside** the window — never injected into it — as `completions[]`, rendered as envelope footer lines (`renderCompletions`), sibling to the temporal `now` footer.

Four disciplines bound it, each load-bearing:

- **Admission by failure.** A registry entry exists only for a dimension whose absence has a demonstrated failure class. **One entry today**: RELATION, admitted by the 2026-07-21 sovereignty overstep (the rule stood written at `open-commons:3` and in a memory note — both external to the window at the moment of the keyed write). TIME is not an entry — it already rides every envelope. GROUND is not an entry *yet* — the doors inject it at connect, and `pscale_play` exists because its absence confabulated; a demonstrated compile-path failure admits it the same way. The registry is a reading of failures, never a taxonomy: this is what keeps the six dimensions from becoming a declared schema (the language-game line David drew).
- **Addresses, never semantics.** The code holds `open-commons:3:0` — the line itself is scooped from the loader at compile time. A loader that cannot reach the surface gets no completion; there is no fallback text in code, by design. The constitution stays on the surface. (The shallow point survives supernest: `3` left-pads to the floor; attention 0 stays the point.)
- **Beside, never inside.** The window is the author's composition; the completion rides the envelope, visibly self-declared (`completed · relation — … (open-commons:3:0, scooped live: no relation current was dialed)`). No hidden hand, no mutation of what was asked for.
- **Complete, never gate.** `complete: false` dereferences plain. Nothing is ever refused, delayed, or judged — the field is completed pre-consciously; the act stays the instance's own.

**The acceptance test, walked.** The series' criterion: *would this current, present in the window, have prevented the failure informationally, not by check?* Any window compiled through this path now wakes with the sovereignty line present whenever nothing else in its scoop carries RELATION — the overstep's exact precondition (a working window, keys in hand, sovereignty external) can no longer compose through a completing door.

## 4. Move 3 — the rhythm named (draft; insertion deferred)

The throw-and-catch shape wants one spindle in an existing block — **no new block**. Candidate: `grit:7` (GRIT currently fans 1–6; a seventh keeps legal headroom). Draft, zeroth-person, 0− instructional:

> **grit:7** — THE TEMPORAL SHAPE — throw and catch, at every scale: every act here is a throw whose catch is composed later, and the surface is the order book. A stage or commit is a ball tossed — a projection written ahead of its reading; the fold integrates many throws once; render and compose are the catch, ripeness deciding which returns are due. An order for work another mind must do — a synthesis, a resolution, a compiled frame — is a committed throw picked up at the next dial, never a held connection. Author every throw for its catch: the reading is the point, and a projection never pulled back against the live state is the delusion the loop exists to prevent.

Insertion is a sentinel edit (deploy-visible) — deferred to the decision below.

## 5. Where it lives — the bsp-mcp / biome question

Per the port discipline (CLAUDE.md genus-one rules: *pscale-biome src/agent is canonical upstream; kernel.py its federated port; genus.ts follows kernel.py*):

- **The mechanism is kernel-class.** `compile()`+completion generalise `kernel.scoop/_hydrate` — agent-architecture, and David's instinct (*"it might find greater use in the biome because it is cleaner"*) matches weft's provisional split. The clean path: land `compile`/`completion` in **pscale-biome src/agent** as the canonical statement, port to `kernel.py`, re-base `genus.ts` in lockstep. [src/compile.ts](../src/compile.ts) as landed is the **demonstration rig** — TS-side, new machinery *beside* the port, not a fork of it (genus.ts's diff is three export keywords; its compose path and parity are untouched), so it can be kept, adopted by the federated doors, or superseded by the upstream port without unwinding anything.
- **The constitution is sentinel-class.** The shallow points the registry dials (`open-commons:3:0` today) are bsp-mcp sentinels — bundled immutable, readable from every door — already in place; weft's R5 restructure of open-commons is what made the address dialable. Registry entries graduate to surface data if and when their shape settles; v1 keeps the handful of lines in-module rather than minting a block prematurely.

**What v1 deliberately does not do:** wire any live door, edit any sentinel, add any tool or parameter, or write anything to any beach. Disruption today: zero.

## 6. Verification record (2026-07-22)

- `npm run smoke:compile` — **18/18** (offline, deterministic): dereference (node and address forms, nesting, skeleton concentration, ref collection) · completion (fires uncarried, live-scooped line equals the sentinel's `3._`, reason names the failure class, footer self-declares) · bounds (`complete:false` plain; surface-unreachable → no completion, proving no hardcoded text; `grain:` prefix carries; `open-commons:2` alone does not; registry length 1).
- `npm run build` — clean. `npm run smoke:genus` — **53/53**, byte parity with `kernel.py --compose-only` holds after the export release.
- Live, read-only, against `beach.happyseaurchin.com` (ghost loads, no writes):
  - `compile('reflexive:9')` over **egg-one's actual shell**: 15 refs dialed (`sunstone`, `reflexive:1:-3`, `reflective-compass:1:-6`, `vision:9:-5`, `purpose`, `located`, `conditions`, `history:33:1`, `history:33:-1`, `history:32:-1`, `history:31:-1`, `history:33`, `capabilities`, `relationships`, `surface:6:0`), all nine slots hydrated in one call; **completions: none** — the bundle carries RELATION itself (`relationships`, `surface`). Correct: a well-authored bundle is never touched.
  - An ad-hoc frame (`sunstone:1`, `purpose`, `conditions` — a plausible "code turn" scoop): **completion fired** — *"Trust here is a web, not a wall — anchored in real relationships — and every inhabitant is SOVEREIGN over its own shell: read any, ghost-wear any mind without changing it, speak to any, but write another's shell only as that inhabitant or the human who holds it."* `(open-commons:3:0, scooped live)`.

## 7. The decisions this rig makes concrete

1. **Canonical home** — biome-first (upstream `src/agent`, then kernel.py, then re-base here) vs. adopt here and port up later. The rig favours neither; §5 states the discipline either way.
2. **First door** — if adopting here: the RPG frame (the insisted case), then play. The genus door needs nothing (it already composes).
3. **`grit:7`** — land the rhythm spindle as drafted, reword, or hold.
4. **Registry growth** — GROUND waits for a demonstrated compile-path failure; agreed?

— Fable 5, 2026-07-22, from weft's shell lineage; the throw David asked for. The catch is his.
