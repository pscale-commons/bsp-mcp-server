/**
 * smoke-sand.ts — the SAND v2 conformance battery (sand-v2:9.2).
 *
 * Deterministic, in-memory, no network: passports and keys are supplied
 * through verifyRiderCore's injectable deps, exactly as any fork would supply
 * its own storage. A fork that passes this battery interoperates — the battery
 * is the federation guarantee for trust, as payway:6 is for tickets.
 *
 * Fixtures 1-11 are the spec's table (sand-v2:9.2). Fixture 12 is this
 * implementation's addition — repeat-give conservation, the reason receipts
 * are PER-PROBE (a latest-only receipt would let a repeat giver re-arm on
 * read). Fixture 13 pins the slot-enumeration prune (a probe's rider at
 * position 9 must not leak as pseudo-slots — the pool:keel 69/692/694 leak).
 *
 * Coverage declared (function:ledger:3 — a fold with silent caps lies):
 * fixtures 3 and 8 test the ACCOUNTING IDENTITY of keep/hau (receipts and
 * GAVEs laid by hand, balances recomputed), not the driver's beach writes —
 * those are the live trial's (sand-v2:9.4). Fixture 9's revocation is the
 * minted term dropping, per sand-v2:2.3.
 */

import nacl from 'tweetnacl';
import { Block, writeAt, readAt } from '../src/bsp.js';
import {
  gaveContent,
  gaveSlotAddress,
  nextGaveSlot,
  evaluationContent,
  evalSlotAddress,
  topicNodeAddress,
  findReceiptSlot,
  computeBalance,
  recomputeSQFromOthers,
  signHop,
  verifyChainSigned,
  isRider,
  riderFromSlot,
} from '../src/sand.js';
import { verifyRiderCore, normaliseRider, VerifyDeps } from '../src/tools/verify.js';
import { collectContributions, findNextSlot } from '../src/tools/pool.js';

let passCount = 0;
let failCount = 0;
function t(name: string, cond: boolean, detail?: string) {
  if (cond) { passCount++; console.log(`  ok   ${name}`); }
  else { failCount++; console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
}

// ── The in-memory substrate ──

const passports = new Map<string, Block>();
const keyring = new Map<string, nacl.SignKeyPair>();
const minted = new Map<string, number>();

const deps: VerifyDeps = {
  loadPassport: async (h) => passports.get(h) ?? null,
  loadKey: async (h) => {
    const kp = keyring.get(h);
    return kp ? Buffer.from(kp.publicKey).toString('base64') : null;
  },
  loadMinted: async (h) => minted.get(h) ?? 0,
};

function freshPassport(handle: string): Block {
  const p: Block = { _: `passport of ${handle}` } as any;
  passports.set(handle, p);
  return p;
}

let tsCounter = 0;
function nextTs(): string {
  tsCounter++;
  return `2026-08-25T10:${String(tsCounter).padStart(2, '0')}:00.000Z`;
}

function addGave(p: Block, g: { probe_id: string; n: number; to: string; topic?: string }) {
  writeAt(p, gaveSlotAddress(nextGaveSlot(p)), gaveContent({
    voicing: `gave ${g.n} to ${g.to} (${g.probe_id})`,
    ts: nextTs(),
    ...g,
  }) as any);
}

function addReceipt(p: Block, topic: string, e: { sender: string; probe_id?: string; v_latest: number; verdict?: string }) {
  const tn = readAt(p, topicNodeAddress(topic));
  const { slot } = findReceiptSlot(
    (tn && typeof tn === 'object') ? (tn as Block) : null, e.sender, e.probe_id,
  );
  writeAt(p, evalSlotAddress(topic, slot), evaluationContent({
    verdict: e.verdict ?? 'pass',
    v_latest: e.v_latest,
    giver_total: e.v_latest,
    ts: nextTs(),
    probe_id: e.probe_id,
    sender: e.sender,
  }) as any);
}

const rider = (probe_id: string, n: number, by: string, extra?: { sq?: number; chain?: any; topic?: string }) => ({
  probe_id,
  credits: { n, by },
  ...(extra?.sq !== undefined ? { sq: extra.sq } : {}),
  ...(extra?.chain ? { chain: extra.chain } : {}),
  topic_coordinate: extra?.topic ?? '0.341',
});

async function main() {
  console.log('SAND v2 conformance battery (sand-v2:9.2)\n');

  // ── 1. Credit claim by an unknown sender → unbacked ──
  {
    const r = await verifyRiderCore({ rider: rider('ghost-p1', 999999, 'no-such-handle'), sender_agent_id: 'no-such-handle', topic_coordinate: '0.341' }, deps);
    t('1. unknown sender claiming 999,999 → unbacked (was pass in v1)', r.verdict === 'unbacked', `got ${r.verdict}`);
  }

  // ── 2. Credit claim with no matching GAVE → unbacked ──
  {
    freshPassport('carol');
    const r = await verifyRiderCore({ rider: rider('carol-p1', 5, 'carol'), sender_agent_id: 'carol' }, deps);
    t('2. no GAVE at the sender 6.3 → unbacked', r.verdict === 'unbacked', `got ${r.verdict}`);
  }

  // ── 3. Receive is the transfer: balances move on read, only the giver writes the giver ──
  {
    const alice = freshPassport('alice');
    const bob = freshPassport('bob');
    minted.set('alice', 6);
    addGave(alice, { probe_id: 'a-p1', n: 3, to: 'bob', topic: '0.341' });
    addReceipt(bob, '0.341', { sender: 'alice', probe_id: 'a-p1', v_latest: 3 });
    const ba = await computeBalance('alice', alice, deps.loadPassport, { minted: 6 });
    const bb = await computeBalance('bob', bob, deps.loadPassport);
    t('3a. giver balance = minted 6 − given 3 = 3', ba.balance === 3, `got ${ba.balance}`);
    t('3b. recipient balance rises by the 3 received', bb.balance === 3, `got ${bb.balance}`);
    t('3c. the giver passport holds no receipt written by another', readAt(alice, '6.2') == null);
    const r = await verifyRiderCore({ rider: rider('a-p1', 3, 'alice'), sender_agent_id: 'alice' }, deps);
    t('3d. the backed claim verifies pass', r.verdict === 'pass', `got ${r.verdict} (${JSON.stringify(r.balance)})`);
  }

  // ── 4. Two probes against one balance, both kept → the second unbacked ──
  {
    const dan = freshPassport('dan');
    const erin = freshPassport('erin');
    minted.set('dan', 5);
    addGave(dan, { probe_id: 'd-p1', n: 3, to: 'erin', topic: '0.341' });
    addReceipt(erin, '0.341', { sender: 'dan', probe_id: 'd-p1', v_latest: 3 });
    addGave(dan, { probe_id: 'd-p2', n: 3, to: 'erin', topic: '0.341' });
    const r = await verifyRiderCore({ rider: rider('d-p2', 3, 'dan'), sender_agent_id: 'dan' }, deps);
    t('4. second claim against a spent balance → unbacked (5 − 3 = 2 < 3)', r.verdict === 'unbacked', `got ${r.verdict}`);
  }

  // ── 5. Self-receipt: no transfer, SQ unchanged ──
  {
    const felix = freshPassport('felix');
    addGave(felix, { probe_id: 'f-p1', n: 4, to: 'felix', topic: '0.341' });
    addReceipt(felix, '0.341', { sender: 'felix', probe_id: 'f-p1', v_latest: 4 });
    const b = await computeBalance('felix', felix, deps.loadPassport);
    const sq = await recomputeSQFromOthers('felix', felix, '0.341', deps.loadPassport);
    t('5a. a gift to self nets zero — balance unmoved', b.balance === 0, `got ${b.balance}`);
    t('5b. self-evaluation excluded — SQ 0 from 0 offered', sq.computed === 0 && sq.offered === 0, `got ${JSON.stringify(sq)}`);
  }

  // ── 6. One truth: word-keyed and stored digit-keyed riders verify identically ──
  {
    const stored = {
      _: 'rider', '1': 'a-p1', '2': { _: 'credit claim', '1': 3, '2': 'alice' }, '5': '0.341',
    };
    const w = await verifyRiderCore({ rider: rider('a-p1', 3, 'alice'), sender_agent_id: 'alice' }, deps);
    const s = await verifyRiderCore({ rider: stored, sender_agent_id: 'alice' }, deps);
    t('6a. stored rider translates (normaliseRider)', normaliseRider(stored)?.credits?.n === 3);
    t('6b. identical verdicts on identical inputs', w.verdict === s.verdict && w.verdict === 'pass', `word ${w.verdict}, stored ${s.verdict}`);
  }

  // ── 7. Signed hops: forged → fail; keyless → unbacked; true → valid ──
  {
    keyring.set('alice', nacl.sign.keyPair());
    keyring.set('grace', nacl.sign.keyPair());
    const sig1 = signHop('a-p1', '', keyring.get('alice')!.secretKey);
    const sig2 = signHop('a-p1', sig1, keyring.get('grace')!.secretKey);
    const good = await verifyChainSigned('a-p1', [{ agent: 'alice', sig: sig1 }, { agent: 'grace', sig: sig2 }], deps.loadKey);
    t('7a. a truly signed two-hop chain verifies', good.checked === true && good.valid === true, JSON.stringify(good));
    const forged = await verifyChainSigned('a-p1', [{ agent: 'alice', sig: sig1 }, { agent: 'grace', sig: sig1 }], deps.loadKey);
    t('7b. a forged hop breaks the chain → fail', forged.valid === false && forged.break_at_hop === 1, JSON.stringify(forged));
    const keyless = await verifyChainSigned('a-p1', [{ agent: 'alice', sig: sig1 }, { agent: 'henry', sig: sig2 }], deps.loadKey);
    t('7c. a hop by a keyless agent → unbacked, not pass', keyless.unbacked === true, JSON.stringify(keyless));
    const rf = await verifyRiderCore({
      rider: rider('a-p1', 3, 'alice', { chain: [{ agent: 'alice', sig: sig1 }, { agent: 'grace', sig: 'garbage' }] }),
      sender_agent_id: 'alice',
    }, deps);
    t('7d. composite: forged chain → fail (beats a backed credit)', rf.verdict === 'fail', `got ${rf.verdict}`);
    const rk = await verifyRiderCore({
      rider: rider('a-p1', 3, 'alice', { chain: [{ agent: 'henry', sig: sig1 }] }),
      sender_agent_id: 'alice',
    }, deps);
    t('7e. composite: keyless hop → unbacked', rk.verdict === 'unbacked', `got ${rk.verdict}`);
  }

  // ── 8. Hau — the accounting identity of share-to-chain ──
  {
    const ben = freshPassport('ben');   // the beneficiary
    const h1 = freshPassport('hop-one');
    const h2 = freshPassport('hop-two');
    minted.set('ben', 10);
    // completion: ben shares 10 back along a two-hop chain, equal split.
    addGave(ben, { probe_id: 'ben-hau-x-h1', n: 5, to: 'hop-one', topic: '0.341' });
    addGave(ben, { probe_id: 'ben-hau-x-h2', n: 5, to: 'hop-two', topic: '0.341' });
    addReceipt(h1, '0.341', { sender: 'ben', probe_id: 'ben-hau-x-h1', v_latest: 5 });
    addReceipt(h2, '0.341', { sender: 'ben', probe_id: 'ben-hau-x-h2', v_latest: 5 });
    const bb = await computeBalance('ben', ben, deps.loadPassport, { minted: 10 });
    const b1 = await computeBalance('hop-one', h1, deps.loadPassport);
    const b2 = await computeBalance('hop-two', h2, deps.loadPassport);
    t('8a. every hop\'s balance rises by its share', b1.balance === 5 && b2.balance === 5, `got ${b1.balance}, ${b2.balance}`);
    t('8b. the beneficiary\'s falls by the total', bb.balance === 0, `got ${bb.balance}`);
    // a chain that died before completion is never shared to — nothing moves:
    const idle = freshPassport('idle-hop');
    const bi = await computeBalance('idle-hop', idle, deps.loadPassport);
    t('8c. a chain without completion moves nothing', bi.balance === 0 && bi.received === 0);
  }

  // ── 9. Ticket revoked after its credits were shared ──
  {
    const ivy = freshPassport('ivy');
    const jo = freshPassport('jo');
    minted.set('ivy', 10);
    addGave(ivy, { probe_id: 'i-p1', n: 4, to: 'jo', topic: '0.341' });
    addReceipt(jo, '0.341', { sender: 'ivy', probe_id: 'i-p1', v_latest: 4 });
    const before = await computeBalance('ivy', ivy, deps.loadPassport, { minted: 10 });
    minted.set('ivy', 0); // [ticket-revoked] — the grain's credits leave minted (sand-v2:2.3)
    const after = await computeBalance('ivy', ivy, deps.loadPassport, { minted: 0 });
    const bj = await computeBalance('jo', jo, deps.loadPassport);
    t('9a. before revocation: 10 − 4 = 6', before.balance === 6, `got ${before.balance}`);
    t('9b. after revocation the giver may read negative', after.balance === -4, `got ${after.balance}`);
    t('9c. the receiver\'s receipt stands — nothing claws back', bj.balance === 4, `got ${bj.balance}`);
    addGave(ivy, { probe_id: 'i-p2', n: 2, to: 'jo', topic: '0.341' });
    const r = await verifyRiderCore({ rider: rider('i-p2', 2, 'ivy'), sender_agent_id: 'ivy' }, deps);
    t('9d. later offers come back unbacked until it recovers', r.verdict === 'unbacked', `got ${r.verdict}`);
  }

  // ── 10. SQ claim within 0.01 of the recompute → pass, else warn ──
  {
    const kim = freshPassport('kim');
    const lee = freshPassport('lee');
    minted.set('kim', 10);
    addGave(kim, { probe_id: 'k-p1', n: 4, to: 'lee', topic: '0.341' });
    addReceipt(lee, '0.341', { sender: 'kim', probe_id: 'k-p1', v_latest: 2 });
    const sq = await recomputeSQFromOthers('kim', kim, '0.341', deps.loadPassport);
    t('10a. SQ from others: latest received 2 ÷ offered 4 = 0.5', sq.computed === 0.5, `got ${sq.computed}`);
    addGave(kim, { probe_id: 'k-p2', n: 1, to: 'lee', topic: '0.341' });
    // claim on a fresh backed probe: sq true → pass, sq inflated → warn
    const okClaim = await verifyRiderCore({ rider: rider('k-p2', 1, 'kim', { sq: 2 / 5 }), sender_agent_id: 'kim' }, deps);
    t('10b. an honest SQ claim (2/5 after the new give) → pass', okClaim.verdict === 'pass', `got ${okClaim.verdict} (${JSON.stringify(okClaim.sq)})`);
    const inflated = await verifyRiderCore({ rider: rider('k-p2', 1, 'kim', { sq: 0.95 }), sender_agent_id: 'kim' }, deps);
    t('10c. an inflated SQ claim → warn', inflated.verdict === 'warn', `got ${inflated.verdict}`);
    // the v1 inversion is closed: kim cannot raise its own SQ by writing its own passport —
    // the recompute never reads kim's receipts, only lee's.
    addReceipt(kim, '0.341', { sender: 'kim', probe_id: 'k-self', v_latest: 9 });
    const sq2 = await recomputeSQFromOthers('kim', kim, '0.341', deps.loadPassport);
    t('10d. a sender cannot author its own SQ (stash:keel:27 probe 4 closed)', sq2.computed === sq.computed * (4 / 5), `got ${sq2.computed}`);
  }

  // ── 11. Partial keep — the remainder stays an open offer under the same GAVE ──
  {
    const mia = freshPassport('mia');
    const noa = freshPassport('noa');
    minted.set('mia', 10);
    addGave(mia, { probe_id: 'm-p1', n: 5, to: 'noa', topic: '0.341' });
    addReceipt(noa, '0.341', { sender: 'mia', probe_id: 'm-p1', v_latest: 2 });
    const b = await computeBalance('mia', mia, deps.loadPassport, { minted: 10 });
    t('11. given subtracts what was received (2), not what was offered (5)', b.given === 2 && b.balance === 8, `got given ${b.given}, balance ${b.balance}`);
  }

  // ── 12. Repeat-give conservation — why receipts are per-probe ──
  {
    const oli = freshPassport('oli');
    const pat = freshPassport('pat');
    minted.set('oli', 10);
    addGave(oli, { probe_id: 'o-p1', n: 3, to: 'pat', topic: '0.341' });
    addReceipt(pat, '0.341', { sender: 'oli', probe_id: 'o-p1', v_latest: 3 });
    addGave(oli, { probe_id: 'o-p2', n: 5, to: 'pat', topic: '0.341' });
    addReceipt(pat, '0.341', { sender: 'oli', probe_id: 'o-p2', v_latest: 5 });
    const bo = await computeBalance('oli', oli, deps.loadPassport, { minted: 10 });
    const bp = await computeBalance('pat', pat, deps.loadPassport);
    t('12a. repeat gives each leave their receipt: given = 8, not latest-only 5', bo.given === 8, `got ${bo.given}`);
    t('12b. the recipient\'s received = 8 — conservation holds across the pair', bp.received === 8, `got ${bp.received}`);
    t('12c. giver balance 10 − 8 = 2', bo.balance === 2, `got ${bo.balance}`);
  }

  // ── 13. The slot-enumeration prune — a rider never leaks as pseudo-slots ──
  {
    const pool: any = {
      _: 'a room',
      '6': {
        _: 'a probe with a rider', '1': 'keel', '3': nextTs(),
        '9': { _: 'rider', '1': 'keel-p1', '2': { _: 'credit claim', '1': 3, '2': 'keel' }, '4': { _: 'chain hops', '1': { _: 'hop 1', '1': 'keel', '2': 'sig' } }, '5': '0.341' },
      },
      '7': { _: 'plain chat after it', '1': 'weft', '3': nextTs() },
    };
    const { contributions } = collectContributions(pool, 0);
    const positions = contributions.map((c) => c.position);
    t('13a. the rider and its parts do not enumerate (no 69, 692, 694)', !positions.includes(69) && !positions.includes(692) && !positions.includes(694), `got ${positions.join(',')}`);
    t('13b. the real slots stand (6 and 7)', positions.includes(6) && positions.includes(7), `got ${positions.join(',')}`);
    t('13c. the next free slot is 8, not 71', findNextSlot(pool) === '8', `got ${findNextSlot(pool)}`);
    t('13d. the probe still reads as a probe (isRider)', isRider(pool['6']) && riderFromSlot(pool['6'])?.credits?.n === 3);
  }

  // ── 14. Skip — absence of a claim is not a verdict on one ──
  {
    const none = await verifyRiderCore({ rider: undefined, sender_agent_id: 'alice' }, deps);
    t('14a. no rider → skip', none.verdict === 'skip');
    const empty = await verifyRiderCore({ rider: { probe_id: 'x' }, sender_agent_id: 'alice' }, deps);
    t('14b. a rider claiming nothing → skip', empty.verdict === 'skip', `got ${empty.verdict}`);
    const zero = await verifyRiderCore({ rider: rider('a-p1', 0, 'alice'), sender_agent_id: 'alice' }, deps);
    t('14c. credits.n 0 claims nothing → skip', zero.verdict === 'skip', `got ${zero.verdict}`);
  }

  console.log(`\n${passCount} passed, ${failCount} failed`);
  if (failCount > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
