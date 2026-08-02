/**
 * table-fork.ts — copy a surface's blocks to a table, verbatim.
 *
 * The Author act of world-genome:1.3 (the frozen-copy path), done by code so it cannot
 * drift: every block is read WHOLE and written unchanged. No summarising, no reshaping,
 * no locks carried — a private table needs none, and the references inside the blocks
 * are by block-name, so a faithful copy needs no rewriting.
 *
 *   npx tsx scripts/table-fork.ts --from <origin> --to <origin> [--skip a,b] [--only a,b]
 *   npx tsx scripts/table-fork.ts --from ... --to ... --verify      # compare, write nothing
 *
 * The lighthouse is never copied (a table carrying canon's sign sends its own players
 * away) — pass it in --only deliberately if that is genuinely wanted.
 */
import { loadBlock, saveBlock } from '../src/db.js';
import { beachIndex } from '../src/tools/pool.js';
import type { Block } from '../src/bsp.js';

const arg = (n: string): string | null => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : null;
};
const FROM = arg('from');
const TO = arg('to');
const VERIFY = process.argv.includes('--verify');
const SKIP = new Set((arg('skip') ?? 'lighthouse').split(',').map((s) => s.trim()).filter(Boolean));
const ONLY = (arg('only') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

if (!FROM || !TO) {
  console.error('need --from <origin> --to <origin>');
  process.exit(2);
}

const names = ONLY.length ? ONLY : (await beachIndex(FROM)).filter((n) => !SKIP.has(n));
if (!names.length) {
  console.error(`nothing to copy from ${FROM}`);
  process.exit(1);
}
console.log(`${VERIFY ? 'VERIFY' : 'COPY'} ${names.length} block(s)\n  from ${FROM}\n  to   ${TO}\n`);

let bad = 0;
for (const name of names) {
  const src = await loadBlock(FROM, name);
  if (!src?.block) { console.log(`✗ ${name} — unreadable at source`); bad++; continue; }
  if (VERIFY) {
    const dst = await loadBlock(TO, name);
    const same = JSON.stringify(dst?.block ?? null) === JSON.stringify(src.block);
    if (!same) bad++;
    console.log(`${same ? '✓' : '✗'} ${name}${same ? '' : dst?.block ? ' — DIFFERS' : ' — MISSING'}`);
    continue;
  }
  try {
    await saveBlock(TO, name, src.block as Block, {});
    console.log(`✓ ${name}`);
  } catch (e: any) {
    console.log(`✗ ${name} — ${e?.message ?? e}`);
    bad++;
  }
}
console.log(bad === 0 ? `\nAll ${names.length} ${VERIFY ? 'match' : 'copied'}.` : `\n${bad} failed.`);
process.exit(bad === 0 ? 0 : 1);
