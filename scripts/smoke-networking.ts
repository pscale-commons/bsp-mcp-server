/**
 * smoke-networking.ts — offline unit smoke for the SAND driver's core logic.
 *
 * No beach, no side effects. Exercises the pieces the pscale_networking primitive
 * relies on: the rider afferent filter + translation (sand), the canonical
 * passport 6.2 addressing + SQ recompute round-trip, and the deterministic chain
 * verify (verifyRiderCore) on a hand-built sha256 chain — valid and broken.
 *
 * Run: npx tsx scripts/smoke-networking.ts
 */

import { createHash } from 'node:crypto';
import { Block, readAt, writeAt } from '../src/bsp.js';
import {
  isRider,
  riderFromSlot,
  topicDigits,
  topicNodeAddress,
  evalSlotAddress,
  findSenderSlot,
  evaluationContent,
  recomputeSQ,
} from '../src/sand.js';
import { verifyRiderCore } from '../src/tools/verify.js';
import { bspWrite } from '../src/bsp-fn.js';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
}
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

console.log('\n=== rider filter + translation ===');
const chatSlot: Block = { _: 'just chatting', '1': 'david', '3': '2026-07-11T00:00:00Z' };
check('chat slot (no rider) is not a probe', isRider(chatSlot) === false);

// A gray-encryption envelope also lives at position 9 — must NOT match (live-found bug).
const graySlot: Block = { _: 'Encrypted (gray)', '1': 'BASE64CIPHERTEXT==', '2': 'nonce', '9': { _: 'gray', '1': 'gray' } };
check('gray envelope is not a probe', isRider(graySlot) === false);

const probeId = 'weft-persistence-2026-07-10';
const sig0 = sha(probeId + '');
const probeSlot: Block = {
  _: 'a chewable give',
  '1': 'weft',
  '3': '2026-07-10T16:53:51Z',
  '9': {
    _: 'rider',
    '1': probeId,
    '2': { _: 'credit claim', '1': 3, '2': 'weft' },
    '3': 0.5,
    '4': { _: 'chain hops', '1': { _: 'hop 1', '1': 'weft', '2': sig0 } },
    '5': '0.341',
  },
};
check('rider-bearing slot is a probe', isRider(probeSlot) === true);
const ri = riderFromSlot(probeSlot);
check('riderFromSlot extracts probe_id', ri?.probe_id === probeId);
check('riderFromSlot extracts topic', ri?.topic_coordinate === '0.341');
check('riderFromSlot extracts credit n', ri?.credits?.n === 3);
check('riderFromSlot extracts sq', ri?.sq === 0.5);
check('riderFromSlot chain → array of 1', Array.isArray(ri?.chain) && ri?.chain?.length === 1, JSON.stringify(ri?.chain));
check('riderFromSlot chain hop agent', ri?.chain?.[0]?.agent === 'weft');

console.log('\n=== topic / eval addressing ===');
check('topicDigits strips floor-anchor', topicDigits('0.341') === '341');
check('topicDigits reduces 3.41 → 341', topicDigits('3.41') === '341');
check('topicNodeAddress', topicNodeAddress('0.341') === '6.2341');
check('evalSlotAddress slot 1', evalSlotAddress('0.341', '1') === '6.23411');
check('evalSlotAddress slot 11', evalSlotAddress('0.341', '11') === '6.234111');

console.log('\n=== 6.2 write → read round-trip ===');
// A fresh passport (floor 1). Write one evaluation the canonical way.
const passport: Block = { _: 'passport of egg-one', '6': { _: 'L3 accumulator', '1': 0 } };
const { slot: s1, existing: e1 } = findSenderSlot(readAt(passport, topicNodeAddress('0.341')) ?? null, 'weft');
check('first sender slot is 1, no existing', s1 === '1' && e1 === null);
writeAt(passport, evalSlotAddress('0.341', s1), evaluationContent({
  verdict: 'pass', v_latest: 2, giver_total: 3, ts: '2026-07-11T00:00:00Z', probe_id: probeId, sender: 'weft',
}));
const back = readAt(passport, evalSlotAddress('0.341', '1'));
check('written eval reads back — verdict', back?.['1'] === 'pass');
check('written eval reads back — sender at field 6', back?.['6'] === 'weft');
check('6.1 credit balance untouched by 6.2 write', readAt(passport, '6.1') === 0);

// Second sender at the same topic.
const topicNode2 = readAt(passport, topicNodeAddress('0.341'));
const { slot: s2, existing: e2 } = findSenderSlot(topicNode2 ?? null, 'phenomemental');
check('second sender gets a fresh slot', s2 === '2' && e2 === null);
writeAt(passport, evalSlotAddress('0.341', s2), evaluationContent({
  verdict: 'pass', v_latest: 1, giver_total: 4, ts: '2026-07-11T00:01:00Z', sender: 'phenomemental',
}));

// Repeat sender is FOUND, not duplicated.
const topicNode3 = readAt(passport, topicNodeAddress('0.341'));
const { slot: s3, existing: e3 } = findSenderSlot(topicNode3 ?? null, 'weft');
check('repeat sender reuses its slot', s3 === '1');
check('repeat sender existing giver_total read', e3?.giver_total === 3, JSON.stringify(e3));

console.log('\n=== SQ recompute ===');
const sq = recomputeSQ(passport, '0.341');
// weft 2/3 + phenomemental 1/4 = 0.6667 + 0.25 = 0.9167
check('SQ counts both senders', sq.count === 2, JSON.stringify(sq));
check('SQ recompute value', Math.abs(sq.computed - (2 / 3 + 1 / 4)) < 1e-9, String(sq.computed));
check('SQ at empty topic is 0', recomputeSQ(passport, '0.999').count === 0);

async function chainTests() {
  console.log('\n=== deterministic chain verify (no beach) ===');
  // A rider with only a chain (no credit/sq) verifies the chain dimension purely.
  const twoHopSig1 = sha(probeId + sig0);
  const goodChain = [{ agent: 'weft', sig: sig0 }, { agent: 'david', sig: twoHopSig1 }];
  const good = await verifyRiderCore({ rider: { }, probe_id: probeId, chain: goodChain, sender_agent_id: 'weft' });
  check('valid 2-hop chain → pass (no credit/sq claimed)', good.verdict === 'pass', good.verdict + ' ' + JSON.stringify(good.chain));

  const badChain = [{ agent: 'weft', sig: sig0 }, { agent: 'david', sig: 'deadbeef' }];
  const bad = await verifyRiderCore({ rider: { }, probe_id: probeId, chain: badChain, sender_agent_id: 'weft' });
  check('broken chain → fail', bad.verdict === 'fail', bad.verdict);
  check('broken chain reports break hop', (bad.chain as any).break_at_hop === 1, JSON.stringify(bad.chain));

  const noRider = await verifyRiderCore({ rider: undefined, sender_agent_id: 'weft' });
  check('no rider → skip', noRider.verdict === 'skip');
}

console.log('\n=== surgical write shape inferred from content (the 1.2 footgun) ===');
// floor-1 block; spindle "1.2" is 2 digits → pEnd = -1. Object needs a subtree
// write; before the fix, an omitted pscale defaulted to point and rejected it.
{
  const b1: Block = { _: 'a floor-1 block', '1': { _: 'side one' } };
  const r1 = bspWrite(b1, '1.2', undefined, { _: 'a give', '1': 'happyseaurchin' });
  check('object + omitted pscale → subtree write', r1.shape === 'path-walk+descent', r1.shape);
  check('object landed as an object at 1.2', typeof readAt(b1, '1.2') === 'object' && readAt(b1, '1.2')?.['1'] === 'happyseaurchin');

  const b2: Block = { _: 'a floor-1 block', '1': { _: 'side one' } };
  const r2 = bspWrite(b2, '1.2', undefined, 'plain text');
  check('string + omitted pscale → point write', r2.shape === 'point', r2.shape);
  check('string landed as a string at 1.2', readAt(b2, '1.2') === 'plain text');

  // Explicit pscale is still honored exactly — object at an explicit point pscale rejects.
  let threw = false;
  try { bspWrite({ _: 'x', '1': { _: 'y' } } as Block, '1.2', -1, { _: 'obj' }); } catch { threw = true; }
  check('explicit point pscale + object still throws (control preserved)', threw);
}

chainTests().then(() => {
  console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
  process.exit(fail === 0 ? 0 : 1);
});
