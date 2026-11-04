/**
 * smoke-seal-price.ts — THE PRICE OF A SEAL: step 1 of coloured stigmergy
 * (proposals/2026-11-03-coloured-stigmergy-the-design.md §12; the measure, §4.4).
 *
 * A pair is derived once a session; a keyed read walks first and opens only the
 * sealed nodes its shape returns; a ring's copy is found by its holder's name;
 * and a sealed line a reader cannot open is one grey line in every shape but the
 * whole block. COUNTED, NEVER TIMED: derivations through the counter on keys.ts's
 * derive function, openings through a wrapper on nacl's secretbox.open.
 *
 *   - a thirty-copy ring, read by the holder of its thirtieth copy: one derivation
 *     with the session's hand at the door and none on the next read; thirty with
 *     no hand, as before, and none on the next read; one again once the session
 *     is forgotten (before this step: thirty on every read, hand or no hand);
 *   - a point read in a block of fifty sealed entries: one derivation and one
 *     opening; the disc at pscale 0 then opens fifty with no new derivation
 *     (before: fifty derivations and fifty openings for the point, the disc and
 *     the walk alike);
 *   - the grey line in point, walk, disc and descent; the fields beside an
 *     envelope still listed; the whole block byte-true; a key that opens nothing
 *     leaves the grey line; and the same line drawn from a wire shape, where the
 *     beach sends the envelope's note and its fields beneath it.
 *
 * No network: a fixture beach answers fetch, as smoke-gray-guard's does.
 * Run: npm run smoke:seal-price
 */

import nacl from 'tweetnacl';
import {
  deriveKeypair, formatPublicKeys, selfEncrypt, grainEncrypt, newGroupKey, wrapGroupKey, buildKeyring,
  groupEncryptContent, derivations, forgetDerived, GRAY_NOTES, GrayEnvelope,
} from '../src/keys.js';
import { handleBsp } from '../src/tools/bsp.js';
import { declareHand, resetLooks } from '../src/looks.js';
import { bspRead, formatRead } from '../src/bsp-fn.js';

let pass = 0, fail = 0;
const failures: string[] = [];
function check(label: string, cond: boolean, got?: unknown): void {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; failures.push(label); console.log(`  ✗ ${label}${got === undefined ? '' : `\n      got: ${String(typeof got === 'string' ? got : JSON.stringify(got)).slice(0, 400)}`}`); }
}

// openings, counted on the one function every self and group line opens through
const opens = { count: 0 };
const realOpen = nacl.secretbox.open;
nacl.secretbox.open = ((...a: Parameters<typeof realOpen>) => { opens.count++; return realOpen(...a); }) as typeof realOpen;
const bytesOf = (env: GrayEnvelope) => Buffer.from(env['1'], 'base64').length;

// the fixture beach: reads only, the raw block for any GET that names one
const ORIGIN = 'https://seal-price.test';
const store: Record<string, any> = {};
const answer = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = (async (input: any, init?: any) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  if (url.origin !== ORIGIN || !url.pathname.endsWith('/.well-known/pscale-beach')) return answer({ error: 'no beach here' }, 404);
  if ((init?.method ?? 'GET') !== 'GET') return answer({ error: 'this fixture is read-only' }, 400);
  const name = url.searchParams.get('block');
  if (!name) return answer({ _: 'fixture beach', origin: ORIGIN, blocks: Object.keys(store) });
  return name in store ? answer(store[name]) : answer({ error: 'not found' }, 404);
}) as typeof fetch;
const door = async (session: string, p: Record<string, unknown>) =>
  (await handleBsp({ agent_id: ORIGIN, ...p } as any, { sessionId: session })).content.map((c) => c.text).join('\n');

async function main(): Promise<void> {
  // ── 1. The ring of thirty ──────────────────────────────────────────────
  console.log('\n1. a thirty-copy ring, read by the holder of its thirtieth copy');
  const members = Array.from({ length: 30 }, (_, i) => ({ handle: `m${String(i + 1).padStart(2, '0')}`, word: `word of m${i + 1} at the fixture` }));
  const K = newGroupKey();
  const wraps = [];
  for (const m of members) wraps.push(wrapGroupKey(K, m.handle, formatPublicKeys(await deriveKeypair(m.word, m.handle)).x25519));
  store['group:ring'] = { _: 'a ring of thirty copies', '1': groupEncryptContent('the line the ring keeps', K), '9': buildKeyring(wraps) };
  const last = members[29];
  const ring = { block: 'group:ring', spindle: '1', pscale_attention: 0, enc_secret: last.word };
  resetLooks();
  declareHand('s-hand', last.handle);
  derivations.count = 0;
  const r1 = await door('s-hand', ring);
  console.log(`     hand at the door: ${derivations.count} derivation(s)`);
  check('the hand\'s own copy opens first: one derivation', derivations.count === 1, derivations.count);
  check('and the line reads', r1.includes('the line the ring keeps'), r1);
  await door('s-hand', ring);
  check('the next read of the session derives nothing', derivations.count === 1, derivations.count);
  derivations.count = 0;
  const r2 = await door('s-blind', ring);
  console.log(`     no hand: ${derivations.count} derivation(s)`);
  check('with no hand every copy is tried, as before: thirty derivations', derivations.count === 30 && r2.includes('the line the ring keeps'), derivations.count);
  await door('s-blind', ring);
  check('and each is kept, so the next read derives nothing', derivations.count === 30, derivations.count);
  forgetDerived('s-hand');
  derivations.count = 0;
  await door('s-hand', ring);
  check('a session forgotten derives again, once', derivations.count === 1, derivations.count);

  // ── 2. Fifty sealed entries ───────────────────────────────────────────
  console.log('\n2. a point read in a block of fifty sealed entries');
  const WORD = 'the word that seals fifty lines';
  const fifty: any = { _: { _: 'fifty sealed lines, nine to a container' } };
  let n = 0;
  for (let c = 1; c <= 6; c++) {
    const node: any = { _: `container ${c}` };
    for (let e = 1; e <= 9 && n < 50; e++) { n++; node[String(e)] = await selfEncrypt(`line at ${c}${e}`, WORD, ORIGIN); }
    fifty[String(c)] = node;
  }
  store['notes:fifty'] = fifty;
  const lines = Array.from({ length: 50 }, (_, i) => `line at ${Math.floor(i / 9) + 1}${(i % 9) + 1}`);
  derivations.count = 0; opens.count = 0;
  const p = await door('s-fifty', { block: 'notes:fifty', spindle: '25', pscale_attention: 0, enc_secret: WORD });
  console.log(`     point read of 25: ${derivations.count} derivation(s), ${opens.count} opening(s)`);
  check('the point read derives once', derivations.count === 1, derivations.count);
  check('and opens one envelope, the one it returns', opens.count === 1, opens.count);
  check('the line reads, with no grey line', p.includes('line at 25') && !p.includes('sealed ·'), p);
  opens.count = 0;
  const d = await door('s-fifty', { block: 'notes:fifty', pscale_attention: 0, enc_secret: WORD });
  console.log(`     disc at pscale 0: ${derivations.count} derivation(s) in all, ${opens.count} opening(s)`);
  check('the disc opens fifty with no new derivation', opens.count === 50 && derivations.count === 1, [derivations.count, opens.count]);
  check('every line reads', lines.every((l) => d.includes(l)) && !d.includes('sealed ·'), d);
  opens.count = 0;
  const w = await door('s-fifty', { block: 'notes:fifty', spindle: '25', enc_secret: WORD });
  check('the walk opens its one sealed rung', opens.count === 1 && w.includes('line at 25') && w.includes('container 2'), [opens.count, w]);
  const whole = await door('s-fifty', { block: 'notes:fifty', spindle: '0', enc_secret: WORD });
  check('the whole block named with the key opens every line, as before', lines.every((l) => whole.includes(l)), whole);

  // ── 3. The grey line in each shape ────────────────────────────────────
  console.log('\n3. the grey line in each shape, the fields beside an envelope kept, the whole block byte-true');
  const bobPub = formatPublicKeys(await deriveKeypair('bob word', 'bob')).x25519;
  const alicePub = formatPublicKeys(await deriveKeypair('alice word', 'alice')).x25519;
  const sealed = (t: string) => selfEncrypt(t, WORD, ORIGIN);
  const shapes: any = {
    _: 'shapes at the fixture beach',
    '1': 'an open line',
    '2': await sealed('a sealed line'),
    '3': { ...(await sealed('a sealed entry, appended')), '3': '2026-11-04T09:00:00Z' },
    '4': { _: await sealed('a container voiced in gray'), '1': 'entry one', '2': await sealed('entry two') },
    '5': { ...(await sealed('an envelope with an entry inside')), '4': 'the entry that landed inside' },
    '6': await grainEncrypt('a line for bob', 'alice word', 'alice', 'bob', bobPub, alicePub),
    '7': groupEncryptContent('a line for the ring', K),
  };
  store['notes:shapes'] = shapes;
  const read = (s: string | null, p: number | null) => formatRead(bspRead(shapes, s, p));
  const grey = (env: GrayEnvelope, mode = 'self', party = '') => `sealed · ${mode}${party} · ${bytesOf(env)} bytes`;

  const point2 = read('2', 0);
  check('point: one grey line, nothing beneath', point2 === `[point @ pscale 0 depth 1 [2]]\n  ${grey(shapes['2'])}`, point2);
  const point3 = read('3', 0);
  check('point: an appended entry keeps its arrival stamp beside the grey line', point3.includes(`${grey(shapes['3'])} · 2026-11-04T09:00:00Z`) && !point3.includes('beneath'), point3);
  const point5 = read('5', 0);
  check('point: an entry that landed inside is still offered beneath', point5.includes(grey(shapes['5'])) && /beneath \(pscale -1\): 5\.4$/.test(point5), point5);
  check('point: a grain line names its other party', read('6', 0).includes(grey(shapes['6'], 'grain', ' · for bob')), read('6', 0));
  check('point: a group line', read('7', 0).includes(grey(shapes['7'], 'group')), read('7', 0));
  const walk4 = read('4', null);
  check('walk: a container voiced in gray is the grey line, its entries beneath', walk4.includes(grey(shapes['4']._)) && /beneath \(pscale -1\): 4\.1 · 4\.2/.test(walk4), walk4);
  const walk42 = read('4.2', null);
  check('walk: every sealed rung is grey', walk42.includes(grey(shapes['4']._)) && walk42.includes(grey(shapes['4']['2'])), walk42);
  const disc = read(null, 0);
  check('disc: each sealed position is one grey line', (disc.match(/sealed · /g) ?? []).length === 6 && disc.includes(grey(shapes['6'], 'grain', ' · for bob')), disc);
  check('disc: the ring beneath counts entries, never the envelope\'s fields', disc.includes(`[4]: ${grey(shapes['4']._)} · 2 beneath`) && disc.includes(`[5]: ${grey(shapes['5'])} · 1 beneath`) && disc.includes(`[2]: ${grey(shapes['2'])}\n`), disc);
  const desc5 = read('5', -1);
  check('descent: the entry inside is listed; the ciphertext, nonce and marker are not', desc5.includes('[5.4]: the entry that landed inside') && !/\[5\.[129]\]/.test(desc5), desc5);
  const desc4 = read('4', -1);
  check('descent: beneath a voiced container, an open entry and a grey one', desc4.includes('[4.1]: entry one') && desc4.includes(`[4.2]: ${grey(shapes['4']['2'])}`), desc4);
  const texts = [point2, point3, point5, walk4, walk42, disc, desc5, desc4, read('6', 0), read('7', 0)];
  const secrets = ['2', '3', '5', '6', '7'].map((k) => shapes[k]['1']).concat(shapes['4']._['1'], shapes['4']['2']['1']);
  check('no shape shows a ciphertext', texts.every((t) => secrets.every((s) => !t.includes(s))));
  check('the whole block is byte-true', read(null, null) === `[whole block]\n${JSON.stringify(shapes, null, 2)}`);

  const kw = await door('s-shapes', { block: 'notes:shapes', spindle: '4.2', enc_secret: WORD });
  check('keyed walk: both rungs open', kw.includes('a container voiced in gray') && kw.includes('entry two'), kw);
  const k5 = await door('s-shapes', { block: 'notes:shapes', spindle: '5', pscale_attention: 0, enc_secret: WORD });
  check('keyed point: the entry inside still stands beneath the opened line', k5.includes('an envelope with an entry inside') && /beneath \(pscale -1\): 5\.4/.test(k5), k5);
  const k3 = await door('s-shapes', { block: 'notes:shapes', spindle: '3', pscale_attention: 0, enc_secret: WORD });
  check('keyed point: an appended entry opens with its stamp', k3.includes('a sealed entry, appended · 2026-11-04T09:00:00Z'), k3);
  const kd = await door('s-shapes', { block: 'notes:shapes', pscale_attention: 0, enc_secret: WORD });
  check('keyed disc: the self lines open; lines sealed to others stay grey', kd.includes('[2]: a sealed line') && kd.includes(grey(shapes['6'], 'grain', ' · for bob')) && kd.includes(grey(shapes['7'], 'group')), kd);
  const wrong = await door('s-shapes', { block: 'notes:shapes', spindle: '2', pscale_attention: 0, enc_secret: 'not the word' });
  check('a key that opens nothing leaves the grey line', wrong.includes(grey(shapes['2'])) && !wrong.includes('[encrypted]'), wrong);
  const star = await door('s-shapes', { block: 'notes:shapes', spindle: '4*', enc_secret: WORD });
  check('keyed star: the voicing opens and the directory is the entries', star.includes('a container voiced in gray') && !star.includes(shapes['4']._['1']), star);

  // ── 4. Over the wire ─────────────────────────────────────────────────
  console.log('\n4. the grey line drawn from a wire shape, where the beach sends the note');
  const NOTE = GRAY_NOTES.self;
  const ct = shapes['2']['1'], nonce = shapes['2']['2'];
  const wp = formatRead({ floor: 1, shape: 'point', spindle: '2', pscale: 0, depth: 1, address: '2', content: NOTE, beneath: ['2.1', '2.2', '2.9'], beneath_pscale: -1 });
  check('wire point: the note is the grey line and the envelope\'s fields are not offered beneath', wp === '[point @ pscale 0 depth 1 [2]]\n  sealed · self', wp);
  const wd = formatRead({
    floor: 1, shape: 'path-walk+descent', spindle: '2', pscale: -1,
    path_walk: [{ address: '2', depth: 1, pscale: 0, content: NOTE }],
    descent: [
      { address: '2.1', depth: 2, pscale: -1, content: ct }, { address: '2.2', depth: 2, pscale: -1, content: nonce },
      { address: '2.3', depth: 2, pscale: -1, content: '2026-11-04T09:00:00Z' }, { address: '2.9', depth: 2, pscale: -1, content: 'gray' },
    ],
  });
  check('wire descent: one grey line; the ciphertext, nonce and marker are not listed; the stamp beside them is', wd.includes('[2]: sealed · self') && !wd.includes(ct) && !wd.includes(nonce) && !/\[2\.9\]/.test(wd) && wd.includes('[2.3]: 2026-11-04T09:00:00Z'), wd);
  const wc = formatRead({
    floor: 2, shape: 'path-walk+descent', spindle: '2', pscale: 0,
    path_walk: [{ address: '2', depth: 1, pscale: 1, content: NOTE }],
    descent: [{ address: '21', depth: 2, pscale: 0, content: 'entry one' }, { address: '22', depth: 2, pscale: 0, content: 'entry two' }, { address: '29', depth: 2, pscale: 0, content: 'gray' }],
  });
  check('wire descent: beneath a container voiced in gray every entry stays, "gray" at 29 or not', wc.includes('[21]: entry one') && wc.includes('[22]: entry two') && wc.includes('[29]: gray'), wc);
  const wdisc = formatRead({ floor: 1, shape: 'disc', pscale: 0, target_depth: 1, entries: [{ address: '0', content: 'the root' }, { address: '2', content: GRAY_NOTES.grain, beneath: 3 }] });
  check('wire disc: the grey line', wdisc.includes('[2]: sealed · grain'), wdisc);

  console.log(`\n${fail === 0 ? '✓' : '✗'} seal price: ${pass} passed, ${fail} failed`);
  if (fail) { failures.forEach((f) => console.log(`   - ${f}`)); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(2); });
