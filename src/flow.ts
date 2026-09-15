/**
 * flow.ts — the flow producer.
 *
 * Publishes a genus-one instance's window COMPOSITION to flow:<handle> at its
 * beach, so a holder can watch the agent compile while it operates
 * (happyseaurchin-home mindflow/flow/ reads ?source=beach:flow:<handle>&poll=N).
 * The brief stands on the beach at proposal:flow-producer; the record of what
 * the code decided against it is proposals/2026-09-15-flow-producer.md.
 *
 * WHAT IT IS NOT: a composition part. The window is composed by genusCompose
 * (byte-parity with kernel.py --compose-only) and this reads the RESULT after
 * the fact — a side-effect beside compose, never a change to its bytes, and
 * silent to the instance: nothing is added to the tool result the wearing LLM
 * reads. The dial on the agent's own block is where it knows it is watched.
 *
 * WHAT IT WRITES: a PSCALE block, not a flow document. The beach's shape gate
 * admits only `_` and the digits 1-9 at every level, so the document the viewer
 * draws is expressed as a walkable block — which is also the only shape that
 * explains itself to someone meeting it with bsp() and no viewer at all:
 *
 *   flow:<handle>
 *     _    what this is
 *     1-3  the wakes, oldest first — each {_: the wake line, 1: window, 2: reply}
 *          window  {_, 1: SYSTEM side, 2: MESSAGE side}; a side {_, 1-9: parts in
 *                  window order}; the hydrated bundle (`self`) is a part whose
 *                  children are its currents, one span each
 *          span    {_: its line, 1: reference (name:address:attention, or the
 *                  part's name), 2: chars, 3: lodestone rung, 4: change since the
 *                  previous window — first | new | changed | unchanged |
 *                  unresolved, 5: fingerprint}
 *          reply   {_, 1: writes {_, 1-9: spans whose 4 names the current fed},
 *                  2: the note (its history address and size), 3: in-loop count}
 *     9    provenance
 *
 * LABELS, ADDRESSES AND SIZES ONLY. No span carries text: a reference names a
 * public block at the beach, readable at its address; a write is its address
 * and its size; the note is the size of a line that lives at history:<handle>.
 * Sizes are ESTIMATED from characters (four to a token) and the block says so:
 * this router composes the window but never makes the inference call, so no
 * measured count exists here. Secrets never enter a window and so never enter
 * this; scripts/smoke-flow.ts plants one and a fat body in a fixture shell and
 * asserts zero occurrences.
 *
 * OPT-IN, DEFAULT OFF: position 7 of wake:<handle> (the doorbell dial —
 * holder-flipped, the instance's to re-voice) must read `on`; otherwise nothing
 * is written — no block, no stub. Only a keyed (holder) wake can write it, so a
 * ghost-wake never publishes, and a stale block's newest stamp is the last time
 * the switch was on.
 *
 * BOUNDED STATE, REPLACED WHOLE: three wakes kept, the oldest dropped; every
 * write is the whole block under the shell's own lock (created locked).
 */

import { createHash } from 'node:crypto';

import {
  parseOrdered,
  parseReference,
  pyDumps,
  splitRef,
  ZK,
  type BlockStore,
  type FoldResult,
  type GenusWindow,
  type PMap,
  type PNode,
} from './genus.js';

export const FLOW_SWITCH = '7';
export const FLOW_WAKES_KEPT = 3;
const CHARS_PER_TOKEN = 4;

// ── the lodestone rung a reference answers to — the same table the viewer
//    declares (REF_RUNG in mindflow/flow/index.html); the two stay in step by
//    carrying the rung id in the block, not by re-deriving it there ──────────
const REF_RUNG: Array<[RegExp, string]> = [
  [/^(recipe|index)$/, '7.2'],
  [/^(reflexive|koan)/, '1.1'],
  [/^(vision|constitution|identity|orientation|declaration|passport|shell|cook|reflective-compass)/, '1'],
  [/^(soft-agent|soft_agent|gatekeeper)/, '1.4'],
  [/^(agent_id|face)$/, '1.3'],
  [/^(slate|sunstone|starstone)/, '2.1'],
  [/^(whetstone|conventions|block-conventions|manifest|ways|strata|agent-id|open-commons|sundial|genome|capabilities)/, '2'],
  [/^(purpose)/, '3.1'],
  [/^(history|daily|review|trace|stash|recent history|recent_history)/, '3.2'],
  [/^(order|solid history|solid_history)/, '3.4'],
  [/^(surface)/, '3.4'],
  [/^(conditions|cadence|last-touched|calendar|news|watch)/, '4'],
  [/^(now|frame|presence|spatial|temporal|marks|lighthouse)/, '4.5'],
  [/^(between|relationships|grain|sed)/, '5.1'],
  [/^(room|liquid|pool|peers)/, '5.3'],
  [/^(gap|task|the ask|prompt|pending|user)/, '6.1'],
  [/^(lodestone|function|compile|frame:)/, '7.3'],
];
const RUNG_NAME: Record<string, string> = {
  '1': 'stance', '2': 'ground', '3': 'intention', '4': 'situation', '5': 'relation', '6': 'given', '7': 'composition',
};

export function rungFor(name: string | null | undefined): string | null {
  if (!name) return null;
  const n = name.toLowerCase();
  for (const [re, r] of REF_RUNG) if (re.test(n)) return r;
  return null;
}
const rungWord = (r: string | null): string => (r ? `${RUNG_NAME[r[0]] ?? 'rung'} ${r}` : 'no rung');

// ── the switch — wake:<handle> position 7 reads `on` ─────────────────────────
export function flowSwitch(wake: PNode | null | undefined): boolean {
  if (!(wake instanceof Map)) return false;
  const v = wake.get(FLOW_SWITCH);
  const line = typeof v === 'string' ? v : v instanceof Map && typeof v.get(ZK) === 'string' ? (v.get(ZK) as string) : '';
  return /^\s*on\b/i.test(line);
}

// ── small helpers ────────────────────────────────────────────────────────────
const sha = (s: string): string => createHash('sha256').update(s).digest('hex').slice(0, 10);
const est = (chars: number): number => Math.round(chars / CHARS_PER_TOKEN);
const fmt = (x: number): string => x.toLocaleString('en-GB');
const stamp = (secs: number): string => new Date(secs * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
const bytesOf = (v: PNode | undefined): string => (v === undefined ? '' : pyDumps(v));

const GENOME_SLOTS: Record<string, string> = {
  '1': 'sunstone', '2': 'reflexive', '3': 'vision', '4': 'purpose', '5': 'conditions',
  '6': 'history', '7': 'capabilities', '8': 'relationships', '9': 'surface',
};
const FLAG_WORD: Record<string, string> = {
  first: 'first window recorded',
  new: 'entered since the previous window',
  changed: 'changed since the previous window',
  unchanged: 'carried unchanged from the previous window',
  unresolved: 'UNRESOLVED — the reference stood in the window in place of its content',
};
const GIVEN_ABOUT: Record<string, (h: string) => string> = {
  now: () => 'the clock, opening the given',
  gap: () => 'γ — the structural gaps the frontier found',
  between: () => 'the peers laid beside the window',
  task: (h) => `the holder's line, from task:${h}`,
  room: (h) => `recent speech by others, from pool:${h}`,
  liquid: (h) => `who stands composing now, from liquid:pool:${h}`,
};

/** The block name a reference names, colon-bearing names kept whole. */
function nameOf(ref: string): string {
  const head = ref.split(' ')[0];
  return parseReference(head)?.name ?? head.split(':')[0];
}

/** How a bundle slot is named in the window: a string reference as itself; a
 *  nested dilation by its underscore plus the attention it dials; an unnamed
 *  nested entry by the genome's block for that slot. (viewer refNameOf) */
function refOf(slot: string, entry: PNode | undefined): string {
  if (typeof entry === 'string') return entry;
  if (entry instanceof Map) {
    const u = entry.get(ZK);
    const att = entry.get('1');
    const base = typeof u === 'string' ? u : GENOME_SLOTS[slot] ?? `slot ${slot}`;
    return base + (typeof att === 'string' && /^-?\d+(\.\d+)?$/.test(att) ? ` @${att}` : '');
  }
  return GENOME_SLOTS[slot] ?? `slot ${slot}`;
}

/** The identity a span keeps across windows — by block name, as the viewer keys
 *  its ribbons, so a re-dialed aperture reads as the same current changed. */
function keyOf(side: 1 | 2, grouped: boolean, ref: string): string {
  return grouped ? `self:${nameOf(ref)}` : side === 1 ? `sys:${ref}` : `given:${ref}`;
}

const isSpan = (m: PNode | undefined): m is PMap =>
  m instanceof Map && typeof m.get('1') === 'string' && /^\d+$/.test(String(m.get('2') ?? ''));

interface Span {
  key: string;
  ref: string;
  about: string;
  chars: number;
  rung: string | null;
  hash: string;
  unresolved: boolean;
}

function spanNode(s: Span, prev: Map<string, string> | null): PMap {
  const flag = s.unresolved
    ? 'unresolved'
    : prev === null
      ? 'first'
      : !prev.has(s.key)
        ? 'new'
        : prev.get(s.key) === s.hash
          ? 'unchanged'
          : 'changed';
  const line = `${s.ref} — ${s.about} — ${fmt(s.chars)} chars ≈ ${fmt(est(s.chars))} tokens — ${rungWord(s.rung)} — ${FLAG_WORD[flag]}`;
  return new Map<string, PNode>([
    [ZK, line],
    ['1', s.ref],
    ['2', String(s.chars)],
    ['3', s.rung ?? ''],
    ['4', flag],
    ['5', s.hash],
  ]);
}

/** The fingerprints of a previous window, keyed as spans key themselves. */
function spanHashes(win: PMap | null): Map<string, string> | null {
  if (!win) return null;
  const out = new Map<string, string>();
  for (const side of [1, 2] as const) {
    const s = win.get(String(side));
    if (!(s instanceof Map)) continue;
    for (const [d, part] of s) {
      if (d === ZK || !(part instanceof Map)) continue;
      if (isSpan(part)) out.set(keyOf(side, false, part.get('1') as string), String(part.get('5') ?? ''));
      else for (const [, sp] of part as PMap) if (isSpan(sp)) out.set(keyOf(side, true, sp.get('1') as string), String(sp.get('5') ?? ''));
    }
  }
  return out;
}

/** One side of the window — its parts in window order, one child each; the
 *  hydrated bundle fans one child per current beneath its own line. */
function sideNode(parts: PMap, side: 1 | 2, index: PMap | null, handle: string, prev: Map<string, string> | null): { node: PMap; chars: number; count: number } {
  const node: PMap = new Map<string, PNode>([[ZK, '']]);
  let d = 0;
  let chars = 0;
  let count = 0;
  for (const [k, v] of parts) {
    if (k === ZK) continue;
    if (++d > 9) break; // a side holds at most nine parts by the recipe's own construction
    if (side === 1 && k === 'self' && v instanceof Map) {
      const group: PMap = new Map<string, PNode>([[ZK, '']]);
      let gchars = 0;
      let gcount = 0;
      for (const [slot, cur] of v) {
        if (!/^[1-9]$/.test(slot)) continue;
        const idx = index?.get(slot);
        const ref = refOf(slot, idx);
        const bytes = bytesOf(cur);
        const unresolved = cur === null || cur === undefined || (idx !== undefined && typeof idx !== 'string' && bytes === bytesOf(idx));
        const name = nameOf(ref);
        group.set(slot, spanNode({ key: keyOf(1, true, ref), ref, about: `current ${slot} of the bundle`, chars: bytes.length, rung: rungFor(name) ?? '1', hash: sha(bytes), unresolved }, prev));
        gchars += bytes.length;
        gcount++;
      }
      group.set(ZK, `self — the bundle hydrated: ${gcount} currents, ${fmt(gchars)} chars ≈ ${fmt(est(gchars))} tokens; one child per current, keyed as the index keys it`);
      node.set(String(d), group);
      chars += gchars;
      count += gcount;
      continue;
    }
    const bytes = bytesOf(v);
    const about = side === 1
      ? k === 'recipe' ? 'the composition recipe (reflexive:8.1)' : k === 'index' ? 'the dehydrated bundle (reflexive:9)' : `part ${k} of the system side`
      : GIVEN_ABOUT[k]?.(handle) ?? `part ${k} of the given`;
    node.set(String(d), spanNode({ key: keyOf(side, false, k), ref: k, about, chars: bytes.length, rung: rungFor(k) ?? (side === 1 ? '7.2' : '6.1'), hash: sha(bytes), unresolved: false }, prev));
    chars += bytes.length;
    count++;
  }
  node.set(ZK, `${side === 1 ? 'SYSTEM — what the agent is' : 'MESSAGE — the given it acts on'}: ${count} parts, ${fmt(chars)} chars ≈ ${fmt(est(chars))} tokens`);
  return { node, chars, count };
}

/** The window as composed → its node, flagged against the previous window. */
export function windowNode(w: GenusWindow, handle: string, prevWindow: PMap | null, at: number): PMap {
  const sys = parseOrdered(w.system);
  const msg = parseOrdered(w.message);
  const sysMap: PMap = sys instanceof Map ? sys : new Map();
  const msgMap: PMap = msg instanceof Map ? msg : new Map();
  const index = sysMap.get('index');
  const prev = spanHashes(prevWindow);
  const S = sideNode(sysMap, 1, index instanceof Map ? index : null, handle, prev);
  const M = sideNode(msgMap, 2, null, handle, prev);
  const chars = w.system.length + w.message.length;
  const win: PMap = new Map<string, PNode>([[ZK, '']]);
  win.set('1', S.node);
  win.set('2', M.node);
  win.set(
    ZK,
    `window composed ${stamp(at)} — ${fmt(chars)} chars ≈ ${fmt(est(chars))} tokens, estimated from characters at four to a token — ${S.count + M.count} parts across SYSTEM (1) and MESSAGE (2) — γ ${w.gamma.length} gap(s)${w.prunedAddresses.length ? `, phase-pruned ${w.prunedAddresses.join(', ')}` : ''}`,
  );
  return win;
}

const windowStamp = (win: PMap): string => /^window composed (\S+)/.exec(String(win.get(ZK) ?? ''))?.[1] ?? '?';
const windowTokens = (win: PMap): string => /≈ ([\d,]+) tokens/.exec(String(win.get(ZK) ?? ''))?.[1] ?? '?';

/** The reply — what the wake wrote back, as addresses and sizes. */
export function replyNode(fold: any, r: FoldResult, at: number, handle: string): PMap {
  const writes: Array<[string, PNode]> = [];
  const raw = fold?.writes;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const [k, v] of Object.entries(raw)) writes.push([k, v as PNode]);
  const group: PMap = new Map<string, PNode>([[ZK, '']]);
  let wchars = 0;
  writes.forEach(([addr, content], i) => {
    const bytes = pyDumps(toPNodeSafe(content));
    wchars += bytes.length;
    if (i < 8 || (i === 8 && writes.length === 9)) {
      const [organ] = splitRef(addr, handle);
      const rung = rungFor(organ) ?? '3';
      const line = `write ${addr} — ${fmt(bytes.length)} chars ≈ ${fmt(est(bytes.length))} tokens — ${rungWord(rung)} — feeds ${organ}`;
      group.set(String(i + 1), new Map<string, PNode>([[ZK, line], ['1', addr], ['2', String(bytes.length)], ['3', rung], ['4', organ]]));
    }
  });
  if (writes.length > 9) {
    const rest = writes.slice(8);
    const rchars = rest.reduce((s, [, c]) => s + pyDumps(toPNodeSafe(c)).length, 0);
    group.set('9', new Map<string, PNode>([[ZK, `and ${rest.length} more writes — ${fmt(rchars)} chars ≈ ${fmt(est(rchars))} tokens — ${rest.map(([a]) => a).join(', ')}`], ['1', rest.map(([a]) => a).join(', ')], ['2', String(rchars)], ['3', '3'], ['4', '']]));
  }
  group.set(ZK, writes.length ? `${writes.length} write${writes.length === 1 ? '' : 's'} — ${fmt(wchars)} chars ≈ ${fmt(est(wchars))} tokens — each child an address and a size, its 4 the current it feeds` : 'no writes — the fold carried none');
  const reply: PMap = new Map<string, PNode>([[ZK, '']]);
  reply.set('1', group);
  const note = typeof fold?.note === 'string' ? fold.note : '';
  const leaf = r.leafAddress ?? `history:${handle}`;
  reply.set('2', new Map<string, PNode>([
    [ZK, `note — the voicing of this wake's history leaf${r.leafAddress ? ` at ${r.leafAddress}` : ' (no leaf earned this wake)'} — ${fmt(note.length)} chars ≈ ${fmt(est(note.length))} tokens — intention 3.2 — feeds history`],
    ['1', leaf], ['2', String(note.length)], ['3', '3.2'], ['4', 'history'],
  ]));
  const acted = typeof fold?.acted === 'number' && fold.acted > 0 ? fold.acted : 0;
  reply.set('3', new Map<string, PNode>([
    [ZK, acted ? `${acted} write${acted === 1 ? '' : 's'} landed in-loop by the seat — counted, not logged per turn` : 'no in-loop writes — the wake acted through its fold alone'],
    ['1', 'in-loop'], ['2', '0'], ['3', ''], ['4', String(acted)],
  ]));
  const out = wchars + note.length;
  reply.set(ZK, `reply ${stamp(at)} — status ${r.status} — applied ${r.applied}, refused ${r.failed.length}${acted ? `, ${acted} in-loop` : ''} — ${fmt(out)} chars ≈ ${fmt(est(out))} tokens of writes and note${r.summaryDue ? ' — a history summary is owed' : ''}`);
  return reply;
}
function toPNodeSafe(v: any): PNode {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
  if (v instanceof Map) return v;
  if (Array.isArray(v)) return v.map(toPNodeSafe);
  const m: PMap = new Map();
  for (const [k, x] of Object.entries(v)) m.set(k, toPNodeSafe(x));
  return m;
}

function wakeLine(win: PMap, reply: PMap | null): string {
  const head = `wake ${windowStamp(win)} through the mcp door — window ≈ ${windowTokens(win)} tokens`;
  if (!reply) return `${head} — reply not yet recorded`;
  const rl = String(reply.get(ZK) ?? '');
  return `${head} — ${rl}`;
}

/** The wakes standing in a block, oldest first. */
export function wakesOf(block: PNode | null | undefined): PMap[] {
  if (!(block instanceof Map)) return [];
  const out: PMap[] = [];
  for (const d of ['1', '2', '3', '4', '5', '6', '7', '8']) {
    const w = block.get(d);
    if (w instanceof Map && w.get('1') instanceof Map) out.push(w);
  }
  return out;
}
export const windowOf = (wake: PMap): PMap | null => (wake.get('1') instanceof Map ? (wake.get('1') as PMap) : null);

function underscore(handle: string, beach: string, n: number): string {
  const host = beach.replace(/^https?:\/\//, '');
  return (
    `FLOW — the window of ${handle} as it was composed, wake by wake: what entered the mind, from where, at what size. ` +
    `The last ${FLOW_WAKES_KEPT} wakes stand at 1-${FLOW_WAKES_KEPT}, oldest first (${n} standing now), and the block is replaced whole at every wake — bounded state, edited in place. ` +
    `Each wake: _ its line; 1 the window as composed — {1 SYSTEM, 2 MESSAGE}, each side's children the parts in window order, the hydrated bundle a part whose children are its currents; 2 the reply — {1 writes, 2 the note, 3 in-loop count}. ` +
    `A span reads {_ its line, 1 the reference (name:address:attention, or the part's name), 2 chars, 3 lodestone rung, 4 its change since the previous window — first | new | changed | unchanged | unresolved (for a write: the current it feeds), 5 fingerprint}. ` +
    `LABELS, ADDRESSES AND SIZES ONLY, never text: every reference names a public block at ${host}, readable at its address. ` +
    `Sizes are ESTIMATED from characters, four to a token — the router that composes the window never makes the inference call, so no measured count exists here. ` +
    `Written only while wake:${handle}:${FLOW_SWITCH} reads on; when that switch is off nothing is written, so the newest stamp inside is the last time it was on. ` +
    `Drawn at happyseaurchin.com/mindflow/flow/?source=beach:flow:${handle}&poll=5; provenance at 9.`
  );
}
function provenance(handle: string, at: number): string {
  return (
    `Written by the pscale_genus door of bsp-mcp (pscale-commons/bsp-mcp-server, src/flow.ts) — the door trace:${handle} names 'mcp': the window at compose, the reply at fold, each write under the shell's own key. ` +
    `A wake through another door (the xstream seat, a bare pulse in a tab) composes elsewhere and does not appear here until that door carries the same producer. ` +
    `Last written ${stamp(at)}.`
  );
}

export function flowBlock(wakes: PMap[], handle: string, beach: string, at: number): PMap {
  const b: PMap = new Map<string, PNode>([[ZK, underscore(handle, beach, wakes.length)]]);
  wakes.forEach((w, i) => b.set(String(i + 1), w));
  b.set('9', new Map<string, PNode>([[ZK, provenance(handle, at)]]));
  return b;
}

// ── the two publishers — silent to the instance, never throwing ──────────────

/** After compose: the window lands as the newest wake (reply pending). Returns
 *  'off' (nothing written), 'published', or 'failed: …' for the server log. */
export async function publishCompose(store: BlockStore, handle: string, beach: string, w: GenusWindow, at: number, key?: string): Promise<string> {
  try {
    if (!flowSwitch(await store.load('wake'))) return 'off';
    const existing = await store.load('flow');
    const wakes = wakesOf(existing);
    const prev = wakes.length ? windowOf(wakes[wakes.length - 1]) : null;
    const win = windowNode(w, handle, prev, at);
    const wake: PMap = new Map<string, PNode>([[ZK, wakeLine(win, null)]]);
    wake.set('1', win);
    const kept = [...wakes, wake].slice(-FLOW_WAKES_KEPT);
    await store.save('flow', flowBlock(kept, handle, beach, at), existing === null && key ? { newLock: key } : undefined);
    return 'published';
  } catch (ex: any) {
    return `failed: ${String(ex?.message ?? ex).slice(0, 140)}`;
  }
}

/** After fold: the reply lands beneath the newest wake whose reply is pending. */
export async function publishFold(store: BlockStore, handle: string, beach: string, fold: any, r: FoldResult, at: number): Promise<string> {
  try {
    if (!flowSwitch(await store.load('wake'))) return 'off';
    const existing = await store.load('flow');
    const wakes = wakesOf(existing);
    const last = wakes.length ? wakes[wakes.length - 1] : null;
    const win = last ? windowOf(last) : null;
    if (!last || !win || last.has('2')) return 'no window pending';
    const reply = replyNode(fold, r, at, handle);
    last.set('2', reply);
    last.set(ZK, wakeLine(win, reply));
    await store.save('flow', flowBlock(wakes, handle, beach, at));
    return 'published';
  } catch (ex: any) {
    return `failed: ${String(ex?.message ?? ex).slice(0, 140)}`;
  }
}
