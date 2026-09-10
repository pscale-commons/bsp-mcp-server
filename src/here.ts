/**
 * here.ts — the standpoint on space, riding the envelope as digits beside the clock.
 *
 * sundial 8.1: where a handle stands is storable (a person stays somewhere for
 * months) and lives in the handle's own passport line at the real — position 3 of
 * passport:<handle> at the earth beach, a star-ref into spatial:earth. David's
 * ruling (pool:weft 94, 2026-09-07): the holder's S may ride the per-call envelope
 * as DIGITS beside the clock — resolved once from the passport, never unfolded per
 * call; nearby is prefix arithmetic; precision is where the digits stop.
 *
 * So: one read per handle per TTL (the memo below), zero reads per call after that,
 * digits only — the place's own words are one walk of spatial:earth at that
 * address, taken by the mind that wants them. A caller that is not a bare handle
 * (a URL, a sed: or grain: address, the sentinel registry) has no standpoint of
 * its own: an agent's coordinates ride the electricity (sundial 8.2), and a lent
 * turn carries the holder's handle as `handle` or `agent_id`.
 *
 * Grounding is a property of serving (sundial 5.3): this rides the same seam as
 * the now-stamp, so every tool receives it and none is edited.
 * Record: proposals/2026-09-08-the-earth-pass.md.
 */
import { loadBlock } from './db.js';
import { passportLocationRef } from './tools/pool.js';
import { DEFAULT_BEACH } from './db.js';

/** The real — the world every handle shares. Overridable per deployment. */
export const REAL_BEACH = process.env.REAL_BEACH || 'https://earth.beach.happyseaurchin.com';

/** Where a person keeps their own passport — the commons, unless a deployment moves it.
 *  Distinct from REAL_BEACH: the map is the world's, the location line is the person's. */
export const HOME_BEACH = process.env.HOME_BEACH || DEFAULT_BEACH;

/** spatial:earth's floor: +11 the solar system, 0 the room (its own root voicing). */
export const SPATIAL_FLOOR = 11;

/** The population ladder in spatial:earth's own words — a place sits at the pscale
 *  whose power of ten matches the lives it holds: 10^6 a city of a million, 10^3 a
 *  town of a thousand, 10^2 a village, 10^1 a household, 10^0 the room. */
const RUNG_WORDS = [
  'the room',          // 0
  'the household',     // 1
  'the village',       // 2
  'the small town',    // 3
  'the town',          // 4
  'the large town',    // 5
  'the city',          // 6
  'the region',        // 7
  'the country',       // 8
  'the continent',     // 9
  'the planet',        // 10
  'the solar system',  // 11
];

/** A handle that can stand somewhere: no scheme, no prefix, not the sentinel registry. */
export function isBareHandle(s: unknown): s is string {
  if (typeof s !== 'string') return false;
  const h = s.trim();
  if (!h || h === 'pscale') return false;
  if (h.includes(':') || h.includes('/')) return false;
  return /^[A-Za-z0-9][A-Za-z0-9 _.-]*$/.test(h);
}

/** The rung a full-width spatial address reaches: trailing zeros are unresolved
 *  ground, so precision is where the digits stop. */
export function spatialRung(digits: string): { pscale: number; word: string } {
  const walked = digits.replace(/0+$/, '');
  const pscale = Math.max(0, Math.min(SPATIAL_FLOOR, SPATIAL_FLOOR - walked.length));
  return { pscale, word: RUNG_WORDS[pscale] };
}

const host = (origin: string) => origin.replace(/^https?:\/\//, '').replace(/\/+$/, '');

/** The here-stamp: the digits, the rung they reach, and which map — never the words. */
export function renderHere(addr: string, origin: string = REAL_BEACH): string {
  if (!/^\d+$/.test(addr)) return `here · ${addr} · spatial:earth at ${host(origin)}`;
  const { pscale, word } = spatialRung(addr);
  return `here · ${addr} · ${word} (+${pscale}) · spatial:earth at ${host(origin)}`;
}

/** Does position 3 talk about a place at all? Deliberately crude: any mention of a
 *  location, or a long digit run that looks like an address someone meant. It decides
 *  only whether to NUDGE, never where anybody is — so a false positive costs one line
 *  of advice and a false negative costs the silence this exists to end. */
export function namesAPlace(p3: unknown): boolean {
  if (typeof p3 !== 'string') return false;
  return /\blocation\b/i.test(p3) || /\b\d{8,}\b/.test(p3);
}

const TTL_MS = 10 * 60 * 1000;
const memo = new Map<string, { line: string | null; at: number }>();

/** Resolve the caller's standpoint from the tool arguments — `handle` first, else a
 *  bare `agent_id` — reading the passport at the real once per handle per TTL.
 *  Never throws: an unplaced or unreadable handle simply has no here. */
export async function resolveHere(args: unknown): Promise<string | null> {
  const a = (args && typeof args === 'object' ? args : {}) as Record<string, unknown>;
  const raw = isBareHandle(a.handle) ? a.handle : isBareHandle(a.agent_id) ? a.agent_id : null;
  if (!raw) return null;
  const handle = raw.trim();
  const hit = memo.get(handle);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.line;
  let line: string | null = null;
  try {
    // The passport is read where the PERSON keeps it, not where the world does.
    // A location is one line in their own passport at their own beach and nowhere
    // else (char-creation 0), and this reader was the last one still looking at the
    // world's copy — so the stamp and the census disagreed about the same person on
    // the same afternoon, which is the whole duplicate all over again one layer up.
    // REAL_BEACH stays what it always was: where spatial:earth lives, and the origin
    // a bare ref is read against.
    const row = await loadBlock(HOME_BEACH, `passport:${handle}`);
    const ref = row ? passportLocationRef(row.block) : null;
    if (ref) line = renderHere(ref.addr, ref.origin || REAL_BEACH);
    else if (row && namesAPlace((row.block as Record<string, unknown>)?.['3'])) {
      // A passport that SAYS where someone lives but carries no address the map can
      // read. Silence here is the one failure nothing else catches: an assistant
      // writes a perfectly good human sentence, reports success, and the person is
      // simply absent from every map and every proximity read with nobody the wiser.
      // It happened to this substrate's own keeper — his assistant told him "nothing
      // further to write" while he was unplaced. So say it, in the one place an
      // assistant cannot miss: the stamp it already receives on every call.
      line =
        `here · NOT PLACED — passport position 3 names a place but carries no address the map reads; ` +
        `the form and the walk are at char-creation on ${host(REAL_BEACH)}`;
    }
  } catch {
    line = null;
  }
  memo.set(handle, { line, at: Date.now() });
  return line;
}

/** Test seam: forget what was resolved. */
export function forgetHere(): void {
  memo.clear();
}
