# What a person pays for — the keeper's own mind, a frame laid to be kept, and one place to see every cost (2026-09-21)

**Status**: §2 is BUILT in this PR (David, 2026-09-21: "add a keeper-only model setting,
haiku, and caching"). §3–§5 are a DRAFT for the keeper's ruling — his question the same
evening: *"we must think very carefully about where these settings are discrete and
accessible… an aggregator for all the potential costs they are incurring."* Nothing in §4 is
built.

## 1. What prompted it

David played Ugarth out of the Brindled Sow at 17:33Z and met three voices in the window —
the keeper's pass (#395), new to him. Traced that evening (watch:weft 436): the keeper runs
after **every** landed beat wherever an enrolled character stands, on the largest frame at
the table (≈16k tokens at the Green), on the mind the holder chose for their *character's*
voice (Ugarth's dial: sonnet), paid from the holder's deposited key, with no switch, no
cache, and no line in any journal. His words: *"It's starting to build up."*

## 2. Built here

**The keeper wears its own mind.** `WAKER_KEEPER_MODEL`, default `claude-haiku-4-5`. It never
falls to the dial's general mind: a holder who wants a sharper world says so.

**One mind per act, where the holder says so — beneath position 7, not beside it.** The dial's
nine positions are all taken, so nothing is added to the fan. Position 4 already keeps "named
exceptions" as digit children (`<ringer> <seconds>`); position 7 now keeps them the same way:

```
7   sonnet — the mind that answers here …
7.1   keeper sonnet — I want the world sharp
7.2   render haiku 900
```

`<act> <mind> [ceiling]`, acts `keeper`, `render`, `commit`, `act`. An act not named keeps 7's
own word; the keeper, not named, keeps the cheap default. A dial that stands as a plain line
reads exactly as before. New dials' position 7 says so in its own words.

**The keeper's frame is laid to be kept.** A prompt cache is a prefix match, and the volatile
story rode first, so nothing could be kept. The router now lays the frame TABLE (the keeper's
register, the world's rules) → ROOM (the place held, who holds it how) → THE MOMENT, with two
lines saying where each ends — true words to the mind reading them, and the keyed lines the
doorman splits on. The three-section contract every door relies on is unchanged; a door that
does not know the marks sends the frame whole. The doorman sends the law and the two stable
parts as system blocks closed by cache marks. TTL one hour (`WAKER_CACHE_TTL`): a table's
beats come minutes apart, so the five-minute cache would be re-written at most beats.
`smoke:tiers` pins that a beat later nothing kept has moved by a byte, and that another room
of the same table keeps the table's part.

**Three things the replay found, fixed because haiku is not viable without them.**
Measured on the live frame at the Green, composed read-only, rig key:

| | usable passes | told the scene in prose | output tokens |
|---|---|---|---|
| haiku, frame as it was | **1 / 5** | 4 / 5 | 300–900 |
| haiku, frame closing on its act | **5 / 5** | 0 / 5 | 120–180 |
| sonnet-5 as it runs live (thinking unasked, 1200 ceiling) | **0 / 1 — wrote nothing**, billed 1200 (the two live passes at 17:33 did write: it is intermittent) | — | 1200 |
| sonnet-5, thinking off | **3 / 3** | 0 / 3 | ~170 |

- *The frame closes on its act*, as a sheet's already does ("You are keeping X's sheet."):
  intentions not outcomes, the shape alone, and a standing voice keeps its label. Without it
  haiku took the story's last beat as its cue and resolved the moment itself.
- *The keeper's calls are asked plainly.* Sonnet 5 thinks unless told not to; under the
  keeper's 1200-token ceiling it spent the lot thinking and wrote nothing — billed and silent,
  the world left as it was. It does not happen every pass (17:33's two wrote), which is what
  makes it easy to miss. **That exposure is in the live keeper today.** `plain=True` sends `thinking: disabled` to
  the minds that think unasked, for the keeper's two calls only.
- *The same person keeps the same label.* A window slot is keyed by its author, and haiku
  drifted ("soldier at fence"). The parser forgives a line's dressing (bold, a list dash, a dot
  after the keyword), and a label whose words all sit in exactly one standing label takes it.

Secrecy held on both minds: of 34 proper nouns standing only in what the keeper holds, none
was ever staged. Cache reads were counted by the API on every call after the first (11,043
tokens on haiku).

**What a pass costs** (the API's own counts; list prices, Haiku 4.5 $1/$5, Sonnet 5 $2/$10 per
million, cache read 0.1×, hour-long write 2×):

| the keeper's pass at the Green | cost |
|---|---|
| as it ran at 17:33 — sonnet, no cache, thinking on | ≈ 3.2¢ in + up to 1.2¢ out |
| now — haiku, first pass of a sitting (writes the kept frame) | ≈ 2.8¢ |
| now — haiku, every later pass within the hour | **≈ 0.8¢** |

The keeper's log line now closes with its mind and the counts.

## 3. Does the holder control cost? — where each cost is set today

| what runs | whose key | which mind | where it is set |
|---|---|---|---|
| the mirror: the resolution, the arrival, the telling, the voice | the player's own key in the mirror (or the host roster) | `claude-sonnet-4-6`, **hardcoded** (`kernel/beach-session.ts`) — an older, dearer Sonnet | **nowhere** a player can reach |
| the doorman away from the table: render, commit, act | the holder's deposited fuel, else the beach's standing key | dial 7 — now per act | `wake:<handle>` 7, 9 (behaviours), 2 (daily cap), 8 (span) |
| the keeper + the holds, after every beat | the same fuel, of the first enrolled character in the room | haiku, or dial 7's `keeper` | `wake:<handle>` 7.x — **no off switch** |
| a lite doorman / a genus pulse at the apex | the same precedence | dial 7 | `wake:<handle>` |
| narration aloud on /page and /group | the player's own OpenAI / ElevenLabs key, in the page | the page's own | the page |

So: yes for the doorman and now the keeper — the holder names the mind and sees what it
produces — and **no for the mirror**, which is most of what a present player spends.

## 4. The aggregator — proposed, not built

**There is no roster page.** Three partial things stand: `/rpg` lists each table's characters
from the table's own index; the mirror's Doormen card lists the doormen of the handles *this
device* has been; and `vault:<person>` (ruled 2026-09-15, "go with the vault") would make the
list travel — the mirror never built its half.

**The ledger is the first stone, and it is missing.** `daily:<handle>` journals one line per
rung wake with its funder — but **the keeper's passes are not journaled at all**, and no call
anywhere records what it counted. A costs page built today would be blind to the largest cost.
Proposed: every doorman call journals its mind and the API's counts, the keeper's included.
To rule: the dial's daily cap counts journal lines, so keeper lines must either be marked as
outside the cap or the cap must come to mean spend rather than wakes.

**One o-page, read-only first** — *what I hold, and what each is costing me*. For each handle
the device knows (the vault, when the mirror keeps it): where it lives, whether a doorman
stands for it and who fuels it, its dial in plain words (switch, cap, the mind per act,
behaviours, span), and today's and this week's counted spend from `daily:`. Each setting is a
link to the block position that holds it — David has a block editor; a second set of controls
would be the overload he named. The mirror gains **one line** on its Doormen card pointing
there, and the two settings a present player actually needs: the mirror's own two minds.

**Not proposed**: a settings panel in the mirror; a per-beat price tag in the thread (a
whisper in the drawer at most — a price on every beat is a notice, and the play model refuses
notices).

## 5. Noted

- The keeper runs only where a doorman is enrolled with fuel; a table of LLM apps has none.
- `ways:doorbell` 1 names dial positions 1–6 only, and its branch 3 ("every wake burns the
  beach keeper's key") predates holder fuel. Law-class; to true up once §4 is ruled.
- The medium and soft frames could be laid stable-first the same way — for the doorman away
  from the table, and for the mirror on the player's key, where most of the money is.
