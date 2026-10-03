# The author's keeper — every door's beats kept on the world author's key (2026-10-03)

**Status**: BUILT and merged (#473); brackenfoot's keeper enrolled live the same day. **Named**: the
person who runs a world's keeper, pays for it and sells its tickets is its **game-keeper** (David,
2026-10-03: *"game-keeper it is"*); "author" below, written before the name, means that person. The
keeper is the LLM's pass. **Ruled**: David, 2026-10-03 — *"yes, author's keeper for
every door — start with brackenfoot"*. Lane rpg.11; the trace and the options at watch:weft 476.6
and 476.7.

## 1. What was wrong

The keeper (the hard tier, grit 3) ran on the waker after each beat, paid by the key of the first
character with a doorman standing in the room (`keeper_on_bell`, `cands[0]`): an involved player's
key, never chosen. #395 wrote *"each table's keeper runs on that table's own fuel"*, and the code
took what the waker could spend. A room with no doorman in it, an LLM-app player's for one, had no
keeper at all.

## 2. Why the keeper is not the player's

The keeper reads everything held, so it must be a fresh call apart from any player's conversation
(2026-06-05 §4; 2026-08-11: an LLM chat cannot unread what it has read). Make-it-happen and the
telling stay the player's own, on their key or inside their subscription; their frames hold none of
the world's secrets (#395's fence). The keeper writes the world's next move, one hand per beat, so
it is the world's: its author runs it, pays for it, and can recover that with tickets.

## 3. Built (`genus-one/waker.py`, `genus-one/doorman_table.py`)

- **A world's keeper enrols by name**, `keeper:<world>`, at the world's own surface, proving the key
  to the world's held register `keeper:<world>` (a byte-identical write-back of a string position,
  the proof every enrolment uses), with the author's API key as fuel. No fuel, no keeper. The proof
  key is not stored: the keeper composes keyless and writes only open positions and the characters'
  own.
- **Its dial** is `wake:keeper:<world>` at the world's surface: 1 the switch (absent reads off), the
  minds beneath 9 (`keeper sonnet`, `figure haiku`), the author's to re-voice.
- **Every landed beat at a table placed in that world** is kept by it, whichever door made it happen:
  through the bell for the mirror, an LLM app or a doorman, and straight after a page's instructed
  fold. The table's world is read off its `keeper:scene` PLACING line, once per ten minutes. A
  character's doorman standing in the room lends only its own key, for the sheet and the move that
  are that character's alone.
- **No keeper enrolled for a world, nothing is kept**: never on a doorman's key, never the waker's
  own. Today only brackenfoot's tables have any doorman, so no other table loses a keeper.

**Proof.** `test_doorman` 228, 13 of them new: the table names its world; a keeper enrols by name
alone on its author's fuel, the proof key not kept; no fuel, no enrolment; the world is kept where a
doorman stands and where none does; the switch off, a keeper at another surface, a keeper without
fuel, or none enrolled keeps nothing. **Offline end to end**: the real beach handler on a scratch
folder, a local router from this branch, this waker with its own key empty; a throwaway table placed
in a copy of brackenfoot, one character, no doorman. The keeper enrolled, was proven against the
register, and its dial was seeded on. One bell later the keeper ran on the author's key (the rig
key) and seated the innkeeper, who spoke for herself: *"Reach across the trestle and turn one coin
over, then look up at her face."* Nothing touched the live beach.

## 4. After the merge

Enrol `keeper:brackenfoot` at `https://beach.happyseaurchin.com/w/brackenfoot`, proven by the key that
latches the register (weft's) and paid by David's API key as brackenfoot's author. `/health` lists
it; the next beat at any brackenfoot table is kept by it, whoever commits and through whatever door.

## 5. Not done here

- **The sheet and the location fix** (passport 4 and 3) are written with each character's own key,
  so a character without a doorman gets neither, as before. Whether the sheet belongs in the keeper's
  books or in the player's own stack (its frame holds only the character's own story) is David's.
- **Tickets.** The ticket machine already sells; a world's keeper would check for a valid ticket
  before each pass.
- **The bell** still runs from one beach to one engine to one waker. A world kept by another waker
  needs the world to name its keeper's bell.
- **The waker's own key** still funds David's own genus agents (2026-09-01) and any doorman enrolled
  without a key of its own. The keeper never touches it.

## 6. The game-keeper's journal (step 2, David's order of 2026-10-03)

Each pass of a world's keeper now writes one entry to `daily:keeper:<world>` at the world's surface:
the table and the room and beat it kept (2, 4), what it did (5 and the line), and what the API
counted (6: `keeper <model> in= read= write= out= · sheets … · figures …`). The sheets' calls are
counted too, which the log line never did. The journal is latched to a key the waker makes at the
keeper's enrolment and keeps, so a stranger's append is never counted as a pass; each span of nine
is voiced plainly from its own entries (passes, tables, span, counts), with no model call. It is
the source for the game-keeper's page: beats kept and spend per table.

## 7. Seats (step 4, David 2026-10-03: "£5 for 100 beats. Each player pays their own ticket")

- **The price** is a live Stripe price, `price_1UMW1xBj8x7c0F1eDXq4iqBj` (lookup key `brackenfoot-seat-100`,
  £5.00 once). The ticket machine sells it as the product `brackenfoot-seat`, deployed 2026-10-03; its buy page is
  `https://genus-tickets-production.up.railway.app/buy/brackenfoot-seat`. The buyer names their character as it
  stands at the table.
- **The list** is `sed:brackenfoot-seats` at the beach, founded under the shared project lock. The machine settles
  one entry per paid seat: `<handle> — <date>`, with a line of the buyer's own if they leave one. There are no
  amounts on it; Stripe is the money record.
- **The rule** stands beneath 9 of the keeper's dial: `seats 100`. Each seat keeps 100 of the beats its character
  makes happen. A beat is paid from the seat of the character who committed it, which the bell names (`agent_id`);
  a page's fold names the folding character. A doorman's fold counts too, and a move counts twice (one beat where
  the character leaves, one where it arrives). With no `seats` line, or `seats off`, every beat is kept. The line
  goes on when the game-keeper decides, so nobody is cut off before they can buy.
- **The reckoning** is `dt.seats_of` (the list's entries naming the character) times the beats a seat keeps,
  less `dt.beats_used` (the journal's kept passes naming that character, at 7). A beat with no beats left is not
  kept: no call is made, and the journal records it as `unkept`, with the reason. A beach that does not answer
  never costs a player: the beat is kept.
