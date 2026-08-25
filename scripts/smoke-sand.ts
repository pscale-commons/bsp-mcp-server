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
  collectReceipts,
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
const namedBlocks = new Map<string, Block>(); // grains + audit collectives (the mint's backing)

const deps: VerifyDeps = {
  loadPassport: async (h) => passports.get(h) ?? null,
  loadKey: async (h) => {
    const kp = keyring.get(h);
    return kp ? Buffer.from(kp.publicKey).toString('base64') : null;
  },
  loadBlock: async (name) => namedBlocks.get(name) ?? null,
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

function addGave(p: Block, g: { probe_id: string; n: number; to: string; topic?: string; channel?: string; audit?: string }) {
  writeAt(p, gaveSlotAddress(nextGaveSlot(p)), gaveContent({
    voicing: `gave ${g.n} to ${g.to} (${g.probe_id})`,
    ts: nextTs(),
    ...g,
  }) as any);
}

/** Seed a handle's stock the way stock actually arrives under mint-as-gave
 *  (sand-v2:2.1.2): a transferring receipt from an issuer. The retired minted
 *  term never returns — received carries the mint. */
function seedStock(p: Block, handle: string, n: number) {
  addReceipt(p, '0.341', { sender: `mint-of-${handle}`, probe_id: `seed-${handle}`, v_latest: n });
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
    seedStock(alice, 'alice', 6);
    addGave(alice, { probe_id: 'a-p1', n: 3, to: 'bob', topic: '0.341' });
    addReceipt(bob, '0.341', { sender: 'alice', probe_id: 'a-p1', v_latest: 3 });
    const ba = await computeBalance('alice', alice, deps.loadPassport);
    const bb = await computeBalance('bob', bob, deps.loadPassport);
    t('3a. giver balance = received 6 (the mint rides received) − given 3 = 3', ba.balance === 3, `got ${ba.balance}`);
    t('3b. recipient balance rises by the 3 received', bb.balance === 3, `got ${bb.balance}`);
    const aliceReceipts = collectReceipts(alice);
    t('3c. the giver passport holds only its own seed receipt — bob\'s receipt lives at bob', aliceReceipts.length === 1 && aliceReceipts[0].sender === 'mint-of-alice', JSON.stringify(aliceReceipts));
    const r = await verifyRiderCore({ rider: rider('a-p1', 3, 'alice'), sender_agent_id: 'alice' }, deps);
    t('3d. the backed claim verifies pass', r.verdict === 'pass', `got ${r.verdict} (${JSON.stringify(r.balance)})`);
  }

  // ── 4. Two probes against one balance, both kept → the second unbacked ──
  {
    const dan = freshPassport('dan');
    const erin = freshPassport('erin');
    seedStock(dan, 'dan', 5);
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
    seedStock(ben, 'ben', 10);
    // completion: ben shares 10 back along a two-hop chain, equal split.
    addGave(ben, { probe_id: 'ben-hau-x-h1', n: 5, to: 'hop-one', topic: '0.341' });
    addGave(ben, { probe_id: 'ben-hau-x-h2', n: 5, to: 'hop-two', topic: '0.341' });
    addReceipt(h1, '0.341', { sender: 'ben', probe_id: 'ben-hau-x-h1', v_latest: 5 });
    addReceipt(h2, '0.341', { sender: 'ben', probe_id: 'ben-hau-x-h2', v_latest: 5 });
    const bb = await computeBalance('ben', ben, deps.loadPassport);
    const b1 = await computeBalance('hop-one', h1, deps.loadPassport);
    const b2 = await computeBalance('hop-two', h2, deps.loadPassport);
    t('8a. every hop\'s balance rises by its share', b1.balance === 5 && b2.balance === 5, `got ${b1.balance}, ${b2.balance}`);
    t('8b. the beneficiary\'s falls by the total', bb.balance === 0, `got ${bb.balance}`);
    // a chain that died before completion is never shared to — nothing moves:
    const idle = freshPassport('idle-hop');
    const bi = await computeBalance('idle-hop', idle, deps.loadPassport);
    t('8c. a chain without completion moves nothing', bi.balance === 0 && bi.received === 0);
  }

  // ── 9. The honest negative: giving beyond stock reads negative, receipts stand ──
  {
    const ivy = freshPassport('ivy');
    const jo = freshPassport('jo');
    addGave(ivy, { probe_id: 'i-p1', n: 4, to: 'jo', topic: '0.341' });
    addReceipt(jo, '0.341', { sender: 'ivy', probe_id: 'i-p1', v_latest: 4 });
    const bi = await computeBalance('ivy', ivy, deps.loadPassport);
    const bj = await computeBalance('jo', jo, deps.loadPassport);
    t('9a. the unstocked giver reads honestly negative', bi.balance === -4, `got ${bi.balance}`);
    t('9b. the receiver\'s receipt stands — nothing claws back (sand-v2:2.3)', bj.balance === 4, `got ${bj.balance}`);
    addGave(ivy, { probe_id: 'i-p2', n: 2, to: 'jo', topic: '0.341' });
    const r = await verifyRiderCore({ rider: rider('i-p2', 2, 'ivy'), sender_agent_id: 'ivy' }, deps);
    t('9c. later offers come back unbacked until it recovers', r.verdict === 'unbacked', `got ${r.verdict}`);
  }

  // ── 10. SQ claim within 0.01 of the recompute → pass, else warn ──
  {
    const kim = freshPassport('kim');
    const lee = freshPassport('lee');
    seedStock(kim, 'kim', 10);
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
    seedStock(mia, 'mia', 10);
    addGave(mia, { probe_id: 'm-p1', n: 5, to: 'noa', topic: '0.341' });
    addReceipt(noa, '0.341', { sender: 'mia', probe_id: 'm-p1', v_latest: 2 });
    const b = await computeBalance('mia', mia, deps.loadPassport);
    t('11. given subtracts what was received (2), not what was offered (5)', b.given === 2 && b.balance === 8, `got given ${b.given}, balance ${b.balance}`);
  }

  // ── 12. Repeat-give conservation — why receipts are per-probe ──
  {
    const oli = freshPassport('oli');
    const pat = freshPassport('pat');
    seedStock(oli, 'oli', 10);
    addGave(oli, { probe_id: 'o-p1', n: 3, to: 'pat', topic: '0.341' });
    addReceipt(pat, '0.341', { sender: 'oli', probe_id: 'o-p1', v_latest: 3 });
    addGave(oli, { probe_id: 'o-p2', n: 5, to: 'pat', topic: '0.341' });
    addReceipt(pat, '0.341', { sender: 'oli', probe_id: 'o-p2', v_latest: 5 });
    const bo = await computeBalance('oli', oli, deps.loadPassport);
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

  // ── 15. A forwarded claim verifies against its OWN party (credits.by) ──
  {
    const gwen = freshPassport('gwen');
    freshPassport('rita');
    seedStock(gwen, 'gwen', 10);
    addGave(gwen, { probe_id: 'g-p1', n: 5, to: 'rita', topic: '0.341' });
    // The slot was written by the CARRIER (carl); the rider names gwen.
    const r = await verifyRiderCore({
      rider: rider('g-p1', 5, 'gwen'),
      sender_agent_id: 'carrier-carl',
    }, deps);
    t('15. forwarded claim verifies against credits.by, not the carrier', r.verdict === 'pass', `got ${r.verdict} (${JSON.stringify(r.provenance)})`);
  }

  // ── 16. Unbacked receipts transfer nothing — on either side ──
  {
    const uma = freshPassport('uma');
    const vic = freshPassport('vic');
    addGave(uma, { probe_id: 'u-p1', n: 60, to: 'vic', topic: '0.341' });
    addReceipt(vic, '0.341', { sender: 'uma', probe_id: 'u-p1', v_latest: 60, verdict: 'unbacked' });
    const bu = await computeBalance('uma', uma, deps.loadPassport);
    const bv = await computeBalance('vic', vic, deps.loadPassport);
    t('16a. an unbacked receipt enters no balance at the receiver (sand-v2:5.5)', bv.received === 0 && bv.balance === 0, `got received ${bv.received}`);
    t('16b. nor does it debit the giver — the filter is symmetric', bu.given === 0, `got given ${bu.given}`);
    t('16c. conservation survives the filter', bu.balance + bv.balance === 0, `sum ${bu.balance + bv.balance}`);
    t('16d. the GAVE stands as an open offer, not a transfer', bu.openOffers === 1, `got ${bu.openOffers}`);
  }

  // ── 18-21. THE MINT — grain-backed gaves (the ruling at sand-v2:2.1.2, the check at 5.1.1) ──
  {
    const quay = freshPassport('quay-test');
    freshPassport('buyer-bee');
    const pid1 = 'grain:testmint01';
    namedBlocks.set(pid1, {
      _: 'a ticket grain, issuer to buyer',
      '1': { _: '[ticket face=character scope=frame:trial expires=2027-01-01T00:00:00Z credits=100]' },
      '9': { '1': 'quay-test', '2': 'buyer-bee' },
    } as any);
    // Positions 11 and 12 are DIGIT WALKS (1→1, 1→2) — the spine holds only _
    // and 1-9; a literal '11' key would be the shape-gate violation itself.
    namedBlocks.set('sed:trial-audit', {
      _: 'the verifier audit collective (payway:2.3)',
      '1': {
        '1': { _: '[ticket-verified by=agent:keeper at=2026-08-25T13:00:00Z grain=grain:testmint01:1]' },
        '2': { _: '[ticket-verified by=agent:keeper at=2026-08-25T13:10:00Z grain=grain:testmint02:1]' },
      },
    } as any);
    addGave(quay, { probe_id: 'q-m1', n: 100, to: 'buyer-bee', topic: '0.341', channel: pid1, audit: 'sed:trial-audit:11' });
    const r18 = await verifyRiderCore({ rider: rider('q-m1', 100, 'quay-test'), sender_agent_id: 'quay-test' }, deps);
    t('18a. a verified grain backs the mint-gave — pass despite issuer stock 0', r18.verdict === 'pass', `got ${r18.verdict} (${JSON.stringify(r18.balance)})`);
    t('18b. the balance dimension reports the grain, not the issuer', r18.balance.grain === pid1 && r18.balance.ticket_credits === 100, JSON.stringify(r18.balance));

    // 19 — a revoked ticket unmints: new mint-gaves unbacked; prior receipts stand.
    const pid2 = 'grain:testmint02';
    namedBlocks.set(pid2, {
      _: 'a ticket grain, later refunded',
      '1': {
        _: '[ticket face=character scope=frame:trial expires=2027-01-01T00:00:00Z credits=50]',
        '1': '[ticket-revoked at=2026-08-25T13:30:00Z reason=refund]',
      },
      '9': { '1': 'quay-test', '2': 'buyer-bee' },
    } as any);
    addGave(quay, { probe_id: 'q-m2', n: 50, to: 'buyer-bee', topic: '0.341', channel: pid2, audit: 'sed:trial-audit:12' });
    const r19 = await verifyRiderCore({ rider: rider('q-m2', 50, 'quay-test'), sender_agent_id: 'quay-test' }, deps);
    t('19. a revoked ticket unmints — the new mint-gave is unbacked', r19.verdict === 'unbacked' && String(r19.balance.reason).includes('revoked'), `got ${r19.verdict} (${r19.balance.reason})`);

    // 20 — one ticket cannot back unlimited mint-gaves (net check, 2.1.3b).
    addGave(quay, { probe_id: 'q-m3', n: 20, to: 'buyer-bee', topic: '0.341', channel: pid1, audit: 'sed:trial-audit:11' });
    const r20 = await verifyRiderCore({ rider: rider('q-m3', 20, 'quay-test'), sender_agent_id: 'quay-test' }, deps);
    t('20. gaves beyond the grain\'s credits are unbacked (100 + 20 > 100)', r20.verdict === 'unbacked' && String(r20.balance.reason).includes('exhausted'), `got ${r20.verdict} (${r20.balance.reason})`);

    // 21 — no audit pointer, no verification: the gave must name where [ticket-verified] stands.
    const pid3 = 'grain:testmint03';
    namedBlocks.set(pid3, {
      _: 'a ticket grain nobody verified',
      '1': { _: '[ticket face=character scope=frame:trial expires=2027-01-01T00:00:00Z credits=10]' },
      '9': { '1': 'quay-test', '2': 'buyer-bee' },
    } as any);
    addGave(quay, { probe_id: 'q-m4', n: 10, to: 'buyer-bee', topic: '0.341', channel: pid3 });
    const r21 = await verifyRiderCore({ rider: rider('q-m4', 10, 'quay-test'), sender_agent_id: 'quay-test' }, deps);
    t('21. a mint-gave naming no audit position is unbacked (unverified)', r21.verdict === 'unbacked' && String(r21.balance.reason).includes('audit'), `got ${r21.verdict} (${r21.balance.reason})`);
  }

  // ── 17. The temporal annotator leaves timestamp-bearing identifiers whole ──
  {
    const { annotateAges } = await import('../src/temporal.js');
    const embedded = annotateAges('probe cowrie-hau-cowrie-supernest-2026-08-25T12:44Z-h1 landed', new Date('2026-08-25T13:00:00Z'));
    t('17a. an id embedding a stamp is not spliced', embedded.includes('cowrie-supernest-2026-08-25T12:44Z-h1') && !embedded.includes('Z ('), embedded);
    const standalone = annotateAges('landed at 2026-08-25T12:44Z today', new Date('2026-08-25T13:00:00Z'));
    t('17b. a free-standing stamp is still annotated', /2026-08-25T12:44Z \(/.test(standalone), standalone);
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
