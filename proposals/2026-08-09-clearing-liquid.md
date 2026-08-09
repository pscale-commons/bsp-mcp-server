# Clearing liquid — the tidy function already exists; only the authority is missing

**Date**: 2026-08-09
**Status**: PROPOSAL — nothing moved.
**Want**, in the keeper's words: *"I want the author of any block the power to clear
liquid in VLS on the beach… It isn't huge. I think it is a simple tidy function."*

---

## 1. What is actually there today, verified

Three separate blocks per pool named `X`. None is compiled from anything.

| block | holds | created by |
|---|---|---|
| `pool:X` | the welcome at `_`, committed voices at slots 1..n | first write |
| `liquid:pool:X` | staged intentions, ONE SLOT PER AUTHOR | first stage |
| `convention:X` | the dials, optional | authored |

Verified live 2026-08-09: `liquid:pool:neuroinclusion` is a single block with slots
1, 2, 3 (happyseaurchin, JulieJ, one more). There is no per-handle liquid block for
any pool at the beach.

Two further facts, both checked in the handler and both load-bearing:

- **A liquid slot is never locked.** `new_lock` does not appear in `src/tools/pool.ts`
  at all, and nothing in xstream's staging path sets it. Supplying a passphrase proves
  authorship; it does not protect the slot.
- **`liquid:pool:X` itself is unlocked.** It is born from the beach's floor-seed on
  first stage, which sets no lock, and nothing sets one afterwards.

**Consequence: there is no holder.** Today *anyone* can already clear anyone's liquid,
keyed or not, pool owner or passer-by. The power the keeper is asking for is not
missing — it is universal, which is the actual defect.

## 2. The mechanism needs no new code

Clearing a buffer is `DELETE /.well-known/pscale-beach?block=liquid:pool:X` with
`{confirm: true}`. The block regenerates on the next stage, seeded afresh. DELETE
already authorises against the block's `_` lock: **set, the secret must match; unset,
the wipe proceeds.**

So the whole of the ask is one convention:

> **A pool's liquid buffer carries the same lock as the pool.**
> `liquid:pool:X` is locked with whatever secret holds `pool:X`.

With that, the existing DELETE *is* the tidy function, and it is restricted to the
pool's holder by machinery that already runs. Nothing is added to the wire.

**Who "the holder" then is**: whoever can write `pool:X`'s underscore — the person who
authored its welcome. That is already the only meaningful sense of owning a pool, and
it needs no new registry, no owner field, and no per-slot bookkeeping.

**Clearing is all-or-nothing, and the keeper has ruled that acceptable** — *"I don't
care if it clears locked."* This is the reason the proposal stays small: per-slot
clearing would need a position-delete the wire does not have (a write of empty content
blanks a slot's text but leaves its husk — the agent_id and timestamp survive), plus a
per-slot authority model. All-or-nothing needs neither.

## 3. Two thin affordances, because no client can do it today

The mechanism is beach-side and complete. What is missing is a way to ask for it.

- **xstream** talks to the beach directly (`bsp-client.ts` → the well-known endpoint),
  so it needs a control that issues the DELETE with the held secret. One button in the
  drawer, gated on the column holding a secret that satisfies the pool.
- **bsp-mcp cannot delete a block at all** — the `bsp()` surface has no destroy verb,
  by design. LLM clients therefore need `pscale_pool_engage` to carry a `clear` (a verb
  on the envelope that already owns the buffer: it is the tool that stages and
  withdraws, so it is the tool that empties). No seventh primitive; a parameter.

Both are small, and neither is required for the convention to be true — a holder with
curl can already do it the moment the lock is set.

## 4. What this does NOT do, deliberately

- **It does not protect a keyed voice from the holder.** Doing that needs a keyed stage
  to lock its own slot (pass `new_lock` alongside content — one call, not two), and then
  the holder is refused there by lock inheritance. Ruled out of scope by the keeper:
  *"I don't care if it clears locked."* Recorded here so the option is not re-derived.
- **It does not implement tide.** The `tide` block is fully authored at the beach
  (`anonymous_secs`, `handle_secs`, `signed_secs`, values at 1.1 / 2.1 / 3.1) and has
  **no implementation whatsoever** — the only sweep in the handler is
  `sweepStalePresence`, 60 seconds, presence heartbeats only. Time-based clearing is a
  separate and much larger piece of work, touching the pscale-beach package and every
  operator clone. Named here so the gap is on the record.
- **It does not address lock-key collision past nine keyed authors.** The lock key is
  the first digit of the walked path, so once a liquid buffer supernests, slots 1.1 and
  1.2 answer to the same key. Parked by the keeper.

## 5. A vocabulary correction this proposal exists to stop repeating

The architecture above was hard to hold because one word does two jobs, and the author
of this proposal caused it.

- **`V:<handle>` — a mirror.** A real, separate block per person at the self-same
  addresses on a spine. Used by `spine:state-of-play`, `spine:arrival`, molequle.
  **Never by pools.**
- **"the liquid mirror" — a view.** The rendered picture of everyone's staged lines in
  the engage envelope. Not storage, not blocks, not per-person.

Reading the second as the first produces a belief that a pool's liquid is compiled from
per-user blocks. It is not, and never was. `at=` compounds it: an address is *stamped
into a slot* (field 2) and used to filter reads — one pool, many addresses, still one
block.

This is `orientation:weft:6.2` arriving from the other direction: not a word invented
for a position, but a word REUSED for a second thing, so the reader infers an
architecture from the vocabulary. The test in 6.2 catches it — *say the sentence with
the address instead*. "The liquid mirror" has no address. `liquid:pool:X` does.

## 6. What this asks for

Adoption of one line:

> `liquid:pool:X` carries the same lock as `pool:X`.

Everything else follows from machinery that already exists. The two client affordances
can follow at leisure, or never — a holder with curl is unblocked the moment the lock
is set.
