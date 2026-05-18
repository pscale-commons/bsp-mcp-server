/**
 * smoke-wire-bsp.ts — verify the wire-level read path in tools/bsp.ts.
 *
 * The handler routes federated reads (URL agent_id, no `secret`) through
 * `loadBspShape`, which sends `?spindle=&pscale=` to the beach and accepts
 * either a shape-tagged response (canonical v2 beach) or a raw block
 * (legacy beach, walked locally). Sentinel reads and gray-decryption reads
 * stay on the local `loadBlock` + `bspRead` path.
 *
 * Hits the live beach at beach.happyseaurchin.com — read-only, no writes.
 * Run: npm run smoke:wire-bsp
 */
import { handleBsp } from '../src/tools/bsp.js';

(async () => {
  let pass = 0, fail = 0;
  function assert(cond: boolean, label: string) {
    if (cond) { pass++; console.log(`  ✓ ${label}`); }
    else { fail++; console.log(`  ✗ ${label}`); }
  }
  const getText = (r: any) => r?.content?.[0]?.text ?? '';

  console.log('=== Sentinel read (whetstone) — must use local path ===');
  const sent = await handleBsp({ agent_id: 'pscale', block: 'whetstone', spindle: '1', pscale_attention: null });
  assert(getText(sent).includes('path-walk') && getText(sent).includes('Signature'),
    `whetstone:1 underscore returned: ${getText(sent).slice(0, 150)}...`);

  console.log('\n=== Sentinel read (bsp-test) — must use local path ===');
  const tsent = await handleBsp({ agent_id: 'pscale', block: 'bsp-test', spindle: '', pscale_attention: 0 });
  assert(getText(tsent).includes('disc') && getText(tsent).includes('BSP-TEST'),
    `bsp-test disc returned ${getText(tsent).split('\n').length} lines`);

  console.log('\n=== Federated read (live happyseaurchin tide block) — exercises wire-level path ===');
  const fed = await handleBsp({
    agent_id: 'https://beach.happyseaurchin.com',
    block: 'tide',
    spindle: '',
    pscale_attention: null,
  });
  assert(getText(fed).length > 0 && !getText(fed).includes('rejected'),
    `tide read returned: ${getText(fed).slice(0, 200)}...`);

  console.log('\n=== Federated read with multi-dot (should reject at parser) ===');
  const bad = await handleBsp({
    agent_id: 'https://beach.happyseaurchin.com',
    block: 'tide',
    spindle: '1.2.3',
    pscale_attention: null,
  });
  assert(getText(bad).includes('rejected') || getText(bad).includes('Read rejected') || getText(bad).includes('decimal'),
    `multi-dot returned: ${getText(bad).slice(0, 200)}`);

  console.log('\n=== Federated read of non-existent block ===');
  const miss = await handleBsp({
    agent_id: 'https://beach.happyseaurchin.com',
    block: 'this-block-does-not-exist-' + Date.now(),
    spindle: '',
    pscale_attention: null,
  });
  assert(getText(miss).includes('not found') || getText(miss).includes('No beach'),
    `missing block returned: ${getText(miss).slice(0, 200)}`);

  console.log(`\n=== ${pass}/${pass + fail} passed ===`);
  process.exit(fail > 0 ? 1 : 0);
})();
