#!/usr/bin/env python3
"""label.py <audio.wav> --out <run>/

Words with their times and speakers, and the floor, from one audio file, all on
the Mac. Writes <run>/words.jsonl ({"t0", "t1", "s", "w"}, one word per line,
speakers A, B, C... in order of first speech) and <run>/floor.jsonl (floor.py).

  words     mlx-whisper (large-v3-turbo on the Apple GPU) with word timestamps;
            every punctuation mark and capital the transcriber adds is stripped:
            a full stop added with hindsight is a landing already judged
  speakers  speakers.py: pyannote Community-1 with a Hugging Face token, else
            the no-token fallback
  floor     floor.py: Silero VAD, ten ticks a second, the bids labelled
"""
import argparse
import json
import os
import re
import sys
import time
import warnings
from pathlib import Path

os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
import floor     # noqa: E402
import speakers  # noqa: E402

MODEL = "mlx-community/whisper-large-v3-turbo"


def clean(text: str) -> list:
    """Lower case, no punctuation: "Saturday." -> ["saturday"], "don't" -> ["dont"], "half-nine" -> ["half", "nine"]."""
    text = re.sub(r"['’`]", "", text.lower())
    return re.sub(r"[^\w\s]|_", " ", text).split()


def transcribe(audio, model: str = MODEL, language: str | None = "en", offset: float = 0.0) -> list:
    """[{"t0", "t1", "w"}] from whisper's word timestamps; a word whisper hyphenated
    or spaced shares its span among its parts by length."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        import mlx_whisper
        r = mlx_whisper.transcribe(audio, path_or_hf_repo=model, language=language, word_timestamps=True,
                                   condition_on_previous_text=False, hallucination_silence_threshold=2.0,
                                   verbose=None)
    out = []
    for seg in r["segments"]:
        for w in seg.get("words", []):
            parts = clean(w["word"])
            t, span = w["start"], max(0.0, w["end"] - w["start"])
            total = sum(map(len, parts)) or 1
            for p in parts:
                d = span * len(p) / total
                out.append({"t0": round(offset + t, 2), "t1": round(offset + t + d, 2), "w": p})
                t += d
    return out


def voiced(words: list, regs: list, margin: float = 0.25) -> list:
    """Drop words that lie wholly in silence: whisper's habit of hearing thanks in a quiet room."""
    return [w for w in words if any(w["t1"] > a - margin and w["t0"] < b + margin for a, b in regs)]


def snap(words: list, regs: list, min_gap: float = 0.15) -> list:
    """Fit each word's span to the speech the VAD heard. Whisper's word times tile
    the audio, so a pause is handed to the word after it: that word starts early,
    inside the silence or even inside the last speaker's tail. A pause wholly inside
    a word's span is taken as its leading silence; a start or end in silence moves
    to the speech."""
    gaps = [(a[1], b[0]) for a, b in zip(regs, regs[1:]) if b[0] - a[1] >= min_gap]
    out = []
    for w in words:
        t0, t1 = w["t0"], w["t1"]
        inner = [g for g in gaps if t0 < g[0] and g[1] < t1]
        if inner:
            if t1 - inner[-1][1] >= 0.06:
                t0 = inner[-1][1]
            else:
                t1 = inner[0][0]
        for g0, g1 in gaps:
            if g0 <= t0 < g1 < t1:
                t0 = g1
            if t0 < g0 < t1 <= g1:
                t1 = g0
        out.append({"t0": round(t0, 2), "t1": round(max(t0, t1), 2), "w": w["w"]})
    return out


def in_order(words: list) -> list:
    """Rename the speakers A, B, C... in order of first speech."""
    names = {}
    for w in words:
        if w["s"] not in names and w["s"] != "?":
            names[w["s"]] = chr(ord("A") + len(names)) if len(names) < 26 else f"S{len(names)}"
    return [{"t0": w["t0"], "t1": w["t1"], "s": names.get(w["s"], "?"), "w": w["w"]} for w in words]


def run(audio_path: Path, out: Path, model: str = MODEL, language: str | None = "en", n_speakers: int | None = None,
        how: str = "auto", landing: float = floor.LANDING_S, open_s: float = floor.OPEN_S) -> dict:
    clock = {}
    t = time.time()
    audio = floor.load_audio(audio_path)
    duration = len(audio) / floor.SR
    probs = floor.vad_probs(audio)
    regs = floor.speech_regions(probs)
    clock["vad_s"] = time.time() - t
    t = time.time()
    words = snap(voiced(transcribe(audio, model, language), regs), regs)
    clock["whisper_s"] = time.time() - t
    t = time.time()
    turns, way = speakers.diarize(audio, regs, n_speakers, how)
    words = in_order(speakers.assign(words, turns))
    clock["speakers_s"] = time.time() - t
    fl = floor.ticks(probs, duration, words, landing, open_s)
    out.mkdir(parents=True, exist_ok=True)
    floor.write_jsonl(out / "words.jsonl", words)
    floor.write_jsonl(out / "floor.jsonl", fl)
    total = sum(clock.values())
    return {"audio_s": round(duration, 1), "words": len(words), "speakers": sorted({w["s"] for w in words}),
            "labelling": way, "model": model, **{k: round(v, 1) for k, v in clock.items()},
            "total_s": round(total, 1), "x_realtime": round(duration / total, 1), "floor": floor.stats(fl)}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio", type=Path)
    ap.add_argument("--out", type=Path, required=True, help="the run folder")
    ap.add_argument("--model", default=MODEL, help="an mlx-community whisper repo")
    ap.add_argument("--language", default="en", help="'auto' to let whisper detect it")
    ap.add_argument("--speakers", type=int, help="how many speakers, if known")
    ap.add_argument("--labelling", choices=["auto", "pyannote", "fallback"], default="auto")
    ap.add_argument("--landing", type=float, default=floor.LANDING_S, help="pause that judges a turn ended, s")
    ap.add_argument("--open-s", type=float, default=floor.OPEN_S, help="pause that opens the floor fully, s")
    a = ap.parse_args()
    s = run(a.audio, a.out, a.model, None if a.language == "auto" else a.language, a.speakers, a.labelling,
            a.landing, a.open_s)
    print(json.dumps(s), file=sys.stderr)


if __name__ == "__main__":
    main()
