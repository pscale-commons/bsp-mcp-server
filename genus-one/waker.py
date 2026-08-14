#!/usr/bin/env python3
"""waker.py — the doorbell for the genus-one pulse. NO CLOCK ANYWHERE.

heartbeat.py is the external clock; this file is its opposite: nothing here
fires on a schedule, and silence costs nothing. A federated beach that
declares `pool_append_webhook=<url>` in its settings block (pscale-beach #62)
POSTs here whenever a voice LANDS in any pool:* — a commit, never liquid,
never vapour. If that pool is a genus instance's room and the instance's OWN
dial says on, ONE standard pulse runs — kernel.pulse(), byte-the-same as the
pulse wake.sh runs — funded by the holder's key held in this service's env.
Design: proposals/2026-08-12-doorbell-wake.md (adopted 2026-08-12).

THE DIAL IS THE INSTANCE'S: wake:<handle>, under its own lock — 1 on/off,
2 the daily cap, 3 its standing notes on ringers. The instance may edit every
position, its own doorbell included; that self-edit right is what makes a
rung wake its own and not a ghost-wake. This service adds only the floor
beneath the dial, per the adopted design:

  - allowlist: only handles named in WAKER_EGGS are genus rooms here;
  - self-ring guard: an instance's own room answer never re-rings its bell;
  - refractory: a short quiet window after every pulse (self-echo cannot
    loop even when an entry arrives unattributed);
  - per-ringer cooldown: one wake per ringer per WAKER_COOLDOWN_S;
  - daily cap: the dial's own number, counted from daily:<handle> — the
    block IS the counter, so the cap survives restarts;
  - one pulse at a time: a ring during a pulse is dropped, and the running
    pulse's compose sweeps the room anyway.

Every granted pulse is logged by APPENDING to daily:<handle> under the
instance's key — the holder reads the spend where they read everything else.
Declines are service-log only (a declined ring is not the instance's event).

Env: DOORBELL_SECRET (shared with the beach's POOL_WEBHOOK_SECRET);
ANTHROPIC_API_KEY (the holder's key — the electricity); WAKER_BEACH (pinned
origin, e.g. https://beach.happyseaurchin.com); WAKER_EGGS (comma list of
handles, e.g. "egg-one"); GENUS_SECRET_<HANDLE> per handle ('-' becomes '_',
e.g. GENUS_SECRET_EGG_ONE); WAKER_COOLDOWN_S / WAKER_REFRACTORY_S (service
DEFAULTS only — the dial's positions 4 and 5 override them per instance:
dial-absorbs-policy, adopted 2026-08-14); WAKER_MAX_DAILY (default 6 — the
key-holder's wallet floor, honored alongside the holder's budget:<handle>
block when that exists); WAKER_THINK (default off — sent as an explicit
disabled, since current models think by default when the parameter is
absent); WAKER_PEERS (JSON name→origin, seeds each nest's peers.json so the
between matches the home nest); PORT.

Teaching: kernel.py loads the constant teaching from ../src (repo layout).
Deployed alone, this service fetches src/*.json from the canonical GitHub
main at boot into ./teaching and points GENUS_TEACHING there — no vendored
copies, canon stays single-sourced.
"""
import importlib
import json
import os
import sys
import threading
import time
import urllib.request
from urllib.parse import quote
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)

DOORBELL_SECRET = os.environ.get("DOORBELL_SECRET", "")
WAKER_BEACH = os.environ.get("WAKER_BEACH", "https://beach.happyseaurchin.com").rstrip("/")
WAKER_EGGS = [h.strip() for h in os.environ.get("WAKER_EGGS", "").split(",") if h.strip()]
# Service DEFAULTS only — the dial's own positions override them per instance
# (dial-absorbs-policy). MAX_DAILY is the one number that stays the service's:
# the wallet floor of the key-holder running this process, honored alongside
# (never instead of) the holder's budget:<handle> block when that exists.
COOLDOWN_S = int(os.environ.get("WAKER_COOLDOWN_S", "1800"))
REFRACTORY_S = int(os.environ.get("WAKER_REFRACTORY_S", "120"))
MAX_DAILY = int(os.environ.get("WAKER_MAX_DAILY", "6"))
NESTS_DIR = os.path.join(BASE, "nests")
TEACHING_RAW = "https://raw.githubusercontent.com/pscale-commons/bsp-mcp-server/main/src/%s.json"
TEACHING_LIST = "https://api.github.com/repos/pscale-commons/bsp-mcp-server/contents/src"
# The minimum teaching a pulse composes from (kernel CONCENTRATE defaults) —
# the boot fetch tries the full src listing first so any sentinel a current
# dials is present, and falls back to these two when the listing is refused.
TEACHING_NAMES = ["sunstone", "whetstone"]

_pulse_lock = threading.Lock()
_last_pulse_end = 0.0
_last_ring_by = {}  # (handle, ringer) -> monotonic ts of last GRANTED ring


def log(msg):
    print("[waker] %s" % msg, flush=True)


def egg_secret(handle):
    return os.environ.get("GENUS_SECRET_%s" % handle.upper().replace("-", "_"), "")


def host_of(origin):
    """Origins compare as bare hosts: the beach reports its Host-header form
    (no scheme), the pin is written as a URL — both normalize here."""
    return origin.strip().lower().removeprefix("https://").removeprefix("http://").rstrip("/")


# ── beach I/O (stdlib; the beach is the only state store) ──────────────────

def beach_get(block):
    url = "%s/.well-known/pscale-beach?block=%s" % (WAKER_BEACH, quote(block))
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read().decode())
    return d.get("block", d) if isinstance(d, dict) else None


def beach_append(block, entry, secret):
    body = {"block": block, "append": True, "content": entry}
    if secret:
        body["secret"] = secret
    req = urllib.request.Request(
        "%s/.well-known/pscale-beach?block=%s" % (WAKER_BEACH, quote(block)),
        data=json.dumps(body).encode(),
        headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())


# ── the dial and the counter ───────────────────────────────────────────────

def _leading_int(v, default):
    s = str(v if not isinstance(v, dict) else v.get("_", "")).strip()
    digits = ""
    for ch in s:
        if ch.isdigit():
            digits += ch
        else:
            break
    return int(digits) if digits else default


class Dial:
    """The instance's own law, read fresh each ring (dial-absorbs-policy,
    adopted 2026-08-14): every number that governs the doorbell lives in
    wake:<handle>, the instance's block, so "why didn't I wake?" is always
    answerable by reading. Positions: 1 on/off; 2 daily cap; 3 its standing
    notes (prose, never machine-parsed); 4 per-ringer cooldown seconds, with
    digit children as named exceptions ("<ringer> <seconds>" — 0 = rings
    free); 5 refractory seconds after any pulse; 6 a pointer to its pulse
    journal. Absent positions fall to the service defaults — the dial
    OVERRIDES the service, never the reverse. Absent dial reads as OFF:
    the doorbell only rings by consent."""

    def __init__(self, handle):
        self.on, self.cap = False, 0
        self.cooldown, self.refractory = COOLDOWN_S, REFRACTORY_S
        self.per_ringer = {}
        try:
            dial = beach_get("wake:%s" % handle)
        except Exception as e:
            log("dial unreadable for %s: %s" % (handle, str(e)[:80]))
            return
        if not isinstance(dial, dict):
            return
        self.on = str(dial.get("1", "")).strip().lower().startswith("on")
        self.cap = _leading_int(dial.get("2", ""), 2)
        self.cooldown = _leading_int(dial.get("4", ""), COOLDOWN_S)
        self.refractory = _leading_int(dial.get("5", ""), REFRACTORY_S)
        node4 = dial.get("4")
        if isinstance(node4, dict):
            for k, v in node4.items():
                if k == "_" or not isinstance(v, str):
                    continue
                parts = v.strip().split()
                if len(parts) >= 2 and parts[1].isdigit():
                    self.per_ringer[parts[0]] = int(parts[1])

    def cooldown_for(self, ringer):
        return self.per_ringer.get(ringer, self.cooldown)


def holder_ceiling(handle):
    """budget:<handle> position 1 — the holder's spend ceiling, in the
    holder's own locked block. Absent block = no block ceiling (the env
    ceiling WAKER_MAX_DAILY still floors the wallet)."""
    try:
        b = beach_get("budget:%s" % handle)
    except Exception:
        return None
    if not isinstance(b, dict) or "1" not in b:
        return None
    return _leading_int(b.get("1"), None)


def pulses_today(handle):
    """Count today's waker entries in daily:<handle>, recursively — the block
    supernests as it grows, so the scan walks the whole tree."""
    try:
        block = beach_get("daily:%s" % handle)
    except Exception:
        return 0  # unreadable counter never blocks a consented ring outright
    today = time.strftime("%Y-%m-%d", time.gmtime())
    count = 0

    def walk(node):
        nonlocal count
        if not isinstance(node, dict):
            return
        if node.get("1") == "waker" and str(node.get("3", "")).startswith(today):
            count += 1
        for v in node.values():
            walk(v)

    walk(block if isinstance(block, dict) else {})
    return count


# ── the pulse (serialised; kernel re-bound per handle) ─────────────────────

def ensure_teaching():
    src = os.path.abspath(os.path.join(BASE, "..", "src"))
    if os.path.isdir(src):
        return  # repo layout — kernel's own default finds it
    dst = os.path.join(BASE, "teaching")
    os.makedirs(dst, exist_ok=True)
    names = list(TEACHING_NAMES)
    try:
        with urllib.request.urlopen(TEACHING_LIST, timeout=30) as r:
            listing = json.loads(r.read().decode())
        names = [e["name"][:-5] for e in listing
                 if isinstance(e, dict) and str(e.get("name", "")).endswith(".json")] or names
    except Exception as e:
        log("src listing refused (%s) — fetching the minimum teaching" % str(e)[:60])
    for name in names:
        p = os.path.join(dst, name + ".json")
        if os.path.exists(p):
            continue
        try:
            with urllib.request.urlopen(TEACHING_RAW % name, timeout=30) as r:
                open(p, "wb").write(r.read())
        except Exception as e:
            log("teaching fetch failed for %s: %s" % (name, str(e)[:60]))
    log("teaching ready: %d blocks at %s" % (len(os.listdir(dst)), dst))
    os.environ["GENUS_TEACHING"] = dst


def ensure_nest(handle):
    nest = os.path.join(NESTS_DIR, handle)
    os.makedirs(os.path.join(nest, "shell"), exist_ok=True)
    peers_raw = os.environ.get("WAKER_PEERS", "")
    if peers_raw:
        try:
            peers = json.loads(peers_raw)
            with open(os.path.join(nest, "peers.json"), "w") as f:
                json.dump(peers, f)
        except ValueError:
            log("WAKER_PEERS is not JSON — nest %s stays solo" % handle)
    return nest


def run_pulse(handle, ringer, pool, slot):
    """One standard pulse as this handle, then the daily log append. Runs in a
    worker thread with _pulse_lock held; env is re-bound and kernel reloaded
    under the lock (module constants bind at import)."""
    global _last_pulse_end
    started = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    status, note = "failed", ""
    try:
        os.environ["GENUS_BEACH"] = WAKER_BEACH
        os.environ["GENUS_HANDLE"] = handle
        os.environ["GENUS_SECRET"] = egg_secret(handle)
        os.environ["GENUS_AGENT"] = ensure_nest(handle)
        os.environ["GENUS_THINK"] = os.environ.get("WAKER_THINK", "off")
        if "kernel" in sys.modules:  # module constants bind at import — rebind per handle
            kernel = importlib.reload(sys.modules["kernel"])
        else:
            import kernel
        res = kernel.pulse() or {}
        status = str(res.get("status", "done"))
        note = str(res.get("note", "") or "")
        log("pulse complete for %s: status=%s" % (handle, status))
    except Exception as e:
        note = str(e)[:160]
        log("pulse FAILED for %s: %s" % (handle, note))
    finally:
        _last_pulse_end = time.monotonic()
        _pulse_lock.release()
    try:
        entry = {
            "_": "doorbell pulse — rung by %s (a landed voice at %s slot %s); %s%s"
                 % (ringer or "an unattributed voice", pool, slot, status,
                    (": " + note[:160]) if note else ""),
            "1": "waker", "3": started, "4": ringer or "", "5": status,
        }
        beach_append("daily:%s" % handle, entry, egg_secret(handle))
    except Exception as e:
        log("daily log append failed for %s: %s" % (handle, str(e)[:80]))


# ── the ring ───────────────────────────────────────────────────────────────

def ring(payload):
    """Decide one ring. Returns (granted, reason). Fast — two beach reads."""
    pool = str(payload.get("pool", ""))
    ringer = str(payload.get("agent_id", "") or "")
    slot = str(payload.get("slot", ""))
    origin = str(payload.get("origin", ""))
    if origin and host_of(origin) != host_of(WAKER_BEACH):
        return False, "origin %s is not the pinned beach" % origin
    if not pool.startswith("pool:"):
        return False, "not a pool"
    handle = pool[len("pool:"):]
    if handle not in WAKER_EGGS:
        return False, "%s is not a genus room here" % pool
    if ringer == handle:
        return False, "self-ring (the instance's own room answer)"
    if not egg_secret(handle):
        return False, "no shell key held for %s" % handle
    dial = Dial(handle)
    if not dial.on:
        return False, "dial off — %s has not consented" % handle
    now = time.monotonic()
    if _last_pulse_end and now - _last_pulse_end < dial.refractory:
        return False, "refractory (%ds after last pulse, the dial's own)" % dial.refractory
    cd = dial.cooldown_for(ringer or "anon")
    last = _last_ring_by.get((handle, ringer or "anon"))
    if last and cd > 0 and now - last < cd:
        return False, "cooldown for ringer %s (%ds, the dial's own)" % (ringer or "anon", cd)
    ceiling = holder_ceiling(handle)
    cap = min(x for x in (dial.cap, ceiling, MAX_DAILY) if x is not None)
    spent = pulses_today(handle)
    if spent >= cap:
        which = "dial" if cap == dial.cap else ("holder budget" if cap == ceiling else "service ceiling")
        return False, "daily cap reached (%d/%d, from the %s)" % (spent, cap, which)
    if not _pulse_lock.acquire(blocking=False):
        return False, "a pulse is already running — its compose sweeps the room"
    # Granted: the lock is held; the worker releases it and logs the spend.
    _last_ring_by[(handle, ringer or "anon")] = now
    threading.Thread(target=run_pulse, args=(handle, ringer, pool, slot), daemon=True).start()
    return True, "pulse %d/%d for %s, rung by %s" % (spent + 1, cap, handle, ringer or "anon")


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):  # quiet the default per-request stderr line
        pass

    def do_GET(self):
        if self.path.rstrip("/") in ("", "/health"):
            self._send(200, {"ok": True, "service": "genus-one waker (the doorbell)",
                             "beach": WAKER_BEACH, "eggs": WAKER_EGGS,
                             "cooldown_s": COOLDOWN_S, "refractory_s": REFRACTORY_S})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path.rstrip("/") != "/ring":
            return self._send(404, {"error": "not found"})
        got = self.headers.get("x-pool-webhook-secret")
        if not DOORBELL_SECRET or got != DOORBELL_SECRET:
            log("ring refused: %s" % (
                "no shared-secret header on the request" if not got
                else "mismatched shared secret (theirs %d chars, ours %d)" % (len(got), len(DOORBELL_SECRET))))
            return self._send(403, {"error": "bad shared secret"})
        try:
            length = int(self.headers.get("content-length", "0"))
            payload = json.loads(self.rfile.read(length).decode() or "{}")
        except Exception:
            return self._send(400, {"error": "unparseable body"})
        granted, reason = ring(payload)
        log("ring %s: %s (payload %s)" % ("GRANTED" if granted else "declined", reason,
                                          json.dumps(payload)[:200]))
        self._send(202 if granted else 200, {"rung": granted, "reason": reason})


def main():
    if not DOORBELL_SECRET:
        log("WARNING: DOORBELL_SECRET unset — every ring will be refused")
    if not WAKER_EGGS:
        log("WARNING: WAKER_EGGS unset — no room rings anything")
    ensure_teaching()
    port = int(os.environ.get("PORT", "8080"))
    log("listening on :%d — beach %s, eggs %s" % (port, WAKER_BEACH, WAKER_EGGS))
    ThreadingHTTPServer(("", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
