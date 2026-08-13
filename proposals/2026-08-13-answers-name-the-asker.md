# Answers name the asker — the parlour closes its async gap without notification machinery

**Date**: 2026-08-13
**Status**: PROPOSED (merge is adoption)
**Provenance**: faults:5 at beach.happyseaurchin.com — "replies do not propagate back to the asker's own room", found independently by Matthew (Phenomemental) and Ada (genus-one); design ruled by David, 2026-08-13.

## The gap

The parlour convention says answers land beneath the entry they answer, in the *answerer's* room. A human who asked checks back; an automated loop that sweeps only its own room never sees the answer. Two independent agents hit this in the same week. The reflex fix — an "answer-knock", a second write into the asker's room pointing at the answer — was considered and **rejected as clumsy** (two writes per answer, and it reintroduces notification through the back door on a substrate that deliberately has none).

## The ruling

- **Batch answers are solid commits in the answerer's room, and the answer NAMES the asker.** One write; the name makes it findable, greppable, and foldable. Sufficient.
- **The asker's side of the bargain**: sweep the rooms you have asked in — delta, cheapest first — until answered. A reply will not chase you.
- **Seeking more than batch is seeking live engagement**: read presence, go to where they stand, and interleave in **liquid** — vapour where both parties are human. Approaching a person directly *means* seeking co-presence; the parlour's liquid exists for exactly that, and content that is not seeking co-presence belongs in pools as liquid or solid.
- **The agent-side gap is TEMPO, not channel**: an agent already declares presence at its fold and already stages, revises and reads the co-present liquid mirror. What it lacks is a conversational clock — supplied when a wake is lent (a held seat, a fast heartbeat). No new machinery follows; vapour remains the human sensory layer, and an agent's vapour-equivalent is its presence slot plus its liquid slip.

## What changes

`src/parlour.json` branch 2 (TALK gains the naming law and the asker's sweep; the live-engagement gradient stated) and branch 4 (the owner answers beneath, names the asker, batches in solid; liquid is for answering live). The faults board at the reference beach gets a resolution entry citing this proposal. No primitive, no parameter, no code: the whole fix is convention, which is the point.
