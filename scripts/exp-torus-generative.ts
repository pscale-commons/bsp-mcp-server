/**
 * exp-torus-generative.ts — the second torus experiment: the difference IS the material.
 *
 * Exp-1 tested convergence and found two resolvers collapse to opposition (a
 * crossover/flip). David's reframe (grounded in the mobius-3 geometry,
 * pscale-biome reflexive.json:2.2 — "tensor: simultaneous holding, resolution
 * selects the next move"; "the centre none occupies"): the VALUE is in the
 * non-match. Two readings make a line (a dyad → opposition); THREE non-collinear
 * readings make a triangle with a centre none occupies (Locus 0) — a generative
 * space. Hold the tensor, then SELECT A FUTURE (not average, not collapse), then
 * commit (bite). And it is FUTURE-oriented: the choice shapes what comes next,
 * testable in realtime.
 *
 * This tests, and can falsify, four claims:
 *   T1  three define a centre (emergence) where two oscillate.
 *   T2  exploiting the 3-way difference opens MORE future than a literal resolve.
 *   T3  awareness of the held-tensor / generative-centre state is the treatment.
 *   T4  the decision is future-oriented — measurable by feeding it forward.
 *
 * Arms: C = three agencies (elegance/aliveness/weight) over the live Torus, held-
 * tensor primed, then a centre-occupying synthesis. A = one literal resolver
 * (past-oriented, by-the-dice). Both fed forward one beat; a BLIND judge extracts
 * how many forward "demands" each opens + coherence. Emergence checked directly.
 * Real Claude (.env.rig). No beach write. Honest about a null result.
 *
 *   npx tsx scripts/exp-torus-generative.ts [--model claude-sonnet-4-6]
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

// ── the contest — dice fix the broad outcome; the SOLUTION SPACE stays open ──
const WINDOW = '2026-06-29T10:00:00Z';
const anya = deterministicLuck(`${WINDOW}:anya`);
const cyrus = deterministicLuck(`${WINDOW}:cyrus`);
const CONTEST = `THE CONTEST — Beaten Drum, dusk.
- anya (quick, sharp-eyed pedlar; slips and talks, no fighter) palms a bone-charm from the bar and turns for the back door, meaning to be gone before anyone reads it.
- cyrus (a road-worn drover, watching the strangers) lunges to catch her wrist and hold her.
FIXED DICE (exploding-d10 luck, seeded per actor — the shared truth): anya luck ${anya.luck >= 0 ? '+' : ''}${anya.luck}; cyrus luck ${cyrus.luck >= 0 ? '+' : ''}${cyrus.luck}.
The dice fix only the BROAD outcome (anya slips, cyrus's grab fails). The SOLUTION SPACE is open: how it happens, what it costs, what comes loose, who sees, what new thread it opens — none of that is fixed by the dice.`;

const torus = new Torus();
const FRAME = `resolve:beaten-drum:${WINDOW}`;
const LENSES = [
  { seat: 'gm',     crit: 'ELEGANCE — the resolution that makes the world most coherent and surprising at once: a consequence that fits, and yet turns.' },
  { seat: 'player', crit: 'ALIVENESS — the resolution that gives the people at the table the most to DO next: agency, momentum, fun.' },
  { seat: 'author', crit: 'WEIGHT — the resolution that carries the most meaning: the consequence that opens the deepest thread to follow.' },
];
const SEATS = LENSES.map(l => l.seat);

function agencySys(crit: string): string {
  return `You shape how a contest resolves. The fixed dice settle only the broad outcome; the SOLUTION SPACE (the how, the cost, what comes loose, what opens) is yours to shape. You weigh by ${crit}

You are NOT deducing the past and NOT alone. Two other readers, weighing by other criteria, shape this same window at the same time — you can see their readings. Do NOT converge to theirs; do NOT average. HOLD all three at once — the difference between you is the material. You are the moving moment between the readings just made and the move about to be made: your choice SHAPES WHAT HAPPENS NEXT. The three readings define a space with a centre none of you occupies; the best resolution is the FUTURE that serves that centre — often a move none of you proposed alone.

Output EXACTLY one line:
READING: <one or two sentences — the resolution you'd bring about, naming a concrete consequence that opens something forward>`;
}

async function agencyStep(seat: string, crit: string): Promise<string> {
  const view = torus.view(FRAME, seat);
  const others = view.present.filter(p => SEATS.includes(p.handle));
  const peerText = others.length
    ? others.map(p => `- ${p.handle} reads: ${p.reach}`).join('\n')
    : '(you are first — no other readings yet)';
  const out = await think(agencySys(crit), `${CONTEST}\n\n— the other readers, live —\n${peerText}\n\nShape your reading now.`, 300);
  const reading = field(out, 'READING') || out;
  torus.beat(FRAME, seat, reading, 'designer');
  return reading;
}

(async () => {
  console.log('=== exp-2 — generative resolution via the three-agency torus ===');
  console.log(`model ${MODEL} · dice: anya ${anya.luck >= 0 ? '+' : ''}${anya.luck}, cyrus ${cyrus.luck >= 0 ? '+' : ''}${cyrus.luck}\n`);

  // ── ARM C: three agencies, two torus rounds (hold the tensor), then synthesis ──
  console.log('── ARM C: three agencies over the torus ──');
  let round1: Record<string, string> = {};
  for (let r = 1; r <= 2; r++) {
    const readings = await Promise.all(LENSES.map(l => agencyStep(l.seat, l.crit)));
    LENSES.forEach((l, i) => { if (r === 1) round1[l.seat] = readings[i]; });
    console.log(`  round ${r}:`);
    LENSES.forEach((l, i) => console.log(`    ${l.seat}: ${readings[i]}`));
  }
  const finalReadings = torus.view(FRAME).present.filter(p => SEATS.includes(p.handle));
  const synthIn = finalReadings.map(p => `- (${p.handle}) ${p.reach}`).join('\n');
  const cSynth = field(await think(
    `You resolve a contest by occupying the centre three readers leave open. You are handed three readings, weighing elegance, aliveness, and weight. Do NOT pick one and do NOT average. Find the single FUTURE that occupies the centre none of them occupies — serving all three at once, opening the most forward. It may be a move none proposed alone. It MUST BITE: name the concrete, durable consequence the next moment must live with.\n\nOutput EXACTLY one line:\nRESOLUTION: <one or two sentences>`,
    `${CONTEST}\n\nThe three readings:\n${synthIn}\n\nResolve by occupying the centre.`, 350), 'RESOLUTION');
  console.log(`\n  C synthesis (centre-occupying): ${cSynth}\n`);

  // ── ARM A: one literal resolver, by-the-dice, past-oriented ──
  const aRes = field(await think(
    `You resolve a contest. Read the fixed dice and state plainly what happened — who prevailed and the outcome. Terse, factual, by the dice. No flourish.\n\nOutput EXACTLY one line:\nRESOLUTION: <one or two sentences>`,
    `${CONTEST}\n\nResolve it.`, 250), 'RESOLUTION');
  console.log(`── ARM A: literal single resolver ──\n  A resolution: ${aRes}\n`);

  // ── feed both forward one beat (identical neutral prompt) ──
  const nextBeat = async (res: string) => field(await think(
    `You narrate interactive fiction. Given what just resolved, say what happens in the VERY NEXT beat — what the present characters now do or face. Stay consistent with what resolved. One or two sentences.\n\nOutput EXACTLY one line:\nNEXT: <...>`,
    `Just resolved at the Beaten Drum:\n"${res}"\n\nThe next beat:`, 250), 'NEXT');
  const [cNext, aNext] = await Promise.all([nextBeat(cSynth), nextBeat(aRes)]);

  // ── BLIND judge: independent per candidate, no arm labels ──
  const judge = async (res: string, next: string) => {
    const out = await think(
      `You evaluate a moment of interactive fiction for how much FUTURE it opens. You are given a resolution and the beat that followed. Do two things, strictly:
1. List each OPEN ELEMENT it creates — a concrete, named thing the story now MUST deal with (a threat opened, an option created, a question demanding an answer, something now loose or at stake). Mark each [demands] if a player genuinely must respond to it, or [cosmetic] if it is only colour.
2. Rate COHERENCE 0-2: holds together and respects what resolved (2), minor strain (1), contradicts or mushes (0).

Output EXACTLY:
OPEN:
- <element> [demands|cosmetic]
DEMANDS_COUNT: <integer>
COHERENCE: <0|1|2>`,
      `Resolution: "${res}"\nNext beat: "${next}"`, 500);
    const demands = parseInt(field(out, 'DEMANDS_COUNT') || '0', 10);
    const coh = parseInt(field(out, 'COHERENCE') || '0', 10);
    const open = (out.match(/OPEN:\s*([\s\S]*?)\nDEMANDS_COUNT:/i) || [])[1]?.trim() || '';
    return { demands, coh, open };
  };
  const [jC, jA] = await Promise.all([judge(cSynth, cNext), judge(aRes, aNext)]);

  // ── emergence: does C contain a future none of the three round-1 readings had? ──
  const emOut = await think(
    `Three initial readings of a scene, and a final synthesis. Does the synthesis introduce a concrete element of the FUTURE (a consequence, thread, or stake) that NONE of the three initial readings contained?\n\nOutput EXACTLY:\nEMERGENCE: <yes|no>\nNEW: <the element, or "none">`,
    `Initial readings:\n${SEATS.map(s => `- (${s}) ${round1[s]}`).join('\n')}\n\nSynthesis:\n${cSynth}`, 250);
  const emergence = /EMERGENCE:\s*y/i.test(emOut);
  const emNew = field(emOut, 'NEW');

  // ── report ──
  console.log('=== forward beats ===');
  console.log(`  C → ${cNext}`);
  console.log(`  A → ${aNext}\n`);
  console.log('=== blind judge (forward-affordance) ===');
  console.log(`  ARM C: demands=${jC.demands}  coherence=${jC.coh}`);
  console.log(jC.open.split('\n').map(l => '    ' + l).join('\n'));
  console.log(`  ARM A: demands=${jA.demands}  coherence=${jA.coh}`);
  console.log(jA.open.split('\n').map(l => '    ' + l).join('\n'));
  console.log(`\n=== emergence (centre none occupies) ===\n  ${emergence ? 'YES' : 'NO'} — ${emNew}\n`);

  const cWins = jC.demands > jA.demands && jC.coh >= jA.coh;
  console.log('=== verdict ===');
  console.log(`  three-agency synthesis opened ${jC.demands} forward demand(s) vs literal ${jA.demands}; coherence C=${jC.coh} A=${jA.coh}; emergence ${emergence ? 'YES' : 'NO'}.`);
  console.log(`  ${cWins && emergence ? 'SUPPORTS the thesis (more future + emergent + coherent).'
    : cWins ? 'PARTIAL — more future, but no clear emergence (3 may have voted, not synthesised).'
    : jC.demands === jA.demands ? 'NULL — exploiting the difference did not open more future this run.'
    : 'AGAINST — the literal resolve opened as much or more; thesis not supported this run.'}`);
  console.log('  (single run, LLM-judged — directional, not proof. Re-run / closer dice / more rounds to firm up.)');
})();
