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

  // flatten guard + clean fold clears the report + note→history
  {
    const store = memStore({
      conditions: toPNode({ _: 'conditions', 2: { _: 'head', 1: 'populated' }, 9: 'kernel report — old' }),
      history: toPNode({ _: 'History.' }),
    });
    const guard = await genusFold(store, { writes: { 'conditions:2': 'bare string' }, note: 'nope' });
    check('flatten guard refuses bare string over populated branch', guard.applied === 0 && guard.failed.length === 1);

    const ok = await genusFold(store, { writes: { 'conditions:2': { _: 'refreshed', 1: 'peer present' }, 'surface:3': 'a reply' }, note: 'did the thing' });
    check('object write + point write applied', ok.applied === 2 && ok.failed.length === 0, JSON.stringify(ok.failed));
    const cond = (await store.load('conditions')) as PMap;
    check('clean fold clears the conditions:9 report', !cond.has('9'));
    const h = (await store.load('history')) as PMap;
    const entry = String(h.get('1') ?? '');
    check('note became history slot 1, kernel-timestamped', ok.historySlot === '1' && /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\] did the thing$/.test(entry), entry);
    const created = (await store.load('surface')) as PMap;
    check('unknown block created with its name as voicing', created.get('3') === 'a reply' && typeof created.get('_') === 'string');
  }

  // index re-dial preserves the current's underscore; no-note fold rests
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
