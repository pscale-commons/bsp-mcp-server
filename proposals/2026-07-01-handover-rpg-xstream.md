# HANDOVER — RPG through xstream: tier-3 host-key play is LIVE (2026-07-01)

*Paste this as the opening message of a fresh session to continue. This session ran tests;
compare the next session's feedback against this to form the "working handover."*

**Truth = running code + the live beach, NEVER a ledger or a proposal.** Verify every claim by
reading the live block (`bsp` tool) or the source. First `bsp` call may say "connector not
responding" once and self-recover. ALWAYS use `bsp` to comprehend the substrate experientially.

## Where things stand

RPG-through-xstream works end-to-end at **three onboarding tiers**. A stranger can now play a
character with **nothing but a passphrase** — no API key. Confirmed live this session: `cadell`
rendered a scene on the host key; the proxy health-checked 200.

**Repos** (add all three as `additionalDirectories`; xstream-bsp's GitHub org is `happyseaurchin`):
- `bsp-mcp-server` — MCP router, sentinels (sunstone/whetstone/grit), the rig, `pscale_play` /
  `pscale_pool_engage`. **Start here.**
- `pscale-beach` — the federated beach handler (`api/pscale-beach.js`), cartridges (`packs/`),
  `pack-seed` / `pack-reset` scripts.
- `xstream-bsp` — the V-L-S client (React/Vite) → auto-deploys `main` to **xstream.onen.ai**
  (Vercel project `xstream-bsp`, team `happyseaurchins-projects`). NEVER push `main`; branch +
  held PR; **David merges**.

All RPG PRs merged: **#82** multi-character, **#83** pre-load links, **#84** host-key proxy,
**#85** location-derived rooms + arrival orientation, **#86** soft-LLM on host-key, **#87**
thornwood room-derive fix.

## The three onboarding tiers

1. **MCP** — a claude.ai connector on `bsp.hermitcrab.me/mcp/v1`; `pscale_play(world, handle,
   secret, room)`. Runs on the **player's own LLM**.
2. **xstream BYO-key** — a pre-load link + the player's own Anthropic key.
3. **xstream HOST-KEY** — a link + a passphrase; runs on **David's key** via a Vercel serverless
   proxy (`xstream-bsp/api/llm.ts`) gated by an allowlist env (`XSTREAM_HOST_PASSPHRASES`). Player
   brings nothing but the passphrase. Hard spend cap lives on the Anthropic key (console limit).

## The roster + how to play

**HOST-KEY (David's tab) — world `thousand-valleys`, positional room `pool:6`** (all three stand
at spatial position 6 = the gather-stone, so they co-play):
- handles: `cadell`, `aderyn`, `yarem` — **passphrases in local memory `reference_rig_credentials`**
  (do NOT list secrets in-repo).
- Play: open `xstream.onen.ai/?world=thousand-valleys&character=cadell` → click the handle chip
  (top-left) → enter handle + passphrase → **leave the API-key box blank** → type → **Commit**.
  ⌘↵ = ask the assistant ("where am I").

**BYO-key — world `thornwood`, named room `beaten-drum-main`:** handles `cyrus`/`anya`/`fenn`;
link `?world=thornwood&character=cyrus&room=beaten-drum-main` + the player's own `sk-ant-…` key.

Live-beach reset (for a pristine start): `pscale-beach/scripts/pack-reset.mjs` with the world's
`*_GM/*_<char>` env secrets (see memory). **The harness auto-classifier blocks live-beach resets
even when authorized — David runs them.**

## Architecture (verified against code this session)

- **Both halves:** objective = shared `pool:<room>` (terse public beats); subjective =
  per-character `witnessed:<handle>` (POV). The render produces the subjective FROM the objective.
- **Multi-character BY DESIGN:** a pool-driven PERCEIVE loop (`xstream-bsp/src/components/Column.tsx`)
  renders each character's POV from the SHARED pool as OTHERS act — not only on self-commit.
  Mirrors the rig's `perceiveAndJournal`/`act` split.
- **Location-derived rooms:** room = `pool:<spatial-addr>` from `passport:3`, for POSITIONAL
  worlds (thousand-valleys → pool:6). NAMED-room worlds (thornwood → pool:beaten-drum-main) keep
  their link room — the derivation only redirects when that pool EXISTS (#87).
- **Orientation:** on arrival the render assembles the scene (place + standing figures +
  co-presence + knows), ported from `pscale_play` into `xstream-bsp/src/kernel/perceive.ts`.
- **GRIT** (`pscale:grit` sentinel) = the loop; **NOMAD** (`rules:nomad`) = resolution (per-actor
  seeded dice + bands). EXCHANGE (talk/look/move) posts direct to the pool; only a CHECK (uncertain
  act with a cost) gathers a window + resolves.

## Open threads (next work)

1. **Character creation** — no polished flow yet. A new character needs `passport:<h>` (with a
   location `spatial:<world>:<addr>` → derives their room) + `shell`/`witnessed`/`knows`, locked
   with a passphrase. Author/Designer face + `bsp()` writes is the intended surface; parked as
   "player-facing world/character creation (Author face)."
2. **World-linking (David's idea):** join thornwood + thousand-valleys as two AREAS of ONE world
   via a **supernest spatial block** — one combined world-beach, one `spatial:<world>` with two
   branches; a character moves area by changing location, and the room follows (location-derived).
   Fits the model cleanly; requires a combined beach + cartridge.
3. **create-on-arrival** — a location whose pool isn't seeded should get created (`{_: pscale:grit}`)
   on arrival. Deferred (clobber-safety).
4. **Cartridge inconsistency** — thousand-valleys MANIFEST says one `commons`; the seed makes
   positional `pool:1`/`pool:6`. Settle the room model.
5. **Tidy:** ~66 stale merged local branches; the `happyseaurchin` user handle appears in the
   character dropdown (it's the handles registry `xstream:handles` in localStorage — David is OK
   with it; optional label/hide/forget). Leftover test beat "stand up!" in pool:6 + orphan
   `liquid:pool:thousand-valleys-commons` (cosmetic).

## Disciplines

- Commit only when David asks; branch first; held preview PRs; David merges.
- Rig-validate before any live reseed. Build EXPERIENCE (human AND LLM), not just structure.
- `user = agent = character` — zero substrate difference. The substrate is memory; don't put
  continuity in LLM session state.

## First actions in the new session

1. `bsp(agent_id="pscale", block="whetstone")` (the activation), then `sunstone`.
2. `git fetch origin && git log origin/main..HEAD` in each repo; check the deploy is READY.
3. Read `xstream-bsp/proposals/2026-06-28-rpg-xstream-exchange-first-build.md` and
   `2026-06-30-xstream-host-key-proxy.md` for the design record.
4. Play a tier-3 character (feel it) or run the rig (`bsp-mcp-server/scripts/rpg-rig.ts`).
