# The map is not an accumulator — a place is minted by writing its node at a free digit, never by append (2026-09-27)

**Status**: amendment to `function:earth` 7.2, proposal-first per
[2026-08-05-law-writes-get-their-record](2026-08-05-law-writes-get-their-record.md). The standing
`function:earth` is copied whole to `archive:function:earth:2026-09-27` before 7.2 is re-voiced.
The repair of the map (§2) is already done: it is data, not law.
**Prompted by**: David, 2026-09-27, at happyseaurchin.com/globe/#3,1,1,8,1 — *"this is how far i
get to matthew's address on the globe — a BIG UGLY NUMBER!!!"* The finer ground under Northampton
offered one chip, a date, and its hover gave that "place" the address 31181300000.
**Lane**: watch:weft 469 (tidying.16).

## 1. What happened

The earth pass mints a place by `append` beneath the deepest rung that contains it (7.2). The beach
dates every appended **object** at its position 3 when the object has not dated itself — the
recency law for accumulators (block-conventions:9; `stampAppendTimestamp` in the beach handler).
7.2 also requires, rightly, that a rung's voicing be written as the whole node, so the pass appended
objects, and every minted rung came back carrying a date at digit 3. On the map a digit is a place.
Four dates stood as places:

| rung | walk | minted |
|---|---|---|
| Madhya Pradesh | 3,2,1,2 | 2026-09-17 |
| Bhopal | 3,2,1,2,1 | 2026-09-17 |
| East Midlands | 3,1,1,8 | 2026-09-26 |
| Northampton | 3,1,1,8,1 | 2026-09-26 |

The globe lists a rung's digits as its finer ground, so it offered each date as a place. A read
through `bsp()` hid the fault: the formatter folds a position-3 date into the line as the node's
stamp, so the walk looked clean.

The second hazard is worse and has not fired yet. An append beneath a node whose 1-9 are all taken
**supernests** that node (the accumulator law,
[2026-06-03-supernest-floor-growth-and-positional-ladder](2026-06-03-supernest-floor-growth-and-positional-ladder.md)): its nine move under its underscore,
and every address beneath it changes. The map's first law is that a decided address is never
renumbered. The United Kingdom (3,1,1) already holds eight of its nine.

## 2. The repair (done 2026-09-27, 14:18Z)

East Midlands and Madhya Pradesh were each re-written as one whole node carrying its own line and
its one town, without the dates. A diff of `spatial:earth` before and after shows the four dates gone
and nothing else changed. `geo:earth` and `census:earth` carried none. The globe at 3,1,1,8,1 now
shows Northampton with no finer ground.

## 3. The amendment to 7.2

Only the mechanism changes; every other sentence of 7.2 stands verbatim.

**Before**: *"… walk spatial:earth to the deepest existing rung that contains it and add the thin
ladder beneath by append under that node — world rungs only (continent, country, region, town) from
the world's own knowledge, each at the pscale its population sets, skipped scales as zero rungs, the
digit allocated on append and never renumbered, a digit already taken never overwritten."*

**After**: *"… walk spatial:earth to the deepest existing rung that contains it and add the thin
ladder beneath as ONE write of the whole new node at the lowest digit that rung leaves free — never by
append, because the map is not an accumulator: an append dates an object at its 3, which on the map
is a place (the dates of 2026-09-17 and 2026-09-26 stood as finer ground under Madhya Pradesh,
Bhopal, the East Midlands and Northampton until 2026-09-27), and at a rung's tenth arrival it
supernests the rung and renumbers everything beneath. World rungs only (continent, country, region,
town) from the world's own knowledge, each at the pscale its population sets, skipped scales as zero
rungs, the digit chosen by arrival and never renumbered, a digit already taken never overwritten; a
rung whose nine digits are all taken mints nothing, and the pass names it in its log for a ruling."*

One keeper writes the map, so allocation needs no atomic append: read the rung's ring, take the
lowest free digit, write the node.

## 4. The pass

`weft-daily-wake` (weft's own scheduled wake) carries the same instruction at its earth pass, so
the evening pass mints by a node write from today.

## 5. Open, for a ruling when it arrives

When a rung needs a tenth child, what does the map do? It does not arise today: the United Kingdom
has one digit free. Until it is ruled, the pass mints nothing there and says so.
