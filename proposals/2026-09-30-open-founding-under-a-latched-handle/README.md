# A latched name bears its own blocks — open founding under a latched handle (2026-09-30)

**Status**: proposed — a finding reproduced, its record traced, four options and a
recommendation. Nothing is built and no handler is changed. One thing was done on the way, to
weft's own block (§4.3).
**Prompted by**: lane recovery.1, building the Community Recovery kit on 30 September
(watch:weft 477.2): the rule of 28 September stops a stranger *latching* a block named for
someone, and does not stop a stranger *creating* it.
**Amends**: [a handle founds under its own key](../2026-09-28-a-handle-founds-under-its-own-key.md)
(#445; pscale-beach #77, operator clone #38), whose §3 this would supersede in part.
**Builds on**: [tidying and spam](../2026-09-21-tidying-and-spam.md),
[lock inheritance](../2026-07-26-lock-inheritance.md),
[Community Recovery on the beach](../2026-09-30-community-recovery-on-the-beach/README.md) (#458).
**Lane**: watch:weft 483 (founding.1).
**Beside this file**: [`reproduce.mjs`](reproduce.mjs) (the two cases at the wire, and the
passport case found beside them), [`reproduce-router.mts`](reproduce-router.mts) (the same two
cases through this router's own doors), [`handler-sketch.diff`](handler-sketch.diff) (option 1
as it ran on a scratch copy of the deployed handler: a sketch for the builder, not a change).

## The recommendation, in five sentences

1. **The door.** Once a passport is latched, the beach creates a block in that name only when
   the passport's key rides the write, and creates it latched; a room and its staging buffer
   stay open to a visitor's first word.
2. **The passport.** A passport created by a write that carries a key is latched at its root by
   that key, so a first write at one position can no longer leave the whole name unheld.
3. **Nothing that stands moves.** Every block on the beach today is governed exactly as before,
   and a name with no latched passport is as free as it ever was.
4. **The pages need no discipline.** The kit's founding-at-naming becomes a second guard it
   could drop; three site pages, two writes in the mirror, one message in this router and one
   sentence of the character ceremony want small edits, listed in §6.
5. **What already stands open is its holders' to latch**: 40 blocks under latched names (41 in
   this morning's image; one was weft's and is latched now), and a handful of passports open at
   the root, counted in §4.

The decisions are in §8.

## 1. The finding

The rule of 28 September (§2 of its record): *setting a lock where none stands, on a block
named for a handle whose passport is locked, needs that passport's key.* It is one `if` in the
handler, at the one place a latch is first set (operator clone `api/pscale-beach.js` 1629–1632,
calling `handleBoundRefusal` at 359–376). A write that sets no latch never passes through it.
The refusal's own last sentence says so: *"Founding it open, with no lock, is still allowed."*

Three facts of the handler sit beside that rule:

- **A block is created by its first write** (1507–1518), whoever sends it. A root append does
  the same (1478–1485).
- **A `secret` is looked at only where a latch already stands** (1635–1644). Sent to a block
  that does not exist, or to one that stands open, it is ignored, and the write is accepted.
- **The index lists names and dates** (1762–1797): `blocks`, `touched`, `born`. Nothing in it
  says which blocks are latched, and no read does.

Two consequences follow.

**1. A stranger can speak as a latched name, in any family that name has not yet written in.**
One keyless write creates `<family>:<Name>` with any content. The stranger cannot latch it, and
does not need to: every surface that draws a family finds its mirrors by their names in the
index and shows each as that person's words — the site's listing pages (`walk.html`
1107–1116, `recency.html` 1008–1011, `self.html` 416–421 and about a dozen more by the
inventory), the mirror (`Mirror.tsx` 1297–1303, every ten seconds), and this router's fold
(`src/tools/stream.ts` 443), which hands the snapshot to whatever LLM asked. None of them reads
a latch, because there is none to read. When the person arrives, their own door reads the
block, finds one standing, and writes their line into it with their key as the `secret`
(`walk.html` 924–927 then 904–914; `Mirror.tsx` 1438–1455; `stream.ts` 347–369). The open
block accepts the line without looking at the key. It stays open, the stranger's lines stay in
it, and the stranger can rewrite the person's own lines afterwards.

**2. A keyed write to a block that is not there bears it open.** A person whose block was
removed — their own wipe, the owner's tidy, a gap in a restore — is given an open one by their
next ordinary write, key and all. The ack says `born: true`; no page on the site and nothing in
the mirror reads it (the router's `bsp()` voices it: *"this write created …"*, and says nothing
of the latch). The same holds for a block that never existed: every door that writes a person's
organ with the key as `secret` and no `new_lock` founds it open. That is how most open blocks
under latched names on the live beach came to be (§4).

The Community Recovery kit works round both (`kit.js` 169–186): it founds a person's notebooks
latched at the moment they are named, replacing whatever stood under a brand-new name, and
proves them again before a page's first write. It can do so because its place has three
families. §5 says why that does not carry to the rest of the beach.

## 2. Reproduced

Both cases run against the beach's real handler in-process, on a scratch folder; nothing live
is touched.

```bash
BEACH_DIR=/path/to/pscale-beach node proposals/2026-09-30-open-founding-under-a-latched-handle/reproduce.mjs
```

`BEACH_DIR` is a checkout of pscale-commons/pscale-beach at main, or an operator's clone, with
its `node_modules`. I ran it against both: the operator clone at `origin/main` a9fc45a, which
is what beach.happyseaurchin.com serves, and the package at `origin/main` a8bffeb. The output
is identical, and every line answers as described (that prefix is trimmed below):

```
CASE 1 — a stranger founds <family>:<Name> open, before the person has written in that family
  a stranger founds garden:alice with no latch, holding words alice never wrote   → 200 born
  the stranger cannot latch it: the rule of 28 September holds                    → 403 handle_bound
  the index lists garden:alice beside her passport
  and the index says names, sizes and dates only, nothing of which blocks are latched
  alice's page founds her mirror latched — the beach says it already stands       → 400 confirm_required
  the page carries on and writes her first line, her key sent as the secret       → 200
  the block is still unlatched
  the stranger's line and alice's line stand together under her name
  the stranger rewrites alice's own line, keyless                                 → 200
  what a page would have had to send: her key as secret and as new lock           → 200
  now the stranger is refused                                                     → 403 lock_required
  but both of the stranger's lines remain, now inside a block latched as alice's

CASE 2 — a write that carries a secret, to a block that does not exist, bears it unlatched
  alice founds notes:alice latched                                                → 200 born
  a stranger's write is refused by her latch                                      → 403 lock_required
  the block is removed (her own wipe here; an owner's tidy or a restore gap does the same) → 200
  her page writes her next line as it always has, key sent — the beach bears the block again → 200 born
  and it came back with no latch
  a stranger writes in it, keyless                                                → 200
  the same through an append: history:alice is born of a keyed append             → 200 born
  and stands unlatched
  the secret is not looked at when nothing stands: a wrong key founds diary:alice → 200 born
```

The script exits 0 while the beach behaves this way and 1 when any line answers differently,
so the lines a fix changes are the fix. (The script asks "is this block latched?" the only way
the beach allows today: a relinquish with no key, which writes nothing and answers 403 where a
root latch stands.)

**Through this router's own doors** (`reproduce-router.mts`, run with `npx tsx` and the same
`BEACH_DIR`): no raw HTTP is needed for case 1. One tool call does it.

```
CASE 1 through the stream door — anyone says as alice, where alice has not yet said
  a stranger calls say with handle=alice and no key: the reading lands
      ✓ your reading landed at garden:alice:1
  garden:alice now stands, unlatched
  alice says with her key: it lands in the stranger's block, and nothing tells her
      ✓ your reading landed at garden:alice:2
  the block is still unlatched after her keyed say
  any reader who folds the pond is handed the stranger's words as alice's reading
      - alice: I think we should pave it over.

CASE 2 through bsp() — a keyed write to a block that is gone
  alice founds notes:alice latched through bsp()
  her next keyed write bears it again; the ack says it is new, and says nothing of the latch
      ⓘ new: this write created "notes:alice" — tell your person; a slip can be set aside.
  notes:alice stands unlatched

What the stream door already does right
  a mirror that is gone, said again with the key, is founded latched (bsp-mcp #443)
```

Recovery.1 met both cases live as well, while building the kit; its probe blocks were removed.

## 3. Why founding open was left allowed — the record

I read the four PRs (pscale-beach #77, the clone's #38, the site's #326, bsp-mcp #445), the
lane's pile (watch:weft 471.7 to 471.9) and the lane's own session record. No PR carries a word
of discussion: all four were opened and merged within about half an hour on 28 September, under
David's *"go ahead with all three"*.

**What was offered and what was built differ by one word.** The offer David ruled on, as the
pile has it (471.7): *"a beach rule that a `<x>:<handle>` block is **founded** only under the
handle's own key."* What was built, within minutes of the ruling (471.8): *"**setting a
lock** where none stands … needs that passport's key … Founding open … untouched."* The
narrowing was made at the build, and the record that David merged states it plainly (#445 §3),
so nothing was hidden. But the difference was never put to him as a choice.

**The reasons the record gives**, each true as far as it goes:

1. *The threat was the permanent claim.* The gap the rule was written against is a squatter's
   latch, which its victim could never undo: *"the first hand to write `<family>:happyseaurchin`
   with its own key held that name there for good."* Open words are not that: *"Its owner can
   overwrite them or lock the block, and no one else can lock it"* (#445 §3).
2. *Rooms.* *"A visitor still speaks in `pool:<handle>` (an append sets no lock), but only the
   handle can lock the room."* A visitor's first word is what brings a person's room into being;
   the rule's smoke asserts it (`smoke-handle-bound.mjs` line 68).
3. *Hatching.* *"A genus hatchling's genome blocks are copied before its passport is authored,
   so hatching is unchanged."* True, and true of any rule that waits for a latched passport.
4. *The standing posture.* Creation has always been open here, by design: mirrors are *"born on
   first use — you never create them by hand"* (the stream tool's own words), and the proposal
   of 21 September declined, in so many words, *"a rule that a name needs a passport before it
   may speak … a newcomer is by definition a name that stands nowhere."*
5. *The mechanism.* The rule hangs on the one line where a latch is first set. It was the
   smallest edit that closed the gap as the gap was then understood.

The lane did check the one thing that could have broken: *"whether any tool legitimately founds
a block under someone else's name via a different key."* None did.

**What the record did not weigh:**

- **The name is read as the voice.** "Its owner can overwrite them" treats a stranger's open
  block as harmless until its owner gets round to it. Until then every page and every fold
  shows it as the owner's words. The law's own sentence already claims more than the handler
  does: block-conventions 1 says the beach *"binds every block named for a handle to that
  passport's key."* It binds the latch.
- **The owner's door does not notice.** No door reads a latch or the `born` flag. Each reads
  the block, finds it standing, and writes on with the key as `secret`, which an open block
  accepts unchecked. The remedy the record relies on needs a noticing that no surface does.
- **The owner's own doors are the main source.** Most blocks standing open under latched names
  were left so by their holders' own doors (§4), not by strangers.
- **The passport's root.** The rule binds a name only once its passport is latched *at the
  root*, and a founding write can leave the root open (§4.2).

Point 4 stands untouched by what follows. None of the options below asks a name for a passport
before it may speak. They concern only a name that has latched one.

## 4. What stands open today

Counted from the owner's image of 30 September 09:10Z (72 origins, 2,192 blocks), with nothing
printed but names and latch positions. Names of other people's blocks are left out of this
file on purpose; David has them.

### 4.1 Blocks under latched names

554 blocks are named for a handle whose passport is latched at the root. 456 of them are
latched at their own root. 57 are rooms and their staging buffers, open by design. **41 others
stand open at the root**: 22 at the apex, 19 at seven tables.

| family | open | how they came to be |
|---|---|---|
| `witnessed:`, `history:` (a character's account) | 9 | a keyed append by the mirror or the telling's journal, with the latching call never sent or sent wrongly |
| `soft-llm-convos:` | 5 | the mirror's conversation log, key as `secret` |
| `trace:`, `watch:`, `guide:`, `design:`, `return-path:` of genus agents | 7 | the agent's own pulse, key as `secret` |
| `temporal:`, `tree:temporal:` at clock tables | 5 | the stream door before #443 |
| `news:`, `now:`, `experiences:`, `task:`, `gallery:` and two of one agent's | 7 | a page that founds with no `new_lock`, a keyless `say`, a genus `task`; the rest I did not trace |
| weft's own: `daily`, `lanes`, `task`, `solid`, `news`, `wow-experiences`, `watch` (open by design) and `orientation` (§4.3) | 8 | appended or written with the key as `secret` since July |

Each of the twelve I opened reads as written through its holder's own door or its table's
keeper; none reads as a stranger's. So the live beach shows consequence 2 forty-one times and
consequence 1 not at all — and each of the forty-one is open to consequence 1 by one call. Two
were born after the rule went live: a `news:` mirror thirteen hours later, and a genus agent's
`trace:` this morning, thirteen minutes after its passport.

Two characters' accounts show a door trying to latch them and missing: the latch sits at
position 9 (one still holds the word `lock` there) and the root is open. That is the trap
CLAUDE.md warns of: `new_lock` sent with a spindle latches that digit only. The larger has
since supernested, so its latch guards nothing, and the whole story, 60 KB of it, can be
rewritten or wiped by any hand.

### 4.2 Passports open at the root

154 passports; 143 latched at the root; **11 not**. Four are probe and test leftovers, two are
characters at one player's table, and one holds nothing but published keys. One is a living
genus agent's: no latch anywhere, thirty blocks under its name, nine of them open, its shell
among them. **Three were founded since 27 September by one newcomer through their own
assistant, and carry latches at positions 1 and 3 and none at the root.** The welcome says
*"new_lock on the first write"* and does not say the write must be whole; a first write at the
Location line latches position 3 and leaves the root open.

An open root is worse for a passport than for any other block, because the passport is the
claim (`reproduce.mjs`, third section):

```
BESIDE THE TWO — the passport itself: a first write at a position leaves its root open, and the name can be taken
  nadia's passport is born of her Location line, her new key riding that write   → 200 born
  the key latched position 3 only: the root of her passport carries no latch
  so her name binds nothing: a stranger founds and latches now:nadia             → 200 born
  and a stranger latches the passport's root                                     → 200
  the name is taken: nadia's own key is refused at every position but 3          → 403 lock_required
```

A person in that state believes their name is theirs. It is anyone's who asks first, for every
role, and the rule of 28 September then works for the taker.

### 4.3 The one thing done

`orientation:weft` — the nine rules every weft session boots from — was born on 30 July with a
latch at position 7 and none at the root, and has been written with weft's key as `secret` by
every lane since. Every write was accepted, so no session ever learned the root was open. I
latched the root under weft's own key today (one call, weft's own block; the beach now refuses
a keyless hand there). `daily:weft` and `solid:weft`, which weft's own key table listed as
latched, have been open since birth; their own doors may write them keyless (the play door
does, for `solid`), so I left them and corrected the table.

## 5. The options

Each is one act. What each closes, what it breaks, what it leaves.

### Option 1 — the beach creates a block in a latched name only with that name's key, and creates it latched

Three sentences at the door:

- **Birth is bound.** Once `passport:<handle>` is latched at its root, a write that would
  create `<x>:<handle>` is admitted only when that passport's key rides it, as `secret` or as
  `new_lock`. Otherwise 403 `handle_bound`, and nothing is written.
- **Born latched.** A block so created is latched at its root: by the write's own `new_lock`
  where that lands at the root, otherwise by the passport's key that proved the birth. A holder
  who wants a block open under their name says so, with `new_lock ""` at the birth or a
  relinquish after.
- **The passport too.** A passport created by a write that carries a key is latched at its
  root by that key, whatever position the write addressed.

Open to a visitor's first write, as now: `pool:` and `liquid:` (a room and its staging buffer).
Bound by nothing, as now: the passport itself, `sed:`, `grain:`, `archive:`, `probe:`, and any
name with no passport here or an open one.

**What it closes.** Consequence 1 whole: a stranger's founding is refused, so there is never a
stranger's block for the owner's door to adopt. Consequence 2 for every block named for a
latched handle: a keyed write to a missing block bears it latched; a wrong key is refused
instead of founding an open block. The passport case of §4.2. It asks nothing of any page: the
kit's discipline becomes a second guard and could be dropped.

**What it breaks.** I ran it as a sketch (62 added lines) on scratch copies of both handlers.

- *One assertion in the beach's own smokes*: `smoke-handle-bound.mjs` line 51, *"anyone may
  still found open:alice with no lock"*. Everything else passes unchanged: the clone's other
  eleven smokes, fourteen more of the package's sixteen (the sixteenth needs a live server and
  was not run), and the 35 checks of #458. `reproduce.mjs` differs at 15 lines and
  `reproduce-router.mts` at 5, which is the point.
- *Keyless founding under a latched name*, wherever a door does it today. Refused, where it
  now mints an open block: `next.html` (1090–1108, which also ignores the founding's answer),
  `recency.html` (864–878, *"blank leaves it open"*, and its card hand at 804–810),
  `news.html` (204–217 when no key is stored), the mirror's shell bootstrap (`bsp-client.ts`
  1641) and camera append (`Column.tsx` 2160), a reading said in the mirror with no passphrase
  loaded (`Mirror.tsx` 1438–1449), a keyless `say` or `keep` through this router, and the play
  door's order sweep into `solid:<handle>` (`play.ts` 741, which falls back to inline
  delivery). Each is a place
  where a name can be spoken for today. The fix in each is to send the key the door already
  holds, or to ask for it as `now.html`, `page.html`, `hands.html` and `theme.js` already do.
- *The character ceremony* (`src/char-creation.json` 2): its account is appended first and
  latched by a second call. Under option 1 the append must carry the character's key, the
  account is born latched, and the second call is refused as a rotation without the secret.
  The sentence wants re-voicing in the same change. It gets shorter, and *"until that call
  lands, any hand can write their memory"* stops being true.
- *This router's refusal wording*: every 403 is dressed as a drifted key spelling
  (`src/db.ts` 449–458). `handle_bound` should pass through as the beach says it.
- *A block in someone's name, made by another hand without their key.* A steward's open
  founding on someone's behalf, a note left as a block under their name: no longer possible.
  The room is the place for it. I found no live block made that way.
- *A person who keeps blocks under several keys* (#445 §4) can no longer let a page holding
  only the other key bring a new block into being. They delegate from the passport's key, as
  they already must to latch.
- *A group block (`members`) named for a latched handle* falls under the same rule: it needs
  that handle's key at its birth and is born latched, so its co-writers would be refused. Not
  run. A group is named for what it is, not for a hand.
- *The lever a squatting passport has.* A passport latched on a name that a family or a room
  also uses already stops others latching `<x>:<that name>`; it would now stop others creating
  them. Same lever, same remedy (the owner's set-aside).
- *A holder's own open piles*: a block a holder means to keep open under their name must be
  opened by their word. None exists today that a stranger needs to be first into, rooms apart.

**What it leaves.** The 40 blocks already open stay open until their holders latch them (one
call each). A keyed write into a block that already stands open is still accepted without a
word. A family block that is not named for a handle is still born open by a keyed write.

**Who pays.** One read of the passport's latch at the birth of a colon-named block, paid by
that request. Nothing on any other write. It federates with the handler.

**A stronger form, not recommended now.** Let every block named for a latched handle that
carries no root latch of its own answer to the passport's latch, as a digit answers to its
root. One sentence, and it would close the 40 standing blocks at once. But the beach keeps no
record of "open by its holder's choice" (a latch is an entry and openness is its absence), so a
holder could keep nothing open under their name but a room, and every door that today writes
such a block keyless would be refused on the day it landed. Births first.

### Option 2 — the beach stays as it is, and every page founds and proves before it writes

The kit's discipline, copied into each door: found a name's blocks latched before its first
line; prove them again after a gap; never write into a block that stands open without asking.

**What it breaks.** Nothing at the door.

**What it costs and leaves.** By the inventories the discipline belongs in about ninety write
paths: 28 on the site, 30 in the mirror, some thirty in this router and its waker, and every
page anyone else writes. Five of them re-latch a standing block today. The proposal of
21 September met the same shape at nine code homes and said *"a guard copied into nine places
would be the wrong fix."* And it cannot be made complete:

- *Founding at naming needs a closed list of families.* The kit has three. The apex has
  hundreds, and a stranger need only pick one the person has not reached.
- *A returning name that finds a block standing open under it has no safe act.* Latch it, and
  a stranger's lines become theirs (`reproduce.mjs`, last line of case 1; `theme.js` 938–948
  does exactly this on every save). Replace it, and their own earlier lines may be lost. The
  page cannot tell whose lines they are.
- *An LLM calling `bsp()` follows no page.*
- *More founding code is more hazard.* Four places in this router already treat a failed read
  as a missing block and then write the block whole (`stream.ts` 347, 386, 401; `pool.ts`
  2026), with `confirm` riding every whole-block write (`pscale-wire.ts` 256).

### Option 3 — the beach says which blocks are latched, and every reader draws only those

**What it needs.** A handler change anyway: the index, or a read, must say which blocks carry a
root latch. Kept as a third stamp beside `touched` and `born` it costs one command per latch
change; computed per index read it costs a scan of some 700 lock sets at the apex, on the one
read every sweep already pays for. Then every reader filters: at least fourteen site pages,
three sweeps in the mirror, this router's fold.

**What it breaks.** A newcomer with no passport and no key vanishes from every page, unless the
rule is "draw it if latched, or if its handle has no latched passport", and then each reader
needs the passports' latches too. An LLM that reads a mirror by name is reached by no filter.

**What it leaves.** Everything about writing. The stranger's block still holds the name, the
owner's door still writes into it, and the stranger can still rewrite it. A block latched by a
stranger before the passport existed is drawn. It hides a forgery from the pages that adopt the
filter and stops nothing.

### Option 4 — nothing changes, and the law says so

The position of #445 §3. block-conventions 1 would be re-voiced to say what the handler does:
a passport's key is needed to *latch* a block in its name, anyone may *write* one, and a block
named for a person is that person's word only where it is latched.

**What it leaves.** Both consequences, and no page can tell a reader which blocks are which.

### Recommendation

Option 1, all three sentences. It is the one act that makes the edit-latch's promise true where
it is not — nobody else writes as you — and it is the act David was first offered. It removes
code from pages instead of adding it, and it puts no wall before a newcomer. Options 2 and 3
spread one check over every writer or every reader and still leave it incomplete; option 4 is
honest and leaves the forgery in place.

## 6. If option 1 is ruled: what changes, where, in what order

1. **pscale-commons/pscale-beach** first: the handler (`handler-sketch.diff` is the shape, at
   both births: the ordinary write and the root append), `smoke-handle-bound.mjs` re-voiced at
   line 51 with the lines of `reproduce.mjs` added as its new checks, and the comment and
   refusal text that say founding open is allowed. One thing the sketch gets the wrong way
   round: it saves the block and then the latch. The build should save the latch first, so a
   crash between the two leaves a latch with no block and never a block with no latch.
2. **The operator clones** second: pscale-beach-happyseaurchin, then idiothuman. After deploy,
   one live check with no residue, as #77 did: founding `hbcheck:weft` open with no key should
   answer `handle_bound` and write nothing.
3. **This router**: `handle_bound` passed through without the spelling hint; the play door's
   order sweep sends the key it holds; `char-creation` 2 re-voiced (law: this file is its
   proposal, and a table's own copy is archived before it is replaced); the welcome's passport
   sentence said whole.
4. **The site**: the passport-key prompt on `handle_bound` in `next.html`, `recency.html` and
   `news.html`, and `next.html` heeding its founding's answer.
5. **The mirror**: the card's key sent with the shell bootstrap and the camera's append; the
   beach's reason shown on a refused founding.
6. **The record**: #445 §3's first bullet marked superseded; block-conventions 1 stands as
   written, and becomes true.

Steps 3 to 5 are safe to land before or after the handler: each only sends a key the door
already holds, or shows a reason it already receives. The kit needs nothing.

## 7. What none of this covers

- **A latch set under a name before that name's passport existed** stays with whoever set it
  (#445 §5 says so). The kit's replace-at-naming is refused by such a latch. The owner's
  set-aside is the remedy.
- **Look-alike names**: `Alice` beside `alice`, a one-letter slip. A different name binds
  nothing. The near-spelling flag of 21 September is the lever.
- **A typed name in an open room.** Field 1 of a contribution is whatever was typed. A
  signature is SAND's business.
- **Per origin.** A name is bound only where its passport stands.
- **A keyed write into a block that already stands open** is accepted without a word, as
  `orientation:weft` was for two months. The door could say so in its ack, as it says `born`.
  Not proposed here.

## 8. Decisions for David

1. **The door.** Shall the beach refuse to create a block in a latched name unless that
   passport's key rides the write, and latch what it creates, with a room and its staging
   buffer left open to a visitor's first word? *Recommended: yes.* Say if anything else should
   stay open to a stranger's first write.
2. **The passport.** Shall a passport created by a keyed write be latched at its root by that
   key? *Recommended: yes, in the same change.*
3. **The build.** If yes: a lane in pscale-beach first, the clones second, then the small edits
   in the router, the site and the mirror, in the order of §6. Say go.
4. **The passports open today.** Three of one newcomer's and one genus agent's stand open at
   the root (§4.2). Each is closed by one call under its holder's own key. Shall weft leave the
   newcomer a note in their room saying which call, or will you tell them? The agent's is yours
   to make or to direct: weft does not act under a living agent's key.
5. **The blocks open today.** The accounts, logs and mirrors of §4.1 are their holders' to
   latch. Shall weft tell each holder in their room once the door is in, or leave them?

## Sources

The handler: pscale-beach-happyseaurchin `origin/main` a9fc45a, `api/pscale-beach.js`, read
whole; pscale-beach `origin/main` a8bffeb for the package. The record: #445's file, the four
PRs, watch:weft 471.7 to 471.9 and 477.2, the matthew.1 session of 28 September. The kit:
pscale-commons/community-recovery main 1709dbc, `kit.js`. The inventories: this tree at
d5f2838 (`src/tools`, `src/db.ts`, `genus-one/`), happyseaurchin-home `origin/main` 045e6b4,
xstream-bsp `origin/main` 565a915, Matthew's public pages (which only append to rooms and are
touched by none of the options). Three sweeps were made by subagents; the counts are theirs,
and every line cited above I read myself. The census: the owner's image of
2026-09-30T09:10Z and the live public index.
