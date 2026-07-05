#!/usr/bin/env python3
"""heartbeat.py — external clock for the genus-one pulse (federated dialect;
verbatim from pscale-biome src/agent/heartbeat.py, v009 — the mobius lineage).

One wake = one pulse (the kernel has no loop). Two modes:

  RESEARCH (default) — pulse, and STOP when the agent settles (γ=∅), so you
  never wait on an idle agent. Use --interval for a fast fixed cadence:
      python3 heartbeat.py --max 12               # self-paced gaps, stop on rest
      python3 heartbeat.py --interval 4 --max 8   # fixed 4s cadence (fast)

  PRODUCTION (--paced) — honour the agent's own self-set rate, back off on
  rest, and keep running (the 24/7 soliton):
      python3 heartbeat.py --paced --max 0        # unbounded; Ctrl-C to stop

Flags: --max N (0 = unbounded) · --interval N (fixed seconds, overrides) ·
       --paced · --rests N (research: stop after N consecutive rests, default 1)
Needs ANTHROPIC_API_KEY.
"""
import sys
import time

import kernel

MIN_S, MAX_S = 5, 3600
DEFAULT_CONTINUE, DEFAULT_REST = 90, 1800


def _arg(name, default):
    if name in sys.argv:
        try:
            return int(sys.argv[sys.argv.index(name) + 1])
        except (IndexError, ValueError):
            pass
    return default


def main():
    mx = _arg("--max", 12)
    interval = _arg("--interval", -1)
    paced = "--paced" in sys.argv
    stop_after = _arg("--rests", 1)
    n = rests = 0
    try:
        while mx == 0 or n < mx:
            n += 1
            print("\n— pulse %d%s —" % (n, "" if mx == 0 else "/%d" % mx))
            res = kernel.pulse() or {}
            # a genuine settle is the kernel's γ=∅ branch declining to draw — NOT a
            # work pulse where the agent merely self-reports "rest" after closing gaps.
            rested = res.get("status") == "rest" and res.get("gamma", 1) == 0
            rests = rests + 1 if rested else 0
            if rested:
                print("  ● settled (γ=∅) — rest %d" % rests)
                if not paced and rests >= stop_after:
                    print("  agent has settled; stopping. (use --paced to keep idling.)")
                    break
            if mx and n >= mx:
                break
            if interval >= 0:                              # fixed research cadence
                hb = interval
            elif res.get("heartbeat") is not None:         # the agent's own rate
                hb = res["heartbeat"]
            else:                                          # status default
                hb = DEFAULT_REST if rested else DEFAULT_CONTINUE
            hb = max(MIN_S, min(MAX_S, int(hb)))
            print("  next wake in %ds" % hb)
            time.sleep(hb)
    except KeyboardInterrupt:
        print("\nheartbeat: interrupted.")
    print("heartbeat: %d pulse(s) done." % n)


if __name__ == "__main__":
    main()
