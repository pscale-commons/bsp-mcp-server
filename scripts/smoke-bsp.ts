/**
 * Smoke test the unified bsp() against sunstone and whetstone.
 * Walks the foundational blocks to verify shape derivation works end-to-end.
 */
import { bspRead, bspWrite, formatRead, formatWrite, pscaleAt, depthAt } from '../src/bsp-fn.js';
import { floorDepth } from '../src/bsp.js';
import sunstone from '../src/sunstone.json' with { type: 'json' };
import whetstone from '../src/whetstone.json' with { type: 'json' };

let pass = 0;
let fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

console.log('=== sunstone metadata ===');
console.log('floor:', floorDepth(sunstone as any));
console.log('pscale at depth 0 (floor 1):', pscaleAt(0, 1));
console.log('pscale at depth 1 (floor 1):', pscaleAt(1, 1));

console.log('\n=== whole-block read ===');
const whole = bspRead(sunstone as any, '', null);
assert(whole.shape === 'block', 'whole block shape');
assert(whole.block === sunstone, 'whole block returns same reference');

// Canonical 2026-05-17 vocabulary: a no-pscale spindle read is a PATH-WALK
// (not a point); the ring-equivalent is PATH-WALK+DESCENT (one descent layer);
// pscale = floor - depth (top-level branches at floor 1 are pscale 0).
console.log('\n=== path-walk read at "1.1" (no pscale) ===');
const p11 = bspRead(sunstone as any, '1.1', null);
assert(p11.shape === 'path-walk', 'path-walk shape');
assert(formatRead(p11).includes('polar geometry'), 'path-walk text contains polar geometry');
console.log('  ', formatRead(p11).split('\n').slice(0, 2).join(' / ').slice(0, 120), '...');

console.log('\n=== path-walk+descent at "1" pscale -1 (digit children of branch 1) ===');
const ringR = bspRead(sunstone as any, '1', -1);
assert(ringR.shape === 'path-walk+descent', 'path-walk+descent shape');
assert((ringR.descent?.length ?? 0) > 0, 'descent has digit children');
console.log('  descent addresses:', ringR.descent?.map(n => n.address).join(', '));

console.log('\n=== disc read at pscale 0 (top-level branches) ===');
const discR = bspRead(sunstone as any, '', 0);
assert(discR.shape === 'disc', 'disc shape');
assert(((discR.entries as any[])?.length ?? 0) >= 8, 'disc returns at least 8 nodes (sunstone branches)');
console.log('  count:', (discR.entries as any[])?.length);
console.log('  addresses:', (discR.entries as any[])?.slice(0, 5).map(n => n.address).join(', '), '...');

console.log('\n=== star read at "7*" (reflexive seed) ===');
const star7 = bspRead(sunstone as any, '7*', null);
assert(star7.shape === 'star', 'star shape');
assert(star7.semantic != null, 'star has semantic text');
assert(star7.inner != null, 'star has inner content');
console.log('  semantic:', star7.semantic?.slice(0, 100), '...');

console.log('\n=== whetstone signature read at "1.1" (no pscale → path-walk) ===');
const w11 = bspRead(whetstone as any, '1.1', null);
assert(w11.shape === 'path-walk', 'whetstone path-walk shape');
assert(formatRead(w11).includes('agent_id'), 'whetstone 1.1 describes agent_id');

console.log('\n=== write roundtrip — point write then read ===');
const testBlock: any = JSON.parse(JSON.stringify({ _: 'test', '1': 'original' }));
const writeR = bspWrite(testBlock, '1', null, 'updated');
assert(writeR.written, 'point write succeeded');
assert(testBlock['1'] === 'updated', 'point write changed value');

console.log('\n=== path-walk+descent write — replaces the subtree at terminus ===');
const ringBlock: any = { _: 'parent', '1': { _: 'first child', '9': 'pre-existing' } };
const descentWrite = bspWrite(ringBlock, '1', -1, { '1': 'a', '2': 'b', '3': 'c' });
assert(descentWrite.shape === 'path-walk+descent', 'descent write shape');
assert(ringBlock['1']['1'] === 'a', 'descent digit 1 written');
assert(ringBlock['1']['2'] === 'b', 'descent digit 2 written');
assert(ringBlock['1']['3'] === 'c', 'descent digit 3 written');
// Canonical descent write REPLACES the node (bsp-fn.ts:496); to retain prior
// keys include them in the payload. Here _ and 9 are intentionally dropped.
assert(ringBlock['1']._ === undefined && !('9' in ringBlock['1']), 'subtree replaced, not merged');

console.log('\n=== subtree write — replace whole node ===');
const subBlock: any = { _: 'root', '2': { _: 'old', '1': 'a' } };
bspWrite(subBlock, '2', -3, { _: 'new', '1': 'x', '2': 'y' });
assert(subBlock['2']._ === 'new', 'subtree underscore replaced');
assert(subBlock['2']['1'] === 'x', 'subtree digit 1 replaced');
assert(!('a' in subBlock['2']), 'old content gone');

console.log('\n=== formatters ===');
console.log(formatRead(p11));
console.log('---');
console.log(formatRead(ringR));
console.log('---');
console.log(formatRead(discR));
console.log('---');
console.log(formatRead(star7));

console.log(`\n=== ${pass}/${pass + fail} passed ===`);
process.exit(fail > 0 ? 1 : 0);
