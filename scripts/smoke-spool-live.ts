/**
 * Live smoke for the spool/frame/destination split (Phase 0) against a real beach.
 *
 * Exercises the network path of pscale_pool_engage end-to-end:
 *   submit (liquid mirror) → overwrite-my-slot → commit (atomic append) →
 *   destination routing (pool vs solid:<name>) → routing isolation → withdraw.
 * The pure-helper logic is covered by smoke:pool-engage (no network); THIS proves
 * the handler talks to the deployed beach correctly.
 *
 * Writes to a throwaway pool:spool-verify on the configured beach and cleans up at
 * both ends (DELETE). Run: npm run smoke:spool-live
 * Beach via SPOOL_BEACH env (default https://beach.happyseaurchin.com).
 */
import { handlePoolEngage } from '../src/tools/pool.js';
import { loadBlock } from '../src/db.js';

const BEACH = process.env.SPOOL_BEACH ?? 'https://beach.happyseaurchin.com';
const POOL = 'spool-verify';
const A = 'spool-tester-a';
const B = 'spool-tester-b';

let pass = 0;
let fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

async function engage(params: any): Promise<string> {
  const r = await handlePoolEngage(params);
  return r.content[0].text;
}

async function del(block: string): Promise<void> {
  try {
    await fetch(`${BEACH}/.well-known/pscale-beach?block=${encodeURIComponent(block)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    });
  } catch { /* best-effort */ }
}

async function cleanup(): Promise<void> {
  await del(`pool:${POOL}`);
  await del(`liquid:pool:${POOL}`);
  await del(`solid:${POOL}`);
}

async function main() {
  console.log(`=== spool live smoke @ ${BEACH} (pool:${POOL}) ===\n`);
  await cleanup(); // start fresh so slot assertions are deterministic

  console.log('— create + read —');
  let t = await engage({ agent_id: A, pool_url: BEACH, pool_name: POOL, purpose: 'Throwaway pool for Phase-0 spool verification.' });
  assert(/created: pool authored/.test(t), 'pool created with purpose');

  console.log('\n— submit: A stages a pending intention (liquid) —');
  t = await engage({ agent_id: A, pool_url: BEACH, pool_name: POOL, submit: 'A is thinking about X' });
  assert(/submitted: liquid slot 1/.test(t), 'A submit → liquid slot 1');
  assert(/# Liquid — pending/.test(t), 'envelope carries the liquid mirror');
  assert(/A is thinking about X/.test(t) && /\(you\)/.test(t), 'A sees its own pending slot, marked (you)');
  assert(/# Contributions since position 0 \(count: 0\)/.test(t), 'pool still empty (submit did NOT append to pool)');

  console.log('\n— submit: B stages — the social mirror now shows BOTH —');
  t = await engage({ agent_id: B, pool_url: BEACH, pool_name: POOL, submit: 'B leans toward Y' });
  assert(/\(2 authors\)/.test(t), 'mirror shows 2 authors after B submits');
  assert(/A is thinking about X/.test(t) && /B leans toward Y/.test(t), 'B sees A and B pending (the mirror)');

  console.log('\n— submit overwrite: A changes mind — same slot, no new author —');
  t = await engage({ agent_id: A, pool_url: BEACH, pool_name: POOL, submit: 'A changed mind to Z' });
  assert(/submitted: liquid slot 1/.test(t), 'A re-submit → SAME slot 1 (overwrite, one slot per author)');
  assert(/\(2 authors\)/.test(t), 'still 2 authors (no new slot allocated)');
  assert(/A changed mind to Z/.test(t) && !/A is thinking about X/.test(t), "A's old text overwritten");

  console.log('\n— commit: A → the pool (default destination), decoupled from liquid —');
  t = await engage({ agent_id: A, pool_url: BEACH, pool_name: POOL, contribution: 'A commits: do Z', with_liquid: true });
  assert(/committed: slot 1 → the pool/.test(t), 'commit → pool slot 1');
  assert(/A commits: do Z/.test(t), 'committed text appears in the pool slice');
  assert(/A changed mind to Z/.test(t), 'liquid NOT cleared by commit (decoupled — A still pending)');

  console.log('\n— commit: A → solid:<name> (objective dial), pool slice unchanged —');
  t = await engage({ agent_id: A, pool_url: BEACH, pool_name: POOL, contribution: 'the agreed minute', destination: `solid:${POOL}` });
  assert(new RegExp(`committed: slot 1 → solid:${POOL}`).test(t), 'commit → solid destination');
  assert(/# Contributions since position 0 \(count: 1\)/.test(t), 'pool slice unchanged by the solid commit (count 1)');

  console.log('\n— read-back: routing isolation (the two commits landed in different blocks) —');
  const poolRow = await loadBlock(BEACH, `pool:${POOL}`);
  const solidRow = await loadBlock(BEACH, `solid:${POOL}`);
  const poolStr = JSON.stringify(poolRow?.block ?? {});
  const solidStr = JSON.stringify(solidRow?.block ?? {});
  assert(poolStr.includes('A commits: do Z'), 'pool block holds the pool-committed entry');
  assert(!poolStr.includes('the agreed minute'), 'pool block does NOT hold the solid entry (isolation)');
  assert(solidStr.includes('the agreed minute'), 'solid block holds the solid-committed entry');
  assert(!solidStr.includes('A commits: do Z'), 'solid block does NOT hold the pool entry (isolation)');

  console.log('\n— marker: since_position skips already-seen —');
  t = await engage({ agent_id: A, pool_url: BEACH, pool_name: POOL, since_position: 1 });
  assert(/\(count: 0\)/.test(t) && /nothing new/.test(t), 'since_position=1 → nothing new');

  console.log('\n— withdraw: A clears its liquid slot (empty submit) —');
  t = await engage({ agent_id: A, pool_url: BEACH, pool_name: POOL, submit: '' });
  assert(/withdrawn: liquid slot 1 cleared/.test(t), 'empty submit → withdraw');
  assert(/\(1 author\)/.test(t) && !/A changed mind to Z/.test(t), 'A no longer pending; only B remains in the mirror');

  console.log('\n=== summary ===');
  console.log(`  pass: ${pass}  fail: ${fail}`);
}

main()
  .catch((e) => { console.error('FATAL', e); fail++; })
  .finally(async () => {
    await cleanup();
    console.log('  (cleaned up throwaway blocks)');
    process.exit(fail > 0 ? 1 : 0);
  });
