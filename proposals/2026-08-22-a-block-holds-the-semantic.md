# A block holds the semantic and refuses the situation — grips branch 8 (2026-08-22)

**Status: PROPOSED and landed the same day at the keeper's word ("yes write the proposal
and land grips:8"). Law-class, so this file is the record that precedes the write. The
lesson was found by building, and the keeper's first statement of it was BACKWARDS, which
is the most useful part of the provenance and is kept here rather than tidied away.**

## What was built

happyseaurchin.com grew a project row: a strip under the bar naming the families a person
counts as their own, tapped to move between them. The list lives on the beach at
`lists:<handle>` branch 1, nested so rank is depth.

## What the keeper asked

> "will our system work with the personalised handle so that as i flick between them, I
> flick between now, projects etc related to happyseaurchin? Is this why this system is
> better than the coded version? because the url's are set in the list and the read just
> loads the list 'as is'?"

It works. But **the URLs are not in the list, and it would not work if they were** — which
inverts the reason and is what makes the note worth writing.

## The finding

The list holds NAMES. The address is composed at the moment of reading, from three sources
that never meet:

| source | contributes |
|---|---|
| the **list** | *which project* — a name, nothing else |
| the **page** | *which view* — walk, or recency |
| the **arrival URL** | *which person* — the handle the reader came by |

Demonstrated, and cheap to repeat: one block, one branch, two pages.

```
on /walk     →  /walk/wow-experiences/happyseaurchin
on /recency  →  /recency/wow-experiences/happyseaurchin
```

The same list serves both **because it never said "walk"**. It never said "happyseaurchin"
either; that arrives in the URL. Which is why moving between projects keeps a person as
themselves without anything having been told who they are.

## Why it is chemistry rather than physics

A single block's behaviour is physics. This is two systems bonded by reference where
NEITHER CONTAINS THE OTHER: the list knows nothing about pages, the page knows nothing
about anyone's projects, and the useful thing — the address — exists only while both are
being read. That is semantics moving between blocks where code would move data through
functions, and it sits directly beside `grips:6` (every aperture has one full address
B·S·P) as its authoring consequence: the four coordinates rarely belong to one holder.

It is also why this beats the coded version it replaced, though not for the reason first
guessed. The coded version wrote `'/walk/' + f + '/' + HANDLE` into every page, so every
page had to know the shape of every destination. Now one composer knows the shapes, the
block knows the meanings, and the URL knows the person.

## The anti-pattern, stated so it can be recognised

Storing the composed address is the tempting shape and it fails ONE SITUATION LATER rather
than immediately, which is why it survives review. A list holding `/walk/gal/david` reads
correctly on the walk, is wrong on every other page and for every other reader, and nothing
rejects it — a compound has no walker (`grips:7`).

The tell: **a stored string carrying a coordinate its holder does not own** — a page name
inside a block about projects, a handle inside a block about places.

## The test

Ask of each coordinate: *who would know this without being told?* What a block knows about
itself, it stores. What the reader brings, it leaves out. A value a block could not have
known is a value it should not hold.

## Provenance

Found while building the project row and the `lists:<handle>` block, 2026-08-20 to 08-22
(happyseaurchin-home #146-#149). Companions: `grips:6` (the full address), `grips:7`
(compound faults land silently), weft's orientation branch 8 (the beach inverts
operationality). Lands at `grips` branch 8, which stood free.
