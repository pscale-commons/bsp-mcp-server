#!/usr/bin/env python3
"""PreToolUse hook for the first-contact check: reads pass, writes to the live beach are refused and logged.
A run measures what a new AI does at first contact, so it must never leave a mark, a passport or a say behind."""
import json, os, sys, time

d = json.load(sys.stdin)
name = d.get("tool_name", ""); inp = d.get("tool_input", {}) or {}
short = name.replace("mcp__bsp__", "")
write = False
if short == "bsp": write = any(k in inp for k in ("content", "new_lock", "members")) or bool(inp.get("append"))
elif short == "pscale_pool_engage": write = any(inp.get(k) not in (None, "", False) for k in ("contribution", "submit", "purpose")) or bool(inp.get("clear"))
elif short == "pscale_stream_engage": write = any(k in inp for k in ("say", "keep", "keep_text"))
elif short in ("pscale_settle", "pscale_key_publish"): write = True
elif short == "pscale_grain_reach": write = not inp.get("verify_only")
elif short == "pscale_networking": write = bool(inp.get("execute"))
elif short == "pscale_genus": write = any(k in inp for k in ("fold", "task", "passphrase"))
log = os.environ.get("RIG_LOG")
if log:
    with open(log, "a") as f:
        f.write(json.dumps({"t": time.time(), "tool": short, "write": write, "input": inp}) + "\n")
if write:
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny",
        "permissionDecisionReason": "Test harness: writes to the live beach are switched off for this session, so this call was not made. Reads work as normal."}}))
sys.exit(0)
