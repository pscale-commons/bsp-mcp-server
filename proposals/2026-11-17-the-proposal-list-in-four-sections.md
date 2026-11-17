# The proposal list in four sections, and the others beside it

**Date**: 17 November 2026
**Lane**: proposals-tidy.2, weft (Claude Code on David's Mac, a side session of lero-tidy.1)
**Status**: decided by David. On 16 November he named the families to close and the sections he wanted ("if we split them up as not touched (the first lot), with some responses and ready to be build (the second lot), and then the third is completed", and "can you have a category for 'others' for now and show them together"). On 17 November, after weft's check of the families he named, he said: "please go ahead and ensure it has been updated with the info i have put in what you have done". This file records the change to `function:proposal` 6, which is a law-class change. The page is happyseaurchin-home #723.

## The ask

The list at happyseaurchin.com/proposal had four sections: New, Being decided, Being built and Complete. Families that were built still read as open. Families that propose nothing to build, inquiries, walks, recipes and explainers, stood among the proposals or were left off the list. David wanted three sections for proposals (not touched, answered, complete) and one for the others.

## What changes

**The law, `function:proposal` 6.** Its standing text is at `archive:function:proposal:2026-11-17`, under the shared project lock. It now says three things:

- Any word after `phase:` other than the form's own (proposal, project, complete, set aside, inquiry) names another kind laid out on the form: a walk, a recipe, an explainer. Listed with the proposals, it stands among the others. Its page names it by that word, gives the rest of its 7 as its own account, and calls its decisions points.
- An inquiry stands among the others too, no longer in the proposals' sections by its answers.
- The list draws each family in one of four sections:
  - not touched, a proposal nobody has answered;
  - answered, a proposal with answers in, or a project, ready to build or being built;
  - complete, or set aside;
  - others, every family whose phase names another kind, its card saying which.

**The phase lines, each one write under the shared project lock, at David's word:**

- Complete: y-ray, weft-bee, loom, game-arcade, tronic-glass, threads, coloured-stigmergy, happening, schematics, salt-app, code-as-blocks and who-answers. Each line says what was built and where, and which thread stays open (loom 121, tronic-glass 119, threads 33, coloured-stigmergy 15, schematics 125, salt-app 16).
- Set aside: time-nesting and two-spines, whose work carried on in the threads proposal and in LEROs phase two. Their spines are at `archive:spine:time-nesting:2026-11-17` and `archive:spine:two-spines:2026-11-17`, as `function:document` 5 asks. Matthew answered time-nesting's meeting decision on the morning of 17 November ("MEETING — Yes. And let's cover other things too."). Its phase line says that answer stands for that meeting.
- Explainer: waterline (David: "also an explainer i think").
- Unchanged: the-string, already complete at David's word on 16 November (lane verso.3), and middle-point, already a project with phase one over (verso.3). shell-indexes stays a project, because its checker merged but nobody keeps an index yet.

**The list, `proposals`, under the shared project lock:**

- Its root now says the list holds the proposals and, beside them, the families laid out on the same form that propose nothing to build, drawn in four sections.
- Line 36, mind-meld, is no longer bracketed as withdrawn. It is a walk, listed among the others.
- Line 57 adds full-bandwidth (a walk), and line 58 adds make-a-meeting-page (a recipe, the first of its kind).
- The summary at 40 says mind-meld is drawn among the others.

**Others' families, one line each in their rooms:**

- `pool:keel` 143 asks keel to turn tranche to `phase: explainer` (David: "it's more an explainer than a proposal") and talk-index to `phase: set aside`, since the met way and follow-ups carry most of it. Both are under keel's latch.
- `pool:Phenomemental` 246 asks Matthew to close pocket-beach, or to keep it open while reaching the beach is still to come.

**The page (happyseaurchin-home #723):**

- `proposal.html` draws the four sections and reads any phase word, as above. Another kind is drawn at `/proposal/<name>` only once it is listed, so an unlisted walk still reads as no proposal.
- `/families` is Families on the Beach, a snapshot of every family with a law and a spine, at David's word: "the page on families can be added with its own url, why not, and i can tidy it later".

**Here:**

- `proposal-test-materials/proposal_form.py` reads any phase word as the page does. Its READERS line follows the page's new `lawOf`. A PHASE fault now stands where the 7 names no kind, where nothing says it and the family is unlisted, or where another kind is unlisted.
- `mutation.py` plants both faults, 92 in all. The sentinel `proposal-test` 5.1 and 7 say so.
- `scripts/families` holds the families page's generator. `gather.py` reads the beach with the battery's own readers, and `build.py` writes the page into happyseaurchin-home.
- Merging this PR changes `src/proposal-test.json`, so the router redeploys and every live MCP session ends.

## The proof

- `python3 proposal-test-materials/run-proposal-tests.py`: all passed, 92 of 92 planted faults caught, and the block and the code agree.
- The page, served locally against the live beach with `/api/mirrors` taken from the live site:
  - Not touched 7, Answered 22, Complete 17, Others 7, and no card unread.
  - `/proposal/waterline` reads An explainer, and `/proposal/mind-meld` reads A walk, both calling their decisions points.
  - `/proposal/y-ray` reads Complete, with its trail.
  - No console errors.

## What waits

- David's merge of happyseaurchin-home #723 (the sections) and of this PR.
- keel's two lines and Matthew's one.
- y-ray's next phase is David's to open: an arrangement that holds any o-page-unit, not only the list's proposals. On 16 November he said: "I definitely want some basic way to 'build' a block with references to different o-page-units". Weft's advice was a block, not a thread, and that block is `arrangement:<handle>`.
- presentation (`phase: proposal`, under David's own key) is on no list. It was left as it stands.
