/**
 * clock-table.ts — found a table played ON THE CLOCK (the second track, rung 2).
 *
 * One act, the way a pool room is born declared: the table's clock
 * (spine:temporal), its law (function:temporal, from src/tools/clock-law.json),
 * its keeper's hold with the placing into the scenario (keeper:scene 3), and
 * the genesis delta (char-creation) that puts the BEAT beside the LOCATION in a
 * passport's third line. The night (the bare `temporal`) is NOT founded: it is
 * born locked at the first fold, under the folder's key — the determiner is the
 * lock (proposals/2026-09-22-clock-trial-corrective-pass.md).
 *
 *   CLOCK_KEY=<the table's key> npx tsx scripts/clock-table.ts <table-url> <scenario-url> <arrival-address> [<first-beat>]
 *
 * The key comes from the environment and is never printed. Reads the scenario's
 * spatial block to name the arrival place; refuses to overwrite a table that
 * already keeps a clock.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadBlock, saveBlock } from '../src/db.js';
import { beachIndex } from '../src/tools/pool.js';
import { placeWalk } from '../src/tools/tiers.js';
import { CLOCK_FIELD } from '../src/tools/clock.js';

const [table, scenario, arrival, firstBeat = '151'] = process.argv.slice(2);
const key = process.env.CLOCK_KEY;
if (!table || !scenario || !arrival || !key) {
  console.error('usage: CLOCK_KEY=<key> npx tsx scripts/clock-table.ts <table-url> <scenario-url> <arrival-address> [<first-beat>]');
  process.exit(2);
}
const origin = table.replace(/\/+$/, '');
const master = scenario.replace(/\/+$/, '');

const index = await beachIndex(origin);
if (index.includes(`spine:${CLOCK_FIELD}`)) {
  console.error(`${origin} already keeps a clock (spine:${CLOCK_FIELD}) — nothing written.`);
  process.exit(1);
}
const mIndex = await beachIndex(master);
const spatialName = mIndex.find((b) => b.startsWith('spatial:'));
if (!spatialName) {
  console.error(`${master} has no spatial block — not a scenario.`);
  process.exit(1);
}
const world = spatialName.slice('spatial:'.length);
const spatial = (await loadBlock(master, spatialName))?.block as any;
const walk = spatial ? placeWalk(spatial, arrival, false) : null;
const placeLine = walk?.split('\n').find((l) => l.startsWith(`[${arrival}]`))?.replace(/^\[[^\]]*\]\s*/, '') ?? '';
if (!placeLine) {
  console.error(`${arrival} names no place in ${spatialName} at ${master}.`);
  process.exit(1);
}
const placeName = placeLine.split(/\s+[—–-]\s+/)[0].trim();
const tableName = origin.split('/').pop();

const floor3 = (text: string, digits: Record<string, unknown>) => ({ _: { _: { _: text } }, ...digits });

// The clock: three rungs — the day, its gatherings as the twilight lands name
// them, the beat. The first day is the day the road brings the party to the
// arrival place; nothing here says what happens, only when.
const spine = floor3(
  `THE CLOCK OF THIS TABLE — a bubble of time of its own, tied to no other clock. Three rungs and no more: the day (pscale +2), its gatherings as the twilight lands name them — 1 first light, 2 morning, 3 midday, 4 afternoon, 5 dusk, 6 dark, 7 deep night (pscale +1) — and the beat, five to ten minutes, one exchange (pscale 0), nine at most to a gathering. Addresses are digits: 153 is day 1, dusk, the third beat; 150 is that dusk whole; 100 is the day whole. Day 1 is the day the road brings the party to ${placeName}. Nothing here says what happens — only when.`,
  {
    '1': {
      _: `Day 1 — the day the road brings the party to ${placeName}.`,
      '1': 'first light', '2': 'morning', '3': 'midday', '4': 'afternoon', '5': 'dusk — the light failing', '6': 'dark — full night', '7': 'deep night',
    },
    '2': { _: 'Day 2 — the morning after.', '1': 'first light', '2': 'morning', '3': 'midday', '4': 'afternoon', '5': 'dusk', '6': 'dark', '7': 'deep night' },
  },
);

const law = JSON.parse(readFileSync(fileURLToPath(new URL('../src/tools/clock-law.json', import.meta.url)), 'utf8'));

const keeperScene = {
  _: `The keeper's hold for ${tableName} — a table of ${world} played ON THE CLOCK (the second track). The place is never copied here: it is read live from the scenario through the placing at 3; a character new to the table begins at the beat named at 5. The night — the bare block temporal — is born locked at the first fold, under the folder's key, and that key folds it ever after; a keeper's hand named at 4 folds instead, and characters say and wait.`,
  '3': `PLACING: *:${master}:${spatialName}:${arrival}`,
  '5': `FIRST BEAT: *:${origin}:spine:${CLOCK_FIELD}:${firstBeat} — where a character new to this table stands: the first beat of the clock's first gathering at the arrival place named at 3.`,
};

// The genesis delta: the canonical passage, with the one thing a clock table
// changes — a passport's third line carries the BEAT beside the LOCATION.
const openTable = mIndex.includes('char-creation') ? (await loadBlock(master, 'char-creation'))?.block as any : null;
const delta: any = openTable && typeof openTable === 'object' ? JSON.parse(JSON.stringify(openTable)) : { _: '', '1': { _: '' } };
const beatLine = `THE STANDPOINT ON THE CLOCK — this table is played on time: a passport's third line ends with BOTH coordinates, the place and the beat, exactly in this form: 'Location: *:${master}:${spatialName}:${arrival} Beat: *:${origin}:spine:${CLOCK_FIELD}:${firstBeat}'. Every character arrives at ${placeName} (${arrival}) at the first beat of the clock (${firstBeat}); the door (pscale_play) finds a character by these two lines and nothing else. THERE IS NO ROOM TO OPEN HERE and no cold open to fold in a pool: the beat is the room. Found no pool:<address> at this table. Once the four blocks are written, RE-ENTER with pscale_play(world='${origin}', handle=<the name>) — the door then says what to do, and the first thing said at the first beat is the opening.`;
delta._ = `${String(delta._ ?? '').trim()}${delta._ ? ' ' : ''}ON THE CLOCK: ${beatLine}`;
if (delta['1'] && typeof delta['1'] === 'object') {
  delta['1']['3'] = `${String(delta['1']['3'] ?? '').trim()}${delta['1']['3'] ? ' ' : ''}AND THE BEAT: ${beatLine}`;
}

const writes: Array<[string, any]> = [
  [`spine:${CLOCK_FIELD}`, spine],
  [`function:${CLOCK_FIELD}`, law],
  ['keeper:scene', keeperScene],
  ['char-creation', delta],
];
for (const [name, block] of writes) {
  await saveBlock(origin, name, block, { spindle: '', new_lock: key });
  console.log(`  founded ${name} (${JSON.stringify(block).length} chars)`);
}
console.log(`\n${origin} plays ${world} on the clock: arrival ${placeName} [${arrival}], first beat ${firstBeat}.`);
console.log(`A character enters with pscale_play(world='${origin}', handle=<name>); the night is born at the first fold, locked under the folder's key.`);
