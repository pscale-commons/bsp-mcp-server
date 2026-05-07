/**
 * smoke-migration.ts — verifies growth-migration in writeAt and walkOrCreate.
 *
 * Rule: when an intermediate node is a string, the string migrates to the
 * underscore of the new sub-block before descending — preserving the parent
 * semantic instead of nuking it. Supernest-on-growth.
 *
 * Run: npx tsx scripts/smoke-migration.ts
 */

import { Block, writeAt } from '../src/bsp.js';
import { bspWrite } from '../src/bsp-fn.js';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

console.log('=== writeAt: intermediate string migrates to underscore ===');
{
  const block: Block = { _: 'block', '8': 'blue house' };
  writeAt(block, '8.1', 'front door');
  assert(block['8']._ === 'blue house', 'parent semantic preserved at 8._');
  assert(block['8']['1'] === 'front door', 'new child at 8.1');
  assert(block._ === 'block', 'root underscore untouched');
}

console.log('\n=== writeAt: deep migration through multiple levels ===');
{
  const block: Block = { _: 'block', '8': 'blue house' };
  // First grow 8.1, then grow 8.1.2 — the value at 8.1 ('front door' from above) should also migrate
  writeAt(block, '8.1', 'front door');
  writeAt(block, '8.1.2', 'brass handle');
  assert(block['8']._ === 'blue house', '8._ still preserved');
  assert(block['8']['1']._ === 'front door', 'second-level migration: 8.1._ = front door');
  assert(block['8']['1']['2'] === 'brass handle', 'leaf at 8.1.2');
}

console.log('\n=== writeAt: existing object intermediate is preserved (no migration triggered) ===');
{
  const block: Block = { _: 'block', '8': { _: 'blue house', '1': 'old child' } };
  writeAt(block, '8.2', 'new child');
  assert(block['8']._ === 'blue house', 'existing _ untouched');
  assert(block['8']['1'] === 'old child', 'existing sibling untouched');
  assert(block['8']['2'] === 'new child', 'new sibling added');
}

console.log('\n=== writeAt: write to terminus replaces (no migration at the leaf) ===');
{
  const block: Block = { _: 'block', '8': 'blue house' };
  writeAt(block, '8', 'red house');
  assert(block['8'] === 'red house', 'terminus write replaces');
}

console.log('\n=== bspWrite (point-write through walkOrCreate) preserves migration ===');
{
  const block: Block = { _: 'marks', '7': 'a substantive mark sentence' };
  // Point-write to 7.1 — the underscore at 7 should migrate from the string
  bspWrite(block, '7.1', null, 'a child of mark 7');
  assert(block['7']._ === 'a substantive mark sentence', 'bspWrite migration: 7._ preserved');
  assert(block['7']['1'] === 'a child of mark 7', 'bspWrite: child at 7.1');
}

console.log('\n=== Whole-mark write at empty slot: no migration needed ===');
{
  const block: Block = { _: 'marks block' };
  // Subtree write at slot 7 with the natural mark shape
  bspWrite(block, '7', -3, { _: 'mark text', '1': 'agent', '2': '', '3': '2026-05-06T00:00:00Z' });
  assert(block['7']._ === 'mark text', 'subtree write: _ landed');
  assert(block['7']['1'] === 'agent', 'subtree write: 1 landed');
}

console.log('\n=== Round-trip: grow a block from scratch, all underscores preserved ===');
{
  const block: Block = { _: 'house' };
  writeAt(block, '1', 'living room');
  writeAt(block, '1.1', 'sofa');
  writeAt(block, '1.2', 'lamp');
  writeAt(block, '2', 'kitchen');
  writeAt(block, '2.1', 'fridge');
  assert(block._ === 'house', 'house._');
  assert(block['1']._ === 'living room', '1._ migrated from string');
  assert(block['1']['1'] === 'sofa', '1.1');
  assert(block['1']['2'] === 'lamp', '1.2');
  assert(block['2']._ === 'kitchen', '2._ migrated');
  assert(block['2']['1'] === 'fridge', '2.1');
}

console.log(`\n=== ${pass}/${pass + fail} passed ===`);
process.exit(fail > 0 ? 1 : 0);
