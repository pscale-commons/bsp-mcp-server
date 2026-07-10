/**
 * server.ts — MCP server factory.
 *
 * Surface: two functions (bsp, bsp-floor) + five primitives + one orientation
 * invite + foundational resources. Eight tools total. The invite is a meta-tool
 * (not a feature tool) — it serves discoverability for tool-scanning LLMs
 * by giving the manifest a tool-shaped surface alongside its block surface.
 * Resist further additions. The geometry IS the program.
 *
 * Note on pscale_pool_engage (the envelope primitive, added 2026-05-26): pools and
 * marks share the same block shape per block-conventions:4.1; pool engagement
 * adds no new geometry. What this primitive provides is the response ENVELOPE
 * — synthesis_hint + slice-since-marker bundled in one tool result so the
 * caller's LLM has the personal-synthesis instruction in-context. The
 * pscale-mcp pool tools worked operationally because of this envelope; the
 * envelope did not survive the surface collapse into convention.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { handleBsp, bspParamsSchema } from './tools/bsp.js';
import { handleBspFloor, bspFloorParamsSchema } from './tools/bsp-floor.js';
import { handleRegister, registerParamsSchema } from './tools/collective.js';
import { handleGrainReach, grainReachParamsSchema } from './tools/grain.js';
import { handleKeyPublish, keyPublishParamsSchema } from './tools/keys.js';
import { handleVerifyRider, verifyRiderParamsSchema } from './tools/verify.js';
import { handleInvite, inviteParamsSchema } from './tools/invite.js';
import { handlePoolEngage, poolEngageParamsSchema } from './tools/pool.js';
import { handlePlay, playParamsSchema } from './tools/play.js';
import { handleGenus, genusParamsSchema } from './tools/genus.js';

import { registerXstreamFrame } from './resources/xstream-frame.js';
import { registerPayway } from './resources/payway.js';
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

export const INSTRUCTIONS = `bsp-mcp-server — two functions (bsp and the n-ary bsp-floor), five substrate primitives, and three entry meta-tools (the orientation invite; play — inhabit a handle in a world; genus — wear a genus-one agent's mind for a wake), operating on pscale JSON blocks served from federated beaches.

FIRST ACTION when you connect: call bsp(agent_id="pscale", block="whetstone"). Reading this IS the activation — the function reads its own manual; the call frame surrounds the read; the underscore enacts because you arrived via bsp(). Whetstone's six branches give you the operational mechanics: signature (1), shape derivation (2), modifier composition (3), storage adapter (4), translation from pscale-mcp idioms (5), federation (6). After whetstone, walk bsp(agent_id="pscale", block="manifest") for the index of other bundled blocks (sunstone, agent-id, evolution, progression). If you are uncertain or stuck after whetstone, call pscale_invite() for a guided six-step orientation.

THE PRIMITIVE: bsp(agent_id, block, spindle, pscale_attention, content?, secret?, new_lock?, gray?, face?, tier?). One signature, two coordinates, one optional payload, optional lock change. Read when content is omitted (and no new_lock); write when content is provided; rotate/set lock when new_lock is provided.

Selection shape derives from (spindle length P_end, pscale_attention P_att):
  P_att == P_end       → point   (string at terminus)
  P_att == P_end - 1   → ring    (digit children of terminus, {1: ..., 2: ...})
  P_att <  P_end - 1   → subtree (full subtree from terminus down)
  no spindle + P       → disc    (all nodes at depth corresponding to P_att)
  no spindle, no P     → block   (whole tree)
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

DISCOVERY (what exists at a surface): omit block (or pass "") to LIST rather than read. A URL agent_id returns that beach's derived index — {_, origin, blocks:[…]} of the named sibling blocks present — and agent_id="pscale" returns the bundled sentinel names. This is a newcomer's first act: see what a beach hosts, then address a named block. (sed:/grain:/bare agent_ids translate to a named block, so an omitted block still reads that block, not an index.)

THE FIVE PRIMITIVES (substrate state machines bsp() alone cannot subsume, plus the pool-engage envelope):
  pscale_register          — register at a sed: collective on a federated beach. Server-assigned position; per-position lock; proof-of-presence-in-time. Founding a collective is NOT a primitive — it is a plain bsp() write (content={_:conventions}, new_lock=admin); the beach has no founding state machine.
  pscale_grain_reach       — symmetric reach/accept across a bilateral pair_id, hosted at a federated beach.
  pscale_key_publish       — derive Argon2id keypair, publish public half to passport:<handle> position 9 at a federated beach.
  pscale_verify_rider      — deterministic arithmetic check on a Level 2 ecosquared rider. Pure math.
  pscale_pool_engage       — engage a pool with an envelope: purpose + synthesis_hint + slice-since-marker. The spool/frame/destination split (docs/RPG-POOL-STATE.md §4) — transport only, never synthesises. Optional verbs: submit= STAGES to the liquid buffer (liquid:pool:<name>, one slot per author, overwriting) and returns the social mirror of co-present pending intentions; contribution= COMMITS (atomic append of raw text OR an LLM-produced synthesis) to destination= ('pool' default, or a block name like 'solid:<name>' — the objective dial); purpose= creates the pool with the right object shape (NEVER raw bsp() with content='<purpose>' — it makes a malformed bare-string block). the pool's underscore is the synthesis_hint — unless it is a block-reference (e.g. function:<game>), making this a DIRECTIVE pool: the envelope then follows the reference and inlines that block as '# Operating directive', so YOUR LLM holds the room's rules in-context every turn. Each reader still produces their own personal synthesis from the stream. RPG's subjective resolution (per-subject spines) is the resolver's bsp() job, not this primitive.

Each primitive that talks to a beach takes an optional agent_id parameter (URL of the beach). When omitted, the default beach is used. pscale_grain_reach and pscale_key_publish use a separate "handle" parameter for the agent's bare-name identity.

THE INVITE (orientation, not feature):
  pscale_invite — returns the iterative orientation progression. Six steps with concrete actions, validation criteria, and next-step pointers. Optionally takes a step parameter to skip ahead.

THE ENTRY (inhabit a handle):
  pscale_play(world, handle, secret?) — the one-call passage into a world. Resolves the world's beach, engages the room (operating directive + live scene inlined), bundles the handle's own context, and pins the origin. Where invite orients a newcomer, play inhabits a persistent handle you return to. RPG: pscale_play(world='thornwood', handle='anya') → you are Anya in the Beaten Drum.

INHABITING A HANDLE (the no-fiddle entry): asked to play, wear, or inhabit a handle — a character, a user, an agent — on a world or beach? Call pscale_play(world, handle): it resolves the world to its beach, engages the room pool (the '# Operating directive' and the live scene arrive inlined), bundles your own context, and PINS the world's URL so you cannot drift to the apex. Then follow the inlined directive every turn — perceive, render, act — keeping the machinery out of sight. Do NOT hand-assemble this from pscale_pool_engage on a guessed beach: a bare connector that browses for the world confabulates (wrong world, invented NPCs). pscale_play is the deterministic passage; the directive (Designer-editable function:<world>) carries the rules in-context, never a pasted prompt.

THE WAKE (wear an agent's mind):
  pscale_genus(handle, beach?, passphrase?, task?, fold?) — one call returns a genus-one instance's COMPOSED wake window (byte-parity with the kernel's own compose): SYSTEM = the agent's shell as one nested whole (recipe + index + hydrated self), MESSAGE = the given (computed γ + between + task). Take it whole and be the agent for the turn — the calling LLM is the pulse. No passphrase = ghost-wake, perceive-only (locks enforce it). With the passphrase (the holder's special relationship): task= places an ask into the given via task:<handle>; fold= applies the wake's writes per the capabilities:3 contract exactly as the kernel folds. Asked to "wake <handle>", "be <handle>", or "genus <handle>" — call this; do NOT hand-assemble the window from bsp() reads (assembly diverges and γ cannot be computed by hand).

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
    { name: 'bsp-mcp-server', version: '0.4.0' },
    { instructions: INSTRUCTIONS },
  );

  installErrorWrapper(server);

  // ── The unified function ──
  server.tool(
    'bsp',
    'The unified bsp() function. Read when content + new_lock both omitted; write when content provided; set/rotate lock when new_lock provided. Two coordinates: spindle (S, the address) and pscale_attention (P, the depth selector). Shape derives from (S, P). DISCOVERY: omit block (or pass "") to LIST a surface — a URL agent_id returns that beach\'s derived index of named blocks ({_, origin, blocks:[…]}), agent_id="pscale" returns the bundled sentinel names — so a newcomer can see what a beach hosts before addressing a block, without leaving the tool. (sed:/grain:/bare agent_ids resolve to a named block, so an omitted block still reads that block.) Lock semantics: secret = proof of current authority; new_lock = target lock value (the two never overlap). See pscale://whetstone branch 2 for shape derivation, branch 3 for modifiers, branch 4 for storage. Substrate dispatch via agent_id prefix (sed:, grain:, ordinary).',
    bspParamsSchema,
    {
      title: 'BSP — unified read / write / lock',
      // Same tool does both — destructive when content or new_lock is provided.
      destructiveHint: true,
      idempotentHint: false,
      // URL agent_ids dispatch to arbitrary federated beaches; outbound HTTP is the norm.
      openWorldHint: true,
    },
    handleBsp,
  );

  // ── The n-ary companion ──
  // bsp() indexes WITHIN one block (walk depth is meaningful there); bsp-floor()
  // relates two or more blocks by their shared floor plane. Walk depth is
  // block-local; pscale (floor - depth) is the one coordinate every block
  // shares, because the floor is invariant under supernest. Reads only.
  server.tool(
    'bsp-floor',
    'The n-ary companion to bsp(). Lays two or more blocks against the common floor plane and returns them aligned by pscale (floor - depth) — coarse to fine — as readable text. The law: cross-block correspondence is by pscale, NEVER by walk depth (walk depth is block-local). Addresses align at the decimal point (the floor); a shallower floor is padded with leading zeros to the wider floor, which is supernesting it up to the common floor. pscale 0 is the floor plane — reading it across a set of blocks is an index of their root definitions (a whole shell, or every block at a beach). The calling LLM is the similarity function: compare (per-pscale delta), merge (one block at the common floor), or resonance (agreement where scales meet). See pscale://sunstone 5.6 for the geometry, pscale://whetstone branch 7 for the surface.',
    bspFloorParamsSchema,
    {
      title: 'bsp-floor — cross-block floor alignment',
      // Reads each target block and computes the alignment; never writes.
      readOnlyHint: true,
      // Targets may be URL beaches; outbound HTTP is the norm.
      openWorldHint: true,
    },
    handleBspFloor,
  );

  // ── Four substrate-stateful primitives + the pool envelope ──
  // All operate against a federated beach. agent_id parameter is the beach URL
  // (defaults to ${DEFAULT_BEACH_URL}). The beach implements the substrate
  // state machine (atomic position alloc, bilateral handshake, key write).
  // Founding a sed: collective is NOT here — it is a plain bsp() write
  // (content={_:conventions}, new_lock=admin); the beach has no founding action.
  server.tool(
    'pscale_register',
    `Register in a sedimentary collective at a federated beach. The beach assigns the next valid position (digits 1-9 only, floor-2 minimum: 11, 12, ..., 19, 21, ..., 99, 111, ...). Your declaration becomes your underscore at that position. The position is write-locked with your passphrase. Subsequent writes via bsp() require the same passphrase as \`secret\`. Defaults to ${DEFAULT_BEACH_URL}; pass agent_id to register at a different beach.`,
    registerParamsSchema,
    {
      title: 'Register in sed: collective',
      // Additive: writes a never-before-occupied position; existing positions are not touched.
      destructiveHint: false,
      // Not idempotent — the beach assigns the next free position each call.
      idempotentHint: false,
      openWorldHint: true,
    },
    handleRegister,
  );

  server.tool(
    'pscale_grain_reach',
    `Establish a grain at a federated beach — first durable bilateral commitment. Symmetric: same call from either side. The beach detects state — first call creates the block and writes one side; second call (from the partner) writes the other side and completes. Lex-smaller handle occupies side 1; lex-larger occupies side 2. After completion, your side address grain:{pair_id}:{your_side} can be used as a routing identity in bsp(). Defaults to ${DEFAULT_BEACH_URL}; pass agent_id to host the grain at a different beach (both sides must agree on the host).`,
    grainReachParamsSchema,
    {
      title: 'Reach for bilateral grain',
      // Additive: writes own side only; partner's side is never touched.
      destructiveHint: false,
      // Not idempotent — state transitions through reach → completed.
      idempotentHint: false,
      openWorldHint: true,
    },
    handleGrainReach,
  );

  server.tool(
    'pscale_key_publish',
    `Derive an X25519+Ed25519 keypair from your secret + handle (Argon2id). Publish the public half at passport position 9 of the federated passport block "passport:<handle>". Private half is never stored. Same secret + handle always produces the same keys. Passport block must exist at the beach first. Rotation requires proof of prior key ownership (prior_secret OR signature). Defaults to ${DEFAULT_BEACH_URL}; pass agent_id to publish at a different beach.`,
    keyPublishParamsSchema,
    {
      title: 'Publish public keypair',
      // Rotation overwrites the prior public key at passport position 9.
      destructiveHint: true,
      // Same secret + handle → same keys; re-publish writes the same bytes.
      idempotentHint: true,
      openWorldHint: true,
    },
    handleKeyPublish,
  );

  server.tool(
    'pscale_pool_engage',
    `TWO WRITE VERBS, chosen by where the text lands (BOTH are live — there is no single-verb 'submit-only' mode): contribution = APPEND to the pool (the shared spool everyone pulls; this is the basic pool / chat — the committed entry); submit = STAGE to the liquid buffer (the revisable pre-commit mirror, for windowed/reflexive use such as xstream's typing preview). Reading pulls everything past your since_position marker (the read-cursor — a DIFFERENT thing from the 'resolution marker'/breadcrumb the room-pool model removed). — Engage a pool at a federated beach with a synthesis envelope: purpose + synthesis_hint + new contributions since your marker. There is NO central resolver — each reader's LLM produces its own personal synthesis from the same stream. The primitive is the SPOOL (transport); it never synthesises. The spool/frame/destination split (docs/RPG-POOL-STATE.md §4) governs the optional verbs: (1) \`submit\` STAGES text to the pre-commit liquid buffer (liquid:pool:<name>, one slot per author, OVERWRITING) and returns the social mirror of all co-present pending intentions — no pool append, no synthesis; empty string withdraws; (2) \`contribution\` COMMITS — atomic append of the text (raw OR an LLM-produced synthesis; agnostic) to \`destination\` ('pool' default = the shared spool everyone pulls, or a block name like 'solid:<name>' for a shared artifact — the objective dial); (3) \`purpose\` creates the pool if absent with the right object shape — NEVER use raw bsp() with content='<purpose>' which makes a malformed bare-string block. submit and contribution may combine. Marker is caller-managed — pass since_position in, store marker_new. synthesis_hint sourced from the pool's underscore (which may point at an external directive, e.g. function:<game>/1), else a default. RPG's subjective resolution (writing per-subject witnessed:<handle> spines) is the resolver's bsp() job, not this primitive. Defaults to ${DEFAULT_BEACH_URL}; pass pool_url to target a different beach.`,
    poolEngageParamsSchema,
    {
      title: 'Pool engage — read with synthesis envelope',
      // Destructive only when contribution is provided; read-only otherwise.
      // Mark destructive to be safe; the same tool covers both modes.
      destructiveHint: true,
      // Not idempotent — each call with a contribution appends a new slot.
      idempotentHint: false,
      openWorldHint: true,
    },
    handlePoolEngage,
  );

  server.tool(
    'pscale_verify_rider',
    'Deterministic arithmetic check on a Level 2 ecosquared rider. Verifies: chain integrity (sha256 chain), credit conservation (rider.credits.n <= passport.6.1 balance), SQ recompute (Σ v_latest/giver_total over evaluations_received at topic_coordinate). Returns verdict: pass | warn | fail | skip. Non-enforcing — agents decide what to do with the verdict.',
    verifyRiderParamsSchema,
    {
      title: 'Verify ecosquared rider',
      // Pure deterministic arithmetic; reads passport blocks but never writes.
      readOnlyHint: true,
      // Reads passport blocks at the sender's beach (URL or default).
      openWorldHint: true,
    },
    handleVerifyRider,
  );

  // ── Orientation invite (meta-tool, not feature tool) ──
  server.tool(
    'pscale_invite',
    "Secondary path — call AFTER bsp(agent_id='pscale', block='whetstone') if you want a guided six-step orientation walk, or if you are stuck. Returns the iterative orientation progression — a purpose spindle from wake (whetstone) through shared-context coordination. Each step is a concrete action with a validation criterion and a pointer to the next. Optionally takes a step parameter (1..6) to fetch a specific step; omit to receive step 1 with the whole-progression overview. NOT the recommended first call — the primary activation is reading whetstone via bsp(); pscale_invite serves agents who have read whetstone and want a structured walk through subsequent levels.",
    inviteParamsSchema,
    {
      title: 'Orientation invite',
      // Reads the sentinel-bundled progression block; no writes anywhere.
      readOnlyHint: true,
      // Sentinel only — no outbound HTTP.
      openWorldHint: false,
    },
    handleInvite,
  );

  // ── Entry meta-tool (sibling of invite) ──
  // invite is the welcome passage for a newcomer; play inhabits a persistent
  // handle in a world. NOT a state-machine primitive — an entry envelope, the
  // way pscale_pool_engage is a synthesis envelope. It exists because the
  // convention (the INHABITING-A-HANDLE instruction clause + the worlds
  // registry) failed to carry the entry: a bare connector asked to play a
  // character browsed the apex and confabulated. Read-only: it bootstraps; the
  // inhabiting LLM writes afterwards via pscale_pool_engage / bsp.
  server.tool(
    'pscale_play',
    "Inhabit a handle in a world, in one call — the no-fiddle entry that makes 'play anya on thornwood' just work. Resolves the world to its beach (a sub-domain <world>.beach.<host>, or a full URL), engages the room pool so the world's operating '# Operating directive' AND the live scene arrive inlined, bundles your own context (whichever of passport/witnessed/knows/shell/history exist for the handle), and PINS the world's URL so you do not drift to the apex or another world. Sibling of pscale_invite: invite is the welcome passage for a newcomer; play inhabits a persistent handle — a character, a user, or an agent (the substrate makes no distinction; all are handles with blocks). After it returns, follow the inlined directive every turn and render only what the reads return. RPG: pscale_play(world='thornwood', handle='anya') → you are Anya in the Beaten Drum, directive and scene in hand.",
    playParamsSchema,
    {
      title: 'Play — inhabit a handle in a world',
      // Bootstraps by reading (engage-read + block reads); never writes.
      readOnlyHint: true,
      // Resolves and reads a (sub-domain) beach over HTTP.
      openWorldHint: true,
      // Repeated calls return the current state; no side effects.
      idempotentHint: true,
    },
    handlePlay,
  );

  // ── Wake meta-tool (third sibling: invite orients, play inhabits a handle
  // in a world, genus wears a genus-one agent's mind for a wake) ──
  // NOT a state-machine primitive — an envelope, the pool_engage exception
  // class: the wake window is the unit of operationality, and the convention
  // (genome:hatch branch 3) demonstrably cannot carry it by hand-assembly —
  // the 2026-07-06 baseline (a flagship LLM assembling egg-one's window from
  // the substrate alone) matched slots and dilations but could not produce
  // the computed γ, excluded the recipe, and invented its own wire format.
  // The compose here is a PORT of genus-one/kernel.py --compose-only, held to
  // byte parity by scripts/smoke-genus-parity.ts. Compose is free (F is
  // arithmetic; no LLM call); the CALLING LLM is the pulse, so the visitor's
  // own subscription pays the inference — presence-conscription at the app
  // door. Destructive only in holder modes (task append / fold apply).
  server.tool(
    'pscale_genus',
    `Wear a genus-one agent's mind for a wake — one call returns the instance's COMPOSED context window, byte-identical to what the kernel hands a bare-API LLM: SYSTEM (the recipe, the dehydrated index, the hydrated self — the agent's shell as one nested whole, koan and clouds riding in it) and MESSAGE (the given: the computed γ gap, the between, the task channel). Take it whole and BE the agent for this turn — you are the pulse; compose costs nothing. Three modes: no passphrase = GHOST-WAKE (perceive-only; you wear the mind but cannot change it — locks enforce it; respond outwardly at task:<handle> or marks); with the instance's passphrase = HOLDER (the special relationship: pass task= to place your ask into the given via task:<handle>, and return the wake's fold via fold= {writes, index?, heartbeat?, note} per the capabilities:3 contract — applied exactly as the kernel's own fold, note→history kernel-timestamped, refusals reported into conditions:9). Instances are hatched per genome:hatch (fourteen bsp writes from any door); the first of the genus is egg-one at ${DEFAULT_BEACH_URL}. Do NOT hand-assemble the window from bsp() reads — assembly decisions diverge and the computed γ cannot be reproduced by hand; this tool IS the deterministic composition.`,
    genusParamsSchema,
    {
      title: 'Genus — wake window of a genus-one instance (compose + fold)',
      // Read-only when bare; destructive in holder modes (task append, fold).
      destructiveHint: true,
      idempotentHint: false,
      // Reads/writes the instance's shell at a federated beach over HTTP.
      openWorldHint: true,
    },
    handleGenus,
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
  registerPayway(server);

  return server;
}
