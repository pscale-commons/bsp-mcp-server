/**
 * check-play-scoop.ts — verify pscale_play's manifest-driven scoop (2026-06-22):
 * entering a handle bundles the default set AND the extras its shell manifest names
 * (purpose, etc.), and the shell's orienting note rides along. No LLM.
 *   tsx scripts/check-play-scoop.ts
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { handlePlay } from '../src/tools/play.js';

const BEACH_REPO = process.env.BEACH_REPO || fileURLToPath(new URL('../../pscale-beach', import.meta.url));
const PORT = parseInt(process.env.CHECK_PORT || '8802', 10);
const BEACH = `http://localhost:${PORT}`;
const SECRET = 'thorn142';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
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
  const p = spawn('node', [join(BEACH_REPO, 'scripts/pack-seed.mjs'), '--beach', BEACH, '--pack', join(BEACH_REPO, 'packs/thornwood')], { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, THORN_GM: SECRET, THORN_CYRUS: SECRET, THORN_ANYA: SECRET, THORN_FENN: SECRET } });
  p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`pack-seed exit ${c}`))));
});

let pass = 0, fail = 0;
const check = (name: string, ok: boolean) => { console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${name}`); ok ? pass++ : fail++; };

async function main() {
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'playscoop-'));
  await spawnBeach(dir);
  await seedPack();
  const out = (await handlePlay({ world: BEACH, handle: 'cyrus' } as any)).content[0].text;
  console.log('\n--- pscale_play(cyrus) own-context block names ---');
  for (const m of out.matchAll(/── (\S+) ──/g)) console.log('   ', m[1]);
  console.log('');
  check('default set scooped: passport:cyrus', /── passport:cyrus ──/.test(out));
  check('default set scooped: witnessed:cyrus (the narrative)', /── witnessed:cyrus ──/.test(out));
  check('default set scooped: shell:cyrus', /── shell:cyrus ──/.test(out));
  check('MANIFEST EXTRA scooped: purpose:cyrus (the drive)', /── purpose:cyrus ──/.test(out));
  check('drive text present (caravan)', /last caravan/.test(out));
  check('shell orienting note rode along', /walk this shell's manifest/.test(out));
  console.log(`\n[check] ${pass} passed, ${fail} failed`);
  await fs.rm(dir, { recursive: true, force: true });
  if (fail) process.exitCode = 1;
}
main().catch((e) => { console.error('[check] ERROR', e?.stack || e); process.exitCode = 1; }).finally(() => { if (beachProc) beachProc.kill(); });
