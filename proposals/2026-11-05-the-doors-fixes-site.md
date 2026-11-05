# The doors' fixes, the site's share: the pass on every page, no key in plain text, the gallery's vault at its own beach under two keys, and the security page made true

**Date**: 5 November 2026
**Lane**: fixes.site, weft (Claude Code on the Mac, Opus 5.5 at max effort), one of the lanes cut from the battery's §8 at David's word, beside the router (bsp-mcp #604), the beach package, the mirror, and the derived latch, designed first and not built here.
**Status**: built on happyseaurchin-home #620, https://github.com/happyseaurchin/happyseaurchin-home/pull/620 (branch `claude/doors-fixes-site-ad0277`), checked headless and in the browser, against a local members' beach and the router's own vectors; not merged, so nothing is live yet. This file is the record, proposals only: merging it redeploys nothing. The knot is at thread:weft 17.11143, beside the router's at 17.11141 and the package's at 17.11142.

## 0. David's words

At thread:weft 17.1114, on the battery's §8 (5 November, 14:55Z):

> "There are a lot of not yet … So, go with them"

The fixes went one lane to a repository. The site's share is §8 items 19 to 23, with the schematic's NOT YET at 1.559 (the vault takes one phrase) beside them. Item 22 was to be recorded and not built. The derived latch (one word, two keys) was not to be built in this lane, so every page still sends the word as the latch.

## 1. In short

- **The pass (item 19; 1.35): built, for every page at once.** `theme.js` carries it, and 92 of the site's 117 top-level pages load `theme.js` in their head. Any request a page makes to a beach's wire carries the pass the voice keeps for that beach. A refusal at the door is proved once more without asking anything, and the request is made again. Where no pass can be had, the page says so in plain words and gives the way in. At a local members' beach, a member's own page now reads as hers, where before it said "Nobody by that name here yet". /here, /walk, the group page and the gallery draw the same words in place of "BEACH READ FAILED: 401" or "No world by that name".
- **No key in plain text (item 20; 1.12, 4.3): built for all eighteen names.** Five moved onto the voice's own keeping, `beach-key:<block>`. Twelve are wrapped under their own names. mindflow's key is wrapped by mindflow's own small module. Each plain copy is migrated on load: read, wrapped, then deleted. §3 says which name went where, and what remains and why.
- **The gallery's vault (item 21; 1.52): built.** The vault stands at the beach the page reads. That means the beach itself, never a table or a world beneath it, so a vault at the apex is still found from every apex table. The typed key is kept wrapped, never plain, and the vault key is kept nowhere.
- **`vault.js` takes a vault key apart from the latch (1.55, 1.559): built and proved.** The person's passport key latches the vault. A vault key of its own seals every entry and is never sent anywhere. A vault founded under one phrase opens with that phrase and is offered a re-seal. The salt stays the beach's origin, as the router salts. The round trip was proved against the router's vectors three ways (§5).
- **`beach-security.html` (item 23): made true.** Lines 172, 207 and 208 now say what is true today. Two more lines promised what the pages do not do: "Sealed with your vault key", and "everything still works inside". Both say what is true now (§6).
- **The waker's copy of a character's key (item 22): recorded, not built** (§7).

## 2. The pass on every page (§8 item 19; 1.35)

**Where it lives.** No page had a shared fetch helper: each keeps a small beach client of its own. So the pass is carried in the one script they all share. `theme.js` wraps the page's `fetch` (`sitePass`). A request whose path is a beach's wire, `<origin>[/w/<table>]/.well-known/pscale-beach`, carries the pass the voice keeps for that beach as `Authorization: Bearer`, unless the page set one itself. The pass is read in the voice's own shape and storage name, `beach-pass:<beach>`, kept for the beach's deploy, which its sub-beaches and tables share. A request that already carries `Authorization` passes untouched, as do the voice's own proof and the String's pass and invitations. Any other address is never touched.

**Proved once more, asking nothing.** A refusal, `401 members_only`, or a stranger's index (200, with the words "is its members' beach"), leads to one more proof of the passport, for that beach, once a page. The key comes from what the device keeps:

- first, a write's own key, for the handle its block is named for (the voice's own rule);
- then the passport's key of the member the pass was last for, or of the name this device signs with.

Where the voice speaks for that beach, the proof goes through `beachVoice.prove({ ask: false })`. Elsewhere the site makes the voice's own proof (`POST {block: 'passport:<name>', secret}`) and keeps the pass where the voice keeps it, in its shape. So this is the voice's logic carried for beaches its script was not loaded for, not a second design. A pass the door no longer takes (a turned secret) is given up, with its name kept. A record past its time is proved again before the request.

**The way in, in plain words.** `sitePass.wall(origin)` says three things:

- whose beach it is, and that a stranger is shown only what its members mark open, not even that the rest is there;
- that a member proves their key once and the device keeps a pass for twelve hours (a button asks for the name and the key, proves them, and reads the page again);
- that a newcomer comes in by a member's invitation, at SALT's String where the beach is SALT's.

/page, /here, /walk, the group page and the gallery draw it where they used to say nobody, nothing, or a status code. Any other page that a beach refused gets it under its bar.

**Walked** against the real handler on a folder (`pscale-beach/scripts/local-beach.mjs`, `BEACH_GATE=members`, settings latched last, as `smoke:voice-gate` does), with the apex's wire routed to it in headless Chromium. 25 checks, all passed:

- **A stranger at /page** is told it is a members' beach, with the way in, and not that nobody is here. No request carried a pass.
- **A member whose key this device keeps** is proved once asking nothing. Her own page reads, and every read after the proof carried the pass.
- **A member holding only a pass**, as /salt leaves one, reads with it on every request.
- **A stranger taking the way in:** the button asked for the name and then the key, and asked again after a wrong key. The page then read, and the key was kept wrapped.
- **/here, /walk, the group page and the gallery**, for a stranger, each told it is a members' beach, with no 401 in their words.

There was no script error anywhere.

**Not carried, and why.** The 25 top-level pages that load no `theme.js` are explainers and pictures (`index`, `render`, `what-this-is`, `beach-tree*`, `sundial-house`, …). They read only the open apex and keep no key, and nothing routes them to a members' beach. The hosted games run in an opaque origin, which is their own design (`games/frame.js`).

## 3. No key in plain text (§8 item 20; 1.12, 4.3)

**How.** Every page keeps a key through `siteKeys` in `theme.js`, under the name it always used: `get`, `set`, `del`, `has`, `forName`, and `ready()` before a key is read at load. The key is wrapped under a key the browser will not hand out. That is the beach's own keeping, `button/seal.js` `keep`: a non-extractable AES-GCM key in the origin's IndexedDB, the one the voice wraps its own copies under. Storage holds ciphertext only, and the key itself lives in the page's memory alone.

**Moved onto the voice's keeping, `beach-key:<block>`, and migrated on load.** These are the five names the voice reads as keys. Wrapped where they stood, they would have been read by the voice as keys. Moved, page and voice keep one copy for each block.

| old name | now |
|---|---|
| `next-latch:<block>` (a family: `<field>:<h>`, `ahead:<h>`, `<block>`) | `beach-key:<block>` |
| `mirror-latch:<block>` | `beach-key:<block>` |
| `passport-latch:<h>` | `beach-key:passport:<h>` |
| `lists-latch:<h>` | `beach-key:lists:<h>` |
| `now-latch:<h>` | `beach-key:now:<h>` |

**Wrapped where they stand, under their own names, and migrated on load:**

- `here-latch:<block>`, `journal-latch:<host>:<h>`, `grain-latch:<pair>:<side>` and `shell-latch:<block>`;
- the keepers' `next-keeper:<field>`, `morning-keeper:spine:<venture>` and `invite-keeper:<meeting>`;
- `models:key:<beach>|<h>`, in sessionStorage for a tab, or localStorage with "keep passphrases";
- `gallery:pass`, the image API key `gallery:key`, the picture place's `gallery:place-key`, and `group:narrator` (the OpenAI and ElevenLabs keys);
- `mindflow-api-key`, by `mindflow/key.js`, because mindflow's two pages load no `theme.js`.

That is eighteen names, every one on the battery's census.

**The migration.** Each plain copy is read, wrapped, and deleted. A browser that has wrapped a key before (marked `site-keys:able`) moves the voice's five names as `theme.js` loads, before any voice on the page reads storage, to the voice's own name for the block. So whichever wraps first, the page or the voice, finds them there. On a browser's first page, a page whose voice is already running when the move ends keeps the old name one page longer, beside its wrapped copy, because that voice may have read it. The next page moves it before any voice reads.

Two old names may hold different keys for one block. The second then stands as a spare, `beach-spare:<old name>`, and reads back under its own name until a key is next given for that block, so no key anyone kept is lost.

Walked headless in 28 checks, all passed. They covered:

- the move of all eighteen kinds, nothing plain left, and every name reading back the key it held;
- a reload reading back from the wrapped copies alone;
- `set` and `del`;
- the deferred move under a voice that read storage first (string.html);
- a browser with no IndexedDB, which kept what it kept and wrote nothing new in plain text.

**What remains, and why:**

- **The voice's pass, `beach-pass:<beach>`**, plain JSON with its expiry, as the voice keeps it (1.32). It is a pass, not a key. It opens reads at one members' beach for twelve hours, every write is still latched, and rotating the deploy's secret ends it.
- **A browser that cannot wrap** (no IndexedDB, no SubtleCrypto, an opaque origin) keeps what it kept, as it kept it, and is given nothing new to keep. That is the voice's own rule, which `siteKeys` follows.
- **A member's key at a beach other than the apex.** The site keeps it as `passport-latch:<name>@<host>` (so `beach-key:passport:<name>@<host>`), so a name standing at two beaches with two keys never shares one. The voice's own names carry no beach, and SALT's voice at /salt and the apex's share this origin. That is found alongside, for the package (§8).
- **`api/vault.js`'s httpOnly cookies, `hsu_<name>`**: server side, not the page's storage, and unchanged.
- **The waker's copy of a character's key**: §7.

## 4. The gallery's vault (§8 item 21; 1.52)

- **Where it stands.** `vault.home(BEACH)` is the beach the page reads, its deploy's own address, never a table (`/w/<name>`) or a world (`<x>.beach.<domain>`) beneath it. So a vault founded at the apex is the vault found from every apex table, as before. A gallery pointed at another beach (`?beach=`, or a world the register routes elsewhere) founds and opens the vault there, salted with that beach's address. The router reads it under that same address.
- **The typed key.** The passport's key, the image key, the picture place's key and a character's key are kept wrapped when "remember on this device" is ticked, and for the tab, wrapped, when it is not. None is kept plain, by default or otherwise. The vault key is held by its field alone, never kept, and asked for twice where it first seals.

## 5. `vault.js`: a vault key apart from the latch (1.55, 1.559)

**The calls:**

- `found(origin, handle, latch, vaultKey, law)` latches the vault with the passport's key and seals the canary with the vault key. It refuses a vault key that is the latch.
- `keep` and `read` take both keys.
- `read` says whether this key opens the canary: `canary: 'opens' | 'sealed' | 'none'`.
- `reseal(origin, handle, latch, oldKey, vaultKey, law)` seals a vault founded under one phrase again under a vault key. It goes entry by entry, reading each back before the next (ways:vault 2.2), then the canary, then the law at the root through spindle `0`. The latch is unchanged.
- `home(origin)` is the beach a vault stands at.

The salt is that beach's address, the router's form, so a vault opens at both doors. The vault key is never sent as `secret`, nor anywhere else.

**The gallery's key card** asks for the vault key beside the passport's key. A vault that opens under the passport's key alone, the one-key trade, is opened, and a "seal my vault again under its vault key" button is offered. New entries are not sealed into it until it has been re-sealed.

**Proved three ways:**

1. **`node scripts/check-vault.mjs`**, new in the site: 33 checks, all passed. It mocks the beach and records every request, and covers:
   - founding latched with the passport's key and sealed with the vault key, which no request carried;
   - a canary that opens under the vault key and not under the latch, nor under the bare handle as salt;
   - a vault key that is the latch, refused;
   - a one-phrase vault re-sealed: every entry and the canary open under the new key and not the old, the latch unchanged and the law replaced;
   - the router's own vectors both ways, read from `scripts/fixtures/gray-vectors.json` beside it;
   - where a vault stands.
2. **The router's own `smoke-gray-vectors.ts`**, run from this record's worktree with `vault.js` read from the site's worktree instead of the live site, and `SEAL_JS` at the package's `seal.js`: 100 checks, all passed. keys.ts opens what `vault.js` sealed, and `vault.js` opens what keys.ts sealed, for all four vectors. That is the run #611 relied on. The one-line copy of the smoke that pointed it at the worktree was removed after the run, and nothing in this repository changed.
3. **The gallery walked headless** against two local open beaches, one in place of the apex and one in place of the lab: 28 checks, all passed.
   - A vault founded from a gallery pointed at the lab stood at the lab, salted with the lab's address, and its law said two keys.
   - The canary and the image key opened under the vault key, and not under the latch or the apex's salt.
   - A write under the vault key was refused.
   - The vault key was in no request and nowhere on the device.
   - The passport's key and the image key came back wrapped on the next visit.
   - A wrong vault key opened nothing and said so.
   - A one-phrase vault, founded the old way, opened with its phrase, offered the re-seal, asked for the vault key twice, and was sealed again under it. The canary and entry then opened under the vault key alone, the latch was still the phrase, and the law said two keys.

## 6. `beach-security.html` (§8 item 23)

- **172, the vault key.** Your passphrase latches your vault, and the vault key seals what it keeps. The vault key seals in your own browser, where the gallery asks for it beside your passphrase, or in the router your AI calls, so the beach holds only what it sealed. A vault the gallery founded under the passphrase alone, before 5 November, still opens with it and offers to seal itself again.
- **207, where sealing happens.** In the browser, where the voice and the site's pages seal, or in the router your AI calls. Running your own router keeps what your AI writes off everyone else's machines.
- **208, the members' beach.** It was "a private beach, designed, not yet built". It is now "a members' beach, ready", built and live at SALT's beach. The line says what a stranger is shown, how a member proves their key and how they invite a newcomer, which doors pass the gate (the String, the site's pages, your own AI through the router) and which do not yet (the mirror, the button's own frame), and that whoever runs it still reads everything.
- **Two more lines** promised what the pages do not do:
  - The "Sealed" grade said "with your vault key", while a line sealed through the voice is sealed with the passphrase itself until the derived latch lands. It now says sealed in your browser or by your AI's router, before it reaches the beach.
  - "Latch the whole block" now says that a block latched at one entry can be replaced or wiped whole by anyone (1.11).

## 7. Recorded, not built: a character's key handed to the waker (§8 item 22)

Five places send the waker a key, at main c5054a8:

- /page's "change the key" (`rekeyDoorman`, `page.html:1091`) and "make it happen" (`foldOnce`, `page.html:1111–1112`);
- the group page's `enrolOne` (`group.html:751–752`), and its "make it happen" (`group.html:1067`), which sends the passphrase of every opened character at the table in one body;
- the models page's keeper enrolment (`models.html:787–788`), which also sends an API key as `fuel`.

Each sends the character's key to `waker-production.up.railway.app` as plain JSON, `{ handle, passphrase, … }`. The doorman needs it, because the waker writes as the character.

**What would change it**, for David's word:

1. **The derived latch** (lane derived-latch; David's GO at 17.111451, site second in its order). The pages would hand the waker the latch derived from the word, `Argon2id(word, 'latch:' + handle)`, never the word. The doorman could still write as the character, but it could open nothing the word seals.
2. **The hand-over sealed to the waker's published half.** The waker would publish a box half, for example at `ways:doorbell`, beside its door. The pages would box the key to it as a grain line is boxed. The key would then never be plain on the wire or in a log, and the waker would keep it wrapped at rest.
3. **A key of the doorman's own.** The person would latch what the doorman writes (the room-facing blocks) under a second key held only by the doorman, so the passport's key never leaves the device. This waits on how a character's blocks are latched (1.14), and would change what the mirror's doorman card asks too.

The first is the smallest step, and lands with the derived latch. The second needs the waker's own lane. The third is a design.

## 8. Found alongside, for other lanes

- **The beach package.** The voice keeps `beach-key:<block>` with no beach in the name. SALT's voice at /salt and the apex's voice share the site's origin, so a name that stands at both with two keys keeps only the last one given. Separately, a stranger's index at a members' beach says it is one only in words ("is its members' beach"). `sitePass` reads those words, and a field such as `gate: 'members'` in the index answer would let it stop.
- **The site, for a later pass.** A browser that clears its IndexedDB but not its localStorage loses every wrapped key, the voice's and the pages' alike. Clearing site data clears both, so in practice the two go together.

## 9. Checks run

- **`theme.js` siteKeys:** 28 checks headless, all passed (§3).
- **`theme.js` sitePass** at a local members' beach: 25 checks headless, all passed (§2).
- **`vault.js`:** `node scripts/check-vault.mjs`, 33 passed; bsp-mcp `smoke-gray-vectors.ts` with this `vault.js`, 100 passed; the gallery walked, 28 passed (§5).
- **Every changed page** at 1280 light and 390 dark, headless, with reads from the live beach and every write refused: §SMOKE§.
- **In the browser** (the app's pane, served from the worktree):
  - `beach-security`, light and dark;
  - the gallery's key card at 1280 light and 390 dark. Its "watch this table" button had laid the page out 600 wide on a phone before this change, and its service select ran past the card. Both were capped at their row.
- **Keys:** only throwaway keys on local beaches. No key is in this file, the PR, a commit or a block.

## 10. Provenance

Built 5 November 2026 by weft (Claude Code on the Mac, Opus 5.5 at max effort, lane fixes.site), at David's word at thread:weft 17.1114.

Read for it:

- `CLAUDE.md` of happyseaurchin-home;
- `proposals/2026-11-05-the-doors-battery-minimal.md` §5, §6 and §8, and the pages walker's notes and census (`systemic.2-doors-battery/pages.md`);
- the doors' map §3;
- `spine:security-schematic` 1.1, 1.3, 1.46, 1.5 and 4.3;
- `proposals/2026-10-24-security-in-the-core.md`, "Found alongside, on the site";
- `ways:vault` 1 and 2;
- pscale-beach `button/voice.js` and `button/seal.js` at 4c2c602, and its handler's gate.

The code is happyseaurchin at c5054a8 and bsp-mcp at ac6e651.
