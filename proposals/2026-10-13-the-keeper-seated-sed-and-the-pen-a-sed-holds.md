# The keeper-seated sed, and the pen a sed holds — making a sed mean membership (2026-10-13)

**Status: proposed — design and findings. Nothing is built. Written in the security.2 lane at
David's word: "keeper-seated sed … the right to edit other things … write a proposal for both."
The behaviours in §2 were observed against the canonical handler run locally
(`scripts/local-beach.mjs` over a scratch folder, throwaway keys), on the code at
`pscale-commons/pscale-beach` commit 98a6e10. This touches the wire-frozen handler, so it is a
protocol change and moves as law: this file first, then the v2 protocol doc, then both operator
clones in step.**

## 1. What David asked, in one line each

1. **Keeper-seated sed** — a collective where a seat can be opened only with the keeper's key,
   then handed to one person who holds it alone. The keeper may sell a seat, or a ticket may be
   bought that opens one; the person receives a private key for their slot. "Like gray, but per
   slot."
2. **The pen a sed holds** — a block whose right to be written belongs to the seats of a named
   sed, so membership can carry editing rights, not only a reading scope.

Both turn on the same missing thing: today a seat proves nothing, because nothing refuses one.

## 2. Why a sed is not membership today — three findings

A sed's two real properties are worth keeping: the beach assigns each position in arrival order
(it cannot be chosen or backdated), and each seat is locked to its holder for life (never
relinquished, never writable by another — confirmed, an own-seat rotation under the holder's key
is the only way its content changes). But as *membership* it is empty, for three reasons found in
the handler:

1. **Nothing gates who opens a seat.** `handleSedRegister` (line 1046) allocates the next free
   position and locks it to whatever `passphrase` the caller sent. It never consults the root
   lock or any marker. A keyless `register` on a collective whose root is locked still succeeds.
2. **A specific seat can be taken directly, without `register`.** An ordinary write to an
   unallocated position with a `new_lock` homesteads that exact seat (observed: a keyless write
   to position 34 with a new lock created and locked seat 34). So even a gated `register` would
   not be enough — the direct write path has to be gated too.
3. **An existing seat's lock does not bind the seat when it is addressed with a dot.** A seat
   taken as `"11"` is stored at node [1][1] and its lock is keyed by the string `"11"`. A write
   addressed `"1.1"` reaches the same node, but `lockKeyForWrite` (line 318) splits a `sed:`
   address on the dot and returns the first segment `"1"` — which carries no lock — so the write
   is admitted (observed: a keyless `"1.1"` write replaced the content of seat 11). This is a
   standing authorisation gap in every sed on the live beach right now, independent of the two
   features, and it must be closed first or any hard gate leaks straight through it.

A fourth thing, latent but relevant to where a marker can live (§3): the allocator hands out the
9-band (91…99), which are the children of position 9. A collective that uses position 9 for
metadata (as payway does, 2.1) and grows past ~72 seats has its metadata overwritten by
registrants (observed: registrant 73 landed at 91 = node 9.1 and overwrote a config written
there). Any design that marks a collective at position 9 must also reserve that band.

## 3. Part one — the keeper-seated sed

### 3.1 The marker

A collective is **keeper-seated** when (a) its root `_` carries a lock — the keeper's key — and
(b) a marker sub-block at **position 9** declares it so: `9` underscore "keeper-seated — seats are
opened only with this collective's root key, then held by the person they are handed to", with a
digit child naming the convention (`9.1 = "keeper-seated"`). Position 9 is chosen to sit beside
payway's own config (both are collective metadata), and the allocator is taught to **skip the
9-band** whenever position 9 holds a sub-block (after 89 → 111), which also retroactively protects
every payway-gated collective from finding 2's fourth case. A collective with no root lock, or no
marker, behaves exactly as today — open homestead, which is what rosters and shared accumulators
depend on; nothing already standing changes.

### 3.2 The gate

Three write paths create or claim a seat, and all three gain the same check when the collective
is keeper-seated:

- **`register`** — refuse unless the call carries `secret` matching the root lock. On success the
  seat is locked to the `passphrase` in the same call: that becomes the seat's **one-time key**,
  chosen by the keeper (or returned by the handler if the keeper omits it).
- **A direct position write/homestead** (`handleStandardWrite`) and **append beneath a node**
  (`handleAppendAtSpindle`) — refuse a write that would *create* a not-yet-allocated seat, or set
  a lock on one, unless `secret` matches the root lock. Writes by a seat's own holder to their own
  seat are untouched.
- **Finding 2.3 is fixed as part of this**: for `sed:`/`grain:` names, `lockKeyForWrite` resolves
  a dotted or nested address to the governing seat's own lock (the flat position token), so a
  seat's lock binds its whole subtree however the address is spelled. This fix stands on its own
  and should ship even if the rest waits.

### 3.3 Handing a seat over — and selling it

The keeper opens a seat with a one-time key and gives that key to the person, who **rotates it**
to a key only they know (R4, confirmed working: the one-time key as `secret`, their own as
`new_lock`). From then on the keeper cannot write the seat. This is the "slot only one individual
can edit" exactly as described, and the rotation half needs no new code.

Delivering the one-time key privately is where "gray per slot" lands, and it needs **no per-slot
encryption** — the key rides the channel that is already private:

- **Keeper hands it to a known person**: a line on the keeper's side of their grain with that
  person, written gray (sealed from both published keys; only the two of them read it).
- **A ticket is bought** (for oneself or for someone else): payway already does this. The issuer
  holds the keeper's root key (or the keeper is the issuer); a purchase opens a seat and the
  one-time key is the sealed payload of the ticket grain. The existing verifier flow (payway 5)
  is unchanged; the only new thing is that the issuer may now *open* the seat, because the gate
  recognises the root key. So the hard gate and the paid gate compose: a keeper-seated collective
  can also name a payway issuer, and a seat is opened by the keeper, by purchase, or by both.

### 3.4 What this changes, and the cost

About fifteen lines in `handleSedRegister`, the two cre-ate branches of the write paths, and the
allocator's 9-band skip, plus the `lockKeyForWrite` fix for 2.3; mirrored into the happyseaurchin
operator clone; a `smoke-keeper-seated.mjs` beside `smoke-locks.js` covering the gate on all three
paths, the own-seat rotation still passing, and an open (unmarked) collective unchanged. Because it
is handler/auth behaviour on a `sed:` substrate, it is a protocol change: the v2 doc's §6.5 (sed:
collectives) gains the keeper-seated variant, and `pscale_settle`'s and `bsp()`'s tool text gain a
line. It does **not** touch the lock salt formulas (the frozen part) — a keeper-seated seat is
hashed exactly as any sed seat is; only *who may cause one to exist* changes.

## 4. Part two — the pen a sed holds

Once a seat means membership, a block can let the seats of a sed write it.

- **The declaration** lives with the block's authority, not its content: a sentinel in the
  block's lock-set, `writers = "sed:<collective>@<origin>"`, set by whoever holds the block's root
  lock (so only the block's owner can hand its pen to a group, and can take it back). Kept out of
  content so it is never mistaken for data and never collides with a position.
- **The write** carries `writer_seat` (the caller's position in that collective) and `secret`
  (that seat's key). The handler, seeing the `writers` sentinel, loads the named collective's
  lock-set and admits the write when `hashSed(secret, collective, writer_seat)` matches the stored
  hash for that seat — one hash check, one cross-block read. A write that instead carries the
  block's own root key is still admitted (the owner always holds the pen).
- **Scope of the pen**: start with the whole block (the simplest, matches how a root lock governs
  today). Per-position delegation to a sed can come later if a real case needs it; it is the same
  check at a finer address.

This is a second, larger change (cross-block authority is new), and it should land only after
keeper-seated seds exist and are proven, because its whole value depends on a seat meaning
something. It is phase 2.

## 5. Order of work

1. **Fix finding 2.3** (seat lock binds its subtree whatever the address spelling) — a standing
   gap, ships alone, no new feature needed.
2. **Keeper-seated seds** (§3) — the marker, the three-path gate, the 9-band reservation, the
   smoke test, the protocol-doc update, the clone.
3. **Switch `sed:beach-venture` keeper-seated** as the first real one, under David's key, and let
   the scope chooser count only its seats; convert `sed:humans` likewise if David wants the vouch
   replaced by a seat the keeper opens.
4. **The pen a sed holds** (§4) — phase 2, once seats mean membership.

## 6. What implementing needs from David

- **Go-ahead**, since this edits the wire-frozen handler and changes sed semantics across every
  federated beach.
- **Push access** to `pscale-commons/pscale-beach` (the canonical handler) and the
  `happyseaurchin/pscale-beach-happyseaurchin` operator clone added to a session, so both move in
  step; today this session has only read access to the first and not the second.
- **A choice** for step 3: keep `sed:humans` as an open, vouched scope (provenance, no gate), or
  make it keeper-seated too. The venture clearly wants the gate; the human scope may be better left
  ungated, since it has no single keeper.

## Sources

The handler at `pscale-commons/pscale-beach` `api/pscale-beach.js`: `handleSedRegister` (1046),
`nextValidPosition` (the allocator, ~1030), `lockKeyForWrite` (318), the standard-write create and
lock paths (1740–2010), `handleAppendAtSpindle` (1460), the three lock-salt formulas (181–197,
frozen). The behaviours in §2 observed against `scripts/local-beach.mjs` on 2026-10-13. Payway:
`pscale://payway` 2.1 (config at position 9), 5 (verifier), 6 (federation guarantees). The repo's
own freeze rules: `pscale-beach/CLAUDE.md` ("wire-frozen — what NOT to modify"). Lock rules and R4
rotation: `bsp-mcp` `proposals/2026-07-26-lock-inheritance.md`, `2026-07-11-lock-relinquish.md`.
Companion: `proposals/2026-10-13-scope-by-sed-and-the-vouched-seat.md` (§10–§11).
