/**
 * observer-recap.ts — one OBSERVER-face correlation narrative, NHITL (P2, rung 1).
 *
 * The invocable face-task: "recap the Beaten Drum". A fresh LLM context wearing
 * the Observer face reads the room's public record and the private accounts,
 * and appends ONE correlation narrative — overlap and divergence, never a
 * master truth — to an audience block (default history:<room>). Characters
 * cannot see the observer: it writes nothing to the pool and stages nothing.
 * This is the O-face output path: the artifact an audience reads, and the raw
 * feed for external renditions (social copy, visuals) later.
 *
 *   tsx scripts/observer-recap.ts --world <beach-url> --room <pool-name>
 *                                 [--output history:<room>] [--handle weft]
 *                                 [--since 0] [--secret S] [--model M]
 *                                 [--max-steps 16] [--trace <file>]
 */
import { loadRigEnv, arg, runSeat, beachIndex } from './lib/agent-seat.js';

loadRigEnv();
const WORLD = String(arg('world', ''));
const ROOM = String(arg('room', ''));
const HANDLE = String(arg('handle', 'weft'));
const OUTPUT = String(arg('output', ROOM ? `history:${ROOM}` : ''));
const SINCE = parseInt(arg('since', '0'), 10);
const SECRET = String(arg('secret', ''));

if (!/^https?:\/\//.test(WORLD) || !ROOM) {
  console.error('usage: tsx scripts/observer-recap.ts --world <http(s)://beach-url> --room <pool-name> [--output <block>] [--handle H] [--since N] [--secret S] [--model M] [--max-steps N] [--trace <file>]');
  process.exit(2);
}

const index = await beachIndex(WORLD);
const witnessed = index.filter((b) => b.startsWith('witnessed:'));
const spatial = index.find((b) => b.startsWith('spatial:'));

const prompt = [
  `Wear the OBSERVER face for the world at ${WORLD}. The observer is the inter-subjective correlation across separate accounts — an audience-facing narrator of overlap and divergence, NEVER a player and NEVER a master truth. The characters cannot see you: write nothing to the room's pool, stage nothing to its liquid.`,
  `Work in this order:`,
  `1. Read the room's public record: pscale_pool_engage(pool_url="${WORLD}", pool_name="${ROOM}", agent_id="${HANDLE}", face="observer", since_position=${SINCE}).`,
  witnessed.length
    ? `2. Read the private accounts present at this world: ${witnessed.map((w) => `bsp(agent_id="${WORLD}", block="${w}")`).join(', ')}. Each is one character's own overlay of reads — theirs, not the truth.`
    : `2. (No private accounts exist yet at this world — correlate the public record with itself: what different beats assume, reveal, and leave unsaid.)`,
  spatial ? `3. Read the place if it grounds the telling: bsp(agent_id="${WORLD}", block="${spatial}").` : `3. (No spatial block — tell it from the record alone.)`,
  `4. Compose ONE correlation narrative for an audience that was not there. Tell what happened in the shared record; where the private accounts overlap; where they diverge — what one holds that another cannot see. Divergence is the CONTENT, not an error to resolve. Every claim about a character's interior is carried as their own account or as your uncertain read — never as fact. Do not decide what really happened. Name characters as the public record names them (handle or appearance); a private account's earned names stay private unless the record spoke them.`,
  `5. Append it to the audience block: bsp(agent_id="${WORLD}", block="${OUTPUT}", append=true, content={"_": <the narrative>, "1": "${HANDLE}", "2": "", "3": <ISO timestamp now>, "4": "observer"}${SECRET ? `, secret="${SECRET}"` : ''}). append CREATES the block with a proper floor on first use — NEVER a whole-block content write.`,
  `6. END with the narrative itself as plain text, then one line naming the block and slot it landed at.`,
].join('\n\n');

console.log(`[observer-recap] ${HANDLE} @ ${WORLD} · room=${ROOM} → ${OUTPUT} · ${witnessed.length} private account(s)`);
const r = await runSeat({
  label: `${HANDLE}(observer)`,
  prompt,
  model: arg('model', undefined),
  maxSteps: parseInt(arg('max-steps', '16'), 10),
  traceFile: arg('trace', undefined),
});
if (r.finalText) console.log(`\n[observer-recap] NARRATIVE:\n${r.finalText}`);
