# Tables are listed where they are played — the doors just do not read it (2026-09-20)

**Status**: DRAFT for the keeper's ruling. David, 2026-09-20: "draft the law change so
tables are listed", asking the question that names the whole fault — *"if it is findable by
an o-page for public consumption, why on earth is it hard to find by claude-ai or
mirror?"* — after the mirror could not find Garth and Equinox while
[`/rpg/brackenfoot`](https://happyseaurchin.com/rpg/brackenfoot) lists their table to anyone
with a browser. Nothing here needs a new primitive or a new block family.

## 1. The listing already exists

The beach serves it (`pscale-beach` #69, operator clone #31):

```
GET /.well-known/pscale-beach?tables
```

Every `/w/<name>` world under the beach's own origin that has had a room written, newest
room write first, each with the room its latest voice landed in. It is derived per GET from
each world's touched map, so nothing is kept for it: a table joins the list by being played
and sinks down it by being left. Only `pool:` blocks count — not presence, not staged
liquid.

Asked today it answers seven tables, `brackenfoot-david-julie` at the top, its live room
`pool:211`. The table David could not find through the mirror was first on the public list
the whole time.

## 2. Who can read it

| door | sees tables? |
|---|---|
| `/rpg` and `/rpg/<scenario>` o-pages | **yes** — they fetch `?tables` and show every table playing a scenario |
| a browser with the URL | yes |
| `bsp(agent_id="<beach>")` — the surface index | no: the index returns `{_, origin, blocks}` |
| `pscale_play(world=…)` | no: it resolves register → `/w/` probe → sub-domain, and a name it cannot guess simply fails |
| the mirror's client | no, for the same reason |

So the asymmetry is not privacy and not law — it is that the LLM-facing doors were built
before the listing existed and nobody went back for them.

## 3. The law gap

The `worlds` register says, correctly, that the register is canon and the operator's open
tables, and that "the countless ephemeral tables players fork are **never listed here**". It
does not say where they ARE listed. A reader — human or LLM — concludes they are nowhere,
which is what happened here: the conclusion reached was "your table is private by design",
when a public listing of it was one read away.

## 4. Proposed

**4.1 — the law (one clause at the `worlds` underscore).** After the jungle sentence, name
the listing: *"A table is not listed here, and does not need to be: the beach lists every
table played at it — `?tables` on this same endpoint, newest room write first, derived from
what has actually been played. The register is the curated map of canon and the open tables;
the tables listing is the live one."* A law write at the apex, weft's key, this file first.

**4.2 — the surface index carries it (bsp-mcp).** When a beach serves a tables listing,
carry it in the index a caller already asks for, so `bsp(agent_id="<beach>")` shows the
blocks AND the tables. One field in `loadBeachIndex` (`src/db.ts`) and one section in the
index render. An agent's first act at a beach then shows the same thing a browser sees.

**4.3 — `pscale_play` consults it on a miss.** When a world name matches no register line
and no `/w/` probe, read the listing and name the near matches rather than failing blind;
when a name resolves to a scenario, name the tables live at it. A player who says "play
brackenfoot with David and Julie" then reaches the table instead of the canon.

**4.4 — a person's own characters stay the vault's job.** The public listing answers "what
is being played here"; it cannot answer "which of these is mine", and should not — the
2026-09-15 ruling put that in `vault:<person>`, private, travelling with the person's key.
With 4.2 in hand, "where is Garth played?" is the listing plus one index read per table —
seven reads today, and the vault makes it one.

**Not proposed**: listing tables in the register itself. The jungle is unbounded and the
register is a curated map; conflating them is what the register's own law already refuses.

## 5. Why this is the shape

The substrate's answer to discovery has been the same everywhere: derive it from what was
actually written, never keep a second register that can drift. The tables listing already
obeys that. The only thing missing is that the doors an agent walks through do not offer
what the beach already serves — and every time that gap opens, the agent concludes the
thing does not exist rather than that it could not see it.
