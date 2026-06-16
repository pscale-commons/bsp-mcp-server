/**
 * rig-filmstrip.ts — render the three "filmstrip" views of an rpg-rig run from the
 * trace.json that rpg-rig.ts writes under --keep. One run, three audiences:
 *
 *   --view dataflow  → DESIGNER. The full processing log: every phase, the blocks
 *                      read, the prompt sent to the LLM, the response, the per-actor
 *                      dice, the writes, the single-resolution claim. For tweaking
 *                      content (the rules/directive blocks) or code.
 *   --view threads   → CHARACTER. Each character's own thread: the second-person
 *                      narration shown to that player, beat by beat, and (with --full)
 *                      the exact prompt that produced it. What a player experiences.
 *   --view observer  → OBSERVER. One short third-person scene synthesised from all the
 *                      private accounts — a continuous narrative a reader could follow
 *                      or a video model could storyboard. An extra LLM pass (needs a key).
 *
 *   npx tsx scripts/rig-filmstrip.ts --dir <sandpit> --view dataflow|threads|observer
 *                                    [--full] [--model <id>]
 *
 * --full shows complete prompts/responses (default truncates the dataflow log for scanning).
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const arg = (n: string, d: any) => { const i = process.argv.indexOf(`--${n}`); if (i < 0) return d; const v = process.argv[i + 1]; return (v && !v.startsWith('--')) ? v : true; };
const DIR = String(arg('dir', ''));
const VIEW = String(arg('view', 'dataflow'));
const FULL = !!arg('full', false);
const MODEL = String(arg('model', 'claude-sonnet-4-6'));

interface Event { seq: number; round: number; phase: string; actor: string; reads?: string[]; writes?: string[]; dice?: { agent_id: string; pos: number; neg: number; luck: number }[]; prompt?: string; response?: string; claim?: string; envelope?: string }

const indent = (s: string, p = '    ') => String(s ?? '').split('\n').map((l) => p + l).join('\n');
const trunc = (s: string, n = FULL ? 1e9 : 700) => { const t = String(s ?? ''); return t.length > n ? `${t.slice(0, n)}\n    … [${t.length - n} more chars — rerun with --full]` : t; };

// ── DATAFLOW (Designer) — the processing, step by step ──
function dataflow(trace: Event[]): string {
  const out: string[] = ['# DATAFLOW — the processing log (DESIGNER view)', `# ${trace.length} steps. Each step is one LLM call in the loop, with its substrate I/O.\n`];
  for (const e of trace) {
    out.push(`${'─'.repeat(64)}`);
    out.push(`#${e.seq}  round ${e.round}  ·  ${e.phase.toUpperCase()}  ·  ${e.actor}`);
    if (e.reads?.length) out.push(`  reads :  ${e.reads.join('  ·  ')}`);
    if (e.dice?.length) out.push(`  dice  :  ${e.dice.map((d) => `${d.agent_id} luck ${d.luck > 0 ? '+' : ''}${d.luck} [pos ${d.pos} / neg ${d.neg}]`).join('   ')}`);
    out.push(`  prompt → LLM:\n${indent(trunc(e.prompt ?? ''))}`);
    out.push(`  LLM → response:\n${indent(trunc(e.response ?? ''))}`);
    if (e.writes?.length) out.push(`  writes:  ${e.writes.join('  ·  ')}`);
    if (e.claim) out.push(`  claim :  ${e.claim === 'resolved' ? '✓ won the window (single-resolution)' : '✗ stood down — another resolver held it'}`);
    out.push('');
  }
  return out.join('\n');
}

// ── THREADS (Character) — what each player is shown, beat by beat ──
function threads(trace: Event[], chars: string[]): string {
  const out: string[] = ['# CHARACTER THREADS — the narrative each player sees, and the prompt behind it', '# (--full to show the prompts; otherwise just the player-facing narration + their actions)\n'];
  for (const h of chars) {
    out.push(`${'═'.repeat(64)}`);
    out.push(`  ${h.toUpperCase()}'s THREAD`);
    out.push(`${'═'.repeat(64)}`);
    const mine = trace.filter((e) => e.actor === h && (e.phase === 'perceive' || e.phase === 'act')).sort((a, b) => a.seq - b.seq);
    for (const e of mine) {
      if (e.phase === 'perceive') {
        out.push(`\n  ┌─ round ${e.round} · NARRATION (shown to the player) ─┐`);
        out.push(indent(e.response ?? '', '  │ '));
      } else {
        out.push(`\n  ▶ round ${e.round} · ${h} ACTS:`);
        out.push(indent(e.response ?? '', '    '));
      }
      if (FULL) out.push(`\n  ‹prompt that produced it›\n${indent(trunc(e.prompt ?? ''), '  ┊ ')}`);
    }
    out.push('');
  }
  return out.join('\n');
}

// ── OBSERVER (synthesis) — one scene from all the private accounts ──
async function observer(trace: Event[], chars: string[]): Promise<string> {
  const accounts = chars.map((h) => {
    const beats = trace.filter((e) => e.actor === h && e.phase === 'perceive').sort((a, b) => a.seq - b.seq).map((e) => e.response);
    return `=== ${h}'s private account ===\n${beats.join('\n\n')}`;
  });
  const skeletons = trace.filter((e) => e.phase === 'resolve' && e.claim === 'resolved').sort((a, b) => a.seq - b.seq).map((e, i) => `Beat ${i + 1}: ${e.response}`);

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) {
    return ['# OBSERVER — short-story synthesis', `# (no ANTHROPIC_API_KEY set — inputs gathered but not synthesised:`, `#   ${chars.length} private accounts, ${skeletons.length} public beats.)`, '', 'Set ANTHROPIC_API_KEY to generate the scene.'].join('\n');
  }
  const system = `You are the OBSERVER — a third-person eye that has read every character's private account of the same events. Weave them into ONE short, vivid scene: a single continuous third-person narrative (250-400 words) a reader could follow, or a video model could storyboard. Name people only by what is publicly observable (a handle they answer to, or appearance). Honour every account; invent no event none of them recorded. Prose only — no headings, no scores, no analysis.`;
  const user = `THE SEPARATE PRIVATE ACCOUNTS:\n\n${accounts.join('\n\n')}\n\nTHE PUBLIC EVENT-SKELETONS (the shared spine):\n${skeletons.join('\n\n')}\n\nWrite the one scene.`;
  const BASE = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
  const r = await fetch(`${BASE}/v1/messages`, { method: 'POST', headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: MODEL, max_tokens: 1200, system, messages: [{ role: 'user', content: user }] }) });
  const d: any = await r.json();
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${JSON.stringify(d).slice(0, 200)}`);
  const story = (d.content || []).map((c: any) => c.text || '').join('').trim();
  return `# OBSERVER — one scene synthesised from all ${chars.length} private accounts\n# (the third-person objective narrative; ready for a reader or a video API)\n\n${story}`;
}

async function main() {
  if (!DIR) { console.error('usage: rig-filmstrip.ts --dir <sandpit> --view dataflow|threads|observer [--full]'); process.exit(1); }
  const trace: Event[] = JSON.parse(await fs.readFile(join(DIR, 'trace.json'), 'utf8'));
  const chars = [...new Set(trace.filter((e) => e.phase === 'perceive' || e.phase === 'act').map((e) => e.actor))];
  const view = VIEW === 'threads' ? threads(trace, chars)
    : VIEW === 'observer' ? await observer(trace, chars)
      : dataflow(trace);
  console.log(view);
}
main().catch((e) => { console.error('[filmstrip] ERROR', e?.stack || e); process.exitCode = 1; });
