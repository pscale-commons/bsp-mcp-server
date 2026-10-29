/**
 * compound-cli.ts — the compound-test CLI, answered by bsp-mcp. Output matches
 * compound-test-materials/compound-alt.py's JSON, so run-compound-tests.py
 * swaps targets without changes (as scripts/bsp-cli.ts is for the walker).
 *
 *   align    floor-align, the operation bsp-floor runs (src/floor-align.ts)
 *   resolve  the frame compiler's resolution of one reference — the kernel
 *            scoop and its star-follow, star-refs across origins (src/compile.ts)
 *   law      the stream door's law: the operator, or the generic law its
 *            underscore names, one hop (src/tools/stream.ts operatorLaw)
 *   compile  a bundle at the door named by --door: bundle (the default —
 *            src/bundle.ts, how bsp() reads a bundle node and the play door
 *            compiles a shell's manifest) or frame (src/compile.ts, how the
 *            play door compiles frame:<scene> and the order sweep)
 *
 * Usage:
 *   tsx scripts/compound-cli.ts [--door bundle|frame] <verb> <compound> <args…> [--pscale N]
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { floorDepth, type Block } from '../src/bsp.js';
import { floorAlign } from '../src/floor-align.js';
import { compile, parseStarRef, type FetchOrigin } from '../src/compile.js';
import { compileBundle, handleOfBlock, parseBundleRef, type Member } from '../src/bundle.js';
import { toPNode, parseAddr, floorOf, type PNode, type PMap, type Loader } from '../src/genus.js';
import { operatorLaw } from '../src/tools/stream.js';
import type { DiscEntry, PathWalkEntry } from '../src/bsp-fn.js';

// ── the surface: a folder of blocks, another origin's in a subfolder ──
type Blocks = Map<string, Block>;
function loadFolder(dir: string): { home: Blocks; origins: Map<string, Blocks> } {
  const home: Blocks = new Map();
  const origins = new Map<string, Blocks>();
  for (const entry of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, entry);
    if (fs.statSync(p).isDirectory()) {
      const blocks: Blocks = new Map();
      for (const f of fs.readdirSync(p).sort()) if (f.endsWith('.json')) blocks.set(decodeURIComponent(f.slice(0, -5)), JSON.parse(fs.readFileSync(path.join(p, f), 'utf8')));
      origins.set(decodeURIComponent(entry).replace(/\/+$/, ''), blocks);
    } else if (entry.endsWith('.json')) {
      home.set(decodeURIComponent(entry.slice(0, -5)), JSON.parse(fs.readFileSync(p, 'utf8')));
    }
  }
  return { home, origins };
}

/** A hydrated value back to plain JSON. */
function plain(v: PNode | undefined): unknown {
  if (v instanceof Map) return Object.fromEntries([...v].map(([k, x]) => [k, plain(x)]));
  if (Array.isArray(v)) return v.map(plain);
  return v ?? null;
}

// ── resolve: what the frame compiler delivers for one reference ──
async function resolveRef(leaf: string, load: Loader, fetchOrigin: FetchOrigin, blocks: (name: string, origin?: string) => Block | null) {
  const r = await compile(toPNode({ 1: leaf }), load, { complete: false, fetchOrigin });
  return classify(leaf, (r.window as PMap).get('1'), blocks);
}

/** The shape a hydrated value has, read off the reference that dialed it. */
function classify(leaf: string, v: PNode | undefined, blocks: (name: string, origin?: string) => Block | null): Record<string, unknown> {
  const star = parseStarRef(leaf);
  const ref = star ? { name: star.name, address: star.address, attention: star.attention, word: null } : parseBundleRef(leaf);
  const base: Record<string, unknown> = { ref: leaf, name: ref?.name ?? null, ...(star ? { origin: star.origin } : {}) };
  if (star && v === leaf) return { ...base, shape: 'unresolved', content: leaf };
  if (!ref) return { ...base, shape: 'prose', content: leaf };
  const block = blocks(ref.name, star?.origin);
  if (!block) return { ...base, shape: 'absent', content: null, note: `no block ${ref.name} stands at this surface` };
  if (v === null || v === undefined || (Array.isArray(v) && v.length === 0)) return { ...base, shape: 'absent', content: null };
  if (typeof v === 'string') return { ...base, shape: 'point', content: v };
  if (Array.isArray(v)) return { ...base, shape: 'path-walk', content: plain(v) };
  const address = ref.word ? null : ref.address;
  if (ref.word === 'head') return { ...base, shape: 'path-walk', content: plain(v) };
  if (address === null && ref.attention === null) return { ...base, shape: 'block', content: plain(v) };
  if (address === null) {
    return { ...base, shape: 'disc', content: [...(v as PMap)].map(([a, t]) => ({ address: a, walk: a.split('').join(','), text: plain(t) })) };
  }
  const term = floorOf(toPNode(block)) - parseAddr(address, floorOf(toPNode(block))).length;
  return { ...base, shape: (ref.attention ?? 0) < term ? 'path-walk+descent' : 'ring', content: plain(v) };
}

// ── compile, at the bundle door ──
function memberOf(m: Member): Record<string, unknown> {
  const base = { slot: m.slot, leaf: m.leaf };
  if (!m.ref) return { ...base, kind: 'prose', shape: 'prose', content: m.leaf };
  if (m.absent) return { ...base, kind: 'reference', name: m.name, shape: 'absent', content: null, note: `absent at this surface: ${m.name}` };
  const r = m.result;
  if (!r) return { ...base, kind: 'reference', name: m.name, shape: 'unresolved', content: m.leaf, note: m.note };
  const content =
    r.shape === 'point' ? r.content ?? null
    : r.shape === 'path-walk' ? ((r.entries ?? []) as PathWalkEntry[]).map((e) => e.content ?? null)
    : r.shape === 'disc' ? ((r.entries ?? []) as DiscEntry[]).map((e) => ({ address: e.address, walk: e.address.replace('.', '').split('').join(','), text: e.content ?? null }))
    : r.shape === 'block' ? r.block
    : r.shape === 'path-walk+descent' ? { walk: (r.path_walk ?? []).map((e) => e.content ?? null), descent: (r.descent ?? []).map((e) => ({ walk: e.address, text: e.content ?? null })) }
    : r;
  return { ...base, kind: 'reference', name: m.name, shape: r.shape, content, ...(m.note ? { note: m.note } : {}) };
}

// ── compile, at the frame door: each slot classified as it was dialed ──
function frameMember(slot: string, child: unknown, v: PNode | undefined, blocks: (name: string, origin?: string) => Block | null): Record<string, unknown> {
  const leaf = typeof child === 'string' ? child : child && typeof child === 'object' && typeof (child as any)._ === 'string' ? (child as any)._ as string : null;
  const isRef = leaf !== null && (parseStarRef(leaf) !== null || parseBundleRef(leaf) !== null);
  const nested = child && typeof child === 'object' && v instanceof Map;
  const primary = nested ? (v as PMap).get('_') : v;
  const m: Record<string, unknown> = isRef
    ? { slot, leaf, kind: 'reference', ...stripRef(classify(leaf!, primary, blocks)) }
    : { slot, leaf, kind: 'prose', shape: 'prose', content: leaf };
  if (nested) {
    const companions = Object.keys(child as object).filter((k) => /^[1-9]$/.test(k)).sort()
      .map((k) => frameMember(k, (child as any)[k], (v as PMap).get(k), blocks));
    if (companions.length) m.members = companions;
  }
  return m;
}
const stripRef = (r: Record<string, unknown>) => { const { ref: _ref, ...rest } = r; return rest; };

async function main(argv: string[]): Promise<number> {
  let door = 'bundle';
  let pscale: number | null = null;
  const args: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--door') door = argv[++i];
    else if (argv[i] === '--pscale') pscale = parseInt(argv[++i], 10);
    else args.push(argv[i]);
  }
  const [verb, folder, ...rest] = args;
  if (!verb || !folder) {
    process.stderr.write('usage: compound-cli.ts [--door bundle|frame] <verb> <compound> <args…> [--pscale N]\n');
    return 1;
  }
  const { home, origins } = loadFolder(folder);
  const blocks = (name: string, origin?: string): Block | null => (origin ? origins.get(origin)?.get(name) : home.get(name)) ?? null;
  const load: Loader = async (name) => (home.has(name) ? toPNode(home.get(name)) : null);
  const fetchOrigin: FetchOrigin = (origin) => async (name) => {
    const b = origins.get(origin)?.get(name);
    return b ? toPNode(b) : null;
  };
  let out: unknown;
  if (verb === 'align') {
    const present = rest.filter((n) => home.has(n));
    const missing = rest.filter((n) => !home.has(n));
    if (present.length < 2) {
      out = { shape: 'refused', missing, blocks: present, note: 'alignment needs at least two blocks that stand' };
    } else {
      let levels = floorAlign(...present.map((n) => home.get(n)!));
      if (pscale !== null) levels = levels.filter((l) => l.pscale === pscale);
      out = {
        shape: 'aligned',
        blocks: present.map((n) => ({ name: n, floor: floorDepth(home.get(n)!) })),
        missing,
        levels: levels.map((l) => ({
          pscale: l.pscale,
          sides: Object.fromEntries(present.map((n, i) => [n, l.perBlock[i].map((e) => ({ address: e.address, walk: e.walk, text: e.text }))])),
        })),
      };
    }
  } else if (verb === 'resolve') {
    out = await resolveRef(rest[0], load, fetchOrigin, blocks);
  } else if (verb === 'law') {
    const family = rest[0];
    const opName = `function:${family}`;
    const op = home.get(opName);
    if (!op) out = { shape: 'absent', family, operator: opName, content: null, note: `no ${opName} stands` };
    else {
      const l = await operatorLaw(opName, op, async (name) => home.get(name) ?? null);
      out = { shape: l.resolved ? 'law' : 'unresolved', family, operator: opName, mounted: l.mounted, content: l.text };
    }
  } else if (verb === 'compile') {
    const ref = parseBundleRef(rest[0]);
    const block = ref ? home.get(ref.name) : undefined;
    if (!ref || !block) out = { shape: 'absent', bundle: rest[0], note: 'no such block stands at this surface' };
    else {
      const digits = ref.address ? parseAddr(ref.address, floorOf(toPNode(block))) : [];
      let node: any = block;
      for (const d of digits) node = node && typeof node === 'object' ? node[d === '0' ? '_' : d] : undefined;
      if (node === undefined) out = { shape: 'absent', bundle: rest[0], note: `nothing stands at ${ref.address}` };
      else if (door === 'frame') {
        const r = await compile(toPNode(node), load, { complete: false, fetchOrigin });
        const w = r.window as PMap;
        out = {
          shape: 'window',
          bundle: rest[0],
          members: Object.keys(node).filter((k) => /^[1-9]$/.test(k)).sort().map((k) => frameMember(k, node[k], w.get(k), blocks)),
        };
      } else {
        const members = await compileBundle(node, { load: async (n) => home.get(n) ?? null, handle: handleOfBlock(ref.name), now: new Date() });
        out = members
          ? { shape: 'window', bundle: rest[0], members: members.map(memberOf) }
          : { shape: 'not-a-bundle', bundle: rest[0], content: typeof node === 'string' ? node : node?._ ?? null };
      }
    }
  } else {
    process.stderr.write(`unknown verb ${verb}\n`);
    return 1;
  }
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  return 0;
}

process.exit(await main(process.argv.slice(2)));
