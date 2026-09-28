# Forms — a family declares its law, the pages walk what the law declares, and anyone can add a form (2026-09-28)

**Status**: proposed at David's word (*"yes, write the proposal"*). Nothing is built yet. §8 gives
the build order.
**Prompted by**: David, 2026-09-28, after finding Matthew's hand-built families drawn on /walk and
/recency under wording written for the clock, and a mirror's automatic first line listed as his
voice (happyseaurchin-home #326 fixed the line for new mirrors).
**Lane**: watch:weft 471 (matthew.1).

## 0. David's words

> "I was thinking of another form, found it — /walk/here/happyseaurchin?at=31131111110 — that's
> not based on time, it is based on location … then we can possibly come up with a
> 'miscellaneous' form so that it can deal with a form that doesn't conform with the temporal or
> spatial addresses. For example, Matthew is coming up with a book structure — that might be a
> useful form; or a variation of the spatial where it is lero's regional organisation groups. So
> that people can come up with new forms/templates I guess, and others can pick a form/template
> that matches what they need."

And earlier the same morning: *"Maybe we only show well-formed projects in /walk and /recency."*

## 1. What stands (checked against the code and the beach, 2026-09-28)

- **/walk decides in code how to walk a family, and there are three ways.**
  - **Time**: a spine at floor 10 on the clock.
  - **Places**: only the family named `here`, hard-wired to the earth beach, world `earth`, floor
    11. This was ruled on 2026-09-14 and is recorded in
    [2026-09-10-here-the-persons-door](2026-09-10-here-the-persons-door.md). It reads the
    world-genome's registers: `spatial:earth` is the map, `identity:earth` says how places are
    held, `identity:<handle>` is a person's voice at each place, and `spatial:<handle>` holds the
    places a person adds. The law is `function:earth`. (`?at=31131111110` walks Earth → Europe →
    United Kingdom → South Yorkshire → Sheffield → … → the Coach House, 9 Machon Bank.)
  - **Branches**: anything else is drawn bare, under an intro written for the clock ("Slide
    sideways through time…").
- **/recency** draws a clock as the sundial and anything else as a wheel of the spine's branches.
  Its centre lists each mirror's first line as that person's voice, including the line a page
  writes on its own when it founds a mirror.
- **/found** founds two forms from templates kept in its own code:
  - a project on the clock (the venture), which writes `spine:<name>` at floor 10 and its law
    `function:<name>`;
  - the question sets (evaluate, poll, brainstorm, check-in, retro), which write `spine:<name>` and
    `function:<name>` in the respond mode, answered on /next and /fold.

  Both write the family's own law at `function:<name>`.
- **The operator library already exists, in the `tree` block.**
  - 9.2 lists operators by use-case: SEQUENCES `function:audit`, HEALTH `function:status`,
    COMMUNITY `function:offers`, PURPOSE `function:backcast`. Pools run on `function:align`,
    `function:parlour` and `pscale:grit/1`, and anything else runs on `pscale:grit/5` until a
    named operator earns its block.
  - 9.3 says how to design an operator: its spine kind, its mirror voicing, its mount and its
    fold, leaving gating alone.
  - 9.1 says a family declares its operator twice: in `spine:V`'s underscore (the record) and in
    `pool:V`'s underscore (the machine-read mount).
- **The mount has slipped where it met the chats.** In late September the /found families'
  pool opening lines were re-voiced as plain chat welcomes (watch:weft 461, 466), so `pool:V`
  mostly no longer carries a bare reference. Of the families checked, only `pool:arrival` still
  mounts one (`function:audit`). Every /found family and every world does carry its own law
  block, though: `function:<name>`, or `function:<world>` for a world.
- **Families built by hand carry no law.** Twelve families with a spine have their own law
  (beach-venture, hermitcrab, now, news, opportunities, genus-one, wow-experiences, onen-rpg,
  molequle, views, fairy-tales, neuroinclusion). Eleven have no law of their own:
  experiences, recovery-capital, lero-nnh-recovery-capital, wholeless-nights, sqale-game,
  inclusion-moves, neighbour-gifts, make-a-beach, state-of-play, pulse and arrival. Of these,
  only arrival mounts a library operator, so ten stand with no law at all. The pages draw them as
  bare branches under clock wording, and that is the mess David met.

## 2. The idea: a form is three things, and all three are already in blocks

A form is an **address space**, a **law** and a **walk**.

- **The address space** is read off the spine: a clock (floor 10), a world's map
  (`spatial:<world>` at that world's surface), or branches (anything else).
- **The law** is the family's own `function:<name>`, a world's `function:<world>`, or the library
  operator the family mounts (tree 9.1). Its opening line says, in its author's words, what the
  family is and how to read it.
- **The walk** follows from the address space: rows of time for a clock, rows of places for a
  map, rows of branches for anything else. The law's opening line takes the place of the page's
  own wording, so a family is never again described in words written for another kind.

No new field, and no table of kinds in code. A page reads the family's structure and its law.

## 3. What changes

1. **The pages read the law.** /walk and /recency show the law's opening line where they now
   show fixed clock wording.
   - A family whose spine stands with no law is not well-formed. It is left out of the project
     row and out of /recency's family list, which is David's "only show well-formed projects".
   - A direct link to such a family on /walk still opens it, in a plain view: the spine's own
     opening line, no clock words, and one line saying no law stands yet and how to give it one.
   - Neither page ever lists a mirror's automatic first line as a person's voice.
2. **Places beyond earth.** The places walk reads its world from the worlds register: the route
   it names, and the floor its `spatial:<world>` declares. Earth stops being hard-wired.
   `/walk/here` keeps meaning the person's own world, earth by default, and `?world=<name>` walks
   any other registered world.
3. **Forms become the library, founded from blocks.** /found stops keeping its templates in code.
   - Each operator in the library carries its own **founding branch**: the blocks a family of
     that form is born with, and the line each is born carrying. This is what world-genome does
     for worlds and shell-genome does for shells.
   - /found lists the library (tree 9.2) and founds from the founding branch of whichever
     operator is picked.
   - The two forms /found has today move into their operators: the venture into
     `function:backcast`, the question sets into `function:respond`.
4. **The miscellaneous form.** A family whose address space is branches becomes well-formed as
   soon as its law stands. This is the form for anything that is neither time nor place — a
   book, a curriculum, a set of dimensions — walked as branches and read in its own law's words.

## 4. How anyone adds a form

1. Author an operator as tree 9.3 describes: the spine kind, what a person's line means, and how
   the fold reads.
2. Give it a founding branch.
3. Add its line to tree 9.2.

From then on /found offers it and anyone can pick it. Nothing enforces a form; what others take
up becomes a convention, which is the beach's rule for everything else.

## 5. Worked example A — Matthew's book (`wholeless-nights`)

- **Address space: branches.** The watches in reading order make an ordinal sequence (tree 9.3). A
  position holds nine at most, so twenty-seven watches need a level of grouping: three parts of
  nine, for example. The alternative is to carry the sequence as depth, as David suggested in his
  own reading at wholeless-nights 3
  ([2026-09-24-sequence-is-depth](2026-09-24-sequence-is-depth.md)), with each draft as a
  version beneath its watch.
- **Law: a manuscript operator**, with the name Matthew's to choose.
  - Each watch's line is its title and aim.
  - A reader's line at a watch is a note to the author.
  - The fold at a watch collates those notes for the next draft.
  - His own page on GitHub Pages renders the spine for readers off the beach.
- Once the law stands, /walk shows the watches in the law's own words, and the book appears in
  project rows as a well-formed family.
- The law is Matthew's to write. Weft can draft it for him to adopt.

## 6. Worked example B — LERO's regional groups

There are two routes, depending on what the groups are.

- **If they are real places** (Corby, Kettering, Wellingborough…), they belong on earth's map.
  World-genome 2.4 (the graft) lets a place join where it truly stands, and a member voices it at
  `identity:<handle>`. /walk/here walks it today, with no code.
- **If they are the organisation's own geography** — groups, hubs and meeting points arranged the
  way the organisation thinks of them, under its own law (the check-in, and the privacy of his
  design's 2.2) — they are a world of their own:
  - `spatial:lero-nnh` is the map;
  - `identity:lero-nnh` says how each group holds its place;
  - `function:lero-nnh` is the law;
  - the world is registered in the worlds register at a route of its own: a sub-beach, a `/w/`
    table, or later LERO's own beach.

  `/walk/here?world=lero-nnh` walks it once 3.2 lands.

The second route is recommended for an organisation with rules of its own. The first fits when
the aim is only to put groups on the map.

## 7. What it does not do

- **No new tool and no new block kind.** Forms are operators, which already exist, and founding
  branches follow the genome pattern the beach already uses.
- **It enforces nothing.** A hand-built family still stands and can still be read, and its holder
  gives it a law whenever they choose.
- **It does not restore the pool's machine mount (tree 9.1).** The law block is the declaration
  the pages read. The mount can return beside a chat's welcome later, if an envelope needs it.

## 8. Build order, smallest first

1. **Site:** /walk and /recency show the law's opening line as the intro, give a family with no
   law the plain view, and never list an automatic first line as a voice.
2. **Site:** the project row and /recency list only well-formed families.
3. **Site:** the places walk reads the worlds register.
4. **Blocks, then site:** founding branches in `function:backcast` and `function:respond`, each
   under its own key; then /found reads the library.
5. **Beach:** tree 9.2, tree 9.3 and conventions 2.12 name the forms and the founding branch,
   each archived before it is re-voiced.

Each step is walked on the offline rig or a preview before it is handed over.

## 9. For David

- Should the pages say "form", as here, or keep the library's word, "operator"?
- Should a family with no law stay reachable by a direct link (recommended), or be hidden
  entirely?
- Should weft draft Matthew's manuscript operator, and the LERO world, for him to choose from?
