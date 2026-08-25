/**
 * smoke-hollow-ack.ts — the phantom-write closure battery.
 *
 * Two witnessed classes of "phantom write" — an ack naming an address the
 * walker did not resolve to:
 *
 *   (1) TRUNCATION (2026-07-08, history:keel:15): a point write with an
 *       explicit pscale ABOVE the spindle terminus lands at the addressed
 *       depth (whetstone:2.4 — canonical), but the surgical wire payload was
 *       derived by reading at the FULL spindle → undefined → JSON.stringify
 *       drops the content key → the beach treats the POST as lock-only and
 *       200s → hollow ack, nothing lands anywhere.
 *
 *   (2) FLOOR PADDING (2026-08-25, pool:weft:52): a spindle narrower than
 *       the floor left-pads with '0' and walks the root underscore chain
 *       (digit 0 = "_") — canonical and load-bearing for supernest-stable
 *       addressing — but the ack echoed only the input string, so an author
 *       in the floor-1 dialect ("4.1" meaning branch 4 → 1) finds nothing
 *       where they look and reads the write as dropped.
 *
 * The closure: bspWrite reports the LANDED address (+ a landing note for
 * both classes), the transport saves at the landed address when it differs
 * (wire_spindle), and db.deriveSurgicalValue refuses a content-bearing save
 * whose derived payload is undefined — never a content-less POST for a
 * content write. Lock-only saves still pass without content (claim-by-lock
 * at an empty position is the roster pattern).
 *
 * Run: npm run smoke:hollow-ack
 */

import { bspWrite, formatWrite } from '../src/bsp-fn.js';
import { readAt, floorDepth, parseSpindle } from '../src/bsp.js';
import { deriveSurgicalValue } from '../src/db.js';

let failures = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}`);
    failures++;
  }
}

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

// The beach handler's writeAt (pscale-beach api/pscale-beach.js), transcribed:
// same parse family, subnest-on-growth on intermediate strings. Used here to
// prove the wire now transmits faithfully — beach copy ends equal to the
// local merge at the landed position.
function beachWriteAt(block: any, address: string, value: any): any {
  if (!address) return value;
  const fl = floorDepth(block);
  const { digits } = parseSpindle(address, fl);
  if (!digits.length) return value;
  let node = block;
  for (let i = 0; i < digits.length - 1; i++) {
    const key = digits[i] === '0' ? '_' : digits[i];
    const existing = node[key];
    if (typeof existing === 'string') node[key] = { _: existing };
    else if (typeof existing !== 'object' || existing === null) node[key] = {};
    node = node[key];
  }
  const lastKey = digits[digits.length - 1] === '0' ? '_' : digits[digits.length - 1];
  node[lastKey] = value;
  return block;
}

// ── Fixtures ──

const FLOOR2 = { _: { _: 'floor-2 root text' }, 4: { _: 'branch four standing text', 1: 'standing leaf' } };
const FLOOR1 = { _: 'floor-1 root text', 4: { _: 'branch four standing text', 1: 'standing leaf' } };
const NOTE = { _: 'the subnest note', 1: 'child one' };

// ── Class 2: floor padding into the root underscore chain ──

console.log('\nclass 2 — floor padding (the 2026-08-25 "4.1" report):');
{
  const b = clone(FLOOR2);
  const r = bspWrite(b, '4.1', null, clone(NOTE));
  const ack = formatWrite(r);
  assert(r.landed === '04.1', `landed is the full-width label "04.1" (digits 0,4,1) — got "${r.landed}"`);
  assert(/→ landed at "04\.1"/.test(ack), 'ack head shows the padded landing');
  assert(r.wire_spindle === undefined, 'no wire override (landing depth == terminus)');
  assert(/root underscore chain/.test(r.landing_note ?? ''), 'landing note names the root underscore chain');
  assert(/"41"/.test(r.landing_note ?? ''), 'landing note offers the branch-walk address "41"');
  assert(/\[note\]/.test(ack), 'formatWrite renders the note');
  assert(JSON.stringify((b as any)._?.['4']?.['1']) === JSON.stringify(NOTE), 'merge landed at _.4.1 (padding honoured — supernest-stable)');
  assert((b as any)['4']['1'] === 'standing leaf', 'branch 4 → 1 untouched');
  assert(deriveSurgicalValue(b, '4.1', true) !== undefined, 'surgical payload derives at the landed position');
  assert(deriveSurgicalValue(b, '04.1', true) !== undefined, 'the full-width label round-trips through the parser');
}
{
  const b = clone(FLOOR2);
  const r = bspWrite(b, '41', null, clone(NOTE));
  assert(r.landed === '41' && r.landing_note === undefined, 'dot-free "41" walks the branch — no note');
  assert(JSON.stringify((b as any)['4']['1']) === JSON.stringify(NOTE), 'merge landed at branch 4 → 1');
}
{
  const b = clone(FLOOR2);
  const r = bspWrite(b, '4', null, 'replacing branch four whole');
  assert(/root underscore chain/.test(r.landing_note ?? '') && /"40"/.test(r.landing_note ?? ''),
    'dot-free short "4" pads too — note offers "40" for the branch');
}
{
  const b = clone(FLOOR1);
  const r = bspWrite(b, '4.1', null, clone(NOTE));
  assert(r.landing_note === undefined, 'floor 1: "4.1" IS the branch walk — no note');
  assert(JSON.stringify((b as any)['4']['1']) === JSON.stringify(NOTE), 'floor 1 merge landed at branch 4 → 1');
}
{
  // An author who wrote the zeros out said what they meant — no note.
  const b = clone(FLOOR2);
  const r = bspWrite(b, '041', null, clone(NOTE));
  assert(r.landing_note === undefined, 'explicit "041" (zeros authored, not padded) — no note');
}

// ── Class 1: pscale truncation (the 2026-07-08 hollow ack) ──

console.log('\nclass 1 — pscale above the terminus (the 2026-07-08 "24 pscale 1" report):');
{
  const b = clone({ _: { _: 'counting root' }, 2: { _: 'bracket two', 3: 'entry 23' } });
  const pristineBeach = clone(b);
  const r = bspWrite(b, '24', 1, 'entry fourteen text');
  const ack = formatWrite(r);
  assert(r.shape === 'point', 'shape is point');
  assert(r.landed === '20', `landed at the addressed depth, full-width "20" — got "${r.landed}"`);
  assert(r.wire_spindle === '20', 'wire override set: the transport saves at "20" (round-trips; bare "2" would re-pad to 0,2)');
  assert(/→ landed at "20"/.test(ack), `ack names the landing: ${ack.split('\n')[0]}`);
  assert(/\[note\]/.test(ack), 'ack carries the truncation note');
  assert((b as any)['2']._ === 'entry fourteen text', 'merge wrote the point at depth 1 (node underscore)');

  // The old derivation — reading at the FULL spindle — is exactly the hollow
  // mechanism: undefined payload, content key dropped from the POST body.
  assert(readAt(b, '24') === undefined, 'reading the full spindle on the merged block yields undefined');
  assert(!('content' in JSON.parse(JSON.stringify({ spindle: '24', content: undefined }))),
    'JSON.stringify drops an undefined content key (the wire mechanism)');

  // The guard: a content-bearing save at the OLD address refuses loudly…
  let threw = '';
  try { deriveSurgicalValue(b, '24', true); } catch (e: any) { threw = e.message; }
  assert(/digit walk 2,4/.test(threw) && /refusing/.test(threw),
    'deriveSurgicalValue refuses, naming the resolved digit walk');

  // …and the NEW path transmits faithfully: beach applies the wire body and
  // converges with the local merge.
  const value = deriveSurgicalValue(b, r.wire_spindle!, true);
  const beach = clone(pristineBeach);
  beachWriteAt(beach, r.wire_spindle!, value);
  assert(JSON.stringify(beach) === JSON.stringify(b), 'beach copy converges with the local merge');
}
{
  // Lock-only saves still derive undefined without refusal — claim-by-lock at
  // an empty position (the roster pattern) posts no content by design.
  const empty = { _: 'a roster block' };
  assert(deriveSurgicalValue(empty, '3', false) === undefined, 'lock-only derivation passes undefined through (no throw)');
}

// ── Verdict ──

if (failures) {
  console.error(`\nsmoke-hollow-ack: ${failures} FAILURE(S)`);
  process.exit(1);
}
console.log('\nsmoke-hollow-ack: all green — no write acks hollow, every landing is named.');
