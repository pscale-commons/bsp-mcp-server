/**
 * smoke-locks.ts — the lock rules at this door, offline.
 *
 * Two faults seen live on 2026-09-25 at beach.happyseaurchin.com through the
 * deployed router, both closed here:
 *
 *   (1) R1 WITHOUT CONTENT. "absent + new_lock → create locked" failed when no
 *       content rode along: the door composed the whole block as {} and the
 *       beach refused it, "whole-block content has no floor" (sunstone:1.51).
 *       With a spindle it failed silently instead: the content-less POST set a
 *       lock on a block that was never made, and the ack said ADMITTED. A
 *       group's first keyring on a new name was refused the same way. The door
 *       now starts from the block the beach would birth, {_: defaultIdentity}.
 *
 *   (2) "block" READ AS A KEY PROBLEM. The refusal decorator tested
 *       /lock|secret|latch/, and nearly every beach message says "block", so
 *       the structural refusal above arrived wearing the key-drift pointer — a
 *       caller sent to rotate a key that was never wrong.
 *
 * The fixture beach transcribes pscale-beach api/pscale-beach.js
 * (handleStandardWrite, lockKeyForWrite, and floor.js defaultIdentity): the
 * birth seed, the floor gate, confirm, lock inheritance, relinquish, born —
 * enough to land what this door sends the way the beach lands it. The same
 * cases ran against the real handler in-process before this landed.
 *
 * Run: npm run smoke:locks
 */
import { writeAt, floorDepth, parseSpindle } from '../src/bsp.js';

const FIXTURE = 'https://locks.test';
const HOST = 'locks.test';
// Members' passports resolve at the default beach, so it is the fixture here —
// set before the door is imported, since db.ts reads it at load.
process.env.DEFAULT_BEACH = FIXTURE;
const { handleBsp } = await import('../src/tools/bsp.js');
const { handleKeyPublish } = await import('../src/tools/keys.js');
const { beachRejection } = await import('../src/db.js');

let pass = 0;
let fail = 0;
function assert(cond: boolean, label: string, said = '') {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else {
    fail++;
    console.log(`  ✗ ${label}`);
    if (said) console.log(`      the door said: ${said.replace(/\s+/g, ' ').slice(0, 300)}`);
  }
}

// ── The fixture beach ──

// floor.js, transcribed: the line a beach seeds at a block it births.
function beachDefaultIdentity(name: string, origin: string): string {
  const base = String(name).split(':')[0];
  const at = ` at ${origin}.`;
  if (base === 'marks')    return `Marks${at} Open stigmergy — each digit-path slot is one contribution (block-conventions:9).`;
  if (base === 'presence') return `Presence${at} One slot per agent, heartbeat-overwritten (block-conventions:4.6).`;
  if (base === 'liquid')   return `Liquid composition buffer${at} Pre-commit slots (block-conventions:4.5).`;
  return `${name}${at}`;
}
function hasFloor(b: any): boolean {
  let n = b;
  while (n && typeof n === 'object' && '_' in n) { n = n._; if (typeof n === 'string') return true; }
  return false;
}
function lockKeyForWrite(name: string, spindle: string, block: any): string {
  if (!spindle) return '_';
  const cleaned = String(spindle).replace(/\*$/, '');
  if (name.startsWith('sed:') || name.startsWith('grain:')) {
    const first = cleaned.split('.')[0];
    return !first || first === '0' || first === '_' ? '_' : first;
  }
  const { digits } = parseSpindle(cleaned, floorDepth(block ?? {}));
  if (!digits.length || digits[0] === '0') return '_';
  return digits[0];
}

const store: Record<string, any> = {};
const locks: Record<string, Record<string, string>> = {};
const latch = (name: string, pos: string, secret: string) => `${name}|${pos}|${secret}`; // stands in for the salted sha256
let posts = 0;

// handleStandardWrite, non-append, ordinary blocks.
function beachPost(name: string, body: any): { status: number; body: any } {
  const { spindle = '', content, secret, new_lock, confirm } = body ?? {};
  const existing = store[name] ?? null;
  let block = existing ?? ((spindle === '' && content && typeof content === 'object' && !Array.isArray(content))
    ? null
    : { _: beachDefaultIdentity(name, HOST) });
  if (content !== undefined && !spindle && existing != null && confirm !== true) {
    return { status: 400, body: { error: 'whole-block replace requires {confirm: true}', code: 'confirm_required' } };
  }
  const hashes = { ...(locks[name] ?? {}) };
  const lockKey = lockKeyForWrite(name, spindle, block);
  let authKey = lockKey;
  let stored = hashes[lockKey];
  if (stored === undefined && lockKey !== '_' && hashes['_'] !== undefined) { authKey = '_'; stored = hashes['_']; }
  const relinquish = new_lock === null || new_lock === '';
  if (content !== undefined && stored) {
    if (!secret) {
      return { status: 403, body: { error: authKey === lockKey
        ? `position "${lockKey}" of "${name}" is locked, secret required`
        : `position "${lockKey}" of "${name}" inherits the lock at its root, secret required`, code: 'lock_required' } };
    }
    if (latch(name, authKey, secret) !== stored) return { status: 403, body: { error: 'secret does not match', code: 'lock_required' } };
  }
  if (new_lock !== undefined && stored && (!secret || latch(name, authKey, secret) !== stored)) {
    return { status: 403, body: { error: 'lock rotation requires current secret', code: 'lock_required' } };
  }
  if (content !== undefined) {
    if (!spindle) {
      if (!hasFloor(content)) {
        return { status: 400, body: { error: 'whole-block content has no floor — the root must carry a `_` whose chain reaches an identity string (sunstone:1.51)', code: 'no_floor' } };
      }
      block = content;
    } else {
      writeAt(block, String(spindle), content);
    }
    store[name] = block;
  }
  if (new_lock !== undefined) {
    if (relinquish) {
      if (stored !== undefined && authKey !== lockKey) {
        return { status: 409, body: { error: `position "${lockKey}" of "${name}" holds no lock of its own — it inherits the one at the root.`, code: 'inherited_lock' } };
      }
      if (stored !== undefined) { delete hashes[lockKey]; locks[name] = hashes; }
    } else {
      // Kept even when no block was saved — the stray a content-less lock made.
      hashes[lockKey] = latch(name, lockKey, new_lock);
      locks[name] = hashes;
    }
  }
  return { status: 200, body: { ok: true, ...(content !== undefined && existing == null ? { born: true } : {}) } };
}

const answer = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = (async (input: any, init?: any) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  if (url.origin !== FIXTURE || url.pathname !== '/.well-known/pscale-beach') return answer({ error: 'no beach here' }, 404);
  const method = init?.method ?? 'GET';
  if (method === 'GET') {
    const name = url.searchParams.get('block');
    if (!name) return answer({ _: 'the locks fixture', origin: HOST, blocks: Object.keys(store) });
    // The whole block, as a legacy beach answers — the door walks it locally.
    return name in store ? answer(store[name]) : answer({ error: `block "${name}" not found`, code: 'not_found' }, 404);
  }
  if (method === 'POST') {
    posts++;
    const body = JSON.parse(String(init.body));
    const name = url.searchParams.get('block') ?? body.block;
    const r = beachPost(name, body);
    return answer(r.body, r.status);
  }
  return answer({ error: 'Method not allowed' }, 405);
}) as typeof fetch;

const door = async (p: Record<string, unknown>) =>
  (await handleBsp({ agent_id: FIXTURE, ...p } as any)).content.map(c => c.text).join('\n');
const lockAt = (name: string) => Object.keys(locks[name] ?? {}).sort().join(',');

// ── 1. The refusal decorator ──

console.log('\n1. a refusal names the key only when the key is what refused');
const hinted = (status: number | undefined, error: string) => /ways:key/.test(beachRejection('save', { status, error }).message);
assert(!hinted(400, 'whole-block content has no floor — the root must carry a `_` whose chain reaches an identity string (sunstone:1.51)'),
  'the no-floor refusal is structural: no key pointer (the 2026-09-25 case)');
assert(!hinted(400, 'whole-block replace requires {confirm: true}'), '"whole-block" alone never reads as a lock');
assert(!hinted(404, 'block "probe:x" not found'), 'nor does "block"');
assert(hinted(undefined, 'position "3" of "probe:x" is locked, secret required'), '"locked" still points at the key');
assert(hinted(undefined, 'lock rotation requires current secret'), '"lock" still points at the key');
assert(hinted(undefined, 'the locks on this block are held'), '"locks" still points at the key');
assert(hinted(undefined, 'append to "marks" requires the accumulator secret'), '"secret" still points at the key');
assert(hinted(undefined, 'the edit-latch refused'), '"latch" still points at the key');
assert(hinted(403, 'forbidden'), 'and a 403 points at the key whatever it says');

// ── 2. R1 at the root, no content — the reported call ──

console.log('\n2. R1 without content, at the root');
let said = await door({ block: 'probe:lock-root', new_lock: 'k-root' });
assert(!/rejected/i.test(said), 'the lock-only create is admitted', said);
assert(JSON.stringify(store['probe:lock-root']) === JSON.stringify({ _: 'probe:lock-root at locks.test.' }),
  'the block is born holding the beach\'s default identity');
assert(lockAt('probe:lock-root') === '_', 'the lock stands at the underscore');
assert(/created "probe:lock-root"/.test(said) && /default identity, "probe:lock-root at locks\.test\."/.test(said) && /Lock SET at the underscore/.test(said),
  'the ack names the birth, the placeholder line and the lock', said);
said = await door({ block: 'probe:lock-root', spindle: '1', content: 'keyless' });
assert(/rejected/i.test(said) && /ways:key/.test(said), 'a keyless write is refused, and a true key refusal keeps its pointer', said);
said = await door({ block: 'probe:lock-root', spindle: '0', content: 'A probe block, born by its lock.', secret: 'k-root' });
assert(store['probe:lock-root']._ === 'A probe block, born by its lock.', 'the root line is written at spindle "0" under the new lock', said);

// ── 3. R1 at a digit ──

console.log('\n3. R1 without content, at a digit');
posts = 0;
said = await door({ block: 'probe:lock-digit', spindle: '3', new_lock: 'k-3' });
assert(!/rejected/i.test(said) && posts === 2, `the block is born, then the digit locked (${posts} POSTs)`, said);
assert(store['probe:lock-digit']?._ === 'probe:lock-digit at locks.test.', 'the lock stands on a block, not on nothing');
assert(lockAt('probe:lock-digit') === '3', 'only position 3 is locked');
assert(/and stays open/.test(said) && /Lock SET at position "3"/.test(said), 'the ack says the root stays open', said);
assert(!/rejected/i.test(await door({ block: 'probe:lock-digit', spindle: '1', content: 'anyone' })), 'a keyless write at 1 lands');
assert(/rejected/i.test(await door({ block: 'probe:lock-digit', spindle: '3', content: 'keyless' })), 'a keyless write at 3 is refused');
posts = 0;
said = await door({ block: 'probe:lock-zero', spindle: '0', new_lock: 'k-0' });
assert(posts === 1 && lockAt('probe:lock-zero') === '_' && store['probe:lock-zero']?._ === 'probe:lock-zero at locks.test.',
  'at spindle "0" — the root underscore — one POST births and locks', said);

// ── 4. What a lock-only call on a new name must NOT do ──

console.log('\n4. no birth where nothing is claimed');
posts = 0;
said = await door({ block: 'probe:absent', new_lock: null });
assert(/Lock unchanged/.test(said) && /does not exist/.test(said), 'a relinquish on a name with no block says so', said);
await door({ block: 'probe:absent', spindle: '3', new_lock: '' });
assert(posts === 0 && !('probe:absent' in store) && !('probe:absent' in locks), 'and sends nothing, births nothing, mints no lock');
said = await door({ block: 'probe:null-word', new_lock: 'null' });
assert(/serialisation slip/.test(said) && posts === 0 && !('probe:null-word' in store), 'a null-word is refused before any birth', said);

// ── 5. What already worked ──

console.log('\n5. unchanged');
said = await door({ block: 'probe:authored', content: { _: 'an authored root' }, new_lock: 'k-a' });
assert(store['probe:authored']?._ === 'an authored root' && !/default identity/.test(said), 'R1 with content births the block as written', said);
await door({ block: 'probe:standing', content: { _: 'a standing block', 1: 'an entry' } });
said = await door({ block: 'probe:standing', new_lock: 'k-s' });
assert(JSON.stringify(store['probe:standing']) === JSON.stringify({ _: 'a standing block', 1: 'an entry' }) && !/created/.test(said) && lockAt('probe:standing') === '_',
  'R2 on a standing block locks it and leaves it as it stood', said);
said = await door({ block: 'probe:floorless', content: { 1: 'no root line' } });
assert(/no floor/.test(said) && !/ways:key/.test(said), 'a floorless whole block from a caller is still refused — as structure, not as a key', said);

// ── 6. A group's first keyring ──

console.log('\n6. group create on a new name');
for (const h of ['m1', 'm2']) {
  await door({ block: `passport:${h}`, content: { _: `${h} passport` } });
  await handleKeyPublish({ handle: h, secret: `s-${h}`, agent_id: FIXTURE });
}
said = await door({ block: 'probe:group', spindle: '1', content: 'first private line', members: ['m1', 'm2'], enc_secret: 's-m1' });
const g = store['probe:group'];
assert(!/rejected/i.test(said) && g?._ === 'probe:group at locks.test.' && !!g?.['9'] && !!g?.['1'],
  'the group is born: identity at the root, keyring at 9, the entry at 1', said);
assert((await door({ block: 'probe:group', spindle: '1', enc_secret: 's-m2' })).includes('first private line'),
  'another member reads the line');

// ── 7. The door births what the beach births ──

console.log('\n7. parity with the beach\'s own birth');
beachPost('marks:beach-born', { spindle: '1', content: 'a mark' });
await door({ block: 'marks:door-born', new_lock: 'k-m' });
assert(store['marks:door-born']?._ === store['marks:beach-born']?._, 'a convention-aware identity matches line for line');

console.log(`\n${fail === 0 ? '✓' : '✗'} locks: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
