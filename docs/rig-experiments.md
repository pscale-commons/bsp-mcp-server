# Thornwood RPG + pscale substrate — experiment handoff

> Paste this into a fresh session to run RPG-rules and substrate experiments on the
> local cartridge rigs. **Everything here is LOCAL and TIGHT** — a throwaway file-beach
> per run, no apex, no production beach, nothing networked is touched. Two rigs already
> exist and are committed; you just run them and read results. No rebuilding.

## What you can test

- **The RPG rules** — NOMAD resolution, the soft/resolve/hard directives, perception —
  generated headless with a character-LLM in every seat; an observer scores each run.
- **The substrate** — the real `pscale_pool_engage` loop: liquid windows, the window
  open-stamp, the fixed dice, the **atomic single-resolution claim**, the envelope —
  driven by character-LLMs as real player-clients, with controllable timing.
- **The bare app-client's fragility** — the LLM judging window-closure itself, which is
  the exact thing that broke live multiplayer.

## Prerequisites (check once)

- Three sibling repos under `~/Projects/`: `bsp-mcp-server`, `pscale-beach`, `nomad-bsp` —
  both `bsp-mcp-server` and `pscale-beach` on `main`, up to date. (The rig work is merged
  to `main` in both: pscale-beach via #17, bsp-mcp directly.)
- Pull, then sanity-check the cartridge + atomic claim are present and `main` hasn't
  drifted against a parallel cartridge worktree (this repo has seen concurrent cartridge
  branches — do this each new session):
  ```bash
  git -C ~/Projects/pscale-beach   pull -q && git -C ~/Projects/pscale-beach   log --oneline -3 main
  git -C ~/Projects/bsp-mcp-server pull -q && git -C ~/Projects/bsp-mcp-server log --oneline -3 main
  grep -c winresKey ~/Projects/pscale-beach/api/pscale-beach.js     # atomic claim present → expect a count > 0
  ls ~/Projects/pscale-beach/scripts/thornwood-rig.mjs ~/Projects/bsp-mcp-server/scripts/rpg-rig.ts  # both rigs present
  ```
- Node 18+ and `npx tsx` (a dep of bsp-mcp).
- Anthropic key in `~/Projects/nomad-bsp/.env.local` as `ANTHROPIC_API_KEY=...`.
  Never echo it; source it as the commands below do (they also force the public API
  endpoint so the key routes correctly).

## Quickstart

```bash
# the key, sourced safely (never printed):
KEY=$(grep '^ANTHROPIC_API_KEY=' ~/Projects/nomad-bsp/.env.local | cut -d= -f2- | tr -d '"\r ')
RIG="env -u ANTHROPIC_BASE_URL ANTHROPIC_API_KEY=$KEY"

# 1. RULES only, fast (central orchestrator, no substrate machinery):
cd ~/Projects/pscale-beach && $RIG node scripts/thornwood-rig.mjs --turns 4

# 2. SUBSTRATE + rules, the real pool loop (disciplined/harness client):
cd ~/Projects/bsp-mcp-server && $RIG npx tsx scripts/rpg-rig.ts --client harness --timing concurrent --turns 3 --window-ms 1500

# 3. BARE app-client — the LLM judges the window itself (long window so seats gather):
cd ~/Projects/bsp-mcp-server && $RIG npx tsx scripts/rpg-rig.ts --client bare --timing concurrent --turns 2 --window-ms 30000
```

Drop `$RIG` (the key) from any command to run the **deterministic STUB** — proves the
loop and every substrate write instantly, no narrative, no cost.

## The two rigs

| | `thornwood-rig.mjs` (pscale-beach, `node`) | `rpg-rig.ts` (bsp-mcp, `npx tsx`) |
|---|---|---|
| **Loop** | central orchestrator; gathers intentions and resolves them itself | the **real** `pscale_pool_engage` loop (submit → liquid window → in-loop resolve + claim) |
| **Tests** | the RPG **rules** only | the **substrate + rules** together |
| **Timing** | none | `--client`, `--timing`, `--window-ms`, `--max-delay` |
| **Speed** | instant (no windows) | real windows (waits) |
| **Extras** | `--snapshot <dir>` / `--from <dir>` (fork-points), `--keep` | `--keep` |

Both re-seed a fresh Thornwood cartridge every run, so a block edit takes effect
immediately, and both end with an **OBSERVER VERDICT** scoring the run.

## Flags (faithful rig)

- `--client harness` — the rig's CODE judges "is the window closed?" (a disciplined
  client, like xstream). `--client bare` — the LLM judges it from its directive +
  envelope (the bare app). The rig flags `⚠ PREMATURE` (LLM resolved a still-open
  window) and `NO live window`; the substrate claim catches double-resolves (`STOOD DOWN`).
- `--timing concurrent` (all seats into one window) · `spread` (one seat per window) ·
  `random --max-delay <ms>` (each seat a random delay — staggered, overlapping).
- `--window-ms <M>` — how long a window gathers before it closes. **Must exceed a seat's
  LLM latency (~5 s) to gather** — below it, `concurrent` degenerates into a chain of
  solo resolutions (a real window-vs-pace finding, not a bug).
- `--turns <N>` — number of rounds.

## Experiment recipes

| To answer… | Run |
|---|---|
| Does single-resolution hold when seats act together? | `rpg-rig --client harness --timing concurrent` → watch `>>> resolved` once per window, `STOOD DOWN` on contention |
| How does a **bare** LLM handle window timing? | `rpg-rig --client bare --timing concurrent --window-ms 30000` → seats gather, then race; first `RESOLVED`, rest `STOOD DOWN`; any `⚠ PREMATURE` is a judgment error |
| Concurrent vs spread narration of one beat | same rig, `--timing concurrent` then `--timing spread`, compare the journals |
| Realistic staggered players | `rpg-rig --timing random --max-delay 4000` |
| Did my NOMAD edit improve agency? | edit `rules:nomad`, re-run either rig, read the observer's AGENCY score (and its "biggest weakness") |
| Does fog-of-war hold? | any run → observer PERCEPTION-LIMITS (should be 5/5; each character renders others by appearance) |

## Iterating the RPG rules (rules are DATA)

The rules are pscale blocks in `~/Projects/pscale-beach/packs/thornwood/definition/`:

- `function%3Athornwood.json` — the **directives**: soft (`1`), resolve (`2`), hard (`3`).
- `rules%3Anomad.json` — the **resolution system** (CF + SF + dice − difficulty, the bands).
- `rules%3Athornwood.json` — **place physics** (perception, the wood's night/off-path penalties).
- `spatial%3Athornwood.json` — the **world** (Oakhollow, the Beaten Drum, the deer-paths).

Loop: **edit a block → re-run a rig → read the OBSERVER VERDICT** (consistency / persistence
/ perception-limits / agency, each 1-5, + the single biggest rule-weakness to fix).
Because each run re-seeds, your edit is live immediately; nothing persists unless you use
`--snapshot`/`--keep`.

The three characters are **cyrus** (guard), **anya** (pedlar-witch), **fenn** (forester),
each with `passport:`/`witnessed:`/`knows:` blocks in `packs/thornwood/initial/`.

## Promoting a proven rule to production

When a rule proves out, transpose it to the live beach by editing the same block on
`https://thornwood.beach.happyseaurchin.com` via `bsp()` (GM secret `thorn142`). That is a
deliberate, separate step against the shared beach — **ask the human before doing it**.
The rigs never touch production.

## Background (only if you need it)

- **Subjective model**: per-character `witnessed:` spines (private narrative), a public
  `pool:beaten-drum-main` of identifier-only event-skeletons, `knows:` for earned names,
  no shared canon. In the rig, fog-of-war is structural — each character's window is
  composed from only its own blocks, so it cannot leak a name it hasn't earned.
- **Why local = tight**: the cartridge beach IS the default beach in a rig, so there is no
  "bare handle → shared-apex" routing leak. (Running the game on a sub-beach of the shared
  apex is that leak; don't do it for tests.)
- **Production resolution** is in-loop with the atomic claim: the first contributor to
  touch a closed window resolves it; the beach admits only the first and stands the rest
  down (`SET … NX`, same shape as a lock). The orchestrator rig fakes this centrally; the
  faithful rig exercises the real thing.

## File map

- `bsp-mcp-server/scripts/rpg-rig.ts` — faithful rig (substrate + rules).
- `pscale-beach/scripts/thornwood-rig.mjs` — orchestrator rig (rules only).
- `pscale-beach/scripts/local-beach.mjs` + `file-redis.mjs` — the file-backed beach the rigs spawn/use.
- `pscale-beach/scripts/pack-seed.mjs` / `pack-reset.mjs` — seed/reset a cartridge.
- `pscale-beach/packs/thornwood/` — the cartridge (`definition/` rules + `initial/` opening save).
- `bsp-mcp-server/src/tools/pool.ts` — the real `pscale_pool_engage` primitive the faithful rig imports.
