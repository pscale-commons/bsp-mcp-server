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
**Lineage**: rebuilds the function surface of `pscale-mcp-server` (https://github.com/pscale-commons/pscale-mcp-server) — but federated-only. The pscale-mcp era used a single Supabase substrate. bsp-mcp uses federated beaches: URL agent_ids dispatch to that beach; bare/sed:/grain: agent_ids translate to a default beach. No central database. Pscale-mcp continues to run against Supabase for its own use cases; bsp-mcp does not share a substrate with it.

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
- **Federated beach blocks (`agent_id="https://..."`) are reachable via two paths.** Through bsp-mcp by `bsp(agent_id="https://example.com", block="<name>")` — OR direct HTTP at `<origin>/.well-known/pscale-beach?block=<name>[&spindle=<addr>]`. The HTTP path is curl-able. happyseaurchin is the live example. **The URL is the *surface*, not a block.** A `?block=` parameter is required on every read or write that targets a specific named block; a `GET` with no `?block=` returns a derived index listing the named blocks present at that surface (`{_, origin, blocks: [...]}`). There is no canonical "beach" block — common names you'll see at a host are `marks`, `passport:<handle>`, `shell:<handle>`, `pool:<name>`, `conventions`, `tide`, `settings`, `gatekeeper`, `sed:<collective>`, `grain:<pair_id>`, `frame:<scene>`. See block-conventions branch 4 for the surface model and branch 9 for the marks shape.

When in doubt: tool call > read the source file > don't curl bsp-mcp. A 404 against happyseaurchin tells you nothing about what's deployed at bsp.hermitcrab.me — they're different services hosting different surfaces.

## Cross-repo workflow — bsp-mcp + happyseaurchin + xstream-bsp

Substantive work on this substrate routinely spans three sibling repos:

- **`bsp-mcp-server`** (this repo) — the MCP router, sentinels, conventions
- **`happyseaurchin-home`** — the federated beach handler at happyseaurchin.com (Vercel + Upstash KV)
- **`xstream-bsp`** — the canonical client (Vite + React; the V-L-S canvas)

If you only see one repo at session start, you'll re-derive what's already in another. Add the others to the session as additional working directories so reads, edits, and grep span all three:

```jsonc
// .claude/settings.local.json — gitignored, per-machine
{
  "permissions": {
    "additionalDirectories": [
      "/Users/<you>/Projects/happyseaurchin",
      "/Users/<you>/Projects/xstream-bsp"
    ]
  }
}
```

These take effect at the *next* session boundary — and any time you're about to assert that something doesn't exist, check the other repos first. The federated beach handler lives in happyseaurchin's `api/pscale-beach.js`; the live client lives in xstream-bsp's `src/`. They speak the same protocol; corruption in one shows up as confusion in the others.

**Verify branch divergence at session start.** Don't assume your branch base is current. Recent merges to `main` may have happened during prior sessions; before deciding what's new vs. what's existing state, run `git fetch origin && git log origin/main..HEAD --oneline` in each touched repo. (Lesson learned the hard way in May 2026 — see "Beach-as-surface migration" below.)

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

This is the single most important thing to get right. The canonical parser lives in `bsp2-star.py` (Python source-of-truth at `~/Projects/hermitcrab-mobius-work/tidy-up/bsp2-star.py`, mirrored on `/Volumes/CORSAIR/pscale/starstone/`). `src/bsp.ts` and `happyseaurchin/api/pscale-beach.js` are faithful ports of that algorithm — both ends of the wire enforce the same form.

**Pscale 0 is anchored at the floor (decimal point), NOT at the top of the tree.** Floor is the depth of the underscore chain — derived from the block, not declared. The decimal point is significant: it anchors pscale 0 to the floor. Pscale addresses are **numbers, not paths** — at most ONE decimal point per address (sunstone:1.5).

The walk algorithm is dot-aware:

1. Split the address on the dot. **Multi-dot is rejected** at parse time.
2. Validate every char ∈ [0-9].
3. **Reject** if `hadDot && leftDigits.length > floor` (the dot would be above the floor).
4. **Pad LEFT-OF-DECIMAL** to floor width with `'0'` (= `_`). This makes an address written at a smaller floor still locate the same semantic position after the block has grown an underscore layer above. `"34.5"` at floor 2 keeps walking to the leaf; at floor 3 it auto-pads to `"034.5"`; at floor 4 to `"0034.5"`.
5. **Strip trailing zeros** (floor-width padding canonicalisation).
6. Walk: digit 0 → key `_`, digits 1-9 → respective keys.

Whole-number digits to the left of the decimal walk the underscore-chain levels (positive pscale). Digits to the right walk into branches (negative pscale). The decimal in `123.45` marks the floor boundary.

Trailing zeros in `100`, `110`, `345` are floor-width padding. `100` walks digit `1` only. `110` walks digits `1` then `1`.

**Strict at both boundaries.** Multi-dot addresses (`"1.2.3"`) and addresses with left-of-decimal exceeding floor throw `InvalidAddressError`. The MCP boundary catches and returns a clean user-facing error; the beach handler catches and returns HTTP 400 `invalid_address`. The substrate enforces its own contract — silent misroute (the whetstone:1.3 trap) is closed.

**Emit is symmetric.** `formatAddress(digits, floor)` produces the canonical single-decimal form: dot-free if all digits fit at-or-above the floor, otherwise a single dot at the floor boundary. Round-trip: `parseSpindle(formatAddress(d, fl), fl).digits` ≡ canonical form of `d`. Disc emits use `formatAddress` — no more multi-dot leaks back to LLM context.

The 2026-05-09 update added `parse_spindle`, `format_address`, `InvalidAddressError`, and floor-aware padding to bsp2-star.py; the TS+JS ports were updated in lockstep. Verify with `python3 tidy-up/test-bsp-parser.py` (Python — 83 tests) and `npm run smoke:parser` (TS — 102 tests). See [`proposals/2026-05-09-floor-anchor-and-multi-dot.md`](proposals/2026-05-09-floor-anchor-and-multi-dot.md) for the algorithm spec and bug closure.

If you find yourself writing a different parser for "convenience" or "edge cases", stop. The convenience is wrong. The edge case is your assumption.

## What NOT to do

1. **Do not modify `src/bsp.ts` casually.** It is a faithful port of `bsp2-star.py`. If the Python reference updates, replace wholesale rather than patching. The 2026-05-09 update was applied to all three (Python first, then TS, then JS) — verify alignment with `python3 tidy-up/test-bsp-parser.py` and `npm run smoke:parser`.
2. **Do not add fields to blocks.** Position in the tree encodes what you think you need a field for. If you reach for a `type` field, the floor depth IS the type. If you reach for a `parent` field, the address IS the parent. If you reach for a `kind` enum, the underscore chain depth IS the kind.
3. **Do not add logic to handle block semantics.** Tool handlers are thin: load block → bsp() → format → return. If a handler is doing more than that, the block structure is wrong, not the code.
4. **Do not build categorised tools.** No `bsp_passport_publish`, no `bsp_inbox_send`, no `bsp_beach_mark`. The semantics live IN the block, accessed via the block name and the `*` operator. The label is data, not function name.
5. **Do not build systems.** No reverse indices, no caching layers, no routing tables, no middleware. The tree walks.
6. **Do not return raw JSON from handlers.** Format readable text via `fmtSpindle`, `fmtRing`, `fmtDisc`, `fmtDir`, `fmtStar` — agents work in text, not data structures. Internal structure stays internal.
7. **Do not assume backwards-compatibility shims.** This is not a refactor of pscale-mcp-server — it is a fresh function surface on the same substrate. Pscale-mcp-server keeps running. Agents pick which to connect.
8. **Do not write headings as underscores.** A heading is an authoring failure (sunstone branch 8). Underscores must stand alone — substantive sentences. Read the underscore without its children. If trivially obvious or meaningless, it is a heading.
9. **Do not introduce `_word` sibling keys on the spine.** Every node has exactly `_` plus digits 1-9 (sunstone branch 1.1). Names like `_synthesis`, `_envelope`, `_skills`, `_tickets`, `_recipe` are headings-as-keys — invisible to the bsp walker, which only handles `_` and 1-9. The walker has no path for `_word` keys — do not add them. When a block needs a hidden directory, use the underscore-as-hidden-directory pattern (sunstone:1.4 — the `_` itself becomes an object whose children are digit-keyed). When a block needs block-level metadata, the position depends on the block's design (sunstone:9). Some block conventions reserve a digit position for metadata — passport at 9 holds keys, frame at 9 holds canon, sed: at 9 holds governance — but this is per-block, not universal. Other blocks (marks, accumulating logs, pure liquid pools) reserve nothing and use every position for content. Design follows intent; the catalogue at block-conventions records observed patterns, not laws.

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
  db.ts               — storage adapter: federated beach over HTTP + sentinel registry. No Supabase. Includes agent_id translation (bare/sed:/grain: → default beach) and probeFederation helper for distinguishing host-not-federated from block-not-found.
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

## Storage — federated beaches only

bsp-mcp does not host data. It is a router + sentinel server. All persistent block storage lives at federated beaches — JSON KV stores with locks, accessed via `<origin>/.well-known/pscale-beach`.

Two terminating substrates after dispatch:
- **Federated beach** — URL agent_id (`https://...`) → that beach. Data + lock state live there. The beach computes lock hashes under the canonical salt namespaces and stores them.
- **Sentinel registry** — agent_id `"pscale"` → in-memory bundled JSON (sunstone, whetstone, manifest, agent-id, evolution, progression, block-conventions, gatekeeper, protocol-paywall). Read-only, served from process memory.

Three translating forms:
- Bare name (`weft`) → default beach with role-with-handle block name (`shell:weft`, `passport:weft`, `history:weft`, etc.)
- `sed:<collective>` → default beach with block name `sed:<collective>`
- `grain:<pair_id>` → default beach with block name `grain:<pair_id>`

The default beach is configurable via the `DEFAULT_BEACH` env var. Reference value: `https://happyseaurchin.com`.

**No Supabase.** bsp-mcp does not connect to a database. The pscale-mcp-server (separate process) continues to run against Supabase for its own use cases; the two MCPs are separate. Any agent block still in Supabase needs to be migrated to a beach to be reachable via bsp-mcp.

## DESIGN PRINCIPLE — SCALE WITHOUT CENTRAL COST

1. **Railway is convenience, not architecture.** The MCP router runs locally — on a thumbdrive, on a developer machine, on Railway as a default. The walker (bsp.ts/bsp-fn.ts) lives wherever bsp-mcp is hosted; sentinels are bundled. Multiple bsp-mcp instances are normal.
2. **Beaches are the shared coordination layer.** Personal blocks (passports, shells, histories) live at a beach scoped per-handle via the role-with-handle convention. Multi-party state (sed: collectives, grain: pairs, pools) lives at a beach as named blocks.
3. **`.well-known` is the scaling mechanism.** Each site hosts its own beach via `/.well-known/pscale-beach`. Anyone can host one in an afternoon; the protocol is small (GET/POST whole-block or surgical, with locks).
4. **Every feature must ask: who pays at scale?** If "David" or "one central server" — the design is wrong. The router does compute at the user's edge; the beach does storage. Federation distributes the storage cost to whoever wants to host.

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

- **No inbox primitive.** Messages are stigmergy at agent-tagged URLs. Reaches for grain land at the partner's grain block at `grain:{pid}/8._reach_pending` per Stage 6 — partner discovers by walking grain blocks they appear at position 9 of. The `sand_inbox` insert is retained as a transient dual-write for pscale-mcp-server backward compatibility; removed once those readers move to the in-block path. See `proposals/2026-04-30-stage-6-inbox-replacement.md`.
- **No "beach" block.** As of 8 May 2026 the canonical "beach" block is gone — the URL is the *surface*, blocks are siblings. See "Beach-as-surface migration" below.
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
8. **Beach-as-surface migration** — DONE 8 May 2026 across three coordinated PRs ([bsp-mcp-server#17](https://github.com/pscale-commons/bsp-mcp-server/pull/17), [happyseaurchin-home#8](https://github.com/happyseaurchin/happyseaurchin-home/pull/8), [xstream-bsp#1](https://github.com/happyseaurchin/xstream-bsp/pull/1)). The "beach" block with reserved positions was a Supabase-era artifact that turned the live `beach.json` into a dumping ground. After the migration: the URL is the surface; named sibling blocks (`marks`, `passport:<handle>`, `pools`, `liquid`, `tide`, `settings`, `conventions`, etc.) are the only things that exist; `?block=` is required on every read/write; GET without `?block=` returns a derived index; happyseaurchin's handler enforces a shape gate (rejects `_word` keys + JSON-stringified sub-objects); xstream-bsp's writes were migrated from `beach:1/2/5/7/8/9` to dedicated sibling blocks. See "Beach-as-surface migration" below for the detailed handover.

**Deferred indefinitely**: bsp-mcp serving its own `/.well-known/pscale-beach` (commons-as-federation-peer). The commons stays as direct substrate access via bsp-mcp's existing primitives. happyseaurchin.com is the federation testcase — the commons doesn't need to wrap itself.

## Beach-as-surface migration — what shipped 8 May 2026, what's next

### What changed (architecturally)

Before: a federated beach was modeled as a single block named `beach` with reserved positions (1=marks, 2=pools, 3=reaches, 8=conventions, 9=metadata). The handler at happyseaurchin auto-seeded that block, validated writes against a position whitelist, and treated it as the canonical entry. Clients (xstream-bsp, the bsp-mcp adapter) had a special case for `block: 'beach'` (no `?block=` query param sent; default block name everywhere).

After: the URL **is** the surface. A `?block=` parameter selects which named sibling block to address; nothing is special about the name "beach". The handler:
- Requires `?block=` on every write; returns 400 otherwise
- Returns a derived `{_, origin, blocks: [...names]}` index on `GET` with no `?block=`
- Validates write shape — rejects `_word` underscore-prefixed sibling keys (only `_` and digits 1-9 are valid spine keys) and JSON-stringified objects/arrays as values; defense against LLMs importing non-pscale patterns from training
- Creates blocks on first write (no seeding); destroys via DELETE (auth = `_` lock)
- Per-position locks for ordinary blocks (preserved from a prior PR — the first digit of a spindle names the lock position; underscore writes lock at `_`)

### What's where

| Repo | What it owns | Live deploy |
|---|---|---|
| `bsp-mcp-server` | Walker, sentinels, conventions, MCP surface | Railway (`bsp.hermitcrab.me`) |
| `happyseaurchin-home` | Beach handler at `/.well-known/pscale-beach`, Upstash KV | Vercel (`happyseaurchin.com`) |
| `xstream-bsp` | Browser client, V-L-S canvas, viewer drawer | Vercel (xstream subdomain) |

### State at handover

- All three PRs merged. Live happyseaurchin returns `{"blocks":[]}` after the post-deploy wipe (and re-wipe to sweep stale anonymous heartbeats from a pre-PR-#1 browser tab).
- `scripts/wipe-pscale-beach.js` in happyseaurchin-home clears every `pscale-beach-v2:*` key (requires `WIPE_CONFIRM=yes-i-mean-it`). Companion `scripts/wipe-block.js` (HTTP DELETE on a single block) was preserved from PR #7.
- pscale-mcp-server is **disconnected** from the test surface during experiments. Its v1 federation client silently corrupts writes against v2 beaches; both MCPs loaded at once is a known contamination source.
- The beach is open by default — anonymous presence pings are accepted as signal, not noise. Tide-clearing (separate `anonymous_secs` / `handle_secs` / `signed_secs` knobs in the `tide` block) is the right lever for noise control. Gatekeeper-at-write was discussed and rejected (collapses L1/L2 distinction; locks-per-block already give the host the same control without substrate-wide enforcement).

### What's next

1. **Pool/frame synthesis storage refactor.** xstream-bsp still *reads* `pool._synthesis._` and `pool._synthesis._envelope` (and `frame._synthesis._`) — these `_word` keys would be rejected by the shape gate if any client tried to write them. There are no synthesis writers in xstream-bsp's `src/` today; the cycle just renders blank synthesis. When the writer side ships (medium-llm.ts commit path or external synthesis daemon), it must use a sibling block per `block-conventions:4.2.6` (e.g. `pool-synthesis:<digit>` or `solid:pool:<digit>` with shape `{_: text, 1: envelope, ...}`). Reading from `_word` keys can stay until the writer migration; eventually the read sites point at the sibling.
2. **xstream-bsp performance tune.** The cycle now does 4-5 reads per tick (was 1 raw-with-three-projections). Tide and settings rarely change — cache them locally and refresh every N cycles. Marked as a follow-up in the PR description.
3. **Migrate any remaining pre-PR-#1 xstream tabs.** Hard refresh / wait for Vercel to invalidate cached bundles. The new handler creates a `beach` sibling block on demand if any old tab pings — harmless orphan, but periodically `wipe-block.js beach` to keep the index clean.
4. **Port Thornkeep / GRIT** — pending from the v2 roadmap. Pools-as-sibling-blocks is now the natural target.
5. **Dashboard rewrite** for v2 framing labels — pending, low priority.

### How to set up a fresh session

1. Clone or update `bsp-mcp-server`, `happyseaurchin-home`, `xstream-bsp` as siblings under `~/Projects/`.
2. Add the other two as `additionalDirectories` in `.claude/settings.local.json` of whichever repo you start the session in (see "Cross-repo workflow" above).
3. Run `git fetch origin` in each repo and check `git log origin/main..HEAD` — your branch base may be stale.
4. Disconnect pscale-mcp from claude.ai before testing the beach. Both MCPs at once contaminates writes.
5. To deploy a coordinated change: bsp-mcp first (Railway), then xstream-bsp (Vercel), then happyseaurchin (Vercel), then run the wipe script.

## L1 kernel — v2 freeze ready (9 May 2026)

The L1 kernel is the wire-frozen v2 surface that makes Level 1 (Signal) operational and formally gates entry to Level 2 (Commitment). `evolution.json:_.6` names it. Five contracts:

1. `/.well-known/pscale-beach` v2 wire protocol (GET/POST/DELETE shapes)
2. Lock-salt formulas for the three substrate-types (ordinary, sed:, grain:)
3. Spine rule (only `_` and digits 1-9 at every level — no `_word`, no JSON-stringified subtrees)
4. `bsp()` function signature (9 parameters; tools may add but not remove)
5. Address parser semantics (one decimal point per sunstone:1.5, strip-then-iterate, floor-aware padding, multi-dot strict reject)

The Tier 1 sentinel set is the kernel's content side. Above the kernel, everything is forkable — library content (Tier 2, lives in pscale-beach), per-beach conventions, init flows, the bsp-mcp tool surface beyond `bsp()` + the five primitives, individual beach experiences.

Why the freeze gates Level 2: sed: registration is permanent (position-of-arrival, lock-once); grain reach is bilateral (pair_id deterministic, lock-salt scoped). Both depend on the wire and salt formulas being identical at every beach the agent touches. A commitment to a moving target is not a commitment.

**Parser correctness fix LANDED 2026-05-09** in commits `e707702` (floor-aware parser, strict reject on multi-dot) and `b411395` (`bsp2-star.py` updated in lockstep with TS). Multi-dot input now throws `InvalidAddressError` (HTTP 400 `invalid_address` from the wire) at both bsp-mcp's `parseSpindle` and the federated beach handler. No tolerant fallback. The diagnostic record is at [`proposals/2026-05-09-parser-dot-handling.md`](./proposals/2026-05-09-parser-dot-handling.md) (now historical, RESOLVED) and the comprehensive proposal at [`proposals/2026-05-09-floor-anchor-and-multi-dot.md`](./proposals/2026-05-09-floor-anchor-and-multi-dot.md). With this fix landed, all five contracts of the L1 kernel are stable; v2 is ready to be tagged frozen.

## pscale-beach — habitat package (9 May 2026)

The Tier 2 library has left bsp-mcp. Canonical authoring source moved to https://github.com/pscale-commons/pscale-beach (separate repo, created 9 May 2026). The beach package is the habitat side — federated `/.well-known/pscale-beach` handler + seed content + init wizard + Vercel deploy template. bsp-mcp stays the runtime side: bsp() walker, sentinel registry, MCP server, six-tool surface.

The split was driven by an architectural cut: substrate-truth (sentinel-bundled in bsp-mcp) doesn't vary; usage-pattern content (Tier 2 — reflexive, spore, vision, grit, rpg, state, systemic-kernel, federation-protocol, plus state-block-reflexive-spark added 10 May 2026) can vary by community. Federation does real diversity-of-usage work for Tier 2; bundling them in bsp-mcp prevented that. Now each beach operator curates their library variant; updates are pulled manually if wanted; no central sync expected.

**Live beaches as of 2026-05-09**:
- https://happyseaurchin.com — David's reference deployment, predates the pscale-beach repo (uses the same handler shape with hardcoded origin)
- https://beach.idiothuman.com — David's second beach, the first deployed via pscale-beach package via Vercel button + custom domain

**Onboarding**: pscale-beach's README has Option A (Claude Code paste prompt with explicit boundaries — don't modify repo files, don't take destructive beach actions, don't write outside named directories) and Option B (manual CLI). Option A boundaries were added after a Claude Code session silently patched `seeds/library/spore.json` when init failed; the boundaries surfaced from that incident.

**Cleanup status**: As of the 10 May 2026 cleanup pass, `docs/library/` is removed from this repo, `manifest.json` branch 2 (Tier 2 listing) and branch 3.7 (library calls) are deleted, and `progression.json` step 5 references are adjusted. Tier 2 content lives canonically at pscale-beach now; this repo no longer ships or references it.
