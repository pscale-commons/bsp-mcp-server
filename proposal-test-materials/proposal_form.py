#!/usr/bin/env python3
"""proposal_form.py: is a proposal well formed?  weft, 2 November 2026, at David's word
('go ahead with battery for proposal-test'), lane mistake-proofing.1.

The mechanical pass of the proposal battery (sentinel proposal-test). It reads one family by
public GET, or a fixture's state, against function:proposal and against the way the pages read
it, so what it reports is what a reader would lose. A proposal is combined, so the battery is:
five smaller batteries, each able to run alone, and together the whole pass.

  family     the spine and law stand, their positions, the list   (function:proposal 1, 2, 7, 8)
  decisions  each decision reads as its maker wrote it, each answer as an answer       (3)
  room       the welcome and its link, the entries, the spans folded beneath it        (1, 7)
  threads    the law's 5 names what stands; registry threads through thread_form.py    (5)
  page       the phase, the crafted page answering, its wiring, the look, the map pin  (4, 6)

  proposal_form.py live <name> [--beach <origin>] [--only a,b] [--no-net] [--json]
  proposal_form.py live --all [--beach <origin>] [--only a,b] [--no-net] [--json]
  proposal_form.py state <file.json> [--only a,b] [--json]

Levels, as thread_form.py has them: FAULT breaks the form or loses a reader something; WARN
weakens it; NOTE is a reading, not a judgment. A family with no FAULT is well formed; the exit
is 1 on any FAULT. It reads and never writes. It runs alone with nothing but Python: beside its
siblings in the repo it also runs compound-form.py over the family and thread_form.py over each
registry thread, and away from them it says it could not.
"""
import importlib.util, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

BEACH = "https://beach.happyseaurchin.com"
SITE = "https://happyseaurchin.com"
UA = "proposal-test (bsp-mcp-server)"
HERE = os.path.dirname(os.path.abspath(__file__))
DIGITS = "123456789"
BATTERIES = ("family", "decisions", "room", "threads", "page")
MAX_STEPS = 12       # proposal.html stepsOf stops here
QUESTION_MAX = 300   # 'a tap and a line' (function:proposal 3)

# The lines the port below follows, as they stand in the pages. A live pass looks for each one
# and says so if it has moved, so the battery cannot quietly drift from what a reader meets.
READERS = {
    "proposal.html": [
        """var TOK = "[A-Z][A-Z’']*(?: [A-Z][A-Z’']*)*";""",
        """if (!L.page && (m = /\\bpage:\\s*(https?:\\/\\/\\S+)/i.exec(p[1]))) L.page = m[1].replace(/[.,;)]+$/, '');""",
        """if (!L.phase && (m = /^phase:\\s*(proposal|project|complete|set aside)\\b/i.exec(p[1]))) L.phase = m[1].toLowerCase();""",
        """while (node != null && out.length < 12) {""",
        """var m = new RegExp('^(' + words + ')\\\\b\\\\s*[—–:,-]?\\\\s*([\\\\s\\\\S]*)$', 'i').exec(String(t || '').trim());""",
    ],
    "threads.js": [
        """var m = /^\\s*(thread:\\d+|[a-z0-9][a-z0-9-]*)\\s*(?:[—–]\\s*([\\s\\S]*))?$/i.exec(String(t || ''));""",
    ],
}


# ── what the battery reads: a beach by public GET, or a fixture ──────────

class Surface:
    def __init__(self, beach=BEACH, net=True):
        self.beach, self.net, self.blocks, self.pages, self._names = beach.rstrip("/"), net, {}, {}, None

    def _read(self, query):
        url = f"{self.beach}/.well-known/pscale-beach{query}"
        req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": UA})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=40) as r:
                    return json.load(r)
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    return None
                if attempt == 2:
                    raise
            except (urllib.error.URLError, TimeoutError):
                if attempt == 2:
                    raise
            time.sleep(1 + attempt)

    def get(self, name):
        if name not in self.blocks:
            body = self._read("?block=" + urllib.parse.quote(name, safe=""))
            self.blocks[name] = None if isinstance(body, dict) and body.get("code") == "not_found" else body
        return self.blocks[name]

    def names(self):
        if self._names is None:
            ix = self._read("") or {}
            self._names = [x if isinstance(x, str) else x.get("name", "") for x in ix.get("ix", ix).get("blocks", [])]
        return self._names

    def walks(self, name, address):
        """Whether an address walks to anything, by the beach's own walker."""
        body = self._read(f"?block={urllib.parse.quote(name, safe='')}&spindle={urllib.parse.quote(address)}")
        return body is not None and not (isinstance(body, dict) and body.get("code"))

    def fetch(self, url):
        """A page: (status, text), or (None, '') where it could not be asked."""
        if not self.net:
            return None, ""
        if url not in self.pages:
            self.pages[url] = self._follow(url)
        return self.pages[url]

    def _follow(self, url):
        """Redirects are followed by hand, since not every Python follows the site's 308s."""
        for _ in range(6):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=30) as r:
                    return r.status, r.read().decode("utf8", "ignore")
            except urllib.error.HTTPError as e:
                if e.code not in (301, 302, 303, 307, 308) or not e.headers.get("Location"):
                    return e.code, ""
                url = urllib.parse.urljoin(url, e.headers["Location"])
            except (urllib.error.URLError, TimeoutError):
                return None, ""
        return None, ""


class State(Surface):
    """A fixture: {name, blocks: {<block>: ...}, pages: {<url>: status | html | {file}}}."""

    def __init__(self, state, base=HERE):
        self.state, self.base, self.net = state, base, True
        self.blocks, self.page_map, self._names = state.get("blocks", {}), state.get("pages", {}), None
        self.beach = "fixture"

    def get(self, name):
        return self.blocks.get(name)

    def names(self):
        return sorted(self.blocks)

    def walks(self, name, address):
        return walk(self.blocks.get(name), address) is not None

    def fetch(self, url):
        v = self.page_map.get(url)
        if v is None:
            return 404, ""
        if isinstance(v, int):
            return v, ""
        if isinstance(v, dict):
            with open(os.path.join(self.base, v["file"]), encoding="utf8") as f:
                return v.get("status", 200), f.read()
        return 200, v


# ── the block's geometry, as the pages read it ───────────────────────────

def voice(n):
    while isinstance(n, dict):
        if "_" not in n:
            return ""
        n = n["_"]
    return n.strip() if isinstance(n, str) else ""


def node_at(b, addr):
    n = b
    for ch in str(addr).replace(".", ""):
        if not isinstance(n, dict):
            return None
        n = n.get(ch)
    return n


def under(addr, k):
    return addr + ("" if "." in addr else ".") + k


def floor_of(b):
    f, n = 1, b
    while isinstance(n, dict) and isinstance(n.get("_"), dict):
        f, n = f + 1, n["_"]
    return f


def walk(b, address):
    """The walker's short form: left-pad to the floor; a zero is the underscore."""
    whole, _, frac = str(address).partition(".")
    n = b
    for ch in whole.rjust(floor_of(b), "0") + frac:
        if ch == "0":
            if isinstance(n, dict):
                n = n.get("_")
            continue
        n = n.get(ch) if isinstance(n, dict) else None
        if n is None:
            return None
    return n


def split(t):
    """proposal.html split: a title before ' — ', or a line that opens in capitals."""
    t = str(t or "").strip()
    i = t.find(" — ")
    if 0 < i <= 100:
        return t[:i].strip(), t[i + 3:].strip()
    m = re.match(r"^([A-Z0-9][A-Z0-9’'&\-]*(?:,?\s+[A-Z0-9][A-Z0-9’'&\-]*)*)(?=[\s,:;.]|$)", t)
    if m and re.search(r"[A-Z]{2}", m.group(1)) and (m.group(1).find(" ") > 0 or len(m.group(1)) >= 6):
        return re.sub(r"[,\s]+$", "", m.group(1)), re.sub(r"^[\s,:;.—–-]+", "", t[len(m.group(1)):])
    return "", t


def texts(block, addr=""):
    """Every line of a block with its address, the root's as '0'."""
    if isinstance(block, str):
        yield addr or "0", block
    elif isinstance(block, dict):
        v = block.get("_")
        if isinstance(v, str):
            yield addr or "0", v
        elif isinstance(v, dict):
            yield from texts(v, addr)
        for k in DIGITS:
            if k in block:
                yield from texts(block[k], under(addr, k) if addr else k)


def shape_fault(content, path=""):
    """scripts/lint-block.ts validateShape, the beach's gate (well-formed 1)."""
    if isinstance(content, str):
        s = content.strip()
        if len(s) > 1 and s[0] in "{[":
            try:
                if isinstance(json.loads(s), (dict, list)):
                    return f"a JSON-stringified subtree at {path or 'the root'}; write the structure, not a string"
            except ValueError:
                pass
        return None
    if isinstance(content, dict):
        for k, v in content.items():
            if k != "_" and not re.fullmatch(r"[1-9]", k):
                return f"the key '{(path + '.') if path else ''}{k}'; a spine holds only '_' and single digits 1-9"
            found = shape_fault(v, f"{path}.{k}" if path else k)
            if found:
                return found
    elif isinstance(content, list):
        return f"a list at {path or 'the root'}; a spine holds only '_' and single digits 1-9"
    return None


# ── a family as the proposal form reads it (proposal.html, threads.js) ───

TOK = r"[A-Z][A-Z’']*(?: [A-Z][A-Z’']*)*"
CLOSING = re.compile(r"(?:^|\s)(" + TOK + r"(?:, " + TOK + r")*,? or " + TOK + r")\.?\s*$")
LEVELS = ("NOT STARTED", "SCOPED", "SPECIFIED", "BUILDING", "BUILT", "LIVE")
# What a maker's closing words look like before any reader has judged them: a list in capitals,
# digits allowed, glosses in brackets set aside. Where this finds more than CLOSING reads, a button is lost.
WORD = r"[^,a-z]*[A-Z0-9][^,a-z]*"
OFFERED = re.compile(r"^(" + WORD + r"(?:, " + WORD + r")*,? or " + WORD + r")$")


def words_of(closing):
    return [s.strip() for s in re.split(r",\s*|\s+or\s+", closing) if s.strip()]


def decision_of(at, text, title=""):
    body, tokens, closing = re.sub(r"^DECIDE\s*[—–:-]\s*", "", str(text), flags=re.I).strip(), ["GO", "NOT YET", "CHANGE"], False
    m = CLOSING.search(body)
    if m:
        tokens, closing, body = words_of(m.group(1)), True, body[: m.start()].strip()
    who, q, cut = "", body, -1
    for b in re.finditer(r"[.?!]\s+(?=\S)", body):
        cut = b.start() + 1
    if cut > 0:
        w = body[cut:].strip()
        if len(w) <= 170:
            who, q = re.sub(r"\.$", "", w), body[:cut].strip()
    return {"at": at, "title": title, "text": str(text), "q": q, "who": who, "tokens": tokens, "closing": closing}


def offered_words(text):
    """The words a decision's last sentence offers, as its maker wrote them, or None."""
    body = re.sub(r"\s*\([^()]*\)", "", re.sub(r"^DECIDE\s*[—–:-]\s*", "", str(text), flags=re.I)).strip()
    tail = re.split(r"[.?!]\s+(?=\S)", body)[-1].strip().rstrip(".")
    m = OFFERED.match(tail)
    return words_of(m.group(1)) if m else None


def parse_answer(text, tokens):
    words = "|".join(t.replace(" ", r"\s+") for t in tokens)
    m = re.match(r"^(" + words + r")\b\s*[—–:,-]?\s*([\s\S]*)$", str(text or "").strip(), re.I)
    return re.sub(r"\s+", " ", m.group(1)).upper() if m else ""


def state_of(node):
    t = voice(node.get("9")) if isinstance(node, dict) else ""
    if not t:
        return None
    title = split(t)[0].upper().rstrip(".,:;")
    if title in LEVELS:
        return title
    m = re.match(r"^(NOT STARTED|SCOPED|SPECIFIED|BUILDING|BUILT|LIVE)\b", t)
    return m.group(1) if m else ""


def is_decide(t):
    return bool(re.match(r"^DECIDE\b", t or "", re.I))


def steps_of(spine):
    out, node, addr = [], spine.get("1") if isinstance(spine, dict) else None, "1"
    while node is not None and len(out) < MAX_STEPS:
        title = split(voice(node) if isinstance(node, dict) else node)[0]
        step = {"at": addr, "node": node, "title": title, "decision": None, "sides": []}
        if isinstance(node, dict):
            d8 = voice(node.get("8"))
            if is_decide(d8):
                step["decision"] = decision_of(under(addr, "8"), d8, title)
            for k in "234567":
                r = node.get(k)
                if r is None:
                    continue
                at = under(addr, k)
                side = {"at": at, "title": split(voice(r) if isinstance(r, dict) else r)[0], "decision": None}
                rd = voice(r.get("8")) if isinstance(r, dict) else ""
                if is_decide(rd):
                    side["decision"] = decision_of(under(at, "8"), rd, side["title"])
                step["sides"].append(side)
        out.append(step)
        if not isinstance(node, dict):
            break
        node, addr = node.get("1"), under(addr, "1")
    return out, node is not None and len(out) == MAX_STEPS


def decisions_of(steps):
    out = []
    for s in steps:
        if s["decision"]:
            out.append(s["decision"])
        out += [r["decision"] for r in s["sides"] if r["decision"]]
    return out


def law_of(law, name):
    L = {"room": "", "page": "", "accent": "", "look": "", "phase": ""}
    if isinstance(law, dict):
        for d in DIGITS:
            t = voice(law.get(d))
            if not t:
                continue
            m = re.search(r"\bpool:([A-Za-z0-9_-]+)", t)
            if m and not L["room"]:
                L["room"] = m.group(1)
            m = re.search(r"\bpage:\s*(https?://\S+)", t, re.I)
            if m and not L["page"]:
                L["page"] = re.sub(r"[.,;)]+$", "", m.group(1))
            m = re.search(r"\blook:\s*accent\s*(#[0-9a-f]{6})\b", t, re.I)
            if m and not L["accent"]:
                L["accent"] = m.group(1)
            m = re.search(r"\blook:\s*([a-z][\w-]*)\s*$", t, re.I)
            if m and not L["look"] and m.group(1).lower() not in ("accent", "page"):
                L["look"] = m.group(1)
            m = re.match(r"^phase:\s*(proposal|project|complete|set aside)\b", t, re.I)
            if m and not L["phase"]:
                L["phase"] = m.group(1).lower()
    L["room"] = L["room"] or name
    return L


def listed(b):
    """An accumulator's lines at any floor (proposal.html listed)."""
    out, f = [], floor_of(b)

    def go(n, depth):
        if depth == f:
            t = n.strip() if isinstance(n, str) else voice(n)
            if t:
                out.append(t)
            return
        if isinstance(n, dict):
            if isinstance(n.get("_"), dict):
                go(n["_"], depth + 1)
            for d in DIGITS:
                if n.get(d) is not None:
                    go(n[d], depth + 1)
    go(b, 0)
    return out


def shelf_of(lst):
    shelf = []
    for t in listed(lst) if isinstance(lst, dict) else []:
        m = re.match(r"^\s*([a-z0-9][a-z0-9-]*)\s*—\s*([\s\S]*?)(?:\s*·\s*(\S+))?\s*$", t, re.I)
        if m:
            page = m.group(3) or ""
            shelf.append({"name": m.group(1).lower(), "what": m.group(2).strip(), "line": t,
                          "page": (page if re.match(r"^https?:", page) else "https://" + page) if page else ""})
    return shelf


def page_of(L, spine, entry):
    t2 = voice(spine.get("2")) if isinstance(spine, dict) else ""
    root2 = ""
    if re.match(r"^THE PAGE\b", t2, re.I):
        m = re.search(r"https?://\S+", t2)
        root2 = re.sub(r"[.,;)]+$", "", m.group(0)) if m else ""
    return L["page"] or root2 or (entry or {}).get("page", "")


def on_site(url):
    return re.sub(r"^www\.", "", urllib.parse.urlsplit(url).netloc.lower()) == "happyseaurchin.com"


def is_plain(url):
    """A plain address on this site: the standard view, never a crafted page."""
    return on_site(url) and bool(re.match(r"^/proposals?(?:\.html)?(?:/|$)", urllib.parse.urlsplit(url).path))


def same_page(a, b):
    def norm(u):
        return re.sub(r"\.html$", "", re.sub(r"^(?:https?://)?(?:www\.)?", "", u.strip()).rstrip("/")).lower()
    return norm(a) == norm(b)


def links_in(t):
    """Addresses a reader can follow in a line of the beach (proposal.html rich)."""
    out = [re.sub(r"[.,;:!?]+$", "", u) for u in re.findall(r"\bhttps?://[^\s<>\"')\]]+", t)]
    out += ["https://" + re.sub(r"[.:!?]+$", "", u) for _, u in re.findall(r"(^|[\s(])((?:[a-z0-9-]+\.)?(?:happyseaurchin\.com|onen\.ai)/[^\s<>\"')\],;]*)", t)]
    return out


def entries_of(block):
    """Every line of a room as (address, node), and every span's container, older spans first."""
    lines, spans = [], []

    def go(n, path, levels):
        if not isinstance(n, dict):
            return
        if isinstance(n.get("_"), dict):
            go(n["_"], path, levels - 1)
        for d in DIGITS:
            c = n.get(d)
            if c is None:
                continue
            if levels > 1:
                spans.append(("".join(path) + d + "0" * (levels - 1), c))
                go(c, path + [d], levels - 1)
            else:
                lines.append(("".join(path) + d, c))
    go(block, [], floor_of(block))
    return lines, spans


def parse_thread(t):
    m = re.match(r"^\s*(thread:\d+|[a-z0-9][a-z0-9-]*)\s*(?:[—–]\s*([\s\S]*))?$", str(t or ""), re.I)
    if not m:
        return None
    carries, step = (m.group(2) or "").strip(), ""
    s = re.search(r"\s*·\s*step\s+(\d+(?:\.\d+)?)\s*\.?\s*$", carries, re.I)
    if s:
        step, carries = s.group(1), carries[: s.start()].strip()
    reg = re.match(r"^thread:(\d+)$", m.group(1), re.I)
    return {"name": m.group(1).lower(), "carries": carries, "step": step, "registry": reg.group(1) if reg else ""}


def threads_node(law):
    if not isinstance(law, dict):
        return None
    if law.get("5") is not None and re.match(r"^THE THREADS\b", voice(law["5"]) if isinstance(law["5"], dict) else str(law["5"]), re.I):
        return law["5"]
    for d in DIGITS:
        n = law.get(d)
        if n is not None and re.match(r"^THE THREADS\b", voice(n) if isinstance(n, dict) else str(n), re.I):
            return n
    return None


def sibling(folder, filename, modname):
    """A battery beside this one in the repo, or None away from it."""
    for path in (os.path.join(HERE, "..", folder, filename), os.path.join(HERE, filename)):
        if os.path.exists(path):
            spec = importlib.util.spec_from_file_location(modname, path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            return mod
    return None


class Family:
    def __init__(self, surface, name):
        self.s, self.name, self.findings = surface, name, []
        self.spine, self.law = surface.get(f"spine:{name}"), surface.get(f"function:{name}")
        self.L = law_of(self.law, name)
        self.steps, self.more = steps_of(self.spine) if isinstance(self.spine, dict) else ([], False)
        self.decisions = decisions_of(self.steps)
        self.entry = next((x for x in shelf_of(surface.get("proposals")) if x["name"] == name.lower()), None)
        self.page = page_of(self.L, self.spine, self.entry)
        self.crafted = self.page if self.page and not is_plain(self.page) else ""
        self.room = surface.get(f"pool:{self.L['room']}")
        self.threads = []

    def add(self, level, battery, test, at, detail):
        self.findings.append({"level": level, "battery": battery, "test": test, "at": at, "detail": detail})

    def mirrors(self):
        pre = self.name + ":"
        hands = [n[len(pre):] for n in self.s.names() if n.startswith(pre) and ":" not in n[len(pre):]]
        return {h: self.s.get(pre + h) for h in sorted(hands)}


# ── family: the spine and law stand, their positions, the list ───────────

NOTED = re.compile(r"(?<![\w.:-])((?:spine|function|ways|pool|look|files|history):[A-Za-z0-9_-]+(?::[A-Za-z0-9_-]+)*)(?![\w:<-])(?:\s+(\d+(?:\.\d+)?)(?![\w.]))?")
MULTIDOT = re.compile(r"(?<![\w.#/-])\d\.\d(?:\.\d)+(?![\w/-])")


def check_family(f):
    add = lambda level, test, at, detail: f.add(level, "family", test, at, detail)
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", f.name):
        add("FAULT", "STANDS", "", f"the name '{f.name}' holds more than lower-case letters, digits and hyphens; the list and the page's address read it lower-cased")
    if not isinstance(f.spine, dict):
        add("FAULT", "STANDS", "", f"spine:{f.name} does not stand, or is not an object")
        return
    if not isinstance(f.law, dict):
        add("FAULT", "STANDS", "", f"function:{f.name} does not stand; a family stands when its law stands")
    for nm, b in ((f"spine:{f.name}", f.spine), (f"function:{f.name}", f.law)):
        why = shape_fault(b)
        if why:
            add("FAULT", "SHAPE", nm, why)
    if isinstance(f.spine.get("_"), dict):
        add("FAULT", "FLOOR", "", f"the spine stands at floor {floor_of(f.spine)}; every page reads the first step at the root's 1, so nesting the root loses them")
    root = voice(f.spine)
    if " — " not in root:
        add("FAULT", "TITLE", "0", "the root has no title before ' — '")
    for k, what in (("2", "the page"), ("3", "where it came from"), ("9", "its provenance")):
        if not voice(f.spine.get(k)) and not isinstance(f.spine.get(k), str):
            add("WARN", "ROOT", k, f"the root's {k} is silent; it says {what}")
    if not f.steps:
        add("FAULT", "STEPS", "1", "no first step at 1")
    if f.more:
        add("FAULT", "STEPS", f.steps[-1]["at"], f"past {MAX_STEPS} steps the page draws no more; carry the rest in a thread or a side-room")
    if len(f.steps) == 1 and sum(1 for k in "4567" if k in f.spine) >= 3:
        add("WARN", "STEPS", "0", "one step with several rooms at the root reads as a fan; author steps down 1")
    for s in f.steps:
        if not s["title"]:
            add("WARN", "TITLES", s["at"], "the step opens with no title before ' — '")
        for r in s["sides"]:
            if not r["title"]:
                add("WARN", "TITLES", r["at"], "the side-room opens with no title before ' — '")
        if state_of(s["node"]) == "":
            add("FAULT", "STATE", under(s["at"], "9"), f"no page draws this STATE: it opens '{voice(s['node'].get('9'))[:40]}', not with one of {', '.join(LEVELS)}")
    if isinstance(f.law, dict):
        t1 = voice(f.law.get("1"))
        if not re.match(r"^mode:\s*document\b", t1):
            add("FAULT", "MODE", "1", f"the law's 1 is not 'mode: document': '{t1[:40]}'")
        for k, what in (("2", "the decisions"), ("3", "the room"), ("4", "setting aside"), ("5", "the threads"), ("6", "the page and its look"), ("7", "the phase"), ("9", "provenance")):
            if not voice(f.law.get(k)):
                add("WARN", "POSITIONS", k, f"the law's {k} is silent; it holds {what}")
    if f.entry is None:
        lines = [t for t in (listed(f.s.get("proposals")) if isinstance(f.s.get("proposals"), dict) else []) if re.match(rf"^\s*{re.escape(f.name)}\b", t, re.I)]
        if lines:
            add("FAULT", "LISTED", "proposals", f"its line does not read '<name> — what it is · its page': '{lines[0][:60]}'")
        else:
            add("NOTE", "LISTED", "proposals", "not on the list yet; list it once this passes (function:proposal 7)")
    elif not f.entry["page"]:
        add("WARN", "LISTED", "proposals", "its line names no page after ' · '")
    for nm, block in ((f"spine:{f.name}", f.spine), (f"function:{f.name}", f.law), (f"pool:{f.L['room']}", voice(f.room))):
        dots = [(at, m) for at, t in texts(block) for m in MULTIDOT.findall(t)]
        if dots:
            add("WARN", "NOTATION", f"{nm} {dots[0][0]}", f"{len(dots)} multi-dot address{'es' if len(dots) > 1 else ''}, as '{dots[0][1]}'; an address has one decimal point (4.26) or commas (4,2,6)")
    names, seen = set(f.s.names()), set()
    for nm, block in ((f"spine:{f.name}", f.spine), (f"function:{f.name}", f.law)):
        for at, t in (texts(block) if isinstance(block, dict) else []):
            for ref, addr in NOTED.findall(t):
                key = (ref, addr)
                if key in seen or ref == f"pool:{f.L['room']}":
                    continue
                seen.add(key)
                if ref not in names:
                    add("WARN", "RESOLVES", f"{nm} {at}", f"names {ref}, which the beach does not hold")
                elif addr and not f.s.walks(ref, addr):
                    add("WARN", "RESOLVES", f"{nm} {at}", f"names {ref} {addr}, which walks nowhere")
    compound = sibling("compound-test-materials", "compound-form.py", "compound_form")
    if compound is None:
        add("NOTE", "COMPOUND", "", "compound-form.py is not beside this checker; the bonds were not read")
        return

    class Bonds:
        beach = "the family's surface"

        def get(self, name):
            if name.startswith("pscale:"):
                return self.sentinel(name[len("pscale:"):])
            b = f.s.get(name)
            return b if b is not None else self.sentinel(name)

        def sentinel(self, name):
            path = os.path.join(HERE, "..", "src", name + ".json")
            return json.load(open(path, encoding="utf8")) if re.match(r"^[a-z][a-z0-9-]*$", name) and os.path.exists(path) else None

        def origin(self, origin, name):
            return None

        def index(self):
            return f.s.names()

    for x in compound.check(Bonds(), [f.name])["faults"]:
        if x["predicate"] == "law":
            continue  # STANDS says so
        add("FAULT", "COMPOUND", f"{x['block']} {x['at']}", f"{x['predicate']}: {x['fault']}")


# ── decisions: each reads as its maker wrote it, each answer as an answer ─

def check_decisions(f):
    add = lambda level, test, at, detail: f.add(level, "decisions", test, at, detail)
    if not isinstance(f.spine, dict):
        return
    read = {d["at"] for d in f.decisions}
    other = {}
    for s in f.steps:
        if isinstance(s["node"], dict):
            t = voice(s["node"].get("8"))
            if t and not is_decide(t):
                other.setdefault(t.split()[0].rstrip("—–:-,."), []).append(under(s["at"], "8"))
    for word, at in other.items():
        add("WARN", "OPENS", ", ".join(at[:6]), f"{len(at)} step 8{'s open' if len(at) > 1 else ' opens'} '{word}', not 'DECIDE — '; the standard page draws no card there")
    for at, t in texts(f.spine):
        if is_decide(t) and at not in read:
            add("FAULT", "PLACED", at, "a decision where no page reads one; it stands at a step's 8 or a side-room's 8")
    for d in f.decisions:
        at, q = d["at"], d["q"]
        if not d["text"].startswith("DECIDE — "):
            add("WARN", "SPELT", at, f"opens '{d['text'][:12]}'; a crafted page's reader wants 'DECIDE — '")
        if "?" not in q:
            add("WARN", "QUESTION", at, f"a statement, not a question: '{q[:70]}'; the card still takes an answer, and the form asks for one question")
        elif q.count("?") > 1:
            add("WARN", "QUESTION", at, f"{q.count('?')} questions in one card; a card asks one")
        if not d["who"]:
            add("FAULT", "WHO", at, "names nobody; its last sentence, before any words, says whom it waits on")
        offered = offered_words(d["text"])
        if offered and offered != d["tokens"]:
            add("FAULT", "WORDS", at, f"offers {', '.join(offered)}, and the page's buttons read {', '.join(d['tokens'])}; a word holds capitals and apostrophes alone, with no digit and no gloss in brackets")
        elif d["closing"] and "NOT YET" not in d["tokens"]:
            add("FAULT", "HOLD", at, f"words of its own ({', '.join(d['tokens'])}) with no NOT YET, which it keeps as its hold")
        if len(q) > QUESTION_MAX:
            add("WARN", "SHORT", at, f"a question of {len(q)} characters; a card is answered with a tap and a line, and the reasons stand in side-rooms")
    for h, m in f.mirrors().items():
        for d in f.decisions:
            n = node_at(m, d["at"])
            t = voice(n) or (n if isinstance(n, str) else "")
            if t and not parse_answer(t, d["tokens"]):
                add("WARN", "ANSWERS", d["at"], f"{h}'s line opens '{t[:24]}', none of {', '.join(d['tokens'])}, so it reads as a note and never counts; it is {h}'s own to re-say")
    law2 = voice(f.law.get("2")) if isinstance(f.law, dict) else ""
    named = set(re.findall(r"(?<![\w.])\d\.\d*8(?![\d.])", law2))
    if named:
        for at in sorted(named - read):
            if not voice(node_at(f.spine, at)) and not isinstance(node_at(f.spine, at), str):
                add("WARN", "NAMED", at, "the law's 2 names a decision here, and the spine holds none")
        for at in sorted({s["decision"]["at"] for s in f.steps if s["decision"]} - named):
            add("WARN", "NAMED", at, "a step's decision the law's 2 does not name, where it names the others")


# ── room: the welcome and its link, the entries, the spans beneath it ────

def check_room(f):
    add = lambda level, test, at, detail: f.add(level, "room", test, at, detail)
    room = f.L["room"]
    if isinstance(f.law, dict):
        m = re.search(r"\bpool:([A-Za-z0-9_-]+)", voice(f.law.get("3")))
        if m and m.group(1) != room:
            add("FAULT", "NAMED", "3", f"the law's 3 names pool:{m.group(1)}, and the page takes the first pool any line names, pool:{room}")
    if room != f.name and not isinstance(f.room, dict):
        add("FAULT", "NAMED", "", f"the page takes pool:{room} for the room, from a line of the law, and no such room stands")
    if not isinstance(f.room, dict):
        add("FAULT", "STANDS", f"pool:{room}", "no room; found it with pscale_pool_engage (function:proposal 7)")
        return
    why = shape_fault(f.room)
    if why:
        add("FAULT", "SHAPE", f"pool:{room}", why)
    welcome = voice(f.room)
    if len(welcome) < 40 or re.fullmatch(r"\S+", welcome):
        add("FAULT", "WELCOME", "0", f"the purpose is the welcome every arrival reads; it says what the room is for in words: '{welcome[:40]}'")
    links = links_in(welcome)
    pages = [f"{SITE}/proposal/{f.name}"] + ([f.crafted] if f.crafted else [])
    if not any(same_page(u, p) for u in links for p in pages):
        add("FAULT", "LINK", "0", "the welcome carries no link to this proposal's page" + (f"; it links {links[0]}" if links else ""))
    else:
        tail = re.sub(r"[\s.]+$", "", welcome)
        last = next((u for u in reversed(links) if tail.endswith(re.sub(r"^https://", "", u))), None)
        want = f.crafted or pages[0]
        if last is None:
            add("WARN", "ENDS", "0", f"the welcome does not end with the page's address ({want})")
        elif not same_page(last, want):
            add("WARN", "ENDS", "0", f"the welcome ends with {last}, and the page is {want}")
    lines, spans = entries_of(f.room)
    for at, node in lines:
        if not (isinstance(node, dict) and isinstance(node.get("1"), str) and isinstance(node.get("3"), str)):
            add("WARN", "ENTRIES", at, "no page shows this line: it has no speaker at 1 or no stamp at 3, so it was not appended through the room")
    for at, node in spans:
        if not isinstance(node, dict):
            add("WARN", "ENTRIES", at, "a line standing where a span of earlier responses nests")
        elif not voice(node) and not isinstance(node.get("_"), dict):
            add("WARN", "SUMMARIES", at, "a span of responses has opened and the summary of the nine before it is unpaid (block-conventions 3.5): a reader of its entries arrives without their frame")
    replies = sum(1 for _, n in lines if isinstance(n, dict) for k in "456789" if isinstance(n.get(k), dict))
    if replies:
        add("NOTE", "REPLIES", "", f"{replies} repl{'ies stand' if replies > 1 else 'y stands'} beneath {'their entries' if replies > 1 else 'its entry'}; the door and the page show the entries alone, so walk an entry before calling it unanswered")
    if not lines:
        add("NOTE", "ENTRIES", "", "nobody has spoken in the room yet")


# ── threads: the law's 5 names what stands ───────────────────────────────

def check_threads(f):
    add = lambda level, test, at, detail: f.add(level, "threads", test, at, detail)
    if not isinstance(f.law, dict):
        return
    five, node = f.law.get("5"), threads_node(f.law)
    if node is None:
        if isinstance(five, dict) and any(k in five for k in DIGITS):
            add("FAULT", "HEADED", "5", f"the law's 5 holds threads and does not open 'THE THREADS', so no page reads them: '{voice(five)[:40]}'")
        elif five is not None:
            add("WARN", "HEADED", "5", f"the law's 5 does not open 'THE THREADS', so no page will read a thread named there: '{voice(five)[:40] or str(five)[:40]}'")
    names = set(f.s.names())
    steps = {s["at"] for s in f.steps}
    if isinstance(node, dict):
        for k in DIGITS:
            if k not in node:
                continue
            line = voice(node[k]) or (node[k] if isinstance(node[k], str) else "")
            th = parse_thread(line)
            at = under("5", k)
            if th is None:
                add("FAULT", "LINE", at, f"no page reads this line: it opens '<thread> — what it carries', '{line[:50]}'")
                continue
            f.threads.append(th)
            if th["registry"]:
                if not isinstance(f.s.get("spine:thread"), dict) or walk(f.s.get("spine:thread"), th["registry"]) is None:
                    add("FAULT", "STANDS", at, f"thread {th['registry']} has no line in the registry, spine:thread")
            elif f"spine:{th['name']}" not in names:
                add("WARN", "STANDS", at, f"'{th['name']}' has no spine:{th['name']} and is not a registry thread (thread:<number>), so the page draws it empty")
            if th["step"] and th["step"] not in steps:
                add("FAULT", "STEP", at, f"it serves step {th['step']}, which is not a step of this spine, so no step draws it")
    if f.L["phase"] in ("project", "complete") and not f.threads:
        add("WARN", "TIED", "5", f"phase: {f.L['phase']}, and no thread is tied, so the page's trail is empty")
    registry = [t["registry"] for t in f.threads if t["registry"]]
    if not registry:
        return
    tf = sibling("thread-test-materials", "thread_form.py", "thread_form")
    if tf is None:
        add("NOTE", "FORM", "5", "thread_form.py is not beside this checker; the registry threads were not read")
        return
    reg = f.s.get("spine:thread")
    mirrors = {n[len("thread:"):]: f.s.get(n) for n in f.s.names() if n.startswith("thread:") and n.count(":") == 1}
    # the registry is read at its own floor, each mirror raised to it, as thread_form's live mode reads them:
    # past nine threads the registry stands at floor 2, where thread 28 is 2,8 and thread 5 is 0,5
    floor = max(1, tf.floor_of(reg))
    view = tf.View(reg, {h: tf.raised(m, floor) for h, m in mirrors.items() if isinstance(m, dict)}, f.s.names(), floor)
    for n in registry:
        if walk(reg, n) is None:
            continue
        found = tf.check(view, n)[0]
        for x in found:
            if x["level"] == "FAULT":
                add("FAULT", "FORM", f"thread:{x['at']}", f"{x['test']}: {x['detail']}")
        warned = [x["test"] for x in found if x["level"] == "WARN"]
        if warned:
            add("WARN", "FORM", f"thread:{n}", f"{len(warned)} warning{'s' if len(warned) > 1 else ''} from thread_form.py ({', '.join(sorted(set(warned)))}); run it with --thread {n}")


# ── page: the phase, the crafted page, its wiring, the look, the map pin ─

WIRED = (("data-proposal on <html>", r"data-proposal=[\"']{name}[\"']"), ("canonical link", r"rel=[\"']canonical"), ("description", r"name=[\"']description"),
         ("viewport", r"name=[\"']viewport"), ("/theme.js", r"/theme\.js"), ("voice.js", r"button/voice\.js"), ("/threads.js", r"/threads\.js"),
         ("/api/mirrors", r"/api/mirrors"), ("the answer's say", r"beachVoice[\s\S]*\.say\("), ("keepDraft", r"keepDraft"), ("dictate", r"\bdictate\b"),
         ("the room's link", r"mirror\.onen\.ai/\?pool="), ("the footer's #create-your-own", r"create-your-own"))
PENDING = re.compile(r"\b(?:to come|once (?:weft|it is up|it stands)|puts? (?:it|the page) up|until then)\b", re.I)
KEYLIKE = re.compile(r"""\b(?:secret|enc_secret|new_lock|passphrase)["']?\s*[:=]\s*["'][^"'\s]{8,}["']""")
MAP = re.compile(r"^\s*([a-z0-9][a-z0-9-]*)\s+(\d+(?:\.\d+)?)\b")


def check_page(f):
    add = lambda level, test, at, detail: f.add(level, "page", test, at, detail)
    if not isinstance(f.spine, dict):
        return
    law = f.law if isinstance(f.law, dict) else {}
    t7, t6 = voice(law.get("7")), voice(law.get("6"))
    if not f.L["phase"]:
        if f.entry is None:
            add("FAULT", "PHASE", "7", "no 'phase:' line and not on the list, so the page says this is not a proposal")
        elif t7:
            add("FAULT", "PHASE", "7", f"the law's 7 opens '{t7[:30]}', not 'phase: proposal', 'phase: project', 'phase: complete' or 'phase: set aside'")
    elif not re.match(r"^phase:", t7, re.I):
        add("WARN", "PHASE", "7", "the phase is read from another line of the law; it stands at 7")
    said = re.search(r"\bpage:\s*(\S+)?", t6, re.I)
    if said and not f.L["page"]:
        if re.match(r"^page:\s*to come\b", t6, re.I):
            add("NOTE", "PAGE", "6", "the crafted page is still to come")
        else:
            add("FAULT", "PAGE", "6", f"'page: {said.group(1) or ''}' is no address the page can follow; it reads 'page: https://…'")
    t2 = voice(f.spine.get("2"))
    root2 = next((u for u in links_in(t2) if not is_plain(u)), "") if re.match(r"^THE PAGE\b", t2, re.I) else ""
    listed_page = (f.entry or {}).get("page", "")
    if f.crafted and not f.L["page"]:
        add("WARN", "PAGE", "6", f"a crafted page, {f.crafted}, that the law's 6 does not name")
    named = [("the law's 6", f.L["page"]), ("the spine's 2", root2), ("the list", listed_page)]
    crafted = [(w, u) for w, u in named if u and not is_plain(u)]
    if len({re.sub(r"^https?://(?:www\.)?", "", u).rstrip("/") for _, u in crafted}) > 1:
        add("WARN", "AGREE", "6", "the page's addresses differ: " + "; ".join(f"{w} {u}" for w, u in crafted))
    if f.crafted and listed_page and is_plain(listed_page):
        add("WARN", "AGREE", "proposals", f"the list points at the standard page, and the page is {f.crafted}")
    check_look(f, add, t6)
    check_map(f, add, voice(law.get("8")))
    if not f.crafted:
        return
    if not on_site(f.crafted) and f.entry is None:
        add("NOTE", "OFFSITE", "6", "a page off this site gets its Snazzy button only once the proposal is listed")
    status, html = f.s.fetch(f.crafted)
    if status is None:
        add("NOTE", "ANSWERS", "6", f"{f.crafted} was not fetched" + ("" if f.s.net else " (--no-net)"))
        return
    if status != 200:
        add("FAULT", "ANSWERS", "6", f"{f.crafted} answers {status}: a dead link on the beach")
        return
    for at, t in (("spine 2", t2), ("law 6", t6)):
        if PENDING.search(t):
            add("WARN", "STALE", at, f"the page answers, and this line still says it is to come: '{PENDING.search(t).group(0)}'")
    if re.search(r"__PREVIEW__\s*=\s*true", html):
        add("FAULT", "PREVIEW", "", "this is a preview export, without the site's head and scripts (ways:proposal 1.111)")
    if KEYLIKE.search(html):
        add("FAULT", "KEY", "", "the page's source holds what looks like a key; never a key in a page (ways:proposal 1.11111)")
    if on_site(f.crafted):
        missing = [w for w, pat in WIRED if not re.search(pat.format(name=re.escape(f.name)), html)]
        if missing:
            add("WARN", "WIRING", "", "the page's source is missing: " + ", ".join(missing) + " (ways:proposal 1.11)")
        unseen = [d["at"] for d in f.decisions if not re.search(rf"(?<![\d.]){re.escape(d['at'])}(?![\d.])", html)]
        if unseen:
            add("WARN", "CARDS", ", ".join(unseen[:8]), f"{len(unseen)} of {len(f.decisions)} decisions' addresses appear nowhere in the crafted page's source, so it may not offer them")
        m = re.search(r"""property=["']og:image["'][^>]*content=["']([^"']+)|content=["']([^"']+)["'][^>]*property=["']og:image""", html)
        if not m:
            add("WARN", "STILL", "", "no og:image, so the page shares with no picture")
        else:
            still = urllib.parse.urljoin(f.crafted, m.group(1) or m.group(2))
            code = f.s.fetch(still)[0]
            if code not in (200, None):
                add("FAULT", "STILL", "", f"its share still, {still}, answers {code}")
    elif f.name not in html:
        add("WARN", "WIRING", "", f"the page's source never names {f.name}, so it reads nothing of this family")
    if re.search(r"(?:^|[\s,}])(?:html|body)[^{}]*\{[^{}]*overflow(?:-x)?\s*:\s*(?:hidden|clip)", html):
        add("NOTE", "WALK", "", "the page hides overflow on its body, which blinds a sideways-scroll check: walk it at 390 measuring each element's right edge (mistake-proofing, 2 November 2026: a link cut off unseen)")


def check_look(f, add, t6):
    L = f.L
    if re.search(r"\blook:", t6, re.I) and not L["look"] and not L["accent"]:
        add("FAULT", "LOOK", "6", "a look no page reads: it is 'look: <handle>' ending the line, or 'look: accent #rrggbb'")
    if not L["look"]:
        return
    look = f.s.get(f"look:{L['look']}")
    if not isinstance(look, dict):
        add("FAULT", "LOOK", "6", f"look:{L['look']} does not stand")
        return
    missing = [k for k in "123" if k not in look]
    if missing:
        add("WARN", "LOOK", f"look:{L['look']}", f"silent at {', '.join(missing)}: the palette, the letters and the measure, which the page puts on (function:look 1)")
    for at, t in texts(look):
        if re.search(r"<(?:style|script|div|span)\b|\{\s*[a-z-]+\s*:[^}]*;", t):
            add("WARN", "LOOK", f"look:{L['look']} {at}", "markup or CSS in a look, which holds named values and its maker's sentences and nothing else (function:look 1)")
    worn = voice(look.get("8"))
    if f.name not in worn and not re.search(rf"\bat {re.escape(L['look'])}’?'?s yes\b", t6, re.I):
        add("WARN", "MAKER", "6", f"look:{L['look']}'s 8 does not name this family, and the law records no '… at {L['look']}'s yes, <date> · look: {L['look']}' (function:look 5)")


def check_map(f, add, t8):
    if not t8:
        add("NOTE", "MAP", "8", "no map pin; the law's 8 names the part of a running process this would change, where it would")
        return
    if not re.match(r"^map:", t8, re.I):
        add("FAULT", "MAP", "8", f"the law's 8 opens '{t8[:30]}'; it reads 'map: <name> <address>'")
        return
    for part in re.sub(r"^map:\s*", "", t8, flags=re.I).split(";"):
        m = MAP.match(part)
        if not m:
            add("FAULT", "MAP", "8", f"'{part.strip()[:40]}' is not '<name> <address>'")
            continue
        block = f"spine:{m.group(1)}-schematic"
        if f.s.get(block) is None:
            add("FAULT", "MAP", "8", f"{block} does not stand")
        elif not f.s.walks(block, m.group(2)):
            add("FAULT", "MAP", "8", f"{block} {m.group(2)} walks nowhere")


CHECKS = {"family": check_family, "decisions": check_decisions, "room": check_room, "threads": check_threads, "page": check_page}


def check(surface, name, only=BATTERIES):
    f = Family(surface, name)
    # the family's own battery runs first and says when the spine is missing; the rest then have nothing to read
    for b in BATTERIES:
        if b in only and (b == "family" or isinstance(f.spine, dict)):
            CHECKS[b](f)
    if "family" not in only and not isinstance(f.spine, dict):
        f.add("FAULT", "family", "STANDS", "", f"spine:{name} does not stand, or is not an object")
    return f


def verdict(f):
    return "WELL FORMED" if not [x for x in f.findings if x["level"] == "FAULT"] else "NOT WELL FORMED"


def rendered(f):
    lines, _ = entries_of(f.room) if isinstance(f.room, dict) else ([], [])
    head = (f"{f.name}: {verdict(f)} · {len(f.steps)} steps · {len(f.decisions)} decisions · room {len(lines)} lines · "
            f"{len(f.threads)} threads · page {f.page or f'{SITE}/proposal/{f.name}'}")
    order = {"FAULT": 0, "WARN": 1, "NOTE": 2}
    rows = [head]
    for x in sorted(f.findings, key=lambda x: order[x["level"]]):
        rows.append(f"  {x['level']:5} {x['battery']}/{x['test']:10} {x['at']:12} {x['detail']}")
    return "\n".join(rows)


def drifted(surface):
    """Whether the lines this port follows still stand in the pages (a NOTE, never a fault)."""
    out = []
    for page, wanted in READERS.items():
        status, html = surface.fetch(f"{SITE}/{page}")
        if status != 200:
            out.append(f"{page} answered {status}, so the port could not be checked against it")
            continue
        out += [f"{page} no longer holds: {w[:70]}" for w in wanted if w not in html]
    return out


def main(argv):
    args, opts = [], {"--beach": BEACH, "--only": ",".join(BATTERIES)}
    it = iter(argv)
    flags = set()
    for a in it:
        if a in opts:
            opts[a] = next(it)
        elif a.startswith("--"):
            flags.add(a)
        else:
            args.append(a)
    only = tuple(x.strip() for x in opts["--only"].split(","))
    if not args or args[0] not in ("live", "state") or any(b not in BATTERIES for b in only):
        print(__doc__)
        return 2
    if args[0] == "state" and len(args) < 2:
        print(__doc__)
        return 2
    if args[0] == "state":
        state = json.load(open(args[1], encoding="utf8"))
        surface = State(state, os.path.dirname(os.path.abspath(args[1])))
        names = [state["name"]]
    else:
        surface = Surface(opts["--beach"], "--no-net" not in flags)
        if "--all" in flags:
            names = [x["name"] for x in shelf_of(surface.get("proposals"))]
        elif len(args) > 1:
            names = args[1:]
        else:
            print(__doc__)
            return 2
    try:
        results = [check(surface, n, only) for n in names]
    except (urllib.error.URLError, TimeoutError) as e:
        # a read that failed is no verdict: nothing was judged
        print(f"could not read {surface.beach}: {e}; nothing was judged", file=sys.stderr)
        return 2
    if "--json" in flags:
        print(json.dumps([{"name": f.name, "verdict": verdict(f), "findings": f.findings} for f in results], indent=1, ensure_ascii=False))
    else:
        for f in results:
            print(rendered(f))
        if len(results) > 1:
            count = lambda lv: sum(1 for f in results for x in f.findings if x["level"] == lv)
            good = sum(1 for f in results if verdict(f) == "WELL FORMED")
            print(f"\n{len(results)} proposals: {good} well formed, {len(results) - good} not · {count('FAULT')} faults · {count('WARN')} warnings · {count('NOTE')} notes")
        if args[0] == "live" and surface.net:
            for line in drifted(surface):
                print(f"  NOTE  reader moved: {line}; re-read the port")
    return 1 if any(verdict(f) != "WELL FORMED" for f in results) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
