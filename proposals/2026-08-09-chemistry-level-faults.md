# The chemistry-level faults — where semantic-molecules go wrong

**Date**: 2026-08-09
**Status**: proposal. Nothing here changes a block, the code, or a convention.
**Asks for**: adoption of the fault names, and one decision that is David's alone (§6).
**Companions**: `proposals:weft:2.5` (the divergence, named the same day); `2026-07-29-spine-mirror-tree-substrate-response.md`; `2026-08-06-stream-vs-pool-sealed-trial.md` §6.1 (the jettison law).

---

## 0. Why this exists

The physics level is written down and holds: one block, the semantic number that
addresses it, the walker that does nothing but walk. `sunstone`, `whetstone`, the
parser invariant. A session that gets physics wrong is *told* — the walker
rejects it.

The chemistry level — blocks in company — is written down too, as of 2026-08-01→05:
`orientation:weft:8.2` (a compound is a set sharing an SP coordinate space plus
references; two bonds — shared address first, reference second; shared *name* is
discovery only, never constitution), `block-conventions:8.8` (the composition
reading: the reference-direction law, component vs product), `grips` (CADO as four
holds, a face read off the hands and never stored), `whetstone:8`, `sunstone:5.7`.

What is **not** written down is how a compound goes wrong. There is no walker at
this level and nothing rejects a malformed molecule. The faults below have each
been diagnosed between two and four times, under a different local name each time,
always from inside whichever system the diagnosing session happened to inhabit —
and so none of them accumulated. This document names them once, at the level they
live at, so the next diagnosis is a lookup rather than a rediscovery.

The test of this document is not whether it is true. It is whether a session six
weeks from now, holding a component two systems both want, recognises the shape
before it edits. See §5 — an undelivered fault list is inert, and that is itself
one of the faults.

---

## 1. THE CONTESTED COMPONENT

**The fault.** Two systems both lawfully claim one component. Each system is
internally coherent. A session standing in system A reads the component, finds it
inconsistent *with A*, and corrects it toward A — correctly, by A's lights, and
invisibly wrongly by B's. A later session standing in B corrects it back. The
component oscillates; each correction is defensible in isolation; the operator
watching from outside sees a thing that will not stay fixed, across half a dozen
touch-points.

**Why it is a chemistry fault and not a bug.** At physics level a position belongs
to one block and has one meaning. The moment a component participates in two
compounds, its meaning is no longer a property of the component — it is a property
of the compound doing the reading. Nothing in the component records that. The
context window holds one compound at a time, so the session is *structurally*
unable to see the conflict; it is not being careless.

**The instances, each named locally and never generalised:**

| date | local name | the contested component |
|---|---|---|
| 2026-07-11 | "three pool models coexist in the codebase" (A/B/C) | commit semantics at a pool |
| 2026-07-12 | "two GRIT blocks exist and DON'T yet agree" | `grit` — engine vs RPG play-loop |
| 2026-07-27 | "face is a label at every layer and a coordinate at none" | the CADO face |
| 2026-07-30 | "FIELD 4 IS CONTESTED across this shell" (`orientation:weft:9.1`) | field 4 — face vs status tag |
| 2026-08-06 | "the TWO-OUTLET-MAPS seam" (`pool.ts:1547`) | where a faced commit lands |

Five diagnoses, five names, one disorder. The nearest thing to a general
statement is the fourth's remedy — *"read a block's own root before writing its
4"* — which is correct and was never generalised beyond field 4.

**The resolution, already demonstrated once: DECLARATION BY DATA.** `pool.ts:1547`,
"the mount gates the map": two outlet maps are lawful, so a room must *declare*
which it runs, and the declaration is its own underscore holding a bare operator
ref. Not a flag in code, not a naming convention, not a session's inference —
content in the component, readable before acting. This is the correct shape
because it survives the context window: the declaration arrives with the block.

**The test, for a session about to edit a shared component:** name the second
system that uses this. If you cannot name one, you have not looked — every
component named in more than one convention block has at least two. Then read the
component's own root for a declaration. If there is none, the component is
undeclared and your edit is a coin-toss; say so rather than making it.

**Standing rule proposed:** a component used by two or more systems carries its
governing system in its own content, at its root. Adding a second system to an
existing component is not complete until the declaration exists.

---

## 2. THE LEAK — a label acquiring functional force

**The fault.** A word coined *outside* the blocks — in a tool parameter, a code
comment, a UI string, a conversation — starts doing work. It gets read, matched
on, branched on, and taught. The instructions for operating the substrate migrate
out of the block semantics and into vocabulary, and the LLM begins navigating by
label logic instead of by unfolding addresses. The block still says what it says;
nobody is reading it any more.

**This one is already named — three times, converging, and one of them is David's:**

- **The jettison law** (`2026-08-06-stream-vs-pool-sealed-trial.md` §6.1, David,
  named there for reuse): *semantic flow is less traceable and reversible than
  data flow.* An experiment is hermetically sealed only if its **blocks**, its
  **code**, and its **vocabulary** all delete without residue.
- **The naming reflex** (`orientation:weft:6.2`): DO NOT NAME WHAT THE ADDRESS
  ALREADY SAYS. Worked twice on 2026-08-08 with `room` — invented as a synonym,
  removed (xstream-bsp#227), then *defended* by promoting a gloss found in
  `block-conventions:4.7` into a law. The sharper half of that record: the reflex
  does not only invent nouns, it **promotes a gloss it finds into a law**, because
  a law is the kind of thing code can hold.
- **Label, not coordinate** (`project-face-coordinate-not-label.md`, 2026-07-27):
  face is written at every V-L-S layer and read as a coordinate at none.

**The live instance in this thread.** `mirror` names two different things: the
per-person block `V:<handle>`, and "the liquid mirror" — a rendered view in the
engage envelope. The second is pure label; it exists only in code comments and the
tool description, and it appears there roughly twenty times. The consequence is
exact: the sentence *"the liquid is compiled from mirrors"* is unparseable to a
session reading `pool.ts`, because in that window "mirror" already means the
liquid list. The operator's true statement reads as nonsense and gets discarded.

**The test** (from `orientation:weft:6.2`, kept verbatim because it works): say the
sentence with the address instead. *"A pool at pscale 0"* rather than *"a room"*.
If it says the same thing, the noun is decoration. If it says less, the noun may
be earning its keep — and then say what it carries that the coordinate does not.

**Proposed extension.** The test currently applies to nouns being introduced. It
should also apply to nouns being *reused*: before using an existing term for a
second thing, check what it already names in the compounds this component belongs
to. Reuse is cheaper than invention to commit and more expensive to unpick,
because it leaves no new word to grep for.

---

## 3. DELIVERY, NOT DEFINITION

**The fault.** A contract that is written, correct, canonical and *not delivered
into the context window* is inert. It is not weakly effective. It has no effect at
all, while producing the full appearance of governance to anyone reading the
repository.

**Prior statement of it**, from the CADO delivery audit of 2026-07-13 — *"delivery,
not definition, is the failure mode: a register contract in a sentinel nobody
receives is inert (the pool-engage lesson again)."* The parenthetical is the point:
it had already happened once. `pscale_pool_engage` exists as a primitive precisely
because personal synthesis was moved from a response envelope into convention,
where it stopped working — the sixth primitive, `pscale_networking`, exists for
the identical reason at Level 3. **This substrate has twice grown a primitive
solely because prose could not carry an operational discipline**, and the lesson
still has no name.

**Why it is chemistry and not process.** At this level the unit of operation is
what the window holds. A compound is only *composed* if its parts arrive together.
A law that lives in a block nobody's door fetches is not a weak part of the
compound; it is not in the compound.

**The live instance.** `tree` is the law for spine-mirror-fold and it is complete —
including `tree:8` placing `pool:V` *inside* the family, and `tree:9.1` giving the
pool's underscore as the machine-read mount. `block-conventions:4.2` is what a
fresh session reads to learn what a pool is. Branch 4 never points at `tree`; the
string `spine:` occurs in it exactly twice, both parenthetical, both inside *field*
descriptions. So the family law is undelivered at the pool door, and a
conscientious session reliably learns the 2026-05 pool as the whole truth.

**The test:** for any law, name the door that delivers it and the call that fires
that door. If the answer is "it's in the conventions", it is not delivered.

---

## 4. THE UNPLACED COMPONENT

**The fault.** A component that belongs to a compound but has no declared role
*in* it. Sessions do not leave it blank — they improvise a role, and each
improvises relative to the system they are standing in. It is the seedbed of §1:
today's improvisation is tomorrow's contested component.

**The live instance, and the one that cost this week.** `block-conventions:8.8`
gives the composition reading: blocks agreeing on coordinates with no reference
either way — *a spine and its mirrors* — read by bsp-floor, **the fold their
computed product**. That is the whole compound as the chemistry law states it.
The pool is not in it. Not excluded, not qualified — absent.

Meanwhile `tree:8` says the family comprises spine, mirrors, fold **and** `pool:V`,
"the gathering place at the tree". So the family convention has four members and
the composition law has three, and nothing says what the fourth *is* — component or
product, base or service, peer of the mirrors or a view over them.

Into that gap, `function:audit` improvised — and did it explicitly:

> **POOL LAW** — pool:V is where a stage is *discussed*, never where status is
> *recorded*. Commit status to your MIRROR at the stage's address; commit
> discussion to the POOL.

That is a reasonable improvisation and it is *a decision about the compound's
shape, made inside an operator*. It makes the pool a **peer** of the mirrors —
a second primary channel beside them. And it is where the operator's model and the
keeper's model part company, because the keeper's model (recorded in his own words
at `proposals/2026-07-29-family-form-biome-audit.md` §1) has the pool as neither
peer nor base:

> Every block can carry per-person reflections. The base block is treated as
> **objective**; each participant holds a **subjective** mirror at the self-same
> addresses; and the synthesis of mirrors is the **social** product. The mirror
> reflections **can be concatenated as liquid in a pool** — but the pool may not
> exist, or is a convenience, an automated service someone mounts as a **halfway
> house toward synthesis**.

Objective / subjective / social is a *level* distinction. The pool in that reading
is a **service over** the mirrors, not a member beside them — which is why it "may
not exist" without the family being incomplete.

**The collapse this produces.** With no level recorded, pool and mirror present as
siblings. A session must then pick one to be primary, and picks whichever its
system makes primary — RPG picks the pool, tree picks the mirror. Neither is
wrong inside its system. Both are wrong about the compound.

**Why the two systems collide exactly here** — each has two of the three, and they
are missing *different* ones:

- **RPG**: `spatial:<world>` is the objective; `pool:<room>` is the lived
  experience; the subjective mirror was **deferred** — on record 2026-07-12 as
  "knows:`<handle>` is semantically a mirror-on-spatial-spine = the future join,
  not a build item."
- **Tree**: `spine:V` is the objective; `V:<handle>` is the mirror; the lived
  experience is **under-specified** — so the pool, the only member both systems
  reach for, was handed the discussion job by default.

**The test:** for every member of a compound, state whether it is a component
(authored, locked, owned) or a product (computed, owned by nobody) — `8.8.2`
already draws that line — and if it is neither, say so out loud rather than
inferring a role from the system in view.

---

## 5. The operational clause — or this document is fault §3

A fault list in `proposals/` is a definition, not a delivery, and by its own §3 it
does nothing. Adoption therefore means, in order:

1. **The faults become a block**, not a file — the substrate is the documentation
   surface for what agents read (CLAUDE.md, standing rule). Candidate placement:
   a branch of `grips` (the chemistry apex, already holding the compressed
   chemistry at branch 6), or a sibling named for the level. `grips` is preferred:
   it is already mounted at the compile doors via the STANCE completion, which
   means it is already *delivered*, which is the only property that matters.
2. **Fault §1 gets its cross-reference at the point of edit** — `block-conventions`
   branch 4 pointing at `tree`, and `tree` pointing back. One line each way. This
   is the smallest edit that would have prevented this week.
3. **Nothing else.** No new primitive, no new parameter, no code. Every fault above
   is a fault of what is *written and delivered*, not of what the walker does.

Law-class writes go proposal-first and version-before-replace
(`2026-08-05-law-writes-get-their-record.md`), which this document satisfies for
step 1 and 2.

---

## 6. What this does NOT decide

The open question stands exactly where `proposals:weft:2.5` left it, and it is the
keeper's alone:

> Is the pool's liquid a **separate co-present buffer** that happens to sit beside
> the mirrors (what is built), or a **live view of the mirrors** at the attended
> address (what the keeper specified)?

This document's contribution is only to say *what kind* of question that is: it is
a §4 question — the placement of an unplaced component — and therefore it has a
third answer besides A and B, which is the level answer: the pool is a service
over the mirrors, and `liquid` at an address is the concatenation `bsp-floor`
already computes. If that is the ruling, then `liquid:pool:<name>` becomes a cache
at best and a rival source of truth at worst, `solid` becomes a fold rather than an
accumulator, and the medium-LLM's job is already described by the operator
convention — all three consequences stated by the previous session, and all three
still true.

**It is not proposed here.** Ruling on it changes what a commit MEANS in every live
family, and that is a keeper's call made once, deliberately, not a substrate-side
inference. What is proposed is only that the question stop being re-derived every
fortnight by a session that cannot see the other half of the compound.
