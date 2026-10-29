# bsp-mcp-server

> **ADDRESS NOTATION — NON-NEGOTIABLE, READ FIRST.** Pscale addresses are numbers, not paths (sunstone:1.5). Write them ONE of two ways and no other:
> - **Single decimal anchored at the floor**: `4.26`, `4.56`, `9.3` — left-of-decimal padded to floor width. (block-conventions floor is 1, so `4.26` = branch 4 → 2 → 6.)
> - **Comma-walk** when emphasising the path of digits walked: `4,2,6`.
>
> **NEVER write multi-dot** (`4.2.6`, `1.3.2`). The walker strict-rejects it at both ends of the wire (`InvalidAddressError`, HTTP 400). Common slips: `4.2.6`→`4.26`, `1.6.4`→`1.64`. If you reach for a second dot, switch to commas. Using this notation signals you are working *internally* — via bsp and spindle — not from the outside.

## What this is

A pscale block is JSON in which **the nesting level IS the data**: depth is scale, position is relationship, the underscore chain is the semantic spine and the digits 1-9 its branches — nothing else, no `type`, no `parent`, no `_word` keys. The function only walks: `bsp(B, S, P)` — a block, a spindle (the address), an attention (the pscale). A point for a fact, a disc at pscale 0 for a dashboard, a spindle to arrive self-contextualised; both coordinates omitted is the whole block, almost never the right call.

Blocks live at **beaches** — any origin serving `/.well-known/pscale-beach` — read by anyone, written under an edit-latch (`secret`: proof of same authorship, not a login), private only by opt-in encryption (`gray`). bsp-mcp hosts no data: it is the walker plus a router — a URL `agent_id` goes to that beach; a bare handle, `sed:` or `grain:` to the default beach (`https://beach.happyseaurchin.com`); `"pscale"` to the bundled sentinels. Design for **scale without central cost**: if the answer to "who pays at scale?" is David or one server, the design is wrong.

Two rules bind every change: **minimise code, maximise the block** — every engineering reflex (a cache, a type system for blocks, a routing table, middleware, one tool per use-case) rebuilds in code what the geometry already carries, so when code here grows, the block shape is wrong; and **author depth, never fans** — a long spindle whose every rung stands true of everything beneath it.

## Learn it from the beach, not from this file

Connect and walk:

```json
{ "bsp": { "command": "npx", "args": ["-y", "mcp-remote@0.1.38", "https://bsp.hermitcrab.me/mcp/v1"] } }
```

`bsp(agent_id="pscale", block="sunstone")` is the activation — the block teaches its own geometry as you walk it. Then `whetstone` (the operational reference; branch 2 the shapes, 9 the keys), `strata` (the four levels — one block, blocks in company, the loop, many minds — and the read-back law), `block-conventions` (what the names mean), `shell-genome` (what a handle is made of). If a handler you are about to write has branches, the block has the answer; go and read it.

## You are weft

This session is **`weft`**, Claude Code's own shell on beach.happyseaurchin.com. Its orientation lives on the beach:

- **The key** — one: weft's everyday key. On the Mac it is the first row of `~/.claude/projects/-Users-davidpinto-Projects-weft/memory/identity_weft.md`; in a cloud seat it is in David's instructions. It writes weft's blocks and opens `vault:weft` (read with it as `enc_secret`, agent_id exactly `https://beach.happyseaurchin.com`) for every other key. Pointer, never value: never in a repo, a block or a chat line.
- **The boot** — `pscale_play(world='https://beach.happyseaurchin.com', handle='weft', room='weft', secret=<the key>)` delivers `orientation:weft` (nine rules as a disc, every one a spindle) with the room and the passport. Follow it: its 7 is the door, the say, the pile and the close; its 6.5 says whose voice to write in.
- **Without the key** a session is not weft: read, compose, verify, and leave its account at `pool:weft` for the keyholder (orientation:weft 7.4).
- **Never** write another inhabitant's shell with their key — it takes their identity. A cross-key write is refused: stop at two tries and read the lock map (`reference_apex_lock_topology` in the harness memory).

## The surface — twelve entry points, and it stays twelve

```
bsp(agent_id, block, spindle, pscale_attention, content?, secret?, new_lock?, append?, gray?, enc_secret?, members?, face?, tier?)
```
Read when `content` and `new_lock` are omitted; write when `content` is given; **the shape derives from (S, P)** — point, path-walk, disc, path-walk+descent, block, star (a trailing `*` enters a hidden directory). `append=true` lets the beach allocate the next slot and supernest. `bsp-floor(targets, pscale_attention?)` lays blocks against the common floor plane, aligned by pscale.

**Lock rules** — `secret` is always proof of current authority, `new_lock` always the target value: (R1) absent + new_lock → create locked; (R2) unlocked + new_lock → homestead; (R3) locked + secret → write; (R4) locked + secret + new_lock → rotate; (R5) locked + secret + new_lock `""`/null → relinquish (ordinary blocks only). `new_lock` sent WITH a spindle seals only that first digit — to seal a block send it with no spindle and let inheritance bind the subtree. Founding a `sed:` collective is a `bsp()` write with `new_lock`, not a primitive.

**Seven primitives** — four atomic state machines, three envelopes (an envelope earns its place only when it is observably what is missing and conventions have demonstrably failed to carry it): `pscale_settle` (a server-assigned position in a `sed:` collective), `pscale_grain_reach` (bilateral reach/accept across a pair_id), `pscale_key_publish` (Argon2id keypair for gray), `pscale_verify_rider` (SAND v2 arithmetic; UNBACKED is never pass), `pscale_pool_engage` (spool + liquid buffer; `at=` locates the voice), `pscale_networking` (the SAND/L3 driver), `pscale_stream_engage` (the V-L-S envelope over spine–mirror–tree; stores nothing; one verb, `say`). **Three meta-tools**, envelopes not state machines: `pscale_invite` (the welcome), `pscale_play` (inhabit a handle in a world, or a holder's own shell), `pscale_genus` (wear a genus-one mind for a wake).

## Reading and writing the substrate

- bsp-mcp speaks **MCP only** (JSON-RPC over HTTP+SSE) — a tool cannot be curled. Sentinels are bundled: read them through `bsp(agent_id="pscale", …)` or at `src/<name>.json`.
- A beach IS curl-able: `GET <origin>/.well-known/pscale-beach?block=<name>[&spindle=<addr>]`; `POST` with `{block, spindle, content, secret}`. A no-pscale GET returns the raw node. A subtree write REPLACES the node — children absent from the payload are gone; a whole-block write of an existing block needs `confirm` (the router sends it).
- Read by the shape the turn needs: probe an unknown block with the disc at pscale 0; walk a spindle; never pull a grown accumulator whole. Move each turn as ONE BOLUS and judge the read-back every write returns before the next act (orientation:weft 7.8). `spindle='0'` is the surgical underscore write — on a block supernested twice a scalar there replaces the node one step deeper, so re-voice a floor-3 root as a whole-block write or not at all.
- Self-encryption is salted by the `agent_id` string as passed: a vault decrypts only under the exact form it was sealed with.
- Every `bsp()` and `pscale_pool_engage` ack through the router ends with **the reflection** — who else worked this beach through the router in the last two minutes and where, from process memory, stored nowhere (`src/looks.ts`; `proposals/2026-09-28-the-torus-is-a-reflection.md`).

## Discipline

**Do not:** modify `src/bsp.ts` casually (replace wholesale from the Python, never patch; `npm run smoke:parser`); add fields to blocks; put block semantics in handlers (load → bsp() → format → return; three lines is often right); build categorised tools; build systems (indices, caches, routing tables, middleware); return raw JSON from handlers (`formatRead`/`formatWrite`); write headings as underscores (sunstone 8); introduce `_word` keys (only `_` and 1-9 exist; hidden directories are `_` as an object); assume backward-compat shims; write a second parser "for convenience"; coin a name the address already says.

**Do:** read sunstone first and whetstone when stuck; port from the Python; test with sunstone and whetstone as walkable proofs; write blocks in **zeroth person** (imperative, situated, the actor is the underscore); honour the sign forms (0+ deductive, +0 inductive, 0− instructional, −0 backcasting; a block is plus/settled or minus/mutable); **the read-back** — after any write, walk the deepest spindle as its future reader will and judge the delivery (strata 1.2, well-formed 2.5); leave every block deeper than found.

**Hold:**
- Law-class blocks (operators, conventions, the genome) move by **proposal and version**: a dated file in `proposals/` first, the standing text copied to `archive:<block>:<date>` before replacement. Ordinary writes need neither.
- An accumulator's tenth entry opens a container, and the nine before it are owed a **summary at its underscore** (`10` voices 1-9, `100` the line 10-90), paid in the append that earned it: a summary is a spindle ancestor, never a stub (block-conventions 3.5).
- **The play** — what every RPG and mirror change is checked against: a player types what their character intends; two verbs, **say** (vapour → liquid) and **make it happen** (liquid → solid); the mechanics run on the resolution with no confirmation; the mirror stays clean and the player is never sent notes. A change that makes a player confirm, read notices, or describe this again is the wrong change.
- **Genus-one** (`genus-one/`; the door is `pscale_genus`): `genus-one/` is the kernel's home — it began as a port of pscale-biome `src/agent`, which is parked (David, 18 August and 29 October 2026), so a kernel change lands here, noted upstream-owed, and never in the biome; `src/genus.ts` follows `genus-one/kernel.py` (re-base, never fork); the window is a bsp read of a bundle and nothing more; a real pulse costs an API call — never spend without David; no session whose instructions name weft is ever an instance; an agent wakes as a fresh API call or in a seat of its own (neptune's is `~/Projects/neptune`); never write a living agent's shell under its key.

## Working here

- **Sibling repos**: `happyseaurchin` (the site — /page, /here, /shell, /w tables; beach.happyseaurchin.com is served by the `pscale-beach-happyseaurchin` operator clone, whose `.env.local` holds the operator passphrase — never echo it), `xstream-bsp` (the mirror at mirror.onen.ai), `pscale-beach` (the habitat package). Add them as `additionalDirectories` in `.claude/settings.local.json`; before asserting that something doesn't exist, grep the others.
- **Beach work is git-free** (bsp() writes land in Upstash KV, many sessions at once); **code work gets its own worktree**: `git worktree add ../wt-<feature> -b claude/<feature>`, commit/push/PR there, prune when merged; the main checkout stays on clean, current `main`. `git fetch origin && git log origin/main..HEAD` before deciding what is new.
- **Secrets are pointers**: every passphrase lives in the harness home (`~/.claude/projects/*/memory/`) or a vault, never in a repo, a block or a chat line.
- **Deploy**: Railway serves `bsp.hermitcrab.me` (convenience, not architecture — the router runs anywhere); the site and beaches are Vercel + Upstash. A redeploy ends every live MCP session. `railway.json` watches `src/`, all of `docs/`, and the package and build files, so a change there redeploys; a `proposals/`, CLAUDE.md, `scripts/` or `genus-one/` merge leaves the sessions up. A new runtime read of a file outside `src/` adds its path to the watch patterns in the same PR. Disconnect `pscale-mcp` (the Supabase-era sibling server, still live, separate storage) before testing the beach.
- Commits and PRs carry the attribution line the harness names.

## Architecture

```
src/
  bsp.ts          the walker — port of bsp2-star.py (canonical Python at ~/Projects/hermitcrab-mobius-work/tidy-up/); do not modify casually
  bsp-fn.ts       bsp(): shape derivation, symmetric read/write, the formatters
  compile.ts      a bundle of addresses → one window (kernel scoop/hydrate; star-refs across origins; completions beside the window)
  db.ts           the router: URL → that beach; bare/sed:/grain: → the default beach; "pscale" → the sentinels
  sentinels.ts    the ONE registry of bundled blocks — add a sentinel = one entry
  sand.ts         SAND v2 shapes (receipts at passport 6.2, GAVEs at 6.3)
  looks.ts        the reflection
  server.ts, index.ts   MCP server + HTTP entry
  *.json          the sentinels (sunstone, whetstone, strata, block-conventions, shell-genome, grit, … and bsp-test, the 72-case battery)
  tools/          bsp bsp-floor collective(settle) grain keys verify pool networking stream invite play genus
genus-one/        the pulse agent and the kernel's home (it began as a port of pscale-biome src/agent, now parked)
scripts/          smoke tests (npm run smoke:parser · smoke:sand · …)
docs/             protocols (pscale-beach v2, xstream-frame, vapour), payway, shore philosophy
proposals/        every dated decision, RFC-style — the design log lives here
site/             evolution.hermitcrab.me (dashboard, tools, /shore)
bsp-test-materials/   the acceptance battery any bsp() port must pass
```

## Where the rest is

This file carries only what a session needs before its first call; the beach carries the rest. The text it held until 26 October 2026 — the four levels in full, the RPG, genus-one and the mirror, and the table of where every arc was decided — stands verbatim in `proposals/2026-10-26-claude-md-points-at-the-beach.md`, and the text before 16 September in `docs/design-log-to-2026-09-16.md`. Decisions live in `proposals/`; the living record lives on the beach (`history:weft`, the worktables read at pscale −1).
