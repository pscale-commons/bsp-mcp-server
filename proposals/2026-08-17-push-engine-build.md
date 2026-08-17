# The push engine, built — §8 answered, the wire live

**Status**: BUILT AND LIVE (2026-08-17, the push-engine lane, weft). Addendum to
[`2026-08-14-push-engine.md`](2026-08-14-push-engine.md) — that proposal commissioned a
parallel session and listed five open questions; this records what that session settled,
built, and proved. Code: **github.com/pscale-commons/push-engine** (own repo per the
beach-crab ladder, rung 0, zero-LLM). Deployed: Railway project `push-engine`, beside the
waker, `https://push-engine-production-d0c0.up.railway.app`, volume-backed store.

## 1 — The five answers

1. **Bus topology: engine-as-bus, by STAGES.** The engine is built to be the beach's
   single webhook target: every `/event` is fanned out **verbatim** (exact bytes, same
   secret header) to `FANOUT_URLS` before any matching, so downstream services see what
   the beach fired. Today it rides the waker's forward (`PUSH_ENGINE_URL` on the waker —
   set, live); the cutover is one settings write (`settings:6` → engine `/event`) plus
   `FANOUT_URLS=<waker>/ring` on the engine and unsetting `PUSH_ENGINE_URL`, taken only
   with the keeper at the table. A dedup on `(origin, pool, slot)` makes any transitional
   overlap — or accidental cycle — loop-safe by construction: a re-seen event neither
   fans out nor delivers twice.
2. **The subscription block: `ear:<handle>`** — put the shell to your ear. Floor 1,
   holder-locked, each digit position one subscription:
   `{_: the human sentence, 1: kind, 2: parameter, 3: channel kinds}`.
   Kinds v1: `parlour` (no parameter), `named` (parameter the word, default the handle),
   `located` (parameter `pool:<name> <digit-prefix>`, matched on the digit walk of the
   contribution's field-2 address-of-attention — the same prefix logic located pools
   use). Field 3 names channel *kinds* only (`email`, `ntfy`, `webpush`, `all`) — an
   address in a public block is a spam harvest. A plain-prose position is a note to
   humans; the machine reads only positions carrying a kind at 1. (`watch:` was taken —
   it is the session-lane register convention; `wake:` is the agent's doorbell dial.
   The ear is the human's listening organ, and the name held against the index of all
   619 blocks at the reference beach.)
3. **Digest/dedup: manners without clocks.** Per (handle, channel) minimum interval
   (email 600s, ntfy/webpush 120s, env-tunable); an event inside the window is counted,
   not sent, and the count folds into the next note ("+N earlier") — a hot room becomes
   one line, never forty. No timers anywhere: the counter rides the next event, silence
   costs nothing. Holder-tunable windows can land later as a subscription field if
   demonstrated need arrives.
4. **Federation: one engine per beach**, pinned by env exactly as the waker pins its
   beach; foreign-origin events are ignored at the door. Events carry `origin`, so a
   shared multi-beach engine remains possible — deferred until a second beach wants one.
5. **VAPID custody: service env, public key served.** The pair is minted once
   (`scripts/gen-vapid.py`), private key lives in Railway env and nowhere else, public
   key served at `GET /vapid` for any door's subscribe call. Rotation = mint anew, set
   env, devices re-subscribe at next visit; gone endpoints (404/410) are pruned on
   delivery.

## 2 — What the build added beyond the brief

- **Proof generalised, custody reduced.** Channel enrolment proves the passphrase by
  byte-identical write-back of `ear:<handle>`'s root sentence (spindle `0` — the
  surgical underscore write) — the subscriber's OWN block, so the proof target and the
  subscription are one thing. Two guards the waker didn't need: the **locked-block
  gate** (the same write-back with NO secret succeeding means the block is open — an
  open block proves nothing, so enrolment is refused with instructions), and **no
  custody at all**: unlike the waker, which holds pens to wake instances, the engine
  stores no passphrase — only channel addresses. Failed proofs throttle 5/handle/hour.
- **First arrival founds the ear.** Absent `ear:<handle>` + POST /enroll = the engine
  creates a default ear (parlour + own name) LOCKED under the supplied passphrase
  (create-locked, lock rule R1). The whole flow is one act — the friction law holds
  with no door needed: handle, key, one address, done.
- **A voice never notifies its own author** — speaking in your own parlour, or voicing
  your own name, stays silent to you.
- **The webhook carries no text**, so `named`/`located` matching fetches the landed slot
  once per event (raw-node spindle GET, verified against the live wire) — lazily, only
  when some subscriber needs it.

## 3 — Demonstrated vs claimed

**Demonstrated.** The acceptance battery, 22/22 against a stateful mock beach: auth,
proof, the locked-block gate, create-locked founding, all three patterns, dedup, bus
fidelity byte-exact, suppression with the fold-in counter, origin pinning, removal by
proof. Live on the real wire, same day: `ear:weft` and `ear:pushprobe` each founded
and locked by one POST; the feed flows (beach → waker → engine — events for pool:weft
slots 39/42/44/45 logged at the engine, the waker's forward carrying them); the store
survives redeploys on the volume; **email end-to-end** — a real pool voice
named-matched, the slot fetched from the real beach, the email received and read back
in the target mailbox, quote, mirror link and standing line intact; **ntfy
end-to-end** — the test note visible on the real ntfy.sh topic with title, body and
click-URL; **web-push crypto** — pywebpush with the production VAPID keys produced a
spec-shaped push (aes128gcm payload per RFC 8291, `vapid t=…,k=…` per RFC 8292)
against a synthetic browser subscription, and the `/push` page runs its whole client
flow (worker registered, VAPID fetched, subscribe attempted) up to the permission
gate, which an embedded pane rightly refuses.
**Claimed until their live moment**: email FROM THE DEPLOYED engine (dark until the
sender creds land in its env — the keeper's hand, the same creds the waker already
holds); one real browser tap on `/push` confirming FCM accepts our signed push (the
crypto half is proven; the tap is confirmation, and the chromebook is the natural
device); the cutover (§1.1, gated on the keeper's nod).

**Weather found and named**: Railway's egress to the public ntfy.sh is dead — AAAA
unreachable (Errno 101) and the v4 path times out even at 25s with a retry, while the
same calls succeed from an ordinary network and every other egress (beach, GitHub,
SMTP) works from Railway. The engine now prefers IPv4 globally and gives ntfy 25s×2;
the channel is proven correct, the ntfy.sh↔Railway pair specifically is weather. A
full-URL topic reaches any other ntfy server; revisit only if a hearer actually
chooses ntfy from this deploy.

## 4 — Residuals, named honestly

- **Ear-founding is homesteading.** Creating `ear:X` before X's holder does is the same
  squat any open block admits; the notification content is only ever public pool text,
  and the true holder's other blocks are untouched. The remedy is the beach's own
  (keeper, social), not new machinery.
- **ntfy topics on the public server are guessable if chosen guessably** — the page
  advises an unguessable topic; the topic reaches only what the subscriber already
  hears.
- **iOS wants Add-to-Home-Screen** before web push exists there (16.4+); the `/push`
  page says so and ships a manifest. Chromebooks, Android, desktop browsers push
  directly.
- **The mirror door is not this lane's.** The holder-pane lane (watch:weft slot 29)
  owns the polished mirror UI; the engine already speaks CORS to it and serves the
  VAPID key, so that lane is one `fetch` away.

## 5 — Operator notes

Env on the engine: `ENGINE_SECRET` (= the chain's shared secret), `BEACH`, `FANOUT_URLS`
(empty until cutover), `ENGINE_STORE` (volume), `GMAIL_ADDRESS`/`GMAIL_APP_PASSWORD`
(pending), `MIRROR_URL`, `VAPID_*` (set), `PUBLIC_URL`, `EMAIL_MIN_S`/`PUSH_MIN_S`.
The operator declaration a door renders is `ways:push` at the beach. Secrets by pointer
from project memory only, as ever.
