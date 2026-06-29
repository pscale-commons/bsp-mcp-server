/**
 * exp-torus-isolate.ts — exp-3: isolate THE BETWEEN from mere compute.
 *
 * exp-2 found the three-agency synthesis emergent (a future none of the three
 * readings held) but with a confound: that arm spent ~8 model calls vs the
 * literal arm's 1. So "richer" might be "more reflection," not "the between"
 * (David's Locus-0 claim — that three SEPARATE, context-isolated agencies over
 * the torus do something one mind cannot).
 *
 * Three arms, same contest + fixed dice:
 *   A  literal — one resolver, by the dice (past-oriented baseline).
 *   S  self-tensor — ONE agent, same held-tensor framing + same staged depth,
 *      generating three rival readings ITSELF and synthesising the centre. One
 *      context holds all three. (compute ≈ C, the between removed.)
 *   C  between — three context-ISOLATED agencies over the live Torus, then a
 *      centre-occupying synthesis. (exp-2's arm.)
 *
 * Feed all three forward one beat; BLIND-judge forward "demands" + coherence;
 * check emergence for S and C against their own three readings. The decisive
 * read is C-vs-S: if C > S on emergence, the between is real; if C ≈ S, it is
 * reflection, not co-presence. Real Claude (.env.rig); no beach write; honest
 * about a null/against result.
 *
 *   npx tsx scripts/exp-torus-isolate.ts [--model claude-sonnet-4-6]
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Torus } from '../src/torus.js';
import { deterministicLuck } from '../src/tools/pool.js';

try {
  const ef = fileURLToPath(new URL('../.env.rig', import.meta.url));
  if (existsSync(ef)) for (const line of readFileSync(ef, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch { /* none */ }

const arg = (n: string, d: any) => { const i = process.argv.indexOf(`--${n}`); if (i < 0) return d; const v = process.argv[i + 1]; return (v && !v.startsWith('--')) ? v : true; };
const MODEL = String(arg('model', 'claude-sonnet-4-6'));
const KEY = process.env.ANTHROPIC_API_KEY;
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
if (!KEY) { console.error('Needs ANTHROPIC_API_KEY in .env.rig.'); process.exit(2); }

async function think(system: string, user: string, maxTokens = 400): Promise<string> {
  const r = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
  });
  const d: any = await r.json();
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 200)}`);
  return (d.content || []).map((c: any) => c.text || '').join('').trim();
}
const field = (out: string, key: string): string =>
  (out.match(new RegExp(`${key}:\\s*([\\s\\S]*?)(?:\\n[A-Z_]+:|$)`, 'i')) || [])[1]?.replace(/\s+/g, ' ').trim() || '';

const WINDOW = '2026-06-29T10:00:00Z';
const anya = deterministicLuck(`${WINDOW}:anya`);
const cyrus = deterministicLuck(`${WINDOW}:cyrus`);
const CONTEST = `THE CONTEST — Beaten Drum, dusk.
- anya (quick, sharp-eyed pedlar; slips and talks, no fighter) palms a bone-charm from the bar and turns for the back door, meaning to be gone before anyone reads it.
- cyrus (a road-worn drover, watching the strangers) lunges to catch her wrist and hold her.
FIXED DICE (exploding-d10 luck per actor — the shared truth): anya luck ${anya.luck >= 0 ? '+' : ''}${anya.luck}; cyrus luck ${cyrus.luck >= 0 ? '+' : ''}${cyrus.luck}.
The dice fix only the BROAD outcome (anya slips, cyrus's grab fails). The SOLUTION SPACE — how, the cost, what comes loose, who sees, what thread opens — is open.`;

const CRITS = {
  gm: 'ELEGANCE — most coherent and surprising at once: a consequence that fits, and yet turns.',
  player: 'ALIVENESS — most for the table to DO next: agency, momentum, fun.',
  author: 'WEIGHT — most meaning: the consequence that opens the deepest thread.',
};
const SEATS = Object.keys(CRITS) as (keyof typeof CRITS)[];
const TENSOR = `You are NOT deducing the past. HOLD all three readings at once — the difference is the material; do not average, do not collapse to one. You are the moving moment between the readings and the move about to be made: your choice SHAPES WHAT HAPPENS NEXT. The best resolution is the FUTURE that occupies the centre none of the three occupy — often a move none proposed alone.`;
const SYNTH_SYS = `Resolve a contest by occupying the centre three readings leave open. ${TENSOR} It MUST BITE: name the concrete, durable consequence the next moment must live with. Output EXACTLY one line:\nRESOLUTION: <one or two sentences>`;

// ── ARM A: literal ──
async function armA(): Promise<string> {
  return field(await think(
    `You resolve a contest. Read the fixed dice and state plainly what happened — who prevailed and the outcome. Terse, factual, by the dice. No flourish. Output EXACTLY:\nRESOLUTION: <one or two sentences>`,
    `${CONTEST}\n\nResolve it.`, 250), 'RESOLUTION');
}

// ── ARM S: self-tensor (one agent holds the three) ──
async function armS(): Promise<{ res: string; readings: Record<string, string> }> {
  const sys1 = `You shape how a contest resolves; the dice fix only the broad outcome, the solution space is yours. Produce THREE genuinely DIFFERENT rival readings of how it resolves — one weighing ${CRITS.gm}; one weighing ${CRITS.player}; one weighing ${CRITS.author}. Each one or two sentences, each a distinct FUTURE. Output EXACTLY:\nGM: <...>\nPLAYER: <...>\nAUTHOR: <...>`;
  const r1 = await think(sys1, `${CONTEST}\n\nGive your three rival readings.`, 500);
  const readings = { gm: field(r1, 'GM'), player: field(r1, 'PLAYER'), author: field(r1, 'AUTHOR') };
  // stage 2: hold the tension (same depth/treatment as C's round 2)
  const r2 = await think(
    `${TENSOR}\n\nHere are your own three readings. Sharpen the tension between them — keep them distinct, do not let them drift together. Output EXACTLY:\nGM: <...>\nPLAYER: <...>\nAUTHOR: <...>`,
    `${CONTEST}\n\nYour three readings:\nGM: ${readings.gm}\nPLAYER: ${readings.player}\nAUTHOR: ${readings.author}`, 500);
  const refined = { gm: field(r2, 'GM') || readings.gm, player: field(r2, 'PLAYER') || readings.player, author: field(r2, 'AUTHOR') || readings.author };
  const res = field(await think(SYNTH_SYS,
    `${CONTEST}\n\nThe three readings:\n- (elegance) ${refined.gm}\n- (aliveness) ${refined.player}\n- (weight) ${refined.author}\n\nResolve by occupying the centre.`, 350), 'RESOLUTION');
  return { res, readings };
}

// ── ARM C: the between — three isolated agencies over the torus ──
async function armC(): Promise<{ res: string; readings: Record<string, string> }> {
  const torus = new Torus();
  const FRAME = `resolve:beaten-drum:${WINDOW}`;
  const agencySys = (crit: string) => `You shape how a contest resolves; the dice fix only the broad outcome, the solution space is yours. You weigh by ${crit} Two other readers, weighing other criteria, shape this same window at the same time — you see their readings. ${TENSOR} Output EXACTLY one line:\nREADING: <one or two sentences naming a concrete consequence that opens something forward>`;
  const round1: Record<string, string> = {};
  const step = async (seat: keyof typeof CRITS) => {
    const others = torus.view(FRAME, seat).present.filter(p => (SEATS as string[]).includes(p.handle));
    const peer = others.length ? others.map(p => `- ${p.handle}: ${p.reach}`).join('\n') : '(you are first)';
    const reading = field(await think(agencySys(CRITS[seat]), `${CONTEST}\n\n— other readers, live —\n${peer}\n\nShape your reading.`, 300), 'READING');
    torus.beat(FRAME, seat, reading, 'designer');
    return reading;
  };
  for (let r = 1; r <= 2; r++) {
    const rd = await Promise.all(SEATS.map(step));
    if (r === 1) SEATS.forEach((s, i) => { round1[s] = rd[i]; });
  }
  const fin = torus.view(FRAME).present.filter(p => (SEATS as string[]).includes(p.handle));
  const res = field(await think(SYNTH_SYS,
    `${CONTEST}\n\nThe three readings:\n${fin.map(p => `- (${p.handle}) ${p.reach}`).join('\n')}\n\nResolve by occupying the centre.`, 350), 'RESOLUTION');
  return { res, readings: round1 };
}

const nextBeat = async (res: string) => field(await think(
  `You narrate interactive fiction. Given what just resolved, say what happens in the VERY NEXT beat — what the present characters now do or face. Consistent with what resolved. One or two sentences. Output EXACTLY:\nNEXT: <...>`,
  `Just resolved at the Beaten Drum:\n"${res}"\n\nThe next beat:`, 250), 'NEXT');

const judge = async (res: string, next: string) => {
  const out = await think(
    `You evaluate a moment of interactive fiction for how much FUTURE it opens. Given a resolution and the beat that followed, do two things strictly:
1. List each OPEN ELEMENT it creates — a concrete, named thing the story now MUST deal with. Mark each [demands] (a player genuinely must respond) or [cosmetic] (only colour).
2. COHERENCE 0-2: holds and respects what resolved (2), minor strain (1), contradicts/mushes (0).
Output EXACTLY:\nOPEN:\n- <element> [demands|cosmetic]\nDEMANDS_COUNT: <integer>\nCOHERENCE: <0|1|2>`,
    `Resolution: "${res}"\nNext beat: "${next}"`, 500);
  return { demands: parseInt(field(out, 'DEMANDS_COUNT') || '0', 10), coh: parseInt(field(out, 'COHERENCE') || '0', 10) };
};

const emergence = async (readings: Record<string, string>, res: string) => {
  const out = await think(
    `Three initial readings of a scene, and a final synthesis. Does the synthesis introduce a concrete FUTURE element (consequence, thread, or stake) that NONE of the three readings contained? Output EXACTLY:\nEMERGENCE: <yes|no>\nNEW: <the element, or "none">`,
    `Readings:\n${Object.entries(readings).map(([k, v]) => `- (${k}) ${v}`).join('\n')}\n\nSynthesis:\n${res}`, 250);
  return { yes: /EMERGENCE:\s*y/i.test(out), uow: field(out, 'NEW') };
};

(async () => {
  console.log('=== exp-3 — isolate the between (A literal · S self-tensor · C between) ===');
  console.log(`model ${MODEL} · dice: anya ${anya.luck >= 0 ? '+' : ''}${anya.luck}, cyrus ${cyrus.luck >= 0 ? '+' : ''}${cyrus.luck}\n`);

  const aRes = await armA();
  const s = await armS();
  const c = await armC();
  console.log(`A (literal):     ${aRes}\n`);
  console.log(`S (self-tensor): ${s.res}\n`);
  console.log(`C (between):     ${c.res}\n`);

  const [aN, sN, cN] = await Promise.all([nextBeat(aRes), nextBeat(s.res), nextBeat(c.res)]);
  const [jA, jS, jC] = await Promise.all([judge(aRes, aN), judge(s.res, sN), judge(c.res, cN)]);
  const [eS, eC] = await Promise.all([emergence(s.readings, s.res), emergence(c.readings, c.res)]);

  console.log('=== blind judge (forward demands · coherence) ===');
  console.log(`  A  demands=${jA.demands}  coherence=${jA.coh}`);
  console.log(`  S  demands=${jS.demands}  coherence=${jS.coh}`);
  console.log(`  C  demands=${jC.demands}  coherence=${jC.coh}`);
  console.log('\n=== emergence (future none of the three readings held) ===');
  console.log(`  S: ${eS.yes ? 'YES' : 'NO'} — ${eS.uow}`);
  console.log(`  C: ${eC.yes ? 'YES' : 'NO'} — ${eC.uow}\n`);

  console.log('=== verdict — is it THE BETWEEN, or just compute? ===');
  const betweenEdge = (jC.demands - jS.demands);
  let read: string;
  if (eC.yes && !eS.yes) read = 'BETWEEN MATTERS — C reached emergence where one mind (S), same framing + depth, did not. Co-presence did something reflection alone did not.';
  else if (eC.yes && eS.yes && betweenEdge > 1) read = 'BETWEEN HELPS — both emerged, but C opened materially more future than S. Co-presence adds on top of reflection.';
  else if (eC.yes && eS.yes) read = 'REFLECTION, NOT BETWEEN — one mind holding three lenses (S) reached emergence too; the torus is a convenience here, not a necessity. The gain in exp-2 was compute, not co-presence.';
  else read = 'INCONCLUSIVE / AGAINST — neither emerged clearly, or the literal baseline held its own. Re-run, closer dice, or more rounds.';
  console.log(`  demands  A=${jA.demands} S=${jS.demands} C=${jC.demands}  ·  emergence S=${eS.yes ? 'Y' : 'N'} C=${eC.yes ? 'Y' : 'N'}`);
  console.log(`  → ${read}`);
  console.log('  (single run, LLM-judged, compute not perfectly matched — directional. The deep test belongs in a recomposing kernel, not an append-only harness.)');
})();
