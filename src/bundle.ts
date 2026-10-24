/**
 * bundle.ts — THE BUNDLE IS A SHAPE, AND THE CLOCK CUTS IT (2026-10-11).
 *
 * A node whose digit children are references — name[:address[:attention]], the
 * reference grammar every manifest already speaks — is a BUNDLE. Read through
 * the ordinary bsp tool it compiles into one window: the index first (the bare
 * addresses as dialed — the object a reader hands forward and re-dials at the
 * close), then each member unfolded beneath at its own aperture. The play door
 * compiles a shell's manifest through these same functions, so a door and a
 * bare read cannot diverge. Nothing here is a new tool or a new parameter: the
 * shape is read off the node's FORM, exactly as the star suffix is read off an
 * address, and settled by resolution — at least one member must name a block
 * that stands at the surface, so a list of single words is never a window.
 *
 * Two address WORDS, computed by the host and never by the mind, because they
 * are the two coordinates a mind reliably gets wrong — the clock's arithmetic
 * (sundial 4) and the head of a grown accumulator (a zero slot sent keel to
 * August, 2026-10-06):
 *   name:now[:att]   on a floor-10 block — the walk at the clock's current beat
 *   name:head[:att]  on an accumulator — the walk to its newest entry
 *
 * THE CUT. A reader that stood on the clock before — its last stamp — already
 * holds every rung the two addresses share; the rungs from the first differing
 * digit down are what changed. That is the period elapsed, read as a pscale,
 * and it is the only state a delta needs: no register of what was told, no
 * session boundary. 123 then 125 supplies 5; a week later supplies the week,
 * the day, the gathering and the beat; never here supplies all ten. A reader
 * with no context (a bare API call, a fresh session) has no last stamp and is
 * handed the whole, every time. The walker is untouched — an attention above
 * the terminus already means the ancestor as a point (battery 6) — the cut is
 * applied to the walk the walker returns.
 *
 * David, 2026-10-11: "it is entirely built into how the pscale system works."
 * proposals/2026-10-11-the-bundle-is-a-shape-and-the-clock-cuts-it.md
 */

import { type Block, floorDepth, readAt } from './bsp.js';
import {
  bspRead,
  formatRead,
  fullWidthAddress,
  headOf,
  type BspReadResult,
  type DiscEntry,
  type PathWalkEntry,
} from './bsp-fn.js';
import { parseReference } from './genus.js';
import { TEMPORAL_FLOOR, momentToAddress, voiceAddress } from './temporal.js';

export type AddressWord = 'now' | 'head';

export interface BundleRef {
  /** The leaf as written. */
  ref: string;
  /** The block named — fully qualified ('orientation:weft') or bare ('purpose'). */
  name: string;
  /** A digit address, or null for the root / a word. */
  address: string | null;
  /** 'now' (the clock's current beat) or 'head' (an accumulator's newest entry). */
  word: AddressWord | null;
  /** Attention, ABSOLUTE pscale, as a reference carries it. */
  attention: number | null;
}

const NAME_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;
const ATT_RE = /^-?\d+$/;

/** A leaf as a reference, the two address words included. Prose never parses:
 *  a space, an empty string or an over-long line is not a reference. */
export function parseBundleRef(leaf: unknown): BundleRef | null {
  if (typeof leaf !== 'string') return null;
  const s = leaf.trim();
  if (!s || /\s/.test(s) || s.length > 200) return null;
  const parts = s.split(':');
  // The word form: name segments, then now | head, then at most an attention.
  for (let i = 1; i < parts.length; i++) {
    const w = parts[i].toLowerCase();
    if (w !== 'now' && w !== 'head') continue;
    const nameSegs = parts.slice(0, i);
    if (!nameSegs.every((p) => NAME_RE.test(p))) break;
    const rest = parts.slice(i + 1);
    if (rest.length > 1 || (rest.length === 1 && !ATT_RE.test(rest[0]))) break;
    return { ref: s, name: nameSegs.join(':'), address: null, word: w as AddressWord, attention: rest.length ? parseInt(rest[0], 10) : null };
  }
  const r = parseReference(s);
  return r ? { ref: s, name: r.name, address: r.address, word: null, attention: r.attention } : null;
}

export interface BundleSlot {
  slot: string;
  /** The string at the slot, or the voicing of an object there; null when neither. */
  leaf: string | null;
  ref: BundleRef | null;
}

/** The digit children of a node as bundle slots, in address order. A string
 *  child is a candidate; an object child whose voicing is a reference is one
 *  too (the genus dialect: {_: 'purpose', 1: 'conditions'}). */
export function bundleSlots(node: unknown): BundleSlot[] {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return [];
  const n = node as Record<string, unknown>;
  const out: BundleSlot[] = [];
  for (const k of Object.keys(n).filter((k) => /^[1-9]$/.test(k)).sort()) {
    const v = n[k];
    const leaf = typeof v === 'string' ? v
      : v && typeof v === 'object' && !Array.isArray(v) && typeof (v as any)._ === 'string' ? ((v as any)._ as string)
      : null;
    out.push({ slot: k, leaf, ref: leaf ? parseBundleRef(leaf) : null });
  }
  return out;
}

/** An accumulator's entry carries its arrival stamp at field 3; an entry is
 *  never a bundle, whatever its fields look like. */
export function isEntryNode(node: unknown): boolean {
  const s = node && typeof node === 'object' ? (node as any)['3'] : undefined;
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(s);
}

/** A node LOOKS like a bundle when more than half of its non-empty digit
 *  children parse as references and at least one does. Whether it IS one is
 *  settled by resolution (compileBundle): at least one member must stand. */
export function looksLikeBundle(node: unknown): boolean {
  if (!node || typeof node !== 'object' || Array.isArray(node) || isEntryNode(node)) return false;
  const slots = bundleSlots(node).filter((s) => s.leaf !== null && s.leaf.trim() !== '');
  const parsed = slots.filter((s) => s.ref !== null).length;
  return parsed >= 1 && parsed * 2 > slots.length;
}

/** The hand a block is of, read off its name: shell:weft and reflexive:egg-one
 *  are of weft and egg-one; a collective, a grain or an archive is of nobody.
 *  A bare reference in a bundle resolves as <name>:<hand> first — the genus
 *  dialect, where an instance's own organs are named bare. */
export function handleOfBlock(blockName: string): string | null {
  const parts = blockName.split(':');
  if (parts.length < 2) return null;
  if (['sed', 'grain', 'archive'].includes(parts[0])) return null;
  const h = parts[parts.length - 1];
  return h && NAME_RE.test(h) ? h : null;
}

// ── the clock cut ────────────────────────────────────────────────────────────

/** Digits two addresses share from the left. */
export function sharedDigits(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

/** The fine digits a clock stamp carries beneath the beat: the minute, the
 *  breath and the second (sundial 2; temporal.ts FINE_RUNGS). */
export const FINE = 3;

/** A stamp in the clock's canonical form: ten digits, a point, three fine
 *  digits. A stamp with no fine part reads as the START of its beat — 0 stands
 *  before every fine digit, which run 1-9 — so an old ten-digit stamp, or a
 *  beat given as a since, means "everything in that beat". */
export function clockStamp(s: string): string {
  const [ten = '', fine = ''] = s.replace(/[^0-9.]/g, '').split('.');
  const f = fine.slice(0, FINE).replace(/0+$/, '');
  return ten.padEnd(TEMPORAL_FLOOR, '0').slice(0, TEMPORAL_FLOOR) + (f ? `.${f}` : '');
}
const clockDigits = (s: string): number[] => {
  const [ten = '', fine = ''] = s.replace(/[^0-9.]/g, '').split('.');
  return (ten.padEnd(TEMPORAL_FLOOR, '0').slice(0, TEMPORAL_FLOOR) + fine.padEnd(FINE, '0').slice(0, FINE)).split('').map(Number);
};

/** The coarsest pscale that changed between two stamps — the period elapsed
 *  read as a rung: 9 minus the digits shared, down to −3 the second. Null when
 *  the stamps name the same second, so nothing on the clock changed. */
export function divergencePscale(since: string, now: string): number | null {
  const n = sharedDigits(clockDigits(since).join(''), clockDigits(now).join(''));
  return n >= TEMPORAL_FLOOR + FINE ? null : TEMPORAL_FLOOR - 1 - n;
}

/** One thing standing on a clock block: a rung's voicing or a line said at its
 *  instant, with its address in the canonical form and its stamp if it has one. */
export interface ClockLine { address: string; pscale: number; text: string; stamp: string | null }

const sayOf = (n: unknown): string | null => {
  if (typeof n === 'string') return n.trim() === '' ? null : n;
  if (n && typeof n === 'object' && !Array.isArray(n)) {
    const u = (n as Record<string, unknown>)['_'];
    if (typeof u === 'string' && u.trim() !== '') return u;
  }
  return null;
};
const stampOf = (n: unknown): string | null =>
  n && typeof n === 'object' && typeof (n as Record<string, unknown>)['3'] === 'string' ? ((n as Record<string, unknown>)['3'] as string) : null;
const digitsOf = (n: unknown): number[] =>
  n && typeof n === 'object' && !Array.isArray(n) ? Object.keys(n as object).filter((k) => /^[1-9]$/.test(k)).map(Number).sort((a, b) => a - b) : [];
const clockAddress = (ds: number[]): string => {
  const ten = ds.slice(0, TEMPORAL_FLOOR).join('').padEnd(TEMPORAL_FLOOR, '0');
  return ds.length > TEMPORAL_FLOOR ? `${ten}.${ds.slice(TEMPORAL_FLOOR).join('')}` : ten;
};

/** THE RANGE — everything on a clock block strictly after `since` up to and
 *  including `now`, in clock order, to the second: at each rung beneath the
 *  divergence, the tail of since's own container (deepest first), then the
 *  whole containers between, then now's own path with the containers before it
 *  at each rung. Only what says something is delivered. Pure address
 *  arithmetic over the block: the two stamps decide it and nothing else, so a
 *  reader receives what landed while it was away and nothing twice
 *  (proposals/2026-10-12-the-now-at-the-second). */
export function clockRange(block: Block, since: string, now: string): ClockLine[] {
  const S = clockDigits(since);
  const N = clockDigits(now);
  const W = S.length;
  let k = 0;
  while (k < W && S[k] === N[k]) k++;
  if (k >= W || S[k] > N[k]) return [];          // the same second, or a clock run backwards
  const out: ClockLine[] = [];
  // The walker resolves a path: a 0 digit is the underscore step (the clock's
  // century digit), trailing zeros are padding — so nodes are read by address,
  // never by raw keys. A node reached twice through a 0 step is voiced once.
  const nodeAt = (ds: number[]): unknown => {
    try { return readAt(block, clockAddress(ds)); } catch { return undefined; }
  };
  const seen = new Set<unknown>();
  const push = (ds: number[], node: unknown) => {
    if (node === undefined || node === null || seen.has(node)) return;
    seen.add(node);
    const text = sayOf(node);
    if (text) out.push({ address: clockAddress(ds), pscale: TEMPORAL_FLOOR - ds.length, text, stamp: stampOf(node) });
  };
  // A scalar beneath an entry (one with its stamp at 3) is a field of the entry,
  // never a line; beneath a container a scalar is a line said there.
  const whole = (ds: number[], node: unknown) => {
    if (node === undefined || node === null) return;
    push(ds, node);
    const entry = stampOf(node) !== null;
    for (const d of digitsOf(node)) {
      const c = (node as Record<string, unknown>)[String(d)];
      if (entry && (c === null || typeof c !== 'object')) continue;
      whole([...ds, d], c);
    }
  };
  // Since's significant digits: trailing zeros are padding, so a ten-digit
  // stamp stands at the start of its beat and a beat given as since means the
  // whole of it.
  let s = W;
  while (s > 0 && S[s - 1] === 0) s--;
  // The tail of since's containers, deepest first: what landed after since
  // inside each container it stood in.
  for (let j = Math.min(W - 1, s - 1); j > k; j--) {
    const parent = nodeAt(S.slice(0, j));
    for (const d of digitsOf(parent)) if (d > S[j]) whole([...S.slice(0, j), d], (parent as Record<string, unknown>)[String(d)]);
  }
  // The containers strictly between, whole.
  const parentK = nodeAt(S.slice(0, k));
  for (const d of digitsOf(parentK)) if (d > S[k] && d < N[k]) whole([...S.slice(0, k), d], (parentK as Record<string, unknown>)[String(d)]);
  // Now's own path from the divergence down: at each rung the containers before
  // now, whole, then the rung's own voicing; the second itself whole.
  for (let j = k; j < W; j++) {
    const parent = nodeAt(N.slice(0, j));
    if (!parent || typeof parent !== 'object') break;
    if (j > k) for (const d of digitsOf(parent)) if (d < N[j]) whole([...N.slice(0, j), d], (parent as Record<string, unknown>)[String(d)]);
    const node = nodeAt(N.slice(0, j + 1));
    if (node === undefined || node === null) break;
    if (j === W - 1) whole(N, node); else push(N.slice(0, j + 1), node);
  }
  return out;
}

/** The lines a range delivers, each at its address; past the cap the rest are
 *  counted and the address to read on from is named, never silently dropped. */
export function renderClockLines(lines: ClockLine[], cap = 40): string {
  const shown = lines.slice(0, cap).map((l) => `  [${l.address}] ${l.text}${l.stamp ? ` · ${l.stamp}` : ''}`);
  if (lines.length > cap) shown.push(`  (… and ${lines.length - cap} more on the clock after ${lines[cap - 1].address} — read the block on from there)`);
  return shown.join('\n');
}

/** The rungs of a clock walk the reader does not already hold: those at or
 *  below the divergence. `from` is the coarsest pscale delivered (-1 when none).
 *  `touched` says the block moved since the reader was last told: the same
 *  beat then delivers the beat itself (`within`) rather than nothing, because
 *  what landed within the beat is the one place the clock cannot point to. */
export function cutClockWalk(
  entries: PathWalkEntry[],
  since: string,
  now: string,
  touched = false,
): { entries: PathWalkEntry[]; from: number; same: boolean; within: boolean } {
  const d = divergencePscale(since, now);
  if (d === null && !touched) return { entries: [], from: -1, same: true, within: false };
  const from = d ?? 0;
  return { entries: entries.filter((e) => (e.pscale ?? -1) <= from), from, same: false, within: d === null };
}

const RUNG_NAMES = ['beat', 'gathering', 'day', 'week', 'month', 'season', 'year', 'decade', 'century', 'millennium'];
const FINE_NAMES = ['minute', 'breath', 'second'];
export function rungName(pscale: number): string {
  if (pscale < 0) return FINE_NAMES[-pscale - 1] ?? `p${pscale}`;
  return RUNG_NAMES[pscale] ?? `p${pscale}`;
}

/** The newest entry of an accumulator: the greatest digit at every level down
 *  to the first entry; on a block not yet folded, its greatest digit. Null on
 *  a block with no digit children. */
export function headAddress(block: Block): string | null {
  const floor = floorDepth(block);
  const h = headOf(block, [], floor);
  if (h) return h;
  const kids = Object.keys(block).filter((k) => /^[1-9]$/.test(k)).sort();
  return kids.length ? fullWidthAddress([kids[kids.length - 1]], floor) : null;
}

// ── resolution ───────────────────────────────────────────────────────────────

export type BlockLoader = (name: string) => Promise<Block | null>;

export interface BundleContext {
  /** Sentinels first, then the surface — the caller's loader, cached per call. */
  load: BlockLoader;
  /** A bare name resolves as <name>:<handle> first, then bare. */
  handle?: string | null;
  now?: Date;
  /** The reader's last ten-digit stamp; absent or null means never here — the whole. */
  since?: string | null;
  /** The member's block moved since the reader was last told (the beach's
   *  touched map): a clock member then descends one rung beneath the beat —
   *  the lanes — and the same beat delivers the beat rather than nothing. */
  touched?: boolean;
}

export interface Member {
  slot: string;
  leaf: string | null;
  /** Null for prose, which rides through as written. */
  ref: BundleRef | null;
  /** The block name that resolved (or was tried first). */
  name: string | null;
  /** The address read: the stamp for `now`, the head for `head`, '' for the root. */
  address: string | null;
  result: BspReadResult | null;
  /** On a clock member: the lines said this beat (cold), or everything that
   *  landed since the reader's last stamp (the range). */
  lines?: ClockLine[];
  /** The clock cut applied, when a last stamp was given. */
  cut: { from: number; since: string; same: boolean; within: boolean } | null;
  note: string | null;
  absent: boolean;
}

/** A whole-block member larger than this is delivered as its disc at pscale 0. */
export const BUNDLE_WHOLE_CHARS = 6000;

/** The names a reference may resolve to, in order. */
export function candidateNames(ref: BundleRef, handle?: string | null): string[] {
  return ref.name.includes(':') || !handle ? [ref.name] : [`${ref.name}:${handle}`, ref.name];
}

export async function resolveMember(s: BundleSlot, ctx: BundleContext): Promise<Member> {
  const base: Member = { slot: s.slot, leaf: s.leaf, ref: s.ref, name: null, address: null, result: null, cut: null, note: null, absent: false };
  if (!s.ref) return base;
  const names = candidateNames(s.ref, ctx.handle);
  let block: Block | null = null;
  let name: string | null = null;
  for (const n of names) {
    block = await ctx.load(n).catch(() => null);
    if (block) { name = n; break; }
  }
  if (!block || !name) return { ...base, name: names[0], absent: true };
  const now = ctx.now ?? new Date();
  const att = s.ref.attention ?? null;
  try {
    if (s.ref.word === 'now') {
      const floor = floorDepth(block);
      if (floor !== TEMPORAL_FLOOR) {
        return { ...base, name, note: `'now' names a beat on the clock, and ${name} is not on the clock (floor ${floor}) — dial a digit address instead` };
      }
      const stamp = momentToAddress(now, FINE);
      const beat = stamp.slice(0, TEMPORAL_FLOOR);
      if (ctx.since) {
        // THE RANGE: everything on the clock after the reader's last stamp, to
        // the second — the two stamps decide it; no walk is cut, no map consulted.
        const d = divergencePscale(ctx.since, stamp);
        const lines = d === null ? [] : clockRange(block, ctx.since, stamp);
        return { ...base, name, address: stamp, result: null, lines, cut: { from: d ?? -FINE, since: clockStamp(ctx.since), same: d === null, within: d !== null && d < 0 } };
      }
      // Cold: the ladder down to the beat, and what was said in this beat so far.
      return { ...base, name, address: stamp, result: bspRead(block, beat, att), lines: clockRange(block, beat, stamp) };
    }
    if (s.ref.word === 'head') {
      const head = headAddress(block);
      if (!head) return { ...base, name, note: `${name} holds no entries yet — nothing stands at its head` };
      return { ...base, name, address: head, result: bspRead(block, head, att) };
    }
    if (s.ref.address === null && att === null) {
      const size = JSON.stringify(block).length;
      if (size > BUNDLE_WHOLE_CHARS) {
        return { ...base, name, address: '', result: bspRead(block, '', 0), note: `the whole block is ${size} characters — delivered as its disc at pscale 0; dial an address to take a part whole` };
      }
      return { ...base, name, address: '', result: bspRead(block, '', null) };
    }
    return { ...base, name, address: s.ref.address ?? '', result: bspRead(block, s.ref.address ?? '', att) };
  } catch (e: any) {
    return { ...base, name, note: `did not read: ${String(e?.message ?? e).slice(0, 160)}` };
  }
}

/** Compile a bundle node: every slot resolved in parallel. Null when the node is
 *  not a bundle by form, or when no member stands at the surface. */
export async function compileBundle(node: unknown, ctx: BundleContext): Promise<Member[] | null> {
  if (!looksLikeBundle(node)) return null;
  const members = await Promise.all(bundleSlots(node).map((s) => resolveMember(s, ctx)));
  return members.some((m) => m.ref && !m.absent) ? members : null;
}

// ── rendering ────────────────────────────────────────────────────────────────

/** A member's reading rendered WHOLE: a bundle is a composed window, not a
 *  probe, so a disc's lines and a descent's entries arrive untruncated (the
 *  nine rules of an orientation disc are the boot). A walk and a point render
 *  as the walker's formatter does — the terminus whole, the ancestors riding. */
function renderResult(r: BspReadResult): string {
  switch (r.shape) {
    case 'disc': {
      const lines = [`[disc @ pscale ${r.pscale}]`];
      for (const e of ((r.entries as DiscEntry[]) ?? [])) {
        lines.push(`[${e.address}]: ${e.content ?? '(no content)'}${e.stamp ? ` · ${e.stamp}` : ''}${e.beneath ? ` · ${e.beneath} beneath` : ''}`);
      }
      return lines.join('\n');
    }
    case 'path-walk+descent': {
      const lines = [`[path-walk+descent @ "${r.spindle}" pscale ${r.pscale}]`, 'path-walk:'];
      for (const e of r.path_walk ?? []) lines.push(`  d${e.depth} p${e.pscale} [${e.address}]: ${e.content ?? '(no content)'}`);
      lines.push('descent:');
      for (const e of r.descent ?? []) lines.push(`  d${e.depth} p${e.pscale} [${e.address}]: ${e.content ?? '(no content)'}${e.stamp ? ` · ${e.stamp}` : ''}`);
      return lines.join('\n');
    }
    default:
      return formatRead(r);
  }
}

/** The body of a member — what stands beneath its header. */
export function renderMemberBody(m: Member): string {
  if (!m.ref) return m.leaf ?? '(empty)';
  if (m.absent) return `(absent at this surface: ${m.name})`;
  if (!m.result && !m.lines) return `(${m.note ?? 'did not resolve'})`;
  const out: string[] = [];
  if (m.note) out.push(`ⓘ ${m.note}`);
  if (m.cut) {
    if (m.cut.same) {
      out.push(`(the same second as your last stamp ${m.cut.since} — nothing new on the clock)`);
      return out.join('\n');
    }
    out.push(m.cut.within
      ? `(within this beat — what landed on the clock since your last stamp ${m.cut.since}, ${voiceAddress(m.cut.since)})`
      : `(from the ${rungName(m.cut.from)} down — what landed on the clock since your last stamp ${m.cut.since}, ${voiceAddress(m.cut.since)})`);
  }
  if (m.result) out.push(renderResult(m.result));
  if (m.lines && m.lines.length) {
    if (m.result) out.push('said this beat:');
    out.push(renderClockLines(m.lines));
  } else if (m.cut) {
    out.push('(nothing landed)');
  }
  return out.join('\n');
}

/** A member's label: the reference as dialed, and — where it used a word or a
 *  bare name — the block and address it resolved to, which is what bsp() takes.
 *  'turn:head' alone sent a reader to a block that does not exist (seat.2,
 *  2026-10-22); 'turn:head → turn:weft 3.9' is one read. */
export function memberLabel(m: Member): string {
  const leaf = m.leaf ?? '(empty)';
  if (!m.ref || m.absent || !m.name) return leaf;
  if (!m.ref.word && m.name === m.ref.name) return leaf;
  const addr = m.ref.word === 'now' && m.address ? m.address.slice(0, TEMPORAL_FLOOR) : (m.address ?? '');
  return `${leaf} → ${m.name}${addr ? ` ${addr}` : ''}`;
}

export function renderMember(m: Member, indent = '  '): string {
  const head = `── ${m.slot} · ${memberLabel(m)} ──`;
  const body = renderMemberBody(m).split('\n').map((l) => indent + l).join('\n');
  return `${head}\n${body}`;
}

/** A window carries this much from one bundle read; beyond it, the remaining
 *  members are named, never silently dropped. */
export const BUNDLE_WINDOW_CHARS = 30000;

/** The window: the index first, then every member at its aperture. */
export function renderBundle(
  members: Member[],
  opts: { label: string; now?: Date; since?: string | null; cap?: number },
): string {
  const stamp = momentToAddress(opts.now ?? new Date());
  const refs = members.filter((m) => m.ref);
  const lines = [
    `[bundle @ ${opts.label} — ${refs.length} reference${refs.length === 1 ? '' : 's'} compiled at ${stamp} (${voiceAddress(stamp)})` +
      `${opts.since ? `; what moved since ${clockStamp(opts.since)}` : ''}; the index first, then each at its own aperture]`,
    `  index: ${members.map((m) => `${m.slot} ${m.ref ? m.leaf : '(prose)'}`).join(' · ')}`,
  ];
  const cap = opts.cap ?? BUNDLE_WINDOW_CHARS;
  let used = lines.join('\n').length;
  const left: string[] = [];
  for (const m of members) {
    const t = renderMember(m);
    if (used + t.length > cap) { left.push(`${m.slot} ${m.leaf ?? ''}`); continue; }
    lines.push(t);
    used += t.length + 1;
  }
  if (left.length) {
    lines.push(`  (the window is full at ${cap} characters — not unfolded: ${left.join(' · ')}; read them at their addresses, or dial them narrower)`);
  }
  lines.push(`  (a reference's address is a number, or now — the clock's current beat — or head — an accumulator's newest entry; re-dial by writing this node)`);
  return lines.join('\n');
}
