/**
 * smoke-here.ts — the here-stamp: the standpoint on space as digits beside the clock.
 * Run: npm run smoke:here   (LIVE=1 adds one real passport read at the real)
 */
import { isBareHandle, spatialRung, renderHere, resolveHere, forgetHere, namesAPlace } from '../src/here.js';
import { passportLocationRef } from '../src/tools/pool.js';
import { groundResult, renderNow } from '../src/temporal.js';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
};

console.log('\nTHE RUNG — precision is where the digits stop');
ok('the family house is the household (+1)', spatialRung('31121100110').pscale === 1 && spatialRung('31121100110').word === 'the household');
ok('Pune is the city (+6)', spatialRung('32111000000').pscale === 6);
ok('Sutton Coldfield is the large town (+5)', spatialRung('31121100000').pscale === 5);
ok('Earth alone is the planet (+10)', spatialRung('30000000000').pscale === 10);
ok('the room at Awel Y Mor is 0', spatialRung('31110100111').pscale === 0);

console.log('\nTHE GATE — who has a standpoint of their own');
ok('a bare handle', isBareHandle('happyseaurchin'));
ok('a handle with a space', isBareHandle('Julie J'));
ok('a URL is not', !isBareHandle('https://beach.happyseaurchin.com'));
ok('sed: is not', !isBareHandle('sed:happyseaurchin-commons'));
ok('grain: is not', !isBareHandle('grain:343bbac1d99d903c'));
ok('the sentinel registry is not', !isBareHandle('pscale'));

console.log('\nTHE LINE — digits, the rung, the map; never the words');
const line = renderHere('31121100110');
ok('starts with the digits and the rung', line.startsWith('here · 31121100110 · the household (+1)'), line);
ok('names the map and the beach', line.includes('spatial:earth at earth.beach.happyseaurchin.com'));
ok('a dotted address still renders', renderHere('672.34').startsWith('here · 672.34'));

console.log('\nTHE ENVELOPE — beneath the now-stamp, never inside the body');
const NOW = new Date('2026-09-08T10:00:00Z');
const res = { content: [{ type: 'text', text: 'last seen 2026-09-07T12:00:00Z' }] };
const withHere = groundResult(res, NOW, line) as any;
ok('the here line follows the now line', withHere.content[0].text.endsWith(`${renderNow(NOW)}\n${line}`));
ok('the body is still aged', withHere.content[0].text.includes('2026-09-07T12:00:00Z ('));
const without = groundResult(res, NOW, null) as any;
ok('no here, no line', without.content[0].text.endsWith(renderNow(NOW)));
const err = groundResult({ isError: true, content: [{ type: 'text', text: 'boom' }] }, NOW, line) as any;
ok('an error stays ungrounded', err.content[0].text === 'boom');

console.log('\nUNREADABLE — a passport that names a place but cites no address');
{
  // The exact line David's assistant wrote, and reported as done: a good human
  // sentence, three different digit runs, and no reference the map can read.
  const real =
    'LOCATION — David\'s coordinate on the ground. 33 Firbarn Close, Sutton Coldfield, ' +
    'Birmingham, UK. pscale address: 31121111110 (house), 31121111111 (kitchen) — set ' +
    '2026-09-09, replacing the prior 31121100110/111.';
  ok('the real unreadable line is seen as naming a place', namesAPlace(real));
  ok('a proper star-ref is not nudged', !!passportLocationRef({ 3: 'Location: *:https://earth.beach.happyseaurchin.com:spatial:earth:31121111110 — home' }));
  ok('a passport with no position 3 is silent', !namesAPlace(undefined));
  ok('a posture with no place is silent', !namesAPlace('Met directly, with the work in view.'));
}

(async () => {
  console.log('\nRESOLVE — no standpoint for a non-handle, no network touched');
  ok('URL agent → null', (await resolveHere({ agent_id: 'https://beach.happyseaurchin.com' })) === null);
  ok('sentinel → null', (await resolveHere({ agent_id: 'pscale' })) === null);
  ok('no args → null', (await resolveHere(undefined)) === null);
  if (process.env.LIVE === '1') {
    console.log('\nLIVE — one passport read at the real');
    forgetHere();
    const t0 = Date.now();
    const a = await resolveHere({ handle: 'happyseaurchin' });
    const t1 = Date.now();
    const b = await resolveHere({ agent_id: 'happyseaurchin' });
    const t2 = Date.now();
    ok('happyseaurchin is placed', !!a && a.startsWith('here · 3'), String(a));
    ok('the second call is the memo (no read)', a === b && (t2 - t1) < (t1 - t0));
    console.log(`  ${a}`);
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
