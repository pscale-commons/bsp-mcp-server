/**
 * smoke-grit-tree.ts — the engine spec is a MAP, not a statute book.
 *
 * NHITL round 2, §3: ~6,000 words of engine spec returned in full on every
 * engage, the one-paragraph scene beneath — twenty tool calls bought one
 * in-fiction act. The fix is pure pscale authoring: grit's branches carry
 * their law in one standing underscore and the detail at digit-depth, so
 * renderDirective (which prints only an object branch's underscore) compacts
 * every envelope automatically. This smoke pins that property so the monolith
 * can never quietly regrow.
 *
 *   npm run smoke:grit-tree
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderDirective } from '../src/tools/pool.js';

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

console.log('\n=== the map, not the monolith ===');
const branches = Object.keys(grit).filter((k) => k !== '_');
check('every branch is an object with a standing underscore', branches.every((b) => typeof grit[b] === 'object' && typeof grit[b]._ === 'string' && grit[b]._.length > 40));
const inline = renderDirective(grit);
const words = inline.split(/\s+/).length;
check(`envelope-inline stays under 800 words (now ${words}; the monolith was ~4,100)`, words < 800);
check('the head teaches the walk (bsp spindle into grit)', /walk it: bsp\(/.test(inline) || /spindle='<branch>'/.test(inline));

console.log('\n=== no law was lost — spot the load-bearing rules at their addresses ===');
const at = (path: string): string => {
  let n: any = grit;
  for (const d of path.split('.')) n = n?.[d];
  return typeof n === 'string' ? n : n?._ ?? '';
};
check('two grains live at 1.1.1', /HERE NOW/.test(at('1.1.1')) && /ABOUT/.test(at('1.1.1')));
check('name-earning lives at 1.1.4', /spoken aloud/.test(at('1.1.4')));
check('absence-renders-as-absence lives at 1.2.2', /ABSENCE RENDERS AS ABSENCE/.test(at('1.2.2')));
check('first-staged stamp lives at 1.3.1', /FIRST-STAGED/i.test(at('1.3.1')) && /position 2/.test(at('1.3.1')));
check('speech-verbatim lives at 1.4 head', /verbatim/.test(at('1.4')));
check('half-commit lives at 1.4.2', /never author them answering/i.test(at('1.4.2')));
check('four-step move lives at 1.5 head', /four steps/i.test(at('1.5')));
check('the vertical move lives at 1.5.2', /zoom-out AND fast-forward/.test(at('1.5.2')));
check('contest-needs-here-now lives at 1.6', /HERE NOW/.test(at('1.6')));
check('one-now + dueness live at 2.5', /SPAN has passed/.test(at('2.5')) && /sundial/.test(at('2.5')) && /DETERMINER/.test(at('2.5')));
check('bite lives at 2.4', /BITE/.test(at('2.4')));
check('lent-turn limits live at 4.2', /one lent turn per engagement/.test(at('4.2')));
check('the grain ladder lives at branch 6', /town and the day/.test(at('6')) && /sundial/.test(at('6')));
check('the host split lives at branch 1 head', /seat itself standing as player/.test(at('1')));

console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
if (fail > 0) process.exit(1);
