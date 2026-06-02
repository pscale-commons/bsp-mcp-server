/**
 * keys.ts — crypto module for gray (encrypted) engagement.
 *
 * Deterministic key derivation: Argon2id(secret, salt=handle) → X25519 + Ed25519.
 * The secret is a passphrase (HITL) or local block hash (NHITL). Never stored.
 *
 * Two encryption modes, both producing a SPINE-LEGAL envelope (every key is
 * "_" or a digit 1-9, so the federated beach shape gate accepts it, and a
 * walker without the secret sees opaque structure — privacy without secrecy
 * of existence):
 *   - self:  symmetric secretbox under the author's own derived key. Only the
 *            author (same secret + handle) decrypts. For private-to-me leaves.
 *   - grain: bilateral. Both parties derive ONE shared key via X25519 ECDH
 *            between their published keypairs (nacl.box.before). Either party
 *            reads either side; outsiders cannot. For private grain curation.
 *
 * Dependencies: tweetnacl (X25519/Ed25519/XSalsa20-Poly1305), hash-wasm (Argon2id).
 */

import nacl from 'tweetnacl';
import { argon2id } from 'hash-wasm';

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
 *     "9": { _: "gray", "1": "self" | "grain", "2"?: <partner handle> } }
 */
export interface GrayMeta {
  _: 'gray';
  '1': 'self' | 'grain' | 'group';
  '2'?: string;
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

/**
 * Derive X25519 + Ed25519 keypairs from a secret and agent_id (handle).
 * Argon2id: memory-hard, brute-force resistant. Same inputs → same keys.
 */
export async function deriveKeypair(secret: string, agentId: string): Promise<DerivedKeys> {
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
export function grayMode(node: any): 'self' | 'grain' | 'group' | null {
  if (!isGrayEnvelope(node)) return null;
  const m = (node['9'] as GrayMeta)['1'];
  return m === 'self' || m === 'grain' || m === 'group' ? m : null;
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
): Promise<GrayEnvelope> {
  const shared = await grainSharedKey(secret, myHandle, partnerX25519PubB64);
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

/** Trial-unwrap the group key from a keyring using only the reader's enc_secret. */
export async function unwrapGroupKeyFromKeyring(keyring: any, encSecret: string): Promise<Uint8Array | null> {
  if (!keyring || typeof keyring !== 'object') return null;
  for (const k of Object.keys(keyring)) {
    if (k === '_') continue;
    const entry = keyring[k];
    if (!entry || typeof entry !== 'object' || typeof entry['_'] !== 'string') continue;
    if (typeof entry['1'] !== 'string' || typeof entry['2'] !== 'string' || typeof entry['3'] !== 'string') continue;
    const K = await unwrapGroupKey(entry as GroupKeyEntry, encSecret, entry['_']);
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

// ── Block-level decryption (for walk) ──
//
// Walk a block and replace each gray envelope with its plaintext, using the
// supplied per-leaf decryptor (self or grain). Returns a new tree — does not
// mutate. Envelopes the decryptor cannot open render as "[encrypted]".

export async function decryptGrayNodes(
  node: any,
  decryptLeaf: (env: GrayEnvelope) => Promise<string | null>,
): Promise<any> {
  if (node === null || typeof node !== 'object') return node;
  if (isGrayEnvelope(node)) {
    const pt = await decryptLeaf(node);
    return pt !== null ? pt : '[encrypted]';
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
