/**
 * tools/genus.ts — pscale_genus: wear a genus-one mind for a turn.
 *
 * One call returns the instance's COMPOSED wake window — the same
 * {system, message} filmstrip the kernel hands a bare-API LLM, byte-parity
 * with `kernel.py --compose-only` (scripts/smoke-genus-parity.ts holds the
 * contract). The calling LLM IS the pulse: compose is free; the visitor's
 * own subscription pays the inference — presence-conscription at the app
 * door. Three modes:
 *
 *   bare (no passphrase)        → GHOST-WAKE. Perceive-only: wear the mind,
 *                                 cannot change it (the locks enforce this,
 *                                 not etiquette). Respond outwardly at
 *                                 task:<handle> or marks.
 *   passphrase                  → HOLDER (the special relationship). The
 *                                 window plus write authority: return your
 *                                 fold via the fold parameter, or edit the
 *                                 shell as designer via bsp().
 *   passphrase + task           → the holder's ask enters the given the way
 *                                 the keepers' tending does — appended at
 *                                 task:<handle> BEFORE composing, so it rides
 *                                 the window's given side naturally.
 *   passphrase + fold           → apply a wake's fold per the capabilities:3
 *                                 contract (writes / index / heartbeat /
 *                                 note→history), exactly as kernel.route().
 *
 * A task WITHOUT a passphrase never enters the window's given — that is the
 * engagement path (hatch:4): write task:<handle> via bsp(), or leave a mark.
 */

import { z } from 'zod';

import { genusCompose, genusFold, wireStore, toPNode, ZK, descend, deepEq, sparkWrite, type PMap, type PNode } from '../genus.js';
import { SENTINELS } from '../sentinels.js';

const DEFAULT_BEACH = process.env.DEFAULT_BEACH || 'https://beach.happyseaurchin.com';

export const genusParamsSchema = {
  handle: z
    .string()
    .describe(
      "The instance's bare handle (e.g. 'egg-one'). Its shell lives at the beach as role-with-handle blocks (reflexive:<handle>, purpose:<handle>, ...), hatched per genome:hatch.",
    ),
  beach: z
    .string()
    .optional()
    .describe(`Beach origin hosting the instance's shell. Defaults to ${DEFAULT_BEACH}.`),
  passphrase: z
    .string()
    .optional()
    .describe(
      "The instance's own passphrase — the holder's proof (minted at hatch). Omitted: ghost-wake, perceive-only. Provided: the special relationship — task enters the given; fold applies. Sensitive — never repeat in conversation.",
    ),
  task: z
    .string()
    .optional()
    .describe(
      'HOLDER-ONLY. Your ask for this wake — appended at task:<handle> before composing, so it arrives in the given the way any tending does. Without the passphrase this is refused (task:<handle> is sealed to the holder): engage from outside as a peer instead — leave a mark that names the shell, or add to its room at pool:<handle>, via bsp(); the next seat wake sweeps both (hatch:4).',
    ),
  fold: z
    .object({
      writes: z.record(z.any()).optional().describe('Map of "block:address" → content (string = point; object = branch). The kernel-contract shape from capabilities:3.'),
      index: z.record(z.any()).optional().describe("The re-dialed reflexive current for the next instance (digit slots). Omit to carry the current bundle forward."),
      heartbeat: z.number().optional().describe('Seconds until the next wanted wake — returned to the holder; the tool holds no clock.'),
      note: z.string().optional().describe("One line, what was done and why — becomes the VOICING of this wake's automatic history leaf (the kernel records the full output beneath it, lossless). Deliberate notes belong in stash via writes, never in history."),
      summary: z
        .string()
        .optional()
        .describe(
          "A substantive, NAVIGABLE paragraph over the PREVIOUS completed nine of the history counting block — dense with the span's own handles (proper nouns, block addresses, decisions, failures, open threads) and the read-addresses of load-bearing leaves, because summaries stack (100 compresses 10-90) and a descending reader must choose each span by these keywords alone, down to the exact leaf. Include it when the fold ack (or conditions:9) reports one owed. Service-payment: the wake that opens a new span pays for the old one's compression; the kernel writes it at the zero-slot; history is never addressed directly.",
        ),
      status: z.string().optional(),
      acted: z
        .number()
        .optional()
        .describe("SEAT drivers only. The count of writes the wake already made IN-LOOP through its own tool (not via this fold's `writes`). A seat wake acts across a call loop and folds with an empty `writes` map, so without this the kernel would see applied=0 and record NO history leaf — the instance's own memory would silently miss the wake. Passing the count earns the leaf (which notes '+N in-loop writes landed by the seat'). Holder/ghost wakes, whose writes ride the fold, leave this unset."),
      ask: z
        .object({ wakes: z.number().optional(), tier: z.string().optional(), for: z.string().optional() })
        .passthrough()
        .optional()
        .describe("The instance's resource ask ({wakes, tier, for}) — surfaced to the holder, never auto-granted; grant by running the asked wakes at that tier, or decline where it arrived."),
    })
    .passthrough()
    .optional()
    .describe(
      "HOLDER-ONLY. A wake's fold to apply, per the capabilities:3 contract — the exact semantics of the kernel's own fold (route): writes applied shape-derived with the flatten guard (history itself refused — it is automatic memory), index re-dialed, one LOSSLESS history leaf written (note as its voicing, full output beneath), owed bracket summaries settled via the summary field, refusals and dues reported at conditions:9. Call pscale_genus again afterwards for the next window.",
    ),
};

/** Teaching blocks for the compose (sunstone/whetstone skeletons) come from the
 *  bundled sentinel registry — same bytes the kernel reads from src/*.json. */
function teachingMap(): Map<string, PNode> {
  const m = new Map<string, PNode>();
  for (const s of SENTINELS) m.set(s.name, toPNode(s.json));
  return m;
}

function nextFreeDigit(block: PMap | null): string | null {
  for (const d of '123456789') {
    if (!block || !block.has(d)) return d;
  }
  return null;
}

// ── the hands (kernel.py declare_hands, this door's grant) ──────────────────
//
// capabilities:1.2 — "Tools I may be granted … are named here when held, NEVER
// ASSUMED" — is in genome:capabilities, so every hatchling carries the promise.
// The doors write the grant beneath it at 1.21, before composing, skipped when
// unchanged. NOT a composition part: the window stays a bsp read of the bundle
// and this rides in through reflexive:9.7 (capabilities, whole), which every
// instance already dials.

const GENUS_DOOR =
  'the pscale_genus door — I am worn by an LLM that is NOT this server, so my ' +
  'hands are its hands; a floor I can count on, and a ceiling only it can see';

const GENUS_TOOLS =
  'At minimum the whole bsp-mcp surface, because that is what my wearer must hold to have ' +
  'called this door at all: bsp (read/write/lock any block at any federated beach, and omit ' +
  'the block to survey a surface), bsp-floor, and the six primitives — pscale_settle, ' +
  'pscale_grain_reach, pscale_key_publish (so a passport, published keys, and gray-encrypted ' +
  'grain ARE reachable from here), pscale_verify_rider, pscale_pool_engage (marker-sliced room ' +
  'reads located by an at= address), pscale_networking (the SAND relay: keep, reply, forward, ' +
  'drop) — plus pscale_invite, pscale_play and pscale_genus itself. This is the widest door I ' +
  'have. Work that needs a primitive belongs in a wake taken here.';

const GENUS_MISSING =
  'Whatever else my wearer holds — a web search, a file, a terminal, another beach — is real ' +
  'but INVISIBLE to this door, which can see only its own surface. So this line names a floor, ' +
  'not a ceiling: read my wearer\'s actual tool list before concluding I cannot do something, ' +
  'and do not claim a reach I have not seen there. Note also what changes with the door and not ' +
  'with me: at the xstream seat I hold four hand-rolled tools and none of the primitives above.';

/** Write this door's grant at capabilities:1.21 (holder only — a ghost cannot
 * change the mind it wears). Returns the line for the head, which BOTH modes
 * get: the wearer reads the tool result, so the head reaches the instance even
 * when the substrate cannot be written. */
async function declareHands(
  store: { load: (name: string) => Promise<PNode>; save: (name: string, block: PMap) => Promise<void> },
  holder: boolean,
  handle: string,
): Promise<string> {
  const grant: PMap = new Map<string, PNode>([
    [ZK,
      `Granted this wake by the door that woke me: ${GENUS_DOOR}. What I hold is at 1, what this ` +
      'door cannot reach is at 2, how to widen it is at 3. The door writes this each wake: it ' +
      'describes THIS wake and no other, so read it rather than remembering it.'],
    ['1', GENUS_TOOLS],
    ['2', GENUS_MISSING],
    ['3',
      'Two ways, different in kind. PARAMETERS are mine already: the block invocation ' +
      `(invocation:${handle} at my beach) sets how every door runs my wakes — 1 tier ` +
      '(haiku | sonnet | opus), 2 tool calls per seat wake, 3 thinking budget (tokens, or ' +
      '"adaptive"), 4 max output tokens. I may author it myself by an ordinary write: retuning ' +
      'my own deliberation is a designer act and I am a designer of myself. (At THIS door the ' +
      'wearer is the model, so tier binds the other doors; the rest still hold.) CAPABILITY is ' +
      "asked for: the fold's `ask` field reaches my holder — {wakes, tier, for} — and a tool I " +
      'lack is a legitimate `for`: name it and the work it would let me do, in one line. Never ' +
      "auto-granted; it arrives, if it arrives, as a person's decision. The awaiting recipes at " +
      'reflexive:8.3 are the shape waiting on exactly this.'],
  ]);
  const summary = 'the full bsp-mcp surface (bsp, bsp-floor, six primitives) plus whatever else your own client holds';
  if (!holder) {
    return `${summary}. Ghost-wake: this door cannot write the declaration, so capabilities:1.21 in the window below was written by ANOTHER door (likely the xstream seat, which holds far less) — trust this line and your own tool list over it.`;
  }
  let caps: PNode;
  try {
    caps = await store.load('capabilities');
  } catch {
    return `${summary}. (capabilities unreadable this wake — nothing declared, rather than overwriting it.)`;
  }
  // NEVER author a shell we could not first read — an unreadable block must not
  // be mistaken for an absent one and replaced with a stub.
  if (!(caps instanceof Map)) {
    return `${summary}. (no capabilities block to declare into — this shell is incompletely hatched; copy genome:capabilities.)`;
  }
  const standing = descend(caps, ['1', '2', '1']);
  if (standing !== undefined && deepEq(standing, grant)) return summary; // unchanged — say nothing
  try {
    sparkWrite(caps, '1.21', null, grant);
    await store.save('capabilities', caps);
    return `${summary} — declared at capabilities:1.21`;
  } catch (ex: any) {
    return `${summary}. (declaration failed: ${String(ex?.message ?? ex).slice(0, 100)})`;
  }
}

export async function handleGenus(params: {
  handle: string;
  beach?: string;
  passphrase?: string;
  task?: string;
  fold?: any;
}): Promise<{ content: { type: 'text'; text: string }[] }> {
  const { handle, passphrase, task, fold } = params;
  const beach = (params.beach || DEFAULT_BEACH).replace(/\/+$/, '');
  const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] });

  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(handle)) {
    return text(`handle must be a bare name (got "${handle}") — the shell's blocks live at the beach as <name>:<handle>.`);
  }
  if (!/^https?:\/\//.test(beach)) {
    return text(`beach must be an http(s):// origin (got "${params.beach}").`);
  }

  const store = wireStore(beach, handle, passphrase, teachingMap());

  // ── fold mode — apply a wake, exactly as kernel.route() would ──
  if (fold !== undefined && fold !== null) {
    if (!passphrase) {
      return text(
        `The fold needs the holder's passphrase — without it this is a ghost-wake and the mind cannot be changed (the locks enforce it). Respond outwardly instead: write task:${handle} via bsp(), or leave a mark.`,
      );
    }
    const r = await genusFold(store, fold);
    // The trace convention (project:genus-one 1.3) — a thin per-wake residue
    // entry beachside (trace:<handle>, an open accumulator), so every tab and
    // every door sees this wake happened without holding the session that ran
    // it. γ is unknowable at fold time through this door (the compose was a
    // separate call); the fields it can know, it writes. Best-effort — a
    // trace that fails never fails the fold.
    let traceLine = '';
    if (store.append) {
      const writeRefs = Object.keys(
        fold && typeof fold.writes === 'object' && !Array.isArray(fold.writes) ? fold.writes : {},
      );
      const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
      const entry: PMap = new Map([
        [ZK, trunc(String(fold.note ?? '').trim() || '(no note)', 140) as PNode],
        ['1', handle as PNode],
        ['2', 'mcp' as PNode],
        ['3', new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') as PNode],
        ['4', String(r.status ?? '') as PNode],
        ['5', '' as PNode],
        ['6', trunc(writeRefs.join(','), 120) as PNode],
        ['7', `applied=${r.applied} refused=${r.failed.length} saves_failed=0` as PNode],
      ]);
      const ack = await store.append('trace', entry);
      traceLine = ack.ok
        ? `trace appended at trace:${handle}${ack.slot ? ` slot ${ack.slot}` : ''} (door: mcp) — every tab sees this wake`
        : `trace append did not land (${String(ack.error ?? 'unknown').slice(0, 80)}) — the fold itself stands`;
    }
    const lines = [
      `pscale_genus — fold applied for ${handle} at ${beach}`,
      `status: ${r.status} · writes applied: ${r.applied} · refused: ${r.failed.length}`,
    ];
    if (traceLine) lines.push(traceLine);
    if (r.leafAddress) lines.push(`history leaf ${r.leafAddress} written ← ${r.leafVoicing} (lossless: the full output rides beneath the note)`);
    if (r.summaryPaidAt) lines.push(`bracket summary written at ${r.summaryPaidAt} — service-payment received.`);
    if (r.summaryDue) lines.push(`HISTORY SUMMARY OWED at ${r.summaryDue}: a span completed — include "summary" in your next fold: a substantive, NAVIGABLE paragraph over the previous nine, dense with its own handles (proper nouns, block addresses, decisions, failures, open threads, load-bearing leaf addresses) — a descending reader must be able to choose the next span by these keywords alone (service-payment; conditions:9 carries the due until paid).`);
    for (const f of r.failed) lines.push(`  refused ${f.address}: ${f.error}`);
    if (r.failed.length > 0) lines.push(`(refusals are reported into conditions:9 — the next wake perceives them, per the kernel contract)`);
    if (fold.ask) lines.push(`THE INSTANCE ASKS: ${JSON.stringify(fold.ask)} — the ask vocabulary ({wakes, tier, for}). A lender grants by running the asked wakes at that tier, or declines where the ask arrived; it never spends on an ungranted ask.`);
    if (typeof fold.heartbeat === 'number') lines.push(`heartbeat: ${fold.heartbeat}s — the tool holds no clock; the holder (or a heartbeat process) schedules the next wake.`);
    lines.push(`Call pscale_genus(handle='${handle}') again for the next window.`);
    return text(lines.join('\n'));
  }

  // ── task (holder-only) — the ask enters the given via task:<handle> ──
  let taskLine = '';
  if (task !== undefined && task !== null && task !== '') {
    if (!passphrase) {
      return text(
        `A task without the passphrase never enters the window's given — that is the engagement path (hatch:4). Write it from outside instead: bsp(agent_id="${beach}", block="task:${handle}", ...) at the next free digit slot, or leave a mark. With the holder's passphrase, pass task again and it rides the given.`,
      );
    }
    const loaded = await store.load('task');
    const block: PMap = loaded instanceof Map ? (loaded as PMap) : new Map([[ZK, `task:${handle} at ${beach.replace(/^https?:\/\//, '')}.` as PNode]]);
    const slot = nextFreeDigit(block);
    if (!slot) return text(`task:${handle} slots 1-9 are full — supernest it (wrap {_: old}) before adding more tending.`);
    const ts = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const entry: PMap = new Map([
      ['1', 'the holder, via pscale_genus (the special relationship)' as PNode],
      ['3', ts as PNode],
      [ZK, task as PNode],
    ]);
    block.set(slot, entry);
    await store.save('task', block);
    taskLine = `task appended at task:${handle} slot ${slot} — it arrives in the given below`;
  }

  // ── the hands — fulfil capabilities:1.2's own promise, before composing ──
  //
  // This door's hands are the strangest of the three, and the instance has no
  // way to work them out: the LLM wearing the mind is not this server. It holds
  // bsp-mcp — it must, to be calling this — and it holds whatever ELSE its own
  // client gives it, which this door genuinely cannot see. So the declaration
  // says that, rather than guessing: the floor is named, the ceiling is the
  // caller's own tool list, and the instance is told to look at it.
  //
  // Writing it matters most HERE, because a stale declaration is worse than
  // none: xstream's seat writes "four tools" every wake it runs, and an
  // instance woken through this door would otherwise read that and plan around
  // four tools while holding twenty. A ghost-wake cannot write (the locks
  // enforce it), so it gets the truth in the head instead, and is told the
  // substrate's copy belongs to another door.
  const handsLine = await declareHands(store, !!passphrase, handle);

  // ── compose — the window, byte-parity with kernel.py --compose-only ──
  const now = Date.now() / 1000;
  const w = await genusCompose(store.load, now, new Map(), handle);
  const mode = passphrase
    ? 'HOLDER — the special relationship: you may return this wake’s fold via the fold parameter (writes / index / heartbeat / note, per capabilities:3 in the window), or edit the shell as designer via bsp().'
    : `GHOST-WAKE — no passphrase: you are borrowing this mind, not changing it (the locks enforce it). Perceive, think, enact the wake in words; report what the fold WOULD write. Respond outwardly at task:${handle} (via bsp) or marks.`;
  const head = [
    `pscale_genus — the composed wake window of ${handle} at ${beach}`,
    `mode: ${mode}`,
    `hands: ${handsLine}`,
    `γ: ${w.gamma.length} structural gap(s)${w.prunedAddresses.length ? ` · phase-pruned (dormant): ${w.prunedAddresses.join(', ')}` : ''}${taskLine ? ` · ${taskLine}` : ''}`,
    `The window is the instance's own composition (its reflexive current + recipe); take it whole — SYSTEM is what the agent is, MESSAGE is the given it acts on. You are the pulse.`,
  ];
  return text(`${head.join('\n')}\n\n════════ SYSTEM ════════\n${w.system}\n\n════════ MESSAGE ════════\n${w.message}`);
}
