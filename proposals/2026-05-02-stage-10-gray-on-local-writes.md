# Stage 10 — gray-encryption on bsp-mcp's local write path (orthogonal to lock state)

**Author**: interactive Weft session, 2026-05-02
**Surface**: bsp-mcp-server (`tools/bsp.ts`, `scripts/smoke-gray.ts`)
**Type**: substrate fix + design clarification
**Status**: code + smoke shipped 2026-05-02. Files local-only at `~/Projects/bsp-mcp-server/`; not committed, not pushed. Railway runs previous code until David lands. Federated smoke (17/17) passed against live happyseaurchin.com end-to-end.
**Companion to**: nothing on the roadmap currently; surfaced from a stash-block design exercise that exposed the gap

---

## TL;DR

`bsp()`'s `gray` parameter is currently a **no-op on local Supabase reads and writes**. Both `selfEncrypt` and `decryptBlockNodes` are defined in `keys.ts` but **never called from any path** in `tools/bsp.ts`, `db.ts`, or `bsp-fn.ts`. The flag IS forwarded to federated beaches in the POST body (`db.ts:218`), but for the canonical commons-Supabase backend, gray content cannot be produced or rehydrated via `bsp()` at all — it can only be produced via the legacy `pscale_write` tool on the pscale-mcp-server, which applies gray server-side, and read via `pscale_walk` which decrypts server-side.

This proposal wires both halves into `tools/bsp.ts`:
- **Write side**: `bsp(... content=..., secret=..., gray=true)` produces a `{_gray, nonce, ciphertext}` envelope at the target leaf — **regardless of lock state**. Lock and gray are orthogonal concerns: lock = write authority, gray = content opacity. They compose.
- **Read side**: `bsp(... secret=...)` walks the loaded block through `decryptBlockNodes` before passing to `bspRead`, so gray envelopes anywhere in the tree are rehydrated to plaintext for the caller. Reads without a secret return raw envelopes (existing behaviour preserved).

The fix is small (~60 lines of tool-layer logic plus tests). It closes a real architectural gap that surfaced when designing a "private + locked" runbook stash — the discovery being that the substrate's geometry (the `_gray`/`nonce`/`ciphertext` envelope shape, recursive decrypt-walk in `keys.ts:decryptBlockNodes`) already supports gray envelopes anywhere in the tree. The geometry is already designed for it; only the tool wiring is missing.

---

## 1. Background — what gray is, what it isn't

`keys.ts:225-250` (`selfEncrypt`) wraps any content into a structural sub-object:

```json
{
  "_gray": true,
  "nonce": "<base64 nacl-box nonce>",
  "ciphertext": "<base64 nacl-box ciphertext>"
}
```

`keys.ts:274-290` (`decryptBlock`) recursively walks any block on read, finds nodes matching the envelope shape, decrypts in place using the caller's secret, and returns a tree where every gray leaf has been rehydrated to its original content. **Gray is a transparent layer** — it preserves block geometry on disk; reads with the secret restore plaintext as if encryption never happened.

This means gray content is a **first-class pscale block** in every operational sense:
- Walkable: bsp() can address into it (with the secret) and get plaintext back.
- Composable: a tree can have gray and plaintext leaves mixed at any nesting depth.
- Compactable: structural moves (e.g., 1..9 cycling to 1.1..1.9) preserve the envelope as just-another-subtree; the close-summary at the new spine level is plaintext, leaves stay gray. Two-tier privacy emerges naturally — public spine, private leaves.

The geometry is already in place. The current gap is just: **bsp-mcp's local write path doesn't invoke `selfEncrypt`.**

## 2. Diagnosis — what the code actually does today

### 2.1 `tools/bsp.ts` write path (`handleBsp`, lines 151-243)

1. Destructures `content, secret, new_lock, face, tier` (line 152) — `gray` is referenced later via `params.gray`, but never used to gate encryption locally.
2. If `content !== undefined`, verifies lock authority via `verifyLock` (lines 179-185). Lock state checked correctly.
3. Calls `bspWrite(block, spindle, pscale_attention, content)` (line 216) — applies the write to the in-memory block as **plaintext content at the target shape**. No gray awareness here.
4. Calls `saveBlock(agent_id, blockName, blockToSave, ..., {... gray: params.gray})` (lines 228-240) — passes gray through.

### 2.2 `db.ts:saveBlock` (lines 273-298)

1. If federated owner (URL-prefixed agent_id): forwards to `saveBlockToBeach`, which puts gray in the POST body (line 218). Federated handler decides what to do with it.
2. **Else (Supabase):** `upsert` with `block` as-is. **Gray flag never consulted.** The plaintext write lands directly in `pscale_blocks.block`.

### 2.3 Why `pscale_write` produces gray content but `bsp()` doesn't

The legacy pscale-mcp-server has its own write handler for the `/v2` endpoint. That handler enforces "gray-only-on-unlocked-when-secret-passed" and applies `selfEncrypt` server-side. bsp-mcp talks to the same Supabase store but takes ownership of the write logic in its own tool layer — and that layer doesn't have gray-apply.

So today the only way to produce gray content on the commons substrate is to go through pscale-mcp. Once produced, bsp-mcp can read it (decryptBlock works); but bsp-mcp can't WRITE it.

## 3. Proposal — add a gray-apply step in `tools/bsp.ts`

### 3.1 Implementation sketch

Insert a single block after the lock check (line 185) and before the in-memory `bspWrite` (line 214):

```ts
// Stage 10 — gray-encryption applied at the target shape.
// Orthogonal to lock state: secret already proven (R3) above if locked;
// secret here serves as the encryption key. On unlocked blocks, secret
// is just the encryption key with no authority semantics.
let effectiveContent = content;
if (content !== undefined && params.gray === true) {
  if (!secret) {
    return {
      content: [{ type: 'text', text: 'Write rejected: gray=true requires secret (used as encryption key).' }],
    };
  }
  effectiveContent = await selfEncrypt(stringifyForGray(content), secret);
}
```

Then change line 216 to use `effectiveContent`:

```ts
writeResult = bspWrite(block, spindle ?? '', pscale_attention ?? null, effectiveContent);
```

Helper `stringifyForGray` decides how to serialize a write payload that may be a string (point), object (ring/subtree), or list (disc) into the JSON-string `selfEncrypt` consumes. Single switch on shape, ~10 lines.

### 3.2 What this enables

**Locked block + `gray=true` + secret_proves_lock**: secret authenticates the writer (R3); same secret derives the encryption key; envelope written at the target leaf. **Locked + gray-encrypted in one call.** Closes the gap that broke the stash design.

**Unlocked block + `gray=true` + secret**: same as legacy pscale_write semantics. No authority check needed (block unlocked); secret is just the encryption key.

**Locked block + `gray=true` + wrong/no secret**: rejected at the existing lock check (R3) before reaching gray-apply. Existing safety preserved.

**Compaction**: works untouched. `bspWrite` operates on `effectiveContent` (which may be a gray envelope). Cycling sub-trees moves the envelope as a unit — `decryptBlock` on read recurses through and decrypts at any depth.

### 3.3 What stays the same

- `bspRead` path: unchanged. Continues to call `decryptBlock` if-and-only-if the secret is provided. Plaintext leaves pass through; gray envelopes decrypt; mixed trees rehydrate selectively.
- `keys.ts:selfEncrypt` and `keys.ts:decryptBlock`: unchanged. Already implemented.
- Federated write path: unchanged. `saveBlockToBeach` forwards `gray: params.gray` to the receiving site, which is responsible for applying gray on its side. (Future Stage: if happyseaurchin.com's reference handler should also implement gray-apply, that's a separate proposal handed to the happyseaurchin codebase.)
- Cross-MCP compatibility: gray envelopes written by bsp-mcp are bit-identical to those written by pscale-mcp (same `selfEncrypt` shape, same nacl-box semantics, same key-derivation salts in `keys.ts`). `pscale_walk` continues to read bsp-written gray content correctly because decrypt-walk runs on the unified `pscale_blocks.block` JSON regardless of writer.

## 4. Risks and unknowns

### 4.1 Subtree gray-encryption semantics

If a write payload is a subtree (ring or subtree shape, P_att < P_end), should `gray=true` encrypt the WHOLE subtree as one envelope at the parent position, or recurse and encrypt each leaf independently?

Recommendation: **whole-subtree single envelope, applied at the target spindle's terminus.** This is what the simplest implementation produces, and it matches `pscale_write`'s behavior (which writes a single envelope at the target address regardless of input shape). Per-leaf gray would require a different operator (`gray_recursive=true` say) and isn't in scope.

### 4.2 Locked-block gray-rotate

If a block has existing plaintext content at a position and a writer calls `bsp(... content=<new>, secret=<lock>, gray=true)`, the new write produces an envelope that overwrites the plaintext. There's no "atomic gray-rotate-existing-plaintext" mode. That's fine for v1 — write-with-gray replaces, not promotes.

### 4.3 Federated parity

`saveBlockToBeach` forwards `gray` to the federated POST body. The receiving site at e.g. `happyseaurchin.com` does not currently apply gray (the v2 sibling-blocks reference impl in `docs/happyseaurchin-sibling-blocks-implementation.md` doesn't include `selfEncrypt`). After Stage 10 lands locally, federated writes with `gray=true` would silently store plaintext on the receiving site until that site implements the same fix. Worth flagging in the Stage 10 release notes — federation parity for gray is a follow-up.

## 5. Testing

Unit tests in `scripts/smoke-bsp.ts` (or a new `scripts/smoke-gray.ts`):

1. **Unlocked + gray**: write content + secret + gray=true; raw read shows envelope; read with secret returns plaintext. (Parity with pscale_write.)
2. **Locked + gray**: create with new_lock=secret; write content + secret + gray=true; raw read shows envelope; read with secret returns plaintext. (New capability.)
3. **Locked + gray + wrong secret**: rejected by lock check (existing behavior).
4. **Mixed-leaf block**: write some leaves plain, some gray; raw walk sees mix; walk with secret returns all plaintext.
5. **Subtree gray**: write an object payload with gray=true at a parent position; envelope wraps the whole subtree; read with secret returns the original subtree.
6. **Cross-MCP read**: write via bsp() with gray=true; read via pscale_walk with secret; expect plaintext (proves envelope shape compat).
7. **Compaction with gray**: write 9 gray entries at digits 1..9, manually cycle to 1.1..1.9 with summary at 1; read 1.5 with secret returns plaintext (proves structural moves preserve envelopes).

## 6. Estimated scope

- ~40 lines in `tools/bsp.ts` (the gray-apply branch + helper).
- ~10-20 lines in `keys.ts` if `stringifyForGray` belongs there (probably yes, sits next to selfEncrypt).
- ~150-200 lines of tests in a new `scripts/smoke-gray.ts`.
- Documentation update: `src/sunstone.json` branch 7 (composition) and `src/whetstone.json` branch 3 (modifier composition) should mention the new gray-on-locked semantic.

Total: well under one day of focused work for a reviewer who knows the codebase.

## 7. What lands when this ships

- `bsp(... content=..., secret=..., gray=true)` produces gray-encrypted content **at any lock state**, on the commons Supabase substrate.
- A Weft-style "private operational shell" pattern becomes available: lock the block (peers can't write), gray-encrypt the entries (peers can't read). Both via single bsp() calls, no pre-lock-then-lock-after dance.
- The substrate becomes honest about its own design: gray-as-leaf-envelope is geometry-respecting, decrypt-walk is recursive, and write-path-gray-apply completes the symmetry.
- Closes the architectural gap that drove this proposal — surfaced from designing `weft/stash` (private runbook block) and discovering the substrate's intent (gray envelopes as walkable nodes) was further along than its write-path implementation.

---

**Recommendation**: ship. The fix is small, the test matrix is clear, and the gap is real. Worth ~30 mins of David-time to review the diff once a Claude-Code session in `~/Projects/bsp-mcp-server/` lands the implementation.

— Weft (interactive session, 2026-05-02)
