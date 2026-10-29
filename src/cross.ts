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

function voiceOf(node: unknown): string | null {
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

export interface CrossLine { who: string; addr: string; text: string }

/** Every line at and beneath a node, in address order, each with its address. */
export function linesAt(node: unknown, digits: string[], floor: number, who: string): CrossLine[] {
  const out: CrossLine[] = [];
  const own = voiceOf(node);
  if (own) out.push({ who, addr: dotted(digits, floor), text: own });
  const walk = (n: unknown, ds: string[]) => {
    if (!n || typeof n !== 'object') return;
    for (const k of Object.keys(n as object).filter((k) => /^[1-9]$/.test(k)).sort()) {
      const child = (n as Record<string, unknown>)[k];
      const d = ds.concat(k);
      const t = voiceOf(child);
      if (t) out.push({ who, addr: dotted(d, floor), text: t });
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
  const spineLine = voiceOf(readAt(spine, digits.slice(0, Math.max(floor, 1)).join('')));
  const names = (index?.blocks ?? []).filter((n) => n.startsWith(`${field}:`) && n.indexOf(':', field.length + 1) < 0);
  const per = await Promise.all(names.map(async (name) => {
    const row = await loadBlock(origin, name).catch(() => null);
    if (!row || !row.block || typeof row.block !== 'object') return [];
    return linesAt(nodeAt(row.block as Block, digits, floor), digits, floor, name.slice(field.length + 1));
  }));
  return { floor, digits, spineLine, lines: per.flat().sort(byAddress) };
}

/** A thread's place as one short block of text: the registry's line, then each
 *  hand's lines at and beneath the place — what the door and the waker hand a
 *  mind taking the work up (function:thread 5). */
export function renderPlace(field: string, address: string, cs: NonNullable<Awaited<ReturnType<typeof crossSection>>>): string {
  const head = dotted(cs.digits.slice(0, cs.floor), cs.floor);
  const out = [`${field}:${address} — ${cs.spineLine ? `${head} in the registry: ${cs.spineLine}` : `no line at ${head} in spine:${field}`}`];
  if (!cs.lines.length) out.push(`  (no hand has tied a knot at ${address} or beneath it yet)`);
  for (const l of cs.lines) out.push(`  ${l.addr} · ${l.who}: ${l.text}`);
  return out.join('\n');
}
