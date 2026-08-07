# The zero-slot speaks — the accumulation law's summary, ended as a recurring fault

**Date**: 2026-08-07
**Status**: proposed (code landed behind it; the block write gated on this being readable first)
**Repos**: `pscale-beach` (the ack), `bsp-mcp-server` (the passthrough + the line an agent reads)
**Law-class block touched**: `ways:grain` at beach.happyseaurchin.com — proposal-first + `archive:ways:grain:2026-08-07` per CLAUDE.md "Law-class beach writes"

## The complaint

> "Got this mess happening again with claude when using grain. It's the last bit
> that matters — the summarising — because the grain is decimals, it can't
> supernest. Or can it?? And we need a definitive solution, rather than hitting
> this problem again, and again, and again."

Three separate sessions have now met the same wall in the same grain. This
proposal answers the question, names why it recurs, and closes it at the only
layer where closing it works.

## The answer: it can, and it already has

Read against the live block, not doctrine. `grain:3b5aba1f7b962a67` — David and
Julie — has **both sides already supernested**, mechanically, by the beach's own
allocator (`appendAtNode`, canonical #54 / operator clone #15). Nothing about
"decimals" blocks anything.

A grain side is an ordinary accumulator that happens to hang one level below the
floor. Every address in the accumulation law simply takes the side's digit as a
prefix:

| The law, at a block root | The same law, at a grain side |
|---|---|
| entries `1`…`9` | `2.1`…`2.9` |
| tenth entry supernests, lands `11` | tenth supernests the SIDE, lands `2.11` |
| entry 5 absorbs to `01` | entry 5 absorbs to `2.05` |
| zero-slot `10` voices entries `01`-`09` | zero-slot `2.10` voices `2.01`-`2.09` |

Live-probed this session: `2.05` returns David's fifth message; `2.10` resolves
to node `2.1` and is **empty**; `2.00` is the original reach text, untouched one
level deeper.

## Why it kept going wrong

The previous session concluded that grain sides are **exempt** from the
zero-slot, and was one word from writing that exemption into the convention. Its
reasoning was:

> "The container now holding 2.1–2.9 has your original welcome to Julie as its
> voicing… Paying the summary by the method block-conventions:3.5 prescribes
> would destroy the grain's opening words."

The fear was right and the address was wrong. Two different positions were
conflated:

- **`2.0`** — the container of entries 01-09. Its underscore *is* the reach text.
  Writing there would indeed destroy the grain's opening words.
- **`2.10`** — the zero-slot proper, which is node `2.1`'s underscore. Empty.
  Writing there destroys nothing.

The law is that **N0 voices the previous nine and lives at the head of the NEXT
span**, never on the container of the span it covers. This is precisely the
correction David himself sent Julie at `2.08`, one session earlier, about this
same law in this same grain:

> "The law is: 10 summarises 01-09, and 20 summarises 11-19. Each zero-slot
> covers the PREVIOUS completed nine, not the nine beneath it."

That is the shape of the recurrence. The law is correct and written down in
three places. It is nonetheless re-derived from scratch, mid-write, by whoever
happens to be holding the append — and the re-derivation comes out wrong in one
of three ways:

1. **Wrong span** — the slot taken to cover the entries beneath it (2.07, then again 2026-08-05).
2. **Wrong method** — the container resent whole with its children, replacing the span it meant to voice (the hazard `pscale-beach#48` guarded against, and the method `ways:grain:5` still prescribes).
3. **Never** — six spans of debt accrued unnoticed on one history; Julie's slot 10 owed since 2026-07-08.

## Why documentation cannot fix it

The obvious move is to write the law into the accumulator's own underscore, so
the block teaches its own reader. David identified this at `2.08`:

> "your history block's own underscore carries none of this… so there is no
> local law to read, which is plausibly why 10 went unpaid."

That works for `history` and `marks`. **It cannot work for a grain side**,
because a side's underscore is the *reach text* — one position, never rewritten
(`ways:grain:2`). There is nowhere in a grain to put the law that a writer will
be looking at.

More generally: any documentation fix requires the agent to have read the law
*before* acting. That is the one moment nobody does. The debt is created at a
keystroke and discovered, if ever, by a later reader.

## The fix

The substrate knows both facts — that a span just closed, and which nine it was
— **at the instant it creates the debt**. It should say so.

`appendWithSupernest` and `appendAtNode` now return `due`; both ack bodies carry
it, composed in the block's own address space. bsp-mcp passes it through and
renders it where the appending agent is standing:

```
[append @ "grain:3b5aba1f7b962a67" → 2.11 (slot 11 beneath node 2)  ⤴ node supernested]
  ⤵ zero-slot 2.10 is now DUE — the +0 summary voicing entries 2.01-2.09, the span
    this append just closed (NOT the entries beneath it). Pay it in this turn: write
    a SCALAR at 2.10 — content = the summary text, no children — which sets that
    container's voicing and leaves every entry under it untouched. Resending the
    container with its children replaces the span. …(block-conventions:3.5)
```

No new call, no new state, no new primitive. One field on an ack that was
already being sent, on the 1-in-9 append that opens a span.

Two details are load-bearing:

- **`dueAddress` restores the trailing zero `formatAddress` strips.**
  Canonicalising is right for a position and wrong for this one thing: in the
  law the trailing zero *is* the summary slot's signature ("10 over 01-09"). An
  ack naming `2.1` reads as an entry slot, and a careful agent refuses to
  overwrite it — exactly the reading that stalled this summary before. Both
  forms walk to the same node; only one says what it is.

- **The covered span renders `1`-`9` at a root but `2.01`-`2.09` at a node**, and
  that asymmetry is real (below).

## The asymmetry, previously unrecorded

A **root** supernest raises the block's floor. The parser left-pads, so every
citation written before the wrap still resolves — `5` becomes `05` for free.

A **node** supernest cannot raise the floor: the side's digit is fixed at floor
width, and nothing re-pads. **Pre-wrap citations break silently.** Probed live:

- `2.05` → David's fifth message.
- `2.5` → *(no content)*.

David's own prose at `2.05` and `2.06` cites "2.5" and "2.6" into the void, as do
several cross-references in Julie's side. This is not a bug to fix — the entry
*number* is stable, which is what the law guarantees — but it is a cost of
node-scoped accumulation that nothing currently warns about. Recorded here, and
in `ways:grain`, so the next author writing a citation into a grain knows to
write `2.05` from the start.

## What changes in `ways:grain`

Branch 5 currently (a) prescribes the destructive hand method — "the holder
rewrites their own side container-whole under their own key" — and (b) states
that mechanical side-append is "in flight" when it landed. Both are now false
and both are actively harmful: (a) is the method that replaces a span, and (b)
sends a session to do by hand what the beach does atomically.

Branch 5 is re-voiced to the landed mechanism, and gains the side-as-accumulator
address table, the zero-slot rule stated at the side, and the citation-drift
warning. `archive:ways:grain:2026-08-07` holds the standing content first.

## What is NOT proposed

- No change to the walker, the parser, or `formatAddress`. The trailing-zero
  strip is correct; only this one ack needs the zero back, and it restores it
  locally.
- No new primitive and no change to the eleven entry points.
- No auto-payment. The summary is a judgement — "navigation, not decoration,
  carrying the span's proper nouns, addresses, decisions and open threads"
  (`block-conventions:3.5`). A machine-written one would destroy the
  retrievability the slot exists for. The machine names the debt; an author pays it.

## Verification

- `smoke:due` (new, 18 cases) pins the arithmetic at both scales — root and node,
  mid-span, span-open, and both supernest boundaries (floor 1→2 and 2→3).
- `smoke:append-spindle` grows to 67, asserting the field on the wire at both
  call sites, and that the due slot **stands empty** — paying it destroys nothing.
- `smoke:append` 20, `smoke:floor` 18, `smoke:locks` 40, `smoke:lighthouse` 16
  unchanged. bsp-mcp `build`, `smoke:wire`, `smoke:unit` 23, `smoke:parser` 104,
  `smoke:grain-address`, `smoke:grain-case` 13 all clean.
- Pre-existing and untouched: `smoke:voicing` fails 7 identically on clean
  `origin/main`. Not this branch; worth its own lane.

## Outstanding, for the operators

- **`grain:3b5aba1f7b962a67:2.10` is owed** — David's side, David's key, over his
  nine messages to Julie. Not written here: it is his voice in his channel.
- **`grain:3b5aba1f7b962a67:1.10` is owed** on Julie's side, hers to pay.
- Deploy order: canonical `pscale-beach` → the operator clone mirror commit →
  Vercel; bsp-mcp → Railway. The ack degrades safely — an un-upgraded beach
  simply sends no `due`, and the line does not print.
