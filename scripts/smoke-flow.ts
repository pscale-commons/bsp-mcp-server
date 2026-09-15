/**
 * smoke-flow.ts — the flow producer contract (src/flow.ts).
 *
 *  1. OFF IS NOTHING: no dial, or the dial's 7 not reading `on` → no block, no stub.
 *  2. ON IS A WALKABLE BLOCK: every key `_` or a digit 1-9 at every level (the
 *     beach's shape gate), no JSON-looking strings, an underscore that explains
 *     itself, the wake / window / side / span shape as documented in flow.ts.
 *  3. FLAGS AND THE THREE KEPT: consecutive windows read unchanged / changed /
 *     first against the previous window; a fourth wake drops the oldest.
 *  4. THE REPLY LANDS BENEATH ITS WINDOW after the real genusFold; a second fold
 *     finds no window pending.
 *  5. PRIVACY, ADVERSARIALLY: a planted secret and a fat body are PROVEN to be in
 *     the composed window, and asserted absent from the published bytes; the
 *     shell key never appears; the block is a fraction of the window's size.
 *  6. BESIDE, NOT INSIDE: the window the producer read is byte-identical before
 *     and after publishing (the parity smoke holds the kernel contract; this
 *     holds that the producer never touches what it reads).
 *
 * Run: npm run smoke:flow
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { genusCompose, genusFold, memStore, parseOrdered, pyDumps, ZK, type BlockStore, type Loader, type PMap, type PNode } from '../src/genus.js';
import { FLOW_WAKES_KEPT, flowSwitch, publishCompose, publishFold, wakesOf, windowOf } from '../src/flow.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHELL = path.join(HERE, 'fixtures', 'genus-parity', 'shell');
const TEACHING = path.join(HERE, '..', 'src');
const BEACH = 'https://beach.example.test';
const HANDLE = 'egg-one';
const NOW = 1783000000; // the parity fixture's pinned clock
const KEY = 'planted-shell-key-7x-never-published';
const PLANT = 'PLANTED-SECRET-9f3a1c-hunter2';
const FAT = 'lorem ipsum dolor sit amet, a fat tool result body that must never be copied onward '.repeat(500); // ~43k chars

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

type Store = BlockStore & { blocks: Map<string, PNode>; saves: Array<{ name: string; opts?: { newLock?: string } }> };
function shellStore(): Store {
  const initial: Record<string, PNode> = {};
  for (const f of fs.readdirSync(SHELL)) if (f.endsWith('.json')) initial[f.replace(/\.json$/, '')] = parseOrdered(fs.readFileSync(path.join(SHELL, f), 'utf8'));
  const mem = memStore(initial);
  const saves: Store['saves'] = [];
  const load: Loader = async (name) => {
    const own = await mem.load(name);
    if (own !== null) return own;
    const p = path.join(TEACHING, `${name}.json`);
    return fs.existsSync(p) ? parseOrdered(fs.readFileSync(p, 'utf8')) : null;
  };
  const save = async (name: string, block: PMap, opts?: { newLock?: string }) => {
    saves.push({ name, opts });
    await mem.save(name, block);
  };
  return { ...mem, load, save, saves, handle: HANDLE };
}
const dial = (seven: string | Record<string, string>): PNode => parseOrdered(JSON.stringify({ _: 'the doorbell dial', 1: 'on — I answer my door', 7: seven }));

/** The beach's write-shape gate, ported: only `_` and 1-9 at every level; no JSON-looking strings. */
function shapeError(v: PNode, p = '<root>'): string | null {
  if (v === null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t.length > 1 && (t[0] === '{' || t[0] === '[')) {
      try {
        const x = JSON.parse(t);
        if (x && typeof x === 'object') return `json-looking string at ${p}`;
      } catch {
        /* prose that merely opens with a brace */
      }
    }
    return null;
  }
  if (typeof v !== 'object') return null;
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) {
      const e = shapeError(v[i], `${p}[${i}]`);
      if (e) return e;
    }
    return null;
  }
  for (const [k, x] of v) {
    if (k !== '_' && !/^[1-9]$/.test(k)) return `bad key ${p}.${k}`;
    const e = shapeError(x, `${p}.${k}`);
    if (e) return e;
  }
  return null;
}
const isSpan = (m: PNode | undefined): m is PMap => m instanceof Map && typeof m.get('1') === 'string' && /^\d+$/.test(String(m.get('2') ?? ''));
/** Every span of a window as [ref, flag, node], sides and groups walked. */
function spans(win: PMap): Array<[string, string, PMap]> {
  const out: Array<[string, string, PMap]> = [];
  for (const side of ['1', '2']) {
    const s = win.get(side);
    if (!(s instanceof Map)) continue;
    for (const [d, part] of s) {
      if (d === ZK || !(part instanceof Map)) continue;
      if (isSpan(part)) out.push([String(part.get('1')), String(part.get('4')), part]);
      else for (const [gd, sp] of part) if (gd !== ZK && isSpan(sp)) out.push([String(sp.get('1')), String(sp.get('4')), sp]);
    }
  }
  return out;
}
const setRoot = (store: Store, block: string, text: string) => {
  const b = store.blocks.get(block);
  if (b instanceof Map) b.set(ZK, text);
};
const emptyFold = { status: 'rest', applied: 0, failed: [], leafAddress: null, leafVoicing: null, summaryDue: null, summaryPaidAt: null };

async function main() {
  console.log('— 1. off is nothing —');
  const store = shellStore();
  let w = await genusCompose(store.load, NOW, new Map(), HANDLE);
  check('no dial → off', (await publishCompose(store, HANDLE, BEACH, w, NOW, KEY)) === 'off');
  check('nothing written', !store.blocks.has('flow') && store.saves.length === 0);
  store.blocks.set('wake', dial('off — flow not published'));
  check('dial 7 off → off', (await publishCompose(store, HANDLE, BEACH, w, NOW, KEY)) === 'off');
  check('still nothing written', !store.blocks.has('flow') && store.saves.length === 0);
  check('flowSwitch: a nested position reads its underscore', flowSwitch(dial({ _: 'on — with a note beneath', 1: 'the note' })));
  check('flowSwitch: "online" is not on', !flowSwitch(dial('online')));
  check('flowSwitch: absent block is off', !flowSwitch(null));
  check('fold with the switch off → off', (await publishFold(store, HANDLE, BEACH, { note: 'x' }, emptyFold, NOW)) === 'off');

  console.log('— 2. on is a walkable block —');
  // plant BEFORE composing, so the plant is proven to be in the window the producer reads
  setRoot(store, 'task', `${String((store.blocks.get('task') as PMap).get(ZK))} ${PLANT}`);
  const task = store.blocks.get('task') as PMap;
  task.set('8', parseOrdered(JSON.stringify({ _: FAT, 1: 'the holder, via a smoke', 3: '2026-07-02T00:00:00Z' })));
  store.blocks.set('wake', dial('on — publish my window composition to flow:egg-one for my holder to watch'));
  w = await genusCompose(store.load, NOW, new Map(), HANDLE);
  const before = w.system + '|' + w.message;
  check('the planted secret IS in the composed window', (w.system + w.message).includes(PLANT));
  check('the fat body IS in the composed window', (w.system + w.message).includes(FAT.slice(1000, 1200)));
  check('switch on → published', (await publishCompose(store, HANDLE, BEACH, w, NOW, KEY)) === 'published');
  check('the window the producer read is untouched', before === w.system + '|' + w.message);
  const block = store.blocks.get('flow') as PMap;
  check('a block stands at flow', block instanceof Map);
  check('created LOCKED under the shell key (new_lock on the first save only)', store.saves.length === 1 && store.saves[0].opts?.newLock === KEY);
  const shape = shapeError(block);
  check('passes the beach shape gate (only _ and 1-9, no JSON-looking strings)', shape === null, shape ?? '');
  const u = String(block.get(ZK));
  check('the underscore explains itself', u.startsWith('FLOW — the window of egg-one') && u.includes('ESTIMATED') && u.includes('wake:egg-one:7'));
  check('provenance at 9', block.get('9') instanceof Map && /pscale_genus door/.test(String((block.get('9') as PMap).get(ZK))));
  const wakes = wakesOf(block);
  check('one wake, at 1', wakes.length === 1 && block.get('1') === wakes[0]);
  check('the wake line says the reply is pending', /reply not yet recorded/.test(String(wakes[0].get(ZK))));
  const win = windowOf(wakes[0])!;
  check(
    'the window line is stamped from the clock and sized from the window',
    String(win.get(ZK)).startsWith(`window composed ${new Date(NOW * 1000).toISOString().slice(0, 19)}Z`) && String(win.get(ZK)).includes(`${(w.system.length + w.message.length).toLocaleString('en-GB')} chars`),
    String(win.get(ZK)).slice(0, 120),
  );
  const sysSide = win.get('1') as PMap;
  const msgSide = win.get('2') as PMap;
  check(
    'SYSTEM side: recipe, index, then the hydrated bundle as a group',
    isSpan(sysSide.get('1')) && (sysSide.get('1') as PMap).get('1') === 'recipe' && (sysSide.get('2') as PMap).get('1') === 'index' && sysSide.get('3') instanceof Map && !isSpan(sysSide.get('3')),
  );
  const self = sysSide.get('3') as PMap;
  const currents = [...self.entries()].filter(([k, v]) => k !== ZK && isSpan(v));
  check('the bundle fans one span per current (≥ 5)', currents.length >= 5, `${currents.length}`);
  check(
    'every current span carries ref, chars, rung, flag=first, fingerprint',
    currents.every(([, v]) => typeof (v as PMap).get('1') === 'string' && /^\d+$/.test(String((v as PMap).get('2'))) && String((v as PMap).get('3')).length > 0 && (v as PMap).get('4') === 'first' && /^[0-9a-f]{10}$/.test(String((v as PMap).get('5')))),
  );
  check('a current is named by its reference with its aperture', currents.some(([, v]) => /:-?\d+$|@-?\d/.test(String((v as PMap).get('1')))), currents.map(([, v]) => String((v as PMap).get('1'))).join(' · '));
  check('MESSAGE side opens with now', isSpan(msgSide.get('1')) && (msgSide.get('1') as PMap).get('1') === 'now' && (msgSide.get('1') as PMap).get('3') === '4.5');
  check('the given names the task part', [...msgSide.values()].some((v) => isSpan(v) && v.get('1') === 'task' && v.get('3') === '6.1'));
  const all = spans(win);
  check('every span in the first window is flagged first', all.every(([, f]) => f === 'first'), all.filter(([, f]) => f !== 'first').map(([r, f]) => `${r}:${f}`).join(','));
  check('every span line carries chars ≈ tokens and a rung word', all.every(([, , sp]) => /\d chars ≈ [\d,]+ tokens — \w+/.test(String(sp.get(ZK)))));

  console.log('— 3. flags across windows, and the three kept —');
  const w2 = await genusCompose(store.load, NOW + 3600, new Map(), HANDLE);
  check('second compose → published', (await publishCompose(store, HANDLE, BEACH, w2, NOW + 3600, KEY)) === 'published');
  check('a later save carries no new_lock', store.saves.length === 2 && store.saves[1].opts === undefined);
  let wk = wakesOf(store.blocks.get('flow'));
  check('two wakes, oldest first', wk.length === 2 && String(windowOf(wk[0])!.get(ZK)).includes(new Date(NOW * 1000).toISOString().slice(0, 16)));
  const s2 = spans(windowOf(wk[1])!);
  check('now changed (the clock moved)', s2.some(([r, f]) => r === 'now' && f === 'changed'));
  check(
    'everything else carried unchanged',
    s2.filter(([r]) => r !== 'now').every(([, f]) => f === 'unchanged'),
    s2.filter(([r, f]) => r !== 'now' && f !== 'unchanged').map(([r, f]) => `${r}:${f}`).join(','),
  );
  setRoot(store, 'purpose', `${String((store.blocks.get('purpose') as PMap).get(ZK))} — re-voiced by the smoke`);
  const w3 = await genusCompose(store.load, NOW + 7200, new Map(), HANDLE);
  await publishCompose(store, HANDLE, BEACH, w3, NOW + 7200, KEY);
  wk = wakesOf(store.blocks.get('flow'));
  const s3 = spans(windowOf(wk[2])!);
  check('three wakes stand', wk.length === 3);
  check('the re-voiced purpose current reads changed', s3.some(([r, f]) => r.startsWith('purpose') && f === 'changed'), s3.filter(([r]) => r.startsWith('purpose')).map(([r, f]) => `${r}:${f}`).join(','));
  check('the untouched currents read unchanged', s3.filter(([r]) => !r.startsWith('purpose') && r !== 'now').every(([, f]) => f === 'unchanged'));
  const w4 = await genusCompose(store.load, NOW + 10800, new Map(), HANDLE);
  await publishCompose(store, HANDLE, BEACH, w4, NOW + 10800, KEY);
  wk = wakesOf(store.blocks.get('flow'));
  check(`a fourth wake keeps ${FLOW_WAKES_KEPT}, dropping the oldest`, wk.length === FLOW_WAKES_KEPT && String(windowOf(wk[0])!.get(ZK)).includes(new Date((NOW + 3600) * 1000).toISOString().slice(0, 16)));
  check('the whole block still passes the shape gate', shapeError(store.blocks.get('flow')!) === null);

  console.log('— 4. the reply lands beneath its window —');
  const fold = { writes: { 'purpose:6.7': 'a leaf written by the smoke' }, note: 'flow smoke — one write, one note', status: 'continue' };
  const r = await genusFold(store, fold);
  check('the real fold applied the write and earned a leaf', r.applied === 1 && !!r.leafAddress, JSON.stringify(r));
  check('fold → published', (await publishFold(store, HANDLE, BEACH, fold, r, NOW + 10801)) === 'published');
  wk = wakesOf(store.blocks.get('flow'));
  const last = wk[wk.length - 1];
  const reply = last.get('2') as PMap;
  check('the newest wake carries the reply at 2', reply instanceof Map && /^reply /.test(String(reply.get(ZK))));
  check('the wake line now carries the reply', /through the mcp door — window ≈ [\d,]+ tokens — reply /.test(String(last.get(ZK))), String(last.get(ZK)).slice(0, 140));
  const writes = reply.get('1') as PMap;
  check(
    'one write span: its address, its size, the current it feeds',
    isSpan(writes.get('1')) && (writes.get('1') as PMap).get('1') === 'purpose:6.7' && (writes.get('1') as PMap).get('4') === 'purpose' && (writes.get('1') as PMap).get('3') === '3.1',
  );
  check('the note span names the history leaf it voiced', isSpan(reply.get('2')) && (reply.get('2') as PMap).get('1') === r.leafAddress && (reply.get('2') as PMap).get('2') === String(fold.note.length));
  check('the in-loop count is zero for a fold-only wake', isSpan(reply.get('3')) && (reply.get('3') as PMap).get('4') === '0');
  check('the earlier wakes carry no reply (none was folded)', !wk[0].has('2') && !wk[1].has('2'));
  check('a second fold finds no window pending', (await publishFold(store, HANDLE, BEACH, fold, r, NOW + 10802)) === 'no window pending');
  check('the block still passes the shape gate', shapeError(store.blocks.get('flow')!) === null);

  console.log('— 5. privacy, adversarially —');
  const bytes = pyDumps(store.blocks.get('flow')!);
  check('the planted secret never reaches the block', !bytes.includes(PLANT));
  check('no 120-char slice of the fat body reaches the block', !bytes.includes(FAT.slice(2000, 2120)) && !bytes.includes(FAT.slice(0, 120)));
  check('the shell key never reaches the block', !bytes.includes(KEY));
  check('no note text reaches the block, only its size', !bytes.includes(fold.note));
  const windowBytes = w4.system.length + w4.message.length;
  check(`the block (${bytes.length} chars) is a fraction of one window (${windowBytes})`, bytes.length < windowBytes / 2);

  console.log('\n=== summary ===');
  console.log(`  pass: ${pass}`);
  console.log(`  fail: ${fail}`);
  if (fail) process.exit(1);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
