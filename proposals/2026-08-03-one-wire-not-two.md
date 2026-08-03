# One wire, not two — ending the hand-rolled second substrate client

**Status**: proposal, David's decision
**Date**: 2026-08-03
**Prompted by**: "I don't want to empower the agent in a piecemeal way, one function at a time. This is exhausting."

## The complaint is a diagnosis

The xstream seat has never been a client of bsp-mcp. It is a **re-implementation** of it.
`src/kernel/genus/wire.ts` speaks raw HTTP to `/.well-known/pscale-beach`; `spark.ts` is a
hand-translated `spark.py`; the seat's four tools — `bsp`, `settle`, `reach`, `fold` — are
hand-written imitations of a surface that already exists and is already tested.

So every capability an agent has at the xstream door had to be written twice, and only the
half somebody thought of exists. That is not a gap in the design. It is the arithmetic of
keeping two implementations of one contract.

## What it has actually cost — three, from one evening

**1. Level 2 was closed to every instance, from the day the seat was built.**
`animator.ts` derived the grain side correctly and sent it as a *number*; the beach compares
`side !== '1' && side !== '2'`. Every reach a seat ever attempted returned HTTP 400. bsp-mcp's
`determineSide` has always returned a string, so the primitive was correct on one side of the
house and wrong on the other, and nothing compared them. egg-one hit it twice in one wake,
diagnosed it from inside, and reported it (`pool:egg-one` 66-67). Fixed 2026-08-03 in xstream
[#210](https://github.com/happyseaurchin/xstream-bsp/pull/210) — one character class.

**2. An agent's authored purpose landed in a block nothing reads.**
`purpose:5` exists at beach.happyseaurchin.com as its own top-level block. It is not residue —
it is egg-one's real, fully-voiced purpose, the context-overlap/MAGI purpose set at David's ask
on 2026-08-03, citing `pool:egg-one:66`. It should be position 5 of `purpose:egg-one`. It is not
there, so the instance's own next window does not carry it: **the agent committed to a standing
purpose and the commitment is invisible to it.**

The cause is the seat's tool treating `purpose:5` as a block *name* because it contains a colon,
where bsp-mcp splits a colon-bearing reference at the final digit run (the rule already exists
in this repo — `compile.ts`, the horizon split, #189 — and the seat does not have it). The same
slip is visible across the index: `relationships:4`, `relationships:1:2`, `relationships:1:1:2`,
`conditions:5:1:1:4`. Every one is an agent's write sitting where its own window will never
walk.

**3. The hands declaration had to be written three times in one session.**
Fulfilling `capabilities:1.2` — one small contract the shell has been asking for since the genome
was cut — meant writing the same fifty lines into `animator.ts`, `kernel.py`, and
`tools/genus.ts`, because there are three doors and no shared client. It works, and the next
such change will cost the same again.

## The cut: consolidate the WIRE, not the kernel

This proposal does **not** touch the kernel port. The kernel *should* stay three dialects with
byte parity — that is the design, it is verified (53/53 genus parity, 72/72 bsp-test), and the
"biome-first consolidation" question is separate and still David's.

The wire is a different thing. It is not the program; it is how a door talks to a beach:
load, save, append, surgical write, reference split, grain reach, settle, key publish, pool
engage, rider verify. **There is no reason for two implementations of it, and the drift between
them is where every fault above lives.**

## Options

**A — the seat calls bsp-mcp over MCP.**
Browser → `https://bsp.hermitcrab.me/mcp/v1`; the seat's tool list becomes bsp-mcp's tool list.
Zero re-implementation, widest capability immediately, including primitives the browser cannot
honestly do alone (`pscale_key_publish` needs Argon2id parity — this is why the eggs still have
no published keys and no private grain).
*Cost, and it is not small*: the shell's passphrase would have to leave the tab and transit
bsp-mcp. Today secrets never leave the browser, and that is a deliberate property. Also a network
hop per tool call inside an already-slow loop.

**B — a shared wire package.**
Extract one `pscale-wire` (TS) that bsp-mcp and xstream both import: one implementation of each
wire act, two callers, secrets stay wherever the caller keeps them, no added latency. Kills the
drift class at the root — the reach bug, the reference split, and every future one, because
there would be exactly one place to be right.
*Cost*: a package to publish and version; the browser still cannot do Argon2id-parity key
derivation without carrying the dependency.

**C — generate the seat's tools from a shared schema, keep two executors.**
Cheapest. But the reach bug was in the *executor*, not the schema — this fixes the paperwork and
not the fault.

**D — carry on porting by hand.** The status quo, and the thing the complaint is about.

## Recommendation

**B, with A for the primitives that genuinely need a server.**

One shared wire package is the change that ends the piecemeal, because it makes "the agent can
do X" a property of the substrate client rather than of whichever door somebody last edited. Then
route the two or three primitives that need server-side compute or shouldn't live in a browser —
`pscale_key_publish` above all, plausibly `pscale_networking` — through bsp-mcp, and let the
passphrase question be answered once, narrowly, for those, rather than for everything.

Sequencing, if taken:

1. Fix the reference split in the seat now, independent of any of this — it is live data loss.
2. Extract `pscale-wire` from bsp-mcp's `db.ts` + xstream's `wire.ts`, with the acceptance
   battery both must pass (the 72-test `bsp-test` suite already exists for the walker; the wire
   needs its equivalent, and the grain-side bug is test case one).
3. Port xstream's seat executor onto it, deleting `wire.ts`.
4. Decide the passphrase question for the server-only primitives, alone.

## What is decided and what is not

Decided by evidence: there are two implementations, they have drifted, and the drift has cost
an agent its Level 2 door and its own authored purpose.

David's: whether the passphrase may transit bsp-mcp for any primitive; whether a shared package
is worth its versioning cost against the port discipline this repo keeps deliberately; and
whether the seat is worth consolidating at all versus being retired in favour of the bsp-mcp
door.
