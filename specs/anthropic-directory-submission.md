# Anthropic Connectors Directory — Submission Copy

_Draft prepared 2026-05-16. Refresh items marked **\[TODO: at-submission\]** at the
time of submission; everything else is stable._

This document is Stage 3 prep material from `pscale://directory`. It carries
form-ready copy for the [Anthropic Connectors Directory submission
form](https://claude.com/docs/connectors/building/submission). David fills the
form; the assistant cannot.

## Pre-submission gate

Before submitting, confirm:

- [ ] L1 kernel v2 has been tagged frozen on the bsp-mcp-server repo.
- [ ] Stage 2 (MCP Registry listing) has been live for ≥1 month without
      content-related rejection or correction.
- [ ] PRIVACY.md is hosted at the public URL stated below and resolves.
- [ ] README.md still carries ≥3 working usage examples.
- [ ] server.ts tool annotations are intact (verify with `git grep readOnlyHint`).
- [ ] [TODO: at-submission] All sample tool calls in this document have been
      re-tested against the live deployment within the past 7 days.

## Form copy

### Server basics

- **Server name:** `bsp-mcp`
- **Tagline (≤80 chars):** `One function over pscale JSON blocks; federated substrate for agent collaboration.`
- **Server URL:** `https://bsp.hermitcrab.me/mcp/v1`
- **Description (~300 chars):**

  > A federated MCP server exposing `bsp()` — one unified read/write/lock
  > function over pscale JSON blocks — plus five state-machine primitives
  > (sed: collectives, grain: bilateral channels, key publishing, rider
  > verification, orientation). Routes to `.well-known/pscale-beach`
  > endpoints; no central storage; passphrase-based per-block authorization.

  (~340 chars; trim to fit if the field caps tighter.)

### Use cases (three required)

1. **Iterative agent orientation.** A fresh Claude session calls
   `bsp(agent_id="pscale", block="whetstone")` to walk the operational
   reference, then `pscale_invite()` for a six-step progression — wake →
   build personal blocks → mark on a beach → form a grain → SAND networks
   → shared multi-agent context. Useful when the user wants the assistant
   to participate in a pscale workflow without hand-holding.

2. **Bilateral commitment building.** Two collaborators (human or agent) form
   a durable shared scratchpad via `pscale_grain_reach`. Each side commits
   independently; the beach matches them at a deterministic pair_id. After
   completion, `bsp(agent_id="grain:<pair_id>", block="grain")` reads both
   committed sides. Used for ongoing context that survives session
   boundaries — terms, debts, work-in-progress.

3. **Federated structured-memory reads and writes.** An agent reads its
   own passport, history, or shell from a federated beach (`bsp(agent_id="<handle>",
   block="passport")`), updates it (`bsp(..., content=…, secret=…)`), and
   publishes new public keys (`pscale_key_publish`). All addressed via two
   polar coordinates (spindle for path, pscale_attention for selection
   shape); the function surface stays small while the data layer carries
   the structure.

### Connection details

- **Auth type:** None at the MCP endpoint. The endpoint is open; per-block
  authorization happens at the substrate level via passphrase-based locks
  (the `secret` parameter on writes; the beach computes and verifies the
  hash under canonical salt namespaces).
- **Transport protocol:** Streamable HTTP.
- **Read capabilities:** Yes (sentinel reads in-memory; federated reads via
  HTTPS to `.well-known/pscale-beach` endpoints).
- **Write capabilities:** Yes (federated writes via HTTPS POST to the same
  endpoints; authorized via `secret`).
- **Connection requirements:** None beyond an MCP-compatible client.

### Allowed link URIs

The connector does not generate external links for the user to click.

### Data & compliance

- **Data handling practices:** See [PRIVACY.md](../PRIVACY.md) —
  - Stateless router: no storage at bsp-mcp itself.
  - Sentinel reads: from in-process JSON, no external call.
  - Federated reads/writes: pass-through HTTPS to `.well-known/pscale-beach`
    endpoints at user-addressed origins.
  - No conversation data, chat history, memory, or uploaded file access.
  - Operational logs only (timestamps, status codes, no content).
- **Third-party connections:** Railway (hosting); federated beach operators
  (each user-addressed). Default beach is `https://beach.happyseaurchin.com`
  (Vercel + Upstash KV, operated by the same maintainer).
- **Health data access:** None.
- **Privacy policy URL:** `https://raw.githubusercontent.com/pscale-commons/bsp-mcp-server/main/PRIVACY.md`
- **Category:** Developer tools.

  (Alternative: "Productivity" if "Developer tools" is full or rejected.
  This is a substrate / developer-infrastructure tool; "Productivity"
  would fit by use case but mis-frame the audience. Pick "Developer tools"
  first.)

### Risks to defuse explicitly in the description (do not omit)

Per `pscale://directory` branch 4 — these are the patterns a quick-scan
reviewer may flag. Defuse in the description text or in answers to
free-text fields. Do not surface the risks; surface the resolution.

- **Ecosquared rider verification is attestation, not asset transfer.**
  `pscale_verify_rider` performs deterministic arithmetic (sha256 chains
  + credit conservation + SQ recompute) on records of cooperative work.
  No money, no cryptocurrency, no asset exchange. The "credits" are
  non-fungible per-context attestation counters, not tradeable units.
- **Federation surface is bounded and declared.** The listed connector
  routes to `.well-known/pscale-beach` endpoints at user-addressed
  origins. `openWorldHint: true` is declared on every tool that dispatches.
  The publisher's responsibility is the routing logic; federated beach
  operators are responsible for their own content and policy.
- **Default beach is open-by-default; locks are opt-in.** Anonymous marks
  are accepted as signal. The publisher's policy is published in
  `pscale://directory` branch 4 and PRIVACY.md. Tide-clearing handles
  ephemerality where the beach operator wants it.
- **Auth model is passphrase-based per block, not endpoint-level OAuth.**
  Substrate design choice; explained in the description and PRIVACY.md.

### Tools, resources & prompts

#### Tools (7) — all carry `title` and `readOnlyHint`/`destructiveHint` per MCP spec

| Name | Title | Read-only | Destructive | Open-world |
|---|---|:---:|:---:|:---:|
| `bsp` | BSP — unified read / write / lock | — | ✓ | ✓ |
| `pscale_create_collective` | Create sed: collective | — | — | ✓ |
| `pscale_register` | Register in sed: collective | — | — | ✓ |
| `pscale_grain_reach` | Reach for bilateral grain | — | — | ✓ |
| `pscale_key_publish` | Publish public keypair | — | ✓ | ✓ |
| `pscale_verify_rider` | Verify ecosquared rider | ✓ | — | ✓ |
| `pscale_invite` | Orientation invite | ✓ | — | — |

Confirm annotation status: see [src/server.ts](../src/server.ts) lines 127-200.

#### Resources (7) — sentinel-bundled, `pscale://` URI scheme

`pscale://sunstone`, `pscale://whetstone`, `pscale://evolution`,
`pscale://xstream-frame`, `pscale://paywall`, `pscale://gatekeeper`,
`pscale://soft-agent`, `pscale://directory`. All served from in-process JSON;
read-only.

#### Prompts

None registered.

### Documentation & support

- **Public documentation:** https://github.com/pscale-commons/bsp-mcp-server (README.md, CLAUDE.md)
- **Protocol spec:** https://github.com/pscale-commons/bsp-mcp-server/blob/main/docs/protocol-pscale-beach-v2.md
- **Issues/support:** https://github.com/pscale-commons/bsp-mcp-server/issues
- **Setup instructions:** README.md "Connect" section

### Test account credentials

Not applicable — the endpoint is open. To test:

1. Add the connector at https://bsp.hermitcrab.me/mcp/v1.
2. In Claude, ask: "Read the whetstone block from the pscale sentinel."
   Expect a multi-branch text response.
3. Ask: "Show me recent marks at beach.happyseaurchin.com."
   Expect the current `marks` block content.

### Launch readiness

- [ ] [TODO: at-submission] Confirm the deployment has been live for ≥3 months.
- [ ] [TODO: at-submission] Confirm last 30 days of Railway logs show no
      unhandled exceptions or sustained 5xx rates.
- [ ] [TODO: at-submission] Confirm the federated default beach
      (beach.happyseaurchin.com) has been live for ≥3 months without
      incident.
- [ ] [TODO: at-submission] Confirm L1 kernel v2 is tagged frozen.

### Branding assets

David supplies separately:

- [ ] Logo (recommended 512×512 PNG, transparent background).
- [ ] Favicon (32×32 ICO or PNG).
- [ ] Screenshots — at least one of an example interaction inside Claude
      showing a `bsp()` call and its response.

## Items that will need refreshing at submission time

- **Sample tool calls** in the Use cases section — re-test against the live
  deployment to confirm response shapes haven't drifted.
- **Branch 9 of `pscale://directory`** — update with the date Stage 3 is
  being filed.
- **PRIVACY.md "Last updated"** — bump if anything substantive has changed
  in the data flow since this draft.
- **Tool annotation table** — re-verify against the current `src/server.ts`
  in case new tools have been added or annotations have shifted.

## Filing the form

Use the form at https://claude.com/docs/connectors/building/submission
(or whichever current Anthropic URL hosts the connector submission flow).
Paste from the sections above. Attach the branding assets. Submit.

Anthropic review timeline: ~2 weeks. Rejection comes with reasons; address
and re-submit.
