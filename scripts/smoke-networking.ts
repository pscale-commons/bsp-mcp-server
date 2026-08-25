/**
 * smoke-networking.ts — offline unit smoke for the SAND driver's core logic, v2.
 *
 * No beach, no side effects. Exercises the pieces the pscale_networking
 * primitive relies on: the rider afferent filter + translation (sand), the
 * canonical passport 6.2 receipt addressing — PER-PROBE since v2 (sand-v2:4;
 * repeat gives each leave their own receipt or conservation breaks) — the
 * signed-chain verify through verifyRiderCore with injected keys, and the
 * surgical-write shape inference. The full economic battery is
 * scripts/smoke-sand.ts (sand-v2:9.2); this smoke stays the driver's own.
 *
 * Run: npx tsx scripts/smoke-networking.ts
 */

import nacl from 'tweetnacl';
import { Block, readAt, writeAt } from '../src/bsp.js';
import {
  isRider,
  riderFromSlot,
  topicDigits,
  topicNodeAddress,
  evalSlotAddress,
  findReceiptSlot,
  latestReceiptFromSender,
  evaluationContent,
  signHop,
} from '../src/sand.js';
import { verifyRiderCore, VerifyDeps } from '../src/tools/verify.js';
import { bspWrite } from '../src/bsp-fn.js';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
}

console.log('\n=== rider filter + translation ===');
const chatSlot: Block = { _: 'just chatting', '1': 'david', '3': '2026-07-11T00:00:00Z' };
check('chat slot (no rider) is not a probe', isRider(chatSlot) === false);

// A gray-encryption envelope also lives at position 9 — must NOT match (live-found bug).
const graySlot: Block = { _: 'Encrypted (gray)', '1': 'BASE64CIPHERTEXT==', '2': 'nonce', '9': { _: 'gray', '1': 'gray' } };
check('gray envelope is not a probe', isRider(graySlot) === false);

const keys = new Map<string, nacl.SignKeyPair>();
keys.set('weft', nacl.sign.keyPair());
keys.set('david', nacl.sign.keyPair());
const deps: VerifyDeps = {
  loadPassport: async () => null,
  loadKey: async (h) => {
    const kp = keys.get(h);
    return kp ? Buffer.from(kp.publicKey).toString('base64') : null;
  },
};

const probeId = 'weft-persistence-2026-07-10';
const sig0 = signHop(probeId, '', keys.get('weft')!.secretKey);
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

console.log('\n=== topic / receipt addressing ===');
check('topicDigits strips floor-anchor', topicDigits('0.341') === '341');
check('topicDigits reduces 3.41 → 341', topicDigits('3.41') === '341');
check('topicNodeAddress', topicNodeAddress('0.341') === '6.2341');
check('evalSlotAddress slot 1', evalSlotAddress('0.341', '1') === '6.23411');
check('evalSlotAddress slot 11', evalSlotAddress('0.341', '11') === '6.234111');

console.log('\n=== 6.2 receipt write → read round-trip (per-probe, v2) ===');
// A fresh passport (floor 1). Write one receipt the canonical way.
const passport: Block = { _: 'passport of egg-one', '6': { _: 'L3 accumulator' } };
const t0 = readAt(passport, topicNodeAddress('0.341'));
const { slot: s1, existing: e1 } = findReceiptSlot((t0 && typeof t0 === 'object') ? t0 as Block : null, 'weft', probeId);
check('first receipt slot is 1, no existing', s1 === '1' && e1 === null);
writeAt(passport, evalSlotAddress('0.341', s1), evaluationContent({
  verdict: 'pass', v_latest: 2, giver_total: 3, ts: '2026-07-11T00:00:00Z', probe_id: probeId, sender: 'weft',
}));
const back = readAt(passport, evalSlotAddress('0.341', '1'));
check('written receipt reads back — verdict', back?.['1'] === 'pass');
check('written receipt reads back — sender at field 6', back?.['6'] === 'weft');

// A SECOND PROBE from the same sender takes a NEW slot (per-probe receipts —
// the conservation fix; a latest-only receipt would let a repeat giver re-arm).
const t1 = readAt(passport, topicNodeAddress('0.341'));
const { slot: s2, existing: e2 } = findReceiptSlot((t1 && typeof t1 === 'object') ? t1 as Block : null, 'weft', 'weft-second-probe');
check('a new probe from the same sender takes a fresh slot', s2 === '2' && e2 === null, `got ${s2}`);
writeAt(passport, evalSlotAddress('0.341', s2), evaluationContent({
  verdict: 'pass', v_latest: 5, giver_total: 8, ts: '2026-07-11T00:02:00Z', probe_id: 'weft-second-probe', sender: 'weft',
}));

// Re-evaluating the SAME probe is FOUND, not duplicated.
const t2 = readAt(passport, topicNodeAddress('0.341'));
const { slot: s3, existing: e3 } = findReceiptSlot((t2 && typeof t2 === 'object') ? t2 as Block : null, 'weft', probeId);
check('the same probe reuses its slot', s3 === '1');
check('its existing record is read back', e3?.giver_total === 3, JSON.stringify(e3));

// The evaluation-of-record for SQ is the sender's LATEST receipt.
const t3 = readAt(passport, topicNodeAddress('0.341'));
const latest = latestReceiptFromSender((t3 && typeof t3 === 'object') ? t3 as Block : null, 'weft');
check('latest receipt from sender is the second probe', latest?.probe_id === 'weft-second-probe', JSON.stringify(latest));

async function chainTests() {
  console.log('\n=== signed chain verify (no beach, keys injected) ===');
  const twoHopSig1 = signHop(probeId, sig0, keys.get('david')!.secretKey);
  const goodChain = [{ agent: 'weft', sig: sig0 }, { agent: 'david', sig: twoHopSig1 }];
  const good = await verifyRiderCore({ rider: { chain: goodChain }, probe_id: probeId, chain: goodChain, sender_agent_id: 'weft' }, deps);
  check('valid signed 2-hop chain → pass (no credit/sq claimed)', good.verdict === 'pass', good.verdict + ' ' + JSON.stringify(good.chain));

  const badChain = [{ agent: 'weft', sig: sig0 }, { agent: 'david', sig: 'ZGVhZGJlZWY=' }];
  const bad = await verifyRiderCore({ rider: { chain: badChain }, probe_id: probeId, chain: badChain, sender_agent_id: 'weft' }, deps);
  check('forged chain → fail', bad.verdict === 'fail', bad.verdict);
  check('forged chain reports break hop', (bad.chain as any).break_at_hop === 1, JSON.stringify(bad.chain));

  const keylessChain = [{ agent: 'weft', sig: sig0 }, { agent: 'stranger', sig: twoHopSig1 }];
  const keyless = await verifyRiderCore({ rider: { chain: keylessChain }, probe_id: probeId, chain: keylessChain, sender_agent_id: 'weft' }, deps);
  check('a hop by a keyless agent → unbacked, not pass (sand-v2:6.2)', keyless.verdict === 'unbacked', keyless.verdict);

  const noRider = await verifyRiderCore({ rider: undefined, sender_agent_id: 'weft' }, deps);
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
