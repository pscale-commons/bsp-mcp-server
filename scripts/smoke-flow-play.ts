/**
 * smoke-flow-play.ts — the play flow producer's contract (src/flow-play.ts).
 *
 *  1. OFF IS NOTHING: no dial, or the dial's 7 not reading `on` → no block, no
 *     stub. A composition with no parts (the soft tier declining) is nothing too.
 *  2. ON IS A WALKABLE BLOCK: every key `_` or a digit 1-9 at every level (the
 *     beach's shape gate), no JSON-looking strings, and the call / window / side
 *     / span shape flow-play.ts documents.
 *  3. NINE AT MOST PER SIDE: a side with more than nine parts keeps its eight
 *     largest and gathers the rest under a ninth, losing no span and no chars.
 *  4. FLAGS AND THE THREE KEPT: consecutive calls read first / unchanged /
 *     changed / new against the previous call; a fourth drops the oldest.
 *  5. EVERY SPAN NAMES ITS STRATUM, in the line, where the viewer reads it
 *     (STRATUM_LINE_RE in mindflow/flow/index.html), and the window's own line
 *     carries three percentages that sum to about a hundred.
 *  6. PRIVACY, ADVERSARIALLY: a planted secret and a fat body are PROVEN to be
 *     in the composed window and asserted absent from the published bytes; the
 *     key never appears; the block is a fraction of the window's size.
 *  7. BESIDE, NOT INSIDE: the composition the producer read is byte-identical
 *     before and after publishing.
 *
 * Run: npm run smoke:flow-play
 */

import { memStore, pyDumps, ZK, type BlockStore, type PMap, type PNode } from '../src/genus.js';
import { parseOrdered } from '../src/genus.js';
import { flowPlayBlock, publishPlay } from '../src/flow-play.js';
import { FLOW_WAKES_KEPT, wakesOf, windowOf } from '../src/flow.js';
import type { Composed, Part } from '../src/tools/tiers.js';

const BEACH = 'https://beach.example.test/w/table-open';
const HANDLE = 'Ugarth';
const NOW = 1790000000;
const KEY = 'planted-table-key-4b-never-published';
const PLANT = 'PLANTED-SECRET-2c7e91-hunter2';
const FAT = 'a fat held register body that must never be copied onward '.repeat(400); // ~23k chars

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = '') {
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

type Store = BlockStore & { blocks: Map<string, PNode> };
const dial = (seven?: string): PNode =>
  parseOrdered(JSON.stringify(seven === undefined ? { _: 'the doorbell dial', 1: 'on' } : { _: 'the doorbell dial', 1: 'on', 7: seven }));

const P = (side: 1 | 2, stratum: Part['stratum'], rung: string, ref: string, about: string, text: string): Part =>
  ({ side, stratum, rung, ref, about, text });

/** A composed call whose parts carry the planted secret and the fat body — the
 *  window really did hold them, which is what makes the privacy check a proof. */
function composed(opts: { extraMessage?: number; vary?: string } = {}): Composed {
  const parts: Part[] = [
    P(1, 'physics', '2.1', 'tier:medium:header', "the call's title line", '# THE CALL — make it happen at pool:120'),
    P(1, 'biology', '1.4', 'grit:1.4,1.6,2', "the room's own law", `[THE LAW]\n${'the law as it reads. '.repeat(40)}`),
    P(1, 'biology', '1.4', 'tier:medium:contract', 'THIS CALL', '[THIS CALL] You resolve the moment.'),
    P(2, 'chemistry', '4.2', 'spatial:world:120:walk', 'the place', `[THE PLACE]\n${PLANT} stands behind the bar.`),
    P(2, 'chemistry', '5.3', 'pool:120:beats', 'the story so far', `[THE STORY SO FAR]\n${FAT}`),
    P(2, 'chemistry', '6.1', 'liquid:pool:120:window', 'THE WINDOW', `[THE WINDOW]\n- Ugarth: ${opts.vary ?? 'reaches for the latch'}`),
    P(2, 'chemistry', '2', 'liquid:pool:120:dice', 'the dice', '[THE DICE]\n- Ugarth: luck +3'),
  ];
  for (let i = 0; i < (opts.extraMessage ?? 0); i++) {
    parts.push(P(2, 'chemistry', '5.3', `pool:12${i}:extra`, `filler part ${i}`, `[EXTRA ${i}]\n${'x'.repeat(10 + i)}`));
  }
  const text = parts.filter((p) => p.text !== '').map((p) => p.text).join('\n\n');
  return { text, parts, kind: 'make it happen', room: '120', origin: BEACH };
}

/** The beach's write-shape gate, ported: only `_` and 1-9 at every level. */
function shapeError(v: PNode, p = '<root>'): string | null {
  if (v === null || typeof v === 'number' || typeof v === 'boolean') return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t.length > 1 && (t[0] === '{' || t[0] === '[')) {
      try { if (JSON.parse(t) && typeof JSON.parse(t) === 'object') return `json-looking string at ${p}`; } catch { /* prose */ }
    }
    return null;
  }
  if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) { const e = shapeError(v[i], `${p}[${i}]`); if (e) return e; } return null; }
  for (const [k, x] of v as PMap) {
    if (k !== '_' && !/^[1-9]$/.test(k)) return `bad key ${p}.${k}`;
    const e = shapeError(x, `${p}.${k}`);
    if (e) return e;
  }
  return null;
}

const isSpan = (m: PNode | undefined): m is PMap => m instanceof Map && typeof m.get('1') === 'string' && /^\d+$/.test(String(m.get('2') ?? ''));
/** Every span of a window as [ref, flag, node], sides and gathered parts walked. */
function spansOf(win: PMap): Array<[string, string, PMap]> {
  const out: Array<[string, string, PMap]> = [];
  for (const side of ['1', '2']) {
    const s = win.get(side);
    if (!(s instanceof Map)) continue;
    for (const [d, part] of s) {
      if (d === ZK || !(part instanceof Map)) continue;
      if (isSpan(part)) out.push([String(part.get('1')), String(part.get('4')), part]);
      else for (const [gd, sp] of part as PMap) if (gd !== ZK && isSpan(sp)) out.push([String(sp.get('1')), String(sp.get('4')), sp]);
    }
  }
  return out;
}

(async () => {
  console.log('smoke-flow-play — the play flow producer\n');

  // ── 1. OFF IS NOTHING ──────────────────────────────────────────────────────
  console.log('1. off is nothing');
  {
    const s = memStore({}) as Store;
    check('no dial at all → off', (await publishPlay(s, HANDLE, BEACH, composed(), 'medium', NOW, KEY)) === 'off');
    check('no block written', !s.blocks.has('flow'));
  }
  {
    const s = memStore({ wake: dial('off — not while I am playing') }) as Store;
    check("dial 7 reading 'off' → off", (await publishPlay(s, HANDLE, BEACH, composed(), 'medium', NOW, KEY)) === 'off');
    check('still no block, not even a stub', !s.blocks.has('flow'));
  }
  {
    const s = memStore({ wake: dial() }) as Store;
    check('dial with no position 7 → off', (await publishPlay(s, HANDLE, BEACH, composed(), 'medium', NOW, KEY)) === 'off');
  }
  {
    const s = memStore({ wake: dial('on') }) as Store;
    const empty: Composed = { text: 'nothing new to tell', parts: [], kind: 'the telling', room: '120', origin: BEACH };
    check('a declined composition (no parts) → no window', (await publishPlay(s, HANDLE, BEACH, empty, 'soft', NOW, KEY)) === 'no window');
    check('nothing written for it', !s.blocks.has('flow'));
  }

  // ── 2. ON IS A WALKABLE BLOCK ──────────────────────────────────────────────
  console.log('\n2. on is a walkable block');
  const s = memStore({ wake: dial('on — publish my window composition while this reads on') }) as Store;
  const c1 = composed();
  const before = c1.text;
  check('published', (await publishPlay(s, HANDLE, BEACH, c1, 'medium', NOW, KEY)) === 'published');
  const block = s.blocks.get('flow') as PMap;
  check('a block stands', block instanceof Map);
  check('shape gate: only _ and 1-9 at every level', shapeError(block) === null, shapeError(block) ?? '');
  check('the underscore explains itself', String(block.get(ZK) ?? '').includes('FLOW — the window of Ugarth'));
  check('provenance at 9', String((block.get('9') as PMap)?.get(ZK) ?? '').includes('src/flow-play.ts'));
  const calls = wakesOf(block);
  check('one call standing', calls.length === 1);
  const win1 = windowOf(calls[0])!;
  check('the call line names the tier and the room', /tier=medium at pool:120/.test(String(calls[0].get(ZK))));
  check('the call line says no reply is recorded', /no reply recorded/.test(String(calls[0].get(ZK))));
  check('no reply node is invented', !calls[0].has('2'));
  check('SYSTEM side at 1', String((win1.get('1') as PMap).get(ZK)).startsWith('SYSTEM'));
  check('MESSAGE side at 2', String((win1.get('2') as PMap).get(ZK)).startsWith('MESSAGE'));
  check('every part became a span', spansOf(win1).length === c1.parts.length);

  // ── 7. BESIDE, NOT INSIDE ──────────────────────────────────────────────────
  check('the composition is unchanged by publishing', c1.text === before);

  // ── 5. STRATA ──────────────────────────────────────────────────────────────
  console.log('\n3. every span names its stratum, and the window carries the shares');
  const STRATUM_LINE_RE = /— (PHYSICS|CHEMISTRY|BIOLOGY) —/; // the viewer's own regex
  check('every span line names a stratum', spansOf(win1).every(([, , n]) => STRATUM_LINE_RE.test(String(n.get(ZK)))));
  const wl = String(win1.get(ZK));
  const pcts = [...wl.matchAll(/(physics|chemistry|biology) (\d+)%/g)].map((m) => Number(m[2]));
  check('the window line carries all three shares', pcts.length === 3, wl.slice(-80));
  check('the shares sum to about a hundred', Math.abs(pcts.reduce((a, b) => a + b, 0) - 100) <= 2, String(pcts));

  // ── 6. PRIVACY, ADVERSARIALLY ──────────────────────────────────────────────
  console.log('\n4. privacy — the secret and the body were really there, and are really gone');
  check('PROOF: the planted secret was in the composed window', before.includes(PLANT));
  check('PROOF: the fat body was in the composed window', before.includes(FAT.slice(0, 200)));
  const bytes = pyDumps(block);
  check('the planted secret is absent from the published block', !bytes.includes(PLANT));
  check('the fat body is absent from the published block', !bytes.includes(FAT.slice(0, 200)));
  check('the key is absent from the published block', !bytes.includes(KEY));
  check('the block is a fraction of the window', bytes.length < before.length / 4, `${bytes.length} vs ${before.length}`);
  check('but the SIZES are there', /chars ≈/.test(bytes) && bytes.includes(String(FAT.length + '[THE STORY SO FAR]\n'.length)));

  // ── 4. FLAGS AND THE THREE KEPT ────────────────────────────────────────────
  console.log('\n5. flags across calls, and the three kept');
  check('a first call flags everything first', spansOf(win1).every(([, f]) => f === 'first'));
  await publishPlay(s, HANDLE, BEACH, composed(), 'medium', NOW + 60, KEY);
  const win2 = windowOf(wakesOf(s.blocks.get('flow') as PMap)[1])!;
  check('an identical second call is all unchanged', spansOf(win2).every(([, f]) => f === 'unchanged'), spansOf(win2).map(([r, f]) => `${r}=${f}`).join(' '));
  await publishPlay(s, HANDLE, BEACH, composed({ vary: 'throws the latch wide' }), 'medium', NOW + 120, KEY);
  const win3 = windowOf(wakesOf(s.blocks.get('flow') as PMap)[2])!;
  const byRef = new Map(spansOf(win3).map(([r, f]) => [r, f]));
  check('the part that moved reads changed', byRef.get('liquid:pool:120:window') === 'changed', String(byRef.get('liquid:pool:120:window')));
  check('the parts that did not read unchanged', byRef.get('spatial:world:120:walk') === 'unchanged');
  check('three calls standing', wakesOf(s.blocks.get('flow') as PMap).length === 3);
  await publishPlay(s, HANDLE, BEACH, composed({ vary: 'steps through' }), 'medium', NOW + 180, KEY);
  const after4 = wakesOf(s.blocks.get('flow') as PMap);
  check(`a fourth drops the oldest (${FLOW_WAKES_KEPT} kept)`, after4.length === FLOW_WAKES_KEPT);
  check('the oldest dropped is the first', !spansOf(windowOf(after4[0])!).some(([, f]) => f === 'first'));

  // ── 3. NINE AT MOST PER SIDE ───────────────────────────────────────────────
  console.log('\n6. a side keeps to nine, gathering the smallest');
  {
    const s2 = memStore({ wake: dial('on') }) as Store;
    const big = composed({ extraMessage: 8 }); // message side: 4 + 8 = 12 parts
    const msgParts = big.parts.filter((p) => p.side === 2).length;
    check(`the message side really has more than nine parts (${msgParts})`, msgParts > 9);
    await publishPlay(s2, HANDLE, BEACH, big, 'hard', NOW, KEY);
    const b2 = s2.blocks.get('flow') as PMap;
    check('shape gate still clean', shapeError(b2) === null, shapeError(b2) ?? '');
    const w = windowOf(wakesOf(b2)[0])!;
    const msg = w.get('2') as PMap;
    const slots = [...msg.keys()].filter((k) => k !== ZK);
    check('the side holds nine children at most', slots.length <= 9, `${slots.length}`);
    check('no span was lost', spansOf(w).length === big.parts.length, `${spansOf(w).length} vs ${big.parts.length}`);
    const gathered = [...msg.values()].find((v) => v instanceof Map && !isSpan(v)) as PMap | undefined;
    check('the gathered part explains itself', !!gathered && /one child per span/.test(String(gathered.get(ZK))));
    const sideChars = Number(/([\d,]+) chars/.exec(String(msg.get(ZK)))?.[1].replace(/,/g, ''));
    check('the side reports every char, gathered included', sideChars === big.parts.filter((p) => p.side === 2).reduce((n, p) => n + p.text.length, 0), String(sideChars));
  }

  // ── the block builder alone ────────────────────────────────────────────────
  console.log('\n7. the block builder');
  const solo = flowPlayBlock([], HANDLE, BEACH, NOW);
  check('an empty block is still walkable', shapeError(solo) === null);
  check('it names the viewer URL for this table', String(solo.get(ZK)).includes('source=beach@beach.example.test/w/table-open:flow:Ugarth'));

  console.log(`\n  pass: ${pass}\n  fail: ${fail}`);
  if (fail) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
