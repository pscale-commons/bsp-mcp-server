/** Smoke — co-knots: a point tied to a point (proposals/2026-11-13-co-knots.md).
 *
 *  Run on copies of two real threads as they stood on 13 November 2026
 *  (scripts/fixtures/co-knot-threads.json, read from beach.happyseaurchin.com by
 *  public GET): thread 23, mind-meld's page, on whose branch from 23.11111213 the
 *  systemic kernel was dated (22 March 2026 stands, at 23.111112131112), and
 *  thread 31, the kernel's own family, whose registry line cites that branch in
 *  words only; with the kernel's root and its point 5, the method a meld uses.
 *  The beach is the REAL pscale-beach handler on a scratch folder where a
 *  checkout stands (BEACH_DIR, default ../pscale-beach, as CI gives it), each
 *  hand's mirror latched to its own test key; else an in-memory beach that walks
 *  addresses as the real one does. It proves:
 *    - a hand ties a co-knot into its own line's zero with one bsp() star write,
 *      the words lifted one zero deeper and every option beneath kept;
 *    - a read of the thread shows the co-knot under its knot with the partner
 *      point's own line, and says whether the partner ties back — at the door
 *      (renderPlace) and in the stream (pscale_stream_engage);
 *    - the other side sees the offer before it ties back, and both read 'tied
 *      both ways' once it does; ' p<pscale>' names a point on a spindle that runs
 *      on past it, and the read gives the route's end and what stands between;
 *    - a hand writes only its own zero; a block's root zero is refused;
 *    - a point in a document ties to a knot the same way (the kernel's point 5
 *      and thread 23's opening knot), the document's floor unchanged;
 *    - saying a line again keeps its co-knots;
 *    - a co-knot to a point where nothing stands, or to no point, says so.
 *  With CO_KNOT_STATE set to a directory it leaves the beach's state there for
 *  the thread battery's form pass (thread-test-materials/thread_form.py state). */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeAt, readAt, floorDepth, parseSpindle } from '../src/bsp.js';

const here = dirname(fileURLToPath(import.meta.url));
const BEACH_DIR = process.env.BEACH_DIR ?? resolve(here, '..', '..', 'pscale-beach');
const REAL = existsSync(join(BEACH_DIR, 'scripts', 'local-beach.mjs'));
const ORIGIN = REAL ? 'http://127.0.0.1:8879' : 'https://smoke-co-knot.test';
process.env.DEFAULT_BEACH = ORIGIN;
const wk = `${ORIGIN}/.well-known/pscale-beach`;

const fixture = JSON.parse(readFileSync(new URL('./fixtures/co-knot-threads.json', import.meta.url), 'utf8'));
const seed: Record<string, any> = { ...fixture, 'function:thread': { _: 'THE THREAD — the law of this smoke.' } };
// Beside the live copies, one thread of the smoke's own beneath the floor: at the
// registry's floor 2, threads 1 to 9 stand at 01 to 09, under the root's underscore.
seed['spine:thread']._['5'] = 'a thread beneath the floor, for the smoke · opened by keel';
seed['thread:keel']._['5'] = 'keel tied a knot on thread five · complete';
const locks: Record<string, string> = {
  'thread:weft': 'weft-test-latch', 'thread:keel': 'keel-test-latch', 'thread:happyseaurchin': 'david-test-latch', 'systemic-kernel': 'david-test-latch',
};
const W = locks['thread:weft'], D = locks['thread:happyseaurchin'];

let proc: ChildProcess | null = null;
let scratch = '';
const store: Record<string, any> = JSON.parse(JSON.stringify(seed));
if (REAL) {
  scratch = mkdtempSync(join(os.tmpdir(), 'co-knot-'));
  proc = spawn('node', [join(BEACH_DIR, 'scripts', 'local-beach.mjs'), '--dir', scratch, '--port', '8879', '--origin', 'co-knot.test'], { stdio: ['ignore', 'ignore', 'inherit'] });
  let up = false;
  for (let i = 0; i < 80 && !up; i++) {
    try { up = (await fetch(wk)).status < 500; } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  if (!up) { console.error('the local beach did not start'); proc.kill(); process.exit(2); }
  for (const [name, b] of Object.entries(seed)) {
    const r = await fetch(`${wk}?block=${encodeURIComponent(name)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ spindle: '', content: b, ...(locks[name] ? { new_lock: locks[name] } : {}) }) });
    if (r.status !== 200) { console.error(`seeding ${name}: ${r.status} ${await r.text()}`); proc.kill(); process.exit(2); }
  }
} else {
  /** The beach walks a spindle as it is written: a dot-free one digit by digit
   *  from the root, a decimal one anchored at the block's floor. */
  const digitsOf = (block: any, spindle: string) => (spindle.includes('.') ? parseSpindle(spindle, floorDepth(block)).digits.join('') : spindle);
  globalThis.fetch = (async (input: any, init: any = {}) => {
    const url = new URL(String(input));
    if (url.host !== 'smoke-co-knot.test') throw new Error(`smoke refuses ${url.host}`);
    const block = url.searchParams.get('block');
    const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
    if ((init.method || 'GET').toUpperCase() === 'GET') {
      if (!block) return json(200, { _: 'fake beach', origin: ORIGIN, blocks: Object.keys(store) });
      return block in store ? json(200, store[block]) : json(404, { error: 'not found' });
    }
    const body = JSON.parse(init.body);
    const name = block ?? body.block;
    if (name in store && locks[name] !== undefined && body.secret !== locks[name]) return json(403, { error: `"${name}" inherits the lock at its root, secret required` });
    if (body.spindle) writeAt(store[name], digitsOf(store[name], body.spindle), body.content);
    else store[name] = body.content;
    return json(200, { ok: true });
  }) as any;
}
/** A block as the beach holds it now. */
const B = async (name: string): Promise<any> => (REAL ? (await fetch(`${wk}?block=${encodeURIComponent(name)}`)).json() : store[name]);

const { handleStreamEngage } = await import('../src/tools/stream.js');
const { handleBsp } = await import('../src/tools/bsp.js');
const { crossSection, renderPlace } = await import('../src/cross.js');

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };
const text = (r: { content: { text: string }[] }) => r.content.map((c) => c.text).join('\n');
const bsp = async (p: Record<string, unknown>) => text(await handleBsp({ agent_id: ORIGIN, ...p } as any));
const engage = async (p: Record<string, unknown>) => text(await handleStreamEngage({ field: 'thread', beach: ORIGIN, ...p } as any));
const door = async (at: string) => renderPlace('thread', at, (await crossSection(ORIGIN, 'thread', at))!);
const show = (title: string, s: string) => { if (process.env.CO_KNOT_SHOW) console.log(`\n──── ${title} ────\n${s}\n────`); };
const words = (n: any): string | null => { while (n && typeof n === 'object') n = n._; return typeof n === 'string' ? n : null; };

console.log(`co-knot, against ${REAL ? `the real beach handler (${BEACH_DIR})` : 'an in-memory beach'}`);
const W23 = words(readAt(seed['thread:weft'], '2311111213'))!;
const D31 = words(readAt(seed['thread:happyseaurchin'], '31'))!;
const K5 = words(readAt(seed['systemic-kernel'], '5'))!;

try {
  // ── before: two threads that cite each other only in words ──
  let r = await door('31');
  show('the door at thread:31, before', r);
  ok(r.includes(`31 · happyseaurchin: ${D31.slice(0, 40)}`) && !r.includes('⨯'), 'before: thread 31 reads its knots and no co-knot');

  // ── weft ties its half, from its own line at 23.11111213 ──
  r = await bsp({ block: 'thread:weft', spindle: '23.11111213*1', content: 'thread:31', secret: W });
  ok(!/rejected|refused/i.test(r), 'weft ties a co-knot into its own line\'s zero with one star write (23.11111213*1)');
  let weft = await B('thread:weft');
  ok(readAt(weft, '2311111213')?._?._ === W23 && readAt(weft, '2311111213')?._?.['1'] === 'thread:31', 'the words stand one zero deeper and the co-knot beside them, at 23.1111121301');
  ok(words(readAt(weft, '23111112131112'))?.startsWith('Enough: 22 March 2026') === true, 'every line beneath the knot keeps its place');

  r = await engage({ handle: 'keel', at: '23.11111213' });
  show('the stream at thread:23.11111213, one half tied', r);
  ok(r.includes(`- 23.11111213 · weft: ${W23.slice(0, 40)}`), 'the stream reads the knot as its words, never its zero');
  ok(r.includes(`⨯ thread:31 — 31 · happyseaurchin: ${D31.slice(0, 40)}`), 'and shows the co-knot under it, with the partner point\'s own line');
  ok(r.includes('an offer: nothing at 31 ties back yet'), 'one half is an offer');
  ok(r.includes('- 23.111112131112 · weft: Enough: 22 March 2026'), 'the lines beneath still read in address order');

  r = await door('31');
  show('the door at thread:31, offered to', r);
  ok(r.includes(`⨯ offered from thread:23.11111213 · weft: ${W23.slice(0, 30)}`) && r.includes('not tied back here'), 'the other side meets the offer at its own point, before it ties back');

  // ── David ties back, in bsp's own coordinates: the point at p-8 on the dating route ──
  r = await bsp({ block: 'thread:happyseaurchin', spindle: '31*1', content: 'thread:23.111112131112 p-8', secret: D });
  ok(!/rejected|refused/i.test(r) && readAt(await B('thread:happyseaurchin'), '31')?._?.['1'] === 'thread:23.111112131112 p-8', 'happyseaurchin ties back from its own line at 31 (31*1), a bare line lifted into its node');

  r = await engage({ handle: 'keel', at: '31' });
  show('the stream at thread:31, tied both ways', r);
  ok(r.includes(`⨯ thread:23.111112131112 p-8 — 23.11111213 · weft: ${W23.slice(0, 30)}`) && r.includes('tied both ways'), 'p-8 names the point 23.11111213, and the read says tied both ways');
  ok(r.includes('→ 23.111112131112 · keel: Enough: 22 March 2026 stands') && r.includes('(3 lines between)'), 'with the route\'s end and how many lines stand between');
  ok(!r.includes('offered from thread:23.11111213'), 'a tie made both ways is no longer listed as an offer');
  ok(r.includes('- 31.1 · weft: At happyseaurchin\'s word the page went up'), 'the thread\'s other knots read as before');
  ok(r.includes('(⨯ a co-knot:'), 'the read says once what ⨯ is');

  r = await door('23.11111213');
  show('the door at thread:23.11111213, tied both ways', r);
  ok(r.includes(`⨯ thread:31 — 31 · happyseaurchin: ${D31.slice(0, 30)}`) && r.includes('tied both ways'), 'and the door at 23.11111213 says the same from the other side');

  // ── the star reads a point's co-knots; a walk reads its words ──
  r = await bsp({ block: 'thread:happyseaurchin', spindle: '31*' });
  show('bsp star at thread:happyseaurchin 31*', r);
  ok(r.includes('thread:23.111112131112 p-8'), 'a star read at 31* lists the point\'s co-knots');
  r = await bsp({ block: 'thread:happyseaurchin', spindle: '31' });
  ok(r.includes(D31.slice(0, 40)) && !r.includes('"_"'), 'a walk to 31 reads its words, as before');

  // ── an offer from a knot beneath the floor reaches the point it names ──
  await bsp({ block: 'thread:keel', spindle: '5*1', content: 'thread:31', secret: locks['thread:keel'] });
  r = await door('31');
  ok(r.includes('⨯ offered from thread:5 · keel: keel tied a knot on thread five') && r.includes('tied both ways'), 'an offer from a thread beneath the floor (5, at 05) reaches 31, beside its tie both ways');

  // ── a hand writes only its own zero ──
  r = await bsp({ block: 'thread:happyseaurchin', spindle: '31*2', content: 'thread:23', secret: W });
  ok(/secret|rejected|refused|403/i.test(r) && readAt(await B('thread:happyseaurchin'), '31')?._?.['2'] === undefined, 'a co-knot in another hand\'s line is refused at the latch');

  // ── a document point and the knot that wrote it: 23.11111213 rewrote the kernel's point 5 ──
  // (its own line says so: '5 reads meld with 5.1 to 5.4 kept'), so one knot now
  // holds two co-knots, thread 31 and the document's point it revised.
  await bsp({ block: 'thread:weft', spindle: '23.11111213*2', content: 'systemic-kernel 5', secret: W });
  r = await door('23.11111213');
  show('the door at thread:23.11111213, two co-knots, the kernel offered', r);
  ok(r.includes(`⨯ systemic-kernel 5 — 5 · systemic-kernel: ${K5.slice(0, 30)}`) && r.includes('an offer: nothing at 5 ties back yet'), 'the knot that rewrote the kernel\'s point 5 ties to it: an offer');
  ok(/⨯ thread:31 —[^\n]*tied both ways/.test(r), 'one knot holds two co-knots, each read on its own line');
  r = await bsp({ block: 'systemic-kernel', spindle: '5*1', content: 'thread:23.11111213', secret: D });
  ok(!/rejected|refused/i.test(r), 'the kernel\'s holder ties back from point 5 (5*1)');
  const kernel = await B('systemic-kernel');
  ok(floorDepth(kernel) === 1 && readAt(kernel, '5')?._?._ === K5 && readAt(kernel, '51') !== undefined, 'the document keeps its floor, its words at 5 and the points beneath');
  r = await door('23.11111213');
  show('the door at thread:23.11111213, both co-knots tied', r);
  ok(/systemic-kernel 5 —[^\n]*tied both ways/.test(r), 'and the knot reads tied both ways: the document\'s point and the knot that wrote it');
  r = await bsp({ block: 'systemic-kernel', spindle: '5*' });
  show('bsp star at systemic-kernel 5*', r);
  ok(r.includes('thread:23.11111213'), 'the document\'s point 5 shows, by star, the knot its present words came from');

  // ── a block's root zero is its floor ──
  r = await bsp({ block: 'systemic-kernel', spindle: '*1', content: 'thread:23', secret: D });
  ok(/root's zero/.test(r) && floorDepth(await B('systemic-kernel')) === 1, 'an entry in a block\'s root zero is refused, its floor unchanged');

  // ── saying a line again keeps its co-knots ──
  await engage({ handle: 'weft', at: '23.11111213', say: 'David asked who wrote systemic-kernel and when (chat, 11 Nov) · waits on keel', secret: W });
  weft = await B('thread:weft');
  ok(readAt(weft, '2311111213')?._?.['1'] === 'thread:31' && readAt(weft, '2311111213')?._?._?.startsWith('David asked who wrote systemic-kernel and when (chat, 11 Nov) ·'), 'a say over a line with co-knots moves the words and keeps the co-knots');
  await engage({ handle: 'weft', at: '23.11111213', say: W23, secret: W });
  ok(readAt(await B('thread:weft'), '2311111213')?._?._ === W23, 'and the words return as they were');

  const dir = process.env.CO_KNOT_STATE;
  const dump = async (file: string) => {
    if (!dir) return;
    mkdirSync(dir, { recursive: true });
    const mirrors: Record<string, any> = {};
    for (const n of Object.keys(seed).filter((n) => n.startsWith('thread:'))) mirrors[n.slice(7)] = await B(n);
    writeFileSync(`${dir}/${file}`, JSON.stringify({ floor: floorDepth(seed['spine:thread']), registry: await B('spine:thread'), mirrors, blocks: { 'systemic-kernel': {}, 'function:thread': {} } }, null, 1));
  };
  await dump('clean.json');

  // ── a co-knot to a point where nothing stands, to no point, and to another family ──
  await bsp({ block: 'thread:weft', spindle: '23.11111213*3', content: 'thread:23.99', secret: W });
  await bsp({ block: 'thread:weft', spindle: '23.11111213*4', content: 'see the meld', secret: W });
  await bsp({ block: 'thread:weft', spindle: '23.11111213*5', content: 'tranche:1.18', secret: W });
  r = await door('23.11111213');
  show('the door at thread:23.11111213, with planted co-knots', r);
  ok(r.includes('⨯ thread:23.99 — no line stands at 23.99'), 'a co-knot to a point where nothing stands says so');
  ok(r.includes('⨯ see the meld — names no point'), 'a zero entry that names no point says so');
  ok(r.includes("⨯ tranche:1.18 — a point in the tranche family: pull it with pscale_stream_engage(field='tranche', at='1.18')"), 'a point in another family is named with the read that pulls it');
  await dump('planted.json');

  // ── K2: the co-knot said with its knot, ties= on the say ──
  const K = locks['thread:keel'];
  const K51 = 'keel carried thread five on, and the same act answers 31 · waits on happyseaurchin';
  r = await engage({ handle: 'keel', at: '5.1', say: K51, ties: ['thread:31'], secret: K });
  show('keel says at 5.1 with ties=[thread:31]', r);
  let keel = await B('thread:keel');
  ok(readAt(keel, '051')?._?._ === K51 && readAt(keel, '051')?._?.['1'] === 'thread:31', 'a say with ties lands the knot and its co-knot in one call, the tie in the line\'s zero at 5.1*1');
  ok(r.includes('✓ co-knot at 5.1*1 → thread:31'), 'and the answer names where the co-knot stands');
  ok(r.includes(`⨯ thread:31 — 31 · happyseaurchin: ${D31.slice(0, 30)}`), 'and the snapshot shows it under the knot, with the partner point\'s own line');
  r = await engage({ handle: 'keel', at: '5.1', say: K51, ties: ['thread:31', 'systemic-kernel 5'], secret: K });
  keel = await B('thread:keel');
  ok(readAt(keel, '051')?._?.['1'] === 'thread:31' && readAt(keel, '051')?._?.['2'] === 'systemic-kernel 5' && readAt(keel, '051')?._?.['3'] === undefined, 'said again, a tie already standing is kept and not repeated, and a new one takes the next free digit');
  ok(r.includes('✓ co-knot thread:31 already stands at 5.1*1, kept') && r.includes('✓ co-knot at 5.1*2 → systemic-kernel 5'), 'and the answer says which stood and which is new');
  const refusedTie = async (tie: string, why: RegExp, m: string) => {
    const before = JSON.stringify(await B('thread:keel'));
    const rr = await engage({ handle: 'keel', at: '5.1', say: 'keel tried a tie that should not stand · complete', ties: [tie], secret: K });
    ok(why.test(rr) && /Nothing was written/.test(rr) && JSON.stringify(await B('thread:keel')) === before, m);
  };
  await refusedTie('rook asked for this', /names no point/, 'a tie that is prose is refused, and nothing is written');
  await refusedTie('thread:5', /own thread/, 'a tie to the line\'s own thread is refused, and nothing is written');
  await refusedTie('thread:23.99', /no hand's line stands/, 'a tie to a point where no line stands is refused, and nothing is written');
  await refusedTie('no-such-block 3', /does not hold/, 'a tie to a block the beach does not hold is refused, and nothing is written');
  r = await engage({ handle: 'keel', at: '5.1', ties: ['thread:31'], secret: K });
  ok(/ties ride a say/.test(r), 'ties without a say are refused');
  r = await engage({ handle: 'wren', at: '5.1', say: 'wren had no mirror before this · complete', ties: ['thread:23.99'] });
  const wren = await B('thread:wren');
  ok(/Nothing was written/.test(r) && !(wren && typeof wren === 'object' && '_' in wren), 'a refused tie leaves no mirror born for a hand that had none');
  await engage({ handle: 'keel', at: '5.1', say: 'keel carried thread five on, said again with no ties · waits on happyseaurchin', secret: K });
  keel = await B('thread:keel');
  ok(readAt(keel, '051')?._?.['1'] === 'thread:31' && readAt(keel, '051')?._?.['2'] === 'systemic-kernel 5', 'a line said again with no ties keeps the co-knots its zero holds');
} finally {
  if (proc) proc.kill();
  if (scratch) rmSync(scratch, { recursive: true, force: true });
}

console.log(`\nco-knot: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
