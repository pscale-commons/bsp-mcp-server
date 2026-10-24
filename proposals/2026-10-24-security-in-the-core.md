# Security in the core: keys are pointers, vaults hold them, and the router refuses a write that carries its own key (2026-10-24)

**Status**: PROPOSED. The beach half is done (below). The router half waits for David's word, because a `src/` merge redeploys the router and ends every live session.

## The ask

David, 24 October, lane y-ray.1, after keys were found standing in plain text on the beach: *"Obviously we need to contain in BSP-mcp and in the sunstone and whetstone definitive instructions in security; and suggestion of opaque block like vault … We may need something like this in core, to avoid these kinds of blunders!!!"* And on the weight of it: *"keys should be contained in vaults. The sovereign key to the vault is the most important of course, and the regular everyday key is something that I use for most of my current … so it has to be memorable — and if it is hacked, no big loss … It is the beach, we're building sand castles, not fort Knox."*

## What happened

- **Keys stood in plain text in public blocks.** A scan of every block on beach.happyseaurchin.com found 33 occurrences. Most were in history and pile entries, where a session had recorded which key it had just written with, sometimes another holder's as well as its own. The rule already stood (open-commons 7: "never written into content"), but nothing at any door enforced it.
- **The vault fell with the latch.** weft's vault was latched and sealed by one phrase, the one-key trade ways:vault 1 teaches. That phrase was among those standing in plain text, so every key the vault held could be read by whoever took it.
- **Personal data stood in the clear too**: email addresses in 19 places, and a street address.

What was done the same day, in this order:

1. **Kept.** Every leaked value was copied privately, off the beach, before anything changed, in case any differed from what its holder believed it was.
2. **Scrubbed.** At each position, the node was read, written back with only the key replaced by `[key removed 2026-10-24]`, and read back. The whole block was then compared with a copy taken first, so nothing else moved. The emails and the street address went the same way; one more personal detail waits on its owner's word.
3. **Rolled.** Our 18 keys were re-latched at the apex and 28 surfaces, about 1,500 positions. Each position was probed first, so nothing open was latched by mistake, and wrong keys stayed under each block's hourly cap.
4. **Re-sealed.** weft's vault was re-sealed under a vault key of its own, distinct from every latch. weft's keypair was republished from it, and its two sealed grain lines were re-sealed to the new key. One helper's keypair was re-keyed the same way.
5. **Told.** The keys of other holders were scrubbed from the public text but not rolled, because a key is rolled only by its holder. Each holder is being told.

## The rules

These are written into the bundled teaching, so every session that reads the substrate meets them:

- **A key is a pointer, never a value.** No key's value is written into content, a commit, a file, a log, a chat line or an email. A record names the key (whose, kept where), never quotes it. This applies whoever's key it is.
- **Two weights of key, never one phrase.**
  - The *latch* (`secret`, `new_lock`, a settle or grain passphrase) is everyday and memorable. It proves same-authorship on a public page. A session may hold it for a wake. Its loss is a ripple: roll it and carry on.
  - The *vault key* is sovereign and stronger. It is passed only as `enc_secret`, so it never travels to the beach, and it is held only off the beach. It is never the same as any latch it keeps.
- **Keys live in the vault.** `vault:<handle>` holds a handle's keys: its root law in plain text, and each entry sealed individually under the vault key and written under the latch. The vault's entries are the holder's lock map, so no map of anyone's locks is kept anywhere else. (This answers the lock-map question: which key latches which block is each holder's own knowledge, kept in their own vault, and there is no third-party map.)
- **On a leak, five acts in order**: keep, scrub, roll, re-seal, tell, as above.
- **Never in the clear**:
  - Machine credentials (API keys, tokens) stand on a beach only sealed, in their holder's vault, as fuel in the vault (2026-09-27) already provides, and never in the clear. Each carries cost and time caps at its provider, so a leak is bounded.
  - Personal data (an email, a phone number, a street address, a name a person has not made public) never goes into a public block, because a scrub cannot recall a copy already taken.
- **Sand castles, not a fortress.** What matters lives off the beach: people, and whatever cannot be lost. The beach is a reflection of them, so a warped page is a ripple, put back from a copy, and a leaked latch is rolled, not mourned. Openness stays the posture.

## Where it lands

| file | address | what |
|---|---|---|
| `src/sunstone.json` | 3 (underscore), 3.5 | as access: a key is a proof held, never a value written; the two weights |
| `src/sunstone.json` | 6 (underscore), 6.6 | as commons: sand castles; nothing personal in the clear |
| `src/whetstone.json` | root, 3.3, 9 (new) | the operational branch: 9.1 the guard · 9.2 two weights · 9.3 the vault · 9.4 the leak (9.41 keep … 9.45 tell) · 9.5 never in the clear; the root now counts nine branches; 3.3 points at 9.1 |
| `src/shell-genome.json` | 8 | the vault organ: two keys, never one phrase |
| `src/open-commons.json` | 1, 7 | the one thing that could leak is a key; key hygiene points at whetstone 9 |
| `src/db.ts` | `refuseKeyInPayload` | the guard, beside the never-hollow guard |
| `src/tools/collective.ts`, `src/tools/grain.ts` | settle, grain reach | the two doors that post to the beach without `db.ts` |
| `scripts/smoke-key-guard.ts` | `npm run smoke:key-guard` | 21 checks |

The page for people already says the same things: happyseaurchin.com/beach-security ("Choose a different, stronger key for your vault … never the same as your passphrase"). whetstone 9 points at it.

## The guard

`refuseKeyInPayload(payload, keys)` refuses a write before anything is sent when the payload carries, as a whole word of six characters or more, a key the same call presents. It runs on the payload as it leaves for the beach. A gray write is sealed by then, so a key kept in a vault entry passes. Its refusal never repeats the key, and it points at whetstone 9. It is called at:

- `saveBlockToBeach`, whole and surgical: `secret`, `new_lock`;
- `appendToBeach`: `secret`;
- `pscale_settle`: the passphrase against the declaration and the shell reference;
- `pscale_grain_reach`: the passphrase against the description and the side content.

Every other tool writes through these, so the pool, the stream, play, networking and key publishing are covered too.

**What it does not do, deliberately:**

- **It cannot see another holder's key.** A session quoting someone else's key is caught only by the rule itself. No list of keys is kept to check against, because a store of everyone's keys would be the most dangerous thing on the substrate.
- **It does not guess.** It never matches things that look like keys: it flags only the keys the call presents, so it adds no heuristic.
- **It does not check keys shorter than six characters**, which would match ordinary words.

**Writes it does not see**: the mirror (xstream-bsp posts through its vendored wire), the genus kernel's own store (`src/genus.ts` `wireStore`, the kernel byte-parity instrument, left untouched) and any direct POST.

## The next door: the beach handler

The guard belongs, last and universally, in the beach handler (`pscale-beach` `api/pscale-beach.js`). Every door's write reaches it, carrying the very `secret`, `new_lock`, `passphrase` and `my_passphrase` the check needs. The cipher key never travels, so the handler cannot check it, which is right. The same function there would cover the mirror, the genus kernel, and direct POSTs. It is proposed for pscale-beach next, in the package first and then mirrored to the operator's clone, at David's word.

**Found alongside, for the same handler:** an ordinary point write does not take the append lock. A point write to an accumulator, which a scrub is, can therefore land between an append's read and its write, and the append is lost. Taking the lock for point writes on a block that takes appends would close it. Until then, whetstone 9.42 says to scrub a live accumulator between its appends and to look again afterwards.

**Found alongside, on the site:** `happyseaurchin.com/vault.js` is the page port of the vault, used by /gallery and /stack. It still founds, latches and seals a vault with one phrase, the person's own key, so that key travels to the beach as the latch. /beach-security already promises the opposite: the vault key "never travels to the beach and should never be the same as your passphrase". So the port lags its own page. It needs to take a vault key apart from the latch, and to re-seal a vault founded under one phrase. That is proposed for happyseaurchin-home at David's word, because it changes what a person is asked for on those pages.

## On the beach (done)

- The scrub, roll and re-seal above.
- vault:weft's root law now says *two keys*: the read-encryption answers to the vault key and the write-latch to the latch.
- ways:vault, the recipe any session follows to found a vault, still teaches the one-key trade. It is amended next, under weft's key, with its standing text copied first to `archive:ways:vault:2026-10-24` as law writes require.

## Who pays

No one centrally. The guard is a string scan of each payload in whichever router process makes the write: no storage, no service, no list. The vault is an ordinary block per holder, on whatever beach the holder uses.

## Check

- `npm run build` is clean.
- `npm run smoke:key-guard` passes 21 of 21. It covers keys refused in a sentence, at a deep leaf, as a `new_lock`, in a settle declaration, in a grain side, as a phrase of several words, and with regex characters taken literally. It also covers what passes: pointers, short keys, a key inside a longer word, a case variant, and a gray envelope. And it checks that the refusal never repeats the key.
- The whole offline suite CI runs passes, with key-guard now added to it: among them smoke:parser (104), unit, dots, envelope, gray-guard (63), wire (42), compile (66), sentinel, wellformed, hollow-ack, and genus (57).
- The genus window carries sunstone's branch underscores, so the parity snapshot (`scripts/fixtures/genus-parity/expected.json`) was regenerated from `kernel.py --compose-only` on the same fixture and clock. The live kernel already agreed, and the change is exactly the two sunstone sentences.
- Read-back: whetstone 9.43, walked as a future session meets it, arrives with 9 and 9.4 above it. whetstone 9 at pscale 0 lists 9.1 to 9.5 beneath. sunstone 3.5 and 6.6 each ride their branch's underscore, and shell-genome 8 reads whole.
