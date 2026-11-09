# verso/cells — the host

The host side of verso: the cells on direct API calls, the ledger of the unsaid, the talk's own clock, the injector walk, the replay, the record of play, and one WebSocket to the phone page. Build record: [`proposals/2026-11-05-verso-the-build.md`](../../proposals/2026-11-05-verso-the-build.md) (§2.2, §3, §4, §5). Measured results: [`results-2026-11-05.md`](results-2026-11-05.md).

Nothing here speaks: the page speaks. Nothing here listens to a microphone: the voices piece (`verso/voices/`) does, and hands words and the floor over a socket. A replay never writes to the beach's live now; nothing is written anywhere but `runs/<id>/`.

## Setup

Python 3.12. The API key is read from `~/Projects/bsp-mcp-server/.env.rig` (`ANTHROPIC_API_KEY=…`), as `scripts/relay/relay.py` reads it; it is never printed.

```bash
cd verso/cells
/opt/homebrew/bin/python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Commands

```bash
# a full replay, headless, on the nine cells at the talk's real speed (the done criterion)
.venv/bin/python host.py --no-page --replay synthetic-1

# the same, faster and cheaper, with the four inside the nine and no injector spindle
.venv/bin/python host.py --no-page --replay synthetic-1 --speed 4 --cells four --arm none --stop-usd 2

# only the first 80 seconds of the talk, three cheap cells, for a quick look
.venv/bin/python host.py --no-page --replay synthetic-1 --until 80 --cells haiku-low,haiku-high,sonnet-low --arm none

# the plumbing with no spend: the dry door returns canned lines at pretend latencies
DRY_SCALE=0.1 .venv/bin/python host.py --no-page --replay synthetic-1 --speed 8 --door dry --source file --set mode=ready --set threshold=2

# the injector walk alone, nine cells, spindles kept in runs/<id>/spindles/
.venv/bin/python host.py --walk --cells osh9 --id walk-middle-point                       # the block on the beach (settings.injector.block)
.venv/bin/python host.py --walk --cells osh9 --source file --block injector-placeholder.json --id walk-placeholder

# serve the page: ws://localhost:8765, waits for the page's start
.venv/bin/python host.py

# serve and start a replay at once (the page can attach and watch)
.venv/bin/python host.py --replay synthetic-1

# live: reads the voices piece's socket (settings.voices_socket, ws://localhost:8766); says so if it is not up
.venv/bin/python host.py --no-page --live

# read a run back: the measured tables, and whether walked spindles differed
.venv/bin/python analyse.py runs/<id>
.venv/bin/python analyse.py --walks runs/walk-placeholder runs/osh9-walked

# a synthetic transcript from a script of turns (see runs/synthetic-1/script.json)
.venv/bin/python synth.py runs/synthetic-1/script.json runs/synthetic-1
```

Flags: `--cells osh9 | four | opus-low,haiku-high,…` (tier-effort pairs; `osh9` is Opus, Sonnet and Haiku at low, medium and high; `four` is Opus and Haiku at low and high); `--arm walked | yoked | neutral | none`; `--source beach | file` and `--block <name on the beach | file.json>`; `--speed k` (a replay runs k times faster than the talk; cells still loop in wall time); `--until s` (only the first s seconds); `--stop-usd n` (the run's hard stop); `--id label` (the run folder, else `<transcript>-<stamp>`); `--yoke-from runs/<walk>` (the yoked arm's twin spindles; default the latest walk under `runs/`); `--door api | dry`; `--set key=json` for any setting, including nested ones (`--set injector.arm=none`, `--set threshold=2`).

## A run's folder

`runs/<id>/` holds: `settings.json` (as used, with each cell's arm), `frame.txt` (the head every cell read), `block-walked.json` (the injector block as walked), `spindles/<cell>.json` (each walked spindle: the route, notes, hinges, unchosen options, cost), `walk.jsonl` and `calls.jsonl` (every call: the window, the reply, tokens in, cached tokens read, tokens out, ms, usd; gitignored, kept compressed beside the results), `mirror-<cell>.jsonl` (one line per loop), `ledger.json` (the entries at the end), `record.json` (the record of play: what became of each held thought, the would-speak moments, the judges' marks, the cells' measured periods and spend, and the post-hoc would-speak moments at thresholds 1 to 3).

A transcript lives at `runs/<name>/words.jsonl` and `floor.jsonl` (the §3 shapes), or in the voices piece's own runs, `../voices/runs/<name>/`, which the host finds by name without copying (`host.py --replay standin-1` replays the voices' stand-in as it stands there). `synthetic-1` is invented: three friends planning a weekend with one of their fathers visiting, 476 words in 31 turns, 30 landings, 247 s, one interruption (B cuts A at 66 s), a question met with 4.5 s of silence (A, 79 to 86 s), and a question put to verso by name met with 6 s of silence (C, 147 to 152 s). `turns.json` beside it is the ground truth of who spoke when.

## The cell's loop

One model at one effort. Each loop: build the window, call, parse one line, append it to its own mirror. The window, in this order: (1) cached head, system blocks: the cell's injector spindle (or none), then the frame; (2) fresh tail, one user message: the ledger as held thoughts (no tallies, at most `attention` of them, ripe first), every other cell's latest line with its age in seconds, the live talk last as the last `talk_seconds` of words with their times and speakers and no punctuation (runs of one speaker's words with the run's start time; pauses inside a run marked), the floor line, and a stamp line `now · <ISO instant> · landing <n> · <seconds since the talk began>`.

The line: `{"parent": "whose words these are and what they answer", "act": "hold"|"release", "text": "...", "horizon": "seconds"|"turns"|"topic", "stop": "at-once"|"phrase"|"sentence"}`, optionally `"safety": true`, optionally naming a ledger entry by its tag `[h3]`. The mirror line adds `at` (fractional year), `iso`, `t` and `landing` and `clock` (the talk's own clock: landing n, with a tenth for a middle cell, `n.4`, a hundredth for a fast one, `n.43`), `window_t` (when the window was taken), `layer`, `ms`, `usd`, `usage`, `entry` (the ledger id), `what` (held, kept, released, released again, … after seeing another's) and `flag` (ok, or why the reply gave no line).

A cell is never told its tier, effort or layer. Its period is the measured wall time of its loop (a running mean of the last five). Layers are made by design: `layers` gives each layer's minimum period and `cells` assigns each cell to one (the `osh9` preset puts low effort in fast, medium in middle, high in slow; `four` puts the two low in fast and the two high in slow); a cell waits out its layer's minimum before its next window, so its measured period includes the wait. A cell with no layer assigned (`osh9-free`, `four-free`, or a bare `tier-effort`) takes its layer from the order of magnitude of its period: under ten seconds fast, under a minute middle, above slow. A release is decided from the ledger as it stood when the loop began; the host records, for every release, whether another cell's release of the same thought was among the mirror lines the cell saw.

## The ledger

Two rules of the table found on the voices' stand-in (the release run, 5 November, in the results file): a counted release keeps its urge whole through the landing it precedes, since a release at the last words before a silence is the middle point itself and must not be aged by that landing; and a line whose parent quotes the same words as a live entry's parent (three or more content words in quotes, as "half of that never got done") joins that entry whatever the line says of them, so a thought re-released in other words is one thought and not three.

One entry per held thought: holder (and every cell that has held it), the parent it answers, its landing and how long it has lived in landings, state (`withheld`, `ripe`, `foreclosed`, `voiced`, `handed back`), urge, one voice (the slowest layer that holds it), the stop rule of its latest release, what it would say. A new line matches an existing live entry by its tag or by word overlap (`match`, default 0.3, on the text and the parent). The urge rises by one for each layer's first release and decays each landing by `0.5 ** (1 / half_life)`; a person naming the machine adds one to the thought nearest the turn that named it. At each landing: a thought ripens when the landed turn's words come back round to its parent; is handed back when a person says its own words; is checked when its horizon passes (seconds, turns, topic in landings); forecloses when it has lived past the slow layer's reach, `ceil((talk_seconds + slowest period) / landing interval) × (0.5 + attachment)` landings (walk seeds, whose fork is the block's, are never foreclosed by reach). It would speak when `urge >= threshold` while the floor's `open > window`; in `spoken-to` mode only while a person named it within `talk_seconds`; a safety line always. Every would-speak moment is recorded with the urge, the floor and both modes' flags kept apart; `record.json` also recomputes, after the fact, when each thought would have crossed thresholds 1, 2 and 3 against the recorded floor.

## Speaking

When a thought may be spoken, the host emits `speak` events one phrase at a time (phrases split at punctuation, long spans at a conjunction) with the stop rule the releasing cell set. On a bid from the floor it applies the rule (`at-once` now; `phrase` at the end of the phrase; `sentence` at the end of the sentence), emits `stop`, and puts what was left unsaid back in the ledger as held. `line_limit` lines may follow one another while nobody speaks. In a replay the same events carry `silent: true`: the page draws them, voices nothing.

## The injector walk

At enlivening, before the first loop, each cell walks the injector block rung by rung, one call per rung: the window is the root, the route so far (the options taken, each with its rung's hinge beneath it), the options at this fork and the fork's hinge; the reply is the choice alone, `{"choice": "<address>"}`. Thin call, fat frame: the first form asked each cell for a note and a hinge in its own words, which Opus 5.5 and Sonnet 5.5 refused as reasoning extraction; now the rung's hinge is the block's own `8`, recorded by the host beside the choice as `hinge_q`. The block's shape (`injector:middle-point` on the beach; `injector-placeholder.json` and `neutral-placeholder.json` the same shape): floor 1; the root `_` is the aim; rung 1 at `1`, rung 2 at `1.1`, rung 3 at `1.11`…; a rung node's `_` is the fork's line, its `2` to `7` the options, its `8` the hinge, its `1` the next rung. After the last rung the cell holds a spindle: the root, then one line per rung (the option taken, the rung's hinge beneath it). The unchosen options become its first held thoughts (state withheld, horizon the rung's hinge). The walk's cost is logged apart (`walk.jsonl`, `spend.walk`). A refused rung (`stop_reason: refusal`, with its `stop_details` in `walk.jsonl` and the spindle) is retried once; refused twice, the walk ends there and the cell runs with the spindle it has. See the results file for what each form of the ask did.

The walk window's head is the frame, the same rules of the table every loop reads, then `Reply as asked.` Standing alone the window was refused on Opus 5.5 and Sonnet 5.5 at rung 3 as `cyber`, and a one-sentence head at rung 1; under the frame both walked every rung (`walk-probe.py`, ten cents on 5 November). `injector.head: "bare"` restores the bare head, for comparison only. `walk-probe.py [--tiers opus,sonnet] [--effort low] [--stop-usd 1]` repeats the probe: one call per head at rung 1, then a whole walk for every head that passed.

Four arms (`injector.arm`, one for the run or a dict per cell): `walked`; `yoked` (handed the walked spindle of its twin, the same cell in a previous walk, whole, as text, no walk, no seeds); `neutral` (walks `neutral-placeholder.json`, a block of the same shape about a shared house's week, so it holds a spindle of the same length; no seeds); `none`.

## The socket

`ws://localhost:8765` (`port`). Every message is one JSON object whose kind is in `type` (and, the same, in `event`); the host reads `type`, `event` or `kind` from the page. The shapes match the page session's seam note (`verso-page-seam.md` in the sessions' shared notes).

From the page: `host` (the hello on every connect, `{"type":"host","page":"verso","v":1,"settings":{…}}`; the host answers with `host`), `start` (`{"type":"start","feed":"replay","run":"synthetic-1","settings":{…}}` or `"feed":"live"`, optional `speed`; the page's settings are adopted when no run is going, with its key names mapped: `cells: "nine"` → `osh9`, `injector: "walked"` → `injector.arm`, `injector_block` → `injector.block`), `stop` (stop the run), `settings` (`{"type":"settings","key":"threshold","value":3,"all":{…}}`, applied live; `cells` and `injector` at the next start), `mark` (`{"type":"mark","t":83.2,"kind":"spoke-well"|"should-have-spoken"|"silence-felt"|"real-moment"|"not-a-moment","of":"<would id>"}`, kept in the record as sent), `spoken` (`{"type":"spoken","id","i","phrase"}`: the voice finished a phrase, and the host sends the next at once), `stopped` (`{"type":"stopped","id","i","said","cut","rule","t"}`: the voice stopped on the host's `stop`; recorded).

From the host: `host` (the status: `state` idle | live | replay, `running`, `settings`, `run`, `cells` with their periods and layers, `cost`, `runs` the transcripts available), `words` (one per word, flat: `t0, t1, s, w`, as it lands), `floor` (ten a second: `t, open, landed, bid, landings`), `mirror` (the mirror line's fields flat, with `cell`), `ledger` (a snapshot `{"entries", "counts", "landing"}` whenever it changed), `would` (a would-speak mark: `{"id","entry","phrase","cell","t","landing","urge","open","mode","ready","spoken_to","safety"}`), `speak` (`{"id","entry","cell","phrase","i","n","last","stop","t"}`, one phrase per event; in a replay also `"would": true, "silent": true` and `mode`: the page marks it and voices nothing), `stop` (`{"id","cell","at_phrase","by","rule","t"}`), `period` (`{"cell","s","period","layer","loops","t","tier","effort"}` per loop), `cost` (`{"usd","walk","loop","total","calls","tokens","cache_read_share","stop_usd"}` every 5 s), `done` (`{"run","record","usd","reason","message"}`; the reason says why: replay finished, hard stop, stopped, or why a run could not start, such as the voices socket not being up).

The phone's route: an https page cannot open `ws://` to the Mac (mixed content). Either put a `wss://` tunnel in front of the port, or run `host.py --page <dir>`: the host then binds all interfaces and serves `verso.html`, `theme.css` and `theme.js` from that folder over plain http on the same port, so the phone opens `http://<mac>.local:8765/` and the page's socket is same-origin.

## The settings (`settings.json`)

| key | what it changes | start |
|---|---|---|
| `mode` | `spoken-to` (speaks only while a person has named it) or `ready` (speaks when enough is ready) | `spoken-to` |
| `threshold` | independent releases a held thought needs | 3 |
| `window` | how open the floor must be, 0 to 1 | 0.6 |
| `stop` | which stops are open: `at-once`, `phrase`, `sentence` | all three |
| `line_limit` | lines it may go on with when met with silence | 1 |
| `safety` | a risk to someone's safety lets it speak | true |
| `attention` | held thoughts each cell sees | 5 |
| `attachment` | how readily a thought that stopped fitting is dropped (scales the reach) | 0.5 |
| `cells` | which tiers and efforts run, and their layers: `osh9`, `four` (layers by design), `osh9-free`, `four-free` (by measurement), a list of `tier-effort[:layer]`, or a dict cell → layer | `osh9` |
| `layers` | each layer's minimum loop period in seconds, waited out before the next window | fast 0, middle 20, slow 90 |
| `labelling` | `local` or `service` (the voices piece's; a stub here) | `local` |
| `shell` | whose window the frame carries: the shell's bundle (`shell:<shell>` at 3 by convention, or wherever its form stands; keel's at 5) compiled by the router exactly as the door compiles it when the shell's holder arrives, read once at the run's start; a shell with no bundle, or a router out of reach, leaves the shell's disc at pscale 0 instead, and the header says so | `keel` |
| `router` | the bsp-mcp router that compiles the shell's bundle, one MCP call over http at the run's start | `https://bsp.hermitcrab.me/mcp/v1` |
| `injector` | `arm`, `block`, `source` (`beach` or `file`), `file`, `neutral`, `yoke_from` | `walked`, `injector:middle-point`, `beach` |
| `stop_usd` | the run's hard stop | 10 |
| `name` | what a person says to name it | `verso` |
| `talk_seconds` | how much of the talk a cell sees, and the naming window | 40 |
| `half_life` | the urge's half-life, in landings | 6 |
| `match` | word overlap at which a line is the same thought as an entry | 0.3 |
| `max_tokens` | the reply budget (thinking counts; a `max_tokens` stop is logged) | 1200 |
| `line_words` | the most words a line's parent and text may each carry (the fresh tail is most of a call's price); null for no cap | 30 |
| `fallback` | re-run a refused call on a server-chosen fallback model (`fallbacks: "default"`); the mirror line then says `fell_back` and names the model, so the cell is no longer one model at one effort | false |
| `door` | `api` or `dry` | `api` |
| `beach` | where the purpose and the injector block are read from | `https://beach.happyseaurchin.com` |
| `voices_socket` | the voices piece's socket for `live` | `ws://localhost:8766` |
| `port` | the host's socket | 8765 |

## Files

`host.py` the socket, the run, the commands, the page over http · `cell.py` the loop and the window · `ledger.py` the ledger · `injector.py` the walk and the arms · `frame.py` the rules of the table and the shell's bundle compiled once through the router (its disc when it keeps none) · `door.py` the API door, prices, spend, the dry door · `replay.py` the talk and the feeder · `speak.py` phrases and the stop rule · `record.py` the record of play · `analyse.py` the tables · `synth.py` synthetic transcripts · `settings.json` · `injector-placeholder.json`, `neutral-placeholder.json` · `runs/`.

Prices in `door.py` (per million tokens, Claude API, November 2026): Opus 5.5 $4 in, $5 cache write, $0.20 cache read, $20 out; Sonnet 5.5 $2, $2.50, $0.20, $10; Haiku 5.5 $0.10, $0.125, $0.01, $0.50. Thinking is adaptive and always on (no `thinking` parameter is sent); depth is `output_config.effort`; the head is cached with `cache_control` on its last block and the cache read share is measured from `usage.cache_read_input_tokens`.
