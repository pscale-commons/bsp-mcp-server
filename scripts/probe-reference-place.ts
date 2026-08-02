/**
 * probe-reference-place.ts — the reference model, proven end to end (world-genome:1.2).
 *
 * A TABLE that holds no spatial block at all must still resolve its PLACE, by following
 * the location star-ref in the character's passport to the SCENARIO that owns the place.
 * That is what lets a group play shared canon without forking it, and why a Character
 * cannot pollute canon — the place is never on a surface they can write to.
 *
 * The control matters as much as the case: a table that DOES hold its own spatial must
 * keep reading it locally (the frozen-copy path), because every world built before this
 * change is that shape and none of them may move.
 *
 *   npx tsx scripts/probe-reference-place.ts
 *
 * READ-ONLY at run time. Two live fixtures on beach.happyseaurchin.com, both standing:
 *   /w/probe-ref-table  — one block, passport:refprobe, whose position 3 star-refs
 *                         /w/brackenfoot's spatial. Deliberately holds NO spatial of
 *                         its own; that absence is the whole case. Disposable.
 *   /w/the-reaper-ayush — a real table that DOES hold its own spatial copy, standing in
 *                         as the control so the copy path is proven unmoved.
 */
import { handlePlay } from '../src/tools/play.js';
import { passportLocationRef } from '../src/tools/pool.js';

const BEACH = 'https://beach.happyseaurchin.com';

// Unit half — the ref reader, no network.
const unit: [string, any, { origin: string | null; addr: string } | null][] = [
  [
    'star-ref carries origin + address',
    { '3': `Weary. Location: *:${BEACH}/w/brackenfoot:spatial:brackenfoot:211` },
    { origin: `${BEACH}/w/brackenfoot`, addr: '211' },
  ],
  [
    'bare ref keeps the address, no origin',
    { '3': 'Weary. Location: spatial:thornwood:111' },
    { origin: null, addr: '111' },
  ],
  [
    'single-decimal address survives',
    { '3': `Location: *:${BEACH}/w/x:spatial:x:111.1` },
    { origin: `${BEACH}/w/x`, addr: '111.1' },
  ],
  ['no location at all', { '3': 'Just an appearance.' }, null],
];

let bad = 0;
for (const [label, block, want] of unit) {
  const got = passportLocationRef(block);
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} ref-reader — ${label}`);
  if (!ok) console.log(`    want ${JSON.stringify(want)}\n    got  ${JSON.stringify(got)}`);
}

// Live half — the doorway resolving a place that is not on the table.
const live: { label: string; world: string; handle: string; want: RegExp; not?: RegExp }[] = [
  {
    label: 'REFERENCE — table with no spatial resolves the Slip from brackenfoot canon',
    world: `${BEACH}/w/probe-ref-table`,
    handle: 'refprobe',
    want: /Slip|211/i,
    not: /names no place/i,
  },
  {
    label: 'CONTROL — table with its own spatial still reads it locally',
    world: `${BEACH}/w/the-reaper-ayush`,
    handle: 'Ayush',
    want: /room 7|rotary phone/i,
    not: /names no place/i,
  },
];

for (const c of live) {
  const text = (await handlePlay({ world: c.world, handle: c.handle })).content[0].text;
  const ok = c.want.test(text) && !(c.not && c.not.test(text));
  if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} doorway — ${c.label}`);
  if (!ok) console.log(`    first lines: ${text.split('\n').slice(0, 3).join(' / ').slice(0, 220)}`);
}

console.log(bad === 0 ? '\nReference resolves; copy path unmoved.' : `\n${bad} failed.`);
process.exit(bad === 0 ? 0 : 1);
