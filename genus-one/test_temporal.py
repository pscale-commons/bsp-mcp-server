#!/usr/bin/env python3
"""test_temporal.py — the sundial's arithmetic in Python, proved against the
same cases scripts/smoke-temporal.ts proves the TypeScript with (addresses and
voicings), plus the sundial's own worked ladder (pscale://sundial 3.5) and the
pulse's own path (epoch seconds -> the stamp — the parity fixture's pinned
instant among them). Every expected string was cross-checked against the
TypeScript's output for the same input before it was written here.

Run: python3 genus-one/test_temporal.py
"""

import os
import re
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import temporal  # noqa: E402
from temporal import (  # noqa: E402
    TEMPORAL_FLOOR, address_to_span, from_epoch, moment_to_address, render_now, voice_address,
)

PASS = 0
FAIL = 0


def ok(name, cond, detail=''):
    global PASS, FAIL
    if cond:
        PASS += 1
        print('  ✓ %s' % name)
    else:
        FAIL += 1
        print('  ✗ %s%s' % (name, (' — ' + detail) if detail else ''))


def eq(name, got, want):
    ok(name, got == want, 'got %r, want %r' % (got, want))


def utc(iso):
    """'2026-07-15T18:30:00Z' -> an aware UTC datetime (no fromisoformat-with-Z
    before 3.11)."""
    return datetime.strptime(iso, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)


print("\nTHE GREGORIAN YEAR IS THE ADDRESS — no epoch")
t = utc('2026-07-15T18:30:00Z')
addr = moment_to_address(t)
eq('2026-07-15 18:30 UTC → 2026313179', addr, '2026313179')
eq('the first four digits ARE the year', addr[:4], '2026')
eq('floor 10 — ten rungs, ten digits', len(addr), TEMPORAL_FLOOR)
eq('and it voices itself', voice_address(addr), 'Wednesday 15 July 2026, late afternoon (beat 9)')

print('\nROUND TRIP — the address names a span that contains its moment')
for iso in ['2026-07-15T18:30:00Z', '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z',
            '2020-02-29T12:00:00Z', '1999-12-31T23:59:00Z', '2100-06-15T06:00:00Z']:
    d = utc(iso)
    a = moment_to_address(d)
    span = address_to_span(a)
    ok('%s → %s → span contains it' % (iso, a), span['start'] <= d < span['end'],
       'span %s..%s' % (span['start'].isoformat(), span['end'].isoformat()))

print('\nCOARSE FORMS — trailing zeros are floor-width padding')
eq('2026000000 is the year 2026 (pscale 6)', address_to_span('2026000000')['pscale'], 6)
eq('  …and voices as the year', voice_address('2026000000'), '2026')
eq('2026310000 is July 2026 (pscale 4)', address_to_span('2026310000')['pscale'], 4)
eq('  …and voices as the month', voice_address('2026310000'), 'July 2026')
eq('2000000000 is the millennium (pscale 9)', address_to_span('2000000000')['pscale'], 9)
eq('  …and voices as the 2000s', voice_address('2000000000'), 'the 2000s')
eq('2100000000 is the century (pscale 8)', address_to_span('2100000000')['pscale'], 8)
eq('2020000000 is the decade (pscale 7)', address_to_span('2020000000')['pscale'], 7)

print('\nTHE WART — a year ending in 0 has no distinct coarse address')
ok('2020000000 reads as the DECADE, not the year 2020 (0-rung: the container speaks)',
   address_to_span('2020000000')['pscale'] == 7)
leap = moment_to_address(utc('2020-02-29T12:00:00Z'))
ok('…but a full-precision moment in 2020 is unambiguous (analogue rungs never emit 0)',
   re.fullmatch(r'2020[1-9]{6}', leap) is not None, leap)
eq('  …and it is the one the TypeScript emits', leap, '2020125155')

print('\nFULL WIDTH IS THE CANONICAL FORM (the earth lesson)')
try:
    address_to_span('2026')
    refused = False
except ValueError:
    refused = True
ok('a short dotless form is refused — it would left-pad into the root underscore chain', refused)

print('\nTHE STAMP')
stamp = render_now(utc('2026-07-15T18:30:00Z'))
print('  %s' % stamp)
eq('the stamp carries ISO, address, and voicing', stamp,
   'now · 2026-07-15T18:30:00Z · 2026313179 · Wednesday 15 July 2026, late afternoon (beat 9)')

print("\nTHE LADDER VOICED — the sundial's worked example (3.5), rung by rung")
eq('2026323448 — the beat', voice_address('2026323448'), 'Tuesday 18 August 2026, morning (beat 8)')
eq('2026323440 — the gathering', voice_address('2026323440'), 'Tuesday 18 August 2026, morning')
eq('2026323400 — the day', voice_address('2026323400'), 'Tuesday 18 August 2026')
eq('2026323000 — the week-band', voice_address('2026323000'), 'the week of 15 August 2026')
eq('2026300000 — the season', voice_address('2026300000'), 'summer-quarter 2026')
eq('2026245000 — a short band 5 clamps to the month (sundial 3.1)',
   address_to_span('2026245000')['end'], utc('2026-08-01T00:00:00Z'))

print("\nTHE PULSE'S OWN NOW — epoch seconds to the stamp (sundial 8.2)")
fixture = 'now · 2026-07-02T13:46:40Z · 2026311262 · Thursday 2 July 2026, afternoon (beat 2)'
eq("the parity fixture's pinned instant (GENUS_NOW=1783000000)", render_now(from_epoch(1783000000)), fixture)
eq('fractional seconds truncate as new Date(s * 1000) does', render_now(from_epoch(1783000000.5)), fixture)
eq('a naive datetime reads as UTC', render_now(datetime(2026, 7, 15, 18, 30)),
   'now · 2026-07-15T18:30:00Z · 2026313179 · Wednesday 15 July 2026, late afternoon (beat 9)')
plus_one = datetime(2026, 7, 15, 19, 30, tzinfo=timezone(timedelta(hours=1)))
eq('an aware non-UTC datetime is read as its instant', moment_to_address(plus_one), '2026313179')

print('\nBOUNDARIES — the digit flips exactly where the rung does')
eq('02:39:59 is the last beat of the first gathering', moment_to_address(utc('2026-03-01T02:39:59Z')), '2026131119')
eq('02:40:00 is the first beat of the second', moment_to_address(utc('2026-03-01T02:40:00Z')), '2026131121')
eq("the millennium's last minute", render_now(utc('1999-12-31T23:59:00Z')),
   'now · 1999-12-31T23:59:00Z · 1999435399 · Friday 31 December 1999, night (beat 9)')
try:
    moment_to_address(utc('0476-01-01T00:00:00Z'))
    out_of_form = False
except ValueError:
    out_of_form = True
ok('year 476 is outside the floor-10 form and says so', out_of_form)

print('\n%d passed, %d failed\n' % (PASS, FAIL))
sys.exit(1 if FAIL else 0)
