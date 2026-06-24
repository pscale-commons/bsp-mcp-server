/**
 * probe-write-speed.ts — quantify the cost of LOADING world content onto a beach.
 *
 * David's worry: authoring a world THROUGH bsp-mcp (the author-LLM making one bsp()
 * tool call per block) will be slow; writing directly will be faster. This measures
 * the real legs so the probe picks the right write strategy:
 *
 *   1. raw HTTP POST, sequential   — the bare beach write (pack-seed's path)
 *   2. raw HTTP POST, parallel     — same, pipelined (the batch-load path)
 *   3. handleBsp, sequential       — the bsp-mcp tool path (handler + db + HTTP)
 *   4. LIVE beach read RTT         — the network leg to the remote beach (proxy for
 *                                    a remote write round-trip; non-mutating, no pollution)
 *
 * The point: separate the beach's write cost (tiny) from the two real costs —
 * the network round-trip and the LLM's per-call thinking — so we know whether to
 * author by N tool calls or by "LLM emits a world-spec → batch-load it".
 *
 *   npx tsx scripts/probe-write-speed.ts [--n 20]
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { handleBsp } from '../src/tools/bsp.js';

const arg = (n: string, d: any) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const N = parseInt(arg('n', '20'), 10);
const BEACH_REPO = process.env.BEACH_REPO || fileURLToPath(new URL('../../pscale-beach', import.meta.url));
const PORT = parseInt(process.env.SPEED_PORT || '8801', 10);
const BEACH = `http://localhost:${PORT}`;
const LIVE = 'https://thornwood.beach.happyseaurchin.com';
const now = () => performance.now();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const per = (total: number) => (total / N).toFixed(1);

let beachProc: ChildProcess | null = null;
async function spawnBeach(dir: string): Promise<void> {
  beachProc = spawn('node', [join(BEACH_REPO, 'scripts/local-beach.mjs'), '--dir', dir, '--port', String(PORT), '--origin', `localhost:${PORT}`], { stdio: ['ignore', 'ignore', 'ignore'] });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`${BEACH}/.well-known/pscale-beach`)).ok) return; } catch { /* not up */ } await sleep(150); }
  throw new Error('local beach did not come up');
}

// a realistic content block — a place with a description, two features, a standing figure
const sampleBlock = (i: number) => ({ _: `A place in the town — scratch ${i}, where travellers pass and a few linger.`, '1': `a feature of place ${i}`, '2': `a second feature of place ${i}`, '3': `a standing figure who keeps place ${i}` });

async function rawPost(name: string, content: any): Promise<void> {
  const r = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(name)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spindle: '', content, confirm: true }) });
  if (!r.ok) throw new Error(`raw POST ${name}: HTTP ${r.status}`);
  await r.json();
}

async function main() {
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'speed-'));
  await spawnBeach(dir);
  console.log(`[speed] local beach ${BEACH} · N=${N} writes per leg\n`);

  // warm one write (JIT / connection) so the first sample isn't an outlier
  await rawPost('warm', sampleBlock(0));

  // 1. raw sequential
  let t = now();
  for (let i = 0; i < N; i++) await rawPost(`raw-seq-${i}`, sampleBlock(i));
  const rawSeq = now() - t;

  // 2. raw parallel (pipelined batch-load)
  t = now();
  await Promise.all(Array.from({ length: N }, (_, i) => rawPost(`raw-par-${i}`, sampleBlock(i))));
  const rawPar = now() - t;

  // 3. handleBsp sequential (the bsp-mcp tool path: handler → db → HTTP)
  const sample = await handleBsp({ agent_id: BEACH, block: 'bsp-sample', content: sampleBlock(0) } as any);
  const sampleText = sample?.content?.[0]?.text ?? '';
  t = now();
  for (let i = 0; i < N; i++) await handleBsp({ agent_id: BEACH, block: `bsp-seq-${i}`, content: sampleBlock(i) } as any);
  const bspSeq = now() - t;

  // 4. live beach read RTT (network leg; non-mutating)
  const rtts: number[] = [];
  for (let i = 0; i < 6; i++) { const s = now(); try { await fetch(`${LIVE}/.well-known/pscale-beach?block=function:thornwood`); rtts.push(now() - s); } catch (e) { /* offline */ } }
  rtts.sort((a, b) => a - b);
  const rttMed = rtts.length ? rtts[Math.floor(rtts.length / 2)] : NaN;

  // report
  console.log(`  bsp-mcp tool write landed: ${sampleText.slice(0, 80).replace(/\n/g, ' ')}\n`);
  console.log(`  LEG                          total      per-write`);
  console.log(`  1 raw HTTP, sequential       ${rawSeq.toFixed(0).padStart(6)}ms   ${per(rawSeq)}ms`);
  console.log(`  2 raw HTTP, parallel         ${rawPar.toFixed(0).padStart(6)}ms   ${per(rawPar)}ms  (pipelined)`);
  console.log(`  3 handleBsp (bsp-mcp path)   ${bspSeq.toFixed(0).padStart(6)}ms   ${per(bspSeq)}ms`);
  console.log(`  4 LIVE beach read RTT (median of ${rtts.length}): ${isNaN(rttMed) ? 'offline' : rttMed.toFixed(0) + 'ms'}`);

  const bspOverhead = (bspSeq - rawSeq) / N;
  console.log(`\n  bsp-mcp handler overhead vs raw: ${bspOverhead >= 0 ? '+' : ''}${bspOverhead.toFixed(1)}ms/write (local — the handler itself is ${Math.abs(bspOverhead) < 2 ? 'negligible' : 'measurable'})`);

  if (!isNaN(rttMed)) {
    const W = 30; // a 30-block town
    const seqRemote = (W * rttMed) / 1000;
    const parRemote = (rttMed * 1.5) / 1000; // pipelined ≈ a couple of RTTs
    console.log(`\n  PROJECTION — a ${W}-block town onto the LIVE beach (network-only; excludes LLM thinking):`);
    console.log(`    · one bsp() call per block, SEQUENTIAL : ~${seqRemote.toFixed(1)}s   (${W} × ${rttMed.toFixed(0)}ms RTT)`);
    console.log(`    · emit-a-spec then BATCH-load (parallel): ~${parRemote.toFixed(1)}s`);
    console.log(`    + the author-LLM's own thinking is SEPARATE: ~1-3s PER tool call if it writes block-by-block,`);
    console.log(`      vs ~one generation if it emits the whole world-spec at once. THAT is the real lever.`);
  }
  console.log(`\n  TAKEAWAY: the beach write is cheap; the cost is (a) remote RTT × sequential, (b) LLM thinking per call.`);
  console.log(`  Fast author pattern = LLM emits a world-spec as DATA, then batch-load it — not N sequential tool calls.`);

  await fs.rm(dir, { recursive: true, force: true });
}

main().catch((e) => { console.error('[speed] ERROR', e?.stack || e); process.exitCode = 1; }).finally(() => { if (beachProc) beachProc.kill(); });
