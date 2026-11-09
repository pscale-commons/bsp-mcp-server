# The derived latch: one word, two keys, at every door

**Date**: 5 November 2026
**Lane**: derived-latch, weft (Claude Code on the Mac, Opus 5.5 at max effort, keyed), a session started from lane systemic.2 at thread:weft 17.1114
**Status**: proposed. It waits on David's word at its knot beneath thread:weft 17.1114: GO, CHANGE or NOT YET. Nothing is built. On the beach this lane wrote only weft's own lines. Merging this file redeploys nothing.
**Builds on**: `2026-11-03-coloured-stigmergy-the-design.md` §4.1, §4.2, §10 (1.8, 1.18) and §11 step 4, GO'd on 4 November; `2026-11-05-the-security-schematic.md` §2.3 and §6 item 1; `2026-11-05-the-doors-battery-minimal.md` §5 and §8 items 10 and 15; `spine:security-schematic` 1.4, 1.42, 1.429, 1.54, 1.6, 1.71 and 4.4; whetstone 9.2 and 9.43; `ways:key` 2, 4 and 6; `ways:vault` 1.

A member types one word, once, and two keys come from it. One is the latch the beach checks: Argon2id of the word, salted with `latch:` and the handle. The other is the sealing pair the beach never sees. `seal.js` computes the latch at line 103 already, and nothing calls it. This record moves every door onto it. A door sends the derived latch for a handle whose passport says so at its 9, beside the published halves that every sealing door already reads. A holder switches once, at their next key-in, and only after every door has learned the rule. From then on no beach host sees the word, and nothing a beach keeps can open a line.

## 0. David's words

His word on the battery's gaps, at thread:weft 17.1114 (5 November, 14:55Z): "There are a lot of not yet … So, go with them". The parent lane cut the derived latch out as design first, to be built only at his GO.

And the decision this record carries out, from coloured stigmergy's 1.8. David asked: "Is this 'second word' adding an extra step in every tool call? For all tool calls, or just encrypted ones?" Matthew answered: "members must never meet two words. A member sets the sealing word once in the beach button and never types it again." The design resolved it as GO in Matthew's form: one word, from which the button derives both keys (§4.2). The package's README says why no door has switched yet: "the voice switches to it only when every door derives it alike … since a passport latched one way cannot be proved the other" (`button/README.md:184`). Every door needs to know which form a handle's latch is in before it sends, and that is the problem this record solves.

## 1. The answer in short

- **The derivation** (§3). `latch(word, handle)` exactly as `seal.js:103` defines it: Argon2id of the word under the salt `latch:` plus the handle, 64 bytes out, the first 32 in base64. It is ported byte for byte into the router's `keys.ts` and checked against the shared vectors, which already carry it. The site, the voice and the frame call `seal.js` itself. The sealing pair does not change.
- **Which form, per handle** (§4). The marker is a line at `passport:<handle>` 9.3, `latch: derived`, written by the holder when they switch. A door sends the derived latch only where that line stands and the string it holds derives the halves at 9.1 and 9.2. Anything else goes as it is. A rule by date strands everyone who has not keyed in by the date. A beach that accepts both forms either sees the word all season or costs a wrong key on every write.
- **The switch** (§5). Only the holder, with the word in hand, can switch. At the voice it happens at key-in once the last door has learned; through their AI it is `pscale_key_publish`. The marker goes first, then the passport, then a sweep of every block named for the handle. Each block is probed with no key before it is rotated, so an open block is never latched. Once the sweep is done, no door sends the word unless the holder asks (§4.4): a host could strip the marker, or fake a refusal, to draw it out.
- **The fingerprint** (§6). It keeps the word, as it keeps the key today. "vault" stands for the derived latch wherever a latch is asked for and for the word wherever a seal is. Neither ever reaches the model.
- **The made keys** (§7). Three of 182 words and two digits make 29 bits: strong enough for a latch, too weak for a sealing word. Newcomers get five words from a long list, at least 60 bits, and are latched with the derived latch from birth. A member with a made key is switched like everyone else and offered five words once.
- **What the host sees** (§8). Until a holder switches, the word, as today. Its store also holds a fast hash of the word, which gives up a made key in a moment. After the switch, the host sees only the derived latch, which writes as the holder and opens nothing. The router still sees the word on its open address.
- **The test** (§9). Fifteen cells, run at the lab and on local gated beaches, some with the wrong-key cap turned on and one against a host that lies.
- **The order** (§10). The router, then the site, then the mirror, then Matthew's app, and the package last, because the voice is the door that switches holders. Then the switches: David's estate first, then weft's, then each member at their next key-in.

## 2. Where the word goes today, read from the code

| door | where the word is typed | what reaches a beach as the latch | what seals |
|---|---|---|---|
| the handler | — | whatever string it is sent, hashed: `sha256(secret + 'block:https://<origin>:<name>:<position>')` (`api/pscale-beach.js:189–193`), with `sed:` and `grain:` salted their own ways (195–205) | nothing: an envelope is a node |
| the router | in each call at the open address; once on the sign-in page at the signed one (`src/signin.ts:351`) | `secret` and `new_lock` as given (`src/tools/bsp.ts:1671`; `src/db.ts` 486, 575–583, 682–691), and the same string as the pass proof (`src/pass.ts:77–88`); at the signed address, the fingerprint's key wherever a call carries none (`signin.ts:624–632`) | `enc_secret ?? secret` on a block call (`bsp.ts:1168`); at the room and the stream, `secret` alone (`pool.ts:1922`, `stream.ts:907`) |
| the voice | the browser's prompt (`voice.js:240`, 420, 723), or a key it makes for a newcomer (522–532) | the same word as `secret` and `new_lock`: the proof (217–218), each founding (311, 357–360), each write (462–465, 487, 504, 792–796), the halves' own write (708) | the same word (`wordOf`, 604; `sealFor`, 630–653) |
| the frame and the ear | the unlock window, on the beach's own origin (`unlock.js:83`) | `me.secret` on every write (`frame.js:467`, 557–559, 598, 771–773, 796), also handed to the ear (198; `ear.js:178`, 196–199, 217) | `me.secret` (`frame.js:387`, 397, 408), except that the frame's CSP refuses the WebAssembly that derives a key (the battery's §8 item 10) |
| the site's pages | a prompt or a field, on the thirty pages a grep for `new_lock` and `secret:` finds, each posting its own body (for example `theme.js:1793–1811`; `hand.js:180–219`; `vault.js:87–116`) | the typed word, as `secret` and `new_lock` alike | `vault.js` seals with the same word, through `seal.js`, salted with the beach's address |
| the mirror | its identity panel, kept as `xstream:secret:<h>` (`src/App.tsx:56–63`) | the passphrase, through `src/lib/bsp-client.ts` and its vendored wire, to the beach and to the router's open address | nothing: its `gray` is dropped |
| the pocket | — | nothing: it holds no beach key | nothing |

Only the vector tests call `latch()`: `smoke-seal.cjs` and `smoke-gray-vectors.ts:223` (tests:doors 37 at the lab). Every other door sends the word as the latch. On the apex today 55 passports stand, and 23 of them carry halves at 9: those are the holders who seal. For each of them whose latch is the same word as their sealing word (every holder the voice brought in, and every one-key holder), each beach host they write to has seen that word.

## 3. The derivation

```
latch(word, handle) = base64( Argon2id(password = word,
                                       salt = 'latch:' + handle, padded with NUL to 8 bytes,
                                       t = 3, m = 65536 KiB, p = 1, 64 bytes out)[0..31] )
```

- **It is `seal.js:103`'s function, and the vectors already pin it.** Every vector in `scripts/fixtures/gray-vectors.json` carries a `latch_b64`, and `smoke:gray-vectors` checks `seal.js` against it. The smoke's own header says "keys.ts has no latch yet; the vectors define it". The result is 44 characters of base64, padding included.
- **The router's port** is `deriveLatch(word, handle)` in `src/keys.ts`, beside `derive` (140–158). It is held in the same per-session map as the pairs (111–138), so a session pays one derivation for each word and handle, about a tenth of a second on this Mac. There is one trap. The first 32 bytes of a 64-byte Argon2id output are not the same as its 32-byte output; hash-wasm was checked on this Mac and the two differ. So the port computes 64 bytes and slices, as `seal.js` does.
- **The site, the voice and the frame call `seal.js` itself.** They load it from the beach as `vault.js` already does (`vault.js:34–45`), so there is no copy to drift. The mirror either loads the beach's `seal.js` too or carries the one function, and either way it joins the vectors.
- **The salt is the handle as `passport:<handle>` spells it**, case and all. It is the same string the pair is salted with, and the word is used exactly as typed. Nothing inside the function trims or folds case. Each door keeps the trimming it already does, so the vectors stay the one definition.
- **The sealing pair is unchanged.** It is Argon2id of the word salted with the handle (`keys.ts:140–158`, `seal.js:88–99`), with its halves at the passport's 9. A vault's self seal is still salted with the beach's address (`ways:vault` 2.3). The latch and the pair share the word and nothing else, so neither one tells anything about the other.
- **Not taken: the beach's address in the latch's salt.** That would give every beach its own latch, so a host could not replay what it saw at another beach. Against it:
  - it would bring the self seal's salt divide (schematic 1.41 and 1.52) into every write, across five doors that would all have to spell an address the same way;
  - a host can already write anything in its own store;
  - replay is the exposure the word has today, and with the latch it is no wider, except that the latch opens nothing.

  The marker names the form (§4), so a later latch under another salt would be the same switch run again.

## 4. Which form a handle's latch is in

### 4.1 The marker, beside the halves

`passport:<handle>` 9 holds the published halves, `{_: note, 1: ed25519, 2: x25519}`. Every door that seals already reads it:

- the voice in `publish` (`voice.js:700–711`);
- the router in `pscale_key_publish` and on every grain, group and colour seal;
- the frame for a grain partner.

The form of the latch is a fact about the same word, so it goes there too:

> `9.3`: `latch: derived — this word reaches a beach only as the latch derived from it (seal.js latch: Argon2id, salt latch:<handle>), never as itself · since <ISO>`. Once the sweep in §5 has run, it ends with ` · swept <ISO>`.

The passport's own latch guards the line, so only its holder can set it or take it away. It says nothing secret, since the halves beside it are already public. 9.3 is free on every passport: `publicKeysToSpine` writes `_`, 1 and 2, and nothing reads or writes a passport's 9.3. There is one constraint in code. `pscale_key_publish` writes 9 whole (`src/tools/keys.ts:154–159`), so a republish must carry 9.3 forward.

### 4.2 The rule every door applies

A door holding a string `s` for a hand `h` sends `latch(s, h)` in its place when both of these hold, and `s` as it is otherwise:

1. `passport:h` at this beach carries `latch: derived` at 9.3;
2. `s` derives the halves at 9.1 and 9.2.

The second condition is what keeps the rule safe at the router's open address. There, `secret` may be any key the model was given: a shared project lock, an operator's key, a delegated latch. None of those derives a hand's halves, so none is ever derived or moved. Without the check, a session whose hand had switched would derive the project lock under its own name and be refused. The move on the spot (§5.2, step 5) would then rotate a shared block away from everyone else who holds that lock.

At the voice, the frame, the pages and the mirror the string is the hand's word by construction. They apply the same test anyway: it costs one derivation, which the seal pays in any case.

Which hand:

- **The router** already names two at its door: the session's declared hand and the handle the block is named for (`src/tools/bsp.ts:1106`). It tries them in order for a pass, and the latch takes the first that meets both conditions.
- **A `sed:` position's registrant and a grain side's holder** are named in their own calls.
- **Every other door** acts for the one hand that keyed in.

The cost is one read of `passport:h` for each hand at each beach in a session (the voice and the router read it anyway), and one Argon2id for each string and hand in a session.

**Behind a wall** the passport cannot be read before the proof, because the gate hides it from a stranger. So the door proves in the form it already knows for that handle at that beach (§4.4): the device keeps that beside the key, and the router keeps it in process memory. Where it knows none, it tries the derived latch first and the word only if that is refused, which costs at most two wrong keys on the passport, once. After the pass, the door reads the marker as it would anywhere else.

### 4.3 Weighed against the other two

| | what the beach host sees | wrong keys (the apex's cap is 30 a block an hour, `settings` 8.4, heard where the deploy turns caps on) | what it breaks |
|---|---|---|---|
| **the marker** (recommended) | the derived latch from the switch on; the marker itself says only that a handle has switched | none in steady state, because every door knows the form before it sends; during a switch, at most one for each block the sweep cannot move, and at most two the first time a session meets a block with a latch of its own | an untaught door, for a holder who has switched; so the order in §10 |
| **a rule by date** | the word until the date, then the latch | after the date, one on every write to a holder who had not keyed in, until that block's hour is spent and its holder shut out | every handle not keyed in before the date: 55 passports stand on the apex and 23 carry halves; characters, agents and probes, which seal nothing, are caught too |
| **both forms accepted for a season, at the handler** | the word, all season, because the handler has to derive the latch itself | none | every beach's handler and every deploy changes; every keyed request pays an Argon2id at 64 MB inside a serverless function; nothing marks the season's end for all five doors |
| **both forms accepted, at the doors** (the derived latch first, the word if refused) | the latch where it is taken, the word where it is not | one on every write to a block not yet moved, without end; a mistyped word now costs two | a hot block, such as a beat said every few minutes, spends its hour's cap and shuts its own holder out |

The marker is the only one of the four that sends neither the word nor a guess. It keeps the last row's fallback, but bounded: while a switch is running, a block that refuses the latch is moved once (§5.2, step 5), so the fallback runs once a block and never once a write, and after the sweep it runs only when the holder asks.

### 4.4 A host that lies

The marker stands at the very host it guards against, and a host controls both its own store and its own answers. Two things are therefore closed on the doors' side.

- **A marker never goes away unasked.** A host could strip 9.3 so that the doors send the word again. So once a door has seen the marker for a handle at a beach, or made the switch itself, it keeps that fact beside the key: the voice on the device, wrapped; the frame in the remembered person; the router in each fingerprint's own digit, and in process memory for the open address. A passport without the marker is then answered as a refusal ("this beach no longer says your key is derived; nothing was sent"), never taken as a reason to send the word. Only the holder's own `latch: "word"` takes the form back.
- **After the sweep, the word is sent only when the holder asks.** Moving a latch off the word needs the word (R4), so a host could fake a refusal of L to draw the word out.
  - Until the marker says swept, the switch is still running, and a door moves a refusing block on the spot. That is the moment every host the switch reaches sees the word one last time anyway.
  - Once it says swept, a refusal of L is answered as a refusal that names the block. The holder moves such a block by running the switch again through their AI. That run sweeps once more, and also takes the blocks the session was refused at. It shows each of those hosts the word once more, and the holder knows it does.

What this does not close: a host that has already seen the word, which includes every host the switch touches; the router on its open address, which receives the word in each call; and a members' beach at a device's first proof there, where nothing is known beforehand. Against a host already distrusted, the cure is a new word that is never sent to it (§7, §8).

## 5. The switch and the migration

### 5.1 Who switches

A latch moves off the word only with the word in hand (R4: `secret` the word, `new_lock` the latch), so the switch is always the holder's own act.

- **At the voice**, at their next key-in once step 4 of §10 has landed: `prove` at a members' beach, `wear` on an open one. It asks nothing, because the person sees nothing change.
- **Through their own AI**: `pscale_key_publish(handle, secret: <word>, latch: "derived")`, the primitive that already owns the passport's 9. This is how weft switches, and how David's AI can switch any beach where he holds a passport.
- **Newcomers** are born switched (§7).
- **Never** a character, a genus agent, a probe or a shared lock. None of them seals, so a raw latch is right for them, and the doors keep a plain path for them for good.
- **Reversible.** `latch: "word"` runs the same steps the other way, for a holder who finds a door that never learned.
- **Two-key holders** (`ways:vault` 1), whose latch and sealing word differ, switch from their latch to the latch derived from their sealing word, passing the old latch as `secret`. From then on they type one word.

### 5.2 One switch, in order

1. **The marker** at 9.3, written under the word. It goes first, so every door that reads it from then on sends the latch, and step 5 catches anything not yet moved.
2. **The passport's root is rotated:** `{block: 'passport:h', secret: word, new_lock: L}`, with no spindle and no content.
3. **The sweep.** The candidates are:
   - every block named for the handle in the beach's index;
   - the handle's own `index:h`, where it keeps one;
   - every block the device keeps a key for (`beach-key:<block>` at the voice);
   - `fingerprints:h` on the apex.

   Each candidate is first probed with no key: a relinquish with no secret, as whetstone 9.43 says. A 200 means the block is open, and it is left alone, so a room is never latched. A 403 means it is latched, and no wrong key is counted because no key was sent. Then its root is rotated from the word to L. If that is refused, the block is someone else's latch: one wrong key, and it is left. A `sed:` position and a grain side refuse a relinquish (405), so the sweep skips them; each moves when its holder's next write meets it, while the switch is still running, or by the switch run again (§4.4). The sweep never rotates a digit, because a digit that only inherits would gain a latch of its own (the leak walk's finding 4).
4. **The marker gains ` · swept <ISO>`.** An interrupted sweep never gains it, so the next key-in finishes the job.
5. **From then on every taught door sends L.** While 9.3 lacks "swept", a block that refuses L for a string that derives the halves is moved on the spot by the door that meets it, the way the leak walk rolled a key without a map. The door probes the root with no key. If the root is latched, it rotates the root from the word to L and sends the write again. If the write is still refused, the position has a latch of its own: the write goes with the word this once, and that position moves only when a lock map names it (schematic 1.54). This costs at most two wrong keys, once a block. Once 9.3 says swept, a refusal of L is a refusal naming the block, and the word is sent only when the holder asks (§4.4). A door that read the passport before the switch meets one refusal, reads 9.3 again, and carries on in the new form.

A rotation with no content writes only the latch. The handler saves a block only when content is sent, so the sweep leaves every touched stamp where it was. Among the candidates the apex lists, 110 blocks are named for weft, 93 for happyseaurchin, 57 for Phenomemental and 52 for keel. Two hundred blocks means about four hundred requests: about a minute from a phone, run in parallel, and seconds from the router. The voice runs the sweep after the key-in has answered, so nobody waits for it.

### 5.3 Keying in through an AI, before and after the switch

- **Before the switch.** A taught router reads `passport:h` once a session, finds no marker, and sends the word as it does today. Nothing changes for anyone until a marker stands.
- **After the switch.** The AI passes the word as before at the open address, or "vault" at the signed one. Once a session the router checks that the word derives the halves, and derives L once. From then on it sends L wherever a latch goes: every write, a founding `new_lock`, the pass proof, a settle, a grain side. It seals with the word, with `sealingKey` unchanged. A block the sweep did not reach is refused under L, and the refusal names it and says how to move it: run the switch again, which shows that beach the word once more. The model never sees L and never needs it.
- **A holder who keys in only through an AI**, as weft does, switches there with `pscale_key_publish`. The router runs §5.2 with the word in hand and needs no browser.

### 5.4 The mirror and the pages, before they are taught

They send the word. For a holder who has not switched, the write lands as it always has. For one who has, it is refused (`secret does not match`, one wrong key). The page asks again, the person types the same word, and it is refused again. Thirty refusals in an hour shut the block for the rest of the hour, at every door. That is why §10 teaches every door before the voice switches anyone, and why `latch: "word"` exists.

## 6. The fingerprint, and the word vault

The sign-in page asks for the key and seals what is typed to the fingerprint (`signin.ts:117–122`, 164–176). After this change it still seals **the word**: not the latch, and not both.

- The latch derives from the word in one Argon2id, held for the session, but the word cannot be recovered from the latch.
- The router needs the word for every seal. The pair is salted with the handle, but a vault is salted with the beach's address (`ways:vault` 2.3), so no single derived key could stand in for it.
- Holding both would double what an opened digit holds, for nothing.

**"vault" then stands for one word in two forms, depending on where it is written:**

- in `secret` and `new_lock`, it is the latch the marker names: L once the handle has switched, the word before;
- in `enc_secret`, it is the word itself.

The person still types one word, once, on the router's page. The mint and revocation write `fingerprints:h` on the apex under the latch the apex's marker names. `withoutKey` (`signin.ts:581`) takes both the word and L out of every reply, and the router's guard (`refuseKeyInPayload`, `db.ts:535`) refuses a payload carrying either. Schematic 1.67, "narrowed to the key", reads L as the key in its derived form. A signed call may therefore rotate a block from the word to L, as the switch and its step 5 do, and nothing else.

Schematic 1.68 asks "which of your connections should hold less than your whole key?". The derived latch makes that answerable: a fingerprint that holds L alone writes as its holder and opens nothing. That is an offer for later, not part of this build.

## 7. The made keys

- **Today.** A made key is three of the voice's 182 words and two digits from 10 to 99 (`voice.js:522–532`). That is 182³ × 90, about 5.4 × 10⁸ keys, or 29.0 bits. Its halves are published at the newcomer's next proof (`voice.js:249`, 700–711), which the battery's button walk confirmed.
  - **As a latch it is plenty.** Behind the beach's cap of thirty wrong keys an hour, guessing it is hopeless, which is just what `ways:key` 6 says.
  - **As a sealing word it is not.** Against the halves, at about a tenth of a second for each Argon2id guess (the design's §4.4), the whole space is about two years of one core, which is days on a hundred cores.
  - **The beach's store is worse.** There a raw latch stands as one fast sha256 of the word, and that gives up a made key in well under a second (§8).
- **For newcomers, after this.** Five words from a list of at least 4,096 plain words, so that five make 60 bits; a list of 7,776 makes 64.6. The digits go first, so a phone cannot capitalise the first letter (`ways:key` 2 and 3). The key is shown once, as the made key is today. The newcomer is born switched: `join` founds the passport with `new_lock` L, and the halves and the marker stand at 9 in that same founding write, so the word never reaches a host at all. This follows David's ruling of 25 October as `ways:key` 6 keeps it: memorable first, and four or five words where the same words also seal.
- **For a member with a made key.** They are switched like everyone else at their next key-in, which stops the host seeing their word from then on. At that same key-in they are offered, once, five words in place of three. The voice can tell its own made key by its shape: three of its words and two digits.
  - Taking the offer publishes new halves, proved by the old word under `pscale_key_publish`, runs the same sweep to the new word's latch, and shows the new word once.
  - What it costs is said plainly. A colour's keeper's next turn seals the member's copy to the new half, and lines from the turns before that open only under the old word.
  - A member who holds no copy yet loses nothing, so the offer is best taken before a colour admits them.

## 8. What the beach host sees

The host is whoever runs a beach's deploy and its store. For the apex and SALT that is David's Vercel and Upstash; for the router, David's Railway.

**Until a holder switches:**

- the word, in every keyed request at every door: as `secret` and `new_lock`, in the pass proof at a members' beach, and in a settle or a grain reach;
- in the store, at every latched position, `sha256(word + 'block:https://<origin>:<name>:<position>')`. That is one fast hash of the sealing word, so anyone with a copy of the store can try words at a graphics card's billions a second: a made key falls at once, while a five-word key holds;
- the router receives the word in each call on its open address and passes it on. At the signed address it opens the word from the fingerprint and holds it in memory for a minute.

**After a holder switches:**

- only L, in every request and in the proof. L writes as the holder wherever the same word latches the same handle, because it carries no origin (§3), which is no more than the word allowed before. It opens no line: sealing needs the word, and the halves come from a different salt;
- in the store, `sha256(L + …)`, a check on 256 bits of Argon2id output. Getting the word back from it costs one Argon2id a guess, the price the public halves already set;
- the router still receives the word on its open address and holds it at the signed one, but no longer hands it to any beach. A person who wants the router never to see the word can run the connector locally (the design's §4.1). Or they can give their AI L instead of the word: an AI holding L writes as them and opens nothing, because L derives no halves and the router sends it as it is.

**What switching does not reach:**

- the word every host has already seen;
- the old hashes in the door's day-copies and the nightly images, for as long as those are kept;
- a latch the sweep did not find and that nobody writes again;
- a beach where the holder has no passport, and so no marker: there the word goes as it is;
- the mirror's and the pages' plain keeping of the word on the device (the schematic record's §6 item 4, not this lane's).

For a word a host may already hold, the cure is a new word, which §7 offers. The derived latch is what stops the next word being seen.

## 9. The test

The cells use probe handles `probe-latch-<n>`, throwaway keys kept in the session's scratchpad, and the doors' battery's grounds; every probe is wiped afterwards. The grounds are:

- the lab (beach.idiothuman.com, open) for live probes;
- local beaches running the real handler on a folder, gated with `BEACH_GATE=members`;
- where a cell counts wrong keys, a local beach with `BEACH_CAPS=on` and `cap_wrong_keys_per_hour=3` in its `settings`.

The lab's button lags at #105, so the voice and the frame are the package's own files served locally, as the battery served them. The cells land as a span of their own in `tests:doors` at the lab, and as case ids in `door-test` when the FULL battery is built.

| cell | door | what is done | it passes when |
|---|---|---|---|
| L1 | all | `smoke:gray-vectors` runs `keys.ts`'s `deriveLatch` beside `seal.js`'s, and the mirror's if it carries one | every copy gives each vector's `latch_b64` |
| L2 | the handler, by curl | a passport founded with `new_lock` L and 9.3; a write with L and a write with the word; the proof at a gated local beach with each | L lands and mints a pass; the word is refused `lock_required` and counted |
| L3 | the router, open | in process against the lab: a switched probe's word as `secret`; an unswitched probe's word; a shared lock with no halves, for a switched hand | the wire's body carries L, the word, and the shared lock as it is, in that order; one derivation a session, by the counter |
| L4 | the router, signed | a local router with a throwaway sign-in secret over a local beach; sign in with the word | the ring is written under L; the injected `secret` is L; `enc_secret: "vault"` opens a vault entry with the word; no reply holds the word or L; the guard refuses content holding either |
| L5 | the router, the switch | `pscale_key_publish(..., latch: "derived")` on a probe latched at twelve positions like the leak walk's lock map, with one open room and one block under another key | 9.3 comes first; every root the word held moves to L; the room stays open; the other key's block is left, with one wrong key; the word is then refused everywhere and L taken everywhere; a second run changes nothing |
| L6 | the voice | at a gated local beach: `join`, with five words, digits first and 9 written whole in the founding write; then a made-key member's key-in | the newcomer is born switched; the member is switched without a question, then offered five words once |
| L7 | the frame and the ear | unlock with the word; one write and one ear change | each posts L, once the CSP is fixed |
| L8 | the site | every page that posts a key, through the helper, for a switched and an unswitched hand | L for the switched hand and the word for the unswitched one; no page posts a key except through the helper |
| L9 | the mirror | its writes fenced in the browser | as L8 |
| L10 | across: from the voice to the router | a switched holder says a coloured line at the voice; the keeper, also switched, reads it through the router with the word | the voice sent L and sealed with the word; the line opens at the router; the keeper's own write there lands under L |
| L11 | across: the router after the voice | the probe switched at the voice keys in through the router, open and then signed, makes twenty writes and proves for a pass | every write lands under L; the pass is proved with L; the vault opens with the word; no wrong key is counted |
| L12 | across: an untaught door | the package's voice as it stands (#107), for a switched and an unswitched probe | the switched probe is refused and the other lands, which is why the voice comes last |
| L13 | the cap | a taught door makes thirty writes for a switched holder; then the router meets a block the sweep did not reach | no wrong key in the thirty; one for the unreached block, refused with its name; a second run of the switch moves it, and no wrong key comes after |
| L14 | the reverse | `latch: "word"` on L5's probe | every latch is back on the word, and 9.3 is gone |
| L15 | a host that lies | a local beach whose handler is patched for the test to strip 9.3 after a switch and to refuse every L | neither the voice nor the router sends the word; each says the beach no longer says the key is derived |

## 10. The build order

One PR per repository. One rule orders them: every door must read the marker before anyone can set one, and only the voice sets markers without being asked. So the voice comes last, and its merge is the moment switching begins.

| step | repository | what lands | what it turns on the schematic |
|---|---|---|---|
| 1 | bsp-mcp | `deriveLatch` in `keys.ts`, checked against the vectors; the rule of §4.2 as one function, at the three places a latch leaves for a beach (`db.ts` 486, 575–583, 682–691) and at the pass proof (`pass.ts`); the marker read and the halves check; the form kept per handle (§4.4); the move on the spot while a switch runs; the fingerprint's two forms; the guard and `withoutKey` on both; `pscale_key_publish` carrying 9.3 forward and taking `latch`, which when run again also moves the blocks the session was refused at. Cut from main after the fixes-router PR merges, since that PR touches the same files. A `src/` change redeploys, so it merges at a quiet moment | 4.1, the router's line, and 1.64, the word vault, written again; 1.42's router clause |
| 2 | happyseaurchin | one helper, in `theme.js` (the three posting pages that do not yet load it gain it), that loads the beach's `seal.js` and answers the latch for a word, a hand and a beach; every page that posts a key goes through it, `hand.js` and `vault.js` included; `vault.js` writes under L and seals with the word. No page switches anyone | 4.3, the pages' line; 1.12's pages clause; 1.55, the page's vault |
| 3 | xstream-bsp | `bsp-client.ts`'s writes and the vendored wire follow the same rule, with `seal.js` loaded from the beach or the one function carried and added to the vectors. Its calls to the router's open address stay as they are, since the router derives | 4.2's "sends it raw to the beach" |
| — | Matthew's app | Community Recovery's app reads the marker before any of its members switches, or moves onto the voice as he offered at 1.111118. This step is his, and it comes before the package | — |
| 4 | pscale-beach | `voice.js` sends every latch through the rule: the proof, `join`, `found`, `say`, `keep`, `drop`, `set` and `publish`. It adds the switch at key-in (§5.2), resumed while 9.3 lacks "swept"; newcomers born switched, with five words; and the five-word offer for a made key. `frame.js` and `ear.js` derive L once the frame's CSP takes `'wasm-unsafe-eval'` (the battery's §8 item 10, which belongs to the package lane). So do `index-check` and any package script that writes as a holder. The PR's description lists the steps above as merged, and its merge waits for them | 4.4: "at both the one word is latch and sealing pair alike" becomes the word deriving both; 1.42 whole; 1.4's host clause; 1.1: "three words and a number" becomes five words; 1.429's NOT YET becomes LIVE once L1 to L15 pass |
| 5 | none: the switches | David's estate first, by his key-in at the voice and his AI's `pscale_key_publish` for any other beach where he holds a passport, and read back; then weft's, through the router; then each member at their next key-in | 1.4 and 1.42 say at their 9, by count, who has switched |

No step changes the handler. To the handler a latch is a string, and it hashes whichever one it is given.

## 11. The choice

- **GO**: build it in this order. Four PRs, the router's first and the package's last, each walked on the lab and a local gated beach before it merges; then the switches, with David's estate first.
- **CHANGE**: say what to change. The places a reader is most likely to differ:
  - the switch made by a tap, rather than without a question at key-in;
  - standing holders keeping their latch and sealing with a second word, as the last sentence of the design's §4.2 allowed;
  - the beach's address in the latch's salt (§3).
- **NOT YET**: the latch stays the word at every door, and 1.429 stands as written.

## 12. Found on the way, and left where it stands

- The unlock window keeps the word exactly as typed (`unlock.js:83`, no trim), while the voice's prompts trim (`voice.js:243`, 425). A trailing space makes a different key (`ways:key` 2), and after this change it also makes a different latch and a different pair. Changing that is not this lane's.
- At a members' beach no door can read a passport before the proof, so its halves and marker are hidden until then. §4.2 designs round this. Marking a holder's 9 as beyond would undo the point of the gate, so it stays hidden.
- This record replaces one sentence of the design's §4.2: "a passport latched with three words keeps them as its latch and seals with a second word, or rotates to the one-word latch when its holder chooses". Here there is no second word, and the rotation comes at the holder's next key-in, once every door has learned.

## 13. Provenance

Written on 5 November 2026 by weft (Claude Code on the Mac, Opus 5.5 at max effort, keyed), in lane derived-latch. The lane is a session started from lane systemic.2 at thread:weft 17.1114, after David's "go with them" on the battery's NOT YETs.

Read for it:

- **Records**: the three named in the header.
- **The beach**: `spine:security-schematic` 1.4, 1.42, 1.429, 1.12, 1.54, 1.6, 1.71 and 4.4; `ways:key` 2, 4 and 6; `ways:vault` 1; whetstone 9.2, 9.4 and 9.43; the caps in the apex's `settings`; and every passport on the apex, for its 9.
- **The code**:
  - pscale-beach at 4c2c602: `button/seal.js` and `voice.js` whole, and `frame.js`, `unlock.js`, `ear.js`, `button/README.md` and `api/pscale-beach.js` at the lines cited;
  - bsp-mcp-server at 1154dc5: `src/keys.ts`, `signin.ts`, `pass.ts` and `db.ts`, `src/tools/bsp.ts`, `keys.ts`, `pool.ts` and `stream.ts`, and `scripts/smoke-gray-vectors.ts` with its fixture;
  - happyseaurchin at c5054a8: `vault.js`, `theme.js`, `hand.js` and the thirty pages that post a key;
  - xstream-bsp at 6e30102: `src/App.tsx` and `src/lib/bsp-client.ts`.
- **The battery walkers' files** (button, xseals, leak) in the shared notes folder of this group of sessions.

One measurement was made on this Mac: hash-wasm's Argon2id, its 64-byte output sliced to 32 against its 32-byte output. On the beach this lane wrote only weft's own say at the beat, its pile, its journal, its knot and the doorbell. No code was changed.

Amended 9 November 2026, at David's word: the number in §7 is three, not five. "There is no way any human is going to remember five words," David ruled on 9 November, and the app never left three. A key made at the voice is two digits and three words of the 4,096-word list, 42.5 bits (29 before pscale-beach #109, 66.5 under it), by pscale-beach #111, open for his merge; `weak()` still names the old short-list shape, digits last. Everything else in §7 stands: the digits first, the long list, the switch, and the offer once at key-in. What three words cannot do, against someone holding a copy of the store and weeks of computing, is said where the key is made. The battery's L6 and the order's row 4 read three accordingly.
