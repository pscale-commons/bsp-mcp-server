# The reflection has a window

> **Status.** BUILT 2026-10-13 (weft, through Claude Code, a cloud seat), at David's "go — attach bsp-mcp and
> open the PR", after he asked that what already records calls be checked before anyone made "*another*
> monitor/reflection thing". The page that draws it is happyseaurchin-home `mindflow/reflection`, its own PR.

## 1. What David asked for

A live visualisation of a session's processing — "the bundles of calls", "coloured ribbons", "a one-to-one
trace of your activity — all done beach-side, or something like it". Two limits, in his words: not from a
Claude Code transcript ("sounds like spying"), and not inside the model's loop ("cholesterol in the llm's
process — but if it is done mechanically on the railway or kv side, fine").

## 2. What already records calls — checked first

- **This router's reflection** (`src/looks.ts`): every call it serves is a look — beach, block, address, read
  or write, instant, and the hand if the session gave a name at a door — held two minutes in process memory
  and written nowhere (`proposals/2026-09-28-the-torus-is-a-reflection.md`). It is the only record of who
  touched which block, where, and when. It had no window: only each ack's lateral line spoke from it.
- **The beach handler**: no reflection. `presence` is a page heartbeat swept after a minute; the census
  holds writes only; no request is logged.
- **Platform logs**: Railway logs `POST /mcp | session` with no block; Vercel runtime logs carry function
  output only — the path without its query — on short retention.

So no new monitor. The record exists; this gives it a window.

## 3. The change

`GET /reflection[?beach=<origin>]` on the router returns the ring as JSON:

```
{ _, now, window_s, beach, looks: [ { lane, hand, beach, block, spindle, wrote, at } ] }
```

- **lane** — `sha256(per-process salt + session)` cut to eight hex: stable while the process lives,
  unlinkable across restarts, and never the session id (a session id routes MCP requests; it is never
  published).
- **hand** — only where the session gave a name at a door, exactly as the lateral line says it.
- **the same window** as the line (`LOOKS_WINDOW_MS`, two minutes), oldest first, at most 600 looks.
- **nothing stored, nothing added**: no beach write, no field on any ack, no new tool. A page polls it and
  keeps what it saw in its own tab. Mechanical, on the router's side, as asked.

## 4. What widens, said plainly

The lateral line tells each caller the latest place of every other session. The window tells anyone with a
browser every call of the last two minutes: the same facts, a wider audience, and the sequence rather than
only the latest place. Sentinel reads stay out of the ring, as before. If the audience proves too wide, the
narrowing is small — serve only lanes that carry a hand.

## 5. Tests

`smoke:looks` gains seven cases (one beach only, oldest first; never a session id; a lane stable per session
and distinct across sessions; a name only from a door; reads and writes kept; every beach when none is
named; the window closes). The CI offline suite passes. Locally, end to end: two real MCP calls through the
router, both in the window, the session id absent from it, every other path still 404.

## 6. Deploy

`src/` changes, so Railway redeploys on merge — every live MCP session ends once.
