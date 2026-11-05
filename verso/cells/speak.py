"""Host side of speaking: a thought that may be spoken goes to the page a phrase at a time with the stop
rule the releasing cell set; a bid from the floor applies that rule and emits stop; a line cut short goes
back to the ledger as held. No audio here: the page speaks. In a replay the events are silent marks.
"""
import asyncio, re, time

SENTENCE_END = re.compile(r"[.?!]$")


def phrases(text):
    """Phrases as a voice would take them: at punctuation, and inside long spans at a conjunction."""
    parts = [p.strip() for p in re.split(r"(?<=[,;:.?!])\s+", text.strip()) if p.strip()]
    out = []
    for p in parts:
        ws = p.split()
        while len(ws) > 14:
            cut = next((i for i in range(6, len(ws) - 5) if ws[i] in ("and", "but", "so", "or", "because")), None)
            if cut is None:
                break
            out.append(" ".join(ws[:cut]))
            ws = ws[cut:]
        out.append(" ".join(ws))
    return out or [text.strip()]


class Speaker:
    def __init__(self, settings, talk, ledger, emit, silent):
        self.s, self.talk, self.ledger, self.emit, self.silent = settings, talk, ledger, emit, silent
        self.busy = False
        self.bid = None
        self.lines_in_a_row = 0
        self.spoken = []            # what was spoken or would have been, for the record
        self.acked = {}             # id -> the last phrase index the page reported spoken
        self.stopped_reports = []   # the page's stopped reports

    def on_bid(self, speaker):
        if self.busy:
            self.bid = speaker

    def on_spoken(self, eid, i):
        try:
            self.acked[eid] = max(self.acked.get(eid, -1), int(i))
        except (TypeError, ValueError):
            pass

    def on_person_word(self, w):
        if not self.busy:
            self.lines_in_a_row = 0

    def may_go_on(self):
        return self.lines_in_a_row < int(self.s.get("line_limit", 1))

    async def speak(self, e, cell):
        allowed = list(self.s["stop"]) or ["phrase"]
        rule = e.stop if e.stop in allowed else allowed[0]
        ps = phrases(e.say)
        self.busy, self.bid = True, None
        said, cut_at, by = [], None, None
        self.acked.pop(e.id, None)
        for i, ph in enumerate(ps):
            self.emit("speak", id=e.id, entry=e.id, cell=cell, phrase=ph, i=i, n=len(ps), last=(i == len(ps) - 1), stop=rule,
                      silent=self.silent, would=self.silent, mode=self.s.get("mode"), t=round(self.talk.now(), 1))
            end = time.time() + (0.3 * len(ph.split()) + 0.3) / self.talk.speed
            while time.time() < end:
                await asyncio.sleep(0.05)
                if self.acked.get(e.id, -1) >= i:      # the page's voice finished this phrase: go on at once
                    break
                if self.bid and rule == "at-once":
                    cut_at, by = i, self.bid
                    break
            if cut_at is not None:
                break
            said.append(ph)
            if self.bid and (rule == "phrase" or (rule == "sentence" and SENTENCE_END.search(ph))):
                if i + 1 < len(ps):
                    cut_at, by = i + 1, self.bid
                break
        self.busy = False
        if cut_at is not None:
            remainder = " ".join(ps[cut_at:])
            self.emit("stop", id=e.id, cell=cell, at_phrase=cut_at, by=by, rule=rule, silent=self.silent, t=round(self.talk.now(), 1))
            self.ledger.cut(e, cut_at, remainder, by)
            self.spoken.append(dict(id=e.id, cell=cell, said=said, cut_at=cut_at, by=by, rule=rule, t=round(self.talk.now(), 1)))
        else:
            self.ledger.voiced(e, cell)
            self.lines_in_a_row += 1
            self.spoken.append(dict(id=e.id, cell=cell, said=said, cut_at=None, by=None, rule=rule, t=round(self.talk.now(), 1)))
