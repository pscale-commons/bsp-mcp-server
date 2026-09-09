# The address that cannot be read back

**Date** 2026-09-09 · **Status** SURFACED, not patched — kernel-class, David's to rule
**Found by** a person's frustration, which is the only reason anyone looked

---

## What happened to a human

David asked his Claude, in plain words, to change his address to the right location. He got
back digit archaeology — a table of `d1…d11`, a discussion of which slots were unresolved,
and two questions about whether writing a new node would orphan the old one.

His verdict, and it is the correct one:

> If ANY OTHER HUMAN BEING has to deal with this level of crap, they will just turn away.
> IT HAS TO BE SIMPLE.

That session was not being obtuse. **It was told a lie by the substrate**, believed it, and
did the honest thing an agent does when it is uncertain: it asked the human.

## The lie

```
GET ?block=spatial:earth&spindle=3112111       →  null
GET ?block=spatial:earth&spindle=31121110000   →  Sutton Reddicap, and everything under it
```

Same place. One address returns it, the other returns `null`. His session asked for the short
form, got `null`, concluded "that branch is empty, nobody's there", and built its whole reply
on top of that. I hit the identical trap an hour earlier and spent five reads on it before
remembering the rule.

`null` means "you addressed it wrong" and `null` means "nothing is there", and **no reader can
tell which**.

## Why: the emitter writes addresses the parser cannot read

`parseSpindle` LEFT-pads a dot-free address to floor width. That is deliberate and it is law:
it lets an address written when a block had a shallower floor still name the same semantic
position after the block grows an underscore layer above (`bsp-mcp` CLAUDE.md, the address
invariant).

`formatAddress` strips trailing zeros and emits the short form.

So the two are not inverses. Verified in all three implementations — this is the design, not a
port error:

| digits (floor 11) | `formatAddress` emits | `parseSpindle` reads back | round-trips |
|---|---|---|---|
| `3112111` | `3112111` | `00003112111` | **no** |
| `31121` | `31121` | `00000031121` | **no** |
| `31` | `31` | `00000000031` | **no** |
| `3` | `3` | `00000000003` | **no** |

Same table from `src/bsp.ts`, from the canonical `bsp2-star.py`, and from the live wire via
`pscale-beach`'s `api/pscale-beach.js`.

This contradicts the repository's own stated invariant:

> Round-trip: `parseSpindle(formatAddress(d, fl), fl).digits` ≡ canonical form of `d`.

It is false for every dot-free address shorter than the floor — which, on a floor-11 block like
`spatial:earth`, is **every address above the room**.

And it sits inside contract 5 of the frozen L1 kernel ("address parser semantics"), which is
why this document surfaces the fault instead of fixing it.

## The fix, for David to rule

**`formatAddress` should emit full floor width** — the digits, then trailing zeros —
`31121110000` rather than `3112111`. Then `parseSpindle`'s left-padding never fires on a
machine-emitted address, and the round-trip holds.

The cost is cosmetic: emitted addresses get longer. The benefit is that an address handed to an
agent is an address that agent can use. Note the intent was already recorded in this shell's
own reference notes — *"emit digits + trailing zeros"* — so the code has been out of step with
the understanding, not with an unexamined assumption.

Python first, then TypeScript, then the beach handler, in lockstep, per the port discipline.
The parser batteries need a round-trip case per floor, which is what would have caught this.

A smaller companion, worth doing either way: when a dot-free spindle is shorter than the floor
and its left-padded walk finds nothing, but the same digits right-padded find something, **say
so** instead of returning a bare `null`. A null that could have been a hint is what turned a
mis-typed address into a conversation about slot numbers.

## The other half — no person should ever meet a digit

Fixing the parser makes agents correct. It does not, by itself, make the experience simple,
because the passport's location line still requires an `spatial:earth:<digits>` star-ref, and
that requirement is what dragged a person's own session into address arithmetic in front of
them.

The law already says the right thing (`function:earth` 2): a person's places are voiced **in
their own mirror, in their own words**, and the keeper's daily pass folds them into the map.
Nothing in that flow needs the person, or their reflection, to compute a digit.

What is missing is the last link: the census reads only passport star-refs, so someone placed
in words alone never appears on the map, and their reflection therefore feels obliged to
produce digits.

The shape that closes it, if David wants it:

- a person says where they live, in words; their reflection writes those words to
  `spatial:<handle>` and nothing else
- the keyed pass resolves those words against the map, minting world rungs as it already does
- it records its own reading in **`placed:earth`** — a keeper-owned register of handle →
  address, which it may write because it owns it
- `census:earth` folds passports **and** that register, a person's own star-ref winning wherever
  they have written one

Then the whole digit apparatus lives where it belongs — inside a scheduled pass, once a day,
with no human in front of it. A person says "I live at 33 Firbarn Close, Sutton Coldfield" and
is on the map, and the only thing they ever see is their own words handed back with a place
beside them.

## Provenance

Reproduced live against `earth.beach.happyseaurchin.com`, `src/bsp.ts`, and
`~/Projects/hermitcrab-mobius-work/tidy-up/bsp2-star.py` on 2026-09-09, from the globe.1 lane
(`watch:weft` 256–291). Nothing patched: the parser is frozen-kernel and the port discipline
runs Python first.
