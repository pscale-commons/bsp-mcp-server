/**
 * smoke-door-orientation.ts — what every app is told at connect, and what a
 * holder's door delivers before anything else (proposals/2026-11-09-the-orientation-review.md).
 *
 *   1. The instructions fit the cut. Claude Code shows a server's instructions only
 *      to 4,096 characters; the signed line comes first, so it is never what is cut.
 *   2. They carry the strata and the address rule, the two things no other text
 *      every app reads is sure to carry.
 *   3. The strata section arrives at a holder's door with every rung whole: the
 *      walk's usual cut (an ancestor over 400 characters shown as its first 150)
 *      would drop chemistry's own inversion.
 *   4. Every other walk still cuts as before.
 *
 *   npm run smoke:door-orientation
 */
import { INSTRUCTIONS, composeInstructions } from '../src/server.js';
import { strataSection, STRATA_SPINDLES, capMember, MEMBER_CAP } from '../src/tools/play.js';
import { parseReference } from '../src/genus.js';
import { parseBundleRef } from '../src/bundle.js';
import { bspRead, formatRead } from '../src/bsp-fn.js';
import { SENTINELS } from '../src/sentinels.js';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean, d = '') => { if (c) { pass++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}${d ? ' — ' + d : ''}`); } };

const CUT = 4096;

console.log('\nTHE CUT — what a session is told at connect');
{
  ok('the instructions alone stand well inside the cut', INSTRUCTIONS.length <= 3100, String(INSTRUCTIONS.length));
  const home = composeInstructions('weft', 'https://beach.happyseaurchin.com');
  ok('signed at the home beach, the whole text fits', home.length < CUT, String(home.length));
  ok('the signed line comes first', home.startsWith('THIS CONNECTION WRITES AS weft'));
  const elsewhere = composeInstructions('davidmpinto', 'https://beach.bringingtheflavour.com');
  ok('signed at another beach, the whole text still fits', elsewhere.length < CUT, String(elsewhere.length));
  ok('and the line that names that beach is inside the cut', elsewhere.slice(0, CUT).includes('https://beach.bringingtheflavour.com'));
  ok('unsigned, the instructions are as written', composeInstructions() === INSTRUCTIONS);
}

console.log('\nWHAT EVERY APP IS TOLD');
{
  for (const level of ['1 PHYSICS', '2 CHEMISTRY', '3 BIOLOGY']) ok(`the instructions name ${level}`, INSTRUCTIONS.includes(level));
  ok('biology names the thread and its way', INSTRUCTIONS.includes('carried on a thread') && INSTRUCTIONS.includes('(ways:thread)'));
  ok('and point at the law', INSTRUCTIONS.includes('block="strata"'));
  ok('the address rule is inside the cut', INSTRUCTIONS.includes('at most ONE decimal point') && INSTRUCTIONS.indexOf('at most ONE decimal point') < CUT);
  ok('the walk\'s d and p are explained', INSTRUCTIONS.includes('d<depth> p<pscale>') && INSTRUCTIONS.includes('pscale = floor − depth'));
  ok('the holder\'s route is the door', INSTRUCTIONS.includes('pscale_play(world=<the beach URL>, handle, room=<the handle>'));
  ok('no multi-dot address is written as an example', !/\b\d+\.\d+\.\d+\b/.test(INSTRUCTIONS));
}

console.log('\nTHE STRATA AT A HOLDER\'S DOOR — a beach that keeps its way of a thread');
{
  // A way of a thread as a beach keeps it (ways:thread): a root, eight steps, its
  // provenance at 9. The fixture's steps run long on purpose, past the disc's cut.
  const long = (k: string, words: string) => `${words} ${'and the step goes on, every clause of it needed. '.repeat(8)}end of step ${k}.`;
  const way: any = { _: 'THE WAY OF A THREAD — how a mind carries a piece of work across its own loops, other minds and people.' };
  const names = ['FIND IT, OR OPEN IT.', 'TAKE IT UP with one read at its place.', 'FIND YOUR GAP in that read.', 'TIE ONE KNOT in your own mirror.', 'HAND IT ON BY PLACE, in the same turn.', 'THE KINDS OF RUNNER.', 'THE FAILURE: a thread no loop reads is inert.', 'WELL FORMED, as the battery checks it.'];
  names.forEach((n, i) => { way[String(i + 1)] = long(String(i + 1), n); });
  way['9'] = 'PROVENANCE — drafted by keel at David\'s word, the long history of the form.';
  const text = strataSection(way).join('\n');
  ok('the section opens on the three levels, biology by threads', text.startsWith('═══════════ THE STRATA') && text.includes('in time, by threads (biology)'));
  for (const { block, spindle } of STRATA_SPINDLES) ok(`it carries ${block}:${spindle}`, text.includes(`── ${block}:${spindle} ──`));
  ok('physics arrives at the probe order', text.includes('So the probe order on anything unfamiliar is fixed'));
  ok('chemistry\'s inversion arrives whole', text.includes('the beach moves SEMANTICS between blocks where code moves DATA through functions. A compound is blocks sharing an address space plus references, and it acts BY BEING READ'));
  ok('biology is the beach\'s way of a thread', text.includes('── ways:thread') && text.includes('[0]: THE WAY OF A THREAD'));
  ok('its eight steps arrive whole, each to its end', names.every((n, i) => text.includes(n) && text.includes(`end of step ${i + 1}.`)));
  ok('its provenance stays a read away', !text.includes('PROVENANCE — drafted by keel') && text.includes('its provenance at 9 is a read away'));
  ok('and the loop the way runs on does not ride twice', !text.includes('── strata:311111 ──'));
  ok('the clock\'s ladder rides with it', text.includes('anchors pscale 0 at the beat'));
  ok('no rung is cut to its headline', !/\.\.\.\s*$/m.test(text) && !text.includes('…\n'), text.split('\n').find((l) => /\.\.\.\s*$/.test(l)) ?? '');
}

console.log('\nTHE STRATA AT A HOLDER\'S DOOR — a beach with no way of a thread');
{
  const text = strataSection(null).join('\n');
  ok('strata\'s own biology stands in, walked to one edit and the fold', text.includes('── strata:311111 ──') && text.includes('Then one edit and the fold'));
  ok('with the clock\'s ladder', text.includes('anchors pscale 0 at the beat'));
  ok('the section is a few thousand characters, not a block dump', text.length > 3000 && text.length < 8000, String(text.length));
  ok('a way with no steps is no way: the loop stands in', strataSection({ _: 'a way with nothing in it' } as any).join('\n').includes('── strata:311111 ──'));
}

console.log('\nEVERY OTHER WALK CUTS AS BEFORE');
{
  const strata = SENTINELS.find((s) => s.name === 'strata')!.json;
  const usual = formatRead(bspRead(strata, '21111', null), { onClock: false });
  ok('a plain walk still shows a long ancestor as its headline', usual.includes('the beach moves SEMANTICS betwee') && !usual.includes('it acts BY BEING READ'));
  const whole = formatRead(bspRead(strata, '21111', null), { onClock: false, wholeRungs: true });
  ok('the whole walk carries it in full', whole.includes('it acts BY BEING READ'));
}

console.log('\nWHAT A BUNDLE CAN NAME');
{
  for (const g of ['grain:4dcaf5f465d5ff31', 'grain:5cec3b320dcaee2a']) {
    const r = parseReference(`${g}:0:-1`);
    ok(`${g}, whose pair begins with a digit, is a reference`, r?.name === g && r.address === null && r.attention === -1, JSON.stringify(r));
    ok(`and its head word reads in a bundle`, parseBundleRef(`${g}:head`)?.name === g);
  }
  ok('a clock address still reads as an address', parseReference('now:weft:2026422278:3')?.address === '2026422278');
  ok('a time is never a reference', parseReference('10:30') === null);
  ok('nor a date', parseReference('2026-11-09') === null);
}

console.log('\nA MEMBER PAST ITS CAP');
{
  const long = Array.from({ length: 400 }, (_, i) => `line ${i} ${'x'.repeat(40)}`).join('\n');
  const cut = capMember(long, 'grain:bb519a2c294bc086:0:-1');
  ok('it is cut at a line, inside the cap', cut.length < MEMBER_CAP + 200 && cut.split('\n').slice(0, -1).every((l) => long.includes(l)));
  ok('and says how much was cut and where the rest is', /cut at [\d,]+ of [\d,]+ characters: the rest is a bsp read of grain:bb519a2c294bc086:0:-1 away/.test(cut), cut.slice(-160));
  ok('a member inside the cap is untouched', capMember('short', 'x') === 'short');
}

console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
if (fail > 0) process.exit(1);
