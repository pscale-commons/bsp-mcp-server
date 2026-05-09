/**
 * One-off probe: empirically verify the dot-anchor behavior of the current
 * bsp-mcp parser. Writes nothing, modifies nothing — pure trace.
 *
 * The user's claim (sunstone:1.5 reading): the decimal point is anchored to
 * the FLOOR. When a block grows in floor depth, an old address like "34.5"
 * (left-of-decimal = 2, originally floor 2) must pad LEFT-OF-DECIMAL to the
 * new floor width — at floor 3, "34.5" → "034.5" / "0345" walking
 * ['_', '3', '4', '5'].
 *
 * This probe traces what the CURRENT parser actually does on these inputs,
 * so we can compare against the user's intent before changing anything.
 */
import { floorDepth, parseAddress, bsp } from '../src/bsp.js';
import { parseSpindle, bspRead } from '../src/bsp-fn.js';

function trace(label: string, fn: () => any) {
  console.log(`\n--- ${label} ---`);
  try { console.log(fn()); } catch (e: any) { console.log('THREW:', e?.message ?? e); }
}

// ── parseAddress (raw, no floor-pad) ──
trace('parseAddress("34.5")', () => parseAddress('34.5'));
trace('parseAddress("034.5")', () => parseAddress('034.5'));
trace('parseAddress("0345")', () => parseAddress('0345'));
trace('parseAddress("3.45")', () => parseAddress('3.45'));
trace('parseAddress("345")', () => parseAddress('345'));

// ── parseSpindle (with floor-pad) ──
trace('parseSpindle("34.5", floor=1)', () => parseSpindle('34.5', 1));
trace('parseSpindle("34.5", floor=2)', () => parseSpindle('34.5', 2));
trace('parseSpindle("34.5", floor=3)', () => parseSpindle('34.5', 3));
trace('parseSpindle("34.5", floor=4)', () => parseSpindle('34.5', 4));
trace('parseSpindle("034.5", floor=3)', () => parseSpindle('034.5', 3));
trace('parseSpindle("0345", floor=3)', () => parseSpindle('0345', 3));
trace('parseSpindle("3.45", floor=3)', () => parseSpindle('3.45', 3));

// ── End-to-end with synthetic blocks ──
//
// floor-2 block: { _: { _: 'F2 floor text' }, '3': { '4': { '5': 'leaf at 34.5' } } }
// floor-3 block (after growth): { _: { _: { _: 'F3 floor text' }, '3': { '4': { '5': 'leaf migrated' } } } }
//
// Per user's claim: at the floor-3 block, address "34.5" should still address
// the migrated content (semantically the same node, now under one more `_`).

const blockF2 = {
  _: { _: 'F2 floor text' },
  '3': { '4': { '5': 'leaf at 34.5 (F2)' } },
};

const blockF3_growth = {
  _: {
    _: { _: 'F3 floor text' },
    '3': { '4': { '5': 'leaf at 34.5 (F3 — content migrated under added _)' } },
  },
};

console.log('\n=== FLOOR DEPTHS ===');
console.log('blockF2 floor:', floorDepth(blockF2));
console.log('blockF3_growth floor:', floorDepth(blockF3_growth));

console.log('\n=== blockF2: read at "34.5" ===');
console.log(JSON.stringify(bspRead(blockF2, '34.5', null), null, 2));

console.log('\n=== blockF3_growth: read at "34.5" (current parser) ===');
console.log(JSON.stringify(bspRead(blockF3_growth, '34.5', null), null, 2));

console.log('\n=== blockF3_growth: read at "034.5" ===');
console.log(JSON.stringify(bspRead(blockF3_growth, '034.5', null), null, 2));

console.log('\n=== blockF3_growth: read at "0345" ===');
console.log(JSON.stringify(bspRead(blockF3_growth, '0345', null), null, 2));

// Also probe the legacy bsp() (used in scripts/probe-floors.ts)
console.log('\n=== blockF3_growth via legacy bsp("34.5") ===');
console.log(JSON.stringify(bsp(blockF3_growth, '34.5'), null, 2));

console.log('\n=== blockF3_growth via legacy bsp("034.5") ===');
console.log(JSON.stringify(bsp(blockF3_growth, '034.5'), null, 2));
