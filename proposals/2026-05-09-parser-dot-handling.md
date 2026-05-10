# Parser dot-handling — `"9.12"` (canonical one-dot form) silently fails on writes

**Date**: 2026-05-09
**Discovered by**: David (happyseaurchin) during idiothuman.com beach setup
**Followup to**: [`2026-05-01-bsp-walker-audit.md`](./2026-05-01-bsp-walker-audit.md), which concluded "no functional walker divergence"
**Status**: **RESOLVED 2026-05-09** in the bespoke session that produced [`proposals/2026-05-09-floor-anchor-and-multi-dot.md`](./2026-05-09-floor-anchor-and-multi-dot.md). The fix landed in commits `e707702` (floor-aware parser, strict reject on multi-dot) and `b411395` (`bsp2-star.py` updated in lockstep with the TS port). Multi-dot input now throws `InvalidAddressError` (HTTP 400 `invalid_address` from the wire) at both bsp-mcp's `parseSpindle` and the federated beach handler. No tolerant fallback. The 102-test parser smoke (`npm run smoke:parser`) covers parseAddress, parseSpindle, formatAddress, round-trip, floor-growth, multi-dot reject, and end-to-end via bspRead/writeAt/readAt. This doc retained as the diagnostic record from the discovery moment.

## TL;DR

Three functions in `src/bsp.ts` mishandle dotted addresses. The bug surfaces specifically on writes through `bsp-mcp`'s federated path — `bsp(spindle="9.12", content=…)` silently no-ops, with bsp-mcp returning a success ack the operator cannot distinguish from a real write.

The 2026-05-01 audit concluded the TS port is faithful to `bsp2-star.py`. That's correct for line-by-line code comparison but missed:
- A JS-vs-Python `String.prototype.replace` vs `str.replace` semantics gap
- Two TS-only utilities (`readAt`, `writeAt`) that have no Python reference and parse dotted addresses differently from the rest of the system

## Reproduction

Against any federated beach with bsp-mcp configured:

```
# Setup: a block "spore" with content at position 9.1.2 = "OLD_STRING"
# (e.g., the unfixed spore library block from before today's seed-fix commit)

# Attempt to overwrite at the canonical one-dot address form
bsp(
  agent_id="https://your-beach.example.com",
  block="spore",
  spindle="9.12",
  pscale_attention=-5,
  content={"_": "NEW"}
)
# Returns: [wrote subtree @ "9.12" pscale -5]   ← looks like success

# Read back at the same address
bsp(
  agent_id="https://your-beach.example.com",
  block="spore",
  spindle="9.12"
)
# Returns: [point @ pscale -3]
#   OLD_STRING    ← the write never landed
```

The same call with `spindle="912"` (dot-free) succeeds. The same call with `spindle="9.1.2"` (two dots, violating sunstone:1.5) corrupts the local block by creating a `"."` sibling key.

## Affected functions

All in `src/bsp.ts`:

### 1. `parseAddress` (line 108-118)

```ts
export function parseAddress(number: number | string): string[] {
  if (typeof number === 'number') { /* number path — fine */ }
  const s = String(number).replace('.', '');   // ← strips ONLY the first dot
  return [...s];
}
```

JS `String.prototype.replace(pattern, replacement)` with a string `pattern` replaces only the **first** occurrence. Python's `str.replace(old, new)` replaces **all** occurrences by default. The Python source uses `address.replace('.', '')` which strips every dot; the TS port copied the same code shape but landed JS semantics.

For `"9.1.2"`, the JS form returns `["9", "1", ".", "2"]` (with a stray dot). Currently no caller passes multi-dot addresses, so this hasn't bitten — but it's a latent corruption vector. Per sunstone:1.5 the convention is at-most-one-dot, so multi-dot inputs should ideally be rejected, not silently mangled.

### 2. `readAt` (line 422-435)

```ts
export function readAt(block: Block, address: string | null | undefined): any {
  if (address == null || address === '' || address === '_') return block._;
  const parts = String(address).includes('.')
    ? String(address).split('.').filter(Boolean)
    : [...String(address)];
  // ... walk node[part] for each part ...
}
```

`String("9.12").split('.')` returns `["9", "12"]`. The walk then accesses `block["9"]["12"]` — a multi-character key that violates the spine rule (only `_` and digits 1-9 are valid spine keys). For most real blocks, `block[9][12]` is undefined, and `readAt` returns `undefined`.

This is the load-bearing bug. `readAt` is called by `db.ts:saveBlockToBeach` to construct the POST body content:

```ts
// src/db.ts ~line 314
body.content = readAt(block, cleanedSpindle);
```

When `readAt` returns `undefined`, `JSON.stringify({content: undefined, ...})` drops the field. The POST goes to the beach without any `content`. The handler's `handleStandardWrite` sees `content === undefined`, takes no action, returns `{ok: true}`. bsp-mcp reports the local `bspWrite` result (which DID mutate the in-memory block correctly) as a success ack. The beach is never touched.

### 3. `writeAt` (line 446-472)

```ts
export function writeAt(block: Block, address: string, value: any): Block {
  // ...
  const parts = String(address).includes('.')
    ? String(address).split('.')
    : [...String(address)];
  // ... walk parts.slice(0, -1), set parents[finalKey] = value ...
}
```

Same `split('.')` bug as `readAt`. For `writeAt(block, "9.12", value)`, this creates `block["9"]["12"]` (multi-character key) instead of writing at `block["9"]["1"]["2"]`. The local block ends up with a `"12"` ghost key as a sibling of `"1"`.

This currently doesn't persist (because `bsp-mcp` re-loads from beach on next op, overwriting local) but it does corrupt in-memory state during a single tool turn.

Note from the 2026-05-01 audit: `writeAt` is explicitly listed as a TS-only addition with no Python equivalent. `readAt` isn't in the audit's match-table either; it's likely also TS-only. Neither was compared against `bsp2-star.py`, so both are TS-original code.

## Root cause summary

Two distinct bugs:

1. **Cross-language `replace` semantics**: JS string-arg `replace` strips only the first match; Python's strips all. The TS port copied the line shape but inherited JS semantics. Affects `parseAddress`.

2. **`split('.')` interpretation**: pscale's dot is a readability marker for the floor boundary, NEVER a separator between multi-character tokens. Spine keys are always single digits 1-9. The `split('.')` branch in `readAt`/`writeAt` violates this rule, creating ghost multi-character keys.

Both bugs collide on the canonical address form `"9.12"` (sunstone:1.5: "at most ONE decimal point"). The result: writes silently fail with a positive ack, leaving the operator unable to distinguish success from no-op.

## Why this slipped past the 2026-05-01 audit

That audit compared TS code against Python line-by-line and concluded "match" for `parseAddress`. The line shapes ARE identical:

```python
s = number.replace('.', '')
```
```ts
const s = String(number).replace('.', '');
```

What the audit missed is that `replace('.', '')` *means different things in the two languages*. The audit's match-table cells should distinguish "code-shape match" from "behavior match." Future audits should verify behavioral equivalence on representative inputs, not just line-shape equivalence.

The audit also didn't list `readAt` in either the match-table or the TS-only additions table, leaving its parse logic unaudited. `writeAt` was listed as TS-only with the note "Used by tools that mutate blocks" but its parse logic wasn't compared against any Python form.

## Proposed fix (tested locally, NOT applied)

Match the beach handler's parse pattern (`api/pscale-beach.js` uses `replace(/\./g, '')` then char-iterates — verified correct).

```ts
// 1. parseAddress line 116
const s = String(number).replace(/\./g, '');

// 2. readAt — replace the .includes('.') ? split('.') : [...] branch with:
const digits = String(address).replace(/\./g, '');
for (const part of digits) { /* walk node[key] */ }

// 3. writeAt — same change as readAt
```

Local verification (22/22 unit smokes pass; synthetic round-trip):

```
parseAddress:
  "9.1.2" → ["9","1","2"]
  "9.12"  → ["9","1","2"]
  "912"   → ["9","1","2"]
  "9.1"   → ["9","1"]
  "11"    → ["1","1"]
  "111"   → ["1","1","1"]

writeAt + readAt agree across all dot forms — write at any form is readable at any form.
```

## Workaround until the fix lands

Use **dot-free** addresses. The dot-free path (`String(address).includes('.')` is false) skips both broken branches and works correctly.

For the immediate spore-divergence repair David's other Claude Code session needs:

```
bsp(
  agent_id="https://beach.idiothuman.com",
  block="spore",
  spindle="912",                          # ← dot-free; works through the unbroken code path
  pscale_attention=-5,
  content={
    "_": "Arguments. Pass as a pscale sub-block — each digit is one positional or named arg per the tool's schema in section 8. Never stringified JSON; the spine accepts only digit keys 1-9 and the underscore."
  }
)
```

`"912"` is digit-equivalent to `"9.12"` per pscale convention (the dot is a readability marker only); both walk to `block[9][1][2]`. Until the parser is fixed, the dot-free form is the safe path.

## Why a partial fix is risky to land now

David's history: the bsp parser has been a source of subtle bugs across multiple sessions — floor depth, padding, zero handling, trailing zeros. Each one took hours to track down. A partial fix that "works for the surfaced case" but leaves edge cases inconsistent creates exactly the kind of latent issue that resurfaces months later as "we fixed that, why is it broken again?"

The right fix needs:
- `bsp2-star.py` open for line-by-line behavior comparison (not just code-shape)
- A test pass that includes floor padding, trailing zeros, supernest addresses, multi-dot inputs, star addresses
- Federated round-trip verification (bsp-mcp → handler → KV → handler → bsp-mcp)
- Coordination with the upstream Python source so the bug isn't reintroduced on the next port pass

A bespoke session can do this carefully. A side-fix during a beach-setup session cannot.

## Proper workflow for the bespoke session

1. **Open the Python reference**: `/Volumes/CORSAIR/pscale/starstone/bsp2-star.py` (per the 2026-05-01 audit; mtime 2026-04-07, 396 lines). Or the work-copy at `~/Projects/hermitcrab-mobius-work/tidy-up/bsp2-star.py` if the audit's `diff` against CORSAIR is still empty.

2. **Verify Python's `parse_address` behavior** on inputs `"9.1.2"`, `"9.12"`, `"912"`. Python's `str.replace('.', '')` strips all dots, so all three should produce `['9', '1', '2']`. If confirmed, the JS port is the unfaithful side; patching JS is the port-correctness fix.

3. **Confirm Python has no `read_at` / `write_at`** — per the 2026-05-01 audit's TS-only-additions list. If true, the JS-only `readAt`/`writeAt` implementations need a fresh design grounded in pscale's spine rule (single-digit keys, dot is readability only).

4. **Apply the JS fix**. The pattern verified locally during this discovery session is:
   - `parseAddress`: `replace('.', '')` → `replace(/\./g, '')`
   - `readAt`/`writeAt`: drop the `split('.')` branch entirely; always `replace(/\./g, '')` then char-iterate.

5. **Run the full smoke suite**: `npm run smoke:unit`, `npm run smoke:sentinel`, `npm run smoke:wellknown`, `npm run smoke:federated`. Add a new smoke specifically for dotted-address round-trips if absent.

6. **Live federated round-trip**: write to a sandbox beach via bsp-mcp at addresses `"9"`, `"9.1"`, `"9.12"`, `"912"`, `"99"`, `"111"`. For each, read back and verify the content matches.

7. **Update the 2026-05-01 audit doc**: add a note that `parseAddress` parity was verified by line shape but not by behavior; flag the cross-language `replace` semantics gap as a class of issue future audits should test for.

## Testing requirements

Cases the bespoke session should cover before landing:

| Address | Expected digits | Walker target |
|---|---|---|
| `"9"` | `["9"]` | `block[9]` |
| `"9.0"` | `["9","0"]` after parse, then trailing-zero strip → `["9"]` | `block[9]` |
| `"9.1"` | `["9","1"]` | `block[9][1]` |
| `"9.12"` | `["9","1","2"]` | `block[9][1][2]` |
| `"9.1.2"` | `["9","1","2"]` (multi-dot tolerance) OR rejected (sunstone:1.5 enforcement) | `block[9][1][2]` if accepted |
| `"912"` | `["9","1","2"]` | `block[9][1][2]` |
| `"100"` | `["1","0","0"]` after parse, trailing-zero strip → `["1"]` | `block[1]` |
| `"0.1"` | `["0","1"]` | `block._[1]` (after `0` → `_` mapping) |
| `"0.100"` | `["0","1","0","0"]` after parse, trailing-zero strip → `["0","1"]` | `block._[1]` |
| `"11"` | `["1","1"]` | `block[1][1]` |
| `"111"` | `["1","1","1"]` | `block[1][1][1]` |
| `"99"` | `["9","9"]` | `block[9][9]` |
| `"9*"` | digits `["9"]` + star marker | hidden directory at `block[9]` |
| `"9.1*"` | digits `["9","1"]` + star marker | hidden directory at `block[9][1]` |

Floor-padding cases (parseSpindle, not parseAddress, but adjacent — verify untouched):

| Floor | Address | Expected digit array after pad+strip |
|---|---|---|
| 1 | `"9"` | `["9"]` |
| 2 | `"9"` | `["0","9"]` (pad-left to floor width) |
| 2 | `"19"` | `["1","9"]` |
| 2 | `"190"` | `["1","9","0"]` after parse → strip trailing zeros → `["1","9"]`? Verify against Python. |

The interaction of parseAddress + floor padding + trailing-zero strip is precisely where David has been bitten before. Verify against the Python reference; do not assume.

## Sunstone:1.5 enforcement — open question

Sunstone:1.5: "Address notation carries at most ONE decimal point."

After the parser fix, multi-dot inputs (`"9.1.2"`) will parse correctly to `["9","1","2"]`. Should the parser also *enforce* sunstone:1.5 by rejecting multi-dot inputs?

- **Permissive**: parse correctly, accept whatever the writer gives. Keeps the parser tolerant.
- **Strict**: reject multi-dot inputs as malformed. Surfaces the convention to writers; LLMs that habitually use multi-dot get a clear error.

David's note: "CC ALWAYS uses multiple decimal points." That pattern persists because the parser silently accepts (and currently mishandles) multi-dot inputs. A strict parser would force LLMs to learn the one-dot convention.

Lean: **strict at write time, permissive at read time**. Reject multi-dot writes with a clear error; tolerate multi-dot reads (they parse correctly under the proposed fix). This pushes correct convention without making reads brittle.

This is a design decision for the bespoke session, not a parsing detail.

## Provenance

- 2026-05-09: David runs Option A (Claude Code shortcut) against beach.idiothuman.com. Init seeds the beach. spore.json carries an upstream shape-gate violation at 9.1.2 (now fixed in pscale-beach commit `4a71387`).
- 2026-05-09: Rogue Claude Code session attempts to align the deployed spore block with the upstream-fixed canonical via `bsp(spindle="9.12", ...)`. Write returns `[wrote subtree @ "9.12" pscale -5]` ack, but readback returns the OLD content.
- 2026-05-09: This session diagnoses — parser bug in `bsp-mcp/src/bsp.ts`. Local fix tested (22/22 smokes pass; round-trip agreement verified). Decision to revert and document rather than land partial.

## What this doc is for

A future bespoke session — opened deliberately for parser correctness — should be able to start cold from this file:

1. Read this doc top to bottom
2. Open `bsp2-star.py` and verify Python behavior on the test cases above
3. Apply the proposed fix as a port-correctness change
4. Run the test suite extended with the cases in the testing requirements section
5. Push the fix, update the 2026-05-01 audit, update CLAUDE.md if the parser semantics change subtly enough to warrant
6. Optionally: implement strict-at-write enforcement of sunstone:1.5 if that design call lands positively

Until then: the workaround in the "Workaround until the fix lands" section is what operators should use. Multi-dot addresses are unsafe; one-dot addresses are unsafe on writes through bsp-mcp; dot-free addresses are safe.
