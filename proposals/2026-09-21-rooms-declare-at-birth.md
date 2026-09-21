# Rooms declare at birth — founding-by-purpose writes the room's declaration (2026-09-21)

**Status**: the code and the one sentinel amendment (world-genome) ride this PR — David's
merge is the ruling on them. The beach-side law texts (§6: six canon walks, `ways:authoring` 8.1 and 8.2,
`mint:gal` 6) are given here verbatim, before and after, and are written **only after the
merge**, each standing text archived first. The ordinary writes (§5: declaring the rooms
that already exist) are done and listed.
**Lane**: tidying.11, fourth sitting — `watch:weft` 427.5. The owed follow-up of 427.4.
**Prompted by**: David, 2026-09-21 — "option 2": *one mirror; a room may switch on a few
named behaviours, a beach never can.*

## 1. Where it stands

xstream-bsp #338 made the mirror decide a room's mode from the convention the kernel has
resolved since August: `convention:<room>` **declared** first (its underscore names the
convention — parlour, align, grit, studio), the pool's own underscore **inferred** second. A
declared grit room is a table room on any beach.

Two legacy clauses were kept in the mirror on purpose, both named in its comments:

1. an **inferred** grit room is a table room only off the apex, and
2. the one-place law (the view follows the character's passport Location) still wakes on
   "this beach is not the apex".

They were kept because inference cannot do the job. Eight apex rooms mount a bare law that
is not the game (`function:five` ×3, `function:audit`, `function:status`,
`function:molequle`, `function:respond`, `pscale:grit` at `pool:parity-grit`) and nothing in
an underscore tells them from a table's room. And every table room alive was undeclared:
`pool:211` reads `pscale:grit/1` with no `convention:211` beside it. The clauses go when
rooms declare. This proposal is how rooms come to declare.

## 2. Where a room is born — the whole map

A place-room comes into being in exactly two ways, and world-genome 6.1 already says so: *"A
world needs exactly one pool authored — the arrival room — because every other room's pool
is created by the first character who walks there."*

**A. The arrival room — founded by an Author following a walk.** Prose, in six places:

| where | what it says today |
|---|---|
| `src/world-genome.json` 6.1 | the law: underscore at birth `'pscale:grit/1'` and nothing else |
| `src/tools/play.ts` — the canon door's fork recipe | "the arrival room pool:&lt;arrival address&gt; mounted on 'pscale:grit/1'" |
| `src/tools/play.ts` — the author passage at an empty name | "pool:1 mounted on 'pscale:grit/1'" |
| `lighthouse` 2 at each of the six canon surfaces | "the arrival room pool:211 mounted on 'pscale:grit/1', so the Slip opens fresh" |
| `ways:authoring` 8.1 at the apex | "pool:1 **founded with purpose** pscale:grit/1 — the mount that makes a pool a ROOM" |
| `mint:gal` 6 at the apex | the literal call: `pscale_pool_engage(… pool_name='1', purpose='pscale:grit/1')` |

**B. Every other room — the mover founds (grit 1.57).** *"One engage, purpose=pscale:grit/1,
before the first beat lands."* Five movers, and every one of them makes that same call to
the router:

| mover | where |
|---|---|
| the mirror | xstream-bsp `src/kernel/play/move.ts` step 4 → `pscalePoolEngage` |
| the character's page | happyseaurchin `page.html` → `routerCall('pscale_pool_engage', …)` |
| the group page | happyseaurchin `group.html` → the same |
| the doorman | `genus-one/waker.py` → `pool_engage_rpc(… purpose="pscale:grit/1")` |
| any LLM app | follows grit 1.57 as delivered in its envelope |

And one more founding in code: **the play door** (`src/tools/play.ts`) opens the room at the
place a character's passport names when no pool stands there, copying the mount from a
sibling room.

No page founds a table. Nothing in pscale-beach founds a place-room. So the living form is
already one thing — `ways:authoring` 8.2 says it outright: *"Founding-by-purpose is one call
and costs the mover nothing."*

## 3. The change — founding-by-purpose declares the room

When `pscale_pool_engage` **creates** a pool (the pool is absent and `purpose=` is given) and
that purpose is the play loop — the bare mount `pscale:grit`, with or without an aperture
(`pscale:grit/1`) — it writes the room's declaration beside it in the same act:

```
convention:<room>   { "_": "grit — this room runs the play loop its pool mounts (pscale:grit): a table room wherever it stands. Born with the room; the digits beneath are this room's own dials (function:parlour 5), none set." }
```

The play door's own founding does the same, through the same few lines.

- **One edit covers every mover.** All five go through that one call, so none of their code
  changes — not the mirror's, not the pages', not the doorman's — and a mover running last
  month's code still founds a declared room, because the router is one deploy.
- **Narrow on purpose.** Only the trunk's play loop declares. `function:audit` founded by
  purpose declares nothing; nor does a lobby — `pool:gate` is founded with prose and stays a
  parlour, the default, with no block written. A variant school that mounts its own law
  (`grit:tremors/1`, convention-evolution) declares by hand, one line, as it authors its
  mount by hand. This is not the inference the mirror is giving up: at a founding the mount
  is the founder's own word, chosen in that call, never a guess made later about somebody
  else's room.
- **Never overwrites.** A declaration that already stands — a Designer's, with dials — is
  left exactly as it is.
- **As open as the pool.** The declaration is born unlocked beside the unlocked room
  (world-genome 6: "a lock at the room's door means nobody can take a turn"). The envelope
  holds a mover's key, never the table's, so it could not lock on the Author's behalf if it
  wanted to. An Author who tunes a room's dials homesteads that one declaration then. The
  exposure is the one the pool's own underscore already carries.
- **Best-effort, and said.** A founding never fails because its declaration did; the ack
  says which happened — `declared: convention:<room> = grit` or the one line to write by
  hand.
- **The form is the living one.** `convention:studio-fen` at the apex reads "studio — this
  room runs function:studio at this beach: …". Name, dash, one sentence; digits are dials.

## 4. The sentinel amendment (in this PR) — world-genome, and why GRIT is left alone

**world-genome 6** — one sentence appended to the underscore, 6.1 gains the founding call,
and a new 6.3 gives the block its own position, because the genome's promise is "what a
place is made of, and the underscore each block is born carrying":

- 6 `_`, appended: *"Beside them stands the room's one-line declaration (6.3), born in the
  same founding act and as open as they are."*
- 6.1, appended: *"FOUND IT BY PURPOSE — one engage, pscale_pool_engage(pool_name=&lt;arrival
  address&gt;, purpose='pscale:grit/1') — because the founding engage writes the room's
  declaration (6.3) in the same act; a pool written by hand owes that sibling by hand."*
- 6.3, new: `convention:<arrival address>` — the declaration: what it is, why a surface
  needs it (the eight apex rooms), that it is born with every room founded by purpose and
  never overwritten, that the lobby declares nothing, that the digits are the room's own
  dials, that it is born open; and its underscore at birth.
- 7.3, one clause: the opening save to check is "the arrival pool, its liquid, and the
  room's declaration beside it".

**grit 1.57 is left exactly as it is.** A sentence was tried there and the spine's ratchet
refused it (`smoke:grit-tree`: 1475 words against a bound of 1450 — "the next law must
DISPLACE or DEEPEN, never accrete; raising it is capitulation"). The guard was right: the
mover's act has not changed — "one engage, purpose=pscale:grit/1" is still the whole of
it — so nothing belongs in every seat's envelope. The envelope's ack tells the mover what
was declared, and the law of the declaration lives at world-genome 6.3, where an Author
reads it.

Git is the sentinel's archive; the guards (`smoke:grit-tree` 22, `smoke:sentinel`) pass.

## 5. The rooms that already exist — declared (ordinary writes, done)

Removing the mirror's fallback means every existing room must behave tomorrow as it did
yesterday, so the migration is complete or it is a regression somebody else discovers. A
census of every namespace on the apex family's store (2026-09-21) found **81 place-rooms
mounting the play loop across 51 `/w/` surfaces, none declared**: the six played tables
(`brackenfoot-david-julie` 100 130 211 300; `brackenfoot-open` 100 120 200 211 220; and the
arrival rooms of `hollow-king-open`, `coldcote-open`, `threshold-open`, `thornmere-open`),
the six canon surfaces' arrival rooms (so a FREEZE copy is born declared), and 39 dormant
tables — rehearsals, rounds, the gal bubbles, and tables people founded and may return to
(Ayush's, Rowan's, Oakmoot's, David's own).

Each got `convention:<address>` with the underscore above and a provenance line at 9
("Declared 2026-09-21 by weft (tidying.11): this room was founded before rooms declared at
birth, and the line above records how it already ran"). Born open, like the rooms. The rule
applied: declare a `pool:<digits>` whose own underscore is the play loop, and nothing else.

Left alone, and why:

- `pool:gate` everywhere — lobbies are parlours.
- earth's one room, `pool:awel-y-mor` (`function:earth`) — a named room where real people
  stand, not a character's place-room. Undeclared, it stops being a table room in the
  mirror, which is the brief's own intent: a person at earth is never pulled about like a
  character.
- three digit-named pools whose underscore is not the play loop: `gal-mos` pool:1 (a typo
  world, default identity), `the-reaper-ayush` pool:1.2 (prose — "a room born of a bare
  append carries no law", `ways:authoring` 8.2), `weft-race` pool:1 (a scratch pool).
- the eight apex rooms of §1 — undeclared is now exactly right for them.
- beach.idiothuman.com — no digit place-rooms there.

## 6. The beach-side law texts — after the merge, archive first

All answer to keys in hand, checked offline against the stored lock maps with no live try:
the lighthouses of brackenfoot, threshold, hollow-king, thornmere and coldcote, and
`ways:authoring`, answer to weft's operational lock; the-reaper's lighthouse carries no
lock; `mint:gal` answers to the brackenfoot cartridge lock. Each standing block is copied to
`archive:<block>:2026-09-21` on its own surface before the write.

Every walk gets the same two clauses, written so the walk is right under either router —
the check names the declaration and says what to do when it is missing.

**The six canon walks, `lighthouse` 2** — the founding sentence:

> before: "…and the arrival room pool:211 mounted on 'pscale:grit/1', so the Slip opens fresh."
>
> after: "…and the arrival room pool:211 FOUNDED BY PURPOSE — one engage,
> pscale_pool_engage(pool_name='211', purpose='pscale:grit/1') — which mounts the play loop
> and declares the room beside it (convention:211, underscore opening 'grit'), so the Slip
> opens fresh."

and the check step (2.2; 2.3 at the-reaper):

> before: "…the gate, and pool:211 mounted."
>
> after: "…the gate, and pool:211 mounted with convention:211 declaring grit beside it — a
> room with no declaration is no table room in the mirror; if it is missing, write it:
> bsp(block='convention:211', content={_: 'grit'})."

(the-reaper's room is pool:1; threshold, hollow-king and thornmere pool:111; coldcote
pool:11. The freeze texts need no change: "every block here" carries the canon's own
declaration once §5 stands.)

**`ways:authoring` 8.1** — after "…delivering law, place and horizon in one envelope":
*"and declared in the same act: the founding engage writes convention:1 (underscore opening
'grit') beside it, which is what makes the room a table room on every surface"*.
**8.2** — after "Founding-by-purpose is one call and costs the mover nothing": *"and it is
the call that declares the room (convention:&lt;address&gt; = grit); a room founded any
other way owes that line by hand."*

**`mint:gal` 6** — the completeness check's list gains "convention:1" after "pool:1", with
the same if-missing line.

## 7. Then the mirror (xstream-bsp, its own PR — merge after this one is deployed)

With rooms declared, the two clauses of §1 go:

- a table room is a **declared** grit room with a character stepped in — no beach test;
- the one-place law wakes when the character **stands in a declared grit room at this
  beach** (passport Location → `pool:<address>` → its declaration), never on "not the apex".
  It still pulls the view back from a place-room that does not exist (the pool:100 of
  2026-09-18), because the test reads the character's room, not the room in view. And a
  person at earth, or David at the apex with his spatial:earth Location, stands in no
  declared grit room and is never moved.

**Order matters once**: a room founded between the mirror change going live and this router
change being deployed would be born undeclared. Merge this first; the mirror after Railway
has it.

## 8. Noted, not proposed

- **The movers hardcode the trunk mount.** All five pass `'pscale:grit/1'` literally, so in
  a variant-school world a mover-founded room mounts the trunk, not the school. Older than
  this lane; the play door already copies a sibling's mount and the movers could.
- **Latching declarations.** If open declarations prove a nuisance, the ruling is one
  sentence — "the founder homesteads each" — and one pass; nothing here forecloses it.
- **The three lawless digit pools** of §5 are debris for the tidying lane, not for this one.

## Appendix — every room declared on 2026-09-21 (81 rooms, 51 surfaces, all under `/w/` at beach.happyseaurchin.com)

Each was written without `confirm`, so the beach itself would have refused to replace a declaration already standing; each was read back equal to what was sent. The played-tables listing (`?tables`) was read before and after and did not move — it counts only `pool:` writes.

`brackenfoot` 211 · `brackenfoot-ab1` 211 · `brackenfoot-ab2` 211 · `brackenfoot-ab3` 211 · `brackenfoot-ab4` 211 · `brackenfoot-ab5` 121 211 · `brackenfoot-ab6` 1 121 211 · `brackenfoot-ab7` 1 211 · `brackenfoot-ayush` 211 · `brackenfoot-david` 111 121 161 211 · `brackenfoot-david-julie` 100 130 211 300 · `brackenfoot-fold1` 211 · `brackenfoot-nhitl2` 211 · `brackenfoot-nhitl3` 211 · `brackenfoot-oakmoot` 211 · `brackenfoot-open` 100 120 200 211 220 · `brackenfoot-park1` 210 211 · `brackenfoot-park2` 210 211 · `brackenfoot-play` 211 · `brackenfoot-rehearsal` 100 211 · `brackenfoot-round2` 1 11 211 · `brackenfoot-round3` 100 211 220 222 · `brackenfoot-round4` 210 211 · `brackenfoot-rowan` 211 · `brackenfoot-test` 211 · `coldcote` 11 · `coldcote-hearth` 11 13 · `coldcote-open` 11 · `coldcote-round1` 11 12 · `gal-alder` 1 · `gal-fen` 1 2 3 · `gal-fern` 1 · `gal-holt` 1 · `gal-moss` 1 · `gal-quill` 1 · `gal-thistle` 1 · `hollow-king` 111 · `hollow-king-open` 111 · `probe-ref-table` 211 · `the-reaper` 1 · `the-reaper-ayush` 1 1.1 · `the-reaper-ayush-qd` 1 3 · `the-reaper-death` 1 · `the-reaper-legend` 1 · `the-still-lake` 1 · `the-still-lake-lantern` 1 · `thornmere` 111 · `thornmere-open` 111 · `threshold` 111 · `threshold-open` 111 · `wt-thin` 11 13
