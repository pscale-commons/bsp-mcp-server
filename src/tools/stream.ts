/**
 * pscale_stream_engage — the VLS envelope over a spine-mirror-tree family.
 *
 * A STREAM STORES NOTHING. That one sentence is the whole difference from a
 * pool, and it is why this is a separate primitive rather than a flag on the
 * old one. A pool owns two blocks (the spool it appends to, and the liquid
 * buffer it overwrites); a stream owns none. It composes over a family that
 * already exists — spine:<field>, the <field>:<handle> mirrors, and the bare
 * <field> fold — so it cannot drift from them, cannot become a rival source of
 * truth, and needs no lock of its own.
 *
 * The V-L-S it renders (David's model, on record since 2026-07-29 in
 * proposals/2026-07-29-family-form-biome-audit.md §1):
 *
 *   V   who is present at the address (out of band; not this primitive's job)
 *   L   every mirror's reading AT the attended address, listed side by side,
 *       attributed, each sovereign to its owner. There is no buffer: a mirror
 *       is revisable by its holder forever, so STAGE AND COMMIT COLLAPSE INTO
 *       ONE ACT — `say`. That collapse is the point.
 *   S   the fold at that address, under the operator's law. COMPUTED, never
 *       stored, unless someone asks to keep it (tree:3 — "recomputed on
 *       demand, a READ, never a write-merge").
 *
 * The primitive never synthesises. It assembles the concatenation — the
 * SNAPSHOT, which is useful with no LLM in the room at all — and delivers the
 * operator's law beside it. The calling mind does the synthesis, exactly as
 * each reader of a pool produces their own. No central resolver, here either.
 *
 * WHERE A FOLD GOES, when it is kept (`keep`):
 *   personal    → tree:<field>:<handle>, at the SAME address — the holder's own
 *                 tree of syntheses, latest-standing and revisable like a
 *                 mirror, superseded by the next fold of the same point
 *                 (settled 2026-08-15, proposals/2026-08-15-personal-tree-
 *                 and-fold-homes.md; supersedes the history:<handle> journal
 *                 destination that #247's salvage rider first landed — a keep
 *                 that matters as a MOMENT may still leave a pointer in
 *                 history:<handle>, by the holder's own hand, and losslessness
 *                 when wanted is the archive convention, never accumulation).
 *   collective  → the bare name <field>, at the SAME address, because the fold
 *                 block is address-aligned with its spine (tree:4.1, tree:8;
 *                 battery × state-of-play is the live pair). Endorsed by
 *                 pointer, never a gate — anyone may write a better one.
 *
 * CADO — four faces, and EACH IS A FULL V-L-S LOOP rather than a permission
 * level. They differ only in which block the fold lands in, and each face's
 * liquid is that face's mirrors OF the block it folds into, so all four are
 * the same shape on one address space:
 *
 *   C  beach-venture:<handle>          → beach-venture      (the venture lived)
 *   A  spine:beach-venture:<handle>    → spine:…            (the objectives)
 *   D  function:beach-venture:<handle> → function:…         (this law)
 *   O  view:beach-venture:<handle>     → view:…             (cards, links out)
 *
 * Observer's INPUT is the Character fold — the venture's latest account of
 * itself — and its solid is a card carrying a LINK to where the output now
 * lives, outside. That is what makes O the venture's boundary rather than
 * another room inside it, and it is why O never fitted a "renders S" reading:
 * it has its own liquid and its own participants like every other face.
 *
 * THE OPERATOR IS THE CENTRAL BLOCK of a family — function:<field> — and it
 * names its own parts: the spine it governs, how mirrors are written, how each
 * face folds and where. The reference runs operator → family, never the
 * reverse. A generic operator (function:audit) carries no content addresses,
 * so a family running one says so in a bare reference at its own operator's
 * underscore, followed a single hop.
 *
 * Nothing here touches pool.ts, liquid buffers, windows, dice, or any RPG
 * path. The RPG keeps pscale_pool_engage unchanged; if streams prove out, that
 * molecule migrates afterwards and the pool becomes legacy — deliberately, not
 * by drift.
 */

import { z } from 'zod';
import { Block, writeAt, readAt, floorDepth, parseSpindle } from '../bsp.js';
import { loadBlock, saveBlock, loadBeachIndex, DEFAULT_BEACH } from '../db.js';
import { momentToAddress, voiceAddress, TEMPORAL_FLOOR } from '../temporal.js';

// ── Helpers (local by intent — importing pool.ts for three small functions
//    would tie this clean surface to the one it exists to stand beside) ──

/** A bare block reference: one token, no whitespace, naming a block (and
 *  optionally one branch after a slash). Anything with a space is prose — a
 *  human pointer, delivered as itself. Same discrimination the pool's mount
 *  makes; kept local so the two surfaces stay independent. */
export function isBareRef(s: unknown): s is string {
  return typeof s === 'string' && s.trim() !== '' && !/\s/.test(s.trim()) && s.trim().length < 120;
}

/** The text a node presents: a leaf string is itself, an object speaks through
 *  its underscore. Null when the position is unvoiced — which is SILENCE, and
 *  silence at an address is honest absence (tree:5e), never a gap to fill. */
export function voiceOf(node: unknown): string | null {
  if (typeof node === 'string') return node.trim() === '' ? null : node;
  if (node && typeof node === 'object') {
    const u = (node as Record<string, unknown>)['_'];
    if (typeof u === 'string' && u.trim() !== '') return u;
  }
  return null;
}

/** Re-emit an address for a target block's own floor. Correspondence across
 *  blocks is by PSCALE, never by walk depth (whetstone:7): the spine may have
 *  supernested past a mirror that carries one entry, so the same coordinate is
 *  a different digit-string in each. Right-pad rather than formatAddress —
 *  the canonical emitter under-pads above floor 1 (pool.ts carries the same
 *  note and the same fix; correcting the emitter is Python-first). */
export function emitFor(digits: string[], block: Block): string {
  return digits.join('').padEnd(floorDepth(block), '0');
}

/** The ladder: every ancestor's voicing from the coarsest rung down to the
 *  attended one, which is what makes a located read self-contextualising —
 *  the reader arrives already holding why this address matters. This is the
 *  line-of-sight view, and on a temporal spine it is literally today at the
 *  bottom and the decade at the top. */
export function ladderOf(spine: Block, digits: string[]): { pscale: number; addr: string; text: string | null }[] {
  const floor = floorDepth(spine);
  const rungs: { pscale: number; addr: string; text: string | null }[] = [];
  let node: unknown = spine;
  for (let i = 0; i < digits.length; i++) {
    const key = digits[i] === '0' ? '_' : digits[i];
    if (!node || typeof node !== 'object') { node = null; }
    else { node = (node as Record<string, unknown>)[key]; }
    rungs.push({
      pscale: floor - (i + 1),
      addr: digits.slice(0, i + 1).join('').padEnd(floor, '0'),
      text: voiceOf(node),
    });
  }
  return rungs;
}

/** Trim for the ladder's upper rungs — the ancestors are context, not the
 *  read; the attended rung is delivered whole. */
export function clip(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…';
}

/** Named rungs — the register law made usable. A human says "today", never a
 *  ten-digit number, so the door accepts the WORD and truncates the computed
 *  moment to that rung (trailing zeros are the floor-width padding the parser
 *  strips, so the truncation round-trips exactly). 'now' is the beat, which is
 *  finer than most fields are ever voiced at — which is why the coarser words
 *  exist and why 'today' is the one a venture ladder usually wants. */
export const NAMED_RUNGS: Record<string, number> = {
  now: 10, beat: 10, gathering: 9, hour: 9,
  today: 8, day: 8, week: 7, month: 6,
  season: 5, quarter: 5, year: 4,
};

/** A named rung → the address of the moment truncated to it. Null when the
 *  word is not one we name, so an ordinary digit address falls through. */
export function namedRungAddress(word: string, when: Date): string | null {
  const keep = NAMED_RUNGS[word.trim().toLowerCase().replace(/^this\s+/, '')];
  if (!keep) return null;
  const full = momentToAddress(when);
  return full.slice(0, keep).padEnd(full.length, '0');
}

/** The human reading of an address, on a CLOCK spine only. A temporal family
 *  stands at floor 10 (pscale://sundial) and its addresses voice themselves,
 *  so a reader is never handed a column of ten digits to decode — the ladder
 *  is law rather than content, which is why the voicing is done in code and
 *  never authored into the spine. A spine that is not a clock, or an address
 *  the clock refuses, goes unvoiced and the ladder renders exactly as before:
 *  the attempt never breaks a read. */
function clockVoice(addr: string, floor: number): string | null {
  if (floor !== TEMPORAL_FLOOR) return null;
  try { return voiceAddress(addr); } catch { return null; }
}

// ── Schema ──

export const streamEngageParamsSchema = {
  field: z
    .string()
    .describe("The family name — the BARE name, no prefix. 'beach-venture' addresses spine:beach-venture, every beach-venture:<handle> mirror, and the fold at 'beach-venture'. Never pass 'spine:beach-venture' or 'pool:beach-venture'."),
  handle: z
    .string()
    .describe("Your handle. Names your mirror (<field>:<handle>) for `say`, and your own tree of syntheses (tree:<field>:<handle>) for keep='personal'. Mirror and tree are born on first use — you never create them by hand."),
  at: z
    .string()
    .optional()
    .describe("The address attended to, in the spine's own coordinate space (digits, at most one decimal point, comma-walk accepted; multi-dot rejected). Pass a NAMED RUNG on a temporal spine — 'today' (the usual one), 'this week', 'this month', 'season', 'year', or 'now' for the current beat — and the address is COMPUTED from the clock — a human is never asked for an address (function:molequle:5). Omit entirely to receive the spine's map instead (every node's opening line at pscale 0), then dial in."),
  say: z
    .string()
    .optional()
    .describe("Your reading at this address, written into YOUR OWN mirror at <field>:<handle>. One act — there is no separate stage and commit here, because a mirror is revisable by its holder forever; saying again at the same address replaces what you said. Requires `at`. Never writes anyone else's mirror, and nothing else can write yours."),
  keep: z
    .enum(['personal', 'collective'])
    .optional()
    .describe("Persist a fold you have just synthesised (pass it as `keep_text`). 'personal' writes it to tree:<field>:<handle> at this same address — your own tree of syntheses, latest-standing, superseded by your next fold of the same point (a keep that matters as a moment may also leave a pointer in history:<handle>, by your own hand). 'collective' writes it to the bare name <field> at this same address — the shared social product, endorsed by pointer and never a gate, which anyone may supersede with a better one. Omit and the fold stays in the envelope, which is the default the convention prefers (tree:3 — recomputed on demand, never stale)."),
  keep_text: z
    .string()
    .optional()
    .describe("The synthesis to persist, required by `keep`. Yours to write: this primitive assembles the snapshot and delivers the law, and never synthesises anything itself."),
  beach: z
    .string()
    .optional()
    .describe("Origin hosting the family. Defaults to the standard beach."),
  secret: z
    .string()
    .optional()
    .describe("Edit-latch proof, forwarded when the target position is locked. Sensitive — never repeat it in conversation."),
};

export interface StreamEngageParams {
  field: string;
  handle: string;
  at?: string;
  say?: string;
  keep?: 'personal' | 'collective';
  keep_text?: string;
  beach?: string;
  secret?: string;
}

// ── Handler ──

export async function handleStreamEngage(params: StreamEngageParams) {
  const origin = (params.beach ?? DEFAULT_BEACH).replace(/\/+$/, '');
  const { field, handle } = params;
  const spineName = `spine:${field}`;
  const out = (text: string) => ({ content: [{ type: 'text' as const, text }] });

  const srow = await loadBlock(origin, spineName).catch(() => null);
  if (!srow || !srow.block || typeof srow.block !== 'object') {
    return out(
      `No spine at ${spineName} — a stream composes over a family, it does not create one.\n\n` +
      `Found nothing to compose. Either the field is named differently (pass the BARE name: 'beach-venture', not 'spine:beach-venture'), ` +
      `or the family has yet to be framed. Framing it is one write, by whoever frames the thing (tree:1):\n` +
      `  bsp(agent_id="${origin}", block="${spineName}", content={_: "<what this field is>"}, new_lock="<your key>")`,
    );
  }
  const spine = srow.block as Block;
  const spineFloor = floorDepth(spine);

  // ── The map, when no address is attended ──
  // Deliberately not a heuristic on floor depth: a stream never guesses which
  // coordinate space it is in. Ask for nothing, show the map, let the caller dial.
  if (params.at === undefined) {
    const rows: string[] = [];
    const root = voiceOf(spine);
    if (root) rows.push(`  [root] ${clip(root, 300)}`);
    for (const k of Object.keys(spine).filter((k) => /^[1-9]$/.test(k)).sort()) {
      const t = voiceOf((spine as Record<string, unknown>)[k]);
      rows.push(`  [${k}] ${t ? clip(t, 160) : '(unvoiced)'}`);
    }
    return out(
      `stream:${field} @ ${origin} — the map (no address attended)\n\n` +
      `${rows.join('\n') || '  (the spine has no voiced positions yet)'}\n\n` +
      `Dial one: at=<address>. On a temporal spine, at='now' computes today's from the clock.`,
    );
  }

  // ── Resolve the address ──
  // 'now' is the register law made operational: the clock is always known, so
  // the coordinate is derived and the human is never asked for digits.
  const rawAt = namedRungAddress(params.at, new Date()) ?? params.at;

  let digits: string[];
  try {
    digits = parseSpindle(rawAt, spineFloor).digits;
    if (!digits.length) throw new Error('an address is needed, not the root');
  } catch (e: any) {
    return out(`at="${params.at}" is not a usable address in the ${field} family — ${e?.message ?? String(e)}`);
  }
  const spineAddr = emitFor(digits, spine);

  // ── say — the one write act, into the caller's own mirror ──
  let saidAt: string | null = null;
  if (params.say !== undefined && params.say.trim() !== '') {
    const mirrorName = `${field}:${handle}`;
    let mrow = await loadBlock(origin, mirrorName).catch(() => null);
    if (!mrow || typeof mrow.block !== 'object' || mrow.block === null) {
      const born =
        `MIRROR — ${handle}'s readings on the ${field} field (${spineName}), at the spine's own addresses. ` +
        `Sovereign to its holder; nobody else writes here. Silence at an address is honest absence, not a gap to be filled.`;
      try {
        await saveBlock(origin, mirrorName, { _: born } as Block, { spindle: '', secret: params.secret });
        mrow = await loadBlock(origin, mirrorName).catch(() => null);
      } catch (e: any) {
        return out(`Could not create your mirror at ${mirrorName} — ${e?.message ?? String(e)}`);
      }
    }
    const mblock: Block = JSON.parse(JSON.stringify(mrow!.block));
    const mAddr = emitFor(digits, mblock);
    try {
      writeAt(mblock, mAddr, params.say);
      await saveBlock(origin, mirrorName, mblock, { spindle: mAddr, secret: params.secret });
      saidAt = `${mirrorName}:${mAddr}`;
    } catch (e: any) {
      return out(`Your reading was refused at ${mirrorName}:${mAddr} — ${e?.message ?? String(e)}`);
    }
  }

  // ── keep — persist a synthesis the caller has already made ──
  let keptTo: string | null = null;
  if (params.keep) {
    const text = (params.keep_text ?? '').trim();
    if (!text) {
      return out(`keep='${params.keep}' needs keep_text — the synthesis is yours to write; this primitive assembles the snapshot and never synthesises.`);
    }
    try {
      if (params.keep === 'personal') {
        const treeName = `tree:${field}:${handle}`;
        let trow = await loadBlock(origin, treeName).catch(() => null);
        if (!trow || typeof trow.block !== 'object' || trow.block === null) {
          const born =
            `TREE — ${handle}'s own syntheses of ${spineName}, at the spine's own addresses: at each point, the LATEST reading this hand has folded, ` +
            `revisable forever and superseded by its next fold. A fold that matters as a moment may also leave a pointer in history:${handle}, by this hand's own choice; ` +
            `losslessness, when wanted, is the archive convention (archive:${treeName}:<date>), never automatic accumulation.`;
          await saveBlock(origin, treeName, { _: born } as Block, { spindle: '', secret: params.secret });
          trow = await loadBlock(origin, treeName).catch(() => null);
        }
        const tblock: Block = JSON.parse(JSON.stringify(trow!.block));
        const tAddr = emitFor(digits, tblock);
        writeAt(tblock, tAddr, text);
        await saveBlock(origin, treeName, tblock, { spindle: tAddr, secret: params.secret });
        keptTo = `${treeName}:${tAddr}`;
      } else {
        let frow = await loadBlock(origin, field).catch(() => null);
        if (!frow || typeof frow.block !== 'object' || frow.block === null) {
          const born =
            `${field.toUpperCase()} — the FOLD: the social product of ${spineName} and every ${field}:<handle> mirror, ` +
            `at the spine's own addresses. Computed by anyone, owned by nobody; a snapshot here is endorsed by pointer and never gates anything, ` +
            `and a better reading may always supersede it (tree:3, tree:4).`;
          await saveBlock(origin, field, { _: born } as Block, { spindle: '', secret: params.secret });
          frow = await loadBlock(origin, field).catch(() => null);
        }
        const fblock: Block = JSON.parse(JSON.stringify(frow!.block));
        const fAddr = emitFor(digits, fblock);
        writeAt(fblock, fAddr, text);
        await saveBlock(origin, field, fblock, { spindle: fAddr, secret: params.secret });
        keptTo = `${field}:${fAddr}`;
      }
    } catch (e: any) {
      return out(`The fold was not kept — ${e?.message ?? String(e)}${saidAt ? `\n(Your reading DID land at ${saidAt}.)` : ''}`);
    }
  }

  // ── L — every mirror's reading at this address ──
  // Enumeration is the surface index, walked not searched: mirrors are the
  // <field>:-prefixed names the beach already lists (the 2026-07-29 answer to
  // "how does a fold find its mirrors" — one GET, fine at hundreds).
  const index = await loadBeachIndex(origin).catch(() => null);
  const mirrorNames = (index?.blocks ?? []).filter((n) => n.startsWith(`${field}:`)).sort();

  const readings: { who: string; text: string }[] = [];
  const silent: string[] = [];
  await Promise.all(
    mirrorNames.map(async (name) => {
      const who = name.slice(field.length + 1);
      const row = await loadBlock(origin, name).catch(() => null);
      if (!row || typeof row.block !== 'object' || row.block === null) { silent.push(who); return; }
      const addr = emitFor(digits, row.block as Block);
      const text = voiceOf(readAt(row.block as Block, addr));
      if (text) readings.push({ who, text }); else silent.push(who);
    }),
  );
  readings.sort((a, b) => a.who.localeCompare(b.who));
  silent.sort();

  // ── The operator's law — THE OPERATOR IS THE CENTRAL BLOCK OF ITS FAMILY.
  // It is found at function:<field>, and it names its own parts: which spine
  // it governs, how mirrors are written, how each face folds and where. The
  // reference runs operator → family, never family → operator; an earlier
  // reading of this file had the spine name its operator at its own position
  // 9, which inverted the direction and made the law a thing content pointed
  // at rather than the thing that constitutes the family (keeper's correction,
  // 2026-08-10; the mount-at-9 shape belongs to decks, whose cards are content
  // under a generic operator, and it is not this).
  //
  // A GENERIC operator carries no content addresses (block-conventions:8.81),
  // so a family that runs one — function:audit, function:status — says so in
  // one line at its OWN operator's underscore, as a bare reference this
  // follows a single hop. The family's law stays the thing named; the generic
  // law stays reusable; neither has to know the other's addresses.
  let law: string | null = null;
  const render = (target: unknown): string | null => {
    const parts: string[] = [];
    const head = voiceOf(target);
    if (head) parts.push(head);
    if (target && typeof target === 'object') {
      for (const k of Object.keys(target as object).filter((k) => /^[1-9]$/.test(k)).sort()) {
        const t = voiceOf((target as Record<string, unknown>)[k]);
        if (t) parts.push(`[${k}] ${t}`);
      }
    }
    return parts.length ? parts.join('\n') : null;
  };
  const opName = `function:${field}`;
  const oprow = await loadBlock(origin, opName).catch(() => null);
  if (oprow && typeof oprow.block === 'object' && oprow.block !== null) {
    const own = oprow.block as Block;
    const root = voiceOf(own);
    if (root && isBareRef(root)) {
      // Delegation to a generic operator, one hop, no further.
      const [refBlock, refBranch] = root.trim().split('/');
      const grow = await loadBlock(origin, refBlock).catch(() => null);
      const generic = grow && typeof grow.block === 'object' && grow.block !== null
        ? render(refBranch ? (grow.block as Record<string, unknown>)[refBranch] : grow.block)
        : null;
      law = generic
        ? `${opName} → ${root.trim()} —\n${generic}`
        : `${opName} names ${root.trim()} as its law, and that block did not resolve at this beach`;
    } else {
      law = `${opName} —\n${render(own) ?? '(the operator stands empty)'}`;
    }
  }

  // ── Render ──
  const lines: string[] = [];
  const attendedWhen = clockVoice(spineAddr, spineFloor);
  const namedAs = namedRungAddress(params.at, new Date()) ? params.at.trim() : null;
  const attendedLabel = [namedAs, attendedWhen].filter(Boolean).join(' — ');
  lines.push(`stream:${field} @ ${origin} — at ${spineAddr}${attendedLabel ? ` (${attendedLabel})` : ''}`);

  const rungs = ladderOf(spine, digits);
  lines.push('');
  lines.push('# The ladder — this address in its own context, coarse to fine');
  for (const r of rungs) {
    const last = r.addr === spineAddr;
    const when = clockVoice(r.addr, spineFloor);
    const head = `  p${r.pscale} [${r.addr}]${when ? ` ${when} —` : ''}`;
    if (!r.text) { lines.push(`${head} (unvoiced)`); continue; }
    lines.push(`${head} ${last ? r.text : clip(r.text, 180)}`);
  }

  if (law) {
    lines.push('');
    lines.push('# The law — this family\u2019s operator, the block that constitutes it');
    lines.push(law);
  }

  lines.push('');
  lines.push(
    `# Readings at ${spineAddr}${attendedWhen ? ` (${attendedWhen})` : ''}` +
    ` — ${readings.length} ${readings.length === 1 ? 'voice' : 'voices'}` +
    ` (the SNAPSHOT: every mirror concatenated, listed and never synthesised)`,
  );
  if (readings.length === 0) {
    lines.push('  (nobody has read this address yet — say yours and it becomes the first)');
  } else {
    for (const r of readings) lines.push(`- ${r.who}${r.who === handle ? ' (you)' : ''}: ${r.text}`);
  }
  if (silent.length) {
    lines.push('');
    lines.push(`  silent here: ${silent.join(', ')} — honest absence, not a gap to be filled (tree:5e)`);
  }

  lines.push('');
  lines.push(
    `# The fold — yours to make, not the primitive's` +
    `\nSynthesise the snapshot above under the law${law ? '' : ' (no function:${field} at this beach, so integrate plainly)'}. ` +
    `Keep it only if it should outlast this turn: keep='personal' lands it at tree:${field}:${handle}:${spineAddr}, your own latest reading of this point; keep='collective' lands it at ${field}:${spineAddr}, ` +
    `where anyone may supersede it with a better reading.`,
  );

  if (saidAt || keptTo) {
    lines.push('');
    if (saidAt) lines.push(`✓ your reading landed at ${saidAt}`);
    if (keptTo) lines.push(`✓ fold kept at ${keptTo}`);
  }

  return out(lines.join('\n'));
}
