# The faithful rig — HNITL ≡ HITL, and the shell as context-compiler

**Status:** DRAFT for David's review (design-first; build off the agreed spec).
**Date:** 2026-06-22
**Decided [David]:** yes to the refactor (point 1). Guidance folded in below (points 2/3/4/6).

## The principle (David)

There is **one harness** — perceive → render → `[decide]` → submit → process — and the *only* thing that differs between HITL (you play) and HNITL (autonomous rig) is the `[decide]` step: human keystrokes vs a purpose-driven character-LLM. Everything around it must be **byte-identical**, because any deviation is a dataflow bug that only surfaces when you play. The current rig violates this: it *composes* context in code (`cAperture`/`rawBlocks`) and *scripts* the tool calls — the "composed-vs-directive" gap. The refactor removes both.

## The shell IS the context-compiler [David, points 2 + 6]

A character-LLM has no out-of-band memory; a human does. So the character's **narrative history and everything else it needs to know what to do must be reachable from the shell** — the shell's manifest is a **bundle of bsp-addresses that, read together, compile the LLM's context window**, exactly as mobius's `kernel.js` loads `shell.json` (all its blocks). The only difference: the handle is a character in a fantasy world.

- **The bundle** (`shell:<h>` position 3, manifest): `passport` (capability/wants/location), **`witnessed` (the narrative sequence — what the character has lived; without it the LLM is at a loss)**, `knows` (earned names), `purpose` (drive), `stats` (NOMAD sheet), and — to add — `relationships`/`settings` refs where a character needs them. Inhabiting the shell = **walking this manifest and scooping each address.**
- **Current state, honestly:** `witnessed` is already in the manifest and read every turn — but via a sidecar composer, not by walking the manifest. The refactor makes the scoop **manifest-driven** so the shell genuinely compiles the context (frame-as-compiler), and `pscale_play` reads the shell's manifest instead of a hardcoded bundle (so the scoop is per-character extensible).

## Orienting space for the autonomous NPC-LLM [David, point 6]

The agent shell already has the orienting structure to copy — weft's `shell._` carries a **self-bootstrapping discipline** ("a fresh session can walk this shell and find all references without external context"). The character shell gets the analogue, plus an NPC-self-driving note:

> *(proposed `shell:<h>._` addition)* — "A fresh LLM inhabiting <name> walks this shell's manifest to scoop its full context — narrative (`witnessed`), drive (`purpose`), names (`knows`), capability (`passport`), relationships — and plays the character from that, needing no external context. When driven autonomously (an active NPC, or the rig standing in for a human), accept the bsp-mcp tools as a human's client uses them and decide on the character's behalf as best you can, from the purpose, the settings, the relationships, and the narrative so far."

This is the bridge that makes an LLM able to *play* the character as a stand-in human, not just describe it.

## The disciplines that keep HNITL ≡ HITL

1. **Entry via the real path** — the character-LLM enters with `pscale_play(world, handle)`, the same call a claude.ai player's client makes; it returns the scoop (directive + live scene + the shell-manifest bundle). No code-composed aperture.
2. **Tool-calling loop, not scripted** [point 1] — the LLM is given the actual bsp-mcp tools (`pscale_play`, `pscale_pool_engage`, `bsp`) and makes its *own* calls (which reads, when, with what params). The rig executes them against the local beach and feeds results back. This is what catches the LLM's-own-dataflow bugs (does it read the live window? pass `pool_url`? re-read `witnessed`?) that the scripted rig hides — the class that bit live.
3. **Render-then-decide** [point 2 asymmetry] — the LLM perceives → **renders the scene** (as the soft-LLM does for a human) → decides from *that render + its purpose*. Decision basis = the rendered scene a human would see, never raw substrate.
4. **Tempo: one intent per turn, ≥30s apart** [point 3] — the LLM submits a single intention per turn with a ≥30s gap (human cadence, matching the window span). No flurries — window timing must match live.
5. **MCP-boundary parity** [point 4] — route tool calls through the real tool interface (the schemas + server instructions the LLM sees), so its view equals claude.ai's.

## What it validates — and what it can't

- **Complete fidelity on DATAFLOW**: same context in, same processing out, only the intent-source swapped. This is the axis that generates the bugs you've hit.
- **Not taste**: whether a beat *lands*, whether it's *fun*, is irreducibly yours — the rig proves the pipes are identical; your spot-check confirms the experience.

## Build approach

Evolve the existing `--client bare --aperture directive` modes (already the right direction) into a true tool-calling agent:
1. **Shell first (small):** add the orienting note to each `shell:<h>._`; confirm the manifest gathers the full scoop (add `relationships`/`settings` refs if a character needs them).
2. **Scoop via manifest:** `pscale_play` (and the perceive path) read the shell's manifest to assemble context, instead of a hardcoded bundle.
3. **Rig as agent:** replace the scripted perceive/act with the LLM driving `pscale_play` → `pool_engage` → `bsp` itself; add render-then-decide and the ≥30s one-intent gate.
4. **Validate:** an autonomous run that is now *mechanically* the HITL path — then a David spot-check on two machines to confirm the dataflow truly matches.

## Open questions

- **`relationships`/`settings` as blocks** — do characters need dedicated `relationships:<h>` / `settings:<h>` blocks in the manifest, or do `knows` + `purpose` + `passport` already cover it for now? (Lean: add `relationships:<h>` when a scene needs standing inter-character history; defer otherwise.)
- **`pscale_play` reading the manifest** — should the scoop be fully manifest-driven (read shell → follow every address) or keep a sensible default set plus manifest extras? (Lean: default set + manifest extras, so a shell-less or thin handle still works.)
