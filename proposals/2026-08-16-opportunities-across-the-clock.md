# Opportunities across the clock — the cross-project today (2026-08-16)

**Status: proposed by David (happyseaurchin) in session, 2026-08-16, for a NEW SESSION to
take up. This file is the handover: the idea in his words, why the substrate already
carries it, the shape recommended, the first slice, and the questions only he can close.**

## The idea, in the keeper's words

> "What if people created their projects like i have with beach-venture, by time, and
> they all adopt the same pscale temporal structure? Wouldn't this mean that I could
> view all the spine content for today — AND potentially all the mirrors? I could
> literally collate ALL today's intention across all projects. An AI could do sweeps to
> find out what correlates — literally same thing in similar places, or similar things
> across different locations — and generate potential collaborative opportunities. Not
> just in relation to a project, but across projects. I could view potential
> opportunities today. And similar things across projects — where an llm could do melds
> between entire project blocks and provide opportunities for alignment. I guess we
> should call this /opportunities."

## Why the substrate already carries it

Nothing new is needed at the physics or chemistry level — this is the payoff of three
standing decisions:

1. **The sundial is the shared coordinate system.** A clock family (floor-10 spine,
   address IS the date — function:backcast, pscale:sundial) is address-aligned with
   every other clock family BY CONSTRUCTION. Today's digits are the same digits in
   every one. "All spines at today" is one targeted read per family, not a search.
2. **`bsp-floor()` is the cross-block fold.** The n-ary primitive already indexes
   across blocks BY PSCALE, never by walk depth (whetstone:7). Folding N spines and
   M mirrors at one temporal address is what it is for. (Note its one limit: it
   cannot enumerate across zero rungs, so temporal folds go BY HORIZON ADDRESS —
   read each family at the same spindle — exactly as the venture already does.)
3. **The fold law generalises.** A snapshot (every voice at the address, concatenated,
   attributed) needs no LLM; a synthesis is what a MIND makes of it, no two need
   agree, and where a kept one lands is already settled (tree:V:<handle> personal,
   bare V collective — proposals/2026-08-15-personal-tree-and-fold-homes.md). An
   opportunity IS a synthesis whose snapshot happens to span families.

Detection is also solved: the /walk page already reads a family's MODE off its spine's
own shape (floor 10 = clock). The set "every clock family at this beach" is computable
from the index plus one floor probe each.

## The recommended shape

**`/opportunities` — the page.** Two halves:

- **The cross-project today** (the read): every clock family's spine voicing at today
  (and this week), with every mirror's voicing at the same address, collated and
  attributed — the SNAPSHOT across projects. No storage; computed at load exactly
  like the walk. Same for coarser rungs by tap (the temporal-ladder pattern from the
  dashboard morning).
- **The opportunities family** (the keep): `spine:opportunities` founded ON THE CLOCK,
  with mirrors `opportunities:<handle>` sovereign as ever. An opportunity is voiced at
  the day it is seen, in the seer's OWN mirror, and NAMES the families and addresses
  it correlates in plain words (named-reference bonds — ways:deck 2.5's law: the
  pointing block declares, the pointed-at never point back). The bare `opportunities`
  tree holds endorsed ones, supersedable, per the standard fold law. This makes
  /opportunities itself just a walk of one more family — no new page machinery beyond
  the cross-project read at the top.

**The AI sweep.** Four correlation kinds, in rising cost:
- (a) **temporal resonance** — kindred intent voiced at the SAME address across
  families (cheap: the collated snapshot, read by a mind);
- (b) **semantic proximity** — similar content at different addresses/families
  (needs an LLM pass over the snapshot);
- (c) **complementarity** — one hand's need against another's offer (passport
  offers/needs at positions 1/2 are the standing vocabulary for this);
- (d) **whole-project melds** — two spines folded rung-by-rung at matching pscales
  (bsp-floor by horizon address) and read for alignment.

The sweep is a MIND's act, never a matching engine: an opportunity lands as a
PROPOSAL in the sweeper's own mirror, and adoption belongs to the humans named —
the SAND lesson (deliberate opt-in, never blanket) applies whole. Weft's evening
wake can grow an opportunities pass (0–2 voicings, the brevity law and the location
law both apply verbatim), but the FIRST sweeps should be run by hand from a
claude-ai session to learn what a good opportunity voicing even looks like,
before any automation.

## The first slice (one session's work)

1. Found `spine:opportunities` on the clock (keeper: David's word needed — see below)
   with its operator `function:opportunities` (forked in spirit from
   function:beach-venture; the register law and mirror-proposal move carry whole).
2. Build /opportunities read side: enumerate clock families (index + floor probe),
   read each spine + mirrors at today/this week, collate attributed; below it, the
   opportunities family at today (voices + the tree), reusing walk components.
3. Run ONE sweep by hand in-session (kinds a+c first), voice 1–2 real opportunities
   at opportunities:weft, and judge the result with David before any routine grows
   the pass.

## Questions only David can close

- Who keeps `spine:opportunities` (his key from birth, or designer-lane weft
  rotatable, as the venture's law was)?
- Should /found gain a "venture on the clock" template so new projects adopt the
  sundial in one act (the adoption path this whole idea depends on)?
- Do opportunity voicings ever notify the named parties (SAND riders on grains), or
  stay pull-only until asked for?

## Pointers for the cold session

Blocks: `function:backcast`, `function:beach-venture`, `ways:deck` 9 (the molecule
law), `tree` 8, `pscale://whetstone` 7 (floor-alignment). Code: happyseaurchin-home
`walk.html` (MODE detection, rack, sheet), `morning.html` (the dashboard bands,
collage), bsp-mcp `src/tools/bsp-floor.ts` and `stream.ts`. Recent record: the
2026-08-13→16 arc in happyseaurchin-home PRs #95–#107 and bsp-mcp #279. The live
proof that cross-family reading pays: the dashboard morning's temporal ladder — this
proposal is that ladder widened from one family to all of them.
