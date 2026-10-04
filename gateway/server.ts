/**
 * gateway/server.ts — the voice mirror, stage one of the bobble's road
 * (spine:bobble 8.1, step 3.1): a phone number that answers from the
 * caller's own shell. Setup and the test it runs: gateway/README.md.
 *
 * One call, three moves:
 *   1. BEFORE THE FIRST WORD — OpenAI posts `realtime.call.incoming`; the
 *      caller's number picks a handle from the private CALLERS map, and the
 *      beach's own door (handlePlay, the one every session boots through)
 *      compiles that shell into the voice's instructions.
 *   2. DURING — the call is accepted into OpenAI's realtime model with the
 *      beach's MCP server as its one tool server, limited to bsp(), for any
 *      lookup the compiled window does not already hold.
 *   3. AFTER — the call's measurements go to the log; if its holder asked
 *      for a record, the turns are appended sealed (gray) to the block they
 *      named, readable only with their key.
 *
 * Unknown numbers are declined, so nobody else's talk spends the key. Each
 * deployment spends its own OpenAI key: whoever hosts a gateway pays for the
 * calls it answers, which is how the cost federates instead of centralising.
 *
 *   npm run gateway
 */
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { handlePlay } from '../src/tools/play.js';
import { handleBsp } from '../src/tools/bsp.js';
import { verifyWebhook, callerNumber, parseCallers, voiceInstructions, acceptBody, CallLog, type Caller, type SessionOptions } from './voice.js';

export interface GatewayConfig extends SessionOptions {
  webhookSecret: string;
  callers: Map<string, Caller>;
  beach: string;
  windowChars: number;
  env: Record<string, string | undefined>;
}

/** The outside world, passed in so the smoke test can stand in for it. */
export interface Deps {
  compile(beach: string, handle: string): Promise<string>;
  openai(path: string, body?: unknown): Promise<{ ok: boolean; status: number }>;
  connect(callId: string, onEvent: (ev: any) => void, onClose: () => void): Promise<{ send(ev: unknown): void }>;
  write(beach: string, block: string, content: string, key: string): Promise<string>;
  log(line: string): void;
}

export function createGateway(cfg: GatewayConfig, deps: Deps) {
  async function answer(data: { call_id: string; sip_headers?: { name: string; value: string }[] }): Promise<void> {
    const callId = data.call_id;
    const num = callerNumber(data.sip_headers);
    const caller = num ? cfg.callers.get(num) : undefined;
    if (!caller) {
      await deps.openai(`/realtime/calls/${callId}/reject`, { status_code: 603 });
      deps.log(`call ${callId}: number not in CALLERS, declined`);
      return;
    }
    // A beach that cannot be read still gets the call answered, honestly.
    const window = await deps.compile(cfg.beach, caller.handle).catch((e) => {
      deps.log(`call ${caller.handle}: the beach could not be read before the call — ${e?.message ?? e}`);
      return '(The beach could not be read before this call. If asked about their shell, say so, and look with the bsp tool.)';
    });
    const res = await deps.openai(`/realtime/calls/${callId}/accept`, acceptBody(voiceInstructions(caller.handle, window, cfg.windowChars), cfg));
    if (!res.ok) throw new Error(`accept answered ${res.status}`);
    const log = new CallLog(Date.now());
    const sock = await deps.connect(callId, (ev) => log.onEvent(ev), () => {
      deps.log(log.summary(caller.handle));
      const key = caller.key_env ? cfg.env[caller.key_env] : undefined;
      if (caller.writeback && key && log.turns.length) {
        deps.write(cfg.beach, caller.writeback, log.record(caller.handle), key)
          .then((ack) => deps.log(`call ${caller.handle}: record sealed at ${caller.writeback} — ${ack.split('\n')[0]}`))
          .catch((e) => deps.log(`call ${caller.handle}: record not written — ${e?.message ?? e}`));
      }
    });
    sock.send({ type: 'response.create' }); // the voice greets first, as a phone call is answered
  }

  return {
    answer,
    /** The webhook endpoint: 401 for anything unsigned, 200 for everything
     *  else at once (OpenAI must not wait on the beach), the call answered
     *  after. The returned promise is the call's handling, for the test. */
    handleWebhook(body: string, headers: Record<string, string | string[] | undefined>): { status: number; call?: Promise<void> } {
      if (!verifyWebhook(body, headers, cfg.webhookSecret)) return { status: 401 };
      let ev: any;
      try { ev = JSON.parse(body); } catch { return { status: 400 }; }
      if (ev?.type !== 'realtime.call.incoming' || !ev.data?.call_id) return { status: 200 };
      const call = answer(ev.data).catch((e) => deps.log(`call ${ev.data.call_id}: ${e?.message ?? e}`));
      return { status: 200, call };
    },
  };
}

export function configFromEnv(env: Record<string, string | undefined>): GatewayConfig {
  for (const name of ['OPENAI_API_KEY', 'OPENAI_WEBHOOK_SECRET', 'CALLERS']) {
    if (!env[name]) throw new Error(`${name} is not set — see gateway/README.md`);
  }
  return {
    webhookSecret: env.OPENAI_WEBHOOK_SECRET!,
    callers: parseCallers(env.CALLERS),
    beach: env.BEACH || 'https://beach.happyseaurchin.com',
    mcpUrl: env.MCP_URL || 'https://bsp.hermitcrab.me/mcp/v1',
    model: env.REALTIME_MODEL || 'gpt-realtime-2',
    voice: env.VOICE || 'marin',
    transcribeModel: env.TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe',
    windowChars: Number(env.WINDOW_CHARS || 24000),
    env,
  };
}

export function liveDeps(apiKey: string): Deps {
  const auth = { Authorization: `Bearer ${apiKey}` };
  return {
    compile: async (beach, handle) =>
      (await handlePlay({ world: beach, handle, room: handle })).content.map((c) => c.text).join('\n'),
    openai: (path, body) =>
      fetch(`https://api.openai.com/v1${path}`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    connect: (callId, onEvent, onClose) =>
      new Promise((resolve, reject) => {
        const ws = new WebSocket(`wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(callId)}`, { headers: auth } as any);
        ws.onmessage = (m) => { try { onEvent(JSON.parse(String(m.data))); } catch { /* not JSON: nothing to log */ } };
        ws.onclose = () => onClose();
        ws.onerror = () => reject(new Error('the call socket did not open'));
        ws.onopen = () => resolve({ send: (ev) => ws.send(JSON.stringify(ev)) });
      }),
    write: async (beach, block, content, key) =>
      (await handleBsp({ agent_id: beach, block, append: true, gray: true, content, secret: key })).content.map((c) => c.text).join('\n'),
    log: (line) => console.log(`[gateway] ${line}`),
  };
}

function main(): void {
  const cfg = configFromEnv(process.env);
  const gw = createGateway(cfg, liveDeps(process.env.OPENAI_API_KEY!));
  const port = Number(process.env.PORT || 8787);
  http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') { res.end('ok'); return; }
    if (req.method === 'POST' && req.url === '/webhook') {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const c of req) {
        size += (c as Buffer).length;
        if (size > 1_000_000) { res.statusCode = 413; res.end(); return; } // a call event is a few hundred bytes
        chunks.push(c as Buffer);
      }
      res.statusCode = gw.handleWebhook(Buffer.concat(chunks).toString('utf8'), req.headers).status;
      res.end();
      return;
    }
    res.statusCode = 404;
    res.end();
  }).listen(port, () => console.log(`[gateway] listening on ${port} · ${cfg.callers.size} known numbers · beach ${cfg.beach} · ${cfg.model}`));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
