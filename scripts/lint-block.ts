/**
 * lint-block.ts — the mechanical half of the well-formed battery (pscale://well-formed:1).
 *
 * The readable, runnable twin of the beach shape gate. `validateShape` below is a
 * faithful port of the gate in the pscale-beach package (api/pscale-beach.js) — kept
 * byte-for-byte in behaviour so the teaching, this linter, and the enforcement at the
 * beach never disagree. If the gate changes, re-port from there; do not diverge.
 *
 * It checks the two SHAPE rules the gate enforces:
 *   (1.1) spine keys — only "_" and single digits 1-9 at every level;
 *   (1.2) no JSON-stringified subtrees — an object/array value written as a string.
 *
 * Address validity (well-formed:1.3 — single decimal, digits only, left-of-decimal
 * <= floor) is a PARSER concern, not a block-shape one: a block's keys are never
 * addresses. It is covered by smoke-parser.ts and bsp-test battery 6, not here.
 *
 * The interpretive half (well-formed:2 — heading trap, depth-not-categories, voicing)
 * is a reading act no program decides; this linter deliberately does not attempt it.
 *
 * Usage:
 *   tsx scripts/lint-block.ts path/to/block.json
 *   echo '{"_":"x","1":"y"}' | tsx scripts/lint-block.ts
 * Exit: 0 clean, 1 malformed, 2 unreadable input.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Faithful port of validateShape from the pscale-beach handler. Returns null when
 * the shape is valid, or a human-facing error string (with the path to the fault)
 * when it is not.
 */
export function validateShape(content: unknown, path = ''): string | null {
  if (content == null) return null;
  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (trimmed.length > 1 && (trimmed[0] === '{' || trimmed[0] === '[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'object' && parsed !== null) {
          return `invalid value at "${path || '<root>'}" — JSON-stringified ${
            Array.isArray(parsed) ? 'array' : 'object'
          }; write the structure directly, not as a string`;
        }
      } catch {
        // Looks like JSON but isn't — just prose that opens with a brace. Fine.
      }
    }
    return null;
  }
  if (typeof content !== 'object') return null;
  if (Array.isArray(content)) {
    for (let i = 0; i < content.length; i++) {
      const err = validateShape(content[i], `${path}[${i}]`);
      if (err) return err;
    }
    return null;
  }
  for (const [key, val] of Object.entries(content as Record<string, unknown>)) {
    if (key !== '_' && !/^[1-9]$/.test(key)) {
      return `invalid key "${path ? `${path}.` : ''}${key}" — pscale spine accepts only "_" and single digits 1-9 at each level (compound slots like 11 or 234 are stored as nested single-digit keys, not literal keys)`;
    }
    const err = validateShape(val, path ? `${path}.${key}` : key);
    if (err) return err;
  }
  return null;
}

/** Floor = depth of the root underscore chain down to its first string terminus. */
export function floorOf(block: unknown): number {
  let depth = 0;
  let node: unknown = block;
  while (
    node &&
    typeof node === 'object' &&
    !Array.isArray(node) &&
    typeof (node as Record<string, unknown>)._ !== 'undefined'
  ) {
    depth += 1;
    node = (node as Record<string, unknown>)._;
    if (typeof node === 'string') break;
  }
  return depth;
}

function main(): void {
  const arg = process.argv[2];
  let raw: string;
  try {
    raw = readFileSync(arg ?? 0, 'utf8');
  } catch (e) {
    console.error(`could not read input: ${(e as Error).message}`);
    process.exit(2);
  }

  let block: unknown;
  try {
    block = JSON.parse(raw);
  } catch (e) {
    console.error(`not valid JSON: ${(e as Error).message}`);
    process.exit(2);
  }

  const err = validateShape(block);
  if (err) {
    console.error(`✗ malformed — ${err}`);
    process.exit(1);
  }
  console.log(
    `✓ well-formed (mechanical) — floor ${floorOf(block)}. ` +
      `Spine keys and value shapes pass the beach gate. ` +
      `Now run the interpretive pass: read the block against pscale://well-formed:2.`,
  );
  process.exit(0);
}

// Run only when invoked directly, so the port can be imported by smoke-wellformed.ts.
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
