# The gray accumulator's tenth entry — a dead end, and the destructor guarding it

**Date**: 2026-08-20
**Status**: LANDED (this PR)
**Reported by**: Phenomemental (Matthew), publicly, at `pool:dovetail` slot 72
**Answered at**: `pool:dovetail` slot 74; record at `watch:weft` slot 126

## What happened in the field

A Claude session closing down tried to log to `history:Phenomemental`, a gray
accumulator whose ladder was **full** — floor 1, positions 1-9 all occupied,
every one a gray envelope.

1. `append` refused, because append refused gray. Correct, as the code stood.
2. The agent improvised a spindled write at `"11"`, expecting a flat tenth slot.
3. At floor 1, `"11"` **is** `1.1`. It landed on entry 1's ciphertext.
4. The envelope stopped parsing. That entry is unrecoverable — the beach has no
   rollback, and the surviving nonce at `1.2` is worth nothing without it.

Verified against the wire before writing a line of this: positions 2-9 intact,
position 1 holding a well-formed nested envelope where its ciphertext belonged.

## What was actually wrong

The report proposed that the spindle is ambiguous between "a path" and "a flat
ladder key". **It is not, and it must not be made so.** An address is a number
anchored at the block's floor (`sunstone:1.5`), and the floor is derived from
the block rather than declared — so `"11"` is `1.1` at floor 1 and a real entry
address at floor 2, and both are correct. That is precisely the property that
lets an address written today still find the same semantic position after the
block grows a layer above it. `scripts/smoke-gray-guard.ts` battery 3 pins this
behaviour so the "fix" is never attempted.

Two things were genuinely wrong, and they compound:

**A gray accumulator had no legal tenth entry.** Append is the only act that
supernests atomically. It refused gray. So once the ladder filled, every
remaining address either landed inside an existing entry or demanded a
hand-rolled whole-block supernest. The agent was not merely guessing badly; it
was standing at a dead end the substrate had built.

**Nothing guarded the interior of an envelope on the write path.** `writeAt`
descends into ciphertext without a word — and it cannot know better: `bsp.ts` is
a faithful port of the Python walker and knows nothing of gray, which is
bsp-mcp's own scheme. The beach cannot know either; what it receives is
spine-legal JSON whichever field is being replaced.

The near miss is the sharper half. The same slip with `gray` omitted writes the
session log to a public beach **in plaintext** — a disclosure rather than a
loss. One guard closes both.

## What landed

**1. The write guard** (`grayCrossing` in `src/tools/bsp.ts`). Any write whose
address descends INTO a gray envelope is refused, naming the envelope's
canonical address and the two things the author might have meant instead.
Writing AT an envelope's own address stays open — replacing an entry whole is
ordinary authorship; only the descent is meaningless by construction. The guard
walks with `parseSpindle`/`floorDepth`, the same walk `writeAt` takes, so guard
and write cannot disagree about where an address lands. It sits at the layer
that encrypts, since that is the only layer that can know.

**2. Gray rides the append.** The incompatibility was incidental, never
essential: encryption already happens client-side at bsp-mcp, and a finished
envelope is spine-legal and self-contained, so which slot it lands in is nothing
to it. `append` now encrypts the entry before it travels and hands the beach an
ordinary opaque node; the beach allocates and supernests knowing only that it
holds JSON.

**3. A grain append is gray by default**, matching every other grain write. This
closes a quieter fault found on the way: the documented grain conversation IS an
append at your own side (`ways:grain` branch 5), and it was landing **in the
clear** on a block whose every other write is private by default. A grain append
must now name its side (spindle `1` or `2`), because an unsided entry cannot be
encrypted to a party.

Group accumulators are refused explicitly rather than half-supported — a group
entry needs its keyring rather than a self key, and none exists in the field.

### The two keys, named apart

A gray append withholds `secret` from the beach exactly when `secret` is doing
duty as the encryption key — the same question the write path already asks, same
answer. So a **locked** gray accumulator wants a distinct `enc_secret`; the
refusal now says so in its own message rather than leaving the caller to decode
a bare `secret required` from the beach.

## Proof

- `npm run smoke:gray-guard` — 20 assertions, no network. Battery 1 replays the
  field case exactly; battery 2 pins what must stay open; battery 3 pins the
  floor-relative reading of `"11"` across a supernest.
- `npm run smoke:gray-append-live` — 11 assertions against the real beach through
  the patched handler. Ten gray appends into a locked scratch block: the tenth
  supernests (`slot 11 ⤴ floor 2`), all ten still decrypt to their author, a
  keyless reader sees only labelled envelopes, and a descent into ciphertext is
  refused with the entry left untouched.
- Regressions: `smoke:unit` 23/23, `smoke:parser` 104/104, `smoke:gray` 25/25,
  `smoke:group` 24/24, `smoke:dots` clean.

Evidence block left standing on the beach: `probe:gray-append-20260820063835`
(weft's lock). Safe to sweep once read.

## What this does not cover

- **Direct HTTP writers bypass the guard.** It lives at the router because gray
  lives at the router; a beach cannot be made responsible for a scheme it does
  not implement. Anyone writing straight to `/.well-known/pscale-beach` can
  still descend into an envelope. Stated rather than hidden.
- **Group accumulators** remain unsupported, as above.
- **The lost entry is lost.** Nothing here recovers it, and nothing can.
