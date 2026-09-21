/**
 * Live smoke for the liquid BIRTH path — the verified-never-trusted discipline
 * added 2026-08-06 after keel's second-fold run saw a new author's first slip
 * refused twice with no error (provenance at pool:molequle slot 4).
 *
 * Exercises handlePoolEngage against the live probe room pool:probe-birth at
 * the reference beach (its purpose says "delete at will"): two FRESH authors
 * each stage a first slip into the live window (two births), then a read-back
 * engage asserts both slips stand in the liquid mirror. Fresh author names per
 * run keep every run a genuine birth.
 *
 * THE RUN KEEPS ITS OWN TABLE: it clears the buffer and opens the window in one
 * engage (clear lands before submit), and clears again when it is done. Taking
 * its two lines back was never enough, and was this smoke's fault until
 * 2026-09-21: a line taken back KEEPS its place until the buffer empties
 * (proposals/2026-09-19-liquid-holds-nine §4), and this room's buffer never
 * emptied — three live slips from the hand reproduction of 2026-08-06 held its
 * window open, so no opening ever swept the emptied slots. Three runs filled
 * places 4-9 and the fourth was refused whole: "every place at the table is
 * taken just now", 0 of 7. (Before the nine were law its first slip would have
 * been written at 11, inside the first author's entry — same proposal, §1.)
 * Opening the window itself also keeps both births births: a first slip onto a
 * dead buffer is an OPENING — a whole-block write, not the surgical path this
 * smoke is for — and it was only that debris, holding the window open, that
 * ever made author A's slip a birth.
 *
 * One run at a time — a second run's clear empties the first run's table.
 *
 * Run: npm run smoke:liquid-birth   (network: reference beach)
 */
import { handlePoolEngage } from '../src/tools/pool.js';
import { loadBlock } from '../src/db.js';

const BEACH = process.env.SMOKE_BEACH ?? 'https://beach.happyseaurchin.com';
const POOL = 'probe-birth';

let pass = 0;
let fail = 0;
// `said` is the door's own answer, shown only on a failure: a refusal is one
// plain line, and it is the diagnosis (the full table read as seven bare ✗).
function assert(cond: boolean, label: string, said = '') {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else {
    fail++;
    console.log(`  ✗ ${label}`);
    if (said) console.log(`      the door said: ${said.replace(/\s+/g, ' ').slice(0, 260)}`);
  }
}

function textOf(r: { content: Array<{ type: string; text?: string }> }): string {
  return r.content.map(c => c.text ?? '').join('\n');
}

const run = Date.now().toString(36);
const opener = `probe-open-${run}`;
const authorA = `probe-a-${run}`;
const authorB = `probe-b-${run}`;
const room = { pool_url: BEACH, pool_name: POOL };

console.log(`=== liquid birth — two fresh authors into ${POOL} @ ${BEACH} (run ${run}) ===`);

try {
  // Whatever an earlier run or a hand probe left — live lines, emptied slots, a
  // full table — all nine places are free and the window is live before a birth.
  const oText = textOf(await handlePoolEngage({
    agent_id: opener,
    ...room,
    purpose: 'Probe room of the liquid-birth smoke — every run clears the liquid before and after. Disposable: delete at will.',
    clear: true,
    submit: `window opened (${run})`,
  }));
  assert(/^cleared: /m.test(oText) && /submitted: liquid slot 1 \(/.test(oText), 'the table is cleared and the window opens at place 1', oText);

  const aText = textOf(await handlePoolEngage({ agent_id: authorA, ...room, submit: `birth A (${run})` }));
  assert(/submitted: liquid slot \S+/.test(aText), 'author A birth reports a staged slot', aText);

  const bText = textOf(await handlePoolEngage({ agent_id: authorB, ...room, submit: `birth B (${run})` }));
  assert(/submitted: liquid slot \S+/.test(bText), 'author B birth reports a staged slot', bText);
  assert(bText.includes(authorA), 'author B envelope mirrors author A (both stand)');

  const readText = textOf(await handlePoolEngage({ agent_id: `probe-reader-${run}`, ...room }));
  assert(readText.includes(authorA), 'read-back: author A slip stands in the mirror');
  assert(readText.includes(authorB), 'read-back: author B slip stands in the mirror');
  assert(readText.includes(`birth A (${run})`), 'read-back: author A text intact');
  assert(readText.includes(`birth B (${run})`), 'read-back: author B text intact');
} catch (e: any) {
  assert(false, `the run threw: ${e?.message ?? String(e)}`);
} finally {
  // Leave nothing, a failed run included: no line, and no emptied slot holding
  // a place in a window that would never close. Read back, never trusted — and
  // a buffer that cannot be read back has not been seen empty.
  await handlePoolEngage({ agent_id: opener, ...room, clear: true, with_liquid: false }).catch(() => {});
  const left = await loadBlock(BEACH, `liquid:pool:${POOL}`).catch(() => null);
  const held = left ? Object.keys(left.block as object).filter((k) => k !== '_') : null;
  assert(held !== null && held.length === 0,
    `the table is left empty — no line, no held place${held === null ? ' (the buffer could not be read back)' : held.length ? ` (still held: ${held.join(' ')})` : ''}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
