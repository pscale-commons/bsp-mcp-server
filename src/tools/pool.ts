/**
 * tools/pool.ts — pscale_pool_engage primitive.
 *
 * Reconstitutes the response-envelope that made pscale-mcp's pool tools
 * operational. Conventions describe pool shape (block-conventions:4.2); this
 * primitive bundles read + slice-since-marker + synthesis_hint into one tool
 * result so the calling LLM has the personal-synthesis instruction in-context
 * the moment it reads the response. The substrate stays passive; the envelope
 * is what carries the personal-synthesis discipline.
 *
 * Polymorphic by the optional verbs (the spool / frame / destination split —
 * see docs/RPG-POOL-STATE.md §4). The primitive owns transport only; it never
 * synthesises:
 *   (read)        no submit, no contribution → purpose + synthesis_hint + slice.
 *                   A KEYLESS read also carries the liquid concatenation — a visitor
 *                   (no secret) is handed who is HERE NOW, not only what was said.
 *   submit=<text> → STAGE to the liquid buffer (liquid:pool:<name>): one slot per
 *                   author, OVERWRITING; returns the social mirror of co-present
 *                   pending intentions. No pool append, no synthesis. Empty =
 *                   withdraw. This is the pending-mirror affordance for bsp-mcp.
 *   contribution= → COMMIT: atomic append of the text (raw OR an LLM-produced
 *                   synthesis; agnostic) to `destination` — 'pool' (default, the
 *                   shared spool) or a block name like 'solid:<name>'. The
 *                   destination is the objective dial. RPG's subjective case
 *                   (write per-subject spines) is the resolver's bsp() job.
 * submit and contribution may combine (stage then commit in one call).
 *
 * Marker is caller-managed. Pass `since_position` in (the int you stored last
 * time, or omit/0 to receive all). Receive `marker_new` back; store it.
 *
 * Synthesis_hint sourcing (2026-06-03 — 9.1 retired as incompatible with supernest):
 *   1. pool:<name>/_          — the underscore (its purpose, or a pointer to an
 *                               external directive block); never a digit position,
 *                               which the accumulator claims for contributions
 *   2. DEFAULT_SYNTHESIS_HINT  — last resort when there is no underscore
 */

import { z } from 'zod';
import { createHash } from 'node:crypto';
import { Block, writeAt, readAt, floorDepth, formatAddress, parseSpindle } from '../bsp.js';
import { isLocationAddress, ancestorsOf, contains, pscaleOf, walkedOf } from '../grain-address.js';
import {
  loadBlock,
  saveBlock,
  appendToBeach,
  isFederatedOwner,
  DEFAULT_BEACH,
} from '../db.js';

// ── Defaults ──

export const DEFAULT_SYNTHESIS_HINT =
  "Quote each voice verbatim — or near-verbatim — before you synthesise: the voices are the data, the synthesis is yours, and a reader who sees only summaries has lost the pool. Synthesise the contributions through your own purpose. Each visitor reads the same stream and produces their own synthesis — there is no central resolver. Preserve distinct voices. Flag tensions and convergences honestly. What you make of it is yours.";

const READ_PAGE_LIMIT = 200;

/**
 * Deterministic exploding-d10 luck (rules:nomad:2), sha256-seeded so a window's
 * roll is fixed before any resolver reads it — honest dice HANDED by the
 * envelope, not chosen by the resolving LLM. A pure function of the seed; no
 * synthesis, no semantic interpretation (the legitimate substrate concern is
 * entropy, like a checksum). Mirrors nomad-bsp's daemon.
 */
export function deterministicLuck(seed: string): { pos: number; neg: number; luck: number } {
  let h = createHash('sha256').update(seed).digest();
  let i = 0;
  const byte = (): number => {
    if (i >= h.length) { h = createHash('sha256').update(h).digest(); i = 0; }
    return h[i++];
  };
  const d10 = (): number => (byte() % 10) + 1;
  const explode = (): number => { let total = 0, roll: number; do { roll = d10(); total += roll; } while (roll === 10); return total; };
  const pos = explode(), neg = explode();
  return { pos, neg, luck: pos - neg };
}

// ── Digit-path slot helpers (inlined; mirror xstream/lib/bsp-client.ts) ──
// "digit-path" per sunstone:1.64 — sibling + subnest in lex order, distinct
// from supernest (block-wide floor growth, sunstone:1.63).

/**
 * Yields the digit-path enumeration of pool slots — positive integers composed
 * of digits 1-9 only (zeros are skipped: 10, 20, 100, ... are underscore-
 * summary slots reserved for compression). 9 + 81 + 729 = 819 slots, ample
 * for any realistic pool population. Matches block-conventions:9.3.
 */
export function* digitPathSlots(): Generator<string> {
  for (let n = 1; n <= 9; n++) yield String(n);
  for (let n = 11; n <= 99; n++) {
    if (String(n).includes('0')) continue;
    yield String(n);
  }
  for (let n = 111; n <= 999; n++) {
    if (String(n).includes('0')) continue;
    yield String(n);
  }
}

/**
 * Walk a slot path (e.g. "11", "234") through the block, one digit at a time.
 * Returns null if any step is missing or hits a non-object before the path ends.
 */
export function readSlot(block: Block | null, slot: string): any {
  if (typeof block !== 'object' || block === null) return null;
  let cur: any = block;
  for (const ch of slot) {
    if (typeof cur !== 'object' || cur === null) return null;
    cur = cur[ch];
    if (cur === undefined) return null;
  }
  return cur;
}

/**
 * Find the next-free digit-path slot. Same discipline as findNextMarkSpindle in
 * xstream's beach-kernel: at depth 1, any non-null value counts as a claim;
 * at depth 2+, only objects count (strings at depth 2+ are tag-field
 * collisions from a shallower contribution, per block-conventions:9.3).
 */
export function findNextSlot(block: Block | null): string {
  const slots = [...digitPathSlots()];
  let maxIdx = -1;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const v = readSlot(block, slot);
    if (v === null) continue;
    if (slot.length === 1) {
      maxIdx = i;
    } else if (typeof v === 'object') {
      maxIdx = i;
    }
  }
  if (maxIdx === -1) return slots[0];
  if (maxIdx + 1 < slots.length) return slots[maxIdx + 1];
  return slots[slots.length - 1];
}

/**
 * Find the digit-path slot whose entry was authored by `agentId` (its field 1).
 * Liquid (block-conventions:4.5) is one slot per author, OVERWRITING — an author
 * reuses their existing slot if present, else allocates the next free one. Floor-
 * aware (readAt) so it still finds the slot after the buffer has supernested.
 */
export function findAuthorSlot(block: Block | null, agentId: string): string | null {
  if (typeof block !== 'object' || block === null) return null;
  for (const slot of digitPathSlots()) {
    const v = readAt(block, slot);
    if (v == null) continue;
    if (typeof v === 'object' && !Array.isArray(v) && (v as Record<string, any>)['1'] === agentId) {
      return slot;
    }
  }
  return null;
}

// ── Returning-author detection (2026-07-20) ──
// The full directive used to key on since_position === 0 — conflating "read
// from the start" with "first time here". A seat that drops the marker on its
// commits (the first two-player HITL: one seat passed markers and saw the
// pointer; the other omitted them and was re-served the whole law on every
// beat) is NOT a newcomer. The trace is already in the substrate: an author
// with a slot in the pool or its liquid has engaged before. Stateless,
// derived at read, like everything else here.

/** True when the author has any prior trace at this pool: a committed slot, or
 *  a liquid slot (even a withdrawn one — staging is presence). */
export function hasAuthorTrace(pool: Block | null, liquid: Block | null, agentId: string): boolean {
  try {
    if (pool && typeof pool === 'object' &&
        collectContributions(pool, 0).contributions.some((c) => c.agent_id === agentId)) return true;
  } catch { /* malformed pool reads as no trace */ }
  try {
    if (liquid && typeof liquid === 'object' && findAuthorSlot(liquid, agentId) !== null) return true;
  } catch { /* ditto */ }
  return false;
}

// ── Envelope assembly ──

export interface PoolContribution {
  position: number;
  text: string;
  agent_id: string | null;
  address: string | null;
  ts: string | null;
  face: string | null;
}

/**
 * Walk the digit-path enumeration, collect contributions whose slot integer is
 * strictly greater than `since_position`. Capped at READ_PAGE_LIMIT — beyond
 * that, more_available is true and the caller pages by passing the last
 * returned position as the next since_position.
 */
export function collectContributions(
  block: Block,
  sincePosition: number,
): { contributions: PoolContribution[]; more_available: boolean } {
  const out: PoolContribution[] = [];
  let more = false;
  for (const slot of digitPathSlots()) {
    // readAt (floor-aware) not readSlot (raw): after a supernest the entries sit
    // one floor down and an entry's dated address absorbs (a "7" resolves via
    // "07" = [0,7]), so this same enumeration still finds every entry across any
    // amount of floor growth.
    const v = readAt(block, slot);
    if (v == null) continue;
    const position = parseInt(slot, 10);
    if (position <= sincePosition) continue;

    // At depth 1 (slot length 1), any non-null is a claim — even legacy strings.
    // At depth 2+, only objects count; strings are tag-field collisions.
    if (slot.length > 1 && (typeof v !== 'object' || Array.isArray(v))) continue;

    if (out.length >= READ_PAGE_LIMIT) {
      more = true;
      break;
    }

    if (typeof v === 'string') {
      // Legacy plain-string contribution (no fields).
      out.push({
        position,
        text: v,
        agent_id: null,
        address: null,
        ts: null,
        face: null,
      });
    } else if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, any>;
      const txt = typeof obj._ === 'string' ? obj._ : '';
      // Skip tombstones (empty underscore at depth 1) — block-conventions:9.4
      // says wipes delete keys, but legacy tombstones may still appear.
      if (slot.length === 1 && txt === '') continue;
      out.push({
        position,
        text: txt,
        agent_id: typeof obj['1'] === 'string' ? obj['1'] : null,
        address: typeof obj['2'] === 'string' ? obj['2'] : null,
        ts: typeof obj['3'] === 'string' ? obj['3'] : null,
        face: typeof obj['4'] === 'string' ? obj['4'] : null,
      });
    }
  }
  return { contributions: out, more_available: more };
}

/**
 * Extract synthesis_hint. Sourced from the pool's UNDERSCORE, never a digit
 * position. A pure-liquid pool reserves no metadata slot — every digit 1-9 becomes
 * a contribution as the pool fills, and past nine the block supernests (accumulator.ts),
 * so a hint at 9.1 would be claimed and overwritten by the ninth entry (block[9] IS
 * contribution 9; block[9][1] is its agent_id). The underscore is the pool's own
 * voice: for a directive pool it points the reader at an external directive (e.g. the
 * RPG soft scoop at function:thornwood/1), for a general pool it states the purpose.
 * The crafted DEFAULT personal-synthesis directive is the fallback when there is no
 * underscore. (Was: a 9.1 → _ → default chain; 9.1 is retired as incompatible with
 * the supernest accumulator — see proposals/2026-06-03-supernest-…, block-conventions:4.2.)
 */
/**
 * Floor-aware read of a block's underscore: walk the root underscore chain down
 * to its terminal string. After a supernest (sunstone:1.63) the block's top `_`
 * is the wrapped old block (an object), and the real floor value — the purpose /
 * directive — sits one level deeper per supernest. A naive `block._` read misses
 * it (the bug where the directive "vanishes" once a pool passes nine); this walks
 * to the floor, mirroring collectContributions' floor-awareness so the purpose
 * survives any amount of floor growth.
 */
export function floorUnderscore(block: Block): string {
  let u: any = (block as any)?._;
  while (u && typeof u === 'object' && !Array.isArray(u)) u = u._;
  return typeof u === 'string' ? u : '';
}

export function extractSynthesisHint(block: Block): { hint: string; source: 'purpose' | 'default' } {
  const purpose = floorUnderscore(block);
  if (typeof purpose === 'string' && purpose.trim() !== '') {
    return { hint: purpose, source: 'purpose' };
  }
  return { hint: DEFAULT_SYNTHESIS_HINT, source: 'default' };
}

// ── Directive delivery — the envelope carries the Designer's rules ──
// A directive pool points its underscore at an external directive block (this
// file's header; docs/protocol-block-references.md §5-6 — "wiring lives in DATA
// editable via bsp, not code"). The Designer (CADO) authors the directive block
// (e.g. function:thornwood) via bsp(); the envelope DELIVERS it inline so the
// soft/character LLM has the rules in-context every turn — instead of a pointer
// it skips. The resolving read is the beach's, INSIDE the existing pool_engage
// response: no extra tool call for the calling LLM. An ordinary prose underscore
// (chat / Quaker pools) is not a reference and falls through unchanged.

/** True when the pool's floor-underscore is a block reference (single token, no
 *  whitespace, qualified with ':') naming the room's operating directive —
 *  "function:thornwood", or "function:thornwood/1" for one aperture. */
export function isDirectiveRef(underscore: string): boolean {
  const s = underscore.trim();
  return s.length > 0 && !/\s/.test(s) && s.includes(':');
}

/**
 * Emit one position and EVERYTHING BENEATH IT, in full, each line carrying its
 * canonical pscale address.
 *
 * This replaced a one-level render that emitted each branch's underscore and
 * dropped the rest. That shape was not a pscale read at all — neither point,
 * path-walk, disc nor descent — and it cost twice. A branch whose law lived in
 * its children arrived as a line the reader could not act on (brackenfoot's
 * genesis told players "each arriver STAGES their arrival (1)" while position 1
 * was never delivered), and the only repair on offer was a second tool call. It
 * also quietly rewarded the two authoring cop-outs it created: heading-style
 * underscores, and "walk 1.1 for detail" pointers written INTO block content —
 * which a proper spindle makes redundant, since a path-walk already prints every
 * ancestor above its terminus (sunstone:8.51).
 *
 * So the nesting is delivered intact and the addresses come with it: a reader
 * needing one position later addresses it exactly, and needs nothing in between.
 * Depth is the contextualisation; the address is how it is re-entered.
 */
export function renderPosition(node: any, digits: string[], floor: number, out: string[]): void {
  const addr = formatAddress(digits, floor);
  const indent = '  '.repeat(Math.max(0, digits.length - 1));
  if (typeof node === 'string') {
    out.push(`${indent}[${addr}] ${node}`);
    return;
  }
  if (!node || typeof node !== 'object') return;
  const u = floorUnderscore(node as Block);
  if (u) out.push(`${indent}[${addr}] ${u}`);
  for (let d = 1; d <= 9; d++) {
    const child = node[String(d)];
    if (child === undefined || child === null) continue;
    renderPosition(child, [...digits, String(d)], floor, out);
  }
}

/**
 * Render a directive block — or one aperture of it — as readable text. The
 * delivered shape is a real bsp read: path-walk+descent run to leaves. `frame`
 * carries the ancestor underscores above the aperture (the walk down to it), so
 * a selected branch arrives self-contextualised — the general frames the
 * specific, exactly as reading the spindle by hand would (sunstone:8.51). An
 * aperture with no frame would hand the reader branch law whose governing verbs
 * were defined one level up and never delivered. `base` is the digit path
 * already walked to reach `node` (empty at the root), so an aperture read
 * (pscale:grit/1) still prints TRUE addresses (1.1, 1.11) rather than
 * renumbering its children from 1.
 */
export function renderDirective(
  node: any,
  opts?: { floor?: number; base?: string[]; frame?: string[] },
): string {
  if (typeof node === 'string') return node;
  if (typeof node !== 'object' || node === null) return '';
  const floor = opts?.floor ?? floorDepth(node as Block);
  const base = opts?.base ?? [];
  const parts: string[] = [...(opts?.frame ?? [])];
  const head = floorUnderscore(node as Block);
  if (head) {
    const addr = base.length ? `[${formatAddress(base, floor)}] ` : '';
    parts.push(`${addr}${head}`);
  }
  for (let d = 1; d <= 9; d++) {
    const child = node[String(d)];
    if (child === undefined || child === null) continue;
    const out: string[] = [];
    renderPosition(child, [...base, String(d)], floor, out);
    if (out.length) parts.push(out.join('\n'));
  }
  return parts.join('\n\n');
}

/** Resolve a directive reference and render it. Normally reads the SAME beach
 *  (function:thornwood); a "pscale:<name>" ref reads the SENTINEL registry
 *  instead (pscale:grit — the canonical, always-available play-loop), so a world
 *  runs the canonical loop with no per-world copy. The '/' form selects one
 *  aperture (function:thornwood/1, pscale:grit/1); without it the whole block is
 *  delivered. Returns null on any failure so a missing directive falls back to
 *  the plain purpose and never breaks a read. */
export async function resolveDirective(poolUrl: string, ref: string): Promise<string | null> {
  try {
    const [blk, sp] = ref.trim().split('/', 2);
    // Sentinel fallback (gatekeeper pattern): a beach-hosted directive
    // (function:<world>) is the per-world override; "pscale:<name>" is the
    // substrate-wide canonical, read from the bundled sentinel registry.
    const sentinel = blk.startsWith('pscale:') ? blk.slice('pscale:'.length) : null;
    const drow = sentinel
      ? await loadBlock('pscale', sentinel)
      : await loadBlock(poolUrl, blk);
    if (!drow || typeof drow.block !== 'object' || drow.block === null) return null;
    const block = drow.block as Block;
    // The floor is the BLOCK's, never the aperture node's — addresses are anchored
    // at the decimal, so a branch read out of context still prints where it lives.
    const floor = floorDepth(block);
    const node = sp ? readAt(block, sp) : block;
    const base = sp ? parseSpindle(sp, floor).digits : [];
    // The walk down to the aperture: each ancestor's underscore, root first —
    // the spindle's general end, framing the specific subtree delivered below.
    const frame: string[] = [];
    if (base.length) {
      let cur: any = block;
      const rootU = floorUnderscore(block);
      if (rootU) frame.push(rootU);
      for (let i = 0; i < base.length - 1; i++) {
        cur = cur?.[base[i]];
        if (!cur || typeof cur !== 'object') break;
        const u = floorUnderscore(cur as Block);
        if (u) frame.push(`[${formatAddress(base.slice(0, i + 1), floor)}] ${u}`);
      }
    }
    return renderDirective(node, { floor, base, frame }) || null;
  } catch {
    return null;
  }
}

// ── The situated current — the loop-side compiler (2026-07-20) ──
// GRIT 1.1's perceive set — the place, your own account, the names you carry,
// the co-present cast — was charged to the seat as mid-loop tool calls, while
// the door (pscale_play) compiled the same set at entry and never again. The
// law (David, 2026-07-20, from genus-one): the frame is a bundle of addresses;
// the compile is MECHANICAL; the seat receives the CURRENT complete and spends
// its calls on ACTS. So a location-addressed ROOM engage now carries the moment
// whole — law + stream + liquid (above) and the situated part compiled here.
// Named pools (commons, worktables, gates) are not rooms and keep the lean
// envelope. Costs a handful of beach reads per engage, all server-side; a
// table's cast is a handful by design (scale is spatial breadth, not pool
// size). The cast/presence helpers live HERE and are re-used by play.ts (entry
// and loop must speak one law; pool.ts cannot import play.ts — play imports
// pool).

/** The beach's no-block index (its named blocks). Empty on any failure. */
export async function beachIndex(origin: string): Promise<string[]> {
  try {
    const res = await fetch(`${origin}/.well-known/pscale-beach`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const j: any = await res.json();
    return Array.isArray(j?.blocks) ? j.blocks : [];
  } catch {
    return [];
  }
}

/** The spatial address in a passport's position 3 ("…spatial:<world>:<addr>") — the
 *  character's location, at ANY grain (proposal 2026-07-15-pscale-of-agency): a full
 *  single-decimal pscale address. "111" the room, "3200" the town (trailing zeros are
 *  floor padding — a +2 stance), "111.1" the hearth (−1). */
export function passportLocation(passportBlock: any): string | null {
  const p3 = passportBlock?.['3'];
  if (typeof p3 !== 'string') return null;
  const m = p3.match(/spatial:[\w-]+:(\d+(?:\.\d+)?)/);
  return m ? m[1] : null;
}

/** A name-free observable appearance from a passport's position 3 (the posture before
 *  the location ref), so a co-present character is perceived without leaking the name
 *  they have not yet earned. */
export function passportAppearance(passportBlock: any, handle: string): string {
  let s = String(passportBlock?.['3'] ?? '').split(/\s*Location:/)[0].trim();
  if (handle) {
    const cap = handle[0].toUpperCase() + handle.slice(1);
    s = s.replace(new RegExp(`\\b${cap}\\b`, 'g'), 'A figure').replace(new RegExp(`\\b${handle}\\b`, 'gi'), 'a figure');
  }
  return s || 'a figure here';
}

// Presence-grain (proposal 2026-07-15) — a character is present AT A GRAIN.
// Character-location (passport:3, slow, fictional) and driver-liveness (liquid /
// commits / presence heartbeats — fast, real) are different axes. Liveness is
// DERIVED AT READ from signals the substrate already holds — never stored.

/** v1 heuristic: a handle with a signal inside this window is HERE NOW (beat-grain);
 *  outside it they are ABOUT (present at the day's grain). */
export const LIVE_WINDOW_MS = 60 * 60 * 1000;

export interface CastEntry { handle: string; appearance: string; lastSignal: number | null }

/** Pure split — HERE NOW vs ABOUT — so the rule is one testable function. */
export function splitCast(entries: CastEntry[], now: number): { here: CastEntry[]; about: CastEntry[] } {
  const here: CastEntry[] = [];
  const about: CastEntry[] = [];
  for (const e of entries) {
    (e.lastSignal != null && now - e.lastSignal <= LIVE_WINDOW_MS ? here : about).push(e);
  }
  return { here, about };
}

/** Every OTHER placed handle at this world — handle, appearance, and the address it
 *  stands at. By appearance; names stay unearned. */
export async function castAtWorld(
  origin: string,
  handle: string,
): Promise<{ handle: string; appearance: string; addr: string }[]> {
  const out: { handle: string; appearance: string; addr: string }[] = [];
  for (const pn of (await beachIndex(origin)).filter((b) => b.startsWith('passport:') && b !== `passport:${handle}`)) {
    const row = await loadBlock(origin, pn);
    const block = row?.block;
    const addr = block ? passportLocation(block) : null;
    if (block && addr) {
      const h = pn.slice('passport:'.length);
      out.push({ handle: h, appearance: passportAppearance(block, h), addr });
    }
  }
  return out;
}

/** Latest liveness signal per handle at this world: a staged liquid slot, a pool
 *  commit, or a presence heartbeat — max timestamp wins. */
export async function livenessSignals(origin: string, roomName: string | null): Promise<Map<string, number>> {
  const sig = new Map<string, number>();
  const note = (h: string | null, ts: string | null) => {
    if (!h || !ts) return;
    const ms = Date.parse(ts);
    if (!Number.isFinite(ms)) return;
    if ((sig.get(h) ?? -Infinity) < ms) sig.set(h, ms);
  };
  const names = roomName ? [`liquid:pool:${roomName}`, `pool:${roomName}`, 'presence'] : ['presence'];
  for (const name of names) {
    const row = await loadBlock(origin, name);
    if (row?.block && typeof row.block === 'object') {
      for (const c of collectContributions(row.block as any, 0).contributions) {
        if (name.startsWith('liquid:') && c.text === '') continue; // withdrawn slot is no signal
        note(c.agent_id, c.ts);
      }
    }
  }
  return sig;
}

/** Pure partition of the cast against an address: same place / a coarser stance
 *  containing it / finer life beneath. Same-place is WALKED-FORM equality, never
 *  raw-string — '111', '1110' at a wider floor, and any padding variant all walk
 *  the same digits (the recognition failure's latent class). */
export function partitionCast(
  cast: { handle: string; appearance: string; addr: string }[],
  myLoc: string,
): {
  atMine: { handle: string; appearance: string; addr: string }[];
  coarser: { handle: string; appearance: string; addr: string }[];
  finer: { handle: string; appearance: string; addr: string }[];
} {
  const samePlace = (a: string, b: string) =>
    isLocationAddress(a) && isLocationAddress(b) ? walkedOf(a) === walkedOf(b) : a === b;
  const atMine: { handle: string; appearance: string; addr: string }[] = [];
  const coarser: { handle: string; appearance: string; addr: string }[] = [];
  const finer: { handle: string; appearance: string; addr: string }[] = [];
  for (const c of cast) {
    if (samePlace(c.addr, myLoc)) { atMine.push(c); continue; }
    if (isLocationAddress(c.addr) && isLocationAddress(myLoc)) {
      if (contains(c.addr, myLoc)) coarser.push(c);
      else if (contains(myLoc, c.addr)) finer.push(c);
    }
  }
  return { atMine, coarser, finer };
}

/** The place walked to its address: ancestor underscores framing the terminus, the
 *  terminus whole, then ONE level of contained places by their underscores — this is
 *  perception at grain, not a subtree dump (a coarse stance would otherwise inline a
 *  whole town's interior; interiors are walked when entered). Null when the address
 *  names no place — the caller skips the section, never invents a there. */
export function renderPlaceWalk(spatial: Block, addr: string): string | null {
  const floor = floorDepth(spatial);
  let digits: string[];
  try { digits = parseSpindle(addr, floor).digits; } catch { return null; }
  if (!digits.length) return null;
  const out: string[] = [];
  const rootU = floorUnderscore(spatial);
  if (rootU) out.push(rootU);
  let cur: any = spatial;
  for (let i = 0; i < digits.length; i++) {
    cur = cur?.[digits[i] === '0' ? '_' : digits[i]];
    if (cur === undefined || cur === null) return null;
    const a = formatAddress(digits.slice(0, i + 1), floor);
    if (i < digits.length - 1) {
      const u = typeof cur === 'string' ? cur : floorUnderscore(cur as Block);
      if (u) out.push(`[${a}] ${u}`);
    } else if (typeof cur === 'string') {
      out.push(`[${a}] ${cur}`);
    } else {
      const u = floorUnderscore(cur as Block);
      if (u) out.push(`[${a}] ${u}`);
      for (let d = 1; d <= 9; d++) {
        const child = (cur as any)[String(d)];
        if (child === undefined || child === null) continue;
        const cu = typeof child === 'string' ? child : floorUnderscore(child as Block);
        if (cu) out.push(`  [${formatAddress([...digits, String(d)], floor)}] ${cu}`);
      }
    }
  }
  return out.join('\n');
}

/** Compile the situated current for a room engage: the place at the room's address,
 *  the engager's own tail (witnessed recent + knows), and the co-present cast at
 *  grain. Every part degrades gracefully to absence — an observer with no blocks
 *  still receives the place and the cast; a world with no spatial block yields
 *  cast alone; a non-room pool yields null and the envelope is unchanged. */
export async function composeCurrent(origin: string, poolName: string, agentId: string): Promise<string | null> {
  if (!isLocationAddress(poolName)) return null;
  const parts: string[] = [];
  const index = await beachIndex(origin);

  const spatialName = index.find((b) => b.startsWith('spatial:'));
  if (spatialName) {
    const srow = await loadBlock(origin, spatialName);
    if (srow?.block && typeof srow.block === 'object') {
      const walk = renderPlaceWalk(srow.block as Block, poolName);
      if (walk) {
        parts.push(`# The place — ${spatialName}:${poolName} (walked to its address; contained places one level down, entered by moving)\n${walk}`);
      }
    }
  }

  const wrow = await loadBlock(origin, `witnessed:${agentId}`);
  if (wrow?.block && typeof wrow.block === 'object') {
    const all = collectContributions(wrow.block as Block, 0).contributions;
    const tail = all.slice(-3);
    if (tail.length) {
      const head = `# Your account — witnessed:${agentId}, last ${tail.length} of ${all.length} (private; journal by APPEND, never a slot write)`;
      parts.push([head, ...tail.map((c) => `[${c.position}] ${c.text}`)].join('\n'));
    }
  }

  const krow = await loadBlock(origin, `knows:${agentId}`);
  if (krow?.block && typeof krow.block === 'object') {
    const k = krow.block as any;
    const lines: string[] = [];
    const u = floorUnderscore(k);
    if (u) lines.push(u);
    for (let d = 1; d <= 9; d++) {
      const v = k[String(d)];
      if (v === undefined || v === null) continue;
      const t = typeof v === 'string' ? v : floorUnderscore(v as Block);
      if (t) lines.push(`(${d}) ${t}`);
    }
    if (lines.length) parts.push(`# You know — knows:${agentId}\n${lines.join('\n')}`);
  }

  const cast = await castAtWorld(origin, agentId);
  if (cast.length) {
    const { atMine, coarser, finer } = partitionCast(cast, poolName);
    let here: CastEntry[] = [];
    let about: CastEntry[] = [];
    if (atMine.length) {
      const signals = await livenessSignals(origin, poolName);
      ({ here, about } = splitCast(
        atMine.map((c) => ({ handle: c.handle, appearance: c.appearance, lastSignal: signals.get(c.handle) ?? null })),
        Date.now(),
      ));
    }
    if (here.length || about.length || coarser.length || finer.length) {
      const lines: string[] = ['# Co-present at your place (by appearance; names unearned until spoken)'];
      if (here.length) {
        lines.push('HERE NOW (your grain — live in the scene; they act and answer within it):');
        for (const c of here) lines.push(`— ${c.appearance}`);
      }
      if (about.length || coarser.length) {
        lines.push('ABOUT (the coarser grain — hereabouts and real, but NOT at the table: render them about the place, never awaiting; a beat directed at them lands at the coarser grain, answered when they next descend; they cannot be contested; the scene never waits on them):');
        for (const c of about) lines.push(`— ${c.appearance}`);
        for (const c of coarser) lines.push(`— ${c.appearance} (standing at the ${pscaleOf(c.addr) >= 2 ? "day's" : 'longer'} grain of this place — pscale ${'+' + pscaleOf(c.addr)}, by their own stance)`);
      }
      if (finer.length) {
        lines.push('WITHIN (finer life beneath your stance — you contain these; their fine beats fold up into your coarser one):');
        for (const c of finer) lines.push(`— ${c.appearance} (at ${c.addr}, the finer grain)`);
      }
      parts.push(lines.join('\n'));
    }
  }

  return parts.length ? parts.join('\n\n') : null;
}

// ── Window-open trace (honest dice + honest clock) ──

const WINDOW_STAMP_RE = /\bWindow opened (\S+?)\.?\s*$/;

/**
 * Read the window's open moment from the liquid buffer's underscore (floor-aware,
 * so the stamp survives a supernest). The stamp is written ONCE, when the first
 * non-empty intention lands on an empty buffer — the window's stigmergic trace.
 * Returns null on legacy buffers that predate the stamp.
 */
export function windowOpenTs(liquidBlock: Block | null): string | null {
  if (!liquidBlock || typeof liquidBlock !== 'object') return null;
  const m = floorUnderscore(liquidBlock).match(WINDOW_STAMP_RE);
  return m ? m[1] : null;
}

/**
 * The window's dice seed. Stamped buffers seed from the recorded open moment —
 * immutable for the window's whole life, so a withdraw or revise of the earliest
 * slot can neither reroll the dice nor move the clock. Legacy buffers (no stamp)
 * fall back to the earliest live timestamp — the mutable inference this trace
 * supersedes; they heal on their next window, which gets stamped at opening.
 */
export function windowSeed(
  blockName: string,
  liquidBlock: Block | null,
  liveSlots: PoolContribution[],
): { seed: string; openTs: string | null } {
  const openTs = windowOpenTs(liquidBlock);
  if (openTs) return { seed: `${blockName}:window:${openTs}`, openTs };
  const stamps = liveSlots.map(s => s.ts).filter((t): t is string => !!t).sort();
  return { seed: `${blockName}:window:${stamps[0] ?? liveSlots[0]?.text.slice(0, 24) ?? 'empty'}`, openTs: null };
}

/**
 * Per-actor exploding-d10 luck for a window. Each live intention gets its OWN
 * luck, seeded from the immutable window-open stamp (windowSeed) PLUS the
 * author's identity — so an actor's luck is fixed the instant the window opens,
 * is independent of co-present actors, and cannot be shopped by revise/withdraw
 * (the seed never references the actor's own mutable slot). This is what lets
 * distinct intentions resolve to DIVERGENT outcomes for the one synthesis to
 * weave: rules:nomad's CF and difficulty are already per-actor — the dice now
 * match. The d10 SHAPE is RPG (rules:nomad); the substrate's honest concern is
 * the per-actor seed, like a checksum. Returns one entry per live slot, in order.
 */
export function windowDicePerAuthor(
  blockName: string,
  liquidBlock: Block | null,
  liveSlots: PoolContribution[],
): Array<{ agent_id: string | null; pos: number; neg: number; luck: number }> {
  const { seed } = windowSeed(blockName, liquidBlock, liveSlots);
  return liveSlots.map((s) => {
    const who = s.agent_id ?? `slot${s.position}`;
    const { pos, neg, luck } = deterministicLuck(`${seed}:${who}`);
    return { agent_id: s.agent_id, pos, neg, luck };
  });
}

// ── Liquid staging (submit) ──

/**
 * Stage `text` to the author's slot in the pre-commit liquid buffer
 * (liquid:pool:<name>, block-conventions:4.5). One slot per author, OVERWRITING:
 * reuse the author's existing slot if present, else allocate the next free one,
 * and write only that slot surgically so co-present peers' pending slots stay
 * intact. Returns the slot written. Empty `text` writes an empty underscore —
 * the withdraw/clear convention. This is the pending-mirror affordance: liquid
 * lives on the beach, so submit makes "see what others intend before committing"
 * a substrate capability, not an xstream-only one.
 */
async function stageLiquid(
  url: string,
  liquidName: string,
  agentId: string,
  text: string,
  face: string | undefined,
  secret: string | undefined,
): Promise<string> {
  const lrow = await loadBlock(url, liquidName);
  const exists = !!lrow && typeof lrow.block === 'object' && lrow.block !== null;
  const baseDesc = `Liquid pre-commit buffer for ${liquidName} (block-conventions:4.5) — one slot per author, overwriting; the social mirror of pending intentions before commit.`;

  // Slot shape: _ text · 1 author · 2 FIRST-STAGED (arrival — written once at slot
  // creation, never moved by a revise) · 3 last-touched (restamped every write).
  // NHITL round 2 §2a: the first-walker rule read 3 and a player who revised their
  // line lost their place in the queue — "a player should not be doing timestamp
  // forensics in a lobby." Arrival order reads 2; legacy slots without 2 fall back
  // to 3 at render.
  const nowIso = new Date().toISOString();
  const slotObj: Record<string, any> = { _: text, '1': agentId, '2': nowIso, '3': nowIso };
  if (face) slotObj['4'] = face;

  const liveCount = exists
    ? collectContributions(lrow!.block, 0).contributions.filter(c => c.text !== '').length
    : 0;
  const opening = text.trim() !== '' && liveCount === 0;

  if (!exists || opening) {
    // The window OPENS (or the buffer is born): rebuild fresh — prior tombstones
    // swept, the open moment stamped at the underscore as the window's stigmergic
    // trace. The dice seed and the closed-check both read this stamp; a withdraw
    // or revise cannot move it. (Two simultaneous openers can race this whole-block
    // write — last wins, the loser re-stages on their next submit; cooperative-play
    // acceptable, revisit if observed.)
    const stamp = text.trim() !== '' ? ` Window opened ${slotObj['3']}.` : '';
    const fresh: Block = { _: `${baseDesc}${stamp}` } as Block;
    (fresh as Record<string, any>)['1'] = slotObj;
    await saveBlock(url, liquidName, fresh, { spindle: '', secret });
    return '1';
  }

  // Window already live (or a withdraw): surgical — only this author's slot
  // changes; peers' slots and the stamp at the underscore stay fixed for the
  // window's whole life. A REVISE preserves the slot's first-staged stamp
  // (position 2): arrival never moves; only 3 restamps.
  const lblock: Block = JSON.parse(JSON.stringify(lrow!.block));
  const existingSlot = findAuthorSlot(lblock, agentId);
  const mySlot = existingSlot ?? findNextSlot(lblock);
  if (existingSlot) {
    const prior = readAt(lblock, existingSlot) as Record<string, any> | null;
    const firstStaged = prior && typeof prior === 'object' && typeof prior['2'] === 'string' && prior['2'] !== '' ? prior['2'] : null;
    if (firstStaged) slotObj['2'] = firstStaged;
  }
  writeAt(lblock, mySlot, slotObj);
  await saveBlock(url, liquidName, lblock, { spindle: mySlot, pscale_attention: -1, secret });
  return mySlot;
}

// ── Cross-grain composition (proposal 2026-07-15-pscale-of-agency G3) ──
// An address-shaped room ("3241", "111.1") sits in a spatial tree, and the tree
// carries time: ancestors run coarser cadences, descendants finer. Two reads
// join the envelope for such rooms — BACKGROUND (the coarser life at this
// place: the day around your beat, rendered as the world's weather, never as
// beats to answer) and FINER WINDOWS (live liquid in the spatial subtree — the
// one-now gate: a coarse window cannot close over live finer windows beneath
// it; whoever folds the coarse window absorbs their resolutions first). Named
// rooms (no address) are untouched. No beach change — the store's
// single-resolution claim already works at any pool; the gate is
// envelope-informed judgment, per the 2026-07-01 regimes 1+2.

/** The beach's block index (local copy of play.ts's — a circular import would
 *  otherwise tie the entry tool to the envelope primitive). Empty on failure. */
async function poolBeachIndex(origin: string): Promise<string[]> {
  try {
    const res = await fetch(`${origin.replace(/\/+$/, '')}/.well-known/pscale-beach`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const j: any = await res.json();
    return Array.isArray(j?.blocks) ? j.blocks : [];
  } catch {
    return [];
  }
}

const BACKGROUND_ANCESTORS = 3;   // nearest coarser places woven in
const BACKGROUND_PER_PLACE = 2;   // most recent commits each
const FINER_WINDOWS_LISTED = 5;   // live finer windows named before "+n more"

/** Background lines — the nearest ancestors' most recent commits and live
 *  intentions, nearest-first, bounded. Empty for non-address rooms. */
export async function assembleBackground(url: string, poolName: string): Promise<string[]> {
  if (!isLocationAddress(poolName)) return [];
  const lines: string[] = [];
  for (const anc of ancestorsOf(poolName).slice(0, BACKGROUND_ANCESTORS)) {
    const [prow, lrow] = await Promise.all([
      loadBlock(url, `pool:${anc}`),
      loadBlock(url, `liquid:pool:${anc}`),
    ]);
    const entries: string[] = [];
    if (prow?.block && typeof prow.block === 'object') {
      const cs = collectContributions(prow.block as Block, 0).contributions.filter((c) => c.text.trim() !== '');
      for (const c of cs.slice(-BACKGROUND_PER_PLACE)) {
        entries.push(`${c.agent_id ?? 'someone'}${c.ts ? ` (${c.ts.slice(0, 10)})` : ''}: ${c.text.slice(0, 240)}`);
      }
    }
    if (lrow?.block && typeof lrow.block === 'object') {
      for (const s of collectContributions(lrow.block as Block, 0).contributions.filter((s) => s.text !== '')) {
        entries.push(`${s.agent_id ?? 'someone'} intends: ${s.text.slice(0, 160)}`);
      }
    }
    if (entries.length) {
      const p = pscaleOf(anc);
      lines.push(`at ${anc} (pscale ${p > 0 ? '+' + p : p}, the coarser cadence):`);
      for (const e of entries) lines.push(`  - ${e}`);
    }
  }
  return lines;
}

/** Live finer windows in this room's spatial subtree — {addr, authors} per
 *  liquid buffer holding at least one live intention. Empty for non-address
 *  rooms. One index fetch + one read per candidate buffer. */
export async function finerWindows(url: string, poolName: string): Promise<{ addr: string; authors: number }[]> {
  if (!isLocationAddress(poolName)) return [];
  const mine = walkedOf(poolName);
  const out: { addr: string; authors: number }[] = [];
  const candidates = (await poolBeachIndex(url))
    .filter((b) => b.startsWith('liquid:pool:'))
    .map((b) => b.slice('liquid:pool:'.length))
    .filter((a) => isLocationAddress(a) && a !== poolName && walkedOf(a).length > mine.length && walkedOf(a).startsWith(mine));
  for (const addr of candidates) {
    const row = await loadBlock(url, `liquid:pool:${addr}`);
    if (row?.block && typeof row.block === 'object') {
      const live = collectContributions(row.block as Block, 0).contributions.filter((s) => s.text !== '').length;
      if (live > 0) out.push({ addr, authors: live });
    }
  }
  return out;
}

// ── Schema ──

export const poolEngageParamsSchema = {
  agent_id: z
    .string()
    .describe('Your agent identifier — used as the contributor attribution if `contribution` is provided. Bare handle, URL, sed:<collective>:<position>, or grain:<pair_id>:<side>.'),
  pool_url: z
    .string()
    .describe(`URL of the federated beach hosting the pool, e.g. "${DEFAULT_BEACH}". Must be an http(s):// URL — pool engagement does not target the sentinel registry.`),
  pool_name: z
    .string()
    .describe('Name of the pool without the "pool:" prefix. The block at the beach is "pool:<pool_name>". E.g. pool_name="visiting" targets block "pool:visiting".'),
  contribution: z
    .string()
    .optional()
    .describe("Optional. COMMIT text — deposit a contribution (raw OR an LLM-produced synthesis; the primitive is agnostic) at the next-free digit-path slot of the destination (1, 2, …, 9, 11, …; sunstone:1.64) with shape {_: text, 1: agent_id, 2: '', 3: ISO-ts, 4: face}, then read the envelope. Atomic append (beach-side). Omit for read-only engagement, or use `submit` to stage to liquid without committing."),
  submit: z
    .string()
    .optional()
    .describe("Optional. STAGE text to the pre-commit liquid buffer (liquid:pool:<name>, block-conventions:4.5) instead of committing. One slot per author, OVERWRITING — writes/overwrites YOUR slot and returns the social mirror of all co-present pending intentions; it does NOT append to the pool and does NOT synthesise. Empty string withdraws (clears your slot). Lets others see what you intend before you commit. May be combined with `contribution` (stage then commit in one call)."),
  destination: z
    .string()
    .optional()
    .describe("Optional, applies to `contribution`. Where the commit lands: 'pool' (default — the shared spool everyone pulls) or a block name such as 'solid:<name>' for a shared committed artifact. The deposit is a dumb atomic append; the primitive never synthesises. This is the objective dial. Structured per-subject spine writes (the RPG subjective case) are the resolver's bsp() job, NOT this param — point destination only at accumulator-shaped blocks."),
  resolves_window: z
    .string()
    .optional()
    .describe("RESOLVER-ONLY (function:thornwood:2). When committing a window's resolution event-skeleton, pass the window's open-stamp — the 'window opened <ts>' value handed back in this envelope. The beach admits the FIRST resolver of that window and rejects every other with a stand-down (single-resolution enforced atomically at the store, not by convention — two LLMs can both judge a window closed and both try to resolve). Omit for ordinary contributions / chat."),
  with_liquid: z
    .boolean()
    .optional()
    .describe("Optional. The liquid mirror (all co-present pending intentions from liquid:pool:<name>) rides the envelope BY DEFAULT for every caller — the spool is what was said; liquid is who is here now, and who-is-here-now is what an engage is for. Pass false to opt out (a cheap read of a quiet archive). submit implies it as ever."),
  face: z
    .enum(['character', 'author', 'designer', 'observer'])
    .optional()
    .describe('CADO face tag for the contribution. Recorded at field 4 of the contribution slot. Advisory in v0.1; informs synthesis-target conventions. Ignored when `contribution` is omitted.'),
  since_position: z
    .number()
    .int()
    .optional()
    .describe('Last position you have seen — return only contributions at slots strictly greater than this. Default 0 (return all). Caller-managed: store the returned `marker_new` and pass it back on the next call.'),
  secret: z
    .string()
    .optional()
    .describe('Lock proof. Required if the pool block is locked (and you are writing) OR if the pool author has gated contribution writes. Forwarded to the beach which verifies. Sensitive — never repeat in conversation.'),
  purpose: z
    .string()
    .optional()
    .describe("Optional, CREATION-only. If the pool does NOT yet exist at this beach, providing `purpose` creates it with the right object shape: {_: '<purpose>'}. The tool constructs the shape internally — caller cannot get it wrong (no way to accidentally author a bare-string pool block). Ignored when the pool already exists (existing purpose is not overwritten). This is the canonical bsp-mcp path to create a pool; do NOT use raw bsp() with content='<purpose>' which produces a malformed string-root block."),
};

export type PoolEngageParams = {
  agent_id: string;
  pool_url: string;
  pool_name: string;
  contribution?: string;
  submit?: string;
  destination?: string;
  with_liquid?: boolean;
  face?: 'character' | 'author' | 'designer' | 'observer';
  since_position?: number;
  secret?: string;
  purpose?: string;
  resolves_window?: string;
};

// ── Handler ──

export async function handlePoolEngage(
  params: PoolEngageParams,
): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { agent_id, pool_url, pool_name, contribution, submit, destination, face, secret } = params;
  const sincePosition = params.since_position ?? 0;
  // The liquid mirror is the DEFAULT channel, for every caller (NHITL round 2,
  // §2c: "the channel that IS the lobby is opt-in" — a seat that never passed
  // with_liquid=true never saw its companion at all). The spool is what was
  // said; liquid is who is here now — and who-is-here-now is what an engage
  // is for. Explicit with_liquid=false opts out (a cheap read of a quiet
  // archive); submit implies it as ever. One extra fetch per engage is the
  // honest price of a room that shows its people.
  const withLiquid =
    submit !== undefined ||
    (params.with_liquid !== undefined ? params.with_liquid === true : true);

  if (!isFederatedOwner(pool_url)) {
    return {
      content: [{
        type: 'text',
        text: `pool_url must be an http(s):// URL (got "${pool_url}"). Pool engagement targets federated beaches; pass the beach URL hosting the pool.`,
      }],
    };
  }

  const blockName = `pool:${pool_name}`;
  const liquidName = `liquid:pool:${pool_name}`;

  // ── Load pool ──
  let row = await loadBlock(pool_url, blockName);
  let created = false;
  // Returning-author check runs against the PRE-CALL state — the commit or
  // stage this very call performs must not count as the prior trace, or a
  // first-touch committer would be judged returning and never see the law.
  let returningAuthor = false;
  if ((params.since_position ?? 0) === 0 && row?.block && typeof row.block === 'object') {
    const lrowEarly = await loadBlock(pool_url, liquidName).catch(() => null);
    returningAuthor = hasAuthorTrace(row.block as Block, (lrowEarly?.block as Block) ?? null, agent_id);
  }
  if (!row) {
    // Pool absent — create it if purpose was provided, otherwise surface the
    // gap so the caller can decide. Creation goes through this primitive
    // (NOT raw bsp() with stringy content) so the right object shape is
    // guaranteed at the tool layer — the caller passes `purpose` as a string
    // and the tool constructs {_: purpose} internally. No way to get the
    // malformed bare-string pool that this primitive originally diagnosed.
    if (params.purpose) {
      const newBlock: Record<string, any> = { _: params.purpose };
      // A pool's directive is never stored at a digit position. A pure-liquid pool
      // keeps every digit 1-9 for contributions (it supernests past nine), so 9.1
      // would be claimed by the ninth entry. A pool that wants a custom directive
      // states it in its underscore (or points the underscore at an external
      // directive block). The synthesis_hint create-param that once mirrored this
      // was retired 2026-06-03 and removed from the schema 2026-07-05.
      try {
        await saveBlock(pool_url, blockName, newBlock, {
          spindle: '',
          pscale_attention: null,
          secret,
        });
      } catch (e: any) {
        return {
          content: [{ type: 'text', text: `Pool create failed at ${pool_url}:${blockName}: ${e?.message ?? String(e)}` }],
        };
      }
      row = await loadBlock(pool_url, blockName);
      if (!row) {
        return {
          content: [{ type: 'text', text: `Created pool but reload failed at ${pool_url}:${blockName}.` }],
        };
      }
      created = true;
    } else {
      return {
        content: [{
          type: 'text',
          text: `No pool at (agent_id="${pool_url}", block="${blockName}"). Pass purpose= to create one — pscale_pool_engage will author the right shape internally.`,
        }],
      };
    }
  }

  // Defensive: if the existing pool block is a non-object (legacy malformed
  // bare-string from a prior buggy authoring path), surface that diagnostic
  // explicitly with a recovery hint rather than crashing downstream on the
  // typeof assumptions. The bsp-mcp writeAt fix means future creations via
  // this primitive won't produce this shape; legacy blocks need a DELETE.
  if (typeof row.block !== 'object' || row.block === null) {
    return {
      content: [{
        type: 'text',
        text: `Pool at ${pool_url}:${blockName} is malformed (root is ${row.block === null ? 'null' : typeof row.block}, not an object). Recovery: DELETE the block at the beach, then call pscale_pool_engage again with purpose= to recreate cleanly. Direct delete: curl -X DELETE -H 'Content-Type: application/json' -d '{"confirm":true}' "${pool_url}/.well-known/pscale-beach?block=${blockName}"`,
      }],
    };
  }

  // ── Optional: SUBMIT — stage to the pre-commit liquid buffer ──
  // Liquid (block-conventions:4.5) is one slot per author, OVERWRITING: your
  // current pending intention, visible to co-present peers as the social mirror
  // before anyone commits. submit overwrites YOUR slot and (via withLiquid) the
  // envelope returns the mirror; it never appends to the pool and never
  // synthesises. Empty text withdraws. This brings xstream's pending-mirror
  // reflexivity to a bare bsp-mcp caller, because liquid lives on the beach.
  // Embodiment gate. On an RPG/directive pool, only an EMBODIED character leaves a
  // trace in the liquid — a character is in the spatial block, visible, so engaging
  // the room is an act others can see, and the liquid IS the room's live presence.
  // Author / Designer / Observer are not embodied: they read the room from outside
  // the fiction, leave no presence, and are invisible to characters — so their
  // submit is dropped read-only. (Character or no face = embodied, writes as before.)
  const isRpgPool = isDirectiveRef(floorUnderscore(row.block));
  const embodied = !face || face === 'character';
  let submittedSlot: string | null = null;
  if (submit !== undefined && !(isRpgPool && !embodied)) {
    try {
      submittedSlot = await stageLiquid(pool_url, liquidName, agent_id, submit, face, secret);
    } catch (e: any) {
      return { content: [{ type: 'text', text: `Liquid submit rejected by beach: ${e?.message ?? String(e)}` }] };
    }
  }

  // ── Optional: COMMIT — deposit a contribution to a destination ──
  // The dumb deposit: append `contribution` (raw text OR an LLM-produced
  // synthesis — agnostic) to the destination accumulator. `destination` is the
  // objective dial: 'pool' (default — the shared spool everyone pulls) or any
  // block name (e.g. 'solid:<name>' for a shared artifact). The append is atomic
  // beach-side (appendToBeach): the beach allocates the slot and supernests when
  // the floor fills, so concurrent commits never race. Structured per-subject
  // spine writes (RPG) are the resolver's bsp() job, NOT this primitive.
  let postedPosition: number | null = null;
  let postedTo: string | null = null;
  let postedSupernested = false;
  if (contribution !== undefined && contribution.trim() !== '') {
    const entry: Record<string, any> = {
      _: contribution,
      '1': agent_id,
      '2': '',
      '3': new Date().toISOString(),
    };
    if (face) entry['4'] = face;

    const destBlock = destination && destination !== 'pool' ? destination : blockName;

    // A non-pool destination may not exist yet — seed it with a floor (a root
    // underscore) so the append lands on a well-formed block. The pool itself
    // already exists by here (loaded or created above).
    if (destBlock !== blockName) {
      const drow = await loadBlock(pool_url, destBlock);
      if (!drow || typeof drow.block !== 'object' || drow.block === null) {
        try {
          await saveBlock(pool_url, destBlock, { _: `Committed entries from pool:${pool_name} (block-conventions:4.2).` } as Block, { spindle: '', secret });
        } catch (e: any) {
          return { content: [{ type: 'text', text: `Could not create destination ${destBlock}: ${e?.message ?? String(e)}` }] };
        }
      }
    }

    let ack: { slot?: string; supernested?: boolean; floor?: number; alreadyResolved?: boolean; resolvedBy?: string | null };
    try {
      ack = await appendToBeach(pool_url, destBlock, entry as Block, secret, params.resolves_window);
    } catch (e: any) {
      return { content: [{ type: 'text', text: `Pool commit rejected by beach: ${e?.message ?? String(e)}` }] };
    }
    if (ack.alreadyResolved) {
      // The single-resolution claim refused this write — another resolver got the
      // window first. Not an error: stand down, do not write a second outcome.
      return {
        content: [{
          type: 'text',
          text: `window already resolved by ${ack.resolvedBy ?? 'another player'} — stand down: do NOT write a second outcome. Re-read the pool since your marker and perceive the resolution that now exists. If you had staged into this window you are already INSIDE it — it folded you in; do not re-narrate your arrival. Your next commit is simply your TURN in the running scene.`,
        }],
      };
    }
    postedPosition = ack.slot ? parseInt(ack.slot, 10) : null;
    postedTo = destBlock;
    postedSupernested = ack.supernested === true;

    // Window resolved → CLEAR the room's liquid so the next intention opens a FRESH
    // window. A resolver can only clear its OWN slot (submit='' is caller-scoped);
    // co-present slots would otherwise persist, the window-open stamp would never
    // reset, and single-resolution (keyed on that stamp) would dead-lock every future
    // resolution — the room freezes into one perpetual already-resolved window. Caught
    // by the high-fidelity agent rig 2026-06-22 (a scripted rig force-cleared all slots
    // and so hid it). Clearing the whole buffer on a successful resolve is the fix; the
    // resolver no longer clears by hand (function:thornwood:2 updated to match).
    if (params.resolves_window) {
      try {
        const ldesc = `Liquid pre-commit buffer for ${liquidName} (block-conventions:4.5) — one slot per author, overwriting; the social mirror of pending intentions before commit. Empty means no live window.`;
        await saveBlock(pool_url, liquidName, { _: ldesc } as Block, { spindle: '', secret });
      } catch { /* best-effort: a stale slot at worst, never a hard failure */ }
    } else if (destBlock === blockName) {
      // A plain pool-commit CONSUMES the author's own staged intention. The liquid
      // mirrors what is PENDING; this beat is committed, so a surviving slot would
      // show a stale intention (and hold a window-open stamp) indefinitely — under
      // exchange-first play nothing else ever clears it (P0 forensic, 2026-07-03).
      // Only the author's live slot clears; co-present slots and a gathering
      // contest stay intact. (A player who commits chat while their own contest
      // intention gathers re-stages it, visibly — cooperative-play acceptable,
      // same class as the two-opener race.)
      try {
        const lrow = await loadBlock(pool_url, liquidName);
        if (lrow && typeof lrow.block === 'object' && lrow.block !== null) {
          const mine = collectContributions(lrow.block, 0).contributions
            .some((c) => c.agent_id === agent_id && c.text !== '');
          if (mine) await stageLiquid(pool_url, liquidName, agent_id, '', face, secret);
        }
      } catch { /* best-effort, as above */ }
    }

    // Reload the pool only when the commit landed in it (so the envelope's slice
    // includes the just-posted). A commit elsewhere leaves the pool unchanged.
    if (destBlock === blockName) {
      const reloaded = await loadBlock(pool_url, blockName);
      if (!reloaded) {
        return { content: [{ type: 'text', text: `Committed at slot ${ack.slot ?? '?'} but pool reload failed.` }] };
      }
      row = reloaded;
    }
  }

  // ── Build envelope ──
  const purpose = floorUnderscore(row.block);
  // If the pool points its underscore at a directive block, deliver that block
  // inline (the read is the beach's — no extra tool call for the caller).
  const directiveText = isDirectiveRef(purpose) ? await resolveDirective(pool_url, purpose) : null;
  const { hint: synthesisHint, source: hintSource } = extractSynthesisHint(row.block);
  const { contributions, more_available } = collectContributions(row.block, sincePosition);

  const markerNew = contributions.length > 0
    ? contributions[contributions.length - 1].position
    : sincePosition;

  // Liquid mirror — co-present pending intentions, not yet committed. Fetched
  // when you submitted (you want to see the room) or when with_liquid is set.
  let liquidSlots: PoolContribution[] = [];
  let liquidBlock: Block | null = null;
  if (withLiquid) {
    const lrow = await loadBlock(pool_url, liquidName);
    if (lrow && typeof lrow.block === 'object' && lrow.block !== null) {
      liquidBlock = lrow.block;
      liquidSlots = collectContributions(lrow.block, 0).contributions;
    }
  }

  // ── Render as human-readable text (consistent with bsp() handler style) ──
  // The envelope shape is what matters; this rendering presents it for an LLM
  // to consume in tool-result form.
  const lines: string[] = [];
  lines.push(`pool:${pool_name} @ ${pool_url}`);
  lines.push('');
  if (created) {
    lines.push('created: pool authored with purpose at _');
    lines.push('');
  }
  if (submittedSlot !== null) {
    lines.push(submit && submit.trim() !== ''
      ? `submitted: liquid slot ${submittedSlot} (your pending intention — staged, not yet committed)`
      : `withdrawn: liquid slot ${submittedSlot} cleared`);
    lines.push('');
  }
  if (postedPosition !== null) {
    const where = postedTo === blockName ? 'the pool' : postedTo;
    // A successful claim must not ack like a plain append (NHITL round 4: "a
    // resolver can't tell a successful window-claim from an ordinary append").
    const claimed = params.resolves_window ? ` — window ${params.resolves_window} RESOLVED, your claim was first; the buffer is cleared and the next intention opens fresh` : '';
    lines.push(`committed: slot ${postedPosition} → ${where}${postedSupernested ? ' (floor grew — supernested)' : ''}${claimed}`);
    lines.push('');
  }
  if (directiveText) {
    if (sincePosition > 0 || returningAuthor) {
      // Marker-aware delivery (NHITL round 3), widened 2026-07-20: the full
      // directive arrives ONCE — at an author's genuinely first engage. A
      // continuing seat gets the pointer whether it manages its marker or not
      // (the returning-author trace covers the seat that drops the
      // bookkeeping); the scene breathes above the law.
      lines.push(`# Operating directive — ${purpose} (standing law, delivered whole at your first engage; follow it every turn)`);
      lines.push('The law stands as delivered at your first engage, and none of it has changed. To hold it again, read it at its source: the mount named above is a block address — bsp reads it whole, and a /N suffix is one branch at its own address.');
    } else {
      lines.push("# Operating directive — the room's rules, authored by the designer; READ AND FOLLOW THIS EVERY TURN, do not merely acknowledge it");
      lines.push(directiveText);
    }
    lines.push('');
  } else {
    lines.push('# Purpose');
    lines.push(purpose || '(no purpose set)');
    lines.push('');
  }
  // De-dupe: for a directive pool the synthesis hint IS the underscore (source
  // 'purpose'), already printed as Purpose — don't echo it. Only when there is
  // no underscore (source 'default') is the hint a distinct fallback worth showing.
  if (hintSource === 'default') {
    lines.push('# Synthesis hint');
    lines.push(synthesisHint);
    lines.push('');
  }
  // The situated current — a ROOM engage (location-addressed pool) delivers the
  // moment complete: the place at this address, the engager's own tail, the
  // co-present cast at grain. Compiled mechanically, every engage — it is the
  // part that changes instant to instant. Named pools return null here and the
  // envelope is unchanged. (2026-07-20; the A/B measured seats spending mid-loop
  // tool calls fetching exactly this set, which the door had compiled at entry.)
  try {
    const situated = await composeCurrent(pool_url, pool_name, agent_id);
    if (situated) {
      lines.push(situated);
      lines.push('');
    }
  } catch { /* a room that cannot situate still speaks — never break an engage */ }
  if (withLiquid) {
    // A withdrawn slot keeps its stamps (the window seed must not move) but its
    // empty text is a trace the mirror must not show — "clearing leaves no
    // trace" is the gate's own promise, and NHITL round 3 met the broken half
    // of it (cleared slots rendered "(empty)" and padded the author count).
    const standing = liquidSlots.filter((s) => s.text !== '');
    // Read-your-writes: the mirror fetch is a separate wire read moments after
    // the stage write, and a lagging read can miss the caller's own slot (NHITL
    // round 4: every "submitted: liquid slot N" ack sat beside a mirror reading
    // "0 authors" — a solo stager could never verify their own intention).
    // What was just written is known without asking the wire: render it.
    if (submit && submit.trim() !== '' && submittedSlot !== null && !standing.some((s) => s.agent_id === agent_id)) {
      standing.push({ position: parseInt(submittedSlot, 10) || 0, agent_id, text: submit, ts: null, address: null } as PoolContribution);
    }
    lines.push(`# Liquid — pending, not yet committed (${standing.length} ${standing.length === 1 ? 'author' : 'authors'})`);
    if (standing.length === 0) {
      lines.push('(no pending intentions)');
    } else {
      for (const s of standing) {
        const who = s.agent_id ?? '(anon)';
        const mine = s.agent_id === agent_id ? ' (you)' : '';
        // Arrival is the FIRST-STAGED stamp (slot position 2, surfaced as
        // `address`); a revise restamps only 3. Legacy slots without 2 fall
        // back to 3. Arrival order reads from what is printed here — nobody
        // does timestamp forensics in a lobby.
        const arrived = s.address && /^\d{4}-\d{2}-\d{2}T/.test(s.address) ? s.address : s.ts;
        const revised = s.ts && arrived !== s.ts ? `, revised ${s.ts}` : '';
        lines.push(`- ${who}${mine} (arrived ${arrived ?? '?'}${revised}): ${s.text || '(empty)'}`);
      }
      // The window's open-stamp rides WITH the window, not behind the dice gate
      // (NHITL round 4: the fold law says "the open-stamp the envelope hands
      // you", but the only emission sat inside the dice section — the town's
      // day-fold resolver had to judge the stamp from slot headers).
      const liveOpenTs = windowOpenTs(liquidBlock);
      if (liveOpenTs) {
        lines.push(`window opened ${liveOpenTs} — the stamp does not move; a resolution claims this window by passing it as resolves_window.`);
      }
    }
    lines.push('');
  }
  // ── Cross-grain sections — address-shaped rooms only (pscale-of-agency G3) ──
  // Background rides every engage of an address room (the coarser life IS the
  // place's weather); finer windows ride the withLiquid path (arrival and the
  // resolver's read — the one-now gate is theirs to honour).
  if (isLocationAddress(pool_name)) {
    const bg = await assembleBackground(pool_url, pool_name);
    if (bg.length) {
      lines.push('# Background — the coarser life at this place (render as the world around your beat: weather, the day, the town — never as beats to answer)');
      lines.push(...bg);
      lines.push('');
    }
    if (withLiquid) {
      const fw = await finerWindows(pool_url, pool_name);
      if (fw.length) {
        lines.push('# Finer windows live beneath (ONE NOW — a window at this grain cannot close over these: wait, absorb their resolutions, then fold; the coarse fold is the determiner)');
        for (const w of fw.slice(0, FINER_WINDOWS_LISTED)) {
          lines.push(`- pool:${w.addr} — ${w.authors} live ${w.authors === 1 ? 'intention' : 'intentions'}`);
        }
        if (fw.length > FINER_WINDOWS_LISTED) lines.push(`(+${fw.length - FINER_WINDOWS_LISTED} more finer windows)`);
        lines.push('');
      }
    }
  }
  // Window dice — when intentions are staged ON A DIRECTIVE POOL, hand the
  // resolver an exploding-d10 luck PER ACTOR, deterministically seeded by the
  // window + the actor's identity so each is FIXED before the resolver reads it
  // (honest, not LLM-chosen) and independent between actors. The resolver (per
  // the game's medium directive) resolves each actor's own band from their own
  // luck and never invents dice.
  //
  // Gated on isRpgPool (proposals/2026-07-12-grit-tree-consolidation.md §10.1):
  // dice belong to a world's RESOLUTION RULES, never to the engine — a plain
  // pool (venture planning, chat, a tree's gathering) folds by integration with
  // NO dice, and emitting nomad machinery there leaked RPG shape into every
  // envelope (verified live on pool:beach-venture, 2026-07-12). Refinement when
  // a non-dice directive pool exists: gate on the mounted rules block declaring
  // dice, not on the directive's mere presence.
  const liveForDice = liquidSlots.filter((s) => s.text !== '' && s.agent_id);
  if (withLiquid && isRpgPool && liveForDice.length > 0) {
    const perActor = windowDicePerAuthor(blockName, liquidBlock, liveForDice);
    lines.push('# Window dice (for the resolver — exploding-d10 luck PER ACTOR, rules:nomad:2)');
    for (const d of perActor) {
      lines.push(`- ${d.agent_id}: positive ${d.pos}, negative ${d.neg}, luck ${d.luck > 0 ? '+' : ''}${d.luck}`);
    }
    lines.push("Each actor's luck is fixed for this window — use these, never invent dice. Resolve each actor's own band (CF + SF + their luck − difficulty), then weave ONE event-skeleton from the separate outcomes.");
    // (The window's open-stamp rides with the liquid mirror above — one emission.)
    lines.push('');
  }
  lines.push(`# Contributions since position ${sincePosition} (count: ${contributions.length}${more_available ? ', more available' : ''})`);
  // Verbatim-voices discipline (portal invariant, proposal 2026-07-12 §3): on a
  // plain pool the mediating LLM tends to compress the stream into a summary,
  // which hides what people actually said. Directive pools skip this — their
  // rendering is governed by the delivered directive (a character perceives,
  // never quotes).
  if (!directiveText && contributions.length > 0) {
    lines.push('(voices are verbatim — quote or preserve them in any synthesis; never let a summary replace what was said)');
  }
  if (contributions.length === 0) {
    lines.push('(nothing new)');
  } else {
    for (const c of contributions) {
      const who = c.agent_id ?? '(anon)';
      const when = c.ts ?? '';
      const faceTag = c.face ? ` [${c.face}]` : '';
      lines.push(`## slot ${c.position} — ${who}${faceTag} ${when}`);
      lines.push(c.text || '(empty)');
      lines.push('');
    }
  }
  lines.push(`# Marker`);
  lines.push(`previous: ${sincePosition}`);
  lines.push(`new:      ${markerNew}`);
  lines.push(`(store marker_new and pass it back as since_position on the next call)`);

  return {
    content: [{ type: 'text', text: lines.join('\n') }],
  };
}
