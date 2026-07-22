# Convention evolution — the trunk and the canopy

*How pscale conventions vary without fragmenting: the open-source governance problem, answered mostly by geometry. Canonical statement on the substrate at `ways:authoring:6` (the block is the doc for agents; this file is its repo-shelf mirror). Human-facing rendering at happyseaurchin.com/minimal. 2026-07-22.*

## Three tiers of mutability

| Tier | Examples | Who changes it | How |
|---|---|---|---|
| **Sentinel — the trunk** | `pscale:grit`, `char-creation`, `sunstone` | Nobody, live: server-fixed, writes rejected | Evidence-bearing proposal → Designer judgment → deploy, under guard tests that pin each measured lesson and carry the history |
| **World canon — keyed** | `rules:nomad`, `spatial:<world>` at a world | The world's keeper | A `bsp()` write under the lock |
| **Table copy — free** | Everything in a forked bubble | The table's players | Bubbles copy unlocked; vary at will |

Players cannot change the law where everyone reads it; they can change their copy freely — which is where variation belongs.

## Five mechanisms

1. **The mount is the declaration.** A room's underscore names the law it runs (`pscale:grit/1`, `grit:tremors/1`) — the dependency is written at the point of use, human-readable, and *delivered with every engage*. Nothing is linked; the law arrives in the envelope. Adoption is one line; reverting is the same line.
2. **Copies are lockfiles.** Tables fork by copying, so running games are frozen at fork-time by construction. Editing a variant live affects only future forks — the pinning problem solved structurally.
3. **Provenance at position 9.** A variant carries its own lineage in its metadata branch: forked-from, what changed, when. Self-describing ancestry; no central log.
4. **bsp-floor is the diff.** Variants never merge (the family law, `project:nomad-rpg:9.6`): lay two schools on the common floor and read the per-pscale delta. Comparison is a read; reconciliation is forbidden; divergence is therefore safe.
5. **The kernel freeze is the shared genetic code.** Wire, walker, salts, spine rule — identical for every school, so any reader's LLM walks any variant cold. Species diverge; the biochemistry doesn't.

## The trunk path — how a variation becomes common

**Jungle → evidence → proposal → judgment → trunk.**

1. A Designer authors the variant at their world; tables mount it; **play is the testing** (jungle primacy: live tables are the truth of what works).
2. What proves out is **proposed** — the worktable's open intake and `proposals/`, with the standing bar: demonstrated by play, measured, third occurrence.
3. The trunk's keeper **judges** — the same fold-back act as bubble→spine canon, never automated, never a vote — and the change lands in the sentinel under its guards.

A school that never takes the path remains legitimate forever; it simply doesn't become the default that ships with every fresh beach.

## The named growth point

Discovery. Variants are found today by reading worlds and lighthouses. When a real jungle exists, an operator-curated `ways:` catalogue block — one authored line per variant, pointing at its position-9 lineage — is the whole answer: a read-view, never a gate, built when there is something to map.
