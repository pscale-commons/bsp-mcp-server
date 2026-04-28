# bsp-mcp-server

## To the next instance — read this before touching anything

This repo is one function — `bsp()` — and six substrate-stateful primitives. That is the WHOLE surface. If you find yourself adding a 9th or a 12th tool, stop. The geometry is the program. The function walks. Read sunstone before you read any code.

You are stepping into a project where the JSON nesting level IS the data, not a container for it. Depth encodes scale and resolution. Position encodes relationships. The underscore chain encodes the semantic spine. The star operator encodes cross-references. The bsp walker just walks. The structure does the work.

If you have engineering instincts that say "add a caching layer", "build a type system for blocks", "create a routing table for cross-block references", "add middleware" — every one of those instincts is wrong here. Not wrong in general. Wrong here. Because this project solves those problems through the structure of the data itself. If your code is getting more complex, you're probably adding a layer that the design has already eliminated. Step back and re-read the block structure.

This is not a normal MCP server. Most MCP servers expose categorised tools (passport_publish, inbox_send, beach_mark, pool_join — labels imposed from outside). The previous iteration (`pscale-mcp-server`) had 25 such tools. We learned that those labels were structure encoded as function names instead of as block shape. Passport-as-function-name became passport-as-block-shape: `_` = description, `1` = offers, `2` = needs. The semantic moves into the data; the function surface collapses.

This iteration takes that lesson all the way. The function surface IS bsp(). Names like "passport", "inbox", "history" are conventions encoded in block names and walked via the `*` operator. The mobius twist: the digit is mapped to a semantic, which itself has an address made of digits. That's why the surface is so small. There's nothing to add — there's only blocks to walk.

## What this is

A new MCP server that operationalises pscale JSON blocks through a single unified function — `bsp(B, S, P, content?, ...)`. Block-Spindle-Pscale where spindle is the semantic-number address (extending into JSON nesting depth) and pscale is the transversal attention coordinate. These are polar coordinates, not cartesian: radial depth × transversal breadth.

**Repo**: `pscale-commons/bsp-mcp-server`
**Lineage**: rebuilds the function surface of `pscale-mcp-server` (https://github.com/pscale-commons/pscale-mcp-server) on the same Supabase substrate. Same blocks, same agents, same passphrases, same grains. Different API.
**Foundational reading**: `src/sunstone.json` (the teaching block — read this first), `src/whetstone.json` (the operational reference)
**Reference implementation**: `bsp2-star.py` from CORSAIR — the Python source-of-truth for the walker. `src/bsp.ts` is a faithful TypeScript port. DO NOT MODIFY without going to the Python first.

## The unified function

```
bsp(
    agent_id,           # caller identity
    block,              # B — block name
    spindle,            # S — address path; "" or null = at root
    pscale_attention,   # P — pscale level of attention; null = at spindle terminus
    content?,           # omit for read; provide for write
    face?,              # CADO modifier (Character/Author/Designer/Observer)
    tier?,              # SMH modifier (Soft/Medium/Hard)
    secret?,            # write-lock proof on locked positions
    gray?               # explicit opt-in for self-encryption on unlocked ordinary blocks
) → result | ack
```

Read when content is null. Write when content is provided. The selection shape (point / ring / subtree / disc / whole-block / star-composition) DERIVES from the relationship between spindle length (terminal pscale `P_end`) and `pscale_attention` (`P_att`). See `src/sunstone.json` branch 2 for the geometry, `src/whetstone.json` branch 2 for the derivation table.

There is no mode parameter. There are no separate read and write functions. There is one function, two coordinates, one optional payload. Everything else is sugar that doesn't belong in the surface.

## The six surviving substrate-stateful primitives

These have atomic state machines that bsp() alone cannot subsume:

1. `pscale_create_collective` — admin operation on a sed: substrate (passphrase hashing, conventions setup)
2. `pscale_register` — server-assigned position in a sed: substrate (atomic next-position allocation, passphrase hash storage)
3. `pscale_grain_reach` — bilateral commitment via the symmetric reach/accept state machine across pair_id
4. `pscale_lock_block` — block-level lock state change (set, rotate, applies to ordinary blocks)
5. `pscale_key_publish` — Argon2id key derivation, public key publication for gray encryption
6. `pscale_verify_rider` — deterministic arithmetic check on ecosquared riders (sha256 chain, credit conservation, SQ recompute)

Each has a real server-side state machine. None of them can be reduced to "just a bsp() call." Substrate dispatch (sed:, grain:, ordinary) is encoded in block names and routed inside bsp() and these six. The caller never picks a substrate-specific function.

That's the whole surface: `bsp()` plus six primitives. Seven entry points total. Resist the urge to grow it.

## The address invariant — locked

This is the single most important thing to get right. It is encoded in `bsp2-star.py` and ported in `src/bsp.ts`. Do not deviate.

**Pscale 0 is anchored at the floor (decimal point), NOT at the top of the tree.** Floor is the depth of the underscore chain — derived from the block, not declared. The walk algorithm is:

1. Parse the address, stripping the decimal point (it's a readability marker).
2. **Pad LEFT to floor width** with zeros (the human may have omitted underscore-chain steps).
3. **Strip trailing zeros** (they are floor-width notation, not walk instructions).
4. Walk: digit 0 → key `_`, digits 1-9 → respective keys.

Whole-number digits to the left of the decimal walk the underscore-chain levels (positive pscale). Digits to the right walk into branches (negative pscale). The decimal in `123.45` marks the floor boundary — five steps total, decimal between the third and fourth.

Trailing zeros in `100`, `110`, `345` are floor-width padding. `100` walks digit `1` only. `110` walks digits `1` then `1`. Single algorithm, no exceptions, no alternatives anywhere in the codebase.

If you find yourself writing a different parser for "convenience" or "edge cases", stop. The convenience is wrong. The edge case is your assumption. There is one parser. It lives in `src/bsp.ts`.

## What NOT to do

1. **Do not modify `src/bsp.ts` casually.** It is a port of `bsp2-star.py`. If the Python reference updates, replace wholesale. Do not patch.
2. **Do not add fields to blocks.** Position in the tree encodes what you think you need a field for. If you reach for a `type` field, the floor depth IS the type. If you reach for a `parent` field, the address IS the parent. If you reach for a `kind` enum, the underscore chain depth IS the kind.
3. **Do not add logic to handle block semantics.** Tool handlers are thin: load block → bsp() → format → return. If a handler is doing more than that, the block structure is wrong, not the code.
4. **Do not build categorised tools.** No `bsp_passport_publish`, no `bsp_inbox_send`, no `bsp_beach_mark`. The semantics live IN the block, accessed via the block name and the `*` operator. The label is data, not function name.
5. **Do not build systems.** No reverse indices, no caching layers, no routing tables, no middleware. The tree walks.
6. **Do not return raw JSON from handlers.** Format readable text via `fmtSpindle`, `fmtRing`, `fmtDisc`, `fmtDir`, `fmtStar` — agents work in text, not data structures. Internal structure stays internal.
7. **Do not assume backwards-compatibility shims.** This is not a refactor of pscale-mcp-server — it is a fresh function surface on the same substrate. Pscale-mcp-server keeps running. Agents pick which to connect.
8. **Do not write headings as underscores.** A heading is an authoring failure (sunstone branch 8). Underscores must stand alone — substantive sentences. Read the underscore without its children. If trivially obvious or meaningless, it is a heading.

## What TO do

1. **Read `src/sunstone.json` first.** It is self-explanatory and self-unfolding. Walk it with bsp() to learn how to walk anything.
2. **When stuck on geometry, read `src/whetstone.json`.** Branch 2 is the selection-shape derivation table. Branch 5 is the translation from old pscale-mcp idioms.
3. **When implementing, port from `bsp2-star.py`.** The Python is canonical for the walk algorithm. The TypeScript exists to serve MCP, not to reinterpret.
4. **Keep handlers thin.** Three lines is often the right length. If your handler has branches, the block structure probably has the answer.
5. **Test with sunstone and whetstone.** They are walkable proofs. Every spindle through them must produce coherent text. If it doesn't, the block is wrong (and we fix the block) or the walker is wrong (and we fix the walker).
6. **Write blocks in zeroth person.** Imperative, situated, never `I`/`you`/`it`. The actor is the underscore. The underscore is inside the block. (Sunstone branch 8.)

## Architecture

```
src/
  bsp.ts              — BSP walker (port of bsp2-star.py — DO NOT MODIFY casually)
  bsp-fn.ts           — Unified bsp() function: shape derivation, read/write symmetric, modifier composition
  db.ts               — Supabase client (storage adapter — load_block, save_block, locks, position hashes)
  server.ts           — MCP server factory, registers bsp() + six primitives + sunstone/whetstone resources
  index.ts            — Entry point (HTTP transport)
  sunstone.json       — The teaching block (eight branches; read first)
  whetstone.json      — The operational reference (five branches; signature, derivation, modifiers, storage, translation)
  tools/
    bsp.ts            — bsp() handler (the one function)
    collective.ts     — pscale_create_collective, pscale_register
    grain.ts          — pscale_grain_reach
    lock.ts           — pscale_lock_block
    crypto.ts         — pscale_key_publish
    verify.ts         — pscale_verify_rider
  resources/
    sunstone.ts       — pscale://sunstone
    whetstone.ts      — pscale://whetstone
scripts/              — smoke tests for bsp() + each primitive
docs/                 — protocol specs (federated beach, etc.) — minimal, only what the substrate needs
```

## Storage

**Same Supabase project as pscale-mcp-server** (`piqxyfmzzywxzqkzmpmm`). Same tables. Same blocks. Same agents. Same passphrases.

The substrate does not change between MCPs — only the function surface that operates on it. An agent registered at `sed:commons:14` via pscale-mcp-server is at `sed:commons:14` via bsp-mcp-server. A grain block formed by `pscale_grain_reach` from one MCP is reachable by bsp() from the other. Interoperability is at the data layer, not the API layer.

Tables in use:
- `pscale_blocks` — the substrate (owner_id + name = unique, position_hashes JSONB, gray-encrypted leaves)
- `sand_inbox` — message routing
- `beach_marks` — stigmergy at URLs
- `pool_state`, `pool_contributions`, `pool_read_markers` — liquid pools

If a future feature needs a new table, ask whether the existing tables can serve it through naming conventions. Most can.

## DESIGN PRINCIPLE — SCALE WITHOUT CENTRAL COST

Carry forward from pscale-mcp-server:

1. **Railway is convenience, not architecture.** The MCP server runs locally. Never bake in a Railway URL as the only path. Test against `npx tsx src/index.ts` not just remote.
2. **Supabase is shared coordination only.** Things that MUST be shared. Not personal blocks, not passports.
3. **`.well-known` is the scaling mechanism.** Each site hosts its own beach.
4. **Every feature must ask: who pays at scale?** If "David" or "one central server" — the design is wrong.

## Voicing discipline

Sunstone branch 8 codifies the four sign forms and plus/minus block sign. Honour them when authoring blocks (especially howto, conventions, and self-describing blocks):

- **0+ deductive** (settled-set): underscore describes its own group; rendition blocks; documents and specs.
- **+0 inductive** (prior-summary): underscore summarises the previous completed group; living blocks; histories.
- **0− abductive** (instructional): underscore is intent for its own group; operational blocks; recipes.
- **−0 backcasting** (future-perfect): underscore predicated on a future case.

The block as a whole takes a sign: **plus** (settled, archive — sunstone, whetstone, completed history) or **minus** (mutable, process — purpose blocks, live concerns). Form is local; sign is global. Both are read from content, not declared.

## Modifiers — CADO × SMH

Whetstone branch 3 introduces face (CADO: Character, Author, Designer, Observer) and tier (SMH: Soft, Medium, Hard) as orthogonal access modifiers. They compose with (B, S, P) without altering geometry. Validation runs server-side BEFORE traversal — failure rejects without revealing block contents.

Face binds to sed: collective membership: `sed:{role}-cast` for Character, `sed:{role}-authors` for Author, etc. Observer requires no membership. This re-uses the existing sedimentary substrate rather than introducing a new auth surface — registration in the role's sed: collective grants the corresponding face.

Tier scopes the aperture within whatever face permits. Soft = bounded perception (e.g., one position). Medium = with proximity context. Hard = full canon access. Disallowed combinations (Character running Hard against world canon, for instance) are rejected.

This is the missing piece for information-hiding-by-construction in games. xstream-play's perception machinery (position-constrained walks, familiarity gating, knowledge overlays) becomes a server-side discipline rather than an application-side ceremony.

## Documentation

| Layer | Location | Audience |
|-------|----------|----------|
| **Foundation** | `src/sunstone.json` | Any reader — the self-unfolding teaching block |
| **Operational reference** | `src/whetstone.json` | An LLM equipped with bsp-mcp wanting to sharpen its tools |
| **Design log** | `CLAUDE.md` (this file) | The next Claude Code instance |
| **Substrate origin** | `pscale-mcp-server/CLAUDE.md` | History — the lessons that brought us here |

If a new agent-facing runbook is needed, it goes IN A BLOCK on the substrate, not as a tool or a markdown file. The substrate IS the documentation surface for things agents read.

## Lineage

`pscale-mcp-server` (March-April 2026) operationalised the pscale block format through 25 categorised tools. The discipline learned: structure encodes meaning; categories were premature; the function surface should mirror the geometry, not the use cases.

`bsp-mcp-server` (April 2026 onward) collapses that surface to one function plus six substrate primitives, with sunstone and whetstone as foundational blocks. The substrate is unchanged. The discipline is sharper.

The shift in numbers:
- pscale-mcp-server: 25 tools, 5 navigation modes, asymmetric read/write, mode-as-enum
- bsp-mcp-server: 7 tools (bsp + 6 primitives), shape derived from (S, P) coordinates, symmetric read/write, modes as derived selection shapes

The geometry didn't change. The function surface caught up to it.
