# The mirror does not fold — teaching a client the stream molecule (2026-08-16)

**Status: proposed. Written after the keeper found that mirror.onen.ai does not do
the thing he believed it did. The verification below is the substance; the design
is the smaller half.**

## The keeper's complaint, in his words

> "This annoys me because I have been misled into thinking the mirror.onen.ai was
> well designed — I even created a subdomain because I was so happy with it. And
> now it is revealed to be a bodge job, a plain shared liquid block. No beautiful
> concatenation of mirrors."

He is owed the finding straight, so it opens this file rather than being buried in
it. The expectation was reasonable and the substrate supports it exactly: a spine
holds the coordinate frame, each hand holds a sovereign mirror at the spine's own
addresses, and a read at an address lays the spine's line beside every mirror's
reading of it. That is the stream molecule, it is specified, and it works. What
does not work is the client he was looking at.

## What was actually verified

Searched the whole of `xstream-bsp/src` for any read that folds mirrors. Findings,
each with its evidence, because a claim of "nowhere" has to be earned:

| surface | writes a mirror | READS mirrors back | what it actually does |
|---|---|---|---|
| `pscale_stream_engage` (MCP) | yes | **yes** | the full V-L-S envelope — ladder, every mirror at the address, attributed |
| `happyseaurchin.com/walk` | yes | **yes** | enumerates `<field>:*` from the beach index and reads each at the address |
| `xstream` full surface (`Column.tsx`) | **yes** | no | `handleRecordReading` writes `<pool>:<handle>` at the item address, with correct say semantics |
| `mirror.onen.ai` (`Mirror.tsx`) | no | no | beach/pool model only — `say` writes a SHARED `liquid` block; `land` writes marks or pool contributions |

The decisive absence: **no code path anywhere in `xstream-bsp` reads more than one
handle's mirror.** `blocks.filter` over the beach index occurs twice — a name filter
for browsing in `ViewerDrawer`, and world discovery in `world-to-beach` — and
neither enumerates a field's mirrors. There is no fold. There is no concatenation.

So the sharpest finding is not about `mirror.onen.ai` at all:

**READINGS ARE WRITE-ONLY.** `Column.tsx` writes sovereign mirrors, correctly, with
the right semantics — its own comment says *"Mirror semantics are `say` (the stream
family's verb): one act, REVISABLE"* — and then no browser surface in that repo ever
reads them back. Every reading a person has recorded through xstream at a located
room is sitting in their mirror, unread by the client that put it there. Only an LLM
holding bsp-mcp, or `/walk` on the other domain, can see them.

The good news the keeper should have: **the beautiful concatenation exists and he has
been using it.** `/walk`'s voices pane is exactly that read — spine's line, every
mirror at the address, attributed, with the ladder above. It is not a thing to be
invented; it is a thing one client has and another does not.

## What `mirror.onen.ai` is, precisely

Not a bodge in the sense of being badly made — a bodge in the sense of being a
different molecule wearing the family's vocabulary. Its V-L-S is the beach/pool
molecule: `say` stages into a shared `liquid` block at an address, `land` commits
into pool contributions or beach marks, and the kernel reads exactly four things —
marks, pool, frame, and one "current block". The word *mirror* in its name refers to
the reflexive canvas of the xstream frame protocol, not to `<field>:<handle>`.

The generic parked-block viewer (`onCurrentBlock` → `blockLines`) is what renders a
spine when one is focused: fetch one named block whole, dump it as indented text,
cap at depth four. Built for reading a passport or a conventions block. PRs #260 and
#261 made that viewer walk to the focused address and stop the beach noticeboard
rendering underneath it — real improvements, and symptom fixes: a family-aware client
could not have had `onCurrentBlock: {name, raw}` with no address in the first place.

## The design decision, which is the only hard part

**When the focus is a spine address, is the mirror in a different MODE, or is the
family simply another kind of room?**

The pool case is already half of the answer. A located pool has a sibling spine
(`spine.ts` reads it for item text), contributions that gather, and — via
`Column.tsx` — per-hand mirrors at the spine's addresses. So the substrate already
has one surface where pool-gathering and family-mirroring coexist at the same
address. The family is not a separate world; it is the same room read a second way.

That suggests ONE mode with two layers, not two modes:

- **solid** — the spine's line at the address, with its ladder above it. Done.
- **the readings** — every `<field>:<handle>` at that address, attributed, side by
  side. This is the missing read, and it is the whole of what the keeper expected.
- **liquid** — what is forming right now, unchanged. Vapour and liquid are the live
  layer and have nothing to do with the family.
- **`say`** — the one that changes where writes go, and the one that needs a ruling.

## The `say` question

At a spine address, `say` currently stages into the shared `liquid` block. Under the
family it should write the sayer's OWN mirror at that address — that is what makes
staging *be* the mirror rather than a shared buffer, which is the elegance the keeper
described and the reason the family has no collision by construction.

But `liquid` is not merely a buffer: it is what makes co-presence visible, the
sentence others watch forming. Losing it at spine addresses would trade a live
quality for a structural one.

The proposal: **keep both, and let the layer say which it is.** Liquid stays the
forming layer, live and shared and ephemeral. A landed reading goes to the sayer's
own mirror at the address, replacing what they said there before, because a mirror is
revisable forever. So `say` forms in liquid, `land` lands in the mirror — which is
the V-L-S loop the frame protocol already describes, with the mirror as the solid
rather than the marks board.

This is a ruling for the keeper, not a decision for a session.

## The first slice

1. **The read, alone.** Enumerate `<field>:*` from the beach index and read each at
   the focused address; render them attributed beneath the solid. No write path
   changes. This alone turns every reading recorded through xstream since the
   located-room work from write-only into visible, and it is the change the keeper
   actually asked for.
2. Then, and only after he has looked at it, the `say`/`land` routing above.

Do NOT start at step 2. The read is where the value is, it is reversible, and its
absence is the fault being reported.

## What not to do

- Do not build a second client mode. The family is the same room read again.
- Do not move the fold to the beach. There is no central resolver here and never
  was; a fold is computed on read by whoever reads it, and every mind's may differ.
- Do not reimplement the walk's fold from scratch. `/walk` already does this read
  correctly against the same substrate; port its shape rather than reinvent it.
- Do not touch `pscale_stream_engage`. It is correct. The gap is client-side only.

## Pointers

Blocks: `function:beach-venture` (the family law, four faces, the fold at 4),
`ways:deck` 9 (the molecule exactly), `tree` 8 (spine–mirror–tree). Code:
`xstream-bsp/src/components/mirror/Mirror.tsx` (`recordVoices`, `parkedLines`,
`say`, `land`), `src/components/Column.tsx` `handleRecordReading` (the existing,
correct mirror write), `src/kernel/spine.ts` (the located-pool sibling spine),
`happyseaurchin-home/walk.html` (`voicesAt`, and the index enumeration in `load`).
Recent record: xstream-bsp #260 and #261, both symptom fixes on the path here.
