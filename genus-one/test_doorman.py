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
beats = [{"slot": s_, "author": "x", "text": "t" + s_} for s_ in ("1", "2", "9", "11", "12")]
check([b["slot"] for b in dt.beats_after(beats, "9")] == ["11", "12"], "beats after slot 9 are 11 and 12 — digit-path order, not string order")
check([b["slot"] for b in dt.beats_after(beats, None, limit=3)] == ["9", "11", "12"], "no slot known: the newest few")
check(dt.beats_after(beats, "12") == [], "nothing after the newest")
ri = dt.render_input({"scene": "the crossing"}, beats[-2:], "Ugarth")
check("[NEW PUBLIC BEATS — since you last looked]\n- x: t11\n- x: t12" in ri and ri.endswith("You are Ugarth. Output only the rendered paragraph."), "the render input carries the scene and the beats since")

print("test_doorman: %d passed, %d failed" % (PASS, FAIL))
sys.exit(1 if FAIL else 0)
