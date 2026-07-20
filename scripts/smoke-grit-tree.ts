/**
 * smoke-grit-tree.ts — directive delivery is a FRAMED SPINDLE READ; the engine
 * spec stays spine-legal, complete at its addresses, and selectable by aperture.
 *
 * History, because each invariant here was bought by a measured failure:
 *  · NHITL round 2 (§3): a ~6,000-word monolith returned on EVERY engage — the
 *    one-paragraph scene drowned; twenty tool calls bought one act. Cure: the
 *    map render (branch underscores only) + marker-aware delivery (full text at
 *    first engage only, pointer after).
 *  · 2026-07-19: the map render's hidden cost surfaced — law authored at depth
 *    was INVISIBLE instruction (brackenfoot genesis told seats to stage while
 *    the staging law was never delivered), and blocks grew "walk 1.1" pointers
 *    to compensate — a smell, since a path-walk already self-contextualises
 *    (sunstone:8.51).
 *  · 2026-07-20 A/B (two live tables, one line of data apart, two blind seats
 *    each, local handlers): whole-engine mount 2,747 words vs character-turn
 *    aperture 1,566 framed by the root walk. Both arms completed the cold open
 *    with ZERO extra directive walks; the aperture arm used fewer calls (17/18
 *    vs 19/20) with no missing-law improvisation. Delivery is now the real bsp
 *    shape path-walk+descent run to leaves; SELECTION is authored in the pool's
 *    underscore (pscale:grit, or pscale:grit/1 for one aperture).
 *
 * What this pins: the delivered text carries every load-bearing law AT ITS
 * ADDRESS (nothing invisible); an aperture arrives FRAMED by its ancestors and
 * genuinely selects (no foreign branches, bounded size); every emitted address
 * is canonical single-decimal; and the mount law lives in grit's own root, as
 * data. The old <800-word flat-map bound is retired WITH its render.
 *
 *   npm run smoke:grit-tree
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderDirective } from '../src/tools/pool.js';
import { parseSpindle, formatAddress, floorDepth } from '../src/bsp.js';

const grit = JSON.parse(readFileSync(fileURLToPath(new URL('../src/grit.json', import.meta.url)), 'utf8'));

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

console.log('=== spine ===');
const badKeys: string[] = [];
(function walk(n: any, p: string) {
  if (n && typeof n === 'object' && !Array.isArray(n)) {
    for (const k of Object.keys(n)) {
      if (k !== '_' && !/^[1-9]$/.test(k)) badKeys.push(`${p}/${k}`);
      walk(n[k], `${p}/${k}`);
    }
  }
})(grit, '');
check('spine-legal — only _ and 1-9 at every level', badKeys.length === 0, badKeys.join(', '));

console.log('\n=== every branch stands on its own underscore ===');
const branches = Object.keys(grit).filter((k) => k !== '_');
check('every branch is an object with a standing underscore', branches.every((b) => typeof grit[b] === 'object' && typeof grit[b]._ === 'string' && grit[b]._.length > 40));

console.log('\n=== whole delivery — nothing load-bearing is invisible ===');
const whole = renderDirective(grit);
const laws: [string, RegExp][] = [
  ['two grains delivered at [1.11]', /\[1\.11\][^\n]*HERE NOW[^\n]*/],
  ['name-earning delivered at [1.14]', /\[1\.14\][^\n]*spoken aloud/],
  ['absence-as-absence delivered at [1.22]', /\[1\.22\][^\n]*ABSENCE RENDERS AS ABSENCE/],
  ['first-staged stamp delivered at [1.31]', /\[1\.31\][^\n]*FIRST-STAGED/i],
  ['speech-verbatim delivered at [1.4]', /\[1\.4\][^\n]*verbatim/],
  ['four-step move delivered at [1.5]', /\[1\.5\][^\n]*four steps/i],
  ['vertical move delivered at [1.52]', /\[1\.52\][^\n]*zoom-out AND fast-forward/],
  ['resolver claim delivered at [2.6]', /\[2\.6\][^\n]*resolves_window/],
];
for (const [name, re] of laws) check(name, re.test(whole));

console.log('\n=== every emitted address is canonical ===');
const addrs = [...whole.matchAll(/^\s*\[([0-9.]+)\]/gm)].map((m) => m[1]);
const floor = floorDepth(grit);
const badAddr = addrs.filter((a) => {
  try { return formatAddress(parseSpindle(a, floor).digits, floor) !== a; } catch { return true; }
});
check(`all ${addrs.length} addresses round-trip the parser at floor ${floor}`, addrs.length > 30 && badAddr.length === 0, badAddr.slice(0, 5).join(', '));
check('no multi-dot address leaks', addrs.every((a) => (a.match(/\./g) ?? []).length <= 1));

console.log('\n=== aperture delivery — framed, selective, bounded ===');
const ap = renderDirective(grit['1'], { floor, base: ['1'], frame: [grit._] });
check('the root frame arrives above the aperture (verbs defined at the general end)', /STAGE overwrites/.test(ap) && /COMMIT appends/.test(ap));
check('the aperture subtree arrives whole at true addresses', /\[1\.11\]/.test(ap) && /\[1\.6\]/.test(ap));
const apWords = ap.split(/\s+/).length;
check(`aperture stays bounded (now ${apWords}; measured 1,566 on 2026-07-20; the monolith was ~4,100)`, apWords < 2200);
check('selection is real — the resolver branch is NOT in the /1 aperture', !/\[2\.1\]/.test(ap) && !/ONE NOW, ACROSS TIME AND GRAIN/.test(ap));

console.log('\n=== the mount law lives in data ===');
check("grit's root teaches aperture mounting (pscale:grit/1)", /pscale:grit\/1/.test(grit._));
check("grit's root teaches address-reach beyond the aperture", /spindle='<address>'/.test(grit._));

console.log('\n=== summary ===');
console.log(`  pass: ${pass}`);
console.log(`  fail: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
