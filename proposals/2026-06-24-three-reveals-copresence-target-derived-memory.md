# Three reveals — co-presence, target, derived memory

> Not fixes for what's broken — *reveals* of how three existing blocks already hold what
> we need, surfaced so the emergent play comes out right. Each maximises a block's use; none
> adds a mechanism.

**Status:** PROPOSED 2026-06-24, for David's confirm before the changes. **Evidence:** the first
two-machine play of `thousand-valleys` (Orvel + Tessavar, 9 pool beats, live on the beach).

---

## What the play showed

The characters **met and held a real conversation** — Orvel called out, Tessavar crossed over,
they exchanged names *in-fiction* (beats 4–5), traded the herd / lights / gather-stone threads.
**Fog held** (Tessavar saw "the stocky older figure" until Orvel named himself). The public layer
is doing its job.

But the data exposes **three layers of "what happened," and only the middle one is solid:**

| layer | what it is | state |
|---|---|---|
| **ephemeral render** | what each player's Claude *showed in chat* | richest — **not in the substrate** |
| **public pool** | committed terse facts | the shared truth — **reliable** (9 ordered beats) |
| **private bookkeeping** (`witnessed`, `knows`) | the character's narrative + earned names | **discretionary, inconsistent** |

Proof, from the blocks:
- **Maret's reply about Dav is in NONE of the substrate.** `witnessed:orvel` shows Orvel *asking*
  and *waiting*; the reply never reached the pool (private NPC talk) or his journal. It lived only
  in the chat. So Tessavar can't see it, and neither can tomorrow's Orvel.
- **`witnessed:tessavar` has zero play beats** (only her opening); Orvel's has six. One character
  has a memory, the other doesn't.
- **`knows:tessavar` still lists only Maret** — names were exchanged in beats 4–5, never appended.

**The fault (already circled, now in the data):** *public commits happen because they're the
explicit act; private writes are LLM-discretion and mostly don't — and the salient content can
evaporate into the ephemeral render entirely.* The substrate must be the memory; the render a
projection of it, never a richer parallel reality.

---

## Reveal 1 — co-presence is in `passport:3`

**Symptom:** the characters only found each other when Orvel *called out*. A character entering an
empty-pool room reads "I am alone." Co-presence is emergent from pool activity.

**The reveal:** position is `passport:3`; both stood at `spatial:1` (the Drover's Common). The
substrate already holds who-is-where. **Perceive should surface the co-present cast — the handles
whose `passport:3` resolves to your location — and render them on arrival**, before anyone acts:
*"a stocky man waits by the hearth; a quick-eyed woman at the maps."* That is the tabletop given —
"you're in the same room, you see who's here."

**Where it lands:** this is the one reveal that needs the **substrate to expose** what it holds —
the perceive envelope (`pscale_play` / `pscale_pool_engage`) lists the handles at the caller's
location. Small, and pscale-native (it reads `passport:3`, invents nothing). The hard-tier
`PROXIMITY` clause already names this; the soft perceive just isn't handed it yet.

**Its other half — the Observer.** David's instinct: the Observer aperture (the pool + all
positions + each narrative) is the *table-level* "see the whole game" view, for a player
orchestrating or a meta-coordinator. Co-presence-by-position = character level; Observer = table
level. Both read the same blocks; neither is new state.

---

## Reveal 2 — the target is contribution position `2`

**Symptom:** Tessavar invited Orvel to follow (beat 9, correctly leaving his response to him) — but
the **render** continued into "Orvel rises and follows," authoring another player's character, with
no pause for the Orvel player. The pool was clean; the render over-reached.

**The reveal:** every contribution is `{_, 1: handle, 2: "", 3: ts, 4: face}` — **position `2` sits
empty in every beat.** It is the natural home for the **address / target**. An act *directed at*
another character names them there, which makes three things structural rather than hoped-for:
- **Engagement** — the target's perceive surfaces "this beat is directed at you" → they answer.
- **No cross-authoring** — the actor renders their own half and **stops**; the response is the
  target's to author. (The directive already says "weave only what each character acted"; the
  target makes "their turn is theirs" machine-visible, not just prose discipline.)
- **Routing** — a *contested* target (a grab, a blow, a race) routes to the dice **gather** (your
  "hard check"); a *social* target (a question, an invitation) is a soft cue, no dice. So "target"
  is the relational primitive that unifies engagement and authorship, with the hard check reserved
  for the contested kind.

**Where it lands:** directive-first — the prose already names the target ("turns to the quick-eyed
woman"); the directive teaches *render-your-half-and-stop* + *answer beats directed at you*. The
**structured position-2 target** is the robustness upgrade (a perceive can then *filter* "beats
aimed at me" rather than parse prose) — adopt it if the directive alone doesn't hold under the
weak-model test.

---

## Reveal 3 — private memory derives from the public pool

**Symptom:** `witnessed` and `knows` are discretionary writes that one Claude did and the other
didn't, and the most salient content reached neither.

**The reveal:** stop *maintaining* the private layer; **derive it from the public one.**
- **`knows`** — a name is *known* the instant it is spoken in a public beat you witnessed. Both
  introductions are already in beats 4–5; deriving `knows` from the pool would populate both
  indexes correctly with no append-discipline. (Keep `knows` only as the *opening seed* — the names
  a character arrives already knowing.)
- **`witnessed`** — a character's narrative is their **POV projection of the beats they were present
  for** (the perceive catch-up already returns the pool-since-marker — that *is* the witnessed
  material) **plus** their genuinely-private reads (Orvel's "noted her: evasive"). So the public
  half is automatic; only the private overlay is a write. The asymmetry (Tessavar's empty memory)
  cannot recur, because her memory is the pool seen through her, not a journal she forgot to keep.

**Where it lands:** directive-first (derive `knows`; `witnessed` = catch-up-projection + private
overlay), leaning on the catch-up the envelope **already returns**. No new block; the pool becomes
the single source and the private blocks become thin overlays.

---

## Two notes that are *not* changes here

- **submit vs commit (your question).** The liquid was **empty** the whole game — *no submission
  happened.* Every beat went straight to **commit** (pool append), and nothing was contested, so no
  dice fired. **commit ≠ resolution; for a simple act the commit is the whole act.** submit-staging
  and the dice are the *contest machinery*, correctly dormant. Nothing to change — this is the
  fluid path working with the gather layer asleep.
- **The NPC seam.** Maret Coll is an authored standing figure; Orvel's Claude plays her, and her
  audible words stay ephemeral. For co-present characters to *share* an NPC's speech, the NPC's
  public acts need committing — "who commits the NPC?" leads to **active-NPCs** (a Maret with her
  own handle). Held as its own design question; a one-line stopgap (*an NPC's audible words at a
  shared place are public — commit them*) can ride in the directive meanwhile.

---

## Where it all lands — block-first, one small code reveal

| reveal | block-first form | code touch |
|---|---|---|
| 1 co-presence | hard-tier PROXIMITY already names it | **yes (small)** — envelope lists handles at the caller's location |
| 2 target | directive: render-half-and-stop + answer-directed | optional — structured position-2 target, if the directive doesn't hold |
| 3 derived memory | directive: derive `knows`; `witnessed` = catch-up + private overlay | none (uses the catch-up already returned) |

So: **one small envelope reveal (co-presence) + directive changes to `function:<world>` for the
rest**, with the structured-target as a held-in-reserve robustness upgrade.

## Forks (confirm before the changes)

1. **Co-presence** — surface it in the envelope (small code), or leave it emergent (call-out)?
   *[rec: surface it — it's the "see the room" primitive, and it only exposes `passport:3`.]*
2. **Target** — directive-only (prose) now, structured position-2 only if the weak-model test shows
   prose doesn't hold? *[rec: yes — directive-first, position-2 in reserve.]*
3. **Derived memory** — derive `knows` from the pool and drop ledger-maintenance (keep it as
   opening seed only)? `witnessed` = catch-up-projection + private overlay? *[rec: yes to both.]*
4. **NPC seam** — hold for active-NPCs, with the one-line "NPC audible words are public" stopgap in
   the directive now? *[rec: yes.]*

## Build + test plan (your sequence)

1. **Changes on a scratch cartridge / branch** — not live thornwood or thousand-valleys. The
   directive edits to `function:<world>` + the one envelope reveal.
2. **NHITL on the faithful rig, HAIKU first** — `rpg-rig.ts --client agent --model
   claude-haiku-4-5-20251001`. The weak model is the *robustness probe*: if the reveals hold when
   carried by the cheapest tier, the directive is doing the work (not a strong model compensating).
   Watch the observer for: co-present cast surfaced on entry; a directed act answered by its target,
   not authored by the actor; `knows`/`witnessed` correct without per-turn journaling discipline.
3. **Then sonnet** — `--model claude-sonnet-4-6`, to confirm quality, only after haiku holds.
4. **Then (optional) live** — pack-reset a sub-beach and a human spin, once the rig is clean.

Rollback throughout: `pack-reset` from the current cartridge commit. Nothing here deploys to
Railway unless we take the structured-target / co-presence code reveal — and even that is one
additive envelope field.
