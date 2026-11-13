#!/usr/bin/env python3
"""run-thread-tests.py — the thread battery's CI pass. It spends nothing.

  1. THE FORM PASS over keel's hand-played threads (runs/SELFTEST-*): each one is
     well formed under function:thread as it stands.
  2. THE PLANTED FAULTS (mutation.py): every one is caught, and the unplanted
     thread stays clean.
  3. THE RUNS, re-graded from their stored replies: keel's of 29 October and weft's
     of 2 November on the re-cut law: the law whole, as a live read meets it, with the
     read handing over the way, with the opening handing it over too, the way given
     whole on place alone, and the way's third draft; and weft's of 2 and 3 November on
     David's form with no keyword, S, S2, S3 and S4, and of 4 November with the endings back,
     E1 and E2, graded by short.py. The grader still
     gives the totals reported (pool:threads 11, 14, 15, 16, 17 and 18, and for S to S4
     proposals/2026-11-03-threads-without-the-keyword.md), so a change to the checker or
     the grading that moves a verdict is seen.
  4. THE SHORT FORM'S HAND-PLAYED ACTS (selftest_s.py, and selftest_e.py for E1, E2, K1 and K2), for S to K2: each
     delivery's words reach the mind at all four handings, the strict spelling reads six
     written places as it should, every right act takes full marks, and every planted
     wrong act is caught.

The runs are copied to a scratch directory first, so grading writes nothing here.
Fresh minds are run-minds.sh's, and they run only on David's word, because they
spend model calls (proposals/2026-10-29-threads-phase-2.md).

  python3 thread-test-materials/run-thread-tests.py
"""
import glob, json, os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
# delivery: (checks passed, checks, well formed under the first law, under the law as it stands)
EXPECT = {"L": (36, 40, 8, 3), "W1": (31, 40, 9, 9), "Lx2": (35, 40, 8, 5), "W2": (40, 40, 9, 9), "L2": (35, 40, 9, 9), "R": (16, 40, 3, 3), "H": (31, 40, 8, 8), "H2": (37, 40, 9, 9), "W2x2": (4, 4, 1, 1), "H3": (40, 40, 9, 9),
          # David's form: no seed carries the closing clause, so the form pass's WAITS fails every thread by design
          "S": (34, 35, 0, 0), "S2": (30, 35, 0, 0), "S3": (33, 35, 0, 0), "S4": (31, 35, 0, 0),
          # the endings back, 4 November: ten uses each (later the tenth), the law as it stands reading endings again
          "E1": (43, 47, 10, 9), "E2": (44, 47, 10, 10),
          # the co-knot, 13 November: E2's way with one sentence more, eleven uses (tie the eleventh); missed its gate
          "K1": (49, 53, 9, 9)}

failed = []


def say(ok, what):
    print(("  ✓ " if ok else "  ✗ ") + what)
    if not ok:
        failed.append(what)


tmp = tempfile.mkdtemp(prefix="thread-test-")
runs = os.path.join(tmp, "runs")
shutil.copytree(os.path.join(HERE, "runs"), runs)
env = {**os.environ, "THREAD_TEST_RUNS": runs}
py = [sys.executable, "-I"]

print("── 1. the form pass over keel's hand-played threads ──")
for d in sorted(glob.glob(os.path.join(runs, "SELFTEST-C*"))):
    r = subprocess.run(py + [os.path.join(HERE, "thread_form.py"), "state", os.path.join(d, "state.json")],
                       capture_output=True, text=True, env=env)
    say(r.returncode == 0 and "WELL FORMED" in r.stdout.split("\n", 1)[0], f"{os.path.basename(d)}: {r.stdout.split(chr(10), 1)[0]}")

print("── 2. the planted faults ──")
r = subprocess.run(py + [os.path.join(HERE, "mutation.py")], capture_output=True, text=True, env=env)
print("\n".join("    " + l for l in r.stdout.strip().split("\n")))
say(r.returncode == 0, r.stdout.strip().split("\n")[-1] if r.stdout.strip() else "mutation.py gave nothing")

print("── 3. the runs, re-graded from their replies ──")
for dname, (want, of, v1, p2) in EXPECT.items():
    r = subprocess.run(py + [os.path.join(HERE, "battery.py"), "score", dname], capture_output=True, text=True, env=env)
    rows = json.load(open(os.path.join(runs, f"scores-{dname}.json"))) if r.returncode == 0 else []
    got = sum(int(x["score"].split("/")[0]) for x in rows if "score" in x)
    total = sum(int(x["score"].split("/")[1]) for x in rows if "score" in x)
    wf1 = sum(1 for x in rows if x.get("form_v1") == "WELL FORMED")
    wf2 = sum(1 for x in rows if x.get("form_p2") == "WELL FORMED")
    say((got, total, wf1, wf2) == (want, of, v1, p2),
        f"{dname}: {got}/{total} checks, well formed {wf1} of {sum(1 for x in rows if 'score' in x)} under the first law and {wf2} under the law as it stands"
        + ("" if (got, total, wf1, wf2) == (want, of, v1, p2) else f" (reported {want}/{of}, {v1} and {p2})"))

print("── 4. the short form's hand-played acts ──")
for script, dname in [("selftest_s.py", d) for d in ("S", "S2", "S3", "S4")] + [("selftest_e.py", d) for d in ("E1", "E2", "K1", "K2")]:
    r = subprocess.run(py + [os.path.join(HERE, script), dname], capture_output=True, text=True, env=env)
    lines = r.stdout.strip().split("\n") or [""]
    say(r.returncode == 0, f"{lines[0]}; {lines[-2] if len(lines) > 1 else 'selftest_s.py gave nothing'}")

shutil.rmtree(tmp, ignore_errors=True)
print(f"\nthread-test: {'all passed' if not failed else str(len(failed)) + ' failed'}")
sys.exit(1 if failed else 0)
