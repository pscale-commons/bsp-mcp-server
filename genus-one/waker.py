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
_verify_fails = {}  # handle -> [monotonic ts of failed passphrase proofs]

# ── enrolment — the holder hands the waker the pen, removably ──────────────
#
# Any holder may enrol their own genus instance: POST /enroll {handle,
# passphrase, notify?} — browser to waker over TLS, the beach never carries a
# secret. The passphrase is PROVEN against the beach's own locks before it is
# stored: the waker reads reflexive:<handle> position 1 and writes it back
# byte-identical under the supplied secret — only the true shell key passes a
# sealed shell's locks, so a wrong key cannot enrol (and on an unsealed shell
# the proof is vacuous but so are the locks). No new_lock is ever sent: the
# proof cannot change lock topology, content, or a single byte. Removal and
# re-enrolment take the passphrase again — only the holder can add, rotate,
# or remove — and rotating the shell lock on the beach invalidates a stale
# enrolment by itself (its folds start failing). The store lives on the
# service volume, mode 600, plaintext: the same trust envelope as this
# process's env (whoever operates the service can read it — holders trust
# the waker operator exactly as they trust a client they type the passphrase
# into). notify is an email address, kept ONLY here — an address in a block
# would be a spam harvest. The proof endpoint is a passphrase oracle, so
# failed proofs are throttled per handle. The waker never asks anyone to
# enrol — enrolment is always the holder arriving by their own hand.
STORE_PATH = os.environ.get("WAKER_STORE", "/data/enrolments.json")
VERIFY_FAILS_MAX = 5          # failed proofs per handle per hour → 429
GMAIL_ADDRESS = os.environ.get("GMAIL_ADDRESS", "")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")
MIRROR_URL = os.environ.get("WAKER_MIRROR", "https://mirror.onen.ai/mirror")
# The factoring's first step (proposals/2026-08-14-push-engine.md): every beach
# event this service receives is forwarded, fire-and-forget, to the push
# engine when one is declared — so the engine gets a live feed from minute one
# and the bus topology can settle later with a one-line settings change.
# Unset = no-op. The waker's own decisions are untouched by the forward.
PUSH_ENGINE_URL = os.environ.get("PUSH_ENGINE_URL", "")


def forward_event(payload):
    if not PUSH_ENGINE_URL:
        return
    def _go():
        try:
            req = urllib.request.Request(
                PUSH_ENGINE_URL, data=json.dumps(payload).encode(),
                headers={"content-type": "application/json",
                         **({"x-pool-webhook-secret": DOORBELL_SECRET} if DOORBELL_SECRET else {})})
            with urllib.request.urlopen(req, timeout=5) as r:
                r.read()
        except Exception as e:
            log("event forward failed: %s" % str(e)[:60])
    threading.Thread(target=_go, daemon=True).start()


def _store_load():
    try:
        with open(STORE_PATH) as f:
            return json.load(f)
    except Exception:
        return {}


def _store_save(store):
    d = os.path.dirname(STORE_PATH)
    if d:
        try:
            os.makedirs(d, exist_ok=True)
        except OSError:
            pass
    tmp = STORE_PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(store, f, indent=2)
    os.replace(tmp, STORE_PATH)
    try:
        os.chmod(STORE_PATH, 0o600)
    except OSError:
        pass


def beach_post(block, body):
    req = urllib.request.Request(
        "%s/.well-known/pscale-beach?block=%s" % (WAKER_BEACH, quote(block)),
        data=json.dumps(body).encode(),
        headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())


def _throttled(handle):
    now = time.monotonic()
    fails = [t for t in _verify_fails.get(handle, []) if now - t < 3600]
    _verify_fails[handle] = fails
    return len(fails) >= VERIFY_FAILS_MAX


def verify_shell_key(handle, passphrase):
    """Prove the passphrase against the beach's own locks: read a sealed organ
    position and write it back byte-identical under the supplied secret.
    True shell key → 200; wrong key on a sealed shell → 403. Returns
    (ok, reason)."""
    try:
        shell = beach_get("reflexive:%s" % handle)
    except Exception as e:
        return False, "beach unreachable: %s" % str(e)[:60]
    if not isinstance(shell, dict) or "1" not in shell:
        return False, "no hatched shell found for %s (reflexive:%s absent)" % (handle, handle)
    try:
        beach_post("reflexive:%s" % handle,
                   {"spindle": "1", "content": shell["1"], "secret": passphrase})
        return True, "proven against the shell's own locks"
    except urllib.error.HTTPError as e:
        if e.code == 403:
            _verify_fails.setdefault(handle, []).append(time.monotonic())
            return False, "passphrase does not open this shell"
        return False, "beach refused the proof: HTTP %d" % e.code
    except Exception as e:
        return False, "proof failed: %s" % str(e)[:60]


def enrolment(handle):
    return _store_load().get(handle)


def enrolled_handles():
    return sorted(set(WAKER_EGGS) | set(_store_load().keys()))


# ── notify — the same event, pushed to the person ──────────────────────────

def notify_holder(handle, ringer, pool, slot, status, note):
    """One plain email to the enrolled address after a funded wake. The
    sender is the beach's own (service env); holders supply only an address.
    Failure is logged and never touches the pulse."""
    e = enrolment(handle)
    addr = (e or {}).get("notify", "")
    if not addr:
        return
    if not (GMAIL_ADDRESS and GMAIL_APP_PASSWORD):
        log("notify skipped for %s: sender credentials unset" % handle)
        return
    try:
        import smtplib
        from email.mime.text import MIMEText
        body = (
            "%s woke at %s.\n\n"
            "Rung by: %s (a landed voice at %s, slot %s)\n"
            "Outcome: %s\n"
            "Note: %s\n\n"
            "Its room: %s?pool=%s\n"
            "Pulse journal: daily:%s at the beach.\n\n"
            "— the beach doorbell. You receive this because you enrolled %s\n"
            "with this address. Change or remove your enrolment at the waker's\n"
            "/enroll page. The waker never asks you for anything by email."
            % (handle, WAKER_BEACH, ringer or "an unattributed voice", pool, slot,
               status, (note or "")[:300], MIRROR_URL, handle, handle, handle))
        msg = MIMEText(body)
        msg["Subject"] = "%s woke — rung by %s" % (handle, ringer or "a voice")
        msg["From"] = GMAIL_ADDRESS
        msg["To"] = addr
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as s:
            s.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            s.send_message(msg)
        log("notified holder of %s" % handle)
    except Exception as e:
        log("notify failed for %s: %s" % (handle, str(e)[:80]))


def log(msg):
    print("[waker] %s" % msg, flush=True)


def egg_secret(handle):
    e = _store_load().get(handle)
    if e and e.get("secret"):
        return e["secret"]
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


BEACH_FUEL_ON = os.environ.get("WAKER_BEACH_FUEL", "on").strip().lower() not in ("off", "0", "false", "no")
_STANDING_KEY = os.environ.get("ANTHROPIC_API_KEY", "")


def pick_fuel(handle, asker_key):
    """(key, funder) by the settled precedence: the asker's carried fuel, then
    the holder's deposited fuel, then the beach's standing fuel when the
    generosity switch is on. (None, None) = no fuel — the voice stands."""
    if asker_key:
        return asker_key, "asker"
    e = enrolment(handle) or {}
    if e.get("fuel"):
        return e["fuel"], "holder"
    if BEACH_FUEL_ON and _STANDING_KEY:
        return _STANDING_KEY, "beach"
    return None, None


def run_pulse(handle, ringer, pool, slot, fuel_key=None, funder="beach", pen=None):
    """One standard pulse as this handle on the given fuel, then the daily log
    append (funder recorded at field 6). Runs with _pulse_lock held; env is
    re-bound and kernel reloaded under the lock (module constants bind at
    import), the fuel restored to the standing key afterwards."""
    global _last_pulse_end
    started = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    status, note = "failed", ""
    try:
        os.environ["GENUS_BEACH"] = WAKER_BEACH
        os.environ["GENUS_HANDLE"] = handle
        os.environ["GENUS_SECRET"] = pen or egg_secret(handle)
        os.environ["GENUS_AGENT"] = ensure_nest(handle)
        os.environ["GENUS_THINK"] = os.environ.get("WAKER_THINK", "off")
        os.environ["ANTHROPIC_API_KEY"] = fuel_key or _STANDING_KEY
        if "kernel" in sys.modules:  # module constants bind at import — rebind per handle
            kernel = importlib.reload(sys.modules["kernel"])
        else:
            import kernel
        res = kernel.pulse() or {}
        status = str(res.get("status", "done"))
        note = str(res.get("note", "") or "")
        log("pulse complete for %s: status=%s funder=%s" % (handle, status, funder))
    except Exception as e:
        note = str(e)[:160]
        log("pulse FAILED for %s (funder %s): %s" % (handle, funder, note))
    finally:
        os.environ["ANTHROPIC_API_KEY"] = _STANDING_KEY  # the carried fuel is never kept
        _last_pulse_end = time.monotonic()
        _pulse_lock.release()
    try:
        entry = {
            "_": "doorbell pulse — rung by %s (a landed voice at %s slot %s); %s%s"
                 % (ringer or "an unattributed voice", pool, slot, status,
                    (": " + note[:160]) if note else ""),
            "1": "waker", "3": started, "4": ringer or "", "5": status, "6": funder,
        }
        beach_append("daily:%s" % handle, entry, pen or egg_secret(handle))
    except Exception as e:
        log("daily log append failed for %s: %s" % (handle, str(e)[:80]))
    notify_holder(handle, ringer, pool, slot, status, note)
    return status, note


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
    if handle not in enrolled_handles():
        return False, "%s is not a genus room here (no holder has enrolled it)" % pool
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
    fuel_key, funder = pick_fuel(handle, None)   # the webhook path carries no asker fuel
    if not fuel_key:
        return False, "no fuel — nobody's generosity stands, so the voice waits in the room"
    # LIMITS ARE THE SHADOW OF WHO PAYS (ways:doorbell:3; ruled 2026-08-17).
    # This keyless path runs on generosity — the holder's deposited fuel or the
    # beach's standing key — so the dial's attention cap binds it, and the
    # payer's own ceiling rides alongside: the holder's budget block on holder
    # fuel; both it and MAX_DAILY on the beach's.
    caps = [dial.cap]
    if funder == "holder":
        caps += [c for c in (holder_ceiling(handle),) if c is not None]
    elif funder == "beach":
        caps += [c for c in (holder_ceiling(handle), MAX_DAILY) if c is not None]
    cap = min(caps)
    spent = pulses_today(handle)
    if spent >= cap:
        return False, "daily cap reached (%d/%d)" % (spent, cap)
    if not _pulse_lock.acquire(blocking=False):
        return False, "a pulse is already running — its compose sweeps the room"
    # Granted: the lock is held; the worker releases it and logs the spend.
    _last_ring_by[(handle, ringer or "anon")] = now
    threading.Thread(target=run_pulse, args=(handle, ringer, pool, slot, fuel_key, funder),
                     daemon=True).start()
    return True, "pulse %d/%d for %s, rung by %s, %s fuel" % (spent + 1, cap, handle, ringer or "anon", funder)


CORS_ORIGINS = [o.strip() for o in os.environ.get(
    "WAKER_CORS_ORIGINS",
    "https://mirror.onen.ai,https://xstream.onen.ai,http://localhost:5173").split(",") if o.strip()]


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        origin = self.headers.get("origin", "")
        if origin in CORS_ORIGINS:
            self.send_header("access-control-allow-origin", origin)
            self.send_header("access-control-allow-methods", "GET, POST, DELETE, OPTIONS")
            self.send_header("access-control-allow-headers", "content-type")

    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("content-length", "0")
        self.end_headers()

    def log_message(self, fmt, *args):  # quiet the default per-request stderr line
        pass

    def _body(self):
        length = int(self.headers.get("content-length", "0"))
        return json.loads(self.rfile.read(length).decode() or "{}")

    def _enroll(self, remove):
        try:
            b = self._body()
        except Exception:
            return self._send(400, {"ok": False, "detail": "unparseable body"})
        handle = str(b.get("handle", "")).strip()
        passphrase = str(b.get("passphrase", ""))
        notify = str(b.get("notify", "")).strip()
        fuel = str(b.get("fuel", "")).strip()
        if not handle or not passphrase:
            return self._send(400, {"ok": False, "detail": "handle and passphrase are both needed"})
        if _throttled(handle):
            return self._send(429, {"ok": False, "detail": "too many failed proofs for this handle — wait an hour"})
        ok, reason = verify_shell_key(handle, passphrase)
        log("enrolment %s for %s: %s (%s)" % ("remove" if remove else "add", handle,
                                              "proven" if ok else "REFUSED", reason))
        if not ok:
            return self._send(403, {"ok": False, "detail": reason})
        store = _store_load()
        if remove:
            if handle in store:
                del store[handle]
                _store_save(store)
            return self._send(200, {"ok": True, "detail": "%s removed — its doorbell no longer rings here" % handle})
        store[handle] = {"secret": passphrase, "notify": notify, "fuel": fuel,
                         "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
        _store_save(store)
        return self._send(200, {"ok": True, "detail": "%s enrolled — a landed voice in pool:%s now rings it, within its own dial (wake:%s)%s"
                                % (handle, handle, handle,
                                   ("; wake notes go to " + notify) if notify else "")})

    def do_GET(self):
        path = self.path.split("?")[0].rstrip("/")
        if path in ("", "/health"):
            self._send(200, {"ok": True, "service": "genus-one waker (the doorbell)",
                             "beach": WAKER_BEACH, "enrolled": enrolled_handles(),
                             "default_cooldown_s": COOLDOWN_S, "default_refractory_s": REFRACTORY_S})
        elif path == "/enroll":
            self._send(200, {"ok": True, "detail": "enrolment is a holder's POST {handle, passphrase, notify?} to this path; "
                                                   "DELETE with the same proof removes. The passphrase is proven against the "
                                                   "beach's own locks and kept only on this service. The waker never asks "
                                                   "anyone to enrol — enrolment is always the holder's own hand."})
        else:
            self._send(404, {"error": "not found"})

    def do_DELETE(self):
        if self.path.split("?")[0].rstrip("/") == "/enroll":
            return self._enroll(remove=True)
        self._send(404, {"error": "not found"})

    def _poke(self):
        """The asker's (or holder's) direct poke — asker-pays lands here.
        POST {handle, asker_id, text?, asker_key?, passphrase?}: the pulse lock
        is taken FIRST so the landed voice's own webhook ring finds it busy
        (no double-wake); text lands in the room (or, passphrase proven, at the
        sealed task line — the holder's private directive); fuel by precedence
        (asker's carried > holder's deposited > beach's standing); the wake
        runs synchronously and the outcome returns. The carried key is used
        once and never stored. The DOOR is the consent — the dial's on/off,
        or the holder's proven passphrase overriding a closed one. Past the
        door, NO LIMITS BIND THE ASKER'S OWN KEY (ruled 2026-08-17): no cap,
        no cooldown, no refractory — the busy-lock alone serialises; a
        holder's task poke is likewise unlimited. Cap, cooldown and
        refractory bind FUNDED GENEROSITY only (holder and beach fuel) —
        limits are the shadow of who pays (ways:doorbell:3)."""
        try:
            b = self._body()
        except Exception:
            return self._send(400, {"ok": False, "detail": "unparseable body"})
        handle = str(b.get("handle", "")).strip()
        asker = str(b.get("asker_id", "")).strip() or "anon"
        text = str(b.get("text", "") or "")
        asker_key = str(b.get("asker_key", "") or "")
        passphrase = str(b.get("passphrase", "") or "")
        if not handle:
            return self._send(400, {"ok": False, "detail": "which agent?"})
        if not passphrase and (handle not in enrolled_handles() or not egg_secret(handle)):
            return self._send(200, {"ok": True, "woke": False,
                                    "detail": "no holder has enrolled %s — its pen is not here" % handle})
        as_holder = False
        if passphrase:
            if _throttled(handle):
                return self._send(429, {"ok": False, "detail": "too many failed proofs — wait an hour"})
            ok, reason = verify_shell_key(handle, passphrase)
            if not ok:
                return self._send(403, {"ok": False, "detail": reason})
            as_holder = True
        dial = Dial(handle)
        if not dial.on and not as_holder:
            landed = ""
            if text:
                try:
                    r = beach_append("pool:%s" % handle, {"_": text, "1": asker}, None)
                    landed = " — your voice stands at slot %s for its next wake" % r.get("slot", "?")
                except Exception:
                    landed = " — and the room refused the voice"
            return self._send(200, {"ok": True, "woke": False,
                                    "detail": "its door is closed%s" % landed})
        fuel_key, funder = pick_fuel(handle, asker_key)
        if not fuel_key:
            return self._send(200, {"ok": True, "woke": False,
                                    "detail": "no fuel — carry your key with the poke, or the voice just stands"})
        # NO LIMITS ON THE ASKER'S OWN KEY (ruled 2026-08-17): once the door
        # is open, a poke carrying its own fuel meets no refractory and no
        # cooldown either — the busy-lock below is the only serialiser.
        # Pacing, like the cap, is the shadow of who pays: it binds funded
        # generosity (holder and beach fuel), never the asker's own spend.
        now = time.monotonic()
        if _last_pulse_end and now - _last_pulse_end < dial.refractory and not as_holder and funder != "asker":
            return self._send(200, {"ok": True, "woke": False, "detail": "just woke — refractory; your voice can still land"})
        cd = dial.cooldown_for(asker)
        last = _last_ring_by.get((handle, asker))
        if last and cd > 0 and now - last < cd and not as_holder and funder != "asker":
            return self._send(200, {"ok": True, "woke": False,
                                    "detail": "its dial holds you to one wake per %ds — the voice can still land" % cd})
        # Generosity keeps its caps (the asker's own key met no gate above):
        # the dial's attention cap on holder and beach fuel, the holder's
        # budget block on holder fuel, both plus MAX_DAILY on the beach's
        # standing key.
        if not as_holder and funder != "asker":
            spent = pulses_today(handle)
            caps = [dial.cap]
            if funder == "holder":
                caps += [c for c in (holder_ceiling(handle),) if c is not None]
            elif funder == "beach":
                caps += [c for c in (holder_ceiling(handle), MAX_DAILY) if c is not None]
            if spent >= min(caps):
                return self._send(200, {"ok": True, "woke": False,
                                        "detail": "its attention cap is reached today (%d) — the voice can still land" % min(caps)})
        if not _pulse_lock.acquire(blocking=False):
            return self._send(200, {"ok": True, "woke": False,
                                    "detail": "already awake — a running wake will meet the room"})
        try:
            slot = ""
            if text:
                target = ("task:%s" if as_holder else "pool:%s") % handle
                r = beach_append(target, {"_": text, "1": asker},
                                 passphrase if as_holder else None)
                slot = str(r.get("slot", ""))
        except Exception as e:
            _pulse_lock.release()
            return self._send(502, {"ok": False, "detail": "the voice would not land: %s" % str(e)[:80]})
        _last_ring_by[(handle, asker)] = now
        log("poke GRANTED: %s pokes %s (%s fuel%s)" % (asker, handle, funder, ", as holder" if as_holder else ""))
        status, note = run_pulse(handle, asker, "poke", slot, fuel_key, funder,
                                 pen=passphrase if as_holder else None)
        return self._send(200, {"ok": True, "woke": status not in ("failed",), "funder": funder,
                                "status": status, "detail": (note or status)[:300]})

    def do_POST(self):
        path = self.path.split("?")[0].rstrip("/")
        if path == "/enroll":
            return self._enroll(remove=False)
        if path == "/poke":
            return self._poke()
        if path != "/ring":
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
        forward_event(payload)
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
