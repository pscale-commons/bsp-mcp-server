# Group / shared encryption — invite N to a private block

**Date**: 2026-06-02
**Status**: IMPLEMENTED 2026-06-02 (step 2a — create / invite / read; revoke deferred to 2b). Deterministic `smoke:group` 14/14; live `smoke:group-live` 16/16 (5 identities, owner creates + 2 members read + invite a 3rd, non-member excluded). Doc follow-up: a `block-conventions` catalogue entry for the group keyring (branches 1-9 are full — needs a supernest slot).
**Locus**: bsp-mcp only. No beach change.

## Goal

"Create a private block and invite others to it." Generalise self(1) → grain(2) → **group(N)**: a block whose content is encrypted to a shared **group key**, with that key wrapped to each invited member's published public key.

## Design

- **Group key K** — 32 random bytes (secretbox key). Content leaves are gray envelopes (new mode `group`) encrypted with K.
- **Keyring** at block position 9 — `{_: "group-keyring", 1: entry, 2: entry, ...}`. Each entry wraps K to one member via a **sealed box** (ephemeral keypair → `nacl.box` to the member's x25519): `{_: member_handle, 1: ciphertext, 2: nonce, 3: ephemeral_pub}`. Spine-legal.
- **Read** — the reader trial-unwraps each keyring entry with `deriveKeypair(enc_secret, entry._)`. Only their own entry opens (their secret + their handle = their real keypair; the entry was sealed to that pubkey). This is the same trial trick grain uses — so **no "who am I" parameter is needed**; the handle comes from the entry. Then K decrypts the content envelopes.
- **Create / invite** — the one operation that needs the member list: a new `members?: string[]` parameter. Create (no keyring yet): generate K, wrap to every handle in `members` (fetch their published pubkeys), write the keyring at 9. Invite (keyring exists): unwrap K, wrap to the new handles, append entries.

## Scope 2a (this change)

- **Owner-authored private group**: the block is locked with the owner's `secret` (write-protection); the owner writes content + manages the keyring; invited members **read**. (Member-writes — collaborative private, pool-shaped per-member slots — is 2b.)
- **No revoke/rotation** yet: removing a member needs a new K + re-encrypt of all content (a key-rotation state machine). Deferred to 2b. For now, to "remove" someone, create a fresh group block.

## Surface decision

**One new parameter, `members?: string[]`, on `bsp()`** — used only when creating or inviting. Content read/write reuse `gray` + `enc_secret`; group is detected by the keyring at position 9. This keeps the tool count at 7 (bsp + 6 primitives) — no new primitive — and treats "who may read" as a modifier, consistent with the project's prefer-modifiers-over-tools discipline. (A `pscale_group_engage` primitive was considered and rejected: the keyring is ordinary block content, not a beach-side atomic state machine like grain/sed; only revoke/rotation — 2b — would approach that bar.)

## Markers (spine-legal, distinct)

- Block is group-encrypted ⇔ `block[9]._ === "group-keyring"`.
- A leaf is an encrypted envelope ⇔ `leaf[9]._ === "gray"`; group mode ⇔ `leaf[9][1] === "group"`.

## Caveats

- **Trial-unwrap cost**: a read derives a keypair (Argon2id) per keyring entry until one opens — O(N·Argon). Fine for small groups; a future optimisation stores the member's pubkey in the entry + an optional handle hint to derive once.
- **Forward secrecy is bounded**: a removed member who cached old content keeps it; rotation (2b) only protects *future* content.
- Both the inviter and each member must have published keys (`pscale_key_publish` with their `enc_secret`).

## Tests

- Deterministic: K wrapped to N members; each unwraps with their own enc_secret; a non-member cannot; content round-trips under K.
- Live: owner creates a group block, invites two members, writes private content; both members read it; a non-member gets ciphertext.
