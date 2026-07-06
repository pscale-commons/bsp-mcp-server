/**
 * smoke-genus-live.ts — pscale_genus against the LIVE beach (read-only).
 *
 * Composes the wake window of a real instance over the wire (the tool's own
 * path: ordered parse of the raw response text, teaching from the sentinel
 * registry, role-with-handle names) and, when python3 is present, diffs it
 * byte-for-byte against `kernel.py --compose-only` run against the same
 * beach with the same pinned clock. Also exercises the tool handler in
 * ghost mode. No writes anywhere.
 *
 * Run: npm run smoke:genus-live
 *   GENUS_BEACH / GENUS_HANDLE override the target (default: egg-one at the
 *   default beach). Beach writes landing between the two reads can skew the
 *   diff — rerun if a live mismatch looks content-shaped, investigate if it
 *   looks structural.
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { genusCompose, wireStore } from '../src/genus.js';
import { handleGenus } from '../src/tools/genus.js';
import { SENTINELS } from '../src/sentinels.js';
import { toPNode, type PNode } from '../src/genus.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KERNEL = path.join(HERE, '..', 'genus-one', 'kernel.py');
const BEACH = (process.env.GENUS_BEACH || process.env.DEFAULT_BEACH || 'https://beach.happyseaurchin.com').replace(/\/+$/, '');
const HANDLE = process.env.GENUS_HANDLE || 'egg-one';

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function firstDiff(a: string, b: string): string {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return `char ${i}: ts …${JSON.stringify(a.slice(Math.max(0, i - 30), i + 30))}… vs py …${JSON.stringify(b.slice(Math.max(0, i - 30), i + 30))}…`;
  }
  return `lengths ts=${a.length} py=${b.length}`;
}

(async () => {
  console.log(`— live compose: ${HANDLE} at ${BEACH} —`);
  const now = Math.floor(Date.now() / 1000);
  const teaching = new Map<string, PNode>();
  for (const s of SENTINELS) teaching.set(s.name, toPNode(s.json));
  const store = wireStore(BEACH, HANDLE, undefined, teaching);
  const w = await genusCompose(store.load, now);
  check('window composed over the wire', w.system.length > 1000 && w.message.length > 10, `system ${w.system.length} message ${w.message.length}`);
  check('system opens with the recipe', w.system.startsWith('{\n  "recipe":'));

  try {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'genus-live-'));
    execFileSync('python3', [KERNEL, '--compose-only'], {
      env: { ...process.env, GENUS_AGENT: tmp, GENUS_BEACH: BEACH, GENUS_HANDLE: HANDLE, GENUS_NOW: String(now) },
      stdio: 'pipe',
    });
    const strips = fs.readdirSync(path.join(tmp, 'filmstrip')).sort();
    const frame = JSON.parse(fs.readFileSync(path.join(tmp, 'filmstrip', strips[strips.length - 1]), 'utf8'));
    fs.rmSync(tmp, { recursive: true, force: true });
    check('system byte-exact vs live kernel', w.system === frame.system, w.system === frame.system ? '' : firstDiff(w.system, frame.system));
    check('message byte-exact vs live kernel', w.message === frame.message, w.message === frame.message ? '' : firstDiff(w.message, frame.message));
  } catch (e: any) {
    console.log(`  · python3 cross-check skipped: ${String(e?.message ?? e).slice(0, 80)}`);
  }

  console.log('— tool handler, ghost mode —');
  const res = await handleGenus({ handle: HANDLE, beach: BEACH });
  const out = res.content[0].text;
  check('ghost-wake header present', out.includes('GHOST-WAKE'));
  check('window embedded whole', out.includes('════════ SYSTEM ════════') && out.includes(w.system.slice(0, 200)));

  console.log(`\n=== summary ===\n  pass: ${pass}\n  fail: ${fail}`);
  if (fail > 0) process.exit(1);
})();
