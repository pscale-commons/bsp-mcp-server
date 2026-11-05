"""The ledger of the unsaid: one entry per held thought, its five states, its urge, its one voice.

An entry is born when a cell holds a thought (or releases one nobody held), or from the unchosen
options of a cell's injector walk. The urge rises with independent releases, once per layer of cells,
and falls with age by a half-life counted in landings; being named by a person counts. A thought
ripens when its parent's topic comes back round, forecloses when its fork has passed beyond the slow
layer's reach, is voiced when spoken aloud, is handed back when a person says it.
What a cell sees of the ledger (view) carries no tallies; the page and the record see everything.
"""
import math, re, time

STOP = set("""the a an and or but so if then that this these those is are was were be been being to of in on at by for
with from as it its i you he she we they them me my your our their his her what which who whom when where why how not
no yes do does did done have has had can could would should will shall may might just like really very also there here
about into than too get got go going went come came say said says think thought know knew one two some any all""".split())
STATES = ("withheld", "ripe", "foreclosed", "voiced", "handed back")
LAYERS = ("fast", "middle", "slow")


def words_of(text):
    return {w for w in re.findall(r"[a-z0-9']+", (text or "").lower()) if len(w) >= 3 and w not in STOP}


def jaccard(a, b):
    return len(a & b) / len(a | b) if (a or b) else 0.0


def quoted(parent):
    """The words a parent quotes — 'half of that never got done' — as phrases of three or more content words.
    A re-release repeats the thought it answers by quoting the same words, whatever it says of them."""
    out = set()
    for span in re.findall(r"['‘’\"“”]([^'‘’\"“”]{6,120})['‘’\"“”]", parent or ""):
        ws = re.findall(r"[a-z0-9']+", span.lower())   # every word: inside a quote the small words are part of what was said
        if len(ws) >= 3:
            out.add(" ".join(ws))
    return out


def layer_of(period):
    """The order of magnitude of a cell's period: under ten seconds fast, under a minute middle, above slow."""
    return "fast" if period < 10 else "middle" if period < 60 else "slow"


def slower(a, b):
    return a if LAYERS.index(a) >= LAYERS.index(b) else b


class Entry:
    def __init__(self, eid, holder, layer, parent, text, horizon, landing, t, stop="phrase", origin="line"):
        self.id = eid
        self.holder = holder            # the cell that first held it
        self.holders = {holder}
        self.voice = layer              # the slowest layer that holds it
        self.parent = parent
        self.text = text
        self.say = text                 # what would be said: the latest release's text
        self.horizon = horizon
        self.stop = stop
        self.landing = landing          # born in this landing
        self.born_t = t
        self.born_wall = time.time()
        self.state = "withheld"
        self.urge = 0.0
        self.released = {}              # layer -> the first independent release by that layer
        self.releases = []              # every release, with whether the cell had seen another's
        self.safety = False
        self.named = 0
        self.ripe_at = self.foreclosed_at = self.voiced_at = None
        self.voiced_by = None
        self.handed = None
        self.checked = None
        self.would = []                 # the would-speak moments: t, landing, urge, open, mode flags
        self.cut = None
        self.origin = origin            # "line" or "walk"
        self.words = words_of(text)
        self.parent_words = words_of(parent)
        self.quotes = quoted(parent)    # the words the parent quotes: a re-release of the same thought quotes them too
        self.fresh = None               # the landing of the latest counted release: its urge stands whole through the next landing

    @property
    def live(self):
        return self.state in ("withheld", "ripe")

    def to_dict(self, landing_now):
        return dict(id=self.id, holder=self.holder, holders=sorted(self.holders), voice=self.voice, parent=self.parent,
                    text=self.text, say=self.say, horizon=self.horizon, stop=self.stop, landing=self.landing,
                    born_t=round(self.born_t, 1), lived=max(0, landing_now - self.landing), state=self.state,
                    urge=round(self.urge, 3), released=self.released, releases=self.releases, safety=self.safety,
                    named=self.named, ripe_at=self.ripe_at, foreclosed_at=self.foreclosed_at, voiced_at=self.voiced_at,
                    voiced_by=self.voiced_by, handed=self.handed, checked=self.checked, would=self.would, cut=self.cut,
                    origin=self.origin)


class Ledger:
    def __init__(self, settings, talk):
        self.s = settings
        self.talk = talk
        self.entries = {}
        self.n = 0
        self.periods = {}               # cell -> measured period, for the slow layer's reach
        self.log = []                   # what happened, in order, for the record
        self.changed = False

    # ---- what a cell sees

    def view(self, cell):
        """Held thoughts as they stand, no tallies: tag, parent, text, horizon, state, age. Bounded by attention."""
        n = self.talk.landing_count()
        live = sorted((e for e in self.entries.values() if e.live), key=lambda e: (e.state != "ripe", -e.landing, e.id))
        out = []
        for e in live[: int(self.s["attention"])]:
            out.append(dict(tag=e.id, parent=e.parent, text=e.text, horizon=e.horizon, state=e.state, age=max(0, n - e.landing)))
        return out

    # ---- taking a line

    def new_id(self):
        self.n += 1
        return f"h{self.n}"

    def match(self, parent, text, tag=None):
        if tag and tag in self.entries and self.entries[tag].live:
            return self.entries[tag]
        tw, pw = words_of(text), words_of(parent)
        q = quoted(parent)
        if q:   # the same quoted words in the parent: the same thought, however the line puts it (the stand-in's h83, h88, h93 were one)
            same = [e for e in self.entries.values() if e.live and e.quotes & q]
            if same:
                return max(same, key=lambda e: (bool(e.released), e.landing))
        best, score = None, 0.0
        for e in self.entries.values():
            if not e.live:
                continue
            sc = 0.6 * jaccard(tw, e.words) + 0.4 * jaccard(pw, e.parent_words)
            if sc > score:
                best, score = e, sc
        return best if score >= float(self.s.get("match", 0.3)) else None

    def seed(self, cell, layer, parent, text, horizon):
        """An unchosen option of the walk: a first held thought, withheld, its horizon the hinge."""
        e = Entry(self.new_id(), cell, layer, parent, text, horizon, 0, 0.0, origin="walk")
        self.entries[e.id] = e
        self.changed = True
        return e

    def take(self, cell, layer, line, seen_release_ids=()):
        """A parsed line from a cell. Returns (entry, what happened)."""
        n, t = self.talk.landing_count(), self.talk.now()
        tag = None
        m = re.search(r"\[(h\d+)\]", line.get("text", "") + " " + line.get("parent", ""))
        if m:
            tag = m.group(1)
        text = re.sub(r"\s*\[h\d+\]\s*", " ", line.get("text", "")).strip()
        parent = re.sub(r"\s*\[h\d+\]\s*", " ", line.get("parent", "")).strip()
        e = self.match(parent, text, tag)
        created = e is None
        if created:
            e = Entry(self.new_id(), cell, layer, parent, text, line.get("horizon", "turns"), n, t, line.get("stop", "phrase"))
            self.entries[e.id] = e
        e.holders.add(cell)
        e.voice = slower(e.voice, layer)
        if line.get("safety") is True and self.s.get("safety", True):
            e.safety = True
        what = "held" if created else "kept"
        if line.get("act") == "release":
            saw = e.id in set(seen_release_ids)
            counted = layer not in e.released
            if counted:
                e.released[layer] = dict(cell=cell, landing=n, t=round(t, 1))
                e.urge += 1.0
                e.fresh = n   # a release at the last words before a silence is the middle point itself: it is not aged by that landing
            e.releases.append(dict(cell=cell, layer=layer, landing=n, t=round(t, 1), counted=counted, saw_another=saw))
            e.say = text or e.say
            e.stop = line.get("stop", e.stop)
            what = "released" + ("" if counted else " again") + (" after seeing another's" if saw else "")
        self.changed = True
        self.log.append(dict(t=round(t, 1), landing=n, cell=cell, layer=layer, id=e.id, what=what))
        return e, what

    # ---- the clock's work, at every landing

    def reach(self):
        """How far the slow layer reaches, in landings: the talk window plus the slowest period, scaled by attachment."""
        slowest = max(self.periods.values(), default=10.0)
        base = max(3, math.ceil((float(self.s["talk_seconds"]) + slowest) / self.talk.interval()))
        return base * (0.5 + float(self.s["attachment"]))

    def horizon_landings(self, e):
        iv = self.talk.interval()
        fast = max(1, math.ceil(10 / iv))
        return {"seconds": fast, "turns": max(fast + 1, math.ceil(60 / iv)), "topic": math.ceil(self.reach())}.get(e.horizon, fast + 1)

    def on_landing(self, n, turn):
        """Decay, ripen, foreclose, hand back, check; turn is the turn that just landed."""
        decay = 0.5 ** (1.0 / max(0.5, float(self.s["half_life"])))
        tw = words_of(" ".join(w["w"] for w in turn["words"])) if turn else set()
        speaker = turn["s"] if turn else None
        reach = self.reach()
        name = (self.s.get("name") or "").lower()
        named = bool(turn) and name in {w["w"].lower() for w in turn["words"]}
        ripest = None
        for e in list(self.entries.values()):
            if not e.live:
                continue
            if e.fresh is None or e.fresh < n - 1:   # a release made since the last landing keeps its urge whole through this one
                e.urge *= decay
            lived = n - e.landing
            own = e.words - e.parent_words
            if lived >= 1 and tw and len(tw & own) >= 2 and jaccard(tw, e.words) >= 0.2:
                e.state, e.handed = "handed back", dict(by=speaker, landing=n, t=round(self.talk.now(), 1))
                self.log.append(dict(t=round(self.talk.now(), 1), landing=n, id=e.id, what=f"handed back by {speaker}"))
                continue
            if e.state == "withheld" and lived >= 1 and tw and (jaccard(tw, e.parent_words) >= 0.25 or len(tw & e.parent_words) >= 2):
                e.state, e.ripe_at = "ripe", n
                self.log.append(dict(t=round(self.talk.now(), 1), landing=n, id=e.id, what="ripened"))
            if e.checked is None and lived >= self.horizon_landings(e):
                e.checked = dict(landing=n, came_back=e.state == "ripe")
            if lived > reach and e.origin != "walk":   # a walk seed's fork is the block's, not the talk's: it is checked, never foreclosed by reach
                e.state, e.foreclosed_at = "foreclosed", n
                self.log.append(dict(t=round(self.talk.now(), 1), landing=n, id=e.id, what="foreclosed"))
                continue
            if named and tw and (ripest is None or jaccard(tw, e.parent_words) > jaccard(tw, ripest.parent_words)):
                ripest = e
        if named and ripest is not None:
            ripest.urge += 1.0
            ripest.named += 1
            self.log.append(dict(t=round(self.talk.now(), 1), landing=n, id=ripest.id, what="named by a person"))
        self.changed = True

    # ---- would it speak now

    def eligible(self, open_, named_recently):
        """Entries that would speak now, with the flags of both modes; the active mode picks."""
        thr, win = float(self.s["threshold"]), float(self.s["window"])
        out = []
        for e in self.entries.values():
            if not e.live:
                continue
            ready = e.urge >= thr and open_ > win
            spoken = ready and named_recently
            safety = e.safety and bool(self.s.get("safety", True))
            if ready or safety:
                out.append((e, dict(ready=ready, spoken_to=spoken, safety=safety)))
        out.sort(key=lambda x: -x[0].urge)
        return out

    def mark_would(self, e, flags, open_, mode):
        """A would-speak moment, recorded with the urge and the floor kept apart."""
        m = dict(t=round(self.talk.now(), 1), landing=self.talk.landing_count(), urge=round(e.urge, 3), open=round(open_, 2),
                 mode=mode, **flags)
        e.would.append(m)
        self.log.append(dict(t=m["t"], landing=m["landing"], id=e.id, what="would speak", urge=m["urge"], open=m["open"], **flags))
        self.changed = True
        return m

    def voiced(self, e, cell):
        e.state, e.voiced_at, e.voiced_by = "voiced", self.talk.landing_count(), cell
        self.log.append(dict(t=round(self.talk.now(), 1), landing=e.voiced_at, id=e.id, what=f"voiced by {cell}"))
        self.changed = True

    def cut(self, e, phrase_i, remainder, by):
        """A line cut short goes back as held, with what was left unsaid."""
        e.state = "withheld"
        e.cut = dict(at_phrase=phrase_i, remainder=remainder, by=by, t=round(self.talk.now(), 1))
        e.text = remainder or e.text
        e.words = words_of(e.text)
        self.log.append(dict(t=round(self.talk.now(), 1), landing=self.talk.landing_count(), id=e.id, what=f"cut at phrase {phrase_i} by {by}"))
        self.changed = True

    # ---- for the page and the record

    def snapshot(self):
        n = self.talk.landing_count()
        return [e.to_dict(n) for e in self.entries.values()]

    def counts(self):
        c = {s: 0 for s in STATES}
        for e in self.entries.values():
            c[e.state] += 1
        return c
