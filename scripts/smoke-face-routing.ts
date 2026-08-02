/**
 * Live smoke for face routing — "the face picks the block, at= picks the position".
 *
 * A pool standing over a tree family is the social interface to the whole
 * molecule. This proves the four faces land in four different blocks from one
 * room, and that a pool with NO spine is untouched (parlours and rooms still
 * spool as before).
 *
 * Writes a throwaway family (spine:face-verify + its pool) and cleans up.
 * Run: npx tsx scripts/smoke-face-routing.ts
 */
import { handlePoolEngage } from '../src/tools/pool.js';
import { loadBlock, saveBlock } from '../src/db.js';

const BEACH = process.env.SPOOL_BEACH ?? 'https://beach.happyseaurchin.com';
const V = 'face-verify';
const WHO = 'face-tester';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

async function engage(params: any): Promise<string> {
  const r: any = await handlePoolEngage({ agent_id: WHO, pool_url: BEACH, ...params });
  return r?.content?.[0]?.text ?? '';
}

async function textAt(block: string, spindle: string): Promise<string | null> {
  const row: any = await loadBlock(BEACH, block).catch(() => null);
  if (!row?.block) return null;
  let n: any = row.block;
  for (const d of spindle.replace('.', '')) { if (!n || typeof n !== 'object') return null; n = n[d]; }
  if (typeof n === 'string') return n;
  return n && typeof n === 'object' && typeof n._ === 'string' ? n._ : null;
}

async function wipe(block: string) {
  await fetch(`${BEACH}/.well-known/pscale-beach`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ block, confirm: true }),
  }).catch(() => {});
}

(async () => {
  console.log(`\nface routing — live against ${BEACH}\n`);

  // A tree family: a spine with one card, and a pool mounting an operator.
  await saveBlock(BEACH, `spine:${V}`, {
    _: 'PROBE family for face routing. Delete after.',
    1: { _: 'The one stem.', 1: 'The one card.' },
  } as any, { spindle: '' });
  await engage({ pool_name: V, purpose: `function:${V}` });

  console.log('the four faces, one room, four blocks:');
  const c = await engage({ pool_name: V, face: 'character', at: '1.1', contribution: 'DONE 2026-08-02 — character mark' });
  assert(/→ face-verify:face-tester at 11\b/.test(c), 'character → the mirror');
  assert((await textAt(`${V}:${WHO}`, '11')) === 'DONE 2026-08-02 — character mark', '  …and the mark is at 1.1 of the mirror');

  const a = await engage({ pool_name: V, face: 'author', at: '1.2', contribution: 'A second card, written from the room.' });
  assert(/→ spine:face-verify at 12\b/.test(a), 'author → the spine');
  assert((await textAt(`spine:${V}`, '12')) === 'A second card, written from the room.', '  …and the new card stands at 1.2');

  const d = await engage({ pool_name: V, face: 'designer', at: '3', contribution: 'access: latched' });
  assert(/→ function:face-verify at 3/.test(d), 'designer → the operator the pool mounts');
  assert((await textAt(`function:${V}`, '3')) === 'access: latched', '  …and the setting stands at 3 of the operator');

  const o = await engage({ pool_name: V, face: 'observer', at: '1', contribution: `fold ${V}` });
  assert(/→ view:face-verify at 1/.test(o), 'observer → the page');
  assert((await textAt(`view:${V}`, '1')) === `fold ${V}`, '  …and the lens stands at 1 of the view');

  console.log('\nthe guards:');
  const noAt = await engage({ pool_name: V, face: 'author', contribution: 'nowhere' });
  assert(/lands AT AN ADDRESS/.test(noAt), 'a faced commit with no at= is refused, and says which block it would have hit');

  const spool = await engage({ pool_name: V, contribution: 'no face — still a spool commit' });
  assert(/slot \d+ → the pool/.test(spool), 'no face → the spool, unchanged');

  const forced = await engage({ pool_name: V, face: 'author', destination: 'pool', contribution: 'explicit destination wins' });
  assert(!/→ spine:/.test(forced), "destination='pool' overrides the face");

  console.log('\na pool with no spine is untouched:');
  const bare = await engage({ pool_name: 'face-verify-nospine', purpose: 'a room, not a family', face: 'character', at: '1', contribution: 'hello room' });
  assert(/slot \d+ → the pool/.test(bare), 'no spine → commit spools as before (parlours, rooms, chat)');

  if (process.env.DEBUG) {
    for (const b of [`${V}:${WHO}`, `spine:${V}`, `function:${V}`, `view:${V}`]) {
      const row: any = await loadBlock(BEACH, b).catch(() => null);
      console.log(`\n--- ${b} ---\n${JSON.stringify(row?.block, null, 1)}`);
    }
    console.log(`\n--- spool ack ---\n${spool}\n--- no-spine ack ---\n${bare}`);
  }

  for (const b of [`spine:${V}`, `pool:${V}`, `liquid:pool:${V}`, `${V}:${WHO}`, `view:${V}`,
                   `function:${V}`, 'pool:face-verify-nospine', 'liquid:pool:face-verify-nospine']) await wipe(b);

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
