/**
 * smoke-play-split.ts — the presence-grain cast split (proposal 2026-07-15 §7).
 *
 * splitCast is the one testable seam of the liveness rule: HERE NOW inside the
 * live window, ABOUT outside it or with no signal at all. Pure function — no
 * beach, no clock, no I/O.
 *
 *   npm run smoke:play-split
 */
import { splitCast, LIVE_WINDOW_MS, CastEntry } from '../src/tools/play.js';

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

const NOW = 1_800_000_000_000; // fixed clock — the split takes `now` as an argument
const e = (handle: string, lastSignal: number | null): CastEntry => ({ handle, appearance: `the figure of ${handle}`, lastSignal });

console.log('=== splitCast — presence has resolution ===');

{
  const { here, about } = splitCast([], NOW);
  check('empty cast → empty both', here.length === 0 && about.length === 0);
}
{
  // The anya/cyrus case: seeded five weeks ago, never played — ABOUT, never mute-live.
  const fiveWeeks = NOW - 35 * 24 * 60 * 60 * 1000;
  const { here, about } = splitCast([e('anya', fiveWeeks), e('cyrus', fiveWeeks)], NOW);
  check('stale seeds land ABOUT', here.length === 0 && about.length === 2);
}
{
  // No signal at all (fresh passport, nothing staged/committed) — ABOUT.
  const { here, about } = splitCast([e('ghost', null)], NOW);
  check('no signal → ABOUT', here.length === 0 && about.length === 1);
}
{
  // A commit two minutes ago — HERE NOW.
  const { here, about } = splitCast([e('maren', NOW - 2 * 60 * 1000)], NOW);
  check('fresh signal → HERE NOW', here.length === 1 && about.length === 0);
}
{
  // Boundary: exactly at the window edge is HERE NOW; one ms past is ABOUT.
  const edge = splitCast([e('a', NOW - LIVE_WINDOW_MS)], NOW);
  const past = splitCast([e('b', NOW - LIVE_WINDOW_MS - 1)], NOW);
  check('window edge inclusive', edge.here.length === 1);
  check('one past the window → ABOUT', past.about.length === 1);
}
{
  // Mixed room: one live player among stale seeds — split, order preserved within groups.
  const { here, about } = splitCast(
    [e('anya', NOW - 40 * 24 * 60 * 60 * 1000), e('newcomer', NOW - 60 * 1000), e('fenn', null)],
    NOW,
  );
  check('mixed room splits', here.length === 1 && about.length === 2);
  check('the live one is the newcomer', here[0]?.handle === 'newcomer');
  check('appearance carried through', here[0]?.appearance === 'the figure of newcomer');
}

console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
if (fail > 0) process.exit(1);
