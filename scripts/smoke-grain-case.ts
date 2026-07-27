/**
 * smoke-grain-case.ts — the casing guard at the grain door
 * (src/tools/grain.ts; the 2026-07-25 happyhedgehog/Ayush split).
 *
 * pair_id is sha256 of the two handles sorted and joined, case-sensitive and
 * unnormalised, so `ayush` and `Ayush` derive two different grain blocks. The
 * live fixture is the incident itself: Ayush spells himself with a capital A
 * at every block he owns, happyhedgehog reached the lowercase spelling, and
 * the two of them held channels neither could see in the other's block.
 *
 * The guard must refuse exactly the typo and nothing else — a genuinely new
 * handle has no presence anywhere and must stay reachable, or the beach stops
 * admitting newcomers to close a spelling bug.
 *
 *   npm run smoke:grain-case
 */
import { casingClashes } from '../src/tools/grain.js';

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

/** The live beach index, trimmed to the names that bear on this. */
const beach = {
  blocks: [
    'passport:Ayush', 'state-of-play:Ayush',
    'passport:happyhedgehog', 'shell:happyhedgehog', 'history:happyhedgehog', 'stash:happyhedgehog',
    'passport:weft', 'shell:weft', 'history:weft',
    'sed:tester', 'sed:general',
    'grain:5cff7ee4cd9ed664', 'grain:5051cc6cc08b6e79',
    'marks', 'lighthouse', 'pool:egg-one',
  ],
};

console.log('=== the incident ===');
check("'ayush' is caught, and 'Ayush' is what to use",
  casingClashes(beach, 'ayush').join() === 'Ayush');
check("'Ayush' as spelled passes through",
  casingClashes(beach, 'Ayush').length === 0);
check("'happyhedgehog' as spelled passes through",
  casingClashes(beach, 'happyhedgehog').length === 0);
check("'HappyHedgehog' is caught",
  casingClashes(beach, 'HappyHedgehog').join() === 'happyhedgehog');

console.log('\n=== a newcomer must stay reachable ===');
check('an unknown handle is never refused',
  casingClashes(beach, 'someone-brand-new').length === 0);
check('an unknown handle differing only in case from nothing here is not refused',
  casingClashes(beach, 'AYUSHX').length === 0);

console.log('\n=== no false positives from non-handle prefixes ===');
check("'tester' is not caught by sed:tester",
  casingClashes(beach, 'tester').length === 0);
check("'Tester' is not caught by sed:tester either",
  casingClashes(beach, 'Tester').length === 0);
check('a grain pair_id never reads as a handle',
  casingClashes(beach, '5CFF7EE4CD9ED664').length === 0);

console.log('\n=== a failed index read never refuses ===');
check('null index yields no clash', casingClashes(null, 'ayush').length === 0);
check('empty index yields no clash', casingClashes({ blocks: [] }, 'ayush').length === 0);

console.log('\n=== every spelling present is reported ===');
const messy = { blocks: ['passport:Bob', 'shell:BOB', 'history:bOb'] };
check('all differing spellings come back, exact absent',
  casingClashes(messy, 'bob').length === 3);
check('the exact spelling present silences the guard',
  casingClashes(messy, 'Bob').length === 0);

console.log(`\n${fail === 0 ? '✓' : '✗'} ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
