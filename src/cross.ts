/**
 * cross.ts — A FAMILY READ AT AN ADDRESS AND BENEATH IT (2026-10-29).
 *
 * A thread's knots stand in many hands' mirrors at sibling addresses: option k
 * of the knot at A stands at A followed by k, in the mirror of whichever hand
 * took it. Read address by address, a knot nobody asks for is invisible (keel's
 * live run, pool:threads 5; one reader in weft's test stopped two knots short).
 * Read here, every mirror of the family gives its line at the address and every
 * line beneath it, so a thread is whole in one call — at its number for a fold,
 * at the place of its live end for the next hand (function:thread 4).
 *
 * A mirror keeps its spine's floor. The registry nests at its tenth entry, and
 * a mirror born before that still holds its knots at the old floor: it is
 * raised here in memory before it is read, and a supernest keeps every number
 * (sunstone 1.63), so 5.3 in a floor-1 mirror is 05.3 at floor 2. The say raises
 * a writer's own mirror on the beach the same way, one rewrite of the whole
 * mirror, never a write at a zero position (keel, pool:threads 7).
 *
 * proposals/2026-10-29-threads-the-registry.md
 */

import { type Block, floorDepth, readAt, parseSpindle } from './bsp.js';
import { loadBlock, loadBeachIndex } from './db.js';
import { supernest } from './accumulator.js';
import { readSeal } from './colour.js';
import { isGrayEnvelope } from './keys.js';

/** The family every thread on a beach is tied in: its registry spine:thread,
 *  each hand's knots in thread:<handle>, its law function:thread. */
export const THREAD_FIELD = 'thread';

/** A block raised to a floor: each supernest wraps the whole block one level
 *  deeper and keeps every number. A block at or above the floor is returned as is. */
export function raised(block: Block, floor: number): Block {
  let b = block;
  while (floorDepth(b) < floor) b = supernest(b);
  return b;
}

/** The node at a spine's digits in a mirror of any floor, read by pscale: a
 *  lower mirror is raised, a higher one is walked with the spine's address
 *  left-padded to its floor. */
export function nodeAt(block: Block, digits: string[], floor: number): unknown {
  const b = raised(block, floor);
  const extra = floorDepth(b) - floor;
  const ds = extra > 0 ? Array(extra).fill('0').concat(digits) : digits;
  // A rung above the floor is its container's underscore, right-padded as the
  // stream's emitFor pads it (10 is the summary of 11 to 19).
  return readAt(b, ds.join('').padEnd(floorDepth(b), '0'));
}

/** A line's text: the string its underscore chain reaches — or, for a line
 *  whose words are sealed in a colour (coloured stigmergy §2.3), its words
 *  through the colours the session wears at `origin`, else the grey line. */
function voiceOf(node: unknown, origin?: string): string | null {
  const seal = readSeal(node, origin);
  if (seal) return seal.text;
  let n = node;
  while (n && typeof n === 'object') n = (n as Record<string, unknown>)._;
  return typeof n === 'string' && n.trim() !== '' ? n : null;
}

/** An address as a reader writes it: the decimal at the floor, the floor's
 *  padding zeros dropped from the left (05.3 reads as 5.3, as bsp() takes it). */
export function dotted(digits: string[], floor: number): string {
  const left = digits.slice(0, floor).join('').replace(/^0+(?=\d)/, '');
  const right = digits.slice(floor).join('');
  return right ? `${left || '0'}.${right}` : left || '0';
}

/** `shut` — the line is sealed in a colour the reader does not wear, and `text`
 *  is its grey line. `ties` — the co-knots standing in the line's zero, as
 *  written; `tieReads` and `offered` — what readTies found for them. */
export interface CrossLine {
  who: string; addr: string; text: string; shut?: boolean;
  ties?: string[]; tieReads?: TieRead[]; offered?: Offer[];
}

// ── CO-KNOTS — a point tied to a point (proposals/2026-11-13-co-knots.md) ──
//
// A knot is one point: one hand's line at one address. Where the work at that
// point meets a point on another thread, or a point in any block, the line holds
// a co-knot in its own ZERO: its words stand one zero deeper and each co-knot at
// a digit beside them, so 31.01 is the first co-knot of the point 31, and the
// star reads them all (31*). Zero is the one digit no option can take, and a
// hand writes only its own line's zero, so each side of a tie writes its own
// half: one half stands as an offer, both halves as the tie. A co-knot names its
// partner in bsp's own coordinates — '<field>:<spindle>' for a point on a thread
// of this family, '<block> <spindle>' for a point in any block — and ' p<pscale>'
// picks the point on that spindle where the spindle runs on past it, the route
// the partner's thread took from there. With no p the point is the spindle's end.

/** The co-knots standing in a line's zero, as written. A sealed line's zero
 *  holds its seal, never co-knots. */
export function tiesOf(node: unknown): string[] {
  if (!node || typeof node !== 'object') return [];
  const zero = (node as Record<string, unknown>)._;
  if (!zero || typeof zero !== 'object' || Array.isArray(zero) || isGrayEnvelope(zero)) return [];
  const out: string[] = [];
  for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
    let v = (zero as Record<string, unknown>)[k];
    while (v && typeof v === 'object') v = (v as Record<string, unknown>)._;
    if (typeof v === 'string' && v.trim() !== '') out.push(v.trim());
  }
  return out;
}

const TIE = /^(?:([a-z][\w-]*):(\d+(?:\.\d+)?)|([A-Za-z][\w.-]*(?::[\w.-]+)*)\s+(\d+(?:\.\d+)?))(?:\s+p(-?\d+))?$/;

/** A co-knot's partner point: in this family (block null), in another family's
 *  place (family set, not read here), or in a block; with the pscale p picks. */
interface Tie { family: string | null; block: string | null; spindle: string; p: number | null }

function parseTie(raw: string): Tie | null {
  const m = TIE.exec(raw.trim());
  if (!m) return null;
  const p = m[5] !== undefined ? Number(m[5]) : null;
  return m[1] !== undefined ? { family: m[1], block: null, spindle: m[2], p } : { family: null, block: m[3], spindle: m[4], p };
}

/** The point a spindle names at a pscale (the walk's own arithmetic: depth =
 *  floor − pscale), and the spindle's end where it runs on past the point. */
function pointOf(spindle: string, p: number | null, floor: number): { point: string[]; end: string[] | null } | null {
  let ds: string[];
  try { ds = parseSpindle(spindle, floor).digits; } catch { return null; }
  if (p === null) return ds.length ? { point: ds, end: null } : null;
  const depth = floor - p;
  if (depth < 1 || depth > ds.length) return null;
  return { point: ds.slice(0, depth), end: depth < ds.length ? ds : null };
}

/** What a co-knot reaches: the lines at its partner point, the route's end where
 *  it names one, how many lines stand between, and whether the partner ties back.
 *  `note` says why it reaches nothing, when it doesn't. */
export interface TieRead { raw: string; note: string | null; point: string; at: CrossLine[]; end: CrossLine | null; between: number; back: boolean }
/** A co-knot standing elsewhere in the family that names this line's point,
 *  where this line ties nothing back yet. */
export interface Offer { from: string; who: string; text: string }

/** Every line exactly at a point of the family, with its co-knots. */
function linesExactly(mirrors: Map<string, Block>, digits: string[], floor: number, origin?: string): CrossLine[] {
  const out: CrossLine[] = [];
  for (const [who, b] of mirrors) {
    const n = nodeAt(b, digits, floor);
    const text = voiceOf(n, origin);
    if (!text) continue;
    const ties = tiesOf(n);
    out.push({ who, addr: dotted(digits, floor), text, ...(ties.length ? { ties } : {}) });
  }
  return out.sort(byAddress);
}

/** A point as one key: a point on a thread of this family, named as its place or
 *  in one hand's mirror, is that place; a point in a block is that block's. */
function keyOf(t: Tie, digits: string[], field: string): string {
  return t.block === null || t.block.startsWith(`${field}:`) ? `${field}@${digits.join('')}` : `${t.block}@${digits.join('')}`;
}

/** READ THE CO-KNOTS of the lines a read returned, from the family's mirrors the
 *  read already holds (and a block a co-knot names, read once): each line's
 *  co-knots with the lines at their partner points, and the co-knots standing
 *  elsewhere in the family that name a point in this read and are not tied
 *  back. Annotates the lines in place; reads nothing when no line holds one
 *  and no mirror names one. */
export async function readTies(lines: CrossLine[], mirrors: Map<string, Block>, floor: number, field: string, origin?: string): Promise<void> {
  const blocks = new Map<string, Promise<Block | null>>();
  const blockOf = (name: string) => {
    if (!blocks.has(name)) blocks.set(name, origin ? loadBlock(origin, name).then((r) => (r && typeof r.block === 'object' ? r.block as Block : null), () => null) : Promise.resolve(null));
    return blocks.get(name)!;
  };
  const clip = (s: string) => (s.length > 140 ? s.slice(0, 139).trimEnd() + '…' : s);
  for (const l of lines) {
    if (!l.ties?.length) continue;
    const self = `${field}@${parseSpindle(l.addr, floor).digits.join('')}`;
    l.tieReads = [];
    for (const raw of l.ties) {
      const t = parseTie(raw);
      const blank = { raw, point: '', at: [], end: null, between: 0, back: false };
      if (!t) { l.tieReads.push({ ...blank, note: `names no point — a co-knot is ${field}:<spindle> or <block> <spindle>, with p<pscale> for a point on it` }); continue; }
      if (t.family !== null && t.family !== field) {
        l.tieReads.push({ ...blank, note: `a point in the ${t.family} family: pull it with pscale_stream_engage(field='${t.family}', at='${t.spindle}')` });
        continue;
      }
      const inFamily = t.block === null || t.block.startsWith(`${field}:`);
      const target = inFamily ? null : await blockOf(t.block!);
      const tfloor = inFamily ? floor : target ? floorDepth(target) : 1;
      const pt = pointOf(t.spindle, t.p, tfloor);
      if (!pt) { l.tieReads.push({ ...blank, note: `p${t.p} is no point on the spindle ${t.spindle}` }); continue; }
      const point = dotted(pt.point, tfloor);
      let at: CrossLine[];
      let end: CrossLine | null = null;
      let between = 0;
      if (inFamily) {
        const pick = t.block === null ? mirrors : new Map([...mirrors].filter(([who]) => `${field}:${who}` === t.block));
        at = linesExactly(pick, pt.point, floor, origin);
        if (pt.end) {
          end = linesExactly(mirrors, pt.end, floor, origin)[0] ?? null;
          for (let d = pt.point.length + 1; d < pt.end.length; d++) between += linesExactly(mirrors, pt.end.slice(0, d), floor, origin).length;
        }
      } else {
        if (!target) { l.tieReads.push({ ...blank, point, note: `the beach holds no block ${t.block}` }); continue; }
        const n = readAt(target, pt.point.join(''));
        const text = voiceOf(n, origin);
        const ties = tiesOf(n);
        at = text ? [{ who: t.block!, addr: point, text, ...(ties.length ? { ties } : {}) }] : [];
        if (pt.end) {
          const e = voiceOf(readAt(target, pt.end.join('')), origin);
          end = e ? { who: t.block!, addr: dotted(pt.end, tfloor), text: e } : null;
        }
      }
      if (!at.length) { l.tieReads.push({ ...blank, point, note: `no line stands at ${point}` }); continue; }
      const back = at.some((x) => (x.ties ?? []).some((r) => {
        const bt = parseTie(r);
        if (!bt || (bt.family !== null && bt.family !== field)) return false;
        const bp = pointOf(bt.spindle, bt.p, floor);
        return !!bp && keyOf(bt, bp.point, field) === self;
      }));
      l.tieReads.push({ raw, note: null, point, at: at.map((x) => ({ ...x, text: clip(x.text) })), end: end && { ...end, text: clip(end.text) }, between, back });
    }
  }
  // Co-knots elsewhere in the family that name a point in this read, untied back.
  const here = new Map(lines.map((l) => [`${field}@${parseSpindle(l.addr, floor).digits.join('')}`, l]));
  if (!here.size) return;
  for (const [who, b] of mirrors) {
    const raisedB = raised(b, floor);
    const fl = floorDepth(raisedB);
    const extra = fl - floor;
    const walk = (n: unknown, ds: string[]) => {
      if (!n || typeof n !== 'object') return;
      // Above the floor a zero is the floor's own structure (threads 1 to 9 stand
      // at 01 to 09, beneath the root's underscore), walked as the digit 0; at and
      // below the floor a zero is a line's own, holding its co-knots, never lines.
      const z = (n as Record<string, unknown>)._;
      if (ds.length < fl - 1 && z && typeof z === 'object') walk(z, ds.concat('0'));
      for (const k of Object.keys(n as object).filter((k) => /^[1-9]$/.test(k)).sort()) {
        const child = (n as Record<string, unknown>)[k];
        const d = ds.concat(k);
        for (const raw of tiesOf(child)) {
          const t = parseTie(raw);
          if (!t || (t.family !== null && t.family !== field) || (t.block !== null && !t.block.startsWith(`${field}:`))) continue;
          const pt = pointOf(t.spindle, t.p, floor);
          const target = pt && here.get(keyOf(t, pt.point, field));
          if (!target) continue;
          const from = d.slice(extra);
          const fromKey = `${field}@${from.join('')}`;
          if ((target.tieReads ?? []).some((r) => r.back && r.at.some((x) => `${field}@${parseSpindle(x.addr, floor).digits.join('')}` === fromKey))) continue;
          (target.offered ??= []).push({ from: `${field}:${dotted(from, floor)}`, who, text: clip(voiceOf(child, origin) ?? '') });
        }
        walk(child, d);
      }
    };
    walk(raisedB, []);
  }
}

/** A line's co-knots, as a reader receives them beneath it: each partner point
 *  with its first line, whether it ties back, the route's end where the co-knot
 *  names one; then the co-knots offered to this point and not yet tied back. */
export function tieLines(l: CrossLine, indent = '    '): string[] {
  const out: string[] = [];
  for (const r of l.tieReads ?? []) {
    if (r.note) { out.push(`${indent}⨯ ${r.raw} — ${r.note}`); continue; }
    const hands = [...new Set(r.at.map((x) => x.who))].join(', ');
    out.push(`${indent}⨯ ${r.raw} — ${r.point} · ${hands}: ${r.at[0].text} · ${r.back ? 'tied both ways' : `an offer: nothing at ${r.point} ties back yet`}`);
    if (r.end) out.push(`${indent}    → ${r.end.addr} · ${r.end.who}: ${r.end.text}${r.between ? ` (${r.between} ${r.between === 1 ? 'line' : 'lines'} between)` : ''}`);
  }
  for (const o of l.offered ?? []) out.push(`${indent}⨯ offered from ${o.from} · ${o.who}: ${o.text} · not tied back here`);
  return out;
}

/** The one line that says what ⨯ is, given once beneath a read that shows any. */
export const TIE_LEGEND = '(⨯ a co-knot: this point tied to a point on another thread or in a block, standing in the line\'s own zero; pull one with one read at its point, and tie back from your own line\'s zero to make it both ways: proposals/2026-11-13-co-knots.md)';

/** Every line at and beneath a node, in address order, each with its address;
 *  a sealed line as its words through the session's worn colours at `origin`,
 *  else as the grey line, marked shut. */
export function linesAt(node: unknown, digits: string[], floor: number, who: string, origin?: string): CrossLine[] {
  const out: CrossLine[] = [];
  const line = (n: unknown, addr: string, text: string): CrossLine => {
    const ties = tiesOf(n);
    return { who, addr, text, ...(readSeal(n, origin)?.shut ? { shut: true } : {}), ...(ties.length ? { ties } : {}) };
  };
  const own = voiceOf(node, origin);
  if (own) out.push(line(node, dotted(digits, floor), own));
  const walk = (n: unknown, ds: string[]) => {
    if (!n || typeof n !== 'object') return;
    for (const k of Object.keys(n as object).filter((k) => /^[1-9]$/.test(k)).sort()) {
      const child = (n as Record<string, unknown>)[k];
      const d = ds.concat(k);
      const t = voiceOf(child, origin);
      if (t) out.push(line(child, dotted(d, floor), t));
      walk(child, d);
    }
  };
  walk(node, digits);
  return out;
}

/** Address order, a parent before its children: 14 < 14.1 < 14.12 < 14.2. */
export function byAddress(a: CrossLine, b: CrossLine): number {
  const ka = a.addr.replace('.', ''), kb = b.addr.replace('.', '');
  return ka < kb ? -1 : ka > kb ? 1 : a.who.localeCompare(b.who);
}

/** The family `field` at `address` on a beach: the spine's line there (a thread's
 *  registry line), and every mirror's lines at and beneath it, raised to the
 *  spine's floor and laid in address order. Null when the family has no spine. */
export async function crossSection(origin: string, field: string, address: string): Promise<{
  floor: number;
  digits: string[];
  spineLine: string | null;
  spineStamp: string | null;
  lines: CrossLine[];
} | null> {
  const [srow, index] = await Promise.all([
    loadBlock(origin, `spine:${field}`).catch(() => null),
    loadBeachIndex(origin).catch(() => null),
  ]);
  if (!srow || !srow.block || typeof srow.block !== 'object') return null;
  const spine = srow.block as Block;
  const floor = floorDepth(spine);
  const digits = parseSpindle(address, floor).digits;
  // The spine's line for the whole the address belongs to: a thread's registry
  // line stands at its number, whatever depth of the thread is asked for.
  const spineNode = readAt(spine, digits.slice(0, Math.max(floor, 1)).join(''));
  const spineLine = voiceOf(spineNode);
  // The registry line is appended, so the beach stamped it as it landed (its
  // field 3): the one time a thread's lines keep (function:thread 4).
  const stamp = spineNode && typeof spineNode === 'object' ? (spineNode as Record<string, unknown>)['3'] : null;
  const spineStamp = typeof stamp === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(stamp) ? stamp : null;
  const names = (index?.blocks ?? []).filter((n) => n.startsWith(`${field}:`) && n.indexOf(':', field.length + 1) < 0);
  const mirrors = new Map<string, Block>();
  const per = await Promise.all(names.map(async (name) => {
    const row = await loadBlock(origin, name).catch(() => null);
    if (!row || !row.block || typeof row.block !== 'object') return [];
    mirrors.set(name.slice(field.length + 1), row.block as Block);
    return linesAt(nodeAt(row.block as Block, digits, floor), digits, floor, name.slice(field.length + 1), origin);
  }));
  const lines = per.flat().sort(byAddress);
  await readTies(lines, mirrors, floor, field, origin);
  return { floor, digits, spineLine, spineStamp, lines };
}

/** A thread's place as one short block of text: the registry's line, then each
 *  hand's lines at and beneath the place — what the door and the waker hand a
 *  mind taking the work up (function:thread 5). */
export function renderPlace(field: string, address: string, cs: NonNullable<Awaited<ReturnType<typeof crossSection>>>): string {
  const head = dotted(cs.digits.slice(0, cs.floor), cs.floor);
  const out = [`${field}:${address} — ${cs.spineLine ? `${head} in the registry: ${cs.spineLine}${cs.spineStamp ? ` · ${cs.spineStamp}` : ''}` : `no line at ${head} in spine:${field}`}`];
  if (!cs.lines.length) out.push(`  (no hand has tied a knot at ${address} or beneath it yet)`);
  for (const l of cs.lines) out.push(`  ${l.addr} · ${l.who}: ${l.text}`, ...tieLines(l));
  if (cs.lines.some((l) => l.tieReads?.length || l.offered?.length)) out.push(`  ${TIE_LEGEND}`);
  return out.join('\n');
}
