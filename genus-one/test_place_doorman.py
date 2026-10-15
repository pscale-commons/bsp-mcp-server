#!/usr/bin/env python3
"""test_place_doorman.py — a doorman sitting in a place's room under a name of
its own (Community Recovery's holder: enrolled at its place, answering in
pool:meeting-room), proved without a network: a ring at the place reaches it in
the room its enrolment names, through the same gates as the apex doorman, and a
character in the room still answers first; another room, another place, or the
handle's own room anywhere does not reach it; the apex doorman with no room is
untouched, and so is the genus pulse; its turn compiles, reads and answers at
the place and in that room; a lone em dash keeps it silent while the wake is
still logged; and a re-enrolment that does not mention the room keeps it.

Run: python3 genus-one/test_place_doorman.py
"""
import json
import os
import sys
import threading
import types

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


# ── nothing here reaches a network ──────────────────────────────────────────
def no_network(req, timeout=0):
    raise AssertionError("a test reached for the network: %s" % getattr(req, "full_url", req))


_real_urlopen = waker.urllib.request.urlopen
waker.urllib.request.urlopen = no_network

APEX = waker.WAKER_BEACH
PLACE = APEX + "/w/community-recovery"
PLACE_ORIGIN = waker.host_of(PLACE)  # the beach's own form of a place: <host>/w/<name>, no scheme
HOLDER = "cr-holder"                 # its holders name it; the code assumes no name
STORE = {
    HOLDER: {"secret": "holder-key", "fuel": "sk-holder", "mode": "lite", "dial": "", "beach": PLACE, "room": "meeting-room"},
    "apex-door": {"secret": "door-key", "fuel": "sk-door", "mode": "lite", "dial": "", "beach": ""},
    "egg": {"secret": "egg-key", "fuel": "sk-egg", "mode": "", "dial": "", "beach": ""},
}
LOGS = []
waker.log = lambda msg: LOGS.append(msg)
waker._store_load = lambda: STORE
waker.WAKER_EGGS = []


class Dial:
    """The dial as the gates read it: the switch, the cap, the pacing."""
    on, cap, refractory = True, 30, 0
    OFF = set()

    def __init__(self, handle):
        if handle in Dial.OFF:
            self.on = False

    def cooldown_for(self, ringer):
        return 0

    def answer_with(self, model, tokens, act=None, general=True):
        return model, tokens


waker.Dial = Dial
SPENT = [0]
waker.pulses_today = lambda h: SPENT[0]
waker.holder_ceiling = lambda h: None
KEPT, CHARACTERS_RUNG, PULSED = [], [], []
CANDS = [[]]
waker.keeper_on_bell = lambda cands, payload: KEPT.append((list(cands), payload.get("origin")))
waker.character_candidates = lambda origin, room: list(CANDS[0])
waker.ring_character = lambda cands, payload: (CHARACTERS_RUNG.append(list(cands)), (True, "a character answers"))[1]
_pulsed = threading.Event()


def fake_run_pulse(handle, ringer, pool, slot, fuel_key=None, funder="beach", pen=None, voice=None):
    PULSED.append((handle, ringer, pool, slot, fuel_key, funder))
    waker._pulse_lock.release()  # the worker's own last act: the pen goes back
    _pulsed.set()


REAL_RUN_PULSE = waker.run_pulse
waker.run_pulse = fake_run_pulse


def rung(origin, pool, ringer="alice", slot="7"):
    """One ring as the beach sends it; a granted pulse is awaited on its thread."""
    del KEPT[:], CHARACTERS_RUNG[:], PULSED[:]
    _pulsed.clear()
    waker._last_ring_by.clear()
    waker._last_pulse_end = 0.0
    granted, why = waker.ring({"origin": origin, "pool": pool, "slot": slot, "agent_id": ringer,
                               "ts": "2026-10-15T10:00:00Z"})
    if granted:
        _pulsed.wait(5)
    return granted, why


# ── (a) a ring at the place reaches the doorman enrolled there for that room ──
check(waker.dt.origin_matches(PLACE_ORIGIN, PLACE) and "://" not in PLACE_ORIGIN
      and waker.host_of(PLACE_ORIGIN) != waker.host_of(APEX),
      "the ring's origin (the beach's form, no scheme) and the enrolment's URL name one place, and it is not the apex")
granted, why = rung(PLACE_ORIGIN, "pool:meeting-room")
check(granted and PULSED == [(HOLDER, "alice", "pool:meeting-room", "7", "sk-holder", "holder")],
      "a voice in pool:meeting-room at the place wakes the doorman enrolled there for that room, on its own fuel")
check(why == "pulse 1/30 for %s, rung by alice, holder fuel" % HOLDER, "and says so in the apex doorman's own words")
check(KEPT == [([], PLACE_ORIGIN)], "the world's keeper still hears every beat at the place, as before")
Dial.on = False
granted, why = rung(PLACE_ORIGIN, "pool:meeting-room")
check(not granted and not PULSED and why == "dial off — %s has not consented" % HOLDER,
      "its own dial off: no pulse — the gate the apex doorman meets")
Dial.on = True
SPENT[0] = 30
granted, why = rung(PLACE_ORIGIN, "pool:meeting-room")
check(not granted and not PULSED and why == "daily cap reached (30/30)", "its cap reached: no pulse, the same gate again")
SPENT[0] = 0
granted, why = rung(PLACE_ORIGIN, "pool:meeting-room", ringer=HOLDER)
check(not granted and not PULSED and why.startswith("self-ring"), "its own answer landing in the room never wakes it again")
waker._pulse_lock.acquire()
try:
    granted, why = rung(PLACE_ORIGIN, "pool:meeting-room")
finally:
    waker._pulse_lock.release()
check(not granted and not PULSED and why.startswith("a pulse is already running"), "one pulse at a time, the place's as the apex's")
CANDS[0] = [("Ugarth", PLACE)]
granted, why = rung(PLACE_ORIGIN, "pool:meeting-room")
check(granted and CHARACTERS_RUNG == [[("Ugarth", PLACE)]] and not PULSED,
      "a character standing in the room keeps it first, exactly as before")
CANDS[0] = []

# ── (b) another room, another place, or the handle's own room does not reach it ──
granted, why = rung(PLACE_ORIGIN, "pool:hallway")
check(not granted and not PULSED and "no character or doorman enrolled there answers in pool:hallway" in why,
      "another room at the same place does not wake it")
granted, why = rung(waker.host_of(APEX) + "/w/elsewhere", "pool:meeting-room")
check(not granted and not PULSED, "the same room at another place does not wake it")
granted, why = rung(waker.host_of(APEX), "pool:meeting-room")
check(not granted and not PULSED and why == "pool:meeting-room is not a genus room here (no holder has enrolled it)",
      "nor does a room of that name at the apex")
granted, why = rung(waker.host_of(APEX), "pool:%s" % HOLDER)
check(not granted and not PULSED and why == "%s answers in pool:meeting-room at %s, never from here" % (HOLDER, PLACE),
      "nor does a voice in an apex room named for the handle — it is woken only where its enrolment puts it")
granted, why = rung(PLACE_ORIGIN, "pool:%s" % HOLDER)
check(not granted and not PULSED, "nor, at its own place, a room named for the handle once the enrolment names another")
STORE["aa-later"] = {"secret": "k2", "fuel": "sk-later", "mode": "lite", "dial": "", "beach": PLACE, "room": "meeting-room"}
Dial.OFF.add("aa-later")
granted, why = rung(PLACE_ORIGIN, "pool:meeting-room")
check(granted and PULSED and PULSED[0][0] == HOLDER,
      "a doorman enrolled later into the same room — first by name, its dial off — cannot take the room from the first")
del STORE["aa-later"]
Dial.OFF.discard("aa-later")

# ── (c) the apex doorman with no room, and the genus pulse, are untouched ────
granted, why = rung(waker.host_of(APEX), "pool:apex-door")
check(granted and PULSED == [("apex-door", "alice", "pool:apex-door", "7", "sk-door", "holder")]
      and why == "pulse 1/30 for apex-door, rung by alice, holder fuel",
      "a voice in an apex doorman's own room wakes it, word for word as before")
granted, why = rung("", "pool:apex-door")
check(granted and PULSED and PULSED[0][0] == "apex-door", "an origin left unsaid is the apex, as before")
granted, why = rung(waker.host_of(APEX), "pool:egg")
check(granted and PULSED == [("egg", "alice", "pool:egg", "7", "sk-egg", "holder")], "a genus room rings its pulse through the same gates")
STORE["apex-room"] = {"secret": "k", "fuel": "sk-room", "mode": "lite", "dial": "", "beach": "", "room": "front-desk"}
granted, why = rung(waker.host_of(APEX), "pool:front-desk")
check(granted and PULSED and PULSED[0][0] == "apex-room", "an apex doorman whose enrolment names a room is reached there by the same lookup")
del STORE["apex-room"]
waker.run_pulse = REAL_RUN_PULSE

# ── the doorman's turn, with the router, the beach and the model held in memory ──
ROUTED, READ, APPENDED, ASKED, VOICES, EVENTS = [], [], [], [], [], []
ORIENTATION = ["# cr-holder\nIts law, as its own block says it."]
REPLY = ["The agenda stands at the constitution's 4.5."]
ROOMS = {
    (PLACE, "pool:meeting-room"): {"_": "The meeting room.",
                                   "1": {"_": "Can you remind us where the agenda lives?", "1": "alice", "3": "2026-10-15T10:00:00Z"}},
    (PLACE, "passport:%s" % HOLDER): {"_": "cr-holder — the meeting's doorman."},
    (APEX, "pool:apex-door"): {"_": "apex-door's own room.", "1": {"_": "hello?", "1": "bob", "3": "2026-10-15T09:00:00Z"}},
}


def fake_get(name, beach=None):
    READ.append((name, beach))
    found = ROOMS.get(((beach or APEX).rstrip("/"), name))
    if found is None:
        raise RuntimeError("404")
    return found


class _Reply:
    def __init__(self, body):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def read(self):
        return json.dumps(self.body).encode()


def fake_urlopen(req, timeout=0):
    if getattr(req, "full_url", "") != "https://api.anthropic.com/v1/messages":
        return no_network(req)
    ASKED.append((req.get_header("X-api-key"), json.loads(req.data.decode())))
    return _Reply({"content": [{"type": "text", "text": REPLY[0]}], "stop_reason": "end_turn"})


waker.router_call = lambda tool, args, timeout=45: (ROUTED.append((tool, dict(args))), ORIENTATION[0])[1]
waker.beach_get = fake_get
waker.beach_append = lambda block, entry, secret, beach=None: APPENDED.append((block, entry, secret, beach))
waker.urllib.request.urlopen = fake_urlopen


def turn(handle, pool="pool:meeting-room", fuel="sk-holder", key="holder-key"):
    del ROUTED[:], READ[:], APPENDED[:], ASKED[:]
    return waker.lite_answer(handle, "alice", pool, "7", fuel, key)


# ── (d) at the place: compiled, read and answered there, in its room ─────────
status, note = turn(HOLDER)
check(status == "done", "the doorman at the place answers")
check(ROUTED == [("pscale_play", {"world": PLACE, "handle": HOLDER, "room": "meeting-room"})],
      "its orientation is compiled at the place, the meeting room folded into it")
check(READ == [("pool:meeting-room", PLACE)], "the room is read at the place, and nothing at the apex")
check(len(APPENDED) == 1 and APPENDED[0][0] == "pool:meeting-room" and APPENDED[0][2:] == ("holder-key", PLACE)
      and APPENDED[0][1]["_"] == REPLY[0] and APPENDED[0][1]["1"] == HOLDER,
      "the answer lands in pool:meeting-room at the place, under its own key and name")
fuel, sent = ASKED[0] if ASKED else (None, {})
check(fuel == "sk-holder" and ORIENTATION[0] in sent.get("system", "")
      and "The room pool:meeting-room" in sent["messages"][0]["content"]
      and "alice · 2026-10-15T10:00:00Z: Can you remind us where the agenda lives?" in sent["messages"][0]["content"],
      "one call on its fuel, its orientation as the system, the room's voices as the message")
status, note = turn(HOLDER, pool="pool:hallway")
check(status == "done" and READ == [("pool:meeting-room", PLACE)] and APPENDED[0][0] == "pool:meeting-room",
      "the room is derived from the enrolment, never taken from the ring's label")


def router_down(tool, args, timeout=45):
    raise RuntimeError("router unreachable")


waker.router_call = router_down
status, note = turn(HOLDER)
check(status == "done" and READ[:2] == [("passport:%s" % HOLDER, PLACE), ("pool:meeting-room", PLACE)]
      and "(degraded orientation)" in note,
      "with the router down, the thin brief is the passport and the room's purpose at the place")
waker.router_call = lambda tool, args, timeout=45: (ROUTED.append((tool, dict(args))), ORIENTATION[0])[1]

# ── (c, again) the apex doorman's turn is where it always was ───────────────
status, note = turn("apex-door", pool="pool:apex-door", fuel="sk-door", key="door-key")
check(status == "done" and ROUTED == [("pscale_play", {"world": APEX, "handle": "apex-door", "room": "apex-door"})],
      "the apex doorman compiles at the apex in its own room, as before")
check([(n, (b or APEX)) for n, b in READ] == [("pool:apex-door", APEX)]
      and [(a[0], a[3] or APEX) for a in APPENDED] == [("pool:apex-door", APEX)],
      "and reads and answers its own room at the apex")

# ── (e) a lone em dash is silence ────────────────────────────────────────────
for said in ("—", "  —\n"):
    REPLY[0] = said
    status, note = turn(HOLDER)
    check(status == "declined" and note == "kept silent: nothing to add" and not APPENDED,
          "a reply of a lone em dash (%r) writes nothing to the room" % said)
for said in ("— one thing: the minutes stand at 4.5.", "-", "–"):
    REPLY[0] = said
    status, note = turn(HOLDER)
    check(status == "done" and len(APPENDED) == 1, "a reply that is more than the dash, or another dash (%r), is spoken" % said)

# ── the wake, logged where the doorman lives — run_pulse with the kernel held ──
NO_KERNEL = types.ModuleType("kernel")
NO_KERNEL.pulse = lambda: {"status": "done", "note": "rested"}
_had_kernel = sys.modules.get("kernel")
sys.modules["kernel"] = NO_KERNEL
_real_importlib = waker.importlib
waker.importlib = types.SimpleNamespace(reload=lambda m: m)
waker.ensure_nest = lambda h: os.path.join(os.sep, "nowhere", h)  # never created: the held kernel reads nothing
waker.landed_voice = lambda pool, slot, beach=None: (VOICES.append((pool, slot, beach)), "the voice")[1]
waker.forward_event = lambda payload: EVENTS.append(payload)
waker.notify_holder = lambda *a, **k: None


def pulse(handle, pool, fuel):
    del APPENDED[:], VOICES[:], EVENTS[:]
    waker._pulse_lock.acquire()  # held by the ring that grants a pulse; the worker gives it back
    status, note = waker.run_pulse(handle, "alice", pool, "7", fuel, "holder")
    daily = [a for a in APPENDED if a[0] == "daily:%s" % handle]
    return status, note, daily


REPLY[0] = "—"
status, note, daily = pulse(HOLDER, "pool:meeting-room", "sk-holder")
check(status == "declined" and not [a for a in APPENDED if a[0].startswith("pool:")],
      "a silent wake through the pulse writes nothing to the room")
check(len(daily) == 1 and daily[0][2:] == ("holder-key", PLACE) and daily[0][1]["5"] == "declined"
      and "kept silent: nothing to add" in daily[0][1]["_"] and daily[0][1]["1"] == "waker",
      "and the wake is still logged in daily:<handle> at the place, where its cap counts it")
check(VOICES == [("pool:meeting-room", "7", PLACE)] and EVENTS and EVENTS[-1]["origin"] == PLACE and EVENTS[-1]["status"] == "declined",
      "the landed voice is read, and the wake announced, at the place")
REPLY[0] = "Hello, bob."
status, note, daily = pulse("apex-door", "pool:apex-door", "sk-door")
check(status == "done" and len(daily) == 1 and (daily[0][3] or APEX) == APEX and EVENTS[-1]["origin"] == APEX
      and [(p, (b or APEX)) for p, _s, b in VOICES] == [("pool:apex-door", APEX)],
      "the apex doorman's wake is read, logged and announced at the apex, as before")
status, note, daily = pulse("egg", "pool:egg", "sk-egg")
check(status == "done" and len(daily) == 1 and daily[0][3] is None and VOICES == [("pool:egg", "7", None)]
      and EVENTS[-1]["origin"] == APEX,
      "the genus pulse passes the very same arguments it always did")
waker.importlib = _real_importlib
if _had_kernel is None:
    sys.modules.pop("kernel", None)
else:
    sys.modules["kernel"] = _had_kernel

# ── (f) enrolment: the room proven at the place, kept when not mentioned ─────


def enrol(body, prior):
    saved, out, proofs = {}, {}, []
    waker._store_load = lambda: {k: dict(v) for k, v in prior.items()}
    waker._store_save = lambda s: saved.update(s)
    waker.verify_shell_key = lambda h, p, beach=None: (proofs.append(beach), (True, "proven"))[1]
    waker.set_consent = waker.set_answer = waker.set_behaviours = lambda *a, **k: ""
    hd = waker.Handler.__new__(waker.Handler)
    hd._body = lambda: body
    hd._send = lambda code, obj: out.update(code=code, obj=obj)
    hd._enroll(False)
    return out, saved.get(body.get("handle"), {}), proofs


FIRST = {"handle": HOLDER, "passphrase": "holder-key", "mode": "lite", "beach": PLACE,
         "room": "pool:meeting-room", "fuel": "sk-holder"}
out, rec, proofs = enrol(FIRST, {})
check(out.get("code") == 200 and rec.get("room") == "meeting-room" and rec.get("beach") == PLACE and rec.get("mode") == "lite",
      "a doorman enrols at its place with its room, the 'pool:' shed")
check(proofs == [PLACE], "its key is proven at the place, where its shell stands")
check("a landed voice in pool:meeting-room at %s rings it" % PLACE in out["obj"]["detail"],
      "and the holder is told where it will answer")
PRIOR = {HOLDER: dict(rec)}
PAGE = {"handle": HOLDER, "passphrase": "holder-key", "fuel": "sk-holder", "beach": PLACE, "behaviours": "",
        "mode": "lite", "dial": "", "answer": "sonnet", "consent": True}
out, rec, proofs = enrol(PAGE, PRIOR)
check(out.get("code") == 200 and rec.get("room") == "meeting-room", "the enrol page, which knows nothing of rooms, keeps the room")
out, rec, proofs = enrol({"handle": HOLDER, "passphrase": "new-key", "notify": "", "fuel": "sk-holder"}, PRIOR)
check(rec.get("room") == "meeting-room" and rec.get("beach") == PLACE and rec.get("secret") == "new-key" and proofs == [PLACE],
      "a re-key that names neither room nor place keeps both, and proves at the place")
out, rec, proofs = enrol(dict(PAGE, room=""), PRIOR)
check(rec.get("room") == "", "a room named empty clears: the handle's own room again")
for bad in ("the meeting room", "pool:a:b", "-dash-led", "x" * 65):
    out, rec, proofs = enrol(dict(PAGE, room=bad), PRIOR)
    check(out.get("code") == 400 and not rec and not proofs, "a room that is no bare name (%r) is refused before any proof" % bad[:20])
out, rec, proofs = enrol({"handle": "apex-door", "passphrase": "door-key", "mode": "lite"}, {})
check(out.get("code") == 200 and rec.get("room") == "" and proofs == [None]
      and "a landed voice in pool:apex-door rings it" in out["obj"]["detail"],
      "an apex doorman enrols as it always did: no room, proven at the apex, its own room said back")

waker.urllib.request.urlopen = _real_urlopen
print("test_place_doorman: %d passed, %d failed" % (PASS, FAIL))
sys.exit(1 if FAIL else 0)
