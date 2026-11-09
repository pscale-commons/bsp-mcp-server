/**
 * smoke-derived-latch.ts — THE DERIVED LATCH AT THE ROUTER (proposals/2026-11-05-the-derived-latch.md
 * §9: the cells L3, L4, L5, L13, L14 and L15, and the proof behind a wall). One word, two keys: where a
 * hand's passport says "latch: derived" at 9.3 and the string derives its halves, the router sends the
 * beach the latch derived from the word (src/latch.ts), never the word. Then the doors' second walk's two
 * router faults (proposals/2026-11-09-the-doors-battery-second-walk.md 6.1, 6.2): a session that read a
 * passport before its holder switched at the voice, and the key guard before a stream mirror is born.
 *
 * Runs the REAL beach handler offline — two local beaches from pscale-beach's scripts/local-beach.mjs,
 * one open with the wrong-key cap at three an hour and one a members' beach — and drives this tree's
 * handleBsp and handleKeyPublish against them, every key a throwaway made here.
 *
 *   BEACH_DIR=<a pscale-beach checkout> npm run smoke:derived-latch
 *   (default BEACH_DIR: ../pscale-beach beside this repository)
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const here = dirname(fileURLToPath(import.meta.url));
const BEACH_DIR = process.env.BEACH_DIR ?? resolve(here, '..', '..', 'pscale-beach');
const OPEN = 'http://127.0.0.1:8871', GATED = 'http://127.0.0.1:8872';
const wk = (o: string) => `${o}/.well-known/pscale-beach`;

let passed = 0, failed = 0;
const ok = (label: string, cond: boolean, detail = '') => {
  if (cond) { passed++; console.log(`  ✓ ${label}`); } else { failed++; console.error(`  ✗ ${label}${detail ? ' — ' + detail.slice(0, 400) : ''}`); }
};
async function post(o: string, block: string, body: any) {
  const r = await fetch(`${wk(o)}?block=${encodeURIComponent(block)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) as any };
}
async function get(o: string, block: string) {
  const r = await fetch(`${wk(o)}?block=${encodeURIComponent(block)}`);
  return r.status === 200 ? await r.json() as any : null;
}
async function up(o: string) {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(wk(o)); if (r.status < 500) return true; } catch { /* not up */ }
    await new Promise((res) => setTimeout(res, 250));
  }
  return false;
}
function beach(port: number, base: string, env: Record<string, string>): { proc: ChildProcess; dir: string } {
  const dir = mkdtempSync(join(os.tmpdir(), 'derived-latch-'));
  const proc = spawn('node', [join(BEACH_DIR, 'scripts', 'local-beach.mjs'), '--dir', dir, '--port', String(port), '--origin', base], {
    stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, ...env },
  });
  return { proc, dir };
}

// Throwaway words, made for this run.
const W_ADA = 'rowan-pier-swallow-plover-41', W_BOB = 'flint-harbour-lotus-77', W_CY = 'cedar-lamp-quiet-river-12', W_DEE = 'birch-cove-ember-58';
const W_EVE = 'heron-slate-meadow-33', W_FIN = 'kelp-orchard-lantern-64', W_GUS = 'moss-anvil-tide-29', W_HAL = 'quill-dune-harrow-85';
const PROJECT = 'a-shared-project-lock-for-the-smoke', OTHER = 'a-delegated-latch-for-the-smoke';

async function main() {
  if (!existsSync(join(BEACH_DIR, 'scripts', 'local-beach.mjs'))) { console.error(`no local beach under ${BEACH_DIR} — set BEACH_DIR to a pscale-beach checkout`); process.exit(2); }
  const open = beach(8871, 'open.latch.test', { BEACH_CAPS: 'on' });
  const gated = beach(8872, 'gated.latch.test', { BEACH_GATE: 'members', BEACH_GATE_SECRET: 'smoke-derived-latch-gate', BEACH_KEEPERS: 'keeper' });
  try {
    if (!await up(OPEN) || !await up(GATED)) { console.error('a local beach did not start'); process.exit(2); }

    // ── the open beach, before any switch: ada's estate on her word ──
    const at = (block: string, body: any) => post(OPEN, block, { spindle: '', ...body });
    await at('settings', { content: { _: 'the beach settings', 8: { _: "the door's caps", 4: 'cap_wrong_keys_per_hour=3' } }, new_lock: 'OP' });
    await at('passport:ada', { content: { _: 'ADA' }, new_lock: W_ADA });
    await at('now:ada', { content: { _: 'ada now' }, new_lock: W_ADA });
    await at('days:ada', { content: { _: 'ada days' }, new_lock: W_ADA });
    await at('pool:ada', { content: { _: 'a room, open' } });
    await at('notes:ada', { content: { _: 'notes under a delegated latch' }, new_lock: OTHER, secret: W_ADA });
    await at('lab:probe', { content: { _: 'a block ada latched, named for nobody' }, new_lock: W_ADA });
    await at('spine:shared', { content: { _: 'a family under a shared lock' }, new_lock: PROJECT });
    await at('passport:bob', { content: { _: 'BOB' }, new_lock: W_BOB });
    await at('now:bob', { content: { _: 'bob now' }, new_lock: W_BOB });

    process.env.DEFAULT_BEACH = OPEN;
    const { handleBsp } = await import('../src/tools/bsp.js');
    const { handleKeyPublish } = await import('../src/tools/keys.js');
    const { deriveLatch, deriveKeypair, formatPublicKeys, publicKeysToSpine, latchDerivations } = await import('../src/keys.js');
    const { declareHand } = await import('../src/looks.js');
    const { installSignedIn } = await import('../src/signin.js');
    const text = (r: any) => r.content.map((c: any) => c.text).join('\n');
    const bsp = async (p: any, s: string) => text(await handleBsp({ agent_id: OPEN, ...p } as any, { sessionId: s }));
    const publish = async (p: any, s: string) => text(await handleKeyPublish({ handle: 'ada', secret: W_ADA, agent_id: OPEN, ...p } as any, { sessionId: s }));
    const L = await deriveLatch(W_ADA, 'ada');
    const keyless = (t: string) => !t.includes(W_ADA) && !t.includes(L);

    console.log('\nL3 · before the switch, the word goes as it is');
    ok("ada's halves published at passport 9", /Keys published/.test(await publish({}, 's0')));
    let t = await bsp({ block: 'now:ada', spindle: '1', content: 'before the switch', secret: W_ADA }, 's1');
    ok('a write with the word lands while no marker stands', (await get(OPEN, 'now:ada'))?.['1'] === 'before the switch', t);

    console.log('\nL5 · the switch, through pscale_key_publish');
    t = await publish({ latch: 'derived' }, 's2');
    ok('it says the switch ran, and its reply holds no key', /Switched:/.test(t) && keyless(t), t);
    const p9 = (await get(OPEN, 'passport:ada'))?.['9'];
    ok('9.3 says the latch is derived, and that the sweep ran', typeof p9?.['3'] === 'string' && /^latch: derived\b/.test(p9['3']) && / · swept \d{4}-/.test(p9['3']), JSON.stringify(p9));
    ok('the halves at 9.1 and 9.2 are unchanged', p9?.['2'] === formatPublicKeys(await deriveKeypair(W_ADA, 'ada')).x25519);
    for (const b of ['passport:ada', 'now:ada', 'days:ada']) {
      ok(`${b}: the word is refused now, the derived latch taken`, (await post(OPEN, b, { spindle: '7', content: 'x', secret: W_ADA })).status === 403 && (await post(OPEN, b, { spindle: '7', content: 'y', secret: L })).status === 200);
    }
    ok('the open room is left open: a keyless write still lands', (await post(OPEN, 'pool:ada', { spindle: '1', content: 'a voice' })).status === 200);
    ok("the block under another key is left on it", (await post(OPEN, 'notes:ada', { spindle: '1', content: 'x', secret: OTHER })).status === 200);
    ok('a block named for nobody is not swept', (await post(OPEN, 'lab:probe', { spindle: '9', content: 'x', secret: W_ADA })).status === 200);

    console.log('\nL3 · after the switch, the router sends the derived latch');
    t = await bsp({ block: 'now:ada', spindle: '2', content: 'after the switch', secret: W_ADA }, 's3');
    ok('a write with the word lands, so the beach was sent the derived latch', (await get(OPEN, 'now:ada'))?.['2'] === 'after the switch', t);
    declareHand('s3', 'ada');
    t = await bsp({ block: 'spine:shared', spindle: '1', content: 'a line under the shared lock', secret: PROJECT }, 's3');
    ok("a shared lock in ada's session goes as it is: it derives no hand's halves", (await get(OPEN, 'spine:shared'))?.['1'] === 'a line under the shared lock', t);
    t = await bsp({ block: 'now:bob', spindle: '1', content: 'bob, not switched', secret: W_BOB }, 's3');
    ok("an unswitched hand's word goes as it is", (await get(OPEN, 'now:bob'))?.['1'] === 'bob, not switched', t);
    const before = latchDerivations.count;
    for (let i = 3; i <= 5; i++) await bsp({ block: 'now:ada', spindle: String(i), content: `line ${i}`, secret: W_ADA }, 's4');
    ok('one latch derivation a session, however many writes', latchDerivations.count - before === 1, String(latchDerivations.count - before));

    console.log('\nL13 · after the sweep, the word goes only when the holder asks');
    declareHand('s5', 'ada');
    t = await bsp({ block: 'lab:probe', spindle: '1', content: 'from the lab', secret: W_ADA }, 's5');
    ok('a block the sweep did not reach is refused with its name, and how to move it', /lab:probe still answers to ada's word/.test(t) && /pscale_key_publish/.test(t), t);
    ok('…and nothing was written there', (await get(OPEN, 'lab:probe'))?.['1'] === undefined);
    t = await publish({ latch: 'derived' }, 's5');
    ok('the switch run again moves it, and costs nothing for what it moved before', /1 moved/.test(t) && /moved already/.test(t), t);
    t = await bsp({ block: 'lab:probe', spindle: '1', content: 'from the lab', secret: W_ADA }, 's5');
    ok('then the write lands', (await get(OPEN, 'lab:probe'))?.['1'] === 'from the lab', t);

    console.log('\nL4 · the derived latch never comes back in a reply, and never rides in content');
    const tools: Record<string, (...a: any[]) => Promise<any>> = {};
    const stub: any = { tool: (...args: any[]) => { tools[args[0]] = args[args.length - 1]; } };
    installSignedIn(stub);
    stub.tool('echo', 'a tool whose reply holds the latch', { secret: z.string().optional() }, {}, async () => ({ content: [{ type: 'text', text: `the latch is ${L} and the word is ${W_ADA}` }] }));
    const r = await tools.echo({}, { sessionId: 'signed', authInfo: { token: 't', clientId: 'c', scopes: ['bsp'], extra: { signedIn: { handle: 'ada', key: W_ADA } } } });
    ok("a signed reply has the word and the derived latch taken out", keyless(text(r)) && (text(r).match(/\[this connection's key\]/g) ?? []).length === 2, text(r));
    t = await bsp({ block: 'now:ada', spindle: '6', content: `the latch is ${L}`, secret: W_ADA }, 's6');
    ok('a write whose content holds the derived latch is refused before sending', /refused before sending/.test(t), t);

    console.log('\nL14 · the switch back');
    t = await publish({ latch: 'word' }, 's7');
    const back9 = (await get(OPEN, 'passport:ada'))?.['9'];
    ok('it says so, 9.3 is gone and the halves stand', /Switched back/.test(t) && back9 && back9['3'] === undefined && typeof back9['2'] === 'string', t);
    ok('the word is taken again and the derived latch refused', (await post(OPEN, 'days:ada', { spindle: '8', content: 'x', secret: W_ADA })).status === 200 && (await post(OPEN, 'days:ada', { spindle: '8', content: 'y', secret: L })).status === 403);

    console.log('\nL15 · a host that lies');
    ok('switched again', /Switched:/.test(await publish({ latch: 'derived' }, 's8')));
    await bsp({ block: 'now:ada', spindle: '8', content: 'seen switched', secret: W_ADA }, 's8');
    const halves = publicKeysToSpine(formatPublicKeys(await deriveKeypair(W_ADA, 'ada')));
    ok("the host strips 9.3 from ada's passport", (await post(OPEN, 'passport:ada', { spindle: '9', content: halves, secret: L })).status === 200);
    t = await bsp({ block: 'now:ada', spindle: '9', content: 'told a lie', secret: W_ADA }, 's9');
    ok('the router sends nothing, and says why', /no longer says ada's key is derived/.test(t) && /nothing was sent/.test(t), t);
    ok('…and nothing was written', (await get(OPEN, 'now:ada'))?.['9'] === undefined);

    console.log('\nthe proof behind a wall');
    const L_CY = await deriveLatch(W_CY, 'cy');
    const cy9 = { ...publicKeysToSpine(formatPublicKeys(await deriveKeypair(W_CY, 'cy'))), '3': `latch: derived — this word reaches a beach only as the latch derived from it (seal.js latch: Argon2id, salt latch:cy), never as itself · since 2026-11-05T17:00:00Z · swept 2026-11-05T17:00:00Z` };
    await post(GATED, 'passport:cy', { spindle: '', content: { _: 'CY', 9: cy9 }, new_lock: L_CY });
    await post(GATED, 'days:cy', { spindle: '', content: { _: 'cy days' }, new_lock: L_CY });
    await post(GATED, 'passport:dee', { spindle: '', content: { _: 'DEE' }, new_lock: W_DEE });
    await post(GATED, 'days:dee', { spindle: '', content: { _: 'dee days' }, new_lock: W_DEE });
    ok('settings latched: the gate is up', (await post(GATED, 'settings', { spindle: '', content: { _: 'the beach settings' }, new_lock: 'OP' })).status === 200);
    const g = async (block: string, secret: string, s: string) => text(await handleBsp({ agent_id: GATED, block, secret } as any, { sessionId: s }));
    t = await g('days:cy', W_CY, 'g1');
    ok("a switched member's word, through the router, proves with the derived latch and reads", /a pass for cy/.test(t) && /cy days/.test(t), t);
    ok('…and the beach takes no proof with the word, so the router never sent it as the proof', (await post(GATED, 'passport:cy', { secret: W_CY })).status === 403);
    t = await g('days:cy', W_CY, 'g2');
    ok('a later session proves at once in the form that worked', /a pass for cy/.test(t), t);
    t = await g('days:dee', W_DEE, 'g3');
    ok("an unswitched member proves with the word, after the derived latch is refused", /a pass for dee/.test(t) && /dee days/.test(t), t);

    // ── the doors' second walk, 6.1: a session older than a switch made at the voice ──
    // eve, fin and gus switch by the beach's own writes, as the voice's switch makes them: the marker
    // under the word, the roots rotated onto the derived latch, the marker swept. No router switch runs,
    // so no session here forgets its read of their passports. A tap on fetch counts what the router sends.
    const { markerText } = await import('../src/latch.js');
    const tap: Array<{ method: string; block: string; status: number; secret?: string }> = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (input: any, init: any = {}) => {
      const r = await realFetch(input, init);
      try {
        let secret: string | undefined;
        try { secret = JSON.parse(init.body ?? 'null')?.secret; } catch { /* not JSON */ }
        tap.push({ method: String(init.method ?? 'GET').toUpperCase(), block: new URL(String(input)).searchParams.get('block') ?? '', status: r.status, secret });
      } catch { /* not a beach call */ }
      return r;
    }) as typeof fetch;
    const sent = (block: string, method: string) => tap.filter((x) => x.block === block && x.method === method);
    const T = '2026-11-09T17:00:00Z';
    const latchOf: Record<string, string> = {};
    for (const [h, w] of [['eve', W_EVE], ['fin', W_FIN], ['gus', W_GUS]]) {
      latchOf[h] = await deriveLatch(w, h);
      await at(`passport:${h}`, { content: { _: h.toUpperCase(), 9: publicKeysToSpine(formatPublicKeys(await deriveKeypair(w, h))) }, new_lock: w });
      await at(`now:${h}`, { content: { _: `${h} now` }, new_lock: w });
    }
    const atTheVoice = async (h: string, w: string) => [
      await post(OPEN, `passport:${h}`, { spindle: '9.3', content: markerText(h, T), secret: w }),
      await post(OPEN, `passport:${h}`, { secret: w, new_lock: latchOf[h] }),
      await post(OPEN, `now:${h}`, { secret: w, new_lock: latchOf[h] }),
      await post(OPEN, `passport:${h}`, { spindle: '9.3', content: markerText(h, T, T), secret: latchOf[h] }),
    ].every((x) => x.status === 200);
    const form = (xs: typeof tap, h: string, w: string) => xs.map((x) => `${x.status} ${x.secret === w ? 'word' : x.secret === latchOf[h] ? 'latch' : 'other'}`).join(', ');

    console.log('\nL11 · a session that read the passport before a switch at the voice (the second walk, 6.1)');
    t = await bsp({ block: 'now:eve', spindle: '1', content: 'before the switch', secret: W_EVE }, 'eve-old');
    ok("eve-old writes with eve's word before any switch, reading her passport", (await get(OPEN, 'now:eve'))?.['1'] === 'before the switch', t);
    ok('eve switches at the voice: the marker, the roots onto the derived latch, swept', await atTheVoice('eve', W_EVE));
    tap.length = 0;
    t = await bsp({ block: 'now:eve', spindle: '2', content: 'after a switch elsewhere', secret: W_EVE }, 'eve-old');
    const ePosts = sent('now:eve', 'POST');
    ok('eve-old sends the word once and meets one refusal', ePosts.length === 2 && ePosts[0].status === 403 && ePosts[0].secret === W_EVE, form(ePosts, 'eve', W_EVE));
    ok('…reads the passport once more', sent('passport:eve', 'GET').length === 1, String(sent('passport:eve', 'GET').length));
    ok('…and the write lands under the derived latch', ePosts[1]?.status === 200 && ePosts[1]?.secret === latchOf.eve && (await get(OPEN, 'now:eve'))?.['2'] === 'after a switch elsewhere', t);
    ok('…with no word of a host that lies, and no key in the reply', !/no longer says/.test(t) && !t.includes(W_EVE) && !t.includes(latchOf.eve), t);
    tap.length = 0;
    t = await bsp({ block: 'now:eve', spindle: '3', content: 'and on', secret: W_EVE }, 'eve-old');
    ok('its next write goes in the new form at once', form(sent('now:eve', 'POST'), 'eve', W_EVE) === '200 latch' && sent('passport:eve', 'GET').length === 0, form(sent('now:eve', 'POST'), 'eve', W_EVE));

    console.log('\n…the same, once this process has seen the switch in another session');
    t = await bsp({ block: 'now:fin', spindle: '1', content: 'before the switch', secret: W_FIN }, 'fin-old');
    ok("fin-old writes with fin's word before any switch, reading his passport", (await get(OPEN, 'now:fin'))?.['1'] === 'before the switch', t);
    ok('fin switches at the voice', await atTheVoice('fin', W_FIN));
    t = await bsp({ block: 'now:fin', spindle: '2', content: 'a session after the switch', secret: W_FIN }, 'fin-new');
    ok('a session that reads after the switch writes under the derived latch, so the process holds fin switched', (await get(OPEN, 'now:fin'))?.['2'] === 'a session after the switch', t);
    tap.length = 0;
    t = await bsp({ block: 'now:fin', spindle: '3', content: 'the older session again', secret: W_FIN }, 'fin-old');
    ok('fin-old reads the passport once more before it doubts the beach', sent('passport:fin', 'GET').length === 1, String(sent('passport:fin', 'GET').length));
    ok('…and its write lands under the derived latch, with no refusal and no word of a host that lies', form(sent('now:fin', 'POST'), 'fin', W_FIN) === '200 latch' && (await get(OPEN, 'now:fin'))?.['3'] === 'the older session again' && !/no longer says/.test(t), `${form(sent('now:fin', 'POST'), 'fin', W_FIN)} — ${t}`);

    console.log('\n…and a fresh read that truly lacks the marker is still a host that lies (L15)');
    await bsp({ block: 'now:gus', spindle: '1', content: 'before the switch', secret: W_GUS }, 'gus-old');
    ok('gus switches at the voice', await atTheVoice('gus', W_GUS));
    await bsp({ block: 'now:gus', spindle: '2', content: 'a session after the switch', secret: W_GUS }, 'gus-new');
    ok('a session after the switch writes, so the process holds gus switched', (await get(OPEN, 'now:gus'))?.['2'] === 'a session after the switch');
    ok("the host strips 9.3 from gus's passport", (await post(OPEN, 'passport:gus', { spindle: '9', content: publicKeysToSpine(formatPublicKeys(await deriveKeypair(W_GUS, 'gus'))), secret: latchOf.gus })).status === 200);
    tap.length = 0;
    t = await bsp({ block: 'now:gus', spindle: '3', content: 'told a lie', secret: W_GUS }, 'gus-old');
    ok('gus-old reads the passport once more, finds no marker, and refuses with the words for a host that lies', sent('passport:gus', 'GET').length === 1 && /no longer says gus's key is derived/.test(t) && /nothing was sent/.test(t), t);
    ok('…and nothing was sent', sent('now:gus', 'POST').length === 0 && (await get(OPEN, 'now:gus'))?.['3'] === undefined);
    globalThis.fetch = realFetch;

    // ── the doors' second walk, 6.2: the key guard before a mirror is born ──
    console.log('\nthe key guard meets a say before its mirror is born (the second walk, 6.2)');
    await at('spine:probe-say', { content: { _: 'a probe family for the guard', 1: 'one' } });
    const { handleStreamEngage } = await import('../src/tools/stream.js');
    const engage = async (p: any) => text(await handleStreamEngage({ field: 'probe-say', beach: OPEN, at: '1', handle: 'hal', secret: W_HAL, ...p } as any, { sessionId: 'hal' }));
    t = await engage({ say: `my word is ${W_HAL}` });
    ok('a say carrying its own key is refused before sending, and the refusal holds no key', /refused before sending/.test(t) && !t.includes(W_HAL), t);
    ok("…and hal's mirror was never born", (await get(OPEN, 'probe-say:hal')) === null);
    t = await engage({ say: 'a plain line', options: [`take ${W_HAL}`] });
    ok('an option carrying it is refused the same way, and still no mirror', /refused before sending/.test(t) && (await get(OPEN, 'probe-say:hal')) === null, t);
    t = await engage({ keep: 'personal', keep_text: `a fold naming ${W_HAL}` });
    ok('a keep carrying it is refused, and no tree is born for it', /refused before sending/.test(t) && (await get(OPEN, 'tree:probe-say:hal')) === null, t);
    t = await engage({ say: 'a plain line' });
    ok("a clean say founds hal's mirror latched to the key, and lands", (await get(OPEN, 'probe-say:hal'))?.['1'] === 'a plain line' && (await post(OPEN, 'probe-say:hal', { spindle: '1', content: 'someone else' })).status === 403, t);
  } finally {
    for (const b of [open, gated]) { b.proc.kill(); rmSync(b.dir, { recursive: true, force: true }); }
  }
  console.log(`\nderived latch: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
