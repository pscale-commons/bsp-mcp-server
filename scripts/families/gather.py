#!/usr/bin/env python3
"""Read-only: every family shaped like the o-page-unit (function:<name> beside spine:<name>) on the beach.
For each: open or closed from its phase line; who has spoken (mirrors <name>:<handle>, and the room's voices);
and ties to other families (references in spine and law, shared or cross threads, arrangement branches).
Writes JSON for the page. Changes nothing on the beach."""
import importlib.util, json, re, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

import os
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))   # bsp-mcp-server, whose readers it borrows
BEACH = "https://beach.happyseaurchin.com/.well-known/pscale-beach"
UA = "families page (bsp-mcp-server scripts/families, read only)"
OUT = sys.argv[1]


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


tf = load(f"{REPO}/thread-test-materials/thread_form.py", "thread_form")
pf = load(f"{REPO}/proposal-test-materials/proposal_form.py", "proposal_form")


def get(name):
    url = BEACH + "?" + urllib.parse.urlencode({"block": name})
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                b = json.load(r)
            if isinstance(b, dict) and b.get("code") == "not_found":
                return None
            return b
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(1 + attempt)
        except Exception:
            time.sleep(1 + attempt)
    return None


def strings(node, out):
    if isinstance(node, str):
        out.append(node)
    elif isinstance(node, dict):
        for v in node.values():
            strings(v, out)
    return out


def text_at(law, d):
    if not isinstance(law, dict):
        return ""
    v = law.get(d)
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        u = v.get("_")
        while isinstance(u, dict):
            u = u.get("_")
        return u if isinstance(u, str) else ""
    return ""


names = tf.get_index()
nameset = set(names)
families = sorted(n[len("function:"):] for n in names
                  if n.startswith("function:") and ":" not in n[len("function:"):] and ("spine:" + n[len("function:"):]) in nameset)
famset = set(families)
handles = {n.split(":", 1)[1] for n in names if n.startswith("passport:") and n.count(":") == 1}

# the list, with each family's semantic number (its address in proposals)
plist = get("proposals")
slots = {}


def walk_list(node, path, floor):
    if len(path) == floor:
        t = node if isinstance(node, str) else (node.get("_") if isinstance(node, dict) else "")
        if isinstance(t, dict):
            t = t.get("_", "")
        m = re.match(r"^\s*\(?\s*([a-z0-9][a-z0-9-]*)\s*—\s*([\s\S]*?)(?:\s*·\s*(\S+))?\s*$", t or "", re.I)
        if m:
            slots[m.group(1).lower()] = {"slot": "".join(path), "line": t.strip(), "withdrawn": t.strip().startswith("(")}
        return
    if isinstance(node, dict):
        for k in sorted(node):
            if k == "_" and isinstance(node[k], dict) and len(path) < floor - 1:
                walk_list(node[k], path + ["0"], floor)
            elif k.isdigit() and k != "0":
                walk_list(node[k], path + [k], floor)


walk_list(plist, [], pf.floor_of(plist))

# read every law, spine and room
with ThreadPoolExecutor(max_workers=6) as ex:
    laws = dict(zip(families, ex.map(lambda n: get("function:" + n), families)))
    spines = dict(zip(families, ex.map(lambda n: get("spine:" + n), families)))

rooms = {}
for n in families:
    t3 = text_at(laws[n], "3")
    m = re.search(r"\bpool:([A-Za-z0-9_-]+)", t3)
    room = m.group(1) if m else n
    if "pool:" + room not in nameset:
        room = n if "pool:" + n in nameset else None
    rooms[n] = room
with ThreadPoolExecutor(max_workers=6) as ex:
    pools = dict(zip(families, ex.map(lambda n: get("pool:" + rooms[n]) if rooms[n] else None, families)))


def room_voices(pool):
    """Authors of the room's entries: field 1 of each entry (an agent id), or unnamed."""
    named, unnamed, entries = {}, 0, 0
    if not isinstance(pool, dict):
        return named, unnamed, entries

    def go(node, depth):
        nonlocal unnamed, entries
        if not isinstance(node, dict):
            return
        for k, v in node.items():
            if k == "_":
                if isinstance(v, dict):
                    go(v, depth)
                continue
            if not (k.isdigit() and k != "0") or not isinstance(v, dict):
                continue
            body = v.get("_")
            a = v.get("1") if isinstance(v.get("1"), str) else None
            if isinstance(body, str) and (a is not None or isinstance(v.get("3"), str)):
                entries += 1
                h = (a or "").strip()
                h = re.sub(r"^https?://[^/]+/?", "", h)
                h = h.split(":")[-1] if h.startswith(("sed:", "grain:")) else h
                if h:
                    named[h] = named.get(h, 0) + 1
                else:
                    unnamed += 1
            go(v, depth + 1)
    go(pool, 0)
    return named, unnamed, entries


# the thread view, for cross-threads
view = tf.View.live()
thread_numbers = view.numbers()


def mentions(text, self_name=None):
    """Families a text names: prefixed always, bare only when the name is hyphenated (distinctive)."""
    found = {}
    for m in re.finditer(r"(?:spine|function|pool|files|look|archive:spine)[:]([a-z0-9][a-z0-9-]*[a-z0-9])(?![\w-])", text):
        f = m.group(1)
        if f in famset:
            found[f] = found.get(f, 0) + 1
    for m in re.finditer(r"(?:/proposal/|/walk/|happyseaurchin\.com/)([a-z0-9][a-z0-9-]*[a-z0-9])(?![\w-])", text):
        f = m.group(1)
        if f in famset:
            found[f] = found.get(f, 0) + 1
    for m in re.finditer(r"(?<![\w:/.-])([a-z0-9]+(?:-[a-z0-9]+)+)(?![\w-])", text):
        f = m.group(1)
        if f in famset:
            found[f] = found.get(f, 0) + 1
    for m in re.finditer(r"(?<![\w:/.-])([a-z0-9][a-z0-9-]*):([A-Za-z][A-Za-z0-9_.-]*)", text):
        f, h = m.group(1), m.group(2)
        if f in famset and h in handles and f != "thread":
            found[f] = found.get(f, 0) + 1
    if self_name:
        found.pop(self_name, None)
    return found


rows = {}
for n in families:
    law, spine = laws[n], spines[n]
    phase = ""
    for d in "7123456789":
        t = text_at(law, d)
        if re.match(r"^\s*phase:", t, re.I):
            phase = t.strip()
            break
    closed = bool(re.match(r"^\s*phase:\s*(complete|set aside|withdrawn)\b", phase, re.I))
    if n in slots and slots[n]["withdrawn"]:
        closed = True
    mirrors = sorted(n2.split(":", 1)[1] for n2 in names
                     if n2.startswith(n + ":") and n2.count(":") == 1 and n2.split(":", 1)[1] in handles)
    named, unnamed, entries = room_voices(pools[n])
    corpus = "\n".join(strings(spine, []) + strings(law, []))
    root_line = ""
    if isinstance(spine, dict):
        u = spine.get("_")
        while isinstance(u, dict):
            u = u.get("_")
        root_line = u if isinstance(u, str) else ""
    threads_named = []
    node5 = pf.threads_node(law)
    if isinstance(node5, dict):
        for k in pf.DIGITS:
            if k in node5:
                th = pf.parse_thread(pf.voice(node5[k]) or (node5[k] if isinstance(node5[k], str) else ""))
                if th and th["registry"]:
                    threads_named.append(th["registry"])
    page = ""
    for d in "6123456789":
        mm = re.search(r"\bpage:\s*(https?://\S+)", text_at(law, d), re.I)
        if mm:
            page = re.sub(r"[.,;)]+$", "", mm.group(1))
            break
    rows[n] = {"name": n, "slot": slots.get(n, {}).get("slot", ""), "listed": n in slots,
               "listline": slots.get(n, {}).get("line", ""), "phase": phase, "closed": closed,
               "mirrors": mirrors, "room": rooms[n], "room_named": named, "room_unnamed": unnamed, "room_entries": entries,
               "refs": mentions(corpus, n), "threads": threads_named, "root": root_line[:400], "page": page,
               "pv": re.sub(r"^\s*PROVENANCE\s*[—:-]?\s*", "", text_at(law, "9"))[:320]}

# cross-threads: every registry thread's lines, the families each names, plus families naming it at their 5
thread_fams = {}
for T in thread_numbers:
    lines, _ = view.lines(T)
    text = (view.registry_line(T) or "") + "\n" + "\n".join(t for (_, _, t, _) in lines)
    fs = set(mentions(text))
    fs |= {n for n in families if T in rows[n]["threads"]}
    thread_fams[T] = sorted(fs)

# the arrangements: same top branch, by each person who keeps one
arrangements = {}
for a in [x for x in names if x.startswith("arrangement:")]:
    h = a.split(":", 1)[1]
    b = get(a)
    branches = []

    def collect(node):
        out = []
        if isinstance(node, dict):
            t = node.get("_")
            while isinstance(t, dict):
                t = t.get("_")
            if isinstance(t, str):
                m = re.match(r"^\s*([a-z0-9][a-z0-9-]*)", t)
                if m:
                    out.append(m.group(1))
            for k in sorted(node):
                if k.isdigit() and k != "0":
                    out += collect(node[k])
        elif isinstance(node, str):
            m = re.match(r"^\s*([a-z0-9][a-z0-9-]*)", node)
            if m:
                out.append(m.group(1))
        return out

    def tree(node):
        t = node.get("_") if isinstance(node, dict) else node
        while isinstance(t, dict):
            t = t.get("_")
        m = re.match(r"^\s*([a-z0-9][a-z0-9-]*)", t or "")
        kids = [tree(node[k]) for k in sorted(node) if isinstance(node, dict) and k.isdigit() and k != "0"] if isinstance(node, dict) else []
        return {"name": m.group(1) if m else "", "kids": kids}

    if isinstance(b, dict):
        for k in sorted(b):
            if k.isdigit() and k != "0":
                branches.append(collect(b[k]))
        arrangements[h] = {"branches": branches, "tree": [tree(b[k]) for k in sorted(b) if k.isdigit() and k != "0"]}

# ties
ties = {}


def tie(a, b, kind, detail, w):
    if a == b or a not in famset or b not in famset:
        return
    key = tuple(sorted((a, b)))
    t = ties.setdefault(key, {"a": key[0], "b": key[1], "refs": {}, "threads": [], "arranged": [], "score": 0})
    if kind == "ref":
        t["refs"][detail[0]] = detail[1]
    elif kind == "thread":
        if detail not in t["threads"]:
            t["threads"].append(detail)
    elif kind == "arranged":
        if detail not in t["arranged"]:
            t["arranged"].append(detail)


for n, r in rows.items():
    for m, c in r["refs"].items():
        tie(n, m, "ref", (n, c), 0)
for T, fs in thread_fams.items():
    if len(fs) > 12:  # a thread that names a dozen families is a crossroads, not a tie
        continue
    for i, a in enumerate(fs):
        for b in fs[i + 1:]:
            tie(a, b, "thread", T, 0)
for h, ar in arrangements.items():
    for br in ar["branches"]:
        fs = [x for x in dict.fromkeys(br) if x in famset]
        for i, a in enumerate(fs):
            for b in fs[i + 1:]:
                tie(a, b, "arranged", h, 0)

# how often each family is named: hubs (the thread law, the clock) are named by everything and tell little
named_by = {}
for n, r in rows.items():
    for m in r["refs"]:
        named_by[m] = named_by.get(m, 0) + 1
for t in ties.values():
    ref_part = sum(min(c, 3) for c in t["refs"].values())
    hub = max(named_by.get(t["a"], 0), named_by.get(t["b"], 0))
    if hub > 25 and not t["threads"] and not t["arranged"]:
        ref_part = min(ref_part, 1)
    t["score"] = ref_part + 2 * len(t["threads"]) + 3 * len(t["arranged"])

json.dump({"read_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "families": rows, "ties": list(ties.values()),
           "thread_fams": thread_fams, "arrangements": arrangements, "named_by": named_by,
           "handles_seen": sorted({h for r in rows.values() for h in list(r["mirrors"]) + list(r["room_named"])})},
          open(OUT, "w"), indent=1, ensure_ascii=False)
print("families", len(rows), "closed", sum(1 for r in rows.values() if r["closed"]), "ties", len(ties))
print("hubs", sorted(named_by.items(), key=lambda x: -x[1])[:12])
print("handles seen", len({h for r in rows.values() for h in list(r['mirrors']) + list(r['room_named'])}))
