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
 * Run: npm run smoke:gray-guard
 */
import { grayCrossing } from '../src/tools/bsp.js';
import { writeAt, floorDepth } from '../src/bsp.js';
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

console.log(`\n${fail === 0 ? '✓' : '✗'} gray guard: ${pass} passed, ${fail} failed`);
if (fail > 0) { failures.forEach(f => console.log(`   - ${f}`)); process.exit(1); }
