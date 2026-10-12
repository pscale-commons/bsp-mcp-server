/**
 * temporal.ts — the temporal coordinate (proposal 2026-07-15-temporal-coordinate).
 *
 * THE LAW (David, 2026-07-15): pscale runs BASE TEN above pscale 5 and below
 * pscale −3, and turns ANALOGUE between, because the middle is exactly where
 * humans built their imperial measures. "The pscale block turns all semantics
 * (including imperial measures) into decimals" — the address is always a
 * decimal number; the irregularity lives in the block's voicing, never in the
 * address. So the reading LLM does decimal comparison (easy) and the block
 * does the semantics (lookup). Neither ever does base-60 subtraction.
 *
 * The consequence that makes this promotable: THE GREGORIAN YEAR NUMBER IS
 * THE ADDRESS. 2026 → millennium 2 (pscale 9), century 0 (8), decade 2 (7),
 * year 6 (6). There is NO EPOCH — the epoch question dissolves, it is 0 AD
 * because it is just the number. A human reads 2026313179 and sees 2026.
 *
 * Floor 10, ten rungs, pscale 9 → 0. Where 0 is a VALUE (the base-ten rungs)
 * the address carries the human number; where 0 is the VOICING (the analogue
 * rungs, pscale 5..−3) the container speaks and the block names the period.
 * That split IS David's law, made mechanical.
 *
 * Canonical form is FULL WIDTH — the year 2026 is "2026000000", never "2026".
 * A short dotless form left-pads into the root underscore chain (supernest
 * absorption), which is emphatically not what a date means. Same lesson earth
 * learned at floor 11 ("write full-width or comma-walk").
 *
 * Kept beside grain-address.ts, deliberately not inside bsp.ts — the walker is
 * ported canon (DO NOT MODIFY); these are conventions layered above it.
 */

/** Floor of the temporal spine: ten rungs, pscale 9 (millennium) → 0 (beat). */
export const TEMPORAL_FLOOR = 10;

export interface Rung {
  /** pscale level — floor − walk depth. */
  pscale: number;
  /** what this rung names. */
  name: string;
  /** how many values the rung takes inside its parent. */
  fanOut: number;
  /** true → 0 is a digit here (base ten, the human number rides the address);
   *  false → 0 is the voicing (analogue; values are 1..fanOut). */
  baseTen: boolean;
  /** approximate span, seconds. Approximate BY NATURE in the analogue zone —
   *  that is what "analogue" means; the label is human, the digit is exact. */
  seconds: number;
}

const YEAR_S = 365.2425 * 86400;

/** The standard temporal spine, coarse to fine. The base-ten/analogue boundary
 *  sits between pscale 6 and 5 at the top (year→season stops dividing by ten)
 *  and between −3 and −4 at the bottom (below the second, decimals resume). */
export const RUNGS: Rung[] = [
  { pscale: 9, name: 'millennium', fanOut: 10, baseTen: true, seconds: YEAR_S * 1000 },
  { pscale: 8, name: 'century', fanOut: 10, baseTen: true, seconds: YEAR_S * 100 },
  { pscale: 7, name: 'decade', fanOut: 10, baseTen: true, seconds: YEAR_S * 10 },
  { pscale: 6, name: 'year', fanOut: 10, baseTen: true, seconds: YEAR_S },
  { pscale: 5, name: 'season', fanOut: 4, baseTen: false, seconds: YEAR_S / 4 },
  { pscale: 4, name: 'month', fanOut: 3, baseTen: false, seconds: YEAR_S / 12 },
  { pscale: 3, name: 'week', fanOut: 5, baseTen: false, seconds: 7 * 86400 },
  { pscale: 2, name: 'day', fanOut: 7, baseTen: false, seconds: 86400 },
  { pscale: 1, name: 'gathering', fanOut: 9, baseTen: false, seconds: 86400 / 9 },
  { pscale: 0, name: 'beat', fanOut: 9, baseTen: false, seconds: 86400 / 81 },
];

/** Finer than the floor — decimal places. −1 the minute-ish, −3 the second
 *  (where David's law says base ten resumes below). Rendered, never addressed
 *  by the ten-digit form; they are the decimals after it. */
export const FINE_RUNGS: Rung[] = [
  { pscale: -1, name: 'minute', fanOut: 9, baseTen: false, seconds: 86400 / 729 },
  { pscale: -2, name: 'breath', fanOut: 9, baseTen: false, seconds: 86400 / 6561 },
  { pscale: -3, name: 'second', fanOut: 9, baseTen: false, seconds: 86400 / 59049 },
];

const ALL_RUNGS = [...RUNGS, ...FINE_RUNGS];

/** The nine day-parts (pscale 1) — 2h40m each, named as humans name them. */
export const DAY_PARTS = [
  'deep night', 'dawn', 'early morning', 'morning', 'midday',
  'afternoon', 'late afternoon', 'evening', 'night',
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Layer A — the moment ⇄ the address ─────────────────────────────────────

/** UTC moment → the canonical full-width ten-digit address. The first four
 *  digits ARE the Gregorian year. Years outside 1000..9999 are out of the
 *  floor-10 form (year 476 would left-pad into the root underscore chain, and
 *  year 10000 grows the floor — both correct, neither this century's problem). */
export function momentToAddress(when: Date): string {
  const y = when.getUTCFullYear();
  if (y < 1000 || y > 9999) {
    throw new RangeError(`temporal: year ${y} is outside the floor-10 form (1000..9999)`);
  }
  const month = when.getUTCMonth();           // 0..11
  const dom = when.getUTCDate();              // 1..31
  const secOfDay = when.getUTCHours() * 3600 + when.getUTCMinutes() * 60 + when.getUTCSeconds();

  const partS = 86400 / 9;                    // 9600 — the gathering
  const beatS = partS / 9;                    // 1066.67 — the beat
  const part = Math.floor(secOfDay / partS);  // 0..8
  const beat = Math.floor((secOfDay - part * partS) / beatS); // 0..8

  const digits = [
    Math.floor(y / 1000) % 10,          // pscale 9 — millennium   (0 is a value)
    Math.floor(y / 100) % 10,           // pscale 8 — century      (0 is a value)
    Math.floor(y / 10) % 10,            // pscale 7 — decade       (0 is a value)
    y % 10,                             // pscale 6 — year         (0 is a value)
    Math.floor(month / 3) + 1,          // pscale 5 — season   1..4
    (month % 3) + 1,                    // pscale 4 — month    1..3
    Math.floor((dom - 1) / 7) + 1,      // pscale 3 — week     1..5
    ((dom - 1) % 7) + 1,                // pscale 2 — day      1..7
    part + 1,                           // pscale 1 — gathering 1..9
    beat + 1,                           // pscale 0 — beat      1..9
  ];
  return digits.join('');
}

/** The address → the span it names, [start, end) in UTC. A temporal address
 *  names a PERIOD, never an instant — which rung it stops at is its
 *  resolution. Accepts any canonical full-width prefix-with-padding
 *  ("2026000000" the year, "2026313179" the beat); trailing zeros are
 *  floor-width padding and stop the walk, exactly as the parser reads them. */
export function addressToSpan(addr: string): { start: Date; end: Date; pscale: number } {
  if (!/^\d{10}$/.test(addr)) {
    throw new RangeError(`temporal: "${addr}" is not a canonical full-width floor-10 address`);
  }
  const d = addr.split('').map(Number);
  // Walk depth = digits before the trailing-zero padding. Base-ten rungs make
  // an interior 0 a real value, so only the TAIL of zeros is padding.
  let depth = 10;
  while (depth > 1 && d[depth - 1] === 0) depth--;

  const y = d[0] * 1000 + d[1] * 100 + d[2] * 10 + d[3];
  const start = new Date(Date.UTC(y, 0, 1));
  const end = new Date(Date.UTC(y + 1, 0, 1));

  // Coarser than the year: widen to the decade / century / millennium.
  if (depth <= 3) {
    const step = [1000, 100, 10][depth - 1];
    const base = Math.floor(y / step) * step;
    return { start: new Date(Date.UTC(base, 0, 1)), end: new Date(Date.UTC(base + step, 0, 1)), pscale: 10 - depth };
  }
  if (depth === 4) return { start, end, pscale: 6 };

  const season = d[4] - 1;                                   // 0..3
  if (depth === 5) {
    return { start: new Date(Date.UTC(y, season * 3, 1)), end: new Date(Date.UTC(y, season * 3 + 3, 1)), pscale: 5 };
  }
  const month = season * 3 + (d[5] - 1);                     // 0..11
  if (depth === 6) {
    return { start: new Date(Date.UTC(y, month, 1)), end: new Date(Date.UTC(y, month + 1, 1)), pscale: 4 };
  }
  const bandStart = (d[6] - 1) * 7 + 1;                      // day-of-month
  if (depth === 7) {
    // Band 5 is short (1-3 days): clamp to the month boundary — "seven-day
    // bands nest strictly inside a month" (sundial 3.1). Unclamped, a dead
    // prior-month band-5 address kept reading as the current week for the
    // first days of the next month (the 2026-09-02 panel's blocker).
    const rawEnd = Date.UTC(y, month, bandStart + 7);
    const monthEnd = Date.UTC(y, month + 1, 1);
    return { start: new Date(Date.UTC(y, month, bandStart)), end: new Date(Math.min(rawEnd, monthEnd)), pscale: 3 };
  }
  const dom = bandStart + (d[7] - 1);
  const dayStart = Date.UTC(y, month, dom);
  if (depth === 8) return { start: new Date(dayStart), end: new Date(dayStart + 86400_000), pscale: 2 };

  const partS = 9600_000;                                    // ms
  const pStart = dayStart + (d[8] - 1) * partS;
  if (depth === 9) return { start: new Date(pStart), end: new Date(pStart + partS), pscale: 1 };

  const beatS = partS / 9;
  const bStart = pStart + (d[9] - 1) * beatS;
  return { start: new Date(bStart), end: new Date(bStart + beatS), pscale: 0 };
}

// ── Layer R — the duration → the rung (the headline fix) ────────────────────

/** The pscale rung a duration stands at — nearest in log space, which is what
 *  "which scale is this?" means. Pure, epoch-free, calendar-free: this is the
 *  whole of what an LLM needs to stop doing mixed-radix subtraction. */
export function pscaleOfDuration(seconds: number): number {
  const s = Math.abs(seconds);
  if (s < 1) return -3;
  let best = ALL_RUNGS[0];
  let bestD = Infinity;
  for (const r of ALL_RUNGS) {
    const d = Math.abs(Math.log(s / r.seconds));
    if (d < bestD) { bestD = d; best = r; }
  }
  return best.pscale;
}

/** Irregular plurals for rung names; the rest take a plain s. */
export const RUNG_PLURALS: Record<string, string> = { millennium: 'millennia', century: 'centuries' };

/** The CONTAINING rung — the coarsest rung not longer than the duration; null
 *  when the duration is shorter than every rung. Containing, not log-nearest:
 *  nearest let 52 minutes read as "this beat" (a beat is ~18 minutes) and 2h40m
 *  as "within the hour" — and spans, ripeness, and staleness are all READ off
 *  these ages (grit 2.5, expiry-is-read; caught live, NHITL 2026-07-22), so an
 *  age label must never understate. pscaleOfDuration keeps its log-nearest
 *  semantics for "which scale is this?" questions; an age is a magnitude, so it
 *  floors to the rung and counts. */
function containingRung(seconds: number): Rung | null {
  let best: Rung | null = null;
  for (const r of ALL_RUNGS) {
    if (r.seconds <= seconds && (best === null || r.seconds > best.seconds)) best = r;
  }
  return best;
}

/** The feature: an ISO timestamp rendered WITH its relation to now, so the
 *  reading LLM never subtracts. "(+0 — 3 beats ago)". Past and future both.
 *  The count is in the rung's own pscale units (the pscale minute is ~2 clock
 *  minutes) — voicing stays analogue by the law at the head of this file; what
 *  is promised is that the label never understates the rung. */
export function renderAge(iso: string, now: Date = new Date()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const deltaS = (now.getTime() - t) / 1000;
  const s = Math.abs(deltaS);
  const rung = containingRung(s);
  const p = rung === null ? -3 : rung.pscale;
  const sign = p >= 0 ? `+${p}` : `${p}`;
  if (rung === null || p <= -2) return `(${sign} — just now)`;
  const n = Math.max(1, Math.round(s / rung.seconds));
  const noun = n === 1 ? rung.name : (RUNG_PLURALS[rung.name] ?? `${rung.name}s`);
  const phrase = n === 1 ? (/^[aeiou]/.test(noun) ? `an ${noun}` : `a ${noun}`) : `${n} ${noun}`;
  return deltaS >= 0 ? `(${sign} — ${phrase} ago)` : `(${sign} — in ${phrase})`;
}

// ── Layer C — a temporal ADDRESS rendered with its relation to now ─────────

/** Rung lookup by pscale (standard spine + fine rungs). */
function rungAt(pscale: number): Rung | null {
  return ALL_RUNGS.find((r) => r.pscale === pscale) ?? null;
}

/** Parse a rendered temporal-address token into its period, validating the
 *  analogue rungs' ranges. Accepts 4-10 digits — the canonical full-width
 *  form, or a label whose trailing zeros a renderer stripped — and right-pads
 *  to full width. Returns null for anything that is not a well-formed
 *  temporal address: a leading zero (year 0xxx is outside the floor-10 form,
 *  and Date.UTC would silently remap it), an analogue digit out of its rung's
 *  range (season 7, day 9), or a value after zero-padding began (padding is a
 *  tail, never interior). The four base-ten digits are otherwise free — any
 *  year is a year; callers wanting a narrower window (prose annotation) gate
 *  with their own pattern before calling. */
export function parseTemporalLabel(
  token: string,
): { addr: string; start: Date; end: Date; pscale: number } | null {
  if (!/^\d{4,10}$/.test(token)) return null;
  const addr = token.padEnd(10, '0');
  if (addr[0] === '0') return null;
  const fans = [4, 3, 5, 7, 9, 9]; // season, month, week-band, day, gathering, beat
  let padding = false;
  for (let i = 4; i < 10; i++) {
    const v = Number(addr[i]);
    if (v === 0) { padding = true; continue; }
    if (padding || v > fans[i - 4]) return null;
  }
  // Calendar existence — the fans admit the digit range, the month admits the
  // date: band 5 exists only where the month runs past day 28, and a band-5
  // day must not walk past the month's last day ("Jan 32" otherwise parsed to
  // a validated span inside February — the 2026-09-02 panel's blocker).
  const wBand = Number(addr[6]);
  if (wBand >= 1) {
    const yCal = Number(addr.slice(0, 4));
    const monthCal = (Number(addr[4]) - 1) * 3 + (Number(addr[5]) - 1);
    const daysInMonth = new Date(Date.UTC(yCal, monthCal + 1, 0)).getUTCDate();
    const bandFirstDom = (wBand - 1) * 7 + 1;
    if (bandFirstDom > daysInMonth) return null;
    const dDay = Number(addr[7]);
    if (dDay >= 1 && bandFirstDom + dDay - 1 > daysInMonth) return null;
  }
  try {
    const { start, end, pscale } = addressToSpan(addr);
    return { addr, start, end, pscale };
  } catch {
    return null;
  }
}

/** Bands in a month: 4 for a 28-day February, else 5. */
function bandsInMonth(y: number, m0: number): number {
  const days = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
  return Math.ceil(days / 7);
}

/** Whole periods between an address's period and now's period, at the
 *  address's own rung. The irregular rungs (week, month, season, year and
 *  coarser) count CALENDAR ORDINALS — exact, monotone, never a duplicated or
 *  skipped step at a boundary (mean-length division read two different months
 *  as 'next month' beside a short February; 2026-09-02 panel). The uniform
 *  rungs (day and finer) divide by their exact span. This makes two
 *  vocabularies precise, each true under its own definition: an ADDRESS
 *  relation counts periods (a band two bands back reads '2 weeks behind' even
 *  when a short band-5 makes it ten days), while an INSTANT age (renderAge)
 *  counts duration in the containing rung. */
function periodsBetween(
  addrA: string,
  addrNow: string,
  pscale: number,
  behind: boolean,
  nowMs: number,
  start: Date,
  end: Date,
  rung: Rung,
): number {
  const yA = Number(addrA.slice(0, 4));
  const yN = Number(addrNow.slice(0, 4));
  if (pscale >= 7) {
    const step = Math.pow(10, pscale - 6);
    return Math.abs(Math.floor(yN / step) - Math.floor(yA / step));
  }
  if (pscale === 6) return Math.abs(yN - yA);
  if (pscale === 5) {
    return Math.abs((yN * 4 + Number(addrNow[4])) - (yA * 4 + Number(addrA[4])));
  }
  if (pscale === 4) {
    const mA = (Number(addrA[4]) - 1) * 3 + (Number(addrA[5]) - 1);
    const mN = (Number(addrNow[4]) - 1) * 3 + (Number(addrNow[5]) - 1);
    return Math.abs((yN * 12 + mN) - (yA * 12 + mA));
  }
  if (pscale === 3) {
    const a = { y: yA, m0: (Number(addrA[4]) - 1) * 3 + (Number(addrA[5]) - 1), w: Number(addrA[6]) };
    const b = { y: yN, m0: (Number(addrNow[4]) - 1) * 3 + (Number(addrNow[5]) - 1), w: Number(addrNow[6]) };
    const [lo, hi] = behind ? [a, b] : [b, a];
    if (lo.y === hi.y && lo.m0 === hi.m0) return Math.abs(hi.w - lo.w);
    let n = bandsInMonth(lo.y, lo.m0) - lo.w;
    let y = lo.y;
    let m = lo.m0 + 1;
    if (m > 11) { m = 0; y++; }
    let guard = 0;
    while ((y < hi.y || (y === hi.y && m < hi.m0)) && guard++ < 2400) {
      n += bandsInMonth(y, m);
      m++;
      if (m > 11) { m = 0; y++; }
    }
    return n + hi.w;
  }
  // Uniform rungs — exact by their own span.
  const gapS = (behind ? nowMs - end.getTime() : start.getTime() - nowMs) / 1000;
  return Math.floor(gapS / rung.seconds) + 1;
}

/** What a period containing now is called, at its own grain. */
function presentLabel(pscale: number, addr: string): string {
  if (pscale >= 3) {
    const name = rungAt(pscale)?.name ?? 'period';
    return `this ${name}`;
  }
  if (pscale === 2) return 'today';
  if (pscale === 1) return `this ${DAY_PARTS[Number(addr[8]) - 1] ?? 'gathering'}`;
  return 'this beat';
}

/** A temporal address rendered WITH its relation to now — branch 6.1 of the
 *  sundial made mechanical for addresses, as renderAge is for instants: the
 *  reader partitions past from future by reading, never by digit arithmetic
 *  (shared prefix is orientation, not distance — a boundary flips high digits
 *  while lying minutes apart). A period containing now is present AT ITS OWN
 *  GRAIN; wholly behind is record; wholly ahead is intention, flagged AHEAD so
 *  a stale intention can never read as current. Counting is span-based in the
 *  address's own rung; the fine rungs (gathering, beat) voice through the day
 *  when they cross one, because '9 gatherings ahead' orients worse than
 *  'tomorrow, morning'. Returns '' for anything that does not parse as a
 *  temporal address. */
export function renderAddressRelation(token: string, now: Date = new Date()): string {
  const parsed = parseTemporalLabel(token);
  if (!parsed) return '';
  const { addr, start, end, pscale } = parsed;
  const t = now.getTime();
  if (t >= start.getTime() && t < end.getTime()) {
    return `(now — ${presentLabel(pscale, addr)})`;
  }
  const behind = t >= end.getTime();
  if (pscale <= 1) {
    const dayAddr = addr.slice(0, 8).padEnd(10, '0');
    const nowDayAddr = momentToAddress(now).slice(0, 8).padEnd(10, '0');
    if (dayAddr !== nowDayAddr) {
      const dayRel = renderAddressRelation(dayAddr, now);
      const dayGap = Math.round(
        Math.abs(addressToSpan(dayAddr).start.getTime() - addressToSpan(nowDayAddr).start.getTime()) / 86400_000,
      );
      const part = DAY_PARTS[Number(addr[8]) - 1];
      // The part suffix orients within a week; at a distance it is noise
      // riding a large count ('in 27325 days, afternoon' — panel).
      return dayGap <= 7 && part && dayRel ? dayRel.replace(/\)$/, `, ${part})`) : dayRel;
    }
  }
  const rung = rungAt(pscale);
  if (!rung) return '';
  const n = periodsBetween(addr, momentToAddress(now), pscale, behind, t, start, end, rung);
  if (n === 1) {
    const one: Record<string, [string, string]> = {
      day: ['yesterday', 'tomorrow'],
      week: ['last week', 'next week'],
      month: ['last month', 'next month'],
      season: ['last season', 'next season'],
      year: ['last year', 'next year'],
    };
    const special = one[rung.name];
    if (special) return behind ? `(${special[0]})` : `(AHEAD — ${special[1]})`;
  }
  const noun = n === 1 ? rung.name : (RUNG_PLURALS[rung.name] ?? `${rung.name}s`);
  const phrase = `${n} ${noun}`;
  return behind ? `(${phrase} behind)` : `(AHEAD — in ${phrase})`;
}

/** The now-stamp: the prerequisite the rendering hangs on. One line, every
 *  envelope. Carries the ISO (canonical), the address (pointable), and the
 *  human voicing (what the digits mean). */
export function renderNow(now: Date = new Date()): string {
  const addr = momentToAddress(now);
  const iso = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  return `now · ${iso} · ${addr} · ${voiceAddress(addr)}`;
}

// ── Grounding — the rendering boundary renders (proposal §5.1, §5.2) ───────

/** ISO-8601 instants as they actually appear in blocks: mark field 3, presence,
 *  history entries, pool contributions, `Window opened …`. Date-only strings are
 *  deliberately NOT matched — "2026-07-15" in prose is usually a human's date,
 *  not a machine stamp, and annotating it would be noise. Nor are timestamps
 *  EMBEDDED in a longer token — a probe_id like `cowrie-supernest-2026-08-25T12:44Z-h1`
 *  carries its ask's stamp as part of its name, and annotating inside it splices
 *  an age into an identifier (witnessed live, SAND trial 1): the guards require
 *  the instant to stand free — not glued to a word character or hyphen on
 *  either side. */
const ISO_RE = /(?<![\w-])\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})(?![\w-])/g;

/**
 * Annotate every ISO timestamp in rendered text with its age. THIS is the
 * feature (proposal §1): the relation rendered beside the data, so the reading
 * LLM never subtracts and never has to hop 40k tokens to an anchor.
 *
 * Applied at the rendering boundary rather than inside each formatter, which
 * is why it costs no edit to bsp.ts (ported canon), no edit to any fmt*, and
 * covers every surface at once — marks, history, presence, pools, envelopes,
 * and anything authored later. Stored data is untouched: ISO stays canonical
 * in the block; pscale is how time is VOICED.
 */
/** Ten-digit sundial addresses as they appear in prose — the year window
 *  1900-2199 keeps arbitrary numerics out, rung validity does the rest
 *  (parseTemporalLabel), and the guards mirror ISO_RE's discipline: the token
 *  stands free — not glued to word characters or hyphens, not carrying a
 *  decimal tail (2026331248.5 is finer-than-the-floor, one token), not
 *  already annotated (a following parenthesis is a tag that already stands),
 *  and not a renderer's own bracketed label (a following "]" — the label's
 *  renderer decides its own tagging via addrLabel; a sentence-final full stop
 *  is fine). */
const TEMPORAL_ADDR_RE = /(?<![\w.\-])(?:19|20|21)\d{8}(?!\.\d)(?!\s*\()(?!\])(?![\w\-])/g;

export function annotateAges(text: string, now: Date = new Date()): string {
  const withInstants = text.replace(ISO_RE, (m) => {
    const age = renderAge(m, now);
    return age ? `${m} ${age}` : m;
  });
  return withInstants.replace(TEMPORAL_ADDR_RE, (m) => {
    // Prose is the loose gate, so it narrows twice beyond a label: an address
    // coarser than a year is round-number territory (a credit amount
    // 2000000000 is rung-valid by the zero-tail rule), and a year a lifetime
    // out is id territory (phone numbers, serials) — both classes
    // demonstrated by the 2026-09-02 panel. The residual stands, named: a
    // rung-valid in-window token (2026331234, a DC phone number) still
    // annotates, visibly.
    const parsed = parseTemporalLabel(m);
    if (!parsed || parsed.pscale > 6) return m;
    if (Math.abs(Number(m.slice(0, 4)) - now.getUTCFullYear()) > 50) return m;
    const rel = renderAddressRelation(m, now);
    return rel ? `${m} ${rel}` : m;
  });
}

/** Body annotated, then stamped. The stamp is appended AFTER annotation so it
 *  never annotates itself. */
export function ground(text: string, now: Date = new Date(), here: string | null = null): string {
  return `${annotateAges(text, now)}\n\n${renderNow(now)}${here ? `\n${here}` : ''}`;
}

/** Ground an MCP tool result in place: every text part gets its ages, and the
 *  LAST text part carries the stamp (one per response, at the end, adjacent to
 *  whatever the reader just read) — and beneath it the here-stamp when the caller
 *  has one (src/here.ts; sundial 5.5). Non-text parts and error results pass
 *  through untouched — an error needs no clock. */
export function groundResult<T>(res: T, now: Date = new Date(), here: string | null = null): T {
  const r = res as any;
  if (!r || r.isError || !Array.isArray(r.content)) return res;
  const textIdx = r.content
    .map((c: any, i: number) => (c?.type === 'text' && typeof c.text === 'string' ? i : -1))
    .filter((i: number) => i >= 0);
  if (textIdx.length === 0) return res;
  const last = textIdx[textIdx.length - 1];
  return {
    ...r,
    content: r.content.map((c: any, i: number) => {
      if (!textIdx.includes(i)) return c;
      const body = annotateAges(c.text, now);
      return { ...c, text: i === last ? `${body}\n\n${renderNow(now)}${here ? `\n${here}` : ''}` : body };
    }),
  } as T;
}

/** The human voicing of an address — the block's job, done in code because
 *  the ladder is law, not content. "Tuesday 15 July 2026, late afternoon". */
export function voiceAddress(addr: string): string {
  const { start, pscale } = addressToSpan(addr);
  const y = start.getUTCFullYear();
  if (pscale >= 7) return `the ${y}s`;
  if (pscale === 6) return `${y}`;
  if (pscale === 5) return `${['winter-quarter', 'spring-quarter', 'summer-quarter', 'autumn-quarter'][Math.floor(start.getUTCMonth() / 3)]} ${y}`;
  if (pscale === 4) return `${MONTHS[start.getUTCMonth()]} ${y}`;
  if (pscale === 3) return `the week of ${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} ${y}`;
  const day = `${WEEKDAYS[start.getUTCDay()]} ${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} ${y}`;
  if (pscale === 2) return day;
  const part = DAY_PARTS[Number(addr[8]) - 1];
  if (pscale === 1) return `${day}, ${part}`;
  return `${day}, ${part} (beat ${addr[9]})`;
}

// ── Layer H — a time as a person says it → the beat it falls in ─────────────
//
// THE INVERSE OF THE NOW-STAMP. A person books "4pm", never 2026411666, and
// what lies between the two — a place's offset that summer time moves, then
// ninths of a UTC day — is exactly the mixed-radix arithmetic an LLM botches
// (sundial 4). So a door takes the WORDS and the clock does the sums, as it
// already does for 'today'. A time always carries its PLACE, because the clock
// keeps no time zone (sundial 8.3): the words name it — an IANA zone
// ("Europe/London"), an offset ("+01:00"), or UTC — or a door that knows its
// own device (the mirror, in a browser) supplies it.

/** A time read off a person's words: the beat address it falls in, the
 *  instant named, and the place it was read in. */
export interface HumanTime { address: string; instant: Date; place: string }

/** The wall clock of `place` at an instant: [y, m0, d, h, mi, s], or null when
 *  `place` is no zone Intl knows. */
function wallIn(place: string, ms: number): number[] | null {
  try {
    const f = new Intl.DateTimeFormat('en-US', {
      timeZone: place, hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
    });
    const p: Record<string, number> = {};
    for (const x of f.formatToParts(new Date(ms))) if (x.type !== 'literal') p[x.type] = Number(x.value);
    return [p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second];
  } catch {
    return null;
  }
}

/** A place → its offset east of UTC at an instant, in ms. A fixed offset
 *  ('+01:00', 'UTC') is the same at every instant; a zone is asked. */
function offsetAt(place: string, ms: number): number {
  const fixed = /^([+-])(\d{2}):(\d{2})$/.exec(place);
  if (fixed) return (fixed[1] === '-' ? -1 : 1) * (Number(fixed[2]) * 60 + Number(fixed[3])) * 60_000;
  if (place === 'UTC') return 0;
  const w = wallIn(place, ms)!;
  return Date.UTC(w[0], w[1], w[2], w[3], w[4], w[5]) - Math.floor(ms / 1000) * 1000;
}

/** A place token → its canonical spelling, or null. */
function placeOf(token: string): string | null {
  if (/^(z|utc|gmt)$/i.test(token)) return 'UTC';
  const off = /^(?:utc|gmt)?([+-])(\d{1,2})(?::?(\d{2}))?$/i.exec(token);
  if (off) {
    const h = Number(off[2]), m = Number(off[3] ?? 0);
    return h <= 14 && m < 60 ? `${off[1]}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` : null;
  }
  if (!/^[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+)+$/.test(token)) return null;
  try { return new Intl.DateTimeFormat('en-US', { timeZone: token }).resolvedOptions().timeZone; } catch { return null; }
}

/** The words of a time or a day, read token by token: a DATE (2026-10-07,
 *  today, tomorrow, yesterday, a weekday — 'tuesday', 'next friday'), a TIME
 *  (16:00, 4pm, 4:30 pm, noon, midnight) and a PLACE; or one ISO instant with
 *  its offset (2026-10-07T16:00+01:00). Null when any token is none of these,
 *  so prose, a digit address or a span falls through. */
interface SaidWords { date: number[] | null; shift: number; weekday: number | null; next: boolean; hm: number[] | null; place: string | null }
const DAY_WORDS: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2, wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4, friday: 5, fri: 5, saturday: 6, sat: 6,
};
function readWords(words: string): SaidWords | null {
  const said = String(words ?? '').trim().toLowerCase()
    .replace(/(\d)\s*([ap])\.?m\.?(?=\s|,|$)/g, '$1$2m');
  if (!said) return null;
  const w: SaidWords = { date: null, shift: 0, weekday: null, next: false, hm: null, place: null };
  let modifier = false;

  const iso = /^(\d{4})-(\d{2})-(\d{2})[t ](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(z|[+-]\d{2}:?\d{2})?$/.exec(said);
  if (iso) {
    w.date = [Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])];
    w.hm = [Number(iso[4]), Number(iso[5]), Number(iso[6] ?? 0)];
    if (iso[7]) w.place = placeOf(iso[7].length === 5 ? iso[7].slice(0, 3) + ':' + iso[7].slice(3) : iso[7]);
    return w;
  }
  for (const raw of said.split(/[\s,]+/)) {
    const t = raw.trim();
    if (!t || t === 'at' || t === 'on') continue;
    let m: RegExpExecArray | null;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)) && !w.date) w.date = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
    else if (t === 'today' && !w.date) w.shift = 0, w.date = [];
    else if (t === 'tomorrow' && !w.date) w.shift = 1, w.date = [];
    else if (t === 'yesterday' && !w.date) w.shift = -1, w.date = [];
    else if (Object.prototype.hasOwnProperty.call(DAY_WORDS, t) && !w.date) w.weekday = DAY_WORDS[t], w.date = [];
    else if ((t === 'next' || t === 'this') && !modifier) modifier = true, w.next = t === 'next';
    else if ((m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t)) && !w.hm) w.hm = [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
    else if ((m = /^(\d{1,2})(?::(\d{2}))?([ap])m$/.exec(t)) && !w.hm) {
      const h = Number(m[1]);
      if (h < 1 || h > 12) return null;
      w.hm = [(h % 12) + (m[3] === 'p' ? 12 : 0), Number(m[2] ?? 0), 0];
    }
    else if (t === 'noon' && !w.hm) w.hm = [12, 0, 0];
    else if (t === 'midnight' && !w.hm) w.hm = [0, 0, 0];
    else if (!w.place && (w.place = placeOf(raw.trim().replace(/^(utc|gmt)$/i, 'UTC')))) continue;
    else return null;
  }
  // 'next' and 'this' only ever qualify a weekday.
  if (modifier && w.weekday === null) return null;
  return w;
}

/** The date the words name, read IN `place`: as given, or the place's own
 *  today moved by the day words. A date named outright must exist —
 *  2026-02-30 is refused, never rolled into March. A weekday is today when
 *  today is that day, else the coming one; 'next' skips today. */
function dateIn(w: SaidWords, place: string, now: Date): [number, number, number] | null {
  if (w.date && w.date.length === 3) {
    const [y, m0, d] = w.date;
    const check = new Date(Date.UTC(y, m0, d));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m0 || check.getUTCDate() !== d) return null;
    return [y, m0, d];
  }
  const here = new Date(now.getTime() + offsetAt(place, now.getTime()));
  let shift = w.shift;
  if (w.weekday !== null) {
    shift = (w.weekday - here.getUTCDay() + 7) % 7;
    if (shift === 0 && w.next) shift = 7;
  }
  const day = new Date(Date.UTC(here.getUTCFullYear(), here.getUTCMonth(), here.getUTCDate() + shift));
  return [day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()];
}

/** Read a time as a person says it. Words come in any order — a DATE
 *  (2026-10-07, today, tomorrow, yesterday, a weekday), a TIME (16:00, 4pm,
 *  4:30 pm, noon, midnight) and a PLACE — or as one ISO instant with its
 *  offset (2026-10-07T16:00+01:00). With no date it is today IN THAT PLACE.
 *  Returns null when the words are not a time, so a digit address or a named
 *  rung falls through untouched; { needsPlace } for a time with no place when
 *  the door has none to supply. Pure but for Intl's zone tables. */
export function readHumanTime(
  words: string, now: Date = new Date(), devicePlace?: string,
): HumanTime | { needsPlace: true } | null {
  const w = readWords(words);
  if (!w) return null;
  const hm = w.hm;
  if (!hm || hm[0] > 23 || hm[1] > 59 || hm[2] > 59) return null;
  const place = w.place ?? (devicePlace ? placeOf(devicePlace) : null);
  if (!place) return { needsPlace: true };
  const day = dateIn(w, place, now);
  if (!day) return null;
  const [y, m0, d] = day;
  // The wall time in that place → the instant: guess with the offset at the
  // wall time read as UTC, then once more at the guess, which settles the
  // nights summer time begins or ends.
  const wall = Date.UTC(y, m0, d, hm[0], hm[1], hm[2]);
  let ms = wall - offsetAt(place, wall);
  ms = wall - offsetAt(place, ms);
  const instant = new Date(ms);
  try {
    return { address: momentToAddress(instant), instant, place };
  } catch {
    return null;   // outside the floor-10 form (years 1000-9999)
  }
}

/** A DAY as a person says it — 'tomorrow', 'Tuesday', 'next Friday',
 *  '2026-10-13' — with or without its place → the clock's day of that date,
 *  the address with the day's two trailing zeros. The date is read IN the
 *  place when one is named (past midnight in London it is already tomorrow
 *  there), and on the clock's own UTC day when none is, as 'today' is. Null
 *  when the words are not a day: a time, a span, a digit address or prose
 *  falls through untouched. */
export function readHumanDay(words: string, now: Date = new Date(), devicePlace?: string): string | null {
  const w = readWords(words);
  if (!w || w.hm || !w.date) return null;
  const place = w.place ?? (devicePlace ? placeOf(devicePlace) : null) ?? 'UTC';
  const day = dateIn(w, place, now);
  if (!day) return null;
  try {
    return momentToAddress(new Date(Date.UTC(day[0], day[1], day[2], 12))).slice(0, 8) + '00';
  } catch {
    return null;
  }
}

// ── A span as a person says it → every beat it touches ──────────────────────
//
// A SPAN NAMES ITS BEATS (2026-10-10, the availability family): "busy
// 14:00–15:00 tomorrow" is two times with one day and one place, and what lies
// between them on the clock is a run of beats no LLM should count. The door
// reads both ends as times and hands back every beat the span touches — a beat
// touched at all is in it, the end itself is not.

/** A span read off a person's words: its two instants, its place, and the
 *  address of every beat it touches, earliest first. */
export interface HumanSpan { start: Date; end: Date; place: string; beats: string[] }

/** The longest span the door reads at once: a fortnight of beats. */
export const SPAN_MAX_DAYS = 14;

const DAY_MS = 86_400_000;
/** Beats since the epoch: eighty-one to a UTC day, counted in whole numbers
 *  so a beat's edge never falls to rounding. */
function beatIndex(ms: number): number { return Math.floor((ms * 81) / DAY_MS); }

/** Every beat in [startMs, endMs), each by its address, read at its middle. */
function beatsAcross(startMs: number, endMs: number): string[] {
  const out: string[] = [];
  for (let k = beatIndex(startMs), last = beatIndex(endMs - 1); k <= last; k++) {
    out.push(momentToAddress(new Date(Math.floor(((k + 0.5) * DAY_MS) / 81))));
  }
  return out;
}

/** Read a span as a person says it: two times joined by a dash or a word
 *  ('14:00–15:00', '9am-5pm', '13:00 to 18:00'), with the day and the place
 *  as a time takes them ('14:00–15:00 tomorrow Europe/London', 'Tuesday
 *  13:00–18:00 Europe/London'), or two ISO instants joined by a slash. The
 *  end may be 24:00 or midnight, the day's own end; an end at or before the
 *  start falls on the next day. Null when the words are not a span;
 *  { needsPlace } when no place is named or supplied; { tooLong } past
 *  SPAN_MAX_DAYS. */
export function readHumanSpan(
  words: string, now: Date = new Date(), devicePlace?: string,
): HumanSpan | { needsPlace: true } | { tooLong: true } | null {
  const said = String(words ?? '').trim();
  if (!said) return null;
  let a: HumanTime | { needsPlace: true } | null;
  let b: HumanTime | { needsPlace: true } | null;
  const iso = /^(\d{4}-\d{2}-\d{2}[tT ]\S+)\s*\/\s*(\d{4}-\d{2}-\d{2}[tT ]\S+)$/.exec(said);
  if (iso) {
    a = readHumanTime(iso[1], now, devicePlace);
    b = readHumanTime(iso[2], now, devicePlace);
  } else {
    const low = said.toLowerCase().replace(/(\d)\s*([ap])\.?m\.?(?=[\s,–—-]|$)/g, '$1$2m');
    const T = '(?:\\d{1,2}:\\d{2}(?::\\d{2})?|\\d{1,2}(?::\\d{2})?[ap]m|noon|midnight)';
    const m = new RegExp(`(?:^|[\\s,])(${T})\\s*(?:–|—|-|to|until|till)\\s*(${T}|24:00)(?=[\\s,]|$)`).exec(low);
    if (!m) return null;
    const rest = `${low.slice(0, m.index)} ${low.slice(m.index + m[0].length)}`.trim();
    const endsTheDay = m[2] === '24:00' || m[2] === 'midnight';
    a = readHumanTime(`${m[1]} ${rest}`, now, devicePlace);
    b = readHumanTime(`${endsTheDay ? '23:59:59' : m[2]} ${rest}`, now, devicePlace);
    if (b && 'instant' in b && endsTheDay) b = { ...b, instant: new Date(b.instant.getTime() + 1000) };
  }
  if (!a || !b) return null;
  if ('needsPlace' in a || 'needsPlace' in b) return { needsPlace: true };
  const start = a.instant.getTime();
  let end = b.instant.getTime();
  if (end <= start) end += DAY_MS;   // past midnight: the end is the next day's
  if (end - start > SPAN_MAX_DAYS * DAY_MS) return { tooLong: true };
  return { start: new Date(start), end: new Date(end), place: a.place, beats: beatsAcross(start, end) };
}

/** An instant on the wall clock of a place — "15:49" — rounded to its
 *  nearest minute. */
export function wallClock(ms: number, place: string): string {
  const r = Math.round(ms / 60_000) * 60_000;
  const w = new Date(r + offsetAt(place, r));
  return `${String(w.getUTCHours()).padStart(2, '0')}:${String(w.getUTCMinutes()).padStart(2, '0')}`;
}

/** The day an instant falls on in a place — "Tuesday 13 October". */
export function wallDay(ms: number, place: string): string {
  const w = new Date(ms + offsetAt(place, ms));
  return `${WEEKDAYS[w.getUTCDay()]} ${w.getUTCDate()} ${MONTHS[w.getUTCMonth()]}`;
}

/** The span of a temporal address read on the wall clock of a place —
 *  "15:49–16:07" — each edge rounded to its nearest minute. */
export function spanInPlace(addr: string, place: string): string {
  const { start, end } = addressToSpan(addr);
  return `${wallClock(start.getTime(), place)}–${wallClock(end.getTime(), place)}`;
}
