#!/usr/bin/env python3
"""A metered stand-in for the beach's thread surface, for the formation battery.

  testbeach.py <rundir> read <at>                          the one read: pscale_stream_engage(field='thread', at=<at>)
  testbeach.py <rundir> say <at> "<line>" [--option "<o>"]... a knot in your own mirror, options beneath it in one call
               [--tie "<point>"]...                        and co-knots in its zero, ties=[...] (K2: the router's say, bsp-mcp src/tools/stream.ts)
  testbeach.py <rundir> open "<content>"                   bsp(block='spine:thread', append=true, content=...): the number
  testbeach.py <rundir> block <name> [<spindle>]           a plain bsp read of any block
  testbeach.py <rundir> room <handle>                      read pool:<handle>
  testbeach.py <rundir> post <handle> "<text>"             a contribution to pool:<handle>
  testbeach.py <rundir> tie <A>*<k> "<point>"              bsp(block='thread:<you>', spindle='<A>*<k>', content=...): a co-knot
                                                           in your own line's zero (bsp-mcp proposals/2026-11-13-co-knots.md)

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
    """A line's words: the string its underscore chain reaches; a line holding co-knots keeps them one zero deeper."""
    while isinstance(n, dict):
        n = n.get("_")
    return n if isinstance(n, str) else None


# CO-KNOTS (bsp-mcp proposals/2026-11-13-co-knots.md), as the router reads them (src/cross.ts readTies, tieLines).
TIE = re.compile(r"^(?:([a-z][\w-]*):(\d+(?:\.\d+)?)|([A-Za-z][\w.\-]*(?::[\w.\-]+)*)\s+(\d+(?:\.\d+)?))(?:\s+p(-?\d+))?$")
LEGEND = ("  (⨯ a co-knot: this point tied to a point on another thread or in a block, standing in the line's own zero; pull one "
          "with one read at its point, and tie back from your own line's zero to make it both ways: proposals/2026-11-13-co-knots.md)")


def zero_of(n):
    """The co-knots in a line's zero, as written; a sealed line's zero holds its seal, never co-knots."""
    z = n.get("_") if isinstance(n, dict) else None
    if not isinstance(z, dict) or (isinstance(z.get("9"), dict) and z["9"].get("_") == "gray"):
        return []
    return [text(z[k]).strip() for k in sorted(z) if k in "123456789" and len(k) == 1 and text(z[k]) and text(z[k]).strip()]


def tie_point(raw):
    """(point path, route end path or None) for a co-knot on this beach's threads; a str saying why not, else.
    The test beach's floor is 1, so the pscale p picks depth 1 - p on the spindle."""
    m = TIE.match(raw)
    if not m:
        return "names no point — a co-knot is thread:<spindle> or <block> <spindle>, with p<pscale> for a point on it"
    if m.group(1) and m.group(1) != "thread":
        return f"a point in the {m.group(1)} family: pull it with pscale_stream_engage(field='{m.group(1)}', at='{m.group(2)}')"
    if m.group(3) and not m.group(3).startswith("thread:"):
        return None   # a point in a block: read as a block's
    p = path(m.group(2) or m.group(4))
    if m.group(5) is None:
        return p, None
    depth = 1 - int(m.group(5))
    if depth < 1 or depth > len(p):
        return f"p{m.group(5)} is no point on the spindle {m.group(2) or m.group(4)}"
    return p[:depth], (p if depth < len(p) else None)


def lines_at(s, p):
    """Every hand's line exactly at a point, with its co-knots."""
    out = []
    for h, m in sorted(s["mirrors"].items()):
        n = node_at(m, p)
        if text(n) is not None:
            out.append((h, text(n), zero_of(n)))
    return out


def clip(t):
    return t if len(t) <= 140 else t[:139].rstrip() + "…"


def tie_rows(s, q, ties):
    """A line's co-knots, as the router prints them beneath it."""
    rows = []
    for raw in ties:
        pt = tie_point(raw)
        if isinstance(pt, str):
            rows.append(f"    ⨯ {raw} — {pt}")
            continue
        if pt is None:   # a point in a block
            m = TIE.match(raw)
            b = s.get("blocks", {}).get(m.group(3))
            n = node_at(b, path(m.group(4))) if isinstance(b, dict) else None
            here = [(m.group(3), text(n), zero_of(n))] if text(n) is not None else []
            point = m.group(4)
            end = None
        else:
            here = lines_at(s, pt[0])
            point = addr(pt[0])
            end = pt[1]
        if not here:
            rows.append(f"    ⨯ {raw} — no line stands at {point}")
            continue
        back = any(isinstance(tie_point(r), tuple) and tie_point(r)[0] == q for _, _, zs in here for r in zs)
        hands = ", ".join(dict.fromkeys(h for h, _, _ in here))
        rows.append(f"    ⨯ {raw} — {point} · {hands}: {clip(here[0][1])} · " + ("tied both ways" if back else f"an offer: nothing at {point} ties back yet"))
        if end:
            e = lines_at(s, end)
            between = sum(len(lines_at(s, end[:k])) for k in range(len(pt[0]) + 1, len(end)))
            if e:
                rows.append(f"        → {addr(end)} · {e[0][0]}: {clip(e[0][1])}" + (f" ({between} {'line' if between == 1 else 'lines'} between)" if between else ""))
    return rows


def listing(s, a):
    """The lines at and beneath an address, each with its co-knots, and the co-knots elsewhere that name a point here."""
    ls = lines_under(s, a)
    here = {tuple(q) for q, _, _ in ls}
    rows, shown = [], False
    for q, h, t in ls:
        rows.append(f"- {addr(q)} · {h}: {t}")
        tr = tie_rows(s, q, zero_of(node_at(s["mirrors"][h], q)))
        offered = []
        for oh, m in sorted(s["mirrors"].items()):
            def walk(nd, p):
                if not isinstance(nd, dict):
                    return
                for k in sorted(k for k in nd if k != "_"):
                    c, pk = nd[k], p + [k]
                    for raw in zero_of(c):
                        pt = tie_point(raw)
                        if isinstance(pt, tuple) and pt[0] == q and tuple(pk) != tuple(q):
                            if not any(isinstance(tie_point(r), tuple) and tie_point(r)[0] == pk for r in zero_of(node_at(s["mirrors"][h], q))):
                                offered.append(f"    ⨯ offered from thread:{addr(pk)} · {oh}: {clip(text(c) or '')} · not tied back here")
                    walk(c, pk)
            walk(m, [])
        rows += tr + offered
        shown = shown or bool(tr or offered)
    return rows + ([LEGEND] if shown else [])


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
        n = parent[last]
        while isinstance(n.get("_"), dict):   # a line holding co-knots keeps them: the words move, the zero stays
            n = n["_"]
        n["_"] = t
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


def tie_refusal(s, a, raw):
    """Why a tie said with its knot is refused, or None (K2; bsp-mcp src/cross.ts tieRefusal): it must name a point where
    a line stands, on another thread of this family or in a block this beach holds; never prose, never its own thread."""
    m = TIE.match(raw)
    if not m:
        return ("names no point: a tie is thread:<address> for a point on another thread, or <block> <spindle>, with ' p<pscale>' "
                "after it for a point on a spindle that runs on; never prose")
    if m.group(1) and m.group(1) != "thread":
        return f"names the family {m.group(1)}, and no spine:{m.group(1)} stands on this beach"
    if m.group(3) and not m.group(3).startswith("thread:"):
        b = s.get("blocks", {}).get(m.group(3))
        if not isinstance(b, dict):
            return f"names the block {m.group(3)}, which this beach does not hold"
        if not VALID.match(m.group(4)) or text(node_at(b, path(m.group(4)))) is None:
            return f"names {m.group(3)} {m.group(4)}, where no line stands"
        return None
    pt = tie_point(raw)
    if isinstance(pt, str):
        return pt if pt.startswith("names") else "names no point: " + pt
    if pt[0][0] == path(a)[0]:
        return (f"names a point on this line's own thread, thread:{path(a)[0]}; a co-knot ties to another thread, and this "
                "thread's own knots are already on its route")
    hands = [h for h, _, _ in lines_at(s, pt[0]) if not m.group(3) or m.group(3) == f"thread:{h}"]
    return None if hands else f"names thread:{addr(pt[0])}, where no hand's line stands; tie to a point where a line stands"


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
            rows += listing(s, a) or ["  (no hand has a line at or beneath this address)"]
            out = "\n".join(rows)
    elif cmd == "say":
        a = args[0].replace("thread:", "")
        line, opts, ties = None, [], []
        line = args[1] if len(args) > 1 else ""
        rest = args[2:]
        while rest:
            if rest[0] in ("--option", "-o") and len(rest) > 1:
                opts.append(rest[1]); rest = rest[2:]
            elif rest[0] == "--tie" and len(rest) > 1 and s.get("say_ties"):
                ties.append(rest[1].strip()); rest = rest[2:]
            else:
                rest = rest[1:]
        ties = [t for t in ties if t]
        tie_why = next(((t, w) for t in ties for w in [tie_refusal(s, a, t)] if w), None) if VALID.match(a) else None
        if not VALID.match(a):
            out = f"refused: '{a}' is not an address (digits 1-9, at most one decimal point)"
        elif "0" in a.replace(".", ""):
            out = f"refused: '{a}' names a zero position; a thread's digits run 1 to 9"
        elif a.split(".")[0] not in s["registry"]:
            out = f"refused: no thread {a.split('.')[0]} in spine:thread"
        elif len(opts) > 9:
            out = "refused: at most nine options"
        elif len(ties) > 9:
            out = "refused: at most nine ties"
        elif tie_why:
            out = f"Nothing was written: the tie '{tie_why[0]}' {tie_why[1]}."
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
                n0 = node_at(m, p)
                z0 = n0.get("_") if isinstance(n0, dict) and isinstance(n0.get("_"), dict) else {}
                fresh = [t for t in dict.fromkeys(ties) if t not in zero_of(n0 if isinstance(n0, dict) else {})]
                if len([k for k in "123456789" if k not in z0]) < len(fresh):
                    out = f"Nothing was written: the zero of your line at {a} holds nine co-knots already."
                    meter(d, [cmd] + args, out)
                    print(out)
                    return
                set_line(m, p, line)
                for k, o in enumerate(opts, 1):
                    set_line(m, p + [str(k)], o)
                tied = []
                if ties:   # each tie in the line's zero at the next free digit; what stands is kept, a standing tie not repeated
                    parent = node_at(m, p[:-1]) if len(p) > 1 else m
                    n = parent[p[-1]]
                    if isinstance(n, str):
                        n = parent[p[-1]] = {"_": n}
                    if not isinstance(n.get("_"), dict):
                        n["_"] = {"_": n.get("_")}
                    z = n["_"]
                    for t in dict.fromkeys(ties):
                        k = next((k for k in "123456789" if text(z.get(k)) is not None and text(z[k]).strip() == t), None)
                        if k:
                            tied.append(f"✓ co-knot {t} already stands at {a}*{k}, kept")
                            continue
                        k = next(k for k in "123456789" if k not in z)
                        z[k] = t
                        tied.append(f"✓ co-knot at {a}*{k} → {t}, in your line's zero; whoever holds that point ties back from theirs")
                first = s.get("way_once") and not (s.get("told_law") and s.get("told_way"))
                law = law_section(s) if first else []
                save(d, s)
                out = (("\n".join(law) + "\n\n" if law else "") + f"said at {a} in thread:{me}" + (f" (it replaced your earlier line there)" if prev is not None and prev != line else "")
                       + (f"; options at " + ", ".join(addr(p + [str(k)]) for k in range(1, len(opts) + 1)) if opts else "")
                       + ("\n" + "\n".join(tied) if tied else "")
                       + "\n\n" + "\n".join(listing(s, a)))
    elif cmd == "tie":
        sp = args[0].replace("thread:", "") if args else ""
        content = (args[1] if len(args) > 1 else "").strip()
        a, star, k = sp.partition("*")
        if not star or not VALID.match(a) or not re.fullmatch(r"[1-9]", k):
            out = f"refused: '{sp}' is not <address>*<k> — the address of your own line, a star, and the co-knot's digit 1-9"
        elif not content:
            out = "refused: a co-knot names its partner point, thread:<address>"
        else:
            m = s["mirrors"].setdefault(me, {})
            p = path(a)
            n = node_at(m, p)
            if text(n) is None:
                out = f"refused: no line of yours stands at {a} to hold a co-knot in its zero; tie your knot there first"
            else:
                if isinstance(n, str):
                    n = {"_": n}
                    (node_at(m, p[:-1]) if len(p) > 1 else m)[p[-1]] = n
                if not isinstance(n.get("_"), dict):
                    n["_"] = {"_": n["_"]}
                n["_"][k] = content
                save(d, s)
                out = f"tied a co-knot at {a}*{k} in thread:{me}: {content}\n\n" + "\n".join(listing(s, a))
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
                if name == "function:thread" and s.get("way_draft") in ("s", "s2", "s3", "s4", "e1", "e2", "k1", "k2"):   # David's form, its endings, K1 and K2: the law cut to its root line
                    taught = "function-thread-s.json"
                b = json.load(open(os.path.join(HERE, "teachings", taught)))
        if b is None:
            out = f"no block named {name}"
        elif sp is None and len(json.dumps(b, ensure_ascii=False, indent=2)) > WHOLE_CHARS:
            out = disc(b)
        else:
            star = bool(sp) and sp.endswith("*")
            if star:
                sp = sp[:-1]
            if sp and sp != "0":
                b = node_at(b, path(sp)) if VALID.match(sp) else None
            if star and b is not None:   # the star: a point's zero, its words and its co-knots
                b = b.get("_") if isinstance(b, dict) and isinstance(b.get("_"), dict) else {"_": text(b)}
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
        out = "commands: read, say, open, block, room, post, tie"
    meter(d, [cmd] + args, out)
    print(out)


if __name__ == "__main__":
    main()
