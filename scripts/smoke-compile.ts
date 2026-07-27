/**
 * smoke-compile.ts — the compile contract (proposal 2026-07-22-well-formed-reading).
 *
 * Offline and deterministic: the loader serves the bundled sentinels plus a
 * small in-memory shell. Asserts the two halves of compile():
 *
 *   1. DEREFERENCE — a bundle (node or address) unfolds into its semantics in
 *      one call, nesting preserved; teaching blocks concentrate to skeletons
 *      (inherited kernel behaviour, untouched).
 *   2. COMPLETION — a scoop with no relation carrier gets the sovereignty
 *      shallow point scooped LIVE from open-commons and returned BESIDE the
 *      window; a scoop that carries relation gets nothing; complete:false
 *      gets nothing; a loader that cannot reach the surface gets nothing
 *      (no hardcoded fallback — addresses, never semantics).
 *
 * Run: npm run smoke:compile
 */

import { SENTINELS } from '../src/sentinels.js';
import { toPNode, type PNode, type PMap, type Loader } from '../src/genus.js';
import { compile, collectRefs, orderSweep, renderCompletions, renderFramedValue, renderSweptOrders, parseStarRef, COMPLETION_REGISTRY, type FetchOrigin } from '../src/compile.js';

let pass = 0;
let fail = 0;
const ok = (name: string, cond: boolean, detail = '') => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

const teaching = new Map<string, PNode>();
for (const s of SENTINELS) teaching.set(s.name, toPNode(s.json));

// A minimal shell — the raindrop's own blocks.
const shell = new Map<string, PNode>();
shell.set('purpose', toPNode({ _: 'hold the compile demonstration steady', 1: 'prove the bundle unfolds in one call' }));
shell.set('conditions', toPNode({ _: 'calm; offline fixture; nothing live' }));
shell.set('passport', toPNode({ _: 'the test shell, outward face', 1: 'a fixture' }));
shell.set(
  'relationships',
  toPNode({ _: 'who this shell knows', 1: { _: 'the holder — tends and answers for this shell' } }),
);
shell.set(
  'reflexive',
  toPNode({
    _: 'a test shell',
    9: {
      _: 'the bundle — every block at a dilation',
      1: 'sunstone:1',
      2: 'purpose',
      3: 'conditions',
      4: 'relationships',
      5: { _: 'purpose', 1: 'conditions' },
      6: 'passport',
    },
  }),
);

const load: Loader = async (name) => shell.get(name) ?? teaching.get(name) ?? null;
const blindLoad: Loader = async (name) => shell.get(name) ?? null; // cannot reach the sentinels

const openCommons = teaching.get('open-commons') as PMap;
const sovereignty = ((openCommons.get('3') as PMap).get('_') as string) ?? '';
const lodestone = teaching.get('lodestone') as PMap;
const whoIAm = ((lodestone.get('1') as PMap).get('_') as string) ?? '';
const whereIAm = ((lodestone.get('4') as PMap).get('_') as string) ?? '';
const dims = (r: { completions: { dimension: string }[] }) => r.completions.map((c) => c.dimension).sort().join(',');

console.log('\nDEREFERENCE — the bundle unfolds in one call');
{
  const r = await compile('reflexive:9', load);
  const w = r.window as PMap;
  ok('window is a map of the bundle slots', w instanceof Map && w.size === 6);
  ok('teaching block concentrated to skeleton', w.get('1') instanceof Map && (w.get('1') as PMap).has('_'));
  ok('whole block hydrated at slot 2', w.get('2') instanceof Map && (w.get('2') as PMap).has('1'));
  const nested = w.get('5') as PMap;
  ok('nested slot-bundle hydrated, nesting preserved', nested instanceof Map && nested.get('_') instanceof Map && nested.get('1') instanceof Map);
  ok('dialed refs collected', r.dialed.some((d) => d.ref === 'sunstone:1') && r.dialed.length >= 7);
  ok('a well-authored bundle carries all its dimensions → no completions', r.completions.length === 0);
}

console.log('\nCOMPLETION — uncarried dimensions arrive beside the window');
{
  const frame = toPNode({ _: 'an ad-hoc frame — situation carried, relation and identity absent', 1: 'sunstone:1', 2: 'purpose', 3: 'conditions' });
  const r = await compile(frame, load);
  ok('exactly the absent dimensions complete', dims(r) === 'identity,relation');
  const rel = r.completions.find((c) => c.dimension === 'relation');
  const idn = r.completions.find((c) => c.dimension === 'identity');
  ok('relation: address is the shallow point', rel?.address === 'open-commons:3:0');
  ok('relation: line scooped live from the surface', typeof rel?.line === 'string' && rel.line === sovereignty);
  ok('relation: reason names the failure class', /2026-07-21/.test(rel?.reason ?? ''));
  ok('identity: address is the lodestone stance point', idn?.address === 'lodestone:1:0');
  ok('identity: line scooped live — the reservoir, never hardcoded', typeof idn?.line === 'string' && idn.line === whoIAm);
  ok('identity: reason names the failure class', /P3 forensic/.test(idn?.reason ?? ''));
  const footer = renderCompletions(r.completions);
  ok('footer is visible and self-declaring for both', footer.includes('completed · relation') && footer.includes('completed · identity') && footer.includes('scooped live'));
}

console.log('\nBOUNDS — completion never silent, never hardcoded, never forced');
{
  const frame = toPNode({ _: 'no carriers at all', 1: 'sunstone:1' });
  const r1 = await compile(frame, load, { complete: false });
  ok('complete:false → dereference only', r1.completions.length === 0);
  const r2 = await compile(frame, blindLoad);
  ok('surface unreachable → no completions (no fallback text in code)', r2.completions.length === 0);
  const r3 = await compile(toPNode({ _: 'relation carried by prefix', 1: 'sunstone:1', 2: 'grain:abc123' }), load);
  ok('grain: prefix carries relation', !r3.completions.some((c) => c.dimension === 'relation'));
  const r4 = await compile(toPNode({ _: 'open-commons dialed elsewhere', 1: 'open-commons:2:0' }), load);
  ok('open-commons:2 alone does not carry relation', r4.completions.some((c) => c.dimension === 'relation'));
  ok('registry admits by failure only (three entries, each with a named failure)', COMPLETION_REGISTRY.length === 3 && COMPLETION_REGISTRY.every((e) => e.admittedBy.length > 40));
  ok('collectRefs skips prose voicings', collectRefs(toPNode({ _: 'a sentence with spaces', 1: 'purpose' })).length === 1);
}

console.log('\nS·T·I — the instance-level trio (identity and situation from the lodestone; temporal by the now-footer precedent)');
{
  const r1 = await compile(toPNode({ _: 'identity absent only', 1: 'relationships', 2: 'conditions' }), load);
  ok('identity fires alone', dims(r1) === 'identity');
  const r2 = await compile(toPNode({ _: 'situation absent only', 1: 'relationships', 2: 'passport' }), load);
  ok('situation fires alone', dims(r2) === 'situation');
  const s = r2.completions[0];
  ok('situation: lodestone where-and-when point, scooped live', s?.address === 'lodestone:4:0' && s?.line === whereIAm);
  ok('situation: reason names the failure class', /P2 forensic/.test(s?.reason ?? ''));
  const r3 = await compile(toPNode({ _: 'prefix carriers', 1: 'relationships', 2: 'reflexive:1', 3: 'spatial:urb:3' }), load);
  ok('reflexive: and spatial: prefixes carry identity and situation', r3.completions.length === 0);
  const r4 = await compile(toPNode({ _: 'the lodestone carries its own dimensions', 1: 'relationships', 2: 'lodestone:1', 3: 'lodestone:4' }), load);
  ok('lodestone:1 / lodestone:4 dials are carriers themselves', r4.completions.length === 0);
}

console.log('\nCARRIED — the surrounding envelope counts toward the check, never toward the window');
{
  const frame = toPNode({ _: 'a scene frame, no relation ref of its own', 1: 'sunstone:1', 2: 'conditions' });
  const r1 = await compile(frame, load, { carried: ['pool:111'] });
  ok('a carried room pool satisfies relation', !r1.completions.some((c) => c.dimension === 'relation'));
  ok('carried refs are not hydrated into the window', (r1.window as PMap).size === 2);
  const r2 = await compile(frame, load, { carried: ['spatial:demo:111'] });
  ok('a non-relation carried ref does not satisfy relation', r2.completions.some((c) => c.dimension === 'relation'));
  const r3 = await compile(frame, load, { carried: ['pool:111', 'passport:aurel', 'located:aurel'] });
  ok('the play door shape — pool+passport+located carried → fully quiet', r3.completions.length === 0);
}

console.log('\nMANIFEST SHAPE — the play door bundle (shell:3 entries as digit-keyed refs)');
{
  const bundle = toPNode({ 1: 'purpose', 2: 'relationships', 3: 'conditions' });
  const r = await compile(bundle, load);
  const w = r.window as PMap;
  ok('every entry unfolds', w.size === 3 && w.get('1') instanceof Map && w.get('2') instanceof Map);
  ok('relation and situation carried by the manifest itself; identity completes', dims(r) === 'identity');
}

console.log('\nSTAR-REFS — the origin-qualified grammar crosses beaches (frames-on-the-spine gap 1)');
{
  // A fake world at another origin — colon-bearing block name, floor 1.
  const world = new Map<string, PNode>();
  world.set(
    'spatial:urb',
    toPNode({
      _: 'URB entire — the world rung, true everywhere beneath it.',
      3: { _: 'The Thousand Valleys — resource-rich folds under tribute.', 2: 'The Gal edge — the fringe valleys of the encounter kit.' },
    }),
  );
  const fetchOrigin: FetchOrigin = (o) =>
    o === 'https://world.example' ? async (name) => world.get(name) ?? null : async () => null;

  const p = parseStarRef('*:https://world.example:spatial:urb:3.2:0');
  ok('parse: colon-bearing name splits at the final digit run', p?.name === 'spatial:urb' && p?.address === '3.2' && p?.attention === 0);
  ok('parse: attention optional', parseStarRef('*:https://world.example:spatial:urb:3')?.attention === null);
  ok('parse: prose never parses', parseStarRef('a sentence with spaces *: not a ref') === null);

  // Attention is the ABSOLUTE pscale of the aperture: at floor 1, the point at
  // 3.2 sits at −1 (floor − walk length), the way open-commons:3 points at :0.
  const frame = toPNode({ _: 'a placed frame', 1: 'relationships', 2: '*:https://world.example:spatial:urb:3.2:-1' });
  const r1 = await compile(frame, load, { fetchOrigin });
  ok('star point resolves cross-origin', (r1.window as PMap).get('2') === 'The Gal edge — the fringe valleys of the encounter kit.');
  ok('dialed records the origin', r1.dialed.some((d) => d.origin === 'https://world.example' && d.name === 'spatial:urb'));

  const spindleRef = toPNode({ _: 'walk form', 1: 'relationships', 2: '*:https://world.example:spatial:urb:3.2' });
  const r2 = await compile(spindleRef, load, { fetchOrigin });
  const walk = (r2.window as PMap).get('2');
  ok('star spindle arrives as its walk (ancestors above)', Array.isArray(walk) && walk.length === 2 && String(walk[0]).startsWith('The Thousand Valleys'));

  const r3 = await compile(frame, load); // no factory
  ok('no fetchOrigin → the leaf rides through raw, visible', (r3.window as PMap).get('2') === '*:https://world.example:spatial:urb:3.2:-1');
  const r4 = await compile(toPNode({ _: 'x', 1: 'relationships', 2: '*:https://elsewhere.example:spatial:urb:3.2:0' }), load, { fetchOrigin });
  ok('unknown origin / absent block → raw leaf, never a silent drop', (r4.window as PMap).get('2') === '*:https://elsewhere.example:spatial:urb:3.2:0');
}

console.log('\nORDER AND COLLECT — the v1 sweep (proposal 2026-07-25)');
{
  const saves: Array<{ name: string; slot: string; content: PNode }> = [];
  const save = async (name: string, slot: string, content: PNode) => { saves.push({ name, slot, content }); };
  const empty = await orderSweep('testh', load, { save });
  ok('no order book → zero cost, zero sections', empty.length === 0 && saves.length === 0);

  shell.set(
    'order:testh',
    toPNode({
      _: 'the order book of testh',
      1: { _: 'hold my drive and state for the answer step', 1: { 1: 'purpose', 2: 'conditions' }, 3: '2026-07-25T12:00:00Z' },
      2: { _: 'a malformed order — no bundle at 1' },
      3: { _: 'deliver elsewhere', 1: { 1: 'relationships' }, 2: 'solid:custom' },
    }),
  );
  const swept = await orderSweep('testh', load, { save, carried: ['pool:1'] });
  ok('two well-formed orders swept; malformed slot skipped silently', swept.length === 2 && swept.every((s) => s.slot !== '2'));
  const s1 = swept.find((s) => s.slot === '1')!;
  ok('order 1 assembled — window carries both refs', (s1.result.window as PMap).get('1') instanceof Map && (s1.result.window as PMap).get('2') instanceof Map);
  ok('default delivery is solid:<handle>, same slot', s1.deliverAt === 'solid:testh' && saves.some((w) => w.name === 'solid:testh' && w.slot === '1'));
  ok('explicit deliver-at honoured', swept.find((s) => s.slot === '3')!.deliverAt === 'solid:custom' && saves.some((w) => w.name === 'solid:custom' && w.slot === '3'));
  ok('solid content voiced with purpose + provenance', (() => { const w = saves.find((x) => x.name === 'solid:testh')!; const u = (w.content as PMap).get('_'); return typeof u === 'string' && u.includes('hold my drive') && u.includes('order:testh slot 1'); })());
  ok('delivered flagged true when save lands', s1.delivered === true);

  const again = await orderSweep('testh', load, { save });
  ok('standing subscription — an uncleared order re-sweeps identically', again.length === 2);
  const failing = await orderSweep('testh', load, { save: async () => { throw new Error('locked'); } });
  ok('refused solid write degrades to inline-only, never throws', failing.length === 2 && failing.every((s) => s.delivered === false));
  const noSave = await orderSweep('testh', load, {});
  ok('no save callback → inline-only by construction', noSave.length === 2 && noSave.every((s) => s.delivered === false));
  const rendered = renderSweptOrders('testh', swept);
  ok('sweep declares itself and teaches the clear', rendered.includes('ORDERS SWEPT — order:testh (2)') && rendered.includes('clear a slot once taken'));
  shell.delete('order:testh');
}

console.log('\nFRAMED APERTURE — the delivery form (gap 2)');
{
  ok('a walk renders as bulleted ancestors', renderFramedValue(['URB entire', 'The Gal edge'] as PNode) === '- URB entire\n- The Gal edge');
  ok('a point renders as its line', renderFramedValue('one settled line') === 'one settled line');
  const law = await compile(toPNode({ _: 'law-class', 1: 'relationships', 2: 'purpose' }), load);
  ok('a whole block still hydrates whole (law-class delivery)', renderFramedValue((law.window as PMap).get('2') as PNode).startsWith('{'));
  ok('absent renders as absent', renderFramedValue(null) === '(absent)');
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
