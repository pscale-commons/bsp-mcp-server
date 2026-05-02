/**
 * End-to-end smoke test against live Supabase.
 *
 * Exercises:
 *   - bsp() read against a known existing block (sed:commons)
 *   - bsp() write to a throwaway block
 *   - bsp() read of the throwaway block to verify
 *   - lock + locked-write rejection + correct-secret-write acceptance
 *
 * Cleanup: deletes throwaway agent_id rows on success.
 *
 * Run: SUPABASE_ANON_KEY=... npx tsx scripts/smoke-end-to-end.ts
 */

import { handleBsp } from '../src/tools/bsp.js';
import { handleGrainReach } from '../src/tools/grain.js';
import { pairId } from '../src/locks.js';
import { getClient } from '../src/db.js';

const TEST_AGENT = `bsp-smoke-${Date.now()}`;
const TEST_BLOCK = 'test';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

function getText(r: any): string {
  return r?.content?.[0]?.text ?? '';
}

async function main() {
  console.log(`\n=== Reading sed:commons (existing live block) ===`);
  const r1 = await handleBsp({ agent_id: 'sed:commons', block: 'commons', spindle: '', pscale_attention: null });
  const t1 = getText(r1);
  assert(t1.includes('whole block') || t1.length > 100, 'sed:commons returned non-empty content');
  console.log('  text starts:', t1.slice(0, 200), '...');

  console.log(`\n=== Read sed:conventions branch 1 (point) ===`);
  const r2 = await handleBsp({ agent_id: 'sed:conventions', block: 'conventions', spindle: '1', pscale_attention: null });
  const t2 = getText(r2);
  assert(t2.includes('point'), 'sed:conventions/1 read as point');
  console.log('  ', t2.slice(0, 300), '...');

  console.log(`\n=== Whole-block write to ${TEST_AGENT}/${TEST_BLOCK} ===`);
  const r3 = await handleBsp({
    agent_id: TEST_AGENT,
    block: TEST_BLOCK,
    spindle: '',
    pscale_attention: null,
    content: { _: 'smoke test root', '1': 'first child' },
  });
  assert(getText(r3).includes('wrote block'), 'whole-block write succeeded');

  console.log(`\n=== Read it back ===`);
  const r4 = await handleBsp({ agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '', pscale_attention: null });
  assert(getText(r4).includes('smoke test root'), 'whole-block content readable');

  console.log(`\n=== Point write at "1" ===`);
  const r5 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '1', pscale_attention: null, content: 'updated child',
  });
  assert(getText(r5).includes('wrote point'), 'point write succeeded');

  const r6 = await handleBsp({ agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '1', pscale_attention: null });
  assert(getText(r6).includes('updated child'), 'point read after write');

  console.log(`\n=== R2: Lock unlocked block via new_lock (no secret needed) ===`);
  const SECRET = 'smoke-test-secret-9842';
  const r7 = await handleBsp({ agent_id: TEST_AGENT, block: TEST_BLOCK, new_lock: SECRET });
  assert(getText(r7).includes('Lock applied') || getText(r7).includes('lock'), 'R2 lock applied');

  console.log(`\n=== R3: Locked write without secret → rejected ===`);
  const r8 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '1', pscale_attention: null, content: 'should fail',
  });
  assert(getText(r8).includes('locked') || getText(r8).includes('rejected'), 'R3 unlocked write rejected');

  console.log(`\n=== R3: Locked write WITH secret → accepted ===`);
  const r9 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '1', pscale_attention: null,
    content: 'authorised update', secret: SECRET,
  });
  assert(getText(r9).includes('wrote'), 'R3 authorised write succeeded');

  const r10 = await handleBsp({ agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '1', pscale_attention: null });
  assert(getText(r10).includes('authorised update'), 'R3 authorised content readable');

  console.log(`\n=== R3: Locked write WITH WRONG secret → rejected ===`);
  const r11 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '1', pscale_attention: null,
    content: 'imposter update', secret: 'wrong-secret',
  });
  assert(getText(r11).includes('rejected') || getText(r11).includes('match'), 'R3 wrong-secret write rejected');

  console.log(`\n=== R4: Lock rotation requires current secret ===`);
  const NEW_SECRET = 'smoke-test-rotated-2103';

  // R4a: rotation without secret → rejected
  const r12 = await handleBsp({ agent_id: TEST_AGENT, block: TEST_BLOCK, new_lock: NEW_SECRET });
  assert(getText(r12).includes('rotation rejected') || getText(r12).includes('locked'), 'R4 rotation without secret rejected');

  // R4b: rotation with WRONG secret → rejected
  const r13 = await handleBsp({ agent_id: TEST_AGENT, block: TEST_BLOCK, secret: 'wrong', new_lock: NEW_SECRET });
  assert(getText(r13).includes('not match') || getText(r13).includes('rejected'), 'R4 rotation with wrong secret rejected');

  // R4c: rotation with CORRECT secret → accepted
  const r14 = await handleBsp({ agent_id: TEST_AGENT, block: TEST_BLOCK, secret: SECRET, new_lock: NEW_SECRET });
  assert(getText(r14).includes('rotated'), 'R4 rotation with correct secret accepted');

  // R4d: old secret no longer works
  const r15 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '1', pscale_attention: null,
    content: 'after rotation', secret: SECRET,
  });
  assert(getText(r15).includes('rejected') || getText(r15).includes('match'), 'R4 old secret no longer works');

  // R4e: new secret works
  const r16 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '1', pscale_attention: null,
    content: 'after rotation', secret: NEW_SECRET,
  });
  assert(getText(r16).includes('wrote'), 'R4 new secret works');

  console.log(`\n=== R1: Create-locked in single call ===`);
  const FRESH_AGENT = `bsp-smoke-r1-${Date.now()}`;
  const FRESH_SECRET = 'fresh-r1-secret';
  const r17 = await handleBsp({
    agent_id: FRESH_AGENT, block: 'created-locked',
    spindle: '', pscale_attention: null,
    content: { _: 'born locked', '1': 'first' },
    new_lock: FRESH_SECRET,
  });
  assert(getText(r17).includes('wrote') && getText(r17).includes('locked'), 'R1 create-and-lock atomic');

  // Verify the new block is locked
  const r18 = await handleBsp({
    agent_id: FRESH_AGENT, block: 'created-locked', spindle: '1', pscale_attention: null,
    content: 'imposter', // no secret
  });
  assert(getText(r18).includes('locked') || getText(r18).includes('rejected'), 'R1 new block actually locked');

  // Cleanup the R1 fresh block
  await getClient().from('pscale_blocks').delete().eq('owner_id', FRESH_AGENT);

  console.log(`\n=== sed: rejects new_lock ===`);
  const r19 = await handleBsp({
    agent_id: 'sed:commons', block: 'commons',
    new_lock: 'should-be-rejected',
  });
  assert(getText(r19).includes('only valid on ordinary'), 'sed: blocks reject new_lock');

  // ── Stage 6: in-block reach hint (no-inbox path) ──
  console.log(`\n=== Stage 6: grain establish writes in-block reach hint at position 8 ===`);
  const GRAIN_A = `bsp-smoke-grain-a-${Date.now()}`;
  const GRAIN_B = `bsp-smoke-grain-b-${Date.now()}`;
  const PASS_A = 'grain-a-secret-481';
  const PASS_B = 'grain-b-secret-572';
  const pid = pairId(GRAIN_A, GRAIN_B);
  const grainOwner = `grain:${pid}`;

  // A reaches first
  const g1 = await handleGrainReach({
    agent_id: GRAIN_A,
    partner_agent_id: GRAIN_B,
    description: 'smoke test grain — Stage 6 reach-hint demo',
    my_side_content: 'A side content',
    my_passphrase: PASS_A,
  });
  assert(getText(g1).includes('reached'), 'grain_reach establish returned "reached"');
  assert(getText(g1).includes('in-block at grain:'), 'guidance mentions in-block discovery');

  // Walk the grain block — block['8']._reach_pending must be present
  const g2 = await handleBsp({
    agent_id: grainOwner, block: 'grain', spindle: '', pscale_attention: null,
  });
  const g2text = getText(g2);
  assert(g2text.includes('_reach_pending'), 'block[8]._reach_pending visible after establish');
  assert(g2text.includes(GRAIN_A), 'reach hint carries reaching agent_id');

  // Partner-discovery walk: a reader at GRAIN_B can find this grain by walking
  // to position 8 of grain blocks they appear at position 9 of. Subtree read
  // returns the _reach_pending metadata directly.
  const g3 = await handleBsp({
    agent_id: grainOwner, block: 'grain', spindle: '8', pscale_attention: -3,
  });
  assert(getText(g3).includes('_reach_pending') && getText(g3).includes('grain_address_yours'),
         'subtree walk to 8 returns the reach hint payload');

  // B accepts
  const g4 = await handleGrainReach({
    agent_id: GRAIN_B,
    partner_agent_id: GRAIN_A,
    description: 'ignored on accept',
    my_side_content: 'B side content',
    my_passphrase: PASS_B,
  });
  assert(getText(g4).includes('completed') || getText(g4).includes('Both sides'),
         'grain_reach accept completed the grain');

  // After accept, block['8'] should be cleared
  const g5 = await handleBsp({
    agent_id: grainOwner, block: 'grain', spindle: '', pscale_attention: null,
  });
  const g5text = getText(g5);
  assert(!g5text.includes('_reach_pending'), 'block[8]._reach_pending cleared on accept');
  assert(g5text.includes('A side content') && g5text.includes('B side content'),
         'both sides present after completion');

  // Cleanup
  console.log(`\n=== Cleanup ===`);
  const client = getClient();
  const { error } = await client.from('pscale_blocks').delete().eq('owner_id', TEST_AGENT);
  if (error) console.log(`  cleanup error: ${error.message}`);
  else console.log(`  ✓ deleted ${TEST_AGENT} rows`);

  // Cleanup grain block + sand_inbox rows from the Stage 6 test
  await client.from('pscale_blocks').delete().eq('owner_id', grainOwner);
  await client.from('sand_inbox').delete().in('from_agent', [GRAIN_A, GRAIN_B]);
  console.log(`  ✓ cleaned up grain:${pid} + sand_inbox rows`);

  console.log(`\n=== ${pass}/${pass + fail} passed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(2);
});
