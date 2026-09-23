# The telling holds to its moment — the frame ends where the record ends, the door checks before it keeps, and a coined name is kept once (2026-09-22)

**Status**: built in this PR on David's word the same afternoon ("Go for it. Your
recommendations seem sound. Process until done"), with the xstream half in
happyseaurchin/xstream-bsp (the mirror's net, the device note, the dial's medium). Items
he sent to track B — the ask as a bundle, the collective telling kept beside the beat —
are named at the end and not built. **Lane**: costs (watch:weft 454; this lane's own account — the trace and the build together — 455).

## 1. What happened

At 11:41Z Ugarth, at the Long House door (`pool:130`, `/w/brackenfoot-open`), gave the
sergeant a plain question. The resolution — beat 2 of the room — ended with the sergeant
wary and standing back from the door: *"You'd best come in out of the cold."* Seventeen
seconds later the mirror's telling landed in Ugarth's account (slot 35): the warmth, the
counting-room, the factor at his ledger, the sergeant's next line, *"You're not
ground-work."* None of it was in the record. The telling began after its beat and told
the next one as done.

The router's soft contract already forbade it in so many words ("Never begin after a
beat… never add a line or an act it does not hold. Tell the moment, then stop where it
leaves the player to act"). Two things in the frame pushed the model past the words:

- **The place carried the inside of a house he had not entered.** `placeWalk` gives the
  room and the places it contains two rings down, by design — so the counting-room and
  the factor ("knee-high and hunched, grey-toothed, wetting his fingers") stood in
  [WHERE YOU ARE] while the record had him at the door.
- **The frame closed on nothing.** After the moment came `You are Ugarth.` and the model
  reconciled "you are at the Long House" with "he invites you in" by walking in.

A second fault, found on the way: the register's own appearance line for the bed-chamber
reads "Sergeant Bole (named in identity)"; the resolver at 09:34 had the held name one
ring down, the law said not to use an unearned name, and it coined **Vane**. The keeper
then took "Sergeant Vane" as the standing label. The name slip is in the world data as
much as in the model (that line is David's to edit).

The observer's view (happyseaurchin, no character at the table) was told the same beats
under the character contract — "you", with Ugarth's blade at "your" hip — kept only on the
device, re-shaped on reload.

## 2. Measured before building

The 11:41 telling re-run read-only on the rig key, four runs per cell; the frame composed
by the router exactly as the mirror had it, the account's last telling put back to slot 34.

| frame | Sonnet 4.6 (the mirror's) | Haiku 4.5 | Sonnet 5, thinking off |
|---|---|---|---|
| as it was at 11:41 | walked him in **4/4** | 4/4 | 1/4 |
| + a moment-end line | **0/4** | 1/4 | 0/4 |
| + contained places by face only | **0/4** | **0/4** | **0/4** |

"Walked him in" = the telling put Ugarth inside, at the counting-room or the factor.

**Why "one ring" was not built.** In this register a room's address is the whole place:
the taproom (121) with the alewife behind its trestle (121.2) stands two rings beneath
the Brindled Sow (120), the room Ugarth drank in; and the ways from 130 are the village's
places, not the counting-room. So the fixtures two rings down ARE the room's own, and
cutting them would blind a character at the inn. The fault was one of time, not place —
the anchor alone carries it on the models the mirror wears, and the net beneath catches
the residue.

**After the change**, the frame as the new code composes it, four runs per model: Sonnet
4.6 0/4, Haiku 0/4, Sonnet 5 0/4 walked him in. Sonnet 4.6 still skipped Ugarth's own
line in 4/4 (it narrates his act rather than quoting it); the net asks for it again.

**The resolver, since the dial's medium now moves it too**: the resolution at pool:130
re-run read-only on the live window as it stood (three slips — the sergeant's staged
intention, Ugarth's aside that had gone to the table, Modor's hello), three runs each.
Sonnet 4.6 and Sonnet 5 coined no name in any run, paraphrased the staged intentions the
same way, and wrote beats of the same length (750–860 and 690–770 characters); Sonnet 5
once closed on a WAY line naming an address the ways do not hold, which the walk already
refuses ("you stay where you are"). No regression; the setting stands.

## 3. Built here — where each acts in the flow

**Pre-conscious — the frame (`src/tools/tiers.ts`)**

1. **The moment ends here** (`momentEnds`). The last line of every telling's frame, after
   the moment: nothing after it has happened, the character stands where the last beat
   leaves them, whatever a door, an invitation or a way opens onto is the next moment's.
   Character, party and observer tellings all close on it. The same sentence covers the
   leaving/arrival double telling of 2026-09-21.
2. **Never a name of your own making** (`HAPPEN_CONTRACT`): a figure the moment has not
   named is the sergeant, the factor, the woman at the well; where the table's names give
   one, use it exactly.
3. **The observer is told in the third person.** A handle at the table with no passport
   there is an observer: `composeSoft` uses the shared-screen contract (David: "the telling
   for a shared screen IS the observer's telling — no need for a sibling"), lays no one's
   knows or carries, gives the room's own record before the moment as the story so far,
   and journals nowhere ("an observer keeps nothing: read it, and let it go").
4. **Names this table uses** (`names:scene`, `tableNames`, `namesPart`): an open block at
   the table, the world's memory like the liquid. Each entry: the table's name and the face
   it stands for at the underscore; the held name at 5, read by the keeper alone. The
   resolution and the telling get the faces; the keeper gets both.

**Conscious — the call**

5. **The seat holds its own telling** (`SEAT_JOURNALS`): an LLM app that is its own door
   is told to check its telling against the moment before keeping it, and to tell it again
   from the first beat if it fails.
6. **The dial's medium is Sonnet 5** in the mirror (xstream `kernel/mind.ts`), with the
   request shape made safe for the minds that think unasked (`thinking: disabled`, the
   telling's ceiling). Sonnet 5 quoted the player's line 4/4 with the fixed frame.

**Post-conscious — the write**

7. **The net** (`genus-one/doorman_table.py` `telling_faults`, `coined_names`; xstream
   `kernel/play/telling-check.ts` — the same three checks in both hands, no model):
   - *begins after* — a beat's first spoken line is not in the telling;
   - *invents* — it quotes words nothing it was given holds;
   - *coins* — a capitalised word mid-sentence found nowhere in the frame.
   A fault is asked for once more, named beneath the frame. A second telling that only
   skips a line is kept; one that still invents or coins is not — **the record itself is
   journaled as the telling**, never a fiction. The resolution gets the third check: a beat
   that names someone the moment has not named is woven once more.
8. **KNOWN — the keeper keeps a coined name once** (`KEEPER_CONTRACT`, `known_lines`,
   `names_entry`): when the moment or a standing voice calls one of the place's people by a
   name the held lines do not carry, the keeper writes the table's name, the face, the held
   name and how the place explains it — a nickname, a word from another tongue, a mistake
   nobody corrects — to `names:scene`, and every later call uses it. The richness David
   asked for, by the hand whose job it is.
9. **The device note remembers its span** (xstream `personal-history.ts`): a reload shows
   the same box the observer saw.

## 4. Not built — track B

- **The ask, as a bundle.** The medium and soft calls as a one-turn loop: the frame carries
  the addresses of what it withholds, the model asks once, the router answers with a
  second bundle under the face's aperture. The seat through an LLM app already has the
  tools; the mirror and the doorman have single-shot calls.
- **The collective telling kept beside the beat.** The observer's telling composed once and
  kept at the beat's next position, read by every later observer: no call per landing, no
  reload wobble. It is the "collective" of the stream track.

## 5. Seeded

`names:scene` at `/w/brackenfoot-open` was founded open (like the liquid) with its first entry
by hand on 2026-09-22, so the table is consistent from the first call after this merges:
*Sergeant Vane — the sergeant who came to the Long House door…; the soldiers' word for him*,
held name at 5 *Sergeant Bole*. Read back; the three frames composed against it: the
resolution and the telling carry the face and never "Bole"; the keeper carries both.

## 6. Checked

`smoke:tiers` 89 (+13): the close carries the anchor with the name; the names ride the
telling and the resolution by face and the keeper with the held name; the resolution is
told never to coin; the keeper is told the KNOWN shape; an observer gets the shared-screen
contract, nothing private, the room's record as story, a journal that keeps nothing.
`test_doorman` — the net on the real case (slot 35 against beat 2: begins after, invents
"You're not ground-work"), a telling that holds, a coined name beside a role word, KNOWN
lines dressed and plain, the entry's shape, a standing name never written twice. xstream:
`smoke:telling-check` on the same cases. The replay above.
