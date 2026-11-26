#!/bin/bash
# The first-contact check, one cell: a clean headless Claude Code session holding only the
# open bsp connector, no CLAUDE.md or memory (it runs in an empty folder), every write to the
# beach refused by a hook. Usage: run.sh <run-id> <model> <effort> <prompt-file-in-prompts/>
# The family is spine:first-contact at the beach; its check is 1.1111.
#   CLAUDE_BIN  the claude CLI to run (default: claude; it must be signed in: claude auth status)
#   RIG_MCP     an MCP config to test instead of the open connector (default: mcp.json here)
#   RIG_OUT     where runs land (default: $TMPDIR/first-contact/<date>)
# Run it in a real terminal: a sandboxed shell cannot refresh the CLI's sign-in.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
OUT="${RIG_OUT:-${TMPDIR:-/tmp}/first-contact/$(date +%Y-%m-%d)}"
mkdir -p "$OUT"
WORK="$(mktemp -d)"
SETTINGS="$OUT/$1.settings.json"
printf '{"hooks":{"PreToolUse":[{"matcher":"mcp__bsp__.*","hooks":[{"type":"command","command":"python3 %s"}]}]}}' "$HERE/deny_writes.py" > "$SETTINGS"
cd "$WORK"
T0=$(python3 -c 'import time;print(time.time())')
export RIG_LOG="$OUT/$1.hook.jsonl"
perl -e 'alarm shift @ARGV; exec @ARGV' 900 "$CLAUDE_BIN" -p "$(cat "$HERE/prompts/$4")" --model "$2" --effort "$3" \
  --mcp-config "${RIG_MCP:-$HERE/mcp.json}" --strict-mcp-config --settings "$SETTINGS" --setting-sources project \
  --system-prompt "$(cat "$HERE/system.txt")" --tools "" --allowedTools "mcp__bsp" --permission-mode dontAsk \
  --disable-slash-commands --no-session-persistence --output-format stream-json --verbose --include-partial-messages --max-budget-usd 6 \
  < /dev/null 2> "$OUT/$1.err" | python3 -u "$HERE/stamp.py" "$T0" > "$OUT/$1.jsonl"
echo "done $1 $(python3 -c "import time;print(round(time.time()-$T0,1))")s"
