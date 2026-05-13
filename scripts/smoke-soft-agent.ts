/**
 * Smoke test for the soft-agent sentinel block.
 *
 * Verifies:
 *   1. (pscale, 'soft-agent') resolves via the sentinel adapter.
 *   2. The expected branch shape (1 ROLE, 2 KNOWLEDGE, 3 STYLE, 4 CONTEXT,
 *      5 FORMAT, 6 ACTIONS, 7 ACT-DON'T-ASK, 8 HERMITCRAB DISCIPLINE, 9 metadata).
 *   3. Branch 8 (hermitcrab discipline) is non-empty — the load-bearing branch
 *      that names the shell-as-identity discipline separating the soft-LLM
 *      from beach-crabs.
 *   4. Writes to the sentinel reject — soft-agent is read-only at (pscale, …).
 */
import { loadBlock, saveBlock } from '../src/db.js';
import { bspRead } from '../src/bsp-fn.js';

let pass = 0;
let fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

(async () => {
  console.log('=== loadBlock(pscale, soft-agent) ===');
  const row = await loadBlock('pscale', 'soft-agent');
  assert(!!row, 'sentinel resolves');
  if (!row) {
    console.log('FAIL — no row, aborting'); process.exit(1);
  }

  const block = row.block as any;
  console.log('underscore:', String(block._).slice(0, 120), '...');

  console.log('\n=== shape — required branches present ===');
  for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
    assert(block[k] !== undefined, `branch ${k} present`);
  }

  console.log('\n=== branch 8 — hermitcrab discipline ===');
  const b8 = bspRead(block, '8', -2);
  assert(typeof b8 === 'object' && b8 !== null, 'branch 8 reads as ring');
  if (typeof b8 === 'object' && b8 !== null) {
    const text = JSON.stringify(b8);
    assert(text.includes('hermitcrab') || text.toLowerCase().includes('shell'),
           'branch 8 names hermitcrab / shell pattern');
  }

  console.log('\n=== branch 6 — actions discipline ===');
  const b6 = bspRead(block, '6', -2);
  assert(typeof b6 === 'object' && b6 !== null, 'branch 6 reads as ring');
  if (typeof b6 === 'object' && b6 !== null) {
    const text = JSON.stringify(b6);
    assert(text.includes('propose_liquid') && text.includes('navigate') && text.includes('set_face'),
           'branch 6 lists side-effect tools (propose_liquid, navigate, set_face)');
  }

  console.log('\n=== writes reject ===');
  try {
    await saveBlock({ agent_id: 'pscale', name: 'soft-agent', block: { _: 'noop' } as any });
    fail++; console.log('  ✗ save did not reject');
  } catch (e: any) {
    pass++; console.log(`  ✓ save rejected: ${String(e?.message ?? e).slice(0, 80)}`);
  }

  console.log(`\n=== ${pass} pass, ${fail} fail ===`);
  process.exit(fail === 0 ? 0 : 1);
})();
