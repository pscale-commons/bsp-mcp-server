#!/usr/bin/env python3
"""test_doorman.py — the character's doorman, proved without a network: the
origin match, the standpoint read off a real passport, the envelope grammar
(a fixture cut from the live Slip on 2026-09-16 with a staged window added),
the debt, the span, the fold's input, and the claim's outcome words — and a
party's fold (the group page): the party said as a person says it, judged as
one, each traveller known by name and look, one arrival by name, the landed
slot read off the commit.

Run: python3 genus-one/test_doorman.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import doorman_table as dt  # noqa: E402

PASS = 0
FAIL = 0


def check(cond, label):
    global PASS, FAIL
    if cond:
        PASS += 1
    else:
        FAIL += 1
        print("  ✗ " + label)


# ── where ────────────────────────────────────────────────────────────────────
check(dt.norm_origin("https://beach.happyseaurchin.com/w/brackenfoot-open/") == "beach.happyseaurchin.com/w/brackenfoot-open", "an origin normalises: scheme off, slash off")
check(dt.origin_matches("beach.happyseaurchin.com/w/brackenfoot-open", "https://beach.happyseaurchin.com/w/brackenfoot-open"), "the beach's Host-form origin matches the enrolment's URL")
check(not dt.origin_matches("beach.happyseaurchin.com", "https://beach.happyseaurchin.com/w/brackenfoot-open"), "the apex is not the table")
check(not dt.origin_matches("", "https://beach.happyseaurchin.com"), "no origin matches nothing")

UGARTH = {
    "_": "Ugarth — a hedge-soldier off a war, weathered and slow to anger and very hard once moved; honest steel.",
    "1": "Character Force ~8 overall; peak (~9) in a fight …",
    "2": "To find a quiet living somewhere the fighting is done — and the plain inability to walk past this once it is seen.",
    "3": "Broad and scarred and unhurried, moving like someone who has stood in a line and held it; a worn blade set aside by custom, not by weakness. Location: *:https://beach.happyseaurchin.com/w/brackenfoot-open:spatial:brackenfoot:211",
}
check(dt.standpoint(UGARTH) == ("https://beach.happyseaurchin.com/w/brackenfoot-open", "brackenfoot", "211"), "the standpoint reads table, world and digits off the Location line")
check(dt.standpoint_room(UGARTH) == "211", "the room a character stands in is the pool of its standpoint")
check(dt.standpoint_room({"_": "x", "3": "an appearance with no location"}) is None, "no Location line, no room")
check(dt.standpoint_room("a bare string") is None, "a malformed passport places nobody")

# ── addressed ────────────────────────────────────────────────────────────────
check(dt.mentions("\"Ferryman or guard — which are you?\" I ask Astrel.", "Astrel"), "a name spoken is a beat directed")
check(dt.mentions("ASTREL, over here", "astrel"), "case-blind")
check(not dt.mentions("the astral light", "Astrel"), "a word containing the name is not the name")
check(not dt.mentions("anyone?", "anon-1234"), "an anonymous hand is never addressed")
check(not dt.mentions("", "Ugarth"), "an empty beat addresses nobody")

# ── the envelope ─────────────────────────────────────────────────────────────
ENVELOPE = """pool:211 @ https://beach.happyseaurchin.com/w/brackenfoot-open

# Operating directive — the room's rules, authored by the designer; READ AND FOLLOW THIS EVERY TURN
GRIT — Group Resolution In Time: the engine.

# The place — spatial:brackenfoot:211 at https://beach.happyseaurchin.com/w/brackenfoot (REFERENCE)
[211] The crossing — a shallow stony ford where the good road gives out.
  [211.2] The watch — one hard-case, most hours, bored and half-asleep by the little fire on the near bank.

# The ways (public faces of the referenced master, addressed)
[210] The Slip — the ford where the good road ends.

# Co-present at your place (by appearance; names unearned until spoken)
HERE NOW: — Quick-eyed and easy, a pedlar's pack and a pedlar's patter.

# Liquid — pending intentions, not yet determined (2 authors; STAGE yours first — the fold gathers only what is staged)
- Astrel (arrived 2026-09-16T18:40:00.000Z (+0 — 2 beats ago)) @ 211: I step between the soldier and the watch. "He's with me."
- Ugarth (you) (arrived 2026-09-16T18:41:30.000Z (+0 — a beat ago), revised 2026-09-16T18:42:10.000Z (+0 — just now)): Ugarth says nothing: he lifts the rope.
window opened 2026-09-16T18:40:00.000Z — the stamp does not move; a resolution claims this window by passing it as resolves_window, WITH resolves_seen=<the newest arrived stamp above> as the guard.

# Window dice — each live intention's own luck for THIS window
- Astrel: positive 4, negative 2, luck +2
- Ugarth: positive 1, negative 7, luck -6

# Contributions since position 0 (count: 2)
## slot 2 — Ugarth [character] 2026-09-15T10:10:04.867Z (+2 — a day ago)
Please describe what I see around me.

## slot 3 — Ugarth [character] 2026-09-15T16:12:31.525Z (+2 — a day ago)
The watch — a thick-necked man — looks up from the coals when the question lands.

"Both," he says, flat.

# Marker
previous: 0
new:      3

now · 2026-09-16T18:48:02Z · 2026333281 · Wednesday 16 September 2026, evening (beat 1)"""

env = dt.parse_envelope(ENVELOPE)
check(env["place"].startswith("[211] The crossing") and env["ways"] == [{"addr": "210", "label": "The Slip — the ford where the good road ends.", "depth": 0}], "the place and the ways parse as the mirror parses them")
check(env["marker_new"] == 3 and env["raw"] == ENVELOPE, "the marker and the raw text ride along")
CAST = "# Co-present at your place (by appearance)\nHERE NOW:\n— Quick-eyed and easy, a pedlar's pack.\nABOUT (present today, not at the table):\n— A tall woman in a travel-stained cloak.\n"
cast = dt.parse_envelope(CAST)
check(cast["cast_here"] == ["Quick-eyed and easy, a pedlar's pack."] and cast["cast_about"] == ["A tall woman in a travel-stained cloak."], "the cast parses by grain, dash stripped")
check("[211] The crossing" in env["scene"] and "pedlar" in env["scene"] and "[210] The Slip" in env["scene"], "the scene is the place, the ways and the cast")
check(len(env["slips"]) == 2, "two slips parse")
check(env["slips"][0]["author"] == "Astrel" and env["slips"][0]["arrived"] == "2026-09-16T18:40:00.000Z" and env["slips"][0]["text"].startswith("I step between"), "a slip with an address and a nested age parses")
check(env["slips"][1]["author"] == "Ugarth" and env["slips"][1]["self"] and env["slips"][1]["arrived"] == "2026-09-16T18:41:30.000Z" and env["slips"][1]["revised"] == "2026-09-16T18:42:10.000Z", "the reader's own slip keeps its arrival and its revision, the (you) shed")
check(env["window_opened"] == "2026-09-16T18:40:00.000Z", "the window's open-stamp is read")
check(env["dice"] == [{"handle": "Astrel", "positive": 4, "negative": 2, "luck": 2}, {"handle": "Ugarth", "positive": 1, "negative": 7, "luck": -6}], "the dice parse, luck signed")
check(len(env["beats"]) == 2 and env["beats"][1]["slot"] == "3" and env["beats"][1]["text"].endswith("flat."), "the beats parse with their slots and multi-line text")
empty = dt.parse_envelope("# Liquid — pending intentions (0 authors)\n(no pending intentions)\n")

# ── the debt ─────────────────────────────────────────────────────────────────
check(dt.owed(env["slips"], "Astrel") is False and dt.owed(env["slips"], "Ugarth") is False, "both have staged — nobody is owed")
check(dt.owed(env["slips"][:1], "Ugarth") is True, "Astrel staged, Ugarth silent — Ugarth is owed a turn")
check(dt.owed([], "Ugarth") is False, "nothing staged, nothing owed")
check(dt.owed(env["slips"][1:], "Ugarth") is False, "only my own line stands — no debt")

# ── the span ─────────────────────────────────────────────────────────────────
t0 = dt.iso_epoch("2026-09-16T18:40:00.000Z")
check(t0 is not None and dt.fold_due("2026-09-16T18:40:00.000Z", t0 + 119, 120) is False, "a second short of the span, the doorman waits")
check(dt.fold_due("2026-09-16T18:40:00.000Z", t0 + 120, 120) is True, "at the span, the fold is due")
check(dt.fold_due("not a stamp", t0 + 999, 120) is False, "no stamp, no fold")

# ── the fold's input and the claim's outcome ─────────────────────────────────

# ── a move from words ────────────────────────────────────────────────────────
WAYS = [{"addr": "212", "label": "The village track.", "depth": 0}, {"addr": "2110", "label": "The far bank.", "depth": 1}]
check(dt.way_of("Ugarth takes the track up to the village.\nWAY 212", WAYS) == ("Ugarth takes the track up to the village.", WAYS[0], "212"), "the last line WAY <address> is stripped and names its way")
check(dt.way_of("He goes.\nway [2110].", WAYS)[1] == WAYS[1] and dt.way_of("He goes.\nWAY 21.10", WAYS)[1] == WAYS[1], "brackets, a stop, case and a decimal all read as the same address")
check(dt.way_of("He tries.\nWAY 999", WAYS) == ("He tries.", None, "999"), "an address the ways do not hold moves no one, and is said")
check(dt.way_of("The watch says no. He stays.", WAYS) == ("The watch says no. He stays.", None, None) and dt.way_of("", WAYS) == ("", None, None), "no WAY line, no move")
V = [{"addr": "100", "label": "The Village.", "depth": 0}]
check(dt.way_of("The track climbs away from the water into the dark.\n\nWAY pool:100", V) == ("The track climbs away from the water into the dark.", V[0], "100"), "'WAY pool:100' is read and leaves the record (the mirror's case, the Slip 2026-09-18)")
mid = dt.way_of("He crosses.\nWAY 100\nThe watch watches him go.", V)
check(mid[1] == V[0] and "WAY" not in mid[0] and "watches him go" in mid[0], "a WAY line anywhere is stripped; the prose around it stays")
check(dt.way_of("He goes.\nWAY the village", V) == ("He goes.", None, "WAY the village"), "a WAY line with no address moves no one, and still never reaches the record")
check(dt.way_of("Way up the slope a dog barks once and stops.", V) == ("Way up the slope a dog barks once and stops.", None, None), "prose that merely starts with the word is left alone")
P3 = "Broad and scarred. Location: *:https://beach.happyseaurchin.com/w/brackenfoot-open:spatial:brackenfoot:211"
moved = dt.swap_location(P3, "212")
check(moved == P3[:-3] + "212" and dt.location_stands_at(moved, "212") and not dt.location_stands_at(P3, "212"), "the location's address swaps, the rest untouched, and reads back")
check(dt.swap_location("an appearance with no location", "212") is None and dt.swap_location(None, "212") is None, "no located star-ref, nothing a move can rewrite")

# ── a party — the group page's characters, round one table ───────────────────
check(dt.names_said(["Ugarth"]) == "Ugarth" and dt.names_said(["Ugarth", "Astrel"]) == "Ugarth and Astrel" and dt.names_said(["Ugarth", "Astrel", "Reed"]) == "Ugarth, Astrel and Reed" and dt.names_said([]) == "", "a party is said the way a person says it")
check(dt.party_arriving_text(["Ugarth"], "The Sow.") == "Ugarth arrives — The Sow." and dt.party_arriving_text([], "The Sow.") == "Arrives — The Sow." and dt.party_arriving_text(["Ugarth", "Astrel"], "The Sow.") == "Ugarth and Astrel arrive — The Sow." and dt.party_arriving_text(["Ugarth", "Astrel"], "") == "Ugarth and Astrel arrive.", "a party lands one arriving beat, by name — alone too, since a listener hears no author")
check(dt.committed_slot("committed: slot 12 → pool:211 — window 2026 RESOLVED, your claim was first") == "12" and dt.committed_slot("[pool]\ncommitted: slot 4 → pool:100") == "4" and dt.committed_slot("window MOVED") is None, "the landed slot reads off the commit's own words")
PARTY_ENV = {"place": "[220] Holloway Wood.", "cast_here": ["Thin and grey-cloaked, a string of wooden beads at his wrist.", "Quick-eyed and easy, a pedlar's pack."], "cast_about": ["Thin and grey-cloaked, a string of wooden beads at his wrist"]}

# ── the room's law, read at the act's addresses ─────────────────────────────
LAW = {"_": "THE LAW.", "1": {"_": "THE TURN.", "1": "PERCEIVE.", "2": {"_": "RENDER.", "1": "close on what the player can do."}, "4": "COMMIT."}, "2": {"_": "RESOLVE.", "1": "luck."}}
check(dt.law_at(LAW, ("1.1", "1.2")) == "THE LAW.\n[1] THE TURN.\n[1.1] PERCEIVE.\n[1.2] RENDER.\n  [1.21] close on what the player can do.", "ancestors frame once, each addressed node carries its subtree, every line its address")
check(dt.law_at(LAW, ("1.4", "1.6", "2")) == "THE LAW.\n[1] THE TURN.\n[1.4] COMMIT.\n[2] RESOLVE.\n  [2.1] luck." and dt.law_at(LAW, ("7",)) == "" and dt.law_at(None, ("1",)) == "", "an address the block lacks is passed over; none held, nothing")
check(dt.parse_whole_block('[whole block]\n{"_": "x", "1": "y"}\n\nnow · 2026') == {"_": "x", "1": "y"} and dt.parse_whole_block("[point] x") is None, "the router's whole-block reply parses")
check(dt.claim_outcome("window MOVED — an intention staged after the mirror you read.") == "moved", "moved")
check(dt.claim_outcome("Window already resolved by Astrel — stand down.") == "resolved", "already resolved")
check(dt.claim_outcome("committed: slot 4 (your claim was first)") == "landed", "landed")
check(dt.claim_outcome("upstream error") == "unknown", "unknown")
ai = dt.act_input(env, "\"Which of you is the ferryman?\"", "Astrel", UGARTH["2"], "Ugarth")
check("[THE BEAT THAT RANG" in ai and "- Astrel: \"Which of you is the ferryman?\"" in ai and "[YOUR DRIVE]\nTo find a quiet living" in ai and ai.endswith("You are Ugarth. Output only your beat."), "the act input carries the scene, the record, the beat that rang, the window and the drive")

# ── presence ─────────────────────────────────────────────────────────────────
now = dt.iso_epoch("2026-09-16T18:50:00Z")
presence = {"_": "who is here", "1": {"_": "", "1": "Astrel", "2": "pool:211", "3": "2026-09-16T18:49:40Z"},
            "2": {"_": "", "1": "Ugarth", "2": "pool:211", "3": "2026-09-16T18:20:00Z"}}
check(dt.player_present(presence, "Astrel", now) is True, "a heartbeat twenty seconds old: the player is here")
check(dt.player_present(presence, "Ugarth", now) is False, "a heartbeat half an hour old: the player is away")
check(dt.player_present(presence, "ugarth", now + 3600) is False and dt.player_present(None, "Ugarth", now) is False, "case-blind; no presence block, nobody is here")

# ── behaviours, the rendering's place, the beats since ──────────────────────
check(dt.parse_behaviours("commit render") == frozenset({"commit", "render"}), "the words parse")
check(dt.parse_behaviours("") == dt.DEFAULT_BEHAVIOURS and dt.parse_behaviours(None) == dt.DEFAULT_BEHAVIOURS and dt.parse_behaviours("nothing known here") == dt.DEFAULT_BEHAVIOURS, "absent or unknown: the page player's default, commit and render")
check(dt.parse_behaviours("act") == frozenset({"act"}), "act alone means act alone")
check(dt.parse_behaviours("every commit") == frozenset({"act", "every", "commit"}), "every implies act")
check(dt.parse_behaviours({"_": "render, commit — the holder's words"}) == frozenset({"commit", "render"}), "a position with children reads at its underscore; punctuation shed")
GLOSS = " — this doorman's behaviours: render (the moment to my account after every commit), commit (make it happen when I instruct it, and after the span when it staged), act (take my turn while I am away; 'every' for every beat). Holder-set; mine to change."
check(dt.parse_behaviours("render commit" + GLOSS) == frozenset({"commit", "render"}), "the gloss after the dash is not the holder's words — the mirror's own seed line reads as render and commit, never act or every (wake:Ugarth, 2026-09-17)")
check(dt.parse_behaviours("render commit act every" + GLOSS) == frozenset({"act", "every", "commit", "render"}), "words before the dash all count")
check(dt.parse_behaviours("none" + GLOSS) == frozenset(), "none before the dash means none, never the default")
account = {"_": "Ugarth's account",
           "1": {"_": "first", "1": "Ugarth", "2": "pool:211:3", "3": "2026-09-16T10:00:00Z"},
           "2": {"_": "second", "1": "Ugarth", "2": "pool:211:7", "3": "2026-09-16T11:00:00Z"},
           "3": {"_": "elsewhere", "1": "Ugarth", "2": "pool:212:9", "3": "2026-09-16T12:00:00Z"},
           "4": {"_": "legacy", "1": "Ugarth", "2": "pool:211", "3": "2026-09-16T13:00:00Z"}}
nr = dt.newest_account_render(account, "211")
check(nr is not None and nr["slot"] == "7" and nr["text"] == "second", "the newest placed rendering for the room; another room and a legacy entry passed over")
check(dt.newest_account_render({"_": account, "1": {"_": "after the wrap", "2": "pool:211:12", "3": "2026-09-16T14:00:00Z"}}, "211")["slot"] == "12", "a wrapped era is walked")
check(dt.newest_account_render(None, "211") is None and dt.newest_account_render(account, "999") is None, "no account, or none for the room: None")
VILLAGE_BEATS = [{"slot": "1", "author": "Ugarth", "ts": "2026-09-18T11:22:16.157Z", "text": "Arrives — The Village."}]
stray = {"_": "acct", "1": {"_": "The lane holds you like a throat.", "1": "Ugarth", "2": "pool:100:1", "3": "2026-09-18T10:20:26.545Z"}}
check(dt.newest_account_render(stray, "100", VILLAGE_BEATS) is None, "a telling older than the beat at its slot tells another moment: it covers nothing (the mirror's case, the village 2026-09-18)")
check(dt.newest_account_render({"1": dict(stray["1"], **{"3": "2026-09-18T11:23:02Z"})}, "100", VILLAGE_BEATS)["slot"] == "1", "a telling made after the beat covers it")
check(dt.newest_account_render({"1": dict(stray["1"], **{"3": "2026-09-18T11:21:40Z"})}, "100", VILLAGE_BEATS)["slot"] == "1" and dt.newest_account_render(stray, "100")["slot"] == "1", "a minute of clock disagreement is allowed; no beats given, the slot alone decides as before")
founded = {"_": "Ugarth's own account", "1": {"_": "I crossed and kept my counsel.", "1": "Ugarth", "2": "211", "3": "2026-09-17T12:00:00Z"}}
later = {"_": "history", "1": {"_": "after", "1": "Ugarth", "2": "pool:211:9", "3": "2026-09-17T12:30:00Z"}}
check(dt.newest_account_render([later, account], "211")["slot"] == "9" and dt.newest_account_render([None, account], "211")["slot"] == "7", "the newest across the organs by stamp; an organ that does not stand is passed over")
check(dt.covers({"slot": "12"}, "9") and dt.covers({"slot": "4"}, "4") and not dt.covers({"slot": "9"}, "11") and not dt.covers(None, "4"),
      "a kept rendering covers a beat at or before its slot, in digit-path order; nothing kept covers nothing")
beats = [{"slot": s_, "author": "x", "text": "t" + s_} for s_ in ("1", "2", "9", "11", "12")]
mixed = [{"slot": "1", "author": "Astrel", "text": "before"}, {"slot": "2", "author": "Ugarth", "text": "Arrives — The crossing."}, {"slot": "3", "author": "Astrel", "text": "after"}]

# ── F35: a player at the table renders their own moment ─────────────────────
check(dt.render_due(frozenset({"render", "commit"}), False) is True, "render on, player away: the doorman renders")
check(dt.render_due(frozenset({"render", "commit"}), True) is False, "render on, player at the mirror: the doorman stands down")
check(dt.render_due(frozenset({"commit"}), False) is False, "render off: nothing to render, present or not")

# ── the summary an account owes (block-conventions 3.5) ─────────────────────
E = lambda i, loc: {"_": "telling %s" % i, "1": "Ugarth", "2": loc, "3": "2026-09-18T10:%02d:00Z" % int(str(i)[-1])}
UGARTH_ACCOUNT = {"_": {"_": "witnessed:Ugarth at the table.", "1": "Came down to the Slip.", **{str(i): E(i, "pool:211:%d" % i) for i in range(2, 9)}, "9": "lock"},
                  "1": {str(i): E("1%d" % i, "pool:100:%d" % i) for i in range(1, 8)}}
dues = dt.owed_summaries(UGARTH_ACCOUNT)
check([a for a, _e in dues] == ["10"] and [r for r, _e in dues[0][1]] == [str(i) for i in range(1, 10)], "a wrapped account with an unvoiced 1 owes 10, over the nine before the wrap at read-addresses 1-9 (witnessed:Ugarth, 2026-09-18)")
voiced = dict(UGARTH_ACCOUNT, **{"1": dict(UGARTH_ACCOUNT["1"], _="the span 1-9, paid")})
check(dt.owed_summaries(voiced) == [], "a voiced container owes nothing")
two = dict(UGARTH_ACCOUNT, **{"2": {"1": E("21", "pool:100:9")}})
check([a for a, _e in dt.owed_summaries(two)] == ["10", "20"] and [r for r, _e in dt.owed_summaries(two)[1][1]][:2] == ["11", "12"], "two unvoiced spans are owed oldest first; 20 stands over 11-19")
check(dt.owed_summaries({"_": "flat", "1": "a"}) == [] and dt.owed_summaries(None) == [] and dt.owed_summaries({"_": {"_": {"_": "floor three"}}, "1": {"1": "x"}}) == [], "an account that never wrapped owes nothing; floor three is not this reader's")
si = dt.summary_input("10", dues[0][1], "Ugarth")
check(si.startswith("[THE NINE — the span the voicing at 10 stands for, in Ugarth's account]") and "[1]\nCame down to the Slip." in si and "[2] pool:211:2 · 2026-09-18T10:02:00Z\ntelling 2" in si and "lock" not in si and si.endswith("You are writing the voicing at 10."), "the nine arrive at their read-addresses with the beat each tells; the latch mark is no entry")
sd = dt.summary_directive("[3.5] Zero-slots are the summaries.")
check(sd.startswith("[THE LAW — the account's own, at the address of this act]\n[3.5] Zero-slots are the summaries.") and "ONE substantive paragraph in the zeroth person" in sd and "read-addresses" in sd, "the summary is written under the law at 3.5, then the call")

# ── re-enrolment keeps what the caller did not mention ───────────────────────
# A page re-keys a character's doorman when the passport's key has changed since
# enrolment: it names the handle, the new key, the mode and the table — never the
# holder's deposited fuel or notify address, which must survive the re-key.
import waker  # noqa: E402


# ── one mind per act, the keeper's own, and a frame laid to be kept ──────────
# (proposal 2026-09-21-what-a-person-pays-for). Read off the REAL dial class,
# before the enrolment tests below put a stub in its place.
RealDial = waker.Dial
_kept = (waker.enrolment, waker.enrolment_beach, waker.beach_get)


def dial_of(block):
    waker.enrolment = lambda h: {"dial": "", "beach": "https://beach.test/w/t"}
    waker.enrolment_beach = lambda h: "https://beach.test/w/t"
    waker.beach_get = lambda name, beach=None: block
    return RealDial("Ugarth")


plain = dial_of({"1": "on", "7": "sonnet — the mind that answers here"})
check(plain.answer_with("svc", 4000) == ("claude-sonnet-5", 4000), "position 7 as a line still names the mind for every act")
check(plain.answer_with("svc", 4000, act="render") == ("claude-sonnet-5", 4000), "an act the holder did not name keeps 7's own word")
check(plain.answer_with(waker.KEEPER_MODEL, 1200, act="keeper", general=False) == ("claude-haiku-4-5-20251001", 1200),
      "THE KEEPER NEVER WEARS THE GENERAL MIND: a dial that says sonnet still gets the cheap keeper")
named = dial_of({"1": "on", "7": {"_": "sonnet — the mind that answers here", "1": "keeper sonnet — I want the world sharp",
                                  "2": "render haiku 900", "3": "commit claude-opus-4-8, 3000", "4": "a line of prose only"}})
check(named.answer_with(waker.KEEPER_MODEL, 1200, act="keeper", general=False) == ("claude-sonnet-5", 1200), "'keeper sonnet' beneath 7 is the holder's word for the keeper, prose after it ignored")
check(named.answer_with("svc", 4000, act="render") == ("claude-haiku-4-5-20251001", 900), "'render haiku 900' names the telling's mind and its ceiling")
check(named.answer_with("svc", 4000, act="commit") == ("claude-opus-4-8", 3000), "a model id and a ceiling after a comma read too")
check(named.answer_with("svc", 4000, act="act") == ("claude-sonnet-5", 4000) and named.answer_with("svc", 4000) == ("claude-sonnet-5", 4000), "an unnamed act, and no act, keep 7's own word")
check(dial_of({"1": "on"}).answer_with("svc", 4000, act="render") == ("svc", 4000), "a dial with no 7 falls to the service default")
check(dial_of({"1": "on", "9": {"_": "render commit", "1": "keeper opus 99999"}}).answer_with("x", 1200, act="keeper", general=False) == ("claude-opus-4-8", 8000), "a ceiling is held inside the doorman's bounds")

# THE MIND MOVED BENEATH 9 (David, 2026-09-21: the flow switch and the mind were
# found sharing position 7, and he ruled the doorman's the one to move).
moved = dial_of({"1": "on", "7": "sonnet — the mind that answers here", "9": {"_": "render commit — this doorman's behaviours", "1": "mind basic — set at /models", "2": "keeper sonnet"}})
check(moved.answer_with("svc", 4000) == ("claude-haiku-4-5-20251001", 4000), "what stands beneath 9 outranks what a dial still says at 7 — and 'basic' is a word the doorman knows")
check(moved.answer_with(waker.KEEPER_MODEL, 1200, act="keeper", general=False)[0] == "claude-sonnet-5", "the keeper's own line beneath 9 is heard")
check(moved.behaviours == dial_of({"9": "render commit — this doorman's behaviours"}).behaviours, "and the behaviours read the same whether 9 is a line or a node")
flow = dial_of({"1": "on", "7": "on — publish my window composition to flow:egg-one while this reads on", "9": "render"})
check(flow.answer_with("svc", 4000) == ("svc", 4000), "A FLOW SWITCH AT 7 IS NOT A MODEL CALLED 'on': a genus agent's dial falls to the service default")
check(not waker.Dial.is_mind("on — publish my window composition") and not waker.Dial.is_mind("off") and not waker.Dial.is_mind("") and not waker.Dial.is_mind("moved — see beneath 9"), "a switch, nothing, a pointer: none is a mind")
check(all(waker.Dial.is_mind(x) for x in ["haiku", "Sonnet 2000", "basic — set at /models", "claude-opus-4-8, 3000", "the mind that answers here — a nickname"]), "a nickname, a tier, a model id, or prose that says it is the mind")
_dialblock = {"_": "THE DIAL", "9": {"_": "render commit — old gloss", "1": "mind sonnet — the general", "2": "keeper opus"}}
waker.beach_get = lambda name, beach=None: _dialblock
check(waker.nine_with("Ugarth", "") == _dialblock["9"], "position 9 written back untouched is position 9")
n = waker.nine_with("Ugarth", "", says="render — new gloss")
check(n == {"_": "render — new gloss", "1": "mind sonnet — the general", "2": "keeper opus"}, "A BEHAVIOUR TOGGLED KEEPS EVERY MIND BENEATH IT (a line written at a node replaces it — this is what would have wiped them)")
n = waker.nine_with("Ugarth", "", mind="mind haiku — new")
check(n == {"_": "render commit — old gloss", "1": "mind haiku — new", "2": "keeper opus"}, "and a new general mind replaces the old one, the behaviours and the keeper standing")
waker.beach_get = lambda name, beach=None: {"_": "THE DIAL", "9": "render commit — a plain line"}
check(waker.nine_with("Ugarth", "", says="act — toggled") == "act — toggled", "a 9 with nothing beneath it goes back as the plain line it was")
check(waker.nine_with("Ugarth", "", mind="mind basic") == {"_": "render commit — a plain line", "1": "mind basic"}, "and grows its first line beneath when a mind is named")
waker.beach_get = lambda name, beach=None: {"_": "a procedure", "8": {"_": "THE DIAL, nested", "9": {"_": "render", "1": "keeper sonnet"}}}
check(waker.nine_with("weft", "wake:weft:8", says="none") == {"_": "none", "1": "keeper sonnet"}, "a dial nested inside another block is walked to where it stands")

waker.enrolment, waker.enrolment_beach, waker.beach_get = _kept

FRAME = "[THE KEEPER'S REGISTER]\nthe arc\n\n[THE WORLD'S RULES]\nrules\n\n" + dt.KEEPER_TABLE_MARK + "\n\n[THE PLACE, HELD]\nthe green\n\n" + dt.KEEPER_ROOM_MARK + "\n\n[THE STORY SO FAR]\nbeat"
table, here, moment = dt.keeper_frame(FRAME)
check(table.startswith("[THE KEEPER'S REGISTER]") and table.endswith(dt.KEEPER_TABLE_MARK), "the table's part runs to its mark, the mark still standing")
check(here.startswith("[THE PLACE, HELD]") and here.endswith(dt.KEEPER_ROOM_MARK), "the room's part runs to its mark")
check(moment == "[THE STORY SO FAR]\nbeat", "and the moment is everything after")
check("\n\n".join([table, here, moment]) == FRAME, "nothing is lost or reordered: the three parts ARE the frame")
check(dt.keeper_frame("[THE STORY SO FAR]\nbeat") == ("", "", "[THE STORY SO FAR]\nbeat"), "a frame from an older router comes back whole as the moment")
check(dt.keeper_frame(None) == ("", "", ""), "and no frame is no parts")
_tiers = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "tools", "tiers.ts"), encoding="utf-8").read()
check(("KEEPER_TABLE_MARK = '%s'" % dt.KEEPER_TABLE_MARK) in _tiers and ("KEEPER_ROOM_MARK = '%s'" % dt.KEEPER_ROOM_MARK) in _tiers,
      "the two marks are the router's own words, letter for letter (src/tools/tiers.ts)")

STANDING = ["the soldier at the fence rail", "the second soldier", "the day"]
check(dt.standing_label("soldier at fence", STANDING) == "the soldier at the fence rail", "a drifted label takes the standing voice's label, letter for letter")
check(dt.standing_label("second soldier", STANDING) == "the second soldier" and dt.standing_label("The Day", STANDING) == "the day", "articles and case aside")
check(dt.standing_label("the soldier", STANDING) == "the soldier", "a label that fits two standing voices stands as written — never a guess")
check(dt.standing_label("the alewife", STANDING) == "the alewife" and dt.standing_label("the day", STANDING) == "the day" and dt.standing_label("x", []) == "x", "a new person, an exact label, an empty window: as written")
kl = dt.keeper_lines("Here is what the world does:\n**WORLD · the day · 100 · the cloud comes down.**\n- WORLD the alewife · 120 · wipes the trestle\n> DROP: the boy · 120\nThe first soldier reaches him and takes his arm, and the second one laughs.", places={"100": 1, "120": 1}, room="100")
check([v["who"] for v in kl["world"]] == ["the day", "the alewife"] and kl["world"][0]["intends"] == "the cloud comes down.", "a line's dressing is forgiven — bold stars, a list dash, a dot after the keyword")
check(kl["drop"] == [{"who": "the boy", "at": "120"}], "a quoted DROP with a colon reads too")
check(len(kl["world"]) == 2, "and prose that tells the scene is still a line the world does not do")

check(waker.kept_system("the law", []) == "the law" and waker.kept_system("the law", ["", "  "]) == "the law", "nothing kept: the system text goes as plain text, as it always has")
ks = waker.kept_system("the law", ["the table", "", "the room"])
check([b["text"] for b in ks] == ["the law", "the table", "the room"] and "cache_control" not in ks[0], "kept parts stand after the law, each a block of its own; the empty one is passed over")
check(all(b.get("cache_control") == {"type": "ephemeral", "ttl": "1h"} for b in ks[1:]), "each kept part closes with a cache mark — an hour, because a table's beats come minutes apart")
_sent = {}


class _Reply:
    def __enter__(self): return self
    def __exit__(self, *a): return False
    def read(self): return json.dumps({"content": [{"type": "text", "text": "WORLD the day · 100 · rain"}], "usage": {"input_tokens": 5100, "cache_read_input_tokens": 10600, "output_tokens": 180}}).encode()


import json  # noqa: E402
_real_urlopen = waker.urllib.request.urlopen
waker.urllib.request.urlopen = lambda req, timeout=0: (_sent.update(json.loads(req.data.decode())), _Reply())[1]
_spent = {}
_said = waker.model_call("sk-test", "claude-haiku-4-5-20251001", 1200, "the law", "the moment", kept=["the table", "the room"], usage=_spent)
waker.urllib.request.urlopen = _real_urlopen
check(_said == "WORLD the day · 100 · rain" and _sent["messages"] == [{"role": "user", "content": "the moment"}], "the moment alone rides as the message")
check(isinstance(_sent["system"], list) and len(_sent["system"]) == 3 and _sent["model"] == "claude-haiku-4-5-20251001", "the law and the kept frame ride as the system")
check(_spent.get("cache_read_input_tokens") == 10600 and waker.usage_said(_spent) == "in 5.1k (+10.6k read from the kept frame) · out 0.2k", "what the API counted is said plainly, the kept part named")
check(waker.usage_said({}) == "in 0.0k · out 0.0k" and waker.usage_said(None) == "", "and nothing counted says nothing")
check("thinking" not in _sent, "a mind that does not think unasked is sent nothing about thinking")
waker.urllib.request.urlopen = lambda req, timeout=0: (_sent.update(json.loads(req.data.decode())), _Reply())[1]
waker.model_call("sk-test", "claude-sonnet-5", 1200, "the law", "the moment", plain=True)
check(_sent.get("thinking") == {"type": "disabled"}, "a plain call to a mind that thinks unasked says so — it once spent the whole ceiling thinking and wrote nothing")
_sent.pop("thinking", None)
waker.model_call("sk-test", "claude-sonnet-5", 4000, "the law", "the moment")
check("thinking" not in _sent, "and a call that is not plain leaves the mind to think as it will")
waker.urllib.request.urlopen = _real_urlopen


def enrol(body, prior):
    saved, out = {}, {}
    waker._store_load = lambda: {k: dict(v) for k, v in prior.items()}
    waker._store_save = lambda s: saved.update(s)
    waker.verify_shell_key = lambda h, p, beach=None: (True, "proven")
    waker.set_consent = waker.set_answer = waker.set_behaviours = lambda *a, **k: ""
    waker.Dial = type("StubDial", (), {"__init__": lambda self, h: setattr(self, "on", False)})
    hd = waker.Handler.__new__(waker.Handler)
    hd._body = lambda: body
    hd._send = lambda code, obj: out.update(code=code, obj=obj)
    hd._enroll(False)
    return out, saved.get(body.get("handle"), {})


PRIOR = {"Ugarth": {"secret": "old-key", "fuel": "sk-holders-own", "notify": "holder@example.org", "mode": "character",
                    "dial": "wake:Ugarth", "beach": "https://beach.happyseaurchin.com/w/brackenfoot-open"}}
rekey = {"handle": "Ugarth", "passphrase": "new-key", "mode": "character", "beach": "https://beach.happyseaurchin.com/w/brackenfoot-open"}
out, rec = enrol(rekey, PRIOR)
check(out.get("code") == 200 and rec.get("secret") == "new-key", "a re-key from a page stores the new key")
check(rec.get("fuel") == "sk-holders-own" and rec.get("notify") == "holder@example.org", "a re-key keeps the holder's deposited fuel and notify address")
check(rec.get("dial") == "wake:Ugarth" and rec.get("mode") == "character", "a re-key keeps the dial and the mode")
out, rec = enrol(dict(rekey, fuel=""), PRIOR)
check(rec.get("fuel") == "", "fuel named empty still clears — nothing becomes unsettable")
out, rec = enrol(dict(rekey, fuel="sk-new"), PRIOR)
check(rec.get("fuel") == "sk-new", "fuel named is fuel replaced")
out, rec = enrol(rekey, {})
check(rec.get("fuel") == "" and rec.get("notify") == "", "a first enrolment without fuel has none")

# ── the tier call, as the router composes it ────────────────────────────────

TIER = """# THE CALL — make it happen at pool:130, https://beach.test/w/t (medium)

[THE LAW — the room's own, at the addresses of this act]
[1.4] COMMIT is the act.

[THIS CALL] You are the voice that makes the moment happen.

# THE INPUT

[THE PLACE — where it happens]
[130] The Long House.

[THE WINDOW — what stands staged for this moment, verbatim, by author]
- Garth: I keep the door.

# THE CLAIM

resolves_window: 2026-09-19T15:57:00.000Z
resolves_seen: 2026-09-19T15:57:30.000Z
way: [150] The Store — the tithe-barn, padlocked.
way: [100] The Village — a muddy scatter.
actor: garth — Garth
actor: equinox — Equinox
"""

sec = dt.tier_sections(TIER)
check(sorted(sec) == ["CALL", "CLAIM", "INPUT"], "the tier reply splits into its own sections")
check(sec["CALL"].startswith("[THE LAW") and "[THIS CALL]" in sec["CALL"] and sec["INPUT"].startswith("[THE PLACE"), "the call is the system text, the input the message")
check(dt.tier_sections("nothing new to tell Ugarth at pool:120") == {}, "a plain answer carries no sections, and says so by being empty")
cl = dt.claim_of(sec["CLAIM"])
check(cl["window"] == "2026-09-19T15:57:00.000Z" and cl["seen"] == "2026-09-19T15:57:30.000Z", "the claim's stamps ride the call")
check([w["addr"] for w in cl["ways"]] == ["150", "100"] and cl["ways"][0]["label"].startswith("The Store"), "the ways a WAY line may name, in the envelope's order")
check(cl["actors"] == [("garth", "Garth"), ("equinox", "Equinox")], "the actors, handle and name")
check(dt.claim_of("resolves_window: none\nresolves_seen: none")["window"] is None, "no window standing reads as none, never as the word")
SEAT = "a seat that is its own door: commit the beat with pscale_pool_engage(contribution=<the beat>, resolves_window and resolves_seen as above, each left out where it reads none). A closing WAY line is WALKED, never committed."
withseat = dt.claim_of("resolves_window: 2026-09-19T15:57:00.000Z\nresolves_seen: 2026-09-19T15:57:30.000Z\nway: [150] The Store\nactor: garth — Garth\n" + SEAT)
check(withseat["window"] == "2026-09-19T15:57:00.000Z" and [w["addr"] for w in withseat["ways"]] == ["150"] and withseat["actors"] == [("garth", "Garth")],
      "the line a seat that is its own door reads is passed over by the doorman's own parser")
check(dt.journal_of("organ: witnessed:Ugarth\nlocation: pool:120:8\ncovers: 7 8\na seat that is its own door: keep the telling by bsp(block=<organ>, append=true, content={_: <the telling>, 2: <location>})") ==
      {"organ": "witnessed:Ugarth", "location": "pool:120:8"}, "and so is the journal's")
check(dt.writes_of("room: 130\ncharacter: garth — Garth\nplace: [130] The Long House\nplace: [150] The Store") ==
      {"room": "130", "characters": ["garth"], "places": ["130", "150"], "sheets": {}}, "the keeper's writes name the room, its characters and the places")
check(dt.writes_of("room: 130\ncharacter: garth — Garth\nsheet: garth — through 2026-09-19T15:57:30.000Z")["sheets"] ==
      {"garth": "2026-09-19T15:57:30.000Z"}, "and, per sheet owed a keeping, how far into the story the keeping reaches")
check(dt.journal_of("organ: witnessed:Ugarth\nlocation: pool:120:8\ncovers: 7 8") == {"organ": "witnessed:Ugarth", "location": "pool:120:8"}, "a telling knows its organ and the beat it covers")
check(dt.journal_of("organ: history:new (none stands — genesis founds it)\nlocation: pool:1:1")["organ"] == "history:new", "an organ yet to be founded still names itself")

# ── what the keeper writes, read off its own lines ──────────────────────────

KEEPER = """WORLD the alewife · 120 · wipes the same patch of trestle · and does not look up
WORLD the day · 120 · goes grey at the window
DROP the boy on the watch · 130
WHERE equinox · 150
WORLD a figure · 999 · stands where the world has no such place
not a line the keeper writes
WORLD half a line · 120
"""
kl = dt.keeper_lines(KEEPER, places=["120", "130", "150"], room="120")
check([v["who"] for v in kl["world"]] == ["the alewife", "the day", "a figure"], "every world line is read, and a line that is not one is passed over")
check(kl["world"][0]["intends"] == "wipes the same patch of trestle · and does not look up", "an intention keeps any dot of its own")
check(kl["world"][2]["at"] == "120", "a voice set at an address the world does not carve waits where the characters stand instead")
check(kl["drop"] == [{"who": "the boy on the watch", "at": "130"}] and kl["where"] == [{"handle": "equinox", "at": "150"}], "a voice withdrawn, and a character the story carried elsewhere")
check(dt.keeper_lines("WORLD x · 120 · y", places=["130"], room=None)["world"] == [], "with nowhere to put it, a voice is not staged at all")
check(dt.holds_lines("HOLDS a worn blade · his own · at his hip\n- HOLDS reeds · cut at the bank · slung\nHOLDS <the thing> · x · y\nprose") ==
      ["a worn blade · his own · at his hip", "reeds · cut at the bank · slung"], "the holds are the lines that carry a thing; the shape's own example is not one")
hn = dt.holds_node("Equinox", ["the crystal · hers · stowed in her cloak", "a satchel · hers · at her hip"])
check(hn["1"].startswith("the crystal") and hn["2"].startswith("a satchel") and "Equinox" in hn["_"] and "grit 3.1" in hn["_"], "holds land at passport 4, one line per thing, voiced above them")
check(len(dt.holds_node("X", ["a"] * 12)) == 10, "nine things at most — a tenth is a stash, not a sheet")
check(dt.holds_node("X", ["a"], "2026-09-19T15:57:30.000Z")["_"].endswith("(grit 3.1). Kept through 2026-09-19T15:57:30.000Z."), "a keeping closes the voicing with how far it reached, so the next is framed with the beats since")
check("Kept through" not in dt.holds_node("X", ["a"])["_"], "and a router that names no reach leaves the voicing as it was")
check(dt.name_of({"_": "Equinox — a self-named magic worker"}, "equinox") == "Equinox" and dt.name_of({"_": "no dash"}, "garth") == "garth" and dt.name_of(None, "moss") == "moss", "the name a character goes by, else the handle")


# ── the telling held to its moment (2026-09-22) ──────────────────────────────
BEAT2 = ("Ugarth looks at the man \u2014 the half-buttoned coat, the red face \u2014 and gives him what he gave the soldiers at the "
         "rail: nothing extra, nothing pressed.\n\n\u201cYou've got the place locked down,\u201d he says. \u201cWell done.\u201d He lets a "
         "moment settle between them. \u201cWhat problem do you face?\u201d\n\n\u201cProblem.\u201d He repeats the word. \u201cYou'd best come "
         "in out of the cold,\u201d he says, and stands back from the door, and the warmth of the Long House opens behind him.")
OVERRAN = ("The warmth hits you first. Vane pulls the door behind you. The counting-room opens to the left: the factor bent "
           "over it, grey-toothed.\n\n\u201cYou're not ground-work,\u201d he says. Not an accusation.\n\nWhat do you do?")
HELD = ("You give him what you gave the soldiers at the rail: nothing extra, nothing pressed. \u201cYou've got the place locked "
        "down,\u201d you say. \u201cWell done.\u201d The cold finds its way between the words. \u201cWhat problem do you face?\u201d\n\n"
        "\u201cProblem.\u201d He repeats the word like a man checking his belt. \u201cYou'd best come in out of the cold,\u201d he says, "
        "and stands back from the door.")
KNOWN = ("[WHERE YOU ARE] [130] The Long House. [131] The counting-room. [131.1] a factor: knee-high and hunched, grey-toothed. "
         "Here with you, by appearance: Sergeant Vane. You are Ugarth.")
check(dt.quoted_spans(BEAT2) == ["You've got the place locked down,", "What problem do you face?", "You'd best come in out of the cold,"],
      "the spoken lines of a beat, in order, the short ones left")
check(dt.quoted_spans('He said "no" and then "come in out of the cold, man" and left') == ["come in out of the cold, man"], "straight quotes pair in turn")
f = dt.telling_faults(OVERRAN, [BEAT2], KNOWN)
check([k for k, _ in f] == ["begins-after", "invents"] and "You're not ground-work" in f[1][1], "slot 35 against beat 2: it began after the beat and invented the sergeant's next line")
check(dt.telling_faults(HELD, [BEAT2], KNOWN) == [], "a telling that quotes the moment and adds nothing holds")
check(dt.telling_faults("The word lands on him. \u201cYou'd best come in out of the cold,\u201d he says.", [BEAT2], KNOWN) == [("begins-after", "it skips a beat's first spoken line, \u201cYou've got the place locked down,\u201d")],
      "a telling that opens on the world's answer skips the player's own line \u2014 the lesser fault")
check(dt.keep_anyway([("begins-after", "x")]) and not dt.keep_anyway([("begins-after", "x"), ("invents", "y")]), "a second telling that only skips a line is kept; one that still invents is not")
check(dt.coined_names("Sergeant Vane comes out into the grey morning. Behind him Pell counts. The Long House stands.",
                      "the sergeant at the door; Ugarth; the Long House; Brackenfoot") == ["Vane", "Pell"], "a coined name beside a role word and the frame's own names")
check(dt.coined_names("Vane comes out. Then Vane again, and Vane once more.", "nothing") == ["Vane"], "a word opening a sentence is left alone, and one coined name is named once")
check(dt.telling_faults("Ugarth nods. \u201cYou've got the place locked down,\u201d he says, and Haldan watches from the shutter.", [BEAT2], KNOWN) == [("coins", "it names someone the moment has not named: Haldan")], "a name the moment has not said is a coin")
inp = ("# THE INPUT\n\n[WHERE YOU ARE]\n[130] The Long House\n\n[THE MOMENT \u2014 what has just happened; tell it whole]\n- Ugarth: " + BEAT2 +
       "\n- the day: The light goes.\n\nYou are Ugarth.\n[THE MOMENT ENDS HERE.]")
check(dt.moment_beats(inp) == [BEAT2, "The light goes."], "the moment's beats are read off the frame, each whole, the run-on lines kept")
check(dt.record_as_telling([BEAT2, "The light goes."]) == BEAT2 + "\n\nThe light goes.", "the record as the telling of last resort")
check(dt.not_kept(f).startswith("[YOUR FIRST TELLING WAS NOT KEPT \u2014 it skips a beat's first spoken line") and dt.not_kept("names someone the moment has not named: Vane", "beat").startswith("[NOT KEPT \u2014 the beat names someone"), "the line beneath a frame asked again names the fault")
kn = dt.known_lines("WORLD the sergeant \u00b7 130 \u00b7 steps back\nKNOWN Sergeant Vane \u00b7 the sergeant at the Long House door \u00b7 Sergeant Bole \u00b7 the soldiers' word for him, and nobody corrects it\n**KNOWN \u00b7 Pell \u00b7 the factor \u00b7 none \u00b7 a name said aloud**\nKNOWN short \u00b7 line")
check(kn == [{"name": "Sergeant Vane", "face": "the sergeant at the Long House door", "held": "Sergeant Bole", "how": "the soldiers' word for him, and nobody corrects it"},
             {"name": "Pell", "face": "the factor", "held": None, "how": "a name said aloud"}], "KNOWN lines, dressed and plain, four fields each; a short one is not kept")
e = dt.names_entry(kn[0], "130", "2026-09-22T15:00:00Z")
check(e["_"] == "Sergeant Vane \u2014 the sergeant at the Long House door; the soldiers' word for him, and nobody corrects it" and e["5"] == "held: Sergeant Bole" and e["2"] == "130" and e["4"] == "designer", "an entry of names:scene: the name and face at the underscore, the held name at 5")
check("5" not in dt.names_entry(kn[1], "130", "t"), "no held name, no 5")
check(dt.names_standing({"_": "NAMES", "1": e, "2": "Old Burr \u2014 the charcoal-burner; his own"}) == {"sergeant vane", "old burr"}, "the names already standing, so a KNOWN is never written twice")
check(dt.keeper_lines("KNOWN Sergeant Vane \u00b7 the sergeant \u00b7 Sergeant Bole \u00b7 how", places=["130"], room="130") == {"world": [], "drop": [], "where": []}, "a KNOWN line is nothing to the WORLD / DROP / WHERE reader")

print("test_doorman: %d passed, %d failed" % (PASS, FAIL))
sys.exit(1 if FAIL else 0)
