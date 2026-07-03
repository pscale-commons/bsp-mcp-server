/**
 * author-task.ts — one bounded AUTHOR-face commission, NHITL (P2, rung 1).
 *
 * The invocable face-task: "author the brewhouse". A fresh LLM context wearing
 * the Author face extends the world's FIXED scene — places and the standing
 * figures authored into them — via bsp() writes to spatial:<world>, and may
 * open a room pool at a place characters should gather. It NEVER touches the
 * live story: no pool beats, no character state, no outcomes. Authoring is
 * bsp() on the substrate; this script only hosts the seat.
 *
 *   tsx scripts/author-task.ts --world <beach-url> --task "<commission>"
 *                              [--handle weft] [--secret S] [--model M]
 *                              [--max-steps 16] [--trace <file>]
 *
 * Verification bar (the Author gate): the content renders at earned depth on a
 * later perceive — run npc-turn for a character who goes there and read it.
 */
import { loadRigEnv, arg, runSeat, beachIndex } from './lib/agent-seat.js';

loadRigEnv();
const WORLD = String(arg('world', ''));
const TASK = String(arg('task', ''));
const HANDLE = String(arg('handle', 'weft'));
const SECRET = String(arg('secret', ''));

if (!/^https?:\/\//.test(WORLD) || !TASK) {
  console.error('usage: tsx scripts/author-task.ts --world <http(s)://beach-url> --task "<commission>" [--handle H] [--secret S] [--model M] [--max-steps N] [--trace <file>]');
  process.exit(2);
}

const index = await beachIndex(WORLD);
const spatial = index.find((b) => b.startsWith('spatial:'));
const rules = index.filter((b) => b.startsWith('rules:'));
const roomPool = index.find((b) => b.startsWith('pool:') && !b.startsWith('liquid:'));
if (!spatial) { console.error(`[author-task] no spatial:* block at ${WORLD} — not a mounted world.`); process.exit(2); }

const prompt = [
  `Wear the AUTHOR face for the world at ${WORLD}. The author extends the world's FIXED scene — places, and the standing figures authored INTO their prose — and never the live story: no pool beats, no character state, no outcomes. What you write is the stage the characters will walk into.`,
  `Work in this order:`,
  `1. Read the whole place tree: bsp(agent_id="${WORLD}", block="${spatial}"). Study BOTH the address tree and the prose voice — situated place-description, no headings, sentences like the ones already there. Nesting IS containment: a room inside a building extends the building's address by one digit.`,
  rules.length ? `2. Read the world's physics so what you author obeys it: ${rules.map((r) => `bsp(agent_id="${WORLD}", block="${r}")`).join(' and ')}.` : `2. (This world carries no rules block — author to the spatial prose alone.)`,
  `3. Choose the address the commission calls for: a FREE sibling or child of the place it belongs to. NEVER overwrite an existing place — you have read the tree; if an address is taken, take the next free sibling.`,
  `4. Write the place: bsp(agent_id="${WORLD}", block="${spatial}", spindle=<the address>, content=<the place prose as one string>${SECRET ? `, secret="${SECRET}"` : ''}). Standing figures are authored into the prose (fixed scene, never live agencies). Interior detail, if the commission wants it, is written the same way at child addresses.`,
  `5. If the commission makes a place characters should GATHER at, open its room: first read the existing room pool's underscore (bsp(agent_id="${WORLD}", block="${roomPool ?? 'pool:<room>'}", pscale_attention=0) shows the form this world uses), then pscale_pool_engage(pool_url="${WORLD}", pool_name=<the new address digits>, agent_id="${HANDLE}", face="author", purpose=<the same underscore form>). The pool's name IS the spatial address — that is how a room follows a place.`,
  `6. END with the commission's receipt as plain text: each address you wrote and a one-line summary of what stands there, plus the room you opened if any. No fiction, no flourish.`,
  `THE COMMISSION: ${TASK}`,
].join('\n\n');

console.log(`[author-task] ${HANDLE} @ ${WORLD} · ${spatial}`);
const r = await runSeat({
  label: `${HANDLE}(author)`,
  prompt,
  model: arg('model', undefined),
  maxSteps: parseInt(arg('max-steps', '16'), 10),
  traceFile: arg('trace', undefined),
});
if (r.finalText) console.log(`\n[author-task] RECEIPT:\n${r.finalText}`);
