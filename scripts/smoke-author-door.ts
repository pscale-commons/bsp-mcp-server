/**
 * smoke-author-door.ts — the Author's door, proven OFFLINE (world-genome 4.5).
 *
 * probe-author-door.ts proves the doorway's routes against the live beach and
 * stays manual; this is the same contract with no network at all, so the gate
 * holds it on every PR. globalThis.fetch is replaced with an in-memory beach
 * (every wire read in db.ts and pool.ts goes through fetch), and DEFAULT_BEACH
 * is pinned to a fixture origin BEFORE any module reads it.
 *
 * The routes under proof:
 *   EMPTY surface            → AUTHOR PASSAGE (register lines, recipe pointer,
 *                              shape-chosen first writes, the genome whole) — and no gate
 *   registers-only (urb)     → NOT empty; the character gate as before
 *   canon sign (brackenfoot) → canon signage, read before emptiness is judged
 *   reference table          → NOT empty (passports + pools carry it through)
 *   identity/keeper only     → NOT empty (place-bearing names; a spine mid-authoring)
 *
 *   npm run smoke:author-door
 */
process.env.DEFAULT_BEACH = 'https://apex.test';

type AnyBlock = Record<string, unknown>;

// ── In-memory beaches: surface origin → { block name → block } ──
const spatialCanon: AnyBlock = {
  _: { _: { _: 'The holding of brackentest, floor 3 — region, ground, room; a poor crossing the day it breaks.' } },
  '2': {
    _: 'The road in — the region a stranger meets first.',
    '1': {
      _: 'The approach to the water.',
      '1': { _: 'The Slip — a ford where the good road gives out; strangers arrive here.', '1': 'A plank bridge, half-sunk.' },
    },
  },
};

const beaches: Record<string, Record<string, AnyBlock>> = {
  'https://apex.test': {
    worlds: {
      _: 'Worlds at this beach — name → route → room.',
      '1': 'brackentest → https://canon.test/w/brackentest → surface',
      '2': 'urbtest → https://urbtest.test → surface',
    },
  },
  'https://empty.test/w/blank': {},
  'https://urbtest.test': {
    'spatial:urb': { _: 'The world spine of urbtest, floor 1 — coarse ground only.', '2': 'The wetlands.' },
    'temporal:urb': { _: 'The clock of urbtest — one rate, the day.' },
    'identity:urb': { _: 'How each we holds urbtest.' },
    'keeper:urb': { _: 'The held register of urbtest.' },
  },
  'https://canon.test/w/brackentest': {
    lighthouse: {
      _: 'BRACKENTEST — a SCENARIO surface; no one plays here.',
      '1': 'JOINING A GAME — ask for the table URL and play there.',
      '9': { _: 'Sign metadata.', '3': 'canon — this surface is a read-only scenario.' },
    },
    'spatial:brackentest': spatialCanon,
  },
  'https://table.test/w/ref-grp': {
    'passport:refa': {
      _: 'refa — a stranger at the crossing.',
      '3': 'Travel-worn, quiet. Location: *:https://canon.test/w/brackentest:spatial:brackentest:211',
    },
    'pool:211': { _: 'pscale:grit/1' },
    'keeper:scene': {
      _: "The Author's hold for this table.",
      '3': 'PLACING: the table plays brackentest — *:https://canon.test/w/brackentest:spatial:brackentest:211',
    },
  },
  'https://half.test/w/registers': {
    'identity:x': { _: 'How each we holds x.' },
    'keeper:x': { _: 'The held register of x.' },
  },
};

const WELL_KNOWN = '/.well-known/pscale-beach';

globalThis.fetch = (async (input: any, _init?: any) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const wk = url.pathname.indexOf(WELL_KNOWN);
  if (wk === -1) return new Response('not a beach', { status: 404 });
  const surface = `${url.origin}${url.pathname.slice(0, wk)}`;
  const beach = beaches[surface];
  if (!beach) return new Response('no beach', { status: 404 });
  const name = url.searchParams.get('block');
  if (!name) {
    return new Response(
      JSON.stringify({ _: `URL surface at ${surface}.`, origin: surface, blocks: Object.keys(beach).sort() }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const block = beach[name];
  if (block === undefined) return new Response('not found', { status: 404 });
  return new Response(JSON.stringify(block), { status: 200, headers: { 'Content-Type': 'application/json' } });
}) as typeof fetch;

const { handlePlay } = await import('../src/tools/play.js');

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

async function door(world: string, handle: string): Promise<string> {
  return (await handlePlay({ world, handle })).content[0].text;
}

console.log('=== EMPTY surface → the author passage, complete ===');
{
  const text = await door('https://empty.test/w/blank', 'someone');
  check('author passage fires', /is EMPTY — there is nowhere here/.test(text));
  check('no character gate handed', !/stand at the GATE/.test(text));
  check('worlds register lines surface (typo self-correct)', /brackentest → https:\/\/canon\.test\/w\/brackentest/.test(text) && /urbtest → https:\/\/urbtest\.test/.test(text));
  check('recipe pointer — ways:authoring branch 8', /ways:authoring.*spindle="8"/.test(text));
  check('first writes are shape-chosen (bubble-on-spine vs standalone)', /BUBBLE PLACED ON AN EXISTING SPINE/.test(text) && /STANDALONE WORLD/.test(text));
  check('the placing star-ref form is given', /\*:<world-beach-url>:spatial:<world>:<address>/.test(text));
  check('the genome rides whole (the law at 1)', /THE SCENARIO·TABLE LAW/.test(text));
  check('the four shapes ride (1.5)', /THE FOUR SURFACE SHAPES/.test(text));
  check('re-entry instruction names this surface', text.includes('pscale_play(world="https://empty.test/w/blank"'));
}

console.log('\n=== registers-only world (urb shape) → NOT empty; the gate as before ===');
{
  const text = await door('https://urbtest.test', 'someone');
  check('author passage does NOT fire', !/is EMPTY — there is nowhere here/.test(text));
  check('fresh handle still meets the gate + genesis', /stand at the GATE/.test(text));
}

console.log('\n=== canon sign → signage, read before emptiness ===');
{
  const text = await door('https://canon.test/w/brackentest', 'someone');
  check('canon signage leads', /is a SCENARIO \(canon\)/.test(text));
  check('author passage does NOT fire', !/is EMPTY — there is nowhere here/.test(text));
}

console.log('\n=== reference table (passports + pools, no spatial) → NOT empty; normal entry ===');
{
  const text = await door('https://table.test/w/ref-grp', 'refa');
  check('author passage does NOT fire', !/is EMPTY — there is nowhere here/.test(text));
  check('normal entry proceeds', /# You are now playing refa/.test(text));
}

console.log('\n=== identity/keeper only (a spine mid-authoring) → NOT empty ===');
{
  const text = await door('https://half.test/w/registers', 'someone');
  check('author passage does NOT fire', !/is EMPTY — there is nowhere here/.test(text));
}

console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
if (fail > 0) process.exit(1);
