# LLM navigates the beach — natural-language locate-and-record (the Character-voice path)

**Date:** 2026-07-24
**Status:** Spec for a fresh session. Self-contained; backstory pointers at the end.
**Surfaces:** `xstream-bsp` (the soft-LLM — primary), `bsp-mcp-server` (connector INSTRUCTIONS), `beach.happyseaurchin.com` (the spines).

## The problem, in one line

A Character user says, in their own words — *"record my thoughts on the aligning hour"* — and it lands as one line in **their own mirror** on the right spine (`experiences:<handle>` at address `6.1`), **without the user ever speaking pscale** (no "6.1", no "block", no "spindle"). The soft-LLM does the finding. This is the natural-language replacement for the read-only **view-drawer HUD**: the drawer is *manual* finding; this is the LLM finding *for* you.

David's framing (2026-07-24): *"Mentioning experience 6.1 is NOT character voice, it's author at least — they have to speak pscale block. Whereas character does not. It has to find the right address on the spine before doing the mirror... this aligns to another job — to use llm to navigate the beach rather than use the view-drawer hud. Once located, then the instruction can be given."*

## Why now: the RECORD half is done, the LOCATE half is this

Recording-in-character-voice splits cleanly:

- **RECORD** (write the line to the mirror, locked to the author) — **DONE.**
  - The soft-LLM's `bsp` tool writes any block at any spindle, defaults to the session secret, ungated (`xstream-bsp/src/kernel/claude-tools.ts` — the `bsp` tool + `executeTool`; the executor comment states "No hardcoded restriction on writes").
  - It now also takes `new_lock` (xstream **PR #164**), so a first write to a not-yet-existing mirror creates it **locked once with the user's secret** — sovereign in one call.
  - The bsp-mcp connector INSTRUCTIONS carry the general spine-mirror-tree recording convention (bsp-mcp **PR #191**): *reflections go to `<spine>:<handle>` at the same address; never the shared spine, never a convenient block (state-of-play / stash / history) unless the position's Trace names it; if you can't tell the spine / address / handle+secret, **ask** for that one detail.*
- **LOCATE** (map a plain description → the spine + address) — **this spec.**

So today a Character can already say it and get a **"locates-or-asks"** result: the soft-LLM either finds the place or asks one clarifying question — never making the user speak pscale. This job turns **locates-or-asks** into **locates-confidently**, and generalizes it beyond `experiences` to any spine.

## The goal (acceptance)

1. A Character-voice instruction with **no pscale** — *"jot down what I made of the aligning hour"* — lands one line at `experiences:<handle>:6.1`, the mirror **locked to the author**, the user never seeing an address or block name.
2. It **generalizes**: the same move works for another spine (a venture spine, `battery`, `tree`) — the LLM identifies the spine + address from the description, not from a hardcoded map.
3. When it genuinely can't resolve, it asks **one natural** question ("which experience — the aligning hour, or the map?"), never a technical one.
4. The machinery stays invisible (soft-agent Character contract: a Character never sees `bsp()` / spindles / block names).

## The four-step shape

1. **Hear** a plain description ("the aligning hour", "what I made of the slides").
2. **Identify the spine** it belongs to — recognise that arrival-experiences live on `experiences`; a venture reflection on that venture's spine; etc. (Discover by listing the beach surface + reading candidate spines; or from known-spine context.)
3. **Match** the description to a position — read the spine, find the entry whose prose matches ("The aligning hour" → 6.1).
4. **Record** — hand off to the RECORD half (write `<spine>:<handle>:<address>`, `new_lock` on first write). Already built.

Steps 2–3 are the new work. Step 4 is done.

## Likely approach (a steer, not a mandate)

The soft-LLM **already has the raw tools** — `bsp` read (incl. `bsp(agent_id=<url>, block="")` to list a surface's blocks), the `navigate` tool, and the connector's reflection convention. So this is expected to be **mostly guidance + a confident search habit**, not a new subsystem:

- **System-prompt / connector guidance:** teach the *locate habit* — "when a person reflects on something by name, find where it lives *before* writing: list the beach's spines, read the likely one, match their description to a position; ask only if the match is genuinely ambiguous." Name the well-known spines (`experiences` = the arrival-experience tree) so recognition is cheap.
- **Consider** a small dedicated affordance (a `locate` habit that reads the surface + a spine and returns candidate `(spine, address)` matches) **only if** guidance proves insufficient — prefer not to add a tool the `bsp` read already covers.
- **Reuse `navigate`:** once located, optionally move the column there for a visible confirmation.

Resist building a search engine. The beach is small and self-describing (each spine's positions are readable prose); an LLM reading the spine and matching *is* the mechanism.

## Constraints / discipline

- **Character never speaks or sees pscale.** No "6.1" / "spindle" / "block" in the Character-facing exchange (soft-agent branch 3 Character contract; bsp-mcp connector "THE FACE").
- **The record is sovereign** — `new_lock` on create, the user's own secret. NEVER write another person's mirror as them (shell-sovereignty).
- **Ask, don't guess** on real ambiguity (connector #191) — but the point of this job is to reduce how often it must ask.
- **Don't over-build.** Guidance + the existing read/navigate tools first; a test-first loop beats a subsystem.

## Where to work

- **`xstream-bsp`** (primary):
  - `src/kernel/claude-tools.ts` — the soft-LLM's tools (`bsp` read/write [now with `new_lock`], `navigate`, `pscale_pool_engage`) + `executeTool`. The **system prompt** that frames these tools is the main lever for the locate habit.
  - The soft-LLM query path — `handleQuery` (Column.tsx, the ⌘↵ path), `src/lib/soft-convos.ts`, `src/kernel/recipe-runner.ts` (system-prompt assembly). Find where the soft-LLM's system prompt is built and add the locate guidance there.
  - `navigate` / `onNavigate` (claude-tools.ts executor context) — optional post-locate confirmation.
- **`bsp-mcp-server`**:
  - `src/server.ts` `INSTRUCTIONS` — the connector convention (#191 added the recording half). A "locate first" reinforcement can live here too, so **every** connected Claude gains the habit, not only xstream's soft-LLM.
- **The beach** (read-only for this job): `experiences` is the spine to locate against (band 6 "Trials", 6.1 the aligning hour). List a surface with `bsp(agent_id="https://beach.happyseaurchin.com", block="")`.

## Test / done

- With `happyseaurchin` + passphrase loaded in an xstream column, a Character-voice ⌘↵ instruction that names an experience **by description only** lands at `experiences:happyseaurchin:<matched-address>`, locked, no pscale spoken.
- Repeat against a **second** spine to prove generality.
- Confirm the ask-fallback fires **only** on genuine ambiguity.

## Backstory (pointers — don't re-derive)

- Weft memory **`project-align-pool-convention`** — the full ALIGN pool + experiences spine-mirror-tree arc: why `experiences:<handle>` mirrors exist, the record-home leak (happyhedgehog's Claude filed reflections to `state-of-play`/`stash`) that started this, the 2.2/2.3 trace audit, branch 6 "Trials".
- Weft memories **`pattern-tree-stigmergic`**, **`pattern-room-at-handle`** — the tree-family (`spine:X` / `X:<handle>` / fold) and co-location conventions.
- Rests on: xstream **#164** (`new_lock` on the soft `bsp` tool), bsp-mcp **#191** (connector recording convention). The experiences edits (branch 6, 6.1, the 2.2/2.3 audit) are **live on the beach**, not in a PR.
- The soft-agent Character contract: `bsp(agent_id="pscale", block="soft-agent", spindle="3")`; the connector INSTRUCTIONS live at `bsp-mcp-server/src/server.ts`.
- Reflexivity check: this is the LOCATE half of "record in character voice"; the RECORD half is done. Start by reading the connector INSTRUCTIONS and `claude-tools.ts`, then decide guidance-vs-tool with a test in hand.
