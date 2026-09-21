# Tidying and spam — see what was born, set aside rather than wipe (2026-09-21)

**Status: proposed — analysis and options. Nothing is built and nothing has been removed.
Written in the spam.1 lane (watch:weft 429) on David's sentence of today: "We need a better
way to tidy up things so we can deal with spam when it happens." Everything below was read
from the running handler and the live apex on 2026-09-21; where I checked something rather
than assumed it, I say so.**

## The recommendation, in six sentences

1. **Seeing.** The beach already remembers when each block last changed; give it one more
   stamp — when each block was **born** — and one read-only page that lists the newest
   first and flags a name that is one letter from a name already standing.
2. **Removing.** The ordinary removal becomes **set aside**, never wipe: the block moves
   whole to `archive:<name>:<date>`, a line at `beach-log` says what moved and why, every
   family sweep stops seeing it, and nothing is lost.
3. **Who.** Three hands, each using authority it already has: the person who minted a stray
   (it is latched under their own passphrase — I checked), anyone for an unlatched block,
   and the beach's owner through the storage they own — by a script that leaves the same
   public record. **No operator key goes into the handler.**
4. **Preventing.** The door says `born: true` when a write creates a block, so every surface
   can say "that name is new — not you? undo" at the moment it happens; and the one place
   a person types their name says "new here — did you mean happyhedgehog?" without ever
   blocking them.
5. **Spam.** Keep the posture the law already states — a flood is a nuisance, not a wound,
   and clearing is the lever, not a wall — and close the one real hole I found: today any
   passer-by can erase `marks`, any open pool, weft's pile or `beach-log` with one request.
6. **Size.** Five small pieces, each shippable alone; the first (the owner's script) deals
   with today's strays the day you say which ones they are.

The one real choice for you is in section 3. The questions about today's blocks are in
section 7.

## 1. What I found

**The strays are few, and they are all the same fault.** The apex holds 790 blocks and 94
handle-shaped names. A scan for names that differ only by case, a space, a hyphen or one
or two letters finds about nine forks:

| block | what it is | latched? |
|---|---|---|
| `now:happyhedsgehog` | one line, David's own, at Friday 11 September afternoon. **Still there** (last changed 2026-09-11T15:04Z). | yes |
| `now:Phenomimental` | one line at the September rung, born by the /now page (its opening sentence is that page's, not the mirror's). No passport, no other block under that spelling. | yes |
| `now:David` | two lines from Wednesday 19 August, late afternoon — the same sitting as `now:JulieJ`'s two lines. Not a typo: a second handle. `soft-llm-convos:David` holds 12 KB of mirror conversation from 15 August under it. | yes |
| `pool:phenomemental` + `liquid:pool:phenomemental` | lower-case fork of Matthew's pool | open |
| `task:ada` | lower-case fork of `task:Ada` | open |
| `shell:Julie J` | the space fork of `shell:JulieJ` | open |
| `shell:eggthree` | beside the whole `egg-three` family | open |
| `shell:Farlane`, `soft-llm-convos:Farlane` | beside `passport:farlane` | not checked |
| `sed:test-collective`, `sed:test_collective` | test leftovers | sed: is never wipeable by the door |

`now:JulieJ` is **not** a stray: JulieJ has a shell, a pool and an ear. Beside these there
are about forty names that read as probes or tests (`probe:*`, `probe-open`,
`weft-floor3-test`, `weft-slice2-test:*`, `pool:probe-birth`, `pool:bsp-tests`, `sed:test`
and the like) — many of them weft's own, never cleaned up because there was no way to. Some
may still be in use (`function:meeting-check` has a convention beside it), so each needs a
look before it moves.

**This was found before and nothing could be done.** A session on 2 September recorded the
Phenomemental / Phenomimental fork and the case forks. They are all still here, because
the only tools are a hard wipe and one-off scripts.

**Every tidy so far has been a one-off script against the storage.** The operator clone
holds four of them (`force-wipe-blocks.mjs`, `wipe-orphan-notes-2026-07-30.mjs`,
`tidy-rpg-2026-07-30.sh`, `drop-brackenfoot-lighthouse-lock-2026-08-03.mjs`). Each deletes
keys in Upstash directly. So the owner's override for a latched block already exists and
has been used; what does not exist is any public record that it was used.

**The fault has three code homes, not one.** A `<field>:<handle>` block is born on a first
say, with no look at whether that handle stands anywhere, in: the mirror (`sayReading` in
`Mirror.tsx`, and again in `Column.tsx` and `torus.ts`); at least four site pages, each
with its own copy (`now.html`, `recency.html`, `walk.html`, `page.html`); and the router's
own `pscale_stream_engage` (`src/tools/stream.ts`, around line 308). A guard copied into
nine places would be the wrong fix.

**The wipe is looser than its own protocol, and that is the sharp edge.** The protocol doc
calls DELETE "a site-owner operation, not an agent operation" (section 2.2). The handler as
built lets **any hand** wipe **any unlatched block** with `{confirm: true}`. I checked the
lock keys: `marks`, `pool:weft`, `pool:welcome`, `watch:weft`, `beach-log` and `tide` carry
no latch at all, because an accumulator's root latch also governs its appends, so keeping
appends open means leaving the root open. One anonymous request erases any of them, and
the way back is the last daily image — anything written since is gone. A whole-block
replace with `confirm: true` is the same hole by another name.

**The `tide` block promises a tide that never comes.** It is a schedule for wiping old
marks, "read by the host's wipe-by-tide script". I searched all five repos: no such script
exists.

**What already works.** The bare index already carries `touched` — every block's
last-write time, stamped at the one place every write passes (`saveBlock`), live since
24 August; 283 of the 790 blocks carry one. Every family sweep — the mirror's, /walk's,
the router's — is a name-prefix filter over that index, so a block renamed out of its
family vanishes from every sweep at once. Daily full images exist and restore a single
block. And `beach-log` already exists as "the record of what has been DONE to this beach".

## 2. The five answers

### 2.1 How an operator sees what was born lately

`touched` says when a block last changed, which is not when it was born: a busy old block
and a fresh stray look alike. The smallest addition is a second hash beside it, **`born`**,
written once, at the moment a write finds no block there. The handler already knows that
moment (`existing == null`), so it costs one extra storage command on births only, nothing
on ordinary writes. The index carries `born` exactly as it carries `touched`. Blocks born
before the change simply have no stamp, which is honest — and the git mirror of the daily
images dates any older block to the day if it is ever needed.

Then **one read-only page**: newest born first, newest changed second, each row showing
the family, whether the handle stands anywhere else on the beach, and a flag when the name
is within a letter or two of another. It needs no key — the index is public and CORS is
open — so it works against any beach, and anyone can patrol, not only the owner. That is
Wikipedia's Recent Changes, and it costs the reader, not the beach. It can run today on
`touched` alone; it would have shown `now:happyhedsgehog` flagged on 11 September.

### 2.2 The smallest honest removal

**Set aside.** The block is written whole to `archive:<name>:<date>` — the archive naming
the project already uses 72 times at the apex — the original is removed, and the hand that
did it appends one line at `beach-log`: what moved, why, where it is now. The family sweep
stops seeing it because its name no longer starts with the family. Putting it back is the
same move in reverse. That is "archive, not history" applied to removal.

A true **wipe** stays for one case only: a flood of garbage nobody wrote as themselves,
cleared in bulk by the owner, with a count at `beach-log` rather than an archive of junk.

Set aside needs **no handler change**. It is three ordinary calls — read, write the
archive copy, remove the original — which is why it can ship first.

### 2.3 Who may do it, for a latched stray, without a back door

All four suspect now-mirrors are latched. That sounds like the hard case and is not: a
stray is latched under **whatever passphrase was loaded in the surface that minted it**. So
the person who slipped already holds the key to their own stray. What was missing was
noticing, not authority. Three hands, no new power anywhere:

1. **The one who minted it** — through the ordinary door, with the passphrase they already
   hold. The page in 2.1 can offer "set aside" on any row and ask for that passphrase; it is
   the ordinary latch check and nothing else.
2. **Anyone, for an unlatched block** — as today, but setting aside instead of destroying.
3. **The beach's owner, for anything** — through the storage they own, as today, but by one
   kept script that sets aside and writes the `beach-log` line, instead of a fresh one-off
   that deletes silently. The protocol already gives the owner the tide ("the owner can wipe
   it whenever the design demands… don't put your house on the beach", section 3.4).

The edit-latch promises that nobody else can write as you. It never promised that a host
keeps your page forever, and no host can promise that. What keeps the owner's hand honest
is that the act is lossless and publicly recorded — transparency is the security — not
that it is impossible. When the owner sets aside a latched block, the old latch is kept
beside the archived copy, so putting the block back also gives it back to its holder.

### 2.4 How a surface stops minting strays

Two small things, neither of which blocks anyone or fires during play at a table (a made
character always has blocks, so neither can trigger there):

- **At the one door:** the write acknowledgement carries `born: true` when the write
  created the block. It is the same fact as the `born` stamp, so it costs nothing more.
  Each surface then says it in its own voice at the moment it happens — "now:happyhedsgehog
  is new — not you? undo" — and undo is hand 1 above with the passphrase already loaded.
  One line per surface, no lookup, and it covers surfaces nobody has written yet.
- **At the one place a person types their name** (the mirror's identity card; the site's
  handle popup): when the name stands nowhere on this beach, a quiet line says "new here",
  with any near spellings as chips to tap. One index read at the moment of naming, paid by
  the person's own browser.

The check must be "does this handle stand anywhere here", not "has a passport": JulieJ has
a shell, a pool and an ear and no passport, and a passport-only check would call her a
stranger.

I am flagging one tension honestly. Your rule is that a change which makes a player confirm
or read notices is the wrong change. Both of these are non-blocking, and both happen only
at naming or at a name's first-ever say — but they are, strictly, a notice. If you would
rather have only the first and not the second, the first alone catches every stray; it
just catches it one say later.

### 2.5 The posture for real spam

The law already has it (open-commons 1): availability is "cheaply spammable but low-stakes
— a nuisance not a wound; tide-clearing is the lever", and the precedent is Wikipedia's
"revert over lockdown". The risk that matters is meaning — this is read by LLMs — and the
defence for that is at the reader, already in place. So: no walls, no accounts, no
captchas. Make clearing cheap and lossless, and cap what one anonymous act can cost
everyone else.

**What a flood actually costs, and who pays.** New blocks are the dear thing: every block
is a row in the index, and every sweep by every visitor downloads the whole index (31 KB
today; a hundred thousand spam blocks would make it 4 MB for everyone, on every sweep). A
flood of appends into one open accumulator is the second: each append rewrites the whole
block, so a flooded `marks` gets slower until the store refuses it. The third is the wipe
described in section 1.

**Four small measures at the one door, all on unlatched acts only** — a latch-holder is an
author and is never throttled:

1. **The door keeps the last copy.** Before an unlatched block is wiped or replaced whole,
   the prior value is kept once per block per day and expires after thirty days. A vandal
   cannot launder it by wiping twice, and it never grows. This closes the sharp edge; it is
   about three lines. I would ship this one regardless of the rest.
2. **A size cap on a single unlatched write** — generous (tens of kilobytes; the longest
   honest voice in `pool:weft` is about eight).
3. **A cap on new blocks per hour, per deploy** — generous (a table fork births about
   thirty). Over it, births answer plainly that the beach is taking no new blocks this
   hour; every existing block writes as ever. Per deploy rather than per address, because
   every MCP user arrives from the router's one address and addresses are free to rotate;
   per deploy rather than per world, because worlds are free to mint.
4. **A cap on appends per minute to one unlatched accumulator.**

Measures 2–4 cost one counter command on the paths they guard. A vandal can use 3 to keep
newcomers out for an hour. That is "the commons goes quiet a while" — the accepted cost —
and it cannot touch anyone already here. I would build 2–4 and leave them switched off,
set per beach by its owner, until the first flood.

**Clearing after a flood.** A flood shows on the page in 2.1 as one unbroken run. The
owner's script clears it by born-window — everything born between two times that no known
hand latched — and logs the count. A flooded accumulator is restored from the last image
(`beach-restore.mjs --only`), or has the run cut out by slot range, since appends land in
order. Set aside is also the right act for a poisoning attempt: one move takes the text
out of every sweep and keeps the evidence.

**`tide`.** Either write its script or retire the block. I would retire it: removing old
entries from an append-only accumulator breaks the addresses the folds stand on.

## 3. The one real choice — a button for everything, or a sentence to weft

Under the recommendation you get a **button for every stray you minted yourself** (hand 1
— which is most of today's list), and for anything else you say "set aside X" to a keyed
session in the operator clone, which runs the script. You never run a command.

The alternative is an **operator key in the handler** so the page can set aside anything
at a click. I recommend against it. It would be a second authority living in a serverless
environment variable, one leak away from a stranger setting aside the whole beach; it
makes every hosted beach carry the same risk; and it buys only a button in place of a
sentence. If you want it anyway, the narrow form is the safe one: that key can **only set
aside** — never write, never change a latch — and every use shows in the index. Because
set aside loses nothing, even a leaked key would be a nuisance and not a wound.

## 4. The build, smallest first — each ships alone

| # | piece | where | size |
|---|---|---|---|
| 1 | The owner's set-aside script (archive copy, remove, `beach-log` line; put-back is the reverse) | `pscale-beach/scripts`, carried to the operator clones | ~80 lines |
| 2 | The door: `born` stamp, `born: true` in the acknowledgement, keep the last copy before an unlatched wipe or replace | `pscale-beach/api/pscale-beach.js`, canonical first, then happyseaurchin and idiothuman; a smoke test beside `smoke-locks.js` | ~25 lines |
| 3 | The born-lately page, with "set aside" for the holder of a row's passphrase | the site, a static page like its siblings | ~250 lines |
| 4 | The surfaces voice a birth; the naming moment says "new here" | xstream-bsp (mirror), the site's handle popup, the router's stream tool | ~10 lines each |
| 5 | The three caps, built and left off | the same handler | ~30 lines |

Pieces 1 and 3 need nothing from 2 to be useful. Piece 2 touches the beach protocol, so it
moves as law does: this proposal is its record, and the protocol doc's DELETE line and the
archive naming in block-conventions are re-voiced in the same PRs.

## 5. Who pays at scale

Seeing is a public read, paid by whoever looks. Setting aside is a rename, not a copy —
storage-neutral. The owner's script runs on the owner's machine against the owner's
storage, so it federates with the beaches. The kept copies expire by themselves. The caps
cost one counter command where they apply. Nothing here routes through David or one
server. The honest exception is the index itself — the one read whose cost grows with
every block — which is exactly why births are the thing worth capping.

## 6. What I am not proposing

Accounts, captchas, address-based limits, a moderation queue, a reputation score, a
registry of approved handles, or a rule that a name needs a passport before it may speak.
Each would put a wall where the design has deliberately left none, and a newcomer is by
definition a name that stands nowhere.

## 7. What I need from you about today's blocks

Each is one question. Nothing moves until you answer, and I remove nothing myself.

1. **[now:happyhedsgehog](https://beach.happyseaurchin.com/.well-known/pscale-beach?block=now:happyhedsgehog)**
   — confirmed and still there. Shall I set it aside once the script exists, or will you
   remove it yourself with the passphrase that was loaded that afternoon?
2. **[now:Phenomimental](https://beach.happyseaurchin.com/.well-known/pscale-beach?block=now:Phenomimental)**
   — is that September line Matthew's, typed under a misspelt name? If so I would set it
   aside and tell him, so he can say it again as Phenomemental.
3. **[now:David](https://beach.happyseaurchin.com/.well-known/pscale-beach?block=now:David)**
   — is David a handle you still want, or is happyseaurchin the only one? It also owns
   [soft-llm-convos:David](https://beach.happyseaurchin.com/.well-known/pscale-beach?block=soft-llm-convos:David).
4. **The open forks** — `pool:phenomemental`, `liquid:pool:phenomemental`, `task:ada`,
   `shell:Julie J`, `shell:eggthree` — may I set these aside after reading each to confirm
   it holds nothing its twin lacks?
5. **The probe and test leftovers** — about forty names. Once the script exists I will set
   aside the ones weft made, on weft's own judgment and after checking each is unused, and
   list the rest for you. Say if you would rather see the whole list first.

## Sources

The handler: `pscale-beach-happyseaurchin/api/pscale-beach.js` — the wipe (from line 1608),
the index with `touched` (1516–1546), `saveBlock` and the stamp (341–361), creation on
first write (1291–1302), the root latch governing append (1170–1177). The mirror:
`xstream-bsp` `src/components/mirror/Mirror.tsx` on origin/main — `sayReading` (1136) and
`saveIdentity` (1548). The router: `src/tools/stream.ts` (308, 380). The law:
`src/open-commons.json` 1, 4 and 6; `docs/protocol-pscale-beach-v2.md` sections 2.2, 2.6
and 3.4; `proposals/2026-08-05-law-writes-get-their-record.md`;
`proposals/2026-08-20-the-beach-remembers-when.md`. The live apex index, the lock keys
(positions only) and the five blocks above, read 2026-09-21 between 11:48Z and 11:55Z.
