/**
 * check-grit-wiring.ts — validate Wiring B end-to-end, no LLM.
 *
 * Spawns a local beach, seeds the thornwood cartridge (whose room pool now
 * points its underscore at "pscale:grit"), calls pscale_play, and asserts the
 * inlined operating directive is the GRIT SENTINEL (resolved from the registry
 * via the new resolveDirective sentinel-fallback), not the old per-world
 * function:thornwood block. Proves a world runs the canonical loop with no
 * per-world copy. Run: npx tsx scripts/check-grit-wiring.ts
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { handlePlay } from '../src/tools/play.js';

const BEACH_REPO = process.env.BEACH_REPO || fileURLToPath(new URL('../../pscale-beach', import.meta.url));
const PORT = 8799;
const BEACH = `http://localhost:${PORT}`;
const SECRET = 'thorn142';

let beachProc: ChildProcess | null = null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function spawnBeach(dir: string) {
  beachProc = spawn('node', [join(BEACH_REPO, 'scripts/local-beach.mjs'), '--dir', dir, '--port', String(PORT), '--origin', `localhost:${PORT}`], { stdio: ['ignore', 'ignore', 'ignore'] });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${BEACH}/.well-known/pscale-beach`)).ok) return; } catch { /* not up */ }
    await sleep(100);
  }
  throw new Error('local beach did not come up');
}
const seedPack = () => new Promise<void>((resolve, reject) => {
  const p = spawn('node', [join(BEACH_REPO, 'scripts/pack-seed.mjs'), '--beach', BEACH, '--pack', join(BEACH_REPO, 'packs/thornwood')], { stdio: ['ignore', 'ignore', 'ignore'], env: { ...process.env, THORN_GM: SECRET, THORN_CYRUS: SECRET, THORN_ANYA: SECRET, THORN_FENN: SECRET } });
  p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`pack-seed exit ${c}`))));
});

function assert(cond: boolean, msg: string) {
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${msg}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), 'grit-wiring-'));
  await spawnBeach(dir);
  await seedPack();
  const out = (await handlePlay({ world: BEACH, handle: 'anya' })).content[0].text;

  // The inlined directive must be the GRIT sentinel, resolved from the registry.
  assert(out.includes('GRIT — Group Resolution In Time'), 'inlined directive is the GRIT sentinel underscore');
  assert(!out.includes('Operational directives for the Thornwood RPG'), 'old function:thornwood underscore is NOT inlined');
  // The loop actually unfolded (apertures rendered), so play has its rules.
  assert(/PERCEIVE/.test(out) && /COMMIT/.test(out), 'the play loop (PERCEIVE…COMMIT) inlined');
  assert(out.includes('resolving aperture') || out.includes('RESOLVING APERTURE'), 'the check aperture inlined');
  // The world content still resolves (anya is a real character on this beach).
  assert(out.includes('passport:anya') || out.includes('Anya'), "anya's own context bundled");
  // Rules stay swappable: GRIT names the rules slot, does not hardcode dice.
  assert(out.includes('rules:nomad') || out.includes('resolution rules'), 'GRIT references the rules block (swappable), not hardcoded dice');
}

main()
  .catch((e) => { console.error('[check] ERROR', e?.stack || e); process.exitCode = 1; })
  .finally(() => { if (beachProc) beachProc.kill(); });
