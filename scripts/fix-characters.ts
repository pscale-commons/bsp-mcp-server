/**
 * fix-characters.ts — re-create a world's characters grounded in its ACTUAL seeded town,
 * overwriting the existing (unlocked) character blocks. Use when town and characters were
 * generated in separate passes and drifted out of sync (the characters reference places that
 * aren't in the town). Keeps the handles; rewrites passport/shell/witnessed/knows/purpose/stats.
 *   npx tsx scripts/fix-characters.ts [--world thousand-valleys] [--beach <url>]
 *                                     [--handles tessavar,orvel,sable]
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
try { const ef = fileURLToPath(new URL('../.env.rig', import.meta.url)); if (existsSync(ef)) for (const line of readFileSync(ef, 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, ''); } } catch { /* none */ }
const arg = (n: string, d: any) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 && process.argv[i + 1] && !String(process.argv[i + 1]).startsWith('--') ? process.argv[i + 1] : d; };
const WORLD = String(arg('world', 'thousand-valleys'));
const TITLE = WORLD.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const BEACH = String(arg('beach', 'https://thousand-valleys.beach.happyseaurchin.com')).replace(/\/$/, '');
const HANDLES = String(arg('handles', 'tessavar,orvel,sable')).split(',');
const MODEL = String(arg('model', 'claude-sonnet-4-6'));
const KEY = process.env.ANTHROPIC_API_KEY;
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
const j = (o: any) => JSON.stringify(o, null, 1);

async function think(system: string, user: string): Promise<string> {
  const r = await fetch(`${BASE}/v1/messages`, { method: 'POST', headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: MODEL, max_tokens: 8000, system, messages: [{ role: 'user', content: user }] }) });
  const d: any = await r.json(); if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 300)}`); return (d.content || []).map((c: any) => c.text || '').join('').trim();
}
function grabArray(t: string): any[] { let s = t.replace(/```json/gi, '```').replace(/```/g, ''); const a = s.indexOf('['), b = s.lastIndexOf(']'); if (a < 0 || b <= a) throw new Error('no JSON array'); return JSON.parse(s.slice(a, b + 1)); }
async function get(name: string): Promise<any> { const r = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(name)}`); if (!r.ok) return null; const d = await r.json(); return d?.content ?? d; }
async function post(name: string, content: any) {
  const body = { spindle: '', content: JSON.parse(JSON.stringify(content).replaceAll('{{BEACH}}', BEACH)), confirm: true };
  const r = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(name)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) };
}

async function main() {
  if (!KEY) { console.error('Needs ANTHROPIC_API_KEY'); process.exit(1); }
  const spatial = await get(`spatial:${WORLD}`);
  if (!spatial || !Object.keys(spatial).some((k) => /^[1-9]$/.test(k))) { console.error(`spatial:${WORLD} missing/empty — run fix-town first`); process.exit(1); }
  const n = HANDLES.length;
  const sys = `You are creating ${n} fresh player-characters for the world "${WORLD}", grounded in THIS town (given below). Each is NEW here — arriving now or recently. Output ONLY a JSON array of ${n} objects:
{"identity": "<who they are, one sentence>", "capability": "<Character Force — reads ~8 for a competent adult; a peak (near 9) and a weak spot (near 4)>", "wants": "<goal with an undercurrent>", "persona": "<a Character-face system prompt: 'You are X. Speak and act in first person...' — voice + stance, 2-3 sentences; refer to the character as 'you'>", "drive": "<active purpose — what they will ACT on>", "place": "1", "opening": "<2-3 sentences, present tense, of this character AT THE GATHERING HALL (position 1) in THIS town RIGHT NOW — name only places and figures that appear in the map below>", "knows_people": ["<a standing figure named in the map — name — note>"], "knows_places": ["<a place in the map — note>", "..."]}
CRITICAL: every place, figure, and feature you mention MUST appear in the map below. Do NOT invent a tanning yard, a tavern, or a person not in the map. Place ALL ${n} characters AT THE GATHERING HALL (position 1) — they have converged on the common hearth and are co-present, so a player meets the others on arrival; each opening beat is set there, each from their own point of view.`;
  const chars = grabArray(await think(sys, `THE TOWN (spatial:${WORLD}):\n${j(spatial)}\n\nThe ${n} characters carry these handles in order: ${HANDLES.join(', ')}. They are all present at the gathering hall (position 1) right now. Create them, grounded strictly in the town. Output ONLY the JSON array.`));
  if (chars.length < n) { console.error(`got ${chars.length} characters, need ${n}`); process.exit(1); }
  const now = '2026-06-23T12:00:00Z';
  for (let i = 0; i < n; i++) {
    const h = HANDLES[i]; const c = chars[i];
    const loc = `*:{{BEACH}}:spatial:${WORLD}:${c.place || '1'}`;
    await post(`passport:${h}`, { _: c.identity, '1': c.capability, '2': c.wants, '3': `${String(c.opening).split('.')[0]}. Location: ${loc}` });
    await post(`shell:${h}`, { '1': { '1': { '4': c.persona, _: `Character — you ARE ${h}, perceiving from where they stand.` }, _: 'Faces (CADO). Character is the live play face.' }, '3': { '1': `passport:${h}`, '2': `witnessed:${h}`, '3': `knows:${h}`, '4': `purpose:${h}`, '5': `stats:${h}`, _: `Manifest of ${h}'s blocks.` }, _: `${h}'s character shell at ${WORLD}.` });
    await post(`purpose:${h}`, { _: c.drive });
    await post(`witnessed:${h}`, { '1': { '1': h, '2': loc, '3': now, _: c.opening }, _: `${h}'s account at ${TITLE}, beat by beat.` });
    const people: any = { _: `People ${h} can name.` }; (c.knows_people || []).forEach((p: string, k: number) => (people[k + 1] = p));
    const places: any = { _: `Places and terms ${h} knows.` }; (c.knows_places || []).forEach((p: string, k: number) => (places[k + 1] = p));
    await post(`knows:${h}`, { '1': people, '2': places, _: `What ${h} has come to know.` });
    await post(`stats:${h}`, { '1': c.capability, '2': 'Condition: hale and whole.', _: `NOMAD sheet for ${h} — capability and condition (intact; the resolver writes wounds here).` });
    const placeName = (typeof spatial[c.place] === 'string' ? spatial[c.place] : spatial[c.place]?._ || '?');
    console.log(`  ${h} @ ${c.place} (${placeName.slice(0, 40)}): ${c.identity.slice(0, 60)}`);
  }
  // coherence check: do the characters' named places exist in the town?
  const townText = j(spatial).toLowerCase();
  let drift = 0;
  for (let i = 0; i < n; i++) { for (const p of (chars[i].knows_places || [])) { const head = String(p).split(/[—,-]/)[0].trim().toLowerCase(); if (head.length > 4 && !townText.includes(head.slice(0, 8))) { console.log(`    ⚠ ${HANDLES[i]} knows "${head}" — check it's in the town`); drift++; } } }
  console.log(`\n✅ ${n} characters re-grounded in ${WORLD}. ${drift === 0 ? 'No obvious place-drift.' : drift + ' possible drift(s) flagged above.'}`);
  console.log(`Play: pscale_play(world='${WORLD}', handle='${HANDLES[0]}', room='${WORLD}-commons')`);
}
main().catch((e) => { console.error('[fix-characters] ERROR', e?.stack || e); process.exitCode = 1; });
