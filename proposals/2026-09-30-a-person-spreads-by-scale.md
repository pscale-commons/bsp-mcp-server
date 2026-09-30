# A person spreads by scale — the people register re-cut (2026-09-30)

**Status**: BUILT the same day as the register it corrects, at David's word ("Go ahead"), lane
visuals.1. `people:brackenfoot` at `https://beach.happyseaurchin.com/w/brackenfoot` was re-cut
(193 lines, floor 3, weft's operational lock); the morning's text stands at
`archive:people:brackenfoot:2026-09-30`. The recipe lines `ways:stills` 6.6 and 6.2 were rewritten,
the text they replaced at `archive:ways:stills:2026-09-30-1524`. On the site, the render page learned
to draw what stands behind an address's zero (happyseaurchin-home #345) and the pictures page learned
to read the register (#346). Nothing in the router or the beach handler changed. This file corrects `2026-09-30-the-people-register.md`, which stays as the record of the
founding.

## 1. What David corrected

The morning's register gave each person one spindle of four rungs — across a yard, at their work, at
arm's length, pressed — one child at each. David, reading it:

> "The .21 is more detail on .2, and then .211 is more detail on .21, and .2111 is more detail on
> .211 — so you are not quite using the method correctly. The point is to spread into different
> details according to spatial pscale, or according to events perhaps. pscale 0 should be the person
> around 1m and around 5-10 mins such as their general description or action, and so pscale −1 is
> parts (10cm?) of the person (or shorter events 1 min), or their clothes (jerkin, or limb like head
> etc), or equipment (eg a sack), and pscale −2 will be more detailed aspects (eg objects in the
> sack, facial expression)."

He was right on the first reading. The chain was four descriptions of the same subject from nearer
and nearer; face and knuckles shared one line, so neither could be addressed, read or changed alone.
Depth that does not fan is not the method.

On what varies:

> "There are a bunch of spindles which describe the character; and when things change by
> author/keeper, the bundle will consist of different spindles OR unfold different text … either
> there are some options on what expression to choose, or what stance they are in perhaps, and this
> is provided as a sub-directory and the conditions will help the llm decide."

And, while the re-cut was under way:

> "The graphic LLM should 'naturally' come up with variations of its own. Like when you create an
> image with a couple of primary characters, it has enough training to fill out the rest — a
> thousand in the background, all unique, in a stadium say. NPCs shouldn't need a reference image …
> only the primary characters, named perhaps, at the start of the scenario."

## 2. The shape now

**Only the scenario's principal figures stand as themselves** — the ten the scenario names: the
alewife, the factor, the reeve, the sergeant, the smith, his wife, daughter and son, the boy on the
Store's day-watch, the charcoal-burner. Each is a digit in the fan of the room they keep, so every
figure sits at the same depth and the disc one step under the rooms is the whole cast.

**Beneath a figure the body spreads by scale**, each step a tenth the size of the one above:

```
121.2     The alewife — a lean woman of fifty, narrow through the shoulder …     the whole person
121.21    Her head — narrow; a grey kerchief knotted at the nape …               a part
121.211   The face — closed; hollow cheeks, thin lips, deep lines …              a detail
121.212   The eyes — grey, deep-set under straight brows.
121.213   The kerchief — undyed linen gone soft and grey …
121.22    Her dress — a dun wool gown, sleeves pushed above the elbow …
121.23    Her arms and hands — forearms thin and corded …
121.231   The knuckles — red, cracked across the joints …
121.24    Below the apron — skirts to the ankle, wooden pattens …
121.25    The cloth — a grey rag, always in her right hand …                     a thing carried
```

The parts keep fixed digits — 1 the head, 2 the trunk and what clothes it, 3 the arms and hands,
4 the legs and feet, then each thing carried at a digit of its own — so a carried thing is a part
and what is in it is a detail (the burner's bag at `222.16`, its contents at `222.161`). These lines
do not change from picture to picture.

**Behind a figure's zero stand its states** — the same body in time. The figure's underscore is an
object (a hidden directory): its own underscore is the figure's line, and its digits are the states.
Each state opens with when it holds and says how the whole person stands; beneath it the body's own
digits say what each part does then.

```
121.202     When a soldier leans on her board, or talk starts that she should not hear —
            she stops where she stands, weight even, and waits.
121.2021    Head level, turned a little aside.                       (the head, in that state)
121.20211   Nothing in the face moves; her eyes go to the board, not to the man.   (the face)
121.2023    Both hands flat and still on the board.                  (the hands)
121.2025    The cloth stopped under her right palm.                  (the cloth)
```

A state's own address is the figure's, then a zero, then the state's digit, so a bundle can name it as
a plain number; a read with a trailing star (`121.2*`) returns them all at once. The words before the
dash are the condition — for choosing, never drawn — and the words after it are the pose.
The digits are the body in space; behind the zero is the body in time, carved on the same skeleton —
the aspect law applied inside a person. This is how "stances of sword holding" are reached: the
state, then the blade's own digit.

**The unnamed are one line each** — the levy's hard-cases (`121.3`), the women at the water
(`161.2`), the men at the stone (`311.1`) — and the line says they are the picture-maker's to invent,
each afresh, no two alike, never from a picture of anyone else. A principal who turns up elsewhere is
a pointer line ending `people:brackenfoot:<address>`.

**A shot** takes the unchanging lines down to the depth its framing needs — the figure's line for one
across a yard, the parts for a figure at full height, the details of whatever the frame comes close
to — and lays over them the one state the moment answers, part on part; when none answers, none is
taken. What the moment's own telling says of a person outranks any state, and where none is taken the
telling poses them.

## 3. Where the numbers land

David's ladder puts the person at pscale 0. In this world's arithmetic the room is pscale 0 — the
scene scale a floor-3 tabletop world chooses (`block-conventions` 4.7), the sundial's beat — so a
figure in a room's fan is −1, a part −2, a detail −3: one lower than his numbers, the same steps.
The register stays on the places register's own numbers because the address is the join (sextant 2):
a moment in `pool:121` finds its people at `people:<world>` `121`.

Every line beneath a figure is kept to 150 characters, because a descent read truncates there; one
call (`spindle=121.2, pscale_attention=-3`) then delivers a whole body.

## 4. Why the states stand behind the zero

Three homes were weighed for what varies.

- **Free digits of the figure's own fan**, as the identity register hangs its group perspectives
  beside the skeleton's digits. Everything arrives in one read, and nothing structural tells a
  stance from a part: a script that cannot read prose would fold "at work", "pressed" and "of an
  evening" into one picture.
- **A child that holds the options.** One digit spent, the options one step deeper than their scale,
  and the child's own line a heading.
- **The zero-position interior.** A state is not a finer part of the person; it is the person, at the
  person's own scale, under a condition — and David's own sentence puts "general description or
  action" at the person's level. The places register already keeps what is true but not always
  showing behind a place's zero (its notes); here it is what shows only when the moment calls for it.
  The split is structural: a plain descent never returns a state, so the constant and the conditional
  cannot be confused.

The cost of the third is one more read per figure (`121.2*`) and a page that could not draw it — the
render page printed nothing at all for a node whose underscore was an object, so the places
register's own faces had been blank there. That is mended in happyseaurchin-home #345.

## 5. Principals only

David's second ruling is the sextant's first line about space applied to pictures — "authored thin:
… the rest is the reading LLM's own world-knowledge". The fault he saw (every soldier with one face)
was a seat reusing one soldier's reference for all of them; the morning's answer individuated three
soldiers, and his is simpler: give the unnamed no reference and no individual lines, and the image
model varies them by itself. So the three soldiers written that morning are withdrawn, the crowds are
one line each, and a reference picture is only ever for the principal it is addressed to — made once,
at the start of the scenario.

## 6. What moved on the beach

| | before | now |
|---|---|---|
| the two soldiers of the settle | `121.31`, `121.32` | withdrawn; the hard-cases' one line at `121.3` |
| the tall soldier | `111.2` | withdrawn |
| the sergeant | `132` | `132.1` |
| the reeve | `133` | `131.2` — the front room, where the identity register stands him at his own hearth |
| the smith | `141` | `141.1` |
| the charcoal-burner | `222` | `222.1` |
| the factor loitering at the well | `161.22` | `161.4`; the smith's daughter there at `161.3` |

No picture had been addressed to any of the morning's addresses; the working room was told at
`pool:onen-rpg` 21.

## 7. The experiment

**States stand for four of the ten** — the alewife (four), the factor (four, the canon's own
"servile to a face, vicious the instant a back is turned" among them), the sergeant (four), the smith
(three). The other six carry their bearing in their own line and wait on whether states earn their
place.

**Two blind reads.** Two fresh readers, each given only the bsp tool, the recipe's address and one
real moment from the open table's record, composed a room shot and a close shot and reported every
address they used. One had the taproom (`pool:120` entry 5: the alewife stops her cloth while a
soldier sounds out the stranger); the other the counting-room (`pool:130` entry 4: the factor, the
sergeant the table calls Vane, and the reeve, with the player's character).

What held:

- Both found the principals and matched them by role across the table's own names ("Sergeant Vane"
  to the sergeant in the room beside; "Reeve Haldan" to the reeve).
- One read (`121.2`, attention −3) returned a whole unchanging body; one star read returned every
  state with its parts — "the best read of the exercise".
- The taproom reader chose the alewife's second state on the telling's own words ("has stopped working
  the cloth … her hands are still"), laid it over head, hands and cloth, and for the close shot took
  it one step deeper to the face.
- The unnamed soldiers were passed to the image model as their one line, with no reference.
- The telling outranked the state where they disagreed (a coin the moment did not have; a fingertip
  that "stays where it landed" where the state had it tapping).

What they found wrong, and what was changed the same hour:

| found | changed |
|---|---|
| "the first state when none answers" would have put the sergeant in bed while he stood by a door | when no state answers, none is taken; his second state widened to "on his feet in company" |
| a state's opening line is both the test and the pose | the dash rule: the when is for choosing and is never drawn |
| a state whose lines could not be one instant (a tongue wetting a finger and a fingertip tapping) | every state's lines re-read as a single instant |
| unchanging lines that held a choice ("bare feet, or boots"; "a bucket, or tally-sticks") or a gesture (the reeve's raised palm) | the unchanging lines hold no pose and no choice; the bed, the crock and the bare feet moved into the sergeant's first state |
| the key to which digit is which part stood only in the register's opening law, which no walk to a person shows | the recipe carries it |
| "identity holds the held name at the same address" is false below a room (identity fans by who holds the place) | the sentence is gone; a table's names are its `names:scene` |
| "the picture-maker" could mean the seat or the image model | the unnamed are "left to the image model" |
| the recipe has no slot for a framing, and fixes who is in frame by the record | the seat states its framing beside the telling and carries only the people and parts it holds |
| 6.2 — "each person shown must have the face of their reference photograph" — with one reference and four people invites the one face onto everyone | 6.2 now says a reference face is one named person's and only theirs, and everyone else has a face of their own; the pictures page names whose each reference is |

What they found that is not this lane's, left standing: the open table records at building addresses
(`pool:120`, `pool:130`), so "the room's own line" is the building's; a descent read prints ancestor
addresses that do not read back (`[12]` for `120`); the newest picture of a room rides as a reference
(6.5) and carries its invented people with it until a principal has a reference of their own; the
look block's heading and provenance ride into a prompt; "no glass in windows" in the look against
"real glass in one window" in the Long House's own line; a full prompt runs to about seven thousand
characters. Each reader made nearly sixty calls where about twenty would have done, most of them
hunting for books the recipe names without saying where they stand.

**The pictures page reads the register** (happyseaurchin-home #346): through the keeper's placing, as
it reads the place, it takes every figure under the moment's address, follows a pointer to the person
it names, and gives each their own line — and their parts when the place holds three figures or
fewer. It takes no state, because it cannot weigh one; the telling poses them. That makes it the
plain test of David's second ruling: whether the unchanging lines and the telling are enough.

**Pictures.** The free picture service (the gallery page's keyless route) answered "queue full" and
then timed out on every attempt that afternoon, so the comparison the experiment wants — the same
moment with and without the chosen state, and the unnamed drawn twice from one line — was composed
and never seen. No key was spent.

## 8. Open

- Whether states earn their place, once pictures can be compared; then the other six.
- Reference pictures for the ten, once, at the start: whose key, and a cap.
- The proper seat for the choice of a state is one composed call every door runs — the law, the
  bundle and a contract, as the three tiers of play are composed — not each seat's own reading of the
  recipe's prose. Proposed, not built.
- A lasting change at one table (a wound, a lost coat) is that table's own copy at the same address,
  canon untouched — the world-genome's local-wins law; not built.
- A player character's look at `passport:<handle>:3` is still one paragraph; the same spread applies.

## 9. Provenance

David's words are in the visuals.1 lane on 2026-09-30. The hidden directory is sunstone 1.4; the
zero in an address, block-conventions 3.4; the aspect law and the fold, sextant 2; authored thin,
sextant 1.1. Built and written by weft (Claude Fable 5.1 through Claude Code).
