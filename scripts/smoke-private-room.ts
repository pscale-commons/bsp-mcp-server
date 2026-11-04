/**
 * smoke-private-room.ts — THE PRIVATE ROOM: step 3 of coloured stigmergy
 * (proposals/2026-11-03-coloured-stigmergy-the-design.md §2.3, §3.4, §4.1; §11 item 3).
 *
 * Against ONE real beach, with throwaway words: the package's own handler spawned
 * on a scratch folder (pscale-beach's scripts/local-beach.mjs; BEACH_DIR names the
 * checkout, default ../pscale-beach), or a live beach named by BEACH_URL — the lab
 * run of §9 — whose probe blocks are wiped at the end.
 *
 *   - a keeper founds colour:<name> and admits members (the colour of step 2);
 *   - a member says a coloured line in a room through pscale_pool_engage (a commit
 *     and a stage) and at a mirror through pscale_stream_engage (a say with
 *     options, and a kept fold): the WORDS are sealed one zero deeper, at the
 *     line's underscore, and the author, address, stamp and face stay open, so
 *     the room's slots and presence stand as they do today;
 *   - a member with the colour reads the words in the room's own shapes — the
 *     engage, the fold, the liquid, bsp()'s disc and walk — keyed once with their
 *     one word and then with no key passed; one without the colour reads the
 *     grey line with the colour's name and turn; a stranger reads the grey line
 *     and nothing more, in every shape but the whole block, which stays byte-true;
 *   - the room's synthesis note says how many voices stayed sealed, and the
 *     stream's snapshot says the same of its lines;
 *   - a stranger's letter to the colour works in a room: every holder reads it,
 *     its writer cannot;
 *   - a turn shuts one member out of new lines and not old, in the room and at
 *     the mirror;
 *   - COUNTED, NEVER TIMED: derivations through keys.ts's counter, copies opened
 *     through a wrapper on nacl.box.open — one derivation a session, one copy a
 *     turn, none for a hand the ring does not name.
 *
 *   npm run smoke:private-room
 *   BEACH_URL=https://beach.idiothuman.com npm run smoke:private-room
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import nacl from 'tweetnacl';
import { derivations, forgetDerived, isGrayEnvelope, grayMode } from '../src/keys.js';
import { handleBsp } from '../src/tools/bsp.js';
import { handleKeyPublish } from '../src/tools/keys.js';
import { handlePoolEngage } from '../src/tools/pool.js';
import { handleStreamEngage } from '../src/tools/stream.js';
import { declareHand, resetLooks } from '../src/looks.js';
import { loadBlock } from '../src/db.js';

let pass = 0, fail = 0;
const failures: string[] = [];
function check(label: string, cond: boolean, got?: unknown): void {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; failures.push(label); console.log(`  ✗ ${label}${got === undefined ? '' : `\n      got: ${String(typeof got === 'string' ? got : JSON.stringify(got)).slice(0, 700)}`}`); }
}
function isSpineLegal(node: any): boolean {
  if (node === null || typeof node !== 'object') return true;
  if (Array.isArray(node)) return false;
  return Object.keys(node).every((k) => (k === '_' || /^[1-9]$/.test(k)) && isSpineLegal(node[k]));
}

// copies opened (and letters), counted on the one function both go through
const opens = { box: 0 };
const realBoxOpen = nacl.box.open;
nacl.box.open = ((...a: Parameters<typeof realBoxOpen>) => { opens.box++; return realBoxOpen(...a); }) as typeof realBoxOpen;

// ── the beach ──
const LIVE = process.env.BEACH_URL?.replace(/\/+$/, '');
const BEACH_DIR = process.env.BEACH_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'pscale-beach');
const PORT = 8941 + Math.floor(Math.random() * 100);
const BEACH = LIVE ?? `http://localhost:${PORT}`;
const W = `${BEACH}/.well-known/pscale-beach`;
let beachProc: ChildProcess | null = null;
let scratch: string | null = null;
async function startBeach(): Promise<void> {
  if (LIVE) return;
  const script = join(BEACH_DIR, 'scripts', 'local-beach.mjs');
  if (!existsSync(script)) { console.error(`no pscale-beach checkout at ${BEACH_DIR}: set BEACH_DIR to one, or BEACH_URL to a live beach`); process.exit(2); }
  scratch = mkdtempSync(join(os.tmpdir(), 'private-room-'));
  beachProc = spawn('node', [script, '--dir', scratch, '--port', String(PORT), '--origin', `localhost:${PORT}`], { stdio: ['ignore', 'ignore', 'inherit'] });
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(W)).ok) return; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('the local beach did not come up');
}
function stopBeach(): void {
  beachProc?.kill();
  if (scratch) rmSync(scratch, { recursive: true, force: true });
}
const raw = async (block: string): Promise<any> => (await loadBlock(BEACH, block))?.block ?? null;
async function wipe(block: string, secret?: string): Promise<boolean> {
  const r = await fetch(`${W}?block=${encodeURIComponent(block)}`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirm: true, ...(secret ? { secret } : {}) }) });
  return r.ok;
}

// ── the people and the places ──
const stamp = Date.now().toString(36);
const NAME = `probe-${stamp}`;
const COLOUR = `colour:${NAME}`;
const ROOM = NAME;                       // pool:<ROOM>, liquid:pool:<ROOM>
const POOL = `pool:${ROOM}`;
const LIQUID = `liquid:pool:${ROOM}`;
const FIELD = `probe${stamp}`;           // spine:<FIELD>, <FIELD>:<handle>, the fold at <FIELD>
// A MEMBER MEETS ONE WORD (§4.2): the latch the beach checks and the sealing
// word the copy opens with are one word here, as the room and stream tools take
// one `secret` — the keyed form of step 2's battery keeps them apart through bsp().
const person = (tag: string) => { const word = `one word of ${tag} ${stamp}`; return { handle: `${tag}${stamp}`, latch: word, word, session: `s-${tag}-${stamp}` }; };
const keeper = person('k'), a = person('a'), b = person('b'), c = person('c'), d = person('d');
const stranger = { handle: `stranger${stamp}`, session: `s-stranger-${stamp}` };
const KEEPERS_LATCH = `the keepers latch ${stamp}`;
const bsp = async (session: string, p: Record<string, unknown>) =>
  (await handleBsp({ agent_id: BEACH, ...p } as any, { sessionId: session })).content.map((x) => x.text).join('\n');
const room = async (who: { handle: string; session: string }, p: Record<string, unknown>) =>
  (await handlePoolEngage({ agent_id: who.handle, pool_url: BEACH, pool_name: ROOM, ...p } as any, { sessionId: who.session })).content.map((x) => x.text).join('\n');
const mirror = async (who: { handle: string; session: string }, p: Record<string, unknown>) =>
  (await handleStreamEngage({ field: FIELD, handle: who.handle, beach: BEACH, ...p } as any, { sessionId: who.session })).content.map((x) => x.text).join('\n');
const grey = (turn: string) => `sealed · colour · ${NAME} · turn ${turn}`;
const greyRe = (turn: string) => new RegExp(`${grey(turn).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} · \\d+ bytes`);
const noCipher = (text: string, ...envs: any[]) => envs.every((e) => e && !text.includes(e['1']) && !text.includes(e['2']));
const sealOf = (entry: any) => (entry && typeof entry === 'object' ? entry._ : null);
const isColourSeal = (env: any, turn: string) => isGrayEnvelope(env) && grayMode(env) === 'colour' && env['9']['2'] === COLOUR && env['9']['3'] === turn;
const count = (text: string, s: string) => text.split(s).length - 1;
/** SHOW=1 prints the shapes a reader is handed, to be judged as a reader would. */
const show = (label: string, text: string) => { if (process.env.SHOW) console.log(`\n──── ${label} ────\n${text}\n────`); };

async function main(): Promise<void> {
  resetLooks();
  await startBeach();
  console.log(`\nbeach: ${BEACH}${LIVE ? ' (live: probe blocks are wiped at the end)' : ' (the package\'s handler on a scratch folder)'}`);
  const founded: Array<[string, string | undefined]> = [];
  try {
    // ── 0. passports with published halves; a stranger with nothing ──
    console.log('\n0. five passports with published halves, and a stranger with nothing');
    for (const p of [keeper, a, b, c, d]) {
      declareHand(p.session, p.handle);
      const born = await bsp(p.session, { block: `passport:${p.handle}`, content: { _: `${p.handle}, a throwaway passport of the private-room smoke` }, new_lock: p.latch });
      founded.push([`passport:${p.handle}`, p.latch]);
      const pub = (await handleKeyPublish({ handle: p.handle, secret: p.latch, enc_secret: p.word, agent_id: BEACH }, { sessionId: p.session })).content[0].text;
      check(`${p.handle}: passport founded and keys published`, !/rejected/i.test(born) && /Keys published/.test(pub), [born, pub]);
    }

    // ── 1. the keeper founds the colour with its members ──
    console.log('\n1. the keeper founds the colour, latched whole, with four holders');
    derivations.count = 0; opens.box = 0;
    const found = await bsp(keeper.session, { block: COLOUR, members: [keeper.handle, a.handle, b.handle, c.handle], content: `the probe colour of ${stamp}: a readership of four, for the private-room smoke`, new_lock: KEEPERS_LATCH });
    founded.push([COLOUR, KEEPERS_LATCH]);
    check('founded: turn 1 with four copies', /founded, latched whole/.test(found) && /4 copies \(/.test(found) && derivations.count === 0, found);

    // ── 2. a member says a coloured line in the room: a commit and a stage ──
    console.log('\n2. a member founds the room and says a coloured line in it — a commit, then a stage — with one word');
    forgetDerived(a.session); derivations.count = 0; opens.box = 0;
    const said = await room(a, { purpose: `the probe room of ${stamp}: a private room beside ${COLOUR}, for the smoke`, contribution: 'the first coloured line in the room', gray: COLOUR, secret: a.word });
    founded.push([POOL, undefined]);
    console.log(`     the commit: ${derivations.count} derivation(s), ${opens.box} copy opened`);
    check('the room is founded and the commit lands sealed in the colour, turn 1', /created: pool authored/.test(said) && /committed: slot 1 → the pool/.test(said) && new RegExp(`sealed in ${COLOUR}, turn 1\\.`).test(said), said);
    check('the writer paid one derivation and opened their own copy once', derivations.count === 1 && opens.box === 1, [derivations.count, opens.box]);
    check('the writer reads their own line back as words in the same envelope', said.includes('the first coloured line in the room') && !said.includes('sealed ·'), said);
    let pool = await raw(POOL);
    const entry1 = pool?.['1'];
    check('the entry keeps its author, address and stamp open, its words sealed one zero deeper', isColourSeal(sealOf(entry1), '1') && entry1['1'] === a.handle && entry1['2'] === '' && /^\d{4}-\d{2}-\d{2}T/.test(String(entry1['3'])) && isSpineLegal(pool), entry1);
    const staged = await room(a, { submit: 'a staged intention in colour', gray: COLOUR });
    founded.push([LIQUID, undefined]);
    check('a stage lands sealed in the colour with no key passed: the colour is worn', /submitted: liquid slot 1/.test(staged) && new RegExp(`sealed in ${COLOUR}, turn 1`).test(staged) && derivations.count === 1 && opens.box === 1, staged);
    const liquid = await raw(LIQUID);
    const slot1 = liquid?.['1'];
    check('the liquid slot keeps its author and both stamps open, its words sealed one zero deeper', isColourSeal(sealOf(slot1), '1') && slot1['1'] === a.handle && typeof slot1['3'] === 'string' && typeof slot1['6'] === 'string' && isSpineLegal(liquid), slot1);
    check('the writer sees their staged words in the liquid mirror', staged.includes('a staged intention in colour') && /\(you\)/.test(staged), staged);

    // ── 3. a member with the colour reads the words in the room's shapes ──
    console.log('\n3. a member with the colour reads the words: the engage keyed once with one word, then with no key; the liquid; bsp()\'s disc and walk');
    forgetDerived(b.session); derivations.count = 0; opens.box = 0;
    const bRead = await room(b, { secret: b.word });
    show('a member\'s keyed engage of the room', bRead);
    console.log(`     the first keyed engage: ${derivations.count} derivation(s), ${opens.box} copy opened`);
    check('the engage shows the words under the open slot header', new RegExp(`## slot 1 — ${a.handle} \\d{4}-`).test(bRead) && bRead.includes('the first coloured line in the room') && !bRead.includes('sealed ·'), bRead);
    check('and the staged intention in the liquid, with its author and arrival', new RegExp(`- ${a.handle} \\(arrived \\d{4}-[^)]*\\): a staged intention in colour`).test(bRead), bRead);
    check('no voice stayed sealed, so nothing is said of it', !/stayed sealed/.test(bRead), bRead);
    check('one derivation, one copy opened: the colour is worn', derivations.count === 1 && opens.box === 1, [derivations.count, opens.box]);
    const bAgain = await room(b, {});
    check('with no key passed the words still read: the glasses are on', bAgain.includes('the first coloured line in the room') && bAgain.includes('a staged intention in colour') && derivations.count === 1 && opens.box === 1, bAgain);
    const bDisc = await bsp(b.session, { block: POOL, pscale_attention: 0 });
    check("bsp()'s disc of the room over the wire opens the entry's words in place, the slot's fields beneath it", bDisc.includes('the first coloured line in the room') && /beneath/.test(bDisc) && noCipher(bDisc, sealOf(entry1)), bDisc);
    const bWalk = await bsp(b.session, { block: POOL, spindle: '1' });
    check("bsp()'s walk to the entry opens the words", bWalk.includes('the first coloured line in the room') && !bWalk.includes('sealed ·'), bWalk);
    const bPoint = await bsp(b.session, { block: POOL, spindle: '1', pscale_attention: 0 });
    check("bsp()'s point at the entry: the words, the stamp beside them, the author and address beneath", bPoint.includes('the first coloured line in the room') && /beneath \(pscale -1\): 1\.1 · 1\.2/.test(bPoint), bPoint);
    check('still one derivation and one copy for the whole session', derivations.count === 1 && opens.box === 1, [derivations.count, opens.box]);

    // ── 4. the fold ──
    console.log('\n4. ten more coloured lines grow the room past nine: the fold shows the open container as words');
    for (let i = 2; i <= 11; i++) {
      const r = await room(a, { contribution: `coloured line ${i} in the room`, gray: COLOUR });
      if (!/committed: slot/.test(r)) { check(`line ${i} committed`, false, r); break; }
    }
    pool = await raw(POOL);
    check('the room supernested to floor 2 with every entry sealed one zero deeper', pool && typeof pool._ === 'object' && isColourSeal(sealOf(pool._?.['1']), '1') && isColourSeal(sealOf(pool['1']?.['1']), '1') && isSpineLegal(pool), Object.keys(pool ?? {}));
    const bFold = await room(b, { fold: true });
    check('the fold: the closed container owes its summary, the open container reads as words', /# Before this — 1 closed container/.test(bFold) && /01-09 \(9\) — unvoiced/.test(bFold) && /# The open container \(count: 2\)/.test(bFold) && bFold.includes('coloured line 11 in the room') && !bFold.includes('sealed ·'), bFold);
    const bDisc2 = await bsp(b.session, { block: POOL, pscale_attention: 0 });
    check("bsp()'s disc after the supernest still opens every entry in place", bDisc2.includes('the first coloured line in the room') && bDisc2.includes('coloured line 11 in the room') && !bDisc2.includes('sealed ·'), bDisc2);
    check('and the whole session is still one derivation', derivations.count === 1, derivations.count);

    // ── 5. a member without the colour, and a stranger ──
    console.log('\n5. a holder of keys outside the ring reads the grey line, no derivation; a stranger reads the grey line and nothing more');
    // A commit consumes its author's staged intention, so a stages once more,
    // the colour worn, before the others read the liquid.
    check('a stages again, the colour worn', /submitted: liquid slot 1/.test(await room(a, { submit: 'a staged intention in colour', gray: COLOUR })));
    forgetDerived(d.session); derivations.count = 0; opens.box = 0;
    const dRead = await room(d, { secret: d.word });
    const envs = [sealOf(pool._?.['1']), sealOf(pool['1']?.['1']), sealOf(slot1)];
    check(`outside the ring: every voice is ${grey('1')} · <bytes>, the authors and stamps open`, count(dRead, grey('1')) >= 11 && greyRe('1').test(dRead) && new RegExp(`## slot 1 — ${a.handle} \\d{4}-`).test(dRead) && noCipher(dRead, ...envs), dRead);
    check('no derivation for a hand the ring does not name', derivations.count === 0 && opens.box === 0, [derivations.count, opens.box]);
    check('the synthesis is told how many voices stayed sealed', /\(11 of these voices are sealed in a colour you do not wear[^)]*say that 11 stayed sealed/.test(dRead), dRead);
    check('and the liquid says its staged line is sealed too', greyRe('1').test(dRead.slice(dRead.indexOf('# Liquid'), dRead.indexOf('# Contributions'))) && /1 of these is sealed in a colour you do not wear/.test(dRead), dRead);
    const sRead = await room(stranger, {});
    show('a stranger\'s engage of the room', sRead);
    check('a stranger with no key: the grey line everywhere, nothing else', count(sRead, grey('1')) >= 12 && !sRead.includes('coloured line') && noCipher(sRead, ...envs), sRead);
    const sDisc = await bsp(stranger.session, { block: POOL, pscale_attention: 0 });
    check("bsp()'s disc over the wire: the grey line, drawn from the note", sDisc.includes(grey('1')) && noCipher(sDisc, ...envs), sDisc);
    const sWalk = await bsp(stranger.session, { block: POOL, spindle: '11' });
    check("bsp()'s walk: the grey line with its bytes", greyRe('1').test(sWalk) && noCipher(sWalk, ...envs), sWalk);
    const sDesc = await bsp(stranger.session, { block: POOL, spindle: '11', pscale_attention: -1 });
    check('a descent beneath the entry lists its open fields and never the envelope', sDesc.includes(grey('1')) && /11\.1/.test(sDesc) && !/11\.0/.test(sDesc) && noCipher(sDesc, ...envs), sDesc);
    const sFine = await bsp(stranger.session, { block: POOL, pscale_attention: -2 });
    check("the disc two pscales finer never lists the envelope's ciphertext, nonce or marker", noCipher(sFine, ...envs) && !/\.0[129]\b/.test(sFine), sFine);
    const sWhole = await bsp(stranger.session, { block: POOL, spindle: '0' });
    check('the whole block, named, is byte-true', sWhole.startsWith(`[whole block]\n${JSON.stringify(pool, null, 2)}`), sWhole.slice(0, 200));

    // ── 6. a letter in the room ──
    console.log('\n6. a stranger\'s letter to the colour, said in the room: every holder reads it, its writer cannot');
    const letter = await room(stranger, { contribution: 'a letter to the colour from someone with no copy', gray: COLOUR });
    // Eleven lines stand at 1-9, 11 and 12 (10 is the zero slot), so the letter is the thirteenth.
    check('the commit lands as a letter, and says the writer cannot read it back', /committed: slot 13/.test(letter) && new RegExp(`sealed as a letter to ${COLOUR}, turn 1`).test(letter) && /cannot read it back/.test(letter), letter);
    pool = await raw(POOL);
    const letterEnv = sealOf(pool['1']?.['3']);
    check("the letter is a colour envelope at the entry's underscore, the writer's one-off half at 9.4, the author open", isColourSeal(letterEnv, '1') && typeof letterEnv['9']['4'] === 'string' && pool['1']['3']['1'] === stranger.handle, pool['1']?.['3']);
    check('its writer reads it grey', (await room(stranger, { since_position: 12 })).includes(grey('1')));
    const bLetter = await room(b, { since_position: 12 });
    check('a holder reads the letter as words with no key passed', bLetter.includes('a letter to the colour from someone with no copy'), bLetter);

    // ── 7. the mirror ──
    console.log('\n7. at a mirror: a coloured say with options, read by a member as words and by a stranger as grey lines; a fold kept in the colour');
    const spine = await bsp(keeper.session, { block: `spine:${FIELD}`, content: { _: `the probe spine of ${stamp}, for the private-room smoke`, '1': { _: 'the first point' }, '2': { _: 'the second point' }, '3': { _: 'the third point' } } });
    founded.push([`spine:${FIELD}`, undefined]);
    check('the spine is framed', /wrote block/.test(spine), spine);
    derivations.count = 0; opens.box = 0;
    const aSay = await mirror(a, { at: '1', say: 'a coloured reading at point one', gray: COLOUR, secret: a.word });
    founded.push([`${FIELD}:${a.handle}`, a.word]);
    check('the say lands in the colour, the mirror born', new RegExp(`✓ your reading landed at ${FIELD}:${a.handle} at 1`).test(aSay) && new RegExp(`sealed in ${COLOUR}, turn 1\\.`).test(aSay) && /new: this write created/.test(aSay) && derivations.count === 0, aSay);
    const mirrorA = await raw(`${FIELD}:${a.handle}`);
    check("the mirror's line is {_: envelope}: the words one zero deeper, the address open", mirrorA && isColourSeal(sealOf(mirrorA['1']), '1') && Object.keys(mirrorA['1']).join('') === '_' && isSpineLegal(mirrorA), mirrorA?.['1']);
    check('the speaker reads their own line back as words', new RegExp(`- 1 · ${a.handle} \\(you\\): a coloured reading at point one`).test(aSay), aSay);
    const bAt1 = await mirror(b, { at: '1' });
    check('a member wearing the colour reads the line as words, no key passed', new RegExp(`- 1 · ${a.handle}: a coloured reading at point one`).test(bAt1) && !bAt1.includes('sealed ·') && !/stayed sealed/.test(bAt1), bAt1);
    const sAt1 = await mirror(stranger, { at: '1' });
    show('a stranger\'s read at the mirror', sAt1);
    check('a stranger reads the grey line, and is told one line stayed sealed', new RegExp(`- 1 · ${a.handle}: ${grey('1').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} · \\d+ bytes`).test(sAt1) && /\(1 of these lines is sealed in a colour you do not wear/.test(sAt1) && noCipher(sAt1, sealOf(mirrorA['1'])), sAt1);
    const aOpts = await mirror(a, { at: '2', say: 'an act with two options', options: ['the first option', 'the second option'], gray: COLOUR, secret: a.word });
    check('a say with options lands sealed, the options at 2.1 and 2.2', /✓ 2 options beneath it, at 2\.1, 2\.2/.test(aOpts) && new RegExp(`sealed in ${COLOUR}, turn 1\\.`).test(aOpts), aOpts);
    const mirrorA2 = (await raw(`${FIELD}:${a.handle}`))?.['2'];
    check('the options are sealed one zero deeper too, each a line of its own', isColourSeal(sealOf(mirrorA2), '1') && isColourSeal(sealOf(mirrorA2?.['1']), '1') && isColourSeal(sealOf(mirrorA2?.['2']), '1'), mirrorA2);
    const bAt2 = await mirror(b, { at: '2' });
    show('a member\'s read of the act with options', bAt2);
    check('a member reads the act and both options as words', bAt2.includes('2 · ' + a.handle + ': an act with two options') && bAt2.includes('2.1 · ' + a.handle + ': the first option') && bAt2.includes('2.2 · ' + a.handle + ': the second option'), bAt2);
    const sAt2 = await mirror(stranger, { at: '2' });
    check('a stranger reads three grey lines at 2, 2.1 and 2.2', count(sAt2, grey('1')) === 3 && /3 of these lines are sealed/.test(sAt2), sAt2);
    forgetDerived(c.session); derivations.count = 0; opens.box = 0;
    const cKeep = await mirror(c, { at: '1', keep: 'collective', keep_text: 'the fold of point one, kept in the colour', gray: COLOUR, secret: c.word });
    founded.push([FIELD, undefined]);
    console.log(`     a member's first keyed engage, keeping a fold: ${derivations.count} derivation(s), ${opens.box} copy opened`);
    check('a fold kept in the colour: one derivation, one copy, the line read as words on the way', new RegExp(`✓ fold kept at ${FIELD}:1`).test(cKeep) && new RegExp(`sealed in ${COLOUR}, turn 1\\.`).test(cKeep) && cKeep.includes('a coloured reading at point one') && derivations.count === 1 && opens.box === 1, cKeep);
    const foldBlock = await raw(FIELD);
    check('the kept fold stands one zero deeper at the bare field', isColourSeal(sealOf(foldBlock?.['1']), '1'), foldBlock?.['1']);
    const bFoldRead = await mirror(b, { at: '1' });
    check('a member reads the standing fold as words', /# The fold standing at 1/.test(bFoldRead) && bFoldRead.includes('the fold of point one, kept in the colour'), bFoldRead);
    const sFoldRead = await mirror(stranger, { at: '1' });
    check('a stranger reads the standing fold as the grey line', /# The fold standing at 1/.test(sFoldRead) && greyRe('1').test(sFoldRead.slice(sFoldRead.indexOf('# The fold standing'), sFoldRead.indexOf('# Readings'))) && !sFoldRead.includes('kept in the colour'), sFoldRead);

    // ── 8. the turn ──
    console.log('\n8. the keeper turns the colour to shut one member out: old lines open for them, no new one, in the room and at the mirror');
    const turned = await bsp(keeper.session, { block: COLOUR, members: [keeper.handle, a.handle, b.handle], secret: KEEPERS_LATCH });
    check('turned: turn 2, three copies, c shut out of every new line', /turned → turn 2/.test(turned) && new RegExp(`shut out of every new line: ${c.handle}`).test(turned), turned);
    // A new turn is a new copy to open, so the word is passed once more; the
    // pair is kept for the session, so it costs no derivation. The letter at 13
    // is opened again by every read of the slice (a letter opens by box, as a
    // copy does), so the count of opens says copy and letter.
    derivations.count = 0; opens.box = 0;
    const newLine = await room(a, { contribution: 'a room line of the second turn', gray: COLOUR, secret: a.word });
    // The letter at 13 is opened by box twice on a commit: once by the retry
    // check over the record, once by the envelope's own slice.
    check('a member says in the new turn: one copy opened, the letter read back twice, no derivation', /committed: slot 14/.test(newLine) && new RegExp(`sealed in ${COLOUR}, turn 2\\.`).test(newLine) && derivations.count === 0 && opens.box === 3, [derivations.count, opens.box, newLine.slice(0, 200)]);
    derivations.count = 0; opens.box = 0;
    const newSay = await mirror(a, { at: '3', say: 'a mirror line of the second turn', gray: COLOUR, secret: a.word });
    check('and at the mirror, the new turn worn: nothing opened, nothing derived', new RegExp(`sealed in ${COLOUR}, turn 2\\.`).test(newSay) && derivations.count === 0 && opens.box === 0, [newSay, derivations.count, opens.box]);
    pool = await raw(POOL);
    const turn2Env = sealOf(pool['1']?.['4']);
    check('the new line stands at 14, sealed in turn 2, its author open', isColourSeal(turn2Env, '2') && pool['1']['4']['1'] === a.handle, pool['1']?.['4']);
    derivations.count = 0; opens.box = 0;
    const cRoom = await room(c, { secret: c.word, since_position: 12 });
    check('the one shut out reads the letter of turn 1 as words and the new line as grey, told one stayed sealed; no derivation, no copy tried', cRoom.includes('a letter to the colour from someone with no copy') && greyRe('2').test(cRoom) && /\(1 of these voices is sealed/.test(cRoom) && noCipher(cRoom, turn2Env) && derivations.count === 0 && opens.box === 1, [cRoom, derivations.count, opens.box]);
    const cAt3 = await mirror(c, { at: '3', secret: c.word });
    check('and at the mirror reads the new line grey', greyRe('2').test(cAt3) && !cAt3.includes('a mirror line of the second turn'), cAt3);
    derivations.count = 0; opens.box = 0;
    const bRoom2 = await room(b, { secret: b.word, since_position: 12 });
    check('a member who stays reads both turns as words: one more copy (and the letter), no derivation', bRoom2.includes('a letter to the colour from someone with no copy') && bRoom2.includes('a room line of the second turn') && !bRoom2.includes('sealed ·') && derivations.count === 0 && opens.box === 2, [bRoom2, derivations.count, opens.box]);
    const bAt3 = await mirror(b, { at: '3' });
    check('and the new mirror line, with no key passed', bAt3.includes('a mirror line of the second turn'), bAt3);
    const sWhole2 = await bsp(stranger.session, { block: POOL, spindle: '0' });
    check('the whole block is still byte-true', sWhole2.startsWith(`[whole block]\n${JSON.stringify(await raw(POOL), null, 2)}`));
  } finally {
    const wiped: string[] = [];
    for (const [name, secret] of founded) { try { if (await wipe(name, secret)) wiped.push(name); } catch { /* left standing */ } }
    console.log(`\nwiped ${wiped.length} of ${founded.length} probe blocks${wiped.length < founded.length ? `: left standing ${founded.map(([n]) => n).filter((n) => !wiped.includes(n)).join(', ')}` : ''}`);
    stopBeach();
  }
  console.log(`\n${fail === 0 ? '✓' : '✗'} private room: ${pass} passed, ${fail} failed`);
  if (fail) { failures.forEach((f) => console.log(`   - ${f}`)); process.exit(1); }
}

main().catch((e) => { console.error(e); stopBeach(); process.exit(2); });
