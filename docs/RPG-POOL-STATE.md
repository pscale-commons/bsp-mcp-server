# Subjective RPG + pool — system state and open joints

**Read this before touching the RPG or the pool primitive.** It exists so a session
*executes* the joints below rather than re-designing them. The joints are **decided,
not open for re-design.** If you find yourself about to write a new proposal, or to
judge `rpg-architecture` "objective and therefore wrong" and rebuild it — **stop**:
that disagreement is a known, half-finished migration (§2), not a design gap. The
discipline this whole effort defends: *maximise pscale block + bsp + LLM; do not
multiply code.*

Last updated 2026-06-03.

---

## 1. What is LIVE and PROVEN (the runtime)

- **Pool accumulates past 9 by supernest** — `src/accumulator.ts` (`appendWithSupernest`); `pool_engage` wired; envelope hint comes from the pool's underscore. PR #63, **deployed** (Vercel → `bsp.hermitcrab.me`). Proven by smoke (accumulator 22/22, pool-engage 34/34) and live for a single contribution; **past-9 not yet exercised live** (§3 Joint C).
- **Perception-as-depth** — proven live on `spatial:thornwood:111`: the secret ("the stillness is listening") sits at `111*1.31`, occluded at a newcomer's depth (`111*1` `P=-1`), revealed at `P=-2`. Occlusion **is** read-depth; the mechanism is real (the substrate returns whatever `P` is asked — *entitlement* is convention, hardenable via `sed:`/locks).
- **`function:thornwood:1`** is a faithful **subjective soft directive**, live. The pool's underscore points the soft to it.
- **`accumulator.ts`** is a reusable geometry helper — `marks` and `history` can adopt the same `appendWithSupernest` call.

## 2. The ONE disagreement to resolve — and it is DAVID's one-step

Canonical **`rpg-architecture` branches 1–6 are still the OBJECTIVE design** (one shared
`solid:`, `visible_to` filtering). The **runtime is subjective** (`function:thornwood`,
`frame-spec:thornwood` v0.2, the conformed room). They disagree, and that disagreement
is the single thing that will make a fresh session re-design.

**`rpg-architecture-subjective`** (on the beach; Weft-authored; branches 1–9; cites the
live proof) is the subjective canon, intact and **ready to promote**.

**Action (David's, because the block is locked under happyseaurchin's passphrase):**
promote `rpg-architecture-subjective` → replace `rpg-architecture` 1–6. Until that
happens the constitution lies about the runtime. **This is closure item #1.** Nothing
else should be built on top until it is done, or it builds on a contradiction.

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

## 4. Path 3 (submit/commit) — spec. Note: **path 3 ≠ A.**

Path 3 is the **submit/commit build**; **A** is the decision *inside* it (what `commit`
does). So: "build path 3, with `commit` = A."

- **`submit`** → writes `liquid:pool:<name>` (per-author slot, overwriting, **no**
  synthesis returned).
- **`commit`** → writes `pool:<name>` (the resolution **chronicle**, supernest-
  accumulated, **with** the synthesis envelope). *This leg is A.*
- **RPG caveat:** the RPG's `commit`/resolution goes to **spines** (Joint A), *not* the
  pool chronicle. So **A for general pools; the RPG redirects the destination.** Same
  `submit`; only where `commit` lands differs — and that difference is the
  objective/subjective line.
- **bsp-mcp side (do this first):** `pool_engage` gains `submit`/`commit` params + the
  `liquid:` block. A pool's directive lives **external** (`function:<game>/1`); the
  pool's underscore points at it via a `*ref` the envelope follows — pure-liquid and
  supernest-safe (a digit position can't hold a hint; slot 9 is an entry).
- Then `block-conventions:4.2` doc, then the xstream pool flow.
- **This is a fresh-session build.** Do not start it at a filling context window.

## 5. Ownership (David assigns; the work is spec'd so it transfers cleanly)

- **Constitution promotion (§2)** — David (holds the lock). One step.
- **Path 3 / pool primitive (§4)** — the pool-behaviour session.
- **Resolution leg + clock (Joints A, B)** — the RPG-medium build (the `nomad-bsp` crab).
- **`block-conventions:9` + `4.2`** accumulator-shape update — with whoever does §4.

## 6. The design records

- `proposals/2026-06-03-supernest-floor-growth-and-positional-ladder.md` — on disk; the supernest spec implemented in `accumulator.ts`.
- The four `proposals/2026-06-02-*.md` RPG docs (the grounded synthesis + its two superseded predecessors, the xstream-extension scope) were authored this session but **lost to concurrent branch churn before being committed**. Their essence is consolidated into this state doc; the full synthesis is recoverable from the 2026-06-03 session transcript if the detail is wanted. **Lesson: untracked docs do not survive the multi-session branch switching this repo currently sees — commit on creation.**

## 7. Deploy fact (corrects stale notes)

bsp-mcp deploys via **Vercel** (`happyseaurchins-projects/bsp-mcp-server` → `bsp.hermitcrab.me`), not Railway. CLAUDE.md's "Storage" section is stale on this.
