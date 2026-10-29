#!/usr/bin/env python3
"""compound-alt.py — the reference compositor: the composition contract, answered by walking.

Chemistry is physics in company, so every operation here is bsp-alt.py's walk
(the reference walker beside the physics battery) applied to blocks read
together, and nothing else: no index, no cache, no second parser. It answers
the four verbs of the compound-test CLI (pscale://compound-test branch 5), and
run-compound-tests.py runs it by default, as run-bsp-tests.py runs bsp-alt.py.

    python3 compound-alt.py align   <compound> <name> <name> [...] [--pscale N]
    python3 compound-alt.py resolve <compound> <reference>
    python3 compound-alt.py law     <compound> <family>
    python3 compound-alt.py compile <compound> <name>[:<address>]

A compound is a folder of blocks, each file its block's name URI-encoded
(spine:tide is spine%3Atide.json, the naming pscale-beach's folder-backed store
uses); another origin's blocks sit in a subfolder named by the encoded origin
(https%3A%2F%2Ffar.test). Output is one JSON object on stdout.
"""
import importlib.util
import json
import os
import re
import sys
from urllib.parse import unquote

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "bsp_alt", os.path.join(HERE, "..", "bsp-test-materials", "bsp-alt.py"))
BSP = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(BSP)


# ── The surface ───────────────────────────────────────────────────────────

def load_surface(folder):
    """A compound folder → (home blocks, {origin: blocks})."""
    home, origins = {}, {}
    for entry in sorted(os.listdir(folder)):
        path = os.path.join(folder, entry)
        if os.path.isdir(path):
            origins[unquote(entry).rstrip("/")] = {
                unquote(f[:-5]): json.load(open(os.path.join(path, f)))
                for f in sorted(os.listdir(path)) if f.endswith(".json")}
        elif entry.endswith(".json"):
            home[unquote(entry[:-5])] = json.load(open(path))
    return home, origins


# ── The reference grammar (whetstone 8.11) ────────────────────────────────

NAME = re.compile(r"^[A-Za-z][A-Za-z0-9_-]*$")
ADDR = re.compile(r"^\d+(\.\d+)?$")
ATT = re.compile(r"^-?\d+$")
STAR = re.compile(r"^\*:(https?://[^\s:]+):(\S+?):([\d.]+)(?::(-?\d+))?$")
WORDS = ("head", "now")


def parse_reference(leaf):
    """name | name:address | name:address:attention | name:head[:attention].

    Attention is absolute pscale; address 0 is the root with the spindle
    omitted. Prose never parses: whitespace, or a segment that is neither a
    name, a digit address, a word nor an attention, is not a reference."""
    if not isinstance(leaf, str):
        return None
    s = leaf.strip()
    if not s or re.search(r"\s", s) or len(s) > 200:
        return None
    parts = s.split(":")
    for i in range(1, len(parts)):
        if parts[i].lower() in WORDS and all(NAME.match(p) for p in parts[:i]):
            rest = parts[i + 1:]
            if len(rest) > 1 or (rest and not ATT.match(rest[0])):
                break
            return {"name": ":".join(parts[:i]), "address": None, "word": parts[i].lower(),
                    "attention": int(rest[0]) if rest else None}
    i, segs = 0, []
    while i < len(parts) and NAME.match(parts[i]):
        segs.append(parts[i])
        i += 1
    if not segs:
        return None
    address = attention = None
    if i < len(parts):
        if not ADDR.match(parts[i]):
            return None
        address = None if parts[i] == "0" else parts[i]
        i += 1
    if i < len(parts):
        if not ATT.match(parts[i]):
            return None
        attention = int(parts[i])
        i += 1
    if i != len(parts):
        return None
    return {"name": ":".join(segs), "address": address, "word": None, "attention": attention}


def parse_star(leaf):
    """*:<origin>:<name>:<address>[:<attention>] — the address anchors as the
    final digit run, so a colon-bearing name (spatial:shore) splits from it."""
    m = STAR.match(leaf.strip()) if isinstance(leaf, str) else None
    if not m:
        return None
    origin, name, address, att = m.groups()
    return {"origin": origin.rstrip("/"), "name": name, "address": address,
            "attention": None if att is None else int(att)}


# ── One walk, delivered at its aperture ───────────────────────────────────

def full_width(digits, floor):
    """A walk as the floor-anchored address a disc prints: the left of the
    decimal padded right to floor width, the rest after the point."""
    left = "".join(digits[:floor]).ljust(floor, "0")
    return left + ("." + "".join(digits[floor:]) if len(digits) > floor else "")


def deliver(block, address, attention):
    """bsp(block, address, attention), carried as the contract's shapes."""
    floor = BSP.floor_depth(block)
    digits = BSP.parse_spindle(address, floor) if address else []
    if digits and BSP.walk(block, digits) is None:
        return {"shape": "absent", "content": None,
                "note": f"nothing stands at {address} — the address walks nowhere"}
    r = BSP.bsp(block, spindle=address, pscale=attention)
    shape = r["shape"]
    if shape == "block":
        return {"shape": "block", "content": block}
    if shape == "disc":
        return {"shape": "disc", "content": [
            {"address": full_width(e["address"].split(","), floor), "walk": e["address"], "text": e["content"]}
            for e in r["entries"]]}
    if shape == "point":
        return {"shape": "point", "content": r["content"]}
    if shape == "path-walk":
        return {"shape": "path-walk", "content": [e["content"] for e in r["entries"]]}
    return {"shape": shape, "content": {
        "walk": [e["content"] for e in r["path_walk"]],
        "descent": [{"walk": e["address"], "text": e["content"]} for e in r["descent"]]}}


def head_address(block):
    """The newest entry of an accumulator: the greatest digit at every level,
    down to the first node carrying an arrival stamp at 3."""
    floor = BSP.floor_depth(block)
    node, digits = block, []
    while isinstance(node, dict):
        if isinstance(node.get("3"), str) and re.match(r"^\d{4}-\d{2}-\d{2}T", node["3"]) and digits:
            break
        kids = sorted(k for k in node if k in "123456789" and len(k) == 1)
        if not kids:
            break
        digits.append(kids[-1])
        node = node[kids[-1]]
    return full_width(digits, floor) if digits else None


def resolve(surface, leaf, seen=()):
    """What a reference delivers — the star in the walk (sunstone 5.2): a point
    whose line is itself a reference is followed, as the kernel's spark follows
    it, to the end of the chain; a reference this walk has already followed
    stays verbatim, so a loop returns. What cannot be reached is named, never
    dropped; an unreachable star-ref rides through as written (whetstone 8.11)."""
    home, origins = surface
    star = parse_star(leaf)
    if star:
        blocks = origins.get(star["origin"])
        block = None if blocks is None else blocks.get(star["name"])
        if block is None:
            return {"shape": "unresolved", "ref": leaf, "origin": star["origin"], "name": star["name"],
                    "content": leaf, "note": "the origin or its block cannot be reached; the reference rides through as written"}
        res = deliver(block, star["address"], star["attention"])
        res.update(ref=leaf, origin=star["origin"], name=star["name"])
        return res
    ref = parse_reference(leaf)
    if ref is None:
        return {"shape": "prose", "ref": leaf, "content": leaf}
    block = home.get(ref["name"])
    if block is None:
        return {"shape": "absent", "ref": leaf, "name": ref["name"], "content": None,
                "note": f"no block {ref['name']} stands at this surface"}
    address = ref["address"]
    if ref["word"] == "head":
        address = head_address(block)
        if address is None:
            return {"shape": "absent", "ref": leaf, "name": ref["name"], "content": None,
                    "note": f"{ref['name']} holds no entries yet"}
    elif ref["word"] == "now":
        return {"shape": "unresolved", "ref": leaf, "name": ref["name"], "content": leaf,
                "note": "the clock word is the host's to compute and is not exercised by this battery"}
    res = deliver(block, address, ref["attention"])
    res.update(ref=leaf, name=ref["name"])
    line = res["content"] if res["shape"] == "point" else None
    if line is not None and line not in seen and (parse_star(line) or parse_reference(line)):
        onward = resolve(surface, line, seen + (line,))
        if onward["shape"] not in ("absent", "unresolved", "prose"):
            onward.update(ref=leaf, followed=line)
            return onward
    return res


# ── A family's law (strata 2.21) ──────────────────────────────────────────

def is_bare_ref(s):
    return isinstance(s, str) and s.strip() != "" and not re.search(r"\s", s.strip()) and len(s.strip()) < 120


def law(surface, family):
    """function:<family>, delivered whole — or, when its underscore is a bare
    reference, the generic law it names, followed a single hop and no further."""
    home, _ = surface
    op_name = f"function:{family}"
    op = home.get(op_name)
    if op is None:
        return {"shape": "absent", "family": family, "operator": op_name, "content": None,
                "note": f"no {op_name} stands, so the family runs no law of its own"}
    root = BSP.collect_underscore(op)
    if is_bare_ref(root):
        mounted = root.strip()
        name, _, branch = mounted.lstrip("*").partition("/")
        target = home.get(name)
        node = target.get(branch) if isinstance(target, dict) and branch else target
        if node is None:
            return {"shape": "unresolved", "family": family, "operator": op_name, "mounted": mounted,
                    "content": mounted, "note": f"{op_name} names {mounted} as its law, and it does not stand here"}
        return {"shape": "law", "family": family, "operator": op_name, "mounted": mounted, "content": node}
    return {"shape": "law", "family": family, "operator": op_name, "mounted": None, "content": op}


# ── A bundle compiled into its window (whetstone 8.12, 8.2) ────────────────

def digit_children(node):
    return [(k, node[k]) for k in "123456789" if isinstance(node, dict) and k in node]


def is_entry(node):
    s = node.get("3") if isinstance(node, dict) else None
    return isinstance(s, str) and re.match(r"^\d{4}-\d{2}-\d{2}T", s) is not None


def slot_leaf(child):
    if isinstance(child, str):
        return child
    if isinstance(child, dict) and isinstance(child.get("_"), str):
        return child["_"]
    return None


def is_reference(leaf):
    return parse_star(leaf) is not None or parse_reference(leaf) is not None


def looks_like_bundle(node):
    """More than half of the non-empty digit children are references, and at
    least one is; an accumulator entry never is, whatever its fields."""
    if not isinstance(node, dict) or is_entry(node):
        return False
    leaves = [slot_leaf(c) for _, c in digit_children(node)]
    leaves = [l for l in leaves if l is not None and l.strip()]
    refs = sum(1 for l in leaves if is_reference(l))
    return refs >= 1 and refs * 2 > len(leaves)


def member(surface, slot, child):
    leaf = slot_leaf(child)
    if leaf is not None and is_reference(leaf):
        m = {"slot": slot, "leaf": leaf, "kind": "reference"}
        m.update({k: v for k, v in resolve(surface, leaf).items() if k != "ref"})
    else:
        m = {"slot": slot, "leaf": leaf, "kind": "prose", "shape": "prose", "content": leaf}
    companions = [member(surface, k, c) for k, c in digit_children(child)] if isinstance(child, dict) else []
    if companions:
        m["members"] = companions
    return m


def compile_bundle(surface, address):
    home, _ = surface
    ref = parse_reference(address)
    block = home.get(ref["name"]) if ref else None
    if block is None:
        return {"shape": "absent", "bundle": address, "note": "no such block stands at this surface"}
    digits = BSP.parse_spindle(ref["address"], BSP.floor_depth(block)) if ref["address"] else []
    node = BSP.walk(block, digits) if digits else block
    if node is None:
        return {"shape": "absent", "bundle": address, "note": f"nothing stands at {ref['address']}"}
    if not looks_like_bundle(node):
        return {"shape": "not-a-bundle", "bundle": address, "content": BSP.semantic(node)}
    members = [member(surface, k, c) for k, c in digit_children(node)]
    if not any(m["kind"] == "reference" and m["shape"] not in ("absent", "unresolved") for m in members):
        return {"shape": "not-a-bundle", "bundle": address, "content": BSP.semantic(node),
                "note": "no member names a block that stands, so the node is a list, not a window"}
    return {"shape": "window", "bundle": address, "members": members}


# ── Blocks laid against the floor (whetstone 7) ───────────────────────────

def deepest(node):
    if not isinstance(node, dict):
        return 0
    return 1 + max([0] + [deepest(node[k]) for k in ["_", *"123456789"] if k in node])


def align(surface, names, pscale=None):
    """Each block's side of the frame is its own disc at that pscale, so the
    alignment adds nothing and drops nothing; the levels run coarse to fine."""
    home, _ = surface
    present = [(n, home[n]) for n in names if n in home]
    missing = [n for n in names if n not in home]
    if len(present) < 2:
        return {"shape": "refused", "missing": missing, "blocks": [n for n, _ in present],
                "note": "alignment needs at least two blocks that stand"}
    index, floors = {}, {}
    for name, block in present:
        floor = floors[name] = BSP.floor_depth(block)
        for depth in range(1, deepest(block) + 1):
            for e in BSP.collect_disc(block, depth):
                index.setdefault(floor - depth, {}).setdefault(name, []).append({
                    "address": full_width(e["address"].split(","), floor), "walk": e["address"], "text": e["content"]})
    levels = sorted(index, reverse=True)
    if pscale is not None:
        levels = [p for p in levels if p == pscale]
    return {"shape": "aligned", "blocks": [{"name": n, "floor": floors[n]} for n, _ in present], "missing": missing,
            "levels": [{"pscale": p, "sides": {n: index[p].get(n, []) for n, _ in present}} for p in levels]}


# ── CLI ────────────────────────────────────────────────────────────────────

def main(argv):
    if len(argv) < 3:
        sys.stderr.write(__doc__)
        return 1
    verb, folder, args = argv[0], argv[1], argv[2:]
    pscale = None
    if "--pscale" in args:
        i = args.index("--pscale")
        pscale = int(args[i + 1])
        args = args[:i] + args[i + 2:]
    surface = load_surface(folder)
    if verb == "align":
        out = align(surface, args, pscale)
    elif verb == "resolve":
        out = resolve(surface, args[0])
    elif verb == "law":
        out = law(surface, args[0])
    elif verb == "compile":
        out = compile_bundle(surface, args[0])
    else:
        sys.stderr.write(f"unknown verb {verb!r}\n")
        return 1
    print(json.dumps(out, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
