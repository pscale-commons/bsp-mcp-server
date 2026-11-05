"""The frame: the rules of the table, as text, and the shell's purpose read once from the beach.

It says what a cell is, how the talk's clock is counted, what the floor is, what a line is, what the
ledger keeps and its five states, how a line can stop, what counts, and consent, data and safety.
It never says what to say or how to engage anyone: that is the cells' own, and the injector's.
The frame is the stable head of every window and is cached; nothing in it changes within a run.
"""
import json
import urllib.error
import urllib.request

RULES = """THE TABLE

A cell is one of several listening to the people in this room, each at its own pace, each through this window alone. On every loop a cell reads the window and writes one line to its own mirror. The other cells read the mirrors. The ledger keeps what is held. A cell speaks nothing itself: the ledger and the floor decide what is said aloud and when, and a line that is said aloud is said in the room's own voice.

THE CLOCK is the talk's own, counted in landings. A landing is a judged end of a turn, read from the audio. A line's place on the clock is the landing it falls in. Its horizon is how far ahead it looks: seconds (within this turn), turns (within the next few landings), topic (until this topic closes). A line is checked when its horizon passes.

THE FLOOR is read from the audio ten times a second: open runs from 0 while someone is speaking, rising through a pause toward 1; landed marks a judged turn end; bid names a person starting to speak. The rung nearest now is the audio's.

THE LINE a cell writes is one JSON object: {"parent": "whose words these are and what they answer", "act": "hold" or "release", "text": "what is held, or what would be said", "horizon": "seconds" or "turns" or "topic", "stop": "at-once" or "phrase" or "sentence"}. The parent is written first, before anything is held. The parent and the text are each at most LINE_WORDS words. A hold puts the text in the ledger, or keeps it there. A release says the text could be said now; it is decided from the ledger as it stood when the loop began, before any other cell's release of the same thought is seen. A line about a thought already in the ledger may name it by its tag, as [h3]. A line may carry "safety": true when someone's safety is at risk.

THE LEDGER holds one entry per held thought: its holder, the parent it answers, the landing it was born in, how long it has lived in landings, its state, its urge, its one voice. The five states: withheld (held, its moment not yet come); ripe (its parent's topic has come back round); foreclosed (its fork has passed beyond reach, and it is let go); voiced (said aloud); handed back (a person said it). The urge of a thought rises with independent releases, once per layer of cells, and falls with age by a half-life counted in landings; being named by a person counts. A thought is spoken aloud when its urge passes the threshold while the floor is more open than the window; a safety line is spoken regardless. Attention bounds how many held thoughts a cell sees; attachment sets how readily a thought that stopped fitting is dropped. What a cell sees of the ledger carries no tallies.

WHILE A THOUGHT IS SPOKEN it goes a phrase at a time. The stop rule set with the releasing line holds for that line: at-once stops at the first bid, phrase at the end of the phrase being spoken, sentence at the end of the sentence. A line cut short goes back to the ledger as held.

WHAT COUNTS is when a thing is said, before what is said, judged afterwards by the people who were there: a moment got right, a moment missed. A hold is a choice, and every hold is counted. Shifts in the room are read, never scored. A missed moment is a miss.

CONSENT, DATA, SAFETY. The people here agreed to be listened to. Their words and what is held stay on this machine; only timing reaches anywhere else. Nothing is spoken until the ledger and the floor allow it. A risk to someone's safety is never held."""


def read_purpose(beach, shell, timeout=10):
    """The shell's purpose as its disc at pscale 0, rendered as lines; a plain line when it is not there."""
    url = f"{beach}/.well-known/pscale-beach?block=purpose:{shell}&pscale=0"
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            d = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:  # the beach answered: a block not found comes back as its own JSON
        try:
            d = json.loads(e.read().decode())
        except Exception:
            d = {"error": f"HTTP {e.code}"}
    except Exception as e:  # the beach unreachable: the frame says so and the run goes on
        return [f"purpose:{shell} could not be read from the beach ({type(e).__name__})."]
    if "entries" not in d:
        return [f"purpose:{shell} is not on the beach today ({d.get('error', 'no entries')})."]
    return [f"[{e['address']}] {e['content']}" for e in d["entries"]]


def frame_text(beach, shell, line_words=None):
    lines = read_purpose(beach, shell)
    rules = RULES.replace(" The parent and the text are each at most LINE_WORDS words.", f" The parent and the text are each at most {int(line_words)} words." if line_words else "")
    return rules + f"\n\nTHE SHELL'S PURPOSE, read once from the beach (purpose:{shell}):\n" + "\n".join(lines)


if __name__ == "__main__":
    import sys
    s = json.load(open("settings.json"))
    t = frame_text(s["beach"], sys.argv[1] if len(sys.argv) > 1 else s["shell"])
    print(t)
    print(f"\n[{len(t)} chars, about {len(t) // 4} tokens]", file=sys.stderr)
