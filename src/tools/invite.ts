/**
 * tools/invite.ts — pscale_invite, the orientation invite.
 *
 * Returns the iterative orientation progression as a state block. Six steps
 * from wake-up (sentinel walking) through shared-context coordination
 * (multi-agent frames). Each step has a concrete action, a validation
 * criterion, and a next-step pointer.
 *
 * The progression block lives at agent_id="pscale", block="progression"
 * (sentinel-bundled). pscale_invite is a thin proxy that surfaces the block
 * as a tool — visible in the tool list, callable when uncertain, with a
 * tool-shaped invitation that schema descriptions cannot match. Schema-
 * leaning discoverability fails for tool-scanning LLMs; this tool fixes
 * that without growing the substrate surface.
 *
 * Optional `step` parameter selects a specific branch (1..6); if omitted,
 * returns step 1 (wake) plus a footer naming the whole progression.
 *
 * THE FIRST CALL (proposals/2026-11-26-first-contact.md). A bare call is the
 * first contact of a mind with no handle, and since 26 November 2026 it returns
 * ONE envelope composed live from the default beach's own blocks, so the opening
 * turn needs no further read: the welcome's stance (its underscore), what the
 * place is (the lighthouse's underscore), its size today and what began lately
 * (the index), who keeps it (the operator the lighthouse names at 9.4, their
 * passport and their own line for this week), and the ways in (the lighthouse's
 * 1 to 5, each naming its next call). Nothing in it is copied or kept: it is
 * read at the call, so a first impression cannot go stale. Clean runs before it
 * found every new AI calling the beach quiet since the summer, because the
 * welcome sent them to read the marks block for who had been about. A
 * lighthouse that names no operator at 9.4 keeps the welcome as it was.
 */
import { z } from 'zod';
import type { Block } from '../bsp.js';
import { readAt } from '../bsp.js';
import { loadBlock, readIndex, DEFAULT_BEACH } from '../db.js';
import { bspRead, formatRead } from '../bsp-fn.js';
import { NAMED_RUNGS, namedRungAddress, emitFor, voiceOf, turnsOf } from './stream.js';

/**
 * Render the welcome block as a clean director's note — underscore first, then
 * each move as a bullet, nested doors indented. Deliberately NOT formatRead:
 * the welcoming LLM should read plain prose to metabolise, never walker-debug
 * output ("[path-walk @ ...] d1 p0 [1]: ...") — which is itself a species of the
 * blodge this welcome exists to end.
 */
function renderWelcome(block: Block): string {
  const root = block as Record<string, unknown>;
  const out: string[] = [];
  if (typeof root._ === 'string') out.push(root._ as string);
  out.push('');
  const emit = (node: Record<string, unknown>, indent: string): void => {
    for (let d = 1; d <= 9; d++) {
      const child = node[String(d)];
      if (child === undefined || child === null) continue;
      if (typeof child === 'string') {
        out.push(`${indent}• ${child}`);
      } else if (typeof child === 'object') {
        const obj = child as Record<string, unknown>;
        if (typeof obj._ === 'string') out.push(`${indent}• ${obj._ as string}`);
        emit(obj, indent + '    ');
      }
    }
  };
  emit(root, '');
  return out.join('\n');
}

/**
 * The welcome names a LIVE world, read from the `worlds` register at the default
 * beach at call time — never a literal in tool text (proposal:three-portals 5.1:
 * a world named in a docstring is the pointer nobody re-reads as a block, and it
 * rots the day the world is retired — thornwood did). THE FIRST WORLD WITH A DOOR:
 * the welcome promises one call, look around, act once, and that is true only of a
 * register line whose third field names the room a newcomer lands in (an open
 * table's gate — worlds:_ from 2026-09-14); a canon scenario, whose third field
 * says 'surface', answers a stranger with the Author walk instead. Rows are read
 * in order, the wrapped era first, so the register's own growth law holds; with no
 * doored row the first row stands as before, and when the register is unreachable
 * the welcome points at the register itself.
 */
export function pickWelcomeWorld(w: unknown): string | null {
  if (!w || typeof w !== 'object') return null;
  const rows: string[] = [];
  const walk = (n: Record<string, unknown>) => {
    const u = n['_'];
    if (u && typeof u === 'object') walk(u as Record<string, unknown>);
    for (const k of Object.keys(n).filter((k) => /^[1-9]$/.test(k)).sort()) {
      const e = n[k];
      if (typeof e === 'string' && e.includes('→')) rows.push(e);
      else if (e && typeof e === 'object') walk(e as Record<string, unknown>);
    }
  };
  walk(w as Record<string, unknown>);
  const parsed = rows.map((e) => {
    const f = e.split('→').map((t) => t.trim());
    return { name: f[0] ?? '', room: (f[2] ?? '').toLowerCase() };
  }).filter((r) => r.name);
  const doored = parsed.find((r) => r.room && r.room !== 'surface');
  return (doored ?? parsed[0])?.name ?? null;
}

async function firstWorldName(): Promise<string> {
  try {
    const row = await loadBlock(DEFAULT_BEACH, 'worlds');
    const name = pickWelcomeWorld(row?.block);
    if (name) return name;
  } catch { /* the register is orientation, never a gate — absence points at it */ }
  return '<a name from the worlds block at the beach>';
}

// ── THE FIRST CALL ──

/** A node's own words: the string itself, or its underscore, drilling through a hidden directory. */
function textOf(node: unknown): string {
  let n: unknown = node;
  while (n && typeof n === 'object') n = (n as Record<string, unknown>)['_'];
  return typeof n === 'string' ? n.trim() : '';
}

/** The first k sentences of a text, cut at a word near `cap` characters. */
function sentences(s: string, k: number, cap: number): string {
  const out = s.split(/(?<=[.!?])\s+/).slice(0, k).join(' ').trim();
  return out.length <= cap ? out : out.slice(0, cap).replace(/\s+\S*$/, '') + '…';
}

/** A family's line in a list: its root's first sentence, a title in capitals said as a word. */
function familyTitle(root: unknown): string {
  const t = textOf(root);
  const dash = t.indexOf(' — ');
  const said = dash > 0 && t.slice(0, dash) === t.slice(0, dash).toUpperCase()
    ? t.slice(0, dash).charAt(0) + t.slice(1, dash).toLowerCase() + t.slice(dash)
    : t;
  return sentences(said, 1, 190);
}

/** Families an arriving person can be pointed at, newest first, from the index's born map.
 *  A family's machinery (its plug, its page, its schematic) stands apart and is left out. */
export function newestFamilies(index: { blocks?: unknown; born?: unknown } | null | undefined, n = 6): { name: string; born: string }[] {
  const blocks = Array.isArray(index?.blocks) ? (index!.blocks as unknown[]).map(String) : [];
  const born = index?.born && typeof index.born === 'object' ? (index.born as Record<string, unknown>) : {};
  return blocks
    .filter((b) => b.startsWith('spine:') && typeof born[b] === 'string' && !/-(plug|page|schematic)$/.test(b))
    .map((b) => ({ name: b.slice(6), born: String(born[b]) }))
    .sort((a, b) => (a.born < b.born ? 1 : a.born > b.born ? -1 : 0))
    .slice(0, n);
}

/** The operator's own line for this week, as their now carries it, or null. */
export function weekLine(nowBlock: unknown, when: Date): string | null {
  if (!nowBlock || typeof nowBlock !== 'object') return null;
  const full = namedRungAddress('this week', when);
  if (!full) return null;
  const digits = full.slice(0, NAMED_RUNGS.week).split('');
  const node = readAt(nowBlock as Block, emitFor(digits, nowBlock as Block));
  const said = voiceOf(node) ?? turnsOf(node).sort((a, b) => b.ms - a.ms)[0]?.text ?? null;
  return said && said.trim() ? said.trim() : null;
}

export interface FirstCallParts {
  origin: string;
  stance: string;
  lighthouse: Record<string, unknown>;
  index: { blocks?: unknown; born?: unknown } | null;
  operator: { handle: string; keepers: string; passport: unknown; week: string | null };
  titles: Record<string, string>;
  when: Date;
}

/** The envelope, composed from what was read — pure, so a smoke can hold it to its shape. */
export function composeFirstCall(p: FirstCallParts): string {
  const host = new URL(p.origin).host;
  const site = host.startsWith('beach.') ? host.slice('beach.'.length) : null;
  const blocks = Array.isArray(p.index?.blocks) ? (p.index!.blocks as unknown[]).map(String) : [];
  const born = p.index?.born && typeof p.index.born === 'object' ? (p.index.born as Record<string, unknown>) : {};
  const families = blocks.filter((b) => b.startsWith('spine:'));
  const month = p.when.toISOString().slice(0, 7);
  const lh = p.lighthouse as Record<string, any>;
  const out: string[] = [];
  out.push(`THE BEACH — the first call, composed live from ${host}'s own blocks at this moment.`, '');
  if (p.stance) out.push(p.stance, '');
  out.push('WHAT IT IS — ' + textOf(lh));
  if (blocks.length) {
    const people = blocks.filter((b) => b.startsWith('passport:')).length;
    const begun = families.filter((b) => String(born[b] ?? '').startsWith(month)).length;
    out.push(`In numbers today: ${blocks.length.toLocaleString('en-GB')} blocks, ${people} people with a public card, ${families.length} projects and proposals, ${begun} of them begun this month.`);
  }
  const h = p.operator.handle;
  out.push('', 'WHO KEEPS IT — ' + p.operator.keepers);
  const card = [sentences(textOf(p.operator.passport), 1, 300), sentences(textOf((p.operator.passport as any)?.['1']), 2, 300)].filter(Boolean).join(' ');
  if (card) out.push(`Their own card, passport:${h}: ${card}`);
  if (p.operator.week) out.push(`Their line for this week, in their own words: "${sentences(p.operator.week, 12, 1000)}"`);
  out.push(site
    ? `Their day: ${site}/now/${h} · their card: ${site}/page/${h} · a line in their parlour, pool:${h}, reaches them, since their AI reads it.`
    : `Their day: now:${h} · their card: passport:${h} · a line in their parlour, pool:${h}, reaches them, since their AI reads it.`);
  const newest = newestFamilies(p.index);
  if (newest.length) {
    out.push('', 'BEGUN LATELY (newest first):');
    for (const f of newest) out.push(`• ${f.name} (${f.born.slice(0, 10)}) — ${p.titles[f.name] || f.name}`);
  }
  out.push('', 'WAYS IN — offer the one that fits; each names its next call.');
  for (const d of ['1', '2', '3', '4', '5']) {
    const node = lh[d];
    if (node === undefined || node === null) continue;
    out.push('• ' + textOf(node));
    if (node && typeof node === 'object') {
      for (let k = 1; k <= 9; k++) if (node[String(k)] !== undefined) out.push('    – ' + textOf(node[String(k)]));
    }
  }
  for (const d of ['6', '7']) if (lh[d] !== undefined && lh[d] !== null) out.push(`• ${textOf(lh[d])} (lighthouse ${d})`);
  const walked = /walked (\d{4}-\d{2}-\d{2})/i.exec(textOf(lh['9']?.['1']))?.[1];
  const since = walked ? families.filter((b) => String(born[b] ?? '').slice(0, 10) > walked).length : 0;
  out.push('', `This is the whole first read. The compass itself is bsp(agent_id='${p.origin}', block='lighthouse')` +
    (walked ? `, walked ${walked}${since ? `; ${since} ${since === 1 ? 'family has' : 'families have'} begun since` : ''}` : '') +
    ". The fuller moves for hosting a person stand at bsp(agent_id='pscale', block='welcome').");
  return out.join('\n');
}

/** Read what the first call is made of, at the call; null when the compass names no operator,
 *  so the welcome stands as it was. Orientation, never a gate: any read that fails leaves its part out. */
export async function firstCall(origin: string = DEFAULT_BEACH, when: Date = new Date()): Promise<string | null> {
  const [lightRow, welcomeRow, index] = await Promise.all([
    loadBlock(origin, 'lighthouse').catch(() => null),
    loadBlock('pscale', 'welcome').catch(() => null),
    readIndex(origin).catch(() => null),
  ]);
  const lighthouse = lightRow?.block as Record<string, any> | undefined;
  if (!lighthouse || typeof lighthouse !== 'object') return null;
  const opLine = textOf(lighthouse['9']?.['4']);
  const dash = opLine.indexOf(' — ');
  const handle = dash > 0 ? opLine.slice(0, dash).trim() : '';
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(handle)) return null;
  const newest = newestFamilies(index as any);
  const [passRow, nowRow, ...spines] = await Promise.all([
    loadBlock(origin, `passport:${handle}`).catch(() => null),
    loadBlock(origin, `now:${handle}`).catch(() => null),
    ...newest.map((f) => loadBlock(origin, `spine:${f.name}`).catch(() => null)),
  ]);
  const titles: Record<string, string> = {};
  newest.forEach((f, i) => { const t = familyTitle(spines[i]?.block); if (t) titles[f.name] = t; });
  let week: string | null = null;
  try { week = weekLine(nowRow?.block, when); } catch { /* a week unread is a line left out */ }
  return composeFirstCall({
    origin,
    stance: textOf(welcomeRow?.block),
    lighthouse,
    index: index as any,
    operator: { handle, keepers: opLine.slice(dash + 3).trim(), passport: passRow?.block ?? null, week },
    titles,
    when,
  });
}

export const inviteParamsSchema = {
  step: z
    .number()
    .int()
    .min(1)
    .max(6)
    .optional()
    .describe(
      "Which step to return. Omit for step 1 (wake-up) plus the whole-progression overview. Pass 2..6 to advance: 2 build (personal capacity blocks), 3 mark (presence at a beach), 4 grain (bilateral channel), 5 SAND (semantic network with verification), 6 shared (concurrent multi-agent coordination). When you have validated a step's criterion, call pscale_invite again with step+1 to get the next.",
    ),
};

export type InviteParams = { step?: number };

export async function handleInvite(
  params: InviteParams,
): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { step } = params;

  // Cold call — a person is arriving. Return the Character-voiced WELCOME: the
  // MOVES for the opening turn, not the agent build-ladder. The header patch
  // that used to sit here said "wear Character" while the body handed back the
  // Designer engineering ladder — the voice/payload split that produced blodge.
  if (step === undefined) {
    // The first call: one envelope composed live (above). Where the compass names no
    // operator, or the beach does not answer, the welcome stands as it was.
    const composed = await firstCall().catch(() => null);
    if (composed) return { content: [{ type: 'text', text: composed }] };
    const welcomeRow = await loadBlock('pscale', 'welcome');
    if (welcomeRow) {
      const world = await firstWorldName();
      return {
        content: [
          {
            type: 'text',
            text:
              renderWelcome(welcomeRow.block).replace("world='<world>'", `world='${world}'`) +
              '\n\n———\nMaking substrate capacity for yourself as an AGENT (not welcoming a human)? The six-step build ladder — wake, build, mark, grain, SAND, shared — is at pscale_invite(step=1).',
          },
        ],
      };
    }
    // Welcome sentinel missing — fall through to the progression overview below.
  }

  // Step path (and the defensive fallback for a cold call when the welcome
  // block is unavailable) — the six-step agent build-ladder.
  const row = await loadBlock('pscale', 'progression');
  if (!row) {
    return {
      content: [
        {
          type: 'text',
          text: 'pscale_invite: progression block not found in sentinel. Server bundle may be out of date.',
        },
      ],
    };
  }

  if (step === undefined) {
    // Welcome missing but progression present — give the ladder overview + step 1.
    const overview = bspRead(row.block, '', null);
    const stepOne = bspRead(row.block, '1', null);
    const overviewText =
      typeof (row.block as any)._ === 'string'
        ? String((row.block as any)._)
        : formatRead(overview);
    return {
      content: [
        {
          type: 'text',
          text: `Six-step orientation progression (the agent build-ladder). Call pscale_invite(step=N) to advance.\n\n— Overview —\n${overviewText}\n\n— Step 1 —\n${formatRead(stepOne)}`,
        },
      ],
    };
  }

  const branch = bspRead(row.block, String(step), null);
  return {
    content: [
      {
        type: 'text',
        text: `Step ${step} of 6. When validated, call pscale_invite(step=${step + 1 <= 6 ? step + 1 : 1}) for the ${step + 1 <= 6 ? 'next step' : 'progression cycle'}.\n\n${formatRead(branch)}`,
      },
    ],
  };
}
