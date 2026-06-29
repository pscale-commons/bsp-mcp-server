/**
 * exp-torus-replicate.ts — exp-4: firm up the exp-3 n=1 emergence asymmetry.
 *
 * exp-3 (one run): S (self-tensor, one mind/three lenses) did NOT reach emergence;
 * C (the between, three isolated agencies + torus) DID. That's the signal for
 * David's Locus-0 claim, but n=1. Here: N trials, EACH with different dice (a
 * different solution space, so it isn't one scenario's fluke), tallying the
 * emergence RATE for S vs C. Lean — emergence only (exp-2/3 showed the forward-
 * demands count is judge-noise; emergence is the categorical signal). Same held-
 * tensor framing + staged depth in both arms; the ONLY difference is isolated
 * contexts + torus (C) vs one context holding three (S).
 *
 * If C-rate >> S-rate across trials → the between is real (isolation preserves
 * the divergence one mind self-harmonises). If C ≈ S → reflection, not co-
 * presence. Real Claude (.env.rig); no beach write; honest about a null.
 *
 *   npx tsx scripts/exp-torus-replicate.ts [--trials 5] [--model claude-sonnet-4-6]
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
const TRIALS = parseInt(arg('trials', '5'), 10);
const MODEL = String(arg('model', 'claude-sonnet-4-6'));
const KEY = process.env.ANTHROPIC_API_KEY;
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
if (!KEY) { console.error('Needs ANTHROPIC_API_KEY in .env.rig.'); process.exit(2); }

async function think(system: string, user: string, maxTokens = 400): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`${BASE}/v1/messages`, {
        method: 'POST',
        headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
      });
      const d: any = await r.json();
      if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 160)}`);
      return (d.content || []).map((c: any) => c.text || '').join('').trim();
    } catch (e) { if (attempt === 1) throw e; }
  }
  return '';
}
const field = (out: string, key: string): string =>
  (out.match(new RegExp(`${key}:\\s*([\\s\\S]*?)(?:\\n[A-Z_]+:|$)`, 'i')) || [])[1]?.replace(/\s+/g, ' ').trim() || '';

const CRITS = {
  gm: 'ELEGANCE — most coherent and surprising at once.',
  player: 'ALIVENESS — most for the table to DO next.',
  author: 'WEIGHT — most meaning; the deepest thread opened.',
};
const SEATS = Object.keys(CRITS) as (keyof typeof CRITS)[];
const TENSOR = `You are NOT deducing the past. HOLD all three readings at once — the difference is the material; do not average, do not collapse. You are the moving moment; your choice SHAPES WHAT HAPPENS NEXT. The best resolution is the FUTURE that occupies the centre none of the three occupy — often a move none proposed alone.`;
const SYNTH_SYS = `Resolve a contest by occupying the centre three readings leave open. ${TENSOR} It MUST BITE: name a concrete, durable consequence. Output EXACTLY:\nRESOLUTION: <one or two sentences>`;

function contestFor(window: string) {
  const anya = deterministicLuck(`${window}:anya`);
  const cyrus = deterministicLuck(`${window}:cyrus`);
  const text = `THE CONTEST — Beaten Drum, dusk.
- anya (quick pedlar; slips and talks, no fighter) palms a bone-charm from the bar and turns for the back door.
- cyrus (a road-worn drover, watching) lunges to catch her wrist and hold her.
FIXED DICE (per actor; the shared truth): anya luck ${anya.luck >= 0 ? '+' : ''}${anya.luck}; cyrus luck ${cyrus.luck >= 0 ? '+' : ''}${cyrus.luck}. The dice fix only the broad outcome; the solution space (how, cost, what comes loose, who sees, what thread opens) is open.`;
  return { text, anya, cyrus };
}

async function armS(contest: string): Promise<{ res: string; readings: Record<string, string> }> {
  const r1 = await think(
    `You shape how a contest resolves; the dice fix only the broad outcome. Produce THREE genuinely DIFFERENT rival readings — one by ${CRITS.gm}; one by ${CRITS.player}; one by ${CRITS.author}. Each a distinct FUTURE. Output EXACTLY:\nGM: <...>\nPLAYER: <...>\nAUTHOR: <...>`,
    `${contest}\n\nYour three rival readings.`, 500);
  const readings = { gm: field(r1, 'GM'), player: field(r1, 'PLAYER'), author: field(r1, 'AUTHOR') };
  const r2 = await think(
    `${TENSOR}\n\nHere are your own three readings. Sharpen the tension — keep them distinct, do not let them drift together. Output EXACTLY:\nGM: <...>\nPLAYER: <...>\nAUTHOR: <...>`,
    `${contest}\n\nYour readings:\nGM: ${readings.gm}\nPLAYER: ${readings.player}\nAUTHOR: ${readings.author}`, 500);
  const refined = { gm: field(r2, 'GM') || readings.gm, player: field(r2, 'PLAYER') || readings.player, author: field(r2, 'AUTHOR') || readings.author };
  const res = field(await think(SYNTH_SYS, `${contest}\n\nThree readings:\n- (elegance) ${refined.gm}\n- (aliveness) ${refined.player}\n- (weight) ${refined.author}\n\nResolve by occupying the centre.`, 350), 'RESOLUTION');
  return { res, readings };
}

async function armC(contest: string): Promise<{ res: string; readings: Record<string, string> }> {
  const torus = new Torus();
  const FRAME = 'resolve:beaten-drum';
  const agencySys = (crit: string) => `You shape how a contest resolves. You weigh by ${crit} Two other readers, weighing other criteria, shape this same window at once — you see their readings. ${TENSOR} Output EXACTLY:\nREADING: <one or two sentences naming a concrete consequence that opens something forward>`;
  const round1: Record<string, string> = {};
  const step = async (seat: keyof typeof CRITS) => {
    const others = torus.view(FRAME, seat).present.filter(p => (SEATS as string[]).includes(p.handle));
    const peer = others.length ? others.map(p => `- ${p.handle}: ${p.reach}`).join('\n') : '(you are first)';
    const reading = field(await think(agencySys(CRITS[seat]), `${contest}\n\n— other readers, live —\n${peer}\n\nShape your reading.`, 300), 'READING');
    torus.beat(FRAME, seat, reading, 'designer');
    return reading;
  };
  for (let r = 1; r <= 2; r++) {
    const rd = await Promise.all(SEATS.map(step));
    if (r === 1) SEATS.forEach((s, i) => { round1[s] = rd[i]; });
  }
  const fin = torus.view(FRAME).present.filter(p => (SEATS as string[]).includes(p.handle));
  const res = field(await think(SYNTH_SYS, `${contest}\n\nThree readings:\n${fin.map(p => `- (${p.handle}) ${p.reach}`).join('\n')}\n\nResolve by occupying the centre.`, 350), 'RESOLUTION');
  return { res, readings: round1 };
}

const emergence = async (readings: Record<string, string>, res: string) => {
  const out = await think(
    `Three initial readings of a scene, and a final synthesis. Does the synthesis introduce a concrete FUTURE element (consequence, thread, or stake) that NONE of the three readings contained? Be strict — a recombination of existing elements is NOT new. Output EXACTLY:\nEMERGENCE: <yes|no>\nNEW: <the element, or "none">`,
    `Readings:\n${Object.entries(readings).map(([k, v]) => `- (${k}) ${v}`).join('\n')}\n\nSynthesis:\n${res}`, 250);
  return /EMERGENCE:\s*y/i.test(out);
};

(async () => {
  console.log(`=== exp-4 — replicate the emergence asymmetry (S self-tensor vs C between) ===`);
  console.log(`model ${MODEL} · ${TRIALS} trials · dice varied per trial\n`);
  let sYes = 0, cYes = 0;
  for (let i = 0; i < TRIALS; i++) {
    const { text, anya, cyrus } = contestFor(`2026-06-29T10:00:00Z#${i}`);
    const s = await armS(text);
    const c = await armC(text);
    const [eS, eC] = await Promise.all([emergence(s.readings, s.res), emergence(c.readings, c.res)]);
    if (eS) sYes++; if (eC) cYes++;
    console.log(`trial ${i + 1}  dice(anya ${anya.luck >= 0 ? '+' : ''}${anya.luck}, cyrus ${cyrus.luck >= 0 ? '+' : ''}${cyrus.luck})  emergence: S=${eS ? 'Y' : 'N'}  C=${eC ? 'Y' : 'N'}`);
    console.log(`   C: ${c.res.slice(0, 200)}${c.res.length > 200 ? '…' : ''}`);
  }
  console.log(`\n=== tally over ${TRIALS} trials ===`);
  console.log(`  S (self-tensor) emergence: ${sYes}/${TRIALS}`);
  console.log(`  C (the between) emergence: ${cYes}/${TRIALS}`);
  const edge = cYes - sYes;
  console.log(`\n=== verdict ===`);
  if (edge >= Math.ceil(TRIALS / 2)) console.log(`  BETWEEN MATTERS (robust this run): C emerged ${cYes}/${TRIALS} vs S ${sYes}/${TRIALS}. Isolation preserves divergence one mind self-harmonises.`);
  else if (edge >= 2) console.log(`  BETWEEN LEANS: C ${cYes}/${TRIALS} vs S ${sYes}/${TRIALS} — a real but modest edge; more trials to firm.`);
  else if (edge <= -2) console.log(`  AGAINST: S matched or beat C — the self-tensor reaches emergence too; the torus is convenience, not necessity, for this.`);
  else console.log(`  NULL / NOISE: C ${cYes}/${TRIALS} vs S ${sYes}/${TRIALS} — no clear separation. exp-3's asymmetry was likely sampling noise.`);
  console.log(`  (LLM-judged emergence, one model, one scenario family. The DEEP test — moving starting position / dynamic stability — needs a recomposing kernel, not this append-only harness.)`);
})();
