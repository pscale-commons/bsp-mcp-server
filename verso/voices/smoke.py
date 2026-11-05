#!/usr/bin/env python3
"""smoke.py — the voices proved end to end on the stand-in.

Renders scripts/standin-1.json to runs/standin-1/, labels it (words and floor),
scores the labels against truth.jsonl and writes runs/standin-1/report.md.
Exits 0 when every check passes, 1 when any fails.

  speaker accuracy  the fraction of words labelled with the right speaker, after
                    the best mapping of labels to A, B, C
  WER               word error rate against the script, both sides lower case
                    without punctuation
  the floor         landings, the quiet stretch, the question met with silence,
                    the interruption seen as a bid, and the same floor tick for
                    tick when the audio is fed block by block as live.py feeds it
"""
import argparse
import json
import platform
import re
import subprocess
import sys
import time
from datetime import date
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import floor  # noqa: E402
import label  # noqa: E402

SCRIPT = HERE / "scripts" / "standin-1.json"
RUN = HERE / "runs" / "standin-1"
MIN_ACCURACY, MAX_WER = 0.90, 0.15


def align(ref: list, hyp: list) -> tuple[list, dict]:
    """Levenshtein alignment of two word lists -> ([(ref_i | None, hyp_j | None)], counts)."""
    n, m = len(ref), len(hyp)
    d = np.zeros((n + 1, m + 1), np.int32)
    d[:, 0], d[0, :] = np.arange(n + 1), np.arange(m + 1)
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            d[i, j] = min(d[i - 1, j] + 1, d[i, j - 1] + 1, d[i - 1, j - 1] + (ref[i - 1] != hyp[j - 1]))
    pairs, c = [], {"sub": 0, "del": 0, "ins": 0, "hit": 0}
    i, j = n, m
    while i or j:
        if i and j and d[i, j] == d[i - 1, j - 1] + (ref[i - 1] != hyp[j - 1]):
            c["hit" if ref[i - 1] == hyp[j - 1] else "sub"] += 1
            pairs.append((i - 1, j - 1))
            i, j = i - 1, j - 1
        elif i and d[i, j] == d[i - 1, j] + 1:
            c["del"] += 1
            pairs.append((i - 1, None))
            i -= 1
        else:
            c["ins"] += 1
            pairs.append((None, j - 1))
            j -= 1
    return pairs[::-1], c


def score_speakers(words: list, truth: list) -> dict:
    """Each word's true speaker from the alignment to the script (the time when it
    aligned to nothing); then the best one-to-one mapping of labels to speakers."""
    from scipy.optimize import linear_sum_assignment
    ref = [(w, u["s"]) for u in truth for w in label.clean(u["text"])]
    pairs, counts = align([w for w, _ in ref], [w["w"] for w in words])
    true = [None] * len(words)
    for i, j in pairs:
        if i is not None and j is not None:
            true[j] = ref[i][1]
    for j, w in enumerate(words):
        if true[j] is None:
            mid = (w["t0"] + w["t1"]) / 2
            near = min(truth, key=lambda u: 0 if u["t0"] <= mid <= u["t1"] else min(abs(u["t0"] - mid), abs(u["t1"] - mid)))
            true[j] = near["s"]
    hyp_l, true_l = sorted({w["s"] for w in words}), sorted({u["s"] for u in truth})
    conf = np.zeros((len(hyp_l), len(true_l)), int)
    for w, t in zip(words, true):
        conf[hyp_l.index(w["s"]), true_l.index(t)] += 1
    r, c = linear_sum_assignment(-conf)
    mapping = {hyp_l[a]: true_l[b] for a, b in zip(r, c)}
    right = sum(1 for w, t in zip(words, true) if mapping.get(w["s"]) == t)
    n_ref = len(ref)
    return {"accuracy": right / len(words), "right": right, "scored": len(words), "mapping": mapping,
            "confusion": {h: dict(zip(true_l, map(int, conf[k]))) for k, h in enumerate(hyp_l)},
            "wer": (counts["sub"] + counts["del"] + counts["ins"]) / n_ref, "ref_words": n_ref, **counts}


def tick_at(fl: list, t: float) -> int:
    return min(len(fl) - 1, max(0, int(round(t / floor.TICK))))


def score_floor(fl: list, truth: list, mapping: dict, landing: float) -> dict:
    inv = {v: k for k, v in mapping.items()}
    land_t = [f["t"] for f in fl if f["landed"]]
    bid_t = [(f["t"], f["bid"]) for f in fl if f["bid"]]
    out = {"landings": len(land_t), "bids": len(bid_t)}
    # every scripted pause past the threshold by a clear margin (Silero's 32 ms frames
    # and late release take ~0.05-0.08 s off a pause), and whether the floor landed in it
    ends = [(a["t1"], b["t0"]) for a, b in zip(truth, truth[1:]) if b["t0"] - a["t1"] >= landing + 0.1]
    hit = [any(e + landing - 0.2 <= t <= nxt + floor.TICK for t in land_t) for e, nxt in ends]
    at_edge = [(a["t1"], b["t0"]) for a, b in zip(truth, truth[1:]) if landing <= b["t0"] - a["t1"] < landing + 0.1]
    out["scripted_pauses_clear"] = len(ends)
    out["landed_in_them"] = sum(hit)
    out["scripted_pauses_at_threshold"] = len(at_edge)
    out["landed_at_threshold"] = sum(any(e + landing - 0.2 <= t <= nxt + floor.TICK for t in land_t)
                                     for e, nxt in at_edge)
    inside = [t for t in land_t if any(u["t0"] + 0.3 < t - landing < u["t1"] - 0.3 for u in truth)]
    out["landings_mid_utterance"] = len(inside)
    # bids against the script: whose speech starts within 0.6 s of the bid
    named, right = 0, 0
    for t, who in bid_t:
        starts = [u for u in truth if -0.6 <= t - u["t0"] <= 0.8]
        if who != "?" and starts:
            named += 1
            right += mapping.get(who) == min(starts, key=lambda u: abs(t - u["t0"]))["s"]
    out["bids_named"], out["bids_named_right"] = named, right
    # the quiet stretch: the longest scripted pause, found as the longest open stretch
    gaps = [(b["t0"] - a["t1"], a, b) for a, b in zip(truth, truth[1:])]
    g, a, b = max(gaps, key=lambda x: x[0])
    st = floor.stats(fl)
    out["quiet"] = {"scripted_s": round(g, 2), "scripted_at": a["t1"], "found_s": st["longest_pause_s"],
                    "found_at": st["longest_pause_at"],
                    "open_peak": max(f["open"] for f in fl[tick_at(fl, a["t1"]):tick_at(fl, b["t0"])])}
    out["quiet"]["ok"] = (abs(out["quiet"]["found_s"] - g) <= 0.5 and st["longest_pause_at"] is not None
                          and abs(st["longest_pause_at"] - a["t1"]) <= 0.5 and out["quiet"]["open_peak"] >= 0.99)
    # the question met with silence: a "?" line, a pause past two seconds, the asker again
    q = [(a, b) for a, b in zip(truth, truth[1:])
         if a["text"].rstrip().endswith("?") and b["t0"] - a["t1"] >= 2.0 and b["s"] == a["s"]]
    out["question"] = None
    if q:
        a, b = q[0]
        seg = fl[tick_at(fl, a["t1"]):tick_at(fl, b["t0"]) + 6]
        bid = next((f for f in seg if f["bid"] and f["t"] >= b["t0"] - 0.3), None)
        out["question"] = {"asked_at": a["t1"], "silence_s": round(b["t0"] - a["t1"], 2),
                           "landed": any(f["landed"] for f in seg), "open_peak": max(f["open"] for f in seg),
                           "next_bid": bid and {"t": bid["t"], "bid": bid["bid"],
                                                "is_asker": mapping.get(bid["bid"]) == a["s"]}}
        out["question"]["ok"] = (out["question"]["landed"] and out["question"]["open_peak"] >= 0.99
                                 and bool(bid) and mapping.get(bid["bid"]) == a["s"])
    # the interruption: a line that starts before the last one ended
    cut = [(a, b) for a, b in zip(truth, truth[1:]) if b["t0"] < a["t1"]]
    out["interruption"] = None
    if cut:
        a, b = cut[0]
        seen = [f for f in fl[tick_at(fl, b["t0"] - 0.3):tick_at(fl, b["t0"] + 1.0) + 1] if f["bid"]]
        out["interruption"] = {"by": b["s"], "at": b["t0"], "over": a["s"], "overlap_s": round(a["t1"] - b["t0"], 2),
                               "bid": seen and {"t": seen[0]["t"], "bid": seen[0]["bid"], "open": seen[0]["open"]},
                               "label_for_interrupter": inv.get(b["s"])}
        out["interruption"]["ok"] = bool(seen) and mapping.get(seen[0]["bid"]) == b["s"]
    return out


def live_floor_agrees(audio_path: Path, fl: list) -> tuple[int, int]:
    """Feed the audio 512 samples at a time through Silero and the Stream, as live.py
    does, and count the ticks where open and landed agree with floor.jsonl, and where
    a live bid ("?") stands on a bid of the labelled floor."""
    import torch
    audio, model = floor.load_audio(audio_path), floor.vad_model()
    model.reset_states()
    s, live = floor.Stream(), []
    with torch.no_grad():
        for i in range(0, len(audio) - floor.HOP + 1, floor.HOP):
            live += s.push(float(model(torch.from_numpy(audio[i:i + floor.HOP].copy()), floor.SR)))
    n = min(len(live), len(fl))
    same = sum(a["open"] == b["open"] and a["landed"] == b["landed"] and (a["bid"] is None or b["bid"] is not None)
               for a, b in zip(live[:n], fl[:n]))
    return same, n


def check_shapes(words: list, fl: list, duration: float) -> list:
    bad = []
    for w in words:
        if set(w) != {"t0", "t1", "s", "w"} or not re.fullmatch(r"[a-z0-9]+", w["w"]) or w["t1"] < w["t0"]:
            bad.append(f"word {w}")
    for k, f in enumerate(fl):
        if set(f) != {"t", "open", "landed", "bid"} or abs(f["t"] - k * floor.TICK) > 1e-6 or not 0 <= f["open"] <= 1:
            bad.append(f"floor {f}")
    if fl and duration - fl[-1]["t"] > floor.TICK + 0.051:
        bad.append(f"floor ends at {fl[-1]['t']} s of {duration:.1f} s")
    return bad[:5]


def machine() -> str:
    try:
        chip = subprocess.run(["sysctl", "-n", "machdep.cpu.brand_string"], capture_output=True, text=True).stdout.strip()
        mem = int(subprocess.run(["sysctl", "-n", "hw.memsize"], capture_output=True, text=True).stdout) // 2**30
        return f"{chip}, {mem} GB, macOS {platform.mac_ver()[0]}"
    except Exception:
        return platform.platform()


def report(lab: dict, sp: dict, fs: dict, render_s: float, checks: list, bad: list, truth: list) -> str:
    q, i, qu = fs["question"] or {}, fs["interruption"] or {}, fs["quiet"]
    voices = dict(sorted((u["s"], u["voice"]) for u in truth))
    rows = [
        ("audio", f"{lab['audio_s']} s, {len(voices)} scripted speakers (`say`: "
                  + ", ".join(f"{s} {v}" for s, v in voices.items()) + f"), {len(truth)} utterances"),
        ("render (standin.py)", f"{render_s:.1f} s"),
        ("label (label.py)", f"{lab['total_s']} s in all = {lab['x_realtime']}x real time "
                             f"(VAD {lab['vad_s']} s, whisper {lab['whisper_s']} s, speakers {lab['speakers_s']} s)"),
        ("transcriber", f"`{lab['model']}` via mlx-whisper, word timestamps"),
        ("labelling", lab["labelling"]),
        ("words", f"{lab['words']} transcribed / {sp['ref_words']} scripted"),
        ("**speaker accuracy**", f"**{sp['accuracy']:.1%}** ({sp['right']}/{sp['scored']} words; labels "
                                 + ", ".join(f"{k}->{v}" for k, v in sp["mapping"].items()) + ")"),
        ("**WER**", f"**{sp['wer']:.1%}** ({sp['sub']} substituted, {sp['del']} deleted, {sp['ins']} inserted)"),
        ("floor ticks", f"{lab['floor']['ticks']} at 10 Hz, computed causally; the live path agrees on "
                        f"{fs['live_agrees']}"),
        ("landings", f"{fs['landings']}: {fs['landed_in_them']} of the {fs['scripted_pauses_clear']} scripted pauses "
                     f"of 0.5 s or more landed; {fs['landed_at_threshold']} of the "
                     f"{fs['scripted_pauses_at_threshold']} scripted at the 0.4 s threshold itself; "
                     f"{fs['landings_mid_utterance']} fell inside an utterance"),
        ("bids", f"{fs['bids']}: {fs['bids_named']} named, {fs['bids_named_right']} named right"),
        ("the quiet stretch", f"scripted {qu['scripted_s']} s at {qu['scripted_at']} s; found {qu['found_s']} s at "
                              f"{qu['found_at']} s, open peaking at {qu['open_peak']}"),
        ("the question met with silence", f"asked by the speaker ending at {q.get('asked_at')} s, "
                                          f"{q.get('silence_s')} s of silence; landed {q.get('landed')}, open peaking "
                                          f"at {q.get('open_peak')}; next bid {q.get('next_bid')}"),
        ("the interruption", f"{i.get('by')} over {i.get('over')} at {i.get('at')} s ({i.get('overlap_s')} s "
                             f"overlap); seen as bid {i.get('bid')}"),
    ]
    lines = [f"# standin-1: the voices end to end", "",
             f"Run {date.today().isoformat()} on {machine()} by `python smoke.py`. No person recorded: three "
             "macOS `say` voices read `scripts/standin-1.json`; nothing left the Mac.", "",
             "| measure | result |", "|---|---|", *[f"| {a} | {b} |" for a, b in rows], "",
             "## Checks", "", *[f"- {'PASS' if ok else 'FAIL'} — {name}" for name, ok in checks], ""]
    if bad:
        lines += ["Shape problems (first five):", "", *[f"- `{b}`" for b in bad], ""]
    lines += ["## Who was heard as whom", "", "| label | " + " | ".join(sorted({u for c in sp["confusion"].values()
                                                                                  for u in c})) + " |",
              "|---|" + "---|" * len(next(iter(sp["confusion"].values()))),
              *[f"| {h} | " + " | ".join(str(v) for v in c.values()) + " |" for h, c in sp["confusion"].items()],
              "", "Rows are the labels given; columns the scripted speakers; each cell counts words.", ""]
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--labelling", choices=["auto", "pyannote", "fallback"], default="auto")
    ap.add_argument("--model", default=label.MODEL)
    a = ap.parse_args()
    RUN.mkdir(parents=True, exist_ok=True)
    t = time.time()
    subprocess.run([sys.executable, str(HERE / "standin.py"), str(SCRIPT), "--out", str(RUN)], check=True)
    render_s = time.time() - t
    lab = label.run(RUN / "audio.wav", RUN, model=a.model, how=a.labelling)
    words, fl = floor.read_jsonl(RUN / "words.jsonl"), floor.read_jsonl(RUN / "floor.jsonl")
    truth = floor.read_jsonl(RUN / "truth.jsonl")
    sp = score_speakers(words, truth)
    fs = score_floor(fl, truth, sp["mapping"], floor.LANDING_S)
    bad = check_shapes(words, fl, lab["audio_s"])
    same, n = live_floor_agrees(RUN / "audio.wav", fl)
    fs["live_agrees"] = f"{same}/{n}"
    checks = [("words.jsonl and floor.jsonl keep the shapes of the record's section 3", not bad),
              (f"fed block by block as live.py feeds it, the floor agrees tick for tick ({same}/{n})", same == n),
              (f"speaker accuracy {sp['accuracy']:.1%} >= {MIN_ACCURACY:.0%}", sp["accuracy"] >= MIN_ACCURACY),
              (f"WER {sp['wer']:.1%} <= {MAX_WER:.0%}", sp["wer"] <= MAX_WER),
              ("the quiet stretch is found as the longest open stretch, open reaching 1", fs["quiet"]["ok"]),
              ("the question met with silence lands, opens fully, and the asker bids again",
               bool(fs["question"] and fs["question"]["ok"])),
              ("the interruption is seen as a bid by the interrupter", bool(fs["interruption"] and fs["interruption"]["ok"]))]
    (RUN / "report.md").write_text(report(lab, sp, fs, render_s, checks, bad, truth))
    print(f"\nspeaker accuracy {sp['accuracy']:.1%}   WER {sp['wer']:.1%}   labelling: {lab['labelling']}")
    print(f"label: {lab['total_s']} s for {lab['audio_s']} s of audio ({lab['x_realtime']}x real time)")
    print(f"floor: {fs['landings']} landings, {fs['bids']} bids; quiet {fs['quiet']['found_s']} s at "
          f"{fs['quiet']['found_at']} s; interruption bid {(fs['interruption'] or {}).get('bid')}")
    for name, ok in checks:
        print(f"  {'PASS' if ok else 'FAIL'}  {name}")
    print(f"report: {RUN / 'report.md'}")
    return 0 if all(ok for _, ok in checks) else 1


if __name__ == "__main__":
    sys.exit(main())
