# The form draws its rows — titles, plain words, ladders and marks for every branch family (2026-10-05)

**Status**: landed at David's word the same day (*"restore my list with bobble last, and do 1 and 2"*).
**Prompted by**: David, 2026-10-05, looking at `/walk/bobble/happyseaurchin`: *"Just a bunch of digits and
humanly understood titles. Can we not create a nicer rendition on /walk with the function block or spine
structure etc? How come the temporal ones like /now worked well or /beach-venture but others can't be
equally 'well-formed'? I thought I went to trouble of creating 'forms' so that users can choose from
different forms that are 'well-formed'."*
**Lane**: watch:weft 547 (bobble.1).

## 1. What stood

- **/walk chooses its drawing from the address space alone.** This was the walk of
  [2026-09-28-forms-a-family-declares-its-law](2026-09-28-forms-a-family-declares-its-law.md) §2:
  - a floor-10 clock gets rows named by the calendar (2026, autumn, October, this week, today);
  - the earth's map gets the names of its places;
  - anything else gets rows of branches labelled by digit (`·1`, `·2`), each showing the node's raw
    text.
- **The law shaped only the intro.** It supplied the intro line and said whether branch 9 is its stem.
  So every branch form walked alike and bare: the progression, the health board, the gifts and "your
  own form".
- **"Well-formed" was a status, not a presentation.** A family is well-formed when its law stands. The
  project row and /recency honour that; /walk had nothing to read from it.
- **The clock reads well because its coordinates come with names.** The calendar is its grammar. A
  branch family's names live inside its own text, as the `LABEL — line` most families already keep,
  and no page read them.

## 2. The change: a grammar every branch form keeps, written once and read by the page

The grammar stands in the library's design notes, `tree` 9.3, beside the axes an operator already
binds. /walk's branch mode reads it.

1. **The title.** A node opens with its title in capitals, then ` — `, then the line written to the
   person who arrives. /walk shows the title, in sentence case, where it showed the digit. The digit
   stays in the workings.
2. **Two readers.** Cross-references and block names stand in brackets, for minds walking the block.
   - The plain view leaves out a bracket that holds an address or a block name.
   - It names the family's own blocks in words: the plan, the law, the room, your own mirror.
   - The workings switch shows the raw line.
3. **Sequence is depth** ([2026-09-24-sequence-is-depth](2026-09-24-sequence-is-depth.md)).
   - Breadth is parts, drawn side by side as before.
   - A run down digit 1 is a sequence, drawn as one ladder instead of a row per step. A run is a
     node whose branch 1 goes on to its own branch 1, through steps whose other branches hold
     nothing beneath them.
   - A step's other branches, when they are leaves, are its side-rooms, shown beside it.
4. **Marks.** A reading that opens with a word in capitals is counted on its node's card: DONE, DOING,
   BLOCKED; GREEN, AMBER, RED; OFFER, WELCOME. These are the token-first voicings the library's forms
   already ask for.

A form's own law may narrow the grammar. The clock and the map keep naming their rows from the
calendar and the places.

## 3. Landed with it

- **spine:bobble rewritten for two readers.** Eleven lines moved their addresses and block names into
  brackets and kept their own words for the person. The replaced fragments stand verbatim at watch:weft
  547.6. One stale pointer was trued: builders now report against the law's mirror rule
  (`function:bobble` 2), not the old 9.1.
- **tree 9.3.** It gained the grammar. Its standing text is kept verbatim at `archive:tree:2026-10-05`.
- **The site.** happyseaurchin-home, `/walk` branch mode (companion PR, branch `claude/walk-rows`).

## 4. What it does not do

- **No new field, no new block kind and no table of forms in code.** A family that keeps no titles
  walks as it did, with digits and raw text, so nothing that stood regresses.
- **The clock and the map are untouched.**
- **/recency, /tree and the mirror do not read the grammar yet.** Adopting it is theirs to do, on the
  same rules.
