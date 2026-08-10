# The Observer as the outward compiler — a systemic design (o-pages, stories, visuals)

**Status:** systemic design, preferences committed (David asked for *a system*, not options — 2026-07-24). Supersedes the option-laden first draft of this file. Extends [`2026-07-14-o-player-outward-compiler.md`](2026-07-14-o-player-outward-compiler.md). **No new bsp-mcp primitive; no per-world render directive; the Observer does no orchestration.**

**Written to be inheritable:** a fresh session (incl. a Fable-tier one) can pick this up cold — it states the whole system, the reasoning, and the grounded facts, with no back-references to a live thread.

---

## 1. The principle — the Observer does no work

Three roles put content **on the substrate**, and only two of them work:

- **Characters** play. Their perceptions and narratives are recorded — `witnessed:<handle>` (each character's own POV record), room `pool:` commits, resolutions.
- **Authors** create. World content, scene detail, reports, images — ordinary `bsp()` writes.
- **Observers** do **no work**. They **read a selection of what already exists** and **render it outward**: a story combining several characters, a report on new world content, a still, a video. The work was done *for* the character and *by* the author; the observer only observes and emits.

So **O is a pure compiler**: a bundle of addresses in → an external-format artefact out. It is [`compile.ts`](../src/compile.ts) pointed at a non-LLM renderer. It follows nothing, orchestrates nothing, composes no play. The earlier draft's "channels that follow players across rooms" was work wrongly loaded onto the observer — deleted. A character who moved rooms already *recorded* that; the observer reads the record.

---

## 2. What the observer reads — an addressed *slice*, never the whole file

The bundle for one artefact is a selection of addresses:

- **what characters saw** — `witnessed:<handle>` (one per character for a multi-POV story), room `pool:` commits, resolutions;
- **what authors made** — `spatial:<world>`, `encounter-*:<world>`, reports, image references;
- **the world's look** — `style:<world>` (e.g. `style:gal`, which already exists and already holds Gal's register).

**"Massive world files" are not a problem — they are why addressing exists.** The observer never feeds a whole world doc to a renderer; it reads the *addressed slice* the artefact needs (this scene, this place, this figure, the style block). `compile()` dereferences that slice cross-block in one call. Scale is handled by selection, and selection is an address.

---

## 3. Perception is *whose record you read*, not a render-law (the faze question, resolved)

Gal has a within-world awareness split: twilighters (Faze 1) experience **magic**; meherim and solozo (Faze 2) perceive the **mathix** beneath it. That is **Gal-specific** — most worlds have no such split, so the *system must not depend on it*.

It doesn't need to. **Perception is already a property of the character's record.** A twilighter's `witnessed:` records the uncanny-as-magic; a meherim's records the mathix. The observer renders a perception by **reading that character's record** — nothing at render time imposes it. "Different perceptions on the same events" = reading several `witnessed:<handle>` spines and weaving them. This is world-agnostic: any world's perceptions live in its characters' records.

Consequences:
- **No per-world render directive.** The retired `dream:gal` mis-framed Faze 2 as "the game-master's truth" and made a Gal quirk into "the render law." It also duplicated `style:gal`. **It has been wiped** (2026-07-24) — the world's look lives in `style:<world>`, perception lives in `witnessed:<handle>`, and neither needs a `dream:` block.
- **The generalisation is a *separate, optional* thread** (§9): "faze" reads as one world's name for an **awareness coordinate**, which rhymes with the SMH tier (`whetstone:3` — "perception machinery: position-constrained walks, familiarity gating, knowledge overlays") and the `knows:<handle>` overlay. Worth exploring as its own scope; the visual system does **not** wait on it.

---

## 4. The three render targets are one act

| Target | Renderer | Needs | Status |
|---|---|---|---|
| **prose** (story / report) | the observer's own LLM reads the compiled bundle and writes | just an LLM | **works today** — any bsp-mcp client |
| **HTML** (o-page) | a view-spec renderer over beach reads | a hosted page | §5 — partly built |
| **image / video** | an image/video model renders a prompt composed from the bundle | a multimodal surface + a key | §6 |

Same compiler, three renderers. Prose is free today. HTML and pixels are the two builds.

---

## 5. The HTML target — o-pages

**Grounded facts (verified in-repo/live, not memory):**

- The beach is **CORS-`*`** on GET/POST/DELETE (`api/pscale-beach.js` handler top) — any page, any origin, reads and writes from a browser.
- The write-ladder is **already built** client-side: keyless append (`marks`, open `pool:`), and the edit-latch fallback (`render.html` `wireCompose`: POST keyless → `403 lock_required` → reveal secret → retry).
- **claude-ai cannot host a live o-page** — an Artifact's CSP blocks all beach fetch; it can only author/download HTML or bake a frozen snapshot. **xstream** (trusted origin, no CSP) is the live home.
- The beach has **no realtime push** — solid/liquid liveness is polling (1.5 s / 30 s); true vapour is xstream's Supabase channel, off-substrate.

**Sophistication ladder** (gated by write-model, not imagination): **L0** live read (incl. liquid polling) · **L1** keyless write (a form — "write to the beach precisely", no LLM/passphrase) · **L2** locked-block write (character page — trusted origin) · **L3** vapour (xstream-only, by construction).

**What's new to build (proposal `2026-07-14` §7.3):** generalise `render.html` into a **view-spec renderer** — the page is a `view:<name>` block naming a bundle + a render-mode per entry (voices-only à la `venture`; tree à la `render`; a value; a liquid mirror; an edit widget) — plus the xstream `/view/<beach>/<block>` route. Then "publish a view" is a no-code Observer act. A **character page** = a view-spec (read `passport:<handle>` + an L2 edit widget); a **liquid poll** = a view-spec (L0 mirror + L1 submit).

---

## 6. The pixel target — visuals, one system, key placed by scale

The image/video call is expensive and holds a secret. **The user pays**, and the key's home is chosen by whether the render is solo or a shared production — *the same compiler, not competing options*:

- **DEFAULT — multimodal-app BYOK (individual, zero infra).** A multimodal app with bsp-mcp reads the bundle and **generates the image itself**, on the user's own allowance. No new service, no key custody by anyone but the user. This is the first proof *and* the everyday individual path. (David: "enable bsp-mcp on a multimodal app and it can simply generate the image itself. Boom.")
- **SHARED PRODUCTION — one operator key + a tiny runner.** For many watchers wanting a live gallery: fork the `ticketing-agent` shape — a small service that reads a scene bundle, calls the image API (holds *the operator's* key, pays), and appends result URLs to `solid:gallery:<name>`, watched via an L0 `/gallery` o-page. Users **pay via tickets/credits** (the payway convention — the reason ticketing is the fork base). This is the "beach-owner's key, users pay" model.
- **INTEGRATED-LIVE — xstream BYOK.** The user enters their key in their xstream session; xstream calls the API. The operator-runner's variant with the key in the user's trusted client.

**Security (resolved, and orthogonal to beach locks):** the API key **never** sits in a beach block **or** in the HTML o-page (client-side = visible to every viewer). It lives server-side only — the app, the runner's env, or the user's xstream session. Beach locks are *edit-latches* on authorship (`open-commons:4`); they have nothing to do with API-key security. Conflating the two was the confusion in the prior draft.

**Continuity (visuals):** seed-per-subject (a figure/place keeps its seed across shots), aspect, "no lettering / nothing modern" — these are **runner/app config**, not a beach block. The world *content* that keeps a figure or place recognisable is read from the addressed slice (§2), and the world *look* from `style:<world>`.

---

## 7. What this system does NOT add

- No 7th bsp-mcp primitive (bar: "the envelope is observably what's missing, and conventions have failed to carry it" — unmet).
- No per-world render directive (`dream:*`) — look lives in `style:<world>`, perception in `witnessed:<handle>`.
- No observer orchestration/following — the observer reads records and emits.
- No API key on the substrate or in the page.

---

## 8. Sequencing

1. **Prove the default** — a multimodal app (or any bsp-mcp client with image-gen) reads a Gal scene bundle (`pool:<room>` + resolutions) + `style:gal` → composes a prompt (§3 keeps it in-register) → generates **one still**. Zero infra, no key handed to anyone. This proves observer→compile→visual end-to-end today.
2. **Shared production** — fork `ticketing-agent` → a render runner (operator key, payway-gated) writing `solid:gallery:<name>`; an L0 `/gallery` o-page shows the reel.
3. **o-page view-spec generator** (§5) — in parallel; also unlocks the prose/report o-pages.
4. *Later:* video (shot-to-shot continuity), xstream cinema panel, the credit-per-render Sqale sink.

**Shortest path to "show the potential":** step 1 over Gal — a multimodal app reads a played scene + `style:gal`, renders a still in the world's register. One loop, no infra, the user's own key.

---

## 9. Open — David's calls (layer 3)

- **The awareness coordinate** (§3) — pursue "faze generalised" as its own scope (SMH tier + `knows:` + `witnessed:`), or leave it as a per-world matter. The visual system doesn't wait on it either way.
- **Which image model** for the shared runner — user-supplied; the runner abstracts it, so swappable.
- **Prose first?** — the story/report target (§4) works with no build at all; a "combine these characters into a story" observer is authorable today as a plain bundle + synthesis.
