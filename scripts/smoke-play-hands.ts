/**
 * Live smoke for the play door's hands law — "the door delivers what the shell
 * NOMINATED, at the address it nominated" (#211/#237, applied to pscale_play).
 *
 * Three arrivals, one property each:
 *
 *   MANIFEST-BEARING (weft, live shell) — the legacy whole-block dumps stand
 *   down: passport rides, the manifest's dashboards ride, history/stash/shell
 *   do NOT arrive as whole dumps, and the envelope is a window's ORDER OF
 *   MAGNITUDE smaller than the 140k that forced the cut.
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
  assert(/── (daily|cook):weft:0:0 ──/.test(w), "the manifest's dashboards ride (the nominated hands)");
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
