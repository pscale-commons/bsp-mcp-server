"""The record of play: after a run, what became of each held thought, the judges' marks, the cells' measured
periods and spend, into runs/<id>/record.json; and the tables printed for a headless run."""
import collections, json, os, time


def would_at_thresholds(run, entries, floor_path, thresholds=(1, 2, 3)):
    """After the fact: when each thought's urge would have crossed each threshold while the floor was open past the
    window, from its counted releases and the half-life, against the floor as recorded. The thresholds tune here."""
    import math
    led, s = run.ledger, run.s
    landings = run.talk.landings
    try:
        floor = [json.loads(l) for l in open(floor_path) if l.strip()]
    except Exception:
        return {}
    half, win = max(0.5, float(s["half_life"])), float(s["window"])
    end_t = run.talk.end_t if run.talk.end_t is not None else run.talk.now()
    floor = [f for f in floor if f["t"] <= end_t]

    def landing_at(t):
        return sum(1 for x in landings if x <= t)

    def urge_at(e, t):
        n = landing_at(t)
        u = 0.0
        for rel in e["released"].values():
            u += 0.5 ** (max(0, n - rel["landing"]) / half)
        u += e.get("named", 0) * 0.5 ** (max(0, n - e["landing"]) / half)
        return u

    out = {}
    for thr in thresholds:
        moments = []
        for e in entries:
            if not e["released"]:
                continue
            t_first = min(r["t"] for r in e["released"].values())
            end_landing = next((x for x in (e["foreclosed_at"], e["voiced_at"], (e["handed"] or {}).get("landing")) if x is not None), None)
            above = False
            for f in floor:
                if f["t"] < t_first:
                    continue
                if end_landing is not None and landing_at(f["t"]) > end_landing:
                    break
                ok = urge_at(e, f["t"]) >= thr and f["open"] > win
                if ok and not above:
                    moments.append(dict(id=e["id"], t=f["t"], landing=landing_at(f["t"]), urge=round(urge_at(e, f["t"]), 2), open=f["open"]))
                above = ok
        out[str(thr)] = moments
    return out


def build(run, cells, marks):
    led, talk, spend = run.ledger, run.talk, run.spend
    wall = run.loop_wall or 1.0
    loop_usd = spend.usd["loop"]
    cs = []
    for c in cells:
        d = c.summary()
        d["arm"] = run.arms.get(c.id)
        d["hour_usd"] = round(c.usd / wall * 3600, 3)
        cs.append(d)
    entries = led.snapshot()
    would = [dict(id=e["id"], **m) for e in entries for m in e["would"]]
    post = would_at_thresholds(run, entries, os.path.join(os.path.dirname(run.dir), run.transcript, "floor.jsonl"))
    by_arm = collections.Counter(run.arms.values())
    return dict(
        run=run.id, transcript=run.transcript, started=run.started_iso, finished=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        speed=talk.speed, talk_seconds=round(talk.now(), 1), loop_wall_seconds=round(wall, 1), landings=talk.landing_count(),
        landing_interval=round(talk.interval(), 2), turns=len(talk.turns), words=len(talk.words),
        settings=dict(run.s), arms=dict(run.arms), arms_count=dict(by_arm), cells=cs,
        spend=dict(walk=round(spend.usd["walk"], 4), loop=round(loop_usd, 4), total=round(spend.total, 4),
                   calls=dict(spend.calls), hour_usd=round(loop_usd / wall * 3600, 3), stopped=spend.stopped),
        counts=led.counts(), entries=entries, log=led.log, would=would, would_at_thresholds=post,
        spoken=run.speaker.spoken if run.speaker else [], marks=marks)


def write(run, cells, marks):
    rec = build(run, cells, marks)
    path = os.path.join(run.dir, "record.json")
    with open(path, "w") as f:
        json.dump(rec, f, indent=1)
    with open(os.path.join(run.dir, "ledger.json"), "w") as f:
        json.dump(rec["entries"], f, indent=1)
    return path, rec


def tables(rec):
    out = [f"run {rec['run']} on {rec['transcript']} at speed {rec['speed']}: {rec['talk_seconds']} s of talk, {rec['landings']} landings "
           f"(interval {rec['landing_interval']} s), {rec['words']} words in {rec['turns']} turns; loop wall {rec['loop_wall_seconds']} s"]
    out.append(f"spend: walk ${rec['spend']['walk']:.4f}, loop ${rec['spend']['loop']:.4f}, total ${rec['spend']['total']:.4f}; "
               f"the hour's price at this pace ${rec['spend']['hour_usd']:.2f}" + ("; HARD STOP" if rec['spend']['stopped'] else ""))
    out.append("")
    out.append(f"  {'cell':14} {'arm':8} {'period':>7} {'layer':7} {'loops':>5} {'lines':>5} {'rel':>4} {'err':>4} {'maxtok':>6} {'cache':>6} {'usd':>8} {'$/hour':>7}")
    for c in rec["cells"]:
        out.append(f"  {c['id']:14} {str(c['arm']):8} {str(c['period']):>7} {str(c['layer']):7} {c['loops']:>5} {c['lines']:>5} {c['releases']:>4} "
                   f"{c['errors']:>4} {c['max_tokens_stops']:>6} {str(c['cache_read_share']):>6} {c['usd']:>8.4f} {c['hour_usd']:>7.2f}")
    out.append("")
    out.append("  thoughts: " + ", ".join(f"{k} {v}" for k, v in rec["counts"].items()) + f" (of {len(rec['entries'])})")
    born = collections.Counter(e["origin"] for e in rec["entries"])
    out.append(f"  born of a line {born.get('line', 0)}, of the walk {born.get('walk', 0)}")
    rel = [r for e in rec["entries"] for r in e["releases"]]
    out.append(f"  releases {len(rel)}, counted as independent {sum(r['counted'] for r in rel)}, made after seeing another cell's release of the same thought {sum(r['saw_another'] for r in rel)}")
    urges = sorted((e["urge"], e["id"]) for e in rec["entries"])
    top = sorted(rec["entries"], key=lambda e: -max([e["urge"]] + [r.get("urge", 0) for r in e["would"]]))[:5]
    out.append("  highest urge reached: " + ", ".join(f"{e['id']} {max(len(e['released']), 0)} layers" for e in top))
    if rec["would"]:
        out.append("  would-speak moments (t, landing, urge, floor open, modes):")
        for m in rec["would"]:
            out.append(f"    {m['t']:7.1f} s  landing {m['landing']:3}  {m['id']:5} urge {m['urge']:.2f} open {m['open']:.2f}  ready {m['ready']} spoken-to {m['spoken_to']} safety {m['safety']}")
    else:
        out.append("  would-speak moments: none")
    post = rec.get("would_at_thresholds") or {}
    if post:
        out.append("  after the fact, moments the urge would have crossed a threshold while the floor was open past the window: "
                   + ", ".join(f"threshold {k}: {len(v)}" for k, v in post.items()))
        for k, v in post.items():
            for m in v[:12]:
                out.append(f"    at {k}: {m['t']:7.1f} s landing {m['landing']:3} {m['id']:5} urge {m['urge']:.2f} open {m['open']:.2f}")
    if rec["spoken"]:
        out.append("  spoken (silent in a replay): " + "; ".join(f"{s['id']} by {s['cell']}" + (f" cut at phrase {s['cut_at']} by {s['by']}" if s['cut_at'] is not None else " whole") for s in rec["spoken"]))
    if rec["marks"]:
        out.append(f"  judges' marks: {len(rec['marks'])}")
    return "\n".join(out)
