/**
 * Smoke test for the gatekeeper sentinel block.
 *
 * Verifies:
 *   1. (pscale, 'gatekeeper') resolves via the sentinel adapter.
 *   2. The expected branch shape (1 voice, 2 criteria, 3 opening, 4 turn-2,
 *      5 decisions, 6 reply copy, 7 host invocation, 9 metadata) is present.
 *   3. Branch 7 (reflective host invocation) is non-empty — the load-bearing
 *      branch for third-party LLM clients (claude-app, chatgpt) running
 *      reflective admission.
 *   4. Writes to the sentinel reject — gatekeeper is read-only at (pscale, …).
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
  console.log('=== loadBlock(pscale, gatekeeper) ===');
  const row = await loadBlock('pscale', 'gatekeeper');
  assert(!!row, 'sentinel resolves');
  if (!row) {
    console.log('FAIL — no row, aborting'); process.exit(1);
  }

  const block = row.block as any;
  console.log('underscore:', String(block._).slice(0, 120), '...');

  console.log('\n=== shape — required branches present ===');
  for (const k of ['1', '2', '3', '4', '5', '6', '7', '9']) {
    assert(block[k] !== undefined, `branch ${k} present`);
  }

  console.log('\n=== branch 7 — host invocation patterns ===');
  const b7 = bspRead(block, '7', -2);
  assert(b7.shape === 'ring', 'branch 7 reads as ring');
  const ring7 = b7.ring ?? {};
  assert('1' in ring7 && '2' in ring7 && '3' in ring7,
    'branch 7 has digits 1 (host-invoked), 2 (reflective), 3 (self-assertion honest)');
  const reflective = String(ring7['2'] ?? '');
  assert(reflective.includes('passport') && reflective.includes('reflective') || reflective.toLowerCase().includes('third-party') || reflective.includes('shell'),
    'branch 7.2 references the reflective pattern');

  console.log('\n=== branch 3 — opening question is point text ===');
  const b3 = bspRead(block, '3', null);
  assert(b3.shape === 'point', 'branch 3 reads as point');
  assert((b3.point ?? '').length > 20, 'opening question is non-trivial text');
  console.log('  opening:', (b3.point ?? '').slice(0, 100), '...');

  console.log('\n=== branch 5 — decision rules ===');
  const b5 = bspRead(block, '5', -2);
  assert(b5.shape === 'ring', 'branch 5 reads as ring');
  const ring5 = b5.ring ?? {};
  assert('9' in ring5, 'branch 5.9 (output-shape spec) present');

  console.log('\n=== writes reject ===');
  try {
    await saveBlock('pscale', 'gatekeeper', { _: 'attack' } as any);
    fail++; console.log('  ✗ UNEXPECTED: save accepted');
  } catch (e) {
    pass++; console.log(`  ✓ save rejected: ${(e as Error).message.slice(0, 80)}`);
  }

  console.log(`\n=== ${pass} pass, ${fail} fail ===`);
  process.exit(fail === 0 ? 0 : 1);
})();
