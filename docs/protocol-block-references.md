# Block references in hidden directories

**Status**: Convention, 29 April 2026
**Cross-reference**: [protocol-pscale-beach-v2.md](./protocol-pscale-beach-v2.md) §6, sunstone §5, [protocol-agent-shell.md](./protocol-agent-shell.md)

A hidden directory at any node in a pscale block can carry **block references** — strings whose value is the address of another block. The star operator follows them: walk to a node, enter its hidden directory, follow each reference, compose. This is the **composition operator** for pscale ecologies (sunstone §5).

This document defines the canonical string form for those references and the resolution rules that every star-walker (xstream-class clients, beach-crabs, kernel prompt-builders) follows.

---

## 1. Reference forms

A block reference is a string in one of these forms:

| Form | Example | Resolves to |
|---|---|---|
| URL | `"https://happyseaurchin.com"` | federated beach via WellKnownAdapter — `bsp(agent_id="https://happyseaurchin.com", block="beach")` |
| sed: address | `"sed:commons:14"` | `bsp(agent_id="sed:commons", block="commons", spindle="14")` — registrant declaration |
| grain: address | `"grain:abc123def456:1"` | `bsp(agent_id="grain:abc123def456", block="grain", spindle="1")` — side content |
| qualified | `"weft:purpose"` | `bsp(agent_id="weft", block="purpose")` |
| qualified-with-spindle | `"weft:memory:1.3"` | `bsp(agent_id="weft", block="memory", spindle="1.3")` |
| bare name | `"purpose"` | `bsp(agent_id=<containing agent>, block="purpose")` — SAME-AGENT FALLBACK |

Resolution is by string-prefix dispatch:

1. `https://` or `http://` → URL form
2. `sed:` → sed: address (3 colon-separated parts)
3. `grain:` → grain: address (3 colon-separated parts)
4. Contains `:` and not one of the above prefixes → qualified `agent_id:block[:spindle]`
5. No `:` → bare name → same-agent fallback

The `parseStar()` helper in `src/bsp.ts` covers cases 4–6; cases 1–3 are handled by the substrate dispatch (`isFederatedOwner`, `addr.startsWith('sed:')`, `addr.startsWith('grain:')`).

---

## 2. Same-agent fallback

A bare name in a hidden directory resolves against the agent_id of the **block that contains the reference**. So if `weft:agent` has `_.1 = "purpose"`, that resolves to `bsp(agent_id="weft", block="purpose")`. The walker passes the containing agent's agent_id through.

This makes most agent-internal star refs (manifest pointers, cross-block links within one agent's shell) trivially short. It also makes them brittle if the block is later read out of context — bare names are not portable. Use qualified form for any reference that crosses agent boundaries.

---

## 3. Star-walk algorithm

Pseudocode for what an xstream prompt-builder or beach-crab does when it follows a star ref:

```
function resolveStarRefs(agent_id, block_name, address):
  result = bsp(agent_id, block_name, spindle=address+"*", pscale_attention=null)
  if result.shape != 'star' or result.star.inner == null:
    return []
  hidden = result.star.inner
  resolved = []
  for digit in '1'..'9':
    if not hidden[digit]: continue
    ref = hidden[digit]
    if not isString(ref): continue   // inline blocks handled separately
    resolved_block = resolve(ref, containing_agent_id=agent_id)
    if resolved_block: resolved.push({digit, ref, block: resolved_block})
  return resolved

function resolve(ref, containing_agent_id):
  if ref starts with "http://" or "https://":
    return bsp(agent_id=canonicalise_origin(ref), block="beach")
  if ref starts with "sed:":
    [_, collective, position] = split(ref, ":", 3)
    return bsp(agent_id="sed:"+collective, block=collective, spindle=position)
  if ref starts with "grain:":
    [_, pair_id, side] = split(ref, ":", 3)
    return bsp(agent_id="grain:"+pair_id, block="grain", spindle=side)
  if ref contains ":":
    parts = split(ref, ":", 3)
    if length == 2: return bsp(agent_id=parts[0], block=parts[1])
    if length == 3: return bsp(agent_id=parts[0], block=parts[1], spindle=parts[2])
  // bare name — same-agent fallback
  return bsp(agent_id=containing_agent_id, block=ref)
```

A walker that wants RECURSIVE composition (refs in the resolved block's hidden directory get followed too) wraps this in a loop with cycle detection.

---

## 4. Inline blocks vs string references

A hidden directory entry can be:
- **A string** (block reference, per §1)
- **An inline pscale block** (a nested object that is itself a block — no separate fetch needed)

Walkers test by type. Strings → resolve. Objects → walk in-place. This lets a block carry small embedded sub-blocks without paying the cost of a separate fetch, while still allowing externalised references for larger or shared blocks.

---

## 5. Mutability and dynamic wiring

Hidden directory entries are ordinary block content. They can be written via `bsp()` like any other position. This means an agent block's wiring can be UPDATED at runtime — for example, when an xstream user navigates to a different beach:

```
bsp(agent_id="<user>", block="agent",
    spindle="0.1", content="https://new-beach.example.com",
    secret="<user's shell lock>")
```

The agent block remains the source of truth for wiring; it just gets edited as context changes. Locked agent blocks require the secret as proof.

---

## 6. Why this matters

The block-reference convention is what makes pscale a COMPOSITION SYSTEM rather than a flat block store. With this convention:

- **Agents wire themselves to ecologies in DATA**, not in code.
- **Cross-substrate composition is uniform**: a sed: position can reference a grain-side, which can reference a federated beach block, which can reference an inline sub-block — all through the same star-walk algorithm.
- **Walkers don't need a registry**. They follow strings; the substrate adapter dispatches by prefix.
- **Dynamic context** (the user's current beach, the active grain partner, the relevant collective) lives as ordinary block content that gets edited as state changes.

This is the operational realisation of *"the structure does the work"* — wiring stops being build-time TypeScript and becomes substrate-walked at runtime.

---

## 7. Beach sibling discoverability — the canonical use of hidden-directory references

The same hidden-directory + star-walk mechanism solves "what other blocks does this origin host?" without any new endpoint or protocol. Convention:

A beach that hosts sibling blocks at the same origin (per [protocol-pscale-beach-v2.md](./protocol-pscale-beach-v2.md) §3.5) lists those siblings in the beach's root-underscore hidden directory using the standard reference forms from §1:

```json
{
  "_": {
    "_": "Beach at hsc.com — public commons. Open by default.",
    "1": "sed:hsc-commons",          // site-hosted sed: collective
    "2": "frame:scene-thornkeep",    // a scene frame (xstream-class)
    "3": "book-club",                // a named pool (bare name → same agent_id, i.e. https://hsc.com)
    "4": "https://other-site.com"    // a reference OUT to another origin's beach
  },
  "1": { ... marks ... },
  "2": { ... conversations ... },
  "3": { ... reaches ... }
}
```

A walker discovering siblings calls:

```
bsp(agent_id="https://hsc.com", block="beach", spindle="0*", pscale_attention=null)
```

The star walk enters the root underscore's hidden directory and returns its contents. Each digit child is a string per §1 — qualified, sed:, grain:, URL, or bare name. The walker resolves each via the standard dispatch (§3) and follows. Sibling blocks at the same origin resolve by appending `?block=<name>` to the same `.well-known/pscale-beach` endpoint.

A beach with no siblings has a plain string underscore (no hidden directory). The walker's `getHiddenDirectory(terminal)` returns null; nothing to follow. Backward-compatible — existing single-block beaches need no change.

**This is the canonical discoverability pattern.** No `/index` endpoint. No `?list=true` query. No new convention. Just the same star-walk machinery used for agent shells, cross-block composition, and reflexive seeds in sunstone. Walkers that already follow stars (xstream prompt builders, beach-crabs) get sibling discovery for free.
