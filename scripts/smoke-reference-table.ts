/**
 * smoke-reference-table.ts — the reference table composes a FULL envelope, OFFLINE
 * (world-genome 1.54; the load-bearing item of proposals/2026-07-19 §6, blessed
 * 2026-08-03).
 *
 * A table holding NO spatial of its own resolves its PLACE and its WAYS from the
 * shared master through the keeper placing star-ref (position 3 of keeper:<scene>,
 * notes:<scene> the legacy fallback) — and a table that DOES hold its own spatial
 * (the freeze, and every world built before the reference model) must compose
 * byte-identically to before: the local place, the local ways, the horizon from
 * the placing. globalThis.fetch is replaced with an in-memory beach (every wire
 * read goes through fetch), so the gate holds this on every PR; the live
 * probe-reference-place stays manual.
 *
 *   npm run smoke:reference-table
 */
process.env.DEFAULT_BEACH = 'https://apex.test';

type AnyBlock = Record<string, unknown>;

// ── The shared master — a scenario surface with the place canon ──
const spatialCanon: AnyBlock = {
  _: { _: { _: 'The holding of canon, floor 3 — region, ground, room; a poor crossing the day it breaks.' } },
  '1': {
    _: 'The village — low roofs around a shared yard.',
    '1': { _: 'The yard.', '1': { _: 'The well house.' } },
  },
  '2': {
    _: 'The road in — the region a stranger meets first.',
    '1': {
      _: 'The approach to the water.',
      '1': { _: 'The Slip — a ford where the good road gives out; strangers arrive here.', '1': 'A plank bridge, half-sunk.' },
    },
  },
};

const beaches: Record<string, Record<string, AnyBlock>> = {
  'https://master.test/w/canon': {
    'spatial:canon': spatialCanon,
  },
  // The REFERENCE table — characters + pools + the keeper placing, NO spatial.
  // The placing points at the master's road region ('200' — full floor-width, as a floor-3 address is written); the pools mirror the
  // master's addresses, and the room's own address is the finer truth.
  'https://table.test/w/canon-grp': {
    'keeper:scene': {
      _: "The Author's hold for this table.",
      '3': 'PLACING: the table plays canon — *:https://master.test/w/canon:spatial:canon:200 — the road region.',
    },
    'pool:211': { _: 'pscale:grit/1' },
    'pool:9': { _: 'pscale:grit/1' },
    'passport:refa': {
      _: 'refa — a stranger at the crossing.',
      '3': 'Travel-worn, quiet. Location: *:https://master.test/w/canon:spatial:canon:211',
    },
  },
  // The CONTROL — the same placing, but a LOCAL spatial copy (the freeze). The
  // local place must win and the composition must be what it was before the
  // reference path existed: local place, local ways, horizon from the placing.
  'https://ctl.test/w/frozen': {
    'spatial:scene': {
      _: { _: { _: 'The frozen table copy, floor 3.' } },
      '2': { _: 'The copied road.', '1': { _: 'The copied approach.', '1': { _: 'The frozen hall — a copy standing where the ford stood.' } } },
    },
    'keeper:scene': {
      _: "The Author's hold for the frozen table.",
      '3': 'PLACING: *:https://master.test/w/canon:spatial:canon:200',
    },
    'pool:211': { _: 'pscale:grit/1' },
  },
  // A bare table — pool only, no keeper, no spatial: composes without a place.
  'https://bare.test/w/none': {
    'pool:211': { _: 'pscale:grit/1' },
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

const { handlePoolEngage, parsePlacingRef } = await import('../src/tools/pool.js');

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

async function engage(poolUrl: string, poolName: string, agentId: string): Promise<string> {
  const r = await handlePoolEngage({ pool_url: poolUrl, pool_name: poolName, agent_id: agentId, since_position: 0, with_liquid: true } as any);
  return r.content[0].text;
}

console.log('=== parsePlacingRef — the keeper placing read as a triple ===');
{
  const full = parsePlacingRef('PLACING: the fen lies in Gal — *:https://urb.test:spatial:urb:2000000000 — no finer ground decided.');
  check('star-ref with prose around it', JSON.stringify(full) === JSON.stringify({ origin: 'https://urb.test', block: 'spatial:urb', addr: '2000000000' }));
  const pathed = parsePlacingRef('*:https://master.test/w/canon:spatial:canon:211');
  check('path-world origin rides', JSON.stringify(pathed) === JSON.stringify({ origin: 'https://master.test/w/canon', block: 'spatial:canon', addr: '211' }));
  const decimal = parsePlacingRef('placed at *:https://urb.test:spatial:urb:3.1 for now');
  check('single-decimal address survives', decimal?.addr === '3.1');
  check('plain prose is unplaced, never junk', parsePlacingRef('the fen lies in Gal, unplaced') === null);
  check('non-string is unplaced', parsePlacingRef(undefined) === null && parsePlacingRef({ '3': 'x' }) === null);
}

console.log('\n=== REFERENCE table — full envelope with place + ways from the master ===');
{
  const text = await engage('https://table.test/w/canon-grp', '211', 'refa');
  check('place section rides, marked REFERENCE', /# The place — spatial:canon:211 at https:\/\/master\.test\/w\/canon \(REFERENCE, world-genome 1\.54/.test(text));
  check("the room's own address wins — the master's Slip renders", /The Slip — a ford where the good road gives out/.test(text));
  check('ancestors frame the walk (the master root)', /The holding of canon, floor 3/.test(text));
  check('ways section rides from the master', /# The ways \(public faces of the referenced master/.test(text));
  check('ways list the master grounds, addressed', /\[100\] The village/.test(text) && /\[200\] The road in/.test(text));
  check('the operating directive rides (grit mount)', /# Operating directive/.test(text));
  check('the liquid mirror rides', /# Liquid — pending intentions/.test(text));
}

console.log('\n=== REFERENCE table — a room the master does not carve falls back to the placing address ===');
{
  const text = await engage('https://table.test/w/canon-grp', '9', 'refa');
  check('place falls back to the placed address', /# The place — spatial:canon:200 at https:\/\/master\.test\/w\/canon \(REFERENCE/.test(text));
  check('the placed region renders', /The road in — the region a stranger meets first/.test(text));
}

console.log('\n=== CONTROL — a table holding its own spatial composes exactly as before ===');
{
  const text = await engage('https://ctl.test/w/frozen', '211', 'someone');
  check('local place wins', /# The place — spatial:scene:211/.test(text) && /The frozen hall — a copy/.test(text));
  check('no REFERENCE marker anywhere', !/REFERENCE, world-genome 1\.54/.test(text));
  check("the master's room text does NOT ride", !/The Slip — a ford/.test(text));
  check('the horizon still rides from the placing (existing behavior)', /# The world above this place \(inherited by placing — spatial:canon at https:\/\/master\.test\/w\/canon/.test(text) && /The road in — the region a stranger meets first/.test(text));
}

console.log('\n=== bare table — no keeper, no spatial: composes without a place, never breaks ===');
{
  const text = await engage('https://bare.test/w/none', '211', 'someone');
  check('engage succeeds', /pool:211 @ https:\/\/bare\.test\/w\/none/.test(text));
  check('no place section', !/# The place —/.test(text));
  check('directive still rides', /# Operating directive/.test(text));
}

console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
if (fail > 0) process.exit(1);
