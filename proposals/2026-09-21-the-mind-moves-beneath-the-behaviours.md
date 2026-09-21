# The mind moves beneath the behaviours — position 7 of a dial is the flow switch's alone (2026-09-21)

**Status**: the code rides this PR on David's ruling, given the same evening: *"Ok, move the
doorman I guess, if that's possible."* The one beach-side law text (§4, `ways:doorbell` 1) is
given here verbatim and is written **after the merge**, the standing text archived first.
**Lane**: costs (watch:weft 446, 448). A second lane, dial-7.1 (watch:weft 447), was opened
on the same collision as this was being built; it is told at 447.1, and adds two facts
recorded below.

## 1. The collision

Position 7 of a dial (`wake:<handle>`) had two live readers:

| reader | reads 7 as | since |
|---|---|---|
| `src/flow.ts` `flowSwitch()` — and the writers `src/tools/genus.ts`, the mirror's DoorbellCard | **the flow switch**: true when the line starts `on` ("on — publish my window composition to flow:<handle>…") | bsp-mcp #362, 2026-09-15 |
| `genus-one/waker.py` `Dial.answer_with` — seeded into every dial at enrolment | **which mind answers**: the first word a model's nickname or id ("sonnet — the mind that answers here…") | the dial-model lane |

Both parse the same shape (a string, or an object's underscore). Live: `wake:egg-one` 7 reads
`on — publish…`; `wake:Ugarth` 7 reads `sonnet — the mind…`. Given a lite or character wake
for a genus handle, the waker would have asked the API for a model called `on`. Found when
the first cut of `/models` offered model buttons on egg-one's row — a press would have
overwritten its flow switch (it was not pressed).

**The dial's own law does not decide it**: `ways:doorbell` 1 names positions 1–6 and stops.
7, 8 and 9 are law nowhere but in `waker.py` and the dials' own seed text (dial-7.1's finding).

## 2. The ruling, and why that way round

The doorman moves. A genus agent's dial is its own — moving its switch means a keyed write
to a living agent's block, which is not ours to make; the doorman's line is a service
convention its holder edits. And the move needs no dial rewritten: the waker goes on hearing
an old line at 7, only where 7 *is* a mind.

## 3. Where it moves — beneath position 9

The dial's nine positions are all taken, so the mind **nests**: beneath **9, the doorman's
behaviours** (render, commit, act — the very acts a mind is chosen for), as named lines in
the idiom position 4 already keeps ("named exceptions beneath"):

```
9      render commit — this doorman's behaviours…
9.1      mind sonnet       ← every act, unless one is named
9.2      keeper haiku      ← the world's hand, after each moment
9.3      render haiku 900  ← one act, with a ceiling
```

- **Read**: beneath 9 first; then an old line at 7, only where `Dial.is_mind` — its first word
  a nickname, a tier or a `claude-` id, or its prose saying it is the mind. A switch, a note, a
  pointer at 7 is not the waker's to read. What stands beneath 9 outranks 7.
- **Written**: `set_answer` writes `mind <x>` beneath 9. New dials seed nothing at 7.
- **The tiers** `/models` offers — basic, medium, advanced — are words the doorman knows.

**Two traps, both fixed with it.** (a) A write at a node *replaces* it, and both writers of 9
— the waker's `set_behaviours` and the mirror's DoormenCard toggle — wrote it as a plain
line: a behaviour toggled would have wiped every mind beneath. Both now send 9 back whole
(`nine_with`; xstream #346 `nineWith`). (b) The doorman reads the words before the **first
dash** of 9's underscore as the behaviours (`dt.parse_behaviours`), so a 9 founded where no
doorman stands must not open on prose that says "every act" — `/models` opens it
"models — …" (happyseaurchin-home #302).

## 4. The law text — `ways:doorbell` 1, after the merge, archive first

> **stands**: "…5 refractory seconds, 6 the pointer to its pulse journal (daily:<handle>). The
> state word a door should show…"
>
> **to stand**: "…5 refractory seconds, 6 the pointer to its pulse journal (daily:<handle>),
> 7 a genus agent's flow switch (on = its composed window is published to flow:<handle> at
> every keyed wake; nothing else reads 7), 8 the span a character's doorman waits before it
> folds a ripe window, 9 that doorman's behaviours (the words before the first dash: render,
> commit, act, every) with the mind each wears named beneath ("mind sonnet" for every act,
> "keeper haiku", "render haiku 900"; a mind still written at 7 by an older dial is heard
> only where 7 is a mind). The state word a door should show…"

`ways:doorbell` answers to weft's operational lock (its root latch, checked offline against
the stored lock map on 2026-09-21 — no live try). Its branch 3 ("every doorbell wake burns the beach keeper's
key") also predates holder fuel; trued up in the same write.

## 5. Checked

`test_doorman` 154 (12 new): the new home wins; a flow switch at 7 is not a model called "on";
a behaviour toggled keeps every mind beneath; a nested dial is walked to where it stands.
The page's bodies, sent to throwaway blocks on the live beach, were read by both doormen —
today's through the line `/models` keeps in step at 7, this PR's beneath 9 — behaviours
unchanged in both. Merge order #413 → xstream #346 → happyseaurchin-home #302; any order is
safe.
