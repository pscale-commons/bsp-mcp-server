# CADO as a complete product — and the minimum core fundamental

> *"Minecraft for semantic blocks."*

**Status: SUPERSEDED 2026-06-23.** The prescriptive parts below (author A/D/O "operational
directives", a D→A→O build order, a substrate-canonical home) **over-scoped CADO** — which is
*advisory framing*, already operational (it is all just create/edit blocks, scoped per face for
self-organisation; rights-enforcement is the deferred v0.2), per `docs/protocol-agent-shell.md`
§3.3–3.4. The one part that holds is **§2's four-stances completeness** (define / build / inhabit
/ export exhaust the relations to a world → no fifth face). Operative plan:
[2026-06-23-roadmap-backcast-three-objectives.md](2026-06-23-roadmap-backcast-three-objectives.md).
Original review retained below for history.

**Date:** 2026-06-23. **Origin:** after the fluid-async-sequence ship + David's two-machine
playtest, asking what is next for CADO as a whole product.

---

## 0. The question, sharpened

David: *"CADO operational with RPG — C plays, A creates world+characters, D modifies rules, O
generates output from following characters; then what these CADO versions do on non-RPG blocks,
and the evolutionary path of sed, grain, SAND, agent development. What is the minimum to ensure
the core fundamental is operational: minecraft for semantic blocks?"*

This doc answers in one line and then shows the work: **the minimum is to give Author, Designer,
and Observer the one thing Character already has — an operational directive and a single live
proof — with no new machinery. The design for all four already exists in `frame-spec:thornwood`.**

---

## 1. What "operational" has to mean (the minecraft test)

The repo's thesis: the function surface *is* `bsp()`; everything is a block; CADO is an
**aperture over one substrate**, not four apps. So "minecraft for semantic blocks" is one
uniform loop —

> **perceive a block from a position → write a block → others see it via stigmergy**

— from which worlds emerge by free combination. The engine never changes; the cartridge is the
data (the thornwood MANIFEST already says exactly this).

**The test of "operational" is therefore strict:** the loop works under all four faces with
**no new primitive**. If a face needs new machinery, the thesis has failed — it is four apps in
a costume, not minecraft. The whole value of CADO is that C/A/D/O are the *same* `bsp()` loop,
aperture pointed at different blocks.

## 2. The irreducible loop, and the four faces over it

| | reads (perceive) | writes (act/place) | stance |
|---|---|---|---|
| **C** Character | position + co-present + own `witnessed`/`knows` | `pool` (acts) + own `witnessed`/`knows` | **inhabits** — the only face *in* spatial; interacts with other C *within* world content |
| **A** Author | `spatial` + the world's content blocks | `spatial` + world content + new character vessels (`passport`/`shell`/`knows`/`witnessed`) | **builds** — operates *on* spatial from outside; never authors what-happened (that is C's play) |
| **D** Designer | `rules:*` + `function:*` + `frame-spec` + the (action) blocks | the same | **defines** operationality — the conventions and (action) blocks by which CADO themselves operate |
| **O** Observer | `witnessed:<each>` across agencies | output *external to the system* (a narrative; content for image/video API-plugs) | **exports** — audience/director synthesising outward, never a master truth |

**The four planes [David's sharpening, 2026-06-23].** CADO is not four peers but a layered stack —
the complete set of *stances toward a block-world*:
- **D — operationality (innermost / meta):** defines the rules by which the others operate.
- **A — content:** fills the world; operates *on* the spatial blocks from outside.
- **C — inhabitation:** the only face *in* spatial; lives the world from a position, among other C.
- **O — export (outermost):** reads the inhabitants and synthesises *outward*, for consumers
  external to the substrate.

Two oppositions make it clean: **D writes the rules *in* ↔ O reads the play *out*** (both outside
the fiction); **A authors *from outside* ↔ C lives *from inside*** (both the world itself). That
**exhausts** the relations to a world — define it, build it, inhabit it, export it — which is *why*
CADO is a **complete** product surface: there is no fifth face. (Authority/width is the orthogonal
SMH axis — CADO × SMH, already the design.)

Same verbs, four apertures. Resolution (the gather window) is a sub-case of C only, and only for a
contested act. Nothing here is new code — every cell is a `bsp()` read or write; O's *external*
media render is an outbound adapter, not a substrate primitive (Tier 1).

## 3. Where we actually are (honest, grounded in the blocks)

**The key finding:** `frame-spec:thornwood` **already names all four apertures** — `1` Character
(fully fleshed, with soft/medium sub-tiers), `2` Author, `3` Designer, `4` Observer. The
*design* of the four faces is done. What differs face to face is the **operational directive**
(the actionable turn-loop) and **live proof**:

| face | aperture (`frame-spec`) | operational directive | live proof | the gap |
|---|---|---|---|---|
| **C** | `:1` ✅ | `function:thornwood` ✅ | two-machine + rig ✅ | — (done; the *hardest* face works) |
| **A** | `:2` ✅ (charter) | — none | offline only (cartridge authored by hand/script) | a thin Author directive + 1 live authoring act |
| **D** | `:3` ✅ (charter) | — none | implicit (we edit rules as coders, not as a face) | a thin Designer directive + 1 live rule-edit-via-`bsp()` |
| **O** | `:4` ✅ (charter) | — none | proto (the *rig* observer scores runs for testing) | a thin Observer directive + a synthesis render (multi-character narrative, outward) |

So **C is done; A/D/O are each one thin directive + one demonstration away.** The charter exists
for all four; only the operational prose and the proof are missing. This is small, and it is
prose-and-proof, not building — exactly "tweaking systemic elements," not "coding fixes."

## 4. The minimum — "it's operational, it's minecraft"

**THE MINIMUM (Tier 0):** all four faces demonstrated as `bsp()` apertures over the one live
world, each via a thin operational directive (the `function:thornwood` pattern), each doing one
real thing, **no new primitive.**

Concretely:
1. **Author the A/D/O operational directives.** Recommended home: **world-generic, substrate-
   canonical** — sentinel-bundled like `gatekeeper`/`soft-agent`, *not* per-cartridge — because
   authoring, rule-editing, and observing are the *same verbs in any world or on the commons*.
   The per-world `frame-spec:<world>:2/3/4` already supplies the world-specific *addresses*; the
   canonical directive supplies the generic *how-to-wear-this-face*. (Only C's directive stays
   per-world — it is the fiction-bearing play feel. See fork 1 for the deeper "all four
   canonical" option.)
2. **Demonstrate each once.** D edits a rule via `bsp()` and play visibly changes; A authors a
   fourth character (or extends `spatial`) live; O reads the three `witnessed:` spines and
   synthesises a **multi-character narrative** (text — the simplest external output; image/video
   via API-plugs is Tier 1).
3. **CF→≈8** — done this session (prose-native anchor in the three passports; reaches live on the
   next `pack-reset`).

Validate each on `--client agent` (the faithful rig is now the HITL path) before any live
reseed. That is the entire minimum. Passing it = the whole stack proven at maximal stress (the
RPG is the hardest semantic-context-delivery case — §6).

## 5. Shells — *not* required for the minimum

David: *"I don't know if we have to shift characters to shells yet."* — **No, not for Tier 0.**
The shell port already exists (thin `shell:`/`purpose:` in the cartridge) and that thin density
is enough for a human-driven Character. The shell *deepens* (density → `wake` + heartbeat) only
to serve **autonomy** (active-NPC) and **steering** (pscale-duration) — both Tier 1, above the
minimum. Keep characters thin. The shell is the bridge to autonomy, not the floor under play.

## 6. CADO over non-RPG blocks (the generalization)

CADO is not RPG-specific. A real-world user **is** a character shell at thin/human density
inhabiting the commons-world (`user = agent = character` is already uniform in the substrate). So
the four faces map 1:1 off the RPG:

- **C on the commons** = a user inhabiting their handle — perceive context, act = post/commit.
- **A on the commons** = creating handles/blocks — onboarding a user *is* authoring a
  `passport`/`shell` (literally the gatekeeper L1→L2 flow).
- **D on the commons** = editing conventions — `block-conventions`, a space's house rules (what
  we do when we edit sentinels).
- **O on the commons** = a feed/digest correlating many handles' marks/histories.

This is *why* A/D/O directives should be world-generic: the Author face authoring Thornwood and
onboarding a commons user is **one operation**. The RPG is the maximal-stress instance; passing
it ⇒ the commons case follows. "Works for RPG → works for real users" is an **identity, not an
analogy** — same shell, same beach, same `bsp()`, lower stress.

## 7. The evolutionary path (sed / grain / SAND / agent) — above the minimum

Thornwood is the **L4 prototype** on the evolution map (mutual objectives via pools). CADO-
operational at L4 exercises L1 (signal: passport/marks/knows) and L4 (pools) directly. The rest
of the path is demonstrated **through the RPG as content beats** — each already primitive-backed:

- **grain (L2 bilateral)** — two characters *bond* privately (a pact, a shared secret) →
  `pscale_grain_reach`. A play beat.
- **sed (L2 multilateral)** — characters *band* into a faction (a foresters' circle, a caravan
  guild) → `pscale_register`. A play beat.
- **SAND (L3)** — a *verified* message crosses worlds/beaches ("carry word south") → `bsp()` +
  `pscale_verify_rider`. The fiction already gestures at it (Fenn).
- **agent development (toward L5)** — the shell *densifies* along
  happyseaurchin→weft→mobius: thin (human) → dense (LLM-app) → full (`wake` + heartbeat,
  autonomous). The active-NPC is rung 2 of the beach-crab ladder.

So the agent-development spine, made playable:
**C-character → grain-bond → sed-faction → SAND-cross-world → autonomous-shell-agent.** Each is a
primitive we already have plus a content beat. Tier 2.

## 8. The map — minimum vs the rest

- **Tier 0 — the minimum core fundamental ("minecraft operational"):** A/D/O thin directives +
  one demo each; CF→8. No new primitive. **← this is "complete product, CADO operational."**
- **Tier 1 — kinder/deeper (optional polish):** pscale-duration / steer-at-scale (the async-
  tedium keystone); active-NPC (densify a shell, promote Bram); identity-deep (opaque handle);
  **O media-output** (image/video via API-plugs); the xstream skin (polling, V-L-S).
- **Tier 2 — ecosystem path:** grain-bond / sed-faction / SAND-cross-world as play beats (L2/L3
  through the RPG); the full beach-crab ladder (autonomous agents).

Everything David named as "complete product" lives in **Tier 0**. Everything else is genuinely
optional. The minimum is reachable now, block-only, rig-first.

---

## Forks (David to confirm before any build)

1. **Directive home for A/D/O** — world-generic & **substrate-canonical** (sentinel-bundled,
   reusable on the commons), vs per-cartridge `function:<world>` face-sections.
   *[rec: substrate-canonical — it doubles as the non-RPG answer (§6).* A deeper option: move
   *all four* directives (incl. C) to canonical engine and let every cartridge be pure content —
   true to "the engine never changes." Elegant, but C is live-validated per-world and worlds may
   want bespoke play-feel, so I'd **not** refactor C now; note it as a future.]*
2. **Observer output form — ANSWERED [David, 2026-06-23]:** O *synthesises outward for consumers
   external to the system* — a multi-character narrative (the director's cut), and/or content for
   API-plugs (images, video). **Minimum-O = the text narrative**; the media-plugs are Tier 1 (an
   outbound adapter, not a new primitive).
3. **Demonstration venue** — rig (`--client agent`) first, then live thornwood? *[rec: rig-first
   per discipline; live only after.]*
4. **Shells for Tier 0** — confirm we do NOT deepen shells for the minimum (keep thin; defer
   autonomy/steer to Tier 1)? *[rec: yes, defer.]*

**Build order if approved:** **D first** (smallest — one rule-edit-via-`bsp()`, immediately
visible in play), then **A** (author a character live), then **O** (the narrative synthesis). D's
*deeper* arc — maturing `rules:nomad` into the walkable **(action) block** — is Tier 1+, not the
minimum. Each rig-validated, then optionally shown live. Rollback throughout = `pack-reset` from the current
cartridge commit; nothing here deploys code.
