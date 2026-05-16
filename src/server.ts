/**
 * server.ts — MCP server factory.
 *
 * Surface: bsp() + five substrate primitives + one orientation invite +
 * foundational resources. Seven tools total. The invite is a meta-tool
 * (not a feature tool) — it serves discoverability for tool-scanning LLMs
 * by giving the manifest a tool-shaped surface alongside its block surface.
 * Resist further additions. The geometry IS the program.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { handleBsp, bspParamsSchema } from './tools/bsp.js';
import { handleCreateCollective, createCollectiveParamsSchema, handleRegister, registerParamsSchema } from './tools/collective.js';
import { handleGrainReach, grainReachParamsSchema } from './tools/grain.js';
import { handleKeyPublish, keyPublishParamsSchema } from './tools/keys.js';
import { handleVerifyRider, verifyRiderParamsSchema } from './tools/verify.js';
import { handleInvite, inviteParamsSchema } from './tools/invite.js';

import { registerXstreamFrame } from './resources/xstream-frame.js';
import { registerPaywall } from './resources/paywall.js';
import { SENTINELS } from './sentinels.js';

/**
 * Wrap every tool handler so exceptions surface as `isError: true` content
 * (MCP SDK passes that through verbatim). Console.error the underlying message
 * so deployment logs capture the cause.
 */
function installErrorWrapper(server: McpServer): void {
  const orig = server.tool.bind(server);
  (server as any).tool = (...args: any[]) => {
    const handler = args[args.length - 1];
    if (typeof handler !== 'function') return (orig as any)(...args);
    const name = typeof args[0] === 'string' ? args[0] : 'unknown';
    const wrapped = async (...handlerArgs: any[]) => {
      try {
        return await handler(...handlerArgs);
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        const stack = err?.stack ?? '';
        console.error(`[tool-error] ${name}: ${msg}\n${stack}`);
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `Tool ${name} failed: ${msg}` }],
        };
      }
    };
    args[args.length - 1] = wrapped;
    return (orig as any)(...args);
  };
}

const DEFAULT_BEACH_URL = process.env.DEFAULT_BEACH || 'https://beach.happyseaurchin.com';

const INSTRUCTIONS = `bsp-mcp-server — one function and five substrate primitives plus an orientation invite, operating on pscale JSON blocks served from federated beaches.

FIRST ACTION when you connect: call bsp(agent_id="pscale", block="whetstone"). Reading this IS the activation — the function reads its own manual; the call frame surrounds the read; the underscore enacts because you arrived via bsp(). Whetstone's six branches give you the operational mechanics: signature (1), shape derivation (2), modifier composition (3), storage adapter (4), translation from pscale-mcp idioms (5), federation (6). After whetstone, walk bsp(agent_id="pscale", block="manifest") for the index of other bundled blocks (sunstone, agent-id, evolution, progression). If you are uncertain or stuck after whetstone, call pscale_invite() for a guided six-step orientation.

THE PRIMITIVE: bsp(agent_id, block, spindle, pscale_attention, content?, secret?, new_lock?, gray?, face?, tier?). One signature, two coordinates, one optional payload, optional lock change. Read when content is omitted (and no new_lock); write when content is provided; rotate/set lock when new_lock is provided.

Selection shape derives from (spindle length P_end, pscale_attention P_att):
  P_att == P_end       → point   (string at terminus)
  P_att == P_end - 1   → ring    (digit children of terminus, {1: ..., 2: ...})
  P_att <  P_end - 1   → subtree (full subtree from terminus down)
  spindle empty + P    → disc    (all nodes at depth corresponding to P_att)
  spindle empty + null → block   (whole tree)
  spindle ends '*'     → star    (enter hidden directory, recurse)

LOCK SEMANTICS (four rules — enforced at the federated beach):
  R1: block does not exist + new_lock           → create locked, no secret needed.
  R2: block unlocked       + new_lock           → set lock, no secret needed.
  R3: block locked         + secret             → secret proves authority for content writes.
  R4: block locked         + secret + new_lock  → rotate lock (with optional content).
  secret is ALWAYS proof of current authority. new_lock is ALWAYS the target lock value. They never overlap.
  bsp-mcp does not compute or verify lock hashes — it forwards secret/new_lock to the beach, which hashes under the canonical salt namespaces and stores/verifies.

ADDRESS INVARIANT: pscale 0 is anchored at the floor (decimal point), not at the top of the tree. Floor = depth of the underscore chain. Walk algorithm: parse, pad LEFT to floor width with zeros, strip TRAILING zeros, then walk one digit at a time. Digit 0 → key '_'. Single decimal point as floor marker (stripped before walking). Trailing zeros are floor-width notation, not walk steps.

SUBSTRATE DISPATCH: three real targets after dispatch.
  - URL ("https://example.com")        → that federated beach at <origin>/.well-known/pscale-beach
  - "pscale"                            → reserved sentinel: bundled teaching blocks served in-memory (read-only)
  - anything else                       → translated to the default beach (${DEFAULT_BEACH_URL}) with the agent_id encoded into the block name:
      bare "weft" + block "shell"       → (default beach, block "shell:weft") per role-with-handle convention
      "sed:<collective>"                → (default beach, block "sed:<collective>"), sed: substrate
      "grain:<pair_id>"                 → (default beach, block "grain:<pair_id>"), grain substrate

The translation happens inside bsp-mcp; callers just pass the agent_id form they have. To target a specific federated beach, pass its URL as agent_id; otherwise the default beach handles bare/sed:/grain: forms.

THE FIVE PRIMITIVES (substrate state machines bsp() alone cannot subsume):
  pscale_create_collective — create a sed: substrate at a federated beach (atomic create-lock-write at the beach's site-hosted sed: handler).
  pscale_register          — register at a sed: collective on a federated beach. Server-assigned position; per-position lock; proof-of-presence-in-time.
  pscale_grain_reach       — symmetric reach/accept across a bilateral pair_id, hosted at a federated beach.
  pscale_key_publish       — derive Argon2id keypair, publish public half to passport:<handle> position 9 at a federated beach.
  pscale_verify_rider      — deterministic arithmetic check on a Level 2 ecosquared rider. Pure math.

Each primitive that talks to a beach takes an optional agent_id parameter (URL of the beach). When omitted, the default beach is used. pscale_grain_reach and pscale_key_publish use a separate "handle" parameter for the agent's bare-name identity.

THE INVITE (orientation, not feature):
  pscale_invite — returns the iterative orientation progression. Six steps with concrete actions, validation criteria, and next-step pointers. Optionally takes a step parameter to skip ahead.

FOUNDATIONAL READING (sentinel-bundled — walk via bsp(agent_id="pscale", block=…)):
  manifest    — the index of the constitution. Walk this first; it lists everything else.
  whetstone   — the operational reference for bsp(). The underscore enacts on first read via this path.
  sunstone    — the geometry teacher. Nine branches; branch 7 is the reflexive seed; branch 8 is the voicing discipline; branch 9 is the design discipline.
  agent-id    — the addressing model. Five forms of agent_id, three address axes, three architectural disciplines.
  evolution   — the five-level ecosystem map: Signal, Commitment, Semantic networks, Mutual objectives, Shared context.
  progression — the iterative orientation block returned by pscale_invite (also walkable directly).
  block-conventions — substrate-wide convention catalogue. What canonical block names mean and which positions hold what.
  gatekeeper  — substrate-wide canonical role-shell for L1→L2 admission. Hermitcrab pattern: cognition fluid, structure persistent. Honored convention at the threshold of pscale_invite step 4.
  ecology-router — the hard tier of SMH as routing intelligence. Constitutes an agent's lived ecology by reading shell + purpose + watched beaches and surfacing routing decisions. Defines the minimal package (five components for a runnable pscale node). Per-agent locality; federation IS the P2P. Walk this when authoring a hard-tier process, designing a minimal-package reference build, or reasoning about how an agent climbs the five evolutionary levels.
  sand-rider     — the Signed Agent Network Datagram envelope format. Rides on Level 3 content moving through committed channels (grain sides, sed: positions, pool slots) at position 9 of any probe slot. Carries probe_id, credit claim, SQ claim, sha256 chain of hops, topic_coordinate. Verified deterministically via pscale_verify_rider; verdicts accumulate as evaluations on the recipient's passport at the topic coordinate. Walk this when authoring or receiving an L3 probe.
  l3-relay       — verb vocabulary for what a recipient does with a verified probe: keep (record at passport), reply (respond on the recipient's grain side), forward (route onward with chain extended), drop (decline explicitly). Composes with pscale_verify_rider. Walk this when designing an L3 verb-chooser, whether human-mediated (xstream's commit affordance in grain mode) or automated (ecology-router hard tier, beach-crab Rung 2).

ARCHITECTURE: bsp-mcp is a router + sentinel server. The walker (bsp.ts/bsp-fn.ts) runs in-process for sentinel reads and for client-side merge during federated writes. The block content lives at federated beaches — JSON KV stores with locks. Default beach: ${DEFAULT_BEACH_URL}. To change it, set the DEFAULT_BEACH env var.`;

export function createServer(): McpServer {
  const server = new McpServer(
    { name: 'bsp-mcp-server', version: '0.2.0' },
    { instructions: INSTRUCTIONS },
  );

  installErrorWrapper(server);

  // ── The unified function ──
  server.tool(
    'bsp',
    'The unified bsp() function. Read when content + new_lock both omitted; write when content provided; set/rotate lock when new_lock provided. Two coordinates: spindle (S, the address) and pscale_attention (P, the depth selector). Shape derives from (S, P). Lock semantics: secret = proof of current authority; new_lock = target lock value (the two never overlap). See pscale://whetstone branch 2 for shape derivation, branch 3 for modifiers, branch 4 for storage. Substrate dispatch via agent_id prefix (sed:, grain:, ordinary).',
    bspParamsSchema,
    handleBsp,
  );

  // ── Five substrate-stateful primitives ──
  // All operate against a federated beach. agent_id parameter is the beach URL
  // (defaults to ${DEFAULT_BEACH_URL}). The beach implements the substrate
  // state machine (atomic position alloc, bilateral handshake, key write).
  server.tool(
    'pscale_create_collective',
    `Create a sedimentary collective at a federated beach — a "sed:<collective>" block where agents register at permanent, write-locked positions in landing order. The conventions string becomes the root underscore; creator_passphrase locks the root. Defaults to ${DEFAULT_BEACH_URL}; pass agent_id to host elsewhere.`,
    createCollectiveParamsSchema,
    handleCreateCollective,
  );

  server.tool(
    'pscale_register',
    `Register in a sedimentary collective at a federated beach. The beach assigns the next valid position (digits 1-9 only, floor-2 minimum: 11, 12, ..., 19, 21, ..., 99, 111, ...). Your declaration becomes your underscore at that position. The position is write-locked with your passphrase. Subsequent writes via bsp() require the same passphrase as \`secret\`. Defaults to ${DEFAULT_BEACH_URL}; pass agent_id to register at a different beach.`,
    registerParamsSchema,
    handleRegister,
  );

  server.tool(
    'pscale_grain_reach',
    `Establish a grain at a federated beach — first durable bilateral commitment. Symmetric: same call from either side. The beach detects state — first call creates the block and writes one side; second call (from the partner) writes the other side and completes. Lex-smaller handle occupies side 1; lex-larger occupies side 2. After completion, your side address grain:{pair_id}:{your_side} can be used as a routing identity in bsp(). Defaults to ${DEFAULT_BEACH_URL}; pass agent_id to host the grain at a different beach (both sides must agree on the host).`,
    grainReachParamsSchema,
    handleGrainReach,
  );

  server.tool(
    'pscale_key_publish',
    `Derive an X25519+Ed25519 keypair from your secret + handle (Argon2id). Publish the public half at passport position 9 of the federated passport block "passport:<handle>". Private half is never stored. Same secret + handle always produces the same keys. Passport block must exist at the beach first. Rotation requires proof of prior key ownership (prior_secret OR signature). Defaults to ${DEFAULT_BEACH_URL}; pass agent_id to publish at a different beach.`,
    keyPublishParamsSchema,
    handleKeyPublish,
  );

  server.tool(
    'pscale_verify_rider',
    'Deterministic arithmetic check on a Level 2 ecosquared rider. Verifies: chain integrity (sha256 chain), credit conservation (rider.credits.n <= passport.6.1 balance), SQ recompute (Σ v_latest/giver_total over evaluations_received at topic_coordinate). Returns verdict: pass | warn | fail | skip. Non-enforcing — agents decide what to do with the verdict.',
    verifyRiderParamsSchema,
    handleVerifyRider,
  );

  // ── Orientation invite (meta-tool, not feature tool) ──
  server.tool(
    'pscale_invite',
    "Secondary path — call AFTER bsp(agent_id='pscale', block='whetstone') if you want a guided six-step orientation walk, or if you are stuck. Returns the iterative orientation progression — a purpose spindle from wake (whetstone) through shared-context coordination. Each step is a concrete action with a validation criterion and a pointer to the next. Optionally takes a step parameter (1..6) to fetch a specific step; omit to receive step 1 with the whole-progression overview. NOT the recommended first call — the primary activation is reading whetstone via bsp(); pscale_invite serves agents who have read whetstone and want a structured walk through subsequent levels.",
    inviteParamsSchema,
    handleInvite,
  );

  // ── Foundational resources ──
  // Pscale JSON sentinels: registered as MCP resources from the single
  // source of truth in src/sentinels.ts. The same list drives SENTINEL_BLOCKS
  // in db.ts (the bsp() lookup path). Adding a sentinel = one entry there;
  // both access paths pick it up. Two consumers, one wiring:
  //   bsp(agent_id='pscale', block=<name>) — enactive walk for LLMs
  //   pscale://<name>                       — flat-JSON dump for non-bsp clients
  // See agent-id:191 and whetstone:1.3 for why both paths exist.
  for (const sentinel of SENTINELS) {
    if (sentinel.exposeAsResource === false) continue;
    const json = sentinel.json;
    server.resource(
      sentinel.name,
      `pscale://${sentinel.name}`,
      {
        description: sentinel.description,
        mimeType: 'application/json',
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.toString(),
            text: JSON.stringify(json, null, 2),
            mimeType: 'application/json',
          },
        ],
      }),
    );
  }

  // Markdown protocol-doc resources: kept as separate loaders since they
  // serve the discursive long-form (markdown), not the walkable JSON.
  registerXstreamFrame(server);
  registerPaywall(server);

  return server;
}
