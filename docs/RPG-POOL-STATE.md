# Subjective RPG + pool — system state and open joints

**Read this before touching the RPG or the pool primitive.** It exists so a session
*executes* the joints below rather than re-designing them. The joints are **decided,
not open for re-design.** If you find yourself about to write a new proposal, or to
rebuild the architecture from scratch — **stop**: the canon is `rpg-architecture-subjective`
(§2); the older objective `rpg-architecture` is a superseded draft, not a design gap. The
discipline this whole effort defends: *maximise pscale block + bsp + LLM; do not
multiply code.*

Last updated 2026-06-04 (spool/frame/destination decomposition added; Phase 0
submit/commit/destination landed on branch `claude/pool-spool-submit-commit-2026-06-04`,
smoke-proven, **not yet deployed to Railway**).

---

## 1. What is LIVE and PROVEN (the runtime)

- **Pool accumulates past 9 by supernest** — `src/accumulator.ts` (`appendWithSupernest`); `pool_engage` wired; envelope hint comes from the pool's underscore. PR #63, **deployed** (Railway → `bsp.hermitcrab.me`). Proven by smoke (accumulator 22/22, pool-engage 34/34) and live for a single contribution; **past-9 not yet exercised live** (§3 Joint C).
- **Perception-as-depth** — proven live on `spatial:thornwood:111`: the secret ("the stillness is listening") sits at `111*1.31`, occluded at a newcomer's depth (`111*1` `P=-1`), revealed at `P=-2`. Occlusion **is** read-depth; the mechanism is real (the substrate returns whatever `P` is asked — *entitlement* is convention, hardenable via `sed:`/locks).
- **`function:thornwood:1`** is a faithful **subjective soft directive**, live. The pool's underscore points the soft to it.
- **`accumulator.ts`** is a reusable geometry helper — `marks` and `history` can adopt the same `appendWithSupernest` call.

## 2. RESOLVED — canon is `rpg-architecture-subjective` (Weft's)

The canonical RPG constitution is **`rpg-architecture-subjective`** on the beach —
Weft-authored, branches 1–9, citing the live proof, locked under Weft's own passphrase.
A fresh session reads **that** block for the architecture, and the runtime
(`function:thornwood`, `frame-spec:thornwood` v0.2, the conformed room) already agrees
with it.

The older **`rpg-architecture`** block is happyseaurchin's earlier OBJECTIVE draft (one
shared `solid:`, `visible_to`). It is **superseded, not promoted** — left in place,
untouched, ignored. No promotion step, no shared lock to wait on: canon and runtime
already say the same thing. **Closed.**

## 3. The open joints — DECIDED, spec'd. Execute; do not re-open.

### Joint A — the resolution leg (the loop's last joint)
*Symptom (parallel test):* a committed intention has no path back to a spine — turn 2
can't read its own outcome. `solid:beaten-drum-main` still exists; the medium→spine
write lives in `nomad-bsp` crab code, not operational on the beach.
*Decided:* the medium (crab) reads the window, resolves, and writes each character's
outcome into **that character's own spine** (`witnessed:<handle>`) — never a shared
`solid:`. Then **retire `solid:beaten-drum-main` + `visible_to`**, and align
`function:thornwood:2,3` to subjective. Coupled: soft-reads-spine requires
medium-writes-spine, so these land together.
*Do not:* run the crab's **consolidation** until conformed — its current fold
re-pollutes the room that was cleaned (`spatial:thornwood:111`).

### Joint B — the cross-spine clock (next thing that breaks under real play)
*Symptom (parallel test):* `witnessed:cyrus` already holds post-revelation knowledge
while the stage's public surface shows the pre-approach moment. That spine≠stage gap is
correct — but with **no tick on events**, a medium cannot order two characters' spines
against each other.
*Decided* (from the synthesis doc, was tagged `[word-model]`): each resolved beat
carries a `tick` (per-subject forward time + scene-round alignment); the medium
interleaves co-present spines by tick. Build it **with** Joint A — it is the same medium
pass, not a separate system.

### Joint C — past-9 supernest, live
Deployed and unit-proven, but only one live contribution posted. Post 9+ to a throwaway
pool on `bsp.hermitcrab.me` and confirm the 10th supernests in production (the original
nine stay intact, the 10th is a fresh `11`).

## 4. The systemic model — spool / frame / destination

The tangle ("is the pool one-slot or a spool? is RPG built-with the pool or a different
thing?") dissolves once three operations that were bundled are separated:

1. **SPOOL** — *transport*. Append a contribution; pull everything since my marker. No
   intelligence. This is the `pool` block (`4.2`, append-accumulate) + `pool_engage`'s
   `since_position`. The primitive owns this and nothing more.
2. **FRAME** — *synthesis / resolution*. Compile the pulled slice into a rendition.
   Always an LLM: `project(manifest, directive, handle)`. The puller's own LLM, or a
   dispassionate other (crab / separate player). Never the primitive.
3. **DESTINATION** — *the dial*. Where the rendition lands: **nowhere** (personal,
   ephemeral) · **the pool / a shared `solid:<name>`** (objective) · **subject spines**
   `witnessed:<handle>` (subjective).

So **RPG does not fork from the pool.** It is the spool + a particular FRAME (medium
aperture) + a particular DESTINATION (spines). Quaker decisioning is spool + minute-FRAME
+ shared-solid. Chat is spool + personal-FRAME + no destination. One base; the variation
lives entirely in layers 2–3, above the primitive.

**liquid vs pool (the one-slot vs spool question):** two blocks, two jobs, both kept.
`liquid` (`4.5`) is one slot per author, OVERWRITING — the *pending* mirror (your current
intention; change-of-mind costs nothing). `pool` (`4.2`) is append — the *committed* spool
(every entry permanent; change-of-mind is a new entry, narrative signal). Per-author-
single-slot lives in liquid ONLY; the spool never imposes it. Flow: vapour → liquid
(submit) → commit → pool entry (or solid, or spine).

### Phase 0 — the gate (LANDED, branch `claude/pool-spool-submit-commit-2026-06-04`)

`pool_engage` gained three params, all dumb (transport only, never synthesises):
- **`submit`** → write/overwrite my slot in `liquid:pool:<name>`; return the social mirror
  of co-present pending intentions. No pool append. Empty = withdraw. Brings the pending-
  mirror reflexivity to a bare bsp-mcp caller, because liquid lives on the beach.
- **`contribution`** (commit) → atomic append (`appendToBeach`) of raw text OR an
  LLM-produced synthesis (agnostic) to `destination`.
- **`destination`** → `pool` (default) or a block name like `solid:<name>`. The objective dial.
- `with_liquid` → include the mirror on any call.

Smoke 41/41, typecheck clean, **no beach change** (orchestrated over existing block ops).
A pool's directive stays external (its underscore points at e.g. `function:<game>` position 1);
the synthesis_hint is never a digit position (supernest would claim it). Deferred: per-slot
liquid locking (open-by-default; harden via lock/face later). Spine writes are NOT a
destination here — they are the resolver's bsp() job (Phase 1).

### Phase 1 — the RPG leg (Joints A + B)

The medium reads the window, frames, writes each character's outcome to their OWN spine
`witnessed:<handle>` via **bsp()** (not `pool_engage` — spines are structured, not append-
logs). Retire `solid:beaten-drum-main` + `visible_to`; align `function:thornwood` positions
2 and 3 to subjective. Add the **tick** (Joint B) to each beat so co-present spines
interleave. Spine write-authority is permissive-by-convention (the room's medium writes),
hardenable later via lock/face.

### Phase 2 — the reflexive surface (xstream)
- **xstream amendment when this lands:** the existing [xstream-bsp#70](https://github.com/happyseaurchin/xstream-bsp/pull/70) (merged 2026-06-02) currently shapes pool commits as "personal solid display only, no substrate write" — an interim that was correct for the pre-Path-3 model but doesn't carry the submit/commit split. The amendment: pool submit → `pool_engage(submit=...)` writing `liquid:pool:<name>` (no synthesis returned); pool commit → `pool_engage(commit=...)` writing the chronicle slot (general pools) or character spine (RPG redirect, Joint A) and rendering the returned synthesis envelope in the solid zone. The "no substrate write" needs to become "write a destination determined by the engagement kind". `beach-kernel.ts:readPool` stays scrubbed of legacy `_synthesis`; the personal solid state remains a Column-level concept (commit-time-only, not auto-rerun). Source map for the amendment: `src/components/Column.tsx` commit handler (the pool branch added by #70) + the soft-LLM tool descriptions in `src/kernel/claude-tools.ts` (so the LLM reaches for `submit=` vs `commit=` correctly).
- **Refinement (Phase 0/1):** the line above says "pool commit → character spine (RPG redirect)". Sharpened: a *player's* commit always lands in the **pool** (their intention, `destination=pool`); the **spine** write is the *resolver's* job (Phase 1, via bsp()), never `pool_engage(commit)`. So xstream's RPG commit targets `destination=pool`; the medium/crab fans to spines separately. The objective/subjective split is who-writes-where, not a pool_engage destination.

### Phase 3 — the resolver runner: **crab cron first** (David carries the cost), distributed later

Resolution = any LLM reading a directive block + writing the outcome to a destination. Two
runners, same path; **build the crab first** (David's call, 2026-06-04 — he carries the
cost initially):
- **crab cron** (now): a thin runner scanning pools for closeable windows; deterministic-
  first (sha256 dice = no LLM) for SIMPLE windows, LLM for narrative. Gives autonomy +
  dispassion + (later) pay-to-play in one. A cron job, not a primitive — surface stays at eight.
- **distributed** (later): the pulling player's LLM resolves a window it did not act in
  (shared-table labour), farming the cost to the inquiry. Needs `function:thornwood` position 2
  executable-by-any-LLM (Phase 1 delivers that).

### Cross-cutting

`block-conventions:4.2` doc update (submit/commit/destination + resolution-as-tagged-entry);
optionally a generic resolution convention sentinel-bundled (sibling of sand-rider/l3-relay).
Cleanup: retire legacy `solid:`, the stale `rpg` block (still the objective model, references
the dissolved `pscale_create_collective`), the `living-space`/`living-spaces` drift.

**Two clarifications that survive "keep the primitive dumb" (David, 2026-06-04):**
- A *user submitting their own LLM's production* is just `commit` with synthesised content —
  the primitive is agnostic to raw-vs-synthesised. (Quaker: you like your own draft minute → commit it.)
- *Farming the crab cost to the inquiry* is the distributed runner — same commit path, different
  trigger. A dumb primitive precludes neither.

**Discipline:** no synthesis in the primitive; submit/commit are params, not a tool; no
central resolver service; no beach change beyond existing block ops; surface stays at eight.

## 5. Ownership (David assigns; the work is spec'd so it transfers cleanly)

- **Constitution (§2)** — closed; canon is `rpg-architecture-subjective` (Weft's). No promotion, no lock step.
- **Path 3 / pool primitive (§4)** — the pool-behaviour session.
- **Resolution leg + clock (Joints A, B)** — the RPG-medium build (the `nomad-bsp` crab).
- **`block-conventions:9` + `4.2`** accumulator-shape update — with whoever does §4.

## 6. The design records

- `proposals/2026-06-03-supernest-floor-growth-and-positional-ladder.md` — on disk; the supernest spec implemented in `accumulator.ts`.
- The four `proposals/2026-06-02-*.md` RPG docs (the grounded synthesis + its two superseded predecessors, the xstream-extension scope) were authored this session but **lost to concurrent branch churn before being committed**. Their essence is consolidated into this state doc; the full synthesis is recoverable from the 2026-06-03 session transcript if the detail is wanted. **Lesson: untracked docs do not survive the multi-session branch switching this repo currently sees — commit on creation.**
- **Authorship:** the subjective RPG design — `rpg-architecture-subjective`, the spine / perception-as-depth / manifest model, the proven authoring law — is **Weft's**; happyseaurchin's role was direction, not authorship of the constitution.

## 7. Deploy fact (verified 2026-06-04)

The bsp-mcp **router** at `bsp.hermitcrab.me` deploys via **Railway** (live headers: `server: railway-hikari`, `x-railway-edge`) — CLAUDE.md's "Storage" section is correct; do not change it to Vercel. The **Vercel** deployment is the **beach** (`beach.happyseaurchin.com`), a separate service. Router = Railway, beach = Vercel; earlier notes conflated the two.
