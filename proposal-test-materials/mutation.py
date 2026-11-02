#!/usr/bin/env python3
"""Plant one fault at a time in a well-formed family, and see whether the checker catches it.
weft, 2 November 2026, in the form of thread-test's mutation.py. The fixture is harbour-bell;
where a planted line is marked 'as found', it stands verbatim as it was found on the beach on the
first sweep, so a fault once met stays a case. Exits 1 unless every planted fault is caught at its
level and the family unplanted carries no FAULT and no WARN.
"""
import copy, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import proposal_form as PF

FIX = os.path.join(HERE, "fixtures")
BASE = json.load(open(os.path.join(FIX, "harbour-bell.json"), encoding="utf8"))
HTML = open(os.path.join(FIX, "harbour-bell.html"), encoding="utf8").read()
N = "harbour-bell"
SPINE, LAW, ROOM, LIST = f"spine:{N}", f"function:{N}", f"pool:{N}", "proposals"
PAGE = f"https://happyseaurchin.com/{N}"
STILL = f"https://happyseaurchin.com/animations/{N}.jpg"
LOOK = "look:kestrel"


def put(s, block, addr, value):
    """Write at an address, voicing a node's underscore where it already holds children."""
    n = s["blocks"][block]
    ds = addr.replace(".", "")
    for d in ds[:-1]:
        if isinstance(n.get(d), str):
            n[d] = {"_": n[d]}
        n = n.setdefault(d, {})
    last = ds[-1] if ds else "_"
    if isinstance(n.get(last), dict) and isinstance(value, str):
        n[last]["_"] = value
    else:
        n[last] = value


def drop(s, block, addr=None):
    if addr is None:
        del s["blocks"][block]
        return
    n = s["blocks"][block]
    ds = addr.replace(".", "")
    for d in ds[:-1]:
        n = n[d]
    del n[ds[-1]]


def welcome(s, text):
    s["blocks"][ROOM]["_"]["_"] = text


def html(s, old, new):
    s["pages"][PAGE] = HTML.replace(old, new)
    assert new is not None and old in HTML, old


def renamed(s):
    s["name"] = "Harbour-Bell"
    for b in list(s["blocks"]):
        if N in b:
            s["blocks"][b.replace(N, "Harbour-Bell")] = s["blocks"].pop(b)


def thirteen(s):
    node = s["blocks"][SPINE]["1"]
    for i in range(14):
        node = node.setdefault("1", {"_": f"STEP {i} — a step."})


def fan(s):
    drop(s, SPINE, "1.1")
    for k in "456":
        put(s, SPINE, k, f"ROOM {k} — a room at the root.")
    s["blocks"][LAW]["2"] = "THE DECISIONS — 1.8 the bell; 1.28 the metal."
    s["blocks"][LAW]["5"] = {"_": "THE THREADS — none yet."}


def unlisted(s):
    put(s, LIST, "1", {"_": "another-one — something else · happyseaurchin.com/another-one", "3": "2026-11-02T08:00:00Z"})


def offsite(s):
    url = "https://rook.github.io/harbour.html"
    put(s, LAW, "6", f"page: {url} — the crafted page, in rook's hand")
    put(s, SPINE, "2", f"THE PAGE — {url}.")
    put(s, LIST, "1", {"_": f"harbour-bell — a bell on the wall · {url}", "3": "2026-11-02T08:00:00Z"})
    welcome(s, "THE ROOM of harbour-bell, open to anyone, for talk that is not a decision. The page: " + url)
    s["pages"][url] = "<!doctype html><title>a harbour</title>"


LONG = "DECIDE — " + "Does the trust pay, " * 20 + "or not? dana. GO, NOT YET or CHANGE."

# (what is planted, how, battery, test, level)
M = [
    # the family
    ("no spine", lambda s: drop(s, SPINE), "family", "STANDS", "FAULT"),
    ("no law", lambda s: drop(s, LAW), "family", "STANDS", "FAULT"),
    ("a name with capitals", renamed, "family", "STANDS", "FAULT"),
    ("a key that is no digit", lambda s: s["blocks"][SPINE]["1"].__setitem__("10", "a slot"), "family", "SHAPE", "FAULT"),
    ("a subtree written as a string", lambda s: put(s, SPINE, "1.3", '{"_": "a room"}'), "family", "SHAPE", "FAULT"),
    ("a spine nested a floor up", lambda s: s["blocks"].__setitem__(SPINE, {"_": s["blocks"][SPINE]}), "family", "FLOOR", "FAULT"),
    ("a root with no title", lambda s: s["blocks"][SPINE].__setitem__("_", "a bell on the harbour wall."), "family", "TITLE", "FAULT"),
    ("the root's 3 silent", lambda s: drop(s, SPINE, "3"), "family", "ROOT", "WARN"),
    ("no first step", lambda s: drop(s, SPINE, "1"), "family", "STEPS", "FAULT"),
    ("past twelve steps", thirteen, "family", "STEPS", "FAULT"),
    ("one step and a fan of rooms", fan, "family", "STEPS", "WARN"),
    ("a step with no title", lambda s: put(s, SPINE, "1.1", "the table says when."), "family", "TITLES", "WARN"),
    ("a side-room with no title", lambda s: put(s, SPINE, "1.2", "bronze, hung at the mouth."), "family", "TITLES", "WARN"),
    ("a STATE, as found at mistake-proofing 1.111119", lambda s: put(s, SPINE, "1.9", "STATE — 2 November 2026: proposed."), "family", "STATE", "FAULT"),
    ("a STATE, as found at y-ray 1.1119", lambda s: put(s, SPINE, "1.9", "STATE: BUILDING — two looks stand."), "family", "STATE", "FAULT"),
    ("the law's 1 another mode", lambda s: put(s, LAW, "1", "mode: thread"), "family", "MODE", "FAULT"),
    ("the law's 4 silent", lambda s: drop(s, LAW, "4"), "family", "POSITIONS", "WARN"),
    ("a list line no page reads", lambda s: put(s, LIST, "1", {"_": "harbour-bell: a bell", "3": "2026-11-02T08:00:00Z"}), "family", "LISTED", "FAULT"),
    ("a list line with no page", lambda s: put(s, LIST, "1", {"_": "harbour-bell — a bell on the wall", "3": "2026-11-02T08:00:00Z"}), "family", "LISTED", "WARN"),
    ("not on the list yet", unlisted, "family", "LISTED", "NOTE"),
    ("a multi-dot address", lambda s: put(s, SPINE, "1.1", "HOW IT WORKS — as 1.1.8 asks."), "family", "NOTATION", "WARN"),
    ("prose naming a block nobody holds", lambda s: put(s, SPINE, "1.1", "HOW IT WORKS — as spine:nowhere says."), "family", "RESOLVES", "WARN"),
    ("prose naming an address that walks nowhere", lambda s: put(s, SPINE, "1.1", "HOW IT WORKS — as spine:tide-table 9 says."), "family", "RESOLVES", "WARN"),
    ("a bare reference that walks nowhere", lambda s: put(s, SPINE, "1.3", "spine:tide-table:9"), "family", "COMPOUND", "FAULT"),
    # the decisions
    ("a step's 8 opening another word", lambda s: put(s, SPINE, "1.8", "SAY — Would you hang it? Anyone."), "decisions", "OPENS", "WARN"),
    ("DECIDE spelt with a colon", lambda s: put(s, SPINE, "1.8", "DECIDE: Do we hang a bell at all? David and rook."), "decisions", "SPELT", "WARN"),
    ("a decision where no page reads one", lambda s: put(s, SPINE, "1.3", {"_": "THE SIDE — a room.", "1": "DECIDE — Is this read? David."}), "decisions", "PLACED", "FAULT"),
    ("a statement, as the first exemplars ask", lambda s: put(s, SPINE, "1.8", "DECIDE — hang the bell. David. GO, NOT YET or CHANGE."), "decisions", "QUESTION", "WARN"),
    ("two questions on one card", lambda s: put(s, SPINE, "1.8", "DECIDE — Do we hang it, and where? And who pays? David. GO, NOT YET or CHANGE."), "decisions", "QUESTION", "WARN"),
    ("nobody named", lambda s: put(s, SPINE, "1.8", "DECIDE — Do we hang a bell at all?"), "decisions", "WHO", "FAULT"),
    ("a word with a digit, as found at leros-on-the-commons 1.11118", lambda s: put(s, SPINE, "1.8", "DECIDE — who do Matthew and David approach first, together? Asked of Matthew and David. CLERO, ISBD, 5TH PLACE, NHFT, PIA or NOT YET."), "decisions", "WORDS", "FAULT"),
    ("a digit mid-word, as found at weft-bee 1.11118", lambda s: put(s, SPINE, "1.8", "DECIDE — How often? David. EVERY 4 HOURS, TWICE A DAY, ON ASK or NOT YET."), "decisions", "WORDS", "FAULT"),
    ("glosses, as found at loom 1.118", lambda s: put(s, SPINE, "1.8", "DECIDE — Where do his comments land? David. ROUTED (where each thing already takes words, with loom:happyseaurchin for what has none), ONE MIRROR (everything in loom:happyseaurchin at the address it is about), BOTH or NOT YET."), "decisions", "WORDS", "FAULT"),
    ("glosses, as found at loom 1.111128", lambda s: put(s, SPINE, "1.8", "DECIDE — Where does it live? David. NEW PAGE (happyseaurchin.com/loom), LANES (grown inside /lanes/weft) or NOT YET."), "decisions", "WORDS", "FAULT"),
    ("words of its own with no hold, as found at game-arcade 1.1168", lambda s: put(s, SPINE, "1.8", "DECIDE — What does it charge? David. FIVE POUNDS, FREE FOR NOW or CHANGE."), "decisions", "HOLD", "FAULT"),
    ("a question past a tap and a line", lambda s: put(s, SPINE, "1.8", LONG), "decisions", "SHORT", "WARN"),
    ("an answer outside the words, as found at leros-phase-two 1.1111118", lambda s: put(s, f"{N}:dana", "1.118", "YES — the trust pays half."), "decisions", "ANSWERS", "WARN"),
    ("the law's 2 naming a decision that is gone", lambda s: put(s, LAW, "2", "THE DECISIONS — 1.8 the bell; 1.18 what rings it; 1.118 who pays; 1.1118 the rope."), "decisions", "NAMED", "WARN"),
    ("the law's 2 missing a step's decision", lambda s: put(s, LAW, "2", "THE DECISIONS — 1.8 the bell; 1.118 who pays."), "decisions", "NAMED", "WARN"),
    # the room
    ("no room", lambda s: drop(s, ROOM), "room", "STANDS", "FAULT"),
    ("another pool named before the room", lambda s: put(s, LAW, "2", "THE DECISIONS — 1.8 the bell, 1.18, 1.118, talked over at pool:weft."), "room", "NAMED", "FAULT"),
    ("a welcome that is a bare mount", lambda s: welcome(s, "pscale:grit"), "room", "WELCOME", "FAULT"),
    ("a welcome, as found at pool:keel", lambda s: welcome(s, "pool:keel at beach.happyseaurchin.com."), "room", "WELCOME", "FAULT"),
    ("a welcome with no link", lambda s: welcome(s, "THE ROOM of harbour-bell, open to anyone, for talk that is not a decision."), "room", "LINK", "FAULT"),
    ("a welcome linking elsewhere, as found at pool:character-sheets", lambda s: welcome(s, "THE ROOM of harbour-bell, open to anyone. Walk it: https://happyseaurchin.com/walk/harbour-bell"), "room", "LINK", "FAULT"),
    ("a welcome ending on the standard page while a crafted one stands", lambda s: welcome(s, "THE ROOM of harbour-bell, open to anyone. The proposal: https://happyseaurchin.com/proposal/harbour-bell"), "room", "ENDS", "WARN"),
    ("the page named mid-sentence", lambda s: welcome(s, "THE ROOM of harbour-bell. https://happyseaurchin.com/harbour-bell is its page, and anyone may talk here."), "room", "ENDS", "WARN"),
    ("a line written by hand, with no speaker or stamp", lambda s: s["blocks"][ROOM]["_"].__setitem__("5", "And costs more."), "room", "ENTRIES", "WARN"),
    ("the nine before a span left unsummarised", lambda s: s["blocks"][ROOM]["1"].pop("_"), "room", "SUMMARIES", "WARN"),
    ("a room with a key that is no digit", lambda s: s["blocks"][ROOM].__setitem__("12", {"_": "x"}), "room", "SHAPE", "FAULT"),
    ("nobody has spoken yet, as found at the-string", lambda s: s["blocks"].__setitem__(ROOM, {"_": s["blocks"][ROOM]["_"]["_"]}), "room", "ENTRIES", "NOTE"),
    ("a reply beneath an entry, which the door hides", lambda s: None, "room", "REPLIES", "NOTE"),
    # the threads
    ("threads under a 5 no page reads", lambda s: put(s, LAW, "5", "WORK — carried here."), "threads", "HEADED", "FAULT"),
    ("a 5 that will read no thread", lambda s: s["blocks"][LAW].__setitem__("5", "none yet"), "threads", "HEADED", "WARN"),
    ("a thread line no page reads", lambda s: put(s, LAW, "5.1", "The Bell! — casting it"), "threads", "LINE", "FAULT"),
    ("a number the registry never opened", lambda s: put(s, LAW, "5.1", "thread:7 — casting the bell · step 1"), "threads", "STANDS", "FAULT"),
    ("a thread named and never founded", lambda s: put(s, LAW, "5.2", "no-such-work — the bracket · step 1.1"), "threads", "STANDS", "WARN"),
    ("a thread serving a step that is not one", lambda s: put(s, LAW, "5.1", "thread:1 — casting the bell · step 1.9"), "threads", "STEP", "FAULT"),
    ("a knot that waits on nobody", lambda s: put(s, "thread:rook", "1", "sent the pattern to the foundry"), "threads", "FORM", "FAULT"),
    ("a knot past three hundred characters", lambda s: put(s, "thread:rook", "1", "x" * 350 + " · waits on dana"), "threads", "FORM", "WARN"),
    ("phase: project with nothing tied", lambda s: (put(s, LAW, "7", "phase: project"), s["blocks"][LAW].__setitem__("5", {"_": "THE THREADS — none yet."})), "threads", "TIED", "WARN"),
    # the page and the look
    ("no phase, and not on the list", lambda s: (put(s, LAW, "7", "the phase is not said"), unlisted(s)), "page", "PHASE", "FAULT"),
    ("a phase no page reads", lambda s: put(s, LAW, "7", "phase: draft"), "page", "PHASE", "FAULT"),
    ("the phase standing at another line", lambda s: (put(s, LAW, "7", "the phase is at the 4"), put(s, LAW, "4", "phase: proposal")), "page", "PHASE", "WARN"),
    ("a page with no scheme", lambda s: put(s, LAW, "6", "page: happyseaurchin.com/harbour-bell"), "page", "PAGE", "FAULT"),
    ("a crafted page the law does not name, as found at game-arcade", lambda s: put(s, LAW, "6", "THE LOOK — the harbour at slack water."), "page", "PAGE", "WARN"),
    ("the page still to come", lambda s: (put(s, LAW, "6", "page: to come — weft puts it up."), drop(s, SPINE, "2"), put(s, LIST, "1", {"_": "harbour-bell — a bell · happyseaurchin.com/proposal/harbour-bell", "3": "2026-11-02T08:00:00Z"})), "page", "PAGE", "NOTE"),
    ("the spine and the law naming different pages", lambda s: put(s, SPINE, "2", "THE PAGE — https://happyseaurchin.com/harbour-bell-old is the page."), "page", "AGREE", "WARN"),
    ("the list pointing at the standard page, as found at leros-on-the-commons", lambda s: put(s, LIST, "1", {"_": "harbour-bell — a bell · happyseaurchin.com/proposal/harbour-bell", "3": "2026-11-02T08:00:00Z"}), "page", "AGREE", "WARN"),
    ("a page that answers 404", lambda s: s["pages"].pop(PAGE), "page", "ANSWERS", "FAULT"),
    ("a live page still said to be coming", lambda s: put(s, SPINE, "2", "THE PAGE — https://happyseaurchin.com/harbour-bell, once weft puts it up, draws the bell; until then the family is drawn from its blocks."), "page", "STALE", "WARN"),
    ("a preview export handed over", lambda s: html(s, "<script>\nfetch", "<script>\nwindow.__PREVIEW__ = true;\nfetch"), "page", "PREVIEW", "FAULT"),
    ("a key in the page", lambda s: html(s, "<script>\nfetch", "<script>\nvar secret = 'harbour-tide-bronze';\nfetch"), "page", "KEY", "FAULT"),
    ("a page missing a script", lambda s: html(s, '<script src="/theme.js"></script>', ""), "page", "WIRING", "WARN"),
    ("an off-site page that never names its family", offsite, "page", "WIRING", "WARN"),
    ("an off-site page, not listed yet", lambda s: (offsite(s), unlisted(s)), "page", "OFFSITE", "NOTE"),
    ("a decision the crafted page does not hold", lambda s: html(s, 'data-dec="1.118"', 'data-dec="1.1"'), "page", "CARDS", "WARN"),
    ("no share picture", lambda s: html(s, '<meta property="og:image" content="/animations/harbour-bell.jpg">', ""), "page", "STILL", "WARN"),
    ("a share still that answers 404", lambda s: s["pages"].pop(STILL), "page", "STILL", "FAULT"),
    ("a look that does not end the line", lambda s: put(s, LAW, "6", f"page: {PAGE} — the look: kestrel, at kestrel's yes."), "page", "LOOK", "FAULT"),
    ("an accent no page reads", lambda s: put(s, LAW, "6", f"page: {PAGE} · look: accent red"), "page", "LOOK", "FAULT"),
    ("a look that does not stand", lambda s: drop(s, LOOK), "page", "LOOK", "FAULT"),
    ("a look silent at its tokens", lambda s: drop(s, LOOK, "2"), "page", "LOOK", "WARN"),
    ("CSS in a look", lambda s: put(s, LOOK, "1", "body { color: red; }"), "page", "LOOK", "WARN"),
    ("a maker's look worn with no yes", lambda s: put(s, LAW, "6", f"page: {PAGE} · look: kestrel"), "page", "MAKER", "WARN"),
    ("a pin no schematic holds", lambda s: put(s, LAW, "8", "map: fishing 1.2"), "page", "MAP", "FAULT"),
    ("a pin that walks nowhere", lambda s: put(s, LAW, "8", "map: harbour 1.9"), "page", "MAP", "FAULT"),
    ("a pin that is no address", lambda s: put(s, LAW, "8", "map: the harbour"), "page", "MAP", "FAULT"),
    ("an 8 that is no pin", lambda s: put(s, LAW, "8", "the harbour's schematic"), "page", "MAP", "FAULT"),
    ("no pin", lambda s: drop(s, LAW, "8"), "page", "MAP", "NOTE"),
    ("a body that hides its overflow", lambda s: html(s, "</head>", "<style>body { overflow-x: hidden; }</style></head>"), "page", "WALK", "NOTE"),
]


def findings(state):
    return PF.check(PF.State(state, FIX), state["name"]).findings


def main():
    caught, missed = 0, []
    for label, plant, battery, test, level in M:
        s = copy.deepcopy(BASE)
        plant(s)
        got = findings(s)
        ok = any((x["battery"], x["test"], x["level"]) == (battery, test, level) for x in got)
        caught += ok
        if not ok:
            missed.append(label)
        print(f"{'caught' if ok else 'MISSED'}  {level:5} {battery + '/' + test:18} {label}")
        if not ok:
            for x in got:
                print(f"          got {x['level']} {x['battery']}/{x['test']} {x['at']}: {x['detail'][:90]}")
    clean = [x for x in findings(copy.deepcopy(BASE)) if x["level"] in ("FAULT", "WARN")]
    for x in clean:
        print(f"UNPLANTED {x['level']} {x['battery']}/{x['test']} {x['at']}: {x['detail']}")
    print(f"{caught}/{len(M)} planted faults caught; the family unplanted: {len(clean) or 'no'} fault{'' if len(clean) == 1 else 's'} or warning{'' if len(clean) == 1 else 's'}")
    return 0 if caught == len(M) and not clean else 1


if __name__ == "__main__":
    sys.exit(main())
