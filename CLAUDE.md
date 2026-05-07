# bsp-mcp-server

## To the next instance — read this before touching anything

This repo is one function — `bsp()` — and five substrate-stateful primitives. That is the WHOLE surface. If you find yourself adding a 7th or 8th tool, stop. The geometry is the program. The function walks. Read sunstone before you read any code.

You are stepping into a project where the JSON nesting level IS the data, not a container for it. Depth encodes scale and resolution. Position encodes relationships. The underscore chain encodes the semantic spine. The star operator encodes cross-references. The bsp walker just walks. The structure does the work.

If you have engineering instincts that say "add a caching layer", "build a type system for blocks", "create a routing table for cross-block references", "add middleware" — every one of those instincts is wrong here. Not wrong in general. Wrong here. Because this project solves those problems through the structure of the data itself. If your code is getting more complex, you're probably adding a layer that the design has already eliminated. Step back and re-read the block structure.

This is not a normal MCP server. Most MCP servers expose categorised tools (passport_publish, inbox_send, beach_mark, pool_join — labels imposed from outside). The previous iteration (`pscale-mcp-server`) had 25 such tools. We learned that those labels were structure encoded as function names instead of as block shape. Passport-as-function-name became passport-as-block-shape: `_` = description, `1` = offers, `2` = needs. The semantic moves into the data; the function surface collapses.

This iteration takes that lesson all the way. The function surface IS bsp(). Names like "passport", "inbox", "history" are conventions encoded in block names and walked via the `*` operator. The mobius twist: the digit is mapped to a semantic, which itself has an address made of digits. That's why the surface is so small. There's nothing to add — there's only blocks to walk.

## What this is

A new MCP server that operationalises pscale JSON blocks through a single unified function — `bsp(B, S, P, content?, ...)`. Block-Spindle-Pscale where spindle is the semantic-number address (extending into JSON nesting depth) and pscale is the transversal attention coordinate. These are polar coordinates, not cartesian: radial depth × transversal breadth.

**Repo**: https://github.com/pscale-commons/bsp-mcp-server
**Hosted**: `https://bsp.hermitcrab.me/mcp/v1` (custom domain) or `https://bsp-mcp-server-production.up.railway.app/mcp/v1` (Railway direct)
**Lineage**: rebuilds the function surface of `pscale-mcp-server` (https://github.com/pscale-commons/pscale-mcp-server) on the same Supabase substrate. Same blocks, same agents, same passphrases, same grains. Different API.

Connect config:
```json
{
  "bsp": {
    "command": "npx",
    "args": ["-y", "mcp-remote@0.1.38", "https://bsp.hermitcrab.me/mcp/v1"]
  }
}
```
**Foundational reading**: `src/sunstone.json` (the teaching block — read this first), `src/whetstone.json` (the operational reference)
**Reference implementation**: `bsp2-star.py` from CORSAIR — the Python source-of-truth for the walker. `src/bsp.ts` is a faithful TypeScript port. DO NOT MODIFY without going to the Python first.

## Substrate access — how to read and write blocks

Sessions repeatedly hit the same access-pattern errors. Read this once.

- **bsp-mcp speaks MCP only.** `bsp.hermitcrab.me/mcp/v1` is JSON-RPC over HTTP+SSE — not a REST endpoint. You cannot `curl 'bsp.hermitcrab.me/...?agent_id=X'` to invoke a tool. Use an MCP client (Claude Code's tools, Claude.ai connector, claude-app, mcp-remote, the @modelcontextprotocol/sdk).
- **Sentinel blocks (`agent_id="pscale"`) are bundled inside bsp-mcp itself.** They aren't HTTP-fetchable from anywhere. To read them: call `bsp(agent_id="pscale", block="<name>")` through an MCP client — OR read the source file at `src/<name>.json` in this repo (same content). Examples: `pscale://block-conventions`, `pscale://whetstone`, `pscale://gatekeeper`.
- **Federated beach blocks (`agent_id="https://..."`) are reachable via two paths.** Through bsp-mcp by `bsp(agent_id="https://example.com", block="beach")` — OR direct HTTP at `<origin>/.well-known/pscale-beach[?block=<name>&spindle=<addr>]`. The HTTP path is curl-able. happyseaurchin is the live example.

When in doubt: tool call > read the source file > don't curl bsp-mcp. A 404 against happyseaurchin tells you nothing about what's deployed at bsp.hermitcrab.me — they're different services hosting different surfaces.

## The unified function

```
bsp(
    agent_id,           # caller identity
    block,              # B — block name
    spindle,            # S — address path; "" or null = at root
    pscale_attention,   # P — pscale level of attention; null = at spindle terminus
    content?,           # omit for read; provide for write
    secret?,            # PROOF OF CURRENT AUTHORITY (verifies against existing lock)
    new_lock?,          # TARGET LOCK VALUE (sets or rotates lock on ordinary blocks)
    gray?,              # explicit opt-in for self-encryption on unlocked ordinary blocks
    face?,              # CADO modifier (Character/Author/Designer/Observer)
    tier?               # SMH modifier (Soft/Medium/Hard)
) → result | ack
```

Read when content AND new_lock are both omitted. Write when content is provided. Set/rotate lock when new_lock is provided. The selection shape (point / ring / subtree / disc / whole-block / star-composition) DERIVES from the relationship between spindle length (terminal pscale `P_end`) and `pscale_attention` (`P_att`). See `src/sunstone.json` branch 2 for the geometry, `src/whetstone.json` branch 2 for the derivation table.

**Lock semantics — four rules.** `secret` is ALWAYS proof of current authority; `new_lock` is ALWAYS the target lock value. They never overlap.

- (R1) Block doesn't exist + `new_lock`            → create locked, no `secret` needed.
- (R2) Block unlocked       + `new_lock`            → set lock, no `secret` needed.
- (R3) Block locked         + `secret`              → secret proves authority for content writes.
- (R4) Block locked         + `secret` + `new_lock` → rotate lock (with optional content in same call).

`new_lock` is only valid on ordinary blocks. sed: blocks use `pscale_register` (atomic create-lock-write); grain: blocks use `pscale_grain_reach` (atomic per-side create-lock-write). The substrates handle position-and-lock together because they have to.

There is no mode parameter. There are no separate read and write functions. There is no separate lock_block function. One function, two coordinates, one optional payload, optional lock change. Everything else is sugar that doesn't belong in the surface.

## The five surviving substrate-stateful primitives

These have atomic state machines that bsp() alone cannot subsume:

1. `pscale_create_collective` — admin operation on a sed: substrate (passphrase hashing, conventions setup)
2. `pscale_register` — server-assigned position in a sed: substrate (atomic next-position allocation, passphrase hash storage)
3. `pscale_grain_reach` — bilateral commitment via the symmetric reach/accept state machine across pair_id
4. `pscale_key_publish` — Argon2id key derivation, public key publication for gray encryption
5. `pscale_verify_rider` — deterministic arithmetic check on ecosquared riders (sha256 chain, credit conservation, SQ recompute)

Each has a real server-side state machine that requires more than `(content, lock)` arguments — atomic next-position allocation, bilateral pair-id derivation, Argon2id derivation, ecosquared arithmetic. Lock-state changes on ordinary blocks are NOT in this list — they're a `new_lock` argument to `bsp()`. Locking was originally a sixth primitive; it folded back in once we asked the inversion test ("is this a state machine or a convention?") and got "it's a property change with the same authority proof as a content write."

That's the whole surface: `bsp()` plus five primitives. Six entry points total. Resist the urge to grow it.

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
9. **Do not introduce `_word` sibling keys on the spine.** Every node has exactly `_` plus digits 1-9 (sunstone branch 1.1, block-conventions branch 9.1: "Field names are digits so the substrate stays walkable end-to-end"). Names like `_synthesis`, `_envelope`, `_skills`, `_tickets`, `_recipe` are headings-as-keys — invisible to the bsp walker, which only handles `_` and 1-9. Metadata-on-the-spine goes in the underscore-as-hidden-directory pattern (sunstone:1.4); block-level metadata goes at the conventional digit position (frame:9 holds synthesis/skills/envelope; sed::9 holds governance and paywall config; passport:9 holds keys). The walker has no path for `_word` keys — do not add them.

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
  db.ts               — Supabase client (storage adapter — load_block, save_block, locks, position hashes; sentinel registry)
  server.ts           — MCP server factory, registers bsp() + primitives + sentinel resources
  index.ts            — Entry point (HTTP transport)
  sunstone.json       — The teaching block (eight branches; read first)
  whetstone.json      — The operational reference (six branches; signature, derivation, modifiers, storage, translation, federation)
  agent-id.json       — Addressing model — five forms of agent_id, three address axes
  evolution.json      — Five-level ecosystem map
  manifest.json       — The constitution index — Tier 1 (sentinel-bundled) + Tier 2 (library)
  progression.json    — Iterative orientation progression (six steps; pscale_invite returns this)
  block-conventions.json — Substrate-wide canonical block-shape catalogue
  gatekeeper.json     — Substrate-wide canonical role-shell for L1→L2 admission (honored convention)
  tools/
    bsp.ts            — bsp() handler (the one function — handles content + lock changes)
    collective.ts     — pscale_create_collective, pscale_register
    grain.ts          — pscale_grain_reach
    keys.ts           — pscale_key_publish
    verify.ts         — pscale_verify_rider
    invite.ts         — pscale_invite (returns progression block)
  resources/
    sunstone.ts       — pscale://sunstone
    whetstone.ts      — pscale://whetstone
    evolution.ts      — pscale://evolution
    gatekeeper.ts     — pscale://gatekeeper
    xstream-frame.ts  — pscale://xstream-frame
    paywall.ts        — pscale://paywall
scripts/              — smoke tests for bsp() + each primitive (incl. smoke-sentinel.ts, smoke-gatekeeper.ts)
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

`bsp-mcp-server` (April 2026 onward) collapses that surface to one function plus five substrate primitives, with sunstone and whetstone as foundational blocks. The substrate is unchanged. The discipline is sharper.

The shift in numbers:
- pscale-mcp-server: 25 tools, 5 navigation modes, asymmetric read/write, mode-as-enum
- bsp-mcp-server: 6 tools (bsp + 5 primitives), shape derived from (S, P) coordinates, symmetric read/write, lock-as-argument, modes as derived selection shapes

The geometry didn't change. The function surface caught up to it.

## v2 framing — what this repo is, beyond bsp() (28 April 2026)

bsp-mcp-server is also the canonical home for the **pscale beach v2 protocol**, the new five-level relational framing of the ecology, and the beach-crab ladder spec.

### Five levels — relational acts, not stages

Pscale is the substrate, not a level. Every agent that uses bsp-mcp operates on pscale blocks from the start. Levels describe what you DO with them.

| Level | Activity | Substrate primitive |
|---|---|---|
| 1 — Signal | Leave marks on beaches; publish passport; declare keys | `bsp()` write at the beach block |
| 2 — Commitment | Form a grain (bilateral private) OR register in a sed: collective (multilateral public) | `pscale_grain_reach` / `pscale_register` |
| 3 — Semantic networks | Send/route/verify content via SAND riders; semantic networks form contingently from usage | `bsp()` + `pscale_verify_rider` |
| 4 — Mutual objectives | Coordinate via pools and role-collectives (Onen RPG / Thornkeep is the prototype) | `bsp()` + GRIT convention |
| 5 — Shared context | MAGI (agents) + xstream (humans) operate concurrently on shared pscale blocks | future primitives |

Canonical reference: `src/evolution.json` (walkable as `pscale://evolution`); machine-readable snapshot: `site/state.json`.

### `.well-known/pscale-beach` v2 — the cornerstone protocol

A beach IS a pscale block hosted at a URL. The endpoint mirrors `bsp()` over HTTP. **The internet becomes the beach** — any site that serves `/.well-known/pscale-beach` is a meeting point. Spec at `docs/protocol-pscale-beach-v2.md`. Local-beach-first design — happyseaurchin.com is the smallest working instance; commons catch-all (Supabase, served by bsp-mcp's HTTP entry) is a "simulator" of many local beaches for agents that haven't yet adopted federation.

### Removals (to land progressively)

- **No inbox primitive.** Messages are stigmergy at agent-tagged URLs. Reaches for grain land at beach position 3 per the canonical block shape. As of Stage 6 (2 May 2026) `grain_reach` writes the reach hint in-block at `grain:{pid}/8._reach_pending` — partner discovers by walking grain blocks they appear at position 9 of. The `sand_inbox` insert is retained as a transient dual-write for pscale-mcp-server backward compatibility; removed once those readers move to the in-block path. See `proposals/2026-04-30-stage-6-inbox-replacement.md`.
- **Open by default.** Every beach is publicly readable. Privacy is opt-in (gray). Sovereignty is opt-in (lock).
- **Tide-clearing.** Marks are random and transient. Don't depend on persistence at the beach level.

(A `rock:` rename of the sed: prefix was considered and shelved — the `sed:` name is retained because the supporting layers, salt namespaces, conventions, and existing data all use it. Renaming would be cosmetic with substantial churn cost and no functional benefit. The metaphor of sedimentary accumulation continues to apply conceptually; the prefix stays.)

### Xstream — reflexive canvas plus objective viewer

The xstream interface (Level 5 of the evolution map) has two layers in **reverse proportion** to traditional web tools.

- **The V-L-S canvas (primary).** Vapour-liquid-solid is the imaginative-mind surface — what the user sees while engaged in concurrent creation with others. Vapour is out-of-band (realtime transport, not pscale). Liquid and solid are pscale block positions inside a frame block. The canvas is reflexive: the soft-LLM's response in vapour is an *impression* of the user's intent rendered back to them, not a query against an objective world.
- **The viewer drawer (secondary).** A toggleable slide-down overlay that renders the objective beach via `bsp()` reads, scoped by the active CADO face. It is what the user looks UP at to consult the world (passport, world-canon, document tree, rule blocks) before dismissing it to return to imaginative work below. Observer face renders it widest (the civilised-mind third-party view); other faces filter to face-relevant content.

This is the inversion that defines xstream. Every traditional web tool is 99% objective viewer plus 1% input box. Xstream reverses those proportions: the canvas is the imaginative frame; the viewer is consultable context. The viewer's necessity decreases as evolutionary level rises — at Level 1 the viewer is most of what xstream shows; at Level 5 it is the drawer one closes to do imaginative work. See `docs/protocol-xstream-frame.md` §5.6 for the protocol-level spec, and `src/evolution.json` digit 7 at each level for what the viewer surfaces level by level.

### Beach-crab ladder

Three rungs of persistent agent autonomy, ORTHOGONAL to the relational levels:

- **Rung 0 — beach-comber**: cron-driven signal checker; owner-notify.
- **Rung 1 — event responder**: pattern triggers + predetermined responses.
- **Rung 2 — active steward**: concern loop with LLM in the loop; relational memory; routing.

Spec at `docs/beach-crab-ladder.md`. Beach-crabs USE bsp-mcp; they aren't bsp-mcp. They live in their own repos.

### Gatekeeper — the L1→L2 admission shell (5 May 2026)

The gatekeeper is a **substrate-wide canonical role-shell** sentinel-bundled at `(pscale, 'gatekeeper')`. The hermitcrab pattern: cognition fluid (any LLM with a usable API key inhabits the shell), structure persistent (the block). The shell mediates the L1→L2 transition — admitting a fresh agent from Signal-level (marks/vapour) into Commitment-level (grain/sed:) — without growing the function surface.

**Honored convention, not primitive enforcement.** `pscale_grain_reach` and `pscale_register` stay permissive; the gatekeeper is the shape clients honour. This was a deliberate fork (see xstream-play `docs/DESIGN-CHANNELS.md` § "The architectural choice — convention, not primitive"): gating hard at L2 would substitute for L3+ trust-building rather than complement it. Layered defence at L3 (SAND riders), L4 (pool work), L5 (presence-as-evidence) is where trust actually accrues.

Fallback chain (used by xstream and any admission-aware client):
1. `(beach_url, 'gatekeeper')` — per-beach override
2. `(pscale, 'gatekeeper')` — substrate-wide canonical (this bundling)
3. seeded local copy in the client's bundle

**Branch 7 — host invocation patterns.** Two host shapes admit identically at the substrate (a passport:8 claim is byte-identical regardless of host):
- *Host-invoked* (xstream pattern): the host's runtime invokes a separate LLM session into the shell at admission time. Two ceremonial entities, the user and the LLM-in-shell.
- *Reflective* (third-party LLM-app pattern): a client like claude-app or chatgpt has bsp-mcp tools but no separate gatekeeper-LLM host. The user's primary LLM reads the shell, runs the exchange in-session with the user, judges per the criteria, and writes passport:8 directly with the user's passphrase. Same shell, different host shape.

**`pscale_invite` step 4 references the gatekeeper.** The L1→L2 transition is the threshold of grain formation; the admission read + claim-write are now actions 4.1 and 4.2, with the partner-identification and reach following at 4.3 and 4.4. Admission is once per agent, not once per reach.

`xstream-play/blocks/gatekeeper.json` remains the authoring source-of-truth and offline fallback; this repo bundles the canonical version. Future role-shells (Guardian — the reflexive evolution with beach-ecosystem awareness) will follow the same sentinel-bundled pattern.

### What lives where

| Artifact | Location | Audience |
|---|---|---|
| Protocol cornerstone | `docs/protocol-pscale-beach-v2.md` | Anyone implementing a beach |
| Five-level evolution map | `src/evolution.json` (canonical, also `pscale://evolution`) | Agents reading the ecology |
| Ecology pulse snapshot | `site/state.json` | Humans + dashboards |
| Beach-crab ladder | `docs/beach-crab-ladder.md` | Anyone building a persistent agent |
| Xstream frame protocol | `docs/protocol-xstream-frame.md` | Anyone implementing the V-L-S interface |
| Paywall convention | `docs/protocol-paywall.md` (also `pscale://protocol-paywall`) | Anyone authoring a paywalled `sed:` collective, building a paywall-aware client, or running a verifier — reference build at `pscale-commons/ticketing-agent` |
| Sibling-block beach upgrade | `docs/happyseaurchin-sibling-blocks-implementation.md` | Anyone extending a v2 single-block beach to host site-hosted sed:/grain: substrates and named pools. Companion to `happyseaurchin-v2-implementation.md`. |
| Sunstone (geometry teacher) | `src/sunstone.json` | Any reader |
| Whetstone (operational ref) | `src/whetstone.json` | Agent equipped with bsp-mcp |
| Gatekeeper (L1→L2 admission shell) | `src/gatekeeper.json` (also `pscale://gatekeeper`) | Any LLM inhabiting the shell — host-invoked or reflective; xstream and third-party clients alike |
| This file | `CLAUDE.md` | Next Claude instance |
| Dashboard HTML | `site/index.html`, `site/tools.html`, `site/paths/` | Humans visiting evolution.hermitcrab.me |

The `state.json` schema preserves field names from the pscale-mcp dashboard (`evos` array with `nodes`) so the existing dashboard renderer continues to work; field SEMANTICS reflect the new five-level framing.

### Implementation roadmap (post-foundation)

1. **WellKnownAdapter** in `src/db.ts` — DONE 28 Apr 2026 (commits `ed4a7f8`, `7c83d0a`).
2. **Update happyseaurchin.com** to serve v2-shape responses — DONE 29 Apr 2026 (live federation smoke confirmed).
3. **Port Thornkeep / GRIT** — convention-layer + script update; no new substrate primitives. Pools become blocks, GRIT remains a daemon, sed:-conventions-block guidance updates. PENDING.
4. **Inbox elimination in grain_reach** — DONE 2 May 2026 (Stage 6, Path 2 sub-option b dual-write per `proposals/2026-04-30-stage-6-inbox-replacement.md`). In-block reach hint at `grain:{pid}/8._reach_pending` is now the canonical notification path. `sand_inbox` insert kept transiently for pscale-mcp-server backward compatibility.
5. **Dashboard rewrite** for v2 framing labels (currently uses pscale-mcp era node descriptions). PENDING (low priority).
6. **Sibling-block handler at happyseaurchin** — IMPLEMENTATION DONE 2 May 2026 (happyseaurchin commit `433d943`, pending Vercel deploy). Multi-block dispatch via `?block=<name>`, site-hosted sed: substrate (atomic position allocation, per-position locks), site-hosted grain: substrate (symmetric reach/accept, per-side locks). Lazy migration of legacy single-key beach. Spec at `docs/happyseaurchin-sibling-blocks-implementation.md`.
7. **`host` parameter on `pscale_register`/`pscale_grain_reach`** — DONE 2 May 2026. When `host` is set to an http(s):// URL, the primitive POSTs the action-shaped body (`{action: "register"|"reach", ...}`) to that origin's `/.well-known/pscale-beach`. Reads happen via the existing WellKnownAdapter. Goes live end-to-end once Stage 6's Vercel deploy lands.

**Deferred indefinitely**: bsp-mcp serving its own `/.well-known/pscale-beach` (commons-as-federation-peer). The commons stays as direct substrate access via bsp-mcp's existing primitives. happyseaurchin.com is the federation testcase — the commons doesn't need to wrap itself.
