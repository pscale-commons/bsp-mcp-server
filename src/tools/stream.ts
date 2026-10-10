/**
 * pscale_stream_engage — the VLS envelope over a spine-mirror-tree family.
 *
 * A STREAM STORES NOTHING. That one sentence is the whole difference from a
 * pool, and it is why this is a separate primitive rather than a flag on the
 * old one. A pool owns two blocks (the spool it appends to, and the liquid
 * buffer it overwrites); a stream owns none. It composes over a family that
 * already exists — spine:<field>, the <field>:<handle> mirrors, and the bare
 * <field> fold — so it cannot drift from them, cannot become a rival source of
 * truth, and needs no lock of its own.
 *
 * The V-L-S it renders (David's model, on record since 2026-07-29 in
 * proposals/2026-07-29-family-form-biome-audit.md §1):
 *
 *   V   who is present at the address (out of band; not this primitive's job)
 *   L   every mirror's reading AT the attended address, listed side by side,
 *       attributed, each sovereign to its owner. There is no buffer: a mirror
 *       is revisable by its holder forever, so STAGE AND COMMIT COLLAPSE INTO
 *       ONE ACT — `say`. That collapse is the point.
 *   S   the fold at that address, under the operator's law. COMPUTED, never
 *       stored, unless someone asks to keep it (tree:3 — "recomputed on
 *       demand, a READ, never a write-merge").
 *
 * The primitive never synthesises. It assembles the concatenation — the
 * SNAPSHOT, which is useful with no LLM in the room at all — and delivers the
 * operator's law beside it. The calling mind does the synthesis, exactly as
 * each reader of a pool produces their own. No central resolver, here either.
 *
 * WHERE A FOLD GOES, when it is kept (`keep`):
 *   personal    → tree:<field>:<handle>, at the SAME address — the holder's own
 *                 tree of syntheses, latest-standing and revisable like a
 *                 mirror, superseded by the next fold of the same point
 *                 (settled 2026-08-15, proposals/2026-08-15-personal-tree-
 *                 and-fold-homes.md; supersedes the history:<handle> journal
 *                 destination that #247's salvage rider first landed — a keep
 *                 that matters as a MOMENT may still leave a pointer in
 *                 history:<handle>, by the holder's own hand, and losslessness
 *                 when wanted is the archive convention, never accumulation).
 *   collective  → the bare name <field>, at the SAME address, because the fold
 *                 block is address-aligned with its spine (tree:4.1, tree:8;
 *                 battery × state-of-play is the live pair). Endorsed by
 *                 pointer, never a gate — anyone may write a better one.
 *
 * CADO — four faces, and EACH IS A FULL V-L-S LOOP rather than a permission
 * level. They differ only in which block the fold lands in, and each face's
 * liquid is that face's mirrors OF the block it folds into, so all four are
 * the same shape on one address space:
 *
 *   C  beach-venture:<handle>          → beach-venture      (the venture lived)
 *   A  spine:beach-venture:<handle>    → spine:…            (the objectives)
 *   D  function:beach-venture:<handle> → function:…         (this law)
 *   O  view:beach-venture:<handle>     → view:…             (cards, links out)
 *
 * Observer's INPUT is the Character fold — the venture's latest account of
 * itself — and its solid is a card carrying a LINK to where the output now
 * lives, outside. That is what makes O the venture's boundary rather than
 * another room inside it, and it is why O never fitted a "renders S" reading:
 * it has its own liquid and its own participants like every other face.
 *
 * THE OPERATOR IS THE CENTRAL BLOCK of a family — function:<field> — and it
 * names its own parts: the spine it governs, how mirrors are written, how each
 * face folds and where. The reference runs operator → family, never the
 * reverse. A generic operator (function:audit) carries no content addresses,
 * so a family running one says so in a bare reference at its own operator's
 * underscore, followed a single hop.
 *
 * Nothing here touches pool.ts, liquid buffers, windows, dice, or any RPG
 * path. The RPG keeps pscale_pool_engage unchanged; if streams prove out, that
 * molecule migrates afterwards and the pool becomes legacy — deliberately, not
 * by drift.
 */

import { z } from 'zod';
import { Block, writeAt, readAt, floorDepth, parseSpindle } from '../bsp.js';
import { loadBlock, saveBlock, loadBeachIndex, DEFAULT_BEACH, type BlockRow } from '../db.js';
import { formatBorn, fullWidthAddress } from '../bsp-fn.js';
import { momentToAddress, voiceAddress, addressToSpan, TEMPORAL_FLOOR, readHumanTime, readHumanDay, readHumanSpan, SPAN_MAX_DAYS, spanInPlace, wallClock, wallDay } from '../temporal.js';
import { clockTable, composeClockMedium, composeClockHard, composeClockSoft, CLOCK_FIELD } from './clock.js';
import { publishPlay } from '../flow-play.js';
import { wireStore } from '../genus.js';
import { nameAtTheDoor, noteLook, reflect } from '../looks.js';
import { followsOf, lensLaw, composeLensMedium } from './lens.js';

// ── Helpers (local by intent — importing pool.ts for three small functions
//    would tie this clean surface to the one it exists to stand beside) ──

/** A bare block reference: one token, no whitespace, naming a block (and
 *  optionally one branch after a slash). Anything with a space is prose — a
 *  human pointer, delivered as itself. Same discrimination the pool's mount
 *  makes; kept local so the two surfaces stay independent. */
export function isBareRef(s: unknown): s is string {
  return typeof s === 'string' && s.trim() !== '' && !/\s/.test(s.trim()) && s.trim().length < 120;
}

/** The text a node presents: a leaf string is itself, an object speaks through
 *  its underscore. Null when the position is unvoiced — which is SILENCE, and
 *  silence at an address is honest absence (tree:5e), never a gap to fill. */
export function voiceOf(node: unknown): string | null {
  if (typeof node === 'string') return node.trim() === '' ? null : node;
  if (node && typeof node === 'object') {
    const u = (node as Record<string, unknown>)['_'];
    if (typeof u === 'string' && u.trim() !== '') return u;
  }
  return null;
}

/** Re-emit an address for a target block's own floor. Correspondence across
 *  blocks is by PSCALE, never by walk depth (whetstone:7): the spine may have
 *  supernested past a mirror that carries one entry, so the same coordinate is
 *  a different digit-string in each. Right-pad rather than formatAddress —
 *  the canonical emitter under-pads above floor 1 (pool.ts carries the same
 *  note and the same fix; correcting the emitter is Python-first). */
export function emitFor(digits: string[], block: Block): string {
  return digits.join('').padEnd(floorDepth(block), '0');
}

/** The ladder: every ancestor's voicing from the coarsest rung down to the
 *  attended one, which is what makes a located read self-contextualising —
 *  the reader arrives already holding why this address matters. This is the
 *  line-of-sight view, and on a temporal spine it is literally today at the
 *  bottom and the decade at the top. */
export function ladderOf(spine: Block, digits: string[]): { pscale: number; addr: string; text: string | null }[] {
  const floor = floorDepth(spine);
  const rungs: { pscale: number; addr: string; text: string | null }[] = [];
  let node: unknown = spine;
  for (let i = 0; i < digits.length; i++) {
    const key = digits[i] === '0' ? '_' : digits[i];
    if (!node || typeof node !== 'object') { node = null; }
    else { node = (node as Record<string, unknown>)[key]; }
    rungs.push({
      pscale: floor - (i + 1),
      addr: digits.slice(0, i + 1).join('').padEnd(floor, '0'),
      text: voiceOf(node),
    });
  }
  return rungs;
}

/** Trim for the ladder's upper rungs — the ancestors are context, not the
 *  read; the attended rung is delivered whole. */
export function clip(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…';
}

/** Named rungs — the register law made usable. A human says "today", never a
 *  ten-digit number, so the door accepts the WORD and truncates the computed
 *  moment to that rung (trailing zeros are the floor-width padding the parser
 *  strips, so the truncation round-trips exactly). 'now' is the beat, which is
 *  finer than most fields are ever voiced at — which is why the coarser words
 *  exist and why 'today' is the one a venture ladder usually wants. */
export const NAMED_RUNGS: Record<string, number> = {
  now: 10, beat: 10, gathering: 9, hour: 9,
  today: 8, day: 8, week: 7, month: 6,
  season: 5, quarter: 5, year: 4,
};

/** A named rung → the address of the moment truncated to it; a TIME as a
 *  person says it ('16:00 Europe/London', '4pm tomorrow Europe/London') → the
 *  beat it falls in (temporal.ts readHumanTime); a DAY as a person says it
 *  ('tomorrow', 'Tuesday Europe/London', '2026-10-13') → that day
 *  (readHumanDay). Null when the words are none of these, so an ordinary
 *  digit address falls through. */
export function namedRungAddress(word: string, when: Date): string | null {
  const keep = NAMED_RUNGS[word.trim().toLowerCase().replace(/^this\s+/, '')];
  if (!keep) {
    const t = readHumanTime(word, when);
    if (t && 'address' in t) return t.address;
    return readHumanDay(word, when);
  }
  const full = momentToAddress(when);
  return full.slice(0, keep).padEnd(full.length, '0');
}

/** Voicing an address REPLACES THE WORDS AND KEEPS THE STRUCTURE. writeAt ends in
 *  a bare `node[key] = value`, so voicing a node that carries children used to
 *  flatten it — the words landed and every sub-address beneath went with them.
 *  That is wrong wherever a family keeps anything under an address: a stamp, a
 *  reader's own marker, a sub-branch. Saying again replaces WHAT WAS SAID, never
 *  the shape it was said into.
 *
 *  Byte-identical wherever nothing stands beneath: an absent or string node still
 *  takes a bare string, so a family with no substructure is untouched. Only a node
 *  that is already an object merges, and only its `_` moves. bsp.ts is not
 *  involved — walker, parser and address invariant are exactly as they were; this
 *  is composition at the caller. */
export function voicedValue(existing: unknown, text: string): unknown {
  return (existing && typeof existing === 'object' && !Array.isArray(existing))
    ? { ...(existing as Record<string, unknown>), _: text }
    : text;
}

/** THE LANE — a hand that runs several sessions at once keeps ONE mirror, and
 *  each lane speaks at its own digit beneath the beat: at='now.8'. The word is
 *  the beat (a named rung that reaches the floor) and the digit after the point
 *  is the lane, so the spelling IS the address of the lane's cell, with the one
 *  decimal point an address has. Null for anything else — a digit address with
 *  a fraction keeps its own meaning. */
export function laneOf(at: string): { rung: string; lane: string } | null {
  const m = /^\s*(.+?)\.([1-9])\s*$/.exec(at);
  if (!m) return null;
  const word = m[1].trim().toLowerCase().replace(/^this\s+/, '');
  return NAMED_RUNGS[word] === TEMPORAL_FLOOR ? { rung: m[1].trim(), lane: m[2] } : null;
}

/** A turn beneath a beat, in the shape the torus law keeps (function:torus-mirror
 *  1.2) and liquid keeps (block-conventions 4.51): the line as it stands, 6 the
 *  instant of arrival, 3 the instant of the latest revision. Saying again in the
 *  same beat revises the line and 3, and keeps 6. */
export function turnValue(existing: unknown, text: string, iso: string): Record<string, unknown> {
  const prev = existing && typeof existing === 'object' && !Array.isArray(existing) ? (existing as Record<string, unknown>) : {};
  return { ...prev, _: text, 6: typeof prev['6'] === 'string' ? prev['6'] : iso, 3: iso };
}

/** The stamped turns standing beneath a node: digit children that speak and
 *  carry an instant at 3. A scalar child is a field of an entry, never a lane,
 *  and an unstamped child is ordinary substructure — neither is read as a turn. */
export function turnsOf(node: unknown): { lane: string; text: string; ms: number }[] {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return [];
  const found: { lane: string; text: string; ms: number }[] = [];
  for (const k of Object.keys(node as object)) {
    if (!/^[1-9]$/.test(k)) continue;
    const c = (node as Record<string, unknown>)[k];
    if (!c || typeof c !== 'object' || Array.isArray(c)) continue;
    const text = voiceOf(c);
    const ms = Date.parse(String((c as Record<string, unknown>)['3'] ?? ''));
    if (text && Number.isFinite(ms)) found.push({ lane: k, text, ms });
  }
  return found;
}

/** How long ago, in the fewest words. */
export function agoWords(ms: number): string {
  const sec = Math.max(0, Math.round(ms / 1000));
  if (sec < 20) return 'just now';
  if (sec < 90) return `${sec}s ago`;
  return `${Math.round(sec / 60)}m ago`;
}

/** What one mirror says at a beat: its lanes, if it keeps stamped turns there,
 *  else its voicing. On the MOVING now (prevNode given) a line is live for one
 *  beat's width from its own instant, so a lane that last spoke in the beat
 *  before, and a voicing in a mirror last written within that width, are
 *  carried across the edge — two minds a minute apart are not parted by where
 *  the clock's cell fell (function:torus-mirror 2: each live mirror is read at
 *  the beat of its own last touch). A lane that has spoken in this beat is not
 *  doubled by its turn in the last. Pure. */
export function mirrorAtBeat(
  node: unknown,
  prevNode: unknown,
  nowMs: number,
  cellMs: number,
  touchedMs: number,
): { lanes: { lane: string; text: string; ms: number }[]; voicing: string | null; voicingMs: number | null } {
  const lanes = turnsOf(node);
  const fresh = Number.isFinite(touchedMs) && nowMs - touchedMs >= 0 && cellMs > 0 && nowMs - touchedMs < cellMs;
  let voicing = voiceOf(node);
  let voicingMs: number | null = voicing && fresh ? touchedMs : null;
  if (prevNode !== undefined && prevNode !== null && cellMs > 0) {
    for (const t of turnsOf(prevNode)) {
      if (nowMs - t.ms < cellMs && !lanes.some((l) => l.lane === t.lane)) lanes.push(t);
    }
    if (!voicing && lanes.length === 0 && fresh) {
      const pv = voiceOf(prevNode);
      if (pv) { voicing = pv; voicingMs = touchedMs; }
    }
  }
  lanes.sort((a, b) => b.ms - a.ms);
  return { lanes, voicing, voicingMs };
}

// ── A SPAN — every beat two times touch (temporal.ts readHumanSpan) ──
//
// The availability family's read and write (function:availability, founded
// 2026-10-10): a holder's own LLM says each calendar block at its span and the
// line lands on every beat the span touches; a reader asks for a span and gets
// every mirror's lines across it, on the asker's own clock. Any family on the
// clock may be read this way; nothing here is particular to one.

/** The finest rung holding every beat of a span — the beats' shared prefix,
 *  padded to the floor: the day, for a span inside one day. A keep at a span
 *  lands here. */
export function spanRung(beats: string[]): string {
  const a = beats[0], b = beats[beats.length - 1];
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return a.slice(0, i).padEnd(a.length, '0');
}

/** The clock day a beat falls on, as its own address (the day's two zeros). */
const dayOf = (beat: string): string => `${beat.slice(0, 8)}00`;

/** What one mirror holds across a span: each touched day's own line, and its
 *  beats' lines as runs — consecutive beats saying the same thing are one
 *  block, from the first beat's start to the last one's end. Pure. */
export function acrossOf(mb: Block, beats: string[]): {
  days: { addr: string; line: string | null }[];
  runs: { start: number; end: number; text: string }[];
} {
  const days: { addr: string; line: string | null }[] = [];
  const runs: { start: number; end: number; text: string }[] = [];
  let open: { start: number; end: number; text: string } | null = null;
  for (const beat of beats) {
    const day = dayOf(beat);
    if (!days.length || days[days.length - 1].addr !== day) {
      days.push({ addr: day, line: voiceOf(readAt(mb, emitFor(day.slice(0, 8).split(''), mb))) });
    }
    const text = voiceOf(readAt(mb, emitFor(beat.split(''), mb)));
    const { start, end } = addressToSpan(beat);
    if (text && open && open.text === text) open.end = end.getTime();
    else if (text) { open = { start: start.getTime(), end: end.getTime(), text }; runs.push(open); }
    else open = null;
  }
  return { days, runs };
}

/** Say one line on every beat of a span in the holder's own mirror — or clear
 *  them, when the line is null — and save each touched day once, as one node:
 *  an object replaces the day beneath it, so a cleared beat is gone from the
 *  beach and every other line of that day stands as it was. Mutates `mb` to
 *  what was saved. Returns how many beats were written, or held a line and
 *  were cleared. */
export async function sayAcross(
  origin: string, name: string, mb: Block, beats: string[], line: string | null, secret?: string,
): Promise<number> {
  const byDay = new Map<string, string[]>();
  for (const beat of beats) {
    const day = dayOf(beat);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(beat);
  }
  let touched = 0;
  for (const [day, dayBeats] of byDay) {
    const dayAddr = emitFor(day.slice(0, 8).split(''), mb);
    if (line !== null) {
      for (const beat of dayBeats) {
        const addr = emitFor(beat.split(''), mb);
        writeAt(mb, addr, voicedValue(readAt(mb, addr), line));
        touched++;
      }
    } else {
      const dayNode = readAt(mb, dayAddr);
      if (!dayNode || typeof dayNode !== 'object') continue;   // a day line alone keeps no beats
      let cleared = 0;
      for (const beat of dayBeats) {
        const g = dayNode[beat[8]];
        if (!g || typeof g !== 'object' || !(beat[9] in g)) continue;
        delete g[beat[9]];
        cleared++;
        if (Object.keys(g).length === 0) delete dayNode[beat[8]];
      }
      if (!cleared) continue;
      touched += cleared;
    }
    await saveBlock(origin, name, mb, { spindle: dayAddr, secret });
  }
  return touched;
}

/** THE STANDING PARTS ARE GIVEN ONCE. A family's law, the unvoiced rungs of its
 *  ladder and the fold's instruction do not change between one call and the
 *  next, and a mind that says its line at every response was handed all of them
 *  every time — the few lines it came for under seven hundred words. A session
 *  is given them whole the first time it engages a family, and again when the
 *  law changes or two hours have passed; in between it is told they stand. The
 *  same rule the reflection keeps: say only what has changed. No session, no
 *  memory — the envelope is whole, as it always was. Records the giving. */
const STANDING_REFRESH_MS = 2 * 60 * 60_000;
const standing = new Map<string, { law: string; at: number }>();
export function standingBrief(key: string | null, lawText: string, nowMs: number): boolean {
  if (!key) return false;
  let h = 5381;
  for (let i = 0; i < lawText.length; i++) h = ((h << 5) + h + lawText.charCodeAt(i)) | 0;
  const mark = `${lawText.length}:${h}`;
  const prior = standing.get(key);
  if (prior && prior.law === mark && nowMs - prior.at < STANDING_REFRESH_MS) return true;
  standing.set(key, { law: mark, at: nowMs });
  if (standing.size > 2000) {
    const cut = nowMs - STANDING_REFRESH_MS;
    for (const [k, v] of standing) if (v.at < cut) standing.delete(k);
  }
  return false;
}
/** For tests: forget what was given. */
export function resetStanding(): void { standing.clear(); }

/** A block born into a family is born AT THE FAMILY'S FLOOR. Floor is the depth
 *  of the underscore chain, and it is what anchors pscale 0 — so a mirror born
 *  one deep beside a spine standing ten deep is not merely untidy: the same node
 *  reads as pscale 2 in the spine and pscale -7 in the mirror, bsp-floor lays
 *  them against different planes, and a page that requires the family's floor
 *  (now.html refuses floor != 10) will not voice it at all. The walk survives
 *  either way, because trailing zeros are stripped and a full-width address
 *  lands at the same digit path whatever the floor — which is exactly why this
 *  went unnoticed: nothing breaks, the coordinate just lies. */
function bornAt(text: string, floor: number): Block {
  let node: unknown = text;
  for (let i = 0; i < Math.max(1, floor); i++) node = { _: node };
  return node as Block;
}

/** The human reading of an address, on a CLOCK spine only. A temporal family
 *  stands at floor 10 (pscale://sundial) and its addresses voice themselves,
 *  so a reader is never handed a column of ten digits to decode — the ladder
 *  is law rather than content, which is why the voicing is done in code and
 *  never authored into the spine. A spine that is not a clock, or an address
 *  the clock refuses, goes unvoiced and the ladder renders exactly as before:
 *  the attempt never breaks a read. */
/** THE LADDER'S HOLLOW RUNGS COLLAPSE TO ONE LINE, as a walk's do (bsp-fn
 *  walkLines, #508). spine:torus-mirror stood unvoiced at every rung in two
 *  boots two days apart (2026-10-06, -08) and each read carried ten lines
 *  saying so. A run of unvoiced rungs above the attended one is one line
 *  naming its span; a voiced rung, a FOLDED one and the attended rung each
 *  stand on their own; under `brief` (the standing parts already given this
 *  session) an unvoiced rung that is not folded is omitted, as before. */
export function ladderLines(
  rungs: { pscale: number; addr: string; text: string | null }[],
  spineAddr: string,
  spineFloor: number,
  brief: boolean,
  keptAt: (i: number) => boolean,
): string[] {
  const out: string[] = [];
  let run: { pscale: number; addr: string; text: string | null }[] = [];
  const head = (r: { pscale: number; addr: string }, kept: boolean) => {
    const when = clockVoice(r.addr, spineFloor);
    return `  p${r.pscale} [${r.addr}]${kept ? ' FOLDED' : ''}${when ? ` ${when} —` : ''}`;
  };
  const flush = () => {
    if (!run.length) return;
    if (run.length === 1) out.push(`${head(run[0], false)} (unvoiced on the spine)`);
    else {
      const a = run[0], b = run[run.length - 1];
      const wa = clockVoice(a.addr, spineFloor), wb = clockVoice(b.addr, spineFloor);
      out.push(`  p${a.pscale}–p${b.pscale} [${a.addr} … ${b.addr}]${wa && wb ? ` ${wa} … ${wb} —` : ''} (unvoiced on the spine, ${run.length} rungs)`);
    }
    run = [];
  };
  for (let i = 0; i < rungs.length; i++) {
    const r = rungs[i];
    const last = r.addr === spineAddr;
    const kept = keptAt(i);
    if (!r.text) {
      if (brief && !kept) continue;
      if (!last && !kept) { run.push(r); continue; }
      flush();
      out.push(`${head(r, kept)} (unvoiced on the spine)`);
      continue;
    }
    flush();
    out.push(`${head(r, kept)} ${last ? r.text : clip(r.text, 180)}`);
  }
  flush();
  return out;
}

function clockVoice(addr: string, floor: number): string | null {
  if (floor !== TEMPORAL_FLOOR) return null;
  try { return voiceAddress(addr); } catch { return null; }
}

// ── Schema ──

export const streamEngageParamsSchema = {
  field: z
    .string()
    .describe("'now' unless the person names a specific project — any ask about today, this week, someone’s day or what people are doing is the now family, the one every handle has. The family name — the BARE name, no prefix. 'beach-venture' addresses spine:beach-venture, every beach-venture:<handle> mirror, and the fold at 'beach-venture'. Never pass 'spine:beach-venture' or 'pool:beach-venture'."),
  handle: z
    .string()
    .describe("Your handle. Names your mirror (<field>:<handle>) for `say`, and your own tree of syntheses (tree:<field>:<handle>) for keep='personal'. Mirror and tree are born on first use — you never create them by hand."),
  at: z
    .string()
    .optional()
    .describe("The address attended to, in the spine's own coordinate space (digits, at most one decimal point, comma-walk accepted; multi-dot rejected). Pass a NAMED RUNG on a temporal spine — 'today' (the usual one), 'this week', 'this month', 'season', 'year', or 'now' for the current beat — and the address is COMPUTED from the clock — a human is never asked for an address (function:molequle:5). Or pass a TIME as the person said it, with its PLACE — '16:00 Europe/London', '4pm tomorrow Europe/London', '2026-10-09 09:30 America/New_York', or one instant with its offset, '2026-10-07T16:00+01:00' — and the address of the BEAT it falls in is computed: to book a meeting for 4pm, say it at the time. A DAY as said — 'tomorrow', 'Tuesday', 'next Friday', '2026-10-13', with or without its place — names that day. A SPAN as said — '14:00–15:00 tomorrow Europe/London', '9am–5pm Tuesday Europe/London', or two instants joined by a slash — names every beat it touches: a say lands on each of them, an empty say clears them, and a read lays every mirror's lines across the span on that place's clock, which is how field='availability' finds when people are free. A time or a span always names its place (an IANA zone or an offset), because the clock keeps no time zone (sundial 8.3); take the place from where the person stands, and never work out a beat address yourself. Omit entirely to receive the spine's map instead (every node's opening line at pscale 0), then dial in. ON THE MOVING NOW, WHEN YOUR HAND HAS SEVERAL SESSIONS OPEN: say at 'now.<digit>' — your own lane's digit, 1-9 — and the line lands as that lane's turn beneath the beat, so the lanes of one hand never write over one another; a read at 'now' shows every hand's lanes with how long ago each spoke, a line staying live for one beat's width wherever the beat's edge fell."),
  say: z
    .string()
    .optional()
    .describe("Your reading at this address, written into YOUR OWN mirror at <field>:<handle>. One act — there is no separate stage and commit here, because a mirror is revisable by its holder forever; saying again at the same address replaces what you said. Requires `at`. At a span the line lands on every beat the span touches, and an empty say there clears your lines across it. Never writes anyone else's mirror, and nothing else can write yours. The answer to a say is the snapshot: every other voice at that address, so saying what you are in the middle of at 'now' is also how you learn what every other live mind is in the middle of."),
  keep: z
    .enum(['personal', 'collective'])
    .optional()
    .describe("Persist a fold you have just synthesised (pass it as `keep_text`). 'personal' writes it to tree:<field>:<handle> at this same address — your own tree of syntheses, latest-standing, superseded by your next fold of the same point (a keep that matters as a moment may also leave a pointer in history:<handle>, by your own hand). 'collective' writes it to the bare name <field> at this same address — the shared social product, endorsed by pointer and never a gate, which anyone may supersede with a better one. Omit and the fold stays in the envelope, which is the default the convention prefers (tree:3 — recomputed on demand, never stale)."),
  keep_text: z
    .string()
    .optional()
    .describe("The synthesis to persist, required by `keep`. Yours to write: this primitive assembles the snapshot and delivers the law, and never synthesises anything itself."),
  beach: z
    .string()
    .optional()
    .describe("Origin hosting the family. Defaults to the standard beach."),
  secret: z
    .string()
    .optional()
    .describe("Edit-latch proof, forwarded when the target position is locked — and the latch a mirror, or your personal tree, is born locked to on its first write, so only you write it after. Sensitive — never repeat it in conversation."),
  tier: z
    .enum(['soft', 'medium', 'hard'])
    .optional()
    .describe("THE CALL FOR A TIER OF PLAY ON THE CLOCK, composed from the blocks so every door runs the same one — a table played on time (field='temporal' at a table that keeps spine:temporal, function:temporal and a keeper's hold; the second track, proposals/2026-09-14-rpg-on-the-clock-second-track). Requires `at`; read-only: nothing is said or kept. 'medium' — THE FOLD at the address: the law, the contract, every mirror's line standing there, the night so far at each rung, the actors as their passports stand, the place's faces, each actor's luck already rolled, the rules — and THE CLAIM: which address is ripe and what stands unplayed beneath it. 'hard' — THE LEAN after the fold at the address: the fold whole with its NEXT, the held side, and each figure's own last line; THE WRITES say where each VOICE line is said. 'soft' — THE TELLING of the fold at the address for `handle`, from where they stand; THE JOURNAL gives the keep and the passport line to copy. Run THE CALL as the system text and THE INPUT as the message, on your own key; act on the third section with the ordinary verbs (say, keep). Refused plainly at a family that is not a clock table — except A LENS: on a family whose law mounts the recipe (function:<field> 6 opens THE RECIPE MOUNTED), 'medium' composes THE SHOT at a moment — the law, the recipe, the moment as the table's record holds it, the lines of the hands you follow as direction, the place, the people in frame, the cast's looks and faces, the look, and a contract that answers FORM, PROMPT, REFERENCES and TOOK; run it on your own key, send the prompt to your maker, keep='personal' the shot with its link, and put the picture in your own book addressed to the moment (function:lens, 2026-10-08)."),
};

export interface StreamEngageParams {
  field: string;
  handle: string;
  at?: string;
  say?: string;
  keep?: 'personal' | 'collective';
  keep_text?: string;
  beach?: string;
  secret?: string;
  tier?: 'soft' | 'medium' | 'hard';
}

// ── Handler ──

async function streamEngage(params: StreamEngageParams, session: string | undefined) {
  const origin = (params.beach ?? DEFAULT_BEACH).replace(/\/+$/, '');
  const { field, handle } = params;
  const spineName = `spine:${field}`;
  const out = (text: string) => ({ content: [{ type: 'text' as const, text }] });

  // ONE ROUND OF READS, TOGETHER. The door made its beach round trips one
  // after another — the spine, then the index, then the mirror, then the law,
  // each waiting on the last — and a say answered in about 2.3 s through the
  // live router (measured 2026-10-05; David: 'yes, shorten'). Every name here
  // is known before anything is read, so the reads are asked for at once and
  // awaited where each is needed; only the saves keep their order. A tier
  // call and the map read the spine alone, as before.
  const reading = params.at !== undefined && !params.tier;
  const mirrorName = `${field}:${handle}`;
  const opName = `function:${field}`;
  const saying = reading && params.say !== undefined && params.say.trim() !== '';
  const spineP = loadBlock(origin, spineName).catch(() => null);
  const indexP = reading ? loadBeachIndex(origin).catch(() => null) : null;
  const mirrorP = saying ? loadBlock(origin, mirrorName).catch(() => null) : null;
  const opP = reading ? loadBlock(origin, opName).catch(() => null) : null;
  const srow = await spineP;
  if (!srow || !srow.block || typeof srow.block !== 'object') {
    return out(
      `No spine at ${spineName} — a stream composes over a family, it does not create one.\n\n` +
      `Found nothing to compose. Either the field is named differently (pass the BARE name: 'beach-venture', not 'spine:beach-venture'), ` +
      `or the family has yet to be framed. Framing it is one write, by whoever frames the thing (tree:1):\n` +
      `  bsp(agent_id="${origin}", block="${spineName}", content={_: "<what this field is>"}, new_lock="<your key>")`,
    );
  }
  const spine = srow.block as Block;
  const spineFloor = floorDepth(spine);

  // ── A TIER OF PLAY ON THE CLOCK — the call itself, composed (clock.ts) ──
  // Read-only by design, exactly as the pool's tiers are: a door asks for the
  // call, runs it on its own key, and acts with say and keep. The window it
  // was composed from is reported to flow:<handle> at the table beside the
  // call, under the same two gates the pool keeps (wake:<handle>:7 on, and a
  // keyed engage).
  if (params.tier) {
    if (params.say !== undefined || params.keep !== undefined) {
      return out(`tier='${params.tier}' composes a call and writes nothing — send the say or the keep as its own engage, without tier.`);
    }
    if (params.at === undefined) return out(`tier='${params.tier}' needs at=<the address to compose for>.`);
    if (field !== CLOCK_FIELD) {
      // A LENS — a family whose law mounts the recipe (function:<field> 6)
      // composes THE SHOT at a moment: tier='medium', the fold of the followed
      // lines into one call every seat runs on its own key (function:lens 6,
      // 2026-10-08). Any other family has no tiers, as before.
      const opRow = await (opP ?? loadBlock(origin, opName).catch(() => null));
      const op = opRow && typeof opRow.block === 'object' && opRow.block !== null ? (opRow.block as Block) : null;
      if (!lensLaw(op).recipe) return out(`tier='${params.tier}' is for a table played on the clock — field='${CLOCK_FIELD}'; the ${field} family has no tiers.`);
      if (params.tier !== 'medium') return out(`tier='${params.tier}' — a lens composes one call, the shot at a moment: tier='medium'.`);
      const lensNamed = namedRungAddress(params.at, new Date()) ?? params.at;
      let lensDigits: string[];
      try { lensDigits = parseSpindle(lensNamed, spineFloor).digits; if (!lensDigits.length) throw new Error('an address is needed, not the root'); }
      catch (e: any) { return out(`at="${params.at}" is not a moment on this lens — ${e?.message ?? String(e)}`); }
      try {
        const composed = await composeLensMedium(origin, emitFor(lensDigits, spine), handle, field);
        return out(composed.text);
      } catch (e: any) {
        return out(`The shot at ${field}:${params.at} could not compose: ${e?.message ?? String(e)}`);
      }
    }
    const table = await clockTable(origin).catch(() => null);
    if (!table) return out(`tier='${params.tier}' is for a table played on the clock, and ${origin} is not one: it needs spine:${CLOCK_FIELD}, function:${CLOCK_FIELD} and a keeper's hold (keeper:scene with its placing at 3) standing together.`);
    try {
      const composed = params.tier === 'medium' ? await composeClockMedium(origin, params.at, handle, table)
        : params.tier === 'hard' ? await composeClockHard(origin, params.at, handle, table)
        : await composeClockSoft(origin, params.at, handle, table);
      if (params.secret && !(composed as any).declined) {
        const line = await publishPlay(wireStore(origin, handle, params.secret), handle, origin, composed, params.tier, Math.floor(Date.now() / 1000), params.secret);
        if (line.startsWith('failed')) console.error(`[flow] ${handle} ${params.tier} at ${CLOCK_FIELD}:${params.at}: ${line}`);
      }
      return out(composed.text);
    } catch (e: any) {
      return out(`The ${params.tier} call at ${CLOCK_FIELD}:${params.at} could not compose: ${e?.message ?? String(e)}`);
    }
  }

  // ── The map, when no address is attended ──
  // Deliberately not a heuristic on floor depth: a stream never guesses which
  // coordinate space it is in. Ask for nothing, show the map, let the caller dial.
  if (params.at === undefined) {
    const rows: string[] = [];
    const root = voiceOf(spine);
    if (root) rows.push(`  [root] ${clip(root, 300)}`);
    // Each position is labelled as the address it is dialled by: on a floor-3
    // spine the top positions are 100…900, and a bare "1" copied back pads to
    // 001, inside the root's underscore chain (fixit 443.11). A spine with no
    // root underscore reads as floor 0 and keeps the bare digit.
    for (const k of Object.keys(spine).filter((k) => /^[1-9]$/.test(k)).sort()) {
      const t = voiceOf((spine as Record<string, unknown>)[k]);
      rows.push(`  [${fullWidthAddress([k], Math.max(1, spineFloor))}] ${t ? clip(t, 160) : '(unvoiced)'}`);
    }
    return out(
      `stream:${field} @ ${origin} — the map (no address attended)\n\n` +
      `${rows.join('\n') || '  (the spine has no voiced positions yet)'}\n\n` +
      `Dial one: at=<address>. On a temporal spine, at='now' computes today's from the clock.`,
    );
  }

  // ── Resolve the address ──
  // 'now' is the register law made operational: the clock is always known, so
  // the coordinate is derived and the human is never asked for digits.
  // A LANE — 'now.8' is the beat with the lane's own digit beneath it (laneOf).
  const laned = laneOf(params.at);
  if (laned && spineFloor !== TEMPORAL_FLOOR) {
    return out(`at="${params.at}" names a lane beneath the beat, which only a family on the clock keeps — the ${field} spine is not one. Say at the address itself.`);
  }
  const atWord = laned ? laned.rung : params.at;
  const lane = laned ? laned.lane : null;
  // A SPAN — two times with their day and their place, '14:00–15:00 tomorrow
  // Europe/London' — names every beat it touches (temporal.ts readHumanSpan):
  // a say lands its line on each, an empty say clears them, and a read lays
  // every mirror's lines across it on that place's clock. It is attended at its
  // own rung, the finest address holding all of it, which is where a keep lands.
  const spanRead = lane ? null : readHumanSpan(atWord, new Date());
  if (spanRead && 'needsPlace' in spanRead) {
    return out(`at="${params.at}" is a span without its place — the clock keeps no time zone (sundial 8.3), so say where it is read: '${atWord.trim()} Europe/London', or two instants with their offsets joined by a slash. Take the place from where the person stands.`);
  }
  if (spanRead && 'tooLong' in spanRead) {
    return out(`at="${params.at}" spans more than ${SPAN_MAX_DAYS} days — read or say it a fortnight at a time.`);
  }
  const span = spanRead && 'beats' in spanRead ? spanRead : null;
  if (span && spineFloor !== TEMPORAL_FLOOR) {
    return out(`at="${params.at}" is a span of time, which only a family on the clock keeps — the ${field} spine is not one.`);
  }
  const named = span ? spanRung(span.beats) : namedRungAddress(atWord, new Date());
  const rawAt = named ?? atWord;
  const index = await (indexP ?? loadBeachIndex(origin).catch(() => null));
  const index0Has = (name: string) => (index?.blocks ?? []).includes(name);
  // What the index names is read now, beside the saves below: the fold at the
  // bare name, and every mirror but the caller's own, which this call holds in
  // hand once it has said. None of it waits on the say.
  const blockOf = async (p: Promise<BlockRow | null>): Promise<Block | null> => {
    const row = await p;
    return row && typeof row.block === 'object' && row.block !== null ? (row.block as Block) : null;
  };
  const foldP: Promise<Block | null> = index0Has(field) ? blockOf(loadBlock(origin, field).catch(() => null)) : Promise.resolve(null);
  // FOLLOWING — when the family's law opens its 2 with FOLLOWING, a hand's
  // snapshot is the mirrors of the hands it follows, and its own (function:lens
  // 2, 2026-10-08): branch 4 of its own lists at its home beach, rank as depth.
  // A family whose law says nothing there lays every mirror side by side, as
  // every family did; and only the mirrors to be shown are read.
  const opEarly = await (opP ?? loadBlock(origin, opName).catch(() => null));
  const following = lensLaw(opEarly && typeof opEarly.block === 'object' && opEarly.block !== null ? (opEarly.block as Block) : null).following;
  const followed: Set<string> | null = following ? new Set([handle.toLowerCase(), ...(await followsOf(handle)).map((h) => h.toLowerCase())]) : null;
  const allMirrorNames = (index?.blocks ?? []).filter((n) => n.startsWith(`${field}:`));
  const shownNames = followed ? allMirrorNames.filter((n) => followed.has(n.slice(field.length + 1).toLowerCase())) : allMirrorNames;
  const unfollowed = allMirrorNames.length - shownNames.length;
  const othersP = new Map<string, Promise<Block | null>>();
  for (const name of shownNames.filter((n) => !(saying && n === mirrorName))) {
    othersP.set(name, blockOf(loadBlock(origin, name).catch(() => null)));
  }
  let saidBlock: Block | null = null;   // the caller's own mirror as this say left it

  let digits: string[];
  try {
    digits = parseSpindle(rawAt, spineFloor).digits;
    if (!digits.length) throw new Error('an address is needed, not the root');
  } catch (e: any) {
    const placeless = readHumanTime(atWord, new Date());
    if (placeless && 'needsPlace' in placeless) {
      return out(`at="${params.at}" is a time without its place — the clock keeps no time zone (sundial 8.3), so say where it is read: '${atWord.trim()} Europe/London', or one instant with its offset, '2026-10-07T16:00+01:00'. Take the place from where the person stands.`);
    }
    return out(`at="${params.at}" is not a usable address in the ${field} family — ${e?.message ?? String(e)}`);
  }
  const spineAddr = emitFor(digits, spine);
  // AT A BEAT on a clock a mirror may keep lanes; THE MOVING NOW is that beat
  // asked for by name — the one read where a line's own instant matters more
  // than the cell it fell in.
  const atBeat = spineFloor === TEMPORAL_FLOOR && digits.length === spineFloor;
  const moving = atBeat && named !== null && NAMED_RUNGS[atWord.trim().toLowerCase().replace(/^this\s+/, '')] === TEMPORAL_FLOOR;

  // ── say — the one write act, into the caller's own mirror ──
  let saidAt: string | null = null;
  let mintedMirror: string | null = null;   // this say brought <field>:<handle> into being
  let spanSaid: { touched: number; cleared: boolean } | null = null;   // a span's say: beats written, or cleared
  if (span && params.say !== undefined && params.say.trim() === '') {
    // AN EMPTY SAY AT A SPAN CLEARS IT — the holder's own lines on every beat
    // the span touches, so a calendar synced again leaves nothing cancelled
    // behind (function:availability 3). A mirror not yet born holds nothing.
    const mrow = await (mirrorP ?? loadBlock(origin, mirrorName).catch(() => null));
    let touched = 0;
    if (mrow && typeof mrow.block === 'object' && mrow.block !== null) {
      const mblock: Block = JSON.parse(JSON.stringify(mrow.block));
      try {
        touched = await sayAcross(origin, mirrorName, mblock, span.beats, null, params.secret);
      } catch (e: any) {
        return out(`Your lines across ${params.at} were not cleared at ${mirrorName} — ${e?.message ?? String(e)}`);
      }
      saidBlock = mblock;
    }
    spanSaid = { touched, cleared: true };
  } else if (params.say !== undefined && params.say.trim() !== '') {
    let mrow = await (mirrorP ?? loadBlock(origin, mirrorName).catch(() => null));
    if (!mrow || typeof mrow.block !== 'object' || mrow.block === null) {
      mintedMirror = mirrorName;
      const born =
        `MIRROR — ${handle}'s readings on the ${field} field (${spineName}), at the spine's own addresses. ` +
        `Sovereign to its holder; nobody else writes here. Silence at an address is honest absence, not a gap to be filled.`;
      try {
        // BORN LOCKED to the holder's key when a key rides the say, as the born
        // text promises and as the /now page founds a mirror (new_lock on the
        // create, R1): without it a mirror said through any bsp door was born
        // open, and anyone could overwrite a person's reading. A keyless say
        // still births an open mirror, which its holder may homestead later.
        await saveBlock(origin, mirrorName, bornAt(born, spineFloor), { spindle: '', secret: params.secret, ...(params.secret ? { new_lock: params.secret } : {}) });
        mrow = await loadBlock(origin, mirrorName).catch(() => null);
      } catch (e: any) {
        return out(`Could not create your mirror at ${mirrorName} — ${e?.message ?? String(e)}`);
      }
    }
    const mblock: Block = JSON.parse(JSON.stringify(mrow!.block));
    const mAddr = emitFor(digits, mblock);
    try {
      if (span) {
        // A LINE ACROSS A SPAN lands on every beat the span touches, each day
        // saved once (sayAcross).
        spanSaid = { touched: await sayAcross(origin, mirrorName, mblock, span.beats, params.say, params.secret), cleared: false };
        saidAt = mirrorName;
        saidBlock = mblock;
      } else if (lane) {
        // ONE CALL, THE LAW'S OWN SHAPE (function:torus-mirror 1.2): the lane's
        // turn beneath the beat — the line, 6 its arrival, 3 its latest
        // revision — and the beat voiced with the line, so the hand's standing
        // line is whichever lane spoke last. Two narrow writes, never the beat
        // node whole: the turn touches this lane's cell alone, and a string at
        // the beat voices it and keeps every other lane standing beneath.
        const cell = `${mAddr}.${lane}`;
        writeAt(mblock, cell, turnValue(readAt(mblock, cell), params.say, new Date().toISOString()));
        await saveBlock(origin, mirrorName, mblock, { spindle: cell, secret: params.secret });
        const voiced: Block = JSON.parse(JSON.stringify(mblock));
        writeAt(voiced, mAddr, params.say);
        await saveBlock(origin, mirrorName, voiced, { spindle: mAddr, secret: params.secret });
        saidAt = `${mirrorName}:${cell}`;
        saidBlock = voiced;
      } else {
        writeAt(mblock, mAddr, voicedValue(readAt(mblock, mAddr), params.say));
        await saveBlock(origin, mirrorName, mblock, { spindle: mAddr, secret: params.secret });
        saidAt = `${mirrorName}:${mAddr}`;
        saidBlock = mblock;
      }
    } catch (e: any) {
      return out(`Your reading was refused at ${mirrorName}:${mAddr} — ${e?.message ?? String(e)}`);
    }
  }

  // ── keep — persist a synthesis the caller has already made ──
  let keptTo: string | null = null;
  if (params.keep) {
    const text = (params.keep_text ?? '').trim();
    if (!text) {
      return out(`keep='${params.keep}' needs keep_text — the synthesis is yours to write; this primitive assembles the snapshot and never synthesises.`);
    }
    try {
      if (params.keep === 'personal') {
        const treeName = `tree:${field}:${handle}`;
        let trow = await loadBlock(origin, treeName).catch(() => null);
        if (!trow || typeof trow.block !== 'object' || trow.block === null) {
          const born =
            `TREE — ${handle}'s own syntheses of ${spineName}, at the spine's own addresses: at each point, the LATEST reading this hand has folded, ` +
            `revisable forever and superseded by its next fold. A fold that matters as a moment may also leave a pointer in history:${handle}, by this hand's own choice; ` +
            `losslessness, when wanted, is the archive convention (archive:${treeName}:<date>), never automatic accumulation.`;
          await saveBlock(origin, treeName, bornAt(born, spineFloor), { spindle: '', secret: params.secret, ...(params.secret ? { new_lock: params.secret } : {}) });
          trow = await loadBlock(origin, treeName).catch(() => null);
        }
        const tblock: Block = JSON.parse(JSON.stringify(trow!.block));
        const tAddr = emitFor(digits, tblock);
        writeAt(tblock, tAddr, voicedValue(readAt(tblock, tAddr), text));
        await saveBlock(origin, treeName, tblock, { spindle: tAddr, secret: params.secret });
        keptTo = `${treeName}:${tAddr}`;
      } else {
        let frow = await loadBlock(origin, field).catch(() => null);
        if (!frow || typeof frow.block !== 'object' || frow.block === null) {
          // THE NIGHT IS BORN LOCKED. On a table played on the clock the bare
          // field is the night, and one night needs one determiner: the first
          // keep births it under the keeper's key, and that key folds it ever
          // after (the trial's finding, 2026-09-21 — a rival keep is refused by
          // the store, no code). Every other family's fold is born open, as the
          // convention prefers (tree:3, tree:4): anyone may supersede.
          const clock = field === CLOCK_FIELD && params.secret ? await clockTable(origin).catch(() => null) : null;
          const born = clock
            ? `THE NIGHT — what has happened at this table, kept by the keeper alone at the clock's own addresses: a beat's fold at its beat, a gathering's at its gathering, a day's at its day, each coarser fold standing above the finer ones it contains. One night, under one key, born at the first fold; a line revised after its fold is visibly later than the night it was folded into.`
            : `${field.toUpperCase()} — the FOLD: the social product of ${spineName} and every ${field}:<handle> mirror, ` +
              `at the spine's own addresses. Computed by anyone, owned by nobody; a snapshot here is endorsed by pointer and never gates anything, ` +
              `and a better reading may always supersede it (tree:3, tree:4).`;
          await saveBlock(origin, field, bornAt(born, spineFloor), { spindle: '', secret: params.secret, ...(clock ? { new_lock: params.secret } : {}) });
          frow = await loadBlock(origin, field).catch(() => null);
        }
        const fblock: Block = JSON.parse(JSON.stringify(frow!.block));
        const fAddr = emitFor(digits, fblock);
        writeAt(fblock, fAddr, voicedValue(readAt(fblock, fAddr), text));
        await saveBlock(origin, field, fblock, { spindle: fAddr, secret: params.secret });
        keptTo = `${field}:${fAddr}`;
      }
    } catch (e: any) {
      return out(`The fold was not kept — ${e?.message ?? String(e)}${saidAt ? `\n(Your reading DID land at ${saidAt}.)` : ''}`);
    }
  }

  // ── S, as it stands — the fold already kept at this address, and at each
  // rung above it. The ladder is the spine's face and says nothing of the
  // night; a seat reading '(unvoiced)' there took a folded beat for an open one
  // (the trial, 2026-09-21). What is kept is shown, whole at the attended
  // address and marked on the ladder.
  const foldBlock = await foldP;
  const foldAt = (d: string[]): string | null => (foldBlock ? voiceOf(readAt(foldBlock, emitFor(d, foldBlock))) : null);
  const standingFold = foldAt(digits);

  // ── L — every mirror's reading at this address ──
  // Enumeration is the surface index, walked not searched: mirrors are the
  // <field>:-prefixed names the beach already lists (the 2026-07-29 answer to
  // "how does a fold find its mirrors" — one GET, fine at hundreds).
  const mirrorNames = [...shownNames];
  // A mirror born by this very say is not in an index read before its birth:
  // the speaker's first line is theirs to see like any other.
  if (mintedMirror && !mirrorNames.includes(mintedMirror)) mirrorNames.push(mintedMirror);
  mirrorNames.sort();

  // AT A BEAT a mirror may keep LANES — stamped turns beneath the beat, one for
  // each session its hand has open — and on the moving now a line is live for
  // one beat's width from its own instant, wherever the clock's cell fell
  // (mirrorAtBeat). Everywhere else a reading is the voicing at the address,
  // exactly as before.
  const nowMs = Date.now();
  let cellMs = 0;
  let prevDigits: string[] | null = null;
  if (moving) {
    try {
      const span = addressToSpan(spineAddr);
      cellMs = span.end.getTime() - span.start.getTime();
      prevDigits = momentToAddress(new Date(span.start.getTime() - 1)).split('');
    } catch { /* an address the clock refuses is read as it stands */ }
  }
  const touched: Record<string, string> = { ...(index?.touched ?? {}) };
  if (saidBlock) touched[mirrorName] = new Date(nowMs).toISOString();   // the index was read before the say

  const readings: { who: string; text: string; lane?: string; ms?: number | null }[] = [];
  const silent: string[] = [];
  // ACROSS A SPAN a reading is each touched day's line and the runs of beats
  // beneath it (acrossOf) — a holder with neither has said nothing there.
  const across: ({ who: string } & ReturnType<typeof acrossOf>)[] = [];
  await Promise.all(
    mirrorNames.map(async (name) => {
      const who = name.slice(field.length + 1);
      const mb = name === mirrorName && saidBlock ? saidBlock : await (othersP.get(name) ?? blockOf(loadBlock(origin, name).catch(() => null)));
      if (!mb) { silent.push(who); return; }
      if (span) {
        const a = acrossOf(mb, span.beats);
        if (a.runs.length || a.days.some((d) => d.line)) across.push({ who, ...a }); else silent.push(who);
        return;
      }
      const node = readAt(mb, emitFor(digits, mb));
      if (!atBeat) {
        const text = voiceOf(node);
        if (text) readings.push({ who, text }); else silent.push(who);
        return;
      }
      const prevNode = prevDigits ? readAt(mb, emitFor(prevDigits, mb)) : undefined;
      const here = mirrorAtBeat(node, prevNode, nowMs, cellMs, Date.parse(touched[name] ?? ''));
      if (here.lanes.length) for (const l of here.lanes) readings.push({ who, text: l.text, lane: l.lane, ms: l.ms });
      else if (here.voicing) readings.push({ who, text: here.voicing, ms: here.voicingMs });
      else silent.push(who);
    }),
  );
  readings.sort((a, b) => a.who.localeCompare(b.who) || (b.ms ?? 0) - (a.ms ?? 0));
  silent.sort();

  // ── The operator's law — THE OPERATOR IS THE CENTRAL BLOCK OF ITS FAMILY.
  // It is found at function:<field>, and it names its own parts: which spine
  // it governs, how mirrors are written, how each face folds and where. The
  // reference runs operator → family, never family → operator; an earlier
  // reading of this file had the spine name its operator at its own position
  // 9, which inverted the direction and made the law a thing content pointed
  // at rather than the thing that constitutes the family (keeper's correction,
  // 2026-08-10; the mount-at-9 shape belongs to decks, whose cards are content
  // under a generic operator, and it is not this).
  //
  // A GENERIC operator carries no content addresses (block-conventions:8.81),
  // so a family that runs one — function:audit, function:status — says so in
  // one line at its OWN operator's underscore, as a bare reference this
  // follows a single hop. The family's law stays the thing named; the generic
  // law stays reusable; neither has to know the other's addresses.
  let law: string | null = null;
  const render = (target: unknown): string | null => {
    const parts: string[] = [];
    const head = voiceOf(target);
    if (head) parts.push(head);
    if (target && typeof target === 'object') {
      for (const k of Object.keys(target as object).filter((k) => /^[1-9]$/.test(k)).sort()) {
        const t = voiceOf((target as Record<string, unknown>)[k]);
        if (t) parts.push(`[${k}] ${t}`);
      }
    }
    return parts.length ? parts.join('\n') : null;
  };
  const oprow = await (opP ?? loadBlock(origin, opName).catch(() => null));
  if (oprow && typeof oprow.block === 'object' && oprow.block !== null) {
    const own = oprow.block as Block;
    const root = voiceOf(own);
    if (root && isBareRef(root)) {
      // Delegation to a generic operator, one hop, no further.
      const [refBlock, refBranch] = root.trim().split('/');
      const grow = await loadBlock(origin, refBlock).catch(() => null);
      const generic = grow && typeof grow.block === 'object' && grow.block !== null
        ? render(refBranch ? (grow.block as Record<string, unknown>)[refBranch] : grow.block)
        : null;
      law = generic
        ? `${opName} → ${root.trim()} —\n${generic}`
        : `${opName} names ${root.trim()} as its law, and that block did not resolve at this beach`;
    } else {
      law = `${opName} —\n${render(own) ?? '(the operator stands empty)'}`;
    }
  }

  // ── Render ──
  // The standing parts — unvoiced rungs, the law, the fold's instruction — are
  // given whole once to a session and then only named (standingBrief).
  const brief = standingBrief(session ? `${session}|${origin}|${field}` : null, law ?? '', nowMs);
  const lines: string[] = [];
  const attendedWhen = clockVoice(spineAddr, spineFloor);
  // A TIME says back the beat it fell in, on the wall clock of its own place,
  // so the booking reads true or plainly wrong before anyone relies on it.
  const asTime = named && NAMED_RUNGS[atWord.trim().toLowerCase().replace(/^this\s+/, '')] === undefined ? readHumanTime(atWord, new Date(nowMs)) : null;
  const namedAs = named
    ? atWord.trim() + (asTime && 'place' in asTime ? `, its beat ${spanInPlace(spineAddr, asTime.place)} there` : '') + (lane ? `, lane ${lane}` : '')
    : null;
  const attendedLabel = [namedAs, attendedWhen].filter(Boolean).join(' — ');
  // A SPAN says back the beats it touched on its own place's clock — wider
  // than the words by up to a beat at each end, which is the clock's grain
  // (function:availability 1.1) — so a block reads true before it is relied on.
  const spanFirst = span ? addressToSpan(span.beats[0]).start.getTime() : 0;
  const spanLast = span ? addressToSpan(span.beats[span.beats.length - 1]).end.getTime() : 0;
  const spanDays = span ? wallDay(spanFirst, span.place) !== wallDay(spanLast - 1, span.place) : false;
  const spanExtent = span
    ? `${wallDay(spanFirst, span.place)} ${wallClock(spanFirst, span.place)}–` +
      `${spanDays ? `${wallDay(spanLast - 1, span.place)} ` : ''}${wallClock(spanLast, span.place)} ${span.place}`
    : null;
  const spanWords = span ? `${span.beats.length} ${span.beats.length === 1 ? 'beat' : 'beats'}, ${spanExtent}` : null;
  lines.push(span
    ? `stream:${field} @ ${origin} — across ${atWord.trim()} (${spanWords}), attended at ${spineAddr}${attendedWhen ? ` — ${attendedWhen}` : ''}`
    : `stream:${field} @ ${origin} — at ${spineAddr}${attendedLabel ? ` (${attendedLabel})` : ''}`);

  const rungs = ladderOf(spine, digits);
  const rungLines = ladderLines(rungs, spineAddr, spineFloor, brief, (i) => !!foldAt(digits.slice(0, i + 1)));
  if (rungLines.length) {
    lines.push('');
    lines.push('# The ladder — this address in its own context, coarse to fine' + (foldBlock ? ' (FOLDED marks a rung the fold already keeps)' : ''));
    lines.push(...rungLines);
  }
  if (standingFold) {
    lines.push('');
    lines.push(`# The fold standing at ${spineAddr} — kept in ${field}; saying here now is saying into a folded address`);
    lines.push(standingFold);
  }

  if (law) {
    lines.push('');
    if (brief) {
      lines.push(`# The law — function:${field}, standing as it was given to you earlier in this session (read function:${field} to have it whole again)`);
    } else {
      // THE LAW IS A BARE ADDRESS AND ITS ROOT LINE, even the first time (keel,
      // 2026-10-06: the whole law on a first engage was 1,300 words it never
      // used). The operator constitutes the family and is read when the law
      // is needed — never to say a line. standingBrief still hashes the whole
      // law, so a changed operator is re-announced as before.
      const lawLines = law.split('\n');
      lines.push(`# The law — function:${field}, this family’s operator: its root line stands here, and its branches at function:${field}, read when the law is needed, never to say a line`);
      lines.push(lawLines.length > 1 ? lawLines[1] : lawLines[0]);
    }
  }

  const voices = new Set(readings.map((r) => r.who)).size;
  lines.push('');
  if (span) {
    // ACROSS A SPAN, holder by holder: each touched day's own line, then the
    // blocks on the asker's clock — the lattice a mind reads the overlap from.
    across.sort((a, b) => a.who.localeCompare(b.who));
    lines.push(
      `# Across the span, on the ${span.place} clock — ${across.length} ${across.length === 1 ? 'holder' : 'holders'}` +
      ` (the SNAPSHOT: every mirror's lines across it, a run of beats saying one thing as one block, listed and never synthesised)`,
    );
    if (across.length === 0) lines.push('  (nobody has given anything across this span — say yours and it becomes the first)');
    for (const a of across) {
      lines.push(`## ${a.who}${a.who === handle ? ' (you)' : ''}`);
      for (const d of a.days) lines.push(`  the day, ${voiceAddress(d.addr)}: ${d.line ?? '(no line — its hours are not known)'}`);
      if (!a.runs.length) lines.push('  (no blocks across the span)');
      for (const r of a.runs) {
        lines.push(`  ${spanDays ? `${wallDay(r.start, span.place)} ` : ''}${wallClock(r.start, span.place)}–${wallClock(r.end, span.place)}  ${r.text}`);
      }
    }
  } else {
    lines.push(
      `# Readings at ${spineAddr}${attendedWhen ? ` (${attendedWhen})` : ''}` +
      ` — ${voices} ${voices === 1 ? 'voice' : 'voices'}` +
      ` (the SNAPSHOT: every mirror concatenated, listed and never synthesised)`,
    );
    if (readings.length === 0) {
      lines.push('  (nobody has read this address yet — say yours and it becomes the first)');
    } else {
      for (const r of readings) {
        // (you) marks the caller's own line: its lane if it named one, else its voicing.
        const mine = r.who === handle && (lane ? r.lane === lane : r.lane === undefined);
        const age = typeof r.ms === 'number' && Number.isFinite(r.ms) ? ` (${agoWords(nowMs - r.ms)})` : '';
        lines.push(`- ${r.who}${r.lane ? ` [${r.lane}]` : ''}${mine ? ' (you)' : ''}: ${r.text}${age}`);
      }
    }
  }
  if (unfollowed > 0) {
    lines.push('');
    lines.push(`  ${unfollowed} other ${unfollowed === 1 ? 'lens stands' : 'lenses stand'} here that you do not follow — a follow is a line at lists:${handle} 4, rank as depth`);
  }
  if (silent.length) {
    lines.push('');
    // At a beat on the moving now the roll of everyone who ever kept a mirror
    // here is not the reading; their number is. Across a span, a holder who
    // gave nothing there is not known there — never free.
    lines.push(moving
      ? `  ${silent.length} other ${silent.length === 1 ? 'mirror stands' : 'mirrors stand'} silent at this beat`
      : span
        ? `  nothing given across the span: ${silent.join(', ')} — not known there, never free`
        : `  silent here: ${silent.join(', ')} — honest absence, not a gap to be filled (tree:5e)`);
  }

  lines.push('');
  lines.push(brief
    ? `# The fold is yours to make, as before (keep='personal' or 'collective', with keep_text)`
    : `# The fold — yours to make, not the primitive's` +
      `\nSynthesise the snapshot above under the law${law ? '' : ` (no function:${field} at this beach, so integrate plainly)`}. ` +
      `Keep it only if it should outlast this turn: keep='personal' lands it at tree:${field}:${handle}:${spineAddr}, your own latest reading of this point; keep='collective' lands it at ${field}:${spineAddr}, ` +
      `where anyone may supersede it with a better reading.`,
  );

  if (saidAt || keptTo || spanSaid) {
    lines.push('');
    if (spanSaid && span) {
      const n = spanSaid.touched;
      lines.push(spanSaid.cleared
        ? (n ? `✓ cleared ${n} ${n === 1 ? 'line' : 'lines'} of yours across the span at ${mirrorName}` : `nothing of yours stood across the span at ${mirrorName} — nothing to clear`)
        : `✓ your line landed at ${mirrorName} on ${n} ${n === 1 ? 'beat' : 'beats'}, ${span.beats[0]} … ${span.beats[span.beats.length - 1]} (${spanExtent})${mintedMirror ? formatBorn(mintedMirror) : ''}`);
    } else if (saidAt) lines.push(`✓ your reading landed at ${saidAt}${mintedMirror ? formatBorn(mintedMirror) : ''}`);
    if (keptTo) lines.push(`✓ fold kept at ${keptTo}`);
  }

  return out(lines.join('\n'));
}

/** THE DOOR KEEPS THE NAME IT IS GIVEN, AND JOINS THE REFLECTION (src/looks.ts).
 *  A stream engage is told a handle, so from here this session's looks carry
 *  that name in every other instance's lateral line; the engage itself is a
 *  look at the family — a touch on the caller's own mirror when it says — and
 *  its answer ends with who else is working the beach just now. A tier call is
 *  a composed prompt another mind runs word for word: the look is noted, and
 *  nothing is appended to it. */
export async function handleStreamEngage(params: StreamEngageParams, extra?: { sessionId?: string }) {
  const session = extra?.sessionId;
  nameAtTheDoor(session, params.handle);
  const res = await streamEngage(params, session);
  const origin = (params.beach ?? DEFAULT_BEACH).replace(/\/+$/, '');
  // An empty say at a span clears the holder's lines there: a write, like any say.
  const clearedSpan = params.say !== undefined && params.say.trim() === '' && params.at !== undefined
    && (() => { const s = readHumanSpan(params.at!, new Date()); return !!s && 'beats' in s; })();
  const said = (params.say !== undefined && params.say.trim() !== '') || clearedSpan;
  const block = said ? `${params.field}:${params.handle}` : `spine:${params.field}`;
  if (params.tier) {
    noteLook(session, origin, block, params.at ?? null, false);
    return res;
  }
  return reflect(res, session, origin, block, params.at ?? null, said || params.keep !== undefined);
}

