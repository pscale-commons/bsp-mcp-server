"""spark — the coded kernel for pscale blocks, in the FEDERATED dialect.

Derived from pscale-biome src/spark/spark.py (the 0-9 biome dialect; v009 run,
source commit 71344f5). One genome, two dialects: on the biome the zero
fundamental is the key "0"; on the federated beach it is the underscore "_".
This file speaks the underscore dialect:

  - storage: a node's voicing lives at key "_"; "1"-"9" are its elaboration.
  - addresses: unchanged — the digit 0 in an address walks the "_" key.
  - everything else (floor, pscale = floor - depth, the strict single-decimal
    parse, shape derivation from (number, attention)) is identical.

The federated dialect also carries hidden directories ("_"-as-object whose
children are digit-keyed, sunstone:1.4). This engine handles the "_"-chain
voicing fold exactly as the biome handles the 0-chain; descent iterates digit
children only, so a hidden directory's interior is never flattened into a
directory read — it is entered deliberately (reference-star, or a deeper walk).

Canonical arbiters: any dispute about walk semantics in this dialect resolves
to bsp2-star.py (Python) / src/bsp.ts (TypeScript), the battery-covered
federated walkers. This engine exists to keep the genus-one kernel's call surface
(spark/voice/floor/parse/parse_reference/fold) byte-compatible with the biome
original, so the kernel logic carries unchanged.
"""

import json
import re

DIGITS = "123456789"
ZK = "_"                      # the zero fundamental: "_" federated, "0" biome


def _key(d):
    """Address digit to storage key: digit 0 walks the underscore."""
    return ZK if d == "0" else d


class AddressError(ValueError):
    pass


# --- substrate verbs --------------------------------------------------------

def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save(path, block):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(block, f, indent=2, ensure_ascii=False)
        f.write("\n")


def descend(block, digits):
    """Walk the digit sequence from the root; the node, or None if off-tree."""
    node = block
    for d in digits:
        k = _key(d)
        if isinstance(node, dict) and k in node:
            node = node[k]
        else:
            return None
    return node


def voice(node):
    """A node's voicing: descend "_" to the first string, or None if headless."""
    while isinstance(node, dict):
        if ZK not in node:
            return None
        node = node[ZK]
    return node if isinstance(node, str) else None


def floor(block):
    """Floor depth: count "_"-steps from the root to the first string."""
    n, node = 0, block
    while isinstance(node, dict):
        if ZK not in node:
            return n
        node = node[ZK]
        n += 1
    return n


def status(node):
    if node is None:
        return "absent"
    if isinstance(node, str):
        return "voiced"
    return "voiced" if voice(node) is not None else "headless"


# --- address ----------------------------------------------------------------

def parse(number, flr):
    """A pscale address to a walk (list of digit strings). Bare re-pins to the
    current floor; dotted left-pads to survive supernesting."""
    s = "" if number is None else str(number)
    if s == "":
        return []
    if any(c not in "0123456789." for c in s):
        raise AddressError("address holds a non-digit: %r" % number)
    if s.count(".") > 1:
        raise AddressError("address has more than one decimal: %r" % number)
    if "." in s:
        left, right = s.split(".")
        if len(left) > flr:
            raise AddressError("left of decimal exceeds floor %d: %r" % (flr, number))
        return list(left.rjust(flr, "0") + right)
    return list(s if len(s) >= flr else s.rjust(flr, "0"))


# --- reference (refer/star) -------------------------------------------------

_NAME = re.compile(r"[A-Za-z][A-Za-z0-9_-]*$")
_ADDR = re.compile(r"\d+(\.\d+)?$")
_ATT = re.compile(r"-?\d+$")


def parse_reference(leaf):
    """A leaf that names another block: name | name:address | name:address:attention.
    Returns (name, address|None, attention|None), or None if the leaf is plain
    content (has a space, is digit-led, or has a malformed tail)."""
    if not isinstance(leaf, str) or leaf == "" or " " in leaf:
        return None
    parts = leaf.split(":")
    i, name_segs = 0, []
    while i < len(parts) and _NAME.match(parts[i]):
        name_segs.append(parts[i])
        i += 1
    if not name_segs:
        return None
    name = ":".join(name_segs)
    address = attention = None
    if i < len(parts):
        if _ADDR.match(parts[i]):
            address = parts[i]
            i += 1
        else:
            return None
    if i < len(parts):
        if _ATT.match(parts[i]):
            attention = int(parts[i])
            i += 1
        else:
            return None
    return (name, address, attention) if i == len(parts) else None


def _resolve(text, loader):
    """If text is a reference and its block loads, read it there with star on.
    Returns the resolved shape, or None to keep the leaf verbatim."""
    if loader is None or not isinstance(text, str):
        return None
    ref = parse_reference(text)
    if ref is None:
        return None
    name, address, attention = ref
    target = loader(name)
    if target is None:
        return None
    return spark(target, address, attention, star=True, loader=loader)


# --- the function -----------------------------------------------------------

def spark(block, number=None, attention=None, content=None, star=False, loader=None):
    flr = floor(block)
    if content is not None:
        return _write(block, number, attention, content, flr)
    if number is None or str(number) == "":
        if attention is None:
            return {"mode": "whole", "floor": flr, "block": block}
        return _disc(block, attention, flr)
    walk = parse(number, flr)
    term = flr - len(walk)
    if attention is None:
        return _spindle(block, walk, flr)
    if attention == term:
        res = _point(block, walk, term)
        if star and res["status"] == "voiced":
            followed = _resolve(res["text"], loader)
            if followed is not None:
                return followed
        return res
    if attention > term:
        return _ring(block, walk, attention, flr)
    return _directory(block, walk, attention, flr)


def _spindle(block, walk, flr):
    entries, node, off = [], block, False
    for i, d in enumerate(walk):
        k = _key(d)
        node = node[k] if (not off and isinstance(node, dict) and k in node) else None
        if node is None:
            off = True
        entries.append({"depth": i + 1, "pscale": flr - (i + 1),
                        "text": None if off else voice(node), "status": status(node)})
    return {"mode": "spindle", "floor": flr, "entries": entries}


def _point(block, walk, term):
    node = descend(block, walk)
    return {"mode": "point", "pscale": term,
            "text": voice(node) if node is not None else None, "status": status(node)}


def _ring(block, walk, attention, flr):
    depth = flr - attention            # the ring sits at this depth
    if depth < 1:
        return {"mode": "ring", "pscale": attention, "head": voice(block), "siblings": []}
    parent = descend(block, walk[:depth - 1])
    walked = walk[depth - 1] if depth - 1 < len(walk) else None
    sibs = []
    if isinstance(parent, dict):
        for d in DIGITS:
            if d in parent:
                ch = parent[d]
                sibs.append({"digit": d, "text": voice(ch) if isinstance(ch, dict) else ch,
                             "status": status(ch), "is_branch": isinstance(ch, dict),
                             "is_walked": d == walked})
    return {"mode": "ring", "pscale": attention,
            "head": voice(parent) if parent is not None else None, "siblings": sibs}


def _directory(block, walk, attention, flr):
    node = descend(block, walk)
    remaining = (flr - attention) - len(walk)

    def build(n, depth_left):
        if not isinstance(n, dict):
            return n
        if depth_left <= 0:
            return voice(n)
        out = {}
        if ZK in n:
            out[ZK] = voice(n)                        # the head: collapse the _-chain
        for d in DIGITS:
            if d in n:
                out[d] = build(n[d], depth_left - 1)
        return out

    return {"mode": "directory", "pscale": attention,
            "subtree": build(node, remaining) if isinstance(node, dict) else node}


def _disc(block, attention, flr):
    target = flr - attention
    nodes = []

    def rec(n, depth, addr):
        if depth == target:
            nodes.append({"address": addr, "text": voice(n) if isinstance(n, dict) else n,
                          "status": status(n)})
            return
        if isinstance(n, dict):
            for d in [ZK] + list(DIGITS):
                if d in n:
                    rec(n[d], depth + 1, addr + ("0" if d == ZK else d))

    rec(block, 0, "")
    return {"mode": "disc", "pscale": attention, "nodes": nodes}


# --- write (conjugate of read) ----------------------------------------------

def _ensure(block, digits):
    """Walk to a node, creating missing intermediates as headless objects and
    lifting any string passed through into the new object's underscore."""
    node = block
    for d in digits:
        k = _key(d)
        if k not in node:
            node[k] = {}
        elif isinstance(node[k], str):
            node[k] = {ZK: node[k]}                    # lift
        node = node[k]
    return node


def _write(block, number, attention, content, flr):
    if number is None or str(number) == "":
        if attention is None and isinstance(content, dict):
            block.clear()
            block.update(content)
            return {"mode": "whole-write", "ok": True}
        raise AddressError("a write with no number needs a whole-block object")
    walk = parse(number, flr)
    term = flr - len(walk)
    if attention is None or attention == term:           # point write, with lift
        parent = _ensure(block, walk[:-1])
        parent[_key(walk[-1])] = content
        return {"mode": "point-write", "ok": True}
    if attention > term:                                  # ring write
        if not isinstance(content, dict):
            raise AddressError(
                "a ring write replaces the digit children — content must be an "
                "object of digit keys (note: an empty block has floor 0, so every "
                "term is negative; create a new block with a whole-block write — "
                "no number, object content)")
        depth = flr - attention
        parent = _ensure(block, walk[:depth - 1])
        for d in DIGITS:
            parent.pop(d, None)
        for k, v in content.items():
            parent[k] = v
        return {"mode": "ring-write", "ok": True}
    parent = _ensure(block, walk[:-1])                    # directory write
    parent[_key(walk[-1])] = content
    return {"mode": "directory-write", "ok": True}


# --- fold (the companion: lay N blocks against the shared floor) -------------

def fold(blocks, attention):
    """Lay N blocks against their shared floor at one pscale: each block's
    positions at that pscale, aligned for the caller to read across. Aligned by
    pscale (floor - depth), never by walk-depth."""
    rows = [{"block": i, "nodes": _disc(b, attention, floor(b))["nodes"]}
            for i, b in enumerate(blocks)]
    return {"mode": "fold", "pscale": attention, "blocks": rows}
