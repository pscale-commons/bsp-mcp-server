"""Who spoke when, behind one function: diarize(audio, regions) -> turns.

Two ways, chosen at run time:

  pyannote   pyannote/speaker-diarization-community-1, when a Hugging Face token
             is on the Mac (HF_TOKEN, or ~/.cache/huggingface/token) and the
             model's terms have been accepted on huggingface.co (README says how).
  fallback   no token: the speech the VAD found is cut into 1.5 s windows, each
             embedded with WeSpeaker ResNet34 (pyannote/wespeaker-voxceleb-resnet34-LM,
             ungated, CC-BY-4.0) and clustered agglomeratively by cosine distance;
             every 50 ms of speech takes the vote of the windows over it.

Either way the turns' labels are arbitrary; label.py renames them A, B, C in
order of first speech.
"""
import sys
import warnings

import numpy as np

SR = 16000
COMMUNITY = "pyannote/speaker-diarization-community-1"
EMBEDDING = "pyannote/wespeaker-voxceleb-resnet34-LM"
WIN_S, HOP_S, MIN_WIN_S = 1.5, 0.5, 0.4
THRESHOLD = 0.7     # average-linkage cosine distance at which two clusters stay apart
STEP_S = 0.05       # resolution of the vote


def hf_token() -> str | None:
    from huggingface_hub import get_token
    return get_token()


def diarize(audio: np.ndarray, regs: list, speakers: int | None = None, how: str = "auto",
            threshold: float = THRESHOLD) -> tuple[list, str]:
    """-> ([(t0, t1, label)], the way it was done)."""
    if how in ("auto", "pyannote"):
        token = hf_token()
        if token:
            try:
                return community1(audio, speakers, token), "pyannote Community-1"
            except Exception as e:  # gated, not accepted, offline: say so and fall back
                if how == "pyannote":
                    raise
                print(f"[speakers] Community-1 did not load ({type(e).__name__}: {str(e)[:160]}); "
                      "using the fallback", file=sys.stderr)
        elif how == "pyannote":
            raise SystemExit("[speakers] no Hugging Face token on this Mac: README, 'Switching on pyannote'")
        else:
            print("[speakers] no Hugging Face token; using the fallback (WeSpeaker windows, clustered)",
                  file=sys.stderr)
    return embed_cluster(audio, regs, speakers, threshold), "fallback: WeSpeaker ResNet34 windows, clustered"


def community1(audio: np.ndarray, speakers: int | None, token: str) -> list:
    import torch
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        from pyannote.audio import Pipeline
        pipe = Pipeline.from_pretrained(COMMUNITY, token=token)
    if pipe is None:
        raise RuntimeError("the pipeline could not be fetched (are the terms accepted?)")
    kw = {"num_speakers": speakers} if speakers else {}
    out = pipe({"waveform": torch.from_numpy(audio)[None], "sample_rate": SR}, **kw)
    # Community-1's exclusive diarization gives one speaker at a time: made for word alignment
    ann = getattr(out, "exclusive_speaker_diarization", None) or getattr(out, "speaker_diarization", out)
    return [(seg.start, seg.end, str(spk)) for seg, _, spk in ann.itertracks(yield_label=True)]


_embedder = None


def embedder():
    global _embedder
    if _embedder is None:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            from pyannote.audio import Model
            _embedder = Model.from_pretrained(EMBEDDING)
        _embedder.eval()
    return _embedder


def windows(regs: list) -> list:
    out = []
    for t0, t1 in regs:
        if t1 - t0 < MIN_WIN_S:
            continue
        if t1 - t0 <= WIN_S + HOP_S:
            out.append((t0, t1))
        else:
            starts = list(np.arange(t0, t1 - WIN_S, HOP_S)) + [t1 - WIN_S]
            out += [(float(s), float(s) + WIN_S) for s in starts]
    return out


def embed(audio: np.ndarray, wins: list) -> np.ndarray:
    import torch
    model, embs = embedder(), []
    with torch.no_grad():
        for a, b in wins:
            x = torch.from_numpy(audio[int(a * SR): int(b * SR)].copy())[None, None]
            embs.append(model(x)[0].numpy())
    e = np.array(embs, dtype=np.float64)
    return e / np.linalg.norm(e, axis=1, keepdims=True)


def cover(wins: list) -> float:
    """Seconds of audio a set of windows spans, overlaps counted once."""
    total, end = 0.0, float("-inf")
    for a, b in sorted(wins):
        if b > end:
            total, end = total + b - max(a, end), b
    return total


def cluster(e: np.ndarray, wins: list, speakers: int | None, threshold: float, min_voice: float = 1.0) -> np.ndarray:
    from scipy.cluster.hierarchy import fcluster, linkage
    if len(e) < 2:
        return np.zeros(len(e), int)
    z = linkage(e, method="average", metric="cosine")
    lab = fcluster(z, speakers, "maxclust") if speakers else fcluster(z, threshold, "distance")
    lab = lab - 1
    # a voice heard for less than a second in all is noise (a cough, a clipped word):
    # fold it into the nearest voice heard for longer
    covers = {c: cover([w for w, l in zip(wins, lab) if l == c]) for c in set(lab)}
    big = [c for c in covers if covers[c] >= min_voice]
    if big and len(big) < len(covers):
        cents = {c: e[lab == c].mean(0) for c in big}
        for c in [c for c in covers if covers[c] < min_voice]:
            m = e[lab == c].mean(0)
            lab[lab == c] = max(big, key=lambda b: float(m @ cents[b]))
    return lab


def embed_cluster(audio: np.ndarray, regs: list, speakers: int | None = None, threshold: float = THRESHOLD) -> list:
    wins = windows(regs)
    if not wins:
        return []
    lab = cluster(embed(audio, wins), wins, speakers, threshold)
    turns = []
    for t0, t1 in regs:
        steps = np.arange(t0, t1, STEP_S) + STEP_S / 2
        votes = np.zeros((len(steps), lab.max() + 1))
        for (a, b), c in zip(wins, lab):
            if b > t0 and a < t1:
                votes[(steps >= a) & (steps < b), c] += 1
        if not votes.any():   # too short to embed: belongs to whoever spoke nearest
            continue
        best = votes.argmax(1)
        best[votes.max(1) == 0] = -1
        for i, c in enumerate(best):
            s = float(steps[i] - STEP_S / 2)
            if c < 0:
                continue
            if turns and turns[-1][2] == c and abs(turns[-1][1] - s) < 1e-6:
                turns[-1] = (turns[-1][0], s + STEP_S, c)
            else:
                turns.append((s, s + STEP_S, c))
    return [(round(a, 3), round(b, 3), f"spk{c}") for a, b, c in turns]


def assign(words: list, turns: list) -> list:
    """Give each word the speaker whose turns overlap it most, else the nearest turn's."""
    out = []
    for w in words:
        t0, t1 = w["t0"] - 0.03, w["t1"] + 0.03     # a word whisper squeezed to nothing still has a place
        over = {}
        for a, b, s in turns:
            o = min(b, t1) - max(a, t0)
            if o > 0:
                over[s] = over.get(s, 0) + o
        if over:
            s = max(over, key=over.get)
        elif turns:
            mid = (t0 + t1) / 2
            s = min(turns, key=lambda t: min(abs(t[0] - mid), abs(t[1] - mid)))[2]
        else:
            s = "?"
        out.append(dict(w, s=s))
    return out
