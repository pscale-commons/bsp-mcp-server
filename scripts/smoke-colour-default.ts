/**
 * smoke-colour-default.ts — A LAW NAMES ITS COLOUR: step 1 of the coloured
 * dashboards (proposals/2026-11-23-a-law-names-its-colour.md).
 *
 * A family's operator, or a room's purpose, names the colour its lines are
 * sealed in by a line OPENING 'SEALED IN colour:<name>'. With no `gray` passed,
 * every say, keep, commit and stage there is sealed in it; gray=false writes a
 * line open; a family or room that names no colour writes open, as before.
 *
 * Through a signed connector (src/signin.ts) the key the connection rides in
 * with opens the holder's own copy at both doors, so a holder's say is sealed
 * with it and their read opens, with nothing opened first through bsp(); a hand
 * holding no copy still writes a letter (proposals/2026-11-24-the-signed-key-
 * opens-the-copy.md).
 *
 * colourOfLaw is checked with no beach; the doors against ONE real beach with
 * throwaway words: the package's own handler spawned on a scratch folder
 * (pscale-beach's scripts/local-beach.mjs; BEACH_DIR names the checkout, default
 * ../pscale-beach), or a live beach named by BEACH_URL, whose probe blocks are
 * wiped at the end.
 *
 *   npm run smoke:colour-default
 *   BEACH_URL=https://beach.idiothuman.com npm run smoke:colour-default
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isGrayEnvelope, grayMode } from '../src/keys.js';
import { colourOfLaw } from '../src/colour.js';
import { handleBsp } from '../src/tools/bsp.js';
import { handleKeyPublish } from '../src/tools/keys.js';
import { handlePoolEngage, poolEngageParamsSchema } from '../src/tools/pool.js';
import { handleStreamEngage, streamEngageParamsSchema } from '../src/tools/stream.js';
import { installSignedIn } from '../src/signin.js';
import { declareHand, resetLooks } from '../src/looks.js';
import { loadBlock } from '../src/db.js';

let pass = 0, fail = 0;
const failures: string[] = [];
function check(label: string, cond: boolean, got?: unknown): void {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; failures.push(label); console.log(`  ✗ ${label}${got === undefined ? '' : `\n      got: ${String(typeof got === 'string' ? got : JSON.stringify(got)).slice(0, 700)}`}`); }
}

// ── the beach ──
const LIVE = process.env.BEACH_URL?.replace(/\/+$/, '');
const BEACH_DIR = process.env.BEACH_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'pscale-beach');
const PORT = 9041 + Math.floor(Math.random() * 100);
const BEACH = LIVE ?? `http://localhost:${PORT}`;
const W = `${BEACH}/.well-known/pscale-beach`;
let beachProc: ChildProcess | null = null;
let scratch: string | null = null;
async function startBeach(): Promise<void> {
  if (LIVE) return;
  const script = join(BEACH_DIR, 'scripts', 'local-beach.mjs');
  if (!existsSync(script)) { console.error(`no pscale-beach checkout at ${BEACH_DIR}: set BEACH_DIR to one, or BEACH_URL to a live beach`); process.exit(2); }
  scratch = mkdtempSync(join(os.tmpdir(), 'colour-default-'));
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
const FIELD = `probe${stamp}`;            // its law names the colour at a digit
const OPEN = `open${stamp}`;              // its law names none
const LOST = `lost${stamp}`;              // its law names a colour that does not stand
const ROOM = `room-${stamp}`;             // its purpose names the colour
const MOUNT = `mount-${stamp}`;           // its purpose mounts function:<FIELD>
const person = (tag: string) => { const word = `one word of ${tag} ${stamp}`; return { handle: `${tag}${stamp}`, latch: word, word, session: `s-${tag}-${stamp}` }; };
const keeper = person('k'), a = person('a'), b = person('b');
const stranger = { handle: `stranger${stamp}`, session: `s-stranger-${stamp}` };
const KEEPERS_LATCH = `the keepers latch ${stamp}`;
const bsp = async (session: string, p: Record<string, unknown>) =>
  (await handleBsp({ agent_id: BEACH, ...p } as any, { sessionId: session })).content.map((x) => x.text).join('\n');
const room = async (name: string, who: { handle: string; session: string }, p: Record<string, unknown>) =>
  (await handlePoolEngage({ agent_id: who.handle, pool_url: BEACH, pool_name: name, ...p } as any, { sessionId: who.session })).content.map((x) => x.text).join('\n');
const mirror = async (field: string, who: { handle: string; session: string }, p: Record<string, unknown>) =>
  (await handleStreamEngage({ field, handle: who.handle, beach: BEACH, ...p } as any, { sessionId: who.session })).content.map((x) => x.text).join('\n');
const sealOf = (entry: any) => (entry && typeof entry === 'object' ? entry._ : null);
const inColour = (env: any) => isGrayEnvelope(env) && grayMode(env) === 'colour' && env['9']['2'] === COLOUR;
const openText = (entry: any, text: string) => (typeof entry === 'string' ? entry : sealOf(entry)) === text;
const sealedIn = (ack: string) => new RegExp(`sealed in ${COLOUR}, turn 1\\.`).test(ack);

async function main(): Promise<void> {
  // ── 0. where a law names its colour, read with no beach ──
  console.log('\n0. colourOfLaw reads the line that opens SEALED IN, at the root or a digit, and nowhere else');
  check('a digit of the law', colourOfLaw({ _: 'the law', 7: 'SEALED IN colour:admin — every line here' }) === 'colour:admin');
  check("a digit's own underscore", colourOfLaw({ _: 'the law', 3: { _: 'Sealed in colour:keel-weft, in any case', 1: 'beneath' } }) === 'colour:keel-weft');
  check('the root, a full stop not taken into the name', colourOfLaw({ _: 'SEALED IN colour:admin.' }) === 'colour:admin');
  check('a supernested root', colourOfLaw({ _: { _: 'SEALED IN colour:deep — the wrapped root' } }) === 'colour:deep');
  check("a room's purpose, a string", colourOfLaw('SEALED IN colour:room — a private room') === 'colour:room');
  check('mid-sentence names nothing', colourOfLaw({ _: 'a law whose lines are sealed in colour:admin, said in passing' }) === null);
  check('two digits down names nothing', colourOfLaw({ _: 'the law', 1: { _: 'a branch', 1: 'SEALED IN colour:too-deep' } }) === null);
  check('a bare mount names nothing', colourOfLaw('function:probe') === null && colourOfLaw(null) === null);

  resetLooks();
  await startBeach();
  console.log(`\nbeach: ${BEACH}${LIVE ? ' (live: probe blocks are wiped at the end)' : " (the package's handler on a scratch folder)"}`);
  const founded: Array<[string, string | undefined]> = [];
  try {
    // ── 1. passports, a colour of two, three families ──
    console.log('\n1. three passports with published halves; a colour held by the keeper and a; three families');
    for (const p of [keeper, a, b]) {
      declareHand(p.session, p.handle);
      const born = await bsp(p.session, { block: `passport:${p.handle}`, content: { _: `${p.handle}, a throwaway passport of the colour-default smoke` }, new_lock: p.latch });
      founded.push([`passport:${p.handle}`, p.latch]);
      const pub = (await handleKeyPublish({ handle: p.handle, secret: p.latch, enc_secret: p.word, agent_id: BEACH }, { sessionId: p.session })).content[0].text;
      check(`${p.handle}: passport founded and keys published`, !/rejected/i.test(born) && /Keys published/.test(pub), [born, pub]);
    }
    const found = await bsp(keeper.session, { block: COLOUR, members: [keeper.handle, a.handle], content: `the probe colour of ${stamp}`, new_lock: KEEPERS_LATCH });
    founded.push([COLOUR, KEEPERS_LATCH]);
    check('the colour is founded with two copies', /founded, latched whole/.test(found) && /2 copies \(/.test(found), found);
    const points = { _: 'a probe spine', '1': { _: 'point one' }, '2': { _: 'point two' }, '3': { _: 'point three' } };
    for (const [field, law] of [
      [FIELD, { _: `the probe law of ${stamp}`, '7': `SEALED IN ${COLOUR} — every line said in this family is sealed in its colour` }],
      [OPEN, { _: `an open probe law of ${stamp}, naming no colour` }],
      [LOST, { _: `a probe law of ${stamp}`, '7': `SEALED IN colour:nowhere-${stamp} — a colour that was never founded` }],
    ] as const) {
      await bsp(keeper.session, { block: `spine:${field}`, content: points });
      await bsp(keeper.session, { block: `function:${field}`, content: law });
      founded.push([`spine:${field}`, undefined], [`function:${field}`, undefined]);
    }

    // ── 2. at a mirror ──
    console.log('\n2. at a mirror: a holder, gray=false, a member with no copy, a keep, a family naming none, a colour that does not stand');
    const aSay = await mirror(FIELD, a, { at: '1', say: 'a line the law seals', secret: a.word });
    founded.push([`${FIELD}:${a.handle}`, a.word]);
    check('a say with no gray lands sealed in the colour the law names, and the ack says the law named it', sealedIn(aSay) && aSay.includes(`function:${FIELD} names ${COLOUR} as this family's colour`), aSay);
    const mirrorA = await raw(`${FIELD}:${a.handle}`);
    check("the mirror's line holds the colour's envelope, the words one zero deeper", inColour(sealOf(mirrorA?.['1'])), mirrorA?.['1']);
    check('the speaker reads their own line back as words', aSay.includes('a line the law seals'), aSay);
    const aOpen = await mirror(FIELD, a, { at: '2', say: 'a line written open on purpose', gray: false, secret: a.word });
    check('gray=false writes the line open, and nothing is said of a colour', !/sealed in|sealed as a letter/.test(aOpen) && openText((await raw(`${FIELD}:${a.handle}`))?.['2'], 'a line written open on purpose'), aOpen);
    const bSay = await mirror(FIELD, b, { at: '3', say: 'a line from someone holding no copy', secret: b.word });
    founded.push([`${FIELD}:${b.handle}`, b.word]);
    check('a member holding no copy writes a letter to the colour', new RegExp(`sealed as a letter to ${COLOUR}, turn 1`).test(bSay) && inColour(sealOf((await raw(`${FIELD}:${b.handle}`))?.['3'])), bSay);
    const aKeep = await mirror(FIELD, a, { at: '1', keep: 'personal', keep_text: 'a fold the law seals' });
    founded.push([`tree:${FIELD}:${a.handle}`, undefined]);
    check('a keep with no gray is sealed too', /✓ fold kept at/.test(aKeep) && sealedIn(aKeep), aKeep);
    const aPlain = await mirror(OPEN, a, { at: '1', say: 'a line in a family that names no colour', secret: a.word });
    founded.push([`${OPEN}:${a.handle}`, a.word]);
    check('a family whose law names no colour writes open, as before', !/sealed in|sealed as a letter/.test(aPlain) && openText((await raw(`${OPEN}:${a.handle}`))?.['1'], 'a line in a family that names no colour'), aPlain);
    const aLost = await mirror(LOST, a, { at: '1', say: 'a line that must not land open', secret: a.word });
    check('a law naming a colour that does not stand writes nothing, and says why', aLost.startsWith(`Nothing was written (function:${LOST} seals this family in colour:nowhere-${stamp})`) && (await raw(`${LOST}:${a.handle}`)) === null, aLost);

    // ── 3. in a room ──
    console.log('\n3. in a room: its purpose names the colour; gray=false; a stage; a stranger; a room that mounts the law');
    const aRoom = await room(ROOM, a, { purpose: `SEALED IN ${COLOUR} — the probe room of ${stamp}`, contribution: 'a room line the purpose seals', secret: a.word });
    founded.push([`pool:${ROOM}`, undefined]);
    check('the commit lands sealed in the colour the purpose names, and the ack says so', /committed: slot 1/.test(aRoom) && new RegExp(`sealed in ${COLOUR}, turn 1`).test(aRoom) && aRoom.includes(`the room's law names ${COLOUR} as its colour`), aRoom);
    check("the room's entry holds the colour's envelope, its author open", (await raw(`pool:${ROOM}`))?.['1']?.['1'] === a.handle && inColour(sealOf((await raw(`pool:${ROOM}`))?.['1'])));
    const aRoomOpen = await room(ROOM, a, { contribution: 'a room line written open on purpose', gray: false, secret: a.word });
    check('gray=false commits open', /committed: slot 2/.test(aRoomOpen) && !/sealed in|sealed as a letter/.test(aRoomOpen) && openText((await raw(`pool:${ROOM}`))?.['2'], 'a room line written open on purpose'), aRoomOpen);
    const aStage = await room(ROOM, a, { submit: 'a staged intention the purpose seals', secret: a.word });
    founded.push([`liquid:pool:${ROOM}`, undefined]);
    check('a stage with no gray is sealed too', /submitted: liquid slot 1/.test(aStage) && new RegExp(`sealed in ${COLOUR}, turn 1`).test(aStage), aStage);
    const sRoom = await room(ROOM, stranger, { contribution: 'a stranger in the coloured room' });
    check("a stranger's line lands as a letter to the colour", new RegExp(`sealed as a letter to ${COLOUR}, turn 1`).test(sRoom) && inColour(sealOf((await raw(`pool:${ROOM}`))?.['3'])), sRoom);
    const aMount = await room(MOUNT, a, { purpose: `function:${FIELD}`, contribution: 'a line in a room that mounts the law', secret: a.word });
    founded.push([`pool:${MOUNT}`, undefined]);
    check('a room whose purpose mounts a law that names the colour seals by it', new RegExp(`sealed in ${COLOUR}, turn 1`).test(aMount) && inColour(sealOf((await raw(`pool:${MOUNT}`))?.['1'])), aMount);

    // ── 4. through a signed connector ──
    console.log("\n4. through a signed connector: the connection's key opens the holder's copy at a mirror and in a room, each in a session that opened nothing first; a hand with no copy still writes a letter");
    // The two doors behind the sign-in's wrapper, as src/server.ts installs it: a call with no
    // secret is handed the key the connection signed in with, which is this smoke's one word.
    const doors: Record<string, (...x: any[]) => Promise<any>> = {};
    const stub: any = { tool: (...x: any[]) => { doors[x[0]] = x[x.length - 1]; } };
    installSignedIn(stub);
    stub.tool('pscale_stream_engage', 'the stream', streamEngageParamsSchema, {}, handleStreamEngage);
    stub.tool('pscale_pool_engage', 'the room', poolEngageParamsSchema, {}, handlePoolEngage);
    const signedIn = (who: { handle: string; word: string }, session: string) =>
      ({ sessionId: session, authInfo: { token: 't', clientId: 'c', scopes: ['bsp'], extra: { signedIn: { handle: who.handle, key: who.word } } } });
    const said = (r: any): string => r.content.map((x: any) => x.text).join('\n');
    const signedMirror = async (who: { handle: string; word: string }, session: string, p: Record<string, unknown>) =>
      said(await doors.pscale_stream_engage({ field: FIELD, handle: who.handle, beach: BEACH, ...p }, signedIn(who, session)));
    const signedRoom = async (who: { handle: string; word: string }, session: string, p: Record<string, unknown>) =>
      said(await doors.pscale_pool_engage({ agent_id: who.handle, pool_url: BEACH, pool_name: ROOM, ...p }, signedIn(who, session)));
    const grey = /sealed in a colour you do not wear/;
    const letter = new RegExp(`sealed as a letter to ${COLOUR}, turn 1`);

    const sSay = await signedMirror(a, `s-a-signed-say-${stamp}`, { at: '4', say: 'a line through a signed connection' });
    check("a holder's say with no secret is sealed with their own copy, not as a letter", sealedIn(sSay) && !letter.test(sSay) && inColour(sealOf((await raw(`${FIELD}:${a.handle}`))?.['4'])), sSay);
    check('…and reads back as words in the same session', sSay.includes('a line through a signed connection') && !grey.test(sSay), sSay);
    const sRead = await signedMirror(a, `s-a-signed-read-${stamp}`, { at: '1' });
    check("a holder's read with no secret opens the colour's lines", sRead.includes('a line the law seals') && !grey.test(sRead), sRead);
    const sNone = await signedMirror(b, `s-b-signed-say-${stamp}`, { at: '5', say: 'a line from a signed hand holding no copy' });
    check('a signed hand holding no copy still writes a letter', letter.test(sNone) && inColour(sealOf((await raw(`${FIELD}:${b.handle}`))?.['5'])), sNone);
    const sNoneRead = await signedMirror(b, `s-b-signed-read-${stamp}`, { at: '1' });
    check("…and reads the holders' lines as grey lines", !sNoneRead.includes('a line the law seals') && grey.test(sNoneRead), sNoneRead);
    const sCommit = await signedRoom(a, `s-a-signed-commit-${stamp}`, { contribution: 'a room line through a signed connection' });
    const slot = /committed: slot (\d+)/.exec(sCommit)?.[1] ?? '';
    check("a holder's commit with no secret is sealed with their own copy", new RegExp(`sealed in ${COLOUR}, turn 1\\.`).test(sCommit) && !letter.test(sCommit) && inColour(sealOf((await raw(`pool:${ROOM}`))?.[slot])), sCommit);
    const sRoomRead = await signedRoom(a, `s-a-signed-room-${stamp}`, {});
    check("a holder's read of the room with no secret opens its lines", sRoomRead.includes('a room line the purpose seals') && !grey.test(sRoomRead), sRoomRead);
    const sRoomNone = await signedRoom(b, `s-b-signed-commit-${stamp}`, { contribution: 'a signed room line from a hand holding no copy' });
    check('a signed hand holding no copy still writes a letter in the room', letter.test(sRoomNone), sRoomNone);
    check('nothing a signed call returns carries its key', [sSay, sRead, sCommit, sRoomRead].every((t) => !t.includes(a.word)) && [sNone, sNoneRead, sRoomNone].every((t) => !t.includes(b.word)));
  } finally {
    const wiped: string[] = [];
    for (const [name, secret] of founded) { try { if (await wipe(name, secret)) wiped.push(name); } catch { /* left standing */ } }
    console.log(`\nwiped ${wiped.length} of ${founded.length} probe blocks${wiped.length < founded.length ? `: left standing ${founded.map(([n]) => n).filter((n) => !wiped.includes(n)).join(', ')}` : ''}`);
    stopBeach();
  }
  console.log(`\n${fail === 0 ? '✓' : '✗'} colour default: ${pass} passed, ${fail} failed`);
  if (fail) { failures.forEach((f) => console.log(`   - ${f}`)); process.exit(1); }
}

main().catch((e) => { console.error(e); stopBeach(); process.exit(2); });
