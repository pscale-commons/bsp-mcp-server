# Resolution / synthesis sequencing redesign — exchange vs resolution, perceive-fold

**Status:** PROPOSED 2026-06-23. Block-only (no code/deploy) for the core. Pending David's
confirmation on the four forks (end of doc). Not yet built.

**Evidence:** the first two-machine HITL run of Thornwood — cyrus + anya on two claude.ai
connectors, 2026-06-23 (passphrase thorn142). Co-presence-close **passed** (4/4 windows
gathered, the characters met). But real play exposed four faults the faithful rig could not,
because they are about *human tempo and feel*, not mechanics. Forensic timeline read live off
the beach (`pool:` / `liquid:` / `witnessed:` snapshots).

---

## TL;DR (layer-3)

Today **every turn is forced through resolution** — submit → window → dice → merged skeleton.
That is right for a contested act and wrong for talking. The redesign:

1. **Separate EXCHANGE from RESOLUTION.** Ordinary turns (talk, look, move, describe) **post
   directly** — immediate, no dice, no gather, in the character's own voice. Resolution (dice /
   bands / teeth / merged skeleton) is the **exception**, for contested acts only.
2. **Fold PERCEIVE into ACT.** Every engage returns *what happened since you last acted* +
   *who the table is waiting on*. Kills the "say something, then nudge to find out what
   happened" loop.
3. **Dice only on contested acts.** Stop the resolver rolling for "talking to one another."
4. **Name only what you've earned**, derived from the narrative — drop the `knows` ledger as a
   maintained authority (it isn't being maintained anyway).

All four map onto tool paths that **already exist** (`contribution=` is a direct append;
`submit=`+`resolves_window=` is the gather). So the core is a **re-instruction in the
directive blocks** — no walker, beach, or envelope code changes. That makes it cheap to test
and trivial to roll back (`pack-reset` from the current cartridge commit).

---

## The four problems (from the run)

1. **Over-rolling.** Dice were rolled every window, including a "massive unluck" on basic
   dialogue. `rules:nomad` already defines SIMPLE = auto-success, no dice — but the **envelope
   hands per-actor dice unconditionally** and frames them as "use these, never invent," so the
   resolver always rolls. The rule never bites because the surface overrides it.
2. **Cross-authoring.** One player's machine resolved **both** characters (Cyrus authored
   Anya's outcome). Deterministic dice stop roll-fudging, not **narrative** fudging — one LLM
   still writes the other's beat. The manipulation seam, and it feels wrong to the player.
3. **Async tedium (the big one).** No push in bsp-mcp → the player submits, then must manually
   nudge *"what happened?"*. Windows opened/closed out of sync, so the two were often not in the
   same beat, and the player never knew whose turn it was or whether to wait. Tedious, stilted.
4. **Name-boundary break.** Anya's narration used "Cyrus" though he never gave his name. The
   render ignores earned-names, and `knows:<h>` goes stale one beat after a name is given (the
   append is LLM-discretion bookkeeping that doesn't happen — same failure class as journaling).

### The unifying pattern
Public/shared writes (the pool resolution) are load-bearing and **happen**, because they are
the explicit act. Private bookkeeping writes (`witnessed` journaling, `knows` name-append) are
LLM-discretion and **don't** happen — the LLM does the salient act and skips the admin. Fix:
make private state **derivable from the public narrative** rather than separately maintained.

---

## Two reframes underneath all four

- **Exchange ≠ Resolution.** Most play is exchange and should *flow* like chat. Resolution is
  the exception. (Fixes #1; removes the cross-authoring surface for dialogue, #2; removes most
  of the stiltedness, #3.)
- **Perceive-fold + turn-state.** The tedium is a context-delivery failure: deliver "what
  changed since you acted" and "waiting on X" in every response. (Fixes the nudge loop, #3.)

---

## The design axes

**Trigger — when a *contested* window resolves** (exchange never gathers, so this only applies
to checks): ① timer + next-visitor (today's fallback); ② threshold — when N of the present
have submitted (co-presence-close is N=2); ③ commit-act — `submit` stages, `commit` says
"resolve now"; the committer closes it.

**Output — what a resolution produces:** Ⓐ one shared skeleton, each derives their own
narrative (today; subjective-centred); Ⓑ one primary narrative + others echo (reintroduces a
master narrative and author-privilege — rejected, David's flag).

## Three coherent models

- **Model A — "Talk freely, check rarely" (transcript-first).** Exchange posts straight to the
  pool as the character's own beat (immediate, no dice). A contested act opens a check (gather →
  roll → band → teeth → one skeleton). Meeting = both present and posting; coherence = the
  shared transcript. *Pros:* dialogue feels alive; dice only when stakes are real; least sync
  friction; no resolver re-narrating your ordinary lines (kills cross-authoring for dialogue).
  *Cons:* simultaneous actions aren't auto-merged (A's line then B's line); the "two arrivals
  at once" opening is an opening check or by hand.
- **Model B — "Gather, but smarter."** Keep the window-merges-all, but dice only on contested
  acts; trigger = threshold or commit (not next-visitor); perceive folded in. *Pros:* keeps the
  coherent merged beat. *Cons:* still turn-synchronized — the beat waits on everyone present, so
  one slow player stalls it; cross-authoring persists unless resolution goes per-individual.
- **Model C — committer resolves, others echo (output Ⓑ).** Immediate, but master-narrative +
  privilege + worse cross-authoring. **Rejected.**

## Recommended design

**Model A as the default rhythm; Model B's gather reserved for the opening beat and contested
moments.** Output stays Ⓐ (shared skeleton, never primary+echo). Trigger for contested windows:
**commit-driven with a span fallback** (the actor controls when the uncertain thing resolves —
directly addresses "out of sync"). Layer **perceive-fold + turn-state** on top regardless — the
single highest-leverage change, orthogonal to A/B/C.

Name discipline: **name only those whose name was given in a beat you witnessed; otherwise by
appearance.** Drop `knows:<h>` as a maintained ledger (keep it only as opening seed).

---

## How it maps to existing mechanics (why it's block-only)

| Redesign element | Existing tool path | Code change? |
|---|---|---|
| Exchange = direct post | `pscale_pool_engage(contribution=…)` — atomic append to `pool:` | none |
| Contested = gather + resolve | `submit=…` → `contribution=…, resolves_window=…` | none |
| Perceive-fold ("what's new since you acted") | envelope already returns contributions-since-marker | none |
| Turn-state ("waiting on cyrus") | envelope already returns the liquid mirror (who's pending) | none (directive surfaces it) |
| Dice only on contested | deterministic dice still handed; directive applies them ONLY to RISKY/COMBAT (rules:nomad:3); SIMPLE = auto-success | none |
| Name by earned-only | directive: name from witnessed beats, else appearance | none |

**Blocks that change (cartridge data, git-versioned):**
- `function:thornwood` — directives `1` (soft: route exchange→contribution vs contested→submit;
  perceive-fold; turn-state; name discipline) and `2` (resolve: dice-gate by action class;
  public-only, no cross-authored interior), and the `_`.
- `frame-spec:thornwood:9` — trigger semantics (commit + span fallback) if we change them.
- `rules:nomad` — emphasise SIMPLE/auto-success so handed dice are ignored for exchange.

**What does NOT change (no deploy):** the walker (`bsp.ts`), the beach handler, the envelope
(`pool.ts`), the dice computation, the tool surface. The mechanics already support both
direct-append and window-gather; this re-instructs *which the player uses when*.

**Optional code hardenings — only if the directive doesn't carry it (these need a Railway
deploy; rollback = git revert + redeploy):**
- Soften the envelope's "Window dice — use these, never invent" framing so it stops pushing the
  resolver to always roll.
- Add an explicit turn-state line to the envelope (`waiting on: cyrus`) rather than relying on
  the directive to derive it from the liquid mirror.

---

## Test + rollback plan

The core is block-only, so **there is nothing deployed to revert** — rollback is restoring
cartridge data, which is git-versioned (per the standing decision: cartridge versioning = git).

1. **Branch the cartridge.** New version = a commit to `pscale-beach/packs/thornwood/` on a
   branch (e.g. `claude/rpg-sequencing-v2`). The commit IS the experiment record.
2. **Test in isolation first — local file-beach rig.** Seed the new cartridge into a local
   beach (`scripts/local-beach.mjs`) and run the faithful rig (`scripts/rpg-rig.ts --client
   agent`). No live beach touched. Catch regressions before any human play.
3. **Then human test — choose isolation level:**
   - *(safest)* a separate sub-beach (e.g. a `thornwood-v2` sub-beach) seeded with the new
     cartridge — live thornwood stays exactly as it is; or
   - *(simplest)* `pack-reset` live thornwood to the new cartridge and play.
4. **Rollback (either case):** `pack-reset` the beach from the **current** cartridge commit
   (`main`). Instant, no deploy. The live world returns to exactly today's setup.
   ```sh
   # from pscale-beach/, with THORN_* secrets exported
   node scripts/pack-reset.mjs --beach https://thornwood.beach.happyseaurchin.com --pack packs/thornwood
   ```
   ALWAYS verify after a reset — a wrong secret half-resets silently (read back `function:thornwood`).
5. If we take an **optional code hardening**, that part needs a deploy; rollback is `git revert`
   + redeploy bsp-mcp on Railway. Keep code and cartridge changes in separate commits so they
   roll back independently.

---

## Forks (David to confirm before build)

1. **Exchange/resolution split** — adopt (dice only on contested)?  *[rec: yes]*
2. **Trigger** for contested windows — commit-driven + span fallback? threshold? *[rec: commit + span fallback]*
3. **Output** — keep shared-skeleton? *[rec: yes; reject primary+echo]*
4. **Name/knows** — derive-from-narrative? *[rec: yes; drop ledger maintenance]*
