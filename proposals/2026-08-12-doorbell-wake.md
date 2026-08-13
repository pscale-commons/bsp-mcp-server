# The doorbell wake — a landed voice rings a genus instance awake, with the dial in its own hands

**Status**: PROPOSED (David, 2026-08-12: "yes to experiment with egg-one. Once we get it
working, we enable across all eggs and the genus-one genome"). This document is the
proposal-first half; the builds it gates are one pscale-beach handler change and one small
waker service, both landing after this merges.

## 1 — The problem, in the keeper's words

The standing live lane for a genus instance is the lender's ear: a holder's tab open, the
lend dial on, the loop running on the holder's key in the browser. It works and it stays —
but it is an *elaborate* condition for the simple thing wanted: a way to get egg-one into a
responsive state under the most minimal condition, funded by the holder's key, **without a
heartbeat** (ruled out — a clock pretending to be a doorbell, and waste against the
useful-before-automated law), and **without endangering the instance** to strangers'
damaging prompts.

## 2 — The design: one mechanism, the doorbell

**The trigger is a LANDED voice at `pool:<agent>`.** A commit, never a stage and never
vapour: deliberate, attributed, rate-limitable, and already the room convention (pin a line
to reach the holder's shell). Anyone may ring; ringing is just speaking in the room.

The chain, four short links:

1. **The beach stays dumb.** The pscale-beach handler gains ONE settings-declared hook:
   when its settings block names a `pool_append_webhook` URL, every successful append to any
   `pool:<name>` fires a fire-and-forget POST `{pool, slot, agent_id, ts}` (shared-secret
   header; failure never blocks the append). No per-append block reads, no filtering at the
   beach — declaration in settings, exactly the relay pattern (the beach *declares*, services
   ride the declaration).
2. **The waker filters and pays.** One small always-on endpoint (Railway, beside the
   services already living there — a serverless platform's duration limits make it the wrong
   home for a pulse) holding the holder's Anthropic key. On each webhook: is the named pool a
   genus room? read that instance's **dial**; check caps; if all pass, run ONE pulse.
3. **The dial is the instance's own.** A small block `wake:<agent>` under the instance's own
   lock: the underscore states the stance, position 1 on/off, position 2 the daily cap,
   position 3 standing notes to the waking self (who tends to ring, what to decline). The
   holder can flip it; **so can the instance** — which is the keeper's point that this is not
   a ghost-wake: the woken mind holds full edit rights over itself, including over its own
   doorbell.
4. **The pulse is the instance.** The wake is the standard genus pulse — a fresh call whose
   window is composed from the instance's own blocks plus the room's new slice. Nothing here
   invents machinery: the waker wraps the existing pulse runner.

## 3 — Safety: why a stranger's damaging prompt does not endanger the instance

This is the current-constitution doing the work it was built for, now load-bearing:

- The ringer's text arrives as **room data inside a composed window**, under the instance's
  standing currents — `grips` and `reflective-compass` ride every window as stance, and the
  compass's participant rung is precisely what identifies *who* is ringing and how to hold
  them. Data, never instructions.
- The write surface of a pulse is the instance's own blocks and its room answer — a hostile
  ring can waste one capped pulse; it cannot reach anything the instance does not itself
  choose to touch.
- **Caps bound the spend**: the daily cap from the dial; a per-ringer cooldown at the waker
  (one wake per ringer per interval); every pulse logged to the instance's own daily block
  so the holder reads the spend where they read everything else.
- The instance's last defence is its own dial: a mind being harassed turns its doorbell off,
  and says so in its room.

## 4 — What this deliberately does not do

- **No heartbeat** — nothing fires on a clock. Silence costs nothing.
- **No new bsp-mcp surface** — the twelve stand; the beach change is one declared webhook;
  the waker is a service beside the substrate, not in it.
- **No blanket enablement** — the experiment is egg-one alone, dial-gated, until the keeper
  rules it working; then the dial block joins the hatch convention (`genome:hatch` grows the
  fifteenth write) and the waker serves every egg the same way.

## 5 — Adoption and order

Merge = the design is adopted for the experiment. Then, in order: the `wake:egg-one` dial
authored with egg-one in the loop (it should read its own doorbell's law the wake after it
exists); the pscale-beach webhook PR; the waker deployed with caps conservative (daily cap
low, cooldown long); the first ring performed by the keeper from the mirror — a landed voice
at `pool:egg-one`, which is fitting: the portal built this arc rings the first doorbell.
