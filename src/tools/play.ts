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
import { handlePoolEngage, resolveDirective, collectContributions, floorUnderscore } from './pool.js';
import { readAt } from '../bsp.js';
import { isLocationAddress, contains, pscaleOf, walkedOf, STANDARD_SPINE } from '../grain-address.js';

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

/** World → beach origin. Full URL as-is; bare name via the worlds directory, then
 *  the sub-domain fallback. */
async function resolveWorld(world: string): Promise<string> {
  const w = world.trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(w)) return w;
  return (await lookupWorldRoute(w)) ?? subdomainOrigin(w);
}

/** The beach's no-block index (its named blocks). Empty on any failure. */
async function beachIndex(origin: string): Promise<string[]> {
  try {
    const res = await fetch(`${origin}/.well-known/pscale-beach`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const j: any = await res.json();
    return Array.isArray(j?.blocks) ? j.blocks : [];
  } catch {
    return [];
  }
}

/** Render a lighthouse sub-block (its underscore, then digit children) as readable
 *  lines — surfaces the fork recipe faithfully in the canon lead, one level deep. */
function subBlockText(node: any): string {
  if (typeof node === 'string') return node;
  if (!node || typeof node !== 'object') return '';
  const lines: string[] = [];
  if (typeof node._ === 'string') lines.push(node._);
  for (const k of Object.keys(node).filter((x) => /^[1-9]$/.test(x)).sort()) {
    const v = node[k];
    lines.push(typeof v === 'string' ? `  ${k}. ${v}` : `  ${k}. ${subBlockText(v).replace(/\n/g, '\n  ')}`);
  }
  return lines.join('\n');
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
  out.push(`# ${world} is a SCENARIO (canon) — ${handle} does not play here`);
  if (typeof lh._ === 'string') { out.push(''); out.push(lh._); }
  if (lh['1']) { out.push(''); out.push('─── OPEN A TABLE ───'); out.push(subBlockText(lh['1'])); }
  if (lh['2']) { out.push(''); out.push('─── THEN GENESIS INTO YOUR TABLE ───'); out.push(subBlockText(lh['2'])); }
  out.push('');
  out.push(`Do the copies above to your own table, then call pscale_play again with world set to your table's full URL. This canon surface stays untouched; nothing plays here.`);
  return out.join('\n');
}

/** The spatial address in a passport's position 3 ("…spatial:<world>:<addr>") — the
 *  character's location, at ANY grain (proposal 2026-07-15-pscale-of-agency): a full
 *  single-decimal pscale address. "111" the room, "3200" the town (trailing zeros are
 *  floor padding — a +2 stance), "111.1" the hearth (−1). The old flat (\d+) regex was
 *  the explicit design debt of 2026-07-01 ("flat pscale-0 rooms remain for now"). */
function passportLocation(passportBlock: any): string | null {
  const p3 = passportBlock?.['3'];
  if (typeof p3 !== 'string') return null;
  const m = p3.match(/spatial:[\w-]+:(\d+(?:\.\d+)?)/);
  return m ? m[1] : null;
}
/** A name-free observable appearance from a passport's position 3 (the posture before the location
 *  ref), so a co-present character is perceived without leaking the name they have not yet earned. */
function passportAppearance(passportBlock: any, handle: string): string {
  let s = String(passportBlock?.['3'] ?? '').split(/\s*Location:/)[0].trim();
  if (handle) {
    const cap = handle[0].toUpperCase() + handle.slice(1);
    s = s.replace(new RegExp(`\\b${cap}\\b`, 'g'), 'A figure').replace(new RegExp(`\\b${handle}\\b`, 'gi'), 'a figure');
  }
  return s || 'a figure here';
}
/** Every OTHER placed handle at this world — handle, appearance, and the address it
 *  stands at. Position is already in passport:3; this only surfaces what the substrate
 *  holds. The caller partitions by address relation (same place / coarser stance
 *  containing it / finer life beneath) — grain is address, so co-presence is address
 *  arithmetic, not a special case. By appearance; names stay unearned. */
async function castAtWorld(
  origin: string,
  handle: string,
): Promise<{ handle: string; appearance: string; addr: string }[]> {
  const out: { handle: string; appearance: string; addr: string }[] = [];
  for (const pn of (await beachIndex(origin)).filter((b) => b.startsWith('passport:') && b !== `passport:${handle}`)) {
    const row = await loadBlock(origin, pn);
    const block = row?.block;
    const addr = block ? passportLocation(block) : null;
    if (block && addr) {
      const h = pn.slice('passport:'.length);
      out.push({ handle: h, appearance: passportAppearance(block, h), addr });
    }
  }
  return out;
}

// ── Presence-grain (proposal 2026-07-15) — a character is present AT A GRAIN ──
// Character-location (passport:3, slow, fictional) and driver-liveness (liquid /
// commits / presence heartbeats — fast, real) are different axes; rendering the
// first as the second is how a seeded character stands mute at a table for five
// weeks. Liveness is DERIVED AT READ from signals the substrate already holds —
// never stored, no daemon, same law as the two-verb pool's computed-at-read status.

/** v1 heuristic: a handle with a signal inside this window is HERE NOW (beat-grain);
 *  outside it they are ABOUT (present at the day's grain). A per-room span datum can
 *  refine this when lived play asks. */
export const LIVE_WINDOW_MS = 60 * 60 * 1000;

export interface CastEntry { handle: string; appearance: string; lastSignal: number | null }

/** Pure split — HERE NOW vs ABOUT — so the rule is one testable function. */
export function splitCast(entries: CastEntry[], now: number): { here: CastEntry[]; about: CastEntry[] } {
  const here: CastEntry[] = [];
  const about: CastEntry[] = [];
  for (const e of entries) {
    (e.lastSignal != null && now - e.lastSignal <= LIVE_WINDOW_MS ? here : about).push(e);
  }
  return { here, about };
}

/** Latest liveness signal per handle at this world: a staged liquid slot, a pool
 *  commit, or a presence heartbeat — max timestamp wins. All three are accumulator
 *  reads (collectContributions is floor-aware, so supernested blocks still speak).
 *  A stale presence entry pointing at a dead pool matches no cast handle and so
 *  never renders — debris is inert here by construction. */
async function livenessSignals(origin: string, roomName: string | null): Promise<Map<string, number>> {
  const sig = new Map<string, number>();
  const note = (h: string | null, ts: string | null) => {
    if (!h || !ts) return;
    const ms = Date.parse(ts);
    if (!Number.isFinite(ms)) return;
    if ((sig.get(h) ?? -Infinity) < ms) sig.set(h, ms);
  };
  const names = roomName ? [`liquid:pool:${roomName}`, `pool:${roomName}`, 'presence'] : ['presence'];
  for (const name of names) {
    const row = await loadBlock(origin, name);
    if (row?.block && typeof row.block === 'object') {
      for (const c of collectContributions(row.block as any, 0).contributions) {
        if (name.startsWith('liquid:') && c.text === '') continue; // withdrawn slot is no signal
        note(c.agent_id, c.ts);
      }
    }
  }
  return sig;
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
      const gatePurpose = `The gate at ${world} — the out-of-fiction lobby. Users gather here AS THEMSELVES before characters exist. NOTHING COMMITS HERE: stage one line — who you are, what you are looking for — and the liquid mirror shows everyone else standing at the gate right now, each with the moment they FIRST staged (the arrival stamp — revising a line never moves it). A staged line is revisable, and clearing it leaves no trace; the gate keeps no record, because a lobby that remembers its own small talk becomes the first thing every later arrival must read. A party forms by agreeing here and walking genesis together. Where the party needs someone to go first, the EARLIEST arrival in the mirror walks first — earliest by the arrival stamp, so revising to answer a companion costs nobody their place: that walker chooses the arrival place from the world's receiving places, and everyone else gives that walker's handle at their interview, which lands them at the same door — exact where a place-name is vague, and still true if the party has already moved. In-fiction beats never land here; the first thing you ever commit is your arriving beat, in the room at your position, once your character exists.`;
      const g: string[] = [];
      g.push(`# ${handle} is NEW at ${world} — you stand at the GATE`);
      g.push(`World beach: ${resolved}  ·  no blocks exist for ${handle} here yet.`);
      g.push(`PIN THIS BEACH. Every call below targets ${resolved}.`);
      g.push('');
      g.push(`THE GATE — the lobby, before any character. Engage it keyless as yourself, staging one line about who you are and what you are looking for: pscale_pool_engage(pool_url="${resolved}", pool_name="gate", agent_id="${handle}", submit="<your line>") — the envelope returns the liquid mirror: everyone standing at the gate right now, each with their arrival stamp (first-staged; revising never moves it). STAGE, NEVER COMMIT: submit= is revisable, clears without trace, and IS the lobby; contribution= would nail a permanent line to the world's front door, where every later arrival reads it forever — that is not what a gate is for. Re-engage to see who has answered; a companion who arrives while you are away is waiting in the mirror when you look. When the party is agreed, clear your line (submit="") and walk genesis. If the gate does not exist yet, pass purpose= with exactly this text to found it: ${JSON.stringify(gatePurpose)}`);
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
  // bsp-addresses that scoop the handle's full context. Beyond the default set
  // above, scoop whatever extra named blocks the manifest references (e.g.
  // purpose:<h> the drive, stats:<h> the rule sheet, relationships:<h>) — so a
  // character inhabits the way a hermitcrab does (mobius loads all its blocks),
  // not from a hardcoded list. Default set + manifest extras (the lean): a thin
  // or shell-less handle still works; a rich shell pulls its whole context.
  const manifest = shellBlock && shellBlock['3'];
  if (manifest && typeof manifest === 'object') {
    for (const k of Object.keys(manifest)) {
      if (k === '_') continue;
      const v = manifest[k];
      const ref = typeof v === 'string' ? v : (v && typeof v === 'object' ? v._ : null);
      if (typeof ref === 'string' && ref.includes(':') && !/\s/.test(ref) && !seen.has(ref)) {
        seen.add(ref);
        const row = await loadBlock(resolved, ref);
        if (row && row.block && typeof row.block === 'object') {
          own.push({ name: ref, json: JSON.stringify(row.block, null, 1) });
        }
      }
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
  return { content: [{ type: 'text', text: out.join('\n') }] };
}
