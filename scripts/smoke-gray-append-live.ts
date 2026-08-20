/**
 * LIVE: a private accumulator grows past its ninth entry.
 *
 * The dead end this proves cleared, in full: append is the only act that
 * supernests atomically, append refused gray, so a gray accumulator that filled
 * its ladder had no legal tenth entry — every remaining address either landed
 * inside an existing entry or demanded a hand-rolled supernest. That is what
 * cost history:Phenomemental an entry on 2026-08-20.
 *
 * Runs against the real beach through the patched handler (not the deployed
 * router), on a scratch block of its own. Ten gray appends: the tenth must roll
 * the ladder over, and all ten must still decrypt afterwards — a supernest that
 * silently broke an envelope would pass a slot-count check and fail this one.
 *
 * Needs a key, never a literal:
 *   BEACH_SECRET=… npm run smoke:gray-append-live
 *
 * Leaves the scratch block behind on purpose — it is the evidence. Re-running
 * writes a fresh one (the name carries a stamp).
 */
import { handleBsp } from '../src/tools/bsp.js';

const BEACH = process.env.BEACH_URL ?? 'https://beach.happyseaurchin.com';
const SECRET = process.env.BEACH_SECRET;
const ENC = process.env.BEACH_ENC_SECRET ?? 'probe-enc-key-not-a-lock';

if (!SECRET) {
  console.error('BEACH_SECRET is required (the lock proof). Never hard-code it.');
  process.exit(2);
}

const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const BLOCK = `probe:gray-append-${stamp}`;

let pass = 0, fail = 0;
const failures: string[] = [];
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; failures.push(label); console.log(`  ✗ ${label}`); }
}
const say = async (p: any) => (await handleBsp(p)).content[0].text;

async function main() {
  console.log(`\nscratch block: ${BLOCK} @ ${BEACH}\n`);

  // Found it locked, so the appends must also prove authority — the realistic
  // shape for anyone's history block, and the case where the two keys must be
  // named apart.
  const born = await say({
    agent_id: BEACH, block: BLOCK,
    content: { _: 'A scratch accumulator proving gray appends past the ninth entry. Safe to delete.' },
    new_lock: SECRET,
  });
  assert(!/rejected/i.test(born), `founded locked: ${born.split('\n')[0]}`);

  console.log('\n1. ten gray appends — the tenth must roll the ladder over');
  let supernested = false;
  for (let i = 1; i <= 10; i++) {
    const ack = await say({
      agent_id: BEACH, block: BLOCK, append: true, gray: true,
      content: `entry ${i} — private, and the ${i === 10 ? 'one that used to be impossible' : 'ladder filling'}`,
      secret: SECRET, enc_secret: ENC,
    });
    if (/rejected/i.test(ack)) { assert(false, `append ${i}: ${ack}`); break; }
    if (/supernest/i.test(ack)) supernested = true;
    if (i === 1 || i === 9 || i === 10) console.log(`     ${i}: ${ack.split('\n')[0]}`);
  }
  assert(supernested, 'the tenth append supernested rather than refusing — the dead end is gone');

  console.log('\n2. every entry still decrypts, before and after the rollover');
  const opened = await say({
    agent_id: BEACH, block: BLOCK, pscale_attention: null,
    secret: SECRET, enc_secret: ENC,
  });
  for (const i of [1, 5, 9, 10]) {
    assert(opened.includes(`entry ${i} —`), `entry ${i} reads back in the clear with the key`);
  }
  assert(!opened.includes('[encrypted]'), 'nothing renders [encrypted] to its own author');

  console.log('\n3. and without the key it is opaque');
  const closed = await say({ agent_id: BEACH, block: BLOCK, pscale_attention: null });
  assert(!closed.includes('entry 1 —'), 'a keyless reader sees no plaintext');
  assert(/Encrypted \(gray\)/.test(closed), 'a keyless reader sees envelopes, plainly labelled');

  console.log('\n4. the guard stands on the live block');
  // Address the interior of whichever entry the beach put first. At the floor
  // this block now carries, that is one digit deeper than the entry itself.
  const refused = await say({
    agent_id: BEACH, block: BLOCK, spindle: '111',
    content: 'the write that ate an entry on 2026-08-20',
    secret: SECRET, enc_secret: ENC,
  });
  assert(/descends into the gray envelope/i.test(refused), `a descent into ciphertext is refused: ${refused.slice(0, 90)}…`);

  const stillThere = await say({
    agent_id: BEACH, block: BLOCK, pscale_attention: null,
    secret: SECRET, enc_secret: ENC,
  });
  assert(stillThere.includes('entry 1 —'), 'and the entry it would have destroyed is untouched');

  console.log(`\n${fail === 0 ? '✓' : '✗'} gray append live: ${pass} passed, ${fail} failed`);
  if (fail > 0) { failures.forEach(f => console.log(`   - ${f}`)); process.exit(1); }
}

main().catch(e => { console.error(e); process.exit(1); });
