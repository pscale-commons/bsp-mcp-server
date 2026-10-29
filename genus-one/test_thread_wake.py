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

# ── the live end rides as its own field, never clipped into the voice ───────
# (proposals/2026-10-29-threads-phase-2.md: egg-one tied thread:2 blind)
import json  # noqa: E402
LONG = "═══════════ THE THREAD — thread:2, the work taken up ═══════════\n" + "\n".join(
    "  2.%d · keel: a knot of some length, as thread 2's knots run, said here so the section passes two thousand characters" % i
    for i in range(1, 25))
ring = json.loads(waker.ring_payload("keel", "pool:egg-one", 136, "egg-one — keel. A thread waits: thread:2.", LONG))
check(ring["voice"] == "egg-one — keel. A thread waits: thread:2.", "the voice rides as it landed")
check(ring.get("thread") == LONG and len(LONG) > 2500, "a thread section past 2,500 characters rides whole beside it")
check("thread" not in json.loads(waker.ring_payload("keel", "pool:egg-one", 137, "hello")), "a ring that names no place carries no thread")

os.environ["ANTHROPIC_API_KEY"] = "offline-test-never-spent"  # the kernel binds a key at import; nothing calls out
import kernel  # noqa: E402
given = kernel.ring_given(ring)
check(given.get("thread") == LONG, "the kernel lays the live end in the given as its own key")
check(given["voice"] == ring["voice"], "and the voice beside it, unclipped by the thread")
check("ways:thread" in given["_"] and "read it before you tie" in given["_"].lower(), "the ring's assignment says the live end is there to read before tying")
plain = kernel.ring_given({"ringer": "keel", "pool": "pool:egg-one", "slot": "137", "voice": "hello"})
check("thread" not in plain and plain["_"] == kernel.RING_LEAD, "a ring with no thread composes exactly as before")

print("%d passed, %d failed" % (PASS, FAIL))
sys.exit(1 if FAIL else 0)
