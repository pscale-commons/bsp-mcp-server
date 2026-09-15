# The flow producer — a window composition published as a walkable block

**Date**: 2026-09-15
**Status**: implemented on `claude/flow-producer` (this PR); the brief stands on the beach at `proposal:flow-producer` (weft, 2026-09-15, homesteaded under weft's lock the same day); the viewer half is happyseaurchin-home `mindflow/flow/` — #234 to #245 merged, #246 (the `beach:<block>` source and `?poll=`) and the block adapter that reads this shape following there.

## The ask

Publish a genus-one agent's window COMPOSITION — what entered the mind, from where, at what size — so a holder can watch the agent compile while it operates. Opt-in, default off. The beach records outcomes (trace, daily, history); nothing recorded what the window was made of, and the moment it is made of anything is compose, which lives in this repo.

## What the code decided against the brief

The brief was written from a shallow clone with no beach handler in view, and said so: where the block and the repo disagree, the repo wins. Four places:

1. **A flow document cannot live inside a block.** The beach's write-shape gate (`validateShape` in the `pscale-beach` handler) admits only `_` and the digits 1-9 at every level, and refuses JSON-looking strings, so `{flow: 1, rows: [...]}` is refused wherever it is put. The producer therefore writes a PSCALE block — which is also the only shape a plain `bsp()` walk can read without a viewer, and the brief's own reason for putting the document inside a block was that the block must explain itself.
2. **The door that runs egg-one's wakes is `mcp`** (trace:egg-one 91.2 and every entry since mid-August). happyseaurchin-home `api/genus-clock.js` — a Vercel cron at 07:07 and 19:07 UTC — composes through `pscale_genus` at bsp.hermitcrab.me, runs the seat loop against the Anthropic API itself, and folds through the same door. So `genusCompose` in `src/genus.ts`, called once in production from `handleGenus`, IS the shared compose seam for the clock, the claude.ai holder wakes and any pscale_genus wake; the brief's fear that "a pulse-woken agent silently never appears" does not apply to the pulse that actually runs. The xstream seat and bare pulse compose in the browser (xstream-bsp `animator.ts composeWindow`, doors `xstream-seat` and `xstream-bare`) and need their own emitter of the same block shape — a follow-up in that repo, named in the block's provenance.
3. **Three wakes, not one.** Latest-only draws a single column; the ribbons need a previous window to diff against. Three is bounded and replaced whole (David's ruling, 2026-09-15).
4. **Silent to the instance.** Nothing is added to the tool result the wearing LLM reads — the observation must not enter the observed. The dial on the agent's own block is where it knows it is watched; a failed publish is the server's to log.

## The block — `flow:<handle>`

```
flow:<handle>
  _    what this is — labels, addresses and sizes; three wakes; sizes estimated
  1-3  the wakes, oldest first — each {_: the wake line, 1: window, 2: reply}
       window  {_, 1: SYSTEM side, 2: MESSAGE side}; a side {_, 1-9: the parts
               in window order}; the hydrated bundle (`self`) is a part whose
               children are its currents, one span each
       span    {_: its line, 1: reference (name:address:attention, or the part's
               name), 2: chars, 3: lodestone rung, 4: change since the previous
               window — first | new | changed | unchanged | unresolved,
               5: fingerprint}
       reply   {_, 1: writes {_, 1-9: spans whose 4 names the current fed},
               2: the note (its history address and size), 3: in-loop count}
  9    provenance — which door wrote it, when last
```

Every span's `_` is a sentence a passer-by can read (`purpose:0:-2 — current 4 of the bundle — 4,210 chars ≈ 1,052 tokens — intention 3.1 — carried unchanged from the previous window`); the digits beneath are the same facts for a machine. Rung ids are the lodestone's (`src/lodestone.json`), the same ids the viewer colours by, so the two views stay in step by carrying the id rather than re-deriving it. The fingerprint (ten hex characters of a sha256 over the part's own bytes) is what lets the next compose flag `changed` without any text ever being stored.

Sizes are ESTIMATED from characters at four to a token, and the block says so in its underscore: this router composes the window but never makes the inference call, so no measured count exists here. The clock (genus-clock.js) does see usage; carrying it back through the fold would be a new parameter on the capabilities:3 contract, which is surface growth, so it is not done here.

## The switch — `wake:<handle>` position 7

The doorbell dial is already the holder-flipped, agent-re-voiceable law of how a shell may be woken (dial-absorbs-policy, 2026-08-14). Position 7 is the publish switch: it reads `on …` or it does not. Absent, off, or anything but a line opening `on` → nothing is written, no block, no stub. A ghost-wake holds no key and so cannot publish even when the switch is on; the clock, the holder's wakes and any keyed pscale_genus wake do. The dial's underscore is extended by one clause to name 7 (an underscore that enumerates six positions while seven stand is a rotted underscore, grips:7).

## Privacy

Labels, addresses and sizes only. No span carries text; a write is its address and its size; the note is the size of a line that lives at history:<handle>. `scripts/smoke-flow.ts` plants a secret and a 43k-character body in the fixture shell, PROVES both are in the composed window, and asserts zero occurrences of either — and of the shell key — in the published bytes; the block comes out under a quarter of one window's size. PRIVACY.md gains a paragraph under "What bsp-mcp does" naming the block and the switch.

## Verification

- `npm run smoke:genus` — 53/53 before and after; byte parity with `kernel.py --compose-only` intact (the producer reads the window after compose and never touches it; a smoke check pins that the bytes are identical before and after publishing).
- `npm run smoke:flow` — 53/53: off writes nothing; on writes a block that passes the beach's shape gate; flags read first / unchanged / changed across windows; a fourth wake drops the oldest; the fold's reply lands beneath its window; a second fold finds no window pending; the planted secret and fat body never reach the block.
- End to end, once deployed and the dial is on: egg-one's next clock wake writes `flow:egg-one`; `bsp(agent_id=beach, block='flow:egg-one', pscale_attention=0)` reads sensibly with no viewer; `/mindflow/flow/?source=beach:flow:egg-one&poll=5` draws it and redraws at the fold.

## Deferred, named

- The xstream seat and bare-pulse emitter (xstream-bsp `animator.ts`, where `trace.ts` already writes the per-wake trace under the shell key).
- The mirror producer: xstream-bsp `claude-direct.ts` logs each mirror call to `/api/filmstrip` with MEASURED usage; the same block shape written from the mirror column under the handle's own latch, opt-in, is the second producer.
- The viewer's peek fetching a reference live from the beach (the address is the reference; the text is one GET away).
