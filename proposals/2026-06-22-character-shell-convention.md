# Character shell — `shell:<handle>` is the hermitcrab shell, for a fantasy-world handle

**Status:** DRAFT v2 for David's review (design-first; build only off the agreed spec). v1 invented a competing shell shape; v2 corrects it after reading the three live shells David named.
**Date:** 2026-06-22
**Decided so far [David, 2026-06-22]:** (Q1) specialise the existing `shell:<handle>`, don't fork a new name. (Q2) inhabitation is the *density spectrum* below, not a field. (Q3) shell is private (locked at `_`; the `drive` can be gray).

## The unifying insight (David)

A character shell has the same characteristics as the shells already in use — **the only difference is the handle is a character in a fantasy world.** The three live examples ARE the spectrum:

| shell | density | driven by |
|---|---|---|
| **happyseaurchin** | **thin** — Character face is just *"You are happyseaurchin. Speak in first person."* | a **human**; the person supplies the cognition |
| **weft** | **dense** — persona-laden Character face (*"coder at the seam, smallest-edit…"*) + manifest blocks (`purpose`, `wake`, `reflexive`, `concern`) | an **LLM app with its own harness** (Claude Code), human in the loop |
| **mobius** | **full hermitcrab** — densest manifest (`purpose`, `wake`, `horizon`, `vision`, `concerns`…); `kernel.js` loops | an **LLM API key + heartbeats**, autonomous |

All three are **one shape** — `1` faces (CADO) · `2` watched beaches · `3` manifest of named blocks · `9` metadata (block-conventions branch 2). They differ only in how dense the content is and whether a `wake`+heartbeat loop drives it.

## What this makes PC vs NPC

Not a type flag — **a position on that spectrum.** A character is a handle with the usual four blocks; its shell sits where its driver sits:

| character | shell density | ≈ |
|---|---|---|
| **Human PC** | thin — Character face ("You are Cyrus, a caravan guard; speak in first person"), watched beach, manifest (passport/witnessed/knows). The player drives. | happyseaurchin |
| **LLM-app PC** (claude.ai with a human) | dense — persona + decision-stance in the Character face, plus `purpose:<handle>` carrying the **drive**. Human-turn-triggered. | weft |
| **Active (autonomous) NPC** | full hermitcrab — persona + `purpose:<handle>` (drive) + `wake:<handle>` (heartbeat stimulus) + an API key. Self-acts in windows, no human. | mobius |

- An **authored standing figure** (Bram-as-scenery inside `spatial:<world>`) is still *not* a character — no handle, no shell. **Promoting** it to an active NPC = author the four character blocks and give it a *full-hermitcrab* shell (persona + `purpose` + `wake`) on an API key + heartbeat.
- **Absent-PC coverage** falls out for free: run the PC's own shell at mobius density (its `wake` + a heartbeat) while the human's away. Same shell, denser inhabitation.

## Where the character-specific content lives (no new shape)

Reusing the existing shell exactly as weft does:

- **Persona / voice / decision-stance** → the **Character face** (`shell:<handle>` position `1.1`), like weft's `1.1` (*"You are Weft… coder at the seam, honest about demonstrated vs claimed"*). For Cyrus: *"You are Cyrus, a caravan guard turned wanderer; speak in first person; read a room for exits before company; slow to warm; won't draw first."*
- **Drive** (the active agenda — the agency lever that stops the hedging) → a **`purpose:<handle>`** block named in the manifest (`shell` position `3`), exactly as weft has `purpose:weft` and mobius has `purpose.json`. Gray-encryptable so an NPC's hidden motive never leaks (Q3).
- **Autonomy** (what makes an NPC *active*) → a **`wake:<handle>`** block + a heartbeat, exactly as mobius. Present for autonomous NPCs; absent (or human-triggered) for PCs.
- **Capability/CF, standing wants, location, identity** stay in the **public `passport`** — others perceive that; the shell is private inhabitation. `passport.wants` (standing, public) ≠ `purpose` (current, operational, maybe hidden).
- **RPG-mechanical layer [David, 2026-06-22]** → the manifest (`shell` position `3`) ALSO gathers the character's *rule-bound* blocks: a per-character **`stats:<handle>`** (the NOMAD sheet — talent/skill CF inputs now; condition/HP/wounds the resolver writes deterministically from the band later, which finally lands the parked damage/death state block) plus references to the world rules it runs under (`rules:nomad`, `rules:<world>`). The shell is therefore the **complete context-assembly hub** — everything needed to *inhabit* AND *mechanically resolve* a character is reachable from one block, exactly as mobius's manifest gathers all its operational blocks. (`stats:<handle>`'s full shape is the NOMAD-hardness work already parked in the resolution-model notes; here we only fix that the shell manifest names it.)

So the character is still: `passport` (public sheet) + `shell` (private inhabitation, at a density) + `witnessed` + `knows`. Nothing new in the geometry — the character shell is the agent shell, specialised by intent (the catalogue's own rule).

## How it fixes what the rig flagged

The Agency-3/5 "everyone hedges" finding was driverless autonomy: a generic "you are cyrus, act." Give each character its **Character face** (who) + **`purpose`** (drive), and autonomous play pushes *divergent* intent. The rig reads `shell:<handle>` as the per-character system prompt (compose: directive = how the game works + Character face = who this is + purpose = what they're after now), then acts — "cognition fluid, structure persistent." An autonomous rig run = every handle at mobius density, no human in the chair: the loop you want.

## Why RPG is the whole-system test [David, 2026-06-22]

RPG play is the proving ground for the entire stack, top to bottom — and the reason this work isn't a side-quest:

- **pscale blocks** (depth = scale, position = relation) — the spatial map, the per-character spine, the pool.
- **bsp() + the federated beach** — every read/write, the window + atomic claim, the locks.
- **primary conventions** — `pool` (the gather/resolve window); `grain` / `sed:` where characters bond or band into collectives.
- **secondary conventions** — the RPG layer proper: frame / shell / directive delivering *workable semantic context* to each character-LLM (fog-of-war, co-presence, per-subject narrative).

RPG is the **maximal stress on semantic context delivery**: many agencies, each owed a different, consistent, *partial* view, gathered and resolved with no master truth. If the substrate delivers that coherently, the easier real-world cases follow — **because a real-world user is the same object**: a character shell at the *thin / human* density inhabiting the commons-world (the user = agent = character uniformity already in the substrate). "Works for RPG → works for real-world users" is not an analogy, it's an **identity** — same shell, same beach, same `bsp()`, lower stress. The RPG is how we test and demonstrate the whole system at once.

## Build plan (only after this spec is agreed)

1. **block-conventions branch 2** — add a short character-shell note: a character handle uses the existing shell at a *density* (thin human / dense LLM-app / full-hermitcrab autonomous); persona in the Character face, drive in `purpose:<handle>`, autonomy in `wake:<handle>`; private (locked `_`, drive gray). Land this proposal as rationale.
2. **rig** — drive each character from its `shell` (Character face + `purpose`) instead of the generic framing; an autonomous run reads every handle at wake/heartbeat density (rig-triggered heartbeat). Re-run the observer to confirm drive lifts Agency past 3/5.
3. **cartridge** — author `shell:<handle>` + `purpose:<handle>` for cyrus/anya/fenn; promote Bram to an active NPC (shell + purpose + wake); reseed thornwood; one keyed autonomous loop, then an optional human spot-check.

## Open (smaller) questions

- **Heartbeat in the rig** — the rig already loops turns; an autonomous NPC's "heartbeat" can just be the rig's turn cadence (no real cron needed for testing). Live autonomous NPCs would need an actual heartbeat (a beach-crab, ladder rung 2). Confirm we keep live-autonomous NPCs out of scope for now and let the rig's loop stand in.
- **`purpose` vs the soft directive's "drive"** — the directive already says "every turn is an act"; `purpose` gives the *content* of that act. No conflict, but worth a sentence in the directive pointing the soft at `purpose:<handle>` when present.
