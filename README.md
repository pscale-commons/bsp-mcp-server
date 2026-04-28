# bsp-mcp-server

The unified `bsp()` function as an MCP server. Block-Spindle-Pscale: two polar coordinates over pscale JSON blocks. One function, five substrate primitives, two foundational resources. That is the whole surface.

## Why

`pscale-mcp-server` has 25 categorised tools (passport, inbox, beach, pool, memory, etc.). The categories are use cases imposed from outside; the geometry underneath is one function — a walk through a polar coordinate system. `bsp-mcp-server` collapses the surface to the geometry. Names like "passport" and "inbox" become block conventions accessed via the `*` operator, not separate functions.

This is square 2 of the architecture. Square 1 is the pscale block itself.

## The function

```
bsp(agent_id, block, spindle, pscale_attention,
    content?, secret?, new_lock?, gray?, face?, tier?)
```

Read when `content` and `new_lock` are both omitted. Write when `content` is provided. Set or rotate a lock when `new_lock` is provided (ordinary blocks only — sed:/grain: handle locking through their own lifecycle tools).

Selection shape derives from the relationship between spindle length (`P_end`) and `pscale_attention` (`P_att`):

| Relation | Shape | Read returns | Write payload |
|---|---|---|---|
| `P_att == P_end` | point | string at terminus | string |
| `P_att == P_end - 1` | ring | digit children of terminus | `{1: ..., 2: ...}` |
| `P_att <  P_end - 1` | subtree | full subtree | nested object |
| spindle empty + P set | disc | all nodes at depth | sparse map |
| spindle empty + P null | block | whole tree | whole-block JSON |
| spindle ends `*` | star | hidden directory composition | inner shape |

Substrate dispatch is implicit in the `agent_id` prefix:
- `sed:{collective}` — sedimentary collective
- `grain:{pair_id}` — bilateral grain
- bare — ordinary block

## Lock semantics — four rules

`secret` is ALWAYS proof of current authority. `new_lock` is ALWAYS the target lock value. They never overlap.

| State | Args | Effect |
|---|---|---|
| Block doesn't exist | `new_lock` | Create locked, no `secret` needed |
| Block unlocked | `new_lock` | Set lock, no `secret` needed |
| Block locked | `secret` | Proves authority for content writes |
| Block locked | `secret` + `new_lock` | Rotate lock (with optional content) |

`new_lock` is ordinary-blocks only. sed: and grain: substrates handle locking atomically through `pscale_register` and `pscale_grain_reach`.

## The five substrate primitives

These have atomic state machines `bsp()` alone cannot subsume:

| Tool | Purpose |
|---|---|
| `pscale_create_collective` | Create a sed: substrate with conventions in the root underscore |
| `pscale_register` | Server-assigned position in a sed: collective (proof-of-presence-in-time) |
| `pscale_grain_reach` | Symmetric reach/accept across a bilateral pair |
| `pscale_key_publish` | Argon2id keypair derivation; public half lands at passport position 9 |
| `pscale_verify_rider` | Deterministic arithmetic on a Level 2 ecosquared rider |

## Foundational reading

- `src/sunstone.json` — the teaching block. Eight branches frame the same primitive from eight angles (geometry, function, access, substrate, composition, commons, reflexive, voicing). Read first. Walk it with `bsp()` as the self-test.
- `src/whetstone.json` — the operational reference. Five branches: signature, selection-shape derivation, modifier composition, storage adapter, translation from pscale-mcp idioms. Walk by position for the slice you need.

Both are surfaced as MCP resources: `pscale://sunstone` and `pscale://whetstone`.

## The address invariant — locked

Pscale 0 is anchored at the **floor** (decimal point), not at the top of the tree. Floor = depth of the underscore chain.

Walk algorithm: parse → pad LEFT to floor width with zeros → strip TRAILING zeros → walk. Digit 0 → key `_`. Single decimal point as floor marker, stripped before walking. Trailing zeros are floor-width notation, never walk steps.

`src/bsp.ts` is a faithful TypeScript port of `bsp2-star.py` from CORSAIR. Do not patch it; replace wholesale if the reference updates.

## Substrate

Same Supabase project as `pscale-mcp-server`. Same blocks, same agents, same passphrases, same grains. The two MCPs interoperate at the data layer — only the API surface differs.

Locks use legacy-compatible salt namespaces:
- `sed:`   `sha256(passphrase + collective + position)`
- `grain:` `sha256(passphrase + "grain:" + pair_id + ":" + side)`
- block:  `sha256(passphrase + "block:" + agent_id + ":" + name + ":" + position)`

so locks set under either MCP verify under the other.

## Connect

**Hosted (via Railway):**
```json
{
  "bsp": {
    "command": "npx",
    "args": ["-y", "mcp-remote@0.1.38", "https://bsp.hermitcrab.me/mcp/v1"]
  }
}
```

Direct Railway URL (if the custom domain is propagating):
`https://bsp-mcp-server-production.up.railway.app/mcp/v1`

**Local (the scaling path):**
```bash
SUPABASE_ANON_KEY=sb_publishable_rjE-rjL8kPCkXDK1ZcXauA_D84USWp9 npm run dev
```

Default local port `3001`, MCP path `/mcp/v1`. Override with `PORT` and `MCP_PATH`.

## Smoke tests

```bash
npx tsx scripts/smoke-bsp.ts                                     # unit — bsp() against sunstone (22 assertions)
SUPABASE_ANON_KEY=... npx tsx scripts/smoke-end-to-end.ts        # live — substrate roundtrip + locks (11 assertions)
```

## Structure

```
src/
  bsp.ts              — walker (DO NOT PATCH; port of bsp2-star.py)
  bsp-fn.ts           — unified bsp() with shape derivation
  db.ts               — storage adapter (load_block, save_block, locks)
  locks.ts            — sha256 hash helpers (sed:/grain:/block: salt namespaces)
  keys.ts             — Argon2id + nacl (X25519/Ed25519, gray encryption)
  server.ts           — MCP server factory
  index.ts            — HTTP entry point
  sunstone.json       — teaching block
  whetstone.json      — operational reference
  tools/
    bsp.ts            — the one function handler (content + lock changes)
    collective.ts     — pscale_create_collective, pscale_register
    grain.ts          — pscale_grain_reach
    keys.ts           — pscale_key_publish
    verify.ts         — pscale_verify_rider
  resources/
    sunstone.ts       — pscale://sunstone
    whetstone.ts      — pscale://whetstone
scripts/              — smoke tests
```

## What NOT to add

Read `CLAUDE.md` before extending the surface. The function surface caught up to the geometry — it does not need additions. If you find yourself reaching for a 9th tool, the answer is almost certainly a block convention plus the `*` operator, not new code.

## Lineage

Built on the lessons of [pscale-mcp-server](https://github.com/pscale-commons/pscale-mcp-server). The substrate is shared; only the function surface changes.
