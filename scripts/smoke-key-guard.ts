/**
 * smoke-key-guard.ts — the key guard battery (whetstone 9;
 * proposals/2026-10-24-security-in-the-core.md).
 *
 * On 2026-10-24 keys were found standing in plain text in public blocks,
 * written there mostly by the sessions that had just used them. The router
 * now refuses any payload that carries, as a whole word, a key the same call
 * presents (secret, new_lock, a settle or grain passphrase), before anything
 * is sent. It reads the payload as it leaves for the beach, so a sealed (gray)
 * write passes, and it never repeats the key in its refusal.
 *
 * Every key below is made up for this battery; none latches anything.
 *
 * Run: npm run smoke:key-guard
 */

import { refuseKeyInPayload, guardStore } from '../src/db.js';
import { selfEncrypt } from '../src/keys.js';
import { memStore, toPNode, type PMap } from '../src/genus.js';
import { handleGenus } from '../src/tools/genus.js';

let failures = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}`);
    failures++;
  }
}

/** The refusal message, or null when the payload passes. */
function verdict(payload: unknown, keys: Array<string | null | undefined>): string | null {
  try {
    refuseKeyInPayload(payload, keys);
    return null;
  } catch (e: any) {
    return String(e?.message ?? e);
  }
}

const KEY = 'tidepool-lantern-417';

console.log('passes');
assert(verdict('a plain note', []) === null, 'no keys presented');
assert(verdict('a plain note', [undefined, null, '']) === null, 'absent and empty keys');
assert(verdict(undefined, [KEY]) === null, 'no payload (a lock-only save)');
assert(verdict('wrote with the shared project lock, kept in vault:weft', [KEY]) === null, 'a pointer to a key, not its value');
assert(verdict('shell 42 taken', ['shell']) === null, 'a key under six characters is not checked');
assert(verdict('tidepool-lantern-4170 is a different word', [KEY]) === null, 'the key inside a longer word');
assert(verdict({ _: 'a block', 1: { _: 'a branch', 2: 'a leaf' } }, [KEY]) === null, 'a nested block without the key');
assert(verdict('TIDEPOOL-LANTERN-417', [KEY]) === null, 'case differs, so not the key');

console.log('refuses');
assert(verdict(`latched with ${KEY}.`, [KEY]) !== null, 'the secret in a sentence');
assert(verdict(KEY, [KEY]) !== null, 'the secret as the whole text');
assert(verdict({ _: 'history', 3: { _: 'an entry', 1: `key: ${KEY}` } }, [KEY]) !== null, 'the secret at a deep leaf');
assert(verdict({ _: `rotated to ${KEY}` }, [undefined, KEY]) !== null, 'the new_lock in the text');
assert(verdict({ declaration: `I am here (passphrase ${KEY})`, shell_ref: undefined }, [KEY]) !== null, 'a settle declaration');
assert(verdict({ description: 'a grain', my_side_content: `${KEY}` }, [KEY]) !== null, 'a grain side');
const phrase = 'quiet harbour paper kite';
assert(verdict(`the words were ${phrase}, said once`, [phrase]) !== null, 'a passphrase of several words');
const special = 'a.b*c+(d)?[e]';
assert(verdict(`key ${special} here`, [special]) !== null, 'a key with regex characters, matched literally');
assert(verdict('key aXbXc+(d)?[e] here', [special]) === null, 'and those characters are not wildcards');

console.log('the refusal');
const msg = verdict(`latched with ${KEY}`, [KEY]) ?? '';
assert(msg.length > 0 && !msg.includes(KEY), 'never repeats the key');
assert(/pointer, never a value/.test(msg), 'names the rule');
assert(/block="whetstone", spindle="9"/.test(msg), 'points at the law');

console.log('sealed writes pass');
const envelope = await selfEncrypt(`the vault keeps ${KEY}`, 'a-cipher-key-only-for-this-test', 'https://beach.example');
assert(verdict(envelope, [KEY]) === null, 'a gray envelope carrying the key inside its ciphertext');

// The doors' battery, router 3 (proposals/2026-11-05-the-doors-fixes-router.md): pscale_genus
// and the flow's publishers write through the kernel's own store (src/genus.ts wireStore, its
// byte-parity instrument, untouched), so the guard stands in front of it.
console.log("the kernel's store, guarded");
assert(verdict(toPNode({ _: 'a task', 1: { _: `remember ${KEY}` } }), [KEY]) !== null, "the key inside the kernel's ordered maps");
assert(verdict(toPNode({ _: 'a task', 1: { _: 'nothing to hide' } }), [KEY]) === null, '…and an ordered map without it');
const mem = memStore();
const guarded = guardStore(mem, [KEY]);
let refusedSave = '';
try { await guarded.save('task', toPNode({ _: `the passphrase is ${KEY}` }) as PMap); } catch (e: any) { refusedSave = String(e?.message ?? e); }
assert(/^refused before sending/.test(refusedSave) && !refusedSave.includes(KEY) && !mem.blocks.has('task'), "a save carrying the key is refused before the kernel's post");
const refusedAppend = await guarded.append!('trace', toPNode({ _: `a trace naming ${KEY}` }) as PMap);
assert(refusedAppend.ok === false && /^refused before sending/.test(refusedAppend.error ?? '') && !mem.blocks.has('trace'), "an append carrying it answers {ok: false}, as the kernel's append does");
await guarded.save('task', toPNode({ _: 'a clean task' }) as PMap);
assert(mem.blocks.has('task'), "a clean save passes through to the kernel's own");
// The tool refuses before any read or write: its beach here answers nothing, so a refusal
// that came back from the network would read differently.
const nowhere = 'http://127.0.0.1:9';
const task = await handleGenus({ handle: 'probe', beach: nowhere, passphrase: KEY, task: `the passphrase is ${KEY}` });
assert((task as any).isError === true && /nothing written for probe: refused before sending/.test(task.content[0].text) && !task.content[0].text.includes(KEY), 'pscale_genus refuses a task carrying its passphrase, as an error, before anything travels');
const fold = await handleGenus({ handle: 'probe', beach: nowhere, passphrase: KEY, fold: { note: 'a wake', writes: { purpose: { _: `keep ${KEY} handy` } } } });
assert((fold as any).isError === true && /nothing written for probe: refused before sending/.test(fold.content[0].text) && !fold.content[0].text.includes(KEY), '…and a fold carrying it, whole, before any write of it lands');

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nall key-guard checks pass');
