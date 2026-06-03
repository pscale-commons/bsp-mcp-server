# Marks (and pool) shape — hidden-directory tag fields per sunstone:1.4.1

**Date**: 2026-05-17
**Status**: SUPERSEDED 2026-06-03 by [`proposals/2026-06-03-supernest-floor-growth-and-positional-ladder.md`](2026-06-03-supernest-floor-growth-and-positional-ladder.md). The hidden-directory mark shape worked around a metadata collision that exists **only** under fixed-floor digit-path growth (entries drift below the floor, so the decimal can't reach them and metadata is forced onto digit positions). The floor-growth supernest method keeps every entry at pscale 0, which makes the decimal usable for metadata and removes the collision's cause — so this shape change is no longer needed. Retained as historical record.
**Originally**: proposal, not implemented. Discussed during xstream marks-supernest fix; surfaces the underlying substrate-design question that the convention update in block-conventions:9 acknowledges but doesn't close.
**Companion to**: bsp-mcp-server PR #36 (block-conventions:9 append-only writes, key-deletion wipes), xstream-bsp PR #34 (findNextMarkSpindle change), sunstone:1.4.1 (PR #39 — hidden directories at digit positions only).

## TL;DR

The current mark shape puts tag fields at digit positions 1-4 of each slot:

```json
{
  "1": { "_": "mark text", "1": "agent_id", "2": "address", "3": "ts", "4": "face" }
}
```

This collides with the supernest expansion rule. Slot 11 should be the next mark after slot 9 (per block-conventions:9 and the supernest pattern), but slot 11 walks `block['1']['1']` — which is mark 1's **agent_id string**, not a sub-mark. The walker has to skip slots 11-14 (mark 1's tag fields), 21-24 (mark 2's), …, landing the 10th mark at slot 15. **Slot-number stops equalling sequence-number** once supernest expansion is needed.

The fix: move tag fields into the slot's underscore-as-hidden-directory per sunstone:1.4.1. Each mark becomes:

```json
{
  "1": { "_": { "_": "mark text", "1": "agent_id", "2": "address", "3": "ts", "4": "face" } }
}
```

Digit positions 1-9 of each slot are now free for **real** supernest sub-marks. Slot 11 cleanly walks `block['1']['1']` = the 10th mark. Slot number equals sequence number through the full supernest enumeration.

## Why this is worth a proposal, not a code change today

Three reasons it's bigger than it looks:

1. **Every reader needs updating.** xstream's `walkMarkTree`, `findNextMarkSpindle`, any third-party client, the `pscale://bsp-test` sentinel, the federated beach handler's shape walker (post PR #11), Claude in conversation reading marks via bsp-mcp. The wire format changes; everyone catches up.
2. **Every existing mark on every live beach has the old shape.** beach.happyseaurchin.com and beach.idiothuman.com both carry pre-change marks. Either a migration script runs once, or readers carry both shape recognisers indefinitely.
3. **Pool, presence, liquid, history, frame entities — all share the tag-field-at-digit-positions pattern.** The decision is whether this shape change applies just to marks (the only supernest-accumulator that bites today), or to all of them for consistency. Cascading reach.

## The new shape, concretely

### Mark slot — before

```json
{
  "_": "mark text",
  "1": "agent_id",
  "2": "address-tag (e.g. pool:foo)",
  "3": "2026-05-17T13:00:00Z",
  "4": "character"
}
```

`_` is the substantive content; digits 1-4 are tag fields. Mark detection at read time: typeof check on fields 1-4 (strings → leaf mark; objects → supernest descent).

### Mark slot — after

```json
{
  "_": {
    "_": "mark text",
    "1": "agent_id",
    "2": "address-tag",
    "3": "2026-05-17T13:00:00Z",
    "4": "character"
  }
}
```

`_` is a **hidden directory** (sunstone:1.4.1 — double-underscore pattern at a digit branch). The inner `_` carries the substantive text; tag fields live as siblings inside the hidden directory. Digit positions 1-9 of the slot are reserved exclusively for sub-marks.

Mark detection at read time: `typeof slot._ === 'object'` AND `slot._._` is a string → leaf mark. Cleaner than the typeof-string-vs-object disambiguation on multiple fields.

### Reading tag fields under the new shape

| read | before | after |
|---|---|---|
| mark 23's text | `bsp(block='marks', spindle='23')` returns object; reader reads `._` | `bsp(block='marks', spindle='23')` returns object; reader reads `._._` |
| mark 23's timestamp | spindle `'23.3'` walks `block[2][3][3]` | spindle `'23*'` enters hidden dir; pscale 0 reads dir's children; field 3 is the timestamp |
| mark 23's agent_id | spindle `'23.1'` | spindle `'23*'` then field 1, OR a convenience addressing via star + descent |

The exact spindle vocabulary for hidden-directory access depends on the canonical bsp() vocabulary (post PR #37). The star operator at the terminus enters the underscore-as-object; pscale_attention controls the depth selection inside. Specifics need to settle against whetstone branch 2's derivation table; this proposal flags the requirement without prescribing the exact addresses.

### Sub-mark addressing — the win

Slot 11 (the 10th mark) cleanly walks `block['1']['1']` = a mark object at that position. No tag-field collision. No skipping to slot 15. Slot-number = sequence-number through the full supernest:

- 1, 2, …, 9 — first 9 marks at depth 1
- 11, 12, …, 19 — marks 10-18 (under slot 1's sub-supernest)
- 21, 22, …, 29 — marks 19-27 (under slot 2)
- …
- 99 — mark 81
- 111, 112, … — marks 82+ at depth 3

The "no zeros" rule still applies (10, 20, … reserved for underscore-summaries). The full 819-slot capacity at 3 levels is now actually usable.

## What changes, where

### bsp-mcp-server

- `src/block-conventions.json` branches 9 (marks), 4.2 (pool) — schema update. Possibly 4.5 (liquid) and 4.6 (presence) for consistency.
- `src/sentinels.ts` `pscale://bsp-test` acceptance suite — add cases for hidden-directory mark shape, supernest expansion past slot 9, sub-mark addressing.
- Tool descriptions (`src/server.ts`, the BSP_TOOLS schema in xstream-bsp's claude-tools.ts) — the convention examples in the bsp tool description need updating to show the new shape.

### xstream-bsp

- `src/kernel/beach-kernel.ts` — `walkMarkTree` (leaf detection), `findNextMarkSpindle` (claim rule simplified — strings at depth 2+ are no longer tag-field collisions; ANY non-null is a claim because tag fields no longer live at digit positions), `readMarks` projection, `dropMark` writer.
- Similar pool functions: `walkPoolContributions`, pool slot allocation.
- Frame entities (`readFrame`) if frame entities follow the same shape change.
- The kernel's mark/pool/liquid writes need to compose the new shape.

### pscale-beach handler

- `api/pscale-beach.js`'s shape walker (post PR #11's canonical bsp() port) — already shape-aware; should handle the new shape natively because the wire just sees JSON, but the bsp-test acceptance suite needs to pass against the handler under the new shape.

### Live beaches

- Existing marks on beach.happyseaurchin.com, beach.idiothuman.com need migration — either:
  - **One-shot migration script**: walks the existing marks block, rewrites each slot from old to new shape. Run once per beach, ideally before the convention lands as canonical so the rollout is atomic.
  - **Dual-shape readers**: every reader carries both recognisers; old shape continues to be readable; new writes use new shape; old shape ages out over weeks via tide-wipes. Easier rollout, longer tail.

Recommendation: **one-shot migration**. Migration scripts can live in `pscale-beach/scripts/`. Run per-beach at the operator's chosen moment. Coordinated with a single bsp-mcp release that flips the convention.

## Trade-offs

### What we gain

- Slot-number = sequence-number invariant holds through the full supernest.
- "What's new since X" becomes a simple walk-from-slot-X+1, no timestamp arithmetic.
- The supernest's 819-slot capacity (3 levels) is actually usable, not effectively 9-then-blocked.
- Cleaner leaf detection (`slot._` is object with string `._` → mark) than the current multi-typeof check.
- Hidden-directory pattern aligns with sunstone:1.4.1, putting marks in the same authoring discipline as other digit-position uses.

### What we pay

- Every reader updates.
- Live data migration on existing beaches.
- Slightly more verbose to read a tag field on the wire (one extra walk step through the hidden directory).
- The `pscale://bsp-test` acceptance suite gains a battery of supernest-expansion tests.

### What's unaffected

- Presence (one-slot-per-agent, overwrite — no supernest expansion needed at all). Could migrate for consistency; not load-bearing.
- Liquid (one-slot-per-author-per-address, overwrite — same story).
- History (uses supernest but with explicit compression at slot 9 instead of supernest expansion — the discipline is "rewrite the underscore as +0 summary, clear digits 1-9, resume" per branch 3.2; doesn't need deep expansion).
- Frame entities — if they stay shallow (entity slots 1-8 with no sub-expansion), the shape change isn't required. Frame canon at position 9 is already a sub-block with its own structure.
- Sed: registrants — floor-2 supernest where each registrant is a sub-block; no tag fields at depth 1.
- Grain sides — fixed at sides 1 and 2; no supernest expansion.
- Passport / shell — designated position structure; no supernest expansion.

So the necessary scope is **marks + pool**. Everything else is optional consistency.

## Open questions

1. **One-shot migration or dual-shape readers?** One-shot is cleaner but requires coordinated cutover; dual-shape is gradual but every reader carries both recognisers indefinitely. Recommend one-shot; one operator, two live beaches, two short scripts — feasible to coordinate.

2. **Migration script scope.** Per-beach? Per-block? A `pscale-beach/scripts/migrate-marks-shape.js` that an operator runs against their beach with their passphrase — same shape as the deferred `wipe-by-tide.js` discussion. Lives in pscale-beach; not part of bsp-mcp.

3. **Pool migrates concurrently or separately?** Pool has the same shape collision but doesn't bite today (pools rarely exceed 9 contributions in current use). Concurrent migration is cheaper (one round of reader updates); separate migration is lower-risk (marks change first, pool follows after verification). Recommend concurrent.

4. **Convention catalog update at marks branch 9 AND pool branch 4.2 simultaneously, or staged?** The shapes are the same so the convention edits are symmetric. Stage as one PR for atomicity.

5. **bsp-test sentinel coverage.** The acceptance suite needs new cases: write 10+ marks, verify they land at 1-9 then 11+, not 1-9 then 15+. Read mark 11 via spindle, verify it's the 10th mark, not a tag field. Read mark text vs tag fields via the new addressing. Migration round-trip: rewrite an old-shape block to new, verify reads still work.

6. **Sub-mark commit semantics.** Currently a mark commit lands at slot N as a leaf; under the new shape it lands at slot N as a hidden-directory-bearing object. Writers compose the new shape on write; readers parse it on read. Backward-compat-during-transition is "reader recognises both shapes", which both option 1 and 2 above address differently.

7. **xstream's UI labelling.** Today marks show as `"<digit>: <text>"`. Under the new shape, that doesn't change — UI reads `slot._._` instead of `slot._`. Cosmetic; no rendering change visible to the user.

## Recommendation

Don't ship reactively. The shape change is sound and the win is real (slot-number = sequence-number through the full supernest), but the cascade of reader updates + migration scripts + live-beach coordination is large enough that I'd want:

1. Written acceptance from the substrate's curator (you).
2. A reference implementation in `tidy-up/` (the Python canonical reference) that the bsp-test sentinel can validate against — same discipline as sunstone 1.4.1's bsp2-supernest.py reference.
3. A one-shot migration script in `pscale-beach/scripts/` tested against a throwaway beach before being run on idiothuman / happyseaurchin.
4. A bsp-mcp + xstream-bsp release that flips the convention atomically.

Until those are in place, the standing imperfection at depth-2+ is documented (block-conventions:9.3 final paragraph) and the walker mitigates safely (strings at depth 2+ aren't claimed). Slot 15 holds the 10th mark; works correctly even if not what the supernest pattern would naturally suggest.

Sitting in `proposals/` until called for.
