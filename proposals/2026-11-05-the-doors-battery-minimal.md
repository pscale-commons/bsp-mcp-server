# The doors' battery, MINIMAL: one walk per door per part of the security schematic, recorded at the lab

**Date**: 5 November 2026
**Lane**: systemic.2, weft (Claude Code on the Mac, Opus 5.5 at max effort, keyed), with eight Opus 5.5 walkers beside it: one for each door (the handler by curl, the router, the mirror, the site's pages, the button and the voice) and three for the cells that cross doors (the seals, the walls, the leak).
**Status**: walked, 13:15Z to 14:10Z. On the beach the same afternoon: the table `tests:doors` at the lab (beach.idiothuman.com), founded under weft's key, 68 cells and seven part summaries; on `spine:security-schematic`, each part's state at its 9 and sixteen lines the walk found untrue written again under the shared project lock, with four citation and door corrections lane systemic.1 sent (§5), the standing spine kept whole first at `archive:spine:security-schematic:2026-11-05-2`; the knot at thread:weft 17.111. `function:security-schematic` 7 stays `phase: draft` until David has read this. No `src/` change: every code fix the walk found is named in §8 for David's word. Merging this file redeploys nothing.

## 0. David's words

His choice at thread:weft 17.11 (5 November, 13:10Z), of the three the schematic record put to him (`proposals/2026-11-05-the-security-schematic.md` §5.5):

> MINIMAL — one walk per door per part, by hand and headless, recorded at the lab; about a day.

And why, in his own now for the day (now:happyseaurchin 2026421500):

> "Still need robustly test colours, and the private beach wall. We need to test it sufficiently so that Matthew can try it. Maybe the minimal tests (it works) are enough, and Matthew can just adopt it with the C-R app?"

So the question this walk answers is his: does it work, door by door, well enough for Matthew to adopt the members' gate and the colours with the Community Recovery app. FULL (the sentinel battery in CI) waits until two design gaps close: the derived latch nobody calls in `button/seal.js`, and the handler's missing key guard.

## 1. The answer in short

- **What Matthew needs works, through the voice and the router.** The members' wall holds at the handler, at the router's block tools and at the voice the String carries: a stranger meets one refusal for a block that stands and one that does not, a member proves once for a twelve-hour pass, an invitation minted at the voice founds a passport at the String's join. A colour crosses doors both ways: a line sealed at the voice opened at the router, a line sealed at the router opened at the voice, a third hand read one grey line at each, and a letter was read by its holders alone. So the C-R app can adopt the gate and the colours the way the String does, with three cautions from the walk: send **named** invitations (an unnamed link founded two passports, 1.349); a member's own AI cannot take an invitation, and through the hosted router it signs in only if the member's passport also stands on the apex (1.62); and the one word is still the latch, a made key about 29 bits (1.429).
- **The states, as the walk set them**: 1.1 a name and a key LIVE; 1.2 writing as yourself NOT YET; 1.3 behind a wall NOT YET; 1.4 sealing a line NOT YET; 1.5 the vault NOT YET; 1.6 an AI without the key LIVE (walked on a local router); 1.7 when a key leaks LIVE (rehearsed by script); the five doors' own lines all NOT YET.
- **Sixteen lines were untrue, and are written again.** The sharpest five: the button's frame derives no key, because its own content-security policy refuses the WebAssembly the seal is built on, so it seals only letters and opens nothing; the router seals group and grain only for members whose passports stand on the apex; `pscale_genus` writes go out with no key guard; `pscale_play` reads a walled table's index with no pass and calls it empty; and a latch held only at a position stops neither a whole-block write nor a wipe. The rest are in §5.
- **Not walked, and why**: the pocket (no code here; Matthew's nine tests answer its cells), the hosted router's sign-in (a mint writes the apex), the String's `/salt` door and the vault's cookies (`/api/*` does not serve statically), the copies only the operator holds, and grain at the lab (a grain block cannot be wiped).

## 2. What was walked, and on what ground

- **The claims are the schematic's own lines.** Rows: the seven parts of `spine:security-schematic` (1.1 to 1.7) and the five doors' own lines (4.1 to 4.5). Columns: the handler by curl (the reference, since all five doors reach it), the router, the mirror, the site's pages, the button's frame, the voice, and the pocket. Each cell's verdict is one of: PASSED; REFUSED AS THE SCHEMATIC SAYS; GAP CONFIRMED (a NOT YET that stands as written); UNTRUE (the schematic's words were wrong); NOT APPLICABLE; NOT WALKED (and why).
- **The grounds.** The lab, `https://beach.idiothuman.com`, an open beach on the package's main handler, for every live probe; local beaches running the real handler on a folder (`pscale-beach/scripts/local-beach.mjs`), gated with `BEACH_GATE=members` for the wall; the hosted router at `bsp.hermitcrab.me` for the router's live cells, each hand a client of its own because colours and passes are worn per session; a local router (in-process, or `src/index.ts` with a throwaway sign-in secret) for the wall and the signed connection; the live mirror at mirror.onen.ai in headless Chromium, with every write it would make fenced; the site's pages served from the site checkout by `python3 -m http.server`, their beach routed to the lab; the package's own button and voice served locally. Never the open commons for a probe, never SALT but as a stranger's read.
- **The lab's button lags.** The lab serves `button/voice.js`, `frame.js` and `unlock.js` from #105 and no `seal.js`, while the apex serves the package's main (#107) byte for byte. So every walk that needed the voice or the frame to seal loaded the package's own files, pointed at the lab or at a local beach.
- **The probes.** Handles `probe-doors-1` to `probe-doors-79`, blocks `probe:doors-*` and the probe handles' own `<x>:probe-doors-<n>`, each key a throwaway kept only in the session's scratchpad; every one wiped before the close (§9).
- **Where the evidence is.** Each walker's file, the smokes' logs and 45 screenshots, a person's view of each door at 390 wide among them (the unlock window, the key sheet masked, a refusal at the wall in the frame and on the String, a grey line, the mirror at SALT, /page and /here at a members' beach), are kept in the shared notes folder of this group of sessions, under `systemic.2-doors-battery/`. They hold no key.

### 2.1 The smokes that already prove cells, run once this session

Run from main on 5 November, 13:15Z to 13:22Z; the counts are cited by the cells they cover rather than walked again.

| suite | where | checks | covers |
|---|---|---|---|
| `smoke:key-guard` | bsp-mcp | 21, all pass | 1.21 the router's guard |
| `smoke:gray-vectors` | bsp-mcp | 100, all pass | 1.41, 6: one envelope, the router's, `seal.js`'s, `stack.html`'s and `vault.js`'s keys byte for byte |
| `smoke:seal-price` | bsp-mcp | 36, all pass | 1.47 the price |
| `smoke:colour` | bsp-mcp | 54, all pass | 1.43 to 1.45: founding, wearing, a letter, a turn |
| `smoke:private-room` | bsp-mcp | 64, all pass | 1.4 at the room and the stream |
| `smoke:pass` | bsp-mcp | 24, all pass | 1.32 the router proving a pass |
| `smoke:signin` | bsp-mcp | 105, all pass | 1.6 whole, its part 3 through the real handler |
| `smoke:gate` | pscale-beach | 62, all pass | 1.3 at the handler: stranger, pass, beyond, invitation, join |
| `smoke:guard` | pscale-beach | 27, all pass | 1.3: the people-keeping guard |
| `smoke:handle-bound` | pscale-beach | 22, all pass | 1.11, 5: a handle's blocks under its passport's key |
| `smoke:caps` | pscale-beach | 41 over two runs, all pass | 1.11, 5: wrong keys counted where the deploy counts them |
| `smoke:index-check` | pscale-beach | 51, all pass | 1.33 the index that says what is beyond |
| `smoke:seal` | pscale-beach | 60, all pass | 1.46 the browser's seal, on a page with no CSP |
| `smoke:voice` | pscale-beach | 44, all pass | 4.4 the voice |
| `smoke:voice-gate` | pscale-beach | 85, all pass | 1.3 and 1.35 at the voice |
| `smoke:button` | pscale-beach | 113 pass, then stopped | 4.4 the frame; its cross-site section and its second run did not run here, because macOS has no 127.0.0.2 on loopback; it has no seal case |
| `check-string.mjs` | the site | 28, all pass | the String's `/api/string` door, mocked |

## 3. The table in brief

`tests:doors` at the lab holds one entry per cell, in spans of nine, one span per part; each span's zero slot (10, 20 … 70) is the part's result, so the block read as a disc at pscale 1 is the seven results and at pscale 0 every cell. The entry numbers below are its addresses.

| part | handler | router | mirror | pages | frame | voice | pocket | across doors |
|---|---|---|---|---|---|---|---|---|
| 1.1 a name and a key | P 1 | P 2 | P 3 | P, its count U 4 | P 5 | P 6 | N 7 | U 8 (the latch's words) · P 9 (a character at a walled table) |
| 1.2 writing as yourself | G 11 | P 12 · U 18 (`pscale_genus`) | G 13 | G 14 | G 15 | G 16 | N 17 | P 19 (rooms, reflection) |
| 1.3 behind a wall | P 21 | P 22 | R 23 | R 24 | R 25 | P 26 | — 27 | P, G, R 28 (the invitation) · U 29 (`pscale_play`) |
| 1.4 sealing a line | P 31 | P 32 · U 33 (group, grain) | P 34 | P 35 | U 36 | G 37 | (75) | P 38 (a colour both ways) · R, U 39 (a self line's salt) |
| 1.5 the vault | P 41 | P 42 | — 43 | G 44 | P 45 | P 46 | N 47 | P 48 (the gallery's vault at the router) · P 49 (the two modules) |
| 1.6 an AI without the key | — 51 | P 52 | — 53 | — 54 | — 55 | — 56 | N 57 | P, NOT YET 58 (signed at a members' beach) · G 59 (the letter) |
| 1.7 when a key leaks | P 61 (the copies) | with the handler, 62 to 68 | N 69 | N 69 | N 69 | N 69 | N 69 | G 62 · P 63, 64, 65 · P, U 66 · P 67, 68 · N 69 |
| the door's own line | — | U 71 | P 72 | P, its count U 73 | U 74 | P (in 74) | N 75 | — |

P passed · R refused as the schematic says · G gap confirmed (a NOT YET as written) · U untrue, written again · — not applicable · N not walked.

## 4. Across doors

The record's §5.2 named six cells nothing tested. Each was walked.

1. **A colour, the voice and the router** (38). At the lab a keeper founded `colour:probe-doors-50` through the router; a holder said a line in it at the voice the way the String says one (`string.html` `sayLine`); the keeper read it at the router, which then wore the turn; the keeper said a line through the router and the voice opened it, after a reload too; a third hand read one grey line naming the colour and turn at both doors; a letter from the third hand was read by both holders and not by its writer. **PASSED.** Found beside it: a keeper's coloured `bsp()` write into its own latched mirror is refused unless `enc_secret` is passed beside `secret`, the refusal blaming the key's spelling (§8, router 5).
2. **A self line across the salt divide** (39, 48). A vault founded at the lab through `vault.js` under one phrase, salted with the lab's origin, opened at the router under the same address: **PASSED**. A self line sealed with the handle as its salt, as the frame seals one, read at the router by the beach's address as one grey line: **REFUSED AS THE SCHEMATIC SAYS**; but read by a bare handle at the router's own beach it opened, because the router salts with the `agent_id` as given: 1.41 was **UNTRUE** there and is written again.
3. **A signed connection at a members' beach** (58, 59). A local router whose own beach is open signed a member in by fingerprint; with no key in any call, the fingerprinted key proved the pass at a local members' beach and founded a colour there with `new_lock: "vault"`, and no reply carried the key: **PASSED**. A coloured room say from the signed session landed as a letter until a `bsp()` read with `enc_secret: "vault"` put the colour on (gap 16): **GAP CONFIRMED**. And two things the map did not say: a router whose own beach is a members' beach signs nobody in, its page answering "The beach did not answer" to a 401; and a fingerprint is minted only for a passport standing on the router's own beach, so at the hosted router a member who stands only at SALT cannot sign in at all.
4. **The invitation across doors** (28, 21). A member minted a named and an unnamed invitation at the String's voice; the named one, taken at the String's join, founded the passport, said the made key once and earned a pass: **PASSED**. Carried to the router, it found no field to take it and was refused: **REFUSED AS THE SCHEMATIC SAYS**, but the refusal tells the newcomer's AI to prove a passport it does not have, and doing so returns the same line, so the record's "say so plainly to the newcomer's AI" is not met. The unnamed link, taken twice, founded two passports, and the beach kept no trace of the token or either use: **GAP CONFIRMED** (1.349), by curl at the handler and at the String's join alike.
5. **A table behind a wall** (9, 29, 23). `copy-world.mjs` put a seven-block world behind a local gate; a newcomer character joined at the voice and founded its blocks under its own key, another key refused: **PASSED**. But `pscale_play` told every hand at the table, a member with its key included, that the surface is EMPTY and handed it the world-authoring passage, because play reads the beach's index with no pass (`src/tools/pool.ts:880`, `play.ts:310`) while `bsp()` in the same session lists all nine blocks: the schematic record's §3, "reached through the router (which proves a pass)", was **UNTRUE** for play, and 1.35 is written again. The mirror is refused, and reads the wall as an empty table.
6. **The leak protocol, rehearsed** (62 to 69). One script at the lab, which runs again: a probe handle across ten blocks with a lock map, a self line and a group line sealed, the key leaked into a line by a direct post (the router refused the same write); then keep, scrub, roll, re-seal, tell and read back. Every step **PASSED** but one: the old key refused at all seventy-five latched positions after, the one latch kept out of the map found by probing every position, and a block founded meanwhile under the old key found by the index's born map and re-latched. The group's re-seal was **UNTRUE** as drawn (1.72): the partner read on throughout, only the republisher was stranded until a partner re-wrapped the ring, and the re-wrap sealed nothing again, so the leaked key with an old copy of the ring opened every line until a member was left out and the key turned.

## 5. What passed, and what did not

**The parts' states**, each at its 9 on the spine:

- **1.1 a name and a key — LIVE.** The latch's five cases and a hash in place of the key at the handler; a passport and a refused wrong key through the router; the mirror's and the pages' plain copies; the unlock window's wrapped key; the voice's made key; a character founding under its key at a walled table.
- **1.2 writing as yourself — NOT YET.** A stranger refused and a room open as drawn; the router's guard refuses a key in the words at its block and room tools but not at `pscale_genus`; at the handler, the mirror, the pages, the frame and the voice a write carrying its own key lands.
- **1.3 behind a wall — NOT YET.** The wall holds at the handler, the router's block tools and the voice; an unnamed link founds many passports; the router's refusal does not tell a newcomer the way in; `pscale_play` is blind behind a wall.
- **1.4 sealing a line — NOT YET.** A colour crosses doors both ways; the router seals group and grain only for members on the apex; the frame derives no key; the one word is the latch.
- **1.5 the vault — NOT YET.** The router's vault and the gallery's open under the address they were sealed with; the gallery still takes one phrase.
- **1.6 an AI without the key — LIVE** where the router's own beach is open; walked on a local router, the hosted sign-in not walked.
- **1.7 when a key leaks — LIVE** for what a holder can do; a group's key turns only when a member is left out.

**The sixteen lines written again**, the standing text kept whole at `archive:spine:security-schematic:2026-11-05-2`:

| line | what it said | what is true |
|---|---|---|
| 1.11 the latch, and 5 | a handle's block "is founded only under that handle's passport key"; nothing on a position's latch beneath an open root | latched only under the passport's key, founded open by anyone (the handler's own refusal says so); a whole-block write and a wipe answer to the root's latch alone |
| 1.12, 4.3 | the pages keep the key plain "under a dozen names" | eighteen names in the code, five of them on no list; the voice's wrapped copies usable by the page's own script |
| 1.2, 1.21, 4.1, 5 | the router "guards every write" | every tool but `pscale_genus` (and the flow's publisher), whose writes go out through `genus.ts`'s own post |
| 1.23 | "every answer through the router ends with" the reflection | only when someone else was there; a refused write shown as a write |
| 1.32 | the router carries a pass "for the session" | for the session at that address; a `/w/` table is an address of its own |
| 1.35, 4.1 | "your own AI through the router, every tool, proving a pass" | its block and room tools; `pscale_play` reads a walled table as empty; its refusal sends a newcomer round a loop |
| 1.41 | "a self line opens only at the kind of door that sealed it" | except at the router's own beach, where a bare handle is the salt |
| 1.43 | colours worn "in the voice and the frame for the tab" | in the voice; the frame derives no key and wears none |
| 1.46, 4.1 | the router "in all four modes" | self and colour at any beach; grain and group only for members on the apex |
| 1.46, 4.4 | "the frame seals and opens all four modes" | it seals a letter only and opens nothing: its CSP refuses the WebAssembly the seal is built on |
| 1.62 | a fingerprint for "a handle whose passport stands" | whose passport stands on the router's own beach, the apex; a router on a members' beach signs nobody in |
| 1.72 | a republished keypair leaves lines "unopenable to its partners" | true of grain; in a group the partners read on and a re-wrap re-seals nothing |

The four sub-part NOT YETs (1.219, 1.349, 1.429, 1.559) and the doors' 4.29 and 4.59 now say what the walk saw, with their entries' numbers; the root's 9 names this walk.

**Four corrections from lane systemic.1**, found by the security page's builder reading the plain page's reader against the spine and sent to this lane, which held the spine, at 14:16Z. All four stand, under the same lock, the archive's underscore naming them:

1. **Landed.** 4.2 and 4.3 cite `[lighthouse 8]` (the doors elsewhere) where they cited `[spine:beach-schematic 1.2]` and `1.1`. The page's reader drew any `spine:<x>-schematic` bracket as a callout, so it showed those two doors as schematics of their own.
2. **Landed.** 1.3 cites `detail 7`, so the ground is cited by a part, as `function:schematic` 2 asks; before this no part cited it.
3. **Landed.** 1.6's door is `https://happyseaurchin.com/connect`. The connector's address answers a browser with a 401 and raw JSON, checked 14:17Z.
4. **Already landed in the walk's own pass.** 1.12 reads "under eighteen names".

## 6. What needs David's hands, and what needs Matthew

- **David's phone's connector at a members' beach.** Sign in at `bsp.hermitcrab.me/mcp/v1/me` on the phone and read a SALT block through it. The walk predicts it works only if David's SALT name also stands as a passport on the apex (1.62; §8 router 6); this is the one cell that proves or refutes it with a real member.
- **A real invitation at SALT.** A named invitation minted at the String for a real newcomer, taken on another device. The walk proved the mechanism on a local members' beach; SALT's own deploy (its operator clone is not on this Mac) is the cell.
- **keel's read of a coloured line on the String.** The first colour, `colour:keel-weft`, read on the String's page by keel as a holder: the voice's open against a real ring, at a live deploy.
- **The operator's hand**: the copies (the door's thirty-day day-copies, the nightly images, the private mirror), which no probe reaches; bringing the lab's button to the package's main (#107), as `pscale-beach-idiot` #8 brought its handler; the String's `/salt` door and the vault's cookies on the live site.
- **Matthew**: the pocket's cells, answered from his nine tests case for case (entries 7, 17, 27, 47, 57, 75); and the C-R app's adoption, with the three cautions of §1.

## 7. What a FULL battery would add

- **The sentinel.** `src/door-test.json` and `door-test-materials/`, the 68 cells of `tests:doors` as case ids, `npm run smoke:doors` in the CI gate for what runs offline; the record's §5.4 as written.
- **The cases that would have caught today's untrue lines**, none of which any smoke holds: the frame sealing under its own CSP (smoke:seal runs on a page with none, smoke:button has no seal case); a group or grain at a beach other than the apex (smoke:group-live runs only at the apex); a coloured write into a latched block (smoke:colour writes only into open ones); `pscale_play` at a walled table; `pscale_genus` against the guard; a re-wrap after a republish; a wipe of a block latched only at a position.
- **The two walks** of the record's §5.3: the person at each door (this walk took the screenshots; a full battery grades them), and a fresh small mind at each door, which spends model calls and runs only at David's word.
- **The live doors** this walk could not reach: `/api/*` under a Vercel dev server, the hosted router's sign-in with a probe that may stand on the apex, and SALT's own deploy.
- FULL still waits, as David chose, on the derived latch and the handler's guard.

## 8. Found and left where it stands: fixes named for David's word

None is built here. Each names its door's code at the line the walk read it.

**The router (this repository)**
1. `pscale_play` reads the beach's index with no pass (`src/tools/pool.ts:880` `beachIndex`, a plain fetch; read at `play.ts:310`, 501, 539, the cast at `pool.ts:979`, 1224 and `tiers.ts`), so behind a wall every window says EMPTY. The fix sends the session's pass on that read, as the wire's door hooks already do for `bsp()`.
2. Group and grain read members' published halves at the router's own beach by bare handle (`src/db.ts:736–784`; `tools/bsp.ts:499`, 564), while colours read them at the colour's beach (`bsp.ts:691`) and the `members` schema promises "at this beach" (`bsp.ts:887`).
3. `pscale_genus` writes through `genus.ts`'s own post (`src/genus.ts:1337–1380`; `tools/genus.ts:273–291`), and the flow's publisher too (`pool.ts:1961`, `stream.ts:777`), never meeting `refuseKeyInPayload` (`db.ts:535`).
4. The members-only line (`src/pass.ts:68–72`) does not name the invitation or the String to a newcomer, and every refusal comes back as an ordinary result (`isError=false`).
5. A coloured `bsp()` write withholds `secret` (`tools/bsp.ts:1671`), so a keeper's line into its own latched mirror is refused unless `enc_secret` rides beside it.
6. Sign-in reads the ring and the passport at the router's own beach outside any door (`src/signin.ts:139–167`, `index.ts:105`): a gated default signs nobody in, and a member standing only at a members' beach cannot sign in at the hosted router.
7. A group founded on a fresh block is refused by the beach's floor rule, the membership write carrying no `_` (`tools/bsp.ts:1656`).
8. `src/db.ts:30–31` says the wire is vendored byte-identical into xstream; it has not been since #571, and `WIRE_VERSION` was not bumped.
9. Smaller: the key refusal's recovery hint names the apex at any beach (`db.ts:461–466`); the room tool says "rejected by beach" for its own refusal (`pool.ts:2324`); the reflection names a refused write as written (`tools/bsp.ts:1117`); a trailing slash on `agent_id` derives another salt with nothing said.

**The beach package (pscale-beach)**
10. The frame's CSP, `script-src 'self'` (`button/frame.html:9`), lacks `'wasm-unsafe-eval'`, so the frame derives no key; it then tells the person "The beach refused that reading" (`frame.js:562`), and founds the mirror before a failed seal (`frame.js:554–559`).
11. A whole-block write and a wipe answer to the root's latch alone (`api/pscale-beach.js:354–356`, 2253, 2575–2602): a block latched only at positions under an open root can be replaced or wiped by anyone. Whether that is the design (the README says it for `settings`) or a hole is David's to rule.
12. The voice cannot found a passport at an open beach: `wear` answers "no passport", and `join` needs an invitation only a gated beach mints.
13. Behind the wall, a named invitation tried on another name and any invitation on a standing name get the same `members_only` words.
14. `copy-world.mjs` copies a world's lighthouse verbatim, so a walled copy still points players at the open original.
15. Owed already to their records: the handler's guard (1.219), the once-spent invitation (1.349), the derived latch (1.429).

**The mirror (xstream-bsp)**
16. A members' beach reads as "quiet — say something": `bsp-client.ts:189–191` folds a 401 into no block.
17. Stepping in latches `lists:<handle>` and founds `beach-visits:<handle>` on the apex under the passphrase with no act (`Mirror.tsx:713–735`, 2136–2160).
18. Its card says "the key never leaves this browser" (`Mirror.tsx:4545–4546`) while the passphrase goes to four hosts, and both its cards tick "remember" by default (4332, 4504).

**The site (happyseaurchin)**
19. At a members' beach /page says "Nobody by that name here yet … no passport, no now, no posts"; no page but the String sends a pass.
20. Eighteen storage names hold a latch or key in plain text; five are on no list: `shell-latch:` (`self.html:623`), `next-keeper:` (`next.html:1201`), `morning-keeper:` (`walk.html:1196`), `invite-keeper:` (`invite.html:508`), `mindflow-api-key`.
21. The gallery's vault always stands at the apex (`gallery.html:693`, 713–714), and the typed key is kept plain by default (653).
22. /page, the group page and the models page hand a character's key to the waker in plain JSON (`page.html:1111–1112`, `group.html:751–752`, `models.html:787–788`).
23. `beach-security.html` lines 172, 207 and 208 still stand.
24. Two faults in the schematic page's reader (`schematic.html`), named by lane systemic.1 and its to fix in the pages' PR: the live line's position pattern takes one digit, so "spine:thread 17" reads as the registry's latest line; and a callout is recognised with a position after it.

## 9. Probes wiped, and what was left

- **The lab**: every probe founded there by the walkers, handles `probe-doors-1` to `probe-doors-79` with their blocks and the `probe:doors-*` blocks, was wiped by DELETE with its key; the lab's index at 14:04Z lists no probe name. What stands there from this walk is `tests:doors`, the table.
- **The door's day-copies**: the leak rehearsal wiped five open-rooted blocks (`probe:doors-70-3`, `-4`, `-7`, `-9` and `pool:probe-doors-72`), of which the handler keeps the day's first version for thirty days, reachable only by the operator; none holds a key in the clear (checked by the rehearsal). Every other walker latched an open probe before wiping it, so the door kept nothing of theirs.
- **The apex**: no probe was written; the live mirror's and the pages' writes there were fenced in the browser and checked absent after. This walk wrote only weft's own blocks there and, under the shared project lock, the spine's lines and their archive.
- **SALT**: read only, as a stranger.
- **Local beaches**: every folder deleted and every process stopped; the walkers' ports checked free.
- **Keys**: the probes' throwaway keys stand only in the session's scratchpad; no key is in the table, the spine, this file or the notes.

## 10. Provenance

Walked 5 November 2026 by weft (Claude Code on the Mac, Opus 5.5 at max effort, lane systemic.2) at David's word at thread:weft 17.11, with eight Opus 5.5 walkers working from one brief and each writing its cells to a file this lane consolidated; this lane alone wrote the beach and this record. Read for it: `proposals/2026-11-05-the-security-schematic.md` whole; the doors' map of lane systemic.1; `spine:security-schematic` and `function:security-schematic`; `function:schematic` 2 and 7; block-conventions 3.5; `spine:pocket-beach` 1.1112, 5.4 and 5.7; `orientation:weft` 7. The code read and walked: bsp-mcp-server at 7c5d5b4, pscale-beach at 4c2c602, happyseaurchin at 97dbef1, xstream-bsp at 6e30102. The account is at watch:weft 848, the knot at thread:weft 17.111.
