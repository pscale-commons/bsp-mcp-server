# Systemic development phases

Adopted 2026-06-10. The alternative to component creep, stated once:

> **A phase is a closed loop with an exit test, not a component list.** An item enters the current phase's gate only if the loop's test literally crosses it. Everything else lives in a later phase's gate or on the shelf. The shelf holds **decisions, not obligations** — nothing on it is half-done work gnawing for attention. Phase exit = the test passes **live**; the result is recorded on the beach (the substrate records its own transitions), and only then does the next loop open.

The anti-fiddle rule during a phase test: observations made mid-play go to the shelf unless they fail the exit test's own criteria. The test only fails on what it names. This is what protects play from becoming debugging.

---

## Phase I — Closed Table (current)

**The system:** the room-pool RPG played end-to-end through ordinary LLM apps — multi-actor, in-loop resolution, no mid-play edits to anything.

**Gate** (each item is crossed by the play loop itself):

1. **Window-open trace + honest dice** (server — `src/tools/pool.ts` + smoke cases). The window's open moment becomes a *recorded trace* (stamped at the liquid buffer's underscore when a window opens) instead of an *inference from mutable slots*. Both the dice seed and the window-closed check read it. One mechanism closes two holes: dice-shopping by withdraw/revise (observed live 2026-06-06: +1 → −1 → −4) and clock-shift by the same move. The fix is more stigmergy, not more machinery. Deploys itself on merge.
2. **Window-duration home** — `function:thornwood` gains digit 4: the room's default window duration. The resolver aperture (`:2`) reads it instead of improvising.
3. **Directive nits** (same GM edit session as 2): the resolver clears others' slots with an empty *string*, not `{_:''}`; the soft appends a newly-learned name to the character's knowledge index the moment it is earned.
4. **Uniform character shells**: `witnessed:<handle>` becomes a pure floor-1 beat spine; the knowledge index moves to a `knows:<handle>` facet ({1: people, 2: places}); migrate all live characters to the one shape; one-line edit to `function:thornwood:1` to read names from the facet. (This is what makes write-my-history work identically for every character, every turn.)
5. **`frame-spec:thornwood` defused** — a one-write banner marking it superseded by `function:thornwood` + the in-loop model, so no future session rebuilds the wrong model from it. The full rewrite belongs to Phase II, where its real consumer arrives.

**Exit test — the multi-actor beat.** Two characters co-present, one window, one skeleton, two divergent renders. Pass criteria, all of them, in one live session through ordinary LLM apps:
- dice unchanged under a withdraw and a revise of the earliest intention;
- the window closes by recorded open-time + duration, and the first toucher after close resolves it in the same conversation;
- perception-brightness holds — neither render contains a name that character has not earned;
- each character's beat appends cleanly to their floor-1 spine;
- no block, directive, or code is edited between the first submit and the second render.

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
- happyseaurchin-home local uncommitted changes (modified CLAUDE.md, deleted hyperbolic-trilogy docs 57/66/67): David restores or commits — not an agent call.
- In-browser crypto parity (Argon2id in WASM) for MCP-less agents wanting keys/gray: needed only when such an agent exists.

---

## Status ledger

| Item | State |
|---|---|
| Phase I gate 1-5 | not started (held while David's parallel RPG session finishes; B-items touch the same live blocks) |
| nomad-bsp PR #3 (cron disable + solid drop) | **merged** (David, 2026-06-10) |
| Beach test-debris sweep | **done** 2026-06-10 — 14 blocks force-wiped (12 timestamped sed: artifacts, grain:aaaa…, liquid:1); `test-spatial-floor3` kept (bsp-test fixture); `probe-open`, `beach-log:waer` kept pending classification |
| happyseaurchin-home sync | up to date; local uncommitted changes surfaced to David |
| fable-5 working set | committed this branch |
