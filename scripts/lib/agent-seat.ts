/**
 * agent-seat.ts — the shared LLM seat under every invocable face-task (P2).
 *
 * One seat = one FRESH LLM context handed the real bsp-mcp tools
 * (pscale_play / pscale_pool_engage / bsp), driven until it stops calling
 * tools. Nothing survives the invocation — continuity is the SUBSTRATE'S job
 * (purpose/witnessed/pool for a character; spatial for the author; the
 * audience block for the observer). Consumers: npc-turn.ts, author-task.ts,
 * observer-recap.ts. The seat is not a daemon and starts none.
 */
import { promises as fs, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { handlePoolEngage, poolEngageParamsSchema } from '../../src/tools/pool.js';
import { handlePlay, playParamsSchema } from '../../src/tools/play.js';
import { handleBsp, bspParamsSchema } from '../../src/tools/bsp.js';
import { INSTRUCTIONS } from '../../src/server.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// .env.rig loader — same convention as rpg-rig.ts; existing env wins.
export function loadRigEnv(): void {
  try {
    const ef = fileURLToPath(new URL('../../.env.rig', import.meta.url));
    if (existsSync(ef)) for (const line of readFileSync(ef, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch { /* fine — runSeat fails below if no key */ }
}

export const arg = (n: string, d: any): any => { const i = process.argv.indexOf(`--${n}`); if (i < 0) return d; const v = process.argv[i + 1]; return (v && !v.startsWith('--')) ? v : true; };

const z2j = (shape: Record<string, any>) => { const s: any = zodToJsonSchema(z.object(shape), { $refStrategy: 'none' }); delete s.$schema; return s; };
const TOOLS = [
  { name: 'pscale_play', description: "Inhabit a handle in a world in one call: resolves the world to its beach, engages the room (the operating directive AND the live scene arrive inlined), scoops your own context by walking your shell's manifest, and PINS the beach so every later call targets it.", input_schema: z2j(playParamsSchema) },
  { name: 'pscale_pool_engage', description: "Engage a pool. Read (no submit/contribution) returns the operating directive + the live window + new events. submit=<text> STAGES your intention to the room's liquid window. contribution=<beat> COMMITS. purpose=<line> CREATES the pool if absent (the canonical creation path). with_liquid shows co-present pending intentions.", input_schema: z2j(poolEngageParamsSchema) },
  { name: 'bsp', description: "The unified bsp() read/write. Read when content omitted; write when content provided. For federated blocks (witnessed/knows/spatial/passport) agent_id is the beach URL and spindle is the address; append=true appends to an accumulator (and CREATES it with a proper floor on first use).", input_schema: z2j(bspParamsSchema) },
];

async function executeTool(name: string, input: any): Promise<string> {
  try {
    if (name === 'pscale_play') return (await handlePlay(input)).content[0].text;
    if (name === 'pscale_pool_engage') return (await handlePoolEngage(input)).content[0].text;
    if (name === 'bsp') return (await handleBsp(input)).content[0].text;
    return `error: unknown tool "${name}"`;
  } catch (e: any) { return `tool error (${name}): ${e?.message ?? String(e)}`; }
}

export interface SeatResult { finalText: string; trace: any[]; steps: number }

/** Drive one fresh seat to completion. Prints the same console form as the rig. */
export async function runSeat(opts: {
  label: string;          // console prefix + trace actor
  prompt: string;         // the user message (the whole task framing)
  model?: string;
  maxSteps?: number;
  traceFile?: string;
}): Promise<SeatResult> {
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) throw new Error('agent-seat needs ANTHROPIC_API_KEY (or .env.rig) — the seat makes real tool calls.');
  const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
  const MODEL = opts.model || 'claude-sonnet-4-6';
  const MAX = opts.maxSteps ?? 16;
  const L = opts.label;

  const TRACE: any[] = [];
  let seq = 0;
  const trace = (e: Record<string, any>) => { TRACE.push({ seq: seq++, round: 1, ...e }); };

  const api = async (messages: any[]): Promise<any> => {
    const r = await fetch(`${BASE}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 3000, system: INSTRUCTIONS, tools: TOOLS, messages }),
    });
    const d: any = await r.json();
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 400)}`);
    return d;
  };

  const thread: any[] = [{ role: 'user', content: opts.prompt }];
  let finalText = '';
  let step = 0;
  for (; step < MAX; step++) {
    const resp = await api(thread);
    thread.push({ role: 'assistant', content: resp.content });
    const text = (resp.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').trim();
    if (text) { console.log(`  · ${L}: ${text.replace(/\s+/g, ' ').slice(0, 240)}`); trace({ phase: 'agent-say', actor: L, response: text }); }
    const toolUses = (resp.content || []).filter((c: any) => c.type === 'tool_use');
    if (toolUses.length === 0) { finalText = text; break; }
    const results: any[] = [];
    for (const tu of toolUses) {
      const i = tu.input || {};
      const tag = i.submit !== undefined ? ` submit="${String(i.submit).slice(0, 60)}…"`
        : i.contribution !== undefined ? ' commit' : i.purpose !== undefined ? ` open pool:${i.pool_name}`
        : i.block ? ` ${i.block}${i.spindle != null ? ':' + i.spindle : ''}${i.content !== undefined ? ' (write)' : ''}`
        : i.world ? ` ${i.handle}@${String(i.world).slice(0, 40)}` : '';
      console.log(`  → ${L} · ${tu.name}${tag}`);
      const out = await executeTool(tu.name, tu.input);
      trace({ phase: 'agent-tool', actor: L, tool: tu.name, input: JSON.stringify(tu.input ?? {}).slice(0, 2000), response: out.slice(0, 4000) });
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: out.slice(0, 20000) });
    }
    thread.push({ role: 'user', content: results });
  }
  if (step >= MAX) console.log(`  ! ${L}: hit the tool-step cap (${MAX})`);
  if (opts.traceFile) { await fs.writeFile(opts.traceFile, JSON.stringify(TRACE, null, 1)); console.log(`[seat] trace: ${TRACE.length} events → ${opts.traceFile}`); }
  return { finalText, trace: TRACE, steps: step };
}

/** Fetch a beach's derived index (the named sibling blocks at the surface). */
export async function beachIndex(worldUrl: string): Promise<string[]> {
  try {
    const res = await fetch(`${worldUrl}/.well-known/pscale-beach`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const j: any = await res.json();
    return Array.isArray(j?.blocks) ? j.blocks : [];
  } catch { return []; }
}
