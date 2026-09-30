# Rooms, names, and each figure speaking for itself — built (2026-09-30)

**Status**: BUILT, for David's merge. **Lane**: rpg.11 (watch:weft 476). **Ruled**: David,
2026-09-30 — *"Yes to the location and the name fixes. For the keeper, read watch:weft 479 and
the proposal in #459 … and build that in place of your contract fix: each figure speaks for
itself; the keeper keeps the books and carries the news."* The faults are rpg.11's report of
2026-09-29 (Ugarth at 300; Cob at the Sow speaking of the hill; Orik's name reaching Ugarth)
and `proposals/2026-09-30-each-figure-speaks-for-itself.md` §3.

## 1. A way lands in a room

`renderWays` (src/tools/pool.ts) listed the grounds and the buildings of the ground one stood
in, so no way ever named a room: from the Long House the only way up the hill was `[300]`, the
whole upland. world-genome 2.1: *"a walk to 2 gives the region and a walk to 211 gives the room
inside it."* Now every way is addressed where it LANDS (`landingOf`: its first branch walked
down to the floor, or as far as the place goes), and the ladder runs to the floor — the
grounds, the buildings of your ground, the rooms of your building. From the Long House: `[111]`
the Village and the Green, `[121]` the Sow, `[131]` `[132]` the counting-room and bed-chamber,
`[311]` the Slopes. From `300`, where Ugarth and Orik stand, `[311]` the Diggings and `[320]`.
Every door reads its ways here (the resolution's WAY line, the claim, the room envelope, the
keeper's places, the clock), so nothing else changes.

## 2. A name only once it has been said aloud

- **The resolution** names no one by a name not yet SAID — inside quotation marks, never
  because it stands in narration, a heading or THE ACTORS. Each actor's line now carries the
  fact, read off the record (`saidAloud`: quoted spans of this room's record, the story so far
  and the window): *this name has NOT been said aloud here: the record calls them by how they
  look*. The story's headings no longer name who voiced each beat.
- **The telling** — *a name is the character's only once they have heard it said aloud … or
  knew it before*; each line of the moment is headed by whose act it was (`you`, a companion at
  the screen, `another`), never a handle; the character's own look rides so it knows itself in
  a record that describes it.
- **The law**: grit 1.45 *"Name actors by appearance until a name is spoken aloud (1.14)"*
  (the aperture ratchet 1449 → 1445 words: the line displaced, never accreted); 2.7 and 6.2 the
  same — a handle is the record's bookkeeping, never a name anyone there has heard.

## 3. Each figure speaks for itself; the keeper keeps the books (#459 §4.1–4.3)

- **Router.** `tier='figure'` (`composeFigure`, `FIGURE_CONTRACT`): one of the place's people,
  framed with its place and what the place keeps, this room's latest record, and its own last
  line — no GRIT, no arc, no other room, no one's telling. The keeper's contract is cut to
  ARRIVES (seat whoever is in the characters' room without a voice), NEWS (what reaches a place,
  never what anyone there does about it), DROP, WHERE, KNOWN; its frame carries the moment's
  last four beats (was thirty) and no tellings. THE WRITES name the figures present who speak
  next — woven in the beat just landed, then standing in the window — three at most.
- **Doorman** (`genus-one/waker.py` `keeper_pass` → `figure_pass`): DROP first; ARRIVES only in
  the characters' own room (a place inside it counts as it) and never where that voice already
  stands; NEWS joined to news already waiting, and not written if it names someone that place
  never heard named; then WHERE, KNOWN, the sheets; then each figure's call (Haiku, 300 tokens —
  `figure <mind>` beneath the dial's 7 to change it). GONE takes a label down; a line naming
  someone the figure never heard said aloud is asked for once more, and not staged if it still does.
- **The law**: grit 3 and 3.2 say so.

## 4. Replayed on the rig key, reads only, against the table as it stood (14:05Z)

| what | before | built |
|---|---|---|
| the resolution of beat 5, the staged line with and without "Orik" | named Orik 2 of 2 | 0 of 2 — *"the short man in the moss-green coat"*; Ugarth named, because Orik called it aloud |
| the telling of beat 5 over the OLD record ("answer Orik") | named him 3 of 4 (main, and the new frame less its name sentence) | 1 of 9 |
| the diggers at the working face, speaking for themselves | — | *"We flatten ourselves harder against the cut and wait for them to get above us, then we run"* — first person, no name; 9k chars, 2.3k tokens in |
| the keeper (Haiku) | brought the dead sergeant in at the Long House; acted out a man shouting in the village | DROP Sergeant Vane · 130; news to the Long House as sound only |
| the keeper (Sonnet) | — | one clean line: news reaching the characters' room as sound; or the diggers seated |
| the keeper's own call at 300, law and frame (the sheets ride their own calls) | 64k chars | 43k chars |

The telling skipping Ugarth's own line in that moment happens on main as well (2 of 2); the net
asks again, as it did before. About $0.60 of replays.

## 5. After the review (watch:weft 488, the costs lane)

The six asked for, and two more a second world found:

1. **CI red** — `smoke:reference-table` still expected `[100]`/`[200]`; it reads the ways each where
   it lands. The local run had skipped it; every suite CI runs now passes.
2. **A figure's line is public** — it stands in every player's window. The figure answers `DO`
   (a deed, as anyone there sees it) and `SAY` (words aloud), never a mind; its ceiling is 160
   tokens; and what the place keeps is opened only down the spine to its room, what stands inside
   the room by its face (`placeWalk(…, held, heldBelow=false)`).
3. **News let the characters' names through** — the guard now reads the table's names and the
   place lines of THE WRITES, never its character lines, and refuses a character's name wherever
   it stands in the news, the head of a sentence included.
4. **The dead could be brought in** — whoever is seated is asked AT ONCE (its first line a player
   reads is its own, and framed with the room's record it can answer GONE); one person keeps one
   window (seated here, its line elsewhere is withdrawn); a DROP reaches any room where a voice
   stands (THE WRITES' `stands:` lines), a room founded before ways landed in rooms among them.
5. **A name called at the head of a quote** ("Aldric.", "Aldric, fetch the cask") is checked
   (`called_names`), for a figure's line.
6. **A way to where you stand** — a building or ground whose way lands in your own room rides
   by name, unaddressed (`· The Long House … (where you stand)`); no door can walk it.
7. (Coldcote) **The keeper seated the same man twice** under a new label — it is now shown who
   speaks for themselves next in the room, and told one person keeps one voice.
8. (Coldcote) **An arrival named a character whose name was never said** ("looking past Wren and
   Tolly") — THE WRITES name the unsaid (`unsaid:`), and such a line is not staged.
9. (from 488's "also seen") **Places are the rooms of the place** (`roomsOfPlace`) and the
   characters' own room; a table room founded at a region or a building is no place for news.

**The alewife at the inn**, replayed as the review asked — `pool:120`, Haiku, eight runs each:

| | before | after |
|---|---|---|
| her mind on show ("I know what he is") | 4 | 0 |
| a held fact or held name said (the warrant's hiding place, Bole) | 2 | 0 |
| the fact a stranger must earn (the nightly drinking) | 1 | 0 |
| the name net asks again | 0 | 1 (Ugarth, never named aloud at the inn — caught) |
| length | 60–165 tokens | 36–82 tokens |

**A second world** — Coldcote (floor 2, its held truths in its registers, not its places), an
in-memory table at the mill, the same built router: the ways land in its rooms and never at the
mill one stands in; the make-it-happen and the telling call the big man by his look (his name never
said) and name Wren (she said it); the keeper writes only to Coldcote's rooms; the voice behind
the door answers DO/SAY with no name. **The keeper's mind decides the rest**: Sonnet was clean in
every run on both worlds (5 of 5); Haiku, the service default since 2026-09-21, re-voiced a dead
man, invented people (a "carter's child"), addressed a region, voiced others inside an arrival,
and used a held name as a label (1 of 3 — the register's own PAMBER), which no word test can
catch without catching ordinary words too.

## 6. For David

1. Merge — the router and the waker deploy together; the mirror is untouched.
2. Ruled 2026-09-30, to follow the correction: drop Sergeant Vane's line at `liquid:pool:130`;
   strike `names:scene` entry 2; `keeper sonnet` on Ugarth's dial (`wake:Ugarth` 9.2).
3. The keeper's mind for EVERY table — the service default (`WAKER_KEEPER_MODEL`) is Haiku by the
   ruling of 2026-09-21; the replays on two worlds say the keeper's job needs Sonnet. His word.
4. #459 §7.2 as built: three figures a beat; the day speaks as NEWS to the characters' own
   room. §7.5, the per-character story in the resolution: later. The people register (#460) is the
   natural source of a figure's own face — its next step.
