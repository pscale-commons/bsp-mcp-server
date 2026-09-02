# Temporal comparison, rendered — addresses, stamps, and the law in every window

**Date**: 2026-09-02 · **Lane**: watch:weft 223 (intake) → 224 (verification + this proposal) · **Status**: implemented alongside this document

## Problem

LLM instances have no NOW — text arrives as an eternal present, indexicals rebind at
read time, and calendar arithmetic is the one operation a reading model reliably
botches or, worse, never attempts. The 2026-07-15 temporal coordinate
(`proposals/2026-07-15-temporal-coordinate.md`) solved this for ISO instants: every
tool response is grounded — ages annotated beside the data, a now-stamp at the end.
The 2026-09-02 intake (watch:weft 223, keeper's framing) showed the remainder, and
this lane verified all three classes against the live beach:

1. **Clock addresses render bare.** `beach-venture:happyseaurchin` at `[202633134]`
   — "Would be nice to meet with Julie or happyhedgehog…" — is one day ahead of the
   reading moment, and nothing said so. A claude-ai session asked "what is
   happyseaurchin asking for tomorrow" surfaced nothing; asked about a Thursday
   meeting, it surfaced *last* week's attempt as current.
2. **Unstamped entries rot.** `ahead:happyseaurchin` 1.1 ("Four intentions today…")
   and plain-string appends like `pool:dovetail` 46 carry no timestamp; their
   indexicals were bound at an unrecorded write time, and no render can recover
   what the write never recorded. (The intake's original exhibit, dovetail 89,
   turned out on live inspection to be STAMPED — its field-3 ts hidden by exactly
   the class-3 rendering gap below, which is its own kind of proof. The beach has
   server-stamped OBJECT appends missing field 3 since pscale-beach 4392ad8, so
   the genuinely unstamped class is plain strings — precisely what the door wrap
   closes.)
3. **Stamps that exist were hidden.** `ahead:happyseaurchin` 1.3 carries a field-3
   ISO stamp — visible in a whole-block dump, invisible in every walk, disc, and
   point read, which render only the underscore. Its unstamped siblings (1.1, 1.4 —
   "Four intentions today…") sit beside it, indistinguishable.

The sundial sentinel had already ruled the direction: shared prefix is orientation,
never distance (branch 6 — a boundary flips high digits while lying minutes apart),
and the exact delta is *read from the rendering* (branch 6.1). This change is branch
6.1 made mechanical for addresses, exactly as `renderAge` made it mechanical for
instants: **deliver the comparison; never invite the arithmetic.**

## Changes

### G1 — clock addresses rendered with their relation (`src/temporal.ts`, `src/bsp-fn.ts`)

- `parseTemporalLabel(token)` — the rung gate: 4–10 digits, right-padded to full
  width; leading zero rejected (year 0xxx is outside the floor-10 form, and
  `Date.UTC` would silently remap it); analogue digits validated against their
  fan-outs (season ≤ 4, month ≤ 3, week ≤ 5, day ≤ 7); zero-padding must be a tail,
  never interior.
- `renderAddressRelation(token, now)` — the partition: a period containing now reads
  `(now — today)` / `(now — this morning)` at its own grain; wholly behind reads
  `(yesterday)`, `(last week)`, `(3 days behind)`; wholly ahead is flagged
  **AHEAD** — `(AHEAD — tomorrow)`, `(AHEAD — in 2 weeks)` — so a stale intention
  can never wear the face of the current. Counting is span-based in the address's
  own rung (calendar-true, never digit subtraction). The fine rungs (gathering,
  beat) voice through the day when they cross one, because "9 gatherings ahead"
  orients worse than "tomorrow, morning".
- `formatRead` tags emitted address labels when the block's floor is 10
  (`addrLabel`); `floorOf` derives the floor from any entry's `depth + pscale` when
  a wire result omits it, so beach-formatted shapes are covered too. Rung-invalid
  floor-10 addresses ride through bare — the gate needs no family registry.
- `annotateAges` gains a prose pass: free-standing ten-digit sundial addresses
  (year window 19/20/21 + rung validity, guards mirroring ISO_RE, and never a token
  already followed by an annotation) are tagged wherever they appear — any tool's
  text, any block's prose, quoted stamps included.
- Panel-driven corrections (six adversarial lenses over the uncommitted diff, run
  w9791a5xb, 2026-09-02): `addressToSpan` clamps a band-5 week to its month
  boundary (unclamped, a dead prior-month band-5 address kept reading as the
  current week — the blocker); `parseTemporalLabel` rejects calendar-impossible
  addresses ("Jan 32", week 5 of a 28-day February); the irregular rungs (week,
  month, season, year and coarser) count CALENDAR ORDINALS instead of dividing by
  mean seconds (mean division read two different months as "next month" beside a
  short February, and skipped ordinals outright); labels anchor to the entry's own
  pscale, so a walked interior-zero ancestor never voices the wrong grain; the
  prose gate narrows to pscale ≤ 6 and ±50 years (round credit amounts and
  far-year serials ride through untouched); and the fine-rung part suffix caps at
  a week's distance. This fixes two vocabularies into place, each true under its
  own definition: an ADDRESS relation counts periods (ordinal — Aug band-4 is
  "2 weeks behind" a September now even at ten days, because the short band-5
  lies between), while an INSTANT age counts duration in the containing rung
  ("a week ago"). Near a short band the two may differ by one step.

### G2 — arrival stamps surfaced and supplied (`src/bsp-fn.ts`, `src/tools/bsp.ts`)

- `entryStamp(node)` surfaces a field-3 ISO stamp (the mark shape's ts,
  block-conventions 4.22) onto every path-walk, disc, descent, and point line as
  ` · <iso>` — which the grounding boundary then ages like any instant. Containers
  whose digit 3 holds a subtree are untouched (the stamp must be an ISO-shaped
  string).
- `stampPlainAppend(entry)` — at the append door, a plain-string entry in the open
  is wrapped as the mark shape's minimal form `{_: text, 3: iso}`, said in the ack
  (`· stamped <iso>`). Structured entries keep their author's shape untouched; gray
  entries are private and stamp inside their plaintext only by their author's hand.
  This closes class 2 for every future write through bsp-mcp; other doors (xstream,
  the o-pages) are named below.
- Panel-driven corrections: `entryStamp` surfaces the LEADING ISO token only —
  the live board carries decorated stamps, and surfacing the whole string
  re-renders a stale age beside the fresh one (the shore's own recorded lesson);
  the shore's marks walker (site/shore/index.html) now recognises the minimal
  `{_: text, 3: iso}` form before its underscore path, so a wrapped mark renders
  as one voice rather than a phantom batch summary plus a timestamp-stone; an
  empty or whitespace-only string append is refused at the door (the slot would
  be consumed and pool reads skip it as a tombstone); and
  scripts/smoke-append-spindle.ts pins the stamped wire shape as the append
  contract.

### G3 — the law, where every window already reads

- **MCP server instructions** (`src/server.ts`): THE CLOCK paragraph — read the
  relations before treating anything as live; behind is record, AHEAD is intention;
  trust the adjacent stamp over stored indexicals; call an unstamped entry
  undatable; author sundial spindles FULL WIDTH. Every connected client (claude-ai
  with any handle, keel, weft, any LLM app) receives this at handshake.
- **sundial** sentinel: branch 5.4 (addresses ground exactly as instants do) and
  branch 9 provenance updated.
- **soft-agent** 2.4: the turn's now is the envelope's — never the session's, never
  the text's.
- **progression** 1.3: wake includes the clock.
- **Beach-side, same lane, under the law-writes discipline**: `function:now` branch
  2 deepened with the reading law (standing text archived at
  `archive:function:now:2026-09-02` before the write).

### Drive-by correction

The INSTRUCTIONS selection-shape table still carried the legacy `ring`/`subtree`
vocabulary retired 2026-05-17; it now states the canonical six shapes.

## Decisions

- **Label gate = floor 10 + rung validity.** No family registry, no declaration
  read: any floor-10 block whose addresses are rung-valid is on the clock in
  practice (spine:now's own law), and a rung-invalid address is left bare. The
  false-positive surface is a non-clock floor-10 block whose addresses happen to
  parse as valid dates — none exist today, and the tag is visibly labelled if one
  ever does.
- **Prose gate adds the year window (1900–2199)** to keep arbitrary numerics out of
  annotation; inside labels the floor is known and the window is not needed.
- **Gray appends are never wrapped** — private plaintext is the author's alone.
- **Never annotate inside tokens**: the guards require the address to stand free
  (not glued to word characters, hyphens, or a decimal tail), the lesson ISO_RE
  already paid for in the SAND trial.

## Out of scope, named

- Arrival stamps at the **other doors** — xstream commits and o-page writes that
  append plain strings need the same wrap at the `pscale-beach` handler or their
  own doors (a pscale-beach change, proposed separately).
- **Wire-path stamps** — the beach's shape emitters (`pscale-beach`
  api/pscale-beach.js: the canonical disc/path-walk/point builders) need the same
  leading-token `stamp` field so federated disc/point/descent reads surface
  arrival stamps; bsp-mcp's formatRead already renders the field wherever it
  appears. A companion pscale-beach PR accompanies this change.
- **xstream** — the soft-agent seed at blocks/xstream/soft-agent.json mirrors the
  sentinel (branch 9's own sync law) and needs the 2.4 sync; and xstream's tool
  results are not grounded at all (one now-stamp at the head of the assembled
  context, raw JSON tool returns) — grounding them is xstream's own change, which
  is why 2.4 is phrased host-independently.
- **Whole-block JSON reads** are annotated like all rendered text; a copy-back
  workflow (read whole → write to archive:<block>:<date>) must copy from stored
  data or strip decorations — the July ISO pass already had this property, the
  address pass widens it. Named so archivists know.
- **stream/pool envelope labels** — their formatters emit their own address lines;
  the boundary prose pass already catches full-width addresses in their text, and
  their ladders voice humanly by construction. Extend `addrLabel` there if field
  use shows the need.
- **o-page renderers** — already humanly legible (the keeper's o-pages-first
  method stands); the /now, /morning, /walk family reads the same blocks and can
  adopt `renderAddressRelation`'s vocabulary when its operators next move.

## Tests

`npm run smoke:temporal-address` (new — the rung and calendar gates, the ordinal
partition, the prose pass, the label anchor, the stamp surfacing, the door wrap;
fixed-now cases pinned to 2026-09-02 10:18 UTC, formatRead cases derived from the
real clock so they hold on any day). `smoke:append-spindle` updated to pin the
stamped append contract. Existing `smoke:temporal`, `smoke:temporal-envelope`,
`smoke:parser`, `smoke:unit` stay green. Adversarial verification: six
independent same-model lenses (arithmetic, regression, canon, voice,
compatibility, field-proof) ran against the uncommitted diff — one blocker and
sixteen fixes found, resolved above or named here; the field-proof lens
reconstructed all three field failures as fixed (31/31 assertions), including
against the live beach.

## Verification against the field failures

- "What is happyseaurchin asking for tomorrow" — the venture cell now renders
  `[202633134] (AHEAD — tomorrow, morning)` in the very read that fetches it
  (verified against the live block by the field-proof lens, 31/31 assertions).
- `pool:dovetail` — slot 89's hidden stamp now renders and ages in every walk;
  genuinely unstamped plain strings (slot 46, ahead 1.1) render visibly bare,
  which is the honest state; and every plain string appended through bsp-mcp from
  today carries its stamp.
- `ahead:happyseaurchin` — stamped entries show their stamps on walks and local
  reads; the federated wire fast path (disc/point/descent with a pscale) still
  returns beach-built entries carrying no stamp field — the companion
  pscale-beach change below closes it, and until it ships, a federated disc
  shows address relations but not entry stamps.
