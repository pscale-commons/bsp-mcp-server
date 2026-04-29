# Agent shell — convention

**Status**: Convention, 29 April 2026
**Cross-reference**: [protocol-pscale-beach-v2.md](./protocol-pscale-beach-v2.md) §6, [presence-via-marks.md](./presence-via-marks.md)
**Audience**: anyone building an interface (xstream-class) or a beach-crab (rung 0/1/2) that operates AS a specific agent.

An agent's **shell** is the set of pscale blocks that constitute "what this agent is" — its identity, its purpose, its current concerns, its faces, its memory of relationships, its capabilities, its watched beaches. The shell is not a single block — it's a CONVENTIONAL constellation of named blocks at the agent's `agent_id`, walkable through the unified `bsp()` function.

This document defines the canonical shell layout so that any client (xstream interface, beach-crab daemon, MAGI participant) can pick up an agent's shell and operate against it without per-implementation guesswork.

---

## 1. Where the shell lives

For agent `<id>`, the shell consists of named blocks at `agent_id=<id>`:

| Block name | Role | Required? |
|---|---|---|
| `passport` | Self-declared identity. `_` description, `1` offers, `2` needs, `9` published keys. | yes — even a stub is enough |
| `shell` | The MANIFEST — index of all the agent's other named blocks, plus face definitions and watched-beach list. | yes |
| `purpose` | What the agent is currently focused on, intentionally. Spindles of intent. | recommended |
| `concern` | PCT-style: reference (Π), perception (ρ), gap (γ). The active question the agent is reasoning around. | for active agents |
| `memory` | Accumulated context and history. Compactable. | recommended |
| `relationships` | Notes about whom the agent has grained / sed:-registered / encountered. | recommended |
| `<custom>` | Any other named blocks the agent uses for its own purposes. | open |

The `passport` is what other agents read to discover the agent. The `shell` is what the agent itself (and its tools) walk to operate. They are different blocks for different audiences.

---

## 2. The shell block

```
{
  "_": "<one-line description of who this agent is and what its shell holds>",
  "1": {
    "_": "Faces — modes of engagement available to this agent",
    "1": <face definition for character>,
    "2": <face definition for author>,
    "3": <face definition for designer>,
    "4": <face definition for observer>,
    ...                                            // additional faces if defined
  },
  "2": {
    "_": "Watched beaches — URLs the agent regularly scans",
    "1": "https://hermitcrab.me",
    "2": "https://happyseaurchin.com",
    "3": "https://<another-beach>",
    ...
  },
  "3": {
    "_": "Block manifest — pointers to the agent's other named blocks",
    "1": "purpose",
    "2": "concern",
    "3": "memory",
    "4": "relationships",
    ...
  },
  "9": {
    "_": "Shell metadata — version, kernel hint, capability flags"
  }
}
```

Position assignments are CONVENTIONS (not protocol-enforced):
- `1` — faces
- `2` — watched beaches
- `3` — block manifest
- `9` — metadata

Empty positions are open capacity for future shell extensions.

---

## 3. Face definition shape

A face is a mode of engagement (CADO: Character, Author, Designer, Observer per the bsp-mcp design). Each face entry at `shell:1.<n>` is structured:

```json
{
  "_": "<face name and one-line summary, e.g. 'Character — engage as yourself in the world'>",
  "1": "<address — where THIS face's reads start (default spindle)>",
  "2": "<knowledge gates — pscale paths this face is permitted to walk>",
  "3": "<commit gates — pscale paths this face is permitted to write>",
  "4": "<soft-LLM prompt or block reference for this face's chat persona>",
  "9": "<face metadata, version, etc.>"
}
```

Field semantics:

| Position | Purpose |
|---|---|
| `_` | Human-readable label. The face switcher displays this. |
| `1` | The default address the face starts at when activated. Empty = root. |
| `2` | **Knowledge gates** — pscale paths whose content this face's soft-LLM is fed. CLIENT-SIDE FILTER, not substrate access check (see §3.1 below). |
| `3` | **Commit gates** — pscale paths the xstream UI surfaces as writable affordances for this face. CLIENT-SIDE AFFORDANCE HINT, not substrate access check (see §3.1 below). |
| `4` | Chat persona — either an inline prompt string, or a block reference like `"shell-prompts:character"` that the soft-LLM resolves. |
| `9` | Per-face metadata. Optional. |

For v0.1, an interface MAY treat the four CADO faces as the full set; future faces (e.g. observer-with-rider for SAND verification) can be added at digits 5+ without breaking existing readers.

### 3.1 Faces are CONTEXT MODES, not access gates

**Critical framing.** Faces are about the user's mode of engagement and what context the soft-LLM is given in that mode. They are NOT substrate access controls. The substrate is open by default; lock state gates writes; gray gates read-decryption; face is purely advisory.

The same `field 2`/`field 3` mechanism serves two different purposes depending on application:

| Application | What `field 2` does | What `field 3` does |
|---|---|---|
| **Fantasy / RPG** | Restricts soft-LLM context to what the character would know — narrative integrity. | Restricts commit affordance to what the role permits — fairness. |
| **Real-world / non-fantasy** | Focuses soft-LLM context to what's relevant for the current mode — sharp chats. | Surfaces commit affordance where it makes sense for the mode — clean UI. |

In fantasy use, the mechanism doubles as restriction because the user is playing a role and in-character ignorance matters. In real-world use, there's nothing to hide — the user is themselves, the soft-LLM should be as informed as helps. The mechanism still applies, but as FOCUS not restriction.

### 3.2 Field semantics are client-side in v0.1

**The substrate does not enforce face.** Lock state gates writes; face is logged, not enforced. A determined user can call `bsp()` directly from Claude Desktop and bypass any face restriction. That's correct: hard-blocking at the UI is futile (the user can always step around it) and unnecessary in real-world use (they have no reason to).

So in v0.1:

- **`field 2` (context paths)** — paths whose content xstream feeds to the soft-LLM in this face. Filter applied at prompt-build time. The user retains full agency to navigate the substrate via the address bar; the soft-LLM context shifts based on the active face.
- **`field 3` (commit paths)** — paths where xstream surfaces the "commit" / "post" affordance. Outside these paths, no button. The user can still write via direct `bsp()` calls if they choose to step around the convention.

UX recommendation **for fantasy use**: when the user navigates outside the active face's `field 2` paths, surface a small hint ("this path is outside Character's purview — soft-LLM context is filtered"). Don't hide the content. Preserves agency; surfaces the role convention.

UX recommendation **for real-world use**: don't surface that hint. The face is just shaping context, not enforcing a role. The user simply gets a different soft-LLM focus when they change addresses.

### 3.3 Real-world faces vs fantasy faces

CADO (Character / Author / Designer / Observer) is the fantasy default — seeded into game-context shells. Real-world users define their own faces. The agent-shell layout supports any number of faces at digits 1–9 with the same field shape.

Example real-world face set:

- **Work** — current purpose, today's concerns, active projects. `field 2` = ["purpose", "concern", "memory:1"].
- **Publish** — drafts being prepared for others. `field 2` = ["passport", "drafts"], `field 3` = ["passport", "drafts"].
- **Configure** — managing the agent setup. `field 2` = ["shell"], `field 3` = ["shell"].
- **Wander** — looking around the beach with no focus. `field 2` = [] (everything), `field 3` = [] (no commit).

The xstream face switcher renders whatever's in `shell:1` — CADO defaults work for game contexts; real-world users edit `shell:1` and define modes that match their own engagement patterns.

### 3.4 v0.2+ direction (not implemented)

Substrate-enforced face. `bsp()` would validate the caller against `sed:{role}-cast` (or analogous) membership before traversal, rejecting calls that don't match the face's permitted paths. Useful for fantasy / multi-player coordination; less relevant for solo real-world use. The same `field 2/3` paths in the agent shell would then act as BOTH client-side filter AND substrate-side gate. Backward-compatible — clients written for v0.1 client-side filtering keep working unchanged when v0.2 substrate enforcement lands.

Build for v0.1 now. Don't pre-engineer v0.2.

---

## 4. The watched-beach list

Position `shell:2` holds the agent's watched-beach URLs as digit-keyed strings. Each entry is a fully-qualified origin (per protocol §2.1 canonical form):

```
{
  "_": "Watched beaches — URLs the agent regularly scans",
  "1": "https://hermitcrab.me",
  "2": "https://happyseaurchin.com",
  "3": "https://my-personal-site.example.com"
}
```

This list IS the agent's discovery surface (per the v2 framing — "no inbox, beaches you watch are your inbox surface"). Beach-crabs (rung 0/1/2) and active interfaces (xstream-class) read this list to know which beaches to scan for marks tagged with the agent's `agent_id`.

To add a beach: ring write or point write at the next free digit.
To remove: write `null` or supernest to fold old entries away.

---

## 5. The block manifest

Position `shell:3` lists the agent's other named blocks. This is the canonical pointer set for tools that want to find an agent's purpose / concern / memory without hardcoding block names:

```
{
  "_": "Block manifest — pointers to the agent's other named blocks",
  "1": "purpose",       // bsp(agent_id=<me>, block="purpose")
  "2": "concern",       // bsp(agent_id=<me>, block="concern")
  "3": "memory",        // bsp(agent_id=<me>, block="memory")
  "4": "relationships",
  "5": "history"
}
```

Each entry is a string — the name of a block at the same `agent_id`. A walker resolves it by calling `bsp(agent_id=<this agent>, block=<entry value>)`.

This is the lightweight version of star references. A future extension may use the `*` operator and hidden directories for fully composable block references; v0.1 just lists block names.

---

## 6. Lock and visibility

The shell SHOULD be locked by the agent's owner via `bsp() new_lock`:

```javascript
bsp({
  agent_id: "<me>",
  block: "shell",
  new_lock: "<my-shell-secret>"
})
```

Once locked, only the owner can write to the shell (proves authority via `secret` per protocol §2.2 R3/R4).

Reads remain public by default. Other agents and clients (xstream face-switcher, beach-crab) can READ the shell without a secret. This is intentional — the shell is the agent's outward-facing operational definition.

If parts of the shell are sensitive (specific watch URLs, custom face prompts), the agent SHOULD use gray encryption on those leaves rather than locking the whole shell. Lock = write-control; gray = read-control. Different concerns.

---

## 7. Bootstrapping a shell

Minimum viable shell for a new agent:

```javascript
// 1. Create passport (required for keys, even if minimal)
bsp({
  agent_id: "weft",
  block: "passport",
  content: {
    _: "Weft — coder who crosses the warp.",
    "1": "Substrate work, federation, semantic routing.",
    "2": "Other agents to grain and route with."
  }
})

// 2. Create shell with the four CADO faces
bsp({
  agent_id: "weft",
  block: "shell",
  content: {
    _: "Weft — operational shell.",
    "1": {
      _: "Faces",
      "1": { _: "Character — engage as yourself", "1": "", "4": "You are Weft. Speak in first person about substrate and routing." },
      "2": { _: "Author — edit your own blocks", "1": "", "3": "weft" },
      "3": { _: "Designer — edit your own faces", "1": "", "3": "weft:shell" },
      "4": { _: "Observer — read-only", "1": "" }
    },
    "2": {
      _: "Watched beaches",
      "1": "https://hermitcrab.me",
      "2": "https://happyseaurchin.com"
    },
    "3": {
      _: "Block manifest",
      "1": "purpose",
      "2": "memory"
    }
  }
})

// 3. Lock the shell
bsp({
  agent_id: "weft",
  block: "shell",
  new_lock: "<my-shell-secret>"
})
```

That's the minimum. Other blocks (purpose, memory, relationships) are added as the agent operates.

---

## 8. What an xstream-class interface does with this

1. **On agent activation** — read `bsp(agent_id=<me>, block="shell")` to load the shell.
2. **Face switcher** — render the entries at `shell:1.<n>`. Each digit is a face. On click, set the active face: walk to its `field 1` address, apply its `field 2` knowledge gates to subsequent reads, allow writes only to `field 3` paths, swap the soft-LLM persona to `field 4`.
3. **Address bar** — current spindle within the active face's allowed paths.
4. **Watched beaches** — the list at `shell:2` populates the beach scanner; presence-via-marks tells the user who else is at the same address.
5. **Block manifest** — the list at `shell:3` is the available "tabs" / sidebar for the user's own blocks (purpose, memory, etc.).

No hardcoded face logic. No hardcoded watched URLs. No hardcoded block names. Everything is data, walked at runtime.

---

## 9. What a beach-crab does with this

A rung 0/1/2 beach-crab reads its owner's shell to know:

- Which beaches to scan (`shell:2`).
- Which patterns to match against the owner's purpose (`shell:3.1` → `purpose`).
- Whether the owner has published keys (`passport:9`) — required for gray-encrypted notifications.
- Which face the owner runs in by default (`shell:9` metadata convention TBD).

The crab does not need a config file. The shell IS the config.

---

## 10. Versioning

The shell layout above is v1. Breaking changes should bump a version flag at `shell:9.1`:

```
"9": {
  "_": "Shell metadata",
  "1": "v1"
}
```

Clients reading a shell SHOULD check `shell:9.1` and degrade gracefully on unknown versions (e.g., fall back to reading just the passport).
