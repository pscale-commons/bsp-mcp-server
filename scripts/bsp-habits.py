#!/usr/bin/env python3
"""bsp-habits — how an LLM in Claude Code actually calls bsp(), from the transcripts on this machine.

The bolus is a habit, and habits are counted rather than felt (orientation:weft 7.83). This reads every
~/.claude/projects/**/*.jsonl, keeps only the bsp() tool (any server prefix ending "__bsp"), and prints one
row per month (or per week with --weekly):

  turns    assistant turns carrying at least one bsp call (grouped by message id)
  bundled  share of those turns carrying TWO OR MORE calls — the LLM's own bundling; a door that compiles
           N reads into one call lowers this by design, so read it beside the shapes
  whole    whole-block reads of a named block (no spindle, no pscale) — the most expensive call
  disc     spindle omitted, pscale set        walk   spindle alone       desc   spindle + pscale (descent or point)
  rungs    mean digits walked on spindle reads (10+ digit temporal addresses excluded)
  authored object writes that are not appends (a JSON payload passed as a string is parsed and counted)
  deep     share of authored writes nesting THREE OR MORE rungs in one write — the fan fault, measured

Baseline and findings to 2026-09-22: proposals/2026-09-23-the-bolus-envelope.md. Run it before and a week
after any change to a door, an envelope or an orientation block, and report the delta in the same columns.

  python3 scripts/bsp-habits.py                 monthly, every project
  python3 scripts/bsp-habits.py --weekly        weeks from Monday
  python3 scripts/bsp-habits.py --since 2026-08 rows from that month/week on
  python3 scripts/bsp-habits.py --project weft  only transcripts whose project dir contains this text
"""
import collections, datetime, glob, json, os, re, sys

args = sys.argv[1:]
WEEKLY = "--weekly" in args
SINCE = args[args.index("--since") + 1] if "--since" in args else ""
PROJECT = args[args.index("--project") + 1] if "--project" in args else ""
root = os.path.expanduser("~/.claude/projects")
files = [f for f in glob.glob(os.path.join(root, "**", "*.jsonl"), recursive=True) if PROJECT in f]

def bucket(ts):
    if len(ts) < 10: return "????"
    if not WEEKLY: return ts[:7]
    d = datetime.date.fromisoformat(ts[:10])
    return (d - datetime.timedelta(days=d.weekday())).isoformat()

def depth(o):
    if not isinstance(o, dict): return 0
    kids = [v for k, v in o.items() if re.fullmatch(r"[1-9_]", str(k))]
    return 1 + max([depth(v) for v in kids] or [0])

M = collections.defaultdict(collections.Counter)
turns = collections.defaultdict(collections.Counter)
rungs = collections.defaultdict(list)
for f in files:
    try: fh = open(f, encoding="utf-8", errors="replace")
    except OSError: continue
    with fh:
        for line in fh:
            if '"tool_use"' not in line: continue
            try: rec = json.loads(line)
            except ValueError: continue
            if rec.get("type") != "assistant": continue
            b = bucket(rec.get("timestamp") or "")
            msg = rec.get("message") or {}
            mid = msg.get("id") or rec.get("uuid")
            content = msg.get("content")
            if not isinstance(content, list): continue
            for blk in content:
                if blk.get("type") != "tool_use" or not str(blk.get("name", "")).endswith("__bsp"): continue
                inp = blk.get("input") or {}
                m = M[b]; m["calls"] += 1; turns[b][mid] += 1
                payload = inp.get("content")
                if isinstance(payload, str) and payload.lstrip().startswith("{"):
                    try: payload = json.loads(payload)
                    except ValueError: pass
                sp = inp.get("spindle"); sp = "" if sp in (None, "") else str(sp)
                P = inp.get("pscale_attention"); named = bool(inp.get("block"))
                if payload is None and inp.get("new_lock") is None:
                    m["reads"] += 1
                    if not named: m["r_index"] += 1
                    elif sp == "" and P is None: m["r_whole"] += 1
                    elif sp == "": m["r_disc"] += 1
                    elif P is None: m["r_walk"] += 1
                    else: m["r_desc"] += 1
                    d = len(re.sub(r"[^0-9]", "", sp))
                    if 0 < d < 10: rungs[b].append(d)
                elif payload is not None:
                    m["writes"] += 1
                    if isinstance(payload, dict) and not inp.get("append"):
                        m["authored"] += 1
                        if depth(payload) >= 3: m["deep"] += 1

def pct(a, b): return "%3d%%" % round(100.0 * a / b) if b else "   -"
print("%-10s calls turns bundled | whole  disc  walk  desc | rungs | authored deep" % ("week" if WEEKLY else "month"))
for b in sorted(M):
    if b < SINCE: continue
    m, t, rg = M[b], turns[b], rungs[b]
    multi = sum(1 for v in t.values() if v >= 2)
    print("%-10s %5d %5d  %s   | %s  %s  %s  %s | %4.1f  | %5d   %s" % (
        b, m["calls"], len(t), pct(multi, len(t)),
        pct(m["r_whole"], m["reads"]), pct(m["r_disc"], m["reads"]), pct(m["r_walk"], m["reads"]), pct(m["r_desc"], m["reads"]),
        (sum(rg) / len(rg)) if rg else 0.0, m["authored"], pct(m["deep"], m["authored"])))
print("\nfiles scanned: %d" % len(files))
