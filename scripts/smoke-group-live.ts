/**
 * smoke-group-live.ts — group (N-member) private block, end-to-end, LIVE.
 *   - 5 identities publish keys (from their enc_secret)
 *   - owner creates a group block (members = owner + m1 + m2) and writes content
 *   - every member reads it with their own enc_secret
 *   - a non-member, and an open read, cannot
 *   - owner invites m3; m3 then reads
 *
 * Group + passports are ordinary blocks → HTTP-deletable, so this self-cleans.
 * Run: npm run smoke:group-live
 */

import { handleBsp } from '../src/tools/bsp.js';
import { handleKeyPublish } from '../src/tools/keys.js';

const HOST = 'https://beach.happyseaurchin.com';
const TS = Date.now();
const GROUP = `group-smoke-${TS}`;
const NOTE = 'the meeting moved to the lighthouse at dawn';

const ids = {
  owner: { h: `g-owner-${TS}`, enc: `enc-owner-${TS}` },
  m1: { h: `g-m1-${TS}`, enc: `enc-m1-${TS}` },
  m2: { h: `g-m2-${TS}`, enc: `enc-m2-${TS}` },
  m3: { h: `g-m3-${TS}`, enc: `enc-m3-${TS}` },
  eve: { h: `g-eve-${TS}`, enc: `enc-eve-${TS}` },
};

let pass = 0, fail = 0;
function assert(c: boolean, l: string) { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.log(`  ✗ ${l}`); } }
const txt = (r: any): string => (r?.content ?? []).map((c: any) => c.text).join('\n');
async function rawGet(b: string): Promise<any> {
  const res = await fetch(`${HOST}/.well-known/pscale-beach?block=${encodeURIComponent(b)}`, { signal: AbortSignal.timeout(8000) });
  return res.ok ? res.json() : null;
}
async function wipe(b: string): Promise<void> {
  try { await fetch(`${HOST}/.well-known/pscale-beach?block=${encodeURIComponent(b)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: true }), signal: AbortSignal.timeout(8000) }); } catch {}
}

async function main() {
  try {
    console.log('\n=== 1. passports + published keys (5 identities) ===');
    for (const id of Object.values(ids)) {
      await handleBsp({ agent_id: HOST, block: `passport:${id.h}`, spindle: '', pscale_attention: null, content: { _: `passport ${id.h}` } });
      await handleKeyPublish({ handle: id.h, secret: id.enc, enc_secret: id.enc, agent_id: HOST });
    }
    assert(true, 'all keys published');

    console.log('\n=== 2. owner creates group (members: owner, m1, m2) + content ===');
    const create = await handleBsp({ agent_id: HOST, block: GROUP, spindle: '1', pscale_attention: null, content: NOTE, members: [ids.owner.h, ids.m1.h, ids.m2.h], enc_secret: ids.owner.enc });
    assert(txt(create).toLowerCase().includes('wrote'), 'owner created group + wrote content');
    const raw = await rawGet(GROUP);
    assert(raw?.['9']?._ === 'group-keyring', 'keyring present at position 9');
    assert(Object.keys(raw['9'] ?? {}).filter(k => /^[1-9]$/.test(k)).length === 3, '3 members wrapped in keyring');
    assert(raw?.['1']?.['9']?._ === 'gray' && raw['1']['9']['1'] === 'group', 'content at 1 is a group envelope');
    assert(JSON.stringify(raw).indexOf(NOTE) === -1, 'plaintext NOT visible in raw block');

    console.log('\n=== 3. each member reads with their enc_secret ===');
    for (const m of [ids.owner, ids.m1, ids.m2]) {
      const r = await handleBsp({ agent_id: HOST, block: GROUP, spindle: '1', pscale_attention: null, enc_secret: m.enc });
      assert(txt(r).includes(NOTE), `${m.h} reads the content`);
    }

    console.log('\n=== 4. negatives ===');
    const eveR = await handleBsp({ agent_id: HOST, block: GROUP, spindle: '1', pscale_attention: null, enc_secret: ids.eve.enc });
    assert(!txt(eveR).includes(NOTE), 'non-member (eve) cannot read');
    const openR = await handleBsp({ agent_id: HOST, block: GROUP, spindle: '1', pscale_attention: null });
    assert(!txt(openR).includes(NOTE), 'open read (no key) does not leak');

    console.log('\n=== 5. owner invites m3; m3 reads ===');
    const inv = await handleBsp({ agent_id: HOST, block: GROUP, spindle: '9', pscale_attention: null, members: [ids.owner.h, ids.m1.h, ids.m2.h, ids.m3.h], enc_secret: ids.owner.enc });
    assert(!txt(inv).toLowerCase().includes('rejected'), 'owner invited m3');
    const raw2 = await rawGet(GROUP);
    assert(Object.keys(raw2['9'] ?? {}).filter(k => /^[1-9]$/.test(k)).length === 4, 'keyring now has 4 members');
    const m3R = await handleBsp({ agent_id: HOST, block: GROUP, spindle: '1', pscale_attention: null, enc_secret: ids.m3.enc });
    assert(txt(m3R).includes(NOTE), 'newly-invited m3 reads the content');
    const eveR2 = await handleBsp({ agent_id: HOST, block: GROUP, spindle: '1', pscale_attention: null, enc_secret: ids.eve.enc });
    assert(!txt(eveR2).includes(NOTE), 'eve still cannot read after the invite');
  } finally {
    console.log('\n=== cleanup ===');
    await wipe(GROUP);
    for (const id of Object.values(ids)) await wipe(`passport:${id.h}`);
    const leftover = [await rawGet(GROUP), ...(await Promise.all(Object.values(ids).map(id => rawGet(`passport:${id.h}`))))].filter(Boolean).length;
    assert(leftover === 0, `cleanup: all test blocks deleted (${leftover} leftover)`);
  }

  console.log(`\n=== Results: ${pass} pass, ${fail} fail ===\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
