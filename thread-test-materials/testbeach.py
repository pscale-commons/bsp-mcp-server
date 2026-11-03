#!/usr/bin/env python3
"""A metered stand-in for the beach's thread surface, for the formation battery.

  testbeach.py <rundir> read <at>                          the one read: pscale_stream_engage(field='thread', at=<at>)
  testbeach.py <rundir> say <at> "<line>" [--option "<o>"]... a knot in your own mirror, options beneath it in one call
  testbeach.py <rundir> open "<content>"                   bsp(block='spine:thread', append=true, content=...): the number
  testbeach.py <rundir> block <name> [<spindle>]           a plain bsp read of any block
  testbeach.py <rundir> room <handle>                      read pool:<handle>
  testbeach.py <rundir> post <handle> "<text>"             a contribution to pool:<handle>

Semantics follow the live router as built (bsp-mcp #559): a read carries the law's section as the
router prints it, its root line naming ways:thread; a say replaces your own line at that
address and keeps what stands beneath it; options land at <at>.1, <at>.2 ... in your own mirror;
an option another hand has answered keeps its words (the say is refused); nothing ever writes
another hand's mirror. Every call is metered to meter.jsonl.
"""
import json, os, re, sys

VALID = re.compile(r"^[1-9][0-9]*(\.[1-9]+)?$")
HERE = os.path.dirname(os.path.abspath(__file__))
# What the router answers with: the law's root line in every read (function:thread as it stands), and a block
# past this size as its disc unless its root is named (tools/bsp.ts probeInsteadOfWhole).
LAW_ROOT = json.load(open(os.path.join(HERE, "teachings", "function-thread.json")))["_"]
WHOLE_CHARS = 6000
# A run set up to meet a thread as a live mind does holds the law's branches and the way as plain blocks.
TAUGHT = {"function:thread": "function-thread.json", "ways:thread": "ways-thread.json"}
# What the router's envelope says of the law and of the way a law names (tools/stream.ts wayHandedOver); smoke:thread
# holds these words and the way's text to what the router prints. A run set up with way_once gets them as a session does:
# whole in its first read or say, and after that that they stand. A run with way_draft is handed that draft of the way.
LAW_FIRST = "# The law — function:thread, this family’s operator: its root line stands here, and its branches at function:thread, read when the law is needed, never to say a line"
LAW_STANDS = "# The law — function:thread, standing as it was given to you earlier in this session (read function:thread to have it whole again)"
WAY_FIRST = "# The way — ways:thread, how a mind carries this family's work; given once in a session"
WAY_STANDS = "# The way — ways:thread, standing as it was given to you earlier in this session (read ways:thread to have it whole again)"


def way_section(draft=None):
    """The way as a read prints it: teachings/way_w2.txt, what stood through the first runs, or the draft a run names."""
    return WAY_FIRST + "\n" + open(os.path.join(HERE, "teachings", f"way_{draft or 'w2'}.txt")).read().strip()


def load(d):
    return json.load(open(os.path.join(d, "state.json")))


def save(d, s):
    json.dump(s, open(os.path.join(d, "state.json"), "w"), indent=1, ensure_ascii=False)


def meter(d, cmd, out):
    with open(os.path.join(d, "meter.jsonl"), "a") as f:
        f.write(json.dumps({"cmd": cmd, "chars": len(out)}) + "\n")


def path(a):
    w, _, fr = a.partition(".")
    return list(w) + list(fr)


def addr(p):
    return p[0] + ("." + "".join(p[1:]) if len(p) > 1 else "")


def text(n):
    return n if isinstance(n, str) else (n.get("_") if isinstance(n, dict) else None)


def node_at(m, p):
    n = m
    for d in p:
        if not isinstance(n, dict) or d not in n:
            return None
        n = n[d]
    return n


def lines_under(s, a):
    p = path(a)
    out = []
    for h, m in sorted(s["mirrors"].items()):
        n = node_at(m, p)
        if n is None:
            continue

        def walk(nd, q):
            t = text(nd)
            if t is not None:
                out.append((q, h, t))
            if isinstance(nd, dict):
                for k in sorted(k for k in nd if k != "_"):
                    walk(nd[k], q + [k])
        walk(n, p)
    out.sort(key=lambda x: ([int(c) for c in x[0]], x[1]))
    return out


def ensure(m, p):
    n = m
    for d in p:
        if d not in n:
            n[d] = {}
        elif isinstance(n[d], str):
            n[d] = {"_": n[d]}
        n = n[d]
    return n


def set_line(m, p, t):
    parent = ensure(m, p[:-1])
    last = p[-1]
    if last in parent and isinstance(parent[last], dict):
        parent[last]["_"] = t
    else:
        parent[last] = t


def answered(s, p, me):
    """Has a hand other than me a line at p, or is anything at all standing beneath p?"""
    for h, m in s["mirrors"].items():
        n = node_at(m, p)
        if n is None:
            continue
        if h != me and text(n) is not None:
            return h
        if isinstance(n, dict) and any(k != "_" for k in n):
            return h
    return None


def law_section(s):
    """The law's section as this read prints it, and the way beside it in a run set up for that."""
    if not s.get("way_once"):
        return [LAW_FIRST, LAW_ROOT]
    law = [LAW_STANDS] if s.get("told_law") else [LAW_FIRST, LAW_ROOT]
    way = [WAY_STANDS] if s.get("told_way") else ["", way_section(s.get("way_draft"))]
    s["told_law"] = s["told_way"] = True
    return law + way


def disc(b):
    """The probe the router answers a block past its size with: every position's opening line, and how to take it whole."""
    clip = lambda t: t if len(t) <= 150 else t[:150] + "..."
    rows = ["[disc @ pscale 0 (depth 1)]"] + [f"  [{'0' if k == '_' else k}]: {clip(text(b[k]) or '')}" for k in ["_"] + sorted(k for k in b if k != "_")]
    size = len(json.dumps(b, ensure_ascii=False, indent=2))
    rows.append(f"  [the whole block is {size} characters: both coordinates omitted gives this probe, the disc at pscale 0. To take it whole, name the root — spindle='0' with no attention; or walk a spindle for the part you need.]")
    return "\n".join(rows)


def main():
    d, cmd, args = sys.argv[1], sys.argv[2], sys.argv[3:]
    s = load(d)
    me = s["me"]
    out = ""
    if cmd == "read":
        a = args[0].replace("thread:", "")
        if not VALID.match(a):
            out = f"refused: '{a}' is not an address (digits, at most one decimal point)"
        else:
            n = a.split(".")[0]
            reg = s["registry"].get(n)
            ls = lines_under(s, a)
            rows = [f"stream:thread — at {a}", "", "# The ladder", f"  p0 [{n}] {reg if reg else '(no thread at this number)'}", "",
                    *law_section(s), "", f"# Readings at {a} — {len({h for _, h, _ in ls})} voices"]
            if s.get("way_once"):
                save(d, s)
            rows += [f"- {addr(q)} · {h}: {t}" for q, h, t in ls] or ["  (no hand has a line at or beneath this address)"]
            out = "\n".join(rows)
    elif cmd == "say":
        a = args[0].replace("thread:", "")
        line, opts, i = None, [], 1
        line = args[1] if len(args) > 1 else ""
        rest = args[2:]
        while rest:
            if rest[0] in ("--option", "-o") and len(rest) > 1:
                opts.append(rest[1]); rest = rest[2:]
            else:
                rest = rest[1:]
        if not VALID.match(a):
            out = f"refused: '{a}' is not an address (digits 1-9, at most one decimal point)"
        elif "0" in a.replace(".", ""):
            out = f"refused: '{a}' names a zero position; a thread's digits run 1 to 9"
        elif a.split(".")[0] not in s["registry"]:
            out = f"refused: no thread {a.split('.')[0]} in spine:thread"
        elif len(opts) > 9:
            out = "refused: at most nine options"
        else:
            m = s["mirrors"].setdefault(me, {})
            p = path(a)
            refused = None
            for k, o in enumerate(opts, 1):
                q = p + [str(k)]
                was = text(node_at(m, q))
                who = answered(s, q, me)
                if who and was is not None and was != o:
                    refused = f"refused: option {k} at {addr(q)} has been answered ({who}); an option keeps its words once another hand has taken it"
                    break
            if refused:
                out = refused
            else:
                prev = text(node_at(m, p))
                set_line(m, p, line)
                for k, o in enumerate(opts, 1):
                    set_line(m, p + [str(k)], o)
                first = s.get("way_once") and not (s.get("told_law") and s.get("told_way"))
                law = law_section(s) if first else []
                save(d, s)
                out = (("\n".join(law) + "\n\n" if law else "") + f"said at {a} in thread:{me}" + (f" (it replaced your earlier line there)" if prev is not None and prev != line else "")
                       + (f"; options at " + ", ".join(addr(p + [str(k)]) for k in range(1, len(opts) + 1)) if opts else "")
                       + "\n\n" + "\n".join(f"- {addr(q)} · {h}: {t}" for q, h, t in lines_under(s, a)))
    elif cmd == "open":
        content = args[0]
        nums = sorted(int(k) for k in s["registry"])
        n = str((nums[-1] + 1) if nums else 1)
        if n == "10":
            out = "refused in this test beach: the tenth thread would raise the floor"
        else:
            s["registry"][n] = content
            way = s.get("way_once") and not s.get("told_way")   # the opening hands it over, as the append's answer does
            if way:
                s["told_way"] = True
            save(d, s)
            out = f"appended to spine:thread at {n}: {content}" + ("\n\n" + way_section(s.get("way_draft")) if way else "")
    elif cmd == "block":
        name = args[0]
        sp = args[1] if len(args) > 1 else None
        if sp is None and " " in name.strip():
            name, sp = name.strip().split(None, 1)
        if name == "spine:thread":
            b = {"_": "THE REGISTRY — one line per thread, in the order threads are opened.", **s["registry"]}
        elif name.startswith("thread:"):
            b = s["mirrors"].get(name.split(":", 1)[1])
        elif name.startswith("pool:"):
            b = {str(i + 1): x for i, x in enumerate(s["rooms"].get(name.split(":", 1)[1], []))}
        else:
            b = s.get("blocks", {}).get(name)
            if b is None and s.get("live") and name in TAUGHT:
                taught = f"ways-thread-{s['way_draft']}.json" if name == "ways:thread" and s.get("way_draft") else TAUGHT[name]
                if name == "function:thread" and s.get("way_draft") in ("s", "s2", "s3", "s4"):   # David's form: the law cut to its root line
                    taught = "function-thread-s.json"
                b = json.load(open(os.path.join(HERE, "teachings", taught)))
        if b is None:
            out = f"no block named {name}"
        elif sp is None and len(json.dumps(b, ensure_ascii=False, indent=2)) > WHOLE_CHARS:
            out = disc(b)
        else:
            if sp and sp != "0":
                b = node_at(b, path(sp)) if VALID.match(sp) else None
            out = json.dumps(b, ensure_ascii=False, indent=1) if b is not None else f"nothing at {sp} in {name}"
    elif cmd == "room":
        h = args[0].replace("pool:", "")
        r = s["rooms"].get(h, [])
        out = f"pool:{h} — {len(r)} contributions\n" + "\n".join(f"{i + 1}. {x}" for i, x in enumerate(r))
    elif cmd == "post":
        h, t = args[0].replace("pool:", ""), args[1]
        s["rooms"].setdefault(h, []).append(f"{me}: {t}")
        save(d, s)
        out = f"contributed to pool:{h} at {len(s['rooms'][h])}"
    else:
        out = "commands: read, say, open, block, room, post"
    meter(d, [cmd] + args, out)
    print(out)


if __name__ == "__main__":
    main()
