# The federation-protocol block catches up with the wire it describes

**Date**: 2026-08-13
**Status**: PROPOSED (merge is adoption; the live-beach rewrite lands with this readable)
**Provenance**: a reproducible finding from Matthew (Phenomemental), relayed by David (pool:weft:18, 2026-08-12); verified live 2026-08-13.

## The finding, confirmed

Matthew, building thin live pages the way /render does, followed `federation-protocol:2.1` — "GET / — return the whole beach block as JSON. Optional query: ?spindle=<address> returns just that slice; ?pscale=<int> adds depth-attention" — and called `GET /.well-known/pscale-beach?spindle=<name>&pscale=<int>` against beach.happyseaurchin.com. Both calls returned the full ~500-block index, parameters apparently ignored.

Reproduced exactly. The beach is not diverging; **the spec block documents the pre-migration wire**. It was written for the single-block-per-origin model (its own 1.2 says "One block per origin by default, named 'beach'"), where `?spindle=&pscale=` sliced *the* block and no `block=` parameter existed. The 2026-05-08 beach-as-surface migration made `?block=<name>` required on every block-targeting call and made a block-less GET return the surface index — which is exactly what Matthew received. His hypothesis ("the parameter shape in the spec is not the shape the backend actually accepts") was right, and nothing in his method was wrong: he read the arriving-builder's spec and the spec described a dead world.

The backend is in fact **more capable than the old spec promised**, verified live: `?block=<name>` (whole block), `&spindle=<addr>` (raw node), `&pscale=<int>` (shape-resolved disc envelope `{floor, shape, entries}`), spindle+pscale (path-walk+descent envelope), CORS open (`access-control-allow-origin: *` — browser-direct, no relay). The working reference call is /render's own: `fetch(origin + '/.well-known/pscale-beach?block=' + name)` (happyseaurchin `render.html:197`).

## What changes

1. **`seeds/library/federation-protocol.json`** (pscale-beach PR, same date): branches 1.2, 2 (whole), 3.2 and 5.4 rewritten to the post-migration contract — `?block=` required, block-less GET = index, the three read dials, the POST body shape (`{spindle, content, secret?, new_lock?, gray?, confirm?, append?}`), the canonical 2026-05-17 shape vocabulary (point / path-walk / path-walk+descent / disc / block — the old text still said "ring, subtree"), and the dated single-beach state line replaced.
2. **The live block at beach.happyseaurchin.com**: same content, archived first at `archive:federation-protocol:2026-08-13` per the law-writes discipline.
3. This repo: no code — the wire was always right; the record is this proposal.

## Why the stale spec survived fifteen weeks

Nothing loops through a seeded library block — no wake reads it, no smoke pins it, and every resident client (bsp-mcp adapter, xstream, /render) carries the correct call in code, so only an *arriving outside builder* ever reads the spec cold. That is strata:3.3 (a law with no loop is inert) in its documentation form, and the first cold reader found it. No new loop is proposed — beach operators pull seed updates by choice — but the seed is now correct at the source.
