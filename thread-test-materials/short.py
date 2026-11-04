"""Deliveries S to S4: the nine uses on David's form (lane thread-loom.1, 2 and 3 November 2026;
proposals/2026-11-03-threads-without-the-keyword.md).

The teaching is the six-sentence instruction (S), its seven-sentence mending (S2), or one of its two re-cuts (S3, S4),
handed over as a read hands over the way. The seeds carry no closing clause and no reads clause. Graded by where the line
lands and whether anything is lost, never by a keyword. Written and fixed BEFORE any mind ran, and the same for S and S2.
What counts as right, use by use:

  open   one thread opened; the line at its number; two or more options beneath; a room of wren or dana told, naming the place
  take   the line at 1.1, or one deeper at 1.11; two or more options beneath; dana told, naming the place
  self   the line at 1.31, one deeper than its own option, whose words stand; an option beneath; wren told, naming the place
  word   the line at 1.11, or one deeper at 1.111; no options; no room told
  step   the line at 1.14; dana told, naming the place
  place  the line at 1.12 beside dana's, or at 1.121 beneath it; an option beneath; dana told, naming the place
  twin   the line at 1.1211 or 1.122; an option beneath; dana told, naming the place
  reask  the line at 1.111, or at 1.14; two or more options beneath; dana told, naming the place
  wake   an answer in the form; at 1.1, or one deeper at 1.11; an option beneath it for rook

Every use but wake also: nothing lost, every line that stood at the start stands unchanged in every block.

S3 and S4 (3 November, fixed before either ran) are graded the same, with one widening for both: a hand that already
holds a line where it ties may keep that line's words and add to them, which is David's one knot ('the amendment to the
received option at X and the creation of X-1 options'). So self may also land at 1.3, twin at 1.121 and reask at 1.11,
each only if the line that stood there is still in it; and a line counts as lost only if its words are gone.
'Naming the place' takes the landing address or one of its new options in any spelling (thread:1.31, 1.31, thread 3).
Reported beside the score and not counted: the strict spelling thread:<address>, whether the thread is rooted and its digits
run without a gap, and the cards a page would read from the rooms with no keyword (cards_open below).
Mended after S3 ran: a place followed by a full stop ending its sentence ('pick up at thread:3.') was read as no place, so
the spelling went uncounted in S2's and S3's open, though the page and the waker both read it as thread:3. A place followed
by a second dotted part (thread:1.3.1) still names neither 1.3 nor 1.31. No score moves; the spelling counts are now S 1,
S2 7, S3 6 and S4 4 of the seven minds that told a room (S2's was reported as 6 before the mend).

E1 and E2 (4 November, at David's GO; proposals/2026-11-04-threads-keep-their-endings.md, bsp-mcp #584), the endings back.
E1 is S3's six sentences with one more, 'End your line with whose move is next: ...' (way_e1.txt); E2 is the way of #570,
archive:ways:thread:2026-11-03, with the date added to its step 4 (way_e2.txt). Seeds keep their endings, as they were
tied. Both are graded alike and FIXED BEFORE EITHER RAN: S3's grade (the widening above included), plus, in each of the
nine, one check that the line ends with whose move is next (ENDING below; the wake's answer line too), plus a tenth use,
later: wren cannot review before the harbour's November data comes out on 10 November 2026, so the line lands at 1.3, the
next free digit, or at 1.1, the review it promises; it ends ' · waits on wren from 2026-11-10'; nothing is lost.
THE GATE, fixed with the grade: a delivery goes forward if nothing is lost in any of the ten, the nine score at least 41 of
44, at least eight of the nine threads are well formed by the form pass reading endings (thread_form.py, the law of
29 October with the date), and later ends ' · waits on wren from 2026-11-10'. If both pass, E1 goes forward, as the
shorter way and David's own six sentences; if one passes, that one; if neither, nothing moves and David is told.
"""
import json, re

CLAUSES = re.compile(r"\s·\s(?:read:.*|complete|waits on [^·]*?)(?=\s·\s|$)")


def plain_line(t):
    while True:
        u = CLAUSES.sub("", t)
        if u == t:
            return u
        t = u


def _plain_node(n):
    if isinstance(n, str):
        return plain_line(n)
    return {k: _plain_node(v) for k, v in n.items()}


def plain(s):
    s["mirrors"] = {h: _plain_node(m) for h, m in s["mirrors"].items()}
    s["rooms"] = {h: [x.replace(" waits on your ", " is ready for your ") for x in r] for h, r in s["rooms"].items()}
    return s


SITUATION_S = {"C5": ("waits on dana's decision", "is with dana, for her to decide")}

WAKE_S = """You are kestrel, an agent with no tools: you are woken with a window and you answer with text, which your waker writes for you.

YOUR WINDOW — your waker found a thread handed to you, and compiled it:
thread:1 — the tide-table page · opened by rook
- 1 · rook: built the tide-table page's first draft from last year's tables
- 1.1 · rook: kestrel fetches this month's tide times from the harbour feed
- 1.2 · rook: kestrel reports the feed is down

Your waker also fetched the harbour feed for you: it returned 62 tide times for November, saved at the block tides:feed 11. With them, rook can rebuild the page.

YOUR ANSWER — the knot you tie on the thread, in exactly this form and nothing else on its line:
<address> | <line> | options: 1 <option>; 2 <option>
(write 'options: none' if nothing follows). Then one sentence on why that address."""

EXPECT = {
    "C1": dict(land=None, options=2, told=["wren", "dana"]),
    "C2": dict(land={"1.1", "1.11"}, options=2, told=["dana"]),
    "C3": dict(land={"1.31"}, options=1, told=["wren"]),
    "C4": dict(land={"1.11", "1.111"}, options=0, told=None),
    "C5": dict(land={"1.14"}, options=None, told=["dana"]),
    "C6": dict(land={"1.12", "1.121"}, options=1, told=["dana"]),
    "C7": dict(land={"1.1211", "1.122"}, options=1, told=["dana"]),
    "C8": dict(land={"1.111", "1.14"}, options=2, told=["dana"]),
    "C10": dict(land={"1.3", "1.1"}, options=None, told=False),   # later: E1 and E2 only; a room told or not, as the hand likes
}

# E1 and E2: whose move each line ends on (proposals/2026-11-04-threads-keep-their-endings.md)
ENDING = {"C1": ("waits", {"wren", "dana"}, None), "C2": ("waits", {"dana"}, None), "C3": ("waits", {"wren"}, None),
          "C4": ("complete", None, None), "C5": ("waits", {"dana"}, None), "C6": ("waits", {"dana"}, None),
          "C7": ("waits", {"dana"}, None), "C8": ("waits", {"dana"}, None), "C9": ("waits", {"rook"}, None),
          "C10": ("waits", {"wren"}, "2026-11-10")}
ENDS_ON = re.compile(r"\s·\s(?:waits on ([A-Za-z0-9_.\-]+(?:(?:,\s*|\s+and\s+)[A-Za-z0-9_.\-]+)*)(?:\s+from\s+(\S+))?|(complete))\s*$")


def ending_of(t):
    """(kind, handles, date) of a line's ending, read before its reads; or None when it ends on nothing."""
    m = ENDS_ON.search(str(t or "").split(" · read: ")[0])
    if not m:
        return None
    if m.group(3):
        return ("complete", None, None)
    return ("waits", set(re.split(r",\s*|\s+and\s+", m.group(1))), m.group(2))


def ends_right(t, want):
    got = ending_of(t)
    kind, who, day = want
    if not got or got[0] != kind:
        return False
    return kind == "complete" or (bool(got[1]) and got[1] <= who and got[2] == day)


def ending_said(want):
    kind, who, day = want
    return ("it ends ' · complete'" if kind == "complete" else
            "it ends ' · waits on " + " or ".join(sorted(who)) + (" from " + day if day else "") + "', whose move is next")


AMEND = {"S3", "S4"}
IN_PLACE = {"C3": "1.3", "C7": "1.121", "C8": "1.11"}   # where the hand already holds a line at the place it ties


def norm(t):
    return re.sub(r"\s+", " ", str(t or "").strip().lower()).rstrip(".;:,")


def kept(t, e):
    """The line t that stood is still there in e: unchanged, or its words kept inside the line that replaced it."""
    return t is not None and (e == t or (e is not None and norm(t) in norm(e)))


def digits(a):
    return a.replace(".", "")


def under(a, b):
    return digits(b).startswith(digits(a)) and len(digits(b)) > len(digits(a))


def one_beneath(a, b):
    return under(a, b) and len(digits(b)) == len(digits(a)) + 1


def roots(added):
    return sorted(a for a in added if not any(under(b, a) for b in added))


END = r"(?!\d|\.\d)"   # a full stop may end the sentence (thread:3.); a digit or a second dotted part may not (thread:1.3.1)


def names_place(text, a, strict=False):
    if strict:
        return bool(re.search(r"thread:" + re.escape(a) + END, text))
    if "." not in a:
        return bool(re.search(r"(?i)thread[:\s#]*" + re.escape(a) + END, text))
    return bool(re.search(r"(?<![\d.])" + re.escape(a) + r"(?!\d)", text))


def lines_by_address(s, mirror_lines):
    out = {}
    for h in s["mirrors"]:
        for a, t in mirror_lines(s, h).items():
            out.setdefault(a, {})[h] = t
    return out


def taken(at, k):
    """Read with no keyword: a second hand stands at it, or anything stands beneath it."""
    return len(at.get(k, {})) > 1 or any(under(k, b) for b in at)


def card_open(at, holder, place, handed_by):
    """A place handed to holder is still theirs while no option of it is taken, and either the hand that handed it has offered
    an option there, or the holder has no line at or beneath it."""
    kids = [k for k in at if one_beneath(place, k)]
    if any(taken(at, k) for k in kids):
        return False
    if any(handed_by in at[k] for k in kids):
        return True
    return not any(holder in at[a] for a in at if a == place or under(place, a))


def cards_open(s, mirror_lines):
    at = lines_by_address(s, mirror_lines)
    out = {}
    for h, r in s["rooms"].items():
        for line in r:
            who = line.split(":", 1)[0].strip()
            for p in re.findall(r"(?<![\w:])thread:(\d+(?:\.\d+)?)", line):
                if card_open(at, h, p, who) and p not in out.get(h, []):
                    out.setdefault(h, []).append(p)
    return out


def well_formed(s, mirror_lines, number):
    at = {a: v for a, v in lines_by_address(s, mirror_lines).items() if a == number or a.startswith(number + ".")}
    faults = []
    for a in sorted(at, key=lambda x: (len(digits(x)), x)):
        d = digits(a)
        if len(d) > len(digits(number)):
            par = d[:-1]
            if not any(digits(x) == par for x in at):
                faults.append(f"unrooted {a}")
    for a in list(at) + [number]:
        kids = sorted(int(digits(k)[-1]) for k in at if one_beneath(a, k))
        if kids and kids != list(range(1, len(kids) + 1)):
            faults.append(f"gap beneath {a}")
    return sorted(set(faults))


def grade_s(case, row, c, start, end, added, posts, rep, mirror_lines, amend=False, ending=False):
    E = []

    def expect(ok, what):
        E.append(("ok " if ok else "MISS ") + what)

    me = c["me"]
    a0 = {h: mirror_lines(start, h) for h in start["mirrors"]}
    if amend:
        lost = [f"{h} {a}" for h, ls in a0.items() for a, t in ls.items() if not kept(t, mirror_lines(end, h).get(a))]
    else:
        lost = [f"{h} {a}" for h, ls in a0.items() for a, t in ls.items() if mirror_lines(end, h).get(a) != t]
    R = roots(added)
    row["landed"] = R
    if c["kind"] == "wake":
        expect(rep is not None, "an answer in the form")
        at = (rep or {}).get("tied_at")
        expect(at in ("1.1", "1.11"), "at 1.1, or one deeper")
        opts = (rep or {}).get("options") or []
        expect(any("rook" in o.lower() for o in opts), "an option beneath it for rook")
        if ending:
            expect(ends_right((rep or {}).get("line"), ENDING["C9"]), ending_said(ENDING["C9"]))
        return E, lost, R, []
    x = EXPECT[case]
    land = x["land"]
    reg_new = {k: v for k, v in end["registry"].items() if k not in start["registry"]}
    if case == "C1":
        expect(len(reg_new) == 1, "one thread opened")
        land = set(reg_new)
    here = IN_PLACE.get(case) if amend else None
    held = lambda r: r == here and kept(a0.get(me, {}).get(r), mirror_lines(end, me).get(r))
    expect(bool(R) and all(r in land or held(r) for r in R),
           "the line lands at " + " or ".join(sorted(land)) + (f", or at {here} keeping the words that stood there" if here else ""))
    kids = sorted(a for a in added for r in R if one_beneath(r, a))
    if x["options"] == 0:
        expect(not kids, "no options beneath it")
    elif x["options"]:
        expect(len(kids) >= x["options"], f"{x['options']} or more option(s) beneath it")
    places = R + kids
    if x["told"] is None:
        expect(not posts, "no room told")
    elif x["told"]:
        expect(any(names_place(t, p) for h in x["told"] for t in posts.get(h, []) for p in places), "the next hand's room told, naming the place")
    if ending:
        expect(any(ends_right(mirror_lines(end, me).get(r), ENDING[case]) for r in R), ending_said(ENDING[case]))
    expect(not lost, "nothing lost")
    return E, lost, R, kids
