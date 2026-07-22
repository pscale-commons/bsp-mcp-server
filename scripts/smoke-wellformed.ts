/**
 * smoke-wellformed.ts — exercises the mechanical half of the well-formed battery
 * (pscale://well-formed:1) and dogfoods the sentinel against its own rules.
 *
 * Runs the ported validateShape over positive and negative cases mirroring the
 * battery's 1.1 (spine keys) and 1.2 (no stringified subtrees), then confirms the
 * well-formed sentinel itself is well-formed — the block passing its own gate.
 */
import { validateShape } from './lint-block.js';
import { loadBlock } from '../src/db.js';

(async () => {
  let pass = 0;
  let fail = 0;
  function check(name: string, got: string | null, wantErr: boolean): void {
    const ok = wantErr ? got !== null : got === null;
    console.log(`${ok ? '✓' : '✗'} ${name}${got ? ` — ${got.slice(0, 90)}` : ''}`);
    ok ? pass++ : fail++;
  }

  console.log('--- positives (should be clean) ---');
  check('1.1.4 spine: _ and contiguous digits', validateShape({ _: 'x', 1: 'a', 2: { _: 'b', 1: 'c' } }), false);
  check('1.2 leaf array is permitted', validateShape({ _: 'x', 1: ['a', 'b'] }), false);
  check('1.2.3 prose opening with a brace but not JSON', validateShape({ _: '{not really json — just prose that opens with a brace' }), false);

  console.log('\n--- negatives (should error) ---');
  check('1.1.1 _word sibling key', validateShape({ _: 'x', _synthesis: 'ghost' }), true);
  check('1.1.2 literal zero key', validateShape({ _: 'x', 0: 'no' }), true);
  check('1.1.3 compound key 11', validateShape({ _: 'x', 11: 'no' }), true);
  check('1.2.1 stringified object', validateShape({ _: 'x', 1: '{"a":1}' }), true);
  check('1.2 stringified array', validateShape({ _: 'x', 1: '[1,2,3]' }), true);
  check('1.1 nested violation carries a path', validateShape({ _: 'x', 1: { _: 'y', _bad: 'z' } }), true);

  console.log('\n--- dogfood: the sentinel passes its own mechanical half ---');
  const r = await loadBlock('pscale', 'well-formed');
  console.log('sentinel registered:', !!r);
  check('well-formed sentinel is itself well-formed', validateShape(r?.block), false);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
