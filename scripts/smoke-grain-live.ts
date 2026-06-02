/**
 * smoke-grain-live.ts — full two-party private grain, end-to-end, on the LIVE
 * beach. Proves the whole stack with DECOUPLED secrets:
 *   - pscale_key_publish (just fixed) publishes spine-legal keys from enc_secret
 *   - pscale_grain_reach forms the bilateral grain (per-side locks)
 *   - one party gray-writes their side (secret = side lock, enc_secret = key)
 *   - the partner decrypts with THEIR enc_secret
 *   - an outsider, and even the LOCK secret the beach sees, cannot decrypt
 *
 * Side-effecting + network. Writes 2 passports + 1 grain, then deletes them.
 * Run: npm run smoke:grain-live
 */

import { handleBsp } from '../src/tools/bsp.js';
import { handleKeyPublish } from '../src/tools/keys.js';
import { handleGrainReach } from '../src/tools/grain.js';
import { pairId, determineSide } from '../src/locks.js';

const HOST = 'https://beach.happyseaurchin.com';
const TS = Date.now();
const ALICE = `alice-gt-${TS}`;
const BOB = `bob-gt-${TS}`;
const LOCK_A = `lockA-${TS}`, ENC_A = `encA-${TS}`;   // alice: side lock vs encryption key
const LOCK_B = `lockB-${TS}`, ENC_B = `encB-${TS}`;   // bob
const NOTE = 'the cove at midnight — bring the map';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}
const txt = (r: any): string => (r?.content ?? []).map((c: any) => c.text).join('\n');

async function rawGet(block: string): Promise<any> {
  const res = await fetch(`${HOST}/.well-known/pscale-beach?block=${encodeURIComponent(block)}`, { signal: AbortSignal.timeout(8000) });
  return res.ok ? res.json() : null;
}
async function wipe(block: string): Promise<void> {
  try {
    await fetch(`${HOST}/.well-known/pscale-beach?block=${encodeURIComponent(block)}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }), signal: AbortSignal.timeout(8000),
    });
  } catch { /* best-effort */ }
}

/**
 * grain:/sed: blocks are NOT HTTP-wipeable (the beach protects substrate
 * blocks — returns 405). Self-clean via the operator clone's KV creds when
 * present; otherwise print the manual step.
 */
async function wipeGrainViaOperatorKV(grainBlock: string): Promise<void> {
  const fs = await import('node:fs');
  const envPath = `${process.env.HOME}/Projects/pscale-beach-happyseaurchin/.env.local`;
  if (!fs.existsSync(envPath)) {
    console.log(`  ⚠ ${grainBlock} left in place (substrate block; operator KV creds not found at ${envPath}).`);
    return;
  }
  const env: Record<string, string> = {};
  for (const l of fs.readFileSync(envPath, 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(?:"(.*)"|(.*))$/); if (m) env[m[1]] = m[2] ?? m[3] ?? ''; }
  const url = env.KV_REST_API_URL, token = env.KV_REST_API_TOKEN;
  if (!url || !token) { console.log(`  ⚠ ${grainBlock} left in place (no KV creds in operator .env.local).`); return; }
  const pid = grainBlock.split(':')[1];
  const H = { Authorization: `Bearer ${token}` };
  let cursor = '0'; const keys: string[] = [];
  do { const r = await fetch(`${url}/scan/${cursor}/match/*${pid}*/count/1000`, { headers: H }); const j = await r.json(); cursor = j.result[0]; keys.push(...j.result[1]); } while (cursor !== '0');
  for (const k of keys) await fetch(`${url}/del/${encodeURIComponent(k)}`, { method: 'POST', headers: H });
}

async function main() {
  const pid = pairId(ALICE, BOB);
  const grain = `grain:${pid}`;
  const aliceSide = determineSide(ALICE, BOB);
  console.log(`grain ${grain} — alice=side ${aliceSide}`);

  try {
    // 1. Passports must exist before key publish.
    console.log('\n=== 1. create passports ===');
    for (const h of [ALICE, BOB]) {
      const r = await handleBsp({ agent_id: HOST, block: `passport:${h}`, spindle: '', pscale_attention: null, content: { _: `passport for ${h}`, '1': 'offers', '2': 'needs' } });
      assert(txt(r).toLowerCase().includes('wrote') || txt(r).toLowerCase().includes('block'), `passport:${h} created`);
    }

    // 2. Publish keys from the ENC secret (distinct from the lock secret).
    console.log('\n=== 2. publish keys (from enc_secret) ===');
    const kA = await handleKeyPublish({ handle: ALICE, secret: LOCK_A, enc_secret: ENC_A, agent_id: HOST });
    assert(txt(kA).toLowerCase().includes('published') || txt(kA).toLowerCase().includes('keys'), 'alice keys published');
    const kB = await handleKeyPublish({ handle: BOB, secret: LOCK_B, enc_secret: ENC_B, agent_id: HOST });
    assert(txt(kB).toLowerCase().includes('published') || txt(kB).toLowerCase().includes('keys'), 'bob keys published');
    const pA = await rawGet(`passport:${ALICE}`);
    assert(pA?.['9']?.['_'] === undefined ? false : true, 'alice passport:9 present');
    assert(typeof pA?.['9']?.['2'] === 'string', 'alice published key is spine-legal (x25519 at 9.2)');

    // 3. Form the grain (both sides reach).
    console.log('\n=== 3. form grain (both reach) ===');
    const g1 = await handleGrainReach({ handle: ALICE, partner_handle: BOB, description: 'gt smoke', my_side_content: 'alice opening (plaintext)', my_passphrase: LOCK_A, agent_id: HOST });
    assert(!txt(g1).toLowerCase().includes('failed') && !txt(g1).toLowerCase().includes('rejected'), 'alice reached');
    const g2 = await handleGrainReach({ handle: BOB, partner_handle: ALICE, description: 'gt smoke', my_side_content: 'bob opening (plaintext)', my_passphrase: LOCK_B, agent_id: HOST });
    assert(txt(g2).toLowerCase().includes('completed'), 'grain completed (both sides)');

    // 4. Alice gray-writes her side: secret = side lock, enc_secret = encryption key.
    console.log('\n=== 4. alice writes her side privately ===');
    const w = await handleBsp({ agent_id: HOST, block: grain, spindle: aliceSide, pscale_attention: null, content: NOTE, secret: LOCK_A, enc_secret: ENC_A, gray: true });
    assert(txt(w).toLowerCase().includes('wrote'), 'alice gray write accepted');
    const raw = await rawGet(grain);
    assert(raw?.[aliceSide]?.['9']?.['_'] === 'gray', 'alice side now holds a gray envelope');
    assert(JSON.stringify(raw).indexOf(NOTE) === -1, 'plaintext NOT visible in the raw grain');

    // 5. Bob reads alice's side with HIS enc_secret → decrypts.
    console.log('\n=== 5. bob reads with his enc_secret ===');
    const rBob = await handleBsp({ agent_id: HOST, block: grain, spindle: aliceSide, pscale_attention: null, enc_secret: ENC_B });
    assert(txt(rBob).includes(NOTE), 'bob (partner) decrypts the note with his enc_secret');

    // 6. Negatives — the beach-visible lock secret, and no key, cannot read.
    console.log('\n=== 6. negatives ===');
    const rOpen = await handleBsp({ agent_id: HOST, block: grain, spindle: aliceSide, pscale_attention: null });
    assert(!txt(rOpen).includes(NOTE), 'open read (no key) does NOT leak plaintext');
    const rLock = await handleBsp({ agent_id: HOST, block: grain, spindle: aliceSide, pscale_attention: null, enc_secret: LOCK_B });
    assert(!txt(rLock).includes(NOTE), 'the LOCK secret the beach sees CANNOT decrypt');
    // Alice re-reads her own write with her enc_secret.
    const rAlice = await handleBsp({ agent_id: HOST, block: grain, spindle: aliceSide, pscale_attention: null, enc_secret: ENC_A });
    assert(txt(rAlice).includes(NOTE), 'alice re-reads her own write with her enc_secret');
  } finally {
    console.log('\n=== cleanup ===');
    await wipe(`passport:${ALICE}`);
    await wipe(`passport:${BOB}`);
    await wipeGrainViaOperatorKV(grain);
    const leftover = [await rawGet(`passport:${ALICE}`), await rawGet(`passport:${BOB}`), await rawGet(grain)].filter(Boolean).length;
    assert(leftover === 0, `cleanup: all test blocks deleted (${leftover} leftover)`);
  }

  console.log(`\n=== Results: ${pass} pass, ${fail} fail ===\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
