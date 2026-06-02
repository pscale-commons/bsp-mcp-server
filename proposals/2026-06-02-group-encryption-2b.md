# Group encryption 2b — co-write, larger groups, remove

**Date**: 2026-06-02
**Status**: IMPLEMENTED 2026-06-02. Deterministic `smoke:group` 24/24 (incl. 10-member chained keyring + rotation); live `smoke:group2b-live` 11/11 (co-write, chained keyring, remove-with-rotation); `smoke:group-live` 16/16.
**Locus**: bsp-mcp only. No beach change.

Builds on 2a (keyring at position 9, content gray-encrypted with a group key K).

## 1. Co-write (members write, not just the owner)

Content-only group writes become **surgical** (per content slot) instead of whole-block. Two members writing different slots no longer clobber each other; each encrypts with K (unwrapped from their keyring entry). Membership ops (a `members` write) stay whole-block.

## 2. Larger groups (past 9)

The flat keyring capped at 9 (spine keys are only 1-9). Now the keyring **chains**: 8 entries per page at positions 1-8, position 9 = a continuation page (same shape). `buildKeyring(wraps)` lays out any N; `unwrapGroupKeyFromKeyring` and `keyringHandles` recurse through the chain. Reading also tolerates a legacy slot-9 *entry* (a 2a 9-member group).

## 3. Remove someone (rotation)

`members` is the **declarative full read-list**. On a membership write the handler diffs it against the current keyring:
- **additions only** → re-wrap K to the desired set (cheap; no content change).
- **any removal** → **rotate**: generate K', re-encrypt all stored content from K to K', and rebuild the keyring wrapping K' to the remaining members. The removed member, who only knows K, can no longer read the (now K') content.

So create / invite / remove are all one `members` write — declarative, no new parameter.

## Lock model (deliberate)

2b group blocks are **unlocked** — privacy is via K only, and membership is **flat**: any member can invite or remove (they all hold K and can rotate). This is the *privacy* axis. Substrate *protection* (owner-locked keyring so only an admin manages membership, per-slot content locks against vandalism) is the orthogonal axis, deferred. Non-members can neither read nor forge valid keyring entries (no K); a non-member could overwrite a slot with junk (denial), not steal or join — noted.

**Forward secrecy is bounded**: rotation re-encrypts *stored* content (removed member loses it), but anything they already read/cached is theirs — unavoidable, as in any group.

## Tests

- Deterministic: a 10-member chained keyring (all unwrap; handles enumerated); rotation removes a member's access while remaining members keep it.
- Live: two members co-write different slots and both read all; invite past 8 (chained keyring) and the 9th+ read; remove a member → they can no longer read, the rest still can.
