#!/usr/bin/env python3
"""run-compound-tests.py — run the compound-test battery against a compositor and report.

The cases are read from ../src/compound-test.json, the block bsp-mcp serves as
pscale://compound-test: three operation batteries of nine at digits 1-3, the
form cases at 4. For each case:
    parse the call
    run the target on the named compound folder (ten seconds at most)
    check the shape, the count, each marker and each absent marker
    hold an alignment to the physics walker, and a window to slot order
      and to the reference grammar
    report match or divergence

Run from anywhere:
    python3 compound-test-materials/run-compound-tests.py               # compound-alt.py, the reference
    python3 compound-test-materials/run-compound-tests.py mcp           # bsp-mcp, bundles at the bundle door
    python3 compound-test-materials/run-compound-tests.py mcp-frame     # bsp-mcp, bundles at the frame door
    python3 compound-test-materials/run-compound-tests.py my-cli        # any program sharing the CLI
    ... --known 2.4,3.6                                                 # cases expected to diverge
"""
import importlib.util
import json
import os
import re
import signal
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
SUITE = json.loads((REPO / "src" / "compound-test.json").read_text())
TSX = str(REPO / "node_modules" / ".bin" / "tsx")
CLI = str(REPO / "scripts" / "compound-cli.ts")
TARGETS = {
    "alt": ["python3", str(HERE / "compound-alt.py")],
    "mcp": [TSX, CLI, "--door", "bundle"],
    "mcp-frame": [TSX, CLI, "--door", "frame"],
}
FORM = ["python3", str(HERE / "compound-form.py")]
TIMEOUT = 10

_spec = importlib.util.spec_from_file_location("bsp_alt", REPO / "bsp-test-materials" / "bsp-alt.py")
BSP = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(BSP)
_spec = importlib.util.spec_from_file_location("compound_alt", HERE / "compound-alt.py")
ALT = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ALT)  # the grammar only: what parses as a reference


def target_command(arg):
    if arg in TARGETS:
        return TARGETS[arg]
    path = Path(arg).resolve()
    return ["python3", str(path)] if path.suffix == ".py" else [str(path)]


def parse_call(call):
    """'align(floors: one, two, pscale=0)' → ('align', 'floors', ['one', 'two'], {'pscale': '0'})."""
    m = re.match(r"^(\w+)\((.*)\)$", call.strip())
    verb, inner = m.group(1), m.group(2)
    if verb == "form":
        return verb, inner.strip(), [], {}
    compound, _, rest = inner.partition(": ")
    args, opts = [], {}
    for part in [p.strip() for p in rest.split(", ")] if verb in ("align", "compile") else [rest.strip()]:
        key, eq, val = part.partition("=")
        if eq and key in ("pscale", "slot"):
            opts[key] = val
        else:
            args.append(part)
    return verb, compound.strip(), args, opts


def run(cmd, verb, compound, args, opts):
    full = (FORM + [str(HERE / compound)]) if verb == "form" else (cmd + [verb, str(HERE / compound)] + args)
    if "pscale" in opts:
        full += ["--pscale", opts["pscale"]]
    # Its own process group, so a call that never returns is stopped whole.
    p = subprocess.Popen(full, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True)
    try:
        out, err = p.communicate(timeout=TIMEOUT)
    except subprocess.TimeoutExpired:
        os.killpg(p.pid, signal.SIGKILL)
        p.communicate()
        return {"shape": "timeout", "note": f"no answer in {TIMEOUT} seconds"}
    if p.returncode != 0:
        return {"shape": "error", "note": err.strip()[-500:]}
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return {"shape": "error", "note": "not JSON: " + out[:200]}


def count_of(result):
    shape = result.get("shape")
    if shape == "aligned":
        return len(result.get("levels", []))
    if shape == "window":
        return len(result.get("members", []))
    if shape == "form":
        return len(result.get("faults", []))
    content = result.get("content")
    if shape in ("disc", "path-walk") and isinstance(content, list):
        return len(content)
    return None


def disc_law(compound, result):
    """Each block's side at a pscale is that block's own disc there, as the
    physics walker reads it, printed full width from the floor; the levels run
    coarse to fine, each once, and are every level the blocks hold."""
    problems = []
    pscales = [lvl["pscale"] for lvl in result.get("levels", [])]
    if pscales != sorted(set(pscales), reverse=True):
        problems.append(f"levels not coarse to fine, each once: {pscales}")
    home = {}
    folder = HERE / compound
    for f in folder.iterdir():
        if f.suffix == ".json":
            home[unquote(f.stem)] = json.loads(f.read_text())
    blocks = [b["name"] for b in result.get("blocks", [])]
    for lvl in result.get("levels", []):
        for name in blocks:
            block = home.get(name)
            if block is None:
                problems.append(f"{name} is aligned but does not stand")
                continue
            floor = BSP.floor_depth(block)
            want = [{"address": full_width(e["address"].split(","), floor), "walk": e["address"], "text": e["content"]}
                    for e in BSP.collect_disc(block, floor - lvl["pscale"])]
            got = [{"address": e.get("address"), "walk": e.get("walk"), "text": e.get("text")} for e in lvl["sides"].get(name, [])]
            if got != want:
                problems.append(f"{name} at pscale {lvl['pscale']} is not its own disc: got {got}, the walker reads {want}")
    return problems


def full_width(digits, floor):
    left = "".join(digits[:floor]).ljust(floor, "0")
    return left + ("." + "".join(digits[floor:]) if len(digits) > floor else "")


def check(case, result, opts, verb, compound):
    problems = []
    subject = result
    if "slot" in opts and result.get("shape") == "window":
        subject = next((m for m in result["members"] if m.get("slot") == opts["slot"]), {"shape": "missing"})
    dump = json.dumps(subject, ensure_ascii=False)
    if subject.get("shape") != case["4"]:
        problems.append(f"shape {subject.get('shape')!r}, expected {case['4']!r}" + (f" — {subject['note']}" if subject.get("note") else ""))
    if case["5"] is not None and count_of(subject) != case["5"]:
        problems.append(f"count {count_of(subject)}, expected {case['5']}")
    for marker in case["3"]:
        if marker not in dump:
            problems.append(f"missing marker {marker!r}")
    for marker in case.get("6", []):
        if marker in dump:
            problems.append(f"holds absent marker {marker!r}")
    if verb == "align" and result.get("shape") == "aligned":
        problems += disc_law(compound, result)
    if verb == "compile" and result.get("shape") == "window":
        problems += window_law(result["members"])
    return problems


def window_law(members, at=""):
    """Members stand in slot order, and a member is a reference exactly when
    its leaf parses in the reference grammar, a prose member's content being
    its leaf as written. The star form is 2.8's and 3.6's to hold, not this."""
    problems = []
    slots = [m.get("slot") for m in members]
    if slots != sorted(slots):
        problems.append(f"members{at} not in slot order: {slots}")
    for m in members:
        leaf, here = m.get("leaf"), f"{at} slot {m.get('slot')}"
        if isinstance(leaf, str) and not ALT.parse_star(leaf):
            if ALT.parse_reference(leaf) and m.get("kind") != "reference":
                problems.append(f"{here}: {leaf!r} is a reference, delivered as {m.get('kind')}")
            if not ALT.parse_reference(leaf) and (m.get("kind") != "prose" or m.get("content") != leaf):
                problems.append(f"{here}: {leaf!r} is prose, delivered as {m.get('kind')} {m.get('content')!r}")
        if m.get("members"):
            problems += window_law(m["members"], here)
    return problems


def main(argv):
    known = set()
    if "--known" in argv:
        i = argv.index("--known")
        known = set(argv[i + 1].split(","))
        argv = argv[:i] + argv[i + 2:]
    target = argv[0] if argv else "alt"
    cmd = target_command(target)
    print(f"compound-test against {target}")
    failed, passed, stale = [], 0, []
    for battery in "1234":
        print(f"\n{battery} — {SUITE[battery]['_'].split(' — ')[0]}")
        for k in "123456789":
            case = SUITE[battery].get(k)
            if not isinstance(case, dict):
                continue
            label = f"{battery}.{k}"
            verb, compound, args, opts = parse_call(case["1"])
            result = run(cmd, verb, compound, args, opts)
            problems = check(case, result, opts, verb, compound)
            if not problems:
                passed += 1
                if label in known:
                    stale.append(label)
                    print(f"  ✓ {label} {case['_'][:78]}  (named known, and it passes — drop it from --known)")
                else:
                    print(f"  ✓ {label} {case['_'][:78]}")
            else:
                tag = "known" if label in known else "✗"
                if label not in known:
                    failed.append(label)
                print(f"  {tag} {label} {case['_'][:78]}")
                for p in problems:
                    print(f"      {p[:400]}")
    print(f"\n{passed} passed, {len(failed)} diverged" + (f" ({', '.join(failed)})" if failed else "")
          + (f", {len(known) - len(stale)} known" if known else "") + (f"; known but passing: {', '.join(stale)}" if stale else ""))
    return 1 if failed or stale else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
