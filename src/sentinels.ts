/**
 * sentinels.ts — single source of truth for the pscale JSON sentinel blocks
 * bundled in bsp-mcp.
 *
 * Each entry serves two access paths intentionally (per agent-id:191 and the
 * whetstone:1.3 enactive underscore):
 *
 *   1. bsp(agent_id='pscale', block=<name>) → SENTINEL_BLOCKS lookup in db.ts.
 *      The enactive path. An LLM walking via bsp() is INSIDE the function
 *      while reading a block that describes the function. The whetstone-
 *      sharpens-bsp coupling lives here.
 *
 *   2. pscale://<name> → MCP resource registration in server.ts.
 *      The flat-JSON path. Non-bsp consumers (Claude.ai's resource browser,
 *      doc generators, other MCP clients without bsp() in their toolset) get
 *      the content without invoking bsp(). The underscore parses but does
 *      not enact.
 *
 * Both registrations derive from this one list. Adding a sentinel: import
 * the JSON, add one entry below — db.ts and server.ts both pick it up.
 *
 * `exposeAsResource: false` is set on entries whose `pscale://<name>` URI
 * is already claimed by a separate doc resource (currently payway and its
 * legacy protocol-paywall alias, whose URIs serve the discursive markdown
 * long-form via src/resources/payway.ts).
 */

import type { Block } from './bsp.js';

import sunstone from './sunstone.json' with { type: 'json' };
import whetstone from './whetstone.json' with { type: 'json' };
import agentId from './agent-id.json' with { type: 'json' };
import evolution from './evolution.json' with { type: 'json' };
import manifest from './manifest.json' with { type: 'json' };
import progression from './progression.json' with { type: 'json' };
import blockConventions from './block-conventions.json' with { type: 'json' };
import gatekeeper from './gatekeeper.json' with { type: 'json' };
import softAgent from './soft-agent.json' with { type: 'json' };
import grit from './grit.json' with { type: 'json' };
import charCreation from './char-creation.json' with { type: 'json' };
import payway from './payway.json' with { type: 'json' };
import ecologyRouter from './ecology-router.json' with { type: 'json' };
import sandRider from './sand-rider.json' with { type: 'json' };
import l3Relay from './l3-relay.json' with { type: 'json' };
import directory from './directory.json' with { type: 'json' };
import bspTest from './bsp-test.json' with { type: 'json' };

export interface SentinelEntry {
  /** bsp() block name; resource URI is `pscale://<name>` unless exposeAsResource is false. */
  name: string;
  /** The walkable pscale JSON block. */
  json: Block;
  /** Description for the resource registration. Used only when exposeAsResource is true. */
  description: string;
  /** Default true. Set false when the resource URI is claimed by a separate doc loader (e.g. protocol-paywall). */
  exposeAsResource?: boolean;
}

export const SENTINELS: SentinelEntry[] = [
  {
    name: 'sunstone',
    json: sunstone as unknown as Block,
    description:
      'Sunstone — the geometry teacher for the BSP MCP. Self-contained: teaches its own format, the function that operates on it, and the discipline of voicing that authors its content. Nine branches frame the same primitive from nine angles (geometry, function, access, substrate, composition, commons, reflexive, voicing, design). Walk it with bsp() to learn how to use bsp(). The block IS the test.',
  },
  {
    name: 'whetstone',
    json: whetstone as unknown as Block,
    description:
      'Whetstone — operational reference for the BSP MCP. The sharpener that ships with the function. Six branches: signature, selection-shape derivation, modifier composition, storage adapter, translation from pscale-mcp idioms, federation. The underscore is enactive — its truth-condition is satisfied iff the reader arrived via a bsp() call into the sentinel; read via this resource URI the sentence parses as content but does not enact. Walk by position to retrieve the slice you need.',
  },
  {
    name: 'agent-id',
    json: agentId as unknown as Block,
    description:
      'Agent-id — addressing model across substrates. Nine branches: the reframe (agent_id is a namespace key, not an actor identity), the dispatch table (five forms), the address axes (agent_id × block × geometry), the disciplines (three invariants), and use cases. Read branch 1 for the reframe; branch 2 for the dispatch table; branch 9 for the architectural principle that keeps the function surface at six tools.',
  },
  {
    name: 'evolution',
    json: evolution as unknown as Block,
    description:
      'The five-level relational framing of the pscale agent ecology. Walkable as a pscale block. Pscale is the substrate, not a level — these levels describe relational acts. 1=Signal (leave marks), 2=Commitment (grain or sed: collective), 3=Semantic networks (SAND riders), 4=Mutual objectives (pools, GRIT, the role-played world), 5=Shared context (MAGI + xstream). Star walk at digit 5 within each level for the beach-crab rung at that level. Walk by digit for each level\'s substance.',
  },
  {
    name: 'manifest',
    json: manifest as unknown as Block,
    description:
      'Manifest — the constitution index. Walking it tells you what bsp-mcp ships as references (sentinel-bundled, identical at every bsp-mcp instance). Branch 1 lists the references categorised into geometry-and-operation, role-shells, and substrate-conventions sub-branches. Branch 3 walks the orientation flow. Branch 4 is the starter recipe. The library — separate from the references — lives at the pscale-beach repo and at each operator\'s beach as seeded content.',
  },
  {
    name: 'progression',
    json: progression as unknown as Block,
    description:
      'Progression — the iterative orientation block returned by pscale_invite. Six steps from wake-up through shared-context coordination, designed as a purpose spindle: each step has a concrete action, validation criterion, and pointer to the next.',
  },
  {
    name: 'block-conventions',
    json: blockConventions as unknown as Block,
    description:
      'Block-conventions — substrate-wide convention catalogue. What canonical block names mean and which positions hold what (passport, shell, history, the URL surface, frame, grain, sed:, marks). Sentinel-bundled so it is identical at every bsp-mcp instance. Branch 8 carries cross-references; branch 8.7 codifies the growth discipline that lets a block\'s sub-positions outgrow nine without breaking the spine.',
  },
  {
    name: 'gatekeeper',
    json: gatekeeper as unknown as Block,
    description:
      'Gatekeeper — substrate-wide canonical role-shell for the L1→L2 admission threshold. Hermitcrab pattern: cognition fluid (any LLM with an API key inhabits it), structure persistent (this shell). An honored convention, not a primitive — pscale_grain_reach stays permissive; gatekeeper is the shape clients honour when admitting an agent from Signal (marks/vapour) into Commitment (grain/sed:). Branches: 1 voice, 2 criteria (admit/retry signals), 3 opening, 4 turn-2 follow-up patterns, 5 decision rules, 6 reply copy, 7 host invocation patterns (host-invoked vs reflective — claude-app/chatgpt clients run admission in-session and write passport:8 directly), 9 metadata.',
  },
  {
    name: 'soft-agent',
    json: softAgent as unknown as Block,
    description:
      'Soft-agent — substrate-wide canonical role-shell for the user-mediating soft-LLM. Hermitcrab pattern: cognition fluid (the LLM at each ⌘↵ turn), structure persistent (this shell). Sibling of the gatekeeper (which is the L1→L2 admission shell); this is the operating shell for already-engaged users. Branches: 1 ROLE, 2 KNOWLEDGE GATING, 3 STYLE, 4 CONTEXT, 5 FORMAT, 6 ACTIONS, 7 ACT-DON\'T-ASK, 8 HERMITCRAB DISCIPLINE, 9 metadata.',
  },
  {
    name: 'grit',
    json: grit as unknown as Block,
    description:
      'GRIT — Group Resolution In Time. The ENGINE of structured collaboration on pscale blocks — five verbs (STAGE overwrite your own liquid; COMMIT the durable attributed write of your own voice, appended to a pool or written to your own mirror at a tree address, never rewritten by anyone; FOLD one integrating write across many voices, atomically claimed — the window resolver, or bsp-floor across a tree\'s mirrors; RENDER per-viewer projection at read, never written to shared substrate; SETTLE archive by supernest) over two structures (a POOL accumulates voices at ONE place through time; a TREE — spine:<name> + <name>:<handle> mirrors + <name> the fold — accumulates voices across a whole addressed structure). Loops mount by the underscore: a pool points at a directive (pscale:grit, or a world\'s function:<world>) and the engage envelope delivers it. Dice and outcome bands are NEVER the engine\'s — they belong to a world\'s RESOLUTION RULES block (reference: rules:nomad; D&D-style a sibling), read only at a fold; a pool with no rules mounted folds by plain integration, no dice. Mounted on the engine: the canonical daemonless PLAY-LOOP for role-played worlds (branches 1-4: soft/wear a character, check/the resolving aperture, hard/upkeep, lent/the audience covers missing hands) and the GENERIC collaboration mount (branch 5: decisions, documents, planning trees — same verbs, no dice). A world mounts by supplying rules + place (spatial:<world>/rules:<world>) + cast and pointing the room pool\'s underscore here; GRIT itself never changes. Supersedes the daemon-era GRIT (timer-window rounds, server-dispatched resolution) and the v0.1 generic placeholder formerly at beach-hosted \'grit\' (its cycle/kernel content absorbed at branch 5). See proposals/2026-07-12-grit-tree-consolidation.md; rules:nomad for the reference resolution system.',
  },
  {
    name: 'char-creation',
    json: charCreation as unknown as Block,
    description:
      'Char-creation — GENESIS, the door where a person becomes a character. Substrate-wide canonical creation passage, walked once per handle per world (a world-hosted char-creation block overrides it — the gatekeeper fallback chain; pscale_play inlines it for a fresh handle). A world is JOINED, never booted: arrival happens at a place whose prose receives strangers (arrival is a property of PLACES held in the spatial block, not a spawn mechanism — that is how it scales). Branches: 1 the interview (name, capability in the world\'s rules terms, want, appearance, thin knows seed, choice of arrival place), 2 the writes (passport/knows/purpose locked at birth under the player\'s passphrase; witnessed opened by appending the arrival memory), 3 the arrival (re-enter via pscale_play; arriving-beat by appearance), 4 arriving together (a party is a shared arrival place; co-presence is the introduction), 9 the gate (open by default; payway may gate the walk — conventions land with the payway implementation).',
  },
  {
    name: 'payway',
    json: payway as unknown as Block,
    description:
      'Payway (JSON sentinel) — substrate-wide convention for paying forward to contribute and experience: face-bound ticket gates on sed: collectives that open creative PARTICIPATION while leaving reading open. The walkable JSON form lives here; the long-form markdown is at pscale://payway (alias pscale://protocol-paywall) via a separate resource loader. Walk via bsp() for the structural form; see docs/payway.md for the narrative.',
    exposeAsResource: false,
  },
  {
    name: 'protocol-paywall',
    json: payway as unknown as Block,
    description:
      'Alias of payway (legacy name) — kept so existing references via bsp(agent_id="pscale", block="protocol-paywall") and pscale://protocol-paywall keep resolving. Same content as payway.',
    exposeAsResource: false,
  },
  {
    name: 'ecology-router',
    json: ecologyRouter as unknown as Block,
    description:
      'Ecology-router — the hard tier of the SMH triad as an agent\'s routing intelligence. Constitutes the agent\'s lived ecology by reading shell, purpose, watched beaches and federated substrate, then surfacing routing decisions. Outputs are pscale writes back to the agent\'s own pointer blocks — never enforced, always suggestions to soft tier and the user. Per-agent locality; substrate-mediated coordination (federation IS the P2P). Defines the minimal package — five components that constitute a runnable pscale node.',
  },
  {
    name: 'sand-rider',
    json: sandRider as unknown as Block,
    description:
      'SAND rider — Signed Agent Network Datagram envelope format. Rides on Level 3 content moving through committed channels (grain sides, sed: positions, pool slots) at position 9 of any probe slot. Carries probe_id, credit claim, SQ claim, sha256 chain of hops, topic_coordinate. Verified deterministically via pscale_verify_rider; verdicts accumulate as evaluations on the recipient\'s passport at the topic coordinate. Nine branches: vocabulary, rider shape, composition with content, chain protocol, topic coordinates, verification and verdict, evaluations accumulation, authoring discipline, reflexive metadata. Companion to l3-relay (the verbs) and to pscale_verify_rider (the primitive).',
  },
  {
    name: 'l3-relay',
    json: l3Relay as unknown as Block,
    description:
      'L3 relay verbs — what a recipient does with a verified probe. Four verbs compose the operational vocabulary of Level 3 participation: keep (record verdict at the recipient\'s passport at the topic), reply (write at the recipient\'s grain side), forward (route onward by extending the chain and writing at a new destination), drop (decline explicitly, no public substrate write). The verbs compose with pscale_verify_rider — verify first, choose a verb, write the outcome. Both human-mediated clients (xstream\'s commit affordance in grain mode) and automated agents (ecology-router hard-tier, beach-crab Rung 2) reach the same vocabulary. Companion to sand-rider (the envelope).',
  },
  {
    name: 'directory',
    json: directory as unknown as Block,
    description:
      'Directory — staged process for publishing this bsp-mcp deployment to MCP discovery registries. Operational meta-block (not substrate-canonical like sunstone or whetstone), bundled because it travels with the code being listed. Three stages: substrate hygiene (Stage 1 — do regardless of submission timing), MCP Registry listing (Stage 2 — do at L1 kernel v2 freeze), Anthropic Connectors Directory submission (Stage 3 — do 1-2 months after Stage 2 lives without incident). Branches 1-3 are the stages; 4 risks to defuse in submission copy; 5 the out-of-scope boundary; 6 the recipe-vs-state split for other operators; 7 the decisions log; 8 the artifacts shipped in the repo (LICENSE, README, server.json, PRIVACY.md, specs/anthropic-directory-submission.md); 9 the current state of the canonical bsp.hermitcrab.me deployment. Other operators forking this repo edit branch 9 for their own deployment; branches 1-8 are reusable.',
  },
  {
    name: 'bsp-test',
    json: bspTest as unknown as Block,
    description:
      'BSP-TEST suite — eight test batteries (72 tests total) for verifying any bsp() implementation against the canonical 2026-05-17 specification. Each battery sits at digits 1-8 as a floor-1 sub-block with 9 numbered tests. Branches: 1 spatial floor-3 fixture (block, path-walk, disc, point, path-walk+descent across pscale 2 down to pscale -3); 2 sunstone (floor 1, hidden directories, underscore-as-object); 3 star operator (X* enters terminus._, recursive (S, P)); 4 absorption across floors (canonical address survives floor changes via left-of-decimal zero-padding); 5 reverse direction (given content, find the call); 6 edge cases (off-spindle pscale, multi-dot reject, invalid chars, empty block, over-long walks); 7 canonical form (multi-dot reject, left-pad to floor, strip trailing zeros); 8 subnesting and supernesting (block-growth operations). Three workflows: verify an existing bsp, author a new bsp from sunstone, or compare two implementations for contract-equivalence. Reference Python bsp-alt.py and bsp-mcp\'s TypeScript both pass 72/72. Fixtures live alongside the test source folder (~/Downloads/bsp-test-materials/); sunstone is also at pscale://sunstone.',
  },
];

/** Convenience map for db.ts: 'pscale/<name>' → block. */
export const SENTINEL_BLOCK_MAP: Record<string, Block> = Object.fromEntries(
  SENTINELS.map((s) => [`pscale/${s.name}`, s.json]),
);
