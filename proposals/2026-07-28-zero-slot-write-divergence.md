# The zero-slot summary write — a missing guard at the beach, not a question about the canon

**Date**: 2026-07-28
**Status**: RESOLVED at the handler ([pscale-beach#48](https://github.com/pscale-commons/pscale-beach/pull/48)). The convention was right the whole time.
**Occasioned by**: an audit of every `history:` and `stash:` block at beach.happyseaurchin.com, after "new notes at the next free digit" was found voiced as law in `stash:happyseaurchin`.

> **Correction, same day.** The first version of this document asked which of two implementations was canonical, and put that choice to the maintainer. The framing was the error: the canon had already decided, and bsp-mcp had already implemented it. What existed was a one-sided drift at the beach handler. The record below is rewritten to say so. The original question — "which door is canon on the trailing-zero strip" — should never have been asked; it came from stopping one function short in the trace.

## What the convention says

`block-conventions:3.4`, on the counting block shared by history, stash, marks, and pools:

> Zero-carrying numbers are NEVER entries: a zero in an address walks a voicing (N0 reads container N's underscore) or a hidden directory — reserved territory.

and `3.5`, on where a summary lives:

> the summary is the container's voicing … stored as the underscore subnested in digit 3 (trailing-zero canonicalisation makes N0 read exactly there).

`N0` names the container's **voicing**. That is the law, and it is unambiguous.

## What bsp-mcp does — the rule, already there

`applyWrite`, the tool's point-write path ([`src/bsp-fn.ts:531`](../src/bsp-fn.ts)):

```ts
if (key in parent && parent[key] !== null && typeof parent[key] === 'object') {
  parent[key]._ = content;     // container already there → set its voicing
} else {
  parent[key] = content;
}
```

A scalar written at a position that already holds children sets that position's semantic instead of flattening it. This is the mirror of subnest-on-growth, which moves a string **down** into `_` when a position *gains* children — the same principle at the terminus rather than at the intermediates. Every call through the connector has always been safe.

## What the beach did — no guard at all

`writeAt` in the handler protected intermediate nodes with subnest-on-growth and then ended:

```js
node[lastKey] = value;   // unconditional
```

So over raw HTTP, two ordinary acts destroyed data:

**Paying a summary at `N0`** — the container and its nine entries replaced by the summary sentence. Verified on the file-backed rig:

```jsonc
// before                          // after  POST {spindle:"10", content:"SUMMARY over 01-09"}
{"1": {"1": "entry number 10"},    {"1": "SUMMARY over 01-09",
 "_": {…01-09…}}                    "_": {…01-09…}}          →  {"ok":true}
```

**Re-voicing the identity of an already-supernested block at `0`**, where the root `_` is the wrapped past rather than a string — the whole past replaced by one sentence:

```
pre-fix   POST {block:"h", spindle:"0", content:"h — re-voiced identity"}  → {"ok":true}
          wrapped past: DESTROYED -> 'h — re-voiced identity'
```

The second is the one that mattered in practice: re-voicing a history or stash is exactly what this day's accumulation-law pass did across six live blocks. Those went through bsp-mcp and were safe. The same call from `genus-one/wire.py`, which talks HTTP to the beach directly, would not have been.

Worse: after the clobber, the next `append` re-used the destroyed addresses.

No `confirm` was required for either — that guard exists only for whole-*block* replace, one level up.

## The fix

Port the rule bsp-mcp already had into the handler's terminus. `scripts/smoke-voicing.js` is the regression battery: 13/13 against the fix, 7 failures against the pre-fix handler.

Replacing a container stays possible and stays explicit — send an object.

## What this cost, and the lesson

Nobody had hit it. No accumulator on the beach had reached an all-nines boundary *and* had a summary paid by hand, and every identity re-voice so far had gone through the connector. It was found by reading the law and trying to execute it — which is the argument for the audit: **a convention nobody has run is not a convention that works.**

The second lesson is about the trace, not the substrate. The divergence was real, but "two implementations disagree" is a symptom, and it was reported as though it were a fork in the design. One of them was simply broken against a law both were meant to serve. Before escalating a disagreement between implementations, find the rule — the rule usually exists, and then there is nothing to decide.

## Left alone deliberately

bsp-mcp's own low-level `writeAt` in `src/bsp.ts` still has replace-semantics at the terminus, and is documented as such. It is a guarded port of `bsp2-star.py`, and its callers are `applyWrite` (which guards above it) and the accumulator (which only ever writes fresh slots). The guard lives at the write **surface** in both stacks — just at different layers. If strict symmetry inside bsp-mcp is wanted, the Python reference goes first, then TS, then JS, per the port discipline.

Also still open, and genuinely design rather than plumbing: `block-conventions:9.3` says a mark appends past the *largest* present slot, while `nextZeroFreeSlot` fills the *first free* one — divergent only after a tide wipe, where the convention wants the gaps left as gaps.
