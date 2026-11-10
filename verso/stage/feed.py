#!/usr/bin/env python3
"""feed.py <audio> [--url ws://localhost:8765] [--word <the stage word>]

Play a recording into the stage as if the phone heard it: 16 kHz mono 16-bit frames of 2048 samples at real speed,
after proving the stage word, exactly as phone.html sends them. Beside it, a second socket listens as a screen does
and prints each phrase heard and each film chosen, at its time from the start of the audio, so the lag from a word
to its film can be read against the recording (a stand-in's truth.jsonl gives each line's times).

Run it with the voices piece's Python (it decodes with floor.load_audio):
  ../voices/.venv/bin/python feed.py ../voices/runs/stage-1/audio.wav --word <word>
"""
import argparse, asyncio, json, os, sys, time

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "voices"))
import numpy as np
import floor

FRAME = 2048


async def main(a):
    import websockets
    audio = floor.load_audio(a.audio)
    pcm = (np.clip(audio, -1, 1) * 32767).astype("<i2")
    t0 = None

    def at():
        return f"{time.time() - t0:6.1f}s" if t0 else "  ---  "

    async def screen():
        async with websockets.connect(a.url, max_size=None) as ws:
            await ws.send(json.dumps({"type": "screen"}))
            async for raw in ws:
                m = json.loads(raw)
                kind = m.get("type")
                if kind == "heard":
                    print(f"{at()}  heard  {m['text']}", flush=True)
                elif kind == "film":
                    print(f"{at()}  FILM   {m.get('why')}{' strong' if m.get('strong') else ''} {m.get('score') or ''} -> "
                          f"{m.get('film') or (m.get('films') or ['(the words)'])[0]}", flush=True)

    listener = asyncio.ensure_future(screen())
    async with websockets.connect(a.url, max_size=None) as ws:
        await ws.send(json.dumps({"type": "phone", "word": a.word}))
        while True:
            m = json.loads(await ws.recv())
            if m.get("type") == "phone":
                if not m.get("ok"):
                    sys.exit("the stage refused the word")
                print(f"proved the word{' (it is now the stage word)' if m.get('set') else ''}; "
                      f"feeding {len(pcm) / floor.SR:.1f} s of {a.audio}", flush=True)
                break
        t0 = time.time()
        print(f"the audio began at {t0:.3f} (epoch s): a word at t s in the recording was sent at that plus t", flush=True)
        for i in range(0, len(pcm), FRAME):
            delay = t0 + i / floor.SR - time.time()
            if delay > 0:
                await asyncio.sleep(delay)
            await ws.send(pcm[i:i + FRAME].tobytes())
        print(f"{at()}  (the recording ended; listening {a.tail:.0f} s more)", flush=True)
        await asyncio.sleep(a.tail)
    listener.cancel()


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio")
    ap.add_argument("--url", default="ws://localhost:8765", help="the stage's socket, e.g. wss://verso.hermitcrab.uk")
    ap.add_argument("--word", required=True, help="the stage word")
    ap.add_argument("--tail", type=float, default=15.0, help="seconds to keep listening after the recording ends")
    asyncio.run(main(ap.parse_args()))
