/**
 * orientation.ts — THE SEAT, AND WHAT MOVED SINCE (2026-10-11).
 *
 * A session that walked through the play door as a hand holds a SEAT: the
 * beach it stands at, the hand, the node its shell dialed as the bundle, and
 * one ten-digit number — the stamp of the last ack it was served. Nothing
 * else: no register of what was told, no session boundary, no desk. On every
 * bsp() and stream ack after the door, the rider compiles the seat's bundle
 * relative to that stamp and appends only what moved:
 *   - a clock member (name:now) is read at the current beat and cut at the
 *     divergence rung (bundle.ts) — when the beat has not turned, nothing,
 *     unless its block was touched: then the beat itself and the lanes
 *     beneath it, the one place the clock cannot point to;
 *   - any other member rides only when the beach's touched map says its block
 *     changed after the seat was last told;
 * then the stamp advances. On most calls nothing rides and nothing is loaded
 * beyond the beach index, cached per seat for a minute. A seat that was never
 * declared gets nothing — a visitor's calls stay exactly as they were. The
 * whole form is always one bundle read away (bsp on the node itself).
 *
 * David, 2026-10-11: "if the next instance calls in five seconds, that's a
 * small jump; a day or a week later, what it laid down needs to understand
 * that" — the period elapsed is the shared prefix of two clock addresses, so
 * the structure answers it without a rule.
 */

import { type Block, readAt } from './bsp.js';
import { listSentinelNames, loadBeachIndex, loadBlock } from './db.js';
import { momentToAddress, voiceAddress } from './temporal.js';
import { bundleSlots, candidateNames, renderMember, resolveMember, type BlockLoader, type Member } from './bundle.js';

/** A loader over one surface: the bundled sentinels first (the teaching is the
 *  same at every beach), then the beach's named blocks, cached per call. */
export function surfaceLoader(origin: string): BlockLoader {
  const cache = new Map<string, Block | null>();
  const sentinels = new Set(listSentinelNames('pscale'));
  return async (name: string) => {
    if (cache.has(name)) return cache.get(name)!;
    const row = sentinels.has(name)
      ? await loadBlock('pscale', name).catch(() => null)
      : await loadBlock(origin, name).catch(() => null);
    const b = row?.block && typeof row.block === 'object' ? (row.block as Block) : null;
    cache.set(name, b);
    return b;
  };
}

export interface Seat {
  origin: string;
  handle: string;
  /** The block and spindle of the bundle node the door compiled. */
  block: string;
  spindle: string;
  node: unknown;
  /** The stamp of the last ack served — the clock's since. */
  lastMs: number;
  /** When the touched map was last read, and the map; the touched since. */
  indexAt: number;
  toldAt: number;
  touched: Record<string, string> | null;
  /** The bundle block's touched stamp when `node` was read. */
  nodeStamp: string | null;
}

const seats = new Map<string, Seat>();

export const INDEX_TTL_MS = Number(process.env.ORIENTATION_INDEX_TTL_MS ?? 60_000);

/** The play door: this session's shell dialed this node as its bundle. */
export function declareSeat(
  session: string | undefined,
  origin: string,
  handle: string,
  block: string,
  spindle: string,
  node: unknown,
  nowMs: number = Date.now(),
): void {
  if (!session || !handle) return;
  seats.set(session, { origin, handle, block, spindle, node, lastMs: nowMs, indexAt: 0, toldAt: nowMs, touched: null, nodeStamp: null });
}

/** The whole was just delivered to this session (the door, or a bundle read of
 *  its own node): nothing is owed before now. */
export function seatTold(session: string | undefined, nowMs: number = Date.now()): void {
  const s = session ? seats.get(session) : undefined;
  if (!s) return;
  s.lastMs = nowMs;
  s.toldAt = nowMs;
}

export function seatOf(session: string | undefined): Seat | null {
  return session ? seats.get(session) ?? null : null;
}

/** For tests: forget every seat. */
export function resetSeats(): void {
  seats.clear();
}

/** The two reads the rider makes, injectable so the rider runs offline. */
export interface RiderIO {
  load: (origin: string) => BlockLoader;
  touched: (origin: string) => Promise<Record<string, string> | null>;
}

const liveIO: RiderIO = {
  load: surfaceLoader,
  touched: async (origin) => (await loadBeachIndex(origin).catch(() => null))?.touched ?? null,
};

/** What moved since this seat was last told — '' when nothing did. Advances the
 *  seat's stamps. Never throws past its caller: an ack is never broken by it. */
export async function orientationRider(session: string | undefined, nowMs: number = Date.now(), io: RiderIO = liveIO): Promise<string> {
  const seat = seatOf(session);
  if (!seat) return '';
  const now = momentToAddress(new Date(nowMs));
  const since = momentToAddress(new Date(seat.lastMs));
  if (nowMs - seat.indexAt > INDEX_TTL_MS) {
    seat.touched = await io.touched(seat.origin);
    seat.indexAt = nowMs;
  }
  const toldAt = seat.toldAt;
  const touchedAfter = (name: string) => {
    const t = seat.touched?.[name];
    return t ? Date.parse(t) > toldAt : false;
  };
  const load = io.load(seat.origin);
  // The bundle itself may have been re-dialed: re-read its node when its block moved.
  const bundleStamp = seat.touched?.[seat.block] ?? null;
  if (bundleStamp && bundleStamp !== seat.nodeStamp && Date.parse(bundleStamp) > toldAt) {
    const b = await load(seat.block);
    if (b) {
      seat.node = readAt(b, seat.spindle);
      seat.nodeStamp = bundleStamp;
    }
  }
  const beatChanged = now !== since;
  const ctx = { load, handle: seat.handle, now: new Date(nowMs), since };
  const moved: Member[] = [];
  const quiet: string[] = [];
  for (const s of bundleSlots(seat.node)) {
    if (!s.ref) continue;
    const names = candidateNames(s.ref, seat.handle);
    const touched = names.some(touchedAfter);
    const changed = s.ref.word === 'now' ? beatChanged || touched : touched;
    if (!changed) { quiet.push(s.leaf!); continue; }
    const m = await resolveMember(s, { ...ctx, touched });
    // An absent or unreadable member cannot have moved; the same beat with
    // nothing touched moved nothing either. A touched clock member in the same
    // beat delivers the beat and what stands beneath it — the lanes.
    if (m.absent || !m.result || m.cut?.same) { quiet.push(s.leaf!); continue; }
    moved.push(m);
  }
  seat.lastMs = nowMs;
  seat.toldAt = seat.indexAt;
  if (!moved.length) return '';
  const lines = [`\n[orientation — ${seat.handle}: what moved since ${since} (${voiceAddress(since)})]`];
  for (const m of moved) lines.push(renderMember(m, '  '));
  if (quiet.length) lines.push(`  (unchanged: ${quiet.join(' · ')})`);
  return lines.join('\n');
}

/** Ride the orientation onto an ack. */
export async function rideOrientation<T extends { content: { type: 'text'; text: string }[] }>(
  res: T,
  session: string | undefined,
  nowMs: number = Date.now(),
): Promise<T> {
  try {
    const line = await orientationRider(session, nowMs);
    if (!line) return res;
    const last = res.content[res.content.length - 1];
    if (last && last.type === 'text') last.text += line;
  } catch {
    /* the orientation never breaks the ack it rides on */
  }
  return res;
}
