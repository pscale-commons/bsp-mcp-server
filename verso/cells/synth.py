"""A synthetic three-person transcript in the seam shapes, from a script of turns, so the cells can run
before the voices piece delivers a stand-in. Invented timings; pauses; one interruption; a question met
with silence. The script carries the ground truth of who spoke when.

  synth.py <script.json> <out dir>     writes words.jsonl and floor.jsonl
"""
import json, os, sys


def word_time(w):
    return min(0.9, 0.14 + 0.045 * len(w))


def build(script):
    words, turns, t = [], [], 0.0
    for turn in script["turns"]:
        if turn.get("interrupt_after") is not None and turns:
            # this speaker starts inside the previous turn: cut the previous turn's words after that many seconds
            prev = turns[-1]
            cut_at = prev["t0"] + turn["interrupt_after"]
            kept = [w for w in prev["words"] if w["t0"] < cut_at]
            dropped = len(prev["words"]) - len(kept)
            prev["words"], prev["cut"] = kept, dropped
            prev["t1"] = kept[-1]["t1"] if kept else prev["t0"]
            words = [w for w in words if not (w["s"] == prev["s"] and w["t0"] >= cut_at and w["t0"] >= prev["t0"])]
            t = cut_at - 0.2
        else:
            t += turn.get("pause", 0.8)
        t0 = t
        tw = []
        for tok in turn["text"].split():
            if tok == "|":
                t += 0.6
                continue
            d = word_time(tok)
            w = dict(t0=round(t, 2), t1=round(t + d, 2), s=turn["s"], w=tok)
            tw.append(w)
            words.append(w)
            t += d + 0.06
        turns.append(dict(s=turn["s"], t0=round(t0, 2), t1=round(t, 2), words=tw, cut=0, silence_after=turn.get("silence_after", 0.0)))
        t += turn.get("silence_after", 0.0)
    words.sort(key=lambda w: (w["t0"], w["s"]))
    end = words[-1]["t1"] + 4.0
    floor = []
    tick = 0.0
    landed_done = set()
    while tick <= end:
        speaking = [w for w in words if w["t0"] - 0.05 <= tick <= w["t1"] + 0.15]
        last_end = max([w["t1"] for w in words if w["t1"] <= tick], default=0.0)
        open_ = 0.0 if speaking else min(1.0, (tick - last_end) / 2.0)
        landed = False
        for i, tr in enumerate(turns):
            if tr["cut"] == 0 and i not in landed_done and tick >= tr["t1"] + 0.5:
                nxt = turns[i + 1] if i + 1 < len(turns) else None
                if nxt is None or nxt["t0"] > tr["t1"]:   # a judged end: the next turn did not cut this one
                    landed, _ = True, landed_done.add(i)
                    break
        bid = None
        for tr in turns:
            if tr["t0"] - 0.1 <= tick < tr["t0"] + 0.15:
                bid = tr["s"]
        floor.append(dict(t=round(tick, 1), open=round(open_, 2), landed=landed, bid=bid))
        tick = round(tick + 0.1, 1)
    return words, floor, turns


if __name__ == "__main__":
    script = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    words, floor, turns = build(script)
    with open(os.path.join(out, "words.jsonl"), "w") as f:
        for w in words:
            f.write(json.dumps(w) + "\n")
    with open(os.path.join(out, "floor.jsonl"), "w") as f:
        for l in floor:
            f.write(json.dumps(l) + "\n")
    with open(os.path.join(out, "turns.json"), "w") as f:
        json.dump([dict(s=t["s"], t0=t["t0"], t1=t["t1"], n=len(t["words"]), cut=t["cut"]) for t in turns], f, indent=1)
    print(f"{len(words)} words, {len(floor)} floor lines, {len(turns)} turns, {sum(l['landed'] for l in floor)} landings, {words[-1]['t1']:.1f} s")
