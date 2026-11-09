"""The door to the Messages API: one call, the head cached, the spend counted, every call logged.

A call is one model at one effort with the system blocks (the stable head, cache_control on its last
block) and one user message (the fresh tail). Thinking is adaptive and always on, so no thinking
parameter is sent; depth is output_config.effort. The reply is asked for as one JSON object.
The key is read as relay.py reads it, from .env.rig, and is never printed.
A Spend holds the run's dollars, with a hard stop; a dry door returns canned lines for plumbing tests.
"""
import json, os, random, re, threading, time

ENV_RIG = os.path.expanduser("~/Projects/bsp-mcp-server/.env.rig")

# tier -> model id, and $ per million: input, cache write (5-minute), cache read, output
MODELS = {
    "opus": ("claude-opus-5-5", 4.00, 5.00, 0.20, 20.00),
    "sonnet": ("claude-sonnet-5-5", 2.00, 2.50, 0.20, 10.00),
    "haiku": ("claude-haiku-5-5", 0.10, 0.125, 0.01, 0.50),
}
EFFORTS = ("low", "medium", "high")


class HardStop(Exception):
    pass


class Spend:
    """The run's dollars, by kind (walk or loop), with the hard stop of settings.stop_usd."""

    def __init__(self, stop_usd):
        self.stop_usd = float(stop_usd)
        self.usd = {"walk": 0.0, "loop": 0.0}
        self.calls = {"walk": 0, "loop": 0}
        self.lock = threading.Lock()
        self.stopped = False

    def add(self, kind, usd):
        with self.lock:
            self.usd[kind] += usd
            self.calls[kind] += 1
            if self.total >= self.stop_usd:
                self.stopped = True

    @property
    def total(self):
        return self.usd["walk"] + self.usd["loop"]

    def check(self):
        if self.stopped or self.total >= self.stop_usd:
            self.stopped = True
            raise HardStop(f"hard stop at ${self.total:.2f} (stop_usd {self.stop_usd})")


def read_key():
    for l in open(ENV_RIG):
        if l.startswith("ANTHROPIC_API_KEY="):
            return l.split("=", 1)[1].strip().strip("\"'")
    raise RuntimeError("no ANTHROPIC_API_KEY in .env.rig")


_client = None


def client():
    global _client
    if _client is None:
        import anthropic
        _client = anthropic.AsyncAnthropic(api_key=read_key(), max_retries=1, timeout=90.0)
    return _client


def price(tier, usage):
    _, p_in, p_write, p_read, p_out = MODELS[tier]
    return (usage["in"] * p_in + usage["write"] * p_write + usage["read"] * p_read + usage["out"] * p_out) / 1e6


FALLBACK = {"off": False}   # settings.fallback: when true a refused call is re-run server-side on a fallback model (the reply names it)


async def call(tier, effort, system_blocks, user_text, max_tokens=600, spend=None, kind="loop", log=None, meta=None):
    """One call. Returns dict(reply, stop, usage{in,write,read,out}, ms, usd, error). Logs it if log is a path."""
    if spend is not None:
        spend.check()
    model = MODELS[tier][0]
    t = time.time()
    try:
        kw = dict(model=model, max_tokens=max_tokens, system=system_blocks, output_config={"effort": effort},
                  messages=[{"role": "user", "content": user_text}])
        if FALLBACK["off"]:
            r = await client().beta.messages.create(betas=["server-side-fallback-2026-07-01"], extra_body={"fallbacks": "default"}, **kw)
        else:
            r = await client().messages.create(**kw)
        u = r.usage
        usage = {"in": u.input_tokens, "write": u.cache_creation_input_tokens or 0,
                 "read": u.cache_read_input_tokens or 0, "out": u.output_tokens}
        sd = getattr(r, "stop_details", None) or (getattr(r, "model_extra", None) or {}).get("stop_details")
        if sd is not None and not isinstance(sd, dict):
            sd = dict(category=getattr(sd, "category", None), explanation=getattr(sd, "explanation", None))
        served = r.model
        out = dict(reply="".join(b.text for b in r.content if getattr(b, "type", "") == "text"), stop=r.stop_reason, model=served,
                   usage=usage, usd=price(tier if served == model else next((k for k, v in MODELS.items() if v[0] == served), tier), usage),
                   error=None, stop_details=(dict(category=sd.get("category"), explanation=sd.get("explanation")) if sd else None),
                   fell_back=(served != model))
    except Exception as e:
        out = dict(reply="", stop=None, model=model, usage={"in": 0, "write": 0, "read": 0, "out": 0}, usd=0.0,
                   error=f"{type(e).__name__}: {str(e)[:300]}")
    out["ms"] = int((time.time() - t) * 1000)
    if spend is not None:
        spend.add(kind, out["usd"])
    if log:
        rec = dict(at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), kind=kind, tier=tier, effort=effort,
                   requested=model, max_tokens=max_tokens, system=[b["text"] for b in system_blocks], window=user_text,
                   **(meta or {}), **out)
        with open(log, "a") as f:
            f.write(json.dumps(rec) + "\n")
    return out


# ---- the dry door: canned lines, no spend, latencies by tier, for proving the plumbing

DRY_MS = {"opus": (9000, 25000), "sonnet": (3500, 9000), "haiku": (1200, 3000)}


async def dry_call(tier, effort, system_blocks, user_text, max_tokens=600, spend=None, kind="loop", log=None, meta=None):
    import asyncio
    lo, hi = DRY_MS[tier]
    ms = int(random.randint(lo, hi) * {"low": 0.6, "medium": 1.0, "high": 1.6}[effort] * float(os.environ.get("DRY_SCALE", "1")))
    await asyncio.sleep(ms / 1000)
    if kind == "walk":
        m = re.findall(r"^\s+\[(\d[\d.]*)\]:", user_text.split("THE OPTIONS")[-1].split("THE HINGE")[0], re.M)
        reply = json.dumps({"choice": random.choice(m) if m else "1.2"})
    else:
        tags = re.findall(r"\[(h\d+)\]", user_text)
        act = "release" if random.random() < 0.25 else "hold"
        tag = f"[{random.choice(tags)}] " if tags and random.random() < 0.5 else ""
        words = re.findall(r"\b[a-z]{4,}\b", user_text.split("THE TALK")[-1])
        gist = " ".join(random.sample(words, min(5, len(words)))) if words else "nothing yet"
        reply = json.dumps({"parent": f"the last speaker, answering {gist}", "act": act,
                            "text": f"{tag}what was not said about {gist}", "horizon": random.choice(["seconds", "turns", "topic"]),
                            "stop": random.choice(["at-once", "phrase", "sentence"])})
    out = dict(reply=reply, stop="end_turn", model=f"dry-{tier}", usage={"in": 400, "write": 0, "read": 1200, "out": 90},
               usd=0.0, error=None, ms=ms)
    if spend is not None:
        spend.add(kind, 0.0)
    if log:
        with open(log, "a") as f:
            f.write(json.dumps(dict(at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), kind=kind, tier=tier, effort=effort,
                                    requested=f"dry-{tier}", system=[b["text"] for b in system_blocks], window=user_text, **(meta or {}), **out)) + "\n")
    return out


def parse_json(reply):
    """The one JSON object in a reply, or None with a flag."""
    m = re.search(r"\{.*\}", reply, re.S)
    if not m:
        return None, "no-json"
    try:
        return json.loads(m.group(0)), "ok"
    except Exception:
        # a reply that ran on after the object, or one with a stray brace: take the first balanced object
        depth, start = 0, None
        for i, ch in enumerate(reply):
            if ch == "{":
                if depth == 0:
                    start = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start is not None:
                    try:
                        return json.loads(reply[start:i + 1]), "ok"
                    except Exception:
                        start = None
        return None, "bad-json"
