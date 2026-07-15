/**
 * mint-region.ts — one per-party region commission, NHITL (P2, rung 1).
 *
 * Spawn is PER-PARTY: every activated party gets a SIBLING ADDRESS, never a body
 * in the same pub (proposal 2026-07-15 §5; project:nomad-rpg future 2.6). One
 * author-seat run extends spatial:<world> with a fresh region branch at
 * region-grain — a start leaf where the party arrives, standing figures carrying
 * hooks personalised from the party's lobby talk — and opens the room pool at the
 * start leaf so pscale_play seats the party there the moment their passports
 * carry the address. A thousand parties are a thousand sibling regions; the
 * tree's breadth is the sharding.
 *
 *   tsx scripts/mint-region.ts --world <beach-url> --party "a,b,c" --brief "<lobby summary>"
 *                              [--handle weft] [--secret S] [--model M]
 *                              [--max-steps 24] [--trace <file>]
 *
 * Costs one real seat run (δ) — operator-invoked only, never a daemon. The
 * receipt names the start address; activation writes each party passport's
 * position 3 to it (*:<beach>:spatial:<world>:<addr>) and the party re-enters
 * via pscale_play. Verification bar: an npc-turn seat walked to the start leaf
 * perceives the region at earned depth.
 */
import { loadRigEnv, arg, runSeat, beachIndex } from './lib/agent-seat.js';

loadRigEnv();
const WORLD = String(arg('world', ''));
const PARTY = String(arg('party', ''));
const BRIEF = String(arg('brief', ''));
const HANDLE = String(arg('handle', 'weft'));
const SECRET = String(arg('secret', ''));

if (!/^https?:\/\//.test(WORLD) || !PARTY || !BRIEF) {
  console.error('usage: tsx scripts/mint-region.ts --world <http(s)://beach-url> --party "a,b,c" --brief "<lobby summary>" [--handle H] [--secret S] [--model M] [--max-steps N] [--trace <file>]');
  process.exit(2);
}

const index = await beachIndex(WORLD);
const spatial = index.find((b) => b.startsWith('spatial:'));
const rules = index.filter((b) => b.startsWith('rules:'));
const roomPool = index.find((b) => b.startsWith('pool:') && !b.startsWith('liquid:') && b !== 'pool:gate');
if (!spatial) { console.error(`[mint-region] no spatial:* block at ${WORLD} — not a mounted world.`); process.exit(2); }

const party = PARTY.split(',').map((s) => s.trim()).filter(Boolean);

const prompt = [
  `Wear the AUTHOR face for the world at ${WORLD}. This commission MINTS A REGION for an arriving party — the fixed stage they will walk into. You author places and the standing figures woven into their prose; never the live story, never character state, never outcomes.`,
  `The party: ${party.join(', ')}. Their lobby brief (what they said they are here for — personalise the hooks to it): ${BRIEF}`,
  `Work in this order:`,
  `1. Read the whole place tree: bsp(agent_id="${WORLD}", block="${spatial}"). Study the address tree AND the prose voice — situated place-description, no headings, sentences like the ones already there. Nesting IS containment; a region's places extend the region's address by one digit per level.`,
  rules.length ? `2. Read the world's physics so the region obeys it: ${rules.map((r) => `bsp(agent_id="${WORLD}", block="${r}")`).join(' and ')}.` : `2. (This world carries no rules block — author to the spatial prose alone.)`,
  `3. Choose a FREE SIBLING address at region-grain — the same depth as the world's existing top-level places, the next free digit. NEVER overwrite an existing place; NEVER nest the new region inside another party's ground. This region is the party's own start: distance IS their privacy (proposal 2026-07-15 §5).`,
  `4. Write the region: bsp(agent_id="${WORLD}", block="${spatial}", spindle=<region addr>, content=<one situated paragraph>${SECRET ? `, secret="${SECRET}"` : ''}). Then its interior at child addresses: a small settlement or camp, TWO or THREE places deep at most, and ONE clear start leaf — the gathering place the party arrives at (a hearth, a waystation, a shaded well). Standing figures are authored INTO the prose (fixed scene, voiceable when engaged, never live agencies) and CARRY THE HOOKS — at least two, personalised from the brief, each a figure or a detail a plainly-asked question will open.`,
  `5. Open the start leaf's room so play can seat the party: first read the mount this world uses (bsp(agent_id="${WORLD}", block="${roomPool ?? 'pool:<room>'}", pscale_attention=0) — its underscore), then pscale_pool_engage(pool_url="${WORLD}", pool_name=<start leaf address digits>, agent_id="${HANDLE}", face="author", purpose=<the same underscore form, else "pscale:grit">). The pool's name IS the spatial address — that is how the room follows the place.`,
  `6. END with the commission's receipt as plain text, exactly this shape and nothing more:`,
  `   region: <region addr> — <one line>`,
  `   places: <addr> — <one line> (one row per place written)`,
  `   start: <start leaf addr> (room pool:<start leaf addr>)`,
  `   hooks: <one line per hook — figure/detail and what opens it>`,
  `   activation: write each party passport's position 3 to *:${WORLD}:spatial:${spatial.split(':').pop()}:<start leaf addr> then re-enter pscale_play(world="${WORLD}", handle=<their handle>).`,
].join('\n\n');

console.log(`[mint-region] ${HANDLE} @ ${WORLD} · ${spatial} · party: ${party.join(', ')}`);
const r = await runSeat({
  label: `${HANDLE}(author:mint-region)`,
  prompt,
  model: arg('model', undefined),
  maxSteps: parseInt(arg('max-steps', '24'), 10),
  traceFile: arg('trace', undefined),
});
if (r.finalText) console.log(`\n[mint-region] RECEIPT:\n${r.finalText}`);
