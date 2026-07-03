/**
 * npc-turn.ts — ONE full character turn, NHITL, against ANY beach (P2, rung 1).
 *
 * The invocable face-task: "run maren's turn". A FRESH LLM context is handed the
 * real bsp-mcp tools (pscale_play / pscale_pool_engage / bsp) and takes ONE turn
 * as the handle — perceive, answer what is directed at it or act from its own
 * drive, commit, journal — exactly as a claude.ai player's LLM would, with the
 * LLM supplying the intent where a human would type it. Longitudinal continuity
 * is the SUBSTRATE'S job, not the process's: every invocation starts blank and
 * re-orients from purpose:<h> + witnessed:<h> + the pool. Invoke twice and the
 * second turn must continue the first from the blocks alone — that is the test
 * (agents-useful-first).
 *
 *   tsx scripts/npc-turn.ts --world <beach-url> --handle <h>
 *                           [--secret S] [--model M] [--note "<operator steer>"]
 *                           [--max-steps 16] [--trace <file>]
 *
 * Trigger ladder: operator-invoked (this) → cron/crab → presence-conscription
 * (the observer tax). This script is the first rung and the test instrument for
 * the later ones; it is NOT a daemon and starts none. The seat itself lives in
 * lib/agent-seat.ts, shared with author-task.ts and observer-recap.ts.
 */
import { loadRigEnv, arg, runSeat } from './lib/agent-seat.js';
import { loadBlock } from '../src/db.js';

loadRigEnv();
const WORLD = String(arg('world', ''));
const HANDLE = String(arg('handle', ''));
const SECRET = String(arg('secret', ''));
const NOTE = String(arg('note', ''));

if (!/^https?:\/\//.test(WORLD) || !HANDLE) {
  console.error('usage: tsx scripts/npc-turn.ts --world <http(s)://beach-url> --handle <h> [--secret S] [--note "..."] [--model M] [--max-steps N] [--trace <file>]');
  process.exit(2);
}

// The drive: purpose:<h> read here and injected, because play bundles the
// handle's passport/witnessed/knows/shell — purpose is the invoker's framing.
let drive = '';
try {
  const row = await loadBlock(WORLD, `purpose:${HANDLE}`);
  const d = row?.block && typeof row.block === 'object' ? (row.block as any)._ : row?.block;
  if (typeof d === 'string') drive = d;
} catch { /* no purpose block — acts from the scene alone */ }

const prompt = [
  `Play ${HANDLE} in the world at ${WORLD}. Enter by calling pscale_play with world="${WORLD}" (this EXACT full URL — never a bare name) and handle="${HANDLE}".${SECRET ? ` Your passphrase for ${HANDLE} is "${SECRET}" — it authorises your commits and your own-block writes.` : ''}`,
  drive ? `YOUR DRIVE (purpose:${HANDLE}): ${drive}` : '',
  `This is ${HANDLE}'s OWN turn — no player is prompting you; you are the character living in the world. Take ONE full turn per the operating directive: perceive what has changed (your witnessed account is your memory of before — re-read it and continue from it, never restart); if a beat in your catch-up is DIRECTED at you — it addressed you, asked you, acted toward you, by your name or by your appearance — answering it is YOURS this turn; otherwise act ONCE from your own drive. COMPLETE the whole turn: commit your beat to the room's pool, and journal your private read of the moment to your own account — bsp with block="witnessed:${HANDLE}" and append=true (append CREATES the account with a proper floor on first use; NEVER a whole-block content write, which would put your memory where the block's description belongs). Then END the turn — one turn only — closing with the lived moment rendered in one short paragraph.`,
  NOTE ? `OPERATOR NOTE (out of fiction, shapes this turn only): ${NOTE}` : '',
].filter(Boolean).join('\n\n');

console.log(`[npc-turn] ${HANDLE} @ ${WORLD}${drive ? ' · drive=purpose:' + HANDLE : ''}${NOTE ? ' · note armed' : ''}`);
const r = await runSeat({
  label: HANDLE,
  prompt,
  model: arg('model', undefined),
  maxSteps: parseInt(arg('max-steps', '16'), 10),
  traceFile: arg('trace', undefined),
});
if (r.finalText) console.log(`\n[npc-turn] TURN COMPLETE — final render:\n${r.finalText}`);
