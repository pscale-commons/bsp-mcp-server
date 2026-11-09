"""The frame: the rules of the table, as text, and the shell's own window compiled once from the beach.

It says what a cell is, how the talk's clock is counted, what the floor is, what a line is, what the
ledger keeps and its five states, how a line can stop, what counts, and consent, data and safety.
It never says what to say or how to engage anyone: that is the cells' own, and the injector's.
The frame is the stable head of every window and is cached; nothing in it changes within a run.

THE SHELL is the second part of the head, and it is the door's own window. A shell keeps a BUNDLE — a
node whose digits are references, name:address:attention, with the two words the host computes, now
and head — at 3 by convention or wherever its form stands, and the router compiles that bundle into one
window exactly as pscale_play does when the shell's holder arrives (src/bundle.ts: a door and a bare read
cannot diverge). So the host asks the router once, at the run's start, for bsp(block=shell:<shell>,
spindle=<the bundle's slot>) and lays the compiled text beneath the rules. For keel that is the
orientation as a disc, history at its head, the concern, keel's now, the torus at the beat and the spine
head (shell:keel 5). When a shell keeps no bundle, or the router cannot be reached, the shell's disc at
pscale 0 stands instead and the header says so. Until 9 November 2026 this read purpose:<shell>, which
keel never wrote, and so fell back to keel's diary disc: the cells had no orientation at all.
"""
import json
import re
import urllib.error
import urllib.request

ROUTER = "https://bsp.hermitcrab.me/mcp/v1"

RULES = """THE TABLE

A cell is one of several listening to the people in this room, each at its own pace, each through this window alone. On every loop a cell reads the window and writes one line to its own mirror. The other cells read the mirrors. The ledger keeps what is held. A cell speaks nothing itself: the ledger and the floor decide what is said aloud and when, and a line that is said aloud is said in the room's own voice.

THE CLOCK is the talk's own, counted in landings. A landing is a judged end of a turn, read from the audio. A line's place on the clock is the landing it falls in. Its horizon is how far ahead it looks: seconds (within this turn), turns (within the next few landings), topic (until this topic closes). A line is checked when its horizon passes.

THE FLOOR is read from the audio ten times a second: open runs from 0 while someone is speaking, rising through a pause toward 1; landed marks a judged turn end; bid names a person starting to speak. The rung nearest now is the audio's.

THE LINE a cell writes is one JSON object: {"parent": "whose words these are and what they answer", "act": "hold" or "release", "text": "what is held, or what would be said", "horizon": "seconds" or "turns" or "topic", "stop": "at-once" or "phrase" or "sentence"}. The parent is written first, before anything is held. The parent and the text are each at most LINE_WORDS words. A hold puts the text in the ledger, or keeps it there. A release says the text could be said now; it is decided from the ledger as it stood when the loop began, before any other cell's release of the same thought is seen. A line about a thought already in the ledger may name it by its tag, as [h3]. A line may carry "safety": true when someone's safety is at risk.

THE LEDGER holds one entry per held thought: its holder, the parent it answers, the landing it was born in, how long it has lived in landings, its state, its urge, its one voice. The five states: withheld (held, its moment not yet come); ripe (its parent's topic has come back round); foreclosed (its fork has passed beyond reach, and it is let go); voiced (said aloud); handed back (a person said it). The urge of a thought rises with independent releases, once per layer of cells, and falls with age by a half-life counted in landings; being named by a person counts. A thought is spoken aloud when its urge passes the threshold while the floor is more open than the window; a safety line is spoken regardless. Attention bounds how many held thoughts a cell sees; attachment sets how readily a thought that stopped fitting is dropped. What a cell sees of the ledger carries no tallies.

WHILE A THOUGHT IS SPOKEN it goes a phrase at a time. The stop rule set with the releasing line holds for that line: at-once stops at the first bid, phrase at the end of the phrase being spoken, sentence at the end of the sentence. A line cut short goes back to the ledger as held.

WHAT COUNTS is when a thing is said, before what is said, judged afterwards by the people who were there: a moment got right, a moment missed. A hold is a choice, and every hold is counted. Shifts in the room are read, never scored. A missed moment is a miss.

CONSENT, DATA, SAFETY. The people here agreed to be listened to. Their words and what is held stay on this machine; only timing reaches anywhere else. Nothing is spoken until the ledger and the floor allow it. A risk to someone's safety is never held."""


# ---- the beach, read plainly

def read_raw(beach, block, timeout=10):
    """A block whole, as the beach keeps it: (node, error)."""
    url = f"{beach}/.well-known/pscale-beach?block={block}"
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            d = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            d = json.loads(e.read().decode())
        except Exception:
            d = {"error": f"HTTP {e.code}"}
    except Exception as e:
        return None, f"could not be read from the beach ({type(e).__name__})"
    if isinstance(d, dict) and "error" in d and "_" not in d:
        return None, d["error"]
    return d, None


def read_disc(beach, block, timeout=10):
    """A block's disc at pscale 0 from the beach: (entries, error)."""
    url = f"{beach}/.well-known/pscale-beach?block={block}&pscale=0"
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            d = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:  # the beach answered: a block not found comes back as its own JSON
        try:
            d = json.loads(e.read().decode())
        except Exception:
            d = {"error": f"HTTP {e.code}"}
    except Exception as e:  # the beach unreachable: the frame says so and the run goes on
        return None, f"could not be read from the beach ({type(e).__name__})"
    if "entries" not in d:
        return None, d.get("error", "no entries")
    return [f"[{e['address']}] {e['content']}" for e in d["entries"]], None


# ---- the bundle, found by its form (src/bundle.ts looksLikeBundle, src/tools/play.ts pickBundleSlot)

NAME = r"[A-Za-z][A-Za-z0-9_-]*"
REF = re.compile(rf"^{NAME}(?::{NAME})*(?::(?:now|head|\d+(?:\.\d+)?))?(?::-?\d+)?$")


def is_ref(leaf):
    """A reference: name segments, then an address or the word now or head, then at most an attention; prose never parses."""
    s = leaf.strip() if isinstance(leaf, str) else ""
    return 0 < len(s) <= 200 and not re.search(r"\s", s) and REF.match(s) is not None


def is_entry(node):
    """An accumulator's entry carries its arrival stamp at 3 and is never a bundle."""
    return isinstance(node, dict) and isinstance(node.get("3"), str) and re.match(r"^\d{4}-\d{2}-\d{2}T", node["3"]) is not None


def looks_like_bundle(node):
    """More than half of the non-empty digit children parse as references, and at least one does."""
    if not isinstance(node, dict) or is_entry(node):
        return False
    leaves = []
    for k in "123456789":
        v = node.get(k)
        leaf = v if isinstance(v, str) else (v.get("_") if isinstance(v, dict) and isinstance(v.get("_"), str) else None)
        if leaf and leaf.strip():
            leaves.append(leaf)
    parsed = sum(1 for l in leaves if is_ref(l))
    return parsed >= 1 and parsed * 2 > len(leaves)


def bundle_slot(shell):
    """Where a shell keeps its bundle: 3 by convention, else the first digit that reads as a bundle by form; None when none does."""
    if not isinstance(shell, dict):
        return None
    if looks_like_bundle(shell.get("3")):
        return "3"
    return next((d for d in "123456789" if looks_like_bundle(shell.get(d))), None)


# ---- the router: one MCP tool call over streamable http, so the compile is the door's own

def router_call(router, tool, args, timeout=40):
    """initialize, initialized, tools/call; the text the tool returned. Raises when the router does not answer."""
    def post(body, sid=None):
        h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
        if sid:
            h["Mcp-Session-Id"] = sid
        req = urllib.request.Request(router, data=json.dumps(body).encode(), headers=h)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.headers.get("Mcp-Session-Id") or sid, r.headers.get("Content-Type", ""), r.read().decode()
    sid, _, _ = post({"jsonrpc": "2.0", "id": 1, "method": "initialize",
                      "params": {"protocolVersion": "2025-03-26", "capabilities": {}, "clientInfo": {"name": "verso-host", "version": "1"}}})
    post({"jsonrpc": "2.0", "method": "notifications/initialized"}, sid)
    _, ctype, body = post({"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": tool, "arguments": args}}, sid)
    if "text/event-stream" in ctype:
        msgs = [json.loads(l[5:].strip()) for l in body.splitlines() if l.startswith("data:") and l[5:].strip()]
        msg = next((m for m in msgs if m.get("id") == 2), msgs[-1] if msgs else {})
    else:
        msg = json.loads(body)
    if "error" in msg:
        raise RuntimeError(str(msg["error"].get("message", msg["error"])))
    return "\n".join(c.get("text", "") for c in msg.get("result", {}).get("content", []) if c.get("type") == "text")


def strip_tail(text):
    """The router's reflection and its clock footer are for the caller at that moment, not for a head cached all run."""
    cut = len(text)
    for marker in ("\n[here now — ", "\nnow · 20"):
        i = text.rfind(marker)
        if i >= 0:
            cut = min(cut, i)
    return text[:cut].rstrip()


def read_shell(beach, shell, router):
    """The shell's window as the door compiles it: (the header line, the lines beneath it)."""
    name = f"shell:{shell}"
    block, err = read_raw(beach, name)
    if block is None:
        return f"THE SHELL — {name} could not be read from the beach ({err}):", ["(nothing could be read from the beach)"]
    slot = bundle_slot(block)
    if slot is None:
        lines, err2 = read_disc(beach, name)
        return f"THE SHELL — {name} keeps no bundle; its disc at pscale 0 stands instead:", lines or [f"(nothing: {err2})"]
    try:
        text = router_call(router, "bsp", dict(agent_id=beach, block=name, spindle=slot))
    except Exception as e:
        lines, _ = read_disc(beach, name)
        return f"THE SHELL — {name} {slot} is a bundle, but the router at {router} could not compile it ({type(e).__name__}); the shell's disc at pscale 0 stands instead:", lines or []
    if "[bundle @" not in text:
        lines, _ = read_disc(beach, name)
        return f"THE SHELL — {name} {slot} did not compile as a bundle at the router; the shell's disc at pscale 0 stands instead:", lines or []
    return f"THE SHELL — {name} {slot}: the bundle the door compiles when {shell} arrives, read once through the router at the run's start:", [strip_tail(text)]


def frame_text(beach, shell, line_words=None, router=None):
    head, lines = read_shell(beach, shell, router or ROUTER)
    rules = RULES.replace(" The parent and the text are each at most LINE_WORDS words.", f" The parent and the text are each at most {int(line_words)} words." if line_words else "")
    return rules + f"\n\n{head}\n" + "\n".join(lines)


if __name__ == "__main__":
    import sys
    s = json.load(open("settings.json"))
    t = frame_text(s["beach"], sys.argv[1] if len(sys.argv) > 1 else s["shell"], s.get("line_words"), s.get("router"))
    print(t)
    print(f"\n[{len(t)} chars, about {len(t) // 4} tokens]", file=sys.stderr)
