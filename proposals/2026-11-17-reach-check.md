# The reach check: one act at any place stays small enough for a small mind

weft, lane pocket.nav.1, 17 November 2026, at David's word on 16 November ("go with the proof plus reach check"; push access given on 17 November). Thread 52, `spine:navigator` 1.11111.

## What

The proposal battery's family battery gains two tests, run over every place of every family:

- **POINT**, a WARN: one line of more than about 600 tokens. A small mind reads a place whole, so a place stays a place, and the rest nests beneath it.
- **REACH**, a WARN past 2,048 tokens and a FAULT past 4,096, a small model's whole window: the largest single act at any place in the family. A family within both is noted with its largest act.

An act is what a small model on a phone or in a browser is given to act at one place:
- about 900 tokens of the navigator's own words, the chat's frame, the ask, room for a reply, and the way's opening and the step at hand;
- the law's opening line;
- the path down to the place, as titles;
- the place itself;
- up to nine lines beneath it, as titles.

Tokens are counted at four characters a token, so the check needs no tokenizer. Gemma 4 E4B's own tokenizer counts this beach's prose at 3.94 characters a token over every line of the 46 families listed on 16 November (stash:weft 115).

## Why

The rule the navigator measure found (`spine:navigator` 1.11): mass may grow without limit, and reach must not. A family whole is a median of 7,440 tokens and up to 55,135, so it is never read whole. One act at one place is a median of 1,212 and at most 3,581, which a phone's 8,192 holds. What breaks reach is not depth but over-long single lines. The battery now says where they stand, so a family can grow as large as it likes while every act in it stays small.

## What it found (17 November 2026, every family on the list, family battery only)

- 47 of 48 families: every act within half a small window, noted with its largest.
- One WARN for REACH: `pocket-beach` 1.1111787197, about 3,478 tokens.
- Fifteen WARNs for POINT: `pocket-beach` 8, `leros-on-the-commons` 4, `weft-bee` 2, `leros-phase-three` 1.

No fault anywhere comes from the new tests. The two families not well formed (`code-as-blocks` TITLE, `leros-phase-three` STATE) were not well formed before.

## Changed

- `proposal-test-materials/proposal_form.py`: the tests, at the end of `check_family`, with their constants.
- `proposal-test-materials/mutation.py`: four planted faults, one for each level each test reports (95 in all).
- `src/proposal-test.json`: the two tests named at the family's branch, 1.9, and the planted faults counted at 7. This is a sentinel in `src/`, so the merge redeploys the router and ends live MCP sessions.
- `proposal-test-materials/README.md`: the family row names POINT and REACH.

`run-proposal-tests.py` passes: 95 of 95 planted faults caught, and the block and the code agree.
