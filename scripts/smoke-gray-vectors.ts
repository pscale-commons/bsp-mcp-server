/**
 * smoke-gray-vectors.ts — ONE set of test vectors for the gray seal, shared by every place
 * that seals or opens a sealed line: keys.ts here, Community Recovery's gray.js, the site's
 * vault.js and stack.html. Seal in one, open in the others, both ways — the guard against the
 * drift coloured-stigmergy 5 names (bsp-mcp proposals/2026-11-02-leros-on-the-commons-the-
 * build-to-completion.md §4.1 item 4).
 *
 * The recipe every place must share: Argon2id(password = the word, salt = the string the thing
 * is addressed by, padded to EIGHT bytes with NUL; t=3, m=65536, p=1, 64 bytes out) → the first
 * 32 bytes are the NaCl secretbox key; the envelope is
 *   {_: note, 1: ciphertext b64, 2: nonce b64, 9: {_: 'gray', 1: 'self'}}.
 * The keypair a holder publishes is the same hash: x25519 from bytes 0-31, ed25519 from 32-63.
 *
 *   npm run smoke:gray-vectors            check every place against scripts/fixtures/gray-vectors.json
 *   npm run smoke:gray-vectors -- --make  regenerate the fixtures from keys.ts (fixed nonces)
 *
 * The served files are fetched live, so what is checked is what people run:
 *   https://phenomemental.github.io/community-recovery/gray.js (and its vendored noble argon2)
 *   https://happyseaurchin.com/vault.js
 *   https://happyseaurchin.com/stack.html
 * GRAY_VECTORS_OFFLINE=1 checks keys.ts alone. Exit 1 on any failure.
 */

import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import nacl from 'tweetnacl';
import { argon2id } from 'hash-wasm';
import { deriveKeypair, selfDecrypt } from '../src/keys.js';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(here, 'fixtures', 'gray-vectors.json');
const CACHE = join(here, '.vectors-cache');
const APP = 'https://phenomemental.github.io/community-recovery/';
const SITE = 'https://happyseaurchin.com/';

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
  envelope: { _: string; '1': string; '2': string; '9': { _: 'gray'; '1': 'self' } };
}

// The inputs. A place address (the app's salt today), a SHORT handle (under eight bytes, the
// padding case), a handle, and the new beach's address.
const INPUTS: Array<Pick<Vector, 'name' | 'secret' | 'salt' | 'plaintext'>> = [
  { name: 'a-day-at-the-place', secret: 'amber kite seventeen', salt: 'https://beach.happyseaurchin.com/w/community-recovery', plaintext: 'Kept 2 November 2026 — a quiet day: two walks, one call, early night.' },
  { name: 'a-short-handle', secret: 'cedar lamp quiet river', salt: 'Ada', plaintext: 'Día claro — café ☕ y nada más.' },
  { name: 'a-handle', secret: 'three words here', salt: 'happyseaurchin', plaintext: '{"_":"a card","5":"beyond"}' },
  { name: 'the-new-beach', secret: 'weft everyday test key', salt: 'https://beach.bringingtheflavour.com', plaintext: "the first day on David's own beach" },
];

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (u: Uint8Array) => Buffer.from(u).toString('base64');
const unb64 = (s: string) => new Uint8Array(Buffer.from(s, 'base64'));
const hex = (u: Uint8Array) => Buffer.from(u).toString('hex');
const NOTE = 'Encrypted (gray); readable only with the author secret.';

let passed = 0, failed = 0;
const ok = (label: string, cond: boolean, detail = '') => {
  if (cond) { passed++; console.log(`  ✓ ${label}`); } else { failed++; console.error(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
};
const skip = (label: string, why: string) => console.log(`  · ${label} — ${why}`);

async function make(): Promise<Vector[]> {
  const out: Vector[] = [];
  for (const v of INPUTS) {
    const nonce = new Uint8Array(createHash('sha256').update(`gray-vectors:${v.name}`).digest()).slice(0, nacl.secretbox.nonceLength);
    const keys = await deriveKeypair(v.secret, v.salt);
    const key = keys.x25519.secretKey;
    const ct = nacl.secretbox(enc.encode(v.plaintext), nonce, key);
    out.push({
      ...v,
      nonce_b64: b64(nonce),
      key_hex: hex(key),
      ciphertext_b64: b64(ct),
      x25519_pub_b64: b64(keys.x25519.publicKey),
      ed25519_pub_b64: b64(keys.ed25519.publicKey),
      envelope: { _: NOTE, '1': b64(ct), '2': b64(nonce), '9': { _: 'gray', '1': 'self' } },
    });
  }
  return out;
}

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return await r.text();
}

// ── keys.ts: the reference ──
async function checkKeys(vs: Vector[]) {
  console.log('\nkeys.ts (bsp-mcp)');
  for (const v of vs) {
    const keys = await deriveKeypair(v.secret, v.salt);
    ok(`${v.name}: key`, hex(keys.x25519.secretKey) === v.key_hex);
    const ct = nacl.secretbox(enc.encode(v.plaintext), unb64(v.nonce_b64), keys.x25519.secretKey);
    ok(`${v.name}: seal with the fixed nonce`, b64(ct) === v.ciphertext_b64);
    ok(`${v.name}: open`, (await selfDecrypt(v.envelope as any, v.secret, v.salt)) === v.plaintext);
    ok(`${v.name}: published keys`, b64(keys.x25519.publicKey) === v.x25519_pub_b64 && b64(keys.ed25519.publicKey) === v.ed25519_pub_b64);
  }
}

// ── vault.js: the site's seal, run in Node through its own require branch ──
async function checkVault(vs: Vector[]) {
  console.log('\nvault.js (happyseaurchin.com)');
  let vault: any;
  try {
    const src = await fetchText(SITE + 'vault.js');
    mkdirSync(CACHE, { recursive: true });
    const p = join(CACHE, 'vault.cjs');
    writeFileSync(p, src);
    vault = createRequire(import.meta.url)(p);
  } catch (e: any) { ok('vault.js fetched and loaded', false, e?.message ?? String(e)); return; }
  ok('vault.js exports seal and open', typeof vault?.seal === 'function' && typeof vault?.open === 'function', `exports: ${Object.keys(vault || {}).join(', ')}`);
  if (typeof vault?.open !== 'function') return;
  for (const v of vs) {
    let opened: any = null, err = '';
    try { opened = await vault.open(v.envelope, v.secret, v.salt); } catch (e: any) { err = e?.message ?? String(e); }
    ok(`${v.name}: vault.js opens the keys.ts envelope`, opened === v.plaintext, err);
    try {
      const env = await vault.seal(v.plaintext, v.secret, v.salt);
      ok(`${v.name}: keys.ts opens the vault.js envelope`, (await selfDecrypt(env, v.secret, v.salt)) === v.plaintext);
    } catch (e: any) { ok(`${v.name}: keys.ts opens the vault.js envelope`, false, e?.message ?? String(e)); }
  }
}

// ── gray.js: the app's seal, run in Node with a window shim and its own vendored argon2 ──
async function checkGray(vs: Vector[]) {
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
      const f = todo.pop()!; if (seen.has(f)) continue; seen.add(f);
      const src = await fetchText(APP + 'vendor/noble-hashes/' + f);
      writeFileSync(join(vendor, f), src);
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
  for (const v of vs) {
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
async function checkStack(vs: Vector[]) {
  console.log('\nstack.html (happyseaurchin.com)');
  let derive: any;
  try {
    const html = await fetchText(SITE + 'stack.html');
    const m = html.match(/async function derive\(secret, handle\)\{([\s\S]*?)\n\}/);
    if (!m) throw new Error('derive(secret, handle) not found in the page');
    const libs = async () => ({ argon2id, nacl });
    derive = new Function('libs', 'b64', 'unb64', `return (async function derive(secret, handle){${m[1]}\n})`)(libs, b64, unb64);
  } catch (e: any) { ok('stack.html fetched and its derive() extracted', false, e?.message ?? String(e)); return; }
  for (const v of vs) {
    if (v.salt.startsWith('http')) continue; // stack.html derives from a handle, never an address
    let got: any = null, err = '';
    try { got = await derive(v.secret, v.salt); } catch (e: any) { err = e?.message ?? String(e); }
    ok(`${v.name}: stack.html derives the same keys from "${v.salt}"`, !!got && got.xpub === v.x25519_pub_b64 && got.edpub === v.ed25519_pub_b64, err);
  }
}

async function main() {
  if (process.argv.includes('--make')) {
    const vs = await make();
    mkdirSync(dirname(FIXTURE), { recursive: true });
    writeFileSync(FIXTURE, JSON.stringify({ _: 'gray test vectors — Argon2id(word, salt padded to 8 with NUL; t=3 m=65536 p=1, 64 bytes) → first 32 bytes the secretbox key; shared by keys.ts, gray.js, vault.js and stack.html. Regenerate with npm run smoke:gray-vectors -- --make.', vectors: vs }, null, 2) + '\n');
    console.log(`wrote ${vs.length} vectors → ${FIXTURE}`);
    return;
  }
  const vs: Vector[] = JSON.parse(readFileSync(FIXTURE, 'utf8')).vectors;
  await checkKeys(vs);
  if (process.env.GRAY_VECTORS_OFFLINE) { skip('the served places', 'GRAY_VECTORS_OFFLINE set'); }
  else { await checkVault(vs); await checkGray(vs); await checkStack(vs); }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
