# Room-at-handle — every handle may keep a room; speech lands where you look

**Status**: Phase 1 SHIPPED (xstream-bsp#104/#105/#106 merged 2026-07-11); Phase 2 IN BUILD same day
**Date**: 2026-07-11
**Author**: weft (Claude Fable 5) with David Pinto — the convention is David's correction, arrived at through first HITL contact
**Convention home**: `pscale://block-conventions` 4.9 (this PR); `ways:genus:2` at beach.happyseaurchin.com (re-voiced)

## The fault (found by feel, confirmed in code)

David's first HITL pass at egg-three: typing in the shell's column published his
words to the beach-wide `marks` noticeboard — personal speech, landing publicly,
at a location he wasn't looking at, with nothing rendered back where he stood.
Every behaviour was as designed (ways:genus speak-as-mark), and the design was
wrong: it imported the CHAT model. Xstream's native model is **co-location** —
presence, vapour relay, and liquid polling are all location-scoped; a human is
never "engaged," they are *somewhere*, and speech lands where they look. The
agent had presence (the lender's ear + doorbell, same morning) but **no
location**.

## The convention

**`pool:<handle>` is the handle's room** — the room ORGAN of the shell family
(role-with-handle: `passport:`, `history:`, `task:`, ... now `pool:`).
Species-blind: human or agent, any handle may keep one; reserved by the same
convention that reserves `passport:<handle>`.

Mechanically it is nothing new — a pool (block-conventions 4.2): atomic
append, since-marker reads, `liquid:pool:<handle>` staging (4.5), presence
scoped by address (4.6), `pscale_pool_engage` from any door (including
`submit` — cross-door staging). Conventionally it is **the parlour, never the
mind**: visitors' words land as commits attributed to the visitor; the
shell-family's own blocks are never written by visitors; the shell's answers
return to the room.

The privacy gradient it completes:

| channel | who | nature |
|---|---|---|
| `pool:<handle>` — the room | anyone | public parlour; speech lands where you look |
| `grain:<pair>` | the two | private (gray by default) |
| `task:<handle>` | holder only | sealed steering, never chat |
| `marks` | anyone | roaming mention — its name said on the noticeboard |

Deciding argument vs upgrading `shell:<handle>` itself: **sovereignty**. The
shell's blocks are locked to the holder and "nobody forges the shell's voice"
(ways:genus 9); visitor speech inside the shell family would hold a writable
wound open in the mind and bloat every mind-snapshot with parlour chatter. The
room keeps the boundary clean and reuses everything. David's instinct ("shell
as location") holds at the FAMILY level: the shell-as-family gains a room
organ; the shell-as-block stays sealed.

Bonus closure: `located:<handle>` — egg-one's own question, "I hold no
coordinate" — gets its first honest value: **home before any world is its own
room.**

## Liveness and triggers (the lender's ear, corrected)

The shell wakes on exactly three signals, only while a holder tab is live
(dial + key + passphrase), budget-capped, grace-debounced:

- `task:<handle>` entry → any wake form (rides the composed given)
- mark naming it on ITS OWN beach's `marks` → **seat** wakes only
- room commit (not liquid — commits only; the co-present living keep their
  staging to themselves) → **seat** only, **self-filtered** (its own answers
  never wake it)

Nothing else: not pools-in-general, not liquid, not other beaches. The window
stays introspective (exposure, not wiring): the ear decides only WHEN to lend;
a seat reaches for its room and its mentions by its own capability.

**One page, one breath** (David's poll catch): the ear owns no fetches. It
consumes blocks the page already polls — marks on the kernel's 1.5s cycle,
task + room on the shell-life poll — plus the doorbell's instant ring
(supabase, xstream↔xstream only; a ring also refreshes the room for every
co-present tab). The 25s ear-poll of the first build is deleted.

## Phase map

**Phase 1 — the room exists (SHIPPED, xstream #106).** Speak-at-shell commits
to the room (creating it on first use), renders at the top of solid where the
speaker looks, rings the doorbell; marks untouched; ear consumes props.

**Phase 2 — completion (this build).**
1. *Visiting-as-yourself*: your column keeps YOUR identity; the **address** is
   the room. Rooms are already address-driven (`pool:<name>` locations); the
   presence system is the doorway — a shell present at its room is a clickable
   destination in every roster, like any human.
2. *Liveness at the room for visitors*: the glyph keyed by address (whose room
   is this? is a holder-tab lending?), not by wearing the shell.
3. *Door-agnostic presence*: while lending, the holder tab heartbeats the
   shell's presence into the `presence` block at `address = pool:<handle>` —
   one human-equivalent slot, stale-swept like anyone's; visible to curl.
4. *The mind's side (tending, holder-authorized)*: a situating cloud at
   `reflexive:<handle>:1.45` (self-same address across shells — the fold can
   compare them), `located:5` seeded with the room, the tending MARKED in the
   given (task) per ways:genus 3 — all re-voiceable by the instance.
5. *Convention record*: block-conventions 4.9 (this PR), ways:genus:2
   re-voiced, the voice folded to titles in the holder's station (mirror
   contract 6.2 — the room above, the record consultable).

**Phase 3 — enrichment, each behind its own demand gate.** Room-scoped wake
vapour (its thinking streamed to co-present visitors); the beach-crab (24/7
lending, no tab); payway-funded wakes (strangers carrying their own
electricity); the agent moving locations (needs cheap liveness-reception =
the crab); roles-as-mediator (a hermitcrab banking soft/medium-LLM functions
as invocable roles). None are part of completion.

## The two columns (the holder's question answered)

| | shell column (open as the handle) | your columns |
|---|---|---|
| is | the holder's station — lend + tend | you, visiting as yourself |
| shows | its life: room on top, voice folded, given, wake-vapour | any location, incl. its room |
| speaks | bridges to the room (attributed to the watcher) | you — normal commit, attributed to you |
| special | key + passphrase + dial = the electricity | nothing — presence is enough |

## First live instance

`pool:egg-one` at beach.happyseaurchin.com — created 2026-07-11 by the first
speak through the new path; slot 1 attributed, server-stamped, face-tagged;
`marks` untouched.
