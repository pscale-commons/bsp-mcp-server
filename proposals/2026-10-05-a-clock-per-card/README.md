# A clock per card — several things at once, and seeing which are being done (2026-10-05)

**Status: built at David's word** (*"go ahead, build it"*), 2026-10-05, as
[happyseaurchin-home #372](https://github.com/happyseaurchin/happyseaurchin-home/pull/372) (branch
`claude/a-clock-per-card`, `9252480`). It waits on his review and merge. Lane cards.1, through Claude
Code, as weft; the record is at `watch:weft 543`.

The investigation read `next.html` in `happyseaurchin-home` at `24b98f5`. The prototype,
[`next.patch`](next.patch) (one file, +182 −53), was written against a copy of it and is what the PR
applies, byte for byte. [`check-clocks.cjs`](check-clocks.cjs) runs it in Chromium against a stubbed
beach: 42 checks across nine scenarios, all passing, on the PR branch too. The same file reproduces
the refusal against `main`.

While the proposal was being written, this session's container could not reach the beach: its egress
policy refuses beach.happyseaurchin.com, and the bsp-mcp connection had dropped. The account was
carried to the pile once the connection returned.

## 0. David's words

> I am starting to use cards to find out how useful they are. I use eg
> https://happyseaurchin.com/next/happyseaurchin?aim=now. The problem is, I do things simultaneously.
> So when I try hitting DOING on a second card in my /next deck hand, it returns me to the card timer
> that is currently counting down. So... can we have a separate timer for each card? And is there any
> way to indicate that a card is being done (is on a timer)?

## 1. What happens today, and why

**One clock.** `/next` keeps a single `TIMER` (`next.html:426`), stored on the device under
`next-timer:ahead:<handle>` (`:434–438`). `startDoing()` turns away a second card at `:1615`. It shows
the toast *already holding one — finish or release it first* and opens the first card's clock
([`0-before.png`](0-before.png)). That is the return David hits.

**The rule is a relic.** It came in with the do-now timer on 2026-07-29 (`938cc8d`), when `/next`
flicked the shared `spine:doing` field. Back then DOING was a public claim on shared work, and one claim
at a time was a shared field's discipline. The page is still titled *One thing at a time*. Since the
one-card law (`2026-08-26-the-one-card-and-the-sweep`), a card lives only in its holder's own hand.
DOING is now a state at field 4 of that card, one per card by construction. Nothing on the beach limits
a holder to one doing card:

- `/now` lists every card in state doing (`now.html:692`);
- `/hands` counts doing as in hand (`hands.html:312`);
- `/morning` and `/walk` tag each one *doing now*.

Only the page's single clock limits it.

**There is an indicator, but it was folded away.** The card face carries a small *▶ doing now ·
happyseaurchin* line, and the bar carried a chip with the running clock. Since 2026-08-21 (`f950737`),
`theme.js`'s `gatherActs()` moves every button in a page's bar behind *options ▾*, and the chip went
with them. Since then a running clock has had no sign anywhere except that small line on its own card,
which shows only when you flick to the card.

## 2. The recommendation — five changes, all in `next.html`

1. **A clock per card.** The store becomes a map keyed by the card's address, under the same
   localStorage key.
   - DOING on a card with no clock starts its own.
   - DOING on a card that has a clock goes back to it.
   - Every other clock keeps running. There is no auto-pause, because simultaneous means simultaneous:
     the washing's hour and the soup's hour are each an hour.
   - Pause, finish and release act on the card whose clock is in front of you.
2. **The card shows that it is being done.**
   - Its own clock ticks on its face: *▶ doing now · 12:34*, or *⏸ paused · 12:34*.
   - Its edge is lit in the clock's colour.
   - The DO NOW button says what it will do: *▶ back to it* on a card with a clock, *▶ do now* on one
     without.
   - A card the beach holds as doing, with no clock on this device (started on the phone, looked at on
     the laptop), is lit too. It says *since 14:05*, read from its own stamp at field 3.
3. **The clocks stand in a row under the bar while any runs.** The row is one line per running card,
   each with its time and words, and one tap opens that card's clock ([`1-the-deck.png`](1-the-deck.png)).
   It replaces the bar chip. Putting the chip back in the bar was tried first: at phone width it pushes
   *go ▾* off the screen.
4. **The doing view lists the other clocks**, under *also doing* beneath the clock in front, one tap to
   swap ([`2-the-doing-view.png`](2-the-doing-view.png)).
5. **A clock follows its card, and stops when the card leaves.**
   - **Dropped:** the clock goes.
   - **Thrown to tomorrow:** the clock stops, and the claim comes down to *held*, so the card stays in
     the hand but is no longer being done. Today such a card can land in tomorrow still marked doing,
     while its clock keeps pointing at the slot it left.
   - **Done already, tapped on a running card:** the elapsed is carried, as finish carries it.
   - **Closed on another device:** the clock is let go on the next load.
   - **Outside the `?aim=` cut:** a clock is looked up against the whole hand, so a clock started on
     the bare flick still finishes where its card aims when it is opened under `?aim=now`. Today the
     aim would be lost and the record would land in the now.
   - **Two open tabs:** they keep one set of clocks, through a `storage` listener.
   - **A damaged store** is passed over rather than taking the page down.
   - **The clock running at the deploy** survives it: the single clock this page kept before is
     lifted into the map.

## 3. What does not change

- **The beach is written exactly as it is now.**
  - The start writes field 4 `doing`, the same surgical write as today.
  - Finish lands the card where field 2 aims, with the elapsed at 6. `landCard` is untouched.
  - Release lifts `doing`.
  - A pause is not written. A claim is not a record (`2026-08-22-cards-the-hand-and-the-witness` §4),
    and a pause is even less of one.
- **No new block, field, state or law.** The states of `function:ahead` stand. `/now`, `/hands`,
  `/morning` and `/walk` already read doing per card and show several, so they are untouched.
- **The flick is unchanged.** One card is faced at a time, and the gestures are as they were.

## 4. Choices made, each the keeper's to overrule

- **No auto-pause.** Starting the soup does not pause the washing. A *one in focus* mode, where the
  others pause when one starts, is a few lines. It is worth deciding only after the parallel
  version has been used.
- **Tomorrow brings a claim down to *held*, not to standing,** so the card stays in the compiled hand.
- **Clocks stay per device.** A clock started on the phone shows on the laptop as *doing now · since
  14:05*, not as a running clock. A running clock could be seeded from the stamp at 3 in a few lines.
  This is left out on purpose: a claim left standing for days would then show a clock of days, and if
  finished it would record that as the elapsed.
- **Wording left alone because nobody asked about it:**
  - The doing view's *doing — claimed in the field*, from the shared-field era.
  - The page title, *One thing at a time*, which still describes the flick.
- **The lit edge does not help while flicking past a card.** It is drawn on the cards stacked behind
  the top one too, but they sit fully hidden behind it. So the row is what shows which cards are being
  done without flicking to them.

## 5. The evidence

- **Patch.** [`next.patch`](next.patch) is against `happyseaurchin-home` `next.html` at `24b98f5`.
- **How the check runs.** [`check-clocks.cjs`](check-clocks.cjs) uses Playwright with Chromium.
  - The page is served at its real origin by routing, so localStorage behaves as it does live.
  - Every beach request is answered from an in-memory store that follows the wire's write rules: an
    object replaces a node, a string merges into an occupied underscore, and digit 0 is the underscore.
- **Before the change.** `--before` reproduces the refusal against the page as it stands: 2 checks.
- **After the change.** Against the patched page, nine scenarios and 42 checks, all passing:
  - **A.** Two clocks at once, with both claims written; the row and the strip; pausing one alone;
    finish landing in the now at the beat with the elapsed at 6; the slot freed; reload persistence.
  - **B.** A drop.
  - **C.** A throw to tomorrow.
  - **D.** A clock on a card outside the `?aim=` cut.
  - **E.** The old single clock surviving.
  - **F.** A clock closed elsewhere being let go, and the *since* line.
  - **G.** Done already carrying the clock.
  - **H.** Two tabs.
  - **I.** A damaged store.
- **Not covered:**
  - The real beach. It was stubbed, because this container cannot reach it.
  - Real fonts. Google Fonts was refused, so the screenshots use fallback fonts.
  - iOS Safari.

## 6. To build

On the keeper's word:

1. Open one PR in `happyseaurchin-home` applying `next.patch`. The session that opens it needs push
   access there, which this one did not have.
2. Check it against the live beach with David's own hand: start two cards on `?aim=now`, finish one,
   and see it land in `now:happyseaurchin` with its elapsed.
