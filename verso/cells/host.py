#!/usr/bin/env python3
"""The host: one WebSocket to the page, the run behind it, and the same run headless.

  host.py                                   serve ws://localhost:<port> and wait for the page's start
  host.py --no-page --replay <run> [--speed k] [--cells osh9|four|a,b] [--arm walked|yoked|neutral|none]
          [--stop-usd n] [--id label] [--door api|dry] [--yoke-from runs/<walk>] [--set key=json ...]
  host.py --no-page --live                  the voices piece's socket (settings.voices_socket), when it is up
  host.py --walk [--cells ...] [--source beach|file] [--block name] [--id label] [--door api|dry]

Events from the host: words, floor, mirror, ledger, speak, stop, period, cost, done (and host, the status).
Events from the page: start ("live" | "replay <run>"), stop, settings (a partial dict), mark, host.
Nothing is written anywhere but runs/<id>/; a replay never touches the beach's live now.
"""
import argparse, asyncio, json, os, shutil, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
RUNS = os.path.join(HERE, "runs")
sys.path.insert(0, HERE)

import injector, record
from cell import Cell, MirrorBoard, iso_now
from door import HardStop, Spend, call, dry_call
from frame import frame_text
from ledger import Ledger
from replay import Talk, feed
from speak import Speaker

LAYER_OF_EFFORT = {"low": "fast", "medium": "middle", "high": "slow"}
PRESETS = {   # cell -> its layer by design (settings.layers gives each layer's minimum period)
    "osh9": {f"{t}-{e}": LAYER_OF_EFFORT[e] for t in ("opus", "sonnet", "haiku") for e in ("low", "medium", "high")},
    "four": {"opus-low": "fast", "opus-high": "slow", "haiku-low": "fast", "haiku-high": "slow"},
    "nine": None, "osh9-free": None, "four-free": None,   # the same cells with no layer assigned: layers by measurement alone
}
PRESETS["nine"] = PRESETS["osh9"]
PRESETS["osh9-free"] = {c: None for c in PRESETS["osh9"]}
PRESETS["four-free"] = {c: None for c in PRESETS["four"]}


def load_settings(sets=()):
    s = json.load(open(os.path.join(HERE, "settings.json")))
    for kv in sets:
        k, v = kv.split("=", 1)
        try:
            v = json.loads(v)
        except Exception:
            pass
        if "." in k:
            a, b = k.split(".", 1)
            s.setdefault(a, {})[b] = v
        else:
            s[k] = v
    return s


def resolve_cells(spec):
    """(cell, tier, effort, layer or None): a preset name, a list of tier-effort[:layer], or a dict cell -> layer."""
    if isinstance(spec, str) and spec in PRESETS:
        items = list(PRESETS[spec].items())
    elif isinstance(spec, dict):
        items = list(spec.items())
    else:
        names = spec.split(",") if isinstance(spec, str) else list(spec)
        items = [(n.split(":")[0], n.split(":")[1] if ":" in n else None) for n in names]
    out = []
    for n, layer in items:
        tier, effort = n.split("-")
        out.append((n, tier, effort, layer))
    return out


class Run:
    def __init__(self, host, what, transcript, settings, label=None, no_page=False, speed=1.0, yoke_from=None, until=None):
        self.host, self.what, self.transcript, self.s = host, what, transcript, settings
        self.no_page, self.yoke_from, self.until = no_page, yoke_from, until
        self.id = label or f"{transcript}-{time.strftime('%Y%m%d-%H%M%S')}"
        self.dir = os.path.join(RUNS, self.id)
        os.makedirs(self.dir, exist_ok=True)
        self.s["speed"] = float(speed)
        self.talk = Talk(settings, name=transcript, speed=speed)
        self.ledger = Ledger(settings, self.talk)
        self.board = MirrorBoard()
        self.spend = Spend(settings["stop_usd"])
        self.door = dry_call if settings.get("door") == "dry" else call
        self.marks, self.cells, self.arms = [], [], {}
        self.speaker = None
        self.stop = asyncio.Event()
        self.loop_start = self.loop_wall = None
        self.started_iso = iso_now()
        self.was_eligible, self.speaking = set(), set()
        self.message = None

    def emit(self, event, **kw):
        self.host.emit(event, **kw)
        if self.no_page and event in ("mirror", "speak", "stop", "done"):
            if event == "mirror":
                l = kw["line"]
                print(f"  {l['t']:6.1f}s L{l['landing']:<3} {kw['cell']:13} {l['layer']:6} {l['ms']:>6}ms  {l.get('act', '?'):7} {l.get('entry', ''):4} {l.get('what', l.get('flag', '')):12} {l.get('text', '')[:70]}", flush=True)
            elif event == "speak":
                print(f"  {kw['t']:6.1f}s SPEAK{' (silent)' if kw['silent'] else ''} {kw['id']} by {kw['cell']} [{kw['i'] + 1}/{kw['n']}, {kw['stop']}]: {kw['phrase']}", flush=True)
            elif event == "stop":
                print(f"  {kw['t']:6.1f}s STOP {kw['id']} at phrase {kw['at_phrase']} by {kw['by']}", flush=True)

    # ---- enlivening: the frame, the walk, the cells

    async def enliven(self):
        s = self.s
        head = frame_text(s["beach"], s["shell"], s.get("line_words"))
        import door as _door
        _door.FALLBACK["off"] = bool(s.get("fallback", False))
        with open(os.path.join(self.dir, "frame.txt"), "w") as f:
            f.write(head)
        specs = resolve_cells(s["cells"])
        arm = s["injector"]["arm"]
        self.arms = {cid: (arm if isinstance(arm, str) else arm.get(cid, "none")) for cid, _, _, _ in specs}
        self.layers = {cid: layer for cid, _, _, layer in specs}
        log = os.path.join(self.dir, "walk.jsonl")
        blocks = {}
        if any(a == "walked" for a in self.arms.values()):
            blocks["walked"] = injector.load_block(s)
        if any(a == "neutral" for a in self.arms.values()):
            blocks["neutral"] = injector.load_block(s, "neutral")
        for k, (b, src) in blocks.items():
            with open(os.path.join(self.dir, f"block-{k}.json"), "w") as f:
                json.dump(b, f, indent=1)
        tasks, who = [], []
        for cid, tier, effort, _ in specs:
            a = self.arms[cid]
            if a in ("walked", "neutral"):
                b, src = blocks[a]
                tasks.append(injector.walk(cid, tier, effort, b, src, self.door, self.spend, log, s))
                who.append(cid)
        spindles = {}
        if tasks:
            print(f"the walk: {len(tasks)} cells on {', '.join(sorted(set(src for _, src in blocks.values())))}", flush=True)
            os.makedirs(os.path.join(self.dir, "spindles"), exist_ok=True)
            for cid, sp in zip(who, await asyncio.gather(*tasks)):
                spindles[cid] = sp
                with open(os.path.join(self.dir, "spindles", f"{cid}.json"), "w") as f:
                    json.dump(sp, f, indent=1)
                refused = [r for r in sp["rungs"] if r.get("stop") == "refusal"]
                print(f"  {cid:13} {self.arms[cid]:8} {' '.join(r['addr'] for r in sp['rungs']):40} {len(sp['rungs'])} rungs  ${sp['usd']:.4f} {sp['ms'] / 1000:.0f}s", flush=True)
        yoke_dir = self.yoke_from or s["injector"].get("yoke_from") or injector.latest_walk(RUNS)
        for cid, tier, effort, layer in specs:
            a = self.arms[cid]
            spindle, seeds = None, []
            if a == "walked":
                spindle, seeds = injector.spindle_text(spindles[cid]), injector.seeds(spindles[cid])
            elif a == "neutral":
                spindle = injector.spindle_text(spindles[cid])
            elif a == "yoked":
                spindle, twin = injector.twin_spindle(yoke_dir, cid, tier) if yoke_dir else (None, None)
                if spindle is None:
                    print(f"  {cid}: no twin spindle to yoke (looked in {yoke_dir}); running with none", flush=True)
                    self.arms[cid] = "none"
                else:
                    print(f"  {cid}: yoked to {twin} from {os.path.basename(yoke_dir)}", flush=True)
            c = Cell(cid, tier, effort, s, head, spindle, self.ledger, self.board, self.talk, self.spend, self.dir, self.door, self.emit, layer=layer)
            for sd in seeds:
                self.ledger.seed(cid, layer or "middle", sd["parent"], sd["text"], sd["horizon"])
            self.cells.append(c)
        with open(os.path.join(self.dir, "settings.json"), "w") as f:
            json.dump(dict(s, arms=self.arms, cell_layers=self.layers), f, indent=1)
        self.emit("cost", **self.cost())

    def cost(self):
        u = {"in": 0, "write": 0, "read": 0, "out": 0}
        for c in self.cells:
            for k in u:
                u[k] += c.usage[k]
        tot = u["in"] + u["write"] + u["read"]
        return dict(usd=round(self.spend.total, 4), walk=round(self.spend.usd["walk"], 4), loop=round(self.spend.usd["loop"], 4),
                    total=round(self.spend.total, 4), calls=dict(self.spend.calls), tokens=tot + u["out"], usage=u,
                    cache_read_share=round(u["read"] / tot, 3) if tot else None, stop_usd=self.spend.stop_usd)

    # ---- the floor's tick: would it speak now

    def on_floor(self, f):
        self.emit("floor", **f, landings=self.talk.landing_count())
        if not self.cells:
            return
        mode = self.s.get("mode", "spoken-to")
        named = self.talk.named_recently(self.s["talk_seconds"])
        now_el = set()
        for e, flags in self.ledger.eligible(float(f.get("open", 0)), named):
            now_el.add(e.id)
            if e.id in self.was_eligible or e.id in self.speaking:
                continue
            m = self.ledger.mark_would(e, flags, float(f.get("open", 0)), mode)
            self.emit("would", id=e.id, entry=e.id, phrase=e.say, cell=(e.releases[-1]["cell"] if e.releases else e.holder), **m)
            if self.no_page:
                print(f"  {m['t']:6.1f}s WOULD SPEAK {e.id} urge {m['urge']:.2f} open {m['open']:.2f} ready {flags['ready']} spoken-to {flags['spoken_to']} safety {flags['safety']}: {e.say[:80]}", flush=True)
            go = flags["safety"] or (mode == "ready" and flags["ready"]) or (mode == "spoken-to" and flags["spoken_to"])
            if go and self.speaker and not self.speaker.busy and self.speaker.may_go_on():
                cell = e.releases[-1]["cell"] if e.releases else e.holder
                self.speaking.add(e.id)
                asyncio.ensure_future(self._speak(e, cell))
        self.was_eligible = now_el

    async def _speak(self, e, cell):
        try:
            await self.speaker.speak(e, cell)
        finally:
            self.speaking.discard(e.id)

    async def pulse(self):
        """The ledger to the page when it changed, the cost every few seconds."""
        n = 0
        while not self.stop.is_set():
            await asyncio.sleep(0.5)
            if self.ledger.changed:
                self.ledger.changed = False
                self.emit("ledger", entries=self.ledger.snapshot(), counts=self.ledger.counts(), landing=self.talk.landing_count())
            n += 1
            if n % 10 == 0:
                self.emit("cost", **self.cost())

    # ---- the run

    async def go(self):
        try:
            await self.enliven()
        except (HardStop, RuntimeError) as e:
            self.message = str(e)
            print(f"enlivening failed: {e}", flush=True)
            self.emit("done", run=self.id, message=self.message, reason=self.message)
            return
        self.speaker = Speaker(self.s, self.talk, self.ledger, self.emit, silent=(self.what == "replay"))
        self.talk.on_landing.append(lambda n, turn: self.ledger.on_landing(n, turn))
        self.talk.on_bid.append(self.speaker.on_bid)
        self.talk.on_word.append(self.speaker.on_person_word)
        self.talk.on_word.append(lambda w: self.emit("words", **w))
        self.talk.on_floor.append(self.on_floor)
        self.loop_start = time.time()
        cell_tasks = [asyncio.ensure_future(c.run(self.stop)) for c in self.cells]
        pulse = asyncio.ensure_future(self.pulse())
        if self.what == "replay":
            feeder = asyncio.ensure_future(feed(self.talk, os.path.join(RUNS, self.transcript), self.stop, self.until))
        else:
            feeder = asyncio.ensure_future(self.live())
        try:
            await feeder
        except Exception as e:
            self.message = f"{type(e).__name__}: {e}"
            print(f"the feed ended: {self.message}", flush=True)
        if not self.stop.is_set():
            await asyncio.sleep(min(5.0, 5.0 / self.talk.speed) if self.talk.done else 0)
        self.stop.set()
        try:
            await asyncio.wait_for(asyncio.gather(*cell_tasks, return_exceptions=True), timeout=120)
        except asyncio.TimeoutError:
            print("some cells did not return in time; their last calls are not in the record", flush=True)
        pulse.cancel()
        self.loop_wall = time.time() - self.loop_start
        path, rec = record.write(self, self.cells, self.marks)
        self.emit("ledger", entries=rec["entries"], counts=rec["counts"], landing=self.talk.landing_count())
        self.emit("cost", **self.cost())
        self.emit("done", run=self.id, record=os.path.relpath(path, HERE), usd=round(self.spend.total, 4), message=self.message,
                  reason=("hard stop" if self.spend.stopped else self.message or ("replay finished" if self.talk.done else "stopped")))
        if self.no_page:
            print("\n" + record.tables(rec), flush=True)
        return rec

    async def live(self):
        import websockets
        url = self.s["voices_socket"]
        try:
            async with websockets.connect(url, open_timeout=5) as ws:
                self.talk.start()
                print(f"live: reading the voices at {url}", flush=True)
                async for raw in ws:
                    if self.stop.is_set():
                        break
                    m = json.loads(raw)
                    if m.get("event") == "words" or "w" in m:
                        self.talk.feed_word(dict(t0=m["t0"], t1=m["t1"], s=m["s"], w=m["w"]))
                    elif m.get("event") == "floor" or "open" in m:
                        self.talk.feed_floor(dict(t=m["t"], open=m["open"], landed=bool(m.get("landed")), bid=m.get("bid")))
        except (OSError, Exception) as e:
            raise RuntimeError(f"the voices socket at {url} is not up ({type(e).__name__}); live needs verso/voices live.py") from e
        self.talk.done = True


class Host:
    def __init__(self, settings):
        self.s = settings
        self.conns = set()
        self.run = None
        self.task = None

    def emit(self, event, **kw):
        if not self.conns:
            return
        if event == "mirror" and "line" in kw:          # the page reads the line's fields flat, with the cell beside them
            kw = dict(kw.pop("line"), **kw)
        msg = json.dumps(dict(type=event, event=event, **kw), default=str)
        for ws in list(self.conns):
            asyncio.ensure_future(self._send(ws, msg))

    async def _send(self, ws, msg):
        try:
            await ws.send(msg)
        except Exception:
            self.conns.discard(ws)

    def status(self):
        r = self.run
        running = bool(r and not r.stop.is_set() and self.task and not self.task.done())
        return dict(type="host", event="host", state=(r.what if running else "idle"), running=running, settings=self.s,
                    run=r.id if r else None, what=r.what if r else None, transcript=r.transcript if r else None,
                    cells=[c.summary() for c in r.cells] if r else [], cost=r.cost() if r else None,
                    runs=sorted(d for d in os.listdir(RUNS) if os.path.exists(os.path.join(RUNS, d, "words.jsonl"))))

    def adopt(self, incoming):
        """The page's settings, in its key names, into the host's."""
        if not isinstance(incoming, dict):
            return
        for k, v in incoming.items():
            if k == "cells" and v in ("nine", "osh9"):
                self.s["cells"] = "osh9"
            elif k == "injector" and isinstance(v, str):
                self.s["injector"]["arm"] = v
            elif k == "injector_block":
                self.s["injector"]["block"] = v
            elif k == "injector" and isinstance(v, dict):
                self.s["injector"].update(v)
            elif k in ("type", "event"):
                continue
            else:
                self.s[k] = v

    async def start(self, what, transcript, label=None, speed=1.0, no_page=False, yoke_from=None):
        if self.task and not self.task.done():
            return self.run
        self.run = Run(self, what, transcript, dict(self.s), label=label, no_page=no_page, speed=speed, yoke_from=yoke_from)
        self.run.s = self.s if not no_page else self.run.s  # the page's live settings reach a served run
        self.run.ledger.s = self.run.s
        self.task = asyncio.ensure_future(self.run.go())
        return self.run

    def stop_run(self):
        if self.run:
            self.run.stop.set()

    async def handler(self, ws):
        self.conns.add(ws)
        try:
            await ws.send(json.dumps(self.status(), default=str))
            async for raw in ws:
                try:
                    m = json.loads(raw)
                except Exception:
                    continue
                ev = m.get("type") or m.get("event") or m.get("kind")
                if ev == "start":
                    if "settings" in m and not (self.task and not self.task.done()):
                        self.adopt(m["settings"])
                    feed_ = str(m.get("feed") or m.get("run") or m.get("start") or m.get("what") or "").strip()
                    if feed_.startswith("replay"):
                        name = feed_.split(None, 1)[1].strip() if " " in feed_ else str(m.get("run") or m.get("transcript") or "synthetic-1")
                        await self.start("replay", name, speed=float(m.get("speed", 1.0)))
                    else:
                        await self.start("live", "live")
                    await ws.send(json.dumps(self.status(), default=str))
                elif ev == "stop":
                    self.stop_run()
                elif ev == "settings":
                    if "all" in m:
                        self.adopt(m["all"])
                    elif "settings" in m:
                        self.adopt(m["settings"])
                    elif "key" in m:
                        self.adopt({m["key"]: m.get("value")})
                    else:
                        self.adopt({k: v for k, v in m.items() if k not in ("type", "event")})
                    for c in self.conns:
                        asyncio.ensure_future(self._send(c, json.dumps(self.status(), default=str)))
                elif ev == "mark":
                    if self.run:
                        self.run.marks.append(dict(m, received=iso_now()))
                elif ev == "spoken":
                    if self.run and self.run.speaker:
                        self.run.speaker.on_spoken(m.get("id"), m.get("i"))
                elif ev == "stopped":
                    if self.run and self.run.speaker:
                        self.run.speaker.stopped_reports.append(dict(m, received=iso_now()))
                elif ev == "host":
                    if "settings" in m and not (self.task and not self.task.done()):
                        self.adopt(m["settings"])
                    await ws.send(json.dumps(self.status(), default=str))
        finally:
            self.conns.discard(ws)

    async def serve(self, page_dir=None):
        import websockets
        from websockets.http11 import Response
        from websockets.datastructures import Headers
        port = int(self.s.get("port", 8765))
        types = {".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml"}

        def process_request(connection, request):
            """A plain http GET for a file of the page's folder; anything else is the WebSocket."""
            if page_dir is None or "upgrade" in request.headers.get("Connection", "").lower():
                return None
            path = request.path.split("?")[0]
            name = "verso.html" if path in ("/", "/verso", "/verso.html") else path.lstrip("/")
            full = os.path.realpath(os.path.join(page_dir, name))
            if not full.startswith(os.path.realpath(page_dir) + os.sep) or not os.path.isfile(full):
                return Response(404, "Not Found", Headers([("Content-Type", "text/plain")]), b"not here\n")
            body = open(full, "rb").read()
            return Response(200, "OK", Headers([("Content-Type", types.get(os.path.splitext(full)[1], "application/octet-stream")), ("Content-Length", str(len(body)))]), body)

        bind = "0.0.0.0" if page_dir else "localhost"
        async with websockets.serve(self.handler, bind, port, process_request=process_request):
            print(f"verso host at ws://{'<this mac>' if page_dir else 'localhost'}:{port}; waiting for the page's start"
                  + (f"; serving the page from {page_dir} over http on the same port" if page_dir else ""), flush=True)
            await asyncio.Future()


async def walk_alone(settings, label, no_page=True):
    host = Host(settings)
    run = Run(host, "walk", "walk", settings, label=label or f"walk-{time.strftime('%Y%m%d-%H%M%S')}", no_page=no_page)
    run.s["injector"]["arm"] = run.s["injector"]["arm"] if run.s["injector"]["arm"] in ("walked", "neutral") else "walked"
    await run.enliven()
    print(f"spindles in {os.path.relpath(os.path.join(run.dir, 'spindles'), HERE)}; the walk cost ${run.spend.usd['walk']:.4f} in {run.spend.calls['walk']} calls")
    return run


def main():
    ap = argparse.ArgumentParser(description="verso host")
    ap.add_argument("--no-page", action="store_true", help="run headless from the command line")
    ap.add_argument("--replay", metavar="RUN", help="replay runs/<RUN>/words.jsonl and floor.jsonl")
    ap.add_argument("--live", action="store_true", help="read the voices piece's socket")
    ap.add_argument("--walk", action="store_true", help="run the injector walk alone and keep the spindles")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--cells", help="osh9 | four | osh9-free | four-free | a comma list of tier-effort[:layer]")
    ap.add_argument("--arm", help="walked | yoked | neutral | none")
    ap.add_argument("--source", help="beach | file (the injector block)")
    ap.add_argument("--block", help="the injector block's name on the beach, or its file")
    ap.add_argument("--door", help="api | dry")
    ap.add_argument("--stop-usd", type=float)
    ap.add_argument("--id", help="the run's label under runs/")
    ap.add_argument("--yoke-from", help="runs/<walk run> whose spindles the yoked arm is handed")
    ap.add_argument("--until", type=float, help="replay only the first N seconds of the talk (for tests)")
    ap.add_argument("--page", metavar="DIR", help="also serve verso.html (and theme.css, theme.js) from DIR over plain http on the same port, for the phone")
    ap.add_argument("--set", action="append", default=[], metavar="KEY=JSON", help="any setting, e.g. threshold=2 or injector.arm=none")
    a = ap.parse_args()
    sets = list(a.set)
    if a.cells:
        sets.append(f"cells={a.cells}")
    if a.arm:
        sets.append(f"injector.arm={a.arm}")
    if a.source:
        sets.append(f"injector.source={a.source}")
    if a.block:
        sets.append(f"injector.{'file' if a.block.endswith('.json') else 'block'}={a.block}")
    if a.door:
        sets.append(f"door={a.door}")
    if a.stop_usd is not None:
        sets.append(f"stop_usd={a.stop_usd}")
    s = load_settings(sets)
    os.makedirs(RUNS, exist_ok=True)
    if a.walk:
        asyncio.run(walk_alone(s, a.id))
    elif a.replay or a.live:
        host = Host(s)
        if a.no_page:
            run = Run(host, "replay" if a.replay else "live", a.replay or "live", s, label=a.id, no_page=True, speed=a.speed, yoke_from=a.yoke_from, until=a.until)
            asyncio.run(run.go())
        else:
            async def both():
                await host.start("replay" if a.replay else "live", a.replay or "live", label=a.id, speed=a.speed, yoke_from=a.yoke_from)
                await host.serve(a.page)
            asyncio.run(both())
    else:
        asyncio.run(Host(s).serve(a.page))


if __name__ == "__main__":
    main()
