/**
 * Live smoke for the play door's hands law — "the door delivers what the shell
 * NOMINATED, at the address it nominated" (#211/#237, applied to pscale_play).
 *
 * Three arrivals, one property each:
 *
 *   MANIFEST-BEARING (weft, live shell) — the legacy whole-block dumps stand
 *   down: passport rides, the manifest's dashboards ride, history/stash/shell
 *   do NOT arrive as whole dumps, and the envelope is a window's ORDER OF
 *   MAGNITUDE smaller than the 140k that forced the cut. Which dashboards is
 *   read off the live manifest at run time — a living shell re-dials, and the
 *   law is that what it nominates rides, never that two named refs do.
 *
 *   MANIFEST-LESS (probe handle with passport + history, no shell) — byte-for-
 *   byte the legacy behaviour: history arrives whole, exactly as characters
 *   and thin handles always got.
 *
 *   FRESH (no blocks) — still fresh.
 *
 * Writes a throwaway probe handle's blocks and wipes them after.
 * Run: npx tsx scripts/smoke-play-hands.ts
 */
import { handlePlay } from '../src/tools/play.js';
import { saveBlock } from '../src/db.js';

const BEACH = process.env.SPOOL_BEACH ?? 'https://beach.happyseaurchin.com';
const PROBE = 'play-probe';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

async function play(handle: string): Promise<string> {
  const r = await handlePlay({ world: BEACH, handle, room: 'meeting-check' } as any);
  return r?.content?.[0]?.text ?? '';
}

/** The refs a shell's manifest nominates, read at its address (shell:<handle> 3)
 *  and told apart the way the door tells them (play.ts, THE HANDS LAW): a slot
 *  is a ref when it is, or voices, a name:address with no whitespace in it —
 *  the roster is prose and nominates nothing. */
async function nominated(handle: string): Promise<string[]> {
  const r = await fetch(`${BEACH}/.well-known/pscale-beach?block=shell:${handle}&spindle=3`);
  const m = r.ok ? await r.json() : null;
  if (!m || typeof m !== 'object') return [];
  return Object.keys(m).filter((k) => k !== '_')
    .map((k) => (typeof m[k] === 'string' ? m[k] : m[k]?._))
    .filter((ref): ref is string => typeof ref === 'string' && ref.includes(':') && !/\s/.test(ref));
}

async function wipe(block: string) {
  await fetch(`${BEACH}/.well-known/pscale-beach`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ block, confirm: true }),
  }).catch(() => {});
}

(async () => {
  console.log(`\nplay-door hands law — live against ${BEACH}\n`);

  console.log('a manifest-bearing shell (weft):');
  const w = await play('weft');
  assert(w.length < 30_000, `the arrival is a window, not a dump (${w.length} chars; was ~140k)`);
  assert(w.includes('── passport:weft ──'), 'the passport rides (identity + location)');
  assert(!w.includes('── history:weft ──'), 'history does NOT arrive as a whole dump');
  assert(!w.includes('── stash:weft ──'), 'stash does NOT arrive as a whole dump');
  assert(!w.includes('── shell:weft ──'), 'the shell itself does NOT arrive as a whole dump');
  // The hands are read off the LIVE manifest, never remembered. This line named
  // daily:weft:0:0 and cook:weft:0:0 — what weft dialed the week the law landed —
  // and went red at weft's re-dial of 2026-09-10, the door all the while
  // delivering every hand the manifest nominated, at the address it nominated.
  // A ref named NOT riding is the door dropping a hand, or the manifest
  // nominating what is not there (the door skips a ref that compiles to
  // nothing) — a finding either way, and the label says which ref.
  const hands = await nominated('weft');
  const unridden = hands.filter((ref) => !w.includes(`── ${ref} ──`));
  assert(hands.length > 0, `weft's shell still nominates — the premise of this arrival (${hands.length} refs at shell:weft 3)`);
  assert(hands.length > 0 && unridden.length === 0,
    `every hand the manifest nominates rides, at the address it nominated (${hands.join(' · ')})${unridden.length ? ` — NOT riding: ${unridden.join(' · ')}` : ''}`);
  assert(w.includes('handle kind: character') || w.includes('handle kind: user / agent'), 'kind still reads from the probes');

  console.log('\na manifest-less handle keeps the legacy six (probe):');
  await saveBlock(BEACH, `passport:${PROBE}`, { _: 'PROBE passport for the play-door smoke. Delete after.' } as any, { spindle: '' });
  await saveBlock(BEACH, `history:${PROBE}`, { _: 'PROBE history.', 1: 'One recorded thing.' } as any, { spindle: '' });
  const p = await play(PROBE);
  assert(p.includes(`── passport:${PROBE} ──`), 'passport rides');
  assert(p.includes(`── history:${PROBE} ──`), 'history rides WHOLE — the legacy path is byte-identical');
  assert(p.includes('handle kind: character'), 'kind unchanged for a passport-bearing handle');

  console.log('\na fresh handle is still fresh:');
  const f = await play('play-probe-fresh');
  assert(/fresh handle|no blocks/i.test(f) || f.includes('genesis') || f.includes('GATE'), 'fresh arrival unchanged (fresh note, gate, or genesis passage)');

  for (const b of [`passport:${PROBE}`, `history:${PROBE}`]) await wipe(b);

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
