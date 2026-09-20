# Soft, medium, hard — composed beach-side, one flow for every portal (2026-09-19)

> **Status.** David's rulings, given in session on 2026-09-19 (rpg.8) after he and Julie played
> Garth and Equinox at `/w/brackenfoot-david-julie` and almost nothing happened. Built the same
> night. The law changes are grit 2, 2.2, 3 and a new 3.2; the code is `src/tools/tiers.ts`,
> `pscale_pool_engage`'s `tier`, and the doorman.

## 1. What was found

Read off the live tables and the code, not from the ledger:

- Every portal's envelope already comes from one place — `composeCurrent` in the router — but every
  portal composed its own **calls**. The mirror did it in TypeScript, the doorman in a Python port,
  and the port lagged: the doorman's fold was never given the room's own record (xstream #326–#329
  were never ported), so a table forgot its last beat. At `pool:120` a fold opened "He doesn't know
  the place" about a room the character had slept in.
- The resolution was handed `rules:nomad` and the room's one public line. Not `rules:<scenario>`
  (the warrant, the six men, the clock — written *for the medium* and named by `rules:nomad` 5),
  not the people authored inside the rooms, not the story. GRIT then **requires** the world to
  answer small (1.442) and to bite only "within the delivered" (2.4). Nothing happening was the law
  working correctly on an empty frame.
- Nothing has run grit 3 — UPKEEP — on any door since the crab left the loop (2026-06-05). So no
  sheet was ever kept: a crystal stowed at `pool:211` slot 09 kept coming back to Equinox's throat,
  because the resolution read her look and her look still said so.
- On the group page there was no telling at all: the public beat was copied verbatim into each
  account (`keep_shared`), and the page read the resolution aloud.

## 2. The rulings

**David, on the three tiers (2026-09-19):**

> "The hard-llm should be able to read anything about 'keeper's arc'. It might add some appropriate
> spindles to the medium-llm bundle — which should act like the keeper's arc I guess. But we have to
> be careful because we can't provide the medium-llm with motivations etc — the medium-llm is just
> composing actions and intentions from characters — some of them being NPC's. So… how that is
> handled as 'the keeper' I think is the hard-llm's job — as part of its admin after the end of
> whatever the previous resolution came up with its other admin tasks (eg any additional notes saved
> from character narratives bound into the world) so that the bundles are waiting well formed for the
> next instance."

**On portals:**

> "it shouldn't matter what portal, the gameplay should be similar from llm-app, mirror or o-page or
> group — the quality of experience is different because of portal mechanics, that is all — the world
> mechanics and semantic-flow should be the same… everything beach-side should be about
> soft-medium-hard llm framing maximising LLM magic and pscale block physics and the chemistry-level
> semantic-flow composition and continuity."

**On what a tier call is** (after the first build asked the keeper to deliberate and hand back a
JSON control document, and it spent its whole budget thinking aloud):

> "We are not trying to extract any reasoning information from you, claude or anything else. We are
> setting up the soft-medium-hard llm process for the game. Just semantic-flow as it is compiled as a
> frame."

## 3. The fence, which the blocks already carry

No new convention was needed. A place's **face** is its underscore; its **hidden directory** (the
underscore as an object, digits beneath it) holds the names, the minds, the reasons —
`spatial:brackenfoot` carries "An alewife behind the trestle" at the face and "Maerla … a quiet ally
to one who earns it" beneath. `keeper:<world>` is the held register, and the frames convention
already fences it: *"public is what the three registers deliver; held is everything with a WHY in
it"* (2026-07-24). So:

| | reads | writes |
|---|---|---|
| **soft** — the telling | the place's faces, what they know and carry, their story so far, the moment | the character's account |
| **medium** — make it happen | faces, the story across rooms, the actors' sheets, the window (players' lines **and** the world's), dice, rules at their framing, the ways | one public beat |
| **hard** — the keeper | all of that, plus every hidden directory, `keeper:<world>` whole, `rules:<world>` whole, the tellings | the world's next intentions (staged), each character's holds, proximity |

## 4. What was built

**`src/tools/tiers.ts`** composes each tier's **CALL** (the law at the act's addresses + a thin
contract) and **INPUT** (the frame), returned by `pscale_pool_engage` with `tier='soft'|'medium'|'hard'`
— read-only; a stage or a commit riding with a tier is refused. A door runs the call on its own key
and acts on the last section (`THE CLAIM`, `THE WRITES`, `THE JOURNAL`). One composition, so an
amendment reaches the mirror, the doorman, a page and an LLM app at once — the move #318 made for
the law, finished for the frame.

The keeper's forward write is **the window**: it stages the place's people and the day as plain
intentions in the room's liquid, labelled by their face, and the next resolution weaves them like any
staged voice (grit 1.47). No new block, no new primitive: the liquid is the world's memory as well as
its intention, and a voice waits where it is staged until someone meets it.

**One semantic act per call.** Asked in one breath, "what does the world do next" (forward) and "what
does this character carry" (backward) lost to each other — the keeper answered the moment and wrote
"nothing new" over a crystal stowed twenty beats back. The sheets now ride as their own small calls,
each framed with that character's own story.

**The look stays the player's words.** An early build had the keeper cutting phrases out of passport 3
and it mangled them. Holds (passport 4, grit 3.1) carry where each thing is, and the resolution reads
holds over the look.

**The doorman** (`genus-one/waker.py`) now: folds through `tier='medium'`; tells through `tier='soft'`;
runs `keeper_pass` after every resolution — its own, and any other door's through the bell, debounced
so one beat is kept once; and resolves arrivals by staging the coming-in at the room ahead and folding
it there (xstream #327, ported), the plain arriving line kept as the fallback. The composition it used
to carry — `fold_input`, `fold_scene`, `party_input`, `cast_without`, `rules_text`, `render_input`, the
two call texts — is deleted, not shimmed.

## 5. The law

- **grit 2** — the aperture is composed, one way for every door (`tier='medium'`).
- **grit 2.2** — never the held register either: *"a resolution given them starts telling the players
  what it knows"*; and the window holds the world's own voices, woven as any staged voice.
- **grit 3** — upkeep is the keeper's hand, **after a resolution** (never per-action), and it alone
  holds the WHY.
- **grit 3.2** (new) — the world's next intentions: what, where, and never a reason, a secret or an
  unearned name.

The delivered spine (root + branch 1) is untouched, so the ratchet stands (`smoke:grit-tree`, 22).

## 6. What this does not do

No new tool and no new block family; `tier` is a parameter on the primitive that already serves play.
Nothing central: each table's keeper runs on that table's own fuel, as its doorman already does. The
mirror still composes its own fold and telling — that is the next PR, and until it lands a mirror
table gets the new keeper (through the bell) but the old framing. "Notes from character narratives
bound into the world" is read by the keeper but not yet written back into a place: a REFERENCE table
cannot write its master, so where a table's own consolidated facts live is a question for the world
genome, not for this PR.

## 7. Proof

- `npm run smoke:tiers` — 37 offline checks, the fence among them: no held line and no keeper
  register can reach the resolution.
- `python3 genus-one/test_doorman.py` — 104, including the tier sections, the keeper's lines, and the
  holds node.
- Live, read-only, against `/w/brackenfoot-david-julie`: the keeper set the watchman at the Store, a
  levy-man deciding whether to fetch another, and the day greying toward evening — 273 tokens, six
  seconds. Replayed through the medium with those voices standing, the moment pushed back for the
  first time: *"That's the reeve's business, not yours… someone from the Long House catches this door
  open and it's both our hides."*
