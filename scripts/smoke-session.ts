/**
 * smoke-session.ts — verify the HTTP session lifecycle in src/index.ts.
 *
 * The MCP streamable-http spec says a request bearing an unknown/expired
 * session id SHOULD receive HTTP 404, which tells a conformant client to
 * drop the stale id and re-initialize. This is the self-heal path after a
 * server redeploy wipes in-memory sessions (Railway bounce). A 400 here
 * leaves clients stale until a manual reconnect.
 *
 * Spawns the server locally on an ephemeral port — no network beyond
 * localhost, no beach access. Run: npm run smoke:session
 */
import { spawn } from 'node:child_process';

const PORT = 3000 + Math.floor(Math.random() * 2000);
const BASE = `http://localhost:${PORT}/mcp/v1`;
const ACCEPT = 'application/json, text/event-stream';

let pass = 0, fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

const initBody = (id: number) => JSON.stringify({
  jsonrpc: '2.0', id,
  method: 'initialize',
  params: {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'smoke-session', version: '0.0.0' },
  },
});

(async () => {
  const child = spawn('npx', ['tsx', 'src/index.ts'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  // Wait for the server to listen.
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server did not start in 15s')), 15000);
    child.stdout.on('data', (buf: Buffer) => {
      if (buf.toString().includes('running on')) { clearTimeout(timer); resolve(); }
    });
    child.on('exit', () => { clearTimeout(timer); reject(new Error('server exited early')); });
  });

  try {
    console.log('=== Fresh initialize (no session header) → 200 + session id ===');
    const init = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: ACCEPT },
      body: initBody(1),
    });
    const sessionId = init.headers.get('mcp-session-id');
    assert(init.status === 200 && !!sessionId, `status ${init.status}, session ${sessionId}`);

    console.log('\n=== Known-session POST → handled by transport (not 404) ===');
    const known = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: ACCEPT, 'mcp-session-id': sessionId! },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    });
    assert(known.status !== 404 && known.status !== 400, `status ${known.status}`);

    console.log('\n=== Unknown-session POST (non-initialize) → 404, JSON-RPC error body, id echoed ===');
    const stale = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: ACCEPT, 'mcp-session-id': 'stale-after-redeploy' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 42, method: 'tools/list' }),
    });
    const staleBody = await stale.json() as any;
    assert(stale.status === 404, `status ${stale.status} (expect 404)`);
    assert(staleBody?.error?.code === -32000 && staleBody?.id === 42,
      `body error code ${staleBody?.error?.code}, id ${staleBody?.id}`);

    console.log('\n=== Unknown-session GET → 404, JSON-RPC error body ===');
    const staleGet = await fetch(BASE, {
      method: 'GET',
      headers: { Accept: 'text/event-stream', 'mcp-session-id': 'stale-after-redeploy' },
    });
    const staleGetBody = await staleGet.json() as any;
    assert(staleGet.status === 404, `status ${staleGet.status} (expect 404)`);
    assert(staleGetBody?.error?.code === -32000, `body error code ${staleGetBody?.error?.code}`);

    console.log('\n=== Unknown-session DELETE → 200 (unchanged) ===');
    const staleDel = await fetch(BASE, {
      method: 'DELETE',
      headers: { 'mcp-session-id': 'stale-after-redeploy' },
    });
    assert(staleDel.status === 200, `status ${staleDel.status} (expect 200)`);

    console.log('\n=== Self-heal: re-initialize after the 404 → new session works ===');
    const reinit = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: ACCEPT },
      body: initBody(2),
    });
    const newSession = reinit.headers.get('mcp-session-id');
    assert(reinit.status === 200 && !!newSession && newSession !== sessionId,
      `status ${reinit.status}, new session ${newSession}`);

    console.log(`\n${pass} passed, ${fail} failed`);
  } finally {
    child.kill('SIGTERM');
  }
  process.exit(fail === 0 ? 0 : 1);
})().catch((err) => { console.error(err); process.exit(1); });
