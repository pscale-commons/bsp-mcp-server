# The grain reframed: a pair is a colour and a mirror each

23 November 2026 · weft (lane colour-salt.1, landed in grain-way.1) · step 4 of the coloured dashboards · David's GO, landed as a way, with no code

## What a grain is today, and where it leaks

Scoped on 21 November (lane grain-scope.1; history:weft 529, watch:weft 1138):

- **The founding words are public.** The grain's purpose (its root) and both reach statements (the side underscores) are written in the clear by `pscale_grain_reach`.
- **Each side needs a passphrase of its own,** separate from the person's everyday key. weft's vault keeps one per grain.
- **A side holds nine lines and then refuses the tenth** (ways:grain 5).
- **The lines are sealed pair-wise from both published halves.** So when either person's key changes, both lose the old lines. On 5 November three grain lines were let go for this reason.
- **Pages wrote in the clear** before the voice learned to seal. In David and Matthew's grain (grain:4dcaf5f465d5ff31), 14 of 16 messages stand open.

## What the beach has since 23 November

- **Coloured stigmergy** (proposals/2026-11-03-coloured-stigmergy-the-design.md): a colour seals any line for its holders. Membership changes by turns: a leaver keeps the old lines and gets no new ones.
- **A law that names its colour seals its family by default** (#640, proposals/2026-11-23-a-law-names-its-colour.md).
- **Both are proven live.** The admin family on beach.happyseaurchin.com is sealed in colour:admin. On bringingtheflavour, the members' room (`function:salt`, `spine:salt` on the clock) is sealed in `colour:salt`, which David and Matthew hold.

So a private pair needs no grain-shaped block at all. It needs:
- **a colour** with the two of them as holders;
- **a family on the clock** whose law opens `SEALED IN colour:<it>`;
- **a mirror each,** latched by each person's own key.

Read together, the two mirrors are the conversation: the braid of the two hands' lines, side by side.

## How it landed: a way, not a tool

The draft of this proposal asked for a change to `pscale_grain_reach` (`src/tools/grain.ts`): a reach that founds the pair's colour and family and says the first line, sealed. David's GO came with a warning: without the strata, "we are just moving from code to more code to even more code and our work has NOTHING to do with the pscale beach". Read through the strata, the change needed no code:

- **Physics, one block.** Every part of the room is a block the beach already has: `colour:<name>` (the keeper's turns and copies), `spine:<field>` on the clock, `function:<field>`, and `<field>:<handle>`.
- **Chemistry, blocks in company.** Every bond is a reference the beach already honours: the law names its colour (#640), the stream composes spine, mirrors and law by the field's name, and the pair id the room is named by is the grain's own (ways:grain 1), so the room and `grain:<pair_id>` are found from the same two handles.
- **Biology, the loop.** Saying in the room is the say at `now` or `today` that every family already has.

The reach in code would have folded four calls a person can read into one they cannot. orientation:weft 1 says to stop there: "if the act … reaches for code where a block would do, stop". So it landed on the beach as a way:

- **The root of `ways:grain`** says that a grain's private room is the default for anything the two say to each other, and that the grain block `pscale_grain_reach` makes is the pair's public record, its founding words in the clear (3.1). Nothing private is said in a reach. The root it replaced stands at `archive:ways:grain:2026-11-23`.
- **`ways:grain` 7, the room,** is one spindle walked in order. Each rung names a verb that already exists:
  - 7.1: the keys first, with both halves published at passport 9;
  - 7.11: the colour, `bsp()` with `members` and `new_lock` on `colour:grain-<pair_id>`;
  - 7.111: the family, `spine:grain-<pair_id>` on the clock and `function:grain-<pair_id>`, whose line opens `SEALED IN colour:grain-<pair_id>`;
  - 7.1111: say and read, `pscale_stream_engage(field='grain-<pair_id>')`;
  - 7.11111: when a word changes or one leaves, the keeper turns the colour;
  - 7.111111: when the walk feels long.

Nothing in `src/` changes. `pscale_grain_reach` stays as it is, and old grains stand as they are, open lines and all. Nothing migrates; a pair re-says in its room whatever it wants kept private.

What stays visible is the same as for any coloured line: that the two are a pair, when each line was said, and roughly how long it is. Only the words are sealed.

## When a tool would earn its place

A tool becomes worth writing when pairs who walk the way by hand show what is missing. That would be a new proposal, citing what they hit. One gap is already observed: through a signed connector, a say made before the session has opened its copy of the colour is sealed as a letter to the colour, which both holders read once their copies are open (watch:weft 1146). Until bsp-mcp learns otherwise, the way says how to open the copy first (7.1111). Whether a signed connector's key may serve as the sealing word is David's decision (`spine:coloured-stigmergy` 1.8). It is queued as its own task.

## Tried first on bringingtheflavour

David and Matthew's colour (`colour:salt`) and room (`salt:<handle>`, sealed by `function:salt`) already stand there. The way's shape is the same for a pair as for SALT's members. A few days of saying there test it before any pair is asked to walk it.

## Decided

GO (David, 23 November 2026), landed as `ways:grain` 7 and its root, with no change to `src/`.
