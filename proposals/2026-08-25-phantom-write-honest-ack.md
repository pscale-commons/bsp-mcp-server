# The phantom write is an ack problem — every landing gets named, and no content write posts hollow

**Date**: 2026-08-25
**Status**: LANDED (this PR)
**Witnesses**: keel at pool:weft:52 and history:keel:43 (the 2026-08-25 "4.1" report); history:keel:15 (the 2026-07-08 "24 pscale 1" report)

## The report

Writing to `sand-v2` at spindle `"4.1"` through bsp() acked `[wrote path-walk+descent @ "4.1"]` and landed nothing where the author looked; the dot-free digit-walk `"41"` then landed correctly. Keel: *"an ack that names an address the walker did not resolve is worse than an error."* Same class as the 8 July hollow ack, where a point write at `"24"` with guessed `pscale_attention=1` acked and was absent on read-back.

## The forensics — two distinct classes, one symptom

Reproduction was run three ways: a local pipeline rig over the HEAD walker, the live deployed router (`bsp.hermitcrab.me` v0.4.0) against scratch blocks at beach.happyseaurchin.com, and inspection of the beach handler (`pscale-beach` api/pscale-beach.js, operator clone at HEAD `e53b88d`).

**Class 1 — pscale truncation (2026-07-08, genuinely hollow).** A point write with an explicit pscale ABOVE the spindle terminus lands at the addressed depth — `"24"` with pscale 1 on a floor-2 block writes at depth 1, digit walk `2`. That is canonical (whetstone:2.4: *"Write at point shape places a string at the addressed depth"*), and the local merge did it. But the surgical wire payload was derived by re-reading the merged block at the FULL spindle (`readAt(block, "24")`) → `undefined` → `JSON.stringify` silently drops the `content` key from the POST body → the beach's `handleStandardWrite` sees no content, treats the POST as a lock-only touch, does nothing, and returns 200 `{ok:true}`. The tool then acks the shape of the LOCAL merge. Nothing landed anywhere: the merge's own truncated write never travelled either. Reproduced exactly on HEAD.

**Class 2 — floor padding (2026-08-25, misread as hollow).** On a block whose floor is 2, `"4.1"` left-pads to digit walk `0,4,1` — the walk enters the root underscore chain (digit 0 = `_`) and the write lands at `_.4.1`. That too is canonical and LOAD-BEARING: the padding is what keeps a floor-1-era address locating the same semantic position after the block supernests (sunstone:1.41). Live repro on the deployed router confirmed the write LANDS there — the beach is not dropping it. But an author working in the floor-1 dialect means branch 4 → 1 (`"41"`), looks there, finds it untouched, and reads the write as dropped. The ack echoed only the input string, so nothing surfaced the divergence. (On sand-v2 the debris at `_.4.…` was later destroyed by the same session's root-true — a root-underscore replace — which also returned the block to floor 1; no archive copy exists, so the floor-2 state at the moment of the write is reconstructed from the witnessed `4.1`≠`41` behaviour, which requires it.)

**The beach is exonerated.** Its `writeAt` walks the same parse family with subnest-on-growth; given `{spindle, content}` it lands the write correctly. The fault was entirely bsp-mcp-side: an unfaithful wire derivation (class 1) and a silent ack (both classes). No pscale-beach change is needed or proposed.

## The fix — honest acks, faithful transport, never a hollow POST

Three coordinated changes, all in bsp-mcp:

1. **`bsp-fn.ts`** — `bspWriteInPlace` returns the digit walk the write actually landed at; `bspWrite` surfaces it as `landed` (full-width label form — `"20"`, `"04.1"` — the same copyable form path-walk labels emit, because the short canonical form does not round-trip through the parser's left-padding), sets `wire_spindle` when the landing depth differs from the terminus (truncation), and writes a `landing_note` for both classes. `formatWrite` prints `→ landed at "…"` whenever the landing differs from the input string, plus the note. Nothing is refused: both walks are canonical; they are now SAID.
2. **`tools/bsp.ts`** — the save uses `wire_spindle` when set, so the transport persists at the address the merge actually wrote; every content-bearing save passes `hasContent: true`.
3. **`db.ts`** — `deriveSurgicalValue` (exported, pure) derives the surgical payload and REFUSES when a content write derives `undefined`, naming the resolved digit walk — a content-less POST can no longer masquerade as a landed write. Lock-only saves still post without content by design: claiming an empty position by lock (the roster pattern) depends on that, and the guard keys on `hasContent`.

Ack shapes after the fix (verified end-to-end against the live beach before merge):

```
[wrote point @ "24" pscale 1 → landed at "20"]
[note] pscale 1 addresses depth 1 of the spindle — the write landed at "20", not at the
terminus of "24". To write the terminus, omit pscale_attention or set it to 0.

[wrote path-walk+descent @ "4.1" → landed at "04.1"]
[note] "4.1" walks 0,4,1 at floor 2 — left-of-decimal pads to floor width, so the walk
enters the root underscore chain (digit 0 = "_"). If you meant the branch walk 4,1,
that address is "41".
```

The padding note fires only when the zeros were ADDED by the parser (`"041"` written out stays silent — the author said what they meant), and never on floor-1 blocks, where `"4.1"` and `"41"` are the same walk.

## Battery

`npm run smoke:hollow-ack` — 27 assertions: both classes, the round-trip discipline of the full-width label, beach convergence (the transcribed beach `writeAt` applied to the wire body ends byte-equal to the local merge), the JSON.stringify drop mechanism pinned, the guard's refusal naming the walk, and the lock-only pass-through.

## Seam noted, not touched

A star write with an inner spindle (`"1*2"`) already threw `InvalidAddressError` at the save derivation before this change and still does — loud, not hollow, and out of scope here. Trailing-star writes (`"1*"`) persist whole-node and are unaffected.
