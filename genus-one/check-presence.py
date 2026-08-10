"""Check the fold's presence declaration — the slot picker and the stamp parser.

    python3 genus-one/check-presence.py           # offline, free, no network
    python3 genus-one/check-presence.py --live    # + one real write at a beach

The offline half is the one that matters: the slot picker is what stands between
a tenth agent and a corrupted block, and its awkward cases (a released slot, an
unreadable stamp, an address that walks into another agent's fields) are all
reachable without a beach. --live writes under a stand-in handle and releases
the slot afterwards; it never writes under a real agent's name.
"""
import os
import sys
import tempfile
import time

os.environ.setdefault("GENUS_BEACH", "https://beach.happyseaurchin.com")
os.environ.setdefault("GENUS_HANDLE", "egg-probe")
# A scratch agent dir, never the repo and never a real instance — importing the
# kernel resolves one, and this check must not leave a filmstrip in anyone's shell.
os.environ.setdefault("GENUS_AGENT", os.path.join(tempfile.gettempdir(), "genus-check-presence"))
os.makedirs(os.environ["GENUS_AGENT"], exist_ok=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kernel  # noqa: E402
import wire    # noqa: E402

FAILS = []


def ok(name, got, want):
    if got == want:
        print("  ok   %s" % name)
    else:
        FAILS.append(name)
        print("  FAIL %s: got %r want %r" % (name, got, want))


def main(live=False):
    now = time.time()
    fresh = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now - 5))
    stale = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now - 120))
    entry = lambda who, ts: {"_": "here", "1": who, "3": ts}          # noqa: E731

    print("\n_presence_slot")
    ok("an empty block takes 1", kernel._presence_slot({}, now), "1")
    ok("reuses our own slot wherever it sits",
       kernel._presence_slot({"1": entry("someone", fresh),
                              "2": entry(os.environ["GENUS_HANDLE"], stale)}, now), "2")
    ok("skips a live stranger for the next free",
       kernel._presence_slot({"1": entry("someone", fresh)}, now), "2")
    ok("reclaims a stale slot", kernel._presence_slot({"1": entry("someone", stale)}, now), "1")
    ok("reclaims a released slot",
       kernel._presence_slot({"1": {"_": "", "1": "someone", "3": fresh}}, now), "1")
    ok("an unreadable stamp counts as stale",
       kernel._presence_slot({"1": entry("someone", "not-a-date")}, now), "1")

    # The tenth agent. Presence never supernests — every write is surgical at a
    # named slot and nothing appends — so while slot 1 holds an entry, 11-13 are
    # that entry's own fields rather than free slots beneath it, and 14 is the
    # one an unguarded walk takes: 11-13 are non-empty strings it skips, while
    # field 4 is absent because an entry has none. That absence is the very
    # thing that makes an entry read as presence, so a claim landing there
    # deletes the agent it lands on.
    full = {str(n): entry("s%d" % n, fresh) for n in range(1, 10)}
    ok("nine live agents means no slot, never a slot inside one",
       kernel._presence_slot(full, now), None)
    ok("11 is blocked — it is slot 1's field 1", kernel._at_slot(full, "11"), kernel.BLOCKED)
    ok("12 is blocked — it is slot 1's field 2", kernel._at_slot(full, "12"), kernel.BLOCKED)
    ok("14 is blocked — slot 1's ABSENT field 4, the address that reads free",
       kernel._at_slot(full, "14"), kernel.BLOCKED)
    ok("an unguarded walk would have taken it", full["1"].get("4"), None)
    ok("a real supernest container still walks",
       kernel._at_slot({"1": {"1": entry("deep", fresh)}}, "11")["1"], "deep")
    ok("no zero-bearing slot is ever offered",
       any("0" in s for s in list(kernel._presence_slots())[:200]), False)

    print("\n_iso_epoch")
    ok("a browser stamp with milliseconds", kernel._iso_epoch("2026-08-10T10:53:47.656Z") is not None, True)
    ok("a kernel stamp without", kernel._iso_epoch("2026-08-10T10:53:47Z") is not None, True)
    ok("junk is None", kernel._iso_epoch("nope"), None)

    if live:
        beach, handle = os.environ["GENUS_BEACH"], os.environ["GENUS_HANDLE"]
        for label, pairs, want_at in (("a fold that answered in its room",
                                       [("pool:3", "an answer"), ("surface:2", "x")], "3"),
                                      ("a fold that worked elsewhere",
                                       [("surface:2", "x")], None)):
            print("\nlive — %s" % label)
            kernel.declare_presence(pairs, time.time())
            block = wire.load_block(beach, "presence") or {}
            found = None
            for slot in kernel._presence_slots():
                node = kernel._at_slot(block, slot)
                if kernel._is_entry(node) and node.get("1") == handle:
                    found = (slot, node)
                    break
            if not found:
                FAILS.append("live: no slot found")
                print("  FAIL nothing landed at %s" % beach)
                continue
            slot, node = found
            print("  slot %s: %s" % (slot, node.get("_")))
            ok("field 1 is the handle", node.get("1"), handle)
            ok("field 2 is the room", node.get("2"), "pool:%s" % handle)
            ok("field 7 carries the room coordinate" if want_at else "no field 7 when unlocated",
               node.get("7"), want_at)
            ok("no field 4 — presence, never a contribution", "4" in node, False)
            wire.write_at(beach, "presence", slot,
                          {"_": "", "1": handle, "2": "pool:%s" % handle,
                           "3": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})
            print("  released slot %s" % slot)

    print("\n%s" % ("ALL PASSED" if not FAILS else "FAILED: %s" % ", ".join(FAILS)))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main(live="--live" in sys.argv))
