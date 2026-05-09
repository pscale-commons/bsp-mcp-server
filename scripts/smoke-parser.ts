/**
 * Comprehensive smoke for the canonical pscale address parser.
 *
 * Covers:
 *   - parseAddress: tokenisation, multi-dot reject, non-digit reject, floats/ints
 *   - parseSpindle: floor-aware pad-left, strict left>floor reject, trailing zeros, star
 *   - formatAddress: canonical single-dot emit, leading-zero strip, round-trip
 *   - Floor-growth: "34.5" must locate the same content across floors 2/3/4
 *   - End-to-end via bspRead on synthetic blocks
 *
 * This is the ground-truth test suite for the floor-anchor + multi-dot reject
 * fix. Run after every parser-touching change.
 */
import {
  parseAddress,
  parseSpindle,
  formatAddress,
  floorDepth,
  InvalidAddressError,
  bsp,
  writeAt,
  readAt,
} from '../src/bsp.js';
import { bspRead, bspWrite } from '../src/bsp-fn.js';

let pass = 0;
let fail = 0;
const failures: string[] = [];

function assert(cond: boolean, label: string) {
  if (cond) { pass++; }
  else { fail++; failures.push(label); console.log(`  ✗ ${label}`); }
}

function assertThrows(fn: () => any, label: string, ctor?: any) {
  try {
    fn();
    fail++;
    failures.push(`${label} (did not throw)`);
    console.log(`  ✗ ${label} (did not throw)`);
  } catch (e: any) {
    if (ctor && !(e instanceof ctor)) {
      fail++;
      failures.push(`${label} (wrong error type: ${e?.name})`);
      console.log(`  ✗ ${label} (wrong error type: ${e?.name})`);
    } else {
      pass++;
    }
  }
}

function arrayEq(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// ── parseAddress ──

console.log('=== parseAddress — tokenisation ===');
{
  const r = parseAddress('34.5');
  assert(arrayEq(r.leftDigits, ['3','4']), 'parseAddress("34.5") left = [3,4]');
  assert(arrayEq(r.rightDigits, ['5']), 'parseAddress("34.5") right = [5]');
  assert(r.hadDot === true, 'parseAddress("34.5") hadDot = true');
}
{
  const r = parseAddress('345');
  assert(arrayEq(r.leftDigits, ['3','4','5']), 'parseAddress("345") left = [3,4,5]');
  assert(arrayEq(r.rightDigits, []), 'parseAddress("345") right = []');
  assert(r.hadDot === false, 'parseAddress("345") hadDot = false');
}
{
  const r = parseAddress('034.5');
  assert(arrayEq(r.leftDigits, ['0','3','4']), 'parseAddress("034.5") preserves leading zeros');
  assert(arrayEq(r.rightDigits, ['5']), 'parseAddress("034.5") right = [5]');
}
{
  const r = parseAddress('');
  assert(arrayEq(r.leftDigits, []), 'parseAddress("") left empty');
  assert(arrayEq(r.rightDigits, []), 'parseAddress("") right empty');
  assert(r.hadDot === false, 'parseAddress("") hadDot false');
}
{
  // Number forms
  const rInt = parseAddress(345);
  assert(arrayEq(rInt.leftDigits, ['3','4','5']), 'parseAddress(345 as int) left = [3,4,5]');
  assert(rInt.hadDot === false, 'parseAddress(345 as int) hadDot = false');

  const rFloat = parseAddress(34.5);
  assert(arrayEq(rFloat.leftDigits, ['3','4']), 'parseAddress(34.5 as float) left = [3,4]');
  assert(arrayEq(rFloat.rightDigits, ['5']), 'parseAddress(34.5 as float) right = [5]');
  assert(rFloat.hadDot === true, 'parseAddress(34.5 as float) hadDot = true');
}

console.log('=== parseAddress — strict rejection ===');
assertThrows(() => parseAddress('1.2.3'), 'parseAddress("1.2.3") rejects multi-dot', InvalidAddressError);
assertThrows(() => parseAddress('1..2'), 'parseAddress("1..2") rejects multi-dot', InvalidAddressError);
assertThrows(() => parseAddress('a.5'), 'parseAddress("a.5") rejects non-digit', InvalidAddressError);
assertThrows(() => parseAddress('1.x'), 'parseAddress("1.x") rejects non-digit', InvalidAddressError);
assertThrows(() => parseAddress('1-2'), 'parseAddress("1-2") rejects punctuation', InvalidAddressError);

// ── parseSpindle ──

console.log('\n=== parseSpindle — floor-aware padding ===');
{
  // No-dot, total-length pad
  const r = parseSpindle('1', 1);
  assert(arrayEq(r.digits, ['1']), 'parseSpindle("1", 1) = [1]');
}
{
  const r = parseSpindle('1', 3);
  assert(arrayEq(r.digits, ['0','0','1']), 'parseSpindle("1", 3) pads to [0,0,1]');
}
{
  // Dotted, left-pad to floor
  const r = parseSpindle('34.5', 2);
  assert(arrayEq(r.digits, ['3','4','5']), 'parseSpindle("34.5", 2) = [3,4,5] (no pad needed)');
}
{
  const r = parseSpindle('34.5', 3);
  assert(arrayEq(r.digits, ['0','3','4','5']), 'parseSpindle("34.5", 3) pads left to [0,3,4,5]');
}
{
  const r = parseSpindle('34.5', 4);
  assert(arrayEq(r.digits, ['0','0','3','4','5']), 'parseSpindle("34.5", 4) pads left to [0,0,3,4,5]');
}
{
  // Already padded
  const r = parseSpindle('034.5', 3);
  assert(arrayEq(r.digits, ['0','3','4','5']), 'parseSpindle("034.5", 3) = [0,3,4,5]');
}
{
  // Dot-free, equivalent
  const r = parseSpindle('0345', 3);
  assert(arrayEq(r.digits, ['0','3','4','5']), 'parseSpindle("0345", 3) = [0,3,4,5]');
}
{
  // Trailing-zero strip
  const r = parseSpindle('100', 1);
  assert(arrayEq(r.digits, ['1']), 'parseSpindle("100", 1) strips trailing zeros to [1]');
}
{
  const r = parseSpindle('100', 3);
  assert(arrayEq(r.digits, ['1']), 'parseSpindle("100", 3) strips trailing zeros to [1]');
}

console.log('\n=== parseSpindle — strict rejection ===');
assertThrows(
  () => parseSpindle('34.5', 1),
  'parseSpindle("34.5", 1) rejects (left=2 > floor 1)',
  InvalidAddressError,
);
assertThrows(
  () => parseSpindle('1.2.3', 5),
  'parseSpindle("1.2.3", 5) rejects multi-dot',
  InvalidAddressError,
);
assertThrows(
  () => parseSpindle('123.45', 2),
  'parseSpindle("123.45", 2) rejects (left=3 > floor 2)',
  InvalidAddressError,
);

console.log('\n=== parseSpindle — star handling ===');
{
  const r = parseSpindle('5*', 1);
  assert(arrayEq(r.digits, ['5']), 'parseSpindle("5*") digits = [5]');
  assert(r.hasStar === true, 'parseSpindle("5*") hasStar = true');
}
{
  const r = parseSpindle('34.5*', 2);
  assert(arrayEq(r.digits, ['3','4','5']), 'parseSpindle("34.5*", 2) digits');
  assert(r.hasStar === true, 'parseSpindle("34.5*", 2) hasStar');
}
{
  const r = parseSpindle('*', 1);
  assert(arrayEq(r.digits, []), 'parseSpindle("*") digits empty');
  assert(r.hasStar === true, 'parseSpindle("*") hasStar');
}
{
  const r = parseSpindle('', 1);
  assert(arrayEq(r.digits, []), 'parseSpindle("") empty');
  assert(r.hasStar === false, 'parseSpindle("") no star');
}
{
  const r = parseSpindle(null, 1);
  assert(arrayEq(r.digits, []), 'parseSpindle(null) empty');
}

console.log('\n=== parseSpindle — floor 0 lenient (new blocks) ===');
{
  // Floor 0 means no underscore chain — strict check skipped, no padding.
  const r = parseSpindle('34.5', 0);
  assert(arrayEq(r.digits, ['3','4','5']), 'parseSpindle("34.5", 0) lenient walk');
}
{
  const r = parseSpindle('1.23', 0);
  assert(arrayEq(r.digits, ['1','2','3']), 'parseSpindle("1.23", 0) lenient walk');
}

// ── formatAddress ──

console.log('\n=== formatAddress — canonical emit ===');
{
  // Floor 1 cases
  assert(formatAddress(['1'], 1) === '1', 'formatAddress([1], 1) = "1"');
  assert(formatAddress(['1','2','3'], 1) === '1.23', 'formatAddress([1,2,3], 1) = "1.23"');
  assert(formatAddress(['1','0','0'], 1) === '1', 'formatAddress([1,0,0], 1) = "1" (trailing strip)');
}
{
  // Floor 2 cases
  assert(formatAddress(['1','2'], 2) === '12', 'formatAddress([1,2], 2) = "12"');
  assert(formatAddress(['3','4','5'], 2) === '34.5', 'formatAddress([3,4,5], 2) = "34.5"');
  assert(formatAddress(['0','1'], 2) === '1', 'formatAddress([0,1], 2) = "1" (leading-zero strip)');
}
{
  // Floor 3 cases
  assert(formatAddress(['0','3','4','5'], 3) === '34.5', 'formatAddress([0,3,4,5], 3) = "34.5"');
  assert(formatAddress(['0','0','3','4','5'], 4) === '34.5', 'formatAddress([0,0,3,4,5], 4) = "34.5"');
  assert(formatAddress(['0','0','1'], 3) === '1', 'formatAddress([0,0,1], 3) = "1"');
}
{
  // Edge cases
  assert(formatAddress([], 1) === '', 'formatAddress([], 1) = ""');
  assert(formatAddress(['0'], 1) === '0', 'formatAddress([0], 1) = "0"');
}

// ── Round-trip property ──

console.log('\n=== Round-trip: parseSpindle(formatAddress(d, fl), fl) preserves d ===');
{
  // Critical cases — these are the "address survives floor growth" guarantees
  const cases: Array<{ digits: string[]; floor: number; label: string }> = [
    { digits: ['3','4','5'],         floor: 2, label: 'leaf at floor 2' },
    { digits: ['0','3','4','5'],     floor: 3, label: 'leaf at floor 3 (one growth)' },
    { digits: ['0','0','3','4','5'], floor: 4, label: 'leaf at floor 4 (two growths)' },
    { digits: ['1','2','3'],         floor: 1, label: 'depth 3 at floor 1' },
    { digits: ['0','1','2','3'],     floor: 2, label: 'depth 4 at floor 2' },
    { digits: ['1'],                 floor: 1, label: 'single digit floor 1' },
    { digits: ['0','0','1'],         floor: 3, label: 'underscore-chain walk floor 3' },
  ];
  for (const c of cases) {
    const emitted = formatAddress(c.digits, c.floor);
    const reparsed = parseSpindle(emitted, c.floor);
    assert(
      arrayEq(reparsed.digits, c.digits),
      `round-trip ${c.label}: ${JSON.stringify(c.digits)} -> "${emitted}" -> ${JSON.stringify(reparsed.digits)}`,
    );
  }
}

// ── Floor-growth: the user's specific case ──

console.log('\n=== Floor-growth: "34.5" across floors 2 / 3 / 4 ===');

const blockF2 = {
  _: { _: 'F2 floor text' },
  '3': { '4': { '5': 'leaf at 34.5' } },
};
const blockF3 = {
  _: {
    _: { _: 'F3 floor text' },
    '3': { '4': { '5': 'leaf at 34.5' } },
  },
};
const blockF4 = {
  _: {
    _: {
      _: { _: 'F4 floor text' },
      '3': { '4': { '5': 'leaf at 34.5' } },
    },
  },
};

assert(floorDepth(blockF2) === 2, 'blockF2 has floor 2');
assert(floorDepth(blockF3) === 3, 'blockF3 has floor 3');
assert(floorDepth(blockF4) === 4, 'blockF4 has floor 4');

// At each floor, the address "34.5" must locate the same leaf (after auto-pad).
for (const [block, floor, label] of [
  [blockF2, 2, 'F2'],
  [blockF3, 3, 'F3'],
  [blockF4, 4, 'F4'],
] as const) {
  const r = bspRead(block as any, '34.5', null);
  assert(r.shape === 'point', `bspRead(${label}, "34.5") shape=point`);
  assert(r.point === 'leaf at 34.5', `bspRead(${label}, "34.5") finds leaf (auto-padded)`);
}

// Equivalent forms also work
assert(bspRead(blockF3, '034.5', null).point === 'leaf at 34.5', 'bspRead(F3, "034.5") finds leaf');
assert(bspRead(blockF3, '0345', null).point === 'leaf at 34.5', 'bspRead(F3, "0345") finds leaf');
assert(bspRead(blockF4, '0034.5', null).point === 'leaf at 34.5', 'bspRead(F4, "0034.5") finds leaf');
assert(bspRead(blockF4, '00345', null).point === 'leaf at 34.5', 'bspRead(F4, "00345") finds leaf');

// At floor 1, "34.5" is malformed (left=2 > floor 1) — strict reject.
const blockF1 = { _: 'F1 root', '3': { '4': { '5': 'F1 leaf' } } };
assert(floorDepth(blockF1) === 1, 'blockF1 has floor 1');
assertThrows(
  () => bspRead(blockF1, '34.5', null),
  'bspRead(F1, "34.5") rejects — left=2 > floor 1',
  InvalidAddressError,
);

// But dot-free "345" at floor 1 walks normally (no-dot = digit sequence).
{
  const r = bspRead(blockF1, '345', null);
  assert(r.shape === 'point' && r.point === 'F1 leaf', 'bspRead(F1, "345") finds leaf via digit-sequence');
}

// ── Round-trip via writeAt + readAt ──

console.log('\n=== Round-trip: writeAt then readAt at various floors ===');
{
  const b: any = { _: { _: 'floor', '1': 'one' } };
  assert(floorDepth(b) === 2, 'fresh block has floor 2');
  writeAt(b, '34.5', 'wrote');
  assert(b['3']['4']['5'] === 'wrote', 'writeAt placed leaf at root.3.4.5');
  assert(readAt(b, '34.5') === 'wrote', 'readAt finds it back via "34.5"');

  // Migrate the block to floor 3 (wrap content under one more _) and verify
  // the SAME address locates the leaf via dot-aware padding.
  const grown: any = {
    _: { ...b },  // wrap the floor-2 root under one more _
  };
  // After wrapping, floorDepth should be 3 if the content sat at root._
  assert(floorDepth(grown) === 3, 'grown block has floor 3');
  // The leaf is now at grown._.3.4.5 — accessible via "34.5" auto-pad to "034.5".
  assert(readAt(grown, '34.5') === 'wrote', 'readAt(grown, "34.5") finds leaf via auto-pad');
  assert(readAt(grown, '034.5') === 'wrote', 'readAt(grown, "034.5") finds leaf');
  assert(readAt(grown, '0345') === 'wrote', 'readAt(grown, "0345") finds leaf');
}

// ── Multi-dot rejection at write surface ──

console.log('\n=== Multi-dot rejection at write surface ===');
{
  const b: any = { _: 'root' };
  assertThrows(
    () => writeAt(b, '1.2.3', 'should fail'),
    'writeAt with multi-dot address rejects',
    InvalidAddressError,
  );
  assertThrows(
    () => readAt(b, '1.2.3'),
    'readAt with multi-dot address rejects',
    InvalidAddressError,
  );
}

// ── bsp() legacy API uses parseSpindle internally ──

console.log('\n=== Legacy bsp() at floor 3 with "34.5" walks the auto-padded path ===');
{
  const r = bsp(blockF3, '34.5');
  assert(r.mode === 'spindle', 'legacy bsp() shape');
  // The chain should END at the leaf (last entry).
  if (r.mode === 'spindle') {
    const last = r.nodes[r.nodes.length - 1];
    assert(last.text === 'leaf at 34.5', 'legacy bsp(F3, "34.5") chain ends at leaf');
  }
}

// ── Multi-dot at legacy bsp() ──
console.log('\n=== Legacy bsp() rejects multi-dot ===');
assertThrows(
  () => bsp(blockF1, '1.2.3'),
  'legacy bsp(F1, "1.2.3") rejects multi-dot',
  InvalidAddressError,
);

// ── Disc emit canonical form ──

console.log('\n=== Disc emit — canonical addresses (single dot, floor-anchored) ===');
{
  // Floor-1 sunstone-shaped block with depth-2 disc
  const block: any = {
    _: 'root',
    '1': { _: 'one', '1': 'one-one', '2': 'one-two' },
    '2': { _: 'two', '1': 'two-one' },
  };
  assert(floorDepth(block) === 1, 'block floor 1');
  const r = bspRead(block, '', -1);  // disc at pscale -1
  assert(r.shape === 'disc', 'disc shape');
  // Top-level branches: should be [1], [2] addresses
  const addresses = (r.disc ?? []).map(n => n.address).sort();
  assert(addresses.includes('1'), 'disc includes address "1"');
  assert(addresses.includes('2'), 'disc includes address "2"');
  // None should be multi-dot
  for (const addr of addresses) {
    const dotCount = (addr.match(/\./g) || []).length;
    assert(dotCount <= 1, `disc address "${addr}" has at most 1 dot`);
  }
}
{
  // Floor-2 block — disc addresses should use single-dot canonical form
  const block: any = {
    _: { _: 'floor' },
    '3': { '4': { '5': 'a' } },
    '6': { '7': { '8': 'b' } },
  };
  assert(floorDepth(block) === 2, 'block floor 2');
  const r = bspRead(block, '', -2);  // disc at pscale -2 (depth 3)
  assert(r.shape === 'disc', 'disc shape');
  const addresses = (r.disc ?? []).map(n => n.address);
  // Should include "34.5" and "67.8" at floor 2
  assert(addresses.includes('34.5'), `disc includes "34.5" (floor-2 canonical), got ${JSON.stringify(addresses)}`);
  assert(addresses.includes('67.8'), `disc includes "67.8" (floor-2 canonical), got ${JSON.stringify(addresses)}`);
  // None should be multi-dot
  for (const addr of addresses) {
    const dotCount = (addr.match(/\./g) || []).length;
    assert(dotCount <= 1, `disc address "${addr}" has at most 1 dot`);
  }
}

// ── End ──

console.log(`\n=== ${pass}/${pass + fail} passed ===`);
if (fail > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
