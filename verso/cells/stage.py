"""The stage: a phone's ear in, the films out, for a talk given far from this Mac.

  host.py --stage     serve the phone page (verso/stage/phone.html) and one socket, on settings.port

The phone sends its microphone as 16 kHz mono 16-bit frames. The stage relays them to live.py --socket
(settings.voices_socket), which hears them through whisper and sends the words back. From the last ~30 s of
words the stage matches the catalogue's keywords at once, and every ~6 s asks Haiku for the same idea said in
other words, spending at most settings.stage_usd for the whole talk. Every screen
(happyseaurchin.com/mindflow/live/?source=wss://<this host>) is sent each phrase heard, {type: heard, text},
and each choice, {type: film, films, phrase, why, strong}. The screen keeps itself calm: it holds a film at
least 30 s unless a match is strong. A pick from the phone goes to every screen at once and overrides the
chooser there. The talking cells stay off, and nothing here speaks.

The phone proves itself with a stage word. The first phone to connect chooses the word; only its hash is kept,
at ~/.config/verso/stage-word, so the word itself is never written down anywhere. Screens need no word: they
only listen. Delete that file to choose a new word. What was heard, and why each film was chosen, is logged
at runs/stage-<when>/, which stays on this Mac.
"""
import asyncio, collections, hashlib, json, math, os, re, time, urllib.request

from door import Spend, call, dry_call, parse_json

HERE = os.path.dirname(os.path.abspath(__file__))
WORD_FILE = os.path.expanduser(os.environ.get("VERSO_STAGE_WORD_FILE", "~/.config/verso/stage-word"))   # a test stage keeps its own
LOCAL_CATALOGUE = os.path.expanduser("~/Projects/happyseaurchin/mindflow/live/catalogue.json")
WINDOW_S = 30.0      # the words the chooser weighs
FADE_S = 12.0        # a mention's weight falls by e every this many seconds
ASK_S = 6.0          # how often Haiku is asked, when something new was said
QUIET_REPEAT_S = 20  # the same choice again within this says nothing new to a screen


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", s.lower().replace("→", " to ")).strip()


def load_catalogue(where):
    """The screen's own catalogue: from the site, else from the local checkout (before the site has it)."""
    for src in [where, LOCAL_CATALOGUE] if where != LOCAL_CATALOGUE else [where]:
        try:
            if re.match(r"https?://", src):
                with urllib.request.urlopen(src, timeout=10) as r:
                    return json.load(r), src
            return json.load(open(src)), src
        except Exception as e:
            print(f"stage: no catalogue at {src} ({type(e).__name__})", flush=True)
    raise SystemExit("stage: no catalogue to choose from")


class Chooser:
    """The keyword match the screen's ?listen runs too: each mention of a concept's word, weighted, fading."""

    def __init__(self, cat):
        self.concepts = [dict(idea=c.get("idea", ""), films=c["films"],
                              words=[(float(k), re.compile(r"(^| )" + " ?".join(map(re.escape, norm(w).split())) + r"(s|es)?(?= |$)"))
                                     for w, k in c["words"].items()])
                         for c in cat.get("concepts", [])]
        self.titles = cat.get("films", {})

    def best(self, heard, now):
        """(concept index, score, strong) of the idea most heard lately, when the latest phrase names it too; else None."""
        sc, latest = [], []
        for c in self.concepts:
            s = last = 0.0
            for i, (t, text) in enumerate(heard):
                k = math.exp(-(now - t) / FADE_S)
                for w, rx in c["words"]:
                    n = len(rx.findall(text))
                    if n:
                        s += n * w * k
                        last += n * w if i == len(heard) - 1 else 0
            sc.append(s)
            latest.append(last)
        order = sorted(range(len(sc)), key=lambda i: -sc[i])
        if not order or sc[order[0]] < 0.6 or not latest[order[0]]:
            return None
        b, second = order[0], (sc[order[1]] if len(order) > 1 else 0.0)
        return b, sc[b], sc[b] >= 2.2 and sc[b] - second >= 1.0


class Stage:
    def __init__(self, host, settings):
        self.host, self.s = host, settings
        cat, self.catalogue_from = load_catalogue(settings.get("stage_catalogue", LOCAL_CATALOGUE))
        self.chooser = Chooser(cat)
        self.voices = None                         # the socket to live.py
        self.phones, self.screens = set(), set()
        self.heard = []                            # (wall time, normalised phrase), the last WINDOW_S
        self.said = []                             # (wall time, phrase as heard), the same span, for Haiku
        self.recent = collections.deque(maxlen=12)  # phrases as heard, for a screen that joins late
        self.n_phrases = self.asked = 0
        self.words, self.flush = [], None
        self.last = None                           # the last film message, for a screen that joins late
        self.sent = (None, None, 0.0)              # (film, strong, when) of the chooser's last message
        self.ticks = collections.deque(maxlen=3000)  # (stream t, wall t) from live.py's floor: when audio arrived
        self.spend = Spend(float(settings.get("stage_usd", 1.0)))
        self.door = dry_call if settings.get("door") == "dry" else call
        self.dir = os.path.join(HERE, "runs", f"stage-{time.strftime('%Y%m%d-%H%M%S')}")
        os.makedirs(self.dir, exist_ok=True)
        self.calls = os.path.join(self.dir, "calls.jsonl")
        self.log = open(os.path.join(self.dir, "stage.jsonl"), "a", buffering=1)
        ideas = "\n".join(f"{i + 1}. {c['idea']}" for i, c in enumerate(self.chooser.concepts))
        self.system = [{"type": "text", "text": (
            "You watch a live talk and choose the film shown behind the speaker. These are the ideas a film can show, "
            f"each with its number:\n{ideas}\n\n"
            "Judge by meaning, not by matching words: the same idea said in other words counts, and a word from an idea "
            "used in passing does not. Weigh the latest words most. Reply with one JSON object and nothing else: "
            '{"idea": <the number of the idea being talked about now, or 0 when none fits>, '
            '"strong": <true only when that idea is clearly what the speaker is on now>}')}]

    # ---- the socket's parties ---------------------------------------------------------------------------

    def hello(self):
        return dict(type="stage", event="stage", films=self.chooser.titles, usd=round(self.spend.total, 4),
                    cap=self.spend.stop_usd, hearing=self.voices is not None, word_set=os.path.exists(WORD_FILE))

    async def on(self, ws, ev, m):
        """A text message from the page: a screen arriving, a phone proving itself, a pick."""
        if ev == "screen":
            self.screens.add(ws)
            await ws.send(json.dumps(dict(type="state", recent=list(self.recent), film=self.last)))
        elif ev == "phone":
            word = str(m.get("word") or "").strip().lower()   # a phone capitalises the first letter on its own
            h = hashlib.sha256(("verso-stage:" + word).encode()).hexdigest()
            fresh = not os.path.exists(WORD_FILE) and len(word) >= 4
            if fresh:
                os.makedirs(os.path.dirname(WORD_FILE), exist_ok=True)
                with open(os.open(WORD_FILE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "w") as f:
                    f.write(h)
            ok = os.path.exists(WORD_FILE) and open(WORD_FILE).read().strip() == h
            if ok:
                self.phones.add(ws)
            await ws.send(json.dumps(dict(type="phone", ok=ok, set=fresh, why=None if ok else "word")))
            self.note(kind="phone", ok=ok, set=fresh)
        elif ws not in self.phones:
            return
        elif ev == "pick":
            film = m.get("film") or None
            self.last = dict(film=film, why="manual")
            self.host.emit("film", film=film, why="manual")
            self.note(kind="pick", film=film)
            print(f"stage: picked from the phone: {film or 'the words alone'}", flush=True)
        elif ev == "release":
            self.host.emit("film", why="release")
            self.note(kind="release")

    def gone(self, ws):
        self.phones.discard(ws)
        self.screens.discard(ws)

    async def audio(self, ws, data):
        """A frame from a phone that proved itself, on to live.py."""
        if ws in self.phones and self.voices is not None:
            try:
                await self.voices.send(data)
            except Exception:
                pass

    # ---- the ear: live.py's words and floor ----------------------------------------------------------------

    async def link(self):
        import websockets
        url, said = self.s["voices_socket"], False
        while True:
            try:
                async with websockets.connect(url, open_timeout=5, max_size=None) as ws:
                    self.voices, said = ws, False
                    print(f"stage: hearing through {url}", flush=True)
                    self.host.emit("stage", **{k: v for k, v in self.hello().items() if k not in ("type", "event")})
                    async for raw in ws:
                        m = json.loads(raw)
                        if "w" in m:
                            self.word(m)
                        elif "open" in m:
                            self.ticks.append((m["t"], time.time()))
            except Exception as e:
                if not said:
                    print(f"stage: live.py is not up at {url} ({type(e).__name__}); trying every 2 s", flush=True)
                    said = True
            if self.voices is not None:
                self.voices = None
                self.host.emit("stage", **{k: v for k, v in self.hello().items() if k not in ("type", "event")})
            await asyncio.sleep(2)

    def word(self, m):
        """Words come in a burst for each stretch whisper heard: a burst is one phrase."""
        self.words.append(m)
        if self.flush:
            self.flush.cancel()
        self.flush = asyncio.get_running_loop().call_later(0.25, self.phrase)

    def arrived(self, t):
        """When the audio at stream time t reached this Mac (live.py's floor ticks as it hears)."""
        for st, wall in reversed(self.ticks):
            if st <= t:
                return wall
        return None

    def phrase(self):
        ws, self.words = self.words, []
        text = " ".join(w["w"].strip() for w in ws).strip()
        if not text:
            return
        now = time.time()
        self.heard = [h for h in self.heard if now - h[0] <= WINDOW_S] + [(now, norm(text))]
        self.said = [h for h in self.said if now - h[0] <= WINDOW_S] + [(now, text)]
        self.recent.append(text)
        self.n_phrases += 1
        t1 = ws[-1]["t1"]
        at = self.arrived(t1)
        self.host.emit("heard", text=text)
        self.note(kind="heard", text=text, t1=t1, whisper_s=round(now - at, 2) if at else None)
        hit = self.chooser.best(self.heard, now)
        if hit:
            b, score, strong = hit
            self.propose(b, strong, "words", text, score=score, at=at)

    # ---- choosing ---------------------------------------------------------------------------------------

    def propose(self, b, strong, why, phrase, score=None, at=None):
        films = self.chooser.concepts[b]["films"]
        now = time.time()
        f, st, when = self.sent
        if films[0] == f and strong == st and now - when < QUIET_REPEAT_S:
            return
        self.sent = (films[0], strong, now)
        msg = dict(films=films, strong=strong, why=why, phrase=phrase[-240:], score=round(score, 2) if score is not None else None)
        self.last = msg
        self.host.emit("film", **msg)
        lag = round(now - at, 2) if at else None
        links = {"phone_rtt_ms": [round((p.latency or 0) * 1000) for p in self.phones],
                 "screen_rtt_ms": [round((s.latency or 0) * 1000) for s in self.screens]}
        self.note(kind="film", films=films, strong=strong, why=why, score=msg["score"], phrase=phrase[-120:],
                  word_to_choice_s=lag, **links)
        print(f"stage: {why}{' strong' if strong else ''} {msg['score'] or ''} -> {films[0]}"
              f"{f'  ({lag} s from the word reaching this Mac)' if lag is not None else ''}  \"{phrase[-70:]}\"", flush=True)

    async def ask_loop(self):
        """Every ASK_S, when something new was said: Haiku names the idea, if any, said in other words."""
        while True:
            await asyncio.sleep(ASK_S)
            if self.asked == self.n_phrases or self.spend.stopped:
                continue
            self.asked = self.n_phrases
            now = time.time()
            talk = " / ".join(p for t, p in self.said if now - t <= WINDOW_S)
            if not talk:
                continue
            try:
                r = await self.door("haiku", "low", self.system, f"The last 30 seconds of the talk, oldest first:\n{talk}",
                               max_tokens=400, spend=self.spend, kind="loop", log=self.calls)
            except Exception as e:      # the cap reached between the check and the call: keywords carry on
                print(f"stage: haiku: {e}", flush=True)
                continue
            self.host.emit("spend", usd=round(self.spend.total, 4), cap=self.spend.stop_usd)
            if r["error"]:
                print(f"stage: haiku: {r['error']}", flush=True)
                continue
            j, _ = parse_json(r["reply"])
            try:
                i = int((j or {}).get("idea") or 0)
            except (TypeError, ValueError):
                i = 0
            self.note(kind="haiku", idea=i, strong=bool((j or {}).get("strong")), ms=r["ms"], usd=r["usd"], total=round(self.spend.total, 4))
            if 1 <= i <= len(self.chooser.concepts):
                self.propose(i - 1, bool(j.get("strong")), "haiku", self.said[-1][1] if self.said else "", at=None)
            if self.spend.stopped:
                print(f"stage: Haiku stops here, at ${self.spend.total:.2f} of ${self.spend.stop_usd:.2f}; keywords carry on", flush=True)

    def note(self, **kw):
        self.log.write(json.dumps(dict(at=round(time.time(), 3), **kw)) + "\n")

    async def run(self):
        print(f"stage: {len(self.chooser.concepts)} ideas, {len(self.chooser.titles)} films from {self.catalogue_from}; "
              f"Haiku capped at ${self.spend.stop_usd:.2f}; the log at {os.path.relpath(self.dir, HERE)}", flush=True)
        await asyncio.gather(self.link(), self.ask_loop())
