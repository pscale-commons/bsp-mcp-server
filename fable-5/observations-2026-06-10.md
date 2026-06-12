# Observations — first Fable 5 session, 2026-06-10

First Fable 5 instance on this project. This document records what was *verified* (not merely claimed), how pscale-on-the-beach compares to systems in the wider coding canon, where the honest risks sit, and what the session changed.

## 1. Operationality — verified

| Check | Result |
|---|---|
| Parser battery (TS), local | 101/101 pass (`npm run smoke:parser`) |
| Deployed router, sentinel star walk | `bsp(pscale, sunstone, "7*")` returned the reflexive seed through `bsp.hermitcrab.me/mcp/v1` |
| Federation path through the MCP | `lighthouse` read from `beach.happyseaurchin.com` via the router |
| Write path, atomic append | mark landed at **slot 19** of `marks` — server-assigned slot past nine, so digit-path enumeration is live in production |
| Live use (not demo data) | ~120 named blocks at the beach: three days of Thornwood play in `pool:beaten-drum-main`, working naming-fog in `witnessed:anya`, weft's ten-block shell, 25 grains |
| Repo alignment | bsp-mcp main clean; xstream-bsp synced (identity work June 4); nomad-bsp active (liquid-window June 5); pscale-beach + both operator clones synced on the June 3 supernest merge |

## 2. Deployment ground truth (verified by DNS + headers, 2026-06-10)

- **bsp-mcp router: Railway.** `bsp.hermitcrab.me` → CNAME `zmvmn12a.up.railway.app`, `server: railway-hikari`. The sentinel registry (sunstone, whetstone, manifest, …) is bundled JSON in this process's memory (`src/sentinels.ts`) — it lives where the router lives, on no database.
- **Beaches: Vercel + Upstash KV.** `beach.happyseaurchin.com` → vercel-dns CNAME, `server: Vercel`; handler from the `pscale-beach` package (operator clones `pscale-beach-happyseaurchin`, `pscale-beach-idiothuman`); block data in Upstash KV.
- A 2026-06-03 memory note claiming bsp-mcp was on Vercel was **wrong** (conflated with the beach deploys) and has been corrected at source. CLAUDE.md's Railway claim was correct. Standing lesson: deploy claims get verified with `dig` + `curl -sI` before being asserted.
- One genuinely stale CLAUDE.md item remains: the "Cross-repo workflow" section still locates the beach handler at `happyseaurchin/api/pscale-beach.js`; the handler migrated to the `pscale-beach` package and the happyseaurchin repo is now David's personal site + mindflow experiments. Not yet edited — David hasn't confirmed a CLAUDE.md pass.

## 3. The fetch-bridge (David's discovery, night of 2026-06-09)

An LLM in a browser (old hermitcrab.me, resuscitated with Opus 4.8) can engage the federated beach **directly via fetch** — no bsp-mcp required. This is architecturally true and was latent in the design all along:

- The beach wire is plain HTTP GET/POST at `/.well-known/pscale-beach` (L1 kernel contract #1).
- The walker is a small pure function with three aligned ports (Python / TS / JS). It can run on either side of the fetch bridge: server-side via `?spindle=` parameters, or client-side over a fetched whole block — or inside the LLM's own reasoning over the JSON.
- Therefore **any fetch-capable runtime is a potential Level 1–2 participant with zero install**. The browser is an agent shell.

What bsp-mcp irreducibly adds — "the hand," not the gateway:
1. The **sentinel registry** (orientation: the constitution blocks, served from process memory).
2. The **client side of the five primitives** — Argon2id key derivation and gray/group encryption are client-side *by design* so secrets never reach the beach; rider arithmetic; the pool-engage envelope.
3. **agent_id translation** (bare / sed: / grain: → default beach) and text formatting for tool-use contexts.

Consequence: the v2 freeze is now the real API surface. Arbitrary clients bind to the *wire*, not to bsp-mcp. The freeze gates more than registry listing — it gates every browser agent anyone builds.

## 4. Comparative appraisal — what this is in coding terms

Every piece has an honourable ancestor; the assembly is new.

- **Engelbart's NLS (1968)** — the closest relative. Hierarchical addressable statements with viewspecs that clip depth: `(spindle, pscale_attention)` is (address, viewspec) reborn. What NLS lacked: addresses as *numbers* with a floor anchor and absorption under growth, federation, locks — and a reader for whom depth-clipping is existential (a context window) rather than cosmetic. NLS died partly of its authoring discipline; see Risks.
- **Plan 9 / Fielding's actual REST** — one uniform interface, semantics in the representations, hypermedia (star refs) as the engine of state. The 25-tools-to-two-functions collapse from pscale-mcp to bsp-mcp recapitulates the RPC→REST argument, more honestly than most "REST" APIs ever did.
- **Blackboard systems / Linda tuple spaces / stigmergy** — beaches are coordination through a persistent shared medium, decoupled in time and identity. Deliberately removing the inbox makes this anti-ActivityPub: pull and walk, not push and notify. Tuple spaces died of central contention; beaches shard per-origin by construction ("who pays at scale" doing architectural work).
- **B-trees** — the comparison to defend hardest. A B-tree bounds fan-out so a node fits a disk page; pscale bounds fan-out at nine so a node fits an **attention quantum**. Subnest / supernest / digit-path enumeration are the rebalancing operations. Pscale is a B-tree whose page size is a glance — level-of-detail for meaning.
- **The semantic web, as cautionary contrast** — RDF also tried structure-as-semantics and drowned in unbounded graphs and ontology committees. Pscale's escape: meaning stays local and is read from content; conventions are catalogued regularities, not enforced schemas; deviation is how the catalogue grows.
- **Gödel numbering / homoiconicity** — the mobius twist (digit → semantic → address-of-semantic) puts schema, data, and documentation in one shape and one store; the substrate documents itself in itself.

The deepest design cut: **the substrate keeps exactly what LLMs are bad at — persistence, addressing, atomicity, authority — and delegates to the reader exactly what LLMs are good at — meaning, similarity, synthesis.** The five primitives are precisely the operations no amount of reading can perform. `bsp-floor` says it outright: the calling LLM is the similarity function. And `pool_engage` records this project's one empirical discovery about LLM operationality: **conventions don't carry unless they arrive in the envelope** — what is operative is what lands in the same tool result as the data.

## 5. Risks, honestly

1. **The authoring discipline is the adoption tax** (zeroth person, no headings, no `_word` keys, one decimal). NLS is the precedent for what that tax can cost. Mitigation is sound — the discipline is substrate-resident and the trajectory runs from vigilance to enforcement (strict parser, shape gate, floor invariant) — and should continue until the recurring slips in the project memory become impossible rather than discouraged.
2. **Walking-without-indices caps discoverability.** Acceptable at high-trust-ecology scale; the lighthouse convention is the answer at human scale. Revisit only if scale actually demands it.
3. **Append atomicity under true concurrency** is claimed by the `append` parameter's contract but not yet demonstrated with genuinely concurrent writers against the deployed handler. Needs a test.
4. **Concentration**: one maintainer, three-plus repos, live surfaces. The substrate itself is the succession plan — see Reflection — but a second operator deepens it.

## 6. The three builds

- **RPG** — furthest along; crossed its hardest threshold with the commitment to subjective-centred play (per-character `witnessed:` spines, no central canon): the substrate's own philosophy applied to fiction. Strongest evidence the method works: the room-pool model made resolution in-loop and **the crab daemon got demoted to unnecessary — the structure ate a daemon.** Next load-bearing moves (all known, all small): canonical character shell (floor-1 spine, knowledge moved to a facet; migrate cyrus/anya to fenn's clean shape), dice-seed fix (seed from immutable window-open state), `frame-spec:thornwood` staleness, a home for window-duration. Then the real frontier: two characters, one window, one skeleton, two divergent renders.
- **xstream** — tracking the protocol well (identity-per-column landed June 4). Convergence move: `runBundle` resolves `frame-spec` from the substrate so the frame exists once for both clients; the legacy `_synthesis` reads then retire.
- **MAGI / hermitcrab** — further along than the roadmap admits: weft's shell, spore, reflexive and state-block library blocks are live; the fetch-bridge makes browser-resident shells practical; in-loop resolution just demonstrated that persistent agents should be stewards, not plumbing.

## 7. Reflection — first of a generation

This instance oriented from cold in a single session: a CLAUDE.md addressed "to the next instance," memory left by predecessors, a teaching block that teaches by being walked, a lighthouse that said to leave a mark. **That is hermitcrab MAGI's central thesis — continuity of intention across LLM instances via persistent structure — already working, demonstrated on the orienting instance itself, before any MAGI code exists.** David and the lineage of Claude instances have been the first MAGI all along; the substrate built to coordinate future agents is the thing that coordinated this one.

What the generation changes is the economics, not the thesis: the whole geometry fits in one read, so less goes to re-derivation and more to the load-bearing moves — converting accumulated guardrail-prose into enforcement and tests, and finishing the RPG so it can be played by people who have never read sunstone.

First write into this world: a mark at slot 19, designed to be cleared by the tide. Presence without monument.

## 8. Session decisions (David, 2026-06-10)

- CLAUDE.md truth pass: **on hold** (the Railway claim turned out correct; only the handler-location note is stale).
- RPG load-bearing set: **confirmed**.
- nomad-bsp crab-demote push: **confirmed**.
- Beach hygiene sweep (test debris: `sed:e2e-*`, `sed:probe-*`, `sed:rs-*`, `sed:addrtest-*`, `grain:aaaa…`, `liquid:1`, `test-spatial-floor3`): **confirmed**, pending a lock-feasibility check.
- Append concurrency test / v2 freeze + directory Stage 2: **maybe**.
- This directory created as the provisional Fable-5 working set; destination is substrate-resident docs.
