/**
 * check-co-presence-close.ts — deterministic, no-LLM integration check for the
 * 2026-06-22 "co-presence-close" fix. Drives the REAL pscale_pool_engage envelope
 * against a freshly-seeded LOCAL beach (throwaway secrets), with fixed intention
 * text standing in for the soft-LLM. It does NOT test whether an LLM follows the
 * directive prose (that needs a keyed rig run) — it proves the SUBSTRATE + ENVELOPE
 * give the LLM what the fix requires:
 *   1. perceive surfaces the LIVE WINDOW (the other character's pending intention)
 *   2. a second submission makes a 2-intention window + hands per-actor dice
 *   3. resolving a 2-intention window writes ONE shared skeleton
 *   4. single-resolution stands the second resolver down
 *   5. the other character then perceives the shared beat
 *
 *   tsx scripts/check-co-presence-close.ts
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { handlePoolEngage, windowOpenTs } from '../src/tools/pool.js';
import { loadBlock } from '../src/db.js';

const BEACH_REPO = process.env.BEACH_REPO || fileURLToPath(new URL('../../pscale-beach', import.meta.url));
const PORT = parseInt(process.env.CHECK_PORT || '8801', 10);
const BEACH = `http://localhost:${PORT}`;
const ROOM = '111';
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

const engage = (args: Record<string, any>): Promise<string> =>
  handlePoolEngage({ pool_url: BEACH, pool_name: ROOM, ...args } as any).then((r) => r.content[0].text);

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
  ok ? pass++ : fail++;
};

const CYRUS_ACT = 'Cyrus keeps his back to the wall and watches the room — the exits, then the company, cup untouched.';
const ANYA_ACT = 'Anya leans toward the broad-shouldered stranger by the fire and asks, easy as anything, whether the road south is still open.';

async function main() {
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'copres-'));
  await spawnBeach(dir);
  await seedPack();
  console.log(`\n[check] local beach ${BEACH} seeded with packs/thornwood (new directive)\n`);

  // 1. Cyrus acts first — opens the window with one intention.
  await engage({ agent_id: 'cyrus', submit: CYRUS_ACT, face: 'character' });

  // 2. Anya PERCEIVES — a plain engage with the live window, exactly what the
  //    directive's perceive step now asks for. Does she see Cyrus pending?
  const anyaPerceive = await engage({ agent_id: 'anya', since_position: 0, with_liquid: true });
  check('perceive surfaces the LIVE WINDOW (Cyrus pending, before any resolution)',
    /# Liquid/.test(anyaPerceive) && /cyrus/.test(anyaPerceive) && /watches the room/.test(anyaPerceive),
    'Anya can see Cyrus is here and what he is doing');
  check('the pool is still empty at perceive (nothing frozen yet)',
    /Contributions since position 0 \(count: 0\)/.test(anyaPerceive));

  // 3. Anya acts — her intention joins the window → now TWO live intentions.
  const anyaSubmit = await engage({ agent_id: 'anya', submit: ANYA_ACT, face: 'character', with_liquid: true });
  const twoAuthors = /# Liquid — pending, not yet committed \(2 authors\)/.test(anyaSubmit);
  check('a second submission makes a 2-intention window', twoAuthors);
  const dice = /# Window dice/.test(anyaSubmit) && /cyrus:/.test(anyaSubmit) && /anya:/.test(anyaSubmit);
  check('the envelope hands per-actor dice for BOTH actors', dice, 'co-presence-close has what it needs to resolve together');

  // 4. The open-stamp the resolver claims with.
  const liq = (await loadBlock(BEACH, `liquid:pool:${ROOM}`))?.block ?? null;
  const openTs = windowOpenTs(liq);
  check('the window carries an open-stamp to claim', !!openTs, openTs ?? '(none)');

  // 5. Anya (the one who completed the gather) resolves it — ONE shared skeleton.
  const SKELETON = 'The woman at the bench turns to the man by the fire and asks whether the south road is open; he takes her measure before he answers, the question landing plainly between them.';
  const resolveAck = await engage({ agent_id: 'anya', contribution: SKELETON, resolves_window: openTs!, since_position: 0 });
  check('resolving the 2-intention window commits ONE shared skeleton', /committed: slot/.test(resolveAck));

  // 6. A second resolver on the same window must STAND DOWN (single-resolution).
  const second = await engage({ agent_id: 'fenn', contribution: 'a different, conflicting account', resolves_window: openTs!, since_position: 0 });
  check('single-resolution stands a second resolver down', /already resolved/i.test(second) && !/committed: slot/.test(second));

  // 7. Clear the resolved slots (as the directive's resolver does), then Cyrus perceives.
  await engage({ agent_id: 'cyrus', submit: '' });
  await engage({ agent_id: 'anya', submit: '' });
  const cyrusPerceive = await engage({ agent_id: 'cyrus', since_position: 0, with_liquid: true });
  check('Cyrus then perceives the SHARED beat in the pool (the meeting reaches him)',
    /south road is open/.test(cyrusPerceive) && /count: 1/.test(cyrusPerceive));

  console.log(`\n[check] ${pass} passed, ${fail} failed`);
  await fs.rm(dir, { recursive: true, force: true });
  if (fail) process.exitCode = 1;
}

main().catch((e) => { console.error('[check] ERROR', e?.stack || e); process.exitCode = 1; }).finally(() => { if (beachProc) beachProc.kill(); });
