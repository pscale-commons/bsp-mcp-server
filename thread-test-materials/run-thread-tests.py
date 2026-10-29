#!/usr/bin/env python3
"""run-thread-tests.py — the thread battery's CI pass. It spends nothing.

  1. THE FORM PASS over keel's hand-played threads (runs/SELFTEST-*): each one is
     well formed under function:thread as it stands.
  2. THE PLANTED FAULTS (mutation.py): every one is caught, and the unplanted
     thread stays clean.
  3. KEEL'S RUNS of 29 October, re-graded from their stored replies: the grader
     still gives the totals he reported (pool:threads 11), so a change to the
     checker or the grading that moves a verdict is seen.

The runs are copied to a scratch directory first, so grading writes nothing here.
Fresh minds are run-minds.sh's, and they run only on David's word, because they
spend model calls (proposals/2026-10-29-threads-phase-2.md).

  python3 thread-test-materials/run-thread-tests.py
"""
import glob, json, os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
# delivery: (checks passed, checks, well formed under the first law, under the law as it stands)
EXPECT = {"L": (36, 40, 8, 3), "W1": (31, 40, 9, 9), "Lx2": (35, 40, 8, 5), "W2": (40, 40, 9, 9)}

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

print("── 3. keel's runs, re-graded from their replies ──")
for dname, (want, of, v1, p2) in EXPECT.items():
    r = subprocess.run(py + [os.path.join(HERE, "battery.py"), "score", dname], capture_output=True, text=True, env=env)
    rows = json.load(open(os.path.join(runs, f"scores-{dname}.json"))) if r.returncode == 0 else []
    got = sum(int(x["score"].split("/")[0]) for x in rows if "score" in x)
    total = sum(int(x["score"].split("/")[1]) for x in rows if "score" in x)
    wf1 = sum(1 for x in rows if x.get("form_v1") == "WELL FORMED")
    wf2 = sum(1 for x in rows if x.get("form_p2") == "WELL FORMED")
    say((got, total, wf1, wf2) == (want, of, v1, p2),
        f"{dname}: {got}/{total} checks, well formed {wf1} of 9 under the first law and {wf2} under the law as it stands"
        + ("" if (got, total, wf1, wf2) == (want, of, v1, p2) else f" (keel reported {want}/{of}, {v1} and {p2})"))

shutil.rmtree(tmp, ignore_errors=True)
print(f"\nthread-test: {'all passed' if not failed else str(len(failed)) + ' failed'}")
sys.exit(1 if failed else 0)
