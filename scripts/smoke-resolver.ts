/**
 * Smoke-test the strict-subdomain federation resolver.
 *
 *   bare         → beach.<host>          (auto-prepend)
 *   beach.<host> → beach.<host>          (pass-through)
 *   vercel.app   → as-is                 (dev-deploy carve-out)
 *   localhost    → as-is                 (no DNS for beach.localhost)
 *
 * As of 2026-05-12 the resolver is deterministic — no probe, no network
 * round-trip. Bare-domain beaches are not supported (subdomain-only
 * convention per docs/protocol-pscale-beach-v2.md §2.7).
 *
 * Run: npx tsx scripts/smoke-resolver.ts
 */

import { resolveFederationOrigin, probeFederation, loadBlock } from '../src/db.js';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

async function main() {
  console.log('=== resolveFederationOrigin: bare → beach.<host> auto-prepend ===');
  assert(
    resolveFederationOrigin('https://idiothuman.com') === 'https://beach.idiothuman.com',
    'bare idiothuman.com → beach.idiothuman.com',
  );
  assert(
    resolveFederationOrigin('https://example.com') === 'https://beach.example.com',
    'bare example.com → beach.example.com',
  );
  assert(
    resolveFederationOrigin('https://EXAMPLE.com') === 'https://beach.example.com',
    'case normalisation in canonicaliseOrigin',
  );

  console.log('=== resolveFederationOrigin: subdomain passes through ===');
  assert(
    resolveFederationOrigin('https://beach.idiothuman.com') === 'https://beach.idiothuman.com',
    'beach.idiothuman.com passes through',
  );

  console.log('=== resolveFederationOrigin: dev-deploy hosts pass through ===');
  assert(
    resolveFederationOrigin('https://pscale-beach-xyz.vercel.app') === 'https://pscale-beach-xyz.vercel.app',
    '.vercel.app passes through (no auto-prepend)',
  );
  assert(
    resolveFederationOrigin('https://my-site.netlify.app') === 'https://my-site.netlify.app',
    '.netlify.app passes through',
  );

  console.log('=== resolveFederationOrigin: localhost / IP passes through ===');
  assert(
    resolveFederationOrigin('http://localhost:3000') === 'http://localhost:3000',
    'localhost passes through',
  );
  assert(
    resolveFederationOrigin('http://127.0.0.1:8080') === 'http://127.0.0.1:8080',
    'IP literal passes through',
  );

  console.log('=== resolveFederationOrigin: non-URL agent_id returns null ===');
  assert(resolveFederationOrigin('weft') === null, 'bare name returns null');
  assert(resolveFederationOrigin('sed:hsu-commons') === null, 'sed: returns null');
  assert(resolveFederationOrigin('grain:abc123') === null, 'grain: returns null');
  assert(resolveFederationOrigin('pscale') === null, 'sentinel returns null');

  console.log('=== probeFederation against live beach.idiothuman.com ===');
  const status = await probeFederation('https://idiothuman.com');
  assert(status === 'federated', `probeFederation('https://idiothuman.com') → federated (got ${status})`);

  console.log('=== loadBlock: bare URL agent_id reads via subdomain ===');
  const row = await loadBlock('https://idiothuman.com', 'passport:idiothuman');
  assert(row !== null, 'passport:idiothuman loaded via bare URL agent_id');
  if (row?.block) {
    const root = row.block._;
    const text = typeof root === 'string' ? root : (typeof root === 'object' && root !== null && typeof (root as Record<string, unknown>)._ === 'string' ? (root as Record<string, unknown>)._ as string : '');
    assert(text.includes('idiothuman'), 'passport content matches expected handle');
  }

  console.log(`\n=== ${pass}/${pass + fail} passed ===`);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
