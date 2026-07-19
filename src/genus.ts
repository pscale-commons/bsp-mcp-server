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
    if (!'0123456789.'.includes(c)) {
      // The underscore is the key an instance SEES when it reads its own
      // blocks, so reaching for it as an address is the natural mistake —
      // egg-three made it twice in one wake (guide:_, watch:_) and lost the
      // voicing of two blocks it had just authored. Digit 0 walks to `_`, so
      // say that here rather than only refusing: the refusal is the one moment
      // the lesson is wanted. (kernel.py / spark.py parity)
      if (s.includes('_')) {
        throw new AddressError(
          `address holds a non-digit: ${JSON.stringify(s)} — the underscore is addressed as digit 0, ` +
          `so a block's own voicing is written at :0 (guide:0), and a branch's at :10, :20 and so on`,
        );
      }
      throw new AddressError(`address holds a non-digit: ${JSON.stringify(s)}`);
    }
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
  /** Accumulator append — the beach allocates the next free slot atomically
   *  and supernests on rollover. Required for room writes (the room is an
   *  accumulator; a fold never addresses or replaces it) and used for the
   *  per-wake trace. Optional: a store without it refuses room writes. */
  append?: (name: string, entry: PMap) => Promise<{ ok: boolean; slot?: string; error?: string }>;
  /** The instance's own handle, when known — lets the fold normalise the
   *  substrate spelling of an organ (name:handle) back to the bare organ. */
  handle?: string;
}

/** A fold write key is "name[:addr]" — but block names may themselves carry
 *  colons (role-with-handle at the beach), so splitting at the FIRST colon
 *  truncates the name and misreads the rest as an address ("pool:egg-one" →
 *  addr "egg-one", a non-digit path — the fault egg-one recorded at its
 *  located:5). The address is the TRAILING segment, and only when it reads
 *  as one (digits and dots); otherwise the whole key is the name. An
 *  own-handle suffix then normalises back to the bare organ: "pool:egg-one"
 *  ≡ "pool" for egg-one itself. (kernel._split_ref parity)
 */
export function splitRef(ref: string, handle?: string): [string, string] {
  const ci = ref.lastIndexOf(':');
  let name = ref;
  let addr = '';
  if (ci !== -1 && /^[0-9.]*$/.test(ref.slice(ci + 1))) {
    name = ref.slice(0, ci);
    addr = ref.slice(ci + 1);
  }
  if (handle && name.endsWith(':' + handle)) name = name.slice(0, -handle.length - 1);
  return [name, addr];
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

// ── history — the agent's memory, automatic (2026-07-07 spec) ──────────────
// One LOSSLESS leaf per applied wake in the digit-bracket ladder: leaves at
// N1..N9 inside bracket N, the note as the leaf's voicing, the full output
// beneath it. A closed container's 0+ summary is owed at its voicing — read
// at the zero-padded address (10, 20, 140, 100, …) — and paid by the
// requesting LLM (service-payment), surfaced via conditions:9 until paid.

const HISTORY_VOICING =
  "History — my memory, automatic; a counting block. The kernel writes one lossless leaf per wake at the next zero-free number (1..9, 11..19, …, 99, 111, … — at each all-nines boundary the block supernests: the past wraps under the root underscore where its addresses keep reading, zero-padded, and the count continues). Every zero-carrying number is a summary slot, never an entry: N0 is the voicing of container N and carries a +0 summary of the PREVIOUS completed nine — 20 summarises 11-19, 100 summarises 10-90, 110 summarises 91-99. A summary is NAVIGATION, not decoration: a substantive paragraph dense with the span's own handles — proper nouns, block addresses, decisions, failures, open threads, the read-addresses of load-bearing leaves — because summaries stack (100 compresses 10-90; 1000 compresses those) and a descending reader must find at every layer the exact keywords that choose the next span, down to the leaf. Owed when the next span opens; paid by the requesting LLM via the fold's summary field (service-payment, reported at conditions:9 until paid). The spindle through the newest leaf carries the summary chain. Never written by hand — deliberate notes go to stash.";

/** The counting block's floor (underscore-chain depth); born at floor 1. */
function ladderFloor(h: PMap): number {
  let node: PNode | undefined = h;
  let f = 0;
  while (node instanceof Map && node.has(ZK)) {
    node = node.get(ZK);
    f += 1;
  }
  return Math.max(f, 1);
}

/** The next zero-free number on the counting line: …9 → 11, 19 → 21, 99 → 111. */
function succ(digits: string[]): string[] {
  const ds = [...digits];
  let i = ds.length - 1;
  while (i >= 0 && ds[i] === '9') {
    ds[i] = '1';
    i -= 1;
  }
  if (i < 0) return Array(digits.length + 1).fill('1');
  ds[i] = String(Number(ds[i]) + 1);
  return ds;
}

/** Digit-path of the newest leaf (greedy max walk to the floor), or null when
 *  the current floor holds no leaves yet (birth, or just wrapped). */
function lastLeaf(h: PMap, floor: number): string[] | null {
  let node: PNode | undefined = h;
  const path: string[] = [];
  for (let d = 0; d < floor; d++) {
    const ks = Array.from('123456789').filter((k) => node instanceof Map && node.has(k));
    if (ks.length === 0) return null;
    const k = ks[ks.length - 1];
    path.push(k);
    node = (node as PMap).get(k);
  }
  return path;
}

/** Advance the counting block: SUPERNEST at the all-nines boundary (the past
 *  wraps under the root underscore, absorption keeping every old address
 *  readable zero-padded), then the count continues at 11, 111, … — never
 *  101: a zero walks a voicing or a hidden directory, reserved territory. */
function historyNext(h: PMap): { floor: number; path: string[] } {
  let floor = ladderFloor(h);
  const last = lastLeaf(h, floor);
  let nxt: string[] = last === null ? Array(floor).fill('1') : succ(last);
  if (nxt.length > floor) {
    const old: PMap = new Map(h);
    h.clear();
    h.set(ZK, old);
    floor += 1;
    nxt = Array(floor).fill('1');
  }
  return { floor, path: nxt };
}

function walkPath(h: PNode | undefined, path: string[]): PNode | undefined {
  let node = h;
  for (const d of path) {
    node = node instanceof Map ? node.get(d) : undefined;
    if (node === undefined) return undefined;
  }
  return node;
}

/** Create the (headless) containers above a leaf; their voicings are the
 *  zero-slot summary positions. */
function ensureContainers(h: PMap, path: string[]): PMap {
  let node: PMap = h;
  for (const d of path.slice(0, -1)) {
    if (!(node.get(d) instanceof Map)) node.set(d, new Map());
    node = node.get(d) as PMap;
  }
  return node;
}

/** Zero-slot read-addresses (10, 20, 100, 110, …) whose +0 summary of the
 *  PREVIOUS completed nine is owed — every headless container, oldest first
 *  (100 before 110). A container exists only once its first leaf lands, so a
 *  due arises exactly when the next span opens — the 'latter' trigger. */
function historySummaryDues(h: PMap, floor: number): string[] {
  const dues: string[][] = [];
  const rec = (node: PMap, path: string[]) => {
    for (const d of '123456789') {
      const child = node.get(d);
      if (child instanceof Map && path.length + 1 < floor) {
        if (typeof child.get(ZK) !== 'string') dues.push([...path, d]);
        rec(child, [...path, d]);
      }
    }
  };
  rec(h, []);
  return dues.map((p) => p.join('') + '0'.repeat(floor - p.length)).sort();
}

/** Human range of the previous completed nine a zero-slot summarises —
 *  20 → 11-19; 100 → 10-90; 110 → 91-99; 360 → 351-359. Display only. */
export function historyPredSpan(readAddr: string, floor: number): string {
  const ds = [...readAddr.replace(/0+$/, '')];
  let i = ds.length - 1;
  while (i >= 0 && ds[i] === '1') {
    ds[i] = '9';
    i -= 1;
  }
  let prev: string[];
  let subFloor: number;
  if (i < 0) {
    prev = ds.slice(1); // crossed a wrap: the material sits at the previous floor
    subFloor = floor - 1;
  } else {
    ds[i] = String(Number(ds[i]) - 1);
    prev = ds;
    subFloor = floor;
  }
  const pad = '0'.repeat(Math.max(subFloor - prev.length - 1, 0));
  const p = prev.join('');
  return `${p}1${pad}-${p}9${pad}`;
}

/** Write a +0 summary at a zero-slot: the trailing zeros locate the container;
 *  its voicing takes the text (so N0 reads the summary). */
function historyPaySummary(h: PMap, readAddr: string, summary: string): boolean {
  const node = walkPath(h, [...readAddr.replace(/0+$/, '')]);
  if (node instanceof Map) {
    node.set(ZK, summary);
    return true;
  }
  return false;
}

/** Kernel-mechanical dial upkeep (same class as last-touched): while slot 6
 *  still dials history, keep it at the living edge — the spindle through the
 *  newest leaf (the 143 walk: its voicings ARE the summary chain), the
 *  sibling-summary ring, and the last few leaves hydrated in full. */
async function redialHistory(store: BlockStore, path: string[]): Promise<void> {
  const refl = await store.load('reflexive');
  if (!(refl instanceof Map)) return;
  const nine = refl.get(REFLEXIVE_CURRENT);
  const slot = nine instanceof Map ? nine.get('6') : undefined;
  if (!(slot instanceof Map) || !String(slot.get(ZK) ?? '').startsWith('history')) return;
  const leafAddr = path.join('');
  slot.set(ZK, `history:${leafAddr}`);
  slot.set('1', `history:${leafAddr}:1`);
  const l = path[path.length - 1];
  const recents = Array.from('123456789')
    .filter((d) => d <= l)
    .slice(-3)
    .reverse();
  recents.forEach((leaf, i) => slot.set(String(i + 2), `history:${path.slice(0, -1).join('')}${leaf}:-1`));
  for (let i = recents.length + 2; i <= 4; i++) slot.delete(String(i));
  await store.save('reflexive', refl as PMap);
}

export interface FoldResult {
  status: string;
  applied: number;
  failed: { address: string; error: string }[];
  leafAddress: string | null;
  leafVoicing: string | null;
  summaryDue: string | null;
  summaryPaidAt: string | null;
}

/** The fold — kernel.route ported: apply writes (history refused — it is
 *  automatic memory), re-dial the index, write the lossless history leaf,
 *  settle/report the owed 0+ summary, then set/clear the conditions:9 kernel
 *  report as a full pulse would. */
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
  const appliedPairs: [string, PNode][] = [];
  const failed: { address: string; error: string }[] = [];
  for (const [ref, content] of pairs) {
    const [name, addr] = splitRef(ref, store.handle);
    if (!name) continue;
    if (name.includes(':')) {
      // a name outside this shell's organs
      failed.push({
        address: ref,
        error: `not an organ of this shell — writes land in your own shell only (v0): bare organ names (pool, surface, stash, ...), which the wire spells name:${store.handle ?? '<handle>'} at the beach; another handle's block is read-only from here`,
      });
      continue;
    }
    if (name === 'history') {
      failed.push({
        address: ref,
        error: 'history is written by the kernel (lossless leaf per wake; summaries via the summary field) — deliberate notes go to stash',
      });
      continue;
    }
    if (name === 'pool') {
      // THE ROOM IS AN ACCUMULATOR — fold writes APPEND like everyone else's
      // speech; the beach allocates the slot. An addressed write through this
      // door once overwrote a peer's entry, and a root write once replaced a
      // whole room (2026-07-17, the animator's lesson — the same law at
      // every door).
      const ts = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      let entry: PMap | null = null;
      if (typeof content === 'string') {
        entry = new Map([[ZK, content as PNode], ['1', (store.handle ?? '') as PNode], ['3', ts as PNode]]);
      } else if (content && typeof content === 'object' && !Array.isArray(content)) {
        const pc = toPNode(content);
        if (pc instanceof Map) {
          entry = pc;
          const who = entry.get('1');
          if (typeof who !== 'string' || !who) entry.set('1', (store.handle ?? '') as PNode);
          const when = entry.get('3');
          if (typeof when !== 'string' || !when) entry.set('3', ts as PNode);
        }
      }
      if (!entry) {
        failed.push({ address: ref, error: 'a room entry is words — a string, or {_, 1, 3}' });
        continue;
      }
      if (!store.append) {
        failed.push({ address: ref, error: 'room writes append and this store cannot append — speak in the room via bsp() instead' });
        continue;
      }
      const ack = await store.append('pool', entry);
      if (ack.ok) {
        applied += 1;
        appliedPairs.push([`pool (appended at ${ack.slot ?? '?'})`, toPNode(content)]);
      } else {
        failed.push({ address: ref, error: `room append failed — ${String(ack.error ?? 'unknown').slice(0, 120)}` });
      }
      continue;
    }
    try {
      const pc = toPNode(content);
      if (!addr && pc instanceof Map) {
        // a root replace of a populated organ erases its record — refuse
        const existing = await store.load(name);
        if (existing instanceof Map && Array.from(existing.keys()).some((k) => /^[1-9]$/.test(k))) {
          failed.push({ address: ref, error: 'root replace refused — the block is populated; address a position' });
          continue;
        }
      }
      await applyWrite(store, name, addr, pc);
      applied += 1;
      appliedPairs.push([ref, pc]);
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
  const redialed = Boolean(nc && typeof nc === 'object' && !Array.isArray(nc) && Object.keys(nc).length > 0);
  if (redialed) {
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

  // history — the agent's memory, automatic: a COUNTING BLOCK (2026-07-07
  // spec, corrected same day). One lossless leaf per applied wake at the next
  // zero-free number; every zero-carrying number is a summary slot owing a +0
  // line over the PREVIOUS completed nine.
  const note = String(output?.note ?? '').trim();
  const summary = String(output?.summary ?? '').trim();
  let leafAddress: string | null = null;
  let leafVoicing: string | null = null;
  let summaryDueAddr: string | null = null;
  let dueFloor = 1;
  let summaryPaidAt: string | null = null;
  if (applied > 0) {
    const loaded = await store.load('history');
    const h: PMap = loaded instanceof Map ? loaded : new Map([[ZK, HISTORY_VOICING as PNode]]);
    const { floor, path } = historyNext(h);
    const body = appliedPairs.map(([ref, c]) => `${ref} ←\n${typeof c === 'string' ? c : pyDumps(c)}`).join('\n\n');
    const meta = `heartbeat: ${output?.heartbeat ?? 'None'} · index: ${redialed ? 're-dialed' : 'carried'} · status: ${output?.status ?? 'continue'}`;
    const ts = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    leafVoicing = `[${ts}] ${note || '(no note)'}`;
    ensureContainers(h, path).set(path[path.length - 1], new Map([
      [ZK, leafVoicing as PNode],
      ['1', body as PNode],
      ['2', meta as PNode],
    ]));
    leafAddress = path.join('');
    let dues = historySummaryDues(h, floor);
    if (summary && dues.length > 0) {
      historyPaySummary(h, dues[0], summary);
      summaryPaidAt = dues[0];
      dues = historySummaryDues(h, floor);
    }
    summaryDueAddr = dues[0] ?? null;
    dueFloor = floor;
    await store.save('history', h);
    await redialHistory(store, path);
  } else if (summary) {
    // a fold may pay a due summary without other writes
    const h = await store.load('history');
    if (h instanceof Map) {
      const floor = ladderFloor(h);
      const dues = historySummaryDues(h, floor);
      if (dues.length > 0 && historyPaySummary(h, dues[0], summary)) {
        summaryPaidAt = dues[0];
        const remaining = historySummaryDues(h, floor);
        summaryDueAddr = remaining[0] ?? null;
        dueFloor = floor;
        await store.save('history', h);
      }
    }
  }

  // kernel report into ρ — refused writes and an owed summary become perceived
  // conditions for the next wake (kernel.report_failures)
  const cond = ((await store.load('conditions')) ?? new Map([[ZK, 'conditions' as PNode]])) as PMap;
  const nine = cond.get('9');
  const had = typeof nine === 'string' && nine.startsWith('kernel report');
  const msgs: string[] = [];
  if (failed.length > 0) {
    const lines = failed
      .slice(0, 3)
      .map((f) => `${f.address} -> ${f.error.slice(0, 80)}`)
      .join(' ; ');
    msgs.push(
      `refused writes: ${lines} (refused by the substrate's shape rules, not judged: a populated branch takes an object or a deeper point, never a bare string)`,
    );
  }
  if (summaryDueAddr) {
    msgs.push(
      `history summary owed at ${summaryDueAddr} — a substantive, NAVIGABLE paragraph over the previous completed nine (${historyPredSpan(summaryDueAddr, dueFloor)}): dense with the span's own handles (proper nouns, block addresses, decisions, failures, open threads) and the read-addresses of load-bearing leaves, so a descending reader can choose the next span by these keywords alone; include "summary": "..." in the next fold and the kernel writes it there (service-payment)`,
    );
  }
  if (msgs.length > 0) {
    cond.set('9', `kernel report — ${msgs.join(' ; ')}.`);
    await store.save('conditions', cond);
  } else if (had) {
    cond.delete('9');
    await store.save('conditions', cond);
  }

  const status = output?.status ?? (applied > 0 ? 'continue' : 'rest');
  return { status, applied, failed, leafAddress, leafVoicing, summaryDue: summaryDueAddr, summaryPaidAt };
}

// ── stores ──────────────────────────────────────────────────────────────────

/** The beach store — role-with-handle names over the wire, ordered parse of the
 *  raw response text (byte order preserved, exactly as python's json.loads),
 *  whole-block confirmed saves ({confirm: true} per the beach's replace gate). */
export function wireStore(beach: string, handle: string, secret?: string, teaching?: Map<string, PNode>): BlockStore {
  const origin = beach.replace(/\/+$/, '');
  const storeHandle = handle;
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
  const append = async (name: string, entry: PMap): Promise<{ ok: boolean; slot?: string; error?: string }> => {
    // Accumulator append — the beach allocates the slot atomically (and
    // supernests on rollover); the ack carries the server-assigned slot.
    const body: PMap = new Map([
      ['content', entry as PNode],
      ['append', true as PNode],
    ]);
    if (secret) body.set('secret', secret);
    try {
      const { status, text } = await fetchText(endpoint(name), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: pyDumps(body),
      });
      if (status >= 400) return { ok: false, error: `HTTP ${status} ${text.slice(0, 120)}` };
      cache.delete(name);
      let slot: string | undefined;
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.slot === 'string') slot = parsed.slot;
        else if (parsed && typeof parsed.slot === 'number') slot = String(parsed.slot);
      } catch { /* an ack without a body is still an ack */ }
      return { ok: true, slot };
    } catch (ex: any) {
      return { ok: false, error: String(ex?.message ?? ex).slice(0, 120) };
    }
  };
  return { load, save, append, handle: storeHandle };
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
    // Accumulator append — next zero-free top-level slot (the floor-1 counting
    // line; enough for tests — the live beach supernests on rollover).
    append: async (name, entry) => {
      const cur = blocks.get(name);
      const block: PMap = cur instanceof Map ? (cur as PMap) : new Map([[ZK, name as PNode]]);
      let n = 1;
      while (block.has(String(n)) || String(n).includes('0')) n += 1;
      block.set(String(n), entry);
      blocks.set(name, block);
      return { ok: true, slot: String(n) };
    },
  };
}
