#!/usr/bin/env python3
"""thread_form.py: is a thread well formed?  keel, 29 October 2026; set as the
thread-test sentinel's checker by weft (lane threads.3) the same evening.

The mechanical pass of the thread battery, after compound-test's form pass (sentinel
compound-test 4). It reads the registry (spine:thread) and every hand's mirror
(thread:<handle>) and checks each thread against function:thread. keel wrote it for
the registry law of 29 October (v1) and the revisions he proposed for phase 2; at
David's word ('2.1' on thread 2) those revisions are the law (v2, re-cut 29 October
2026 at 17:13Z): every act closes ' · waits on <handle>' or ' · complete' before its
reads, an option never does, and lines are short. A thread opened before the re-cut
is read by the law it was tied under, v1, and what v2 would call a fault there is a
WARN (function:thread 7: threads tied before this law stand as they were tied).

On 3 November 2026 the law was re-cut again, at David's word (v3,
proposals/2026-11-03-threads-without-the-keyword.md): an act is told from an option by
where it stands, never by a closing clause. A line at the thread's number is an act, and
so is a line whose hand holds no act just above it or has a line of its own one digit
beneath it; a hand's other lines beneath its own act are its options. A line that closes
' · waits on <handle>' or ' · complete' is still an act, and no live end must close so.
Every thread opened since v2 is read by v3, so a keyword-free knot tied today on a
thread of phase 2 is no fault; a thread opened before v2 is read by v1, as before.

On 4 November 2026 the endings came back, at David's GO (v4, bsp-mcp
proposals/2026-11-04-threads-keep-their-endings.md): every act ends ' · waits on <handle>',
' · waits on <handle> from <date>' or ' · complete', and an option never does. A thread
opened from the re-cut (V4_SINCE) is read by v2's reading with the date; one opened from
v2 up to it keeps v3, since knots tied on 3 and 4 November carry no ending.

  thread_form.py live [--v1|--phase2|--v3] [--thread N] [--json]   the live beach, by public GET
  thread_form.py state <file.json> [--v1|--phase2|--v3] [--json]   a test beach's state

With no flag each thread is read by the law of its opening (live), or by the law as it
stands, v4 (a test beach, whose registry keeps no stamps). Levels: FAULT breaks the
form; WARN weakens it; NOTE is a reading, not a judgment. A thread with no FAULT is
well formed. proposals/2026-10-29-threads-phase-2.md
"""
import json, re, sys, urllib.request, urllib.parse

BEACH = "https://beach.happyseaurchin.com/.well-known/pscale-beach"
DIGIT = re.compile(r"^[1-9]$")
OPENED = re.compile(r"·\s*opened by\s+([A-Za-z0-9_.\-]+)\s*(?:\(|$|·)")
READS = " · read: "
WAIT_LOOSE = re.compile(r"\bwait(?:s|ing)?\s+(?:on|for)\b|\bcomplete\b", re.I)
# a waiting may be put off to a day, ' · waits on <handle> from 2026-11-07' (proposals/2026-11-04-threads-keep-their-endings.md)
WAIT_CLAUSE = re.compile(r"\s·\s(?:waits on ([A-Za-z0-9_.\-]+(?:(?:,\s*| and )[A-Za-z0-9_.\-]+)*)(?:\s+from\s+\d{4}-\d\d-\d\d)?|(complete))\s*$")
WAITS_ON_ANY = re.compile(r"\bwaits? on ([A-Za-z0-9_.\-]+)", re.I)
WORD_OF = re.compile(r"\bat ([A-Za-z0-9_.\-]+)'s word\b|\bchosen by ([A-Za-z0-9_.\-]+)\b", re.I)
PLACE = re.compile(r"(?<![\w:])thread:(\d+(?:\.\d+)?)\b")   # a place standing on its own, not the tail of archive:ways:thread:2026-11-03
URL = re.compile(r"^https?://\S+$")
ADDR_TOKEN = re.compile(r"^([A-Za-z][A-Za-z0-9_\-]*(?::[A-Za-z0-9_\-.]+)*)(?:\s+(\d+(?:\.\d+)?))?$")
ISO = re.compile(r"\b20\d\d-\d\d-\d\dT\d\d:\d\d")

ACT_MAX, ACT_WARN, OPTION_WARN, REGISTRY_WARN = 600, 300, 120, 200
# function:thread re-cut to v2 (the closing clause is the law): a thread whose
# registry line was stamped before this is read by v1, the law it was tied under.
V2_SINCE = "2026-10-29T17:13:14Z"
# function:thread re-cut with the endings back (4 November 2026, bsp-mcp proposals/2026-11-04-threads-keep-their-endings.md):
# a thread whose registry line was stamped from this is read by its endings again, v2's reading with the date (v4).
V4_SINCE = "2026-11-04T12:13:42Z"


def get(block):
    url = BEACH + "?" + urllib.parse.urlencode({"block": block})
    with urllib.request.urlopen(url, timeout=40) as r:
        return json.load(r)


def get_index():
    req = urllib.request.Request(BEACH, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=40) as r:
        ix = json.load(r)
    b = ix.get("ix", ix).get("blocks", ix.get("blocks", []))
    return [x if isinstance(x, str) else x.get("name") for x in b]


def text_of(node):
    if isinstance(node, str):
        return node
    if isinstance(node, dict) and isinstance(node.get("_"), str):
        return node["_"]
    return None


def addr(path, floor):
    a = "".join(path[:floor]).lstrip("0") or "0"   # a supernested registry keeps 1 to 9 at 01 to 09, written 1 to 9
    return a + ("." + "".join(path[floor:]) if len(path) > floor else "")


def floor_of(b):
    """The depth of a block's underscore chain, as the page reads it (threads.js floorOf)."""
    d, n = 0, b
    while isinstance(n, dict) and "_" in n:
        d, n = d + 1, n["_"]
        if isinstance(n, str):
            return d
    return d


def raised(b, floor):
    """A mirror below the registry's floor, read as the router raises it: wrapped {_: old} until it stands there."""
    while floor_of(b) < floor:
        b = {"_": b}
    return b


def step(node, d):
    """One digit down; a zero walks the underscore, where a supernested block keeps what stood before."""
    return node.get("_" if d == "0" else d) if isinstance(node, dict) else None


def to_path(a, floor):
    whole, _, frac = a.partition(".")
    whole = whole.rjust(floor, "0") if len(whole) < floor else whole
    return list(whole) + list(frac)


class View:
    """The registry, the mirrors and the names the beach knows, from wherever they came."""

    def __init__(self, registry, mirrors, names, floor=1):
        self.registry, self.mirrors, self.names, self.floor = registry, mirrors, set(names), floor
        self.handles = {n.split(":", 1)[1] for n in self.names if n.startswith(("passport:", "shell:", "thread:", "history:", "now:"))}

    @classmethod
    def live(cls):
        names = get_index()
        mirrors = {}
        for n in names:
            if n.startswith("thread:") and n.count(":") == 1:
                try:
                    mirrors[n.split(":", 1)[1]] = get(n)
                except Exception as e:  # a mirror that will not read is itself a finding
                    mirrors[n.split(":", 1)[1]] = {"_": f"(unreadable: {e})"}
        registry = get("spine:thread")
        floor = max(1, floor_of(registry))
        return cls(registry, {h: raised(m, floor) for h, m in mirrors.items()}, names, floor)

    @classmethod
    def state(cls, path):
        s = json.load(open(path))
        names = set(s.get("names", []))
        names |= {"spine:thread"} | {"thread:" + h for h in s["mirrors"]} | set(s.get("blocks", {}))
        names |= {"passport:" + h for h in s.get("hands", [])}
        names |= {"pool:" + r for r in s.get("rooms", {})}
        return cls(s["registry"], s["mirrors"], names, s.get("floor", 1))

    def numbers(self):
        out = []

        def walk(node, path):
            if len(path) == self.floor:
                out.append("".join(path).lstrip("0"))
                return
            if len(path) < self.floor - 1 and isinstance(node.get("_"), dict):
                walk(node["_"], path + ["0"])   # a supernested root keeps 1 to 9 at 01 to 09
            for k in sorted(node):
                if k != "_" and isinstance(node[k], (dict, str)) and DIGIT.match(k):
                    walk(node[k], path + [k]) if isinstance(node[k], dict) or len(path) + 1 == self.floor else None
        walk(self.registry, [])
        return out

    def registry_line(self, n):
        node = self.registry
        for d in to_path(n, self.floor):
            node = step(node, d)
            if node is None:
                return None
        return text_of(node)

    def registry_stamp(self, n):
        """The stamp the beach gave the registry line as it landed (field 3), or ''."""
        node = self.registry
        for d in to_path(n, self.floor):
            node = step(node, d)
            if node is None:
                return ""
        st = node.get("3") if isinstance(node, dict) else None
        return st if isinstance(st, str) and ISO.match(st) else ""

    def lines(self, n):
        """Every hand's lines at thread n and beneath it: (address, hand, text, path)."""
        out, bad = [], []
        for hand, m in sorted(self.mirrors.items()):
            node = m
            for d in to_path(n, self.floor):
                node = step(node, d)
                if node is None:
                    break
            if node is None:
                continue

            def walk(nd, path):
                t = text_of(nd)
                if t is not None:
                    out.append((addr(path, self.floor), hand, t, path))
                if isinstance(nd, dict):
                    for k, v in nd.items():
                        if k == "_":
                            continue
                        if not DIGIT.match(k):
                            bad.append((addr(path, self.floor), hand, k))
                            continue
                        walk(v, path + [k])
            walk(node, to_path(n, self.floor))
        return out, bad

    def orphans(self):
        """Numbers a mirror holds lines under that the registry never opened."""
        reg = set(self.numbers())
        out = []
        for hand, m in self.mirrors.items():
            def walk(nd, path):
                if len(path) == self.floor:
                    if "".join(path).lstrip("0") not in reg:
                        out.append((hand, "".join(path).lstrip("0")))
                    return
                if isinstance(nd, dict):
                    if len(path) < self.floor - 1 and isinstance(nd.get("_"), dict):
                        walk(nd["_"], path + ["0"])
                    for k, v in nd.items():
                        if k != "_" and DIGIT.match(k):
                            walk(v, path + [k])
            walk(m, [])
        return out

    def place_resolves(self, a):
        n = a.split(".")[0][: self.floor] if self.floor > 1 else a.split(".")[0]
        ls, _ = self.lines(n)
        return any(x[0] == a for x in ls)


def body(t):
    """The act's own words: everything before the reads."""
    return t.split(READS)[0]


def reads_of(t):
    if READS not in t:
        return []
    return [r.strip() for r in t.split(READS, 1)[1].split(",") if r.strip()]


def check(view, n, phase2=None):
    """Thread n by the law of its opening (phase2 None), by v3 ("v3"), by v2 (True) or by v1 (False). v4, the endings with
    the date, is v2's reading (True), the law as it stands for a thread opened from V4_SINCE and on a test beach."""
    if phase2 is not None:
        return _check(view, n, phase2)
    st = view.registry_stamp(n)
    if not st or st >= V4_SINCE:
        F, S = _check(view, n, True)
        if S:
            S["law"] = "v4"
        return F, S
    if st >= V2_SINCE:
        F, S = _check(view, n, "v3")
        if S:
            S["law"] = "v3"
        return F, S
    F, S = _check(view, n, False)
    held = {(x["test"], x["at"], x["hand"]) for x in F}
    for x in _check(view, n, True)[0]:
        if x["level"] == "FAULT" and (x["test"], x["at"], x["hand"]) not in held:
            F.append({**x, "level": "WARN", "detail": f"opened before the law of {V2_SINCE[:10]} (v2), under which: {x['detail']}"})
    if S:
        S["law"] = "v1"
    return F, S


def _check(view, n, phase2):
    v3 = phase2 == "v3"
    F = []

    def f(level, test, where, hand, detail):
        F.append({"level": level, "test": test, "at": where, "hand": hand, "detail": detail})

    reg = view.registry_line(n)
    if reg is None:
        f("FAULT", "REGISTERED", n, "", "the registry holds no line at this number")
        return F, {}
    m = OPENED.search(reg)
    opener = m.group(1) if m else ""
    if not m:
        f("FAULT", "OPENED", n, "", "the registry line does not end '· opened by <hand>'")
    if len(reg) > REGISTRY_WARN:
        f("WARN", "SHORT", n, opener, f"the registry line runs {len(reg)} characters; it is the loose end, not the record (function:thread 1)")

    lines, bad = view.lines(n)
    for a, hand, k in bad:
        f("FAULT", "DIGITS", a, hand, f"a key '{k}' beneath a knot; every key is a digit 1-9 or '_', and never a zero position (function:thread 7)")
    by_addr = {}
    for a, hand, t, p in lines:
        by_addr.setdefault(a, []).append((hand, t, p))
    if n not in by_addr:
        f("FAULT", "KNOTTED", n, opener, "no hand has tied a knot at the thread's number; the registry line alone is a loose end")
    elif opener and opener not in [h for h, _, _ in by_addr[n]]:
        f("WARN", "KNOTTED", n, opener, "the opener has no knot at the number; another hand tied the first")

    def parent(a):
        p = to_path(a, view.floor)
        return addr(p[:-1], view.floor) if len(p) > view.floor else None

    def kids(a):
        p = to_path(a, view.floor)
        return sorted({x for x in by_addr if len(to_path(x, view.floor)) == len(p) + 1 and to_path(x, view.floor)[: len(p)] == p}, key=lambda x: to_path(x, view.floor))

    def under(a):
        p = to_path(a, view.floor)
        return [x for x in by_addr if len(to_path(x, view.floor)) > len(p) and to_path(x, view.floor)[: len(p)] == p]

    above = {}

    def is_act(a, t, hand):
        """An act closes on whom it waits on or 'complete' (or carries reads, a word or a time); an option never does.
        A line with its own hand's lines beneath it is a knot whatever its words, since options hang only beneath an act.
        By v3, where it stands decides: an act also where its hand holds no act just above it."""
        if parent(a) is None:
            return True
        b = body(t)
        if v3:
            # beneath another hand's line, or beneath its own option (taken one deeper), a line is an act; beneath its
            # own act it is an option, unless it offers two or more of its own beneath it (a step that went on)
            if WAIT_CLAUSE.search(b):
                return True
            pa = parent(a)
            if (pa, hand) not in above:
                above[(pa, hand)] = any(h == hand and is_act(pa, t2, h) for h, t2, _ in by_addr.get(pa, []))
            return not above[(pa, hand)] or sum(1 for c in kids(a) if hand in [h for h, _, _ in by_addr[c]]) >= 2
        said = WAIT_CLAUSE.search(b) if phase2 else WAIT_LOOSE.search(b)
        if said or READS in t or WORD_OF.search(b) or ISO.search(b):
            return True
        return any(hand in [h for h, _, _ in by_addr[c]] for c in kids(a))

    acts = {(a, h): is_act(a, t, h) for a, hs in by_addr.items() for h, t, _ in hs}

    def knot_hands(a):
        """Whose act stands at a: the hands whose options lie beneath it."""
        return {h for h, t, _ in by_addr.get(a, []) if acts[(a, h)]}

    kinds = {}
    for a, hs in by_addr.items():
        pa = parent(a)
        for hand, t, p in hs:
            if pa is None:
                kinds[(a, hand)] = "knot"
            elif not acts[(a, hand)]:
                kinds[(a, hand)] = "option"
            elif hand in knot_hands(pa) and any(h2 == hand for h2, _, _ in hs):
                kinds[(a, hand)] = "self-taken" if hand in {h for h, t2, _ in by_addr.get(pa, [])} and not any(not acts[(a, h2)] and h2 != hand for h2, _, _ in hs) and hand in knot_hands(pa) else "choice"
            elif any(not acts[(a, h2)] for h2, _, _ in hs):
                kinds[(a, hand)] = "choice"
            else:
                kinds[(a, hand)] = "step"
    for (a, hand), k in list(kinds.items()):
        if k == "option" and not knot_hands(parent(a)):
            f("FAULT", "OFFERED", a, hand, f"an option beneath {parent(a)}, where no act stands to offer it")

    # ROOTED: nothing hangs beneath an empty address
    for a in by_addr:
        pa = parent(a)
        if pa is not None and pa not in by_addr:
            for hand, _, _ in by_addr[a]:
                f("FAULT", "ROOTED", a, hand, f"the line hangs beneath {pa}, where no hand has a line")

    # CONTIGUOUS: the digits beneath a knot run 1..m; a step no option names takes the next free digit
    for a in by_addr:
        ds = sorted(int(to_path(k, view.floor)[-1]) for k in kids(a))
        if ds and ds != list(range(1, len(ds) + 1)):
            missing = sorted(set(range(1, max(ds) + 1)) - set(ds))
            f("FAULT", "CONTIGUOUS", a, "", f"beneath this knot the digits in use are {ds}; {missing} skipped (a step no option names takes the next digit no hand holds there)")

    # each line: length, reads, crossings, words of others
    for a, hs in by_addr.items():
        for hand, t, p in hs:
            k = kinds[(a, hand)]
            b = body(t)
            if k == "option":
                if len(b) > OPTION_WARN:
                    f("WARN", "SHORT", a, hand, f"an option of {len(b)} characters; an option is a possibility in a line, not an account")
            else:
                if len(b) > ACT_MAX:
                    f("FAULT" if phase2 else "WARN", "SHORT", a, hand, f"an act of {len(b)} characters before its reads; the detail belongs at the addresses it read, not in the knot")
                elif len(b) > ACT_WARN:
                    f("WARN", "SHORT", a, hand, f"an act of {len(b)} characters before its reads (keep the knot under {ACT_WARN})")
            if t.count(READS) > 1:
                f("WARN", "READS", a, hand, "' · read: ' appears more than once; the reads ride once, at the end")
            for r in reads_of(t):
                mm = ADDR_TOKEN.match(r)
                if URL.match(r) or PLACE.fullmatch(r) or (mm and mm.group(1) in view.names):
                    continue
                if mm and ":" in mm.group(1):
                    f("WARN", "RESOLVES", a, hand, f"a read names '{r}', which the beach does not hold")
                else:
                    f("WARN", "RESOLVES", a, hand, f"a read '{r}' is not an address (a block, a block and spindle, a thread place or a URL)")
            for pl in PLACE.findall(t):
                if not view.place_resolves(pl):
                    f("FAULT", "CROSSING", a, hand, f"the line names thread:{pl}, where no hand has a line")
            if k != "option":
                for g in WAITS_ON_ANY.findall(b):
                    g = g.rstrip(".,;:")
                    if g.lower() not in {"it", "the", "a", "an", "whoever", "anyone", "nobody", "no"} and g not in view.handles:
                        f("WARN", "ROUTES", a, hand, f"waits on '{g}', which is not a handle on this beach; a waker can ring only a handle")

    # taken, truly: an act stands here, or anything stands beneath
    def taken(a):
        return parent(a) is None or any(acts[(a, h)] for h, _, _ in by_addr[a]) or bool(under(a))

    ends, strands = [], []
    for a in sorted(by_addr, key=lambda x: to_path(x, view.floor)):
        if not taken(a):
            strands.append(a)
            continue
        if not any(taken(c) for c in kids(a)):
            ends.append(a)

    def complete(a):
        """By v3 no word ends a branch: an end is complete only where its acts still close ' · complete'."""
        said = (lambda b: (WAIT_CLAUSE.search(b) or [None, None, None])[2]) if v3 else (lambda b: re.search(r"\bcomplete\b", b, re.I))
        return all(said(body(t)) for h, t, _ in by_addr[a] if acts[(a, h)])
    live = [a for a in ends if not complete(a)]
    done = [a for a in ends if complete(a)]
    for a in ends:
        for h, t, _ in by_addr[a]:
            if not acts[(a, h)] or v3:
                continue
            b = body(t)
            if phase2:
                if not WAIT_CLAUSE.search(b):
                    f("FAULT", "WAITS", a, h, "a live end must close ' · waits on <handle>' or ' · complete'")
            elif not WAIT_LOOSE.search(b):
                f("FAULT", "WAITS", a, h, "a live end that says neither whom it waits on nor that its branch is complete; nobody holds the thread")
    # (keel's TAKEN-MARK and OFFERER emulated /threads as it drew before phase 2, reading the offerer
    # from position; the page now reads taken and offerer by the closing clause, the rule taken() and
    # knot_hands() read here, so the two cannot disagree and the emulation is retired.)
    for a, hs in by_addr.items():
        for h, t, _ in hs:
            if phase2 and not v3 and acts[(a, h)] and kinds[(a, h)] != "knot" and a not in ends and not WAIT_CLAUSE.search(body(t)):
                f("WARN", "WAITS", a, h, "an act with no closing ' · waits on <handle>' or ' · complete'")
    if not view.registry_stamp(n):
        f("NOTE", "TIME", n, "", "the registry line carries no stamp, so when the thread was opened cannot be read; a knot keeps no time by law (function:thread 4)")
    summary = {
        "thread": n, "registry": reg, "opener": opener, "lines": len(lines),
        "hands": sorted({h for _, h, _, _ in lines}), "live": live, "complete": done, "not_taken": strands,
        "kinds": {f"{a} {h}": k for (a, h), k in sorted(kinds.items(), key=lambda x: to_path(x[0][0], view.floor))},
    }
    return F, summary


def report(view, numbers, phase2=None, as_json=False):
    out = []
    for hand, num in view.orphans():
        out.append({"thread": num, "findings": [{"level": "FAULT", "test": "REGISTERED", "at": num, "hand": hand, "detail": "a mirror holds lines under a number the registry never opened"}], "summary": {}})
    for n in numbers:
        F, S = check(view, n, phase2)
        out.append({"thread": n, "findings": F, "summary": S})
    if as_json:
        print(json.dumps(out, indent=1, ensure_ascii=False))
        return out
    for r in out:
        faults = [x for x in r["findings"] if x["level"] == "FAULT"]
        S = r["summary"]
        print(f"thread {r['thread']}: {'WELL FORMED' if not faults else 'NOT WELL FORMED'}"
              + (f" · {S['lines']} lines · hands {', '.join(S['hands'])} · live {', '.join(S['live']) or 'none'} · complete {', '.join(S['complete']) or 'none'} · not taken {', '.join(S['not_taken']) or 'none'}" if S else ""))
        for x in r["findings"]:
            print(f"  {x['level']:5} {x['test']:10} {x['at']:8} {x['hand']:15} {x['detail']}")
    return out


if __name__ == "__main__":
    args = sys.argv[1:]
    phase2 = "v3" if "--v3" in args else True if "--phase2" in args else False if "--v1" in args else None
    as_json = "--json" in args
    only = args[args.index("--thread") + 1] if "--thread" in args else None
    if not args or args[0] not in ("live", "state"):
        print(__doc__)
        sys.exit(2)
    view = View.live() if args[0] == "live" else View.state(args[1])
    nums = [only] if only else view.numbers()
    rows = report(view, nums, phase2, as_json)
    sys.exit(1 if any(x["level"] == "FAULT" for r in rows for x in r["findings"]) else 0)
