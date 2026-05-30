/**
 * smoke-read-gate.ts — regression guard for the federated read-gate fix
 * (contract-drift fix 2026-05-30; see proposals/2026-05-30-wire-read-gate.md).
 *
 * The beach returns a canonical {shape} object ONLY when ?pscale= is present.
 * For a no-pscale GET it returns the RAW NODE at the spindle (readAt), and
 * readAt STRIPS a trailing '*'. Before the fix, the handler's wire fast-path
 * tried to walk that bare node, so:
 *   - a path-walk read (spindle, no pscale) hitting a string leaf → false
 *     "block not found"; hitting an object → double-walk → wrong result;
 *   - a star read → "(no hidden directory)" though the hidden dir is present.
 * The fix gates the wire path to pscale-bearing, non-star reads; path-walk and
 * star reads route to the local whole-block path where bspRead walks them with
 * the canonical walker.
 *
 * Writes one temp block to the live beach and deletes it on exit. Other than
 * that single self-cleaning block it is non-destructive.
 * Run: npm run smoke:read-gate
 */
import { handleBsp } from '../src/tools/bsp.js';

const BEACH = process.env.DEFAULT_BEACH || 'https://beach.happyseaurchin.com';
const NAME = `test:read-gate-${Date.now()}`;
const getText = (r: any) => r?.content?.[0]?.text ?? '';

// floor 1; position 2 carries a hidden directory (underscore-as-object with
// digit children); position 3 is an ordinary sub-block.
const BLOCK = {
  _: 'root semantic floor1',
  1: 'branch one leaf',
  2: { _: { _: 'branch two visible', 1: 'branch two HIDDEN ALPHA', 2: 'branch two HIDDEN BETA' } },
  3: { _: 'branch three visible', 1: 'three-one', 2: 'three-two' },
};

async function deleteBlock(name: string): Promise<void> {
  try {
    await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    });
  } catch { /* best-effort cleanup */ }
}

(async () => {
  let pass = 0, fail = 0;
  function assert(cond: boolean, label: string) {
    if (cond) { pass++; console.log(`  ✓ ${label}`); }
    else { fail++; console.log(`  ✗ ${label}`); }
  }

  try {
    console.log(`=== seed temp block ${NAME} ===`);
    const wrote = await handleBsp({ agent_id: BEACH, block: NAME, spindle: null, pscale_attention: null, content: BLOCK });
    assert(!getText(wrote).includes('rejected'), `write: ${getText(wrote).slice(0, 120)}`);

    console.log('\n=== whole block (no spindle, no pscale) ===');
    const whole = await handleBsp({ agent_id: BEACH, block: NAME, spindle: null, pscale_attention: null });
    assert(getText(whole).includes('root semantic floor1'), `whole: ${getText(whole).slice(0, 120)}`);

    console.log('\n=== path-walk (spindle "1", NO pscale) — previously false "not found" ===');
    const pw = await handleBsp({ agent_id: BEACH, block: NAME, spindle: '1', pscale_attention: null });
    assert(!getText(pw).includes('not found'), 'path-walk does not report not-found');
    assert(getText(pw).includes('branch one leaf'), `path-walk content: ${getText(pw).slice(0, 120)}`);

    console.log('\n=== point (spindle "1" + pscale 0) — wire path, must still work ===');
    const pt = await handleBsp({ agent_id: BEACH, block: NAME, spindle: '1', pscale_attention: 0 });
    assert(getText(pt).includes('branch one leaf'), `point content: ${getText(pt).slice(0, 120)}`);

    console.log('\n=== disc (no spindle + pscale 0) — wire path, must still work ===');
    const disc = await handleBsp({ agent_id: BEACH, block: NAME, spindle: null, pscale_attention: 0 });
    assert(getText(disc).includes('branch one leaf'), `disc content: ${getText(disc).slice(0, 160)}`);

    console.log('\n=== star (spindle "2*") — previously "(no hidden directory)" ===');
    const star = await handleBsp({ agent_id: BEACH, block: NAME, spindle: '2*', pscale_attention: null });
    assert(!getText(star).includes('no hidden directory'), 'star finds a hidden directory');
    assert(getText(star).includes('HIDDEN ALPHA') && getText(star).includes('HIDDEN BETA'),
      `star content: ${getText(star).slice(0, 200)}`);
  } finally {
    await deleteBlock(NAME);
    console.log(`\n(cleaned up ${NAME})`);
  }

  console.log(`\n=== ${pass}/${pass + fail} passed ===`);
  process.exit(fail > 0 ? 1 : 0);
})();
