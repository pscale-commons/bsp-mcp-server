"""wire — the beach client for the genus-one kernel.

Blocks live at a federated beach: GET/POST <origin>/.well-known/pscale-beach
with ?block=<name>. Shell blocks are per-handle at the beach (role-with-handle:
purpose:<handle>, conditions:<handle>, ...); the kernel keeps bare names and
this layer suffixes the handle.

Discipline (learned the hard way, spec/v2-lean-kernel.md §7 + the transport
flake diagnosed 2026-07-04): retry-once on network failures; confirm every
write by reading it back. A write that did not land is a lost wake.
"""

import json
import time
import urllib.error
import urllib.parse
import urllib.request

TIMEOUT = 20


def _get(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode())


def _post(url, body):
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(),
        headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode())


def _retry(fn, *args):
    """One retry on transient failure — the observed flake recovers on retry."""
    try:
        return fn(*args)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        time.sleep(1.5)
        return fn(*args)


def endpoint(origin, block):
    return "%s/.well-known/pscale-beach?block=%s" % (
        origin.rstrip("/"), urllib.parse.quote(block, safe=":"))


def load_block(origin, block):
    """The block's JSON, or None if the beach does not host it (404)."""
    try:
        return _retry(_get, endpoint(origin, block))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def save_block(origin, block, content, secret=None, new_lock=None, confirm=True):
    """Whole-block write, confirmed by read-back. Raises on mismatch — a lost
    write must fail loudly, never silently. new_lock creates-locked or rotates
    (the beach's four lock rules); secret proves current authority."""
    body = {"content": content, "confirm": True}   # the beach gates whole-block REPLACE behind confirm
    if secret:
        body["secret"] = secret
    if new_lock:
        body["new_lock"] = new_lock
    _retry(_post, endpoint(origin, block), body)
    if confirm:
        back = load_block(origin, block)
        if back != content:
            raise RuntimeError("write to %s at %s did not read back identical"
                               % (block, origin))
    return True


def seal(origin, block, secret):
    """Make a block holder-only at EVERY position. The beach locks by the first
    digit of a write's path, so a whole-block write's new_lock seals only the
    underscore; this adds lock-only writes (no content) at positions 1-9 so no
    position — present or future — is writable without the secret. Idempotent:
    re-sealing rotates each lock to the same value. Ten locks per block seal the
    shell (sovereignty is the lock, not a layer); leave give channels (task)
    unsealed."""
    for pos in ["", "1", "2", "3", "4", "5", "6", "7", "8", "9"]:
        body = {"secret": secret, "new_lock": secret}
        if pos:
            body["spindle"] = pos
        _retry(_post, endpoint(origin, block), body)
    return True


def index(origin):
    """The beach's derived index — the named sibling blocks at the surface."""
    try:
        j = _retry(_get, "%s/.well-known/pscale-beach" % origin.rstrip("/"))
        return j.get("blocks", []) if isinstance(j, dict) else []
    except Exception:
        return []
