/**
 * Smoke-test the grain UX tightening changes against a mock beach (federated
 * path) and pure formatter paths. Validates:
 *   - bsp() read appends [lock] line surfacing position-lock state
 *   - bsp() read of a federated beach root appends [hint] line
 *   - non-root federated reads do NOT append the hint
 *   - pscale_grain_reach verify_only narrates state without writing
 *   - grain_reach response branching distinguishes establish / complete
 *
 * Commons-path tests (Supabase) are deferred to live smoke against the
 * deployed bsp-mcp — those need real credentials and would write durable
 * state. This script touches no commons substrate.
 *
 * Run: npx tsx scripts/smoke-grain-ux.ts
 */

import { createServer } from 'node:http';
import { handleBsp } from '../src/tools/bsp.js';
import { handleGrainReach } from '../src/tools/grain.js';
import { pairId, determineSide } from '../src/locks.js';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}
function getText(r: any): string {
  return r?.content?.[0]?.text ?? '';
}

// ── Mock beach with grain block support ──

interface MockState {
  beach: Record<string, any>;
  grainBlocks: Record<string, Record<string, any>>;
  postReceived: any[];
}

const state: MockState = {
  beach: {
    _: 'Mock beach for grain UX smoke',
    '1': { _: 'marks', '1': 'tide-marker' },
    '8': { _: 'local conventions', '1': 'mock convention' },
  },
  grainBlocks: {},
  postReceived: [],
};

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }

  if (!req.url?.startsWith('/.well-known/pscale-beach')) {
    res.writeHead(404).end(JSON.stringify({ error: 'not a beach endpoint' }));
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const blockParam = url.searchParams.get('block');

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    if (!blockParam || blockParam === 'beach') {
      res.writeHead(200).end(JSON.stringify(state.beach));
      return;
    }
    if (blockParam.startsWith('grain:')) {
      const block = state.grainBlocks[blockParam];
      if (!block) { res.writeHead(404).end(JSON.stringify({ error: 'not found' })); return; }
      res.writeHead(200).end(JSON.stringify(block));
      return;
    }
    res.writeHead(404).end(JSON.stringify({ error: 'unknown block' }));
    return;
  }

  if (req.method === 'POST') {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    let body: any;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { res.writeHead(400).end(JSON.stringify({ error: 'invalid JSON' })); return; }
    state.postReceived.push({ block: blockParam, body });
    // Verify_only smoke should NEVER POST — record + reject so test sees the violation.
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200).end(JSON.stringify({ ok: true, state: 'completed' }));
    return;
  }
  res.writeHead(405).end();
});

await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
const addr = server.address();
const port = typeof addr === 'object' && addr ? addr.port : 0;
const beachOrigin = `http://127.0.0.1:${port}`;
console.log(`Mock beach at ${beachOrigin}\n`);

try {
  console.log('=== bsp() read surfaces [lock] line ===');
  const r1 = await handleBsp({ agent_id: beachOrigin, block: 'beach', spindle: '', pscale_attention: null });
  assert(getText(r1).includes('[lock]'), 'read response includes [lock] line');
  assert(getText(r1).includes('unlocked'), 'unlocked beach surfaces unlocked');

  console.log('\n=== federated root read appends [hint] line ===');
  assert(getText(r1).includes('[hint]'), 'beach root read shows conventions hint');
  assert(getText(r1).includes('block-conventions'), 'hint references substrate-wide block-conventions');
  assert(getText(r1).includes('beach", spindle="8"'), 'hint references local beach:8');

  console.log('\n=== federated NON-root read suppresses [hint] ===');
  const r2 = await handleBsp({ agent_id: beachOrigin, block: 'beach', spindle: '1.1', pscale_attention: null });
  assert(!getText(r2).includes('[hint]'), 'point-read at 1.1 does NOT include hint');
  assert(getText(r2).includes('[lock]'), 'point-read still includes [lock] line');

  console.log('\n=== verify_only on federated grain — block does not exist ===');
  state.postReceived = [];
  const agentA = 'smokeA-zzz';
  const agentB = 'smokeB-aaa';
  const pid = pairId(agentA, agentB);
  const mySide = determineSide(agentA, agentB);
  const r3 = await handleGrainReach({
    handle: agentA,
    partner_handle: agentB,
    description: 'smoke',
    my_side_content: 'A side',
    my_passphrase: 'apass',
    agent_id: beachOrigin,
    verify_only: true,
  });
  assert(getText(r3).includes('[verify_only]'), 'response prefixed with [verify_only]');
  assert(getText(r3).includes('Would establish'), 'narrates would-establish for non-existent grain');
  assert(getText(r3).includes(`grain:${pid}`), 'pair_id included in narration');
  assert(getText(r3).includes(beachOrigin), 'host included in narration');
  assert(state.postReceived.length === 0, 'verify_only did NOT POST (no state mutation)');

  console.log('\n=== verify_only on federated grain — half-formed (partner reached) ===');
  state.postReceived = [];
  const partnerSide = mySide === '1' ? '2' : '1';
  state.grainBlocks[`grain:${pid}`] = {
    _: 'half-formed',
    [partnerSide]: { _: 'partner content' },
    '8': { _reach_pending: { from: agentB } },
    '9': { [partnerSide]: agentB },
  };
  const r4 = await handleGrainReach({
    handle: agentA,
    partner_handle: agentB,
    description: 'smoke',
    my_side_content: 'A side',
    my_passphrase: 'apass',
    agent_id: beachOrigin,
    verify_only: true,
  });
  assert(getText(r4).includes('Would complete'), 'narrates would-complete for half-formed grain');
  assert(getText(r4).includes('half-formed'), 'mentions half-formed state');
  assert(getText(r4).includes('passphrase NOT server-verified'), 'caveats federated passphrase verification');
  assert(state.postReceived.length === 0, 'verify_only did NOT POST');

  console.log('\n=== verify_only on federated grain — own side already exists ===');
  state.postReceived = [];
  state.grainBlocks[`grain:${pid}`] = {
    _: 'half-formed-mine',
    [mySide]: { _: 'A side' },
    '9': { [mySide]: agentA },
  };
  const r5 = await handleGrainReach({
    handle: agentA,
    partner_handle: agentB,
    description: 'smoke',
    my_side_content: 'A side',
    my_passphrase: 'apass',
    agent_id: beachOrigin,
    verify_only: true,
  });
  assert(getText(r5).includes('side already exists'), 'narrates own-side-exists rejection path');
  assert(state.postReceived.length === 0, 'verify_only did NOT POST');

  console.log('\n=== federated grain_reach (no verify_only) DOES POST ===');
  state.postReceived = [];
  delete state.grainBlocks[`grain:${pid}`];
  const r6 = await handleGrainReach({
    handle: agentA,
    partner_handle: agentB,
    description: 'smoke',
    my_side_content: 'A side',
    my_passphrase: 'apass',
    agent_id: beachOrigin,
  });
  assert(state.postReceived.length === 1, 'real reach POSTed once');
  assert(getText(r6).includes('completed'), 'mock returned completed state, response reflects it');
  assert(getText(r6).includes(`grain:${pid} on ${beachOrigin}`), 'pair_id substrate-disambiguated with host');
  assert(getText(r6).includes('[hint]'), 'response includes conventions hint');
  assert(!getText(r6).includes('Read the partner\'s reach hint'), 'completed response does not include awaiting-acceptance line');

  console.log(`\n=== ${pass}/${pass + fail} passed ===`);
} catch (e: any) {
  console.error('FATAL:', e?.message ?? e);
  fail++;
} finally {
  server.close();
}

process.exit(fail > 0 ? 1 : 0);
