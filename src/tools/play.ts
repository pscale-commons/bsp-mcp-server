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
import { loadBlock, resolveFederationOrigin, DEFAULT_BEACH } from '../db.js';
import { handlePoolEngage } from './pool.js';

/**
 * Resolve a world to its beach origin. A full URL is used as-is; a bare world
 * name resolves to the sub-domain convention <world>.beach.<host>
 * (block-conventions:4.8 — each world is its own isolated beach), derived from
 * the default beach's host. "thornwood" → https://thornwood.beach.happyseaurchin.com.
 */
function worldOrigin(world: string): string {
  const w = world.trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(w)) return w;
  let host = 'beach.happyseaurchin.com';
  try { host = new URL(DEFAULT_BEACH).host; } catch { /* keep fallback */ }
  const base = host.startsWith('beach.') ? host.slice('beach.'.length) : host;
  return `https://${w}.beach.${base}`;
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

export const playParamsSchema = {
  world: z
    .string()
    .describe("The world to inhabit — a bare world-name that resolves to its own sub-beach (<world>.beach.<host>, e.g. 'thornwood' → https://thornwood.beach.happyseaurchin.com), or a full beach URL. Worlds are isolated sub-beaches (block-conventions:4.8); the apex commons is itself a world for users/agents."),
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
  const origin = worldOrigin(world);

  // 1. The world must be a live beach.
  const resolved = await resolveFederationOrigin(origin);
  if (!resolved) {
    return { content: [{ type: 'text', text: `No world at "${world}" (resolved to ${origin}) — it is not a federated beach. Check the world name, or pass a full beach URL.` }] };
  }

  // 2. Resolve the room pool. One room → use it; several → ask which (location-
  //    based derivation is the documented next step, not v1).
  let roomName = room?.trim();
  if (!roomName) {
    const rooms = (await beachIndex(resolved))
      .filter((b) => b.startsWith('pool:') && !b.startsWith('liquid:'))
      .map((b) => b.slice('pool:'.length));
    if (rooms.length === 1) {
      roomName = rooms[0];
    } else if (rooms.length === 0) {
      return { content: [{ type: 'text', text: `World ${resolved} has no room yet — an author must open one (pscale_pool_engage with purpose=...).` }] };
    } else {
      return { content: [{ type: 'text', text: `World ${resolved} has several rooms: ${rooms.join(', ')}. Pass room=<name> to choose.` }] };
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
  out.push(`PIN THIS BEACH. Every further call targets ${resolved} — pool_url for the room, agent_id="${resolved}" for reading your own blocks, agent_id="${handle}" for contributing. Never a bare handle, never the apex, never another world.`);
  out.push('');
  out.push('Follow the operating directive below every turn. Render the scene to the player in second person, present tense — only what these reads return; invent nothing; name others only as you have earned their names.');
  out.push('');
  out.push('═══════════ THE ROOM — operating directive + live scene ═══════════');
  out.push(env);
  if (own.length) {
    out.push('');
    out.push(`═══════════ YOUR OWN CONTEXT (${handle}) ═══════════`);
    for (const o of own) out.push(`── ${o.name} ──\n${o.json}`);
  } else {
    out.push('');
    out.push(`(No blocks for ${handle} on this world yet — you are fresh here. The directive will tell you how to begin.)`);
  }
  return { content: [{ type: 'text', text: out.join('\n') }] };
}
