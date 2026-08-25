/**
 * Smoke test: numeric and boolean leaves render their JSON value in bsp()
 * read output (and in floor-align's per-pscale index).
 *
 * Regression guard for the 2026-08-25 finding: semantic() returned null for
 * any leaf that was neither string nor object, so JSON numbers on the wire
 * (e.g. evaluation scores at passport 6.2 — the keel audit case) rendered as
 * blank in path-walk/descent/disc/point output and misled the reading agent.
 * The wire itself was never wrong — only the display layer dropped them.
 * Object/underscore semantics are unchanged: an underscore chain still
 * terminates only in a string; null/absent still reads as no content.
 */
import { bspRead, formatRead } from '../src/bsp-fn.js';
import { indexByPscale } from '../src/floor-align.js';

let pass = 0;
let fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

// Floor-1 block mirroring the live shape that surfaced the bug: an evaluation
// node (passport 6.2 convention) whose fields 2 and 3 are JSON numbers, plus a
// boolean leaf and an underscore-only sibling for the regression checks.
const block: any = {
  _: 'smoke block with numeric leaves',
  6: {
    _: 'evaluations',
    2: {
      _: 'evaluation — warn (numeric fields 2 and 3)',
      1: 'warn',
      2: 3,
      3: 3.5,
      4: '2026-08-25T07:03:02.606Z',
      5: true,
      6: { _: 'object child with underscore' },
      7: {},
    },
  },
};

console.log('=== path-walk+descent — numeric fields render, not blank ===');
const desc = bspRead(block, '6.2', -2);
assert(desc.shape === 'path-walk+descent', 'shape is path-walk+descent');
const byAddr = new Map((desc.descent ?? []).map((e) => [e.address, e.content]));
assert(byAddr.get('6.22') === '3', 'integer leaf 6.22 → "3"');
assert(byAddr.get('6.23') === '3.5', 'float leaf 6.23 → "3.5"');
assert(byAddr.get('6.25') === 'true', 'boolean leaf 6.25 → "true"');
assert(byAddr.get('6.21') === 'warn', 'string leaf unchanged');
assert(byAddr.get('6.26') === 'object child with underscore', 'underscore object unchanged');
assert(byAddr.get('6.27') === null, 'empty object still null (no content)');
const descText = formatRead(desc);
assert(descText.includes('[6.22]: 3'), 'formatted descent shows 6.22 value');
assert(descText.includes('[6.23]: 3.5'), 'formatted descent shows 6.23 value');
assert(!/\[6\.22\]:\s*$/m.test(descText), 'no blank line at 6.22');

console.log('\n=== path-walk — numeric terminus renders ===');
const walk = bspRead(block, '6.22', null);
assert(walk.shape === 'path-walk', 'shape is path-walk');
const last = (walk.entries as any[])[(walk.entries as any[]).length - 1];
assert(last.content === '3', 'terminus content is "3"');
assert(formatRead(walk).trim().endsWith('[6.22]: 3'), 'formatted walk ends with the value');

console.log('\n=== point — numeric leaf at attention depth ===');
const pt = bspRead(block, '6.23', -2);
assert(pt.shape === 'point', 'shape is point');
assert(pt.content === '3.5', 'point content is "3.5"');
assert(formatRead(pt).includes('3.5'), 'formatted point shows the value');

console.log('\n=== disc — numeric leaf at target depth ===');
const disc = bspRead(block, '', -2);
assert(disc.shape === 'disc', 'shape is disc');
const discMap = new Map((disc.entries as any[]).map((e) => [e.address, e.content]));
assert(discMap.get('6.22') === '3', 'disc carries the integer leaf');
assert(discMap.get('6.25') === 'true', 'disc carries the boolean leaf');

console.log('\n=== floor-align indexByPscale — numeric leaf has text ===');
const nodes = indexByPscale(block);
const n622 = nodes.find((n) => n.walk === '6,2,2');
const n625 = nodes.find((n) => n.walk === '6,2,5');
assert(n622?.text === '3', 'indexByPscale 6,2,2 → "3"');
assert(n625?.text === 'true', 'indexByPscale 6,2,5 → "true"');

console.log(`\n=== ${pass}/${pass + fail} passed ===`);
process.exit(fail > 0 ? 1 : 0);
