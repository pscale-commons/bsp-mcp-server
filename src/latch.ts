/**
 * latch.ts — THE DERIVED LATCH AT THE ROUTER (proposals/2026-11-05-the-derived-latch.md §4, §5;
 * coloured stigmergy §4.2: one word, two keys).
 *
 * A word typed once makes two keys: the sealing pair the beach never sees, and the latch the beach
 * checks, deriveLatch(word, handle) (src/keys.ts, byte for byte the beach's seal.js). Which of the
 * two a handle's latches are in is said by the handle's own passport, at 9.3 beside its published
 * halves: "latch: derived …". Every place a latch leaves this router for a beach asks latchFor()
 * what to send — db.ts's write and append, the settle, the grain reach — and it sends the derived
 * latch where both hold:
 *   1. the hand's passport at that beach carries the marker; and
 *   2. the string derives the halves at 9.1 and 9.2, so it IS that hand's word;
 * and the string as it is otherwise. A shared lock, an operator's key or a delegated latch derives
 * no hand's halves, so it is never derived and never moved.
 *
 * A HOST THAT LIES (§4.4). Once this process has seen a hand switched at a beach, a passport there
 * without the marker is a refusal, never a reason to send the word. Once the marker says swept, a
 * block that refuses the latch is a refusal naming the block: the word goes again only when the
 * holder runs the switch again (pscale_key_publish, latch: "derived"), which also moves the blocks
 * the session was refused at. While the switch is still running, a refusing block is moved on the
 * spot: its root probed with no key, rotated from the word to the latch, the write sent again.
 *
 * The proof at a members' beach cannot read a passport before it proves, so src/pass.ts proves in
 * the form this process last proved with for that hand there, else the latch first (proofForms).
 */

import * as wire from './pscale-wire.js';
import { doorHere } from './pass.js';
import { deriveKeypair, deriveLatch, formatPublicKeys, keysMatch, publicKeysFromSpine, type PublicKeyPair } from './keys.js';

const TIMEOUT = 8000;
const NAME = /^[A-Za-z0-9_-]{1,64}$/;
const MARKER = /^latch: derived\b/;
const SWEPT = / · swept \d{4}-\d{2}-\d{2}T/;
/** A refusal that is about the key: the beach's own words for a latch not proved. */
const KEYISH = /secret does not match|lock rotation requires|secret required|whose passport is locked/;

/** The marker's exact text (the build spec §2.1). */
export function markerText(handle: string, since: string, swept?: string): string {
  return `latch: derived — this word reaches a beach only as the latch derived from it (seal.js latch: Argon2id, salt latch:${handle}), never as itself · since ${since}${swept ? ` · swept ${swept}` : ''}`;
}
export const isDerived = (nine: any): boolean => !!nine && typeof nine === 'object' && typeof nine['3'] === 'string' && MARKER.test(nine['3']);
export const isSwept = (nine: any): boolean => isDerived(nine) && SWEPT.test(nine['3']);
export const stampNow = (): string => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
export const refusedForKey = (r: { ok: boolean; status?: number; error?: string }): boolean =>
  !r.ok && r.status === 403 && KEYISH.test(String(r.error ?? ''));

const at = (origin: string) => String(origin).trim().replace(/\/\.well-known\/pscale-beach.*$/i, '').replace(/\/+$/, '').toLowerCase();
const session = () => doorHere()?.session ?? '';
/** The handle a block is named for: the part after its last colon (sed: and grain: name none). */
function handleOf(block: string): string | null {
  if (/^(sed|grain|archive):/.test(block)) return null;
  const cut = block.lastIndexOf(':');
  const h = cut > 0 ? block.slice(cut + 1) : '';
  return NAME.test(h) ? h : null;
}

/** Each session's read of a hand's 9 at a beach. */
const nines = new Map<string, any>();
/** The hands this process has seen switched at a beach, with the halves it saw — never believed gone. */
const switched = new Map<string, PublicKeyPair>();
/** The blocks a session was refused at after a sweep, for the switch run again. */
const refusedAt = new Map<string, Set<string>>();
/** The form each hand last proved with at a members' beach. */
const proved = new Map<string, 'latch' | 'word'>();

async function nineOf(origin: string, hand: string): Promise<any> {
  const k = `${session()}|${at(origin)}|${hand}`;
  if (nines.has(k)) return nines.get(k);
  let nine: any;
  try {
    const p: any = await wire.loadBlock(origin, `passport:${hand}`, { timeoutMs: TIMEOUT });
    nine = p && typeof p === 'object' ? p['9'] ?? null : null;
  } catch {
    return 'unread';   // behind a wall before a pass, or the beach did not answer: the proof decides
  }
  if (nines.size >= 512) nines.delete(nines.keys().next().value!);
  nines.set(k, nine);
  return nine;
}

/** After a switch writes or moves the marker, the session reads the passport afresh. */
export function forgetNine(origin: string, hand: string): void {
  for (const k of [...nines.keys()]) if (k.endsWith(`|${at(origin)}|${hand}`)) nines.delete(k);
}
/** The holder switched back (latch: "word"): this process stops holding the hand to the marker. */
export function forgetSwitched(origin: string, hand: string): void { switched.delete(`${at(origin)}|${hand}`); }

async function derives(s: string, hand: string, halves: PublicKeyPair): Promise<boolean> {
  return keysMatch(formatPublicKeys(await deriveKeypair(s, hand)), halves);
}

export interface Latch {
  /** What goes to the beach as the latch. */
  send: string;
  /** Set only where the latch was derived: the hand, the word it came from, and whether its switch has swept. */
  hand?: string;
  word?: string;
  swept?: boolean;
}

/** What to send a beach in place of `s`, for a write to `block`. */
export async function latchFor(origin: string, block: string, s: string | undefined | null, hands: Array<string | null | undefined> = []): Promise<Latch> {
  if (typeof s !== 'string' || s === '') return { send: s as any };
  const cands = [...new Set([...hands, ...(doorHere()?.handles ?? []), handleOf(block)])]
    .filter((h): h is string => typeof h === 'string' && NAME.test(h));
  for (const h of cands) {
    const nine = await nineOf(origin, h);
    if (nine === 'unread') continue;
    const k = `${at(origin)}|${h}`;
    if (isDerived(nine)) {
      const halves = publicKeysFromSpine(nine);
      if (!halves) continue;
      switched.set(k, halves);
      if (await derives(s, h, halves)) return { send: await deriveLatch(s, h), hand: h, word: s, swept: isSwept(nine) };
    } else {
      const seen = switched.get(k);
      if (seen && await derives(s, h, seen)) throw new Error(stripped(origin, h));
    }
  }
  return { send: s };
}

function stripped(origin: string, h: string): string {
  return `refused before sending: ${at(origin)} no longer says ${h}'s key is derived — passport:${h} 9.3 stood there when this router last read it, and it is gone — so nothing was sent. The word does not go to a beach that stops saying its form (proposals/2026-11-05-the-derived-latch.md §4.4). If ${h} switched back on purpose, pscale_key_publish(handle: "${h}", secret: <the word>, latch: "word") from a session holding the word says so here; otherwise this beach is answering for a passport it should not.`;
}

/** A block that refused the latch after the sweep: a refusal naming it, kept for the switch run again. */
export function sweptRefusal(origin: string, block: string, h: string): Error {
  const k = `${session()}|${at(origin)}|${h}`;
  if (!refusedAt.has(k)) refusedAt.set(k, new Set());
  refusedAt.get(k)!.add(block);
  return new Error(`${block} still answers to ${h}'s word, not the latch derived from it, and ${h}'s switch has swept, so the word is not sent unasked (proposals/2026-11-05-the-derived-latch.md §4.4). To move it, run pscale_key_publish(handle: "${h}", secret: <the word>, latch: "derived") again: it moves this block too, and shows this beach the word once more.`);
}
export function refusedBlocks(origin: string, h: string): string[] {
  return [...(refusedAt.get(`${session()}|${at(origin)}|${h}`) ?? [])];
}

/** A lock-only post: a rotation, or (new_lock null, no secret) the keyless probe of whetstone 9.43. */
export function lockPost(origin: string, block: string, body: Record<string, any>) {
  return wire.postAction(origin, block, body, { timeoutMs: TIMEOUT });
}
/** A write the switch makes itself, under the form it names: the switch is where the rule changes, so it writes past it. */
export function writeRaw(origin: string, block: string, spindle: string, content: any, secret: string) {
  return wire.writeAt(origin, block, spindle, content, { timeoutMs: TIMEOUT, secret });
}

/** While the switch runs: a block that refused the latch is moved at its root, when its root is latched. */
export async function moveOnTheSpot(origin: string, block: string, t: Latch): Promise<boolean> {
  if (!t.hand || !t.word || t.swept || /^(sed|grain):/.test(block)) return false;
  const probe = await lockPost(origin, block, { new_lock: null });
  if (probe.ok || probe.status !== 403) return false;      // an open root: the position holds a latch of its own
  return (await lockPost(origin, block, { secret: t.word, new_lock: t.send })).ok;
}

/** A write under the latch latchFor gave. Refused for its key while the switch runs, the block is
 *  moved on the spot and written again, and a position with a latch of its own is written with the
 *  word this once; refused after the sweep, it is a refusal naming the block. */
export async function sendUnder<T extends { ok: boolean; status?: number; error?: string }>(
  origin: string, block: string, t: Latch, post: (secret: string | undefined) => Promise<T>,
): Promise<T> {
  let r = await post(t.send);
  if (!t.hand || !refusedForKey(r)) return r;
  if (t.swept) throw sweptRefusal(origin, block, t.hand);
  if (await moveOnTheSpot(origin, block, t)) r = await post(t.send);
  return refusedForKey(r) ? post(t.word) : r;
}

/** The sweep: every candidate probed with no key, then its root rotated from one form to the other.
 *  Run again (`movedFirst`), a block is first tried in the new form rotated to itself, so what the
 *  first run moved costs no wrong key. */
export type Swept = { moved: string[]; already: string[]; open: string[]; refused: string[]; skipped: string[] };
export async function sweep(origin: string, blocks: string[], from: string, to: string, movedFirst = false): Promise<Swept> {
  const out: Swept = { moved: [], already: [], open: [], refused: [], skipped: [] };
  const queue = [...new Set(blocks)];
  async function one(b: string) {
    if (/^(sed|grain):/.test(b)) { out.skipped.push(b); return; }
    const probe = await lockPost(origin, b, { new_lock: null });
    if (probe.ok) { out.open.push(b); return; }
    if (probe.status !== 403) { out.skipped.push(b); return; }
    if (movedFirst && (await lockPost(origin, b, { secret: to, new_lock: to })).ok) { out.already.push(b); return; }
    ((await lockPost(origin, b, { secret: from, new_lock: to })).ok ? out.moved : out.refused).push(b);
  }
  await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await one(queue.shift()!); }));
  return out;
}

/** The forms to prove with at a members' beach, in order (§4.2, behind a wall). */
export async function proofForms(origin: string, hand: string, s: string): Promise<Array<{ form: 'latch' | 'word'; key: string }>> {
  const was = proved.get(`${at(origin)}|${hand}`);
  if (was === 'word') return [{ form: 'word', key: s }];
  const latch = { form: 'latch' as const, key: await deriveLatch(s, hand) };
  return was === 'latch' ? [latch] : [latch, { form: 'word', key: s }];
}
export function provedWith(origin: string, hand: string, form: 'latch' | 'word'): void { proved.set(`${at(origin)}|${hand}`, form); }
