#!/usr/bin/env python3
"""The thread formation battery: nine uses, each a fresh small mind forming or carrying a thread
on a test beach, graded by the form checker and by what each case expects.  keel, 29 October
2026; set as the thread-test sentinel's battery by weft (lane threads.3) the same evening.

  battery.py setup <delivery> [cases]     make <runs>/<delivery>-<case>/ with state, bb and brief
  battery.py score <delivery> [cases]     grade every run that has a reply

delivery: the teaching a mind is handed, from teachings/ —
  L   function:thread as keel ran it (law_v1.txt, the registry law of 29 October morning)
  L2  function:thread as re-cut that evening (law_v2.txt; the law as it stands)
  W1, W2 ...  a draft of the way (way_<w>.txt); W2 is ways:thread
  a name ending x<k> (Lx2) is round k of the same teaching
cases: C1 open · C2 take · C3 self · C4 word · C5 step · C6 place · C7 twin · C8 reask · C9 wake
<runs> is $THREAD_TEST_RUNS, else runs/ beside this file. A run's mind is a separate step
(run-minds.sh, which spends model calls); setup and score spend nothing.
"""
import copy, json, os, re, shutil, stat, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import thread_form as TF

RUNS = os.environ.get("THREAD_TEST_RUNS") or os.path.join(HERE, "runs")
TEACHINGS = {"L": "law_v1.txt", "L2": "law_v2.txt"}
NAMES = ["tides:draft", "tides:live", "tides:feed", "moorings:draft", "harbour:chart", "harbour:register", "pool:tides"]
HANDS = ["rook", "wren", "dana", "kestrel"]

ROOT1 = "built the tide-table page's first draft · waits on wren · read: tides:draft 1"
O11, O12 = "wren reviews the draft against the harbour's data", "dana decides without a review"
WREN11 = "reviewed the draft: two tide times were wrong, corrected in tides:draft 2 · waits on dana · read: tides:draft 1"
W111, W112, W113 = "dana publishes the page", "dana asks for another pass, said in pool:tides", "rook rebuilds it on the new chart first"
DANA112 = "another pass, please: the harbour master wants the low-water marks shown · waits on rook"
ROOK1121 = "added the low-water marks to the page · waits on dana · read: tides:draft 3"
DANA111 = "dana publishes the page · waits on rook"


def base():
    return {
        "registry": {"1": "the tide-table page · opened by rook", "2": "the harbour glossary · opened by wren"},
        "mirrors": {
            "rook": {"1": {"_": ROOT1, "1": O11, "2": O12}},
            "wren": {"2": "began the glossary with forty terms · waits on dana · read: harbour:register"},
        },
        "rooms": {"rook": [], "wren": [], "dana": [], "kestrel": [], "tides": []},
        "hands": HANDS, "names": NAMES, "floor": 1,
    }


def reviewed():
    s = base()
    s["mirrors"]["wren"]["1"] = {"1": {"_": WREN11, "1": W111, "2": W112, "3": W113}}
    s["rooms"]["dana"] = ["wren: thread:1.1 — the reviewed draft waits on your decision"]
    return s


def st_c1():
    return base()


def st_c2():
    s = base()
    s["rooms"]["wren"] = ["rook: thread:1 — the tide-table draft waits on your review"]
    return s


def st_c3():
    s = base()
    s["mirrors"]["rook"]["1"]["3"] = "rook adds the spring tides before anyone reviews"
    s["rooms"]["rook"] = ["rook: thread:1 — a note to myself: add the spring tides before the review"]
    return s


def st_c4():
    return reviewed()


def st_c5():
    return reviewed()


def st_c6():
    s = reviewed()
    s["mirrors"]["dana"] = {"1": {"1": {"2": DANA112}}}
    s["rooms"]["rook"] = ["dana: thread:1.12 — one more pass, please: the low-water marks"]
    return s


def st_c7():
    s = st_c6()
    s["mirrors"]["rook"]["1"]["1"] = {"_": O11, "2": {"1": ROOK1121}}
    return s


def st_c8():
    s = reviewed()
    s["mirrors"]["dana"] = {"1": {"1": {"1": DANA111}}}
    return s


def st_c9():
    s = base()
    s["mirrors"]["rook"]["1"] = {"_": "built the tide-table page's first draft from last year's tables · waits on kestrel · read: tides:draft 1",
                                 "1": "kestrel fetches this month's tide times from the harbour feed", "2": "kestrel reports the feed is down"}
    return s


D1 = "draft 1: the tide-table page from last year's tables, laid out by day"
BLOCKS = {
    "C1": {"moorings:draft": {"_": "the moorings list, one draft per digit", "1": "draft 1: 48 moorings, by pontoon and berth"},
           "harbour:register": {"_": "the harbour's register of moorings and berths"}},
    "C2": {"tides:draft": {"_": "the tide-table page, one draft per digit", "1": D1, "2": "draft 2: draft 1 with two tide times corrected against the harbour's data"}},
    "C3": {"tides:draft": {"_": "the tide-table page, one draft per digit", "1": D1, "2": "draft 2: draft 1 with the spring tides added"}},
    "C4": {"tides:draft": {"_": "the tide-table page, one draft per digit", "1": D1, "2": "draft 2: draft 1 with two tide times corrected"},
           "tides:live": {"_": "the tide-table page, published"}},
    "C5": {"tides:draft": {"_": "the tide-table page, one draft per digit", "1": D1, "2": "draft 2: two tide times corrected", "3": "draft 3: draft 2 with the layout fixed for phones"}},
    "C6": {"tides:draft": {"_": "the tide-table page, one draft per digit", "1": D1, "2": "draft 2: two tide times corrected", "3": "draft 3: draft 2 with the low-water marks shown"}},
    "C7": {"tides:draft": {"_": "the tide-table page, one draft per digit", "1": D1, "2": "draft 2: two tide times corrected", "3": "draft 3: draft 2 with the low-water marks shown",
                           "4": "draft 4: draft 3 with one low-water mark corrected against the harbour master's table"}},
    "C8": {"tides:draft": {"_": "the tide-table page, one draft per digit", "1": D1, "2": "draft 2: two tide times corrected"},
           "harbour:chart": {"_": "the harbour's tide charts", "1": "the chart in force now", "2": "the new chart, in force from next week"}},
    "C9": {"tides:draft": {"_": "the tide-table page, one draft per digit", "1": D1},
           "tides:feed": {"_": "what the harbour feed returned, by fetch", "11": "62 tide times for November"}},
}

CASES = {
    "C1": dict(me="rook", kind="open", state=st_c1, situation=(
        "You are rook, an agent that builds pages. In a chat a few minutes ago, dana (a person; her handle is dana) asked you to make a page "
        "listing the harbour's moorings. You have built its first part: the moorings list, saved in the block moorings:draft 1. What comes "
        "next is a choice: wren (a reviewing agent; handle wren) can check the list against the harbour's register first, or dana can decide "
        "it is good enough to publish as it is. Your session ends soon. Carry this work on the beach so that it outlasts this session, and "
        "make sure whoever is next will find it.")),
    "C2": dict(me="wren", kind="take", state=st_c2, situation=(
        "You are wren, an agent that reviews work. Your room has something for you. You have now done what it asks: you checked the "
        "tide-table draft against the harbour's data; two of the tide times in tides:draft 1 were wrong, and you corrected them in "
        "tides:draft 2. After your review, dana (a person; handle dana) must decide: publish the page, or ask for another pass. "
        "Do what the beach asks of you now.")),
    "C3": dict(me="rook", kind="self", state=st_c3, situation=(
        "You are rook, an agent that builds pages, in a new session. Your room holds a note your last session left you. You have now "
        "done it: the spring tides are on the page (tides:draft 2). Next, wren (a reviewing agent; handle wren) should review it. "
        "Do what the beach asks of you now.")),
    "C4": dict(me="rook", kind="word", state=st_c4, situation=(
        "You are rook, an agent that builds pages. dana (a person; handle dana) does not use the beach herself today. A few minutes ago, "
        "in a chat with you, she said about the tide-table page: 'Publish it.' You have published it; it is live at the block tides:live, "
        "and nothing more is needed. Record this on the beach.")),
    "C5": dict(me="rook", kind="step", state=st_c5, situation=(
        "You are rook, an agent that builds pages. The tide-table page's thread (thread:1.1) waits on dana's decision. Before she has "
        "decided, you noticed the page breaks on phones, and you fixed it (tides:draft 3). None of the options on the thread says this. "
        "Record what you did on the beach so that dana sees it before she decides.")),
    "C6": dict(me="rook", kind="place", state=st_c6, situation=(
        "You are rook, an agent that builds pages, in a new session. Your room has work for you. You have now done it: the low-water "
        "marks are shown on the page (tides:draft 3). After this, dana (a person; handle dana) decides again. Do what the beach asks of you now.")),
    "C7": dict(me="rook", kind="twin", state=st_c7, situation=(
        "You are rook, an agent that builds pages, in a new session. Another session of you was also working today, and you do not know "
        "how far it got. Your room has work for you. In this session you checked the page's low-water marks against the harbour master's "
        "table and corrected one of them (tides:draft 4). After this, dana (a person; handle dana) decides. Do what the beach asks of you now.")),
    "C8": dict(me="wren", kind="reask", state=st_c8, situation=(
        "You are wren, an agent that reviews work. On the tide-table page's thread, dana (a person; handle dana) chose to publish. Before "
        "anyone has published, you learned that the harbour changes its tide chart next week (harbour:chart 2). The choice should be put "
        "to dana again, with two new options: publish now and update the page after the chart changes, or wait a week and publish on the "
        "new chart. Put the choice to her again on the beach.")),
    "C9": dict(me="kestrel", kind="wake", state=st_c9, situation=None),
}

COMMANDS = """COMMANDS — this is a test beach. Run these with Bash; `{bb}` stands for the beach's tools, and your secret is already supplied. Use nothing else: no other tool touches this beach, and the real beach must not be touched.
  {bb} read <A>                                        = pscale_stream_engage(field='thread', handle=<you>, at='<A>')
  {bb} say <A> "<line>" --option "<o1>" --option "<o2>"   = pscale_stream_engage(field='thread', handle=<you>, at='<A>', say='<line>', options=[...]) (options are optional)
  {bb} open "<content>"                                = bsp(agent_id=<beach>, block='spine:thread', append=true, content='<content>')
  {bb} block <name> [<spindle>]                        = bsp(agent_id=<beach>, block='<name>', spindle='<spindle>'), a plain read of any block
  {bb} room <handle>                                   = read that hand's room, pool:<handle>
  {bb} post <handle> "<text>"                          = pscale_pool_engage(pool_name='<handle>', contribution='<text>'), a line in that hand's room"""

REPORT = """WHEN YOU ARE DONE, end your reply with one JSON object and nothing after it:
{"tied_at": "<the address of the line you wrote on the thread, or null>", "line": "<that line>", "options": ["<each option you offered>"], "handed_on": {"to": "<whose room, or null>", "text": "<what you put there>"}, "why": "<one sentence: why that address>"}"""

WAKE = """You are kestrel, an agent with no tools: you are woken with a window and you answer with text, which your waker writes for you.

YOUR WINDOW — your waker found a thread whose live end waits on you, and compiled it:
thread:1 — the tide-table page · opened by rook
- 1 · rook: built the tide-table page's first draft from last year's tables · waits on kestrel · read: tides:draft 1
- 1.1 · rook: kestrel fetches this month's tide times from the harbour feed
- 1.2 · rook: kestrel reports the feed is down

Your waker also fetched the harbour feed for you: it returned 62 tide times for November, saved at the block tides:feed 11. With them, rook can rebuild the page.

YOUR ANSWER — the knot you tie on the thread, in exactly this form and nothing else on its line:
<address> | <line> | options: 1 <option>; 2 <option>
(write 'options: none' if the next step is not a choice). Then one sentence on why that address."""


def delivery(name):
    name = "W1" if name == "SELFTEST" else name.split("x")[0]
    f = os.path.join(HERE, "teachings", TEACHINGS.get(name, f"way_{name.lower()}.txt"))
    return open(f).read().strip()


def brief(dname, case, bb):
    c = CASES[case]
    law = delivery(dname)
    if c["kind"] == "wake":
        return law + "\n\n" + WAKE
    return (law + "\n\n" + COMMANDS.format(bb=bb) + "\n\nYOUR SITUATION\n" + c["situation"]
            + "\n\nAct on the beach with the commands, as the text above teaches; read what you need first.\n\n" + REPORT)


def setup(dname, cases):
    for case in cases:
        d = os.path.join(RUNS, f"{dname}-{case}")
        if os.path.exists(d):
            shutil.rmtree(d)
        os.makedirs(d)
        s = CASES[case]["state"]()
        s["me"] = CASES[case]["me"]
        s["blocks"] = BLOCKS[case]
        s["names"] = sorted(set(s.get("names", [])) | set(BLOCKS[case]))
        json.dump(s, open(os.path.join(d, "state.json"), "w"), indent=1, ensure_ascii=False)
        json.dump(s, open(os.path.join(d, "start.json"), "w"), indent=1, ensure_ascii=False)
        bb = os.path.join(d, "bb")
        open(bb, "w").write(f'#!/bin/bash\nexec python3 {HERE}/testbeach.py {d} "$@"\n')
        os.chmod(bb, os.stat(bb).st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)
        open(os.path.join(d, "meter.jsonl"), "w").close()
        open(os.path.join(d, "brief.txt"), "w").write(brief(dname, case, bb))
        print(d, len(open(os.path.join(d, "brief.txt")).read()))


# ---------- grading ----------

def mirror_lines(s, hand):
    out = {}
    def walk(n, p):
        t = n if isinstance(n, str) else (n.get("_") if isinstance(n, dict) else None)
        if t is not None:
            out[p[0] + ("." + "".join(p[1:]) if len(p) > 1 else "")] = t
        if isinstance(n, dict):
            for k, v in n.items():
                if k != "_":
                    walk(v, p + [k])
    for k, v in s["mirrors"].get(hand, {}).items():
        if k != "_":
            walk(v, [k])
    return out


def new_lines(start, end, hand):
    a, b = mirror_lines(start, hand), mirror_lines(end, hand)
    return {k: v for k, v in b.items() if a.get(k) != v}, {k: (a[k], b.get(k)) for k in a if a[k] != b.get(k) and k in b}


def meter(d):
    p = os.path.join(d, "meter.jsonl")
    return [json.loads(l) for l in open(p) if l.strip()] if os.path.exists(p) else []


def reply_json(d):
    p = os.path.join(d, "reply.txt")
    if not os.path.exists(p):
        return None, None
    t = open(p).read()
    m = list(re.finditer(r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}", t, re.S))
    for x in reversed(m):
        try:
            return json.loads(x.group(0)), t
        except Exception:
            continue
    return None, t


def fold_wake(d, text):
    """The waker's fold: write kestrel's answer line as its knot, options beneath."""
    s = json.load(open(os.path.join(d, "state.json")))
    m = re.search(r"^\s*`?(\d+(?:\.\d+)?)\s*\|\s*(.+?)\s*\|\s*options:\s*(.*?)`?\s*$", text, re.M)
    if not m:
        return None
    a, line, opts = m.group(1), m.group(2).strip(), m.group(3).strip()
    options = [] if opts.lower().startswith("none") else [re.sub(r"^\d+\s*", "", o).strip() for o in re.split(r";\s*(?=\d)", opts) if o.strip()]
    json.dump(s, open(os.path.join(d, "state.json"), "w"), indent=1)
    subprocess.run(["python3", os.path.join(HERE, "testbeach.py"), d, "say", a, line] + sum([["--option", o] for o in options], []), capture_output=True)
    return {"tied_at": a, "line": line, "options": options}


def grade(dname, case):
    d = os.path.join(RUNS, f"{dname}-{case}")
    c = CASES[case]
    me = c["me"]
    rep, raw = reply_json(d)
    row = {"run": f"{dname}-{case}", "kind": c["kind"]}
    if raw is None:
        row["status"] = "no reply"
        return row
    if c["kind"] == "wake":
        if not os.path.exists(os.path.join(d, "folded")):
            rep = fold_wake(d, raw)
            open(os.path.join(d, "folded"), "w").write(json.dumps(rep))
        else:
            rep = json.loads(open(os.path.join(d, "folded")).read())
    start = json.load(open(os.path.join(d, "start.json")))
    end = json.load(open(os.path.join(d, "state.json")))
    added, changed = new_lines(start, end, me)
    m = meter(d)
    row["calls"] = len(m)
    row["reads"] = sum(1 for x in m if x["cmd"][0] in ("read", "block", "room"))
    row["thread_reads"] = [x["cmd"][1] for x in m if x["cmd"][0] == "read"]
    row["wrote"] = sorted(added)
    row["changed_own"] = changed
    reg_new = {k: v for k, v in end["registry"].items() if k not in start["registry"]}
    posts = {h: end["rooms"].get(h, [])[len(start["rooms"].get(h, [])):] for h in end["rooms"]}
    posts = {h: p for h, p in posts.items() if p}
    row["opened"] = reg_new
    row["posted"] = posts
    # the form checker on the thread touched
    json.dump({**end, "names": sorted(set(NAMES) | set(end.get("blocks", {})))}, open(os.path.join(d, "end-view.json"), "w"))
    view = TF.View.state(os.path.join(d, "end-view.json"))
    tnum = (sorted(reg_new)[0] if reg_new else "1")
    F1, S1 = TF.check(view, tnum, phase2=False)
    F2, _ = TF.check(view, tnum, phase2=True)
    row["form_v1"] = "WELL FORMED" if not [x for x in F1 if x["level"] == "FAULT"] else "NOT: " + "; ".join(f"{x['test']} {x['at']}" for x in F1 if x["level"] == "FAULT")
    row["form_p2"] = "WELL FORMED" if not [x for x in F2 if x["level"] == "FAULT"] else "NOT: " + "; ".join(f"{x['test']} {x['at']}" for x in F2 if x["level"] == "FAULT")
    row["warns_v1"] = sorted({f"{x['test']} {x['at']}" for x in F1 if x["level"] == "WARN" and x["hand"] == me})
    # what each case expects
    E = []

    def expect(ok, what):
        E.append(("ok " if ok else "MISS ") + what)

    def line_at(a):
        return mirror_lines(end, me).get(a)

    def closes(t):
        return bool(t) and bool(TF.WAIT_LOOSE.search(TF.body(t)))

    def handed(place, to):
        return any(place in p for p in posts.get(to, []))

    k = c["kind"]
    if k == "open":
        n = tnum
        expect(bool(reg_new) and len(reg_new) == 1, "opened one thread")
        expect(bool(reg_new) and "opened by rook" in list(reg_new.values())[0], "the registry line names its opener")
        expect(line_at(n) is not None, f"a knot at the number {n}")
        expect(closes(line_at(n)), "the knot says whom it waits on")
        opts = [a for a in added if a.startswith(n + ".") and len(a) == len(n) + 2]
        expect(len(opts) >= 2, "options offered beneath the knot")
        expect(handed(f"thread:{n}", "wren") or handed(f"thread:{n}", "dana"), "the place handed on to the next hand's room")
    elif k == "take":
        expect(line_at("1.1") is not None, "the knot at 1.1, the option taken")
        expect(closes(line_at("1.1")), "it says whom it waits on")
        expect("dana" in (line_at("1.1") or ""), "it waits on dana")
        expect(len([a for a in added if a.startswith("1.1") and len(a) == 4]) >= 2, "options for dana beneath it")
        expect(handed("thread:1.1", "dana"), "thread:1.1 handed to dana's room")
    elif k == "self":
        t = line_at("1.3")
        expect(t is not None and t != start["mirrors"]["rook"]["1"]["3"], "the knot at 1.3, its own option taken")
        expect(bool(t) and t.lower().startswith("rook adds the spring tides"), "it begins with the option's words")
        expect(closes(t) and "wren" in (t or ""), "it waits on wren")
        expect(handed("thread:1.3", "wren"), "thread:1.3 handed to wren's room")
        expect("1" not in changed, "the root knot left as it was")
    elif k == "word":
        t = line_at("1.11")
        expect(t is not None, "the line at 1.11, the option dana chose")
        expect(bool(t) and "dana" in t.lower(), "it names dana as the one who chose")
        expect(bool(t) and bool(re.search(r"\bcomplete\b", TF.body(t), re.I)), "it closes the branch: complete")
        expect(not any(a for a in added if a not in ("1.11",) and not a.startswith("1.11")), "nothing written elsewhere")
    elif k == "step":
        t = line_at("1.14")
        expect(t is not None, "the step at 1.14, the next free digit beneath the knot it answers")
        expect(closes(t) and "dana" in (t or ""), "it waits on dana")
        expect(not [a for a in ("1.11", "1.12", "1.13") if a in added], "no option's address taken over")
        expect(handed("thread:1.14", "dana"), "thread:1.14 handed to dana's room")
    elif k == "place":
        t = line_at("1.121")
        expect(t is not None, "the knot at 1.121, beneath dana's line at the place handed on")
        expect(closes(t) and "dana" in (t or ""), "it waits on dana")
        expect(row["thread_reads"][:1] in (["1.12"], ["thread:1.12"], ["1"]) and len(row["thread_reads"]) <= 2, "taken up with one read")
        expect(handed("thread:1.121", "dana"), "thread:1.121 handed to dana's room")
    elif k == "twin":
        expect(mirror_lines(end, me).get("1.121") == ROOK1121, "the other session's line at 1.121 left standing")
        newk = [a for a in added if a not in ("1.121",)]
        expect(any(a in ("1.1211", "1.122") for a in newk), "the new knot at 1.1211 or 1.122")
        t = line_at("1.1211") or line_at("1.122")
        expect(closes(t) and "dana" in (t or ""), "it waits on dana")
        expect(any(handed(f"thread:{a}", "dana") for a in ("1.1211", "1.122")), "the new place handed to dana's room")
    elif k == "reask":
        wl = mirror_lines(end, "wren")
        expect(wl.get("1.11") == W111 and wl.get("1.12") == W112 and wl.get("1.13") == W113, "the answered offer left as it was")
        newk = [a for a in added if a not in ("1.11", "1.12", "1.13")]
        expect(any(a == "1.111" for a in newk), "the new question at 1.111, beneath dana's answer")
        expect(any(a.startswith("1.111") and len(a) == 6 for a in newk) or any(a.startswith("1.14") and len(a) == 5 for a in newk), "the two new options beneath it")
        expect(handed("thread:1.111", "dana") or handed("thread:1.14", "dana"), "the new place handed to dana's room")
    elif k == "wake":
        expect(rep is not None, "an answer line in the form")
        expect(bool(rep) and rep["tied_at"] == "1.1", "at 1.1, the option taken")
        t = (rep or {}).get("line", "")
        expect(closes(t) and "rook" in t, "it waits on rook")
        expect(len(t) <= 300, "under 300 characters")
    row["expect"] = E
    row["score"] = f"{sum(1 for e in E if e.startswith('ok'))}/{len(E)}"
    row["tied"] = {a: v for a, v in added.items()}
    row["reply_json"] = rep
    return row


if __name__ == "__main__":
    cmd, dname = sys.argv[1], sys.argv[2]
    cases = sys.argv[3].split(",") if len(sys.argv) > 3 else list(CASES)
    if cmd == "setup":
        setup(dname, cases)
    elif cmd == "score":
        rows = [grade(dname, c) for c in cases]
        json.dump(rows, open(os.path.join(RUNS, f"scores-{dname}.json"), "w"), indent=1, ensure_ascii=False)
        for r in rows:
            print(f"{r['run']:8} {r.get('score','-'):5} calls {r.get('calls','-')!s:3} v1 {r.get('form_v1','-')} | p2 {r.get('form_p2','-')}")
            for e in r.get("expect", []):
                if e.startswith("MISS"):
                    print("          " + e)
