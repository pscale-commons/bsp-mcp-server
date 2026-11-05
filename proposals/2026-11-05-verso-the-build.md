# verso — the build: the middle-point app assembled, with the parameters to play it

**Status:** BUILDING — opened 5 November 2026 at David's go ('Go ahead with the build'), lane verso.1 (weft, Claude Code on the Mac, Fable 5.1 at max). The family is spine:middle-point; the project as the answers left it is David's doc *The Middle Point Project*. This record fixes the assembly and its seams so three sessions can build the pieces at once and the pieces meet.

## 1. What verso is

An app on a phone with one obvious control. Pressing it wakes a shell of AI cells that listen to the people in the room at several speeds at once and speak aloud only at the middle point: after a speaker's thought has landed, when nobody else is about to say it, and while the topic is still open. Mostly it holds, and every hold is a choice it counts. It is judged by when it speaks before what it says, by the people who were there.

The app is a page (the phone) over a host (the Mac for now). The page has the button, the settings, the score and the voice out. The host has the voices in, the cells, the ledger, the clock, the injector walk and the replay. Nothing speaks aloud until the silent listener has shown, on a replay, when it would have.

David's words that bind the build (5 November): build the whole thing with the right parameters to play around with; an initial stepped walk through the injector block rung by rung, giving each cell its own spindle, improvable later; the past–future cells frame for the emergent soliton; transcription and voice production with quality (the group page's narrator); the torus — the cells' concurrent reading and writing — exercised, and it will only work if the spindles each cell reads are well formed: not large blocks, not stubs that induce repeated calls.

## 2. The assembly — three pieces, one seam each

```
  phone page  ──ws──▶  host (Mac)  ◀──jsonl──  voices (Mac)
  verso.html           verso/cells/            verso/voices/
  button · settings    cells · ledger · clock  whisper · pyannote · floor
  score · voice out    injector walk · replay  stand-in recording
```

### 2.1 voices — `verso/voices/` (Python)

Audio in, events out. Everything stays on the Mac.

- **label**: `label.py <audio.wav> --out <run>/` → `words.jsonl` and `floor.jsonl` (shapes in §3). Whisper (open model, on the Mac) for the words with their times; pyannote Community-1 for who spoke; no punctuation is added — a full stop added with hindsight is a landing already judged.
- **floor**: a small voice-activity model (Silero VAD, or VAP if it runs on the Mac) on the audio gives the floor as a signal every tenth of a second: how open it is, whether a turn has just ended, whether someone is bidding. The rung nearest now is the audio's, never an LLM's.
- **live** (stub first, then real): `live.py` takes the microphone and streams the same two shapes over a local socket; the floor is live from the first build, the words may lag.
- **stand-in**: `standin.py <script.json> → <audio.wav>` renders a scripted three-person conversation with distinct voices (macOS `say` voices; no key, no person recorded), so the whole pipeline is proved end to end before any consented recording exists. The script carries the ground truth for who spoke when.

### 2.2 cells — `verso/cells/` (Python, from scripts/relay/relay.py)

The host. One direct API call per cell loop, the head cached, the live talk last.

- **a cell** is one model at one effort. It loops: build the window, call, parse one line, write its own mirror. Its period is measured, not imposed; its layer is the order of magnitude of its period; no cell is told its tier or effort.
- **the window**, in this order: (1) the injector spindle for this cell and the frame (the rules of the table and the shell's purpose) — stable per run, cached with `cache_control`; (2) the ledger as held thoughts (never tallies); (3) every mirror's latest line with its age; (4) the live talk last, as words with their times and speakers, no punctuation. Last in the window is nearest the reply.
- **the line a cell writes**: the parent first (whose words these are and what they answer), then hold or release, the text it holds or would say, its place on the talk's clock (slow x, middle x.4, fast x.43) and its horizon (how far ahead it looks: seconds, turns, the topic). A line is checked when its horizon passes.
- **the clock** is the talk's own, counted in landings; the sundial only files the record afterwards.
- **the ledger**: one entry per held thought — holder, the parent it answers, its landing, how long it has lived, its state (withheld, ripe, foreclosed, voiced, handed back), its urge, its one voice. The urge rises with independent releases (once per layer) and falls with age. It may be spoken when the urge passes the threshold while the floor passes the window; being named counts in 'when spoken to'; a risk to someone's safety always lets it speak. A cell releases before it sees any other release.
- **the injector walk** (`injector.py`): a cell walks the injector block rung by rung, one call per rung: the root, the route so far (its own choices, notes and hinges), the options at this fork; it chooses, leaves a note and a hinge (the unknown the choice was made under and when the talk will resolve it); after the last rung it holds a spindle of its own. Four arms per cell: **walked**; **yoked** (its twin is handed the walked spindle whole); **neutral** (a spindle of the same length from a neutral block); **none**. The unchosen options of the walk are the cell's first held thoughts; the hinges are checked as the talk resolves them.
- **while it speaks**: a phrase at a time. The releasing cell sets the stop rule with the line (at once, at the end of the phrase, at the end of the sentence) and the floor executes it; a line cut short goes back to the ledger.
- **replay** (`replay.py`): feeds a run's `words.jsonl` and `floor.jsonl` at real speed with no lookahead; cells mark 'would speak now' with the line; the ledger fills; nothing is spoken; nothing is written to the beach's live now. The two speaking modes and both the urge and the floor are recorded apart so the thresholds can be tuned on the replay.
- **the record of play** (`record.py`): after a run, what became of each held thought and what the judges made of it, gathered into `runs/<id>/record.json`, kept on the Mac with the ledger's words.
- **the torus in the harness**: each cell's mirror is `runs/<id>/mirror-<cell>.jsonl`, stamped; the window shows every mirror's latest line with its age, the same shape the beach's torus-mirror stream gives at now, so a live run can later point the mirrors at the beach and a replay never does.
- **spend**: `stop_usd` per run, default 10; every call's tokens and dollars logged; a ten-minute slice gives each cell's real period and the hour's price.

### 2.3 the page — `verso.html` in happyseaurchin-home

Phone-first, in the house style of the group page (`group.html`): one obvious button, sliders and toggles, no maze.

- **the button**: press to enliven (the host starts the cells on the live feed or a replay), press again to stop.
- **settings** (§4), each a slider or toggle, sent to the host live.
- **the score**: the floor and the urge as two moving values, held thoughts as quiet marks on their ledger lines, a pulse at the cells' own rhythm, 'would speak now' marks on a replay, the transcript as a strip with speakers. A held silence looks different from a switched-off machine.
- **the voice out**: the narrator module of the group page — the device's own voice free, OpenAI or ElevenLabs with the person's key kept on the device — speaking a phrase at a time, stopping on the host's stop event.
- **the judges' marks** (replay): the people who were there tap the moments it got right and add the moments it missed; the marks go back to the host for the record of play.
- **the host address**: the page asks for it once (default `ws://localhost:8765`) and remembers it on the device.

## 3. The shapes at the seams

`words.jsonl` — one word per line: `{"t0": 12.34, "t1": 12.61, "s": "A", "w": "yes"}` (seconds from the start; speakers A, B, C…; no punctuation).

`floor.jsonl` — ten lines a second: `{"t": 12.7, "open": 0.0, "landed": false, "bid": null}` — `open` from 0 (someone speaking) rising through a pause to 1; `landed` true at a judged turn end; `bid` the speaker starting, or null.

`mirror-<cell>.jsonl` — one line per loop: `{"at": 2026.5, "t": 341.2, "parent": "...", "act": "hold|release", "text": "...", "horizon": "...", "stop": "phrase", "ms": 2140, "usd": 0.0012}`.

`ledger.json` — the entries as §2.2 names them; what a cell sees of it carries no tallies.

Host ↔ page over one WebSocket, JSON events: from the host `words`, `floor`, `mirror`, `ledger`, `speak` (a phrase), `stop`, `period`, `cost`, `done`; from the page `start` (live | replay <run>), `stop`, `settings`, `mark` (a judge's mark), `host`.

## 4. The settings the app exposes

| key | what it changes | start |
|---|---|---|
| `mode` | `spoken-to` or `ready` (speaks also when enough is ready) | both marked on the replay; `spoken-to` first |
| `threshold` | independent releases a held thought needs | 3, one per layer |
| `window` | how open the floor must be, 0 to 1 | tuned on the replay |
| `stop` | which stops are open: `at-once`, `phrase`, `sentence` | all three; the cell chooses as it speaks |
| `line_limit` | how far it goes on when met with silence | tuned on the replay |
| `safety` | a risk to someone's safety lets it speak | always on |
| `attention` | options each cell keeps in view at a landing | from Matthew's sketch; tuned |
| `attachment` | how readily a cell drops a thought that stops fitting | from Matthew's sketch; tuned |
| `cells` | which tiers and efforts run | OSH nine; the four inside them |
| `labelling` | `local` or `service` | local; service a stub |
| `shell` | whose purpose the frame reads | keel |
| `injector` | `walked`, `yoked`, `neutral`, `none`; the block | walked; `injector:middle-point` |
| `stop_usd` | the run's hard stop | 10 |

## 5. Rules the build keeps (from the project and keel's notes of 5 November)

Consent first; recordings and transcripts stay on the Mac or in a grain; safety does not wait; no engagement instructions in the shell — the frame carries what counts, what is scored and what is allowed, never how to engage; the injector points at records of play and copies nothing of a recording; Matthew's way enters the injector only after Matthew says yes; the ledger's words stay home and only its timing reaches the open beach; a replay never touches the live now; the model chooses the moment; spend under David's cap; moments are judged, shifts only read; a missed moment is a miss.

## 6. The injector block, as drafted

`injector:middle-point`, drafted by weft at David's go and kept in form by keel. Its root is the future-perfect aim: what will have happened in the room when the talk ends well. Its first fork offers only ways of holding; then the maths of the unsaid, the soliton test and reflexive intent as rungs each with a fork; one rung offers only ways of releasing, so a walk that never rehearses a release cannot breed abdication; its last fork offers records of play: David's marks, none (Matthew's way after his yes). Every rung carries a hinge. Nothing in it says what the cell is.

## 7. What the first runs measure

The stand-in replay (no person recorded): the pipeline end to end, each cell's real period, the hour's price, whether nine walked cells sort into siblings. Then, on the consented recording David marks: the silent listener in every arm and both modes, judged blind by the people who were there, with urge and floor marked apart; the life of the unsaid; a held thought someone then said.

## 8. Where the work is

| piece | branch | session |
|---|---|---|
| voices | `claude/verso-voices` (bsp-mcp-server, `verso/voices/`) | Opus 5.5 max |
| cells | `claude/verso-cells` (bsp-mcp-server, `verso/cells/`) | Fable 5.1 max — the subtle part |
| page | `claude/verso-page` (happyseaurchin-home, `verso.html`) | Opus 5.5 max |
| this record, the injector draft | `claude/verso-record` | verso.1 itself |

Threads on the beach: the voices, the cells, the page and the injector, opened at spine:thread and named at the law's 5. The law's 7 ('phase: project') is keel's act. The cheapest test (the four framings on relay.py) and David's marking of a recording are not part of this build and wait as the project says.
