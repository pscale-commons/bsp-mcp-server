/**
 * bsp-fn.ts — the unified bsp() function.
 *
 * Two coordinates: spindle (S, the address) and pscale_attention (P).
 * Read when content omitted; write when content provided.
 * Selection shape derives from the relationship between S and P.
 *
 * Shape derivation (from whetstone §2):
 *   P_att == P_end           → point   (string at terminus)
 *   P_att == P_end - 1       → ring    (children of terminus, digit-keyed)
 *   P_att < P_end - 1        → subtree (full subtree from terminus down to P_att)
 *   spindle empty + P set    → disc    (all nodes at depth corresponding to P_att)
 *   spindle empty + P null   → block   (whole tree)
 *   spindle ends '*'         → star    (enter hidden directory, recurse)
 *
 * P_end = pscale at the terminus of the walked spindle.
 *       = (floor - 1) - (number of walked digits)  [matches bsp2-star.py]
 */

import {
  Block,
  collectUnderscore,
  floorDepth,
  getHiddenDirectory,
  parseAddress,
  walk,
  writeAt,
} from './bsp.js';

// ── Shape ──

export type Shape = 'point' | 'ring' | 'subtree' | 'disc' | 'block' | 'star';

export interface BspReadResult {
  shape: Shape;
  // Each shape returns a different content payload:
  point?: string | null;
  ring?: Record<string, any>;
  subtree?: any;
  disc?: Array<{ address: string; content: any }>;
  block?: Block;
  star?: {
    address: string;
    semantic: string | null;
    inner: BspReadResult | null;
  };
  // Useful diagnostics:
  spindle?: string;
  pscale_attention?: number | null;
  p_end?: number;
  floor?: number;
}

export interface BspWriteResult {
  shape: Shape;
  written: boolean;
  // Updated block, ready for save
  block: Block;
  // For diagnostics:
  spindle?: string;
  pscale_attention?: number | null;
}

// ── Spindle parsing ──

interface ParsedSpindle {
  digits: string[];      // walk digits after floor-pad-left + trailing-zero-strip
  hasStar: boolean;      // true if spindle ends with '*'
  rawDigits: string[];   // pre-padding digits (for diagnostics)
}

function parseSpindle(spindle: string | null | undefined, floor: number): ParsedSpindle {
  if (spindle == null || spindle === '') {
    return { digits: [], hasStar: false, rawDigits: [] };
  }
  let s = String(spindle);
  const hasStar = s.endsWith('*');
  if (hasStar) s = s.slice(0, -1);
  if (s === '') {
    return { digits: [], hasStar, rawDigits: [] };
  }
  const rawDigits = parseAddress(s);
  let digits = [...rawDigits];
  // 1. Pad LEFT to floor width (the human may have omitted underscore-chain steps)
  if (floor > 1 && digits.length < floor) {
    digits = Array(floor - digits.length).fill('0').concat(digits);
  }
  // 2. Strip trailing zeros (floor-width notation, not walk instructions)
  while (digits.length > 1 && digits[digits.length - 1] === '0') {
    digits.pop();
  }
  return { digits, hasStar, rawDigits };
}

// ── Pscale ──

/**
 * pscale at a tree depth, given the floor.
 * Matches bsp2-star.py: pscale = (floor - 1) - depth.
 * For floor 1: depth 0 = pscale 0 (root), depth 1 = pscale -1.
 */
export function pscaleAt(depth: number, floor: number): number {
  return (floor - 1) - depth;
}

/** Inverse: depth at a given pscale, given the floor. */
export function depthAt(pscale: number, floor: number): number {
  return (floor - 1) - pscale;
}

// ── Read ──

/**
 * Read at (spindle, pscale_attention).
 * Shape derives from the relationship between P_end (terminus pscale) and P_att.
 */
export function bspRead(
  block: Block,
  spindle: string | null | undefined,
  pscaleAttention: number | null | undefined,
): BspReadResult {
  const floor = floorDepth(block);
  const { digits, hasStar } = parseSpindle(spindle, floor);

  // Star: walk to terminus, enter hidden directory, recurse with remaining (S, P) inside.
  if (hasStar) {
    const { terminal } = walk(block, digits);
    const hidden = getHiddenDirectory(terminal);
    const semantic = (terminal && typeof terminal === 'object')
      ? collectUnderscore(terminal)
      : null;
    if (hidden === null) {
      return {
        shape: 'star',
        star: { address: String(spindle), semantic, inner: null },
        floor,
      };
    }
    // Treat the hidden directory as a block and recurse.
    // For now, the inner spindle is empty (the star terminates the spindle).
    // A future extension can split spindles on '*' to support "X*Y" composition.
    const innerBlock: Block = { _: semantic ?? '', ...hidden };
    const inner = bspRead(innerBlock, '', pscaleAttention);
    return {
      shape: 'star',
      star: { address: String(spindle), semantic, inner },
      floor,
    };
  }

  // Empty spindle: disc or whole-block.
  if (digits.length === 0) {
    if (pscaleAttention == null) {
      return { shape: 'block', block, floor };
    }
    // Disc: collect nodes at depth corresponding to pscale_attention.
    const targetDepth = depthAt(pscaleAttention, floor);
    const nodes = collectDisc(block, targetDepth);
    return {
      shape: 'disc',
      disc: nodes,
      pscale_attention: pscaleAttention,
      floor,
    };
  }

  // Walk the spindle.
  const { terminal } = walk(block, digits);
  const pEnd = pscaleAt(digits.length, floor);

  // Default: P_att = P_end (point at terminus).
  const pAtt = pscaleAttention ?? pEnd;

  if (pAtt === pEnd) {
    // Point: the underscore string at the terminus.
    let text: string | null = null;
    if (typeof terminal === 'string') {
      text = terminal;
    } else if (terminal && typeof terminal === 'object') {
      text = collectUnderscore(terminal);
    }
    return { shape: 'point', point: text, spindle: String(spindle), pscale_attention: pAtt, p_end: pEnd, floor };
  }

  if (pAtt === pEnd - 1) {
    // Ring: children of terminus, digit-keyed.
    const ring: Record<string, any> = {};
    if (terminal && typeof terminal === 'object') {
      for (const d of '123456789') {
        if (d in terminal) {
          const v = terminal[d];
          if (typeof v === 'string') {
            ring[d] = v;
          } else if (v && typeof v === 'object') {
            // Surface as a small node — underscore text plus digit children if present.
            const underscore = collectUnderscore(v);
            const node: Record<string, any> = {};
            if (underscore !== null) node._ = underscore;
            for (const dd of '123456789') {
              if (dd in v) {
                const vv = v[dd];
                node[dd] = typeof vv === 'string' ? vv : (collectUnderscore(vv) ?? '(branch)');
              }
            }
            ring[d] = Object.keys(node).length > 0 ? node : '(branch)';
          }
        }
      }
    }
    return { shape: 'ring', ring, spindle: String(spindle), pscale_attention: pAtt, p_end: pEnd, floor };
  }

  if (pAtt < pEnd - 1) {
    // Subtree: full subtree from terminus down to pscale_attention depth.
    // The "down to P_att" cap is naturally enforced by the data — the floor IS the depth.
    // We return the entire terminal node as a subtree.
    return { shape: 'subtree', subtree: terminal, spindle: String(spindle), pscale_attention: pAtt, p_end: pEnd, floor };
  }

  // P_att > P_end: caller is asking for a level ABOVE the spindle's terminus.
  // This is an upward query — return the spindle chain up to depth where pscale = pAtt.
  // We resolve it by re-walking with a SHORTER spindle.
  if (pAtt > pEnd) {
    const targetDepth = depthAt(pAtt, floor);
    if (targetDepth >= 0 && targetDepth < digits.length) {
      const shortDigits = digits.slice(0, targetDepth);
      const { terminal: shortTerminal } = walk(block, shortDigits);
      const text = (typeof shortTerminal === 'string')
        ? shortTerminal
        : (shortTerminal && typeof shortTerminal === 'object' ? collectUnderscore(shortTerminal) : null);
      return {
        shape: 'point',
        point: text,
        spindle: String(spindle),
        pscale_attention: pAtt,
        p_end: pEnd,
        floor,
      };
    }
  }

  // Fallback — shouldn't reach here in normal operation.
  return { shape: 'point', point: null, spindle: String(spindle), pscale_attention: pAtt, p_end: pEnd, floor };
}

// ── Disc collection ──

function collectDisc(block: Block, targetDepth: number): Array<{ address: string; content: any }> {
  const nodes: Array<{ address: string; content: any }> = [];
  function recurse(node: any, depth: number, path: string) {
    if (depth === targetDepth) {
      let content: any;
      if (typeof node === 'string') {
        content = node;
      } else if (node && typeof node === 'object') {
        content = collectUnderscore(node) ?? '(branch)';
      } else {
        content = null;
      }
      nodes.push({ address: path || '_', content });
      return;
    }
    if (!node || typeof node !== 'object') return;
    if ('_' in node && typeof node._ === 'object') {
      recurse(node._, depth + 1, path ? `${path}.0` : '0');
    }
    for (const d of '123456789') {
      if (d in node) {
        recurse(node[d], depth + 1, path ? `${path}.${d}` : d);
      }
    }
  }
  recurse(block, 0, '');
  return nodes;
}

// ── Write ──

/**
 * Write at (spindle, pscale_attention).
 * Content's shape MUST match the shape derived from (spindle, pscale_attention).
 * Replacement is precise to the shape: point replaces the underscore string,
 * ring replaces the digit children (keyed entries only), subtree replaces the
 * full subtree at terminus, disc replaces multiple positions, block replaces all.
 *
 * Returns the modified block ready for storage.save_block().
 */
export function bspWrite(
  block: Block,
  spindle: string | null | undefined,
  pscaleAttention: number | null | undefined,
  content: any,
): BspWriteResult {
  const floor = floorDepth(block);
  const { digits, hasStar } = parseSpindle(spindle, floor);

  // Star write: walk to terminus, enter hidden directory, write inside.
  if (hasStar) {
    const { terminal } = walk(block, digits);
    if (!terminal || typeof terminal !== 'object') {
      throw new Error(`Star write: terminus at "${spindle}" is not an object`);
    }
    // Find or create the hidden directory level.
    // The hidden directory lives within the terminus's underscore chain at the
    // deepest level that has digit children (or we create it).
    if (!('_' in terminal) || typeof terminal._ !== 'object') {
      // Promote terminus._ from string to {_: string} so we can hang digits.
      const oldUnderscore = typeof terminal._ === 'string' ? terminal._ : '';
      terminal._ = { _: oldUnderscore };
    }
    // Apply inner write to the hidden directory.
    const innerBlock: Block = terminal._;
    bspWriteInPlace(innerBlock, '', pscaleAttention, content);
    return {
      shape: 'star',
      written: true,
      block,
      spindle: String(spindle),
      pscale_attention: pscaleAttention,
    };
  }

  // Direct write — no star.
  const shape = bspWriteInPlace(block, spindle ?? '', pscaleAttention, content);
  return {
    shape,
    written: true,
    block,
    spindle: String(spindle ?? ''),
    pscale_attention: pscaleAttention,
  };
}

/** Apply a write to a block in place; returns the determined shape. */
function bspWriteInPlace(
  block: Block,
  spindle: string,
  pscaleAttention: number | null | undefined,
  content: any,
): Shape {
  const floor = floorDepth(block);
  const { digits } = parseSpindle(spindle, floor);

  // Empty spindle.
  if (digits.length === 0) {
    if (pscaleAttention == null) {
      // Whole-block write.
      if (!content || typeof content !== 'object') {
        throw new Error('Whole-block write requires an object payload');
      }
      // Replace block contents in place: clear keys, copy from content.
      for (const k of Object.keys(block)) delete block[k];
      Object.assign(block, content);
      return 'block';
    }
    // Disc write: content is array of {address, content} OR sparse object {address: content}.
    if (Array.isArray(content)) {
      for (const entry of content) {
        if (entry && typeof entry === 'object' && 'address' in entry) {
          writeAt(block, entry.address, entry.content);
        }
      }
    } else if (content && typeof content === 'object') {
      for (const [addr, val] of Object.entries(content)) {
        writeAt(block, addr, val);
      }
    } else {
      throw new Error('Disc write requires array of {address, content} or sparse object');
    }
    return 'disc';
  }

  // Walk to terminus parent for shape-aware writes.
  const pEnd = pscaleAt(digits.length, floor);
  const pAtt = pscaleAttention ?? pEnd;

  if (pAtt === pEnd) {
    // Point write: replace the underscore string at terminus.
    if (typeof content !== 'string') {
      throw new Error(`Point write requires a string payload (got ${typeof content})`);
    }
    // Walk to terminus parent and set the underscore-string at the final digit.
    const finalDigit = digits[digits.length - 1];
    const parentDigits = digits.slice(0, -1);
    const parent = walkOrCreate(block, parentDigits);
    const key = finalDigit === '0' ? '_' : finalDigit;
    if (key in parent && parent[key] !== null && typeof parent[key] === 'object') {
      // Terminus has children — set its underscore (preserve children).
      parent[key]._ = content;
    } else {
      parent[key] = content;
    }
    return 'point';
  }

  if (pAtt === pEnd - 1) {
    // Ring write: replace digit children of terminus per content keys.
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      throw new Error('Ring write requires an object payload {digit: string-or-obj}');
    }
    const terminus = walkOrCreate(block, digits);
    for (const [k, v] of Object.entries(content)) {
      if (!/^[1-9]$/.test(k)) {
        throw new Error(`Ring write: key "${k}" is not a digit 1-9`);
      }
      terminus[k] = v;
    }
    return 'ring';
  }

  if (pAtt < pEnd - 1) {
    // Subtree write: replace the entire terminus node with content.
    if (typeof content !== 'object' || content === null) {
      throw new Error('Subtree write requires an object payload');
    }
    const finalDigit = digits[digits.length - 1];
    const parentDigits = digits.slice(0, -1);
    const parent = walkOrCreate(block, parentDigits);
    const key = finalDigit === '0' ? '_' : finalDigit;
    parent[key] = content;
    return 'subtree';
  }

  throw new Error(
    `Write at (spindle="${spindle}", pscale_attention=${pAtt}) — unsupported shape (P_end=${pEnd})`,
  );
}

/** Walk to a node, creating intermediate objects as needed. */
function walkOrCreate(block: Block, digits: string[]): Record<string, any> {
  let node: any = block;
  for (const d of digits) {
    const key = d === '0' ? '_' : d;
    if (!(key in node) || typeof node[key] !== 'object' || node[key] === null) {
      node[key] = {};
    }
    node = node[key];
  }
  return node;
}

// ── The unified function ──

export interface BspParams {
  block: Block;
  spindle?: string | null;
  pscale_attention?: number | null;
  content?: any;
}

export interface BspReadOnly extends BspParams {
  content?: undefined;
}

export interface BspWriteOnly extends BspParams {
  content: NonNullable<any>;
}

/**
 * The unified bsp() function.
 * Read when content is undefined. Write when content is provided.
 */
export function bspFn(params: BspParams): BspReadResult | BspWriteResult {
  const { block, spindle, pscale_attention, content } = params;
  if (content === undefined) {
    return bspRead(block, spindle, pscale_attention);
  }
  return bspWrite(block, spindle, pscale_attention, content);
}

// ── Formatters ──

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s;
}

export function formatRead(r: BspReadResult): string {
  switch (r.shape) {
    case 'point':
      return `[point @ pscale ${r.pscale_attention}]\n  ${r.point ?? '(no text)'}`;
    case 'ring': {
      const lines = [`[ring @ pscale ${r.pscale_attention} of "${r.spindle}"]`];
      for (const k of Object.keys(r.ring ?? {}).sort()) {
        const v = r.ring![k];
        if (typeof v === 'string') {
          lines.push(`  ${k}: ${truncate(v, 150)}`);
        } else if (v && typeof v === 'object') {
          const u = v._ ?? '(branch)';
          lines.push(`  ${k}: ${truncate(String(u), 150)}`);
        }
      }
      return lines.join('\n');
    }
    case 'subtree':
      return `[subtree @ "${r.spindle}"]\n${JSON.stringify(r.subtree, null, 2)}`;
    case 'disc': {
      const lines = [`[disc @ pscale ${r.pscale_attention}]`];
      for (const n of r.disc ?? []) {
        lines.push(`  [${n.address}] ${truncate(String(n.content ?? '(no text)'), 150)}`);
      }
      return lines.join('\n');
    }
    case 'block':
      return `[whole block]\n${JSON.stringify(r.block, null, 2)}`;
    case 'star': {
      const lines = [`[star @ "${r.star?.address}"]`];
      if (r.star?.semantic) lines.push(`  semantic: ${truncate(r.star.semantic, 200)}`);
      if (r.star?.inner) {
        lines.push('  inner:');
        const innerText = formatRead(r.star.inner);
        for (const line of innerText.split('\n')) lines.push(`    ${line}`);
      } else {
        lines.push('  (no hidden directory)');
      }
      return lines.join('\n');
    }
  }
}

export function formatWrite(r: BspWriteResult): string {
  return `[wrote ${r.shape} @ "${r.spindle}"${r.pscale_attention != null ? ` pscale ${r.pscale_attention}` : ''}]`;
}
