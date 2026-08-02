/**
 * smoke-gray-locked.ts — LOCKED + GRAY end to end against the live beach.
 *
 * The private-notes case: only I write (a lock), only I read (gray). It was
 * impossible — a gray write to a locked position always came back `secret
 * required`, because the write path withheld `secret` from the beach on any
 * self-gray write, on the assumption that `secret` doubles as the encryption
 * key. That assumption holds only when no distinct `enc_secret` was supplied.
 *
 * Neither the deterministic suite (smoke:gray, no network) nor smoke:gray-live
 * (unlocked blocks) covered the combination, which is how it survived.
 *
 * Side-effecting + network — run deliberately. Run: npm run smoke:gray-locked
 */

import { handleBsp } from '../src/tools/bsp.js';

const HOST = 'https://beach.happyseaurchin.com';
const STAMP = Date.now();
const BLOCK = `bsp-gray-locked-smoke-${STAMP}`;
const LOCK = `lock-${STAMP}`;          // write-authority
const ENC = `enc-${STAMP}`;            // reading key — deliberately DIFFERENT
const PLAIN = 'the private note only its author may read';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}
const text = (r: any): string => r?.content?.[0]?.text ?? '';

async function wipe(): Promise<boolean> {
  const url = `${HOST}/.well-known/pscale-beach?block=${encodeURIComponent(BLOCK)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm: true, secret: LOCK }),
    signal: AbortSignal.timeout(8000),
  });
  return res.ok;
}

async function main() {
  console.log(`\nLOCKED + GRAY — live at ${HOST}, block ${BLOCK}\n`);

  // 1. Create the block LOCKED. new_lock with NO spindle seals the whole
  //    subtree by inheritance; sent alongside a spindle it would seal only
  //    that first digit and leave the rest homesteadable.
  const created = await handleBsp({
    agent_id: HOST, block: BLOCK,
    content: { _: 'private notes', 1: '(empty)' },
    new_lock: LOCK,
  });
  assert(!/rejected/i.test(text(created)), 'block created locked');

  // 2. THE BUG: gray write to a locked position, distinct enc_secret. Before
  //    the fix this returned `secret required` however faithfully secret was
  //    passed, because secret never reached the beach.
  const wrote = await handleBsp({
    agent_id: HOST, block: BLOCK, spindle: '1',
    content: PLAIN,
    secret: LOCK, enc_secret: ENC, gray: true,
  });
  assert(!/rejected/i.test(text(wrote)), 'gray write ACCEPTED at a locked position');

  // 3. The lock still holds — write-authority was not weakened by forwarding.
  const intruder = await handleBsp({
    agent_id: HOST, block: BLOCK, spindle: '1',
    content: 'vandalism', secret: 'wrong-key',
  });
  assert(/rejected/i.test(text(intruder)), 'a wrong secret is still refused');

  // 4. Read with no key — ciphertext, not plaintext.
  const blind = await handleBsp({ agent_id: HOST, block: BLOCK, spindle: '1' });
  assert(!blind || !text(blind).includes(PLAIN), 'keyless read does NOT reveal the note');

  // 5. The lock secret alone must NOT decrypt — that is the whole point of a
  //    separate enc_secret: the beach holds the lock and still cannot read.
  const lockOnly = await handleBsp({ agent_id: HOST, block: BLOCK, spindle: '1', secret: LOCK });
  assert(!text(lockOnly).includes(PLAIN), 'the LOCK secret alone does not decrypt');

  // 6. The encryption key reads it back.
  const mine = await handleBsp({ agent_id: HOST, block: BLOCK, spindle: '1', enc_secret: ENC });
  assert(text(mine).includes(PLAIN), 'enc_secret reads the plaintext back');

  console.log(`\n${pass} passed, ${fail} failed`);
  const wiped = await wipe();
  console.log(wiped ? 'cleaned up' : `NOT cleaned up — remove ${BLOCK} by hand`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
