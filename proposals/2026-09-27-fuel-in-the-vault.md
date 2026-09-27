# Fuel in the vault — a person's model key as a gray entry, sealed and opened in the page (2026-09-27)

**Status:** proposed; nothing is built. Written at David's word ("yes, write up a proposal please")
in lane weft.1 (Claude Opus 5.5 through Claude Code); the record is at watch:weft 468. David rules
on §6 before any slice.

## 1. The idea

David, 2026-09-27, just after vault:weft began holding key values rather than pointers:

> *"Wait, we could put an API key into a grey block and then use this to run a shell on the beach?
> Instead of putting the API key into the mirror.onen.ai UI and then enabling doormen which can be
> triggered remotely -- I could inset my handle+passphrase on an o-page which unlocks the API key
> and then use that to wake a shell -- whatever shell? Isn't that... interesting?"*

It is interesting. The one thing a wake needs that still lives outside a person's own blocks is
the model key that pays for it. This proposal would put that key in a person's own vault.

## 2. Where fuel lives today

The substrate already has words for this. `genus-one/waker.py` calls the model key that pays for a
wake **fuel**. The residence model calls it **electricity**, and says a door contributes "only
electricity + scheduling + a truthful hands declaration"
(proposals/2026-08-03-genus-residence-through-xstream.md). Today fuel sits in four places, and
none of them is the holder's own block:

| source | where the key sits | stated as |
|---|---|---|
| **carried** | the mirror's identity card, remembered in that browser. `IdentityCard` in xstream `src/components/mirror/Mirror.tsx` ("remember on this device", ticked by default); `src/kernel/claude-direct.ts` calls api.anthropic.com from the browser | "the key never leaves this browser" |
| **roster** | xstream's `/api/llm` proxy, holding the host's key on Vercel; a rostered character's passphrase is the gate (`src/kernel/funding.ts`, route `roster`) | the host pays |
| **deposited** | the waker's enrolment store (`/data/enrolments.json` on whatever machine runs it), in plain text | "custody, not cryptography" (the waker's own enrolment page) |
| **standing** | the waker's own key, while `WAKER_BEACH_FUEL` is on | generosity |

Two settled orders already choose between them:
- The waker's `pick_fuel(handle, asker_key)`: the asker's carried fuel, then the holder's deposited
  fuel, then the beach's standing fuel.
- The mirror's `resolveFunding`: the user's key, then the roster, then none.

## 3. The move

The fuel becomes one entry in the holder's own vault. It is gray, sealed under the vault key like
every other key there. A door that is given the holder's handle and vault key opens the entry **in
the page** and spends the fuel for this sitting only. Nothing else about a wake changes; only the
source of the fuel.

What it gives:

- **One key per person, on every device.** In David's words: *"The only key i should have on the
  mac and my phone is your vault key."* A phone that has never seen the API key wakes a shell with
  it.
- **Any shell, inside the sovereignty that already holds.**
  - A *ghost* wake (compose the shell's window, call the model, propose, write nothing) needs fuel
    only, so it can wake any shell.
  - A *holder* wake needs fuel and the shell's own key. The vault can hold both: vault:weft 6 now
    holds the genus-one eggs' keys.
- **No central cost.** No server holds anyone's key, and every wake spends the waker's own account.
  That keeps the design rule: if the answer to "who pays at scale?" is one server, the design is
  wrong.

## 4. What exists and what is new

**Exists:**
- **The gray cipher** (bsp-mcp `src/keys.ts`):
  - Argon2id(secret, salt = the agent_id string as passed, padded to 8), with 3 iterations, 64 MB
    and parallelism 1. It yields 64 bytes, and the first 32 become the X25519 secret key.
  - Self mode seals with `nacl.secretbox`, into the envelope `{_, 1: ciphertext, 2: nonce,
    9: {_: 'gray', 1: 'self'}}`.
  - Both libraries (hash-wasm, tweetnacl) run in a browser.
- **The wake:** xstream `src/kernel/genus/animator.ts` with `WakePulse`, and bsp-mcp
  `pscale_genus`, for both ghost and holder wakes.
- **The one funding decision:** xstream `src/kernel/funding.ts`.
- **The vault pattern:** ways:vault, lived at vault:happyseaurchin, vault:keel,
  vault:Phenomemental and vault:weft.

**New, three pieces:**

1. **Seal and open in the page.** Port `selfEncrypt` and `selfDecrypt` into the page, using the same
   two libraries so the result is byte-compatible with bsp-mcp. Today gray is sealed and opened
   inside bsp-mcp, the connector's server. An API key handled there would pass through that server
   in plaintext every time. Handled in the page, it goes from the beach to the browser to Anthropic,
   and nowhere else.
2. **A fixed place for the fuel,** so a door finds it without parsing prose.
   - Recommended: **position 8 of the vault.** It is free in vault:happyseaurchin (1–4, 9),
     vault:keel (1, 9) and vault:Phenomemental (1–7).
   - The gray entry holds the key alone. What it is (provider, the cap it was issued with, the date)
     goes in the plaintext root's index, where anyone may read it without learning the key.
3. **A vault source in the mirror's funding.** The identity card already takes handle and passphrase.
   When its key field is empty, it offers two lines:
   - "unlock my key from my vault", which opens position 8 in the page and holds the key in memory
     for this tab only, never written to storage;
   - "put this key in my vault", which seals it in the page and writes the envelope.

   `resolveFunding` then takes the vault as a source for its `key` route.

## 5. The catches, each with its answer

1. **Offline guessing.** The ciphertext is public, so anyone can copy it and try passphrases forever
   without touching the beach. Argon2id at 64 MB slows each guess but does not make a short phrase
   safe.
   - A vault that holds fuel is sealed under a long random key: five or more random words.
   - The fuel is a key made for this use, with a hard monthly cap set in the Anthropic console,
     and revocable in one click.
2. **Where it is opened.** In the page, never at bsp-mcp (§4.1).
3. **Who asks.** The beach is open by design, so any page can ask for a handle and vault key and
   leave with the fuel. The seal and the unlock live only on the holder's own trusted doors
   (mirror.onen.ai, happyseaurchin.com), and those doors say so.
4. **The page can see it.** A browser call to Anthropic carries the key in the page's own script,
   under the "dangerous direct browser access" header. That is the same exposure the identity card
   has today.
5. **Absence.** Vaulted fuel serves wakes the holder is present for. The holder's own vault law
   settles the absent case: the sovereign is *"typed by David's own hand into the session that
   needs it, never sourced from a block, a store, or a prior transcript"* (vault:happyseaurchin
   root). So a waker must never keep a vault key in order to unlock fuel while the holder is away.
   Doormen stay on deposited fuel (custody, said plainly) or standing fuel, and this proposal does
   not touch them.
6. **Spend.** A wake is still a deliberate act, and weft's lanes still never spend without David.

## 6. For David's ruling

1. **Where the fuel stands:** position 8 of the vault, by one line added to ways:vault, or a block of
   its own (`fuel:<handle>`, gray under the same key)?
   - Recommended: position 8. Keys go in the vault, in David's own words.
   - vault:weft is full at 1–9 and carries no fuel; it would fold its 8 deeper only if it ever did.
2. **Which door:** the mirror's identity card, or a separate o-page?
   - Recommended: the card. It already wakes shells, and it already takes handle and passphrase.
3. **Present only:** the mirror's funding gains the vault as a source. The waker's `pick_fuel`
   stays as it is.
4. **The vault key's length:** if David's master key is short, rotate the vault's sovereign to a
   long one before any fuel enters it. Rotating re-encrypts nothing, so every entry is rewritten by
   hand in the same pass; this is the vault's own recorded gotcha.

## 7. The first slice, if ruled

1. **The fuel.** David makes a dedicated Anthropic key with a small cap.
2. **The seal and unlock** (xstream):
   - the page-side `selfEncrypt`/`selfDecrypt`, with a byte-compatibility test both ways against
     bsp-mcp's own output;
   - the two lines on the identity card.
3. **Into the vault.** David seals the key into vault:happyseaurchin 8 through the card, with his own
   hand. Weft never handles his fuel.
4. **One ghost wake** of egg-one, from David's phone, with the fuel unlocked from his vault. It
   passes when all three hold:
   - the window composes and the model answers;
   - the network log shows the key sent only to api.anthropic.com;
   - a keyless read of vault:happyseaurchin 8 shows "Encrypted".
5. **Then one holder wake** of egg-one, with the egg's own key.

## 8. Provenance

- **The idea:** David's, 2026-09-27, in lane weft.1, in the same conversation that filled vault:weft
  with key values ("keys should be in the vault — otherwise it isn't much of a vault").
- **Written up by:** weft.
- **Read for it:**
  - bsp-mcp `src/keys.ts` and `genus-one/waker.py` (`pick_fuel` and the enrolment page's custody
    note);
  - xstream `src/kernel/funding.ts`, `src/kernel/claude-direct.ts` and `src/components/mirror/Mirror.tsx`
    (`IdentityCard`);
  - happyseaurchin `api/vault.js`, which is unrelated: a cookie store for API keys on the site's own
    proxy;
  - the roots of vault:happyseaurchin, vault:keel, vault:Phenomemental and vault:weft, and ways:vault;
  - proposals/2026-08-03-genus-residence-through-xstream.md and
    proposals/2026-09-21-what-a-person-pays-for.md.
