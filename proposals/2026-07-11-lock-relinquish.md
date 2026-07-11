# Lock relinquish (R5) — the missing inverse of the lock state machine

**Status**: LANDED (canonical + both operator clones patched 2026-07-11; deploys on merge)
**Date**: 2026-07-11
**Author**: weft (Claude Fable 5) with David Pinto
**Canonical change**: [pscale-commons/pscale-beach#37](https://github.com/pscale-commons/pscale-beach/pull/37)
**Ports**: [pscale-beach-happyseaurchin#9](https://github.com/happyseaurchin/pscale-beach-happyseaurchin/pull/9) (lock region byte-identical), [pscale-beach-idiot#6](https://github.com/happyseaurchin/pscale-beach-idiot/pull/6) (pre-sub-beach dialect)

## The problem

Once a position was locked it could never be unlocked. The lock rules formed a
state machine missing its inverse: R2 claims an open position (homestead, no
secret), but no operation removed a lock entry. The only escape was DELETE —
lossy (destroys the block), and itself gated on the `_` lock.

Worse, the obvious attempt — `new_lock: ""` — did not unlock: it **stored**
`hash("")`. The handler reads an empty secret as *absent*, so that hash was
un-provable: the position became readable, un-writable, un-deletable via the
API, forever. Two real casualties on beach.happyseaurchin.com: `roles`
(all ten positions, 2026-07-09) and `probe-open` (`_`) — the latter abandoned
and re-created as a public duplicate because nothing else could be done.

## The design question

David's framing: a user locks because they want a lock; how can the block
return to a *pre-lock* state rather than some post-lock "disabled" state?

The answer is that pre-lock is **literal**. A lock is nothing but a hash entry
at a position (`locks:<block>`, keyed by the spindle's first digit — ten slots
per block: `_`, 1–9). "Locked" = entry present; "open" = entry absent. Deleting
the entry leaves the position byte-identical to never-having-been-locked. No
tombstone, no residue, no memory of the lock.

The one asymmetry is the correct one: **claiming is free, relinquishing needs
proof.** Locking an open position needs no secret (homesteading an unclaimed
slot); unlocking demands the current secret (only the owner abandons a claim).
After relinquish the position is open — anyone may write it or homestead it,
because that is what *open* means. Relinquish is a deliberate act of
making-public, in the same key as the tide.

## R5

| | operation | authority |
|---|---|---|
| R1 | absent + `new_lock` → create locked | none |
| R2 | open + `new_lock` → set lock | none (homestead) |
| R3 | locked + `secret` → content write | prove |
| R4 | locked + `secret` + `new_lock` → rotate | prove |
| **R5** | **locked + `secret` + `new_lock: null\|""` → relinquish** | **prove** |

Handler change (one region, `handleStandardWrite`):

```js
const relinquish = new_lock === null || new_lock === '';
// sed:/grain: refuse relinquish (405) BEFORE any content applies
...
if (new_lock !== undefined) {
  if (relinquish) {
    if (stored !== undefined) {      // idempotent: open/absent → no-op, no save
      delete hashes[lockKey];
      await saveHashes(origin, blockName, hashes);
    }
  } else {
    hashes[lockKey] = hashByBlockName(origin, blockName, lockKey, new_lock);
    await saveHashes(origin, blockName, hashes);
  }
}
```

Authority needs **no new code**: the existing rotation check
(`new_lock !== undefined && stored` → demand the current secret) covers
relinquish. Content + relinquish compose in one call (write final state and
open it), exactly as R4 composes rotation with content.

### Decisions

- **Both `null` and `""` relinquish.** Wire-robustness: some MCP clients drop
  empty-string arguments — the call then arrives with no `new_lock` and is a
  harmless no-op, never a brick. And `""` doubling as relinquish disarms the
  footgun by construction: **the exact input that used to brick is now the
  ensure-open act.**
- **Ordinary blocks only.** `sed:`/`grain:` positions are locked to their
  registrants for life (registration immutability); an opened position would
  invite homestead capture of a collective seat or a grain side. Refused with
  405 before any content applies (atomic reject).
- **Idempotent, save-free no-op** on open/absent positions — no stray lock
  keys are ever minted.
- **No rescue special-case for historical bricks.** A `hash("")` entry still
  cannot be proven (that would need the handler to treat the empty secret as
  present — the very confusion that caused the brick). Historical bricks are
  data residue; `scripts/sweep-empty-locks.js` (ships with the package)
  removes exactly the entries matching the empty-secret hash under the correct
  salt family (ordinary / sed: / grain:), dry-run by default, `APPLY=1` to
  write. Run once per Upstash.

### Untouched

Salt formulas, wire POST shape, the walker/parser, DELETE, sed:/grain: state
machines — all five L1-kernel contracts hold. R5 assigns meaning to inputs
that previously only bricked; no valid existing flow changes behaviour.

## Surface updates (this repo)

- `src/tools/bsp.ts` — `new_lock` schema `.nullable()`, five-case description,
  five-rule handler comment; `BspToolParams.new_lock: string | null`.
- `src/db.ts` — `new_lock?: string | null` (forwarding already passed null).
- `src/server.ts` — connector instructions: five rules.
- `CLAUDE.md` — five rules + sweep note.
- `src/whetstone.json` 1.`_` — signature sentence names relinquish.

## Evidence

- `pscale-beach npm run smoke:locks` — new 29-check R1–R5 battery over HTTP
  (own scratch blocks, zero residue; sed:/grain: refusal cases fire before any
  write). **29/29 offline** against the file rig (real handler, FileRedis) and
  **29/29 against the Vercel preview** of the happyseaurchin clone (real
  Vercel + Upstash). `smoke:append` 20/20 and `smoke:floor` 18/18 unchanged.
- Sweep executed on beach.happyseaurchin.com (2026-07-11): 244 lock keys
  scanned, exactly 11 empty-hash entries found — `roles` (10) + `probe-open`
  (1) — removed; verified live by a keyless write to the formerly-bricked
  `roles:9` (200) and an open read of `probe-open`. Both blocks left OPEN;
  re-locking is their owners' call.

## Post-merge

Production re-verification is one command per beach:
`BEACH_URL=https://beach.happyseaurchin.com npm run smoke:locks` (and the
idiothuman equivalent). The bsp() connector needs no beach-side coordination —
`z.string()` already admitted `""` — but picks up `.nullable()` and the
five-rule descriptions at the next Railway redeploy.
