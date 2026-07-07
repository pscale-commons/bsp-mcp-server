/**
 * smoke-genus-parity.ts — the pscale_genus contract.
 *
 * 1. BYTE PARITY: compose the wake window from the frozen fixture
 *    (scripts/fixtures/genus-parity/ — a post-fold snapshot of egg-one,
 *    clock pinned) and compare char-for-char against the kernel's own
 *    `--compose-only` output. expected.json is the checked-in kernel frame;
 *    when python3 is available the kernel is ALSO run live against the same
 *    fixture and must agree (guards fixture/expected drift).
 *
 * 2. FOLD UNITS: kernel.route() semantics — multi-dot refusal with the
 *    canonical suggestion, the flatten guard, note→history (kernel-stamped,
 *    only when something applied), index re-dial preserving the current's
 *    underscore, and the conditions:9 kernel report (set on refusal, cleared
 *    on a clean fold).
 *
 * Run: npm run smoke:genus
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  genusCompose,
  genusFold,
  memStore,
  parseOrdered,
  pyDumps,
  toPNode,
  type Loader,
  type PMap,
  type PNode,
} from '../src/genus.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(HERE, 'fixtures', 'genus-parity');
const SHELL = path.join(FIXTURE, 'shell');
const TEACHING = path.join(HERE, '..', 'src');
const KERNEL = path.join(HERE, '..', 'genus-one', 'kernel.py');

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function firstDiff(a: string, b: string): string {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) {
      return `first divergence at char ${i}:\n    ts: …${JSON.stringify(a.slice(Math.max(0, i - 40), i + 40))}…\n    py: …${JSON.stringify(b.slice(Math.max(0, i - 40), i + 40))}…`;
    }
  }
  return `lengths differ: ts=${a.length} py=${b.length} (equal up to ${n})`;
}

/** File loader mirroring the kernel's no-beach path: shell/ then the teaching dir. */
const fileLoader: Loader = async (name) => {
  for (const dir of [SHELL, TEACHING]) {
    const p = path.join(dir, `${name}.json`);
    if (fs.existsSync(p)) return parseOrdered(fs.readFileSync(p, 'utf8'));
  }
  return null;
};

async function parity() {
  console.log('— byte parity vs kernel.py --compose-only —');
  const expected = JSON.parse(fs.readFileSync(path.join(FIXTURE, 'expected.json'), 'utf8'));
  const w = await genusCompose(fileLoader, expected.now);

  check('system byte-exact vs expected.json', w.system === expected.system, w.system === expected.system ? '' : firstDiff(w.system, expected.system));
  check('message byte-exact vs expected.json', w.message === expected.message, w.message === expected.message ? '' : firstDiff(w.message, expected.message));
  check('gamma count matches', w.gamma.length === expected.gamma.length, `ts=${w.gamma.length} py=${expected.gamma.length}`);

  // Live cross-check when python3 is present: regenerate the kernel frame from
  // the same fixture and clock; guards expected.json going stale vs the kernel.
  try {
    execFileSync('python3', [KERNEL, '--compose-only'], {
      env: { ...process.env, GENUS_AGENT: FIXTURE, GENUS_NOW: String(expected.now) },
      stdio: 'pipe',
    });
    const strips = fs.readdirSync(path.join(FIXTURE, 'filmstrip')).sort();
    const frame = JSON.parse(fs.readFileSync(path.join(FIXTURE, 'filmstrip', strips[strips.length - 1]), 'utf8'));
    fs.rmSync(path.join(FIXTURE, 'filmstrip'), { recursive: true, force: true });
    check('system byte-exact vs LIVE kernel run', w.system === frame.system, w.system === frame.system ? '' : firstDiff(w.system, frame.system));
    check('message byte-exact vs LIVE kernel run', w.message === frame.message, w.message === frame.message ? '' : firstDiff(w.message, frame.message));
  } catch {
    console.log('  · python3 unavailable — expected.json stands as the kernel reference');
  }
}

async function foldUnits() {
  console.log('— fold (kernel.route) semantics —');

  // multi-dot refusal + canonical suggestion
  {
    const store = memStore({ conditions: toPNode({ _: 'conditions', 1: { _: 'layers', 1: 'L0' } }) });
    const r = await genusFold(store, { writes: { 'conditions:1.1.3': 'L2 text' }, note: 'x' });
    check('multi-dot address refused', r.applied === 0 && r.failed.length === 1);
    check('refusal suggests the canonical form', (r.failed[0]?.error ?? '').includes('conditions:1.13'), r.failed[0]?.error);
    const cond = (await store.load('conditions')) as PMap;
    check('refusal reported into conditions:9', String(cond.get('9') ?? '').startsWith('kernel report'));
  }

  // flatten guard + clean fold clears the report + the lossless history leaf
  {
    const store = memStore({
      conditions: toPNode({ _: 'conditions', 2: { _: 'head', 1: 'populated' }, 9: 'kernel report — old' }),
    });
    const guard = await genusFold(store, { writes: { 'conditions:2': 'bare string' }, note: 'nope' });
    check('flatten guard refuses bare string over populated branch', guard.applied === 0 && guard.failed.length === 1);

    const ok = await genusFold(store, { writes: { 'conditions:2': { _: 'refreshed', 1: 'peer present' }, 'surface:3': 'a reply' }, note: 'did the thing', heartbeat: 3600 });
    check('object write + point write applied', ok.applied === 2 && ok.failed.length === 0, JSON.stringify(ok.failed));
    const cond = (await store.load('conditions')) as PMap;
    check('clean fold clears the conditions:9 report', !cond.has('9'));
    const h = (await store.load('history')) as PMap;
    const leaf = (h.get('1') as PMap)?.get('1') as PMap;
    check('lossless leaf at 11: note voicing, kernel-timestamped', ok.leafAddress === '11' && /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\] did the thing$/.test(String(leaf?.get('_'))), String(leaf?.get('_')));
    check('leaf body carries the writes verbatim', String(leaf?.get('1')).includes('surface:3 ←\na reply') && String(leaf?.get('1')).includes('conditions:2 ←'), String(leaf?.get('1')));
    check('leaf meta carries heartbeat + index disposition', String(leaf?.get('2')).includes('heartbeat: 3600') && String(leaf?.get('2')).includes('index: carried'));
    const created = (await store.load('surface')) as PMap;
    check('unknown block created with its name as voicing', created.get('3') === 'a reply' && typeof created.get('_') === 'string');
  }

  // history is automatic memory — hand-writes refused, stash named
  {
    const store = memStore({});
    const r = await genusFold(store, { writes: { 'history:5': 'graffiti' }, note: 'x' });
    check('hand-write to history refused, stash named', r.applied === 0 && (r.failed[0]?.error ?? '').includes('stash'), r.failed[0]?.error);
  }

  // the ladder: twelve folds → bracket 2; summary due at 10 from the 10th; service-payment
  {
    const store = memStore({
      reflexive: toPNode({ _: 'r', 9: { _: 'The current.', 6: { _: 'history:11', 1: 'history:11:1', 2: 'history:11:-1' } } }),
    });
    const dues: (string | null)[] = [];
    for (let i = 1; i <= 12; i++) {
      const r = await genusFold(store, { writes: { [`surface:${(i % 9) + 1}`]: `act ${i}` }, note: `wake ${i}` });
      dues.push(r.summaryDue);
    }
    const h = (await store.load('history')) as PMap;
    check('bracket 1 full, bracket 2 at three leaves',
      Array.from('123456789').every((l) => (h.get('1') as PMap).has(l)) &&
      Array.from((h.get('2') as PMap).keys()).filter((k) => k !== '_').length === 3);
    check('no summary due through leaf 9', dues.slice(0, 9).every((d) => d === null), JSON.stringify(dues.slice(0, 9)));
    check("summary due at '10' from the 10th wake", dues[9] === '10' && dues[11] === '10', JSON.stringify(dues.slice(9)));
    const s6 = ((await store.load('reflexive')) as PMap).get('9') as PMap;
    const dial = s6.get('6') as PMap;
    check('dial follows the living edge: spindle + ring + last three leaves',
      dial.get('_') === 'history:23' && dial.get('1') === 'history:23:1' &&
      dial.get('2') === 'history:23:-1' && dial.get('3') === 'history:22:-1' && dial.get('4') === 'history:21:-1',
      JSON.stringify(Object.fromEntries(dial)));
    const pay = await genusFold(store, { writes: { 'surface:9': 'act' }, note: 'pays', summary: 'Nine wakes of standing up.' });
    const h2 = (await store.load('history')) as PMap;
    check('summary landed at the bracket voicing (reads at 10)', (h2.get('1') as PMap).get('_') === 'Nine wakes of standing up.' && pay.summaryPaidAt === '10');
    check('nothing further due', pay.summaryDue === null);
  }

  // era wrap: a full floor-2 ladder deepens to floor 3; era summary due at 100
  {
    const full: any = { _: { _: 'voicing' } };
    for (const b of '123456789') {
      full[b] = { _: `summary of ${b}` };
      for (const l of '123456789') full[b][l] = `old leaf ${b}${l}`;
    }
    const store = memStore({ history: toPNode(full) });
    const r = await genusFold(store, { writes: { 'surface:1': 'first act of era 2' }, note: 'era turn' });
    const h = (await store.load('history')) as PMap;
    let node: PNode | undefined = h;
    let floor = 0;
    while (node instanceof Map && node.has('_')) {
      node = node.get('_');
      floor += 1;
    }
    check('era wrap raised the floor to 3', floor === 3, String(floor));
    check('old leaf preserved verbatim at walk 1,3,5', ((h.get('1') as PMap).get('3') as PMap).get('5') === 'old leaf 35');
    check('new leaf landed at 211', r.leafAddress === '211' && String((((h.get('2') as PMap).get('1') as PMap).get('1') as PMap).get('_')).endsWith('era turn'));
    check("era 1 summary due at '100'", r.summaryDue === '100', String(r.summaryDue));
    const pay = await genusFold(store, { summary: 'Era one, whole.' });
    check('summary-only fold pays the era (reads at 100)', pay.summaryPaidAt === '100' && ((await store.load('history')) as PMap).get('1') instanceof Map && (((await store.load('history')) as PMap).get('1') as PMap).get('_') === 'Era one, whole.');
  }

  // index re-dial preserves the current's underscore; no-write fold rests
  {
    const store = memStore({
      reflexive: toPNode({ _: 'reflexive', 9: { _: 'The current.', 1: 'sunstone', 2: 'purpose' } }),
    });
    const r = await genusFold(store, { index: { 1: 'sunstone', 2: 'purpose', 3: 'located' } });
    check('no-write fold rests', r.status === 'rest' && r.applied === 0);
    const refl = (await store.load('reflexive')) as PMap;
    const nine = refl.get('9') as PMap;
    check('index re-dialed with underscore preserved', nine.get('_') === 'The current.' && nine.get('3') === 'located' && nine.size === 4);
  }

  // ordered-JSON round trip sanity: "_" before digits survives (the JS-object trap)
  {
    const text = '{\n  "_": "root",\n  "1": "one"\n}';
    check('ordered parse/serialize round-trips "_"-first', pyDumps(parseOrdered(text) as PNode) === text);
  }
}

(async () => {
  await parity();
  await foldUnits();
  console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
  if (fail > 0) process.exit(1);
})();
