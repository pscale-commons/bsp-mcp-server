# A law names its colour — sealing by default

23 November 2026 · weft (lane colour-default.1) · at David's "Go ahead with step 1"

## What

A family's operator (`function:<field>`), or a room's purpose (the underscore of `pool:<name>`), names the colour its lines are sealed in with a line that **opens** `SEALED IN colour:<name>`:

- in an operator, at its root or at any of its digits (the line itself, or that digit's own underscore);
- in a room, at its purpose — or in the law the purpose mounts, when the purpose is a bare reference (`function:<field>`), never a `pscale:` sentinel.

Where one does, every `say` and `keep` (pscale_stream_engage) and every commit and stage (pscale_pool_engage) made there with no `gray` passed is sealed in that colour, exactly as if the caller had passed `gray: "colour:<name>"`: the words one zero deeper, author, address, stamp and face open; a holder's line sealed with the current turn's key, a line from anyone holding no copy sealed as a letter to the colour. The ack says the law named the colour. `gray: false` writes a line open. A family or room that names no colour writes open, exactly as before, and nothing else changes for it.

A law naming a colour that does not stand at the beach writes nothing and says why, so a line meant to be private never lands open by mistake.

## Why

David asked for private by default (21 November: grains "need to be by default"), then for coloured dashboards by audience — admin for weft and him, builders for keel, personal, strangers — with a colour key on pages (23 November). This is step 1 of four: the substrate piece every other step stands on.

1. **This step** — a law names its colour; its family or room seals by default.
2. `colour:admin` for David and weft, and /loom drawing sealed lines for holders and grey for everyone else.
3. A colour key in the site's bar, so every page opens the colours its reader holds, and an admin list in the go menu.
4. bringingtheflavour: the personal and builders colours, then a grain reach that founds its pair's colour, tried there first.

## Where the reference lives, and why there

- **The law names its own parts** (strata 2.2): the operator says how its mirrors are written, so it says what they are sealed in. The reference runs law → colour and never back (strata 2.12).
- **Not by name.** A family called `admin` and a colour called `colour:admin` share a name, and a shared name is discovery, never a bond (strata 2.1). The law must say it.
- **Not at the operator's underscore as a bare reference.** A bare reference there already means "this family runs that generic law" (operatorLaw, one hop), so `colour:admin` there would be read as the law itself.
- **An opening marker, the lens's way.** A law mounts a recipe with a line opening `THE RECIPE MOUNTED` (lens.ts). The same form here reserves no digit, so any family can name its colour wherever its law has room, and a sentence that merely mentions a colour in passing names nothing.
- **A room reads its purpose only.** Every digit of a pool is a contribution (the accumulator), so a contribution that happened to open with the marker must never change the room's colour.

## What stays visible

The same as any coloured line (proposals/2026-11-03-coloured-stigmergy-the-design.md): who said something, where, when, roughly how long, and in which colour and turn. Only the words are sealed. A dashboard finds the colours a reader holds from the beach's index (every `colour:<name>` is a block there, and each copy in it names its holder) — no registry and no sweep.

## Not in this step

- `bsp()` writes stay explicit: a line written straight into a mirror with `bsp()` is sealed only when `gray` says so.
- Pages write through the beach's voice (pscale-beach `voice.js`), which does not yet read the law's colour; a page saying into a coloured family must pass the colour itself until the voice learns the same rule.
- The colour key in the bar, `colour:admin`, and grain reaches founding pair colours are steps 2 to 4.

## Checked

`npm run smoke:colour-default` (26 checks, a local beach from pscale-beach's `scripts/local-beach.mjs`, or `BEACH_URL=` a live one): `colourOfLaw` at a digit, a digit's underscore, the root, a supernested root, a room's purpose, and not mid-sentence or two digits down; at a mirror a holder's say and keep sealed, `gray=false` open, a member with no copy writing a letter, a family naming none open, a missing colour writing nothing; in a room a commit and a stage sealed, `gray=false` open, a stranger's letter, and a room that mounts the law sealing by it. Unchanged beside it: `smoke:private-room` 64/64, `smoke:colour` 69/69, `smoke:stream` 58/58, `smoke:key-guard`, `smoke:unit` 23/23, `tsc`.

## Deploy

The change is in `src/`, so merging it redeploys the router at `bsp.hermitcrab.me`, which ends every live MCP session: merge at a quiet moment.
