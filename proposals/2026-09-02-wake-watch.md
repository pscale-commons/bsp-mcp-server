# The wake watch — an agent's waking heard through the holder's own ear

**Date**: 2026-09-02
**Status**: proposed (built alongside; David's order in-session: "do the slim-down first, then the wake-watch unification")
**Demonstrated need**: David, at the mirror's you-card, 2026-09-02 — "I am slightly confused about the two different extensions — the 'your ear' and the notifications — are they different? … Can they be combined? Can we add the bell for agent notification to the top list?" `ways:push:5` gates new event kinds on exactly this: demonstrated need, proposal-first, never speculatively.

## The seam

Two services reach the same person about beach life, by two different laws:

- **The push engine** (`ways:push`): a voice lands in a pool → the beach fires one webhook → the engine matches the hearer's own public ear (`ear:<handle>`) and delivers on the channels enrolled by proof. What reaches you is a block in your hand; per-watch channel choice (field 3); manners fold a hot room into one line.
- **The waker** (`ways:doorbell`): a funded wake completes → the waker itself emails the enrolled `notify` address. No ear, no channel choice, no manners; a second sender holding a second copy of the person's email.

The seam shows in the mirror's you-card as two sections a holder cannot tell apart — and the answer to "can they be combined" is yes, because the division of labour was always one sentence: *agents get woken; humans get notified*. The waker's email is a **notification** wearing the wrong service.

## The design — one new event kind, no new machinery

**The waker announces; the engine delivers.** After a completed pulse (the same moment `notify_holder` fires today), the waker POSTs one service event to the engine's `/event`, on the wire both already share (`DOORBELL_SECRET` = `POOL_WEBHOOK_SECRET` = `ENGINE_SECRET`):

```json
{"origin": "<beach>", "kind": "wake", "agent": "<handle>", "ringer": "<who>", "status": "rest", "ts": "..."}
```

The emitter is the waker's existing `forward_event` machinery under its existing `PUSH_ENGINE_URL` env — the name's pre-cutover meaning (forward every beach event) died 2026-08-17 when engine-as-bus landed, and the dead call is removed in the same commit. Unset = no announcement.

**The ear grows a fourth… fifth kind** (`ways:push:1`, after parlour / named / located / room):

- `wake` — position shape `{_: sentence, 1: "wake", 2: <agent handle>, 3: channel kinds}`. Matches a `{kind:"wake"}` event whose `agent` equals field 2 (required — no wildcard; hearing an agent is an explicit act). Field 3 chooses channels exactly as everywhere.

**Engine handling**, all inside the existing shapes:

- Same secret gate, same origin pin, dedup on `(origin, "wake", agent, ts)`.
- **No fanout for service events**: the bus duty ("downstream sees exactly what the beach fired") covers beach-fired pool events only; an event carrying `kind` is service-emitted and is matched, never re-broadcast — the waker must not receive its own announcement back.
- A wake never notifies the agent's own handle (the author guard, unchanged in spirit).
- Delivery: title "`<agent>` woke", body "rung by `<ringer>` — `<status>`", link to the mirror; manners per the push window; "+N earlier" folds as everywhere.

## What this buys

The holder's whole hearing is **one list in one block**: the wake receipt becomes a bell row ("my agent waking reaches me") beside parlour and rooms, with per-watch channel choice (a wake can buzz the device while rooms stay email-only), manners, and the same end-the-watch act. The person's email lives at **one** service. The mirror's "agent wake receipt" section dissolves into the ear.

## Migration — each holder on one path, no doubles

The waker's own notify email **stays working** for enrolments that carry an address (Julie's, if set) and is offered to no one new — the mirror UI stops presenting it once the wake watch ships there. A holder is on exactly one path: `notify` set and no wake watch → the old email; wake watch set → the ear (and clearing `notify` is one `/enroll` POST). The waker's notify code retires in a later pass once the store carries no addresses.

## Rollout order

1. **Engine** (pscale-commons/push-engine): accept + match `kind:"wake"` — inert until anything fires it. Smoke covers match, channel choice, dedup, and no-fanout.
2. **Waker** (this repo, `genus-one/waker.py`): the announcement + the dead forward removed. Deploy from `genus-one/` (never the repo root), then set `PUSH_ENGINE_URL` on the service.
3. **Law**: `ways:push` branch 1 gains the wake kind, branch 5 the waker's voice on the wire — archive copy first (`archive:ways:push:2026-09-02`), per proposals/2026-08-05-law-writes-get-their-record.md.
4. **Mirror** (xstream-bsp): the "agent wake receipt" section deleted; the ear section offers the wake watch as a row when an agent is enrolled.
