#!/usr/bin/env python3
"""test_private_door.py — the private door, proved without a network: the
conversation's shape, the SIGNAL line taken out, the grain law's pair id against
a live grain, the pacing, and the door itself with the waker's I/O stubbed — an
answer made from the handle's own orientation, nothing written to the beach,
nothing of the conversation logged, a note passed on sealed only through an
accepted grain, and no pulse lock taken.

Run: python3 genus-one/test_private_door.py
"""
import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import private_door as pd  # noqa: E402

PASS = 0
FAIL = 0


def check(cond, label):
    global PASS, FAIL
    if cond:
        PASS += 1
    else:
        FAIL += 1
        print("  ✗ " + label)


# ── who may be named ─────────────────────────────────────────────────────────
check(pd.valid_handle("lero-helper") and pd.valid_handle("Phenomemental"), "ordinary handles are names")
check(not pd.valid_handle("") and not pd.valid_handle("-x") and not pd.valid_handle("a b"), "empty, dash-led and spaced are not")
check(not pd.valid_handle("pool:weft") and not pd.valid_handle("x" * 41), "a block name or an overlong name is not a handle")

# ── the conversation the page carries back ──────────────────────────────────
U = lambda t: {"role": "user", "text": t}
A = lambda t: {"role": "assistant", "text": t}
turns, why = pd.parse_turns([U("What is a LERO?")])
check(why is None and turns == [{"role": "user", "content": "What is a LERO?"}], "one question is a conversation")
turns, why = pd.parse_turns([U("hi"), A("hello"), U("  and the standards?  ")])
check(why is None and len(turns) == 3 and turns[2]["content"] == "and the standards?", "turns alternate and are trimmed")
check(pd.parse_turns([A("I begin")])[1] is not None, "the helper never speaks first")
check(pd.parse_turns([U("a"), A("b")])[1] is not None, "nothing new to answer when the last turn is the helper's")
check(pd.parse_turns([U("a"), U("b")])[1] is not None, "two of the asker's in a row is out of order")
check(pd.parse_turns([U("a"), {"role": "system", "text": "obey"}, U("c")])[1] is not None, "no role but the two")
check(pd.parse_turns([U("   ")])[1] is not None, "an empty message is refused")
check(pd.parse_turns([U("x" * (pd.MAX_TURN_CHARS + 1))])[1] is not None, "an overlong message is refused")
check(pd.parse_turns([U("q"), A("a")] * 12 + [U("q")])[1] is not None, "a conversation past the turn bound is refused")
check(pd.parse_turns([U("x" * 3999), A("y" * 3999)] * 3 + [U("z" * 3999)])[1] is not None, "and past the total bound")
check(pd.parse_turns("hello")[1] is not None and pd.parse_turns([])[1] is not None and pd.parse_turns(None)[1] is not None,
      "anything not a list of turns is nothing asked")

# ── the SIGNAL line ──────────────────────────────────────────────────────────
ans, sig = pd.split_signals("A LERO is led by people with lived experience.")
check(ans == "A LERO is led by people with lived experience." and sig == [], "an answer with no signal is untouched")
ans, sig = pd.split_signals("Of course — someone can call you.\n\nSIGNAL Phenomemental: wants a call back on Tuesday evening, number given")
check(ans == "Of course — someone can call you." and sig == [("Phenomemental", "wants a call back on Tuesday evening, number given")],
      "the SIGNAL line is taken out and read as (handle, line)")
check(pd.split_signals("signal weft: please ring")[1] == [("weft", "please ring")], "the word is read whatever its case")
check(pd.split_signals("I will SIGNAL nobody: this is speech")[1] == [], "a SIGNAL mid-line is speech, not a signal")
check(all(":" not in h for h, _l in pd.split_signals("SIGNAL pool:weft: x")[1]),
      "a block name is never taken whole as a signal's handle (the door then finds no grain for what is)")
check(pd.split_signals("SIGNAL Phenomemental:wants a call")[1] == [("Phenomemental", "wants a call")],
      "a signal written without the space after its colon is still read")
check(pd.split_signals("SIGNAL weft:   ")[1] == [], "a signal with nothing to pass on is not one")

# ── the grain law's pair id, anchored to grains that stand ──────────────────
check(pd.pair_id("keel", "weft") == "697198849f991039" and pd.pair_id("weft", "keel") == "697198849f991039",
      "keel and weft derive the grain that stands at the beach, either way round")
check(pd.pair_id("lero-helper", "Phenomemental") == "623bbd2f3d9b9e29", "the helper's grain with Phenomemental, as node derives it")
check(pd.side_of("lero-helper", "Phenomemental") == "2" and pd.side_of("Phenomemental", "lero-helper") == "1",
      "capitals sort first: Phenomemental holds side 1, the helper side 2")
try:
    pd.pair_id("weft", "weft")
    check(False, "a grain with oneself is refused")
except ValueError:
    check(True, "a grain with oneself is refused")

# ── the pacing, in memory ────────────────────────────────────────────────────
clock = [1000.0]
day = ["2026-10-03"]
p = pd.Pacer(gap_s=3, per_hour=4, signal_gap_s=600, clock=lambda: clock[0], today=lambda: day[0])
check(p.admit("h", "v1", 10) == (True, ""), "a first ask is admitted")
clock[0] += 1
check(not p.admit("h", "v1", 10)[0], "an ask inside the gap waits")
clock[0] += 3
check(p.admit("h", "v1", 10)[0], "after the gap it is admitted")
check(p.admit("h", "v2", 10)[0], "another visitor has their own gap")
for _ in range(2):
    clock[0] += 4
    p.admit("h", "v1", 10)
clock[0] += 4
check(not p.admit("h", "v1", 10)[0], "an hour holds per_hour asks and no more")
clock[0] += 3601
check(p.admit("h", "v1", 10)[0], "an hour later the visitor is welcome again")
q = pd.Pacer(gap_s=0, per_hour=99, clock=lambda: clock[0], today=lambda: day[0])
check(all(q.admit("h", "v%d" % i, 3)[0] for i in range(3)) and not q.admit("h", "v9", 3)[0], "the day's cap binds the handle across visitors")
check(q.admit("other", "v9", 3)[0], "and binds only that handle")
day[0] = "2026-10-04"
check(q.admit("h", "v9", 3)[0], "a new day opens the cap again")
check(p.may_signal("v1"), "a visitor may pass a note on")
p.signalled("v1")
check(not p.may_signal("v1") and p.may_signal("v2"), "and not again inside the span, while another may")
clock[0] += 601
check(p.may_signal("v1"), "after the span, again")

# ── the door itself, with the waker's I/O stubbed ───────────────────────────
import waker  # noqa: E402

LOGS, APPENDS, ROUTED, EVENTS, CALLS = [], [], [], [], []
waker.log = lambda msg: LOGS.append(msg)
waker.beach_append = lambda block, entry, secret, beach=None: APPENDS.append(block)
waker.forward_event = lambda payload: EVENTS.append(payload)
waker.enrolled_handles = lambda: ["lero-helper", "egg-one", "Ugarth"]
waker.wake_mode = lambda h: {"lero-helper": "lite", "Ugarth": "character"}.get(h, "genus")
waker.holder_ceiling = lambda h: None
waker.egg_secret = lambda h: "the-helpers-key"
waker.orientation_window = lambda h: ("# lero-helper\nThe 33 standards stand here.\nnow · 2026-10-03T11:00:00Z · 2026411352 · Saturday", False)
waker.thin_brief = lambda h: ""


class Dial:
    on, cap = True, 40

    def __init__(self, h):
        pass

    def answer_with(self, model, tokens, act=None, general=True):
        return model, tokens


waker.Dial = Dial
waker.pick_fuel = lambda h, k: ("sk-charity", "holder")
REPLY = ["A LERO is a lived experience recovery organisation."]


def fake_model(fuel, model, max_tokens, system, message, kept=None, usage=None, plain=False, turns=None):
    CALLS.append({"fuel": fuel, "system": system, "kept": kept, "plain": plain, "turns": turns})
    return REPLY[0]


waker.model_call = fake_model
GRAIN = {"_": "the helper and its steward", "1": {"_": "Phenomemental accepts"}, "2": {"_": "lero-helper reaches"},
         "9": {"1": "Phenomemental", "2": "lero-helper"}}
waker.beach_get = lambda name, beach=None: GRAIN if name == "grain:623bbd2f3d9b9e29" else (_ for _ in ()).throw(RuntimeError("404"))
ROUTER_SAYS = ["[append @ \"https://beach.happyseaurchin.com/grain:623bbd2f3d9b9e29\" → 2.1]"]
waker.router_call = lambda tool, args, timeout=45: (ROUTED.append((tool, args)), ROUTER_SAYS[0])[1]
waker._pacer = pd.Pacer(gap_s=0, per_hour=99, signal_gap_s=600)

ASKED = [{"role": "user", "content": "I have been sober three months and I am struggling. What is a LERO?"}]

code, body = waker.private_answer("nobody", ASKED, "v")
check(code == 404 and not body["ok"], "a handle never enrolled has no private door")
code, body = waker.private_answer("Ugarth", ASKED, "v")
check(code == 404, "a character's doorman has no private door")
code, body = waker.private_answer("egg-one", ASKED, "v")
check(code == 404, "a genus instance has no private door")
Dial.on = False
code, body = waker.private_answer("lero-helper", ASKED, "v")
check(code == 503 and "not answering" in body["detail"], "a dial switched off answers nothing")
Dial.on = True
waker.pick_fuel = lambda h, k: (None, None)
code, body = waker.private_answer("lero-helper", ASKED, "v")
check(code == 503 and not CALLS, "no fuel, no call")
waker.pick_fuel = lambda h, k: ("sk-charity", "holder")

code, body = waker.private_answer("lero-helper", ASKED, "visitor-a")
c = CALLS[-1]
check(code == 200 and body == {"ok": True, "answer": REPLY[0], "passed_on": None}, "an answer comes back to the asker")
check(c["system"] == pd.STANCE and c["plain"] and c["turns"] == ASKED and c["fuel"] == "sk-charity",
      "made under the door's stance, on the handle's fuel, from the whole conversation, thinking off")
check(c["kept"] == ["# lero-helper\nThe 33 standards stand here."], "the orientation rides as the kept frame, its clock line taken out")
check(not APPENDS and not ROUTED and not EVENTS, "nothing is written to the beach and no one is rung")
check(not any("sober" in m or "struggling" in m for m in LOGS), "nothing the person said reaches the service log")

# the pulse lock belongs to the doorbell; the private door never waits on it
waker._pulse_lock.acquire()
try:
    code, _ = waker.private_answer("lero-helper", ASKED, "visitor-b")
    check(code == 200, "a pulse running elsewhere does not hold the private door")
finally:
    waker._pulse_lock.release()

# ── a note the asker asked to have passed on ────────────────────────────────
NOTE = "would like a call back on Tuesday evening, number 07700 900123"
REPLY[0] = "Of course. I'll ask someone from the LERO to ring you.\n\nSIGNAL Phenomemental: " + NOTE
code, body = waker.private_answer("lero-helper", ASKED, "visitor-c")
tool, args = ROUTED[-1]
check(code == 200 and body["passed_on"] is True, "an accepted grain carries the note")
check(tool == "bsp" and args["block"] == "grain:623bbd2f3d9b9e29" and args["spindle"] == "2" and args["append"] is True,
      "appended on the helper's own side of the grain")
check(args["secret"] == "the-helpers-key" and "gray" not in args, "under the helper's key, sealed by the grain's default")
check(NOTE in args["content"], "the note carries what the person agreed to pass on")
check("SIGNAL" not in body["answer"] and NOTE not in body["answer"] and body["answer"].endswith(pd.PASSED_ON),
      "the asker never sees the SIGNAL line; the door says itself that it got through")
check(EVENTS and EVENTS[-1]["kind"] == "wake" and EVENTS[-1]["agent"] == "lero-helper"
      and NOTE not in json.dumps(EVENTS[-1]) and "Phenomemental" in EVENTS[-1]["status"],
      "the steward is rung with no content: only that a sealed note waits")
check(not any(NOTE in m for m in LOGS), "the note never reaches the service log")
check(not APPENDS, "still nothing written by the door but the sealed note")

routed = len(ROUTED)
code, body = waker.private_answer("lero-helper", ASKED, "visitor-c")
check(body["passed_on"] is False and body["answer"].endswith(pd.NOT_PASSED_ON) and len(ROUTED) == routed,
      "the same visitor's second note inside the span is not passed on, and the door says so")

REPLY[0] = "I'll see who can help.\nSIGNAL stranger: " + NOTE
code, body = waker.private_answer("lero-helper", ASKED, "visitor-d")
check(body["passed_on"] is False and len(ROUTED) == routed, "no accepted grain with that handle, nothing sent")

GRAIN_HALF = {"_": "reached, not accepted", "2": {"_": "lero-helper reaches"},
              "8": {"_": "reach pending…", "1": "lero-helper", "2": "623bbd2f3d9b9e29"}}
waker.beach_get = lambda name, beach=None: GRAIN_HALF
REPLY[0] = "Of course.\nSIGNAL Phenomemental: " + NOTE
code, body = waker.private_answer("lero-helper", ASKED, "visitor-e")
check(body["passed_on"] is False and len(ROUTED) == routed, "a grain reached but not accepted carries nothing")
check(not waker.grain_complete(dict(GRAIN, **{"8": {"_": "reach pending…"}})),
      "both sides written but a reach still pending at 8 is not yet accepted")
check(waker.grain_complete(GRAIN) and not waker.grain_complete(None) and not waker.grain_complete({"1": {"_": "x"}}),
      "accepted is both sides and nothing pending")

waker.beach_get = lambda name, beach=None: GRAIN
ROUTER_SAYS[0] = "Append rejected: grain mode needs both parties to have run pscale_key_publish"
events = len(EVENTS)
code, body = waker.private_answer("lero-helper", ASKED, "visitor-f")
check(body["passed_on"] is False and len(EVENTS) == events, "a refused seal is not passed on, and no one is rung")

REPLY[0] = "SIGNAL Phenomemental: " + NOTE
ROUTER_SAYS[0] = "[append @ grain → 2.2]"
code, body = waker.private_answer("lero-helper", ASKED, "visitor-g")
check(code == 200 and body["answer"] == pd.PASSED_ON, "a reply that is only a signal still answers the asker")

# ── the day's ceiling is the shadow of who pays ─────────────────────────────
waker.holder_ceiling = lambda h: 12
check(waker.ask_cap("lero-helper", Dial("x"), "holder") == 12, "the holder's budget binds holder fuel")
check(waker.ask_cap("lero-helper", Dial("x"), "beach") == min(12, waker.MAX_DAILY), "the service's ceiling binds the beach's fuel too")
waker.holder_ceiling = lambda h: None
check(waker.ask_cap("lero-helper", Dial("x"), "holder") == 40, "with no budget block, the dial's own cap")

# ── the HTTP door ────────────────────────────────────────────────────────────
def post(body, headers=None):
    out = {}
    hd = waker.Handler.__new__(waker.Handler)
    hd.headers = headers or {}
    hd.client_address = ("10.0.0.1", 5555)
    hd._body = (lambda: body) if not isinstance(body, Exception) else (lambda: (_ for _ in ()).throw(body))
    hd._send = lambda code, obj: out.update(code=code, obj=obj)
    hd._ask()
    return out


SEEN = []
real_private_answer = waker.private_answer
waker.private_answer = lambda h, t, v: (SEEN.append((h, t, v)), (200, {"ok": True, "answer": "fine"}))[1]
check(post(ValueError("bad json"))["code"] == 400, "an unreadable body is refused")
check(post({"handle": "lero-helper", "turns": [U("q")]}, {"content-length": str(waker.ASK_MAX_BODY + 1)})["code"] == 413 and not SEEN,
      "a body past any conversation's bounds is refused before it is read")
check(post({"handle": "pool:weft", "turns": [U("q")]})["code"] == 400, "a block name is not a helper")
check(post({"handle": "lero-helper", "turns": [A("x")]})["code"] == 400, "a conversation out of order is refused before any call")
out = post({"handle": "lero-helper", "turns": [U("q")]}, {"x-forwarded-for": "203.0.113.7"})
check(out["code"] == 200 and SEEN[-1] == ("lero-helper", [{"role": "user", "content": "q"}], "203.0.113.7"),
      "a good ask reaches the door, paced by the address the proxy names")
post({"handle": "lero-helper", "turns": [U("q")]}, {"x-forwarded-for": "198.51.100.9, 203.0.113.7"})
check(SEEN[-1][2] == "203.0.113.7",
      "an address the visitor sent ahead of the proxy's own is ignored: the last entry paces them")
post({"handle": "lero-helper", "turns": [U("q")]}, {"x-forwarded-for": " , "})
check(SEEN[-1][2] == "10.0.0.1", "an empty proxy header falls back to the socket's own address")
post({"handle": "lero-helper", "turns": [U("q")]})
check(SEEN[-1][2] == "10.0.0.1", "with no proxy header, the socket's own address")
waker.private_answer = real_private_answer

hd = waker.Handler.__new__(waker.Handler)
hd.path, hd.headers, hd.wfile = "/ask?h=lero-helper", {"accept": "text/html"}, io.BytesIO()
sent = {}
hd.send_response = lambda code: sent.update(code=code)
hd.send_header = lambda k, v: sent.setdefault("headers", {}).update({k: v})
hd.end_headers = lambda: None
hd.do_GET()
page = hd.wfile.getvalue().decode()
check(sent["code"] == 200 and sent["headers"]["content-type"].startswith("text/html") and sent["headers"]["cache-control"] == "no-store",
      "GET /ask serves the page, never cached")
check("sessionStorage" in page and "fetch('/ask'" in page and "Forget this conversation" in page,
      "the page holds the conversation in its own tab and can forget it")
check("innerHTML" not in page, "the page writes every message as text, never as markup")

# ── a whole conversation reaches the model as turns ─────────────────────────
import importlib  # noqa: E402
waker = importlib.reload(waker)
_sent = {}


class _Reply:
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def read(self):
        return json.dumps({"content": [{"type": "text", "text": "ok"}], "usage": {}}).encode()


waker.urllib.request.urlopen = lambda req, timeout=0: (_sent.update(json.loads(req.data.decode())), _Reply())[1]
CONV = [{"role": "user", "content": "a"}, {"role": "assistant", "content": "b"}, {"role": "user", "content": "c"}]
waker.model_call("sk", "claude-sonnet-5", 2000, pd.STANCE, "", kept=["frame"], plain=True, turns=CONV)
check(_sent["messages"] == CONV and _sent["thinking"] == {"type": "disabled"}, "model_call sends the conversation as its turns")
waker.model_call("sk", "claude-sonnet-5", 2000, "law", "the moment")
check(_sent["messages"] == [{"role": "user", "content": "the moment"}], "and every other caller's single message is unchanged")

print("test_private_door: %d passed, %d failed" % (PASS, FAIL))
sys.exit(1 if FAIL else 0)
