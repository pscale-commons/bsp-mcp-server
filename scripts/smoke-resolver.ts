/**
 * Smoke-test the bare→beach.<host> federation resolver against live hosts.
 *
 *   bare  https://idiothuman.com         (NOT federated)
 *   beach https://beach.idiothuman.com   (federated — has 14 blocks)
 *
 * Expectation: resolver routes the bare request to the subdomain. Block reads
 * via the bare URL succeed via the fallback path.
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
  console.log('=== resolveFederationOrigin: bare → beach.<host> fallback ===');
  const bare = 'https://idiothuman.com';
  const sub = 'https://beach.idiothuman.com';
  const resolved = await resolveFederationOrigin(bare);
  assert(resolved === sub, `bare ${bare} resolves to ${sub} (got ${resolved})`);

  console.log('=== resolveFederationOrigin: subdomain passes through ===');
  const passthrough = await resolveFederationOrigin(sub);
  assert(passthrough === sub, `subdomain passes through unchanged (got ${passthrough})`);

  console.log('=== probeFederation: bare host now reads as federated ===');
  const status = await probeFederation(bare);
  assert(status === 'federated', `bare ${bare} reports federated via fallback (got ${status})`);

  console.log('=== loadBlock: read passport via bare URL routes to subdomain ===');
  const row = await loadBlock(bare, 'passport:idiothuman');
  assert(row !== null, 'passport:idiothuman loaded via bare URL');
  assert(row?.block?._?.toString().includes('idiothuman') === true, 'passport content matches expected handle');

  console.log('=== resolveFederationOrigin: non-federated host returns null ===');
  const missing = await resolveFederationOrigin('https://example.invalid');
  assert(missing === null, 'unreachable host returns null');

  console.log('=== resolveFederationOrigin: localhost skips fallback ===');
  const localhost = await resolveFederationOrigin('http://localhost:9999');
  assert(localhost === null, 'localhost without server returns null (no beach.localhost retry)');

  console.log(`\n=== ${pass}/${pass + fail} passed ===`);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
