#!/bin/zsh
# run-minds.sh — the thread battery's fresh minds: each of the nine uses run by a fresh
# Claude Haiku handed one teaching, then graded. IT SPENDS MODEL CALLS (nine short
# sessions), so it runs only on David's word, and only with --spend.
#
#   thread-test-materials/run-minds.sh --spend [delivery] [cases]
#     delivery  L2 (function:thread as re-cut, the default), W2 (ways:thread), L, W1 ...
#     cases     C1,C2,... (default all nine)
#
# Each mind gets its brief on stdin and one tool, Bash, fenced to its own run's test-beach
# command (bb); the wake (C9) gets no tool at all, as a wake has none. No MCP server, no
# settings, no session kept. The runs land in $THREAD_TEST_RUNS (default: a new directory
# under the system's temp), never in the repo; the grade is printed and kept there.
set -u
[[ "${1:-}" == "--spend" ]] || { echo "run-minds.sh spends model calls: pass --spend, on David's word"; exit 2; }
shift
D=${1:-L2}; CASES=${2:-C1,C2,C3,C4,C5,C6,C7,C8,C9}
HERE=${0:A:h}
export THREAD_TEST_RUNS=${THREAD_TEST_RUNS:-$(mktemp -d -t thread-minds)}
python3 -I $HERE/battery.py setup $D $CASES > /dev/null || exit 1
for c in ${(s:,:)CASES}; do
  R=$THREAD_TEST_RUNS/$D-$c
  if [[ $c == C9 ]]; then
    (cd $R && claude -p --model haiku --tools "" --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
      --setting-sources "" --no-session-persistence < $R/brief.txt > $R/reply.txt 2> $R/err.txt)
  else
    (cd $R && claude -p --model haiku --tools Bash --allowedTools "Bash($R/bb:*)" \
      --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
      --setting-sources "" --no-session-persistence < $R/brief.txt > $R/reply.txt 2> $R/err.txt)
  fi
  echo "$D-$c exit $? · $(wc -l < $R/meter.jsonl | tr -d ' ') calls"
done
python3 -I $HERE/battery.py score $D $CASES
echo "runs and scores: $THREAD_TEST_RUNS"
