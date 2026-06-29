/**
 * exp-torus-resolution.ts — the first vapour-torus experiment.
 *
 * Hypothesis (proposals/2026-06-28-vapour-torus.md; David's "39.0"): the torus's
 * real use is NOT the move-gather (liquid wins there) but **small-N convergent
 * resolution** — two resolver agents' A-loops OVERLAP in real time through the
 * live relay and converge on ONE event-skeleton (the soliton tending to a ground
 * state), rather than diverging or dead-locking (the DPBench risk for simultaneous
 * coordination). The safety floor is at-most-one-winner — here an in-process claim
 * that mirrors the beach's atomic `resolves_window` (the property CodeCRDT had to
 * build on a CRDT; native to our substrate).
 *
 * Real Claude (ANTHROPIC_API_KEY from .env.rig). The shared field is the real
 * src/torus.ts; the per-actor dice are the real deterministicLuck (src/tools/pool).
 * Nothing is written to any beach — the torus is in-process and the commit is a
 * simulated single-winner claim. Honest about non-convergence if it happens.
 *
 *   npx tsx scripts/exp-torus-resolution.ts [--rounds 4] [--model claude-sonnet-4-6]
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Torus } from '../src/torus.js';
import { deterministicLuck } from '../src/tools/pool.js';

// ── load .env.rig (gitignored; same convention as rpg-rig.ts) ──
try {
  const ef = fileURLToPath(new URL('../.env.rig', import.meta.url));
  if (existsSync(ef)) for (const line of readFileSync(ef, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch { /* no .env.rig — handled below */ }

const arg = (n: string, d: any) => { const i = process.argv.indexOf(`--${n}`); if (i < 0) return d; const v = process.argv[i + 1]; return (v && !v.startsWith('--')) ? v : true; };
const ROUNDS = parseInt(arg('rounds', '4'), 10);
const MODEL = String(arg('model', 'claude-sonnet-4-6'));
const KEY = process.env.ANTHROPIC_API_KEY;
const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');

if (!KEY) {
  console.error('This experiment needs a real ANTHROPIC_API_KEY (in .env.rig) — convergence between two live LLMs cannot be stubbed. Aborting.');
  process.exit(2);
}

async function think(system: string, user: string): Promise<string> {
  const r = await fetch(`${BASE}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 600, system, messages: [{ role: 'user', content: user }] }),
  });
  const d: any = await r.json();
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 200)}`);
  return (d.content || []).map((c: any) => c.text || '').join('').trim();
}

// ── the contest (fixed fixture — a genuine clash, so convergence is non-trivial) ──
// Per-actor dice are the REAL substrate function, seeded from the window stamp +
// the actor — fixed before any resolver reads them (honest, not LLM-chosen).
const WINDOW = '2026-06-29T10:00:00Z';
const anya = deterministicLuck(`${WINDOW}:anya`);
const cyrus = deterministicLuck(`${WINDOW}:cyrus`);

const CONTEST = `THE CONTEST — Beaten Drum, dusk. A genuinely uncertain act with a cost; resolve it.

PUBLIC FACTS:
- anya (a quick, sharp-eyed pedlar; talks and slips, no fighter) palms a bone-charm from the bar and turns for the back door, meaning to be gone before anyone reads it.
- cyrus (a road-worn drover, watching the strangers) sees the turn and lunges to catch her wrist and hold her.
These two intentions clash in one window. Neither actor decides the outcome; you do, from the fixed dice + capability.

CAPABILITY (Character Force):
- anya: evasion, misdirection, a reader of rooms; slight of build. Strong at slipping, weak at force.
- cyrus: a guard's reach and grip; not fast, but sure once he commits.

THE FIXED DICE (exploding-d10 luck, seeded per actor — these are the shared truth; use them, never invent):
- anya:  positive ${anya.pos}, negative ${anya.neg}, luck ${anya.luck > 0 ? '+' : ''}${anya.luck}
- cyrus: positive ${cyrus.pos}, negative ${cyrus.neg}, luck ${cyrus.luck > 0 ? '+' : ''}${cyrus.luck}

Resolve each actor's band as capability + situation + their own luck, then weave the two into ONE event-skeleton. An outcome short of clean success must BITE — name a concrete, durable consequence (an option closed, a grip taken, a thing dropped, a door reached), never dissolved into mood.`;

function sys(bias: string): string {
  return `You are a RESOLVER weaving the outcome of a two-actor contest into ONE terse, public event-skeleton — actors by handle, one or two sentences, naming a concrete biting consequence.

You are NOT alone: a second resolver is weaving the SAME window at the same time. You can see their current draft and they can see yours. Converge on ONE shared outcome. The FIXED DICE are the common truth that anchors you both — read them the same way; do not let framing pull you apart. If your draft already agrees with the peer's on who prevails and what the durable consequence is, say so.

Output EXACTLY two lines, nothing else:
SKELETON: <the one- or two-sentence event-skeleton>
AGREE: <yes if your skeleton now matches the peer's current draft in outcome AND consequence; otherwise no>

${bias}`;
}

const BIAS_A = "Your instinct enters the moment from the quick-fingered woman's side — you feel the speed of the turn first.";
const BIAS_B = "Your instinct enters the moment from the drover's side — you feel the weight of the reach first.";

// ── the shared live field + the contested frame ──
const torus = new Torus();
const FRAME = `resolve:beaten-drum:${WINDOW}`;

function parse(out: string): { skeleton: string; agree: boolean } {
  const sk = (out.match(/SKELETON:\s*([\s\S]*?)(?:\nAGREE:|$)/i) || [])[1]?.trim() || out.trim();
  const ag = /AGREE:\s*y/i.test(out);
  return { skeleton: sk.replace(/\s+/g, ' ').trim(), agree: ag };
}

// One resolver's step: read the peer's current draft off the torus, refine toward
// agreement, beat the torus with the new draft (its live reach). This is the
// A-loop overlap — the read and the write straddle a live peer.
async function step(seat: string, peer: string, system: string): Promise<{ skeleton: string; agree: boolean }> {
  const view = torus.view(FRAME, seat);
  const peerDraft = view.present.find((p) => p.handle === peer)?.reach || '(none yet — you are first)';
  const user = `${CONTEST}\n\n— The other resolver's current draft —\n${peerDraft}\n\nProduce or refine your joint skeleton now.`;
  const out = await think(system, user);
  const parsed = parse(out);
  torus.beat(FRAME, seat, parsed.skeleton, 'designer'); // my draft IS my live reach
  return parsed;
}

(async () => {
  console.log('=== vapour-torus experiment — two resolvers converging on one window ===');
  console.log(`model ${MODEL} · frame ${FRAME}`);
  console.log(`fixed dice → anya luck ${anya.luck >= 0 ? '+' : ''}${anya.luck} · cyrus luck ${cyrus.luck >= 0 ? '+' : ''}${cyrus.luck}\n`);

  let converged = false;
  let last = { a: { skeleton: '', agree: false }, b: { skeleton: '', agree: false } };

  for (let r = 1; r <= ROUNDS; r++) {
    // Concurrent beats — both A-loops run together, each reading the other's last
    // draft from the shared torus. (Round-synchronised so convergence is legible;
    // the relay itself imposes no rounds.)
    const [a, b] = await Promise.all([
      step('resolver-alpha', 'resolver-beta', sys(BIAS_A)),
      step('resolver-beta', 'resolver-alpha', sys(BIAS_B)),
    ]);
    last = { a, b };
    console.log(`── round ${r} ──`);
    console.log(`  α  [agree:${a.agree ? 'yes' : 'no '}]  ${a.skeleton}`);
    console.log(`  β  [agree:${b.agree ? 'yes' : 'no '}]  ${b.skeleton}\n`);
    if (a.agree && b.agree) { converged = true; console.log(`✓ converged in ${r} round${r === 1 ? '' : 's'} — both resolvers agree.\n`); break; }
  }

  if (!converged) {
    console.log('✗ did NOT converge within the round budget — the honest DPBench-style outcome (divergence). The torus surfaced the disagreement live; resolution would need more rounds or a tie-break.\n');
  }

  // ── at-most-one-winner: both converged resolvers try to commit; only one wins.
  // In-process here (single-threaded, so order is deterministic); on a real beach
  // this is the atomic `resolves_window` claim, enforced across processes.
  let resolvedBy: string | null = null;
  const claim = (seat: string): boolean => { if (resolvedBy) return false; resolvedBy = seat; return true; };
  console.log('=== commit — at-most-one-winner (mirrors the beach resolves_window) ===');
  for (const [seat, draft] of [['resolver-alpha', last.a.skeleton], ['resolver-beta', last.b.skeleton]] as const) {
    if (claim(seat)) console.log(`  ${seat} CLAIMED the window and wrote the resolution:\n    "${draft}"`);
    else console.log(`  ${seat} found the window ALREADY RESOLVED by ${resolvedBy} → stood down (wrote nothing).`);
  }

  console.log(`\nverdict: ${converged ? 'CONVERGENCE' : 'NON-CONVERGENCE'} · single resolution enforced · torus never persisted (in-process, evaporated on exit).`);
  process.exit(converged ? 0 : 1);
})();
