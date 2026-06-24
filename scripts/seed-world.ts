/**
 * seed-world.ts — stand up a complete, playable world on a beach: the engine
 * (generalised from thornwood), an author-generated town, and FRESH characters
 * created FOR this world (the Bram-leak fix — each character's opening beat and
 * known names are grounded in THIS town, never transplanted).
 *
 * This is character-creation made real: a character is passport + shell(persona) +
 * purpose(drive) + witnessed(one in-world opening beat) + knows(in-world seed) +
 * stats(the NOMAD sheet, condition intact — the home damage/death will write to).
 *
 *   npx tsx scripts/seed-world.ts --world <name> [--beach <url>] [--secret <lock>]
 *                                 [--chars N] [--validate] [--keep]
 *
 * Default --beach spins a LOCAL beach and runs --validate (a fresh character enters
 * and plays; the run asserts no foreign-world leak). Point --beach at a live sub-beach
 * (e.g. https://thousand-valleys.beach.happyseaurchin.com) to seed it for real.
 * Needs ANTHROPIC_API_KEY (.env.rig).
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
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

try { const ef = fileURLToPath(new URL('../.env.rig', import.meta.url)); if (existsSync(ef)) for (const line of readFileSync(ef, 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, ''); } } catch { /* none */ }

const arg = (n: string, d: any) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 && process.argv[i + 1] && !String(process.argv[i + 1]).startsWith('--') ? process.argv[i + 1] : d; };
const WORLD = String(arg('world', 'thousand-valleys'));
const TITLE = WORLD.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const NCHARS = parseInt(arg('chars', '3'), 10);
const SECRET = String(arg('secret', 'valleys142'));
const MODEL = String(arg('model', 'claude-sonnet-4-6'));
const KEEP = process.argv.includes('--keep');
const VALIDATE = process.argv.includes('--validate') || !process.argv.includes('--beach');
const ROOM = `${WORLD}-commons`;
const THORN_DEF = fileURLToPath(new URL('../../pscale-beach/packs/thornwood/definition', import.meta.url));
const BEACH_REPO = process.env.BEACH_REPO || fileURLToPath(new URL('../../pscale-beach', import.meta.url));
const KEY = process.env.ANTHROPIC_API_KEY;
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const j = (o: any) => JSON.stringify(o, null, 1);

const DEFAULT_SCENARIO = `${TITLE} — a remote upland settlement where a thousand small valleys fold into the hills, linked by old drove-roads. Travellers, herders, and traders pass through; the high passes are closing for the season; there is talk of lights seen on the far ridges and stock going missing. A place to arrive at, find people and frictions, and explore.`;

// ── beach target: local spawn (validate) or a live URL ──
let beachProc: ChildProcess | null = null;
let BEACH = String(arg('beach', ''));
const PORT = parseInt(process.env.SEED_PORT || '8804', 10);
async function ensureBeach(): Promise<void> {
  if (BEACH) return; // live URL given
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'seed-'));
  BEACH = `http://localhost:${PORT}`;
  beachProc = spawn('node', [join(BEACH_REPO, 'scripts/local-beach.mjs'), '--dir', dir, '--port', String(PORT), '--origin', `localhost:${PORT}`], { stdio: ['ignore', 'ignore', 'ignore'] });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`${BEACH}/.well-known/pscale-beach`)).ok) return; } catch { /* not up */ } await sleep(150); }
  throw new Error('local beach did not come up');
}

async function think(system: string, user: string, maxTokens = 8000): Promise<string> {
  const r = await fetch(`${BASE}/v1/messages`, { method: 'POST', headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }) });
  const d: any = await r.json(); if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 300)}`); return (d.content || []).map((c: any) => c.text || '').join('').trim();
}
const grab = (t: string, open: string, close: string) => { let s = t.replace(/```json/gi, '```').replace(/```/g, ''); const a = s.indexOf(open), b = s.lastIndexOf(close); if (a < 0 || b <= a) throw new Error('no JSON found'); return JSON.parse(s.slice(a, b + 1)); };
const digitKeys = (o: any) => (o && typeof o === 'object' ? Object.keys(o).filter((k) => /^[1-9]$/.test(k)) : []);
// robust spatial extraction (fix 1): unwrap a named wrapper the author may add, strip non-spine top-level keys
function cleanSpatial(obj: any): any { let s = obj; if (digitKeys(s).length === 0) for (const k of Object.keys(s || {})) if (typeof s[k] === 'object' && digitKeys(s[k]).length) { s = s[k]; break; } const out: any = {}; for (const k of Object.keys(s || {})) if (k === '_' || /^[1-9]$/.test(k)) out[k] = s[k]; return out; }

async function post(name: string, content: any, lock?: string): Promise<{ ok: boolean; status: number; body: any }> {
  const body: any = { spindle: '', content: JSON.parse(JSON.stringify(content).replaceAll('{{BEACH}}', BEACH)), confirm: true };
  if (lock) body.new_lock = lock;
  const r = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(name)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
}

// ── 1. engine — generalise thornwood's definition blocks to <world> ──
function generaliseEngine(): { name: string; content: any }[] {
  const swap = (s: string) => s.replaceAll('thornwood', WORLD).replaceAll('Thornwood', TITLE);
  const out: { name: string; content: any }[] = [];
  for (const f of ['rules%3Anomad.json', 'rules%3Athornwood.json', 'function%3Athornwood.json', 'frame-spec%3Athornwood.json']) {
    const blk = JSON.parse(readFileSync(join(THORN_DEF, f), 'utf8'));
    const name = swap(blk.name);
    const content = JSON.parse(swap(JSON.stringify(blk.content)));
    out.push({ name, content });
  }
  return out;
}

async function main() {
  if (!KEY) { console.error('Needs ANTHROPIC_API_KEY (.env.rig)'); process.exit(1); }
  await ensureBeach();
  const live = !beachProc;
  console.log(`[seed-world] world="${WORLD}" → ${BEACH} ${live ? '(LIVE)' : '(local validate)'} · ${NCHARS} characters · engine locked under "${SECRET}"\n`);

  // 1. engine
  const engine = generaliseEngine();
  for (const b of engine) { const r = await post(b.name, b.content, SECRET); console.log(`  engine: ${b.name} ${r.ok ? 'ok' : 'FAIL ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 80)}`); }
  // room pool (its underscore points at the directive) + empty liquid
  await post(`pool:${ROOM}`, { _: `function:${WORLD}` });
  await post(`liquid:pool:${ROOM}`, { _: `Staging for ${ROOM}.` });
  console.log(`  room: pool:${ROOM} (→ function:${WORLD})`);

  // 2. town
  const townSys = `You are the Author generating ONLY the spatial map of the town for the world "${WORLD}". Output ONLY one JSON object (the content of a "spatial:${WORLD}" block). SPINE: every object has ONLY "_" plus digit keys 1-9; never "_word" keys, never stringified sub-objects; "_" is a situated present-tense sentence about its own node (no I/you/it as subject, no headings). Position 1 is the CENTRAL GATHERING PLACE (a hall, inn, or square) where newcomers arrive — give it 2-3 sub-positions (features + a standing figure as fixed scenery). 5-7 places total, lived-in, with quiet tensions. Root "_" = the town overall. Output the BARE map object only — do NOT wrap it under a key like "spatial" or "content"; the top level itself must be the map.`;
  const t0 = performance.now();
  const spatial = cleanSpatial(grab(await think(townSys, `SCENARIO:\n${DEFAULT_SCENARIO}\n\nAuthor the town now. Output ONLY the BARE spatial content JSON object (top level = the map, keys "_" and 1-9).`), '{', '}'));
  const placeList = digitKeys(spatial);
  if (!placeList.length) { console.error('  town author produced no places after clean — aborting'); process.exit(1); }
  const sr = await post(`spatial:${WORLD}`, spatial, SECRET);                              // fix 1: check the town actually landed
  if (!sr.ok) { console.error(`  spatial:${WORLD} write REJECTED: ${sr.status} ${JSON.stringify(sr.body).slice(0, 120)} — aborting`); process.exit(1); }
  console.log(`\n  TOWN authored (${((performance.now() - t0) / 1000).toFixed(1)}s): ${placeList.map((k) => (typeof spatial[k] === 'string' ? spatial[k] : spatial[k]._ || '').slice(0, 30)).join(' · ')}`);

  // 3. FRESH characters — created FOR this town (no foreign-world leak)
  const charSys = `You are creating ${NCHARS} fresh player-characters for the world "${WORLD}", set in THIS town (given below). Each is NEW here — arriving now or recently. Output ONLY a JSON array of ${NCHARS} objects, each:
{"handle": "<lowercase one word>", "identity": "<who they are, one sentence>", "capability": "<Character Force — reads ~8 for a competent adult; name a peak (near 9) and a weak spot (near 4)>", "wants": "<their goal, with an undercurrent>", "persona": "<a Character-face system prompt: 'You are X. Speak and act in first person...' — voice + stance, 2-3 sentences>", "drive": "<their active purpose right now — what they will ACT on, not merely watch>", "place": "1", "opening": "<2-3 sentences, present tense, of this character AT THE GATHERING HALL (position 1) in THIS town RIGHT NOW — reference only places and figures in the map, NEVER any other place>", "knows_people": ["<a figure in THIS town they recognise — name — short note>"], "knows_places": ["<a place in THIS town — short note>", "..."]}
Ground everything in THIS town. NEVER mention any other world, town, tavern, or figure not in the map below. Place ALL ${NCHARS} characters at the gathering hall (position 1) — they are co-present at the common hearth, so players meet on arrival; each opening beat is set there, each from their own point of view.`;
  const chars = grab(await think(charSys, `THE TOWN (spatial:${WORLD}):\n${j(spatial)}\n\nThe ${NCHARS} characters are all present at the gathering hall (position 1) right now. Create them, grounded strictly in the town. Output ONLY the JSON array.`), '[', ']');
  console.log(`\n  CHARACTERS created: ${chars.map((c: any) => c.handle).join(', ')}`);
  const now = '2026-06-23T12:00:00Z';
  for (const c of chars) {
    const h = c.handle;
    const loc = `*:{{BEACH}}:spatial:${WORLD}:1`;
    await post(`passport:${h}`, { _: c.identity, '1': c.capability, '2': c.wants, '3': `${c.opening.split('.')[0]}. Location: ${loc}` });
    await post(`shell:${h}`, {
      '1': { '1': { '4': c.persona, _: `Character — you ARE ${h}, perceiving from where they stand.` }, _: 'Faces (CADO). Character is the live play face.' },
      '3': { '1': `passport:${h}`, '2': `witnessed:${h}`, '3': `knows:${h}`, '4': `purpose:${h}`, '5': `stats:${h}`, _: `Manifest of ${h}'s blocks.` },
      _: `${h}'s character shell at ${WORLD} — who to be, and the manifest gathering all of ${h}'s blocks.`,
    });
    await post(`purpose:${h}`, { _: c.drive });
    await post(`witnessed:${h}`, { '1': { '1': h, '2': loc, '3': now, _: c.opening }, _: `${h}'s account at ${TITLE}, beat by beat.` });
    const people: any = { _: `People ${h} can name.` }; (c.knows_people || []).forEach((p: string, i: number) => (people[i + 1] = p));
    const places: any = { _: `Places and terms ${h} knows.` }; (c.knows_places || []).forEach((p: string, i: number) => (places[i + 1] = p));
    await post(`knows:${h}`, { '1': people, '2': places, _: `What ${h} has come to know — names recognised; absence means perceived by appearance.` });
    await post(`stats:${h}`, { '1': c.capability, '2': 'Condition: hale and whole.', _: `NOMAD sheet for ${h} — capability (CF inputs) and the condition track (intact; the resolver writes wounds here).` });
  }

  // verify shape
  const blocks = ['rules:nomad', `rules:${WORLD}`, `function:${WORLD}`, `frame-spec:${WORLD}`, `spatial:${WORLD}`, `pool:${ROOM}`, ...chars.flatMap((c: any) => [`passport:${c.handle}`, `shell:${c.handle}`, `witnessed:${c.handle}`, `knows:${c.handle}`, `purpose:${c.handle}`, `stats:${c.handle}`])];
  console.log(`\n  SEEDED ${blocks.length} blocks to ${WORLD}.`);

  // 4. validate — a fresh character enters + plays; assert no foreign-world leak
  if (VALIDATE) {
    console.log(`\n${'='.repeat(56)}\nVALIDATE — a fresh character enters ${WORLD} and plays\n${'='.repeat(56)}`);
    const z2j = (shape: Record<string, any>) => { const s: any = zodToJsonSchema(z.object(shape), { $refStrategy: 'none' }); delete s.$schema; return s; };
    const TOOLS = [
      { name: 'pscale_play', description: 'Inhabit a handle in a world: resolves the beach, engages the room (directive + scene inlined), scoops your shell manifest, pins the beach.', input_schema: z2j(playParamsSchema) },
      { name: 'pscale_pool_engage', description: 'Engage a pool. submit=<text> stages your intention; contribution=<text> commits a beat.', input_schema: z2j(poolEngageParamsSchema) },
      { name: 'bsp', description: 'Unified bsp() read/write. Federated: agent_id=beach URL, spindle=address; append=true for accumulators (your witnessed).', input_schema: z2j(bspParamsSchema) },
    ];
    const exec = async (n: string, i: any) => { try { if (n === 'pscale_play') return (await handlePlay(i)).content[0].text; if (n === 'pscale_pool_engage') return (await handlePoolEngage(i)).content[0].text; if (n === 'bsp') return (await handleBsp(i)).content[0].text; return 'unknown'; } catch (e: any) { return `tool error (${n}): ${e?.message}`; } };
    const h = chars[0].handle;
    const thread: any[] = [{ role: 'user', content: `Play ${h} on ${BEACH}. Enter the world, perceive from your character's position, render the lived moment, and act once (submit your intention). You ARE ${h}.` }];
    let said = '';
    for (let step = 0; step < 14; step++) {
      const r = await fetch(`${BASE}/v1/messages`, { method: 'POST', headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: MODEL, max_tokens: 2500, system: INSTRUCTIONS, tools: TOOLS, messages: thread }) });
      const d: any = await r.json(); if (!r.ok) throw new Error(`api ${r.status}: ${JSON.stringify(d).slice(0, 200)}`);
      thread.push({ role: 'assistant', content: d.content });
      const text = (d.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').trim(); if (text) { said += ' ' + text; console.log(`  · ${h}: ${text.replace(/\s+/g, ' ').slice(0, 200)}`); }
      const tus = (d.content || []).filter((c: any) => c.type === 'tool_use'); if (!tus.length) break;
      const res = [];
      for (const tu of tus) { const tag = tu.input?.world ? ` ${tu.input.handle}@${tu.input.world}` : tu.input?.submit !== undefined ? ' submit' : tu.input?.block ? ` ${tu.input.block}` : ''; console.log(`  → ${h} · ${tu.name}${tag}`); res.push({ type: 'tool_result', tool_use_id: tu.id, content: (await exec(tu.name, tu.input)).slice(0, 18000) }); }
      thread.push({ role: 'user', content: res });
    }
    const leak = /thornwood|beaten drum|oakhollow|\bbram\b|greymarch/i.test(said);
    const liquid: any = await (await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(`liquid:pool:${ROOM}`)}`)).json();
    const staged = liquid && Object.keys(liquid).some((k) => /^[1-9]$/.test(k));
    console.log(`\n  · ${h} entered + acted: ${staged ? 'yes (intention staged)' : 'NO'}`);
    console.log(`  · foreign-world leak (thornwood/Bram/etc.): ${leak ? '⚠ YES — character-creation not clean' : 'none ✓'}`);
    console.log(`\n${'═'.repeat(60)}\nWORLD VERDICT: ${staged && !leak ? '✅ PLAYABLE + CLEAN' : '⚠ ISSUES'} — ${WORLD} seeded with a generated town and fresh, world-bound characters.\n${'═'.repeat(60)}`);
  } else {
    console.log(`\n✅ ${WORLD} seeded to ${BEACH}. Play: pscale_play(world='${WORLD}', handle='${chars[0].handle}', room='${ROOM}').`);
  }

  if (KEEP && beachProc) console.log(`\n[seed-world] local beach kept`);
}
main().catch((e) => { console.error('[seed-world] ERROR', e?.stack || e); process.exitCode = 1; }).finally(() => { if (beachProc) beachProc.kill(); });
