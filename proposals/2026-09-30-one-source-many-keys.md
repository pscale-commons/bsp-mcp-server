# One source, many keys — a block a named group opens, each with a private key of their own (2026-09-30)

**Status:** proposed at David's word (*"I think you need to write a proposal on this. And then I will set a
different task."*), lane recovery.1, Claude Fable 5.1 through Claude Code; the record is at watch:weft 491.1.
Nothing is built. Nothing at Community Recovery's place, and nothing of Matthew's, is written by this proposal.

## 0. David's words

> "It's about providing people with private keys to the same source. So the vault can be opened by a number of
> keys, I thought. Or a pscale block written by a group."

And a little earlier, spoken:

> "There are different keys for different people and they can be revoked. So there is a central registry of
> some kind of the current keys that have been enabled or given to people that they can use. And that means
> that they would have access to the keeper."

## 1. What is asked

One sealed source — a model key first, and later anything a small group must share — that several named
people open, each with a private key of their own; a register of who holds a key now; giving and taking
without a passphrase passed round. The first use is the LLM synthesis of Community Recovery's constitution at
`beach.happyseaurchin.com/w/community-recovery` (proposals/2026-09-30-community-recovery-on-the-beach; the
six-line definition of synthesis there, put to David the same evening, is at watch:weft 491.1). The keeper in
David's sense is the LLM reading under the family's law; this proposal is about who can open the fuel that
runs it, and how that changes hands.

## 2. What already stands

Nothing here needs a new primitive. The pieces exist; they have not been put together in a page.

| mechanism | where | what it gives | what it lacks for this |
|---|---|---|---|
| **A person's vault**, `vault:<handle>`, gray under one key | `ways:vault` at the apex; the cipher in the page, `/vault.js` (happyseaurchin-home #340, 2026-09-29) | one holder, one key, opened in the page; image keys live there today; a model key there is *fuel in the vault* (2026-09-27), still unbuilt | many keys |
| **Group gray**: a keyring at position 9 | bsp-mcp `src/keys.ts`, `src/tools/bsp.ts` (proposals 2026-06-02-group-encryption and -2b); `npm run smoke:group` passes 24 of 24 today | a random group key K sealed per member to their published x25519 (`{_: handle, 1: ciphertext, 2: nonce, 3: ephemeral public key}`); each member opens their own entry with the key derived from their own secret; content leaves sealed with K; add = re-wrap, remove = rotate K and re-encrypt; members co-write | it runs in the router only, in no page; a `members` write looks for each member's public key at the **apex** passport (`src/db.ts` getPublicKeys), never at a place; membership is flat, any member may add or remove; accumulators are not supported |
| **Published keys**, `pscale_key_publish` | passport:<handle> position 9 | the keypair, Argon2id(enc_secret, salt = handle), public half on the card | at the place nobody has published keys yet |
| **The roster** | xstream `api/llm.ts`, `XSTREAM_HOST_ROSTER` | a host's key spent by listed people, each proving their own passphrase by hash; capped, metered, per-passphrase rate limit; an entry removed revokes | a server, and the host's money; the key never reaches a browser, which is its strength |
| **Escrow** | proposals/2026-07-20-private-community-beach | a master mints each member's key and revokes by epoch; shown live on idiothuman | nothing built |
| **Payway on `sed:`** | pscale://payway | tickets that open contribution to a collective, checked by a verifier | pays for a role, not for a key |

The group keyring is the thing David describes: different keys for different people, a register of who holds
one, giving and taking by rewriting the ring. What is missing is the page that opens it, the rule that keeps
the ring in one steward's hand, and the discipline that makes a sealed key safe on a public beach.

## 3. The shape — a group vault at the place

### 3.1 The block

One block, `fuel`, at the place, beside `resets` and the kept minutes. Its root underscore is plaintext and
says what the block is: the provider, the cap the key was issued with, the date, the steward, and the members
by name — never the key. Position 1 holds the model key as a group-gray envelope. Position 9 holds the keyring.
The block is **latched under the steward's key**, so only the steward writes it: the members read it, and
open it in the page. If the three families ever need different fuel, `fuel:<family>` is the same shape.

### 3.2 The register is the keyring

Each entry names a member and seals K to that member's published key. To **give**, the steward adds an entry:
K is re-wrapped, nothing else moves. To **take**, the steward rebuilds the ring without them: K rotates, the
envelope at 1 is re-sealed, and the model key itself is replaced at the provider, because a member taken off
the ring may already have copied it. The ring is readable by anyone, names only, so the community can see
who may spend. That is the central register David remembers, and it lives in the block, not on a server.

### 3.3 A member's two keys

A member's **three words** stay what they are: the edit-latch on their card and notebooks, checked by the
beach at every try. For the vault they choose a second key, a **vault key** of five or more random words,
typed once and remembered on the device, as the keepers' words are today. From the vault key and their name
the page derives their keypair and publishes the public half at their card's position 9, written under their
three words. Why a second key: the ciphertext is public, so anyone may copy it and guess at it offline for as
long as they like; three words are enough for a latch, not for a seal (*fuel in the vault* §5.1: "a vault
that holds fuel is sealed under a long random key: five or more random words").

### 3.4 The open, in the page

On the place's own pages, a member with a vault key on the device: derives their private key from the vault
key and their name; finds their own entry in the ring and opens it (box open); opens position 1 with K
(secretbox open); holds the model key in memory for this sitting; calls the model from the browser, as the
mirror's card does, with the header the provider requires; and keeps what comes back — a synthesis — in their
own tree under their own three words. Nothing of the key is written anywhere. The two libraries are the ones
`/vault.js` already carries (hash-wasm, tweetnacl), so the result is byte-compatible with the router.

### 3.5 The steward

The steward is whoever holds the block's latch: today the keepers' words, held by weft for Community Recovery,
passing to Matthew when David says. The steward's page does the wrapping: it reads each member's public key
from their card **at the place** and writes the ring under the latch. The router can do the same once
`getPublicKeys` reads the member's passport at the group block's own beach rather than at the apex; one line
in `src/db.ts`, not needed for the first slice.

### 3.6 What this makes of "the keeper"

The keeper is the LLM reading of the family's law, the clause and the readings the law admits, run by
whoever opens the fuel. The ring says **who may spend**. The law says **whose reading is shown** as the
community's version, by naming people (the tree's own law: an official view is its owner's pointer, never a
lock — `tree` 4 and 5d at the apex). The two are kept apart on purpose: a person may be on the ring and not
in the law, or in the law and spending their own key.

## 4. The catches, each with its answer

1. **Offline guessing.** A vault key of five or more random words; a model key made for this use with a hard
   monthly cap; the steward's key at least as long.
2. **Taking is not un-seeing.** The provider key is replaced on every removal; the cap bounds what a copied
   key can cost in the meantime.
3. **Flat membership.** The latch: a `members` write is a whole-block write and needs the secret, so only the
   steward rewrites the ring.
4. **Any page can ask for keys.** The open and the seal live only on the place's own pages, which say so; a
   page a link brought you to never asks for a vault key.
5. **The key in the browser.** The same exposure as the mirror's card; the provider's rate limits and the cap.
6. **Group accumulators are unsupported.** Fuel is a leaf, not an accumulator.
7. **Absence.** No server keeps anyone's key; a synthesis happens only while a person is present. A standing
   keeper that folds with nobody present is the waker's business (deposited fuel, custody said plainly) and
   is not this proposal.
8. **Hand-over.** Matthew rotates the keepers' words, re-wraps the ring from his own page, and the model key
   becomes the organisation's, on its own account.

## 5. A block written by a group — two kinds

- **Sealed co-write** exists (2026-06-02-2b): members write content under K, surgical per slot, private to
  the group and to the beach alike. Its use here is later and narrower: the parts of the welcome Matthew's
  book seals to named leaders (proposal:community-recovery 8.1), with the same caveats as §4 and the standing
  note that a real member's details wait for a beach the organisation runs itself.
- **Open co-authorship** has no primitive, by design. Either each person writes their own block and a pointer
  names whose stands — the shape for the tree version of the constitution — or the positions of one block are
  latched to different holders, a delegation. The tree version takes the first.

## 6. For David's ruling

1. The fuel block: `fuel` at `/w/community-recovery`, one ring for the three families.
2. The steward: the holder of the keepers' words, passing to Matthew.
3. The vault-key rule: five or more random words, chosen on the place's own page.
4. The order: the law's fourth branch rewritten to the six lines first; this slice after.

## 7. The first slice, if ruled

(a) The place's pages: a vault key, the keypair derived and published at the card's 9, the group open ported
to the kit. (b) The steward's page: a list of names, the wrapping, the block written under the latch.
(c) A "synthesise this clause" button for anyone whose entry opens: law, clause and admitted readings to the
model, the answer kept in their own tree. (d) The pages draw the trees the law names as the community's
version. All of it walked on the offline rig first; the live place only at David's word.

## 8. Provenance

Written 2026-09-30 by weft, Claude Code's shell on the beach (Claude Fable 5.1), at David's word, in lane
recovery.1 (watch:weft 477 and 491). Read for it: `src/keys.ts`, `src/tools/bsp.ts` (applyGroupWrite),
`src/tools/keys.ts`, `src/db.ts` (getPublicKeys), xstream-bsp `api/llm.ts` and `src/kernel/funding.ts`;
proposals 2026-06-02-group-encryption and -2b, 2026-07-20-private-community-beach, 2026-08-18-vault-organ,
2026-09-27-fuel-in-the-vault, 2026-09-29-the-vault-and-the-latched-book; `tree` 3, 4, 5 and 8 and `ways:vault`
at the apex; `npm run smoke:group`, 24 of 24. Nothing built.
