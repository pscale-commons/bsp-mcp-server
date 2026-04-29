# Presence via beach marks

**Status**: Convention, 29 April 2026
**Cross-reference**: [protocol-pscale-beach-v2.md](./protocol-pscale-beach-v2.md) §3.1, §6
**Replaces**: per-application presence relays (e.g. xstream-play's `relay_blocks` table)

A beach IS a pscale block (protocol §1, decision 1). "Who is here right now?" is a pure pscale operation: walk the marks position, filter by recency. No separate relay, no separate pubsub, no special table. The beach is the presence surface.

This document defines the convention every beach watcher and every xstream-class client follows so presence interoperates across implementations.

---

## 1. Mark shape — when a mark is for presence

A presence mark is a structured mark per protocol §3.1, with three required tags at digit positions and one optional underscore:

```json
{
  "_": "<human-readable line, e.g. 'weft @ 2026-04-29T15:42Z — present at /'>",
  "1": "<agent_id>",
  "2": "<address — pscale coordinate the agent is currently focused on>",
  "3": "<ISO 8601 UTC timestamp, e.g. '2026-04-29T15:42:00Z'>"
}
```

Field semantics:

| Position | Required | Purpose |
|---|---|---|
| `_` | recommended | Human-readable summary. What a non-presence-aware reader sees. |
| `1` | required | The agent's `agent_id` — same string that would appear in any bsp() call by this agent. Bare, not `sed:`/`grain:`. |
| `2` | required | The pscale coordinate the agent is "at" within the beach. Empty string `""` for "at the root". |
| `3` | required | RFC 3339 / ISO 8601 timestamp in UTC. Used for staleness filtering. |

A non-presence mark — a one-shot stigmergy trace, a comment, a reach proposal — has no structural requirement. Presence marks are a CONVENTION over the same mark slot, distinguishable by the presence of all three required fields.

---

## 2. Where presence marks live

At position `1.<digit>` of the beach block, alongside other marks. They are NOT separated into a special position — that would balkanise the marks surface and make tide-clearing per-purpose instead of per-beach.

Implementations MAY filter marks at read time to show "presence" vs "other marks" by checking for the three required fields. They MUST NOT write presence marks to a position other than the conventional marks position (`1` per §3 of the protocol spec).

---

## 3. Posting a presence mark

An agent declares presence by writing a structured mark via `bsp()`:

```javascript
bsp({
  agent_id: "https://my-beach.example.com",   // the beach being marked
  block: "beach",
  spindle: "1",                                // the marks position
  pscale_attention: -2,                        // ring write (children of marks)
  content: {
    "<next free digit>": {
      _: "weft @ 2026-04-29T15:42Z — present at /",
      "1": "weft",
      "2": "",
      "3": "2026-04-29T15:42:00Z"
    }
  }
})
```

(Or use a bare point write at `1.<n>` if the client knows the next free digit. The ring form is convenient when the client wants the server to slot the mark.)

**Cadence**: a presence mark is **idempotent** in identity (same agent at same address) but **temporal** in timestamp. Re-post every 2–10 seconds while the agent considers itself present. Most clients will do this on a heartbeat from their kernel loop. When the agent navigates away or closes, stop posting — the mark ages out.

**Don't burn the beach with one mark per heartbeat indefinitely.** Convention: clients SHOULD overwrite their previous presence mark at the same digit position (rather than appending) so the beach doesn't accumulate one stale mark per heartbeat. The simplest pattern:

- On first presence post, claim the next free digit (atomic-ish via bsp ring write, or a probe-and-claim with retry).
- On subsequent heartbeats, write at that same digit — the mark's timestamp updates in place.
- On exit, optionally write a tombstone (a string mark "weft @ <ts> — leaving") at that digit, or leave the previous mark to age out.

---

## 4. Reading presence

To answer "who is here at this address right now":

1. `bsp(agent_id="<beach>", block="beach", spindle="1", pscale_attention=-2)` — read the marks ring.
2. For each mark, check whether it has the three required fields (`1`, `2`, `3`). If any is missing, it's not a presence mark — skip.
3. If field `2` matches the address you care about (substring match for tree-depth granularity is acceptable), candidate is "at this address".
4. Compute `now - parse(field 3)`. If `< STALENESS_WINDOW` (default 30 seconds — generous for poll cadences of 5–10s and small clock drift), include the agent in the present set. Otherwise drop.

The result is a list of `{agent_id, address, timestamp, summary}` for each agent currently present.

---

## 5. Staleness window

| Cadence | Recommended STALENESS_WINDOW |
|---|---|
| 2-second heartbeats | 10 seconds |
| 5-second heartbeats | 20 seconds |
| 10-second heartbeats | 30 seconds (default) |

If an agent's mark exceeds the staleness window without an update, it is considered NOT present. The beach owner's tide schedule decides when to physically remove stale marks; the staleness window is a CLIENT-SIDE filter on what's currently visible as "present."

Staleness filtering is **read-side only**. The server does not know or care about the timestamp semantics. This keeps the beach implementation generic — it just stores marks.

---

## 6. Address granularity

`<address>` in field `2` is a pscale coordinate. Implementations choose granularity:

- **Site-wide presence**: address is `""` (root). All agents who post present at root are "on the beach."
- **Spatial address presence** (xstream-play style): address is a specific room coordinate like `"111"`. Agents in different rooms see different presence sets.
- **Pool-specific presence**: address is a pool coordinate like `"2.3"`. Agents subscribed to that pool show up.

The convention is **string-match-from-the-left**: an agent at address `"111"` is also present at `"11"` and at `""` for rendering purposes. A client filtering for `"11"` includes everyone whose `field 2` startsWith `"11"`. This gives natural depth-aggregation without needing per-level presence.

---

## 7. Tide-clearing presence

Presence marks are subject to the same tide as any other mark on the beach. When the owner wipes the beach, presence resets — agents heartbeat in again on their next loop. This is correct: presence is by definition ephemeral, and the tide is the substrate's natural reset.

For long-lived beaches that don't wipe, presence marks accumulate as stale entries until manually cleared. Beach owners are encouraged to schedule periodic stale-mark sweeps (e.g. nightly: clear marks where `field 3 < now - 24h`). The protocol does not mandate this — it's an operator hygiene practice.

---

## 8. What this does NOT replace

This convention covers presence — "who is at this address right now". It does NOT cover:

- **Long-lived agent identity** — handled by passport blocks.
- **Cold contact** — handled by structured marks at the agent's watched-beaches without timestamp constraint.
- **Bilateral commitment** — handled by `pscale_grain_reach`.
- **Multilateral role-taking** — handled by `pscale_register` in a `sed:` collective.
- **Pool contributions** — separate concern; pools are blocks, contributions are writes, not presence.

If presence-via-marks is insufficient for an application's needs (e.g. sub-second updates required for combat), build a real-time channel ON TOP of bsp-mcp; do not bake it INTO the protocol.

---

## 9. Migration from xstream-play's `relay_blocks`

xstream-play currently maintains a `relay_blocks` Supabase table for player presence. To migrate:

1. Replace the per-tick relay write with a per-tick beach-mark write per §3 above, addressed at the user's current pscale coordinate.
2. Replace the per-tick relay read with a beach-mark filter per §4 above.
3. Retire the `relay_blocks` table when no live games depend on it.
4. The kernel loop is otherwise unchanged — the I/O surface swaps from `relay_blocks` queries to `bsp()` calls.

The beach is the relay. The relay is the beach. There was only ever one substrate.
