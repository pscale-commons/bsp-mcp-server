#!/usr/bin/env python3
"""standin.py <script.json> --out <run>/

Render a scripted conversation to <run>/audio.wav (16 kHz mono) with one macOS
`say` voice per speaker, and write <run>/truth.jsonl: who spoke from when to
when, one utterance per line. No person is recorded and no key is needed.

The script is a JSON list of {"speaker": "A", "text": "...", "pause_after_s": 0.6}.
A negative pause_after_s starts the next line that many seconds before this one
ends: an interruption, the two voices overlapping.
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

SR = 16000
# One voice per speaker, differing in sex and accent so the stand-in is fair to
# the labeller without being trivial: A en_GB male, B en_US female, C en_IN male.
VOICES = {"A": "Daniel", "B": "Samantha", "C": "Rishi", "D": "Moira", "E": "Karen", "F": "Tessa"}
LEAD_S, TAIL_S = 1.0, 1.5


def speak(text: str, voice: str, tmp: Path) -> np.ndarray:
    aiff = tmp / "line.aiff"
    subprocess.run(["say", "-v", voice, "-o", str(aiff), text], check=True)
    pcm = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(aiff), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        check=True, capture_output=True).stdout
    return trim(np.frombuffer(pcm, np.float32))


def trim(x: np.ndarray, frame: int = 160, rel: float = 0.01) -> np.ndarray:
    """Cut the silence `say` leaves at either end, so the truth's times hug the voice."""
    n = len(x) // frame
    rms = np.sqrt((x[: n * frame].reshape(n, frame) ** 2).mean(1))
    on = np.flatnonzero(rms > rel * rms.max())
    return x[on[0] * frame: (on[-1] + 1) * frame] if len(on) else x


def render(script: list, voices: dict) -> tuple[np.ndarray, list]:
    with tempfile.TemporaryDirectory() as d:
        clips = [speak(line["text"], voices[line["speaker"]], Path(d)) for line in script]
    at, placed = LEAD_S, []
    for line, clip in zip(script, clips):
        i = int(round(at * SR))
        placed.append(i)
        at = (i + len(clip)) / SR + float(line.get("pause_after_s", 0))
    mix = np.zeros(max(i + len(c) for i, c in zip(placed, clips)) + int(TAIL_S * SR), np.float32)
    truth = []
    for line, clip, i in zip(script, clips, placed):
        mix[i: i + len(clip)] += clip
        truth.append({"t0": round(i / SR, 2), "t1": round((i + len(clip)) / SR, 2), "s": line["speaker"],
                      "voice": voices[line["speaker"]], "text": line["text"]})
    peak = float(np.abs(mix).max())
    if peak > 0.95:  # an overlap can sum past full scale
        mix *= 0.95 / peak
    return mix, truth


def write_wav(path: Path, audio: np.ndarray) -> None:
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-c:a", "pcm_s16le", str(path)], input=audio.astype(np.float32).tobytes(), check=True)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script", type=Path)
    ap.add_argument("--out", type=Path, required=True, help="the run folder")
    ap.add_argument("--voices", default="", help="override, e.g. A=Daniel,B=Moira")
    args = ap.parse_args()
    voices = dict(VOICES, **dict(kv.split("=", 1) for kv in args.voices.split(",") if kv))
    script = json.loads(args.script.read_text())
    missing = sorted({line["speaker"] for line in script} - voices.keys())
    if missing:
        sys.exit(f"no voice for speaker(s) {missing}: pass --voices")
    args.out.mkdir(parents=True, exist_ok=True)
    mix, truth = render(script, voices)
    write_wav(args.out / "audio.wav", mix)
    with open(args.out / "truth.jsonl", "w") as f:
        f.writelines(json.dumps(u) + "\n" for u in truth)
    overlaps = sum(1 for a, b in zip(truth, truth[1:]) if b["t0"] < a["t1"])
    gaps = [round(b["t0"] - a["t1"], 2) for a, b in zip(truth, truth[1:])]
    print(f"{args.out / 'audio.wav'}: {len(mix) / SR:.1f} s, {len(truth)} utterances, "
          f"{overlaps} overlap(s), longest pause {max(gaps):.2f} s; voices "
          + ", ".join(f"{s}={voices[s]}" for s in sorted({u['s'] for u in truth})))


if __name__ == "__main__":
    main()
