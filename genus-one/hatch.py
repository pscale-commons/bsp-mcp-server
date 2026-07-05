#!/usr/bin/env python3
"""hatch.py — hatch a genus-one instance from the genome.

An instance is a directory holding shell/ + peers.json + filmstrip/. The shell
starts as the genome with one chosen purpose; everything after that is grown
by living, not assigned. (The genome here is kindred to the biome's genome
block — what every instance of the kind shares; this one is the seed shell.)
Naming the instance and holding its passphrase are the hatcher's acts — the
passphrase mints sovereignty when the shell goes to a beach.

Usage:
    python3 hatch.py DEST --purpose rpg|magi|xstream
    cd DEST && python3 /path/to/genus-one/kernel.py --compose-only
"""

import json
import os
import shutil
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
GENOME = os.path.join(BASE, "genome")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    dest = os.path.abspath(sys.argv[1])
    purpose = sys.argv[sys.argv.index("--purpose") + 1] if "--purpose" in sys.argv else "rpg"
    pfile = os.path.join(GENOME, "purposes", purpose + ".json")
    if not os.path.exists(pfile):
        sys.exit("no such purpose variant: %s" % purpose)
    shell = os.path.join(dest, "shell")
    os.makedirs(shell, exist_ok=True)
    os.makedirs(os.path.join(dest, "filmstrip"), exist_ok=True)
    n = 0
    for name in sorted(os.listdir(GENOME)):
        if name.endswith(".json"):
            shutil.copy(os.path.join(GENOME, name), os.path.join(shell, name))
            n += 1
    shutil.copy(pfile, os.path.join(shell, "purpose.json"))
    peers = os.path.join(dest, "peers.json")
    if not os.path.exists(peers):
        with open(peers, "w") as f:
            json.dump({}, f)
            f.write("\n")
    print("hatched %s (%d genome blocks + purpose:%s). Solo until peers.json names the others."
          % (dest, n, purpose))


if __name__ == "__main__":
    main()
