# The live edge — one law at every door, the world's answer inside the beat, and places written from nowhere (2026-09-17)

Lane rpg-mirror.4 (weft; Claude Opus 5 in Claude Code, keyed). David played Ugarth at
`/w/brackenfoot-open` pool:211 through mirror.onen.ai and brought three things back. Each one
was traced on the live table before anything was changed. Each turned out to be a fault in
how meaning flows between blocks, not in one module. The record: `watch:weft` 398.

## 1. What was met, and what it actually was

**The toggle flicked him away from his answer.** He asked the mirror whether Astrel was
following. The mirror started to think, and then the page moved him to the table view with
a dot on the chip. The answer was waiting back in the mirror thread. Cause: the voice uses
the play door to *look* as well as to *go*. Every call to that door ran `enterWorld`, and
`enterWorld` always put the hinge back on the table. So a look at the room he was already
in counted as arriving. This also re-opened the F16 fault: the next line he typed for the
mirror would have gone to the table as vapour.

**"You're on the far bank now."** This was not a mechanical fault. Ugarth's passport places
him at `spatial:brackenfoot:211`, the crossing, which is the Slip's only room. Crossing a ford
you can talk across happens inside one scene, so it rightly did not count as a move. The fault
was in the words. `211.2` put the watch "by the little fire on the *near* bank", which is near
to someone who came up the good road. For anyone who came down from the village, that bank is
the far one. Two rooms would have been the wrong fix: they would split one scene and leave a
character who had crossed unable to hear the watch. The right fix is that a place names its own
features, and each reader works out "near" and "far" from their own beats. The same fault stood
at threshold 213 and 420 and at hollow-king 312.

**The moment ended with him waiting.** After "Sword hand… and that one is with me," the render
ended: *"you wait to see if the watch has enough wakefulness left in him to argue."* Three
causes were stacked behind it:

1. *The law never reached the voice.* GRIT 1.2 already said a render is "closed in-fiction by
   inviting what the player does". But the mirror handed its voice `PERCEIVE_DIRECTIVE`, a
   paraphrase in code that had lost that clause. The doorman had ported the same paraphrase
   into Python, so there were three texts of one law. The envelope could not carry the law
   either: it delivers the law in full at a seat's *first* engage and only points to it
   after that, and every render is a fresh, stateless call.
2. *The world's answer had nowhere public to land.* When one player acted alone and named no
   one else, "make it happen" committed their line exactly as typed. A line spoken to a
   standing figure names nobody, so Ugarth's question landed on its own. The watch's reply
   existed only in one private render (`witnessed:Ugarth` 5: "What's your trade?"). The next
   render of the same beat, by the doorman (entry 6), had the watch say nothing. So the
   account held two moments that contradict each other, and the pool held neither.
3. *Two renderers raced.* Ugarth's doorman is set to `render commit`, so it rendered every beat
   while the player was sitting in the mirror. The mirror shows whichever render reaches the
   account first, and for slot 5 the account holds only the doorman's.

## 2. What changes

**The law (this PR).** The spine stays within its ratchet: 1,448 words against a limit of
1,450. New law was added by pushing detail deeper and by replacing words, not by adding to
the delivered spine.

- `grit 1.2` now ends "…ending on its live edge". The new `1.26` says: close on what the player
  can act on, never on the character waiting. `1.261` says what a live edge is. `1.262` says
  waiting is the seat's discipline and must not leak into the fiction (with the Slip as its
  worked case). `1.263` is OFFERING WAYS: two or three things the character could plainly do
  next, offered in the fiction's own words. It applies when a player is new, stalled, or asks,
  or when the room's convention asks for it. What that convention's dial is called belongs to
  the frame proposal (#379).
- `grit 1.72` is now "Render the moment, voice the world's answers, then stop." The old "and
  wait" is dropped.
- `grit 1.444`: THE REPLY BELONGS TO THE ACT. A figure's answer that exists only in a render is
  heard by no one else. Where a surface lands a player's words as typed, the world's answer
  still has to be committed.
- `grit 1.171`: the place names its features the same way for everyone who arrives. Where you
  stand inside the scene is what your own beats have made it.
- `grit 1.22` → `1.222`: the clause "absence only from a read fetched after your beat landed" is
  moved one level down. 1.8 already says it on the spine, and moving it frees the words the
  live edge needed.
- `world-genome 2.11`: THE PROSE STANDS NOWHERE. Name positions by the place's own features,
  never near/far, left/right or ahead/behind.

**The mirror (xstream-bsp, `claude/mirror-reads-the-law`).**

- `kernel/play/law.ts` reads the law the room's underscore mounts, once per page. For each act
  it hands the voice the spindles at that act's addresses, exactly as a seat dialing them would
  read them. The render gets `1.1` and `1.2`. Make-it-happen gets `1.4`, `1.6` and `2`. The code
  keeps only what belongs to the surface: what is put in front of the voice, the dice the voice
  must use, and the shape of the answer it hands back. `PERCEIVE_DIRECTIVE` stays for the
  legacy column only, and `FOLD_DIRECTIVE` is removed.
- A keyed hand's act always passes through the voice. Whether an act touches anyone is for the
  voice to judge, not the hand. A lone line that touches nothing comes back unchanged.
- The door moves the place, never the hinge. A look changes nothing. Arriving somewhere new while
  the person is at the mirror puts a dot on the table instead.

**The canon (done on the beach, each block archived first as `archive:spatial:<world>:2026-09-17`
and verified byte-equal).**
- brackenfoot 211 now names *the road bank* and *the village bank*, and 211.2 puts the watch's
  fire on the road bank.
- threshold 213 now reads *the mill bank* / *the east bank*, and 420 reads *one bank … the other*.
- hollow-king 312: *the second ladderway, across the sump from the winze's foot*.

## 3. For the doorman's lane (intake at `watch:weft`)

The doorman should read the same law at the same addresses, and drop its ported constants. It
should also stop rendering for a player whose own surface already renders: the mirror has eyes,
a page does not. Until that lands, a player testing the mirror should switch their doorman's
render off, or the race described in §1 decides which render they see.

## 4. What this is not

It is not a new block family and not a new tool. There is no convention key for offering ways
yet (#379 is where it belongs). Track B, which uses stream and function operators, is untouched.
Any `function:` room mounts its own operator, and the mirror reads that operator at the same
addresses. Where the operator holds nothing at those addresses, the mirror says so and does not
fall back to a paraphrase.
