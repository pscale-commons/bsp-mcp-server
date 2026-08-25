# Live surfaces and the carried door — consolidating the catalyst's design parameters (2026-08-21)

**Status: PROPOSED, by admission-by-failure. The keeper asked for these parameters to be
consolidated "to ensure we don't fall into creating dead interfaces with well-composed,
articulate but dead content", after a footer shipped the previous night did exactly that
(happyseaurchin-home #144, reverted by #145). Law-class: proposal-first, no block write
until the keeper rules. Target home: `ways:views` branch 6, which already governs the
renderers at 1.1 and already grows this way — branch 5 carries the 2026-08-01 correction
where wording read exactly as written cost a real person the deck she was reaching for.**

## The failure this is admitted from

A site footer was injected once from `theme.js`, naming ten places in four columns. It was
well-composed: tokens only, both registers, four columns to two on mobile, no horizontal
scroll, current page marked, `aria-current` set, hidden in print. Every structural check
passed. It was verified for an hour and never once clicked as a named person.

Every page on the site takes its handle from the URL path and nowhere else
(`now.html:423`, and the same shape in walk, morning, ahead, across, field, recency).
There is no stored handle. **The path is the memory.** The bars had always built their
links as concatenations — `'/walk/' + family + '/' + HANDLE` — because a door has to
carry the walker.

The footer's links were bare names. Every click discarded the handle and landed the reader
as `anyone`, reading the spine instead of their own mirror. The keeper found it in minutes
by using it: *"all the links are dead. there's no memory of the user. which is
disconcerting."*

The instructive part is not the bug. It is that the surface was **articulate and dead at the
same time**, and that no amount of reviewing it would have shown that, because deadness is
invisible from inside the composition and only appears in use.

## P1 — A door carries the walker

Path is identity. Any control that moves a person must carry their coordinate: the handle,
plus the family or address where the target takes one. A control that cannot know the walker
cannot be a door — it is a hole with a name over it.

**Therefore movement is COMPOSED BY THE PAGE, never injected into it.** Only the page knows
who is standing in it. This is the precise inversion of what #144 did, and the reason its
premise ("the same names on every page, injected once, no page edits") could not have been
made to work by better styling: the thing being injected was the one thing the injector
could not know.

The path shapes differ, which is why no single generic form fits:

| location | path takes |
|---|---|
| /now, /morning, /ahead | `<handle>` |
| /across, /field | a first member |
| /walk, /recency | `<family>` + optional `<handle>` |
| /earth | nothing |

**Test:** walk every control as a named person. If you arrive as `anyone`, it is not a door.
This test is cheap, it is not optional, and it is the one #144 skipped.

## P2 — Two kinds of location, and they are not peers

**Inhabited** — your `/now`, a project spine, `ahead` as cards. You write here. They are
handle-scoped. Movement between them must always be available and must always carry you;
these are the moves the keeper named first, and they are the catalyst's spine.

**Indicators** — `recency`, `across`, `field`, `earth`. You glance; you do not dwell. They
situate you among others and are optional by nature.

A flat list of equals makes a glance weigh the same as a home. #144's four columns did that,
and it is why the arrangement felt orderly and served nobody: the two homes and the four
glances sat in one rack at one weight.

## P3 — Three surfaces, and each must not attempt what another does better

- **The beach — the molecules.** Holds and accumulates. Truth lives here; nothing else
  stores anything.
- **The LLM — mirror.onen.ai, xstream.onen.ai, or any instance through bsp-mcp.** Syntheses,
  and **semantic movement**: an LLM can take you to where a thing is being worked because it
  can read what you mean. Movement by meaning belongs here and nowhere else.
- **The o-pages — HTML, with the tools humans already use**: sliders, buttons, rungs, dials.
  Their job is **situating**, which is smaller and sharper than navigating. A page offers
  movement along the dimension it already displays, and hands off to the mirror for anything
  semantic.

The per-page `mirror ↗`, carrying that page's own coordinate, IS that handoff — which is why
it is an act and stays in the page, and why a bare `mirror.onen.ai` link is a different and
much weaker thing.

An o-page attempting to be a complete site map is doing the LLM's job badly. #144 was
exactly that mistake, and its articulacy was what disguised it.

## P4 — The liveness test: two questions, both must pass

1. **Content.** Would anything on this surface be different because ANOTHER PERSON MOVED?
   If it reads the same whether or not anyone else exists, it is dead. `/walk`'s presence
   chips pass. `/across` laying every mirror at one rung passes. A rack of page-names cannot
   pass, at any level of craft.
2. **Control.** Does this control carry me somewhere I am RECOGNISED? If it empties me, it is
   dead.

A surface can be well-composed, accessible, responsive, theme-correct, and fail both. Run
these two before the structural checks, not after — the structural checks all passed on #144.

## P5 — The purpose that decides ties

Every surface here serves humans coordinating relative to one another in their imaginative
psycho-social reality, in their living concurrent momenting. So where a choice is balanced,
prefer the one that shows **me, in company, now**.

A page that shows only my own writing is a diary. The platform is socially reflexive or it is
nothing, and "socially reflexive" is a property of what a surface DOES when someone else acts,
never of how well it is written.

## What this implies for the movement the keeper actually needs

He needs to move between his `/now`, project spines, and `ahead`-as-cards, with the four
indicators available as glances. That needs buttons. The correction to #144 is not "no
buttons" — it is **buttons the page builds**.

The shape that keeps one home for the design while letting identity ride: `theme.js` exposes
a helper the PAGE CALLS with its own context — `siteDoors({handle, family})` — instead of a
block that injects itself and guesses. One helper, one line per page, and every href built
from what that page actually knows. Where no handle is known yet (a bare `/now`, which is the
ask screen), the handle-scoped homes are NOT SHOWN AT ALL rather than shown empty: there is
nowhere for them to go yet, and saying so by omission is honest where a dead link is not.

Cards join when cards exist. `/opportunities` joins when it exists.

## Provenance

The keeper's framing, 2026-08-21, in his own words: the catalyst is "a combination of
molecules on the beach which allow people to see themselves within their social context,
reported through an llm-app, bringing themselves to a sensitive socially reflexive platform
which is mirror.onen.ai (and xstream.onen.ai), and providing a set of HTML o-pages to help
humans situate themselves with tools they are used to using (sliders, buttons, etc)."

Companions: `ways:views` (the convention this extends, branch 5 the prior
admission-by-failure), `function:molequle` 5 (the participant's register — never an address,
a digit, or a block name to a human), happyseaurchin-home #144 and #145, `watch:weft` 138-141.
