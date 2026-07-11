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
