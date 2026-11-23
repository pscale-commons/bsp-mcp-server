# Anyone lists a proposal

**Date**: 23 November 2026 · **Status**: the law amended and the pages merged at David's word the same day (happyseaurchin-home #772, squash 60e2731); the battery's LISTED case and this record are in a bsp-mcp PR, open for David · **Lanes**: arcade-credits.1 (the law, the pages, the daily check), then anyone-lists.1 (the battery and this record), weft (Claude Code, cloud sessions from the Claude app) · **Companions**: `function:proposal` 7, 8 and 9, `archive:function:proposal:2026-11-23`, `wake:weft` 6.31, `thread:138`, happyseaurchin-home #772 (`listed.js`), `proposal-test` 1.7.

## 1. The ask

weft had made Experience Points and run the battery over it. Then it waited on David's word to add its line to the keeper's list, `proposals`, which stands under the shared project lock. David, 23 November:

> "How can anyone create and add proposals if you can't even do so?!?! We need to check the process to ensure it is open."

Then:

> "Go with the non-permission method; the listing on proposals page should go through the check and if it doesn't match, send message to pool of proposal"

And, once the pages were built:

> "merge 772"

## 2. What changed in the law

`function:proposal` 7 and 8 were amended at his word, and 9 records it. The text before stands at `archive:function:proposal:2026-11-23`.

- **7, its seventh act.** A maker lists a proposal with nobody's permission. Once the battery passes, they append one line, `<name> — what it is · its page`, to their own block, `proposed:<handle>`, under their own key. The pages show it, marked with the maker's handle, once its blocks pass the check a page can make. While they don't, the pages name its first fault. weft's daily check runs the battery over every maker's list and says what to mend in the proposal's own room, `pool:<name>`, once for each change. A maker may also host a crafted page at an address of their own and name it at the law's 6.
- **8, the list.** The list is two kinds of block read as one: the keeper's, `proposals`, under the shared project lock, and each maker's own, `proposed:<handle>`. Every page that lists proposals reads them through one module, `listed.js`: the keeper's list first, then each maker's, the earliest made first. A proposal is shown once, where it was first listed.
- The keeper's list and the corkboard's cards stay under the shared project lock. A maker's own line is drawn on the board from their list, with no card in that block.

## 3. The pages: happyseaurchin-home #772

`listed.js` (`https://happyseaurchin.com/listed.js`) reads every maker's list through the site's `/api/mirrors?family=proposed`. Where that fails, it reads the beach's index and takes each `proposed:<handle>` with exactly one colon. A maker's line is shown once the family passes `fault()`, the battery's first faults as a page can read them from the blocks.

- **`/proposal`** adds the passing lines to the shelf after the keeper's, each marked "listed by <handle>". It lists the rest under "Waiting on the check", each with its first fault.
- **`/corkboard`** draws the passing lines as cards after the keeper's.

Merged as squash 60e2731.

## 4. The daily check

`wake:weft` 6.31 runs once a day in weft's scheduled wake:

1. It reads every maker's list.
2. For each line whose name isn't on the keeper's list, it runs the battery.
3. Where the family isn't well formed, it appends one line to the proposal's room, `pool:<name>`, naming each FAULT. It does this once for each change in that set. With no room standing, it uses the maker's own room, `pool:<handle>`.

A well-formed listing is told nothing. Until the battery read the makers' lists, 6.31 left the battery's LISTED line out (`thread:138.1`).

## 5. The battery reads the makers' lists

The LISTED case in `proposal-test-materials/proposal_form.py` read the keeper's list alone. So it told every proposal a maker had listed `not on the list yet; list it once this passes`. It now reads the list as `listed.js` does:

- **Where it looks.** It finds the makers' lists in the beach's index: each `proposed:<handle>` with exactly one colon. It reads each list's lines at its floor, supernest-aware (`listed()`, the rule of `lines()`), and each line by the pattern of `parse()`. The keeper's list comes first, then each maker's, the earliest born first. A line counts where it is first listed.
- **Found.** A NOTE says which list holds the line: `listed on the keeper's list`, or `listed in <handle>'s own list; happyseaurchin.com/proposal shows it once its blocks pass the page's check, naming its first fault there until then (function:proposal 8)`.
- **Not found.** `not on the list yet; list it in your own proposed:<handle> once this passes (function:proposal 7)`.
- **A broken line.** A line that opens with the name but that no page reads is still a FAULT, in whichever list it stands. A line that reads as another name's (`<name>-more — …`) belongs to that name, and no longer counts against `<name>`.
- **The rest of the battery** reads the keeper's line alone, as `/proposal/<name>` does (`proposal.html`). That decides whether a family that names another kind at its law's 7 is drawn at all, and whether an off-site page gets its Snazzy button there.
- **`--all`** still sweeps the keeper's list. The daily check reads the makers' lists itself.

**Tests.**
- `run-proposal-tests.py` checks harbour-bell listed only in `proposed:rook`, both from the fixture and through the live reader with its reads stubbed. The stub serves the index's blocks and birth stamps from the fixture, so nothing is fetched and nothing is written. It checks that:
  - the earliest-born list wins over the alphabetically first;
  - the keeper's list wins over any maker's;
  - `proposed:rook:drafts`, with a second colon, is no maker's list.
- `mutation.py` plants two faults in a maker's list: a line no page reads (FAULT) and a line with no page (WARN).
- 94 planted faults, all caught. Against the old checker, the new checks fail.

**The sentinel.** `src/proposal-test.json` 1 and 1.7 now describe the two lists, 7 states 94, and 9.2 says `--all` reads the keeper's list. These changes are under `src/`, so merging redeploys the router and ends every live MCP session. Merge it at a quiet moment.

## 6. Where the page's check and the battery disagree

`listed.js`'s `fault()` is meant to be the battery's first faults:

- the name;
- the spine and the law standing;
- the root not nested, and its title before ' — ';
- a first step at 1;
- the law's 1 `mode: document` and its 7 `phase:`;
- each decision at a step's 8 and its side-rooms' 8;
- the room, `pool:<name>`.

It was ported to Python and checked against the JavaScript itself, run in a bare node context: identical on all 65 families on the keeper's list. Each family was then read both ways, as if its maker alone had listed it, which is the case the check is for. `listed.js` passes 34. The battery's matching cases pass 48.

**Held back by the page, passed by the battery: 19 families, 14 of them well formed outright.** Their maker would see "Waiting on the check" on `/proposal`. The daily check tells only a family that is not well formed, so it would tell their room nothing.

| What `listed.js` asks | Families | What the law and the battery ask |
|---|---|---|
| ` Asked of ` in every decision | passing-it-on, threads, y-ray, pscale-native, happening, pocket-beach, game-ecology, mistake-proofing, salt-app; also tronic-glass, visual-consistency, coloured-stigmergy | `function:proposal` 3 asks that the card "names who is asked". The battery's WHO takes the last sentence: passing-it-on's is "David, Matthew and James; anyone may answer." The battery's own clean fixture, harbour-bell, says "David and rook." |
| Every step's 8 a decision | the-string (FOLDED), ai-inoculation and abc-state (SAY) | The battery WARNs (OPENS): the standard page draws no card there. |
| A root title with no lower-case letter | web-llm ("The beach for WebLLM"), o-page-unit ("The o‑page unit"), leros-phase-two and leros-phase-three ("LEROs ON THE COMMONS, …") | The battery's TITLE, and the page's own `split()`, take any title before ' — '. |

**Shown by the page, failed by the battery: 5 families.** Each names another kind at the law's 7: waterline and ai-churn (explainer), the-ai-wave (overview), experience-first (experience), health-check (recipe). `listed.js` passes `phase:` followed by any word. Off the keeper's list, `/proposal/<name>` says such a family is not a proposal, because `proposal.html` counts only the keeper's list as listed. So the battery FAULTs PHASE. A maker who listed an explainer would see it on `/proposal` and find its own page refusing it. That gap is in the pages, not the battery.

**Latent.** None of these is on today's list; each was tried on the fixture.
- The page passes, the battery fails:
  - a word with a digit (`5TH PLACE`);
  - the form's words without NOT YET (`GO or CHANGE.`);
  - words of its own with no closing period.
- The page fails, the battery passes:
  - a gloss on the last of the form's words;
  - `DECIDE:` with a colon;
  - `Phase:` with a capital;
  - the phase said on another line of the law;
  - a room named in the law, `pool:<another>`, with no `pool:<name>`.

**Beyond the first faults, as designed.** determinacy and iris pass the page and fail the battery. determinacy's fault is the battery's own lag. PLACED calls its decision at 4.8 unreadable, but since 21 November `function:proposal` 3 has the standard view draw a decision in a room around the proposal; determinacy 4.8 and leros-phase-three 5.8 were the first. The battery was not reworded here.

## 7. Owed

- `function:proposal` 9 says this record is owed, with the battery's LISTED check. Once this merges, that sentence should point here. 9 stands under the shared project lock, so it changes at David's word.
- `wake:weft` 6.31's caveat, that LISTED is left out, can go once this is on main, since the daily check fetches the battery from there.
- How the page's check and the battery meet (section 6) is David's to choose:
  - `listed.js` follows the law and the battery;
  - or the law and the battery take ` Asked of ` and capital-letter titles;
  - or the two stay apart.
