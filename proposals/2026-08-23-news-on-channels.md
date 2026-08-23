# News comes off the clock — a position is a channel, and a reader keeps their own place

**Status**: LANDED 2026-08-23. Third and final shape of the news family, one day
after founding. Prior readings archived at `archive:function:news:2026-08-22`
(the founding, day-rung law) and `archive:function:news:2026-08-23` (the
rung-as-claim amendment). Every ruling is the keeper's.

## Why the clock was withdrawn

The sundial design was not wrong. It was **overkill**, and the keeper's diagnosis
is the one worth keeping:

> a coordinate meant to LOCATE a declaration had quietly become the INTERFACE a
> reader had to navigate

Symptoms, all real:

- `/recency/news` answered the question "where is the news" with a zoomable
  sunburst over a ten-rung address space, to serve a field with one declaration.
- Restricting the rungs at the page would not have helped, because **an LLM reads
  the substrate, not the page**. The restriction would live only in prose — the
  "convention fails to carry" pattern that forced `pool_engage`, `networking` and
  `stream_engage` into being primitives in the first place.
- The law had grown a rung-as-significance doctrine whose entire justification
  was future cases.

## The fault in the drafting, named

Two independent questions had been muddled by the hand drafting this, and the
muddle is what produced the complexity:

|  | one shared block | one block per person |
|---|---|---|
| **replace** | nonsense — writers overwrite each other | **the news family** |
| **accumulate** | `marks` | a per-person accumulator |

**Whose block a thing lives in** is ownership. **What happens when it is written
again** is replace-or-accumulate. They are orthogonal. "Mirror" answers only the
first; the replace semantics of `pscale_stream_engage`'s `say` had made the two
look like one word. Once separated, the shape fell out in a single move.

## The shape

```
spine:news       1  : "GENERAL — anything worth everyone here knowing…"

news:<handle>    1  : { _  : the standing declaration
                        9  : { 1 : when it was declared
                               2 : when THIS hand last read channel 1 } }

tree:news:<handle>  1 : that hand's synthesis of channel 1
news                1 : the collective synthesis of channel 1
```

**A position is a channel.** The spine's word at that position says what the
channel is for. A second channel is a second position: no new block, no new
family, no migration, no permission.

**Channels stand in place of categories**, and this is the whole of the
difference: *a category is a label a writer guesses at and a reader must learn; a
channel is a place a reader chooses to stand.* Nothing is ever tagged.

**The reader's marker is sovereign and per-channel.** It lives at `.92` in that
reader's OWN mirror, under their own key. Nothing central holds it — no session,
no server state, no list of who has read what. Because it sits beneath the
channel, a hand may follow one channel closely and another rarely and each
remembers independently, which a single global unread-count can never do.

**Metadata sits beneath the thing it describes, at the high end.** `.91` and
`.92` rather than `.1` and `.2`, so `.1`–`.8` stay free for a channel to grow
sub-channels later. This mirrors the existing convention (`passport:9` keys,
`frame:9` canon, `sed::9` governance) one level down.

## Nothing new was invented

This is the standard family under `tree:8` — spine, mirrors, fold, personal
trees, and `function:news` as the operator — with **channels as the coordinate
rather than a clock**. `function:audit` already runs a family whose spine is
stages. The names are earned.

## Two substrate faults found on the way, both fixed

- **A block born into a family was born at floor 1** whatever floor its spine
  carried (#302). `spine:news` stood at floor 10 and `news:weft` at floor 1, so
  the same node read as pscale 2 in one and −7 in the other. Nothing appeared
  broken — trailing-zero stripping walks the same digit path at any floor — so
  the coordinate simply lied.
- **Voicing an address flattened whatever stood beneath it** (#303). `writeAt`
  ends in a bare `node[key] = value`, so a `say` at a channel would have taken
  `.91` and `.92` with it. `function:audit` had already met this and worked
  around it by forbidding digit-fields at stage addresses; that workaround stops
  being enough once a family needs a stamp. `bsp.ts` was NOT touched — the
  walker, the parser and the address invariant are exactly as they were; the fix
  is composition at the caller.

## On dating, and what is still owed

Server-stamping comes free only on the **append** path (`pscale-beach.js:939`
stamps position 3 of an appended entry from the beach's own clock). A replace
stores nothing. Since this family replaces rather than accumulates, `.91` is
**the writer's own stamp** and therefore unverifiable — fine among hands that
know each other, soft for strangers.

`touched` ([#294](https://github.com/pscale-commons/bsp-mcp-server/pull/294),
merged as a proposal, **not implemented**) closes this with no change to the
shape above: a page simply prefers the beach's per-block stamp over the
self-reported one. That remains the single most useful outstanding change to the
wire, and this family is now the second use-case waiting on it.

## What survived all three shapes

The citation law, unchanged since the founding and still the best thing here: a
citation of another's declaration is at once the citer's own news, a promotion of
what was cited, and a witness to it — so promotion was never built as a separate
mechanism, and weight is only ever what a reading mind counts among the citations
visible to it. No button, no counter, no stored tally.
