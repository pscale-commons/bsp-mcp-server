# Keeping what someone found — the locate-and-record law moves to the door

**Date**: 2026-07-31 · **Status**: LANDED (this session, on David's instruction) · **Scope**: `src/server.ts` INSTRUCTIONS only — no new tool, no new convention, no block change.

## The observed failure

Julie recorded seven readings of experiences she had actually done. Every one landed in `state-of-play:happyhedgehog` — the block for testing whether the machinery works — instead of `experiences:happyhedgehog`, and appended in a flat stack rather than sitting at the address of the experience each was about. Nothing was lost; nothing was foldable either. The fold reads mirrors at an address; a reading with no address is a reading nobody receives.

The instinct was to blame the guidance. The guidance is fine:

- `spine:experiences:_` states the law plainly — *"leave ONE LINE at the same address in YOUR mirror — block `experiences:<your-handle>`, locked once with your own secret."*
- `spine:experiences:6` states it again and names the exact wrong answers — *"and nowhere else (not state-of-play, not stash)."*
- Each entry carries its own return address in a trailing `Trace:` clause (`1.4` — "Trace: mirror line at 1.4"; `2.2` — "plus a mirror line at 2.2"; `6.3` — "leave your reading at 6.3 of `experiences:<your-handle>`").
- Each entry's opening phrase IS its title, so plain speech ("the two-verb pool") resolves to an address by reading, not by guessing.

And the operational shell was already fully authored at **`soft-agent:6,7`** — locate before acting on plain words, the walk (6.71), the record to the user's own mirror at the same address (6.72), the nevers (6.73), the voice (6.74), the one-question ambiguity rule (6.75).

## The actual gap: delivery, not authorship

None of that is delivered to the session that needs it.

- **xstream** injects the soft-agent shell into its kernel, so its LLM holds `6,7` every turn.
- **A Claude app, claude.ai, or Claude Code holding only the bsp-mcp connector** receives `INSTRUCTIONS` and nothing else. It never sees `soft-agent`. It never sees `spine:experiences` unless it independently decides to go and read it.

So the failure mode is precisely: *the fix lived in a block, and the bug is that the session does not read blocks it has not been told about.* Any remedy that is itself a block reproduces the bug. The only surface that is unconditionally in context for every client, on every connect, by every path, is the server instructions. That is the door, and that is where this belongs.

## What landed

One paragraph in `INSTRUCTIONS`, placed directly after the CADO paragraph — it is the operational consequence of Character ("a person should interact effortlessly without ever thinking about the beach"), so it sits where that promise is made. It states:

- **The walk, before any write** — list the surface, read the spine naming the territory, match the person's words against each position; the opening phrase is the name, the `Trace:` clause is the return address.
- **The record** — a direct `bsp()` write to the person's OWN mirror, `<family>:<their-handle>`, locked once with their own passphrase, at the SAME address the thing holds on the spine.
- **The nevers** — not the shared spine; not a pool (a pool is where an experience runs, a place and not a record); and not whatever block the session already had open, which is named explicitly as the commonest field failure.
- **The voice** — confirm in their words alone; they never see an address.
- A pointer to the full shell at `soft-agent:6.7` for a session that wants the whole thing.

Stated as the general mirror law over any tree family, not as an experiences feature — it covers `experiences`, `state-of-play`, `arrival`, `games`, `neighbour-gifts`, and every family authored after it.

Also fixed in passing: `soft-agent:3.3.4` in the same paragraph region was a forbidden multi-dot address (survived the `3394f02` multi-dot sweep). Now `soft-agent:3,3,4` in comma-walk form. `INSTRUCTIONS` scans clean for multi-dot.

## What was deliberately NOT done

- **No new primitive, no new tool.** The surface stays at eleven.
- **No block change.** `soft-agent:6,7` and `spine:experiences` were already correct; authoring them again would be duplication that later drifts.
- **Nothing in `welcome`.** The welcome is the first turn with an arrival; recording happens after someone has done something, often sessions later. Wrong moment.

## Cost and the honest limit

`INSTRUCTIONS` grows by 1,373 characters, to 19,355. That is real budget spent on the one paragraph, and the bar for the next such addition should be the same: a law, delivered nowhere else, whose absence has been observed to break something in the field.

The limit worth naming: this makes the correct behaviour *reliably prompted*, not *mechanically enforced*. A session can still write wherever it likes — the substrate does not refuse a reading filed in the wrong block, and should not. What changes is that no session can now claim it was never told.

## Verification

`npm run build` clean · `npm run smoke:sentinel` pass · `npm run smoke:parser` 104/104 · delivered paragraph rendered from the compiled export and read back.
