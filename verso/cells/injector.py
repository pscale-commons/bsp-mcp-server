"""The injector walk: a cell walks a block rung by rung, one call per rung, before it hears a word.

The block is a pscale block, floor 1: the root "_" is the aim; the rungs stand on the ladder of ones
(rung 1 at 1, rung 2 at 1.1, rung 3 at 1.11 ...); a rung node's "_" is the fork's line, its keys 2 to 7
are the options at that fork, its 8 the rung's hinge, its 1 the next rung. The window at each rung:
the root, the route so far (the cell's own choices, notes and hinges), the options at this fork, the
hinge. The reply: a choice, a note, a hinge. After the last rung the cell holds a spindle. Its unchosen
options become its first held thoughts. Four arms: walked, yoked, neutral, none.
"""
import asyncio, json, os, re, urllib.error, urllib.request

from door import parse_json

SYSTEM = [{"type": "text", "text": "Reply as asked."}]


def child(addr, k):
    return addr + k if "." in addr else addr + "." + k


def load_block(settings, which="injector"):
    """The block to walk and where it came from: the beach (raw JSON) or a file."""
    inj = settings["injector"]
    if which == "neutral":
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), inj["neutral"])
        return json.load(open(path)), inj["neutral"]
    if inj.get("source") == "beach":
        url = f"{settings['beach']}/.well-known/pscale-beach?block={inj['block']}"
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                return json.loads(r.read().decode()), f"beach:{inj['block']}"
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"{inj['block']} is not on the beach ({e.code}); set injector.source to file for the placeholder")
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), inj["file"])
    return json.load(open(path)), inj["file"]


def rungs(block):
    node, addr = block.get("1"), "1"
    while isinstance(node, dict):
        yield addr, node
        node, addr = node.get("1"), child(addr, "1")


def options_of(addr, node):
    out = []
    for k in "234567":
        if k in node:
            v = node[k]
            out.append((child(addr, k), v if isinstance(v, str) else str(v.get("_", ""))))
    return out


def render(root, route, addr, node):
    lines = ["THE ROOT", root, "", "THE ROUTE SO FAR, your own choices with the notes and hinges you left"]
    if route:
        for r in route:
            lines.append(f"  [{r['addr']}]: {r['taken']} Note: {r['note']} Hinge: {r['hinge']}")
    else:
        lines.append("  (none yet: this is the first rung)")
    lines += ["", f"THE RUNG NOW, [{addr}]: {node.get('_', '')}", f"THE OPTIONS, the children of [{addr}]:"]
    opts = options_of(addr, node)
    for a, text in opts:
        lines.append(f"  [{a}]: {text}")
    if node.get("8"):
        lines += ["", f"THE HINGE of this rung, not an option: {node['8']}"]
    lines += ["", 'Reply with only: {"choice": "<the address of the option you take>", "note": "<at most 40 words, kept beside your choice>", '
                  '"hinge": "<the unknown this choice was made under, and what in the talk will resolve it>"}']
    return "\n".join(lines), opts


def pick(obj, opts):
    ch = re.sub(r"[^0-9]", "", str(obj.get("choice", "")))
    digits = [re.sub(r"[^0-9]", "", a) for a, _ in opts]
    if ch in digits:
        return digits.index(ch)
    if len(ch) == 1:
        last = [d[-1] for d in digits]
        if ch in last:
            return last.index(ch)
    return None


async def walk(cid, tier, effort, block, source, door_fn, spend, log, settings):
    """One cell's walk: a spindle of the root and one line per rung, with the unchosen options kept."""
    root = str(block.get("_", ""))
    route, usd, ms = [], 0.0, 0
    for i, (addr, node) in enumerate(rungs(block), 1):
        window, opts = render(root, route, addr, node)
        if not opts:
            break
        taken = None
        for attempt in (1, 2):
            r = await door_fn(tier, effort, SYSTEM, window, int(settings["max_tokens"]), spend, "walk", log,
                              meta={"cell": cid, "rung": i, "addr": addr, "attempt": attempt, "block": source})
            usd += r["usd"]
            ms += r["ms"]
            obj, flag = parse_json(r["reply"]) if r["reply"] else (None, r["error"] or "empty")
            k = pick(obj, opts) if obj else None
            if k is not None:
                taken = dict(rung=i, addr=opts[k][0], fork=node.get("_", ""), taken=opts[k][1], note=str(obj.get("note", "")).strip(),
                             hinge=str(obj.get("hinge", "")).strip(), hinge_q=node.get("8"),
                             unchosen=[(a, t) for j, (a, t) in enumerate(opts) if j != k], ms=r["ms"], usd=round(r["usd"], 6))
                break
            print(f"  walk {cid} rung {i}: retry ({'bad-choice ' + str((obj or {}).get('choice')) if obj else flag} {r.get('error') or ''})", flush=True)
            await asyncio.sleep(2)
        if taken is None:
            print(f"  walk {cid}: stopped at rung {i}", flush=True)
            break
        route.append(taken)
    return dict(cell=cid, tier=tier, effort=effort, block=source, root=root, rungs=route, usd=round(usd, 6), ms=ms)


def spindle_text(sp):
    lines = ["THE RUN-UP, the spindle walked before a word was heard, one rung a choice:", sp["root"]]
    for r in sp["rungs"]:
        lines.append(f"  rung {r['rung']} [{r['addr']}]: {r['taken']} — note: {r['note']} — hinge: {r['hinge']}")
    return "\n".join(lines)


def seeds(sp):
    """The unchosen options of each fork: the cell's first held thoughts, the hinge their horizon."""
    out = []
    for r in sp["rungs"]:
        for a, t in r["unchosen"]:
            out.append(dict(parent=r["fork"], text=t, horizon=r["hinge"] or r["hinge_q"] or "topic", addr=a))
    return out


def twin_spindle(run_dir_from, cid, tier):
    """The yoked arm: a walked spindle of the twin (the same cell in another walk), whole, as text."""
    d = os.path.join(run_dir_from, "spindles")
    if not os.path.isdir(d):
        return None, None
    for name in (f"{cid}.json",) + tuple(f for f in sorted(os.listdir(d)) if f.startswith(tier)) + tuple(sorted(os.listdir(d))):
        p = os.path.join(d, name)
        if os.path.exists(p):
            sp = json.load(open(p))
            return spindle_text(sp), name[:-5]
    return None, None


def latest_walk(runs_dir):
    cands = sorted(d for d in os.listdir(runs_dir) if os.path.isdir(os.path.join(runs_dir, d, "spindles")))
    return os.path.join(runs_dir, cands[-1]) if cands else None
