/**
 * smoke-federated-live.ts — verify the WellKnownAdapter fix against the LIVE
 * beach.happyseaurchin beach. Exercises the four auth tiers through the modified
 * saveBlockToBeach so we can prove the protocol skew is closed end-to-end.
 *
 * WRITES TO LIVE beach.happyseaurchin.com — uses agent_id "claude-pipe-test" and
 * passphrase "tier-c-passphrase-smoke" so the smoke is identifiable and easy
 * to clean up.
 *
 * Run: npx tsx scripts/smoke-federated-live.ts
 */

import { handleBsp } from '../src/tools/bsp.js';

const BEACH = 'https://beach.happyseaurchin.com';
const NOW = new Date().toISOString();
const HANDLE = 'claude-pipe-test';
const PASS = 'tier-c-passphrase-smoke';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}
function getText(r: any): string {
  return r?.content?.[0]?.text ?? '';
}

console.log(`Smoke against ${BEACH}\n  handle=${HANDLE}  ts=${NOW}\n`);

// Each smoke run writes marks at unique slots (timestamp suffix folded into supernest)
// to avoid collision across runs. Marks live at the 'marks' sibling block per
// block-conventions branch 9 — the URL surface has no "beach" block.
const SLOT_PRESENCE = String(7000 + (Date.now() % 1000));   // e.g. 7321 → walks 7,3,2,1
const SLOT_SUBSTANTIVE = String(8000 + (Date.now() % 1000));

console.log(`=== Tier A — anon presence at marks slot ${SLOT_PRESENCE} ===`);
const r1 = await handleBsp({
  agent_id: BEACH, block: 'marks',
  spindle: SLOT_PRESENCE, pscale_attention: -SLOT_PRESENCE.length,
  content: {
    _: `${HANDLE} @ ${NOW} — present at /`,
    '1': HANDLE, '2': '', '3': NOW,
  },
});
assert(getText(r1).includes('wrote'), `bsp() write returned: ${getText(r1).slice(0,120)}`);

console.log(`\n=== Tier B — handle-only substantive mark at marks slot ${SLOT_SUBSTANTIVE} ===`);
const r2 = await handleBsp({
  agent_id: BEACH, block: 'marks',
  spindle: SLOT_SUBSTANTIVE, pscale_attention: -SLOT_SUBSTANTIVE.length,
  content: {
    _: `pipe smoke from bsp-mcp at ${NOW} — handle-only substantive mark`,
    '1': HANDLE, '2': '', '3': NOW, '4': 'character',
  },
});
assert(getText(r2).includes('wrote'), `bsp() write returned: ${getText(r2).slice(0,120)}`);

console.log('\n=== Verify both landed on happyseaurchin (live curl) ===');
const cur1 = await fetch(`${BEACH}/.well-known/pscale-beach?block=marks&spindle=${SLOT_PRESENCE}`).then(r => r.json());
assert(cur1?.['1'] === HANDLE, `marks:${SLOT_PRESENCE} has agent_id=${HANDLE}`);
assert(!('4' in (cur1 ?? {})), `marks:${SLOT_PRESENCE} has no field 4 (presence shape)`);

const cur2 = await fetch(`${BEACH}/.well-known/pscale-beach?block=marks&spindle=${SLOT_SUBSTANTIVE}`).then(r => r.json());
assert(cur2?.['1'] === HANDLE, `marks:${SLOT_SUBSTANTIVE} has agent_id=${HANDLE}`);
assert(cur2?.['4'] === 'character', `marks:${SLOT_SUBSTANTIVE} has field 4 (substantive)`);

console.log('\n=== Tier C — handle+passphrase locked sibling block on happyseaurchin ===');
const SCRATCH = `claude-pipe-test-${Date.now()}`;  // unique to avoid lock-conflict on reruns
const r3 = await handleBsp({
  agent_id: BEACH, block: SCRATCH,
  content: { _: `Tier C federated scratch — created locked at ${NOW}` },
  new_lock: PASS,
});
assert(getText(r3).includes('wrote') || getText(r3).includes('lock'),
  `bsp() create-locked returned: ${getText(r3).slice(0,120)}`);

console.log('\n--- Try update WITHOUT secret (must reject) ---');
const r4 = await handleBsp({
  agent_id: BEACH, block: SCRATCH,
  content: { _: 'ATTACK ATTEMPT — should be rejected' },
});
assert(getText(r4).includes('rejected') || getText(r4).includes('locked'),
  `bsp() unsecured update returned: ${getText(r4).slice(0,120)}`);

console.log('\n--- Update WITH correct secret ---');
const r5 = await handleBsp({
  agent_id: BEACH, block: SCRATCH,
  content: { _: `Tier C federated scratch — updated under secret at ${NOW}` },
  secret: PASS,
});
assert(getText(r5).includes('wrote'),
  `bsp() authorised update returned: ${getText(r5).slice(0,120)}`);

console.log('\n--- Verify final state landed on happyseaurchin ---');
const cur3 = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(SCRATCH)}`).then(r => r.json());
assert((cur3?._ ?? '').includes('updated under secret'),
  `${SCRATCH}._ contains 'updated under secret': ${String(cur3?._ ?? '').slice(0,80)}`);

console.log(`\n=== ${pass}/${pass + fail} passed ===`);
process.exit(fail > 0 ? 1 : 0);
