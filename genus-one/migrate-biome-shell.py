#!/usr/bin/env python3
"""migrate-biome-shell.py — the dialect move: biome 0-9 → federated _/1-9.

The genome is identical; only the zero fundamental changes. This script renames
the storage key "0" to "_" recursively through JSON block files. Addresses
INSIDE content strings are untouched — the digit 0 in an address walks the
underscore key in the federated dialect, so "vision:9:-2" or "surface:1:0"
carry over verbatim.

Usage:
    python3 migrate-biome-shell.py SRC DST     # file → file, or dir → dir (*.json)
"""

import json
import os
import sys


def transpose(node):
    if isinstance(node, dict):
        out = {}
        for k, v in node.items():            # insertion order preserved
            out["_" if k == "0" else k] = transpose(v)
        return out
    if isinstance(node, list):
        return [transpose(v) for v in node]
    return node


def migrate_file(src, dst):
    with open(src, encoding="utf-8") as f:
        block = json.load(f)
    os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(transpose(block), f, indent=2, ensure_ascii=False)
        f.write("\n")


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, dst = sys.argv[1], sys.argv[2]
    if os.path.isdir(src):
        n = 0
        for name in sorted(os.listdir(src)):
            if name.endswith(".json"):
                migrate_file(os.path.join(src, name), os.path.join(dst, name))
                n += 1
        print("migrated %d blocks: %s -> %s" % (n, src, dst))
    else:
        migrate_file(src, dst)
        print("migrated %s -> %s" % (src, dst))


if __name__ == "__main__":
    main()
