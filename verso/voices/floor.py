#!/usr/bin/env python3
"""floor.py <audio.wav> --out <run>/ [--words <run>/words.jsonl]

The floor as a signal ten times a second, from the audio alone. Silero VAD says
whether anyone is voicing (never who); from it, at every tenth of a second:

  open    0 while anyone voices; through a pause it rises along a smoothstep,
          3x^2 - 2x^3 with x = pause / --open-s, reaching 1 at 1.5 s
  landed  true on the one tick at which a pause after speech first passes
          --landing (0.4 s): a turn end, judged from the silence alone
  bid     a speaker starting while the floor was open (after a landed pause, or
          at the very start); with labelled words also a change of speaker with
          no landing between (a quick handover, or an interruption over
          someone): their label when the labelling knows, else "?"

The floor is computed causally, frame by frame, by the same Stream that live.py
runs on the microphone, so a replay of floor.jsonl is what live would have shown.
Only the bids' labels come from afterwards (the labelling); this command alone
leaves them "?". Writes <run>/floor.jsonl, one line per tick.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 16000
HOP = 512                 # Silero's frame at 16 kHz: 32 ms
FRAME_S = HOP / SR
TICK = 0.1
LANDING_S = 0.4           # a pause longer than this is a judged turn end
OPEN_S = 1.5              # a pause this long opens the floor fully
VAD_ON, VAD_OFF = 0.5, 0.35   # hysteresis on Silero's speech probability
CONFIRM = 2               # frames above VAD_ON before speech is believed (64 ms: a click is not a voice)


class Stream:
    """The floor, causally. push() one Silero probability per 32 ms frame; it
    returns the ticks that fall due, each {"t", "open", "landed", "bid"}."""

    def __init__(self, landing: float = LANDING_S, open_s: float = OPEN_S):
        self.landing, self.open_s = landing, open_s
        self.t = 0.0                  # audio time at the end of the last frame
        self.speaking = False
        self.above = 0                # frames above VAD_ON while not yet speaking
        self.onset = None             # when the current run of speech began
        self.last_end = None          # when the last run of speech ended
        self.landed = True            # the current pause has landed (or there was none)
        self.bid = None               # a bid waiting for its tick
        self.next_tick = 0.0
        self.regions = []             # speech so far, [(t0, t1)], the last open-ended while speaking

    def push(self, p: float) -> list:
        start, self.t = self.t, self.t + FRAME_S
        if self.speaking:
            if p < VAD_OFF:
                self.speaking, self.last_end, self.landed = False, start, False
                self.regions[-1] = (self.onset, start)
        elif p >= VAD_ON:
            self.above += 1
            if self.above >= CONFIRM:
                onset = start - (CONFIRM - 1) * FRAME_S
                if self.last_end is None or onset - self.last_end >= self.landing:
                    self.bid = (onset, "?")
                self.speaking, self.above, self.onset = True, 0, onset
                self.regions.append((onset, None))
        else:
            self.above = 0
        out = []
        while self.next_tick <= self.t + 1e-9:
            out.append(self.tick(self.next_tick))
            self.next_tick = round(self.next_tick + TICK, 6)
        return out

    def open_at(self, t: float) -> float:
        if self.speaking:
            return 0.0
        if self.last_end is None:
            return 1.0                # nobody has spoken yet: the floor is open
        x = min(1.0, max(0.0, t - self.last_end) / self.open_s)
        return x * x * (3 - 2 * x)

    def tick(self, t: float) -> dict:
        landed = False
        if not self.speaking and not self.landed and t - self.last_end >= self.landing:
            landed = self.landed = True
        bid, self.bid = (self.bid[1] if self.bid else None), None
        return {"t": round(t, 1), "open": round(self.open_at(t), 2), "landed": landed, "bid": bid}


def load_audio(path) -> np.ndarray:
    """Any audio file, decoded by ffmpeg to 16 kHz mono float32."""
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(pcm, np.float32).copy()


_vad = None


def vad_model():
    global _vad
    if _vad is None:
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            from silero_vad import load_silero_vad
            _vad = load_silero_vad()
    return _vad


def vad_probs(audio: np.ndarray) -> np.ndarray:
    """Silero's speech probability per 32 ms frame; frame i covers [i*HOP, (i+1)*HOP)."""
    import torch
    model = vad_model()
    model.reset_states()
    with torch.no_grad():
        p = model.audio_forward(torch.from_numpy(audio), SR)
    return p.squeeze(0).numpy()


def runs(mask: np.ndarray) -> list:
    """[(value, start, end)] for each run of equal values in a boolean array."""
    edges = np.flatnonzero(np.diff(mask.astype(np.int8))) + 1
    bounds = np.concatenate([[0], edges, [len(mask)]])
    return [(bool(mask[a]), int(a), int(b)) for a, b in zip(bounds[:-1], bounds[1:])]


def speech_regions(probs: np.ndarray, min_speech: float = 0.12, min_gap: float = 0.1) -> list:
    """Speech as [(t0, t1)], tidied with hindsight (gaps under 0.1 s bridged, blips under
    0.12 s dropped): for fitting words and windowing speakers, never for the floor."""
    mask, state = np.zeros(len(probs), bool), False
    for i, p in enumerate(probs):
        state = p >= (VAD_OFF if state else VAD_ON)
        mask[i] = state
    for v, a, b in runs(mask):
        if not v and 0 < a and b < len(mask) and (b - a) * FRAME_S < min_gap:
            mask[a:b] = True
    for v, a, b in runs(mask):
        if v and (b - a) * FRAME_S < min_speech:
            mask[a:b] = False
    return [(a * FRAME_S, b * FRAME_S) for v, a, b in runs(mask) if v]


def ticks(probs: np.ndarray, duration: float, words: list | None = None,
          landing: float = LANDING_S, open_s: float = OPEN_S) -> list:
    """The floor at every tenth of a second from 0 to the end of the audio, causally."""
    s, out = Stream(landing, open_s), []
    for p in probs:
        out += s.push(float(p))
    out = [f for f in out if f["t"] <= duration + 1e-9]
    return name_bids(out, words) if words else out


def name_bids(fl: list, words: list) -> list:
    """Give each bid the speaker of the first word at its onset, and add a bid at
    every change of speaker that no landing preceded (a handover or an interruption)."""
    fl = [dict(f) for f in fl]
    for f in fl:
        if f["bid"] == "?":
            w = next((w for w in words if f["t"] - 0.35 <= w["t0"] <= f["t"] + 0.6), None)
            f["bid"] = w["s"] if w else "?"
    bid_t = [f["t"] for f in fl if f["bid"]]
    for prev, w, nxt in zip(words, words[1:], words[2:] + [None]):
        held = nxt is None or nxt["s"] == w["s"]           # a lone flipped word is not a bid
        if w["s"] != prev["s"] and held and not any(abs(t - w["t0"]) < 0.6 for t in bid_t):
            k = min(len(fl) - 1, int(np.ceil(w["t0"] / TICK - 1e-6)))
            if fl[k]["bid"] is None:
                fl[k]["bid"] = w["s"]
                bid_t.append(fl[k]["t"])
    return fl


def stats(floor: list) -> dict:
    """What a reader of floor.jsonl can count: landings, bids, the longest stretch open."""
    longest, start, best_start = 0.0, None, None
    for f in floor:
        if f["open"] > 0:
            start = f["t"] if start is None else start
            if f["t"] - start + TICK > longest:
                longest, best_start = f["t"] - start + TICK, start
        else:
            start = None
    return {"ticks": len(floor), "landings": sum(f["landed"] for f in floor),
            "bids": sum(f["bid"] is not None for f in floor),
            "longest_pause_s": round(longest, 1), "longest_pause_at": best_start}


def write_jsonl(path: Path, rows: list) -> None:
    with open(path, "w") as f:
        f.writelines(json.dumps(r) + "\n" for r in rows)


def read_jsonl(path: Path) -> list:
    return [json.loads(line) for line in open(path) if line.strip()]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio", type=Path)
    ap.add_argument("--out", type=Path, required=True, help="the run folder")
    ap.add_argument("--words", type=Path, help="labelled words.jsonl, to name the bids")
    ap.add_argument("--landing", type=float, default=LANDING_S, help="pause that judges a turn ended, s")
    ap.add_argument("--open-s", type=float, default=OPEN_S, help="pause that opens the floor fully, s")
    args = ap.parse_args()
    audio = load_audio(args.audio)
    words = read_jsonl(args.words) if args.words else None
    fl = ticks(vad_probs(audio), len(audio) / SR, words, args.landing, args.open_s)
    args.out.mkdir(parents=True, exist_ok=True)
    write_jsonl(args.out / "floor.jsonl", fl)
    print(f"{args.out / 'floor.jsonl'}: {json.dumps(stats(fl))}", file=sys.stderr)


if __name__ == "__main__":
    main()
