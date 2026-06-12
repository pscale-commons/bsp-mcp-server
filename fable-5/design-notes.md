# Design notes — Fable 5 era (living document)

Started 2026-06-10. Forward-looking notes; superseded entries get struck through with a date, not deleted.

## The fetch-bridge, taken seriously

The beach speaks plain HTTP; the walker is a pure function; therefore **bsp() exists on both sides of the fetch bridge** and any fetch-capable LLM runtime is a Level 1–2 participant with no install. Implications, in order of weight:

1. **The v2 freeze is the binding API.** Browser agents, third-party LLM apps, and future clients bind to the wire contract (`/.well-known/pscale-beach` v2, lock-salt formulas, spine rule, signature, parser semantics) — not to bsp-mcp. Freezing and tagging it stops being a registry-listing chore and becomes the protocol's compatibility promise to every client nobody controls.
2. **hermitcrab.me as a browser-resident shell host.** The MAGI shell blocks (shell:, concern:, reflexive:, wake:, …) already live on the beach; a browser page with an API key + fetch + the JS walker can inhabit one. The beach-crab ladder's lower rungs do not need a server.
3. **What must stay in bsp-mcp** (cannot move to the wire): client-side crypto (Argon2id key derivation; gray/group encryption — secrets never reach the beach *by design*), the primitives' client halves, agent_id translation, sentinel orientation. Watch-item: if browser agents want keys/gray without bsp-mcp, they need Argon2id in WASM and the same salt formulas — a parity problem to solve deliberately, not by accident.
4. **Sentinels could be mirrored as beach blocks** so even orientation needs no MCP. Cost: version skew between mirror and bundled registry. Decide only when a real client needs it; until then the bundled registry is the single source.

## Docs-to-substrate trajectory

David's stated hope: pscale blocks on the beach replace legacy code-heavy services (GitHub-resident markdown, etc.). Practical path:

- This directory is **scaffolding** — each file should eventually retire in favour of a block (`fable5-observations` or a fold into an existing block's branch), leaving a pointer.
- Blocks demand the authoring discipline (zeroth person, sign forms, substantive underscores) — porting a doc is a *rewrite*, not a copy. Budget for that.
- The proposals/ decision-record pattern is the hardest to substrate-ify well (dated, immutable, supersession banners). Candidate shape: a `proposals` accumulator block, +0 inductive, supernesting by era. Not urgent.

## Enforcement trajectory (vigilance → structure)

Invariants currently carried by prose and recurrence-proofing in memory, ranked by value of hardening:

1. **Dice re-seed exploit** — `pool_engage` seeds window-dice from the current-earliest submission timestamp; withdrawing the earliest re-rolls. Fix: seed from immutable window-open state. (`src/tools/pool.ts`, small, confirmed by David.)
2. **Append atomicity under real concurrency** — contract says atomic server-side; demonstrate with N concurrent writers against a scratch block on the deployed handler. One script.
3. **Character-spine floor rule** — append targets the floor, so a knowledge-index in the root `_` (object) silently breaks beat-append (the fenn `1,2` nesting incident). Once the canonical shell lands (floor-1 spine + knowledge facet), consider a handler-side or client-side guard: warn when appending to a block whose floor ≠ 1 and whose name matches an accumulator convention.
4. **Heading-trap lint** — authoring failure (sunstone:8.3) detectable heuristically (underscore < N chars, no verb). Advisory tooling only; never enforcement — deviation is legal by design.

## Recomposed change queue (2026-06-10, post handover reconciliation)

**Canonical organization moved to [phases.md](phases.md) (same day) — closed-loop phases plus the shelf. This section stays as the itemized source map (the A/B/C/D/E labels phases.md references). B-items remain held until David's parallel RPG session lands — they write the same live blocks (`function:thornwood`, `witnessed:`, `frame-spec`). Re-read the beach index and `git fetch` every repo before starting any item.**

**A. bsp-mcp server (Railway auto-deploys on merge to main)**
1. **Dice-seed immutability** — code-confirmed exploit at `src/tools/pool.ts:589-592`: the window seed is the earliest timestamp among *current* liquid slots; a withdraw writes a fresh-ts tombstone (skipped by `collectContributions`) and a revise re-stamps, so either shifts `stamps[0]` and rerolls the dice. Fix direction: seed from committed, append-only state — e.g. `pool:<room>:window:<slot-of-last-committed-skeleton>` (the window ordinal); immutable once the window's predecessor exists, fresh per window, no schema change. Add smoke cases: withdraw-earliest and revise-earliest leave dice unchanged. **Reframed (same day): the root flaw is that the window's open moment is *inferred from mutable slots* — the same move also shifts the window clock (`function:thornwood:2` computes open-time from the earliest slot). Fix at the root: stamp the open moment at the liquid buffer's underscore when a window opens; the dice seed AND the closed-check both read that trace. One mechanism, two holes — more stigmergy, not more machinery.**
2. (Low, decision) `synthesis_hint` param stub — retire or land the redesign; don't carry the accepted-but-not-stored state long-term.

**B. Live beach blocks, GM-secret writes — only after the in-flight session lands**
3. **`frame-spec:thornwood` rewrite** — verified live as TWO models behind: still says "read solid:<handle>…" and "the outcome lands in this character's narrative when the medium writes it" (per-character-medium era), while `function:thornwood` is room-pool (public skeletons, self-render). Either align it to room-pool as the CADO×SMH read-map, or fold the residue into `function:thornwood` — decide at edit time.
4. **`function:thornwood` nits** (from handover, agreed): resolver clears others' slots with an empty STRING, not `{_:''}`; soft appends a newly-learned name to `witnessed:<you>:1`.
5. **Window-duration home** — still none (`:2` says "the room's duration" but nothing stores it). Smallest move: a free digit on `function:thornwood` (4 is open).
6. **Character-shell consolidation** (proposal §7): `witnessed:<handle>` → pure floor-1 beat spine; knowledge index → `knows:<handle>` facet ({1: people, 2: places}); migrate cyrus + anya to fenn's clean shape; one-line `function:thornwood:1` edit to read names from the facet. Provisional play continues on `witnessed:` until this lands (§7's own instruction).

**C. nomad-bsp**
7. PR #3 — **MERGED** (David, 2026-06-10); carried both the cron disable and the `games.json` solid-ref drop.
8. Crab rewrite to emit skeletons = an *optional* strict resolver for empty rooms. If ever built, Dynamic Workflows is the blueprint THERE — never for the in-loop path, which must run through any LLM app (the load-bearing requirement).

**D. xstream (client-side — the real open work, both code-confirmed)**
9. On commit, ALSO `contribution`-append to the pool — `beach-kernel.ts:293` comment states "xstream commits do not accumulate slots" (the #70 interim); the pool never accumulates from xstream.
10. Port `floorUnderscore` into the kernel's pool read — `beach-kernel.ts:299` does naive `po._` (string-or-empty), the exact "purpose vanishes past 9" bug bsp-mcp fixed.

**E. Process / hygiene**
11. Beach test-debris sweep — **DONE** 2026-06-10 via `force-wipe-blocks.mjs` (operator KV deletion): 14 blocks removed (12 timestamped sed: test artifacts + `grain:aaaaaaaaaaaaaaaa` + empty `liquid:1`). KEPT: `test-spatial-floor3` (it is the bsp-test battery's named fixture — `src/bsp-test.json` invokes it), `probe-open` and `beach-log:waer` (pending classification, on the shelf).
12. Commit `fable-5/` — **DONE** (this branch/PR).
13. happyseaurchin-home — **DONE**: already in sync with origin/main; local *uncommitted* changes surfaced to David (modified CLAUDE.md, deleted hyperbolic-trilogy docs 57/66/67, stray worktrees dir) — his restore-or-commit call.

After B: the frontier — **multi-actor live test** (two co-present characters, one window, one skeleton, two divergent renders).

Constraint throughout: share the stage (pool / setting / rules — agreements), distribute the play (narratives — contested). Resist the central-canon gravity.

## Opus 4.8 handover (2026-06-10) — reconciliation record

Checked claim-by-claim against the running function (its own discipline). **Verified**: two verbs / two markers (schema + `pool.ts` handler); PRs #76-78 at tip `cd5c9c7`; `floorUnderscore` floor-aware purpose (`pool.ts:245`); purpose/hint de-dupe (`:566`); window-dice handed deterministically (`:589`); `function:thornwood` live text = proposal §5 verbatim; smoke now **46/46** (suite grew from the handover's 41); Railway router / Vercel beach; redeploy gotcha and the curl-JSON-RPC fallback noted; Dynamic-Workflows position adopted (strict-resolver blueprint only).

**The handover missed one live defect**: the dice re-seed exploit (queue item A1) — present in the deployed code it certified, absent from its DEFERRED list. **It understated one**: `frame-spec:thornwood` is two models behind, not merely name-stale. **Label nit**: "happyseaurchin (beach handler)" — the repo is `happyseaurchin-home`, and the deployed handler builds from the `pscale-beach-happyseaurchin` operator clone, not from that repo.

Standing lesson it teaches correctly, now twice-validated this session (Railway/Vercel; dice exploit): **ask the running function — grep the schema, run the smoke, read the deployed block — before repeating any claim, including this document's.**

## Beach hygiene (confirmed, pending feasibility)

Test debris at beach.happyseaurchin.com: `sed:addrtest-1780610601050`, five `sed:e2e-*`, three `sed:probe-*`, `sed:rs-A/B-*`, `grain:aaaaaaaaaaaaaaaa`, `liquid:1`, `test-spatial-floor3`. DELETE auth is the `_` lock per block; test blocks were created with throwaway passphrases. Check what operator override the pscale-beach handler offers (wipe scripts in the operator clone) before promising the sweep.

## Open questions

- v2 freeze: parser fix landed 2026-05-09; all five contracts stable. What, concretely, blocks tagging the freeze? (Then directory Stage 2 unlocks.)
- `pool_engage` synthesis_hint param is accepted-but-not-stored pending the submit/commit redesign — retire the parameter or land the redesign; don't leave the stub long-term.
- Does the RPG's `function:thornwood` directive belong in the sentinel set once stable, or stay per-beach forever? (Lean: per-beach — federation does diversity; sentinels are substrate-truth only.)
