# The zero-slot summary is read-addressable and not write-addressable — and the two doors disagree

**Date**: 2026-07-28
**Status**: recorded, unfixed. The convention has been made safe on both doors; the implementation divergence is still open.
**Occasioned by**: an audit of every `history:` and `stash:` block at beach.happyseaurchin.com, after "new notes at the next free digit" was found voiced as law in `stash:happyseaurchin`.

## What the convention says

`block-conventions:3.5` — the counting-block law shared by history, stash, marks, and pools:

> the summary is the container's voicing — saying '300' is the human convention for digit 3's semantic at pscale 2, stored as the underscore subnested in digit 3 (trailing-zero canonicalisation makes N0 read exactly there).

That sentence is true of reading. It is not true of writing, and the block did not say so.

## What actually happens

`parseSpindle` strips trailing zeros as floor-width padding ([`src/bsp.ts:220`](../src/bsp.ts), and identically at the beach handler). So `10` parses to digits `['1']`, and `readAt` walks to container 1 — whose rendered semantic IS its underscore. Reading works exactly as documented.

`writeAt`'s terminus is an unconditional assignment — `node[lastKey] = value`. The subnest-on-growth guard that preserves a string in the way applies only to *intermediate* keys, never to the last one. So a write at `10` assigns container 1 itself.

Verified against the real handler on the offline rig (`pscale-beach scripts/local-beach.mjs`), on a block appended past the all-nines boundary:

```
POST {block, spindle:"10", content:"SUMMARY over 01-09"}   →  {"ok":true}
```

```jsonc
// before                          // after
{"1": {"1": "entry number 10"},    {"1": "SUMMARY over 01-09",
 "_": {…01-09…}}                    "_": {…01-09…}}
```

Entry 11 is gone. No error, no `confirm` requirement — the `confirm: true` guard for a clobbering write exists only for whole-*block* replace ([`api/pscale-beach.js:1079`](https://github.com/pscale-commons/pscale-beach)), and there is nothing one level down.

**There is no address that writes a container's underscore.** Every candidate was probed (`1.0`, `100`, `010`, `0.1`, `11.0`): each either walks past the node, lands on a sibling, or replaces the container. The trailing-zero strip makes the position unreachable as a write target by construction.

## The divergence

The same call through bsp-mcp is **not** destructive:

```
bsp(block="probe:weft-zs", spindle="10", content="SUMMARY over 01-09")
→ {"1": {"1":"e10", "2":"e11", "_":"SUMMARY over 01-09"}}   // children intact
```

Verified live at beach.happyseaurchin.com on a throwaway block (since deleted), then confirmed the other way by raw HTTP to the same live beach, which replaced the container.

The mechanism is an accident inside bsp-mcp: `saveBlockToBeach` applies the write to a local copy, then re-reads that copy at the same spindle and ships the result as `content` ([`src/db.ts:492`](../src/db.ts)). The re-read resolves to the whole container, so bsp-mcp effectively resends the children without meaning to. Right answer, wrong reason — and it is one refactor away from silently becoming the destructive path.

This is a split on L1-kernel contract #5 (address parser semantics), which the v2 freeze declares identical at both ends of the wire. Same address, same block, two different positions depending on the door.

## What was done now

`block-conventions:3.5` and `pscale://shell-genome:1.3` now name the act that is correct on **both** doors: pay a summary by writing `N0` with the container **whole** — the new underscore beside its digit children resent — never as a bare string. That is a read-modify-write, so it carries the ordinary staleness risk of any non-atomic write; it is nonetheless the only formulation that is safe everywhere today.

The same wording was applied to the live `history:` and `stash:` underscores weft owns, and sent to the sovereign handles it does not.

## What is still open

1. **Decide which door is right.** The documented canon (`bsp2-star.py`, CLAUDE.md, bsp-test battery 7) says strip trailing zeros — so the beach matches canon and bsp-mcp diverges. But the *convention* wants `N0` to name the voicing, which is what bsp-mcp accidentally delivers. Either the parser stops stripping on the write path, or the convention stops using `N0` as a write address. Both are kernel-class changes: Python first, then TS, then JS, per the port discipline.

2. **Guard the sub-container clobber regardless.** A write that replaces an object holding digit children with a scalar should require `confirm: true`, exactly as whole-block replace does. Same rule, one level down. This is small, and it converts a silent nine-entry loss into a refusal.

3. **The kernel writes raw.** `genus-one/wire.py` talks HTTP to the beach directly, not through bsp-mcp — so a genus-one instance paying a summary takes the destructive path. The genome underscore now names the whole-container act, which is safe on that path; if (1) resolves toward bsp-mcp's behaviour, the kernel needs the same treatment.

## Note on how this surfaced

Nobody has hit it yet: no accumulator on the beach has reached the all-nines boundary *and* had a summary paid by hand. It was found by reading the law and trying to execute it. That is the argument for the audit — a convention nobody has run is not a convention that works.
