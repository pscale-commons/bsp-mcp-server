# The doors' fixes at the mirror: a members' beach said as one, the card's passphrase proving a pass once, nothing founded on a step, and a card that says where its key goes

**Date**: 5 November 2026
**Lane**: fixes.mirror, weft (Claude Code on the Mac, Opus 5.5 at max effort), one of the lanes of David's word at thread:weft 17.1114. Beside it are the router's lane (bsp-mcp #604, whose wire this lane vendors), the beach package's and the site's lanes, and the design-first lane for the derived latch. None of those touch the mirror.
**Status**: BUILT in one PR, [happyseaurchin/xstream-bsp#390](https://github.com/happyseaurchin/xstream-bsp/pull/390), not merged.
- **Merge order.** It vendors the router's wire at 0.3.0 as #604 carries it, so #604 merges first (§5).
- **Deploys.** Vercel builds the mirror's main on merge. It has skipped a build before, so the deploy is checked by the served `Mirror-<hash>.js` (§4.4).
- **The seal is not built.** It is recorded in §6.
- **The beach.** Nothing was written on a live beach by this lane except weft's own knot at thread:weft 17.11144 and its doorbell line in `pool:happyseaurchin`. `spine:security-schematic` is its keeper's to re-voice once this is merged and live (§7).

## 0. David's words

At thread:weft 17.1114 (5 November, 14:55Z), having read the schematic's NOT YETs, David said: *"There are a lot of not yet … So, go with them."* The fixes go one lane per repository. This lane is the mirror's share of `proposals/2026-11-05-the-doors-battery-minimal.md` §8, items 8, 16, 17 and 18: the wall and an honest card. The seal is left for a later lane.

## 1. The answer in short

- **A members' beach is said to be one.** Before, the mirror folded the beach's 401 into "no block", so a person at a members' beach was told it was quiet and asked to say something every write would refuse. Now a refused read is a failed read. The glass says what the beach is, says the way in, and lists what its keepers mark beyond, which anyone may open. A wrong passphrase, and a name with no passport there, are each said as what they are.
- **The card's passphrase takes a member through.** The mirror proves the passport once, as the voice does, and the beach answers with a pass. The pass rides every read and write to that beach for its twelve hours. It is kept per beach and hand, in the storage the card keeps the passphrase in, never alongside it.
- **Nothing is founded on a step.** Stepping in no longer founds `lists:<handle>` or latches `beach-visits:<handle>` on the apex. Both registers are kept current only where they already stand. A members' beach is never written onto either.
- **The card tells the truth.** It names the four places the passphrase goes and the two the API key goes. "Remember" starts unticked, and the identity card ticks it only where something is already kept on the device.
- **The wire is the router's again**, byte for byte at 0.3.0, with its door hooks set from the mirror's door.
- **Not built**: the seal, colours and fingerprints. §6 says what they would take.

## 2. What was built, fix by fix

Lines are as they stand at e8da58c, the PR's head.

**8. The wire, re-vendored.** `src/kernel/pscale-wire.ts` is the router's `src/pscale-wire.ts` taken byte for byte at **7ea7177** (sha256 `31a30f9e…`). That commit is the head of `claude/doors-fixes-router-04018b`, bsp-mcp #604, and carries `WIRE_VERSION` 0.3.0:
- the door hooks of #571: a pass proved from the hand and secret a call stands with, carried on every later read and write, and proved once more on `members_only`;
- #604's index read through the door (`strangersView`).

`pscale-wire-contract.ts` was already byte-identical and stays so. The mirror sets the hooks from its own door (`src/lib/bsp-client.ts:364–369`), so the genus seat's reads and writes go through the same door as `bsp()`. `scripts/smoke-wire.ts:17–20` takes `WIRE_REF`, so its tripwire can diff against a branch or commit while the router's PR is open. Against router main it is red until #604 merges. It was red before this too: the battery's finding 1 had the mirror's copy a version behind #571.

**16. The wall** (`src/lib/bsp-client.ts:172–369`, the door; Mirror.tsx for the glass).

The proof:
- **Who stands at the door.** The surface puts the hand there with `setDoor` (329): the card's handle and passphrase, and whether the card keeps them on the device. The Mirror sets it before the kernel's first read (`Mirror.tsx:575–579`), and again whenever the card is kept (2050).
- **The proof itself.** On a 401 `members_only` the mirror proves the passport, `POST {block: 'passport:<handle>', secret}` with no content, as `button/voice.js` `prove` does (`proveAt`, 270). It keeps the pass with its expiry under `xstream:pass:<handle>@<beach>` (`keepPass`, 235): in sessionStorage while the card does not remember, in localStorage when it does, and never with the key. Then it sends the request once more.
- **One proof at a time.** Concurrent reads wait on the same proof. A pass earned while a request was in flight is used, not proved again (`throughTheDoor`, 306).
- **A refused proof is held.** No passport by that name (404), or the key refused or capped (403, 429), is not tried again until the card changes, since a wrong key counts against the passport at the beach. Any other failure is the beach's trouble and is tried again on the next read.

Where the pass rides:
- **Reads.** A refused read is now `{ok: false, code: 'members_only', error: <the door's words>}` (721). It was `{ok: true, raw: null}`, and every caller already checks `ok`.
- **Index and tables.** `fetchBeachIndex` (433) sees the stranger's view of a members' beach, proves once when the card holds a passphrase, and reads again as a member, as #604's index read does. `fetchPlayedTables` (482) goes through the door too.
- **Writes.** A write carries the pass the same way. A stranger's write meets the first refusal and never knocks again until the card changes (`stillWalled`, 264, at 513), so the heartbeat no longer posts to a refusal every cycle.
- **Open beaches.** Authorization rides only where a pass is held. An open beach's reads stay simple requests and need no preflight (gotcha 2 in the mirror's CLAUDE.md).

The glass:
- **The wall in words.** It says what the beach is and the way in, for a stranger, a name with no passport and a wrong passphrase (`wallWords`, 350). A newcomer's way is the router's own words: a member's invitation, whose link opens the String's join on the beach's own site.
- **Where it shows.** The glass shows the wall where it said "quiet" (`Mirror.tsx:607–612`, 3724). A button opens the card, and what the keepers mark beyond stands as chips anyone can open (`WallLine`, 4355). A parked block the door refused reads "behind the wall — not read" (3614).

**17. No founds without an act.**
- **The row.** `lists:<handle>` branch 3 is written only where `lists:<handle>` already stands (`Mirror.tsx:730–759`). The lens's follow is the act that founds it (`lens.ts:88–89`).
- **The visits.** `beach-visits:<handle>` is updated only where it stands (2163–2188). Its founding branch, and the underscore that founded it, are deleted. Nothing in the mirror founds it now. If a hand is to have one, an act of theirs founds it.

**18. The card.**
- **The words.** "The key never leaves this browser" became what is true (`Mirror.tsx:4617–4624`). The passphrase goes to the beach with each write it latches (and, at a members' beach, to prove a pass), to the router's open address when the mirror asks through it, to this site's own function when the house's model answers, and to the waker if a doorman is enrolled. The API key goes to Anthropic, and to the waker only as a doorman's fuel. Both outlast the tab only with remember ticked.
- **The first-run card.** "Remember on this device" starts unticked (4401).
- **The identity card.** It shows what is true now: ticked only where the passphrase or the API key is already kept on the device (4575–4577). Pressing "keep" can no longer move a tab's passphrase onto the device unasked.

## 3. Found on the way, and built

- **The open registers would have carried a members' beach onto the apex.** A member's row would have published their tabs there, each with its beach, address and label. Their visits would have named the beach and when they were last there, on the open commons, which is exactly what a gate hides. `isMembersBeach` (`bsp-client.ts:321`) knows a beach the page met from inside or out, and both registers leave it off (`Mirror.tsx:742`, 2172).
- **The identity card re-ticked "remember"** even when the passphrase sat in sessionStorage (the battery's mirror walker, finding 2), so "keep" moved it onto the device. Built as §2.18.
- **A stranger's heartbeat posted to the refusal every cycle.** It now stops at the first refusal (§2.16).
- **A proof that met a server error would have been held as a wrong key**, and the person told their passphrase was wrong. Only 404, 403 and 429 are held.

## 4. The cases that prove it

**4.1 `npm run smoke:wall`** (new; `scripts/smoke-wall.ts`). It runs the real handler, `pscale-beach` `scripts/local-beach.mjs`, on throwaway folders: one beach gated (`BEACH_GATE=members`, settings root-latched last) and one open. The mirror's own `bsp-client` and its vendored wire are driven in node, every request recorded by shape. 41 checks, all green:

| section | what is proved |
|---|---|
| a stranger | a member's block refused, not read as absent; the refusal names a members' beach and the way in; the wall met as a stranger and watchers told; no proof and no pass sent; the beyond block read; the index lists only it; a write refused in the same words and never sent; the tables refused quietly |
| a member, remember unticked | the block read; the passport proved once with no content; the read sent again with the pass; the pass in sessionStorage, not localStorage, with its expiry and never the key; a write landing with the pass and the latch; the index listing what stands inside; every later request carrying the pass and none proving again |
| the pass lost, or not honoured | five reads at once proving once between them; a forged pass proved once more and the read made |
| the card remembers, then forgets | the pass kept on the device when ticked; none of this hand's left there when unticked |
| the vendored wire | `loadBlock` through the same door, proving once; a stranger's refusal thrown as the wall's own words, not a status line |
| a wrong passphrase | refused; the wall says the passphrase did not open the passport; tried once; the write never sent |
| a name with no passport | told that none stands by that name, with the way in; tried once |
| the open beach | read and written as ever; no pass, no proof, no wall |

**4.2 The mirror's whole suite**, every `smoke:*` run behind a fence that refuses any write to a host that is not this machine: 49 of 51 green.
- **`smoke:wire`** is red only on its tripwire against router main (§5). With `WIRE_REF=7ea7177…` it is green: battery 42/42, both files byte-identical.
- **`smoke:tools`** stops at "an anonymous visitor has no ladder, and is told so". That failure is identical on main at 6e30102. Run to its end on both trees, the other 95 checks pass on each. It is not touched here.
- **Also green**: typecheck, build, `smoke:conformance` 64/64, `smoke:parser` 62/62.

**4.3 Looked at in a browser**, 375 wide, against a local rig (the real handler gated on one port, open on another; the member `wallrig-ada`, a name that stands nowhere on the apex):
- **A stranger** saw the wall's words, the way in, and `lighthouse` beyond. They opened it and read it.
- **The member**, with the throwaway passphrase kept on the card and remember unticked, saw the member's mark behind the wall. The pass sat in sessionStorage as `{pass, expires}`, twelve hours out, and the passphrase was not on the device. Each read to the members' beach was preceded by a preflight (§8).
- **A wrong passphrase** read "the passphrase on your card did not open wallrig-ada's passport there", with a button to check it.
- **What left the page**, recorded from inside it: the apex saw only GETs of `lists:wallrig-ada` and `beach-visits:wallrig-ada`. Both were absent, and there was no POST and no passphrase. At the rig's open beach, no request carried a pass and none proved. At the live apex, read as an anonymous stranger with writes fenced in the page, the board read as ever: 22 GETs, none with a pass, and no wall.

**4.4 The deploy.** The live mirror served `assets/index-X0dvZGvs.js`, which lazy-loads `assets/Mirror-B6dpzKba.js`, still saying "the key never leaves this browser". After the merge, the served Mirror chunk changes name. It should carry "what its keepers mark beyond:" and "and it leaves this browser", and the entry chunk should carry "xstream:pass:" and "a stranger sees only what its keepers mark beyond". A local build of e8da58c names them `Mirror-BGLgRUau.js` and `index-DOCknfBh.js`. The PR gives the one-line check.

## 5. The wire, and the order of merging

- **Where it was taken from.** The mirror's wire is the router's at **7ea7177**, the head of #604 when this was built. Re-vendor if #604 moves before it merges. With `WIRE_REF=<its head>`, `smoke:wire` says at once whether the copy still matches.
- **Router main.** It carries the #571 file at 0.2.0, which differs. So: #604 first, then xstream #390. After both, `smoke:wire` is green against main with no override.
- **The router's own claim.** `src/db.ts:30–31` used to say the copy is byte-identical, and the battery found that untrue. #604 already makes it say "vendored at a version", which is now true again.

## 6. Recorded, not built: the seal, colours and fingerprints

The mirror seals nothing. `BspParams.gray` (`bsp-client.ts:63–66`, now documented as dropped) is never forwarded, and no colour or fingerprint appears anywhere in `src/`. What sealing at this door would take:

1. **Load the beach's own seal, as the voice does.**
   - **How the voice loads it.** It adds `seal.js` as a script beside itself, which gives `window.beachSeal`. Its two libraries, `vendor/nacl-fast.min.js` and hash-wasm's `vendor/argon2.umd.min.js`, are loaded beside it on first use (`pscale-beach` `button/voice.js:155–166`; `button/seal.js`).
   - **Which copy.** Any beach in the family serves it byte for byte. Load it from the beach the mirror stands at, or from the apex.
   - **No CSP in the way.** The mirror's deploy sets no content-security policy (`vercel.json` and `index.html` set none), so the WebAssembly that argon2 needs runs here. It does not run in the button's frame, whose CSP refuses it (battery §8 item 10).
   - **Copies of its own.** The mirror should keep none. One seal, one set of vectors (`smoke:gray-vectors`).
2. **Stop dropping the ask.**
   - **On writes**, `bsp()` passes `gray` on: a write asking it seals the content before it leaves.
   - **On reads**, it opens what the hand's keys open and shows the rest as one grey line, as the voice and the router do.
3. **The pair.** It is derived from the card's passphrase with the handle as salt: Argon2id, t=3, m=64 MiB, 64 bytes, as `seal.js` §4.2 has it. It is held in memory for the page's life only. Anything the mirror keeps on the device goes through `keep.wrap`, under a non-extractable key in this origin's IndexedDB, never plain. That same move would let the card stop keeping the passphrase itself in plain text (1.12).
4. **Colours.**
   - **Reading and sealing.** Read `colour:<name>` and its turn's keyring, open the turn with the pair, seal with `gray: 'colour:<name>'`, and wear opened turns for the tab, in memory.
   - **A writer with no copy** seals a letter to the turn.
   - **Publishing the halves.** At key-in, publish the halves at `passport:<handle>` 9 where none stand, as the voice's prove does, so a keeper can seal a copy to the person.
5. **The salt.** A self line sealed here with the handle as salt opens at the voice and the frame. At the router it opens only by bare handle at the router's own beach, because the router salts with the `agent_id` as given (1.41, as the walk re-wrote it). A page that wants its self lines read through the router would seal with the beach's address as salt, as the router does. Which salt the mirror takes is a design choice, not a fix.
6. **Fingerprints.**
   - **Today.** The mirror calls the router's open `/mcp/v1` with `secret` on the call (`src/lib/mcp-client.ts:23`, and the other sites the doors' map names).
   - **What a fingerprint would take.** Fingerprints are minted only for a signed connection (`/mcp/v1/me`, OAuth). A page would need an OAuth client of its own against it, with PKCE, holding a token instead of the word.
   - **Two limits.** Sign-in at a members' beach is not built (the router's record, §6). And a fingerprint is minted only for a passport standing on the router's own beach (1.62).
7. **The latch is still the word.** Until the derived latch lands (thread:weft 17.11145), the card's one word is both the latch and the seal. It still travels raw to the beach as the latch, and to the other three hosts the card now names. A seal here would hide the words from an operator. It would not keep the word itself off the wire.

## 7. What turns on the schematic, once this is merged and live

The keeper's to re-voice, under the project lock, after the served Mirror chunk carries this.

- **4.2 (and its 9).** The following no longer stand: "knows no wall", "a members' beach refuses it" (it refuses a stranger and lets a member in with the card's passphrase), "a members' beach reads to a person as a quiet one", "though its card says the key never leaves the browser", and "its copy of the beach's wire has drifted" (once #604 is merged). These still stand: it seals nothing, it knows no colour or fingerprint, it keeps the passphrase in plain text in the browser (in sessionStorage now, unless remembered), and it sends that passphrase raw to the four hosts.
- **1.35.** "nor the mirror, which reads a wall as an empty beach" becomes the mirror proving a pass from the card's passphrase, as the voice does. It neither mints nor takes an invitation, and it sends a newcomer to the String's join.
- **`tests:doors`** cells 23 (1.3 at the mirror) and 72 (the door's own line) would walk differently. Cell 3 (1.1) would show "remember" unticked by default.
- **1.12 and 1.14** are not turned by this lane:
  - the plain copy, now in sessionStorage by default;
  - a dropped character's key, minted on the mirror's server and kept on the device unasked (`Mirror.tsx:2079–2083`);
  - the doorman's passphrase sent to the waker.

## 8. Left, and named

- **The full surface at `/`** (xstream.onen.ai) shares `bsp-client`. It reads a refusal honestly now, but it never puts a hand at the door. Its own direct fetches (`Column.tsx:942`, 979; `WakePulse.tsx:126`; `use-shell-life.ts:42`) carry no pass.
- **A preflight per read at a members' beach.** `Authorization` is not a simple header, so each pass-carrying read is preceded by an OPTIONS request. The read's `_t` cache-buster makes every URL new, so the browser cannot cache the preflight. The cost falls only where a pass rides. A pass in the URL would avoid the preflight, but it would put a bearer token in logs, so that is not an answer.
- **Other non-OK reads still fold to "absent"** (500, 403). Only the door's 401 was made honest here. The wire's own rule, "unreadable must never pass for absent", would have every other non-OK read fail too. That is a change to every caller's expectations, so it is its own lane.
- **`smoke:tools`' failing case** ("an anonymous visitor has no ladder") fails on main as it does here.
- **The doors' map called the mirror's Gate "No"** and its seal "None". The first is now yes, by the card's passphrase. The second stands.

## 9. Probes, keys and what was left

- **The live beaches.** Nothing was written to any live beach by the smokes or the rig.
  - **The smoke's and the rig's beaches** were throwaway folders, removed. Their ports were checked free after.
  - **The rig's member, `wallrig-ada`,** stands nowhere on the apex: `lists:`, `beach-visits:` and `passport:` all answer 404, checked before the look and after it.
  - **Two moments at the apex as an anonymous visitor.** The live apex was looked at once as an anonymous visitor, with the page's writes fenced from the moment the page could be reached; one presence heartbeat was refused by that fence. The preview also opened the full surface at `/` for a moment before it was moved off. Either moment may have left one anonymous presence mark at the apex, which goes stale in thirty seconds. No key was held in either.
- **Keys.**
  - **The smoke's keys** were made in-process and never printed.
  - **The rig's member key** was a throwaway in the session's scratchpad (mode 600). It was typed into the card on localhost and then deleted.
  - **Nothing else.** No key is in this record, the commit, the PR or any block.

## 10. Provenance

Built 5 November 2026 by weft, lane fixes.mirror, at David's word at thread:weft 17.1114.

Read for it:
- this repository's `proposals/2026-11-05-the-doors-battery-minimal.md` §5, §6 and §8;
- the doors' map of lane systemic.1, §2 (the mirror);
- `spine:security-schematic` 1.14, 1.35 and 4.2 at beach.happyseaurchin.com;
- the battery's mirror walker file (`mirror.md`, findings 1 to 8);
- the router lane's hand-over note and its record.

Code read:
- bsp-mcp-server at 7ea7177 (`src/pscale-wire.ts`, `src/pass.ts`), against main at ac6e651;
- pscale-beach at 4c2c602 (`api/pscale-beach.js` the gate, the proof and CORS; `button/voice.js` `prove`; `button/seal.js`; `scripts/local-beach.mjs`; `scripts/smoke-voice-gate.cjs`).

Built:
- xstream-bsp from 6e30102 to e8da58c.
