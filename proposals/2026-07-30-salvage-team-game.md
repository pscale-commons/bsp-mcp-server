# SALVAGE — the 1-2-3 as a game (grade three of the experience)

**Date**: 2026-07-30 · **Status**: DESIGNED (this session, with David); build on his nod · **Family**: the third grade of the 1-2-3 experience (spine:experiences 6.3) — meta (run the trial on itself) · embedded (the client's thing; live example spine:freeze) · GAME (this).

## The design constraint that picks the game

Every player arrives with an LLM. Any game won by cleverness or general knowledge dies — classic lateral puzzles, moon-survival rankings with the NASA key, trivia: all in training data. The only win-condition that survives LLM-equipped players is one that depends on **information distribution**: your LLM cannot know what only another player was dealt. Hidden-profile tasks are also the research-grade teamwork demonstration (teams fail when they don't pool unique information), and pooling-at-addresses is exactly what mirrors + fold do. The egg-race sense of achievement comes from **scoring the fold against every individual** — the team number beating the best solo number is the visible, undeniable payoff.

## The game

**The ship broke up on the reef. Twelve items washed ashore. Rank them for the party's survival.**

- The **Author** (not playing) writes: the scenario, the twelve items (`spine:salvage`, one position per item, each underscore the item plainly described), a **fact-pack per player** (each castaway remembers different things about the island — "the north spring is brackish", "the reef dries at low tide", "smoke past the headland is invisible from the lanes"), and the **answer key** — the correct ranking, which is DERIVABLE ONLY BY POOLING the facts (authoring rule: no single pack determines more than a third of the item swings). The key is sealed by commit-reveal: `sha256(key + salt)` written at `spine:salvage:9` before play; key + salt revealed at 9.1 after the fold; anyone verifies.
- **Round 1 — SOLO (the mirror move):** each player, using only their own pack, commits their full ranking with reasoning to `salvage:<handle>` under their own key. Timestamped before the pool opens — the pre-pool mirror IS the individual baseline.
- **Round 2 — THE TABLE (the located-pool move):** discussion in `pool:salvage`, located per item (`at=<position>`) — "what's live on the fish-hooks" is one filtered engage. Facts surface because arguing an item's rank requires saying WHY. Vapour if on xstream; pool-only works from any Claude. Players revise their mirrors as they learn (revision is the point).
- **Round 3 — THE FOLD:** one team ranking, claimed once with `resolves_window` on the pool (the existing single-resolution machinery — one team answer, atomically). Plain integration; an outcome that drops a voice must say so.
- **REVEAL + SCORE:** Author reveals key + salt; score = Σ|rank − key rank| per ranking, lower better. The result the game is built to produce: **fold score < best individual score** — visible synergy. The debrief renders which fact moved which item, i.e. whose voice was load-bearing where — teamwork made legible from the record.

Text-only · parlour-shaped · 3–8 players · 30–60 minutes live, or async over a day · zero new machinery (spine, mirrors, `at=`, GRIT's fold claim, one hash string).

## The siblings (later)

- **The Mystery** — same hidden-profile core, deeper: dealt evidence packs, spine positions = aspects of the case (scene / timeline / people / physical evidence), the fold = the accusation against a commit-reveal solution. Longer, more atmospheric, more Author work.
- **The Maker's Egg-Race** — constructive variant: the team must produce ONE artefact meeting everyone's PRIVATE constraints; each mirror is a per-constraint status board (function:status gamified); win = all-green. Closest to "build a tower from spaghetti" in text.

## Decisions (recommendations first)

1. **First scenario**: the castaway wreck (beach-flavoured, fast, mechanically scoreable) over an Onen-lore mystery — recommended; the Mystery is run two.
2. **Dealing hands v1**: off-substrate (the Author sends each pack by any private channel — email/DM); the TEAMWORK lives on the beach. Grain-dealt (`grain:author↔player`, gray by default) is the substrate-native upgrade, not the first-run requirement.
3. **Format**: one live hour first (the achievement moment wants co-presence); async is the proven fallback.
4. **First run casting**: weft authors (scenario, packs, key, hash) so David PLAYS — the framer experiencing the mechanism from inside; players David + Keel + 1–3 others (Julie?).

## What gets built on the nod

`function:salvage` (the operator: round law, fold law, scoring, commit-reveal verification — mounted at `pool:salvage` per tree:9.1), the first scenario kit (Author-face writes, off-beach packs), and — after a played run proves it — a mint-kit block (the `mint:gal` pattern) so anyone can author a fresh SALVAGE from a recipe.
