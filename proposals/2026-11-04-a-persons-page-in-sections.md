# A person's page in sections

**Date**: 4 November 2026 · **Status**: built at David's word, step 2 of 3; happyseaurchin-home #615 and this record merged on 5 November, by David · **Lane**: proposal-views, in mistake-proofing.1's session, weft (Claude Code, Opus 5.5, on the Mac) · **Companions**: `function:arrangement` 5 and 9, `archive:function:arrangement:2026-11-04`, happyseaurchin-home #615, `proposals/2026-11-04-the-list-in-sections.md` (step 1), `watch:weft` 832.

## 1. The ask

David, 4 November, of the personal page:

> "And on the personalised page, can we have a more graphical version where I can drag and drop cards into other cards to show the 'nesting', rather than a list? It would be nice to have a more engaging view for the personal arrangement of proposals. Perhaps in the same multi-section listing (but sorted in terms of whether the user hasn't added content (top), supplied content (middle) and completed (bottom), versus the embedded listed arrangement versus the more graphical card-nesting?"

The scope (`watch:weft` 832) made this two steps: step 2, the sections and a switch; step 3, the cards that nest. David answered "Yes, start step 2".

## 2. What the page does

`/proposals/<handle>` now opens with a switch between two views. The reader's choice is kept on their device.

**Sections** is the default. It shows every proposal on the list as `/proposal` draws them, narrow cards with the quipu beneath, sorted by what that person has answered in their own mirrors:

| Section | Holds | David, 4 November |
|---|---|---|
| Not answered yet | none of its decisions answered | 14 |
| Partly answered | some answered | 4 |
| Nothing left to answer | every decision answered, none asked, or the proposal complete | 12 |

The scope had counted 15 and 11. middle-point moved down during the build, when David answered all six of its decisions. The page reads them live.

Each card says how far that person has got, for example "5 of 6 answered".

**List** is the arrangement as it stood: the nested list, dragged by its grips.

**The address:**
- `#list` or `#sections` opens that view.
- `/proposal`'s button now says "Your proposals" for a reader the page knows. For anyone else it says "Arrange your own" and opens David's List view, where dragging makes an arrangement theirs.

**Whose answers:** the page's person is the handle in its address. When the List panel turns to someone else's arrangement, the address follows it, and so do the sections.

**Only answers in the person's own mirror count.** David decided happening's four decisions in conversation on 27 October, and weft recorded them in weft's mirror. So happening sits in David's top section until he answers in his own.

## 3. One shelf

In step 1, the cards, sections and counts of `/proposal` were the index's own code. They are now one shelf in `proposal.html` that both pages draw, each page bringing its own sections.
- **`/proposal`** reads nothing new.
- **A person's page** reads what `/proposal` reads, and only once Sections is shown.

## 4. The law

`function:arrangement` 5 said the person's page draws the arrangement with "no shelf beneath it". It now names both views, and the button's new words.

9 records the amendment. The standing text is at `archive:function:arrangement:2026-11-04`.

## 5. Next

Step 3 is Cards: the arrangement drawn as cards inside cards, dragged into one another. It becomes a third view on the same switch, saved to the same block under the same key, with the same nine to a level.
