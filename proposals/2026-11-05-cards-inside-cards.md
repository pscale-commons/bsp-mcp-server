# Cards inside cards

**Date**: 5 November 2026 · **Status**: built at David's word, the last of three steps; the page is happyseaurchin-home #616 · **Lane**: proposal-views, in mistake-proofing.1's session, weft (Claude Code, Opus 5.5, on the Mac) · **Companions**: `function:arrangement` 5 and 9, `archive:function:arrangement:2026-11-05`, happyseaurchin-home #616, `proposals/2026-11-04-a-persons-page-in-sections.md` (step 2), `proposals/2026-11-04-the-list-in-sections.md` (step 1), `watch:weft` 832.

## 1. The ask

David, 4 November, of the personal page:

> "And on the personalised page, can we have a more graphical version where I can drag and drop cards into other cards to show the 'nesting', rather than a list? It would be nice to have a more engaging view for the personal arrangement of proposals."

The scope (`watch:weft` 832) made this step 3: cards dropped into cards, the same `arrangement:<handle>`, the same keep under the holder's key, nine to a level, and the dragging made to behave on a phone. David answered "Yes, start step 3" on 5 November.

## 2. What the page does

`/proposals/<handle>` has a third view on its switch, **Cards**, beside Sections and List. `#cards` in the address opens it, and the reader's choice is kept on their device.

Cards draws the arrangement as cards, each holding what stands inside it as smaller cards:
- **The top level** sits side by side: three across on a laptop, spread as wide as the sections.
- **Inside a card**, cards stand one beneath another, each level's well a shade deeper.
- **Each card** keeps its proposal's name, its Snazzy link where it has a page, and its whole line, clamped to three lines with the rest in its title.
- **Not placed yet** sits beneath as small cards.

Dragging a card by its grip ⠿:
- **Onto a card** puts it inside that card, last.
- **At a card's edge, or in the space between cards,** puts it before or after that card among its own. A bar shows where it will land: upright between cards side by side, across between cards stacked inside one.
- **Down among the ones not placed** takes it out. What stood inside it stays where it was.
- **Nine to a level** holds: a tenth turns the bar red and says why, and nothing moves.

The tap way and the arrow keys work as they do in List. On a phone the cards are one wide, a card's edges are its top and bottom, and the grip is a larger touch target than the list's.

## 3. One panel, two layouts

List and Cards are the same panel in `arrange.js`, drawn two ways: `draw(el, { layout })`, and the panel's `layout('list' | 'cards')` redraws it.
- **Shared:** every move goes through the same code, whether it is a drop, a tap or a key, with the same refusals, the same undo, the same draft kept on the device, and the same keep through the beach's voice.
- **Different:** only the drawing and the reading of where a drop lands.
- **Carries across:** what is shown, or being arranged, moves from one layout to the other.
- **Unchanged:** `/y-ray` draws the list exactly as before.

## 4. The law

`function:arrangement` 5 described a switch between two views. It now names three, says what a drop does in Cards, and says that List and Cards are one panel.

9 records the amendment. The standing text is at `archive:function:arrangement:2026-11-05`, checked identical, and only 5 and 9 changed.

## 5. Checked

Played on a local server standing in for Vercel's routing, at 1024px and at 375px.

**Drags on David's page**, kept as a draft on the device only:
- onto a card;
- beside a card at the top;
- from Not placed yet into a card two levels down;
- out to Not placed yet;
- reordering inside a card.

Each landed where the bar showed.

**The rest of the panel:**
- **Refusal:** the tenth at the top was refused, in red.
- **Undo, Put it away and picking the draft back up** all work, and so does the tap way.
- **Switching to List** mid-arrangement shows the same tree. List's keys and dragging still work.
- **Phone:** a touch drag at 375px works, with no sideways scroll at either width.
- **Themes:** light and dark both render.
- **Console:** no errors on the person's page, nor on `/y-ray`.
- **Sections:** still 14, 4 and 12 for David.

**Not written:** `arrangement:happyseaurchin`, whose last change is still 27 October.

**Not exercised:** Keep it as mine. It is the same call as List's, and was left alone so that nothing was written.

## 6. Where the lane stands

The three steps of the scope at `watch:weft` 832 are built:
1. `/proposal` in sections.
2. A person's page in Sections and List.
3. Cards.

The two earlier records now say they were merged.
