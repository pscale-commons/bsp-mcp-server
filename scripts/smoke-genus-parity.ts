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
  historyPredSpan,
  memStore,
  parseOrdered,
  pyDumps,
  splitRef,
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
  console.log('— fold (kernel.route) semantics: the counting block —');

  // multi-dot refusal + canonical suggestion
  {
    const store = memStore({ conditions: toPNode({ _: 'conditions', 1: { _: 'layers', 1: 'L0' } }) });
    const r = await genusFold(store, { writes: { 'conditions:1.1.3': 'L2 text' }, note: 'x' });
    check('multi-dot address refused', r.applied === 0 && r.failed.length === 1);
    check('refusal suggests the canonical form', (r.failed[0]?.error ?? '').includes('conditions:1.13'), r.failed[0]?.error);
    const cond = (await store.load('conditions')) as PMap;
    check('refusal reported into conditions:9', String(cond.get('9') ?? '').startsWith('kernel report'));
  }

  // flatten guard + clean fold clears the report + the first lossless leaf (floor 1)
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
    const leaf = h.get('1') as PMap;
    check('birth: lossless leaf at 1, floor 1, kernel-timestamped', ok.leafAddress === '1' && /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\] did the thing$/.test(String(leaf?.get('_'))), String(leaf?.get('_')));
    check('leaf body carries the writes verbatim', String(leaf?.get('1')).includes('surface:3 ←\na reply') && String(leaf?.get('1')).includes('conditions:2 ←'));
    check('leaf meta carries heartbeat + index disposition', String(leaf?.get('2')).includes('heartbeat: 3600') && String(leaf?.get('2')).includes('index: carried'));
  }

  // history is automatic memory — hand-writes refused, stash named
  {
    const store = memStore({});
    const r = await genusFold(store, { writes: { 'history:5': 'graffiti' }, note: 'x' });
    check('hand-write to history refused, stash named', r.applied === 0 && (r.failed[0]?.error ?? '').includes('stash'), r.failed[0]?.error);
  }

  // role-with-handle write keys — the room resolves to the organ (kernel._split_ref;
  // the located:5 fault: "pool:egg-one" misread as block "pool" + non-digit path "egg-one")
  {
    const store = memStore({ pool: toPNode({ _: 'my room' }) });
    store.handle = 'egg-one';
    const r = await genusFold(store, { writes: { 'pool:egg-one:5': 'an answer in my room' }, note: 'answered' });
    check('own-handle write key normalises to the organ', r.applied === 1 && r.failed.length === 0, JSON.stringify(r.failed));
    const pool = (await store.load('pool')) as PMap;
    check('the room carries the answer at 5', String(pool.get('5')) === 'an answer in my room', String(pool.get('5')));
    const foreign = await genusFold(store, { writes: { 'pool:weft:5': 'graft' }, note: 'x' });
    check('foreign-handle write key refused as not-an-organ', foreign.applied === 0 && (foreign.failed[0]?.error ?? '').includes('not an organ'), foreign.failed[0]?.error);
    check('splitRef: address is the trailing digit segment', JSON.stringify(splitRef('purpose:3.2', 'egg-one')) === '["purpose","3.2"]');
    check('splitRef: own-handle suffix is the organ', JSON.stringify(splitRef('pool:egg-one', 'egg-one')) === '["pool",""]');
    check('splitRef: multi-dot rides whole to the address error', JSON.stringify(splitRef('conditions:1.1.4', 'egg-one')) === '["conditions","1.1.4"]');
  }

  // the counting line: 1-9 flat → wrap at the 10th (leaf 11, due 10 over 1-9)
  // → second wrap at the 91st (leaf 111; dues 100 over 10-90, then 110 over 91-99)
  {
    const store = memStore({
      reflexive: toPNode({ _: 'r', 9: { _: 'c', 6: { _: 'history:1', 1: 'history:1:1', 2: 'history:1:-1' } } }),
    });
    const dues: (string | null)[] = [];
    const fold = async (i: number, summary?: string) => {
      const out: any = { writes: { [`surface:${(i % 9) + 1}`]: `act ${i}` }, note: `wake ${i}` };
      if (summary) out.summary = summary;
      const r = await genusFold(store, out);
      dues.push(r.summaryDue);
      return r;
    };
    for (let i = 1; i <= 9; i++) await fold(i);
    let h = (await store.load('history')) as PMap;
    check('birth: nine flat entries, no dues at floor 1', Array.from('123456789').every((d) => h.has(d)) && dues.every((d) => d === null));

    const r10 = await fold(10);
    h = (await store.load('history')) as PMap;
    check('10th wake: supernest, leaf at 11, old entry 5 reads at 05',
      r10.leafAddress === '11' && String(((h.get('_') as PMap).get('5') as PMap).get('_')).endsWith('wake 5'));
    check("due '10' — the summary of 1-9 (previous nine)", r10.summaryDue === '10' && historyPredSpan('10', 2) === '1-9');

    const r11 = await fold(11, 'First nine: standing up.');
    h = (await store.load('history')) as PMap;
    check('payment lands at 10 (container 1 voicing)', (h.get('1') as PMap).get('_') === 'First nine: standing up.' && r11.summaryPaidAt === '10' && r11.summaryDue === null);

    for (let i = 12; i <= 90; i++) await fold(i, dues[dues.length - 1] ? 'span done.' : undefined);
    h = (await store.load('history')) as PMap;
    check('90th wake = leaf 99', String(((h.get('9') as PMap).get('9') as PMap).get('_')).endsWith('wake 90'));

    const r91 = await fold(91);
    h = (await store.load('history')) as PMap;
    check('91st wake: second supernest, leaf at 111', r91.leafAddress === '111' && String((((h.get('1') as PMap).get('1') as PMap).get('1') as PMap).get('_')).endsWith('wake 91'));
    check("dues oldest-first: '100' (over 10-90) before '110' (over 91-99)",
      r91.summaryDue === '100' && historyPredSpan('100', 3) === '10-90' && historyPredSpan('110', 3) === '91-99');
    check('double absorption: original entry 5 reads at 005', String((((h.get('_') as PMap).get('_') as PMap).get('5') as PMap).get('_')).endsWith('wake 5'));

    const r92 = await fold(92, 'Eighty-one wakes, compressed.');
    check("100 paid; '110' still owed", r92.summaryPaidAt === '100' && r92.summaryDue === '110');
    const r93 = await fold(93, 'The last pre-wrap nine.');
    check('110 paid; nothing owed', r93.summaryPaidAt === '110' && r93.summaryDue === null);
    const s6 = (((await store.load('reflexive')) as PMap).get('9') as PMap).get('6') as PMap;
    check('dial at the living edge (floor 3)', s6.get('_') === 'history:113' && s6.get('1') === 'history:113:1' && s6.get('2') === 'history:113:-1', JSON.stringify(Object.fromEntries(s6)));
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
