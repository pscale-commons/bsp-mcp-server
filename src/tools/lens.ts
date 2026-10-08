/**
 * lens.ts — THE LENS: one hand's way of seeing a table, and the shot composed
 * at a moment (function:lens, founded 2026-10-08 at David's word; the record at
 * proposals/2026-10-08-the-studio-on-the-clock.md as amended by #513).
 *
 * A lens is a family on the table's clock. Each watching hand says its line
 * about a moment in its own mirror, lens:<handle>, at the moment's beat; whom it
 * listens to is branch 4 of its own lists; its fold — THE SHOT — lands in its
 * own tree and its picture in its own book, on its own keys. Nothing here is
 * new machinery: the stream door says and keeps as it always has. This file
 * holds the two things the door needs to know of a lens:
 *
 *  - FOLLOWING (function:lens 2): a hand's snapshot is the mirrors of the
 *    hands it follows, and its own — read off lists:<handle> 4 at the hand's
 *    home beach, rank as depth.
 *  - THE SHOT (function:lens 6): tier='medium' at a moment composes one call —
 *    the law, the bundle at the beat (the moment as the table's record holds
 *    it, the place, the people in frame, the cast's looks and faces, the
 *    followed lines, the look), and the contract — so every seat runs the same
 *    synthesis on its own key, as the three tiers of play are composed.
 */
import { Block, readAt } from '../bsp.js';
import { loadBlock, loadBeachIndex, DEFAULT_BEACH } from '../db.js';
import { addressToSpan } from '../temporal.js';
import { collectContributions } from './pool.js';
import { tableWorld, worldBlock, blockOf, passportsAt, sheetOf, placeWalk, P, joinParts, type Composed, type Part } from './tiers.js';

// ── small readers, local by intent (stream.ts imports this file) ─────────────

export function lensVoice(node: unknown): string | null {
  let n: unknown = node;
  while (n && typeof n === 'object') n = (n as Record<string, unknown>)['_'];
  return typeof n === 'string' && n.trim() ? n : null;
}
const digitKeys = (n: unknown): string[] =>
  n && typeof n === 'object' ? Object.keys(n as object).filter((k) => /^[1-9]$/.test(k)).sort() : [];
const clipTo = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

/** Does this family's law keep a lens? Its 2 opens FOLLOWING, or its 6 mounts
 *  the recipe — either is the lens law speaking; a family that says neither is
 *  read as every family was. */
export function lensLaw(op: Block | null): { following: boolean; recipe: boolean } {
  const two = lensVoice((op as any)?.['2']) ?? '';
  const six = lensVoice((op as any)?.['6']) ?? '';
  return { following: /^\s*FOLLOWING\b/i.test(two), recipe: /^\s*THE RECIPE MOUNTED\b/i.test(six) };
}

/** THE FOLLOWS — branch 4 of lists:<handle>, rank as depth (4.1, 4.11, 4.111 …),
 *  read at the hand's home beach. Pure over the block; the reader beneath. */
export function followsIn(lists: Block | null): string[] {
  const out: string[] = [];
  let rung: unknown = (lists as any)?.['4']?.['1'];
  while (rung && typeof rung === 'object') {
    const who = lensVoice(rung);
    if (who) out.push(who.trim());
    rung = (rung as Record<string, unknown>)['1'];
  }
  return out;
}
export async function followsOf(handle: string): Promise<string[]> {
  const lists = blockOf(await loadBlock(DEFAULT_BEACH, `lists:${handle}`).catch(() => null));
  return followsIn(lists);
}

// ── the moment ──────────────────────────────────────────────────────────────

export interface Moment { room: string; slot: number; who: string; text: string; ts: string; woven: string[] }

/** THE MOMENTS AT A BEAT — every telling the table's rooms recorded within the
 *  beat's span. A room's record is public and timestamped, so the clock finds a
 *  moment with nothing configured (a time names its beat). */
export function momentsIn(pool: Block, room: string, start: Date, end: Date): Moment[] {
  return collectContributions(pool, 0).contributions
    .filter((c) => c.text && c.text.trim() && c.ts)
    .filter((c) => { const t = Date.parse(c.ts as string); return Number.isFinite(t) && t >= start.getTime() && t < end.getTime(); })
    .map((c) => ({
      room, slot: c.position, who: c.agent_id ?? 'someone',
      text: c.text.split('\n').filter((l) => !/^\s*WAY\b/.test(l)).join('\n').trim(),
      ts: c.ts as string,
      woven: c.woven ? c.woven.split(',').map((w) => w.trim()).filter(Boolean) : [],
    }));
}

// ── the people in frame (ways:stills 6.6) ───────────────────────────────────

/** THE PRINCIPALS UNDER AN ADDRESS — the people register's figures beneath the
 *  moment's room (its own fan, or every room of a building when the record
 *  stands at one), each their own line, and their parts when the place holds
 *  three figures or fewer. A pointer line is followed to the person it names;
 *  an unnamed line rides as it stands, which leaves those people to the image
 *  model. The same rule the pictures page keeps (happyseaurchin-home #346). */
export function principalsUnder(people: Block, room: string): string {
  const at = (a: string): unknown => { let n: unknown = people; for (const d of a) n = n && typeof n === 'object' ? (n as any)[d] : undefined; return n; };
  const prefix = room.replace('.', '').replace(/0+$/, '').slice(0, 4);
  const figs: { node: unknown; said: string }[] = [];
  const seen = new Set<string>();
  const take = (c: unknown, a: string) => {
    let said = '';
    if (typeof c === 'string') {
      const m = c.match(/^(.*?)\s*—?\s*\*?:?(?:https?:\/\/\S+?:)?people:[a-z0-9-]+:(\d+)\.(\d+)\s*$/i);
      if (m) { said = m[1]; a = m[2] + m[3]; c = at(a); }
    }
    if (!c || seen.has(a)) return;
    seen.add(a); figs.push({ node: c, said });
  };
  if (prefix.length >= 4) take(at(prefix), prefix);
  else (function walk(n: unknown, p: string) {
    if (!n || typeof n !== 'object') return;
    for (const d of digitKeys(n)) { if ((p + d).length < 4) walk((n as any)[d], p + d); else take((n as any)[d], p + d); }
  })(at(prefix), prefix);
  const deep = figs.length <= 3;
  const lines: string[] = [];
  for (const f of figs) {
    const n = f.node;
    const out = [(f.said ? f.said + ' — ' : '') + (lensVoice(n) ?? '')];
    if (deep && n && typeof n === 'object') for (const d of digitKeys(n)) { if (d === '4') continue; const v = lensVoice((n as any)[d]); if (v) out.push(v); }
    const s = out.join(' ').trim();
    if (s && (lines.join(' · ') + s).length < 2600) lines.push(s);
  }
  return lines.join(' · ');
}

// ── faces (ways:stills 7) ───────────────────────────────────────────────────

/** THE FACE IS A VIEW across the books at the table and the apex books that
 *  reference it: the newest entry addressed to passport:<h>:3. A link, never bytes. */
export async function facesAt(origin: string, index: string[], handles: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!handles.length) return out;
  const want = new Map(handles.map((h) => [h.toLowerCase(), h]));
  const newest = new Map<string, { ts: string; img: string }>();
  const scan = (book: Block | null, local: boolean) => {
    (function walk(node: unknown) {
      if (!node || typeof node !== 'object') return;
      const n = node as Record<string, unknown>;
      if (n._ && typeof n._ === 'object') walk(n._);
      for (const k of digitKeys(n)) {
        const c = n[k] as Record<string, unknown>;
        if (c && typeof c === 'object' && typeof c['4'] === 'string' && typeof c['2'] === 'string') {
          const at = String(c['2']).replace(/^\*:/, '');
          const m = at.match(/^(?:(https?:\/\/\S+?):)?passport:([^:]+):3$/i);
          if (m && (local ? !m[1] || m[1].replace(/\/+$/, '') === origin : m[1]?.replace(/\/+$/, '') === origin)) {
            const h = want.get(m[2].toLowerCase());
            if (h) { const ts = String(c['3'] ?? ''); const cur = newest.get(h); if (!cur || ts > cur.ts) newest.set(h, { ts, img: c['4'] as string }); }
          }
        }
        walk(c);
      }
    })(book);
  };
  const books = async (o: string, names: string[], local: boolean) => {
    await Promise.all(names.filter((b) => b.startsWith('gallery:')).map(async (b) => scan(blockOf(await loadBlock(o, b).catch(() => null)), local)));
  };
  await books(origin, index, true);
  if (origin !== DEFAULT_BEACH) {
    const apex = await loadBeachIndex(DEFAULT_BEACH).catch(() => null);
    await books(DEFAULT_BEACH, apex?.blocks ?? [], false);
  }
  for (const [h, v] of newest) out.set(h, v.img);
  return out;
}

// ── THE SHOT ────────────────────────────────────────────────────────────────

export const SHOT_CONTRACT =
  `THIS CALL — you are the seat composing one shot of a moment of play, for the hand named at the head of THE INPUT, in the form they chose. ` +
  `Follow THE RECIPE in the order it states: the moment's telling; the place; the people in frame; the cast with their looks and faces; the look; ` +
  `and, after the telling, THE DIRECTION — the lines of the hands this hand follows at this moment, each taken as direction and attributed in your own words, never pasted as a transcript. ` +
  `Read the people by scale and lay no state over them unless a line of direction asks for one. What the telling says outranks every other line. ` +
  `Reply in exactly four sections and nothing else:\n` +
  `FORM — the branch of the law's 1 you composed for (1.1 a still, 1.2 a clip, 1.3 a telling, 1.4 a page of a comic).\n` +
  `PROMPT — the words to send to the maker, complete and self-contained; the words every seat sends verbatim (6.2 when a reference face rides, 6.3 always) included at the end.\n` +
  `REFERENCES — one line per reference picture to send, in order: the link, then whose face it is or what place it shows; 'none' when none.\n` +
  `TOOK — the handles whose direction you used, or 'none'.`;

export async function composeLensMedium(origin: string, atAddr: string, handle: string, field = 'lens'): Promise<Composed> {
  const index = (await loadBeachIndex(origin).catch(() => null))?.blocks ?? [];
  const tw = await tableWorld(origin, index);
  const span = addressToSpan(atAddr);
  const world = tw.world ?? 'world';

  // the moments the table's rooms recorded within this beat
  const rooms = index.filter((b) => /^pool:\d+(\.\d+)?$/.test(b)).map((b) => b.slice('pool:'.length));
  const moments: Moment[] = [];
  await Promise.all(rooms.map(async (room) => {
    const pool = blockOf(await loadBlock(origin, `pool:${room}`).catch(() => null));
    if (pool) moments.push(...momentsIn(pool, room, span.start, span.end));
  }));
  moments.sort((a, b) => a.ts.localeCompare(b.ts));
  // a clock table keeps its fold at the beat itself
  let fold: string | null = null;
  if (index.includes('temporal')) {
    const night = blockOf(await loadBlock(origin, 'temporal').catch(() => null));
    if (night) fold = lensVoice(readAt(night, atAddr));
  }

  // the place, the people, the cast
  const roomsHere = [...new Set(moments.map((m) => m.room))];
  const places = roomsHere.map((r) => (tw.spatial ? placeWalk(tw.spatial, r, false) : null)).filter((s): s is string => !!s);
  const people = tw.world ? await worldBlock(origin, tw, `people:${tw.world}`, index) : null;
  const principals = people ? roomsHere.map((r) => principalsUnder(people, r)).filter(Boolean).join(' · ') : '';
  const passports = await passportsAt(origin, index);
  const cast = new Set<string>();
  const texts = moments.map((m) => m.text).join('\n') + (fold ?? '');
  for (const m of moments) { if (passports.has(m.who)) cast.add(m.who); for (const w of m.woven) if (passports.has(w)) cast.add(w); }
  for (const h of passports.keys()) if (new RegExp(`\\b${h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(texts)) cast.add(h);
  const sheets = [...cast].map((h) => sheetOf(passports.get(h), h));
  const faces = await facesAt(origin, index, [...cast]);

  // the direction — the hands this hand follows, and its own, at this beat
  const follows = await followsOf(handle);
  const voices = [handle, ...follows.filter((f) => f.toLowerCase() !== handle.toLowerCase())];
  const direction: { who: string; text: string }[] = [];
  await Promise.all(voices.map(async (who) => {
    const name = index.find((b) => b.toLowerCase() === `${field}:${who}`.toLowerCase());
    if (!name) return;
    const mb = blockOf(await loadBlock(origin, name).catch(() => null));
    if (!mb) return;
    const t = lensVoice(readAt(mb, atAddr));
    if (t) direction.push({ who: name.slice(field.length + 1), text: t });
  }));

  // the look, the law, the recipe
  const style = tw.world ? await worldBlock(origin, tw, `style:${tw.world}`, index) : null;
  const styleText = style ? [lensVoice(style), ...digitKeys(style).map((k) => lensVoice((style as any)[k]))].filter(Boolean).join('\n') : '';
  const law = blockOf(await loadBlock(origin, `function:${field}`).catch(() => null));
  const library = blockOf(await loadBlock(DEFAULT_BEACH, `function:${field}`).catch(() => null));
  const lawText = [lensVoice(law), ...['1', '3', '4', '6'].map((k) => { const n = (library as any)?.[k]; const head = lensVoice(n); if (!head) return ''; const subs = digitKeys(n).map((d) => `  ${k}.${d} ${lensVoice((n as any)[d]) ?? ''}`); return `[${k}] ${head}${subs.length ? '\n' + subs.join('\n') : ''}`; })].filter(Boolean).join('\n');
  const stills = blockOf(await loadBlock(DEFAULT_BEACH, 'ways:stills').catch(() => null));
  const six = (stills as any)?.['6'];
  const recipeText = six ? [lensVoice(six), ...digitKeys(six).map((k) => `[6.${k}] ${lensVoice((six as any)[k]) ?? ''}`)].filter(Boolean).join('\n') : '(ways:stills 6 could not be read)';

  const parts: Part[] = [
    P(1, 'physics', '2.1', 'tier:medium:header', "the call's title line", `# THE CALL — the shot at ${field}:${atAddr}, ${origin} (medium)`),
    P(1, 'biology', '1.4', `function:${field}:1,3,4,6`, "the lens law — what a fold makes, the references, where it lands, the recipe mounted", `[THE LAW — the lens at this table, and the library's branches it mounts]\n${lawText || '(no law stands)'}`),
    P(1, 'biology', '1.4', 'ways:stills:6', 'THE RECIPE every seat follows, verbatim', `[THE RECIPE — ways:stills 6]\n${recipeText}`),
    P(1, 'biology', '1.4', 'tier:medium:contract', 'THIS CALL — the role worn and the shape of the reply', SHOT_CONTRACT),
    P(2, 'chemistry', '6.1', `${field}:${handle}:${atAddr}`, 'for whom, and the moment', `# THE INPUT\n\nfor: ${handle} · at ${atAddr} (${span.start.toISOString().slice(0, 16)}Z – ${span.end.toISOString().slice(11, 16)}Z)\n\n[THE MOMENT — as the table's record holds it]\n${fold ? `the fold at ${atAddr}: ${fold}\n` : ''}${moments.length ? moments.map((m) => `pool:${m.room}:${m.slot} · ${m.who}${m.woven.length ? ` · wove ${m.woven.join(', ')}` : ''} · ${m.ts}\n${m.text}`).join('\n\n') : fold ? '' : '(no telling landed in this beat; compose from the direction and the place alone)'}`),
    P(2, 'chemistry', '6.1', `${field}:*:${atAddr}`, 'THE DIRECTION — the followed lines at this moment', `[THE DIRECTION — the lines of the hands ${handle} follows at this moment, and ${handle}'s own]\n${direction.length ? direction.map((d) => `- ${d.who}: ${d.text}`).join('\n') : '(nobody followed has said anything of this moment)'}`),
    P(2, 'chemistry', '4.2', `spatial:${world}:walk`, 'the place, in its own words', `[THE PLACE]\n${places.join('\n\n') || '(no place register reaches this room)'}`),
    P(2, 'chemistry', '4.2', `people:${world}`, 'the people in frame, by scale', `[THE PEOPLE WHO KEEP THIS PLACE — draw only those the moment shows]\n${principals || '(no people register)'}`),
    P(2, 'chemistry', '1', 'passport:*:3', 'the cast: looks and faces', `[THE CAST — the characters in the moment, their looks, and the link to each face when one stands]\n${sheets.length ? sheets.map((s) => `- ${s.handle}${s.name !== s.handle ? ` (${s.name})` : ''}: ${s.look || 'as described'}${faces.get(s.handle) ? `\n  face: ${faces.get(s.handle)}` : '\n  face: none given — drawn from the words alone'}`).join('\n') : '(no character of this table is in the moment)'}`),
    P(2, 'chemistry', '2', `style:${world}`, 'the look', `[THE LOOK]\n${styleText || '(no look register — the line at ways:stills 6.1 stands)'}`),
    P(2, 'physics', '2.1', 'tier:medium:claim', 'the keep', `# THE CLAIM\n\nat: ${atAddr}\nkeep: pscale_stream_engage(field='${field}', handle='${handle}', at='${atAddr}', keep='personal', keep_text=<FORM, PROMPT, REFERENCES, TOOK, then the link the maker returned>, secret=<your key>, beach='${origin}')\npicture: an entry in gallery:${handle} addressed to the moment — ${moments.length ? `pool:${moments[0].room}:${moments[0].slot}` : `${field}:${atAddr}`} — with the link at 4 (ways:stills)`),
  ];
  return { text: joinParts(parts), parts, kind: 'the shot', room: atAddr, origin, where: `${field}:${atAddr}` };
}
