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
 * the later ones; it is NOT a daemon and starts none.
 */
import { promises as fs, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { handlePoolEngage, poolEngageParamsSchema } from '../src/tools/pool.js';
import { handlePlay, playParamsSchema } from '../src/tools/play.js';
import { handleBsp, bspParamsSchema } from '../src/tools/bsp.js';
import { INSTRUCTIONS } from '../src/server.js';
import { loadBlock } from '../src/db.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// .env.rig loader — same convention as rpg-rig.ts; existing env wins.
try {
  const ef = fileURLToPath(new URL('../.env.rig', import.meta.url));
  if (existsSync(ef)) for (const line of readFileSync(ef, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch { /* fine — fails below if no key */ }

const arg = (n: string, d: any) => { const i = process.argv.indexOf(`--${n}`); if (i < 0) return d; const v = process.argv[i + 1]; return (v && !v.startsWith('--')) ? v : true; };
const WORLD = String(arg('world', ''));
const HANDLE = String(arg('handle', ''));
const SECRET = String(arg('secret', ''));
const NOTE = String(arg('note', ''));
const MODEL = String(arg('model', 'claude-sonnet-4-6'));
const MAX_STEPS = parseInt(arg('max-steps', '16'), 10);
const TRACE_FILE = String(arg('trace', ''));

if (!/^https?:\/\//.test(WORLD) || !HANDLE) {
  console.error('usage: tsx scripts/npc-turn.ts --world <http(s)://beach-url> --handle <h> [--secret S] [--note "..."] [--model M] [--max-steps N] [--trace <file>]');
  process.exit(2);
}
const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error('npc-turn needs ANTHROPIC_API_KEY (or .env.rig) — the seat makes real tool calls.'); process.exit(2); }
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');

const TRACE: any[] = [];
let SEQ = 0;
const trace = (e: Record<string, any>) => { TRACE.push({ seq: SEQ++, round: 1, ...e }); };

const z2j = (shape: Record<string, any>) => { const s: any = zodToJsonSchema(z.object(shape), { $refStrategy: 'none' }); delete s.$schema; return s; };
const TOOLS = [
  { name: 'pscale_play', description: "Inhabit a handle in a world in one call: resolves the world to its beach, engages the room (the operating directive AND the live scene arrive inlined), scoops your own context by walking your shell's manifest, and PINS the beach so every later call targets it.", input_schema: z2j(playParamsSchema) },
  { name: 'pscale_pool_engage', description: "Engage a pool. Read (no submit/contribution) returns the operating directive + the live window + new events. submit=<text> STAGES your intention to the room's liquid window. contribution=<beat> COMMITS. with_liquid shows co-present pending intentions.", input_schema: z2j(poolEngageParamsSchema) },
  { name: 'bsp', description: "The unified bsp() read/write. Read when content omitted; write when content provided. For federated blocks (witnessed/knows/spatial/passport) agent_id is the beach URL and spindle is the address; append=true appends to an accumulator such as your own witnessed account.", input_schema: z2j(bspParamsSchema) },
];

async function executeTool(name: string, input: any): Promise<string> {
  try {
    if (name === 'pscale_play') return (await handlePlay(input)).content[0].text;
    if (name === 'pscale_pool_engage') return (await handlePoolEngage(input)).content[0].text;
    if (name === 'bsp') return (await handleBsp(input)).content[0].text;
    return `error: unknown tool "${name}"`;
  } catch (e: any) { return `tool error (${name}): ${e?.message ?? String(e)}`; }
}

async function api(messages: any[]): Promise<any> {
  const r = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 3000, system: INSTRUCTIONS, tools: TOOLS, messages }),
  });
  const d: any = await r.json();
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 400)}`);
  return d;
}

async function main() {
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

  console.log(`[npc-turn] ${HANDLE} @ ${WORLD} · model=${MODEL}${drive ? ' · drive=purpose:' + HANDLE : ''}${NOTE ? ' · note armed' : ''}`);
  const thread: any[] = [{ role: 'user', content: prompt }];
  for (let step = 0; step < MAX_STEPS; step++) {
    const resp = await api(thread);
    thread.push({ role: 'assistant', content: resp.content });
    const text = (resp.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').trim();
    if (text) { console.log(`  · ${HANDLE}: ${text.replace(/\s+/g, ' ').slice(0, 240)}`); trace({ phase: 'agent-say', actor: HANDLE, response: text }); }
    const toolUses = (resp.content || []).filter((c: any) => c.type === 'tool_use');
    if (toolUses.length === 0) {
      if (text) console.log(`\n[npc-turn] TURN COMPLETE — final render:\n${text}`);
      break;
    }
    const results: any[] = [];
    for (const tu of toolUses) {
      const i = tu.input || {};
      const tag = i.submit !== undefined ? ` submit="${String(i.submit).slice(0, 60)}…"`
        : i.contribution !== undefined ? ' commit' : i.block ? ` ${i.block}${i.spindle != null ? ':' + i.spindle : ''}`
        : i.world ? ` ${i.handle}@${String(i.world).slice(0, 40)}` : '';
      console.log(`  → ${HANDLE} · ${tu.name}${tag}`);
      const out = await executeTool(tu.name, tu.input);
      trace({ phase: 'agent-tool', actor: HANDLE, tool: tu.name, input: JSON.stringify(tu.input ?? {}).slice(0, 2000), response: out.slice(0, 4000) });
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: out.slice(0, 20000) });
    }
    thread.push({ role: 'user', content: results });
  }
  if (TRACE_FILE) { await fs.writeFile(TRACE_FILE, JSON.stringify(TRACE, null, 1)); console.log(`[npc-turn] trace: ${TRACE.length} events → ${TRACE_FILE}`); }
}

main().catch((e) => { console.error('[npc-turn] ERROR', e?.stack || e); process.exitCode = 1; });
