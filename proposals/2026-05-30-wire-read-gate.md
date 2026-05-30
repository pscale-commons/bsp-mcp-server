# Wire-read contract drift — no-pscale path-walk and star reads (2026-05-30)

**Status**: bsp-mcp side LANDED + tested. Beach side PATCHED in source (commons + happyseaurchin + idiothuman), pending redeploy. xstream: no change needed (verified immune).

## Symptom

A session authoring an RPG against `beach.happyseaurchin.com` reported three "substrate failures" and fell back to direct HTTP (clobbering a block in the process). All three were misdiagnosed; the substrate was sound. Two were the same real bug.

1. *"The bsp tool cannot serialize object content."* — **False.** Object writes round-trip perfectly (verified: a nested object with a sub-object at position 2 wrote and read back with full nesting). The quoted error reported `agent_id` and `block` as `undefined`; `content` is typed `z.any()` and accepts any JSON, so a content-type problem could never null out `agent_id`/`block`. The whole parameter blob was lost in the client/transport (CC harness or `mcp-remote@0.1.38`) before reaching the server — a client-side flake, not reproducible, not a tool limit. The correct response was to retry/restart the connection, not abandon the tool.

2. *"Flaky reads — same block, inconsistent across calls."* — **Real bug.** Not caching (404s carry `max-age=0, must-revalidate`, `x-vercel-cache: MISS`), not Upstash lag (35/35 reads OK incl. 20 immediately post-write). The variable is **whether the read carries `pscale_attention`**.

3. *"Star returns 'no hidden directory' though the data is present."* — **Same bug family.** Star reads omit pscale.

## Root cause — a contract drift

The beach's GET handler returns a canonical `{shape}` object **only when `?pscale=` is present**. For a no-pscale GET it returns `readAt(block, spindle)` — the **raw node** at that address — and `readAt` **strips a trailing `*`**:

```js
// pscale-beach.js GET handler, before the fix
if (hasPscale) payload = bspCanonical(block, spindle || null, pscaleNum); // {shape}
else           payload = spindle ? readAt(block, spindle) : block;        // raw node / whole block
```

bsp-mcp's wire fast-path (`tools/bsp.ts`) expected either a `{shape}` object **or** the whole block to re-walk. Given the raw node instead, it mishandled every type:

| no-pscale return | bsp-mcp behaviour | result |
|---|---|---|
| string leaf | neither branch matches | **false "block not found"** |
| `null` (address unresolved / star stripped to a dead path) | treated as 404 | **false "block not found"** |
| object subtree | `bspRead(node, spindle, null)` re-walks the spindle **again** on the already-resolved node | **wrong (double-walk)** |

So reads **with** a pscale (point / disc / descent) worked; reads **without** one — a plain path-walk ("walk the spine") and any star — broke. Bare `*` worked only by luck: `readAt("*")` returns the whole block, so bsp-mcp's single local re-walk happened to be correct.

Live proof (same block, back to back):
- `bsp(…, spindle:"1")` → "block not found"
- `bsp(…, spindle:"1", pscale_attention:0)` → correct

## Fix 1 — bsp-mcp read-gate (LANDED)

`src/tools/bsp.ts`: gate the wire fast-path to reads where it is actually valid — `pscale_attention != null` **and** no star. Everything else (path-walk, star, whole-block) routes to the local path (`loadBlock` → `bspRead`), which walks the whole block with the canonical walker that handles every shape including star.

```js
const hasStar = typeof spindle === 'string' && spindle.includes('*');
const wireEligible = pscale_attention != null && !hasStar;
if (wireEligible && !isSentinel && !secret && isFederatedOwner(target.agent_id)) { /* wire */ }
```

Point/disc/descent keep the surgical-read optimisation; path-walk and star become correct. This fix is self-contained in bsp-mcp — it does **not** depend on the beach changing, so bsp-mcp is correct against any beach version.

Tested: `npm run smoke:read-gate` (new, 8/8 — path-walk and star regressions covered, self-cleaning) and `npm run smoke:wire-bsp` (5/5, no regression). `tsc` clean.

## Fix 2 — beach star-routing (PATCHED, pending redeploy)

Even with bsp-mcp gated, **other wire clients** (claude.ai connector, raw HTTP, future configs) hitting `?spindle=…*` without pscale still get a star-stripped raw node. The beach should mirror `bsp()` faithfully: a star address is a star shape. Route star spindles through `bspCanonical` regardless of pscale (non-star, no-pscale reads keep the legacy raw-node / whole-block contract, so whole-block consumers — bsp-mcp's `loadBlock`, xstream's `loadBlockFederated` — are unaffected):

```js
const spindleHasStar = typeof spindle === 'string' && spindle.includes('*');
if (hasPscale || spindleHasStar) {
  let pscaleNum = null;
  if (hasPscale) { pscaleNum = parseInt(...); if (Number.isNaN(pscaleNum)) return 400; }
  payload = bspCanonical(block, spindle || null, pscaleNum);
} else {
  payload = spindle ? readAt(block, spindle) : block;
}
```

Validated against the live beach: `?spindle=2*&pscale=0` already returns a correct `{shape:"star", inner:…}`; the fix removes the pscale requirement for star. Applied identically to:
- `pscale-beach/api/pscale-beach.js` (commons — source of truth)
- `pscale-beach-happyseaurchin/api/pscale-beach.js` (deploys beach.happyseaurchin.com)
- `pscale-beach-idiothuman/api/pscale-beach.js` (deploys beach.idiothuman.com)

All three `node --check` clean. **Deploy**: Vercel redeploy of the two operator clones; commons is the source for future clones. (The clones have drifted from commons independently — worth re-deriving them from commons later to cut maintenance, but the surgical patch is identical in all three for now.)

## xstream — no change needed (verified)

`xstream-bsp/src/lib/bsp-client.ts:loadBlockFederated` sends only `?block=` — never `?spindle=`/`?pscale=`. It always fetches the **whole block** and walks it **locally** with `src/kernel/bsp.ts` (a canonical `bsp2-star.py` port with correct star handling). Its star resolution (`resolveStarRefs`) walks the local whole block too. The soft-LLM's `bsp` tool (`kernel/claude-tools.ts`) routes through the same `bsp-client`. So xstream never touches the beach's no-pscale/star dispatch and is immune by architecture.

## Out of scope (flagged)

- `scripts/smoke-bsp.ts:30` (`smoke:unit`) is a **pre-existing stale assertion**: it expects a no-pscale `1.1` read to be a `point` and reads a `.point` field, but in the canonical 2026-05-17 model a no-pscale spindle read is a `path-walk` with `.text`. Predates this work; needs a separate update to the canonical result vocabulary.
- The "object content" non-bug (symptom 1) suggests a `mcp-remote`/harness serialization flake. Optional hardening: give `content` an explicit permissive JSON Schema instead of bare `z.any()` (which emits a type-less property) to reduce client-side serialization ambiguity.
