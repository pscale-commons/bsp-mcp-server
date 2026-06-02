/**
 * smoke-gray-live.ts — gray-encryption end-to-end against the LIVE federated
 * beach at https://beach.happyseaurchin.com. This is the real proof the bug is
 * fixed: the spine-legal envelope now passes the beach shape gate (the old
 * {_gray, ciphertext, nonce} shape was rejected with 400 invalid_shape).
 *
 * Writes to a live beach and cleans up via Upstash REST DEL with creds from
 * ~/Projects/happyseaurchin/.env.local. Side-effecting + network — run
 * deliberately, not in CI. For the deterministic no-network check use
 * `npm run smoke:gray`.
 *
 * Run: npm run smoke:gray-live
 */

import { handleBsp } from '../src/tools/bsp.js';

const HOST = 'https://beach.happyseaurchin.com';
const TEST_BLOCK = `bsp-gray-smoke-${Date.now()}`;
const SECRET = `gray-smoke-${Date.now()}`;

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}
function getText(r: any): string { return r?.content?.[0]?.text ?? ''; }

/** Direct GET against the beach endpoint — sees raw stored bytes. */
async function rawGet(blockName: string): Promise<any> {
  const url = `${HOST}/.well-known/pscale-beach?block=${encodeURIComponent(blockName)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  return await res.json();
}

/** Delete a block via the beach's own DELETE endpoint (unlocked block needs only confirm:true). */
async function wipeBlock(blockName: string): Promise<boolean> {
  const url = `${HOST}/.well-known/pscale-beach?block=${encodeURIComponent(blockName)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm: true }),
    signal: AbortSignal.timeout(8000),
  });
  return res.ok;
}

/** New spine-legal envelope marker: position 9 underscore === "gray". */
function isEnvelope(node: any): boolean {
  return !!node && typeof node === 'object' && node['9'] && node['9']._ === 'gray'
    && typeof node['1'] === 'string' && typeof node['2'] === 'string';
}

async function main() {
  // ── T1: unlocked + gray=true → spine-legal envelope accepted by the gate ──
  console.log(`\n=== T1: Unlocked + gray=true on federated beach ===`);
  console.log(`  block: ${HOST}:${TEST_BLOCK}`);

  const r1seed = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '', pscale_attention: null,
    content: { _: 'gray smoke test block — safe to wipe' },
  });
  assert(getText(r1seed).toLowerCase().includes('wrote') || getText(r1seed).toLowerCase().includes('block'), 'T1 seed write accepted');

  // Gray-write a leaf at digit 1. The KEY assertion: this is no longer rejected
  // by the shape gate (the old envelope 400'd here).
  const r1w = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '1', pscale_attention: null,
    content: 'secret-payload-T1', secret: SECRET, gray: true,
  });
  assert(getText(r1w).toLowerCase().includes('wrote'), 'T1 gray write accepted by the beach shape gate');

  const raw1 = await rawGet(TEST_BLOCK);
  const env1 = raw1?.['1'];
  assert(isEnvelope(env1), 'T1 raw GET shows spine-legal gray envelope at position 1');
  assert(env1?.['9']?.['1'] === 'self', 'T1 envelope mode is self');
  assert(JSON.stringify(env1).indexOf('secret-payload-T1') === -1, 'T1 plaintext NOT visible in raw block');

  const r1readOpen = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '1', pscale_attention: null,
  });
  assert(!getText(r1readOpen).includes('secret-payload-T1'), 'T1 read without secret does NOT leak plaintext');

  const r1readKey = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '1', pscale_attention: null,
    secret: SECRET,
  });
  assert(getText(r1readKey).includes('secret-payload-T1'), 'T1 read with secret returns plaintext');

  // ── T2: gray=true without secret → rejected ──
  console.log(`\n=== T2: gray=true without secret → rejected ===`);
  const r2 = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '2', pscale_attention: null,
    content: 'should-fail', gray: true,
  });
  assert(getText(r2).toLowerCase().includes('requires secret'), 'T2 rejected with helpful message');

  // ── T3: subtree gray (object payload) ──
  console.log(`\n=== T3: Subtree gray (object payload) → envelope wraps subtree ===`);
  const r3w = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '3', pscale_attention: null,
    content: { _: 'sub-summary', '1': 'leaf-A', '2': 'leaf-B' },
    secret: SECRET, gray: true,
  });
  assert(getText(r3w).toLowerCase().includes('wrote'), 'T3 subtree gray write accepted');

  const raw3 = await rawGet(TEST_BLOCK);
  assert(isEnvelope(raw3?.['3']), 'T3 envelope wraps subtree position');

  const r3read = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '3', pscale_attention: null,
    secret: SECRET,
  });
  assert(getText(r3read).includes('leaf-A'), 'T3 decrypted content contains leaf-A');

  // ── T4: gray omitted (default) → plaintext (no regression) ──
  console.log(`\n=== T4: gray omitted (default) → plaintext (no regression) ===`);
  await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '4', pscale_attention: null,
    content: 'plain-payload',
  });
  const raw4 = await rawGet(TEST_BLOCK);
  assert(raw4?.['4'] === 'plain-payload', 'T4 plaintext preserved when gray omitted');

  // ── T5: mixed-leaf block, single decrypt-walk handles all gray nodes ──
  console.log(`\n=== T5: Mixed plaintext + gray leaves, decrypt-walk handles all ===`);
  const r5 = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '', pscale_attention: null,
    secret: SECRET,
  });
  const t5 = getText(r5);
  assert(t5.includes('secret-payload-T1'), 'T5 whole-block read decrypts position 1');
  assert(t5.includes('leaf-A'), 'T5 whole-block read decrypts position 3');
  assert(t5.includes('plain-payload'), 'T5 whole-block read shows plaintext at position 4');

  // ── Cleanup (beach DELETE with confirm) ──
  console.log(`\n=== Cleanup ===`);
  const wiped = await wipeBlock(TEST_BLOCK);
  const verify = await rawGet(TEST_BLOCK);
  assert(wiped && verify === null, 'cleanup: federated block deleted');

  console.log(`\n=== Results: ${pass} pass, ${fail} fail ===\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
