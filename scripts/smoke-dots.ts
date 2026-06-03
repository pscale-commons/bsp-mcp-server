/**
 * smoke-dots.ts — single-decimal discipline guard for the bundled sentinel blocks.
 *
 * Pscale addresses carry at most ONE decimal point (sunstone:1.5). The discipline
 * erodes across sessions: the multi-dot refs PR #60 cleaned were *reintroduced*
 * on 2026-05-28 by a supernest commit, under the same identity that had purged
 * them earlier. This guard ratchets against that — it fails if any bundled block
 * carries a multi-dot pscale ref (digit.digit.digit) outside a small allow-list.
 *
 * SCOPE: guards every bundled sentinel block. Only bsp-test.json is excluded —
 * it is a test battery that legitimately carries malformed multi-dot inputs. The
 * 22 legacy multi-dot refs that once sat in block-conventions / manifest /
 * protocol-paywall were scrubbed to single-dot canonical (2026-06-04), so those
 * blocks are now guarded along with the rest.
 *
 * Run: npm run smoke:dots
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

// digit.digit.digit (or longer) — the forbidden multi-dot pscale form.
const MULTI_DOT = /[0-9]+\.[0-9]+\.[0-9]+/g;

// Tokens that are NOT pscale addresses (legitimate, allowed anywhere).
const ALLOW = new Set<string>([
  '1.2.3', // the canonical "pre-bsp notation" teaching example (sunstone:1.55, whetstone:1.35)
  '0.2.0', // server semver (directory.json — version alignment note)
  '0.4.0', // server semver (directory.json)
]);

// Files excluded from the scan. bsp-test.json is a test battery that
// legitimately carries malformed multi-dot inputs; everything else is guarded.
const EXCLUDE: Record<string, string> = {
  'bsp-test.json': 'test battery — legitimately contains malformed multi-dot inputs',
};

const files = readdirSync(SRC).filter((f) => f.endsWith('.json'));
const violations: { file: string; token: string }[] = [];
const scanned: string[] = [];

for (const f of files) {
  if (f in EXCLUDE) continue;
  scanned.push(f);
  const text = readFileSync(join(SRC, f), 'utf8');
  for (const m of text.matchAll(MULTI_DOT)) {
    const token = m[0];
    if (!ALLOW.has(token)) violations.push({ file: f, token });
  }
}

console.log(`smoke-dots: scanned ${scanned.length} bundled blocks; allow-list {${[...ALLOW].join(', ')}}`);
console.log(`  excluded (test fixtures): ${Object.keys(EXCLUDE).join(', ')}`);

if (violations.length) {
  console.error(`\n✗ ${violations.length} multi-dot pscale ref(s) — use single-dot canonical (sunstone:1.5):`);
  for (const v of violations) console.error(`    ${v.file}: "${v.token}"  → write it single-dot (e.g. "1.6.3" → "1.63")`);
  process.exit(1);
}

console.log(`\n✓ no stray multi-dot refs in the guarded blocks`);
process.exit(0);
