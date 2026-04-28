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

console.log('\n=== point read at "1.1" ===');
const p11 = bspRead(sunstone as any, '1.1', null);
assert(p11.shape === 'point', 'point shape');
assert(p11.point !== null && p11.point.includes('polar geometry'), 'point text contains polar geometry');
console.log('  ', p11.point?.slice(0, 100), '...');

console.log('\n=== ring read at "1" (children of branch 1) ===');
const ringR = bspRead(sunstone as any, '1', -2);
assert(ringR.shape === 'ring', 'ring shape');
assert(ringR.ring !== undefined && '1' in ringR.ring, 'ring has digit 1');
console.log('  digits:', Object.keys(ringR.ring ?? {}).join(', '));

console.log('\n=== disc read at pscale -1 (top-level branches) ===');
const discR = bspRead(sunstone as any, '', -1);
assert(discR.shape === 'disc', 'disc shape');
assert((discR.disc?.length ?? 0) >= 8, 'disc returns at least 8 nodes (sunstone has 8 branches)');
console.log('  count:', discR.disc?.length);
console.log('  addresses:', discR.disc?.slice(0, 5).map(n => n.address).join(', '), '...');

console.log('\n=== star read at "7" (reflexive seed) ===');
const star7 = bspRead(sunstone as any, '7*', null);
assert(star7.shape === 'star', 'star shape');
assert(star7.star?.semantic !== null, 'star has semantic text');
assert(star7.star?.inner !== null, 'star has inner content');
console.log('  semantic:', star7.star?.semantic?.slice(0, 100), '...');

console.log('\n=== whetstone signature read at "1.1" ===');
const w11 = bspRead(whetstone as any, '1.1', null);
assert(w11.shape === 'point', 'whetstone point shape');
assert(w11.point !== null && w11.point.includes('agent_id'), 'whetstone 1.1 describes agent_id');

console.log('\n=== write roundtrip — point write then read ===');
const testBlock: any = JSON.parse(JSON.stringify({ _: 'test', '1': 'original' }));
const writeR = bspWrite(testBlock, '1', null, 'updated');
assert(writeR.written, 'point write succeeded');
assert(testBlock['1'] === 'updated', 'point write changed value');

console.log('\n=== ring write — populate digit children ===');
const ringBlock: any = { _: 'parent', '1': { _: 'first child' } };
bspWrite(ringBlock, '1', -2, { '1': 'a', '2': 'b', '3': 'c' });
assert(ringBlock['1']['1'] === 'a', 'ring digit 1 written');
assert(ringBlock['1']['2'] === 'b', 'ring digit 2 written');
assert(ringBlock['1']['3'] === 'c', 'ring digit 3 written');
assert(ringBlock['1']._ === 'first child', 'ring write preserved underscore');

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
