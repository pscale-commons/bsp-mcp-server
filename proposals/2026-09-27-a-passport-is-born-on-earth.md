# A passport is born on Earth — its Location line starts at the root, and the person makes it finer (2026-09-27)

**Status**: ruled by David, 2026-09-27, in session (tidying.16): *"He can put however precise pscale he
wants. That's the point. Passport should by default have 30000000000 as a location. Please ensure this
is part of the advice given for passport creation. So the user can say country, or town, or street, or
house or specific room should they wish."* `char-creation` at the earth beach is copied to
`archive:char-creation:2026-09-27` before its position 2 is re-voiced.
**Lane**: watch:weft 469 (tidying.16).

## The rule

A passport is founded with its position 3 carrying

    Location: *:https://earth.beach.happyseaurchin.com:spatial:earth:30000000000 — Earth

so the person is on the globe from the first moment, at the root of the real. Saying where only makes it
finer: a country, a town, a street, a house or a single room, as precise as they choose. If they would
rather not say, it stays at Earth. The precision is theirs and the digits are the assistant's work
(`char-creation` 2 at the earth beach), exactly as before.

## Where the advice lives, and what changes

| surface | change |
|---|---|
| `src/welcome.json` 3 (`pscale_invite`: an assistant hosting a newcomer) | "A PASSPORT IS BORN ON EARTH" now opens the where-offer. The disclosure choice reads country, town, street, house or room, with Earth kept if they would rather not say. Their answer replaces the Earth line. |
| happyseaurchin.com/welcome (`welcome.html`, the one place the site founds a passport) | The founding write carries the Earth line at 3, and the door's copy and landed link say so. Site PR: happyseaurchin/happyseaurchin-home#322. |
| `char-creation` 2 at earth.beach.happyseaurchin.com (the earth door: how the line is written) | Same rule, archived first. |

## What does not change

- **Passports already standing keep what they carry.** Each is its holder's own, and no keeper writes one. A passport founded from today is on the globe at Earth. One founded before appears once its holder adds the line.
- **The census reads a line at any grain, Earth included.** It names the people at a rung only while two dozen or fewer stand under it, so once more than 24 stand at Earth, that rung shows a count.
- **Game characters are not affected.** They are placed in their own world's map at genesis (`character_genesis`), not on Earth.
