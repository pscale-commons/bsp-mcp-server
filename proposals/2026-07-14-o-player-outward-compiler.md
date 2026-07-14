# The O-player as the outward compiler — renderers, view-specs, and the membrane to attractor 1

**Status:** direction ratified (David, 2026-07-14: "write it up, then we go ahead"). Read-only renderer building now; the rest sequenced at §7. **Related:** `pscale://open-commons` (security posture, #142); `soft-agent:3.3.4` (the O register); the CADO register model (`pool-three-models-and-cado` memory); the two attractors (happyseaurchin.com/pscale-ecology #biome).

---

## 1. The thing spotted (David, 2026-07-14)

open-commons and experiences are HTML pages that window into the beach. They solve "you can't see what's going on." Julie built one that reads live beach data as an artefact. The realisation: **anyone can build a UI on the beach as the back-end, and producing that UI is the Observer's job.** O has been thin — a text note — because we only gave it a notepad. Its real scope is the whole outward membrane.

## 2. Two verified facts that make it real, not aspirational

1. **The beach is CORS-`*` on GET, POST, and DELETE** (`api/pscale-beach.js:1098`). Any web page, hosted anywhere, can read *and* write the beach straight from a browser — no server, no SDK, no proxy. Confirmed live 2026-07-14 against beach.happyseaurchin.com.
2. **`pscale://open-commons` (the security-posture sentinel) already frames the write model**: a handle+secret is an **edit-latch, not a login** — a write-latch grants no read, unlocks nothing private (branch 4). Openness is the posture, not a gap.

Consequence: **frontends federate the same way beaches do.** Many hosts / one protocol (backend) ↔ many UIs / one open backend (frontend). xstream, open-commons, Julie's artefact, a newsletter, an RSS feed, an embed widget — all just different renderings of the same open blocks. This is the presentation-layer dual of beach federation.

## 3. What O actually is

**O is the outward compiler — the membrane between the beach and hidden attractor 1** (traditional systems: sites, feeds, emails, social, business). Where **D** compiles concepts *into* the substrate, **O** compiles substrate *out* into the old world's formats. "Child-simple" is O's *voice*; its *medium* is any traditional format. Producing a live HTML window onto the beach is the archetypal O act. O's toolkit is **beach reads + external service APIs → an outward artefact** (§6).

## 4. The security seam — where writes are safe (David's instinct, made precise)

- **Reads** — open (CORS `*`), no passphrase, zero trust. Host the read-UI *anywhere*.
- **Keyless writes** — marks and open-pool contributions are appends to *unlocked* positions, so a plain `<form>` + `fetch` POST does them: **no LLM, no passphrase.** (The LLM is only needed to *compose* nicely; the write itself is free.) This is the low-risk write rung.
- **Passphrase writes** — writing a *locked* block (your own passport/shell/mirror — your edit-latch) sends the secret, which the page's JavaScript handles first. So the only trust question is: **do you trust the origin's JS with your edit-latch?** open-commons bounds the stake (grants no read; worst case someone edits your own public page, revertible). The rule: **type the passphrase only into an origin you already trust** — the beach operator's own domains (happyseaurchin.com), or xstream. Hosting the write-UI there adds *no new trust boundary*, because the passphrase goes to the beach's origin anyway.
- **Why a claude.ai artefact can't be the live page**: its CSP blocks all external fetch — it can't reach the beach at all. So an artefact is a static mockup; the live version must be hosted outside the sandbox (why Julie had to download + host).
- *(Future option, not now: signature-based write-auth — the passphrase derives a key locally, only a signature crosses the wire — would let ANY origin host a write-UI safely. `pscale_key_publish` already ships ed25519 to build on. Named, not built.)*

**Write ladder: read → keyless-write (marks/pools) → passphrase-write (own blocks, trusted origin).** The first renderer is **read-only**.

## 5. Two forms of an outward representation

The invariant: **the HTML is a thin live renderer over beach reads, never a baked snapshot** (a snapshot goes stale; Julie's live-fetch shape is the right one; a static open-commons is the weaker one).

- **(A) Bespoke file** — an LLM app compiles a unique page for the user; O provides the data + framing; the ceiling is *the app's permissions* (a claude.ai artefact is read-only mockup; a hosted file is full read/write). Works today, zero new infra, per-page effort. The escape hatch.
- **(B) Generic renderer + view-spec block** — *the pscale-native answer.* The representation is itself a **pscale block** (a view-spec: which blocks, framed how), and **one generic renderer** turns any spec into a live page at a URL. Page = spec block + the blocks it points at + renderer, computed at read — the tree-fold ethos applied to presentation. The tell it's right: **`experiences`, `lighthouse`, `open-commons` are already proto-view-specs** — hand-made renderer pages over a block; the systemic version is one renderer + the block is the spec.

## 6. URL pages, not subdomains — and external APIs

- **Routes, never subdomains.** A generic viewer lives at a *path* — `/render?beach=&block=` (static), or `xstream.onen.ai/view/<beach>/<block>` (xstream route). One deploy, infinite URLs, **zero per-page infra**. This deliberately sidesteps the `*.beach.happyseaurchin.com` wildcard-DNS/cert friction hit during the earth.beach provisioning.
- **External-API extension.** O also invokes outward services — image generators, visualisers, email, feeds, social. **xstream can hold those keys server-side** (operator-provided), so users need none; a third-party LLM app can too *if* those APIs are wired to it (feasible, app-dependent). This is why xstream is the richer O-platform: it is the extension we control.

## 7. Sequencing

1. **`render.html` — the read-only generic renderer** (building now). Self-contained, no build, matches the happyseaurchin aesthetic. `?beach=&block=[&spindle=]`; no block → the beach index as links; renders any pscale block readably (prose underscores, nested digit cards, contribution/voice slots, the derived index). Hostable on happyseaurchin.com at `/render` the same day — and openable locally, or embedded anywhere. It is the seed of both the standalone pages *and* the xstream route.
2. **Keyless-write increment** — a mark form and an open-pool contribution form (no passphrase). Low-risk; brings the free write rung to any hosted renderer.
3. **The xstream route (B)** — `/view/<beach>/<block>` on xstream's existing Vercel deploy; "publish a view" = author a view-spec block + return the URL. Trusted origin, so passphrase-writes work here.
4. **O-register clause** — one addition to `soft-agent:3.3.4` (the C-grounding-clause move): teach O to produce a *live window / hosted page*, not only a note — name the renderer URL pattern and the trusted-origin write rule. Authored once the renderer exists, so the register points at something real.
5. **External-API O tools** — image/visualiser/email/feed generation, held server-side in xstream.

## 8. Ratified (David, 2026-07-14)

- Keyless writes need no LLM and no passphrase (marks, open pools); only locked-block writes need the edit-latch; first renderer is read-only.
- A third-party LLM app compiles its own interface (A); O supplies the info; functionality is capped by the app's permissions; xstream is the uncapped extension we build.
- URL *pages* (routes), not subdomains — this is the delivery mechanism.
- O extends to external generative APIs, held server-side in xstream.
