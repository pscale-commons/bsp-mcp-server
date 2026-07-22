/**
 * tools/play.ts — pscale_play, the entry meta-tool.
 *
 * Sibling of pscale_invite. invite is the WELCOME PASSAGE for a newcomer
 * (orientation). play is INHABITING a persistent handle on a world: one call
 * resolves the world to its beach, engages the room pool (the operating
 * directive and the live scene arrive INLINED via the envelope), bundles the
 * handle's own context, and PINS the world's origin — so a bare connector
 * (claude.ai) self-bootstraps into play with no pasted prompt and cannot drift
 * to the apex.
 *
 * Authorized addition (2026-06-17, David). NOT a sixth state-machine primitive —
 * an entry envelope, the way pscale_pool_engage is a synthesis envelope. The bar
 * is met: the convention (the INHABITING A ROLE instruction clause + the worlds
 * registry) demonstrably failed to carry the entry — a bare connector asked to
 * "play X on Y" browsed the apex and confabulated a different game. This bundles
 * the entry deterministically; nothing here is geometry bsp() lacks.
 *
 * Ontology-agnostic by design: a `handle` inhabits a `world`. The substrate makes
 * no distinction between a character, a user, and an agent — all are handles with
 * blocks. The RPG character is the driving case (the world's directive is
 * function:<world>); a user entering the commons (directive soft-agent) is the
 * same act with a different directive, and the directive lives in the substrate,
 * not here. A world's real/fantasy/virtual nature (the spatial pscale sign) is
 * perception, not entry — untouched by this tool.
 *
 *   pscale_play(world, handle, secret?, room?)
 */
import { z } from 'zod';
import { loadBlock, saveBlock, resolveFederationOrigin, DEFAULT_BEACH } from '../db.js';
import { handlePoolEngage, resolveDirective, collectContributions, floorUnderscore, renderPosition, beachIndex, passportLocation, castAtWorld, livenessSignals, splitCast, LIVE_WINDOW_MS, type CastEntry } from './pool.js';
// Re-exported so existing importers (smoke-play-split) keep one source of truth.
export { splitCast, LIVE_WINDOW_MS } from './pool.js';
export type { CastEntry } from './pool.js';
import { Block, readAt, floorDepth } from '../bsp.js';
import { isLocationAddress, contains, pscaleOf, walkedOf, STANDARD_SPINE } from '../grain-address.js';
import { compile, renderCompletions, type Completion } from '../compile.js';
import { toPNode, pyDumps, type Loader, type PNode, type PMap } from '../genus.js';
import { SENTINELS } from '../sentinels.js';

/** A beach-scoped Loader for compile(): sentinels first (the completion's
 *  shallow points live there), then named blocks at the world's beach,
 *  cached per call. Names are FULLY QUALIFIED ('purpose:anya', 'rules:nomad')
 *  — no handle suffixing; a world's blocks and a handle's blocks read alike. */
function beachLoader(origin: string): Loader {
  const teaching = new Map<string, PNode>();
  for (const s of SENTINELS) teaching.set(s.name, toPNode(s.json));
  const cache = new Map<string, PNode | null>();
  return async (name: string) => {
    if (teaching.has(name)) return teaching.get(name)!;
    if (cache.has(name)) return cache.get(name)!;
    const row = await loadBlock(origin, name).catch(() => null);
    const node = row && row.block && typeof row.block === 'object' ? toPNode(row.block) : null;
    cache.set(name, node);
    return node;
  };
}

/**
 * Resolve a world to its beach origin. A full URL is used as-is. A BARE world
 * name resolves as DATA, not code (Fable, 2026-07-18): consult the `worlds`
 * directory block at the default beach (name → route) — a new named world is one
 * authored line, never a deploy. Falls back to the sub-domain convention
 * <world>.beach.<host> (block-conventions:4.8) for legacy worlds not in the
 * directory, so "thornwood" still resolves whether or not it has a directory row.
 */
function subdomainOrigin(world: string): string {
  const w = world.trim().replace(/\/+$/, '');
  let host = 'beach.happyseaurchin.com';
  try { host = new URL(DEFAULT_BEACH).host; } catch { /* keep fallback */ }
  const base = host.startsWith('beach.') ? host.slice('beach.'.length) : host;
  return `https://${w}.beach.${base}`;
}

/** Look a bare world-name up in the `worlds` directory at the default beach. Each
 *  entry is a string '<name> → <route>'; a route beginning '/' is a path on the
 *  default beach ('/w/brackenfoot'), anything else is a host or full URL. Read
 *  fresh, operator-curated (named canonical worlds only — ephemeral tables are not
 *  listed). No worlds block, no matching row → null, and the caller falls back. */
async function lookupWorldRoute(name: string): Promise<string | null> {
  const base = DEFAULT_BEACH.replace(/\/+$/, '');
  const row = await loadBlock(base, 'worlds').catch(() => null);
  const w: any = row?.block;
  if (!w || typeof w !== 'object') return null;
  const want = name.trim().toLowerCase();
  for (const k of Object.keys(w)) {
    if (k === '_') continue;
    const entry = w[k];
    if (typeof entry !== 'string' || !entry.includes('→')) continue;
    const [n, ...rest] = entry.split('→');
    const route = rest.join('→').trim();
    if (n.trim().toLowerCase() !== want || !route) continue;
    if (/^https?:\/\//i.test(route)) return route.replace(/\/+$/, '');
    if (route.startsWith('/')) return base + route.replace(/\/+$/, '');
    return `https://${route.replace(/\/+$/, '')}`;
  }
  return null;
}

/** A path-world at the default beach: /w/<name> is real iff its surface lists
 *  blocks. Bubbles and forked tables live here (mint:gal, brackenfoot forks) and
 *  are deliberately NOT in the operator-curated worlds directory — yet "play
 *  gal-alder" is the sentence a player actually says (all three blind seats hit
 *  exactly this, NHITL 2026-07-22). One index GET decides; an empty or absent
 *  surface falls through to the sub-domain convention unchanged. */
async function pathWorldOrigin(world: string): Promise<string | null> {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(world)) return null;
  const candidate = `${DEFAULT_BEACH.replace(/\/+$/, '')}/w/${world}`;
  const blocks = await beachIndex(candidate);
  return blocks.length > 0 ? candidate : null;
}

/** World → beach origin. Full URL as-is; bare name via the worlds directory, then
 *  the path-world probe at the default beach, then the sub-domain fallback. */
async function resolveWorld(world: string): Promise<string> {
  const w = world.trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(w)) return w;
  return (await lookupWorldRoute(w)) ?? (await pathWorldOrigin(w.toLowerCase())) ?? subdomainOrigin(w);
}

/** One lighthouse branch, rendered WHOLE and addressed — the same walk the room's
 *  directive uses (renderPosition). The doorway is a one-shot orientation: an
 *  Author who has to make a second call for the copy discipline at 2.1 is being
 *  charged for the render's shape, not the block's depth. */
function branchText(node: any, digit: string, floor: number): string {
  const out: string[] = [];
  renderPosition(node, [digit], floor, out);
  return out.join('\n');
}

/** The world's front sign speaks before the door opens (Fable, 2026-07-18): if the
 *  target hosts a `lighthouse` whose play-disposition (9.3) begins 'canon', play
 *  LEADS with its fork recipe and hands NO gate+genesis — canon is a read-only
 *  scenario, and play happens in a forked table. The semantic is AUTHORED in the
 *  block; a beach with no such signage returns null and behaves exactly as before.
 *  Never an auto-fork — the copy stays the player's conventional act (lighthouse:1). */
async function canonSignage(origin: string, world: string, handle: string): Promise<string | null> {
  const row = await loadBlock(origin, 'lighthouse').catch(() => null);
  const lh: any = row?.block;
  if (!lh || typeof lh !== 'object') return null;
  const disposition = lh['9'] && typeof lh['9'] === 'object' ? lh['9']['3'] : undefined;
  if (typeof disposition !== 'string' || !/^\s*canon\b/i.test(disposition)) return null;
  const out: string[] = [];
  out.push(`# ${world} is a SCENARIO (canon) — no one plays here, ${handle} included`);
  if (typeof lh._ === 'string') { out.push(''); out.push(lh._); }
  // The sign's own branches, in order, as the author wrote them — NO headings
  // invented here. The old lead hardcoded "OPEN A TABLE" over branch 1, which
  // put an AUTHOR's recipe in front of every arriving CHARACTER and is exactly
  // the role-fusion 1.34 diagnosed (a Character forked, hand-copied nine blocks
  // mid-boot, dropped one, and wrote its character onto canon). Which branch is
  // whose is now AUTHORED in the block, so the doorway stays thin and a
  // scenario can re-cut its own paths without a deploy.
  // Digits 1-8 only: 9 is block metadata by convention (the play-disposition
  // read above lives there) and is not doorway material.
  const floor = floorDepth(lh as Block);
  for (let d = 1; d <= 8; d++) {
    const node = lh[String(d)];
    if (node === undefined || node === null) continue;
    const text = branchText(node, String(d), floor);
    if (text) { out.push(''); out.push(text); }
  }
  out.push('');
  out.push(`Play happens at a TABLE, never here. Whichever path above is yours, it ends the same way: call pscale_play again with world set to that table's FULL URL (this beach's origin with /w/<table name> in place of this scenario's). This canon surface stays untouched.`);
  return out.join('\n');
}

export const playParamsSchema = {
  world: z
    .string()
    .describe("The world to inhabit — a bare world-name (resolved via the `worlds` directory block at the default beach: name → route, e.g. 'brackenfoot' → /w/brackenfoot; falling back to the sub-beach convention <world>.beach.<host> for legacy worlds), or a full beach URL. A scenario surface that declares itself canon (lighthouse:9.3) routes you to fork a private table rather than playing in place. The apex commons is itself a world for users/agents."),
  handle: z
    .string()
    .describe("The handle you inhabit — a character ('anya'), a user ('happyseaurchin'), or an agent ('weft'). The substrate makes no distinction: a handle with its blocks. Used as your contribution attribution and as the suffix of your own blocks (witnessed:<handle>, passport:<handle>, shell:<handle>)."),
  secret: z
    .string()
    .optional()
    .describe("Your passphrase for the handle, when its blocks are locked — it authorises your acts (submits, journal writes) once you are in. Omit to perceive only. Sensitive; never repeat it in conversation."),
  room: z
    .string()
    .optional()
    .describe("Optional gathering-point (a pool name, without the 'pool:' prefix). Omit and play resolves the world's room automatically — the single room pool. A 'room' is the pscale-0 case (a handful of co-present agencies); the general thing is a focal pool at a spatial target. Pass this only when a world has several rooms."),
};

export type PlayParams = { world: string; handle: string; secret?: string; room?: string };

export async function handlePlay(
  params: PlayParams,
): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { world, handle, room } = params;
  const origin = await resolveWorld(world);

  // 1. The world must be a live beach.
  const resolved = await resolveFederationOrigin(origin);
  if (!resolved) {
    return { content: [{ type: 'text', text: `No world at "${world}" (resolved to ${origin}) — it is not a federated beach. Check the world name, or pass a full beach URL.` }] };
  }

  // 1a. The world's front sign speaks before the door opens (Fable, 2026-07-18):
  //     a canon SCENARIO surface routes the player to fork a private table and
  //     hands NO gate/genesis here. Authored in the lighthouse (9.3), never
  //     hardcoded — a beach with no such signage falls straight through to normal
  //     entry below. This is the machinery 1.3 reserved for exactly the signal the
  //     blind NHITL fired: the convention carried fork+copy+genesis, but the
  //     DOORWAY did not point at it. One envelope read of a block the author owns.
  const canon = await canonSignage(resolved, world, handle);
  if (canon) return { content: [{ type: 'text', text: canon }] };

  // 1b. GENESIS-FIRST: a handle with no blocks cannot be handed a room it is
  //     not in. Detect fresh BEFORE room resolution — a multi-room world's
  //     room-list early-return used to swallow the passage, and a full room
  //     envelope buried it below "take a turn" material (P3 forensic,
  //     2026-07-03: a newborn played a scene with no passport, no locks, no
  //     position). The door comes before the room: return the passage alone;
  //     it ends by re-entering, which lands the character properly born.
  const freshProbe = await Promise.all(
    ['passport', 'witnessed', 'shell'].map((b) => loadBlock(resolved, `${b}:${handle}`)),
  );
  const isFresh = freshProbe.every((r) => !r || !r.block || typeof r.block !== 'object');
  if (isFresh) {
    const genesis = (await resolveDirective(resolved, 'char-creation'))
      ?? (await resolveDirective(resolved, 'pscale:char-creation'));
    if (genesis) {
      // GATE-FIRST (proposal 2026-07-15 §4): a new arrival is a USER before they are
      // a character. Hand them the lobby — the gate pool, keyless, where the liquid
      // concatenation answers "who is here right now" — then the creation passage as
      // the activation step, then the named re-entry. The probe finding this closes:
      // a fresh handle was handed no pool name at all while being forbidden to invent
      // one; the gate is the world's own named out-of-fiction surface.
      const gatePurpose = `The gate at ${world} — the out-of-fiction lobby. Users gather here AS THEMSELVES before characters exist. NOTHING COMMITS HERE: stage one line — who you are, what you are looking for — and the liquid mirror shows everyone else standing at the gate right now, each with the moment they FIRST staged (the arrival stamp — revising a line never moves it). A staged line is revisable, and clearing it leaves no trace; the gate keeps no record, because a lobby that remembers its own small talk becomes the first thing every later arrival must read. A party forms by agreeing here who plays what, then each walking genesis; the world gives each character its arrival place, and the party lands together — a COLD OPEN folds everyone who has arrived into one first scene, so no one appears by magic. Once your character exists, CLEAR your gate line (submit="") — you are in the world now. (Only a world that leaves the STARTING PLACE to the party needs a chooser: then the earliest here picks it and the others give that walker's handle at their interview to land beside them; a scenario with a fixed door needs none of this.) In-fiction beats never land here; your first committed beat is in the room, once your character exists.`;
      const g: string[] = [];
      g.push(`# ${handle} is NEW at ${world} — you stand at the GATE`);
      g.push(`World beach: ${resolved}  ·  no blocks exist for ${handle} here yet.`);
      g.push(`PIN THIS BEACH. Every call below targets ${resolved}.`);
      g.push('');
      g.push(`THE GATE — the lobby, before any character. Engage it keyless as yourself, staging one line about who you are and what you are looking for: pscale_pool_engage(pool_url="${resolved}", pool_name="gate", agent_id="${handle}", submit="<your line>") — the envelope returns the liquid mirror: everyone standing at the gate right now, each with their arrival stamp (first-staged; revising never moves it). STAGE, NEVER COMMIT: submit= is revisable, clears without trace, and IS the lobby; contribution= would nail a permanent line to the world's front door, where every later arrival reads it forever — that is not what a gate is for. Re-engage to see who has answered; a companion who arrives while you are away is waiting in the mirror when you look. Agree here who plays what, then walk genesis when ready — you need not wait for the others to finish; each of you creates a character and gathers at the arrival place, and the party lands when one of you commits the opening. Clear your gate line (submit="") once your character exists. If the gate does not exist yet, pass purpose= with exactly this text to found it: ${JSON.stringify(gatePurpose)}`);
      g.push('');
      g.push(`GENESIS — the activation, once per handle, when ready. Walk the creation passage below WITH YOUR PLAYER — the interview is theirs to answer, the passphrase theirs to choose (never echo it back once set). Complete the writes, then RE-ENTER with pscale_play(world="${resolved}", handle="${handle}") — THE ROOM FOLLOWS YOUR POSITION: re-entry hands you the room at your start place, its directive and live scene inlined. Never guess or invent a room name; the world provides the room at your address. THE ADDRESS CARRIES ITS GRAIN — where the road drops you is also how fast you live: ${STANDARD_SPINE}; a room-level address is the ordinary choice, and a world re-declares the ladder in its rules block only when it differs.`);
      g.push('');
      g.push(genesis);
      return { content: [{ type: 'text', text: g.join('\n') }] };
    }
  }

  // 2. Resolve the room pool — DERIVED FROM LOCATION. A room IS a focal pool at a
  //    spatial target (block-conventions:4.8); so the room a handle meets in is
  //    pool:<addr>, where <addr> is its own position (passport:3 → spatial:<world>:<addr>).
  //    Co-located handles share a pool automatically; MOVING (a write to passport:3)
  //    moves you between pools; a party that splits ends up in separate pools. This is
  //    how pools stay small (a handful at one spot) while a world holds millions — scale
  //    is spatial breadth, not pool size, and a crowded cell subdivides at a higher
  //    pscale (a deeper addr → a deeper pool). An explicit `room` overrides. Falls back
  //    to the single-pool / ask behaviour for worlds not yet on location-keyed pools.
  let roomName = room?.trim();
  if (!roomName) {
    const index = await beachIndex(resolved);
    const myPassport = await loadBlock(resolved, `passport:${handle}`);
    const locAddr = myPassport?.block ? passportLocation(myPassport.block) : null;
    if (locAddr && index.includes(`pool:${locAddr}`)) {
      roomName = locAddr;                              // location-derived room
    } else {
      const rooms = index
        .filter((b) => b.startsWith('pool:') && !b.startsWith('liquid:') && b !== 'pool:gate')
        .map((b) => b.slice('pool:'.length));
      const digitRooms = rooms.filter((r) => isLocationAddress(r));
      const namedRooms = rooms.filter((r) => !isLocationAddress(r));
      if (locAddr) {
        // THE ROOM IS DERIVED FROM POSITION (the play-mount law: the room at a
        // place is pool:<addr> and the WORLD provides it) — never from enumerating
        // pool names. Twice a stray harness pool broke world entry by inflating
        // the room list (pool:parity-run2, 2026-07-07 and -08); the standing rule
        // said third time it becomes code (proposal 2026-07-15 §6). Guard first:
        // the spatial tree must name the place — moving to nowhere stays an
        // error, never a room. The walk is the canonical floor-aware reader, so a
        // full pscale address ("3200" the town, "111.1" the hearth) reaches its
        // place exactly as the parser defines it — dots, padding and all
        // (proposal 2026-07-15-pscale-of-agency G1).
        const spatialName = index.find((b) => b.startsWith('spatial:'));
        const srow = spatialName ? await loadBlock(resolved, spatialName) : null;
        let place: any = null;
        try {
          place = srow?.block ? readAt(srow.block as any, locAddr) : null;
        } catch { place = null; /* parser-rejected address reads as no-place */ }
        if (place == null) {
          return { content: [{ type: 'text', text: `Your position ${locAddr} names no place in ${spatialName ?? 'the world'} — there is no there there. Rewrite passport:3 with an address COPIED from the spatial block, then re-enter.` }] };
        }
        if (digitRooms.length === 0 && namedRooms.length === 1 && isLocationAddress(locAddr) && pscaleOf(locAddr) === 0) {
          // Single-named-room world (thornwood-style): that room IS the place's —
          // but only at BEAT GRAIN. A coarser stance (the town, '100') or a finer
          // one (the hearth, '111.1') gets the room AT ITS ADDRESS below; the
          // named room stands for the world's one pscale-0 gathering place, not
          // for every grain of the world.
          roomName = namedRooms[0];
        } else {
          // Location-keyed world (or ambiguity/debris): open the room at the
          // place. The mount is copied from an existing room whose underscore
          // speaks (floor-aware — a supernested pool still yields its directive),
          // else the canonical engine. Ambiguity DERIVES; it never errors.
          let purpose = 'pscale:grit';
          for (const r of [...digitRooms, ...namedRooms]) {
            const sample = await loadBlock(resolved, `pool:${r}`);
            const u = sample?.block && typeof sample.block === 'object' ? floorUnderscore(sample.block as any) : '';
            if (u.trim()) { purpose = u; break; }
          }
          try { await saveBlock(resolved, `pool:${locAddr}`, { _: purpose } as any, { spindle: '' }); } catch { /* first writer wins — a race is fine */ }
          roomName = locAddr;
        }
      } else if (rooms.length === 1) {
        roomName = rooms[0];                           // fallback: the world's single room
      } else if (rooms.length === 0) {
        return { content: [{ type: 'text', text: `World ${resolved} has no room yet — an author must open one (pscale_pool_engage with purpose=...).` }] };
      } else {
        // No position to derive from (a user at the world's surface): the choice
        // survives only here.
        return { content: [{ type: 'text', text: `World ${resolved} has several rooms: ${rooms.join(', ')}. Pass room=<name> to choose.` }] };
      }
    }
  }

  // 3. Engage the room — the operating directive and the live scene arrive inlined.
  let env: string;
  try {
    env = (await handlePoolEngage({ pool_url: resolved, pool_name: roomName, agent_id: handle, since_position: 0, with_liquid: true } as any)).content[0].text;
  } catch (e: any) {
    return { content: [{ type: 'text', text: `Could not engage room "${roomName}" at ${resolved}: ${e?.message ?? String(e)}` }] };
  }

  // 3b. THE FRAME — a world-authored scene bundle, compiled (proposal
  //     2026-07-22-well-formed-reading, door 1). If the world hosts
  //     frame:<room> (block-conventions frame:<scene>), its digit positions are
  //     bsp addresses — place, rules dilations, canon points — and they unfold
  //     here in ONE call, semantics delivered in one go instead of a chain of
  //     mid-turn reads. Pure data: a world grows a frame by authoring one
  //     block, never by a deploy; a world without one sees no change. The room
  //     pool rides `carried` — this envelope holds the live scene and cast, so
  //     RELATION is carried by construction and the completion stays quiet.
  const load = beachLoader(resolved);
  const completions: Completion[] = [];
  let frameSection: string[] = [];
  try {
    const frameRow = await loadBlock(resolved, `frame:${roomName}`).catch(() => null);
    if (frameRow && frameRow.block && typeof frameRow.block === 'object') {
      const r = await compile(toPNode(frameRow.block), load, { carried: [`pool:${roomName}`] });
      completions.push(...r.completions);
      const w = r.window;
      if (w instanceof Map && w.size > 0) {
        frameSection = [``, `═══════════ THE FRAME — frame:${roomName}, compiled (${r.dialed.length} address${r.dialed.length === 1 ? '' : 'es'} unfolded; dial any deeper via bsp) ═══════════`];
        for (const [k, v] of w as PMap) frameSection.push(`── ${k} ──\n${pyDumps(v)}`);
      }
    }
  } catch (e: any) {
    frameSection = [``, `(frame:${roomName} exists but did not compile: ${String(e?.message ?? e).slice(0, 120)} — read it directly via bsp)`];
  }

  // 4. Bundle the handle's own context — whichever standard blocks exist. This
  //    is "the content relevant to them" in one call; the kind is inferred, not
  //    declared (character if it has witnessed/passport; user/agent if a shell).
  const own: { name: string; json: string }[] = [];
  const seen = new Set<string>();
  let shellBlock: any = null;
  for (const b of ['passport', 'witnessed', 'knows', 'shell', 'history']) {
    const name = `${b}:${handle}`;
    const row = await loadBlock(resolved, name);
    if (row && row.block && typeof row.block === 'object') {
      own.push({ name, json: JSON.stringify(row.block, null, 1) });
      seen.add(name);
      if (b === 'shell') shellBlock = row.block;
    }
  }
  // Shell-as-context-compiler: the shell's manifest (position 3) is a bundle of
  // bsp-addresses that scoop the handle's full context — now compiled for real
  // (proposal 2026-07-22-well-formed-reading, door 1). Beyond the default set
  // above, each manifest entry is a full (spindle, aperture) reference —
  // 'purpose:anya' a whole block, 'history:anya:1:-1' a dilation, 'vision:9:-5'
  // a settled backdrop — unfolded in one pass, so a character inhabits the way
  // a hermitcrab does: the authored bundle IS the delivered context. A thin or
  // shell-less handle still works; entries the default set already loaded are
  // skipped; a manifest that fails to compile degrades to a note, never a
  // broken entry.
  const manifest = shellBlock && shellBlock['3'];
  if (manifest && typeof manifest === 'object') {
    try {
      const bundle: PMap = new Map();
      for (const k of Object.keys(manifest)) {
        if (k === '_') continue;
        const v = (manifest as any)[k];
        const ref = typeof v === 'string' ? v : (v && typeof v === 'object' ? v._ : null);
        if (typeof ref === 'string' && ref.includes(':') && !/\s/.test(ref) && !seen.has(ref)) {
          seen.add(ref);
          bundle.set(k, ref);
        }
      }
      if (bundle.size > 0) {
        const r = await compile(bundle, load, { carried: [`pool:${roomName}`] });
        completions.push(...r.completions);
        const w = r.window as PMap;
        for (const [k, v] of w) {
          if (v === null || v === undefined) continue;
          const ref = bundle.get(k);
          own.push({ name: typeof ref === 'string' ? ref : `shell:3.${k}`, json: pyDumps(v) });
        }
      }
    } catch (e: any) {
      own.push({ name: `shell:${handle} 3 (manifest)`, json: JSON.stringify(`did not compile: ${String(e?.message ?? e).slice(0, 120)} — read its addresses directly via bsp`) });
    }
  }
  // 4b. Co-presence — who else stands at this place, SPLIT BY GRAIN twice over
  //     (proposals 2026-07-15 presence-grain §7 + pscale-of-agency G1). Location is
  //     the character's (slow, fictional); liveness is the driver's (fast, real).
  //     And grain is ADDRESS: a handle at your exact address shares your beat and
  //     splits HERE NOW / ABOUT by signal; a handle standing at an ANCESTOR address
  //     (the town while you are in the kitchen) is at the coarser grain BY CHOICE —
  //     about this place by construction, no signal needed; and when YOU stand
  //     coarse, the finer life beneath you is listed because you are its container
  //     (and, at a fold, its determiner).
  const myPassport = own.find((o) => o.name === `passport:${handle}`);
  const myLoc = myPassport ? passportLocation(JSON.parse(myPassport.json)) : null;
  const cast = myLoc ? await castAtWorld(resolved, handle) : [];
  let here: CastEntry[] = [];
  let about: CastEntry[] = [];
  const coarser: { handle: string; appearance: string; addr: string }[] = [];
  const finer: { handle: string; appearance: string; addr: string }[] = [];
  if (myLoc && cast.length) {
    // Same-place is WALKED-FORM equality, never raw-string: '111', '1110' at a
    // wider floor, and any padding variant all walk the same digits — a raw
    // compare makes co-located players invisible to each other the moment two
    // writers canonicalise differently (the recognition failure's latent class).
    const samePlace = (a: string, b: string) =>
      isLocationAddress(a) && isLocationAddress(b) ? walkedOf(a) === walkedOf(b) : a === b;
    const atMine = cast.filter((c) => samePlace(c.addr, myLoc));
    for (const c of cast) {
      if (samePlace(c.addr, myLoc)) continue;
      if (isLocationAddress(c.addr) && isLocationAddress(myLoc)) {
        if (contains(c.addr, myLoc)) coarser.push(c);
        else if (contains(myLoc, c.addr)) finer.push(c);
      }
    }
    if (atMine.length) {
      const signals = await livenessSignals(resolved, roomName ?? null);
      const entries = atMine.map((c) => ({ handle: c.handle, appearance: c.appearance, lastSignal: signals.get(c.handle) ?? null }));
      ({ here, about } = splitCast(entries, Date.now()));
    }
  }

  const has = (p: string) => own.some((o) => o.name.startsWith(p));
  const kind = has('witnessed:') || has('passport:')
    ? 'character'
    : has('shell:')
      ? 'user / agent (shell-based)'
      : 'fresh handle (no blocks yet)';

  // 5. Pinning preamble + the room envelope + the handle's own context.
  const out: string[] = [];
  out.push(`# You are now playing ${handle} in ${world}`);
  out.push(`World beach: ${resolved}  ·  handle kind: ${kind}`);
  // Position is an invariant the SURFACE owns: a seat whose previous narration
  // walked somewhere arrives believing it moved, renders a place it never read,
  // and invents the interior (P2 forensic, 2026-07-03 — cyrus narrated the
  // brewhouse from the common room and staffed it with the wrong figure). Say
  // where the passport actually puts them, every entry.
  const p3 = myPassport ? String((JSON.parse(myPassport.json) as any)['3'] ?? '') : '';
  // Match dotted/comma'd malformations too — a location digit-path must be a
  // plain digit run, but seats carry the multi-dot habit (a genesis seat wrote
  // 1.1.1 and the digit-only readers silently placed it at addr 1, the wrong
  // scale). Surface the fault to the one holder of the secret; never silently
  // canonicalise.
  const spatialRef = (p3.match(/spatial:[\w-]+:[\d.,]+/) || [null])[0];
  if (spatialRef) {
    const addr = spatialRef.split(':').pop() ?? '';
    // A location is a single-decimal pscale address (pscale-of-agency G1): plain
    // digits at-or-above the floor ("111", "3200" — trailing zeros are padding),
    // ONE dot for finer-than-floor ("111.1"). Multi-dot and commas remain the
    // malformations the parser strict-rejects; surface them to the secret-holder.
    const malformed = !isLocationAddress(addr);
    const grain = malformed ? null : pscaleOf(addr);
    out.push(`POSITION (substrate truth): ${spatialRef}${grain !== null ? ` — standing at pscale ${grain >= 0 ? '+' + grain : grain} (${grain === 0 ? 'the room, beat-grain' : grain > 0 ? 'a coarser place, its coarser cadence — your acts are its longer beats' : 'finer than the room — the close, quick grain'})` : ''} — your passport places you HERE, whatever your last narration said; you have NOT moved unless passport:3 changed. Your acts land in THIS room until the MOVE steps complete (leaving-beat → passport:3 write, address copied from the world's spatial block → re-enter pscale_play → arriving-beat).${malformed ? ` ⚠ THIS ADDRESS IS MALFORMED: a location is a single-decimal pscale address — plain digits padded to the world's floor ("111", "3200"), at most ONE dot for finer detail ("111.1") — never multi-dotted, never comma'd. Rewrite passport:3 with an address COPIED from the spatial block FIRST, or the world reads you at the wrong scale.` : ''}`);
  }
  out.push(`PIN THIS BEACH. Every further call targets ${resolved} — pool_url for the room, agent_id="${resolved}" for reading your own blocks, agent_id="${handle}" for contributing. Never a bare handle, never the apex, never another world.`);
  out.push('');
  out.push('Follow the operating directive below every turn. Render the scene to the player in second person, present tense — only what these reads return; invent nothing; name others only as you have earned their names.');
  out.push('');
  out.push('═══════════ THE ROOM — operating directive + live scene ═══════════');
  out.push(env);
  for (const line of frameSection) out.push(line);
  if (here.length || about.length || coarser.length || finer.length) {
    out.push('');
    out.push('═══════════ WHO IS HERE — co-present at your place (by appearance; names unearned until spoken) ═══════════');
    if (here.length) {
      out.push('HERE NOW (your grain — live in the scene; they act and answer within it):');
      for (const c of here) out.push(`— ${c.appearance}`);
    }
    if (about.length || coarser.length) {
      if (here.length) out.push('');
      out.push('ABOUT (the coarser grain — hereabouts and real, but NOT at the table: render them about the place, never awaiting; a beat directed at them lands at the coarser grain, answered when they next descend; they cannot be contested; the scene never waits on them):');
      for (const c of about) out.push(`— ${c.appearance}`);
      for (const c of coarser) out.push(`— ${c.appearance} (standing at the ${pscaleOf(c.addr) >= 2 ? "day's" : 'longer'} grain of this place — pscale ${'+' + pscaleOf(c.addr)}, by their own stance)`);
    }
    if (finer.length) {
      out.push('');
      out.push('WITHIN (finer life beneath your stance — you contain these; their fine beats fold up into your coarser one, and a coarse window you resolve must absorb theirs first — one now):');
      for (const c of finer) out.push(`— ${c.appearance} (at ${c.addr}, the finer grain)`);
    }
  }
  if (own.length) {
    out.push('');
    out.push(`═══════════ YOUR OWN CONTEXT (${handle}) ═══════════`);
    for (const o of own) out.push(`── ${o.name} ──\n${o.json}`);
  } else {
    out.push('');
    // Reached only when no creation passage resolved anywhere (the genesis-first
    // gate at 1b returns the passage for fresh handles on worlds that have one).
    out.push(`(No blocks for ${handle} on this world yet — you are fresh here.)`);
  }
  if (completions.length) {
    out.push('');
    out.push(renderCompletions(completions));
  }
  return { content: [{ type: 'text', text: out.join('\n') }] };
}
