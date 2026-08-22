# The beach remembers when — one stamp for every write (2026-08-20)

**Status: proposed. Written at the keeper's ask in the mirror.2 session — "we need a
conformal, universal method. Please review a systemic solution rather than different
bespoke methods. We have one pscale block physics, and I thought we had universalised
the temporal stamp." The review below verifies what stands, names the one structural
gap, and proposes the smallest substrate change that closes it for every door at once.**

## 1. What stands, verified against the running handler

The keeper's memory is half right, and the half that is right is load-bearing:

- **The append path IS universally stamped.** `stampAppendTimestamp` in the beach
  handler (pscale-beach `api/pscale-beach.js`) stamps position 3 of every appended
  entry from the server's own clock, unless the entry already carries a valid
  ISO-8601 datetime — "this makes position 3 authoritative for recency", in the
  handler's own words. Marks, pool contributions, presence slots, history entries,
  grain conversation — everything slot-shaped that arrives via `append` is dated by
  physics, no client cooperation required. This landed with the recency-stamp work
  and it is the universalisation the keeper remembers.
- **The response envelope is stamped, stored nowhere.** Every bsp-mcp result carries
  the `now · <ISO> · <sundial> · <spoken date>` line — temporal context delivered to
  the reading mind on every call. It contextualises reads; it records nothing.
- **Position writes carry no time at all.** A mirror say — `bsp()` at a spindle, the
  mirror UI's say, an o-page's say, `pscale_stream_engage`'s say — stores exactly the
  JSON sent. No timestamp lands anywhere, from any door. The handler's stamp comment
  says it plainly: "Non-append writes never reach this."

## 2. Why the gap is structural, not an oversight

An accumulator **entry** has metadata fields by convention: its digits are fields
(1 who, 2 address, 3 timestamp, 4 face — block-conventions 9.1, 4.22, 4.6). A mirror
**node**'s digits are children — sub-addresses in the coordinate space. The same digit
that means "timestamp" in a mark means "third branch beneath" in a mirror. There is no
in-band position to stamp a say without colliding with the address space itself.

So the stamp cannot live **inside** the position. It must live **beside** it. The
/recency page's interim (each say drops one mark — who, where, when — through the
append path) is exactly that: routing the act through the substrate's one already-
universal stamp. It is conformal in shape but bespoke in coverage — only doors that
choose to drop the mark are counted. The keeper is right to want physics instead.

## 3. The two times (the keeper's distinction, ratified 2026-08-20)

A voicing's **address** is where the intention aims on the shared coordinate — a
project objective voiced at the year, a plan at next week. **When the hand actually
moved** — thought, wrote, did — is a different time entirely. Aim is geometry and the
substrate already carries it perfectly (the address). Act-time is the missing datum,
and it is what recency, live surfaces, and the torus of co-present instances all need.

## 4. The proposal — the surface remembers the touch

One addition to the beach, one field in the wire:

- **The beach keeps one map per surface: block name → ISO of its last write.** Every
  successful content write — position write, append, whole-block — sets
  `touched[block] = now` (one KV op, e.g. HSET on a single hash). DELETE removes the
  key. Nothing else changes.
- **The index serves it.** `GET /.well-known/pscale-beach` (no `?block=`) returns the
  derived index as today — `{_, origin, blocks: [...]}` — plus one sibling field:
  `touched: {"<name>": "<ISO>", ...}`. Purely additive; a reader that does not know
  the field ignores it and loses only refinement.

Properties, in the order that matters:

1. **Zero client cooperation.** Every door is covered by construction — MCP, o-pages,
   the mirror, xstream, scripts, a genus wake, a curl. The physics stamps, not the
   client. This is the conformal method the keeper asked for.
2. **No growth, no flood.** A map overwritten in place — one value per block, ever.
   (Contrast a touch-LOG, which heartbeats would flood; rejected here.)
3. **One KV op per write.** Negligible against the write it rides.
4. **Federated by nature.** Each beach remembers its own touches; nothing central.

## 5. What it powers

- **Act-recency for mirrors, exactly.** A mirror is one hand's block — `touched` of
  `now:happyseaurchin` IS "when did this hand last move in the now family". The
  count-is-people arithmetic gets its when for free. WHERE within the block moved is
  derivable by diff on refetch — or carried richly by an append-path act entry where
  a door chooses narrative (the /recency say-mark becomes optional colour, not the
  substrate).
- **What-changed-since in ONE GET.** The whole live-update question collapses: an
  o-page polls the index at pscale-0 rhythm (5–10 minutes, or 1 minute while fronted),
  compares `touched` to what it holds, and refetches only the changed blocks. Idle
  cost ≈ 6–60 GETs/hour/tab; a change costs one more GET. Against the naive full
  re-poll (~500+/hour) or the mirror's live budget (readings sweep + realtime vapour,
  thousands/hour), this is the cheap tier the o-page law wants.
- **Staleness for any reader** — a compile door, a wake, a fold can know whether a
  block moved since it last looked, before fetching it.

## 6. The wire-law question

The index response is part of the v2 wire, and the L1 kernel is frozen — but this is
an **additive sibling field**, the same class as presence position 7 (proposed
2026-08-10, landed): old readers unaffected, new readers refined. Still law-class by
the 2026-08-05 discipline, hence this proposal before any code. Sequence on the
keeper's word: pscale-beach canonical PR → operator clones (happyseaurchin,
idiothuman) → the /recency live tick → other o-pages as wanted. bsp-mcp needs no
change (the index passes through `db.ts` untouched); surfacing `touched` in tool
results is a later nicety.

## 7. Noted in passing, not proposed

The parked-place encoding on the presence wire now runs two forms: in-room presence
carries place at field 2 + coordinate at field 7 (block-conventions 4.65); a parked
block rides as the compound `<block>:<coordinate>` in field 2 alone (xstream-bsp
#263, read by the roster and now by /recency). Both work and readers handle both;
recorded here so the fork is chosen, not accidental, whenever 4.6 is next edited.

## 8. Implementation sketch (for the pscale-beach PR, after the word)

Handler: in the standard-write success paths (position write, append, whole-block)
and DELETE, one `HSET`/`HDEL` on `pscale-beach-v2:touched:<origin>`; in the index
handler, one `HGETALL` merged into the response. ~30 lines plus tests on the
file-backed rig. Operator clones redeploy unchanged.

## 9. Provenance

The mirror.2 session, 2026-08-20: the keeper's intent/act distinction (the same
morning's ruling that reshaped /recency), his conformal-method ask, and the verified
handler facts above. Companions: proposals/2026-08-02-liquid-field-2-settlement.md
(field 2 arrival stamps), proposals/2026-08-10-presence-carries-the-coordinate.md
(the additive-field precedent), watch:weft 135–136 (the enacting-point fish and the
torus — presence as NOW for any instance, which this stamp serves from below).
