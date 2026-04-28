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
import { handleLockBlock } from '../src/tools/lock.js';
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

  console.log(`\n=== Lock the block ===`);
  const SECRET = 'smoke-test-secret-9842';
  const r7 = await handleLockBlock({ agent_id: TEST_AGENT, block: TEST_BLOCK, secret: SECRET });
  assert(getText(r7).includes('now locked'), 'lock applied');

  console.log(`\n=== Locked write without secret → rejected ===`);
  const r8 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '1', pscale_attention: null, content: 'should fail',
  });
  assert(getText(r8).includes('locked') || getText(r8).includes('rejected'), 'unlocked write rejected');

  console.log(`\n=== Locked write WITH secret → accepted ===`);
  const r9 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '1', pscale_attention: null,
    content: 'authorised update', secret: SECRET,
  });
  assert(getText(r9).includes('wrote'), 'authorised write succeeded');

  const r10 = await handleBsp({ agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '1', pscale_attention: null });
  assert(getText(r10).includes('authorised update'), 'authorised content readable');

  console.log(`\n=== Locked write WITH WRONG secret → rejected ===`);
  const r11 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '1', pscale_attention: null,
    content: 'imposter update', secret: 'wrong-secret',
  });
  assert(getText(r11).includes('rejected') || getText(r11).includes('match'), 'wrong-secret write rejected');

  // Cleanup
  console.log(`\n=== Cleanup ===`);
  const client = getClient();
  const { error } = await client.from('pscale_blocks').delete().eq('owner_id', TEST_AGENT);
  if (error) console.log(`  cleanup error: ${error.message}`);
  else console.log(`  ✓ deleted ${TEST_AGENT} rows`);

  console.log(`\n=== ${pass}/${pass + fail} passed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(2);
});
