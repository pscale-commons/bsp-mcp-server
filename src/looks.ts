/** THE REFLECTION — the torus at the same-moment rung, made by the door.
 *
 *  David's ruling, 2026-09-28: the beach may reflect a read, anonymously and
 *  ephemerally. The router is a door every instance calls through, so the
 *  reflection lives here. Each call it serves is a LOOK — a beach, a block, an
 *  address, an instant, and the hand if this session walked through the play
 *  door — held in process memory for a short window and written nowhere. On
 *  the way back, every ack gains one lateral line: who else looked or wrote at
 *  this block just now, nearest address first. That is the whole mechanic, and
 *  it costs the mind nothing: no post, no register, no declaration — its
 *  ordinary calls are the reflection, as a person's ordinary standing before a
 *  mirror is. In pscale what you look for IS where you look, so a look at an
 *  address is already the request, content-free.
 *
 *  What it is not. Not a block, not a family, not a stream at the beat: the
 *  torus-mirror family of 2026-09-14 wrote a record per ask and called it live,
 *  and a record is a photograph where a mirror stores nothing. Not presence,
 *  which is a tab's heartbeat and belongs to the glass. Not a name on a read: a
 *  read carries no handle, so a session that never walked through the play door
 *  is reflected as 'someone'. Sentinel reads are not reflected — the teaching is
 *  not a place. The window is the response rung, not the clock: two minutes by
 *  default (LOOKS_WINDOW_MS), the span in which two minds mid-response overlap.
 *  One process is one pane; a second replica would be a second pane.
 *
 *  proposals/2026-09-28-the-torus-is-a-reflection.md
 */

export const LOOKS_WINDOW_MS = Number(process.env.LOOKS_WINDOW_MS ?? 120_000);
const CAP = 2000;
const SHOW = 5;

export interface Look {
  session: string;
  beach: string;
  block: string;
  spindle: string;   // '' = the root
  wrote: boolean;
  ts: number;
}

const ring: Look[] = [];
const hands = new Map<string, string>();

/** One key for a beach however a door spells it. */
export function beachKey(url: string | null | undefined): string {
  return String(url ?? '')
    .trim()
    .replace(/\/\.well-known\/pscale-beach.*$/i, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

/** The play door: this session now walks as a hand. */
export function declareHand(session: string | undefined, handle: string): void {
  if (!session || !handle) return;
  hands.set(session, handle);
}

export function handOf(session: string | undefined): string | null {
  return session ? hands.get(session) ?? null : null;
}

/** A call served: reflect it. */
export function noteLook(
  session: string | undefined,
  beach: string,
  block: string,
  spindle: string | null | undefined,
  wrote: boolean,
  now: number = Date.now(),
): void {
  if (!session || !block) return;
  ring.push({ session, beach: beachKey(beach), block, spindle: spindle ?? '', wrote, ts: now });
  prune(now);
}

function prune(now: number): void {
  const cutoff = now - LOOKS_WINDOW_MS;
  let i = 0;
  while (i < ring.length && ring[i].ts < cutoff) i++;
  if (i > 0) ring.splice(0, i);
  if (ring.length > CAP) ring.splice(0, ring.length - CAP);
}

/** Digits shared from the left, the decimal ignored: 4.26 and 4.2 share two. */
export function sharedPrefix(a: string, b: string): number {
  const x = a.replace(/[^0-9]/g, '');
  const y = b.replace(/[^0-9]/g, '');
  let n = 0;
  while (n < x.length && n < y.length && x[n] === y[n]) n++;
  return n;
}

function ago(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`;
}

/** The lateral line for a call at (beach, block, spindle) by this session: the
 *  latest look of every OTHER session at the same block within the window,
 *  nearest address first, then most recent. '' when nobody. */
export function lateralLine(
  session: string | undefined,
  beach: string,
  block: string,
  spindle: string | null | undefined,
  now: number = Date.now(),
): string {
  prune(now);
  const key = beachKey(beach);
  const mine = spindle ?? '';
  const latest = new Map<string, Look>();
  for (const l of ring) {
    if (l.session === session || l.beach !== key || l.block !== block) continue;
    const prev = latest.get(l.session);
    if (!prev || l.ts > prev.ts) latest.set(l.session, l);
  }
  if (latest.size === 0) return '';
  const others = [...latest.values()].sort(
    (a, b) => sharedPrefix(b.spindle, mine) - sharedPrefix(a.spindle, mine) || b.ts - a.ts,
  );
  const shown = others
    .slice(0, SHOW)
    .map(l => `${handOf(l.session) ?? 'someone'} ${l.wrote ? 'wrote' : 'looked'} at ${l.spindle || 'the root'} (${ago(now - l.ts)})`);
  const more = others.length > SHOW ? ` · +${others.length - SHOW} more` : '';
  const w = Math.round(LOOKS_WINDOW_MS / 1000);
  return `\n[here now — ${others.length} other${others.length === 1 ? '' : 's'} at this block in the last ${w}s: ${shown.join(' · ')}${more}]`;
}

/** Ride the reflection onto an ack: note the call, then append the line. */
export function reflect(
  res: { content: { type: 'text'; text: string }[] },
  session: string | undefined,
  beach: string,
  block: string,
  spindle: string | null | undefined,
  wrote: boolean,
): { content: { type: 'text'; text: string }[] } {
  try {
    noteLook(session, beach, block, spindle, wrote);
    const line = lateralLine(session, beach, block, spindle);
    if (!line) return res;
    const last = res.content[res.content.length - 1];
    if (last && last.type === 'text') last.text += line;
  } catch {
    /* the reflection never breaks the ack it rides on */
  }
  return res;
}

/** For tests: forget everything. */
export function resetLooks(): void {
  ring.length = 0;
  hands.clear();
}
