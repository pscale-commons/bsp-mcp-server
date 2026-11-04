#!/usr/bin/env python3
"""Hand-played acts through the real test beach for the endings (E1, E2): every right act takes full marks and reads well
formed by the form pass that reads endings, and every planted wrong ending is caught. No model calls.

  selftest_e.py [E1|E2]    the delivery to play through (default E1)
"""
import json, os, shutil, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
runs = tempfile.mkdtemp(prefix="ends-selftest-")
os.environ["THREAD_TEST_RUNS"] = runs
sys.path.insert(0, HERE)
import battery as B
D = sys.argv[1] if len(sys.argv) > 1 else "E1"
assert D in B.ENDS

R = {
 "C1": [["open","the moorings page · opened by rook"],["say","3","built the moorings list (moorings:draft 1) · waits on wren","--option","wren checks it against the register","--option","dana publishes it as it is"],["post","wren","thread:3 — check the list, or dana publishes"]],
 "C2": [["say","1.1","reviewed: two tide times corrected in tides:draft 2 · waits on dana","--option","dana publishes the page","--option","dana asks for another pass"],["post","dana","thread:1.1 — yours to decide"]],
 "C3": [["say","1.31","added the spring tides (tides:draft 2) · waits on wren","--option","wren reviews the page"],["post","wren","thread:1.31 — please review"]],
 "C4": [["say","1.11","dana said publish it; published at tides:live · complete"]],
 "C5": [["say","1.14","fixed the layout for phones (tides:draft 3) · waits on dana"],["post","dana","thread:1.14 — before you decide, the phone layout is fixed"]],
 "C6": [["say","1.121","low-water marks shown (tides:draft 3) · waits on dana","--option","dana publishes the page","--option","dana asks for another pass"],["post","dana","thread:1.121 — yours to decide"]],
 "C7": [["say","1.1211","one low-water mark corrected (tides:draft 4) · waits on dana","--option","dana publishes draft 4"],["post","dana","thread:1.1211 — yours to decide"]],
 "C8": [["say","1.111","the chart changes next week (harbour:chart 2), so the choice again · waits on dana","--option","publish now, update after the change","--option","wait a week and publish on the new chart"],["post","dana","thread:1.111 — the choice again"]],
 "C10": [["say","1.3","the review needs November's harbour data, out on 10 November (harbour:data 2); looking at it then · waits on wren from 2026-11-10"]],
}
ALT = {  # right too: the one knot in place, a room told on a deferral, the review promised at its option's address
 "C3k": ("C3", [["say","1.3","rook adds the spring tides before anyone reviews: added them (tides:draft 2) · waits on wren","--option","wren reviews the page"],["post","wren","thread:1.3 — please review"]]),
 "C10r": ("C10", [["say","1.1","wren reviews it on 10 November, when the harbour's November data is out · waits on wren from 2026-11-10"],["post","rook","thread:1.1 — on 10 November"]]),
}
W = {  # planted wrong: the misses that must show
 "C2n": ("C2", [["say","1.1","reviewed: two tide times corrected","--option","dana publishes","--option","another pass"],["post","dana","thread:1.1 — yours"]], ["it ends"]),
 "C2w": ("C2", [["say","1.1","reviewed: two tide times corrected · waits on rook","--option","dana publishes","--option","another pass"],["post","dana","thread:1.1 — yours"]], ["it ends"]),
 "C4w": ("C4", [["say","1.11","dana said publish it; published · waits on dana"]], ["it ends"]),
 "C10n": ("C10", [["say","1.3","looking at it on 10 November · waits on wren"]], ["it ends"]),
 "C10s": ("C10", [["say","1.3","looking at it then · waits on wren from 10 November"]], ["it ends"]),
 "C10d": ("C10", [["say","1.3","looking at it then · waits on wren from 2026-11-11"]], ["it ends"]),
 "C10l": ("C10", [["say","1.3","looking at it then · waits on wren from 2026-11-10"],["say","2","x"]], ["nothing lost"]),   # her own glossary line written over
}


def play(name, case, acts, reply=None):
    B.setup(D, [case])
    d = os.path.join(runs, f"{D}-{case}")
    for a in acts:
        subprocess.run(["python3", os.path.join(HERE, "testbeach.py"), d] + a, capture_output=True, check=True)
    open(os.path.join(d, "reply.txt"), "w").write(reply or '{"tied_at": null}')
    return B.grade(D, case)


bad = 0
way = open(os.path.join(HERE, "teachings", f"way_{B.DRAFTS[D]}.txt")).read().strip()
sys.stdout = open(os.devnull, "w")
for case, act in (("C2", ["read", "1"]), ("C2", ["say", "1.1", "x"]), ("C1", ["open", "x"])):
    B.setup(D, [case])
    out = subprocess.run(["python3", os.path.join(HERE, "testbeach.py"), os.path.join(runs, f"{D}-{case}")] + act, capture_output=True, text=True, check=True).stdout
    bad += 0 if way in out else 1
B.setup(D, ["C9"])
bad += 0 if way in open(os.path.join(runs, f"{D}-C9", "brief.txt")).read() else 1
handed_bad = bad
results = []
for c, acts in R.items():
    results.append((c, play(c, c, acts), None))
for n, (c, acts) in ALT.items():
    results.append((n, play(n, c, acts), None))
for n, (c, acts, must) in W.items():
    results.append((n, play(n, c, acts), must))
B.setup(D, ["C9"])
results.append(("C9", play("C9", "C9", [], "1.1 | fetched 62 tide times, saved at tides:feed 11 · waits on rook | options: 1 rook rebuilds the page from them\n\nBecause 1.1 is the option."), None))
B.setup(D, ["C9"])
results.append(("C9n", play("C9n", "C9", [], "1.1 | fetched 62 tide times, saved at tides:feed 11 | options: 1 rook rebuilds the page from them\n\nBecause."), ["it ends"]))
sys.stdout = sys.__stdout__
print(f"{D}: way_{B.DRAFTS[D]}.txt reaches the mind in the first read, the first say, the opening and the wake's window" if not handed_bad
      else f"{D}: way_{B.DRAFTS[D]}.txt MISSING from {handed_bad} of the four handings")
for n, r, must in results:
    misses = [e for e in r["expect"] if e.startswith("MISS")]
    ok = (not misses) if must is None else all(any(m in e for e in misses) for m in must)
    if must is None and n in R:   # a right act also reads well formed by the form pass that reads endings
        ok = ok and r.get("form_p2") == "WELL FORMED"
    bad += 0 if ok else 1
    print(("✓" if ok else "✗"), n.ljust(5), r["score"].ljust(4), "landed", r.get("landed"), "| p2", r.get("form_p2"))
    if misses:
        print("     ", "; ".join(misses))
print("all as expected" if not bad else f"{bad} NOT as expected")
total = sum(len(r["expect"]) for n, r, m in results if n in R or n == "C9")
print("checks across the ten:", total)
shutil.rmtree(runs)
sys.exit(1 if bad else 0)
