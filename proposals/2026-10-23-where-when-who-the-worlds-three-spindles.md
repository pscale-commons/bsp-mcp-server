# Where, when, who — the world's three spindles in every frame (2026-10-23)

**Status**: BUILT in this PR at David's word, 2026-10-23: *"Yes, wire urb's three spindles into the frame, with the real-time tagging fix and the story-heading change in the same PR, and play it on a throwaway table before you hand it to me."*

## The ask

David, the same afternoon (lane rpg.2): characters operate in game-world time, with temporal coordinates as they have spatial ones; use **urb's sundial**, never a bespoke clock; the time has semantics filled with weather, and it feeds the narrative and the pictures alike; keep it apart from the real-time stamp every call carries. *"Three spindles which give LOCATION, TIME, and IDENTITY. THREE!!!!!! self-contextualising semantic spindles."*

## What stood, and why the frame never read it

- **Location was authored.** `spatial:urb` runs Gal → the Thousand Valleys → Ashitlan → Bizapul → the Seven Valleys Reach → Fern Valley → Lowfen → Brackenfoot (2111111100), and `keeper:brackenfoot` 3 places the scenario there. The composer read only the scenario's own map: the table's placing points at the cartridge, and the urb placing sat in the keeper's register, never followed.
- **Time had a clock.** `temporal:urb` has been urb's one clock since 2026-09-23 (the lattice; the turns at `almanac:urb` 8). No character carried an address on it and no code read it; the September clock work went into bubbles of their own (the clock tables).
- **Identity had a who-is-who.** `almanac:urb` (renamed from `identity:urb` on 2026-09-17). No character carried an address in it.
- **The real clock leaked in twice.** Every beat in the story so far was headed with its wall-clock instant and its age; and because urb's place addresses are ten digits like the sundial's, every read of `spatial:urb` tagged its places as dates — Brackenfoot came back "AHEAD — in 30750 days".

## What changes

**In the router (this PR).**

1. *A world's coordinates are never the real clock's.* `onRealClock(block)` in `src/bsp-fn.ts`: a world's three public registers and their mirrors (`spatial:`, `temporal:`, `identity:`) ride bare; the clock families keep their relations.
2. *The story keeps the story's hour.* Story headings carry no wall-clock instant; where a beat carries its game moment the heading names it ("The first day, dusk"). The make-it-happen and keeper contracts say the hour is the world's clock, never the hour of reading.
3. *Every frame that composes a scene walks the three spindles.* `[WHERE IN THE WORLD]` — the world's map walked from its root to the scenario, through the scenario keeper's placing (keeper 3). `[WHEN]` — the world's clock walked from the age down to the part of the day, at the moment. `who, in the world` — each character's people, walked in the who-is-who from the passport's `Who:` line. Make it happen gets all three and `[THE HOURS AHEAD]`; the telling all three (`[WHO YOU ARE IN THE WORLD]`); the keeper WHERE above the table mark and WHEN below the room mark; a figure WHEN; the shot WHERE and WHEN, so a picture's light and weather are the moment's.
4. *Each table beat carries its moment.* At commit the router stamps field 2 with a star-ref onto the world's clock: one beat after the latest moment these characters lived, read off the record (two who meet, meet at the later; no one is moved back). A closing `WHEN <address>` line, copied from `[THE HOURS AHEAD]`, is the resolution's word that time passed: it leaves the text and moves the stamp. A table not yet begun starts at the first beat of its placing's moment. A story begun before the clock keeps its hour in its own words, the season still riding, until its table's keeper names a present: a `temporal:` star-ref in `keeper:scene` 5, where a newcomer stands in time (the clock tables' FIRST BEAT is the same position). Never in 3: the site's pictures page and the film script read the table's placing line from its end, so it must close on the place.
5. *Genesis writes the Who line* — the sentinel `char-creation` 2, after the Location.

**On the beach (each archived first, `archive:<block>:2026-10-23`).**

- `temporal:urb` — beneath the twelve-thousands (the present), the third air-turn with its Gal weather; its first water-turn (the harvest, the tithe); its first earth-turn; and seven days in Fern Valley, each with its weather and its seven parts. Brackenfoot's two canon days are the first two: strangers at the ford at dusk; the day it breaks, rain from the afternoon through the night (the keeper's stocks are "left overnight, rained on").
- `keeper:brackenfoot` 3 — the story's start on urb's clock beside its place: 12000311150, the first day at dusk.
- `char-creation` 2 at `/w/brackenfoot` — the Who line, with the Gal peoples' addresses.

## Played

`/w/urb-hours-walk-1023` (throwaway, unlisted, set aside), through this branch's composer and commit path against the live beach, on Sonnet 4.6 (the mirror's model): three moments, two tellings, the keeper's frame. Stamps went 12000311151 (the first day, dusk), then 12000311161 (dark, by a WHEN line), then 12000311211 (the second day, first light, by a WHEN line); both lines left the stored text. The beats and tellings carried the light failing at the ford, the fire in the dark, and a grey wet first light with the cloud down on the slopes. No frame held a wall-clock instant. Seen and not caused here: in the second moment the resolver had one character cross the ford against his staged act.

## Open — David's

1. Tables already in play keep their story's hour until a present is named in their `keeper:scene` 5. ANSWERED for `/w/brackenfoot-open` the same day: David chose the third day at first light (12000311311). The record's furthest thread was Ugarth's third morning, Silas's night ended at that dawn, and the smith was not yet in the stocks.
2. Existing characters carry no `Who:` line; their holders add it under their own keys.
3. The turns' counts below the season follow the sundial where `almanac:urb` 8 is silent (seven days, five weeks, three months, four seasons), and Brackenfoot's dating is weft's Author voicing — both his to re-voice.
4. One week of Fern Valley days is voiced; a table that plays past it meets days not yet dated, and the hour then shows only to the week.

## The breath step — the same evening, after the merge

**The fault.** As merged, every committed line stepped the clock one beat, about twenty minutes on urb's sundial. David: *"If people speak to one another and 20 mins passes between each statement... we've just broken the game!"* — and the ask: *"words and blows step a breath by default, the resolver names a minute, a beat or a part of the day when more passes, and play a conversation and a fight on the throwaway table before you hand it."* The real clock stays where it was: field 3's timestamp runs the beach, the game moment at field 2 tracks only the characters, and a second-by-second fight played over an evening is a minute of the world's time.

**What changes (in the router).**

1. *The clock reads to the breath.* A stamp carries the clock's two finer rungs past the floor — the beat, then minute and breath (`12000311221.23`). A commit that names nothing steps one breath; nine breaths fill a minute, nine minutes a beat, and the last breath of deep night turns to the next first light. A stamp written before reads as its first breath (`…211` is `…211.11`).
2. *THE HOURS AHEAD lists a breath first* — what is said, what is struck, no WHEN line — then a minute on, a beat on, and hours: the parts of the day to come, each with its address.
3. *The players' characters set the step* — the finest grain among their acts (grit 6.3); what the place's people do keeps to it. Words and blows are breaths, however much is told around them. A going takes the time of its way; a search, a wait or a sleep names the nearest step that holds it, a wait running to the hour it waits for. In doubt, the nearer: a later moment can carry the clock on, and nothing carries it back.
4. *The close is at most two lines, WHEN then WAY.* The WAY rule's old "ONE LINE MORE" predates WHEN: a going kept its WAY and dropped its time, or wrote the clock's address into the WAY line.

**Played** (`/w/urb-hours-walk-1023`, Sonnet 4.6 on the rig key). Committed through the first cut: three exchanges of talk and two of a fight at the ford stepped one breath each (`…211.12` to `.16`), first light holding throughout; then a ford crossing jumped to Morning — the fault that shaped 2–4. Sampled on one frame, nothing committed, the final wording four times an act: talk, a breath 4/4; blows 4/4; a search, a minute on 4/4; a wait until the afternoon, the afternoon 4/4; a sleep until dark, dark 4/4; a going, a breath or a minute, never a part of the day. The first cut had made talk a minute 3/5 when one of the place's people strolled in the same moment — hence 3. Committed through the final wording: talk `…221.22`, blows `.23`, then a wait to midday — the nearer of the hour it asked for, the telling "all morning". No frame held a wall-clock instant.

**Seen, not caused here.**

1. A going to the next place mostly moves a breath where its way takes a minute — short, and harmless. The way's own time could come from the map (grit 6: the room and the beat), the lattice's correspondence of place and time, whose rulings wait at task:weft 22.
2. The opening race in the liquid buffer. A stage that opens a window rebuilds the whole buffer (`stageLiquid`: "two simultaneous openers can race this whole-block write — last wins … revisit if observed"). Observed: the doorman's figure, staged as it answered a fold's bell, won the opening over a player's stage made at the same moment, and the player's act was missing from the next resolution. From a harness in London the window is about a second; through the router on Railway, tens of milliseconds. Left for its own lane.
