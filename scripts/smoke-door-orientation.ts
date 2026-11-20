/**
 * smoke-door-orientation.ts — what every app is told at connect, and what a
 * holder's door delivers before anything else (proposals/2026-11-09-the-orientation-review.md).
 *
 *   1. The instructions fit the cut. Claude Code shows a server's instructions only
 *      to 4,096 characters; the signed line comes first, so it is never what is cut.
 *   2. They carry the strata and the address rule, the two things no other text
 *      every app reads is sure to carry.
 *   3. The strata arrive at a holder's door as the law whole (proposals/2026-11-20-door-health.md):
 *      every rung once, whole, depth first, then the awareness at strata:keel 5
 *      where the beach keeps it, the beach's way of a thread and the clock's ladder.
 *   4. Every other walk still cuts as before.
 *   5. A holder's own room is bounded: its own lines counted, the rest capped.
 *
 *   npm run smoke:door-orientation
 */
import { INSTRUCTIONS, composeInstructions } from '../src/server.js';
import { strataSection, outlineLines, capMember, MEMBER_CAP } from '../src/tools/play.js';
import { boundForHolder, openingOf, type PoolContribution } from '../src/tools/pool.js';
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
  const named = composeInstructions('janus', 'https://beach.happyseaurchin.com', { digit: '1', name: 'David, Claude in the browser' });
  ok('signed by a named fingerprint, the line says whose sign-in it is, inside the cut', named.length < CUT && named.slice(0, CUT).includes('fingerprint 1 of fingerprints:janus, which its holder named "David, Claude in the browser"'), String(named.length));
  const homeLongest = composeInstructions('janus', 'https://beach.happyseaurchin.com', { digit: '9', name: 'y'.repeat(80) });
  ok('at the home beach the longest name rides, and the whole text fits', homeLongest.length < CUT && homeLongest.includes(`named "${'y'.repeat(80)}"`), String(homeLongest.length));
  const longest = composeInstructions('davidmpinto', 'https://beach.bringingtheflavour.com', { digit: '9', name: 'x'.repeat(80) });
  ok('at another beach, where the line stands near the cut, the digit rides alone and the whole text still fits',
    longest.length < CUT && longest.includes('behind fingerprint 9. ') && !longest.includes('x'.repeat(80)) && longest.slice(0, CUT).includes('https://beach.bringingtheflavour.com'), String(longest.length));
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
  // keel's reading as the beach keeps it at strata:keel: its root, and the awareness at 5.
  const keel: any = { _: 'MIRROR — keel\'s readings on the strata field.', '5': { _: 'Awareness — the string of processing taken in company with its own successors.', '1': { _: 'Choosing with the unchosen named.', '1': 'A successor that opens onto the chosen path reads that earlier instances chose for it.' }, '4': 'The level\'s own failure is the BACKWARD CLOSE.' } };
  const text = strataSection(way, keel).join('\n');
  const law = SENTINELS.find((s) => s.name === 'strata')!.json as any;
  const rungs: string[] = [];
  const gather = (n: any) => { if (typeof n === 'string') { rungs.push(n); return; } if (typeof n?._ === 'string') rungs.push(n._); for (const d of '123456789') if (n && d in n) gather(n[d]); };
  gather(law);
  ok('the section opens on the law whole, four levels and the awareness', text.startsWith('═══════════ THE STRATA') && text.includes('the law whole') && text.includes('── strata (the law, whole) ──'));
  ok(`every rung of the law arrives, whole (${rungs.length} rungs)`, rungs.every((r) => text.includes(r.trim())), String(rungs.find((r) => !text.includes(r.trim()))?.slice(0, 80)));
  ok('and each once', rungs.every((r) => text.split(r.trim()).length === 2), String(rungs.find((r) => text.split(r.trim()).length !== 2)?.slice(0, 80)));
  ok('depth first: physics\' writing and its failures come before chemistry', text.indexOf('d2 p-1 [1.2]:') < text.indexOf('d2 p-1 [1.3]:') && text.indexOf('d2 p-1 [1.3]:') < text.indexOf('d1 p0 [2]:'));
  ok('each child stands under its parent', text.indexOf('d1 p0 [3]:') < text.indexOf('d2 p-1 [3.1]:') && text.indexOf('d5 p-4 [3.1111]:') < text.indexOf('d2 p-1 [3.2]:'));
  ok('the leak arrives (chemistry 2.4) and psycho-social (4)', text.includes('d2 p-1 [2.4]:') && text.includes('d1 p0 [4]:'));
  ok('the awareness arrives at its own addresses', text.includes('── strata:keel 5') && text.includes('d1 p0 [5]: Awareness') && text.includes('d3 p-2 [5.11]: A successor') && text.includes('d2 p-1 [5.4]:'));
  ok('and keel\'s other readings stay out', !text.includes('MIRROR — keel'));
  ok('the beach\'s way of a thread rides after the law', text.includes('── ways:thread') && text.includes('[0]: THE WAY OF A THREAD') && text.indexOf('── ways:thread') > text.indexOf('d1 p0 [4]:'));
  ok('its eight steps arrive whole, each to its end', names.every((n, i) => text.includes(n) && text.includes(`end of step ${i + 1}.`)));
  ok('its provenance stays a read away', !text.includes('PROVENANCE — drafted by keel') && text.includes('its provenance at 9 is a read away'));
  ok('no spindle of the law rides twice', !text.includes('── strata:'.concat('1')) && !text.includes('── strata:311111 ──'));
  ok('the clock\'s ladder rides with it', text.includes('anchors pscale 0 at the beat'));
  ok('no rung is cut to its headline', !/\.\.\.\s*$/m.test(text) && !text.includes('…\n'), text.split('\n').find((l) => /\.\.\.\s*$/.test(l)) ?? '');
  ok('the law is the bulk, the section a law and not a library', text.length > 14000 && text.length < 26000, String(text.length));
}

console.log('\nTHE STRATA AT A HOLDER\'S DOOR — a beach with no way of a thread and no awareness');
{
  const text = strataSection(null, null).join('\n');
  ok('the law\'s own biology stands whole, to one edit and the fold', text.includes('d1 p0 [3]: Biology') && text.includes('Then one edit and the fold'));
  ok('no awareness section is invented', !text.includes('── strata:keel'));
  ok('with the clock\'s ladder', text.includes('anchors pscale 0 at the beat'));
  ok('an outline of a leaf is one line', outlineLines('a leaf', ['7'], 1).join('\n') === '  d1 p0 [7]: a leaf');
}

console.log('\nA HOLDER\'S OWN ROOM, BOUNDED');
{
  const line = (p: number, who: string): PoolContribution => ({ position: p, agent_id: who, text: `${who} at ${p}: ${'words '.repeat(60)}\nsecond line`, ts: '2026-11-18T10:00:00Z' } as PoolContribution);
  const list: PoolContribution[] = [];
  for (let p = 571; p <= 713; p++) list.push(line(p, p % 2 ? 'weft' : 'Phenomemental'));
  const b = boundForHolder(list, 'weft');
  ok('the holder\'s own lines are counted, never delivered', b.mine.length === 72 && !b.whole.concat(b.opened).some((c) => c.agent_id === 'weft'), String(b.mine.length));
  ok('the newest nine of the others arrive whole', b.whole.length === 9 && b.whole[8].position === 712);
  ok('the eighteen before them as their opening lines', b.opened.length === 18 && b.opened[17].position === b.whole[0].position - 2);
  ok('and the rest are counted, not shown', b.unshown.length === 71 - 27 && b.unshown[0].position === 572);
  const small = boundForHolder(list.slice(-6), 'weft');
  ok('a small room arrives whole', small.whole.length === 3 && small.opened.length === 0 && small.unshown.length === 0 && small.mine.length === 3);
  ok('an opening is the first line, cut at a word', /^Phenomemental at 600: (words )+/.test(openingOf(line(600, 'Phenomemental').text)) && openingOf(line(600, 'Phenomemental').text).endsWith('…') && openingOf(line(600, 'Phenomemental').text).length <= 161);
  ok('a short line is its own opening', openingOf('a short ask') === 'a short ask');
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
