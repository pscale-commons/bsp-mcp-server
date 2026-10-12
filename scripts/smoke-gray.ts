/**
 * smoke-gray.ts — deterministic round-trip test for gray (encryption).
 *
 * No network. Exercises the crypto directly: self + grain encrypt/decrypt,
 * envelope detection, and — the property that was broken — SPINE-LEGALITY of
 * every envelope (only "_" and digits 1-9 as keys), which is exactly what the
 * federated beach shape gate enforces. If an envelope is spine-legal here, the
 * beach accepts it; that is the regression that would have caught the bug.
 *
 * The live end-to-end version is `npm run smoke:gray-live`.
 *
 * Run: npm run smoke:gray
 */

import {
  deriveKeypair,
  formatPublicKeys,
  selfEncrypt,
  selfDecrypt,
  grainEncrypt,
  grainDecrypt,
  grainReaderSide,
  isGrayEnvelope,
  grayMode,
  publicKeysToSpine,
  publicKeysFromSpine,
} from '../src/keys.js';
import { grainShutLine } from '../src/tools/bsp.js';

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

/** Mirror of the beach shape gate: every key must be "_" or a digit 1-9. */
function isSpineLegal(node: any): boolean {
  if (node === null || typeof node !== 'object') return true;
  if (Array.isArray(node)) return node.every(isSpineLegal);
  for (const k of Object.keys(node)) {
    if (k !== '_' && !/^[1-9]$/.test(k)) return false;
    if (!isSpineLegal(node[k])) return false;
  }
  return true;
}

async function main(): Promise<void> {
  console.log('— self encryption —');
  const text = 'a private note: meeting at the cove, 6pm';
  const env = await selfEncrypt(text, 'my-secret', 'happyseaurchin');
  ok('envelope is spine-legal (beach gate would accept)', isSpineLegal(env));
  ok('envelope is detected as gray', isGrayEnvelope(env));
  ok('mode is self', grayMode(env) === 'self');
  ok('round-trips with correct secret', (await selfDecrypt(env, 'my-secret', 'happyseaurchin')) === text);
  ok('wrong secret → null', (await selfDecrypt(env, 'WRONG', 'happyseaurchin')) === null);
  ok('wrong handle → null', (await selfDecrypt(env, 'my-secret', 'someone-else')) === null);

  console.log('— grain encryption (bilateral shared key) —');
  const aliceKeys = formatPublicKeys(await deriveKeypair('alice-secret', 'alice'));
  const bobKeys = formatPublicKeys(await deriveKeypair('bob-secret', 'bob'));
  const eveKeys = formatPublicKeys(await deriveKeypair('eve-secret', 'eve'));

  const msg = 'our shared draft — do not publish yet';
  // Alice writes her side, encrypted to the grain (partner = bob).
  const genv = await grainEncrypt(msg, 'alice-secret', 'alice', 'bob', bobKeys.x25519);
  ok('grain envelope is spine-legal', isSpineLegal(genv));
  ok('grain envelope detected, mode grain', grayMode(genv) === 'grain');
  ok('partner handle carried at 9.2', (genv['9'] as any)['2'] === 'bob');

  // Bob (the partner) reads it: his secret + alice's published key.
  ok('partner (bob) reads it', (await grainDecrypt(genv, 'bob-secret', 'bob', aliceKeys.x25519)) === msg);
  // Alice reads her own write back: her secret + bob's published key.
  ok('author (alice) reads own write', (await grainDecrypt(genv, 'alice-secret', 'alice', bobKeys.x25519)) === msg);
  // Outsider (eve) cannot, from either perspective.
  ok('outsider with bob-key → null', (await grainDecrypt(genv, 'eve-secret', 'eve', bobKeys.x25519)) === null);
  ok('outsider with alice-key → null', (await grainDecrypt(genv, 'eve-secret', 'eve', aliceKeys.x25519)) === null);
  // Right party, wrong counterparty key → null (auth fails).
  ok('bob with eve-key (wrong counterparty) → null', (await grainDecrypt(genv, 'bob-secret', 'bob', eveKeys.x25519)) === null);

  console.log('— secret-model decouple (lock key ≠ encryption key) —');
  // Each party has TWO secrets: a lock passphrase (goes to the beach to lock
  // their side) and an encryption secret (never leaves the client). Keys are
  // published from the ENC secret; grain content is encrypted with it.
  const LOCK_A = 'alice-lock-passphrase';
  const ENC_A = 'alice-encryption-secret';
  const LOCK_B = 'bob-lock-passphrase';
  const ENC_B = 'bob-encryption-secret';
  const aPub = formatPublicKeys(await deriveKeypair(ENC_A, 'alice'));
  const bPub = formatPublicKeys(await deriveKeypair(ENC_B, 'bob'));
  const note = 'decoupled secret note';
  const denv = await grainEncrypt(note, ENC_A, 'alice', 'bob', bPub.x25519);
  ok('partner decrypts with their ENC secret', (await grainDecrypt(denv, ENC_B, 'bob', aPub.x25519)) === note);
  ok('author re-reads with their ENC secret', (await grainDecrypt(denv, ENC_A, 'alice', bPub.x25519)) === note);
  ok('the LOCK secret the beach sees CANNOT decrypt (partner side)', (await grainDecrypt(denv, LOCK_B, 'bob', aPub.x25519)) === null);
  ok('the LOCK secret the beach sees CANNOT decrypt (author side)', (await grainDecrypt(denv, LOCK_A, 'alice', bPub.x25519)) === null);
  ok('lock secret and enc secret derive different keys', formatPublicKeys(await deriveKeypair(LOCK_A, 'alice')).x25519 !== aPub.x25519);

  console.log('— the seal guard (Dwayne ↔ Phenomemental, October 2026) —');
  // The field case: keys published from one secret, lines sealed with another.
  // The writer's read-back pairs the sealing secret with the PARTNER's key, so
  // it opens and says nothing is wrong; only the partner's read fails.
  const blind = await grainEncrypt(note, LOCK_A, 'alice', 'bob', bPub.x25519);
  ok('unguarded: the writer reads back a line sealed under the wrong secret', (await grainDecrypt(blind, LOCK_A, 'alice', bPub.x25519)) === note);
  ok('unguarded: the partner cannot open it', (await grainDecrypt(blind, ENC_B, 'bob', aPub.x25519)) === null);
  let refusal = '';
  try { await grainEncrypt(note, LOCK_A, 'alice', 'bob', bPub.x25519, aPub.x25519); } catch (e: any) { refusal = String(e?.message ?? e); }
  ok('guarded: a seal under a secret the passport does not carry is refused', refusal.includes('passport:alice 9') && refusal.includes('bob could never open it'));
  const sealed = await grainEncrypt(note, ENC_A, 'alice', 'bob', bPub.x25519, aPub.x25519);
  ok('guarded: a seal under the published secret travels, and the partner opens it', (await grainDecrypt(sealed, ENC_B, 'bob', aPub.x25519)) === note);

  console.log('— a shut grain line says whose key is off —');
  ok('reader side: the secret behind passport:alice is side 1', (await grainReaderSide(ENC_A, 'alice', aPub.x25519, 'bob', bPub.x25519)) === '1');
  ok('reader side: the secret behind passport:bob is side 2', (await grainReaderSide(ENC_B, 'alice', aPub.x25519, 'bob', bPub.x25519)) === '2');
  ok('reader side: a lock secret is neither', (await grainReaderSide(LOCK_B, 'alice', aPub.x25519, 'bob', bPub.x25519)) === null);
  ok('shut line: still leads with the bare [encrypted] marker',
    grainShutLine(blind, 'alice', 'bob', aPub.x25519, bPub.x25519, '2').startsWith('[encrypted] '));
  ok('shut line: a party with no published keys is named',
    grainShutLine(blind, 'alice', 'bob', null, bPub.x25519, null).includes('alice has no keys published'));
  ok('shut line: a reader whose key is neither party\'s is told to read with their published secret',
    grainShutLine(blind, 'alice', 'bob', aPub.x25519, bPub.x25519, null).includes('derives neither passport:alice 9 nor passport:bob 9'));
  ok('shut line: the partner with the right key is told the WRITER rewrites',
    grainShutLine(blind, 'alice', 'bob', aPub.x25519, bPub.x25519, '2').includes('your key is right; alice sealed this'));
  ok('shut line: the writer reading their own shut line is told to rewrite it',
    grainShutLine(blind, 'alice', 'bob', aPub.x25519, bPub.x25519, '1').includes('your key matches passport:alice 9'));

  console.log('— published keys (passport position 9) —');
  const pub = formatPublicKeys(await deriveKeypair('kp-secret', 'handle-1234'));
  const spine = publicKeysToSpine(pub);
  ok('published-keys spine is spine-legal (beach gate would accept)', isSpineLegal(spine));
  ok('NOT mistaken for a gray envelope', !isGrayEnvelope(spine));
  const back = publicKeysFromSpine(spine);
  ok('spine round-trips to the same keys', !!back && back.x25519 === pub.x25519 && back.ed25519 === pub.ed25519);
  const legacy = publicKeysFromSpine({ x25519: pub.x25519, ed25519: pub.ed25519 });
  ok('legacy bare-key shape still parses on read', !!legacy && legacy.x25519 === pub.x25519 && legacy.ed25519 === pub.ed25519);

  console.log('— non-envelope nodes —');
  ok('plain sub-block not detected as envelope', !isGrayEnvelope({ _: 'hi', '1': 'x' }));
  ok('string not detected as envelope', !isGrayEnvelope('just text'));

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
