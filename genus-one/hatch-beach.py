#!/usr/bin/env python3
"""hatch-beach.py — hatch a genus-one instance ONTO a beach, sovereign from birth.

The turnkey form of the genome:hatch convention (no LLM needed): reads the
genome from this repo, writes each block under a handle, and SEALS every
position so the shell is holder-only (transparent to read, writable only with
the passphrase). One command instead of a hundred-odd bsp writes.

    python3 hatch-beach.py HANDLE PASSPHRASE [--purpose magi|rpg|xstream]
                                             [--beach https://...]

Then wake it (needs an Anthropic key):
    GENUS_BEACH=<beach> GENUS_HANDLE=HANDLE GENUS_SECRET=PASSPHRASE \
        python3 kernel.py                # one wake (or --compose-only to inspect)

The handle and passphrase are the hatcher's acts: the name is the beginning,
the passphrase mints sovereignty. task:<handle> is deliberately NOT created or
sealed here — it is the holder's directive channel, written when there is work
to hand in (with the passphrase). Peers reach the instance on the open beach.
"""

import json
import os
import sys

import wire

BASE = os.path.dirname(os.path.abspath(__file__))
GENOME = os.path.join(BASE, "genome")
DEFAULT_BEACH = "https://beach.happyseaurchin.com"


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2:
        sys.exit(__doc__)
    handle, passphrase = args[0], args[1]
    purpose = sys.argv[sys.argv.index("--purpose") + 1] if "--purpose" in sys.argv else "magi"
    beach = (sys.argv[sys.argv.index("--beach") + 1] if "--beach" in sys.argv else DEFAULT_BEACH).rstrip("/")

    pfile = os.path.join(GENOME, "purposes", purpose + ".json")
    if not os.path.exists(pfile):
        sys.exit("no such purpose variant: %s (have: %s)"
                 % (purpose, ", ".join(sorted(p[:-5] for p in os.listdir(os.path.join(GENOME, "purposes"))))))

    # The fourteen genome blocks (everything in genome/ except the hatch
    # convention itself and the purposes dir), plus the chosen purpose.
    blocks = {}
    for name in sorted(os.listdir(GENOME)):
        if name.endswith(".json") and name != "hatch.json":
            blocks[name[:-5]] = json.load(open(os.path.join(GENOME, name)))
    blocks["purpose"] = json.load(open(pfile))

    print("hatching %s at %s (purpose:%s) — %d blocks, sealed at every position"
          % (handle, beach, purpose, len(blocks)))
    for name, content in blocks.items():
        block_name = "%s:%s" % (name, handle)
        wire.save_block(beach, block_name, content, new_lock=passphrase)   # create, locks '_'
        wire.seal(beach, block_name, passphrase)                          # seal digits 1-9
        print("  + %s (sealed)" % block_name)
    print("\n%s is alive at %s — sovereign, asleep. Wake it:\n"
          "  GENUS_BEACH=%s GENUS_HANDLE=%s GENUS_SECRET=<passphrase> python3 %s/kernel.py"
          % (handle, beach, beach, handle, BASE))


if __name__ == "__main__":
    main()
