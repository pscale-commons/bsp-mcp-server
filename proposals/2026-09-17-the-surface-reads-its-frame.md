# The surface reads its frame — how a world, a room and a hand configure what a page or the mirror shows (2026-09-17)

**Status**: PROPOSAL — a survey and one systematic way, asked for by David (2026-09-17, the
rpg.3 sitting): "the mirror UI may have different buttons (like dice to roll…) and just as
the o-pages can contain UI that is influenced by the beach (the go drop-down is a
configuration saved on the beach), so the mirror UI is influenced by the character and
world or ruleset it is set in… a systematic way that it can operate which is elegant and
minimal and maximises the pscale and federated approach so that it is fluidly
configurable." Nothing here is built. No primitive, no new block family, no config system:
every home named below already exists. Six small steps at §5, each its own PR, none urgent
before people play. Companions: `2026-09-15-the-table-in-the-mirror.md` §2 ("one mirror, no
skin… dice and other instruments can arrive later as a tool array in the mirror frame —
the extension point, named and not built"); `2026-07-24-frames-on-the-spine.md`;
xstream-bsp `HANDOVER-ui-as-pscale.md` (13 May, unbuilt); the world-genome's
reference-not-copy law; log:urb-hitl 16.

## 1. How a surface is configured today — five mechanisms, none shared

Read from code and the live beach on 2026-09-17.

1. **The person's posture, on the beach.** `lists:<handle>`: branch 1 the projects row,
   branch 2 the go menu, each a nested chain where rank is depth; written whole under
   `lists-latch:<handle>`; the catalogue and the defaults live in `theme.js`. Reading
   postures (theme, /now's display, "workings") stay on the device, by design.
2. **The organs a page shows, in page code.** `page.html` names its blocks (passport,
   knows, purpose, history, witnessed, the room, night); `self.html` (/passport/<handle>)
   reads every `<role>:<handle>` block off the index but labels each from a table in code,
   in a PERSON's words. Both take `?world=`. Shown Ugarth, /passport says "what you offer"
   over *Character Force ~8* and offers "on the globe" and "/here" to a man standing at a
   ford in Brackenfoot: the machinery carries to a character, the words and the doors do
   not.
3. **The mirror's dials, per beach and per user.** `settings` at the beach (vapour,
   liquid, presence, inbox, recipes by tier and face, the bus at 6, the torus) overridden
   by `shell:<handle>` 5 — user, then beach, then code (`settings-reader.ts`). Service
   doors are read from `ways:doorbell` and `ways:push`.
4. **The room's law, sniffed.** The mirror decides a room is directive by matching its
   pool's underscore against `pscale:` / `function:`; then the situation panel, the ways,
   make-it-happen and the render beneath the beat appear. `convention:<pool>` — declared
   first, inferred second, with the room's own dials in its digits — is written
   (`kernel/convention.ts`) and used by the column only. The ruleset is a hardcoded name:
   `rules:nomad` in the mirror's fold and in the waker's.
5. **The world's frame, unread.** `frame-spec:<world>` says of itself: "the SINGLE
   substrate source — xstream should resolve THIS, not define a frame of its own": per face
   (1 Character, 2 Author, 3 Designer, 4 Observer) and tier, the addresses that compose the
   aperture, and at 9 the frame's own metadata (the window span). The mirror passes
   `frame: null`; the o-pages list it and never compile it; the open tables neither carry
   nor reference it (brackenfoot-open holds no `frame-spec`, and no `spatial`).

Unbuilt beside these: the 13 May handover's per-user UI block at `shell:<handle>` 6 — an
address since taken by grains.

## 2. The principle — a surface is a reader, and the frame is the configuration

A window is composed before any token fires, and whoever curates the composition curates
the mind (`2026-07-21-current-constitution`). The same holds for eyes. A surface should show
what the window holds, and be configured by the blocks that configure the mind reading
beside it — never by a second system that can drift from them. So there is no UI
configuration to design. There are three questions, and each already has a home:

| the question | its home (exists today) | who writes it |
|---|---|---|
| WHAT IS HERE — which organs compose this surface | `frame-spec:<world>`, by face and tier: a list of addresses | the world's Designer |
| HOW IT RUNS — the law, its dials, its instruments | `convention:<pool>` naming the operator and carrying the room's dials; the operator and ruleset blocks themselves | the room's owner; the ruleset's Designer |
| HOW I LIKE IT — my order, my doors, my posture | `lists:<handle>` (and `shell:<handle>` 5 for the mirror's dials); reading postures on the device | the hand |

Where a service lives is a fourth, already answered the same way: `settings` and `ways:*`
at the beach (`pool_append_webhook=…`; the enrol door in `ways:doorbell` 2).

**One ladder, nearest wins, absence falls through** — the law locks and the gatekeeper
already keep: the hand → the room → the table → the world the table stands in, BY REFERENCE
(the table's `keeper:scene` 3 names its master; a world-level block absent at a table is
read there, as /page already reads `spatial:`) → the beach → the sentinel → the code's own
default. Every rung is one block read. Nothing is merged or cached; a surface walks until
something answers.

**Code holds kinds; blocks hold instances.** A surface knows how to draw a ROLE — the name
before the colon: a passport as a sheet head, a `spatial:` reference as a place, a pool as
a record, liquid as what stands declared, an account as the moment lived. The frame says
which roles are present, in what order, for which face. A role the surface does not know
degrades to its opening sentence and a raw link — frames degrade, never break (compile's
own law), and that same sentence is the fork law's invitation.

## 3. Words and instruments — declared by the law that needs them

**Words.** A label is never in code when a block can say it. What position 1 of a
character's passport IS belongs to the world's ruleset: `char-creation` 2 already defines
it in prose (capability in the ruleset's terms; the want; the look and the standpoint).
Declared once in the machine-read form the beach already uses inside prose — `key = value`,
as `settings` 6 and the convention's dials do — a page in a world takes its sheet's words
from there: `sheet.1 = capability`, `sheet.2 = the want`, `sheet.3 = how they are met`.
Absent, today's words stand. The same block says which doors a sheet offers: a character's
place is walked in its world; "on the globe" is an earth door and is never offered where
the standpoint is not on earth — read from the reference itself, no rule needed.

**Instruments.** Dice belong to NOMAD, not to the mirror. A ruleset that needs an
instrument declares it where it states the mechanic, one line beneath
`rules:nomad` 2:

```
instrument = dice; shows = luck; form = d10! − d10!; dealt = seed
```

`dealt = seed` is NOMAD's own law — luck is fixed from the window and the character before
resolution, so the instrument DISPLAYS what was dealt (the envelope already carries it; the
mirror hides it in "the room, in addresses"). A table of friends on another ruleset writes
`form = d20 + modifier; dealt = hand` and the same instrument becomes a roll whose result
rides the declared line. The KINDS are a small closed vocabulary in surface code — a die,
a track, a clock, a choice, a map; their parameters are data forever. An unknown kind draws
its own sentence. Adding D&D is writing a block.

The ruleset itself is named, never assumed: `frame-spec` 3 already lists `rules:nomad` and
`rules:<world>` for the Designer's face; the mirror's fold and the waker's read THAT (or the
room's `convention:<pool>`) instead of the literal string.

## 4. What this makes of the questions asked

- **urb.beach or earth.beach as the ground.** No surface distinguishes them. A standpoint
  is a reference into whichever `spatial:<world>` the passport names, at whichever origin
  serves it; the room's law is whatever its convention mounts — GRIT with NOMAD at a table,
  the parlour or `function:now` at an earth place. One mirror, no skin: the skin is the
  frame. The second track (2026-09-14) changes where a character's blocks live; it changes
  nothing here, because a surface only ever follows references.
- **The user pages, for characters.** /page, /passport and the shell are one renderer over
  a handle's own blocks and already take a world. They become a character's sheet the
  moment their words and doors come from the world (§3) instead of from a person's table
  in code. One caution the ruleset must speak to, not the page: every organ is editable
  under the latch, and at a shared table a player rewriting their own capability line is
  the table's business — a `sheet.1 = capability; held = table` word, read by the page as
  read-only, is the smallest honest gate, and it is convention, as fog of war is.
- **The go menu.** Already the pattern in miniature: a list on the beach, the hand's own,
  defaults in code. A world's own doors (its tables, its roster, its scenario) are the same
  list one rung up the ladder — the world's, read when the hand has said nothing.

## 5. Six steps, smallest first — each its own PR, none blocking play

1. **The ruleset is read, not named**: the mirror's fold and the waker's take the ruleset
   from `frame-spec` 3 / the room's convention, falling back to `rules:nomad`.
2. **The mirror resolves a room's convention with its own resolver** (`convention.ts`,
   declared first) and stops sniffing the underscore.
3. **A table reads its world by reference**: one helper, in the mirror and the pages — a
   world-level block absent at a table is read at the origin its `keeper:scene` 3 names.
   The open tables then have a frame-spec without carrying a copy.
4. **The sheet's words from the world**: the `sheet.*` lines in `char-creation` (canon
   sentinel and the five scenarios); /page and /passport read them in a world.
5. **One instrument**: the `instrument =` line under `rules:nomad` 2; the die drawn in the
   mirror's room panel and on the character page beside what stands declared.
6. **The hand's posture for the mirror**: the unbuilt per-user UI block takes the next free
   branch of `lists:<handle>` (3) rather than `shell` 6, since `lists:` is already where a
   hand keeps what it chooses to see.

## 6. What this is not

Not a theme engine, a layout language, a component registry or a settings service. Not a
new block family — `frame-spec`, `convention`, `rules`, `char-creation`, `lists`,
`settings`, `ways` all stand. Not a schema: the machine-read form is a `key = value` line
inside a sentence a person can also read, because the other reader is an LLM and a block
must serve both. Not a gate: every rung is convention, read by the surfaces that honour it
and ignored harmlessly by the ones that do not — which is what lets anyone build their own
surface on the same beach and have it come out right.
