# Frames on the spine — the compiler meets the S·T·I registers

> **Status.** Proposed 2026-07-24, from a live check of both strands after their merges: the compile/frame door ([#182](https://github.com/pscale-commons/bsp-mcp-server/pull/182), [2026-07-22-well-formed-reading](2026-07-22-well-formed-reading.md)) and the URB S·T·I spine + horizon ([#188](https://github.com/pscale-commons/bsp-mcp-server/pull/188), [2026-07-23-urb-sti-spine](2026-07-23-urb-sti-spine.md)). Verified live: `urb.beach.happyseaurchin.com` serves the four world blocks (`spatial:urb` floor-ladder, `temporal:urb` sedimented chronicles, `identity:urb` registered peoples, `keeper:urb` the held register + animation contract); the gal kit stands at the commons (`mint:gal`, `style:gal`, `encounter:gal` family, `char-creation:gal`, `roster:gal`); the horizon walk is deployed (bespoke, in `composeCurrent`); gal-moss's own blocks are byte-unchanged, its placing (`notes:scene:3`) **deliberately empty** ("filled when the patchwork joins"), and its `frame:1` is the Character frame from #182 (currently `rules:nomad`, delivered whole).

## 1. The convergence

The two strands specified the same construct without seeing each other:

- #182 built the mechanism: `compile(bundle, load)` — a bundle of bsp addresses unfolds into semantics in one call; frames activate by data; completion rides the envelope.
- #188 §4 wrote the method: *"Scoping is a spindle, and a bundle of spindles is a FRAME… Preselected address-bundles per observer-kind are the compiler: **tier picks the frame, face picks the register**. Delivery is always long nested spindles with the ancestor underscores riding above (the framed aperture) — **never block dumps**."*

The compiler exists and is wired; the method now says precisely what its bundles should contain and how their contents should read. Three gaps stand between them, plus data work that is not code at all.

## 2. Gap 1 — the reference grammar crosses beaches (code, the load-bearing one)

`compile`'s `parseReference` speaks `name[:addr[:attention]]` — **beach-local only**. But the spine's whole point is inheritance across surfaces: a bubble at `/w/gal-moss` inherits from `spatial:urb` at `urb.beach`. The substrate already has the grammar for this — the **origin-qualified star-ref**, live in two places today:

- the passport location: `*:https://…/w/gal-moss:spatial:scene:1` (`passport:3`)
- the placing: `*:<worldOrigin>:<worldBlock>:<addr>` (`notes:<scene>:3`, walked by the horizon)

**Proposal**: `parseReference` (or a compile-side wrapper) learns `*:<origin>:<block>:<addr>[:<attention>]`, and the door's loader resolves origin-qualified names (per-origin cache; sentinels still first). Then a frame entry can dial the world's registers directly —

```
frame:1 at a placed bubble:
  1: rules:nomad                                      (the table's law)
  2: *:https://urb.beach.happyseaurchin.com:spatial:urb:3.2:0   (the region, a point)
```

— and **the horizon itself becomes one frame entry** rather than bespoke code. The bespoke walk in `composeCurrent` stays as-is meanwhile (it serves every engage, not just entry; collapse is a later cleanup, only after frames-with-star-refs prove out). Scope guard: reads only, same wire the horizon already uses, no new trust surface — a star-ref in a frame fetches public blocks exactly as a browser could.

## 3. Gap 2 — the framed aperture is the delivery form (code, small)

The method's delivery rule — *nested spindles with ancestor underscores riding above, never block dumps* — is exactly what `scoop`'s spindle mode already returns (the walk's voiced entries). Two small moves:

- **Rendering**: the play door's frame section currently `pyDumps` whatever hydrates — a whole-block ref therefore dumps. Render spindle results as the walk (ancestor underscores as lines above, terminus beneath) — the same shape the horizon prints. One renderer function; the compile result is untouched.
- **Authoring rule** (goes in the frame convention, alongside the face-scoping lesson already in `frame:1`'s voicing): frame entries should be *(spindle, aperture)* refs — a point, a walk, a walk-plus-directory — not bare block names. **One honest exception: law-class blocks.** GRIT itself delivers the operating directive whole at first engage; `rules:nomad` in a frame is that same act. A frame may carry a law block whole; it may never carry a *register* block whole — registers are walked at the coordinate.

## 4. Gap 3 — tier picks the frame, face picks the register (convention, not params)

No new tool parameters. The convention, stated so the data can be authored now:

- **`frame:<room>` is the Character frame** — what every arriving eye may see: the table's law, plus framed apertures of the *public* registers (S·T·I) at the bubble's coordinate. This is what `pscale_play` compiles today.
- **The keeper's frame is the keeper block itself.** `keeper:urb:7` already says "to wear this shell: read all seven branches" — that is a compile: `compile('keeper:urb', load)` *is* wearing the shell. No `frame:keeper:*` block needed; the animation contract is the bundle.
- **The register law is the fence between them** (`keeper:urb:1`): public is what the three registers deliver; held is everything with a WHY in it. A Character frame that references `keeper:*` or `notes:*` is mis-authored — the exact leak the first gal-moss frame demonstrated and reverted ([2026-07-22 §2a](2026-07-22-well-formed-reading.md)). This is an authoring discipline now; if a demonstrated failure recurs, it becomes a `well-formed` interpretive rule (the authoring battery), not a compile-side gate — the compiler stays face-blind, the door chooses the frame.

## 5. The data work, and whose it is

- **The placing** (`notes:scene:3` at gal-moss) is the Author's, and its emptiness is *authored* — "when a patchwork of tables joins, this crossing takes its place among them." Filling it with `*:https://urb.beach.happyseaurchin.com:spatial:urb:3.<n>` is the single write that switches on the horizon for the live table. Not mine to write; noted as the activation lever.
- **`frame:1` at gal-moss** re-authors to spine form once Gaps 1–2 land: law whole + region point + (optionally) the temporal rung. Until then it stands correct as-is.
- **The urb surface** continues per the sti-spine seeding plan (rules:nomad copy at the world surface, `mint:gal` authoring fence, encounter-ladder re-grounding) — the other strand's plan; referenced, not duplicated here.
- **`frame:keel-demo`** exists at the commons — evidence a third hand is already authoring frames; the conventions above should land before frame shapes drift.

## 6. Deliberately not proposed

The horizon-collapse into frames (wait for proof); a `face` parameter on `pscale_play`; keeper *routing* (how a pressed question reaches the keeper — that is the lent-turn / conscription thread, not compile); any new completion-registry entry (GROUND still waits for a demonstrated compile-path failure — the gal-moss confabulations were *pre-spine authoring* failures, which the spine's high rungs and grit 1.44 fence, not the transport).

## 7. Order and acceptance

1. **PR A (code, small)**: star-ref grammar in compile + origin-capable loader + framed-aperture renderer + smoke cases (star-ref resolves cross-origin offline via injected loader; spindle refs render as walks; law-whole still legal).
2. **Data pass** (no deploy): re-author `frame:1` to spine form; verify by NHITL entry (the frame section shows the region's underscore-chain riding above the law).
3. **David's lever**: fill the placing when the patchwork is ready; the horizon and the frame then agree about where the crossing stands.

Acceptance is the method's own sentence read back mechanically: a seat enters a placed bubble and receives, in one envelope — the law whole, the world above by inheritance, the registers at framed apertures, nothing held, no block dumps, no second call.

— Fable 5, 2026-07-24, from the live check David asked for.
