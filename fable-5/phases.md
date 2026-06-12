# Systemic development phases

Adopted 2026-06-10. The alternative to component creep, stated once:

> **A phase is a closed loop with an exit test, not a component list.** An item enters the current phase's gate only if the loop's test literally crosses it. Everything else lives in a later phase's gate or on the shelf. The shelf holds **decisions, not obligations** — nothing on it is half-done work gnawing for attention. Phase exit = the test passes **live**; the result is recorded on the beach (the substrate records its own transitions), and only then does the next loop open.

The anti-fiddle rule during a phase test: observations made mid-play go to the shelf unless they fail the exit test's own criteria. The test only fails on what it names. This is what protects play from becoming debugging.

---

## Phase I — Closed Table (current)

**The system:** the room-pool RPG played end-to-end through ordinary LLM apps — multi-actor, in-loop resolution, no mid-play edits to anything.

**Where (decision 2026-06-10):** the apex — `beach.happyseaurchin.com` — is the **TABLE**: the default pool_url, where the friends' story lives. The sub-beach — `thornwood.beach.happyseaurchin.com` — is the **RIG**: shapes are proven there, then graduate to the table. The June 5–6 story stays on the table; the rig's proven architecture (knows: facets, floor-1 spines, frame-spec v0.2) ports onto it. Reversible by pointing the same migration the other way.

**Gate** (each item is crossed by the play loop itself):

1. **Window-open trace + honest dice** (server — `src/tools/pool.ts` + smoke cases). The window's open moment becomes a *recorded trace* (stamped at the liquid buffer's underscore when a window opens) instead of an *inference from mutable slots*. Both the dice seed and the window-closed check read it. One mechanism closes two holes: dice-shopping by withdraw/revise (observed live 2026-06-06: +1 → −1 → −4) and clock-shift by the same move. The fix is more stigmergy, not more machinery. **BUILT — PR #80** (smoke 46 → 56, tsc clean); Railway deploys on merge.
2. **Window-duration home** — **DONE on the rig**: `frame-spec:thornwood` 9.2 (90 seconds; the Designer's dial). The nit-edited `function:thornwood:2` names it as the duration's source. Reaches the table with the migration.
3. **Directive nits** — the resolver clears slots with an empty *string* (never an `{_:''}` object); the soft appends a newly-learned name to `knows:<you>` the moment it is earned. **STAGED** in the migration (both surfaces, identical directives).
4. **Uniform character shells**: `witnessed:<handle>` = pure floor-1 beat spine; knowledge index at the `knows:<handle>` facet ({1: people, 2: places}). **PROVEN on the rig** by the parallel session; the migration ports it to the table with the apex story's knowledge folded in (cyrus can name Anya and Maren; anya still cannot name cyrus — the asymmetry preserved exactly).
5. **`frame-spec:thornwood` upgraded** — the rig already carries the v0.2-subjective rewrite (CADO×SMH read-map; duration at 9.2); the migration ports it to the table whole, superseding the two-models-stale apex block. (Outdid the planned banner.)

**Exit test — the multi-actor beat.** Two characters co-present, one window, one skeleton, two divergent renders. Pass criteria, all of them, in one live session through ordinary LLM apps:
- dice unchanged under a withdraw and a revise of the earliest intention;
- the window closes by recorded open-time + duration, and the first toucher after close resolves it in the same conversation;
- perception-brightness holds — neither render contains a name that character has not earned;
- each character's beat appends cleanly to their floor-1 spine;
- no block, directive, or code is edited between the first submit and the second render.

**And the four-face pass** (David wearing each CADO face, same or adjacent sessions — this is what "complete in a systemic sense" means here):
- **Character** — play a beat: the multi-actor test above is this face's proof.
- **Author** — extend the stage: add a fixture or place detail to `spatial:thornwood`, and see it rendered at earned depth on a later perceive.
- **Designer** — change a rule: tune the window duration at `frame-spec:thornwood` 9.2, and see the next window honour the new value.
- **Observer** — produce output: read two `witnessed:` spines and append a correlation narrative (overlap and divergence, never a master truth) to the beach — `history:beaten-drum-main`.

**Closing observation** (the Phase II bridge, zero work): open xstream against the table and note which of the four faces' traces are visible there.

**On exit:** record the result at the beach (a history entry on the room), then open Phase II.

---

## Phase II — Mirror (xstream parity)

**The system:** the same room, played simultaneously from xstream and from a text LLM client. One substrate, two kinds of presence.

**Gate:**
1. xstream commit also-appends a `contribution` to the pool (today it renders a personal solid and the pool never accumulates — `beach-kernel.ts:293`'s own comment).
2. Port `floorUnderscore` into xstream's pool read (`beach-kernel.ts:299` is the naive `po._` that loses the purpose past nine).
3. `frame-spec:thornwood` full rewrite to the room-pool CADO×SMH read-map — pulled off the shelf here because `runBundle` is its real consumer.
4. `runBundle` resolves the frame from the substrate (one frame, both clients); legacy `_synthesis` reads retire.

**Exit test:** one beat where an xstream commit is perceived by a text client and vice versa, purposes intact past nine contributions, concurrent appends interleaving without loss. (This inherently demonstrates append-atomicity under real concurrency — the standing "maybe" item folds in here rather than existing as separate work.)

---

## Phase III — Steward (the optional strict resolver)

**The system:** rooms that resolve even when empty, and strict soft/medium isolation.

**Gate:**
1. Crab rewritten to emit skeletons under the room-pool model (it still speaks liquid→spines+breadcrumb+tick). Anthropic Dynamic Workflows is the blueprint *here* — a runtime giving true agent isolation for the optional resolver — and never for the in-loop path, which must keep running through any LLM app.
2. Re-enable cadence (`gh workflow enable nomad-crab`) once rewritten.

**Exit test:** a closed window resolves with no player present, from a fresh context, producing a skeleton indistinguishable in kind from a player-resolved one.

---

## The shelf (decisions, not work)

Nothing here is in progress. Each is a single decision that, once taken, becomes a small bounded task — or a no.

- `synthesis_hint` param stub: retire vs redesign (server, minutes once decided).
- `probe-open` block at the beach: deliberate l3-relay example or debris — David's call.
- `beach-log:waer`: classify (looks live; left untouched).
- v2 freeze tag + directory Stage 2: recommended trigger — after Phase I exit proves the wire under real multi-actor play. The fetch-bridge raised the stakes: arbitrary clients bind to the wire, so the tag is the compatibility promise.
- Sentinel mirroring to a beach (orientation without bsp-mcp): decide only when a real client needs it.
- Docs-to-substrate migration: this directory retires file-by-file into blocks once Phase I/II settle the conventions being documented.
- In-browser crypto parity (Argon2id in WASM) for MCP-less agents wanting keys/gray: needed only when such an agent exists.
- Atomic window-open: two simultaneous openers race the fresh-buffer rebuild (last wins; the loser re-stages on their next submit, visibly absent from the mirror). Cooperative-play acceptable; revisit only if observed at the table.
- Rig reseed cadence: when/how the sub-beach resets from `packs/thornwood` after table graduations — operator's call; cartridge harness already proven.

---

## Status ledger

| Item | State |
|---|---|
| Gate 1 — window-open trace | **DEPLOYED** — PR #80 merged; verified live on the router 2026-06-12 (revise held dice at −6, stamp unmoved; withdraw + resubmit opened a new window, new stamp, new dice) |
| Gate 2 — duration home | **DONE on the table** — frame-spec 9.2 (90s, the Designer's dial); `function:thornwood:2` cites it |
| Gate 3 — directive nits | **DONE** — both surfaces carry identical nit-edited directives |
| Gate 4 — uniform shells | **DONE on the table** — knows:cyrus/anya/fenn live; witnessed: spines floor-1 (cyrus 6 beats, anya 4, fenn 2); name-asymmetry preserved; originals archived at `archive:witnessed:*:2026-06-10` |
| Gate 5 — frame-spec | **DONE** — rig v0.2-subjective live on the table; stale original at `archive:frame-spec:thornwood:2026-06-10` |
| Table/rig pointer | lighthouse 5.43 records it on-substrate |
| **Phase I remaining** | **the exit test only** — David plays: multi-actor beat + the four-face pass + the xstream glance |
| nomad-bsp PR #3 (cron disable + solid drop) | merged (David, 2026-06-10) |
| Beach test-debris sweep | done — 14 blocks force-wiped; `test-spatial-floor3` kept (bsp-test fixture); `probe-open`, `beach-log:waer` kept pending classification |
| happyseaurchin-home | tidy commit pushed to main (2026-06-12) |
| fable-5 working set | merged (#79); gate code merged (#80) |
