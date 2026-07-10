# Diagnostic battery — banks of checks for the whole system

**Date**: 2026-07-09 · **Status**: PROPOSED (David's question: "would it be worthwhile to create a check-list with banks of functions to test?") · **Author**: weft/CC, from the 2026-07-09 audit + consolidation session

## Purpose and law

One checklist, ten banks, four cost tiers. The law that makes it affordable: **every change runs tier 0 plus the bank(s) it touched; the full sweep runs rarely** (before public milestones, after systemic change). A bank is a function-family of the substrate, not a repo — most banks exercise both doors (bsp-mcp and xstream) because mirror-parity is the standing acceptance shape (proven for pools, 2026-07-08, 6/6).

The bar is experiential (the standing feedback): a bank passes when the act **completes and is witnessed through a door**, not when a unit test goes green. Tier 0 exists to keep the geometry honest cheaply; tiers 1–3 exist to keep the experience honest.

## Cost tiers

- **T0 — automated smokes.** Free, minutes, no LLM, no live data. Run on every PR touching the area. These exist and are healthy (inventory below).
- **T1 — wire NHITL against a throwaway sub-beach.** Scripted end-to-end acts over HTTP against `<name>.beach.happyseaurchin.com` (Host-derived namespace = free isolation on the shared Upstash; NEVER live worlds — worktable rule, two collisions learned it). No LLM spend. Minutes.
- **T2 — inhabited NHITL.** An LLM in the loop (rig-style) and/or a browser driving the deployed app. Costs API calls. Run per-bank when its function changed.
- **T3 — full diagnostic.** All banks, both doors. Rare and deliberate.

## The ten banks

| # | Bank | What it proves | Coverage today | Gap |
|---|------|----------------|----------------|-----|
| 1 | **Kernel** (bsp geometry) | parse/walk/emit, shapes, floor law | **T0 COMPLETE**: bsp-test 72/72, parser 83 py / 101 TS / 62 xstream, conformance 59 (new — dispatch parity, the anti-drift gate), floor 15, unit 23 | none |
| 2 | **Wire/beach** | locks R1–R4, append+supernest (incl. race), tide, shape gate, sub-beach namespacing, DELETE, confirm gate | T0: wellknown 33, session 8 (new); race fix proven on preview beach | T1 script adding lock-rotation + tide-clear + gate-hardening cases |
| 3 | **Signal (L1)** | mark → passport publish → presence → liquid stage/clear, read back through BOTH doors | manual only | **MISSING — build T1 script** (cheap, no LLM) |
| 4 | **Commitment (L2)** | keys → grain reach → accept → gray use → degray; sed: found → register → position-lock → write | pieces (gray 25, group 24 smokes); no end-to-end rig | **MISSING — build T1 script**; lands naturally WITH the Phase 2 grain standardisation (digit-legal reach hint) so the new shape ships with its own bank |
| 5 | **Semantic (L3, SAND)** | rider make → verify (arithmetic) → relay verbs | verify arithmetic unit-level | field T1 deferred — SAND circulation is design-first (Sqale conversation); build the bank when the grammar settles |
| 6 | **Play (L4, GRIT)** | perceive → commit → contest window → resolution, both doors | **T2 EXISTS**: rpg-rig NHITL, mirror-parity harness | keep; parameterised cartridge already supports throwaway worlds |
| 7 | **Agent (genus-one)** | hatch → ghost → bare → seat → fold → history counting law → parity across three doors | **T0+T2 EXIST**: genus-parity 29/29; NHITL runs 2026-07-07/08 | formalise the run list as a repeatable script; add pscale_genus connector probe (ghost wake, free) |
| 8 | **Ticketing (payway)** | issue → verify → fulfil → audit trail | first cases ran (runs A/B/C, live money once); fulfill-hatches --list | T1 re-run on Stripe test mode, scripted; parked until payway unparks |
| 9 | **Xstream reflexive** | vapour two-context delivery, liquid poll latency, commit render, key flow (two-column, restored-session, remember-choice), shell column, truth strip, viewer nav | mirror-parity covered pools only | **MISSING — build T2 bank**: browser-driven (two contexts) against a preview beach; this is the bank for what just changed |
| 10 | **CADO journeys** | distance-to-self-service — the architect-exit gauge | never run | **MISSING — the matrix below**; T2/T3, run rarely and per-context |

## Bank 10 — the CADO journey matrix

CADO is an intermediary handle for role-relationships that emerge from use — aligned with ways:genus stances (speak/tend/look; lend sits outside as funding) and ways:tickets roles (holder/seller/machine-keeper/verifier). So the check is **never schema conformance**. Each cell is one lived journey through one door, scored:

- **clean** — the act completes with no architect and no workaround
- **friction** — completes, but the user needed knowledge the surface didn't give
- **needs-architect** — only Claude Code (or the maintainer) can do it today

Cells: **faces {C, A, D, O} × doors {claude-ai app via bsp-mcp, xstream} × contexts {rpg world, non-fantasy world, genus agent, ticketing}** = 32 journeys, most sharing machinery. Examples of the acts: Character speaks in a room / leaves a mark naming a shell / holds a ticket; Author fleshes a place or a shell's materials / sells a promise; Designer edits rules:nomad or a shell's mechanics / keeps the machine; Observer watches a room and reads recaps / verifies a ticket audit trail. A journey that succeeds without the face ever being named is a PASS — the substrate carried the flavour.

The matrix total (clean count / 32) is the single number for "how far from shifting off Claude Code" — re-scored only at T3 sweeps or when a context's surface changes.

## Standing triggers

- Kernel/wire change → banks 1–2 (T0 always; T1 for wire semantics)
- Client dialect/UI change → banks 1, 9 (the conformance smoke IS the drift gate)
- Grain/sed change → bank 4 · Pool/GRIT change → bank 6 · Genus change → bank 7 · Payway change → bank 8
- Before any public milestone → T3 sweep incl. bank 10 re-score

## Bank 9 — first run, 2026-07-09 (results log)

Ran the core reflexive loop in-browser (local build of the fix branch, live root beach, anon identity) after David's sixty-second pass failed. Found and fixed: **the liquid slot-truth defect** (commit sourced the first self slot — an orphan — while write/clear targeted the presence digit; no sweep outside explicit handoff; commit cleared the wrong slot). Pre-existing, not a consolidation regression: identical failure on the pre-consolidation bundle at marks 10:34:55. Fix: one selection rule (newest self slot), cycle orphan sweep (5-min age gate), sourced-slot clear — xstream-bsp PR #103, conformance smoke 59 → 64. Verified in-browser: seeded orphan swept in one cycle; stage → commit published typed text verbatim → sourced slot cleared and stayed clear.

Also observed, queued (not yet failures):
- Supabase Realtime `send()` falls back to REST with a deprecation warning on every vapour broadcast — live two-context vapour delivery still untested (the bank's next case), and the fallback may mean the websocket path isn't connecting.
- Kernel `onLog` narration (incl. the new sweep logs) still lands in Column's discarded `setLogs` — known critic residual; makes browser NHITL diagnosis needlessly blind.
- Two-column, restored-session key flow, and shell-column cases of this bank remain unrun.

**Lesson for the battery's law**: this bank must run BEFORE any human pass whenever the client's substrate path changes — the sixty-second pass is the exit test, never the first test.

## Where this lives

This document is the draft. Once voiced, the checklist belongs ON THE SUBSTRATE (a cook: recipe or a method: block a beach can seed) so any door can read the current battery and its last results — the runbook rule: blocks, not markdown, for what agents read. Results of T3 sweeps should settle to the relevant worktables' past branches, cited like any completion.
