# The clean mirror — the character's thread is the narration, the mirror holds the situation, a move comes from words (2026-09-17)

Lane rpg-mirror.4 (weft; Claude Opus 5 in Claude Code). Extends
[2026-09-15-the-table-in-the-mirror.md](2026-09-15-the-table-in-the-mirror.md). Coordinated with the o-page
lane through the shell: `watch:weft` 398.51 (this lane) and 399.51, 399.52, 399.54 (theirs).

## 0. David's words, which set the bar

> "I do not know whether the player even needs to know 211 — they are just playing in the urb world,
> maybe brackenfoot scenario … And all the room changes is done in the background. How clean can the
> mirror interface get? Just a string of narration to the character — and reading what others put up as
> liquid in the vicinity and vapour text too of friendly player-characters."

His rulings the same afternoon:

1. **A move comes from words:** "yes from words — like magic!"
2. **History is the narration:** the rendering of each beat for the character. Without an LLM, history is
   the resolution.
3. **The situation belongs in the mirror, not in drawers or dropdowns:** "We have the bottom right toggle
   which cycles through character/mirror/agent — so i guess it can be shown in the mirror?"

## 1. The surface at a table

A table is a directive room: a pool whose underscore mounts the law. Commons pools and parlours are
unchanged by everything below.

### 1.1 The character's thread is the narration

With the hinge on the character, the thread shows each moment as the character lived it: the rendering of
the beat, in order. A raw beat stands in the thread only where no rendering covers it, because no key was
held or the rendering has not landed yet. It never stands beside a rendering that tells it.

The thread carries no situation panel, no ways, no cast list, no record and no addresses. The place, who is
here and what just happened reach the player the way they reach the character: inside the narration.

### 1.2 Its foot: what others nearby are saying, and who is typing

Beneath the narration and above the line:

- **Liquid:** each co-present character's line, said and not yet happened.
- **Vapour:** a friendly player-character typing live.

Both already stand there. "Friendly" means everyone at the place today; nothing records a party yet.

### 1.3 The mirror's thread: the voice, and the situation at its foot

With the hinge on the mirror, the thread is the conversation with the voice. At its foot, just above the
prompt where the eye already is, stands the situation:

- the place in its own words, with its fixtures
- who is here, by appearance, at both grains
- the ways, each still a door to tap for a player who prefers tapping
- the room's record: the public beats, the ledger, folded
- the address, one step away for authors and tests, with the invite link

Nothing needs scrolling to the top. The mark on the chip says when the other thread has something new.

A player without a key still reaches the situation. At a table the mirror's context is offered to every
player; only asking the voice needs a key, and the box says so.

### 1.4 The hand

The hand is one line with two acts, **say** and **make it happen**, as #306 built. A keyed player's act is
always resolved (#318).

## 2. A move comes from words

"I head up the track to the village" is an act like any other: the player stages it and makes it happen.
The resolution already judges whether it happens. It now also says where the character ends up:

- **The voice's input** gains **[THE WAYS]**: the envelope's own ways, each with its address.
- **The call's contract** gains one instruction. When the act takes the character away along one of THE
  WAYS, and the moment lets them go, the answer ends with a last line `WAY <address>`, copied exactly from
  THE WAYS (grit 1.51, never a guessed digit). The line is for this player's own character only;
  companions move by their own words.
- **The surface** strips that line before the claim, so the public beat never carries it.

Once the claim lands:

- **The resolved beat is the leaving beat.** The surface walks the rest of the four steps under the
  character's key with `executeMove`: the position written, read back, the destination room founded if
  absent, the arriving beat.
- **The mirror follows the written position.**
- **An address outside THE WAYS moves no one.** The player is told in play-words that they stay where
  they are.

The move stays the player's hand (grit 1.5): their words direct it, the resolution judges it, and the
surface writes it.

- **Same act on the page.** A tapped way on the o-page (no LLM) ends in the same four writes, as the
  o-page lane builds.
- **No change to the law.** The WAY line belongs to the surface's call contract, which is the answer's
  shape, not a rule of the room.

## 3. History is the narration: what the mirror reads and writes

The mirror already writes one rendering per beat (or per batch) to the character's account, located
`pool:<room>:<slot>`. The account is `history:<handle>`, or legacy `witnessed:<handle>` until it is
renamed. Two changes:

- **The thread reads every rendering the account holds for the room**, not only the newest. A reload, or
  a second device, shows the whole narration rather than the last moment.
- **Coverage is honest.** A rendering made in the open tab knows the batch it told, so it replaces exactly
  those raw beats. A rendering read back from the account knows only its last slot, so it replaces that
  beat alone, and any earlier untold beat stays visible. Nothing is hidden that no rendering narrates.

The o-page lane owns:

- the shell-genome 6.12 amendment (history is the rendering)
- stash as the only place a player keeps anything
- the rename of Ugarth's `witnessed`/`knows` to `history`/`stash` under his key, at David's go

The mirror's `journalOrganFor` already prefers `history` the moment it stands.

**One renderer per beat** is `bsp-mcp` #384, merged. The doorman renders only while its player is not
present. The mirror heartbeats its player; the page does not.

## 4. Not in this build

- the header's room chip (the address stays there for now; §1.3 makes it redundant for players)
- companions travelling together (grit 1.53)
- a party
- a narration carried across rooms (the account is located per room; the thread shows the room stood in)
- names for places, which come later from identity holds and the player's own mirror

## 5. Build and checks

- **`xstream-bsp`:**
  - `render-account.ts` `accountRenders`
  - `make-it-happen.ts` `wayOf` and the ways in `foldInput`
  - `law.ts` `happenDirective` with the WAY instruction
  - `hinge.ts` contexts at a table
  - `Mirror.tsx`: the character thread as narration, the situation moved to the mirror thread's foot, and
    the move after a landed claim
- **Pure decisions** pinned in `smoke:table-mirror`.
- **Verified keyless on `/mirror`** at brackenfoot-open, where a keyless visit writes nothing. The keyed
  paths (a resolution, a move from words) spend a model call on a player's key and are David's to play.
