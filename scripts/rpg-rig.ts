/**
 * rpg-rig.ts — FAITHFUL Thornwood test rig (the substrate AND the rules).
 *
 * Unlike scripts/thornwood-rig.mjs (a central orchestrator that tests the RULES
 * in isolation), this rig replaces ONLY the human player. Each character is a
 * real player-client driven through the EXACT production loop — the real
 * `pscale_pool_engage` primitive (read envelope → soft-act → submit → liquid
 * window → in-loop resolve with the atomic single-resolution claim) against a
 * local beach that IS the default, so the apex-default leak cannot occur. One
 * run therefore exercises the SUBSTRATE timing machinery (window-open stamp,
 * fixed dice, the claim, the envelope) AND the RPG rules together.
 *
 *   tsx scripts/rpg-rig.ts [--turns N] [--timing concurrent|spread]
 *                          [--window-ms M] [--model <id>] [--keep]
 *
 * TIMING is the point. --window-ms sets how long a window gathers before it
 * closes (small for fast tests). --timing concurrent = all seats submit inside
 * one window (the medium resolves three intentions at once); --timing spread =
 * one seat per window (a string of solo resolutions). Vary these to watch how
 * the pool/medium handle simultaneity, when resolutions fire, and how each
 * private account is narrated.
 *
 * LLM seats: real Claude when ANTHROPIC_API_KEY is set (honors ANTHROPIC_BASE_URL),
 * else a deterministic stub so the whole loop verifies with no key.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { handlePoolEngage, windowOpenTs, collectContributions, windowDicePerAuthor, poolEngageParamsSchema } from '../src/tools/pool.js';
import { handlePlay, playParamsSchema } from '../src/tools/play.js';
import { handleBsp, bspParamsSchema } from '../src/tools/bsp.js';
import { INSTRUCTIONS } from '../src/server.js';
import { loadBlock, appendToBeach } from '../src/db.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Load .env.rig (gitignored — NEVER committed) so a stored ANTHROPIC_API_KEY is
// reused across runs/sessions without re-exporting it each time. Existing env
// wins, so an explicit export still overrides the file.
try {
  const ef = fileURLToPath(new URL('../.env.rig', import.meta.url));
  if (existsSync(ef)) for (const line of readFileSync(ef, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch { /* no .env.rig — falls back to the stub, fine */ }

// ── config ──
const arg = (n: string, d: any) => { const i = process.argv.indexOf(`--${n}`); if (i < 0) return d; const v = process.argv[i + 1]; return (v && !v.startsWith('--')) ? v : true; };
const TURNS = parseInt(arg('turns', '3'), 10);
const TIMING = String(arg('timing', 'concurrent'));   // concurrent | spread | random
const WINDOW_MS = parseInt(arg('window-ms', '1500'), 10);
const CLIENT = String(arg('client', 'harness'));      // harness (rig code judges the window) | bare (the LLM judges it) | agent (HNITL≡HITL: the LLM makes its OWN bsp-mcp tool calls)
const GAP_MS = parseInt(arg('gap', '3000'), 10);      // --client agent: ms between rounds (≥ the beach window span = full fidelity; smaller = faster iteration)
const MAX_DELAY = parseInt(arg('max-delay', '1200'), 10); // --timing random: each seat waits 0..MAX_DELAY before it acts
const MODEL = String(arg('model', 'claude-sonnet-4-6'));
const JUDGE_MODEL = String(arg('judge-model', 'claude-sonnet-4-6')); // observer held constant so a model-vs-model play comparison is fair
const APERTURE = String(arg('aperture', 'composed')); // composed (rig builds the C aperture in code) | directive (raw blocks; the DIRECTIVE does the seating/typing — the bare-claude path)
const KEEP = !!arg('keep', false);
const BEACH_REPO = process.env.BEACH_REPO || fileURLToPath(new URL('../../pscale-beach', import.meta.url));
const PORT = parseInt(process.env.RIG_PORT || '8799', 10);
const BEACH = `http://localhost:${PORT}`;
const ROOM = String(arg('room', 'beaten-drum-main'));
const SECRET = String(arg('secret', 'thorn142'));
// --pack <name|path>: which cartridge to seed (a bare name resolves under <beach-repo>/packs/).
// Default thornwood; pass --pack thousand-valleys --room thousand-valleys-commons --secret valleys142
// --chars orvel,tessavar,sable to rig a different world.
const PACK = (() => { const p = String(arg('pack', 'thornwood')); return p.includes('/') ? p : join(BEACH_REPO, 'packs', p); })();
const CHARS = String(arg('chars', 'cyrus,anya,fenn')).split(',').map((s) => s.trim()).filter(Boolean);
// --client agent MOVE scenario (the NHITL convergence probe): on round --move-turn,
// tell one handle to LEAVE for another location and verify — from substrate truth —
// whether the LLM actually relocates (writes passport:3) or merely narrates walking.
const MOVE = String(arg('move', ''));            // handle to send; '' disables the scenario
const MOVE_TO = String(arg('to', ''));           // destination spatial addr, e.g. "1"
const MOVE_TURN = parseInt(arg('move-turn', '2'), 10);
const MOVE_PLACE = String(arg('to-place', ''));  // human phrase for the destination (optional)

// ── trace capture — drives the three filmstrip views (dataflow / threads / observer) ──
const TRACE: any[] = [];
let SEQ = 0, CURRENT_ROUND = 0;
const trace = (e: Record<string, any>) => { TRACE.push({ seq: SEQ++, round: CURRENT_ROUND, ...e }); };

// ── local beach (child process; its own node_modules) ──
let beachProc: ChildProcess | null = null;
async function spawnBeach(dir: string): Promise<void> {
  beachProc = spawn('node', [join(BEACH_REPO, 'scripts/local-beach.mjs'), '--dir', dir, '--port', String(PORT), '--origin', `localhost:${PORT}`], { stdio: ['ignore', 'ignore', 'ignore'] });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BEACH}/.well-known/pscale-beach`)).ok) return; } catch { /* not up */ }
    await sleep(150);
  }
  throw new Error('local beach did not come up');
}
// Seed the cartridge fully locked under the single rig SECRET. Scan the pack for
// every lock.secret_env it declares (TV_*, VALLEYS_GM, THORN_*, whatever the world
// uses) and set each to SECRET, so the LLM — handed that one passphrase — can write
// any of its own blocks. Generalises the old hardcoded THORN_*/VALLEYS_GM list so the
// rig drives ANY cartridge, not just thornwood.
async function packSecretEnvs(): Promise<string[]> {
  const names = new Set<string>();
  for (const sub of ['definition', 'initial']) {
    let files: string[] = [];
    try { files = await fs.readdir(join(PACK, sub)); } catch { continue; }
    for (const f of files.filter((x) => x.endsWith('.json'))) {
      try { const blk = JSON.parse(await fs.readFile(join(PACK, sub, f), 'utf8')); if (blk?.lock?.secret_env) names.add(String(blk.lock.secret_env)); } catch { /* skip unreadable */ }
    }
  }
  return [...names];
}
async function seedPack(): Promise<void> {
  const env: Record<string, string | undefined> = { ...process.env };
  for (const name of await packSecretEnvs()) env[name] = SECRET;
  await new Promise<void>((resolve, reject) => {
    const p = spawn('node', [join(BEACH_REPO, 'scripts/pack-seed.mjs'), '--beach', BEACH, '--pack', PACK], { stdio: ['ignore', 'ignore', 'ignore'], env });
    p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`pack-seed exit ${c}`))));
  });
}

// ── helpers ──
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (n: number) => Math.floor(Math.random() * Math.max(0, n));
const shuffle = <T>(a: T[]): T[] => a.map((v) => [Math.random(), v] as [number, T]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
const j = (o: any) => JSON.stringify(o, null, 1);
const engage = async (args: Record<string, any>): Promise<string> => (await handlePoolEngage({ pool_url: BEACH, pool_name: ROOM, ...args } as any)).content[0].text;
const block = async (name: string): Promise<any> => (await loadBlock(BEACH, name))?.block ?? null;
// Pools present at the local beach (agent mode is multi-pool: pool:1, pool:6, … —
// location-derived, not the single ROOM). Excludes the liquid mirrors.
async function listBeachPools(): Promise<string[]> {
  try {
    const res = await fetch(`${BEACH}/.well-known/pscale-beach`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const j: any = await res.json();
    return (Array.isArray(j?.blocks) ? j.blocks : []).filter((b: string) => b.startsWith('pool:') && !b.startsWith('liquid:'));
  } catch { return []; }
}

// ── resolve the Character soft aperture (frame-spec:thornwood 1.1) for handle h ──
// Seats the character at passport:3, gives the place at that location (with its
// authored standing figures), the character's own witnessed/knows, the place
// rules, and the live co-present cast TYPED apart from the authored figures. The
// seat (1,1,1) and typing (1,1,3) prose are pulled from the substrate frame, so
// editing frame-spec changes what the soft LLM is handed — the frame is resolved,
// not hardcoded.
const locOf = (passport: any): string => (String(passport?.['3'] ?? '').match(/spatial:thornwood:(\d+)/) || [])[1] || '111';
// World-agnostic location read (play.ts:passportLocation form) — the agent/move path
// is not thornwood-bound, so match any world's spatial address.
const locOfAny = (passport: any): string | null => (String(passport?.['3'] ?? '').match(/spatial:[\w-]+:(\d+)/) || [])[1] ?? null;
function walkSpatial(node: any, addr: string): any { let n = node; for (const d of String(addr).split('')) { if (n && typeof n === 'object') n = n[d]; else return null; } return n ?? null; }
async function cAperture(h: string): Promise<{ text: string; reads: string[] }> {
  const passport = await block(`passport:${h}`);
  const locAddr = locOf(passport);
  const place = walkSpatial(await block('spatial:thornwood'), locAddr);
  const witnessed = await block(`witnessed:${h}`);
  const knows = await block(`knows:${h}`);
  let others = 0;
  for (const o of CHARS) { if (o === h) continue; if (locOf(await block(`passport:${o}`)) === locAddr) others++; }
  const text = [
    `POSITION (your seat) — ${frameC?.['1'] ?? 'you perceive from passport:3.'}`,
    `WHERE YOU ARE — spatial:thornwood:${locAddr}, the place and the standing figures authored into it:\n${j(place)}`,
    `YOUR CAPABILITY — passport:${h}:\n${j(passport)}`,
    `YOUR ACCOUNT SO FAR — witnessed:${h}:\n${j(witnessed)}`,
    `NAMES YOU KNOW — knows:${h}:\n${j(knows)}`,
    `PERCEPTION PHYSICS — rules:thornwood:\n${placeRules}`,
    `LIVE CHARACTERS CO-PRESENT — ${others} other player-character(s) share your position; each is a separate live agency, perceived by appearance until you earn a name, and NEVER one of the authored standing figures above.`,
    `HOLD THE KINDS APART — ${frameC?.['3'] ?? 'you, the authored standing figures, and the live co-present characters are three different things.'}`,
  ].join('\n\n');
  return { text, reads: [`passport:${h}`, `spatial:thornwood:${locAddr}`, `witnessed:${h}`, `knows:${h}`, 'rules:thornwood', 'frame-spec:thornwood'] };
}

// ── raw blocks (the bare-claude condition): the blocks the directive tells the soft to read,
// with NO seat/typing pre-framing and NO pre-derived co-present list. The directive (system
// prompt = function:thornwood:1, now carrying position-origin + typing) must do that work
// itself — exactly as a bare claude.ai client does. Tests the DIRECTIVE, not the composer. ──
async function rawBlocks(h: string): Promise<{ text: string; reads: string[] }> {
  const passport = await block(`passport:${h}`);
  const locAddr = locOf(passport);
  const place = walkSpatial(await block('spatial:thornwood'), locAddr);
  const witnessed = await block(`witnessed:${h}`);
  const knows = await block(`knows:${h}`);
  const text = [
    `passport:${h} (capability + location):\n${j(passport)}`,
    `spatial:thornwood:${locAddr} (the place at your location):\n${j(place)}`,
    `rules:thornwood (perception physics):\n${placeRules}`,
    `witnessed:${h} (your account so far):\n${j(witnessed)}`,
    `knows:${h} (names you can recognise):\n${j(knows)}`,
  ].join('\n\n');
  return { text, reads: [`passport:${h}`, `spatial:thornwood:${locAddr}`, 'rules:thornwood', `witnessed:${h}`, `knows:${h}`] };
}
const aperture = (h: string) => (APERTURE === 'directive' ? rawBlocks(h) : cAperture(h));

// ── Character shell — the role-shell an LLM inhabits (block-conventions:2, specialised
// to a character). The Character face (shell:<h> 1.1) is the persona/voice/stance; it
// composes into the SYSTEM prompt as standing identity. purpose:<h> is the active DRIVE;
// it goes in the USER prompt as the current objective. Together they make an autonomous
// seat play WITH drive instead of hedging (the Agency-3/5 fix). Empty when no shell is
// seeded, so the rig still runs against a shell-less cartridge. ──
async function personaOf(h: string): Promise<string> {
  const face = (await block(`shell:${h}`))?.['1']?.['1'];
  const p = face && (face['4'] ?? face['_']);
  return typeof p === 'string' ? p : '';
}
async function driveOf(h: string): Promise<string> {
  const purpose = await block(`purpose:${h}`);
  const d = purpose && typeof purpose === 'object' ? purpose._ : purpose;
  return typeof d === 'string' ? d : '';
}
async function charSystem(h: string, baseDir: string): Promise<string> {
  const persona = await personaOf(h);
  return persona ? `${baseDir}\n\nYOUR CHARACTER (the shell you inhabit — be this person):\n${persona}` : baseDir;
}

// ── the LLM seat: real Claude if keyed, else deterministic stub ──
const KEY = process.env.ANTHROPIC_API_KEY;
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
async function think(label: string, system: string, user: string): Promise<string> {
  if (!KEY) return stub(label, user);
  const r = await fetch(`${BASE}/v1/messages`, { method: 'POST', headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: label === 'judge' ? JUDGE_MODEL : MODEL, max_tokens: 2000, system, messages: [{ role: 'user', content: user }] }) });
  const d: any = await r.json();
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 200)}`);
  return (d.content || []).map((c: any) => c.text || '').join('').trim();
}
function stub(label: string, user: string): string {
  const who = (user.match(/\[YOU ARE (\w+)\]/) || [])[1] || '?';
  if (label === 'act') return `${who} makes one careful, in-character move. [stub act]`;
  if (label === 'resolve') return `at the hearth the present company take each other's measure; a thread opens, nothing breaks. [stub skeleton]`;
  if (label === 'judge') return `(stub observer) CONSISTENCY 3 · PERSISTENCE 2 · PERCEPTION-LIMITS 5 · AGENCY 2. OVERALL: faithful loop sound, narrative is stub. BIGGEST WEAKNESS: run with a real key.`;
  if (label === 'bare') return `RESOLVE: NONE\nSUBMIT: ${who} makes one careful move (stub bare — window-judgment needs a real key).`;
  return `You take in what just passed and hold your place. [stub render · ${who}]`;
}

// ── directives, read from the substrate (rules-as-blocks) ──
let softDir = '', resolveDir = '', placeRules = '', nomad = '', fnWhole = '';
let frameC: any = null; // frame-spec:thornwood C soft aperture (1.1) — seat + typing prose, pulled from the substrate
const markers: Record<string, number> = Object.fromEntries(CHARS.map((h) => [h, 0]));

// 1. CLEAR ANY DUE WINDOW — the in-loop resolver (real claim).
async function clearDueWindow(toucher: string): Promise<string> {
  const liq = await block(`liquid:pool:${ROOM}`);
  const openTs = windowOpenTs(liq);
  if (!openTs) return 'no-window';
  const live = collectContributions(liq, 0).contributions.filter((c) => c.text !== '');
  if (!live.length) return 'already-cleared';
  if (Date.now() - Date.parse(openTs) < WINDOW_MS) return 'still-open';

  const perActor = windowDicePerAuthor(`pool:${ROOM}`, liq, live);
  const caps: string[] = [];
  for (const c of live) { const p = await block(`passport:${c.agent_id}`); caps.push(`- ${c.agent_id}: ${p?.['1'] ?? ''}`); }
  const diceLines = perActor.map((d) => `- ${d.agent_id}: positive ${d.pos}, negative ${d.neg}, luck ${d.luck > 0 ? '+' : ''}${d.luck}`).join('\n');
  const user = `[RESOLVE WINDOW opened ${openTs}]\n\nINTENTIONS IN THE WINDOW:\n${live.map((c) => `- ${c.agent_id}: ${c.text}`).join('\n')}\n\nCAPABILITY (Character Force), per actor:\n${caps.join('\n')}\n\nPLACE RULES (Situation Force):\n${placeRules}\n\nPER-ACTOR DICE (each actor's own fixed luck):\n${diceLines}\n\nSYSTEM:\n${nomad}\n\nFor EACH acting character compute their own band (CF + SF + their luck − difficulty); then write ONE terse PUBLIC event-skeleton weaving the separate outcomes — actors by handle.`;
  const skeleton = await think('resolve', resolveDir, user);
  const ack = await engage({ agent_id: toucher, contribution: skeleton, resolves_window: openTs, since_position: 0 });
  // success returns the envelope with "committed: slot N"; a refused claim returns
  // only a short stand-down. (Don't regex "already resolved" — the inlined directive
  // text contains that phrase, so it false-positives on a successful resolve.)
  const claimed = /committed: slot/.test(ack);
  trace({ phase: 'resolve', actor: toucher, reads: [`liquid:pool:${ROOM}`, ...live.map((c) => `passport:${c.agent_id}`), 'rules:nomad', 'rules:thornwood'], dice: perActor, prompt: user, response: skeleton, writes: claimed ? [`pool:${ROOM} (commit)`] : ['(claim refused)'], claim: claimed ? 'resolved' : 'stood-down' });
  if (!claimed) return 'stood-down';
  for (const c of live) if (c.agent_id) await engage({ agent_id: c.agent_id, submit: '' });   // empty each resolved slot
  const luckSummary = perActor.map((d) => `${d.agent_id} ${d.luck > 0 ? '+' : ''}${d.luck}`).join(', ');
  console.log(`\n  >>> [${toucher} resolved a ${live.length}-intention window · ${luckSummary}] >>>\n  ${skeleton.replace(/\n/g, '\n  ')}`);
  return 'resolved';
}

// 2. PERCEIVE new public events through OWN knowledge → journal to OWN spine.
async function perceiveAndJournal(h: string): Promise<void> {
  const pool = await block(`pool:${ROOM}`);
  const fresh = collectContributions(pool, markers[h]).contributions;
  if (!fresh.length) return;
  const ap = await aperture(h);
  const witnessed = await block(`witnessed:${h}`);
  const user = `[YOU ARE ${h}]\n\n${ap.text}\n\nNEW PUBLIC EVENTS since you last looked (handle-tagged — translate each to a name you have earned, otherwise appearance):\n${fresh.map((c) => `- ${c.text}`).join('\n')}\n\nRender these as ${h}'s OWN private account — second person, present tense, perceived FROM your position; names only as ${h} has earned them. One short paragraph.`;
  const beat = await think('render', await charSystem(h, softDir), user);
  const loc = witnessed?.['1']?.['2'] ?? `*:${BEACH}:spatial:thornwood:111`;
  await appendToBeach(BEACH, `witnessed:${h}`, { _: beat, '1': h, '2': loc, '3': new Date().toISOString() } as any, SECRET);
  markers[h] = fresh[fresh.length - 1].position;
  trace({ phase: 'perceive', actor: h, reads: ap.reads.concat([`pool:${ROOM}`]), writes: [`witnessed:${h} (append)`], prompt: user, response: beat });
  console.log(`  · ${h} journaled: ${beat.slice(0, 140)}`);
}

// 4. ACT — read the real envelope (directive + window), produce + SUBMIT an intention.
async function act(h: string): Promise<void> {
  const ap = await aperture(h);
  const drive = await driveOf(h);
  const env = await engage({ agent_id: h, since_position: markers[h], with_liquid: true });
  const driveLine = drive ? `\n\nYOUR DRIVE RIGHT NOW (purpose:${h}): ${drive}` : '';
  const user = `[YOU ARE ${h}]${driveLine}\n\n${ap.text}\n\nTHE ROOM RIGHT NOW (the live window + operating directive):\n${env}\n\nWhat does ${h} do, perceiving from your position and acting on your drive? The action only, in ${h}'s voice.`;
  const intention = await think('act', await charSystem(h, softDir), user);
  await engage({ agent_id: h, submit: intention, face: 'character', with_liquid: true });
  trace({ phase: 'act', actor: h, reads: ap.reads.concat(['pool_engage envelope']), writes: [`liquid:pool:${ROOM} (submit)`], prompt: user, response: intention, envelope: env });
  console.log(`  — ${h} submits: ${intention.slice(0, 120)}`);
}

// BARE client — the LLM (not the rig) judges window-closure and decides what to do,
// from its directive + envelope, exactly as a bare app-LLM would. This is the
// fragility test: the rig flags PREMATURE resolves (LLM resolved a still-open
// window) and NO-WINDOW resolves, and the substrate's claim catches double-resolves.
async function bareDecide(h: string): Promise<void> {
  const witnessed = await block(`witnessed:${h}`);
  const knows = await block(`knows:${h}`);
  const passport = await block(`passport:${h}`);
  const env = await engage({ agent_id: h, since_position: markers[h], with_liquid: true });
  const drive = await driveOf(h);
  const now = new Date().toISOString();
  const driveLine = drive ? `\n\nYOUR DRIVE RIGHT NOW (purpose:${h}): ${drive}` : '';
  const user = `[YOU ARE ${h}]${driveLine}\n\nYOUR ACCOUNT SO FAR:\n${j(witnessed)}\n\nNAMES YOU KNOW:\n${j(knows)}\n\nYOUR CAPABILITY & LOCATION:\n${j(passport)}\n\nTHE ROOM RIGHT NOW (your engage envelope — it shows the live window: who is here and what each is doing right now, plus the window's open-stamp and the fixed per-actor dice if a window is live):\n${env}\n\nFollow your operating directive (your system prompt) EXACTLY — it tells you when a window is ready to resolve and what to submit. The current time is ${now}; the room's span is ${WINDOW_MS} ms (the lone-intention case only — co-presence completes a window at once). Respond in EXACTLY this format, nothing else:\nRESOLVE: <the one public event-skeleton, by handle, IF your directive says a window is ready to resolve; otherwise the single word NONE>\nSUBMIT: <your character's intention for the window, in your voice; or NONE if you only resolved>`;
  const out = await think('bare', await charSystem(h, fnWhole), user);
  const resolveTxt = (out.match(/RESOLVE:\s*([\s\S]*?)(?:\n\s*SUBMIT:|$)/i)?.[1] || '').trim();
  const submitTxt = (out.match(/SUBMIT:\s*([\s\S]*)$/i)?.[1] || '').trim();

  // ACT then RESOLVE — the directive order (step 4: submit, THEN resolve the now-
  // complete window). Apply the submission FIRST so the actor's own intention is in
  // the window before co-presence-close is judged; applying resolve first would let a
  // close fire on a window that does not yet hold the resolver's own act.
  if (submitTxt && !/^none\b/i.test(submitTxt)) {
    await engage({ agent_id: h, submit: submitTxt, face: 'character', with_liquid: true });
    console.log(`  — ${h} (bare) submits: ${submitTxt.slice(0, 100)}`);
  }
  if (resolveTxt && !/^none\b/i.test(resolveTxt)) {
    const liq = await block(`liquid:pool:${ROOM}`);
    const openTs = windowOpenTs(liq);
    if (openTs) {
      const live = collectContributions(liq, 0).contributions.filter((c) => c.text !== '');
      const elapsed = Date.now() - Date.parse(openTs);
      const ack = await engage({ agent_id: h, contribution: resolveTxt, resolves_window: openTs, since_position: 0 });
      const ok = /committed: slot/.test(ack);
      if (ok) for (const c of live) if (c.agent_id) await engage({ agent_id: c.agent_id, submit: '' });
      // Co-presence-close: a ≥2-intention resolve is CORRECT however little time has
      // passed; only a LONE-intention resolve before the span is the premature-solo bug.
      const prematureSolo = live.length < 2 && elapsed < WINDOW_MS;
      console.log(`  >>> [${h} (bare) ${ok ? 'RESOLVED' : 'tried, STOOD DOWN'}${ok ? ` · ${live.length}-intention` : ''}${prematureSolo ? ` · ⚠ PREMATURE SOLO (1 intention, only ${elapsed}ms of ${WINDOW_MS})` : ''}] ${resolveTxt.slice(0, 90)}`);
    } else {
      console.log(`  !!! [${h} (bare) tried to resolve but there is NO live window]`);
    }
  }
}

// ── Agent client (--client agent) — HNITL ≡ HITL ──────────────────────────────
// The character-LLM is handed the REAL bsp-mcp tools and makes its OWN calls:
// pscale_play to enter + scoop its shell manifest, pscale_pool_engage to perceive
// the live window + submit + resolve, bsp to read/write blocks — exactly as a
// claude.ai player's LLM does. The rig only EXECUTES the calls against the local
// beach; it composes nothing and scripts nothing. The sole difference from HITL is
// that the LLM supplies the intent (from its purpose) where a human would type it.
// This is the configuration that catches the LLM's-own-dataflow bugs (does it read
// the live window? pass pool_url? re-read witnessed?) that a scripted rig hides.
const z2j = (shape: Record<string, any>) => { const s: any = zodToJsonSchema(z.object(shape), { $refStrategy: 'none' }); delete s.$schema; return s; };
const AGENT_TOOLS = [
  { name: 'pscale_play', description: "Inhabit a handle in a world in one call: resolves the world to its beach, engages the room (the operating directive AND the live scene arrive inlined), scoops your own context by walking your shell's manifest, and PINS the beach so every later call targets it.", input_schema: z2j(playParamsSchema) },
  { name: 'pscale_pool_engage', description: "Engage a pool. Read (no submit/contribution) returns the operating directive + the live window + new events. submit=<text> STAGES your intention to the room's liquid window — your PRESENCE. contribution=<skeleton> + resolves_window=<open-stamp> COMMITS one resolution. with_liquid shows co-present pending intentions.", input_schema: z2j(poolEngageParamsSchema) },
  { name: 'bsp', description: "The unified bsp() read/write. Read when content omitted; write when content provided. For federated blocks (witnessed/knows/spatial/passport) agent_id is the beach URL and spindle is the address; append=true appends to an accumulator such as your own history.", input_schema: z2j(bspParamsSchema) },
];
const AGENT_SYSTEM = INSTRUCTIONS;
async function executeTool(name: string, input: any): Promise<string> {
  try {
    if (name === 'pscale_play') return (await handlePlay(input)).content[0].text;
    if (name === 'pscale_pool_engage') return (await handlePoolEngage(input)).content[0].text;
    if (name === 'bsp') return (await handleBsp(input)).content[0].text;
    return `error: unknown tool "${name}"`;
  } catch (e: any) { return `tool error (${name}): ${e?.message ?? String(e)}`; }
}
async function agentApi(messages: any[]): Promise<any> {
  if (!KEY) throw new Error('--client agent requires ANTHROPIC_API_KEY — the agent must make real tool calls; the stub cannot.');
  const r = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 3000, system: AGENT_SYSTEM, tools: AGENT_TOOLS, messages }),
  });
  const d: any = await r.json();
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 400)}`);
  return d;
}
// One turn = drive the LLM's tool-use loop until it stops calling tools. The thread
// PERSISTS across turns (a real conversation, exactly like a claude.ai session).
async function agentTurn(h: string, thread: any[]): Promise<void> {
  for (let step = 0; step < 16; step++) {
    const resp = await agentApi(thread);
    thread.push({ role: 'assistant', content: resp.content });
    const text = (resp.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').trim();
    if (text) { console.log(`  · ${h}: ${text.replace(/\s+/g, ' ').slice(0, 220)}`); trace({ phase: 'agent-say', actor: h, response: text }); }
    const toolUses = (resp.content || []).filter((c: any) => c.type === 'tool_use');
    for (const tu of toolUses) {
      const i = tu.input || {};
      const tag = i.submit !== undefined ? ` submit="${String(i.submit).slice(0, 60)}…"`
        : i.contribution !== undefined ? ` RESOLVE/commit` : i.block ? ` ${i.block}${i.spindle != null ? ':' + i.spindle : ''}`
        : i.world ? ` ${i.handle}@${i.world}` : '';
      console.log(`  → ${h} · ${tu.name}${tag}`);
    }
    if (toolUses.length === 0) return;  // end of turn
    const results: any[] = [];
    for (const tu of toolUses) {
      const out = await executeTool(tu.name, tu.input);
      // Trace every real tool call — agent mode previously logged 1 event/run,
      // leaving the filmstrip views blind in exactly the HNITL≡HITL configuration.
      trace({ phase: 'agent-tool', actor: h, tool: tu.name, input: JSON.stringify(tu.input ?? {}).slice(0, 2000), response: out.slice(0, 4000) });
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: out.slice(0, 20000) });
    }
    thread.push({ role: 'user', content: results });
  }
  console.log(`  ! ${h}: hit the tool-step cap (16) this turn`);
}
// Convergence oracle for the MOVE scenario — substrate truth, not narration. After the
// move round, read the mover's passport:3: if it now names the destination addr the LLM
// performed the relocation; if unchanged it only narrated. Then perceive from the mover
// to show the destination's co-present cast (the pool it converged into).
async function reportMove(fromAddr: string | null): Promise<void> {
  const nowAddr = locOfAny(await block(`passport:${MOVE}`));
  const moved = nowAddr === MOVE_TO;
  console.log(`\n${'*'.repeat(56)}`);
  console.log(`MOVE CHECK — ${MOVE}: passport:3 addr ${fromAddr} → ${nowAddr}`);
  console.log(moved
    ? `  ✓ MOVED — the LLM wrote passport:3; relocation performed (move-teach induced the write)`
    : `  ✗ NOT MOVED — passport:3 unchanged; the LLM narrated without relocating (sharpen move-teach wording)`);
  try {
    const env = (await handlePlay({ world: BEACH, handle: MOVE } as any)).content[0].text;
    const here = env.split('\n').filter((l) => l.startsWith('— ')).map((l) => l.slice(2).trim());
    console.log(`  ${MOVE} now perceives ${here.length} co-present at addr ${nowAddr}:`);
    for (const c of here) console.log(`    · ${c.slice(0, 92)}`);
  } catch (e: any) { console.log(`  (post-move perceive failed: ${e?.message ?? e})`); }
  console.log('*'.repeat(56));
}

// Post-run move audit — EVERY seat, not only the instructed probe target. The P0
// forensic (2026-07-03) caught a SPONTANEOUS mover writing a wrong address that the
// single-target oracle never looked at. Substrate truth only: start addr → end addr,
// whether the world names a place there, whether a room pool exists there.
async function auditMoves(startLocs: Record<string, string | null>): Promise<void> {
  let spatialName: string | null = null;
  try {
    const res = await fetch(`${BEACH}/.well-known/pscale-beach`, { headers: { Accept: 'application/json' } });
    const j: any = res.ok ? await res.json() : null;
    spatialName = (Array.isArray(j?.blocks) ? j.blocks : []).find((b: string) => b.startsWith('spatial:')) ?? null;
  } catch { /* index unreachable — skip the place check */ }
  const spatial = spatialName ? await block(spatialName) : null;
  const pools = await listBeachPools();
  console.log(`\n${'*'.repeat(56)}\nMOVE AUDIT — substrate truth for every seat`);
  for (const h of CHARS) {
    const end = locOfAny(await block(`passport:${h}`));
    if (end === startLocs[h]) { console.log(`  · ${h}: stayed at addr ${end}`); continue; }
    const place = spatial && end ? walkSpatial(spatial, end) : null;
    const pooled = end ? pools.includes(`pool:${end}`) : false;
    const warns = `${place ? '' : ' · ⚠ no place named at that address'}${pooled || pools.length <= 1 ? '' : ' · ⚠ no room pool at destination'}`;
    console.log(`  → ${h}: MOVED addr ${startLocs[h]} → ${end}${warns}`);
  }
  console.log('*'.repeat(56));
}

async function runAgentRounds(): Promise<void> {
  const threads: Record<string, any[]> = {};
  for (const h of CHARS) threads[h] = [{ role: 'user', content: `Play ${h} on the beach at ${BEACH}. Enter by calling pscale_play with world="${BEACH}" (this EXACT full URL — never a bare world name, which would target a different beach) and handle="${h}"; your passphrase for ${h} is "${SECRET}". Then take ${h}'s turn: perceive from your character's position, render the lived moment, and act once (submit your intention). You ARE ${h} — decide on ${h}'s behalf.` }];
  if (MOVE && !CHARS.includes(MOVE)) console.log(`[rig] ⚠ --move ${MOVE} is not in --chars (${CHARS.join(',')}); it will never take a turn.`);
  const moveFrom = MOVE ? locOfAny(await block(`passport:${MOVE}`)) : null;
  if (MOVE) console.log(`[rig] MOVE scenario armed: ${MOVE} at addr ${moveFrom} → on round ${MOVE_TURN} will be told to go to addr ${MOVE_TO}${MOVE_PLACE ? ` (${MOVE_PLACE})` : ''}.`);
  for (let turn = 1; turn <= TURNS; turn++) {
    CURRENT_ROUND = turn;
    console.log(`\n${'='.repeat(56)}\nROUND ${turn} · agent client (the LLM drives its own bsp-mcp tools)\n${'='.repeat(56)}`);
    for (const h of shuffle([...CHARS])) {
      if (turn > 1) {
        const moving = h === MOVE && turn === MOVE_TURN;
        const dest = MOVE_PLACE || `spatial address ${MOVE_TO} in this world`;
        threads[h].push({ role: 'user', content: moving
          ? `Take ${h}'s next turn. ${h} has taken the measure of this place and now CHOOSES TO LEAVE — to go to ${dest} (spatial address ${MOVE_TO}). Make the move exactly as your operating directive instructs, then continue ${h}'s play from where they arrive.`
          : `Take ${h}'s next turn — perceive what has changed in the room and act once.` });
      }
      await agentTurn(h, threads[h]);
    }
    if (MOVE && turn === MOVE_TURN) await reportMove(moveFrom);
    if (turn < TURNS) await sleep(GAP_MS);
  }
}

async function main() {
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'rpg-rig-'));
  await spawnBeach(dir); await seedPack();
  const fn = await block('function:thornwood');
  softDir = fn?.['1'] ?? ''; resolveDir = fn?.['2'] ?? '';
  fnWhole = [fn?.['_'], fn?.['1'], fn?.['2'], fn?.['3']].filter((x) => typeof x === 'string').join('\n\n');
  placeRules = j(await block('rules:thornwood')); nomad = j(await block('rules:nomad'));
  frameC = (await block('frame-spec:thornwood'))?.['1']?.['1'] ?? null;   // resolve the C soft aperture from the substrate
  const cfg = CLIENT === 'agent' ? `gap=${GAP_MS}ms` : `timing=${TIMING} · aperture=${APERTURE} · window=${WINDOW_MS}ms`;
  console.log(`[rig] local beach ${BEACH} · seeded · model=${KEY ? MODEL : 'STUB'} · client=${CLIENT} · ${cfg} · turns=${TURNS}\n`);

  if (CLIENT === 'agent') {
   const startLocs: Record<string, string | null> = {};
   for (const h of CHARS) startLocs[h] = locOfAny(await block(`passport:${h}`));
   await runAgentRounds();
   await auditMoves(startLocs);
  } else {
  for (let turn = 1; turn <= TURNS; turn++) {
    CURRENT_ROUND = turn;
    console.log(`\n${'='.repeat(56)}\nROUND ${turn} · ${CLIENT} client · ${TIMING} timing\n${'='.repeat(56)}`);
    const order = TIMING === 'spread' ? [CHARS[(turn - 1) % CHARS.length]] : shuffle([...CHARS]);
    for (const h of order) {
      if (TIMING === 'random') await sleep(rand(MAX_DELAY));
      await perceiveAndJournal(h);
      if (CLIENT === 'bare') await bareDecide(h);
      else await act(h);
    }
    if (CLIENT === 'harness') {
      await sleep(WINDOW_MS + 250);                          // wait for close, then a rotating toucher resolves
      await clearDueWindow(CHARS[(turn - 1) % CHARS.length]);
    } else if (TIMING === 'concurrent') {
      await sleep(WINDOW_MS + 250);                          // bare+concurrent: let the window close so a seat next round judges it
    }
  }
  console.log(`\n${'#'.repeat(56)}\nFINAL — each meets the last beat, then the observer judges\n${'#'.repeat(56)}`);
  CURRENT_ROUND = TURNS + 1;
  for (const h of CHARS) await perceiveAndJournal(h);
  }

  const digest: string[] = [];
  for (const h of CHARS) {
    const w = await block(`witnessed:${h}`);
    if (!w || typeof w !== 'object') continue;                         // guard: char never journaled / block missing
    // Floor-aware read (the same reader the seats use) — a hand-rolled key scan
    // goes blank the moment an accumulator supernests (P0 forensic, 2026-07-03).
    const lines = collectContributions(w, 0).contributions.map((c) => c.text).filter(Boolean);
    digest.push(`=== witnessed:${h} (private) ===\n${lines.join('\n')}`);
  }
  // Public record — agent mode is multi-pool (location-derived); gather whatever pools
  // the beach holds rather than the single thornwood ROOM (which is null in other worlds).
  const poolNames = CLIENT === 'agent' ? await listBeachPools() : [`pool:${ROOM}`];
  for (const pn of poolNames) {
    const pool = await block(pn);
    if (!pool || typeof pool !== 'object') continue;                   // guard: null pool (wrong ROOM / empty world)
    const poolLines = collectContributions(pool, 0).contributions.map((c) => `[${c.agent_id ?? '?'}] ${c.text}`).filter(Boolean);
    digest.push(`=== ${pn} (public) ===\n${poolLines.join('\n')}`);
  }
  const judgeSys = `You are the OBSERVER of an RPG test run — the inter-subjective correlation across the players' separate accounts, never a player. Judge on five criteria; for each a score 1-5 + one terse sentence of evidence: (1) CONSISTENCY across turns and accounts; (2) PERSISTENCE — consequences endure and propagate; (3) PERCEPTION-LIMITS — no leaked name/private fact; (4) AGENCY — chosen actions shift outcomes; (5) ABSENCE-HONESTY — unanswered directed beats render as absence, never as a foreshadowed or invented response. Close with OVERALL and BIGGEST RULE-WEAKNESS TO FIX.`;
  const verdict = await think('judge', judgeSys, digest.join('\n\n'));
  trace({ phase: 'judge', actor: 'observer', reads: [...CHARS.map((h) => `witnessed:${h}`), ...poolNames], prompt: digest.join('\n\n'), response: verdict });
  console.log(`\n${'#'.repeat(56)}\nOBSERVER VERDICT\n${'#'.repeat(56)}\n${verdict}`);

  if (KEEP) {
    await fs.writeFile(join(dir, 'trace.json'), JSON.stringify(TRACE, null, 1));
    console.log(`\n[rig] sandpit kept at ${dir}`);
    console.log(`[rig] trace: ${TRACE.length} events → ${join(dir, 'trace.json')}`);
    console.log(`[rig] render: npx tsx scripts/rig-filmstrip.ts --dir ${dir} --view dataflow|threads|observer`);
  } else {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

main().catch((e) => { console.error('[rig] ERROR', e?.stack || e); process.exitCode = 1; }).finally(() => { if (beachProc) beachProc.kill(); });
