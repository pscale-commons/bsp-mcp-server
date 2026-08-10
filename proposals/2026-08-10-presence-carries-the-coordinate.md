# Presence carries the coordinate, not just the place

**Date**: 2026-08-10
**Status**: proposed
**Touches**: `src/block-conventions.json` branch 4.6 (presence). Client side lands separately in xstream-bsp.
**Precedes**: the write. Per the 2026-08-05 law-write discipline — a convention block is read by everyone, so it moves by proposal, not by quiet edit.

## The gap

A presence slot says where an agent is at one scale only.

```
{_: summary, 1: agent_id, 2: address, 3: ISO-ts, 5?: welcoming, 6?: on-mic}
```

Field 2 holds the place — `pool:dovetail`, or empty at the surface. It does not
hold the coordinate of attention *within* that place: the `at=` that narrows a
reader's liquid mirror and their slice of the spool to one node and its subtree
(4.22, 4.51, 4.52).

So two agents standing in one pool, attending different nodes, are indistinguishable
in presence. Both read as "here". They are not: they see different mirrors, different
slices, and each other's staged lines only if their coordinates overlap. Presence —
the one signal that locates somebody who has not yet spoken — is the coarsest
locating thing on the beach, and it overstates co-presence by construction.

The gap surfaced building the presence popover's place tap
([xstream-bsp#232](https://github.com/happyseaurchin/xstream-bsp/pull/232)): the tap
lands a visitor in the peer's pool and then, necessarily, unlocated.

## Why not read it off the staged line instead

The coordinate is already published — a liquid slot carries it at field 2, and a
pool contribution at field 2. So a reader could infer a peer's attention from what
they have staged, with no convention change at all. That was the first instinct and
it is the expensive one, in the two ways that matter.

**It costs reads.** Liquid is per-place: `liquid:pool:dovetail` is a different block
from `liquid:pool:molequle`, and a client's cycle pulls only its own. Learning where
peers are attending means one extra read per distinct place they occupy, on a cycle
that already runs several. The cost grows with exactly the thing presence exists to
show — people spread out.

**It sees almost nobody.** A liquid slot exists only while its author is
mid-composition: one slot per author, overwritten on restage, cleared on commit or
withdrawal, swept on departure. Somebody reading quietly at one node — the ordinary
state, and most of any room most of the time — has no slot at all. "Where they last
were" collapses to "where they last typed, if they have not committed since".

## The change

Carry the coordinate in the presence slot, at position 7.

```
{_: summary, 1: agent_id, 2: place, 3: ISO-ts, 5?: welcoming, 6?: on-mic, 7?: at}
```

Position 4 stays permanently empty — its absence is what tells a reader this is
presence and not a contribution — which is why the optional positions start at 5.
7 follows 5 and 6 as the next free one.

**It costs no server calls.** The heartbeat already rewrites the whole slot every
beat, so the coordinate rides a write that happens anyway; the read side already
pulls the whole presence block every cycle, so it parses one more string. The wire
cost is a few bytes per beat. This is the argument for doing it in presence rather
than anywhere else: presence is the only per-agent write that already happens
unconditionally, whether or not the agent has said anything.

**It needs no migration.** Purely additive. A reader that does not know position 7
ignores it and loses only refinement. A reader that does know it meets an absent 7
as *unlocated* — which is what a whole-place reading has always meant — never as an
error. Old and new clients run against one block indefinitely.

## What changes in the block

- **4.61** — the field roster corrected. It currently glosses field 2 as
  "address-of-attention", which is the thing this proposal adds and field 2 has
  never been; field 2 is the place. Positions 5 and 6 are documented for the first
  time (they have been written by the reference client since the welcoming-duty and
  on-mic work, and the catalogue never caught up), and 7 is added.
- **4.65** — new. The optional positions, and the reason a location is carried at
  two scales rather than one.
- **4.63** — the stated heartbeat cadence corrected from 1.5s. The reference client
  decoupled the heartbeat onto its own 10s timer precisely to get the
  GET-merge-SET off the read cycle; leaving 1.5s next to new text about what each
  beat rewrites would state two different things in one branch.
- **4.69** — gains its child 1, the shape version, which the branch has claimed
  since it was written and never held. v2 = v1 plus the optional positions.

No version-before-replace archive step here: that discipline exists because the
beach has no rollback, and `block-conventions` is a bundled sentinel whose history
is git.

## Found and NOT changed — for the keeper's word

Two things in this branch are contradicted by the deployed code. Neither is in this
proposal's path, and one is a real question rather than a slip.

1. **4.62 says presence slots are "locked under the agent's secret — peers cannot
   overwrite a claimed slot."** No deployed client does this: `presenceHeartbeat`
   has no secret parameter, at any of its three call sites. Slots are open in
   practice, which is consistent with an open beach and with stale-sweep reclaiming
   them, but it is not what the branch says. Either the convention should describe
   the open slot, or the client should start locking — that is a design decision,
   not an edit.
2. **4.69 claims 9.1 carries the version**, and 9.1 did not exist. This proposal
   creates it, which closes the smaller half; the larger half is whether a shape
   version earns its keep at all when additions are additive by construction.

## Sequence

1. This proposal, PR'd and readable.
2. `block-conventions` 4.6 updated in the same PR.
3. xstream-bsp writes 7 in the heartbeat, reads it into the presence mark, shows it
   on the place line, and passes it to the spawned column so the place tap lands at
   the coordinate rather than beside it.
