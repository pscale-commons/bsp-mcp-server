/**
 * probe-playable-world.ts — the system-path proof David asked for: an author-LLM
 * generates a town, and real character-LLMs then ENTER it via pscale_play and play.
 *
 * It reuses the VALIDATED thornwood engine (rules/function/frame-spec/pool) untouched
 * and swaps ONLY the spatial content for a freshly authored town, relocating the three
 * characters to its entry. Then it runs the faithful agent loop (the LLM makes its own
 * bsp-mcp tool calls — pscale_play to enter, pscale_pool_engage to perceive + act).
 * If cyrus/anya/fenn perceive the NEW geography and act in it, the generated world is
 * playable end-to-end — content-gen (probe-author-world) plus the engine equals play.
 *
 *   npx tsx scripts/probe-playable-world.ts [--model claude-sonnet-4-6] [--keep]
 *
 * Local + offline (a temp beach); no live beach touched. Needs ANTHROPIC_API_KEY.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { handlePoolEngage, poolEngageParamsSchema } from '../src/tools/pool.js';
import { handlePlay, playParamsSchema } from '../src/tools/play.js';
import { handleBsp, bspParamsSchema } from '../src/tools/bsp.js';
import { INSTRUCTIONS } from '../src/server.js';
import { loadBlock } from '../src/db.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

try { const ef = fileURLToPath(new URL('../.env.rig', import.meta.url)); if (existsSync(ef)) for (const line of readFileSync(ef, 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, ''); } } catch { /* none */ }

const arg = (n: string, d: any) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 && process.argv[i + 1] && !String(process.argv[i + 1]).startsWith('--') ? process.argv[i + 1] : d; };
const MODEL = String(arg('model', 'claude-sonnet-4-6'));
const KEEP = process.argv.includes('--keep');
const BEACH_REPO = process.env.BEACH_REPO || fileURLToPath(new URL('../../pscale-beach', import.meta.url));
const PORT = parseInt(process.env.PLAYABLE_PORT || '8803', 10);
const BEACH = `http://localhost:${PORT}`;
const SECRET = 'thorn142';
const CHARS = ['cyrus', 'anya', 'fenn'];
const KEY = process.env.ANTHROPIC_API_KEY;
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const j = (o: any) => JSON.stringify(o, null, 1);

let beachProc: ChildProcess | null = null;
async function spawnBeach(dir: string): Promise<void> {
  beachProc = spawn('node', [join(BEACH_REPO, 'scripts/local-beach.mjs'), '--dir', dir, '--port', String(PORT), '--origin', `localhost:${PORT}`], { stdio: ['ignore', 'ignore', 'ignore'] });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`${BEACH}/.well-known/pscale-beach`)).ok) return; } catch { /* not up */ } await sleep(150); }
  throw new Error('local beach did not come up');
}
const seedPack = () => new Promise<void>((resolve, reject) => {
  const p = spawn('node', [join(BEACH_REPO, 'scripts/pack-seed.mjs'), '--beach', BEACH, '--pack', join(BEACH_REPO, 'packs/thornwood')], { stdio: ['ignore', 'ignore', 'ignore'], env: { ...process.env, THORN_GM: SECRET, THORN_CYRUS: SECRET, THORN_ANYA: SECRET, THORN_FENN: SECRET } });
  p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`pack-seed exit ${c}`))));
});
const block = async (name: string): Promise<any> => (await loadBlock(BEACH, name))?.block ?? null;

async function think(system: string, user: string, maxTokens = 6000): Promise<string> {
  const r = await fetch(`${BASE}/v1/messages`, { method: 'POST', headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }) });
  const d: any = await r.json();
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
  return (d.content || []).map((c: any) => c.text || '').join('').trim();
}
function extractJsonObject(text: string): any {
  let s = text.replace(/```json/gi, '```').replace(/```/g, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('no JSON object in author output');
  return JSON.parse(s.slice(a, b + 1));
}

// ── faithful agent loop (same as rpg-rig --client agent) ──
const z2j = (shape: Record<string, any>) => { const s: any = zodToJsonSchema(z.object(shape), { $refStrategy: 'none' }); delete s.$schema; return s; };
const AGENT_TOOLS = [
  { name: 'pscale_play', description: 'Inhabit a handle in a world in one call: resolves the world to its beach, engages the room (operating directive AND live scene inlined), scoops your own context, and PINS the beach.', input_schema: z2j(playParamsSchema) },
  { name: 'pscale_pool_engage', description: 'Engage a pool. Read returns the directive + live window + new events. submit=<text> STAGES your intention (presence). contribution=<skeleton>+resolves_window=<stamp> COMMITS a resolution.', input_schema: z2j(poolEngageParamsSchema) },
  { name: 'bsp', description: 'Unified bsp() read/write. Read when content omitted; write when content provided. Federated blocks: agent_id=beach URL, spindle=address; append=true appends to an accumulator (your own history).', input_schema: z2j(bspParamsSchema) },
];
async function executeTool(name: string, input: any): Promise<string> {
  try {
    if (name === 'pscale_play') return (await handlePlay(input)).content[0].text;
    if (name === 'pscale_pool_engage') return (await handlePoolEngage(input)).content[0].text;
    if (name === 'bsp') return (await handleBsp(input)).content[0].text;
    return `error: unknown tool "${name}"`;
  } catch (e: any) { return `tool error (${name}): ${e?.message ?? String(e)}`; }
}
async function agentApi(messages: any[]): Promise<any> {
  const r = await fetch(`${BASE}/v1/messages`, { method: 'POST', headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: MODEL, max_tokens: 3000, system: INSTRUCTIONS, tools: AGENT_TOOLS, messages }) });
  const d: any = await r.json();
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 400)}`);
  return d;
}
async function agentTurn(h: string, thread: any[]): Promise<string[]> {
  const calls: string[] = [];
  for (let step = 0; step < 16; step++) {
    const resp = await agentApi(thread);
    thread.push({ role: 'assistant', content: resp.content });
    const text = (resp.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').trim();
    if (text) console.log(`  · ${h}: ${text.replace(/\s+/g, ' ').slice(0, 200)}`);
    const toolUses = (resp.content || []).filter((c: any) => c.type === 'tool_use');
    for (const tu of toolUses) { const i = tu.input || {}; const tag = i.world ? ` ${i.handle}@${i.world}` : i.submit !== undefined ? ` submit` : i.contribution !== undefined ? ` commit` : i.block ? ` ${i.block}` : ''; calls.push(tu.name + tag); console.log(`  → ${h} · ${tu.name}${tag}`); }
    if (toolUses.length === 0) return calls;
    const results = [];
    for (const tu of toolUses) results.push({ type: 'tool_result', tool_use_id: tu.id, content: (await executeTool(tu.name, tu.input)).slice(0, 20000) });
    thread.push({ role: 'user', content: results });
  }
  return calls;
}

async function main() {
  if (!KEY) { console.error('Needs ANTHROPIC_API_KEY (.env.rig)'); process.exit(1); }
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'playable-'));
  await spawnBeach(dir); await seedPack();
  console.log(`[playable] thornwood engine seeded → ${BEACH} · model=${MODEL}\n`);

  // ── 1. AUTHOR a fresh town (spatial only — drops onto the existing engine) ──
  const authorSystem = `You are the Author (CADO Author face) generating ONLY the spatial map of a fresh town for an existing RPG engine. Output ONLY one JSON object: the content of a "spatial" block.

SPINE RULES (hard — the substrate rejects violations): every object has ONLY "_" plus digit keys 1-9. NEVER "_word" keys, NEVER JSON-stringified sub-objects. "_" is the node's own description (a substantive, situated, present-tense sentence — no I/you/it as subject, no headings); digits 1-9 are its places/features.

Make a town of 5-7 notable places at the root (digits 1-9). Position 1 is the CENTRAL GATHERING PLACE where newcomers arrive (a tavern, hall, or square) — give it 2-3 sub-positions (its features and a standing figure or two as fixed scenery). Other places may be leaf strings or small objects. Make it lived-in, concrete, with quiet tensions a player could pull on. Root "_" = the town overall.

Output ONLY the JSON object (the spatial content). No prose, no "name" wrapper.`;
  const t0 = performance.now();
  const raw = await think(authorSystem, `Author a small, atmospheric town now — somewhere with arrivals, locals, and a low hum of unease. Output ONLY the spatial content JSON object.`);
  const spatial = extractJsonObject(raw);
  const genMs = performance.now() - t0;
  const places = Object.keys(spatial).filter((k) => /^[1-9]$/.test(k));
  console.log(`AUTHORED a new town in ${(genMs / 1000).toFixed(1)}s — ${places.length} places: ${places.map((k) => (typeof spatial[k] === 'string' ? spatial[k] : spatial[k]._ || '').slice(0, 28)).join(' · ')}\n`);

  // ── 2. SWAP it onto the engine + relocate the three characters to position 1 ──
  const swap = await handleBsp({ agent_id: BEACH, block: 'spatial:thornwood', content: spatial, secret: SECRET } as any);
  console.log(`  swapped spatial:thornwood → ${swap.content[0].text}`);
  for (const h of CHARS) {
    await handleBsp({ agent_id: BEACH, block: `passport:${h}`, spindle: '3', pscale_attention: 0, content: `Newly arrived in the heart of the town, taking it in. Location: *:${BEACH}:spatial:thornwood:1`, secret: SECRET } as any);
  }
  console.log(`  relocated ${CHARS.join(', ')} to spatial:thornwood:1 (the town's gathering place)\n`);

  // ── 3. PLAY — each character enters the NEW town and takes one turn ──
  console.log(`${'='.repeat(56)}\nPLAY — the characters enter the generated town (1 turn each)\n${'='.repeat(56)}`);
  const allCalls: Record<string, string[]> = {};
  for (const h of CHARS) {
    const thread = [{ role: 'user', content: `Play ${h} on ${BEACH} — your passphrase for ${h} is "${SECRET}". Enter the world, perceive from your character's position, render the lived moment, and act once (submit your intention). You ARE ${h}.` }];
    allCalls[h] = await agentTurn(h, thread);
  }

  // ── 4. VERIFY — did they enter + act in the generated geography? ──
  const enteredAll = CHARS.every((h) => allCalls[h].some((c) => c.startsWith('pscale_play')));
  const actedAll = CHARS.every((h) => allCalls[h].some((c) => /pscale_pool_engage/.test(c)));
  const liquid = await block(`liquid:pool:111`);
  const pool = await block(`pool:111`);
  const liveCount = liquid ? Object.keys(liquid).filter((k) => /^[1-9]$/.test(k)).length : 0;
  console.log(`\n${'='.repeat(56)}\nVERIFY`);
  console.log(`  · all three entered via pscale_play: ${enteredAll ? 'yes' : 'NO'}`);
  console.log(`  · all three engaged the pool (perceive/act): ${actedAll ? 'yes' : 'NO'}`);
  console.log(`  · intentions staged in the live window: ${liveCount}`);

  // coherence: did their acts reference the NEW town? judge from the staged intentions
  const intentions = liquid ? Object.keys(liquid).filter((k) => /^[1-9]$/.test(k)).map((k) => (typeof liquid[k] === 'object' ? `${liquid[k]['1'] || '?'}: ${liquid[k]._}` : liquid[k])).join('\n') : '(none)';
  console.log(`\n  WHAT THEY DID (staged intentions, in the generated town):\n${intentions.split('\n').map((l) => '    ' + l.slice(0, 150)).join('\n')}`);
  const judge = await think(
    `You are judging whether three players genuinely entered and acted WITHIN a specific generated town (not a generic tavern). Given the town map and what each did, answer in 3 lines: GROUNDED (1-5: do the actions reference this town's actual places/figures?), COHERENT (1-5), and one sentence on whether this reads as a playable world.`,
    `THE GENERATED TOWN:\n${j(spatial)}\n\nWHAT THE THREE DID:\n${intentions}`,
    500,
  );
  console.log(`\n  PLAYABILITY JUDGE:\n${judge.split('\n').map((l) => '    ' + l).join('\n')}`);

  const viable = enteredAll && actedAll && liveCount >= 2;
  console.log(`\n${'═'.repeat(60)}\nPLAYABLE-WORLD VERDICT: ${viable ? '✅ PLAYABLE' : '⚠ ISSUES'} — author-generated town + the existing engine, entered and played by real character-LLMs.\n${'═'.repeat(60)}`);

  if (KEEP) { await fs.writeFile(join(dir, 'town.json'), j(spatial)); console.log(`\n[playable] kept at ${dir}`); }
  else await fs.rm(dir, { recursive: true, force: true });
}
main().catch((e) => { console.error('[playable] ERROR', e?.stack || e); process.exitCode = 1; }).finally(() => { if (beachProc) beachProc.kill(); });
