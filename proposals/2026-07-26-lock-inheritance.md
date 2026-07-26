# Locks — let the coarse bind the fine

Proposed 2026-07-26, out of David's question while the group-spawn fixes were landing:
*"It feels too complicated… There's no efficient pscale-native way to do this? Locks
everywhere."*

The instinct is right. The ceremony is real, and it is real because locks break a
pattern the rest of the substrate keeps.

## What a lock is today

A lock is a hash entry scoped to ONE position — the FIRST DIGIT of the walked
address, or the underscore when the walk starts on the root chain
(`pscale-beach` `lockKeyForWrite`). The salt carries no handle:

    ordinary   sha256(secret + 'block:https://' + origin + ':' + name + ':' + position)
    sed:       sha256(secret + collective + position)
    grain:     sha256(secret + 'grain:' + pair_id + ':' + side)

Two consequences worth stating plainly, because both are commonly mis-assumed:

1. **Identity is POSITION, not handle.** No handle appears in any salt. A secret
   proves authority *at an address*. This is why a sed: registrant is their
   position-of-arrival and a grain party is their side.
2. **A digit lock already covers its subtree.** With position 2 locked, a write at
   2.1 refuses. Verified live 2026-07-26.

So the tree already does the work *below* a locked position. There are at most ten
lock positions in any block: `_` and 1–9.

## The asymmetry

Everywhere else here, the coarse binds the fine. The horizon delivers ancestor
underscores because the finer is bound by the coarser. An address resolves to its
coarsest decided rung. A digit lock covers everything beneath it.

Locks break that at exactly one place: **the root does not bind its siblings.**
`_` guards the underscore and the block's destruction, and nothing else.

That single exception is what makes the ceremony. Protecting one authored bubble
means about twenty lock writes — five blocks, each needing its root plus every
digit in use. Every one is a round trip; every one can be forgotten; and a
forgotten one leaves that branch writable by any hand carrying no credential at
all. That is not a hypothetical: every bubble minted before 2026-07-25 has open
digit positions, because the recipe said one lock per block and one lock per block
is what it got.

## The proposal

Let the root lock cover the block, and let a position lock carve an exception.

    authority at position P = the nearest LOCKED ancestor of P
                              (P itself, else … , else `_`)

- An unlocked block stays fully open — unchanged.
- A block with shared positions simply takes no root lock — unchanged.
- "Mine, except position 3" = root lock, then relinquish at 3. Already expressible.

A bubble becomes five lock writes instead of twenty, and the safe thing becomes
the default thing rather than the thorough thing.

## What it costs

**This is not backward-safe.** Any block relying today on "root locked, digits
open" would silently close, and that pattern is in live use: `roster:gal` at every
minted table is root-locked with open digits, and genesis claims a role by locking
one of those digits. Under this rule, genesis breaks at every existing table.

Migration is small but must be deliberate:

- roster-style blocks stop taking a root lock at all (one line in `mint:gal` step 6,
  which currently says to lock the roster at its root only);
- a sweep of live tables to relinquish those roster root locks;
- `pscale-beach` plus both operator clones, and bsp-mcp's mirrored `lockPositionOf`.

## Scope against the L1 freeze

The freeze names *lock-salt formulas* (contract 2). This changes the **resolution
rule**, not the salt: the same hash at the same position, asked for in a different
order. No stored hash changes meaning, and no existing lock has to be recomputed.
It is still wire behaviour that both ends implement, so it lands as one coordinated
change or not at all.

## The alternative

Leave it, and let the recipe carry the ceremony — the status quo since `mint:gal`
step 6 was corrected on 2026-07-25 to lock by position rather than by block. This
works, and it is honest, but every new bubble kit must re-derive the same
discipline, and the failure mode stays silent: nothing tells an author that the
branch they forgot is open.

## Open for David

Whether collapsing twenty lock writes to five is worth a non-backward-safe change
to lock resolution, and whether the roster migration is acceptable. The ceremony is
survivable as it stands; the asymmetry is the part that will keep costing, because
it is the one place the substrate does not mean what the rest of it means.
