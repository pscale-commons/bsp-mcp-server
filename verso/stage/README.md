# verso/stage — the live stage

For a talk given far from this Mac. David talks into his phone at the venue, and the Mac at home hears him through whisper. A screen at the venue, any browser on the projector computer open at happyseaurchin.com/mindflow/live/, shows what he says as an image cloud: the words and ideas grow as live pictures while he talks, each idea drawn as a motif lifted from his films, and Haiku composes pictures from them. With `?mode=films` the screen plays one whole film at a time instead, chosen from his words. The talking cells stay off, and nothing speaks.

```
phone (phone.html, the mic)  ──wss──▶  host.py --stage (port 8767)  ──ws──▶  live.py --socket (port 8768)
                                         │   ▲                                   │ whisper, the floor
                                         │   └────────── words, floor ───────────┘
                                         │  the chooser (stage.py): keywords at once, Haiku every ~6 s, $1 cap
screens (mindflow/live/?source=wss://verso.hermitcrab.uk)  ◀──wss──  {heard}, {film}, {compose}
```

- **phone.html** captures the microphone (getUserMedia → AudioWorklet `ear.js` → 16 kHz mono 16-bit frames of 128 ms → the socket). It keeps the screen awake with a Wake Lock. It has one big start/stop button and a button for every film; a pick goes to every screen at once and holds there for 90 s.
- **live.py --socket** (`verso/voices/`) hears what the stage relays, exactly as it hears the microphone or a file.
- **stage.py** (`verso/cells/`) groups the words into phrases and sends each to the screens. From the last ~30 s it matches the catalogue's keywords at once, answering only what was just said, and every ~6 s, when something new was said, asks Haiku (claude-haiku-5-5, through `door.py`) for the same idea said in other words. Haiku stops at `stage_usd` ($1) for the whole talk; a call costs about $0.0002, so an hour is about $0.12. The catalogue is the screen's own, `mindflow/live/catalogue.json` in happyseaurchin-home: the stage reads it from the site, or from the local checkout until the site has it.
- **The same Haiku call composes a picture** when the catalogue has motifs (`motifs` in catalogue.json, name → what each shows): one to three motifs, how they relate (`inside`, `linked`, `turning`) and a label of a few words, sent to every screen as `{type: compose, motifs, relation, label, phrase}`. The same picture again within 30 s is not sent. With the composing, a call costs about $0.0003 (it thinks a little longer, so it has 1000 tokens of room), about $0.20 an hour; the $1 cap stands.
- **The screen, as an image cloud** (the default; `mindflow/live/cloud.js`): Mindflow's rules place everything, as in mindflow/basic. A word or an idea grows with how often it is said and fades with how long ago, and what is said together is drawn together and linked. An idea with a motif (`mindflow/live/motifs/`, small live drawings lifted from the films; the gallery is `mindflow/live/motifs.html`) is drawn as that motif under the word that called it up; Haiku's pictures show two or three motifs inside one another, linked by a cord, or turning one into the next, under their label. A film picked on the phone shows over the cloud for 90 s.
- **The screen, as films** (`?mode=films`) keeps it calm. It shows one film at a time and holds each at least 30 s. A strong match may replace it sooner, but never within 15 s of the last change. When nothing matches, the screen shows only the words.

The stage has its own ports, 8767 and 8768, because a Verso run may hold 8765 and 8766. Through the Cloudflare tunnel, `verso.hermitcrab.uk` reaches 8767 only. A host that is not in `--stage` refuses every request that came through the tunnel, so a run's records and its start stay on this Mac.

## Start it (two terminals, on the Mac)

```bash
cd ~/Projects/bsp-mcp-server/verso/voices && .venv/bin/python live.py --socket --port 8768 --no-who --quiet-ticks --prompt "pscale, pscale blocks, the beach, hermitcrab, stigmergy, murmuration, Verso, endosystemics, Now Catalyst, C to B to A"
```

```bash
cd ~/Projects/bsp-mcp-server/verso/cells && .venv/bin/python -u host.py --stage
```

The host prints `stage: hearing through ws://localhost:8768` once whisper is up. The tunnel needs nothing: the launch agents `com.cloudflare.tunnel` and `com.cloudflare.lm-studio-tunnel` run `cloudflared tunnel run lm-studio` at login, and `~/.cloudflared/config.yml` carries `verso.hermitcrab.uk → http://localhost:8767`.

## At the venue

- **The phone:** https://verso.hermitcrab.uk. The first time, choose a stage word (four letters or more). The first phone sets it, and you type the same word on any other phone. Then press Start listening. Keep the page in front and the screen on: an iPhone cuts the microphone when the page goes to the background. If it does, the button turns amber; tap it to listen again.
- **The screen:** https://happyseaurchin.com/mindflow/live/?source=wss://verso.hermitcrab.uk, then `f` for fullscreen. Add `&debug` to see why each film came up.
- **If the Mac chain fails:** https://happyseaurchin.com/mindflow/live/?listen hears the room through the projector computer's own microphone, by keywords only.

## Rehearse it

`feed.py` plays a recording into the stage as if the phone heard it, and prints each phrase and each film choice at its time from the start of the audio:

```bash
cd ~/Projects/bsp-mcp-server/verso/voices && .venv/bin/python standin.py scripts/stage-1.json --out runs/stage-1/
cd ../stage && ../voices/.venv/bin/python feed.py ../voices/runs/stage-1/audio.wav --url wss://verso.hermitcrab.uk --word <the stage word>
```

A test stage that must not claim the real word sets `VERSO_STAGE_WORD_FILE` to a file of its own.

## The word, the log, the spend

- The stage keeps only the word's hash, at `~/.config/verso/stage-word`. Delete that file to choose a new word.
- What was heard, each choice with its lag (the word reaching this Mac → the choice, and each link's round trip), and each Haiku call go to `verso/cells/runs/stage-<when>/`. They stay on this Mac (gitignored).
- Measured on the stand-in on 10 November 2026: whisper hands a phrase to the stage 2.6 to 3.6 s after its last word reached the Mac, and a keyword choice goes out at once. Haiku answers in 0.8 to 3.2 s, and it caught both paraphrases the stand-in tried (birds turning at dusk → the flock film; the models thrown away and built again → tech-evolution). The screen then loads the film and crossfades over 2.4 s.
