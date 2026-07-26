/**
 * index.ts — HTTP entry point for bsp-mcp-server.
 *
 * Streamable HTTP transport. Each session gets its own MCP server. Sessions
 * persist until explicit DELETE or server restart — SSE drops do NOT remove
 * sessions (clients reconnect).
 */

import { createServer as createHttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const MCP_PATH = process.env.MCP_PATH || '/mcp/v1';

const transports = new Map<string, StreamableHTTPServerTransport>();

// ── The silent-misroute guard: duplicate in-flight request ids ──
//
// The SDK routes a response back to its caller through a Map keyed by JSON-RPC
// id (webStandardStreamableHttp.js — `_requestToStreamMapping.set(message.id,
// streamId)`). JSON-RPC requires an id to be unique within a session. When a
// client breaks that — several agents sharing ONE session, each numbering its
// own requests from 1 — the second `.set` OVERWRITES the first, so one caller
// is handed ANOTHER caller's response body and the first waits until it times
// out. Both requests still execute against the substrate.
//
// Demonstrated live 2026-07-25 with three character seats on one session: a
// bsp() write came back as another player's composed room envelope, carrying
// that player's private witnessed:/knows: pages into a seat forbidden to read
// them (grit 1.16), and writes that "timed out" had in fact landed — which
// then invited non-idempotent retries into an append-only public record.
//
// This is the whetstone:1.3 trap at the transport: a silent misroute. The
// substrate's standing answer is to reject at the boundary rather than guess —
// the same discipline by which the address parser strict-rejects a multi-dot
// address instead of picking an interpretation. A colliding id is refused
// loudly so the caller retries with a fresh one, or gives each concurrent
// caller its own session, which is the real fix.
const inflight = new Map<string, Set<string | number>>();

/** JSON-RPC ids in this body that expect a response — requests only, never
 *  notifications (no id) or client-side responses (no method). Batch-aware. */
function requestIds(body: unknown): (string | number)[] {
  const messages = Array.isArray(body) ? body : [body];
  const ids: (string | number)[] = [];
  for (const m of messages) {
    if (!m || typeof m !== 'object') continue;
    if (!('method' in m) || !('id' in m)) continue;
    const id = (m as { id?: unknown }).id;
    if (typeof id === 'string' || typeof id === 'number') ids.push(id);
  }
  return ids;
}

function createSession(): StreamableHTTPServerTransport {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
  });

  transport.onclose = () => {
    console.log(`Transport onclose for session: ${transport.sessionId}`);
    // Don't delete session here — SSE drop ≠ session end. Clients reconnect.
  };

  const mcpServer = createServer();
  mcpServer.connect(transport);

  return transport;
}

const httpServer = createHttpServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (url.pathname !== MCP_PATH) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: `bsp-mcp endpoint at ${MCP_PATH}` }));
    return;
  }

  let body: unknown = undefined;
  if (req.method === 'POST') {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const raw = Buffer.concat(chunks).toString('utf-8');
    if (raw) {
      try { body = JSON.parse(raw); } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
    }
  }

  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  console.log(`${req.method} ${MCP_PATH} | session: ${sessionId || 'none'} | known: ${sessionId ? transports.has(sessionId) : 'n/a'} | sessions: ${transports.size}`);

  if (sessionId && transports.has(sessionId)) {
    const ids = req.method === 'POST' ? requestIds(body) : [];
    const live = inflight.get(sessionId) ?? new Set<string | number>();
    const clash = ids.find((id) => live.has(id));
    if (clash !== undefined) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message:
            `Request id ${JSON.stringify(clash)} is already in flight on this session. ` +
            'JSON-RPC ids must be unique within a session; reusing one makes the transport ' +
            "deliver this response to the other caller and leave that caller waiting. " +
            'Retry with a fresh id, or give each concurrent caller its own session.',
        },
        id: clash,
      }));
      return;
    }
    if (ids.length) {
      for (const id of ids) live.add(id);
      inflight.set(sessionId, live);
      res.on('close', () => {
        const s = inflight.get(sessionId);
        if (!s) return;
        for (const id of ids) s.delete(id);
        if (s.size === 0) inflight.delete(sessionId);
      });
    }
    await transports.get(sessionId)!.handleRequest(req, res, body);
    return;
  }

  if (req.method === 'POST') {
    const isInitialize = body && typeof body === 'object' && 'method' in body && (body as any).method === 'initialize';
    if (sessionId && !isInitialize) {
      // MCP streamable-http spec: a request bearing an unknown/expired session id
      // SHOULD receive HTTP 404 — conformant clients then start a fresh session
      // (re-initialize) automatically. A 400 here left clients stale after a
      // server redeploy wiped in-memory sessions.
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Unknown session. Send an initialize request first.' },
        id: (body && typeof body === 'object' && 'id' in body) ? (body as any).id : null,
      }));
      return;
    }
    if (sessionId) delete req.headers['mcp-session-id'];
    const transport = createSession();
    await transport.handleRequest(req, res, body);
    if (transport.sessionId) transports.set(transport.sessionId, transport);
    return;
  }

  if (req.method === 'GET') {
    // Unknown/expired session on the SSE GET leg: 404 per the MCP
    // streamable-http spec, so clients drop the stale session id and
    // re-initialize instead of retrying against a dead session.
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Unknown or expired session. POST initialize first.' },
      id: null,
    }));
    return;
  }

  if (req.method === 'DELETE') {
    if (sessionId && transports.has(sessionId)) {
      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res, body);
      transports.delete(sessionId);
      inflight.delete(sessionId);
    } else {
      res.writeHead(200);
      res.end(JSON.stringify({ jsonrpc: '2.0', result: {} }));
    }
    return;
  }

  res.writeHead(405);
  res.end();
});

httpServer.listen(PORT, () => {
  console.log(`bsp-mcp-server running on http://localhost:${PORT}${MCP_PATH}`);
  console.log('Streamable HTTP transport ready.');
});
