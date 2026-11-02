#!/bin/zsh
# run-minds.sh — the thread battery's fresh minds: each of the nine uses run by a fresh
# Claude Haiku handed one teaching, then graded. IT SPENDS MODEL CALLS (nine short
# sessions, about half a cent each at list price, capped at 25 cents each), so it runs
# only on David's word, and only with --spend.
#
#   thread-test-materials/run-minds.sh --spend [delivery] [cases]
#     delivery  L2 (function:thread as re-cut, the default), R (the root line a live read gives,
#               the law's branches and the way on the test beach), W2 (ways:thread), L, W1 ...
#     cases     C1,C2,... (default all nine)
#
# Each mind gets its brief on stdin and one tool, Bash, fenced to its own run's test-beach
# command (bb); the wake (C9) gets no tool at all, as a wake has none. No MCP server, no
# settings, no session kept, and nothing of the session that runs this but what the CLI
# needs to sign in and find itself. The runs land in $THREAD_TEST_RUNS (default: a new
# directory under the system's temp), never in the repo; each keeps its reply and, in
# usage.json, its model, turns, cost and whatever the fence refused. The grade is printed
# and kept there.
set -u
[[ "${1:-}" == "--spend" ]] || { echo "run-minds.sh spends model calls: pass --spend, on David's word"; exit 2; }
shift
D=${1:-L2}; CASES=${2:-C1,C2,C3,C4,C5,C6,C7,C8,C9}
HERE=${0:A:h}
export THREAD_TEST_RUNS=${THREAD_TEST_RUNS:-$(mktemp -d -t thread-minds)}
python3 -I $HERE/battery.py setup $D $CASES > /dev/null || exit 1
FRESH=(env -i HOME="$HOME" USER="${USER:-}" PATH="$PATH" LANG=en_US.UTF-8)
ASK=(--model haiku --strict-mcp-config --mcp-config '{"mcpServers":{}}' --setting-sources "" \
     --no-session-persistence --max-budget-usd 0.25 --output-format json)
for c in ${(s:,:)CASES}; do
  R=$THREAD_TEST_RUNS/$D-$c
  if [[ $c == C9 ]]; then TOOLS=(--tools ""); else TOOLS=(--tools Bash --allowedTools "Bash($R/bb:*)"); fi
  (cd $R && "${FRESH[@]}" claude -p "${ASK[@]}" "${TOOLS[@]}" < $R/brief.txt > $R/run.json 2> $R/err.txt)
  rc=$?
  python3 -I -c '
import json, sys
d = json.load(open(sys.argv[1]))
open(sys.argv[2], "w").write(d.get("result") or "")
json.dump({"models": sorted(d.get("modelUsage") or {}), "turns": d.get("num_turns"), "ms": d.get("duration_ms"), "cost_usd": d.get("total_cost_usd"),
           "stop": d.get("subtype"), "refused": [str((x.get("tool_input") or {}).get("command", x.get("tool_name"))) for x in d.get("permission_denials") or []]},
          open(sys.argv[3], "w"), indent=1, ensure_ascii=False)
' $R/run.json $R/reply.txt $R/usage.json 2>> $R/err.txt && rm -f $R/run.json
  [[ -s $R/err.txt ]] || rm -f $R/err.txt
  echo "$D-$c exit $rc · $(wc -l < $R/meter.jsonl | tr -d ' ') calls"
done
python3 -I $HERE/battery.py score $D $CASES
echo "runs and scores: $THREAD_TEST_RUNS"
