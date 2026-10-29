"""Plant one fault at a time in a well-formed thread and see whether the checker catches it.
keel, 29 October 2026; set in the thread-test sentinel by weft (lane threads.3). Exits 1 unless
every planted fault is caught and the unplanted thread is clean."""
import json, copy, sys, os, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import thread_form as TF
RUNS = os.environ.get("THREAD_TEST_RUNS") or os.path.join(HERE, "runs")
TMP = tempfile.mkdtemp(prefix="thread-mutation-")
base = json.load(open(os.path.join(RUNS, 'SELFTEST-C2/state.json')))
base['names'] = ["tides:draft", "tides:live", "pool:tides"]

def put(s, hand, path, text):
    n = s['mirrors'].setdefault(hand, {})
    for d in path[:-1]:
        if isinstance(n.get(d), str):
            n[d] = {"_": n[d]}
        n = n.setdefault(d, {})
    if isinstance(n.get(path[-1]), dict):
        n[path[-1]]['_'] = text
    else:
        n[path[-1]] = text

M = [
    ("a line at a zero position", lambda s: s['mirrors']['wren']['1']['1'].update({"0": "a summary by hand"}), "DIGITS", False),
    ("a line beneath an empty address", lambda s: put(s, 'dana', list('1221'), "fixed something · waits on rook"), "ROOTED", False),
    ("a gap beneath a knot", lambda s: put(s, 'rook', list('15'), "a step that skipped a digit · waits on dana"), "CONTIGUOUS", False),
    ("a live end that waits on nobody", lambda s: s['mirrors']['wren']['1']['1'].__setitem__('_', "reviewed the draft · read: tides:draft 2"), "WAITS", False),
    ("a registry line with no opener", lambda s: s['registry'].__setitem__('1', "the tide-table page"), "OPENED", False),
    ("a mirror under an unopened number", lambda s: s['mirrors']['wren'].__setitem__('7', "started something · waits on dana"), "REGISTERED", False),
    ("a crossing to a place nobody holds", lambda s: s['mirrors']['wren']['1']['1'].__setitem__('_', "reviewed; the rest goes on at thread:2.4 · waits on dana"), "CROSSING", False),
    ("an act of 700 characters (phase 2)", lambda s: s['mirrors']['wren']['1']['1'].__setitem__('_', "x" * 700 + " · waits on dana"), "SHORT", True),
    ("no knot at the number", lambda s: s['mirrors']['rook'].__setitem__('1', {"1": "wren reviews the draft"}), "KNOTTED", False),
    ("an act without the closing clause (phase 2)", lambda s: s['mirrors']['wren']['1']['1'].__setitem__('_', "reviewed the draft; it waits on dana now"), "WAITS", True),
    ("an option beneath an option", lambda s: put(s, 'dana', list('1121'), "a loose option"), "OFFERED", False),
]
caught = 0
for name, mut, test, p2 in M:
    s = copy.deepcopy(base)
    mut(s)
    path = os.path.join(TMP, 'mut.json')
    json.dump(s, open(path, 'w'))
    v = TF.View.state(path)
    F, _ = TF.check(v, "1", p2)
    got = {x['test'] for x in F if x['level'] == 'FAULT'} | ({"REGISTERED"} if v.orphans() else set())
    ok = test in got
    caught += ok
    print(f"{'caught' if ok else 'MISSED'}  {name:45} FAULT {test:10} got {sorted(got)}")
s = copy.deepcopy(base); json.dump(s, open(os.path.join(TMP, 'mut.json'), 'w'))
F, _ = TF.check(TF.View.state(os.path.join(TMP, 'mut.json')), "1", True)
clean = not [x for x in F if x['level'] == 'FAULT']
print(f"{caught}/{len(M)} planted faults caught; the unplanted thread: {[x['test'] for x in F if x['level']=='FAULT'] or 'no fault'}")
sys.exit(0 if caught == len(M) and clean else 1)
