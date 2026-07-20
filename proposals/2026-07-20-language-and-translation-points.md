# Language — the translation points, and why almost nothing needs building

**Date**: 2026-07-20 · **Status**: PROPOSED · **Origin**: David Pinto — "can the RPG be played in a different language, and does the substrate have to be in it?"

## The question

Can an RPG on this substrate be played in Japanese? Is translation an LLM-app concern (substrate stays English, the medium renders in the player's language), or must the block content itself be in the player's language?

## The finding

**Pscale has no natural language in its key space.** Every key is `_` or `1`–`9`. A conventional system carries English in its schema — `{"name":…, "description":…, "difficulty":…}` — so translating it means either translating keys and breaking every reader, or maintaining a label table alongside. Neither problem exists here. The structure is language-free by construction, which is the same property that makes a block self-describing.

That collapses the question to: which *prose* is language-bearing, and which of it is shared.

## The four layers

| Layer | Example | Language-bearing? |
|---|---|---|
| **Geometry** | `4.26`, floors, pscale, the walk | No. `4.26` is `4.26` in any script. |
| **Protocol identifiers** | `passport:`, `frame:`, `sed:`, liquid at 1 / solid at 2 / history at 3 | No — wire tokens that merely look like English, as `Content-Type` does. Never translate them. A Japanese table still writes `frame:酒場-1`. |
| **Mechanical values** | difficulty 5, bands 10/5/0/−5/−10, exploding d10, CF+SF+dice−difficulty | No. `rules:nomad`'s skeleton survives translation wholly intact. |
| **Prose** | underscores, leaf strings, canon statements, what a player types | **Yes — and only this.** |

## The rule

Four sentences carry the whole design:

1. **A world declares one canon language.**
2. **Writes to shared positions normalise to it.**
3. **Reads render freely into the reader's language.**
4. **Proper nouns are pinned at their addresses, so the rendering is stable.**

Read is free; write normalises. The asymmetry is the point, and it is the same asymmetry the substrate already runs between liquid and solid.

### What "shared" means

Not English-vs-Japanese — **private vs shared**. A position is shared if someone who did not write it is bound by it.

**Free — render in the player's language, no substrate change:**
everything a player reads (rules, teaching blocks, NPC dialogue, scene narration) and everything they write that binds no one else — their own history, their character's rendered narrative, their liquid contributions, vapour.

**Normalised on write — three positions only:**

- **World canon in `sed:`.** The sedimentary guarantee is *first to declare holds that position permanently*. Let two players declare the same fact in two languages and you do not have one world; you have two overlapping worlds that cannot see each other, and no reader's LLM can know that entry 3 and entry 7 are the same fact. Translation-at-read cannot repair this. Normalising on write does, completely.
- **The public event-skeleton** (`rules:nomad:5`). One skeleton to the room pool; each character renders their own narrative from it. Mixed-language skeletons in one pool half-work, degrade, and the degradation is unmeasurable.
- **Proper nouns.** Prose can be paraphrased; names cannot. If Thornkeep is ソーンキープ in one session and 茨の砦 in the next, the world fragments — and it fragments *within* a single language too. Pinning the label at the place's address makes the render deterministic instead of improvised per session.

## Realisation — nothing new is built

`rules:nomad:5` already states the architecture: **one shared event-skeleton → each character renders their own narrative into their own history.** The skeleton is the pinned join; the rendering is per-reader. It was designed for perception scoping and it solves language for free. The only change is to make explicit what is already implied — the skeleton is language-pinned, the rendering is not.

For canon variants, the mechanism is the `tree` mirror pattern unchanged: `rules:nomad` and `rules:nomad:ja` at self-same addresses, so a fact's identity is the address `1`, never the wording; `bsp-floor` already folds by address rather than walk depth. For place and character names, they are already positions on the spatial skeleton (`identity:earth`, place-coordinate → digit fans) — the address is canonical, the label is a rendered facet at it.

Nothing above requires new machinery. It requires saying which existing machinery applies.

## What must NOT grow

- **No new `bsp()` parameter.** Language is not a twelfth argument. It is a render property, and it belongs where register already lives — `soft-agent:3` (STYLE), which currently reads "match the conversational register of what {user} typed." Language is the same instruction one notch out.
- **No seventh primitive.** No state machine, no envelope.
- **No new sentinel.** The substrate-truth here is a *pointer*; the policy is per-community and belongs at a beach, exactly as the library does.
- **No persisted locale field.** The soft-agent matches the language the user typed, as it already matches register — stateless, zero substrate change. Agent wakes with no live human (genus-one, crabs) carry it in shell prose, where purpose and conditions already sit.

## Failure mode to actually fear

**Round-trip drift.** English canon → Japanese play → solid committed in Japanese → next session translates back → drift. Over a long-running world the *record* erodes, defeating the point of having a solid. This is the real argument for normalising the skeleton even while leaving narration free — and it applies to a monolingual table too, only more slowly.

## The product claim

This does not give "the RPG in Japanese." Because the join is structural rather than lexical, it gives **one table, many languages** — two players at the same scene, each reading and writing in their own, sharing a world through the addresses. That falls out of the geometry rather than being built, and no other RPG platform can do it.

## Implementation

Zero code. Three block writes and one empirical check.

**Fan constraints, checked against live blocks:**

| Target | Current fan | Legal move |
|---|---|---|
| `block-conventions` | **full 1–9** | no new branch — pointer inside branch 8 (the cross-reference index, which exists for exactly this) |
| `rpg` | **full 1–9** | no new branch — lands at `3.4`, under world canon (branch 3 holds 1–3) |
| `rules:nomad` | 1–5 | room at `6` |
| `soft-agent:3` | 1–3 | room at `3.4` |

**LANDED 2026-07-20.** One correction on the way in: `conventions:language` was a malformed block name — under the role-with-handle convention it reads as "conventions for the handle *language*". The substance is a **branch inside** the beach's `conventions` block, which `8.4` already documented.

| Where | What | Surface |
|---|---|---|
| `conventions:1` (fanned 1–6) | the substantive convention — four layers, the rule, the private/shared line, proper-noun pinning, the mirror pattern, the declaration site | beach (block created; the beach's first `conventions`) |
| `block-conventions:8.4.1` | pointer to it | repo sentinel |
| `soft-agent:3.4` | match the language {user} wrote in, as register is matched at 3.3 | repo sentinel |
| `rules:nomad:6` | the skeleton is language-pinned; each character's rendering is free | beach |
| `rpg:3.4` | a world declares its canon language; canon writes normalise to it | beach |
| `rules:nomad:ja` | the worked mirror example, and the CJK proof | beach |

**Acceptance check — PASSED end-to-end 2026-07-20.** `validateShape` (`api/pscale-beach.js`) tests *keys* against `_` and `/^[1-9]$/`, and rejects a *value* only when it is a string that parses as a JSON object or array; no code path in the gate or the walker inspects value language. Confirmed live by writing `rules:nomad:ja` — Japanese at the root underscore, at a depth-1 leaf, and nested at depth 2 (`4.1`). Whole-block read-back byte-identical; the nested walk returned `10超 — 圧倒的。望んだ以上のものが、さらに先まで届く。` intact; no mojibake anywhere. The block doubles as the worked mirror example for `conventions:1.5` — a partial demonstration translation, explicitly marked in its own underscore as awaiting a native-speaker pass.

One cosmetic residue, pre-existing and not blocking: the disc/path-walk preview truncates with `s.slice(0, 150)` (`src/bsp-fn.ts:591`), which counts UTF-16 code units. CJK sits in the BMP so it is safe — and 150 code units of Japanese in fact carries appreciably more meaning than 150 of English, so previews get *better*, not worse. Characters outside the BMP (emoji, already common in marks) can have a surrogate pair split at the boundary. Tracked separately.

## Incidental finding — the RPG blocks are anonymously writable

Probing lock state during this work (David-directed): a keyless write appending `[test]` to a live position was accepted at `conventions:1.1`, `rules:nomad:2`, and `rpg:3.1`. All three restored byte-identically from copies taken before the write, verified by read-back rather than by transcription.

The significant part is not the new entries but **`rules:nomad:2` and `rpg:3.1` — pre-existing content.** The RPG's resolution mechanics and design block accept anonymous overwrite on the public beach. This sits oddly against the EARTH precedent (2026-07-16), where David ruled that only his steward key or Weft's may lock anything and the world machinery came to Weft — `rules:earth` was locked accordingly; `rules:nomad` apparently never was.

**RESOLVED 2026-07-20.** Both blocks *were* locked — but only at `_`, the per-position bite: a whole-block write with `new_lock` locks the root underscore and leaves digits 1–9 open. Reading the KV lock keys directly (namespace `pscale-beach-v2:beach.happyseaurchin.com:locks:<block>` — origin **without** scheme) and hash-matching offline against known keys identified each root lock without any write: `rpg:_` under the steward key, `rules:nomad:_` under `thorn142` (the Thornwood GM key, from when the rules were authored). Method validated against `lighthouse` (steward, all slots).

Locks then set per David's instruction and verified by hash-match + a keyless-rewrite enforcement probe (403):

| Block | Locked slots after | Under |
|---|---|---|
| `rpg` | `_`, `3` | steward |
| `rules:nomad` | `_`, `1`, `2`, `3`, `4`, `5`, `6` | `thorn142` |
| `conventions` | `_`, `1`–`9` (fully sealed) | steward |
| `rules:nomad:ja` | `_`, `1`–`9` (fully sealed) | `thorn142` |

Two residues, deliberate: `rpg` digits 1,2,4–9 stay open (David scoped the lock to branch 3, which lock-granularity — first-digit — covers wholesale, so `3.1`–`3.4` are one slot); and `rules:nomad` positions 7–9 stay open (empty; David named digits 1–5). Neither is an exposure of existing content; both are noted so a later pass is a decision, not a surprise. The broader audit across all 251 blocks remains chipped.

## Open questions

- ~~**Canon-language declaration site.**~~ RESOLVED 2026-07-20 (David): the world's canon `sed:` at position 9 — the governance fold, where a `sed:` block holds governance rather than a registrant, matching the payway config pattern at `sed:genus-hatch:9`. Recorded at `conventions:1.6`. Note for whoever applies it: `genus-hatch` fans its payway fields flat directly under 9, so a collective carrying both concerns should give each its own digit beneath rather than extending that flat fan. **Not applied to any live world** — the main beach hosts no canon collective (`rpg:3.1` names `sed:thornkeep-canon`, which does not exist there); the worlds live at their own sub-beaches, so the declaration lands per world, there.
- **Mirror variants: when?** `rules:nomad:ja` is right for a world with a standing bilingual table. For a single Japanese player at an English table, render-on-read is sufficient and a mirror is overhead. No rule proposed; noted so it is a decision rather than a drift.
- **Does the medium reliably normalise on write?** The rule is only as good as the soft-LLM honouring it. Worth one NHITL round with a deliberately Japanese-speaking player against an English canon, watching whether canon writes land normalised.

## Path to canon

Live first as `conventions:language` on beach.happyseaurchin.com with the pointer from `block-conventions:8`. If it proves out across the RPG, xstream, and agent shells — it is not RPG-specific; the private/shared axis governs shells, pools, and marks identically — promote to a branch in `block-conventions` at the next supernest, or to a sentinel if the surface earns it.
