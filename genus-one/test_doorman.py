#!/usr/bin/env python3
"""test_doorman.py — the character's doorman, proved without a network: the
origin match, the standpoint read off a real passport, the envelope grammar
(a fixture cut from the live Slip on 2026-09-16 with a staged window added),
the debt, the span, the fold's input, and the claim's outcome words.

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
check(env["directive"].startswith("GRIT"), "the directive section is kept")
check(env["place"].startswith("[211] The crossing") and env["ways"] == [{"addr": "210", "label": "The Slip — the ford where the good road ends.", "depth": 0}], "the place and the ways parse as the mirror parses them")
check(env["marker_new"] == 3 and env["raw"] == ENVELOPE, "the marker and the raw text ride along")
CAST = "# Co-present at your place (by appearance)\nHERE NOW:\n— Quick-eyed and easy, a pedlar's pack.\nABOUT (present today, not at the table):\n— A tall woman in a travel-stained cloak.\n"
cast = dt.parse_envelope(CAST)
check(cast["cast_here"] == ["Quick-eyed and easy, a pedlar's pack."] and cast["cast_about"] == ["A tall woman in a travel-stained cloak."], "the cast parses by grain, dash stripped")
check(dt.fold_scene(dict(cast, place="[211] The crossing.")) == "[211] The crossing.\nHere now, by appearance: Quick-eyed and easy, a pedlar's pack.\nAbout the place, not at the table: A tall woman in a travel-stained cloak.", "the fold's scene is the mirror's: the place, then who is here and who is about")
check("[211] The crossing" in env["scene"] and "pedlar" in env["scene"] and "[210] The Slip" in env["scene"], "the scene is the place, the ways and the cast")
check(len(env["slips"]) == 2, "two slips parse")
check(env["slips"][0]["author"] == "Astrel" and env["slips"][0]["arrived"] == "2026-09-16T18:40:00.000Z" and env["slips"][0]["text"].startswith("I step between"), "a slip with an address and a nested age parses")
check(env["slips"][1]["author"] == "Ugarth" and env["slips"][1]["self"] and env["slips"][1]["arrived"] == "2026-09-16T18:41:30.000Z" and env["slips"][1]["revised"] == "2026-09-16T18:42:10.000Z", "the reader's own slip keeps its arrival and its revision, the (you) shed")
check(env["window_opened"] == "2026-09-16T18:40:00.000Z", "the window's open-stamp is read")
check(env["dice"] == [{"handle": "Astrel", "positive": 4, "negative": 2, "luck": 2}, {"handle": "Ugarth", "positive": 1, "negative": 7, "luck": -6}], "the dice parse, luck signed")
check(len(env["beats"]) == 2 and env["beats"][1]["slot"] == "3" and env["beats"][1]["text"].endswith("flat."), "the beats parse with their slots and multi-line text")
check(dt.window_stamps(env) == ("2026-09-16T18:40:00.000Z", "2026-09-16T18:41:30.000Z"), "the claim's stamps: the open-stamp and the newest arrival")
empty = dt.parse_envelope("# Liquid — pending intentions (0 authors)\n(no pending intentions)\n")
check(empty["slips"] == [] and empty["window_opened"] is None and dt.window_stamps(empty) is None, "an empty window has no stamps to claim")

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
fi = dt.fold_input(env["scene"], env["slips"], env["dice"], "1. Luck is ±d10, exploding.")
check("[THE WINDOW — what stands staged, verbatim]\n- Astrel: I step between" in fi and "- Ugarth: luck -6 (positive 1, negative 7)" in fi and fi.endswith("1. Luck is ±d10, exploding."), "the fold input is the mirror's, line for line")
check("(no dice dealt — every act here is simple)" in dt.fold_input("", [], [], ""), "no dice: said plainly")
fw = dt.fold_input("the crossing", env["slips"], env["dice"], "", env["ways"])
check(fw.endswith("[THE WAYS — where this place leads, each with its address]\n- [210] The Slip — the ford where the good road ends.") and "[THE WAYS" not in dt.fold_input("x", [], [], ""), "the ways ride last, and only when the envelope has them")

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
check(dt.arriving_text("The village track.") == "Arrives — The village track." and dt.arriving_text("") == "Arrives.", "the arriving beat is the mirror's default")

# ── the room's law, read at the act's addresses ─────────────────────────────
check(dt.law_mount("pscale:grit/1") == ("pscale", "grit") and dt.law_mount("function:night") == ("beach", "function:night") and dt.law_mount("Weft's room") is None and dt.law_mount(None) is None, "the mount reads off the room's underscore")
LAW = {"_": "THE LAW.", "1": {"_": "THE TURN.", "1": "PERCEIVE.", "2": {"_": "RENDER.", "1": "close on what the player can do."}, "4": "COMMIT."}, "2": {"_": "RESOLVE.", "1": "luck."}}
check(dt.law_at(LAW, ("1.1", "1.2")) == "THE LAW.\n[1] THE TURN.\n[1.1] PERCEIVE.\n[1.2] RENDER.\n  [1.21] close on what the player can do.", "ancestors frame once, each addressed node carries its subtree, every line its address")
check(dt.law_at(LAW, ("1.4", "1.6", "2")) == "THE LAW.\n[1] THE TURN.\n[1.4] COMMIT.\n[2] RESOLVE.\n  [2.1] luck." and dt.law_at(LAW, ("7",)) == "" and dt.law_at(None, ("1",)) == "", "an address the block lacks is passed over; none held, nothing")
check(dt.parse_whole_block('[whole block]\n{"_": "x", "1": "y"}\n\nnow · 2026') == {"_": "x", "1": "y"} and dt.parse_whole_block("[point] x") is None, "the router's whole-block reply parses")
hd = dt.happen_directive("[1.4] COMMIT.", "Ugarth")
check(hd.startswith("[THE LAW — the room's own, at the addresses of this act]\n[1.4] COMMIT.") and "when the act takes Ugarth away along one of THE WAYS" in hd and "@@" not in hd, "make it happen: the law, then the call, the WAY line for this character only")
check("no 'pool:'" in hd and "REPLACES THOSE BEATS" in dt.render_directive("LAW") and "whole and in order" in dt.render_directive("LAW"), "the call texts are the mirror's as #321 left them: the exact WAY form, and a telling that shows every beat whole")
check(dt.render_directive(" [1.2] RENDER. ").startswith("[THE LAW — the room's own, at the addresses of this act]\n[1.2] RENDER.\n\n[THIS CALL] You are the voice that renders") and "this player's character" in dt.happen_directive("x"), "the rendering: the law, then the call; an unnamed character reads as the player's")
check(dt.claim_outcome("window MOVED — an intention staged after the mirror you read.") == "moved", "moved")
check(dt.claim_outcome("Window already resolved by Astrel — stand down.") == "resolved", "already resolved")
check(dt.claim_outcome("committed: slot 4 (your claim was first)") == "landed", "landed")
check(dt.claim_outcome("upstream error") == "unknown", "unknown")
check(dt.rules_text({"_": "NOMAD.", "1": "Luck.", "2": {"_": "Bands."}, "3": {"_": ""}}) == "NOMAD.\n1. Luck.\n2. Bands.", "rules render as a walk")
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
check(dt.newest_account_render([founded, account], "211")["slot"] == "7", "one account in two organs: a history founded by a journal entry (location 211, no beat) does not forget the renderings kept in witnessed")
later = {"_": "history", "1": {"_": "after", "1": "Ugarth", "2": "pool:211:9", "3": "2026-09-17T12:30:00Z"}}
check(dt.newest_account_render([later, account], "211")["slot"] == "9" and dt.newest_account_render([None, account], "211")["slot"] == "7", "the newest across the organs by stamp; an organ that does not stand is passed over")
check(dt.covers({"slot": "12"}, "9") and dt.covers({"slot": "4"}, "4") and not dt.covers({"slot": "9"}, "11") and not dt.covers(None, "4"),
      "a kept rendering covers a beat at or before its slot, in digit-path order; nothing kept covers nothing")
beats = [{"slot": s_, "author": "x", "text": "t" + s_} for s_ in ("1", "2", "9", "11", "12")]
check([b["slot"] for b in dt.beats_after(beats, "9")] == ["11", "12"], "beats after slot 9 are 11 and 12 — digit-path order, not string order")
check([b["slot"] for b in dt.beats_after(beats, None, limit=3)] == ["9", "11", "12"], "no slot known: the newest few")
check(dt.beats_after(beats, "12") == [], "nothing after the newest")
ri = dt.render_input("pool:211 @ the crossing", beats[-2:], "Ugarth")
check(ri.startswith("[THE SCENE — where you are, and who is here]\npool:211 @ the crossing") and "[NEW PUBLIC BEATS — since you last looked]\n- x: t11\n- x: t12" in ri and ri.endswith("You are Ugarth."), "the render input is the mirror's: the room as composed, the beats since, and whose moment it is")
mixed = [{"slot": "1", "author": "Astrel", "text": "before"}, {"slot": "2", "author": "Ugarth", "text": "Arrives — The crossing."}, {"slot": "3", "author": "Astrel", "text": "after"}]
check([b["slot"] for b in dt.beats_after(mixed, None, handle="Ugarth")] == ["2", "3"], "a room never rendered for this character starts at their own first beat there — nothing from before they came")
check([b["slot"] for b in dt.beats_after(mixed, None, handle="Senna")] == ["1", "2", "3"] and [b["slot"] for b in dt.beats_after(mixed, "2", handle="Ugarth")] == ["3"], "no beat of their own: the newest few; a rendering known: the beats after it")

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

print("test_doorman: %d passed, %d failed" % (PASS, FAIL))
sys.exit(1 if FAIL else 0)
