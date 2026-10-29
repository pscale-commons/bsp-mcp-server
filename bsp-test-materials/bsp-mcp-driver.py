#!/usr/bin/env python3
"""bsp-mcp-driver.py — bsp-alt.py's CLI, answered by this repo's TypeScript walker.

run-bsp-tests.py calls it when given `mcp`: the fixture and the spindle and
pscale go to scripts/bsp-cli.ts, which runs bspRead from src/bsp-fn.ts and
prints the result in bsp-alt.py's JSON shape. Needs `npm install` at the repo
root.

Usage (matches bsp-alt.py):
    python3 bsp-mcp-driver.py <block.json> [--spindle X] [--pscale N]
"""
import os
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TSX = os.path.join(REPO, 'node_modules', '.bin', 'tsx')

# Resolve the block file argument to an absolute path before changing cwd.
args = list(sys.argv[1:])
if args and not args[0].startswith('--'):
    args[0] = os.path.abspath(args[0])

r = subprocess.run([TSX, os.path.join(REPO, 'scripts', 'bsp-cli.ts')] + args,
                   capture_output=True, text=True, cwd=REPO)
sys.stdout.write(r.stdout)
sys.stderr.write(r.stderr)
sys.exit(r.returncode)
