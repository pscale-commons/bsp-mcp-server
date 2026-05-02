# BSP walker audit — `src/bsp.ts` vs `bsp2-star.py`

**Date**: 2026-05-01
**Author**: auto-Weft (cycle 106)
**References**:
- Canonical Python: `/Volumes/CORSAIR/pscale/starstone/bsp2-star.py` (mtime 2026-04-07, 396 lines)
- Work-copy Python: `~/Projects/hermitcrab-mobius-work/tidy-up/bsp2-star.py` — `diff` against CORSAIR returned empty; identical
- TypeScript port: `~/Projects/bsp-mcp-server/src/bsp.ts` (mtime 2026-04-28, 445 lines)

CLAUDE.md says "DO NOT MODIFY without going to the Python first." This audit is the careful read that precedes any change.

## Summary

The TS port is **faithful in core walker semantics**. Every walker function — `collectUnderscore`, `findHiddenLevel`, `getHiddenDirectory`, `floorDepth`, `parseAddress`, `walk`, `bsp` (with all six modes) — matches the Python line-by-line in logic. There are **two cosmetic divergences in display formatting**, **one fragility from `typeof` semantics**, and **four TS-only additions** that exist because the TS file is consumed as a library while the Python file is a CLI script.

No functional walker divergence. Display behavior differs slightly. One latent Python crash in `fmt_dir` is silently fixed by TS.

## Walker function comparison

| Function | Python lines | TS lines | Status |
| --- | --- | --- | --- |
| `collect_underscore` / `collectUnderscore` | 41–56 | 29–38 | match |
| `find_hidden_level` / `findHiddenLevel` | 59–77 | 45–61 | match |
| `has_hidden_directory` / `hasHiddenDirectory` | 80–82 | 64–66 | match |
| `get_hidden_directory` / `getHiddenDirectory` | 85–96 | 73–81 | match |
| `floor_depth` / `floorDepth` | 99–110 | 90–99 | match |
| `parse_address` / `parseAddress` | 113–126 | 108–118 | match |
| `walk` | 129–167 | 138–174 | match |
| `bsp` dispatcher | 170–267 | 209–326 | match in all six modes |

All six BSP modes verified equivalent: dir (default), disc, star (`*`), ring, dir (subtree), point, spindle (default).

## Divergences

### D1. `fmt_dir` root-display when root is chained underscore

- **Severity**: cosmetic
- **Python** (`bsp2-star.py:285–310`): if `tree['_']` is a dict, calls `show_underscore(root)` which recurses and emits `(floor chain) → <inner-text>`.
- **TS** (`bsp.ts:358–377`): if `tree._` is an object, calls `collectUnderscore(tree)` which returns the deepest-string of the chain directly, without the `(floor chain) → ` marker.

**Effect**: for a floor-2+ block, Python output shows `_: (floor chain) → <semantic>` while TS shows `_: <semantic>`. TS hides the chain marker; Python surfaces it. Same information; different presentation.

**Proposed reconciliation**: keep TS behavior. The `(floor chain) → ` prefix is structural noise once the chain has resolved to a string; the semantic is what the reader wants. If a structural marker is wanted, expose it as a separate flag rather than as a display default. No code change required to land this; document the intentional divergence in `src/bsp.ts:358` JSDoc.

### D2. `fmt_dir` child-display robustness

- **Severity**: functional (TS more correct)
- **Python** (`bsp2-star.py:307–309`):
  ```python
  for k in sorted(k for k in tree if k != '_'):
      v = tree[k]
      text = v if isinstance(v, str) else (v.get('_', '(branch)') if isinstance(v, dict) else str(v))
      lines.append(f"  {k}: {text[:120]}{'...' if len(text) > 120 else ''}")
  ```
  When `v` is a dict and `v['_']` is itself a dict (chained underscore at the child), `text` becomes a dict; the subsequent `text[:120]` raises `TypeError`. Latent crash.
- **TS** (`bsp.ts:369–375`):
  ```typescript
  const text = typeof v === 'string'
    ? v
    : (typeof v === 'object' && v !== null ? (collectUnderscore(v) || '(branch)') : String(v));
  ```
  `collectUnderscore(v)` follows the chain to the string. No crash.

**Effect**: Python crashes when rendering a `dir` view of a block whose digit-children carry chained underscore content. TS renders the bottom-of-chain semantic. The bug is in Python and the TS port silently corrected it.

**Proposed reconciliation**: file an upstream fix to `bsp2-star.py:308` swapping the immediate `.get('_', ...)` for a `collect_underscore` call. The TS code already encodes the right behavior; Python should match.

### D3. `typeof === 'object'` admits arrays and null-cases that `isinstance(dict)` excludes

- **Severity**: latent fragility (no current trigger)
- **Locations**:
  - `bsp.ts:48` (`findHiddenLevel`), `bsp.ts:54`, `bsp.ts:153` (`walk`), `bsp.ts:165`, `bsp.ts:233`/`242` (`bsp` disc), `bsp.ts:285`/`290` (ring), `bsp.ts:273` (star), `bsp.ts:298` (ring sibling), `bsp.ts:373` (`fmtDir`)
- **Behaviour gap**: in JavaScript, `typeof null === 'object'` and `typeof [] === 'object'`. Python's `isinstance(X, dict)` rejects both. Most TS sites guard with `X && typeof X === 'object'` (handling null) but none guard against arrays.
- **Current risk**: zero. BSP blocks are JSON objects; arrays do not appear at any structural position. If a future caller passes an array (e.g. through a corrupted block or a typed wrapper that flattens to array), TS would attempt to access string keys on it and silently produce wrong output instead of erroring cleanly.

**Proposed reconciliation**: add an `isPlainObject` helper at the top of `bsp.ts` (`(v): boolean => v !== null && typeof v === 'object' && !Array.isArray(v)`) and use it in place of every `typeof X === 'object'` check. ~10 substitutions. Not urgent; defensive.

## TS-only additions (not divergences)

These exist in `bsp.ts` with no Python equivalent and serve the bsp-mcp-server library boundary rather than CLI use:

| TS export | Lines | Purpose |
| --- | --- | --- |
| `fmtStar` | 380–395 | Star-result formatter. Python inlines this in `main()` (lines 362–372). |
| `fmtResult` | 398–407 | Convenience dispatcher over the five mode-specific formatters. |
| `writeAt` | 412–434 | Block-mutation helper: writes value at a parsed address, creating intermediate nodes. Used by tools that mutate blocks. |
| `parseStar` | 437–444 | Parses `"blockname:address"` into `[blockname, address]` for cross-block star references. |

`writeAt` and `parseStar` are mutation/parsing utilities the Python file does not need (CLI mode is read-only). They are extensions, not deviations. The risk: if the Python reference grows analogous functionality, a future port-pass should compare semantics rather than re-implement from scratch — the TS shape may have drifted from where Python lands.

## Python has a CLI; TS does not

`bsp2-star.py:313–392` (`main`) parses argv and dispatches; `bsp.ts` has no entry point because it is imported by tools in `src/tools/`. Not a divergence — different operating model. The TS formatters are exported so any caller can reproduce the Python CLI output if needed.

## Recommendations, in priority order

1. **D2 (Python latent crash in `fmt_dir`)** — file a one-line fix to `bsp2-star.py:308` upstream. Does not require touching TS. Brings Python in line with the corrected behavior already in TS.
2. **D3 (typeof fragility)** — add `isPlainObject` helper to `bsp.ts` and substitute. Defensive, ~10 lines net change. Worth doing before any caller passes arrays.
3. **D1 (display marker)** — document as intentional divergence in `bsp.ts:358` JSDoc. No code change. If a reader wants the structural marker, expose as a flag rather than as default.
4. **Audit cadence** — re-run this audit when either file changes substantively. The walker semantics are stable; the formatters and additions are where drift accumulates.

## What was not audited

- The five substrate-stateful primitives (`tools/passport.ts`, `tools/inbox.ts`, `tools/grain.ts`, `tools/network.ts`, `tools/beach.ts`) — out of scope; this audit is `src/bsp.ts` only.
- The starstone teaching block (`src/sunstone.json`) and operational reference (`src/whetstone.json`) — out of scope; this audit is the walker code only.
- Performance characteristics — both implementations are O(depth) per walk; no benchmark needed for this audit.
- Test coverage — `bsp.ts` test file existence not checked; if absent, write the tests against the divergences D1/D2/D3 once the Python upstream fix lands.
