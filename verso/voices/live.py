#!/usr/bin/env python3
"""live.py — the floor live from the microphone, and the words after it.

  python live.py                          the Mac's default microphone
  python live.py --device 1               another input (python -m sounddevice lists them)
  python live.py --file runs/x/audio.wav  a file fed at real speed, as if heard

Serves ws://localhost:8766. Every message is one JSON line in the shape of a
floor.jsonl line ({"t", "open", "landed", "bid"}: ten a second, live) or of a
words.jsonl line ({"t0", "t1", "s", "w"}: each stretch of speech, once whisper
has it). Times are seconds since listening began. The floor is the same Stream
floor.py runs, so its bids stay "?": at an onset nobody yet knows who it is.

A stretch of speech goes to whisper when the floor lands, or at --stretch-s
(cut at its latest short pause) when someone talks on; stretches that queue
while whisper works go together as one. Each voiced region of a stretch gets a
rough live guess of its speaker ("?" with --no-who).

Nothing is recorded: no audio is kept beyond the last minute in memory, and the
words and the floor reach the disk only with --out.
"""
import argparse
import asyncio
import json
import queue
import statistics
import sys
import threading
import time
import warnings
from pathlib import Path

import numpy as np

import floor
import label

SR, HOP = floor.SR, floor.HOP
PORT = 8766
PAD_S = 0.2           # audio kept either side of a stretch of speech for whisper
STRETCH_S = 5.0       # a stretch longer than this is cut at its latest short pause
SAME_VOICE = 0.45     # cosine similarity at which a region joins a voice already heard


class Ring:
    """The last minute of audio, by absolute sample position: whisper reads back from it."""

    def __init__(self, seconds: float = 60.0):
        self.buf, self.n = np.zeros(int(seconds * SR), np.float32), 0

    def write(self, x: np.ndarray) -> None:
        i = self.n % len(self.buf)
        k = min(len(x), len(self.buf) - i)
        self.buf[i:i + k], self.buf[:len(x) - k] = x[:k], x[k:]
        self.n += len(x)

    def read(self, t0: float, t1: float) -> np.ndarray:
        a, b = max(int(t0 * SR), self.n - len(self.buf), 0), min(int(t1 * SR), self.n)
        return self.buf[np.arange(a, max(a, b)) % len(self.buf)].copy()


class Who:
    """A rough live guess of who is speaking: a region's voice, embedded, joins the
    nearest voice already heard, or becomes the next letter."""

    def __init__(self):
        import speakers
        self.speakers, self.cents = speakers, []
        speakers.embedder()

    def __call__(self, audio: np.ndarray) -> str:
        e = self.speakers.embed(audio, [(0.0, len(audio) / SR)])[0]
        sims = [float(c @ e / np.linalg.norm(c)) for c in self.cents]
        if sims and max(sims) >= SAME_VOICE:
            i = int(np.argmax(sims))
            self.cents[i] = self.cents[i] + e
        else:
            i = len(self.cents)
            self.cents.append(e)
        return chr(ord("A") + i) if i < 26 else f"S{i}"


def merge(regs: list, gap: float) -> list:
    out = []
    for a, b in regs:
        if out and a - out[-1][1] < gap:
            out[-1] = (out[-1][0], b)
        else:
            out.append((a, b))
    return out


class Live:
    def __init__(self, args):
        self.args = args
        self.blocks = queue.Queue()          # audio in, 512 samples at a time
        self.stretches = queue.Queue()       # (t0, t1, speech regions) out, for whisper
        self.stream = floor.Stream(args.landing, args.open_s)
        self.ring = Ring()
        self.start = None                    # when the current stretch began
        self.loop = self.stopping = None
        self.clients = set()
        self.lags, self.whisper_s, self.stretch_s = [], [], []
        self.n_ticks = self.n_words = 0
        self.ready, self.done, self.halt = threading.Event(), threading.Event(), threading.Event()
        self.out = None

    # ---- the floor, frame by frame -------------------------------------------------
    def listen(self) -> None:
        import torch
        torch.set_num_threads(1)
        vad = floor.vad_model()
        vad.reset_states()
        s = self.stream
        while True:
            block = self.blocks.get()
            if block is None:
                break
            self.ring.write(block)
            with torch.no_grad():
                p = float(vad(torch.from_numpy(block), SR))
            for tick in s.push(p):
                self.emit("floor", tick)
                if tick["landed"] and self.start is not None:
                    self.cut(s.last_end + PAD_S, None)
            if s.speaking and self.start is None:
                self.start = max(0.0, s.onset - PAD_S)
            if s.speaking and s.t - self.start >= self.args.stretch_s:
                gaps = [(a[1], b[0]) for a, b in zip(s.regions, s.regions[1:])
                        if a[1] is not None and a[1] > self.start + 1.5 and b[0] < s.t - 0.2]
                if gaps:
                    self.cut(gaps[-1][0] + 0.05, gaps[-1][1] - 0.05)
                else:
                    self.cut(s.t, s.t)
            del s.regions[:-50]
        if self.start is not None:
            self.cut(s.t, None)
        self.stretches.put(None)

    def cut(self, end: float, next_start: float | None) -> None:
        t0, t1 = self.start, end
        regs = [(max(a, t0), min(b if b is not None else t1, t1)) for a, b in self.stream.regions
                if (b is None or b > t0) and a < t1]
        self.stretches.put((t0, t1, regs))
        self.start = next_start

    # ---- the words, stretch by stretch ---------------------------------------------
    def transcribe(self) -> None:
        import speakers
        a = self.args
        label.transcribe(np.zeros(SR, np.float32), a.model, a.language)    # load and warm the model in this
        who = Who() if a.who else None                                     # thread: MLX keeps streams per thread
        self.ready.set()
        end = False
        while not end:
            item = self.stretches.get()
            if item is None:
                break
            t0, t1, regs = item
            while not self.stretches.empty():                              # a backlog goes as one
                nxt = self.stretches.get()
                if nxt is None:
                    end = True
                    break
                t1, regs = nxt[1], regs + nxt[2]
            began = time.time()
            audio = self.ring.read(t0, t1)
            words = label.snap(label.voiced(label.transcribe(audio, a.model, a.language, offset=t0), regs), regs)
            turns = []
            if who and words:
                for x, y in merge(regs, 0.25):
                    if y - x >= 0.5:
                        turns.append((x, y, who(self.ring.read(x, y))))
            words = speakers.assign(words, turns) if turns else [dict(w, s="?") for w in words]
            self.whisper_s.append(time.time() - began)
            self.stretch_s.append(t1 - t0)
            now = self.stream.t
            for w in words:
                self.lags.append(now - w["t1"])
                self.emit("words", {"t0": w["t0"], "t1": w["t1"], "s": w["s"], "w": w["w"]})
            if words:
                self.say_words(words, now)
        self.done.set()
        if self.loop:
            self.loop.call_soon_threadsafe(lambda: self.stopping.done() or self.stopping.set_result(None))

    # ---- out: the socket, the terminal, the disk -----------------------------------
    def emit(self, kind: str, event: dict) -> None:
        if self.loop:
            self.loop.call_soon_threadsafe(self.send, kind, event)

    def send(self, kind: str, event: dict) -> None:
        from websockets.asyncio.server import broadcast
        line = json.dumps(event)
        broadcast(self.clients, line)
        if self.out:
            self.out[kind].write(line + "\n")
        if kind == "floor":
            self.n_ticks += 1
            self.show(event)
        else:
            self.n_words += 1

    def show(self, f: dict) -> None:
        bar = "#" * round(f["open"] * 20)
        lag = f"words lag {statistics.median(self.lags[-50:]):.1f} s" if self.lags else "words: waiting"
        line = (f"t {f['t']:7.1f}  open |{bar:<20}| {f['open']:.2f}  "
                f"{'LANDED' if f['landed'] else '      '}  {'bid ' + f['bid'] if f['bid'] else '      '}  "
                f"{lag}  clients {len(self.clients)}")
        if sys.stdout.isatty():
            print("\r" + line, end="", flush=True)
        elif not self.args.quiet_ticks or f["landed"] or f["bid"]:
            print(line, flush=True)

    def say_words(self, words: list, now: float) -> None:
        runs, cur = [], None
        for w in words:
            if cur and cur[0] == w["s"]:
                cur[1].append(w)
            else:
                cur = (w["s"], [w])
                runs.append(cur)
        for s, ws in runs:
            text = " ".join(w["w"] for w in ws) if not self.args.no_text else f"({len(ws)} words)"
            print(f"{chr(10) if sys.stdout.isatty() else ''}  [{s} {ws[0]['t0']:.1f}-{ws[-1]['t1']:.1f} s, "
                  f"lag {now - ws[-1]['t1']:.1f} s] {text}", flush=True)

    # ---- the sources ---------------------------------------------------------------
    def feed_file(self, path: Path, speed: float) -> None:
        audio = floor.load_audio(path)
        begun = time.monotonic()
        for i in range(0, len(audio) - HOP + 1, HOP):
            if self.halt.is_set():
                return
            delay = begun + (i + HOP) / SR / speed - time.monotonic()
            if delay > 0:
                time.sleep(delay)
            self.blocks.put(audio[i:i + HOP])
            if self.args.seconds and (i + HOP) / SR >= self.args.seconds:
                break
        self.blocks.put(None)

    def mic(self):
        import sounddevice as sd

        def heard(indata, frames, at, status):
            self.blocks.put(indata[:, 0].copy())
        return sd.InputStream(samplerate=SR, channels=1, dtype="float32", blocksize=HOP,
                              device=self.args.device, callback=heard)

    # ---- the whole ----------------------------------------------------------------
    async def serve(self) -> None:
        from websockets.asyncio.server import serve

        async def handler(ws):
            self.clients.add(ws)
            try:
                await ws.wait_closed()
            finally:
                self.clients.discard(ws)
        async with serve(handler, "localhost", self.args.port):
            await self.stopping

    def run(self) -> None:
        a = self.args
        import socket
        with socket.socket() as probe:          # fail before anything is loaded or opened
            try:
                probe.bind(("127.0.0.1", a.port))
            except OSError:
                sys.exit(f"port {a.port} is in use: is another live.py running? (--port to choose another)")
        if a.out:
            a.out.mkdir(parents=True, exist_ok=True)
            self.out = {k: open(a.out / f"{k}.jsonl", "w") for k in ("floor", "words")}
        print(f"loading Silero VAD and {a.model} ...", file=sys.stderr)
        floor.vad_model()
        threading.Thread(target=self.transcribe, daemon=True).start()
        self.ready.wait()
        self.loop = asyncio.new_event_loop()
        self.stopping = self.loop.create_future()
        threading.Thread(target=self.listen, daemon=True).start()
        mic = None
        if a.file:
            threading.Thread(target=self.feed_file, args=(a.file, a.speed), daemon=True).start()
            print(f"feeding {a.file} at {a.speed}x; ws://localhost:{a.port}", file=sys.stderr)
        else:
            mic = self.mic()
            mic.start()
            print(f"listening on input {mic.device}; ws://localhost:{a.port}; ctrl-c to stop", file=sys.stderr)
            if a.seconds:
                threading.Timer(a.seconds, lambda: self.blocks.put(None)).start()
        try:
            self.loop.run_until_complete(self.serve())
        except KeyboardInterrupt:              # stop listening; let the words in hand reach the socket
            print("\nstopping: finishing the words in hand ...", file=sys.stderr)
            self.halt.set()
            self.blocks.put(None)
            try:
                self.loop.run_until_complete(asyncio.wait_for(asyncio.shield(self.stopping), 30))
            except (KeyboardInterrupt, asyncio.TimeoutError):
                pass
        finally:
            if mic:
                mic.stop()
            if self.out:
                for f in self.out.values():
                    f.close()
        self.summary()

    def summary(self) -> None:
        print("", file=sys.stderr)
        if not self.lags:
            print(f"{self.n_ticks} floor ticks; no words", file=sys.stderr)
            return
        q = sorted(self.lags)
        print(f"{self.n_ticks} floor ticks, {self.n_words} words in {len(self.whisper_s)} whisper calls "
              f"(stretches median {statistics.median(self.stretch_s):.1f} s)\n"
              f"word lag, from the word's end to its message: median {statistics.median(q):.2f} s, "
              f"p90 {q[min(len(q) - 1, int(0.9 * len(q)))]:.2f} s, max {q[-1]:.2f} s\n"
              f"whisper per call: median {statistics.median(self.whisper_s):.2f} s, max {max(self.whisper_s):.2f} s",
              file=sys.stderr)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--file", type=Path, help="feed this audio at real speed instead of the microphone")
    ap.add_argument("--speed", type=float, default=1.0, help="with --file: faster than real time")
    ap.add_argument("--device", help="input device number or name (python -m sounddevice)")
    ap.add_argument("--port", type=int, default=PORT)
    ap.add_argument("--model", default=label.MODEL, help="e.g. mlx-community/whisper-small.en-mlx for less lag")
    ap.add_argument("--language", default="en")
    ap.add_argument("--stretch-s", type=float, default=STRETCH_S, help="longest stretch sent to whisper, s")
    ap.add_argument("--landing", type=float, default=floor.LANDING_S, help="pause that judges a turn ended, s")
    ap.add_argument("--open-s", type=float, default=floor.OPEN_S, help="pause that opens the floor fully, s")
    ap.add_argument("--no-who", dest="who", action="store_false", help="leave the words' speakers as ?")
    ap.add_argument("--out", type=Path, help="also write floor.jsonl and words.jsonl here")
    ap.add_argument("--seconds", type=float, help="stop after this many seconds")
    ap.add_argument("--no-text", action="store_true", help="print how many words, not the words")
    ap.add_argument("--quiet-ticks", action="store_true", help="off a terminal, print only landings and bids")
    a = ap.parse_args()
    if a.device and a.device.isdigit():
        a.device = int(a.device)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        Live(a).run()


if __name__ == "__main__":
    main()
