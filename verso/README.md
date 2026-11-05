# verso

The middle-point app: a phone page over a host on the Mac. It listens to people talking at several speeds at once and speaks aloud only at the middle point — after a speaker's thought has landed, when nobody else is about to say it, while the topic is still open. Mostly it holds.

The record that fixes the assembly, its seams and its settings is `proposals/2026-11-05-verso-the-build.md`. The family on the beach is `spine:middle-point`; its law `function:middle-point`; its room `pool:middle-point`; the threads at `spine:thread` are 18 the voices, 19 the cells, 21 the page and 22 the injector.

## The pieces

| piece | where | what |
|---|---|---|
| voices | `verso/voices/` | whisper and pyannote on the Mac for words with their times and speakers; the floor from the audio (Silero VAD); a stand-in of scripted voices; a live mode from the microphone |
| cells | `verso/cells/` | nine cells on direct API calls, the head cached and the live talk last; the ledger of the unsaid; the injector walk in four arms; the replay; the record of play; one WebSocket for the page |
| page | `verso.html` in happyseaurchin-home | one button, the settings as sliders and toggles, the score, the judges' marks, the voice out as the group page's narrator; a demo with no host |

The seams are the JSONL shapes in the record's section 3: `words.jsonl` and `floor.jsonl` from the voices, `mirror-<cell>.jsonl` per cell, and the events over `ws://localhost:8765` between host and page.

## The injector

`injector-middle-point.json` is the block as founded on the beach at `injector:middle-point` on 5 November 2026 (the beach copy is the one that stands; this file is the record). A cell walks the ladder of ones, `1` to `1.11111`, taking one of the options at each rung's `2` to `6` and reading its hinge at `8`; the cell's spindle is the root and its six choices with their notes and hinges. The options not taken are its first held thoughts.

## The torus

The beach reflects concurrent minds three ways, all through the router at bsp.hermitcrab.me: the `[here now — …]` line every acknowledgement ends with (who else worked this beach in the last two minutes and where, from process memory, stored nowhere; the page at happyseaurchin.com/mindflow/reflection draws it from `bsp.hermitcrab.me/reflection`); the `now · …` stamp every result carries, with every instant in the text related to it; and the torus-mirror stream, each hand's line said at the beat and read as a snapshot of every mirror with its age. On 5 November the reflection shows a few lanes at a time — walkers of spines, a poller of a collective, weft's sessions — so it is live for whatever calls through the router.

Verso's cells call the API directly and, on a replay, never touch the beach's live now, so none of this reaches them unless the host composes it. The host does: each cell's mirror is a file with stamps; every window carries every other mirror's latest line with its age and ends with a stamp line in the router's form; that is the torus at the same-moment rung, in the harness. A live run may later say each cell's line at the beat on the beach's torus-mirror stream, and then the reflection and the stamp are the beach's own.

## Running it

See each piece's own README. The order: the voices make `runs/<id>/words.jsonl` and `floor.jsonl` (from the stand-in first); the host replays them with the nine cells and no page (`host.py --no-page --replay <id>`), then with the page connected; nothing speaks aloud until the silent listener has shown, on a replay, when it would have.
