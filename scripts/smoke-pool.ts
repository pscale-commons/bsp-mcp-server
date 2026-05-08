/**
 * Smoke test for pool conventions (block-conventions:4.2 + shell:4 markers).
 *
 * Exercises:
 *   - Whole-block write of a pool with several pre-populated contributions
 *   - Read whole-pool and verify shape
 *   - Read individual contribution sub-blocks
 *   - "Since marker" read pattern — filter positions > N (consumer-side)
 *   - "Since contributor X last contributed" read pattern — find max slot[N][1] == X
 *   - Append new contributions via point writes at next supernest slots
 *   - Verify supernest behaviour (slots 1..9, then 11..)
 *
 * Cleanup: deletes throwaway test pool on success.
 *
 * Run: SUPABASE_ANON_KEY=... npx tsx scripts/smoke-pool.ts
 */

import { handleBsp } from '../src/tools/bsp.js';
import { getClient } from '../src/db.js';

const TEST_AGENT = `pool-smoke-${Date.now()}`;
const TEST_BLOCK = 'pool:smoke';
const ALICE = 'test-alice';
const BOB = 'test-bob';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

function getText(r: any): string {
  return r?.content?.[0]?.text ?? '';
}

function ts(offsetSec = 0): string {
  return new Date(Date.now() + offsetSec * 1000).toISOString();
}

/** Walk a pool block, yielding [position, slot] pairs in supernest order. */
function* walkSupernest(pool: any, prefix = ''): Generator<[string, any]> {
  for (const digit of '123456789') {
    if (!(digit in pool)) continue;
    const child = pool[digit];
    const pos = prefix + digit;
    if (typeof child === 'object' && child !== null && '_' in child) {
      // Either a leaf-with-metadata (entry sub-block) or a deeper supernest node
      const childKeys = Object.keys(child).filter(k => /^[1-9]$/.test(k));
      const looksLikeEntry = '_' in child && (typeof child._ === 'string');
      if (looksLikeEntry && childKeys.every(k => typeof child[k] !== 'object' || child[k] === null)) {
        // Entry — its underscore is text and digit children are metadata strings
        yield [pos, child];
      } else {
        // Recurse into supernest
        yield* walkSupernest(child, pos);
      }
    }
  }
}

async function cleanup() {
  const client = getClient();
  await client.from('pscale_blocks').delete().eq('owner_id', TEST_AGENT);
}

async function main() {
  console.log(`\n=== Smoke test: pool conventions (block-conventions:4.2) ===`);
  console.log(`Test agent: ${TEST_AGENT}`);
  console.log(`Test block: ${TEST_BLOCK}\n`);

  // ─── 1. Write a fresh pool with three pre-populated contributions ───
  console.log(`=== 1. Write pool with three contributions ===`);
  const initialPool = {
    _: 'Smoke test pool — open multi-party accumulator',
    '1': { _: 'first contribution by alice', '1': ALICE, '3': ts(0) },
    '2': { _: 'second contribution by bob', '1': BOB, '3': ts(1) },
    '3': { _: 'third contribution by alice', '1': ALICE, '3': ts(2) },
  };
  const r1 = await handleBsp({
    agent_id: TEST_AGENT,
    block: TEST_BLOCK,
    spindle: '',
    pscale_attention: null,
    content: initialPool,
  });
  assert(getText(r1).includes('wrote'), 'whole-pool write succeeded');

  // ─── 2. Read whole pool and verify shape ───
  console.log(`\n=== 2. Read whole pool ===`);
  const r2 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '', pscale_attention: null,
  });
  const t2 = getText(r2);
  assert(t2.includes('Smoke test pool'), 'pool underscore readable');
  assert(t2.includes('first contribution by alice'), 'slot 1 contribution readable');
  assert(t2.includes(ALICE), 'contributor address present in entries');

  // ─── 3. Point read at slot 2 (one entry) ───
  console.log(`\n=== 3. Point read at slot 2 (one entry) ===`);
  const r3 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '2', pscale_attention: null,
  });
  const t3 = getText(r3);
  assert(t3.includes('second contribution by bob'), 'slot 2 entry text readable');
  assert(t3.includes(BOB), 'slot 2 contributor readable');

  // ─── 4. Read sub-position 1 of slot 2 (the contributor alone) ───
  console.log(`\n=== 4. Read contributor of slot 2 directly (spindle="21") ===`);
  const r4 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '21', pscale_attention: null,
  });
  const t4 = getText(r4);
  assert(t4.includes(BOB), 'spindle 21 returns slot 2 contributor');

  // ─── 5. Disc at pscale -1 (top-level entries) ───
  console.log(`\n=== 5. Disc at pscale -1 (all top-level slots) ===`);
  const r5 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '', pscale_attention: -1,
  });
  const t5 = getText(r5);
  assert(t5.includes('first') && t5.includes('second') && t5.includes('third'),
    'disc returns all three top-level entries');

  // ─── 6. Add slots 4-9 to fill the first supernest layer ───
  console.log(`\n=== 6. Append slots 4..9 (filling first layer) ===`);
  for (let i = 4; i <= 9; i++) {
    const contributor = i % 2 === 0 ? BOB : ALICE;
    await handleBsp({
      agent_id: TEST_AGENT, block: TEST_BLOCK,
      spindle: String(i), pscale_attention: null,
      content: { _: `entry ${i} by ${contributor}`, '1': contributor, '3': ts(i) },
    });
  }
  const r6 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '', pscale_attention: null,
  });
  const t6 = getText(r6);
  for (let i = 4; i <= 9; i++) {
    assert(t6.includes(`entry ${i}`), `slot ${i} present after fill`);
  }

  // ─── 7. Append slot 11 (first supernest into second layer) ───
  console.log(`\n=== 7. Supernest — append at slot 11 ===`);
  await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK,
    spindle: '11', pscale_attention: null,
    content: { _: 'entry 11 by alice (supernest!)', '1': ALICE, '3': ts(11) },
  });
  const r7 = await handleBsp({
    agent_id: TEST_AGENT, block: TEST_BLOCK, spindle: '11', pscale_attention: null,
  });
  assert(getText(r7).includes('supernest!'), 'slot 11 written and readable');

  // ─── 8. "Since marker" read — fetch whole pool, filter positions > 3 ───
  console.log(`\n=== 8. "Since marker N=3" read (whole-pool + client filter) ===`);
  const client = getClient();
  const { data: rows } = await client.from('pscale_blocks')
    .select('block')
    .eq('owner_id', TEST_AGENT)
    .eq('name', TEST_BLOCK)
    .single();
  const pool = (rows as any)?.block ?? {};
  const allEntries = Array.from(walkSupernest(pool));
  const sinceMarker3 = allEntries.filter(([pos]) => parseInt(pos, 10) > 3);
  assert(sinceMarker3.length === 7, // slots 4,5,6,7,8,9,11 = 7 entries
    `since-marker filter returned 7 entries (got ${sinceMarker3.length})`);
  console.log('  positions > 3:', sinceMarker3.map(([p]) => p).join(', '));

  // ─── 9. "Since alice last contributed" read — find max slot[N][1] == ALICE ───
  console.log(`\n=== 9. "Since alice last contributed" — derived from pool ===`);
  // Find highest slot where contributor is ALICE
  const aliceSlots = allEntries
    .filter(([_, slot]) => slot['1'] === ALICE)
    .map(([pos]) => parseInt(pos, 10));
  const aliceMax = Math.max(...aliceSlots);
  // Slots ALICE wrote: 1, 3, 5, 7, 9, 11 → max should be 11
  assert(aliceMax === 11, `alice's highest slot is 11 (got ${aliceMax})`);
  // Entries since alice last contributed = positions > aliceMax
  const sinceAlice = allEntries.filter(([pos]) => parseInt(pos, 10) > aliceMax);
  assert(sinceAlice.length === 0, 'no entries since alice last contributed (she is last)');
  console.log('  alice contributed at slots:', aliceSlots.join(', '), '(max=' + aliceMax + ')');

  // ─── 10. "Since bob last contributed" — bob's max is 8, so entries 9 and 11 ───
  console.log(`\n=== 10. "Since bob last contributed" ===`);
  const bobSlots = allEntries
    .filter(([_, slot]) => slot['1'] === BOB)
    .map(([pos]) => parseInt(pos, 10));
  const bobMax = Math.max(...bobSlots);
  // Slots BOB wrote: 2, 4, 6, 8 → max is 8
  assert(bobMax === 8, `bob's highest slot is 8 (got ${bobMax})`);
  const sinceBob = allEntries.filter(([pos]) => parseInt(pos, 10) > bobMax);
  // Positions > 8 in supernest order: 9, 11 = 2 entries
  assert(sinceBob.length === 2, `since bob: 2 entries (got ${sinceBob.length})`);
  console.log('  bob contributed at slots:', bobSlots.join(', '), '(max=' + bobMax + ')');
  console.log('  since bob:', sinceBob.map(([p]) => p).join(', '));

  // ─── Cleanup ───
  console.log(`\n=== Cleanup ===`);
  await cleanup();
  console.log('  test rows deleted');

  console.log(`\n=== Results: ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error('Smoke test threw:', e);
  await cleanup().catch(() => {});
  process.exit(1);
});
