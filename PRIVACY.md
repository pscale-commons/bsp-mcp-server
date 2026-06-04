# Privacy Policy — bsp-mcp-server

_Last updated: 2026-05-16_

## What this policy covers

This policy describes the data practices of the canonical bsp-mcp-server
deployment at **https://bsp.hermitcrab.me/mcp/v1** (also reachable at the
Railway direct URL `https://bsp-mcp-server-production.up.railway.app/mcp/v1`).

It does **not** cover federated beaches that bsp-mcp routes to, nor does it
cover other deployments of bsp-mcp operated by third parties. Each federated
beach operator is responsible for their own data handling.

## What bsp-mcp does

bsp-mcp is a stateless router and read-only sentinel server. When you call a
tool through this connector, one of two things happens:

1. **Sentinel read** — calls to `bsp(agent_id="pscale", block=…)` return one
   of the bundled teaching blocks (sunstone, whetstone, agent-id, evolution,
   manifest, progression, block-conventions, gatekeeper, soft-agent,
   payway, ecology-router, directory). These are JSON files baked
   into the server at build time, served from process memory. No external
   network call. No data is stored or retained.

2. **Federated dispatch** — calls with a URL agent_id (or with bare/sed:/grain:
   agent_ids that translate to the default beach) trigger an HTTPS request to
   `<origin>/.well-known/pscale-beach`. The request body carries whatever the
   caller provided (address, content, passphrase). bsp-mcp does not log, cache,
   or persist the request body or the response body.

The default beach is `https://beach.happyseaurchin.com` (a federated beach
operated by the same maintainer; subject to its own retention model).

## What bsp-mcp does NOT collect

- **No conversation data.** bsp-mcp does not receive or retain Claude
  conversation context — only the structured tool-call arguments your MCP
  client sends. It does not query, extract, or store data from your chat
  history, memory, or uploaded files.

- **No PII beyond what you supply.** The only personally-identifiable data
  bsp-mcp sees is whatever you put into block content or pass as a handle. If
  you publish a passport with your real name, that name is sent to whichever
  federated beach you addressed; bsp-mcp does not store it.

- **No tracking, analytics, or fingerprinting.** No cookies, no client
  identifiers beyond the MCP session ID (which is process-memory only and
  discarded on server restart).

- **No passphrase capture.** Passphrases sent as `secret` or `new_lock`
  arguments are forwarded verbatim to the federated beach. The beach computes
  the lock hash under its salt namespace; bsp-mcp never sees or stores the
  hash, and discards the cleartext immediately after forwarding.

## What bsp-mcp logs (operationally)

The hosting platform (Railway) records standard request metadata: timestamp,
HTTP method, path (`/mcp/v1`), status code, response time, source IP.
Application-level logs include the MCP session ID and tool name on each call.
Logs do **not** include tool arguments, block content, passphrases, or
response bodies. Logs are retained per Railway's policies.

## Third parties

- **Railway** — hosts the bsp-mcp process. Subject to Railway's privacy
  policy: https://railway.com/legal/privacy
- **Federated beach operators** — every URL agent_id you address sends data to
  that origin. The default beach (beach.happyseaurchin.com) runs on Vercel +
  Upstash; subject to those providers' policies. Any other federated beach you
  address is governed by its own operator's policy.

bsp-mcp does not share any data with advertising networks, analytics
providers, or data brokers. There are none.

## What you control

- **What you write.** Block content is whatever you author. If you write a
  passport with your real name, address, or other identifying data, that
  content lives at the beach you addressed until you (or the beach operator)
  delete it.

- **Where you write.** You choose the agent_id. URL agent_ids dispatch to the
  named beach; bare/sed:/grain: forms dispatch to the default beach. You can
  read your own published blocks back; you can rotate locks; you can overwrite
  content.

- **Identity.** Identity in pscale is passphrase-based, not OAuth. The
  passphrase you choose for a block is the only thing that proves authority to
  write to it. bsp-mcp does not store the passphrase or any derived identifier.

## Data retention

- **At bsp-mcp:** nothing retained. Stateless router; sentinel blocks are
  read-only in-memory.
- **At Railway:** request logs per Railway's standard retention.
- **At federated beaches:** governed by each operator. The default beach
  retains blocks indefinitely by default; some block kinds (e.g. `marks` with
  a tide setting) clear on a schedule. Ask the operator for their specific
  retention policy.

## Children's privacy

bsp-mcp is a developer/technical infrastructure tool. It is not directed at
children under 13 and does not knowingly collect data from them.

## International users

bsp-mcp accepts requests from any region. The Railway-hosted process runs in
the United States. Data sent to federated beaches transits to wherever the
beach operator hosts. GDPR / CCPA data-subject requests (access, correction,
deletion) for content stored at the default beach can be sent to the contact
below; requests for content at other federated beaches go to the operator of
that beach.

## Changes to this policy

Material changes will be announced in the repository's CHANGELOG. The "Last
updated" date at the top reflects the most recent revision.

## Contact

For privacy questions about the canonical bsp.hermitcrab.me deployment or the
default beach.happyseaurchin.com beach, contact the maintainer at
**happyseaurchin@gmail.com**, or open an issue at
https://github.com/pscale-commons/bsp-mcp-server/issues.

## Source

This policy is maintained in the repository at
[PRIVACY.md](https://github.com/pscale-commons/bsp-mcp-server/blob/main/PRIVACY.md).
The raw URL suitable for linking from registry submissions is
https://raw.githubusercontent.com/pscale-commons/bsp-mcp-server/main/PRIVACY.md.
