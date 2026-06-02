/**
 * smoke-group2b-live.ts — group 2b end-to-end, LIVE.
 *   A. co-write + remove: owner + 2 members; m1 co-writes a 2nd slot; everyone
 *      reads both; owner removes m2 (rotation) → m2 can't read, m1 still can.
 *   B. larger group: 10 members (chained keyring); the 9th and 10th read.
 *
 * Ordinary blocks → HTTP-deletable; self-cleans. Run: npm run smoke:group2b-live
 */

import { handleBsp } from '../src/tools/bsp.js';
import { handleKeyPublish } from '../src/tools/keys.js';

const HOST = 'https://beach.happyseaurchin.com';
const TS = Date.now();

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
async function publish(id: { h: string; e: string }): Promise<void> {
  await handleBsp({ agent_id: HOST, block: `passport:${id.h}`, spindle: '', pscale_attention: null, content: { _: `passport ${id.h}` } });
  await handleKeyPublish({ handle: id.h, secret: id.e, enc_secret: id.e, agent_id: HOST });
}

async function main() {
  const A = `g2b-a-${TS}`, B = `g2b-b-${TS}`;
  const owner = { h: `a-own-${TS}`, e: `ae-own-${TS}` };
  const m1 = { h: `a-m1-${TS}`, e: `ae-m1-${TS}` };
  const m2 = { h: `a-m2-${TS}`, e: `ae-m2-${TS}` };
  const big: { h: string; e: string }[] = [];
  for (let i = 0; i < 10; i++) big.push({ h: `b-${i}-${TS}`, e: `be-${i}-${TS}` });

  try {
    console.log('\n=== A. co-write + remove ===');
    for (const id of [owner, m1, m2]) await publish(id);
    await handleBsp({ agent_id: HOST, block: A, spindle: '1', pscale_attention: null, content: 'note from owner', members: [owner.h, m1.h, m2.h], enc_secret: owner.e });
    const cw = await handleBsp({ agent_id: HOST, block: A, spindle: '2', pscale_attention: null, content: 'note from m1', enc_secret: m1.e });
    assert(txt(cw).toLowerCase().includes('wrote'), 'm1 co-writes a second slot');
    const rraw = await rawGet(A);
    assert(rraw?.['1']?.['9']?._ === 'gray' && rraw?.['2']?.['9']?._ === 'gray', 'both slots are group envelopes (owner did not clobber m1)');
    const rM2 = await handleBsp({ agent_id: HOST, block: A, spindle: '', pscale_attention: null, enc_secret: m2.e });
    assert(txt(rM2).includes('note from owner') && txt(rM2).includes('note from m1'), 'm2 reads both co-written slots');

    const rem = await handleBsp({ agent_id: HOST, block: A, spindle: '9', pscale_attention: null, members: [owner.h, m1.h], enc_secret: owner.e });
    assert(!txt(rem).toLowerCase().includes('rejected'), 'owner removes m2 (declarative list drops m2 → rotation)');
    const rM2b = await handleBsp({ agent_id: HOST, block: A, spindle: '', pscale_attention: null, enc_secret: m2.e });
    assert(!txt(rM2b).includes('note from owner') && !txt(rM2b).includes('note from m1'), 'removed m2 can no longer read (key rotated)');
    const rM1 = await handleBsp({ agent_id: HOST, block: A, spindle: '', pscale_attention: null, enc_secret: m1.e });
    assert(txt(rM1).includes('note from owner') && txt(rM1).includes('note from m1'), 'remaining m1 still reads both slots after rotation');

    console.log('\n=== B. larger group (10 members, chained keyring) ===');
    for (const id of big) await publish(id);
    await handleBsp({ agent_id: HOST, block: B, spindle: '1', pscale_attention: null, content: 'group of ten', members: big.map(x => x.h), enc_secret: big[0].e });
    const braw = await rawGet(B);
    assert(braw?.['9']?._ === 'group-keyring', 'keyring present');
    assert(braw?.['9']?.['9']?._ === 'more', 'keyring chained to a 2nd page (>8 members)');
    const r9 = await handleBsp({ agent_id: HOST, block: B, spindle: '1', pscale_attention: null, enc_secret: big[8].e });
    assert(txt(r9).includes('group of ten'), '9th member (page 2) reads');
    const r10 = await handleBsp({ agent_id: HOST, block: B, spindle: '1', pscale_attention: null, enc_secret: big[9].e });
    assert(txt(r10).includes('group of ten'), '10th member (page 2) reads');
  } finally {
    console.log('\n=== cleanup ===');
    await wipe(A); await wipe(B);
    for (const id of [owner, m1, m2, ...big]) await wipe(`passport:${id.h}`);
    const leftover = (await Promise.all([rawGet(A), rawGet(B), ...[owner, m1, m2, ...big].map(id => rawGet(`passport:${id.h}`))])).filter(Boolean).length;
    assert(leftover === 0, `cleanup: all test blocks deleted (${leftover} leftover)`);
  }

  console.log(`\n=== Results: ${pass} pass, ${fail} fail ===\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
