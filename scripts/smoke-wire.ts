/**
 * smoke-wire.ts — run the wire contract battery (src/pscale-wire-contract.ts)
 * against a local simulated beach. The sim implements exactly the protocol
 * the contract's header documents; the assertions themselves are vendored
 * byte-identical into xstream, so both consumers answer to the same battery.
 */
import http from 'node:http';
import { AddressInfo } from 'node:net';
import * as wire from '../src/pscale-wire.js';
import { runContract, type SimHandle } from '../src/pscale-wire-contract.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

function startSim(): Promise<{ handle: SimHandle; close: () => void }> {
  const store = new Map<string, Json>();
  const log: Array<{ method: string; path: string; query: Record<string, string>; body: Json }> = [];
  let flakyTripped = false;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://sim');
    const query: Record<string, string> = {};
    url.searchParams.forEach((v, k) => { query[k] = v; });
    const block = query.block ?? '';
    const send = (status: number, body: Json) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      let body: Json = null;
      try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }

      // harness endpoints
      if (url.pathname === '/__seed') { store.set(body.block, body.content); return send(200, { ok: true }); }
      if (url.pathname === '/__log') { return send(200, log); }
      if (url.pathname === '/__clear') { log.length = 0; flakyTripped = false; return send(200, { ok: true }); }

      log.push({ method: req.method ?? '?', path: url.pathname, query, body });

      // special blocks per the contract's sim protocol
      if (block === 'server-error') return send(500, { error: 'boom' });
      if (block === 'locked' && req.method === 'POST') return send(403, { error: 'locked' });
      if (block === 'flaky-once' && req.method === 'GET') {
        if (!flakyTripped) { flakyTripped = true; req.socket.destroy(); return; }
        return send(200, store.get('flaky-once') ?? { error: 'unseeded' });
      }
      if (block === 'enveloped' && req.method === 'GET') return send(200, { block: store.get('enveloped') ?? null });
      if (block === 'mutating' && req.method === 'GET') return send(200, { _: 'changed-by-sim' });
      if (req.method === 'POST' && body?.resolve_window && block === 'resolve-taken') {
        return send(409, { code: 'window_already_resolved', resolved_by: 'rival', window: body.resolve_window, landed: { slot: '5' } });
      }
      if (req.method === 'POST' && body?.resolve_window && block === 'window-moved') {
        return send(409, { code: 'window_moved', window: body.resolve_window, buffer: { 1: { _: 'late' } } });
      }

      if (req.method === 'GET') {
        if (!block) return send(200, { _: 'sim surface', origin: 'sim', blocks: [...store.keys()] });
        if (!store.has(block)) return send(404, { error: 'not found' });
        return send(200, store.get(block));
      }
      if (req.method === 'POST') {
        if (body?.append === true) return send(200, { slot: block === 'numeric-slot' ? 71 : '71' });
        if (body?.action === 'reach') return send(200, { ok: true, state: 'created', pair_id: block.replace(/^grain:/, '') });
        if (body?.action === 'register') return send(200, { ok: true, position: '12', address: `${block}:12` });
        if (body?.content !== undefined) { store.set(block, body.content); return send(200, { ok: true }); }
        return send(200, { ok: true });
      }
      return send(405, { error: 'method' });
    });
  });

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      const call = async (path: string, body?: Json) => {
        const r = await fetch(`${origin}${path}`, body === undefined
          ? {}
          : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        return r.json();
      };
      resolve({
        handle: {
          origin,
          seed: async (block, content) => { await call('/__seed', { block, content }); },
          log: async () => await call('/__log'),
          clear: async () => { await call('/__clear'); },
        },
        close: () => server.close(),
      });
    });
  });
}

const { handle, close } = await startSim();
try {
  console.log(`pscale-wire contract battery (wire ${wire.WIRE_VERSION}) against ${handle.origin}\n`);
  const res = await runContract(wire as never, handle);
  console.log(res.lines.join('\n'));
  console.log(`\n=== summary ===\n  pass: ${res.pass}\n  fail: ${res.fail}`);
  if (res.fail > 0) process.exit(1);
} finally {
  close();
}
