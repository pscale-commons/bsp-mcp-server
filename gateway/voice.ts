/**
 * gateway/voice.ts — the voice mirror's core, with no network of its own.
 *
 * Stage one of the bobble's road (spine:bobble 8.1, step 3.1): a phone number
 * that answers from the caller's own shell. The beach work happens around the
 * conversation, never inside it — compile before the first word, speak, write
 * after — because in speech every live lookup is an audible pause.
 *
 * Plain functions only, so scripts/smoke-gateway.ts holds the contract offline:
 * the webhook's signature, who is calling, the session a call is accepted
 * into, the instructions it carries, and the record it leaves.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** OpenAI signs webhooks the Standard Webhooks way: HMAC-SHA256 over
 *  `${id}.${timestamp}.${body}`, keyed by the base64 secret after `whsec_`;
 *  the signature header carries space-separated `v1,<base64>` candidates.
 *  Mirrors the openai SDK's verifyWebhookSignature, five minutes' tolerance. */
export function verifyWebhook(
  body: string,
  headers: Record<string, string | string[] | undefined>,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): boolean {
  const one = (h: string | string[] | undefined) => (Array.isArray(h) ? h[0] : h);
  const id = one(headers['webhook-id']);
  const ts = one(headers['webhook-timestamp']);
  const sig = one(headers['webhook-signature']);
  if (!id || !ts || !sig || !secret) return false;
  const t = Number.parseInt(ts, 10);
  if (Number.isNaN(t) || Math.abs(nowSeconds - t) > toleranceSeconds) return false;
  const key = secret.startsWith('whsec_') ? Buffer.from(secret.slice(6), 'base64') : Buffer.from(secret, 'utf8');
  const expected = createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest();
  return sig.split(' ').some((candidate) => {
    const given = Buffer.from(candidate.startsWith('v1,') ? candidate.slice(3) : candidate, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

/** The caller's number from the SIP INVITE's From header, as + and digits:
 *  '"David" <sip:+447700900123@pstn.twilio.com>;tag=1' → '+447700900123'.
 *  OpenAI marks these headers untrusted, and caller ID can be spoofed: a
 *  number only chooses which public shell is compiled, never authority. */
export function callerNumber(sipHeaders: { name: string; value: string }[] | undefined): string | null {
  const from = (sipHeaders ?? []).find((h) => h.name.toLowerCase() === 'from')?.value;
  const m = from?.match(/(?:sips?|tel):\+?([0-9][0-9\-. ()]*)/i);
  const digits = m ? m[1].replace(/[^0-9]/g, '') : '';
  return digits ? `+${digits}` : null;
}

/** Who a known number is, and whether their calls leave a sealed record.
 *  `writeback` names the block the record is appended to; `key_env` names
 *  the environment variable holding that handle's key. Both or neither. */
export interface Caller { handle: string; writeback?: string; key_env?: string }

/** The private map from number to handle — env CALLERS, a JSON object such as
 *  {"+447700900123": "happyseaurchin"} or {"+44…": {"handle": "…", "writeback":
 *  "…", "key_env": "…"}}. It lives in the gateway's environment and never in a
 *  block: a phone number is personal data, and the beach is public by design. */
export function parseCallers(json: string | undefined): Map<string, Caller> {
  const out = new Map<string, Caller>();
  if (!json) return out;
  let raw: Record<string, string | Caller>;
  try { raw = JSON.parse(json); } catch { throw new Error('CALLERS is not valid JSON — see gateway/README.md'); }
  for (const [num, v] of Object.entries(raw)) {
    const caller = typeof v === 'string' ? { handle: v } : v;
    const key = callerNumber([{ name: 'From', value: `tel:${num}` }]);
    if (key && caller && typeof caller.handle === 'string' && caller.handle) out.set(key, caller);
  }
  return out;
}

const OWN_CONTEXT = '═══════════ YOUR OWN CONTEXT';

/** The voice's instructions: how to speak, then the window the beach's door
 *  compiled for this handle, own context first and the room after, capped so
 *  a long room never crowds out who the caller is. */
export function voiceInstructions(handle: string, window: string, capChars = 24000): string {
  const law = [
    `You are the voice of ${handle}'s own shell on the beach (beach.happyseaurchin.com), answering a phone call from ${handle}.`,
    `Below is what the beach compiled from their shell before you spoke: who they are, what they keep, and who has been speaking in their room. Answer from it. It was laid out for a text session, so ignore any line in it about rendering scenes, formatting or tool syntax — you are speaking.`,
    `Speak as one person to another: short turns of one to three sentences, plain words, no lists, and never read out block names, addresses, JSON or links.`,
    `When an answer needs something not below, you may read the beach with the bsp tool — say "one moment" first, because a lookup is an audible pause. Do not write to the beach in this call.`,
    `If their shell does not say, say you don't know; never invent it.`,
    `Begin by greeting ${handle} by name in one short sentence.`,
  ].join('\n');
  const at = window.indexOf(OWN_CONTEXT);
  const ordered = at > 0 ? `${window.slice(at)}\n\n${window.slice(0, at)}` : window;
  const body = ordered.length > capChars ? `${ordered.slice(0, capChars)}\n… (the rest of the window is cut for the call)` : ordered;
  return `${law}\n\n${body}`;
}

export interface SessionOptions { model: string; voice: string; mcpUrl: string; transcribeModel: string }

/** The body that accepts a call (POST /v1/realtime/calls/{call_id}/accept):
 *  the realtime session, the caller's words transcribed so a record can be
 *  left, and the beach as its one MCP server, limited to bsp(). */
export function acceptBody(instructions: string, o: SessionOptions) {
  return {
    type: 'realtime' as const,
    model: o.model,
    instructions,
    audio: { input: { transcription: { model: o.transcribeModel } }, output: { voice: o.voice } },
    tools: [{
      type: 'mcp' as const,
      server_label: 'beach',
      server_url: o.mcpUrl,
      server_description: 'The beach: public pscale blocks of shells, rooms and projects, read with bsp().',
      allowed_tools: ['bsp'],
      require_approval: 'never' as const,
    }],
    tool_choice: 'auto' as const,
  };
}

export interface Turn { who: 'caller' | 'voice'; text: string }

/** What a call's events add up to: the turns in order, how long each answer
 *  took to start (from the caller falling silent to the voice's first audio),
 *  and the tokens it cost. Fed one realtime server event at a time. */
export class CallLog {
  turns: Turn[] = [];
  latenciesMs: number[] = [];
  inputTokens = 0;
  outputTokens = 0;
  private silentAt: number | null = null;

  constructor(readonly startedAt: number) {}

  onEvent(ev: any, now = Date.now()): void {
    switch (ev?.type) {
      case 'input_audio_buffer.speech_stopped':
        this.silentAt = now;
        break;
      case 'response.output_audio.delta':
        if (this.silentAt !== null) { this.latenciesMs.push(now - this.silentAt); this.silentAt = null; }
        break;
      case 'conversation.item.input_audio_transcription.completed':
        if (ev.transcript?.trim()) this.turns.push({ who: 'caller', text: ev.transcript.trim() });
        break;
      case 'response.output_audio_transcript.done':
        if (ev.transcript?.trim()) this.turns.push({ who: 'voice', text: ev.transcript.trim() });
        break;
      case 'response.done':
        this.inputTokens += ev.response?.usage?.input_tokens ?? 0;
        this.outputTokens += ev.response?.usage?.output_tokens ?? 0;
        break;
    }
  }

  /** The median wait for an answer to start, the number stage one measures. */
  medianLatencyMs(): number | null {
    if (!this.latenciesMs.length) return null;
    const s = [...this.latenciesMs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }

  /** One line for the gateway's log: the measurements, never the words. */
  summary(handle: string, endedAt = Date.now()): string {
    const minutes = ((endedAt - this.startedAt) / 60000).toFixed(1);
    const median = this.medianLatencyMs();
    return `call ${handle} · ${minutes} min · ${this.turns.length} turns · answer starts after ${median === null ? '—' : `${(median / 1000).toFixed(2)} s`} (median) · tokens in ${this.inputTokens} out ${this.outputTokens}`;
  }

  /** The record a call leaves when its holder asked for one: written sealed,
   *  so only the holder's key reads it back. */
  record(handle: string, endedAt = Date.now(), capChars = 6000): string {
    const words = this.turns.map((t) => `${t.who === 'caller' ? handle : 'voice'}: ${t.text}`).join('\n');
    const head = `Call with the beach voice, ${new Date(this.startedAt).toISOString()}. ${this.summary(handle, endedAt)}.`;
    const all = `${head}\n${words}`;
    return all.length > capChars ? `${all.slice(0, capChars)}\n… (cut)` : all;
  }
}
