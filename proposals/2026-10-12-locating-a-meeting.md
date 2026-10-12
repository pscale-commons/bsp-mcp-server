# Locating a meeting — a cell on the lattice, fixed in the pre-meeting's fold, carried in each person's own clock (2026-10-12)

**Status**: AGREED 12 October. David's answers to §7: *"The summary, public links fine, yes show it in the header."*
- The fix lives in the fold, the meeting's shared summary.
- A public link at the Where is fine.
- The ring shows the fix under the meeting's title (happyseaurchin/happyseaurchin-home#428).
- `function:meeting` 7.1 and 7.2 are written as §6 says, the standing text archived first.

§8 answers availability.1's question about alarms. Written at David's ask on 12 October, after lane availability.1
finished its part of the availability family.

**Companions**:
- `2026-10-09-a-meeting-drawn-as-one-ring` §12: where a meeting meets availability.
- `2026-09-23-the-lattice` §1: a cell is a place and a span on one ladder.
- `function:now` 8: coordination by co-presence.
- `function:availability` 6 and 8: the group, and a meeting's time.
- `src/here.ts`: the real map and the here-stamp.

Weft, lane 2, Claude Code.

## 0. David's words

> "I am now thinking of a lattice-checking procedure. An example is when LLMs are attempting to arrange a meeting.
> The meeting form's pre-meeting. The meeting rules already point AIs to availability, using 'When' at 1.1 and
> 'Where' at 1.3. So, can you propose the convention for helping llm organise meetings? I suspect it should be done
> by llm's using the pre-meeting area and staging things there, until there is agreement on when and then the
> meeting is 'fixed'. This means that LLM's add some text in the agent's/user's now or project at a future
> time/date. I'm wondering if the meeting itself should have a fixed date time too in some sense, using sundial
> clock and perhaps location (virtual as in pool link, or real); actually is there a link to the o-page -- how
> exactly do we point at the meeting? If it is to pool for the meeting then the pool welcome needs to point to the
> meeting, and presumably there is a unique url to it? Please explore how we handle this arrangement of 'locating'
> a meeting in time and place (real or virtual)."

## 1. A located meeting is a cell

The lattice gives the frame. A cell is a place at some rung and a span at the same rung, on one ladder: "a melee
is a room and a beat". A meeting is a room and an hour. Its place sits at the room rung of its map, and its time is
a run of beats on the clock, with its people read through identity. The real map's rung 0 is *the room*
(`src/here.ts`), and the clock's rung 0 is the beat, so the two correspond exactly.

Nothing here is new mechanism. Every piece already stands:
- the pre-meeting at 1, with When at 1.1, Who at 1.2 and Where at 1.3 (`function:meeting` 3);
- `pscale_stream_engage` at a meeting family, which reads every reading at an address side by side, says one, and
  keeps a fold. This was checked on `first-online-test` at 1.1 on 12 October;
- the stream naming the beats of a time as said: "16:00–17:00 Wednesday Europe/London" answers *4 beats*, attended
  at 2026412760;
- co-presence in now (`function:now` 8);
- availability's read across a span (`function:availability` 4 to 6);
- the real map's pointer, which a passport already uses at its 3.

This proposal names how those pieces compose and where each fact lives, so that every LLM arranging a meeting
writes the same things in the same places.

| fact | where it lives | who writes it | how |
|---|---|---|---|
| the offers | `<name>:<handle>` at 1.1, 1.2 and 1.3 | each person's own LLM | `say` at the meeting family |
| the fix | the fold `<name>` at 1.1 and 1.3 | any LLM, once the readings agree | `keep='collective'` |
| the booking | `now:<handle>` at the start beat | each coming person's LLM | `say` at the time, in now |
| out of reach | `availability:<handle>` across the span | each coming person's LLM | `say` at the span |
| the room | `pool:<name>` | whoever wants it | "create a pool" on the ring, or `pscale_pool_engage` with that purpose |
| the record | the run `<name>:<beat>:<handle>`; each now line amended | after the hour | as now |

## 2. One name points at the meeting

**The meeting's name is its pointer.** It is unique on its beach: Duplicate never takes a name that a `spine:`,
`function:`, `pool:`, `passport:` or bare block already holds, nor one with blocks already named under it. It adds a
number instead. Every door opens from that one name:

- **for people**, the o-page `happyseaurchin.com/ring/<name>`, or `/ring/<name>/<handle>` to read as oneself;
- **live at the When**, `mirror.onen.ai/?block=spine:<name>&at=1.1`;
- **the room**, `mirror.onen.ai/?pool=<name>`;
- **for an LLM**, `spine:<name>`, whose law `function:<name>` says `mode: meeting`. The address is the reference.

**The pool already points back.** "create a pool" (happyseaurchin-home#418) founds the room with an opening line
that ends: "The meeting: happyseaurchin.com/ring/<name>; its law: function:<name>." So:
- the pool points to the meeting;
- the meeting points to the pool through the Talk door;
- a now line points to the meeting by its name.

**Across beaches**, the starred form a passport already uses for a place on another beach serves:
`*:<origin>:spine:<name>`.

## 3. When — staged, agreed, fixed, booked

1. **Staged.** Each coming person's LLM reads the group's availability at a span (`function:availability` 4 to 6).
   It then says up to three times at the When, in its own mirror: `pscale_stream_engage(field=<name>, at='1.1',
   say='Wednesday 16:00–17:00 Europe/London, or Thursday 10:00–11:00 Europe/London')`. A time always names its
   place. A mirror is revisable, so the mirror is the stage. Each LLM also says "coming", or not, at 1.2.
2. **Agreed.** The time is agreed when every coming reading at 1.1 names it, "coming" meaning said so at 1.2. One
   read at 1.1 lays every reading side by side, so an LLM sees agreement at once.
3. **Fixed.** That LLM keeps the fold at the When with `keep='collective'`, for example:
   *"FIXED — Wednesday 14 October 2026, 16:00–17:00 Europe/London — beats 2026412766 to 2026412769 — named at 1.1 by
   alice, bob and carol."*
   - The beats come from the stream, which names them from the words. Nobody works them out by hand.
   - The fold is never a gate. If a reading changes, the fix is kept again, and anyone may supersede a fold that
     misreads its readings (`function:meeting` 7).
   - The fold already shows on the ring at the When, under Synthesis.
   - This is the meeting's own fixed time on the sundial, held in the meeting's own family.
4. **Booked.** Each coming person's LLM says the meeting in that person's own now at the start of the meeting, as
   the person would say it: `at='16:00 Wednesday Europe/London'`.
   - Everyone lands on one cell, 2026412766. The first to say it makes the offer, and the rest accept at the
     self-same cell (`function:now` 8.1 and 8.2). Co-presence at one cell is the appointment.
   - The line names the meeting: *"First Online Test (first-online-test), 16:00–17:00 London, in its pool —
     happyseaurchin.com/ring/first-online-test"*.
   - Now holds the when and the who only (8.3). The where stays with the meeting, one name away.
   - The same LLM says the span busy in availability (`function:availability` 8).
   - If the meeting serves a project kept on the clock, it adds a line at the same cell in that project's family.

## 4. Where — the room, a link, or a place on the real

The Where is offered at 1.3 the same way as the When, and fixed in the fold at 1.3. It is one of three kinds.

- **The meeting's own pool**, virtual on the beach and the default: "in its pool", `mirror.onen.ai/?pool=<name>`.
  It is made on the ring with "create a pool", whose opening line already says the room is for talk and not the
  record, or by an LLM with `pscale_pool_engage(purpose=<that line>)`. Once it stands, the ring shows the Talk door.
- **A link elsewhere**: a call, or a world's table. The role-playing game's 1.3 already names
  `happyseaurchin.com/w/<table>`. The Where is written as words plus the URL. **The beach is public**, so a link
  written at 1.3 is readable by anyone. Only a link that may be public goes there; a private one is passed
  privately, in a grain between two hands or in person.
- **A place on the real**: its words plus its pointer on the real map, `spatial:earth:<address>`. This is the form a
  passport uses at its 3 to say where its holder stands, so /here and the here-stamp already read it. The pointer
  goes at the room rung (pscale 0) when the room is known, and coarser when only the town is.

Fixed, the place reads like *"PLACE — the Coach House, Sheffield — spatial:earth:<address> (the room)"*, or *"PLACE —
its pool, mirror.onen.ai/?pool=first-online-test"*.

## 5. The lattice check — reading that every register agrees

**When a meeting is located.** A meeting is located when its cell stands in its own fold and in each coming person's
own registers.

**When the check runs.** Any LLM can run the check, the evening before and again at the hour. It is reads only, and
writes nothing but a nudge.

**The four reads:**
1. **The fold against the readings.** Is the fixed time still one that every coming reading at 1.1 names? A reading
   changed since the fix re-opens the When.
2. **Each coming person's now at the start beat.**
   - It names the meeting: booked.
   - It is silent: not yet booked.
   - Another line stands at that cell: a clash, because they said something else there.
3. **Their availability across the span.**
   - Busy, or naming the meeting: consistent.
   - Nothing there: the booking did not reach availability, so fill it.
4. **The place.**
   - The pool stands, for a meeting in its pool.
   - A link is given, for a meeting elsewhere.
   - For a real place, it resolves on the map, and nobody's lines around the span put them where the journey rules
     out. Availability's law already asks for this: "for meeting in person allow the journey from where their lines
     put them".

**The three answers:**
- **LOCATED**: every register agrees.
- **OPEN**: the gaps are named, and each missing person is nudged once in their parlour, in `function:availability`
  6.1's words.
- **CLASHED**: the When is re-opened.

**After the hour, the record closes the same lattice.**
- The run is kept at `<name>:<beat>:<handle>`, and its beat is the fixed cell.
- Each now line is amended into what happened (`function:now` 8.4).

**The general form.** An event is stated once at its cell and carried at the self-same address in each
participant's own registers. Reading them side by side checks it. There is no register of authority and no
machinery. The meeting is the first instance.

## 6. What changes, if this is right

- **`function:meeting` 7 gains two lines**, under the shared lock, with the standing text archived first:
  - 7.1, THE FIX. The pre-meeting's fold at 1.1 and 1.3 is the meeting's cell. It is kept collective once the
    readings agree, the time with its place and its beats, and the place as one of the three kinds.
  - 7.2, THE CHECK. The four reads and the three answers.
- **`function:meeting` 3**: its last sentence points at 7.1 instead of saying the procedure again.
- **`function:availability` 8**: one clause, "the fix is kept at the When's fold (function:meeting 7.1)". Lane
  availability.1 keeps that block, so the clause is offered to that lane rather than written by this one.
- **The ring**, optional and small, at David's word. When the fold at 1.1 and 1.3 stands, the header shows it under
  the title, for example "Wednesday 14 October, 16:00–17:00 London · in its pool", read from the fold. Until then
  nothing shows.
- **Known and cosmetic**: on a meeting family the stream prints 1.1 as "11" (tidying.18, watch:weft 536). The
  address it writes is right.
- **No router code, no new tool, no new kind of block.**

## 7. For David

1. **Where does the fix live?** In the fold, where any LLM may write it and a better reading supersedes it, or in the
   spine, written by the meeting's keeper? This proposal says the fold, with the keeper free to say it in the spine
   as well.
2. **Is a public link at 1.3 acceptable for calls**, with private links kept off the beach?
3. **Should the ring's header show the fixed time and place?**

## 8. The alarm belongs to each person, not to the meeting

> "I'm setting up the alarm in availability.1 and there's a question as to whether an alarm is set to the meeting or
> to an individual's mirror; because if an LLM is woken -- does it ping all participants by writing into their
> parlours or just their own? Based on how we are setting up these meetings here, which is preferable?"

**Each person's own booking is their alarm.** Lane availability.1's parked proposal says this from the other side
(`proposals/2026-10-12-alarms-and-wake-ups.md` §2): once a meeting is booked, its time stands at a future address in
each person's own now, and *that line is the alarm*. The meeting holds the fixed cell as data, in its fold at 1.1
and 1.3. It holds no alarm, and it rings nobody.

**A woken AI tells its own person only.** It reads its own now at the beat, finds the meeting by name, reads the
fold, and tells its person through their own channel: their parlour, their ear, or the calendar the person already
keeps. If it takes part, it goes to the meeting's own room. It never writes into the other people's parlours.

Why each person and not the meeting:
1. **The grain of the family.** Every act in `function:now` 8 is a voicing in the actor's own mirror; "nobody's block
   is ever written by another hand". The appointment *is* the people standing at one cell. There is no meeting
   object to hang an alarm on, and none is wanted ("no shared object, no invite, no calendar").
2. **Pull is the law.** A nudge is "a word in a room, never machinery" (8.21). A meeting-wide alarm that wrote into
   everyone's parlour would be machinery speaking in other people's rooms.
3. **Who pays.**
   - A line in someone's parlour rings the doorbell. Their agent then wakes on whoever's key the order finds
     (`ways:doorbell` 3).
   - With one alarm per meeting, one hand spends for everyone's wake, and the agents of people who never asked
     wake too.
   - With an alarm per person, each wake is on the person's own plan, or on the clock they asked for, whose reads
     are "bounded by who asked" (§6B of the alarm proposal). The cost federates with the people, which is the
     design principle.
4. **It follows the person when things change.** If a person moves or drops their booking, their own line moves
   with them. The wake finds nothing at the old beat and ends (§6A). An alarm kept on the meeting would need its
   own state, and that state could drift from the people's.
5. **No single point of failure.** If one person's AI is absent or out of fuel, everyone else is still woken. A
   meeting alarm held by one hand fails for everyone at once.

**The one line an AI leaves in another person's parlour is the lattice check's nudge** (§5).
- It is left once, for a named gap: someone coming who has not booked, or whose line clashes.
- It uses `function:availability` 6.1's words, staged and not committed, so it rings nothing.
- An AI that sees the same nudge already standing there leaves no second one.

This happens before the meeting, as part of arranging it. It is not an alarm. At the hour, nobody pings anybody:
each person is woken by their own booking.

**Wanting to hear from the meeting itself stays opt-in.** A person who wants the meeting's room to reach them puts
a room watch on `pool:<name>` in their own ear. Any line committed there, including "starting now" from whoever
opens the room, then reaches them, because they asked.

`function:meeting` 7.2 says this in one clause, and the parked alarm proposal's §9 "Whose voice" can lean on it when
it is unparked.
