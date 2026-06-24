/**
 * probe-author-world.ts — can an author-LLM generate a coherent, playable world
 * onto a beach, unattended? This is stage one of the overnight dream (objective B)
 * and the content floor for human play (objective A).
 *
 * Strategy (informed by probe-write-speed.ts): the author-LLM emits the whole world
 * as a DATA-SPEC in ONE generation, then we BATCH-LOAD it (parallel writes) — fast,
 * inspectable, and shape-validated by the beach itself (a write that violates the
 * spine gate is rejected, so a clean load == shape-legal world).
 *
 *   author → batch-load → verify shape/structure → playability perceive → coherence judge
 *
 *   npx tsx scripts/probe-author-world.ts [--world rivermeet] [--scenario <file>]
 *                                         [--model claude-sonnet-4-6] [--keep]
 *
 * Needs ANTHROPIC_API_KEY (auto-loaded from .env.rig, like the rig).
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

// .env.rig (gitignored) — reuse the stored ANTHROPIC_API_KEY
try {
  const ef = fileURLToPath(new URL('../.env.rig', import.meta.url));
  if (existsSync(ef)) for (const line of readFileSync(ef, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch { /* none */ }

const arg = (n: string, d: any) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 && process.argv[i + 1] && !String(process.argv[i + 1]).startsWith('--') ? process.argv[i + 1] : d; };
const WORLD = String(arg('world', 'rivermeet'));
const MODEL = String(arg('model', 'claude-sonnet-4-6'));
const KEEP = process.argv.includes('--keep');
const SCENARIO_FILE = arg('scenario', null);
const BEACH_REPO = process.env.BEACH_REPO || fileURLToPath(new URL('../../pscale-beach', import.meta.url));
const PORT = parseInt(process.env.AUTHOR_PORT || '8802', 10);
const BEACH = `http://localhost:${PORT}`;
const KEY = process.env.ANTHROPIC_API_KEY;
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
const now = () => performance.now();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DEFAULT_SCENARIO = `A small river town where the south road meets the ferry crossing. Market day is winding down; a caravan that was due two days ago has not arrived; there is low unease about something moving in the hills above the valley. The town should feel lived-in and ready to explore — a place newcomers can walk into and immediately find people, tensions, and small mysteries.`;

let beachProc: ChildProcess | null = null;
async function spawnBeach(dir: string): Promise<void> {
  beachProc = spawn('node', [join(BEACH_REPO, 'scripts/local-beach.mjs'), '--dir', dir, '--port', String(PORT), '--origin', `localhost:${PORT}`], { stdio: ['ignore', 'ignore', 'ignore'] });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`${BEACH}/.well-known/pscale-beach`)).ok) return; } catch { /* not up */ } await sleep(150); }
  throw new Error('local beach did not come up');
}

async function think(system: string, user: string, maxTokens = 8000): Promise<string> {
  if (!KEY) throw new Error('probe-author-world needs ANTHROPIC_API_KEY (set it in .env.rig)');
  const r = await fetch(`${BASE}/v1/messages`, { method: 'POST', headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }) });
  const d: any = await r.json();
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
  return (d.content || []).map((c: any) => c.text || '').join('').trim();
}
function extractJsonArray(text: string): any[] {
  // tolerate ```json fences / prose around the array
  let s = text.replace(/```json/gi, '```').replace(/```/g, '');
  const a = s.indexOf('['), b = s.lastIndexOf(']');
  if (a < 0 || b < 0 || b <= a) throw new Error('no JSON array found in author output');
  return JSON.parse(s.slice(a, b + 1));
}
async function rawPost(name: string, content: any): Promise<{ ok: boolean; status: number; body: any }> {
  const r = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(name)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spindle: '', content, confirm: true }) });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}
async function rawGet(name: string): Promise<any> {
  const r = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(name)}`);
  if (!r.ok) return null;
  const d = await r.json();
  return d?.content ?? d; // wire returns the block directly (no content wrapper)
}
// count digit-keyed positions recursively (each = a place / sub-region / feature)
function countPositions(node: any): number {
  if (!node || typeof node !== 'object') return 0;
  let c = 0;
  for (const k of Object.keys(node)) { if (/^[1-9]$/.test(k)) { c++; c += countPositions(node[k]); } }
  return c;
}
// has a floor — a root underscore string (or a string somewhere on the underscore chain)
function hasFloor(node: any): boolean {
  let n = node, hops = 0;
  while (n && typeof n === 'object' && hops < 12) { if (typeof n._ === 'string' && n._.trim()) return true; n = n._; hops++; }
  return typeof n === 'string' && !!n.trim();
}
// detect spine violations the gate should have caught (defence-in-depth report)
function spineViolations(name: string, node: any, path = ''): string[] {
  if (!node || typeof node !== 'object') return [];
  const out: string[] = [];
  for (const k of Object.keys(node)) {
    if (k !== '_' && !/^[1-9]$/.test(k)) out.push(`${name}${path}: illegal key "${k}"`);
    if (k !== '_' && typeof node[k] === 'object') out.push(...spineViolations(name, node[k], `${path}.${k}`));
  }
  return out;
}

async function main() {
  if (!KEY) { console.error('No ANTHROPIC_API_KEY — set it in .env.rig'); process.exit(1); }
  const scenario = SCENARIO_FILE && existsSync(SCENARIO_FILE) ? readFileSync(SCENARIO_FILE, 'utf8') : DEFAULT_SCENARIO;
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'author-'));
  await spawnBeach(dir);
  console.log(`[author-probe] world="${WORLD}" · model=${MODEL} · fresh beach ${BEACH}\n`);
  console.log(`SCENARIO:\n${scenario}\n`);

  // ── 1. AUTHOR — one generation, the whole world as a data-spec ──
  const authorSystem = `You are an Author (the CADO Author face) generating a playable RPG world directly onto a pscale-block beach. You produce CONTENT — the stage and its standing figures — never play-events (that is for the characters to enact).

Output ONLY a JSON array of blocks, each {"name": "<block-name>", "content": {<pscale object>}}. No prose outside the array.

PSCALE SPINE RULES (hard — violations are rejected by the substrate):
- Every object has ONLY the key "_" plus digit keys 1-9. NEVER "_word" keys (no "_desc", "_npc"). NEVER a JSON-stringified object/array as a value.
- "_" is the node's own description; digits 1-9 are its parts/sub-regions/features.
- Prose is SITUATED and zeroth-person: present-tense, no "I"/"you"/"it" as the subject, no headings. A "_" reads as a substantive sentence about its own node.

AUTHOR EXACTLY THESE BLOCKS:
1. ONE block "spatial:${WORLD}" — the town as nested place-positions. Root "_" = the town overall. Each digit 1-9 = a notable place; a place is either a leaf string (its description) OR an object {"_": "<the place>", "1": "<a feature or a standing figure who keeps it>", "2": "...", ...}. Standing figures here are SCENERY (fixed, not live agencies). Make 5-7 places, layered where it helps. Locations are addressed as spatial:${WORLD}:<digits> (e.g. the inn's common room at position 1.1 is "11").
2. THREE to FOUR blocks "passport:<npc>" — the ACTIVE NPCs (live figures with their own concerns), one per NPC, lowercase one-word handles. Shape: {"_": "<who they are>", "1": "<capability / Character Force — reads ~8 for a competent adult, with a peak and a weak spot>", "2": "<what they want, with an undercurrent>", "3": "Location: *:{{BEACH}}:spatial:${WORLD}:<address>"}.
3. ONE block "passport:<pc>" — a ready pre-made player-character a newcomer can step into (same shape), placed somewhere central.

Example of ONE block's shape (do not copy its content):
{"name":"passport:mara","content":{"_":"Mara — the ferry-keeper, broad and unhurried, reads the river's moods.","1":"Capability — strong at the pole and the rope, knows every current and who crossed when; reads ~8; near 9 on the water, near 4 at letters.","2":"Wants — the crossing kept open and her debt to the miller cleared; underneath, to know why the caravan never reached the far bank.","3":"Location: *:{{BEACH}}:spatial:${WORLD}:2"}}`;

  const t0 = now();
  const raw = await think(authorSystem, `SCENARIO:\n${scenario}\n\nAuthor the world now. Output ONLY the JSON array.`);
  const genMs = now() - t0;
  let spec: any[];
  try { spec = extractJsonArray(raw); } catch (e: any) {
    console.error(`AUTHOR OUTPUT did not parse: ${e.message}\n--- first 600 chars ---\n${raw.slice(0, 600)}`);
    process.exit(1);
  }
  console.log(`AUTHORED ${spec.length} blocks in ${(genMs / 1000).toFixed(1)}s (one generation):`);
  for (const b of spec) console.log(`  · ${b.name}`);

  // ── 2. BATCH-LOAD — parallel writes; the beach gate validates shape ──
  const tLoad = now();
  const results = await Promise.all(spec.map((b) => {
    const content = JSON.parse(JSON.stringify(b.content).replaceAll('{{BEACH}}', BEACH));
    return rawPost(b.name, content).then((r) => ({ name: b.name, ...r }));
  }));
  const loadMs = now() - tLoad;
  const failed = results.filter((r) => !r.ok);
  console.log(`\nBATCH-LOADED in ${loadMs.toFixed(0)}ms · ${results.length - failed.length}/${results.length} accepted`);
  for (const f of failed) console.log(`  ✗ ${f.name}: HTTP ${f.status} ${JSON.stringify(f.body).slice(0, 120)}`);

  // ── 3. VERIFY — read back, structure + shape ──
  const spatial = await rawGet(`spatial:${WORLD}`);
  const npcNames = spec.map((b) => b.name).filter((n) => n.startsWith('passport:'));
  const places = countPositions(spatial);
  const violations: string[] = [];
  for (const b of spec) { const got = await rawGet(b.name); if (got) violations.push(...spineViolations(b.name, got)); }
  const floorsOk = (await Promise.all(spec.map(async (b) => hasFloor(await rawGet(b.name))))).every(Boolean);
  console.log(`\nVERIFY:`);
  console.log(`  · spatial:${WORLD} — ${places} place/feature positions`);
  console.log(`  · ${npcNames.length} character passport(s): ${npcNames.map((n) => n.split(':')[1]).join(', ')}`);
  console.log(`  · every block has a floor (root _): ${floorsOk ? 'yes' : 'NO'}`);
  console.log(`  · spine violations: ${violations.length === 0 ? 'none' : violations.length}`);
  for (const v of violations.slice(0, 6)) console.log(`      ! ${v}`);

  // ── 4. PLAYABILITY — drop a traveller at a place, run ONE perceive ──
  // pick the first object-place (has texture) else the first leaf
  const firstPlaceKey = spatial ? Object.keys(spatial).filter((k) => /^[1-9]$/.test(k))[0] : null;
  const placeNode = firstPlaceKey ? spatial[firstPlaceKey] : null;
  let perceive = '(no place to perceive)';
  if (placeNode) {
    perceive = await think(
      `You are a traveller arriving at a place in a fantasy world. Render what you perceive — second person, present tense, from where you stand; the place, the light, who or what is here. Two or three sentences. Stay strictly inside the fiction.`,
      `THE PLACE (a pscale block — "_" is the place, digits are its features/standing figures):\n${JSON.stringify(placeNode, null, 1)}\n\nYou step in. What do you perceive?`,
      600,
    );
  }
  console.log(`\nPLAYABILITY — a traveller perceives spatial:${WORLD}:${firstPlaceKey}:\n  ${perceive.replace(/\n/g, '\n  ')}`);

  // ── 5. COHERENCE — an observer judges the whole world ──
  const judge = await think(
    `You are an Observer judging a generated RPG town for whether it is COHERENT and PLAYABLE. Score 1-5 on each, one terse sentence of evidence each: (1) COHERENCE — places and people hang together as one town; (2) TEXTURE — concrete, evocative, lived-in, not generic; (3) HOOKS — tensions/mysteries a player could pull on; (4) PLAYABILITY — a newcomer could walk in and act. End with OVERALL (one line) and the BIGGEST GAP.`,
    spec.map((b) => `=== ${b.name} ===\n${JSON.stringify(b.content, null, 1)}`).join('\n\n'),
    900,
  );
  console.log(`\nCOHERENCE VERDICT:\n${judge}`);

  // ── verdict ──
  const viable = failed.length === 0 && floorsOk && violations.length === 0 && places >= 5 && npcNames.length >= 3;
  console.log(`\n${'═'.repeat(60)}\nPROBE VERDICT: ${viable ? '✅ VIABLE' : '⚠ ISSUES'} — author-LLM generated ${viable ? 'a shape-valid, populated, playable' : 'an incomplete'} world unattended.`);
  console.log(`  authored in ${(genMs / 1000).toFixed(1)}s · loaded in ${loadMs.toFixed(0)}ms · ${places} places · ${npcNames.length} characters`);
  console.log(`${'═'.repeat(60)}`);

  if (KEEP) { await fs.writeFile(join(dir, 'world-spec.json'), JSON.stringify(spec, null, 1)); console.log(`\n[author-probe] world kept at ${dir} (spec: world-spec.json)`); }
  else await fs.rm(dir, { recursive: true, force: true });
}

main().catch((e) => { console.error('[author-probe] ERROR', e?.stack || e); process.exitCode = 1; }).finally(() => { if (beachProc) beachProc.kill(); });
