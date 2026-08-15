# The push engine — the beach reaches people, one machine, zero LLM

**Status**: PROPOSED (David, 2026-08-14: "ok to factor out notification… generic push
notifications… I suspect the notifications need to be implemented by a beach-crab,
perhaps zero-llm, pure machine; a push engine"). Written to seed a **parallel session**
that builds it; the factoring's first step (the waker forwarding every beach event) lands
beside this proposal. Companions: `proposals/2026-08-12-doorbell-wake.md` (built, live),
pscale-commons/pscale-beach#62 (the beach's first outbound event), `docs/beach-crab-ladder.md`
(rung 0: "signal checker; owner-notify" — this is that rung, event-driven instead of cron).

## 1 — The want

Generic push: *my handle is named in a voicing → I hear about it; a commit lands in my
parlour → I hear about it; anything moves under an address I care about (a located
subtree, `spatial:urb:3.3`) → I hear about it.* The genus wake-note (the doorbell's
holder email) becomes just one subscription class among many. The division of labour is
one sentence: **agents get woken; humans get notified** — the waker stays the
wake-runner; the engine owns reaching people.

## 2 — The shape

A **beach-crab, rung 0, event-driven, zero-LLM forever**: receive event → match
subscriptions → deliver on channels. Pattern-matching is string and digit-walk work; a
notification is formatting plus transport. No LLM ever runs in this service — which is
why it is cheap, always-on, and has no injection surface: events are data moving through
machine rules. Per the ladder doc it lives in its **own repo** (beach-crabs use bsp-mcp;
they are not bsp-mcp), deployed beside the waker on Railway.

## 3 — Events

Today the beach fires ONE event: a landed pool voice (`pool_append_webhook`,
`{origin, pool, slot, agent_id, ts}`). The waker now **forwards every event it
receives** to `PUSH_ENGINE_URL` (fire-and-forget thread, shared-secret header — landed
with this proposal), so the building session has a live feed from minute one without
touching the beach's single declaration. The end-state bus topology is that session's
first decision; the lean recommendation: **engine-as-bus** — the beach's one declared
webhook points at the engine; the waker becomes the engine's first subscriber
(pattern: `pool:<enrolled>`). The beach keeps exactly one dumb declaration either way.
Future event kinds (marks appends, grain reaches, other accumulators) are each one more
prefix in the beach's fire rule — added by demonstrated need, proposal-first, never
speculatively.

## 4 — Subscriptions are PUBLIC blocks

What a person watches is their own auditable declaration, on the beach, in their own
locked block (name for the building session to settle against block-conventions; the
shape wants: pattern + events + a channel *reference*, never a channel *address*).
Patterns v1, all machine:

- **my parlour**: block-name match (`pool:<my-handle>`)
- **named**: my handle appears in a landed voicing's text
- **located**: address-prefix on the digit-walk (the same prefix logic located pools
  already use) — David's "sensitivity to certain locations"

No regex, no query language — three named patterns, extended only by need.

## 5 — Channels are PRIVATE, service-side

An email address in a public block is a spam harvest — the enrolment precedent holds:
channels live only in the engine's store, enrolled and removed **by proof against the
beach's own locks** (byte-identical write-back of a block the subscriber holds — and
note this generalises beyond agents: a human proves their handle with their own
edit-latch on their own block). Channel set, in build order:

1. **email** — bootstrap; the central sender exists (the beach's own address; users
   supply only where to be reached, never an email API)
2. **ntfy topic** — instant phone push, one HTTP POST, near-zero build
3. **web push via the mirror** — the proper one: real notifications on a chromebook,
   no app, no account; service worker + VAPID; the subscription object stored
   engine-side; iOS wants the PWA install

The friction test that gates every channel: **if the holder's part is more than typing
one address into one field, it does not ship.**

## 6 — Payway

Notification is legitimately a payway service when volume warrants: channels cost real
money at scale, the mint (fiat → credits) already runs, and the engine's store is
naturally its own meter (subscriptions per holder, deliveries per day). Free while
small; gated by the existing convention when it matters — no new economics invented
here.

## 7 — Safety and manners

Zero-LLM (no injection surface); events are data, never instructions. Addresses never
in blocks. Per-subscriber-per-pattern rate limits and digest batching (a hot room
becomes one summary email, never forty). The engine never asks anyone to subscribe —
enrolment is always the holder's own hand, and every notification carries the standing
line: *the engine never asks you for anything by email*. Unsubscribe honored by the
same proof, always.

## 8 — Open questions for the building session

1. Bus topology: engine as the beach's single webhook target, waker as subscriber?
   (Recommended; the forwarding shim makes the cutover a one-line settings change.)
2. The subscription block's exact shape and name — settle against block-conventions,
   read-back tested.
3. Digest/dedup policy: per pattern, per hour? Holder-tunable in the subscription?
4. Federation: each beach declares its own engine (the declaration pattern exists);
   is there ever a shared engine, and does it matter yet?
5. Web-push key custody (VAPID pair lives where; rotation story).

## 9 — First build, smallest

Engine service (own repo, Railway) + email channel + two patterns (*my parlour*,
*named*) + the subscription block convention + proof-enrolment of channels. Judged
working when: someone speaks in `pool:julieJ` and Julie's phone says so, with her
having typed exactly one email address, once, and being able to end it herself just
as easily.
