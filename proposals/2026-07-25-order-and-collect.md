# Order and collect — the loop-A pattern made operational

> **Status.** Proposed 2026-07-25 at David's direction, completing the trajectory the compile arc opened ([2026-07-22-well-formed-reading](2026-07-22-well-formed-reading.md), [2026-07-24-frames-on-the-spine](2026-07-24-frames-on-the-spine.md)). This is the piece of the original picture deliberately left as pattern-without-machinery: *an LLM places an order for a bundle of semantics, goes on with its own thinking, and collects the assembled window later — one call, not N.* **Practice, never enforcement**: the reference deployment demonstrates reasonable efficiency; other operators fork their own bsp-mcp and will produce better ones — that is the open-source way, and this document exists so the pattern is legible enough to fork.

## 1. The shape, in one breath

A **thinking module in a standard LLM app runs loop-A**: it reasons, it calls tools, it reasons again. Every tool call is a round trip that suspends the thinking; a bundle of N addresses fetched naively costs N suspensions. The compile arc already collapsed N to one *at composition moments* (entry, frames). Order/collect extends the same economy to **mid-thought**: the moment the module *foresees* needing a bundle, it throws the order — one cheap write — keeps thinking, and later catches the assembled semantics in one read. The throw-and-catch shape is already the substrate's law (`grit:7`); this proposal gives it the one generic site any LLM app can use, and the operational sweep that makes the catch real.

The pattern is already native at three tempos, none of them new:

- **Across instances** — the genus fold re-dials `reflexive:9`; the next wake composes from it. The order is placed *for a future self* (live since the kernel).
- **Across voices** — GRIT's stage → fold → render: many throws, one integration, per-viewer catch (live at every table).
- **Across a turn** — the missing tempo: order early in the turn, collect before answering. This is the one this proposal operationalises.

## 2. The convention (data only — no new primitive; the surface stays eleven)

**The order book: `order:<handle>`** — the handle's own outbound requests, digit slots, each:

```
{ _: one line of purpose — why this bundle is wanted,
  1: the bundle — a digit-keyed node of references (local name:addr:att or
     star-refs *:<origin>:<name>:<addr>[:<att>]), or a single address to an
     existing bundle (a frame, a reflexive slot),
  2: deliver-at — a block name for the solid; default solid:<handle>, same slot,
  3: ISO timestamp }
```

**The solid** — the assembled window, written at deliver-at in compile's envelope form (the hydrated bundle + the completions footer, framed apertures throughout). **Presence of the solid IS the status** — there is no state machine, no pending/done field, nothing to poll but the address itself. Stigmergy carries the whole lifecycle: order written → solid appears → orderer reads and clears its slot (hygiene, not protocol; an uncleared order is just a standing subscription any assembler may refresh).

**Collect** — one read of the solid; or, at the sweep-capable doors, the assembled window arrives inline in the next envelope without even that.

## 3. Assemblers — three rungs, matching the beach-crab ladder

- **v1 — sweep at the door (operational immediately, zero infrastructure).** Doors that already compile (play first; pool_engage when pulled) check `order:<caller>` on every call: pending orders compile server-side and ride that envelope, and the solid is written for the record. The loop-A ergonomics land in full — order early, think freely, one later call returns everything — with the honest note that assembly executes *at* collection: the gain is **call-shape** (no N round trips, no suspension per address), not wall-clock precomputation. For bundles of reads, call-shape is the whole cost, so v1 is most of the value.
- **v2 — a runner (beach-crab rung 0–1).** A cron or daemon sweeps order books between calls; true precomputation. Earned only when assemblies are genuinely slow — deep cross-beach sweeps, large hydrations — never installed on spec.
- **v3 — another mind (the lender's wake, the observer-tax, a genus seat).** Orders whose assembly requires judgment: a synthesis, a resolution, a keeper's answer. The same slot shape carries it unchanged — this is where order/collect exceeds anything synchronous compile can do, and it is already how the fold and the pool synthesis behave; the convention just gives those acts a common address grammar.

## 4. Where the teaching lives — so any LLM spots the pattern

Per the current-constitution discipline (presence, not documentation): **deepen `grit:7.4`** — the branch that already names the order — with children carrying the slot shape, the deliver-at default, and the three rungs (depth, not a new block; the sentinel edit is one PR). One line rides the **server instructions** at connect (the GROUND channel: "foresee a bundle → order:<handle> now, collect later — grit:7.4"). And the sweep, when it fires, **declares itself in the envelope** exactly as completions do — the pattern teaches by being visibly used, which is how conventions actually propagate here.

## 5. Not enforced — the trajectory, stated

David, 2026-07-25: *"Do we enforce it? Well, we can set it up as good examples of practice. Other people will have their own bsp-mcp. We just want to show reasonable efficiency with this first one. People will no doubt produce better ones. That's the open source way."* The reference deployment ships the v1 sweep and the worked examples; the convention is forkable by construction (it is blocks and one door behaviour); nothing refuses an app that ignores it and calls N times — inefficiency is permitted, just no longer necessary.

## 6. Implementation plan

1. **PR-B1 (code, small):** `orderSweep()` beside `compile()` in [src/compile.ts](../src/compile.ts) (read order book → compile each → write solids → return sections); the play door calls it and labels what it delivered; smokes (offline: order placed → next call returns assembled + solid written; star-ref orders; empty book = zero cost).
2. **PR-B2 (data + sentinel):** `grit:7.4` deepened; a worked example order/solid pair on the beach; the server-instructions line.
3. **Deferred:** v2 runner and v3 conventions beyond what already exists — pulled by demonstrated slowness or a demonstrated judgment-assembly, per the admission-by-failure discipline.

## 7. Acceptance

A thinking module mid-turn writes one order slot; its next door call returns the assembled window inline, the solid stands at the delivery address, and the total tool calls for a bundle of N references is **two — or one, when the order rides a call the module was making anyway** — never N. When an LLM that has merely *read* grit:7.4 places a well-formed order unprompted, the pattern has become what it was meant to be: spotted, not enforced.

— Fable 5, 2026-07-25.
