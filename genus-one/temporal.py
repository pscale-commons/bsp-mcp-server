#!/usr/bin/env python3
"""temporal.py — ported from src/temporal.ts — the sundial's arithmetic; re-port, never fork.

The pulse's own clock. A pulse agent is the only agent that must derive its own
now (pscale://sundial 8.2): every other shell borrows its holder's wall-clock,
one organic hop out, while a pulse taken with no holder present takes the
substrate's own origin and the pulse's own moment. So the three functions the
router uses to stamp every envelope live here too, in Python, for the kernel:

    moment_to_address(when)   UTC instant -> the ten-digit floor-10 address
    voice_address(addr)       the address -> its human voicing
    render_now(now)           "now · <ISO> · <address> · <voicing>", the footer form

plus address_to_span, which voice_address stands on, and from_epoch, the bridge
from a kernel `now` (epoch seconds) to the instant. Pure functions, stdlib only,
no clock read anywhere — the instant is always passed in.

Every output is byte-equal to the TypeScript's for the same input, quirks
included (Date.UTC reads a year 0..99 as 1900+; a time value truncates to the
millisecond toward zero): the label is the law, and a kernel and a door
composing the same instant must agree char for char —
scripts/smoke-genus-parity.ts runs both against one pinned instant. The
TypeScript is canonical: when it moves, re-port this file wholesale; never
patch a difference in here. test_temporal.py carries the ported cases
(python3 genus-one/test_temporal.py).
"""

import math
import re
from datetime import datetime, timedelta, timezone

# Floor of the temporal spine: ten rungs, pscale 9 (millennium) -> 0 (beat).
TEMPORAL_FLOOR = 10

# The nine day-parts (pscale 1) — 2h40m each, named as humans name them.
DAY_PARTS = [
    'deep night', 'dawn', 'early morning', 'morning', 'midday',
    'afternoon', 'late afternoon', 'evening', 'night',
]

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
          'August', 'September', 'October', 'November', 'December']
WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

_EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)


# ── the instant, read the way a JS Date is ──────────────────────────────────

def _utc(when):
    """A datetime read as an instant. Aware -> converted to UTC; naive -> taken
    as UTC already (a JS Date is always an instant; getUTC* reads it)."""
    if not isinstance(when, datetime):
        raise TypeError('temporal: expected a datetime, got %r' % (type(when).__name__,))
    if when.tzinfo is None:
        return when.replace(tzinfo=timezone.utc)
    return when.astimezone(timezone.utc)


def _ms(when):
    """The time value: whole milliseconds since the epoch."""
    td = when - _EPOCH
    return td.days * 86400000 + td.seconds * 1000 + td.microseconds // 1000


def _from_ms(ms):
    """`new Date(ms)` — TimeClip truncates toward zero to a whole millisecond."""
    return _EPOCH + timedelta(milliseconds=int(ms))


def _date_utc(y, m0, d):
    """`Date.UTC(y, m0, d)`: month 0-based, day 1-based, both free to overflow
    into the following months and years exactly as JS normalises them; and a
    year 0..99 reads as 1900+ (the Date.UTC rule — mirrored so the port stays
    faithful even off the floor-10 form). Python's datetime stops at year 9999
    where the TS runs on; nothing this century reaches it."""
    if 0 <= y <= 99:
        y += 1900
    y += m0 // 12
    m0 %= 12
    return datetime(y, m0 + 1, 1, tzinfo=timezone.utc) + timedelta(days=d - 1)


def from_epoch(seconds):
    """A kernel `now` (time.time(), or GENUS_NOW) -> the instant, truncated to
    the millisecond exactly as `new Date(seconds * 1000)` is."""
    return _from_ms(seconds * 1000)


# ── Layer A — the moment <-> the address ────────────────────────────────────

def moment_to_address(when):
    """UTC moment -> the canonical full-width ten-digit address. The first four
    digits ARE the Gregorian year. Years outside 1000..9999 are out of the
    floor-10 form (year 476 would left-pad into the root underscore chain, and
    year 10000 grows the floor — both correct, neither this century's problem)."""
    when = _utc(when)
    y = when.year
    if y < 1000 or y > 9999:
        raise ValueError('temporal: year %d is outside the floor-10 form (1000..9999)' % y)
    month = when.month - 1                       # 0..11
    dom = when.day                               # 1..31
    sec_of_day = when.hour * 3600 + when.minute * 60 + when.second

    part_s = 86400 / 9                           # 9600 — the gathering
    beat_s = part_s / 9                          # 1066.67 — the beat
    part = math.floor(sec_of_day / part_s)       # 0..8
    beat = math.floor((sec_of_day - part * part_s) / beat_s)  # 0..8

    digits = [
        (y // 1000) % 10,                        # pscale 9 — millennium   (0 is a value)
        (y // 100) % 10,                         # pscale 8 — century      (0 is a value)
        (y // 10) % 10,                          # pscale 7 — decade       (0 is a value)
        y % 10,                                  # pscale 6 — year         (0 is a value)
        month // 3 + 1,                          # pscale 5 — season   1..4
        month % 3 + 1,                           # pscale 4 — month    1..3
        (dom - 1) // 7 + 1,                      # pscale 3 — week     1..5
        (dom - 1) % 7 + 1,                       # pscale 2 — day      1..7
        part + 1,                                # pscale 1 — gathering 1..9
        beat + 1,                                # pscale 0 — beat      1..9
    ]
    return ''.join(str(d) for d in digits)


def _span(start, end, pscale):
    return {'start': start, 'end': end, 'pscale': pscale}


def address_to_span(addr):
    """The address -> the span it names, {start, end, pscale}, [start, end) in
    UTC. A temporal address names a PERIOD, never an instant — which rung it
    stops at is its resolution. Accepts any canonical full-width
    prefix-with-padding ("2026000000" the year, "2026313179" the beat);
    trailing zeros are floor-width padding and stop the walk, exactly as the
    parser reads them."""
    if not isinstance(addr, str) or not re.fullmatch(r'\d{10}', addr):
        raise ValueError('temporal: "%s" is not a canonical full-width floor-10 address' % (addr,))
    d = [int(c) for c in addr]
    # Walk depth = digits before the trailing-zero padding. Base-ten rungs make
    # an interior 0 a real value, so only the TAIL of zeros is padding.
    depth = 10
    while depth > 1 and d[depth - 1] == 0:
        depth -= 1

    y = d[0] * 1000 + d[1] * 100 + d[2] * 10 + d[3]

    # Coarser than the year: widen to the decade / century / millennium.
    if depth <= 3:
        step = [1000, 100, 10][depth - 1]
        base = (y // step) * step
        return _span(_date_utc(base, 0, 1), _date_utc(base + step, 0, 1), 10 - depth)
    if depth == 4:
        return _span(_date_utc(y, 0, 1), _date_utc(y + 1, 0, 1), 6)

    season = d[4] - 1                                          # 0..3
    if depth == 5:
        return _span(_date_utc(y, season * 3, 1), _date_utc(y, season * 3 + 3, 1), 5)
    month = season * 3 + (d[5] - 1)                            # 0..11
    if depth == 6:
        return _span(_date_utc(y, month, 1), _date_utc(y, month + 1, 1), 4)
    band_start = (d[6] - 1) * 7 + 1                            # day-of-month
    if depth == 7:
        # Band 5 is short (1-3 days): clamp to the month boundary — "seven-day
        # bands nest strictly inside a month" (sundial 3.1).
        raw_end = _date_utc(y, month, band_start + 7)
        month_end = _date_utc(y, month + 1, 1)
        return _span(_date_utc(y, month, band_start), min(raw_end, month_end), 3)
    dom = band_start + (d[7] - 1)
    day_start = _ms(_date_utc(y, month, dom))
    if depth == 8:
        return _span(_from_ms(day_start), _from_ms(day_start + 86400000), 2)

    part_s = 9600000.0                                         # ms
    p_start = day_start + (d[8] - 1) * part_s
    if depth == 9:
        return _span(_from_ms(p_start), _from_ms(p_start + part_s), 1)

    beat_s = part_s / 9
    b_start = p_start + (d[9] - 1) * beat_s
    return _span(_from_ms(b_start), _from_ms(b_start + beat_s), 0)


# ── the voicing and the stamp ───────────────────────────────────────────────

def voice_address(addr):
    """The human voicing of an address — the block's job, done in code because
    the ladder is law, not content. "Tuesday 15 July 2026, late afternoon"."""
    span = address_to_span(addr)
    start, pscale = span['start'], span['pscale']
    y = start.year
    if pscale >= 7:
        return 'the %ds' % y
    if pscale == 6:
        return '%d' % y
    if pscale == 5:
        quarter = ['winter-quarter', 'spring-quarter', 'summer-quarter', 'autumn-quarter'][(start.month - 1) // 3]
        return '%s %d' % (quarter, y)
    if pscale == 4:
        return '%s %d' % (MONTHS[start.month - 1], y)
    if pscale == 3:
        return 'the week of %d %s %d' % (start.day, MONTHS[start.month - 1], y)
    day = '%s %d %s %d' % (WEEKDAYS[(start.weekday() + 1) % 7], start.day, MONTHS[start.month - 1], y)
    if pscale == 2:
        return day
    # An interior zero at the gathering digit is malformed (the label gate,
    # parseTemporalLabel, refuses it); the TS prints 'undefined' there and so
    # does this — the port does not invent a refusal the canon lacks.
    g = int(addr[8])
    part = DAY_PARTS[g - 1] if 1 <= g <= 9 else 'undefined'
    if pscale == 1:
        return '%s, %s' % (day, part)
    return '%s, %s (beat %s)' % (day, part, addr[9])


def render_now(now):
    """The now-stamp: the prerequisite the rendering hangs on. One line, every
    envelope. Carries the ISO (canonical), the address (pointable), and the
    human voicing (what the digits mean)."""
    now = _utc(now)
    addr = moment_to_address(now)
    iso = '%04d-%02d-%02dT%02d:%02d:%02dZ' % (now.year, now.month, now.day,
                                              now.hour, now.minute, now.second)
    return 'now · %s · %s · %s' % (iso, addr, voice_address(addr))
