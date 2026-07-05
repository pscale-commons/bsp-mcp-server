#!/usr/bin/env python3
"""publish-genome.py — publish the genome to a beach as genome:<name> blocks.

First publish creates each block locked (new_lock); re-publish after a
fleshing pass proves authority (secret) and re-sets the same lock. The repo
stays the versioned snapshot; the beach copy is the living genome people
hatch from (genome:hatch is the convention block).

Usage:
    GENOME_SECRET=... python3 publish-genome.py https://beach.example.com [--update]
"""

import json
import os
import sys

import wire

BASE = os.path.dirname(os.path.abspath(__file__))
GENOME = os.path.join(BASE, "genome")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    origin = sys.argv[1].rstrip("/")
    update = "--update" in sys.argv
    secret = os.environ.get("GENOME_SECRET", "")
    if not secret:
        sys.exit("set GENOME_SECRET — the lock the published genome is held under")
    blocks = {}
    for name in sorted(os.listdir(GENOME)):
        if name.endswith(".json"):
            blocks["genome:" + name[:-5]] = json.load(open(os.path.join(GENOME, name)))
    pdir = os.path.join(GENOME, "purposes")
    for name in sorted(os.listdir(pdir)):
        if name.endswith(".json"):
            blocks["genome:purpose-" + name[:-5]] = json.load(open(os.path.join(pdir, name)))
    ok = 0
    for bname, content in blocks.items():
        kw = {"secret": secret, "new_lock": secret} if update else {"new_lock": secret}
        wire.save_block(origin, bname, content, **kw)
        ok += 1
        print("  published %s" % bname)
    print("%d genome blocks live at %s (locked)." % (ok, origin))


if __name__ == "__main__":
    main()
