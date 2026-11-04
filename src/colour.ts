/**
 * colour.ts — A COLOUR AT EVERY DOOR (coloured stigmergy, steps 2 and 3;
 * proposals/2026-11-03-coloured-stigmergy-the-design.md §2.3, §3.4, §4.1, §11).
 *
 * A colour is colour:<name>, an ordinary block latched whole by its keeper: an
 * accumulator of TURNS at its root, each {_: when, 1: the ring of copies of one
 * key as buildKeyring lays it, 2: that key's public half}. A coloured line names
 * its colour and its turn in its own 9 (keys.ts), so it stands in any block — a
 * notes block, a room, a mirror — and every door seals and opens it one way:
 *
 *   - THE WRITER'S DOOR seals before the line leaves. bsp() seals a line where
 *     it lands; the room and the stream tools seal a line's WORDS one zero
 *     deeper, at the contribution's underscore (§2.3), so its author, address,
 *     stamp and face stay open and the room's slots, presence and located views
 *     stand as they do for any line. The key is the colour's current turn's,
 *     worn by the session or opened from the writer's own copy; with no copy
 *     the line is a LETTER to the colour, which every holder reads and its
 *     writer cannot.
 *   - THE READER'S DOOR opens on read. A session puts its colours on once
 *     (wearFor): the first line of a turn met with a sealing word reads that
 *     colour block once and opens the reader's own copy, one derivation a
 *     session and one copy a turn, and every later line of that colour and
 *     turn opens with no key passed and no read (openWorn). A line the reader
 *     cannot open is one grey line (bsp-fn.ts sealedLine) in every shape but
 *     the whole block, and a room's synthesis is made over the open voices
 *     alone, saying how many stayed sealed.
 *
 * Nothing here is a primitive and nothing changes on the beach: a coloured
 * line is spine-legal JSON the beach stores, appends, supernests and stamps as
 * it does any node, and a call that touches no sealed line pays nothing here.
 */

import { type Block, readAt } from './bsp.js';
import { bspRead, sealedLine, envelopeOf, type BspReadResult } from './bsp-fn.js';
import { loadBlock } from './db.js';
import {
  grayMode,
  keyringEntries,
  unwrapGroupKeyFromKeyring,
  wornKey,
  wearColour,
  wornColour,
  colourSeal,
  colourLetter,
  colourOpen,
  type GrayEnvelope,
} from './keys.js';

/** A turn of a colour, as its block keeps it at a root slot. */
export interface Turn { address: string; node: any }

/** What a coloured write was sealed with: a worn turn, the writer's own copy,
 *  or a letter (no key of the writer's used), and the turn it names. */
export interface Sealed { envelope: GrayEnvelope; how: 'worn' | 'copy' | 'letter'; turn: string }

/** The turns of a colour block in accumulator order — the disc at pscale 0,
 *  each a node with a ring at 1 and a public half at 2 — named by the address
 *  the beach allocated, which stays good across a supernest ('3' at floor 2
 *  left-pads to 03 and walks the chain). */
export function colourTurns(block: Block): Turn[] {
  const out: Turn[] = [];
  let r: BspReadResult;
  try { r = bspRead(block, '', 0); } catch { return out; }
  for (const e of (r.entries ?? []) as Array<{ address: string }>) {
    const a = String(e.address ?? '');
    if (!/^\d+$/.test(a) || /^0+$/.test(a)) continue;
    let node: any;
    try { node = readAt(block, a); } catch { continue; }
    if (node && typeof node === 'object' && node['1'] && typeof node['1'] === 'object' && typeof node['2'] === 'string') out.push({ address: String(parseInt(a, 10)), node });
  }
  return out.sort((x, y) => parseInt(x.address, 10) - parseInt(y.address, 10));
}

/** A turn's key for this session: worn already, or opened from the reader's own
 *  copy (the hand's first, one derivation) and worn from then on. Null when no
 *  copy opens for the key given — and, where the hand is known and no copy in
 *  the ring names it or names nobody, without a derivation at all: a colour's
 *  copies name their holders (§3.3), so a hand outside the ring is shut by the
 *  ring itself, not by trying every copy under every other name. */
export async function keyOfTurn(origin: string, colour: string, turn: Turn, secret: string | undefined, hand: string | null): Promise<Uint8Array | null> {
  const at = wornKey(origin, colour, turn.address);
  let K = wornColour(at);
  if (!K && secret) {
    const copies = keyringEntries(turn.node['1']);
    if (hand && !copies.some((e) => e._ === hand || e._ === '')) return null;
    K = await unwrapGroupKeyFromKeyring(turn.node['1'], secret, hand);
    if (K) wearColour(at, K);
  }
  return K;
}

/** THE WRITER'S DOOR (§4.1): a sealer for one colour at one beach — its block
 *  read once, its current turn's key worn by this session or opened from the
 *  writer's own copy — sealing each line it is handed with that key, or, with
 *  no copy, as a letter to the turn's public half, which needs no key. */
export async function sealer(origin: string, colour: string, encSecret: string | undefined, hand: string | null): Promise<(plaintext: string) => Sealed> {
  const row = await loadBlock(origin, colour);
  if (!row) throw new Error(`no ${colour} at ${origin}: a colour is founded by its keeper first — bsp(agent_id="${origin}", block="${colour}", members=[…], new_lock=<the keeper's latch>).`);
  const turns = colourTurns(row.block);
  const current = turns[turns.length - 1];
  if (!current) throw new Error(`${colour} holds no turn to seal with.`);
  const worn = wornColour(wornKey(origin, colour, current.address));
  const K = worn ?? await keyOfTurn(origin, colour, current, encSecret, hand);
  return (plaintext: string): Sealed => K
    ? { envelope: colourSeal(plaintext, colour, current.address, K), how: worn ? 'worn' : 'copy', turn: current.address }
    : { envelope: colourLetter(plaintext, colour, current.address, current.node['2']), how: 'letter', turn: current.address };
}

/** One line sealed in a colour (bsp()'s write and append). */
export async function sealInColour(origin: string, colour: string, plaintext: string, encSecret: string | undefined, hand: string | null): Promise<Sealed> {
  return (await sealer(origin, colour, encSecret, hand))(plaintext);
}

/** The ack's line for a coloured write, append, commit, stage, say or keep. */
export function colourLine(colour: string, sealed: { how: 'worn' | 'copy' | 'letter'; turn: string }): string {
  return sealed.how === 'letter'
    ? `\n  ⓘ sealed as a letter to ${colour}, turn ${sealed.turn}: every holder of the colour reads it; you hold no copy, so you cannot read it back.`
    : `\n  ⓘ sealed in ${colour}, turn ${sealed.turn}.`;
}

/** A LINE'S WORDS ONE ZERO DEEPER (§2.3): the node the line voices, with the
 *  envelope at its underscore and every field beside it kept — the author at
 *  1, the address at 2, the stamp at 3, the face at 4, an option beneath. A
 *  bare position takes {_: envelope}, never the envelope itself, so what
 *  stands beneath a line is always a line and never the envelope's own fields. */
export function voicedIn(existing: unknown, envelope: GrayEnvelope): Record<string, unknown> {
  return existing && typeof existing === 'object' && !Array.isArray(existing)
    ? { ...(existing as Record<string, unknown>), _: envelope }
    : { _: envelope };
}

/** A coloured line opened through the colours this session wears, or null —
 *  no read, no key, no derivation: the glasses are on already. */
export function openWorn(env: GrayEnvelope, origin: string): string | null {
  if (grayMode(env) !== 'colour') return null;
  const K = wornColour(wornKey(origin, String(env['9']['2'] ?? ''), String(env['9']['3'] ?? '')));
  return K ? colourOpen(env, K) : null;
}

/** What a sealed line says to this reader — the line sealed where it stands or
 *  one zero deeper: its words through the session's worn colours, else the grey
 *  line, and whether it stayed shut. Null for a line that is not sealed. */
export function readSeal(node: unknown, origin?: string): { text: string; shut: boolean } | null {
  const env = envelopeOf(node);
  if (!env) return null;
  const words = origin ? openWorn(env, origin) : null;
  return words !== null ? { text: words, shut: false } : { text: sealedLine(env), shut: true };
}

/** Every colour and turn the sealed lines in a node name — sealed where they
 *  stand or one zero deeper, at any depth. */
export function coloursIn(node: unknown, found = new Map<string, { colour: string; turn: string }>()): Map<string, { colour: string; turn: string }> {
  if (!node || typeof node !== 'object') return found;
  const env = envelopeOf(node);
  if (env) {
    if (grayMode(env) === 'colour') {
      const colour = String(env['9']['2'] ?? ''), turn = String(env['9']['3'] ?? '');
      if (colour && turn) found.set(`${colour}|${turn}`, { colour, turn });
    }
    for (const k of Object.keys(node as object)) if (k !== '_' && k !== '1' && k !== '2' && k !== '9') coloursIn((node as any)[k], found);
    return found;
  }
  for (const k of Object.keys(node as object)) coloursIn((node as any)[k], found);
  return found;
}

/** THE READER'S GLASSES PUT ON (§4.1): for each colour and turn the sealed lines
 *  in `nodes` name that this session does not wear, with a sealing word given,
 *  read the colour block once and open the reader's own copy — one derivation a
 *  session, one copy a turn — and wear it. Nothing is read and nothing derived
 *  for a turn already worn, with no word, or for a hand the ring does not name;
 *  with no sealed line in the nodes nothing happens at all. */
export async function wearFor(nodes: unknown[], origin: string, secret: string | undefined, hand: string | null): Promise<void> {
  if (!secret) return;
  const wanted = new Map<string, { colour: string; turn: string }>();
  for (const n of nodes) coloursIn(n, wanted);
  const blocks = new Map<string, Promise<Block | null>>();
  for (const { colour, turn } of wanted.values()) {
    if (wornColour(wornKey(origin, colour, turn))) continue;
    let b = blocks.get(colour);
    if (!b) { b = loadBlock(origin, colour).then((r) => (r?.block as Block) ?? null).catch(() => null); blocks.set(colour, b); }
    const block = await b;
    const t = block ? colourTurns(block).find((x) => x.address === String(parseInt(turn, 10) || turn)) : null;
    if (t) await keyOfTurn(origin, colour, t, secret, hand).catch(() => null);
  }
}
