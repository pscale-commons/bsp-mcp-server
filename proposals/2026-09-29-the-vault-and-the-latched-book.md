# The vault and the latched book — one key, typed once, opens everything a person holds (2026-09-29)

**Status**: ruled by David, 2026-09-29, demo day, after the pictures page had run all morning on
typed names and open books (*"Take the vault and latched books lane next and that should be the
o-pages covered"*). Built the same day: happyseaurchin-home (the gallery page, the group page's face,
the Mac seat, and a shared cipher module at `/vault.js`), and three law lines at the beach —
`ways:stills` 7 (new) and 2 (amended), `mirror` 2.62 (amended), `ways:vault` 1.3 (new) — each with
the standing text archived at `archive:<block>:2026-09-29` first. Nothing in the substrate changed:
no primitive, no beach change, no daemon. It rides two rulings already made and two proposals
already written: *a handle founds under its own key* (2026-09-28, in the beach handler), and
*characters in the vault* (2026-09-15) with *fuel in the vault* (2026-09-27), whose §6 this day's
ruling answers. **Lane**: visuals.1, watch:weft 474.

## 1. What was wrong

Two holes, both in the o-pages, both found by David on demo day:

1. **A typed name wrote under anyone's name.** The pictures page kept a picture under whatever
   name was typed in its card, into `gallery:<name>`, with no key. The book was open. Anyone could
   write under Ugarth, and Ugarth could not stop them.
2. **A key was a thing to paste again on every device.** The image key sat in one browser's
   storage. A phone had never seen it. The character's own key sat in another store under another
   name, page by page. David's words: *"I'm starting to think we need to save the user's bundle of
   API keys in their vault on the beach — so that once they bring their sovereign key, they can
   access their api keys for whatever they need — images, game-play, storage etc."*

## 2. The move

**One key, the person's own, typed once into the page.** It is the key their passport uses — the
edit-latch the beach already knows (`ways:key`). With it the page does two things it could not do:

- **opens the person's vault** — `vault:<handle>` at their home beach — and fills its card from what
  stands there: the image key and its service, the picture place, and the key of each character
  the person plays at each table; and
- **writes every book under its holder's key** — the person's own book under theirs, a character's
  book under the character's — so the beach, which binds `gallery:<handle>` to that handle's passport
  key wherever a passport stands, refuses every other hand.

Nothing is ever kept in the open on the beach. What the vault holds is sealed under the same key
that latches it, in the page, and travels from the beach to the browser to the service it pays and
nowhere else.

## 3. The entry — the shape a page appends (`ways:vault` 1.3)

```
N: { _: "image key — Google, kept 2026-09-29 from happyseaurchin.com/gallery",   1: <sealed: the key> }
N: { _: "Ugarth at brackenfoot-open — https://…/w/brackenfoot-open, since 2026-09-29", 1: <sealed: the key> }
N: { _: "picture place — supabase https://xxxx.supabase.co bucket stills, kept 2026-09-29", 1: <sealed: the anon key> }
```

The label at the entry's underscore is PLAINTEXT and IS the list: what the key is, for whom, since
when. The key alone is sealed beneath it at N.1. This is the shape *characters in the vault* §2 gave
a character's entry, taken for every key-group a person holds, and it diverges from the
index-in-the-root shape of the first vaults for one reason: a page appends an entry without
rewriting a sovereign block whole, and each entry describes itself to a keyless reader. A vault a
page founds carries this in its root law and proves itself with the canary at 9 (`ways:vault` 4.3).
The first entries of David's own vault, written to his index at 1–4, stand as they are; the page
appends beside them.

*Fuel in the vault* §4.2 recommended a fixed position (8) for a model key. The labelled entry
replaces the fixed position: a door finds the fuel by its label, not its digit, so the vault grows by
append as every accumulator does. The mirror's fuel slice (§7 of that proposal) can take the same
shape when it comes.

## 4. The cipher, in the page

`/vault.js` on the site is a port of bsp-mcp `src/keys.ts`, byte for byte: Argon2id over the
sovereign with the salt the beach's URL form padded to eight bytes (3 iterations, 64 MB, parallelism
1, 64 bytes out; the first 32 the X25519 secret key) and `nacl.secretbox` for a SELF envelope
`{_, 1: ciphertext, 2: nonce, 9: {_: 'gray', 1: 'self'}}`. The two libraries (tweetnacl, hash-wasm's
argon2) are vendored, loaded the first time a card needs them. Proved both ways before any page
used it: what the page seals the router opens, what the router seals the page opens, and a wrong key
opens neither (the harness `compat.mts`, 776 ms for both derivations on this Mac).

**The salt is the addressing form** (`ways:vault` 2.3): a vault decrypts only under the exact string
it was sealed with. The recipe founds a vault as `bsp(agent_id='<beach-url>', …)`, so the page salts
with the beach's origin, e.g. `https://beach.happyseaurchin.com` — never the handle. A vault sealed
by the router under that form opens in the page, and the other way round.

## 5. The latch (`ways:stills` 7)

A book answers to its holder's key. `gallery:<handle>`:

- **founded** locked with the key (`new_lock`), which the beach admits only when it is the key
  `passport:<handle>` uses at that beach — or when no passport stands there, in which case the first
  key holds (a stranger's book at a table where they have no character is theirs by first use);
- **claimed** with it when it stood open from before — one whole-block write carrying `confirm`,
  `secret` and `new_lock` together, the path theme.js already uses for a person's lists; the beach
  binds the claim the same way;
- **appended to and rewritten** with it — every picture, every face, every delete.

A wrong key, a missing key and a stranger's rewrite are refused by the beach, and the page says why
in plain words (*"that is not Ugarth's key — the book answers to the key Ugarth's passport uses"*).

**The face is a view.** The face is the entry addressed to `passport:<h>:3` in the character's own
book when they gave one, else the newest anyone gave at that address in any book at the table. So the
Mac seat and an observer can give a face without holding the character's key — into their own book —
and the character's own word wins. Before this the face could only be written into the character's
book, which under the latch only the character could do.

## 6. Where the keys live on a device

The card's "remember on this device" (ticked by default, as the mirror's card is) keeps what it
holds in the browser's storage; unticked, for this tab only. The character's key is kept under the
name the character page and the group page already use (`journal-latch:<beach>:<handle>`), so a key
that arrived through the vault on the pictures page is there when the person opens the character
page. "Forget everything here" empties the card, the storage and the derived key.

## 7. What is not in this lane

- **The mirror.** Its identity card still keeps the image key and the voice key in the browser
  only; opening them from the vault is the mirror lane's slice (*fuel in the vault* §7), with the
  same module. The charter line 2.62 now permits it.
- **A picture place beyond Supabase.** The card takes a person's own Supabase bucket (URL, bucket,
  anon key) because the store's code path already stood; a GitHub repository or another host is one
  more `toSink` branch when wanted. David keeps the commons store as the default for now and will
  gate it later.
- **The observer at a table**, per-tab identity in the mirror, the mirror's crossing between
  beaches — the mirror lane, named on demo day.
- **Rotation of the sovereign.** Re-seals nothing (`ways:vault` 2.2); the card says so and does not
  offer it.

## 8. Verification, walked on 2026-09-29

On a throwaway local beach (`pscale-beach` `scripts/local-beach.mjs` at the handler that carries
*a handle founds under its own key*), through the pictures page in the preview:

1. A vault under a person whose passport is locked: the wrong key is refused at founding with the
   beach's reason in plain words; the right key founds it born locked, proves the canary three ways,
   seals the image key at 1 and the character's key at 2; "open my vault" fills the card and the
   character page's latch from them; a keyless read shows the labels and `Encrypted` and nothing
   else; the router's own cipher opens all three entries and refuses a wrong key.
2. A legacy book founded open: claimed under the character's key and appended to; a wrong key is
   refused (*"Ugarth's book answers to another key"*); from outside, a keyless append, a wrong-key
   append and a keyless rewrite are all refused by the beach; a delete from the page under the key
   removes the entry.

Not walked by hand: the group page's face under the character's key and the Mac seat's book
(`AGENT_SECRET`) — the same three writes, the same beach rule.

## 9. Provenance

David's ruling and his words are in the visuals.1 lane on 2026-09-29. The design is the two standing
proposals named above, answered rather than rewritten. The beach rule is pscale-commons/pscale-beach#77
(and the operator clone's #38). The site build is happyseaurchin-home, this day's pull request. The
cipher is bsp-mcp `src/keys.ts`, unchanged.
