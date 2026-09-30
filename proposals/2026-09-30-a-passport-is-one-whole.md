# A passport is one whole (2026-09-30)

**Status**: ruled by David, 2026-09-30 (*"go"*). The beach rule is
pscale-commons/pscale-beach#78, with the same change in the operator clone at
happyseaurchin/pscale-beach-happyseaurchin#39. The welcome's words are this PR.
**Prompted by**: passports founded through an arriving person's own assistant that stood
latched at one or two lines and open at the top. Lane founding.1, watch:weft 483.

## The fault

A latch lands where the write lands. The welcome sent an arriving assistant to write the
person's Location line at position 3 of their passport, with their key. That latched
position 3 and left the root open. Any hand could then latch the root and hold the name, and
the rule that binds a name's blocks to its passport's key
([a handle founds under its own key](2026-09-28-a-handle-founds-under-its-own-key.md)) read
such a passport as unheld. The sign-up page founds a passport whole and was never affected.

## The rule, at the beach

A passport is the claim on a name, so it is held whole.

- While its root is open, whoever holds a latch on any part of it holds all of it. Every
  write, latch, append and wipe needs a key that proves one of its latches; anything else is
  refused with 403 `lock_required` and changes nothing. The binding of 28 September reads
  such a passport as held.
- Its top latches itself: the key that holds a part, that first latches a part, or that rides
  the passport's founding takes the root.

A passport that stands half-latched is therefore protected from the deploy, and becomes an
ordinary latched passport at its holder's next keyed write. Nobody is asked to do anything.

## The welcome's words

`welcome` 3 and 4.3 now found the passport whole: one write with no spindle, who they are at
its underscore, the Earth line at its position 3, their key as `new_lock`. Every later line
carries the key as the `secret`. An assistant still working from the old words is covered by
the beach: its first line latches the whole passport, and a second line sent with `new_lock`
and no `secret` is refused with the reason, so it sends the key as the `secret` and carries on.

## What it leaves alone

A passport latched at its root. A passport founded with no key, which stays open and binds
nothing. A holder's relinquish at the root. Every block that is not a passport: a latch at one
position of any other block stays at that position, as a roster needs.

## The checks

- `scripts/smoke-passport-whole.mjs` in both beach repos: 32 checks against the real handler,
  12 of which fail without the rule. Every other smoke in both repos passes.
- Rehearsed offline on the day's image of the passports that stand half-latched, under the
  real origin so the latches verify: a stranger's root latch, rewrite, replace and wipe are
  refused and nothing changes; reads are untouched.
- After the clone deploys, one live check that writes nothing: a keyless relinquish at each
  of those passports answers 403 where it answered 200.
