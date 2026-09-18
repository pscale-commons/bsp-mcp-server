# Characters in the vault — how a person knows their own characters, and the mirror's part in it (2026-09-15)

**Status**: PROPOSAL, ruled in conversation (David, 2026-09-15: "go with the vault, propose
it to the mirror lane") — for the mirror lane to build. The substrate is untouched: no
primitive, no block family, no daemon, no change to the beach. It rides a convention that
already stands and is proven live (`ways:vault`; `vault:Phenomemental`, `vault:weft`), and
adds one act to the mirror. Companions: the character page (happyseaurchin-home #248, live
at `/page/<handle>?world=<table>`) and its door on /rpg (#252, the roster read from each
table's own index); the doorman intake and its correction (watch:weft 341, 343); the
table-in-the-mirror proposal (`2026-09-15-the-table-in-the-mirror.md`, xstream-bsp #306);
the one-handle rule (xstream-bsp #305, `kernel/claude-tools.ts`); grit 1.16 (another's
account is not yours to open).

## 0. The question, and what stands today

David, after #248 merged: "how can a human know their characters — so happyseaurchin has a
list of characters by world/scenario?"

Today nothing bundles them. At a table a character is its blocks under one handle —
passport, knows, purpose, the account (history, the legacy witnessed), the mirror's own
thread — each locked under the phrase the player typed at genesis. The bundle is the handle
at that table. No block says whose the character is, and none should: the character's face
must not name its player (fog of war, and an open table seats strangers). The only link
from the person to the character is the phrase in the person's hand — which the mirror
already keeps, one secret per handle stepped in with (`xstream:secret:<handle>`: this tab
by default, this device when "remember on this device" is on), beside the list of handles
this device has been. A person with two devices, or a new one, has no list and no keys.

Three homes were laid out (watch:weft 363) and David chose the third: the device (private,
does not travel), the person's own manifest (pointers, public), the **vault** — the keys
themselves, gray, in the person's own block, so that one master key on any device opens
every character and the list travels with it.

## 1. The law it rides

`ways:vault` is the recipe and the two living vaults are the authority. What this proposal
keeps, verbatim:

- **One block, `vault:<person>`, at the apex**, born locked whole under the person's
  sovereign — the same secret as their passport's latch, the one the mirror already holds
  as `xstream:secret:<person>` (1; 4.2). The sovereign is never stored in any block, this
  one included (1.1); it lives in the person's hand and on their devices.
- **Entries gray, individually, at digit positions**, every entry write carrying the
  sovereign as BOTH `secret` and `enc_secret`, and never a per-spindle `new_lock` (1.2) —
  a vault is one authority.
- **The URL form, always**: `agent_id = "https://beach.happyseaurchin.com"`,
  `block = "vault:<person>"` — the self-key is salted by the agent_id as passed, and a vault
  sealed under one form reads `[encrypted]` under the other (2.3). The mirror's client
  speaks the URL form by construction; the vault's root law states it.
- **The canary at 9** (4.3), proved three ways at founding — keyless `[encrypted]`, the
  right key byte-true, a wrong key `[encrypted]` — and kept standing.
- **The discipline** (3): a phrase lands in the vault in the same pass that sets it. For a
  character that pass is genesis.

## 2. The entry — one per character

A character is a key-group: one phrase governs its blocks at one table. One entry per
character, appended at the next free digit (the accumulation law — the beach allocates,
nothing is computed), in this shape:

```
N: { _: "Ugarth at brackenfoot-open — https://beach.happyseaurchin.com/w/brackenfoot-open, since 2026-09-14",
     1: <gray: the phrase> }
```

The label at the entry's underscore is PLAINTEXT and IS the list: the character, the world
or table it stands at, the table's address, the date. The phrase alone is gray beneath it
at N.1. Two reasons for the label at the entry rather than in the root law's index (where
`vault:weft` keeps its index): the mirror appends an entry without rewriting a sovereign
block whole, and each entry is self-describing to a keyless reader, which is exactly what
"a list of my characters" asks for. `ways:vault` is example, not template (its own root);
this is the divergence and its reason, written down.

Grouping by world or scenario is the reader's fold, not the block's shape: the label names
the world, the page groups. Flat append is the vault's own growth.

**Privacy of the label is the person's.** The default is plain: David's vault says he plays
Ugarth at brackenfoot-open, because that is the list he asked for. A person who would
rather not be known to play a character writes that entry fully gray by hand (the whole
record, label included, at N); a reader lists it only with the key. Both shapes read the
same once decrypted. The character's own blocks name nobody either way.

The root law, plaintext, adapted from `vault:weft`'s: what the vault is, that entries are
characters (and later anything else the person's handle owns — grain sides, sed
positions, other latches — one key-group per entry), the URL-form rule, the canary at 9,
and the sentence that the sovereign is never here.

## 3. The mirror's one act

At genesis, once the character's four blocks are written and locked under the new phrase
(#305), and **only when the mirror also holds the person's own key** — they stepped in as
themselves earlier in this tab, or remembered it on this device, and the one-handle rule
kept the two identities apart while both keys stayed to hand — the mirror asks one line in
plain words:

> keep Ugarth in your vault? — so you can step in as Ugarth from any device with your own
> key

Yes runs three writes under the person's sovereign, all through the client the mirror
already has:

1. **Ensure the vault**: read `vault:<person>` by the URL form; if absent, found it born
   locked whole with the root law (4.2) and prove the canary at 9 three ways (4.3) — the
   proof is automatic here and costs one gray write and three reads.
2. **Append the entry**: `{ _: <label> }` at the root, `append: true`, `secret` the
   sovereign; the ack names the slot N.
3. **Seal the phrase**: write the character's phrase at spindle `N.1`, `gray: true`,
   `secret` and `enc_secret` both the sovereign, no `new_lock`.

No key is ever written in plain; the sovereign never leaves the device except as the
latch the beach already sees on every locked write. If the person has not stepped in as
themselves on this device, the mirror says so in the same line — "step in as yourself
first to keep this" — and nothing is written.

**The same act for a character that already exists** (David's Ugarth, made before this
lands): from the panel, when a character key stands on the device, "keep <character> in
your vault" runs steps 1–3 with the stored phrase. That is how existing characters enter.

## 4. The doors it opens

- **The mirror's panel — your characters.** With the person's key on the device, the panel
  reads the vault, lists the labels grouped by world, decrypts a phrase on demand, and
  steps in as that character in one tap — on any device, without retyping the phrase. This
  is the win the ruling bought and it is the mirror lane's own.
- **The character page (#248).** Its device latch (`journal-latch:<beach>:<handle>`) could
  be filled from the vault once the person's key is typed once: the private account opens
  across devices. Not required; a follow-up on the page side.
- **The person's page (/page/<person>).** A "characters" line from the plaintext labels,
  each a link to `/page/<character>?world=<table>`. Public because the labels are; absent
  for gray entries. A follow-up; the same one-renderer law.
- **The doorman (341/343).** Enrolment is the waker's record, proved against the
  character's own passport, and stays so. A person may later enrol a character FROM the
  vault instead of retyping its phrase. Named, not built.

## 5. Boundaries

- No central registry, no character block, no field on the character naming its player.
- Never a per-spindle lock; never the sovereign in any block; never a plain phrase.
- The vault is the person's: the mirror writes only with consent, only under the key it
  already holds for that person, only the entry it just made or the one asked for.
- Rotation of the sovereign re-encrypts nothing (gotcha 2.2): if the mirror ever offers a
  key rotation for a person's handle, it must re-seal every vault entry in the same pass.
  Until it offers rotation, this is a sentence in the panel, not code.
- Not this lane: the second track's character-home question (343); the vault for LLM
  shells (already lived, `vault:weft`); anything at the table.

## 6. Verification, for the lane that builds it

- A smoke on the pure pieces: the root law text, the label form, the entry shape, the
  URL-form guard.
- Live, on a throwaway person and a throwaway table (the recipe used for #248: a stand-in
  passport at `/w/<scratch>`, deleted after): found → canary three ways → append → seal →
  keyless read shows the label and `[encrypted]` → the person's key returns the phrase
  byte-true → a WRONG key returns `[encrypted]` → step in as the character from the vault
  on a second browser profile holding only the person's key.
- Then David: "keep Ugarth in your vault" from the panel with his own key, and a step-in as
  Ugarth from another device. His press, not the lane's.

## 7. Provenance

The ruling and its options stand at watch:weft 363 (weft, 2026-09-15 afternoon). The vault
convention is weft's recipe over Matthew's practice (`ways:vault` 9; `2026-08-18-vault-organ.md`).
The character page and its roster are #248 and #252 in happyseaurchin-home. The mirror
lane's charter for the table is `2026-09-15-the-table-in-the-mirror.md`; this proposal adds
one act beside it and touches none of its five.
