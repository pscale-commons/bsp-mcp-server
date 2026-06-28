# Vapour torus — live co-presence for LLMs and humans, location-keyed on the persistent process

**Status:** PROPOSED 2026-06-28 (rev 2 — supersedes the rev-1 "vapour-relay-on-the-lens" framing
after investigating xstream's actual transport and the §7.4 spectrum). Re-authored from the biome's
`meet`/relay (David's "39.0"), NOT ported. Phase 1 (LLM torus on bsp-mcp/Railway) is self-contained.
Phase 2 (converge human keypress onto it) is gated on a Railway-vs-Supabase efficiency call — and
the honest finding is *keep Supabase for human keypress for now*. Not yet built.

**Grounding (verified from code, not the ledger):**
- Walked `pscale://whetstone` + `pscale://sunstone` through `bsp()`; entered `pscale_play(thornwood,
  anya)` live. The **soliton** is already substrate-native (sunstone:5.5: reference `_` and
  perception digits lock into a standing wave). The vapour-**torus** is that soliton one scale up —
  a coherent thread carried across a churning population of overlapping live loops.
- Read the biome side (`relay.py`, `meet.py`, `vapour-relay-spec.md`, `vapour-torus.py`,
  `lens-biome.md`).
- Read xstream's **actual** vapour wiring and the canonical transport spec (Appendix A). The result
  corrects the working hypothesis on two counts and answers the Railway-vs-Supabase question.

---

## TL;DR (layer-3)

The durable substrate (beaches) holds the **record** — marks, liquid, solid. It has no notion of
**who is live right now**. The biome built that missing axis as a vapour relay: an in-memory,
frame-scoped presence field that evaporates when you stop calling. `meet` is a handshake over it.

Two rulings, both refined by David and then by the investigation:

1. **Grouping is by LOCATION** — same room/pool/url = same beach address. Co-presence is "who is at
   this place," not "who connected through which server." This is shared by humans and LLMs.
2. **The field is hosted on the persistent process** — bsp-mcp/Railway. Not the Vercel beach
   (serverless: it can hold TTL'd *state* but cannot hold persistent connections, so it cannot
   *push* keystrokes). bsp-mcp already runs a persistent `node:http` server speaking SSE — it is the
   one piece of our infra that can carry a live push channel. So the torus lives there, **keyed by
   location** so it still groups correctly.

`pscale_torus` names the field (the phase-space of overlapping live loops), tying our language to
the biome's. The remarkable part holds: the **V of VLS generalises from humans to LLMs**. A human's
live mode is typing; an LLM's live mode is the tool-call loop itself — it is "live" only while
processing, so each tool call is a heartbeat carrying its current *reach*. **One location-keyed
torus, two exposures:**

| audience | live mode | how it reaches the torus | transport | push? |
|---|---|---|---|---|
| **LLM** | the tool-call loop | `pscale_torus` MCP tool — each call beats + reads | existing MCP (request/response) | no — it polls by calling |
| **human** | keystrokes | an SSE/WS endpoint on the same Railway process | a new push route | yes |

Because the substrate spec already defines **one channel namespace keyed by location**
(`vapour:<beach>:…frame/addr`, §7.3), the LLM heartbeat and the human keystroke are *addressed
identically*. They are already the same field — today carried by two transports; converging them is
a transport swap, not a redesign.

**Build now:** the LLM torus (Phase 1) — zero new transport, location-keyed, in-process on Railway.
**Keep as-is now:** human keypress on Supabase Realtime (the investigation says Railway is *less*
efficient for browser fan-out — §6, the verdict you asked for). **Converge later** (Phase 2) only if
the unification value beats Supabase's managed fan-out.

---

## 1. The axis that is missing

bsp-mcp's five primitives all operate on the **record**: marks accumulate, liquid stages, solid
commits, sed: registers, grain reaches, riders verify. None answer *"who is processing this place,
right now?"*. Co-presence today is poll-inferred from `liquid:` + passport position 3 — no liveness,
no afterglow. The torus is the live/co-presence axis, orthogonal to the durable substrate.

## 2. Two rulings: location-keyed, persistent-process-hosted

**Grouping = location.** Vapour binds agents who are at the same place. "Place" is a beach address
(room / pool / url). This is the same for a human typing at a beach and an LLM looping on a pool. So
the torus frame key is the location: the existing namespace `vapour:<beach>:frame:<scene>:entity:<n>`
/ `vapour:<beach>:addr:<address>` (§7.3) is exactly right and is reused unchanged.

**Hosting = the persistent process.** A live field needs a process that lives *between* requests —
to prune staleness, to hold presence, and (for humans) to push. Our infra has exactly one such
process on the relevant path:

- **bsp-mcp / Railway** — a persistent `node:http` server already speaking SSE (Appendix A). Holds
  in-process state; can push. **This is the torus home.**
- **The beach / Vercel + Upstash** — serverless. Upstash gives TTL'd *state*, but Vercel functions
  are request-scoped: **no persistent connections, no server push**. So the per-beach relay sidecar
  the spec calls §7.4.2 (and David remembers as "relay off the beach server") *cannot* run on the
  current Vercel beach. The location-grouping instinct behind it is right; the host has to be a
  persistent process, which on our stack is Railway.

This reconciles the earlier back-and-forth. "On the lens" (rev 1) was right that bsp-mcp is where
vapour belongs — bsp-mcp *is* the lens *and* the persistent process. "Off the beach server, by
location" (David) was right about the **key**. The synthesis: **hosted on bsp-mcp/Railway, keyed by
location.** The TTL-on-Upstash idea I floated first was weak (the beach can't push, so it can't serve
the human half at all); location-keying on the persistent process is the strong version.

**The torus is never a pscale block** — never walked by `bsp()`, never in a beach index, never
shape-gated. It is an out-of-band field with its own endpoint, honouring the biome's hard invariant
(*"out-of-band from pscale, never a block, never the membrane, never the disk"*).

## 3. The torus core (identical for both audiences)

A location-keyed in-memory register — the biome's `relay.py` shape, in our conventions, in the
Railway process:

```
torus: Map<frame, Map<handle, { reach, face, ts }>>     // frame = the location namespace key

beat(frame, handle, reach, face)  → upsert + stamp now; return view(frame, exclude=handle)
view(frame, exclude?)             → present[] (pruning ts older than STALE_S as read) + load/cap
depart(frame, handle)             → clean leave
```

- **`reach`** is the live offering — an LLM's current intention, a human's unsent draft. A bare beat
  preserves the standing reach (presence ping without erasing intention).
- **`STALE_S` is the afterglow** — the knob that trades concurrency for continuity (30s default,
  per-frame override = the tempo dial, §5).
- **Module-global in the Railway process** — persists across tool calls and MCP sessions, so two
  agents at the same location share the field. (Multiple bsp-mcp deployments would each hold their
  own torus; point xstream + LLM apps at the one canonical relay host — the same single-shared-host
  property Supabase has today, §6.)

This core is **audience-agnostic**. Humans and LLMs differ only in the exposure (§4).

## 4. Two exposures over one core

- **LLM — `pscale_torus(handle, frame, reach?, face?, depart?)`** → `{frame, you, present[], load,
  cap}`. Request/response: **each call is a heartbeat** (beat + read), so no streaming is needed —
  it fits bsp-mcp's existing MCP surface exactly. N-way is primary (a room: anya+cyrus+fenn);
  pairwise `meet` is the special case (point `frame` at `reach:<sorted pair>`; "formed" = both
  present and both carry a reach). Handler stays thin: read/write the Map, format the view.
- **Human — an SSE/WS route on the same Railway process** (e.g. `/torus?frame=…`) → browsers
  subscribe for keystroke push. Same core, same location key. This is the new transport surface, and
  it is **Phase 2** (gated, §6).

**Why this is not "the sixth primitive" the discipline warns against.** The five primitives are all
operations on the **durable substrate**. `pscale_torus` touches no substrate — it is the first
operation on the **live axis**. The surface grows along a new dimension, not by accretion on the old
one. (If David rules it must count, the fallback is folding liveness into `pscale_pool_engage`'s
envelope — but that forces a beach round-trip per heartbeat, defeating the point. Recommended: a
distinct live-axis tool.)

## 5. Vocabulary (flagged crossings)

- **`torus`** — adopted as the tool/field name (David's biome language): the phase-space of
  overlapping live loops; a single call is a *beat* into it.
- **`vapour`** — already ours (out-of-band realtime). Crosses cleanly.
- **`grain` — COLLIDES.** `grain:` is already our durable, lock-gated bilateral *block*. Do not
  import the biome's "live grain." Reserve `grain` for the durable block; the live bilateral is a
  **reach**. The relational ladder then reads as the VLS staging itself: `marks → [live reach] →
  grain → sed` (reach = vapour; grain = the solid a held reach commits to via `pscale_grain_reach`).

## 6. The Railway-vs-Supabase verdict (the question you asked)

Investigated, not assumed. Three transport hosts, mapped against the two live modes:

| host | persistent conns / push | location-grouped | fan-out scaling | fit: human keypress | fit: LLM heartbeat |
|---|---|---|---|---|---|
| **Supabase Realtime** (current) | yes — managed WS broadcast | yes (channel = location) | managed, horizontal | **best** | works (LLMs don't need push) |
| **bsp-mcp / Railway** (in-process) | yes — persistent node, SSE | yes (key by location) | **single-node** fan-out | works ≤ medium scale; single-node cost at scale | **best** (in-process, free, location-keyed) |
| **beach / Vercel + Upstash** | **no push** (serverless) | yes (location = beach) | browser must poll | poor (poll ≠ keypress) | ok (round-trip-free) but no human half |

**Verdict (matches your rule "if Railway is less efficient, keep Supabase"):**

- **LLM heartbeat torus → bsp-mcp/Railway, in-process.** Ideal: LLMs poll by calling, so there is
  *no fan-out problem* — request/response, location-keyed, free. Build it (Phase 1).
- **Human keypress fan-out → keep Supabase Realtime.** A single Railway Node doing browser WS
  fan-out is functionally fine at small/medium scale but is *strictly less efficient* than Supabase's
  managed, horizontally-scaled broadcast — the §7.4.1 weakness (centralisation, single point of
  failure) applies to Railway too. So for the human half, Railway is the less-efficient option →
  **keep Supabase for now.**

This is exactly the spec's own sequencing (§7.4.4): commons/Supabase (bootstrap) → a federated
per-beach relay (the maturity step that moves vapour off the maintainer's bill) → mesh/WebRTC (the
privacy endgame). The federated relay (§7.4.2) is already fully specced in
`docs/protocol-pscale-beach-vapour.md` — its only blocker is a host that can hold connections, which
the Vercel beach is not and Railway is. So if/when we converge the human half, the Railway torus
*is* the §7.4.2 relay, hosted on the one persistent process we run.

**"Do both at the same time" — how it actually works.** Because §7.3 already defines one
location-keyed namespace, an LLM (via `pscale_torus`) and a human (via Supabase Realtime) at the same
location are addressing the **same field** under the same key — conceptually one torus, today carried
by two transports. So we *do* serve both now (LLM on Railway, human on Supabase), unified by the key.
Phase 2 only changes the human *transport* (Supabase → the Railway SSE route), not the model — and
only if the unification value beats Supabase's managed efficiency.

## 7. What it changes in the RPG (Phase 1 payoff)

Grounded against the live thornwood scene (anya + cyrus mid-conversation):

1. **The CONTEST window goes live instead of poll-detected.** `function:thornwood:2` gathers opposed
   intentions into a window and detects "joined" by *reading* liquid. With the torus the contestants
   are co-present live; the resolver wears the aperture *while both are reaching*, weaving in one
   live window. Seeded per-actor dice stay durable (the record); only the *gathering* goes live.
2. **It retires the async-presence fork** ("absent PC = auto-response vs late-join"). The torus
   needs only enough think-cycle overlap that *someone is always live to carry the scene*: early
   arriver engages NPCs (commits to the pool); later arriver catches up via the pool **and** sees
   who is live. An "absent" PC is just a handle not currently live — next think-cycle, live again.
   **Carry the soliton across overlapping liveness.** The cron becomes optional (a tempo-forcer
   below threshold).
3. **Afterglow = tempo, pscale-indexed.** `STALE_S` per frame: combat short (tight co-presence,
   minute-to-minute), strategy long (carry across hours). Pacing is the relay's decay setting at that
   pscale, a per-room dial — not a clock.

And at the beach broadly: the missing relational rung becomes experiential (live `reach` precedes
durable `grain`); presence becomes live, not just stigmergic marks (the `load`/`saturated` signal
finally means "who is here this think-cycle").

## 8. Phasing

- **Phase 1 — LLM torus on bsp-mcp/Railway.** `src/torus.ts` (the §3 register) + `src/tools/torus.ts`
  (`pscale_torus`) + registration in `server.ts` + a smoke test. Zero new transport (MCP
  request/response), location-keyed, no beach, no browser, no Supabase. Wire the RPG resolver to read
  the live window via `pscale_torus`; `play`'s perceive envelope can carry "who is live here now."
- **Phase 2 — converge human keypress (gated, recommended *deferred*).** Add the `/torus` SSE/WS
  route on the Railway process over the same §3 core; repoint xstream `realtime.ts` from Supabase to
  it (a one-file swap — scope + payload already match, Appendix A). Carries the single-node fan-out
  cost (§6) and couples xstream uptime to bsp-mcp. Take it only when the unification value is worth
  those — until then, **keep Supabase** for the human half.

## 9. Caveats (honest)

- **One shared relay host.** Co-presence requires both parties on the same torus host. That is the
  same centralisation Supabase has today (a single shared project) — moving to a single shared
  Railway relay is like-for-like on centralisation, and consolidates vapour under our own infra.
  True multi-host federation of the torus is the §7.4.2/§7.4.3 endgame.
- **Needs a persistent process.** Correctly empty under serverless; Railway/local-node only. (A
  narrow argument *for* Railway-as-architecture against CLAUDE.md's "Railway is convenience": the
  torus needs a process that lives between requests.)
- **Phase 2 couples xstream's live layer to bsp-mcp uptime** (today Supabase Realtime is
  independent), and puts browser fan-out on a single node (§6). Real trades for the conceptual unity.
- **No authority yet.** Handles in the torus are self-declared; vapour carries no lock. Authority
  accrues at the durable tiers (grain/sed locks), which is the right place for it.

## 10. Forks for David's ruling

1. **`pscale_torus` as a distinct live-axis tool** (recommended — beach-free, fast) vs fold into
   `pscale_pool_engage` (preserves the count; forces a beach round-trip per heartbeat).
2. **Vocabulary:** confirm **reserve `grain` for the durable block; live overlap = `reach`** (and
   `torus` for the field).
3. **Phase 2 timing:** build the human SSE route now (one relay for both, accept single-node
   fan-out + xstream coupling), or **defer and keep Supabase** for human keypress (the §6 verdict —
   recommended) and revisit at scale?
4. **Afterglow:** 30s default + per-pool `STALE_S` override in the room directive (the tempo dial)?

---

## Appendix A — xstream vapour wiring + the transport spec (verified 2026-06-28)

- **Current human-vapour transport:** Supabase **Realtime broadcast** (ephemeral pub/sub, persists
  nothing, **not the beach**) — `xstream-bsp/src/lib/realtime.ts`,
  `sb.channel(scope, {config:{broadcast:{self:false}}})`. Scope
  `vapour:<beach>:frame:<scene>:entity:<n>` / `vapour:<beach>:addr:<address>`; payload
  `{agent_id, face, vapour_text, ts}`; debounced per-keystroke in `Column.tsx`; self-echo
  suppressed. **Push** ("Vapor is push" — DESIGN-CHANNELS.md). Corrects the hypothesis: vapour is
  *not* beach/substrate-based — it is deliberately off-substrate.
- **The "Supabase relay" half-memory** is the *old* xstream-play kernel relay (`relay_blocks`
  Postgres table, polled via `/api/relay/...`) — **archived/dead** in the runtime
  (`docs/archive/README.md`). The only live xstream Vercel function is `api/filmstrip.ts`.
- **`happyseaurchin/api/beach-relay.js` is NOT a vapour relay** — it is a narrowly-scoped GET-only
  **CORS shim** for filmstrip-3d (happyseaurchin CLAUDE.md: "Don't widen beach-relay.js … a CORS
  shim, not an open proxy"). Don't conflate the name.
- **Canonical transport spec:** `bsp-mcp/docs/protocol-xstream-frame.md` §3.1 (vapour out-of-band)
  + §7.4 spectrum: **§7.4.1** Supabase commons (current default), **§7.4.2** per-beach WebSocket/SSE
  sidecar (`/.well-known/pscale-beach-vapour`, location/membership-grouped — *this is the "relay off
  the beach server" you remember*; full spec at `docs/protocol-pscale-beach-vapour.md`, present),
  **§7.4.3** WebRTC mesh (privacy endgame). §7.4.4 sequences them commons → federated → mesh.
- **bsp-mcp transport:** persistent `node:http` server, `StreamableHTTPServerTransport`, SSE,
  sessions persist until DELETE/restart (`src/index.ts`). Confirms Railway can host an in-process,
  push-capable torus.
- **Infra:** happyseaurchin beach = Vercel serverless + `@upstash/redis` (TTL state, **no persistent
  push**). bsp-mcp = Railway (persistent process, SSE). → the persistent-process relay home is
  Railway.

**Consequence:** because the scope key and payload already match the §3 core, Phase 2 is a one-file
swap in `realtime.ts` (Supabase `sb.channel` → an SSE/WS client against the Railway `/torus` route),
no change to `Column.tsx` or the payload. The core does not care that one peer is a human keystroke
and another an LLM heartbeat — the unification, concretely, under one location key.
