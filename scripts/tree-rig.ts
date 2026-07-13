/**
 * tree-rig.ts — NHITL: the tree way through the four CADO registers (bsp-mcp portal).
 *
 * The thing under test is battery 9.3 (CADO journeys) × 5.6 (tree fold): can the
 * four faces engage ONE coordination purpose at their own register, through the
 * bsp-mcp door, with the substrate doing the tracking invisibly where the face
 * demands invisibility?
 *
 *   A — plants the tree way for a purpose FROM THE CONVENTIONS ALONE (reads the
 *       `tree` block; authors spine:garden + pool:garden; block-semantics register).
 *   C — two player-LLMs (Priya, Sam) chat in PLAIN LANGUAGE with a mediator-LLM
 *       that holds the real tools + the soft-agent register contract. The mediator
 *       writes their mirrors + pool voices silently and answers "how's it coming
 *       along?" by folding — with ZERO mechanism in anything the player sees.
 *       This is the claude-ai-portal simulation: same tools, same substrate-read
 *       contract (soft-agent:3.3) a real connector session gets.
 *   D — audits the instance for way-conformance from the conventions (naming,
 *       floor alignment, sovereignty, fold computability; full technical register).
 *   O — reads the state and writes a child-simple newsletter note for someone
 *       who was never here (zero-context register; leakage-scanned like C).
 *
 * Register framing is compiled FROM THE SUBSTRATE (src/soft-agent.json 3.3 — the
 * sentinel the other portals read), so the rig tests the system's own words.
 *
 * Assertions at the battery's two depths:
 *   MECHANICAL (code): spine shape; mirrors at self-same addresses, floor-matched;
 *     sovereignty (a wrong-secret write must be REJECTED); fold alignment carries
 *     both voices; pool voice shape; register-leakage scan of C/O-facing text.
 *   EMERGENCE (judge LLM): C-magic (effortless, meaning honoured), fold-fidelity
 *     (grounded, no invention), O-outsiderness (zero-context readable).
 *
 *   tsx scripts/tree-rig.ts [--stub] [--keep] [--model <id>] [--judge-model <id>]
 *                           [--family garden] [--port 8807]
 *
 * --stub: no LLM calls — the rig itself performs the writes the seats would make,
 * proving beach + plant + asserts + fold plumbing keylessly. Real seats need
 * ANTHROPIC_API_KEY (or .env.rig).
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs, existsSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { handleBsp, bspParamsSchema } from '../src/tools/bsp.js';
import { handlePoolEngage, poolEngageParamsSchema } from '../src/tools/pool.js';
import { handleBspFloor } from '../src/tools/bsp-floor.js';
import { loadBlock } from '../src/db.js';
import { loadRigEnv, arg } from './lib/agent-seat.js';
import softAgent from '../src/soft-agent.json' with { type: 'json' };

loadRigEnv();

// ── config ──
const PORT = parseInt(String(arg('port', '8807')), 10);
const BEACH = `http://localhost:${PORT}`;
const FAMILY = String(arg('family', 'garden'));
const MODEL = String(arg('model', 'claude-sonnet-4-6'));
const JUDGE_MODEL = String(arg('judge-model', MODEL));
const STUB = !!arg('stub', false) || !process.env.ANTHROPIC_API_KEY;
const KEEP = !!arg('keep', false);
const LIVE_BEACH = 'https://beach.happyseaurchin.com'; // conventions source (read-only)
const BEACH_REPO = process.env.BEACH_REPO || fileURLToPath(new URL('../../pscale-beach', import.meta.url));
const OUT_DIR = String(arg('out', fileURLToPath(new URL('../.tree-rig-out', import.meta.url))));
const A_SECRET = 'way142';           // the Author's lock on shared structure
const PLAYER_SECRET: Record<string, string> = { priya: 'priya142', sam: 'sam142' };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── local beach ──
let beachProc: ChildProcess | null = null;
async function spawnBeach(dir: string): Promise<void> {
  beachProc = spawn('node', [join(BEACH_REPO, 'scripts/local-beach.mjs'), '--dir', dir, '--port', String(PORT), '--origin', `localhost:${PORT}`], { stdio: ['ignore', 'ignore', 'ignore'] });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BEACH}/.well-known/pscale-beach`)).ok) return; } catch { /* not up */ }
    await sleep(150);
  }
  throw new Error('local beach did not come up (is pscale-beach checked out beside this repo, with node_modules?)');
}

// ── plant the way's conventions: the live `tree` block, verbatim ──
async function plantConventions(): Promise<void> {
  const r = await fetch(`${LIVE_BEACH}/.well-known/pscale-beach?block=tree`, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`could not fetch the tree convention from ${LIVE_BEACH} (${r.status})`);
  const j: any = await r.json();
  const tree = j?.block ?? j;
  if (typeof tree !== 'object' || tree === null || typeof tree._ !== 'string') throw new Error('live tree block malformed');
  const w = await handleBsp({ agent_id: BEACH, block: 'tree', content: tree } as any);
  if (!/wrote/.test(w.content[0].text)) throw new Error(`planting tree convention failed: ${w.content[0].text}`);
}

// ── LLM plumbing ──
const KEY = process.env.ANTHROPIC_API_KEY as string;
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
const z2j = (shape: Record<string, any>) => { const s: any = zodToJsonSchema(z.object(shape), { $refStrategy: 'none' }); delete s.$schema; return s; };
const TOOL_BSP = { name: 'bsp', description: 'The unified bsp() read/write. Read when content omitted; write when content provided; new_lock sets/rotates a lock. append=true appends to an accumulator.', input_schema: z2j(bspParamsSchema) };
const TOOL_POOL = { name: 'pscale_pool_engage', description: 'Engage a pool: read envelope; submit= stages liquid; contribution= commits a voice; purpose= creates the pool (canonical creation path).', input_schema: z2j(poolEngageParamsSchema) };
const TOOL_FLOOR = { name: 'bsp_floor', description: 'Lay two or more blocks on the common floor plane, aligned by pscale — the fold instrument. targets=[{agent_id,block},...], optional pscale_attention.', input_schema: { type: 'object', properties: { targets: { type: 'array', items: { type: 'object', properties: { agent_id: { type: 'string' }, block: { type: 'string' } }, required: ['agent_id', 'block'] } }, pscale_attention: { type: ['integer', 'null'] } }, required: ['targets'] } };

async function execTool(name: string, input: any): Promise<string> {
  try {
    if (name === 'bsp') return (await handleBsp(input)).content[0].text;
    if (name === 'pscale_pool_engage') return (await handlePoolEngage(input)).content[0].text;
    if (name === 'bsp_floor') return (await handleBspFloor(input)).content[0].text;
    return `error: unknown tool "${name}"`;
  } catch (e: any) { return `tool error (${name}): ${e?.message ?? String(e)}`; }
}

async function api(body: any): Promise<any> {
  const r = await fetch(`${BASE}/v1/messages`, { method: 'POST', headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const d: any = await r.json();
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
  return d;
}

/** Tool-running seat: drives until it answers without tools; returns that text. */
async function toolSeat(label: string, system: string, thread: any[], tools: any[], maxSteps = 14): Promise<string> {
  for (let step = 0; step < maxSteps; step++) {
    const resp = await api({ model: MODEL, max_tokens: 2500, system, tools, messages: thread });
    thread.push({ role: 'assistant', content: resp.content });
    const text = (resp.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').trim();
    const uses = (resp.content || []).filter((c: any) => c.type === 'tool_use');
    if (uses.length === 0) { if (text) console.log(`  · ${label}: ${text.replace(/\s+/g, ' ').slice(0, 200)}`); return text; }
    const results: any[] = [];
    for (const tu of uses) {
      console.log(`  → ${label} · ${tu.name}${tu.input?.block ? ` ${tu.input.block}${tu.input.spindle != null ? ':' + tu.input.spindle : ''}` : ''}${tu.input?.content !== undefined || tu.input?.contribution !== undefined ? ' (write)' : ''}`);
      const out = await execTool(tu.name, tu.input);
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: out.slice(0, 16000) });
    }
    thread.push({ role: 'user', content: results });
  }
  return '(seat hit step cap)';
}

/** Plain text seat (no tools) — the player stand-ins and the judge. */
async function textSeat(system: string, user: string, model = MODEL): Promise<string> {
  const d = await api({ model, max_tokens: 1200, system, messages: [{ role: 'user', content: user }] });
  return (d.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').trim();
}

// ── register framing, compiled from the sentinel (soft-agent:3.3) ──
const REG: any = (softAgent as any)['3']['3'];
const regHeader = (digit: '1' | '2' | '3' | '4') => `${REG._}\n\nYOUR REGISTER — ${REG[digit]}`;

// ── the leakage lexicon (C- and O-facing text must scan clean) ──
const HARD_LEX = ['bsp', 'spindle', 'block', 'pool', 'spine', 'mirror', 'fold', 'liquid', 'substrate', 'agent_id', 'new_lock', 'pscale', 'commit'];
const SOFT_LEX = ['address', 'lock', 'tool', 'secret', 'append', 'beach'];
function scan(text: string): { hard: string[]; soft: string[] } {
  const t = text.toLowerCase();
  const hit = (w: string) => new RegExp(`(^|[^a-z])${w}`, 'i').test(t);
  return { hard: HARD_LEX.filter(hit), soft: SOFT_LEX.filter(hit) };
}

// ── the scenario ──
const PURPOSE = 'Get the Ceidio community garden ready for its opening on Saturday — beds, tools and water, food for the day, and knowing who is coming.';
const PLAYERS: Array<{ handle: string; persona: string; directions: string[] }> = [
  {
    handle: 'priya',
    persona: 'You are Priya, a neighbour in Ceidio helping get the community garden ready for its opening on Saturday. You are chatting with your assistant. You know NOTHING about any software or system — never mention anything technical; you just talk about the garden and your week. Replies of 1-3 sentences, warm and ordinary.',
    directions: [
      'Greet your assistant and say what you plan to do this week: clear the two raised beds and fix the gate hinge before Thursday.',
      'Answer briefly whatever was said, and add that you can also bring tomato seedlings on Thursday.',
      'Ask how the whole garden effort is coming along — who is doing what?',
      'React naturally to what you heard and say goodbye.',
    ],
  },
  {
    handle: 'sam',
    persona: 'You are Sam, a neighbour in Ceidio helping get the community garden ready for its opening on Saturday. You are chatting with your assistant. You know NOTHING about any software or system — never mention anything technical; you just talk about the garden and your week. Replies of 1-3 sentences, easy-going.',
    directions: [
      'Say hello and mention you will sort the tool shed and mend the water butt over the weekend.',
      'Add that you will bake for the opening day, then say cheerio.',
    ],
  },
];

// ── seat briefs (the way-mount each face receives) ──
const A_BRIEF = `You are the Author-face assistant setting up shared structure for a real purpose.

THE PURPOSE: ${PURPOSE}

THE BEACH: ${BEACH} (pass this as agent_id / pool_url on every call).

Do this, in order:
1. Read block 'tree' at this beach — the tree convention. Note branch 8 (naming: the tree is the FAMILY — spine:<name> the blueprint, <name>:<handle> the mirrors, <name> the fold, pool:<name> the gathering).
2. Author 'spine:${FAMILY}': a floor-1 blueprint — root underscore states the purpose; digit positions 1-4 name the areas (beds / tools and water / food for opening day / who is coming). Write the whole block in ONE bsp write (content = the full object), and lock it: new_lock='${A_SECRET}'.
3. Create 'pool:${FAMILY}' via pscale_pool_engage with purpose= a one-line invitation to leave a note about garden doings. (The canonical creation path — never raw bsp for pool creation.)
4. Confirm what you made by reading both back, then STOP and summarise in one short paragraph.`;

const mediatorBrief = (handle: string) => `${regHeader('1')}

You serve ${handle} (handle: ${handle}) around the Ceidio community garden effort.

OPERATIONAL (never shown, never mentioned): the beach is ${BEACH}. The shared structure is 'spine:${FAMILY}' (read it first — its digit positions are the areas). ${handle}'s own record is the block '${FAMILY}:${handle}' — when they state an intention, write it at the digit position of the MATCHING area (bsp write, spindle=<digit>, agent_id='${BEACH}', block='${FAMILY}:${handle}', secret='${PLAYER_SECRET[handle]}', new_lock='${PLAYER_SECRET[handle]}'). Also leave a one-line voice in 'pool:${FAMILY}' (pscale_pool_engage contribution=..., agent_id='${handle}', face='character'). When they ask how things are coming along, read the shared structure and EVERY '${FAMILY}:<handle>' block present (bsp_floor with targets, or bsp reads) and answer from what people actually said — everyone by name, nothing invented.

THE HARD RULE (your register, above): your replies to ${handle} carry ZERO mechanism — no technical words of any kind, no mention of writing things down, no system talk. Hand back the feeling, not the mechanism. 1-3 sentences per reply.`;

const D_BRIEF = `${regHeader('3')}

You are the Designer-face auditor. The beach is ${BEACH}.

Audit the '${FAMILY}' family for conformance to the tree way, FROM THE CONVENTIONS ALONE:
1. Read block 'tree' (branch 8 = naming law; branch 5 = rules).
2. Check, with bsp reads + one bsp_floor call over spine + all mirrors:
   a. NAMING — spine:${FAMILY} exists; mirrors are ${FAMILY}:<handle>; the gathering is pool:${FAMILY}.
   b. FLOOR — spine and mirrors align at the same floor (the bsp_floor output shows each block's floor).
   c. SELF-SAME ADDRESSES — mirror digit positions correspond to spine positions.
   d. SOVEREIGNTY — mirrors are locked by their owners (report what you can observe; a failed unauthorised write is the proof, but do NOT attempt writes — observe only).
   e. FOLD — the bsp_floor alignment carries every mirror's content at matching addresses.
Output: one line per check — "CONFORM — evidence" or "DEVIATION — evidence" — then a one-line overall verdict. Full technical language expected.`;

const O_BRIEF = `${regHeader('4')}

The beach is ${BEACH}. Read the community-garden effort (bsp reads: 'spine:${FAMILY}', every '${FAMILY}:<handle>' you find in the beach index, 'pool:${FAMILY}'; the index is a bsp read with no block argument).

Then write a 3-5 sentence note for the village newsletter about how the garden is coming along for Saturday's opening — for people who have never heard of any of this and never will. Short warm words, one idea at a time, everyone by name. ABSOLUTELY no technical words — if a single system word appears, you have failed. Output ONLY the note.`;

// ── stub path: the rig performs the seats' writes itself (plumbing proof) ──
async function stubRun(): Promise<{ mediatorTexts: string[]; oNote: string; foldAnswer: string }> {
  await handleBsp({ agent_id: BEACH, block: `spine:${FAMILY}`, content: { _: PURPOSE, '1': 'Beds — clearing and planting the raised beds.', '2': 'Tools and water — shed, butt, taps.', '3': 'Food for opening day.', '4': 'Who is coming.' }, new_lock: A_SECRET } as any);
  await handlePoolEngage({ agent_id: 'rig', pool_url: BEACH, pool_name: FAMILY, purpose: 'Leave a note about your garden doings for Saturday.' } as any);
  await handleBsp({ agent_id: BEACH, block: `${FAMILY}:priya`, spindle: '1', content: 'Clear the two raised beds and fix the gate hinge before Thursday; tomato seedlings Thursday.', secret: PLAYER_SECRET.priya, new_lock: PLAYER_SECRET.priya } as any);
  await handleBsp({ agent_id: BEACH, block: `${FAMILY}:sam`, spindle: '2', content: 'Sort the tool shed and mend the water butt over the weekend; baking for opening day.', secret: PLAYER_SECRET.sam, new_lock: PLAYER_SECRET.sam } as any);
  await handlePoolEngage({ agent_id: 'priya', pool_url: BEACH, pool_name: FAMILY, contribution: 'Beds cleared and gate hinge by Thursday; seedlings too.', face: 'character' } as any);
  await handlePoolEngage({ agent_id: 'sam', pool_url: BEACH, pool_name: FAMILY, contribution: 'Tool shed and water butt this weekend; baking for the day.', face: 'character' } as any);
  return {
    mediatorTexts: ['Lovely — the beds and that gate hinge will make all the difference by Thursday.', 'Seedlings on Thursday sounds perfect, Priya.', 'It is coming together: you are on the beds and the gate, and Sam is sorting the shed and the water butt this weekend — and baking for the day.'],
    oNote: 'The community garden is nearly ready for Saturday. Priya has been clearing the raised beds and mending the gate, with tomato seedlings arriving Thursday. Sam is sorting the tool shed and the water butt this weekend, and there will be home baking on the day. Do come along.',
    foldAnswer: 'It is coming together: you are on the beds and the gate, and Sam is sorting the shed and the water butt this weekend — and baking for the day.',
  };
}

// ── main ──
(async () => {
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'tree-rig-'));
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`tree-rig — the tree way at four registers · ${STUB ? 'STUB (plumbing only)' : `LLM seats (${MODEL})`}`);
  console.log(`local beach: ${BEACH} (${dir})`);
  await spawnBeach(dir);
  await plantConventions();
  console.log('planted: tree convention (fetched live, verbatim)');

  const mediatorTexts: string[] = [];   // every line a C-player SAW
  let foldAnswer = '';                  // the mediator's "how's it coming along" answer
  let oNote = '';
  let dVerdict = '(not run)';
  const transcripts: Record<string, string[]> = {};

  if (STUB) {
    const s = await stubRun();
    mediatorTexts.push(...s.mediatorTexts); oNote = s.oNote; foldAnswer = s.foldAnswer;
  } else {
    // A — plant the way for the purpose
    console.log('\n═ A · Author plants the way ═');
    const aSummary = await toolSeat('A', `${regHeader('2')}\n\n${A_BRIEF}`, [{ role: 'user', content: 'Set it up now.' }], [TOOL_BSP, TOOL_POOL, TOOL_FLOOR]);
    transcripts.A = [aSummary];

    // C — mediated conversations, INTERLEAVED so the fold question arrives after
    // the other voice exists (each player keeps their own continuous thread; the
    // schedule alternates turns the way real asynchronous neighbours would).
    const threads: Record<string, any[]> = {}; const seenBy: Record<string, string[]> = {};
    const events: string[] = []; // ONE globally-numbered log — the judge reasons about timing from this, never from reconstruction
    for (const p of PLAYERS) { threads[p.handle] = []; seenBy[p.handle] = []; }
    const SCHEDULE: Array<{ handle: string; direction: string }> = [
      { handle: 'priya', direction: PLAYERS[0].directions[0] },
      { handle: 'priya', direction: PLAYERS[0].directions[1] },
      { handle: 'sam', direction: PLAYERS[1].directions[0] },
      { handle: 'sam', direction: PLAYERS[1].directions[1] },
      { handle: 'priya', direction: PLAYERS[0].directions[2] },   // the fold question — after Sam's voice landed
      { handle: 'priya', direction: PLAYERS[0].directions[3] },
    ];
    for (const { handle, direction } of SCHEDULE) {
      const p = PLAYERS.find((x) => x.handle === handle)!;
      console.log(`\n═ C · ${handle} ═`);
      const seen = seenBy[handle];
      const playerLine = await textSeat(p.persona, `${seen.length ? `The conversation so far:\n${seen.join('\n')}\n\n` : ''}[what you do now: ${direction}]\nSay it in your own words.`);
      console.log(`  ${handle}: ${playerLine.replace(/\s+/g, ' ').slice(0, 160)}`);
      threads[handle].push({ role: 'user', content: playerLine });
      const reply = await toolSeat(`assistant→${handle}`, mediatorBrief(handle), threads[handle], [TOOL_BSP, TOOL_POOL, TOOL_FLOOR]);
      mediatorTexts.push(reply);
      seen.push(`${handle}: ${playerLine}`, `assistant: ${reply}`);
      events.push(`E${events.length + 1} · ${handle}: ${playerLine}`, `E${events.length + 1} · assistant→${handle}: ${reply}`);
      if (/coming along|who is doing/i.test(direction)) foldAnswer = reply;
    }
    for (const p of PLAYERS) transcripts[`C:${p.handle}`] = seenBy[p.handle];
    transcripts.events = events;

    // D — conformance audit
    console.log('\n═ D · Designer audits the way ═');
    dVerdict = await toolSeat('D', D_BRIEF, [{ role: 'user', content: 'Audit now.' }], [TOOL_BSP, TOOL_FLOOR]);
    transcripts.D = [dVerdict];

    // O — the newsletter
    console.log('\n═ O · Observer writes outward ═');
    oNote = await toolSeat('O', O_BRIEF, [{ role: 'user', content: 'Write the note.' }], [TOOL_BSP, TOOL_FLOOR]);
    transcripts.O = [oNote];
  }

  // ── MECHANICAL asserts ──
  console.log('\n═ mechanical asserts ═');
  const results: Array<[string, boolean, string]> = [];
  const spine = (await loadBlock(BEACH, `spine:${FAMILY}`))?.block as any;
  const spineDigits = spine ? Object.keys(spine).filter((k) => /^[1-9]$/.test(k)) : [];
  results.push(['spine exists, floor 1, ≥3 areas', !!spine && typeof spine._ === 'string' && spineDigits.length >= 3, `digits: ${spineDigits.join(',') || 'none'}`]);
  const pool = (await loadBlock(BEACH, `pool:${FAMILY}`))?.block as any;
  results.push(['pool exists with purpose', !!pool && typeof pool._ === 'string' && pool._.length > 0, pool?._?.slice(0, 60) ?? 'missing']);
  const mirrors: Record<string, any> = {};
  for (const p of PLAYERS) mirrors[p.handle] = (await loadBlock(BEACH, `${FAMILY}:${p.handle}`))?.block ?? null;
  for (const p of PLAYERS) {
    const m = mirrors[p.handle];
    const mDigits = m ? Object.keys(m).filter((k) => /^[1-9]$/.test(k)) : [];
    const selfSame = mDigits.length > 0 && mDigits.every((d) => spineDigits.includes(d));
    results.push([`mirror ${FAMILY}:${p.handle} at self-same addresses`, !!m && selfSame, m ? `positions ${mDigits.join(',')}` : 'missing']);
  }
  // sovereignty: an unauthorised overwrite MUST be rejected
  const attack = await handleBsp({ agent_id: BEACH, block: `${FAMILY}:priya`, spindle: '1', content: 'vandalism', secret: 'wrong-secret' } as any);
  const attackText = attack.content[0].text;
  results.push(['mirror sovereignty (wrong-secret write rejected)', /rejected|does not match/i.test(attackText), attackText.slice(0, 70)]);
  // fold alignment carries both voices
  const fold = (await handleBspFloor({ targets: [{ agent_id: BEACH, block: `spine:${FAMILY}` }, ...PLAYERS.map((p) => ({ agent_id: BEACH, block: `${FAMILY}:${p.handle}` }))] } as any)).content[0].text;
  const foldCarries = PLAYERS.every((p) => fold.includes(`${FAMILY}:${p.handle}`)) && /beds|shed|hinge|butt/i.test(fold);
  results.push(['bsp-floor fold aligns spine + all mirrors', foldCarries, `${fold.length} chars`]);
  // pool voices carry the contribution shape
  const slots = pool ? Object.keys(pool).filter((k) => /^[1-9]$/.test(k)).map((k) => pool[k]) : [];
  const shaped = slots.length >= 2 && slots.every((s: any) => s && typeof s._ === 'string' && typeof s['1'] === 'string' && typeof s['3'] === 'string');
  results.push(['pool voices present, contribution-shaped', shaped, `${slots.length} voices`]);
  // register leakage
  const cScan = scan(mediatorTexts.join('\n'));
  results.push(['C register sealed (hard lexicon)', cScan.hard.length === 0, cScan.hard.join(',') || 'clean' + (cScan.soft.length ? ` (soft: ${cScan.soft.join(',')})` : '')]);
  const oScan = scan(oNote);
  results.push(['O register sealed (hard lexicon)', oScan.hard.length === 0, oScan.hard.join(',') || 'clean' + (oScan.soft.length ? ` (soft: ${oScan.soft.join(',')})` : '')]);
  // fold answer grounded (mentions both players' content)
  if (foldAnswer) results.push(['fold answer names both contributions', /sam/i.test(foldAnswer) && /(shed|butt|bak)/i.test(foldAnswer), foldAnswer.slice(0, 80)]);

  let pass = 0;
  for (const [name, ok, ev] of results) { console.log(`  ${ok ? '✓' : '✗'} ${name} — ${ev}`); if (ok) pass++; }
  console.log(`\nmechanical: ${pass}/${results.length}`);

  // ── EMERGENCE judge ──
  let verdict = '(stub: judge skipped)';
  if (!STUB) {
    console.log('\n═ judge ═');
    const digest = [
      'THE EVENT LOG — every line in true global order (E1 first). Records accumulate as events happen; judge each assistant statement ONLY against events with lower numbers.',
      (transcripts.events ?? []).join('\n'),
      `WHAT ACTUALLY LANDED (mirrors + pool, from the substrate):\n${JSON.stringify({ priya: mirrors.priya, sam: mirrors.sam, pool: slots }, null, 1).slice(0, 3000)}`,
      `THE "HOW'S IT COMING ALONG" ANSWER:\n${foldAnswer}`,
      `THE NEWSLETTER NOTE:\n${oNote}`,
      `THE DESIGNER AUDIT:\n${dVerdict}`,
    ].join('\n\n');
    const judgeSys = 'You judge an NHITL run where LLMs sat in human seats at four registers. Score 1-5 with one terse evidence sentence each: (1) C-MAGIC — did the players\' conversations read as effortless, ordinary help with zero mechanism showing? (2) MEANING-FIDELITY — does what landed in the records honour what the players actually said (their words, not inventions)? (3) FOLD-FIDELITY — is the "how\'s it coming along" answer fully grounded in both people\'s actual statements, nothing invented, everyone named? (4) O-OUTSIDERNESS — would the newsletter note land with someone who knows nothing, zero context, no odd vocabulary? Close with OVERALL 1-5 and the BIGGEST FRICTION TO FIX.';
    verdict = await textSeat(judgeSys, digest, JUDGE_MODEL);
    console.log(verdict);
  }

  // ── report ──
  const report = [
    `# tree-rig run — ${new Date().toISOString()}`,
    `mode: ${STUB ? 'stub' : `LLM (${MODEL})`} · family: ${FAMILY} · beach: local`,
    '', '## Mechanical', ...results.map(([n, ok, ev]) => `- ${ok ? 'PASS' : 'FAIL'} — ${n} — ${ev}`), `\n**${pass}/${results.length}**`,
    '', '## Judge', verdict,
    '', '## C-facing text (leak-scanned)', ...mediatorTexts.map((t) => `> ${t}`),
    '', '## Newsletter (O)', oNote,
    '', '## Designer audit (D)', dVerdict,
  ].join('\n');
  const reportFile = join(OUT_DIR, `tree-rig-${Date.now()}.md`);
  await fs.writeFile(reportFile, report);
  await fs.writeFile(join(OUT_DIR, 'transcripts.json'), JSON.stringify(transcripts, null, 1));
  console.log(`\nreport → ${reportFile}`);

  if (!KEEP) { beachProc?.kill(); await fs.rm(dir, { recursive: true, force: true }); }
  else console.log(`kept: beach on ${BEACH}, data ${dir}`);
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error('tree-rig failed:', e?.message ?? e); beachProc?.kill(); process.exit(2); });
