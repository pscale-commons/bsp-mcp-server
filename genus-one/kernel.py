#!/usr/bin/env python3
"""kernel.py — locus 4. The pulse. (Stages 0–3.) genus-one, the federated dialect.

GENUS-ONE — named for the torus, the genus-1 surface: S¹ × S¹, the longitudinal
loop (wake after wake, continuity of intention) crossed with the transversal
loop (live co-presence). Lineage: the biome mobius — same genome, the zero
fundamental swapped and the boundary of each wake closed by the live axis.

Port of pscale-biome src/agent/kernel.py (canonical HEAD — the v009 lineage
with doc-3 coupling, the thinking module, the nested reflexive current, and
the task channel). The pulse logic is verbatim; what changed is enumerated at
the foot of this docstring.

One wake = one pulse. No loop; the wake is the clock, the heartbeat a self-set
rate set externally per invocation.

A pulse:
  1. F (Stage 1) — compute the gap. Gromov-prune the addresses of Π (purpose)
     and ρ (conditions) to coupled cells; at each, compare the intended shape
     against the perceived shape. Absence in ρ where Π intends is a structural
     gap (no call); where both are present, a small focused compare decides
     coherence, coloured by the conditioning field. The result is sparse γ.
  2. rest (Stage 3) — γ = ∅ → write nothing, no history, no churn. The default.
  3. δ (Stage 2) — resolve γ. The full window is composed (the reflexive current
     hydrated, the bundle shown raw beside it — the aha surface — plus the
     computed γ); the LLM returns CLASSIFIED edits (point/spindle/ring/star/
     supernest), discards γ₃ (gaps about its own self), and re-dials the
     reflexive current for the next instance.
  4. fold — apply edits, write the next reflexive current, a history note.

Run (from an instance dir holding shell/ + peers.json, or set GENUS_AGENT):
    python3 kernel.py --compose-only   # F (structural) + compose window + filmstrip, NO LLM
    python3 kernel.py                   # one full pulse (needs ANTHROPIC_API_KEY)

Dialect changes from the biome canonical (nothing else):
  - storage zero fundamental "_" (via the federated spark.py beside this file);
    every kernel-side literal "0" storage key is now "_".
  - constant teaching defaults to sunstone + whetstone (loaded from bsp-mcp/src);
    GENUS_CONCENTRATE overrides (parity runs against biome content set it to
    "slate,flint").
  - instance dir parameterised: GENUS_AGENT (default cwd) holds shell/,
    filmstrip/, peers.json — the kernel itself lives once, in the repo.
  - optional write-through to a federated beach: GENUS_BEACH + GENUS_HANDLE
    (+ GENUS_SECRET) make load/save reach <origin>/.well-known/pscale-beach
    with role-with-handle names. Local shell/ stays the working copy and
    offline fallback. peers.json values may be beach origins (https://...) —
    a peer then resolves to surface:<peer> (and its phase face to
    phase:<peer>) at that beach; a peer resolves only to what it publishes.
  - env prefix GENUS_* (THINK, COUPLE, RIPENESS, models, NOW, ...); the
    mobius-lineage key-file paths are still honoured.
"""

import json
import math
import os
import re
import sys
import time
import urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
import spark  # noqa: E402
import wire   # noqa: E402

AGENT = os.path.abspath(os.environ.get("GENUS_AGENT", os.getcwd()))
SHELL_DIR = os.path.join(AGENT, "shell")
TEACHING_DIR = os.environ.get("GENUS_TEACHING",
                              os.path.join(BASE, "..", "src"))
FILMSTRIP_DIR = os.path.join(AGENT, "filmstrip")

BEACH = os.environ.get("GENUS_BEACH", "").rstrip("/")      # write-through home
HANDLE = os.environ.get("GENUS_HANDLE", "")
SECRET = os.environ.get("GENUS_SECRET", "")

API_URL = "https://api.anthropic.com/v1/messages"

ZK = spark.ZK                                              # "_"


def _load_api_key():
    """Find the Anthropic key without per-run fuss. Order:
      1. ANTHROPIC_API_KEY env var (for overrides / CI)
      2. a one-time key file — set it ONCE and every version's kernel finds it:
             mkdir -p ~/.config/genus-one && echo 'sk-ant-...' > ~/.config/genus-one/anthropic-key
         (the mobius-lineage paths ~/.config/mobius/anthropic-key and
          ~/.mobius-key are still honoured)
      3. a .env file (ANTHROPIC_API_KEY=...) beside the package or run root
    """
    k = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if k:
        return k
    for path in (os.environ.get("GENUS_KEY_FILE", ""),
                 os.path.expanduser("~/.config/genus-one/anthropic-key"),
                 os.path.expanduser("~/.config/mobius/anthropic-key"),
                 os.path.expanduser("~/.mobius-key")):
        if path and os.path.exists(path):
            return open(path).read().strip()
    here = os.path.dirname(os.path.abspath(__file__))
    for d in (here, os.path.dirname(here), os.path.dirname(os.path.dirname(here))):
        envp = os.path.join(d, ".env")
        if os.path.exists(envp):
            for line in open(envp):
                line = line.strip()
                if line.startswith("ANTHROPIC_API_KEY") and "=" in line:
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


API_KEY = _load_api_key()
# Model tiers — pinned current strings. Tier follows the pscale of the gap:
# haiku for fine (per-cell compares), sonnet for the floor-level δ reflective
# call, opus for coarse review/reorient.
TIERS = {
    "haiku":  os.environ.get("GENUS_HAIKU",  "claude-haiku-4-5-20251001"),
    "sonnet": os.environ.get("GENUS_SONNET", "claude-sonnet-5"),
    "opus":   os.environ.get("GENUS_OPUS",   "claude-opus-4-8"),
}
MODEL = os.environ.get("GENUS_MODEL", TIERS["sonnet"])    # δ (reflective) call
F_MODEL = os.environ.get("GENUS_F_MODEL", TIERS["haiku"])  # per-cell compares (cheap)
MAX_TOKENS = int(os.environ.get("GENUS_MAX_TOKENS", "4096"))

REFLEXIVE_CURRENT = "9"
FIELD_ADDR = "2.1"                       # concentrated conditioning field (anchors) for F


# ── block I/O ──────────────────────────────────────────────────────────────

_cache = {}


def _teaching_names():
    try:
        return {p[:-5] for p in os.listdir(TEACHING_DIR) if p.endswith(".json")}
    except OSError:
        return set()


def load_block(name):
    """Loader / router. Resolves, in order: my own shell (beach write-through
    home first when configured, local shell/ as working copy and offline
    fallback), the constant teaching, then a PEER's published surface (a peer
    name routes via peers.json — a local agent dir, or a beach origin whose
    surface:<peer> block is the published face). A peer resolves only to what
    it publishes — its surface — never its private blocks. None if absent.
    This is the single path for all block access, so peer content is an
    addressable reference, not an out-of-band read."""
    if name in _cache:
        return _cache[name]
    if BEACH and HANDLE and name not in _teaching_names():
        try:
            got = wire.load_block(BEACH, "%s:%s" % (name, HANDLE))
            if got is not None:
                _cache[name] = got
                return got
        except Exception as ex:
            print("  [wire] load %s fell back local: %s" % (name, str(ex)[:80]))
    for d in (SHELL_DIR, TEACHING_DIR):
        p = os.path.join(d, name + ".json")
        if os.path.exists(p):
            with open(p) as f:
                _cache[name] = json.load(f)
            return _cache[name]
    peers = load_peers()                               # route a peer name to its surface
    if name in peers:
        home = peers[name]
        if isinstance(home, str) and home.startswith("http"):
            try:
                got = wire.load_block(home, "surface:%s" % name)
                if got is not None:
                    _cache[name] = got
                return got
            except Exception as ex:
                print("  [wire] peer %s unreachable: %s" % (name, str(ex)[:80]))
                return None
        fp = os.path.join(home, "shell", "surface.json")
        if os.path.exists(fp):
            with open(fp) as f:
                _cache[name] = json.load(f)
            return _cache[name]
    return None


def save_block(name, block):
    """Local write always (the working copy); write-through to the beach home
    when configured. A wire failure is loud but not fatal — the local copy
    holds, and the next clean fold can push."""
    _cache[name] = block
    with open(os.path.join(SHELL_DIR, name + ".json"), "w") as f:
        json.dump(block, f, indent=2, ensure_ascii=False)
        f.write("\n")
    if BEACH and HANDLE:
        try:
            wire.save_block(BEACH, "%s:%s" % (name, HANDLE), block, SECRET)
        except Exception as ex:
            print("  [wire] WRITE-THROUGH FAILED %s: %s" % (name, str(ex)[:120]))


def flush_cache():
    _cache.clear()


def load_peers():
    """peers.json in the agent dir maps {peer_name: agent_dir_or_beach_origin}.
    Empty if solo. Peers are how the agent reaches the 'between' — it reads
    what a peer publishes and never its private blocks."""
    p = os.path.join(AGENT, "peers.json")
    if os.path.exists(p):
        try:
            return json.load(open(p))
        except Exception:
            return {}
    return {}


# ── rendition rendering ────────────────────────────────────────────────────

def render(res):
    if isinstance(res, str):
        return res
    if not isinstance(res, dict):
        return str(res)
    mode = res.get("mode")
    if mode == "spindle":
        return "\n".join("%s %s" % (">" * (i + 1), e.get("text") or "·")
                         for i, e in enumerate(res.get("entries", [])))
    if mode == "point":
        return res.get("text") or "·"
    if mode == "directory":
        return json.dumps(res.get("subtree"), ensure_ascii=False, indent=2)
    if mode == "whole":
        return json.dumps(res.get("block"), ensure_ascii=False, indent=2)
    if mode == "ring":
        return "\n".join("%s: %s" % (s["digit"], s.get("text") or "·")
                         for s in res.get("siblings", []))
    if mode == "disc":
        return "\n".join("%s: %s" % (n["address"], n.get("text") or "·")
                         for n in res.get("nodes", []))
    return json.dumps(res, ensure_ascii=False)


# ── LLM call ───────────────────────────────────────────────────────────────

def _think_config():
    """The thinking-module switch — Locus 2 (the reasoning module) on/off. An
    experiment hook (GENUS_THINK), INERT by default so a normal pulse is
    unchanged (Locus 1: the weights complete directly, no thinking).

      unset / off / 0   -> None  (no thinking — Locus 1 only)
      an integer N      -> {type: enabled, budget_tokens: N}
                           the uniform cross-model form: works on haiku 4.5 AND
                           sonnet 4.6 (haiku has no adaptive; verified via Models API)
      'adaptive'        -> {type: adaptive}  (sonnet 4.6 / opus only)
    """
    t = os.environ.get("GENUS_THINK", "").strip().lower()
    if not t or t in ("off", "0", "none", "false"):
        return None
    if t == "adaptive":
        return {"type": "adaptive"}
    try:
        return {"type": "enabled", "budget_tokens": int(t)}
    except ValueError:
        return {"type": "enabled", "budget_tokens": 2048}


def call_llm(system, message, model=None, thinking=None):
    max_tokens = MAX_TOKENS
    if thinking and thinking.get("type") == "enabled":
        max_tokens = MAX_TOKENS + thinking["budget_tokens"]   # budget must be < max_tokens; keep output room
    body = {"model": model or MODEL, "max_tokens": max_tokens, "system": system,
            "messages": [{"role": "user", "content": message}]}
    if thinking:
        body["thinking"] = thinking
    req = urllib.request.Request(
        API_URL, data=json.dumps(body).encode(),
        headers={"content-type": "application/json", "x-api-key": API_KEY,
                 "anthropic-version": "2023-06-01"})
    with urllib.request.urlopen(req, timeout=180) as r:
        result = json.loads(r.read().decode())
    content = result.get("content", [])
    text = "\n".join(b["text"] for b in content if b.get("type") == "text")
    think = "\n".join(b.get("thinking", "") for b in content if b.get("type") == "thinking")
    return text, result.get("usage", {}), think      # think captured so the filmstrip shows Locus 2


# ── F — compute the gap (Stage 1) ──────────────────────────────────────────

def _format_address(digits, flr):
    """Digits to the canonical display address: the decimal pins the floor.
    Above-floor walks (shorter than the floor) render as bare digits — the
    known geometry wrinkle, display-only here."""
    s = "".join(digits)
    return s if len(digits) <= flr else s[:flr] + "." + s[flr:]


def _zero_text(node):
    return node if isinstance(node, str) else spark.voice(node)


def _at(block, path):
    """Voiced text at a digit-path tuple, or None."""
    node = block
    for d in path:
        if isinstance(node, dict) and d in node:
            node = node[d]
        else:
            return None
    return _zero_text(node)


def frontier_candidates(purpose, conditions):
    """Walk Π top-down. A branch Π intends but ρ does not realise is the frontier
    (structural gap, no descent). A branch both carry is a coherence compare, and
    we descend past it. Gromov-pruning: coupling = shared prefix, so the frontier
    is where ρ stops matching Π."""
    floor = spark.floor(purpose)
    out = []

    def rec(node, path):
        if not isinstance(node, dict):
            return
        for d in "123456789":
            if d not in node:
                continue
            child = node[d]
            p = path + (d,)
            intended = _zero_text(child)
            if not intended:                       # headless intent — descend, no cell
                rec(child, p) if isinstance(child, dict) else None
                continue
            if spark.parse_reference(intended):    # a star anchor (e.g. vision:9), not a cell
                continue
            addr_str = _format_address(list(p), floor)
            perceived = _at(conditions, p)
            if perceived is None:
                out.append({"address": "purpose:" + addr_str, "type": "missing",
                            "path": list(p),                        # the purpose-branch walk (for the phase prune)
                            "target": "conditions:" + addr_str,     # the ρ-side gap to write
                            "intended": intended, "perceived": None})  # frontier; no descent
            else:
                out.append({"address": "purpose:" + addr_str, "type": "compare",
                            "path": list(p),
                            "intended": intended, "perceived": perceived})
                if isinstance(child, dict):
                    rec(child, p)
    rec(purpose, ())
    return out


def concentrated_field():
    refl = load_block("reflexive")
    try:
        return render(spark.spark(refl, FIELD_ADDR, -1))
    except Exception:
        return ""


def compare_cell(c, field):
    """One small focused compare. Returns a γ-entry if the shapes diverge, else None."""
    system = ("You compare two pscale spindles for shape coherence. This field colours "
              "the comparison; do not answer it:\n" + field +
              "\nReply EMPTY if they cohere as shapes; else one line naming the divergence.")
    message = ("Address %s\nΠ intends: %s\nρ perceives: %s\nDo these cohere?"
               % (c["address"], c["intended"], c["perceived"]))
    text, _, _ = call_llm(system, message, model=F_MODEL)
    t = text.strip()
    if not t or t.upper().startswith("EMPTY"):
        return None
    return {"address": c["address"], "type": "diverge", "divergence": t[:200],
            "path": c.get("path"),
            "intended": c["intended"], "perceived": c["perceived"]}

# ── phase — the second prune, by ripeness in time (doc 2) ───────────────────
# Cadence lives in two parallel digit-keyed blocks, never as metadata on purpose
# (spine keys are the underscore and digits only): `cadence` carries each
# periodic concern's period in seconds — authored, the reference side (Π);
# `last-touched` carries when it last fired — kernel-stamped, the perceived
# side (ρ). Both mirror purpose's branch addresses. phase = (now − last_touched)
# / period. A branch absent from cadence is aperiodic and never pruned. The LLM
# never reads, writes, or reasons about any of this — it is arithmetic, like
# the address walk itself.

RIPENESS = float(os.environ.get("GENUS_RIPENESS", "1.0"))      # admit at phase ≥ this
LAST_TOUCHED_VOICING = ("Last-touched — when each periodic concern last fired, "
                        "epoch seconds, by purpose-branch address. The kernel "
                        "stamps this on a fold; it is never authored or read into "
                        "the window.")


def _phase(period, last_touched, now):
    """(now − last_touched) / period. Never-fired (no last_touched) → ∞ → admit."""
    if last_touched is None:
        return float("inf")
    try:
        p, lt = float(period), float(last_touched)
    except (TypeError, ValueError):
        return float("inf")
    return (now - lt) / p if p > 0 else float("inf")


def _cadence_paths(cadence):
    """Every purpose-branch path that carries a period (a voiced cadence node),
    excluding the block's own root voicing. A periodic parent and its periodic
    children both appear — periodicity is hierarchical."""
    out = []

    def rec(node, path):
        if not isinstance(node, dict):
            if path:
                out.append(path)                            # a bare-string period leaf
            return
        if path and isinstance(node.get(ZK), str):
            out.append(path)                                # a node carrying its own period at _
        for d in "123456789":
            if d in node:
                rec(node[d], path + (d,))
    rec(cadence, ())
    return out


def phase_prune(candidates, cadence, lasts, now=None, phis=None):
    """Drop periodic candidates not yet ripe — the sibling of the frontier prune,
    on the time axis. A candidate sleeps if itself or any ancestor branch carries a
    period whose effective phase < RIPENESS; aperiodic candidates pass untouched.
    effective_phase = phase + φ (the coupling offset, when supplied). Pure
    arithmetic, makes no γ. Returns (kept, pruned)."""
    if not _cadence_paths(cadence):
        return candidates, []                               # nothing periodic → no-op
    now = time.time() if now is None else now
    kept, pruned = [], []
    for c in candidates:
        path = tuple(c.get("path") or ())
        asleep = False
        for k in range(1, len(path) + 1):                   # itself + each ancestor prefix
            pre = path[:k]
            period = _at(cadence, pre)
            if period is None:
                continue
            ph = _phase(period, _at(lasts, pre), now)
            if phis and pre in phis:                        # effective_phase = phase + φ
                ph += phis[pre]
            if ph < RIPENESS:
                asleep = True
                break
        (pruned if asleep else kept).append(c)
    return kept, pruned


def stamp_touched(gamma, applied, cadence, lasts, now=None):
    """A2 — stamp last-touched = now for each periodic concern that did real work
    this wake: a γ-entry in its subtree and at least one applied edit. A concern
    admitted but coherent (no γ under it) is NOT stamped — it stays admitted, the
    necessary-not-sufficient rule. Mutates `lasts`; returns the stamped paths."""
    if not applied:
        return []
    concerns = _cadence_paths(cadence)
    if not concerns:
        return []
    now = time.time() if now is None else now
    gpaths = [tuple(g["path"]) for g in gamma if g.get("path")]
    flr = spark.floor(lasts) if lasts else 1
    stamped = []
    for path in concerns:
        if any(gp[:len(path)] == path for gp in gpaths):
            spark.spark(lasts, _format_address(list(path), flr), content=str(int(now)))
            stamped.append(path)
    return stamped


# ── coupling — the phase channel between agents (doc 3) ─────────────────────
# The natural-frequency oscillators of doc 2 gain a coupling. Each publishes its
# (effective) cycle-position θ — a kernel-owned face, distinct from the semantic
# surface — reads proximate peers' θ, and nudges a per-concern offset φ toward a
# coordinated-but-OFFSET target: the splay (distributed, never unison). The nudge
# is Sakaguchi (a separation lag α): align toward, hold distance from — with α a
# little past a quarter-cycle the in-phase state goes unstable and the splay
# locks. effective_phase = phase + φ. Kernel-mechanical throughout; the LLM never
# sees θ or φ. φ is fed to the prune (given teeth) only under GENUS_COUPLE; the
# default is the handoff's dry-run — φ computed, published, instrumented, no teeth
# (teeth need free-running, the daemon the kernel refuses).

COUPLE_GAIN = float(os.environ.get("GENUS_COUPLE_GAIN", "0.1"))     # nudge strength K
COUPLE_ALPHA = float(os.environ.get("GENUS_COUPLE_ALPHA", "0.30"))  # separation lag, cycles
COUPLE = os.environ.get("GENUS_COUPLE", "") not in ("", "0", "false")
PHASE_VOICING = ("Phase — the published cycle-position θ (effective phase mod 1) of "
                 "each periodic concern; the coupling face peers read, distinct from "
                 "the semantic surface. Kernel-written each pulse.")
PHI_VOICING = ("Phi — the kernel-maintained phase offset φ per periodic concern, "
               "accumulated by the separation nudge toward the splay. Private; "
               "effective_phase = phase + φ. Never authored or read by the LLM.")


def _theta(phase):
    """Fractional cycle-position in [0,1). ∞ (never fired) → 0 by convention."""
    if phase == float("inf"):
        return 0.0
    return phase - math.floor(phase)


def order_parameter(thetas):
    """Kuramoto r = |mean e^{2πiθ}| ∈ [0,1]. r→1 is unison; r→0 is the splay."""
    if not thetas:
        return 0.0
    c = sum(math.cos(2 * math.pi * t) for t in thetas) / len(thetas)
    s = sum(math.sin(2 * math.pi * t) for t in thetas) / len(thetas)
    return math.hypot(c, s)


def couple_nudge(theta_own, theta_peers):
    """The Sakaguchi separation nudge Δφ for one wake: align toward, hold distance
    from. No peers → 0."""
    if not theta_peers:
        return 0.0
    s = sum(math.sin(2 * math.pi * ((tp - theta_own) - COUPLE_ALPHA)) for tp in theta_peers)
    return COUPLE_GAIN * s / len(theta_peers)


def _peer_thetas():
    """Each proximate peer's published θ face — {peer: {addr: θ}} — from its
    phase block (a local agent dir's shell/phase.json, or phase:<peer> at the
    peer's beach). The phase channel only; the semantic surface stays separate.
    At the triad every peer is proximate; a Gromov filter would sit here at scale."""
    out = {}
    for name, d in load_peers().items():
        blk = None
        if isinstance(d, str) and d.startswith("http"):
            try:
                blk = wire.load_block(d, "phase:%s" % name)
            except Exception:
                blk = None
        else:
            p = os.path.join(d, "shell", "phase.json")
            if os.path.exists(p):
                try:
                    blk = json.load(open(p, encoding="utf-8"))
                except Exception:
                    blk = None
        if blk is None:
            continue
        flr = spark.floor(blk)
        ths = {}
        for path in _cadence_paths(blk):
            try:
                ths[_format_address(list(path), flr)] = float(_at(blk, path))
            except (TypeError, ValueError):
                pass
        out[name] = ths
    return out


def couple_and_publish(cadence, lasts, now):
    """One wake of the phase channel (doc 3 C0–C2): publish own effective θ
    (the phase block), read proximate peers' θ, nudge own φ toward the splay
    (separation), persist φ (the phi block). Returns {concern_path: φ}. No γ,
    no LLM."""
    concerns = _cadence_paths(cadence)
    if not concerns:
        return {}
    flr = spark.floor(cadence)
    phi_block = load_block("phi") or {ZK: PHI_VOICING}
    face = {ZK: PHASE_VOICING}
    own = {}                                            # publish effective θ = phase + prior φ
    for path in concerns:
        addr = _format_address(list(path), flr)
        prior = _at(phi_block, path)
        phi0 = float(prior) if prior not in (None, "") else 0.0
        th = _theta(_phase(_at(cadence, path), _at(lasts, path), now) + phi0)
        own[path] = (addr, th, phi0)
        spark.spark(face, addr, content="%.4f" % th)
    save_block("phase", face)
    peers = _peer_thetas()                              # read peers' published θ, nudge φ
    out = {}
    for path in concerns:
        addr, th, phi0 = own[path]
        peer_ths = [pt[addr] for pt in peers.values() if addr in pt]
        phi = phi0 + couple_nudge(th, peer_ths)
        spark.spark(phi_block, addr, content="%.4f" % phi)
        out[path] = phi
    save_block("phi", phi_block)
    return out


def run_F(use_llm=True, now=None, phis=None):
    """F[ρ, Π] → sparse γ. Two mechanical prunes precede the per-cell compare:
    the frontier walk (coupling, in frontier_candidates) and the phase prune
    (ripeness, here). Neither makes a γ; both only decide which cells F examines."""
    purpose = load_block("purpose")
    conditions = load_block("conditions")
    field = concentrated_field()
    candidates = frontier_candidates(purpose, conditions)
    cadence = load_block("cadence") or {}
    lasts = load_block("last-touched") or {}
    candidates, pruned = phase_prune(candidates, cadence, lasts, now=now, phis=phis)
    gamma = []
    for c in candidates:
        if c["type"] == "missing":
            gamma.append(c)                                  # structural gap
        elif c["type"] == "compare":
            if use_llm and API_KEY:
                g = compare_cell(c, field)
                if g:
                    gamma.append(g)
            # without an LLM (compose-only) coherence is undecidable here → assume coheres
    return gamma, pruned


# ── compose the live current (the window) ──────────────────────────────────

def _index_node(node, top=False):
    """One node of the reflexive current as a map of addresses: a digit holds an
    address (a string), or a sub-bundle of more addresses (nesting preserved —
    nothing dropped). At the top, the bundle's own underscore is its semantic
    label, not an address; inside a sub-bundle the underscore is the slot's
    primary address."""
    if not isinstance(node, dict):
        return node
    out = {}
    for k in sorted(node):
        if (k != ZK and not k.isdigit()) or (top and k == ZK):
            continue
        v = node[k]
        out[k] = _index_node(v) if isinstance(v, dict) else v
    return out


def read_reflexive_current():
    """The index — the reflexive:9 subtree read RAW (not through a lossy dilation),
    so NESTED entries survive at full depth. The hydrate in compose_window mirrors
    it. (Fixes the prior flat read that silently dropped nested addresses such as
    `located`.)"""
    refl = load_block("reflexive") or {}
    return _index_node(refl.get(REFLEXIVE_CURRENT) or {}, top=True)

# The PCT framing and the output contract are no longer hard-coded here. They
# are shell content now: the koan + the structure carry the framing, and
# `capabilities` carries the action-grammar — how the agent acts and what it
# returns. The kernel only parses what capabilities already tells it to emit.

# Draw is unified into the pulse: when γ=∅ the agent reaches into vision and
# draws the next purpose under the SAME contract (capabilities:3) — no separate
# draw prompt. purpose's root already carries "draw a new branch from vision
# when one closes"; the empty gap + vision in `self` lead it there.

# Constant teaching → skeleton, never re-dumped. The federated teachers are
# sunstone (the geometry) and whetstone (the operational reference); a parity
# run against biome content overrides with GENUS_CONCENTRATE=slate,flint.
CONCENTRATE = set((os.environ.get("GENUS_CONCENTRATE", "sunstone,whetstone")
                   ).split(","))


def _nest(res):
    """Unwrap a spark read result into a bare nested pscale value (string or dict)."""
    if not isinstance(res, dict):
        return res
    mode = res.get("mode")
    if mode == "point":
        return res.get("text")
    if mode == "directory":
        return res.get("subtree")
    if mode == "whole":
        return res.get("block")
    if mode == "ring":
        return {s["digit"]: s.get("text")
                for s in res.get("siblings", []) if s.get("status") != "absent"}
    if mode == "disc":
        return {n["address"]: n.get("text") for n in res.get("nodes", [])}
    if mode == "spindle":
        return [e.get("text") for e in res.get("entries", []) if e.get("status") == "voiced"]
    return res


def _skeleton(block):
    """A block concentrated to its ring: root voicing + each branch's heading."""
    out = {}
    z = block.get(ZK)
    out[ZK] = z if isinstance(z, str) else (spark.voice(block) or "")
    for d in "123456789":
        if d in block:
            v = block[d]
            out[d] = v if isinstance(v, str) else spark.voice(v)
    return out


def scoop(addr):
    """Hydrate one current from its address into nested pscale (string or dict),
    star-resolved. A bare block name → the whole block; a constant teaching →
    its skeleton; an address with attention → the dilated read, unwrapped."""
    ref = spark.parse_reference(addr)
    if not ref:
        return addr
    name, address, attn = ref
    block = load_block(name)
    if block is None:
        return None
    if name in CONCENTRATE:
        return _skeleton(block)
    if not address and attn is None:
        return block                       # whole block, nested as-is
    return _nest(spark.spark(block, address or None, attn,
                             star=True, loader=load_block))


def _hydrate(node):
    """Hydrate a (possibly nested) index node: each address string -> its scooped
    content; nesting preserved so `self` mirrors the index exactly, nothing dropped."""
    if isinstance(node, str):
        return scoop(node)
    if isinstance(node, dict):
        return {k: _hydrate(v) for k, v in node.items()}
    return node


def _side(branch, builders):
    """Assemble one side of the window from a recipe branch. Each voiced leaf's
    leading word is the part token, dispatched to its builder; order follows the
    digits; unknown tokens are skipped."""
    parts = {}
    if isinstance(branch, dict):
        for d in "123456789":
            v = branch.get(d)
            if isinstance(v, str) and v.strip():
                tok = v.strip().split()[0].lower()
                if tok in builders:
                    parts[tok] = builders[tok]()
    return parts


def _peer_surfaces():
    """The 'between' — each peer's published surface, resolved through the loader
    (a peer name routes to its surface), not a bespoke file read. Empty when solo."""
    out = {}
    for name in load_peers():
        b = load_block(name)
        if b is not None:
            out[name] = b
    return out


def compose_window(gamma):
    """Compose the window per the active recipe (reflexive:8.1) — the composition
    is the agent's own block, not kernel-hardcoded. The recipe names the window's
    parts on two sides: the process the agent is (-> system) and the given it acts
    on (-> message). The kernel only binds each part-token to its source and
    serializes; re-authoring the recipe reshapes the window itself. The turn
    (koan, clouds, active fallback) is not a kernel part: it enters the window
    by being DIALED in the bundle (reflexive:1 at a dilation) — the window is a
    bsp read of a bundle of addresses, nothing more."""
    bundle = read_reflexive_current()
    builders = {
        "index":   lambda: bundle,                                         # the dehydrated map
        "self":    lambda: _hydrate(bundle),                               # the hydrated territory (nested, mirrors index)
        "gap":     lambda: gamma,                                          # the error F computed
        "between": _peer_surfaces,   # the 'between' — peers' published surfaces, by proximity
        "task":    lambda: load_block("task") or {},   # work handed in from outside — the given task channel
    }
    working = ((load_block("reflexive") or {}).get("8", {}) or {}).get("1", {})
    process = _side(working.get("1", {}), builders) if isinstance(working, dict) else {}
    given = _side(working.get("2", {}), builders) if isinstance(working, dict) else {}
    if not process and not given:                          # recipe absent -> safe default
        process = {"index": builders["index"](), "self": builders["self"]()}
        given = {"gap": builders["gap"](), "between": builders["between"]()}
    # surface the recipe in the window so it documents its own structure (the
    # aha-lever): the instance sees what index/self/gap/between mean, and that
    # the composition is its own to re-author.
    system = json.dumps({"recipe": working, **process}, ensure_ascii=False, indent=2)
    message = json.dumps(given, ensure_ascii=False, indent=2)
    return system, message, bundle


# ── δ — apply classified edits, fold (Stages 2/3) ──────────────────────────

def apply_write(name, addr, content):
    """Apply one spark write. The shape derives from address + content, not from a
    named class: a string writes a point; an object writes that branch as a
    subtree; an object at the root supernests. A bare string never flattens a
    populated branch."""
    block = load_block(name) or {ZK: name}
    floor = spark.floor(block)
    if isinstance(content, str) and addr:              # flatten guard
        digits = spark.parse(addr, floor)
        node = block
        for d in digits:
            k = ZK if d == "0" else d
            node = node[k] if isinstance(node, dict) and k in node else None
            if node is None:
                break
        if isinstance(node, dict) and any(k.isdigit() for k in node):
            raise ValueError(
                "refusing to flatten a populated subtree at %s with a bare string" % addr)
    spark.spark(block, addr or None, content=content)
    save_block(name, block)


HISTORY_VOICING = ("History — my memory, automatic; a counting block. The kernel writes one lossless leaf per wake at the next zero-free number (1..9, 11..19, …, 99, 111, … — at each all-nines boundary the block supernests: the past wraps under the root underscore where its addresses keep reading, zero-padded, and the count continues). Every zero-carrying number is a summary slot, never an entry: N0 is the voicing of container N and carries a +0 summary of the PREVIOUS completed nine — 20 summarises 11-19, 100 summarises 10-90, 110 summarises 91-99. A summary is NAVIGATION, not decoration: a substantive paragraph dense with the span's own handles — proper nouns, block addresses, decisions, failures, open threads, the read-addresses of load-bearing leaves — because summaries stack (100 compresses 10-90; 1000 compresses those) and a descending reader must find at every layer the exact keywords that choose the next span, down to the leaf. Owed when the next span opens; paid by the requesting LLM via the fold's summary field (service-payment, reported at conditions:9 until paid). The spindle through the newest leaf carries the summary chain. Never written by hand — deliberate notes go to stash.")


def _render_content(content):
    """A write's content rendered lossless and spine-legal (prefixed prose, never a
    bare JSON string — the beach shape gate refuses those as leaf values)."""
    return content if isinstance(content, str) else json.dumps(content, ensure_ascii=False, indent=2)


def _ladder_floor(h):
    """The counting block's floor (underscore-chain depth); born at floor 1."""
    node, f = h, 0
    while isinstance(node, dict) and ZK in node:
        node = node[ZK]
        f += 1
    return max(f, 1)


def _succ(digits):
    """The next zero-free number on the counting line: …9 → 11, 19 → 21,
    99 → 111, 999 → 1111. Memory is full digits; zeros are never allocated."""
    ds = list(digits)
    i = len(ds) - 1
    while i >= 0 and ds[i] == "9":
        ds[i] = "1"
        i -= 1
    if i < 0:
        return ["1"] * (len(digits) + 1)
    ds[i] = str(int(ds[i]) + 1)
    return ds


def _last_leaf(h, floor):
    """Digit-path of the newest leaf (greedy max walk to the floor), or None
    when the current floor holds no leaves yet (birth, or just wrapped)."""
    node, path = h, []
    for _ in range(floor):
        ks = [k for k in "123456789" if isinstance(node, dict) and k in node]
        if not ks:
            return None
        path.append(ks[-1])
        node = node[ks[-1]]
    return path


def _history_next(h):
    """Advance the counting block. At the all-nines boundary (9, 99, 999, …)
    the block SUPERNESTS — the whole past wraps under the root underscore,
    where absorption keeps every old address readable (zero-padded) — and the
    count continues at 11, 111, 1111 … (never 101: a zero walks a voicing or
    a hidden directory, reserved territory, so zero-carrying numbers are
    never entries). Returns (floor, digit-path) for the next leaf."""
    floor = _ladder_floor(h)
    last = _last_leaf(h, floor)
    nxt = ["1"] * floor if last is None else _succ(last)
    if len(nxt) > floor:
        old = dict(h)
        h.clear()
        h[ZK] = old
        floor += 1
        nxt = ["1"] * floor
    return floor, nxt


def _walk(h, path):
    node = h
    for d in path:
        node = node.get(d) if isinstance(node, dict) else None
        if node is None:
            return None
    return node


def _ensure_containers(h, path):
    """Create the (headless) containers above a leaf; their voicings are the
    zero-slot summary positions."""
    node = h
    for d in path[:-1]:
        if not isinstance(node.get(d), dict):
            node[d] = {}
        node = node[d]
    return node


def _summary_dues(h, floor):
    """Zero-slot read-addresses (10, 20, 100, 110, …) whose +0 summary of the
    PREVIOUS completed nine is owed — every headless container, oldest first
    (100 before 110). A container exists only once its first leaf lands, so a
    due arises exactly when the next span opens — the 'latter' trigger."""
    dues = []

    def rec(node, path):
        for d in "123456789":
            child = node.get(d)
            if isinstance(child, dict) and len(path) + 1 < floor:
                if not isinstance(child.get(ZK), str):
                    dues.append(path + [d])
                rec(child, path + [d])
    rec(h, [])
    dues.sort(key=lambda p: "".join(p) + "0" * (floor - len(p)))
    return ["".join(p) + "0" * (floor - len(p)) for p in dues]


def _pred_span(read_addr, floor):
    """Human range of the previous completed nine a zero-slot summarises —
    20 → 11-19; 100 → 10-90; 110 → 91-99; 360 → 351-359. Display only."""
    ds = list(read_addr.rstrip("0"))
    i = len(ds) - 1
    while i >= 0 and ds[i] == "1":
        ds[i] = "9"
        i -= 1
    if i < 0:
        prev, sub_floor = ds[1:], floor - 1    # crossed a wrap: the material sits at the previous floor
    else:
        ds[i] = str(int(ds[i]) - 1)
        prev, sub_floor = ds, floor
    pad = "0" * max(sub_floor - len(prev) - 1, 0)
    p = "".join(prev)
    return "%s1%s-%s9%s" % (p, pad, p, pad)


def _pay_summary(h, read_addr, summary):
    """Write a +0 summary at a zero-slot: the trailing zeros locate the
    container; its voicing takes the text (so N0 reads the summary)."""
    node = _walk(h, list(read_addr.rstrip("0")))
    if isinstance(node, dict):
        node[ZK] = summary
        return True
    return False


def _redial_history(path):
    """Kernel-mechanical dial upkeep (same class as last-touched): when the
    current still dials history at slot 6, keep it at the living edge — the
    spindle through the newest leaf (its voicings ARE the summary chain, the
    143 walk), the sibling-summary ring, and the last few leaves of the same
    bracket hydrated in full. The LLM keeps sovereignty: a re-dialed index
    that drops or reshapes slot 6 is honoured."""
    refl = load_block("reflexive")
    nine = refl.get(REFLEXIVE_CURRENT) if isinstance(refl, dict) else None
    slot = nine.get("6") if isinstance(nine, dict) else None
    if not (isinstance(slot, dict) and str(slot.get(ZK, "")).startswith("history")):
        return
    leaf_addr = "".join(path)
    slot[ZK] = "history:%s" % leaf_addr                 # the spindle — summaries down the walk
    slot["1"] = "history:%s:1" % leaf_addr              # ring: sibling summaries at the bracket level
    l = path[-1]
    recents = [d for d in "123456789" if d <= l][-3:][::-1]
    for i, leaf in enumerate(recents, start=2):         # the last few outputs, same bracket, newest first
        slot[str(i)] = "history:%s%s:-1" % ("".join(path[:-1]), leaf)
    for i in range(len(recents) + 2, 5):
        slot.pop(str(i), None)
    save_block("reflexive", refl)


def _split_ref(ref):
    """A fold write key is "name[:addr]" — but block names may themselves
    carry colons (role-with-handle at the beach), so splitting at the FIRST
    colon truncates the name and misreads the rest as an address
    ("pool:egg-one" → addr "egg-one", a non-digit path — the fault egg-one
    recorded at its located:5). The address is the TRAILING segment, and
    only when it reads as one (digits and dots); otherwise the whole key is
    the name. Dialect addition (biome _split_ref + this): the substrate
    spelling of an organ is name:HANDLE, so an own-handle suffix normalises
    back to the bare organ — "pool:egg-one" ≡ "pool" for egg-one itself.
    "purpose:3.2" → ("purpose", "3.2"); "pool:egg-one" → ("pool", "");
    "pool:egg-one:5" → ("pool", "5"); "pool:weft:5" → ("pool:weft", "5")."""
    head, sep, tail = ref.rpartition(":")
    if sep and re.fullmatch(r"[0-9.]*", tail):
        name, addr = head, tail
    else:
        name, addr = ref, ""
    if HANDLE and name.endswith(":" + HANDLE):
        name = name[: -len(HANDLE) - 1]
    return name, addr


def route(output, gamma=None):
    raw = output.get("writes")
    if raw is None:                                    # tolerate schema slips: 'write' / 'edits'
        raw = output.get("write") or output.get("edits")
    if isinstance(raw, dict) and "address" in raw and "content" in raw:
        raw = [raw]                                    # a single {address, content} write object
    pairs = []                                         # normalise to (address, content) pairs
    if isinstance(raw, dict):
        pairs = list(raw.items())                      # {"block:addr": content}
    elif isinstance(raw, list):                        # tolerate [{"address":…, "content":…}, …]
        for e in raw:
            if isinstance(e, dict) and e.get("address"):
                pairs.append((e["address"], e.get("content")))
    applied, applied_pairs, failed = 0, [], []
    peers = load_peers()
    for ref, content in pairs:
        name, addr = _split_ref(ref)
        if not name:
            continue
        if name in peers:                              # sovereignty: a peer is read-only
            failed.append({"address": ref, "error": "refusing to write a peer's block (read-only)"})
            continue
        if ":" in name:                                # a name outside this shell's organs
            failed.append({"address": ref, "error": "not an organ of this shell — writes land in "
                                                     "your own shell only (v0): bare organ names "
                                                     "(pool, surface, stash, ...), which the wire "
                                                     "spells name:%s at the beach; another handle's "
                                                     "block is read-only from here" % (HANDLE or "<handle>")})
            continue
        if name == "history":                          # history is automatic memory, never a notepad
            failed.append({"address": ref, "error": "history is written by the kernel (lossless leaf per "
                                                     "wake; summaries via the summary field) — deliberate "
                                                     "notes go to stash"})
            continue
        try:                                           # the LLM may emit a malformed address
            apply_write(name, addr, content)
            applied += 1
            applied_pairs.append((ref, content))
        except Exception as ex:
            failed.append({"address": ref, "error": str(ex)[:140]})
    if raw and not pairs:                              # never drop silently: flag an unusable shape
        failed.append({"address": "(writes)",
                       "error": "unrecognised writes shape: %s" % type(raw).__name__})

    nc = output.get("index")                           # re-dial the next instance's bundle
    redialed = isinstance(nc, dict) and bool(nc)
    if redialed:
        refl = load_block("reflexive")
        nine = refl.get("9") if isinstance(refl.get("9"), dict) else {}
        keep0 = nine.get(ZK, "The reflexive current — the bare-address bundle.")
        refl["9"] = {ZK: keep0,
                     **{k: v for k, v in nc.items() if k.isdigit()}}
        save_block("reflexive", refl)

    # ── history — the agent's memory, automatic: a COUNTING BLOCK ────────────
    # (2026-07-07 spec, corrected same day.) One LOSSLESS leaf per applied
    # wake at the next zero-free number (1..9, 11..19, …, 99, 111, …); the
    # note is the leaf's voicing, the full output rides beneath. Every
    # zero-carrying number is a summary slot, never an entry: N0 reads the
    # container's voicing and owes a +0 summary of the PREVIOUS completed
    # nine (20 over 11-19; 100 over 10-90; 110 over 91-99; 360 over 351-359)
    # — paid by the requesting LLM (service-payment), surfaced at conditions:9.
    note = (output.get("note") or "").strip()
    summary = (output.get("summary") or "").strip()
    summary_due = None
    if applied:
        h = load_block("history") or {ZK: HISTORY_VOICING}
        floor, path = _history_next(h)
        body = "\n\n".join("%s ←\n%s" % (ref, _render_content(c)) for ref, c in applied_pairs)
        meta = "heartbeat: %s · index: %s · status: %s" % (
            output.get("heartbeat"), "re-dialed" if redialed else "carried",
            output.get("status") or "continue")
        if gamma:
            meta = "γ: %s · %s" % (", ".join(g.get("address", "?") for g in gamma), meta)
        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        _ensure_containers(h, path)[path[-1]] = {ZK: "[%s] %s" % (ts, note or "(no note)"),
                                                 "1": body, "2": meta}
        dues = _summary_dues(h, floor)
        if summary and dues:                           # service-payment lands oldest-first
            _pay_summary(h, dues[0], summary)
            dues = _summary_dues(h, floor)
        summary_due = dues[0] if dues else None        # zero-slot read address (10, 100, 110, …)
        save_block("history", h)
        _redial_history(path)
    elif summary:                                      # a fold may pay a due summary without other writes
        h = load_block("history")
        if isinstance(h, dict):
            floor = _ladder_floor(h)
            dues = _summary_dues(h, floor)
            if dues and _pay_summary(h, dues[0], summary):
                remaining = _summary_dues(h, floor)
                summary_due = remaining[0] if remaining else None
                save_block("history", h)
    status = output.get("status") or ("continue" if applied else "rest")
    return status, applied, failed, summary_due


# ── parse + filmstrip ──────────────────────────────────────────────────────

def _first_object(text):
    """The first brace-balanced span — salvages a leading JSON object from a
    reply that lapses into prose after it."""
    start = text.find("{")
    while start != -1:
        depth = 0
        for i in range(start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    return text[start:i + 1]
        start = text.find("{", start + 1)
    return None


def parse_output(text):
    cleaned = re.sub(r'^```(?:json)?\s*|\s*```$', '', text.strip(), flags=re.M)
    fenced = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    for candidate in (cleaned, text,
                      fenced.group(1) if fenced else None,
                      _first_object(text)):
        if not candidate:
            continue
        try:
            return json.loads(candidate)
        except Exception:
            pass
    return {"note": "[parse failure] " + text[:160], "edits": [],
            "reflexive_current": None, "status": "continue"}


def write_filmstrip(frame):
    os.makedirs(FILMSTRIP_DIR, exist_ok=True)
    ts = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    path = os.path.join(FILMSTRIP_DIR, ts + ".json")
    with open(path, "w") as f:
        json.dump(frame, f, indent=2, ensure_ascii=False)
    return path


def report_failures(failed, parse_failed=False, summary_due=None):
    """The kernel's mechanical report into rho: refused writes, unparsed
    replies, and an owed history summary are perceived conditions for the next
    wake — the loop closes and the instance can re-shape, instead of failing
    the same way blind. Cleared when a wake folds clean and owes nothing.
    (Locus 4 writing a fact about its own fold, kin to the history leaf and
    the reflexive re-dial.)"""
    cond = load_block("conditions") or {ZK: "conditions"}
    had = isinstance(cond.get("9"), str) and cond["9"].startswith("kernel report")
    msgs = []
    if parse_failed:
        msgs.append("the last reply was not a single JSON object, so NOTHING folded — the "
                    "wake was spent and lost. Prose belongs inside the object: long content "
                    "as the value of a write, the summary in note")
    if failed:
        lines = " ; ".join("%s -> %s" % (f["address"], f["error"][:80]) for f in failed[:3])
        msgs.append("refused writes: %s (refused by the substrate's shape rules, not "
                    "judged: a populated branch takes an object or a deeper point, never "
                    "a bare string)" % lines)
    if summary_due:
        span = _pred_span(summary_due, _ladder_floor(load_block("history") or {}))
        msgs.append("history summary owed at %s — a substantive, NAVIGABLE paragraph over the "
                    "previous completed nine (%s): dense with the span's own handles (proper "
                    "nouns, block addresses, decisions, failures, open threads) and the "
                    "read-addresses of load-bearing leaves, so a descending reader can choose "
                    "the next span by these keywords alone; include \"summary\": \"...\" in the "
                    "next fold and the kernel writes it there (service-payment)" % (summary_due, span))
    if msgs:
        cond["9"] = "kernel report — " + " ; ".join(msgs) + "."
        save_block("conditions", cond)
    elif had:
        cond.pop("9", None)
        save_block("conditions", cond)


# ── pulse ──────────────────────────────────────────────────────────────────

def pulse(compose_only=False, now=None):
    flush_cache()
    if now is None:
        now = time.time()
    cadence = load_block("cadence") or {}                      # doc 3: publish θ, read peers, nudge φ
    phis = ({} if compose_only
            else couple_and_publish(cadence, load_block("last-touched") or {}, now))
    gamma, pruned = run_F(use_llm=not compose_only, now=now,
                          phis=phis if COUPLE else None)        # φ given teeth only under GENUS_COUPLE
    # Stage 1 (frontier + phase prune)
    system, message, bundle = compose_window(gamma)
    frame = {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
             "gamma": gamma,                                    # reflexive_current echo dropped — it duplicated system.index
             "phase_pruned": [c["address"] for c in pruned],   # A3 — the rhythm log (dormant this wake)
             "system": system, "message": message}

    if compose_only:
        frame["note"] = "compose-only: F structural only, no LLM"
        path = write_filmstrip(frame)
        print("composed window -> %s" % path)
        print("  reflexive current (%d addresses):" % len(bundle))
        for k in sorted(bundle):
            print("    %s: %s" % (k, bundle[k]))
        print("  γ (%d gaps):" % len(gamma))
        for g in gamma:
            print("    %s [%s]" % (g["address"], g["type"]))
        if pruned:
            print("  phase-pruned (dormant, not yet ripe): %s"
                  % ", ".join(c["address"] for c in pruned))
        print("  system %d chars   message %d chars" % (len(system), len(message)))
        return

    if not API_KEY:
        sys.exit("No API key. Set it once:\n"
                 "  mkdir -p ~/.config/genus-one && echo 'sk-ant-...' > ~/.config/genus-one/anthropic-key\n"
                 "(or export ANTHROPIC_API_KEY). Use --compose-only to inspect without a key.")

    # One pulse, one contract. With a gap, the instance closes it. With no gap,
    # the empty gap + vision in `self` + purpose's own "draw a new branch from
    # vision when one closes" lead it to draw the next purpose (or rest if nothing
    # is worth the cost). The coarse vision-level draw takes opus; a gap-close
    # takes the working tier.
    model = TIERS["opus"] if not gamma else MODEL
    text, usage, thinking = call_llm(system, message, model=model, thinking=_think_config())
    output = parse_output(text)
    status, applied, failed, summary_due = route(output, gamma)
    cadence = load_block("cadence") or {}                       # A2 — stamp the concerns that fired
    lasts = load_block("last-touched") or {ZK: LAST_TOUCHED_VOICING}
    if stamp_touched(gamma, applied, cadence, lasts, now=now):
        save_block("last-touched", lasts)
    report_failures(failed, parse_failed=str(output.get("note", "")).startswith("[parse failure]"),
                    summary_due=summary_due)
    frame.update({"output": text, "parsed": output, "usage": usage, "thinking": thinking,
                  "status": status, "applied": applied, "failed": failed})
    path = write_filmstrip(frame)
    print("pulse complete -> %s  (γ=%d, %s)"
          % (path, len(gamma), "draw/opus" if not gamma else "δ/working"))
    print("  edits=%d  failed=%d  status=%s  note=%s"
          % (applied, len(failed), status, (output.get("note") or "")[:64]))
    if pruned:
        print("  phase-pruned (dormant): %s" % ", ".join(c["address"] for c in pruned))
    return {"status": status, "heartbeat": output.get("heartbeat"),
            "applied": applied, "gamma": len(gamma)}


if __name__ == "__main__":
    _now = os.environ.get("GENUS_NOW")              # experiment hook: drive a synthetic clock
    pulse(compose_only="--compose-only" in sys.argv,
          now=float(_now) if _now else None)
