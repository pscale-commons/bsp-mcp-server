"""The injector walk: a cell walks a block rung by rung, one call per rung, before it hears a word.

The block is a pscale block, floor 1: the root "_" is the aim; the rungs stand on the ladder of ones
(rung 1 at 1, rung 2 at 1.1, rung 3 at 1.11 ...); a rung node's "_" is the fork's line, its keys 2 to 7
are the options at that fork, its 8 the rung's hinge, its 1 the next rung. The window at each rung:
the root, the route so far (the options taken, each with the rung's hinge beneath it), the options at
this fork, the hinge. The reply is the choice alone: thin call, fat frame; a note or a hinge asked of
the cell in its own words was reasoning extraction, refused on Opus 5.5 and Sonnet 5.5, so the rung's
hinge is the block's own 8, recorded by the host beside the choice (hinge_q). After the last rung the
cell holds a spindle. Its unchosen options become its first held thoughts, their horizon the hinge.
Four arms: walked, yoked, neutral, none.

THE HEAD of the walk window is the frame — the rules of the table, the same head every loop reads —
then "Reply as asked.". Standing alone, with no word of what it is for, the window was refused on Opus
5.5 and Sonnet 5.5 at rung 3 as cyber (the choice alone asked), and a one-sentence head was refused
at rung 1; under the frame both walked every rung (walk-probe.py, 5 November 2026, $0.10). So a cell
walks the run-up as it listens: under the table's rules. settings.injector.head = "bare" restores
the old head, for comparison only.
"""
import asyncio, json, os, re, urllib.error, urllib.request

from door import parse_json
from frame import frame_text

BARE = [{"type": "text", "text": "Reply as asked."}]
SYSTEM = BARE   # a probe may set this to a head of its own; otherwise head_for(settings) decides
_heads = {}


def head_for(settings):
    """The walk's system blocks: the frame (cached) then 'Reply as asked.'; BARE when injector.head is 'bare'."""
    if settings.get("injector", {}).get("head") == "bare":
        return BARE
    key = (settings["beach"], settings["shell"], settings.get("line_words"), settings.get("router"))
    if key not in _heads:
        _heads[key] = [{"type": "text", "text": frame_text(*key), "cache_control": {"type": "ephemeral"}},
                       {"type": "text", "text": "Reply as asked."}]
    return _heads[key]


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
    lines = ["THE ROOT", root, "", "THE ROUTE SO FAR, the options taken, each with its rung's hinge beneath it"]
    if route:
        for r in route:
            lines.append(f"  [{r['addr']}]: {r['taken']}")
            if r.get("hinge_q"):
                lines.append(f"    {r['hinge_q']}")
    else:
        lines.append("  (none yet: this is the first rung)")
    lines += ["", f"THE RUNG NOW, [{addr}]: {node.get('_', '')}", f"THE OPTIONS, the children of [{addr}]:"]
    opts = options_of(addr, node)
    for a, text in opts:
        lines.append(f"  [{a}]: {text}")
    if node.get("8"):
        lines += ["", f"THE HINGE of this rung, not an option: {node['8']}"]
    lines += ["", 'Reply with only: {"choice": "<the address of the option you take>"}']
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
    head = SYSTEM if SYSTEM is not BARE else head_for(settings)
    for i, (addr, node) in enumerate(rungs(block), 1):
        window, opts = render(root, route, addr, node)
        if not opts:
            break
        taken = None
        for attempt in (1, 2):
            r = await door_fn(tier, effort, head, window, int(settings["max_tokens"]), spend, "walk", log,
                              meta={"cell": cid, "rung": i, "addr": addr, "attempt": attempt, "block": source})
            usd += r["usd"]
            ms += r["ms"]
            obj, flag = parse_json(r["reply"]) if r["reply"] else (None, r["error"] or "empty")
            k = pick(obj, opts) if obj else None
            if k is not None:
                taken = dict(rung=i, addr=opts[k][0], fork=node.get("_", ""), taken=opts[k][1], hinge_q=node.get("8"),
                             unchosen=[(a, t) for j, (a, t) in enumerate(opts) if j != k], ms=r["ms"], usd=round(r["usd"], 6),
                             stop=r["stop"], stop_details=r.get("stop_details"))
                break
            why = ("bad-choice " + str((obj or {}).get("choice"))) if obj else (f"{r['stop']} {(r.get('stop_details') or {}).get('category') or ''}" if r.get("stop") == "refusal" else flag)
            print(f"  walk {cid} rung {i}: retry ({why} {r.get('error') or ''})", flush=True)
            await asyncio.sleep(2)
        if taken is None:
            print(f"  walk {cid}: stopped at rung {i}", flush=True)
            break
        route.append(taken)
    return dict(cell=cid, tier=tier, effort=effort, block=source, root=root, rungs=route, usd=round(usd, 6), ms=ms)


def spindle_text(sp):
    lines = ["THE RUN-UP, the spindle walked before a word was heard, one rung a choice:", sp["root"]]
    for r in sp["rungs"]:
        tail = f" — note: {r['note']} — hinge: {r['hinge']}" if r.get("note") or r.get("hinge") else ""   # spindles of the first form
        lines.append(f"  rung {r['rung']} [{r['addr']}]: {r['taken']}{tail}")
        if r.get("hinge_q"):
            lines.append(f"    {r['hinge_q']}")
    return "\n".join(lines)


def seeds(sp):
    """The unchosen options of each fork: the cell's first held thoughts, the rung's hinge their horizon."""
    out = []
    for r in sp["rungs"]:
        for a, t in r["unchosen"]:
            out.append(dict(parent=r["fork"], text=t, horizon=r.get("hinge_q") or r.get("hinge") or "topic", addr=a))
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
