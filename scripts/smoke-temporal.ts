/**
 * smoke-temporal.ts — the temporal coordinate, proved against David's law
 * (2026-07-15): "base ten at lower than −3 (second) and higher than pscale 5
 * (year); analogue between, because humans created their imperial measurement
 * system. The pscale block turns all semantics into decimals."
 *
 * The claim is arithmetic and therefore checkable: the ratios between adjacent
 * rungs must be exactly 10 in the base-ten zone and never 10 in the analogue
 * zone, and the second must land at exactly −3. Run: npm run smoke:temporal
 */

import {
  RUNGS, FINE_RUNGS, TEMPORAL_FLOOR,
  momentToAddress, addressToSpan, pscaleOfDuration, renderAge, renderNow, voiceAddress,
} from '../src/temporal.js';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
};
const eq = (name: string, got: unknown, want: unknown) =>
  ok(name, Object.is(got, want) || JSON.stringify(got) === JSON.stringify(want),
    `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const ratio = (a: number, b: number) => RUNGS.concat(FINE_RUNGS).find(r => r.pscale === a)!.seconds /
  RUNGS.concat(FINE_RUNGS).find(r => r.pscale === b)!.seconds;
const near = (x: number, y: number, tol = 0.02) => Math.abs(x - y) / y < tol;

console.log("\nDAVID'S LAW — base ten at the ends, analogue between");
ok('9→8 millennium→century divides by ten', near(ratio(9, 8), 10), `${ratio(9, 8)}`);
ok('8→7 century→decade divides by ten', near(ratio(8, 7), 10), `${ratio(8, 7)}`);
ok('7→6 decade→year divides by ten', near(ratio(7, 6), 10), `${ratio(7, 6)}`);
ok('6→5 year→season does NOT (÷4 — analogue begins)', near(ratio(6, 5), 4), `${ratio(6, 5)}`);
ok('5→4 season→month is ÷3 (analogue)', near(ratio(5, 4), 3), `${ratio(5, 4)}`);
ok('4→3 month→week is ÷4.35 (analogue)', near(ratio(4, 3), 4.35, 0.05), `${ratio(4, 3)}`);
ok('3→2 week→day is ÷7 (analogue)', near(ratio(3, 2), 7), `${ratio(3, 2)}`);
ok('2→1 day→gathering is ÷9 (analogue)', near(ratio(2, 1), 9), `${ratio(2, 1)}`);
ok('1→0 gathering→beat is ÷9 (analogue)', near(ratio(1, 0), 9), `${ratio(1, 0)}`);
ok('no analogue rung divides by ten',
  [[6, 5], [5, 4], [4, 3], [3, 2], [2, 1], [1, 0]].every(([a, b]) => !near(ratio(a, b), 10)));

console.log('\nTHE SECOND LANDS AT −3 (the boundary David named)');
eq('one second reads as pscale −3', pscaleOfDuration(1), -3);
ok('the −3 rung is ~1.5s (a second, to the analogue ladder)',
  near(FINE_RUNGS.find(r => r.pscale === -3)!.seconds, 1.46, 0.05));
ok('below −3 is out of the addressed form (base ten resumes: 0.1s, 0.01s)',
  !FINE_RUNGS.some(r => r.pscale < -3));

console.log('\nZERO — a value at the base-ten rungs, the voicing at the analogue rungs');
ok('the four base-ten rungs are exactly 9,8,7,6 (year and up)',
  JSON.stringify(RUNGS.filter(r => r.baseTen).map(r => r.pscale)) === '[9,8,7,6]');
ok('every analogue rung reserves 0 for the voicing (fanOut ≤ 9)',
  RUNGS.filter(r => !r.baseTen).every(r => r.fanOut <= 9));
ok('every base-ten rung uses 0 as a digit (fanOut 10)',
  RUNGS.filter(r => r.baseTen).every(r => r.fanOut === 10));

console.log('\nTHE GREGORIAN YEAR IS THE ADDRESS — no epoch');
const t = new Date('2026-07-15T18:30:00Z');
const addr = momentToAddress(t);
eq('2026-07-15 18:30 UTC → 2026313179', addr, '2026313179');
eq('the first four digits ARE the year', addr.slice(0, 4), '2026');
eq('floor 10 — ten rungs, ten digits', addr.length, TEMPORAL_FLOOR);
eq('and it voices itself', voiceAddress(addr), 'Wednesday 15 July 2026, late afternoon (beat 9)');

console.log('\nROUND TRIP — the address names a span that contains its moment');
for (const iso of ['2026-07-15T18:30:00Z', '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z',
  '2020-02-29T12:00:00Z', '1999-12-31T23:59:00Z', '2100-06-15T06:00:00Z']) {
  const d = new Date(iso);
  const a = momentToAddress(d);
  const { start, end } = addressToSpan(a);
  ok(`${iso} → ${a} → span contains it`, d >= start && d < end,
    `span ${start.toISOString()}..${end.toISOString()}`);
}

console.log('\nCOARSE FORMS — trailing zeros are floor-width padding');
eq('2026000000 is the year 2026 (pscale 6)', addressToSpan('2026000000').pscale, 6);
eq('  …and voices as the year', voiceAddress('2026000000'), '2026');
eq('2026310000 is July 2026 (pscale 4)', addressToSpan('2026310000').pscale, 4);
eq('  …and voices as the month', voiceAddress('2026310000'), 'July 2026');
eq('2000000000 is the millennium (pscale 9)', addressToSpan('2000000000').pscale, 9);
eq('  …and voices as the 2000s', voiceAddress('2000000000'), 'the 2000s');
eq('2100000000 is the century (pscale 8)', addressToSpan('2100000000').pscale, 8);
eq('2020000000 is the decade (pscale 7)', addressToSpan('2020000000').pscale, 7);

console.log('\nTHE WART — a year ending in 0 has no distinct coarse address');
ok('2020000000 reads as the DECADE, not the year 2020 (0-rung: the container speaks)',
  addressToSpan('2020000000').pscale === 7);
ok('…but a full-precision moment in 2020 is unambiguous (analogue rungs never emit 0)',
  /^2020[1-9]{6}$/.test(momentToAddress(new Date('2020-02-29T12:00:00Z'))),
  momentToAddress(new Date('2020-02-29T12:00:00Z')));

console.log('\nFULL WIDTH IS THE CANONICAL FORM (the earth lesson)');
ok('a short dotless form is refused — it would left-pad into the root underscore chain',
  (() => { try { addressToSpan('2026'); return false; } catch { return true; } })());

console.log('\nLAYER R — duration → rung, the headline fix');
eq('a day → +2', pscaleOfDuration(86400), 2);
eq('a week → +3', pscaleOfDuration(7 * 86400), 3);
eq('a year → +6', pscaleOfDuration(365 * 86400), 6);
eq('an hour → +1 (the gathering)', pscaleOfDuration(3600), 1);
eq('ten minutes → 0 (the beat)', pscaleOfDuration(600), 0);
eq('a decade → +7', pscaleOfDuration(10 * 365 * 86400), 7);

console.log('\nTHE FEATURE — the relation rendered beside the timestamp');
const now = new Date('2026-07-15T18:30:00Z');
eq('a day-old mark', renderAge('2026-07-14T18:30:00Z', now), '(+2 — about a day ago)');
eq('a four-day-old mark', renderAge('2026-07-11T18:30:00Z', now), '(+3 — days ago)');
eq('a mark from moments ago', renderAge('2026-07-15T18:28:00Z', now), '(-1 — a minute or two ago)');
eq('a future meet', renderAge('2026-07-16T18:30:00Z', now), '(+2 — in about a day)');
ok('a malformed ts renders nothing rather than lying', renderAge('not-a-date', now) === '');

console.log('\nTHE STAMP');
console.log(`  ${renderNow(now)}`);
ok('the stamp carries ISO, address, and voicing',
  renderNow(now) === 'now · 2026-07-15T18:30:00Z · 2026313179 · Wednesday 15 July 2026, late afternoon (beat 9)');

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
