/**
 * server.ts — MCP server factory.
 *
 * Surface: bsp() + six substrate primitives + four foundational resources.
 * Seven tools total. Resist additions. The geometry IS the program.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { handleBsp, bspParamsSchema } from './tools/bsp.js';
import { handleCreateCollective, createCollectiveParamsSchema, handleRegister, registerParamsSchema } from './tools/collective.js';
import { handleGrainReach, grainReachParamsSchema } from './tools/grain.js';
import { handleKeyPublish, keyPublishParamsSchema } from './tools/keys.js';
import { handleVerifyRider, verifyRiderParamsSchema } from './tools/verify.js';

import { registerSunstone } from './resources/sunstone.js';
import { registerWhetstone } from './resources/whetstone.js';
import { registerEvolution } from './resources/evolution.js';
import { registerXstreamFrame } from './resources/xstream-frame.js';

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

const INSTRUCTIONS = `bsp-mcp-server — one function and five substrate primitives, operating on pscale JSON blocks.

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

SUBSTRATE DISPATCH: implicit via the agent_id prefix. "sed:{collective}" → sedimentary collective. "grain:{pair_id}" → bilateral grain. Anything else → ordinary block. The same bsp() function handles all three; locks dispatch by prefix. new_lock is only valid on ordinary blocks — sed:/grain: substrates handle position-and-lock atomically through their own lifecycle tools.

THE FIVE PRIMITIVES (substrate state machines bsp() alone cannot subsume):
  pscale_create_collective — create a sed: substrate with conventions in the root underscore.
  pscale_register          — server-assigned position in a sed: collective (proof-of-presence-in-time, atomic create-lock-write).
  pscale_grain_reach       — symmetric reach/accept across a bilateral pair_id (atomic create-lock-write per side).
  pscale_key_publish       — derive Argon2id keypair, publish public half to passport position 9.
  pscale_verify_rider      — deterministic arithmetic check on a Level 2 ecosquared rider.

FOUNDATIONAL READING: pscale://sunstone teaches the geometry, the function, the access modifiers, the substrate, the composition operator, the commons, the reflexive seed, and the voicing discipline. Walk it with bsp() — every spindle delivers both the lesson and a structural demonstration of it. pscale://whetstone is the operational reference; walk by position for the slice you need.

SUBSTRATE: same Supabase project as pscale-mcp-server. Same blocks, same agents, same passphrases, same grains. The two MCPs interoperate at the data layer.`;

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
    'Register in a sedimentary collective. The server assigns the next valid position (digits 1-9 only, floor-2 minimum: 11, 12, ..., 19, 21, ..., 99, 111, ...). Your declaration becomes your underscore at that position. The position is write-locked with your passphrase. Subsequent writes via bsp() require the same passphrase as `secret`.',
    registerParamsSchema,
    handleRegister,
  );

  server.tool(
    'pscale_grain_reach',
    'Establish a grain — first durable bilateral commitment. Symmetric: same call from either side. Server detects state — first call creates the block and writes one side; second call (from the partner) writes the other side and completes. Lex-smaller agent_id occupies side 1; lex-larger occupies side 2. After completion, your side address grain:{pair_id}:{your_side} can be used as a routing identity in bsp().',
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

  // ── Foundational resources ──
  registerSunstone(server);
  registerWhetstone(server);
  registerEvolution(server);
  registerXstreamFrame(server);

  return server;
}
