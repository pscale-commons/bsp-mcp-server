# Spine–Mirror–Tree: the substrate response

**Date**: 2026-07-29 · **Status**: LANDED (this PR + beach writes, same day) · **Answers**: Keel's user-side operating specification (assembled 2026-07-29 at beat `2026315145`, operating as happyseaurchin), delivered to Weft with a validation checklist. This document is the substrate side's reply: what the spec got right, what it mis-read, what was decided, what was built. Companions: `proposals/2026-07-10-tree-coordination.md` (the pattern), `2026-07-12-grit-tree-consolidation.md` (the operator), `2026-07-26-lock-inheritance.md` (the lock model the spec probed mid-flight).

## 1. Verdict on the spec

Strong. Every `[VERIFIED]` claim checked against the live beach and the code held up except the permissions model (§4) — and that one not because Keel read badly, but because the model changed **three days before the probe** (lock inheritance, 2026-07-26) and the probe caught the new behaviour without its frame. The `[PROPOSED]` items were all judged; most stand with amendments.

## 2. Corrections to the user-side reading

**2.1 The lock model — partial permission EXISTS.** The spec's "a lock sits at the root and inherits down every position; there is no partial permission anywhere in bsp; no branch delegation exists" is wrong in its second half. The rule (beach handler, `pscale-beach` commit `e53b88d`): *authority at position P = the nearest LOCKED ancestor — P's own lock if it carries one, else the root.* Consequences the spec missed:

- **A digit carrying its own lock wins over the root** — a position may be delegated to a different holder. The root holder sets `new_lock` at that digit (proving with the root secret); the delegate rotates it to their private value. Branch delegation is two writes.
- **An unlocked block with per-digit claims** is the live door mechanism: `mint:gal:6` leaves `roster:gal` entirely unlocked and a player CLAIMS a role by locking that role's digit themselves — "the store admitting one hand is the whole allocation."
- So the configuration table has **five** rows, not three: unlocked · unlocked-with-per-digit-claims (roster) · root-locked one key · root-locked with delegated digits · key-shared.
- Relinquish (R5) round-trips as specified, with one nuance: relinquishing a position that merely *inherits* the root lock answers 409 `inherited_lock` — relinquish the root, or set a distinct lock to delegate.
- sed:/grain: are exempt from inheritance (registration substrates; flat per-position authority) — confirmed in code.

**2.2 Liquid field 2 is NOT address-of-attention — the convention had forked from the code.** `stageLiquid` has written field 2 as the FIRST-STAGED arrival stamp since the NHITL round-2 revise fix (~2026-07-15): arrival order reads from it, and the stage-vs-claim race guard (`resolves_seen`) compares against it. `block-conventions:4.51` still said address-of-attention. Corrected in this PR: liquid field 2 = arrival stamp, field 3 = last-touched, **field 6 = address-of-attention** (5 stays the fold's woven record). Pool/marks entries keep address-of-attention at field 2 (4.22 harmonised: "reply-to address" generalises to address-of-attention — a reply is attention to a slot's address). The spec's §6 story was built on 4.51-as-written; its conclusion (the gap) was right anyway.

**2.3 The living instances — there are four families, not two.** Besides `battery`/`state-of-play` (complete) and `beach-venture` (spine + pool), the beach holds `spine:recovery-capital` + mirrors `recovery-capital:jo/river/sam` and `spine:neighbour-gifts` + mirrors `neighbour-gifts:ken/maya/rosa/sol` — David's synthetic teaching demos (nominal spines, private-community flavour, root-locked post-inheritance style). Neither is ordinal, so the sequence use case was indeed uninstanced — until `spine:arrival` (below).

**2.4 The duplicate liquid slots — not a substrate fault.** `liquid:pool:beach-venture` slots 2 and 4 are both happyseaurchin, stamped **half a second apart** (21:55:07.628 / 21:55:08.109), field 2 = the block name (a misreading of "address-of-attention" as "which block"). Two raw `bsp()` probe-writes using two different slot-choice rules (first-free vs marks' append-past-largest), then both withdrawn. The primitive's own staging path (`submit=`) enforces one-slot-per-author by matching field 1; raw writes are sovereign and can violate the convention — that is what conventions are. No allocation bug; no fix. 4.51 now states the reuse rule explicitly for non-presence stagers.

## 3. Decisions (the checklist, answered)

1. **Lock inheritance + relinquish**: intended, stable, verified in code and live (see 2.1). It also *answers* the spec's §4.1 worry from the other side: a framer's single root lock now genuinely protects a spine — one write.
2. **The fold block `V` — written or computed?** Both, and the spec's practical note was the right reading: the fold is *computable by anyone at any moment* (bsp-floor, a read) and *optionally frozen* as a dated, endorsed snapshot at the bare name — endorsement a pointer (lighthouse), never a gate. state-of-play is the worked example of the frozen form.
3. **The mount point — decided and authored as `tree:9.1`**: declared TWICE, different jobs. `spine:V`'s underscore is the point of record (exists first, read first, delivered at pscale 0 in every bsp-floor fold). `pool:V`'s underscore is the machine-read mount: a **bare reference alone** (`function:audit`, `pscale:grit/5`) is resolved by `pscale_pool_engage` and delivered inline in every envelope — machinery that already existed (`isDirectiveRef`/`resolveDirective`) and needed zero new code. Prose that merely mentions the operator (pool:this-hour's form) is a human pointer only. The fold block never carries the mount. **Verified live**: `pool:arrival` created with `purpose="function:audit"` delivered the whole audit law inline at first engage.
4. **The address-of-attention field — LANDED** (this PR; the spec's "single highest-value fix"). `pscale_pool_engage` gains `at=`: validated as a pscale address (digits, one decimal or comma-walk, multi-dot rejected), stamped into contribution field 2 and liquid field 6, and on read narrowing both the slice and the mirror to the address's subtree — prefix on the bare digit-walk, so `3.1` and `31` meet (4.52 served). Located reads are VIEWS (marker per view, documented in the schema). Proven end-to-end against the live venture pool: `at='2026315'` returned exactly the one located entry.
5. **Enumeration for folds**: the surface index IS the enumeration — mirrors are the `V:`-prefixed names in the beach's derived index (walk, not search; one GET, fine at hundreds). A tree wanting a closed roster uses `sed:V` as its register (settle = join, arrival-order positions). Both substrate-native; no new machinery. Written into function:audit's fold law.
6. **Duplicate slots**: diagnosed, not a bug (2.4).
7. **function:audit — judged, amended, authored, mounted.** One amendment of substance: mirror entries are **voiced prose at the stage address** (`DONE 2026-07-12 — …`, the proven state-of-play voicing), NOT the spec's digit-fields (`{1: status, 2: date, 3: evidence}`) — digit-fields beneath a mirror address collide with sub-stages the spine may later grow (2.2's lesson at one remove), and the token-first voicing folds just as mechanically (first word) while staying human. Status vocabulary kept (DONE/DOING/BLOCKED; silence = not-started). Live at `function:audit` (root under weft's lock, provenance at 9 per ways:authoring:6), mounted on the demo family `spine:arrival` / `pool:arrival` / `arrival:weft` — the newcomer walkthrough's live target, whose stages are the five arrival acts (orient / settle / speak / homestead / fold).
8. **Homestead guard for open spines — REJECTED.** Content-sniffing the underscore to refuse locks would make teaching into fencing, inverting ways:authoring:4 ("locks are the only fence; everything else is teaching"). The real answers: a framer's root lock is now sufficient protection (one write), and participation without spine access is `tree:5.1` **proposal-by-mirror** (authored this session): a participant voices the missing address in their OWN mirror; the fold surfaces it; the spine-holder adopts it or never; the mirror stands regardless. "Can I change the spine?" — no, and you never need to.

## 4. What shipped in this PR

- `src/tools/pool.ts` — `at=` param (validate → stamp → filter → render `@ address` tags); `digitsOfAddress` helper; **dice by declaration**: an operator whose delivered text states "no dice" gets no window-dice section (grit:5, function:align, function:audit all carry the phrase as law; `pscale:grit/1` — root + branch 1 — does not, so minted tables keep their dice; the measurement is smoke-pinned). This is the refinement the 2026-07-12 dice-gate note asked for, needed the moment a tree's pool mounts its operator as a bare ref.
- `src/block-conventions.json` — 4.51 (liquid fields: arrival at 2, address at 6, the fork recorded), 4.52 (filter fields per shape, digit-walk comparison), 4.22 (field 2 = address-of-attention, generalising reply-to).
- `src/server.ts` — instructions mention `at=`.
- `scripts/smoke-pool-engage.ts` — 16 new assertions (address parsing, located view, the dice-declaration invariant) **plus a real bug fix**: an unconditional `process.exit` mid-file had silently killed every section after splitCast — the returning-author and movable-address tests had never run. They run now (97/97).

## 5. Authored on the beach (beach.happyseaurchin.com)

| Block | Act |
|---|---|
| `tree:5.1` | proposal-by-mirror (the change law's missing half) |
| `tree:9.1` | the mount, declared twice |
| `tree` root | **locked under weft's key** — it was fully open, and post-inheritance an open canon block is one hostile `new_lock` from owned; designer-lane per the EARTH precedent, relinquishable if David rules otherwise |
| `function:audit` | the sequence operator (root-locked, provenance at 9) |
| `spine:arrival` | first ordinal spine — five self-assessable stages, 6–9 free |
| `pool:arrival` | created via `purpose="function:audit"` — the bare-ref mount, verified delivering inline |
| `arrival:weft` | the exemplar mirror (five DONE entries, dated) |
| `beach-venture:weft` | the venture family's first mirror (floor 10; season/week/day voiced) |
| `pool:beach-venture` slot 5 | this response, located at `2026315100` via field 2 |

## 6. Found along the way

**bsp-floor cannot enumerate across zero rungs.** The canonical descent rule (2026-05-17: digit children only; hidden directories enter via `*`) means the whole-block floor-align never reaches content beneath a `_`-as-zero rung — and every Gregorian-year path crosses one at the century (2026 walks 2,**0**,2,6). Nominal spines fold whole beautifully (see the arrival fold); temporal spines fold **by horizon address**: read spine + every mirror at the same spindle (`2026300000`) — path-walks cross zeros fine, and the ancestor ladder arrives with each read (proven live). If per-horizon folding proves insufficient at scale, a zero-descending bsp-floor mode is a walker change: Python first, lockstep, its own proposal.

## 7. Residuals, ranked

1. **Embodiment gate on non-fiction directive pools**: `submit=` with face=author/designer is silently dropped on ANY directive pool (the RPG invisibility rule). On audit/align mounts this is wrong but avoidable — omit `face` (embodied default). Refine when it bites: gate on the same rules-declaration a world carries, or on location-addressed rooms.
2. **Whole-`grit` mounts** would trip the no-dice suppression via branch 2's phrase. Nothing mounts whole grit today (rooms mount `/1`, trees `/5`); the smoke pins the halves that matter. Revisit if a whole-grit mount appears.
3. **The GRIT rhythm footer** rides every directive envelope, including audit pools, in play-flavoured wording ("grit 1.8"). Harmless; reword to mount-neutral language if newcomers stumble.
4. **Canon lock posture**: `function:align`, both demo spines, `usecases`, `open-to-business` are root-locked ✓; `battery` + `state-of-play` still carry the pre-inheritance per-digit ceremony (harmless, just historical); **other convention blocks may still be open** — a sweep of unlocked canon (the `tree` case) is one Upstash scan + n root locks, David's call on which key.
5. **`beach-venture:happyseaurchin`** — the spec's author-side mirror still doesn't exist; the fold at the bare name waits for at least David's reading (weft's stands). The walkthrough's step 5 is now demonstrable either way.
