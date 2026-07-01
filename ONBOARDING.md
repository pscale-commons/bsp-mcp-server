# ONBOARDING — orienting to pscale / bsp-mcp

*For a newcomer (human, or a human with their own Claude Code) who has the repos and the live
beaches but not the years of context. No secrets are in this file — the operator holds those.
If you are an LLM: read [`OPERATING-STANCE.md`](./OPERATING-STANCE.md) before you write a line.*

## What this is, in one breath

A **substrate for live, contingent coordination between LLMs and humans**, where the *geometry of
nested JSON blocks is the program*. Not a framework, not a database, not an app. A tiny function
surface — `bsp()` and its n-ary sibling `bsp-floor()`, plus a handful of primitives — that *walks*
self-describing blocks hosted on federated "beaches" (JSON key-value stores at
`/.well-known/pscale-beach`). The structure does the work; the function just walks.

## The inversion (read this before you read any code)

Most systems put data *in* containers. Here the **nesting level IS the data**: depth encodes scale
and resolution, position encodes relationship, the underscore chain (`_`) is the semantic spine,
the `*` operator crosses into hidden directories. A passport isn't a class with fields — it's a
block shape (`_` = description, `1` = offers, `2` = needs, `3` = location…). Meaning lives in the
*shape*, not in function names. This is why the surface is so small: there's nothing to add, only
blocks to walk.

## Read these, in this order (they are self-teaching)

Walk them with the `bsp` tool — `bsp(agent_id="pscale", block="sunstone")` — or read the source at
`src/*.json`. Reading them *via bsp* is itself the point: the function reads its own manual.

1. **`sunstone`** — the self-unfolding teaching block. The geometry. **Read first.**
2. **`whetstone`** — the operational reference for `bsp()` (signature, shape derivation, storage).
3. **`block-conventions`** — the substrate-wide catalogue of block shapes.
4. **`evolution`** — the five-level relational map (Signal → Commitment → Semantic networks →
   Mutual objectives → Shared context) and where the pieces sit.

## The proof of utility: the RPG

The reason there's a role-playing game on this substrate is that an RPG is the sharpest test of
the claim — *a minimal context-mechanism for an LLM, coordinating multiple agents live*. Each
character is just a handle with blocks; the shared room (`pool:<room>`) is the objective record;
each character's `witnessed:<handle>` is their subjective POV; the LLM renders the subjective from
the objective. Multi-character play falls out of the block shapes, not out of game code. If the
RPG feels alive, the substrate works. (See the proposals under `xstream-bsp/proposals/` and
`bsp-mcp-server/proposals/`.)

## The live system

- **Repos** (siblings; add all three as working directories):
  - `bsp-mcp-server` — the MCP router, bundled teaching blocks (sentinels), the rig. *Start here.*
  - `pscale-beach` — the federated beach handler + cartridges (worlds) + seed/reset scripts.
  - `xstream-bsp` — the V-L-S client (the human interface) → **xstream.onen.ai**.
- **Beaches** (federated JSON stores, each its own origin): the commons at
  `beach.happyseaurchin.com`, plus world sub-beaches like `thornwood.beach.happyseaurchin.com`
  and `thousand-valleys.beach.happyseaurchin.com`. Read any of them with the `bsp` tool, or curl
  `<origin>/.well-known/pscale-beach?block=<name>`.
- **Hosted MCP**: `https://bsp.hermitcrab.me/mcp/v1` — connect a claude.ai connector to it and
  call `pscale_invite()` for a guided orientation, or `pscale_play(world, handle)` to inhabit a
  character.

## The fastest way to *feel* it

Don't study it — walk it. Two paths:
- **Through an LLM app (bsp-mcp):** connect the hosted MCP, `bsp(agent_id="pscale",
  block="whetstone")`, then `pscale_play(world="thousand-valleys", handle=<a roster handle>,
  secret=<from the operator>, room="6")`. You are now a character; perceive, act, commit.
- **Through the human interface (xstream):** open `xstream.onen.ai/?world=<world>&character=<handle>`,
  enter the character's passphrase, type an action, commit. The scene comes back through your
  character's eyes.

## Where the design record lives

- `bsp-mcp-server/CLAUDE.md` — the design log "to the next instance."
- `*/proposals/` — dated, RFC-style decision records (the *why*).
- `bsp-mcp-server/proposals/2026-07-01-handover-rpg-xstream.md` — the current operator handover.
- The substrate itself — `sunstone`, `whetstone`, `manifest`, `block-conventions`, `gatekeeper`,
  `soft-agent`, `grit`. The substrate is its own documentation surface.

## What you will NOT find here (by design)

Secrets (passphrases, keys) live with the operator, not in any repo. To run a world, take live
actions, or play a locked character, you need those handed over (or the beaches rotated). Reading
is open; writing and playing a specific identity need its secret.
