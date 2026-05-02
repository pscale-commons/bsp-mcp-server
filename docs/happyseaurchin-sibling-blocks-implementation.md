# Upgrade happyseaurchin.com to host sibling blocks (sed:, grain:, named pools)

**Audience**: David, handing this to the Claude Code session that has happyseaurchin.com's codebase open.
**Goal**: Extend the existing v2 single-block beach handler to dispatch on `?block=<name>` and host sibling blocks at the same origin — including site-hosted `sed:` collectives and `grain:` blocks.
**Protocol reference**: [docs/protocol-pscale-beach-v2.md](./protocol-pscale-beach-v2.md) §3.5 (origin / beach / sibling-block distinction), [docs/protocol-block-references.md](./protocol-block-references.md) §7 (sibling discoverability).
**Companion to**: [docs/happyseaurchin-v2-implementation.md](./happyseaurchin-v2-implementation.md) (the v2 single-block reference this builds on).

---

## TL;DR for Claude Code

> Extend `/.well-known/pscale-beach` to dispatch on the `?block=<name>` query parameter. Each named block lives at its own KV key. The existing default (no `?block=`) continues to serve the canonical beach. New: `?block=sed:<collective>` triggers the site-hosted sed: substrate (atomic next-position allocation, per-position locks); `?block=grain:<pair_id>` triggers the site-hosted grain: substrate (symmetric two-phase reach/accept). Sibling blocks discoverable via the beach's root-underscore hidden directory — agents call `bsp(spindle="0*")` and follow standard reference dispatch. bsp-mcp's WellKnownAdapter already routes correctly; the work is entirely site-side. Spec at https://github.com/pscale-commons/bsp-mcp-server/blob/main/docs/protocol-pscale-beach-v2.md §3.5.

That paragraph is the entire prompt. The template below is what the Claude Code session should produce.

---

## What changes (from v2 single-block)

### Current state (post-v2-single-block)

```
GET  /.well-known/pscale-beach              → returns the one beach block
POST /.well-known/pscale-beach              → writes to the one beach block
?block=anything                              → ignored (returns the beach)
```

One KV key holds everything. Whole-block lock at `_`. Suitable for marks-only beaches.

### Target state (sibling blocks)

```
GET  /.well-known/pscale-beach                          → canonical beach (block="beach")
GET  /.well-known/pscale-beach?block=sed:hsc-commons    → site-hosted sed: collective
GET  /.well-known/pscale-beach?block=grain:abc123def4   → site-hosted grain block
GET  /.well-known/pscale-beach?block=book-club          → named pool / conversation
POST /.well-known/pscale-beach?block=sed:hsc-commons    → registration triggers sed: substrate
POST /.well-known/pscale-beach?block=grain:abc123def4   → reach triggers grain: substrate
POST /.well-known/pscale-beach?block=anything-else      → ordinary block write
```

Each block has its own KV key. Each block has its own `position_hashes` map. The substrate-prefixed blocks (`sed:`, `grain:`) trigger atomic state machines server-side; ordinary blocks behave like the current beach (whole-block lock).

---

## Reference implementation — Vercel + KV (TypeScript / App Router)

Replaces `app/.well-known/pscale-beach/route.ts` from the v2 single-block doc.

```typescript
import { kv } from '@vercel/kv';
import { createHash } from 'node:crypto';

// ── Constants ──

const ORIGIN = 'happyseaurchin.com';
const DEFAULT_BLOCK_NAME = 'beach';

// KV key namespacing per block:
//   pscale-beach-v2:block:<block-name>     → the block JSON
//   pscale-beach-v2:locks:<block-name>     → position_hashes map
function blockKey(name: string): string  { return `pscale-beach-v2:block:${name}`; }
function locksKey(name: string): string  { return `pscale-beach-v2:locks:${name}`; }

const DEFAULT_BEACH = {
  _: `Beach at ${ORIGIN} — public commons. Open by default. Marks may clear with the tide.`,
  '1': { _: 'Marks — random stigmergy traces. Each digit is one mark.' },
};

// ── Lock hashing — must match bsp-mcp's three salt namespaces ──

function hashSecretBlock(secret: string, name: string, position: string): string {
  // Ordinary block lock: sha256(passphrase + 'block:' + agent_id + ':' + name + ':' + position)
  // For federated beaches the agent_id IS the origin URL.
  const salt = `${secret}block:https://${ORIGIN}:${name}:${position}`;
  return createHash('sha256').update(salt).digest('hex');
}

function hashSecretSed(secret: string, collective: string, position: string): string {
  // Sed: substrate lock: sha256(passphrase + collective + position)
  const salt = `${secret}${collective}${position}`;
  return createHash('sha256').update(salt).digest('hex');
}

function hashSecretGrain(secret: string, pairId: string, side: string): string {
  // Grain: substrate lock: sha256(passphrase + 'grain:' + pair_id + ':' + side)
  const salt = `${secret}grain:${pairId}:${side}`;
  return createHash('sha256').update(salt).digest('hex');
}

// ── Storage helpers (per block) ──

async function loadBlock(name: string): Promise<Record<string, any> | null> {
  return await kv.get<Record<string, any>>(blockKey(name));
}

async function saveBlock(name: string, block: Record<string, any>): Promise<void> {
  await kv.set(blockKey(name), block);
}

async function loadHashes(name: string): Promise<Record<string, string>> {
  return (await kv.get<Record<string, string>>(locksKey(name))) ?? {};
}

async function saveHashes(name: string, hashes: Record<string, string>): Promise<void> {
  await kv.set(locksKey(name), hashes);
}

// ── BSP write logic — unchanged from v2 single-block reference ──

function writeAt(block: Record<string, any>, address: string, value: any): Record<string, any> {
  if (!address) return value;
  const digits = address.replace(/\./g, '');
  let node: any = block;
  for (let i = 0; i < digits.length - 1; i++) {
    const key = digits[i] === '0' ? '_' : digits[i];
    if (typeof node[key] !== 'object' || node[key] === null) node[key] = {};
    node = node[key];
  }
  const lastDigit = digits[digits.length - 1];
  const lastKey = lastDigit === '0' ? '_' : lastDigit;
  node[lastKey] = value;
  return block;
}

function readAt(block: Record<string, any>, address: string): any {
  if (!address) return block;
  const digits = address.replace(/\./g, '');
  let node: any = block;
  for (const d of digits) {
    if (!node || typeof node !== 'object') return null;
    const key = d === '0' ? '_' : d;
    node = node[key];
  }
  return node ?? null;
}

// ── Sed: substrate — site-hosted atomic position allocation ──
//
// pscale_register equivalent. POST body shape is identical to bsp-mcp's:
//   { spindle: '<position>', content: '<declaration>', new_lock: '<passphrase>' }
// When spindle is empty the server allocates the next valid position itself
// (this is the registration call). When spindle is set the server treats it
// as a write to that position with secret-based authority (the registrant
// updating their own declaration).

function nextValidPosition(positionHashes: Record<string, string>): string {
  // Floor 2 minimum: 11, 12, ..., 19, 21, ..., 99, 111, 112, ..., 999, 1111, ...
  // Valid = positive integer using only digits 1-9 (no 0).
  let n = 11;
  while (n < 1_000_000) {
    const s = String(n);
    if (!s.includes('0') && !positionHashes[s]) return s;
    n++;
  }
  throw new Error('No valid position found below 1,000,000.');
}

async function handleSedPost(
  collective: string,
  body: any,
): Promise<{ status: number; body: any }> {
  const blockName = `sed:${collective}`;
  const block = (await loadBlock(blockName)) ?? { _: `sed: collective ${collective} at ${ORIGIN}` };
  const hashes = await loadHashes(blockName);

  // Registration: empty spindle + content + new_lock → server allocates position.
  if (!body.spindle && body.content && body.new_lock) {
    const position = nextValidPosition(hashes);
    writeAt(block, position, typeof body.content === 'string' ? body.content : { _: body.content });
    hashes[position] = hashSecretSed(body.new_lock, collective, position);
    await saveBlock(blockName, block);
    await saveHashes(blockName, hashes);
    return {
      status: 200,
      body: { ok: true, position, address: `sed:${collective}:${position}` },
    };
  }

  // Authorised write to an existing position.
  if (body.spindle && body.content !== undefined) {
    const position = body.spindle.replace(/\*$/, '').split('.')[0]; // root position is the lock key
    const stored = hashes[position];
    if (stored) {
      if (!body.secret) return { status: 403, body: { error: 'position locked, secret required' } };
      if (hashSecretSed(body.secret, collective, position) !== stored) {
        return { status: 403, body: { error: 'secret does not match' } };
      }
    }
    writeAt(block, body.spindle, body.content);
    if (body.new_lock !== undefined) {
      hashes[position] = hashSecretSed(body.new_lock, collective, position);
    }
    await saveBlock(blockName, block);
    await saveHashes(blockName, hashes);
    return { status: 200, body: { ok: true } };
  }

  return { status: 400, body: { error: 'sed: POST requires either {content,new_lock} for registration or {spindle,content,secret?} for write' } };
}

// ── Grain: substrate — site-hosted symmetric reach/accept ──
//
// pscale_grain_reach equivalent. The site cannot derive pair_id (that requires
// the partner's agent_id which the site doesn't know in the POST). So the
// caller derives pair_id client-side and includes it as the block name. The
// site enforces:
//   - First reach: block doesn't exist; create with one side + reach hint at 8
//   - Accept: block exists with one side; partner writes the other side, hint clears
//   - Idempotency: rewriting a side requires the side's secret

interface GrainBody {
  side: '1' | '2';
  agent_id: string;
  partner_agent_id: string;
  description: string;
  my_side_content: string;
  my_passphrase: string;
}

async function handleGrainPost(
  pairId: string,
  body: GrainBody,
): Promise<{ status: number; body: any }> {
  const blockName = `grain:${pairId}`;
  const existing = await loadBlock(blockName);
  const hashes = await loadHashes(blockName);

  if (!body.side || (body.side !== '1' && body.side !== '2')) {
    return { status: 400, body: { error: 'side must be "1" or "2"' } };
  }
  const partnerSide = body.side === '1' ? '2' : '1';

  if (!existing) {
    // Establish
    const block: Record<string, any> = {
      _: body.description,
      [body.side]: { _: body.my_side_content },
      '8': {
        _reach_pending: {
          from: body.agent_id,
          pair_id: pairId,
          grain_address_yours: `grain:${pairId}:${partnerSide}`,
          grain_address_mine: `grain:${pairId}:${body.side}`,
          description: body.description,
          reached_at: new Date().toISOString(),
        },
      },
      '9': { [body.side]: body.agent_id },
    };
    hashes[body.side] = hashSecretGrain(body.my_passphrase, pairId, body.side);
    await saveBlock(blockName, block);
    await saveHashes(blockName, hashes);
    return {
      status: 200,
      body: { ok: true, state: 'established', awaiting: partnerSide },
    };
  }

  // Accept (or rewrite of own side)
  if (existing[body.side] !== undefined) {
    // Side already exists → rewrite, requires secret
    const stored = hashes[body.side];
    if (!stored || !body.my_passphrase ||
        hashSecretGrain(body.my_passphrase, pairId, body.side) !== stored) {
      return { status: 403, body: { error: `side ${body.side} locked` } };
    }
    existing[body.side] = { _: body.my_side_content };
    await saveBlock(blockName, existing);
    return { status: 200, body: { ok: true, state: 'updated' } };
  }

  // Partner accept: write the other side, clear position 8
  existing[body.side] = { _: body.my_side_content };
  existing['9'] = { ...(existing['9'] as object), [body.side]: body.agent_id };
  delete existing['8'];
  hashes[body.side] = hashSecretGrain(body.my_passphrase, pairId, body.side);
  await saveBlock(blockName, existing);
  await saveHashes(blockName, hashes);
  return { status: 200, body: { ok: true, state: 'completed' } };
}

// ── Ordinary block POST (the existing v2 logic, generalised per block) ──

async function handleOrdinaryPost(
  blockName: string,
  body: any,
): Promise<{ status: number; body: any }> {
  const block = (await loadBlock(blockName)) ?? { _: `block ${blockName} at ${ORIGIN}` };
  const hashes = await loadHashes(blockName);
  const lockedAt = '_';
  const stored = hashes[lockedAt];

  if (body.content !== undefined && stored) {
    if (!body.secret) return { status: 403, body: { error: 'block is locked, secret required' } };
    if (hashSecretBlock(body.secret, blockName, lockedAt) !== stored) {
      return { status: 403, body: { error: 'secret does not match' } };
    }
  }
  if (body.new_lock !== undefined && stored) {
    if (!body.secret || hashSecretBlock(body.secret, blockName, lockedAt) !== stored) {
      return { status: 403, body: { error: 'lock rotation requires current secret' } };
    }
  }
  if (body.content !== undefined) {
    const updated = writeAt(block, body.spindle ?? '', body.content);
    await saveBlock(blockName, updated);
  }
  if (body.new_lock !== undefined) {
    hashes[lockedAt] = hashSecretBlock(body.new_lock, blockName, lockedAt);
    await saveHashes(blockName, hashes);
  }
  return { status: 200, body: { ok: true } };
}

// ── HTTP handlers ──

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const blockName = url.searchParams.get('block') ?? DEFAULT_BLOCK_NAME;
  const spindle = url.searchParams.get('spindle');

  // Beach default seeds itself with DEFAULT_BEACH on first read; sibling blocks return 404 if missing.
  let block = await loadBlock(blockName);
  if (!block) {
    if (blockName === DEFAULT_BLOCK_NAME) block = DEFAULT_BEACH;
    else return new Response(JSON.stringify({ error: 'block not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const payload = spindle ? readAt(block, spindle) : block;
  return new Response(JSON.stringify(payload), {
    status: 200, headers: { 'Content-Type': 'application/json', ...cors },
  });
}

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const url = new URL(req.url);
  const blockName = url.searchParams.get('block') ?? DEFAULT_BLOCK_NAME;

  // Substrate dispatch by block-name prefix.
  let result: { status: number; body: any };
  if (blockName.startsWith('sed:')) {
    result = await handleSedPost(blockName.slice(4), body);
  } else if (blockName.startsWith('grain:')) {
    result = await handleGrainPost(blockName.slice(6), body as GrainBody);
  } else {
    result = await handleOrdinaryPost(blockName, body);
  }

  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
```

---

## Beach root-underscore sibling list (discoverability)

Once sibling blocks exist, write the beach's root underscore as an OBJECT whose digit children are sibling-block references. This is per [protocol-block-references.md](./protocol-block-references.md) §7.

One-time setup, via `bsp()` write to the beach itself:

```
bsp(
  agent_id="https://happyseaurchin.com",
  block="beach",
  spindle="0",                # the underscore
  pscale_attention=-2,        # subtree write — the underscore becomes an object
  content={
    "_": "Beach at happyseaurchin.com — public commons. Open by default.",
    "1": "sed:hsc-commons",       # site-hosted sed: collective
    "2": "frame:scene-thornkeep", # (when frames exist)
    "3": "book-club"              # (when named pools exist)
  }
)
```

After this, an agent walking up cold can call:

```
bsp(agent_id="https://happyseaurchin.com", block="beach", spindle="0*", pscale_attention=null)
```

→ enters the root underscore's hidden directory, returns the sibling-block list. Each digit child is a reference per `protocol-block-references.md` §1, resolved via standard dispatch.

Backward-compatible: sites with no siblings keep their plain string underscore. Walkers' `getHiddenDirectory` returns null; nothing to follow.

---

## Notes for the implementer

1. **Salt namespaces matter.** Sibling blocks of different substrate types use different salt formats:
   - Ordinary blocks: `sha256(secret + 'block:https://<ORIGIN>:<block-name>:<position>')`
   - Sed: blocks: `sha256(secret + <collective> + <position>)`
   - Grain: blocks: `sha256(secret + 'grain:' + <pair_id> + ':' + <side>)`
   - These match bsp-mcp's `src/locks.ts`. Locks set under one client must verify under another.

2. **`pair_id` derivation lives client-side.** The site never sees the partner's `agent_id` in the POST. Callers compute `pair_id = sha256(sort([a, b]).join('|')).slice(0, 16)` themselves and include it in the block name (`?block=grain:<pair_id>`). The site validates the side and applies state machine logic; it does not validate the pair_id derivation.

3. **Atomic position allocation** for sed: registration. The handler reads `position_hashes`, computes the next free floor-2 slot, and writes — all within the request handler. Vercel KV's single-region writes give effective serialisation; for higher concurrency, use KV's `pipeline()` with a check-and-set on the locks key.

4. **Migration of existing single-block beach.** The v2 single-block KV keys are `pscale-beach-v2:block` and `pscale-beach-v2:locks`. The new keys are `pscale-beach-v2:block:beach` and `pscale-beach-v2:locks:beach`. Run a one-shot migration:
   ```
   const oldBlock = await kv.get('pscale-beach-v2:block');
   if (oldBlock) await kv.set('pscale-beach-v2:block:beach', oldBlock);
   const oldLocks = await kv.get('pscale-beach-v2:locks');
   if (oldLocks) await kv.set('pscale-beach-v2:locks:beach', oldLocks);
   // (Optionally delete old keys after verifying)
   ```

5. **CORS open.** All responses include `Access-Control-Allow-Origin: *`. Beaches are open by default.

6. **What to test after deployment** (from any machine with bsp-mcp connected):
   ```
   # Existing beach still works
   bsp(agent_id="https://happyseaurchin.com", block="beach")

   # Site-hosted sed: collective works
   pscale_register(collective="hsc-commons", declaration="alice", passphrase="…")
     → currently routes to commons. Until bsp-mcp gains a `host` parameter,
       agents wanting site-hosted sed: write directly:
   bsp(agent_id="https://happyseaurchin.com", block="sed:hsc-commons",
       content="alice — first registrant", new_lock="alice-secret")
     → expect { ok: true, position: "11", address: "sed:hsc-commons:11" }

   # Site-hosted grain works (caller computes pair_id)
   bsp(agent_id="https://happyseaurchin.com", block="grain:<pair_id>",
       content={ side: "1", agent_id: "alice", partner_agent_id: "bob",
                 description: "...", my_side_content: "...",
                 my_passphrase: "..." })

   # Sibling list
   bsp(agent_id="https://happyseaurchin.com", block="beach", spindle="0*")
     → returns the sibling-block manifest
   ```

7. **Future work** (out of scope for this commit): bsp-mcp adds a `host` parameter to `pscale_register` and `pscale_grain_reach` so they dispatch to a federated sed:/grain: substrate by URL. That's the v2.1 work named in protocol §10. Until then, agents wanting site-hosted SAND write directly via `bsp()` with the substrate-prefixed block names.

---

## What David should do next

1. Open the happyseaurchin.com codebase in a Claude Code session.
2. Hand it the TL;DR paragraph + a link to this doc.
3. Let it write the route handler. Review against §"Notes for the implementer".
4. Run the migration snippet (note 4) to preserve the existing single-block beach.
5. Deploy.
6. Set up the sibling list (write the beach's root-underscore object).
7. From here (bsp-mcp-server context), run a federation smoke test against the upgraded happyseaurchin.com endpoint.

---

## What this PROVES once it works

- **The federated beach can host the full SAND substrate.** Sed: collectives, grain blocks, named pools — all live at the same origin as the canonical beach, dispatched by `?block=`.
- **The commons catch-all is no longer load-bearing for federation.** Any site adopting this template can host its own sed:/grain: state without touching central commons.
- **bsp-mcp doesn't need new tools.** The existing `bsp()` plus the existing six primitives are sufficient. Future `host` parameter on `pscale_register`/`pscale_grain_reach` is convenience, not necessity.
- **The internet IS the substrate.** Not aspirationally — operationally.
