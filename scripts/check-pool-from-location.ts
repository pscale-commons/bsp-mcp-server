/**
 * check-pool-from-location.ts — pool is derived from a character's location.
 * Spins a local beach with two locations (1, 6), two pools (pool:1, pool:6),
 * two characters, and asserts pscale_play derives each one's room from its
 * passport:3 location — and that a MOVE (rewriting passport:3) re-derives the pool.
 * A third character stands where no room is yet: the door opens it on the play
 * loop and the room is born declared (convention:<addr> = grit), while the rooms
 * that already stood are never declared by a later visit.
 * No live beach, no key, no deploy.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handlePlay } from '../src/tools/play.js';

const BEACH_REPO = process.env.BEACH_REPO || fileURLToPath(new URL('../../pscale-beach', import.meta.url));
const PORT = parseInt(process.env.POOL_PORT || '8811', 10);
const BEACH = `http://localhost:${PORT}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function post(name: string, content: any): Promise<void> {
  await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(name)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spindle: '', content, confirm: true }),
  });
}
const loc = (a: string) => `*:${BEACH}:spatial:test:${a}`;
const roomOf = (env: string) => (env.match(/pool:([\w-]+) @/) || [])[1] || '(none)';

async function main() {
  const dir = await fs.mkdtemp(join(os.tmpdir(), 'poolloc-'));
  const proc: ChildProcess = spawn('node', [join(BEACH_REPO, 'scripts/local-beach.mjs'), '--dir', dir, '--port', String(PORT), '--origin', `localhost:${PORT}`], { stdio: ['ignore', 'ignore', 'ignore'] });
  try {
    for (let i = 0; i < 60; i++) { try { if ((await fetch(`${BEACH}/.well-known/pscale-beach`)).ok) break; } catch { /* not up */ } await sleep(150); }
    // two location-keyed rooms + two characters at different locations
    await post('pool:1', { _: 'pscale:grit' }); await post('liquid:pool:1', { _: 'staging' });
    await post('pool:6', { _: 'pscale:grit' }); await post('liquid:pool:6', { _: 'staging' });
    await post('passport:alice', { _: 'Alice.', '1': 'CF ~8.', '2': 'x', '3': `Alice stands by the hearth. Location: ${loc('1')}` });
    await post('passport:bob', { _: 'Bob.', '1': 'CF ~8.', '2': 'x', '3': `Bob waits at the crossroads. Location: ${loc('6')}` });
    await post('spatial:test', { _: 'A test town.', '1': 'The hearth.', '3': 'The mill, where nobody has yet walked.', '6': 'The crossroads.' });
    await post('passport:carol', { _: 'Carol.', '1': 'CF ~8.', '2': 'x', '3': `Carol stands at the mill. Location: ${loc('3')}` });

    const aliceRoom = roomOf((await handlePlay({ world: BEACH, handle: 'alice' } as any)).content[0].text);
    const bobRoom = roomOf((await handlePlay({ world: BEACH, handle: 'bob' } as any)).content[0].text);
    // MOVE alice 1 -> 6 (a write to passport:3) and re-derive
    await post('passport:alice', { _: 'Alice.', '1': 'CF ~8.', '2': 'x', '3': `Alice has crossed to the crossroads. Location: ${loc('6')}` });
    const aliceMovedEnv = (await handlePlay({ world: BEACH, handle: 'alice' } as any)).content[0].text;
    const aliceRoom2 = roomOf(aliceMovedEnv);
    const seesBob = /WHO IS HERE[\s\S]*crossroads/i.test(aliceMovedEnv);

    // carol stands where no room is: the door opens pool:3 and it is born declared
    const carolRoom = roomOf((await handlePlay({ world: BEACH, handle: 'carol' } as any)).content[0].text);
    const read = async (name: string) => { const r = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(name)}`); return r.ok ? await r.json() : null; };
    const under = (b: any): string => { let n = b?.block ?? b; while (n && typeof n === 'object') n = n._; return typeof n === 'string' ? n : ''; };
    const born = under(await read('convention:3'));
    const old1 = await read('convention:1');

    const checks: [string, boolean][] = [
      [`alice @ location 1 → pool:${aliceRoom}`, aliceRoom === '1'],
      [`bob   @ location 6 → pool:${bobRoom}`, bobRoom === '6'],
      [`alice MOVES 1→6 → pool:${aliceRoom2} (move re-derives the pool)`, aliceRoom2 === '6'],
      [`alice now co-present with bob at the crossroads`, seesBob],
      [`carol @ location 3, no room yet → the door opens pool:${carolRoom}`, carolRoom === '3'],
      [`the room is born declared → convention:3 = "${born.slice(0, 24)}…"`, /^grit\b/.test(born)],
      [`a room that already stood is never declared by a visit (convention:1 absent)`, old1 === null],
    ];
    for (const [m, ok] of checks) console.log(`  ${ok ? 'PASS' : 'FAIL'} · ${m}`);
    const allOk = checks.every(([, ok]) => ok);
    console.log(`\n${allOk ? '✅ pool derives from location; movement re-derives it; co-presence follows.' : '❌ FAILED'}`);
    process.exitCode = allOk ? 0 : 1;
  } finally {
    proc.kill();
    await fs.rm(dir, { recursive: true, force: true });
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
