#!/usr/bin/env python3
"""families.json (gather.py's read) -> the families page, its data inlined into page.template.html. Read only.

  python3 gather.py <families.json>          read the beach (a minute or two)
  python3 build.py <families.json> <out.html>  write the page, e.g. happyseaurchin-home's families.html
"""
import json, re, sys

import os
HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(sys.argv[1]))
F = d["families"]

PEOPLE = {"happyseaurchin", "Phenomemental", "Davido", "happyhedgehog", "Mark", "MarkBeall", "Mark Beall", "emojisword",
          "Alex", "Duke", "Dwayne", "JT", "bipolarcoach", "ian", "Stacey", "syn"}
AIS = {"weft", "keel", "limner", "tidewright", "neptune", "Ada", "clapper", "redshank", "Dorylus", "dunlin", "plover",
       "relay", "sandpiper", "egg-one", "cowrie", "tuichan", "janus", "computer", "Claude", "trial-hand-c", "trial-hand-d",
       "trial-millbrook-a", "trial-millbrook-b", "fd-trial-door"}
CHARACTERS = {"Astrel", "Orik"}
JUNK = {"2", "zero-table", "colour", "person"}


def norm(h):
    h = h.strip()
    m = re.match(r"^(.*?),\s*a visitor$", h)
    if m:
        h = m.group(1)
    if h.startswith("Claude, for"):
        return "Claude"
    if h == "Mark Beall":
        return "MarkBeall"
    if h.startswith("trial-sundial"):
        return "trial-hand"
    return h


def is_anon(h):
    return h == "a visitor" or bool(re.match(r"^[0-9a-f]{32,}$", h)) or h.startswith("anon-")


out = []
for n, r in F.items():
    people, ais, chars, unnamed = set(), set(), set(), 0
    for h in r["mirrors"]:
        h = norm(h)
        (people if h in PEOPLE else ais if (h in AIS or h.startswith("trial")) else chars if h in CHARACTERS else people).add(h)
    for h0, k in r["room_named"].items():
        h = norm(h0)
        if h in JUNK or len(h) > 40 or " " in h and h not in PEOPLE:
            continue
        if is_anon(h):
            unnamed += k
        elif h in PEOPLE:
            people.add(h)
        elif h in AIS or h.startswith("trial"):
            ais.add(h)
        elif h in CHARACTERS:
            chars.add(h)
    unnamed += r["room_unnamed"]
    # the zero table names its seats: a 'person' seat's line is the person's handle
    if n == "zero":
        people |= {"Phenomemental", "Davido"}
        ais.add("computer")
    voice = "person" if (people or unnamed) else "ai" if ais else "none"
    phase = r["phase"]
    closed = bool(re.match(r"^\s*phase:\s*(complete|set aside)\b", phase, re.I))
    out.append({"n": n, "s": r["slot"], "c": closed, "ph": phase[:260], "p": sorted(people), "a": sorted(ais),
                "ch": sorted(chars), "u": unnamed, "v": voice, "rm": r["room"] or "", "re": r["room_entries"],
                "pg": r["page"], "ln": re.sub(r"^\(?\s*[a-z0-9-]+\s*—\s*", "", r["listline"])[:200],
                "rt": r["root"][:240], "wd": r["listline"].startswith("("), "pv": r.get("pv", "")[:260]})

# ties: the thread law is the medium every carried piece of work runs on, never a neighbour by thread
ties = []
for t in d["ties"]:
    if "thread" in (t["a"], t["b"]):
        t["threads"] = []
    named_by = d["named_by"]
    ref_part = sum(min(c, 3) for c in t["refs"].values())
    hub = max(named_by.get(t["a"], 0), named_by.get(t["b"], 0))
    if hub > 25 and not t["threads"] and not t["arranged"]:
        ref_part = min(ref_part, 1)
    t["score"] = ref_part + 2 * len(t["threads"]) + 3 * len(t["arranged"])
    if t["score"] >= 2:
        ties.append({"a": t["a"], "b": t["b"], "s": t["score"], "r": t["refs"], "t": t["threads"], "g": t["arranged"]})
ties.sort(key=lambda t: -t["s"])

order = sorted([x for x in out if x["s"]], key=lambda x: int(x["s"])) + sorted([x for x in out if not x["s"]], key=lambda x: x["n"])
data = {"at": d["read_at"], "fams": order, "ties": ties, "arr": d["arrangements"]}
HEAD = ('<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<meta name="description" content="Every family on the beach with a law and a spine, open or closed, who has spoken in it and which families sit closest: a snapshot read from the beach.">\n'
        '<link rel="canonical" href="https://happyseaurchin.com/families">\n')
html = HEAD + open(f"{HERE}/page.template.html").read().replace("/*DATA*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
open(sys.argv[2], "w").write(html)
cnt = lambda f: sum(1 for x in out if f(x))
print("families", len(out), "closed", cnt(lambda x: x["c"]), "person", cnt(lambda x: x["v"] == "person"),
      "ai", cnt(lambda x: x["v"] == "ai"), "none", cnt(lambda x: x["v"] == "none"), "listed", cnt(lambda x: x["s"]), "ties", len(ties))
print("listed by voice:", {v: cnt(lambda x, v=v: x["s"] and x["v"] == v) for v in ("person", "ai", "none")})
print("listed AI-only:", [x["n"] for x in order if x["s"] and x["v"] == "ai"])
print("listed no one:", [x["n"] for x in order if x["s"] and x["v"] == "none"])
print("bytes", len(html))
