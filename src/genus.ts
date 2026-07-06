/**
 * genus.ts — the composed wake window (and fold) of a genus-one instance.
 *
 * A faithful TypeScript PORT of genus-one/kernel.py's compose path (window =
 * a bsp read of the instance's reflexive bundle + the structural γ) and of its
 * route()/fold path, over genus-one/spark.py's read/write semantics. Held to
 * BYTE PARITY with `python3 genus-one/kernel.py --compose-only` by
 * scripts/smoke-genus-parity.ts against the frozen fixture at
 * scripts/fixtures/genus-parity/.
 *
 * PORT DISCIPLINE (CLAUDE.md genus-one rules): pscale-biome src/agent is the
 * canonical upstream; genus-one/kernel.py is its federated port; this file
 * follows kernel.py — re-base when it moves, never fork. The window is a bsp
 * read of a bundle (plus F's computed γ), nothing more; no composition parts
 * are added here that the kernel does not have.
 *
 * WHY ORDERED JSON: python dicts serialize in insertion order; JS objects
 * enumerate integer-like keys ("1".."9") FIRST regardless of insertion, so a
 * JSON.parse → JSON.stringify round-trip reorders pscale blocks whose files
 * put "_" before digits. Byte parity therefore requires (a) an order-
 * preserving parser (wire/file text → Map) and (b) a serializer that mirrors
 * python's json.dumps(indent=2, ensure_ascii=False). Both live here.
 */

// ── ordered JSON ────────────────────────────────────────────────────────────

export type PMap = Map<string, PNode>;
export type PNode = string | number | boolean | null | PNode[] | PMap;

/** JSON.parse with key order preserved — objects become Maps. */
export function parseOrdered(text: string): PNode {
  let i = 0;
  const err = (msg: string): never => {
    throw new Error(`ordered-json: ${msg} at ${i}`);
  };
  const ws = () => {
    while (i < text.length && ' \t\n\r'.includes(text[i])) i++;
  };
  const parseValue = (): PNode => {
    ws();
    const c = text[i];
    if (c === '{') {
      i++;
      const m: PMap = new Map();
      ws();
      if (text[i] === '}') {
        i++;
        return m;
      }
      for (;;) {
        ws();
        if (text[i] !== '"') err('expected key');
        const k = parseString();
        ws();
        if (text[i] !== ':') err('expected colon');
        i++;
        m.set(k, parseValue());
        ws();
        if (text[i] === ',') {
          i++;
          continue;
        }
        if (text[i] === '}') {
          i++;
          return m;
        }
        err('expected , or }');
      }
    }
    if (c === '[') {
      i++;
      const a: PNode[] = [];
      ws();
      if (text[i] === ']') {
        i++;
        return a;
      }
      for (;;) {
        a.push(parseValue());
        ws();
        if (text[i] === ',') {
          i++;
          continue;
        }
        if (text[i] === ']') {
          i++;
          return a;
        }
        err('expected , or ]');
      }
    }
    if (c === '"') return parseString();
    if (text.startsWith('true', i)) {
      i += 4;
      return true;
    }
    if (text.startsWith('false', i)) {
      i += 5;
      return false;
    }
    if (text.startsWith('null', i)) {
      i += 4;
      return null;
    }
    const m = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (m) {
      i += m[0].length;
      return Number(m[0]);
    }
    return err('unexpected token');
  };
  const parseString = (): string => {
    // text[i] === '"'
    i++;
    let out = '';
    while (i < text.length) {
      const c = text[i];
      if (c === '"') {
        i++;
        return out;
      }
      if (c === '\\') {
        const e = text[i + 1];
        i += 2;
        if (e === 'u') {
          out += String.fromCharCode(parseInt(text.slice(i, i + 4), 16));
          i += 4;
        } else {
          out += ({ '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' } as Record<string, string>)[e] ?? e;
        }
      } else {
        out += c;
        i++;
      }
    }
    return err('unterminated string');
  };
  const v = parseValue();
  ws();
  return v;
}

/** Mirror of python json.dumps(value, ensure_ascii=False, indent=2). */
export function pyDumps(v: PNode, indent = 2, level = 0): string {
  const pad = ' '.repeat(indent * (level + 1));
  const close = ' '.repeat(indent * level);
  if (v === null) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : JSON.stringify(v);
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    const items = v.map((x) => pad + pyDumps(x, indent, level + 1));
    return '[\n' + items.join(',\n') + '\n' + close + ']';
  }
  // Map — insertion order IS the contract
  const entries = Array.from(v.entries());
  if (entries.length === 0) return '{}';
  const items = entries.map(([k, x]) => pad + JSON.stringify(k) + ': ' + pyDumps(x, indent, level + 1));
  return '{\n' + items.join(',\n') + '\n' + close + '}';
}

/** Plain JSON (tool input) → PMap tree, preserving JS enumeration order. */
export function toPNode(v: any): PNode {
  if (v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
  if (Array.isArray(v)) return v.map(toPNode);
  const m: PMap = new Map();
  for (const [k, x] of Object.entries(v)) m.set(k, toPNode(x));
  return m;
}

/** Order-insensitive deep equality (for write read-back confirms). */
export function deepEq(a: PNode, b: PNode): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => deepEq(x, b[i]));
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [k, x] of a) {
      if (!b.has(k) || !deepEq(x, b.get(k)!)) return false;
    }
    return true;
  }
  return false;
}

// ── spark port (genus-one/spark.py, the federated "_" dialect) ─────────────

export const ZK = '_';
const DIGITS = '123456789';

const key = (d: string): string => (d === '0' ? ZK : d);

export class AddressError extends Error {}

export function descend(block: PNode, digits: string[]): PNode | undefined {
  let node: PNode | undefined = block;
  for (const d of digits) {
    const k = key(d);
    if (node instanceof Map && node.has(k)) node = node.get(k);
    else return undefined;
  }
  return node;
}

/** A node's voicing: descend "_" to the first string, or null if headless. */
export function voice(node: PNode | undefined): string | null {
  let n = node;
  while (n instanceof Map) {
    if (!n.has(ZK)) return null;
    n = n.get(ZK);
  }
  return typeof n === 'string' ? n : null;
}

/** Floor depth: count "_"-steps from the root to the first string. */
export function floorOf(block: PNode | undefined): number {
  let n = 0;
  let node = block;
  while (node instanceof Map) {
    if (!node.has(ZK)) return n;
    node = node.get(ZK);
    n += 1;
  }
  return n;
}

function statusOf(node: PNode | undefined): string {
  if (node === undefined || node === null) return 'absent';
  if (typeof node === 'string') return 'voiced';
  return voice(node) !== null ? 'voiced' : 'headless';
}

/** A pscale address to a walk (list of digit chars). Bare re-pins to the
 *  current floor; dotted left-pads to survive supernesting. */
export function parseAddr(number: string | number | null | undefined, flr: number): string[] {
  const s = number === null || number === undefined ? '' : String(number);
  if (s === '') return [];
  for (const c of s) {
    if (!'0123456789.'.includes(c)) throw new AddressError(`address holds a non-digit: ${JSON.stringify(s)}`);
  }
  const dots = s.split('.').length - 1;
  if (dots > 1) throw new AddressError(`address has more than one decimal: ${JSON.stringify(s)}`);
  if (s.includes('.')) {
    const [left, right] = s.split('.');
    if (left.length > flr) throw new AddressError(`left of decimal exceeds floor ${flr}: ${JSON.stringify(s)}`);
    return Array.from(left.padStart(flr, '0') + right);
  }
  return Array.from(s.length >= flr ? s : s.padStart(flr, '0'));
}

const NAME_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;
const ADDR_RE = /^\d+(\.\d+)?$/;
const ATT_RE = /^-?\d+$/;

/** A leaf that names another block: name | name:address | name:address:attention. */
export function parseReference(leaf: PNode | undefined): { name: string; address: string | null; attention: number | null } | null {
  if (typeof leaf !== 'string' || leaf === '' || leaf.includes(' ')) return null;
  const parts = leaf.split(':');
  let i = 0;
  const nameSegs: string[] = [];
  while (i < parts.length && NAME_RE.test(parts[i])) {
    nameSegs.push(parts[i]);
    i++;
  }
  if (nameSegs.length === 0) return null;
  const name = nameSegs.join(':');
  let address: string | null = null;
  let attention: number | null = null;
  if (i < parts.length) {
    if (ADDR_RE.test(parts[i])) {
      address = parts[i];
      i++;
    } else return null;
  }
  if (i < parts.length) {
    if (ATT_RE.test(parts[i])) {
      attention = parseInt(parts[i], 10);
      i++;
    } else return null;
  }
  return i === parts.length ? { name, address, attention } : null;
}

export type Loader = (name: string) => Promise<PNode | null>;

interface SparkResult {
  mode: string;
  [k: string]: any;
}

async function resolveRef(text: PNode | undefined, loader: Loader | null): Promise<SparkResult | null> {
  if (!loader || typeof text !== 'string') return null;
  const ref = parseReference(text);
  if (!ref) return null;
  const target = await loader(ref.name);
  if (target === null) return null;
  return spark(target, ref.address, ref.attention, { star: true, loader });
}

/** The read function (write is sparkWrite). Mirrors spark.spark. */
export async function spark(
  block: PNode,
  number: string | null,
  attention: number | null,
  opts: { star?: boolean; loader?: Loader | null } = {},
): Promise<SparkResult> {
  const flr = floorOf(block);
  if (number === null || String(number) === '') {
    if (attention === null) return { mode: 'whole', floor: flr, block };
    return disc(block, attention, flr);
  }
  const walk = parseAddr(number, flr);
  const term = flr - walk.length;
  if (attention === null) return spindle(block, walk, flr);
  if (attention === term) {
    const res = point(block, walk, term);
    if (opts.star && res.status === 'voiced') {
      const followed = await resolveRef(res.text, opts.loader ?? null);
      if (followed !== null) return followed;
    }
    return res;
  }
  if (attention > term) return ring(block, walk, attention, flr);
  return directory(block, walk, attention, flr);
}

function spindle(block: PNode, walk: string[], flr: number): SparkResult {
  const entries: any[] = [];
  let node: PNode | undefined = block;
  let off = false;
  for (let i = 0; i < walk.length; i++) {
    const k = key(walk[i]);
    node = !off && node instanceof Map && node.has(k) ? node.get(k) : undefined;
    if (node === undefined) off = true;
    entries.push({ depth: i + 1, pscale: flr - (i + 1), text: off ? null : voice(node), status: statusOf(node) });
  }
  return { mode: 'spindle', floor: flr, entries };
}

function point(block: PNode, walk: string[], term: number): SparkResult {
  const node = descend(block, walk);
  return { mode: 'point', pscale: term, text: node !== undefined ? voice(node) : null, status: statusOf(node) };
}

function ring(block: PNode, walk: string[], attention: number, flr: number): SparkResult {
  const depth = flr - attention;
  if (depth < 1) return { mode: 'ring', pscale: attention, head: voice(block), siblings: [] };
  const parent = descend(block, walk.slice(0, depth - 1));
  const walked = depth - 1 < walk.length ? walk[depth - 1] : null;
  const sibs: any[] = [];
  if (parent instanceof Map) {
    for (const d of DIGITS) {
      if (parent.has(d)) {
        const ch = parent.get(d)!;
        sibs.push({
          digit: d,
          text: ch instanceof Map ? voice(ch) : ch,
          status: statusOf(ch),
          is_branch: ch instanceof Map,
          is_walked: d === walked,
        });
      }
    }
  }
  return { mode: 'ring', pscale: attention, head: parent !== undefined ? voice(parent) : null, siblings: sibs };
}

function directory(block: PNode, walk: string[], attention: number, flr: number): SparkResult {
  const node = descend(block, walk);
  const remaining = flr - attention - walk.length;
  const build = (n: PNode | undefined, depthLeft: number): PNode => {
    if (!(n instanceof Map)) return n as PNode;
    if (depthLeft <= 0) return voice(n);
    const out: PMap = new Map();
    if (n.has(ZK)) out.set(ZK, voice(n)); // the head: collapse the _-chain
    for (const d of DIGITS) {
      if (n.has(d)) out.set(d, build(n.get(d), depthLeft - 1));
    }
    return out;
  };
  return { mode: 'directory', pscale: attention, subtree: node instanceof Map ? build(node, remaining) : (node as PNode) };
}

function disc(block: PNode, attention: number, flr: number): SparkResult {
  const target = flr - attention;
  const nodes: any[] = [];
  const rec = (n: PNode | undefined, depth: number, addr: string) => {
    if (depth === target) {
      nodes.push({ address: addr, text: n instanceof Map ? voice(n) : n, status: statusOf(n) });
      return;
    }
    if (n instanceof Map) {
      for (const d of [ZK, ...DIGITS]) {
        if (n.has(d)) rec(n.get(d), depth + 1, addr + (d === ZK ? '0' : d));
      }
    }
  };
  rec(block, 0, '');
  return { mode: 'disc', pscale: attention, nodes };
}

/** Walk to a node, creating missing intermediates and lifting strings. */
function ensure(block: PMap, digits: string[]): PMap {
  let node: PMap = block;
  for (const d of digits) {
    const k = key(d);
    if (!node.has(k)) node.set(k, new Map());
    else if (typeof node.get(k) === 'string') node.set(k, new Map([[ZK, node.get(k)!]])); // lift
    node = node.get(k) as PMap;
  }
  return node;
}

/** The write conjugate (spark._write). */
export function sparkWrite(block: PMap, number: string | null, attention: number | null, content: PNode): void {
  const flr = floorOf(block);
  if (number === null || String(number) === '') {
    if (attention === null && content instanceof Map) {
      block.clear();
      for (const [k, v] of content) block.set(k, v);
      return;
    }
    throw new AddressError('a write with no number needs a whole-block object');
  }
  const walk = parseAddr(number, flr);
  const term = flr - walk.length;
  if (attention === null || attention === term) {
    const parent = ensure(block, walk.slice(0, -1));
    parent.set(key(walk[walk.length - 1]), content);
    return;
  }
  if (attention > term) {
    if (!(content instanceof Map)) {
      throw new AddressError('a ring write replaces the digit children — content must be an object of digit keys');
    }
    const depth = flr - attention;
    const parent = ensure(block, walk.slice(0, depth - 1));
    for (const d of DIGITS) parent.delete(d);
    for (const [k, v] of content) parent.set(k, v);
    return;
  }
  const parent = ensure(block, walk.slice(0, -1));
  parent.set(key(walk[walk.length - 1]), content);
}

// ── kernel compose port (genus-one/kernel.py, compose-only path) ───────────

const REFLEXIVE_CURRENT = '9';
const CONCENTRATE = new Set(['sunstone', 'whetstone']);
const RIPENESS = 1.0;

/** Digits to the canonical display address: the decimal pins the floor. */
export function formatAddress(digits: string[], flr: number): string {
  const s = digits.join('');
  return digits.length <= flr ? s : s.slice(0, flr) + '.' + s.slice(flr);
}

const zeroText = (node: PNode | undefined): string | null => (typeof node === 'string' ? node : voice(node));

/** Voiced text at a digit-path tuple, or null. */
function at(block: PNode | undefined, path: string[]): string | null {
  let node: PNode | undefined = block;
  for (const d of path) {
    if (node instanceof Map && node.has(d)) node = node.get(d);
    else return null;
  }
  return zeroText(node);
}

export interface Candidate {
  address: string;
  type: 'missing' | 'compare';
  path: string[];
  target?: string;
  intended: string;
  perceived: string | null;
}

/** Walk Π top-down; the frontier is where ρ stops matching Π. (kernel.frontier_candidates) */
export function frontierCandidates(purpose: PNode | undefined, conditions: PNode | undefined): Candidate[] {
  const flr = floorOf(purpose);
  const out: Candidate[] = [];
  const rec = (node: PNode | undefined, path: string[]) => {
    if (!(node instanceof Map)) return;
    for (const d of DIGITS) {
      if (!node.has(d)) continue;
      const child = node.get(d)!;
      const p = [...path, d];
      const intended = zeroText(child);
      if (!intended) {
        if (child instanceof Map) rec(child, p); // headless intent — descend, no cell
        continue;
      }
      if (parseReference(intended)) continue; // a star anchor (e.g. vision:9), not a cell
      const addrStr = formatAddress(p, flr);
      const perceived = at(conditions, p);
      if (perceived === null) {
        out.push({ address: 'purpose:' + addrStr, type: 'missing', path: p, target: 'conditions:' + addrStr, intended, perceived: null });
      } else {
        out.push({ address: 'purpose:' + addrStr, type: 'compare', path: p, intended, perceived });
        if (child instanceof Map) rec(child, p);
      }
    }
  };
  rec(purpose, []);
  return out;
}

/** (now − last_touched) / period; never-fired → ∞ → admit. */
function phaseOf(period: string | null, lastTouched: string | null, now: number): number {
  if (lastTouched === null) return Infinity;
  const p = Number(period);
  const lt = Number(lastTouched);
  if (!Number.isFinite(p) || !Number.isFinite(lt)) return Infinity;
  return p > 0 ? (now - lt) / p : Infinity;
}

/** Every purpose-branch path that carries a period. (kernel._cadence_paths) */
function cadencePaths(cadence: PNode | undefined): string[][] {
  const out: string[][] = [];
  const rec = (node: PNode | undefined, path: string[]) => {
    if (!(node instanceof Map)) {
      if (path.length) out.push(path); // a bare-string period leaf
      return;
    }
    if (path.length && typeof node.get(ZK) === 'string') out.push(path);
    for (const d of DIGITS) {
      if (node.has(d)) rec(node.get(d), [...path, d]);
    }
  };
  rec(cadence, []);
  return out;
}

/** Drop periodic candidates not yet ripe. Pure arithmetic. (kernel.phase_prune) */
export function phasePrune(
  candidates: Candidate[],
  cadence: PNode | undefined,
  lasts: PNode | undefined,
  now: number,
): { kept: Candidate[]; pruned: Candidate[] } {
  if (cadencePaths(cadence).length === 0) return { kept: candidates, pruned: [] };
  const kept: Candidate[] = [];
  const pruned: Candidate[] = [];
  for (const c of candidates) {
    const path = c.path ?? [];
    let asleep = false;
    for (let k = 1; k <= path.length; k++) {
      const pre = path.slice(0, k);
      const period = at(cadence, pre);
      if (period === null) continue;
      const ph = phaseOf(period, at(lasts, pre), now);
      if (ph < RIPENESS) {
        asleep = true;
        break;
      }
    }
    (asleep ? pruned : kept).push(c);
  }
  return { kept, pruned };
}

/** γ entry as an ordered Map, matching kernel.py's dict insertion order. */
function gammaEntry(c: Candidate): PMap {
  const m: PMap = new Map();
  m.set('address', c.address);
  m.set('type', c.type);
  m.set('path', c.path);
  m.set('target', c.target ?? null);
  m.set('intended', c.intended);
  m.set('perceived', c.perceived);
  return m;
}

/** One node of the reflexive current as a map of addresses. (kernel._index_node) */
function indexNode(node: PNode, top = false): PNode {
  if (!(node instanceof Map)) return node;
  const out: PMap = new Map();
  for (const k of Array.from(node.keys()).sort()) {
    if ((k !== ZK && !/^\d+$/.test(k)) || (top && k === ZK)) continue;
    const v = node.get(k)!;
    out.set(k, v instanceof Map ? indexNode(v) : v);
  }
  return out;
}

/** Unwrap a spark read result into a bare nested pscale value. (kernel._nest) */
function nestOf(res: SparkResult | PNode): PNode {
  if (!(typeof res === 'object' && res !== null && !Array.isArray(res) && !(res instanceof Map))) return res as PNode;
  const r = res as SparkResult;
  switch (r.mode) {
    case 'point':
      return r.text ?? null;
    case 'directory':
      return r.subtree ?? null;
    case 'whole':
      return r.block;
    case 'ring': {
      const m: PMap = new Map();
      for (const s of r.siblings ?? []) {
        if (s.status !== 'absent') m.set(s.digit, s.text ?? null);
      }
      return m;
    }
    case 'disc': {
      const m: PMap = new Map();
      for (const n of r.nodes ?? []) m.set(n.address, n.text ?? null);
      return m;
    }
    case 'spindle':
      return (r.entries ?? []).filter((e: any) => e.status === 'voiced').map((e: any) => e.text ?? null);
    default:
      return r as unknown as PNode;
  }
}

/** A block concentrated to its ring: root voicing + branch headings. (kernel._skeleton) */
function skeleton(block: PMap): PMap {
  const out: PMap = new Map();
  const z = block.get(ZK);
  out.set(ZK, typeof z === 'string' ? z : (voice(block) ?? ''));
  for (const d of DIGITS) {
    if (block.has(d)) {
      const v = block.get(d)!;
      out.set(d, typeof v === 'string' ? v : voice(v));
    }
  }
  return out;
}

/** Hydrate one current from its address, star-resolved. (kernel.scoop) */
async function scoop(addr: string, load: Loader): Promise<PNode> {
  const ref = parseReference(addr);
  if (!ref) return addr;
  const block = await load(ref.name);
  if (block === null) return null;
  if (CONCENTRATE.has(ref.name)) return skeleton(block as PMap);
  if (!ref.address && ref.attention === null) return block; // whole block, nested as-is
  return nestOf(await spark(block, ref.address ?? null, ref.attention, { star: true, loader: load }));
}

/** Hydrate a (possibly nested) index node; nesting preserved. (kernel._hydrate) */
async function hydrate(node: PNode, load: Loader): Promise<PNode> {
  if (typeof node === 'string') return scoop(node, load);
  if (node instanceof Map) {
    const out: PMap = new Map();
    for (const [k, v] of node) out.set(k, await hydrate(v, load));
    return out;
  }
  return node;
}

/** Assemble one side of the window from a recipe branch. (kernel._side) */
async function side(branch: PNode | undefined, builders: Record<string, () => Promise<PNode> | PNode>): Promise<PMap> {
  const parts: PMap = new Map();
  if (branch instanceof Map) {
    for (const d of DIGITS) {
      const v = branch.get(d);
      if (typeof v === 'string' && v.trim()) {
        const tok = v.trim().split(/\s+/)[0].toLowerCase();
        if (tok in builders) parts.set(tok, await builders[tok]());
      }
    }
  }
  return parts;
}

export interface GenusWindow {
  system: string;
  message: string;
  gamma: PMap[];
  prunedAddresses: string[];
  bundle: PNode;
}

/**
 * F (structural only — exactly `--compose-only`: absence gaps pass, coherence
 * compares are undecidable without an LLM and assumed to cohere) + compose the
 * window per the instance's own recipe (reflexive:8.1). The between is the
 * peers map — kernel-side it comes from the nest-local peers.json; a server
 * tool holds no nest, so pass peers (or none → {}), matching a kernel run
 * without peers.json. (The peers-into-the-shell move is project:genus-one 2.7;
 * when the kernel lands it, port it here in lockstep.)
 */
export async function genusCompose(load: Loader, now: number, peers: Map<string, PNode> = new Map()): Promise<GenusWindow> {
  // F — structural gaps only (kernel.run_F with use_llm=False)
  const purpose = await load('purpose');
  const conditions = await load('conditions');
  const candidates = frontierCandidates(purpose ?? undefined, conditions ?? undefined);
  const cadence = (await load('cadence')) ?? new Map();
  const lasts = (await load('last-touched')) ?? new Map();
  const { kept, pruned } = phasePrune(candidates, cadence, lasts, now);
  const gamma = kept.filter((c) => c.type === 'missing').map(gammaEntry);

  // compose (kernel.compose_window)
  const refl = ((await load('reflexive')) ?? new Map()) as PMap;
  const nine = refl.get(REFLEXIVE_CURRENT);
  const bundle = indexNode(nine instanceof Map ? nine : new Map(), true);
  const builders: Record<string, () => Promise<PNode> | PNode> = {
    index: () => bundle,
    self: () => hydrate(bundle, load),
    gap: () => gamma as unknown as PNode,
    between: () => {
      const m: PMap = new Map();
      for (const [k, v] of peers) m.set(k, v);
      return m;
    },
    task: async () => (await load('task')) ?? new Map(),
  };
  const eight = refl.get('8');
  const workingNode = eight instanceof Map ? eight.get('1') : undefined;
  const working: PMap = workingNode instanceof Map ? workingNode : new Map();
  let process = await side(working.get('1'), builders);
  let given = await side(working.get('2'), builders);
  if (process.size === 0 && given.size === 0) {
    // recipe absent → safe default
    process = new Map([
      ['index', await builders.index()],
      ['self', await builders.self()],
    ]);
    given = new Map([
      ['gap', await builders.gap()],
      ['between', await builders.between()],
    ]);
  }
  const systemMap: PMap = new Map([['recipe', working as PNode], ...process]);
  return {
    system: pyDumps(systemMap),
    message: pyDumps(given),
    gamma,
    prunedAddresses: pruned.map((c) => c.address),
    bundle,
  };
}

// ── fold port (kernel.route + apply_write + report_failures) ───────────────

export interface BlockStore {
  load: Loader;
  save: (name: string, block: PMap) => Promise<void>;
}

/** Apply one spark write; shape derives from address + content. (kernel.apply_write) */
async function applyWrite(store: BlockStore, name: string, addr: string, content: PNode): Promise<void> {
  const loaded = await store.load(name);
  const block: PMap = loaded instanceof Map ? loaded : new Map([[ZK, name as PNode]]);
  const flr = floorOf(block);
  if (typeof content === 'string' && addr) {
    // flatten guard
    const digits = parseAddr(addr, flr);
    let node: PNode | undefined = block;
    for (const d of digits) {
      const k = key(d);
      node = node instanceof Map && node.has(k) ? node.get(k) : undefined;
      if (node === undefined) break;
    }
    if (node instanceof Map && Array.from(node.keys()).some((k) => /^\d+$/.test(k))) {
      throw new Error(`refusing to flatten a populated subtree at ${addr} with a bare string`);
    }
  }
  sparkWrite(block, addr || null, null, content);
  await store.save(name, block);
}

export interface FoldResult {
  status: string;
  applied: number;
  failed: { address: string; error: string }[];
  historySlot: string | null;
  historyEntry: string | null;
}

/** The fold — kernel.route ported: apply writes, re-dial the index, write the
 *  history note (kernel-timestamped, only when something was actually done),
 *  then set/clear the conditions:9 kernel report as a full pulse would. */
export async function genusFold(store: BlockStore, output: any): Promise<FoldResult> {
  let raw = output?.writes ?? output?.write ?? output?.edits;
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'address' in raw && 'content' in raw) raw = [raw];
  let pairs: [string, any][] = [];
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) pairs = Object.entries(raw);
  else if (Array.isArray(raw)) {
    for (const e of raw) {
      if (e && typeof e === 'object' && e.address) pairs.push([e.address, e.content]);
    }
  }
  let applied = 0;
  const failed: { address: string; error: string }[] = [];
  for (const [ref, content] of pairs) {
    const ci = ref.indexOf(':');
    const name = ci === -1 ? ref : ref.slice(0, ci);
    const addr = ci === -1 ? '' : ref.slice(ci + 1);
    if (!name) continue;
    try {
      await applyWrite(store, name, addr, toPNode(content));
      applied += 1;
    } catch (ex: any) {
      let msg = String(ex?.message ?? ex).slice(0, 140);
      if (ex instanceof AddressError && addr.split('.').length > 2) {
        const digits = Array.from(addr.replace(/\./g, ''));
        const blk = await store.load(name);
        const canon = formatAddress(digits, floorOf(blk instanceof Map ? blk : undefined) || 1);
        msg += ` — a pscale address carries at most ONE decimal; canonical form: ${name}:${canon}`;
      }
      failed.push({ address: ref, error: msg });
    }
  }
  if (raw && pairs.length === 0) failed.push({ address: '(writes)', error: `unrecognised writes shape: ${Array.isArray(raw) ? 'list' : typeof raw}` });

  // re-dial the next instance's bundle
  const nc = output?.index;
  if (nc && typeof nc === 'object' && !Array.isArray(nc) && Object.keys(nc).length > 0) {
    const refl = ((await store.load('reflexive')) ?? new Map()) as PMap;
    const nine = refl.get(REFLEXIVE_CURRENT);
    const keep0 = nine instanceof Map ? (nine.get(ZK) ?? 'The reflexive current — the bare-address bundle.') : 'The reflexive current — the bare-address bundle.';
    const next: PMap = new Map([[ZK, keep0]]);
    for (const [k, v] of Object.entries(nc)) {
      if (/^\d+$/.test(k)) next.set(k, toPNode(v));
    }
    refl.set(REFLEXIVE_CURRENT, next);
    await store.save('reflexive', refl);
  }

  // history only when something was done
  const note = String(output?.note ?? '').trim();
  let historySlot: string | null = null;
  let historyEntry: string | null = null;
  if (note && applied > 0) {
    const h = ((await store.load('history')) ?? new Map([[ZK, 'History.' as PNode]])) as PMap;
    historySlot = Array.from(DIGITS).find((i) => !h.has(i)) ?? null;
    if (historySlot) {
      const ts = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      historyEntry = `[${ts}] ${note}`;
      h.set(historySlot, historyEntry);
      await store.save('history', h);
    }
  }

  // kernel report into ρ — refused writes become perceived conditions (kernel.report_failures)
  const cond = ((await store.load('conditions')) ?? new Map([[ZK, 'conditions' as PNode]])) as PMap;
  const nine = cond.get('9');
  const had = typeof nine === 'string' && nine.startsWith('kernel report');
  if (failed.length > 0) {
    const lines = failed
      .slice(0, 3)
      .map((f) => `${f.address} -> ${f.error.slice(0, 80)}`)
      .join(' ; ');
    cond.set(
      '9',
      `kernel report — refused writes: ${lines} (refused by the substrate's shape rules, not judged: a populated branch takes an object or a deeper point, never a bare string).`,
    );
    await store.save('conditions', cond);
  } else if (had) {
    cond.delete('9');
    await store.save('conditions', cond);
  }

  const status = output?.status ?? (applied > 0 ? 'continue' : 'rest');
  return { status, applied, failed, historySlot, historyEntry };
}

// ── stores ──────────────────────────────────────────────────────────────────

/** The beach store — role-with-handle names over the wire, ordered parse of the
 *  raw response text (byte order preserved, exactly as python's json.loads),
 *  whole-block confirmed saves ({confirm: true} per the beach's replace gate). */
export function wireStore(beach: string, handle: string, secret?: string, teaching?: Map<string, PNode>): BlockStore {
  const origin = beach.replace(/\/+$/, '');
  const cache = new Map<string, PNode | null>();
  const endpoint = (name: string) => `${origin}/.well-known/pscale-beach?block=${encodeURIComponent(`${name}:${handle}`).replace(/%3A/gi, ':')}`;
  const fetchText = async (url: string, init?: RequestInit): Promise<{ status: number; text: string }> => {
    const attempt = async () => {
      const r = await fetch(url, init);
      return { status: r.status, text: await r.text() };
    };
    try {
      return await attempt();
    } catch {
      await new Promise((res) => setTimeout(res, 1500)); // retry-once: the observed transport flake recovers
      return attempt();
    }
  };
  const load: Loader = async (name) => {
    if (cache.has(name)) return cache.get(name)!;
    if (teaching?.has(name)) {
      const t = teaching.get(name)!;
      cache.set(name, t);
      return t;
    }
    const { status, text } = await fetchText(endpoint(name));
    if (status === 404) {
      cache.set(name, null);
      return null;
    }
    if (status >= 400) throw new Error(`beach load ${name}: HTTP ${status} ${text.slice(0, 120)}`);
    const parsed = parseOrdered(text);
    cache.set(name, parsed);
    return parsed;
  };
  const save = async (name: string, block: PMap) => {
    const body: PMap = new Map([
      ['content', block as PNode],
      ['confirm', true],
    ]);
    if (secret) body.set('secret', secret);
    const { status, text } = await fetchText(endpoint(name), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: pyDumps(body),
    });
    if (status >= 400) throw new Error(`beach write ${name}: HTTP ${status} ${text.slice(0, 140)}`);
    cache.delete(name);
    const back = await load(name); // confirm by read-back — a lost write must fail loudly
    if (!back || !deepEq(back, block)) throw new Error(`write to ${name} did not read back identical`);
  };
  return { load, save };
}

/** In-memory store for tests. */
export function memStore(initial: Record<string, PNode> = {}): BlockStore & { blocks: Map<string, PNode> } {
  const blocks = new Map<string, PNode>(Object.entries(initial));
  return {
    blocks,
    load: async (name) => (blocks.has(name) ? blocks.get(name)! : null),
    save: async (name, block) => {
      blocks.set(name, block);
    },
  };
}
