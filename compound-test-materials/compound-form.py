#!/usr/bin/env python3
"""compound-form.py — the mechanical pass over a compound (pscale://compound-test branch 4).

A compound has no walker, so nothing rejects a malformed molecule (grips 7):
a door degrades past a bad bond by law, and the fault lands silently. This
program reads a compound and reports each bond that is malformed, against
three predicates, and each proposal standing in a mirror:

  resolves   every reference resolves — no address in content, in a bundle,
             at an operator's mount or in a pool's directive walks nowhere
  direction  content carries no operator pointer, and a generic law carries
             no content address (block-conventions 8.81, whetstone 8.3)
  law        a family stands when its law stands: spine:V has function:V
             (block-conventions 8.83)
  proposal   (never a fault) a mirror line at an address its spine does not
             voice — proposal-by-mirror (tree 5.1), awaiting adoption

    python3 compound-form.py <compound>
    python3 compound-form.py --beach <origin> --family <V> [--family <W> ...]

The first reads a compound folder (the CLI's form, branch 6); the second reads
a live family's blocks from a beach by public GET, and every block its
references name. Sentinels resolve from ../src, as the router serves them to
every surface. Output is one JSON object on stdout; exit 0 whatever is found.
"""
import importlib.util
import json
import os
import re
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("compound_alt", os.path.join(HERE, "compound-alt.py"))
A = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(A)
BSP = A.BSP
SENTINELS = os.path.join(HERE, "..", "src")
CLOCK_FLOOR = 10


class Surface:
    """Blocks by name at one origin, and by name at any other: a compound
    folder, or a beach read by public GET (each block fetched once)."""

    def __init__(self, folder=None, beach=None):
        self.beach = beach.rstrip("/") if beach else None
        self.home, self.origins, self.fetched = ({}, {}, {})
        if folder:
            self.home, self.origins = A.load_surface(folder)

    def _fetch(self, origin, name):
        key = (origin, name)
        if key not in self.fetched:
            url = f"{origin}/.well-known/pscale-beach?block={urllib.parse.quote(name, safe='')}"
            try:
                with urllib.request.urlopen(url, timeout=20) as r:
                    body = json.loads(r.read().decode("utf8"))
                self.fetched[key] = None if isinstance(body, dict) and body.get("code") == "not_found" else body
            except Exception:
                self.fetched[key] = None
        return self.fetched[key]

    def sentinel(self, name):
        path = os.path.join(SENTINELS, name + ".json")
        return json.load(open(path)) if re.match(r"^[a-z][a-z0-9-]*$", name) and os.path.exists(path) else None

    def get(self, name):
        if name.startswith("pscale:"):
            return self.sentinel(name[len("pscale:"):])
        if name in self.home:
            return self.home[name]
        if self.beach:
            b = self._fetch(self.beach, name)
            if b is not None:
                return b
        return self.sentinel(name)

    def origin(self, origin, name):
        if self.beach and origin == self.beach:
            return self.get(name)
        if origin in self.origins:
            return self.origins[origin].get(name)
        return self._fetch(origin, name) if self.beach else None

    def index(self):
        if not self.beach:
            return sorted(self.home)
        try:
            with urllib.request.urlopen(f"{self.beach}/.well-known/pscale-beach", timeout=20) as r:
                return sorted(json.loads(r.read().decode("utf8")).get("blocks", []))
        except Exception:
            return []


# ── where a leaf stands, and whether it is a reference there ──────────────

def parse_mount(leaf):
    """An operator's mount or a pool's directive: [*]<block>[/<branch>]."""
    if not A.is_bare_ref(leaf):
        return None
    name, _, branch = leaf.strip().lstrip("*").partition("/")
    return {"name": name, "branch": branch or None} if A.NAME.match(name.split(":")[0]) else None


def at(walk, floor):
    return A.full_width(walk, floor) if walk else "0"


def is_bundle(surface, node):
    """A bundle by form (compound-alt.py's rule), settled by resolution: at
    least one slot names a block that stands, or a list of words would pass."""
    if not A.looks_like_bundle(node):
        return False
    for _, child in A.digit_children(node):
        leaf = A.slot_leaf(child)
        if leaf and A.is_reference(leaf) and unresolved(surface, "bundle", leaf) is None:
            return True
    return False


def references(surface, name, block):
    """Every leaf of a block that is a reference by its position: an
    operator's mount, a pool's directive, a slot of a node that is a bundle,
    a leaf carrying an address, an attention, a word or the star form, or a
    bare name that stands at the surface. An accumulator entry's fields are
    data, and prose is prose."""
    floor = BSP.floor_depth(block)
    out = []
    root = BSP.collect_underscore(block)
    if name.startswith("function:") and parse_mount(root):
        out.append(("mount", "0", root))
    if name.startswith("pool:") and isinstance(block.get("_") if isinstance(block, dict) else None, str) and parse_mount(block["_"]):
        out.append(("directive", "0", block["_"]))

    def visit(node, walk, in_bundle):
        if isinstance(node, str):
            if not walk or all(d == "0" for d in walk):
                return  # the root voicing, handled above as a mount or a directive
            ref = A.parse_reference(node)
            if A.parse_star(node) or (ref and (in_bundle or ref["address"] or ref["attention"] is not None
                                               or ref["word"] or surface.get(ref["name"]) is not None)):
                out.append(("bundle" if in_bundle else "content", at(walk, floor), node))
            return
        if not isinstance(node, dict) or A.is_entry(node):
            return
        bundle = is_bundle(surface, node)
        for k in ["_", *"123456789"]:
            if k in node:
                visit(node[k], walk + ["0" if k == "_" else k], bundle and k != "_")
                if bundle and k != "_" and isinstance(node[k], dict) and isinstance(node[k].get("_"), str):
                    visit(node[k]["_"], walk + [k], True)
    visit(block, [], False)
    # A slot object's voicing was visited twice (as its own underscore and as
    # the slot); keep one, the slot.
    seen, unique = set(), []
    for kind, addr, leaf in sorted(out, key=lambda r: r[0] != "bundle"):
        if (addr, leaf) not in seen:
            seen.add((addr, leaf))
            unique.append((kind, addr, leaf))
    return unique


def unresolved(surface, kind, leaf):
    """Why a reference does not resolve, or None when it does."""
    star = A.parse_star(leaf)
    if star:
        block = surface.origin(star["origin"], star["name"])
        if block is None:
            return f"names {star['name']} at {star['origin']}, which does not stand there"
        return walks(block, star["name"], star["address"])
    if kind in ("mount", "directive"):
        m = parse_mount(leaf)
        block = surface.get(m["name"])
        if block is None:
            return f"names {m['name']}, which does not stand at this surface"
        if m["branch"] and m["branch"] not in block:
            return f"names branch {m['branch']} of {m['name']}, which does not stand"
        return None
    ref = A.parse_reference(leaf)
    block = surface.get(ref["name"])
    if block is None:
        return f"names {ref['name']}, which does not stand at this surface"
    if ref["word"] == "head" and A.head_address(block) is None:
        return f"names the head of {ref['name']}, which holds no entries"
    return walks(block, ref["name"], ref["address"]) if ref["address"] else None


def walks(block, name, address):
    try:
        digits = BSP.parse_spindle(address, BSP.floor_depth(block))
    except BSP.InvalidAddressError as e:
        return f"{address} is not an address of {name}: {e}"
    return None if BSP.walk(block, digits) is not None else f"{address} walks nowhere in {name}"


def target_name(kind, leaf):
    star = A.parse_star(leaf)
    if star:
        return star["name"]
    if kind in ("mount", "directive"):
        return parse_mount(leaf)["name"]
    return A.parse_reference(leaf)["name"]


# ── the pass ──────────────────────────────────────────────────────────────

def check(surface, families=None):
    names = surface.index()
    if families is None:
        families = sorted(n[len("spine:"):] for n in names if n.startswith("spine:"))
    family_blocks = {}
    for v in families:
        mirrors = sorted(n for n in names if n.startswith(v + ":") and ":" not in n[len(v) + 1:])
        family_blocks[v] = {"spine": f"spine:{v}", "law": f"function:{v}", "fold": v, "pool": f"pool:{v}", "mirrors": mirrors}
    # The blocks read: the whole folder, or on a beach each family's own.
    read = sorted(set(names) if not surface.beach else
                  {n for f in family_blocks.values() for n in [f["spine"], f["law"], f["fold"], f["pool"], *f["mirrors"]]})
    blocks = {n: surface.get(n) for n in read}
    blocks = {n: b for n, b in blocks.items() if isinstance(b, dict)}
    # A generic law is one another family's law mounts; on a beach it is read too.
    generic = {}
    for n, b in list(blocks.items()):
        root = BSP.collect_underscore(b)
        if n.startswith("function:") and parse_mount(root):
            g = parse_mount(root)["name"]
            generic.setdefault(g, []).append(n)
            if g not in blocks and surface.get(g) is not None and not g.startswith("pscale:"):
                blocks[g] = surface.get(g)
    content = {}
    for v, f in family_blocks.items():
        for n in [f["spine"], f["fold"], *f["mirrors"]]:
            content[n] = v
    content_names = set(content) | {f"pool:{v}" for v in family_blocks}

    faults, proposals, checked = [], [], 0
    for n in sorted(blocks):
        b = blocks[n]
        for kind, addr, leaf in references(surface, n, b):
            checked += 1
            why = unresolved(surface, kind, leaf)
            if why:
                faults.append({"predicate": "resolves", "block": n, "at": addr, "leaf": leaf, "fault": why})
            target = target_name(kind, leaf)
            if (n in content or (n.startswith("pool:") and kind != "directive")) and target.startswith("function:"):
                faults.append({"predicate": "direction", "block": n, "at": addr, "leaf": leaf,
                               "fault": f"content carries an operator pointer: {n} names {target}, and the law names its family, never the reverse"})
            if n in generic and (target in content_names or target.startswith("spine:")):
                faults.append({"predicate": "direction", "block": n, "at": addr, "leaf": leaf,
                               "fault": f"a generic law carries a content address: {n} serves {', '.join(generic[n])} and names {target}"})
    for v, f in sorted(family_blocks.items()):
        spine = surface.get(f["spine"])
        if spine is None:
            continue
        if surface.get(f["law"]) is None:
            faults.append({"predicate": "law", "block": f["spine"], "at": "0", "leaf": None,
                           "fault": f"the family {v} has no law standing: {f['law']} does not stand"})
        if BSP.floor_depth(spine) == CLOCK_FLOOR:
            continue  # a clock's addresses exist by construction (tree 5.1)
        for m in [*f["mirrors"], f["fold"]]:
            mb = surface.get(m)
            if not isinstance(mb, dict):
                continue
            floor = BSP.floor_depth(mb)
            for depth in range(1, A.deepest(mb) + 1):
                for e in BSP.collect_disc(mb, depth):
                    walk = e["address"].split(",")
                    if all(d == "0" for d in walk) or e["content"] is None:
                        continue
                    sdigits = BSP.parse_spindle(A.full_width(walk, floor), BSP.floor_depth(spine))
                    if BSP.walk(spine, sdigits) is None:
                        proposals.append({"family": v, "block": m, "at": A.full_width(walk, floor), "text": e["content"]})
    return {"shape": "form", "families": sorted(family_blocks), "blocks": len(blocks), "references": checked,
            "faults": faults, "proposals": proposals}


def main(argv):
    if not argv:
        sys.stderr.write(__doc__)
        return 1
    if argv[0] == "--beach":
        beach, families = argv[1], [argv[i + 1] for i, a in enumerate(argv) if a == "--family"]
        out = check(Surface(beach=beach), families)
    else:
        out = check(Surface(folder=argv[0]))
    print(json.dumps(out, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
