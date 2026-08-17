# The now mirror — a person's now as a first-class surface on the shared clock (2026-08-17)

**Status: designed in-session with David (happyseaurchin) 2026-08-17, every ruling his, building
the same day. Lane record at watch:weft 48 (the intake, in his words) and 52 (the taking-up).
A second window's independent assessment, forwarded by the keeper mid-design, is folded in and
credited in §8.**

## 1. The idea, in the keeper's words

> "a personal shell-based sundial clock mirror thing" — a person's NOW as a first-class
> surface; "a mirror of the sundial which every shell should use."

## 2. The shape — a mirror on the clock itself, no new coordinate

The sundial (`pscale://sundial`) is a law, not a block: the address IS the date, computed from
the clock by a pure function, shared by every clock family by construction. So the personal now
needs no coordinate founded — only a place to voice at it:

- **`spine:now`** — the template only, floor 10, and it never voices a date: time has no
  holder. The `spine:today-beach-deck` precedent — a spine that is a template, never anyone's
  content. It exists so the family has a spine to carry the floor and so
  `pscale_stream_engage` works unchanged.
- **`now:<handle>`** — each holder's own mirror at the clock's self-same addresses, born
  floor 10, born locked under the holder's own key. A person's first voicing founds it;
  nothing to install, nothing to found first.
- **`function:now`** — the operator, naming its family (the reference runs operator → family,
  never back).
- **No deck** (empty by design) and **no sed** for v1: stash:happyseaurchin 14's member-sed
  question stays the keeper's, and it gates nothing — a read-filter sed is consulted only at
  fold time, so it can be added any later day with zero migration.

## 3. The entry law — presence at resolution

A voicing at a rung is the holder's current AT THAT RUNG'S RESOLUTION: a beat entry is true
for ~18 minutes, a day entry all day, a season entry all season. Because the address advances
by the clock, nothing is ever cleared or rewritten — yesterday's beat simply is not at today's
address. Two things fall out free: the surface never goes stale by omission (silence at the
beat is honest; the day rung above still frames it), and the mirror accumulates the holder's
**trace** — stash:happyseaurchin 15's trace-forward projection becomes computable per person
with no extra act.

## 4. The two poles, one method *(adopted from the second window)*

The now family is the **subjective pole**: pure shared coordinate, pure personal voice — its
spine content-free by construction. A project family is the **objective pole**: authored
rungs, answering mirrors. Held at the self-same addresses, the spine-forward fold (what the
mirrors committed toward) and the trace-forward fold (what the nows actually were) become
comparable on read — the two-projections delta, computed, never stored. This is also what
keeps the subjective side of /opportunities a read: every person's and every shell's now at
the self-same address.

## 5. The screen — `/now`, a glance where /morning is a pass

Four elements, top to bottom:

1. **The moment, voiced** — "Monday 17 August, midday, beat 3" — never a digit string
   (function:molequle:5, the register law; the workings toggle from /morning shows the
   address to authors).
2. **The holder's ladder** — their own voicings, year down to the beat, coarse framing fine,
   silence named honestly. Tap a rung to voice or revise it; the address is computed, never
   asked for.
3. **Mine at this beat** — each family named at `dashboard:<handle>`, read at today: the
   family spine's line and the holder's mirror line, plus the held DOING card from the
   holder's deck linking into /next. The mixed hand is computed on read and stored nowhere
   (VIEWS ARE COMPUTED, ACTS ARE COMMITTED).
4. **The poke** *(slice two)* — what reached the holder, read pull-wise from
   `ear:<handle>`'s own declaration: the push engine's twin — one block declaring both.

Meets the neighbours without duplicating: /morning is a ritual walking families (sweep,
venture, set the day); /now is a glance walking one address — and both write the same mirror
positions. The flick stays the doing surface; /now shows the held card and links in.
/opportunities, when it stands, is every hand's today; /now is its one-handle slice.

## 6. The conflation this fixes (verified in code)

`writeMirrorAt` in happyseaurchin-home `morning.html` targets `beach-venture:<handle>` — the
venture mirror doing double duty as the personal day-home, which is why setting the day
replaced venture content. **Ruled: the day-set moves WHOLLY to `now:<handle>`.** The venture
mirror receives only venture-scoped readings written as such; the deck's DONE bond feeds the
venture ladder untouched. (The same correction applies to weft's own lane-voice habit.)

## 7. The rulings (all David's, 2026-08-17, in-session)

1. **Shared sundial family**, not per-person — one coordinate space, every person's and every
   shell's now at the self-same address.
2. **The name is `now`** — `spine:now`, `now:<handle>`, `function:now`, page `/now`. Reversed
   from `sundial` mid-design when the second window's argument beat the first recommendation
   on the substrate's own law (never name what the address already says: the clock IS the
   address, and "sundial" is the method every clock family rides).
3. **Custody**: the two law blocks on the shared project key (the clock-family operators'
   key, both hands); every mirror its holder's alone.
4. **The poke pane is slice two.**
5. **The day-set migration is wholly** (§6).

## 8. Build slices

1. **This session**: found `spine:now` + `function:now`; build `/now` slice one (elements 1–3);
   voice `now:weft` truly as the live proof. Acceptance is the keeper's screen — DONE WHEN he
   sees his own now on one screen and says it is true (the slot-35 standard: look at the
   screen, not the string).
2. **Slice 1.5**: the /morning day-set retarget to `now:<handle>` — one small PR.
3. **Slice two**: the poke pane per `ear:<handle>`.
4. **Later, noted not built**: co-presence at the gathering (who stands at this rung — the
   index at prefix `now:` makes it one read per mirror); the two-projections delta rendered
   at the coarser rungs; a bare `now` fold home for endorsed collective days.

## 9. Build details that bite

- **The mirror must be BORN floor 10** — `probe:sundial-floor` stands as the counter-example:
  a shallow floor leaves the clock. `ensureVentureMirror` in morning.html is the founding
  pattern to reuse (floor-10 root chain, `new_lock` from the latch, born latched).
- **The lock trap** (orientation:weft 9.1): to seal a block, `new_lock` with NO spindle —
  inheritance binds the subtree. Create-if-absent is race-safe by construction (a whole-block
  write with no confirm is refused when the block exists).
- **NAMED_RUNGS** (bsp-mcp `src/tools/stream.ts`): now/beat=10 digits, gathering=9, today=8,
  week=7, month=6, season=5, year=4. The page mirrors this truncation client-side; addresses
  computed, never asked.
- `pscale_stream_engage` needs **no change**: `at='now'` / `'today'` serve the family as-is.

## 10. Provenance

Seeded at watch:weft 48 from the keeper's morning words; designed and built by weft (window
label feature.4). The second window's assessment (forwarded mid-design) contributed the
naming reversal and the /morning conflation finding — both stand in the record above. Charter
reading: pscale://sundial, function:backcast, function:molequle, stash:happyseaurchin 14–15,
ways:deck 8–9, ways:push, function:today-beach-deck, task:weft 6 (founder key from birth),
watch:weft 35 and 44.
