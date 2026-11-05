/**
 * smoke-colour.ts — COLOUR IN THE CONNECTOR: step 2 of coloured stigmergy
 * (proposals/2026-11-03-coloured-stigmergy-the-design.md §2 to §4; §11 item 2).
 *
 * Against ONE real beach, with throwaway words: the package's own handler spawned
 * on a scratch folder (pscale-beach's scripts/local-beach.mjs, as its smoke-gate.mjs
 * runs it; BEACH_DIR names the checkout, default ../pscale-beach), or a live beach
 * named by BEACH_URL — the lab run of §9 — whose probe blocks are wiped at the end.
 *
 *   - a keeper founds colour:<name>, latched whole, holding its first turn, and
 *     admits three members by their published halves (pscale_key_publish as it
 *     stands today);
 *   - a member seals a line in the colour in a room (an append) and at a point
 *     (a write); a member with the colour reads the words, keyed once and then
 *     with no key passed, over the wire and on a walk; a member without it reads
 *     the grey line with the colour's name and turn; a stranger with no key reads
 *     the grey line and nothing more — no ciphertext in any shape;
 *   - the keeper turns the colour to shut one member out: that member opens
 *     every old line and no new one, and the others open both;
 *   - a stranger's letter to the colour, sealed with no key: every holder reads
 *     it, its writer cannot;
 *   - the whole block stays byte-true in JSON, and every envelope, turn and
 *     ring is spine-legal;
 *   - COUNTED, NEVER TIMED: derivations through keys.ts's counter, copies opened
 *     through a wrapper on nacl.box.open — one derivation a session, one copy
 *     opened per colour turn a session, none for a hand the ring does not name.
 *
 *   npm run smoke:colour
 *   BEACH_URL=https://beach.idiothuman.com npm run smoke:colour
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import nacl from 'tweetnacl';
import { derivations, forgetDerived, isGrayEnvelope, grayMode, selfEncrypt, GROUP_KEYRING_MARKER } from '../src/keys.js';
import { handleBsp } from '../src/tools/bsp.js';
import { handleKeyPublish } from '../src/tools/keys.js';
import { handleGrainReach } from '../src/tools/grain.js';
import { pairId, sideOf } from '../src/pscale-wire.js';
import { declareHand, resetLooks } from '../src/looks.js';
import { loadBlock } from '../src/db.js';

let pass = 0, fail = 0;
const failures: string[] = [];
function check(label: string, cond: boolean, got?: unknown): void {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; failures.push(label); console.log(`  ✗ ${label}${got === undefined ? '' : `\n      got: ${String(typeof got === 'string' ? got : JSON.stringify(got)).slice(0, 500)}`}`); }
}
function isSpineLegal(node: any): boolean {
  if (node === null || typeof node !== 'object') return true;
  if (Array.isArray(node)) return false;
  return Object.keys(node).every((k) => (k === '_' || /^[1-9]$/.test(k)) && isSpineLegal(node[k]));
}

// copies opened (and letters), counted on the one function both go through
const opens = { box: 0 };
const realBoxOpen = nacl.box.open;
nacl.box.open = Object.assign((...a: Parameters<typeof realBoxOpen>) => { opens.box++; return realBoxOpen(...a); }, { after: realBoxOpen.after }) as typeof realBoxOpen;

// ── the beach ──
const LIVE = process.env.BEACH_URL?.replace(/\/+$/, '');
const BEACH_DIR = process.env.BEACH_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'pscale-beach');
const PORT = 8841 + Math.floor(Math.random() * 100);
const BEACH = LIVE ?? `http://localhost:${PORT}`;
const W = `${BEACH}/.well-known/pscale-beach`;
let beachProc: ChildProcess | null = null;
let scratch: string | null = null;
async function startBeach(): Promise<void> {
  if (LIVE) return;
  const script = join(BEACH_DIR, 'scripts', 'local-beach.mjs');
  if (!existsSync(script)) { console.error(`no pscale-beach checkout at ${BEACH_DIR}: set BEACH_DIR to one, or BEACH_URL to a live beach`); process.exit(2); }
  scratch = mkdtempSync(join(os.tmpdir(), 'colour-'));
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

// ── the people ──
const stamp = Date.now().toString(36);
const COLOUR = `colour:probe-${stamp}`;
const ROOM = `pool:probe-${stamp}`;
const NOTES = `notes:probe-${stamp}`;
const person = (tag: string) => ({ handle: `${tag}${stamp}`, latch: `latch of ${tag} ${stamp}`, word: `sealing word of ${tag} ${stamp}`, session: `s-${tag}-${stamp}` });
const keeper = person('k'), a = person('a'), b = person('b'), c = person('c'), d = person('d');
const stranger = { session: `s-stranger-${stamp}` };
const KEEPERS_LATCH = `the keepers latch ${stamp}`;
const door = async (session: string, p: Record<string, unknown>) =>
  (await handleBsp({ agent_id: BEACH, ...p } as any, { sessionId: session })).content.map((x) => x.text).join('\n');
const grey = (turn: string) => `sealed · colour · probe-${stamp} · turn ${turn}`;
const noCipher = (text: string, ...envs: any[]) => envs.every((e) => !text.includes(e['1']) && !text.includes(e['2']));

async function main(): Promise<void> {
  resetLooks();
  await startBeach();
  console.log(`\nbeach: ${BEACH}${LIVE ? ' (live: probe blocks are wiped at the end)' : ' (the package\'s handler on a scratch folder)'}`);
  const founded: Array<[string, string | undefined]> = [];
  try {
    // ── 0. four passports with published halves; a stranger with nothing ──
    console.log('\n0. four passports with published halves, and a stranger with nothing');
    for (const p of [keeper, a, b, c, d]) {
      declareHand(p.session, p.handle);
      const born = await door(p.session, { block: `passport:${p.handle}`, content: { _: `${p.handle}, a throwaway passport of the colour smoke` }, new_lock: p.latch });
      founded.push([`passport:${p.handle}`, p.latch]);
      const pub = (await handleKeyPublish({ handle: p.handle, secret: p.latch, enc_secret: p.word, agent_id: BEACH }, { sessionId: p.session })).content[0].text;
      check(`${p.handle}: passport founded and keys published`, !/rejected/i.test(born) && /Keys published/.test(pub), [born, pub]);
    }

    // ── 1. the keeper founds the colour and admits three ──
    console.log('\n1. the keeper founds the colour, latched whole, and admits three members by their published halves');
    const noLatch = await door(keeper.session, { block: COLOUR, members: [keeper.handle], content: 'a colour founded without a latch' });
    check('founding without new_lock is refused: a colour is latched whole', /rejected/.test(noLatch) && /latched whole/.test(noLatch), noLatch);
    const noKeys = await door(keeper.session, { block: COLOUR, members: [keeper.handle, 'nobody' + stamp], new_lock: KEEPERS_LATCH });
    check('a holder without published keys is refused by name', /rejected/.test(noKeys) && /no keys published/.test(noKeys), noKeys);
    derivations.count = 0;
    const found = await door(keeper.session, { block: COLOUR, members: [keeper.handle], content: `the probe colour of ${stamp}: a readership of four, for the smoke`, new_lock: KEEPERS_LATCH });
    founded.push([COLOUR, KEEPERS_LATCH]);
    check('founded: turn 1, one copy, the public half at 1.2', /founded, latched whole/.test(found) && /turn 1 from/.test(found) && /1 copy \(/.test(found), found);
    check('founding derives nothing: a turn is a fresh key', derivations.count === 0, derivations.count);
    let block = await raw(COLOUR);
    check('the colour block is spine-legal: purpose at _, turn 1 with its ring at 1 and public half at 2', isSpineLegal(block) && typeof block?._ === 'string' && block['1']?.['1']?.['1']?._ === keeper.handle && typeof block['1']['2'] === 'string', block);
    forgetDerived(keeper.session); opens.box = 0; derivations.count = 0;
    const wrongLatch = await door(keeper.session, { block: COLOUR, members: [keeper.handle, a.handle], secret: 'not the latch', enc_secret: keeper.word });
    console.log(`     the keeper's first admit: ${derivations.count} derivation(s), ${opens.box} copy opened`);
    check('admitting under the wrong latch is refused by the beach', /rejected/.test(wrongLatch), wrongLatch);
    check('the keeper paid one derivation and opened their own copy once, and wears the turn', derivations.count === 1 && opens.box === 1, [derivations.count, opens.box]);
    const admitted = await door(keeper.session, { block: COLOUR, members: [keeper.handle, a.handle, b.handle, c.handle], secret: KEEPERS_LATCH, enc_secret: keeper.word });
    check('admitted a, b and c: four copies, no turn', /admitted/.test(admitted) && /4 copies now/.test(admitted) && /no turn/.test(admitted), admitted);
    check('the admit under the worn turn paid nothing more', derivations.count === 1 && opens.box === 1, [derivations.count, opens.box]);
    block = await raw(COLOUR);
    const ring1 = block?.['1']?.['1'];
    check('the ring holds four named copies and the block is still one turn', isSpineLegal(block) && [1, 2, 3, 4].every((i) => typeof ring1?.[String(i)]?._ === 'string') && block['2'] === undefined, block);
    const same = await door(keeper.session, { block: COLOUR, members: [keeper.handle, a.handle, b.handle, c.handle], secret: KEEPERS_LATCH, enc_secret: keeper.word });
    check('the same holders again changes nothing', /unchanged/.test(same), same);

    // ── 2. a member seals a line in a room and at a point ──
    console.log('\n2. a member seals a line in the colour: in a room (an append) and at a point (a write)');
    forgetDerived(a.session); derivations.count = 0; opens.box = 0;
    const inRoom = await door(a.session, { block: ROOM, append: true, gray: COLOUR, enc_secret: a.word, content: 'the first coloured line, in the room' });
    founded.push([ROOM, undefined]);
    check('the append lands sealed in the colour, turn 1', /^\[append @/.test(inRoom) && /sealed in colour:probe-\S+, turn 1\./.test(inRoom), inRoom);
    const atPoint = await door(a.session, { block: NOTES, spindle: '1', gray: `probe-${stamp}`, enc_secret: a.word, content: 'a coloured line at a point' });
    founded.push([NOTES, undefined]);
    check('the write lands sealed in the colour by its bare name, turn 1', /^\[wrote point @ "1"\]/.test(atPoint) && /sealed in colour:probe-\S+, turn 1\./.test(atPoint), atPoint);
    console.log(`     two seals: ${derivations.count} derivation(s), ${opens.box} copy opened`);
    check('the writer paid one derivation and opened their copy once for both', derivations.count === 1 && opens.box === 1, [derivations.count, opens.box]);
    const roomBlock = await raw(ROOM), notes = await raw(NOTES);
    const roomEntry = roomBlock?.['1'], noteEntry = notes?.['1'];
    check('the room entry is a colour envelope naming its colour and turn, stamped by the beach beside it', isGrayEnvelope(roomEntry) && grayMode(roomEntry) === 'colour' && roomEntry['9']['2'] === COLOUR && roomEntry['9']['3'] === '1' && typeof roomEntry['3'] === 'string', roomEntry);
    check('the point is a colour envelope with the note the design names', isGrayEnvelope(noteEntry) && noteEntry._ === `Sealed for ${COLOUR}, turn 1.` && isSpineLegal(notes), noteEntry);

    // ── 3. a member with the colour reads the words ──
    console.log('\n3. a member with the colour reads the words: keyed once, then with no key passed');
    forgetDerived(b.session); derivations.count = 0; opens.box = 0;
    const bRoom = await door(b.session, { block: ROOM, pscale_attention: 0, enc_secret: b.word });
    console.log(`     first keyed read: ${derivations.count} derivation(s), ${opens.box} copy opened`);
    check('keyed disc of the room: the words', bRoom.includes('the first coloured line, in the room') && !bRoom.includes('sealed ·'), bRoom);
    check('one derivation, one copy opened: the colour is worn', derivations.count === 1 && opens.box === 1, [derivations.count, opens.box]);
    const bPoint = await door(b.session, { block: NOTES, spindle: '1', pscale_attention: 0, enc_secret: b.word });
    check('keyed point of the note: the words, with no new derivation and no ring read', bPoint.includes('a coloured line at a point') && derivations.count === 1 && opens.box === 1, [bPoint, derivations.count, opens.box]);
    const bWire = await door(b.session, { block: NOTES, spindle: '1', pscale_attention: 0 });
    check('with no key passed, the wire point opens in place and offers no ciphertext beneath', bWire.includes('a coloured line at a point') && !/beneath \(pscale -1\): 1\.1/.test(bWire) && noCipher(bWire, noteEntry), bWire);
    const bWalk = await door(b.session, { block: NOTES, spindle: '1' });
    check('with no key passed, the walk opens too', bWalk.includes('a coloured line at a point') && !bWalk.includes('sealed ·'), bWalk);
    const bDisc = await door(b.session, { block: ROOM, pscale_attention: 0 });
    check('with no key passed, the disc of the room opens', bDisc.includes('the first coloured line, in the room'), bDisc);
    check('still one derivation and one copy opened for the whole session', derivations.count === 1 && opens.box === 1, [derivations.count, opens.box]);

    // ── 4. a member without the colour, and a stranger ──
    console.log('\n4. a member without the colour reads the grey line; a stranger with no key reads it and nothing more');
    forgetDerived(d.session); derivations.count = 0;
    const dPoint = await door(d.session, { block: NOTES, spindle: '1', pscale_attention: 0, enc_secret: d.word });
    check(`a holder of keys outside the ring: ${grey('1')} · <bytes>, no derivation`, new RegExp(`${grey('1')} · \\d+ bytes`).test(dPoint) && derivations.count === 0 && noCipher(dPoint, noteEntry), [dPoint, derivations.count]);
    const sPoint = await door(stranger.session, { block: NOTES, spindle: '1', pscale_attention: 0 });
    check(`a stranger over the wire: ${grey('1')}, the envelope's fields not offered beneath`, sPoint.includes(grey('1')) && !/1\.1 · 1\.2 · 1\.9/.test(sPoint) && noCipher(sPoint, noteEntry), sPoint);
    const sWalk = await door(stranger.session, { block: NOTES, spindle: '1' });
    check('a stranger on a walk: the grey line with its bytes', new RegExp(`${grey('1')} · \\d+ bytes`).test(sWalk) && noCipher(sWalk, noteEntry), sWalk);
    const sDisc = await door(stranger.session, { block: ROOM, pscale_attention: 0 });
    check('a stranger on the room\'s disc: the grey line', sDisc.includes(grey('1')) && noCipher(sDisc, roomEntry), sDisc);
    const sDesc = await door(stranger.session, { block: NOTES, spindle: '1', pscale_attention: -1 });
    check('a stranger on a descent: the grey line, and neither the ciphertext, the nonce nor the marker listed', sDesc.includes(grey('1')) && !/\[1\.[129]\]/.test(sDesc) && noCipher(sDesc, noteEntry), sDesc);
    const sFine = await door(stranger.session, { block: NOTES, pscale_attention: -1 });
    check('a stranger on the disc one pscale finer: the envelope\'s own fields are not positions', !/\[1\.[129]\]/.test(sFine) && noCipher(sFine, noteEntry), sFine);
    const sDeep = await door(stranger.session, { block: NOTES, spindle: '1', pscale_attention: -2 });
    check('two deep: the marker\'s own name, colour and turn are not listed either', !/\[1\.9/.test(sDeep) && noCipher(sDeep, noteEntry), sDeep);
    const sWhole = await door(stranger.session, { block: NOTES, spindle: '0' });
    check('the whole block, named, is byte-true', sWhole.startsWith(`[whole block]\n${JSON.stringify(notes, null, 2)}`), sWhole.slice(0, 300));

    // ── 5. a letter ──
    console.log('\n5. a stranger\'s letter to the colour: sealed with no key, read by every holder, never by its writer');
    const letter = await door(stranger.session, { block: NOTES, spindle: '3', gray: COLOUR, content: 'a letter to the colour from someone with no copy' });
    check('the write lands as a letter: no key passed, sealed to the turn\'s public half', /^\[wrote point @ "3"\]/.test(letter) && /sealed as a letter to colour:probe-\S+, turn 1/.test(letter) && /cannot read it back/.test(letter), letter);
    const letterEnv = (await raw(NOTES))?.['3'];
    check('the letter is a colour envelope carrying the writer\'s one-off half at 9.4', isGrayEnvelope(letterEnv) && typeof letterEnv['9']['4'] === 'string' && letterEnv['9']['3'] === '1', letterEnv);
    const sLetter = await door(stranger.session, { block: NOTES, spindle: '3', pscale_attention: 0 });
    check('its writer reads the grey line', sLetter.includes(grey('1')), sLetter);
    const bLetter = await door(b.session, { block: NOTES, spindle: '3', pscale_attention: 0 });
    check('a holder reads the letter with no key passed', bLetter.includes('a letter to the colour from someone with no copy'), bLetter);
    const roomLetter = await door(stranger.session, { block: ROOM, append: true, gray: COLOUR, content: 'a letter left in the room' });
    check('a letter rides an append too', /sealed as a letter/.test(roomLetter), roomLetter);
    const cRoom = await door(c.session, { block: ROOM, pscale_attention: 0, enc_secret: c.word });
    check('another holder, keyed, reads the room whole: the line and the letter', cRoom.includes('the first coloured line, in the room') && cRoom.includes('a letter left in the room'), cRoom);

    // ── 6. the turn ──
    console.log('\n6. the keeper turns the colour to shut one member out: old lines open for them, no new one');
    const turned = await door(keeper.session, { block: COLOUR, members: [keeper.handle, a.handle, b.handle], secret: KEEPERS_LATCH });
    check('turned: turn 2, three copies, c shut out of every new line', /turned → turn 2/.test(turned) && /3 copies/.test(turned) && new RegExp(`shut out of every new line: ${c.handle}`).test(turned), turned);
    block = await raw(COLOUR);
    check('the colour block holds turns 1 and 2, turn 1 untouched', isSpineLegal(block) && JSON.stringify(block['1']['1']) === JSON.stringify(ring1) && block['2']?.['1']?.['1']?._ === keeper.handle && typeof block['2']['2'] === 'string', block);
    derivations.count = 0; opens.box = 0;
    const newLine = await door(a.session, { block: NOTES, spindle: '2', gray: COLOUR, enc_secret: a.word, content: 'a line of the second turn' });
    check('a member seals in the new turn: one copy opened, no new derivation', /sealed in colour:probe-\S+, turn 2\./.test(newLine) && derivations.count === 0 && opens.box === 1, [newLine, derivations.count, opens.box]);
    const newRoom = await door(a.session, { block: ROOM, append: true, gray: COLOUR, content: 'a room line of the second turn' });
    check('and in the room, with no key passed: the new turn is worn', /sealed in colour:probe-\S+, turn 2\./.test(newRoom), newRoom);
    const turn2Env = (await raw(NOTES))?.['2'];
    const cOld = await door(c.session, { block: NOTES, spindle: '1', pscale_attention: 0, enc_secret: c.word });
    check('the one shut out opens the old line', cOld.includes('a coloured line at a point'), cOld);
    const cNew = await door(c.session, { block: NOTES, spindle: '2', pscale_attention: 0, enc_secret: c.word });
    check(`and reads the new one grey: ${grey('2')}`, new RegExp(`${grey('2')} · \\d+ bytes`).test(cNew) && noCipher(cNew, turn2Env), cNew);
    const cRoom2 = await door(c.session, { block: ROOM, pscale_attention: 0, enc_secret: c.word });
    check('in the room: the old line and the letter open, the new line grey', cRoom2.includes('the first coloured line, in the room') && cRoom2.includes('a letter left in the room') && cRoom2.includes(grey('2')), cRoom2);
    derivations.count = 0; opens.box = 0;
    const bNew = await door(b.session, { block: NOTES, spindle: '2', pscale_attention: 0, enc_secret: b.word });
    check('a member who stays opens the new line: one more copy, no derivation', bNew.includes('a line of the second turn') && derivations.count === 0 && opens.box === 1, [bNew, derivations.count, opens.box]);
    const bBoth = await door(b.session, { block: NOTES, pscale_attention: 0 });
    check('and, with no key, every line of both turns on the disc', bBoth.includes('a coloured line at a point') && bBoth.includes('a line of the second turn') && bBoth.includes('a letter to the colour'), bBoth);
    const sWhole2 = await door(stranger.session, { block: NOTES, spindle: '0' });
    check('the whole block is still byte-true', sWhole2.startsWith(`[whole block]\n${JSON.stringify(await raw(NOTES), null, 2)}`));

    // ── 7. no hand at the door ──
    console.log('\n7. a session with no hand at the door still finds its copy, as a ring\'s reader does');
    const anon = `s-anon-${stamp}`;
    derivations.count = 0;
    const anonRead = await door(anon, { block: NOTES, spindle: '2', pscale_attention: 0, enc_secret: b.word });
    console.log(`     no hand: ${derivations.count} derivation(s)`);
    check('the words, by trying the copies in ring order', anonRead.includes('a line of the second turn') && derivations.count >= 1 && derivations.count <= 3, [anonRead, derivations.count]);

    // ── 8. the cadence turn ──
    console.log('\n8. a turn with the same holders, by append');
    const cadence = await door(keeper.session, { block: COLOUR, members: [keeper.handle, a.handle, b.handle], secret: KEEPERS_LATCH, append: true });
    check('append:true with members turns the colour on the keeper\'s cadence', /turned → turn 3/.test(cadence) && !/shut out/.test(cadence), cadence);

    // ── 9. the doors' battery at the router (proposals/2026-11-05-the-doors-fixes-router.md) ──
    // This beach is not the router's default, as the lab and SALT are not: every half is read here.
    console.log('\n9. at a beach that is not the router\'s default: one word at a latched mirror, a group, a grain, the key\'s hint, one spelling');
    // A member whose one word is both latch and sealing word, as the voice makes one (router 5).
    const e = person('e');
    e.latch = e.word;
    declareHand(e.session, e.handle);
    await door(e.session, { block: `passport:${e.handle}`, content: { _: `${e.handle}, one word for latch and seal` }, new_lock: e.word });
    founded.push([`passport:${e.handle}`, e.word]);
    const ePub = (await handleKeyPublish({ handle: e.handle, secret: e.word, enc_secret: e.word, agent_id: BEACH }, { sessionId: e.session })).content[0].text;
    const eIn = await door(keeper.session, { block: COLOUR, members: [keeper.handle, a.handle, b.handle, e.handle], secret: KEEPERS_LATCH, enc_secret: keeper.word });
    check('e publishes from one word and is admitted to the colour', /Keys published/.test(ePub) && /admitted/.test(eIn), [ePub, eIn]);
    const MIRROR = `days:${e.handle}`;
    await door(e.session, { block: MIRROR, content: { _: `${e.handle}'s days, latched by the one word` }, new_lock: e.word });
    founded.push([MIRROR, e.word]);
    const own = await door(e.session, { block: MIRROR, spindle: '1', gray: COLOUR, secret: e.word, content: 'a coloured line in my own latched mirror' });
    check('a coloured line lands in its writer\'s own latched mirror with secret alone, no enc_secret beside it (router 5)', /^\[wrote point @ "1"\]/.test(own) && /sealed in colour:probe-\S+, turn 3\./.test(own), own);
    check('…and the ack says how it was sealed, never that the latch sealed it', !/sealed under the latch/.test(own), own);
    const worn = await door(e.session, { block: MIRROR, spindle: '2', gray: COLOUR, secret: e.word, content: 'a second line, the turn now worn' });
    check('a second, under the worn turn, lands the same', /^\[wrote point @ "2"\]/.test(worn) && /sealed in colour/.test(worn), worn);
    const appended = await door(e.session, { block: MIRROR, append: true, gray: COLOUR, secret: e.word, content: 'a coloured line appended to my own latched mirror' });
    check('and so does a coloured append', /^\[append @/.test(appended) && /sealed in colour/.test(appended), appended);
    const aReads = await door(a.session, { block: MIRROR, spindle: '1', pscale_attention: 0, enc_secret: a.word });
    check('another holder opens it', aReads.includes('a coloured line in my own latched mirror'), aReads);
    const wrongWord = await door(e.session, { block: MIRROR, spindle: '4', content: 'x', secret: 'not the word' });
    check('a wrong key at this beach is told the probe at this beach, never the apex\'s law (router 9)', /rejected/.test(wrongWord) && new RegExp(`at the refusing block on ${BEACH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(wrongWord) && !/beach\.happyseaurchin\.com/.test(wrongWord), wrongWord);

    // A group of handles who live at this beach, founded on a fresh block (router 2 and 7).
    const GROUP = `circle:probe-${stamp}`;
    const g = await door(a.session, { block: GROUP, spindle: '1', members: [a.handle, b.handle], enc_secret: a.word, content: 'a line for a and b alone' });
    founded.push([GROUP, undefined]);
    check('a group of handles who published here is founded here: their halves are read at this beach (router 2)', /^\[wrote point @ "1"\]/.test(g) && !/rejected/i.test(g), g);
    const gBlock = await raw(GROUP);
    check('founded on a fresh block, it carries its underscore, so the beach\'s floor rule admits it (router 7)', typeof gBlock?._ === 'string' && gBlock?.['9']?._ === GROUP_KEYRING_MARKER && isGrayEnvelope(gBlock?.['1']) && isSpineLegal(gBlock), gBlock);
    const gB = await door(b.session, { block: GROUP, spindle: '1', pscale_attention: 0, enc_secret: b.word });
    check('the other member opens the line', gB.includes('a line for a and b alone'), gB);
    const gD = await door(d.session, { block: GROUP, spindle: '1', pscale_attention: 0, enc_secret: d.word });
    check('a hand outside the group reads it sealed', /sealed · group/.test(gD) && !gD.includes('a line for a and b alone'), gD);

    // A grain between two who published here (router 2). A grain block cannot be wiped, so
    // only on the scratch beach.
    if (!LIVE) {
      await handleGrainReach({ handle: a.handle, partner_handle: b.handle, description: 'a probe grain', my_side_content: 'a reaches', my_passphrase: a.latch, agent_id: BEACH } as any, { sessionId: a.session });
      await handleGrainReach({ handle: b.handle, partner_handle: a.handle, description: 'a probe grain', my_side_content: 'b answers', my_passphrase: b.latch, agent_id: BEACH } as any, { sessionId: b.session });
      const GRAIN = `grain:${await pairId(a.handle, b.handle)}`;
      const said = await door(a.session, { block: GRAIN, append: true, spindle: sideOf(a.handle, b.handle), secret: a.latch, enc_secret: a.word, content: 'a grain line between a and b' });
      const at = (said.match(/→ (\d+(?:\.\d+)?) \(slot/) ?? [])[1];
      check('a grain line between two who published here is sealed here (router 2)', /^\[append @/.test(said) && !!at, said);
      const heard = at ? await door(b.session, { block: GRAIN, spindle: at, enc_secret: b.word }) : '';
      check('…and the partner opens it, both halves read at this beach', heard.includes('a grain line between a and b'), heard);
    }

    // One spelling of a beach: a trailing slash seals and opens as the address without one (router 9).
    const SELF = `notes:self-${stamp}`;
    const slashed = await handleBsp({ agent_id: `${BEACH}/`, block: SELF, spindle: '1', gray: true, enc_secret: a.word, content: 'a self line, its beach written with a slash' } as any, { sessionId: a.session });
    founded.push([SELF, undefined]);
    const unslashed = await door(a.session, { block: SELF, spindle: '1', pscale_attention: 0, enc_secret: a.word });
    check('a self line sealed with a trailing slash on the beach opens under the address without one', unslashed.includes('a self line, its beach written with a slash'), [slashed.content.map((x) => x.text).join('\n'), unslashed]);
    const before = await selfEncrypt('sealed under the slashed spelling, before it was one', a.word, `${BEACH}/`);
    await fetch(`${W}?block=${encodeURIComponent(SELF)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ spindle: '2', content: before }) });
    const old = (await handleBsp({ agent_id: `${BEACH}/`, block: SELF, spindle: '2', pscale_attention: 0, enc_secret: a.word } as any, { sessionId: a.session })).content.map((x) => x.text).join('\n');
    check('…and a line sealed under the slashed spelling before still opens under it', old.includes('sealed under the slashed spelling, before it was one'), old);
  } finally {
    const wiped: string[] = [];
    for (const [name, secret] of founded) { try { if (await wipe(name, secret)) wiped.push(name); } catch { /* left standing */ } }
    console.log(`\nwiped ${wiped.length} of ${founded.length} probe blocks${wiped.length < founded.length ? `: left standing ${founded.map(([n]) => n).filter((n) => !wiped.includes(n)).join(', ')}` : ''}`);
    stopBeach();
  }
  console.log(`\n${fail === 0 ? '✓' : '✗'} colour: ${pass} passed, ${fail} failed`);
  if (fail) { failures.forEach((f) => console.log(`   - ${f}`)); process.exit(1); }
}

main().catch((e) => { console.error(e); stopBeach(); process.exit(2); });
