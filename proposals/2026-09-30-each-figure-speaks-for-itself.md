# Each figure speaks for itself, and the keeper carries the news — knowledge is located (2026-09-30)

**Status**: a PROPOSAL for David's ruling (§4) — his questions the same afternoon: *"Things
like Cob at the inn have responded to events nearby at the slope — how could they know? …
should we be taking up a character-centric pass to establish what each does? … Maybe we need
to examine how the keeper is organised and operated?"* Nothing here is built. David put the
same three faults to the RPG lane (rpg.11, watch:weft 476) the same day; §2 and §8 say where
that lane's reading is the right one and this lane's first cut was not. **Lane**: costs
(watch:weft 478).

## 1. What David met at /w/brackenfoot-open

Three things, after Mark's character Orik joined Ugarth at the diggings:

1. **The location reads 300** — The Slopes & the Diggings, the whole upland — while both
   characters stand at the working face.
2. **People know what they could not.** A man at the inn answered the killing on the hill at
   once; and David, at the slope, was told what happened at the inn's door.
3. **The blue staged lines stopped appearing**, and when they did appear they were a
   narrator's description of a person, not the person's own words.

All three were traced on the live beach before anything was changed.

## 2. The location — the law says a room, and the RPG lane builds it

`renderWays` (src/tools/pool.ts) lists every ground, and the buildings of only the ground the
mover stands in. So from the Long House [130] the only address a resolution could name for
"the diggings" was [300], the ground itself; the arrival then told the working face, because
the place is framed two rings down, and the second character followed the first to the same
general address.

**This lane's first cut was wrong, and is withdrawn.** It made the ways list every ground's
buildings, so a going would land at [310], and said "a room is a building". The law says
otherwise — world-genome 2.1: *"A floor of 3 means a three-digit address lands in a room
(brackenfoot's Slip at 211: the holding's second region, its first sub-place, its first
room)… the room a handle meets in is pool:<its address>."* A room is the full-width address:
311 the working face, 131 the counting-room, 121 the taproom, 111 the common ground. The pools
the table holds at 100, 120, 130, 140, 220 and 300 are the fault's own products, and reasoning
from them (as this lane did on 2026-09-22, when it called a room's address "the whole place")
read a symptom as the design. The RPG lane's fix is the right one: a way follows its first
branch down to a room, and the ways gain the rooms of the building one stands in. It builds
that; nothing of the location is in this PR.

## 3. What the record shows about the keeper

The keeper's pass (grit 3, `keeper_pass` in genus-one/waker.py) runs after every landed beat
where an enrolled character stands. One call, one mind, asked for "at most three of the
place's people, or the day itself", anywhere on the table.

| what stands on the beach | what it shows |
|---|---|
| `pool:300` beat 8 wove **"Cob at the Sow"**: *"Down in the village, past the shoulder of the slope, a broad-shouldered man is already shoving off from the Sow's doorframe… 'The sergeant's not answering the hill. Vane's either down or gone dark. Move.'"* | The keeper staged a man who is at the inn into the diggings' window, knowing at once what happened out of his sight — and the resolution, told to weave the window, told the players at the slope what happened at the inn's door. |
| The pass at 11:14Z staged three voices: one at [100], two at [130]. `liquid:pool:300` is empty. | All three of the world's next intentions went to rooms where no player stands. Nothing was staged where the players are, so nothing showed in blue, and the soldiers in the bracken are left to the resolver to invent. |
| At [130] five voices stand, among them **"The factor"** and **"Pell at his ledger-work"** | One person (the register: Pell is the factor) as two voices, one walking toward the other. |
| Labels "Reeve Haldan", "Pell at his ledger-work", "Cob at the Sow" | Held names used as labels; the contract says a name reaches the table only when someone says it aloud. |
| `names:scene` entry 2: *"the broad-shouldered man — the hard-case who tends the ale and the fire… (held: Cob)"* | The register's Cob is the sixteen-year-old who watches the Store — the scenario's "peel off the boy". The keeper cast the name onto a different man and, through KNOWN (bsp-mcp #418), wrote the mis-casting into the table's memory. |
| "Sergeant Vane — walks the sunken track toward the diggings", staged 09-29, still standing at [130] | The sergeant was killed at the diggings an hour later. A dead man's intention waits in a room for the next resolution there to weave. |
| The keeper's frame at 300: ≈ 90,000 characters — the room's beats 26k, the sheet inputs 27k, the register 16k | The largest window at the table, growing with the room's record. |

**The reading.** The fault is the shape of the call, not the model that wears it. One mind is
asked to be every person in the world at once: it voices people where the players are not,
gives them what only the whole table's view could know, and labels them from the register it
alone holds. David's word for it is exact: it is *synthesising*.

## 4. Proposed — knowledge is located

An entity knows what its own blocks hold and what has landed where it stands. Three hands,
each doing one thing.

**4.1 Each figure speaks for itself.** After a beat lands in a room, the people of the place
who are *in that room* — a voice already standing in its window, or a figure the beat itself
put there — each get one small call of their own. The bundle is that figure's and no one
else's: how anyone sees it and what it keeps to itself (the register's own lines at its
address); where it stands; what it has seen and heard there since it came; its own last line.
It answers in its own voice — first person, one to three sentences, an intention and never an
outcome — and that line is staged in that room's window under its label, exactly as a player's
is. At most three figures per beat, those the beat touched first. A figure in another room
gets no call: nobody is there to see it act.

**4.2 The keeper keeps the books and carries the news.** It never voices a person. It keeps
what it keeps now — each character's holds, WHERE, DROP, KNOWN — and gains two lines:

- `ARRIVES <label> · <room> · <as anyone sees them come>` — the arc reaching the players: a
  figure entering the room where they stand, who then speaks for itself from the next beat.
- `NEWS <room> · <what reaches that place>` — what of this beat carries to another place, under
  the world's own rules (sound carries; a runner takes the time a runner takes), written *there*
  as the place's own line. Information is put where it will be read.

Its frame shrinks to the register's spine, the room just resolved, the last beat, and the
standing voices by label — it no longer needs the whole table's story to write a few lines of
admin.

**4.3 What a figure may know.** Its held lines; what landed in its room while it stood there;
news the keeper delivered to its room. A name is a figure's only once spoken aloud in its
hearing — grit 1.1, applied to the place's people as it is to characters, and checked by the
same net the telling has (a name in a figure's line that no quoted span of a beat it witnessed
holds is asked for again).

**4.4 The players' characters.** The resolution is framed with "the beats these characters
lived, wherever it happened" — the union. Laid per character instead (the room's own record,
shared; then what each alone has lived, marked theirs), nothing one character lived becomes
another's by the frame. Not yet seen to bite; smallest of the four.

**4.5 Track B.** The same figure pass writes the figure's own mirror at the address instead of
a window slip. Nothing else changes.

## 5. Measured before proposing

Read-only, on the rig key, at `pool:300` as it stood: one Haiku call per figure present, each
framed by hand as §4.1 describes, three runs each.

| figure | frame | in / out tokens | what it said (one of three) |
|---|---|---|---|
| the soldiers in the bracken | 2.4k chars | 615 / ~150 | *"Wide left, mate — we go up separate, keep him turning his head, and when he nocks again we move."* |
| the soldier with the arrow in his thigh | 2.4k chars | 610 / ~120 | *"I grip the shaft — don't pull it, that's how you bleed out — and I'm already moving sideways off the exposed track into the bracken."* |
| the diggers at the pale stone | 10.1k chars | 2,577 / ~235 | *"Get back… Back into the cut, deep as it goes. They're not fighting for us. Nobody fights for us. We run."* |

Every line is the figure's own, in its own voice, from where it stands, and plays. Three such
calls cost about half a cent on Haiku; the keeper's single pass at 300 today is a
23,000-token window before its sheet calls.

What the replay also showed, to be built against: a figure given the room's record learns the
names the narration uses (both soldiers said "Orik", whom they never heard named) — §4.3's
check exists for this; the diggers ran long and one coined a neighbour's name — a ceiling and
the same check.

## 6. Order, if ruled in

1. Router: a figure's frame (`composeFigure`) and its contract; the keeper's contract cut to
   the books and the news (ARRIVES, NEWS); the dial gains a `figure` act.
2. Doorman: the figure pass after a landed beat; the keeper's admin pass; the net on a figure's
   line; stale voices dropped when their figure has left or died.
3. Nothing in the mirror: the blue returns by itself, because the lines are staged where the
   players stand.

One lane builds it. The RPG lane already holds the router for the location and the naming
law; two lanes in `tiers.ts` at once would collide, so this proposal is handed to it.

## 7. For David

1. **Go or no-go** on §4.1–4.3.
2. **Who speaks**: three figures a beat, those the beat touched first — and does "the day"
   still speak, as the keeper's own line?
3. **`names:scene` entry 2** — strike it (the register's Cob is the boy at the Store), or keep
   it as this table's Cob.
4. **The dead sergeant's line at [130]** — drop it now, or leave it to the first keeper pass
   under the new shape.
5. **§4.4**, the per-character story in the resolution: with this, or later.


## 8. Compared with the RPG lane's reading of the same three faults

| fault | the RPG lane (rpg.11) | this lane | which stands |
|---|---|---|---|
| Ugarth at 300 | a way never lands in a room; world-genome 2.1 says it should; each way follows its first branch to a room, and the ways gain the rooms of the building one stands in | every ground's buildings, landing at [310] | **The RPG lane's.** It has the law; this lane's stopped a level short and stated a principle the law contradicts. |
| Orik's name reaching Ugarth | the resolution names characters by name before the name is spoken; the telling carries it; grit 1.14 never reaches the telling; the glass labels staged lines by handle | not examined (David did not put it to this lane) | **The RPG lane's.** It also closes what this lane's replay found from the other side: a figure given the room's record learns the names the narration uses. |
| Cob on the hill | the contract seats the world's people "where the characters stand" and nothing limits what they know; fix the contract: each voice stands where that person is and acts only on what they saw or heard there | the cause is one mind asked to be every person; each figure present speaks for itself from its own bundle, and the keeper keeps the books and carries the news | **This proposal**, for three reasons. It is the shape David described himself ("spin up a minor agent… so the keeper can't make the mistake of synthesising things"). Telling a mind that holds the whole story to act as if it did not is the class of instruction that failed for the telling until the frame changed (2026-09-22: 4 of 4 walked in under the contract alone, 0 of 4 once the frame ended where the record ends). And voices staged "where that person is" are voices in rooms where no player stands — what the 11:14Z pass already did, which is why nothing showed in blue. |

What this lane found that the RPG lane's report does not carry: the register's Cob is the
sixteen-year-old at the Store, mis-cast onto a hard-case at the inn and written to
`names:scene` through KNOWN; the keeper's last pass staged nothing where the players stand;
"The factor" and "Pell" are one man as two voices; the frame is ≈ 90k characters.
