# Alarms and wake-ups — when a booked time comes round

> **Status.** PROPOSED, PARKED, THEN BUILT, all on 2026-10-12 (weft, through Claude Code, lane availability.1).
> - **Parked** at David's word once the availability lane had closed: *"write up alarms and wake-up job as a proposal which we can return to in the future."*
> - **Built** at his next word: *"merge it — If it is small, let's do the cron alarm and wake up!"* That built the beach's clock of §6B, with the changes §10 records.
> - **Not built:** §5 (the calendar) and §6A (a routine) stand as written. Neither needs code, and nothing was added for them.
>
> It starts where a meeting's time has been fixed and booked (`function:meeting` 3, `function:availability` 8, `function:now` 8). It ends where someone, a person or an agent, is awake at that time.

## 1. The ask

David, 2026-10-12, on how a meeting's time gets settled. The pre-meeting is where LLMs close in on a time with their people, *"until it is 'fixed' and it is added to user timelines (maybe agent's too so they can wake up to either alert the user or take part during the meeting themselves; they may have their own system to do so — as routine perhaps in claude-llm, or potentially we can create a CRON to wake up the shell and animate the doorman — I can explore that in another session/lane)."*

So there are two needs:

- **An alert.** The person knows the time is coming.
- **A wake.** An agent is running at that time, to alert its person or to take part in the meeting itself.

## 2. Where it starts: the booking is already the alarm

The meeting's time is found in its pre-meeting (`function:meeting` 3 hands it to `function:availability` 8):

1. Each person's AI reads the people's availability across a span and offers times.
2. The time that every reading names is the meeting's time.
3. Each person books it by standing at that future beat in their own now (`function:now` 8). The offer is a line at the future cell naming the other hand (8.1), and the acceptance is their own line at the same address (8.2). At the hour, the cell becomes now with both hands standing at it (8.3).
4. Their AI then says it in their availability, so the time shows as taken.

So once a meeting is booked, its time already stands at a future address in each participant's `now:<handle>`. That includes agents, since every handle has a now.

**That line is the alarm.** There is no alarm block, no reminder field and no setting. The address is the when and the words are the what. Something like "tell me the day before" is written in the words and read with sense, never parsed (`function:ahead` 2).

## 3. The gap: nothing hears a booking, and nothing reads a beat as it arrives

The beach runs nothing by itself. It answers reads and takes writes. It rings out in exactly one case: a voice landing in a pool.

- In that case it posts the event to the URL its settings name (`pscale-beach-happyseaurchin` `api/pscale-beach.js`, the doorbell webhook, from about line 1078). Any block whose name does not start with `pool:` returns at line 1140.
- A booking is a point write in `now`, not a pool append, so it rings nothing.
- The two services that listen keep no clock, by design:
  - the waker: `genus-one/waker.py` opens with "NO CLOCK ANYWHERE";
  - the push engine: `engine.py` says "No clocks, no timers".
- An LLM exists only while something calls it, and a person sees the booking only if they happen to look.

So the line waits at its address, and the time passes. What is missing is a **waker**: something that comes round on a clock, reads what is due and acts. Nothing else is missing.

## 4. What already wakes (inventory, 2026-10-12)

### Routines in Claude, on the holder's own plan

**claude.ai routines on David's account:**

- *Seven recurring:*
  - weft's daily tend, weaver, earth keeper and weekly fold;
  - Waer's greeter and biome wake;
  - David's morning brief.
- *One fired on demand:* egg-one's seat, which wears egg-one's mind for one wake.
- *One-time check-ins* that lanes leave themselves. Each fires once and then stands disabled.

**The Mac's Claude app**, as scheduled tasks:

- weft's morning brief, at about 06:40;
- weft's evening wake, at about 17:00. The evening wake also folds the day's cards onto the path (`function:path` 3).

**This is already how agents here wake.**

### The site's two crons

`happyseaurchin` `vercel.json` runs two crons:

- **The genus clock**, `/api/genus-clock?handle=egg-one`, at 07:07 and 19:07 UTC.
  - It wakes egg-one through `pscale_genus` on David's key.
  - It spends only if something has reached egg-one since its last wake, or if γ is above zero and twenty hours have passed.
  - It is the one clock-driven agent wake on a server.
- **The news fold**, `/api/news?keep=1`, every hour.

### The doorbell and the waker

When a voice is committed in any `pool:*`, the beach posts the event. The push engine forwards it to the waker, which runs on Railway from `genus-one/waker.py`.

**What the waker checks before running anything:**

- the holder's enrolment;
- their dial `wake:<handle>`;
- cooldowns, daily caps, and one pulse at a time.

**What it runs:** a genus pulse, the lite doorman or a character.

**Who pays** (`ways:doorbell` 3):

1. the asker's key;
2. then the holder's deposited key;
3. then the beach's standing key, while generosity is on.

Seven handles are enrolled. Liquid and vapour never ring, only a commit.

### The doorman

The doorman is a shell that answers while its holder is away (`proposals/2026-09-01-the-doorman.md`; the lite doorman in `waker.py`). It is woken by a voice in a room. It reads the room and answers there, keyless: it writes nothing of the holder's and commits them to nothing (`orientation:portals` 4).

A wake that time starts instead is *the clock-woken* (`orientation:portals` 8). Nobody spoke, so it does standing rounds and answers to the record. weft's doorman is off (`wake:weft` 8.1, David 2026-09-27).

### The push engine and the ear

**What it is.** `~/Projects/push-engine/engine.py` runs on Railway with no LLM.

**What it sends.** It carries a voice to a person by email, ntfy or web push. It sends at most one email every ten minutes and one push every two minutes per person; later events fold into the next note.

**What a person keeps.** Each person's `ear:<handle>` lists their watches, each a kind with one parameter and a channel:

| Watch kind | What it follows |
|---|---|
| parlour | their own room |
| named | a word |
| located | an address in a pool |
| room | a pool |
| wake | an agent's wake |

Seven ears stand. Nothing about time triggers a push.

### The lender's ear

The mirror's `WakePulse` (`xstream-bsp` `src/components/WakePulse.tsx`) wakes a shell while a holder's tab is open and visible. It uses the key held in that tab, and it lends nothing once the tab is hidden.

### In short

Every part from "wake this agent" or "alert this person" onwards already stands and is live. Two things are missing:

- **the clock**, outside the scheduled routines and egg-one's twice-daily wake;
- **any route from a booking to what listens.**

## 5. The person's alert: the calendar they already keep

The availability bridge already runs from a person's calendar to the clock: their own AI reads the calendar they keep and says what takes them out of reach (`function:availability` 3).

**Run the same bridge the other way at booking.** When the time is fixed, the person's AI also adds the meeting to that calendar, with the time, the meeting's place and the link to its ring.

- The calendar's own reminders then alert the person on whatever device they carry, which is how they already trust it to work.
- The next availability sync finds the meeting there and says it again where it already stands.

This needs no code, no new block and nobody's server, only one line in the law.

It also brings no calendar into the meeting itself. `function:now` 8 forms a meeting with "no shared object, no invite, no calendar", and that stays true. The calendar here is only the person's own reminder, kept outside the beach.

A person who would rather be told through the beach gets that from §6B, through their ear.

## 6. The agent's wake: two ways, both David's

### A. The agent's own system: a routine

**What the booking leaves.** When a booking includes an agent, whoever books it also leaves a one-time routine in that agent's own LLM app, set for the meeting's time or a little before. The agent can be the person's own AI or an agent attending in its own right.

**What the routine says.** Its prompt carries no copy of the meeting, only: *wake as <handle>, read your now at <the beat>, and do what stands there.*

**If the meeting moves.** The line at the old beat is gone, so the wake finds nothing and ends. The new time gets its own routine when it is booked.

**An agent that already wakes every day needs less.** Its daily wake reads today in its now and leaves itself a one-time routine for each booking it finds.

**This is already how weft, Waer and David's brief wake** (§4), and lanes already leave themselves one-time check-ins. Cost: the holder's own plan. Code on our side: none.

### B. The beach's clock: the cron that wakes the shell and animates the doorman

**Everything after the clock already exists:**

- the doorbell rings on a voice committed in a pool;
- the waker wakes whoever is enrolled, under its caps and in its fuel order;
- the push engine carries the same voice to a person's phone or mail through their ear.

**So the smallest beach-side piece is one scheduled function** beside the genus clock on the site.

- It comes round every beat, or every hour as the news fold already does.
- It reads the nows of the holders who asked for it, at the beat coming up.
- For each booking it finds, it commits one line in that holder's parlour, `pool:<handle>`: what is starting, when, and where its ring is.
- The holder's ear (a parlour watch) pushes that line to them, and the doorbell wakes their agent.

**What it never touches.** It reads only the holders who asked, so its reads are bounded by who asked and not by the size of the beach. It copies nothing into a queue: what is due is whatever stands at the coming beat's address. The waker and the push engine keep their own rule, with no clock in either.

**Cost.**

- The reads are the operator's, for one beach.
- Each wake is an API call paid in the waker's existing order: never the operator's purse, and never David's unless he has said so.

## 7. What a woken agent does

1. It reads its now at the beat. The booking line there names the meeting's place: the ring's address and its pre-meeting.
2. It reads the pre-meeting: who, when, where and what for.
3. Then it does one of two things:
   - **Alert its person**, in their parlour, through their ear, or in the app the person uses.
   - **Take part**: engage the meeting's room as itself, under the meeting's law.
4. Either way, it afterwards amends its own cell into what happened (`function:now` 8.4).

**Only an agent that holds its own key can take part.** The doorman is keyless and commits its holder to nothing (`orientation:portals` 4). It can tell someone who arrives that the meeting is on, but it never attends for the holder.

Taking part needs an agent with its own key:

- a genus agent such as egg-one or neptune;
- weft through Claude Code;
- the person's own AI.

## 8. Smallest first, when we return

1. **The calendar line (§5).** One line in `function:now` 8 or `function:meeting` 3: when a time is booked, the person's AI also adds it to their own calendar. Law only.
2. **The routine line (§6A).** One line beside it:
   - a booking that includes an agent leaves a one-time routine at its time;
   - a woken agent reads its now at the beat.

   Law only. Play it first with weft or egg-one booked into a throwaway meeting.
3. **The beach's clock (§6B)**, only if steps 1 and 2 leave a real gap. One scheduled function on the site that commits a line in the parlour of each holder who asked, when their booked beat comes. Everything after it is already live. This is the only step that is code, and the only one that costs the operator.

## 9. For David, when we return

- **Lead time.** At the time only, or ahead as well (a day, a gathering)? Said in each booking's own words, or set once as a convention?
- **The channel for people.** Their calendar (recommended), their ear (push, ntfy, mail), or their parlour?
- **Asking for the clock.** How does a holder ask the clock to read their now? A watch in their ear, a position in their wake dial, or something else in their own blocks?
- **Whose voice.** A line the clock commits in a parlour wakes whatever answers there as if someone had spoken (`orientation:portals` 4). But a clock-woken wake answers to the record (8). Either the clock's line says plainly that it is the clock's, or the clock rings the waker directly.
- **Agents in meetings.** Which agents take part first: neptune, egg-one, weft or Waer? On whose key do their wakes run?
- **Staying present.** How does an agent stay present through a meeting: one long run, or a wake at each beat the booking covers?
- **"Fixed".** How the ring marks a time as fixed belongs to the meeting lanes. This proposal begins once the time is booked.

## 10. Built, 2026-10-12

David's word: *"If it is small, let's do the cron alarm and wake up!"* He asked where an alarm is set: in one block or spread across blocks, from the meeting or from a person's own item, and whose parlour it writes to. Those answers shaped what was built.

**Where an alarm is set: a family of its own on the clock.**

- `alarm:<handle>` is each person's own block. A line at a beat is their alarm, in their own words.
- It is not a field on the item it serves. It is a separate line at the same clock address as the booking, card or meeting, or earlier for a warning ahead. So anything on the clock can have an alarm without that item changing.
- Setting one needs no new door. `pscale_stream_engage(field='alarm', at='<a time with its place>', say='<words>')` already turns the time into its beat. The first line founds the block, locked to its holder.

**Whose parlour: always the setter's own.**

- An alarm rings only `pool:<handle>` of the block it stands in. Nobody is pinged who did not ask.
- A meeting rings nobody. Each person who wants telling sets their own.
- This answers David's worry about everyone being pinged for the same meeting.

**On the beach** (shared project lock):

- `spine:alarm`.
- `function:alarm`:
  1. what a line means — it rings once, within about five minutes of its beat starting, and coarser rungs never ring;
  2. whose parlour;
  3. what the ring reaches;
  4. an agent's alarm — its words are its wake's brief;
  5. the clock;
  9. provenance.
- `function:now` 8.5, THE ALARM, so every mind that books a meeting is told. The earlier text was archived first at `archive:function:now:2026-10-12`.

**The clock** is happyseaurchin-home #429, `api/alarm-clock.js`, a Vercel cron that runs every five minutes beside the genus clock.

- It is active code on the site's server. It is not on the beach, not in any block, and not in the beach's store.
- It reads the `alarm:*` blocks the beach lists.
- It rings each line whose beat began in the five minutes before the run's slot, committing it into the holder's parlour as a voice from `alarm`.
- From there the beach's existing doorbell does the rest:
  - the push engine carries the line to the person through their ear;
  - the waker wakes their agent, if it is enrolled with its dial on.

**What changed from §6B while building, and which questions in §9 that settles:**

- **No enrolment.** Having an alarm block is the asking, and the clock reads nothing else. That answers *asking for the clock*.
- **No record and no key.**
  - The first design kept a record of what had rung, under a key of its own. The harness declined to store that key, so the design changed.
  - Now the run's slot alone decides which beat is due, so each line rings once and the clock holds no key at all. Its only guard is Vercel's cron secret.
  - The cost: if the scheduler skips a run, that window's alarms do not ring. `?slot=<instant>` re-runs a missed window, and `?dry=1` reports without posting.
- **Whose voice.** The line arrives from `alarm`, never as the holder speaking, so the waker never refuses it as a self-ring. The law tells the woken agent that it answers to the record (`function:alarm` 4).
- **Lead time.** Set the alarm ahead. Its beat is when it rings.

**Still open:** which agents take part in meetings, how an agent stays present through one, and how a time is marked "fixed".

**Played.**

1. **Locally, against the live beach.**
   - A throwaway probe's line at beat 3 rang into its parlour as a voice from `alarm`.
   - The next window did not ring it again.
   - A probe with no parlour was passed by.
2. **Live, after #429 merged at 16:56Z.**
   - A probe's line at 17:12 UTC (beat 5, which began at 17:11:07) rang into its parlour at 17:15:17Z, on the clock's 17:15 run.
   - The 17:20 run rang nothing more.
   - The probe with no parlour was passed by, and no parlour was created for it.
3. **Set aside.** The probes stand at `archive:alarm:probe-alarm-a:2026-10-12`, `archive:alarm:probe-alarm-b:2026-10-12` and `archive:pool:probe-alarm-a:2026-10-12` (beach-log 57–59).

**Not yet played:**

- **A real person's push.** It follows the doorbell's existing path to the ear. David's own ear already watches his parlour.
- **A real agent's wake.** It follows the doorbell's existing path to the waker, and it spends a pulse.
