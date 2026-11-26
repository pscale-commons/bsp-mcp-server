#!/bin/bash
# The first-contact check, every cell: for each prompt letter given (A B C D), Sonnet and Opus at
# medium and max effort, four sessions at a time. Usage: matrix.sh A B C D
# A second arm (a connector under test, RIG_MCP=<config>) takes a name prefix: ARM=L matrix.sh A B C D
HERE="$(cd "$(dirname "$0")" && pwd)"
for P in "$@"; do
  for M in sonnet opus; do for E in medium max; do
    "$HERE/run.sh" "${ARM:-}$P-$M-$E" "claude-$M-5-5" "$E" "$P.txt" &
  done; done
  wait
done
echo "analyse: python3 $HERE/analyze.py \"${RIG_OUT:-${TMPDIR:-/tmp}/first-contact/$(date +%Y-%m-%d)}\""
