# Encryption / privacy — Phases 0-2

**Date**: 2026-06-01
**Status**: IMPLEMENTED 2026-06-01 (bsp-mcp; build + tests green; **not yet deployed to Railway**). See §9b for what shipped and what's flagged. Scope, trust model, terminology, and grain lifecycle confirmed with David 2026-06-01.
**Locus**: **bsp-mcp only** (the Railway service). The federated beaches and the `pscale-beach` package do **not** change. No coordinated multi-repo PR, no Vercel redeploy, no wipe, no data migration.

---

## 1. Problem

`gray` is broken end-to-end, and the public-private key system was never wired.

- The gray envelope is `{_gray: true, ciphertext, nonce}`. Every key (`_gray`, `ciphertext`, `nonce`) is a bare/`_word` key. The beach shape gate `validateShape` (`pscale-beach/api/pscale-beach.js:385`, applied on write `:816`) rejects any key that isn't `_` or `1`-`9` → **HTTP 400 `invalid_shape`**. So even *solo* gray fails against any beach. It has been broken since the 8 May 2026 beach-as-surface migration (gray predates the gate; nothing exercised it until now; there is no round-trip test).
- `encryptForRecipient` / `decryptFromSender` exist in `src/keys.ts` but are **dead code** — never imported, never called.
- Published `passport:9` pubkeys are consumed by nothing except the key-rotation self-check.
- Secondary leak: on a gray write the lock `secret` (which is also the encryption seed) is forwarded to the beach (`src/db.ts:419`).

## 2. Terminology (David's)

- **protection** = access-control: locks + face. Server-enforced; plaintext at rest; trust the beach operator.
- **privacy** = visibility: gray / encryption. Cryptographic; ciphertext at rest; the beach operator cannot read.

Reads are open by default and `face` is a bsp-mcp-layer check (bypassable by a direct beach `curl`), so **encryption is the only mechanism that gives real read-privacy on an open federated beach.** Confirmed trust model: the beach operator is in scope as an adversary → encryption is required, not access-control.

## 3. The root fix — make the envelope spine-legal (Phase 0)

Encryption is client-side at bsp-mcp; the beach only ever stores blocks. The single reason it breaks is the non-spine envelope. Re-author the envelope as `_` + digits and the existing gate accepts it untouched — and a walker without the secret sees structure with opaque content, which *is* "privacy without secrecy of existence" (sunstone:8.3).

### Canonical encrypted-envelope shape

A gray leaf becomes a sub-block. The marker is at position 9 (reusing the "9 = metadata" convention), so detection is unambiguous and spine-legal — `node["9"]?.["_"] === "gray"`.

```jsonc
// self  (Phase 1)
{
  "_": "Encrypted; readable only with the author's secret.",
  "1": "<ciphertext b64>",
  "2": "<nonce b64>",
  "9": { "_": "gray", "1": "self" }
}

// grain  (Phase 2) — shared-key; partner handle tells the reader whose pubkey to combine
{
  "_": "Encrypted; readable by the two grain parties.",
  "1": "<ciphertext b64>",
  "2": "<nonce b64>",
  "9": { "_": "gray", "1": "grain", "2": "<partner handle>" }
}
```

Every key is `_` or `1`-`9`. Base64 never starts with `{`/`[`, so the gate's stringified-object check can't trip on the ciphertext either. Detection: `9._ === "gray"`; mode at `9.1` (`"self"` | `"grain"`).

### Beach: no change

`validateShape` already accepts this on standard writes (`:816`) and on grain `my_side_content` (`:754`). Reads return the envelope opaque; bsp-mcp decrypts after fetching. Per-position locks are orthogonal and unaffected.

## 4. Phases

### Phase 0 — spine-legal envelope + round-trip test
- `src/keys.ts`: `selfEncrypt` returns the new shape; `selfDecrypt` and `decryptBlockNodes` read it; detection via `9._ === "gray"`.
- `src/tools/bsp.ts`: write the new envelope; on read, detect-and-decrypt the new shape.
- **Test (the thing that was missing)**: a round-trip through the live path — MCP write → beach store → MCP read-with-secret → plaintext; read-without-secret → opaque. This is what would have caught the regression; add it to `scripts/`.

### Phase 1 — solo gray (private-to-me ordinary blocks)
- With Phase 0 done, self-encryption works. Stop forwarding the secret to the beach on a gray write to an unlocked block (`src/db.ts:419`) — the encryption key must not leave the client.
- Update the spec sentinel `whetstone:3.4` (and `sunstone:5.4`) to the corrected behavior.

### Phase 2 — bilateral grain (private by default)
- **Shared grain key.** Both parties derive one symmetric key via ECDH between their published keypairs — `DH(my_x25519_secret, partner_x25519_public)`, identical for both — and secretbox with it. So *both* parties read *both* sides; outsiders can't. (This is cleaner than the one-way `encryptForRecipient`, which only the recipient could open: the per-side write-lock already proves authorship, and secretbox authenticates integrity, so no separate signature is carried.)
- **Grain writes default to private** (gray to the shared key). bsp-mcp resolves the partner from the grain block (it names both parties) and fetches their x25519 from `passport:9` (reuses the existing `getPublicKeys` beach read). `gray:false` writes in clear if a party explicitly wants public at creation.
- Read: a party reads with their own secret → derives the shared key (partner handle carried at `9.2`) → secretbox.open.
- **degray (publish).** The inverse of gray: read with secret → decrypt → write the plaintext back with `gray:false`. Either party can degray their **own** side — they can read it via the shared key and hold that side's write-lock — but not the partner's. Already expressible as read-then-write-public on the existing surface; no new primitive.
- **Precondition**: both parties must have run `pscale_key_publish`. If the partner has no published key, **hard-fail with a clear message** — "partner `<x>` has not published keys; cannot curate privately. They run `pscale_key_publish`, or write with `gray:false`." (Silent plaintext fallback rejected — it would make a "private" channel silently public.)

## 5. Signature / API change

Minimal. The `gray` parameter stays. Behavior:
- Ordinary block + `gray:true` → self-encrypt (Phase 1).
- Grain block (write) → private **by default** (shared grain key); `gray:false` opts out to public (Phase 2).
- **degray** = read-with-secret then write with `gray:false` — the inverse of gray; no new parameter or primitive.

No new top-level parameter is required for 0-2. (Explicit "encrypt this ordinary-block leaf to handle X" — recipient encryption *without* a grain — is deliberately out of scope; it is a grain-shaped use that should go through a grain.)

## 6. Grain privacy lifecycle (resolved 2026-06-01)

Default **private** at grain creation. Two public paths, both light because **gray and degray are symmetric inverse operations** (read-transform-write, either direction, any time):

- **Public at creation** — write with `gray:false`.
- **Degray later** — read with secret, decrypt, write the plaintext back public. Either party degrays their own side (shared-key readability + per-side write-lock); not the partner's.

Forward-publish property (noted, not a blocker): degray puts plaintext on the open beach; re-graying re-privates *future* reads but cannot recall what was read while public. Inherent to "make public."

(This replaces the earlier A/B framing — "(B) commit-in-place" was just degray; it needs no special machinery and is not tied to the V-L-S flip.)

## 7. What does NOT change

- `pscale-beach` package — untouched.
- Deployed beaches (beach.happyseaurchin.com, beach.idiothuman.com) — untouched; they already accept the spine-legal envelope.
- No data migration: no `{_gray}` data ever passed the shape gate onto a beach. Clean slate.
- Phase 3 (group / pool / sed:) — deferred, and largely **not wanted**: sed: is public by design; privacy is a grain property. sed = public trust-sharing; grain = private network. Only residual is private pools — a separate question.

## 8. Test plan

- `scripts/smoke-gray-roundtrip.ts` — Phase 0/1: write self-encrypted leaf, read back with secret (plaintext), without secret (opaque), with wrong secret (`[encrypted]`). Against a live beach so the shape gate is exercised.
- `scripts/smoke-grain-private.ts` — Phase 2: two keypairs; party A writes grain side encrypted-to-B; B reads → plaintext; third party reads → opaque; A reads own write → plaintext.
- Shape assertion: every persisted envelope passes `validateShape` (no bare keys).

## 9b. Implementation status — shipped 2026-06-01

All in bsp-mcp. Build clean; `npm run smoke:gray` 20/20; parser 101/101 and bsp unit 23/23 unregressed. Not yet deployed to Railway. Live end-to-end available via `npm run smoke:gray-live` (writes to beach.happyseaurchin.com + Upstash cleanup — run deliberately).

**Shipped**
- Spine-legal gray envelope `{_, 1: ciphertext, 2: nonce, 9: {_: 'gray', 1: mode, 2?: partner}}` (`src/keys.ts`); detection at `9._ === 'gray'`.
- Self-encryption (Phase 1) + secret-leak fix: a self-gray write to an unlocked ordinary block no longer forwards `secret` to the beach.
- Grain bilateral shared-key (Phase 2): grain writes private by default, `gray:false` for public; reads trial-decrypt both party perspectives. degray = read-with-secret then write `gray:false` (no new code).
- **Discovered + fixed: `pscale_key_publish` was broken by the same bug** — it wrote a bare `{x25519, ed25519}` object at passport:9, rejected by the shape gate. Now writes spine-legal `{_, 1: ed25519, 2: x25519}`; readers tolerate the legacy shape. **Phase 2 could not work without this** (grain encryption fetches partner keys from passport:9).
- Sentinels updated (whetstone:3.4, sunstone:5.4, block-conventions:1.9). Tests: `scripts/smoke-gray.ts` (deterministic) + `scripts/smoke-gray-live.ts` (live; rewritten from a stale prior-session test that asserted the old `_gray` shape and was never wired into npm scripts — which is how the rot went unseen).

**Flagged (decision or follow-up)**
- **Constraint**: a grain side secret MUST equal the secret used to publish keys under that handle (one secret per agent), or the shared key diverges.
- **Residual leak**: grain writes still forward `secret` to the beach (it locks the side). Fully closing it needs decoupling the encryption seed from the lock secret — a separate secret-model decision.
- **grain_reach establishment content** (`my_side_content` via the primitive) is still plaintext; only bsp() curation writes encrypt. Encrypting at reach needs the partner's key to exist at reach time.
- **Cross-beach**: partner-passport lookup uses the default beach (`getPublicKeys`); a grain plus both passports are assumed on the default beach.
- **Locked ordinary + self-gray**: secret-suppression means a self-gray write to a *locked* ordinary block now errors (spec says gray is unlocked-only).
