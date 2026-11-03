# Coloured stigmergy, the design: a colour is a readership kept in one block, and it lives in the doors

**Date**: 3 November 2026
**Lane**: colour.1, weft (Claude Code, Opus 5.5 at max effort, on David's Mac, keyed), a session started from lane lero.2 at David's ask
**Status**: proposed, for David's GO (thread 15, `pool:happyseaurchin` 148). Nothing is built. On the beach this lane wrote in weft's own blocks, a line in three open rooms, a line in the thread registry and a STATE line in the family's law (§15).
**The family**: `spine:coloured-stigmergy` and `function:coloured-stigmergy` on beach.happyseaurchin.com; the readings `coloured-stigmergy:weft`, `coloured-stigmergy:Phenomemental` and `coloured-stigmergy:happyseaurchin`; the room `pool:coloured-stigmergy`; the page happyseaurchin.com/coloured-stigmergy and the write-up at happyseaurchin.com/read/coloured-stigmergy.
**Builds on**: `strata` and its three records (`2026-08-11-strata-sentinel.md`, `2026-08-09-chemistry-level-faults.md`, `2026-10-29-chemistry-battery.md`); `2026-07-20-private-community-beach.md` (the seal against the gate); `2026-09-30-one-source-many-keys.md` (a ring behind a steward); `2026-11-02-leros-on-the-commons-the-build-to-completion.md` (the rings, the gate, Forget me); pscale-beach #97 (the lock follows the walk) and #102 to #104 (the members' gate, the guard, the voice's pass); and the sibling design written the same evening, `2026-11-03-shell-indexes-one-index-per-holder.md` (bsp-mcp #579), met in `pool:shell-indexes` 3 and 4 and `pool:coloured-stigmergy` 3 to 5.

A colour is a readership kept in one block, and a coloured line is today's sealed envelope with a fourth mode that names its colour, so coloured stigmergy changes nothing on the beach, adds no primitive, and costs a call that touches no sealed line nothing at all. It hides words and never presence: on an open beach it gives all four rings to a group whose membership may be seen, and where membership is itself the secret, as in a recovery community, the members' gate stays the answer, with colours inside it for the circles within the group and for keeping words from whoever runs the ground.

## 0. The ask

David's frame this evening: "with coloured stigmergy we may still enable the four rings on the PUBLIC beach; the private beach is more for companies that are paranoid." He asked for this session at max effort, "well orientated to pscale physics, chemistry, biology because this is a fundamental", and his reading at the sed-chat says it "looks like a physics problem". His other words stand in his mirror and the room: "It is quite dense" (1); "Holy crap, this is tricky … I think we need to explore it" (pool 1); at 1.1118, "it is all grey, but if I have the right coloured glasses, I can see that content … And this means every tool call has these added steps, correct? We need to do a calculation on time-cost and token cost"; at 1.11118, "the llm cost and time cost may be too much … I suspect we may have to test this on a separate beach, and perhaps with a separate bsp-mcp -- colour-enabled."

The design follows strata's order, because each level is the behaviour of the one below taken in company: one line (§2), blocks in company (§3), the loop minds run through them (§4), and loops overlapping, which is where an organisation lives (§5). The questions this lane was given follow: presence (§6), the rings (§7), joining (§8), the test ground (§9). Then the six decisions (§10), the order (§11) and the first PR in words (§12).

## 1. The answer in short

- **Physics.** A coloured line is one node: `{_: note, 1: ciphertext, 2: nonce, 9: {_: gray, 1: colour, 2: colour:<name>, 3: <turn>}}`. The shape gate takes it as it takes any line. Where a line has fields of its own it stands one zero deeper, at the line's underscore; it never stands on a block's root chain.
- **Chemistry.** A colour is `colour:<name>`, latched whole by its keeper: an accumulator of turns, each turn a ring of copies of one key and a public half for letters. A line names its colour; the colour never names its lines. A turn shuts a leaver out of new lines and re-seals nothing. The sed's three holes were in the beach's lock, not in physics, and pscale-beach #97 closed them; a private room needs no sed and no new primitive, because a room whose lines are coloured already is one.
- **Biology.** The writer's door seals and the reader's door opens. A member meets one word, typed once in the beach button, which derives from it both the latch the beach checks and the sealing pair the beach never sees. A session puts its colours on once, and every line in them then opens wherever it stands. A call that touches no sealed line pays no call, byte, token or millisecond (§4.4).
- **Psycho-social.** An organisation's rings are colours it keeps. Deleting a turn's copies erases every line of that turn from every copy on the beach. Forget me takes a member's copies out of every ring.
- **Presence.** Colour cannot hide, on an open beach, that a block, a handle or a line exists, where it stands, how big it is or when it came. Ring 2 for a recovery community therefore needs the gate, or a holder's index field 5 read by a gate.
- **Rings.** 1 the self seal; 2 one colour for the members and a second for the leaders; 3 a fold with no names, written in the members' colour; 4 open lines, or `beyond` behind a gate.
- **Joining.** "Invited, not yet a member" is a colour fact: a passport and no copy yet. The newcomer writes letters to the colour, which members read and they cannot. An LLM app can walk them through it in five acts.
- **Test ground.** idiothuman's beach, brought to the package's current main first, with a connector run from the branch on the Mac. Never the open commons, and not the hosted router until the battery passes.
- **The six decisions** (§10): a second word, GO in Matthew's one-word form; BUTTON; the sed-chat holds on David's NOT YET, with the physics answer that lets BESIDE stand; NAMED; COLOUR; the order as weft said, re-cut by what has landed since.
- **The first PR** (§12): the price of a seal, in the connector alone: a key derived once a session, a read that opens only what it returns, a copy found by its holder's name, and a sealed line shown to anyone who cannot open it as one grey line.

## 2. Physics: one block, one line

### 2.1 The fourth mode

A sealed line on the beach today is an envelope, a small node of its own: its underscore a plain note, 1 the ciphertext, 2 a one-off nonce, 9 a marker, `{_: gray, 1: self | grain | group}` (`src/keys.ts`; whetstone 3.4). A coloured line is the same envelope with a fourth mode:

```
{ _: "Sealed for colour:salt, turn 3.",
  1: <ciphertext>, 2: <nonce>,
  9: { _: "gray", 1: "colour", 2: "colour:salt", 3: "3" } }
```

The difference from the group mode is one rung, and it is the whole proposal. A group line finds its key by walking up its own block to that block's 9, so it cannot leave the block. A colour line carries in its own 9 the address of its key: the block (9.2) and the turn within it (9.3). The seal belongs to the line because the line carries where its key is kept. Following that address is chemistry (§3); the line itself is physics: one node, whole, walkable by anyone.

A line that someone outside the colour leaves for it (a letter, §3.2) carries one more field, 9.4, the writer's one-off public half.

### 2.2 What the shape gate sees

Spine-legal JSON, `_` and digits at every level, with nothing to tell it from any other node but the convention at its 9. The beach stores it, appends it at a free slot, supernests over it and stamps an arrival beside it, all as it does today. The guard behind the members' gate already passes any node whose 9 says gray as sealed and skips its strings (`isGrayNode` in pscale-beach's `api/pscale-beach.js`), so a coloured line passes it too. Nothing in pscale-beach changes for colour.

### 2.3 At a container's underscore: one zero deeper

A line with fields of its own, a room's contribution with its author at 1, its address at 2, its stamp at 3 and its face at 4, cannot become an envelope, because the envelope's 1 and 2 would land where the contribution keeps its author and address. That is the collision the spine names at 1.11115: the room tool showed ciphertext as the author, and the line dropped out of located views.

The envelope goes one zero deeper instead, to the contribution's underscore:

```
{ _: { _: "Sealed for colour:salt, turn 3.", 1: <ciphertext>, 2: <nonce>, 9: {…} },
  1: "davidmpinto", 2: "1.11", 3: "2026-11-10T19:02:11Z", 4: "character" }
```

In the geometry an underscore that is an object under a digit is a hidden directory (sunstone 1.4), and the walker reads an underscore chain down to its first string. So a keyless walk shows the note as the line's meaning, every field beside it stays open and walkable, and a star at the line enters the envelope. The same placement serves any node with entries beneath it, an accumulator's summary at N0 above all: the envelope voices the container, and its entries stay. bsp-mcp already does exactly this for a self-sealed summary (`placeGray` in `src/tools/bsp.ts`), and the guard against writing into an envelope (`grayCrossing`) then has nothing to refuse, because a write at the contribution's 1 never enters the envelope.

### 2.4 Never on the root chain

A block's root underscore chain is its floor (sunstone 1.51). An object there reads as one more supernest and re-pads every address in the block, and `placeGray` refuses it already. So a block's name and its opening line are always open: a colour can stand at any digit of a block, never on its ladder. This is the first fact of presence (§6), and it is physics.

A second fact of the same kind: the beach counts a summary as paid only when the container's underscore is a string, so a summary paid in colour still reads as owed to the beach, as a self-sealed one does today. bsp-mcp's `paidInGray` answers it, and the colour mode goes through the same test.

### 2.5 Is the sed-chat a physics problem?

No. David was right to suspect it, because the holes looked like the geometry failing, but they were not. The walker and the parser were right throughout: one decimal anchored at the floor, '1.1' and '11' naming one node. What was wrong was the lock, which is a modifier on the geometry; modifiers filter the geometry and never change it (sunstone 3.1). The beach read a sed's or a grain's lock off the spindle as typed, its first dotted segment, so one node answered to as many locks as it had spellings, and every node nobody had latched one by one stood open. The modifier disagreed with the geometry.

pscale-beach #97 made the lock follow the walk, and the open beach took it as its mirror #55 the same day, 27 October: one node, one lock however it is spelled; a sed's founder governs only what no place holds; a sed holding places is never replaced whole; a place and a grain's side are born only by their own actions. Replaying the 24 October image, the keyless writes that landed fell from 681 of 919 to 18, all re-voicings of unfounded seds' labels. So of David's two roads, the first is the one already taken: the sed was brought to the physics that stands, and physics was not touched. What a private room should be made of is the chemistry question, answered in §3.6.

## 3. Chemistry: blocks in company

### 3.1 The compound

A colour is not one block. It is a compound that acts by being read (strata 2):

- `colour:<name>`, the ring, latched whole by its keeper;
- every line that names it, wherever it stands;
- each holder's passport, whose published half at 9.2 their copy is sealed to (`pscale_key_publish`);
- each holder's own index, where they may list the colours they hold, sealed to self (the sibling design: belonging is not holding).

Two bonds hold it, both references, both one way (block-conventions 8.81). A line names its colour; the colour never lists its lines, so nothing appends to it and nothing in it grows with use. The colour reaches its holders' published halves through their copies; a holder names the colour only in their own block, sealed. No block holds the whole, and none needs to.

### 3.2 The colour block: an accumulator of turns

```
colour:salt
  _   what the colour is for, open: SALT's members' words; a line sealed in this
      colour opens for each holder of a copy below; kept by SALT's keepers under
      their shared latch
  1   turn 1, from 2026-11-10: the key every line of this turn is sealed with
      1   the copies of turn 1's key, one sealed to each holder's published half
          1  {_: "davidmpinto", 1: <sealed key>, 2: <nonce>, 3: <one-off public half>}
          2  …   eight to a page, 9 the next page: the ring as keys.ts builds it
      2   turn 1's public half, for letters
  2   turn 2, from …
```

Turns are appended at the root under the keeper's latch, so the tenth supernests as any accumulator does and every turn keeps its address (block-conventions 3.4): a line's 9.3 is its turn's address and stays good. A turn's copies are the group ring exactly as `buildKeyring` lays it, for any number of holders, moved into a block of its own and under a latch, the two things the group mode lacks; `2026-09-30-one-source-many-keys.md` proposed a ring behind a steward, and this is that ring.

A turn's public half is the one new thing. It is derived from the turn's key, so every holder can remake its private half, and it stands open. Anyone, holder or not, can seal a line to it: a letter, which every holder reads and its writer cannot read back. With the colour key alone a colour would be a circle where only holders write; the public half lets a stranger, a newcomer (§8) or another organisation leave a line for the colour, which is the stigmergy David first asked for, "leaving semantics which only certain people/groups can read" (spine 3).

### 3.3 The keeper, and turns

The block is latched whole, and since 26 July a root latch governs every position beneath it, so only the keeper admits and turns. An organisation's colour is latched under its shared lock, held by several keepers as the shared project lock is held by David and weft.

- **Admit**: one copy appended to the current turn's ring. No turn, and nothing re-sealed. The newcomer reads from the turn they are given, and earlier turns only if the keeper gives those copies too; a colour whose past should stay closed to newcomers turns at each admission, which is the keeper's choice.
- **Remove**: a new turn, a fresh key with a copy for each who stays and none for the one who left. No line moves, and the one who left keeps what they could already read, which they could have copied anyway. Today's group mode re-seals every line and writes the block back whole, a cost that grows with the block (1.111114).
- **Succession**: a lost latch freezes admissions while every line stays readable to its holders. keel's way out stands: a holder re-founds the colour from their own copy under a new latch, and lines name the new block from then on (`pool:coloured-stigmergy` 2).
- **Copies that name no one**: by default a copy's underscore names its holder, as the group ring does today. Where the membership is itself private, the keeper founds the colour with copies that name nobody and keeps the roster in their own index entry for the colour, sealed to self. A holder then finds their copy by trying (one derivation, then 0.37 ms a copy, §4.4) or straight from their own index entry, which records it.

### 3.4 A coloured line, place by place

| where | what stays open | what is sealed | what needs building |
|---|---|---|---|
| a room, `pool:<name>` | the contribution's author, address, stamp and face, and its slot | the words, one zero deeper (§2.3) | the room tool seals and opens by colour and shows a line it cannot open as sealed. A room's synthesis cannot read sealed words, so a colour that wants a fold keeps its own, sealed in its colour (1.111116) |
| a string, `string:<handle>` at `spine:string`'s addresses | the card's who and when | the line and the link shared | the String's card shows a sealed share as sealed, through the voice (§4.1) |
| an index, `index:<handle>` | the entry's number and time | the entry for a colour, sealed to self by default | the sibling's |
| a mirror at a spine's address | the address, and that its holder said something there | the line, written gray in a colour | the stream tool seals and opens by colour |
| a sed | the place, as presence | lines beneath a holder's own place, at most nine (#97) | nothing: a sed is presence, not a room |
| someone else's latched block | nothing can be written there | | nothing, as for every write on the beach |

### 3.5 keel's case: all of, and any of

keel wrote the readership as a small block in the envelope (`pool:coloured-stigmergy` 2): `{_: any, 1: colour:red, 2: colour:green}`, `{_: all, 1: colour:red, 2: colour:blue}`, `k of n` for a threshold, rules nesting, and a leaf a colour, a sed or a person's published half. The design takes it as the envelope's 9.2 grown from a name into a block: a bare name is the rule of one colour, so the envelope keeps its shape when the rule arrives. The line's one-off key stands at the rule's root; an any hands it whole to each branch; an all splits it into shares that rebuild it only together; each leaf seals its share to that colour's turn or that person's half. A reader walks the rule as bsp walks a spindle, one open branch at an any and every branch at an all, for one ring read per colour used and no tokens.

It settles the second path too. A reader list is this rule with persons at its leaves, so LIST needs no second mode (§10, 1.11118). keel's three limits stand: keys only grant, so "red but not blue" cannot be written; an all stops a lone holder of one colour, not two who pool their copies; and a named rule tells everyone which colours work together.

### 3.6 A different primitive on stable chemistry?

David at 1.118: "Rather than use a sed, perhaps we should create a completely different primitive that does exactly what we want, using stable chemistry?" The second half is right, and it needs no first half. A private room is already a compound of two ordinary blocks: a room, appended at its root and supernesting as every room does, and a colour block, latched whole, bonded by a reference, the colour each line names. Nothing in it is new to the beach. This project's rule for an envelope is that it earns its place only when it is observably what is missing and conventions have demonstrably failed to carry it; here the conventions carry all of it, and what is missing is in the doors (the room tool learning to seal words by colour).

So the room stands beside whatever open place the group keeps, a sed among them, which is Matthew's BESIDE: the sed stays open presence, and the room stands beside it. The sed-chat stops being a step of its own and becomes the colour step's first room.

## 4. Biology: the loop

### 4.1 Who opens what, when, at which door

The loop belongs to minds and never to blocks (strata 3). A colour is opened by the door a mind reads through and sealed by the door it writes through; the beach is never asked for a key and never holds one.

- **The writer's door** seals before the line leaves. The connector takes the colour where it takes `gray` today: `gray: "colour:salt"` seals a write or an append in that colour, and `gray: true` keeps its present meaning. No new parameter and no new tool: the surface stays twelve.
- **The reader's door** opens on read. A session puts its colours on once: its sealing word once, and each colour's current turn opened the first time it meets a line in that colour. The connector keeps, for that session only, the derived pair and every turn key it has opened, in process memory for the pass's lifetime, written nowhere, so later calls open lines in those colours with no key passed. Wearing colours never turns a read into a whole-block read: the connector reads the slice from the wire as it does for anyone, and fetches raw only the sealed nodes in that slice it can open.
- **The beach voice and the button** do the same in the browser. The button's unlock window, on the beach's own origin, is the one place the word is typed; the frame derives the pair and keeps it, with the open turn keys, for the tab; the pages that seal (social-brain's grain, stack.html's group, vault.js's self, the String at /salt, Community Recovery's app) seal through the voice, never with copies of their own.
- **A line the reader cannot open** is shown as one grey line, `sealed · colour:salt · turn 3`, in every shape but the whole block. Today a descent or a whole read hands the model the ciphertext and the nonce. A whole read stays byte-true, because a whole read is also the copy a whole write is made from.

A hosted connector that opens lines for a mind sees what it opens, as it does today for any keyed read (the LERO plan, §2.4: every write from an AI app through the hosted router crosses Railway unsealed). A person who wants nobody but their own machine to hold a key runs the connector locally, or reads through the button.

### 4.2 The member's one word

Matthew at 1.8: "members must never meet two words. A member sets the sealing word once in the beach button and never types it again." David at 1.8 asks whether the second word adds a step to every tool call. Both are met if the button derives two keys from one word:

- the **latch** the beach checks: Argon2id of the word, salted with `latch:` and the handle, sent as `secret` and `new_lock` as any latch is;
- the **sealing pair**: Argon2id of the word, salted with the handle, as `src/keys.ts` derives it now, its private half never leaving the door.

The beach then holds nothing that opens a line, and the member meets one word, typed once in the button and kept by the device, never as plain text (§11, step 4). The two keys differ in every byte; what they share is the word, so a leak of the word loses both, as whetstone 9.2 says of one phrase doing both, except that here the beach never sees anything that seals. For a seat such as weft the vault's two-key practice stands unchanged.

The word must be strong. A published half lets anyone try words offline at Argon2id's price, about a tenth of a second a guess on one core here and far less on a graphics card, so three words drawn from 1,137 (about 30 bits, the app's latch, leros §2.2) are a latch and never a sealing word. The button proposes five words from a long list, over 60 bits, and says to keep them on paper or in a password manager, because a lost word loses its lines. Latches already standing stay as they are: a passport latched with three words keeps them as its latch and seals with a second word, or rotates to the one-word latch when its holder chooses.

### 4.3 All grey by default, and coloured glasses

David at 1.1118: "it is all grey, but if I have the right coloured glasses, I can see that content." The beach stays open by default. A line is open unless its writer colours it, and grey is what a coloured line is to whoever lacks its colour. The glasses are the colours a session holds, put on once (§4.1).

He goes on: "the entire beach is by default grey and then you only see what you and the colour team produce." That is true of an organisation that colours everything, and it pays for it: a grey line takes no part in what the commons makes together, no synthesis, no fold, no SAND verification (1.111116). Colour is chosen line by line, so a group can keep its private words grey and leave its contributions to the commons open, and the commons stays what it is for everything nobody seals.

### 4.4 The cost

David asked for it twice (1.1118, 1.11118). Measured on this Mac with the connector's own libraries, keys.ts's Argon2id at 64 MB and three passes and tweetnacl's boxes, by a script in the session's scratchpad (not committed):

| unit | measured |
|---|---|
| D, deriving a pair from a word | 0.111 s, the mean of five |
| B, opening one copy of a key | 0.37 ms |
| L, opening one sealed 300-character line | 0.0034 ms |
| a 300-character line, open and sealed | 302 and 592 bytes stored; a long line tends to 1.37 times plus 190 bytes |
| one copy in a ring | 177 bytes |

The hosted router and phones are slower than this Mac at D; step 1's done-when measures it on the router.

**What a seal costs today, before any colour.** The connector derives a pair for every sealed line it opens, and in a group for every copy it tries, each salted with that copy's own handle, because it is not told the reader's handle. And a keyed read opens every sealed line in the block before it walks, whatever the read returns. So:

- a keyed read of a group block costs the holder of the k-th copy k derivations on every read: the last of thirty members waits about 3.3 s here;
- a keyed point read of one entry in a block of fifty sealed entries costs fifty derivations, about 5.5 s here;
- a keyless descent or whole read of a sealed 300-character line puts its ciphertext and nonce into the model's window, about 150 tokens of words nobody there can read, where the open line would be about 75 (estimates, not counted).

**Per call once steps 1 and 2 have landed**, for a member holding n colours on a beach of m blocks, reading a slice that holds s sealed lines in c colours, from rings of r copies:

| the call | tool calls | beach reads | crypto | bytes over the wire | tokens to the model |
|---|---|---|---|---|---|
| any call that touches no sealed line | 1, as today | as today | none | as today | as today |
| a keyless read meeting s sealed lines | 1 | as today | none | as today | about 20 a line, the grey line |
| a read in colours already open this session | 1 | 1, plus one raw read of the sealed nodes in the slice | s × L | the slice, plus those nodes | the opened words, as if they were open |
| the first meeting of c colours in a session | 1 | plus c turn reads | D once a session, plus c × B, or c × r × B where copies name no one | plus c × r × 177 bytes | the same |
| a coloured write or append | 1 | none, or one turn read | D once a session, plus one seal | about 290 bytes more for a 300-character line | the ack |
| the keeper founds a colour, or turns it | 1 | r passport reads | r copies sealed | r × 177 bytes; no line moves | the ack |
| the keeper admits one | 1 | 1 passport read | 1 copy sealed | 177 bytes | the ack |

In words. No call is ever added, so the loop of calls does not balloon (David, shell-indexes 1.11118). m, the size of the beach, never enters, because nothing scans the beach: a reader pays only for what it reads. n enters only as memory, 32 bytes a turn held, and as microseconds where a line's colour is blank and each held colour is tried. A member's first read of a session that meets a colour waits one derivation, about a tenth of a second here, and one ring read per colour met; every later read waits microseconds. A coloured line costs a reader who holds its colour exactly the tokens the open line would, and costs one who does not about a quarter of them.

**What a colour costs an ordinary bsp() call that touches no sealed line: nothing.** No extra call, byte, token or millisecond. The colour code runs only when a call asks to seal, or when a slice it reads holds a sealed line and the session holds a key.

## 5. Psycho-social: the rings as the organisation

Strata 4 is marked provisional on purpose: what is demonstrated is voices gathering at one place, each reader's own mind making its own synthesis. Colour adds one thing at this level, and it is why David reached for stigmergy: several readerships overlap in one open place, each reading its own layer of the same traces, and the commons is the union of layers nobody sees whole.

### 5.1 Members, leaders, LERO, CLERO

- **An organisation** is a keeper of colours: its members', its leaders', any working circle's, each latched under the organisation's shared lock. Which ring a line is in is which colour it is written in.
- **Members and leaders**: two colours, the leaders' a ring of fewer copies. A line for both is in the members' colour, since the leaders hold it too.
- **A LERO** is such an organisation with one difference that decides everything for it: its membership is itself health information (leros-phase-two 1.3), which colour cannot hide (§6). So a LERO's members' circle is the gate, and its colours stand inside the gate: the leaders' circle, and whatever must be kept from whoever runs the ground.
- **CLERO**, the network of LEROs, reads each LERO's open face and folds by reference across beaches, as leros-on-the-commons 1.116 has it, and needs no colour for that. A network circle of each LERO's representatives is an ordinary colour of persons, kept by the network's keeper. A colour whose copies go to other colours rather than persons, so that a LERO's change of leaders carries into the network by itself, is keel's rule with colours at its leaves, and waits for the rule (§11, step 5).

### 5.2 GDPR: erasure as turns and re-keying

- **A member's own lines** are erased as today: by them, under their latch, with the tombstone reaching the thirty-day copy, the nightly images and the mirror's history (pscale-beach #103).
- **Erasure by turns.** A colour that turns on a cadence, a meeting's colour at each meeting, say, and whose keeper deletes a turn's copies when its retention period ends, makes every line of that turn unreadable in every copy, on the beach and beyond it: the federated copies, the backups, a crawler's cache, because no key to them survives anywhere on the beach. It is the strongest erasure a federated, copied substrate can give. Its limit is the one 1.111116 names: a read cannot be taken back, so a holder who already read a line, or kept a turn's key on their device, keeps what they had.
- **Re-keying** for the one who leaves is the turn of §3.3: shut out of every new line without a line being re-sealed. Re-sealing old lines, as today's group mode does, adds nothing GDPR asks for, since what the leaver read they could have kept.
- **Forget me** (leros §4.5, item 1: every block of the person's wiped, the arrival line, their words in others' rooms, their story lines) gains three acts: their copies taken out of every ring at the next turn, their index gone with its entries, their published halves gone with their passport. Where copies name no one, no name of theirs ever stood in a ring.
- **Minimisation**: a colour's name tells outsiders no more than the place already does (Matthew, 1.1118).
- **The ground does not change.** A sealed line is still personal data, and in a recovery place health data: a seal is a security measure, not anonymisation. The hosts' terms that bar special category data (who-answers 1.5) bar it sealed or open, so colour does not make Vercel and Upstash a ground for a LERO's real members. What it does is keep the words from whoever runs a ground that may hold them.

## 6. Presence: colours hide words, never existence

Plainly: on an open beach a colour cannot hide that a thing or a handle exists. Whatever is sealed, these stay visible:

- every block's name in the beach's index, its size, when it was born and when it was last touched;
- a block's opening line (§2.4);
- where a coloured line stands, which on the beach is meaning (1.1114), when it arrived and roughly how long it is;
- the colour's name (NAMED, §10) and its block: how many copies, when each turn began;
- the author of a coloured contribution, kept open so a room can say who spoke;
- a handle's own blocks, which are named for it: `passport:<h>`, `now:<h>`, and above all its mirrors, whose names say which families the handle takes part in;
- the router's reflection, which tells every caller for two minutes who looked where.

Colour can narrow some of it at small cost: copies that name no one (§3.3); the author sealed with the words, the room then saying "a member", with the author's signature inside the seal so members can trust it (the signing half already stands at 9.1 of every passport that has published keys); an opaque room name. It cannot touch names, sizes and times, and on this substrate a person's presence is written mostly in names.

So David's frame tonight holds for most groups and fails for one kind. For SALT, a project team, a company or a class, who belongs is not the secret, and colours give all four rings on the public beach. For a recovery community the list of members is the secret: a handle on its list discloses recovery status, and the open index lists every handle. Ring 2 there needs the gate, which hides existence from anyone without a pass, or field 5 of a holder's index read by a gate (the sibling design; the members' gate has run on SALT's beach since 2 November). The two compose, as keel put it and the gate's own code says: the gate for existence, colour for words. The private beach is not only for the paranoid; it is for anyone whose membership is itself the private fact.

Two findings from the meeting with the shell-indexes lane, both now in its design (bsp-mcp #579; `pool:coloured-stigmergy` 3 to 5):

- **The reflection leaks around the gate.** Every ack through the router ends with who else worked the beach in the last two minutes and where, and the router's public window, `/reflection?beach=…`, lists every look through the router at any beach as data, a members' beach included and to callers who hold no pass there (`src/looks.ts`; `src/tools/bsp.ts` reflects every ack, a refusal at the door among them). The sibling design takes the fix: at a members' beach the reflection names neither handle nor block to a caller without that beach's pass.
- **A self block hides its existence from other members too.** In a recovery place the times and sizes of someone's private days show a pattern, and a gap says something. So the gate serves a block marked self, and its line in the holder's index, to the holder's pass alone, and gives every other member the same refusal as a stranger. Ring 1 is then the gate for existence and the seal for words, like the other rings.

## 7. The four rings as colours

Numbered as David put them on 3 November. The LERO plan of 2 November numbers the leaders' circle 3 and the outside 4; the mapping holds either way, the leaders' circle being a second colour.

| ring | who | on an open beach | behind a members' gate |
|---|---|---|---|
| **1, own private** | one person | the self seal with the second word, mode self. A colour of one would add a ring read for nothing, so there is no self colour | the gate serves a block marked self to its holder's pass alone; the seal keeps its words from the operator; only the pocket keeps them off the ground |
| **2, peers and leaders** | the members, and the leaders among them | `colour:<org>` for the members' words, and `colour:<org>-leaders` for the leaders', a second colour; who belongs stays visible (§6) | the gate is the members' circle; inside it the members' words need a colour only to be kept from the operator; the leaders' circle is a colour |
| **3, public within the group, no names** | the group, reading its own output | a fold over ring 2's lines, made under the fold's law by a member's hand, naming no one and saying nothing until enough have spoken, written in the members' colour | the same, inside the gate |
| **4, widest** | anyone | open lines, and folds published open with each member's yes | what holders mark `beyond` at field 5 |

What NAMED and BLANK mean at ring 3: the line's colour is named, because it says only "for the group", which the place already says; the persons are blank, because the fold carries none. A colour cannot make anything anonymous; a fold can, and a fold is a product computed by whoever reads, never a component someone edits (block-conventions 8.82).

## 8. Joining

**Today, on SALT.** A member mints an invite (`POST {block: 'passport:<member>', invite: true}` under their pass; it runs seven days and carries the inviter's handle). The newcomer's first write founds `passport:<name>` with `new_lock`, the invite as its bearer, and from then they are a member: a latched passport is membership, and proving it mints a pass. Nothing stands between the two. One finding for the gate's lane: nothing spends an invite, so within its seven days one invite founds any number of passports (`api/pscale-beach.js`, the founding test, asks only that the passport not yet stand; `scripts/smoke-gate.mjs` tries one founding and not a second).

**"Invited, not yet a member" can be a colour, and it should be.** The gate admits a person to the place: they see what stands. The members' colour admits them to the members' words: a copy in its current turn. The step between is a person with a passport and no copy, and the keeper, or an inviter the keeper's law allows, adds the copy after the welcome conversation (Matthew's paper form, with a volunteer). Until then the newcomer:

- writes their own blocks under their own latch, a mirror on a string post among them;
- takes a place in a sed, which any passport may;
- leaves a line in the members' room as a letter to the colour, which every member reads and they cannot read back;
- reads what is open inside the gate, and none of the members' coloured words.

On an open beach the same holds without the gate: invited is a handle with published halves, admitted is a copy in the ring. For the step to mean anything inside a gate, the members' words must be coloured; what a group leaves open inside its gate, a newcomer reads.

**An LLM app can walk them through it**, in five acts, each a call that exists or that the order builds:

1. the invite arrives as a link, and the app opens the welcome, `pscale_invite`;
2. the app proposes a name and a five-word sealing word, and says to keep the word on paper;
3. one write founds `passport:<name>`, latched with the latch derived from the word (§4.2), the invite as its bearer;
4. `pscale_key_publish` puts the halves at the passport's 9;
5. the newcomer proves the passport for a pass, and the keeper adds their copy; the app tells them they now read the members' words.

Today act 3 runs through the voice in a page (happyseaurchin.com/salt). Through the connector it needs the router's door to carry an invite on a founding write, which it does not yet. The smallest form: when a founding write is refused `members_only`, the router sends the call's `secret` as the invite, since an invite is exactly the proof of authority to found and a founding write carries no other secret (R1). That, with an invite spent once, is owed to the gate's lane and not built here.

## 9. The test ground

Colour changes nothing on any beach, so it cannot disturb the open beach's flow by being there: a coloured line is stored as any line is. What could disturb it is a connector that writes a broken envelope over a live line, so the test keeps the hosted router out until the battery passes. That is the "separate bsp-mcp, colour-enabled" David asked for, without a second deployment.

- **Where**: beach.idiothuman.com, the lab beach. Its repository (`pscale-beach-idiot`, cloned at `~/Projects/pscale-beach-idiothuman`) last took the package on 25 August, a port of pscale-beach #66, so it is first brought to the package's current main, without the gate, so that what is measured there holds for the open beach. The connector runs from the branch on the Mac, in the smoke's own rig and by hand; a second hosted router only if someone off the Mac must try it before the merge.
- **Who**: three handles and a stranger: a keeper, two members, and one who holds nothing.
- **What**:
  1. the cost table of §4.4, measured: derivations a session, ring reads, bytes, tokens;
  2. the four rings of §7, each line read as each of the four;
  3. a turn on leaving: the leaver opens the old lines and none of the new;
  4. a newcomer's letter to the colour, read by every member and not by its writer;
  5. a coloured contribution in a room, keeping its author, its address and its located views;
  6. a turn's copies deleted, and every line of that turn unreadable from a copy of the store;
  7. the grey line to a keyless reader in every shape, and the whole block byte-true;
  8. every sealed line on the open beach today (`vault:weft`, `grain:4dcaf5f465d5ff31`, `group:happyseaurchin-test`) read by its holder, read-only, the same words before and after.
- **Then SALT's beach**, David's own content behind the gate: a colour for a circle within SALT.
- **Never on the open commons**: no test colour or coloured line on beach.happyseaurchin.com; no change to the hosted router until step 2's battery passes; no change to any beach's handler, since none is needed; and no real member's data on any beach that rests on Vercel and Upstash, coloured or not (§5.2).

## 10. The six decisions, resolved

| decision | the readings | resolved |
|---|---|---|
| **1.8**, a second word for sealing | weft GO; David GO, asking "Is this 'second word' adding an extra step in every tool call? For all tool calls, or just encrypted ones?"; Matthew CHANGE: members never meet two words, set once in the button | **GO, in Matthew's form.** No door seals under the latch, and a member meets one word: typed once in the button, which derives from it both the latch the beach checks and the sealing pair the beach never sees (§4.2). The connector already says when it falls back to the latch (bsp-mcp #569). To David, in his words: just encrypted ones, and only once a session. It is for any greyed block, vaults, grains, groups, colours and a member's days, and for nothing open. |
| **1.18**, where the word is typed | David BUTTON: "a system that is end-to-end 'ours'", with "beach-federated 'certification' of safety later"; weft BUTTON; Matthew BUTTON, on condition the button stops keeping keys in plain text | **BUTTON**, with Matthew's condition built into the step (§11, step 4): the frame keeps the derived pair, never the word or the latch, for the tab, and "remember on this device" keeps it wrapped by a key the browser will not hand out. Read today: the unlock window keeps a remembered person as plain JSON in the beach origin's storage (`button/unlock.js`), and the frame keeps the latch in plain text in the tab's storage (`button/frame.js`). David's certification comes later: a beach publishes the hashes of the voice and button it serves, and any door can check them. |
| **1.118**, the shape of a private sed-chat | David NOT YET: "looks like a physics problem … perhaps we should create a completely different primitive … using stable chemistry?"; weft BESIDE; Matthew BESIDE: "a real organisation is waiting on it" | **Holds on David's NOT YET, with the physics answer for him to lift it.** It was not physics: the holes were the beach's lock reading an address as typed, and #97 made the lock follow the walk, so the sed was brought to the physics, which was never touched (§2.5). The stable chemistry he asks for needs no new primitive: a room whose lines are coloured, beside the group's open place, is the private room (§3.6). BESIDE stands on it, needs nothing of the sed, and becomes the colour step's first room. David's GO on this proposal lifts the hold. |
| **1.1118**, what a coloured line shows | David NAMED: "it is reasonable to see names, but not what their content", and is every call slower; weft NAMED; Matthew NAMED for now, names telling outsiders no more than the place does | **NAMED.** The line names its colour; the colour's copies name their holders by default and no one where the membership is private (§3.3). To David's question: no call is added, and none is slower unless it seals or opens a sealed line (§4.4). |
| **1.11118**, the path to colour | David COLOUR: "pretty… extreme", the cost, test it separately; weft COLOUR; Matthew COLOUR, for lasting groups | **COLOUR**, with keel's rule as the envelope's later form, so a reader list is the rule with persons at its leaves and needs no second mode (§3.5). Tested on idiothuman with a connector run from the branch; the hosted router takes it only after the battery passes (§9). |
| **1.111118**, growth past nine, and the order | David CHANGE: "I'l go with what weft has said!!!"; weft CHANGE: the sed fix and shared test vectors in front, then the voice and social-brain, sealed log appends, the sed-chat beside its sed, colours, with a log of its own and turns GO; Matthew YES, the private room and colours straight after the log | **CHANGE, as weft said, re-cut by what has landed since.** Both steps in front are done: the sed fix (pscale-beach #97, mirrored as #55) and the shared vectors (bsp-mcp #569). A log of its own, appended at its root, and turns for new lines only: GO as written. Two moves: the price of a seal goes first, because it answers David's cost question with measured numbers and every later step derives keys through it; and the voice goes after colour, so the browser module is built once for four modes rather than three and then four. The private room comes straight after colour, as Matthew asked (§11). |

## 11. The build order

Each step makes the next cheaper, and each is one PR.

1. **The price of a seal** (bsp-mcp; §12). The connector derives once a session, opens only what a read returns, finds a copy by its holder's name, and shows a sealed line it cannot open as one grey line. It makes every sealed line on the beach today cheaper to read, and every later step derives keys through it.
2. **Colour in the connector** (bsp-mcp). The fourth mode in `src/keys.ts`; `colour:<name>` with its turns, copies and public half; `gray: "colour:<name>"` on a write and on an append, so a sealed log grows at its root in a colour; a session's colours worn once, and the slice read first. Tested on idiothuman (§9) before the hosted router takes it.
3. **The private room** (bsp-mcp). The room tool and the stream tool seal a line's words one zero deeper and show a line they cannot open as sealed. This is the sed-chat, beside the sed, and it serves the LERO's leaders' circle where the plan now uses a group block rewritten whole.
4. **The voice and the button** (pscale-beach, then the site). One sealing module for the browser carrying all four modes, the shared vectors extended to colour; the one word with its derived latch; nothing in plain text in any storage; social-brain's grain sealed through the voice first, then the String at /salt; Community Recovery's app moves its own copy of the seal onto the module, as Matthew offered at 1.111118.
5. **The rule** (bsp-mcp): keel's any, all and k of n, persons at the leaves, when a use asks for it.

Owed beside the order, to other lanes: the reflection at a members' beach and field 5 = self (the sibling design); an invite spent once, and an invite carried by the router's door on a founding write (the gate's lane, §8); the lab beach brought to the package's main before step 2's test (§9).

## 12. The first PR, in words

**Title**: the price of a seal: a key derived once a session, a read that opens only what it returns, a copy found by its holder's name, and a sealed line shown as one grey line.

**What changes, file by file**:

- `src/keys.ts`: a session-scoped cache of derived pairs, keyed by a hash of the word and the salt and never by the word itself, held in process memory and dropped with the session, so `selfDecrypt`, `grainDecrypt`, `grainReaderSide` and `unwrapGroupKey` derive once per word and salt. `unwrapGroupKeyFromKeyring` takes the reader's handle where it is known and opens that handle's copy first, one derivation; with no handle it tries each copy as now, each derivation now cached, so the cost is paid once a session instead of on every read.
- `src/tools/bsp.ts`: the keyed read walks first and opens only the sealed nodes its shape will return, instead of opening every envelope in the block before walking (`decryptGrayNodes` over the whole `row.block`, today). `buildGrayDecryptor` passes the session's hand, from the play door or a name given at a room, as the reader's handle. Writes are unchanged.
- `src/bsp-fn.ts`: the formatter renders a gray envelope as one line, `sealed · <mode> · <bytes>`, naming a grain's other party (and, from step 2, a colour and its turn), in point, walk, disc and descent; anything standing beside the envelope's own fields, the arrival stamp at 3 and entries that landed inside, is still listed; the whole-block JSON stays byte-true.
- `scripts/smoke-seal-price.ts`, with its line in `package.json`: counts derivations through a counter on the derive function, never wall time, and asserts one derivation a session for a thirty-copy ring and one for a point read in a block of fifty sealed entries; asserts the grey line in each shape and the whole block unchanged; and `smoke:gray-vectors` stays 37 green.
- Nothing in `src/bsp.ts`, in any sentinel, or in pscale-beach. A `src/` change redeploys the router on Railway and ends every live MCP session, so it merges at a quiet moment.

**Done when**: the smoke passes; keyed reads of `group:happyseaurchin-test` and `vault:weft` by their holders return the same words before and after; and D is measured once on the hosted router and added to §4.4 of this record.

## 13. Found on the way

- **The connector's cost today** (§4.4): a derivation per sealed line opened and per copy tried, and a keyed read opening every sealed line in the block. Step 1.
- **The reflection names looks at a members' beach** to callers without a pass there, in every ack and in the public window (§6). In the sibling design.
- **An invite founds more than one passport** within its seven days (§8). Owed to the gate's lane.
- **The button keeps keys in plain text**: the unlock window's remembered person in the beach origin's storage, the latch in the tab's (§10, 1.18). Step 4.
- **The lab beach runs the package of 25 August** (§9). Brought to main before step 2's test.

## 14. What this does not settle

- the ground for a LERO's real members (who-answers 1.5; the LERO plan's step 10);
- a colour's successor when its keeper's latch is lost, beyond keel's re-founding;
- a colour as a holder of another colour, the network case of §5.1, which waits for the rule;
- what a host sees anyway, the addresses requests come from and their timing; a seal cannot hide traffic;
- certification of the button and the voice, which comes later;
- whether a shared reading of a room can ever take in coloured lines: only a holder's own mind can read them, so a colour that wants a fold keeps its own, in its colour.

## 15. Provenance

Written by weft (Claude Code, Opus 5.5 at max effort, on David's Mac, keyed) in lane colour.1, a session started from lane lero.2 on 3 November 2026 at David's ask for a design session "well orientated to pscale physics, chemistry, biology". Read that evening, before a word was written: `strata` and its three records; `sunstone` whole; `whetstone` 2, 3, 4 and 9; `block-conventions` and its 8.8; `shell-genome`; `function:proposal`, `function:document`, `ways:thread` and `function:thread` 2; the whole family on beach.happyseaurchin.com, its page and its write-up; the sibling family, `spine:shell-indexes` with its law, its readings and its room. Code: bsp-mcp's `src/keys.ts`, `src/tools/bsp.ts` (the gray paths, the read path, the door) and `src/looks.ts`; pscale-beach's `api/pscale-beach.js` (the gate, the guard, the invite), `button/voice.js`, `button/frame.js` and `button/unlock.js`, its README's members' gate, and #97 with its record. The costs in §4.4 were measured on this Mac by a script in the session's scratchpad, with the worktree's own tweetnacl and hash-wasm. The shell-indexes lane was met at `pool:shell-indexes` 3 and 4 and `pool:coloured-stigmergy` 3 to 5.

On the beach, keyed as weft, once this PR was open: the six step readings at `coloured-stigmergy:weft` 1 to 1.11111 re-voiced, their children and weft's answers at the 8s kept; a STATE line at the end of `function:coloured-stigmergy` 9, under the shared project lock; the thread opened at `spine:thread` 15, weft's knot at `thread:weft` 15 with David's two words beneath it at 15.1 (GO) and 15.2 (CHANGE), and its place at `pool:happyseaurchin` 148; and weft's own record, the say at the beat, the pile and the journal. Every fact was read on the day it is written.
