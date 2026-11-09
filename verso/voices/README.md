# verso/voices — audio in, events out, all on the Mac

The voices piece of verso (build record `proposals/2026-11-05-verso-the-build.md`, section 2.1; the shapes are its section 3). It turns what is heard into two streams the cells read: **words** with their times and speakers, and **the floor** ten times a second. Nothing here sends audio or words off the Mac, and nothing writes to the beach.

```
standin.py  script.json  ->  audio.wav + truth.jsonl     three scripted macOS voices; no person recorded
label.py    audio.wav    ->  words.jsonl + floor.jsonl   whisper, speakers, the floor: one command
floor.py    audio.wav    ->  floor.jsonl                 the floor alone, from the audio alone
live.py     microphone   ->  ws://localhost:8766         the floor live, the words after it
smoke.py                 ->  runs/standin-1/report.md    all of it, scored against the script
```

## Set up (once)

On an Apple Silicon Mac with Homebrew's Python 3.12 and ffmpeg:

```bash
cd verso/voices
/opt/homebrew/bin/python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python smoke.py
```

The install took 32 s here with the wheels already in pip's cache; the venv is 1.6 GB on disk (torch, MLX and pyannote's tree). The first run fetches the open weights it needs into `~/.cache/huggingface` (whisper large-v3-turbo for MLX, 1.6 GB; the WeSpeaker embedding, 27 MB; Silero ships inside its package). None of them needs a token. `smoke.py` then prints PASS for seven checks and writes `runs/standin-1/report.md`; it exits 1 if any check fails. The first run in a new venv labels more slowly (55 s rather than 23 s for the 180 s stand-in) while its caches compile.

## The commands

**`standin.py <script.json> --out <run>/`** renders a conversation with one `say` voice per speaker (A Daniel, en_GB; B Samantha, en_US; C Rishi, en_IN; `--voices A=Moira,...` to change them) to `<run>/audio.wav`, 16 kHz mono through ffmpeg, and writes `<run>/truth.jsonl`, one utterance per line: `{"t0": 1.0, "t1": 5.07, "s": "A", "voice": "Daniel", "text": "..."}`. Each line's times hug the voice (the silence `say` adds is trimmed). The script is a JSON list of `{"speaker", "text", "pause_after_s"}`; a negative `pause_after_s` starts the next line that many seconds early, over the last: an interruption. `scripts/standin-1.json` is three neighbours planning a Saturday in the shared garden, 180 s: pauses between turns of 0.3 to 0.9 s, one interruption (B over A, 0.8 s of overlap), one long turn (C on the compost, 37 s), a quiet stretch of 6 s, and a question met with 3.8 s of silence before the asker carries on. Invented words; no real person.

**`label.py <audio.wav> --out <run>/`** writes `words.jsonl` and `floor.jsonl`. Options: `--speakers N` when the number is known, `--labelling auto|pyannote|fallback`, `--model` (any `mlx-community` whisper), `--language` (`en`; `auto` to detect), `--landing`, `--open-s`.

- **Words**: one per line, `{"t0": 12.34, "t1": 12.61, "s": "A", "w": "yes"}`, speakers A, B, C… in order of first speech. Whisper's output is stripped of every punctuation mark and capital it adds (a full stop added with hindsight is a landing already judged): `"Saturday."` becomes `saturday`, `"I've"` becomes `ive`, a hyphenated word becomes two words sharing its time. Whisper writes numbers as figures (`10`, `3`); they are left as it wrote them. Words lying wholly in silence are dropped (whisper hears "thank you" in quiet rooms), and every word's span is fitted to the speech the VAD heard: whisper's word times tile the audio, so the word after a pause starts early, inside the silence; it is moved to where the voice begins.
- **Speakers**: `speakers.py`, one function with two ways behind it. With a Hugging Face token on the Mac and the model's terms accepted, **pyannote Community-1** (`pyannote/speaker-diarization-community-1`; its exclusive diarization, one speaker at a time, made for aligning words). Without, the **fallback**, no token: the speech Silero found is cut into 1.5 s windows (0.5 s apart), each embedded with WeSpeaker ResNet34 (`pyannote/wespeaker-voxceleb-resnet34-LM`, ungated, CC-BY-4.0) and clustered agglomeratively (average linkage, cosine distance 0.7 keeps two voices apart; `--speakers N` fixes the count); a voice heard for less than a second in all (a cough, a clipped word) is folded into the nearest voice; every 50 ms of speech takes the vote of the windows over it and every word the speaker it overlaps most. The run prints which way it took, and the report says so.

**`floor.py <audio.wav> --out <run>/ [--words words.jsonl]`** writes `floor.jsonl` from the audio alone: ten lines a second, `{"t": 12.7, "open": 0.0, "landed": false, "bid": null}`, from 0 to the end of the audio. `label.py` writes the same file with the bids named.

- **Voice activity**: Silero VAD (the `silero-vad` package, no token), one probability per 32 ms frame; speech begins after two frames at 0.5 or more (64 ms: a click is not a voice) and ends at the first frame under 0.35.
- **`open`**: 0 while anyone voices. Through a pause it rises along a smoothstep, `3x² − 2x³` with `x = pause / 1.5 s`: 0.05 after 0.2 s (a breath between words barely opens it), 0.18 after 0.4 s, 0.5 after 0.75 s, 0.82 after 1.1 s, 1 from 1.5 s. Before anyone has spoken it is 1. `--open-s` sets the 1.5 s.
- **`landed`**: true on the one tick at which a pause after speech first passes the threshold, `--landing`, 0.4 s by default: a turn end judged from the silence alone. It does not know whether the same speaker will carry on.
- **`bid`**: a speaker starting while the floor was open (after a landed pause, or the very first speech), and, once the words are labelled, every change of speaker with no landing between: a quick handover, or an interruption over someone (a bid with `open` 0). The bid carries the speaker's label when the labelling knows it, else `"?"`; `floor.py` alone and `live.py` give `"?"`. Two flipped labels in a row are needed for a change: a lone mislabelled word is not a bid.
- **Causal**: the floor is computed frame by frame by one state machine (`floor.Stream`) that sees nothing ahead, the same one `live.py` runs on the microphone. A replay of `floor.jsonl` is what live would have shown, to the tick; only the bids' names come from afterwards.

**`live.py`** listens to the microphone (`--device N`; `python -m sounddevice` lists inputs) or feeds a file at real speed (`--file audio.wav`, as if heard), and serves `ws://localhost:8766`. Each WebSocket message is one JSON line: a floor tick in the `floor.jsonl` shape ten times a second (a message with `open`), or a word in the `words.jsonl` shape (a message with `w`), with times in seconds since listening began. A stretch of speech goes to whisper when the floor lands, or after 5 s (`--stretch-s`) cut at its latest short pause when someone talks on; stretches that queue while whisper works go together as one call. Each voiced region of a stretch gets a rough live guess of its speaker (the nearest voice heard so far, or the next letter; `--no-who` leaves `"?"`). The terminal shows the floor moving and each stretch's words with its lag. No audio is kept beyond a minute in memory; the words and the floor are written only with `--out <dir>`. `--model mlx-community/whisper-small.en-mlx` trades accuracy for less lag (below).

**`smoke.py`** renders `scripts/standin-1.json` to `runs/standin-1/`, labels it, and scores it: speaker accuracy (the fraction of words labelled with the right speaker after the best one-to-one mapping of labels to A, B, C; each word's true speaker comes from aligning the transcript to the script), word error rate (both sides lower case without punctuation), and the floor (landings against the scripted pauses, the quiet stretch, the question met with silence, the interruption seen as a bid, and the audio fed 512 samples at a time as `live.py` feeds it giving the same floor tick for tick). It writes `runs/standin-1/report.md` and exits 0 only if all seven checks pass.

## What was measured

On David's Mac mini (Apple M4, 24 GB, macOS 26.6.2), 5 November 2026. The batch figures are `runs/standin-1/report.md`, written by `smoke.py` in a venv made fresh from `requirements.txt` (its second run; the first, also green, was slower while caches compiled).

**standin-1, batch** (`python smoke.py`; labelling by the fallback, no token on the Mac)

| measure | result |
|---|---|
| audio | 180.3 s, three `say` voices, 35 utterances, rendered in 18.4 s |
| speaker accuracy | **99.4%** (501 of 504 words). Two misses are A's last words under B's interruption, where both voices sound at once; the third is C's one-word *maybe*, 0.6 s, too short to embed well |
| word error rate | **1.0%** against the script (whisper wrote `ten` as `10`, `three` as `3`, `tyre` as `tire`, and dropped *hedge on*) |
| speed | 23.2 s to label 180 s, 7.8× real time: Silero 1.2 s, whisper 17.4 s, speakers 4.5 s |
| landings | 27, none inside an utterance; every scripted pause of 0.5 s or more landed (26 of 26). The three pauses scripted at exactly 0.4 s measure 0.32 to 0.38 s in Silero (32 ms frames, and its release comes about 50 ms after the voice) and do not land at the 0.4 s threshold |
| bids | 35, all named, 34 with the right speaker (the one wrong is C's *maybe*, named A) |
| the quiet stretch | 6.0 s scripted, found as the longest open stretch (5.9 s), open reaching 1 |
| the question met with silence | 3.8 s: landed, opened fully, and the asker's bid came next |
| the interruption | B over A at 29.76 s, seen as B's bid at 29.8 s with `open` 0 |
| the live path | the audio fed 512 samples at a time, as `live.py` feeds it, gives the same floor on all 1803 ticks |

**Live mode** (`live.py --file runs/standin-1/audio.wav`, at real speed; a test client on the socket received 10.0 floor ticks a second)

| whisper model | word lag median | p90 | max | whisper per call | WER | live speaker guess |
|---|---|---|---|---|---|---|
| large-v3-turbo (default) | 4.35 s | 6.08 s | 6.91 s | 1.78 s | 1.6% | 97.8% |
| small.en (`--model mlx-community/whisper-small.en-mlx`) | 2.97 s | 4.76 s | 5.59 s | 0.44 s | 2.0% | 97.8% |

The lag is counted from a word's end to its message on the socket. A word waits for its stretch to close (the floor landing, 0.4 s after the voice stops, or the 5 s cut when someone talks on) and then for whisper, which encodes a 30 s window whatever the stretch: 1.8 s per call with turbo on this Mac, 0.44 s with small.en. So the last word of a stretch arrives about 2.3 s after it is said with turbo, the first word of a long stretch about 7 s after. The floor has no such lag: it moves within a tick (100 ms) of the voice, plus Silero's 64 ms to believe a voice has begun. The live floor is the same as `floor.py`'s for the same audio on all 1803 ticks.

**The microphone.** `live.py` on the Mac mini's USB camera microphone for 50 s while its speaker played the first 35 s of the stand-in (no person; `--no-text`, nothing saved): the floor sat at 1.0 through the quiet room, fell to 0 when the voices began, and landed at each turn end (10.3, 14.8, 21.0 and 40.2 s) with a bid at each start. 107 words came in 8 whisper calls with a median lag of 4.07 s (p90 5.81 s, max 6.41 s). Through a speaker and a room the live speaker guess is rougher: it made five voices of three.

## Switching on pyannote (David, once)

The labelling uses pyannote Community-1 by itself as soon as two things are true on this Mac: a Hugging Face token is present, and that account has accepted the model's terms. Until then it uses the fallback and says so. Nothing in the code changes.

1. Sign in to Hugging Face, or make an account: https://huggingface.co/login (new: https://huggingface.co/join).
2. Open https://huggingface.co/pyannote/speaker-diarization-community-1. The page shows a box, *You need to agree to share your contact information to access this model*. Fill in **Company/university** (any honest answer) and choose a **Use case** from its list (*Other* fits; *Meeting note taker* is near), then click **Agree and access repository**. Access is granted at once (the gate is automatic). Agreeing lets pyannote email you now and then about their models; the pipeline itself is CC-BY-4.0.
3. Make a token: https://huggingface.co/settings/tokens → **Create new token** → token type **Read** → name it `verso` → **Create token** → **Copy** (it starts `hf_`).
4. Give it to the Mac, once, in Terminal from `verso/voices`:

   ```bash
   .venv/bin/hf auth login
   ```

   It asks *How would you like to log in?*: choose **Paste an access token**, paste the token at *Enter your token* (nothing shows as you paste) and press Return. It is saved at `~/.cache/huggingface/token`, outside every repository. (Choosing *Log in with your browser* instead prints a link to approve in the browser, and makes the token for you, so step 3 can be skipped. For one shell only: `export HF_TOKEN=hf_...`.)
5. Check it:

   ```bash
   .venv/bin/python smoke.py --labelling pyannote
   ```

   The report's *labelling* line then reads `pyannote Community-1`, and the first run fetches its weights (about 34 MB). With `--labelling pyannote` a missing token or unaccepted terms is an error rather than a quiet fallback.

## Choices, and why

- **Transcriber: `mlx-whisper`** with `mlx-community/whisper-large-v3-turbo`. MLX is Apple's own array framework and runs whisper on the Mac's GPU; on this M4 it transcribes with word timestamps at 10× real time (17.4 s for the 180 s stand-in). `faster-whisper` runs CTranslate2 on the CPU only on a Mac (no Metal), and `openai-whisper` runs PyTorch, slow on the CPU and unreliable on MPS. All three are the same open weights. Turbo costs about 1.8 s per call on this Mac however short the audio, because whisper always encodes a 30 s window; that is what sets the live lag.
- **Voice activity: Silero VAD**, open and tokenless, 32 ms frames, the same model batch and live.
- **Speakers: pyannote Community-1** when David's token is on the Mac (above); the **fallback** otherwise. On the stand-in the fallback is near perfect, but the stand-in is easy for it: three synthetic voices, each the same every time. On real voices expect it to do worse than Community-1, above all on short turns and overlaps; that is the reason to switch pyannote on before the consented recording.
- **No VAP option.** VAP turn-taking models (Ekstedt and Skantze; the open `maai-kyoto/vap_en` weights, ungated) predict a shift between two channels with one speaker on each. A room microphone gives one mixed channel, so their prediction would be read outside what they were trained on; and the MaAI package that runs them pulls in PyQt5, pygame and PyAudio. Where VAP would fit: channel one the room, channel two verso's own voice, predicting when the room yields to verso. Worth trying once verso speaks.

## What falls short

- **Community-1 ran on 9 November and did worse than the fallback on the stand-in.** With David's token on the Mac and the model's terms accepted, `smoke.py --labelling pyannote` from this folder (`cd verso/voices` first: the venv lives here, not at the repo root) gave 72.4% speaker accuracy against the fallback's 99.4%, the same 1.0% WER, and ran at 0.7× real time (234 s of the 256 s went to pyannote, on the CPU). It heard five speakers in three: a fourth took 75 of A's words and 44 of C's, a fifth 18 more of A's, so the question-met-with-silence check failed on its labels too (`runs/standin-1/report-pyannote-2026-11-09.md`). Synthetic `say` voices are not what it was trained on, so this says nothing yet about real voices; the fallback stays the default, and both run on the first consented recording before one is chosen. Its path follows pyannote 4's own interface (`Pipeline.from_pretrained(..., token=)`, the waveform passed in memory, its exclusive diarization), and its refusals were exercised: no token, or a token without the terms accepted (a 403 naming the gated repo), and the run says so and falls back, or stops under `--labelling pyannote`.
- **The stand-in is easy.** Three synthetic voices, each identical every time, no room, no noise: the near-perfect speaker accuracy says the pipeline is wired right, not that the fallback will hold on real voices. Expect it to slip on short turns and when people talk over each other; that is what Community-1 is for.
- **Overlap gets one speaker.** Words spoken over someone are labelled with whichever voice dominates the moment.
- **The live words lag** 3 to 4 seconds at the median (above). Shorter stretches (`--stretch-s`) or a smaller model cut it, at some cost in accuracy; a streaming transcriber that confirms words as they settle is the next step if the cells need the words sooner.
- **The live speaker guess is rough**: one guess per voiced region, compared with the voices heard so far, so it can split one voice in two (a fourth voice on the stand-in, five of three through the speaker). Live bids are always `"?"`: at an onset nobody knows yet who it is.
- **`landed` is the silence alone.** A pause of 0.4 s inside a turn lands as surely as the end of one; the stand-in has none, real talk will. The threshold is a parameter, and judging a landing is the cells' work.
- **Numbers come as figures** (`10`, `3`), as whisper writes them; they count against the WER here and read fine to a cell.
