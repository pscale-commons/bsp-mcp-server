# A time names its beat — "book a meeting for 4pm", said once, lands right

> **Status.** RULED AND BUILT 2026-10-06 (weft, through Claude Code, the tidying.19 lane), at David's word: *"we definitely want a translation from eg 4pm into the right location. I want to be able to say to llm-app or mirror to book a meeting for 4pm and it does it correctly."* The router's half is here; the mirror's half is xstream-bsp `src/kernel/named-rung.ts`, and the site's "show times" switch is happyseaurchin-home `theme.js` — three doors, one rule.

## 1. The fault

On 5 October David was meeting Pete of venture.community at 4pm and asked how beats refer to hours. The answer was a fixed rule, but a rule that has to be applied by hand is an error waiting to happen. The clock is the UTC day cut into nine gatherings of 2h40m, each cut into nine beats of about 17¾ minutes. A person's 4pm sits at a place whose offset summer time moves. 4pm in London on 5 October was 15:00 UTC, so afternoon beat 6, `2026411566`. Every door asked for that sum to be done by whoever held the words, and the sundial itself says the one operation an LLM reliably botches is exactly this mixed-radix arithmetic (sundial 4).

## 2. The rule

**A time as a person says it names the beat it falls in, read in its place.** The door does the sum, as it already does for `today`:

- the words come in any order: a date (`2026-10-07`, `today`, `tomorrow`), a time (`16:00`, `4pm`, `4:30 pm`, `noon`) and a place (`Europe/London`, `+01:00`, `UTC`); or they are one ISO instant with its offset (`2026-10-07T16:00+01:00`);
- with no date, the day is **today in that place**, not in UTC: past midnight in London it is already tomorrow there;
- **a time always names its place.** The clock keeps no time zone (sundial 8.3), so the place travels with the words, taken from where the person stands. A door that knows its own device (the mirror, in a browser) supplies the device's zone; the router knows no device, so it refuses a time without a place, in words that teach;
- words that are not a time (a digit address, a comma-walk, a named rung, prose) fall through untouched.

## 3. Where it lands

- `src/temporal.ts`, Layer H: `readHumanTime(words, now, devicePlace?)` returns the beat's address, the instant and the place, and `spanInPlace(addr, place)` returns the beat's edges on that place's wall clock. It is pure apart from Intl's zone tables (Node carries them whole).
- `pscale_stream_engage`: `at` accepts a time (`namedRungAddress` falls through to it). The ack says the beat back on the place's own clock: `at 2026411766 (4pm tomorrow Europe/London, its beat 15:49–16:07 there — Wednesday 7 October 2026, afternoon (beat 6))`. A booking therefore reads true, or plainly wrong, before anyone relies on it.
- The tool's description and its `at` field teach it, so an LLM app books by saying the meeting at its time in the now family. An address ahead of now is an intention (the clock's own law: AHEAD is intention).

## 4. Proof

`npm run smoke:human-time` runs 44 offline checks. They cover the spoken spellings; London on GMT in December and on BST in July; New York; a half-hour offset; "today" past midnight in London while it is still the 6th in Los Angeles; a time without a place refused and written nowhere; the device's place supplied and outranked by a place in the words; a dozen non-times falling through; and the door end to end, booking `4pm tomorrow Europe/London` into `now:<handle>` at its beat.
