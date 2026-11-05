/**
 * smoke-gray-vectors.ts — ONE set of test vectors for the gray seal, shared by every place
 * that seals or opens a sealed line: keys.ts here, the beach's own seal in the browser
 * (pscale-beach button/seal.js, what the voice seals with), Community Recovery's gray.js, the
 * site's vault.js and stack.html. Seal in one, open in the others, both ways — the guard against
 * the drift coloured-stigmergy 5 names (bsp-mcp proposals/2026-11-02-leros-on-the-commons-the-
 * build-to-completion.md §4.1 item 4), extended to the four modes for step 4 of coloured
 * stigmergy (proposals/2026-11-03-coloured-stigmergy-the-design.md §4.1, §11 item 4).
 *
 * The recipe every place must share: Argon2id(password = the word, salt = the string the thing
 * is addressed by, padded to EIGHT bytes with NUL; t=3, m=65536, p=1, 64 bytes out) → the first
 * 32 bytes are the NaCl secretbox key (self) and the X25519 secret; bytes 32-63 the Ed25519 seed;
 * the keypair a holder publishes is those halves. The envelope is
 *   {_: note, 1: ciphertext b64, 2: nonce b64, 9: {_: 'gray', 1: <mode>, …}}
 * in four modes: self (secretbox under the key), grain (nacl.box under the shared key of two
 * published pairs, the partner at 9.2), group (secretbox under one key, a copy of which is boxed
 * to each member's published half in a keyring), colour (the group envelope naming the block
 * that keeps its key at 9.2 and the turn at 9.3; a letter boxed to the turn's public half, the
 * writer's one-off half at 9.4). THE LATCH a door may derive from the same word, so the beach
 * holds nothing that opens a line (the design's §4.2): Argon2id(word, salt = 'latch:' + the
 * handle), the first 32 of 64 bytes, base64: keys.ts derives it (deriveLatch) as seal.js does,
 * and the vectors pin both (proposals/2026-11-05-the-derived-latch.md §3).
 *
 *   npm run smoke:gray-vectors            check every place against scripts/fixtures/gray-vectors.json
 *   npm run smoke:gray-vectors -- --make  regenerate the fixtures from keys.ts (fixed nonces; the
 *                                         copies and the letter carry a one-off pair, so they are
 *                                         made once and kept)
 *
 * The served files are fetched live, so what is checked is what people run:
 *   https://beach.happyseaurchin.com/button/seal.js  (SEAL_JS=<path or url> checks another copy,
 *                                                      a worktree's before it is served)
 *   https://phenomemental.github.io/community-recovery/gray.js (and its vendored noble argon2)
 *   https://happyseaurchin.com/vault.js  (in node it seals through the beach's seal, handed in)
 *   https://happyseaurchin.com/stack.html
 * GRAY_VECTORS_OFFLINE=1 checks keys.ts alone. Exit 1 on any failure.
 */

import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import nacl from 'tweetnacl';
import { argon2id } from 'hash-wasm';
import {
  deriveKeypair, deriveLatch, selfDecrypt, grainDecrypt, wrapGroupKey, unwrapGroupKeyFromKeyring, groupDecryptContent,
  buildTurn, turnPublicHalf, colourLetter, colourOpen, colourNote, GRAY_NOTES, publicKeysToSpine,
} from '../src/keys.js';
import { sealedLine } from '../src/bsp-fn.js';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(here, 'fixtures', 'gray-vectors.json');
const CACHE = join(here, '.vectors-cache');
const APP = 'https://phenomemental.github.io/community-recovery/';
const SITE = 'https://happyseaurchin.com/';
const BEACH = 'https://beach.happyseaurchin.com/';

interface Vector {
  name: string;
  secret: string;
  salt: string;
  plaintext: string;
  nonce_b64: string;
  key_hex: string;
  ciphertext_b64: string;
  x25519_pub_b64: string;
  ed25519_pub_b64: string;
  latch_b64: string;
  envelope: { _: string; '1': string; '2': string; '9': { _: 'gray'; '1': 'self' } };
}
interface Person { secret: string; handle: string }
interface Fixture {
  _: string;
  vectors: Vector[];
  grain: { a: Person; b: Person; plaintext: string; nonce_b64: string; shared_hex: string; ciphertext_b64: string; envelope: any };
  group: { K_hex: string; member: Person; plaintext: string; nonce_b64: string; ciphertext_b64: string; envelope: any; ring: any };
  colour: { K_hex: string; block: string; turn: string; half_b64: string; holder: Person; block_node: any; plaintext: string; nonce_b64: string; ciphertext_b64: string; envelope: any; grey: string; letter: { plaintext: string; envelope: any } };
}

// The inputs. A place address (the app's salt today), a SHORT handle (under eight bytes, the
// padding case), a handle, and the new beach's address.
const INPUTS: Array<Pick<Vector, 'name' | 'secret' | 'salt' | 'plaintext'>> = [
  { name: 'a-day-at-the-place', secret: 'amber kite seventeen', salt: 'https://beach.happyseaurchin.com/w/community-recovery', plaintext: 'Kept 2 November 2026 — a quiet day: two walks, one call, early night.' },
  { name: 'a-short-handle', secret: 'cedar lamp quiet river', salt: 'Ada', plaintext: 'Día claro — café ☕ y nada más.' },
  { name: 'a-handle', secret: 'three words here', salt: 'happyseaurchin', plaintext: '{"_":"a card","5":"beyond"}' },
  { name: 'the-new-beach', secret: 'weft everyday test key', salt: 'https://beach.bringingtheflavour.com', plaintext: "the first day on David's own beach" },
];
// Two members of SALT's beach, throwaway words, for the grain, the group and the colour
const ADA: Person = { secret: 'rowan pier swallow 41', handle: 'ada' };
const BOB: Person = { secret: 'flint harbour lotus 77', handle: 'bob' };
const COLOUR = 'colour:salt';
const TURN_FROM = new Date('2026-11-04T16:00:00Z');

const enc = new TextEncoder();
const b64 = (u: Uint8Array) => Buffer.from(u).toString('base64');
const unb64 = (s: string) => new Uint8Array(Buffer.from(s, 'base64'));
const hex = (u: Uint8Array) => Buffer.from(u).toString('hex');
const fixed = (what: string, n: number) => new Uint8Array(createHash('sha256').update(`gray-vectors:${what}`).digest()).slice(0, n);
const NOTE = GRAY_NOTES.self;

let passed = 0, failed = 0;
const ok = (label: string, cond: boolean, detail = '') => {
  if (cond) { passed++; console.log(`  ✓ ${label}`); } else { failed++; console.error(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
};
const skip = (label: string, why: string) => console.log(`  · ${label} — ${why}`);
const caught = async (label: string, fn: () => Promise<boolean>) => { try { ok(label, await fn()); } catch (e: any) { ok(label, false, e?.message ?? String(e)); } };

async function make(): Promise<Fixture> {
  const vectors: Vector[] = [];
  for (const v of INPUTS) {
    const nonce = fixed(v.name, nacl.secretbox.nonceLength);
    const keys = await deriveKeypair(v.secret, v.salt);
    const key = keys.x25519.secretKey;
    const ct = nacl.secretbox(enc.encode(v.plaintext), nonce, key);
    vectors.push({
      ...v,
      nonce_b64: b64(nonce), key_hex: hex(key), ciphertext_b64: b64(ct),
      x25519_pub_b64: b64(keys.x25519.publicKey), ed25519_pub_b64: b64(keys.ed25519.publicKey),
      latch_b64: await deriveLatch(v.secret, v.salt),
      envelope: { _: NOTE, '1': b64(ct), '2': b64(nonce), '9': { _: 'gray', '1': 'self' } },
    });
  }
  // grain: ada writes to bob under their shared key
  const ka = await deriveKeypair(ADA.secret, ADA.handle), kb = await deriveKeypair(BOB.secret, BOB.handle);
  const shared = nacl.box.before(kb.x25519.publicKey, ka.x25519.secretKey);
  const gNonce = fixed('grain', nacl.box.nonceLength), gText = 'ada → bob: the first sealed word on a grain, 4 November 2026';
  const gCt = nacl.box.after(enc.encode(gText), gNonce, shared);
  const grain = { a: ADA, b: BOB, plaintext: gText, nonce_b64: b64(gNonce), shared_hex: hex(shared), ciphertext_b64: b64(gCt),
    envelope: { _: GRAY_NOTES.grain, '1': b64(gCt), '2': b64(gNonce), '9': { _: 'gray', '1': 'grain', '2': BOB.handle } } };
  // group: one key, a copy sealed to bob's published half (a one-off pair: made once, kept)
  const K = fixed('group-key', nacl.secretbox.keyLength);
  const grNonce = fixed('group', nacl.secretbox.nonceLength), grText = 'a line the members read';
  const grCt = nacl.secretbox(enc.encode(grText), grNonce, K);
  const group = { K_hex: hex(K), member: BOB, plaintext: grText, nonce_b64: b64(grNonce), ciphertext_b64: b64(grCt),
    envelope: { _: GRAY_NOTES.group, '1': b64(grCt), '2': b64(grNonce), '9': { _: 'gray', '1': 'group' } },
    ring: { _: 'group-keyring', '1': wrapGroupKey(K, BOB.handle, b64(kb.x25519.publicKey)) } };
  // colour: turn 1 of colour:salt holds ada's copy, as keys.ts builds it; a line and a letter sealed to it
  const KC = fixed('colour-key', nacl.secretbox.keyLength);
  const turn = buildTurn(KC, [wrapGroupKey(KC, ADA.handle, b64(ka.x25519.publicKey))], TURN_FROM);
  const cNonce = fixed('colour', nacl.secretbox.nonceLength), cText = 'SHARE https://example.org/salt — a line only SALT reads';
  const cCt = nacl.secretbox(enc.encode(cText), cNonce, KC);
  const envelope = { _: colourNote(COLOUR, '1'), '1': b64(cCt), '2': b64(cNonce), '9': { _: 'gray', '1': 'colour', '2': COLOUR, '3': '1' } };
  const lText = 'a letter to SALT from someone with no copy';
  const colour = { K_hex: hex(KC), block: COLOUR, turn: '1', half_b64: turnPublicHalf(KC), holder: ADA,
    block_node: { _: `${COLOUR} — a readership: a line sealed in this colour opens for each holder of a copy in its current turn below; a letter to it is sealed to the turn's public half and read by every holder.`, '1': turn },
    plaintext: cText, nonce_b64: b64(cNonce), ciphertext_b64: b64(cCt), envelope, grey: sealedLine(envelope as any).replace(/ · \d+ bytes$/, ''),
    letter: { plaintext: lText, envelope: colourLetter(lText, COLOUR, '1', turnPublicHalf(KC)) } };
  return {
    _: 'gray test vectors — Argon2id(word, salt padded to 8 with NUL; t=3 m=65536 p=1, 64 bytes) → bytes 0-31 the secretbox key and X25519 secret, 32-63 the Ed25519 seed; the latch from the same word under salt latch:<handle>, 32 bytes base64; four modes, self, grain, group and colour; shared by keys.ts, the beach\'s seal.js, gray.js, vault.js and stack.html. Regenerate with npm run smoke:gray-vectors -- --make.',
    vectors, grain, group, colour,
  };
}

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return await r.text();
}

// ── keys.ts: the reference ──
async function checkKeys(f: Fixture) {
  console.log('\nkeys.ts (bsp-mcp)');
  for (const v of f.vectors) {
    const keys = await deriveKeypair(v.secret, v.salt);
    ok(`${v.name}: key`, hex(keys.x25519.secretKey) === v.key_hex);
    const ct = nacl.secretbox(enc.encode(v.plaintext), unb64(v.nonce_b64), keys.x25519.secretKey);
    ok(`${v.name}: seal with the fixed nonce`, b64(ct) === v.ciphertext_b64);
    ok(`${v.name}: open`, (await selfDecrypt(v.envelope as any, v.secret, v.salt)) === v.plaintext);
    ok(`${v.name}: published keys`, b64(keys.x25519.publicKey) === v.x25519_pub_b64 && b64(keys.ed25519.publicKey) === v.ed25519_pub_b64);
    ok(`${v.name}: the latch from the same word`, (await deriveLatch(v.secret, v.salt)) === v.latch_b64);
    ok(`${v.name}: the latch is neither the word nor the pair's key`, v.latch_b64 !== v.secret && Buffer.from(v.latch_b64, 'base64').toString('hex') !== v.key_hex.slice(0, 64));
  }
  const g = f.grain, ka = await deriveKeypair(g.a.secret, g.a.handle), kb = await deriveKeypair(g.b.secret, g.b.handle);
  const shared = nacl.box.before(kb.x25519.publicKey, ka.x25519.secretKey);
  ok('grain: the shared key, from either side', hex(shared) === g.shared_hex && hex(nacl.box.before(ka.x25519.publicKey, kb.x25519.secretKey)) === g.shared_hex);
  ok('grain: seal with the fixed nonce', b64(nacl.box.after(enc.encode(g.plaintext), unb64(g.nonce_b64), shared)) === g.ciphertext_b64);
  ok('grain: bob opens it', (await grainDecrypt(g.envelope, g.b.secret, g.b.handle, b64(ka.x25519.publicKey))) === g.plaintext);
  ok('grain: ada reads it back', (await grainDecrypt(g.envelope, g.a.secret, g.a.handle, b64(kb.x25519.publicKey))) === g.plaintext);
  const gr = f.group, K = await unwrapGroupKeyFromKeyring(gr.ring, gr.member.secret, gr.member.handle);
  ok('group: the member opens their copy', !!K && hex(K) === gr.K_hex);
  ok('group: seal with the fixed nonce', b64(nacl.secretbox(enc.encode(gr.plaintext), unb64(gr.nonce_b64), unb64(gr.K_hex ? Buffer.from(gr.K_hex, 'hex').toString('base64') : ''))) === gr.ciphertext_b64);
  ok('group: open', groupDecryptContent(gr.envelope, new Uint8Array(Buffer.from(gr.K_hex, 'hex'))) === gr.plaintext);
  const c = f.colour, KC = new Uint8Array(Buffer.from(c.K_hex, 'hex'));
  const copy = await unwrapGroupKeyFromKeyring(c.block_node['1']['1'], c.holder.secret, c.holder.handle);
  ok('colour: the holder opens their copy in turn 1', !!copy && hex(copy) === c.K_hex);
  ok('colour: the public half', turnPublicHalf(KC) === c.half_b64);
  ok('colour: seal with the fixed nonce', b64(nacl.secretbox(enc.encode(c.plaintext), unb64(c.nonce_b64), KC)) === c.ciphertext_b64);
  ok('colour: open', colourOpen(c.envelope, KC) === c.plaintext);
  ok('colour: the letter opens with the turn\'s key', colourOpen(c.letter.envelope, KC) === c.letter.plaintext);
  ok('colour: the grey line', sealedLine(c.envelope).replace(/ · \d+ bytes$/, '') === c.grey, sealedLine(c.envelope));
}

// ── seal.js: the beach's own seal, run in node through its own require branch ──
let seal: any = null;
async function checkSeal(f: Fixture) {
  console.log('\nseal.js (the beach, button/seal.js)');
  const from = process.env.SEAL_JS || BEACH + 'button/seal.js';
  try {
    mkdirSync(CACHE, { recursive: true });
    const p = join(CACHE, 'seal.cjs');
    const src = /^https?:/.test(from) ? await fetchText(from) : readFileSync(resolve(from), 'utf8');
    writeFileSync(p, src);
    seal = createRequire(import.meta.url)(p);
  } catch (e: any) {
    if (process.env.SEAL_JS) { ok('seal.js loaded', false, e?.message ?? String(e)); return; }
    const local = resolve(here, '..', '..', 'pscale-beach', 'button', 'seal.js');
    if (existsSync(local)) { console.log(`  · ${from} not served yet; checking ${local}`); process.env.SEAL_JS = local; return checkSeal(f); }
    skip('seal.js', `${from} is not served yet, and no SEAL_JS names a copy (pscale-beach button/seal.js)`); return;
  }
  const S = seal;
  console.log(`  · from ${from}`);
  ok('seal.js carries the four modes, the pair, the latch and the grey line', ['self', 'grain', 'group', 'colour'].every((m) => S[m] && typeof S[m].seal === 'function' && typeof S[m].open === 'function') && typeof S.pair === 'function' && typeof S.latch === 'function' && typeof S.grey === 'function');
  for (const v of f.vectors) {
    await caught(`${v.name}: key`, async () => S.hex(await S.key(v.secret, v.salt)) === v.key_hex);
    await caught(`${v.name}: seal.js opens the keys.ts envelope`, async () => (await S.self.open(v.envelope, v.secret, v.salt)) === v.plaintext);
    await caught(`${v.name}: keys.ts opens the seal.js envelope`, async () => (await selfDecrypt(await S.self.seal(v.plaintext, v.secret, v.salt), v.secret, v.salt)) === v.plaintext);
    await caught(`${v.name}: the published halves`, async () => { const p = S.published(await S.pair(v.secret, v.salt)); return p['2'] === v.x25519_pub_b64 && p['1'] === v.ed25519_pub_b64 && p._ === publicKeysToSpine({ x25519: '', ed25519: '' })._; });
    await caught(`${v.name}: the latch`, async () => (await S.latch(v.secret, v.salt)) === v.latch_b64);
    await caught(`${v.name}: a wrong word opens nothing`, async () => (await S.self.open(v.envelope, v.secret + 'x', v.salt)) === null);
  }
  const g = f.grain, ka = await deriveKeypair(g.a.secret, g.a.handle), kb = await deriveKeypair(g.b.secret, g.b.handle);
  const aPub = b64(ka.x25519.publicKey), bPub = b64(kb.x25519.publicKey);
  await caught('grain: the shared key', async () => S.hex(await S.grain.shared(g.b.secret, g.b.handle, aPub)) === g.shared_hex);
  await caught('grain: bob opens the keys.ts envelope', async () => (await S.grain.open(g.envelope, g.b.secret, g.b.handle, aPub)) === g.plaintext);
  await caught('grain: ada reads it back', async () => (await S.grain.open(g.envelope, g.a.secret, g.a.handle, bPub)) === g.plaintext);
  await caught('grain: keys.ts opens the seal.js envelope, and the envelope names bob', async () => { const e = await S.grain.seal(g.plaintext, g.a.secret, g.a.handle, g.b.handle, bPub, aPub); return e['9']['2'] === g.b.handle && (await grainDecrypt(e, g.b.secret, g.b.handle, aPub)) === g.plaintext; });
  await caught('grain: a word that does not derive the published half is refused before anything travels', async () => { try { await S.grain.seal(g.plaintext, g.a.secret + 'x', g.a.handle, g.b.handle, bPub, aPub); return false; } catch (e: any) { return /published at passport:ada 9/.test(e.message); } });
  const gr = f.group, K = unb64(Buffer.from(gr.K_hex, 'hex').toString('base64'));
  await caught('group: the member opens their copy', async () => { const k = await S.group.unwrap(gr.ring, gr.member.secret, gr.member.handle); return !!k && S.hex(k) === gr.K_hex; });
  await caught('group: a name the ring does not hold opens nothing, without a derivation', async () => (await S.group.unwrap(gr.ring, gr.member.secret, 'nobody')) === null);
  await caught('group: open', async () => (await S.group.open(gr.envelope, K)) === gr.plaintext);
  await caught('group: keys.ts opens the seal.js envelope', async () => groupDecryptContent(await S.group.seal(gr.plaintext, K), K) === gr.plaintext);
  await caught('group: keys.ts opens a copy seal.js wrapped', async () => { const w = await S.group.wrap(K, gr.member.handle, bPub); const k = await unwrapGroupKeyFromKeyring(S.group.ring([w]), gr.member.secret, gr.member.handle); return !!k && hex(k) === gr.K_hex; });
  const c = f.colour, KC = unb64(Buffer.from(c.K_hex, 'hex').toString('base64'));
  await caught('colour: the turns of the block as keys.ts built it', async () => { const t = S.colour.turns(c.block_node); return t.length === 1 && t[0].address === '1' && S.colour.current(c.block_node).address === '1'; });
  await caught('colour: the holder opens turn 1 from their copy', async () => { const k = await S.colour.keyOf(S.colour.current(c.block_node), c.holder.secret, c.holder.handle); return !!k && S.hex(k) === c.K_hex; });
  await caught('colour: a stranger opens no turn', async () => (await S.colour.keyOf(S.colour.current(c.block_node), 'some other word', 'stranger')) === null);
  await caught('colour: the public half', async () => (await S.colour.half(KC)) === c.half_b64);
  await caught('colour: open the keys.ts line', async () => (await S.colour.open(c.envelope, KC)) === c.plaintext);
  await caught('colour: open the keys.ts letter', async () => (await S.colour.open(c.letter.envelope, KC)) === c.letter.plaintext);
  await caught('colour: keys.ts opens the seal.js line, which names its colour and turn', async () => { const e = await S.colour.seal(c.plaintext, c.block, '1', KC); return e._ === c.envelope._ && e['9']['2'] === c.block && e['9']['3'] === '1' && colourOpen(e, KC) === c.plaintext; });
  await caught('colour: keys.ts opens the seal.js letter', async () => colourOpen(await S.colour.letter(c.letter.plaintext, c.block, '1', c.half_b64), KC) === c.letter.plaintext);
  await caught('colour: a turn seal.js makes, keys.ts opens', async () => { const w = await S.group.wrap(KC, c.holder.handle, aPub); const t = await S.colour.turn(KC, [w], TURN_FROM); const k = await unwrapGroupKeyFromKeyring(t['1'], c.holder.secret, c.holder.handle); return t._ === c.block_node['1']._ && t['2'] === c.half_b64 && !!k && hex(k) === c.K_hex; });
  await caught('colour: the grey line', async () => S.grey(c.envelope) === c.grey && S.grey({ _: c.envelope, '1': 'ada' }) === c.grey);
  await caught('the grey lines of the other modes', async () => S.grey(f.vectors[0].envelope) === 'sealed · self' && S.grey(g.envelope) === 'sealed · grain · for bob' && S.grey(gr.envelope) === 'sealed · group');
}

// ── vault.js: the site's seal, run in node through its own require branch ──
async function checkVault(f: Fixture) {
  console.log('\nvault.js (happyseaurchin.com)');
  let vault: any;
  try {
    const src = await fetchText(SITE + 'vault.js');
    mkdirSync(CACHE, { recursive: true });
    const p = join(CACHE, 'vault.cjs');
    writeFileSync(p, src);
    // the vault seals through the beach's seal; in node it is handed in
    if (seal) (globalThis as any).beachSeal = seal;
    vault = createRequire(import.meta.url)(p);
  } catch (e: any) { ok('vault.js fetched and loaded', false, e?.message ?? String(e)); return; }
  ok('vault.js exports seal and open', typeof vault?.seal === 'function' && typeof vault?.open === 'function', `exports: ${Object.keys(vault || {}).join(', ')}`);
  if (typeof vault?.open !== 'function') return;
  for (const v of f.vectors) {
    let opened: any = null, err = '';
    try { opened = await vault.open(v.envelope, v.secret, v.salt); } catch (e: any) { err = e?.message ?? String(e); }
    ok(`${v.name}: vault.js opens the keys.ts envelope`, opened === v.plaintext, err);
    try {
      const env = await vault.seal(v.plaintext, v.secret, v.salt);
      ok(`${v.name}: keys.ts opens the vault.js envelope`, (await selfDecrypt(env, v.secret, v.salt)) === v.plaintext);
    } catch (e: any) { ok(`${v.name}: keys.ts opens the vault.js envelope`, false, e?.message ?? String(e)); }
  }
}

// ── gray.js: the app's seal, run in node with a window shim and its own vendored argon2 ──
async function checkGray(f: Fixture) {
  console.log('\ngray.js (Community Recovery\'s app)');
  let Gray: any;
  try {
    const dir = join(CACHE, 'app');
    const vendor = join(dir, 'vendor', 'noble-hashes');
    mkdirSync(vendor, { recursive: true });
    writeFileSync(join(dir, 'gray.js'), await fetchText(APP + 'gray.js'));
    // follow the vendored module's relative imports
    const seen = new Set<string>(); const todo = ['argon2.js'];
    while (todo.length) {
      const fl = todo.pop()!; if (seen.has(fl)) continue; seen.add(fl);
      const src = await fetchText(APP + 'vendor/noble-hashes/' + fl);
      writeFileSync(join(vendor, fl), src);
      for (const m of src.matchAll(/from\s+["']\.\/([A-Za-z0-9_\-]+\.js)["']/g)) if (!seen.has(m[1])) todo.push(m[1]);
    }
    const w: any = (globalThis as any).window ?? {};
    w.nacl = nacl; w.dispatchEvent = () => true;
    (globalThis as any).window = w;
    await import(pathToFileURL(join(dir, 'gray.js')).href);
    Gray = w.Gray;
  } catch (e: any) { ok('gray.js fetched and loaded', false, e?.message ?? String(e)); return; }
  ok('gray.js exposes key, seal and open', !!Gray && typeof Gray.key === 'function' && typeof Gray.open === 'function');
  if (!Gray) return;
  console.log(`  · gray.js seals under its place address: ${Gray.BEACH}`);
  for (const v of f.vectors) {
    // the key, under the vector's salt — a salt under eight bytes must be padded, as keys.ts pads it
    let k: Uint8Array | null = null, err = '';
    try { k = await Gray.key(v.secret, v.salt); } catch (e: any) { err = e?.message ?? String(e); }
    ok(`${v.name}: key under salt "${v.salt.length > 24 ? v.salt.slice(0, 24) + '…' : v.salt}"`, !!k && hex(k) === v.key_hex, err || (k ? 'a different key' : ''));
    // open: gray.js tries its place address, then the handle it is given
    const handle = v.salt === Gray.BEACH ? undefined : v.salt;
    let opened: any = null; err = '';
    try { opened = await Gray.open(v.envelope, v.secret, handle); } catch (e: any) { err = e?.message ?? String(e); }
    ok(`${v.name}: gray.js opens the keys.ts envelope`, opened === v.plaintext, err);
    // the other way: gray.js seals only under its place address
    if (v.salt === Gray.BEACH) {
      try {
        const env = await Gray.seal(v.plaintext, v.secret);
        ok(`${v.name}: keys.ts opens the gray.js envelope`, (await selfDecrypt(env, v.secret, Gray.BEACH)) === v.plaintext);
      } catch (e: any) { ok(`${v.name}: keys.ts opens the gray.js envelope`, false, e?.message ?? String(e)); }
    }
  }
}

// ── stack.html: the site's group seal derives each member's keypair the same way ──
async function checkStack(f: Fixture) {
  console.log('\nstack.html (happyseaurchin.com)');
  let derive: any;
  try {
    const html = await fetchText(SITE + 'stack.html');
    const m = html.match(/async function derive\(secret, handle\)\{([\s\S]*?)\n\}/);
    if (!m) throw new Error('derive(secret, handle) not found in the page');
    const libs = async () => ({ argon2id, nacl });
    derive = new Function('libs', 'b64', 'unb64', `return (async function derive(secret, handle){${m[1]}\n})`)(libs, b64, unb64);
  } catch (e: any) { ok('stack.html fetched and its derive() extracted', false, e?.message ?? String(e)); return; }
  for (const v of f.vectors) {
    if (v.salt.startsWith('http')) continue; // stack.html derives from a handle, never an address
    let got: any = null, err = '';
    try { got = await derive(v.secret, v.salt); } catch (e: any) { err = e?.message ?? String(e); }
    ok(`${v.name}: stack.html derives the same keys from "${v.salt}"`, !!got && got.xpub === v.x25519_pub_b64 && got.edpub === v.ed25519_pub_b64, err);
  }
}

async function main() {
  if (process.argv.includes('--make')) {
    const f = await make();
    mkdirSync(dirname(FIXTURE), { recursive: true });
    writeFileSync(FIXTURE, JSON.stringify(f, null, 2) + '\n');
    console.log(`wrote ${f.vectors.length} self vectors, a grain, a group and a colour → ${FIXTURE}`);
    return;
  }
  const f: Fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  await checkKeys(f);
  if (process.env.GRAY_VECTORS_OFFLINE) {
    if (process.env.SEAL_JS) await checkSeal(f);
    skip('the served places', 'GRAY_VECTORS_OFFLINE set');
  } else { await checkSeal(f); await checkVault(f); await checkGray(f); await checkStack(f); }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
