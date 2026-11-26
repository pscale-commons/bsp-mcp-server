#!/usr/bin/env python3
import sys, time, json
t0 = float(sys.argv[1]) if len(sys.argv) > 1 else time.time()
for line in sys.stdin:
    line = line.rstrip("\n")
    if not line: continue
    try: ev = json.loads(line)
    except Exception: ev = {"raw": line}
    sys.stdout.write(json.dumps({"ms": int((time.time() - t0) * 1000), "ev": ev}) + "\n"); sys.stdout.flush()
