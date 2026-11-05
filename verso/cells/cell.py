"""One cell: one model at one effort, looping at its own measured pace through one window.

Each loop: the window (the cached head: its injector spindle then the frame; the fresh tail: the ledger
as held thoughts, every other mirror's latest line with its age, the live talk last), one call, one
line parsed, appended to its own mirror with the measured ms and usd. A cell is never told its tier
or effort. Its period is measured; its layer is the order of magnitude of its period.
"""
import asyncio, collections, datetime, json, os, time

from door import HardStop, parse_json
from ledger import layer_of

ACTS = ("hold", "release")
HORIZONS = ("seconds", "turns", "topic")


def fractional_year(ts=None):
    ts = ts or time.time()
    d = datetime.datetime.fromtimestamp(ts, datetime.timezone.utc)
    y0 = datetime.datetime(d.year, 1, 1, tzinfo=datetime.timezone.utc).timestamp()
    y1 = datetime.datetime(d.year + 1, 1, 1, tzinfo=datetime.timezone.utc).timestamp()
    return round(d.year + (ts - y0) / (y1 - y0), 6)


def iso_now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class MirrorBoard:
    """Every cell's latest line, with the wall time it was written, so each window can show its age."""

    def __init__(self):
        self.latest = {}

    def post(self, cid, line):
        self.latest[cid] = (time.time(), line)

    def others(self, cid):
        return [(time.time() - w, l) for c, (w, l) in self.latest.items() if c != cid]


class Cell:
    def __init__(self, cid, tier, effort, settings, head, spindle, ledger, board, talk, spend, run_dir, door_fn, emit, layer=None):
        self.id, self.tier, self.effort = cid, tier, effort
        self.assigned = layer           # a layer by design: its minimum period (settings.layers) is waited out between loops
        self.s, self.head, self.spindle = settings, head, spindle
        self.ledger, self.board, self.talk, self.spend = ledger, board, talk, spend
        self.run_dir, self.door, self.emit = run_dir, door_fn, emit
        self.periods = collections.deque(maxlen=5)
        self.period = None
        self.loops = self.lines = self.errors = self.releases = 0
        self.usage = {"in": 0, "write": 0, "read": 0, "out": 0}
        self.usd = 0.0
        self.max_tokens_stops = 0
        self.mirror_path = os.path.join(run_dir, f"mirror-{cid}.jsonl")

    @property
    def layer(self):
        return self.assigned or (layer_of(self.period) if self.period else "middle")

    def min_period(self):
        return float((self.s.get("layers") or {}).get(self.assigned, 0)) if self.assigned else 0.0

    # ---- the window

    def system(self):
        blocks = [{"type": "text", "text": self.spindle}] if self.spindle else []
        blocks.append({"type": "text", "text": self.head, "cache_control": {"type": "ephemeral"}})
        return blocks

    def render(self, view, others):
        lines = ["THE LEDGER, held thoughts as they stood when this loop began"]
        if view:
            for v in view:
                lines.append(f"  [{v['tag']}] {v['state']}, {v['age']} landings old, horizon {v['horizon']} — parent: {v['parent']} — held: {v['text']}")
        else:
            lines.append("  (nothing held yet)")
        lines += ["", "THE OTHER CELLS' LATEST LINES, each with its age in seconds"]
        if others:
            for age, l in sorted(others, key=lambda x: x[0]):
                if l.get("act") in ACTS:
                    lines.append(f"  {age:.0f} s ago · {l['act']} · parent: {l['parent']} · \"{l['text']}\" · horizon {l['horizon']}")
        else:
            lines.append("  (none yet)")
        n = int(self.s["talk_seconds"])
        lines += ["", f"THE TALK, the last {n} seconds, words with their times and speakers"]
        lines += self.talk.render(n)
        lines.append(f"now · {iso_now()} · landing {self.talk.landing_count()} · {self.talk.now():.1f} s since the talk began")
        lines += ["", "Reply with only one JSON object: the line."]
        return "\n".join(lines)

    # ---- the loop

    async def run(self, stop):
        log = os.path.join(self.run_dir, "calls.jsonl")
        while not stop.is_set():
            t0 = time.time()
            landing, t_talk = self.talk.landing_count(), self.talk.now()
            view = self.ledger.view(self.id)
            others = self.board.others(self.id)
            seen = {l.get("entry") for _, l in others if l.get("act") == "release" and l.get("entry")}
            tail = self.render(view, others)
            try:
                r = await self.door(self.tier, self.effort, self.system(), tail, int(self.s["max_tokens"]), self.spend, "loop", log,
                                    meta={"cell": self.id, "loop": self.loops, "landing": landing, "t": round(t_talk, 1)})
            except HardStop as e:
                print(f"  {self.id}: {e}", flush=True)
                stop.set()
                break
            self.loops += 1
            self.periods.append(max(time.time() - t0, self.min_period()))   # the period includes the wait that follows
            self.period = sum(self.periods) / len(self.periods)
            self.ledger.periods[self.id] = self.period
            for k in self.usage:
                self.usage[k] += r["usage"][k]
            self.usd += r["usd"]
            line = dict(at=fractional_year(), iso=iso_now(), t=round(self.talk.now(), 1), landing=self.talk.landing_count(),
                        clock=self.talk.clock_place(self.layer), window_t=round(t_talk, 1), window_landing=landing,
                        layer=self.layer, ms=r["ms"], usd=round(r["usd"], 6), usage=r["usage"])
            obj, flag = parse_json(r["reply"]) if r["reply"] else (None, "empty")
            if r["error"]:
                flag = "error"
                self.errors += 1
            if r["stop"] == "max_tokens":
                self.max_tokens_stops += 1
                flag = flag if obj else "max-tokens"
            if obj and isinstance(obj, dict):
                act = str(obj.get("act", "hold")).lower().strip()
                stop_rule = str(obj.get("stop", "")).lower().strip()
                allowed = list(self.s["stop"]) or ["phrase"]
                parsed = dict(parent=str(obj.get("parent", "")).strip(), act=act if act in ACTS else "hold",
                              text=str(obj.get("text", "")).strip(),
                              horizon=str(obj.get("horizon", "turns")).lower().strip() if str(obj.get("horizon", "")).lower().strip() in HORIZONS else "turns",
                              stop=stop_rule if stop_rule in allowed else allowed[0], safety=obj.get("safety") is True)
                if not parsed["text"] and not parsed["parent"]:
                    flag = "bad-line"
                else:
                    e, what = self.ledger.take(self.id, self.layer, parsed, seen)
                    line.update(parsed, entry=e.id, what=what, flag=flag)
                    self.lines += 1
                    if parsed["act"] == "release":
                        self.releases += 1
            if "act" not in line:
                line.update(act="none", flag=flag, error=r["error"], reply=(r["reply"] or "")[:200])
            with open(self.mirror_path, "a") as f:
                f.write(json.dumps(line) + "\n")
            self.board.post(self.id, line)
            self.emit("mirror", cell=self.id, line=line)
            self.emit("period", cell=self.id, s=round(self.period, 2), period=round(self.period, 2), layer=self.layer, loops=self.loops,
                      t=round(self.talk.now(), 1), tier=self.tier, effort=self.effort)
            wait = self.min_period() - (time.time() - t0)
            while wait > 0 and not stop.is_set():
                await asyncio.sleep(min(0.5, wait))
                wait = self.min_period() - (time.time() - t0)

    def summary(self):
        total_in = self.usage["in"] + self.usage["write"] + self.usage["read"]
        return dict(id=self.id, tier=self.tier, effort=self.effort, period=round(self.period, 2) if self.period else None,
                    layer=self.layer if (self.period or self.assigned) else None, assigned=self.assigned, min_period=self.min_period(), loops=self.loops, lines=self.lines, releases=self.releases,
                    errors=self.errors, max_tokens_stops=self.max_tokens_stops, usage=dict(self.usage),
                    cache_read_share=round(self.usage["read"] / total_in, 3) if total_in else None, usd=round(self.usd, 4),
                    arm=None)
