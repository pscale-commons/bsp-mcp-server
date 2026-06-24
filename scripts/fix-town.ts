/**
 * fix-town.ts — re-author + seed JUST the spatial town for a world (robust extraction),
 * for when seed-world's town write was rejected (author wrapped the JSON). Does not touch
 * the already-seeded engine or characters.
 *   npx tsx scripts/fix-town.ts [--world thousand-valleys] [--beach <url>] [--secret valleys142]
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

try { const ef = fileURLToPath(new URL('../.env.rig', import.meta.url)); if (existsSync(ef)) for (const line of readFileSync(ef, 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, ''); } } catch { /* none */ }
const arg = (n: string, d: any) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 && process.argv[i + 1] && !String(process.argv[i + 1]).startsWith('--') ? process.argv[i + 1] : d; };
const WORLD = String(arg('world', 'thousand-valleys'));
const TITLE = WORLD.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const BEACH = String(arg('beach', 'https://thousand-valleys.beach.happyseaurchin.com')).replace(/\/$/, '');
const SECRET = String(arg('secret', 'valleys142'));
const MODEL = String(arg('model', 'claude-sonnet-4-6'));
const KEY = process.env.ANTHROPIC_API_KEY;
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');

async function think(system: string, user: string): Promise<string> {
  const r = await fetch(`${BASE}/v1/messages`, { method: 'POST', headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: MODEL, max_tokens: 8000, system, messages: [{ role: 'user', content: user }] }) });
  const d: any = await r.json(); if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 300)}`); return (d.content || []).map((c: any) => c.text || '').join('').trim();
}
function grab(t: string): any { let s = t.replace(/```json/gi, '```').replace(/```/g, ''); const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a < 0 || b <= a) throw new Error('no JSON'); return JSON.parse(s.slice(a, b + 1)); }
const digitKeys = (o: any) => (o && typeof o === 'object' ? Object.keys(o).filter((k) => /^[1-9]$/.test(k)) : []);
function cleanSpatial(obj: any): any {
  let s = obj;
  if (digitKeys(s).length === 0) for (const k of Object.keys(s || {})) if (typeof s[k] === 'object' && digitKeys(s[k]).length) { s = s[k]; break; } // unwrap a named wrapper
  const out: any = {};
  for (const k of Object.keys(s || {})) if (k === '_' || /^[1-9]$/.test(k)) out[k] = s[k]; // strip non-spine keys
  return out;
}
async function post(name: string, content: any, lock?: string) {
  const body: any = { spindle: '', content, confirm: true };
  if (lock) body.new_lock = lock;
  const r = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(name)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
}

async function main() {
  if (!KEY) { console.error('Needs ANTHROPIC_API_KEY'); process.exit(1); }
  const sys = `You are the Author generating ONLY the spatial map of the town for the world "${WORLD}" — a remote upland settlement where many small valleys fold into the hills, drove-roads link them, the high passes are closing, and stock has been going missing with talk of lights on the far ridges.
Output ONLY one JSON object — the bare spatial content. Do NOT wrap it under any key like "spatial" or "content"; the TOP LEVEL itself must be the map (its keys are "_" and digits 1-9).
SPINE (the substrate rejects violations): every object has ONLY "_" plus digit keys 1-9; never "_word" keys, never JSON-stringified sub-objects; "_" is a situated present-tense sentence about its own node (no I/you/it as subject, no headings).
Position 1 is the CENTRAL GATHERING PLACE — a hall or common-room with a hearth where newcomers arrive; give it 2-3 sub-positions (features + a standing figure as fixed scenery). 5-7 places total, lived-in, with quiet tensions a player could pull on. Root "_" = the town overall.`;
  const raw = await think(sys, `Author the town now. Output ONLY the bare JSON object (top level = the map).`);
  const spatial = cleanSpatial(grab(raw));
  const places = digitKeys(spatial);
  if (!places.length) { console.error('STILL no places after clean. Raw output:\n' + raw.slice(0, 700)); process.exit(1); }
  console.log(`authored ${places.length} places: ${places.map((k) => (typeof spatial[k] === 'string' ? spatial[k] : spatial[k]._ || '').slice(0, 32)).join(' · ')}`);
  const r = await post(`spatial:${WORLD}`, spatial, SECRET);
  console.log(`post spatial:${WORLD} → ${r.ok ? 'ok' : 'FAIL ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 120)}`);
  if (!r.ok) process.exit(1);
  const got: any = await (await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(`spatial:${WORLD}`)}`)).json();
  const back = digitKeys(got);
  console.log(`VERIFIED on ${BEACH}: spatial:${WORLD} now has ${back.length} places ✓`);
  console.log(`place 1 (the gathering place): ${typeof got['1'] === 'string' ? got['1'] : got['1']?._}`);
}
main().catch((e) => { console.error('[fix-town] ERROR', e?.stack || e); process.exitCode = 1; });
