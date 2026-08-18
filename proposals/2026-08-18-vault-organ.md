# The vault organ — a shell's passphrase record, recorded by example (2026-08-18)

**Status: directed by David (happyseaurchin) in session, 2026-08-18. The practice is
already live twice on the beach; this PR records it in the shell genome as the
OPTIONAL fifth organ and adds nothing else — no primitive, no beach change, no
enforcement.**

## The story, which is the argument

- **2026-08-15 — Matthew (Phenomemental) built it**, answering his own orientation
  critique (pool:dovetail 54–56): nothing tracked which phrases guarded which blocks
  across hundreds of them. His answer: one sovereign secret for the identity blocks;
  every other block on its own distinct phrase, generated at lock time and recorded —
  gray-encrypted — in `vault:Phenomemental`. His passport carries the write protocol
  (read history first; update ledger and vault in the same pass) and both bugs he paid
  for, documented at the point of use.
- **2026-08-17 — David's exemplars ruling** named it the first entry of the
  `exemplars` block: practices on this beach propagate **by example, never by
  template** — publicly named, held by the builder, ask-don't-copy.
- **2026-08-18 — weft founded `vault:weft`** to the same law at David's direction,
  proving the mechanism three ways **before any real secret entered**: keyless read →
  `[encrypted]`; the right key passed as `enc_secret` → byte-true plaintext; a
  deliberately wrong key → `[encrypted]` again, indistinguishable from missing. The
  canary stands at `vault:weft` position 9 so any future keyed session re-proves the
  mechanism and its own key in one read. Both of Matthew's paid-for gotchas confirmed
  live.
- **The recipe now stands at `ways:vault`** on the beach — the pattern, the gotchas,
  the discipline, and the five-act founding walk. The living vaults are the authority
  it points at.

## The pattern, in one paragraph

One block, `vault:<handle>`. Root law **plaintext** (what governs the vault, the
index of entries, the gotchas) so a keyless reader learns the law without learning a
phrase. Entries **gray-encrypted individually** at digit positions, each mapping
block → phrase, rotation date, gotchas — individually, so one rotation re-writes one
entry, never the whole table. Write-latch AND read-encryption under **one sovereign
secret**, traded knowingly: one thing to hold, against losing everything at once if
it leaks. The sovereign key is **never stored in any block** — a human supplies it
every time by their own hand (or, for an LLM's own shell, the harness home directory
does): *a block never bootstraps its own access.*

## The two gotchas the genome must carry

1. **Decryption requires `enc_secret` specifically.** Passing the key only as
   `secret` proves write-authority and still returns `[encrypted]` — byte-identical
   to a wrong key. Wrong and missing are indistinguishable.
2. **Rotating the root lock re-encrypts nothing.** After any sovereign rotation,
   every gray entry must be re-written by hand under the new key, in the same pass.
   And entries are always written with the root key alone — a spindle written with
   its own secret mints a delegated lock independent of the root.

## The exemplars tension, resolved

The same keeper who directed this genome amendment ruled the day before that the
beach needs **exemplars, not templates**. Why this PR is not a template: the genome
documents *composition* — what a shell is made of and each organ's law — and it
already carries optional tiers (genus-one at 6, the character tier at 6.1). Branch 8
documents the vault organ and its one un-guessable law, then **points** at
`ways:vault` and the living vaults. Adoption stays by choice and travels by example;
the genome names what a shell *can* grow, and the exemplars show it grown.

## The change

`src/shell-genome.json`: a new branch 8 (the organ, its law, its birth underscore)
and one clause in the root underscore naming it. Nothing else.
