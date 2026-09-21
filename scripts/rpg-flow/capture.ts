/**
 * rpg-flow/capture.ts — compose the RPG's real windows for ONE character at ONE live
 * table, read-only, and save them as text: the door (pscale_play), a turn (an engage
 * with a marker), make it happen (tier medium), the telling (tier soft) and the keeper
 * (tier hard, which carries the sheet call). Nothing is staged, committed or spent.
 *
 *   npx tsx scripts/rpg-flow/capture.ts <table-url> <room> <handle> <out-dir> [soft-since]
 *   e.g. … https://beach.happyseaurchin.com/w/brackenfoot-open 120 Ugarth /tmp/flow 7
 *
 * soft-since is the beat the telling starts after (the soft tier declines when the
 * account already covers the newest beat, so name the one before it).
 * Then: python3 scripts/rpg-flow/build.py <out-dir> <handle> <table-name> <room>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { handlePlay } from '../../src/tools/play.js';
import { composeTier } from '../../src/tools/tiers.js';
import { handlePoolEngage } from '../../src/tools/pool.js';

const [table, room, handle, out, softSince] = process.argv.slice(2);
if (!table || !room || !handle || !out) { console.error('usage: capture.ts <table-url> <room> <handle> <out-dir> [soft-since]'); process.exit(1); }
(async () => {
  mkdirSync(out, { recursive: true });
  const text = (r: any) => r?.content?.[0]?.text ?? '';
  writeFileSync(`${out}/door.txt`, text(await handlePlay({ world: table, handle } as any)));
  writeFileSync(`${out}/turn.txt`, text(await handlePoolEngage({ agent_id: handle, pool_url: table, pool_name: room, since_position: 9999 } as any)));
  writeFileSync(`${out}/medium.txt`, await composeTier('medium', table, room, handle));
  writeFileSync(`${out}/soft.txt`, await composeTier('soft', table, room, handle, Number(softSince ?? 0)));
  writeFileSync(`${out}/hard.txt`, await composeTier('hard', table, room, handle));
  console.log(`captured five windows for ${handle} at pool:${room} → ${out}`);
})();
