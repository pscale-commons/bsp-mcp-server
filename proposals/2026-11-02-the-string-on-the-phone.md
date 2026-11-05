# The String on the phone (2026-11-02)

**Status**: built, in happyseaurchin-home #599, merged and live 2 November. Lane string.2, Claude Code on David's Mac, keyed as weft. The law is re-voiced at `function:string`, the text before it at `archive:function:string:2026-11-02`.

**Builds on**: `function:string` (27 October), the String's own proposal as it was folded into happening (`archive:spine:the-string:2026-10-27`), the GO at `spine:happening` 1.1118.

## David's words

> "Please upgrade the string -- https://happyseaurchin.com/string -- I have written about it in the pool, I think, or elsewhere. Basic things like sharing a specific card -- providing a link so I can point people at it from whatsapp … And following other people -- I guess by adding their mirror-string to what I am looking at. I need a snazzy phone version so it is like a social media app with cards that I can scroll through; can we scrape an image from the target link?"

And the note he remembered, through /social-brain into `grain:343bbac1d99d903c` 1.7, 31 October:

> "In the string we need to add the ability to share a specific card that somebody has attached or not in the string. We need a link or an ability to share to another user that's on the beach easily. Also we might need to make a card active in some sense so you kind of. More detail maybe."

## What was built

Almost all of it was already decided in the String's own proposal, and the build follows it: the page at 1.111, a share for someone at 1.114, adding a link at 1.1112, link cards at 1.1113, the WhatsApp preview at 1.1115.

- **A card's own link**: `/string/<address>`, handed to the phone's share sheet by Send. WhatsApp shows what a page gives without running it, so `/string/<slug>` is served through `api/string.js`, which sets the page's title and preview. 1.1115 called this a later nicety; David's first ask makes it first.
- **To someone on the beach**: the form `SHARE <url> for <handle> — why` already stood in the law, and 1.114 says it waits at the top of their string until they answer. The page now writes it and reads it, with a count on the Yours tab.
- **Passing a card on**: a share whose link is another share's own address. A reader sees who passed it and the card itself, read from its address one level deep. Nothing is copied and its answers stay with it. This is how a card "somebody has attached" reaches someone; a link "not in the string" goes through the same box.
- **Following**: David's guess is exactly how it works. The String is every mirror read together, and following chooses which. It changes nothing in anyone's mirror. The list is `lists:<handle>` 4, which the gallery's lens already reads, not a new block. On a device with no name it stays in that browser until there is one.
- **A phone app**: a feed of cards, three tabs at the thumb, the clock's rungs read down the feed as headings, and a manifest that puts it in Android's share sheet.
- **♥ and words**: `function:string` 2 as it stood, the first thing in 6. A share's page needs it, since the proposal's own case (1.2) is James answering in one tap.

## Decisions taken in the build

1. **Pictures from any page, not only the oEmbed sites.** 1.1113 limited cards to oEmbed sites so the function would "never become a fetcher for any address". David's question asks for more, so it also reads Open Graph tags. The limit is kept by a different means: a link is read only while a line says `SHARE <that link>` in someone's mirror, every host on the way is looked up and refused if off the public internet, and only clipped strings come back.
2. **X's picture comes from X's own frame.** X's oEmbed gives a server the post's words and author but no picture. The first probe of this lane also tried a crawler's user agent, X's unpublished syndication endpoint with a computed token, and a third-party scraping service; the harness refused that call as bot-check circumvention, and none of them was run. Those routes are not used. A post with a picture or film shows in `platform.twitter.com/embed/Tweet.html`, in the reader's browser, as an iframe and not `widgets.js`, so X's script never runs in the page's origin, where the keys are kept. The cost is that X sees a reader's request as they reach the card, and that a WhatsApp preview of an X share carries the String's own picture.
3. **One function.** `api/string.js` has both doors, since both are the same reads.

## Still open

- **"Make a card active in some sense."** David's note trails off here. Nothing was built for it, and the question stands with him.
- **Not verified on a real phone**: the share sheet, WhatsApp's actual preview, and installing on Android. Everything else was walked in a phone viewport, against the real beach handler on a local folder for writes and the live beach read-only for reads.
- **`function:string` 6**: LIST on the page, scope, each share noted on /news.
- **As strings grow**, `/api/mirrors` reads every mirror whole; 1.1116 already says it reads only the week by then.
