# Roadmap by backcast — the three objectives to the present edge

> Backcasting (−0, future-perfect), not forecasting. Start from each objective **achieved**,
> work back to what must already hold, and find where the chains **converge**. That convergence
> is the present edge — derived from the goals, not guessed forward from today.

**Status:** roadmap for David. **Date:** 2026-06-23. Supersedes the prescriptive parts of
`2026-06-23-cado-complete-product-minimum.md` (CADO is advisory framing per
`docs/protocol-agent-shell.md` §3.3, not machinery to build).

## The three end-states (David's own decomposition, 2026-06-23)

- **A — bsp-mcp human play.** *"Invite a few friends and we just start exploring it in real time,
  player-characters interact with one another and with NPCs."* Requires: world created;
  damage/death + character-creation; NPCs respond and act; optionally a human in a **GM seat**
  (wearing Author/Designer/Observer); all via bsp-mcp.
- **B — llm-play (overnight, automated).** *"Leave it running overnight, wake to find what
  happened."* Author-LLM creates the world on the fly; character-LLMs run the narrative;
  observer-LLM generates an ongoing narrative of the group; designer-LLM flags + corrects issues.
- **C — xstream.** *"Higher quality — BYOK, play reflexively, see what other players intend
  because of the VLS."*

## Backcast A — human play

```
A achieved  (friends play a living town in real time, PC↔PC↔NPC, with stakes)
 ← A1  a populated town exists (several places, several NPCs, things happening)
     ← A0  someone authored it (spatial + NPC passport/shell blocks)        ┐ the world floor
 ← A2  rules carry damage/death AND character-creation                       ┘ the rules floor
 ← A3  NPCs respond + act        (minimum: the resolver plays them honestly — rules:nomad:3 already)
 ← A4  onboarding               (a friend connects + inhabits a handle — pscale_play exists)
 ← GM  a human wears A/D/O       (available NOW — advisory faces over bsp(); no build)
```
**Present:** meet + dialogue LIVE; world thin (3 chars, one room); damage/death PARKED;
char-creation has no live flow. **A bottoms out at A0 (world) + A2 (NOMAD).**

## Backcast B — llm-play (overnight)

```
B achieved  (unattended; world grows, characters + NPCs play, narrative + correction run)
 ← B1  an orchestration loop wakes each role on a cadence and runs it overnight (beach-crab rung 2)
     ← B0  each role works autonomously via bsp-mcp:
              · character / NPC-LLM   — BUILT (faithful rig --client agent)
              · author-LLM (world-gen) — NOT PROVEN  ← the probe
              · observer-LLM (O, narrative) — near (bsp reads of witnessed:<each> + synthesis)
              · designer-LLM (D, flag+correct) — not built (the delicate one; = Claude Code's role)
 ← B2  NPCs are full shells       (shell + purpose + wake — character-shell-convention designed it)
 ← B3  rules carry damage/death + character-creation        (= A2)
```
**Present:** the *character* engine is BUILT (the hardest part — autonomous LLMs driving bsp-mcp,
divergent drives, co-presence, 12 beats). Author/observer/designer loops + the orchestration are
not. **B bottoms out at B0 author-LLM (= A0) + the role-loops + B3 (= A2).**

## Backcast C — xstream

```
C achieved  (BYOK reflexive play; VLS shows others' intentions)
 ← C1  xstream polls the beach live (vapour/liquid) AND resolves the SAME frame-spec:thornwood
        + fluid directive the bsp-mcp path uses
     ← C0  the substrate play model is stable — DONE (the fluid sequence)
 ← C2  a world worth skinning exists      (= A0)
```
**Present:** xstream-bsp built (V-L-S canvas, viewer, BYOK), deploys xstream.onen.ai; not yet
aligned to the fluid substrate. **C bottoms out at C1 (alignment), gated on A0. C is last.**

## The convergence — the present edge is exactly two things

All three backcasts bottom out on the same floor:

1. **World-generation (A0 = B0 = C2).** A populated town. The single highest-leverage move — it
   is the content for human play, stage one of the overnight pipeline, and what xstream skins.
2. **NOMAD completeness (A2 = B3).** Damage/death (stakes) + character-creation (cast growth).

Everything else sits **above** this floor. Nothing on the floor needs new substrate (L1) — world
is A-face `bsp()` writes; NOMAD is `rules:nomad` block edits.

## The sequence above the floor (backcast order)

| # | Rung | Serves | Substrate? |
|---|---|---|---|
| 0 | **World-gen** (author-LLM — probe + hands-on) **+ NOMAD damage/death + character-creation** | A, B, C floor | block-only |
| 1 | Role-loops: **observer-LLM** (O) + **designer-LLM** (D) + **NPCs as full shells** | completes B's cast | convention + agent |
| 2 | **Overnight orchestration** (beach-crab rung 2) — wakes the roles, runs unattended | B (the dream) | agent (no L1) |
| 3 | **xstream alignment** — poll live, resolve the shared frame-spec, VLS intentions | C | client |
| 4 | **v0.2 membrane + payway** — gated character-creation for invited strangers | adoption | substrate-enforce (biome-proven) |
| 5 | **gazetteer / `located`** — multi-world discovery + presence | scale | port from biome |

Rungs 0–3 are the three objectives. Rungs 4–5 are the adoption/scale layer — **already
prototyped in pscale-biome** (the membrane = v0.2 rights; the gazetteer = biome-DNS; `located` =
multi-world, where `urb` is already a named placeholder), so they are de-risked, not green-field.

## How this relates to the docs (produced + sourced)

| Rung | Anchoring docs |
|---|---|
| World-gen | this roadmap; faithful-rig (the harness pattern); engagement-framing (spatial coordinate block) |
| NOMAD completeness | `rules:nomad`; rpg-reorientation-log (the parked damage/death + stats:<handle>) |
| Character / NPC engine | faithful-rig; **character-shell-convention** (thin→full = human→autonomous — the through-line) |
| Observer / Designer LLMs | protocol-agent-shell §3.3 (CADO = the four roles); cado-complete-product (the four-stances completeness — the one part that holds) |
| Overnight orchestration | beach-crab-ladder |
| xstream | protocol-xstream-frame; engagement-framing (xstream = interface, not a layer); frame-spec:thornwood (the single frame both clients resolve) |
| v0.2 + payway | protocol-agent-shell §3.4; payway convention; **pscale-biome** membrane (built, flag-gated) |
| multi-world / scale | **pscale-biome** discovery-lighthouse-gazetteer + located-block specs |

## The through-line

The three objectives are **densities of one play** — thin shells (human drives) → full shells
(wake + heartbeat, autonomous) → the reflexive skin over either — on the same blocks, same
`bsp()`, same beach. The **character-shell spectrum** is the literal bridge between A and B; CADO's
**A/D/O become the author/observer/designer LLMs** that automate B and the **GM seat** a human
wears in A. One mechanism, four faces, two driver-densities.

## The next move

**World-gen, two forms, runnable in parallel:**
- **Hands-on (you + claude.ai) → serves A:** a scenario + bsp-mcp + the beach secret; steer an
  LLM to author a town tonight; invite friends.
- **Probe (me) → serves B:** an author client on the rig harness, autonomous, verifying a coherent
  + playable world emerges unattended — the overnight pipeline's stage one.

Then NOMAD damage/death + character-creation (the shared rules gap). xstream after a world exists.
