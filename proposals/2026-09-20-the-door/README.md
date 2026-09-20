# The door — one entrance over two questions

*Proposed 20 September 2026 by weft, at David's asking (welcome.1), carrying keel's
`meeting-places-scope.md` v2 of the same day. Record at `watch:weft` 415.*

---

## 1. What was asked

David: a proper system for welcoming people. There have been many attempts — o-pages
(`/experiences`, `/welcome`), mirror rooms (the welcome parlour, how-we-meet), LLM-app
orientations and primitives (`pscale_play`, `pscale_invite`) — and the result is that he
himself gets confused. He wants one page of big obvious buttons, each expandable to its
explanation, in the idiom of the group page's bar (`show the words`). He asks two things
outright: **does the real/fantasy split need an architecture underneath?**, and **should the
door wear the standard go menu?** He also wants a surface an LLM can read to compose an
outreach email — a general link and a specific one, and text to copy per audience.

Keel's scope doc says the same territory in its own words: experience first, information as
the fallback; two questions asked one at a time (Earth or Urb; then mirror, page, or your own
assistant); six cells, each needing a stable address.

---

## 2. What is actually there — read live, 20 September, not from memory

**The front pages point at empty rooms.** `pool:welcome` — linked as "the welcome room" from
*both* `/experiences` and `/welcome`, the single most-clicked destination either page offers —
holds **zero entries**. `pool:rpg`, linked as "the players' room", **zero**. `pool:arrival`,
**zero**. Meanwhile `pool:how-we-meet` holds ten voices and real conversation, and is linked
from nowhere.

**The live fantasy play is unlinked.** `brackenfoot-open` is a standing table: 33 blocks, a
`pool:gate`, five rooms, Astrel and Ugarth's passports — the table David's own group page
plays. `thornmere-open` stands too. The `worlds` register lists five gated open tables. No
front page names any of them.

**Earth and urb are live sub-beaches** (`earth.beach.happyseaurchin.com`,
`urb.beach.happyseaurchin.com`) and answer the well-known. Earth holds `rules:earth`,
`char-creation`, `spatial:earth`, four passports — but no `pool:earth`. Urb holds
`keeper:urb`, `spatial:urb`, `pool:211` and two characters — but no rules and no gate.

So the welcome system is not missing. **It advertises the rooms that are empty and hides the
ones that are not.** A stranger following either front page today lands in silence while the
only lively rooms sit one link away, unnamed.

---

## 3. The diagnosis — six taxonomies of one territory

The confusion is not too many doors. It is that six live surfaces classify the same doors
along six different axes, and a reader holding them at once cannot see one map:

| surface | its axes |
|---|---|
| `/experiences` | portal × activity — 3 × 4 = twelve cells on one screen |
| `/welcome` | none: one page doing five things at once |
| keel's scope doc | place × portal — 2 × 3 |
| `outreach:keel` | audience × door |
| `orientation:portals` | nine kinds of *arriving instance* — not a person's menu at all |
| `siteDoors` | work / glance / with — the pages **of a handle that already exists** |

None is wrong. They disagree about what the axes are, and every new page has added a seventh.
**The fix is not another page. It is to settle one axis-set, put it in one block, and make
every surface render from it.** The block is the architecture; the page is a rendering; the
email is another rendering; `/explain?block=…` is a third, and already exists.

---

## 4. The proposal

### 4.1 One block — `meet`

Three questions, in David's own order, as the shape of one block. Question zero (experience or
information) does not get a screen of its own: information stands as the third, quieter choice
beside the two worlds, so it is answered in the same glance.

```
meet
  _   the door: two questions and you are somewhere
  1   THE REAL WORLD        — the button's sentence
      1  live, with whoever is here      — the button's sentence
         1  where it takes you           (the address)
         2  what it is like              (the words the button expands to)
         3  who hears you, and how soon  (honest, including "nobody yet")
         4  the line to copy             (for an email, or to say to an assistant)
      2  on a page, in your own time     — …
      3  through your own assistant      — …
  2   A MADE-UP WORLD       — …   (1, 2, 3 the same three ways)
  3   JUST TELL ME WHAT THIS IS — …
```

A spindle, not a fan: a reader walking `meet:2.1` arrives self-contextualised — *a made-up
world → live at the table → here is the address, what it is like, who will hear you, what to
copy.* Four leaves per cell because those are the four questions a reader actually asks; five
positions left free.

**The six cells' stable addresses, which the scope doc asks for, are pscale addresses** —
`meet:1.1` … `meet:2.3` — and the page's query is the same address: `/meet?at=2.1`. No route
table, no six new pages, nothing to keep in sync. The address of the words *is* the address of
the door.

### 4.2 One page — `/meet`

Big buttons, one column, thumb-sized. The whole plate goes; the chevron on its right opens the
words in place. The bar carries the acts in the group page's exact idiom — `show the words`
(every choice open at once, so the whole map is on one screen) and the theme switch — because
the bar is for acts and the canvas is for choices.

Every word comes from the block, read live. The words change by a write, never a deploy.

Each cell wears its honest state: **open**, **quiet**, **not open yet**. A door that is not
open says so and explains what to do instead. That honesty is what makes the page usable as
David's own map rather than another thing to be confused by.

**The mock is beside this file** — `meet-mock.html`, self-contained, opens offline. It carries
the words as they would really be authored, so the shape and the register can be judged
together. Proven in the pane: both registers, the expansion, `show the words`, and the deep
link `?at=2.1` landing on the right cell with it open.

### 4.3 Some are more fun than others

David's instruction, and it belongs in the block rather than in a stylesheet: each cell's
sentences are written in that cell's own temperature. *"You arrive as someone else. A valley,
an inn, and a table already playing"* is not the same voice as *"Looking is invisible; the
moment you write, a voice lands and David or Julie is told."* A uniform template across six
cells would flatten exactly the difference a reader is choosing between.

---

## 5. Does the real/fantasy split need an architecture underneath? No.

Demonstrated, not asserted:

- The `worlds` register already holds both kinds as **rows of one list** — `earth →
  earth.beach.happyseaurchin.com` sits beside `urb → urb.beach.happyseaurchin.com` and the
  seven scenario tables, each with its route and whether it is a surface or a gate.
- `pscale_play` already resolves both by **the same call**. A world is a world.
- Earth and urb are **the same shape of sub-beach**, each with spatial, identity, keeper and
  pools. The only asymmetry is data, not structure: earth has rules and character creation,
  urb has neither yet.

So real and fantasy are **positions 1 and 2 of one block**, and nothing beneath needs to know
which is which. Any attempt to make the substrate carry the distinction would be the reflex
CLAUDE.md names — rebuilding in code what the geometry already carries.

One consequence worth stating plainly: because the split lives only at the door, a third kind
costs one position, not a migration.

---

## 6. Should the door wear the standard go menu? Not yet, and here is why

`siteDoors` lists the pages **of the handle in the URL** — `/now/<handle>`, `/here/<handle>`,
`/page/<handle>`. Its own comment says it: *"Only the page knows who is standing in it."* A
newcomer at the door has no handle, so the menu would render as a list of doors that cannot
open. That is worse than absent.

So: `/meet` calls `siteDoors` only when a handle is carried in (`?h=`), which is the returning
case. For a newcomer the bar holds two acts and nothing else.

A related thing that is *not* part of this door, noted so it is not lost: the menu's WORK list
is a **person's** pages. A character's pages are different ones (`/page/<handle>?world=`, the
table, the group page). When the fantasy side wants a menu it wants its own list, and that
belongs with the character page, not here.

---

## 7. The explain surface — what an LLM reads to write an email

No new page. Three pieces that already exist, wired once:

1. **`meet`** carries, at every cell, the address and the line to copy (positions 1 and 4).
   `/explain?block=meet` renders it for a human today, with no code written.
2. **`outreach:keel`** already holds the audience map — AI / self-organisation / RPG-for-film,
   each with its human door and its assistant door. It gains one thing: each audience row
   **names the cell address it should link**, e.g. *a game designer → `meet:2.1`*. Reference,
   never copy — the words stay in `meet`, the aim stays in `outreach:keel`, and neither rots
   when the other changes.
3. **`llms.txt`** gains one line pointing at the door.

Then "a general and a specific link" is answered exactly: the **general** link is `/meet`
(or `/meet?at=2` for a reader who is obviously a games person); the **specific** link is the
cell's own destination, held at `meet:<cell>.1`. Both come out of the same block, so an email
and the page can never disagree.

---

## 8. The one engineering change — a door onto silence is worse than no door

The scope doc asks whether a voice landing at a sub-beach fires the push bus, and whether a
watch can name a pool on another origin. Both were checked in the code and on the wire:

1. **Neither sub-beach fires anything.** The bus is one declaration per beach — `settings`
   position 6. Earth and urb have **no `settings` block at all**. This is two `bsp()` writes,
   not a code change.
2. **The engine would carry it but no ear could hear it.** `in_family()` in `engine.py`
   already accepts a sub-beach and a `/w/` table as the beach's family — a table's doorbell
   rings through it today. But `match_and_deliver` is gated to the apex host
   (`engine.py:1157`), and a watch's parameter is a bare pool name with no origin. The code
   says so itself at that line: *"Ears name rooms at the apex … but is matched to nobody's ear
   until ears learn to name a world's rooms."*

So the change is real, contained, and already scoped by its own comment: the watch gains an
origin, `entry_of` reads at the event's origin rather than the pinned beach, the gate drops to
`in_family`, and the note's link carries the world. One file.

Until that lands, **no cell on the real or fantasy side may claim someone is coming.** The
page says what is true, which is why the state chip exists.

---

## 9. Build order — differing from the scope doc in two places

1. **The door, first.** The scope doc puts the chooser fourth. It goes first, because the
   stated pain is David's own confusion and the chooser is the thing that removes it — and
   because a door that renders each cell's honest state is useful on day one, before any cell
   is improved. It is also the cheapest thing here: one block and one page.
2. **Link what already stands.** `/experiences` and `/welcome` stop pointing at
   `pool:welcome` and `pool:rpg`, which are empty, and point at what is live. This is an
   afternoon and it is the largest single improvement available.
3. **Notifications from the worlds** — the two `settings` writes, then the engine change,
   then one watch each for David and Julie. Until this, every "someone is coming" is a lie.
4. **`pool:earth`** at the root of the earth beach, with its opening words.
5. **The urb door** — gate, rules, the Padley inn. The scope doc calls this the first build on
   the fantasy side because a browser-only stranger cannot enter urb. True of urb; but the
   fantasy cell is **not empty today**, because brackenfoot-open and thornmere-open stand and
   play. So this is a deepening, not a blocker, and it drops behind the three above.
6. **Testing** as the scope doc has it — seven paths, Julie first. It is right and unchanged.

---

## 10. What this does not settle

- **The block's name.** `meet` is proposed because the scope doc's own principle is *"come and
  meet us"*, because `/meet` is short enough for an email, and because `door` collides in
  speech with the doorman (`orientation:portals:4`) and with `siteDoors`. If David prefers
  `door` or `way-in`, it is a rename of one block and one page, today only.
- **The lock.** Proposed under the shared project lock, not weft's — David edits these words
  as often as weft does, and a door whose words only one hand can change is the wrong shape.
- **`/experiences`.** It is a good deep grid and a bad front page. Proposed: it stays, reached
  from the foot of `/meet` as "the deep grid", and stops being linked as an entrance.
- **`/welcome` stays exactly as it is** — it is not a chooser and should not become one. It is
  the working keyless cell behind `meet:1.2`, and breaking it to make room for a chooser would
  cost the one door that demonstrably works.
