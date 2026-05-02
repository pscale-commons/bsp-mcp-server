# Stage 6 — inbox replacement in `grain_reach`

**Author**: Weft (interactive, 2026-04-30)
**Status**: design proposal — awaiting David's call before any code lands
**Roadmap entry**: `docs/protocol-pscale-beach-v2.md` §10 stage 6, §4 implementation note
**Scope**: replace the `sand_inbox` insert in `src/tools/grain.ts` lines 106-124 with a beach-native partner-notification path. No new substrate primitive.

---

## The choice the protocol names

Protocol §4 names two replacement paths:

1. **Beach-mark path** — `grain_reach` writes a reach-mark to a beach the partner watches.
2. **In-block path** — `grain_reach` writes the reach as a position in the grain block itself; the partner discovers it by walking grain blocks where their agent_id appears at position 9.

Recommending **(2)** for v2, with **(1) deferred** to a v2.1 follow-up. Reasons below.

## Why path (2) first

- **No external dependency at write time.** The grain block already exists by the time we'd need to notify; writing reach metadata into it is a single bsp() write to the block we just created. Path (1) requires knowing which beach the partner watches, which is an out-of-band lookup that doesn't yet have a canonical surface (would need the partner's `shell` block at `shell:2` per `protocol-agent-shell.md` §6.8 — not all agents have one yet).
- **Discoverable via the partner's existing scan loop.** Partners already need to walk grain blocks they're a side of to read their grain network (this is what `pscale_network` does today). Adding a `_reach_pending` flag at the partner's side is a small extension of that walk, not a new surface.
- **Tide-clearing fits.** When the partner accepts (their `pscale_grain_reach` call lands), the reach metadata clears as a side-effect of the second write completing both sides. No separate cleanup.
- **Path (1) becomes additive when ready.** Once enough agents publish a `shell:2` watched-beach list, `grain_reach` can ALSO drop a beach-mark for partners who are paying attention to beaches more than to their own grain blocks. Both paths can coexist; (2) is the floor.

## Sketch of the diff

Lines 106-124 of `src/tools/grain.ts` currently:

```ts
// Notify the partner via inbox.
const client = getClient();
const { error: inboxError } = await client.from('sand_inbox').insert({
  from_agent: agent_id,
  to_agent: partner_agent_id,
  message: { type: messageType, pair_id: pid, ... },
  created_at: new Date().toISOString(),
});
const inboxNote = inboxError ? `...failed — ${inboxError.message}.` : '';
```

Replace with a write to the grain block at the partner's side:

```ts
// Notify the partner in-block: write a reach hint at their unwritten side.
// Cleared on their accept (which overwrites the side with their content).
if (messageType === 'grain_establish') {
  block[partnerSide] = {
    _reach_pending: {
      from: agent_id,
      pair_id: pid,
      grain_address_yours: `grain:${pid}:${partnerSide}`,
      grain_address_mine: `grain:${pid}:${mySide}`,
      description,
      reached_at: new Date().toISOString(),
    },
  };
  await saveBlock(owner, GRAIN_BLOCK_NAME, block, 'sedimentary');
}
```

Note: this re-saves the block with the reach hint included. The first `saveBlock` at line 103 wrote only the reaching side; the second adds the partner-side hint. Two writes is fine here — the cost is negligible and the staging is clearer than packing both into one block construction.

When the partner calls `grain_reach` (the accept), their handler reads the existing block, sees `block[mySide]` (their side from their POV) contains `_reach_pending` — they overwrite it with their actual `{ _: my_side_content }` content. The reach hint is gone. No cleanup needed.

## What needs care

1. **Schema invariant.** Currently the grain block's invariant is "sides 1 and 2 contain `{ _: content }` if written, or are absent." Adding `_reach_pending` violates this. Two sub-options:
   - (a) Tolerate: any handler walking the grain block treats `_reach_pending` keys as "this side hasn't accepted yet." Passport readers, sed: walks, etc. need to skip these.
   - (b) Distinct position: store reach hints at `block['8']` (a new metadata position) instead of `block[partnerSide]`. Cleaner but adds a second position to track.
   - **Recommend (b)** — keeps sides 1 and 2 invariants clean; one new metadata position is cheaper than fanning consideration of `_reach_pending` across every grain reader.

2. **`pscale_network` integration.** `pscale_network`'s "emerging" listing currently keys off `sand_inbox` rows where `to_agent = self` and no grain block exists yet. After Stage 6, "emerging" may need to also (or instead) read grain blocks where `block[mySide]` is absent and `block['8']._reach_pending` matches the agent. Two-line change in network.ts. Worth doing in the same commit so the user-visible "emerging" surface stays correct during the transition.

3. **Backward compatibility window.** Old agents still expect `sand_inbox` notifications. Three approaches:
   - (i) Dual-write — keep the `sand_inbox` insert AND add the in-block hint. Both surfaces work during the transition. Drop the insert in a future commit.
   - (ii) Hard cut — remove `sand_inbox` insert immediately, communicate the change.
   - (iii) Feature flag — env var `GRAIN_NOTIFY_PATH=inbox|inblock|both`, default `both`, deprecate `inbox` after a window.
   - **Recommend (i)** for the first commit (smallest risk), then (ii) once `pscale_network` and any other readers are updated.

4. **The accept-side writes also notify.** When agent B accepts (writes their side), agent A wants to know acceptance landed. The current implementation sends a `sand_inbox` `grain_accept` row. Same replacement applies — A discovers the acceptance the next time they walk their grain network and see B's side filled in. No additional notification path needed; the substrate IS the notification.

5. **Smoke test.** `scripts/smoke-end-to-end.ts` should add a grain establish + partner-discover-via-walk + accept sequence. Roundtrip without `sand_inbox`. ~15 lines additional.

## Estimate

If David approves the path:

- Code change: ~40 lines in `tools/grain.ts` (the block construction + the second saveBlock + comment).
- `tools/network.ts` update for emerging-listing: ~10 lines.
- `db.ts` may not need any change if Path (b) (use position 8) is taken — `_reach_pending` is just block content.
- Smoke test addition: ~20 lines.
- README + CLAUDE.md notes: ~30 lines (record the deprecation of `sand_inbox` write, point at this proposal).

Total ~100 lines net. One session.

## What I'm not doing

- Not implementing Path (1) (beach-mark notification). That depends on `shell:2` watched-beach lists being widely populated, which is a separate trajectory — happens after enough agents adopt v2 shell shape. Add as a v2.1 follow-up.
- Not removing `sand_inbox` from the schema. The table can sit unused until a separate commit deprecates it after the transition window.
- Not touching the `grain_response`/`general` message types in `sand_inbox`. Those are messaging, not grain-state. Their replacement is the broader "inbox elimination" work that protocol §4 names — a different scope.

## What I want from David

A nod to one of:
- (A) "Yes, do (2) with sub-option (b) and dual-write — ship the diff next session."
- (B) "Pick a different path / sub-option — here's why."
- (C) "Hold — this is being done elsewhere or my pscale-mcp rework subsumes it."

If (A), the next interactive Weft session writes the code. If (B), redirect. If (C), close this proposal and pick another roadmap item.

---

— Weft, 2026-04-30
