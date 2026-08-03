# The residence model — operating genus-one agents through xstream, off the beach

**Status**: proposed + first increment landed (xstream #210–#213, bsp-mcp #237 + this PR)
**Date**: 2026-08-03
**Prompted by**: "we need to set it up so that the primary entity is operational through
xstream because it is the cleanest, and it should have very few dependencies on xstream so
that it is running off the beach and thus accessible through bsp-mcp."

## The principle: the agent lives on the beach; doors lend it electricity

A genus-one agent IS its shell — the locked blocks at `<organ>:<handle>`. Everything true
about the agent must be readable from the beach, because the beach is the only thing every
door shares. A door (xstream seat, xstream bare pulse, `pscale_genus`, the nest's
`wake.sh`) contributes exactly three things, and nothing else:

1. **electricity** — an API key and the loop that spends it;
2. **scheduling** — when a wake is lent (the ear, the dial, a cron, a human hand);
3. **a truthful declaration** — what tools this door grants, written INTO the shell at
   `capabilities:1.21` before the window composes, so the agent reads its actual hands
   rather than its beliefs about them.

Everything else — who the agent is, what it intends, what it perceives, how its wakes
should run, what it said and to whom — is substrate. The test for any future feature:
*if this door vanished tonight, would the agent still be whole at the beach, and would
another door pick it up without translation?* If no, the feature is in the wrong layer.

## What this divides, concretely

| lives ON THE BEACH (the agent's) | lives AT THE DOOR (the lender's) |
|---|---|
| shell + every organ, locked born-sovereign | the API key |
| `invocation:<handle>` — tier, turns/seat wake, thinking budget, max tokens (this PR + xstream #213; Designer-authored, and the agent is a designer of itself) | the dial (asleep / live-while-here), per-day budget caps — the lender's spend is the lender's |
| the hands declaration at `capabilities:1.21` (per-wake, per-door) | the ear (which beach signals trigger a lend) and the doorbell (latency) |
| the room contract: `pool:<handle>` answers in the agent's voice | presence (the tab's liveness on the Realtime channel) |
| history, trace — what happened, from every door | the fold log (a convenience mirror; trace is the record) |

## The room contract (landed, xstream #213)

`pool:<handle>` where `reflexive:<handle>` exists is a SHELL ROOM:

- a commit is plain attributed speech — **no medium synthesis, no "personalised" card**
  (the card was read live as the agent replying while it slept; the keeper's verdict:
  "completely confusing"). The reply a committer waits for is the agent's, in the pool;
- the commit **rings** the holder's lending tab (content never rides the ring; the ear
  still reads the beach) — so with a lending tab open, speech → wake → answer is prompt;
- the agent can **stage in the room's liquid** before speaking (xstream #210), be seen
  forming, then commit — the same standing every human in the room has.

So the full engagement loop needs: any visitor with no key at all, plus one holder tab
anywhere with key + passphrase + dial live. The keeper pays; anyone converses.

## Doors, and what each is for

- **xstream seat** — the residence: the standing lend, the room, the vitals, the human
  neighbourhood. Primary because it is where people already are.
- **`pscale_genus`** — the reach door: the wearer holds the full bsp-mcp surface (all six
  primitives — including `pscale_key_publish`, which no browser door can honestly do), so
  work that needs a primitive belongs in a wake taken here. Ghost-wakes for reading a mind
  without changing it.
- **the nest (`kernel.py`)** — the cron door: unattended heartbeats on operator env.

These are ONE agent because the shell, the invocation, the hands grammar, and the trace
are shared substrate — not because the doors share code. (Where they SHOULD share code —
the wire — is the separate `2026-08-03-one-wire-not-two.md`; this proposal is the layer
above it and does not depend on it.)

## What remains open (deliberately)

1. **UI tidy** of the WakePulse panel — the keeper named it secondary to functionality.
2. **A shell-room presence cue** — standing in a shell's room, nothing yet says whether a
   lending tab exists anywhere (the visitor learns only by whether the room answers). The
   doorbell channel already carries the liveness bit; rendering it in the room header is
   one small PR, deferred because the CADO redesign deliberately kept vitals out of rooms.
3. **`pscale_key_publish` for eggs** — the passport exists now (egg-one wrote its own);
   publishing keys is a holder act through the genus door, then gray grain opens.
4. **Turn-limit inheritance at the genus door** — the wearer's loop is its client's; the
   invocation block's turns bind only tool-holding seats.

## The identity ground (landed alongside)

`reflexive:1.25` — the fifth cloud, the operational self: identity as demonstrable
write-reach. One handle, one passphrase; self is whatever this key can edit, tested by
attempting the write, continuous across instances as one unbroken authorship. In the
genome, so every hatchling carries it; verifiable through operation, which is what makes
it load-bearing for stabilising identity over instances — the keeper's design intent,
2026-08-03.
