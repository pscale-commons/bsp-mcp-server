# The now runs to the second — a say lands at its instant, and the clock cuts a range (2026-10-12)

**Status**: BUILT the same day at David's "go ahead and build it" (merged as the proposal in #528; the build is the
PR that follows it). Lane 6 (weft, Claude Code, a cloud session).
The record is watch:weft 618 and the entries beneath it. Builds on `2026-10-11-the-bundle-is-a-shape-and-the-clock-cuts-it.md`
(#519, #520, #522, #524).
**Prompted by**: David, 2026-10-12, after the live within-the-beat check:

> "A beat is about 20 mins according to the current set up of sundial clock. Whereas I thought the reflective
> thing is operating within seconds...?"
> "can't we go into negative pscale time scales...? pscale -3 is a second"

## 1. What the law already holds

The sundial (`pscale://sundial` 1.2 and 2) runs base ten above the year and below the second, and nine-fold between:
the gathering at 2h40m, the beat at 17.8 minutes, then **finer runs after the decimal — −1 the minute (~2 minutes),
−2 the breath (~13 seconds), −3 the second (~1.5 seconds)** — "arriving at exactly the rung the law names as its lower
boundary, from arithmetic that knows nothing of the second". `src/temporal.ts` carries them as `FINE_RUNGS`, named
and sized, "rendered, never addressed by the ten-digit form; they are the decimals after it". The walker takes a
single decimal anchored at the floor, so `2026412576.253` is already a legal address: beat 6, minute 2, breath 5,
second 3. Nothing below the beat has been written to yet: every say at `now` lands at the beat, and a hand's lanes
take a digit beneath it (`now.6`) so that sessions never write over one another.

## 2. What the beat-bound now cannot do

The rider walks a `now` member at the current beat and cuts the walk at the rung that changed (the prefix the two
stamps share). A line said late in beat 4 and read early in beat 5 is not in the walk the reader receives: the cut
delivers beat 5, empty, though the touched map says the block moved (§7 of the bundle proposal). The lane digit is a
device for concurrency inside a beat, and it collides — on 12 October two weft sessions held digit 6. And "live for
one beat's width" is a window the clock fixed, not the reader's own gap.

## 3. The change — three moves, all address arithmetic

- **A say at `now` lands at its instant.** `momentToAddress(when, fine)` appends the minute, breath and second as
  decimals; `pscale_stream_engage(at='now')` writes the line at the thirteen-digit address. Two sessions collide only
  within the same second and a half, and a collision appends beneath that second (the beach allocates the slot
  atomically), so nothing is ever written over. The lane form `now.<digit>` stays accepted while any lane uses it;
  the law names the second as the place a line lands.
- **A seat's stamp is the second too.** The rider keeps one thirteen-digit number per seat, as now.
- **The cut becomes a range, not a prefix.** "What moved since" is every node on the clock strictly after the
  since-address up to now: at each rung from the divergence down, the tail of since's own subtree (the siblings
  after its digit), the whole subtrees between, and now's own path. A reader whose stamp is inside beat 4 and who
  reads in beat 6 receives the end of beat 4, the whole of beat 5 and the start of beat 6 — exactly what landed while
  it was away, to the second, and nothing twice. David's rule of 11 October is the same rule run one rung at a time:
  "if it's 123, it doesn't have to give the 120, just the 2 … next 125" — and 124 in between, since the reader was away.

The touched map then serves only the members that are not on the clock. The render says what it delivers:
"(since 2026412574.251 — Monday 12 October, late afternoon (beat 4), 16:55 — what landed on the clock)".

## 4. What it removes

The same-beat constraint on any test or any reading; the lane digit as a concurrency device; the empty "(no
content)" beat line that rides at every beat change; and, for clock members, the index read.

## 5. What it costs

Addresses three digits longer beneath the beat; `addressToSpan`, `voiceAddress` and the relation labels extended to
the fine rungs (the names exist); one new pure function for the range; the stream's `now` and the door's `now` word
reading the fine address. The walker untouched. A clock block gains at most one node per say, as now.

## 6. Proof

Offline: the fine address round-trips through `addressToSpan`; the range cut on a synthetic clock — same second
(nothing), within a beat, across a beat edge, across a day, never here (the whole); two sessions in one second land
beneath it. Live: David says at now whenever he likes; weft's next read carries the line; no timing instructions.

## 7. What stays out

The ten-digit stamp in every footer and every record stays the beat: the fine digits are the decimals after it, as the
sundial says, and nothing coarser than a say needs them. The bundle shape, the words `now` and `head`, and the touched
filter for other members are unchanged.
