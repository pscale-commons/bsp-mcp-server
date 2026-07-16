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
    return { start: new Date(Date.UTC(y, month, bandStart)), end: new Date(Date.UTC(y, month, bandStart + 7)), pscale: 3 };
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

const AGE_LABEL: Record<number, string> = {
  [-3]: 'just now', [-2]: 'just now', [-1]: 'a minute or two',
  0: 'this beat', 1: 'within the hour', 2: 'about a day', 3: 'days',
  4: 'weeks', 5: 'months', 6: 'about a year', 7: 'years', 8: 'a lifetime', 9: 'an age',
};

/** The feature: an ISO timestamp rendered WITH its relation to now, so the
 *  reading LLM never subtracts. "(+2 — about a day ago)". Past and future both. */
export function renderAge(iso: string, now: Date = new Date()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const deltaS = (now.getTime() - t) / 1000;
  const p = pscaleOfDuration(deltaS);
  const label = AGE_LABEL[p] ?? `${p}`;
  const sign = p >= 0 ? `+${p}` : `${p}`;
  if (p <= -2) return `(${sign} — just now)`;
  return deltaS >= 0 ? `(${sign} — ${label} ago)` : `(${sign} — in ${label})`;
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
 *  not a machine stamp, and annotating it would be noise. */
const ISO_RE = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g;

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
export function annotateAges(text: string, now: Date = new Date()): string {
  return text.replace(ISO_RE, (m) => {
    const age = renderAge(m, now);
    return age ? `${m} ${age}` : m;
  });
}

/** Body annotated, then stamped. The stamp is appended AFTER annotation so it
 *  never annotates itself. */
export function ground(text: string, now: Date = new Date()): string {
  return `${annotateAges(text, now)}\n\n${renderNow(now)}`;
}

/** Ground an MCP tool result in place: every text part gets its ages, and the
 *  LAST text part carries the stamp (one per response, at the end, adjacent to
 *  whatever the reader just read). Non-text parts and error results pass
 *  through untouched — an error needs no clock. */
export function groundResult<T>(res: T, now: Date = new Date()): T {
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
      return { ...c, text: i === last ? `${body}\n\n${renderNow(now)}` : body };
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
