/**
 * bsp-cli.ts — CLI shim for running the 72-test acceptance battery against
 * bsp-mcp's TypeScript bspRead. Output matches bsp-alt.py's JSON shape so
 * the existing run-bsp-tests.py runner can swap targets without changes.
 *
 * Usage:
 *   tsx scripts/bsp-cli.ts <block.json> [--spindle X] [--pscale N]
 */
import * as fs from 'node:fs';
import { bspRead, InvalidAddressError } from '../src/bsp-fn.js';

function parseArgs(argv: string[]): { blockFile: string; spindle: string | null; pscale: number | null } {
  let blockFile = '';
  let spindle: string | null = null;
  let pscale: number | null = null;
  let i = 2;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--spindle') {
      spindle = argv[i + 1];
      i += 2;
    } else if (a === '--pscale') {
      pscale = parseInt(argv[i + 1], 10);
      i += 2;
    } else if (!blockFile) {
      blockFile = a;
      i++;
    } else {
      i++;
    }
  }
  return { blockFile, spindle, pscale };
}

function main(): number {
  const { blockFile, spindle, pscale } = parseArgs(process.argv);
  if (!blockFile) {
    process.stderr.write('usage: bsp-cli.ts <block.json> [--spindle X] [--pscale N]\n');
    return 1;
  }
  let block: any;
  try {
    block = JSON.parse(fs.readFileSync(blockFile, 'utf8'));
  } catch (e: any) {
    process.stderr.write(`Failed to load ${blockFile}: ${e?.message ?? e}\n`);
    return 1;
  }
  try {
    const result = bspRead(block, spindle, pscale);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return 0;
  } catch (e: any) {
    if (e instanceof InvalidAddressError) {
      process.stderr.write(`InvalidAddressError: ${e.message}\n`);
    } else {
      process.stderr.write(`Error: ${e?.message ?? e}\n`);
    }
    return 1;
  }
}

process.exit(main());
