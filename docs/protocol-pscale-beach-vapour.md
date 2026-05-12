# Pscale Beach Vapour Protocol

**Status**: Draft, 12 May 2026
**Companion to**: [protocol-pscale-beach-v2.md](protocol-pscale-beach-v2.md), [protocol-xstream-frame.md](protocol-xstream-frame.md)
**Author**: David Pinto with Claude

---

## 0. Reframe in one paragraph

The pscale-beach-v2 protocol covers everything the substrate commits to — marks, passports, frames, pools, sed: collectives, grain: channels — read and written through `/.well-known/pscale-beach`. It deliberately does not cover the ephemeral layer above the V-L-S boundary: keystrokes that two collaborators send each other in real time before either commits anything to liquid. That layer is **vapour**. Vapour is allowed to be lossy, ephemeral, and unaudited (protocol-xstream-frame.md §3.1); it carries pre-commitment thought. This document specifies a federated transport for vapour — `/.well-known/pscale-beach-vapour` — co-hosted with the beach. The intent is to pull vapour off the shared Supabase Realtime commons (Level 0 / project-maintainer cost) and put it where it architecturally belongs: at the beach, scoped per-beach, paid for by the beach operator, gated by the same face authorisation the beach already enforces for ordinary writes.

---

## 1. The five decisions

| # | Decision | What it rules out |
|---|---|---|
| 1 | Vapour transport is co-hosted with the beach handler, not separately addressed | A standalone vapour-relay service |
| 2 | Channel scope mirrors the client-side scope used today (face + frame/address) | Server-side proximity overrides |
| 3 | Authorisation is by `sed:<scope>-<face>` membership, checked at subscribe time | Channel-name-as-secret |
| 4 | Vapour is drop-tolerant: no delivery guarantee, no persistence | Backfill on reconnect |
| 5 | Observer face is refused at subscribe time, returning HTTP 403 | Per-message filtering |

These are wire-frozen; everything else (transport choice, payload schema details, ping/pong cadence) is operator-determined.

---

## 2. The endpoint

```
wss://<beach-origin>/.well-known/pscale-beach-vapour
```

WebSocket upgrade on the same origin that serves the beach. The same `Cache-Control: no-store` discipline applies as on the GET/POST handler. An operator who cannot host a WebSocket on their hosting tier may host an SSE+POST pair instead (see §6); the channel namespace and authorisation rules are unchanged.

### 2.1 Connect-time parameters

The client opens the WebSocket with query parameters that establish the subscription:

```
?face=character&frame=tavern-001&address=&handle=brisa&secret=<one-time>
?face=author&frame=&address=12.3&handle=davidp&secret=<one-time>
```

| Param | Meaning |
|---|---|
| `face` | `character` \| `author` \| `designer` (Observer is refused) |
| `frame` | Scene id when in-frame; empty for free-roam |
| `address` | Coordinate when free-roam; empty for in-frame |
| `handle` | The handle the subscriber claims |
| `secret` | One-time challenge nonce — see §3.1 |

The server derives the channel name from `(face, frame OR address)` exactly as the client does in `src/lib/realtime.ts`:

```
vapour:<beach-origin>:<face>:frame:<scene-id>     (in-frame)
vapour:<beach-origin>:<face>:addr:<address>       (free-roam)
```

There is exactly one channel per (face, scope). All authorised subscribers for that channel see all broadcasts on it.

### 2.2 Wire frames

After the upgrade succeeds, both directions speak the same broadcast frame:

```json
{
  "type": "vapour",
  "agent_id": "https://example.com",
  "face": "character",
  "vapour_text": "I scan the rafters for archers.",
  "ts": 1715515200000,
  "entity_position": "1"
}
```

The server fans incoming frames out to all other subscribers on the same channel — never to the broadcaster (loopback suppression at the server, matching `broadcast: { self: false }` in the current Supabase code).

Heartbeat: server pings every 30s; client responds with pong. Idle channel cleanup: server drops a subscriber after 90s of no traffic in either direction. Both numbers are operator-tunable.

---

## 3. Authorisation — face-by-face

### 3.1 Admission proof at the upgrade

Before fanout, the server must verify the subscriber holds the face they claim. Three layers, in order of strictness:

**Layer 1 — admission claim**: client must hold a non-empty `passport:<handle>:8` admission claim (the L1→L2 gatekeeper output). Server reads passport:8, checks it exists. Anonymous handles (`anon-*`) are refused for face channels.

**Layer 2 — `sed:` membership**: server reads `sed:<scope>-<face>` and checks the subscriber's handle is registered at one of its positions. Scope is derived from face:

| Face | sed: collective consulted |
|---|---|
| Character | `sed:<scene-id>-cast` (in-frame) or `sed:<beach-origin>-cast` (free-roam) |
| Author | `sed:<doc-id>-authors` (in-frame) or `sed:<beach-origin>-authors` (free-roam) |
| Designer | `sed:<scope>-designers` |
| Observer | — (refused at Layer 1) |

The scope id is part of the connect-time `frame` or `address` param. The server need not store a session — every subscribe re-checks membership.

**Layer 3 — passphrase challenge** (optional, operator-elected): the `secret` query param is the subscriber's `bsp()` passphrase for their position in the relevant `sed:` collective. Server hashes-and-compares against the sed: position's lock. Closes the gap where a stolen passport-claim could subscribe under a borrowed handle.

Layers 1–2 are minimum viable. Layer 3 is recommended for any beach hosting designer-face channels (the highest-authority face).

### 3.2 Failure responses

Upgrade rejects with a short JSON body and a relevant HTTP status:

```
HTTP/1.1 403 Forbidden
Content-Type: application/json

{"error":"observer face has no vapour aperture","code":"face_no_aperture"}
```

```
HTTP/1.1 401 Unauthorized
{"error":"not registered in sed:scene:tavern-cast","code":"not_member"}
```

```
HTTP/1.1 401 Unauthorized
{"error":"admission claim missing at passport:davidp:8","code":"not_admitted"}
```

Clients render these as the same `vapourStatus` they render for `no-transport` today (see `Column.tsx`).

---

## 4. Drop-tolerant semantics

Vapour is allowed to drop. The server provides:

- **No persistence**. Messages live only in transit. A subscriber that joins after a broadcast does not receive it.
- **No ordering guarantee across channels**. Within a channel, messages are delivered in send order to each subscriber; across channels they may interleave arbitrarily.
- **No retry**. If a fanout to one subscriber fails, that subscriber drops; the server does not buffer-and-replay.
- **No backfill on reconnect**. On a `wss://` reconnect, the client starts subscribing fresh; whatever it missed is gone.

These match the existing Supabase Realtime broadcast semantics — clients porting over should not need to adjust their drop tolerance.

---

## 5. Channel-scope examples

```
Character at scene tavern, cast member Brisa
  vapour:beach.happyseaurchin.com:character:frame:tavern-001

Author working on document at address 12.3
  vapour:beach.happyseaurchin.com:author:addr:12.3

Designer revising the tabletop skill, free-roam
  vapour:beach.happyseaurchin.com:designer:addr:skill-pack:tabletop

Anonymous tab on a character channel — REFUSED at Layer 1
```

Cross-beach: vapour does not cross beaches. A character at beach.happyseaurchin.com does not see vapour from a character at beach.idiothuman.com even if the scene id collides — the beach origin is in every channel name.

---

## 6. SSE fallback for hosts that can't WebSocket

Operators on tiers without WS support (some Vercel plans, plain Cloudflare Pages without Workers, etc.) host two endpoints instead:

```
GET   /.well-known/pscale-beach-vapour-sse?face=...&frame=...&handle=...&secret=...
        — server-sent events stream, same wire frames as §2.2
POST  /.well-known/pscale-beach-vapour-post
        — body: { face, frame OR address, handle, secret, vapour_text, entity_position }
        — server fans out to SSE subscribers on the matching channel
```

Same channel namespace, same authorisation. Higher per-message overhead (one HTTP POST per keystroke debounce); recommended only when WS is genuinely unavailable.

---

## 7. Migration from the Supabase commons relay

The xstream client today (`src/lib/realtime.ts`) targets Supabase Realtime broadcast on the shared `piqxyfmzzywxzqkzmpmm` project. The migration runs in three stages, gated by a per-beach setting:

### 7.1 Stage 1 — dual-write

Client tries to open `/.well-known/pscale-beach-vapour` on the active beach. On 404 / connection refused / unsupported, fall back to Supabase Realtime with the existing scope. Broadcasts go to both transports when both connect; subscribers receive duplicates (dedup by `(agent_id, ts)`).

Beaches that have not deployed the vapour endpoint continue to work via the commons relay. Beaches that have, prefer their own endpoint.

### 7.2 Stage 2 — flip default

Once an operator has run vapour traffic through their own endpoint for a tide cycle and is satisfied, they set a beach-level setting (e.g. `settings:1.4` — vapour-transport-preference) to `local`. Clients on that beach skip Supabase Realtime entirely. Beaches without the setting stay on `commons`.

### 7.3 Stage 3 — drop the commons

When enough beaches have flipped to `local`, the project drops the Supabase Realtime dependency from xstream-bsp's bundle. `getSupabase()` stays for auth/cloud-save (separate concerns); the realtime channel path is deleted.

The Supabase project itself (`piqxyfmzzywxzqkzmpmm`) continues to back auth and cloud-save for as long as those features need a commons store — those features are not pscale-native and will migrate to passport blocks on a separate schedule.

---

## 8. What is and isn't in bsp-mcp

bsp-mcp does **not** host this endpoint. It is the beach operator's responsibility, the same as the GET/POST handler. bsp-mcp's role is:

- Declare the protocol (this document).
- Make sed: membership readable via `bsp()` so beach handlers can implement Layer 2 authorisation by walking the same substrate.
- Make passport admission claims readable so beach handlers can implement Layer 1.

The endpoint itself is just another route in the operator's beach package (e.g. `pscale-beach/api/pscale-beach-vapour.js`).

---

## 9. Open questions

- **Server-side perception filter for Character face.** §5.1 of protocol-xstream-frame.md describes line-of-sight / knowledge overlay rules per scene-skill. Should the vapour server consult the scene-skill block before fanning out, narrowing the audience per scene-defined proximity? Or does that filtering stay client-side (subscribe to scene channel, drop unseen by the scene-skill on receive)? Server-side is cleaner but couples the transport to scene semantics.
- **Designer face authorisation when no `sed:` exists yet.** Some early-stage design work happens before a `-designers` collective is registered. Bootstrap path needs convention.
- **Rate-limiting.** A misbehaving subscriber could flood a channel. Per-handle rate limit at the server, per-channel ceiling, or trust the network and rely on operator-level blocklists?
- **Vapour-to-liquid coalescing remains application-side.** The transport delivers raw keystroke deltas; the client decides what counts as an accepted liquid commit. Unchanged from protocol-xstream-frame.md §11.

None are blockers for the minimum viable endpoint. Sections 2–4 are the wire-frozen surface; the rest is operator policy.
