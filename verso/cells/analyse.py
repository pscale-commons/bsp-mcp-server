"""Read a run's folder back: the tables of results-<date>.md. Nothing here calls the API.

  analyse.py runs/<id>              the measured tables for one replay
  analyse.py --walks runs/<a> ...   did the walked spindles differ: routes, notes, hinges per cell
"""
import collections, json, os, sys

from ledger import words_of, jaccard


def load_jsonl(p):
    return [json.loads(l) for l in open(p) if l.strip()] if os.path.exists(p) else []


def present(run_dir, rec):
    """Did a cell keep the present: for each line, does its parent overlap the latest landed turn more than older turns?"""
    words = load_jsonl(os.path.join(os.path.dirname(run_dir.rstrip("/")), rec["transcript"], "words.jsonl"))
    floor = load_jsonl(os.path.join(os.path.dirname(run_dir.rstrip("/")), rec["transcript"], "floor.jsonl"))
    landings = [f["t"] for f in floor if f["landed"]]
    # turns as the talk closes them: at each landing, the words since the previous landing
    turns, prev = [], 0.0
    for t in landings:
        tw = [w for w in words if prev < w["t1"] <= t]
        if tw:
            turns.append(dict(t0=tw[0]["t0"], t1=t, words=words_of(" ".join(w["w"] for w in tw))))
        prev = t
    out = {}
    for c in rec["cells"]:
        lines = [l for l in load_jsonl(os.path.join(run_dir, f"mirror-{c['id']}.jsonl")) if l.get("act") in ("hold", "release")]
        kept, judged, lag = 0, 0, []
        for l in lines:
            pw = words_of(l.get("parent", "")) | words_of(l.get("text", ""))
            done = [t for t in turns if t["t1"] <= l.get("window_t", l["t"])]
            if len(done) < 2 or not pw:
                continue
            scores = [(jaccard(pw, t["words"]), i) for i, t in enumerate(done)]
            best = max(scores)
            if best[0] == 0:
                continue
            judged += 1
            lag.append(len(done) - 1 - best[1])
            if best[1] >= len(done) - 2:    # the latest or the one before it
                kept += 1
        out[c["id"]] = dict(judged=judged, present=round(kept / judged, 2) if judged else None,
                            mean_lag=round(sum(lag) / len(lag), 2) if lag else None)
    return out


def tables(run_dir):
    rec = json.load(open(os.path.join(run_dir, "record.json")))
    pres = present(run_dir, rec)
    rows = ["| cell | arm | period s | layer | min period | loops | lines | releases | errors | max_tokens stops | cache read share | usd | $/hour | present | mean lag (turns) |",
            "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for c in rec["cells"]:
        p = pres.get(c["id"], {})
        rows.append(f"| {c['id']} | {c['arm']} | {c['period']} | {c['layer']} | {c.get('min_period', 0):.0f} | {c['loops']} | {c['lines']} | {c['releases']} | {c['errors']} | "
                    f"{c['max_tokens_stops']} | {c['cache_read_share']} | {c['usd']:.4f} | {c['hour_usd']:.2f} | {p.get('present')} | {p.get('mean_lag')} |")
    sp = rec["spend"]
    head = [f"**{rec['run']}** on `{rec['transcript']}` at speed {rec['speed']}: {rec['talk_seconds']} s of talk, {rec['landings']} landings "
            f"(mean interval {rec['landing_interval']} s), {rec['words']} words in {rec['turns']} turns; the loops ran {rec['loop_wall_seconds']} s of wall time.",
            f"Spend: walk ${sp['walk']:.4f} in {sp['calls']['walk']} calls, loops ${sp['loop']:.4f} in {sp['calls']['loop']} calls, total ${sp['total']:.4f}; "
            f"the hour's price at this pace ${sp['hour_usd']:.2f}." + (" **Hard stop reached.**" if sp["stopped"] else "")]
    counts = rec["counts"]
    ent = rec["entries"]
    rel = [r for e in ent for r in e["releases"]]
    layers = collections.Counter(c["layer"] for c in rec["cells"])
    mid = [f"Thoughts: {', '.join(f'{k} {v}' for k, v in counts.items())} of {len(ent)}; born of a line {sum(e['origin'] == 'line' for e in ent)}, "
           f"of the walk {sum(e['origin'] == 'walk' for e in ent)}; ripened at some point {sum(e['ripe_at'] is not None for e in ent)}; "
           f"checked at their horizon {sum(e['checked'] is not None for e in ent)}, of which the parent had come back {sum(bool(e['checked'] and e['checked']['came_back']) for e in ent)}.",
           f"Releases: {len(rel)}, counted as independent (first by a layer) {sum(r['counted'] for r in rel)}, made after seeing another cell's release of the same thought "
           f"{sum(r['saw_another'] for r in rel)}. Layers present: {dict(layers)}. Highest urge reached by any thought: "
           f"{max([max([e['urge']] + [m['urge'] for m in e['would']] + [len(e['released'])]) for e in ent] + [0]):.2f}; thoughts released by two layers {sum(len(e['released']) >= 2 for e in ent)}, by three {sum(len(e['released']) >= 3 for e in ent)}."]
    would = ["| t | landing | thought | urge | floor open | ready | spoken-to | safety |", "|---|---|---|---|---|---|---|---|"]
    for m in rec["would"]:
        would.append(f"| {m['t']} | {m['landing']} | {m['id']} | {m['urge']:.2f} | {m['open']:.2f} | {m['ready']} | {m['spoken_to']} | {m['safety']} |")
    post = rec.get("would_at_thresholds", {})
    post_lines = ["After the fact, from the counted releases and the half-life against the recorded floor, moments the urge crossed a threshold while the floor was open past the window: "
                  + ", ".join(f"threshold {k}: {len(v)}" for k, v in post.items()) + "."]
    for k, v in post.items():
        for m in v[:10]:
            e = next(x for x in ent if x["id"] == m["id"])
            post_lines.append(f"- at {k}: {m['t']} s, landing {m['landing']}, {m['id']} urge {m['urge']} open {m['open']}: \"{e['say'][:110]}\"")
    return "\n".join(head) + "\n\n" + "\n".join(rows) + "\n\n" + "\n".join(mid) + "\n\n" + ("Would-speak moments as the run marked them (mode " + rec["settings"]["mode"] + f", threshold {rec['settings']['threshold']}, window {rec['settings']['window']}):\n\n" + "\n".join(would) if rec["would"] else f"Would-speak moments as the run marked them (mode {rec['settings']['mode']}, threshold {rec['settings']['threshold']}, window {rec['settings']['window']}): none.") + "\n\n" + "\n".join(post_lines)


def walks(dirs):
    out = []
    for d in dirs:
        sd = os.path.join(d, "spindles")
        if not os.path.isdir(sd):
            continue
        sps = {f[:-5]: json.load(open(os.path.join(sd, f))) for f in sorted(os.listdir(sd)) if f.endswith(".json")}
        out.append(f"**{os.path.basename(d.rstrip('/'))}** ({next(iter(sps.values()))['block'] if sps else '?'}): routes by cell")
        out += ["| cell | route | rungs | walk usd | walk s |", "|---|---|---|---|---|"]
        routes = collections.Counter()
        for cid, sp in sps.items():
            r = " ".join(x["addr"] for x in sp["rungs"])
            routes[r] += 1
            out.append(f"| {cid} | {r} | {len(sp['rungs'])} | {sp['usd']:.4f} | {sp['ms'] / 1000:.0f} |")
        out.append(f"\nDistinct routes: {len(routes)} of {len(sps)}; per rung, options taken: " + "; ".join(
            f"rung {i + 1}: " + ", ".join(f"{a} ×{n}" for a, n in collections.Counter(sp['rungs'][i]['addr'] for sp in sps.values() if len(sp['rungs']) > i).most_common())
            for i in range(max(len(sp["rungs"]) for sp in sps.values()))))
        out.append("")
    return "\n".join(out)


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "--walks":
        print(walks(a[1:]))
    else:
        print(tables(a[0]))
