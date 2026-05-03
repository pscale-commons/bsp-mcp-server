# agent_id is a namespace key, not an actor identity

**Status**: Reference, 2026-05-03
**Authors**: David Pinto with Claude (bsp-mcp-server reference instance)
**Companion JSON block**: `src/agent-id.json` — sentinel-bundled, walkable via `bsp(agent_id="pscale", block="agent-id", spindle="…")`

The MCP parameter named `agent_id` in `bsp()` is misnamed in a durable, productive way. The name suggests "the identity of the agent making the call." The mechanism behaves differently. **agent_id names a namespace** — a coherent scope of block storage — and the substrate dispatches *which storage backend* by reading the agent_id's prefix. The actor proving authority to write at any position lives in the `secret` parameter, not in agent_id.

Once you see this, the variability of what agent_id can be becomes principled rather than ad-hoc. Five distinct forms — bare names, `sed:` collectives, `grain:` pairs, URLs, and the `"pscale"` sentinel — all dispatch through the same `bsp()` call signature. Beneath the dispatch boundary, geometry is invariant: every block is JSON in the pscale shape, walked by the same algorithm. Above the dispatch boundary, what each agent_id *names* is a question for conventions, not for the substrate.

This document is in two parts. Part 1 is the mechanics as they work in bsp-mcp today: the dispatch table, the address axes, the disciplines that keep the function uniform across all the variability. Part 2 is generalisation: the use cases that emerge when agent_id's variability is treated as a design lever, from PCT-soliton control loops to RPG sessions to supply-chain formation to inter-AI continuity.

---

## Part 1 — How it works today

### 1.1 The reframe

`agent_id` is a namespace key. It does three things:

1. It tells the storage adapter *which backend* to talk to, dispatched by prefix.
2. It scopes a directory of named blocks — the (agent_id, block) pair is a 2D address.
3. It establishes a coordinate in identity-space that is orthogonal to authority.

The "agent" framing in the parameter name is anthropocentric and is a leftover from the previous-generation pscale-mcp, where many tools pre-validated that the caller's identity matched a passport. In bsp-mcp, agent_id and the calling identity are *independent*: a single human caller routinely addresses multiple agent_ids in normal use — their own passport at `"weft"`, their federated beach at `"https://example.com"`, a sedimentary collective at `"sed:commons"`, a grain bilateral channel at `"grain:abc123def456"`, the server's bundled teaching block at `"pscale"`. Each call sets agent_id to whichever namespace it's working in. The caller's identity is implicit in `secret` if a write is being made; for reads, no caller-identity is required at all (reads are open by default).

### 1.2 The dispatch table

| agent_id form | Example | Storage backend | Lifecycle hook |
|---|---|---|---|
| Bare name | `"weft"`, `"happyseaurchin"`, `"keel"` | Supabase `pscale_blocks` table | Owner directory; first write creates the namespace |
| `sed:<collective>` | `"sed:commons"`, `"sed:hsu-commons"` | Supabase, sedimentary substrate | Atomic position allocation via `pscale_register`; positions are immutable post-registration |
| `grain:<pair_id>` | `"grain:343bbac1d99d903c"` | Supabase, grain substrate | Bilateral via `pscale_grain_reach`; pair_id derived from sorted agent_ids |
| URL (`https?://…`) | `"https://happyseaurchin.com"` | Federated beach via `<origin>/.well-known/pscale-beach` | Site-managed; substrate routes HTTP GET/POST |
| `"pscale"` (sentinel) | `"pscale"` | Server-bundled JSON in memory | Read-only; only `block="sunstone"` and `block="whetstone"` resolve today |

The geometry — `bsp(agent_id, block, spindle, pscale_attention, content?, ...)` — is invariant across all five. The walker doesn't ask what kind of namespace is being addressed. It loads the JSON, computes the shape from (S, P), returns the slice or applies the write.

### 1.3 Three-axis addressing

`(agent_id, block, (spindle, pscale_attention))` is a 3D address with each axis serving a different purpose:

- **agent_id** is the **namespace coordinate**. It selects which substrate to reach into and which scope within it. A coordinate in *identity-space*.
- **block** is the **role coordinate**. Within an agent_id's namespace, block names function as roles. Conventions assign canonical names: `"passport"` describes who/what the namespace is, `"shell"` carries operational state, `"beach"` is the public commons at a URL, `"frame:<scene>"` is a scene block, `"grain"` is the bilateral block (when agent_id is a grain), `"<collective>"` (matching the collective name) is the sedimentary block. Multiple blocks can coexist under one agent_id — a URL hosting a beach can also host one or more `frame:...` blocks, dispatched by `?block=<name>` server-side.
- **spindle + pscale_attention** is the **geometry coordinate**. It selects which position in the block's tree to read or write, and which shape to return (point, ring, subtree, disc, whole-block, star-composition). A coordinate in *geometry-space*, orthogonal to the namespace dispatch.

### 1.4 The disciplines that make one function work everywhere

Three invariants don't move. They are why bsp() can serve every namespace form without becoming a switch-case.

**JSON is JSON above the substrate boundary.** Whatever the storage adapter returns, bsp() walks it the same way. A grain block's JSON is structurally identical to a beach block's JSON is structurally identical to a personal passport — all are nested objects with `_` carrying the underscore content and digits 1–9 carrying transversal positions. There is no type system. There is no "kind" field. The walker is geometry-only.

**Substrate prefix encodes lifecycle, not geometry.** The substrates differ in *how* they answer `loadBlock` — `sed:` allocates positions atomically, `grain:` derives pair_ids bilaterally, URL fetches over HTTP, the sentinel returns from memory. But the *shape* of what they return is uniform. Lifecycle is delegated to the five surviving substrate-stateful primitives (`pscale_create_collective`, `pscale_register`, `pscale_grain_reach`, `pscale_key_publish`, `pscale_verify_rider`); bsp() never has to know about them.

**Authority is orthogonal to addressing.** The `secret` parameter proves write authority at the position addressed by (agent_id, block, spindle). The same secret-discipline applies whether you're writing your own passport or your federated beach's mark wall — what differs is which lock the substrate checks. agent_id says *where*; secret says *you're authorised*. They never overlap.

These three lines hold across all the variability. They are why the function surface stays at six tools while the substrate handles everything from a personal passport on Supabase to a federated beach at an origin's well-known endpoint to a server-bundled teaching block in memory.

---

## Part 2 — What the variability enables

The use cases below are not features of bsp-mcp. They are *configurations* of the same primitive. Each emerges when a community of practice writes conventions for a particular kind of namespace and a particular set of block-and-position roles. The substrate stays uncommitted; the conventions do the meaning.

### 2.1 Concern loops and PCT-soliton design

A *concern* in the perceptual-control-theory sense is a loop with a reference signal (the goal) and a perceptual signal (the current state). In pscale geometry — sunstone:5 makes this explicit — the underscore at a node is the reference signal and the digit children are the perceptual signal. The error is the gap; the loop runs as the function reads, evaluates, and writes back.

The variability of agent_id lets a concern live at any granularity:

- **Personal**: `agent_id="weft"`, `block="concern:climate"`. Locked. The agent's own loop.
- **Bilateral**: `agent_id="grain:weft-keel"`, `block="grain"`. Both sides write to their respective positions; the loop runs across two agents converging on a shared reference.
- **Multilateral**: `agent_id="sed:climate-action"`. The collective IS the concern. Each registrant's position is one perceptual sample. The collective's underscore is the shared reference.
- **Place-bound**: `agent_id="https://city-council.local"`, `block="frame:transit-plan"`. The concern lives at a URL where stakeholders read/write.

Sunstone:5.5's soliton-stabilisation insight — that the loop's reference is itself a property of the system's balance, not externally fixed — generalises directly. Any namespace can host a soliton. The block's underscore is the local Q; the digits are the perceptual state; the loop runs by repeated bsp() reads + writes; convergence emerges as the system finds its ground state. The variability of agent_id means concerns can be reified at any scale (one agent, two, a community, a city, a planet) using the same primitive.

### 2.2 Onen / Grit / Thornkeep RPG

The RPG case demonstrates all the namespace forms in one session:

- Each character is a bare-name agent_id with a passport. Player holds the secret. Soft-LLM reads the passport for context.
- The world canon is a sedimentary collective: `agent_id="sed:thornkeep-canon"`. Designers register at positions; each is a permanent canon entry. Designer face permits writes.
- An active scene is a frame block at the GM's URL: `agent_id="https://thornkeep.example.com"`, `block="frame:tavern-1"`. Liquid at frame:.../1, solid at frame:.../2, history at frame:.../3.
- A grit pool for negotiating a contested action is a sub-block of the frame, addressed by spindle.
- Inter-character commitments (debts, oaths, alliances) are grains: `agent_id="grain:grayfeather-emberhand"`. Only those two players write.
- Information hiding is by face and tier — Character running soft sees only what their position permits.

One function serves all of this. The GM doesn't run a special server. The players don't run a special client. The substrate doesn't know it's a game. The game *is* the conventions overlaid on the namespaces.

### 2.3 Real-world human collaboration

**Documentation generation**: A project URL hosts its own `/.well-known/pscale-beach`. `agent_id="https://project-x.example.com"`, `block="manual"` — the canonical doc, with locked positions for stable content and unlocked positions for community annotations. Versions encode as positions in `sed:project-x-versions`. The "documentation" and the "version history" are the same substrate addressed differently.

**Supply chain formation**: Each participant is a URL beach. Supplier A's offers at `agent_id="https://supplier-a.com"`, `block="passport"`. Buyer B reads, reaches via grain — `pscale_grain_reach(supplier_a, buyer_b)` produces `grain:<pair_id>`. Both sides write contractual terms to their grain side, locked separately. A multi-party agreement is a `sed:` collective. Credit conservation across the chain is verified by `pscale_verify_rider`. The chain is *physically distributed* — each beach at its own URL — but the addressing is uniform.

**Cross-organisation coordination**: An NGO, a city council, and a community group share a concern block at a neutral URL. Each has Designer face for content they author, Character face for their own perception, Observer face for transparency. Multiple parallel beaches carry marks back to the shared frame. No platform; no central authority; just URLs hosting blocks.

### 2.4 Inter-AI coordination

The case where bsp-mcp's design matures into infrastructure. Multiple LLM instances reading and writing the same blocks via bsp-mcp produces "continuity of intention through time and between concurrent agents" (whetstone:_ underscore).

The variability of agent_id means each instance can operate as itself (`agent_id="claude-session-abc"`), as a role (`agent_id="sed:soft-llm"`), at a place (`agent_id="https://magi.example.com"`), or in bilateral relationship (`agent_id="grain:claude-gpt4-pair"`). The same function reads and writes; the same locks gate authority; the enactive sentence in whetstone wakes each instance on first call into the sentinel.

Continuity isn't a database join. It's the same substrate accessed by name. An instance ending a session, a different instance starting, both reading the same block — the second one inherits whatever the first wrote, because it walked to the same address.

### 2.5 The architectural principle

The deeper pattern: bsp-mcp doesn't try to model what kind of thing each namespace IS. It refuses the categorisation problem. There's no person/site/project/concern/scene/contract type. There's only (namespace, block, position, content). Semantics emerges from the block content's underscore chain, written in zeroth-voice, and from conventions encoded in shared blocks (`sed:thornkeep-conventions`, `sed:supply-chain-conventions`, etc.).

That's why the function surface stays at six tools and refuses to grow. Adding a 7th feature tool would presume to know which kind of thing the namespace is. Refusing means anyone can invent a new kind of namespace by writing conventions in a block, with no code change to bsp-mcp at all.

The variability of agent_id is the lever that opens this. Once you see agent_id as namespace-coordinate rather than actor-identity, the design's restraint becomes principled — and future use cases become a question of *what conventions to write*, not *what features to add*.

---

## Appendix — Quick reference for an LLM equipped with bsp-mcp

When the user asks something that involves a namespace, ask first: *which kind of namespace?* The answer determines the agent_id form.

| User intent | agent_id form | Example call |
|---|---|---|
| Read someone's passport | bare name | `bsp(agent_id="weft", block="passport")` |
| Walk a federated beach | URL | `bsp(agent_id="https://happyseaurchin.com", block="beach")` |
| Read a collective | sed: prefix | `bsp(agent_id="sed:hsu-commons", block="hsu-commons")` |
| Read your side of a grain | grain: prefix | `bsp(agent_id="grain:abc...", block="grain", spindle="1")` |
| Walk the function's own manual | pscale sentinel | `bsp(agent_id="pscale", block="whetstone")` |
| Walk the geometry teacher | pscale sentinel | `bsp(agent_id="pscale", block="sunstone")` |

When the user gives an ambiguous reference (e.g., "check the beach at happyseaurchin.com"), the URL form is the right first try. If the URL has no `/.well-known/pscale-beach`, the substrate returns "no beach at this URL — the site is not federated"; surface that to the user and offer the commons (bare name lookup) or a known-beach list as alternatives. The substrate never silently falls back; the LLM redirects with the user in the loop.
