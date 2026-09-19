# Liquid holds nine — a tenth author is refused, never written into the first (2026-09-19)

**Status**: RULED and built. David, 2026-09-19: "refuse please." Found 2026-09-18 by weft
(lane rpg.6.group), confirmed by local simulation, not yet seen live. The router fix, the
law at block-conventions 4.5 and the smoke land together, as the field-2 settlement did
(`2026-08-02-liquid-field-2-settlement.md`, #229).

## 1. The fault

A liquid buffer (`liquid:pool:<room>`, block-conventions 4.5) is floor 1: one slot per
author, overwritten in place. When nine authors held slots 1-9 and a tenth staged through
`pscale_pool_engage submit`, `findNextSlot` returned `11` — the accumulator's next slot. At
floor 1 the floor imposes the decimal, so `11` is 1.1: field 1, the author, of entry 1. The
tenth slip replaced the first author's handle. The read-back checked only that field 1 of
whatever sat at `11` named the tenth author, which it did, so the router reported
`submitted: liquid slot 11`. Two voices were then lost at once: entry 1 read with no author
(the per-author dice skip it, a fold credits it to nobody), and the tenth voice sat where no
reader looks, since readers enumerate only slots no longer than the floor. A stranger's
withdraw at a full table took the same path. The character page (happyseaurchin-home #265)
and xstream's claim (xstream-bsp #237) already refused a tenth author; the router did not.

## 2. Why liquid stopped at nine — the record, so it is not re-derived

No one decided the limit; it is left over from earlier choices. In order:

1. **Designed to go past nine.** Block-conventions 4.5 gave liquid the marks ladder:
   1…9, then 11…99, then 111….
2. **2026-05-17: left out of the cure.** When the collision past nine was found in marks
   (slot 11 walks into entry 1's author field), liquid and presence were scoped out as
   "one-slot-per-author-per-address, overwrite — no supernest expansion needed at all"
   (`2026-05-17-marks-hidden-directory-shape.md`). That assumption is the only decision
   on record.
3. **2026-06-03: the cure lives in append.** Supernest as floor growth happens inside the
   beach's atomic append (`2026-06-03-supernest-floor-growth-and-positional-ladder.md`).
   Liquid never appends: a stage overwrites the author's own slot by a direct write, so it
   never grows. That proposal does not mention liquid.
4. **2026-08-09: the one mechanical objection.** Locks are per position and keyed by the
   first digit, so past nine two authors would share a lock — "parked by the keeper"
   (`2026-08-09-clearing-liquid.md` §4). It matters only if authors lock their own slots,
   and none do.
5. **2026-08-11 and 2026-09-17: the refusals.** xstream met the tenth-author corruption and
   refused rather than overwrite (#237); the page copied that cap (#265). Safety choices
   made inside fixes, not rulings.

David, 2026-09-18 (rpg.6.group): "…work on voice/stream so any number of people can be
combined. In track A (pool), the liquid might be limited, you need to check; but the point
is they are recorded…". The check is the list above. What binds today is that every writer
of liquid — the router, the page, xstream's mirror, xstream's genus animator — and the
beach's stage-vs-claim guard are built for floor 1, so growing the buffer at one door alone
would let the others write a new author over an absorbed voice. Ruling, 2026-09-19: refuse.
Any number of voices combine in a stream, each in its own mirror.

## 3. What changed

- **Router** (`src/tools/pool.ts`): a new author takes the first free place of the nine
  (`findFreeSlot`); with none free the stage is refused before anything is written, told
  plainly as "every place at the table is taken just now — nothing was written", never as
  a beach rejection. A birth's read-back now requires the slip at a place on the buffer's
  floor, not merely a slip that names the right author (`landedAtFloor`). A withdraw with no
  line of the author's to take back writes nothing, rather than holding a place with an
  empty slot.
- **Law** (block-conventions 4.5): the ladder past nine is struck. Nine places, the digits
  1-9 at the buffer's floor; a tenth author is refused; a place opens when the window closes
  or the buffer is cleared. 4.51's "keyed by presence digit where presence exists" is
  corrected to the author at field 1, the only key any door has used since 2026-07-23.
- **Smoke** (`smoke:pool-engage`, 120 → 145): the fault kept as the reason, the nine
  places, and `handlePoolEngage` itself against an in-memory beach — the refusal, nothing
  written, a seated author still revising, the tenth taking a place when one opens.

## 4. Left as it stands, deliberately

- A line taken back keeps its place for the window, as on the page (arrival is kept on a
  restage). xstream's mirror lets a newcomer take an emptied place. The doors differ only at
  a full table with a taken-back line.
- Per-author locks past nine stay parked (§2.4); nothing locks a liquid slot.
- xstream's genus animator stages through its own raw walk and falls back to slot 1: the
  same fault from the shell's side, in its own room. Its fix belongs in xstream-bsp.
