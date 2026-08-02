/**
 * probe-author-door.ts — the doorway's four routes, proven against the live beach.
 *
 * The author's door (play.ts 1a-bis) must fire on EMPTINESS only. Three surfaces
 * that look empty-ish in different ways must each keep their existing behaviour:
 * a canon scenario (caught by its lighthouse first), a table or played world (has
 * spatial/pools), and the apex commons (pools and passports, but no spatial at all).
 * Getting the predicate wrong here sends a player to author a world they were trying
 * to walk into — the mirror of the bug this door fixes.
 *
 *   npx tsx scripts/probe-author-door.ts
 *
 * READ-ONLY — no writes to any beach. Needs network (reads beach.happyseaurchin.com).
 */
import { handlePlay } from '../src/tools/play.js';

type Route = 'AUTHOR-DOOR' | 'canon-signage' | 'character-gate' | 'normal-entry';

const CASES: { label: string; world: string; handle: string; expect: Route }[] = [
  {
    label: 'EMPTY world — never written, no blocks of any kind',
    world: 'https://beach.happyseaurchin.com/w/probe-empty-zzq',
    handle: 'someone',
    expect: 'AUTHOR-DOOR',
  },
  {
    label: 'CANON scenario — brackenfoot, lighthouse 9.3 says canon',
    world: 'https://beach.happyseaurchin.com/w/brackenfoot',
    handle: 'someone',
    expect: 'canon-signage',
  },
  {
    label: 'CANON scenario — the-reaper, upgraded 2026-08-02',
    world: 'https://beach.happyseaurchin.com/w/the-reaper',
    handle: 'Ayush',
    expect: 'canon-signage',
  },
  {
    label: 'TABLE — the-reaper-ayush, characters + pools + its own spatial',
    world: 'https://beach.happyseaurchin.com/w/the-reaper-ayush',
    handle: 'Ayush',
    expect: 'normal-entry',
  },
  {
    label: 'APEX commons — pools and passports, but no spatial:',
    world: 'https://beach.happyseaurchin.com',
    handle: 'weft',
    expect: 'normal-entry',
  },
  // BARE NAMES — "play the-reaper" is the sentence a friend actually says, and it must
  // land on the same surface the full URL does. A bare name that silently resolves to
  // the apex would hand an invited player the commons gate and let them create a
  // character there, which is the worst reachable outcome of an invitation.
  {
    label: 'BARE NAME — "the-reaper" via the worlds register',
    world: 'the-reaper',
    handle: 'sam',
    expect: 'canon-signage',
  },
  {
    label: 'BARE NAME — "brackenfoot" via the worlds register',
    world: 'brackenfoot',
    handle: 'sam',
    expect: 'canon-signage',
  },
];

function classify(text: string): Route {
  if (/is EMPTY — there is nowhere here/.test(text)) return 'AUTHOR-DOOR';
  if (/is a SCENARIO \(canon\)/.test(text)) return 'canon-signage';
  if (/stand at the GATE/.test(text)) return 'character-gate';
  return 'normal-entry';
}

let failed = 0;
for (const c of CASES) {
  const r = await handlePlay({ world: c.world, handle: c.handle });
  const text = r.content[0].text;
  const got = classify(text);
  const ok = got === c.expect;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${got.padEnd(14)} ${c.label}`);
  if (!ok) console.log(`    expected ${c.expect}; first line: ${text.split('\n')[0].slice(0, 120)}`);
}

console.log(failed === 0 ? `\nAll ${CASES.length} routes correct.` : `\n${failed} route(s) wrong.`);
process.exit(failed === 0 ? 0 : 1);
