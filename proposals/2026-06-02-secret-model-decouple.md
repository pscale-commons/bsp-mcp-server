# Secret-model decouple — encryption key vs lock key

**Date**: 2026-06-02
**Status**: Implementing.
**Locus**: **bsp-mcp only.** No beach change, no migration.

## Problem

One `secret` does two jobs:
1. **Write-authority** (lock proof) — forwarded to the beach, which hashes it.
2. **Encryption-key seed** — `deriveKeypair(secret, handle)` for self/grain encryption.

For a **grain write** the secret is forwarded to lock your side, so the encryption seed rides to the beach. The beach stores only a hash, but the raw secret crosses the wire — a hostile host could capture it and decrypt your "private" content. (Self-gray is already safe: the secret is not forwarded.)

## Fix

Introduce **`enc_secret`** — the encryption identity, separate from the lock secret.

- `enc_secret` derives the keypair (for `pscale_key_publish`) and encrypts/decrypts (self + grain). **It is NEVER forwarded to the beach.**
- `secret` stays the write-authority / lock proof, forwarded exactly as today.
- When `enc_secret` is omitted it falls back to `secret` — **non-breaking**: single-secret users behave exactly as before; the host-trust gap is closed only when a distinct `enc_secret` is supplied.

**No beach change**: the beach still receives `secret`/`new_lock` for locks as before. `enc_secret` is purely client-side.

**Fresh slate**: `pscale_key_publish` was broken until 2026-06-01, so no published keys exist to migrate — the `enc_secret` model is defined cleanly from the start.

## Touchpoints (all bsp-mcp)

- `bsp()` — add `enc_secret`. Encryption/decryption use `enc_secret ?? secret`; locks use `secret`; `enc_secret` never enters the saveBlock POST body.
- `pscale_key_publish` — derive the published keypair from `enc_secret ?? secret`; passport:9 write-authority still uses `secret`.
- Sentinels — whetstone branch 3 (a fifth data-access modifier) + signature note.

## Guarantee (what makes it "more secure")

`enc_secret` never appears in any beach POST body. So the only privacy-relevant value the beach ever sees is ciphertext — the lock value it receives cannot decrypt anything.

**Demonstrated:**
- Deterministic: the lock secret does NOT derive the encryption key; decrypting with the lock secret fails; only `enc_secret` decrypts.
- Live: two-party grain (alice↔bob) with decoupled secrets — the partner decrypts with their `enc_secret`; the lock secrets that were sent to the beach cannot.

## Caveat

The fallback means a user who omits `enc_secret` is NOT host-proof (same as before). Host-proof privacy requires supplying a distinct `enc_secret` and publishing keys with that same `enc_secret`. Clients that want the guarantee (xstream, soft-agent) should always pass it.
