/**
 * smoke-gateway.ts — the voice mirror's contract, proven OFFLINE (stage one of
 * the bobble's road, spine:bobble 8.1; gateway/README.md).
 *
 * globalThis.fetch is an in-memory beach, so the real door (handlePlay)
 * compiles a real window from fixture blocks; OpenAI, the call's socket and
 * the sealed write are stand-ins. No key, number or network is touched.
 *
 *   npm run smoke:gateway
 */
process.env.DEFAULT_BEACH = 'https://beach.test';

import { createHmac } from 'node:crypto';

type AnyBlock = Record<string, unknown>;
const beaches: Record<string, Record<string, AnyBlock>> = {
  'https://beach.test': {
    'passport:alice': { _: 'Alice — a potter in Sheffield who keeps bees.', '1': 'Offers: pots for anyone starting out.' },
    'shell:alice': { _: "alice's shell on this beach.", '3': { _: 'The manifest — what a wake of alice holds.', '1': 'stash:alice' } },
    'stash:alice': { _: "alice's notes, kept on purpose.", '1': 'The kiln fires on Thursday; tell Bob.' },
    'pool:alice': {
      _: "alice's room — speak here to reach alice.",
      '1': { _: 'Is the kiln free on Thursday?', '1': 'bob', '2': '', '3': '2026-10-04T10:00:00.000Z' },
    },
  },
};

const WELL_KNOWN = '/.well-known/pscale-beach';
globalThis.fetch = (async (input: any) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const wk = url.pathname.indexOf(WELL_KNOWN);
  if (wk === -1) return new Response('not a beach', { status: 404 });
  const surface = `${url.origin}${url.pathname.slice(0, wk)}`;
  const beach = beaches[surface];
  if (!beach) return new Response('no beach', { status: 404 });
  const json = (v: unknown) => new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (url.searchParams.has('tables')) return json({ _: `Tables played at ${surface}.`, origin: surface, tables: [] });
  const name = url.searchParams.get('block');
  if (!name) return json({ _: `URL surface at ${surface}.`, origin: surface, blocks: Object.keys(beach).sort() });
  const block = beach[name];
  return block === undefined ? new Response('not found', { status: 404 }) : json(block);
}) as typeof fetch;

const { createGateway, configFromEnv, liveDeps } = await import('../gateway/server.js');
const { verifyWebhook, callerNumber, parseCallers, voiceInstructions, acceptBody, CallLog } = await import('../gateway/voice.js');

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

const SECRET = `whsec_${Buffer.from('a test signing secret, 32 bytes!').toString('base64')}`;
function signed(body: string, ts = Math.floor(Date.now() / 1000), secret = SECRET): Record<string, string> {
  const id = 'wh_test';
  const key = Buffer.from(secret.slice(6), 'base64');
  const sig = createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest('base64');
  return { 'webhook-id': id, 'webhook-timestamp': String(ts), 'webhook-signature': `v1,${sig}` };
}

console.log('=== the webhook signature (Standard Webhooks, as the openai SDK checks it) ===');
{
  const body = '{"type":"realtime.call.incoming"}';
  check('a signed body verifies', verifyWebhook(body, signed(body), SECRET));
  check('a changed body is refused', !verifyWebhook(`${body} `, signed(body), SECRET));
  check('a stale timestamp is refused', !verifyWebhook(body, signed(body, Math.floor(Date.now() / 1000) - 600), SECRET));
  const h = signed(body);
  check('a match among several candidates verifies', verifyWebhook(body, { ...h, 'webhook-signature': `v1,AAAA ${h['webhook-signature']}` }, SECRET));
  check('no secret verifies nothing', !verifyWebhook(body, h, ''));
}

console.log('\n=== who is calling ===');
{
  check('a display name and sip: URI', callerNumber([{ name: 'From', value: '"Alice" <sip:+447700900123@pstn.twilio.com>;tag=9' }]) === '+447700900123');
  check('a tel: URI', callerNumber([{ name: 'from', value: '<tel:+44 7700 900123>' }]) === '+447700900123');
  check('a number with no plus', callerNumber([{ name: 'From', value: '<sip:447700900123@x.test>' }]) === '+447700900123');
  check('no From header is nobody', callerNumber([{ name: 'To', value: '<sip:+441234@x>' }]) === null);
  check('a named SIP user is nobody', callerNumber([{ name: 'From', value: '<sip:alice@x.test>' }]) === null);
  const m = parseCallers('{"+44 7700 900123": "alice", "447700900999": {"handle": "bob", "writeback": "stash:bob", "key_env": "BOB_KEY"}}');
  check('CALLERS: a bare handle, normalised number', m.get('+447700900123')?.handle === 'alice');
  check('CALLERS: an object with its record', m.get('+447700900999')?.writeback === 'stash:bob');
}

console.log('\n=== the accepted session ===');
{
  const b = acceptBody('hello', { model: 'gpt-realtime-2', voice: 'marin', mcpUrl: 'https://bsp.example/mcp/v1', transcribeModel: 'gpt-4o-mini-transcribe' });
  check('a realtime session on the chosen model', b.type === 'realtime' && b.model === 'gpt-realtime-2');
  check('the voice and the caller transcribed', b.audio.output.voice === 'marin' && b.audio.input.transcription.model === 'gpt-4o-mini-transcribe');
  const t = b.tools[0];
  check('the beach as its one MCP server, bsp() only, no approval prompt', t.type === 'mcp' && t.server_url === 'https://bsp.example/mcp/v1' && t.allowed_tools.join() === 'bsp' && t.require_approval === 'never');
}

console.log('\n=== the instructions ===');
{
  const w = 'ROOM PART\n═══════════ YOUR OWN CONTEXT (alice) ═══════════\nOWN PART';
  const ins = voiceInstructions('alice', w);
  check('own context comes before the room', ins.indexOf('OWN PART') < ins.indexOf('ROOM PART'));
  check('the voice greets the caller by name', /greeting alice by name/.test(ins));
  check('the window is capped', voiceInstructions('alice', 'x'.repeat(50000), 1000).length < 3000);
}

console.log('\n=== the measurements ===');
{
  const log = new CallLog(0);
  log.onEvent({ type: 'input_audio_buffer.speech_stopped' }, 1000);
  log.onEvent({ type: 'response.output_audio.delta' }, 1800);
  log.onEvent({ type: 'response.output_audio.delta' }, 1900);
  log.onEvent({ type: 'conversation.item.input_audio_transcription.completed', transcript: ' Is the kiln free? ' });
  log.onEvent({ type: 'response.output_audio_transcript.done', transcript: 'It fires on Thursday.' });
  log.onEvent({ type: 'response.done', response: { usage: { input_tokens: 1200, output_tokens: 80 } } });
  check('an answer is timed from silence to its first audio', log.medianLatencyMs() === 800);
  check('turns are kept in order, trimmed', log.turns.map((t) => t.who).join() === 'caller,voice' && log.turns[0].text === 'Is the kiln free?');
  const s = log.summary('alice', 90000);
  check('the log line carries measurements, never the words', /1\.5 min/.test(s) && /0\.80 s/.test(s) && /in 1200 out 80/.test(s) && !/kiln/.test(s));
  check('the record carries the words', /alice: Is the kiln free\?/.test(log.record('alice', 90000)));
}

// The stand-ins for OpenAI, the call socket and the sealed write.
function harness(env: Record<string, string> = {}) {
  const calls: { path: string; body?: any }[] = [];
  const sent: any[] = [];
  const writes: { block: string; content: string; key: string }[] = [];
  const logs: string[] = [];
  let drive: { onEvent: (ev: any) => void; onClose: () => void } | null = null;
  const cfg = configFromEnv({
    OPENAI_API_KEY: 'sk-test',
    OPENAI_WEBHOOK_SECRET: SECRET,
    CALLERS: JSON.stringify({ '+447700900123': { handle: 'alice', writeback: 'stash:alice', key_env: 'ALICE_KEY' }, '+447700900456': 'bob' }),
    BEACH: 'https://beach.test',
    ...env,
  });
  const gw = createGateway(cfg, {
    compile: liveDeps('sk-test').compile,
    openai: async (path, body) => { calls.push({ path, body }); return { ok: true, status: 200 }; },
    connect: async (_id, onEvent, onClose) => { drive = { onEvent, onClose }; return { send: (ev) => sent.push(ev) }; },
    write: async (_beach, block, content, key) => { writes.push({ block, content, key }); return `[append @ ${block} → slot 1]`; },
    log: (line) => logs.push(line),
  });
  return { gw, calls, sent, writes, logs, drive: () => drive! };
}
const incoming = (from: string) => JSON.stringify({ type: 'realtime.call.incoming', data: { call_id: 'rtc_1', sip_headers: [{ name: 'From', value: `<sip:${from}@pstn.test>` }] } });
const settle = () => new Promise((r) => setTimeout(r, 10));

console.log('\n=== a known caller, end to end (the real door, compiled from the in-memory beach) ===');
{
  const h = harness({ ALICE_KEY: 'alice-key' });
  const body = incoming('+447700900123');
  const r = h.gw.handleWebhook(body, signed(body));
  check('the webhook answers 200 at once', r.status === 200 && !!r.call);
  await r.call;
  const accept = h.calls.find((c) => c.path === '/realtime/calls/rtc_1/accept');
  check('the call is accepted once', !!accept && h.calls.length === 1, JSON.stringify(h.calls.map((c) => c.path)));
  const ins: string = accept?.body?.instructions ?? '';
  check('the passport rides into the instructions', ins.includes('Alice — a potter in Sheffield'));
  check('the manifest is compiled (stash:alice)', ins.includes('The kiln fires on Thursday'), ins.slice(0, 400));
  check('the room rides too (bob\'s question)', ins.includes('Is the kiln free on Thursday?'));
  check('own context before the room', ins.indexOf('Alice — a potter') < ins.indexOf('Is the kiln free on Thursday?'));
  check('the voice is asked to greet first', h.sent.length === 1 && h.sent[0].type === 'response.create');
  const d = h.drive();
  d.onEvent({ type: 'conversation.item.input_audio_transcription.completed', transcript: 'When does the kiln fire?' });
  d.onEvent({ type: 'response.output_audio_transcript.done', transcript: 'Thursday — and Bob asked about it.' });
  d.onClose();
  await settle();
  check('the measurements are logged', h.logs.some((l) => /^call alice · .* 2 turns/.test(l)), h.logs.join(' | '));
  check('the record is written sealed to the block alice named, with her key', h.writes.length === 1 && h.writes[0].block === 'stash:alice' && h.writes[0].key === 'alice-key' && /alice: When does the kiln fire\?/.test(h.writes[0].content));
}

console.log('\n=== a caller who asked for no record ===');
{
  const h = harness();
  const body = incoming('+447700900456');
  await h.gw.handleWebhook(body, signed(body)).call;
  const d = h.drive();
  d.onEvent({ type: 'conversation.item.input_audio_transcription.completed', transcript: 'hello' });
  d.onClose();
  await settle();
  check('accepted, and nothing written', h.calls.some((c) => c.path.endsWith('/accept')) && h.writes.length === 0);
}

console.log('\n=== a beach that cannot be read ===');
{
  const calls: { path: string; body?: any }[] = [];
  const logs: string[] = [];
  const gw = createGateway(configFromEnv({ OPENAI_API_KEY: 'k', OPENAI_WEBHOOK_SECRET: SECRET, CALLERS: '{"+447700900123": "alice"}' }), {
    compile: async () => { throw new Error('beach down'); },
    openai: async (path, body) => { calls.push({ path, body }); return { ok: true, status: 200 }; },
    connect: async () => ({ send: () => {} }),
    write: async () => '',
    log: (line) => logs.push(line),
  });
  const body = incoming('+447700900123');
  await gw.handleWebhook(body, signed(body)).call;
  const acc = calls.find((c) => c.path.endsWith('/accept'));
  check('the call is still answered, honestly', !!acc && /could not be read before this call/.test(acc.body.instructions));
  check('the log says the beach was unreadable', logs.some((l) => /could not be read before the call — beach down/.test(l)));
}

console.log('\n=== an unknown number ===');
{
  const h = harness();
  const body = incoming('+15555550100');
  await h.gw.handleWebhook(body, signed(body)).call;
  check('declined (603), never accepted', h.calls.length === 1 && h.calls[0].path === '/realtime/calls/rtc_1/reject' && h.calls[0].body?.status_code === 603);
  check('the log says why', h.logs.some((l) => /not in CALLERS, declined/.test(l)));
}

console.log('\n=== refusals ===');
{
  const h = harness();
  const body = incoming('+447700900123');
  check('an unsigned webhook is 401 and touches nothing', h.gw.handleWebhook(body, {}).status === 401 && h.calls.length === 0);
  const other = JSON.stringify({ type: 'response.completed', data: {} });
  check('any other event is 200 and touches nothing', h.gw.handleWebhook(other, signed(other)).status === 200 && h.calls.length === 0);
  let named = '';
  try { configFromEnv({ OPENAI_API_KEY: 'k', CALLERS: '{}' }); } catch (e: any) { named = e.message; }
  check('a missing setting is named', /OPENAI_WEBHOOK_SECRET is not set/.test(named));
  let bad = '';
  try { configFromEnv({ OPENAI_API_KEY: 'k', OPENAI_WEBHOOK_SECRET: 's', CALLERS: '{not json' }); } catch (e: any) { bad = e.message; }
  check('a malformed CALLERS is named', /CALLERS is not valid JSON/.test(bad));
  const cfg = configFromEnv({ OPENAI_API_KEY: 'k', OPENAI_WEBHOOK_SECRET: 's', CALLERS: '{}' });
  check('defaults: the public door, gpt-realtime-2, marin', cfg.mcpUrl === 'https://bsp.hermitcrab.me/mcp/v1' && cfg.model === 'gpt-realtime-2' && cfg.voice === 'marin');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
