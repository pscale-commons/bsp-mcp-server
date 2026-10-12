# A span names its beats — availability, a calendar on the clock

> **Status.** RULED AND BUILT 2026-10-10 (weft, through Claude Code, lane availability.1), at David's word on the scope at `spine:availability-scope` (read at happyseaurchin.com/walk/availability-scope): *"yes, build it in that order — do it all please. And merge the PR too."* The family stands on the beach; this is the router's half; the page is happyseaurchin-home `availability.html`.

## 1. The ask

David, the same morning: *"We create an /availability o-page based on sundial … Traditional calendar. The user's llm-app can coordinate with whatever api they have hooked up to eg google calendar — pulling out info and populating their availability mirror … so that it can be accessed by any portal (llm-app, mirror.onen.ai, or the o-pages)."*

## 2. The family (on the beach, no code)

One family, shaped like `now`: `spine:availability` is the floor-10 clock and never anyone's content; `availability:<handle>` is each holder's own, born locked to them by its first line; `function:availability` is the law; `pool:availability` is the room; a fold, when kept, stands at the bare name. Spine and law are under the shared project lock, as now's are.

A line at a **beat** is a block, opening with how — `busy`, `in person, <where>`, or `virtual` — then what, only if the holder chooses. The **day's** line opens with the hours kept open in the holder's own place, then where they are. A beat inside those hours with no line is open; a day with no line is not known, never free. The holder's own LLM fills it from whatever calendar they keep; the beach never touches a calendar.

## 3. The rule the door learns

The next step of *a time names its beat* (2026-10-06):

- **A span as said names every beat it touches.** `'14:00–15:00 tomorrow Europe/London'`, `'9am–5pm Tuesday Europe/London'`, `'13:00 to 18:00 …'`, or two ISO instants joined by a slash. A beat touched at all is in it; the end itself is not; `24:00` or `midnight` ends the place's day; an end before the start falls on the next day. A span always names its place, and more than fourteen days is refused.
  - **Said**, the line lands on every beat, each touched day saved once as one node.
  - **Said empty**, the holder's lines across the span are cleared — the day saved as an object, so the beach replaces it and the day's own line stands.
  - **Read**, every shown mirror's lines across the span come back holder by holder: each touched day's line, then the blocks — a run of beats saying one thing as one block — on the asker's own clock.
  - It is attended at its own rung, the finest address holding every beat, which is where a `keep` lands.
- **A day as said names that day.** `'tomorrow'`, `'Tuesday'`, `'next Friday'`, `'2026-10-13'`: the date read in the place when one is named, on the clock's own UTC day when none is, as `'today'` is. Weekdays and `next` also reach a time: `'4pm Tuesday Europe/London'`.

Nothing is particular to availability in the code: any family on the clock reads a span the same way. A family not on the clock refuses one.

## 4. Where it lands

- `src/temporal.ts`, Layer H: `readWords` (the token reader `readHumanTime` used inline, now shared, with weekdays), `readHumanDay`, `readHumanSpan`, `wallClock`, `wallDay`.
- `src/tools/stream.ts`: `namedRungAddress` falls through to a day; the span path (`spanRung`, `acrossOf`, `sayAcross`) beside the say, the read and the ack; the `at` and `say` descriptions teach both.
- `src/server.ts`: the tool's description names `field='availability'` for when people are free.

## 5. Proof

- `npm run smoke:span`: 64 offline checks — the readers against fixed instants (an hour touching five beats across a gathering's edge, London's whole day touching 82 beats, a beat edge, the night, weekdays and `next`, past midnight in London), and the door against an in-memory beach that keeps the beach's own write rule (an object replaces, a string voices): born locked, the line on every beat, the day line keeping its beats, the read laying two holders side by side, the clear, a keep at the span's rung, and the refusals.
- The same path against the **real beach handler** offline (the clone's `origin/main`, FileRedis): 11 checks, including a wrong key refused at a locked mirror for both the say and the clear.
- `smoke:human-time` 44, `smoke:stream` 50, `smoke:lens` 22, `smoke:parser` 104 unchanged.

## 6. One hand's says, one after another (the same day, #2)

Playing it before handing it showed a fault the offline checks had not asked about. A say rebuilds the node it lands in from the mirror as its call read it, and the beach keeps a block whole, so two says at once to one mirror kept only the later — and an LLM syncing a calendar fires a day's blocks together, as two lanes of one hand say at the same beat. The door now holds one mirror's says in line (`oneAtATime` in `src/tools/stream.ts`, per router process, which is where one session's calls arrive); a say that waited reads the mirror afresh. `smoke:span` fires three blocks and three clears at once (66 checks; without the line the three-at-once check fails), and the real-handler rig the same (12).

## 7. Available unless said (the same afternoon, #3)

David, on the page and the data: *"people are available unless they are actually busy … we don't need 'dumb' methods to block off time."* The law was re-voiced (the first text at `archive:function:availability:2026-10-10`): a line at any rung is its holder out of reach for that period, in their own words; silence is available; nothing reads the words — no hours kept open, no opening word. So a span read now lays out every line whose period touches the span, coarse to fine: the year, season, month, week and day it stands in by name, each gathering it crosses and the beats as runs, on the asker's clock. A holder with none is listed as having said nothing there. `smoke:span` 69, the real-handler rig 12.

## 8. What it does not do

It computes no overlap: the read lays the lines out, and the calling mind finds, with sense, the times nobody's lines rule out (`function:availability` 4 and 5) — no central resolver. It parses no line. Place and project frames, writing from the page and an availability sealed to a group are the scope's *later*.
