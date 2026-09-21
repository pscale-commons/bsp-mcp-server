# The flow producer for played calls — a composer that declares its parts

**Date**: 2026-09-21
**Status**: implemented on `claude/flow-play-producer` (this PR). The genus half is `proposals/2026-09-15-flow-producer.md` and `src/flow.ts`, live at `flow:egg-one` since 2026-09-20. The viewer half is happyseaurchin-home `mindflow/flow/`, which already reads `?source=beach@<origin>:<block>`; one companion change there teaches it that a play block has no reply (`claude/flow-viewer-play`).

## The ask

David, 2026-09-21: *"Can we teach the mirror or from an llm-app request — to create the url so i can view the semantic-flow of something? I'd like to see the semantic flow of a process for eg an egg-one or doorman process. is this feasible?"*

Half of it already worked. `flow:egg-one` is a live producer — the `pscale_genus` door publishes the window at every keyed wake, and `happyseaurchin.com/mindflow/flow/?source=beach:flow:egg-one` has drawn it since 2026-09-20. The URL itself needs nothing built: the viewer has taken `beach:<block>` and `beach@<origin>:<block>` since #246, so any caller composes the URL from a name.

The other half did not. `flow:Ugarth` — the doorman's own window at brackenfoot-open — was a **measurement**, not a producer: five read-only compositions captured by `scripts/rpg-flow/capture.ts` and carved into a block by `build.py`, once, by hand, on 2026-09-21. Its own position 9 says so. The URL works and the block is frozen.

So: make the played calls publish themselves.

## Why the beach cannot fill this in afterwards

The beach records OUTCOMES — the beat that landed, the telling that was journaled, the sheet that was kept. It has never recorded the COMPOSITION that produced them, and cannot: only the thing that composed the window knows what went into it. That is the same argument `proposal:flow-producer:1` made for the genus door, and it lands the same way here. The composition of a played call happens in `src/tools/tiers.ts`, so the producer has to live beside it.

## The one real decision: the composer declares its parts

The genus producer reads a `GenusWindow` — `{system, message}`, already structured, which `windowNode` walks. A tier call is **one string**. `build.py` recovered its pieces by matching section headers (`find(s, '[THE PLACE')`) and string-replacing the table it was first run at into whatever capture was in hand. That is fine for a one-off measurement and wrong for a producer: it is a second parser of text the composer had in pieces a moment earlier, and it would rot the first time a section label changed.

So the composers now **declare** what they already know. Each piece of a call becomes a `Part` — the address it was read from, what it is in the composer's own words, its stratum, its lodestone rung, which side it stands on, and its text — and the window's text is `joinParts(parts)`. One code path: the bytes a door sends and the parts the producer reports can no longer disagree, because they are the same array.

**Proven, not asserted.** `composeTier` was run against the live `brackenfoot-open` table as Ugarth on `origin/main` and on this branch:

| tier | chars | sha256 (16) |
|---|---|---|
| medium | 26,992 | `ef1fedf67ec621e5` |
| hard | 77,045 | `24c968c8dbf735c7` |
| soft | 12,429 | `eae250c5403539f7` |

Identical on both sides, before and after the publish hook was wired. No door's call changed by a byte.

Two smaller things fell out of it:

- `roomLaw` now returns the NAME it resolved as well as the block. The producer has to say which law a call carried, and re-deriving it from the pool's underscore a second time would be the same parse written twice.
- A span may name its **stratum**, which is where the viewer's strata colouring reads it (`STRATUM_LINE_RE`, site #296). A genus span names none and its lines are unchanged.

## What it writes

`flow:<handle>` at the **table's own beach** — the same block name and the same walkable shape `src/flow.ts` documents, so one viewer draws both and a reader with `bsp()` and no viewer can walk it. Three calls kept, oldest dropped, time-ordered, each `_` naming its tier and room. Labels, addresses and sizes only.

**No reply is recorded, and the block says so.** The router composes the call; the door runs it on its own key and acts with the ordinary verbs. What came back never passes through this producer, so claiming a reply would be a measurement the code cannot make. (The hand measurement filled in typical reply sizes from the live record and marked them ≈; a producer must not.) This is the one place the play block differs in shape from the genus block, and it is why the viewer needed teaching — it was calling a window with no reply "awaiting its reply", promising one that is never coming.

## The two gates, both borrowed

`proposal:flow-producer:6` says not to invent a second mechanism for the switch. So:

1. **The dial** is position 7 of `wake:<handle>` at the table, read by the same `flowSwitch()`. Default off. Off writes nothing at all — no block, no stub.
2. **Keyless never publishes.** A tier engage carrying no `secret` composes and publishes nothing, exactly as a ghost-wake does. Authority is the handle's own, as everywhere.

## Verified

- `npm run smoke:flow-play` — 45 checks: off is nothing (three ways, plus a declined soft tier); the shape gate; nine children at most per side with the smallest gathered and no span or char lost; flags first/unchanged/changed across calls; three kept; every span line naming its stratum and the window carrying three shares that sum to a hundred; and the privacy check run adversarially — a planted secret and a 23k body PROVEN present in the composed window and asserted absent from the published bytes.
- `npm run smoke:flow` (55), `smoke:parser` (104), `smoke:unit` (23), `smoke:pool-engage` — all unchanged and passing.
- **Live**: a throwaway handle `flowprobe` at the sealed trial table `/w/rpg9-pool`, dial on, real `medium` and `hard` engages with a key. The producer wrote `flow:flowprobe`; the block walks; the viewer draws it at
  `happyseaurchin.com/mindflow/flow/?source=beach@beach.happyseaurchin.com/w/rpg9-pool:flow:flowprobe&colour=strata`.
  A `soft` call that declined (nothing new to tell) published nothing, as the contract says.

## What this does not cover, and why it is named rather than quietly left

**The door and an ordinary turn.** `pscale_play` and a non-tier `pool_engage` also compose windows — they were two of the six the hand measurement drew — but they assemble a different shape in `play.ts` and the engage envelope, and neither declares its parts yet. They are absent from a play block today. The route is the same one taken here: declare the parts where they are assembled, then publish beside. Until then the provenance at 9 says plainly that those doors compose elsewhere and do not appear.

**A handle that both plays and wakes** would write one `flow:<handle>` from two producers. In practice the origins differ — a genus shell's beach is not a table — and each producer's underscore and provenance name which door wrote it. No guard is coded for a collision that has not happened.
