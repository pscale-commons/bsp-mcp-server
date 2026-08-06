/**
 * Live smoke for the liquid BIRTH path — the verified-never-trusted discipline
 * added 2026-08-06 after keel's second-fold run saw a new author's first slip
 * refused twice with no error (provenance at pool:molequle slot 4).
 *
 * Exercises handlePoolEngage against the live probe room pool:probe-birth at
 * the reference beach (residue-deliberate, its purpose says "delete at will"):
 * two FRESH authors each stage a first slip into the live window (two births),
 * then a read-back engage asserts both slips stand in the liquid mirror.
 * Fresh author names per run keep every run a genuine birth.
 *
 * Run: npm run smoke:liquid-birth   (network: reference beach)
 */
import { handlePoolEngage } from '../src/tools/pool.js';

const BEACH = process.env.SMOKE_BEACH ?? 'https://beach.happyseaurchin.com';
const POOL = 'probe-birth';

let pass = 0;
let fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

function textOf(r: { content: Array<{ type: string; text?: string }> }): string {
  return r.content.map(c => c.text ?? '').join('\n');
}

const run = Date.now().toString(36);
const authorA = `probe-a-${run}`;
const authorB = `probe-b-${run}`;

console.log(`=== liquid birth — two fresh authors into ${POOL} @ ${BEACH} (run ${run}) ===`);

const a = await handlePoolEngage({
  agent_id: authorA,
  pool_url: BEACH,
  pool_name: POOL,
  purpose: 'Probe room: liquid-birth smoke — residue deliberate, delete at will.',
  submit: `birth A (${run})`,
});
const aText = textOf(a);
assert(/submitted: liquid slot \S+/.test(aText), 'author A birth reports a staged slot');

const b = await handlePoolEngage({
  agent_id: authorB,
  pool_url: BEACH,
  pool_name: POOL,
  submit: `birth B (${run})`,
});
const bText = textOf(b);
assert(/submitted: liquid slot \S+/.test(bText), 'author B birth reports a staged slot');
assert(bText.includes(authorA), 'author B envelope mirrors author A (both stand)');

const read = await handlePoolEngage({
  agent_id: `probe-reader-${run}`,
  pool_url: BEACH,
  pool_name: POOL,
});
const readText = textOf(read);
assert(readText.includes(authorA), 'read-back: author A slip stands in the mirror');
assert(readText.includes(authorB), 'read-back: author B slip stands in the mirror');
assert(readText.includes(`birth A (${run})`), 'read-back: author A text intact');
assert(readText.includes(`birth B (${run})`), 'read-back: author B text intact');

// Withdrawals: leave the probe room's buffer clean for the next run.
await handlePoolEngage({ agent_id: authorA, pool_url: BEACH, pool_name: POOL, submit: '' });
await handlePoolEngage({ agent_id: authorB, pool_url: BEACH, pool_name: POOL, submit: '' });

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
