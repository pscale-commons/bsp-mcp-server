#!/usr/bin/env python3
"""run-bsp-tests.py — run the 72-case bsp-test battery against a bsp and report.

The cases are read from ../src/bsp-test.json, the block bsp-mcp serves as
pscale://bsp-test (eight batteries at digits 1-8, nine cases each); the
fixtures they run against sit beside this script. For each case:
    parse the call
    invoke the bsp on the appropriate fixture
    extract key markers from the canonical answer
    verify the shape, the entry count and each marker in the output
    report match or divergence

Run from anywhere:
    python3 bsp-test-materials/run-bsp-tests.py            # bsp-alt.py, the reference
    python3 bsp-test-materials/run-bsp-tests.py mcp        # this repo's walker, src/bsp-fn.ts
    python3 bsp-test-materials/run-bsp-tests.py my-bsp.py  # any bsp with bsp-alt.py's CLI
"""
import json
import re
import subprocess
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent
SUITE = json.loads((HERE.parent / "src" / "bsp-test.json").read_text())
IMPL = sys.argv[1] if len(sys.argv) > 1 else "bsp-alt.py"
IMPL = str(HERE / "bsp-mcp-driver.py") if IMPL == "mcp" else str(Path(IMPL).resolve() if Path(IMPL).exists() else HERE / IMPL)


BATTERIES = [
    ("1", "test-spatial-floor3.json", "spatial-floor3"),
    ("2", "sunstone.json", "sunstone"),
    ("3", "sunstone.json", "star"),
    ("4", "absorb-floor1.json", "absorption"),
    ("5", "test-spatial-floor3.json", "reverse"),
    ("6", "test-spatial-floor3.json", "edge"),
    ("7", "test-spatial-floor3.json", "canonical"),
    ("8", "subnest-before.json", "nesting"),
]


# For the reverse battery, branch.1 holds the human-facing prompt and
# branch.2 holds the canonical bsp call. For the forward batteries,
# branch.1 holds the call directly. This map names which branch position
# holds the executable call per battery.
CALL_BRANCH = {
    "reverse": "2",
}


# Some calls in test files use special tokens for the spindle, like an
# empty string (E8: 'spindle='). The parse_call regex won't match those,
# so we hardcode the spindle here per branch where needed. None means
# "no spindle override; let parse_call do its thing".
SPINDLE_OVERRIDE = {
    "edge": {
        "8": "",     # empty spindle — the regex won't match `spindle=,`
    },
}


# Per-branch fixture overrides for batteries that span multiple fixtures.
FIXTURE_OVERRIDE = {
    "absorption": {
        "1": "absorb-floor1.json",
        "2": "absorb-floor2.json",
        "3": "absorb-floor3.json",
        "4": "absorb-floor1.json",
        "5": "absorb-floor2.json",
        "6": "absorb-floor3.json",
        "7": "absorb-floor1.json",
        "8": "absorb-floor2.json",
        "9": "absorb-floor3.json",
    },
    "reverse": {
        "1": "test-spatial-floor3.json",
        "2": "sunstone.json",
        "3": "test-spatial-floor3.json",
        "4": "test-spatial-floor3.json",
        "5": "sunstone.json",
        "6": "sunstone.json",
        "7": "sunstone.json",
        "8": "test-spatial-floor3.json",
        "9": "sunstone.json",
    },
    "canonical": {
        "1": "test-spatial-floor3.json",
        "2": "test-spatial-floor3.json",
        "3": "test-spatial-floor3.json",
        "4": "test-spatial-floor3.json",
        "5": "absorb-floor3.json",
        "6": "absorb-floor3.json",
        "7": "test-spatial-floor3.json",
        "8": "test-spatial-floor3.json",
        "9": "test-spatial-floor3.json",
    },
    "nesting": {
        "1": "subnest-before.json",
        "2": "subnest-after.json",
        "3": "subnest-before.json",
        "4": "subnest-after.json",
        "5": "super-before.json",
        "6": "super-after.json",
        "7": "super-before.json",
        "8": "super-after.json",
        "9": "subnest-after.json",
    },
}


def parse_call(call_str):
    """Extract spindle and pscale from a call string like 'bsp(block=X, spindle=Y, pscale=Z)'.

    Captures the spindle as everything up to the next comma or closing paren,
    so invalid characters in the spindle (used by edge-case tests) survive the
    parse and reach bsp-alt's parser as-is.
    """
    spindle = None
    pscale = None
    m = re.search(r"spindle=([^,)]+)", call_str)
    if m:
        spindle = m.group(1).strip()
    m = re.search(r"pscale=(-?[0-9]+)", call_str)
    if m:
        pscale = int(m.group(1))
    return spindle, pscale


def run_bsp(fixture, spindle, pscale):
    """Run the bsp under test with the given parameters, return parsed JSON output.

    Errors (InvalidAddressError etc.) come back with shape='error' and an
    'error_message' field, so they can be asserted against like any other
    shape.
    """
    cmd = ["python3", IMPL, str(HERE / fixture)]
    if spindle is not None:
        cmd += ["--spindle", str(spindle)]
    if pscale is not None:
        cmd += ["--pscale", str(pscale)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return {"shape": "error", "error_message": r.stderr.strip()}
    return json.loads(r.stdout)


def extract_content_strings(result):
    """Flatten any content strings out of a bsp-alt result for marker matching."""
    out = []
    if result.get("shape") == "block":
        # whole block — flatten all string values
        def walk(node):
            if isinstance(node, str):
                out.append(node)
            elif isinstance(node, dict):
                for v in node.values():
                    walk(v)
        walk(result.get("block", {}))
    elif result.get("shape") in ("path-walk", "disc"):
        for e in result.get("entries", []):
            c = e.get("content")
            if isinstance(c, str):
                out.append(c)
    elif result.get("shape") == "point":
        c = result.get("content")
        if isinstance(c, str):
            out.append(c)
        note = result.get("note")
        if isinstance(note, str):
            out.append(note)
    elif result.get("shape") == "error":
        msg = result.get("error_message")
        if isinstance(msg, str):
            out.append(msg)
    elif result.get("shape") == "path-walk+descent":
        for e in result.get("path_walk", []):
            c = e.get("content")
            if isinstance(c, str):
                out.append(c)
        for e in result.get("descent", []):
            c = e.get("content")
            if isinstance(c, str):
                out.append(c)
    elif result.get("shape") == "star":
        sem = result.get("semantic")
        if isinstance(sem, str):
            out.append(sem)
        inner = result.get("inner")
        if inner is not None:
            out.extend(extract_content_strings(inner))
    return out


# Canonical shape per branch — the bsp result's `shape` field must equal this.
SHAPES = {
    "spatial-floor3": {
        "1": "block", "2": "path-walk", "3": "path-walk", "4": "path-walk",
        "5": "path-walk", "6": "disc", "7": "disc", "8": "point",
        "9": "path-walk+descent",
    },
    "sunstone": {
        "1": "block", "2": "path-walk", "3": "path-walk", "4": "path-walk",
        "5": "path-walk", "6": "disc", "7": "point", "8": "point",
        "9": "path-walk+descent",
    },
    "star": {
        "1": "star", "2": "star", "3": "star", "4": "star",
        "5": "star", "6": "star", "7": "star", "8": "star", "9": "star",
    },
    "absorption": {
        "1": "point", "2": "point", "3": "point", "4": "point",
        "5": "point", "6": "point", "7": "disc", "8": "disc", "9": "disc",
    },
    "reverse": {
        "1": "path-walk", "2": "path-walk", "3": "disc",
        "4": "path-walk+descent", "5": "path-walk", "6": "star",
        "7": "disc", "8": "disc", "9": "star",
    },
    "edge": "FROM_BRANCH_4",
    "canonical": "FROM_BRANCH_4",
    "nesting": "FROM_BRANCH_4",
}


# Canonical entry count per branch — for shapes that carry counted entries
# (path-walk, disc, path-walk+descent). None means no count assertion.
COUNTS = {
    "spatial-floor3": {
        "1": None, "2": 1, "3": 3, "4": 4, "5": 6,
        "6": 6, "7": 2, "8": None, "9": (3, 5),
    },
    "sunstone": {
        "1": None, "2": 1, "3": 2, "4": 2, "5": 2,
        "6": 10, "7": None, "8": None, "9": (1, 5),
    },
    "star": {
        # Star entries are best left uncounted at the top — the inner result
        # carries its own count when applicable.
    },
    "absorption": {
        "1": None, "2": None, "3": None, "4": None, "5": None,
        "6": None, "7": 4, "8": 4, "9": 4,
    },
    "reverse": {
        "1": 5,                     # path-walk of 5 to reach BELLOWS at 123.41
        "2": 2,                     # path-walk of 2 to reach Soliton stabilisation at 55
        "3": 2,                     # disc at pscale -1 → HEARTH, STOVE
        "4": (3, 2),                # path-walk + 1-layer descent: 3 path + 2 descent
        "5": 2,                     # path-walk of 2 to reach the koan at 71
        "6": None,                  # star shape, inner block, uncountable at top
        "7": 10,                    # disc at pscale 0 of sunstone
        "8": 3,                     # disc at pscale -2 of spatial
        "9": None,                  # star with inner disc, uncountable at top
    },
    "edge": "FROM_BRANCH_5",
    "canonical": "FROM_BRANCH_5",
    "nesting": "FROM_BRANCH_5",
}


# Canonical markers — substrings expected in each test result's content.
# Drawn from the canonical answers in the bsp-test files.
MARKERS = {
    "spatial-floor3": {
        "1": ["THORNKEEP", "TAVERN", "KITCHEN", "HEARTH", "BELLOWS", "FLOOR TERMINUS"],
        "2": ["THORNKEEP"],
        "3": ["THORNKEEP", "TAVERN", "KITCHEN"],
        "4": ["THORNKEEP", "TAVERN", "KITCHEN", "HEARTH"],
        "5": ["THORNKEEP", "TAVERN", "KITCHEN", "HEARTH", "POT-HOOK", "IRON CHAIN"],
        "6": ["FLOOR TERMINUS", "AT-FLOOR-VIA-UNDERSCORE", "KITCHEN", "COMMON ROOM", "FISHMONGER", "LAMP ROOM"],
        "7": ["HEARTH", "STOVE"],
        "8": ["TAVERN"],
        "9": ["THORNKEEP", "TAVERN", "KITCHEN", "HEARTH", "STOVE", "BELLOWS", "ASH PIT", "POT-HOOK"],
    },
    "sunstone": {
        "1": ["Sunstone", "As geometry", "As function", "As reflexive", "As design"],
        "2": ["As composition"],
        "3": ["As composition", "Soliton stabilisation"],
        "4": ["As reflexive", "The entity reading this exists"],
        "5": ["As design", "spectrum from passive to active"],
        "6": ["Sunstone", "As geometry", "As function", "As access", "As substrate", "As composition", "As commons", "As reflexive", "As voicing", "As design"],
        "7": ["As composition"],
        "8": ["Soliton stabilisation"],
        "9": ["As composition", "Star is the composition operator", "Block references", "Self-reference", "PCT mapping", "Soliton stabilisation"],
    },
    "star": {
        "1": ["As composition"],
        "2": ["As geometry"],
        "3": ["As reflexive", "1.1", "2.1", "5.3", "7.1"],
        "4": ["As design"],
        "5": ["As composition", "2"],
        "6": ["As reflexive", "1.1"],
        "7": ["As reflexive", "7.1"],
        "8": ["As reflexive", "1.1", "2.1", "5.3", "7.1"],
        "9": ["As composition", "2"],
    },
    "absorption": {
        "1": ["POSITION ONE"],
        "2": ["POSITION ONE"],
        "3": ["POSITION ONE"],
        "4": ["POSITION NINE-ONE"],
        "5": ["POSITION NINE-ONE"],
        "6": ["POSITION NINE-ONE"],
        "7": ["FLOOR TERMINUS", "POSITION ONE", "POSITION FIVE", "POSITION NINE"],
        "8": ["FLOOR TERMINUS", "POSITION ONE", "POSITION FIVE", "POSITION NINE"],
        "9": ["FLOOR TERMINUS", "POSITION ONE", "POSITION FIVE", "POSITION NINE"],
    },
    # Reverse markers live in branch.3 of bsp-test-reverse.json; loaded dynamically.
    "reverse": "FROM_BRANCH_3",
    # Edge battery encodes markers at branch.3 (same field as reverse).
    "edge": "FROM_BRANCH_3",
    # Canonical battery uses the same structure as edge — markers at branch.3.
    "canonical": "FROM_BRANCH_3",
    # Nesting battery — same structure.
    "nesting": "FROM_BRANCH_3",
}


def check_markers(content_strings, markers):
    joined = "\n".join(content_strings)
    missing = [m for m in markers if m not in joined]
    return missing


def count_entries(result):
    """Return entry counts per shape — for path-walk, disc, path-walk+descent."""
    shape = result.get("shape")
    if shape in ("path-walk", "disc"):
        return {"entries": len(result.get("entries", []))}
    if shape == "path-walk+descent":
        return {
            "path_walk": len(result.get("path_walk", [])),
            "descent": len(result.get("descent", [])),
        }
    return {}


def main():
    total = 0
    passes = 0
    print(f"bsp under test: {IMPL}")
    for battery, default_fixture, label in BATTERIES:
        print(f"\n=== Battery {battery}: {label} (bsp-test {battery}) ===")
        tests = SUITE[battery]
        call_branch = CALL_BRANCH.get(label, "1")
        for branch in sorted(k for k in tests if k.isdigit()):
            total += 1
            test = tests[branch]
            call = test.get(call_branch, "")
            spindle, pscale = parse_call(call)
            override = SPINDLE_OVERRIDE.get(label, {}).get(branch)
            if override is not None:
                spindle = override
            fixture = FIXTURE_OVERRIDE.get(label, {}).get(branch, default_fixture)
            result = run_bsp(fixture, spindle, pscale)
            content = extract_content_strings(result)
            shape = result.get("shape", "?")

            # Markers — from MARKERS map, or from branch.3 for reverse, or
            # from branch.6 for the edge battery.
            if MARKERS.get(label) == "FROM_BRANCH_3":
                markers = test.get("3", [])
            elif MARKERS.get(label) == "FROM_BRANCH_6":
                markers = test.get("6", [])
            else:
                markers = MARKERS[label].get(branch, [])

            # Expected shape — from SHAPES map, or branch.4 for edge battery.
            if SHAPES.get(label) == "FROM_BRANCH_4":
                expected_shape = test.get("4")
            else:
                expected_shape = SHAPES[label].get(branch)

            # Expected count — from COUNTS map, or branch.5 for edge battery.
            if COUNTS.get(label) == "FROM_BRANCH_5":
                expected_count = test.get("5")
            else:
                expected_count = COUNTS.get(label, {}).get(branch)

            problems = []
            missing = check_markers(content, markers)
            if missing:
                problems.append(f"missing markers: {missing}")
            if expected_shape and shape != expected_shape:
                problems.append(f"shape was '{shape}', expected '{expected_shape}'")
            if expected_count is not None:
                actual_count = count_entries(result)
                if isinstance(expected_count, tuple):
                    pw_count, desc_count = expected_count
                    if pw_count is not None and actual_count.get("path_walk") != pw_count:
                        problems.append(
                            f"path_walk count {actual_count.get('path_walk')}, expected {pw_count}"
                        )
                    if desc_count is not None and actual_count.get("descent") != desc_count:
                        problems.append(
                            f"descent count {actual_count.get('descent')}, expected {desc_count}"
                        )
                else:
                    total_entries = actual_count.get("entries")
                    if total_entries != expected_count:
                        problems.append(
                            f"entry count {total_entries}, expected {expected_count}"
                        )

            if not problems:
                passes += 1
                print(f"  branch {branch}: PASS (fixture={fixture}, shape={shape})")
            else:
                print(f"  branch {branch}: FAIL (fixture={fixture}, {'; '.join(problems)})")
    print(f"\n=== Summary: {passes}/{total} tests passed ===")
    return 0 if passes == total else 1


if __name__ == "__main__":
    sys.exit(main())
