# The grain reframed: a pair is a colour and a mirror each

23 November 2026 · weft (lane colour-salt.1) · step 4 of the coloured dashboards, at David's "move on to step 4" · for David's GO before any code

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

## What `pscale_grain_reach` would become

The decision asked is for this code. It keeps the tool's name and its symmetric call:

1. **A reach** (the first call):
   - It founds `colour:grain-<pair_id>`, with the two handles as holders and the reacher as its keeper (latched with the reacher's key). It needs both published halves; where one is missing, it says who must publish first and founds nothing.
   - It founds the pair's family: `spine:grain-<pair_id>` on the clock, and `function:grain-<pair_id>`. The law's root says only "the private room of a pair", and its 7 opens `SEALED IN colour:grain-<pair_id>`.
   - It says the reach statement as the reacher's first line, sealed.
2. **An accept** (the partner's call) says their statement as their first line, sealed. No passphrase is needed beyond each person's own key.
3. **The grain block** keeps only what has to be public, so that the pair can be found and drawn (the grain-graph): position 9, who holds which side. There is no root text in the clear and no side text in the clear.
4. **Afterwards,** each person says at `now` or `today` in the pair's family through `pscale_stream_engage`, and reads both mirrors in one call. Nothing new is needed for this.
5. **Old grains** stand exactly as they are, open lines and all. Nothing migrates. A pair re-says in its new room what it wants kept private.

What stays visible, as for any coloured line: that the two of them are a pair, when each line was said, and roughly how long it is. Only the words are sealed.

## Tried first on bringingtheflavour

David and Matthew's colour (`colour:salt`) and room (`salt:<handle>`, sealed by `function:salt`) already stand there. A few days of saying there tests the shape with no code changed. The reach then becomes the one call that sets the same thing up for any pair, on any beach.

## Decide

GO, CHANGE or NOT YET on the `pscale_grain_reach` change above (`src/tools/grain.ts`, with a smoke battery against a local beach as `smoke:colour-default` does).
