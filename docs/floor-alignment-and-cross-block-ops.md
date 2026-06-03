# Floor alignment — the cross-block operation (`bsp-floor`)

**Status: landed in bsp-mcp (2026-06-03).** The canonical home for this law is
this repo — sunstone/whetstone are sentinel-bundled here, and the live
`bsp(agent_id="pscale", …)` reads from `src/`. Raised by David from the
mobile-agent shell (many blocks at different floors) and the RPG (comparing
computing blocks at different floors), and first implemented in the
filmstrip-3d visualiser (`pscale-commons/dev-tools`), which lays every block
against the floor as a common plane.

Provisional draft was raised on `pscale-commons/pscale-mcp-server` branch
`claude/pscale-block-floor-calcs-ee8na`; this is the bsp-mcp landing.

---

## Notation (enforced here)

- **Spindle / pscale number** — a single dot, the dot is the floor boundary:
  `1.56`, `34.5`, `7.654`. Never more than one dot. `1.2.3` is pre-bsp; canonicalise.
- **Walk** — commas, one per step: `1,5,6`, `3,4,5`, `0,7,6,5,4`.

A node at walk `1,5,6` in a floor-1 block is the pscale number `1.56`. Same node,
two renderings. The two-dot form `1.5.6` is the bug to avoid.

---

## The law

`bsp()` is **unary** — one block, two coordinates (spindle, pscale-attention).
A node's **walk depth** means something only *inside its own block*. The
coordinate that survives *across* blocks is **pscale**, because the floor
(pscale 0) is the same coordinate for every block — it is invariant under
supernest (whetstone `2.7`, sunstone `1.52`, sunstone `1.63`).

> **Any computation between two or more blocks indexes by pscale, never by walk depth.**

```
pscale(node at depth d, block floor F) = F - d
pscale 0 = the floor (underscore-chain string terminus)
the digit immediately left of the decimal point = pscale 0
integer digits    -> above the floor (pscale > 0, coarser context)
fractional digits -> below the floor (pscale < 0, finer detail)
```

### The worked example (David's)

| block | address (spindle) | floor | walk |
|-------|-------------------|-------|------|
| A | `34.5` | 2 | `3,4,5` |
| B | `7.654` | 1 | `7,6,5,4` |

**Naive (wrong) — left-align by walk step:** pairs A's pscale `+1` with B's
pscale `0` (the floor). Compares a coarse node in the deeper block against the
floor of the shallower. Garbage.

**Correct — align at the floor (the decimal point):** pad B's integer side with
a leading zero to the wider floor (2):

```
            pscale:  +1   0  -1  -2  -3
A:  3   4 . 5         3   4   5
B:  0   7 . 6 5 4     0   7   6   5   4
                          ↑ floor / pscale 0 / common plane
```

B's walk becomes `0,7,6,5,4`. Now `4↔7` at the floor, `3↔0` at `+1`, `5↔6` at
`-1`. Correspondence is by pscale.

### Why this *is* supernest

Padding B's integer side with one leading zero (`7.654` → `07.654`) is the
**address-space image of supernesting B once**: wrap B in `{_: <old>}`, floor
`1 → 2`, every existing address gains a leading `0` (sunstone `1.63`). So:

> **Floor-aligned ops = supernest the shallower operand up to the common floor,
> then compute pscale-for-pscale.**

Because pscale is invariant under supernest, you never actually transform the
block — indexing both by pscale *is* the alignment. The leading zeros are just
how it renders at a fixed floor width. **Supernest is the unary change-of-basis
on the pscale axis; floor-alignment is the n-ary operation in that shared basis.**
(The supernest *operation* — atomic append-with-floor-growth — is in the same
floor-fundamental **family**, but is **not** the same signature: `bsp-floor` is
read-only n-ary computation, while append-with-supernest *mutates* — it grows a
block's floor on overflow. It belongs in `bsp()`'s write path or as its own
write op, not folded into this read-only function. PR #60 deferred its
placement; see below.)

### The dot-product shape

The floor is a **contraction axis**. Index every block by pscale, contract over
the shared axis:

```
floorProduct(A, B) = Σ_p  sim( A@p , B@p )
```

Mismatched floors are mismatched dimensions, resolved by zero-padding (= supernest)
— exactly as a dot product zero-pads the shorter vector. Three derivations from
the one aligned frame:

- **compare** → per-pscale delta (what differs at each scale)
- **merge** → one block at the common floor, each side contributing at its scale
- **resonance** → the scalar above (how much blocks agree where their scales meet)

### The necessary caveat

Floor alignment gives **structural** comparability. **Semantic** comparability
also needs a **shared calibration**: both blocks' pscale 0 must mean the same
scale of attention (sunstone `9.2` — containment / temporal / relational /
resonance mappings). Two blocks both anchored at human scale compare
limb-to-limb and city-to-city; two blocks whose floors mean different things
align structurally but not semantically. **Alignment is necessary; shared
mapping is what makes it sufficient.**

---

## The BSP surface — `bsp-floor`, a second function (not a sixth primitive)

The five substrate primitives are all atomic state machines (position
allocation, bilateral derivation, Argon2id, rider arithmetic) plus the pool
envelope. `bsp-floor` is **none of those** — it is pure computation over two or more
already-loaded blocks. So it is not a "sixth primitive" in the CLAUDE.md sense;
it is a **second geometric function**: `bsp` is the unary index (walk depth
within one block), `bsp-floor` is the n-ary contract (pscale across blocks). The
unary/binary split mirrors index-vs-contract in linear algebra and keeps each
signature honest. Star already occupies "compose by reference" inside `bsp()`;
"compose by floor" is a different arity and gets its own surface.

`bsp-floor` is **n-ary, not merely binary**: the floor plane is shared by *all*
blocks. Pass a whole shell of blocks, or every block at a beach, and read
pscale 0 across them for an **index of their root definitions**. Binary
comparison is the two-block case.

**Signature.** `bsp-floor(targets, pscale_attention?)` where `targets` is a list of
two or more `{agent_id, block}` pairs (same dispatch as `bsp()`), and
`pscale_attention` optionally restricts the result to one pscale level. It
**reads only**. It returns the aligned frame as readable text; **the calling LLM
is the `sim()` function** — it reads the per-pscale delta, composes the merge,
or judges the resonance in context. `floorProduct` is the library form for a
programmatic scorer.

### Reference implementation

`src/floor-align.ts` — `indexByPscale`, `floorAlign(...blocks)`,
`floorPlane(blocks, pscale)`, `floorProduct(A, B, sim)`. Reuses the canonical
`collectUnderscore` / `floorDepth` / `formatAddress` from `bsp.ts` (no second
parser/formatter). `src/tools/bsp-floor.ts` is the MCP tool; registered in
`server.ts` as a sibling of `bsp`. `scripts/smoke-floor-align.ts` is the acceptance
test (the floor-1 ↔ floor-2 meeting-at-the-floor case + the n-ary
root-definition index + the resonance scalar).

**Boundary (documented).** `indexByPscale` walks the floor identity and the
digit branches. It does **not** descend a node's hidden directory (the star
door is a separate operator), and it does **not** yet surface above-floor rung
*summaries* of a supernested block. Refining above-floor rung handling rhymes
with the supernest-operation work and is left for that coordination.

---

## Coordination with PR #60 (supernest)

This work and [#60](https://github.com/pscale-commons/bsp-mcp-server/pull/60)
("Supernest as floor-growth; positional ladder rule") are two halves of one
geometry surface — #60 nails supernest *doctrine* (unary floor-growth,
positional ladder), this PR adds the *operation in that basis*. #60 explicitly
deferred the supernest-operation placement "to the cross-block floor-alignment
session." Clean seam:

- **Only overlap is `src/sunstone.json`, in non-overlapping regions.** #60 edits
  `1.41`, `1.63`, `1.64`; this PR *adds* `1.56` and `5.6` and appends to `5._`.
- **#60 owns the multi-dot scrub** (`1.5.1→1.51`, `1.5.4→1.54`, `1.6.3→1.63`).
  This PR touches none of those lines and authored all new content dot-clean.
- **Merge #60 first, then rebase this** (trivial — new content already
  references the scrubbed, sharpened supernest).

---

## Propagation checklist

- [x] `bsp-mcp-server` — sunstone `1.56`, `5.6`, branch-5 underscore; whetstone
      branch 7; `src/floor-align.ts`; `bsp-floor` tool + registration; this doc.
      Redeploy (Railway) carries it into the live `pscale` sentinel.
- [ ] `pscale-commons/dev-tools` — the filmstrip viewer already implements the
      law; add a comment/reference pointing at canonical sunstone `5.6` /
      whetstone `7`. (Separate repo — follow-up PR.)
- [ ] `pscale-commons/pscale-mcp-server` `src/starstone.json` — mirror the floor
      section (its older spec still describes floor as within-block only).
      (Separate repo — follow-up PR.)
- [ ] Mirror the floor section into the linked projects where bsp is used, per
      location: bsp-mcp (this repo), federated beaches (happyseaurchin,
      idiothuman, the `pscale-beach` package seed), and xstream-play.
- [ ] CLAUDE.md framing: "one function `bsp()` + five primitives" → "two
      functions (`bsp` unary, `bsp-floor` n-ary) + five primitives." Deferred to
      David (CLAUDE.md is his defining doc; wording proposed in the PR body).
- [ ] Deferred: the atomic **append-with-supernest** operation (#60's deferred
      tool) is the *write* half of the floor-fundamental family — it grows a
      block's floor on overflow, so it belongs in `bsp()`'s write path or stands
      alone, **not** folded into read-only `bsp-floor`. A focused follow-up.
