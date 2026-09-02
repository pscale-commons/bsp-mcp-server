/**
 * smoke-temporal-address.ts — the address-relation layer (Layer C) of
 * temporal.ts, plus its render seams: parseTemporalLabel's rung gate,
 * renderAddressRelation's partition (now / behind / AHEAD), the prose
 * annotation pass in annotateAges, formatRead's floor-10 label tagging and
 * field-3 stamp surfacing, and stampPlainAppend's wrap at the append door.
 *
 * Proves the 2026-09-02 temporal-comparison lane (watch:weft 223-224): the
 * reader partitions past from future by reading, never by arithmetic.
 * Relation cases run against a FIXED now (Wednesday 2 September 2026,
 * 10:18 UTC — address 2026331248); the formatRead cases run against the real
 * clock, with their addresses derived from it, so they hold on any day.
 */
import {
  momentToAddress,
  addressToSpan,
  parseTemporalLabel,
  renderAddressRelation,
  annotateAges,
} from '../src/temporal.js';
import { bspRead, formatRead } from '../src/bsp-fn.js';
import { writeAt } from '../src/bsp.js';
import { stampPlainAppend } from '../src/tools/bsp.js';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error(`✗ ${name}${detail ? ` — got: ${detail}` : ''}`);
  }
}

// Fixed now: Wednesday 2 September 2026, 10:18 UTC — address 2026331248.
const NOW = new Date(Date.UTC(2026, 8, 2, 10, 18, 0));
ok('momentToAddress(NOW)', momentToAddress(NOW) === '2026331248', momentToAddress(NOW));

// ── parseTemporalLabel: the rung gate ──
ok('full width parses', parseTemporalLabel('2026331248') !== null);
ok('short label right-pads', parseTemporalLabel('2026')?.addr === '2026000000');
ok('nine-digit wire label parses', parseTemporalLabel('202633134') !== null);
ok('season 7 rejected', parseTemporalLabel('2026700000') === null);
ok('day 9 rejected', parseTemporalLabel('2026331900') === null);
ok('value after padding rejected', parseTemporalLabel('2026301100') === null);
ok('leading zero rejected', parseTemporalLabel('0026331248') === null);
ok('non-digit rejected', parseTemporalLabel('20263f1248') === null);
// Calendar existence (the panel's blocker class):
ok('week 5 of 28-day Feb rejected', parseTemporalLabel('2026125000') === null);
ok('"Jan 32" (band 5 day 4) rejected', parseTemporalLabel('2026115400') === null);
ok('leap Feb band 5 exists', parseTemporalLabel('2028125000') !== null);
ok('leap Feb 29 exists', parseTemporalLabel('2028125100') !== null);
ok('"Feb 30" of a leap year rejected', parseTemporalLabel('2028125200') === null);
ok(
  'band-5 span clamps to the month boundary',
  addressToSpan('2028125000').end.getTime() === Date.UTC(2028, 2, 1),
  addressToSpan('2028125000').end.toISOString(),
);

// ── renderAddressRelation: the partition ──
const rel = (a: string) => renderAddressRelation(a, NOW);
ok('beat contains now', rel('2026331248') === '(now — this beat)', rel('2026331248'));
ok('gathering contains now', rel('2026331240') === '(now — this morning)', rel('2026331240'));
ok('day contains now', rel('2026331200') === '(now — today)', rel('2026331200'));
ok('week contains now', rel('2026331000') === '(now — this week)', rel('2026331000'));
ok('month contains now', rel('2026330000') === '(now — this month)', rel('2026330000'));
ok('season contains now', rel('2026300000') === '(now — this season)', rel('2026300000'));
ok('year contains now', rel('2026000000') === '(now — this year)', rel('2026000000'));
ok('tomorrow flagged AHEAD', rel('2026331300') === '(AHEAD — tomorrow)', rel('2026331300'));
ok('yesterday reads behind', rel('2026331100') === '(yesterday)', rel('2026331100'));
ok('next week flagged AHEAD', rel('2026332000') === '(AHEAD — next week)', rel('2026332000'));
// Weeks count ORDINAL bands: Aug band-5 (29-31 Aug) lies between Aug band-4
// and the September now, so band-4 is two bands back even at ten days' gap —
// the address counts periods; the instant age (renderAge) counts duration.
ok('band-5 is last week', rel('2026325000') === '(last week)', rel('2026325000'));
ok('band-4 is two weeks behind (ordinal)', rel('2026324000') === '(2 weeks behind)', rel('2026324000'));
ok(
  'tomorrow band voices through the day',
  rel('2026331340') === '(AHEAD — tomorrow, morning)',
  rel('2026331340'),
);
ok(
  'yesterday evening voices through the day',
  rel('2026331180') === '(yesterday, evening)',
  rel('2026331180'),
);
ok('same-day earlier gathering counts', /gatherings? behind\)$/.test(rel('2026331210')), rel('2026331210'));
ok('several days behind counts days', rel('2026324700') === '(5 days behind)', rel('2026324700'));
ok('next month flagged AHEAD', rel('2026410000') === '(AHEAD — next month)', rel('2026410000'));
ok('month 4 of a season rejected', rel('2026340000') === '', rel('2026340000'));
ok('last year reads behind', rel('2025000000') === '(last year)', rel('2025000000'));
ok('non-temporal returns empty', rel('8912345678') === '', rel('8912345678'));
// Ordinal counting at the irregular rungs (the panel's duplicate/skip class):
ok('two months ahead counts two', rel('2026420000') === '(AHEAD — in 2 months)', rel('2026420000'));
ok('January is eight months behind', rel('2026110000') === '(8 months behind)', rel('2026110000'));
ok('Q1 is two seasons behind', rel('2026100000') === '(2 seasons behind)', rel('2026100000'));
ok('two years ahead counts two', rel('2028000000') === '(AHEAD — in 2 years)', rel('2028000000'));
// The part suffix caps at a week's distance (July 1, beat 2 of the deep night):
ok('distant beat voices as bare day count', rel('2026311112') === '(63 days behind)', rel('2026311112'));

// ── annotateAges: the prose pass ──
const prose = annotateAges('the intake stamp read 2026331247 and the cell sits at 2026331340.', NOW);
ok('prose beat annotated', prose.includes('2026331247 ('), prose);
ok('prose future annotated AHEAD', prose.includes('2026331340 (AHEAD — tomorrow, morning)'), prose);
const hexProse = annotateAges('grain:343bbac1d99d903c stays untouched', NOW);
ok('pair_id untouched', hexProse === 'grain:343bbac1d99d903c stays untouched', hexProse);
const decimalProse = annotateAges('finer sits at 2026331248.5 after the decimal', NOW);
ok('decimal-glued untouched', decimalProse === 'finer sits at 2026331248.5 after the decimal', decimalProse);
const tagged = annotateAges('[2026331340] (AHEAD — tomorrow, morning) already tagged', NOW);
ok(
  'pre-tagged not doubled',
  tagged === '[2026331340] (AHEAD — tomorrow, morning) already tagged',
  tagged,
);
const bracketed = annotateAges('the ladder shows [2026331200] here', NOW);
ok(
  'bracketed label left to its renderer',
  bracketed === 'the ladder shows [2026331200] here',
  bracketed,
);
const iso = annotateAges('landed 2026-08-25T13:40Z among things', NOW);
ok('ISO still annotated', /2026-08-25T13:40Z \(\+\d+ — .+ago\)/.test(iso), iso);
const invalidRun = annotateAges('an id like 2026999999 is not a date', NOW);
ok('rung-invalid ten digits untouched', invalidRun === 'an id like 2026999999 is not a date', invalidRun);
const roundCredit = annotateAges('offers 2000000000 credit', NOW);
ok('round credit amount untouched (coarser than a year)', roundCredit === 'offers 2000000000 credit', roundCredit);
const farYear = annotateAges('serial 2101234567 logged', NOW);
ok('far-year token untouched (beyond ±50y)', farYear === 'serial 2101234567 logged', farYear);
const yearProse = annotateAges('the plan spans 2026000000 whole', NOW);
ok('year-grain prose still annotated', yearProse.includes('2026000000 (now — this year)'), yearProse);

// ── formatRead: the floor-10 label gate + stamp surfacing (real clock) ──
function chain(depth: number, leaf: any): any {
  let node: any = leaf;
  for (let i = 0; i < depth; i++) node = { _: node };
  return node;
}
const clock: any = chain(10, 'the holder speaks over everything');
const realNow = new Date();
const dayAddr = momentToAddress(realNow).slice(0, 8).padEnd(10, '0');
const tomorrowAddr = momentToAddress(new Date(addressToSpan(dayAddr).end.getTime() + 60_000))
  .slice(0, 8)
  .padEnd(10, '0');
writeAt(clock, dayAddr, 'the day cell');
writeAt(clock, tomorrowAddr, 'the ahead cell');
const dayRead = formatRead(bspRead(clock, dayAddr, null) as any);
ok('floor-10 day label tagged (now — today)', dayRead.includes('(now — today)'), dayRead);
// The interior-zero ancestor case: d1 (p9) and d2 (p8) share the stripped
// label 2000000000; the label parses at the millennium rung, so d1 tags
// correctly and d2 — whose rung the label does not name — stays bare.
ok(
  'matching ancestor tags at its own grain',
  /d1 p9 \[2000000000\] \(now — this millennium\)/.test(dayRead),
  dayRead,
);
ok(
  'mismatched ancestor stays bare (no wrong-grain voicing)',
  !/p8 \[2000000000\] \(/.test(dayRead),
  dayRead,
);
const tmrwRead = formatRead(bspRead(clock, tomorrowAddr, null) as any);
ok('floor-10 ahead label tagged AHEAD', tmrwRead.includes('(AHEAD — tomorrow)'), tmrwRead);

const pool: any = {
  _: { _: 'a pool' },
  '8': { '9': { _: 'meeting proposal — this week', '3': '2026-08-25T09:15Z' } },
};
const poolRead = formatRead(bspRead(pool, '89', null) as any);
ok('floor-2 label untouched', poolRead.includes('[89]:'), poolRead);
ok('field-3 stamp surfaced in walk', poolRead.includes('· 2026-08-25T09:15Z'), poolRead);
const poolDisc = formatRead(bspRead(pool, null, 0) as any);
ok('field-3 stamp surfaced in disc', poolDisc.includes('· 2026-08-25T09:15Z'), poolDisc);
const decorated: any = {
  _: { _: 'a pool' },
  '7': { '9': { _: 'older voice', '3': '2026-08-25T12:44:00Z (+2 — 6 days ago)' } },
};
const decoratedRead = formatRead(bspRead(decorated, '79', null) as any);
ok(
  'decorated field-3 surfaces the leading ISO token only',
  decoratedRead.includes('· 2026-08-25T12:44:00Z') && !decoratedRead.includes('6 days ago'),
  decoratedRead,
);

// ── stampPlainAppend: the door wrap ──
const wrapped = stampPlainAppend('a plain voice', NOW);
ok(
  'plain string wrapped {_, 3}',
  typeof wrapped.entry === 'object' &&
    wrapped.entry._ === 'a plain voice' &&
    wrapped.entry['3'] === '2026-09-02T10:18:00Z' &&
    wrapped.stamped === '2026-09-02T10:18:00Z',
  JSON.stringify(wrapped),
);
const shaped = stampPlainAppend({ _: 'already shaped', '3': 'authors-own' }, NOW);
ok(
  'structured entry untouched',
  shaped.stamped === null && (shaped.entry as any)._ === 'already shaped' && (shaped.entry as any)['3'] === 'authors-own',
  JSON.stringify(shaped),
);

console.log(`smoke-temporal-address: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
