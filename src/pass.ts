/**
 * THE DOOR AND THE PASS — how the router reads and writes at a members' beach
 * (pscale-beach's gate; docs/protocol-pscale-beach-v2.md 2.8; proposals/2026-11-02-
 * leros-on-the-commons-the-build-to-completion.md §4.2 item 5, step 6).
 *
 * A gated beach answers a stranger 401 members_only and serves a member who sends
 * a PASS as Authorization: Bearer — a pass the beach mints when the member proves
 * their passport's latch once (POST {block: 'passport:<handle>', secret}, no
 * content), good for twelve hours. The router never holds a secret longer than
 * the call that carried it: a tool call stands AT THE DOOR with the hand it acts
 * as and the secret it was given, and when a beach refuses with 401 the wire
 * proves the passport of that hand with that secret, remembers the pass for the
 * session, and retries once. Every later call of the session carries the pass
 * and needs no secret. A call with no secret at hand surfaces the beach's own
 * line and the one way through: prove once with bsp().
 *
 * Minimal by design: one module, one ambient context (AsyncLocalStorage, set by
 * each tool's entry), one map of passes per session and beach, forgotten with the
 * process. pscale-wire.ts stays free of Node imports — it takes these as hooks.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { setDoorHooks } from './pscale-wire.js';
import { proofForms, provedWith } from './latch.js';

export interface Door {
  /** The transport's session — one per instance through the door. */
  session?: string;
  /** The hands this call may prove as: the session's declared hand, the handle
   *  a block is named for. Tried in order; the first latch the secret opens wins. */
  handles: Array<string | null | undefined>;
  /** The latch proof the call carried — never enc_secret, which seals and proves nothing. */
  secret?: string;
  /** Set by the wire when a pass was minted during this call, for the ack. */
  minted?: { origin: string; handle: string; expires: string };
  /** Beaches where this call's proof was refused. A refused proof counts against the
   *  passport's wrong keys, so it is tried once a call, however many reads follow. */
  refused?: Set<string>;
  /** The status the beach last refused a proof with (404 no such passport, 403 the key does
   *  not open it, 429 too many wrong keys this hour), for a refusal said in its own words. */
  refusedWith?: number;
}

interface Pass { token: string; exp: number; handle: string; expires: string }

const door = new AsyncLocalStorage<Door>();
const passes = new Map<string, Pass>();

/** Run a tool call at the door: its hand and secret are at hand for every wire call beneath. */
export function atTheDoor<T>(d: Door, fn: () => Promise<T>): Promise<T> {
  return door.run(d, fn);
}
export function doorHere(): Door | undefined { return door.getStore(); }

function originKey(origin: string): string {
  return String(origin).trim().replace(/\/\.well-known\/pscale-beach.*$/i, '').replace(/\/+$/, '').toLowerCase();
}
function passKey(session: string | undefined, origin: string): string {
  return `${session ?? ''}|${originKey(origin)}`;
}

/** The pass this session holds for a beach, if any and not yet expired. */
export function passFor(origin: string): string | null {
  const d = door.getStore();
  const p = passes.get(passKey(d?.session, origin));
  if (!p) return null;
  if (p.exp <= Date.now() + 5_000) { passes.delete(passKey(d?.session, origin)); return null; }
  return p.token;
}
export function forgetPass(origin: string): void {
  passes.delete(passKey(door.getStore()?.session, origin));
}

/** The line a stranger is given: the beach's own, the one way through for a member, and the
 *  way in for a newcomer, who has no passport there to prove and whose AI cannot take an invitation. */
export function membersOnlyLine(origin: string, beachLine: string | undefined): string {
  const o = originKey(origin);
  const d = door.getStore();
  const who = d?.handles.find((h) => typeof h === 'string' && h) ?? '<your handle>';
  return `${beachLine || `${o} is its members' beach`} — prove your passport once in this session: bsp(agent_id="${o}", block="passport:${who}", secret=<your passphrase>) ; the router then carries your pass there for twelve hours, on every read and write. A newcomer has no passport here to prove: a member of this beach sends an invitation, and its link opens the String's join on the beach's own site, which founds the passport and makes the key; no AI app can take an invitation, so the newcomer joins there first and proves the new passport here after.`;
}

/** A refusal at the door, as the error it is: the one answer a stranger gets, from any tool. */
export function refusedAtDoor(e: unknown): { isError: true; content: { type: 'text'; text: string }[] } {
  return { isError: true, content: [{ type: 'text', text: String((e as any)?.message ?? e).replace(/^Beach [a-z ]+ failed \([^)]*\): /, '') }] };
}

/** Prove the door's hand at a beach: the beach's own proof request, a plain fetch
 *  (never the wire's, which would loop). The first latch the secret opens mints the pass. */
export async function proveAtDoor(origin: string, timeoutMs: number): Promise<string | null> {
  const d = door.getStore();
  if (!d || typeof d.secret !== 'string' || d.secret === '') return null;
  if (d.refused?.has(originKey(origin))) return null;
  const tried = new Set<string>();
  for (const h of d.handles) {
    if (typeof h !== 'string' || !h || tried.has(h) || /[\s:\/]/.test(h)) continue;
    tried.add(h);
    // THE DERIVED LATCH behind a wall (src/latch.ts): the passport cannot be read before the proof,
    // so the hand proves in the form it last proved with here, else the derived latch first.
    for (const { form, key } of await proofForms(origin, h, d.secret)) {
      try {
        const r = await fetch(`${originKey(origin)}/.well-known/pscale-beach`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ block: `passport:${h}`, secret: key }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (r.status !== 200) { d.refusedWith = r.status; continue; }
        const j: any = await r.json().catch(() => null);
        if (!j || typeof j.pass !== 'string') continue;
        provedWith(origin, h, form);
        const exp = Date.parse(j.expires) || Date.now() + 11 * 60 * 60 * 1000;
        passes.set(passKey(d.session, origin), { token: j.pass, exp, handle: h, expires: j.expires });
        d.minted = { origin: originKey(origin), handle: h, expires: j.expires };
        return j.pass;
      } catch { /* this form did not open it; try the next */ }
    }
  }
  (d.refused ??= new Set()).add(originKey(origin));
  return null;
}

/** A refusal at the door, however deep it was rethrown: the one answer a stranger gets. */
export function isDoorRefusal(e: unknown): boolean {
  return /prove your passport once in this session/.test(String((e as any)?.message ?? e));
}

/** The ack's line when this call earned a pass. */
export function mintedLine(d: Door | undefined): string {
  return d?.minted ? `\n✓ a pass for ${d.minted.handle} at ${d.minted.origin} until ${d.minted.expires}: this session reads and writes there as ${d.minted.handle}.` : '';
}

setDoorHooks({ pass: passFor, prove: proveAtDoor, forget: forgetPass, refusal: membersOnlyLine });
