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
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { handlePoolEngage, windowOpenTs, collectContributions, windowDicePerAuthor } from '../src/tools/pool.js';
import { loadBlock, appendToBeach } from '../src/db.js';

// ── config ──
const arg = (n: string, d: any) => { const i = process.argv.indexOf(`--${n}`); if (i < 0) return d; const v = process.argv[i + 1]; return (v && !v.startsWith('--')) ? v : true; };
const TURNS = parseInt(arg('turns', '3'), 10);
const TIMING = String(arg('timing', 'concurrent'));   // concurrent | spread | random
const WINDOW_MS = parseInt(arg('window-ms', '1500'), 10);
const CLIENT = String(arg('client', 'harness'));      // harness (rig code judges the window) | bare (the LLM judges it, as in the app)
const MAX_DELAY = parseInt(arg('max-delay', '1200'), 10); // --timing random: each seat waits 0..MAX_DELAY before it acts
const MODEL = String(arg('model', 'claude-sonnet-4-6'));
const KEEP = !!arg('keep', false);
const BEACH_REPO = process.env.BEACH_REPO || fileURLToPath(new URL('../../pscale-beach', import.meta.url));
const PORT = parseInt(process.env.RIG_PORT || '8799', 10);
const BEACH = `http://localhost:${PORT}`;
const ROOM = 'beaten-drum-main';
const SECRET = 'thorn142';
const CHARS = ['cyrus', 'anya', 'fenn'];

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
const seedPack = () => new Promise<void>((resolve, reject) => {
  const p = spawn('node', [join(BEACH_REPO, 'scripts/pack-seed.mjs'), '--beach', BEACH, '--pack', join(BEACH_REPO, 'packs/thornwood')], { stdio: ['ignore', 'ignore', 'ignore'], env: { ...process.env, THORN_GM: SECRET, THORN_CYRUS: SECRET, THORN_ANYA: SECRET, THORN_FENN: SECRET } });
  p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`pack-seed exit ${c}`))));
});

// ── helpers ──
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (n: number) => Math.floor(Math.random() * Math.max(0, n));
const shuffle = <T>(a: T[]): T[] => a.map((v) => [Math.random(), v] as [number, T]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
const j = (o: any) => JSON.stringify(o, null, 1);
const engage = async (args: Record<string, any>): Promise<string> => (await handlePoolEngage({ pool_url: BEACH, pool_name: ROOM, ...args } as any)).content[0].text;
const block = async (name: string): Promise<any> => (await loadBlock(BEACH, name))?.block ?? null;

// ── the LLM seat: real Claude if keyed, else deterministic stub ──
const KEY = process.env.ANTHROPIC_API_KEY;
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
async function think(label: string, system: string, user: string): Promise<string> {
  if (!KEY) return stub(label, user);
  const r = await fetch(`${BASE}/v1/messages`, { method: 'POST', headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: MODEL, max_tokens: 2000, system, messages: [{ role: 'user', content: user }] }) });
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
  const witnessed = await block(`witnessed:${h}`);
  const knows = await block(`knows:${h}`);
  const user = `[YOU ARE ${h}]\n\nYOUR ACCOUNT SO FAR:\n${j(witnessed)}\n\nNAMES YOU KNOW:\n${j(knows)}\n\nNEW PUBLIC EVENTS (by handle):\n${fresh.map((c) => `- ${c.text}`).join('\n')}\n\nRender these as ${h}'s OWN private account — second person, names only as ${h} knows them, otherwise by appearance. One short paragraph.`;
  const beat = await think('render', softDir, user);
  const loc = witnessed?.['1']?.['2'] ?? `*:${BEACH}:spatial:thornwood:111`;
  await appendToBeach(BEACH, `witnessed:${h}`, { _: beat, '1': h, '2': loc, '3': new Date().toISOString() } as any, SECRET);
  markers[h] = fresh[fresh.length - 1].position;
  trace({ phase: 'perceive', actor: h, reads: [`pool:${ROOM}`, `witnessed:${h}`, `knows:${h}`], writes: [`witnessed:${h} (append)`], prompt: user, response: beat });
  console.log(`  · ${h} journaled: ${beat.slice(0, 140)}`);
}

// 4. ACT — read the real envelope (directive + window), produce + SUBMIT an intention.
async function act(h: string): Promise<void> {
  const witnessed = await block(`witnessed:${h}`);
  const knows = await block(`knows:${h}`);
  const passport = await block(`passport:${h}`);
  const env = await engage({ agent_id: h, since_position: markers[h], with_liquid: true });
  const user = `[YOU ARE ${h}]\n\nYOUR ACCOUNT SO FAR:\n${j(witnessed)}\n\nNAMES YOU KNOW:\n${j(knows)}\n\nYOUR CAPABILITY & LOCATION:\n${j(passport)}\n\nTHE ROOM RIGHT NOW (the engage envelope):\n${env}\n\nWhat does ${h} do? The action only, in ${h}'s voice.`;
  const intention = await think('act', softDir, user);
  await engage({ agent_id: h, submit: intention, face: 'character', with_liquid: true });
  trace({ phase: 'act', actor: h, reads: [`witnessed:${h}`, `passport:${h}`, 'pool_engage envelope'], writes: [`liquid:pool:${ROOM} (submit)`], prompt: user, response: intention, envelope: env });
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
  const now = new Date().toISOString();
  const user = `[YOU ARE ${h}]\n\nYOUR ACCOUNT SO FAR:\n${j(witnessed)}\n\nNAMES YOU KNOW:\n${j(knows)}\n\nYOUR CAPABILITY & LOCATION:\n${j(passport)}\n\nTHE ROOM RIGHT NOW (your engage envelope — it carries the liquid window's open-stamp and the fixed dice if a window is live):\n${env}\n\nThe room's window duration is ${WINDOW_MS} ms. The current time is ${now}.\n\nFollow your operating directive. FIRST judge whether a window has CLOSED (its open-stamp + the duration is at or before now) and still holds unresolved intentions — if so you must resolve it before you act. Then decide your own action. Respond in EXACTLY this format, nothing else:\nRESOLVE: <the one public event-skeleton, by handle, IF a closed window needs resolving; otherwise the single word NONE>\nSUBMIT: <your character's intention for the window, in your voice; or NONE if you only resolved>`;
  const out = await think('bare', fnWhole, user);
  const resolveTxt = (out.match(/RESOLVE:\s*([\s\S]*?)(?:\n\s*SUBMIT:|$)/i)?.[1] || '').trim();
  const submitTxt = (out.match(/SUBMIT:\s*([\s\S]*)$/i)?.[1] || '').trim();

  if (resolveTxt && !/^none\b/i.test(resolveTxt)) {
    const liq = await block(`liquid:pool:${ROOM}`);
    const openTs = windowOpenTs(liq);
    if (openTs) {
      const live = collectContributions(liq, 0).contributions.filter((c) => c.text !== '');
      const elapsed = Date.now() - Date.parse(openTs);
      const ack = await engage({ agent_id: h, contribution: resolveTxt, resolves_window: openTs, since_position: 0 });
      const ok = /committed: slot/.test(ack);
      if (ok) for (const c of live) if (c.agent_id) await engage({ agent_id: c.agent_id, submit: '' });
      console.log(`  >>> [${h} (bare) ${ok ? 'RESOLVED' : 'tried, STOOD DOWN'}${elapsed < WINDOW_MS ? ` · ⚠ PREMATURE (only ${elapsed}ms of ${WINDOW_MS})` : ''}] ${resolveTxt.slice(0, 90)}`);
    } else {
      console.log(`  !!! [${h} (bare) tried to resolve but there is NO live window]`);
    }
  }
  if (submitTxt && !/^none\b/i.test(submitTxt)) {
    await engage({ agent_id: h, submit: submitTxt, face: 'character', with_liquid: true });
    console.log(`  — ${h} (bare) submits: ${submitTxt.slice(0, 100)}`);
  }
}

async function main() {
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'rpg-rig-'));
  await spawnBeach(dir); await seedPack();
  const fn = await block('function:thornwood');
  softDir = fn?.['1'] ?? ''; resolveDir = fn?.['2'] ?? '';
  fnWhole = [fn?.['_'], fn?.['1'], fn?.['2'], fn?.['3']].filter((x) => typeof x === 'string').join('\n\n');
  placeRules = j(await block('rules:thornwood')); nomad = j(await block('rules:nomad'));
  console.log(`[rig] local beach ${BEACH} · seeded · model=${KEY ? MODEL : 'STUB'} · client=${CLIENT} · timing=${TIMING} · window=${WINDOW_MS}ms · turns=${TURNS}\n`);

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

  const digest: string[] = [];
  for (const h of CHARS) {
    const w = await block(`witnessed:${h}`);
    const lines = Object.keys(w).filter((k) => k !== '_').sort().map((k) => (typeof w[k] === 'object' ? w[k]._ : w[k]) || '');
    digest.push(`=== witnessed:${h} (private) ===\n${lines.join('\n')}`);
  }
  const pool = await block(`pool:${ROOM}`);
  const poolLines = Object.keys(pool).filter((k) => k !== '_').sort().map((k) => (typeof pool[k] === 'object' ? pool[k]._ : pool[k]) || '');
  digest.push(`=== pool:${ROOM} (public) ===\n${poolLines.join('\n')}`);
  const judgeSys = `You are the OBSERVER of an RPG test run — the inter-subjective correlation across the players' separate accounts, never a player. Judge on four criteria; for each a score 1-5 + one terse sentence of evidence: (1) CONSISTENCY across turns and accounts; (2) PERSISTENCE — consequences endure and propagate; (3) PERCEPTION-LIMITS — no leaked name/private fact; (4) AGENCY — chosen actions shift outcomes. Close with OVERALL and BIGGEST RULE-WEAKNESS TO FIX.`;
  const verdict = await think('judge', judgeSys, digest.join('\n\n'));
  trace({ phase: 'judge', actor: 'observer', reads: [...CHARS.map((h) => `witnessed:${h}`), `pool:${ROOM}`], prompt: digest.join('\n\n'), response: verdict });
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
