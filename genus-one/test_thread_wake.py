#!/usr/bin/env python3
"""test_thread_wake.py — a ring that names a thread, proved without a network:
the place is read off the voice (thread:14.12), the door is asked for it, and
the door's THREAD section is what rides a genus pulse beside the voice
(function:thread 5; proposals/2026-10-29-threads-the-registry.md).

Run: python3 genus-one/test_thread_wake.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import waker  # noqa: E402

PASS = 0
FAIL = 0


def check(cond, label):
    global PASS, FAIL
    if cond:
        PASS += 1
    else:
        FAIL += 1
        print("  ✗ " + label)


# ── the place a ring names ───────────────────────────────────────────────────
check(waker.thread_place("keel → neptune: thread:14.12 waits on you") == "14.12", "a place is read off the voice")
check(waker.thread_place("over to you, thread:7") == "7", "a bare number is a place")
check(waker.thread_place("the threads proposal, spine:threads 1.18") is None, "a block named threads is not a place")
check(waker.thread_place("thread:weft is a mirror") is None, "a mirror's name is not a place")
check(waker.thread_place(None) is None, "no voice, no place")

# ── the door's THREAD section ────────────────────────────────────────────────
WINDOW = "\n".join([
    "# You are now playing neptune in https://beach.test",
    "═══════════ THE ROOM — operating directive + live scene ═══════════",
    "ROOM-BODY",
    "",
    "═══════════ THE THREAD — thread:14.12, the work taken up; tie your knot in your own mirror (function:thread 2) ═══════════",
    "thread:14.12 — 14 in the registry: Ghost Racer through the plug · opened by keel",
    "  14.12 · happyseaurchin: asked for changes — admit the room plug as a third tag",
    "  14.121 · happyseaurchin: resubmit",
    "",
    "═══════════ THE COMPASS — this beach's lighthouse at a glance ═══════════",
    "COMPASS-BODY",
])
sec = waker.thread_section(WINDOW)
check(sec.startswith("═══════════ THE THREAD — thread:14.12"), "the section opens on its own header")
check("14.121 · happyseaurchin: resubmit" in sec, "every knot at the place rides")
check("COMPASS" not in sec and "ROOM-BODY" not in sec, "nothing else of the window rides")
check(waker.thread_section("no sections here") == "", "a window with no thread gives nothing")

# ── the door is asked for the place ──────────────────────────────────────────
asked = []
_kept = (waker.router_call, waker.enrolment_beach, waker.enrolment_room)
waker.router_call = lambda tool, args, timeout=45: asked.append((tool, args)) or WINDOW
waker.enrolment_beach = lambda h: "https://beach.test"
waker.enrolment_room = lambda h: h
try:
    text, degraded = waker.orientation_window("neptune", "14.12")
    check(not degraded and "THE THREAD" in text, "the window carries the thread")
    check(asked and asked[-1][0] == "pscale_play" and asked[-1][1].get("thread") == "14.12", "the door is asked for the place")
    waker.orientation_window("neptune")
    check("thread" not in asked[-1][1], "a ring with no place asks the door for none")
finally:
    waker.router_call, waker.enrolment_beach, waker.enrolment_room = _kept

print("%d passed, %d failed" % (PASS, FAIL))
sys.exit(1 if FAIL else 0)
