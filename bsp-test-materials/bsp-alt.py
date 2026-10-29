#!/usr/bin/env python3
"""bsp-alt.py — alternative bsp implementing the canonical model.

Anchors:
    pscale = floor - depth          (depth 0 = root = off-pscale)
    spindle alone           → path-walk (semantic at each walked position)
    spindle + P within S    → point at the depth corresponding to P
    spindle + P below P_end → path-walk + descent down to depth (floor - P)
    pscale alone, no spindle → disc at depth (floor - pscale)
    neither S nor P         → whole block

Disc convention:
    Enter `_` only when it is an object (floor chain or hidden directory).
    Do NOT enter `_` when it is a string — that string is the parent
    object's semantic, accounted for when the parent is emitted at its own
    depth. The floor terminus (string at the end of the root underscore
    chain) is the special case and is emitted when it sits at target depth.
    All digit children 1-9 are followed at every level.

Usage:
    python3 bsp-alt.py <block.json>                                # whole block
    python3 bsp-alt.py <block.json> --spindle 100                  # path-walk
    python3 bsp-alt.py <block.json> --pscale 0                     # disc
    python3 bsp-alt.py <block.json> --spindle 123 --pscale -2      # path-walk + descent

Output: JSON with shape and entries, printed to stdout.
"""
import argparse
import json
import sys


class InvalidAddressError(Exception):
    pass


# ── Floor and parsing ────────────────────────────────────────────────────

def floor_depth(block):
    """Walk the root underscore chain. Floor = depth where _ terminates in string."""
    node = block
    d = 0
    while isinstance(node, dict) and "_" in node:
        d += 1
        node = node["_"]
        if isinstance(node, str):
            return d
    return d


def split_star(spindle):
    """Split a spindle on the * operator.

    Returns (pre_string, post_string, has_star). pre_string and post_string are
    either None or non-empty strings; has_star is True if a * was present.
    """
    if spindle is None:
        return None, None, False
    s = str(spindle)
    if "*" not in s:
        return s, None, False
    parts = s.split("*")
    if len(parts) != 2:
        raise InvalidAddressError(f"'{s}': star operator appears more than once")
    pre, post = parts
    return (pre if pre else None), (post if post else None), True


def parse_spindle(spindle, floor):
    """Parse a non-star spindle into walk digits per the canonical parser.

    The star operator * must be handled by split_star before calling this
    function. Returns the list of walk digits (each '0' walks `_`, '1'-'9'
    walks that digit child).
    """
    if spindle is None or spindle == "":
        return []
    s = str(spindle)
    if "*" in s:
        raise InvalidAddressError(
            f"'{s}': star operator not allowed here; call split_star first"
        )
    if s.count(".") > 1:
        raise InvalidAddressError(f"'{s}' has multiple decimal points")
    if "." in s:
        left, right = s.split(".")
        had_dot = True
    else:
        left, right = s, ""
        had_dot = False
    for ch in left + right:
        if not ch.isdigit():
            raise InvalidAddressError(f"non-digit '{ch}' in '{s}'")
    if floor >= 1 and had_dot and len(left) > floor:
        raise InvalidAddressError(
            f"'{s}': left-of-decimal width {len(left)} exceeds floor {floor}"
        )
    left_digits = list(left)
    if floor > 1 and len(left_digits) < floor:
        left_digits = ["0"] * (floor - len(left_digits)) + left_digits
    digits = left_digits + list(right)
    while len(digits) > 1 and digits[-1] == "0":
        digits.pop()
    return digits


# ── Pscale arithmetic ────────────────────────────────────────────────────

def pscale_at(depth, floor):
    """David's formula: pscale = floor - depth. Depth 0 is root (off-pscale)."""
    if depth == 0:
        return None
    return floor - depth


def depth_at(pscale, floor):
    return floor - pscale


# ── Walking and semantics ────────────────────────────────────────────────

def walk(block, digits):
    """Walk the block by digits. '0' steps `_`, '1'-'9' step that digit."""
    node = block
    for d in digits:
        key = "_" if d == "0" else d
        if not isinstance(node, dict) or key not in node:
            return None
        node = node[key]
    return node


def collect_underscore(node):
    """Walk the underscore chain until a string is found, return it (or None)."""
    while isinstance(node, dict):
        if "_" not in node:
            return None
        node = node["_"]
    return node if isinstance(node, str) else None


def semantic(node):
    """The semantic of a position — leaf string, or object's underscore terminus.

    Numeric and boolean leaves are legal wire values — render their JSON form.
    Only null/absent stays None.
    """
    if isinstance(node, str):
        return node
    if isinstance(node, (bool, int, float)):
        return json.dumps(node)
    if isinstance(node, dict):
        return collect_underscore(node)
    return None


def format_walk(digits):
    return ",".join(digits) if digits else ""


# ── The function ──────────────────────────────────────────────────────────

def bsp(block, spindle=None, pscale=None):
    floor = floor_depth(block)

    # Star operator handling — walk to terminus, enter hidden directory at
    # terminus._, apply (post-spindle, pscale) inside as a sub-block.
    pre_str, post_str, has_star = split_star(spindle)
    if has_star:
        pre_digits = parse_spindle(pre_str, floor) if pre_str else []
        terminus = walk(block, pre_digits)
        sem = None
        inner = None
        if isinstance(terminus, dict):
            sem = collect_underscore(terminus)
            hidden = terminus.get("_")
            if isinstance(hidden, dict):
                inner = bsp(hidden, spindle=post_str, pscale=pscale)
        elif isinstance(terminus, str):
            sem = terminus
        return {
            "floor": floor,
            "shape": "star",
            "spindle": spindle,
            "semantic": sem,
            "inner": inner,
        }

    digits = parse_spindle(spindle, floor)
    out = {"floor": floor}

    # Case 1: nothing → whole block.
    if not digits and pscale is None:
        out["shape"] = "block"
        out["block"] = block
        return out

    # Case 2: pscale alone → disc.
    if not digits:
        target = depth_at(pscale, floor)
        out["shape"] = "disc"
        out["pscale"] = pscale
        out["target_depth"] = target
        out["entries"] = collect_disc(block, target)
        return out

    p_end = pscale_at(len(digits), floor)

    # Case 3: spindle alone → path-walk.
    if pscale is None:
        out["shape"] = "path-walk"
        out["spindle"] = spindle
        out["entries"] = build_path_walk(block, digits, floor)
        return out

    # Case 4: spindle + pscale within or above spindle → point.
    if pscale >= p_end:
        target = depth_at(pscale, floor)
        if target < 1 or target > len(digits):
            out["shape"] = "point"
            out["spindle"] = spindle
            out["pscale"] = pscale
            out["content"] = None
            out["note"] = f"pscale {pscale} is off the spindle (depth {target})"
            return out
        prefix = digits[:target]
        node = walk(block, prefix)
        out["shape"] = "point"
        out["spindle"] = spindle
        out["pscale"] = pscale
        out["depth"] = target
        out["address"] = format_walk(prefix)
        out["content"] = semantic(node)
        return out

    # Case 5: spindle + pscale below terminus → path-walk + descent.
    out["shape"] = "path-walk+descent"
    out["spindle"] = spindle
    out["pscale"] = pscale
    out["path_walk"] = build_path_walk(block, digits, floor)
    target = depth_at(pscale, floor)
    layers = target - len(digits)
    terminus = walk(block, digits)
    out["descent"] = collect_descent(terminus, digits, floor, layers)
    return out


# ── Helpers ───────────────────────────────────────────────────────────────

def build_path_walk(block, digits, floor):
    """Emit one entry per walked position, with depth and pscale."""
    entries = []
    for i in range(1, len(digits) + 1):
        prefix = digits[:i]
        node = walk(block, prefix)
        entries.append({
            "address": format_walk(prefix),
            "depth": i,
            "pscale": pscale_at(i, floor),
            "content": semantic(node),
        })
    return entries


def collect_disc(block, target_depth):
    """Collect all positions at the target depth, per the disc convention.

    Emission rule (refined from the original spec via 2026-05-17 report):
    a walk position emits a disc entry iff
      (a) its final step is a digit 1-9 (a real digit-walked position), OR
      (b) the entire walk is on the root underscore chain (all '0' steps)
          AND the position lands on a STRING — the floor terminus.

    Intermediate underscore-chain objects (e.g. root._ at floor 3) are not
    separate positions — they are the chain leading to the floor terminus,
    not content of their own. Hidden directories (off-chain underscore
    objects) are off-chain walks and emit normally.

    If target_depth < 1 the result is empty: depth 0 is root (off-pscale)
    and negative target depths sit above the root.
    """
    if target_depth < 1:
        return []

    results = []

    def recurse(node, depth, walked):
        if depth == target_depth:
            # Skip intermediate root-chain object positions (they duplicate
            # the floor terminus content at a non-terminus depth).
            on_chain_intermediate = (
                len(walked) > 0
                and all(w == "0" for w in walked)
                and isinstance(node, dict)
            )
            if not on_chain_intermediate:
                content = semantic(node)
                results.append({
                    "address": format_walk(walked),
                    "content": content,
                })
            return
        if not isinstance(node, dict):
            return
        # Enter `_` if it's an object — to continue the chain or hidden directory.
        if "_" in node:
            u = node["_"]
            if isinstance(u, dict):
                recurse(u, depth + 1, walked + ["0"])
            elif isinstance(u, str):
                # Underscore string. Emit only when on root underscore chain
                # AND the string sits at target_depth (i.e., it is the floor
                # terminus at the queried depth).
                on_floor_chain = all(w == "0" for w in walked)
                if on_floor_chain and depth + 1 == target_depth:
                    results.append({
                        "address": format_walk(walked + ["0"]),
                        "content": u,
                    })
        # Always recurse into digit children.
        for d in "123456789":
            if d in node:
                recurse(node[d], depth + 1, walked + [d])

    recurse(block, 0, [])
    return results


def collect_descent(terminus, walked, floor, layers):
    """Breadth-first descent from terminus, `layers` deep. Emit each position."""
    results = []
    if layers <= 0 or not isinstance(terminus, dict):
        return results
    frontier = [(terminus, walked)]
    for _layer in range(1, layers + 1):
        next_frontier = []
        for node, walked_path in frontier:
            if not isinstance(node, dict):
                continue
            for d in "123456789":
                if d in node:
                    child = node[d]
                    child_depth = len(walked_path) + 1
                    results.append({
                        "address": format_walk(walked_path + [d]),
                        "depth": child_depth,
                        "pscale": pscale_at(child_depth, floor),
                        "content": semantic(child),
                    })
                    if isinstance(child, dict):
                        next_frontier.append((child, walked_path + [d]))
        frontier = next_frontier
    return results


# ── CLI ────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="Alternative bsp function (canonical model)")
    p.add_argument("block_file", help="Path to a pscale block as JSON")
    p.add_argument("--spindle", default=None, help="Spindle address, e.g. 123 or 123.4")
    p.add_argument("--pscale", type=int, default=None, help="Pscale attention")
    args = p.parse_args()

    with open(args.block_file) as f:
        block = json.load(f)

    try:
        result = bsp(block, spindle=args.spindle, pscale=args.pscale)
        print(json.dumps(result, indent=2))
    except InvalidAddressError as e:
        print(f"InvalidAddressError: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
