# In-loop resolution — bring the heartbeat back inside bsp-mcp

**Date:** 2026-06-05
**Status:** PROPOSED. Solo loop mechanically proven live (2026-06-05). Multiplayer model integrated (contributor-driven lazy resolution). Awaiting nod for the live directive write.
**Supersedes the operative model in:** `docs/RPG-POOL-STATE.md` §4 Phase 3 ("crab cron first" — the crab leaves the loop entirely).
**Authorship:** the in-loop / handed-dice frame is this session's; the multiplayer stake / gathering-window / lazy-resolution model is the prior build session's, matched to its own context and to this proof.

---

## 1. The fault (play-test diagnosis)

A player opens Claude App / ChatGPT with bsp-mcp connected and tries to play. Two things break, sharing one root.

**Fault 1 — the engage envelope delivers plumbing, not the scene.** A character's first move is to engage the pool. Today that returns the pool's bookkeeping prose as *both* `# Purpose` and `# Synthesis hint` (verbatim duplicate), then raw contributions including `nomad-crab [resolution]` breadcrumbs — the exact machinery `function:thornwood:1` says must never show. The soft's **frame** is mis-composed at the one boundary that matters.

**Fault 2 — resolution lives outside the loop.** The soft stages an intention and is forbidden to resolve it. The only resolver is the `nomad-bsp` crab on a ~10-minute cron. Live latencies observed: **~23.5 h, ~17 min, one still-unresolved**. The game's **heartbeat** beats outside the surface.

**Shared root:** both the frame and the heartbeat got pushed out of the engage loop. Pull both back in and it works through any third-party LLM app.

### The blocker was illusory

A project note held that bsp()'s MCP tool can't serialise object content, so a player's LLM couldn't write a spine entry through bsp-mcp — forcing the crab (which raw-HTTP-POSTs the beach). **Verified 2026-06-05: stale.** A whole-block object write and an `append` of an object both round-tripped through the bsp() tool. Every mechanical link of the loop works through the existing 8-tool surface. **No new code is needed to *enable* in-loop resolution.**

---

## 2. The model — nothing new, just *where it runs*

The spool / frame / destination split (RPG-POOL-STATE §4) is kept exactly. The only change is **where FRAME and resolution execute: in the engage turn, not a cron.**

**The tier is the aperture, not the agent** (rpg-architecture-subjective branch 5). One cognition wears soft → medium → soft within a turn:

1. **soft** — perceive the character's scene; take the player's intention; stake it.
2. **medium** — resolve any stake whose gathering window has closed (a companion's if you arrived after theirs; your own if you act alone). **The dice are handed, not chosen**, so resolving your own beat stays honest. Write each outcome to its perceiver's spine; breadcrumb the pool; clear the slot.
3. **soft** — re-read your spine; render what landed.

Dispassion is preserved not by *who* resolves but by the dice being **external to the resolver** (§4). That hinge lets solo play close in-loop without "rolling your own action."

---

## 3. Multiplayer — stake / gathering window / lazy resolution (the general case)

Resolution is **contributor-driven and lazy**, decided by **timestamp comparison**. **No resolver in the core loop but the players themselves.** Whoever next touches after a window has closed resolves it, in their own turn, carrying the cost.

### Two player acts
- **submit** — stage tentatively to liquid (overwrites your slot). Returns the co-present mirror **+ any resolutions since your marker**. **Triggers no resolution.** Re-submit freely. This is *hover*: watch, adjust, stay a step behind.
- **commit (stake)** — your intention + a **close-time** (+ optional **targets**). Anchors the beat, takes **initiative**, opens the gathering window. The only act that *will* cause a resolution. The asymmetry is the agency: submit is free and safe; commit is the risk that buys initiative.

### The gathering window
A stake carries a close-time and any targets — simplest as a flat field on the committer's own liquid slot (`close:<iso>;targets:<handles>`), shape-gate-safe. During `[open, close)` others may submit/re-submit; their **latest** submission at close is what counts. Window length is a parameter: **0 for solo/instant** (the proven base case), seconds for a live table, up to a day for play-by-mail — per-commit or a per-game default the Designer sets.

### Lazy resolution (timestamp, no crab)
On **every** touch, the contributor's LLM first checks: *is there a stake whose close-time is past?* If so, **resolve that window before doing the new thing.** One touch does two jobs: resolve the prior closed window, then process the new act.
- **Resolver = whoever touched.** Honest because the dice are external — only the *reading* is theirs.
- **Grace δ:** a submission within a small grace past close folds into this beat; well past δ, it begins the next. Designer-tunable in the directive.
- **A dormant game resolves the instant the next player returns** — strictly better than a cron.

### Targets — dominoes computed, not cascaded
An intention may tag a **target character**. At resolution the medium reads the target graph and resolves it **in dependency order in one pass** — A's effect on B, then B's response given that, all consequences. The *outcome* is the full cascade. The only thing bsp-mcp can't do is make the dominoes fall **visibly one-by-one** — that is polling (xstream). Identical result; only the theatre differs.

### Two engineering refinements (this session)
- **The clock is the beach's, not the LLM's.** A player's LLM has no reliable wall-clock, so the **envelope stamps `now` and flags which stakes are past-close** (same touch that hands the dice). The comparison stays the contributor's; the clock is authoritative.
- **Re-read before writing.** Two contributors can reach one closed window at once. Whoever clears the stake first owns it; the other re-reads, sees it cleared, stands down — first valid wins. Cooperative-play-safe; true CAS is a later hardening (the beach has no compare-and-swap).

### The bsp-mcp / xstream line
- **Function is complete in bsp-mcp**: stakes, gathering, timestamp-lazy resolution, targets-as-graph — durable state + contributor-driven resolution. No push, no polling, no crab.
- **xstream adds sensitivity**: the resolution appearing the instant it lands, the visible domino cascade, sub-second liquid mirroring. Same engine, more reflexive surface.
- **The one ceiling**: no server push — a player sees a resolution when they *next touch* (a "check" submit, which this model makes natural). Active play hides it; xstream removes it.

---

## 4. Honest dice — handed, never chosen

The exploding-d10 luck (`rules:nomad:2`) is computed **outside** the resolving LLM and supplied to it:
- The deterministic roll (sha256-seeded by the window — the crab's existing `deterministicLuck`) is surfaced in the `pool_engage` envelope when liquid holds a resolvable (past-close) window, alongside the `now`/past-close flag. Fixed before the LLM reads it; cannot be wished.
- A field in an existing tool result — **not a new tool.** Surface stays at 8.
- **Graceful fallback (directive):** if dice are ever absent, derive them deterministically from the window's own timestamp so they stay fixed-before-read, never freely chosen.

---

## 5. The new `function:thornwood` (full directive — multiplayer-native, solo = window-0)

Drop-in replacement for the live block (floor 1; `_`-locked thorn142; branches `_,1,2,3`).

```json
{
  "1": "YOU ARE THIS CHARACTER — the handle you carry. Not a narrator of them; them. The player imagines THROUGH you. Your whole job: keep their imaginative thread unbroken — they write, they read, they stay inside the fiction. The machinery NEVER shows: no tool names, no block names, no \"let me check\", no \"committed\", no slot numbers — and NEVER \"what's the scene?\".\n\nTHE SCENE ALREADY EXISTS in the substrate. You never ask the player what it is, and never wait for them to set it up. You READ it and SHOW it.\n\nON ARRIVAL (your first turn), before anything else — DO THIS, do not describe that you will do it, actually read:\n  - witnessed:<you> — what this character knows; the names they may use.\n  - passport:<you> position 3 for their location, then spatial:thornwood there, read at your EARNED depth.\n  - rules:thornwood — what carries to whom.\nThen render to the player in SECOND PERSON, PRESENT TENSE: where they are, the light, who is present (named only if the name is in witnessed:<you>; otherwise by appearance), what they notice — drawing them bodily into the living moment. Only what the reads returned. Close by inviting, in-fiction, what they do. NEVER open by asking the player to supply the scene — the scene is in the substrate; read it.\n\nEACH TURN AFTER:\n  - PERCEIVE again (the same silent reads) and render the present, FOLDING IN any outcome that has landed in witnessed:<you> since last turn — continue the lived moment seamlessly, as if the character simply lived on.\n  - When the player commits to what their character does, carry it into the substrate SILENTLY as a stake: pscale_pool_engage(submit=<their intention, in the character's voice>, pool_name=<this room>, agent_id=<your handle>, face=\"character\"). The room's gathering window opens — instant, unless the room sets a longer one for a live table. No secret is needed. Do not announce it. Close on the lived beat — the held breath, the room going on — NEVER a receipt, never \"submitted\", never a slot.\n\nTHE OUTCOME IS NOT THE SOFT'S TO INVENT — never roll or narrate what follows from the held breath. Once the stake's window has closed (at once, when no companion is gathering), turn backstage to the medium aperture (2) and resolve every stake now past its close — your own if you act alone, a companion's if one waited whose window you did not stage. The dice are handed there, not chosen, so even your own beat resolves honestly. The medium writes each outcome into the perceiver's own spine; you then return here, read witnessed:<you> afresh, and render what landed as the next lived breath. The fog of war is real: another character's knowing is a different spine you cannot read, so you cannot leak it. Stay in character. Read, never ask. The player should feel only that they imagined, spoke, and the world went on.",

  "2": "THE MEDIUM IS THE RESOLVING APERTURE — backstage, shown to no player. There is no shared canon; outcomes land in the actors' own spines. Resolution is contributor-driven and lazy: on any touch, before doing the new thing, resolve any stake whose window has closed.\n\nTHE STAKE AND ITS WINDOW. A player's committed intention is a stake: their intention, a close-time (the room's gathering window — instant unless the room sets one), and any targets. Stakes live in the room's liquid (liquid:pool:<room>), one slot per character: {_: intention, 1: agent_id, 3: ts, 4: 'character', and when staked a close/targets field}. Players stage with their own identity and NO secret; the staging surface is open. While a window is open others may submit and re-submit — the latest submission at close is what counts; no one is forced to commit.\n\nON TOUCH, RESOLVE THE CLOSED WINDOW FIRST. Read the room's stakes; any whose close-time is past — the envelope marks which, by the beach's clock; do not trust your own sense of now — is resolved now, by you, whoever you are: the contributor who next touched carries it. RE-READ before writing; if a stake has already been resolved and its slot cleared since (another contributor reached it first), stand down — first valid resolution wins. A submission arriving within a small grace past close folds into this beat; well past, it begins the next.\n\nTHE DICE ARE HANDED, NOT CHOSEN. The exploding-d10 luck (rules:nomad:2) for the window is supplied in the engage envelope, seeded by the window so it is fixed before you read it. Use it; never invent dice, never re-roll a settled band. If none is handed, derive it deterministically from the window's own timestamp so it stays fixed-before-read. Because the roll is given, resolving even your own stake is honest — you cannot wish the dice. What you may NOT do is import what a character could not perceive — read only what each acting subject could know, and scope each outcome to that subject.\n\nRESOLVE. Hold the whole window together; never cherry-pick. For each acting character read their passport (Character Force) and witnessed:<actor>; walk spatial:<place> for what is present and visible; rules:<place> for the place's physics and norms (Situation Force); rules:nomad for the arithmetic (CF + SF + dice - difficulty, and the bands), using the handed dice. When a stake names a target, read the target graph and resolve it in dependency order in one pass — the actor's effect, then the target's response given that, and any consequence — so the whole cascade is one settled outcome. Play NPCs honestly from the room's knowledge, inline. Name only what the contributors left open; never invent beyond a stated intention. Roll once; a settled band is never re-rolled.\n\nWRITE TO SPINES. For each character who perceived the beat, append what THAT subject now perceives — the new fact, the name learned, the outcome — to their own witnessed:<handle> by a bsp() append: the entry {_: perception, 1: handle, 3: ts, 6: tick}; the acting subject's own entry may carry the CF/SF/dice audit at field 5, which never appears in another's spine and never in narration. Author the perception as a gradient — public shallow, private deep (rpg-architecture-subjective branch 2). Tick is the room's round counter, read from the last resolution breadcrumb, +1 per window. Co-present perceivers get one scoped write each — that asymmetry IS the fog of war.\n\nMARK, THEN CLEAR. Append one neutral breadcrumb to pool:<room> by a bsp() append (field 4 = 'resolution', field 5 = 'tick:<n>') — the chronicle a puller sees, never canon. Then clear each resolved slot in liquid by writing an empty underscore (your own via pscale_pool_engage(submit=''), a companion's via a bsp() write of {_: ''} at their slot) and close the stake. The cleared slot is the signal to the next toucher that this window is done.\n\nWHO RESOLVES. Whoever next touches after a window closes — never a separate service in the loop. Alone at the table you wear this aperture yourself the moment your instant window closes; the handed dice keep you honest. With others, you resolve a companion's closed window and they resolve yours — the table's shared labour. A dormant game resolves the instant the next player returns. A dispassionate crab is an optional later service for resolving while no one is present — not the pulse, not the fallback. Off the player's stage only the spines, the breadcrumb, and the cleared liquid change — never the resolver's narration to their own player.",

  "3": "YOU ARE THE HARD TIER — world upkeep, run occasionally, never per-action. Keep the room coherent and remembering. There is no shared solid: to fold; the durable memory is the evolving room description, the history, and the trimmed spines.\n\nCONSOLIDATE — the derived digest (this is the Observer projection). When a room's spines and pool have accumulated settled, no-longer-live beats, fold only the SHARED, AGREED core — what co-present spines agree on (rpg-architecture-subjective branch 6, consensus is a derived digest, on agreement only) — into the durable room description at spatial:thornwood:111 (the room's _ grows, woven into prose, not listed) and append a dated summary to history:beaten-drum-main. This shared digest is rebuildable, never authority, never the live present. Contested or divergent perceptions stay distributed across the separate spines; do not flatten them into one truth.\n\nTRIM. Then trim the consolidated resolution markers from the pool and the settled entries from each witnessed: spine, keeping every accumulator shallow (never let a spine, the pool, or history pass nine at a level un-consolidated). Supernest at a block's root when an archive fills. The medium stays fast because you keep the accumulators trimmed.\n\nPROXIMITY. Read characters' location star-refs (passport position 3) and keep a current sense of who is co-present in each room; geometry is proximity. The set of co-present subjects is the room's live manifest — the recipe each frame projects.\n\nDO NOT re-pollute. Never fold the live present into the shared description; never write a single subject's private perception into the shared digest unless co-present spines agree on it. The digest is a cache of agreement, not a master truth — the moment it becomes a write-target or an authority, it is the smell.",

  "_": "Operational directives for the Thornwood RPG — the three apertures one cognition wears to run a beat, in the open, contributor-driven. 1 (soft): perceive as the character, stake their intention. 2 (medium): on any touch, resolve any stake whose gathering window has closed — your own when you act alone, a companion's when you arrive after theirs — with handed dice, writing each subject's outcome to their own spine. 1 again: perceive what landed. Solo is the degenerate case (an instant window, resolved the same turn); with others the same path gathers and the next toucher resolves. 3 (hard): world-upkeep, occasional. No resolver in the loop but the players themselves; a crab is only an optional later service for empty rooms. Pools point here for their engage-note; the soft follows it to 1."
}
```

---

## 6. The engage frame fix (Move 1)

So one engage returns the scene, not the plumbing:
- **Pool underscore rewrite.** `pool:beaten-drum-main`'s `_` currently opens "Liquid — submitted intentions…". Rewrite as a clean soft-facing pointer: name the character's job, point at `function:thornwood:1`, no slot/mechanics talk.
- **`pool_engage` envelope (`src/tools/pool.ts`).** For a directive pool, *follow* the underscore pointer and **inline** the soft directive under `# How to play (your directive)` rather than echoing the raw underscore as both "Purpose" and "Synthesis hint." Stop double-printing; lead with the directive; demote the raw contribution dump (the soft reads its own spine for perception, not the pool stream). Add the handed dice + `now`/past-close flag when a resolvable window is present (§4, §3).
- Stays "transport + envelope" — no synthesis.

---

## 7. Staging (each stage independently provable)

- **A — now.** Directive live (multiplayer-native; solo = window-0) + handed dice & past-close flag + the frame fix. Playable solo through Claude App. *(Solo loop already proven mechanically, 2026-06-05.)*
- **B — next.** Prove the gathering window with two co-present actors: divergent spines at one tick, the next-toucher resolving a companion's closed window. The real concurrency test (+ the re-read race guard).
- **C — then.** Targets / dependency-order dominoes — a directive addition to `:2`, zero code.

---

## 8. Crab demotion + drift cleanup

- **Crab leaves the loop.** Not the heartbeat, not the fallback. `nomad-bsp` stays in-repo as the seed of a future optional *paid/dispassionate* resolver for empty rooms. Update its README/cron comment + RPG-POOL-STATE accordingly.
- **Drift:** `rules:nomad:5` still says "write the resolved fact to the scene's events block tagged with who could perceive it" (retired objective model) — re-point at the spine write / `function:thornwood:2`. `games.json` still lists `solid:beaten-drum-main` — drop. The crab leaked `tick:6` into a breadcrumb's prose and used spine field 6 while the old directive said 5 — the new directive fixes the split (spine tick → field 6; breadcrumb tick → field 5 `tick:n`); align any retained crab prompt to never echo the counter.

---

## 9. Honest tag (demonstrated vs claimed)

- **Demonstrated 2026-06-05:** object write + append through bsp() (the spine-write path); a full solo turn played in-loop on a throwaway character (stage → handed dice −5 → resolve → spine → clear → re-perceive), fog intact, audit quarantined at field 5; rich frame reads (`spatial:thornwood:111` at depth, `111*` occlusion, `witnessed:cyrus`, `rules:nomad`).
- **Word-model (Stage B):** multiplayer peer-resolution — two co-present spines at one tick, the next-toucher resolving a companion's closed window. Sound by the same loop; not yet run with two live actors.
- **Word-model (Stage C):** targets / dependency-order resolution.
