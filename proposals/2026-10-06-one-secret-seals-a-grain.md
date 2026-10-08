# One secret seals a grain — the guard, the guide, and the trap that hid it (2026-10-06)

**Status**: the router's guard is BUILT (bsp-mcp #500, this file's PR). The grain guide's
re-voicing below is DONE at the beach at David's word ("Fix the grain guide too"): 5.1 with 5.11
beneath it, and 2.1 and 3.1, which taught the same incomplete call and an opt-in privacy that grain
writes no longer have — the standing block copied byte-exact to `archive:ways:grain:2026-10-06`
first (8,187 characters, compared after the write). Weft, Claude Code (a cloud session, keyed), the
fixit.2 lane.

## 0. David's words

> "There's an issue that has arisen with Dwayne/Duke and Matthew/Phenomemental on the beach — their
> grain. … establish the problem and proposals for either diagnosing further or proposing a
> solution. I know Dwayne is not technically minded, so it is a major issue."
>
> "open the PR. Fix the grain guide too."

## 1. The fault

Phenomemental (pool:weft 164): Dwayne's four lines on `grain:5cec3b320dcaee2a` will not open on his
side — after Dwayne had published keys and rewritten them (pool:weft 162). The block is sound: both
sides hold, both passports carry well-formed keys at 9, and the four envelopes at 1.1–1.4 are
grain-mode lines sealed to Phenomemental, rewritten (the arrival stamps the appended originals
carried are gone).

## 2. The mechanism

A grain line is sealed with `nacl.box.before(partner's PUBLISHED x25519, writer's x25519)`, the
writer's key derived from `Argon2id(enc_secret ?? secret, writer's handle)`. The partner opens it
with their own derived key and the writer's PUBLISHED key. The two meet only when each hand seals
and reads with the secret its own passport's keys were published from.

Nothing checked that, and the writer cannot see it fail: the writer's read-back pairs the sealing
secret with the PARTNER's published key, so a mis-sealed line opens for its writer — who reports it
fixed, honestly. That is what happened here, and `smoke:gray` now reproduces it.

## 3. What fed it

- **The guide.** `ways:grain` 5.1 taught the conversation as an append with
  `secret=<that side's passphrase>` and nothing else. Since `enc_secret` falls back to `secret`, the
  side's passphrase became the sealing secret.
- **The vault practice.** `ways:vault` and `vault:Phenomemental` keep one sovereign phrase for the
  identity blocks and a distinct phrase for every other block — a grain side included. Keys are
  published under the passport's phrase; lines get sealed under the side's. The practice travels by
  example, as it was meant to, and it travelled here. Under one passphrase per handle (David's own
  practice) the two never part.
- **A wrong answer.** pool:weft 159 (a keyless wake) read the original lines as sealed to Dwayne
  alone and asked for a new privacy secret at publish — one more phrase in play. In fact the
  originals were grain-mode, and would have opened once Dwayne's keys were published from the
  phrase they were sealed with.
- **No witness.** The trap is general: weft's own operational lock does not derive
  `passport:weft` 9 either (`pscale_key_publish` answered "Rotation rejected" and wrote nothing).
  A local derivation against the vault settles which phrase does: the commons-era latch
  (`vault:weft` 3), which leaked in June. The vault already records it, with rotation deferred and
  nothing sealed under that keypair since; whether to rotate now is David's call (asked 2026-10-06).

## 4. The guard (router, bsp-mcp #500)

- `grainEncrypt` takes the writer's published x25519 and refuses a seal under any other secret,
  naming the fix; `encryptGrainLeaf` passes it on both write paths and refuses a writer with no
  published keys at all.
- A grain line that stays shut says why after the bare `[encrypted]` marker: a party with no
  published keys; a reader whose key derives neither passport; or the writer sealed under a secret
  other than the one behind their own passport — so the writer rewrites it.
- `pscale_key_publish`'s mismatch answer says "this secret does not derive the keys published at
  passport:<handle> 9 — nothing was written" before its rotation recipe, because the call is most
  often a check.

## 5. The guide (`ways:grain` 5.1, re-voiced)

The call keeps its place and gains the second key; the reason nests one deeper, at 5.11, so a reader
walking 5.1 meets the right call and a reader who descends meets why.

**5.1** — Write with append and the side as the spindle — bsp(agent_id='grain:<pair_id>',
spindle='2', append=true, content=<the entry>, secret=<that side's passphrase>,
enc_secret=<the passphrase your passport's keys were published from>) — and read the landed address
off the acknowledgement; read the side back with that same enc_secret. The beach allocates the slot;
a holder never computes one, and never writes a slot unread.

**5.11** — TWO KEYS, TWO JOBS. secret proves the side is yours; enc_secret seals the line, and the
other party opens it only when it is the passphrase your published keys came from. Where the side's
passphrase IS that passphrase, enc_secret may be left out — one passphrase per handle is the
simplest way to hold a grain, and a vault of a phrase per block is exactly where the two part. A line
sealed under any other opens for its writer and never for the partner, so the writer's read-back
proves nothing: pscale_key_publish(handle, secret=<a candidate>) answers "Keys verified" for the
right one and writes nothing on a passport already carrying keys. Once the router carries its guard
(bsp-mcp #500) a seal under the wrong one is refused with the fix named, and a line that stays shut
says whose key is off. Learned on grain:5cec3b320dcaee2a, 2026-10-06; the text this replaced stands
at archive:ways:grain:2026-10-06.

Two lines elsewhere in the block taught the same thing and are re-voiced with it:

**2.1** — Conversation continues instead by writing beneath your own side with bsp() — that side's
passphrase as secret, and as enc_secret the passphrase your passport's keys were published from
(5.11) — spindle 1.1, then 1.2, then 1.3 under side 1, and the same run of digits under side 2. The
reach opens the channel once; the digits carry everything after.

**3.1** — Read a grain openly — a write-lock grants no read, so both sides' reaches stand in plain
view to anyone who walks the block. Every later line written through bsp() is sealed by default
(gray:false writes it in the open), and a sealed line opens for the partner only when both parties
have published keys from the passphrases they seal and read with (5.11). *(It had said privacy was
"a separate opt-in applied to later writes", which grain writes stopped being on 2026-06-02.)*

## 6. What waits

- Dwayne's and Phenomemental's one-call checks, and Dwayne's one-call fix (pool:weft 166).
- The deploy after merge.
- `ways:vault` could carry the same sentence where it teaches a phrase per block; not touched here.
