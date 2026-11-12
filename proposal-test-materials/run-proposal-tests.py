#!/usr/bin/env python3
"""run-proposal-tests.py: the proposal battery's CI pass. It reads nothing from the network.

  1. THE CLEAN FAMILY: harbour-bell is well formed, with no FAULT and no WARN, and stays so as it would stand
     once the registry has passed nine threads (floor 2, its thread at 12), as the beach's has since November.
  2. THE PLANTED FAULTS (mutation.py): every one is caught at its level.
  3. THE BLOCK AND THE CODE AGREE: src/proposal-test.json names every test the checker runs,
     at the battery it belongs to; every test has a planted fault; and the count the block states
     is the count planted. So no case stands in one without the other.

  python3 proposal-test-materials/run-proposal-tests.py
"""
import copy, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import mutation as M
import proposal_form as PF

BRANCH = {"family": "1", "decisions": "2", "room": "3", "threads": "4", "page": "5"}
OWNS = {"check_family": "family", "check_decisions": "decisions", "check_room": "room", "check_threads": "threads",
        "check_page": "page", "check_look": "page", "check_map": "page"}
# notes about where the checker stands, not about a family; nothing can be planted for them
SITUATION = {("family", "COMPOUND", "NOTE"), ("threads", "FORM", "NOTE"), ("page", "ANSWERS", "NOTE")}
failed = []


def say(ok, what):
    print(("  ✓ " if ok else "  ✗ ") + what)
    if not ok:
        failed.append(what)


def tests_in_code():
    """Each (battery, test, level) the checker can report, read from its own source."""
    src, found = open(os.path.join(HERE, "proposal_form.py"), encoding="utf8").read(), set()
    for m in re.finditer(r"^def (check_\w+)\(.*?(?=^def |^[A-Z]+ = |\Z)", src, re.S | re.M):
        if m.group(1) in OWNS:
            for lv, t in re.findall(r"""add\(\s*"(FAULT|WARN|NOTE)",\s*"([A-Z]+)\"""", m.group(0)):
                found.add((OWNS[m.group(1)], t, lv))
    return found


print("── 1. the clean family ──")
r = subprocess.run([sys.executable, os.path.join(HERE, "proposal_form.py"), "state", os.path.join(HERE, "fixtures", "harbour-bell.json")],
                   capture_output=True, text=True)
head = r.stdout.split("\n", 1)[0]
noisy = [x for x in r.stdout.split("\n")[1:] if x.startswith(("  FAULT", "  WARN"))]
say(r.returncode == 0 and "WELL FORMED" in head and not noisy, head[:90])
for line in noisy:
    print("     " + line)


def past_nine(state):
    """harbour-bell once the registry has passed nine threads: spine:thread at floor 2 with the thread at 12, and
    rook's mirror at floor 2, where the router writes a knot at 12. Read at floor 1, 12 becomes 1,2: no knot stands
    at the thread's number and every line hangs beneath a 1 nobody holds, so a clean family reads broken."""
    s = copy.deepcopy(state)
    b = s["blocks"]
    reg, rook = b["spine:thread"], b["thread:rook"]
    b["spine:thread"] = {"_": {"_": reg["_"]}, "1": {"2": reg["1"]}}
    b["thread:rook"] = {"_": {"_": rook["_"]}, "1": {"2": rook["1"]}}
    five = b["function:harbour-bell"]["5"]
    five["1"] = five["1"].replace("thread:1 ", "thread:12 ", 1)
    return s


fixtures = os.path.join(HERE, "fixtures")
v = PF.check(PF.State(past_nine(json.load(open(os.path.join(fixtures, "harbour-bell.json"), encoding="utf8"))), fixtures), "harbour-bell")
loud = [x for x in v.findings if x["level"] in ("FAULT", "WARN")]
say(PF.verdict(v) == "WELL FORMED" and not loud and len(v.threads) == 2, f"past nine threads (registry at floor 2, thread:12): {PF.verdict(v)}")
for x in loud:
    print(f"     {x['level']} {x['battery']}/{x['test']} {x['at']} {x['detail'][:80]}")

print("── 2. the planted faults ──")
r = subprocess.run([sys.executable, os.path.join(HERE, "mutation.py")], capture_output=True, text=True)
for line in r.stdout.strip().split("\n"):
    if not line.startswith("caught"):
        print("    " + line)
say(r.returncode == 0, r.stdout.strip().split("\n")[-1] if r.stdout.strip() else "mutation.py gave nothing " + r.stderr[-200:])

print("── 3. the block and the code agree ──")
block = json.load(open(os.path.join(HERE, "..", "src", "proposal-test.json"), encoding="utf8"))
say(PF.shape_fault(block) is None, "the block passes the beach's shape gate")
code = tests_in_code()
say(len(code) > 40, f"{len(code)} tests read from the checker's source")
unnamed = sorted((b, t) for b, t, _ in code if not re.search(rf"\b{t}\b", json.dumps(block[BRANCH[b]], ensure_ascii=False)))
say(not unnamed, "the block names every test at its battery" + (f": missing {unnamed}" if unnamed else ""))
planted = {(b, t, lv) for _, _, b, t, lv in M.M}
unproved = sorted(code - planted - SITUATION)
say(not unproved, "every test has a planted fault" + (f": none for {unproved}" if unproved else ""))
ghosts = sorted(planted - code)
say(not ghosts, "every planted fault is a test the checker runs" + (f": no test {ghosts}" if ghosts else ""))
stated = int(re.search(r"\d+", block["7"]).group(0))
say(stated == len(M.M), f"the block states {stated} planted faults, and {len(M.M)} are planted")

print(f"\nproposal-test: {'all passed' if not failed else str(len(failed)) + ' failed'}")
sys.exit(1 if failed else 0)
