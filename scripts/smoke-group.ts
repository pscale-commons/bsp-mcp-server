/**
 * smoke-group.ts — deterministic test for group (N-member) encryption.
 *
 * No network. A group key K is wrapped to each member's published key; each
 * member unwraps with only their own enc_secret (trial over the keyring); a
 * non-member cannot; content round-trips under K. Every keyring + envelope is
 * spine-legal (the beach shape gate would accept it).
 *
 * Run: npm run smoke:group
 */

import {
  deriveKeypair,
  formatPublicKeys,
  newGroupKey,
  wrapGroupKey,
  unwrapGroupKeyFromKeyring,
  groupEncryptContent,
  groupDecryptContent,
  grayMode,
  GROUP_KEYRING_MARKER,
  buildKeyring,
  keyringHandles,
} from '../src/keys.js';

let passed = 0, failed = 0;
function ok(label: string, cond: boolean): void {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`); }
}
function isSpineLegal(node: any): boolean {
  if (node === null || typeof node !== 'object') return true;
  if (Array.isArray(node)) return node.every(isSpineLegal);
  for (const k of Object.keys(node)) {
    if (k !== '_' && !/^[1-9]$/.test(k)) return false;
    if (!isSpineLegal(node[k])) return false;
  }
  return true;
}
const b64 = (u: Uint8Array) => Buffer.from(u).toString('base64');

async function main(): Promise<void> {
  console.log('— group keyring (owner + 2 invited members) —');
  const members = [
    { enc: 'owner-enc-secret', handle: 'owner' },
    { enc: 'm1-enc-secret', handle: 'mem-one' },
    { enc: 'm2-enc-secret', handle: 'mem-two' },
  ];
  const eve = { enc: 'eve-enc-secret', handle: 'eve' };

  const pubs = await Promise.all(members.map(async m => formatPublicKeys(await deriveKeypair(m.enc, m.handle)).x25519));

  const K = newGroupKey();
  const keyring: Record<string, any> = { _: GROUP_KEYRING_MARKER };
  members.forEach((m, i) => { keyring[String(i + 1)] = wrapGroupKey(K, m.handle, pubs[i]); });

  ok('keyring is spine-legal (beach gate would accept)', isSpineLegal(keyring));
  ok('keyring entry records the member handle', keyring['1']._ === 'owner');

  for (const m of members) {
    const got = await unwrapGroupKeyFromKeyring(keyring, m.enc);
    ok(`${m.handle} unwraps K with only their enc_secret`, !!got && b64(got) === b64(K));
  }
  ok('non-member (eve) cannot unwrap K', (await unwrapGroupKeyFromKeyring(keyring, eve.enc)) === null);

  console.log('— group content under K —');
  const secret = 'the vault code is 4417';
  const env = groupEncryptContent(secret, K);
  ok('content envelope is spine-legal', isSpineLegal(env));
  ok('envelope mode is group', grayMode(env) === 'group');
  ok('content decrypts with K', groupDecryptContent(env, K) === secret);
  const m1K = await unwrapGroupKeyFromKeyring(keyring, members[1].enc);
  ok('a member reads content via their unwrapped K', !!m1K && groupDecryptContent(env, m1K) === secret);
  ok('wrong group key → null', groupDecryptContent(env, newGroupKey()) === null);

  console.log('— invite a 4th member (wrap K to them; others unchanged) —');
  const m3 = { enc: 'm3-enc-secret', handle: 'mem-three' };
  const m3pub = formatPublicKeys(await deriveKeypair(m3.enc, m3.handle)).x25519;
  keyring['4'] = wrapGroupKey(K, m3.handle, m3pub);
  ok('newly-invited member unwraps the same K', b64((await unwrapGroupKeyFromKeyring(keyring, m3.enc))!) === b64(K));
  ok('still spine-legal after invite', isSpineLegal(keyring));
  ok('non-member still cannot', (await unwrapGroupKeyFromKeyring(keyring, eve.enc)) === null);

  console.log('— larger group: chained keyring past 8 (cap increase) —');
  const big: { enc: string; handle: string }[] = [];
  for (let i = 0; i < 10; i++) big.push({ enc: `big-enc-${i}`, handle: `big-h-${i}` });
  const bigPubs = await Promise.all(big.map(m => deriveKeypair(m.enc, m.handle).then(formatPublicKeys).then(k => k.x25519)));
  const Kbig = newGroupKey();
  const bigKeyring = buildKeyring(big.map((m, i) => wrapGroupKey(Kbig, m.handle, bigPubs[i])));
  ok('chained keyring is spine-legal', isSpineLegal(bigKeyring));
  ok('keyringHandles enumerates all 10', keyringHandles(bigKeyring).length === 10);
  ok('continuation page exists at 9', bigKeyring['9']?._ === 'more');
  ok('8th member (last of page 1) unwraps', b64((await unwrapGroupKeyFromKeyring(bigKeyring, big[7].enc))!) === b64(Kbig));
  ok('10th member (page 2) unwraps', b64((await unwrapGroupKeyFromKeyring(bigKeyring, big[9].enc))!) === b64(Kbig));
  ok('non-member cannot unwrap the chained keyring', (await unwrapGroupKeyFromKeyring(bigKeyring, 'outsider-enc')) === null);

  console.log('— rotation: remove a member (key rotates, content re-encrypts) —');
  const rot = [{ enc: 'ro-enc', handle: 'ro' }, { enc: 'r1-enc', handle: 'r1' }, { enc: 'r2-enc', handle: 'r2' }];
  const rotPubs = await Promise.all(rot.map(m => deriveKeypair(m.enc, m.handle).then(formatPublicKeys).then(k => k.x25519)));
  const K1 = newGroupKey();
  let kr = buildKeyring(rot.map((m, i) => wrapGroupKey(K1, m.handle, rotPubs[i])));
  const rmsg = 'rotate me';
  let renv = groupEncryptContent(rmsg, K1);
  ok('all 3 can read before rotation', groupDecryptContent(renv, (await unwrapGroupKeyFromKeyring(kr, rot[2].enc))!) === rmsg);
  // remove r2: new key, re-encrypt content, rebuild keyring for the remaining two.
  const K2 = newGroupKey();
  renv = groupEncryptContent(groupDecryptContent(renv, K1)!, K2);
  kr = buildKeyring(rot.slice(0, 2).map((m, i) => wrapGroupKey(K2, m.handle, rotPubs[i])));
  ok('removed member can no longer unwrap (not in new keyring)', (await unwrapGroupKeyFromKeyring(kr, rot[2].enc)) === null);
  ok('removed member cannot read rotated content (no K2)', groupDecryptContent(renv, K1) === null);
  ok('remaining member reads rotated content', groupDecryptContent(renv, (await unwrapGroupKeyFromKeyring(kr, rot[1].enc))!) === rmsg);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
