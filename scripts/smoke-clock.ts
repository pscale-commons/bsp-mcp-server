/**
 * smoke-clock.ts — the clock door's pure parts, offline.
 *
 *   npm run smoke:clock
 *
 * Fixtures are the corrective pass's night as it stood (2026-09-21), cut down:
 * day 1 dusk beats 1–8 folded, the day folded, day 2 first light beat 1 folded.
 * Asserts the time order of addresses, the fold just before now at each rung,
 * the ripeness reads (unplayed beneath a coarse address), the fold's closing
 * lines, and the standpoint line the door hands a seat to copy.
 */
import assert from 'node:assert/strict';
import {
  timeKey, voicedAddresses, nightSoFar, foldEnds, foldBody, lineAt, passportBeat, standpointLine, clockDigits,
} from '../src/tools/clock.js';

let n = 0;
const ok = (name: string, f: () => void) => { f(); n++; console.log(`  ✓ ${name}`); };

const F = 3;
const night: any = {
  _: { _: { _: 'THE NIGHT' } },
  '1': {
    _: 'Night holds the Slip. … NEXT 211',
    '5': { '1': 'Wenna hails the watch. NEXT 152', '2': 'Hobb slips. NEXT 153', '3': 'The footprint. "You. You knew." NEXT 154', '4': 'The blade turns. NEXT 155',
           '5': 'Stalemate. NEXT 156', '6': 'They climb. NEXT 157', '7': 'The watch lingers. NEXT 158', '8': 'The ford empties.\n\nNEXT 161' },
  },
  '2': { '1': { '1': 'First light; they meet on the track.\n\nWAY 220\nNEXT 212' } },
};

ok('time order: beats before their gathering, the gathering before the next, the day after all of it', () => {
  const order = ['151', '158', '150', '161', '100', '211', '200'].sort((a, b) => timeKey(a).localeCompare(timeKey(b)));
  assert.deepEqual(order, ['151', '158', '150', '161', '100', '211', '200']);
});

ok('voiced addresses of the night, in time order', () => {
  const v = voicedAddresses(night, F).map((x) => x.addr);
  assert.deepEqual(v, ['151', '152', '153', '154', '155', '156', '157', '158', '100', '211']);
});

ok('the fold just before 161: the last beat (158); no gathering, no day (day 1 contains it)', () => {
  const s = nightSoFar(night, '161', F);
  assert.deepEqual(s.before.map((b) => `${b.rung}:${b.addr}`), ['3:158']);
  assert.equal(s.here, null);
  assert.equal(s.lastBeat?.addr, '158');
  assert.deepEqual(s.ring, []);                       // 160's gathering holds no folds yet
});

ok('the fold just before 211: yesterday whole (100) and the last beat (158) — a new day is never a stranger', () => {
  const s = nightSoFar(night, '211', F);
  assert.deepEqual(s.before.map((b) => `${b.rung}:${b.addr}`), ['1:100', '3:158']);
  assert.ok(s.here?.startsWith('First light'));
});

ok('the fold just before 154: 153 whole, this gathering\'s ring in brief, nothing after 154', () => {
  const s = nightSoFar(night, '154', F);
  assert.equal(s.lastBeat?.addr, '153');
  assert.deepEqual(s.ring.map((r) => r.addr), ['151', '152', '153']);
  assert.ok(s.here?.startsWith('The blade'));
});

ok('the fold just before 100 (the day): every beat of the day is its ring; the last beat whole', () => {
  const s = nightSoFar(night, '100', F);
  assert.deepEqual(s.ring.map((r) => r.addr), ['151', '152', '153', '154', '155', '156', '157', '158']);
  assert.equal(s.lastBeat?.addr, '158');
  assert.ok(s.here?.startsWith('Night holds'));
});

ok('a fold\'s closing lines: NEXT and WAY, and the body without them', () => {
  assert.deepEqual(foldEnds('They meet.\n\nWAY 220\nNEXT 212'), { next: '212', way: '220' });
  assert.deepEqual(foldEnds('The ford empties. NEXT 161'), { next: '161', way: null });
  assert.equal(foldBody('They meet.\n\nWAY 220\nNEXT 212'), 'They meet.');
  assert.equal(foldBody('The ford empties. NEXT 161'), 'The ford empties.');
});

ok('a line at an address; a missing one is null', () => {
  assert.equal(lineAt(night, '211', F), 'First light; they meet on the track.\n\nWAY 220\nNEXT 212');
  assert.equal(lineAt(night, '212', F), null);
  assert.equal(lineAt(night, '150', F), null);
  assert.deepEqual(clockDigits('150', F), ['1', '5']);        // full width on the clock: a gathering is 150 (its trailing zero the container's own voice, stripped by the parser), never 15
  assert.deepEqual(clockDigits('15', F), ['0', '1', '5']);    // a short form left-pads (the floor-anchor law) — never what a clock means
  assert.equal(clockDigits('1.5.1', F), null);
});

const passport: any = {
  _: 'Hobb — a woodsman',
  '3': 'Weather-brown and quiet. Location: *:https://beach.example/w/brackenfoot:spatial:brackenfoot:211 Beat: *:https://beach.example/w/t:spine:temporal:211',
};
ok('the Beat line is read, and the standpoint line is rewritten with NEXT and WAY', () => {
  assert.equal(passportBeat(passport), '211');
  assert.equal(passportBeat({ '3': 'no beat here' }), null);
  const line = standpointLine(passport, 'https://beach.example/w/t', '212', '220');
  assert.equal(line, 'Weather-brown and quiet. Location: *:https://beach.example/w/brackenfoot:spatial:brackenfoot:220 Beat: *:https://beach.example/w/t:spine:temporal:212');
  assert.equal(standpointLine(passport, 'https://beach.example/w/t', '100'), 'Weather-brown and quiet. Location: *:https://beach.example/w/brackenfoot:spatial:brackenfoot:211 Beat: *:https://beach.example/w/t:spine:temporal:100');
});

console.log(`\nsmoke-clock: ${n}/${n} passed`);
