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
 * Battery 8 is the way back out: the degray. The gray parameter's own recipe
 * (read with the key, write the plaintext back with gray:false) voiced the
 * envelope instead of replacing it. The ciphertext stayed, and two readers saw
 * two different entries.
 *
 * Run: npm run smoke:gray-guard
 */
import { grayCrossing, placeGray, paidInGray, shedGray, handleBsp } from '../src/tools/bsp.js';
import { writeAt, floorDepth, parseSpindle } from '../src/bsp.js';
import { bspWrite } from '../src/bsp-fn.js';
import { deriveSurgicalValue } from '../src/db.js';
import { isGrayEnvelope, decryptGrayNodes, selfEncrypt } from '../src/keys.js';
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

// ── Battery 8 — the degray: an open line takes the envelope's place ─────────
// A line voices the node it lands on (block-conventions:3.5). bspWrite does
// this, and so does the beach's writeAt, and an envelope is a node. So the
// recipe's open line became the envelope's note while the ciphertext stayed.
// The node was still an envelope, on this side and at the beach: a keyed read
// decrypted the old text and an open read showed the new. shedGray completes
// the landing: the envelope's own fields go, what stands beside them stays, and
// the node travels as an object so the beach replaces rather than voices.
console.log('\n8. the degray — an open line at an envelope takes its place');
const notes = (): any => ({ _: 'notes at floor 1', '1': 'an open line', '3': env('the-old-private-text') });
const NEW = 'the new public text';

const u8 = notes();
bspWrite(u8, '3', null, NEW);
assert(isGrayEnvelope(u8['3']) && u8['3']._ === NEW,
  'unguarded, the line voices the envelope — still an envelope, with the new text as its note');
assert((await decryptGrayNodes(u8, open6))['3'] === 'plain:the-old-private-text',
  'so a keyed read decrypts the OLD text while an open read shows the new — two readers, two entries');
assert(isGrayEnvelope(deriveSurgicalValue(u8, '3', true)),
  'and what the save POSTs is the envelope itself, which the beach keeps whole');

const g8 = notes();
const w8 = bspWrite(g8, '3', null, NEW);
assert(shedGray(g8, w8.landed!) && JSON.stringify(g8['3']) === JSON.stringify({ _: NEW }),
  'guarded, the envelope is shed and the line stands alone at 3');
const wire8 = deriveSurgicalValue(g8, '3', true);
assert(typeof wire8 === 'object' && wire8._ === NEW && !isGrayEnvelope(wire8),
  'the save POSTs an object, which the beach lands by replacing its envelope (a bare line would voice it)');
assert(JSON.stringify(await decryptGrayNodes(g8, open6)) === JSON.stringify(g8),
  'a keyed read and an open one read the same block');

const s8: any = { _: 'x', '4': stamped('an-appended-private-line') };
shedGray(s8, bspWrite(s8, '4', null, 'the appended line, public').landed!);
assert(s8['4']._ === 'the appended line, public' && s8['4']['3'] === '2026-09-25T07:05:00.000Z' && Object.keys(s8['4']).length === 2,
  'a gray-appended entry keeps its arrival stamp: it reads {_, 3}, the shape of an open append');

const grain8: any = { _: 'a grain', '1': { _: 'side 1', '2': { ...(env('m') as any), '9': { _: 'gray', '1': 'grain', '2': 'bob' } } } };
shedGray(grain8, bspWrite(grain8, '1.2', null, 'published').landed!);
assert(JSON.stringify(grain8['1']['2']) === JSON.stringify({ _: 'published' }),
  'a grain envelope is shed the same way — gray:false is how a party publishes its own side');

// The state 2026-09-25 left: an envelope where container 1 was, and an entry
// appended inside it at 13. A gray line there refuses (battery 5), because it
// would replace the entry. An open line takes only the envelope's own fields.
const d8: any = ladder();
d8['1'] = { ...(env('the-summary') as any), '3': stamped('the-09:42-entry') };
assert(shedGray(d8, bspWrite(d8, '10', null, 'the summary, public').landed!)
  && d8['1']._ === 'the summary, public' && !('9' in d8['1']) && d8['1']['3']['1'] === 'the-09:42-entry',
  'an envelope with an entry inside: 10 is voiced in the open and the entry at 13 stands beneath it, untouched');

const v8 = ladder();
placeGray(v8, '10', env('a private summary'));
assert(!shedGray(v8, bspWrite(v8, '10', null, 'the summary, public').landed!)
  && v8['1']._ === 'the summary, public'
  && ['1', '2', '3', '4', '5', '6', '7', '8', '9'].every(d => v8['1'][d]['1'] === `span1-${d}`),
  'a summary voiced in gray degrays by the ordinary voicing: nothing to shed, nine entries stand');
assert(!paidInGray(v8, '10'), 'and 10 reads paid in the open, as the beach counts it');

const hue: any = { _: 'x', '5': { _: 'colours', '1': 'red', '2': 'blue', '9': { _: 'gray', '1': 'light', '2': 'dark' } } };
assert(!shedGray(hue, bspWrite(hue, '5', null, 'the colours of the shore').landed!)
  && hue['5']._ === 'the colours of the shore' && hue['5']['1'] === 'red' && hue['5']['9']['2'] === 'dark',
  'a node whose ninth entry merely reads "gray" takes the voicing and keeps every entry');

// Through the door, against an in-memory beach that lands a POST as the beach
// does: its writeAt, transcribed with the voicing at the terminus (pscale-beach
// api/pscale-beach.js, since 2026-07-28) — a scalar at a node sets the node's
// underscore, an object replaces the node.
{
  const ORIGIN = 'https://gray-guard.test';
  const B = 'notes:degray';
  const KEY = 'a-key-for-the-battery';
  const store: Record<string, any> = { [B]: { _: 'notes at the fixture beach', '1': 'an open line' } };
  const beachWriteAt = (block: any, address: string, value: any): void => {
    const { digits } = parseSpindle(address, floorDepth(block));
    let node = block;
    for (let i = 0; i < digits.length - 1; i++) {
      const key = digits[i] === '0' ? '_' : digits[i];
      if (typeof node[key] === 'string') node[key] = { _: node[key] };
      else if (typeof node[key] !== 'object' || node[key] === null) node[key] = {};
      node = node[key];
    }
    const last = digits[digits.length - 1] === '0' ? '_' : digits[digits.length - 1];
    const target = node[last];
    if (target !== null && typeof target === 'object' && !Array.isArray(target) && (value === null || typeof value !== 'object')) target._ = value;
    else node[last] = value;
  };
  const answer = (v: unknown, status = 200) =>
    new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.origin !== ORIGIN || !url.pathname.endsWith('/.well-known/pscale-beach')) return answer({ error: 'no beach here' }, 404);
    const name = url.searchParams.get('block');
    if ((init?.method ?? 'GET') === 'GET') {
      if (!name) return answer({ _: 'fixture beach', origin: ORIGIN, blocks: Object.keys(store) });
      return name in store ? answer(store[name]) : answer({ error: 'not found' }, 404);
    }
    const body = JSON.parse(String(init.body));
    if (!name || !(name in store) || !body.spindle) return answer({ error: 'this fixture takes surgical writes to a standing block' }, 400);
    beachWriteAt(store[name], String(body.spindle), body.content);
    return answer({ ok: true });
  }) as typeof fetch;
  const door = async (p: Record<string, unknown>) =>
    (await handleBsp({ agent_id: ORIGIN, block: B, ...p } as any)).content.map(c => c.text).join('\n');

  try {
    await door({ spindle: '3', content: 'the old private text', gray: true, enc_secret: KEY });
    assert(isGrayEnvelope(store[B]['3']), 'door: a gray write at 3 leaves an envelope at the beach');
    await door({ spindle: '6', content: store[B]['3'] });
    assert(isGrayEnvelope(store[B]['6']),
      'door: an envelope written as an OBJECT lands whole (moving an encrypted entry keeps it encrypted); only a line sheds');

    const ack = await door({ spindle: '3', content: NEW, gray: false });
    assert(JSON.stringify(store[B]['3']) === JSON.stringify({ _: NEW }),
      'door: the degray leaves {_: line} at the beach, with no ciphertext, nonce or marker');
    assert(/takes the gray envelope's place at "3"/.test(ack) && !/3\.1 · 3\.2/.test(ack),
      'door: the ack says the envelope was replaced, and the read-back lists no envelope fields beneath the line');
    const keyed = await door({ spindle: '3', enc_secret: KEY });
    const openRead = await door({ spindle: '3' });
    assert(keyed.includes(NEW) && !keyed.includes('old private') && openRead.includes(NEW),
      'door: a keyed read and an open one both return the new line');
    assert((await door({ spindle: '6', enc_secret: KEY })).includes('the old private text'),
      'door: the envelope carried to 6 still opens with its key');

    store[B]['4'] = { ...(await selfEncrypt('an appended private line', KEY, ORIGIN)), '3': '2026-09-25T07:05:00.000Z' };
    await door({ spindle: '4', content: 'the appended line, public', gray: false });
    assert(JSON.stringify(store[B]['4']) === JSON.stringify({ '3': '2026-09-25T07:05:00.000Z', _: 'the appended line, public' }),
      'door: a gray-appended entry degrays to {_, 3} at the beach, its arrival stamp carried');
  } finally {
    globalThis.fetch = realFetch;
  }
}

console.log(`\n${fail === 0 ? '✓' : '✗'} gray guard: ${pass} passed, ${fail} failed`);
if (fail > 0) { failures.forEach(f => console.log(`   - ${f}`)); process.exit(1); }
