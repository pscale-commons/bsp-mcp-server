# The census aspect — how a million standpoints show on one card

**Date** 2026-09-08 · **Lane** the standpoint lane (watch:weft 255, 256) · **Status** PROPOSAL, David's to rule
**Follows** [2026-09-08-the-earth-pass.md](2026-09-08-the-earth-pass.md) · **Answers** David, this morning:
*"imagine thousands of people, how is that going to be managed? Or if there is a million users, how is
this displayed? Is there a grouping/count at different pscale — and only when the user taps and goes
deeper until it hits a threshold and then shows the users as dots?"*

The short answer is yes, and the reason it is yes is that nothing has to be invented: **the address is
already the grouping key.** What follows is what it costs today, the one block that fixes it, and the
single wire question it raises.

---

## 1 · What the page does today, exactly

`/globe` and `/earth` both resolve people the same way ([globe.html](https://github.com/happyseaurchin/happyseaurchin-home/blob/main/globe.html) `loadFolk`):

```js
const names = (indexBlocks || []).filter(n => n.startsWith('passport:'));
await Promise.all(names.map(async name => {
  const p = await readBlock(name);                          // ← one GET per person
  const m = JSON.stringify(p).match(/spatial:earth:([0-9]+)/);
  ...
}));
```

Then the card lists **everyone** under the open address, and `buildMarkers` puts **one DOM marker per
person** on the sphere.

Three walls, and they are independent:

| | today (3 placed) | 1,000 | 1,000,000 |
|---|---|---|---|
| **boot reads** | 4 blocks + 3 passports | 4 + **1,000 GETs** — browsers run ~6 per origin, so ~7 s of pure fetch before the first dot | impossible |
| **markers** | 3 DOM nodes | 1,000 DOM nodes, repositioned every frame | impossible |
| **the card** | 3 rows | 1,000 rows in a 390 px panel | impossible |

A fourth wall sits behind them: `spatial:earth`, `identity:earth` and `geo:earth` are each read **whole**.
At three people that is nothing. At a million standpoints the spine alone is tens of thousands of nodes.

---

## 2 · The turn

An ordinary map clusters by pixel distance: build a quadtree, recompute per zoom level, hope the
groupings mean something. **Here the grouping already exists and already means something.** A count at
pscale 7 is a prefix count of an address. The rung *is* the cluster level — precomputed, semantic,
stable across sessions, and identical for every reader of the same beach.

So the page should never learn about people one at a time. It should read a fold that is already
grouped by address — and that fold is one more aspect over the spine everything else already shares:

> `spatial:earth` the words · `geo:earth` the anchors · `identity:earth` the holds · **`census:earth` the tally**

## 3 · The block

`geo:earth` set the precedent an aspect block needs: a machine-readable underscore whose *root* declares
the format (`"lat,lon · latS,latN,lonW,lonE"`). The census follows it exactly.

At every address of `spatial:earth` that anyone stands at or under:

```
census:earth : 32111000000   _  =  "1204 · 4 · 2 · Ayush, meera"
                                     │      │   │   └ the roster, present only while it is short
                                     │      │   └ grounds below this one that carry anyone
                                     │      └ standing at exactly this rung
                                     └ standing at or under this address
```

**The roster is present only while the count is small** — say `under ≤ 12`. And that one condition is
the whole privacy behaviour, arrived at by counting rather than by rule:

- with three people on the beach, Earth's own census carries all three names, which is today's page
  unchanged and obviously right;
- with a million, Earth carries a number, Asia carries a number, India carries a number — and the names
  begin to exist somewhere down around the town.

**You are anonymous in a crowd and named in a village.** That is how standing in a real place already
works, and it wants no policy to enforce it: the map cannot leak a name it does not hold. It also holds
the disclosure grain honestly — a person is named at the rung *they* chose, and above it they are one of
a count, because that is literally all the block records.

## 4 · What the page becomes

```
open the page      →  spatial + geo + census at the current address        (4 reads, constant)
tap a child rung   →  the census node for that rung                        (1 read)
count ≤ threshold  →  the roster is right there in the underscore          (0 reads)
tap a person       →  their passport, because now you want the person      (1 read)
```

Boot cost stops depending on how many people exist. Markers become **one per census node in view**,
sized by its count, with individual folk markers only where the roster exists — so markers are bounded
by places on screen, not by people on Earth.

No clustering library. MapLibre's own `cluster: true` is distance-based and would fight the address;
supercluster would recompute per zoom what the rung already knows. The adopted library is already
enough: DOM markers over `maplibre-gl`, one per node, exactly as now.

## 5 · Who pays

The fold is the keeper's daily pass ([function:earth 7](https://earth.beach.happyseaurchin.com/.well-known/pscale-beach?block=function:earth), wake:weft 6.7) — it already reads every passport and
every mirror, so the census is a by-product of a pass that runs anyway, not a new system.

O(N) once a day is still O(N). Two things make it O(changed):

**The index carries `touched`.** Verified on the wire this sitting — the earth beach's own underscore
says it: *"touched maps each block to when it last changed — fetch only what moved"*. A pass reads only
the passports touched since it last ran. Everything else it already knows.

**And a million people are not one beach.** Each beach folds its own census and publishes it at its own
surface; the globe reads one census per beach it knows, and a beach that never answers costs one failed
fetch. That is the project's own design principle doing its job — the storage cost lands on whoever
wanted the beach.

## 6 · The one substrate question

A census node's read returns its **whole subtree**. Reading Asia to draw its children brings back every
town in Asia. The page needs one rung down, not everything below.

`GET ?block=&spindle=` walks to a node; there is no depth cap on the wire. The clean fix is a `pscale`
or `depth` parameter on the beach GET, mirroring the attention coordinate `bsp()` already takes — the
selection shape is `path-walk+descent` and the walker computes it today; only the wire cannot ask for it.

That is a `pscale-beach` change, and it is the only thing in this proposal that is not already possible.
Recorded as a question, not a decision.

## 7 · What this does not change

- **No new primitive.** Twelve stays twelve. The census is a block, the fold is a `bsp()` write.
- **No new convention.** It is the fourth aspect over a spine that already carries three.
- **Nothing a person owns.** The census is derived, wholly, from passports and mirrors their holders
  wrote. Deleting it loses nothing; the next pass rebuilds it.
- **The page's law is unchanged.** `function:earth` 5 still rules where a standpoint shows: *the globe
  and the filter, never a posted line.* A count is not a posted line, and a roster appears only at the
  grain its people disclosed.

## 8 · Standing gaps this sitting found, beside the design

1. **Nothing fires the earth pass.** `wake:weft` 6.7 specifies it in full and it ran once by hand today,
   but neither scheduled task (`weft-daily-wake`, `weft-morning-brief`) references it. A specified organ
   dialed by nothing — the orphan bond-failure at orientation:weft 8.2. Wiring it is one edit to a local
   `SKILL.md`, and it is David's word, because the pass speaks to other people in their own parlours,
   daily, unattended.
2. **The last mile of the loop is unwalked.** `passport:JulieJ` position 3 reads *"Stands in a house, in
   a town, in north Birmingham."* and `passport:Ayush` reads *"Currently living in his house in Pune,
   India."* — both name a place the map now holds, neither carries an address, so both read *"place
   untold"*. The reply that closes this is already in each parlour. The page must NOT guess from the
   prose: `function:earth` 6 warns exactly against the name-match misread, and the address is the
   contract. David's own line carries both forms and is the shape to aim at.
3. **Labels collide at coarse rungs** — visible on the live globe where Montenegro and its neighbours
   overlap. The census fixes this incidentally, by drawing one labelled node per rung instead of one per
   person, but it is worth naming as its own small thing.

## 9 · Provenance

Asked by David 2026-09-08 midday in the globe.1 window, from the intake at watch:weft 255. Written by
weft against the live code and the live wire: `loadFolk` and `buildMarkers` read in
[happyseaurchin-home](https://github.com/happyseaurchin/happyseaurchin-home) `globe.html`; the `touched`
field confirmed by fetching `earth.beach.happyseaurchin.com/.well-known/pscale-beach`; the three passport
shapes read at the beach. Candidate clauses stand in weft's mirror, `function:earth:weft`, per tree:5.1 —
the fold is the diff, adoption is the keeper's. Nothing in this proposal has been built.
