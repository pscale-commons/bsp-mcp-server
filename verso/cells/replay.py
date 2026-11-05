"""The talk as the cells meet it, and the replay that feeds a recorded run at real speed with no lookahead.

The clock is landings, read from floor.landed. Words arrive when they are complete (at t1); the floor
ten times a second. A turn closes at a landing (judged) or when another speaker's word arrives (cut).
Nothing here is spoken and nothing is written anywhere: the host owns the run folder.
"""
import asyncio, json, os, time


class Talk:
    def __init__(self, settings, name="live", speed=1.0):
        self.s = settings
        self.name = name
        self.speed = float(speed)
        self.words = []
        self.floor = {"t": 0.0, "open": 1.0, "landed": False, "bid": None}
        self.landings = []          # t of each landing
        self.turns = []             # closed turns: s, t0, t1, words, landed
        self.open_turn = None
        self.started_wall = None
        self.named_at = None
        self.last_person_word = None
        self.done = False
        self.end_t = None           # the talk's end, once the feed is done: the clock stops there
        self.on_landing, self.on_bid, self.on_word, self.on_floor = [], [], [], []

    def start(self):
        self.started_wall = time.time()

    def now(self):
        t = (time.time() - self.started_wall) * self.speed if self.started_wall else 0.0
        return min(t, self.end_t) if self.end_t is not None else t

    def wall_elapsed(self):
        return time.time() - self.started_wall if self.started_wall else 0.0

    def landing_count(self):
        return len(self.landings)

    def interval(self):
        if len(self.landings) >= 2:
            d = [b - a for a, b in zip(self.landings, self.landings[1:])]
            return max(1.0, sum(d) / len(d))
        return 6.0

    # ---- feeding

    def feed_word(self, w):
        if self.open_turn and self.open_turn["s"] != w["s"]:
            self._close(landed=False)
        if self.open_turn is None:
            self.open_turn = dict(s=w["s"], t0=w["t0"], t1=w["t1"], words=[], landed=False)
        self.open_turn["words"].append(w)
        self.open_turn["t1"] = w["t1"]
        self.words.append(w)
        self.last_person_word = w["t1"]
        if (self.s.get("name") or "verso").lower() in w["w"].lower():
            self.named_at = w["t1"]
        for cb in self.on_word:
            cb(w)

    def _close(self, landed):
        t = self.open_turn
        if t is None:
            return self.turns[-1] if self.turns else None
        t["landed"] = landed
        self.turns.append(t)
        self.open_turn = None
        return t

    def feed_floor(self, f):
        self.floor = f
        if f.get("landed"):
            self.landings.append(f["t"])
            turn = self._close(landed=True)
            for cb in self.on_landing:
                cb(len(self.landings), turn)
        if f.get("bid"):
            for cb in self.on_bid:
                cb(f["bid"])
        for cb in self.on_floor:
            cb(f)

    # ---- what the window reads

    def recent(self, seconds):
        cut = self.now() - float(seconds)
        return [w for w in self.words if w["t1"] >= cut]

    def named_recently(self, seconds):
        return self.named_at is not None and self.now() - self.named_at <= float(seconds)

    def clock_place(self, layer):
        """The talk's clock: the landing, and within it a tenth for a middle cell, a hundredth for a fast one."""
        n = self.landing_count()
        last = self.landings[-1] if self.landings else 0.0
        frac = min(0.99, max(0.0, (self.now() - last) / self.interval()))
        return f"{n}" if layer == "slow" else f"{n}.{int(frac * 10)}" if layer == "middle" else f"{n}.{int(frac * 100):02d}"

    def render(self, seconds):
        """The last N seconds as runs of one speaker's words with their start time; pauses inside a run marked."""
        ws = self.recent(seconds)
        if not ws:
            return ["  (nothing said in the last %d seconds)" % int(seconds)]
        lines, run = [], None
        for w in ws:
            if run is None or run["s"] != w["s"] or w["t0"] - run["t1"] > 1.0:
                if run:
                    lines.append(f"  {run['t0']:.1f} {run['s']}: " + " ".join(run["w"]))
                run = dict(s=w["s"], t0=w["t0"], t1=w["t1"], w=[])
            elif w["t0"] - run["t1"] >= 0.6:
                run["w"].append(f"…{w['t0'] - run['t1']:.1f}s…")
            run["w"].append(w["w"])
            run["t1"] = w["t1"]
        lines.append(f"  {run['t0']:.1f} {run['s']}: " + " ".join(run["w"]))
        f = self.floor
        since = f"{self.now() - self.landings[-1]:.1f} s ago (landing {self.landing_count()})" if self.landings else "none yet"
        bid = f"{f['bid']} bidding" if f.get("bid") else "nobody bidding"
        lines.append(f"  floor: open {f.get('open', 0):.1f}, last landing {since}, {bid}")
        return lines


async def feed(talk, run_in, stop, until=None):
    """Replay a run's words.jsonl and floor.jsonl at talk.speed, each line when its time comes, never before."""
    words = [json.loads(l) for l in open(os.path.join(run_in, "words.jsonl")) if l.strip()]
    floor = [json.loads(l) for l in open(os.path.join(run_in, "floor.jsonl")) if l.strip()]
    events = sorted([(w["t1"], 0, "w", w) for w in words] + [(f["t"], 1, "f", f) for f in floor], key=lambda e: (e[0], e[1]))
    if until:
        events = [e for e in events if e[0] <= float(until)]
    talk.start()
    t = 0.0
    for t, _, kind, ev in events:
        if stop.is_set():
            break
        wait = t / talk.speed - talk.wall_elapsed()
        if wait > 0:
            await asyncio.sleep(wait)
        if kind == "w":
            talk.feed_word(ev)
        else:
            talk.feed_floor(ev)
    talk.end_t = t
    talk.done = True
