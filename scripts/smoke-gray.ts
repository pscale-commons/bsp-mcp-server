/**
 * Stage 10 smoke — gray-encryption end-to-end against the federated beach
 * at https://happyseaurchin.com. Validates the encrypt-at-source pattern:
 * bsp-mcp encrypts in tools/bsp.ts before saveBlock dispatches, so the
 * envelope rides through saveBlockToBeach to the federated POST as part of
 * the block content. The receiving site stores it as-is (no server-side
 * gray support required). On read, bsp-mcp's tool layer decrypts via
 * decryptBlockNodes when a secret is supplied.
 *
 * Cleanup uses Upstash REST DEL with creds sourced from
 * ~/Projects/happyseaurchin/.env.local, matching the runbook at
 * weft/stash:1.
 *
 * Run: npx tsx scripts/smoke-gray.ts
 *      No Supabase env needed. Uses live federated beach at happyseaurchin.com.
 */

import { handleBsp } from '../src/tools/bsp.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const HOST = 'https://happyseaurchin.com';
const TEST_BLOCK = `bsp-gray-smoke-${Date.now()}`;
const SECRET = `gray-smoke-${Date.now()}`;
const WRONG_SECRET = 'definitely-not-the-secret';

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

/** Source happyseaurchin's .env.local; returns Upstash creds. */
function loadUpstashCreds(): { url: string; token: string } | null {
  const p = path.join(os.homedir(), 'Projects/happyseaurchin/.env.local');
  if (!fs.existsSync(p)) return null;
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(?:"(.*)"|(.*))$/);
    if (m) env[m[1]] = m[2] ?? m[3] ?? '';
  }
  if (!env.KV_REST_API_URL || !env.KV_REST_API_TOKEN) return null;
  return { url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN };
}

/** Wipe a block + its locks via Upstash DEL (beach-cleanliness runbook). */
async function wipe(blockName: string, creds: { url: string; token: string }): Promise<void> {
  const auth = { Authorization: `Bearer ${creds.token}` };
  for (const key of [`pscale-beach-v2:block:${blockName}`, `pscale-beach-v2:locks:${blockName}`]) {
    await fetch(`${creds.url}/del/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: auth,
      signal: AbortSignal.timeout(6000),
    });
  }
}

async function main() {
  // ── T1: unlocked + gray=true → envelope stored on federated, decrypts on read ──
  console.log(`\n=== T1: Unlocked + gray=true on federated beach ===`);
  console.log(`  block: ${HOST}:${TEST_BLOCK}`);

  // Seed with an unlocked block (whole-block write, no gray, just establish presence).
  const r1seed = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '', pscale_attention: null,
    content: { _: 'gray smoke test block — safe to wipe' },
  });
  assert(getText(r1seed).toLowerCase().includes('wrote') || getText(r1seed).toLowerCase().includes('block'), 'T1 seed write accepted');

  // Gray-write a leaf at digit 1.
  const r1w = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '1', pscale_attention: null,
    content: 'secret-payload-T1', secret: SECRET, gray: true,
  });
  assert(getText(r1w).toLowerCase().includes('wrote'), 'T1 gray write accepted');

  // Raw GET should reveal the envelope structure.
  const raw1 = await rawGet(TEST_BLOCK);
  const env1 = raw1?.['1'];
  assert(env1 && typeof env1 === 'object' && env1._gray === true, 'T1 raw GET shows _gray envelope at position 1');
  assert(typeof env1?.ciphertext === 'string', 'T1 envelope has ciphertext');
  assert(typeof env1?.nonce === 'string', 'T1 envelope has nonce');
  assert(JSON.stringify(env1).indexOf('secret-payload-T1') === -1, 'T1 plaintext NOT visible in raw block');

  // Read via bsp() WITHOUT secret → envelope opaque, plaintext not recoverable.
  const r1readOpen = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '1', pscale_attention: null,
  });
  assert(!getText(r1readOpen).includes('secret-payload-T1'), 'T1 read without secret does NOT leak plaintext');

  // Read via bsp() WITH secret → decryptBlockNodes rehydrates → plaintext.
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
  assert(raw3?.['3']?._gray === true, 'T3 envelope wraps subtree position');

  const r3read = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '3', pscale_attention: null,
    secret: SECRET,
  });
  assert(getText(r3read).includes('leaf-A'), 'T3 decrypted content contains leaf-A');

  // ── T4: gray=false (default) → plaintext (no regression) ──
  console.log(`\n=== T4: gray omitted (default) → plaintext (no regression) ===`);
  await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '4', pscale_attention: null,
    content: 'plain-payload',
  });
  const raw4 = await rawGet(TEST_BLOCK);
  assert(raw4?.['4'] === 'plain-payload', 'T4 plaintext preserved when gray omitted');

  // ── T5: mixed-leaf block, single decrypt-walk handles all gray nodes ──
  console.log(`\n=== T5: Mixed plaintext + gray leaves, decrypt-walk handles all ===`);
  // Block now has: 1=gray, 2=(empty - rejected), 3=gray, 4=plain. Read whole block with secret.
  const r5 = await handleBsp({
    agent_id: HOST, block: TEST_BLOCK, spindle: '', pscale_attention: null,
    secret: SECRET,
  });
  const t5 = getText(r5);
  assert(t5.includes('secret-payload-T1'), 'T5 whole-block read decrypts position 1');
  assert(t5.includes('leaf-A'), 'T5 whole-block read decrypts position 3');
  assert(t5.includes('plain-payload'), 'T5 whole-block read shows plaintext at position 4');

  // ── Cleanup ──
  console.log(`\n=== Cleanup (Upstash DEL for federated beach) ===`);
  const creds = loadUpstashCreds();
  if (!creds) {
    console.log(`  ⚠ no Upstash creds found at ~/Projects/happyseaurchin/.env.local`);
    console.log(`  ⚠ TEST BLOCK LEFT IN PLACE: ${HOST}:${TEST_BLOCK}`);
    console.log(`  ⚠ wipe with: kv del pscale-beach-v2:block:${TEST_BLOCK} && kv del pscale-beach-v2:locks:${TEST_BLOCK}`);
  } else {
    await wipe(TEST_BLOCK, creds);
    const verify = await rawGet(TEST_BLOCK);
    assert(verify === null || Object.keys(verify ?? {}).length === 0, 'cleanup: federated block deleted');
  }

  console.log(`\n=== Results: ${pass} pass, ${fail} fail ===\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
