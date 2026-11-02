/**
 * smoke-pass.ts — the router at a MEMBERS' BEACH (pscale-beach's gate; protocol 2.8;
 * src/pass.ts): a stranger is given the beach's line and the way through; a call that
 * carries the latch proof is proved once and its pass kept for the session; every later
 * call of that session carries it; another session is a stranger again.
 *
 * Runs the REAL beach handler offline (pscale-beach's scripts/local-beach.mjs on a scratch
 * folder, with BEACH_GATE=members) and drives this tree's handleBsp against it.
 *
 *   BEACH_DIR=<a pscale-beach checkout at or after the members' gate> npm run smoke:pass
 *   (default BEACH_DIR: ../pscale-beach beside this repository)
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const BEACH_DIR = process.env.BEACH_DIR ?? resolve(here, '..', '..', 'pscale-beach');
const PORT = 8841;
const BASE = 'gated.test';
const ORIGIN = `http://127.0.0.1:${PORT}`;
const W = `${ORIGIN}/.well-known/pscale-beach`;

let passed = 0, failed = 0;
const ok = (label: string, cond: boolean, detail = '') => {
  if (cond) { passed++; console.log(`  ✓ ${label}`); } else { failed++; console.error(`  ✗ ${label}${detail ? ' — ' + detail.slice(0, 300) : ''}`); }
};

async function post(block: string, body: any, headers: Record<string, string> = {}) {
  const r = await fetch(`${W}?block=${encodeURIComponent(block)}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function ready() {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(W); if (r.status < 500) return true; } catch { /* not up */ }
    await new Promise((res) => setTimeout(res, 250));
  }
  return false;
}

async function main() {
  const script = join(BEACH_DIR, 'scripts', 'local-beach.mjs');
  if (!existsSync(script)) { console.error(`no local beach at ${script} — set BEACH_DIR to a pscale-beach checkout`); process.exit(2); }
  const dir = mkdtempSync(join(os.tmpdir(), 'pass-'));
  const beach = spawn('node', [script, '--dir', dir, '--port', String(PORT), '--origin', BASE], {
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, BEACH_GATE: 'members', BEACH_GATE_SECRET: 'smoke-gate-secret', BEACH_KEEPERS: 'keeper' },
  });
  try {
    if (!await ready()) { console.error('the local beach did not start'); process.exit(2); }
    // the place, before the gate comes up
    ok('keeper founds their passport', (await post('passport:keeper', { spindle: '', content: { _: 'KEEPER' }, new_lock: 'K1' })).status === 200);
    ok('ada founds her passport', (await post('passport:ada', { spindle: '', content: { _: 'ADA' }, new_lock: 'A1' })).status === 200);
    ok('the lighthouse, open', (await post('lighthouse', { spindle: '', content: { _: 'LIGHT' } })).status === 200);
    ok("the keeper's index marks the lighthouse beyond", (await post('index:keeper', { spindle: '', new_lock: 'K1', content: { _: "the keepers' index",
      '1': { _: 'lighthouse', '5': 'beyond' }, '2': { _: 'passport:keeper', '5': 'beach' }, '3': { _: 'index:keeper', '5': 'beach' }, '4': { _: 'settings', '5': 'beach' } } })).status === 200);
    ok("ada's days, under her key", (await post('days:ada', { spindle: '', content: { _: 'a sealed day' }, new_lock: 'A1' })).status === 200);
    ok('settings latched: the gate is up', (await post('settings', { spindle: '', content: { _: 'the beach settings' }, new_lock: 'OP' })).status === 200);
    ok('a raw stranger is refused', (await fetch(`${W}?block=days:ada`)).status === 401);

    process.env.DEFAULT_BEACH = ORIGIN;
    const { handleBsp } = await import('../src/tools/bsp.js');
    const text = (r: any) => r.content.map((c: any) => c.text).join('\n');
    const S1 = { sessionId: 'smoke-pass-one' }, S2 = { sessionId: 'smoke-pass-two' }, S3 = { sessionId: 'smoke-pass-three' };

    console.log('\nthe router at the gate');
    let t = text(await handleBsp({ agent_id: ORIGIN, block: 'days:ada' } as any, S1));
    ok('a stranger is given the beach\'s line and the way through', /members' beach/.test(t) && /prove your passport once/.test(t) && /passport:/.test(t), t);
    t = text(await handleBsp({ agent_id: ORIGIN, block: 'lighthouse' } as any, S1));
    ok('what the keeper marks beyond is read by anyone', /LIGHT/.test(t), t);
    t = text(await handleBsp({ agent_id: ORIGIN, block: '' } as any, S1));
    ok('the surface a stranger sees is the beyond subset', /lighthouse/.test(t) && !/days:ada/.test(t), t);

    t = text(await handleBsp({ agent_id: ORIGIN, block: 'passport:ada', secret: 'A1' } as any, S1));
    ok('a read of her passport with her secret proves it and earns a pass', /✓ a pass for ada/.test(t) && /ADA/.test(t), t);
    t = text(await handleBsp({ agent_id: ORIGIN, block: 'days:ada' } as any, S1));
    ok('the session now reads her days with no secret', /a sealed day/.test(t) && !/members' beach/.test(t), t);
    t = text(await handleBsp({ agent_id: ORIGIN, block: '' } as any, S1));
    ok('and sees the whole surface', /days:ada/.test(t) && /index:keeper/.test(t), t);
    t = text(await handleBsp({ agent_id: ORIGIN, block: 'days:ada', spindle: '1', content: 'a second day', secret: 'A1' } as any, S1));
    ok('and writes under her latch', /a second day/.test(t) && !/rejected|refused|members' beach/i.test(t), t);

    console.log('\nanother session is a stranger');
    t = text(await handleBsp({ agent_id: ORIGIN, block: 'days:ada' } as any, S2));
    ok('session two is refused', /members' beach/.test(t), t);
    t = text(await handleBsp({ agent_id: ORIGIN, block: 'days:ada', spindle: '2', content: 'a third day', secret: 'A1' } as any, S2));
    ok('a write that carries the latch is proved on the way and lands', /a third day/.test(t) && /✓ a pass for ada/.test(t), t);
    t = text(await handleBsp({ agent_id: ORIGIN, block: 'passport:ada', secret: 'WRONG' } as any, S3));
    ok('a wrong secret proves nothing: still the beach\'s line', /members' beach/.test(t) && !/✓ a pass/.test(t), t);
    t = text(await handleBsp({ agent_id: ORIGIN, block: 'days:ada', spindle: '3', content: 'x' } as any, S3));
    ok('a write with no secret at a members\' beach is refused with the line', /members' beach/.test(t), t);

    console.log(`\n${passed} passed, ${failed} failed`);
  } finally {
    beach.kill();
    rmSync(dir, { recursive: true, force: true });
  }
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
