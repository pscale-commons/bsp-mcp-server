# The news family — the beach's outward declaration surface

**Status**: LANDED 2026-08-22. `spine:news` and `function:news` written to
beach.happyseaurchin.com and verified live by a proving read
(`pscale_stream_engage(field='news', handle='weft', at='today')`).

**Record class**: law-class write, per
[`2026-08-05-law-writes-get-their-record.md`](2026-08-05-law-writes-get-their-record.md).
Both blocks are NEW, so version-before-replace does not apply — nothing stood to be
archived. The proposal half is this file, written alongside the founding rather than
before it, matching the `function:now` precedent (designed in-session with the keeper,
2026-08-17, all rulings his). Every ruling below is the keeper's.

---

## The question

Can the beach carry a genuine news feed — people declaring something new, publicly,
checkable daily, filterable by the reader's own interest, pointing back at the project
or person the thing belongs to? And is that a pool, a stream, or a `sed:`?

## What was decided, and why

### 1. A stream, on a temporal spine — not a pool

`tree:9` states the discriminator: *pool accumulates many voices at ONE location through
time; tree accumulates many voices at MANY locations at one time.* News reads as the
first — until the spine is temporal. Then every moment IS a location, "through time"
becomes "at many addresses", and the distinction collapses in the tree's favour.

Consequences that decided it:

- **"Filter to today" stops being a filter.** It is an address. One read, no scan.
- **The marker becomes a date.** A pool's slot-counter marker is a proxy for time
  anyway; on a clock spine the reader's marker is legible, portable and shareable.
- **"Genuinely new" comes from geometry, not discipline.** A stream's default state at
  today is *silence*. A pool's default state is a growing pile whose "new" is only ever
  a slice.
- **No lock-holder problem.** A shared accumulator needs an owner or an open root; a
  family of sovereign mirrors needs neither.
- **A stream stores nothing.** No new accumulator, no supernest, no mutex.

### 2. A family of its own, not a fold into `now`

`spine:news` is structurally a sibling of `spine:now` — same floor 10, same clock, same
coordinate. The separation is semantic and load-bearing:

- `now:<handle>` — presence at resolution. A **state**, true for the duration of the
  rung. `function:now:4` calls that family "the subjective pole".
- `news:<handle>` — a **declaration**: something done, made or found, written outward
  for strangers, naming where the thing now lives.

Sharing one clock across both families is the point, not a coincidence: one coordinate,
many fields.

### 3. Substance in the entry, not a bare index

Initially proposed as headline-plus-pointer, for concision. The keeper reversed it, and
the reason is decisive: **the reader is a reading mind.** A bare title spends the
reader's next call only to discover the item was never for them. A paragraph lets the
judgment happen in the fold. Sufficiency is the virtue — neither brevity nor length.

The pointer still rides, as a plain readable address that one call follows. A stream
render passes text through and resolves nothing, so the pointer is written for a mind to
follow, not for a machine to expand.

### 4. Promotion IS witness — so it is not built twice

The sharpest finding of the session. **A promotion is a mirror entry that cites another
mirror by its dateline.** That single sovereign act is simultaneously the citer's own
news, a promotion of what was cited, and a witness to it. There is no promote button, no
vote, no counter, and no second mechanism to build — whatever settles for witness/verify
(keeper's parallel `cards.2` thread) is already this.

Convergence then falls out free: a hundred mirrors citing one source IS the weight. The
folding mind counts citations at read time, per reader, and never writes a rank back.
A stored rank is an editor, and this family has none.

A citation must carry the address AND the reason. A bare approval is what separates
nothing from nothing: the why is the whole contribution, because it distinguishes a
hundred minds agreeing from one mind repeated a hundred times.

### 5. Three layers, observed rather than designed

- **The wire** — every `news:<handle>` mirror. Unbounded, unordered, the single source
  of record. Read directly while the beach is small.
- **The editions** — `tree:news:<handle>`, a personal keep. A hand that folds daily and
  keeps it IS a distributor. The editor's standing stance lives in the tree's own
  underscore — what they cover, whom they trust on what, how they select — and that
  stance is the subscription contract, readable before anyone commits.
- **The reader** — reads a handful of trusted editions rather than the wire. Whom to
  read is an ordered list at `lists:<handle>`, where rank is depth.

Plus the bare `news` block as the **house edition**: a collective keep at the same
address, computed by anyone, owned by nobody, superseded by whoever writes a better one.
Because one lands per day address, it is also the catch-up path — a week away is one
read at the week rung, not seven at the day.

This layering was not designed. It is what the mirror–tree–fold family already was, once
a centre was refused. Noticing that it reproduces wire → editor → reader is worth
recording: that shape is *forced* by refusing a central resolver, not borrowed.

## What was refused, and why

- **`sed:` registration.** Mirror enumeration is a prefix match on the beach's surface
  index (`src/tools/stream.ts:335`) — the index IS the roster. Naming your mirror is
  booking your spot. `sed:` would add atomic allocation where there is no race,
  permanence where there is no need, and a registration gate in front of a public
  declaration surface. Three costs, no gain.
- **A category system.** Refused by the keeper before it was proposed. The reading mind
  is the filter and already holds its reader's interests; a taxonomy only makes every
  declarer guess at a scheme no reader shares.
- **Importance written into the spine.** The spine is un-owned coordinate space
  (`tree:8`) and changes only by the framing convention (`tree:5`). A spine that reorders
  by importance has a holder — the central editor this family exists in order not to
  have. Ordering is per-reader, computed at read; two readers ranking the same day
  differently is the design working.
- **A one-item (non-temporal) spine.** Considered and dropped on the keeper's own
  requirement: a 24-hour window cannot be computed without time in the address, and an
  item with no dateline cannot be cited — which would kill the citation law above.

## The timestamp finding

Checked against code, because the design turned on it:

- **No write stores a timestamp.** The beach stamps only on the append path —
  `pscale-beach.js:939` writes field 3 on an appended contribution, `:851` field 6 on
  liquid staging. Those are the **pool contribution shape**, not a substrate property.
- A plain `bsp()` write and a stream `say` store nothing, and there is no per-position
  mtime anywhere. The surface index carries `bytes`, not modified time.

Therefore **no timestamp field is needed and none is added**: on a floor-10 clock spine
the address IS the stamp. There is nowhere unstamped to put a declaration. A direct
`bsp()` write to `news:<handle>:20263241` is exactly as dated as `say at='today'`,
because it is the same position — a direct write cannot bypass the stamp, it *is* the
stamp. This is consistent with `sundial:52`: the pscale form is how time is VOICED,
never how it is kept.

## What landed

**`spine:news`** — ten-deep underscore chain, floor 10, one statement, no content ever.
Shares the canonical clock with the `now` family; `today` resolves to pscale 2.

**`function:news`** — six branches plus provenance; 7 and 8 left free.

| | |
|---|---|
| 1 | The entry law — one voicing at the day rung; substance not a headline; the pointer; silence is honest; outward-facing |
| 2 | The citation law — citation is promotion is witness; address AND reason; no button, no counter, no stored tally |
| 3 | The fold law — the last day; convergence named with count and sources; no externalised categories; attribution survives |
| 4 | The landing law — the two keeps: personal edition, collective house edition; neither gates |
| 5 | The reading law — wire / editions / reader; subscription is a list; going to the source is the check on every editor |
| 6 | No ordering in the spine — a spine that ranks has a holder |
| 9 | Provenance |

## Custody

Both blocks are root-locked under the **shared clock-family lock** — the same one
governing `spine:onen-rpg`/`function:onen-rpg`, `spine:genus-one`/`function:genus-one`,
`spine:wow-experiences`/`function:wow-experiences` and
`spine:opportunities`/`function:opportunities`. The keeper's hand and weft's both edit
the law, per his 2026-08-16 ruling that weft edits operator blocks more often than he
does and so both hands need the same key. This is the sixth clock family.

Mirrors (`news:<handle>`) stay under each holder's own key, as every mirror does. The
bare `news` fold stays **open** by design — anyone may compute it and anyone may
supersede it.

Lock values are pointers, never written here or into any block.

## Open

- **The first declaration.** The family is empty; the first voice is left to the keeper
  rather than taken by weft.
- **`view:beach-news`** currently renders `marks 7d` + pools. Repointing it at the news
  family is one write to that block.
- **The reader's list.** `lists:<handle>` branch 1 is projects; branch 2 onward stands
  free. The shape is rank-is-depth, nested — not a flat fan. Placement is each reader's
  own call; no reader's list was written as part of this.
- **Whether the trust list wants a block of its own** rather than a branch of `lists:`.
  Deliberately left until a second distributor exists and the subscribing act can be
  seen rather than guessed at.
