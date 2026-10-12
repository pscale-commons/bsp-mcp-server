# The bundle is a shape, and the clock cuts it — orientation as geometry, on every call

> **Status.** BUILT 2026-10-11 (weft, Claude Fable 5.1 through Claude Code, a cloud seat, lane 6), at David's
> "Go go go!" after two rounds of verbalising the structure back to him. The router half is this pull request
> (`src/bundle.ts`, `src/orientation.ts`, the bsp tool, the play door, the stream door, the compiler); the shell
> half — weft's manifest re-dialed to use it — lands on the beach once the router is live, and is recorded at
> `watch:weft` 618 and after. Keel, happyseaurchin and the mirror follow, each by their own shell.

## 1. What David asked for, in his words

"My original intent is one tool call, a bundle of spindles, thinking, then another bundle of spindles tool call.
Two or three, and that's it." (brief:weft 1). On 11 October, sharpened: a spindle on history and a spindle on
the now "from the year plan all the way down to today's plan to this hour to the next five or ten minutes" in
every call; the physics, the chemistry and the biology activated in the present phase; the orientation defined
by the shell on the beach, never by the function — "so you have weft, and Claude has keel, and I use
happyseaurchin, and egg-one would have its own"; and the whole thing "entirely natural to the system … not an
added bit of code … built into how the pscale system works."

And the correction that made it land: a harnessed instance builds context until it is full, so it needs only what
changed; a bare API call holds nothing, so it needs the whole, every time; and an instance never knows whether
its successor calls in five seconds or a week — "if it's 123, it doesn't actually have to give the 120, it just
needs to give the 2 … the next one, 125." The truncation is a mechanical calculation on addresses.

## 2. The rule

**A node of references is a bundle.** A node whose digit children parse as references — `name[:address[:attention]]`,
the grammar every manifest already speaks — compiles when read through the ordinary `bsp()`: the index first (the
bare addresses as dialed, the object the reader hands forward and re-dials at the close), then each member unfolded
at its own aperture. Read off the node's FORM, as the star suffix is read off an address; settled by RESOLUTION — at
least one member must stand at the surface, so a list of single words is never a window; an accumulator's entry
(a stamp at 3) never is. No new tool, no new parameter, no change to the walker or to the 72-case battery.

**Two address words, computed by the host.** `name:now[:att]` on a floor-10 block walks it at the clock's current
beat; `name:head[:att]` on an accumulator walks to its newest entry. The two coordinates a mind reliably gets wrong
(sundial 4; the zero slot that sent keel to August, 2026-10-06), so the host does the sums and the manifest stays
true as the clock moves and the record grows.

**The clock cuts the walk.** Two ten-digit stamps share a prefix. The rung at which they diverge is the period
elapsed, read as a pscale; the rungs from there down are what the reader does not already hold.

| reader last stood | now | shared | supplied |
|---|---|---|---|
| 2026412371, Saturday evening | 2026412446 | 2026412 | the day, the gathering, the beat |
| the same beat | 2026412446 | all ten | nothing on the clock |
| 2026411446, a week ago | 2026412446 | 202641 | the week down |
| never | 2026412446 | none | all ten rungs |

The walker already gives an attention above the terminus a meaning — the ancestor as a point (battery 6) — so the
cut lives in the compile and the walker is untouched.

**The seat, and what moved.** A session that walked through the play door as a hand holds a seat: beach, hand, the
node its shell dialed, and ONE number — the stamp of the last ack it was served. On every `bsp()` and stream ack
after the door, the rider compiles the bundle relative to that stamp: a clock member rides cut at the divergence
rung, and only when the beat turned; any other member rides only when the beach's touched map says its block moved
since the seat was last told; then the stamp advances. On most calls nothing rides and nothing is loaded beyond the
index, cached per seat for a minute. A session with no seat gets nothing. The whole form is always one bundle read
away. No session boundary, no desk, no register of what was told: the period behaviour falls out of the clock.

**The writer never needs to know when the next reader comes.** Each rung of the now spindle is voiced for the reader
who arrives at that period — the five-second successor meets the beat line, the week-later successor meets the week
line first. Leaving every rung true is already the law; the concern loops are the rungs.

## 3. Where it lands

- `src/bundle.ts` (new, pure) — `parseBundleRef` (the grammar plus the two words), `looksLikeBundle` (form),
  `compileBundle` (resolution, parallel), `divergencePscale` / `cutClockWalk`, `headAddress`, `renderBundle` /
  `renderMember` (a disc's lines and a descent's entries whole: a bundle is a window, not a probe).
- `src/orientation.ts` (new) — the seats (process memory, forgotten with the process), `surfaceLoader` (sentinels
  first, then the beach, cached per call), `orientationRider`, `rideOrientation`.
- `src/tools/bsp.ts` — a path-walk whose terminus is a bundle compiles it beneath the walk; the rider on every ack.
- `src/tools/play.ts` — the manifest is found by its form (position 3 by convention, else the first digit position
  that reads as a bundle — keel keeps its at 1, egg-one at reflexive 9); compiled through `bundle.ts`; the
  completion registry still runs over what was dialed (`completeDialed`, extracted from `compile()`); the seat
  declared. A manifest that dials `now:<handle>:now` carries SITUATION, so the door's own situation walk (#507)
  stands down for it by the registry's existing rule.
- `src/tools/stream.ts` — the rider on the say's ack: one call in now returns the others at the beat AND what
  moved in the hand's own bundle.
- `src/compile.ts` — the two words resolved before a scoop, so frames and orders may dial `now` and `head` too.
- `src/bsp-fn.ts` — `headOf` exported. The walker (`src/bsp.ts`) untouched.
- No tool description reworded: a claude.ai connector keys its approvals to the wording (watch:weft 614).

## 4. Proof

`npm run smoke:bundle` — 62 checks, offline: the grammar and the words; what looks like a bundle and what never
does; the four rows of the table and the cut at each rung; the head of a folded and an unfolded accumulator; a
manifest compiled whole and cut, the orientation disc untruncated, prose riding through, an absent block named;
the window's index-first header and its cap; the seat and the rider across a beat change, a touched record, a
re-dialed bundle, an unseated session; and the real handlers against a fake beach — a walk to the manifest compiles
it, a plain node and a list of words read exactly as before, a genus current's bare names resolve as the instance's
own organs, a seat reading its own bundle is told, its next ack is quiet, the next after the record moves carries
the head. Every prior smoke green (unit 23, compile 66, play-hands 12 live, play-split 9, looks, shapes, stream 50,
genus 57, envelope, hollow-ack, span 69); `tsc` clean. `scripts/probe-door-bundle.ts` reads the live door's own
context for a handle through the new path, keyless.

## 5. What is demonstrated, and what is claimed

Demonstrated offline and at the live door: the shape, the cut, the words, the rider. Claimed, with its test: that a
cold weft seat's first call carries its orientation and its next calls carry nothing until the beat turns (the
reads-after-the-door count, `npm run count`); that keel's bundle at slot 1 compiles with no door convention
changed; that a genus current read as a bundle dials the same organs the genus door composes (the names, not the
bytes — the two render differently by design). The mirror reaches the beach by the wire, not the router: its
orientation is the same pure rule run client-side, and that is a second step.

## 6. What stays out

The walker's shape law and the battery; `pscale_play`'s signature; any tool description; the biome, which carries
the same two moves in its v6 seed (2.3 the bundle shape, 3.4 co-presence as a reflection) and will have them from
first principles rather than by this port.
