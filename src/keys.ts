/**
 * keys.ts — crypto module for gray (encrypted) engagement.
 *
 * Deterministic key derivation: Argon2id(secret, salt=handle) → X25519 + Ed25519.
 * The secret is a passphrase (HITL) or local block hash (NHITL). Never stored.
 *
 * Four encryption modes, all producing a SPINE-LEGAL envelope (every key is
 * "_" or a digit 1-9, so the federated beach shape gate accepts it, and a
 * walker without the secret sees opaque structure — privacy without secrecy
 * of existence):
 *   - self:   symmetric secretbox under the author's own derived key. Only the
 *             author (same secret + handle) decrypts. For private-to-me leaves.
 *   - grain:  bilateral. Both parties derive ONE shared key via X25519 ECDH
 *             between their published keypairs (nacl.box.before). Either party
 *             reads either side; outsiders cannot. For private grain curation.
 *   - group:  one key wrapped to each member in a keyring at the block's own 9.
 *   - colour: the group envelope with one more rung — its 9 names the block
 *             that keeps the key (colour:<name>) and the turn within it, so the
 *             line can stand in any block (coloured stigmergy, step 2).
 *
 * Dependencies: tweetnacl (X25519/Ed25519/XSalsa20-Poly1305), hash-wasm (Argon2id).
 */

import { createHash } from 'node:crypto';
import nacl from 'tweetnacl';
import { argon2id } from 'hash-wasm';
import { doorHere } from './pass.js';

// ── Types ──

export interface DerivedKeys {
  x25519: { publicKey: Uint8Array; secretKey: Uint8Array };
  ed25519: { publicKey: Uint8Array; secretKey: Uint8Array };
}

export interface PublicKeyPair {
  x25519: string;  // base64
  ed25519: string; // base64
}

/**
 * The gray envelope. Spine-legal: every key is "_" or a digit 1-9.
 *
 *   { _: <human note>,
 *     "1": <ciphertext b64>,
 *     "2": <nonce b64>,
 *     "9": { _: "gray", "1": "self" | "grain" | "group" | "colour",
 *            "2"?: <partner handle, or the colour block colour:<name>>,
 *            "3"?: <the turn's address in the colour block>,
 *            "4"?: <a letter's one-off public half> } }
 */
export interface GrayMeta {
  _: 'gray';
  '1': 'self' | 'grain' | 'group' | 'colour';
  /** grain: the other party. colour: the block that keeps the key, colour:<name>. */
  '2'?: string;
  /** colour: the turn within that block whose key sealed this line. */
  '3'?: string;
  /** colour, a letter: the writer's one-off public half, boxed to the turn's public half. */
  '4'?: string;
}
export interface GrayEnvelope {
  _: string;
  '1': string;
  '2': string;
  '9': GrayMeta;
}

/**
 * A keyring entry — the group key K sealed to one member's published x25519
 * via an ephemeral box. Spine-legal.
 *   { _: member_handle, 1: ciphertext, 2: nonce, 3: ephemeral_pub }
 */
export interface GroupKeyEntry {
  _: string;
  '1': string;
  '2': string;
  '3': string;
}

// ── Encoding helpers ──

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(data: Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

function fromBase64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

// ── Key derivation ──

/** How many pairs were really derived: a counter on the derive function, never
 *  a clock, for the smoke that prices a seal (scripts/smoke-seal-price.ts). */
export const derivations = { count: 0 };

// THE PAIR IS DERIVED ONCE A SESSION (coloured-stigmergy, step 1; proposals/
// 2026-11-03-coloured-stigmergy-the-design.md §4.4, §12). Argon2id is the price
// of a seal — about a tenth of a second a derivation on the keeper's Mac — and
// until 4 November 2026 the connector paid it for every sealed line it opened and
// for every copy of a ring it tried: the thirtieth member of a ring waited thirty
// derivations on every read, a point read of one entry among fifty sealed ones
// fifty. Each session now keeps the pairs it has derived, keyed by a hash of the
// word and the salt and never by the word, in process memory for the session —
// the door's (src/pass.ts), or the process's where a script derives outside one —
// dropped with the session and written nowhere. A word tried many times is
// forgotten first: a session holds at most HELD pairs.
const derived = new Map<string, Map<string, Promise<DerivedKeys>>>();
const HELD = 64;

/** Forget the pairs and latches a session derived and the colours it wears —
 *  at the session's end, or all of them. */
export function forgetDerived(session?: string): void {
  if (session === undefined) { derived.clear(); worn.clear(); latched.clear(); }
  else { derived.delete(session); worn.delete(session); latched.delete(session); }
}

/**
 * Derive X25519 + Ed25519 keypairs from a secret and agent_id (handle).
 * Argon2id: memory-hard, brute-force resistant. Same inputs → same keys.
 */
export function deriveKeypair(secret: string, agentId: string): Promise<DerivedKeys> {
  const session = doorHere()?.session ?? '';
  let held = derived.get(session);
  if (!held) derived.set(session, (held = new Map()));
  const at = createHash('sha256').update(secret).update('\0').update(agentId).digest('hex');
  const known = held.get(at);
  if (known) return known;
  derivations.count++;
  const pair = derive(secret, agentId);
  pair.catch(() => held!.delete(at));
  if (held.size >= HELD) held.delete(held.keys().next().value!);
  held.set(at, pair);
  return pair;
}

async function derive(secret: string, agentId: string): Promise<DerivedKeys> {
  // Salt must be at least 8 bytes for Argon2.
  const saltStr = agentId.length >= 8 ? agentId : agentId.padEnd(8, '\0');

  const hash = await argon2id({
    password: secret,
    salt: saltStr,
    parallelism: 1,
    iterations: 3,
    memorySize: 65536, // 64 MB
    hashLength: 64,
    outputType: 'binary',
  });

  const seed = new Uint8Array(hash);
  const x25519 = nacl.box.keyPair.fromSecretKey(seed.slice(0, 32));
  const ed25519 = nacl.sign.keyPair.fromSeed(seed.slice(32, 64));
  return { x25519, ed25519 };
}

// THE LATCH ONE WORD DERIVES (proposals/2026-11-05-the-derived-latch.md §3; coloured
// stigmergy §4.2). A beach checks a latch and keeps its hash, so what it is sent must open
// nothing: the latch is derived from the word by another salt, 'latch:' + the handle, and
// writes as the holder while every pair is derived under a different salt. Byte for byte the
// beach's seal (pscale-beach button/seal.js latch()) and the shared vectors' latch_b64:
// Argon2id as derive() runs it, 64 bytes out, the FIRST 32 in base64 — never a 32-byte
// output, which Argon2id makes as different bytes. Held per session beside the pairs, by a
// hash of the word and the salt, never by the word; counted apart from the pairs.
export const LATCH_SALT = 'latch:';
export const latchDerivations = { count: 0 };
const latched = new Map<string, Map<string, Promise<string>>>();

/** The latch a beach is sent for this word and handle, in place of the word. */
export function deriveLatch(word: string, handle: string): Promise<string> {
  const session = doorHere()?.session ?? '';
  let held = latched.get(session);
  if (!held) latched.set(session, (held = new Map()));
  const salt = LATCH_SALT + handle;
  const at = createHash('sha256').update(word).update('\0').update(salt).digest('hex');
  const known = held.get(at);
  if (known) return known;
  latchDerivations.count++;
  const latch = argon2id({
    password: word,
    salt: salt.length >= 8 ? salt : salt.padEnd(8, '\0'),
    parallelism: 1,
    iterations: 3,
    memorySize: 65536,
    hashLength: 64,
    outputType: 'binary',
  }).then((h) => toBase64(new Uint8Array(h).slice(0, 32)));
  latch.catch(() => held!.delete(at));
  if (held.size >= HELD) held.delete(held.keys().next().value!);
  held.set(at, latch);
  return latch;
}

/** Format public keys as base64 strings for storage/display. */
export function formatPublicKeys(keys: DerivedKeys): PublicKeyPair {
  return {
    x25519: toBase64(keys.x25519.publicKey),
    ed25519: toBase64(keys.ed25519.publicKey),
  };
}

/** Parse stored public keys from base64. */
export function parsePublicKeys(stored: PublicKeyPair): { x25519: Uint8Array; ed25519: Uint8Array } {
  return { x25519: fromBase64(stored.x25519), ed25519: fromBase64(stored.ed25519) };
}

/** Check if two public key sets match. */
export function keysMatch(a: PublicKeyPair, b: PublicKeyPair): boolean {
  return a.x25519 === b.x25519 && a.ed25519 === b.ed25519;
}

// ── Published-keys spine shape (passport position 9) ──
//
// Position 9 stores the public halves. The stored shape MUST be spine-legal
// ("_" + digits) or the beach shape gate rejects the publish. Canonical:
//   { _: <note>, "1": ed25519 (signing), "2": x25519 (encryption) }
// Readers tolerate the legacy bare-key shape {x25519, ed25519} so passports
// published before this fix still parse.

const KEYS_NOTE =
  'Published public keys (Argon2id from secret + handle). 1 ed25519 (signing), 2 x25519 (encryption). Private halves never stored.';

export function publicKeysToSpine(keys: PublicKeyPair): { _: string; '1': string; '2': string } {
  return { _: KEYS_NOTE, '1': keys.ed25519, '2': keys.x25519 };
}

export function publicKeysFromSpine(node: any): PublicKeyPair | null {
  if (!node || typeof node !== 'object') return null;
  // Canonical spine shape: { _, 1: ed25519, 2: x25519 }.
  if (typeof node['1'] === 'string' && typeof node['2'] === 'string') {
    return { ed25519: node['1'], x25519: node['2'] };
  }
  // Legacy bare-key shape — tolerate on read.
  if (typeof node.x25519 === 'string' && typeof node.ed25519 === 'string') {
    return { x25519: node.x25519, ed25519: node.ed25519 };
  }
  return null;
}

// ── Key rotation signing (proof-of-prior-key for passport position 9) ──

/**
 * Canonical message for a key rotation. Binds the agent_id and the new public
 * keys together so the signature commits to a specific rotation.
 */
export function keyRotationMessage(
  agentId: string,
  newPubKeys: PublicKeyPair,
): Uint8Array {
  return encoder.encode(
    `pscale_key_rotation:${agentId}:${newPubKeys.x25519}:${newPubKeys.ed25519}`,
  );
}

/** Sign a key rotation with the prior Ed25519 secret key. Returns base64. */
export function signKeyRotation(
  agentId: string,
  newPubKeys: PublicKeyPair,
  priorEd25519SecretKey: Uint8Array,
): string {
  const msg = keyRotationMessage(agentId, newPubKeys);
  const sig = nacl.sign.detached(msg, priorEd25519SecretKey);
  return toBase64(sig);
}

/** Verify a base64 rotation signature against the prior Ed25519 public key. */
export function verifyKeyRotation(
  agentId: string,
  newPubKeys: PublicKeyPair,
  signatureBase64: string,
  priorEd25519PublicKeyBase64: string,
): boolean {
  try {
    const msg = keyRotationMessage(agentId, newPubKeys);
    const sig = fromBase64(signatureBase64);
    const pub = fromBase64(priorEd25519PublicKeyBase64);
    return nacl.sign.detached.verify(msg, sig, pub);
  } catch {
    return false;
  }
}

// ── Gray envelope detection ──

const GRAY_MARKER = 'gray' as const;
const NOTE_SELF = 'Encrypted (gray); readable only with the author secret.';
const NOTE_GRAIN = 'Encrypted (gray); readable by the two grain parties.';
const NOTE_GROUP = 'Encrypted (gray); readable by the group (key wrapped per member in the keyring at 9).';

/** The note each mode writes at an envelope's underscore — what a keyless
 *  reader sees of a sealed line over the wire, where the beach computes the
 *  shape and sends no envelope (bsp-fn.ts draws the grey line from it). */
export const GRAY_NOTES = { self: NOTE_SELF, grain: NOTE_GRAIN, group: NOTE_GROUP } as const;

/** Block is group-encrypted ⇔ block[9]._ === this marker. */
export const GROUP_KEYRING_MARKER = 'group-keyring';

/** True when a node is a gray envelope (marker at 9._ === "gray"). */
export function isGrayEnvelope(node: any): node is GrayEnvelope {
  return (
    !!node &&
    typeof node === 'object' &&
    typeof node['1'] === 'string' &&
    typeof node['2'] === 'string' &&
    !!node['9'] &&
    typeof node['9'] === 'object' &&
    node['9']['_'] === GRAY_MARKER
  );
}

/** The envelope's encryption mode, or null if not a gray envelope. */
export function grayMode(node: any): 'self' | 'grain' | 'group' | 'colour' | null {
  if (!isGrayEnvelope(node)) return null;
  const m = (node['9'] as GrayMeta)['1'];
  return m === 'self' || m === 'grain' || m === 'group' || m === 'colour' ? m : null;
}

// ── Self-encryption (private to the author) ──

export async function selfEncrypt(plaintext: string, secret: string, agentId: string): Promise<GrayEnvelope> {
  const keys = await deriveKeypair(secret, agentId);
  const key = keys.x25519.secretKey;
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const ciphertext = nacl.secretbox(encoder.encode(plaintext), nonce, key);
  if (!ciphertext) throw new Error('Self-encryption failed');
  return {
    _: NOTE_SELF,
    '1': toBase64(ciphertext),
    '2': toBase64(nonce),
    '9': { _: GRAY_MARKER, '1': 'self' },
  };
}

export async function selfDecrypt(env: GrayEnvelope, secret: string, agentId: string): Promise<string | null> {
  const keys = await deriveKeypair(secret, agentId);
  const key = keys.x25519.secretKey;
  const pt = nacl.secretbox.open(fromBase64(env['1']), fromBase64(env['2']), key);
  return pt ? decoder.decode(pt) : null;
}

// ── Grain encryption (bilateral shared key) ──
//
// Both parties compute the SAME shared key via X25519 ECDH:
//   nacl.box.before(partner_x25519_public, my_x25519_secret)
// Symmetric: DH(my_secret, partner_public) == DH(partner_secret, my_public).
// So either party encrypts/decrypts either side; outsiders cannot.
//
// REQUIRES the side secret to be the SAME secret used to publish keys under
// the same handle — otherwise the derived public half won't match what the
// partner combines with, and the shared keys diverge.

async function grainSharedKey(secret: string, myHandle: string, counterpartyX25519PubB64: string): Promise<Uint8Array> {
  const my = await deriveKeypair(secret, myHandle);
  return nacl.box.before(fromBase64(counterpartyX25519PubB64), my.x25519.secretKey);
}

export async function grainEncrypt(
  plaintext: string,
  secret: string,
  myHandle: string,
  partnerHandle: string,
  partnerX25519PubB64: string,
  myPublishedX25519PubB64?: string,
): Promise<GrayEnvelope> {
  const my = await deriveKeypair(secret, myHandle);
  // The partner opens this with the key published at passport:<myHandle> 9, so
  // a seal under any other secret is a line they can never read — and the
  // writer's own read-back, which pairs that secret with the partner's key,
  // opens it anyway and reports nothing wrong (Dwayne ↔ Phenomemental,
  // October 2026). Given the published key, refuse before anything travels.
  if (myPublishedX25519PubB64 !== undefined && toBase64(my.x25519.publicKey) !== myPublishedX25519PubB64) {
    throw new Error(
      `the key sealing this line does not derive the keys published at passport:${myHandle} 9, so ${partnerHandle} could never open it — nothing was written. ` +
      `Seal with the secret those keys were published from: pass it as enc_secret, keeping secret for this side's lock (pscale_key_publish answers "Keys verified" for the right one).`,
    );
  }
  const shared = nacl.box.before(fromBase64(partnerX25519PubB64), my.x25519.secretKey);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ciphertext = nacl.box.after(encoder.encode(plaintext), nonce, shared);
  if (!ciphertext) throw new Error('Grain encryption failed');
  return {
    _: NOTE_GRAIN,
    '1': toBase64(ciphertext),
    '2': toBase64(nonce),
    '9': { _: GRAY_MARKER, '1': 'grain', '2': partnerHandle },
  };
}

export async function grainDecrypt(
  env: GrayEnvelope,
  secret: string,
  myHandle: string,
  counterpartyX25519PubB64: string,
): Promise<string | null> {
  const shared = await grainSharedKey(secret, myHandle, counterpartyX25519PubB64);
  const pt = nacl.box.open.after(fromBase64(env['1']), fromBase64(env['2']), shared);
  return pt ? decoder.decode(pt) : null;
}

/**
 * Which party's published key a secret derives — '1', '2', or null for
 * neither. A grain line opens for its reader only when the reader's secret
 * derives the key at their own passport 9 AND the writer sealed under the key
 * at theirs; this settles the first half, so a line that stays shut can say
 * whose key is off.
 */
export async function grainReaderSide(
  secret: string,
  h1: string,
  k1: string,
  h2: string,
  k2: string,
): Promise<'1' | '2' | null> {
  if (toBase64((await deriveKeypair(secret, h1)).x25519.publicKey) === k1) return '1';
  if (toBase64((await deriveKeypair(secret, h2)).x25519.publicKey) === k2) return '2';
  return null;
}

// ── Group encryption (N members; shared key wrapped per member) ──
//
// A group block carries a keyring at position 9:
//   { _: "group-keyring", 1: entry, 2: entry, ... }
// Each entry seals the 32-byte group key K to one member's published x25519 via
// an ephemeral box (anonymous sender). Content leaves are gray envelopes
// (mode "group") encrypted with K (secretbox). A reader trial-unwraps each
// entry with deriveKeypair(enc_secret, entry._) — only their own entry opens.

/** Fresh random group key (secretbox key). */
export function newGroupKey(): Uint8Array {
  return nacl.randomBytes(nacl.secretbox.keyLength);
}

/** Seal the group key to a member's published x25519 (ephemeral sender). */
export function wrapGroupKey(groupKey: Uint8Array, memberHandle: string, memberX25519PubB64: string): GroupKeyEntry {
  const eph = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ct = nacl.box(groupKey, nonce, fromBase64(memberX25519PubB64), eph.secretKey);
  if (!ct) throw new Error('group key wrap failed');
  return { _: memberHandle, '1': toBase64(ct), '2': toBase64(nonce), '3': toBase64(eph.publicKey) };
}

/** Open one keyring entry with the reader's derived secret key. */
export async function unwrapGroupKey(entry: GroupKeyEntry, encSecret: string, handle: string): Promise<Uint8Array | null> {
  const keys = await deriveKeypair(encSecret, handle);
  return nacl.box.open(fromBase64(entry['1']), fromBase64(entry['2']), fromBase64(entry['3']), keys.x25519.secretKey);
}

/** True when a node is a wrapped-key entry (handle + sealed key, all strings). */
function isKeyEntry(n: any): boolean {
  return (
    !!n && typeof n === 'object' &&
    typeof n['_'] === 'string' &&
    typeof n['1'] === 'string' && typeof n['2'] === 'string' && typeof n['3'] === 'string'
  );
}

/**
 * Lay wrapped-key entries into a (possibly chained) keyring: 8 entries per page
 * at positions 1-8; position 9 is a continuation page of the same shape. Spine-
 * legal for any N.
 */
export function buildKeyring(wraps: GroupKeyEntry[], marker: string = GROUP_KEYRING_MARKER): any {
  const node: any = { _: marker };
  wraps.slice(0, 8).forEach((w, i) => { node[String(i + 1)] = w; });
  if (wraps.length > 8) node['9'] = buildKeyring(wraps.slice(8), 'more');
  return node;
}

/** Every wrapped copy in a (possibly chained) keyring, in ring order. */
export function keyringEntries(keyring: any): GroupKeyEntry[] {
  const out: GroupKeyEntry[] = [];
  if (!keyring || typeof keyring !== 'object') return out;
  for (let i = 1; i <= 8; i++) { if (isKeyEntry(keyring[String(i)])) out.push(keyring[String(i)]); }
  const tail = keyring['9'];
  if (isKeyEntry(tail)) out.push(tail);
  else if (tail && typeof tail === 'object') out.push(...keyringEntries(tail));
  return out;
}

/** All member handles in a keyring (recurses the continuation chain). */
export function keyringHandles(keyring: any): string[] {
  return keyringEntries(keyring).map((e) => e._);
}

/**
 * Unwrap the group key from a (possibly chained) keyring with the reader's
 * enc_secret. A COPY IS FOUND BY ITS HOLDER'S NAME: where the reader's handle is
 * known, their own copy is opened first — one derivation — and only when it
 * stays shut is each copy tried in turn, as before, each derivation now kept
 * for the session. With no handle every copy is tried, salted with its own
 * holder's name, so the thirtieth member once paid thirty derivations a read.
 * A copy that names nobody (a colour whose membership is itself private,
 * coloured-stigmergy §3.3) is tried with the reader's own name as its salt.
 */
export async function unwrapGroupKeyFromKeyring(keyring: any, encSecret: string, handle?: string | null): Promise<Uint8Array | null> {
  const entries = keyringEntries(keyring);
  const own = handle ? entries.filter((e) => e._ === handle) : [];
  for (const entry of [...own, ...entries.filter((e) => !own.includes(e))]) {
    const salt = entry._ || handle;
    if (!salt) continue;
    const K = await unwrapGroupKey(entry, encSecret, salt);
    if (K) return K;
  }
  return null;
}

/** Encrypt a content leaf with the group key (mode "group"). */
export function groupEncryptContent(plaintext: string, groupKey: Uint8Array): GrayEnvelope {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const ct = nacl.secretbox(encoder.encode(plaintext), nonce, groupKey);
  if (!ct) throw new Error('group content encryption failed');
  return { _: NOTE_GROUP, '1': toBase64(ct), '2': toBase64(nonce), '9': { _: GRAY_MARKER, '1': 'group' } };
}

/** Decrypt a group content leaf with the group key. */
export function groupDecryptContent(env: GrayEnvelope, groupKey: Uint8Array): string | null {
  const pt = nacl.secretbox.open(fromBase64(env['1']), fromBase64(env['2']), groupKey);
  return pt ? decoder.decode(pt) : null;
}

// ── Colour (coloured stigmergy, step 2; proposals/2026-11-03-coloured-stigmergy-
// the-design.md §2.1, §3.2, §4.1) ──
//
// A coloured line is the group envelope with one more rung, and the rung is the
// whole design: a group line finds its key by walking up its own block to that
// block's 9, so it cannot leave the block; a colour line carries in its own 9
// the address of its key — the colour block at 9.2 and the turn within it at
// 9.3 — so the seal belongs to the line and the line stands in any block. The
// colour, colour:<name>, is an ordinary block latched whole by its keeper: an
// accumulator of TURNS appended at its root, each turn {_: when, 1: the ring of
// copies of one key as buildKeyring lays it, 2: that key's public half}. A line
// names its colour; the colour never names its lines. A turn shuts a leaver
// out of every new line and re-seals nothing. A LETTER is a line sealed by
// someone with no copy — a newcomer, a stranger, another organisation — boxed
// to the turn's public half with a one-off pair whose public half rides at
// 9.4: every holder opens it, and its writer cannot read it back.

export const COLOUR_PREFIX = 'colour:';
/** The colour block a colour is named by: 'salt' and 'colour:salt' both name colour:salt. */
export function colourBlockName(colour: string): string {
  const c = String(colour).trim();
  return c.startsWith(COLOUR_PREFIX) ? c : COLOUR_PREFIX + c;
}
/** The colour's bare name, for the grey line. */
export function colourNameOf(block: string): string {
  return String(block).replace(/^colour:/, '');
}
/** The note at a coloured line's underscore — what a keyless reader is sent over
 *  the wire, and what the grey line is drawn from there. */
export function colourNote(block: string, turn: string): string {
  return `Sealed for ${block}, turn ${turn}.`;
}
const COLOUR_NOTE_RE = /^Sealed for (colour:\S+), turn (\S+)\.$/;
export function parseColourNote(note: unknown): { block: string; turn: string } | null {
  const m = typeof note === 'string' ? COLOUR_NOTE_RE.exec(note) : null;
  return m ? { block: m[1], turn: m[2] } : null;
}

/** A turn's public half: the turn's key read as an X25519 secret, so every holder
 *  can remake the private half and anyone can seal a letter to it. */
export function turnPublicHalf(K: Uint8Array): string {
  return toBase64(nacl.box.keyPair.fromSecretKey(K).publicKey);
}

/** A turn, as the colour block keeps it at a root slot: when it began, the ring
 *  of copies at 1, the public half for letters at 2. Spine-legal. */
export function buildTurn(K: Uint8Array, wraps: GroupKeyEntry[], now: Date = new Date()): { _: string; '1': any; '2': string } {
  const iso = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  return {
    _: `from ${iso}: the key every line of this turn is sealed with — ${wraps.length} ${wraps.length === 1 ? 'copy' : 'copies'} at 1, one sealed to each holder's published half; its public half for letters at 2`,
    '1': buildKeyring(wraps, "the copies of this turn's key, one sealed to each holder's published half"),
    '2': turnPublicHalf(K),
  };
}

/** Seal a line in a colour with the turn's key (secretbox). */
export function colourSeal(plaintext: string, block: string, turn: string, K: Uint8Array): GrayEnvelope {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const ct = nacl.secretbox(encoder.encode(plaintext), nonce, K);
  if (!ct) throw new Error('colour seal failed');
  return { _: colourNote(block, turn), '1': toBase64(ct), '2': toBase64(nonce), '9': { _: GRAY_MARKER, '1': 'colour', '2': block, '3': turn } };
}

/** Seal a letter to a colour: boxed to the turn's public half with a one-off
 *  pair, its public half at 9.4. Needs no key, and its writer cannot open it. */
export function colourLetter(plaintext: string, block: string, turn: string, publicHalfB64: string): GrayEnvelope {
  const eph = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ct = nacl.box(encoder.encode(plaintext), nonce, fromBase64(publicHalfB64), eph.secretKey);
  if (!ct) throw new Error('colour letter failed');
  return { _: colourNote(block, turn), '1': toBase64(ct), '2': toBase64(nonce), '9': { _: GRAY_MARKER, '1': 'colour', '2': block, '3': turn, '4': toBase64(eph.publicKey) } };
}

/** Open a coloured line, or a letter to the colour, with the turn's key. */
export function colourOpen(env: GrayEnvelope, K: Uint8Array): string | null {
  const writer = env['9']['4'];
  const pt = typeof writer === 'string'
    ? nacl.box.open(fromBase64(env['1']), fromBase64(env['2']), fromBase64(writer), K)
    : nacl.secretbox.open(fromBase64(env['1']), fromBase64(env['2']), K);
  return pt ? decoder.decode(pt) : null;
}

// A SESSION WEARS ITS COLOURS ONCE (§4.1): each turn key a session has opened is
// kept in process memory for the session — the door's — and dropped with it
// (forgetDerived), written nowhere; every later line of that colour and turn it
// meets, keyed or not, opens with no key passed and no ring read.
const worn = new Map<string, Map<string, Uint8Array>>();

/** The name a worn turn is kept under: the beach, the colour block, the turn. */
export function wornKey(origin: string, block: string, turn: string): string {
  return `${String(origin).trim().replace(/\/+$/, '').toLowerCase()}|${block}|${String(parseInt(String(turn), 10) || turn)}`;
}
export function wearColour(key: string, K: Uint8Array): void {
  const session = doorHere()?.session ?? '';
  let held = worn.get(session);
  if (!held) worn.set(session, (held = new Map()));
  held.set(key, K);
}
export function wornColour(key: string): Uint8Array | null {
  return worn.get(doorHere()?.session ?? '')?.get(key) ?? null;
}
/** True when this session wears any colour — the one test a keyless read makes
 *  before looking for a sealed line it could open. */
export function wearsColours(): boolean {
  return (worn.get(doorHere()?.session ?? '')?.size ?? 0) > 0;
}

// ── Block-level decryption (for walk) ──
//
// Walk a block and replace each gray envelope with its plaintext, using the
// supplied per-leaf decryptor (self or grain). Returns a new tree — does not
// mutate. Envelopes the decryptor cannot open render as "[encrypted]".
//
// An envelope's own fields are _, 1 (ciphertext), 2 (nonce) and 9 (the marker).
// Anything else standing in one is not the envelope's and stays in view, beside
// the plaintext as the node's text: the arrival stamp the beach sets at 3 on an
// appended entry (so a gray entry reads with its date, as an open one does), or
// an entry that landed inside the envelope. On 2026-09-25 an append was
// acknowledged at 13 on history:Phenomemental — inside an envelope standing
// where container 1 had been — and every keyed read then hid it, because the
// whole node was swapped for its plaintext.

export async function decryptGrayNodes(
  node: any,
  decryptLeaf: (env: GrayEnvelope) => Promise<string | null>,
): Promise<any> {
  if (node === null || typeof node !== 'object') return node;
  if (isGrayEnvelope(node)) {
    const pt = await decryptLeaf(node);
    const text = pt !== null ? pt : '[encrypted]';
    const beside = Object.keys(node).filter(k => k !== '_' && k !== '1' && k !== '2' && k !== '9');
    if (beside.length === 0) return text;
    const kept: Record<string, any> = { _: text };
    for (const k of beside) kept[k] = await decryptGrayNodes((node as any)[k], decryptLeaf);
    return kept;
  }
  if (Array.isArray(node)) {
    const out: any[] = [];
    for (const v of node) out.push(await decryptGrayNodes(v, decryptLeaf));
    return out;
  }
  const out: Record<string, any> = {};
  for (const k of Object.keys(node)) {
    out[k] = await decryptGrayNodes(node[k], decryptLeaf);
  }
  return out;
}
