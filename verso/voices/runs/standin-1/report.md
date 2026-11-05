# standin-1: the voices end to end

Run 2026-11-05 on Apple M4, 24 GB, macOS 26.6.2 by `python smoke.py`. No person recorded: three macOS `say` voices read `scripts/standin-1.json`; nothing left the Mac.

| measure | result |
|---|---|
| audio | 180.3 s, 3 scripted speakers (`say`: A Daniel, B Samantha, C Rishi), 35 utterances |
| render (standin.py) | 18.4 s |
| label (label.py) | 23.2 s in all = 7.8x real time (VAD 1.2 s, whisper 17.4 s, speakers 4.5 s) |
| transcriber | `mlx-community/whisper-large-v3-turbo` via mlx-whisper, word timestamps |
| labelling | fallback: WeSpeaker ResNet34 windows, clustered |
| words | 504 transcribed / 506 scripted |
| **speaker accuracy** | **99.4%** (501/504 words; labels A->A, B->B, C->C) |
| **WER** | **1.0%** (3 substituted, 2 deleted, 0 inserted) |
| floor ticks | 1803 at 10 Hz, computed causally; the live path agrees on 1803/1803 |
| landings | 27: 26 of the 26 scripted pauses of 0.5 s or more landed; 0 of the 3 scripted at the 0.4 s threshold itself; 0 fell inside an utterance |
| bids | 35: 35 named, 34 named right |
| the quiet stretch | scripted 6.0 s at 123.84 s; found 5.9 s at 124.0 s, open peaking at 1.0 |
| the question met with silence | asked by the speaker ending at 63.26 s, 3.8 s of silence; landed True, open peaking at 1.0; next bid {'t': 67.2, 'bid': 'A', 'is_asker': True} |
| the interruption | B over A at 29.76 s (0.8 s overlap); seen as bid {'t': 29.8, 'bid': 'B', 'open': 0.0} |

## Checks

- PASS — words.jsonl and floor.jsonl keep the shapes of the record's section 3
- PASS — fed block by block as live.py feeds it, the floor agrees tick for tick (1803/1803)
- PASS — speaker accuracy 99.4% >= 90%
- PASS — WER 1.0% <= 15%
- PASS — the quiet stretch is found as the longest open stretch, open reaching 1
- PASS — the question met with silence lands, opens fully, and the asker bids again
- PASS — the interruption is seen as a bid by the interrupter

## Who was heard as whom

| label | A | B | C |
|---|---|---|---|
| A | 183 | 0 | 1 |
| B | 2 | 114 | 0 |
| C | 0 | 0 | 204 |

Rows are the labels given; columns the scripted speakers; each cell counts words.
