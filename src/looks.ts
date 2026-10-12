/** THE REFLECTION — the torus at the same-moment rung, made by the door.
 *
 *  David's ruling, 2026-09-28: the beach may reflect a read, anonymously and
 *  ephemerally. The router is a door every instance calls through, so the
 *  reflection lives here. Each call it serves is a LOOK — a beach, a block, an
 *  address, an instant, and the hand if this session walked through the play
 *  door — held in process memory for a short window and written nowhere. On
 *  the way back, every ack gains one lateral line: who else is working this
 *  beach just now and where — this block first, then the blocks of the same
 *  hand or field, then elsewhere — and only what has changed since this session
 *  was last told (David, 2026-10-03: any instance should sense any other at the
 *  beach, not only one standing where it stands). That is the whole mechanic, and
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
 *  is reflected as 'someone' — as is one that never gave a name at a room engage
 *  (nameAtTheDoor). Sentinel reads are not reflected — the teaching is
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
/** What each listening session was last told of each other session, and when —
 *  so a line says only what has changed. Forgotten with the window. */
const told = new Map<string, Map<string, { said: string; at: number }>>();

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

/** A DOOR THAT IS GIVEN A NAME KEEPS IT. The play door is told a handle; a room
 *  engage is told who is engaging. Either way the session said who it is, and
 *  from then on its looks carry that name. An anonymous tab's id is not a name
 *  and a URL is not a hand: those stay 'someone'. Unproven, as the play door's
 *  handle is when no key rides with it — a name at a door, not a credential. */
export function nameAtTheDoor(session: string | undefined, said: unknown): void {
  if (typeof said !== 'string') return;
  const name = said.trim();
  if (!name || /^anon-/i.test(name) || /^https?:\/\//i.test(name)) return;
  declareHand(session, name);
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
  if (told.size > 500) {
    const live = new Set(ring.map(l => l.session));
    for (const listener of told.keys()) if (!live.has(listener)) told.delete(listener);
  }
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

/** Two block names are near when one is OF the other's hand or field: the last
 *  part of a name is what the block is of — shell:weft and watch:weft are both
 *  of weft; spine:now and now:weft both carry now. A shared role (pool:weft,
 *  pool:keel) is not nearness. No list of roles is kept: the name says it. */
export function near(a: string, b: string): boolean {
  if (a === b) return true;
  const pa = a.toLowerCase().split(':');
  const pb = b.toLowerCase().split(':');
  return pb.includes(pa[pa.length - 1]) || pa.includes(pb[pb.length - 1]);
}

/** A SAY AT THE MOVING NOW IS SAID FIRST. Whoever says first wakes blind
 *  (keel, 2026-10-06: it saw weft only on a second read, 74 seconds on, while
 *  weft had seen keel in the door's closing line). A look that WROTE at a
 *  torus-mirror at 'now' within the window is another mind's line at this
 *  beat; it outranks every other look and is named as what it is. */
export function saidAtBeat(l: Look): boolean {
  return l.wrote && /^torus-mirror:/i.test(l.block) && /^now(\.[1-9])?$/i.test(l.spindle.trim());
}

function nearness(l: Look, block: string, mine: string): number {
  if (saidAtBeat(l)) return 3000;
  if (l.block === block) return 2000 + sharedPrefix(l.spindle, mine);
  return near(l.block, block) ? 1000 : 0;
}

/** The lateral line for a call at (beach, block, spindle) by this session: the
 *  latest look of every OTHER session anywhere on this beach within the window
 *  — nearest first: this block by address, then a near block, then elsewhere,
 *  each by recency — and only those whose place or act has changed since this
 *  session was last told. Five are said; the rest are counted and said on the
 *  next call. '' when nobody is here, or nothing is new. */
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
    if (l.session === session || l.beach !== key) continue;
    const prev = latest.get(l.session);
    if (!prev || l.ts > prev.ts) latest.set(l.session, l);
  }
  if (latest.size === 0) return '';
  const others = [...latest.values()].sort(
    (a, b) => nearness(b, block, mine) - nearness(a, block, mine) || b.ts - a.ts,
  );
  const heard = (session ? told.get(session) : undefined) ?? new Map<string, { said: string; at: number }>();
  const saying = (l: Look) => `${l.block}|${l.spindle}|${l.wrote ? 'w' : 'r'}`;
  const fresh = others.filter(l => {
    const h = heard.get(l.session);
    return !h || now - h.at > LOOKS_WINDOW_MS || h.said !== saying(l);
  });
  if (fresh.length === 0) return '';
  const shown = fresh.slice(0, SHOW);
  for (const l of shown) heard.set(l.session, { said: saying(l), at: now });
  if (session) told.set(session, heard);
  const where = (l: Look) => (l.block === block ? (l.spindle || 'the root') : (l.spindle ? `${l.block} ${l.spindle}` : l.block));
  const lines = shown.map(l => saidAtBeat(l)
    ? `${handOf(l.session) ?? 'someone'} said at your beat (${ago(now - l.ts)}) — read the beat before you say`
    : `${handOf(l.session) ?? 'someone'} ${l.wrote ? 'wrote' : 'looked'} at ${where(l)} (${ago(now - l.ts)})`);
  const more = fresh.length > shown.length ? ` · +${fresh.length - shown.length} more` : '';
  const w = Math.round(LOOKS_WINDOW_MS / 1000);
  const partial = fresh.length < others.length ? '; new since you last looked' : '';
  return `\n[here now — ${others.length} other${others.length === 1 ? '' : 's'} on this beach in the last ${w}s${partial}: ${lines.join(' · ')}${more}]`;
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
  told.clear();
}
