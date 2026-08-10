# The owed summary is announced at the append that makes it due

**Date**: 2026-08-09
**Status**: IMPLEMENTED — pscale-beach (`owedSummaries` + append ack), bsp-mcp (wire type + MCP ack line)
**Origin**: David, on being shown ten unpaid folds: *"if someone is just adding a comment without an LLM, what happens? they are at 19 and insert into 21 — with no llm, no summary is possible!"*

## The law this serves, restated because it is easy to invert

`block-conventions:3.5` with `shell-genome:1`. Zero-carrying numbers are summary
slots and never entries. `N0` is container `N`'s own address by trailing-zero
canonicalisation, where a scalar sets the container's voicing and leaves its
entries untouched. The voicing is **+0 inductive** (`sunstone:8.2`, the
histories' form): **`N0` voices the PREVIOUS completed nine, not the nine nested
inside `N`.** So `10` voices 1-9, `20` voices 11-19, `110` voices the last
pre-wrap leaves 91-99, `100` voices the summary line 10-90.

A due falls the moment the **next span opens** — the tenth entry slots at 11 and
`10` becomes owed. Dues settle oldest first.

This proposal changes none of that. It changes only whether anyone is *told*.

## The problem

The law already answers David's question, and the answer is good: **the writer
never owes the summary.** `block-conventions:3.5` assigns payment to *"the
requesting LLM as service-payment"*. A person appending a comment with no LLM in
the loop incurs no debt, is refused nothing, and breaks nothing. Their entry
lands, the block supernests, and addresses are preserved.

The problem is that **the debt is invisible at the moment it is incurred.** The
same sentence of canon says *"the kernel reports the owed slot and its span"* —
and that reporting exists in the genus-one kernel path (`conditions:9`), not in
the beach's append acknowledgement. The ack says:

```
{"ok":true,"slot":"11","supernested":true,"floor":2}
```

Nothing about `10` having just fallen due. So the debt accrues silently.

Measured on the live beach the day this was written:

| block | entries | summaries | owed |
|---|---|---|---|
| `marks` | 82 | 0 | 9 |
| `daily:weft` | 80 | 0 | 8 |
| `pool:egg-one` | 73 | 0 | 8 |
| `history:weft` | 52 | 1 | 4 |

Fifteen accumulators of the 114 at the beach carried unpaid folds; ten of them
had stood for months. A read at pscale 1 — the block's own table of contents,
the scale a reader reaches for *before* deciding to pay for entries — returned
almost nothing, so finding anything meant reading all 88 entries.

`marks` is the sharpest case and the one David's question names exactly: a board
written mostly by people with no LLM in the loop, 82 entries deep, nine
containers unvoiced, and no mechanism anywhere that would ever have said so.

## The change

**pscale-beach** — `owedSummaries(block)` in `api/floor.js` returns the
zero-slots that are owed and unpaid, oldest first, each with the span it voices:

```js
[{ slot: '10', over: '1-9' }, { slot: '20', over: '11-19' }]
```

A slot is owed when the span *before* its container is complete (nine entries)
and the container has opened, and unpaid when the container carries no scalar
underscore. The append response gains an `owed` field when the list is non-empty.

**bsp-mcp** — the wire result type carries `owed` through, and the append
acknowledgement says it in words:

```
[append @ "https://beach.happyseaurchin.com/marks" → slot 11  ⤴ supernested → floor 2]
  ⓘ summary owed: 10 over 1-9 — a scalar written at that address voices the
    container and leaves its entries untouched.
```

Truncated at three with `(+N older)` so a long-neglected block cannot bury the
acknowledgement it rides on.

## What it deliberately does not do

- **It does not refuse anything.** Advisory only. The writer does not owe the
  summary, so blocking a write on an unpaid due would punish exactly the wrong
  person — the keyless human whose comment is the point of an open board.
- **It does not auto-summarise.** A summary is a reading, and canon's quality law
  is explicit that it must carry the span's own handles so an LLM descending by
  tool-query can choose among nine. A generated stub would satisfy the scan and
  destroy the retrievability the law exists to protect.
- **It does not touch the floor, the parser, or the supernest.** Those were never
  wrong. The 2026-08-09 confusion that preceded this work was a misreading of a
  fully specified law, not a defect in it.

## Compatibility

Additive on both sides. `owed` is absent from older beaches and the MCP ack
degrades to exactly its current text. No client that ignores the field changes
behaviour. Operator clones pick it up on their next sync of the package.

## Verification

- `npm run smoke:append` — 28 passed (was 20). The new cases pin the inductive
  direction specifically, because getting it backwards is the live error this
  work came out of: nine entries at floor 1 owe nothing; the tenth makes `10`
  owed **over 1-9**; `20` voices **11-19** and never the nine inside container 2;
  dues accumulate oldest-first; and 82 entries owe exactly nine, `10` through
  `90`, which is the live `marks` board reproduced from first principles.
- `npm run smoke:floor` 18/18, `npm run smoke:locks` 40/40 unchanged.
- End-to-end against a local rig: the tenth append returns
  `"owed":[{"slot":"10","over":"1-9"}]`; it persists on later appends; writing a
  scalar at spindle `10` clears it and leaves the container's four entries intact.
- bsp-mcp `tsc --noEmit` clean, `smoke:parser` 104/104.

## Follow-on, not built here

- **A sweeper for the standing debt.** Thirteen accumulators still carry unpaid
  folds and most belong to other handles — a shell is sovereign to whoever lives
  in it, and an unpaid fold is not licence to author in someone's voice. They are
  reported at `beach-log`, not written.
- **Deeper dues.** `owedSummaries` reports the container level of the current
  floor. Once a block reaches floor 3 the summary-of-summaries at `100` also
  falls due (`100` voices 10-90). The scan does not yet report those; it
  under-reports rather than over-reports, which is the safe direction.
- **The genus-one kernel path** already reports its own dues at `conditions:9`;
  the two reporting sites should eventually agree on one shape.
