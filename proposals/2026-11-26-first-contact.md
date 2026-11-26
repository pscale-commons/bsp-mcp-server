# The first call

26 November 2026 · weft (lane first-contact.1, Claude Code on David's Mac) · at David's word: 'review how orientation works so that we can estimate how long a new LLM who plugs into the bsp-mcp for the first time … We don't want people to wait ten minutes … propose a way to update, upgrade, or completely revise what needs to happen at that most important junction of the FIRST llm-app bsp-mcp query', and, on the review and its prototype, 'Yes, build it'.

## What changes

A bare `pscale_invite` returns ONE envelope composed live from the default beach's own blocks, enough for the opening turn with no further read:

- the welcome's stance, its underscore (`src/welcome.json`, re-voiced);
- what the place is, the lighthouse's underscore;
- its size today and what began lately, from the index (`blocks`, `born`);
- who keeps it: the operator the lighthouse names at 9.4 (the handle before the first dash), their passport's opening and their own line for this week, read from their now;
- the ways in, the lighthouse's 1 to 5 with every line, then 6 and 7 by their opening lines;
- the date the lighthouse was walked (9.1) and how many families have begun since.

Nothing in it is copied or kept, so a first impression cannot go stale. A lighthouse that names no operator at 9.4, or a beach that does not answer, keeps the welcome note as it was. `step=1..6` is unchanged.

Three texts route a newcomer there, in one batch:

- the instructions' ORIENT line, 'Hosting a person or a beach question → pscale_invite.', kept short since a signed connection at another beach must still fit inside the 4,096 characters Claude Code shows;
- `pscale_invite`'s description: the first call, for anyone arriving and for any question about the beach or its people;
- one sentence of `bsp`'s description and its `block` parameter: listing a surface finds a block's name, and a person arriving starts at the invite. Both had called the index 'a newcomer's first act', and that index is now 90,000 characters.

## Why

Measured with 32 clean headless Claude Code sessions, then 16 more against this branch. Each session had only the open connector (`bsp.hermitcrab.me/mcp/v1`), a neutral chat system prompt and no CLAUDE.md or memory, and a hook refused every write to the beach. The questions were:

- what the beach is;
- who David Pinto is;
- what this connector is and what can be done with it;
- the first message /connect hands people: 'Use the beach connector: run pscale_invite and lead me through'.

Each ran on Sonnet and Opus at medium and max effort, one run per cell.

| | today (live router) | one call (prototype proxy) |
|---|---|---|
| answer, medium effort | 7–21 s (median 10) | 8–12 s (median 11) |
| answer, max effort | 74–135 s (median 95) | 23–95 s (median 42) |
| Sonnet, max | 74–97 s | 23–37 s |
| Opus, max | 80–135 s | 48–95 s |
| calls, 16 cells | 78 | 16 |

The beach's own calls took under 3 seconds of any answer. The rest is the model thinking, so effort sets the time.

What the answers said mattered more than the time:

- **The beach was described as quiet.** Asked what it is, the models said the last visitors came in the summer, plus 'a test bot a week ago'. The welcome sent every model to read `marks` at pscale −2 for who had been about. Its newest human mark is from July, and its tail is `claude-pipe-test` entries running to 19 November.
- **The keeper could not be found.** Sonnet at medium could not say who David Pinto is. It listed the index, the result was too large for the client, and it asked 'which David Pinto?'.
- **Nothing recent was named.** No answer mentioned the games, the proposals or anything begun since October. The lighthouse was last reorganised on 5 October, and 175 of the beach's 228 families were born after that.

With the one envelope, every run made exactly one call, and every answer was current: the beach's size, what began this week, who keeps it and their week, and the ways in.

A routing test kept every tool's words as they were and changed only the instructions line. Sonnet at medium still answered from one call. Opus at medium skipped the invite for six passport reads. The max runs went back to listing the index and walking the passport: 8 or 9 calls, about 100 seconds. So the tool wording has to change, in this one batch.

The results against this branch itself are under 'Checked'.

## What does not change

- `step=1..6`, the agent build ladder (`progression`).
- The welcome's moves at 1 to 7. Moves 3 to 7 are word for word; 1 and 2 now point at the first call instead of the marks. They stay readable at `bsp(agent_id='pscale', block='welcome')`, and the envelope names them. The passport recipe the lighthouse points to is `welcome` 3.
- No parameter changes on any tool.

The cost is the wording itself. Two tools change their words, `pscale_invite` and `bsp`, so both go back to asking on every bsp plugin for anyone who had set them to Always allow (proposals/2026-11-23-a-tools-wording-is-its-permission.md). After the merge, set them back to Always allow in each bsp plugin's tool permissions on claude.ai. The change is in `src/`, so the merge redeploys the router and ends every live session: merge at a quiet moment.

## Beside it, on the beach

- **The lighthouse is v3**, re-cut by what a person can do: 1 play, 2 look and answer, 3 put yourself in, 4 meet, 5 upgrade, then 6 understand, 7 the live glances and what is still rough, 8 the doors, 9 its record.
  - Every line is still a pointer to a living surface (exemplars:6).
  - 9.1 carries the walked date, and 9.4 names the operator.
  - 8 and 9.3 are as they were, since the site's go menu reads 8's doors and the play door reads 9.3's disposition.
  - v2 stands whole at `archive:lighthouse:2026-11-26`. v3 was written under the beach operator key, as that key's vault entry says to do when weft's own key is refused on the beach's own blocks.
- **weft's daily sweep names the drift.** It compares the lighthouse's walked date with the newest families in the index, so the compass cannot fall two months behind the beach again (`wake:weft` 6.65).
- **Not done here:**
  - `marks` keeps its test entries, and leaving the welcome takes it off the first path.
  - The tool list is still about 70,500 characters on every request. The orientation review of 9 November proposed moving the RPG and colour detail out of it.

## Checked

- `npm run smoke:invite`, offline on fixtures, in CI: the envelope's parts and their order, nothing invented where a part is missing, no marks named.
- This branch, run locally on port 3099 against the live beach: the envelope in 1.8 s, about 11,900 characters, the operator's line for the week whole.
- The 16-cell matrix rerun against this branch, run locally:
  - medium effort, 7 to 11 s (median 8), one call every run;
  - max effort, median 36 s: Sonnet 19 to 37 s, Opus 36 to 96 s;
  - every answer current, naming the games, the newest families and David's week.
  - For 'who is David Pinto', the max runs then often read his whole card (1 to 10 calls, 37 to 123 s across two runs each). That is thoroughness about a person, after the envelope, not a missed route.
- The final instructions line, after the length smoke (`smoke:door-orientation`) held the instructions to the 4,096 characters Claude Code shows: 'Hosting a person or a beach question → pscale_invite.' Every run's first call is the invite.
