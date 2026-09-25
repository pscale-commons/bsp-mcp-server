/**
 * The gray write guard — no write descends into ciphertext.
 *
 * A gray envelope keeps its ciphertext at digit 1 and its nonce at 2, so an
 * address BENEATH one names a field the decryptor needs rather than anything an
 * author meant. Writing there replaces that field and the entry is gone: the
 * envelope stops parsing, and no secret recovers it. The beach cannot catch
 * this — what it receives is spine-legal JSON either way, and gray is bsp-mcp's
 * own scheme — so the layer that encrypts is the layer that refuses.
 *
 * The case that paid for it (battery 1) is history:Phenomemental on 2026-08-20:
 * a floor-1 block, nine gray entries, a full ladder, and an agent addressing
 * "11" for a flat tenth slot that block's floor does not have. At floor 1 that
 * address IS 1.1 — correctly, since an address is a number anchored at the
 * floor — so it landed on entry 1's ciphertext.
 *
 * The same block paid again on 2026-09-25 (batteries 4-7), and the second case
 * is the guard's other half: no gray write REPLACES what it should voice. The
 * owed summary of 1-9, written gray at 10 as the append ack invited, travelled
 * as an envelope — an object — and the beach replaces a position with an object
 * where it voices one with a line, so container 1 and its nine entries went.
 * The next append then landed inside that envelope, and keyed reads hid it.
 *
 * Run: npm run smoke:gray-guard
 */
import { grayCrossing, placeGray, paidInGray } from '../src/tools/bsp.js';
import { writeAt, floorDepth } from '../src/bsp.js';
import { deriveSurgicalValue } from '../src/db.js';
import { isGrayEnvelope, decryptGrayNodes } from '../src/keys.js';
import type { Block } from '../src/bsp.js';

let pass = 0;
let fail = 0;
const failures: string[] = [];

function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; failures.push(label); console.log(`  ✗ ${label}`); }
}

/** A gray self envelope, shaped exactly as keys.ts emits one. */
const env = (ct: string): Block => ({
  _: 'Encrypted (gray); readable only with the author secret.',
  '1': ct,
  '2': 'bm9uY2UtMzItYnl0ZXMtYmFzZTY0LXBhZGRpbmc=',
  '9': { _: 'gray', '1': 'self' },
}) as unknown as Block;

// ── Battery 1 — the field case, floor 1 with a full ladder ──────────────────
console.log('\n1. history:Phenomemental, 2026-08-20');
const full: any = { _: 'history:Phenomemental at beach.happyseaurchin.com.' };
for (let d = 1; d <= 9; d++) full[String(d)] = env(`ciphertext-${d}`);

assert(grayCrossing(full, '11') === '1',
  '"11" at floor 1 is 1.1 — refused, naming the envelope at 1');
assert(grayCrossing(full, '1.1') === '1',
  'the same address written with its decimal is refused identically');
assert(grayCrossing(full, '1.2') === '1',
  'the nonce field is refused too — every field of the envelope is interior');
assert(grayCrossing(full, '1.9') === '1',
  'so is the gray marker at 9');
assert(grayCrossing(full, '111') === '1',
  'a deeper descent is caught at the FIRST envelope crossed, not the last');
assert(grayCrossing(full, '99') === '9',
  'the guard follows the address, not position 1 — entry 9 refuses the same way');

// ── Battery 2 — what stays open ─────────────────────────────────────────────
console.log('\n2. authorship the guard must not touch');
assert(grayCrossing(full, '1') === null,
  'writing AT an entry replaces it whole — ordinary authorship, allowed');
assert(grayCrossing(full, '9') === null,
  'likewise the last entry');
assert(grayCrossing(full, '0') === null,
  'the root underscore is not inside any envelope');
assert(grayCrossing(full, '') === null,
  'an empty address addresses the root');

const open: any = { _: 'an open block', '3': { _: 'a plain node', '1': 'a plain leaf' } };
assert(grayCrossing(open, '31') === null,
  'a plain nested write is untouched');
assert(grayCrossing(open, '312') === null,
  'so is a write that creates intermediate nodes');

// A lookalike WITHOUT the marker at 9 is not an envelope: detection is the
// marker, never the shape, so ordinary two-string nodes keep their interiors.
const lookalike: any = { _: 'not gray', '4': { _: 'two strings and a nine', '1': 'a', '2': 'b', '9': { _: 'notes' } } };
assert(grayCrossing(lookalike, '41') === null,
  'a node that merely LOOKS like an envelope is not one — the marker decides');

// ── Battery 3 — the guard walks exactly where writeAt walks ─────────────────
// Same parse, same floor, same digits: guard and write cannot disagree about
// where an address lands, which is the only way the guard can be trusted.
console.log('\n3. guard and writeAt agree, floor for floor');
// What the beach leaves behind when a full ladder rolls over: the old root
// becomes the underscore, and the ladder continues one layer down. The old
// entries keep their addresses — that is the floor-anchoring invariant, and it
// is why "11" cannot mean one fixed thing across blocks.
const grown: any = {
  _: { _: 'the previous nine', '1': env('old-1'), '2': env('old-2') },
  '1': { _: 'the ladder continues', '1': env('new-1'), '2': env('new-2') },
};
assert(floorDepth(grown) === 2, 'the supernested block reads as floor 2');
assert(grayCrossing(grown, '11') === null,
  'at floor 2 "11" is a REAL entry address — allowed, where floor 1 refused it');
assert(grayCrossing(grown, '111') === '11',
  'and the descent below THAT is refused, naming the address in canonical form');
assert(grayCrossing(grown, '1') === null,
  'an old entry keeps its address across the rollover — writing AT it still replaces it whole');
assert(grayCrossing(grown, '011') === '1',
  'and its interior, reached one digit deeper, is refused under that same canonical address');

// The proof that the two walks coincide: for every address the guard clears,
// writeAt lands where a reader would expect, and for the one it refuses, the
// write WOULD have landed inside the envelope.
const victim: any = { _: 'x', '1': env('precious') };
writeAt(victim, '11', 'an innocent-looking session log');
assert(victim['1']['1'] === 'an innocent-looking session log' && victim['1']['2'] !== undefined,
  'unguarded, writeAt does exactly the damage reported: ciphertext replaced, nonce orphaned');
assert(grayCrossing({ _: 'x', '1': env('precious') } as any, '11') === '1',
  'guarded, that same write never runs');

// ── Battery 4 — the field case, 2026-09-25: a gray line at a container ──────
// history:Phenomemental at floor 2, owed "10 over 1-9". The summary was written
// gray at 10 exactly as the append ack invited; the envelope travelled alone, an
// object, and the beach replaces a position with an object where it voices one
// with a line — so container 1 and its nine entries went. placeGray puts the
// envelope where the line would go and sends the node whole.
console.log('\n4. history:Phenomemental, 2026-09-25 — the summary voices, the entries stay');
const stamped = (ct: string): any => ({ ...(env(ct) as any), '3': '2026-09-25T07:05:00.000Z' });
const ladder = (): any => {
  const b: any = { _: { _: 'history:Phenomemental at beach.happyseaurchin.com.' }, '1': {}, '2': {} };
  for (let d = 1; d <= 9; d++) b._[String(d)] = env(`era-${d}`);
  for (let d = 1; d <= 9; d++) b['1'][String(d)] = stamped(`span1-${d}`);
  for (let d = 1; d <= 3; d++) b['2'][String(d)] = stamped(`span2-${d}`);
  return b;
};
const summary = env('summary-of-1-9');

const unguarded = ladder();
writeAt(unguarded, '10', summary);
assert(isGrayEnvelope(unguarded['1']) && unguarded['1']['3'] === undefined,
  'unguarded, the envelope REPLACES container 1 — entries 13-18 gone, 11/12/19 now ciphertext, nonce, marker');

const b4 = ladder();
const before4 = JSON.parse(JSON.stringify(b4['1']));
const placed4 = placeGray(b4, '10', summary);
assert(placed4.refused === undefined && placed4.voiced === 9,
  'guarded, the envelope voices container 1 and reports the nine entries it carried');
assert(isGrayEnvelope(b4['1']._), 'the envelope stands at container 1\'s underscore');
assert(['1', '2', '3', '4', '5', '6', '7', '8', '9'].every(d => JSON.stringify(b4['1'][d]) === JSON.stringify(before4[d])),
  'all nine entries stand byte-identical beneath it');
const wire4 = deriveSurgicalValue(b4, '10', true);
assert(wire4 === b4['1'] && isGrayEnvelope(wire4._) && Object.keys(wire4).filter(k => /^[1-9]$/.test(k)).length === 9,
  'what the save POSTs at 10 is the whole node — the beach replaces node 1 with node 1, entries carried');
assert(JSON.stringify(b4._) === JSON.stringify(ladder()._) && JSON.stringify(b4['2']) === JSON.stringify(ladder()['2']),
  'the era under the root and container 2 are untouched');

const b4b = ladder();
assert(placeGray(b4b, '20', env('summary-of-11-19')).voiced === 3,
  'the address is not the cause: 20 voices container 2 and carries its three entries the same way');
const b4c = ladder();
assert(placeGray(b4c, '15', env('rewritten')).voiced === undefined && b4c['1']['5']['1'] === 'rewritten' && b4c['1']['5']['3'] === undefined,
  'AT an entry the envelope replaces that entry whole (its old stamp with it) — ordinary authorship, as before');
const b4d = ladder();
assert(placeGray(b4d, '24', env('new')).voiced === undefined && isGrayEnvelope(b4d['2']['4']),
  'at an empty address the envelope lands as the entry, as before');
const grainSide: any = { _: 'a grain', '2': { _: 'side 2 reaches', '1': env('m1'), '2': env('m2') }, '9': { _: 'parties', '1': 'a', '2': 'b' } };
assert(placeGray(grainSide, '2', env('re-voiced reach')).voiced === 2 && isGrayEnvelope(grainSide['2']['1']),
  'a grain side re-voiced in gray keeps its conversation (the same object-replaces path threatened it)');

// ── Battery 5 — the three placements that refuse ────────────────────────────
console.log('\n5. what placeGray refuses, and the address it names');
const b5 = ladder();
const root5 = placeGray(b5, '0', env('identity'));
assert(!!root5.refused && /floor/.test(root5.refused) && JSON.stringify(b5) === JSON.stringify(ladder()),
  '"0" is the root underscore: an object on the floor chain would read as one more supernest — refused, nothing moved');
const flat5: any = { _: 'a floor-1 block', '1': env('e1') };
assert(!!placeGray(flat5, '0', env('identity')).refused && floorDepth(flat5) === 1,
  'at floor 1 too — the floor stays 1');

// The state 2026-09-25 left: an envelope standing where container 1 was, and
// the next append allocated INSIDE it (11 and 12 read as taken by its fields).
const damaged: any = ladder();
damaged['1'] = { ...(env('the-summary') as any), '3': stamped('the-09:42-entry') };
const dam5 = placeGray(damaged, '10', env('try again'));
assert(!!dam5.refused && /13/.test(dam5.refused) && /at 10/.test(dam5.refused) && damaged['1']['3']['1'] === 'the-09:42-entry',
  'an envelope with an entry inside it refuses — naming 13 and 10 — and the entry stays');
assert(grayCrossing(damaged, '14') === '10',
  'the descent guard names that container 10, not "1" — which would re-parse as ENTRY 01 and replace it');
const hidden: any = { _: 'x', '4': { _: { _: 'a hidden directory', '1': 'kept inside' }, '1': 'a' } };
assert(!!placeGray(hidden, '4', env('voice')).refused && hidden['4']._['1'] === 'kept inside',
  'a node whose underscore is itself a directory refuses rather than replace it');
const revoice: any = ladder();
placeGray(revoice, '10', env('first summary'));
assert(placeGray(revoice, '10', env('second summary')).voiced === 9 && revoice['1']._['1'] === 'second summary',
  'a gray summary re-voiced replaces the old voicing, entries still carried');

// ── Battery 6 — the read keeps what stands beside an envelope ───────────────
console.log('\n6. decryptGrayNodes: nothing standing in the block drops out of view');
const open6 = async (e: any) => (typeof e['1'] === 'string' ? `plain:${e['1']}` : null);
assert(await decryptGrayNodes(env('solo'), open6) === 'plain:solo',
  'a bare envelope reads as its plaintext, as before');
const st6 = await decryptGrayNodes(stamped('dated'), open6);
assert(st6._ === 'plain:dated' && st6['3'] === '2026-09-25T07:05:00.000Z',
  'an appended entry keeps its arrival stamp at 3, as an open entry does');
const dm6 = await decryptGrayNodes(damaged['1'], open6);
assert(dm6._ === 'plain:the-summary' && dm6['3']?._ === 'plain:the-09:42-entry',
  'the entry acknowledged at 13 is in view beneath the envelope it landed in');
const v6 = await decryptGrayNodes(b4['1'], open6);
assert(v6._ === 'plain:summary-of-1-9' && v6['5']?._ === 'plain:span1-5',
  'a node voiced in gray reads as the summary with its nine entries beneath');

// ── Battery 7 — a summary paid in gray is paid ──────────────────────────────
console.log('\n7. paidInGray: the due the beach still reports is dropped');
assert(paidInGray(b4, '10') === true, 'container 1 voiced in gray: 10 is paid');
assert(paidInGray(ladder(), '10') === false, 'unvoiced: 10 is owed');
const openPaid = ladder(); openPaid['1']._ = 'an open summary';
assert(paidInGray(openPaid, '10') === false, 'voiced in the open: the beach itself already counts it paid');
assert(paidInGray(ladder(), '20') === false && paidInGray(b4b, '20') === true, '20 likewise');

console.log(`\n${fail === 0 ? '✓' : '✗'} gray guard: ${pass} passed, ${fail} failed`);
if (fail > 0) { failures.forEach(f => console.log(`   - ${f}`)); process.exit(1); }
