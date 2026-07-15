/**
 * smoke-grain-address.ts — the one grain law's pure helpers
 * (src/grain-address.ts; proposal 2026-07-15-pscale-of-agency).
 *
 * The canonical form is load-bearing three ways at once: pool names, passport
 * positions, and prefix (containment) arithmetic all speak it. David's worked
 * examples are the fixtures: thornkeep '3200' (floor 4, the town, +2), the
 * kitchen '3241' (0); thornwood '111' (floor 3, the room), '111.1' (the
 * hearth, −1), the quarter '100' (+2); the venture beat '111111' (floor 6, 0)
 * with '111111.1' the minute (−1).
 *
 *   npm run smoke:grain-address
 */
import {
  isLocationAddress, floorOf, walkedOf, canonicalAt, pscaleOf, contains, ancestorsOf,
} from '../src/grain-address.js';

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

console.log('=== form ===');
check('plain digits legal', isLocationAddress('3241'));
check('single decimal legal', isLocationAddress('111.1'));
check('multi-dot rejected', !isLocationAddress('1.2.3'));
check('commas rejected', !isLocationAddress('1,2,3'));
check('empty rejected', !isLocationAddress(''));

console.log('\n=== floor is carried by the form ===');
check("'3200' is a floor-4 address", floorOf('3200') === 4);
check("'111.1' is a floor-3 address", floorOf('111.1') === 3);
check("'111111' is a floor-6 address", floorOf('111111') === 6);

console.log('\n=== walked digits (padding stripped) ===');
check("the town '3200' walks two steps", walkedOf('3200') === '32');
check("the quarter '100' walks one", walkedOf('100') === '1');
check("the hearth '111.1' walks four", walkedOf('111.1') === '1111');
check("the room '111' walks three", walkedOf('111') === '111');

console.log('\n=== canonical form round-trips ===');
check("canonicalAt('32', 4) = '3200'", canonicalAt('32', 4) === '3200');
check("canonicalAt('1111', 3) = '111.1'", canonicalAt('1111', 3) === '111.1');
check("canonicalAt('111', 3) = '111'", canonicalAt('111', 3) === '111');
check('round-trip: walked → canonical → walked', walkedOf(canonicalAt(walkedOf('3200'), 4)) === '32');

console.log('\n=== pscale is position relative to the decimal ===');
check("kitchen '3241' at 0", pscaleOf('3241') === 0);
check("town '3200' at +2", pscaleOf('3200') === 2);
check("hearth '111.1' at −1", pscaleOf('111.1') === -1);
check("room '111' at 0", pscaleOf('111') === 0);
check("venture beat '111111' at 0", pscaleOf('111111') === 0);
check("venture minute '111111.1' at −1", pscaleOf('111111.1') === -1);
check("venture seconds '111111.11' at −2", pscaleOf('111111.11') === -2);

console.log('\n=== containment (the town contains the kitchen) ===');
check("'3200' contains '3241'", contains('3200', '3241'));
check("'3200' contains '3241.1'", contains('3200', '3241.1'));
check('no self-containment', !contains('3241', '3241'));
check('no reverse containment', !contains('3241', '3200'));
check("siblings do not contain ('3100' vs '3241')", !contains('3100', '3241'));

console.log('\n=== ancestors, nearest first, canonical at the same floor ===');
check("ancestorsOf('3241') = ['3240','3200','3000']", JSON.stringify(ancestorsOf('3241')) === JSON.stringify(['3240', '3200', '3000']));
check("ancestorsOf('111.1') = ['111','110','100']", JSON.stringify(ancestorsOf('111.1')) === JSON.stringify(['111', '110', '100']));
check("ancestorsOf('100') = [] (the quarter walks one step; nothing above)", ancestorsOf('100').length === 0);

console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
if (fail > 0) process.exit(1);
