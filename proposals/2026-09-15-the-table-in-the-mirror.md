# The table in the mirror — one hand, two phases, the room's law deciding (2026-09-15)

**Status**: PROPOSAL, ruled in conversation (David, 2026-09-15: the chip rather than a
divider; the narration inline beneath the beat; one mirror, no skin) — for a fresh session
to build. The substrate is untouched; no primitive, no block family, no daemon; one
Author's edit to a canon text. Companions: the round at `log:urb-hitl` 7 (David as Ugarth,
Julie as Astrel, brackenfoot-open through the mirror, 2026-09-14); the mirror charter
(`mirror`, limbs 2.2 the hand, 2.6 the ask, 2.7 the body; 1.5 and 4.2 as re-voiced on
2026-09-14); the scope of 2026-09-11 and its amendment; xstream-bsp #303 and #305 (the
directive room in the mirror; the surface follows the door; the one-handle rule).

## 0. What the round showed

Two characters made through the mirror's voice stood in one place and saw each other's
words. Underneath, everything held. On the face, five things (F13–F17 at the log): the
place rendered at the wrong grain and carried an author's note; "land it" was a plain
commit in a room whose law is stage, fold, render; nothing rendered a beat to the player
after it landed; a question to the voice broadcast as vapour to the other player; the
record and the voice's replies shared one scroller. All five are the mirror showing the
loop's organs instead of the loop's face.

## 1. The law this makes visible — the phase shift

At the gate you gather as yourselves (the gate's own text). Past it, the human is the
player and the character does and says nothing the player did not direct (grit 1.7). So a
table has one honest rule: words to the table are the character's; words to the voice are
the person's. Vapour is the character forming a thought, liquid the character's staged
intention, solid what happened. The voice is the aside — the person stepping out to ask.
The mirror lacks only the geometry that shows this.

## 2. One mirror, no skin

The same surface serves a person among people at a commons pool and a character among
characters at a table. What differs is the ROOM'S LAW, read from the pool's underscore (a
directive room mounts `pscale:grit`), never a different UI. The mirror's organs are the
same everywhere — the record, the staged band, vapour, presence, the hand, the ask — and
at a directive room three of them take the room's law: the hand's "land" becomes
make-it-happen (§3.3), a beat in the record gains a private line beneath it (§3.4), and the
ask is the aside. The words on the chip are the same words at any room: "as <handle>" and
"to the mirror" — at a commons pool the first means the person, at a table it means the
character, because the handle IS whoever stepped in. Dice and other instruments belong to
the room's law and can arrive later as a tool array in the mirror frame; that is the
extension point, named and not built.

## 3. The build

### 3.1 The hinge — one prompt, one two-state chip

The prompt is the hinge between the shared record above it and the private conversation.
A chip on the prompt holds one of two states:

- **as <handle>** — Enter stages; ⌃↑ lands (make it happen at a directive room); typing
  shows to the co-present as vapour, as it should.
- **to the mirror** — Enter asks; nothing broadcasts; the reply lands in the mirror
  thread. This closes F16 by construction: a draft in this state never rides vapour.

The default follows the room: a directive room opens "as <handle>"; the gate opens "as
<handle>" too, since the gate's line is yours as yourself; creation runs "to the mirror",
and when the character is written the door moves the mirror to the room (#305) and the
chip reads "as Ugarth". The person flips it with a tap or the existing keys. Not a
divider: a draggable pane makes two scrollers and a body a phone can drag, against the
charter's 2.7, for no semantic gain.

### 3.2 Two threads above the prompt

One scroller. The chip decides which thread stands above the prompt:

- **the table** ("as <handle>"): the situation, the staged window, the record with each
  beat's private rendering beneath it, the machinery folded (dice, bands, addresses, the
  fold's stamps) under the beat as "the room, in addresses" already folds.
- **the mirror thread** ("to the mirror"): asides, creation, the voice's replies, in time
  order.

A small mark on the chip says when the other thread has something new. Nothing is shown
twice.

### 3.3 Make it happen — the hand at a directive room

"Land it" becomes **make it happen**, and its meaning follows the window:

- the window holds only me and my line touches nobody → commit straight, as now (grit 1.34);
- others have staged, or my line is directed at another live character → THE FOLD: the
  voice, as the medium, reads the room's envelope (the window, the per-actor dice, the rules
  the directive names), weaves ONE beat, and commits it with the claim —
  `resolves_window` and `resolves_seen` from `windowOpenStamp` and `windowSeenStamp`
  (kernel/envelope.ts). WINDOW MOVED re-weaves once; ALREADY RESOLVED reads the landed
  fold. The staged lines clear because the store clears them.

The cold open is the first of these folds, so what happened on 2026-09-14 (a solo landing
where the party's arrival should have folded) cannot recur. The staged band speaks its
states in play-words: "waiting for the others", "the others are ready", "yours to make
happen". A keyless player's land commits a plain beat; the fold is a keyed player's (§6).

### 3.4 The rendering beneath the beat

After any new beat lands — mine or theirs, the record's count grows — the voice renders
the moment through MY character: second person, present tense, from my position, names as
earned (the column's PERCEIVE directive, `Column.tsx`; the situated current from
`composeRoomCurrent`). It appears beneath the beat in the table thread, marked as mine
alone, and is journaled to the character's own account when a key stands (the column's
`appendWitnessed`; the legacy names still read). Several beats arriving together render
once. Keyless: no rendering, said once. This is what the player reads; the public beat is
the ledger.

### 3.5 The situation at the right grain (F13)

The panel shows the ROOM's own line and its fixtures on top — the crossing, the rope, the
watch — with the ancestors folded, and never the world's root paragraph. One change in
`RoomPanel`, shared with the column. And one Author's edit under the canon's key: the
structural sentence in brackenfoot's spatial root ("Floor 3: … pscale +2 …") moves out of
the place's prose; the other four canons checked the same way.

### 3.6 Not in this build

Dice or other instruments in the frame; the doorman (its intake at `watch:weft` 341 and 343);
a movable divider; any fantasy skin; any change to the pool, the window, the claim or the
dice; any change to the column surface beyond the shared panel.

## 4. Register — the machinery never speaks

The words on the surface: "as Ugarth", "to the mirror", "make it happen", "waiting for the
others", "yours", "the room, in addresses". Never "window", "liquid", "fold", "resolve",
"stage", "commit", "block" or an address in a player's way. The voice's own prose follows
the same law (F4, F11 at the log): "the beach is asking you" and "your arrival is staged
in the window" are the class to retire.

## 5. Charter

Limbs 2.2 (the hand) and 2.6 (the ask) take the room's law at a directive room, which is
what the keeper's ruling of 2026-09-14 (mirror 1.5, 4.2) already says. Limb 2.7 (the body)
is untouched: one scroller, a fixed shell, the chip one control on the existing prompt. No
limb grows. `mirror` 1.5 is amended when this lands.

## 6. Decisions

Taken (David, 2026-09-15): the chip, not the divider; the narration inline beneath the
beat, not in the mirror thread; one mirror with the same words everywhere, no skin.
Open, recommended: a keyless player's land commits a plain beat and never folds — the fold
needs the voice, and the voice needs a key.

## 7. Verification, before a person

Pure smokes: the hinge's routing (state × key → destination, and whether the draft
broadcasts); the make-it-happen decision (others staged → the fold, else straight);
the render trigger (record growth, batching); the situation grain against a captured
envelope (the terminus line and fixtures shown, the root hidden). Typecheck and build.
A local preview with two browser profiles at the open table. Then the person: David and
Julie again at the Slip, the same opening, and five things to look for — the chip's
words, the cold open folding, the rendering beneath the beat, no vapour from an aside,
the room's own line on top.

## 8. Cost per turn

One fold call by whoever makes it happen; one rendering per character per new beat, on
that player's own key. What the column paid.
