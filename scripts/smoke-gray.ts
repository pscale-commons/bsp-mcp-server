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
  isGrayEnvelope,
  grayMode,
  publicKeysToSpine,
  publicKeysFromSpine,
} from '../src/keys.js';

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
