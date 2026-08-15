/** Smoke — pscale_stream_engage. Pure helpers asserted offline; one LIVE read
 *  against the beach-venture family (read-only, writes nothing). */
import { voiceOf, emitFor, ladderOf, isBareRef, namedRungAddress, handleStreamEngage } from '../src/tools/stream.js';
import { Block } from '../src/bsp.js';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; } else { fail++; console.error('  FAIL', m); } };

// voiceOf — a leaf speaks as itself, an object through its underscore, silence is null
ok(voiceOf('hello') === 'hello', 'leaf string');
ok(voiceOf({ _: 'under' }) === 'under', 'object underscore');
ok(voiceOf({ '1': 'x' }) === null, 'object without underscore is silent');
ok(voiceOf('') === null, 'empty string is silent');
ok(voiceOf(undefined) === null, 'absent is silent');

// emitFor — right-pad to the TARGET block's floor (floor-alignment, not walk depth)
const floor1: Block = { _: 'a' } as Block;
const floor3: Block = { _: { _: { _: 'deep' } } } as Block;
ok(emitFor(['2', '4'], floor1) === '24', 'floor 1 keeps digits');
ok(emitFor(['2', '4'], floor3) === '240', 'floor 3 right-pads');

// isBareRef — one token is a ref, prose is not
ok(isBareRef('function:audit'), 'bare ref');
ok(isBareRef('pscale:grit/5'), 'bare ref with branch');
ok(!isBareRef('read this as a progression'), 'prose is not a ref');

// ladderOf — every ancestor, coarsest first, pscale = floor - depth
const spine: Block = { _: { _: { _: 'root' } }, '2': { _: 'two', '3': 'twothree' } } as any;
const l = ladderOf(spine, ['2', '3']);
ok(l.length === 2, 'two rungs walked');
ok(l[0].pscale === 2 && l[1].pscale === 1, `pscale descends (${l[0].pscale},${l[1].pscale})`);
ok(l[0].text === 'two' && l[1].text === 'twothree', 'ancestor voicings collected');

// named rungs — a word, never digits
const D = new Date(Date.UTC(2026, 7, 10, 9, 0, 0));
ok(namedRungAddress('today', D)?.length === 10, 'today is full-width');
ok(namedRungAddress('today', D)?.endsWith('00'), 'today zeroes the finer rungs');
ok(namedRungAddress('this week', D) === namedRungAddress('week', D), '"this week" == "week"');
ok(namedRungAddress('year', D)?.startsWith('2026'), 'year keeps the Gregorian digits');
ok(namedRungAddress('2026322300', D) === null, 'a digit address falls through');

console.log(`offline: ${pass} passed, ${fail} failed`);

// ── LIVE, read-only ──
const res = await handleStreamEngage({ field: 'beach-venture', handle: 'weft', at: 'today' });
const text = (res.content[0] as any).text as string;
console.log('\n──── LIVE beach-venture @ now ────\n');
console.log(text);
const live = [
  ['ladder present', text.includes('# The ladder')],
  ['snapshot present', text.includes('# Readings at')],
  ['fold section present', text.includes('# The fold')],
  ['ancestor voicing carried', text.includes('the internet reconstituted as beach')],
  // the attended rung is named by its own address, whatever today holds —
  // a pin on a specific day's words went stale five days after it was written
  ['attended address carried', text.includes(namedRungAddress('today', new Date())!)],
] as const;
for (const [m, c] of live) ok(c as boolean, m);
console.log(`\ntotal: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
