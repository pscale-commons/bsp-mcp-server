/**
 * smoke-play-live.ts — exercise pscale_play against the LIVE thornwood sub-beach.
 * Verifies the no-fiddle entry: resolve world → engage room → directive + scene
 * inlined → handle context bundled → origin pinned. Read-only; touches nothing.
 *
 *   npx tsx scripts/smoke-play-live.ts
 */
import { handlePlay } from '../src/tools/play.js';

async function main() {
  const r = await handlePlay({ world: 'thornwood', handle: 'anya' });
  const t = r.content[0].text;
  console.log('────── pscale_play(world="thornwood", handle="anya") ──────\n');
  console.log(t.slice(0, 3200));
  if (t.length > 3200) console.log(`\n… [${t.length - 3200} more chars]`);

  const checks: [string, boolean][] = [
    ['pins the thornwood sub-beach URL', /thornwood\.beach\.happyseaurchin\.com/.test(t)],
    ['operating directive inlined', /# Operating directive/.test(t)],
    ['per-actor dice live in directive', /PER ACTOR|per actor/.test(t)],
    ['the inn scene present (cyrus/bram)', /\b(bram|cyrus|Beaten Drum)\b/i.test(t)],
    ["anya's own context bundled", /(passport:anya|witnessed:anya)/.test(t)],
    ['inferred kind = character', /handle kind: character/.test(t)],
    ['no Maren / Thornkeep leak', !/maren|thornkeep|grenn/i.test(t)],
  ];
  console.log('\n═══ assertions ═══');
  let pass = 0;
  for (const [name, ok] of checks) { console.log(`${ok ? '✓' : '✗'}  ${name}`); if (ok) pass++; }
  console.log(`\n${pass}/${checks.length} passed`);
  process.exitCode = pass === checks.length ? 0 : 1;
}
main().catch((e) => { console.error('[smoke-play] ERROR', e?.stack || e); process.exitCode = 1; });
