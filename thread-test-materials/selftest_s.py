#!/usr/bin/env python3
"""Hand-played acts through the real test beach: every right act takes full marks, every planted wrong act is caught. No model calls.

  selftest_s.py [S|S2|S3|S4]    the delivery to play through (default S)
"""
import json, os, shutil, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
runs = tempfile.mkdtemp(prefix="short-selftest-")
os.environ["THREAD_TEST_RUNS"] = runs
sys.path.insert(0, HERE)
import battery as B
D = sys.argv[1] if len(sys.argv) > 1 else "S"
assert D in B.SHORT

R = {
 "C1": [["open","the moorings page"],["say","3","built the moorings list (moorings:draft 1)","--option","wren checks it against the register","--option","dana publishes it as it is"],["post","wren","thread:3 — check the list, or dana publishes"]],
 "C2": [["say","1.1","reviewed: two tide times corrected in tides:draft 2","--option","dana publishes the page","--option","dana asks for another pass"],["post","dana","thread:1.1 — yours to decide"]],
 "C3": [["say","1.31","added the spring tides (tides:draft 2)","--option","wren reviews the page"],["post","wren","thread:1.31 — please review"]],
 "C4": [["say","1.11","dana said publish it; published at tides:live"]],
 "C5": [["say","1.14","fixed the layout for phones (tides:draft 3)"],["post","dana","thread:1.14 — before you decide, the phone layout is fixed"]],
 "C6": [["say","1.121","low-water marks shown (tides:draft 3)","--option","dana publishes the page","--option","dana asks for another pass"],["post","dana","thread:1.121 — yours to decide"]],
 "C7": [["say","1.1211","one low-water mark corrected (tides:draft 4)","--option","dana publishes draft 4"],["post","dana","thread:1.1211 — yours to decide"]],
 "C8": [["say","1.111","the chart changes next week (harbour:chart 2), so the choice again","--option","publish now, update after the change","--option","wait a week and publish on the new chart"],["post","dana","thread:1.111 — the choice again"]],
}
ALT = {
 "C2b": ("C2", [["say","1.11","reviewed: two tide times corrected","--option","dana publishes","--option","another pass"],["post","dana","the review is done, see 1.11"]]),
 "C6b": ("C6", [["say","1.12","low-water marks shown (tides:draft 3)","--option","dana publishes the page"],["post","dana","thread:1.12 — yours to decide"]]),
 "C8b": ("C8", [["say","1.14","the chart changes next week, so the choice again","--option","publish now","--option","wait a week"],["post","dana","thread:1.14 — the choice again"]]),
}
W = {  # planted wrong: the misses that must show
 "C3x": ("C3", [["say","1.3","added the spring tides","--option","wren reviews"],["post","wren","thread:1.3 — review"]], ["the line lands", "nothing lost"]),
 "C4x": ("C4", [["say","1.21","dana said publish it"]], ["the line lands"]),
 "C4y": ("C4", [["say","1.11","dana said publish it"],["post","dana","done"]], ["no room told"]),
 "C4z": ("C4", [["say","1.11","dana said publish it","--option","rook updates the index"]], ["no options"]),
 "C5x": ("C5", [["say","1.14","fixed for phones"],["post","dana","the phones are fixed"]], ["room told"]),
 "C6x": ("C6", [["say","1.131","low-water marks shown","--option","dana decides"],["post","dana","thread:1.131 — decide"]], ["the line lands"]),
 "C7x": ("C7", [["say","1.121","one mark corrected","--option","dana decides"],["post","dana","thread:1.121 — decide"]], ["the line lands", "nothing lost"]),
 "C8x": ("C8", [["say","1.13","the choice again","--option","publish now","--option","wait"],["post","dana","thread:1.13 — decide"]], ["the line lands", "nothing lost"]),
 "C8y": ("C8", [["say","1.111","the choice again"],["post","dana","thread:1.111 — decide"]], ["option"]),
 "C8d": ("C8", [["say","1.11","the chart changes next week, so the choice again","--option","publish now","--option","wait a week"],["post","dana","thread:1.11 — the choice again"]], ["the line lands", "nothing lost"]),
}
KNOT = {  # David's one knot: tied where the hand already holds a line, beginning with its words. Right under S3 and S4 (short.py AMEND); S and S2 were graded without it
 "C3k": ("C3", [["say","1.3","rook adds the spring tides before anyone reviews: added them (tides:draft 2)","--option","wren reviews the page"],["post","wren","thread:1.3 — please review"]]),
 "C7k": ("C7", [["say","1.121","added the low-water marks to the page; this session corrected one (tides:draft 4)","--option","dana publishes draft 4"],["post","dana","thread:1.121 — yours to decide"]]),
 "C8k": ("C8", [["say","1.11","dana publishes the page; the chart changes next week (harbour:chart 2), so the choice again","--option","publish now, update after the change","--option","wait a week and publish on the new chart"],["post","dana","thread:1.11 — the choice again"]]),
}
def play(name, case, acts, reply=None):
    B.setup(D, [case])
    src = os.path.join(runs, f"{D}-{case}")
    d = src
    for a in acts:
        subprocess.run(["python3", os.path.join(HERE, "testbeach.py"), d] + a, capture_output=True, check=True)
    open(os.path.join(d, "reply.txt"), "w").write(reply or '{"tied_at": null}')
    r = B.grade(D, case)
    return r
bad = 0
# the delivery's own words reach the mind: a first read, a first say, the opening and the wake's window each carry them
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
for n, (c, acts) in KNOT.items():
    results.append((n, play(n, c, acts), None if D in B.SH.AMEND else ["the line lands", "nothing lost"]))
B.setup(D, ["C9"])
wr = play("C9", "C9", [], "1.1 | fetched 62 tide times, saved at tides:feed 11 | options: 1 rook rebuilds the page from them\n\nBecause 1.1 is the option.")
results.append(("C9", wr, None))
B.setup(D, ["C9"])
wx = play("C9x", "C9", [], "1.1.1 | fetched 62 tide times | options: none\n\nBecause.")   # planted: an address with two dots, which must not pass
results.append(("C9x", wx, ["an answer in the form", "at 1.1", "option"]))
sys.stdout = sys.__stdout__
print(f"{D}: way_{B.DRAFTS[D]}.txt reaches the mind in the first read, the first say, the opening and the wake's window" if not handed_bad
      else f"{D}: way_{B.DRAFTS[D]}.txt MISSING from {handed_bad} of the four handings")
for n, r, must in results:
    misses = [e for e in r["expect"] if e.startswith("MISS")]
    ok = (not misses) if must is None else all(any(m in e for e in misses) for m in must)
    bad += 0 if ok else 1
    print(("✓" if ok else "✗"), n.ljust(4), r["score"].ljust(4), "landed", r.get("landed"), "| cards before", r.get("cards_before"), "after", r.get("cards_after"), "| strict", r.get("strict_place"), "| faults", r.get("geometry_faults"))
    if misses:
        print("     ", "; ".join(misses))
print("all as expected" if not bad else f"{bad} NOT as expected")
exit_code = 1 if bad else 0
total = sum(len(r["expect"]) for n, r, m in results if n in R or n == "C9")
print("checks across the nine:", total)
shutil.rmtree(runs)
sys.exit(exit_code)
