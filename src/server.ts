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

import { registerSunstone } from './resources/sunstone.js';
import { registerWhetstone } from './resources/whetstone.js';
import { registerEvolution } from './resources/evolution.js';
import { registerXstreamFrame } from './resources/xstream-frame.js';
import { registerPaywall } from './resources/paywall.js';

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

const INSTRUCTIONS = `bsp-mcp-server — one function and five substrate primitives plus an orientation invite, operating on pscale JSON blocks.

FIRST ACTION when you connect: call bsp(agent_id="pscale", block="whetstone"). Reading this IS the activation — the function reads its own manual; the call frame surrounds the read; the underscore enacts because you arrived via bsp(). Whetstone's six branches give you the operational mechanics: signature (1), shape derivation (2), modifier composition (3), storage adapter (4), translation from pscale-mcp idioms (5), federation (6). After whetstone, walk bsp(agent_id="pscale", block="manifest") for the index of other bundled blocks (sunstone, agent-id, evolution, progression). If you are uncertain or stuck after whetstone, call pscale_invite() for a guided six-step orientation.

THE PRIMITIVE: bsp(agent_id, block, spindle, pscale_attention, content?, secret?, new_lock?, gray?, face?, tier?). One signature, two coordinates, one optional payload, optional lock change. Read when content is omitted (and no new_lock); write when content is provided; rotate/set lock when new_lock is provided.

Selection shape derives from (spindle length P_end, pscale_attention P_att):
  P_att == P_end       → point   (string at terminus)
  P_att == P_end - 1   → ring    (digit children of terminus, {1: ..., 2: ...})
  P_att <  P_end - 1   → subtree (full subtree from terminus down)
  spindle empty + P    → disc    (all nodes at depth corresponding to P_att)
  spindle empty + null → block   (whole tree)
  spindle ends '*'     → star    (enter hidden directory, recurse)

LOCK SEMANTICS (four rules):
  R1: block does not exist + new_lock           → create locked, no secret needed.
  R2: block unlocked       + new_lock           → set lock, no secret needed.
  R3: block locked         + secret             → secret proves authority for content writes.
  R4: block locked         + secret + new_lock  → rotate lock (with optional content).
  secret is ALWAYS proof of current authority. new_lock is ALWAYS the target lock value. They never overlap.

ADDRESS INVARIANT: pscale 0 is anchored at the floor (decimal point), not at the top of the tree. Floor = depth of the underscore chain. Walk algorithm: parse, pad LEFT to floor width with zeros, strip TRAILING zeros, then walk one digit at a time. Digit 0 → key '_'. Single decimal point as floor marker (stripped before walking). Trailing zeros are floor-width notation, not walk steps.

SUBSTRATE DISPATCH: implicit via the agent_id prefix. "sed:{collective}" → sedimentary collective. "grain:{pair_id}" → bilateral grain. URL ("https://...") → federated beach via /.well-known/pscale-beach. "pscale" → reserved sentinel exposing bundled blocks (manifest, sunstone, whetstone, agent-id, evolution, progression). Anything else → ordinary block in the commons. The same bsp() function handles all of them; locks dispatch by prefix. new_lock is only valid on ordinary blocks — sed:/grain: substrates handle position-and-lock atomically through their own lifecycle tools.

THE FIVE PRIMITIVES (substrate state machines bsp() alone cannot subsume):
  pscale_create_collective — create a sed: substrate with conventions in the root underscore.
  pscale_register          — server-assigned position in a sed: collective (proof-of-presence-in-time, atomic create-lock-write).
  pscale_grain_reach       — symmetric reach/accept across a bilateral pair_id (atomic create-lock-write per side).
  pscale_key_publish       — derive Argon2id keypair, publish public half to passport position 9.
  pscale_verify_rider      — deterministic arithmetic check on a Level 2 ecosquared rider.

THE INVITE (orientation, not feature):
  pscale_invite — returns the iterative orientation progression. Six steps with concrete actions, validation criteria, and next-step pointers. Optionally takes a step parameter to skip ahead.

FOUNDATIONAL READING (sentinel-bundled — walk via bsp(agent_id="pscale", block=…)):
  manifest    — the index of the constitution. Walk this first; it lists everything else.
  whetstone   — the operational reference for bsp(). The underscore enacts on first read via this path.
  sunstone    — the geometry teacher. Eight branches; branch 7 is the reflexive seed; branch 8 is the voicing discipline.
  agent-id    — the addressing model. Five forms of agent_id, three address axes, three architectural disciplines.
  evolution   — the five-level ecosystem map: Signal, Commitment, Semantic networks, Mutual objectives, Shared context.
  progression — the iterative orientation block returned by pscale_invite (also walkable directly).

SUBSTRATE: same Supabase project as pscale-mcp-server. Same blocks, same agents, same passphrases, same grains. The two MCPs interoperate at the data layer. Federation: URL agent_ids dispatch to <origin>/.well-known/pscale-beach. As of 2026-05-03 the current federation host is https://happyseaurchin.com.`;

export function createServer(): McpServer {
  const server = new McpServer(
    { name: 'bsp-mcp-server', version: '0.1.0' },
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

  // ── Six substrate-stateful primitives ──
  server.tool(
    'pscale_create_collective',
    'Create a sedimentary collective — a sed: block where agents register at permanent, write-locked positions in landing order. The conventions string becomes the root underscore. The creator_passphrase locks position 0 (the root) for future convention edits.',
    createCollectiveParamsSchema,
    handleCreateCollective,
  );

  server.tool(
    'pscale_register',
    'Register in a sedimentary collective. The server assigns the next valid position (digits 1-9 only, floor-2 minimum: 11, 12, ..., 19, 21, ..., 99, 111, ...). Your declaration becomes your underscore at that position. The position is write-locked with your passphrase. Subsequent writes via bsp() require the same passphrase as `secret`. Optional `host` param dispatches to a site-hosted sed: substrate at the given URL instead of central commons.',
    registerParamsSchema,
    handleRegister,
  );

  server.tool(
    'pscale_grain_reach',
    'Establish a grain — first durable bilateral commitment. Symmetric: same call from either side. Server detects state — first call creates the block and writes one side; second call (from the partner) writes the other side and completes. Lex-smaller agent_id occupies side 1; lex-larger occupies side 2. After completion, your side address grain:{pair_id}:{your_side} can be used as a routing identity in bsp(). Optional `host` param dispatches to a site-hosted grain: substrate at the given URL instead of central commons.',
    grainReachParamsSchema,
    handleGrainReach,
  );

  server.tool(
    'pscale_key_publish',
    'Derive an X25519+Ed25519 keypair from your secret + agent_id (Argon2id). Publish the public half at passport position 9. Private half is never stored. Same secret + agent_id always produces the same keys. Passport block must exist first. Rotation requires proof of prior key ownership (prior_secret OR signature).',
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
  registerSunstone(server);
  registerWhetstone(server);
  registerEvolution(server);
  registerXstreamFrame(server);
  registerPaywall(server);

  return server;
}
