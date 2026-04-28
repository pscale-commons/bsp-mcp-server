/**
 * One-off probe: verify floor depth and walk behaviour against sunstone/whetstone.
 * Used to validate the pscale formula before committing to it in bsp-fn.ts.
 */
import { floorDepth, bsp, parseAddress } from '../src/bsp.js';
import sunstone from '../src/sunstone.json' with { type: 'json' };
import whetstone from '../src/whetstone.json' with { type: 'json' };

console.log('=== sunstone ===');
console.log('floor:', floorDepth(sunstone as any));
console.log('root underscore type:', typeof (sunstone as any)._);

console.log('\n=== whetstone ===');
console.log('floor:', floorDepth(whetstone as any));

console.log('\n=== walk sunstone address "1" ===');
const r1 = bsp(sunstone as any, '1');
console.log(JSON.stringify(r1, null, 2).slice(0, 500));

console.log('\n=== walk sunstone address "1.1" ===');
const r2 = bsp(sunstone as any, '1.1');
console.log(JSON.stringify(r2, null, 2).slice(0, 500));

console.log('\n=== walk sunstone address "7" star ===');
const r3 = bsp(sunstone as any, '7', '*');
console.log(JSON.stringify(r3, null, 2).slice(0, 800));
