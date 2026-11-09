"""The flow: every window each cell read, call by call, as a document the page at happyseaurchin.com/mindflow/flow/ draws.

Reads runs/<id>/walk.jsonl and calls.jsonl — every call the door logged, with the system blocks and the
window exactly as sent and the reply exactly as it came back — and writes runs/<id>/flow.json, a flow
document (flow: 1): one row per cell for its run-up walk and one for its loops; a window column per call,
its height the measured prompt tokens; a reply column after it; the spans the window was composed of,
each carrying its whole text, which the page's peek shows on a click. Nothing is added to a call to get
this: the door already logs the window as sent, and this only cuts it where the cell reads a heading.

A loop window, as the cell reads it: the cached head — the run-up (the spindle it walked on the injector
block), the table (the rules), the shell (purpose:<shell>, or shell:<shell> at pscale 0 when there is no
purpose, read once from the beach) — then the fresh tail: the ledger as this cell sees it, the other
cells' latest lines, the talk, the now with the floor and the ask. A walk window: the table and the shell,
"Reply as asked.", then the root, the route so far, the rung with its options, the hinge, the ask.

    python3 flow.py runs/<id>        writes runs/<id>/flow.json and says how big it is

The host writes it as a run goes (every few seconds, when a call landed) and again at the end, and serves it
at /flow.json; a past run's stands at /runs/<id>/flow.json. The talk's words are in these windows: the
document stays beside the run on the machine that heard them unless its keeper publishes it.
"""
import json, os, re, sys

from door import parse_json

LOOP = [("THE LEDGER", "given:ledger", "the ledger", "3.3"),
        ("THE OTHER CELLS'", "given:others", "the other cells' latest lines", "5.4"),
        ("THE TALK", "given:talk", "the talk", "4"),
        ("now · ", "given:now", "now, the floor and the ask", "4.5")]
WALK = [("THE ROOT", "given:root", "the root, the aim the walk stands under", "3.1"),
        ("THE ROUTE SO FAR", "given:route", "the route so far", "3.2"),
        ("THE RUNG NOW", "given:rung", "the rung and its options", "6.1"),
        ("THE HINGE", "given:hinge", "the hinge", "6.4"),
        ("Reply with only", "given:ask", "the ask", "6.1")]


def jsonl(path):
    if not os.path.exists(path):
        return []
    out = []
    for l in open(path):
        if l.strip():
            try:
                out.append(json.loads(l))
            except Exception:
                pass    # a line caught mid-write is read next time
    return out


def span(key, label, rung, text, cls, side):
    return dict(key=key, label=label, ref=key.split(":", 1)[1], rung=rung, cls=cls, side=side, chars=len(text), text=text)


def cut(text, marks, cls, side):
    """The text in spans, each from one heading at a line's start to the next heading."""
    at = []
    for h, key, label, rung in marks:
        m = re.search(r"(?m)^" + re.escape(h), text)
        if m:
            at.append((m.start(), key, label, rung))
    at.sort()
    out = []
    for n, (i, key, label, rung) in enumerate(at):
        j = at[n + 1][0] if n + 1 < len(at) else len(text)
        out.append(span(key, label, rung, text[i:j].strip("\n"), cls, side))
    if not at and text.strip():
        out.append(span(f"{side}:all", "the message, whole", None, text, cls, side))
    return out


def shell_label(text):
    first = text.splitlines()[0] if text else ""
    m = re.match(r"^THE SHELL — (shell:\S+?)(?: (\d))?[:,;]\s*(.*)$", first)
    if m:
        name, slot, rest = m.groups()
        refs = re.search(r"— (\d+) references? compiled", text)
        if "[bundle @" in text and refs:
            return f"the shell — {name} {slot}, its bundle of {refs.group(1)} references compiled as the door compiles it"
        return f"the shell — {name}{' ' + slot if slot else ''}: {rest.strip().rstrip(':')}"[:170]
    n = len(re.findall(r"(?m)^\[", text))
    m = re.search(r"\((purpose:[^\s)]+) is not there.*?; (shell:[^\s)]+) at pscale 0", first)
    if m:
        return f"the shell — {m.group(2)} at pscale 0, {n} entries, because {m.group(1)} is not on the beach"
    m = re.search(r"\((purpose:[^\s)]+)\):", first)
    if m:
        return f"the shell's purpose — {m.group(1)} at pscale 0, {n} entries"
    return "the shell — nothing could be read from the beach"


def head(system, walk, block):
    """The system blocks as spans: the run-up (when the arm gave one), the table, the shell, and the walk's one line."""
    blocks = [b for b in (system or []) if isinstance(b, str)]
    if not blocks:
        return []
    frame = blocks[0] if walk else blocks[-1]
    rest = blocks[1:] if walk else blocks[:-1]
    spans = []
    i = frame.find("\nTHE SHELL")
    table, shell = (frame[:i], frame[i + 1:]) if i >= 0 else (frame, "")
    for b in rest:
        if b.startswith("THE RUN-UP"):
            rungs = len(re.findall(r"(?m)^  rung \d+", b))
            spans.append(span("sys:run-up", f"the run-up — the spindle walked on {block}, {rungs} rungs, each a choice with its hinge", "3.1", b, "current", "system"))
        elif b.strip() == "Reply as asked.":
            spans.append(span("sys:asked", "“Reply as asked.”", "7", b, "current", "system"))
        else:
            spans.append(span("sys:other", "a system block", None, b, "current", "system"))
    spans.append(span("sys:table", "the table — the rules of the table, the same text every call", "2", table.strip("\n"), "current", "system"))
    if shell:
        spans.append(span("sys:shell", shell_label(shell), "1", shell.strip("\n"), "current", "system"))
    if walk:
        for b in rest:
            if b.strip() == "Reply as asked.":
                spans.append(spans.pop(next(i for i, s in enumerate(spans) if s["key"] == "sys:asked")))   # the line stands after the frame, as sent
                break
    return spans


def name_tail(spans):
    """The tail's labels say what they hold: how many thoughts, lines, words, from whom."""
    for s in spans:
        t = s["text"]
        if s["key"] == "given:ledger":
            n = len(re.findall(r"(?m)^  \[h\d+\]", t))
            s["label"] = f"the ledger — {n} held thoughts in view" if n else "the ledger — nothing held yet"
        elif s["key"] == "given:others":
            n = len(re.findall(r"(?m)^  \d+ s ago", t))
            s["label"] = f"the other cells' latest lines — {n}" if n else "the other cells' latest lines — none yet"
        elif s["key"] == "given:talk":
            said = re.findall(r"(?m)^  \d+\.\d ([^:]+): (.*)$", t)
            words = sum(len(w.split()) for _, w in said)
            who = sorted(set(k for k, _ in said))
            s["label"] = f"the talk — {words} words from {', '.join(who) if len(who) <= 6 else str(len(who)) + ' speaker labels'}" if said else "the talk — no words yet"
        elif s["key"] == "given:now":
            s["label"] = t.splitlines()[0][:80] if t else s["label"]
        elif s["key"] == "given:rung":
            n = len(re.findall(r"(?m)^  \[", t))
            s["label"] = f"the rung and its {n} options"
    return spans


def fit(spans, total):
    est = sum(s["chars"] / 4 for s in spans) or 1
    for s in spans:
        s["tokens"] = max(1, round(s["chars"] / 4 * (total / est))) if total else max(1, round(s["chars"] / 4))
    return spans


def moments(calls, kind, block):
    out, prev = [], {}
    for k, c in enumerate(calls):
        spans = head(c.get("system"), kind == "walk", block) + name_tail(cut(c.get("window") or "", WALK if kind == "walk" else LOOP, "given", "message"))
        u = c.get("usage") or {}
        total = (u.get("in") or 0) + (u.get("write") or 0) + (u.get("read") or 0)
        fit(spans, total)
        for s in spans:
            p = prev.get(s["key"])
            if p is None:
                if k:
                    s["new"] = True
            elif p != s["text"]:
                s["changed"] = True
        prev = {s["key"]: s["text"] for s in spans}
        label = f"rung {c.get('rung')} [{c.get('addr')}]" if kind == "walk" else f"loop {c.get('loop', k)} · landing {c.get('landing', '?')} · {c.get('t', '?')} s"
        out.append(dict(id=f"w{k}", label=label, kind="window", tokens=total or sum(s["tokens"] for s in spans), measured=bool(total), ts=c.get("at"), spans=spans))
        reply = c.get("reply") or ""
        obj, _ = parse_json(reply) if reply else (None, None)
        obj = obj if isinstance(obj, dict) else None
        if kind == "walk":
            lab = f"the choice — {obj.get('choice')}" if obj else ("refused" if c.get("stop") == "refusal" else "no choice came back")
            feeds = ["given:route"] if obj else []
        elif obj:
            lab = f"the line — {str(obj.get('act', 'hold')).lower()}" + (" · safety" if obj.get("safety") is True else "")
            feeds = ["given:ledger"]
        else:
            lab, feeds = ("the reply — not a line" if reply else f"no reply — {c.get('error') or c.get('stop')}"), []
        foot = f"\n\n[{c.get('model')} · {c.get('stop')} · {c.get('ms')} ms · ${(c.get('usd') or 0):.5f}" + (f" · {c['stop_details']}" if c.get("stop_details") else "") + "]"
        o = dict(key="out", label=lab, cls="output", rung=None, chars=len(reply), tokens=max(1, (u.get("out") or round(len(reply) / 4))), text=reply + foot, feeds=feeds)
        out.append(dict(id=f"o{k}", label=f"reply {k + 1}", kind="output", tokens=o["tokens"], measured=bool(u.get("out")), reads="all", spans=[o], model=c.get("model")))
    return out


def build(run_dir):
    s = json.load(open(os.path.join(run_dir, "settings.json"))) if os.path.exists(os.path.join(run_dir, "settings.json")) else {}
    rec = json.load(open(os.path.join(run_dir, "record.json"))) if os.path.exists(os.path.join(run_dir, "record.json")) else {}
    walk, loop = jsonl(os.path.join(run_dir, "walk.jsonl")), jsonl(os.path.join(run_dir, "calls.jsonl"))
    order = []
    for c in walk + loop:
        if c.get("cell") and c["cell"] not in order:
            order.append(c["cell"])
    inj = s.get("injector") or {}
    rows = []
    for cid in order:
        w = [c for c in walk if c.get("cell") == cid]
        l = [c for c in loop if c.get("cell") == cid]
        sp = os.path.join(run_dir, "spindles", f"{cid}.json")
        block = (json.load(open(sp)).get("block") if os.path.exists(sp) else None) or inj.get("block") or "the injector block"
        tier, effort = (w or l)[0].get("tier"), (w or l)[0].get("effort")
        arm, layer = (s.get("arms") or {}).get(cid, inj.get("arm")), (s.get("cell_layers") or {}).get(cid)
        minp = (s.get("layers") or {}).get(layer, 0) if layer else 0
        if w:
            usd = sum(c.get("usd") or 0 for c in w)
            rows.append(dict(label=f"{cid} · the run-up walk on {block} — {len(w)} rungs, one call each, before a word was heard",
                             notes=[f"{tier} at {effort} effort · arm {arm} · ${usd:.4f} · the head is the table and the shell, then “Reply as asked.”; the message is the root, the route so far, the rung with its options and the hinge; the reply is the choice alone, and the route grows by it."],
                             moments=moments(w, "walk", block)))
        if l:
            usd = sum(c.get("usd") or 0 for c in l)
            u = {k: sum((c.get("usage") or {}).get(k) or 0 for c in l) for k in ("in", "write", "read", "out")}
            tot = u["in"] + u["write"] + u["read"]
            rel = sum(1 for c in l if '"release"' in (c.get("reply") or ""))
            first = moments(l[:1], "loop", block)[0]["spans"] if l else []
            by = {x["key"]: x for x in first}
            tails = [sum(x["chars"] for x in m["spans"] if x["side"] == "message") for m in moments(l, "loop", block) if m["kind"] == "window"]
            notes = [f"{tier} at {effort} effort · layer {layer or '?'}, minimum period {minp:g} s · arm {arm} · {len(l)} loops, {rel} releases · ${usd:.4f} · cache read share {u['read'] / tot:.2f}" if tot else f"{tier} at {effort} effort · {len(l)} loops",
                     "the cached head, byte-identical every loop: " + ", ".join(f"{by[k]['label'].split(' — ')[0]} {by[k]['chars']:,} chars" for k in ("sys:run-up", "sys:table", "sys:shell") if k in by)
                     + (f"; the fresh tail {min(tails):,} to {max(tails):,} chars a loop" if tails else "")]
            if "sys:shell" in by:
                notes.append("what stood in the shell slot: " + by["sys:shell"]["label"].split(" — ", 1)[-1])
            rows.append(dict(label=f"{cid} · {len(l)} loops at the {layer or '?'} layer — the window as the cell read it, call by call", notes=notes, moments=moments(l, "loop", block)))
    if rows:    # the document's own notes ride the first row, since the page shows a row's notes under its header
        rows[0]["notes"] = doc_notes(s, rec, inj) + rows[0]["notes"]
    cells = s.get("cells")
    title = f"verso · {os.path.basename(os.path.abspath(run_dir))} · {cells if isinstance(cells, str) else len(order)} cells on {rec.get('transcript') or 'live'}"
    return dict(flow=1, kind="verso", title=title,
                meta=dict(source="verso/cells: the door's log of every call, the window as sent (runs/<id>/walk.jsonl and calls.jsonl)", notes=doc_notes(s, rec, inj)),
                rows=rows)


def doc_notes(s, rec, inj):
    return (["Each window is the call as the door sent it: the system blocks, which are the cached head (the run-up the cell walked, then the table and the shell), and the one user message, the fresh tail (the ledger as this cell sees it, the other cells' latest lines, the talk, the now with the floor and the ask). Column heights are the measured prompt tokens, input, cache creation and cache read together; a span's share of the column is by characters. Click a span for its whole text.",
             "The talk's words stand in these windows. The document is written beside the run on the machine that heard them and served by that machine's host alone; to publish it is its keeper's act.",
             " · ".join(f"{k} {s[k]}" for k in ("mode", "threshold", "window", "cells", "shell", "line_words", "talk_seconds", "attention", "half_life", "stop_usd") if k in s)
             + (f" · injector {inj.get('block')} ({inj.get('source')}), arm {inj.get('arm')}" if inj else "")]
            + ([f"the run: {rec.get('talk_seconds')} s of talk, {rec.get('landings')} landings, {rec.get('words')} words; thoughts " + ", ".join(f"{k} {v}" for k, v in (rec.get('counts') or {}).items()) + f"; ${(rec.get('spend') or {}).get('total', 0):.4f}"] if rec else []))


def write(run_dir):
    doc = build(run_dir)
    path = os.path.join(run_dir, "flow.json")
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(doc, f)
    os.replace(tmp, path)       # the page may be fetching it this moment; it never sees a half-written one
    return path, doc


_sizes = {}


def write_if_grown(run_dir):
    """Write the document when a call has landed since the last write; cheap when nothing has."""
    sig = tuple(os.path.getsize(p) if os.path.exists(p) else 0 for p in (os.path.join(run_dir, "walk.jsonl"), os.path.join(run_dir, "calls.jsonl")))
    if _sizes.get(run_dir) == sig:
        return None
    _sizes[run_dir] = sig
    return write(run_dir)[0]


if __name__ == "__main__":
    d = sys.argv[1] if len(sys.argv) > 1 else "."
    path, doc = write(d)
    print(f"{path}: {len(doc['rows'])} rows, {sum(1 for r in doc['rows'] for m in r['moments'] if m['kind'] == 'window')} windows, {os.path.getsize(path) / 1e6:.1f} MB")
