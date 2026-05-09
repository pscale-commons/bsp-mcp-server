/**
 * Live federated smoke for the floor-anchor + multi-dot parser fix.
 *
 * Exercises both ends of the wire (bsp-mcp client + beach handler) against
 * a real federated beach. Run AFTER deploying the new pscale-beach.js to
 * ensure both sides agree on:
 *   - Multi-dot addresses are rejected at write (400 invalid_address)
 *   - Floor-aware reads: "34.5" must locate the same content at floor 2 / 3 /
 *     4 (after auto-pad)
 *   - Round-trip via federated path
 *
 * WRITES TO LIVE BEACH — uses unique handle suffix to avoid collisions.
 *
 * Run: npx tsx scripts/smoke-federated-parser.ts
 */

import { handleBsp } from '../src/tools/bsp.js';

const BEACH = process.env.SMOKE_BEACH || 'https://happyseaurchin.com';
const PASS = `parser-smoke-${Date.now()}`;
const SCRATCH = `claude-parser-test-${Date.now()}`;

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}
function getText(r: any): string {
  return r?.content?.[0]?.text ?? '';
}

console.log(`Federated parser smoke against ${BEACH}\n  scratch=${SCRATCH}\n`);

// ── Setup: create a floor-2 block ──
//
// A floor-2 block has root._ as an OBJECT whose _ is a string. We seed via
// whole-block write.

console.log('=== Seed: create floor-2 block ===');
const seed = await handleBsp({
  agent_id: BEACH, block: SCRATCH,
  content: {
    _: { _: 'floor-2 root for parser smoke' },
  },
  new_lock: PASS,
  // confirm gets passed through to the beach for whole-block writes
});
// The bsp-mcp tool sets confirm:true internally for whole-block writes.
// Look for a successful ack.
assert(
  getText(seed).includes('wrote') || getText(seed).includes('lock'),
  `seed wrote: ${getText(seed).slice(0,120)}`,
);

// ── Multi-dot reject ──

console.log('\n=== Multi-dot write rejected by beach ===');
const md = await handleBsp({
  agent_id: BEACH, block: SCRATCH,
  spindle: '1.2.3', pscale_attention: -3,
  content: 'should be rejected',
  secret: PASS,
});
assert(
  getText(md).includes('reject') || getText(md).includes('decimal'),
  `multi-dot rejected: ${getText(md).slice(0,200)}`,
);

// ── Floor-aware write at "34.5" (floor 2) ──

console.log('\n=== Write leaf at "34.5" on floor-2 block ===');
const w1 = await handleBsp({
  agent_id: BEACH, block: SCRATCH,
  spindle: '34.5', pscale_attention: -2,
  content: 'leaf-from-parser-smoke',
  secret: PASS,
});
assert(getText(w1).includes('wrote'), `write at 34.5 succeeded: ${getText(w1).slice(0,120)}`);

console.log('\n--- Verify by reading the whole block off the wire ---');
const whole = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(SCRATCH)}`).then(r => r.json());
assert(
  whole?.['3']?.['4']?.['5'] === 'leaf-from-parser-smoke',
  `leaf landed at root.3.4.5: ${JSON.stringify(whole?.['3']?.['4']?.['5'])}`,
);

console.log('\n--- Read back via "34.5" through bsp-mcp ---');
const r1 = await handleBsp({
  agent_id: BEACH, block: SCRATCH,
  spindle: '34.5',
});
assert(
  getText(r1).includes('leaf-from-parser-smoke'),
  `read at 34.5 found leaf: ${getText(r1).slice(0,120)}`,
);

// ── Floor-aware: same address at floor 2 from the wire side directly ──

console.log('\n=== Wire-direct: GET ?spindle=34.5 returns the leaf ===');
const wireR = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(SCRATCH)}&spindle=34.5`).then(r => r.json());
assert(
  wireR === 'leaf-from-parser-smoke',
  `wire GET at 34.5 returns leaf: ${JSON.stringify(wireR)}`,
);

// ── Wire-direct: multi-dot GET should 400 ──

console.log('\n=== Wire-direct: GET ?spindle=1.2.3 returns 400 ===');
const wireBad = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(SCRATCH)}&spindle=1.2.3`);
assert(
  wireBad.status === 400,
  `wire GET multi-dot returns 400: got ${wireBad.status}`,
);

// ── Cleanup ──

console.log('\n=== Cleanup: DELETE the scratch block ===');
const del = await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(SCRATCH)}`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ confirm: true, secret: PASS }),
}).then(r => r.json());
assert(del?.ok === true, `cleanup wipe: ${JSON.stringify(del)}`);

console.log(`\n=== ${pass}/${pass + fail} passed ===`);
process.exit(fail > 0 ? 1 : 0);
