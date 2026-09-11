# The RPG as it stands — scope, the three portals, the four faces, and two plans (2026-09-11)

**Status**: SCOPE for David's ruling (the rpg.1 window). Nothing built, no law block
touched; one lane entry at `watch:weft` and one intake entry at `project:nomad-rpg` future
(branch 2, appended) point at this file. Weft, Claude Code, keyed.

**What was fired to write this** (the portal convention — record the instruments, not only
the findings): the identity file; `orientation:weft` whole; `cook:weft`; the beach indices
of the apex, `urb.beach`, `earth.beach`, `thornwood.beach`, `thousand-valleys.beach`,
`beach.idiothuman.com`, and the tables `/w/brackenfoot`, `/w/brackenfoot-rehearsal`,
`/w/gal-quill`, `/w/gal-fen`, `/w/gal-fern`, `/w/thornmere`, `/w/threshold`,
`/w/coldcote`, `/w/coldcote-round1`, `/w/hollow-king`, `/w/the-reaper`, `/w/gal` (empty);
`project:nomad-rpg` whole, `project:xstream-interface` and `project:urb-corpus` discs;
`spine:onen-rpg`, `function:onen-rpg`, `onen-rpg:happyseaurchin`; `worlds`; `lighthouse`;
`proposal:three-portals`; `proposals:weft` 2.8; `audit:cado-faces`; `log:urb-hitl`;
`spatial:urb`, `keeper:urb`, `identity:urb` at depth 1; `frame-spec:brackenfoot`,
`keeper:brackenfoot`, the brackenfoot lighthouse and char-creation; `mint:gal`,
`encounter:gal`'s family names, `bubble:gal-1`, `gallery:gal`; `rules:nomad`; `grit`
(apex) against `pscale://grit`; `pscale://world-genome`, `pscale://char-creation`;
`function:night` at coldcote-round1; `mirror`; `pool:rpg`; `pool:weft` since 93;
`task:weft`; `watch:weft` at pscale 0; `history:egg-two`; the proposals of 2026-06-23,
07-12, 07-14, 07-24, 07-30, 08-06, 08-16, 09-07, 09-08, 09-10 in this repo;
`docs/rpg-reorientation-log.md`; `src/tools/play.ts`, `src/grit.json`,
`src/tools/stream.ts`; in xstream-bsp `Mirror.tsx`, `Column.tsx`, `kernel/envelope.ts`,
`kernel/play/*`, `lib/world-to-beach.ts`, `main.tsx`, the mirror-5 architecture scope;
in happyseaurchin-home `rpg.html`, `play.html`, `page.html`, `experiences.html`. LIVE:
`pscale_play(world='brackenfoot', handle='rpg1-probe')` (the canon sign came back);
`pscale_play` at `/w/brackenfoot-rehearsal` as `moss`, keyless (the full table envelope
came back — place read live from the canon through the placing star-ref, cast by
appearance, ways, liquid, per-actor dice); the browser at `mirror.onen.ai/?world=<that
table>` (the world parameter was dropped and the visit landed on the welcome room); the
browser at `xstream.onen.ai/?world=<that table>&character=moss` (the thin-room column
rendered place, nearby cast, ways, the forming intention, the empty beat record).

## 1. The sentence

The Onen RPG runs on the substrate and is playable today through ONE door only — a
person's own LLM app holding bsp-mcp, at a private table a host has prepared. Through the
browser it is playable at `xstream.onen.ai`'s column surface, not at `mirror.onen.ai`
(same deploy, different route; the mirror route drops a world link on the floor). Through
o-pages it is visible (`/rpg`, `/play`, `/gallery`) but there is no page for a table or a
character. Every registered world is a canon scenario, so a stranger's first call is
handed Author work — the one standing decision at `proposals:weft` 2.8. The open shared
world (urb) is a spine with no rooms and no way in. The four faces exist as doors and
recipes; only Character has a surface built for it.

## 2. The modes, named plainly

The user-facing model is two nouns — a SCENARIO and a TABLE — and the beach carries five
shapes of play surface beneath it. They are distinct by what is READ and what is WRITTEN,
not by different engines: one loop (GRIT), one door (`pscale_play`), one genesis
(`char-creation`).

**A. Canon scenario + private table (the reference model, world-genome 1.2).** Six canon
scenarios stand in the `worlds` register at `/w/`: brackenfoot, thornmere, threshold,
coldcote, hollow-king, the-reaper. A group plays at `/w/<scenario>-<group>`: the keeper
carries a placing star-ref into canon, the kit (rules, roster, char-creation) is copied as
lockfiles, characters and room pools live at the table, the PLACE is read live from canon
at engage. Replay is a new table name; a million groups play one scenario concurrently as
a million namespaces; a re-authored canon reaches every table at its next engage. This is
"repeatable, separate scenario". WORKING, verified at `/w/brackenfoot-rehearsal` today.

**B. The open shared world — urb.** `urb.beach.happyseaurchin.com` holds four blocks:
`spatial:urb` (floor 10, the world rung with its refusals — orini not horses), `temporal:urb`,
`identity:urb` (authored kinds), `keeper:urb` (the hold, the author's fence). It is the
SPINE every scenario is placed on (brackenfoot at 2111111100; threshold, coldcote,
hollow-king grafted in August). Nobody can play "in urb": no rooms, no passports, no
door. The design for ENTERING a living world (gather as for a scenario; choose when and
how to join; author a proximate area one step from a named neighbour; a random encounter
opens) is captured (memory of David's 2026-07-19 brief; `project:nomad-rpg` present 1.3
says "world-vs-scenario dissolved: canon grows at its home, tables stamp a region, a notable
outcome folds back by an Author write") and NOT built. `earth.beach` is the real-world
sibling and is further along (passports, rooms, a census, /here) — the RPG check in the
minimal-structure proposal §3 says the two are one structure with one difference (urb's
kinds are authored, earth's are generated).

**C. Bubbles — the gal mint.** `mint:gal` + `encounter:gal` (five two-layer d10 ladders) +
`roster:gal` + `char-creation:gal` + `style:gal` live on the APEX commons and mint small
standalone tables at `/w/gal-<name>` (gal-quill, gal-fen, gal-fern, gal-alder, gal-moss
from July). A bubble is placed on the urb spine by a placing stub in `notes:scene`
(later `keeper:scene`). This is the nearest thing to "any player can join and play in the
urb world": an Author wearing the mint once opens a bubble at any spine coordinate with no
operator. Note for David: `/w/gal` is empty — "gal" is a REGION-CULTURE of urb
(`spatial:urb` branch 2, the twilight land the tables play in), not a table.

**D. Rigs and cartridges — backstage, never player-facing.** `scripts/rpg-rig.ts` (NHITL,
the real tools against a local file-beach), `scripts/rig-filmstrip.ts` (dataflow /
threads / observer views), `pscale-beach/scripts/thornwood-rig.mjs` (rules-only). The
cartridge packs (`pscale-beach/packs`: thornwood, thousand-valleys, brackenfoot) are
file-side operator tooling superseded by `pscale://world-genome` as the standard form;
brackenfoot's pack is the seed of `/w/brackenfoot`. The sub-domain rig worlds
`thornwood.beach` and `thousand-valleys.beach` are EMPTY today, yet the worktable's map
(4.3) and worlds wave (5.1, 5.2) still list them as living — stale, to settle.

**E. Elsewhere.** `beach.idiothuman.com` carries the separate crowvale experiment on the
older skeleton engine (leave it). `/w/the-reaper` is Ayush's: `spatial:the-reaper` locked
to his key and carrying his session's ending state (residue named in the 2026-08-02 record).
The apex still carries the July rpg vestiges (`pool:rpg` now the players' room, `rules:nomad`
de-thornwooded, archives of the June architecture blocks).

**The distinctness, in one line.** A and B differ by ROOM STATE at arrival (empty → the
scenario's cold open; running → the latecomer's solo arriving beat, char-creation 3.3)
and by whether the place is PLACED on a spine; the door already forks on emptiness
(Author passage) and on the canon sign (lighthouse 9.3). Nothing about the engine
differs between the modes. What is untidy is the debris around them, not the modes.

## 3. The three portals — state today

**Portal 1, LLM-app via bsp-mcp — WORKS.** `pscale_play` at a table returns the whole
situated current: the operating directive (`pscale:grit/1`), the place walked to its
address through the placing (cross-origin star-ref, compile.ts), the ways, the cast split
HERE NOW / ABOUT, the liquid with the window stamp, per-actor dice, the character's own
passport/witnessed/knows/history. A turn is one engage plus one act. Entry (gate → genesis
→ re-enter) costs 16–17 calls (NHITL round 3). The standing fault is the DOOR: every
registered world answers a fresh handle with the canon sign and two walks (join a table
someone prepared, or prepare one as Author). No one-call first turn exists. This is the
decision at `proposals:weft` 2.8 — (a) a standing open table per starter scenario, (b) an
honest promise, (c) both.

**Portal 2, the browser — WORKS at the full surface, NOT at the mirror route.**
`xstream.onen.ai/?world=<table URL>&character=<handle>` renders the directive-room column
(thin-room, xstream-bsp #239): place, nearby cast, ways as move doors (the four-step move
executed deterministically with read-back), forming intentions, the beat record, the
no-key notice. It needs a passphrase per character or the roster host-key. `mirror.onen.ai`
is the magic-mirror fork (`Mirror.tsx`): Character-only, pool model, no world handling
(the `?world=` parameter is discarded before first render; verified). Since 2026-09-07 the
site and the blocks say "one name: mirror", so the current promise "play in the mirror"
is untrue as written. Two honest resolutions: teach the mirror route to route a world link
to the column surface (small, but the mirror charter freezes its limbs and `mirror:5` says
the shared basic grows for no one — so a proposal against the charter, or a fork), or name
the column surface as the play door (`play.onen.ai` on the same deploy) and let the mirror
stay the parlour. The mirror's stream mode (xstream-bsp #275) is the right SPECTATOR
surface for the RPG's readings (§6), whatever is decided about play.

**Portal 3, o-pages — VISIBLE, not playable.** `/rpg` reads the worlds register live and
holds the players' room (`pool:rpg`, empty); `/play` explains Onen and NOMAD; `/gallery`
renders stills; `render.html` shows any block raw; `/page/<handle>` reads a person's
passport, now, spine and pool at the APEX — not table-scoped. There is no TABLE page (a
keyless spectator view of a room: place, cast, beats) and no CHARACTER page at a table
(passport, witnessed, knows, with the player's edit-latch for their own journal). Both are
small: `page.html` is the pattern, the beach is CORS-open, the room read is one GET.

## 4. The four faces — state

**Character.** Proven by NHITL across many rounds; two HITL sessions (David + Julie,
thornwood July, coldcote-round1 2026-08-11) found the substrate held and the CLIENT had
six faults — all closed by the thin-room revision. Per-actor deterministic dice, the atomic
window claim with the seen-guard, fog by earned names, the lent turn, the staged move: all
live. The gap that matters for "retaining consistency of character": a character's blocks
live AT THE TABLE (world-genome 1.2, char-creation 2), so a character is table-bound; the
same handle at a second table is a new person, and the 2026-06-23 "Bram leak" showed why
transplanting is worse. A character HOME (the character's own blocks at a surface it keeps,
referenced from tables the way places are referenced from canon) is not designed. It is
the one Character-face design question this scope raises.

**Author.** The Author walk exists as convention at every canon lighthouse (prepare a
table: keeper with placing, the kit, the gate, the arrival pool mounted); the bubble mint
at `mint:gal`; the standard form at `pscale://world-genome` with the door contract (an
empty surface receives the Author passage); `scripts/author-task.ts` (a commission →
a place with its pool, proven); the corpus migration that poured David's books into urb's
registers; the names-across-worlds law (2026-09-10). Package consistency is held by
reference (tables copy no place), by the keeper's fence (`keeper:urb` 4), and by the
graft law (world-genome 2.4). NOT proven: fold-back of a table's outcome into canon by an
Author write (worktable 3.1 leaves it "held at the trajectory"). No Author surface exists
beyond an LLM with bsp.

**Designer.** `rules:nomad` is copied per table (fork by design — a grittier group edits its
own copy); `pscale://grit` is the architect's sentinel and never changes; `rules:<world>`
and `frame-spec:<world>` are per scenario; a Designer edits by bsp write under the table's
lock. NOT proven: a second rules block on GRIT (the D&D test, worktable future 2.05); a
packaging-and-adoption convention for rules variants (`rules:<variant>` mounted by a table,
payway-gated) — deferred at David's word ("designer edits afterwards"); NOMAD's own action-
block redesign (postponed). The one Designer surface is xstream's D panel for shells, not
for tables.

**Observer.** `scripts/observer-recap.ts` (the taxed observer, the lent turn — proven
NHITL); the NIGHT reading organ at coldcote-round1 (`function:night` / `spine:night` /
`night:<handle>` / `night`) — catch-up, spectating, retelling through
`pscale_stream_engage`, storing nothing, the acts untouched; `/gallery` + the BYOK render
loop (o-page and xstream Observer panel; the observer writes the prompt, the render is the
user's own key); `style:gal` as the world's look. The observer conundrum (what to watch
vs how to shape it) is parked at David's word. For "an API for third-party AI services to
produce graphics with consistent characters and backgrounds": the API already exists — it
is the wire (`?block=` GETs, CORS-open); consistency of a figure is `passport:3`'s look plus
`style:<world>` plus per-subject seeds held as runner config (07-24 §6). What is missing is
a compiled SCENE BUNDLE at a URL — compile.ts pointed outward (the view-spec renderer,
07-24 §5) — so a service fetches one document, not nine blocks.

## 5. Scale and the AI dependency — as the design stands

Storage is addresses at a beach: a table is a namespace at `/w/`, free to mint, free to
abandon; rooms are per-place pools with one atomic claim per window, so scale is
horizontal by room. One Upstash behind one Vercel handler serves every table at this beach;
past that ceiling the answer is federation, and the reference model already crosses
origins (a table at any beach can place itself on urb's spine by an origin-qualified
star-ref — compile.ts resolves it). The router (bsp-mcp on Railway) is a stateless walker
and runs anywhere; the browser surface talks to the wire directly.

Inference is the player's: their own LLM app through the connector, or BYOK in the browser,
or the roster host-key proxy (capped, allow-listed, metered). NPCs cost nothing as
STANDING FIGURES (the seed answer, grit 4.3), then the LENT TURN on attention already
present (the observer tax, grit 4), then `character-act` (an active NPC on a holder's open
tab, one δ call per beat), then the crab table-service as a payway product (future 2.07,
David: "good in principle"). `egg-two` (purpose-rpg, hatched 2026-07-09) has never woken;
it is the candidate Designer's helper, not a dependency. No worker AI is required for
anyone to play; every LLM in the loop is triggered by a person. The scale question that
needs a decision is the host-key: public first turns through the browser either spend
David's roster key under a cap or require a key from the player.

## 6. What changed since the last RPG session, and what it offers

Since the July tables: spine-mirror-tree is operational (tree:8), `pscale_stream_engage`
exists and stores nothing, the pool-versus-stream split is deliberated and its verdict
stands (log:urb-hitl 5: ACTS keep the pool — irrevocable beats, atomic single resolution;
READINGS take the stream — render, catch-up, spectating) and was PROVEN on a live table
(log:urb-hitl 6, the night organ). The sundial rides every envelope; the now family gives
every handle a clock mirror; earth carries S·T·I parity with urb; compile resolves
origin-qualified star-refs so frames cross beaches; presence carries the coordinate; the
doorman answers a room when the holder is away; the mirror has a charter, a fork law and a
stream mode; identity is ruled as mirrors plus a perspective tree (the minimal structure).

What that offers the RPG, each a proposal of its own and none of them urgent before
people play:

1. **Readings as streams at every table** — generalise the night organ: one reading law
   mounted per table (or per scenario, inherited), so catch-up, spectating and retelling
   are one `pscale_stream_engage` and the mirror's stream mode becomes the spectator door.
   The acts stay on GRIT and the pool; nothing in a room changes.
2. **The character's home** — the same reference move for persons that world-genome 1.2
   made for places: a character keeps its own blocks at one surface and a table holds only
   what the group makes there. This is the continuity-of-character question and it changes
   genesis, so it is David's ruling first.
3. **The world's clock** — `temporal:urb` and the tables' beats on the sundial, so a
   scenario's day and the world's epoch read on one ladder (the now family, for worlds).
4. **Frames as compiled bundles per face** — `frame-spec:<world>` already names the
   apertures; the door compiles the Character frame; Author, Designer and Observer frames
   compiled at the door would give each face its window in one call (the 07-19 rigor
   gradient, unfinished half).
5. **The outward scene bundle** — compile pointed at a renderer: the table page, the
   character page, and the document a graphics service fetches.

## 7. Plan A — the first version people can play

Three decisions are David's, each one sentence to give:

- **D1, the door.** Recommendation: (c) — one standing OPEN table per starter scenario
  (`/w/brackenfoot-open`, founded once by weft, named in the register's third field), so a
  stranger's first turn is one call; private tables for groups as now. Orphan characters
  at the open table are the accepted cost of a public first turn.
- **D2, the browser door.** Recommendation: name the column surface as the play door
  (`play.onen.ai` on the same deploy, or the bare `xstream.onen.ai/?world=`), and teach
  the mirror route exactly one thing by proposal against its charter: a world link routes
  to the column surface. The mirror stays the parlour and becomes the spectator surface.
- **D3, the host-key for public play.** Yes with the existing cap, or players bring a key.

Then, in order:

1. **Settle the debris** (one keel or weft pass, blocks only): worktable present 1.1 and
   1.2 to past; map 4.3 and worlds wave 5.1, 5.2 corrected (thornwood and thousand-valleys
   are empty; the six scenarios and urb are the worlds); the July tables either left (free)
   or archived; the-reaper's residue handed to Ayush.
2. **Found the open tables per D1** and correct the promise in the tiles
   (`spine:experiences` 1.5, 3.2) and at `/rpg`.
3. **The table page and the character page** (happyseaurchin-home, `page.html` pattern):
   a keyless spectator view of a room and a character's own page at a table, with the
   edit-latch journal box. Small; the beach reads exist.
4. **The browser door per D2** (a route, a hostname, one line in the mirror).
5. **A human round across all three doors**: David and one friend at one table — one on
   the LLM app, one on the column surface, a third person watching the table page — the
   night organ catching them up; findings to `log:urb-hitl`; client faults fixed as found
   (the pattern of 2026-08-11 says substrate faults will be rare).
6. **Publish**: `/rpg` leads with "play now" (the open table), then "host a table", then
   the players' room; the connector line and the browser door on the page.

Exit test (the worktable's own law, 9.2 — play, never shipping): two people who are not
David play a session at a table through two different doors and tell the night back from
the reading organ, and a third who was not there catches up from the table page.

## 8. Plan B — the systemic build (each a dated proposal, in this order)

- **B1. The character's home** (§6.2) — continuity of a character across tables and
  worlds; genesis writes at the home, tables reference it; David's ruling first.
- **B2. Entering the living world** — the 2026-07-19 brief built on the bubble mint: gather,
  choose when and how, author a proximate area, a random encounter opens; then patchwork
  and continuity (the gal roadmap stages 3+); `identity:urb`'s kinds as the cultural mirrors
  a Character reads (minimal structure §3).
- **B3. Readings as streams per table** (§6.1) and the mirror's stream mode as the
  spectator door.
- **B4. Designer packaging** — `rules:<variant>` mounted by a table, adoption by mount,
  payway at the collective's position 9; the D&D test proves the two-tier split.
- **B5. The outward compiler** — the view-spec renderer, the scene bundle for render
  services, the gallery runner on an operator key with tickets; consistent figures by
  passport look + style + seeds.
- **B6. The NPC economy** in its degradation order — standing figures, lent turn,
  character-act, crab table-service (payway), egg-two's first wake as the Designer's
  helper.
- **B7. Federation for scale** — a second beach hosting a scenario placed on urb by
  cross-origin reference, proving "millions" is horizontal; the sub-domain promotion path
  (copy, re-key, grant) exercised once.
- **B8. The battery** — the experiential battery's RPG row (proposal:three-portals 6)
  walked by a Sonnet-grade seat at each stage; the NHITL rig kept as the stress floor
  (feedback: NHITL prepares HITL, never replaces it).
- **B9. Housekeeping** — cartridge packs retired in favour of genome seeds (or kept as
  freeze exports); the apex rpg vestiges archived; `docs/rpg-reorientation-log.md` marked
  historical.

## 9. What this session did not do

No block of law was written or re-voiced; no code was changed; no table was founded. The
door probes were keyless reads. One lane entry at `watch:weft` and one intake entry at
`project:nomad-rpg` branch 2 carry the pointer to this file. The next act is David's
three sentences (§7).
