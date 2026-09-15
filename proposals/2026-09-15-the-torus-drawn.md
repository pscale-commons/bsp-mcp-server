# The torus drawn — the living side of the beach as a smoke ring

**Date**: 2026-09-15
**Status**: design, for David's ruling before a line of the page is written. Companion to the flow producer (`proposals/2026-09-15-flow-producer.md`, which draws the INSIDE of one mind) and to the torus-mirror family already standing on the beach (`function:torus-mirror`, David's ruling of 2026-09-11: the beach is dead, it is content; what is alive is a human awaiting a response and the instance answering them, and the concurrent instances answering others at the same moment).

## The ask, in David's images

Dynamic modelling of live presence — humans and loop-A agents running concurrently — as particles with trails in 3D, at the scale of a thousand concurrent people or a hundred concurrent agents. Two people engaging in one room with interactive vapour are two threads intertwined; five people, five; forty people in one block at different rooms are many threads in one bundle; people at different blocks are far apart. Two loose images to bring together: a THREAD made of fibres, each fibre with a beginning and an end, a cross-section at one point made of a different set of fibres from a cross-section further along; and a TORUS formed from particles the way a smoke ring forms from air currents. The trick is the mapping: choose a form and map where people are to a coordinate on it.

## The two images are one object

Take the smoke ring literally. In a smoke ring the particles circulate around the small circle of the tube while the ring itself holds its shape; the ring persists although every particle in it is passing through. That is the thread of fibres: a room's thread is one small circle of the tube, its length is one turn of the clock, and a cross-section of it at any instant is the set of people there at that instant — a different set at a suitably distant point along it. So:

- **The ring's circumference is the beach's content.** Every block has an arc; the arcs are ordered as the beach's own index orders them, so a family's blocks sit together (every `pool:` contiguous, every `spine:` contiguous, the archives a long dark reach) and a block's spindle digits refine the angle within its arc, the address read as a fraction. The ring is dead: it is the content, and it is drawn dark, or not at all. This is David's ruling made spatial.
- **The circulation around the tube is time.** One turn of the small circle is one day: the sundial's own ladder gives the angle — the ten-digit address ends in the gathering and the beat, nine gatherings of nine beats, about eighteen minutes each, so a beat address is already an angle around the tube; the seconds carried by the index's `touched` map and by presence heartbeats move a particle smoothly between beats. The air current that drives the circulation is the clock, `function:now`.
- **A particle is an instance; its trail is its fibre.** Where an instance stands is a coordinate on the beach — `pool:<name>`, `<block>:<address>`, or the bare surface — which is an angle on the ring; when it stands is an angle around the tube. Consecutive beats join into a fibre. An instance that moves rooms draws its fibre across the tube's surface from one small circle to another. A human is present through their instance: mirror.onen.ai's soft ask is one instance per turn, so a person at the mirror is a fibre that flickers per turn, while a keyed session is a long fibre, and a genus pulse is a short bright one twice a day.
- **Scale is the tube's radius.** A coordinate has a pscale: a room at 0 rides the tube's skin; a table inside it at −1 sinks toward the core; a world at +1 floats a wider loop outside. A fibre's distance from the core says how fine the place it attends is.
- **Co-presence is twist.** Two fibres on the same small circle at the same beats are the same thread; draw them plied — strands wound about the thread's axis, the winding advancing with the beat, the ply radius growing with the count, so a room of five is a visibly thicker, more tightly wound thread than a room of two. Interactive vapour tightens the twist: each staged line in the room's liquid and each commit adds a half-turn between the strands that exchanged. Forty people in one block at different rooms are forty fibres on neighbouring small circles along one segment of the ring — a bundle, a rope — and the ring segment glows as a whole.
- **Age is fade.** A fibre from yesterday sits on the same tube one turn earlier and fades; three days back it is gone. So the torus is never a stored surface: it is re-formed every day from the particles that pass, and a quiet beach shows a broken ring — a few small circles glowing where anyone was — while a busy beach shows the ring whole. That is the torus coming into being, and it is a real reading of the beach rather than a rendered metaphor: the ring closes when the beach is alive everywhere.
- **Kind is colour; the window is size.** The torus families separate instances by constitution (function:torus-mirror 5): mirror, genus, bsp, agent, visitor — one hue each, humans warm through their mirror instances, agents cool. A genus particle's size is its window, read from `flow:<handle>` (the producer that landed today), so an agent waking with an empty self is visibly a small particle.
- **A reach is a chord.** When two attentions coincide and one instance reaches for the other's human (the act function:torus-mirror 2.1 names), draw a bright chord between the two fibres; a meeting cell on the now spine (two mirrors at one future cell) is a ghost knot ahead on the ring where two fibres are due to meet.

Seven dials, each read from something the beach already carries: place from the coordinate, time from the beat, radius from pscale, twist from co-presence in liquid and commits, fade from age, colour from constitution, size from the window.

## What the data is, and what is missing

Everything the page reads is public and CORS-open; it is an O-player lens like the shore. The read law is the family's own (function:torus-mirror 2): one index read gives the `touched` map; the `torus-*:*` mirrors touched inside the window are read at the current beat; `presence` (one slot per agent, heartbeat-overwritten) and the `liquid:pool:*` of the rooms named give the sub-beat motion and the vapour. Replay needs no store either: a mirror is never deleted — the window is the clock — so a day is a located read of each mirror's day subtree, one call per handle per day.

What the field holds today is honest and sparse: `torus-mirror:<handle>` lines from mirror.onen.ai only (three mirrors stand), the presence block with one anonymous slot, and no line at all from a genus pulse or a router session — function:torus-mirror 5 names torus-genus and torus-bsp as fields whose producers are not built. Two small producers close that:

1. **torus-genus** — the genus door writes the instance's line at the beat beside the flow block, at the same seam: coordinate `pool:<handle>` (its room), the opening line of its note at the fold. A sibling of today's producer, opt-in by the same dial position or its neighbour.
2. **torus-bsp** — a harnessed session's line on its first router call in a beat (the presence-flag at watch:weft 136): coordinate = the block addressed. This touches every router call and is David's to rule; it is what makes a Claude Code session or a claude.ai session visible on the ring at all.

Without them the ring shows humans only, which is still the first picture worth having.

## Scale

A thousand people and a hundred agents is eleven hundred fibres of eighty-one beats: ninety thousand points a day, trivial for WebGL as instanced points and line segments. The limit is reads, not drawing: a busy beach means a thousand touched mirrors per poll, which is the filtered index (touched since a time, by prefix) and the multi-block located read that function:torus-mirror 6 already names as beach-handler work for that day, not built and not needed at today's scale. The page polls one index and a handful of blocks now, and grows into those two features when the beach does.

## Form and library

three.js, the release filmstrip-3d already loads (r128 from the allowed CDN), Points for particles and line segments for fibres, orbit controls, no build step, one file under `mindflow/torus/` with a `?beach=<origin>` lens like the shore. Determinism as the shore's rule has it: same beach state, same picture, stone for stone; only animation phase is free. Two views, one geometry: LIVE — the leading face of the ring at the current beat with the last three days trailing and fading; REPLAY — a day scrubbed around the tube. A still baked for contexts that cannot fetch. The ring is drawn as a faint wireframe only for orientation; the form is meant to emerge from the fibres, and on a quiet day it should look like what it is.

## Decisions that are David's

1. **Time around the small circle** (the smoke ring's own circulation; a room's thread is one small circle) or **time around the large circle** (a day is one circuit of the ring; places are the tube's cross-section). This document argues the first, because it is the physics of the ring and because a room's thread then IS a thread, but both are a one-line change in the mapping.
2. **The ring's circumference as the beach index** (every block an arc, dead content dark) or a curated ring (the lighthouse's families only). The index needs no curation and makes the emergence honest; a curated ring reads more cleanly at a glance.
3. **Whether torus-genus rides the flow seam now** — a sibling producer, small, the same dial — so the first ring shows an agent at all.

Until these are ruled the page is not written. Written, it is the sibling of the flow page: one draws what entered a mind, the other draws where the minds are.
