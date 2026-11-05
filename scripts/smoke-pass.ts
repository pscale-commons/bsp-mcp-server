/**
 * smoke-pass.ts — the router at a MEMBERS' BEACH (pscale-beach's gate; protocol 2.8;
 * src/pass.ts): a stranger is given the beach's line and the way through; a call that
 * carries the latch proof is proved once and its pass kept for the session; every later
 * call of that session carries it; another session is a stranger again.
 *
 * Runs the REAL beach handler offline (pscale-beach's scripts/local-beach.mjs on a scratch
 * folder, with BEACH_GATE=members) and drives this tree's handleBsp against it — and the keys,
 * grain and settle tools, which stand at the same door.
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
    ok('a room behind the wall', (await post('pool:hall', { spindle: '', content: { _: 'The hall — a room behind the wall, where the members meet.' } })).status === 200);
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
    t = text(await handleBsp({ agent_id: ORIGIN, block: 'days:ada' } as any, S1));
    ok('…and the reflection tells it to the others as a look at 3, never a write (router 9)', /looked at 3/.test(t) && !/wrote at 3/.test(t), t);

    console.log('\nevery tool stands at the door');
    const { handleKeyPublish } = await import('../src/tools/keys.js');
    const { handleGrainReach } = await import('../src/tools/grain.js');
    const { handleSettle } = await import('../src/tools/collective.js');
    t = text(await handleKeyPublish({ handle: 'ada', secret: 'A1', agent_id: ORIGIN }, S1));
    ok('session one, already proved, publishes her halves with no second step', !/members' beach/.test(t) && /passport:ada|9|published/i.test(t), t);
    const S4 = { sessionId: 'smoke-pass-four' };
    t = text(await handleKeyPublish({ handle: 'ada', secret: 'A1', agent_id: ORIGIN }, S4));
    ok('a fresh session publishing with her secret is proved on the way', /✓ a pass for ada/.test(t) && !/members' beach/.test(t), t);
    t = text(await handleKeyPublish({ handle: 'ada', secret: 'WRONG', agent_id: ORIGIN }, S3));
    ok('a wrong secret publishes nothing: the beach\'s line', /members' beach/.test(t), t);
    const S5 = { sessionId: 'smoke-pass-five' };
    t = text(await handleGrainReach({ handle: 'ada', partner_handle: 'keeper', description: 'a channel', my_side_content: 'hello keeper', my_passphrase: 'A1', agent_id: ORIGIN }, S5));
    ok('a grain reach with her passphrase is proved on the way and lands', /✓ a pass for ada/.test(t) && !/members' beach/.test(t) && /grain:/.test(t), t);
    t = text(await handleSettle({ collective: 'circle', declaration: 'here', passphrase: 'A1', agent_id: ORIGIN }, S5));
    ok('session five, now holding a pass, settles with it', !/members' beach/.test(t) && /settled|position|sed:circle/i.test(t), t);
    t = text(await handleSettle({ collective: 'circle', declaration: 'here too', passphrase: 'new-position-latch', agent_id: ORIGIN }, S3));
    ok('a stranger\'s settle is given the line: a position\'s latch proves no passport', /members' beach/.test(t), t);

    // The doors' battery, router 4 (proposals/2026-11-05-the-doors-fixes-router.md).
    console.log('\nthe refusal names the way in, and comes back as the error it is');
    const { handlePoolEngage } = await import('../src/tools/pool.js');
    const N = { sessionId: 'smoke-pass-newcomer' };
    let r: any = await handleBsp({ agent_id: ORIGIN, block: 'passport:newcomer', content: { _: 'NEW' }, new_lock: 'newcomer-latch' } as any, N);
    t = text(r);
    ok('a newcomer founding a passport through an AI is refused as an error', r.isError === true && /members' beach/.test(t), t);
    ok('…and told the way in: a member\'s invitation, taken at the String\'s join on the beach\'s own site', /a member of this beach sends an invitation/.test(t) && /the String's join on the beach's own site/.test(t) && /no AI app can take an invitation/.test(t), t);
    r = await handleBsp({ agent_id: ORIGIN, block: 'days:ada' } as any, N);
    ok("a stranger's read is the same error", r.isError === true && /prove your passport once/.test(text(r)), text(r));
    r = await handlePoolEngage({ agent_id: 'newcomer', pool_url: ORIGIN, pool_name: 'hall' } as any, N);
    ok("the room tool's refusal is the door's own, as an error", r.isError === true && /members' beach/.test(text(r)), text(r));
    r = await handleBsp({ agent_id: ORIGIN, block: 'days:ada' } as any, S1);
    ok('a member with a pass is never refused', r.isError !== true && /a sealed day/.test(text(r)), text(r));

    // The doors' battery, router 1: the play door reads the index through the door, so behind
    // a wall a keyed hand enters the table, and a stranger meets the one refusal, never EMPTY.
    // The lighthouse is marked beyond here, so no refused block reads before the index does.
    console.log('\nthe play door behind the wall');
    const { handlePlay } = await import('../src/tools/play.js');
    r = await handlePlay({ world: ORIGIN, handle: 'wanderer', room: 'hall' } as any, { sessionId: 'smoke-pass-play-stranger' });
    t = text(r);
    ok('a stranger at the walled table is given the door\'s one refusal, as an error, and never the EMPTY passage', r.isError === true && /members' beach/.test(t) && !/is EMPTY/.test(t) && !/The hall/.test(t), t);
    r = await handlePlay({ world: ORIGIN, handle: 'ada', room: 'hall', secret: 'A1' } as any, { sessionId: 'smoke-pass-play-ada' });
    t = text(r);
    ok('ada with her key enters the walled table: the index read proves once, and the room behind the wall is hers', r.isError !== true && /✓ a pass for ada/.test(t) && /The hall — a room behind the wall/.test(t) && !/is EMPTY/.test(t) && !/members' beach/.test(t), t.slice(0, 600));
    const { beachIndex } = await import('../src/tools/pool.js');
    const { atTheDoor } = await import('../src/pass.js');
    const listed = await atTheDoor({ session: 'smoke-pass-play-ada', handles: ['ada'] }, () => beachIndex(ORIGIN));
    ok('…and the session, holding the pass, reads the whole index with no key', listed.includes('days:ada') && listed.includes('passport:keeper'), listed.join(', '));
    const strangers = await atTheDoor({ session: 'smoke-pass-play-stranger', handles: ['wanderer'] }, () => beachIndex(ORIGIN));
    ok('…while a stranger\'s session reads only what is marked beyond', strangers.length === 1 && strangers[0] === 'lighthouse', strangers.join(', '));

    // A refused proof counts against the passport's wrong keys, and a call that reads on after
    // a refusal (the play door reads the lighthouse, then the index) would count a typo twice.
    const { proveAtDoor } = await import('../src/pass.js');
    let proofs = 0;
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (input: any, init?: any) => {
      if (init?.method === 'POST' && /"block":"passport:ada"/.test(String(init?.body)) && !/"content"/.test(String(init?.body))) proofs++;
      return realFetch(input, init);
    }) as typeof fetch;
    try {
      await atTheDoor({ session: 'smoke-pass-typo', handles: ['ada'], secret: 'a1' }, async () => { await proveAtDoor(ORIGIN, 5000); await proveAtDoor(ORIGIN, 5000); await beachIndex(ORIGIN); });
      ok('a refused proof is tried once a call, however many reads follow', proofs === 1, String(proofs));
      await atTheDoor({ session: 'smoke-pass-typo', handles: ['ada'], secret: 'a1' }, () => proveAtDoor(ORIGIN, 5000));
      ok('…and the next call tries again', proofs === 2, String(proofs));
    } finally {
      globalThis.fetch = realFetch;
    }

    console.log(`\n${passed} passed, ${failed} failed`);
  } finally {
    beach.kill();
    rmSync(dir, { recursive: true, force: true });
  }
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
